import WebSocket from 'ws';
import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = 9224;

async function run() {
  console.log('1. Signing in via Supabase in Node...');
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
  console.log('Got session for:', authData.user?.email);

  const profileDir = path.join(os.tmpdir(), 'edge_test_' + Date.now());
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
    console.log('Available targets:', pages.map((p: any) => ({ type: p.type, url: p.url })));
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

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args?.map((a: any) => a.value || a.description));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.log('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
      }
    });

    console.log('2. Navigating to http://localhost:3000/?view=workspace...');
    await send('Page.navigate', { url: 'http://localhost:3000/?view=workspace' });
    await new Promise((r) => setTimeout(r, 2000));

    const debugPage = await send('Runtime.evaluate', {
      expression: `({ url: location.href, readyState: document.readyState, body: document.body.innerHTML.slice(0, 300) })`,
      returnByValue: true,
    });
    console.log('Page state after navigate:', debugPage.result?.value);


    console.log('3. Injecting session into window.__supabase...');
    const setSessionExpr = `
      (async () => {
        try {
          if (!window.__supabase) return { ok: false, reason: 'window.__supabase not ready' };
          const { data, error } = await window.__supabase.auth.setSession({
            access_token: '${authData.session.access_token}',
            refresh_token: '${authData.session.refresh_token}'
          });
          if (error) return { ok: false, error: error.message };
          return { ok: true, user: data.user?.email };
        } catch (e) {
          return { ok: false, error: e.message };
        }
      })()
    `;

    for (let attempt = 0; attempt < 15; attempt++) {
      const res = await send('Runtime.evaluate', {
        expression: setSessionExpr,
        awaitPromise: true,
        returnByValue: true,
      });
      console.log('setSession attempt ' + attempt + ':', res.result?.value);
      if (res.result?.value?.ok) break;
      await new Promise((r) => setTimeout(r, 500));
    }

    console.log('4. Waiting for Officer Workspace and Nav to render...');
    for (let attempt = 0; attempt < 20; attempt++) {
      const checkRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const nav = document.querySelector('header nav');
            const btns = nav ? Array.from(nav.querySelectorAll('button')).map(b => b.innerText.trim().replace(/\\s+/g, ' ')) : [];
            const header = document.querySelector('header');
            return {
              hasHeader: !!header,
              hasNav: !!nav,
              btnsCount: btns.length,
              btns
            };
          })()
        `,
        returnByValue: true,
      });
      console.log('Check result:', checkRes.result?.value);
      if (checkRes.result?.value?.btnsCount >= 4) {
        console.log('SUCCESS! Rendered navbar with buttons:', checkRes.result.value.btns);
        break;
      }
      await new Promise((r) => setTimeout(r, 600));
    }

    // Measure and capture screenshots for 1750, 1440, 1280
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
            const mainDiv = header ? header.querySelector('div.h-\\\\[72px\\\\]') || header.children[1] : null;
            const zone1 = mainDiv ? mainDiv.children[0] : null;
            const zone2 = mainDiv ? mainDiv.children[1] : null;
            const zone3 = mainDiv ? mainDiv.children[2] : null;

            const box = (el) => {
              if (!el) return null;
              const r = el.getBoundingClientRect();
              return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
            };

            const navBtns = zone2 ? Array.from(zone2.querySelectorAll('button')).map(b => ({
              text: b.innerText.trim().replace(/\\s+/g, ' '),
              box: box(b)
            })) : [];

            const actItems = zone3 ? Array.from(zone3.children).map(b => ({
              text: (b.innerText || b.getAttribute('title') || '').trim().replace(/\\s+/g, ' '),
              box: box(b)
            })) : [];

            return {
              viewport: window.innerWidth,
              header: box(header),
              mainNav: box(mainDiv),
              zone1_Brand: box(zone1),
              zone2_Nav: box(zone2),
              zone3_Actions: box(zone3),
              navBtns,
              actItems
            };
          })()
        `,
        returnByValue: true,
      });

      console.log('\n================= VIEWPORT ' + w + 'px METRICS =================');
      console.log(JSON.stringify(metrics.result?.value, null, 2));

      const shot = await send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width: w, height: 160, scale: 1 },
      });
      fs.writeFileSync('live-navbar-' + w + '.png', Buffer.from(shot.data, 'base64'));
      console.log('Saved live-navbar-' + w + '.png!');
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

