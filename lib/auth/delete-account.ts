/**
 * Account deletion (the right to erasure), as a pure function over injected dependencies.
 *
 * Deleting the auth user cascades to every row of the person's data (see supabase/migrations). It needs the
 * service-role key, so it can only run on the server, and it must be impossible to trigger by anyone but the
 * signed-in person acting deliberately:
 *   - POST only; JSON only
 *   - same-origin only (defence against cross-site request forgery)
 *   - an explicit typed confirmation
 *   - the user id comes from the verified session, NEVER from the request
 */
export interface DeleteRequest { method: string; headers: { get(name: string): string | null }; json(): Promise<unknown> }

export interface DeleteDeps {
  siteOrigin: string;
  adminConfigured: boolean;
  /** Verified server-side with the auth service (not just decoded from a cookie). Null when not signed in. */
  getUserId(): Promise<string | null>;
  adminDelete(userId: string): Promise<{ error: { message: string } | null }>;
  clearSession(): Promise<void>;
}

export type DeleteResponse = { status: number; body: { ok: boolean; error?: string } };
const res = (status: number, error?: string): DeleteResponse => ({ status, body: error ? { ok: false, error } : { ok: true } });

export async function handleDeleteAccount(req: DeleteRequest, deps: DeleteDeps): Promise<DeleteResponse> {
  if (req.method !== 'POST') return res(405, 'method_not_allowed');
  const origin = req.headers.get('origin');
  if (!origin || origin !== deps.siteOrigin) return res(403, 'forbidden_origin');
  const site = req.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return res(403, 'forbidden_origin');
  if (!(req.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return res(415, 'unsupported_media_type');

  let body: unknown;
  try { body = await req.json(); } catch { return res(400, 'invalid_body'); }
  if (!body || typeof body !== 'object' || (body as { confirm?: unknown }).confirm !== 'DELETE') return res(400, 'confirmation_required');

  if (!deps.adminConfigured) return res(501, 'not_configured');
  let userId: string | null;
  try { userId = await deps.getUserId(); } catch { return res(401, 'not_signed_in'); }
  if (!userId) return res(401, 'not_signed_in');

  const { error } = await deps.adminDelete(userId);
  if (error) return res(502, 'delete_failed');
  await deps.clearSession().catch(() => undefined);
  return res(200);
}
