-- ============================================================================
-- NIPUN (National Initiative for Statistical Capacity Building & Competency Intelligence)
-- Complete PostgreSQL Database Schema
-- Ministry of Statistics and Programme Implementation (MoSPI), Government of India
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS & DIVISIONS
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_code VARCHAR(32) NOT NULL,
    ministry VARCHAR(255) DEFAULT 'Ministry of Statistics & Programme Implementation',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CADRES & ROLES
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    cadre VARCHAR(64) NOT NULL, -- e.g. 'ISS', 'SSS', 'CSS'
    pay_level INTEGER NOT NULL, -- 7 to 17
    description TEXT,
    gazetted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. USERS & CREDENTIALS
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'LEARNER', -- 'LEARNER', 'TRAINER', 'ADMINISTRATOR'
    status VARCHAR(32) DEFAULT 'ACTIVE', -- 'ACTIVE', 'SUSPENDED'
    auth_provider VARCHAR(32) DEFAULT 'CREDENTIALS', -- 'CREDENTIALS', 'PARICHAY_SSO', 'GOOGLE'
    password_hash VARCHAR(255),
    password_salt VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- 4. OFFICIAL CADRE PROFILES
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

-- 5. OFFICIAL ASSIGNMENTS & POSTINGS
CREATE TABLE IF NOT EXISTS assignments (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL, -- e.g. 'PLFS Annual Round 2026', 'Quarterly GDP Revision'
    department_id VARCHAR(64) REFERENCES departments(id),
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT TRUE,
    role_in_project VARCHAR(128),
    key_technologies JSONB DEFAULT '[]', -- ['Python', 'pandas', 'CSPro', 'SQL']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. COMPETENCY FRAMEWORK (NIPUN 4 Domains)
CREATE TABLE IF NOT EXISTS competency_framework (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(64) NOT NULL, -- 'STATISTICAL_COMPETENCIES', 'TECHNICAL_COMPETENCIES', 'DIGITAL_GOVERNANCE', 'BEHAVIOURAL_MANAGERIAL'
    description TEXT NOT NULL,
    frac_aligned BOOLEAN DEFAULT TRUE,
    version VARCHAR(16) DEFAULT '2.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. COMPETENCY DEFINITIONS & LEVEL RUBRICS (L1 to L5)
CREATE TABLE IF NOT EXISTS competencies (
    id VARCHAR(64) PRIMARY KEY,
    framework_id VARCHAR(64) REFERENCES competency_framework(id),
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    weight NUMERIC(3, 2) DEFAULT 1.0,
    level_1_rubric TEXT, -- L1 Beginner
    level_2_rubric TEXT, -- L2 Basic
    level_3_rubric TEXT, -- L3 Intermediate
    level_4_rubric TEXT, -- L4 Advanced
    level_5_rubric TEXT, -- L5 Expert
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. ROLE COMPETENCY REQUIREMENTS (Benchmark levels for each role)
CREATE TABLE IF NOT EXISTS role_competency_requirements (
    id VARCHAR(64) PRIMARY KEY,
    role_id VARCHAR(64) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    competency_id VARCHAR(64) NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
    required_level INTEGER NOT NULL CHECK (required_level BETWEEN 1 AND 5),
    is_mandatory BOOLEAN DEFAULT TRUE,
    priority VARCHAR(16) DEFAULT 'HIGH', -- 'HIGH', 'MEDIUM', 'LOW'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (role_id, competency_id)
);

-- 9. LEARNER COMPETENCIES (Current levels, status, evidence)
CREATE TABLE IF NOT EXISTS learner_competencies (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    competency_id VARCHAR(64) NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
    current_level INTEGER NOT NULL DEFAULT 1 CHECK (current_level BETWEEN 1 AND 5),
    required_level INTEGER NOT NULL DEFAULT 3 CHECK (required_level BETWEEN 1 AND 5),
    status VARCHAR(32) NOT NULL DEFAULT 'DEVELOPING', -- 'VERIFIED', 'DEVELOPING', 'CRITICAL_GAP', 'NOT_ASSESSED'
    gap_type VARCHAR(32) DEFAULT 'APPLICATION_GAP', -- 'KNOWLEDGE_GAP', 'APPLICATION_GAP', 'NONE'
    confidence NUMERIC(3, 2) DEFAULT 0.85,
    trend VARCHAR(32) DEFAULT 'STABLE', -- 'IMPROVED', 'STABLE', 'NEEDS_ATTENTION'
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

-- 10. SKILL GAPS (Deterministic Gap Analysis)
CREATE TABLE IF NOT EXISTS skill_gaps (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    competency_id VARCHAR(64) NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
    required_level INTEGER NOT NULL,
    current_level INTEGER NOT NULL,
    gap_magnitude INTEGER NOT NULL, -- required_level - current_level
    gap_type VARCHAR(32) NOT NULL, -- 'KNOWLEDGE_GAP', 'APPLICATION_GAP'
    priority VARCHAR(16) NOT NULL, -- 'HIGH', 'MEDIUM', 'LOW'
    knowledge_gap_score NUMERIC(5, 2) DEFAULT 0.0,
    application_gap_score NUMERIC(5, 2) DEFAULT 0.0,
    retention_risk_score NUMERIC(5, 2) DEFAULT 0.0,
    ai_diagnosis TEXT,
    why_recommended JSONB DEFAULT '[]',
    status VARCHAR(32) DEFAULT 'OPEN', -- 'OPEN', 'IN_PROGRESS', 'CLOSED'
    identified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- 11. COURSES (iGOT Karmayogi & Digital Catalog)
CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(64) PRIMARY KEY,
    provider VARCHAR(64) NOT NULL DEFAULT 'iGOT Karmayogi',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    competency_id VARCHAR(64) REFERENCES competencies(id),
    target_level INTEGER NOT NULL DEFAULT 3,
    category VARCHAR(64) DEFAULT 'Official Statistics',
    difficulty VARCHAR(32) DEFAULT 'Intermediate',
    duration VARCHAR(64) NOT NULL, -- e.g. '2h 30m'
    rating NUMERIC(2, 1) DEFAULT 4.8,
    enrolled_count INTEGER DEFAULT 0,
    course_url TEXT NOT NULL,
    is_frac_certified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. TRAINING PROGRAMMES (NSSTA Greater Noida & TPAC)
CREATE TABLE IF NOT EXISTS training_programmes (
    id VARCHAR(64) PRIMARY KEY,
    academy VARCHAR(64) NOT NULL DEFAULT 'NSSTA',
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL, -- 'Mandatory Cadre Induction', 'In-Service Refresher', 'Specialized Lab'
    duration VARCHAR(64) NOT NULL, -- e.g. '3 Days', '2 Weeks'
    mode VARCHAR(64) NOT NULL DEFAULT 'In-Person (NSSTA Campus, Greater Noida)',
    target_cadre VARCHAR(128) NOT NULL, -- 'ISS / SSS Officers'
    eligibility TEXT,
    tpac_aligned BOOLEAN DEFAULT TRUE,
    upcoming_batch_date VARCHAR(64),
    seats_available INTEGER DEFAULT 25,
    description TEXT,
    curriculum_modules JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. ASSESSMENTS & DIAGNOSTIC QUIZZES
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

-- 14. ASSESSMENT QUESTIONS
CREATE TABLE IF NOT EXISTS assessment_questions (
    id VARCHAR(64) PRIMARY KEY,
    assessment_id VARCHAR(64) NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- ["Option A", "Option B", "Option C", "Option D"]
    correct_answer_index INTEGER NOT NULL CHECK (correct_answer_index BETWEEN 0 AND 3),
    explanation TEXT NOT NULL,
    topic VARCHAR(128) NOT NULL,
    difficulty VARCHAR(32) DEFAULT 'Medium',
    order_index INTEGER DEFAULT 0
);

-- 15. ASSESSMENT ATTEMPTS & EVALUATIONS
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

-- 16. ASSESSMENT ANSWERS (Individual question responses)
CREATE TABLE IF NOT EXISTS assessment_answers (
    id VARCHAR(64) PRIMARY KEY,
    attempt_id VARCHAR(64) NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    question_id VARCHAR(64) NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
    selected_option_index INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_taken_seconds INTEGER DEFAULT 0
);

-- 17. LEARNING PATHS (Personalized ICBP)
CREATE TABLE IF NOT EXISTS learning_paths (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_role VARCHAR(255) NOT NULL,
    progress_percentage NUMERIC(5, 2) DEFAULT 0.0,
    estimated_total_hours NUMERIC(5, 1) DEFAULT 20.0,
    status VARCHAR(32) DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS', 'COMPLETED', 'PAUSED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. LEARNING PATH ITEMS (Steps: Foundation -> Advanced -> Lab -> Assessment -> Reassessment)
CREATE TABLE IF NOT EXISTS learning_progress (
    id VARCHAR(64) PRIMARY KEY,
    path_id VARCHAR(64) NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    provider VARCHAR(64) NOT NULL, -- 'iGOT', 'NSSTA', 'STATVIA', 'NIPUN_QUIZ'
    source_type VARCHAR(32) NOT NULL, -- 'DIAGNOSTIC', 'IGOT', 'PRACTICE', 'NSSTA', 'QUIZ', 'VERIFICATION'
    duration VARCHAR(64) NOT NULL,
    status VARCHAR(32) DEFAULT 'PENDING', -- 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'
    score NUMERIC(5, 2),
    competency_name VARCHAR(128),
    external_link TEXT,
    reason TEXT,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 19. UNIFIED RECOMMENDATIONS
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

-- 20. COMPETENCY EVIDENCE (Audit trail of verified skills)
CREATE TABLE IF NOT EXISTS competency_evidence (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    competency_id VARCHAR(64) NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
    evidence_type VARCHAR(64) NOT NULL, -- 'DIAGNOSTIC_ASSESSMENT', 'PRACTICE_SIMULATION', 'IGOT_COURSE_COMPLETION', 'NSSTA_RESIDENTIAL_BATCH', 'REASSESSMENT_CERTIFICATION'
    source_reference_id VARCHAR(64),
    score_achieved NUMERIC(5, 2),
    verified_by VARCHAR(64),
    certificate_url TEXT,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 21. UPLOADED LEARNING MATERIALS & DOCUMENTS (Trainer PDF/Docs)
CREATE TABLE IF NOT EXISTS uploaded_learning_materials (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    file_type VARCHAR(64) DEFAULT 'application/pdf',
    purpose VARCHAR(64) DEFAULT 'TRAINER_ASSESSMENT_GENERATION',
    status VARCHAR(32) DEFAULT 'PROCESSED', -- 'UPLOADING', 'PROCESSING', 'PROCESSED', 'FAILED'
    extracted_topics JSONB DEFAULT '[]',
    executive_summary TEXT,
    raw_text_excerpt TEXT,
    generated_questions_count INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 22. AUDIT LOGS (Compliance & Security Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    action VARCHAR(64) NOT NULL,
    details TEXT NOT NULL,
    ip_address VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 23. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(32) DEFAULT 'INFO', -- 'INFO', 'SUCCESS', 'WARNING', 'ALERT'
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-performance querying
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_learner_comp_user ON learner_competencies(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_gaps_user ON skill_gaps(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_user ON learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_comp ON assessments(competency_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
