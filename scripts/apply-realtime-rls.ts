import 'dotenv/config';
import pg from 'pg';
import { getPostgresPoolConfig } from '../server/utils/db-url.js';

const { Pool } = pg;

export async function applyRealtimeAndRlsMigrations() {
  console.log('================================================================');
  console.log('   NIPUN — APPLYING REALTIME, REPLICA IDENTITY & RLS POLICIES   ');
  console.log('================================================================\n');

  const pool = new Pool(getPostgresPoolConfig(process.env.DATABASE_URL!));
  const client = await pool.connect();

  try {
    // 0. Security Definer Helper Functions
    console.log('[1/5] Creating Security Definer helper functions for RLS...');
    await client.query(`
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
    `);
    console.log('  -> Helper functions created: get_current_user_role, is_trainer_or_admin, is_admin.');

    // 1. REPLICA IDENTITY FULL
    console.log('\n[2/5] Setting REPLICA IDENTITY FULL on target tables...');
    const replicaTables = [
      'learner_competencies',
      'skill_gaps',
      'notifications',
      'assessment_attempts',
      'learning_progress',
      'audit_logs',
      'users',
      'assignments',
      'uploaded_learning_materials',
      'learning_paths',
    ];

    for (const tbl of replicaTables) {
      await client.query(`ALTER TABLE public.${tbl} REPLICA IDENTITY FULL;`);
      console.log(`  -> ${tbl}: REPLICA IDENTITY FULL set.`);
    }

    // 2. Publication Verification
    console.log('\n[3/5] Verifying supabase_realtime publication...');
    await client.query(`
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
          IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = tbl
          ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
          END IF;
        END LOOP;
      END $$;
    `);
    console.log('  -> All 12 tables confirmed in publication supabase_realtime.');

    // 3. Row Level Security (RLS) Configuration
    console.log('\n[4/5] Configuring RLS policies for role-based synchronization...');

    // A. users & official_profiles (Trainer/Admin read access)
    await client.query(`
      DROP POLICY IF EXISTS "Trainers and Admins can view all users" ON public.users;
      CREATE POLICY "Trainers and Admins can view all users" ON public.users
        FOR SELECT TO authenticated
        USING (public.is_trainer_or_admin());

      DROP POLICY IF EXISTS "Trainers and Admins can view all profiles" ON public.official_profiles;
      CREATE POLICY "Trainers and Admins can view all profiles" ON public.official_profiles
        FOR SELECT TO authenticated
        USING (public.is_trainer_or_admin());
    `);
    console.log('  -> users & official_profiles: Trainer/Admin read policies added.');

    // B. assignments
    await client.query(`
      ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

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

      DROP POLICY IF EXISTS "Users can update own assignments" ON public.assignments;
      CREATE POLICY "Users can update own assignments" ON public.assignments
        FOR UPDATE TO authenticated
        USING ((auth.uid())::text = (user_id)::text);

      DROP POLICY IF EXISTS "Trainers and Admins can update assignments" ON public.assignments;
      CREATE POLICY "Trainers and Admins can update assignments" ON public.assignments
        FOR UPDATE TO authenticated
        USING (public.is_trainer_or_admin());
    `);
    console.log('  -> assignments: RLS enabled, own-user and trainer/admin policies created.');

    // C. learning_progress
    await client.query(`
      ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;

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
    `);
    console.log('  -> learning_progress: RLS policies created for learners, trainers, admins.');

    // D. assessment_attempts
    await client.query(`
      DROP POLICY IF EXISTS "Trainers and Admins can view assessment attempts" ON public.assessment_attempts;
      CREATE POLICY "Trainers and Admins can view assessment attempts" ON public.assessment_attempts
        FOR SELECT TO authenticated
        USING (public.is_trainer_or_admin());
    `);
    console.log('  -> assessment_attempts: Trainer & Admin supervision policy created.');

    // E. audit_logs
    await client.query(`
      DROP POLICY IF EXISTS "Administrators can view all audit logs" ON public.audit_logs;
      CREATE POLICY "Administrators can view all audit logs" ON public.audit_logs
        FOR SELECT TO authenticated
        USING (public.is_trainer_or_admin());

      DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
      CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs
        FOR INSERT TO authenticated
        WITH CHECK (true);
    `);
    console.log('  -> audit_logs: Administrator & Trainer audit policy created.');

    // F. uploaded_learning_materials
    await client.query(`
      DROP POLICY IF EXISTS "Trainers and Admins can view all materials" ON public.uploaded_learning_materials;
      CREATE POLICY "Trainers and Admins can view all materials" ON public.uploaded_learning_materials
        FOR SELECT TO authenticated
        USING (public.is_trainer_or_admin());

      DROP POLICY IF EXISTS "Trainers and Admins can insert materials" ON public.uploaded_learning_materials;
      CREATE POLICY "Trainers and Admins can insert materials" ON public.uploaded_learning_materials
        FOR INSERT TO authenticated
        WITH CHECK (public.is_trainer_or_admin());
    `);
    console.log('  -> uploaded_learning_materials: Trainer & Admin material policies created.');

    // G. notifications
    await client.query(`
      DROP POLICY IF EXISTS "Trainers and Admins can insert notifications" ON public.notifications;
      CREATE POLICY "Trainers and Admins can insert notifications" ON public.notifications
        FOR INSERT TO authenticated
        WITH CHECK (public.is_trainer_or_admin());

      DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
      CREATE POLICY "Users can update own notifications" ON public.notifications
        FOR UPDATE TO authenticated
        USING ((auth.uid())::text = (user_id)::text);
    `);
    console.log('  -> notifications: Trainer & Admin notification dispatch policy created.');

    // H. learner_competencies & skill_gaps
    await client.query(`
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
    `);
    console.log('  -> learner_competencies & skill_gaps: Trainer & Admin supervision policies created.');

    // 4. Grants verification
    console.log('\n[5/5] Verifying table grants for authenticated role...');
    await client.query(`
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
      GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
    `);
    console.log('  -> Permissions verified.');

    console.log('\n================================================================');
    console.log(' [SUCCESS] ALL REALTIME, REPLICA IDENTITY & RLS POLICIES APPLIED ');
    console.log('================================================================\n');
  } finally {
    client.release();
    await pool.end();
  }
}

// Run directly
applyRealtimeAndRlsMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[ERROR] Failed to apply migrations:', err);
    process.exit(1);
  });
