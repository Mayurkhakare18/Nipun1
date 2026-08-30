import { app } from '../server/app.js';

export default async function handler(req: any, res: any) {
  // CORS Headers
  try {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-auth-token'
    );

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  } catch {
    // Ignore header setting errors
  }

  try {
    // Reconstruct the exact original request URL for Express
    let originalPath = req.url || '/api';
    
    // Check if rewritten with __url or url or path query parameter
    if (req.query && (req.query.__url || req.query.url || req.query.path || req.query.all)) {
      const captured = req.query.__url || req.query.url || req.query.path || req.query.all;
      const subpath = Array.isArray(captured) ? captured.join('/') : String(captured);
      
      // Preserve other query parameters
      const urlObj = new URL(req.url, 'http://localhost');
      urlObj.searchParams.delete('__url');
      urlObj.searchParams.delete('url');
      urlObj.searchParams.delete('path');
      urlObj.searchParams.delete('all');
      const search = urlObj.search;
      
      originalPath = `/api/${subpath.replace(/^\/+/, '')}${search}`;
    } else {
      const matchedPath =
        req.headers?.['x-original-url'] ||
        req.headers?.['x-now-route-matches'] ||
        req.headers?.['x-vercel-matched-path'] ||
        req.headers?.['x-matched-path'];

      if (typeof matchedPath === 'string' && matchedPath.startsWith('/api') && matchedPath !== '/api' && matchedPath !== '/api/') {
        originalPath = matchedPath;
      }
    }

    if (!originalPath.startsWith('/api')) {
      originalPath = `/api${originalPath.startsWith('/') ? originalPath : '/' + originalPath}`;
    }

    req.url = originalPath;
    const safePath = (req.url || '').split('?')[0];
    console.log(`[BOOT] Request received: ${req.method} ${safePath} (Full: ${req.url})`);

    return (app as any)(req, res);
  } catch (err: any) {
    console.error('Vercel Serverless Function Unhandled Error:', err?.stack || err?.message || String(err));
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'SERVERLESS_FUNCTION_ERROR',
        message: err?.message || String(err),
      });
    }
  }
}
