/**
 * Server-only configuration for privileged operations (deleting an account). The service-role key bypasses every
 * security rule, so it is read only here, only from a variable WITHOUT the NEXT_PUBLIC_ prefix, and only
 * imported by server route handlers. A test fails the build if client code mentions it.
 */
type Env = Record<string, string | undefined>;

function jwtRole(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try { const r = (JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')) as { role?: unknown }).role; return typeof r === 'string' ? r : null; }
  catch { return null; }
}

export type AdminConfig = { configured: true; url: string; serviceKey: string } | { configured: false; reason: string };

export function getAdminConfig(env: Env = process.env): AdminConfig {
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const url = (env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL)?.trim();
  if (!key) return { configured: false, reason: 'SUPABASE_SERVICE_ROLE_KEY is not set.' };
  if (!url) return { configured: false, reason: 'The Supabase URL is not set.' };
  let origin: string;
  try { const u = new URL(url); if (u.protocol !== 'https:' && !(u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1'))) throw new Error('scheme'); origin = u.origin; }
  catch { return { configured: false, reason: 'The Supabase URL is not valid.' }; }
  const isSecret = key.startsWith('sb_secret_') || jwtRole(key) === 'service_role';
  if (!isSecret) return { configured: false, reason: 'SUPABASE_SERVICE_ROLE_KEY does not look like a service-role/secret key.' };
  return { configured: true, url: origin, serviceKey: key };
}
