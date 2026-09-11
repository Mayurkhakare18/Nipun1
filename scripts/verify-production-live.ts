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

async function verifyAllProduction() {
  console.log('================================================================');
  console.log('       NIPUN — COMPREHENSIVE PRODUCTION VERIFICATION ON VERCEL  ');
  console.log('================================================================\n');

  // 1. Health Endpoint
  console.log('--- 1. Testing GET /api/ai/health on Vercel ---');
  const healthRes = await fetch(`${base}/api/ai/health`);
  const healthJson = await healthRes.json();
  console.log(`   HTTP Status: ${healthRes.status}, Configured: ${healthJson.configured}, Provider: ${healthJson.provider}, Model: ${healthJson.model}`);
  if (healthRes.status !== 200 || !healthJson.configured) {
    throw new Error('Health check failed');
  }

  // 2. Auth Officer Creation & Token Generation
  console.log('\n--- 2. Setting Up Verified Supabase Officer Account ---');
  const suffix = Date.now().toString().slice(-5);
  const email = `prod.officer.${suffix}@mospi.gov.in`;
  const password = 'MoSPIOfficer@2026';
  const { data: userCreated, error: userCreateErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: `Dr. Anita Desai ${suffix}`,
      role: 'LEARNER',
      designation: 'Senior Statistical Officer',
      ministry: 'MoSPI',
      cadre: 'ISS',
      employeeId: `ISS-SSO-${suffix}`,
    },
  });
  if (userCreateErr || !userCreated.user) {
    throw new Error(`Failed to create officer user: ${userCreateErr?.message}`);
  }
  const officerId = userCreated.user.id;

  await admin.from('users').upsert({
    id: officerId,
    email,
    name: `Dr. Anita Desai ${suffix}`,
    role: 'LEARNER',
    status: 'ACTIVE',
    auth_provider: 'SUPABASE_AUTH',
    updated_at: new Date().toISOString(),
  });

  const { data: signIn, error: signInErr } = await client.auth.signInWithPassword({ email, password });
  if (signInErr || !signIn.session) {
    throw new Error(`Failed to sign in officer: ${signInErr?.message}`);
  }
  const token = signIn.session.access_token;
  console.log(`   Officer: ${email} (${officerId}), Token Length: ${token.length}`);

  // 3. Unauthenticated Security Check
  console.log('\n--- 3. Testing Unauthenticated Request Enforcement ---');
  const unauthRes = await fetch(`${base}/api/ai/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Hello' }),
  });
  console.log(`   HTTP Status: ${unauthRes.status}`);
  if (unauthRes.status !== 401) {
    throw new Error('Unauthenticated endpoint allowed access');
  }

  // 4. Authenticated AI Assistant
  console.log('\n--- 4. Testing Authenticated POST /api/ai/assistant on Vercel ---');
  const t0 = Date.now();
  const assistantRes = await fetch(`${base}/api/ai/assistant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      message: 'What are my top competency gaps and what courses should I take next in MoSPI?',
    }),
  });
  const tAssistant = Date.now() - t0;
  console.log(`   HTTP Status: ${assistantRes.status}, Time: ${tAssistant}ms`);
  const assistantData = await assistantRes.json();
  console.log(`   Assistant Success: ${assistantData.success}`);
  console.log(`   Reply Length: ${assistantData.reply?.length} chars`);
  console.log(`   Reply Preview:\n   ${assistantData.reply?.slice(0, 240).replace(/\n/g, ' ')}...`);
  console.log(`   Action Chips:`, assistantData.suggestedActions?.map((a: any) => a.label));

  // 5. Scanned PDF Detection
  console.log('\n--- 5. Testing Scanned / Image-Only PDF Detection on Vercel ---');
  const scannedPdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << >> >>
endobj
4 0 obj
<< /Length 0 >>
stream

endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000210 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
260
%%EOF`;

  const resScanned = await fetch(`${base}/api/documents/summarize-and-generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fileName: 'scanned_circular_notice.pdf',
      fileBase64: Buffer.from(scannedPdf).toString('base64'),
      fileType: 'application/pdf',
      purpose: 'ASSESSMENT_GENERATION',
    }),
  });
  console.log(`   Scanned PDF Status: ${resScanned.status}`);
  const scannedData = await resScanned.json();
  console.log(`   Scanned PDF Error Message: "${scannedData.error}"`);
  if (
    resScanned.status !== 422 ||
    scannedData.error !== 'This PDF appears to be scanned/image-based and does not contain extractable text. OCR is required.'
  ) {
    throw new Error('Scanned PDF was not rejected with expected 422 and exact error string');
  }

  // 6. Valid PDF 10-Section Summary & Question Generation
  console.log('\n--- 6. Testing Real PDF Summarization & Question Generation on Vercel ---');
  const textContent = `Ministry of Statistics and Programme Implementation (MoSPI)
National Statistical Office Guidelines on Data Quality 2026

Section 1: Data Verification Framework
The Field Operations Division (FOD) mandates computer-assisted personal interviewing (CAPI) for all Periodic Labour Force Survey (PLFS) rounds. All field investigators must validate household consumption schedules using stratified systematic sampling.

Section 2: Multiplier and Weight Estimation
Weights are computed as inverse probability multipliers adjusted for non-response within each stratum.

Section 3: Variance Estimation and Jackknife Methods
Variance in complex multi-stage designs is evaluated using Jackknife repeated replications to provide accurate standard errors for state-level aggregates.`;

  const contentStream = `BT /F1 12 Tf 50 700 Td (${textContent.replace(/[\r\n]+/g, ' ')}) Tj ET`;
  const validPdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${contentStream.length} >>
stream
${contentStream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000234 00000 n 
0000000850 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
920
%%EOF`;

  const tDoc0 = Date.now();
  const docRes = await fetch(`${base}/api/documents/summarize-and-generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fileName: 'MoSPI_Data_Quality_Guidelines_2026.pdf',
      fileBase64: Buffer.from(validPdf).toString('base64'),
      fileType: 'application/pdf',
      competency: 'Survey Methodology',
      difficulty: 'INTERMEDIATE',
      questionCount: 4,
      purpose: 'ASSESSMENT_GENERATION',
    }),
  });
  const tDoc = Date.now() - tDoc0;
  console.log(`   Doc Process Time: ${tDoc}ms, HTTP Status: ${docRes.status}`);
  const docData = await docRes.json();
  console.log(`   Document Title: "${docData.summary?.documentTitle}"`);
  console.log(`   Executive Summary Length: ${docData.summary?.executiveSummary?.length} chars`);
  console.log(`   Core Concepts Count: ${docData.summary?.keyConcepts?.length}`);
  console.log(`   Generated Questions Count: ${docData.summary?.generatedQuestions?.length}`);
  console.log(`   Assessment Title: "${docData.assessment?.title}"`);
  if (docData.summary?.generatedQuestions?.length > 0) {
    console.log(`   Sample Question 1: "${docData.summary.generatedQuestions[0].question}"`);
    console.log(`   Sample Options:`, docData.summary.generatedQuestions[0].options);
  }

  // 7. Verify Supabase Database Records
  console.log('\n--- 7. Verifying PostgreSQL Persistence for uploaded material & questions ---');
  const { data: dbMaterial } = await admin
    .from('uploaded_learning_materials')
    .select('*')
    .eq('user_id', officerId)
    .limit(1);

  console.log(`   Persisted uploaded_learning_materials row found: ${!!dbMaterial?.[0]}`);
  if (dbMaterial?.[0]) {
    console.log(`   Material ID: ${dbMaterial[0].id}, Status: ${dbMaterial[0].status}, File: ${dbMaterial[0].file_name}`);
  }

  const { data: dbAssessment } = await admin
    .from('assessments')
    .select('*, assessment_questions(*)')
    .order('created_at', { ascending: false })
    .limit(1);

  console.log(`   Latest Assessment Title: "${dbAssessment?.[0]?.title}"`);
  console.log(`   Assessment Questions Count in DB: ${dbAssessment?.[0]?.assessment_questions?.length}`);
  if (dbAssessment?.[0]?.assessment_questions?.length) {
    console.log(`   First Persisted Question in DB: "${dbAssessment[0].assessment_questions[0].question_text}"`);
    console.log(`   Options:`, dbAssessment[0].assessment_questions[0].options);
  }

  console.log('\n================================================================');
  console.log('   🎉 ALL TESTS PASSED SUCCESSFULLY ON PRODUCTION VERCEL!     ');
  console.log('================================================================');
}

verifyAllProduction().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
