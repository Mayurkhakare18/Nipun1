import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { INITIAL_COMPETENCIES } from '../server/db.js';
import { CLIENT_ASSESSMENTS } from '../src/services/assessmentData.js';
import { UNIFIED_CATALOGUE_DATASET } from '../server/integrations/catalogue.service.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://dnrqtmadtmgizqdchrbk.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('[SEED] SUPABASE_SERVICE_ROLE_KEY is required in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function seedMasterCatalog() {
  console.log('================================================================');
  console.log('   NIPUN — SEEDING MASTER CATALOG & PARENT DATA IN SUPABASE      ');
  console.log('================================================================\n');

  // 1. COMPETENCY FRAMEWORKS (4 Domains)
  console.log('[1/8] Seeding competency_framework...');
  const frameworks = [
    {
      id: 'fw-stat',
      name: 'Statistical Competencies',
      domain: 'STATISTICAL_COMPETENCIES',
      description: 'Core statistical methodologies, survey designs, national accounts and estimation standards for official statistics.',
      frac_aligned: true,
      version: '2.0',
    },
    {
      id: 'fw-tech',
      name: 'Technical Competencies',
      domain: 'TECHNICAL_COMPETENCIES',
      description: 'Data science, programming, database systems, AI/ML and computational tools for official data processing.',
      frac_aligned: true,
      version: '2.0',
    },
    {
      id: 'fw-gov',
      name: 'Digital Governance',
      domain: 'DIGITAL_GOVERNANCE',
      description: 'Cybersecurity, DPDP Act data privacy, consent frameworks and digital public infrastructure.',
      frac_aligned: true,
      version: '2.0',
    },
    {
      id: 'fw-beh',
      name: 'Behavioural & Managerial',
      domain: 'BEHAVIOURAL_MANAGERIAL',
      description: 'Leadership, team management, public statistical communication, and UN Fundamental Principles of Official Statistics.',
      frac_aligned: true,
      version: '2.0',
    },
  ];

  const { error: fwErr } = await supabase.from('competency_framework').upsert(frameworks, { onConflict: 'id' });
  if (fwErr) throw new Error(`Failed to seed competency_framework: ${fwErr.message}`);
  console.log(`  -> ${frameworks.length} frameworks upserted.`);

  // 2. COMPETENCIES (20 Standardized Competencies)
  console.log('\n[2/8] Seeding competencies...');
  const competencyRows = INITIAL_COMPETENCIES.map((c) => {
    let frameworkId = 'fw-stat';
    let domain = 'STATISTICAL_COMPETENCIES';
    if (c.id.startsWith('comp-tech')) {
      frameworkId = 'fw-tech';
      domain = 'TECHNICAL_COMPETENCIES';
    } else if (c.id.startsWith('comp-gov')) {
      frameworkId = 'fw-gov';
      domain = 'DIGITAL_GOVERNANCE';
    } else if (c.id.startsWith('comp-beh')) {
      frameworkId = 'fw-beh';
      domain = 'BEHAVIOURAL_MANAGERIAL';
    }

    const code = c.id.replace('comp-', '').toUpperCase();

    return {
      id: c.id,
      framework_id: frameworkId,
      code,
      name: c.name,
      domain,
      description: c.description || `${c.name} competency rubric for Indian Statistical System.`,
      weight: c.weight || 1.0,
      level_1_rubric: `Basic awareness and theoretical knowledge of ${c.name}.`,
      level_2_rubric: `Procedural understanding and routine execution of ${c.name} tasks under guidance.`,
      level_3_rubric: `Independent operational mastery in applying ${c.name} for official statistical production.`,
      level_4_rubric: `Advanced problem solving, method calibration, and pipeline leadership in ${c.name}.`,
      level_5_rubric: `National expert and standard author for ${c.name} across MoSPI and international bodies.`,
    };
  });

  const { error: compErr } = await supabase.from('competencies').upsert(competencyRows, { onConflict: 'id' });
  if (compErr) throw new Error(`Failed to seed competencies: ${compErr.message}`);
  console.log(`  -> ${competencyRows.length} competencies upserted.`);

  // 3. DEPARTMENTS & DIVISIONS
  console.log('\n[3/8] Seeding departments...');
  const departments = [
    {
      id: 'dept-sdrd',
      name: 'Survey Design and Research Division (SDRD)',
      short_code: 'SDRD',
      ministry: 'Ministry of Statistics & Programme Implementation',
      description: 'Formulation of survey methodologies, sampling frames, schedules of inquiry and tabulations.',
    },
    {
      id: 'dept-fod',
      name: 'Field Operations Division (FOD)',
      short_code: 'FOD',
      ministry: 'Ministry of Statistics & Programme Implementation',
      description: 'Nationwide field data collection, CAPI operations, and enumeration block management.',
    },
    {
      id: 'dept-nad',
      name: 'National Accounts Division (NAD)',
      short_code: 'NAD',
      ministry: 'Ministry of Statistics & Programme Implementation',
      description: 'Compilation of National Accounts Statistics, GDP, GVA, Supply-Use Tables and capital formation.',
    },
    {
      id: 'dept-esd',
      name: 'Economic Statistics Division (ESD)',
      short_code: 'ESD',
      ministry: 'Ministry of Statistics & Programme Implementation',
      description: 'Index of Industrial Production (IIP), Annual Survey of Industries (ASI), and Economic Census.',
    },
    {
      id: 'dept-nssta',
      name: 'National Statistical Systems Training Academy (NSSTA)',
      short_code: 'NSSTA',
      ministry: 'Ministry of Statistics & Programme Implementation',
      description: 'Capacity building, residential officer induction, refresher labs, and TPAC training policies.',
    },
    {
      id: 'dept-analytics',
      name: 'Data Analytics & Dissemination Division',
      short_code: 'DADD',
      ministry: 'Ministry of Statistics & Programme Implementation',
      description: 'Enterprise data architecture, microdata dissemination, open data portals, and AI analytics.',
    },
  ];

  const { error: deptErr } = await supabase.from('departments').upsert(departments, { onConflict: 'id' });
  if (deptErr) throw new Error(`Failed to seed departments: ${deptErr.message}`);
  console.log(`  -> ${departments.length} departments upserted.`);

  // 4. CADRES & ROLES
  console.log('\n[4/8] Seeding roles...');
  const roles = [
    {
      id: 'role-jso',
      title: 'Junior Statistical Officer',
      cadre: 'SSS',
      pay_level: 7,
      description: 'Primary data validation, field supervision, and basic statistical tabulation.',
      gazetted: false,
    },
    {
      id: 'role-sso',
      title: 'Senior Statistical Officer',
      cadre: 'SSS',
      pay_level: 8,
      description: 'Data scrutiny, Python/Stata processing, survey microdata quality audits.',
      gazetted: true,
    },
    {
      id: 'role-ad',
      title: 'Assistant Director (Statistics)',
      cadre: 'ISS',
      pay_level: 10,
      description: 'Division unit lead, sampling frame design, indicator methodology, and team leadership.',
      gazetted: true,
    },
    {
      id: 'role-dd',
      title: 'Deputy Director (Statistics)',
      cadre: 'ISS',
      pay_level: 11,
      description: 'Major statistical survey project management, econometric modeling, SUT compilation.',
      gazetted: true,
    },
    {
      id: 'role-jd',
      title: 'Joint Director',
      cadre: 'ISS',
      pay_level: 12,
      description: 'National survey policy formulation, international statistical coordination (UN/IMF).',
      gazetted: true,
    },
    {
      id: 'role-dir',
      title: 'Director',
      cadre: 'ISS',
      pay_level: 13,
      description: 'Division leadership, official release authorization, strategic capacity building.',
      gazetted: true,
    },
  ];

  const { error: roleErr } = await supabase.from('roles').upsert(roles, { onConflict: 'id' });
  if (roleErr) throw new Error(`Failed to seed roles: ${roleErr.message}`);
  console.log(`  -> ${roles.length} roles upserted.`);

  // 5. ASSESSMENTS & DIAGNOSTIC QUIZZES
  console.log('\n[5/8] Seeding assessments...');
  // Helper to map competency string to competency ID
  function getCompId(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('python')) return 'comp-tech-01';
    if (n.includes('national accounts') || n.includes('sna')) return 'comp-stat-03';
    if (n.includes('survey') || n.includes('sampling')) return 'comp-stat-01';
    if (n.includes('price') || n.includes('cpi')) return 'comp-stat-04';
    if (n.includes('sdc') || n.includes('disclosure') || n.includes('privacy')) return 'comp-gov-02';
    if (n.includes('sql') || n.includes('database')) return 'comp-tech-04';
    if (n.includes('sdg')) return 'comp-stat-05';
    if (n.includes('quality')) return 'comp-stat-06';
    return 'comp-stat-01';
  }

  const assessmentRows = CLIENT_ASSESSMENTS.map((a) => ({
    id: a.id,
    title: a.title,
    competency_id: getCompId(a.competency),
    description: a.description,
    time_limit_minutes: a.timeLimitMinutes || 12,
    passing_score: a.passingScore || 70,
    is_ai_generated: false,
    created_at: new Date().toISOString(),
  }));

  // Also include assess-sdc-privacy if not in CLIENT_ASSESSMENTS
  if (!assessmentRows.find((a) => a.id === 'assess-sdc-privacy')) {
    assessmentRows.push({
      id: 'assess-sdc-privacy',
      title: 'Statistical Disclosure Control (SDC) & DPDP Compliance Diagnostic',
      competency_id: 'comp-gov-02',
      description: 'Assessment on microdata anonymization, k-anonymity, and DPDP Act compliance.',
      time_limit_minutes: 10,
      passing_score: 70,
      is_ai_generated: false,
      created_at: new Date().toISOString(),
    });
  }

  const { error: assessErr } = await supabase.from('assessments').upsert(assessmentRows, { onConflict: 'id' });
  if (assessErr) throw new Error(`Failed to seed assessments: ${assessErr.message}`);
  console.log(`  -> ${assessmentRows.length} assessments upserted.`);

  // 6. ASSESSMENT QUESTIONS
  console.log('\n[6/8] Seeding assessment_questions...');
  const questionRows: any[] = [];

  for (const a of CLIENT_ASSESSMENTS) {
    if (a.questions && a.questions.length > 0) {
      a.questions.forEach((q, idx) => {
        questionRows.push({
          id: q.id || `${a.id}-q${idx + 1}`,
          assessment_id: a.id,
          question_text: q.question,
          options: q.options,
          correct_answer_index: q.correctAnswer,
          explanation: q.explanation,
          topic: q.topic || `${a.competency} Core Applications`,
          difficulty: q.difficulty || 'Medium',
          order_index: idx + 1,
        });
      });
    }
  }

  // Add questions for assess-sdc-privacy
  if (!questionRows.find((q) => q.assessment_id === 'assess-sdc-privacy')) {
    questionRows.push(
      {
        id: 'sdc-q1',
        assessment_id: 'assess-sdc-privacy',
        question_text: 'Under the Digital Personal Data Protection (DPDP) Act, what is the mandatory requirement before disseminating public-use survey microdata?',
        options: [
          'Direct identifiers must be removed and quasi-identifiers transformed to satisfy k-anonymity thresholds',
          'Consent forms must be physically signed by all 1.4 billion citizens',
          'Microdata can only be shared as uncompressed raw text files',
          'All household income figures must be multiplied by zero',
        ],
        correct_answer_index: 0,
        explanation: 'Statistical Disclosure Control requires de-identification and perturbative/non-perturbative masking of quasi-identifiers.',
        topic: 'DPDP Act Compliance',
        difficulty: 'Medium',
        order_index: 1,
      },
      {
        id: 'sdc-q2',
        assessment_id: 'assess-sdc-privacy',
        question_text: 'In Statistical Disclosure Control (SDC), what risk does k-anonymity specifically protect against?',
        options: [
          'Identity disclosure resulting from linking survey records with external public registers',
          'Data corruption due to hard drive failure',
          'Sampling bias caused by non-response in rural clusters',
          'Network packet sniffing during HTTPS data transmission',
        ],
        correct_answer_index: 0,
        explanation: 'k-anonymity ensures each combination of quasi-identifiers in the microdata is indistinguishable from at least k-1 other individuals.',
        topic: 'k-Anonymity & Re-identification Risk',
        difficulty: 'Hard',
        order_index: 2,
      }
    );
  }

  const { error: qErr } = await supabase.from('assessment_questions').upsert(questionRows, { onConflict: 'id' });
  if (qErr) throw new Error(`Failed to seed assessment_questions: ${qErr.message}`);
  console.log(`  -> ${questionRows.length} assessment questions upserted.`);

  // 7. COURSES (iGOT Karmayogi Catalog)
  console.log('\n[7/8] Seeding courses...');
  const igotCourses = UNIFIED_CATALOGUE_DATASET.filter((i) => i.source === 'iGOT Karmayogi');

  const courseRows = igotCourses.map((c) => ({
    id: c.id,
    provider: 'iGOT Karmayogi',
    title: c.title,
    description: c.description,
    competency_id: getCompId(c.competency),
    target_level: c.competencyLevel || 3,
    category: c.domain || 'Official Statistics',
    difficulty: c.difficulty || 'Intermediate',
    duration: c.duration || '2h 30m',
    rating: c.rating || 4.8,
    enrolled_count: c.enrolledCount || 100,
    course_url: c.url || 'https://igotkarmayogi.gov.in',
    is_frac_certified: true,
  }));

  const { error: courseErr } = await supabase.from('courses').upsert(courseRows, { onConflict: 'id' });
  if (courseErr) throw new Error(`Failed to seed courses: ${courseErr.message}`);
  console.log(`  -> ${courseRows.length} courses upserted.`);

  // 8. TRAINING PROGRAMMES (NSSTA Greater Noida)
  console.log('\n[8/8] Seeding training_programmes...');
  const nsstaProgrammes = UNIFIED_CATALOGUE_DATASET.filter((i) => i.source.includes('NSSTA'));

  const programmeRows = nsstaProgrammes.map((p) => ({
    id: p.id,
    academy: 'NSSTA',
    title: p.title,
    category: p.difficulty || 'Specialized In-Service Lab',
    duration: p.duration || '3 Days',
    mode: p.mode || 'In-Person (NSSTA Campus, Greater Noida)',
    target_cadre: 'ISS / SSS Officers',
    eligibility: 'In-service statistical officers nominated by division heads or Cadre Management Unit.',
    tpac_aligned: true,
    upcoming_batch_date: '2026-10-15',
    seats_available: 25,
    description: p.description,
    curriculum_modules: p.learningObjectives || [],
  }));

  const { error: progErr } = await supabase.from('training_programmes').upsert(programmeRows, { onConflict: 'id' });
  if (progErr) throw new Error(`Failed to seed training_programmes: ${progErr.message}`);
  console.log(`  -> ${programmeRows.length} training programmes upserted.`);

  console.log('\n================================================================');
  console.log(' [SUCCESS] ALL MASTER CATALOG TABLES SEEDED IDEMPOTENTLY!       ');
  console.log('================================================================\n');

  // Verify actual row counts
  const tables = [
    'competency_framework',
    'competencies',
    'departments',
    'roles',
    'assessments',
    'assessment_questions',
    'courses',
    'training_programmes',
  ];

  console.log('--- VERIFIED SUPABASE POSTGRESQL ROW COUNTS ---');
  for (const tbl of tables) {
    const { count, error } = await supabase.from(tbl).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`❌ ${tbl}: ${error.message}`);
    } else {
      console.log(`✅ ${tbl.padEnd(25)}: ${count} rows`);
    }
  }
  console.log('\n');
}

// Run directly
seedMasterCatalog()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal seed error:', err);
    process.exit(1);
  });
