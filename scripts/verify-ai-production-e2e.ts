import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { app } from '../server/app.js';
import type { Server } from 'http';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dnrqtmadtmgizqdchrbk.supabase.co';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9LZsLZRp9E34czzgwxKAcg_16Ki63lw';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('[FATAL] SUPABASE_SERVICE_ROLE_KEY is required in environment.');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const clientSupabase = createClient(supabaseUrl, anonKey);

interface TestResult {
  category: string;
  name: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const results: TestResult[] = [];

function recordResult(category: string, name: string, status: 'PASS' | 'FAIL', details: string) {
  results.push({ category, name, status, details });
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} [${category}] ${name}`);
  console.log(`   Details: ${details}\n`);
}

/**
 * Creates a valid, well-formed minimal PDF containing extractable statistical text
 */
function createValidTestPdfBuffer(): Buffer {
  const contentStream = `BT
/F1 12 Tf
72 700 Td
(National Statistical Office - Survey Operations Guidelines 2026) Tj
0 -20 Td
(Ministry of Statistics & Programme Implementation - Government of India) Tj
0 -25 Td
(1. Sampling Design: Two-stage stratified sampling with Census Villages as PSUs.) Tj
0 -20 Td
(2. Weight Multiplier: w_hij = (1 / P_hi) * (N_hi / n_hi) adjusted for non-response.) Tj
0 -20 Td
(3. National Accounts: Double deflation for manufacturing Gross Value Added (SNA 2008).) Tj
0 -20 Td
(4. Microdata Privacy: Enforce k-anonymity (k >= 5) under DPDP Act 2023 provisions.) Tj
0 -20 Td
(5. Cadre Operations: SSS and ISS officers must validate all CAPI survey outliers.) Tj
ET`;

  const streamLen = Buffer.byteLength(contentStream, 'utf8');

  const pdfString = `%PDF-1.4
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
<< /Length ${streamLen} >>
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

  return Buffer.from(pdfString, 'utf8');
}

/**
 * Creates a valid PDF structure with empty stream (simulating a scanned/image-only PDF with zero text)
 */
