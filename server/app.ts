import express, { type Request, type Response } from 'express';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const expressFn = (express as any).default || express;

import { db } from './db.js';
import { igotAdapter } from './integrations/igot/igot.client.js';
import { nsstaAdapter } from './integrations/nssta/nssta.client.js';
import { tpacAdapter } from './integrations/tpac/tpac.client.js';
import { UnifiedCatalogueService } from './integrations/catalogue.service.js';
import {
  generateAIGapDiagnosis,
  generateAIQuestionsFromContent,
  summarizeDocumentAndGenerateQuestions,
  generateAIMentorResponse,
  generatePersonalizedCourseQuestions,
  checkGeminiHealth,
} from './ai/gemini.js';
import { extractPdfText, validatePdfBuffer } from './utils/pdf-extractor.js';
import {
  fetchLearnerProfileCompetencyData,
  recalibrateLearnerGaps,
  recalculateGapsSynchronous,
} from './utils/learnerProfileCompetency.js';
import type {
  UserProfile,
  CompetencyLevel,
  QuizAttemptResult,
  QuizAssessment,
  QuizQuestion,
  UnifiedRecommendation,
  LearnerCompetency,
  GapAnalysisResult,
  CompetencyUpgradeRecord,
} from '../src/types.js';

const Pool = (pg as any).Pool || (pg as any).default?.Pool || pg;

