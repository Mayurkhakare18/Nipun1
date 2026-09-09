-- ============================================================================
-- NIPUN Supabase Realtime Publication Migration
-- Enables PostgreSQL Realtime WAL broadcasting on core application tables.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Helper to safely add table to publication if not already added
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
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
  FOREACH t IN ARRAY tables LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    EXCEPTION WHEN duplicate_object THEN
      -- Table already in publication
      NULL;
    END;
  END LOOP;
END $$;
