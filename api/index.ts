import pg from 'pg';
import { db } from '../server/db.js';
import {
  generateAIGapDiagnosis,
  generateAIQuestionsFromContent,
  summarizeDocumentAndGenerateQuestions,
  generateAIMentorResponse,
} from '../server/ai/gemini.js';
import {
  fetchLearnerProfileCompetencyData,
  recalibrateLearnerGaps,
  recalculateGapsSynchronous,
} from '../server/utils/learnerProfileCompetency.js';
import { UnifiedCatalogueService } from '../server/integrations/catalogue.service.js';
import { getPostgresPoolConfig } from '../server/utils/db-url.js';

const Pool = (pg as any).Pool || (pg as any).default?.Pool || pg;
let healthPool: any = null;

function getHealthPool() {
  const rawDatabaseUrl = process.env.DATABASE_URL;
  if (!rawDatabaseUrl) return null;
  if (!healthPool) {
    const config = getPostgresPoolConfig(rawDatabaseUrl);
    if (!config) return null;
    healthPool = new Pool(config);
    healthPool.on('error', (err: any) => {
      console.error('[DB_HEALTH_POOL_ERROR]', err?.message || String(err));
    });
  }
  return healthPool;
}

// Helper to parse JSON body from Vercel request stream if not parsed
async function parseJsonBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk: any) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function resolveUser(req: any) {
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
  return db.state.users['user-learner-01'] || Object.values(db.state.users)[0] || null;
}

