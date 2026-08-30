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
      connectionTimeoutMillis: 5000,
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

  console.log('[DB_HEALTH] function started');

  const rawUrl = process.env.DATABASE_URL;
  const hasDatabaseUrl = !!(rawUrl && rawUrl.trim());
  console.log(`[DB_HEALTH] DATABASE_URL configured: ${hasDatabaseUrl ? 'YES' : 'NO'}`);

  if (!hasDatabaseUrl) {
    console.error('[DB_HEALTH] PostgreSQL connection failed');
    console.error('[DB_HEALTH] error code: DATABASE_URL_MISSING');
    console.error('[DB_HEALTH] error message: DATABASE_URL is missing from environment');
    return res.status(500).json({
      status: 'error',
    });
  }

  let client: any = null;
  try {
    const pool = getPool(rawUrl);
    client = await pool.connect();
    const result = await client.query('SELECT 1 AS health;');

    if (result && result.rows && result.rows.length > 0) {
      console.log('[DB_HEALTH] PostgreSQL connection and SELECT 1 query succeeded');
      return res.status(200).json({
        status: 'ok',
      });
    }

    console.error('[DB_HEALTH] PostgreSQL connection failed');
    console.error('[DB_HEALTH] error code: EMPTY_QUERY_RESULT');
    console.error('[DB_HEALTH] error message: SELECT 1 returned empty result set');
    return res.status(500).json({
      status: 'error',
    });
  } catch (err: any) {
    console.error('[DB_HEALTH] PostgreSQL connection failed');
    console.error('[DB_HEALTH] error code:', err?.code || 'UNKNOWN_DB_ERROR');
    console.error('[DB_HEALTH] error message:', err?.message || String(err));
    return res.status(500).json({
      status: 'error',
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
