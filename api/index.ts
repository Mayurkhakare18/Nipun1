import { createExpressApp } from '../server/app';

let appInstance: any = null;

export default async function handler(req: any, res: any) {
  try {
    if (!appInstance) {
      appInstance = createExpressApp();
    }
    return appInstance(req, res);
  } catch (err: any) {
    console.error('[VERCEL_FUNCTION_CRASH]', err?.stack || err?.message || String(err));
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      success: false,
      error: 'SERVERLESS_INVOCATION_FAILED',
      message: err?.message || String(err),
    });
  }
}