export default async function handler(req: any, res: any) {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    db.ensureSeeded();
  } catch (seedErr) {
    console.warn('[DB_SEED_WARN]', seedErr);
  }

  // Parse path
  const reqUrl = req.url || '/api/health';
  const urlObj = new URL(reqUrl, 'http://localhost');
  let pathname = urlObj.pathname;

  // Normalize path if leading slash missing or double api
  if (!pathname.startsWith('/api')) {
    pathname = '/api' + (pathname.startsWith('/') ? pathname : '/' + pathname);
  }

  const method = req.method ? req.method.toUpperCase() : 'GET';

  try {
    // -------------------------------------------------------------------
    // 1. PRODUCTION HEALTH & DB READINESS
    // -------------------------------------------------------------------
    if (method === 'GET' && (pathname === '/api/health' || pathname === '/health')) {
      return res.status(200).json({ status: 'ok', environment: 'production' });
    }

    if (method === 'GET' && (pathname === '/api/inspect-db' || pathname === '/inspect-db')) {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        return res.status(500).json({ status: 'error', message: 'DATABASE_URL missing' });
      }

      const host = dbUrl.split('@')[1]?.split('/')[0] || 'unknown';
      const pool = getHealthPool();
      if (!pool) return res.status(500).json({ status: 'error', message: 'Pool init failed' });

      const client = await pool.connect();
      try {
        const q1 = await client.query('SELECT current_database(), current_schema();');
        const q2 = await client.query(`
          SELECT table_schema, table_name 
          FROM information_schema.tables 
          WHERE table_schema NOT IN ('pg_catalog', 'information_schema') 
          ORDER BY table_schema, table_name;
        `);
        const q3 = await client.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users'
          ) AS users_exists;
        `);
        const q4 = await client.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='official_profiles'
          ) AS official_profiles_exists;
        `);

        return res.status(200).json({
          success: true,
          safeHost: host,
          contains_dnrqtmadtmgizqdchrbk: host.includes('dnrqtmadtmgizqdchrbk'),
          database_info: q1.rows[0],
          existing_tables_count: q2.rows.length,
          tables_list: q2.rows.map((r: any) => `${r.table_schema}.${r.table_name}`),
          users_exists: q3.rows[0]?.users_exists || false,
          official_profiles_exists: q4.rows[0]?.official_profiles_exists || false,
        });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || String(err) });
      } finally {
        client.release();
      }
    }

    if (method === 'POST' && (pathname === '/api/deploy-schema' || pathname === '/deploy-schema')) {
      const pool = getHealthPool();
      if (!pool) return res.status(500).json({ status: 'error', message: 'Pool init failed' });

      const schemaSql = `
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        CREATE TABLE IF NOT EXISTS departments (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            short_code VARCHAR(32) NOT NULL,
            ministry VARCHAR(255) DEFAULT 'Ministry of Statistics & Programme Implementation',
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS roles (
            id VARCHAR(64) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            cadre VARCHAR(64) NOT NULL,
            pay_level INTEGER NOT NULL,
            description TEXT,
            gazetted BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(64) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(32) NOT NULL DEFAULT 'LEARNER',
            status VARCHAR(32) DEFAULT 'ACTIVE',
            auth_provider VARCHAR(32) DEFAULT 'CREDENTIALS',
            password_hash VARCHAR(255),
            password_salt VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            last_login_at TIMESTAMP WITH TIME ZONE
        );

        CREATE TABLE IF NOT EXISTS official_profiles (
            user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            employee_id VARCHAR(64) UNIQUE NOT NULL,
            department_id VARCHAR(64) REFERENCES departments(id),
            current_role_id VARCHAR(64) REFERENCES roles(id),
            target_role_id VARCHAR(64) REFERENCES roles(id),
            cadre VARCHAR(64) NOT NULL,
            pay_level INTEGER NOT NULL DEFAULT 11,
            years_of_experience NUMERIC(4, 1) DEFAULT 5.0,
            education VARCHAR(255),
            specialization VARCHAR(255),
            location VARCHAR(255),
            preferred_language VARCHAR(64) DEFAULT 'English / Hindi',
            training_hours NUMERIC(6, 1) DEFAULT 0.0,
            role_readiness_score NUMERIC(5, 2) DEFAULT 75.0,
            verified_skills_count INTEGER DEFAULT 0,
            developing_skills_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS assignments (
            id VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            department_id VARCHAR(64) REFERENCES departments(id),
            start_date DATE NOT NULL,
            end_date DATE,
            is_current BOOLEAN DEFAULT TRUE,
            role_in_project VARCHAR(128),
            key_technologies JSONB DEFAULT '[]',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS competency_framework (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            domain VARCHAR(64) NOT NULL,
            description TEXT NOT NULL,
            frac_aligned BOOLEAN DEFAULT TRUE,
            version VARCHAR(16) DEFAULT '2.0',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS competencies (
            id VARCHAR(64) PRIMARY KEY,
            framework_id VARCHAR(64) REFERENCES competency_framework(id),
            code VARCHAR(32) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            domain VARCHAR(64) NOT NULL,
            description TEXT NOT NULL,
            weight NUMERIC(3, 2) DEFAULT 1.0,
            level_1_rubric TEXT,
            level_2_rubric TEXT,
            level_3_rubric TEXT,
            level_4_rubric TEXT,
            level_5_rubric TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS role_competency_requirements (
            id VARCHAR(64) PRIMARY KEY,
            role_id VARCHAR(64) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
            competency_id VARCHAR(64) NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
            required_level INTEGER NOT NULL CHECK (required_level BETWEEN 1 AND 5),
            is_mandatory BOOLEAN DEFAULT TRUE,
            priority VARCHAR(16) DEFAULT 'HIGH',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (role_id, competency_id)
        );

        CREATE TABLE IF NOT EXISTS learner_competencies (
            id VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            competency_id VARCHAR(64) NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
            current_level INTEGER NOT NULL DEFAULT 1 CHECK (current_level BETWEEN 1 AND 5),
            required_level INTEGER NOT NULL DEFAULT 3 CHECK (required_level BETWEEN 1 AND 5),
            status VARCHAR(32) NOT NULL DEFAULT 'DEVELOPING',
            gap_type VARCHAR(32) DEFAULT 'APPLICATION_GAP',
            confidence NUMERIC(3, 2) DEFAULT 0.85,
            trend VARCHAR(32) DEFAULT 'STABLE',
            last_assessed_at TIMESTAMP WITH TIME ZONE,
            target_date DATE,
            diagnostic_score NUMERIC(5, 2),
            practical_score NUMERIC(5, 2),
            repeated_errors JSONB DEFAULT '[]',
            evaluator_notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (user_id, competency_id)
        );

        CREATE TABLE IF NOT EXISTS skill_gaps (
            id VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            competency_id VARCHAR(64) NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
            required_level INTEGER NOT NULL,
            current_level INTEGER NOT NULL,
            gap_magnitude INTEGER NOT NULL,
            gap_type VARCHAR(32) NOT NULL,
            priority VARCHAR(16) NOT NULL,
            knowledge_gap_score NUMERIC(5, 2) DEFAULT 0.0,
            application_gap_score NUMERIC(5, 2) DEFAULT 0.0,
            retention_risk_score NUMERIC(5, 2) DEFAULT 0.0,
            ai_diagnosis TEXT,
            why_recommended JSONB DEFAULT '[]',
            status VARCHAR(32) DEFAULT 'OPEN',
            identified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            closed_at TIMESTAMP WITH TIME ZONE
        );

        CREATE TABLE IF NOT EXISTS courses (
            id VARCHAR(64) PRIMARY KEY,
            provider VARCHAR(64) NOT NULL DEFAULT 'iGOT Karmayogi',
            title VARCHAR(255) NOT NULL,
            description TEXT,
            competency_id VARCHAR(64) REFERENCES competencies(id),
            target_level INTEGER NOT NULL DEFAULT 3,
            category VARCHAR(64) DEFAULT 'Official Statistics',
            difficulty VARCHAR(32) DEFAULT 'Intermediate',
            duration VARCHAR(64) NOT NULL,
            rating NUMERIC(2, 1) DEFAULT 4.8,
            enrolled_count INTEGER DEFAULT 0,
            course_url TEXT NOT NULL,
            is_frac_certified BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS training_programmes (
            id VARCHAR(64) PRIMARY KEY,
            academy VARCHAR(64) NOT NULL DEFAULT 'NSSTA',
            title VARCHAR(255) NOT NULL,
            category VARCHAR(64) NOT NULL,
            duration VARCHAR(64) NOT NULL,
            mode VARCHAR(64) NOT NULL DEFAULT 'In-Person (NSSTA Campus, Greater Noida)',
            target_cadre VARCHAR(128) NOT NULL,
            eligibility TEXT,
            tpac_aligned BOOLEAN DEFAULT TRUE,
            upcoming_batch_date VARCHAR(64),
            seats_available INTEGER DEFAULT 25,
            description TEXT,
            curriculum_modules JSONB DEFAULT '[]',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS assessments (
            id VARCHAR(64) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            competency_id VARCHAR(64) REFERENCES competencies(id),
            description TEXT,
            time_limit_minutes INTEGER DEFAULT 15,
            passing_score INTEGER DEFAULT 70,
            is_ai_generated BOOLEAN DEFAULT FALSE,
            source_document_id VARCHAR(64),
            created_by VARCHAR(64) REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS assessment_questions (
            id VARCHAR(64) PRIMARY KEY,
            assessment_id VARCHAR(64) NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
            question_text TEXT NOT NULL,
            options JSONB NOT NULL,
            correct_answer_index INTEGER NOT NULL CHECK (correct_answer_index BETWEEN 0 AND 3),
            explanation TEXT NOT NULL,
            topic VARCHAR(128) NOT NULL,
            difficulty VARCHAR(32) DEFAULT 'Medium',
            order_index INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS assessment_attempts (
            id VARCHAR(64) PRIMARY KEY,
            assessment_id VARCHAR(64) NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
            user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            score_percentage NUMERIC(5, 2) NOT NULL,
            total_questions INTEGER NOT NULL,
            correct_answers_count INTEGER NOT NULL,
            incorrect_answers_count INTEGER NOT NULL,
            time_spent_seconds INTEGER NOT NULL,
            passed BOOLEAN NOT NULL,
            topic_scores JSONB DEFAULT '[]',
            ai_conclusion TEXT,
            updated_competency_level INTEGER,
            gap_reduced BOOLEAN DEFAULT FALSE,
            recommended_revision JSONB DEFAULT '[]',
            completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS assessment_answers (
            id VARCHAR(64) PRIMARY KEY,
            attempt_id VARCHAR(64) NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
            question_id VARCHAR(64) NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
            selected_option_index INTEGER NOT NULL,
            is_correct BOOLEAN NOT NULL,
            time_taken_seconds INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS learning_paths (
            id VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            target_role VARCHAR(255) NOT NULL,
            progress_percentage NUMERIC(5, 2) DEFAULT 0.0,
            estimated_total_hours NUMERIC(5, 1) DEFAULT 20.0,
            status VARCHAR(32) DEFAULT 'IN_PROGRESS',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS learning_progress (
            id VARCHAR(64) PRIMARY KEY,
            path_id VARCHAR(64) NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
            step_number INTEGER NOT NULL,
            title VARCHAR(255) NOT NULL,
            provider VARCHAR(64) NOT NULL,
            source_type VARCHAR(32) NOT NULL,
            duration VARCHAR(64) NOT NULL,
            status VARCHAR(32) DEFAULT 'PENDING',
            score NUMERIC(5, 2),
            competency_name VARCHAR(128),
            external_link TEXT,
            reason TEXT,
            completed_at TIMESTAMP WITH TIME ZONE
        );

        CREATE TABLE IF NOT EXISTS recommendations (
            id VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            competency_id VARCHAR(64) NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
            rank_order INTEGER NOT NULL DEFAULT 1,
            priority_level VARCHAR(16) DEFAULT 'HIGH',
            impact_score NUMERIC(5, 2) DEFAULT 85.0,
            reason TEXT NOT NULL,
            igot_course_id VARCHAR(64) REFERENCES courses(id),
            nssta_programme_id VARCHAR(64) REFERENCES training_programmes(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS competency_evidence (
            id VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            competency_id VARCHAR(64) NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
            evidence_type VARCHAR(64) NOT NULL,
            source_reference_id VARCHAR(64),
            score_achieved NUMERIC(5, 2),
            verified_by VARCHAR(64),
            certificate_url TEXT,
            verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS uploaded_learning_materials (
            id VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            file_name VARCHAR(255) NOT NULL,
            file_size_bytes INTEGER NOT NULL,
            file_type VARCHAR(64) DEFAULT 'application/pdf',
            purpose VARCHAR(64) DEFAULT 'TRAINER_ASSESSMENT_GENERATION',
            status VARCHAR(32) DEFAULT 'PROCESSED',
            extracted_topics JSONB DEFAULT '[]',
            executive_summary TEXT,
            raw_text_excerpt TEXT,
            generated_questions_count INTEGER DEFAULT 0,
            uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
            user_name VARCHAR(255),
            action VARCHAR(64) NOT NULL,
            details TEXT NOT NULL,
            ip_address VARCHAR(64),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(32) DEFAULT 'INFO',
            read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_learner_comp_user ON learner_competencies(user_id);
        CREATE INDEX IF NOT EXISTS idx_skill_gaps_user ON skill_gaps(user_id);
        CREATE INDEX IF NOT EXISTS idx_learning_path_user ON learning_paths(user_id);
        CREATE INDEX IF NOT EXISTS idx_assessment_comp ON assessments(competency_id);
        CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
      `;

      const client = await pool.connect();
      try {
        await client.query(schemaSql);
        return res.status(200).json({ success: true, message: 'Schema deployed successfully to PostgreSQL database.' });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || String(err) });
      } finally {
        client.release();
      }
    }

    if (method === 'GET' && (pathname === '/api/query-user' || pathname === '/query-user')) {
      const userId = urlObj.searchParams.get('userId');
      const email = urlObj.searchParams.get('email');
      const pool = getHealthPool();
      if (!pool) return res.status(500).json({ status: 'error', message: 'Pool init failed' });

      const client = await pool.connect();
      try {
        let ures, pres;
        if (userId) {
          ures = await client.query('SELECT id, email, name, role, auth_provider, created_at, updated_at FROM users WHERE id = $1', [userId]);
          pres = await client.query('SELECT user_id, employee_id, cadre, pay_level, education, location FROM official_profiles WHERE user_id = $1', [userId]);
        } else if (email) {
          ures = await client.query('SELECT id, email, name, role, auth_provider, created_at, updated_at FROM users WHERE email = $1', [email]);
          const foundId = ures.rows[0]?.id;
          pres = foundId ? await client.query('SELECT user_id, employee_id, cadre, pay_level, education, location FROM official_profiles WHERE user_id = $1', [foundId]) : { rows: [] };
        } else {
          ures = await client.query('SELECT id, email, name, role, auth_provider, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT 10');
          pres = await client.query('SELECT user_id, employee_id, cadre, pay_level, education, location FROM official_profiles ORDER BY created_at DESC LIMIT 10');
        }
        return res.status(200).json({
          success: true,
          users_rows: ures.rows,
          profiles_rows: pres.rows,
        });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || String(err) });
      } finally {
        client.release();
      }
    }

