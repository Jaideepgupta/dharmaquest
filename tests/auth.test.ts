import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeNext } from '../lib/auth/safe-redirect';
import { handleAuthCallback, AUTH_ERROR_MESSAGES, isAuthErrorCode } from '../lib/auth/callback';
import { handleDeleteAccount, type DeleteDeps, type DeleteRequest } from '../lib/auth/delete-account';
import { getAdminConfig } from '../lib/supabase/admin-config';

const SITE = 'https://dharmaquest-app.vercel.app';

/* ---------------- open redirect ---------------- */
test('safeNext: same-origin paths are kept (path, query and hash)', () => {
  assert.equal(safeNext('/progress', SITE), '/progress');
  assert.equal(safeNext('/gita/bhagavad-gita/2/47?view=detailed#words', SITE), '/gita/bhagavad-gita/2/47?view=detailed#words');
  assert.equal(safeNext('/learn/lessons/gita-ch1', SITE), '/learn/lessons/gita-ch1');
});
test('safeNext: missing or empty falls back', () => {
  for (const v of [null, undefined, '', ' ']) assert.equal(safeNext(v as string, SITE), '/account', String(v));
  assert.equal(safeNext(null, SITE, '/x'), '/x');
});
test('safeNext: every known open-redirect payload is rejected', () => {
  const evil = [
    '//evil.example', '//evil.example/path', '///evil.example', '////evil.example', '/\\evil.example', '/\\/evil.example', '\\\\evil.example', '\\/evil.example',
    'https://evil.example', 'http://evil.example', 'HTTPS://EVIL.EXAMPLE', 'javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:x',
    'evil.example', 'evil.example/x', '@evil.example', ':@evil.example', 'https:evil.example', 'https:/evil.example', 'https:\\\\evil.example',
    '/\t/evil.example', '/\n/evil.example', '/\r/evil.example', '\t//evil.example', '/ \\evil.example', '/\u0000/evil.example',
    '/..//evil.example', '/./\\evil.example', '/%2F/evil.example/', '/%5Cevil.example', '/%2f%2fevil.example', `${SITE}.evil.example`, `${SITE}@evil.example`,
    'https://dharmaquest-app.vercel.app.evil.example/', 'https://dharmaquest-app.vercel.app@evil.example/', '/a/../../evil.example',
  ];
  for (const e of evil) {
    const out = safeNext(e, SITE);
    assert.ok(out.startsWith('/') && !out.startsWith('//') && !out.startsWith('/\\'), `${JSON.stringify(e)} -> ${out}`);
    assert.equal(new URL(out, SITE).origin, SITE, `${JSON.stringify(e)} resolves on our origin`);
  }
});
test('safeNext: the result, used as a redirect target, always lands on our origin (fuzzed)', () => {
  const pieces = ['/', '\\', '/', '.', '..', '%2F', '%5C', '%0d', '%09', '\t', '\n', '@', ':', 'evil.example', 'a', '?', '#', 'https:', '//', ' '];
  let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < 20000; i++) {
    const raw = Array.from({ length: 1 + Math.floor(rnd() * 7) }, () => pieces[Math.floor(rnd() * pieces.length)]).join('');
    const out = safeNext(raw, SITE);
    assert.equal(new URL(out, SITE).origin, SITE, `fuzz ${JSON.stringify(raw)} -> ${out}`);
    assert.ok(!out.startsWith('//'), `fuzz ${JSON.stringify(raw)} -> ${out}`);
  }
});
test('safeNext: never redirects into the auth plumbing or API; over-long input falls back', () => {
  for (const p of ['/auth/callback', '/auth/callback?code=x', '/api/account/delete', '/api', '/auth']) assert.equal(safeNext(p, SITE), '/account', p);
  assert.equal(safeNext('/authors', SITE), '/authors', 'only the real /auth segment is blocked');
  assert.equal(safeNext('/' + 'a'.repeat(5000), SITE), '/account');
});

/* ---------------- callback ---------------- */
const deps = (over: Partial<Parameters<typeof handleAuthCallback>[1]> = {}) => {
  const calls: string[] = [];
  return { calls, deps: { siteOrigin: SITE, exchange: async (c: string) => { calls.push(c); return { error: null }; }, ...over } };
};
const cb = (qs: string, d = deps()) => handleAuthCallback(new URL(`${SITE}/auth/callback?${qs}`), d.deps);