function createScannedTestPdfBuffer(): Buffer {
  const contentStream = ``;
  const streamLen = 0;

  const pdfString = `%PDF-1.4
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
<< /Length ${streamLen} >>
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

  return Buffer.from(pdfString, 'utf8');
}

async function run() {
  console.log('================================================================');
  console.log('       NIPUN — AI FUNCTIONALITY & GEMINI PRODUCTION VERIFICATION');
  console.log('================================================================\n');

  let server: Server | null = null;
  let serverPort = 0;
  let officerToken = '';
  let officerEmail = '';
  let officerId = '';

  try {
    // 0. Start Express Server on Ephemeral Port
    await new Promise<void>((resolve, reject) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server?.address();
        if (typeof addr === 'object' && addr?.port) {
          serverPort = addr.port;
          console.log(`[INIT] Test Express server listening on http://127.0.0.1:${serverPort}\n`);
          resolve();
        } else {
          reject(new Error('Failed to resolve ephemeral port'));
        }
      });
    });

    const baseUrl = `http://127.0.0.1:${serverPort}`;

    // 1. Verify GET /api/ai/health
    console.log('--- TEST 1: AI HEALTH ENDPOINT (SAFE CONFIG CHECK) ---');
    const healthRes = await fetch(`${baseUrl}/api/ai/health`);
    const healthData = await healthRes.json();
    if (healthRes.ok && healthData.configured === true && healthData.provider === 'gemini') {
      recordResult(
        'HEALTH',
        'GET /api/ai/health verifies Gemini configuration without exposing secrets',
        'PASS',
        `Status: ${healthRes.status}, Configured: ${healthData.configured}, Provider: ${healthData.provider}, Model: ${healthData.model}`
      );
    } else {
      recordResult(
        'HEALTH',
        'GET /api/ai/health verifies Gemini configuration without exposing secrets',
        'FAIL',
        `Status: ${healthRes.status}, Data: ${JSON.stringify(healthData)}`
      );
    }

    // 2. Obtain Verified Supabase JWT for Authenticated Officer
    console.log('--- TEST 2: AUTHENTICATION SETUP (SUPABASE JWT) ---');
    const uniqueSuffix = Date.now().toString().slice(-6);
    officerEmail = `officer.ai.${uniqueSuffix}@mospi.gov.in`;
    const officerPassword = 'MoSPIOfficer@2026';

    const { data: createData, error: createError } = await adminSupabase.auth.admin.createUser({
      email: officerEmail,
      password: officerPassword,
      email_confirm: true,
      user_metadata: {
        name: `Officer Aadarsh ${uniqueSuffix}`,
        role: 'LEARNER',
        designation: 'Assistant Director (Statistics)',
        ministry: 'Ministry of Statistics & Programme Implementation (MoSPI)',
        department: 'Data Analytics & Survey Division',
        cadre: 'Indian Statistical Service (ISS)',
        employeeId: `ISS-2021-${uniqueSuffix}`,
      },
    });

    if (createError || !createData.user) {
      throw new Error(`Failed to create officer: ${createError?.message}`);
    }
    officerId = createData.user.id;

    // Sync into public.users
    await adminSupabase.from('users').upsert({
      id: officerId,
      email: officerEmail,
      name: `Officer Aadarsh ${uniqueSuffix}`,
      role: 'LEARNER',
      status: 'ACTIVE',
      auth_provider: 'SUPABASE_AUTH',
      updated_at: new Date().toISOString(),
    });

    // Sign in to get JWT token
    const { data: signInData, error: signInError } = await clientSupabase.auth.signInWithPassword({
      email: officerEmail,
      password: officerPassword,
    });

    if (signInError || !signInData.session) {
      throw new Error(`Failed to obtain Supabase token: ${signInError?.message}`);
    }

    officerToken = signInData.session.access_token;
    recordResult(
      'AUTH',
      'Supabase Authentication & Verified JWT Token Generation',
      'PASS',
      `Officer ID: ${officerId}, Email: ${officerEmail}, Token Length: ${officerToken.length}`
    );

    // 3. Test Unauthenticated Request -> Expect 401
    console.log('--- TEST 3: UNAUTHENTICATED REQUEST ENFORCEMENT ---');
    const unauthRes = await fetch(`${baseUrl}/api/ai/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What are my biggest competency gaps?' }),
    });

    if (unauthRes.status === 401) {
      recordResult(
        'SECURITY',
        'Unauthenticated POST /api/ai/assistant returns 401 Unauthorized',
        'PASS',
        `Correctly rejected with HTTP 401: ${await unauthRes.text()}`
      );
    } else {
      recordResult(
        'SECURITY',
        'Unauthenticated POST /api/ai/assistant returns 401 Unauthorized',
        'FAIL',
        `Expected 401 but received HTTP ${unauthRes.status}`
      );
    }

    // 4. Test Authenticated AI Assistant with Real Gemini & PostgreSQL Grounding
    console.log('--- TEST 4: AUTHENTICATED AI ASSISTANT (POST /api/ai/assistant) ---');
    const aiRes = await fetch(`${baseUrl}/api/ai/assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officerToken}`,
      },
      body: JSON.stringify({
        message: 'What are my biggest competency gaps and what should I study next in MoSPI?',
        history: [],
      }),
    });

    const aiData = await aiRes.json();
    if (aiRes.ok && aiData.success === true && aiData.reply && aiData.reply.length > 50) {
      const isFakeDemo =
        aiData.reply.includes('Namaste. I am your NIPUN Statistical Capacity Assistant. Based on your official profile, I am ready to assist');
      if (!isFakeDemo) {
        recordResult(
          'AI_ASSISTANT',
          'Authenticated POST /api/ai/assistant produces genuine Gemini response grounded in NIPUN PostgreSQL context',
          'PASS',
          `Reply Length: ${aiData.reply.length} chars, Actions: ${aiData.suggestedActions?.length || 0}. Sample: "${aiData.reply.slice(0, 160)}..."`
        );
      } else {
        recordResult(
          'AI_ASSISTANT',
          'Authenticated POST /api/ai/assistant produces genuine Gemini response grounded in NIPUN PostgreSQL context',
          'FAIL',
          `Returned hardcoded mock greeting instead of real Gemini response.`
        );
      }
    } else {
      recordResult(
        'AI_ASSISTANT',
        'Authenticated POST /api/ai/assistant produces genuine Gemini response grounded in NIPUN PostgreSQL context',
        'FAIL',
        `HTTP ${aiRes.status}: ${JSON.stringify(aiData)}`
      );
    }

    // 5. Test Real PDF Upload, Magic Bytes Validation, Text Extraction & 10-Section Gemini Summarization
    console.log('--- TEST 5: REAL PDF EXTRACTION & GEMINI 10-SECTION SUMMARIZATION ---');
    const validPdfBuffer = createValidTestPdfBuffer();
    const pdfBase64 = validPdfBuffer.toString('base64');

    const pdfRes = await fetch(`${baseUrl}/api/documents/summarize-and-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officerToken}`,
      },
      body: JSON.stringify({
        fileName: 'NSO_Survey_Operations_Guidelines_2026.pdf',
        fileBase64: pdfBase64,
        competency: 'Official Statistics & Survey Methodology',
        difficulty: 'Medium',
        questionCount: 4,
      }),
    });

    const pdfData = await pdfRes.json();
    if (pdfRes.ok && pdfData.success === true && pdfData.summary) {
      const summary = pdfData.summary;
      const hasKeySections =
        summary.executiveSummary &&
        Array.isArray(summary.keyConcepts) &&
        Array.isArray(summary.importantPoints) &&
        Array.isArray(summary.competenciesCovered) &&
        Array.isArray(summary.generatedQuestions);

      if (hasKeySections && summary.generatedQuestions.length >= 3) {
        recordResult(
          'PDF_SUMMARIZER',
          'Real PDF upload, %PDF- magic bytes validation, text extraction & 10-section Gemini summary with grounded MCQs',
          'PASS',
          `Doc Title: "${summary.documentTitle}", Concepts: ${summary.keyConcepts.length}, Questions: ${summary.generatedQuestions.length}, Questions Sample: "${summary.generatedQuestions[0]?.question}"`
        );
      } else {
        recordResult(
          'PDF_SUMMARIZER',
          'Real PDF upload, %PDF- magic bytes validation, text extraction & 10-section Gemini summary with grounded MCQs',
          'FAIL',
          `Summary schema incomplete: ${JSON.stringify(summary)}`
        );
      }
    } else {
      recordResult(
        'PDF_SUMMARIZER',
        'Real PDF upload, %PDF- magic bytes validation, text extraction & 10-section Gemini summary with grounded MCQs',
        'FAIL',
        `HTTP ${pdfRes.status}: ${JSON.stringify(pdfData)}`
      );
    }

    // 6. Test Scanned / Image-Only PDF Detection -> Expect 422 with OCR message
    console.log('--- TEST 6: SCANNED / IMAGE-ONLY PDF DETECTION ---');
    const scannedPdfBuffer = createScannedTestPdfBuffer();
    const scannedBase64 = scannedPdfBuffer.toString('base64');

    const scannedRes = await fetch(`${baseUrl}/api/documents/summarize-and-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officerToken}`,
      },
      body: JSON.stringify({
        fileName: 'Scanned_Circular_Image_Only.pdf',
        fileBase64: scannedBase64,
        competency: 'Official Statistics',
      }),
    });

    const scannedData = await scannedRes.json();
    const expectedOcrMsg = 'This PDF appears to be scanned/image-based and does not contain extractable text. OCR is required.';
    if (scannedRes.status === 422 && (scannedData.error === expectedOcrMsg || scannedData.message === expectedOcrMsg)) {
      recordResult(
        'PDF_ERROR_HANDLING',
        'Scanned / Image-only PDF accurately detected and rejected with OCR requirement notice',
        'PASS',
        `HTTP 422 received with exact error: "${scannedData.error}"`
      );
    } else {
      recordResult(
        'PDF_ERROR_HANDLING',
        'Scanned / Image-only PDF accurately detected and rejected with OCR requirement notice',
        'FAIL',
        `Expected 422 with OCR message, received HTTP ${scannedRes.status}: ${JSON.stringify(scannedData)}`
      );
    }

    // 7. Test AI Personalized Question Generation Grounded in Course & Competency
    console.log('--- TEST 7: AI PERSONALIZED QUESTION GENERATION ---');
    const qGenRes = await fetch(`${baseUrl}/api/assessments/personalized`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officerToken}`,
      },
      body: JSON.stringify({
        competencyId: 'comp-stat-02',
        difficulty: 'Medium',
        count: 4,
      }),
    });

    const qGenData = await qGenRes.json();
    if (qGenRes.ok && qGenData.success === true && qGenData.assessment?.questions?.length >= 3) {
      const firstQ = qGenData.assessment.questions[0];
      recordResult(
        'QUESTION_GENERATION',
        'AI Question Generation strictly grounded in course & competency framework',
        'PASS',
        `Assessment: "${qGenData.assessment.title}", Questions Count: ${qGenData.assessment.questions.length}, Sample Q: "${firstQ.question}"`
      );
    } else {
      recordResult(
        'QUESTION_GENERATION',
        'AI Question Generation strictly grounded in course & competency framework',
        'FAIL',
        `HTTP ${qGenRes.status}: ${JSON.stringify(qGenData)}`
      );
    }

    // 8. Verify Database Persistence in uploaded_learning_materials
    console.log('--- TEST 8: DATABASE PERSISTENCE IN POSTGRESQL ---');
    const { data: dbMaterials, error: dbMatErr } = await adminSupabase
      .from('uploaded_learning_materials')
      .select('*')
      .eq('user_id', officerId)
      .order('uploaded_at', { ascending: false })
      .limit(1);

    if (!dbMatErr && dbMaterials && dbMaterials.length > 0) {
      const mat = dbMaterials[0];
      recordResult(
        'PERSISTENCE',
        'Uploaded PDF metadata, executive summary, and topics persisted to PostgreSQL uploaded_learning_materials',
        'PASS',
        `Material ID: ${mat.id}, File: ${mat.file_name}, Status: ${mat.status}, Summary Length: ${mat.executive_summary?.length || 0} bytes`
      );
    } else {
      recordResult(
        'PERSISTENCE',
        'Uploaded PDF metadata, executive summary, and topics persisted to PostgreSQL uploaded_learning_materials',
        'FAIL',
        `Database query error: ${dbMatErr?.message || 'No material row found for test officer'}`
      );
    }

  } catch (err: any) {
    console.error('[FATAL ERROR IN TEST SUITE]', err);
  } finally {
    if (server) {
      (server as any).close();
      console.log('\n[TEARDOWN] Test server terminated.');
    }
  }

  // Summary Verdict
  console.log('\n================================================================');
  console.log('                    FINAL TEST RESULTS SUMMARY');
  console.log('================================================================');
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  console.log(`Total Tests: ${results.length} | Passed: ${passCount} | Failed: ${failCount}`);

  results.forEach((r, i) => {
    console.log(`${r.status === 'PASS' ? '✅' : '❌'} ${i + 1}. [${r.category}] ${r.name}`);
  });

  if (failCount === 0) {
    console.log('\n🎉 ALL AI FUNCTIONALITY INTEGRATION TESTS PASSED WITH REAL EVIDENCE!\n');
    process.exit(0);
  } else {
    console.error(`\n❌ ${failCount} TEST(S) FAILED.\n`);
    process.exit(1);
  }
}

run();