import {
  normalizeDatabaseUrl,
  getPostgresPoolConfig,
} from './utils/db-url.js';
import {
  persistAuditLog,
  persistAssessmentAttempt,
  persistAssessmentAnswers,
  persistLearnerCompetencies,
  persistSkillGaps,
  persistLearningPathAndProgress,
  persistLearningProgress,
  persistUploadedMaterial,
} from './utils/db-sync.js';

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
  const app = expressFn();

  // CORS & Preflight handling for Vercel and production environments
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      process.env.CORS_ORIGIN,
      'https://nipun-test.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
    ].filter(Boolean) as string[];

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (!origin) {
      res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'https://nipun-test.vercel.app');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token, X-Requested-With');

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
      process.env.VERCEL &&
      req.url !== '/' &&
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

  // Supabase Auth server client for token verification
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dnrqtmadtmgizqdchrbk.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9LZsLZRp9E34czzgwxKAcg_16Ki63lw';
  const serverSupabase = createClient(supabaseUrl, supabaseKey);

  const tokenVerificationCache = new Map<string, { user: UserProfile; expiresAt: number }>();

  async function verifySupabaseToken(token: string): Promise<UserProfile | null> {
    if (!token) return null;
    const cached = tokenVerificationCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.user;
    }

    try {
      const { data: { user: authUser }, error } = await serverSupabase.auth.getUser(token);
      if (error || !authUser) {
        tokenVerificationCache.delete(token);
        return null;
      }

      let appUser = db.state.users[authUser.id] || Object.values(db.state.users).find(u => u.email.toLowerCase() === authUser.email?.toLowerCase());

      if (!appUser) {
        const meta = authUser.user_metadata || {};
        appUser = {
          id: authUser.id,
          name: meta.full_name || meta.name || authUser.email?.split('@')[0] || 'Official Officer',
          email: authUser.email || '',
          role: meta.role || 'LEARNER',
          employeeId: meta.employeeId || `ISS-${authUser.id.substring(0, 8)}`,
          ministry: meta.ministry || 'Ministry of Statistics & Programme Implementation (MoSPI)',
          department: meta.department || 'National Statistical Office (NSO)',
          organization: 'Government of India',
          designation: meta.designation || 'Senior Statistical Officer',
          currentRole: meta.designation || 'Senior Statistical Officer',
          targetRole: meta.targetRole || 'Deputy Director (Statistics)',
          level: meta.level || 11,
          cadre: meta.cadre || 'Indian Statistical Service (ISS)',
          yearsOfExperience: meta.yearsOfExperience || 5,
          education: meta.education || 'M.Sc. Statistics',
          specialization: meta.specialization || 'Survey Data Analysis & Official Statistics',
          location: meta.location || 'New Delhi',
          preferredLanguage: 'English / Hindi',
          previousRoles: ['Junior Statistical Officer'],
          currentProjects: ['National Indicator Framework (NIF) Tracking'],
          technologiesUsed: ['Python', 'SQL', 'R'],
          trainingHours: 24,
          roleReadiness: 80,
          verifiedSkillsCount: 12,
          developingSkillsCount: 3,
        };
        db.state.users[authUser.id] = appUser;
        const seedComps = db.state.learnerCompetencies['a1111111-1111-4111-a111-111111111111'] || db.state.learnerCompetencies['user-learner-01'] || [];
        const seedGaps = db.state.gapAnalysis['a1111111-1111-4111-a111-111111111111'] || db.state.gapAnalysis['user-learner-01'] || [];
        const seedPath = db.state.learningPaths['a1111111-1111-4111-a111-111111111111'] || db.state.learningPaths['user-learner-01'];

        db.state.learnerCompetencies[authUser.id] = seedComps.map(c => ({ ...c }));
        db.state.gapAnalysis[authUser.id] = seedGaps.map(g => ({ ...g }));
        if (seedPath) {
          db.state.learningPaths[authUser.id] = JSON.parse(JSON.stringify(seedPath));
        }
      } else if (appUser.id !== authUser.id) {
        db.state.users[authUser.id] = { ...appUser, id: authUser.id };
        if (!db.state.learnerCompetencies[authUser.id] && db.state.learnerCompetencies[appUser.id]) {
          db.state.learnerCompetencies[authUser.id] = db.state.learnerCompetencies[appUser.id];
        }
        if (!db.state.gapAnalysis[authUser.id] && db.state.gapAnalysis[appUser.id]) {
          db.state.gapAnalysis[authUser.id] = db.state.gapAnalysis[appUser.id];
        }
        if (!db.state.learningPaths[authUser.id] && db.state.learningPaths[appUser.id]) {
          db.state.learningPaths[authUser.id] = db.state.learningPaths[appUser.id];
        }
        appUser = db.state.users[authUser.id];
      }

      // Background ensure user exists in public.users
      void (async () => {
        try {
          const { error: syncErr } = await serverSupabase
            .from('users')
            .upsert(
              {
                id: appUser.id,
                email: appUser.email,
                name: appUser.name,
                role: appUser.role,
                status: 'ACTIVE',
                auth_provider: 'SUPABASE_AUTH',
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );
          if (syncErr) console.warn('[Supabase] background public.users sync:', syncErr.message);
        } catch (e) {
          console.warn('[Supabase] background public.users sync catch:', e);
        }
      })();

      tokenVerificationCache.set(token, {
        user: appUser,
        expiresAt: Date.now() + 3 * 60 * 1000,
      });

      return appUser;
    } catch (err) {
      console.error('[SupabaseAuth] Server token verification failed:', err);
      return null;
    }
  }

  // Middleware to authenticate via Supabase Access Token
  app.use(async (req, res, next) => {
    const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
    let token: string | undefined;
    if (typeof authHeader === 'string') {
      token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();
    }
    if (token) {
      const authenticatedUser = await verifySupabaseToken(token);
      if (authenticatedUser) {
        (req as any).user = authenticatedUser;
      }
    }
    next();
  });

  // Helper to resolve the authenticated user strictly derived from verified Supabase session
  function resolveUser(req: Request): UserProfile | null {
    return (req as any).user || null;
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
    const user = resolveUser(req);
    if (user) {
      return res.json({ success: true, user, isAuthenticated: true });
    }
    return res.status(401).json({ success: false, user: null, isAuthenticated: false, message: 'Authentication required. Please log in.' });
  });

  app.post('/api/auth/register', async (req, res) => {
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

    try {
      // 1. Create and confirm user in Supabase Auth authority
      const { data: createdUser, error: createError } = await serverSupabase.auth.admin.createUser({
        email: normalizedEmail,
        password: password || 'Learner@2026',
        email_confirm: true,
        user_metadata: {
          name: name.trim(),
          role: (role as any) || 'LEARNER',
          designation: designation || 'Senior Statistical Officer',
          ministry: ministry || 'Ministry of Statistics & Programme Implementation (MoSPI)',
          department: department || 'National Statistical Office (NSO)',
          cadre: cadre || 'Subordinate Statistical Service (SSS)',
        },
      });

      if (createError) {
        return res.status(409).json({
          success: false,
          message: createError.message || 'An officer account is already registered with this official email address.',
        });
      }

      const authUserId = createdUser.user.id;

      // 2. Sign in to obtain live Supabase session token
      const { data: signData, error: signError } = await serverSupabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: password || 'Learner@2026',
      });

      const token = signData?.session?.access_token || '';

      const newUser: UserProfile = {
        id: authUserId,
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

      // Store in memory cache
      db.state.users[authUserId] = newUser;

      // Clone base competencies and initial gaps for newly registered officer
      const baseComps = db.state.learnerCompetencies['95f70a45-319f-434b-bbe8-9f146749e96a'] || db.state.learnerCompetencies['a1111111-1111-4111-a111-111111111111'] || db.state.learnerCompetencies['user-learner-01'] || [];
      const baseGaps = db.state.gapAnalysis['95f70a45-319f-434b-bbe8-9f146749e96a'] || db.state.gapAnalysis['a1111111-1111-4111-a111-111111111111'] || db.state.gapAnalysis['user-learner-01'] || [];
      db.state.learnerCompetencies[authUserId] = baseComps.map((c) => ({ ...c }));
      db.state.gapAnalysis[authUserId] = baseGaps.map((g) => ({ ...g }));

      persistAuditLog(serverSupabase, {
        userId: authUserId,
        userName: name,
        action: 'USER_REGISTERED',
        details: `New ${role} account registered in Supabase Auth (${authUserId}).`,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      }).catch((e) => console.warn('[Supabase] audit_logs register sync warning:', e));

      res.status(201).json({
        success: true,
        user: newUser,
        token,
        message: 'Official account successfully registered in Supabase Auth and session established.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, username, identifier, password } = req.body;
    const loginIdentifier = email || username || identifier;

    if (!loginIdentifier) {
      return res.status(400).json({ success: false, message: 'Please provide your official email address or username.' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Please enter your account password.' });
    }

    try {
      const { data, error } = await serverSupabase.auth.signInWithPassword({
        email: loginIdentifier,
        password,
      });

      if (error || !data.user || !data.session) {
        return res.status(401).json({
          success: false,
          message: error?.message || 'Invalid email or password. Please check your official credentials.',
        });
      }

      const matchedUser = await verifySupabaseToken(data.session.access_token);

      persistAuditLog(serverSupabase, {
        userId: data.user.id,
        userName: matchedUser?.name || loginIdentifier,
        action: 'USER_LOGIN',
        details: 'Officer authenticated successfully via Supabase Auth.',
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      }).catch((e) => console.warn('[Supabase] audit_logs login sync warning:', e));

      Promise.resolve(
        serverSupabase
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', data.user.id)
      ).catch(() => {});

      return res.json({
        success: true,
        user: matchedUser,
        token: data.session.access_token,
        message: `Welcome back, ${matchedUser?.name || 'Officer'}!`,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Login error' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
    if (typeof authHeader === 'string') {
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();
      tokenVerificationCache.delete(token);
    }
    res.json({ success: true, message: 'Logged out successfully from official session.' });
  });


  // ==========================================
  // 2. PROFILE & PURPOSE MANAGEMENT
  // ==========================================
  app.get(['/api/profile', '/api/learner/profile'], (req, res) => {
    const user = resolveUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }
    res.json({ success: true, profile: user, ...user });
  });

  app.put(['/api/profile', '/api/learner/profile'], (req, res) => {
    const user = resolveUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }
    const updates = req.body;
    if (db.state.users[user.id]) {
      db.state.users[user.id] = {
        ...db.state.users[user.id],
        ...updates,
      };
      db.state.auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: db.state.users[user.id].name,
        action: 'PROFILE_UPDATED',
        details: 'User updated career targets and background profile.',
      });
      res.json({ success: true, profile: db.state.users[user.id] });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  });

  // Dedicated endpoint when user selects and confirms a Capacity Building Purpose
  app.post('/api/learner/purpose', async (req, res) => {
    const { purposeId, title, targetRole } = req.body;
    const user = resolveUser(req);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
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
    db.state.learnerCompetencies[user.id] = assignedComps;

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

    db.state.gapAnalysis[user.id] = newGaps;

    try {
      await persistAuditLog(serverSupabase, {
        userId: user.id,
        userName: user.name,
        action: 'PURPOSE_CONFIGURED_AND_GAPS_PREDICTED',
        details: `Target Purpose set to "${title || purposeId}". Identified ${newGaps.length} domain-specific skill gaps for ${user.name}.`,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      });

      await persistLearnerCompetencies(serverSupabase, user.id, assignedComps);
      await persistSkillGaps(serverSupabase, user.id, newGaps);
    } catch (dbErr: any) {
      console.error('[Supabase] Purpose persistence failed:', dbErr);
      return res.status(500).json({ success: false, message: 'Database persistence failed: ' + dbErr.message });
    }

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
  app.get('/api/competencies', async (req, res) => {
    try {
      const { data, error } = await serverSupabase
        .from('competencies')
        .select('*, competency_framework(id, name, code)')
        .order('id');
      if (data && data.length > 0) {
        return res.json({ success: true, competencies: data });
      }
    } catch (e) {
      console.warn('[Supabase] competencies fetch failed, falling back:', e);
    }
    res.json({ success: true, competencies: db.state.competencies });
  });

  app.get('/api/learner/competencies', async (req, res) => {
    const user = resolveUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }
    const result = await fetchLearnerProfileCompetencyData(user.id, serverSupabase);
    res.json({ success: true, competencies: result.competencies, profile: result.profile });
  });

  // Dedicated endpoint to fetch real learner profile & enriched competency intelligence
  app.get('/api/learner/profile-competencies', async (req, res) => {
    try {
      const user = resolveUser(req);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
      }
      const data = await fetchLearnerProfileCompetencyData(user.id, serverSupabase);
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
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
      }
      const data = await fetchLearnerProfileCompetencyData(user.id, serverSupabase);
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
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
      }
      const data = await recalibrateLearnerGaps(user.id, serverSupabase);

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
      res.status(500).json({ success: false, message: 'Failed to recalibrate gaps: ' + (err?.message || err) });
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
      const user = resolveUser(req);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
      }
      const userId = user.id;
      let gaps = db.state.gapAnalysis[userId] || [];
      if (gaps.length === 0) {
        gaps = recalculateGapsSynchronous(userId);
      }
      const targetRole = user.targetRole || user.designation || 'Deputy Director (Statistics)';
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
  app.get(['/api/learning-path', '/learning-path'], async (req, res) => {
    try {
      const user = resolveUser(req);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
      }
      const userId = user.id;
      const targetRole = user.targetRole || user.designation || 'Deputy Director (Statistics)';
      let path = db.state.learningPaths[userId];

      // Check PostgreSQL first
      try {
        const { data: dbPath } = await serverSupabase
          .from('learning_paths')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (dbPath) {
          const { data: steps } = await serverSupabase
            .from('learning_progress')
            .select('*')
            .eq('path_id', dbPath.id)
            .order('step_number', { ascending: true });

          if (steps && steps.length > 0) {
            path = {
              id: dbPath.id,
              userId: dbPath.user_id,
              title: dbPath.title,
              targetRole: dbPath.target_role,
              progressPercentage: dbPath.progress_percentage || 0,
              items: steps.map((s: any, idx: number) => ({
                id: s.id.replace(/^step-/, ''),
                order: s.step_number || idx + 1,
                title: s.title,
                source: s.provider || 'iGOT Karmayogi',
                sourceType: (s.source_type as any) || 'IGOT',
                duration: s.duration || '2 hours',
                competency: s.competency_name || 'Statistical Competency',
                reason: `Recommended for ${dbPath.target_role || 'statistical role'} progression.`,
                status: (s.status as any) || 'NOT_STARTED',
                score: s.score !== null ? s.score : undefined,
              })),
              createdAt: dbPath.updated_at || new Date().toISOString(),
              updatedAt: dbPath.updated_at || new Date().toISOString(),
            };
            db.state.learningPaths[userId] = path;
          }
        }
      } catch (dbErr) {
        console.warn('[Supabase] learning_paths lookup error:', dbErr);
      }

      if (!path) {
        let gaps = db.state.gapAnalysis[userId] || [];
        if (gaps.length === 0) {
          gaps = recalculateGapsSynchronous(userId);
        }
        path = UnifiedCatalogueService.generatePersonalizedPathway(userId, targetRole, gaps);
        db.state.learningPaths[userId] = path;

        // Persist new pathway to PostgreSQL
        try {
          await persistLearningPathAndProgress(serverSupabase, userId, path);
        } catch (pErr) {
          console.warn('[Supabase] Initial learning path persist error:', pErr);
        }
      }

      res.json({ success: true, learningPath: path });
    } catch (err: any) {
      console.error('Failed to get learning path:', err);
      res.status(500).json({ success: false, message: 'Failed to retrieve learning path' });
    }
  });

  app.post(['/api/learning-path/step-update', '/learning-path/step-update'], async (req, res) => {
    try {
      const user = resolveUser(req);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
      }
      const userId = user.id;
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

          // Await persistence in PostgreSQL
          try {
            await persistLearningProgress(serverSupabase, path.id || `path-${userId}`, userId, {
              id: item.id,
              title: item.title,
              provider: (item as any).provider || item.sourceType || 'iGOT Karmayogi',
              sourceType: item.sourceType,
              duration: item.duration,
              status: item.status,
              score: item.score,
              competency: item.competency,
            });

            await serverSupabase
              .from('learning_paths')
              .upsert({
                id: path.id || `path-${userId}`,
                user_id: userId,
                title: path.title || 'Personalized Career Competency Pathway',
                target_role: path.targetRole || 'Deputy Director',
                progress_percentage: path.progressPercentage,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'id' });
          } catch (dbErr: any) {
            console.error('[Supabase] Step update persistence failed:', dbErr);
            return res.status(500).json({ success: false, message: 'Database persistence failed: ' + dbErr.message });
          }

          res.json({ success: true, learningPath: path });
          return;
        }
      }
      res.status(404).json({ success: false, message: 'Step not found' });
    } catch (err: any) {
      console.error('Failed to update learning path step:', err);
      res.status(500).json({ success: false, message: 'Step update error: ' + (err?.message || err) });
    }
  });

  // ==========================================
  // 7. ASSESSMENTS, QUIZZES & REASSESSMENT LOOP
  // ==========================================
  app.get(['/api/assessments', '/api/quiz/assessments', '/assessments', '/quiz/assessments'], async (req, res) => {
    try {
      const { data, error } = await serverSupabase
        .from('assessments')
        .select('*, assessment_questions(*)');

      if (data && data.length > 0) {
        const mapped = data.map((a: any) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          competency: a.competency_id,
          timeLimitMinutes: a.time_limit_minutes,
          passingScore: a.passing_score,
          questions: (a.assessment_questions || []).map((q: any) => ({
            id: q.id,
            question: q.question_text,
            options: q.options,
            correctAnswer: q.correct_answer_index,
            explanation: q.explanation,
            topic: q.topic,
            difficulty: q.difficulty,
          })),
        }));
        return res.json({ success: true, assessments: mapped });
      }
    } catch (e) {
      console.warn('[Supabase] assessments fetch failed, falling back:', e);
    }
    res.json({ success: true, assessments: db.state.assessments });
  });

  app.get(['/api/assessments/:id', '/assessments/:id'], async (req, res) => {
    const rawParam = req.params.id || '';
    const decodedParam = decodeURIComponent(rawParam);
    const query = decodedParam.toLowerCase();

    // Try PostgreSQL first
    try {
      const { data, error } = await serverSupabase
        .from('assessments')
        .select('*, assessment_questions(*)')
        .eq('id', query)
        .maybeSingle();

      if (data) {
        const mapped = {
          id: data.id,
          title: data.title,
          description: data.description,
          competency: data.competency_id,
          timeLimitMinutes: data.time_limit_minutes,
          passingScore: data.passing_score,
          questions: (data.assessment_questions || []).map((q: any) => ({
            id: q.id,
            question: q.question_text,
            options: q.options,
            correctAnswer: q.correct_answer_index,
            explanation: q.explanation,
            topic: q.topic,
            difficulty: q.difficulty,
          })),
        };
        return res.json({ success: true, assessment: mapped });
      }
    } catch (e) {
      console.warn('[Supabase] assessment single lookup error:', e);
    }

    let assessment = db.state.assessments.find((a) => a.id.toLowerCase() === query);
    
    if (!assessment) {
      // Find by competency name match
      assessment = db.state.assessments.find(
        (a) => a.competency.toLowerCase().includes(query) || query.includes(a.competency.toLowerCase())
      );
    }

    if (!assessment) {
      // Return first assessment as fallback
      assessment = db.state.assessments[0];
    }

    if (assessment) {
      res.json({ success: true, assessment });
    } else {
      res.status(404).json({ success: false, message: 'Assessment not found' });
    }
  });

  app.post(['/api/assessments/submit', '/assessments/submit'], async (req, res) => {
    const user = resolveUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }
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

        // Recalculate summary metrics on profile
        user.roleReadiness = Math.min(100, Math.max(user.roleReadiness || 80, user.roleReadiness + 5));
        user.verifiedSkillsCount = userComps.filter((c) => c.status === 'VERIFIED').length;
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
          recalibrateLearnerGaps(userId, serverSupabase).catch((err) =>
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

    const attemptId = `attempt-${Date.now()}`;

    // Await PostgreSQL persistence for all attempt data, answers, competencies, and gaps
    try {
      await persistAssessmentAttempt(serverSupabase, {
        id: attemptId,
        assessmentId: assessment.id,
        userId: user.id,
        scorePercentage,
        totalQuestions: assessment.questions.length,
        correctAnswersCount: correctCount,
        incorrectAnswersCount: assessment.questions.length - correctCount,
        timeSpentSeconds: timeSpentSeconds || 240,
        passed,
        topicScores,
        aiConclusion: result.aiConclusion,
        updatedCompetencyLevel: updatedLevel,
        gapReduced,
        recommendedRevision: result.recommendedRevision,
        completedAt: result.completedAt,
      });

      await persistAssessmentAnswers(
        serverSupabase,
        attemptId,
        assessment.id,
        assessment.questions,
        answers,
        timeSpentSeconds || 240
      );

      await persistAuditLog(serverSupabase, {
        userId: user.id,
        userName: user.name,
        action: passed ? 'COMPETENCY_LEVEL_ELEVATED' : 'ASSESSMENT_ATTEMPTED',
        details: passed
          ? `Elevated ${targetComp?.name || assessment.competency} from Level ${previousLevel} to Level ${updatedLevel} based on validated Assessment (${assessment.id}: ${scorePercentage}%).`
          : `Completed assessment ${assessment.id} with score ${scorePercentage}% (Passing threshold: ${assessment.passingScore}%).`,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      });

      await persistLearnerCompetencies(serverSupabase, user.id, userComps);

      const latestGaps = db.state.gapAnalysis[userId] || [];
      await persistSkillGaps(serverSupabase, user.id, latestGaps);
    } catch (dbErr: any) {
      console.error('[Supabase] Assessment submit persistence failed:', dbErr);
      return res.status(500).json({
        success: false,
        message: 'Database persistence failed: ' + (dbErr?.message || dbErr),
      });
    }

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
    const user = resolveUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }
    const audits = db.state.competencyUpgradeAudits[user.id] || [];
    res.json({ success: true, audits, totalCount: audits.length });
  });

  // ==========================================
  // AI HEALTH CHECK (SAFE - NO SECRETS, NO LIVE REMOTE CALL)
  // ==========================================
  app.get(['/api/ai/health', '/ai/health'], (_req: Request, res: Response) => {
    const health = checkGeminiHealth();
    res.status(health.configured ? 200 : 503).json(health);
  });

  // ==========================================
  // PERSONALIZED ASSESSMENT ENGINE
  // ==========================================
  app.post(['/api/assessments/personalized', '/assessments/personalized'], async (req: Request, res: Response) => {
    try {
      const user = resolveUser(req);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
      }

      const { courseId, competencyId, difficulty: reqDifficulty, count = 5 } = req.body || {};

      // 1. Fetch learner competencies & skill gaps directly from PostgreSQL
      const [compsRes, gapsRes] = await Promise.all([
        serverSupabase
          .from('learner_competencies')
          .select('*, competencies(*)')
          .eq('user_id', user.id),
        serverSupabase
          .from('skill_gaps')
          .select('*')
          .eq('user_id', user.id),
      ]);

      const dbComps = compsRes.data || [];
      const dbGaps = gapsRes.data || [];

      // 2. Identify target course & competency requirements
      let targetCourse: any = null;
      let targetCompId = competencyId || 'comp-tech-01';
      let targetCompName = 'Python Survey Microdata Cleaning';
      let targetCourseTitle = '';
      let targetCourseDesc = '';
      let targetLevel = 3;

      if (courseId) {
        const { data: cData } = await serverSupabase
          .from('courses')
          .select('*, competencies(*)')
          .eq('id', courseId)
          .maybeSingle();

        if (cData) {
          targetCourse = cData;
          targetCourseTitle = cData.title;
          targetCourseDesc = cData.description || '';
          targetCompId = cData.competency_id || targetCompId;
          targetCompName = cData.competencies?.name || cData.competency || targetCompName;
          targetLevel = cData.target_level || 3;
        }
      } else if (competencyId) {
        const { data: compData } = await serverSupabase
          .from('competencies')
          .select('*')
          .eq('id', competencyId)
          .maybeSingle();

        if (compData) {
          targetCompId = compData.id;
          targetCompName = compData.name;
          targetLevel = compData.target_level || 4;
        }
      }

      // 3. Read current level and gap from PostgreSQL
      const learnerComp = dbComps.find(
        (c: any) =>
          c.competency_id === targetCompId ||
          c.competencies?.name?.toLowerCase() === targetCompName.toLowerCase() ||
          (c.name && c.name.toLowerCase() === targetCompName.toLowerCase())
      );
      const currentLevel = learnerComp ? Number(learnerComp.current_level) || 2 : 2;

      const learnerGap = dbGaps.find(
        (g: any) =>
          g.competency_id === targetCompId ||
          g.competency_name?.toLowerCase() === targetCompName.toLowerCase()
      );
      const requiredLevel = learnerGap ? Number(learnerGap.required_level) || targetLevel : targetLevel;
      const gapSize = Math.max(0, requiredLevel - currentLevel);

      // 4. Determine assessment difficulty based on gap and target level
      let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
      if (reqDifficulty && ['Easy', 'Medium', 'Hard'].includes(reqDifficulty)) {
        difficulty = reqDifficulty as 'Easy' | 'Medium' | 'Hard';
      } else if (gapSize >= 3 || requiredLevel >= 4 || currentLevel >= 4) {
        difficulty = 'Hard';
      } else if (currentLevel <= 2 && requiredLevel <= 2) {
        difficulty = 'Easy';
      } else {
        difficulty = 'Medium';
      }

      // 5. Select / Generate questions
      // Priority 1: Gemini AI question generation strictly grounded in Course + Competency Gap + Levels + Uploaded Materials
      let generatedQuestions: QuizQuestion[] = [];
      const neededCount = Math.min(10, Math.max(3, Number(count) || 4));

      // Fetch matching uploaded materials for this learner or competency to ground questions
      let uploadedMaterialContext = '';
      let sourceMaterialFileName = '';
      try {
        const { data: userMaterials } = await serverSupabase
          .from('uploaded_learning_materials')
          .select('file_name, executive_summary, extracted_topics')
          .or(`user_id.eq.${user.id},extracted_topics.cs.{"${targetCompName}"}`)
          .order('uploaded_at', { ascending: false })
          .limit(2);

        if (userMaterials && userMaterials.length > 0) {
          sourceMaterialFileName = userMaterials.map((m: any) => m.file_name).join(', ');
          uploadedMaterialContext = userMaterials
            .map((m: any) => `[Source Document: ${m.file_name}]\n${m.executive_summary || ''}`)
            .join('\n\n');
        }
      } catch (matErr) {
        console.warn('[PersonalizedAssessment] Warning fetching uploaded material context:', matErr);
      }

      try {
        generatedQuestions = await generatePersonalizedCourseQuestions({
          courseTitle: targetCourseTitle || `${targetCompName} Targeted Evaluation`,
          courseDescription: targetCourseDesc,
          competencyName: targetCompName,
          currentLevel,
          requiredLevel,
          gapSize,
          difficulty,
          questionCount: neededCount,
          uploadedMaterialContext: uploadedMaterialContext || undefined,
        });
      } catch (aiErr: any) {
        console.warn('[PersonalizedAssessment] Gemini question generation warning:', aiErr?.message);
      }

      const finalQuestions: QuizQuestion[] = [...generatedQuestions];

      // Priority 2: Fallback backfill from PostgreSQL assessment_questions bank if AI was unavailable
      if (finalQuestions.length < neededCount) {
        const { data: approvedQRows } = await serverSupabase
          .from('assessment_questions')
          .select('*')
          .ilike('topic', `%${targetCompName}%`)
          .limit(neededCount - finalQuestions.length);

        if (approvedQRows && approvedQRows.length > 0) {
          for (const row of approvedQRows) {
            if (finalQuestions.length >= neededCount) break;
            finalQuestions.push({
              id: row.id,
              question: row.question_text,
              options: row.options,
              correctAnswer: row.correct_answer_index,
              explanation: row.explanation || 'Verified approved assessment question.',
              difficulty: row.difficulty || difficulty,
              competency: targetCompName,
              topic: row.topic || targetCompName,
              sourceReference: 'MoSPI National Question Bank',
            });
          }
        }
      }

      if (finalQuestions.length === 0) {
        throw new Error('Unable to generate or retrieve assessment questions for this course and competency.');
      }

      const assessmentId = `assess-pers-${Date.now()}`;
      const newAssessment: QuizAssessment = {
        id: assessmentId,
        title: targetCourseTitle ? `${targetCourseTitle} - Targeted Assessment` : `${targetCompName} Diagnostic Assessment`,
        description: `Personalized evaluation targeting Level ${currentLevel} → Level ${requiredLevel} competency requirements.`,
        competency: targetCompName,
        timeLimitMinutes: Math.max(5, finalQuestions.length * 2),
        passingScore: 70,
        questions: finalQuestions,
        isAiGenerated: true,
      };

      // Ensure assessment exists in PostgreSQL assessments table so submit foreign key constraint passes
      try {
        await serverSupabase.from('assessments').upsert({
          id: assessmentId,
          title: newAssessment.title,
          competency_id: targetCompId,
          description: newAssessment.description,
          time_limit_minutes: newAssessment.timeLimitMinutes,
          passing_score: newAssessment.passingScore,
          is_ai_generated: true,
          created_at: new Date().toISOString(),
        });

        // Also ensure questions exist in assessment_questions table
        const qRows = finalQuestions.map((q, idx) => ({
          id: q.id,
          assessment_id: assessmentId,
          question_text: q.question,
          options: q.options,
          correct_answer_index: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty || difficulty,
          topic: q.topic || targetCompName,
          order_index: idx + 1,
        }));
        await serverSupabase.from('assessment_questions').upsert(qRows, { onConflict: 'id' });
      } catch (dbErr: any) {
        console.warn('[Supabase] Assessment persistence warning:', dbErr?.message);
      }

      // Add to in-memory state as well
      db.state.assessments.unshift(newAssessment);

      res.json({
        success: true,
        assessment: newAssessment,
        personalization: {
          courseId: courseId || null,
          courseTitle: targetCourseTitle || null,
          competencyId: targetCompId,
          competencyName: targetCompName,
          currentLevel,
          requiredLevel,
          gapSize,
          difficulty,
          sourceMaterial: sourceMaterialFileName || null,
          totalQuestions: finalQuestions.length,
        },
      });
    } catch (err: any) {
      console.error('Personalized assessment error:', err);
      res.status(500).json({ success: false, message: err?.message || 'Failed to generate personalized assessment.' });
    }
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
    const user = resolveUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }

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
      uploadedBy: user.id,
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

    try {
      await persistUploadedMaterial(serverSupabase, {
        id: docId,
        userId: user.id,
        fileName: newDoc.fileName,
        fileSize: newDoc.fileSize,
        fileType: newDoc.fileType,
        purpose: newDoc.purpose,
        status: newDoc.status,
        extractedTopics: newDoc.extractedTopics,
        keySummary: newDoc.keySummary,
        rawTextExcerpt: (fileContent || '').substring(0, 1000),
        generatedQuestionsCount: newDoc.generatedQuestionsCount,
      });

      await persistAuditLog(serverSupabase, {
        userId: user.id,
        userName: user.name || 'Trainer',
        action: 'AI_ASSESSMENT_GENERATED',
        details: `Generated ${generatedQuestions.length} questions from ${fileName} for ${competency}.`,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      });
    } catch (dbErr: any) {
      console.warn('[Supabase] Document upload persistence warning:', dbErr);
    }

    res.json({
      success: true,
      document: newDoc,
      assessment: newAssessment,
      questions: generatedQuestions,
    });
  });

  app.post(['/api/documents/summarize-and-generate', '/documents/summarize-and-generate', '/api/ai/pdf-summarize'], async (req, res) => {
    try {
      const user = resolveUser(req);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
      }

      const { fileName = 'MoSPI_Document.pdf', fileContent, competency, difficulty, questionCount } = req.body || {};
      const fileBase64 = req.body?.fileBase64 || req.body?.fileData;

      let extractedText = '';
      let pageCount = 1;

      if (fileBase64 && typeof fileBase64 === 'string' && fileBase64.trim()) {
        const cleanBase64 = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
        const pdfBuffer = Buffer.from(cleanBase64, 'base64');

        const validation = validatePdfBuffer(pdfBuffer, fileName);
        if (!validation.valid) {
          return res.status(400).json({ success: false, error: validation.error });
        }

        const extraction = await extractPdfText(pdfBuffer, fileName);
        if (extraction.isScanned) {
          return res.status(422).json({
            success: false,
            error: 'This PDF appears to be scanned/image-based and does not contain extractable text. OCR is required.',
          });
        }
        extractedText = extraction.text;
        pageCount = extraction.pageCount;
      } else if (fileContent && typeof fileContent === 'string' && fileContent.trim()) {
        extractedText = fileContent.trim();
      } else {
        return res.status(400).json({
          success: false,
          error: 'PDF file data (base64) or extractable document text is required for AI processing.',
        });
      }

      if (!extractedText || extractedText.length < 30) {
        return res.status(422).json({
          success: false,
          error: 'This PDF appears to be scanned/image-based and does not contain extractable text. OCR is required.',
        });
      }

      const result = await summarizeDocumentAndGenerateQuestions({
        fileName,
        content: extractedText,
        competency: competency || 'Official Statistics & Survey Methodology',
        difficulty: difficulty || 'Medium',
        questionCount: Number(questionCount) || 5,
        pageCount,
      });

      const docId = `doc-${Date.now()}`;
      const approxSize = fileBase64 ? Math.round((fileBase64.length * 3) / 4) : Buffer.byteLength(extractedText, 'utf8');
      const newDoc = {
        id: docId,
        fileName: result.fileName,
        fileSize: approxSize,
        fileType: 'application/pdf',
        uploadedBy: user.id,
        uploadedAt: new Date().toISOString(),
        purpose: 'TRAINER_ASSESSMENT_GENERATION' as const,
        extractedTopics: result.competenciesCovered,
        keySummary: result.executiveSummary.slice(0, 300) + '...',
        status: 'PROCESSED' as const,
        generatedQuestionsCount: result.generatedQuestions.length,
      };

      db.state.uploadedDocuments.unshift(newDoc);

      const assessmentId = `assess-doc-${Date.now()}`;
      const newAssessment: QuizAssessment = {
        id: assessmentId,
        title: `${competency || 'MoSPI Statistical'} Assessment (${result.fileName})`,
        description: `Authoritative assessment dynamically generated from ${result.fileName}.`,
        competency: competency || result.competenciesCovered[0] || 'Official Statistics',
        timeLimitMinutes: 15,
        passingScore: 70,
        questions: result.generatedQuestions,
        isAiGenerated: true,
      };

      db.state.assessments.unshift(newAssessment);

      // Persist to PostgreSQL tables: uploaded_learning_materials, audit_logs, assessments, assessment_questions
      try {
        await persistUploadedMaterial(serverSupabase, {
          id: docId,
          userId: user.id,
          fileName: newDoc.fileName,
          fileSize: newDoc.fileSize,
          fileType: newDoc.fileType,
          purpose: newDoc.purpose,
          status: newDoc.status,
          extractedTopics: result.competenciesCovered,
          keySummary: JSON.stringify({
            documentTitle: result.documentTitle,
            executiveSummary: result.executiveSummary,
            keyConcepts: result.keyConcepts,
            importantPoints: result.importantPoints,
            competenciesCovered: result.competenciesCovered,
            practicalApplications: result.practicalApplications,
            importantDefinitions: result.importantDefinitions,
            keyTakeaways: result.keyTakeaways,
            suggestedRevisionPoints: result.suggestedRevisionPoints,
            suggestedAssessmentTopics: result.suggestedAssessmentTopics,
          }),
          rawTextExcerpt: extractedText.slice(0, 1000),
          generatedQuestionsCount: newDoc.generatedQuestionsCount,
        });

        await persistAuditLog(serverSupabase, {
          userId: user.id,
          userName: user.name || 'Officer',
          action: 'AI_DOCUMENT_SUMMARIZED',
          details: `Summarized ${result.fileName} and created ${result.generatedQuestions.length} assessment questions.`,
          ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
        });

        await serverSupabase.from('assessments').upsert({
          id: assessmentId,
          title: newAssessment.title,
          competency_id: 'comp-stat-01',
          description: newAssessment.description,
          time_limit_minutes: newAssessment.timeLimitMinutes,
          passing_score: newAssessment.passingScore,
          is_ai_generated: true,
          created_at: new Date().toISOString(),
        });

        const qRows = result.generatedQuestions.map((q, idx) => ({
          id: q.id,
          assessment_id: assessmentId,
          question_text: q.question,
          options: q.options,
          correct_answer_index: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty || difficulty || 'Medium',
          topic: q.topic || competency || 'Official Statistics',
          order_index: idx + 1,
        }));
        await serverSupabase.from('assessment_questions').upsert(qRows, { onConflict: 'id' });
      } catch (dbErr: any) {
        console.warn('[Supabase] Document persistence warning:', dbErr?.message || dbErr);
      }

      res.json({
        success: true,
        summary: result,
        assessment: newAssessment,
        document: newDoc,
      });
    } catch (err: any) {
      console.error('[PDF_SUMMARIZE_ERROR]', err?.message || err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Failed to process document and generate questions.',
      });
    }
  });

  app.post(['/api/reassessments/submit', '/api/reassessment/submit', '/reassessments/submit', '/reassessment/submit'], async (req, res) => {
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

      // Await PostgreSQL persistence
      const reassessmentQuestions = [
        { id: 'reassess-q1', question_text: 'Multi-stage Stratified Sampling Design and First Stage Units', options: ['A', 'B', 'C', 'D'], correct_answer_index: 1, topic: 'Sample Surveys' },
        { id: 'reassess-q2', question_text: 'Python Microdata Multiplier Weights Calibration', options: ['A', 'B', 'C', 'D'], correct_answer_index: 2, topic: 'Python Programming' },
        { id: 'reassess-q3', question_text: 'Non-sampling Error Imputation in PLFS Datasets', options: ['A', 'B', 'C', 'D'], correct_answer_index: 0, topic: 'Data Processing' },
        { id: 'reassess-q4', question_text: 'Variance Estimation using Jackknife / Bootstrap Replication', options: ['A', 'B', 'C', 'D'], correct_answer_index: 3, topic: 'Sampling Theory' },
        { id: 'reassess-q5', question_text: 'Statistical Disclosure Control (k-anonymity & l-diversity)', options: ['A', 'B', 'C', 'D'], correct_answer_index: 1, topic: 'Data Governance' },
      ];

      try {
        await persistAssessmentAttempt(serverSupabase, {
          id: result.reassessmentId,
          assessmentId: 'reassessment-post-learning',
          userId: user.id,
          scorePercentage,
          totalQuestions: 5,
          correctAnswersCount: correctCount,
          incorrectAnswersCount: 5 - correctCount,
          timeSpentSeconds: 180,
          passed,
          topicScores: evaluatedCompetencies,
          aiConclusion: result.aiVerificationSummary,
          updatedCompetencyLevel: passed ? 3 : undefined,
          gapReduced: passed,
          recommendedRevision: passed ? [] : ['Review sampling multiplier formulas'],
          completedAt: result.completedAt,
        });

        const numAnswers = Array.isArray(answers)
          ? answers.map((a: any) => (typeof a === 'number' ? a : (a.selectedOption !== undefined ? a.selectedOption : 1)))
          : [1, 2, 0, 3, 1];

        await persistAssessmentAnswers(
          serverSupabase,
          result.reassessmentId,
          'reassessment-post-learning',
          reassessmentQuestions,
          numAnswers,
          180
        );

        await persistAuditLog(serverSupabase, {
          userId: user.id,
          userName: user.name,
          action: passed ? 'POST_LEARNING_REASSESSMENT_PASSED' : 'POST_LEARNING_REASSESSMENT_FAILED',
          details: `Reassessment completed with ${scorePercentage}%. Passed: ${passed}. Certificate: ${certificateId}.`,
          ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
        });

        await persistLearnerCompetencies(serverSupabase, user.id, comps);
        await persistSkillGaps(serverSupabase, user.id, refreshedGaps);
      } catch (dbErr: any) {
        console.error('[Supabase] Reassessment persistence failed:', dbErr);
        return res.status(500).json({
          success: false,
          message: 'Database persistence failed: ' + (dbErr?.message || dbErr),
        });
      }

      // Asynchronously trigger AI recalibration in the background without blocking the UI
      setImmediate(() => {
        recalibrateLearnerGaps(user.id, serverSupabase).catch((err) =>
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
      const user = resolveUser(req);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
      }
      const { message, history } = req.body || {};

      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, error: 'Query message is required.' });
      }

      // Ground in live authoritative PostgreSQL learner data
      const [
        profileRes,
        compsRes,
        gapsRes,
        pathRes,
        progressRes,
        attemptsRes,
        materialsRes,
        recommendationsRes,
      ] = await Promise.all([
        serverSupabase.from('official_profiles').select('*, departments(*), roles(*)').eq('user_id', user.id).maybeSingle(),
        serverSupabase.from('learner_competencies').select('*, competencies(*)').eq('user_id', user.id),
        serverSupabase.from('skill_gaps').select('*').eq('user_id', user.id),
        serverSupabase.from('learning_paths').select('*').eq('user_id', user.id).maybeSingle(),
        serverSupabase.from('learning_progress').select('*').order('step_number', { ascending: true }).limit(10),
        serverSupabase.from('assessment_attempts').select('*').eq('user_id', user.id).order('completed_at', { ascending: false }).limit(5),
        serverSupabase.from('uploaded_learning_materials').select('*').order('uploaded_at', { ascending: false }).limit(5),
        serverSupabase.from('recommendations').select('*, courses(*), training_programmes(*)').eq('user_id', user.id).limit(5),
      ]);

      const officialProfile = profileRes.data || {};
      const dept = officialProfile.departments?.name || user.department || 'National Statistical Office (NSO)';
      const role = officialProfile.roles?.title || user.designation || 'Statistical Officer';

      const userComps = (compsRes.data && compsRes.data.length > 0)
        ? compsRes.data.map((c: any) => ({
            id: c.competency_id,
            name: c.competencies?.name || c.name || 'Competency',
            currentLevel: c.current_level,
            requiredLevel: c.required_level,
            status: c.status,
            trend: c.trend,
          }))
        : (db.state.learnerCompetencies[user.id] || []).map((c: any) => ({
            name: c.name,
            currentLevel: c.currentLevel,
            requiredLevel: c.requiredLevel,
            status: c.status,
          }));

      const gaps = (gapsRes.data && gapsRes.data.length > 0)
        ? gapsRes.data.map((g: any) => ({
            competencyName: g.competency_name,
            currentLevel: g.current_level,
            requiredLevel: g.required_level,
            gapType: g.gap_type,
            priority: g.priority,
            aiDiagnosis: g.ai_diagnosis,
          }))
        : (db.state.gapAnalysis[user.id] || []).map((g: any) => ({
            competencyName: g.competencyName,
            currentLevel: g.currentLevel,
            requiredLevel: g.requiredLevel,
            gapType: g.gapType,
            priority: g.priority,
          }));

      const learningPath = pathRes.data || db.state.learningPaths[user.id] || {};
      const learningProgress = progressRes.data || [];
      const attempts = attemptsRes.data || [];
      const materials = materialsRes.data || (db.state.uploadedDocuments || []);
      const recommendations = recommendationsRes.data || [];

      const nipunContext = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          designation: user.designation,
          cadre: officialProfile.cadre || user.cadre || 'Indian Statistical Service (ISS)',
          department: dept,
          ministry: officialProfile.departments?.ministry || user.ministry || 'Ministry of Statistics & Programme Implementation (MoSPI)',
          payLevel: officialProfile.pay_level || user.level || 11,
          yearsOfExperience: officialProfile.years_of_experience || 5,
          roleReadiness: officialProfile.role_readiness_score || user.roleReadiness || 78,
          verifiedSkillsCount: userComps.filter((c: any) => c.status === 'VERIFIED').length,
        },
        role: {
          currentRole: role,
          targetRole: user.targetRole || 'Deputy Director (Statistics)',
        },
        competencies: userComps,
        gaps,
        selectedCourses: (recommendationsRes.data || []).map((r: any) => ({
          title: r.courses?.title || 'Applied Statistical Analysis',
          provider: r.courses?.provider || 'iGOT Karmayogi',
        })),
        learningProgress: learningProgress.map((p: any) => ({
          step: p.step_number,
          title: p.title,
          status: p.status,
        })),
        assessments: attempts.map((a: any) => ({
          score: a.score_percentage,
          passed: a.passed,
          completedAt: a.completed_at,
        })),
        materials: materials.map((m: any) => ({
          fileName: m.file_name || m.fileName,
          executiveSummary: (m.executive_summary || m.keySummary || '').slice(0, 300),
        })),
        recommendations: recommendations.map((r: any) => ({
          reason: r.reason,
          priority: r.priority_level || 'HIGH',
        })),
      };

      const response = await generateAIMentorResponse({
        userMessage: message,
        conversationHistory: Array.isArray(history) ? history : undefined,
        nipunContext,
      });

      res.json({
        success: true,
        reply: response.reply,
        suggestedActions: response.suggestedActions,
        contextSummary: {
          user: nipunContext.user.name,
          role: nipunContext.role.currentRole,
          competenciesCount: userComps.length,
          gapsCount: gaps.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[AI_ASSISTANT_ERROR]', err?.message || err);
      res.status(503).json({
        success: false,
        error: 'AI service temporarily unavailable',
        message: 'Gemini AI service is currently unavailable. Please try again later.',
      });
    }
  };

  app.post(['/api/ai/assistant', '/api/assistant/chat', '/api/assistant', '/api/mentor/chat'], handleAssistantChat);

  app.post(['/api/gap-analysis/ai-diagnosis', '/gap-analysis/ai-diagnosis'], async (req: Request, res: Response) => {
    try {
      const { competencyName = 'Python', currentLevel = 2, requiredLevel = 4, role = 'Assistant Director (Statistics)' } = req.body || {};
      const diagnosis = await generateAIGapDiagnosis({
        role,
        competency: competencyName,
        requiredLevel: Number(requiredLevel) || 4,
        currentLevel: Number(currentLevel) || 2,
        diagnosticScore: 48,
        practicalScore: 42,
        repeatedErrors: ['pandas groupby transform', 'multiplier weight calibration'],
      });
      res.json({
        success: true,
        competencyName,
        currentLevel: Number(currentLevel) || 2,
        requiredLevel: Number(requiredLevel) || 4,
        gap: Math.max(0, (Number(requiredLevel) || 4) - (Number(currentLevel) || 2)),
        aiDiagnosis: diagnosis.aiDiagnosis,
        whyRecommended: diagnosis.whyRecommended,
        confidence: diagnosis.confidence,
        priorityRank: 1,
        targetDate: '2026-10-31',
      });
    } catch (err: any) {
      console.error('[AI_GAP_DIAGNOSIS_ERROR]', err?.message || err);
      res.status(503).json({
        success: false,
        error: 'AI service temporarily unavailable',
        message: 'Gemini AI service is currently unavailable for gap diagnosis.',
      });
    }
  });

  // ==========================================
  // 10. ADMINISTRATOR: WORKFORCE METRICS & FORECASTING
  // ==========================================
  app.get('/api/admin/metrics', (req, res) => {
    const user = resolveUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Authentication token required.' });
    }
    if ((user.role as string) !== 'ADMINISTRATOR' && (user.role as string) !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden. Administrator authorization required.' });
    }
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

  // Global API 404 Handler (JSON instead of HTML)
  app.use('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'NOT_FOUND',
      message: `API route ${req.originalUrl || req.url} does not exist.`,
    });
  });

  // Global Express Serverless Error Handler (Never crash or render HTML)
  app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('[EXPRESS_SERVERLESS_ERROR]', err?.stack || err?.message || String(err));
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: err?.message || 'An internal server error occurred.',
    });
  });

  return app;
}

export const app = createExpressApp();
export default app;
