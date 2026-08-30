import pg from 'pg';

// ESM-safe Pool extraction (handles default exports, CJS wrappers, and ESM interop)
const Pool = (pg as any).Pool || (pg as any).default?.Pool || pg;

// Reusable connection pool across warm serverless invocations
let poolInstance: any = null;

function normalizeDbUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1).trim();
  }
  const match = url.match(/^(postgres(?:ql)?:\/\/)(.*)$/i);
  if (!match) return url;

  const scheme = match[1].toLowerCase();
  const rest = match[2];
  const lastAt = rest.lastIndexOf('@');
  if (lastAt === -1) return url;

  const auth = rest.slice(0, lastAt);
  const hostAndRest = rest.slice(lastAt + 1);
  const colonIndex = auth.indexOf(':');

  let user = auth;
  let password = '';
  if (colonIndex !== -1) {
    user = auth.slice(0, colonIndex);
    password = auth.slice(colonIndex + 1);
  }

  if (password.startsWith('[') && password.endsWith(']')) {
    password = password.slice(1, -1);
  }

  const encodeSafe = (val: string) => {
    try {
      return encodeURIComponent(decodeURIComponent(val));
    } catch {
      return encodeURIComponent(val);
    }
  };

  const cleanUser = encodeSafe(user);
  const cleanPassword = password ? encodeSafe(password) : '';
  const authStr = cleanPassword ? `${cleanUser}:${cleanPassword}` : cleanUser;

  return `${scheme}${authStr}@${hostAndRest}`;
}

function parseSafeDbInfo(rawUrl?: string): { hasUrl: boolean; protocol: string; host: string; port: string; dbName: string; user: string } {
  if (!rawUrl) return { hasUrl: false, protocol: '', host: '', port: '', dbName: '', user: '' };
  try {
    const clean = normalizeDbUrl(rawUrl);
    const parsed = new URL(clean);
    return {
      hasUrl: true,
      protocol: parsed.protocol.replace(':', ''),
      host: parsed.hostname,
      port: parsed.port || '5432',
      dbName: parsed.pathname.replace(/^\//, ''),
      user: parsed.username ? parsed.username.slice(0, 4) + '***' : '',
    };
  } catch {
    return { hasUrl: true, protocol: 'invalid', host: '', port: '', dbName: '', user: '' };
  }
}

function getPool(rawDatabaseUrl: string): any {
  if (!poolInstance) {
    const cleanUrl = normalizeDbUrl(rawDatabaseUrl);
    const isLocal =
      cleanUrl.includes('localhost') ||
      cleanUrl.includes('127.0.0.1') ||
      cleanUrl.includes('0.0.0.0');

    poolInstance = new Pool({
      connectionString: cleanUrl,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 10000,
      max: 3,
    });

    poolInstance.on('error', (err: any) => {
      console.error('[DB_HEALTH] Idle PostgreSQL client error:', err?.message || String(err));
    });
  }
  return poolInstance;
}

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

  console.log('[DB_HEALTH] Connection verification started');

  const rawUrl = process.env.DATABASE_URL;
  const safeInfo = parseSafeDbInfo(rawUrl);

  console.log(`[DB_HEALTH] DATABASE_URL configured: ${safeInfo.hasUrl ? 'YES' : 'NO'}`);
  console.log(`[DB_HEALTH] Protocol: ${safeInfo.protocol || 'none'}`);
  console.log(`[DB_HEALTH] Host: ${safeInfo.host || 'none'}`);
  console.log(`[DB_HEALTH] Port: ${safeInfo.port || '5432'}`);
  console.log(`[DB_HEALTH] Database: ${safeInfo.dbName || 'none'}`);

  if (!safeInfo.hasUrl) {
    console.error('[DB_HEALTH] PostgreSQL connection failed');
    console.error('[DB_HEALTH] Error code: DATABASE_URL_MISSING');
    console.error('[DB_HEALTH] Error message: DATABASE_URL is missing from environment variables');
    return res.status(500).json({
      status: 'error',
      code: 'DATABASE_URL_MISSING',
      message: 'DATABASE_URL is missing from environment variables',
    });
  }

  let client: any = null;
  try {
    console.log('[DB_HEALTH] Connecting to PostgreSQL pool...');
    const pool = getPool(rawUrl!);
    client = await pool.connect();
    console.log('[DB_HEALTH] Connection established. Executing SELECT 1 AS health...');

    const result = await client.query('SELECT 1 AS health;');

    if (result && result.rows && result.rows.length > 0) {
      console.log('[DB_HEALTH] Connection succeeded! SELECT 1 returned:', result.rows[0]);
      return res.status(200).json({
        status: 'ok',
      });
    }

    console.error('[DB_HEALTH] PostgreSQL connection failed: Empty query result');
    return res.status(500).json({
      status: 'error',
      code: 'EMPTY_QUERY_RESULT',
      message: 'SELECT 1 returned empty result set',
    });
  } catch (err: any) {
    const errCode = err?.code || 'UNKNOWN_DB_ERROR';
    const errMessage = err?.message || String(err);
    console.error('[DB_HEALTH] PostgreSQL connection failed');
    console.error(`[DB_HEALTH] Error code: ${errCode}`);
    console.error(`[DB_HEALTH] Error message: ${errMessage}`);

    return res.status(500).json({
      status: 'error',
      code: errCode,
      message: errMessage,
      dbHost: safeInfo.host,
      dbPort: safeInfo.port,
    });
  } finally {
    if (client) {
      try {
        client.release();
      } catch {
        // Ignore release error
      }
    }
  }
}
