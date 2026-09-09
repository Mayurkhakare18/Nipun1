-- ============================================================================
-- NIPUN Supabase Security Migration: Enforce Strict RLS & Ownership Policies
-- ============================================================================

-- 1. Remove permissive OR true policies on core tables
DROP POLICY IF EXISTS "Users can read own record" ON users;
CREATE POLICY "Users can read own record" ON users 
  FOR SELECT USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Users can read own profile" ON official_profiles;
CREATE POLICY "Users can read own profile" ON official_profiles 
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Learners can view own competencies" ON learner_competencies;
CREATE POLICY "Learners can view own competencies" ON learner_competencies 
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Learners can view own gaps" ON skill_gaps;
CREATE POLICY "Learners can view own gaps" ON skill_gaps 
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Learners can view own learning paths" ON learning_paths;
CREATE POLICY "Learners can view own learning paths" ON learning_paths 
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Learners can view own assessment attempts" ON assessment_attempts;
CREATE POLICY "Learners can view own assessment attempts" ON assessment_attempts 
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Learners can insert own assessment attempts" ON assessment_attempts;
CREATE POLICY "Learners can insert own assessment attempts" ON assessment_attempts 
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- 2. Add owner policies for remaining sensitive user-owned tables
DROP POLICY IF EXISTS "Learners can view own assessment answers" ON assessment_answers;
CREATE POLICY "Learners can view own assessment answers" ON assessment_answers 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessment_attempts 
      WHERE assessment_attempts.id = assessment_answers.attempt_id 
        AND assessment_attempts.user_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Learners can insert own assessment answers" ON assessment_answers;
CREATE POLICY "Learners can insert own assessment answers" ON assessment_answers 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM assessment_attempts 
      WHERE assessment_attempts.id = assessment_answers.attempt_id 
        AND assessment_attempts.user_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Learners can view own evidence" ON competency_evidence;
CREATE POLICY "Learners can view own evidence" ON competency_evidence 
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Learners can view own materials" ON uploaded_learning_materials;
CREATE POLICY "Learners can view own materials" ON uploaded_learning_materials 
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Learners can view own notifications" ON notifications;
CREATE POLICY "Learners can view own notifications" ON notifications 
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Learners can view own recommendations" ON recommendations;
CREATE POLICY "Learners can view own recommendations" ON recommendations 
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Learners can view own audit logs" ON audit_logs;
CREATE POLICY "Learners can view own audit logs" ON audit_logs 
  FOR SELECT USING (auth.uid()::text = user_id::text);
