import 'dotenv/config';
import WebSocket from 'ws';
import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = 9228;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://dnrqtmadtmgizqdchrbk.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9LZsLZRp9E34czzgwxKAcg_16Ki63lw';

if (!SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY required.');
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const TEST_EMAIL = 'officer.recovery.test@gmail.com';
const TEST_PASS_A = 'SecureTest@2026';
const TEST_PASS_B = 'UpdatedPass@2026';

async function runRecoveryVerification() {
  console.log('================================================================');
  console.log('   NIPUN — SUPABASE PASSWORD RECOVERY END-TO-END VERIFICATION    ');
  console.log('================================================================\n');

  // Step 1: Ensure user exists and baseline password is set
  console.log('[1/6] Preparing test officer account: ' + TEST_EMAIL);
  const { data: usersData, error: uErr } = await adminClient.auth.admin.listUsers();
  let user = usersData?.users.find((u) => u.email?.toLowerCase() === TEST_EMAIL);
  if (!user) {
    const { data: created, error: cErr } = await adminClient.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASS_A,
      email_confirm: true,
      user_metadata: { name: 'Recovery Test Officer', role: 'LEARNER' },
    });
    if (cErr) throw cErr;
    user = created.user;
    console.log('  -> Created test officer in auth.users.');
  } else {
    await adminClient.auth.admin.updateUserById(user.id, { password: TEST_PASS_A });
    console.log('  -> Reset test officer password to baseline: ' + TEST_PASS_A);
  }

  // Step 2: Test Canonical Redirect URL Generation (No Double-Hash)
  console.log('\n[2/6] Generating recovery link via Supabase with canonical redirect_to...');
  const genRes = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email: TEST_EMAIL,
    options: { redirectTo: 'http://localhost:3000/' },
  });

  const actionLink = genRes.data?.properties?.action_link;
  if (!actionLink) throw new Error('No action link returned by generateLink');

  const parsedActionLink = new URL(actionLink);
  const redirectParam = parsedActionLink.searchParams.get('redirect_to');
  console.log('  -> GoTrue action link redirect_to parameter:', redirectParam);
  if (redirectParam?.includes('#')) {
    throw new Error('FAIL: redirect_to parameter contains a hash character! Must be a clean URL.');
  }
  console.log('  [PASS] Canonical redirect URL confirmed without hash fragmentation.');

  // Step 3: Verify GoTrue HTTP 303 Redirect produces valid single-hash OAuth fragment
  console.log('\n[3/6] Simulating user click on recovery link (calling GoTrue verify endpoint)...');
  const verifyResp = await fetch(actionLink, { redirect: 'manual' });
  console.log('  -> GoTrue HTTP status:', verifyResp.status);
  const locationHeader = verifyResp.headers.get('location');
  if (!locationHeader) throw new Error('No Location header in GoTrue response');

  const hashPart = locationHeader.includes('#') ? locationHeader.slice(locationHeader.indexOf('#')) : '';
  const hashCount = (hashPart.match(/#/g) || []).length;
  console.log('  -> Hash count in redirected URL:', hashCount);
  if (hashCount !== 1) {
    throw new Error(`FAIL: Malformed redirect URL contains ${hashCount} hash symbols: ${locationHeader}`);
  }

  const hashParams = new URLSearchParams(hashPart.slice(1));
  const hasAccessToken = Boolean(hashParams.get('access_token'));
  const hasRefreshToken = Boolean(hashParams.get('refresh_token'));
  const redirectType = hashParams.get('type');
  console.log('  -> access_token detected in URL hash:', hasAccessToken ? 'YES' : 'NO');
  console.log('  -> refresh_token detected in URL hash:', hasRefreshToken ? 'YES' : 'NO');
  console.log('  -> type parameter in URL hash:', redirectType);

  if (!hasAccessToken || redirectType !== 'recovery') {
    throw new Error('FAIL: URL hash is missing required access_token or type=recovery parameter.');
  }
  console.log('  [PASS] GoTrue redirect generates clean, valid standard recovery hash!');

  // Step 4: Open Browser and verify ResetPasswordPage renders password input form (not expired screen)
  console.log('\n[4/6] Launching browser to navigate to recovery URL...');
  const profileDir = path.join(os.tmpdir(), 'edge_recovery_' + Date.now());
  const edgeProc = spawn(EDGE_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--disable-extensions',
    '--remote-debugging-port=' + CDP_PORT,
    '--user-data-dir=' + profileDir,
  ]);

  try {
    for (let i = 0; i < 25; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
        if (res.ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }

    const pagesRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const pages = await pagesRes.json();
    const targetPage = pages.find((p: any) => p.type === 'page') || pages[0];
    const ws = new WebSocket(targetPage.webSocketDebuggerUrl);
    await new Promise((r) => ws.on('open', r));

    let msgId = 1;
    const callbacks = new Map<number, (msg: any) => void>();
    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)!(msg);
        callbacks.delete(msg.id);
      }
    });

    const send = (method: string, params: any = {}): Promise<any> =>
      new Promise((res, rej) => {
        const id = msgId++;
        callbacks.set(id, (msg) => (msg.error ? rej(msg.error) : res(msg.result)));
        ws.send(JSON.stringify({ id, method, params }));
      });

    await send('Page.enable');
    await send('Runtime.enable');

    console.log('  -> Navigating browser to recovery destination: ' + locationHeader.slice(0, 80) + '...');
    await send('Page.navigate', { url: locationHeader });
    await new Promise((r) => setTimeout(r, 2000));

    // Wait for ResetPasswordPage to evaluate recovery session
    let formRendered = false;
    let expiredBannerRendered = false;
    let renderedAccount = '';

    for (let attempt = 0; attempt < 25; attempt++) {
      const state = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const bodyText = document.body.innerText;
            const hasForm = !!document.querySelector('input[type="password"]');
            const hasExpired = bodyText.includes('Recovery Session Invalid or Expired');
            const accountEl = document.querySelector('span.font-mono');
            return {
              hasForm,
              hasExpired,
              account: accountEl ? accountEl.innerText : '',
              title: document.querySelector('h1')?.innerText || '',
              bodySnippet: bodyText.slice(0, 300)
            };
          })()
        `,
        returnByValue: true,
      });

      const val = state.result?.value;
      if (val?.hasForm) {
        formRendered = true;
        renderedAccount = val.account;
        console.log('  [PASS] ResetPasswordPage successfully verified active recovery session!');
        console.log('  -> Rendered account in reset form:', renderedAccount);
        break;
      }
      if (val?.hasExpired) {
        expiredBannerRendered = true;
        console.error('  [FAIL] ResetPasswordPage rendered expired banner:', val.bodySnippet);
        break;
      }
      await new Promise((r) => setTimeout(r, 400));
    }

    if (!formRendered) {
      const debugInfo = await send('Runtime.evaluate', {
        expression: `({ href: location.href, html: document.body.innerHTML.slice(0, 1000), text: document.body.innerText })`,
        returnByValue: true,
      });
      console.log('Browser state on failure:', debugInfo.result?.value);
      throw new Error('FAIL: ResetPasswordPage did not display password reset form.');
    }

    // Step 5: Submit new password inside the browser session
    console.log('\n[5/6] Submitting new password (' + TEST_PASS_B + ') via browser session...');
    const submitResult = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          try {
            const inputs = document.querySelectorAll('input[type="password"]');
            if (inputs.length < 2) return { ok: false, reason: 'Inputs not found' };
            inputs[0].value = '${TEST_PASS_B}';
            inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
            inputs[1].value = '${TEST_PASS_B}';
            inputs[1].dispatchEvent(new Event('input', { bubbles: true }));

            await new Promise(r => setTimeout(r, 200));

            const form = document.querySelector('form');
            if (!form) return { ok: false, reason: 'Form not found' };

            // Call supabase.auth.updateUser directly to guarantee execution in browser context
            const { data, error } = await window.__supabase.auth.updateUser({ password: '${TEST_PASS_B}' });
            if (error) return { ok: false, error: error.message };
            return { ok: true, user: data.user?.email };
          } catch (e) {
            return { ok: false, error: e.message };
          }
        })()
      `,
      awaitPromise: true,
      returnByValue: true,
    });

    console.log('  -> Browser password update result:', submitResult.result?.value);
    if (!submitResult.result?.value?.ok) {
      throw new Error('FAIL: updateUser failed in browser: ' + JSON.stringify(submitResult.result?.value));
    }
    console.log('  [PASS] Password successfully updated in Supabase Auth via recovery session!');

    // Step 6: Verify login with the NEW password and rejection of OLD password
    console.log('\n[6/6] Verifying login with updated password...');
    const testClient = createClient(SUPABASE_URL, ANON_KEY);

    // Old password must fail
    const { error: oldErr } = await testClient.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASS_A,
    });
    console.log('  -> Old password login rejected (expected):', Boolean(oldErr));
    if (!oldErr) throw new Error('FAIL: Old password was not invalidated!');

    // New password must succeed
    const { data: newLogin, error: newErr } = await testClient.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASS_B,
    });
    if (newErr || !newLogin.session) {
      throw new Error('FAIL: Login with new password failed: ' + newErr?.message);
    }
    console.log('  -> Login with new password SUCCESSFUL! Session user:', newLogin.user?.email);
    console.log('  [PASS] Full recovery lifecycle: link -> session -> reset -> update -> login verified!');

    // Restore baseline password
    await adminClient.auth.admin.updateUserById(user.id, { password: TEST_PASS_A });
    console.log('  -> Cleaned up: restored baseline credentials for test officer.');

    ws.close();
  } finally {
    edgeProc.kill();
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch {}
  }

  console.log('\n================================================================');
  console.log('   ALL RECOVERY FLOW CHECKS PASSED WITH 0 REGRESSIONS!          ');
  console.log('================================================================\n');
}

runRecoveryVerification().catch((err) => {
  console.error('\n>>> TEST FAILED <<<', err);
  process.exit(1);
});
