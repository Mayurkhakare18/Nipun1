/**
 * Utility functions for robust database connection URL normalization and parsing.
 * Handles unescaped special characters, wrapped quotes/brackets, query parameters,
 * and SSL parameter auto-detection for Supabase, Neon, AWS RDS, GCP Cloud SQL, and local Postgres.
 */

export interface ParsedDatabaseConnection {
  url: string;
  user?: string;
  password?: string;
  host?: string;
  port?: number;
  database?: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

/**
 * Normalizes PostgreSQL connection strings:
 * - Trims whitespace, double/single quotes, or newlines
 * - Strips literal brackets around passwords (e.g. copied Supabase template `[YOUR-PASSWORD]`)
 * - Properly encodes URI components in user and password while preserving special characters (#, @, $, !, %, etc.)
 * - Parses search params / query strings safely
 */
export function normalizeDatabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();

  // Strip wrapping single or double quotes
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1).trim();
  }

  // Check for standard postgresql:// or postgres:// scheme
  const schemeMatch = url.match(/^(postgres(?:ql)?:\/\/)(.*)$/i);
  if (!schemeMatch) {
    return url;
  }

  const scheme = schemeMatch[1].toLowerCase();
  const rest = schemeMatch[2];

  // Look for the last '@' that separates auth credentials from host/port/db
  const lastAtIndex = rest.lastIndexOf('@');
  if (lastAtIndex === -1) {
    return url;
  }

  const authPart = rest.slice(0, lastAtIndex);
  const hostAndRest = rest.slice(lastAtIndex + 1);

  // Split auth into username and password
  const firstColonIndex = authPart.indexOf(':');
  let user = authPart;
  let password = '';

  if (firstColonIndex !== -1) {
    user = authPart.slice(0, firstColonIndex);
    password = authPart.slice(firstColonIndex + 1);
  }

  // Strip wrapping square brackets often left from template copy-pastes
  if (password.startsWith('[') && password.endsWith(']')) {
    password = password.slice(1, -1);
  }

  // Safely decode if already partially encoded, then re-encode properly
  const encodeSafe = (val: string) => {
    try {
      return encodeURIComponent(decodeURIComponent(val));
    } catch {
      return encodeURIComponent(val);
    }
  };

  const cleanUser = encodeSafe(user);
  const cleanPassword = password ? encodeSafe(password) : '';

  const authString = cleanPassword ? `${cleanUser}:${cleanPassword}` : cleanUser;
  return `${scheme}${authString}@${hostAndRest}`;
}

/**
 * Extracts connection parameters for pg.Pool / pg.Client configuration
 */
export function getPostgresPoolConfig(rawUrl?: string) {
  const databaseUrl = normalizeDatabaseUrl(rawUrl);
  if (!databaseUrl) return null;

  const isLocal =
    databaseUrl.includes('localhost') ||
    databaseUrl.includes('127.0.0.1') ||
    databaseUrl.includes('0.0.0.0');

  return {
    connectionString: databaseUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 6000,
    idleTimeoutMillis: 10000,
    max: 5,
  };
}