test('callback: a valid code is exchanged once and the person goes to the safe `next` path', async () => {
  const d = deps(); const r = await cb('code=abcdef123456&next=/progress', d);
  assert.deepEqual(r, { ok: true, location: '/progress' }); assert.deepEqual(d.calls, ['abcdef123456']);
});
test('callback: default destination is /account; a hostile `next` is ignored but sign-in still succeeds', async () => {
  assert.equal((await cb('code=abcdef123456')).location, '/account');
  const r = await cb('code=abcdef123456&next=//evil.example'); assert.deepEqual(r, { ok: true, location: '/account' });
  assert.equal((await cb('code=abcdef123456&next=https://evil.example')).location, '/account');
});
test('callback: provider errors map to FIXED codes; arbitrary text is never reflected', async () => {
  const r = await cb('error=access_denied&error_code=otp_expired&error_description=<script>alert(1)</script>+Click+evil.example');
  assert.equal(r.ok, false); assert.equal(r.location, '/account?auth_error=link_expired');
  assert.ok(!/script|evil|alert/.test(r.location));
  assert.equal((await cb('error=access_denied')).location, '/account?auth_error=access_denied');
  assert.equal((await cb('error=server_error')).location, '/account?auth_error=unknown');
  for (const v of Object.keys(AUTH_ERROR_MESSAGES)) assert.ok(isAuthErrorCode(v));
  assert.equal(isAuthErrorCode('<script>'), false);
});
test('callback: a missing or malformed code is rejected WITHOUT calling the auth service', async () => {
  for (const qs of ['', 'code=', 'code=short', 'code=' + 'a'.repeat(600), 'code=ab cd efgh ijkl', 'code=../../etc/passwd', 'code=abc%0d%0aSet-Cookie:x=y123456', 'code[]=abcdefgh1234']) {
    const d = deps(); const r = await cb(qs, d);
    assert.equal(r.ok, false, qs); assert.equal(r.location, '/account?auth_error=invalid_link', qs); assert.equal(d.calls.length, 0, qs);
  }
});
test('callback: a failed or throwing exchange is a clean error', async () => {
  assert.equal((await cb('code=abcdef123456', deps({ exchange: async () => ({ error: { message: 'invalid flow state' } }) }))).location, '/account?auth_error=exchange_failed');
  assert.equal((await cb('code=abcdef123456', deps({ exchange: async () => { throw new Error('network'); } }))).location, '/account?auth_error=exchange_failed');
});

/* ---------------- account deletion ---------------- */
function mk(over: Partial<DeleteDeps> = {}) {
  const log: string[] = [];
  const d: DeleteDeps = { siteOrigin: SITE, adminConfigured: true, getUserId: async () => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    adminDelete: async (id) => { log.push(`delete:${id}`); return { error: null }; }, clearSession: async () => { log.push('clear'); }, ...over };
  return { d, log };
}
const req = (over: { method?: string; headers?: Record<string, string>; body?: unknown } = {}): DeleteRequest => {
  const h: Record<string, string> = { origin: SITE, 'content-type': 'application/json', 'sec-fetch-site': 'same-origin', ...(over.headers ?? {}) };
  for (const k of Object.keys(h)) if (h[k] === '__remove__') delete h[k];
  return { method: over.method ?? 'POST', headers: { get: (n) => h[n.toLowerCase()] ?? null }, json: async () => { if (over.body === '__throw__') throw new Error('bad json'); return 'body' in over ? over.body : { confirm: 'DELETE' }; } };
};

