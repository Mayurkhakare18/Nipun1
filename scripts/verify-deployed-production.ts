import WebSocket from 'ws';
import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = 9226;
const DEPLOYED_URL = 'https://nipun-test.vercel.app';

async function run() {
  console.log('--- Checking Deployed App on Vercel: ' + DEPLOYED_URL + ' ---');
  const supabase = createClient(
    'https://dnrqtmadtmgizqdchrbk.supabase.co',
    'sb_publishable_9LZsLZRp9E34czzgwxKAcg_16Ki63lw'
  );
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'aarav.sharma@mospi.gov.in',
    password: 'Learner@2026',
  });
  if (authError || !authData.session) {
    throw new Error('Auth failed: ' + authError?.message);
  }
  console.log('Supabase session acquired for:', authData.user?.email);

  const profileDir = path.join(os.tmpdir(), 'edge_prod_' + Date.now());
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
        const res = await fetch('http://127.0.0.1:' + CDP_PORT + '/json/version');
        if (res.ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
    const pagesRes = await fetch('http://127.0.0.1:' + CDP_PORT + '/json/list');
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

    console.log('1. Navigating to ' + DEPLOYED_URL + ' to set localStorage...');
    await send('Page.navigate', { url: DEPLOYED_URL });
    await new Promise((r) => setTimeout(r, 2000));

    // Inject localStorage
    const storageKey = 'sb-dnrqtmadtmgizqdchrbk-auth-token';
    const setStorageExpr = `
      (() => {
        localStorage.setItem('${storageKey}', JSON.stringify(${JSON.stringify(authData.session)}));
        localStorage.setItem('nipun_active_role', 'LEARNER');
        return { ok: true, stored: !!localStorage.getItem('${storageKey}') };
      })()
    `;
    const storageResult = await send('Runtime.evaluate', {
      expression: setStorageExpr,
      returnByValue: true,
    });
    console.log('LocalStorage set result:', storageResult.result?.value);

    console.log('2. Reloading page to pick up session...');
    await send('Page.navigate', { url: DEPLOYED_URL + '/?view=workspace' });
    await new Promise((r) => setTimeout(r, 3000));

    console.log('3. Checking header after reload...');
    for (let attempt = 0; attempt < 15; attempt++) {
      const checkRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const nav = document.querySelector('header nav');
            const btns = nav ? Array.from(nav.querySelectorAll('button')).map(b => b.innerText.trim().replace(/\\s+/g, ' ')) : [];
            const header = document.querySelector('header');
            const allText = header ? header.innerText.replace(/\\s+/g, ' ') : '';
            return {
              hasHeader: !!header,
              hasNav: !!nav,
              btnsCount: btns.length,
              btns,
              headerSnippet: allText.slice(0, 150)
            };
          })()
        `,
        returnByValue: true,
      });
      console.log('Attempt ' + attempt + ':', checkRes.result?.value);
      if (checkRes.result?.value?.btnsCount >= 3) break;
      await new Promise((r) => setTimeout(r, 600));
    }

    const viewports = [1750, 1440, 1280];
    for (const w of viewports) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: w,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await new Promise((r) => setTimeout(r, 600));

      const metrics = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const header = document.querySelector('header');
            const box = (el) => {
              if (!el) return null;
              const r = el.getBoundingClientRect();
              return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
            };
            const allItems = header ? Array.from(header.querySelectorAll('button, a, input, [role="button"]')).map(el => ({
              tag: el.tagName,
              text: (el.innerText || el.getAttribute('placeholder') || el.getAttribute('title') || '').trim().replace(/\\s+/g, ' '),
              box: box(el)
            })) : [];

            return {
              viewport: window.innerWidth,
              header: box(header),
              elements: allItems
            };
          })()
        `,
        returnByValue: true,
      });

      console.log('\n================= DEPLOYED VERCEL ' + w + 'px METRICS =================');
      console.log(JSON.stringify(metrics.result?.value, null, 2));

      const shot = await send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width: w, height: 160, scale: 1 },
      });
      fs.writeFileSync('deployed-navbar-' + w + '.png', Buffer.from(shot.data, 'base64'));
      console.log('Saved deployed-navbar-' + w + '.png!');
    }

    ws.close();
  } finally {
    edgeProc.kill();
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch {}
  }
}

run().catch(console.error);
