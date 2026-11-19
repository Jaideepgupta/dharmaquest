/**
 * Supabase configuration for the BROWSER. Only public values are ever read here.
 *
 * Anything prefixed NEXT_PUBLIC_ is shipped to every visitor, so this loader refuses to start
 * if it is handed a secret (a service-role / secret key), a malformed URL, or a half-configured pair.
 * When nothing is configured the feature is simply off and the site behaves exactly as it does today.
 */
export type SupabaseConfig =
  | { enabled: true; url: string; anonKey: string }
  | { enabled: false; reason: string };

type Env = Record<string, string | undefined>;

/** Decodes a JWT payload without verifying it (we only need to see which role it claims). */
function jwtRole(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const json = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const role = (JSON.parse(json) as { role?: unknown }).role;
    return typeof role === 'string' ? role : null;
  } catch { return null; }
}

export function getSupabaseConfig(env: Env = process.env): SupabaseConfig {
  // A secret placed under any NEXT_PUBLIC_ name would be exposed to browsers: refuse outright.
  for (const [name, value] of Object.entries(env)) {
    if (name.startsWith('NEXT_PUBLIC_') && /SERVICE_ROLE|SECRET/i.test(name) && value) {
      return { enabled: false, reason: `${name} must never be public: remove it (NEXT_PUBLIC_ values are sent to every visitor).` };
    }
  }
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url && !key) return { enabled: false, reason: 'Supabase is not configured.' };
  if (!url || !key) return { enabled: false, reason: 'Set both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, or neither.' };

  let parsed: URL;
  try { parsed = new URL(url); } catch { return { enabled: false, reason: 'NEXT_PUBLIC_SUPABASE_URL is not a valid URL.' }; }
  const local = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  if (parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:')) return { enabled: false, reason: 'NEXT_PUBLIC_SUPABASE_URL must be https (http is allowed only for localhost).' };
  if (parsed.username || parsed.password) return { enabled: false, reason: 'NEXT_PUBLIC_SUPABASE_URL must not contain credentials.' };

  if (key.startsWith('sb_secret_')) return { enabled: false, reason: 'That is a secret key. Use the public anon/publishable key in the browser.' };
  const role = jwtRole(key);
  if (role === 'service_role') return { enabled: false, reason: 'That is a service-role key, which bypasses all security. Use the public anon key in the browser.' };
  if (key.split('.').length === 3 && role !== 'anon') return { enabled: false, reason: `The key claims role "${role ?? 'unknown'}", expected "anon".` };
  if (!key.startsWith('sb_publishable_') && key.split('.').length !== 3) return { enabled: false, reason: 'NEXT_PUBLIC_SUPABASE_ANON_KEY does not look like a Supabase anon/publishable key.' };

  return { enabled: true, url: parsed.origin, anonKey: key };
}
