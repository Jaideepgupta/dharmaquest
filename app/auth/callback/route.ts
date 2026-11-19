import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { handleAuthCallback } from '@/lib/auth/callback';
import { getSupabaseConfig } from '@/lib/supabase/config';

// Always dynamic: this handles a one-time code and sets session cookies.
export const dynamic = 'force-dynamic';

/** Magic-link landing: exchange the one-time code for a session (cookies), then redirect to a SAFE path. */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const go = (path: string) => {
    const res = NextResponse.redirect(new URL(path, origin));
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('Referrer-Policy', 'no-referrer'); // the URL carried a one-time code
    return res;
  };

  const cfg = getSupabaseConfig(process.env);
  if (!cfg.enabled) return go('/account');

  const jar = cookies();
  const supabase = createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => { for (const { name, value, options } of list) jar.set(name, value, options); },
    },
  });

  const { location } = await handleAuthCallback(request.nextUrl, {
    siteOrigin: origin,
    exchange: (code) => supabase.auth.exchangeCodeForSession(code),
  });
  return go(location);
}
