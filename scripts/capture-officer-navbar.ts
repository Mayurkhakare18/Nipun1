import 'dotenv/config';
import { spawn } from 'child_process';
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createClient } from '@supabase/supabase-js';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = 9223;

class CDPClient {
  private ws!: WebSocket;
  private msgId = 1;
  private pendingCallbacks = new Map<number, (res: any) => void>();

  async connect(wsUrl: string) {
    this.ws = new WebSocket(wsUrl);
    await new Promise<void>((resolve, reject) => {
      this.ws.on('open', () => resolve());
      this.ws.on('error', reject);
    });

    this.ws.on('message', (data: string) => {
      const msg = JSON.parse(data.toString());
      if (msg.id && this.pendingCallbacks.has(msg.id)) {
        const cb = this.pendingCallbacks.get(msg.id)!;
        this.pendingCallbacks.delete(msg.id);
        cb(msg);
      }
    });
  }

  send(method: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.pendingCallbacks.set(id, (msg) => {
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  console.log('[1/4] Signing in Aarav via Supabase...');
  const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'aarav.sharma@mospi.gov.in',
    password: 'Learner@2026',
  });
  if (authError || !authData.session) {
    throw new Error(`Failed to authenticate Aarav: ${authError?.message}`);
  }

  const profileDir = path.join(os.tmpdir(), `edge_officer_cdp_${Date.now()}`);
  console.log('[2/4] Launching Edge CDP...');
  const edgeProc = spawn(EDGE_PATH, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${profileDir}`,
  ]);

  try {
    let versionData: any = null;
    for (let i = 0; i < 25; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
    if (!versionData) throw new Error('CDP unavailable');

    const pagesRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const pages = await pagesRes.json();
    const pageWsUrl = pages[0]?.webSocketDebuggerUrl;

    const client = new CDPClient();
    await client.connect(pageWsUrl);

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('DOM.enable');

    console.log('[3/4] Navigating and seeding session...');
    await client.send('Page.navigate', { url: 'http://localhost:3000/?view=workspace' });
    await new Promise((r) => setTimeout(r, 1200));

    const projectRef = 'dnrqtmadtmgizqdchrbk';
    const storageKey = `sb-${projectRef}-auth-token`;
    const sessionJson = JSON.stringify(authData.session);

    await client.send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('${storageKey}', ${JSON.stringify(sessionJson)});
        localStorage.setItem('statvia_auth_token', '${authData.session.access_token}');
      `,
    });

    console.log('[4/4] Reloading workspace with active session...');
    await client.send('Page.navigate', { url: 'http://localhost:3000/?view=workspace' });

    // Wait until header and nav exist
    for (let i = 0; i < 30; i++) {
      const chk = await client.send('Runtime.evaluate', {
        expression: `!!(document.querySelector('header') && document.querySelector('nav') && document.querySelector('header button'))`,
        returnByValue: true,
      });
      if (chk.result?.value) break;
      await new Promise((r) => setTimeout(r, 300));
    }
    await new Promise((r) => setTimeout(r, 1000));

    const viewports = [
      { width: 1750, height: 900, name: '1750' },
      { width: 1440, height: 900, name: '1440' },
      { width: 1280, height: 720, name: '1280' },
    ];

    for (const vp of viewports) {
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await new Promise((r) => setTimeout(r, 800));

      // Capture screenshot of top header FIRST
      const shot = await client.send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width: vp.width, height: 180, scale: 1 },
      });

      const shotFile = path.join(process.cwd(), `header-${vp.width}.png`);
      fs.writeFileSync(shotFile, Buffer.from(shot.data, 'base64'));
      console.log(`Saved screenshot to: ${shotFile}`);

      const metricsRes = await client.send('Runtime.evaluate', {
        expression: `
          (() => {
            try {
              const header = document.querySelector('header');
              const topStrip = header ? header.firstElementChild : null;
              const mainNav = header && header.children.length > 1 ? header.children[1] : null;
              const logo = header ? header.querySelector('svg') : null;
              const nav = header ? header.querySelector('nav') : null;
              const navButtons = nav ? Array.from(nav.querySelectorAll('button')).map(b => {
                const r = b.getBoundingClientRect();
                return { text: b.innerText.trim().replace(/\\s+/g, ' '), w: Math.round(r.width), h: Math.round(r.height), l: Math.round(r.left) };
              }) : [];

              const rightContainer = mainNav ? mainNav.querySelector('div.flex.items-center.justify-end') : null;
              const actions = rightContainer ? Array.from(rightContainer.children).map(el => {
                const r = el.getBoundingClientRect();
                return { text: (el.innerText || el.getAttribute('title') || '').trim().replace(/\\s+/g, ' '), w: Math.round(r.width), h: Math.round(r.height), l: Math.round(r.left) };
              }) : [];

              return {
                headerH: header ? Math.round(header.getBoundingClientRect().height) : 0,
                topStripH: topStrip ? Math.round(topStrip.getBoundingClientRect().height) : 0,
                mainNav: mainNav ? {
                  w: Math.round(mainNav.getBoundingClientRect().width),
                  h: Math.round(mainNav.getBoundingClientRect().height),
                  left: Math.round(mainNav.getBoundingClientRect().left),
                  right: Math.round(mainNav.getBoundingClientRect().right),
                } : null,
                logo: logo ? { w: Math.round(logo.getBoundingClientRect().width), h: Math.round(logo.getBoundingClientRect().height) } : null,
                nav: nav ? { w: Math.round(nav.getBoundingClientRect().width), h: Math.round(nav.getBoundingClientRect().height), left: Math.round(nav.getBoundingClientRect().left) } : null,
                navButtons,
                actions,
              };
            } catch (e) {
              return { error: e.message };
            }
          })()
        `,
        returnByValue: true,
      });

      console.log(`\n--- METRICS FOR ${vp.width}px ---`);
      console.log(JSON.stringify(metricsRes.result?.value, null, 2));
    }

    client.close();
  } finally {
    edgeProc.kill();
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch {}
  }
}

run().catch(console.error);
