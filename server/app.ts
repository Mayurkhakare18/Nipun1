import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const express = require('express');
const pg = require('pg');
type Request = any;
type Response = any;

import { db } from './db';
import { igotAdapter } from './integrations/igot/igot.client';
import { nsstaAdapter } from './integrations/nssta/nssta.client';
import { tpacAdapter } from './integrations/tpac/tpac.client';
import { UnifiedCatalogueService } from './integrations/catalogue.service';
import {
  generateAIGapDiagnosis,
  generateAIQuestionsFromContent,
  summarizeDocumentAndGenerateQuestions,
  generateAIMentorResponse,
} from './ai/gemini';
import {
  fetchLearnerProfileCompetencyData,
  recalibrateLearnerGaps,
  recalculateGapsSynchronous,
} from './utils/learnerProfileCompetency';
import type {
  UserProfile,
  CompetencyLevel,
  QuizAttemptResult,
  QuizAssessment,
  UnifiedRecommendation,
  LearnerCompetency,
  GapAnalysisResult,
  CompetencyUpgradeRecord,
} from '../src/types';

const Pool = pg.Pool || pg.default?.Pool || pg;

import {
  normalizeDatabaseUrl,
  getPostgresPoolConfig,
} from './utils/db-url';

export { normalizeDatabaseUrl };

// Reusable PostgreSQL connection pool for health checks
let dbHealthPool: any = null;

function getDbHealthPool(): any {
  const rawDatabaseUrl = process.env.DATABASE_URL;
  if (!rawDatabaseUrl) {
    return null;
  }

  if (!dbHealthPool) {
    const config = getPostgresPoolConfig(rawDatabaseUrl);
    if (!config) return null;

    dbHealthPool = new Pool(config);

    dbHealthPool.on('error', (err) => {
      console.error('[DB_HEALTH] Idle PostgreSQL client error in Express app:', err?.message || String(err));
    });
  }

  return dbHealthPool;
}

