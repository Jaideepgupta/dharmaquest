import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { handleDeleteAccount } from '@/lib/auth/delete-account';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { getAdminConfig } from '@/lib/supabase/admin-config';

export const dynamic = 'force-dynamic';

/**
 * Permanently deletes the signed-in person's account and, through database cascades, all of their data.
 * Server-only: it needs the service-role key. All decisions live in lib/auth/delete-account.ts (unit-tested).
 */
export async function POST(request: NextRequest) {
  const respond = (status: number, body: object) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  const pub = getSupabaseConfig(process.env);
  const admin = getAdminConfig(process.env);
  if (!pub.enabled) return respond(501, { ok: false, error: 'not_configured' });

  const jar = cookies();
  const supabase = createServerClient(pub.url, pub.anonKey, {
    cookies: { getAll: () => jar.getAll(), setAll: (list) => { for (const { name, value, options } of list) jar.set(name, value, options); } },
  });

  const out = await handleDeleteAccount(
    { method: request.method, headers: request.headers, json: () => request.json() },
    {
      siteOrigin: request.nextUrl.origin,
      adminConfigured: admin.configured,
      // getUser() asks the auth service to verify the token; getSession() would only decode the cookie.
      getUserId: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
      adminDelete: async (userId) => {
        if (!admin.configured) return { error: { message: 'not configured' } };
        const svc = createClient(admin.url, admin.serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
        const { error } = await svc.auth.admin.deleteUser(userId);
        return { error: error ? { message: error.message } : null };
      },
      clearSession: async () => { await supabase.auth.signOut({ scope: 'local' }); },
    },
  );
  return respond(out.status, out.body);
}
