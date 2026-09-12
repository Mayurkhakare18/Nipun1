import 'dotenv/config';
import { spawn } from 'child_process';
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createClient } from '@supabase/supabase-js';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = 9222;

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
  console.log('[CDP] 1. Authenticating Aarav via Supabase client in Node...');
  const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'aarav.sharma@mospi.gov.in',
    password: 'Learner@2026',
  });
  if (authError || !authData.session) {
    throw new Error(`Failed to authenticate Aarav: ${authError?.message}`);
  }
  console.log('[CDP] Aarav authenticated successfully. Token length:', authData.session.access_token.length);

  const profileDir = path.join(os.tmpdir(), `edge_cdp_profile_${Date.now()}`);
  console.log('[CDP] 2. Launching Edge headless with profile at:', profileDir);
  const edgeProc = spawn(EDGE_PATH, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${profileDir}`,
  ]);

  try {
    let versionData: any = null;
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }

    if (!versionData) throw new Error('Failed to connect to Edge CDP endpoint');
    console.log('[CDP] Connected to:', versionData.Browser);

    const pagesRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const pages = await pagesRes.json();
    const pageWsUrl = pages[0]?.webSocketDebuggerUrl;
    if (!pageWsUrl) throw new Error('No page WebSocket URL found');

    const client = new CDPClient();
    await client.connect(pageWsUrl);

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Runtime.enable');

    console.log('[CDP] 3. Navigating to http://localhost:3000 to seed localStorage...');
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise((r) => setTimeout(r, 1500));

    // Inject session
    const projectRef = 'dnrqtmadtmgizqdchrbk';
    const storageKey = `sb-${projectRef}-auth-token`;
    const sessionJson = JSON.stringify(authData.session);

    await client.send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('${storageKey}', ${JSON.stringify(sessionJson)});
        localStorage.setItem('statvia_auth_token', '${authData.session.access_token}');
      `,
    });
    console.log('[CDP] Injected session into localStorage key:', storageKey);

    // Reload page
    console.log('[CDP] Reloading page to mount OfficerWorkspace...');
    await client.send('Page.reload');
    await new Promise((r) => setTimeout(r, 3000));

    const viewports = [
      { width: 1750, height: 900, name: '1750px' },
      { width: 1440, height: 900, name: '1440px' },
      { width: 1280, height: 720, name: '1280px' },
    ];

    for (const vp of viewports) {
      console.log(`\n======================================================`);
      console.log(`[CDP] Testing Viewport: ${vp.width}x${vp.height} (${vp.name})`);
      console.log(`======================================================`);

      await client.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await new Promise((r) => setTimeout(r, 1000));

      const metricsScript = `
        (() => {
          const header = document.querySelector('header');
          // Find the 3 zones
          const brandContainer = header ? header.querySelector('.select-none.cursor-pointer, .select-none') : null;
          const navPills = header ? header.querySelector('nav') : null;
          const navButtons = navPills ? Array.from(navPills.querySelectorAll('button')).map(b => {
            const r = b.getBoundingClientRect();
            const cs = window.getComputedStyle(b);
            return {
              text: b.innerText.trim(),
              width: Math.round(r.width),
              height: Math.round(r.height),
              padding: cs.padding,
              fontSize: cs.fontSize,
            };
          }) : [];

          const actionButtons = header ? Array.from(header.querySelectorAll('div.flex.items-center.justify-end > *')).map(el => {
            const r = el.getBoundingClientRect();
            const cs = window.getComputedStyle(el);
            return {
              text: el.innerText ? el.innerText.trim().replace(/\\s+/g, ' ') : el.getAttribute('title') || 'elem',
              width: Math.round(r.width),
              height: Math.round(r.height),
              padding: cs.padding,
            };
          }) : [];

          const innerContainer = header ? header.querySelector('.max-w-\\\\[1720px\\\\]') || header.children[1] : null;
          const innerCS = innerContainer ? window.getComputedStyle(innerContainer) : null;

          return {
            headerHeight: header ? Math.round(header.getBoundingClientRect().height) : null,
            innerContainerWidth: innerContainer ? Math.round(innerContainer.getBoundingClientRect().width) : null,
            innerContainerMaxWidth: innerCS ? innerCS.maxWidth : null,
            brandWidth: brandContainer ? Math.round(brandContainer.getBoundingClientRect().width) : null,
            brandHeight: brandContainer ? Math.round(brandContainer.getBoundingClientRect().height) : null,
            navWidth: navPills ? Math.round(navPills.getBoundingClientRect().width) : null,
            navHeight: navPills ? Math.round(navPills.getBoundingClientRect().height) : null,
            navButtons,
            actionButtons,
          };
        })()
      `;

      const metricsRes = await client.send('Runtime.evaluate', {
        expression: metricsScript,
        returnByValue: true,
      });

      console.log('[CDP] Metrics:', JSON.stringify(metricsRes.result?.value, null, 2));

      // Capture screenshot
      const shotRes = await client.send('Page.captureScreenshot', {
        format: 'png',
        clip: {
          x: 0,
          y: 0,
          width: vp.width,
          height: 300,
          scale: 1,
        },
      });

      const shotPath = path.join(process.cwd(), `navbar-${vp.width}.png`);
      fs.writeFileSync(shotPath, Buffer.from(shotRes.data, 'base64'));
      console.log(`[CDP] Saved screenshot: ${shotPath}`);
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
