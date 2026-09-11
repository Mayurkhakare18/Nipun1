let appInstance: any = null;
let initError: any = null;

async function getApp() {
  if (appInstance) return appInstance;
  if (initError) throw initError;
  try {
    const mod = await import('../server/app.js');
    appInstance = mod.app || mod.default;
    return appInstance;
  } catch (err: any) {
    console.error('[VercelAPI] Failed to initialize server/app:', err);
    initError = err;
    throw err;
  }
}

export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err: any) {
    console.error('[VercelAPI] Handler caught error:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_INITIALIZATION_ERROR',
      message: err?.message || String(err),
      stack: err?.stack || null,
    });
  }
}
