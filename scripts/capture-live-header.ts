import WebSocket from 'ws';
import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = 9225;

async function test() {
  const profileDir = path.join(os.tmpdir(), 'edge_ui_login_' + Date.now());
  const edgeProc = spawn(EDGE_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=' + CDP_PORT,
    '--user-data-dir=' + profileDir,
  ]);

  try {
    let versionData: any = null;
    for (let i = 0; i < 25; i++) {
      try {
        const res = await fetch('http://127.0.0.1:' + CDP_PORT + '/json/version');
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
    const pagesRes = await fetch('http://127.0.0.1:' + CDP_PORT + '/json/list');
    const pages = await pagesRes.json();
    const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
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

    console.log('Navigating to http://localhost:3000/?view=workspace...');
    await send('Page.navigate', { url: 'http://localhost:3000/?view=workspace' });
    await new Promise((r) => setTimeout(r, 2500));

    console.log('Authenticating Aarav via window.__supabase...');
    const loginExpr = `
      (async () => {
        try {
          if (!window.__supabase) return { ok: false, reason: '__supabase not found on window' };
          const { data, error } = await window.__supabase.auth.signInWithPassword({
            email: 'aarav.sharma@mospi.gov.in',
            password: 'Learner@2026',
          });
          if (error) return { ok: false, error: error.message };
          return { ok: true, user: data.user?.email, token: !!data.session?.access_token };
        } catch (e) {
          return { ok: false, error: e.message };
        }
      })()
    `;

    const loginRes = await send('Runtime.evaluate', {
      expression: loginExpr,
      awaitPromise: true,
      returnByValue: true,
    });
    console.log('Login action result:', loginRes.result?.value);

    // Wait for header nav to render
    console.log('Waiting for workspace header to render...');
    for (let attempt = 0; attempt < 20; attempt++) {
      const checkExpr = `
        (() => {
          const nav = document.querySelector('header nav');
          const buttons = nav ? Array.from(nav.querySelectorAll('button')).map(b => b.innerText.trim().replace(/\\s+/g, ' ')) : [];
          return { hasNav: !!nav, buttonsCount: buttons.length, buttons };
        })()
      `;
      const res = await send('Runtime.evaluate', { expression: checkExpr, returnByValue: true });
      if (res.result?.value?.buttonsCount >= 3) {
        console.log('Workspace nav ready with buttons:', res.result.value.buttons);
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    // Viewports to test: 1750, 1440, 1280
    const vps = [1750, 1440, 1280];
    for (const w of vps) {
      console.log(`\\n--- Measuring and capturing viewport ${w}px ---`);
      await send('Emulation.setDeviceMetricsOverride', {
        width: w,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await new Promise((r) => setTimeout(r, 800));

      const measureExpr = `
        (() => {
          const header = document.querySelector('header');
          if (!header) return null;
          const mainNav = header.querySelector('div.h-\\\\[72px\\\\]') || header.children[1];
          const zone1 = mainNav ? mainNav.children[0] : null;
          const zone2 = mainNav ? mainNav.children[1] : null;
          const zone3 = mainNav ? mainNav.children[2] : null;

          const getBox = (el) => {
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
          };

          const navButtons = zone2 ? Array.from(zone2.querySelectorAll('button')).map(b => ({
            text: b.innerText.trim().replace(/\\s+/g, ' '),
            box: getBox(b)
          })) : [];

          const actionElements = zone3 ? Array.from(zone3.children).map(el => ({
            text: (el.innerText || el.getAttribute('title') || el.tagName).trim().replace(/\\s+/g, ' '),
            box: getBox(el)
          })) : [];

          return {
            viewportWidth: window.innerWidth,
            headerBox: getBox(header),
            mainNavBox: getBox(mainNav),
            zone1_Brand: getBox(zone1),
            zone2_Nav: getBox(zone2),
            zone3_Actions: getBox(zone3),
            navButtons,
            actionElements
          };
        })()
      `;

      const measureRes = await send('Runtime.evaluate', { expression: measureExpr, returnByValue: true });
      console.log(`DOM Metrics at ${w}px:`, JSON.stringify(measureRes.result?.value, null, 2));

      const shot = await send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width: w, height: 160, scale: 1 },
      });
      fs.writeFileSync(`header-workspace-${w}.png`, Buffer.from(shot.data, 'base64'));
      console.log(`Saved header-workspace-${w}.png!`);
    }

    ws.close();
  } finally {
    edgeProc.kill();
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch {}
  }
}
test().catch(console.error);