test('delete: the happy path deletes exactly the signed-in user and clears the session', async () => {
  const { d, log } = mk(); const r = await handleDeleteAccount(req(), d);
  assert.deepEqual([r.status, r.body], [200, { ok: true }]); assert.deepEqual(log, ['delete:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'clear']);
});
test('delete: the user id comes from the verified session, never from the request body', async () => {
  const { d, log } = mk();
  await handleDeleteAccount(req({ body: { confirm: 'DELETE', userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' } }), d);
  assert.deepEqual(log, ['delete:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'clear'], "only the session's own user was deleted");
});
test('delete: CROSS-SITE requests are refused (CSRF), and nothing is deleted', async () => {
  const cases: [string, Record<string, string>][] = [
    ['foreign origin', { origin: 'https://evil.example' }], ['no origin header', { origin: '__remove__' }], ['null origin', { origin: 'null' }],
    ['subdomain lookalike', { origin: 'https://dharmaquest-app.vercel.app.evil.example' }], ['http downgrade', { origin: 'http://dharmaquest-app.vercel.app' }],
    ['cross-site fetch metadata', { 'sec-fetch-site': 'cross-site' }], ['same-site (not same-origin)', { 'sec-fetch-site': 'same-site' }], ['none', { 'sec-fetch-site': 'none' }],
  ];
  for (const [name, headers] of cases) { const { d, log } = mk(); const r = await handleDeleteAccount(req({ headers }), d); assert.equal(r.status, 403, name); assert.deepEqual(log, [], name); }
});
test('delete: only POST with JSON is accepted', async () => {
  for (const method of ['GET', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']) { const { d, log } = mk(); assert.equal((await handleDeleteAccount(req({ method }), d)).status, 405, method); assert.deepEqual(log, []); }
  for (const ct of ['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data; boundary=x', '__remove__']) { const { d, log } = mk(); assert.equal((await handleDeleteAccount(req({ headers: { 'content-type': ct } }), d)).status, 415, ct); assert.deepEqual(log, []); }
  const { d } = mk(); assert.equal((await handleDeleteAccount(req({ headers: { 'content-type': 'Application/JSON; charset=utf-8' } }), d)).status, 200, 'case and parameters are fine');
});
test('delete: an explicit typed confirmation is required', async () => {
  for (const body of [{}, { confirm: 'delete' }, { confirm: 'yes' }, { confirm: true }, { confirm: ['DELETE'] }, { confirm: ' DELETE' }, null, 'DELETE', 5, []]) {
    const { d, log } = mk(); const r = await handleDeleteAccount(req({ body }), d); assert.equal(r.status, 400, JSON.stringify(body)); assert.deepEqual(log, []);
  }
  const { d, log } = mk(); assert.equal((await handleDeleteAccount(req({ body: '__throw__' }), d)).status, 400); assert.deepEqual(log, []);
});
test('delete: not signed in, a throwing auth check, or no admin key all delete nothing', async () => {
  { const { d, log } = mk({ getUserId: async () => null }); assert.equal((await handleDeleteAccount(req(), d)).status, 401); assert.deepEqual(log, []); }
  { const { d, log } = mk({ getUserId: async () => { throw new Error('auth down'); } }); assert.equal((await handleDeleteAccount(req(), d)).status, 401); assert.deepEqual(log, []); }
  { const { d, log } = mk({ adminConfigured: false }); const r = await handleDeleteAccount(req(), d); assert.equal(r.status, 501); assert.deepEqual(log, []); assert.equal(r.body.error, 'not_configured'); }
});
test('delete: a failing delete is reported honestly and the session is NOT cleared (the account still exists)', async () => {
  const { d, log } = mk({ adminDelete: async () => ({ error: { message: 'boom' } }), clearSession: async () => { log.push('clear'); } });
  const r = await handleDeleteAccount(req(), d); assert.equal(r.status, 502); assert.deepEqual(log, []); assert.ok(!JSON.stringify(r.body).includes('boom'), 'internal error text is not leaked');
});
test('delete: a failure while clearing cookies does not turn a successful deletion into an error', async () => {
  const { d } = mk({ clearSession: async () => { throw new Error('cookie'); } }); assert.equal((await handleDeleteAccount(req(), d)).status, 200);
});

/* ---------------- admin config ---------------- */
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (role: string) => `${b64({ alg: 'HS256' })}.${b64({ role })}.${'x'.repeat(20)}`;
test('admin config: needs a real service-role/secret key, a valid URL; never an anon key', () => {
  const url = 'https://abcdefghij.supabase.co';
  assert.equal(getAdminConfig({}).configured, false);
  assert.equal(getAdminConfig({ SUPABASE_SERVICE_ROLE_KEY: jwt('service_role') }).configured, false, 'no url');
  assert.equal(getAdminConfig({ NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: jwt('anon') }).configured, false, 'an ANON key must not be accepted as admin');
  assert.equal(getAdminConfig({ NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: 'garbage' }).configured, false);
  assert.equal(getAdminConfig({ NEXT_PUBLIC_SUPABASE_URL: 'http://evil.example', SUPABASE_SERVICE_ROLE_KEY: jwt('service_role') }).configured, false, 'no http');
  assert.equal(getAdminConfig({ NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: jwt('service_role') }).configured, true);
  assert.equal(getAdminConfig({ NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_' + 'a'.repeat(20) }).configured, true);
});