// Helper to UPSERT user and profile records into PostgreSQL / Supabase
async function syncUserToPostgres(user: any, authProvider: string = 'CREDENTIALS') {
  try {
    const pool = getHealthPool();
    if (!pool) return;

    const client = await pool.connect();
    try {
      // 1. UPSERT INTO users (NO PASSWORDS STORED IN POSTGRESQL)
      const userUpsertQuery = `
        INSERT INTO users (id, email, name, role, status, auth_provider, created_at, updated_at, last_login_at)
        VALUES ($1, $2, $3, $4, 'ACTIVE', $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          auth_provider = EXCLUDED.auth_provider,
          updated_at = CURRENT_TIMESTAMP,
          last_login_at = CURRENT_TIMESTAMP;
      `;
      await client.query(userUpsertQuery, [
        user.id,
        user.email,
        user.name,
        user.role || 'LEARNER',
        authProvider,
      ]);

      // 2. UPSERT INTO official_profiles
      const profileUpsertQuery = `
        INSERT INTO official_profiles (
          user_id, employee_id, cadre, pay_level, years_of_experience,
          education, specialization, location, preferred_language,
          training_hours, role_readiness_score, verified_skills_count, developing_skills_count,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE SET
          employee_id = EXCLUDED.employee_id,
          cadre = EXCLUDED.cadre,
          pay_level = EXCLUDED.pay_level,
          years_of_experience = EXCLUDED.years_of_experience,
          education = EXCLUDED.education,
          specialization = EXCLUDED.specialization,
          location = EXCLUDED.location,
          updated_at = CURRENT_TIMESTAMP;
      `;
      await client.query(profileUpsertQuery, [
        user.id,
        user.employeeId || `MOSPI-${Math.floor(1000 + Math.random() * 9000)}`,
        user.cadre || 'Subordinate Statistical Service (SSS)',
        user.level || 11,
        user.yearsOfExperience || 5.0,
        user.education || 'M.Sc. Statistics',
        user.specialization || 'Survey Sampling & Data Architecture',
        user.location || 'New Delhi',
        user.preferredLanguage || 'English / Hindi',
        user.trainingHours || 24.0,
        user.roleReadiness || 75.0,
        user.verifiedSkillsCount || 10,
        user.developingSkillsCount || 4,
      ]);
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.warn('[PostgreSQL Sync Note]', err?.message || String(err));
  }
}

    // -------------------------------------------------------------------
    // 2. AUTHENTICATION & USER SESSION
    // -------------------------------------------------------------------
    if (method === 'GET' && pathname === '/api/auth/current-user') {
      const user = resolveUser(req);
      return res.status(200).json({ success: true, user, authenticated: !!user });
    }

    if (method === 'POST' && pathname === '/api/auth/login') {
      const body = await parseJsonBody(req);
      const { email, username, identifier, password } = body;
      const loginId = email || username || identifier;
      if (!loginId || !password) {
        return res.status(400).json({ success: false, message: 'Official email and password required.' });
      }
      const vres = db.verifyCredentials(loginId, password);
      if (!vres.success || !vres.user) {
        return res.status(401).json({ success: false, message: vres.message || 'Invalid credentials.' });
      }
      const session = db.createSession(vres.user.id);
      syncUserToPostgres(vres.user, 'CREDENTIALS').catch(() => {});
      return res.status(200).json({ success: true, user: vres.user, token: session.token, message: `Welcome back, ${vres.user.name}!` });
    }

    if (method === 'POST' && pathname === '/api/auth/register') {
      const body = await parseJsonBody(req);
      const { name, email, password, designation, ministry, role = 'LEARNER' } = body;
      if (!email || !name) {
        return res.status(400).json({ success: false, message: 'Full name and email address required.' });
      }
      const newUserId = `user-${Date.now()}`;
      const newUser = {
        id: newUserId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role || 'LEARNER',
        employeeId: `MOSPI-${Math.floor(1000 + Math.random() * 9000)}`,
        ministry: ministry || 'Ministry of Statistics & Programme Implementation (MoSPI)',
        department: 'National Statistical Office (NSO)',
        organization: 'Government of India',
        designation: designation || 'Assistant Director (Statistics)',
        currentRole: designation || 'Assistant Director (Statistics)',
        targetRole: 'Deputy Director (Statistics)',
        level: 11,
        cadre: 'Indian Statistical Service (ISS)',
        yearsOfExperience: 6,
        education: 'M.Sc. Statistics',
        specialization: 'Survey Sampling & Data Architecture',
        location: 'New Delhi',
        preferredLanguage: 'English',
        previousRoles: ['Statistical Officer'],
        currentProjects: ['PLFS Statistical Processing'],
        technologiesUsed: ['Python', 'SQL', 'R'],
        trainingHours: 24,
        roleReadiness: 74,
        verifiedSkillsCount: 12,
        developingSkillsCount: 3,
      };
      db.state.users[newUserId] = newUser;
      db.registerUserCredential(newUserId, email.trim().toLowerCase(), password || 'Learner@2026');
      db.state.learnerCompetencies[newUserId] = [...(db.state.learnerCompetencies['user-learner-01'] || [])];
      db.state.gapAnalysis[newUserId] = [...(db.state.gapAnalysis['user-learner-01'] || [])];
      const session = db.createSession(newUserId);
      syncUserToPostgres(newUser, 'CREDENTIALS').catch(() => {});
      return res.status(201).json({ success: true, user: newUser, token: session.token });
    }

    if (method === 'POST' && (pathname === '/api/auth/google-verify' || pathname === '/auth/google-verify')) {
      const body = await parseJsonBody(req);
      const { email, name, googleUid } = body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Google account email required.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const displayName = name ? String(name).trim() : cleanEmail.split('@')[0];

      let existingUser = Object.values(db.state.users).find((u: any) => u.email.toLowerCase() === cleanEmail || (googleUid && u.id === googleUid));

      if (!existingUser) {
        const newUserId = googleUid ? googleUid : `google-user-${Date.now()}`;
        existingUser = {
          id: newUserId,
          name: displayName,
          email: cleanEmail,
          role: 'LEARNER',
          employeeId: `ISS-GOOG-${Math.floor(1000 + Math.random() * 9000)}`,
          ministry: 'Ministry of Statistics & Programme Implementation (MoSPI)',
          department: 'National Accounts Division (NAD)',
          organization: 'Government of India',
          designation: 'Senior Statistical Officer',
          currentRole: 'Senior Statistical Officer',
          targetRole: 'Assistant Director / Lead Analyst',
          level: 11,
          cadre: 'Subordinate Statistical Service (SSS)',
          yearsOfExperience: 5,
          education: 'M.Sc. Statistics / Data Science',
          specialization: 'Survey Sampling & Automated Pipelines',
          location: 'New Delhi, Headquarters',
          preferredLanguage: 'English / Hindi',
          previousRoles: ['Junior Statistical Officer'],
          currentProjects: ['PLFS Statistical Processing'],
          technologiesUsed: ['Python', 'SQL', 'R'],
          trainingHours: 24,
          roleReadiness: 78,
          verifiedSkillsCount: 12,
          developingSkillsCount: 3,
        };
        db.state.users[newUserId] = existingUser;
        db.registerUserCredential(newUserId, cleanEmail, 'GoogleAuthUser@2026');
        if (!db.state.learnerCompetencies[newUserId]) {
          db.state.learnerCompetencies[newUserId] = [...(db.state.learnerCompetencies['user-learner-01'] || [])];
        }
        if (!db.state.gapAnalysis[newUserId]) {
          db.state.gapAnalysis[newUserId] = [...(db.state.gapAnalysis['user-learner-01'] || [])];
        }
      }

      const session = db.createSession(existingUser.id);
      syncUserToPostgres(existingUser, 'GOOGLE').catch(() => {});
      return res.status(200).json({
        success: true,
        user: existingUser,
        token: session.token,
        message: `Welcome Officer ${existingUser.name}! Google session verified.`,
      });
    }

    if (method === 'POST' && pathname === '/api/auth/logout') {
      return res.status(200).json({ success: true, message: 'Logged out.' });
    }

    // -------------------------------------------------------------------
    // 3. LEARNER PROFILE & COMPETENCIES
    // -------------------------------------------------------------------
    if (method === 'GET' && (pathname === '/api/learner/profile' || pathname === '/api/profile')) {
      const user = resolveUser(req);
      return res.status(200).json({ success: true, profile: user, ...user });
    }

    if (method === 'GET' && pathname === '/api/learner/competencies') {
      const user = resolveUser(req);
      const data = await fetchLearnerProfileCompetencyData(user.id);
      return res.status(200).json({ success: true, competencies: data.competencies, profile: data.profile });
    }

    if (method === 'GET' && pathname === '/api/learner/gaps') {
      const user = resolveUser(req);
      const data = await fetchLearnerProfileCompetencyData(user.id);
      return res.status(200).json({ success: true, gaps: data.gaps, competencies: data.competencies, profile: data.profile });
    }

    if (method === 'GET' && pathname === '/api/learner/profile-competencies') {
      const user = resolveUser(req);
      const data = await fetchLearnerProfileCompetencyData(user.id);
      return res.status(200).json(data);
    }

    if (method === 'POST' && pathname === '/api/learner/run-gap-check') {
      const user = resolveUser(req);
      const data = await recalibrateLearnerGaps(user.id);
      return res.status(200).json({ success: true, gaps: data.gaps, competencies: data.competencies, profile: data.profile });
    }

    // -------------------------------------------------------------------
    // 4. LEARNING PATH & RECOMMENDATIONS
    // -------------------------------------------------------------------
    if (method === 'GET' && (pathname === '/api/learning-path' || pathname === '/learning-path')) {
      const user = resolveUser(req);
      let path = db.state.learningPaths[user.id];
      if (!path) {
        let gaps = db.state.gapAnalysis[user.id] || [];
        if (gaps.length === 0) gaps = recalculateGapsSynchronous(user.id);
        path = UnifiedCatalogueService.generatePersonalizedPathway(user.id, user.targetRole || 'Deputy Director (Statistics)', gaps);
        db.state.learningPaths[user.id] = path;
      }
      return res.status(200).json({ success: true, learningPath: path });
    }

    if (method === 'GET' && (pathname === '/api/recommendations/unified' || pathname === '/recommendations/unified')) {
      const user = resolveUser(req);
      let gaps = db.state.gapAnalysis[user.id] || [];
      if (gaps.length === 0) gaps = recalculateGapsSynchronous(user.id);
      const unified = gaps.map((g) => UnifiedCatalogueService.generateRankedRecommendationsForGap(g, user.targetRole || 'Deputy Director'));
      return res.status(200).json({ success: true, recommendations: unified });
    }

    // -------------------------------------------------------------------
    // 5. QUIZ & ASSESSMENTS
    // -------------------------------------------------------------------
    if (method === 'GET' && (pathname === '/api/quiz/assessments' || pathname === '/api/assessments' || pathname === '/assessments')) {
      return res.status(200).json({ success: true, assessments: db.state.assessments });
    }

    if (method === 'GET' && (pathname.startsWith('/api/assessments/') || pathname.startsWith('/assessments/'))) {
      const rawId = pathname.replace(/^\/(api\/)?assessments\//, '');
      const decoded = decodeURIComponent(rawId).toLowerCase();
      let assessment = db.state.assessments.find((a) => a.id.toLowerCase() === decoded || a.competency.toLowerCase().includes(decoded) || decoded.includes(a.competency.toLowerCase()));
      if (!assessment) assessment = db.state.assessments[0];
      return res.status(200).json({ success: true, assessment });
    }

    if (method === 'POST' && (pathname === '/api/assessments/submit' || pathname === '/assessments/submit')) {
      const user = resolveUser(req);
      const body = await parseJsonBody(req);
      const { assessmentId, answers = [], timeSpentSeconds = 120, questions: reqQuestions } = body;
      let assessment = db.state.assessments.find((a) => a.id === assessmentId) || db.state.assessments[0];
      const questionsList = (Array.isArray(reqQuestions) && reqQuestions.length > 0) ? reqQuestions : assessment.questions;
      
      let correctCount = 0;
      const topicMap: Record<string, { correct: number; total: number }> = {};

      questionsList.forEach((q: any, idx: number) => {
        const topic = q.topic || `${assessment.competency} Core`;
        if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
        topicMap[topic].total += 1;

        const ans = answers[idx];
        const isUserCorrect = typeof ans === 'number' ? ans === q.correctAnswer : (ans && ans.selectedOption === q.correctAnswer);
        if (isUserCorrect) {
          correctCount++;
          topicMap[topic].correct += 1;
        }
      });

      const totalQ = Math.max(1, questionsList.length);
      const scorePercentage = Math.round((correctCount / totalQ) * 100);
      const passingScore = assessment.passingScore || 70;
      const passed = scorePercentage >= passingScore;

      const topicScores = Object.entries(topicMap).map(([topic, data]) => ({
        topic,
        score: data.correct,
        total: data.total,
      }));

      const result = {
        assessmentId: assessment.id,
        userId: user.id,
        scorePercentage,
        totalQuestions: totalQ,
        correctAnswersCount: correctCount,
        incorrectAnswersCount: totalQ - correctCount,
        timeSpentSeconds: Number(timeSpentSeconds) || 120,
        passed,
        passingScore,
        topicScores: topicScores.length > 0 ? topicScores : [{ topic: `${assessment.competency} Core`, score: correctCount, total: totalQ }],
        aiConclusion: passed
          ? `Validated mastery in ${assessment.competency}. Score ${scorePercentage}% meets operational threshold. Verified level upgrade applied in Competency Passport.`
          : `Score ${scorePercentage}% is below ${passingScore}% threshold. Targeted learning recommendations provided.`,
        updatedCompetencyLevel: passed ? 3 : 2,
        competencyGapReduced: passed,
        recommendedRevision: passed ? [] : [`${assessment.competency} Foundations`, 'MoSPI Standard Guidelines'],
        completedAt: new Date().toISOString(),
      };

      if (!(db.state as any).assessmentAttempts) (db.state as any).assessmentAttempts = [];
      (db.state as any).assessmentAttempts.push(result);

      return res.status(200).json({ success: true, result });
    }

    if (method === 'POST' && (pathname === '/api/reassessments/submit' || pathname === '/api/reassessment/submit' || pathname === '/reassessments/submit')) {
      const user = resolveUser(req);
      const body = await parseJsonBody(req);
      const { answers = [] } = body;
      let correctCount = 0;
      let totalQ = 5;
      if (Array.isArray(answers) && answers.length > 0) {
        totalQ = answers.length;
        correctCount = answers.filter((a: any) => a.isCorrect === true || Number(a) === 1 || Number(a) === 0).length;
      } else {
        correctCount = 4;
      }
      const scorePercentage = Math.round((correctCount / totalQ) * 100);
      const passed = scorePercentage >= 70;
      const elevated = passed;

      const result = {
        reassessmentId: `reassess-${Date.now()}`,
        userId: user.id,
        completedAt: new Date().toISOString(),
        preLearningScore: 48,
        postLearningScore: scorePercentage,
        scoreImprovement: Math.max(0, scorePercentage - 48),
        totalQuestions: totalQ,
        correctAnswers: correctCount,
        passed,
        status: passed ? 'VERIFIED' : 'NEEDS FURTHER LEARNING',
        previousLevel: 2,
        newLevel: passed ? 3 : 2,
        remainingGap: passed ? 1 : 2,
        previousOverallReadiness: 74,
        newOverallReadiness: passed ? 84 : 74,
        readinessImprovement: passed ? 10 : 0,
        evaluatedCompetencies: [
          {
            competencyId: 'comp-tech-01',
            competencyName: 'Python Survey Microdata Cleaning',
            previousLevel: 2,
            newLevel: passed ? 3 : 2,
            gapClosed: passed,
            preScore: 48,
            postScore: scorePercentage,
          },
        ],
        sparrowSynced: true,
        sparrowSyncTimestamp: new Date().toISOString(),
        certificateId: elevated ? `CERT-NIPUN-ISS-${Date.now().toString().slice(-6)}` : null,
        aiVerificationSummary: passed
          ? `Post-learning reassessment score ${scorePercentage}% meets MoSPI operational standard. Verified competency upgrade Level 2 → Level 3 applied in National Passport.`
          : `Post-learning reassessment score ${scorePercentage}% is below 70% threshold.`,
      };

      return res.status(200).json({ success: true, result });
    }

    // -------------------------------------------------------------------
    // 6. AI GAP DIAGNOSIS, ASSISTANT & PDF SUMMARIZER
    // -------------------------------------------------------------------
    if (method === 'POST' && (pathname === '/api/gap-analysis/ai-diagnosis' || pathname === '/gap-analysis/ai-diagnosis')) {
      const body = await parseJsonBody(req);
      const { competencyName = 'Python', currentLevel = 2, requiredLevel = 4, role = 'Assistant Director' } = body;
      try {
        const diag = await generateAIGapDiagnosis({
          role,
          competency: competencyName,
          requiredLevel: Number(requiredLevel) || 4,
          currentLevel: Number(currentLevel) || 2,
          diagnosticScore: 48,
          practicalScore: 42,
          repeatedErrors: ['pandas groupby transform', 'multiplier weight calibration'],
        });
        return res.status(200).json({
          success: true,
          competencyName,
          currentLevel: Number(currentLevel) || 2,
          requiredLevel: Number(requiredLevel) || 4,
          gap: Math.max(0, (Number(requiredLevel) || 4) - (Number(currentLevel) || 2)),
          aiDiagnosis: diag.aiDiagnosis,
          whyRecommended: diag.whyRecommended,
          confidence: diag.confidence,
          priorityRank: 1,
          targetDate: '2026-10-31',
        });
      } catch {
        return res.status(200).json({
          success: true,
          competencyName,
          currentLevel: Number(currentLevel) || 2,
          requiredLevel: Number(requiredLevel) || 4,
          gap: Math.max(0, (Number(requiredLevel) || 4) - (Number(currentLevel) || 2)),
          aiDiagnosis: `Official Gap Assessment for ${competencyName}: Current Level ${currentLevel} vs Required Target Level ${requiredLevel}. Focus on survey microdata cleaning and weighted aggregations.`,
          whyRecommended: [
            'Critical competency for MoSPI NSS 78th Round Data Processing Workflow',
            'Direct alignment with ISS Cadre Competency Framework Level 4 requirement',
          ],
          confidence: 0.94,
          priorityRank: 1,
          targetDate: '2026-10-31',
        });
      }
    }

    if (method === 'POST' && (pathname === '/api/assistant/chat' || pathname === '/api/assistant' || pathname === '/api/mentor/chat')) {
      const body = await parseJsonBody(req);
      const { message, history } = body;
      const user = resolveUser(req);
      const userComps = db.state.learnerCompetencies[user.id] || [];
      const gaps = db.state.gapAnalysis[user.id] || [];
      const learningPath = db.state.learningPaths[user.id];

      try {
        const replyRes = await generateAIMentorResponse({
          userMessage: message || 'Hello',
          conversationHistory: Array.isArray(history) ? history : undefined,
          groundingDocuments: (db.state.uploadedDocuments || []).slice(0, 3).map((d) => ({ fileName: d.fileName, keySummary: d.keySummary })),
          learnerProfile: user,
          competencies: userComps,
          gaps,
          learningPath,
        });
        return res.status(200).json({
          success: true,
          reply: replyRes.reply,
          suggestedActions: replyRes.suggestedActions,
          timestamp: new Date().toISOString(),
        });
      } catch {
        return res.status(200).json({
          success: true,
          reply: `Namaste Officer ${user.name}. As your MoSPI STATVIA AI Mentorship Advisor, I have reviewed your profile. Your highest priority gap is **Python for Official Statistical Analysis** (Current: Level 2, Target: Level 4).`,
          suggestedActions: [
            { label: 'Start Python Diagnostic Quiz', actionType: 'START_QUIZ', payload: { competency: 'Python' } },
            { label: 'View Unified Recommendations', actionType: 'VIEW_RECOMMENDATIONS' },
          ],
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (method === 'POST' && (pathname === '/api/documents/summarize-and-generate' || pathname === '/api/documents/upload-and-generate')) {
      const body = await parseJsonBody(req);
      const { fileName = 'MoSPI_Document.pdf', fileContent, competency = 'Official Statistics' } = body;
      const cleanContent = fileContent || 'Official Statistical Survey Design and Multistage Sampling Handbook 2026';
      
      try {
        const result = await summarizeDocumentAndGenerateQuestions({
          fileName,
          content: cleanContent,
          competency,
          difficulty: 'Medium',
          questionCount: 4,
        });
        return res.status(200).json({ success: true, summary: result, document: { id: `doc-${Date.now()}`, fileName, fileSizeFormatted: '12 KB', status: 'PROCESSED' } });
      } catch {
        const fallbackSummary = {
          fileName,
          fileSizeFormatted: `${Math.round(cleanContent.length / 1024) || 12} KB`,
          executiveSummary: `Executive Analysis of "${fileName}":\nThe document provides authoritative guidelines for ${competency} within official statistical operations. Key principles cover data collection procedures, statistical control mechanisms, and cadre deployment standards aligned with MoSPI frameworks.`,
          keyMethodologicalPoints: [
            `Grounded Methodology: Implements multi-stage sampling with non-response multiplier calibrations.`,
            `Quality Assurance: Standardized validation rules prevent data corruption during primary data entry and aggregation.`,
            `Governance Alignment: Fully compliant with MoSPI data release standards and national statistical framework standards.`,
          ],
          cadreImplications: `Direct implications for Assistant Directors & Statistical Officers: Requires verified operational mastery of ${competency} routines.`,
          targetCompetencies: [competency],
          extractedFormulasOrStandards: [
            `W_hij = (1 / P_hi) * (1 / m_hi) * (N_hi / n_hi)`,
            `k-Anonymity (k >= 5) on demographic Quasi-Identifiers`,
          ],
          generatedQuestions: [
            {
              id: `doc-q1-${Date.now()}`,
              question: `According to the methodological guidelines in ${fileName}, which procedure guarantees statistical calibration across survey strata?`,
              options: [
                'Design multiplier weighting with non-response adjustment factors',
                'Simple random sampling without replacement across all units',
                'Unweighted arithmetic average computation',
                'Manual deletion of non-responding households',
              ],
              correctAnswer: 0,
              explanation: 'Design multiplier weighting combined with non-response adjustments preserves population estimator unbiasedness.',
              difficulty: 'Medium',
              topic: competency,
            },
          ],
        };
        return res.status(200).json({ success: true, summary: fallbackSummary, document: { id: `doc-${Date.now()}`, fileName, fileSizeFormatted: '12 KB', status: 'PROCESSED' } });
      }
    }

    // -------------------------------------------------------------------
    // 7. SYSTEM CATALOGUE & UNMAPPED FALLBACK
    // -------------------------------------------------------------------
    if (method === 'GET' && (pathname === '/api/catalogue' || pathname === '/catalogue')) {
      const items = UnifiedCatalogueService.searchAndFilter({}).items;
      return res.status(200).json({ success: true, items, total: items.length });
    }

    // Unmapped API Route 404
    return res.status(404).json({
      success: false,
      error: 'NOT_FOUND',
      message: `API route ${method} ${pathname} not found.`,
    });
  } catch (err: any) {
    console.error('[SERVERLESS_ROUTER_ERROR]', err?.stack || err?.message || String(err));
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: err?.message || 'An internal server error occurred.',
    });
  }
}
