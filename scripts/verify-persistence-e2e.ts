import 'dotenv/config';
import http from 'http';
import { createClient } from '@supabase/supabase-js';
import { createExpressApp } from '../server/app.js';
import { db } from '../server/db.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://dnrqtmadtmgizqdchrbk.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function runE2EVerification() {
  console.log('================================================================');
  console.log('  NIPUN DATABASE PERSISTENCE E2E VERIFICATION SUITE');
  console.log('  Target: Supabase PostgreSQL (dnrqtmadtmgizqdchrbk)');
  console.log('================================================================\n');

  // 1. Identify test user in PostgreSQL
  console.log('[Step 1] Finding test learner in PostgreSQL public.users...');
  const { data: dbUsers, error: userErr } = await supabase
    .from('users')
    .select('id, name, email, role')
    .limit(5);

  if (userErr || !dbUsers || dbUsers.length === 0) {
    throw new Error(`Failed to find users: ${userErr?.message || 'No users'}`);
  }

  const testUser = dbUsers.find((u) => u.email === 'aarav.sharma@mospi.gov.in') || dbUsers[0];
  console.log(`  -> Using learner: ${testUser.name} (${testUser.email}) [ID: ${testUser.id}]`);

  // Ensure db.state has this user aligned
  db.state.users[testUser.id] = {
    id: testUser.id,
    name: testUser.name,
    email: testUser.email,
    role: 'LEARNER',
    employeeId: 'SSS-2021-9482',
    ministry: 'Ministry of Statistics & Programme Implementation',
    department: 'National Statistical Office (NSO) - SDRD',
    organization: 'Government of India',
    designation: 'Senior Statistical Officer',
    currentRole: 'Senior Statistical Officer',
    targetRole: 'Assistant Director / Data Science Lead',
    level: 11,
    cadre: 'Subordinate Statistical Service (SSS)',
    yearsOfExperience: 5,
    education: 'M.Sc. in Statistics (University of Delhi)',
    specialization: 'Sample Surveys & Applied Econometrics',
    location: 'New Delhi',
    preferredLanguage: 'English / Hindi',
    previousRoles: ['Junior Statistical Officer'],
    currentProjects: ['Survey Automation'],
    technologiesUsed: ['Python', 'SQL', 'CSPro'],
    trainingHours: 22,
    roleReadiness: 82,
    verifiedSkillsCount: 14,
    developingSkillsCount: 3,
  };

  // 1.5 Generate genuine Supabase Auth session
  console.log('\n[Step 1.5] Generating genuine Supabase Auth session token for learner...');
  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: testUser.email,
  });
  if (linkErr || !linkData?.properties?.email_otp) {
    throw new Error(`Failed to generate magic link: ${linkErr?.message}`);
  }

  const anonClient = createClient(
    SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9LZsLZRp9E34czzgwxKAcg_16Ki63lw',
    { auth: { persistSession: false } }
  );
  const { data: sessionData, error: verifyErr } = await anonClient.auth.verifyOtp({
    email: testUser.email,
    token: linkData.properties.email_otp,
    type: 'magiclink',
  });

  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    throw new Error(`Failed to verify OTP: ${verifyErr?.message}`);
  }
  console.log('  -> Acquired real Supabase Auth Bearer Token!');

  const authHeaders = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  // 2. Start Express app on ephemeral port
  console.log('\n[Step 2] Starting Express API Server for live verification...');
  const app = createExpressApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(4005, resolve));
  const baseUrl = 'http://localhost:4005';
  console.log(`  -> Live server listening at ${baseUrl}`);

  try {
    // 3. Test GET /api/learner/profile-competencies
    console.log('\n[Step 3] Testing GET /api/learner/profile-competencies...');
    const profRes = await fetch(`${baseUrl}/api/learner/profile-competencies`, {
      headers: authHeaders,
    });
    const profJson = await profRes.json();
    console.log(`  Status: ${profRes.status} ${profRes.statusText}`);
    console.log(`  Success: ${profJson.success}, Competencies: ${profJson.competencies?.length}, Gaps: ${profJson.gaps?.length}`);
    if (!profJson.success) throw new Error(`profile-competencies failed: ${JSON.stringify(profJson)}`);

    // 4. Test POST /api/learner/purpose
    console.log('\n[Step 4] Testing POST /api/learner/purpose...');
    const purpRes = await fetch(`${baseUrl}/api/learner/purpose`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        purposeId: 'survey-data-lead',
        title: 'Survey Data Lead & Sampling Specialist',
        targetRole: 'Senior Survey Officer',
      }),
    });
    const purpJson = await purpRes.json();
    console.log(`  Status: ${purpRes.status}`);
    console.log(`  Success: ${purpJson.success}, Gaps identified: ${purpJson.gaps?.length}`);
    if (!purpJson.success) throw new Error(`purpose failed: ${JSON.stringify(purpJson)}`);

    // 5. Test POST /api/assessments/submit
    console.log('\n[Step 5] Testing POST /api/assessments/submit (with answer choices)...');
    const submitRes = await fetch(`${baseUrl}/api/assessments/submit`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        assessmentId: 'assess-py-l3',
        answers: [2, 1, 3, 0],
        timeSpentSeconds: 180,
      }),
    });
    const submitJson = await submitRes.json();
    console.log(`  Status: ${submitRes.status}`);
    console.log(`  Success: ${submitJson.success}, Score: ${submitJson.result?.scorePercentage}%, Passed: ${submitJson.result?.scorePercentage >= 70}`);
    if (!submitJson.success) throw new Error(`assessment submit failed: ${JSON.stringify(submitJson)}`);

    // 6. Test GET /api/learning-path
    console.log('\n[Step 6] Testing GET /api/learning-path...');
    const pathRes = await fetch(`${baseUrl}/api/learning-path`, {
      headers: authHeaders,
    });
    const pathJson = await pathRes.json();
    console.log(`  Status: ${pathRes.status}`);
    console.log(`  Success: ${pathJson.success}, Path: "${pathJson.learningPath?.title}", Items: ${pathJson.learningPath?.items?.length}`);
    if (!pathJson.success) throw new Error(`learning-path failed: ${JSON.stringify(pathJson)}`);

    const stepToUpdate = pathJson.learningPath?.items?.[0];
    if (stepToUpdate) {
      // 7. Test POST /api/learning-path/step-update
      console.log(`\n[Step 7] Testing POST /api/learning-path/step-update on step "${stepToUpdate.title}"...`);
      const stepRes = await fetch(`${baseUrl}/api/learning-path/step-update`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          stepId: stepToUpdate.id,
          status: 'COMPLETED',
          score: 95,
        }),
      });
      const stepJson = await stepRes.json();
      console.log(`  Status: ${stepRes.status}`);
      console.log(`  Success: ${stepJson.success}, Progress: ${stepJson.learningPath?.progressPercentage}%`);
      if (!stepJson.success) throw new Error(`step-update failed: ${JSON.stringify(stepJson)}`);
    }

    // 8. Test POST /api/reassessments/submit
    console.log('\n[Step 8] Testing POST /api/reassessments/submit...');
    const reassessRes = await fetch(`${baseUrl}/api/reassessments/submit`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        answers: [
          { questionId: 'reassess-q1', selectedOption: 1, isCorrect: true },
          { questionId: 'reassess-q2', selectedOption: 2, isCorrect: true },
          { questionId: 'reassess-q3', selectedOption: 0, isCorrect: true },
          { questionId: 'reassess-q4', selectedOption: 3, isCorrect: true },
          { questionId: 'reassess-q5', selectedOption: 1, isCorrect: true },
        ],
      }),
    });
    const reassessJson = await reassessRes.json();
    console.log(`  Status: ${reassessRes.status}`);
    console.log(`  Success: ${reassessJson.success}, Certificate: ${reassessJson.result?.certificateId}`);
    if (!reassessJson.success) throw new Error(`reassessments submit failed: ${JSON.stringify(reassessJson)}`);

  } finally {
    server.close();
  }

  // 9. Query live PostgreSQL database counts directly
  console.log('\n================================================================');
  console.log('  QUERYING SUPABASE POSTGRESQL TABLE ROW COUNTS DIRECTLY');
  console.log('================================================================\n');

  const tablesToCheck = [
    // Master tables (Phase 1)
    'competency_framework',
    'competencies',
    'departments',
    'roles',
    'assessments',
    'assessment_questions',
    'courses',
    'training_programmes',
    // Learner transactional tables (Phase 2)
    'users',
    'official_profiles',
    'learner_competencies',
    'skill_gaps',
    'learning_paths',
    'learning_progress',
    'assessment_attempts',
    'assessment_answers',
    'audit_logs',
  ];

  const results: Record<string, number> = {};

  for (const table of tablesToCheck) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`  ❌ ${table.padEnd(25)}: ERROR: ${error.message}`);
      results[table] = -1;
    } else {
      console.log(`  ✅ ${table.padEnd(25)}: ${count} rows`);
      results[table] = count || 0;
    }
  }

  // Sample check on assessment_answers
  const { data: sampleAnswers } = await supabase
    .from('assessment_answers')
    .select('id, attempt_id, question_id, selected_option_index, is_correct, time_taken_seconds')
    .limit(3);

  console.log('\n--- SAMPLE ROW FROM assessment_answers ---');
  console.dir(sampleAnswers, { depth: null });

  // Sample check on assessment_attempts
  const { data: sampleAttempts } = await supabase
    .from('assessment_attempts')
    .select('id, assessment_id, user_id, score_percentage, passed, created_at')
    .order('created_at', { ascending: false })
    .limit(2);

  console.log('\n--- SAMPLE ROWS FROM assessment_attempts ---');
  console.dir(sampleAttempts, { depth: null });

  // Verify all required tables have > 0 rows
  const criticalTables = [
    'competencies',
    'assessments',
    'assessment_questions',
    'courses',
    'learner_competencies',
    'skill_gaps',
    'learning_paths',
    'learning_progress',
    'assessment_attempts',
    'assessment_answers',
    'audit_logs',
  ];

  const allPassed = criticalTables.every((t) => (results[t] || 0) > 0);

  console.log('\n================================================================');
  if (allPassed) {
    console.log('  >>> DATABASE SOURCE OF TRUTH: PASS <<<');
    console.log('  All core catalog tables and learner records exist in PostgreSQL!');
  } else {
    console.log('  >>> DATABASE SOURCE OF TRUTH: FAIL <<<');
    const failing = criticalTables.filter((t) => (results[t] || 0) <= 0);
    console.log('  Failing tables (0 rows):', failing.join(', '));
  }
  console.log('================================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runE2EVerification().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
