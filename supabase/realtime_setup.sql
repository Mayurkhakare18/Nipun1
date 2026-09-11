-- ============================================================================
-- NIPUN — SUPABASE REALTIME & REPLICA IDENTITY SETUP SCRIPT
-- Run this script in the Supabase Dashboard SQL Editor for project:
-- https://supabase.com/dashboard/project/dnrqtmadtmgizqdchrbk/sql
-- ============================================================================

-- 1. Helper functions for Role-Based Row Level Security (RLS)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.users WHERE id = (auth.uid())::text LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_trainer_or_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = (auth.uid())::text 
      AND role IN ('TRAINER', 'ADMINISTRATOR')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = (auth.uid())::text 
      AND role = 'ADMINISTRATOR'
  );
$$;

-- 2. Enable REPLICA IDENTITY FULL on target tables for realtime CDC
ALTER TABLE IF EXISTS public.users REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.official_profiles REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.learner_competencies REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.skill_gaps REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.learning_paths REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.learning_progress REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.assessment_attempts REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.competency_evidence REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.uploaded_learning_materials REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.notifications REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.assignments REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.audit_logs REPLICA IDENTITY FULL;

-- 3. Ensure publication supabase_realtime includes all 12 tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
DECLARE
  tbl text;
  tbls text[] := ARRAY[
    'users',
    'official_profiles',
    'learner_competencies',
    'skill_gaps',
    'learning_paths',
    'learning_progress',
    'assessment_attempts',
    'competency_evidence',
    'uploaded_learning_materials',
    'notifications',
    'assignments',
    'audit_logs'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END LOOP;
END $$;

-- 4. Row Level Security (RLS) Policies for Realtime CDC Authorization

-- users & official_profiles (Trainer and Admin read access)
DROP POLICY IF EXISTS "Trainers and Admins can view all users" ON public.users;
CREATE POLICY "Trainers and Admins can view all users" ON public.users
  FOR SELECT TO authenticated
  USING (public.is_trainer_or_admin());

DROP POLICY IF EXISTS "Trainers and Admins can view all profiles" ON public.official_profiles;
CREATE POLICY "Trainers and Admins can view all profiles" ON public.official_profiles
  FOR SELECT TO authenticated
  USING (public.is_trainer_or_admin());

-- assignments
ALTER TABLE IF EXISTS public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own assignments" ON public.assignments;
CREATE POLICY "Users can view own assignments" ON public.assignments
  FOR SELECT TO authenticated
  USING ((auth.uid())::text = (user_id)::text);

DROP POLICY IF EXISTS "Trainers and Admins can view all assignments" ON public.assignments;
CREATE POLICY "Trainers and Admins can view all assignments" ON public.assignments
  FOR SELECT TO authenticated
  USING (public.is_trainer_or_admin());

DROP POLICY IF EXISTS "Users can insert own assignments" ON public.assignments;
CREATE POLICY "Users can insert own assignments" ON public.assignments
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid())::text = (user_id)::text);

DROP POLICY IF EXISTS "Trainers and Admins can insert assignments" ON public.assignments;
CREATE POLICY "Trainers and Admins can insert assignments" ON public.assignments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_trainer_or_admin());

-- learning_progress
ALTER TABLE IF EXISTS public.learning_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Learners can view own learning progress" ON public.learning_progress;
CREATE POLICY "Learners can view own learning progress" ON public.learning_progress
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.learning_paths
    WHERE (learning_paths.id)::text = (learning_progress.path_id)::text
      AND (learning_paths.user_id)::text = (auth.uid())::text
  ));

DROP POLICY IF EXISTS "Trainers and Admins can view learning progress" ON public.learning_progress;
CREATE POLICY "Trainers and Admins can view learning progress" ON public.learning_progress
  FOR SELECT TO authenticated
  USING (public.is_trainer_or_admin());

DROP POLICY IF EXISTS "Learners can update own learning progress" ON public.learning_progress;
CREATE POLICY "Learners can update own learning progress" ON public.learning_progress
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.learning_paths
    WHERE (learning_paths.id)::text = (learning_progress.path_id)::text
      AND (learning_paths.user_id)::text = (auth.uid())::text
  ));

DROP POLICY IF EXISTS "Learners can insert own learning progress" ON public.learning_progress;
CREATE POLICY "Learners can insert own learning progress" ON public.learning_progress
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.learning_paths
    WHERE (learning_paths.id)::text = (learning_progress.path_id)::text
      AND (learning_paths.user_id)::text = (auth.uid())::text
  ));

-- assessment_attempts
DROP POLICY IF EXISTS "Trainers and Admins can view assessment attempts" ON public.assessment_attempts;
CREATE POLICY "Trainers and Admins can view assessment attempts" ON public.assessment_attempts
  FOR SELECT TO authenticated
  USING (public.is_trainer_or_admin());

-- audit_logs
DROP POLICY IF EXISTS "Administrators can view all audit logs" ON public.audit_logs;
CREATE POLICY "Administrators can view all audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_trainer_or_admin());

DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- uploaded_learning_materials
DROP POLICY IF EXISTS "Trainers and Admins can view all materials" ON public.uploaded_learning_materials;
CREATE POLICY "Trainers and Admins can view all materials" ON public.uploaded_learning_materials
  FOR SELECT TO authenticated
  USING (public.is_trainer_or_admin());

DROP POLICY IF EXISTS "Trainers and Admins can insert materials" ON public.uploaded_learning_materials;
CREATE POLICY "Trainers and Admins can insert materials" ON public.uploaded_learning_materials
  FOR INSERT TO authenticated
  WITH CHECK (public.is_trainer_or_admin());

-- notifications
DROP POLICY IF EXISTS "Trainers and Admins can insert notifications" ON public.notifications;
CREATE POLICY "Trainers and Admins can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.is_trainer_or_admin());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING ((auth.uid())::text = (user_id)::text);

-- learner_competencies & skill_gaps
DROP POLICY IF EXISTS "Trainers and Admins can view competencies" ON public.learner_competencies;
CREATE POLICY "Trainers and Admins can view competencies" ON public.learner_competencies
  FOR SELECT TO authenticated
  USING (public.is_trainer_or_admin());

DROP POLICY IF EXISTS "Trainers and Admins can view skill gaps" ON public.skill_gaps;
CREATE POLICY "Trainers and Admins can view skill gaps" ON public.skill_gaps
  FOR SELECT TO authenticated
  USING (public.is_trainer_or_admin());

DROP POLICY IF EXISTS "Users can update own competencies" ON public.learner_competencies;
CREATE POLICY "Users can update own competencies" ON public.learner_competencies
  FOR UPDATE TO authenticated
  USING ((auth.uid())::text = (user_id)::text);

DROP POLICY IF EXISTS "Trainers and Admins can update competencies" ON public.learner_competencies;
CREATE POLICY "Trainers and Admins can update competencies" ON public.learner_competencies
  FOR UPDATE TO authenticated
  USING (public.is_trainer_or_admin());

DROP POLICY IF EXISTS "Users can update own skill gaps" ON public.skill_gaps;
CREATE POLICY "Users can update own skill gaps" ON public.skill_gaps
  FOR UPDATE TO authenticated
  USING ((auth.uid())::text = (user_id)::text);

DROP POLICY IF EXISTS "Trainers and Admins can update skill gaps" ON public.skill_gaps;
CREATE POLICY "Trainers and Admins can update skill gaps" ON public.skill_gaps
  FOR UPDATE TO authenticated
  USING (public.is_trainer_or_admin());

-- 5. Grant authenticated permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Confirm publication tables
SELECT pubname, schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
