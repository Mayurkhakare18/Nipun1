import 'dotenv/config';
import WebSocket from 'ws';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://dnrqtmadtmgizqdchrbk.supabase.co';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9LZsLZRp9E34czzgwxKAcg_16Ki63lw';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('[E2E] SUPABASE_SERVICE_ROLE_KEY required.');
  process.exit(1);
}

interface RealtimeFlowResult {
  flowId: number;
  name: string;
  table: string;
  role: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const flowResults: RealtimeFlowResult[] = [];

async function runRealtimeE2ESuite() {
  console.log('================================================================');
  console.log('   NIPUN — REALTIME POSTGRES_CHANGES MULTI-USER E2E SUITE       ');
  console.log('================================================================\n');

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

  // 1. Authenticate Aarav (Learner)
  const learnerClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
    realtime: { transport: WebSocket },
  });
  const { data: aaravAuth, error: aaravErr } = await learnerClient.auth.signInWithPassword({
    email: 'aarav.sharma@mospi.gov.in',
    password: 'Learner@2026',
  });
  if (aaravErr || !aaravAuth.session) {
    console.error('Failed to sign in Aarav:', aaravErr?.message);
    process.exit(1);
  }
  await learnerClient.realtime.setAuth(aaravAuth.session.access_token);
  const aaravUid = aaravAuth.user.id;
  console.log(`[AUTH] Aarav Sharma authenticated (UID: ${aaravUid})`);

  // 2. Authenticate Rajesh (Trainer)
  const trainerClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
    realtime: { transport: WebSocket },
  });
  const { data: rajeshAuth, error: rajeshErr } = await trainerClient.auth.signInWithPassword({
    email: 'rajesh.verma@mospi.gov.in',
    password: 'Trainer@2026',
  });
  if (rajeshErr || !rajeshAuth.session) {
    console.error('Failed to sign in Rajesh:', rajeshErr?.message);
    process.exit(1);
  }
  await trainerClient.realtime.setAuth(rajeshAuth.session.access_token);
  const rajeshUid = rajeshAuth.user.id;
  console.log(`[AUTH] Dr. Rajeshwar Rao authenticated (UID: ${rajeshUid})`);

  // 3. Authenticate Vikram (Administrator)
  const adminUserClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
    realtime: { transport: WebSocket },
  });
  const { data: vikramAuth, error: vikramErr } = await adminUserClient.auth.signInWithPassword({
    email: 'vikram.sen@mospi.gov.in',
    password: 'Admin@2026',
  });
  if (vikramErr || !vikramAuth.session) {
    console.error('Failed to sign in Vikram:', vikramErr?.message);
    process.exit(1);
  }
  await adminUserClient.realtime.setAuth(vikramAuth.session.access_token);
  const vikramUid = vikramAuth.user.id;
  console.log(`[AUTH] Vikram Sen authenticated (UID: ${vikramUid})\n`);

  /**
   * Helper function to test a Realtime postgres_changes event delivery
   */
  async function testFlow(
    flowId: number,
    name: string,
    client: any,
    table: string,
    filter: string | undefined,
    mutateAction: () => Promise<any>,
    cleanupAction?: () => Promise<any>
  ) {
    console.log(`--- [FLOW ${flowId}] Testing: ${name} (${table}) ---`);

    let received = false;
    let payloadData: any = null;
    let channelError: any = null;

    const channelName = `test_flow_${flowId}_${Date.now()}`;
    const channel = client.channel(channelName);

    const subscriptionPromise = new Promise<'SUBSCRIBED' | 'ERROR' | 'TIMEOUT'>((resolve) => {
      const timer = setTimeout(() => resolve('TIMEOUT'), 8000);

      const changeConfig: any = {
        event: '*',
        schema: 'public',
        table,
      };
      if (filter) changeConfig.filter = filter;

      channel
        .on('postgres_changes' as any, changeConfig, (payload: any) => {
          received = true;
          payloadData = payload;
          console.log(`  -> [EVENT RECEIVED] table: ${table}, type: ${payload.eventType}`);
        })
        .subscribe((status: string, err: any) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timer);
            resolve('SUBSCRIBED');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            channelError = err || status;
            clearTimeout(timer);
            resolve('ERROR');
          }
        });
    });

    const subStatus = await subscriptionPromise;

    if (subStatus !== 'SUBSCRIBED') {
      await client.removeChannel(channel);
      flowResults.push({
        flowId,
        name,
        table,
        role: client === learnerClient ? 'LEARNER' : client === trainerClient ? 'TRAINER' : 'ADMIN',
        status: 'FAIL',
        details: `Failed to subscribe: ${channelError || subStatus}`,
      });
      console.log(`  [FAIL] Flow ${flowId} subscription failed (${subStatus})\n`);
      return;
    }

    console.log(`  -> Channel SUBSCRIBED. Triggering database mutation...`);
    await mutateAction();

    // Wait up to 6 seconds for CDC message
    const startWait = Date.now();
    while (!received && Date.now() - startWait < 6000) {
      await new Promise((r) => setTimeout(r, 200));
    }

    if (cleanupAction) {
      try {
        await cleanupAction();
      } catch {}
    }
    await client.removeChannel(channel);

    if (received) {
      flowResults.push({
        flowId,
        name,
        table,
        role: client === learnerClient ? 'LEARNER' : client === trainerClient ? 'TRAINER' : 'ADMIN',
        status: 'PASS',
        details: `CDC event delivered successfully via WebSocket. Payload: eventType=${payloadData?.eventType}, ID=${payloadData?.new?.id || payloadData?.old?.id}`,
      });
      console.log(`  [PASS] Flow ${flowId} verified!\n`);
    } else {
      flowResults.push({
        flowId,
        name,
        table,
        role: client === learnerClient ? 'LEARNER' : client === trainerClient ? 'TRAINER' : 'ADMIN',
        status: 'FAIL',
        details: `No CDC event received within 6000ms. Check publication & RLS.`,
      });
      console.log(`  [FAIL] Flow ${flowId} timed out waiting for CDC event.\n`);
    }
  }

  // FLOW 1: USER LOGIN ACTIVITY (Admin receives audit log in realtime)
  const logId = `test_log_${Date.now()}`;
  await testFlow(
    1,
    'USER LOGIN ACTIVITY',
    adminUserClient,
    'audit_logs',
    undefined,
    async () => {
      await adminClient.from('audit_logs').insert({
        id: logId,
        user_id: aaravUid,
        user_name: 'Aarav Sharma',
        action: 'USER_LOGIN',
        details: 'Officer authenticated via Supabase Auth.',
        ip_address: '127.0.0.1',
        created_at: new Date().toISOString(),
      });
    },
    async () => {
      await adminClient.from('audit_logs').delete().eq('id', logId);
    }
  );

  // FLOW 2: NOTIFICATIONS (Learner receives direct notification)
  const notifId = `test_notif_${Date.now()}`;
  await testFlow(
    2,
    'NOTIFICATIONS',
    learnerClient,
    'notifications',
    `user_id=eq.${aaravUid}`,
    async () => {
      await adminClient.from('notifications').insert({
        id: notifId,
        user_id: aaravUid,
        title: 'New Assignment Dispatched',
        message: 'Survey Design Project Alpha assigned to your docket.',
        type: 'ASSIGNMENT',
        read: false,
        created_at: new Date().toISOString(),
      });
    },
    async () => {
      await adminClient.from('notifications').delete().eq('id', notifId);
    }
  );

  // FLOW 3: ASSIGNMENTS (Learner receives new project assignment)
  const assignId = `test_assign_${Date.now()}`;
  await testFlow(
    3,
    'APPLICATIONS / ASSIGNMENTS',
    learnerClient,
    'assignments',
    `user_id=eq.${aaravUid}`,
    async () => {
      await adminClient.from('assignments').insert({
        id: assignId,
        user_id: aaravUid,
        title: 'National Accounts Modernization',
        department_id: 'dept-analytics',
        start_date: '2026-09-10',
        end_date: '2026-12-31',
        is_current: true,
        role_in_project: 'Lead Statistical Analyst',
        key_technologies: ['Python', 'Pandas', 'SNA 2008'],
        created_at: new Date().toISOString(),
      });
    },
    async () => {
      await adminClient.from('assignments').delete().eq('id', assignId);
    }
  );

  // FLOW 4: ASSESSMENTS (Trainer receives learner assessment attempt completion)
  const attemptId = `test_attempt_${Date.now()}`;
  await testFlow(
    4,
    'ASSESSMENTS (Trainer Supervision)',
    trainerClient,
    'assessment_attempts',
    undefined,
    async () => {
      await adminClient.from('assessment_attempts').insert({
        id: attemptId,
        assessment_id: 'assess-py-l3',
        user_id: aaravUid,
        score_percentage: 85,
        total_questions: 10,
        correct_answers_count: 8,
        incorrect_answers_count: 2,
        time_spent_seconds: 420,
        passed: true,
        topic_scores: [{ topic: 'Sampling', score: 4, total: 5 }],
        ai_conclusion: 'Demonstrated mastery in sampling methods.',
        updated_competency_level: 3,
        gap_reduced: true,
        recommended_revision: [],
        completed_at: new Date().toISOString(),
      });
    },
    async () => {
      await adminClient.from('assessment_attempts').delete().eq('id', attemptId);
    }
  );

  // FLOW 5: COMPETENCIES (Learner dashboard updates competency level)
  const compId = `comp_${aaravUid}_test`;
  await testFlow(
    5,
    'COMPETENCY UPDATES',
    learnerClient,
    'learner_competencies',
    `user_id=eq.${aaravUid}`,
    async () => {
      await adminClient.from('learner_competencies').upsert({
        id: compId,
        user_id: aaravUid,
        competency_id: 'comp-stat-01',
        current_level: 3,
        required_level: 4,
        status: 'DEVELOPING',
        gap_type: 'APPLICATION_GAP',
        confidence: 0.92,
        trend: 'IMPROVED',
        last_assessed_at: new Date().toISOString(),
        target_date: '2026-11-30',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    },
    async () => {
      await adminClient.from('learner_competencies').delete().eq('id', compId);
    }
  );

  // FLOW 6: SKILL GAPS (Learner dashboard updates closed gap)
  const gapId = `gap_${aaravUid}_test`;
  await testFlow(
    6,
    'SKILL GAP CLOSURE',
    learnerClient,
    'skill_gaps',
    `user_id=eq.${aaravUid}`,
    async () => {
      await adminClient.from('skill_gaps').upsert({
        id: gapId,
        user_id: aaravUid,
        competency_id: 'comp-stat-01',
        required_level: 4,
        current_level: 3,
        gap_magnitude: 1,
        gap_type: 'APPLICATION_GAP',
        priority: 'MEDIUM',
        knowledge_gap_score: 20,
        application_gap_score: 30,
        retention_risk_score: 15,
        ai_diagnosis: 'Application gap reduced after module completion.',
        why_recommended: ['Benchmark clearance'],
        status: 'OPEN',
        identified_at: new Date().toISOString(),
      });
    },
    async () => {
      await adminClient.from('skill_gaps').delete().eq('id', gapId);
    }
  );

  // FLOW 7: TRAINER MATERIALS (Trainer dashboard updates uploaded docs)
  const docId = `doc_test_${Date.now()}`;
  await testFlow(
    7,
    'TRAINER LEARNING MATERIALS',
    trainerClient,
    'uploaded_learning_materials',
    undefined,
    async () => {
      await adminClient.from('uploaded_learning_materials').insert({
        id: docId,
        user_id: rajeshUid,
        file_name: 'National_Statistical_Sampling_Standard_2026.pdf',
        file_size_bytes: 204800,
        file_type: 'application/pdf',
        purpose: 'TRAINER_ASSESSMENT_GENERATION',
        status: 'PROCESSED',
        extracted_topics: ['Sampling', 'Variance', 'Imputation'],
        executive_summary: 'Comprehensive guidelines for NSSO survey rounds.',
        generated_questions_count: 5,
        uploaded_at: new Date().toISOString(),
      });
    },
    async () => {
      await adminClient.from('uploaded_learning_materials').delete().eq('id', docId);
    }
  );

  // FLOW 8: LEARNING PROGRESS (Step completion)
  const progressId = `step_test_${Date.now()}`;
  await testFlow(
    8,
    'LEARNING PROGRESS',
    learnerClient,
    'learning_progress',
    undefined,
    async () => {
      await adminClient.from('learning_progress').upsert({
        id: progressId,
        path_id: 'path-default',
        step_number: 1,
        title: 'Python for Statistical Officers - Module 1',
        provider: 'iGOT Karmayogi',
        source_type: 'COURSE',
        duration: '2 hours',
        status: 'COMPLETED',
        score: 90,
        competency_name: 'Python',
        completed_at: new Date().toISOString(),
      });
    },
    async () => {
      await adminClient.from('learning_progress').delete().eq('id', progressId);
    }
  );

  // Summary
  console.log('================================================================');
  console.log('                 REALTIME E2E SUITE RESULTS                     ');
  console.log('================================================================\n');

  const passedCount = flowResults.filter((f) => f.status === 'PASS').length;
  const totalCount = flowResults.length;

  for (const r of flowResults) {
    console.log(`[${r.status}] Flow ${r.flowId}: ${r.name} (${r.table}) [${r.role}]`);
    console.log(`       ${r.details}\n`);
  }

  console.log(`OVERALL: ${passedCount}/${totalCount} Realtime flows PASSED.\n`);
  return { passedCount, totalCount };
}

runRealtimeE2ESuite()
  .then(({ passedCount, totalCount }) => {
    process.exit(passedCount === totalCount ? 0 : 1);
  })
  .catch((err) => {
    console.error('Fatal E2E error:', err);
    process.exit(1);
  });
