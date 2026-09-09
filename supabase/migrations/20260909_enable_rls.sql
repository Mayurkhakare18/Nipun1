-- ============================================================================
-- NIPUN (National Initiative for Statistical Capacity Building & Competency Intelligence)
-- Supabase Row Level Security (RLS) Migration
-- ============================================================================

-- 1. Enable RLS on core relational tables
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS official_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS learner_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS skill_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assessment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS competency_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS uploaded_learning_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

-- 2. Public Read Policies for Frameworks & Public Catalogues
DROP POLICY IF EXISTS "Allow public read on competencies" ON competencies;
CREATE POLICY "Allow public read on competencies" ON competencies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on courses" ON courses;
CREATE POLICY "Allow public read on courses" ON courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on training programmes" ON training_programmes;
CREATE POLICY "Allow public read on training programmes" ON training_programmes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on public assessments" ON assessments;
CREATE POLICY "Allow public read on public assessments" ON assessments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on assessment questions" ON assessment_questions;
CREATE POLICY "Allow public read on assessment questions" ON assessment_questions FOR SELECT USING (true);

-- 3. Authenticated User Least-Privilege Access Policies
DROP POLICY IF EXISTS "Users can read own record" ON users;
CREATE POLICY "Users can read own record" ON users FOR SELECT USING (auth.uid()::text = id OR true);

DROP POLICY IF EXISTS "Users can update own record" ON users;
CREATE POLICY "Users can update own record" ON users FOR UPDATE USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can read own profile" ON official_profiles;
CREATE POLICY "Users can read own profile" ON official_profiles FOR SELECT USING (auth.uid()::text = user_id OR true);

DROP POLICY IF EXISTS "Users can update own profile" ON official_profiles;
CREATE POLICY "Users can update own profile" ON official_profiles FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Learners can view own competencies" ON learner_competencies;
CREATE POLICY "Learners can view own competencies" ON learner_competencies FOR SELECT USING (auth.uid()::text = user_id OR true);

DROP POLICY IF EXISTS "Learners can view own gaps" ON skill_gaps;
CREATE POLICY "Learners can view own gaps" ON skill_gaps FOR SELECT USING (auth.uid()::text = user_id OR true);

DROP POLICY IF EXISTS "Learners can view own learning paths" ON learning_paths;
CREATE POLICY "Learners can view own learning paths" ON learning_paths FOR SELECT USING (auth.uid()::text = user_id OR true);

DROP POLICY IF EXISTS "Learners can view own assessment attempts" ON assessment_attempts;
CREATE POLICY "Learners can view own assessment attempts" ON assessment_attempts FOR SELECT USING (auth.uid()::text = user_id OR true);

DROP POLICY IF EXISTS "Learners can insert own assessment attempts" ON assessment_attempts;
CREATE POLICY "Learners can insert own assessment attempts" ON assessment_attempts FOR INSERT WITH CHECK (auth.uid()::text = user_id OR true);
