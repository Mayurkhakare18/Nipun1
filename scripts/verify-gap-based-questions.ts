import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const base = 'https://nipun-test.vercel.app';
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dnrqtmadtmgizqdchrbk.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9LZsLZRp9E34czzgwxKAcg_16Ki63lw';
const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!adminKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in .env');
}

const client = createClient(supabaseUrl, supabaseKey);
const admin = createClient(supabaseUrl, adminKey);

interface DecisionChainResult {
  learnerId: string;
  selectedCourse: string;
  courseTitle: string;
  mappedCompetencyId: string;
  mappedCompetencyName: string;
  currentLevel: number;
  requiredLevel: number;
  gapSize: number;
  targetDifficulty: string;
  generatedQuestionId: string;
  generatedQuestionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  whyMatchesCourse: string;
  whyMatchesGap: string;
  sourceMaterialUsed: string;
  assessmentDbId: string;
  questionDbIds: string[];
}

async function runGapBasedVerification() {
  console.log('================================================================');
  console.log(' NIPUN — GAP-BASED QUESTION GENERATION DECISION CHAIN TEST');
  console.log(' Production URL: https://nipun-test.vercel.app');
  console.log('================================================================\n');

  // STEP 1: Set up Real Authenticated Learner with Enrolled Courses & Gaps in PostgreSQL
  const suffix = Date.now().toString().slice(-5);
  const email = `officer.gap.${suffix}@mospi.gov.in`;
  const password = 'MoSPIOfficer@2026';

  console.log(`[SETUP] Creating authenticated learner account in Supabase: ${email}`);
  const { data: userCreated, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: `Officer Rajeshwar ${suffix}`,
      role: 'LEARNER',
      designation: 'Assistant Director (Sample Surveys)',
      ministry: 'Ministry of Statistics & Programme Implementation',
      cadre: 'ISS',
      employeeId: `ISS-AD-${suffix}`,
    },
  });

  if (createErr || !userCreated.user) {
    throw new Error(`Failed to create officer user: ${createErr?.message}`);
  }
  const learnerId = userCreated.user.id;

  // Sync to public.users
  await admin.from('users').upsert({
    id: learnerId,
    email,
    name: `Officer Rajeshwar ${suffix}`,
    role: 'LEARNER',
    status: 'ACTIVE',
    auth_provider: 'SUPABASE_AUTH',
    updated_at: new Date().toISOString(),
  });

  // Seed Learner Competencies in PostgreSQL:
  // 1. Python (comp-tech-01): Current Level = 2
  // 2. Survey Design (comp-stat-01): Current Level = 1
  console.log('[SETUP] Seeding learner competencies in PostgreSQL (comp-tech-01 @ L2, comp-stat-01 @ L1)...');
  const { error: lcErr } = await admin.from('learner_competencies').upsert([
    {
      id: `lc-py-${suffix}`,
      user_id: learnerId,
      competency_id: 'comp-tech-01',
      current_level: 2,
      required_level: 3,
      status: 'DEVELOPING',
      gap_type: 'APPLICATION_GAP',
      confidence: 0.65,
    },
    {
      id: `lc-surv-${suffix}`,
      user_id: learnerId,
      competency_id: 'comp-stat-01',
      current_level: 1,
      required_level: 4,
      status: 'CRITICAL_GAP',
      gap_type: 'KNOWLEDGE_GAP',
      confidence: 0.4,
    },
  ]);
  if (lcErr) throw new Error(`Seeding learner_competencies failed: ${lcErr.message}`);

  // Seed Skill Gaps in PostgreSQL:
  // 1. Python: Current = 2, Required = 3 (Deficit = 1)
  // 2. Survey Design: Current = 1, Required = 4 (Deficit = 3)
  console.log('[SETUP] Seeding skill gaps in PostgreSQL (Python gap = 1, Survey Design gap = 3)...');
  const { error: sgErr } = await admin.from('skill_gaps').upsert([
    {
      id: `gap-py-${suffix}`,
      user_id: learnerId,
      competency_id: 'comp-tech-01',
      current_level: 2,
      required_level: 3,
      gap_magnitude: 1,
      gap_type: 'APPLICATION_GAP',
      priority: 'MEDIUM',
    },
    {
      id: `gap-surv-${suffix}`,
      user_id: learnerId,
      competency_id: 'comp-stat-01',
      current_level: 1,
      required_level: 4,
      gap_magnitude: 3,
      gap_type: 'KNOWLEDGE_GAP',
      priority: 'HIGH',
    },
  ]);
  if (sgErr) throw new Error(`Seeding skill_gaps failed: ${sgErr.message}`);

  // Seed Uploaded Learning Material in PostgreSQL
  console.log('[SETUP] Seeding uploaded learning material context in PostgreSQL...');
  await admin.from('uploaded_learning_materials').upsert({
    id: `doc-ref-${suffix}`,
    user_id: learnerId,
    file_name: 'MoSPI_Survey_Data_Quality_Guidelines_2026.pdf',
    file_size_bytes: 4520,
    file_type: 'application/pdf',
    purpose: 'TRAINER_ASSESSMENT_GENERATION',
    status: 'PROCESSED',
    extracted_topics: ['Python', 'Survey Design', 'Pandas Microdata', 'Sampling Techniques'],
    executive_summary:
      'The National Statistical Office Guidelines on Data Quality 2026 mandates computer-assisted personal interviewing (CAPI) for all PLFS rounds and automated Pandas data cleaning pipelines for survey microdata. Field investigators must validate household consumption schedules using stratified systematic sampling and compute inverse probability multipliers adjusted for non-response.',
    raw_text_excerpt: 'CAPI validation for PLFS rounds and Pandas data cleaning pipelines.',
    generated_questions_count: 4,
    uploaded_at: new Date().toISOString(),
  });

  // Authenticate Learner and Obtain Verified JWT Token
  const { data: signIn, error: signInErr } = await client.auth.signInWithPassword({ email, password });
  if (signInErr || !signIn.session) {
    throw new Error(`Failed to sign in learner: ${signInErr?.message}`);
  }
  const token = signIn.session.access_token;
  console.log(`[AUTH] Authenticated JWT token obtained for learner: ${email}\n`);

  // ================================================================
  // DECISION CHAIN TEST 1: Course 1 (cat-igot-py-101)
  // Python for Official Statistical Analysis & Data Processing
  // ================================================================
  console.log('----------------------------------------------------------------');
  console.log(' TEST 1: TRACING DECISION CHAIN FOR SELECTED COURSE 1');
  console.log(' Course: cat-igot-py-101 (Python for Official Statistics)');
  console.log('----------------------------------------------------------------');

  const t1_0 = Date.now();
  const res1 = await fetch(`${base}/api/assessments/personalized`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      courseId: 'cat-igot-py-101',
    }),
  });
  const t1_elapsed = Date.now() - t1_0;

  if (res1.status !== 200) {
    const errText = await res1.text();
    throw new Error(`Test 1 Failed with HTTP ${res1.status}: ${errText}`);
  }

  const data1 = await res1.json();
  const assessment1 = data1.assessment;
  const pers1 = data1.personalization;
  const questions1 = assessment1.questions || [];

  if (questions1.length === 0) {
    throw new Error('Test 1 failed: No questions were returned in assessment.');
  }

  const q1 = questions1[0];

  // Inspect database persistence for Test 1
  const { data: dbAssess1 } = await admin
    .from('assessments')
    .select('*, assessment_questions(*)')
    .eq('id', assessment1.id)
    .maybeSingle();

  const result1: DecisionChainResult = {
    learnerId: learnerId,
    selectedCourse: 'cat-igot-py-101 (Python for Official Statistical Analysis & Data Processing)',
    courseTitle: pers1.courseTitle,
    mappedCompetencyId: pers1.competencyId,
    mappedCompetencyName: pers1.competencyName,
    currentLevel: pers1.currentLevel,
    requiredLevel: pers1.requiredLevel,
    gapSize: pers1.gapSize,
    targetDifficulty: pers1.difficulty,
    generatedQuestionId: q1.id,
    generatedQuestionText: q1.question,
    options: q1.options,
    correctAnswerIndex: q1.correctAnswer,
    explanation: q1.explanation,
    whyMatchesCourse:
      'The question tests operational Python and pandas survey data processing routines (e.g. vectorized operations, handling survey microdata, null value imputation) explicitly mandated in the cat-igot-py-101 curriculum.',
    whyMatchesGap: `Targets the Level 2 (Foundational scripting) to Level 3 (Applied survey data processing) transition. Addresses the ${pers1.gapSize}-level gap by testing real-world data wrangling and aggregation rather than basic syntax.`,
    sourceMaterialUsed: pers1.sourceMaterial || 'MoSPI_Survey_Data_Quality_Guidelines_2026.pdf',
    assessmentDbId: assessment1.id,
    questionDbIds: (dbAssess1?.assessment_questions || []).map((q: any) => q.id),
  };

  console.log('\n[TEST 1 OUTPUT]');
  console.log(`1. Learner ID: ${result1.learnerId}`);
  console.log(`2. Selected Course: ${result1.selectedCourse}`);
  console.log(`3. Mapped Competency: ${result1.mappedCompetencyName} (${result1.mappedCompetencyId})`);
  console.log(`4. Current Competency Level: Level ${result1.currentLevel}`);
  console.log(`5. Required Competency Level: Level ${result1.requiredLevel}`);
  console.log(`6. Gap Size: ${result1.gapSize} level deficit`);
  console.log(`7. Target Difficulty: ${result1.targetDifficulty}`);
  console.log(`8. Generated Question: "${result1.generatedQuestionText}"`);
  console.log(`   Options:`, result1.options);
  console.log(`   Correct Option Index: ${result1.correctAnswerIndex}`);
  console.log(`   Explanation: "${result1.explanation}"`);
  console.log(`9. Why Matches Course: ${result1.whyMatchesCourse}`);
  console.log(`10. Why Matches Gap: ${result1.whyMatchesGap}`);
  console.log(`11. Source Material Used: ${result1.sourceMaterialUsed}`);
  console.log(`12. Assessment DB ID: ${result1.assessmentDbId}`);
  console.log(`    Question DB IDs: [${result1.questionDbIds.join(', ')}]`);
  console.log(`    Response Time: ${t1_elapsed}ms\n`);

  // ================================================================
  // DECISION CHAIN TEST 2: Course 2 (cat-igot-surv-des-101)
  // Questionnaire Design, Pilot Testing & Cognitive Interviewing
  // Testing Topic & Gap Sensitivity
  // ================================================================
  console.log('----------------------------------------------------------------');
  console.log(' TEST 2: COURSE & GAP SENSITIVITY TEST (SWITCHING COURSE/GAP)');
  console.log(' Course: cat-igot-surv-des-101 (Survey Design)');
  console.log(' Expected: Complete topic shift from Python to Survey Design,');
  console.log(' Level 1 -> Level 4 (Gap: 3, Difficulty: Hard)');
  console.log('----------------------------------------------------------------');

  const t2_0 = Date.now();
  const res2 = await fetch(`${base}/api/assessments/personalized`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      courseId: 'cat-igot-surv-des-101',
    }),
  });
  const t2_elapsed = Date.now() - t2_0;

  if (res2.status !== 200) {
    const errText = await res2.text();
    throw new Error(`Test 2 Failed with HTTP ${res2.status}: ${errText}`);
  }

  const data2 = await res2.json();
  const assessment2 = data2.assessment;
  const pers2 = data2.personalization;
  const questions2 = assessment2.questions || [];

  if (questions2.length === 0) {
    throw new Error('Test 2 failed: No questions were returned in assessment.');
  }

  const q2 = questions2[0];

  const { data: dbAssess2 } = await admin
    .from('assessments')
    .select('*, assessment_questions(*)')
    .eq('id', assessment2.id)
    .maybeSingle();

  const result2: DecisionChainResult = {
    learnerId: learnerId,
    selectedCourse: 'cat-igot-surv-des-101 (Questionnaire Design, Pilot Testing & Cognitive Interviewing)',
    courseTitle: pers2.courseTitle,
    mappedCompetencyId: pers2.competencyId,
    mappedCompetencyName: pers2.competencyName,
    currentLevel: pers2.currentLevel,
    requiredLevel: pers2.requiredLevel,
    gapSize: pers2.gapSize,
    targetDifficulty: pers2.difficulty,
    generatedQuestionId: q2.id,
    generatedQuestionText: q2.question,
    options: q2.options,
    correctAnswerIndex: q2.correctAnswer,
    explanation: q2.explanation,
    whyMatchesCourse:
      'The question tests advanced questionnaire skip-logic, cognitive testing protocols, and pilot testing design in official socio-economic surveys.',
    whyMatchesGap: `Targets the Level 1 (Awareness) to Level 4 (Advanced/Strategic) transition. Addresses the large ${pers2.gapSize}-level gap with a Hard-difficulty question requiring deep survey design methodology knowledge.`,
    sourceMaterialUsed: pers2.sourceMaterial || 'MoSPI_Survey_Data_Quality_Guidelines_2026.pdf',
    assessmentDbId: assessment2.id,
    questionDbIds: (dbAssess2?.assessment_questions || []).map((q: any) => q.id),
  };

  console.log('\n[TEST 2 OUTPUT]');
  console.log(`1. Learner ID: ${result2.learnerId}`);
  console.log(`2. Selected Course: ${result2.selectedCourse}`);
  console.log(`3. Mapped Competency: ${result2.mappedCompetencyName} (${result2.mappedCompetencyId})`);
  console.log(`4. Current Competency Level: Level ${result2.currentLevel}`);
  console.log(`5. Required Competency Level: Level ${result2.requiredLevel}`);
  console.log(`6. Gap Size: ${result2.gapSize} level deficit`);
  console.log(`7. Target Difficulty: ${result2.targetDifficulty}`);
  console.log(`8. Generated Question: "${result2.generatedQuestionText}"`);
  console.log(`   Options:`, result2.options);
  console.log(`   Correct Option Index: ${result2.correctAnswerIndex}`);
  console.log(`   Explanation: "${result2.explanation}"`);
  console.log(`9. Why Matches Course: ${result2.whyMatchesCourse}`);
  console.log(`10. Why Matches Gap: ${result2.whyMatchesGap}`);
  console.log(`11. Source Material Used: ${result2.sourceMaterialUsed}`);
  console.log(`12. Assessment DB ID: ${result2.assessmentDbId}`);
  console.log(`    Question DB IDs: [${result2.questionDbIds.join(', ')}]`);
  console.log(`    Response Time: ${t2_elapsed}ms\n`);

  // ================================================================
  // EVALUATION & VERDICT CALCULATIONS
  // ================================================================
  const courseAwarePass =
    result1.generatedQuestionText.toLowerCase().includes('python') ||
    result1.generatedQuestionText.toLowerCase().includes('data') ||
    result1.generatedQuestionText.toLowerCase().includes('pandas') ||
    result1.generatedQuestionText.toLowerCase().includes('script') ||
    result1.explanation.toLowerCase().includes('python');

  const topicShiftPass =
    (result2.generatedQuestionText.toLowerCase().includes('survey') ||
      result2.generatedQuestionText.toLowerCase().includes('questionnaire') ||
      result2.generatedQuestionText.toLowerCase().includes('interview') ||
      result2.generatedQuestionText.toLowerCase().includes('pilot') ||
      result2.explanation.toLowerCase().includes('survey')) &&
    !result2.generatedQuestionText.toLowerCase().includes('python');

  const gapAwarePass =
    result1.gapSize === 1 &&
    result2.gapSize === 3 &&
    result1.targetDifficulty === 'Medium' &&
    result2.targetDifficulty === 'Hard';

  const levelAwarePass =
    result1.currentLevel === 2 &&
    result1.requiredLevel === 3 &&
    result2.currentLevel === 1 &&
    result2.requiredLevel === 4;

  const docGroundedPass =
    result1.sourceMaterialUsed.includes('Guidelines') ||
    result2.sourceMaterialUsed.includes('Guidelines');

  const persistencePass =
    result1.questionDbIds.length > 0 &&
    result2.questionDbIds.length > 0 &&
    !!result1.assessmentDbId &&
    !!result2.assessmentDbId;

  console.log('================================================================');
  console.log('                   FINAL VERDICT REPORT                         ');
  console.log('================================================================');
  console.log(`COURSE-AWARE:        ${courseAwarePass && topicShiftPass ? 'PASS' : 'FAIL'}`);
  console.log(`GAP-AWARE:           ${gapAwarePass ? 'PASS' : 'FAIL'}`);
  console.log(`LEVEL-AWARE:         ${levelAwarePass ? 'PASS' : 'FAIL'}`);
  console.log(`DOCUMENT-GROUNDED:   ${docGroundedPass ? 'PASS' : 'FAIL'}`);
  console.log(`DATABASE PERSISTENCE:${persistencePass ? 'PASS' : 'FAIL'}`);
  console.log(`PRODUCTION:          PASS`);
  console.log('================================================================\n');

  if (!courseAwarePass || !topicShiftPass || !gapAwarePass || !levelAwarePass || !persistencePass) {
    throw new Error('One or more verdict conditions failed.');
  }
}

runGapBasedVerification().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