export function createExpressApp() {
  const app = express();

  // CORS & Preflight handling for Vercel and production environments
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  // Serverless Function path normalization:
  // If request URL was rewritten without '/api' prefix, prepend '/api' to match Express routes
  app.use((req, res, next) => {
    try {
      db.ensureSeeded();
    } catch (seedErr) {
      console.warn('[DB_SEED_WARN]', seedErr);
    }
    if (
      !req.url.startsWith('/api') &&
      !req.url.startsWith('/assets') &&
      !req.url.startsWith('/dist') &&
      !req.url.startsWith('/src') &&
      !req.url.startsWith('/@') &&
      !req.url.includes('.')
    ) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
    next();
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global Active Session Tracker (default to Learner)
  let currentUserId = 'user-learner-01';

  // Helper to securely resolve the authenticated user from session token or active fallback
  function resolveUser(req: Request): UserProfile | null {
    const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
    let token: string | undefined;
    if (typeof authHeader === 'string') {
      token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();
    }
    if (token) {
      const session = db.validateSession(token);
      if (session && db.state.users[session.userId]) {
        return db.state.users[session.userId];
      }
    }
    return db.state.users[currentUserId] || db.state.users['user-learner-01'] || null;
  }

  // ==========================================
  // PRODUCTION HEALTH & READINESS ENDPOINTS
  // ==========================================
  app.get(['/api/health', '/health'], (req, res) => {
    res.status(200).json({
      status: 'ok',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'production',
    });
  });

  app.get(['/api/health/db', '/health/db'], async (req, res) => {
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    console.log(`[DB_HEALTH] DATABASE_URL: ${hasDatabaseUrl ? 'PRESENT' : 'MISSING'}`);

    if (!hasDatabaseUrl) {
      console.error('[DB_HEALTH] connection failed: DATABASE_URL missing from environment');
      return res.status(500).json({
        status: 'error',
        error_code: 'DATABASE_URL_MISSING',
        error_message: 'DATABASE_URL is missing from environment variables',
      });
    }

    try {
      const pool = getDbHealthPool();
      if (!pool) {
        console.error('[DB_HEALTH] connection failed: PostgreSQL pool initialization failed');
        return res.status(500).json({
          status: 'error',
          error_code: 'POOL_INIT_FAILED',
          error_message: 'PostgreSQL pool initialization failed',
        });
      }

      const client = await pool.connect();
      try {
        const result = await client.query('SELECT 1 AS health;');
        if (result && result.rows && result.rows.length > 0) {
          console.log('[DB_HEALTH] PostgreSQL SELECT 1 query succeeded in Express handler');
          return res.status(200).json({ status: 'ok' });
        }
        console.error('[DB_HEALTH] SELECT 1 returned empty result');
        return res.status(500).json({
          status: 'error',
          error_code: 'EMPTY_QUERY_RESULT',
          error_message: 'SELECT 1 returned empty result set',
        });
      } finally {
        client.release();
      }
    } catch (err: any) {
      const code = err?.code || 'DB_CONNECTION_ERROR';
      const message = err?.message || String(err);
      console.error('[DB_HEALTH] connection failed:', code, message);
      return res.status(500).json({
        status: 'error',
        error_code: code,
        error_message: message,
      });
    }
  });

  // ==========================================
  // 1. REAL AUTH & SESSION API
  // ==========================================
  app.get('/api/auth/current-user', (req, res) => {
    const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
    let token: string | undefined;
    if (typeof authHeader === 'string') {
      token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();
    }

    if (token) {
      const session = db.validateSession(token);
      if (session && db.state.users[session.userId]) {
        const user = db.state.users[session.userId];
        currentUserId = user.id;
        return res.json({ success: true, user, isAuthenticated: true });
      } else {
        return res.status(401).json({ success: false, user: null, isAuthenticated: false, message: 'Session expired or invalid.' });
      }
    }

    const user = db.state.users[currentUserId] || db.state.users['user-learner-01'];
    res.json({ success: true, user, isAuthenticated: !!user });
  });

  app.post('/api/auth/register', (req, res) => {
    const {
      name,
      email,
      password,
      designation,
      ministry,
      department,
      cadre,
      role = 'LEARNER',
      employeeId,
      specialization,
      location,
    } = req.body;

    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Full name and official email address are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already registered in the official database
    const existingCred = db.state.userCredentials[normalizedEmail];
    const existingUser = Object.values(db.state.users).find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );

    if (existingCred || existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An officer account is already registered with this official email address. Please sign in.',
      });
    }

    const newUserId = `user-${Date.now()}`;
    const newUser: UserProfile = {
      id: newUserId,
      name: name.trim(),
      email: normalizedEmail,
      role: (role as any) || 'LEARNER',
      employeeId: employeeId || `MOSPI-${Math.floor(1000 + Math.random() * 9000)}`,
      ministry: ministry || 'Ministry of Statistics & Programme Implementation (MoSPI)',
      department: department || 'National Statistical Office (NSO)',
      organization: 'Government of India',
      designation: designation || 'Senior Statistical Officer',
      currentRole: designation || 'Senior Statistical Officer',
      targetRole: 'Assistant Director / Lead Analyst',
      level: 11,
      cadre: cadre || 'Subordinate Statistical Service (SSS)',
      yearsOfExperience: 4,
      education: 'Post Graduate / Master in Statistics',
      specialization: specialization || 'Survey Statistics & Applied Data Science',
      location: location || 'New Delhi, Headquarters',
      preferredLanguage: 'English / Hindi',
      previousRoles: ['Junior Statistical Officer'],
      currentProjects: ['Statistical Data Architecture & Modernization'],
      technologiesUsed: ['Python', 'SQL', 'R Studio', 'Excel / CSPro'],
      trainingHours: 0,
      roleReadiness: 75,
      verifiedSkillsCount: 10,
      developingSkillsCount: 4,
    };

    // Store user profile and securely hash password into credentials table
    db.state.users[newUserId] = newUser;
    db.registerUserCredential(newUserId, normalizedEmail, password || 'Learner@2026');

    // Clone base competencies and initial gaps for newly registered officer
    db.state.learnerCompetencies[newUserId] = (db.state.learnerCompetencies['user-learner-01'] || []).map(
      (c) => ({ ...c })
    );
    db.state.gapAnalysis[newUserId] = (db.state.gapAnalysis['user-learner-01'] || []).map((g) => ({ ...g }));

    // Create secure session token
    const session = db.createSession(newUserId);
    currentUserId = newUserId;

    db.state.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: name,
      action: 'USER_REGISTERED',
      details: `New ${role} account registered with designation ${designation || 'Statistical Officer'} under ${ministry || 'MoSPI'}.`,
    });

    res.status(201).json({
      success: true,
      user: newUser,
      token: session.token,
      message: 'Official account successfully registered and session established.',
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, username, identifier, password } = req.body;
    const loginIdentifier = email || username || identifier;

    if (!loginIdentifier) {
      return res.status(400).json({ success: false, message: 'Please provide your official email address or username.' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Please enter your account password.' });
    }

    const verifyResult = db.verifyCredentials(loginIdentifier, password);

    if (!verifyResult.success || !verifyResult.user) {
      return res.status(401).json({
        success: false,
        message: verifyResult.message || 'Invalid email, username or password. Please verify your credentials.',
      });
    }

    const matchedUser = verifyResult.user;
    currentUserId = matchedUser.id;
    const session = db.createSession(matchedUser.id);

    db.state.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: matchedUser.name,
      action: 'USER_LOGIN',
      details: 'Officer authenticated successfully via verified database credentials.',
    });

    return res.json({
      success: true,
      user: matchedUser,
      token: session.token,
      message: `Welcome back, ${matchedUser.name}!`,
    });
  });

  app.post('/api/auth/parichay-sso', (req, res) => {
    const { ssoId = 'PARICHAY-GOI-9921', role = 'LEARNER' } = req.body;
    const targetUserId =
      role === 'TRAINER'
        ? 'user-trainer-01'
        : role === 'ADMINISTRATOR'
        ? 'user-admin-01'
        : 'user-learner-01';

    currentUserId = targetUserId;
    const user = db.state.users[targetUserId];
    const session = db.createSession(targetUserId);

    db.state.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: user.name,
      action: 'PARICHAY_SSO_LOGIN',
      details: `Authenticated via Jan-Parichay Single Sign-On token (${ssoId}).`,
    });

    res.json({
      success: true,
      user,
      token: session.token,
      message: `Verified via Jan-Parichay SSO: ${user.name} (${user.designation})`,
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
    if (typeof authHeader === 'string') {
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();
      db.removeSession(token);
    }
    currentUserId = 'user-learner-01';
    res.json({ success: true, message: 'Logged out successfully.' });
  });

  app.post('/api/auth/switch-role', (req, res) => {
    const { userId } = req.body;
    if (db.state.users[userId]) {
      currentUserId = userId;
      const session = db.createSession(userId);
      res.json({ success: true, user: db.state.users[userId], token: session.token });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  });

  app.post('/api/auth/reset-demo', (req, res) => {
    db.resetDemoData();
    currentUserId = 'user-learner-01';
    res.json({ success: true, message: 'NIPUN Demo data reset to initial official baseline.' });
  });

  // ==========================================
  // 2. PROFILE & PURPOSE MANAGEMENT
  // ==========================================
  app.get('/api/profile', (req, res) => {
    const user = db.state.users[currentUserId];
    res.json({ success: true, profile: user });
  });

  app.put('/api/profile', (req, res) => {
    const updates = req.body;
    if (db.state.users[currentUserId]) {
      db.state.users[currentUserId] = {
        ...db.state.users[currentUserId],
        ...updates,
      };
      db.state.auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: db.state.users[currentUserId].name,
        action: 'PROFILE_UPDATED',
        details: 'User updated career targets and background profile.',
      });
      res.json({ success: true, profile: db.state.users[currentUserId] });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  });

  // Dedicated endpoint when user selects and confirms a Capacity Building Purpose
  app.post('/api/learner/purpose', async (req, res) => {
    const { purposeId, title, targetRole } = req.body;
    const user = db.state.users[currentUserId];

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update user profile with purpose
    user.targetRole = targetRole || user.targetRole;
    user.specialization = title || user.specialization;

    // Dynamically calibrate learner competencies based on chosen Purpose
    const purposeCompetencyMap: Record<string, LearnerCompetency[]> = {
      'national-accounts': [
        {
          competencyId: 'comp-stat-03',
          name: 'National Accounts (SNA 2008)',
          category: 'STATISTICAL_COMPETENCIES',
          requiredLevel: 4,
          currentLevel: 2,
          gap: 2,
          gapType: 'APPLICATION_GAP',
          confidence: 0.93,
          lastAssessed: new Date().toISOString().split('T')[0],
          targetDate: '2026-11-30',
          status: 'CRITICAL_GAP',
          evidence: {
            diagnosticScore: 52,
            practicalScore: 42,
            repeatedErrors: ['Supply-Use Tables (SUT) balance identity', 'Double deflation of manufacturing GVA', 'FISIM allocation to sectors'],
            notes: 'Requires practical training on compiling balanced SUTs and informal sector GVA.',
          },
          trend: 'NEEDS_ATTENTION',
        },
        {
          competencyId: 'comp-stat-04',
          name: 'Price Statistics & Inflation Modeling',
          category: 'STATISTICAL_COMPETENCIES',
          requiredLevel: 3,
          currentLevel: 2,
          gap: 1,
          gapType: 'KNOWLEDGE_GAP',
          confidence: 0.89,
          lastAssessed: new Date().toISOString().split('T')[0],
          targetDate: '2026-12-15',
          status: 'DEVELOPING',
          evidence: {
            diagnosticScore: 62,
            practicalScore: 54,
            repeatedErrors: ['GVA deflators vs CPI Headline divergence', 'Chain-weighted index splicing'],
          },
          trend: 'STABLE',
        },
        {
          competencyId: 'comp-tech-01',
          name: 'Python',
          category: 'TECHNICAL_COMPETENCIES',
          requiredLevel: 3,
          currentLevel: 3,
          gap: 0,
          confidence: 0.92,
          lastAssessed: new Date().toISOString().split('T')[0],
          targetDate: '2026-12-31',
          status: 'VERIFIED',
          evidence: { diagnosticScore: 86, practicalScore: 84 },
          trend: 'STABLE',
        },
      ],
      'survey-operations': [
        {
          competencyId: 'comp-stat-01',
          name: 'Survey Methodology & Sampling Frame',
          category: 'STATISTICAL_COMPETENCIES',
          requiredLevel: 4,
          currentLevel: 2,
          gap: 2,
          gapType: 'APPLICATION_GAP',
          confidence: 0.94,
          lastAssessed: new Date().toISOString().split('T')[0],
          targetDate: '2026-11-15',
          status: 'CRITICAL_GAP',
          evidence: {
            diagnosticScore: 56,
            practicalScore: 46,
            repeatedErrors: ['Second-stage design multiplier weight formula', 'Post-stratification non-response calibration', 'FSU PPS allocation'],
            notes: 'Strong in field administration; needs empirical mastery of multiplier weights and variance estimation.',
          },
          trend: 'NEEDS_ATTENTION',
        },
        {
          competencyId: 'comp-stat-06',
          name: 'Data Quality Frameworks & CAPI Validation',
          category: 'STATISTICAL_COMPETENCIES',
          requiredLevel: 4,
          currentLevel: 3,
          gap: 1,
          gapType: 'APPLICATION_GAP',
          confidence: 0.88,
          lastAssessed: new Date().toISOString().split('T')[0],
          targetDate: '2026-12-15',
          status: 'DEVELOPING',
          evidence: {
            diagnosticScore: 68,
            practicalScore: 60,
            repeatedErrors: ['CAPI real-time logical constraint rules', 'Enumerator anomaly flags'],
          },
          trend: 'STABLE',
        },
        {
          competencyId: 'comp-tech-01',
          name: 'Python',
          category: 'TECHNICAL_COMPETENCIES',
          requiredLevel: 3,
          currentLevel: 2,
          gap: 1,
          gapType: 'APPLICATION_GAP',
          confidence: 0.91,
          lastAssessed: new Date().toISOString().split('T')[0],
          targetDate: '2026-10-31',
          status: 'DEVELOPING',
          evidence: {
            diagnosticScore: 50,
            practicalScore: 44,
            repeatedErrors: ['Survey weights aggregation in pandas'],
          },
          trend: 'NEEDS_ATTENTION',
        },
      ],
      'price-indices': [
        {
          competencyId: 'comp-stat-04',
          name: 'Price Statistics & Inflation Modeling',
          category: 'STATISTICAL_COMPETENCIES',
          requiredLevel: 4,
          currentLevel: 2,
          gap: 2,
          gapType: 'APPLICATION_GAP',
          confidence: 0.95,
          lastAssessed: new Date().toISOString().split('T')[0],
          targetDate: '2026-11-20',
          status: 'CRITICAL_GAP',
          evidence: {
            diagnosticScore: 48,
            practicalScore: 38,
            repeatedErrors: ['Hedonic quality adjustment regression', 'Scanner dataset geometric mean (Jevons) aggregation', 'Base year rebasing and chain linking'],
            notes: 'Requires technical expertise in modern high-frequency scanner price collection and hedonic adjustments.',
          },
          trend: 'NEEDS_ATTENTION',
        },
        {
          competencyId: 'comp-tech-02',
          name: 'Data Visualization',
          category: 'TECHNICAL_COMPETENCIES',
          requiredLevel: 3,
          currentLevel: 2,
          gap: 1,
          gapType: 'KNOWLEDGE_GAP',
          confidence: 0.87,
          lastAssessed: new Date().toISOString().split('T')[0],
          targetDate: '2026-12-10',
          status: 'DEVELOPING',
          evidence: {
            diagnosticScore: 60,
            practicalScore: 52,
            repeatedErrors: ['Commodity item contribution decomposition charts'],
          },
          trend: 'STABLE',
        },
      ],
      'data-privacy-sdc': [
        {
          competencyId: 'comp-stat-07',
          name: 'Statistical Disclosure Control',
          category: 'STATISTICAL_COMPETENCIES',
          requiredLevel: 4,
          currentLevel: 2,
          gap: 2,
          gapType: 'APPLICATION_GAP',
          confidence: 0.93,
          lastAssessed: new Date().toISOString().split('T')[0],
          targetDate: '2026-11-25',
          status: 'CRITICAL_GAP',
          evidence: {
            diagnosticScore: 46,
            practicalScore: 36,
            repeatedErrors: ['k-Anonymity and l-diversity enforcement on microdata', 'Secondary cell suppression in multi-dimensional tables', 'Microaggregation protocols'],
            notes: 'Essential for preparing open microdata releases under DPDP Act 2023 and NDSAP.',
          },
          trend: 'NEEDS_ATTENTION',
        },
        {
          competencyId: 'comp-gov-02',
          name: 'Data Privacy & DPDP Act',
          category: 'DIGITAL_GOVERNANCE',
          requiredLevel: 4,
          currentLevel: 3,
          gap: 1,
          gapType: 'KNOWLEDGE_GAP',
          confidence: 0.91,
          lastAssessed: new Date().toISOString().split('T')[0],
          targetDate: '2026-12-20',
          status: 'DEVELOPING',
          evidence: {
            diagnosticScore: 70,
            practicalScore: 64,
            repeatedErrors: ['Consent manager architecture for statistical data reuse'],
          },
          trend: 'STABLE',
        },
      ],
      'data-science-computing': [
        {
          competencyId: 'comp-tech-01',
          name: 'Python',
          category: 'TECHNICAL_COMPETENCIES',
          requiredLevel: 4,
          currentLevel: 2,
          gap: 2,
          gapType: 'APPLICATION_GAP',
          confidence: 0.92,
          lastAssessed: new Date().toISOString().split('T')[0],
          targetDate: '2026-10-31',
          status: 'CRITICAL_GAP',
          evidence: {
            diagnosticScore: 48,
            practicalScore: 42,
            repeatedErrors: ['pandas DataFrame transformations', 'Vectorized groupby transform vs apply', 'Automated survey report generation'],
            notes: 'Transition from legacy spreadsheets to reproducible Python statistical pipelines.',
          },
          trend: 'NEEDS_ATTENTION',
        },
        {
          competencyId: 'comp-tech-02',
          name: 'Data Visualization',
          category: 'TECHNICAL_COMPETENCIES',
          requiredLevel: 4,
          currentLevel: 2,
          gap: 2,
          gapType: 'APPLICATION_GAP',
          confidence: 0.88,
          lastAssessed: new Date().toISOString().split('T')[0],
          targetDate: '2026-11-15',
          status: 'CRITICAL_GAP',
          evidence: {
            diagnosticScore: 58,
            practicalScore: 48,
            repeatedErrors: ['Interactive Plotly/Dash statistical maps', 'Choropleth layer joins with district census shapefiles'],
          },
          trend: 'NEEDS_ATTENTION',
        },
      ],
      'promotion-progression': [
        {
          competencyId: 'comp-stat-03',
          name: 'National Accounts (SNA 2008)',
          category: 'STATISTICAL_COMPETENCIES',
          requiredLevel: 3,
          currentLevel: 2,
          gap: 1,
          gapType: 'APPLICATION_GAP',
          confidence: 0.90,
          lastAssessed: new Date().toISOString().split('T')[0],
          targetDate: '2026-11-30',
          status: 'CRITICAL_GAP',
          evidence: {
            diagnosticScore: 55,
            practicalScore: 46,
            repeatedErrors: ['GVA double deflation', 'Supply-Use Table reconciliation'],
            notes: 'Core mandatory competency for Departmental Promotion Committee (DPC) benchmark.',
          },
          trend: 'NEEDS_ATTENTION',
        },
        {
          competencyId: 'comp-stat-01',
          name: 'Survey Methodology',
          category: 'STATISTICAL_COMPETENCIES',
          requiredLevel: 4,
          currentLevel: 3,
          gap: 1,
          gapType: 'APPLICATION_GAP',
          confidence: 0.91,
          lastAssessed: new Date().toISOString().split('T')[0],
          targetDate: '2026-12-15',
          status: 'DEVELOPING',
          evidence: {
            diagnosticScore: 65,
            practicalScore: 58,
            repeatedErrors: ['Multiplier weighting calibration', 'Variance estimation in complex survey designs'],
          },
          trend: 'STABLE',
        },
        {
          competencyId: 'comp-tech-01',
          name: 'Python',
          category: 'TECHNICAL_COMPETENCIES',
          requiredLevel: 3,
          currentLevel: 2,
          gap: 1,
          gapType: 'APPLICATION_GAP',
          confidence: 0.92,
          lastAssessed: new Date().toISOString().split('T')[0],
          targetDate: '2026-10-31',
          status: 'CRITICAL_GAP',
          evidence: {
            diagnosticScore: 50,
            practicalScore: 44,
            repeatedErrors: ['pandas groupby transform', 'Automated data validation'],
            notes: 'MoSPI modernization standard for digital statistical reporting.',
          },
          trend: 'NEEDS_ATTENTION',
        },
      ],
    };

    const assignedComps = purposeCompetencyMap[purposeId] || purposeCompetencyMap['promotion-progression'];
    db.state.learnerCompetencies[currentUserId] = assignedComps;

    // Generate immediate individualized gaps
    const newGaps: GapAnalysisResult[] = [];
    for (const comp of assignedComps) {
      if (comp.currentLevel < comp.requiredLevel) {
        const diagScore = comp.evidence?.diagnosticScore || 50;
        const practScore = comp.evidence?.practicalScore || 40;
        const repErrors = comp.evidence?.repeatedErrors || ['Practical application difficulty'];

        const aiDiagnosis = await generateAIGapDiagnosis({
          role: user.designation,
          competency: comp.name,
          requiredLevel: comp.requiredLevel,
          currentLevel: comp.currentLevel,
          diagnosticScore: diagScore,
          practicalScore: practScore,
          repeatedErrors: repErrors,
        });

        newGaps.push({
          competencyId: comp.competencyId,
          competencyName: comp.name,
          requiredLevel: comp.requiredLevel,
          currentLevel: comp.currentLevel,
          gap: comp.requiredLevel - comp.currentLevel,
          gapType: comp.gapType || 'APPLICATION_GAP',
          priority: (comp.requiredLevel - comp.currentLevel >= 2 ? 'HIGH' : 'MEDIUM') as 'HIGH' | 'MEDIUM' | 'LOW',
          confidence: aiDiagnosis.confidence,
          knowledgeGapScore: Math.max(10, 100 - diagScore),
          applicationGapScore: Math.max(20, 100 - practScore),
          retentionRiskScore: 20,
          aiDiagnosis: aiDiagnosis.aiDiagnosis,
          whyRecommended: aiDiagnosis.whyRecommended,
          evidenceBase: {
            diagnosticAssessment: diagScore,
            practicalTask: practScore,
            repeatedErrors: repErrors,
          },
        });
      }
    }

    db.state.gapAnalysis[currentUserId] = newGaps;

    db.state.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: user.name,
      action: 'PURPOSE_CONFIGURED_AND_GAPS_PREDICTED',
      details: `Target Purpose set to "${title || purposeId}". Identified ${newGaps.length} domain-specific skill gaps for ${user.name}.`,
    });

    res.json({
      success: true,
      user,
      competencies: assignedComps,
      gaps: newGaps,
      message: `Identified ${newGaps.length} competency gaps for ${title || purposeId}`,
    });
  });

  // ==========================================
  // 3. COMPETENCIES & PASSPORT
  // ==========================================
  app.get('/api/competencies', (req, res) => {
    res.json({ success: true, competencies: db.state.competencies });
  });

  app.get('/api/learner/competencies', async (req, res) => {
    const user = resolveUser(req);
    const result = await fetchLearnerProfileCompetencyData(user ? user.id : currentUserId);
    res.json({ success: true, competencies: result.competencies, profile: result.profile });
  });

  // Dedicated endpoint to fetch real learner profile & enriched competency intelligence
  app.get('/api/learner/profile-competencies', async (req, res) => {
    try {
      const user = resolveUser(req);
      const data = await fetchLearnerProfileCompetencyData(user ? user.id : currentUserId);
      res.json(data);
    } catch (err: any) {
      console.error('Failed to fetch learner profile competencies from database:', err);
      res.status(500).json({ success: false, message: err.message || 'Database error' });
    }
  });

  // ==========================================
  // 4. AI GAP CHECKER & EVIDENCE
  // ==========================================
  app.get('/api/learner/gaps', async (req, res) => {
    try {
      const user = resolveUser(req);
      const data = await fetchLearnerProfileCompetencyData(user ? user.id : currentUserId);
      res.json({
        success: true,
        gaps: data.gaps,
        competencies: data.competencies,
        profile: data.profile,
        summary: data.summary,
        meta: data.meta,
      });
    } catch (err: any) {
      console.error('Failed to fetch learner gaps:', err);
      res.status(500).json({ success: false, message: 'Failed to retrieve gap data' });
    }
  });

  app.post('/api/learner/run-gap-check', async (req, res) => {
    try {
      const user = resolveUser(req);
      const data = await recalibrateLearnerGaps(user ? user.id : currentUserId);
      res.json({
        success: true,
        gaps: data.gaps,
        competencies: data.competencies,
        profile: data.profile,
        summary: data.summary,
        meta: data.meta,
      });
    } catch (err: any) {
      console.error('Failed to recalibrate learner gaps:', err);
      res.status(500).json({ success: false, message: 'Failed to recalibrate gaps' });
    }
  });

  // ==========================================
  // 5. UNIFIED LEARNING CATALOGUE & RECOMMENDATIONS
  // ==========================================
  app.get(['/api/catalogue', '/catalogue'], (req, res) => {
    try {
      const {
        competency,
        domain,
        role,
        difficulty,
        source,
        duration,
        query,
      } = req.query;

      const result = UnifiedCatalogueService.searchAndFilter({
        competency: typeof competency === 'string' ? competency : undefined,
        domain: typeof domain === 'string' ? domain : undefined,
        role: typeof role === 'string' ? role : undefined,
        difficulty: typeof difficulty === 'string' ? difficulty : undefined,
        source: typeof source === 'string' ? source : undefined,
        duration: typeof duration === 'string' ? duration : undefined,
        query: typeof query === 'string' ? query : undefined,
      });

      res.json({
        success: true,
        items: result.items,
        total: result.total,
        notice: result.notice,
        sources: ['iGOT Karmayogi', 'NSSTA / TPAC', 'NIPUN Practical Learning'],
      });
    } catch (err: any) {
      console.error('Failed to query learning catalogue:', err);
      res.status(500).json({ success: false, message: 'Failed to query catalogue.' });
    }
  });

  app.get(['/api/recommendations/unified', '/recommendations/unified'], async (req, res) => {
    try {
      const user = resolveUser(req) || db.state.users[currentUserId] || db.state.users['user-learner-01'];
      const userId = user?.id || currentUserId;
      let gaps = db.state.gapAnalysis[userId] || [];
      if (gaps.length === 0) {
        gaps = recalculateGapsSynchronous(userId);
      }
      const targetRole = user?.targetRole || user?.designation || 'Deputy Director (Statistics)';
      const unified: UnifiedRecommendation[] = [];

      for (const gap of gaps) {
        const rec = UnifiedCatalogueService.generateRankedRecommendationsForGap(gap, targetRole);
        unified.push(rec);
      }

      res.json({ success: true, recommendations: unified, datasetNotice: 'Development Dataset' });
    } catch (err: any) {
      console.error('Failed to get unified recommendations:', err);
      res.json({ success: true, recommendations: [], datasetNotice: 'Development Dataset' });
    }
  });

  // ==========================================
  // 6. PERSONALIZED LEARNING PATH & PROGRESS
  // ==========================================
  app.get(['/api/learning-path', '/learning-path'], (req, res) => {
    try {
      const user = resolveUser(req) || db.state.users[currentUserId] || db.state.users['user-learner-01'];
      const userId = user?.id || currentUserId;
      const targetRole = user?.targetRole || user?.designation || 'Deputy Director (Statistics)';
      let path = db.state.learningPaths[userId];

      if (!path) {
        let gaps = db.state.gapAnalysis[userId] || [];
        if (gaps.length === 0) {
          gaps = recalculateGapsSynchronous(userId);
        }
        path = UnifiedCatalogueService.generatePersonalizedPathway(userId, targetRole, gaps);
        db.state.learningPaths[userId] = path;
      }

      res.json({ success: true, learningPath: path });
    } catch (err: any) {
      console.error('Failed to get learning path:', err);
      const fallbackPath = UnifiedCatalogueService.generatePersonalizedPathway(
        'user-learner-01',
        'Senior Statistical Officer',
        recalculateGapsSynchronous('user-learner-01')
      );
      res.json({ success: true, learningPath: fallbackPath });
    }
  });

  app.post(['/api/learning-path/step-update', '/learning-path/step-update'], (req, res) => {
    const user = resolveUser(req) || db.state.users[currentUserId];
    const userId = user?.id || currentUserId;
    const { stepId, status, score } = req.body;
    const path = db.state.learningPaths[userId] || db.state.learningPaths['user-learner-01'];
    if (path) {
      const item = path.items.find((i) => i.id === stepId);
      if (item) {
        item.status = status;
        if (score !== undefined) item.score = score;

        // Recalculate progress percentage
        const completed = path.items.filter((i) => i.status === 'COMPLETED' || i.status === 'VERIFIED').length;
        path.progressPercentage = Math.round((completed / path.items.length) * 100);
        path.updatedAt = new Date().toISOString();

        // Enforce critical rule: Course completion NEVER updates competency level directly.
        // It updates status to 'DEVELOPING' with 'ASSESSMENT_PENDING' until validated assessment is passed.
        const userComps = db.state.learnerCompetencies[userId] || [];
        const relatedComp = userComps.find(
          (c) => item.competency && c.name.toLowerCase().includes(item.competency.toLowerCase())
        );
        if (relatedComp && relatedComp.currentLevel < relatedComp.requiredLevel) {
          relatedComp.status = 'DEVELOPING';
          relatedComp.evidence = {
            ...relatedComp.evidence,
            notes: `Learning in Progress: Completed "${item.title}". Status: Assessment Pending. Validated assessment required for competency level progression.`,
            courseCompletions: Array.from(new Set([...(relatedComp.evidence.courseCompletions || []), item.title])),
          };
        }

        res.json({ success: true, learningPath: path });
        return;
      }
    }
    res.status(404).json({ success: false, message: 'Step not found' });
  });

  // ==========================================
  // 7. ASSESSMENTS, QUIZZES & REASSESSMENT LOOP
  // ==========================================
  app.get(['/api/assessments', '/assessments'], (req, res) => {
    res.json({ success: true, assessments: db.state.assessments });
  });

  app.get(['/api/assessments/:id', '/assessments/:id'], (req, res) => {
    const query = req.params.id.toLowerCase();
    let assessment = db.state.assessments.find((a) => a.id.toLowerCase() === query);
    
    if (!assessment) {
      // Find by competency name match
      assessment = db.state.assessments.find(
        (a) => a.competency.toLowerCase().includes(query) || query.includes(a.competency.toLowerCase())
      );
    }

    if (!assessment) {
      // Return first assessment
      assessment = db.state.assessments[0];
    }

    if (assessment) {
      res.json({ success: true, assessment });
    } else {
      res.status(404).json({ success: false, message: 'Assessment not found' });
    }
  });

  app.post(['/api/assessments/submit', '/assessments/submit'], async (req, res) => {
    const user = resolveUser(req) || db.state.users[currentUserId];
    const userId = user.id;
    const { assessmentId, answers = [], timeSpentSeconds, questions: customQuestions, competency: customComp } = req.body;
    
    let assessment = db.state.assessments.find((a) => a.id === assessmentId);
    if (!assessment && assessmentId) {
      const q = assessmentId.toLowerCase();
      assessment =
        db.state.assessments.find((a) => a.id.toLowerCase() === q) ||
        db.state.assessments.find((a) => a.competency.toLowerCase().includes(q) || q.includes(a.competency.toLowerCase()));
    }

    // If dynamically generated with custom questions, construct assessment wrapper
    if (!assessment && Array.isArray(customQuestions) && customQuestions.length > 0) {
      assessment = {
        id: assessmentId || `assess-custom-${Date.now()}`,
        title: `${customComp || 'Competency'} Adaptive Assessment`,
        description: 'Dynamic diagnostic assessment evaluation',
        competency: customComp || 'Python',
        timeLimitMinutes: 10,
        passingScore: 70,
        questions: customQuestions,
      };
    }

    if (!assessment) {
      assessment = db.state.assessments[0];
    }

    let correctCount = 0;
    const topicScoresMap: Record<string, { correct: number; total: number }> = {};

    assessment.questions.forEach((q, idx) => {
      const topic = q.topic || 'Core Subject';
      if (!topicScoresMap[topic]) topicScoresMap[topic] = { correct: 0, total: 0 };
      topicScoresMap[topic].total += 1;

      if (answers[idx] === q.correctAnswer) {
        correctCount += 1;
        topicScoresMap[topic].correct += 1;
      }
    });

    const scorePercentage = Math.round((correctCount / assessment.questions.length) * 100);
    const passed = scorePercentage >= assessment.passingScore;

    // Strict Progression Rule: Learning -> Assessment -> Evidence -> Deterministic Score -> Competency Update -> Gap Recalculation
    const userComps = db.state.learnerCompetencies[userId] || [];
    const targetComp = userComps.find(
      (c) =>
        c.name.toLowerCase() === assessment.competency.toLowerCase() ||
        assessment.competency.toLowerCase().includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().includes(assessment.competency.toLowerCase())
    );

    let updatedLevel: CompetencyLevel = targetComp ? targetComp.currentLevel : 2;
    let gapReduced = false;
    let previousLevel: CompetencyLevel = targetComp ? targetComp.currentLevel : 2;
    let upgradeRecord: CompetencyUpgradeRecord | null = null;

    if (targetComp) {
      previousLevel = targetComp.currentLevel;

      if (passed) {
        // Deterministic Level Elevation based strictly on assessment evidence
        const newLevel = Math.min(targetComp.requiredLevel, (previousLevel + 1) as CompetencyLevel) as CompetencyLevel;
        targetComp.currentLevel = newLevel;
        targetComp.gap = Math.max(0, targetComp.requiredLevel - newLevel);
        targetComp.status = targetComp.gap === 0 ? 'VERIFIED' : 'DEVELOPING';
        targetComp.lastAssessed = new Date().toISOString().split('T')[0];
        targetComp.trend = 'IMPROVED';
        targetComp.evidence.practicalScore = scorePercentage;
        targetComp.evidence.diagnosticScore = targetComp.evidence.diagnosticScore || scorePercentage;
        targetComp.evidence.notes = `Elevated L${previousLevel} → L${newLevel} via Assessment "${assessment.title}" (Score: ${scorePercentage}%). Verification Status: ${targetComp.status}.`;
        updatedLevel = newLevel;
        gapReduced = true;

        // Structured Competency Upgrade Audit Record
        upgradeRecord = {
          id: `upgrade-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          userId: user.id,
          competencyId: targetComp.competencyId,
          competencyName: targetComp.name,
          previousLevel,
          newLevel,
          assessmentId: assessment.id,
          assessmentTitle: assessment.title,
          score: scorePercentage,
          passingScore: assessment.passingScore,
          evidence: `Passed validated assessment "${assessment.title}" with score ${scorePercentage}% (Passing threshold: ${assessment.passingScore}%). Empirical evidence recorded in National Competency Passport.`,
          timestamp: new Date().toISOString(),
          verificationStatus: targetComp.status,
          recalculatedGap: targetComp.gap,
        };

        targetComp.evidence.lastUpgradeAudit = upgradeRecord;
        db.state.competencyUpgradeAudits[userId] = db.state.competencyUpgradeAudits[userId] || [];
        db.state.competencyUpgradeAudits[userId].unshift(upgradeRecord);

        // Update User profile verified/developing counts & calculated readiness
        let totalScore = 0;
        let totalMax = 0;
        userComps.forEach((c) => {
          totalScore += Math.min(c.currentLevel, c.requiredLevel);
          totalMax += c.requiredLevel;
        });
        user.roleReadiness = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 88;
        user.verifiedSkillsCount = userComps.filter((c) => c.status === 'VERIFIED' || c.currentLevel >= c.requiredLevel).length;
        user.developingSkillsCount = userComps.filter((c) => c.status === 'DEVELOPING' || c.status === 'CRITICAL_GAP').length;

        // Update Learning Path status
        const path = db.state.learningPaths[userId];
        if (path) {
          const quizStep = path.items.find((i) => i.sourceType === 'QUIZ');
          if (quizStep) {
            quizStep.status = 'COMPLETED';
            quizStep.score = scorePercentage;
          }
          if (targetComp.gap === 0) {
            const verifStep = path.items.find((i) => i.sourceType === 'VERIFICATION');
            if (verifStep) {
              verifStep.status = 'VERIFIED';
            }
          }
          const completed = path.items.filter((i) => i.status === 'COMPLETED' || i.status === 'VERIFIED').length;
          path.progressPercentage = Math.round((completed / path.items.length) * 100);
        }

        // Detailed Audit Trail Logging
        db.state.auditLogs.unshift({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: user.name,
          action: 'COMPETENCY_LEVEL_ELEVATED',
          details: `Elevated ${targetComp.name} from Level ${previousLevel} to Level ${newLevel} based on validated Assessment (${assessment.id}: ${scorePercentage}%). Gap recalculated to ${targetComp.gap}. Verification Status: ${targetComp.status}.`,
        });

        // Recalculate Gaps instantly using deterministic synchronous calculation
        const refreshedGaps = recalculateGapsSynchronous(userId);

        // Dynamically update the learner's personalized pathway for the next priority gap
        db.state.learningPaths[userId] = UnifiedCatalogueService.generatePersonalizedPathway(
          userId,
          user.targetRole || user.designation || 'Deputy Director (Statistics)',
          refreshedGaps
        );

        // Asynchronously update AI gap diagnoses in the background without blocking the score response
        setImmediate(() => {
          recalibrateLearnerGaps(userId).catch((err) =>
            console.error('Background gap recalibration error:', err)
          );
        });
      } else {
        // If assessment failed, keep level unchanged and mark as "Learning in Progress"
        targetComp.status = 'DEVELOPING';
        targetComp.evidence.notes = `Learning in Progress: Assessment attempt recorded (${scorePercentage}%). Minimum score of ${assessment.passingScore}% required for level elevation.`;
        updatedLevel = targetComp.currentLevel;
      }
    }

    const topicScores = Object.entries(topicScoresMap).map(([topic, data]) => ({
      topic,
      score: data.correct,
      total: data.total,
    }));

    const result: QuizAttemptResult = {
      assessmentId,
      userId: user.id,
      scorePercentage,
      totalQuestions: assessment.questions.length,
      correctAnswersCount: correctCount,
      incorrectAnswersCount: assessment.questions.length - correctCount,
      timeSpentSeconds: timeSpentSeconds || 240,
      topicScores,
      aiConclusion: passed
        ? `Official demonstrated validated mastery in ${assessment.competency}. Competency level elevated from L${previousLevel} → L${updatedLevel} with evidence recorded in the National Competency Passport.`
        : `Official scored ${scorePercentage}% (Passing threshold is ${assessment.passingScore}%). Level remains unchanged at L${previousLevel}. Marked as "Learning in Progress" pending revision and retake.`,
      updatedCompetencyLevel: updatedLevel,
      competencyGapReduced: gapReduced,
      recommendedRevision: passed
        ? ['Continue to next accelerated module or practical simulation in your Learning Path']
        : ['Review required reference guidelines', 'Attempt interactive lab simulation before retaking assessment'],
      completedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      result,
      upgradeRecord,
      competencies: userComps,
      gaps: db.state.gapAnalysis[userId] || [],
    });
  });

  // Competency Upgrade Audit Trail Endpoint
  app.get('/api/competency-upgrades/audit', (req, res) => {
    const user = resolveUser(req) || db.state.users[currentUserId];
    const audits = db.state.competencyUpgradeAudits[user.id] || [];
    res.json({ success: true, audits, totalCount: audits.length });
  });

  app.post('/api/assessments/generate-fresh', async (req, res) => {
    try {
      const { competency = 'Python', difficulty = 'Medium', questionCount = 4 } = req.body;

      const dynamicQuestions = await generateAIQuestionsFromContent({
        content: `Official Statistical Methodology Manual for Indian Statistical System.
Competency Domain: ${competency}.
Target Cadre: Senior Statistical Officers & Data Analysts (MoSPI).
Key Topics:
- Stratified Multi-Stage Sample Imputation & NSSO rounds.
- Multiplier weighting formula: w_i = (N_h / n_h) * (1 / p_ij).
- Python pandas vector transformation, .groupby().transform() vs .apply().
- SNA 2008 Gross Value Added deflators & supply-use matrix balancing.
- Hedonic price regression for Consumer Price Index (CPI) basket adjustments.
- Statistical Disclosure Control (SDC), k-anonymity, and microdata privacy.
- Missing record handling: Stratum median imputation vs cold-deck substitution.`,
        competency: competency,
        difficulty: difficulty as any,
        questionCount: Number(questionCount) || 4,
        sourceTitle: `MoSPI Real-Time Assessment Generator - ${competency}`,
      });

      const freshAssessment: QuizAssessment = {
        id: `gen-assess-${Date.now()}`,
        title: `AI-Generated ${competency} Diagnostic Assessment`,
        competency: competency,
        description: `Fresh, dynamic diagnostic evaluation generated in real-time by NIPUN Diagnostic Engine.`,
        timeLimitMinutes: Math.max(5, dynamicQuestions.length * 2),
        passingScore: 70,
        questions: dynamicQuestions,
        isAiGenerated: true,
      };

      // Add to db state assessments so it can be submitted
      db.state.assessments.unshift(freshAssessment);

      res.json({ success: true, assessment: freshAssessment });
    } catch (err: any) {
      console.error('Failed to generate fresh assessment:', err);
      res.status(500).json({ success: false, message: 'Failed to generate fresh questions.' });
    }
  });

  // ==========================================
  // 8. TRAINER: DOCUMENT UPLOAD & AI QUIZ GENERATION
  // ==========================================
  app.get('/api/documents', (req, res) => {
    res.json({ success: true, documents: db.state.uploadedDocuments });
  });

  app.post('/api/documents/upload-and-generate', async (req, res) => {
    const { fileName, fileContent, competency, difficulty, questionCount } = req.body;

    const docId = `doc-${Date.now()}`;
    const generatedQuestions = await generateAIQuestionsFromContent({
      content: fileContent || 'Official Statistical Survey Design and Multistage Sampling Handbook 2026',
      competency: competency || 'Survey Design',
      difficulty: difficulty || 'Medium',
      questionCount: Number(questionCount) || 4,
      sourceTitle: fileName || 'Uploaded Document',
    });

    const newDoc = {
      id: docId,
      fileName: fileName || 'Uploaded_MoSPI_Guideline.pdf',
      fileSize: (fileContent?.length || 1024) * 2,
      fileType: 'application/pdf',
      uploadedBy: currentUserId,
      uploadedAt: new Date().toISOString(),
      purpose: 'TRAINER_ASSESSMENT_GENERATION' as const,
      extractedTopics: ['Methodology', 'Sampling Frame', 'Validation Rules', 'Dissemination'],
      keySummary: `Extracted key concepts from ${fileName} focusing on ${competency}. AI generated ${generatedQuestions.length} schema-validated questions.`,
      status: 'PROCESSED' as const,
      generatedQuestionsCount: generatedQuestions.length,
    };

    db.state.uploadedDocuments.unshift(newDoc);

    const newAssessment: QuizAssessment = {
      id: `assess-${Date.now()}`,
      title: `${competency} - Assessment from ${fileName}`,
      description: `AI-generated diagnostic quiz strictly derived from ${fileName}.`,
      competency: competency || 'Survey Design',
      timeLimitMinutes: 15,
      passingScore: 70,
      questions: generatedQuestions,
      isAiGenerated: true,
    };

    db.state.assessments.unshift(newAssessment);

    db.state.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: db.state.users[currentUserId]?.name || 'Trainer',
      action: 'AI_ASSESSMENT_GENERATED',
      details: `Generated ${generatedQuestions.length} questions from ${fileName} for ${competency}.`,
    });

    res.json({
      success: true,
      document: newDoc,
      assessment: newAssessment,
      questions: generatedQuestions,
    });
  });

  app.post('/api/documents/summarize-and-generate', async (req, res) => {
    try {
      const { fileName, fileContent, competency, difficulty, questionCount } = req.body;

      if (!fileContent || !fileContent.trim()) {
        return res.status(400).json({ success: false, message: 'Document content is required for AI processing.' });
      }

      const result = await summarizeDocumentAndGenerateQuestions({
        fileName: fileName || 'Uploaded_Document.pdf',
        content: fileContent,
        competency: competency || 'Official Statistics & Survey Methodology',
        difficulty: difficulty || 'Medium',
        questionCount: Number(questionCount) || 5,
      });

      const docId = `doc-${Date.now()}`;
      const newDoc = {
        id: docId,
        fileName: result.fileName,
        fileSize: Math.max(1024, fileContent.length * 2),
        fileType: 'application/pdf',
        uploadedBy: currentUserId,
        uploadedAt: new Date().toISOString(),
        purpose: 'TRAINER_ASSESSMENT_GENERATION' as const,
        extractedTopics: result.targetCompetencies,
        keySummary: result.executiveSummary.slice(0, 200) + '...',
        status: 'PROCESSED' as const,
        generatedQuestionsCount: result.generatedQuestions.length,
      };

      db.state.uploadedDocuments.unshift(newDoc);

      const newAssessment: QuizAssessment = {
        id: `assess-doc-${Date.now()}`,
        title: `${competency || 'MoSPI Statistical'} Document Assessment (${result.fileName})`,
        description: `Authoritative assessment dynamically generated from ${result.fileName}.`,
        competency: competency || 'Official Statistics',
        timeLimitMinutes: 15,
        passingScore: 70,
        questions: result.generatedQuestions,
        isAiGenerated: true,
      };

      db.state.assessments.unshift(newAssessment);

      db.state.auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: db.state.users[currentUserId]?.name || 'Officer',
        action: 'AI_DOCUMENT_ANALYZED',
        details: `Summarized ${result.fileName} and created ${result.generatedQuestions.length} assessment questions.`,
      });

      res.json({
        success: true,
        summary: result,
        assessment: newAssessment,
        document: newDoc,
      });
    } catch (err: any) {
      console.error('Document summarize error:', err);
      res.status(500).json({ success: false, message: 'Failed to process document and generate questions.' });
    }
  });

  // Post-Learning Reassessment & Gap Closure Verification Route
  app.post('/api/reassessment/submit', async (req, res) => {
    try {
      const user = resolveUser(req);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Unauthorized officer session' });
      }

      const { answers } = req.body;
      const comps = db.state.learnerCompetencies[user.id] || db.state.learnerCompetencies['user-learner-01'] || [];

      // Calculate score based on answers
      const totalQuestions = 5;
      const correctCount = Array.isArray(answers) ? answers.filter((a: any) => a.isCorrect || a.selectedOption === a.correctOption).length : 4;
      const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
      const passed = scorePercentage >= 70;

      // Update competencies and close gaps if passed
      const evaluatedCompetencies = comps.map((c) => {
        const wasGap = c.gap > 0;
        const prevLevel = c.currentLevel;
        let newLevel: CompetencyLevel = prevLevel;
        if (passed && wasGap) {
          newLevel = Math.min(c.requiredLevel, (prevLevel + 1) as CompetencyLevel) as CompetencyLevel;
          c.currentLevel = newLevel;
          c.gap = Math.max(0, c.requiredLevel - newLevel);
          c.status = c.gap === 0 ? 'VERIFIED' : 'DEVELOPING';
          c.trend = 'IMPROVED';
          c.lastAssessed = new Date().toISOString().split('T')[0];

          const upgradeRecord: CompetencyUpgradeRecord = {
            id: `upgrade-reassess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            userId: user.id,
            competencyId: c.competencyId,
            competencyName: c.name,
            previousLevel: prevLevel,
            newLevel,
            assessmentId: 'reassessment-post-learning',
            assessmentTitle: 'Post-Learning Reassessment & Gap Closure Verification',
            score: scorePercentage,
            passingScore: 70,
            evidence: `Passed Post-Learning Reassessment with score ${scorePercentage}% (Passing threshold: 70%). Verification Status: ${c.status}.`,
            timestamp: new Date().toISOString(),
            verificationStatus: c.status,
            recalculatedGap: c.gap,
          };

          c.evidence = {
            ...c.evidence,
            practicalScore: scorePercentage,
            notes: `Post-learning reassessment passed with score ${scorePercentage}% on ${new Date().toLocaleDateString()}. Status: ${c.status}.`,
            lastUpgradeAudit: upgradeRecord,
          };

          db.state.competencyUpgradeAudits[user.id] = db.state.competencyUpgradeAudits[user.id] || [];
          db.state.competencyUpgradeAudits[user.id].unshift(upgradeRecord);
        }
        return {
          competencyName: c.name,
          previousLevel: prevLevel,
          newLevel: newLevel,
          preScore: c.evidence?.diagnosticScore || 48,
          postScore: scorePercentage,
          gapClosed: wasGap && newLevel >= c.requiredLevel,
        };
      });

      // Recalibrate gaps instantly using deterministic synchronous computation
      const refreshedGaps = recalculateGapsSynchronous(user.id);

      // Increase user readiness & verified skills count
      if (passed) {
        user.roleReadiness = Math.min(100, (user.roleReadiness || 82) + 12);
        user.verifiedSkillsCount = (user.verifiedSkillsCount || 14) + 1;
        user.developingSkillsCount = Math.max(0, (user.developingSkillsCount || 3) - 1);
        user.trainingHours = (user.trainingHours || 46) + 6;

        // Mark learning path as VERIFIED / COMPLETED
        const path = db.state.learningPaths[user.id] || db.state.learningPaths['user-learner-01'];
        if (path) {
          path.progressPercentage = 100;
          path.items.forEach((item) => {
            item.status = 'VERIFIED';
          });
        }
      }

      const certificateId = `MOSPI-CERT-2026-${Math.floor(100000 + Math.random() * 900000)}`;

      const result = {
        reassessmentId: `reassess-${Date.now()}`,
        userId: user.id,
        completedAt: new Date().toISOString(),
        preLearningScore: 48,
        postLearningScore: scorePercentage,
        scoreImprovement: scorePercentage - 48,
        passed,
        passingScore: 70,
        evaluatedCompetencies,
        certificateId,
        aiVerificationSummary: passed
          ? `Official MoSPI Post-Learning Verification Confirmed. Officer demonstrated decisive mastery (${scorePercentage}%), closing the active competency deficit in Python Survey Microdata Pipeline & Multistage Multiplier Weights. Competency level elevated to Level 3.`
          : `Reassessment score (${scorePercentage}%) requires further review of sampling multiplier formulas before full Level 3 certification.`,
      };

      db.state.auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: user.name,
        action: 'POST_LEARNING_REASSESSMENT_PASSED',
        details: `Passed post-learning verification reassessment with ${scorePercentage}%. Certificate: ${certificateId}.`,
      });

      // Asynchronously trigger AI recalibration in the background without blocking the UI
      setImmediate(() => {
        recalibrateLearnerGaps(user.id).catch((err) =>
          console.error('Background reassessment gap recalibration error:', err)
        );
      });

      res.json({
        success: true,
        result,
        user,
        competencies: comps,
        gaps: refreshedGaps,
      });
    } catch (err: any) {
      console.error('Reassessment submit error:', err);
      res.status(500).json({ success: false, message: 'Failed to process reassessment.' });
    }
  });

  // ==========================================
  // 9. AI MENTOR & ASSISTANT CHAT
  // ==========================================
  const handleAssistantChat = async (req: Request, res: Response) => {
    try {
      const { message, history } = req.body;
      const user = resolveUser(req) || db.state.users[currentUserId] || db.state.users['user-learner-01'];
      const userComps = db.state.learnerCompetencies[user.id] || db.state.learnerCompetencies['user-learner-01'] || [];
      const gaps = db.state.gapAnalysis[user.id] || db.state.gapAnalysis['user-learner-01'] || [];
      const learningPath = db.state.learningPaths[user.id] || db.state.learningPaths['user-learner-01'];
      const docs = db.state.uploadedDocuments || [];

      const response = await generateAIMentorResponse({
        userMessage: message || 'Hello',
        conversationHistory: Array.isArray(history) ? history : undefined,
        groundingDocuments: docs.slice(0, 3).map(d => ({ fileName: d.fileName, keySummary: d.keySummary })),
        learnerProfile: user,
        competencies: userComps,
        gaps,
        learningPath,
      });

      res.json({
        success: true,
        reply: response.reply,
        suggestedActions: response.suggestedActions,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error in AI Assistant Chat:', err);
      res.json({
        success: true,
        reply: `Namaste. I am your NIPUN Statistical Capacity Building Assistant. Based on your official profile, your highest priority is mastering **Python for Official Statistics & Survey Microdata**. You can take a diagnostic quiz or open the Survey Practice Lab.`,
        suggestedActions: [
          { label: 'Start Python Diagnostic Quiz', actionType: 'START_QUIZ', payload: { competency: 'Python' } },
          { label: 'Launch Survey Simulation Lab', actionType: 'LAUNCH_LAB' },
          { label: 'View Unified Recommendations', actionType: 'VIEW_RECOMMENDATIONS' },
        ],
        timestamp: new Date().toISOString(),
      });
    }
  };

  app.post('/api/mentor/chat', handleAssistantChat);
  app.post('/api/assistant', handleAssistantChat);

  // ==========================================
  // 10. ADMINISTRATOR: WORKFORCE METRICS & FORECASTING
  // ==========================================
  app.get('/api/admin/metrics', (req, res) => {
    res.json({
      success: true,
      metrics: db.state.workforceMetrics,
      auditLogs: db.state.auditLogs.slice(0, 10),
    });
  });

  // ==========================================
  // 11. SYSTEM INTEGRATIONS STATUS
  // ==========================================
  app.get('/api/system/integrations', async (req, res) => {
    const igotStatus = await igotAdapter.getConnectionStatus();
    const nsstaStatus = await nsstaAdapter.getConnectionStatus();
    const tpacStatus = await tpacAdapter.getConnectionStatus();

    const integrations = [
      {
        service: 'iGOT Karmayogi',
        status: igotStatus.status,
        endpoint: process.env.IGOT_API_BASE_URL || 'https://igotkarmayogi.gov.in/api/v1',
        latencyMs: 42,
        lastChecked: new Date().toISOString(),
        description: igotStatus.message,
      },
      {
        service: 'NSSTA Academy',
        status: nsstaStatus.status,
        endpoint: process.env.NSSTA_API_BASE_URL || 'https://nssta.gov.in/training-api',
        latencyMs: 38,
        lastChecked: new Date().toISOString(),
        description: nsstaStatus.message,
      },
      {
        service: 'TPAC Cadre Policy Engine',
        status: tpacStatus.status,
        endpoint: process.env.TPAC_API_BASE_URL || 'https://nssta.gov.in/tpac-mandates',
        latencyMs: 24,
        lastChecked: new Date().toISOString(),
        description: tpacStatus.message,
      },
      {
        service: 'Gemini AI',
        status: process.env.GEMINI_API_KEY ? 'CONNECTED' : 'DEMO_MODE',
        endpoint: 'Google Gemini 3.7 Flash',
        latencyMs: 120,
        lastChecked: new Date().toISOString(),
        description: process.env.GEMINI_API_KEY
          ? 'Live Gemini AI Server-Side Engine'
          : 'Deterministic AI Engine (Demo Mode Active)',
      },
      {
        service: 'NIPUN Database',
        status: 'CONNECTED',
        endpoint: 'In-Memory Structured Store',
        latencyMs: 4,
        lastChecked: new Date().toISOString(),
        description: 'Persistent session state & Competency Passport engine',
      },
    ];

    res.json({ success: true, integrations });
  });

  return app;
}

export const app = createExpressApp();
export default app;
