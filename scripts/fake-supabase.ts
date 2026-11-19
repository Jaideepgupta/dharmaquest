/**
 * A tiny FAKE Supabase for local development and browser tests of the magic-link flow.
 *
 * It speaks just enough of GoTrue (OTP, PKCE verify + token exchange, refresh, user, logout, admin delete) and
 * PostgREST (select / insert / upsert / delete with eq and in filters) for the real supabase-js client to work,
 * and stores data in the same in-memory database used by the unit tests.
 *
 * It is NOT Supabase. It does not send email: links appear at GET /__mailbox. It has no real security.
 * Never point production at it. Run:  npm run dev:fake-supabase   (listens on http://localhost:54399)
 */
import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { FakeDb } from '../tests/fake-supabase';
import { bhagavadGitaChapters, gitaTexts, verseStudies } from '../lib/content/gita';
import { darshanas } from '../lib/content/darshanas';
import { vedantaComparison } from '../lib/content/comparison';
import { scriptureCategories } from '../lib/content/scriptures';
import { lessons } from '../lib/learning/lessons';

export const ANON_KEY_PLACEHOLDER = 'sb_publishable_localfakekey0000000000';
const SECRET = 'fake-jwt-secret-not-for-production';
const b64u = (b: Buffer | string) => Buffer.from(b).toString('base64url');
const sign = (payload: object) => { const h = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' })); const p = b64u(JSON.stringify(payload)); return `${h}.${p}.${createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`; };
const uuidFor = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

interface User { id: string; email: string; created_at: string }
export interface Mail { to: string; link: string; at: number }

export interface FakeSupabase { url: string; port: number; close(): Promise<void>; mailbox: Mail[]; db: FakeDb; users: Map<string, User>; reset(): void; serviceKey: string; anonKey: string; requests: string[] }

export async function startFakeSupabase(opts: { port?: number; otpPerMinute?: number; failRest?: () => boolean } = {}): Promise<FakeSupabase> {
  const port = opts.port ?? 54399;
  const origin = `http://localhost:${port}`;
  const serviceKey = sign({ role: 'service_role', iss: 'fake' });
  const anonKey = sign({ role: 'anon', iss: 'fake' });
  const db = new FakeDb('00000000-0000-4000-8000-000000000000');
  const users = new Map<string, User>();
  const mailbox: Mail[] = [];
  const requests: string[] = [];
  const tokens = new Map<string, { email: string; challenge: string; redirect: string; exp: number; used: boolean }>();
  const codes = new Map<string, { userId: string; challenge: string; exp: number; used: boolean }>();
  const refresh = new Map<string, string>();      // refresh token -> user id
  const otpCount = new Map<string, number[]>();

  function seedContent() {
    db.tables = {};
    db.seed('lessons', lessons.map((l, i) => ({ id: uuidFor(100 + i), slug: l.id, title: l.title })));
    db.seed('scripture_categories', scriptureCategories.map((c, i) => ({ id: uuidFor(200 + i), slug: c.slug, title: c.title })));
    const cat = (slug: string) => uuidFor(200 + scriptureCategories.findIndex((c) => c.slug === slug));
    db.seed('scriptures', [
      ...gitaTexts.map((g, i) => ({ id: uuidFor(300 + i), slug: g.slug, title: g.name, category_id: cat(g.slug === 'bhagavad-gita' ? 'bhagavad-gita' : 'other-gitas') })),
      { id: uuidFor(350), slug: 'ramayana', title: 'Ramayana', category_id: cat('ramayana') },
      { id: uuidFor(351), slug: 'mahabharata', title: 'Mahabharata', category_id: cat('mahabharata') },
    ]);
    db.seed('darshanas', [...darshanas.map((d, i) => ({ id: uuidFor(400 + i), slug: d.slug, name: d.name })), ...vedantaComparison.entries.map((e, i) => ({ id: uuidFor(420 + i), slug: e.id, name: e.name }))]);
    db.seed('chapters', bhagavadGitaChapters.map((c) => ({ id: uuidFor(500 + c.number), scripture_id: uuidFor(300), number: c.number, unit_kind: 'chapter', english_title: c.englishTitle })));
    db.seed('verses', verseStudies.map((v, i) => ({ id: uuidFor(600 + i), scripture_id: uuidFor(300), label: `${v.chapter}.${v.verse}` })));
  }
  seedContent();

  const session = (u: User) => {
    const now = Math.floor(Date.now() / 1000);
    const access = sign({ sub: u.id, email: u.email, role: 'authenticated', aud: 'authenticated', iat: now, exp: now + 3600 });
    const rt = randomBytes(12).toString('hex'); refresh.set(rt, u.id);
    return { access_token: access, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: rt,
      user: { id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, email_confirmed_at: u.created_at, phone: '', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, identities: [], created_at: u.created_at, updated_at: u.created_at } };
  };
  const subOf = (req: IncomingMessage): { sub: string | null; role: string | null } => {
    const m = /^Bearer (.+)$/.exec(req.headers.authorization ?? ''); if (!m) return { sub: null, role: null };
    const parts = m[1].split('.'); if (parts.length !== 3) return { sub: null, role: null };
    try { const p = JSON.parse(Buffer.from(parts[1], 'base64url').toString()); if (typeof p.exp === 'number' && p.exp < Date.now() / 1000) return { sub: null, role: 'expired' }; return { sub: p.sub ?? null, role: p.role ?? null }; } catch { return { sub: null, role: null }; }
  };

  const cors = (res: ServerResponse) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*, authorization, apikey, content-type, x-client-info, prefer, accept-profile, content-profile, x-supabase-api-version');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Expose-Headers', 'content-range');
  };
  const json = (res: ServerResponse, status: number, body: unknown) => { cors(res); res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
  const readBody = (req: IncomingMessage) => new Promise<string>((ok) => { let s = ''; req.on('data', (c) => { s += c; }); req.on('end', () => ok(s)); });

  const server: Server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', origin);
      requests.push(`${req.method} ${url.pathname}`);
      if (req.method === 'OPTIONS') { cors(res); res.writeHead(204); res.end(); return; }
      const raw = await readBody(req);

      /* ---------- dev helpers ---------- */
      if (url.pathname === '/__mailbox') return json(res, 200, mailbox);
      if (url.pathname === '/__reset') { mailbox.length = 0; users.clear(); tokens.clear(); codes.clear(); refresh.clear(); otpCount.clear(); requests.length = 0; seedContent(); return json(res, 200, { ok: true }); }
      if (url.pathname === '/__tables') return json(res, 200, db.tables);

      /* ---------- auth ---------- */
      if (url.pathname === '/auth/v1/otp' && req.method === 'POST') {
        const b = JSON.parse(raw || '{}') as { email?: string; code_challenge?: string; create_user?: boolean };
        const email = (b.email ?? '').toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 400, { code: 400, error_code: 'validation_failed', msg: 'Unable to validate email address: invalid format' });
        const now = Date.now(); const hits = (otpCount.get(email) ?? []).filter((t) => now - t < 60_000);
        if (hits.length >= (opts.otpPerMinute ?? 3)) return json(res, 429, { code: 429, error_code: 'over_email_send_rate_limit', msg: 'email rate limit exceeded' });
        hits.push(now); otpCount.set(email, hits);
        const token = randomBytes(16).toString('hex');
        tokens.set(token, { email, challenge: b.code_challenge ?? '', redirect: url.searchParams.get('redirect_to') ?? origin, exp: now + 10 * 60_000, used: false });
        mailbox.push({ to: email, link: `${origin}/auth/v1/verify?token=${token}&type=magiclink&redirect_to=${encodeURIComponent(url.searchParams.get('redirect_to') ?? '')}`, at: now });
        return json(res, 200, {});
      }
      if (url.pathname === '/auth/v1/verify' && req.method === 'GET') {
        const t = tokens.get(url.searchParams.get('token') ?? ''); const redirect = url.searchParams.get('redirect_to') || origin;
        const back = (q: Record<string, string>) => { const u = new URL(redirect); for (const [k, v] of Object.entries(q)) u.searchParams.set(k, v); cors(res); res.writeHead(302, { Location: u.toString() }); res.end(); };
        if (!t || t.used || t.exp < Date.now()) return back({ error: 'access_denied', error_code: 'otp_expired', error_description: 'Email link is invalid or has expired' });
        t.used = true;
        let user = [...users.values()].find((u) => u.email === t.email);
        if (!user) { user = { id: randomUUID(), email: t.email, created_at: new Date().toISOString() }; users.set(user.id, user); db.seed('profiles', [{ id: user.id }]); }
        const code = randomUUID(); codes.set(code, { userId: user.id, challenge: t.challenge, exp: Date.now() + 5 * 60_000, used: false });
        return back({ code });
      }
      if (url.pathname === '/auth/v1/token' && req.method === 'POST') {
        const grant = url.searchParams.get('grant_type'); const b = JSON.parse(raw || '{}');
        if (grant === 'pkce') {
          const c = codes.get(b.auth_code);
          if (!c || c.used || c.exp < Date.now()) return json(res, 400, { code: 400, error_code: 'flow_state_not_found', msg: 'invalid flow state, no valid flow state found' });
          const challenge = createHash('sha256').update(String(b.code_verifier ?? '')).digest('base64url');
          if (challenge !== c.challenge) return json(res, 400, { code: 400, error_code: 'bad_code_verifier', msg: 'code challenge does not match previously saved code verifier' });
          c.used = true; return json(res, 200, session(users.get(c.userId)!));
        }
        if (grant === 'refresh_token') {
          const uid = refresh.get(b.refresh_token); const u = uid && users.get(uid);
          if (!u) return json(res, 400, { code: 400, error_code: 'refresh_token_not_found', msg: 'Invalid Refresh Token: Refresh Token Not Found' });
          refresh.delete(b.refresh_token); return json(res, 200, session(u));
        }
        return json(res, 400, { code: 400, msg: 'unsupported grant' });
      }
      if (url.pathname === '/auth/v1/user' && req.method === 'GET') {
        const { sub } = subOf(req); const u = sub && users.get(sub);
        return u ? json(res, 200, session(u).user) : json(res, 401, { code: 401, error_code: 'bad_jwt', msg: 'invalid JWT' });
      }
      if (url.pathname === '/auth/v1/logout' && req.method === 'POST') { cors(res); res.writeHead(204); res.end(); return; }
      const del = /^\/auth\/v1\/admin\/users\/([0-9a-f-]{36})$/.exec(url.pathname);
      if (del && req.method === 'GET') {   // supabase-js looks the user up before deleting
        if (subOf(req).role !== 'service_role') return json(res, 403, { code: 403, error_code: 'not_admin', msg: 'User not allowed' });
        const u = users.get(del[1]);
        return u ? json(res, 200, session(u).user) : json(res, 404, { code: 404, error_code: 'user_not_found', msg: 'User not found' });
      }
      if (del && req.method === 'DELETE') {
        if (subOf(req).role !== 'service_role') return json(res, 403, { code: 403, error_code: 'not_admin', msg: 'User not allowed' });
        if (!users.has(del[1])) return json(res, 404, { code: 404, error_code: 'user_not_found', msg: 'User not found' });
        users.delete(del[1]);
        for (const t of ['user_progress', 'user_study_days', 'bookmarks']) db.tables[t] = db.rows(t).filter((r) => r.user_id !== del[1]);   // ON DELETE CASCADE
        db.tables.profiles = db.rows('profiles').filter((r) => r.id !== del[1]);
        return json(res, 200, {});
      }

      /* ---------- REST ---------- */
      const m = /^\/rest\/v1\/([a-z_]+)$/.exec(url.pathname);
      if (m) {
        const table = m[1]; const { sub } = subOf(req);
        if (opts.failRest?.()) return json(res, 503, { message: 'service unavailable' });
        const userTable = ['user_progress', 'user_study_days', 'bookmarks'].includes(table);
        if (userTable && !sub) return json(res, 401, { code: '42501', message: `permission denied for table ${table}`, details: null, hint: null });
        db.currentUser = sub ?? '00000000-0000-4000-8000-000000000000';
        let q = db.client().from(table) as ReturnType<ReturnType<FakeDb['client']>['from']>;
        const filters: [string, string][] = [];
        for (const [k, v] of url.searchParams) if (!['select', 'on_conflict', 'order', 'limit', 'offset', 'columns'].includes(k)) filters.push([k, v]);
        const applyFilters = <T extends { eq(c: string, v: unknown): T; in(c: string, v: unknown[]): T }>(f: T) => { for (const [k, v] of filters) { const mm = /^(eq|in)\.(.*)$/.exec(v); if (!mm) continue; f = mm[1] === 'eq' ? f.eq(k, mm[2]) : f.in(k, mm[2].replace(/^\(|\)$/g, '').split(',').map((x) => x.replace(/^"|"$/g, ''))); } return f; };
        const fail = (status: number, e: { message: string; code?: string }) => json(res, status, { code: e.code ?? 'PGRST000', message: e.message, details: null, hint: null });
        if (req.method === 'GET') {
          const r = await applyFilters(q.select(url.searchParams.get('select') ?? '*'));
          return r.error ? fail(r.status ?? 400, r.error) : json(res, 200, r.data ?? []);
        }
        if (req.method === 'POST') {
          const rows = JSON.parse(raw || '[]'); const prefer = String(req.headers.prefer ?? '');
          const r = await (prefer.includes('resolution=merge-duplicates') ? q.upsert(rows, { onConflict: url.searchParams.get('on_conflict') ?? undefined }) : q.insert(rows));
          if (r.error) return fail(r.status ?? 400, r.error);
          cors(res); res.writeHead(201); res.end(); return;
        }
        if (req.method === 'DELETE') {
          const r = await applyFilters(q.delete());
          if (r.error) return fail(r.status ?? 400, r.error);
          cors(res); res.writeHead(204); res.end(); return;
        }
      }
      json(res, 404, { message: `not found: ${req.method} ${url.pathname}` });
    } catch (e) { json(res, 500, { message: e instanceof Error ? e.message : 'error' }); }
  });
  await new Promise<void>((ok) => server.listen(port, ok));
  return {
    url: origin, port, mailbox, db, users, requests, serviceKey, anonKey,
    reset: () => { mailbox.length = 0; users.clear(); tokens.clear(); codes.clear(); refresh.clear(); otpCount.clear(); requests.length = 0; seedContent(); },
    close: () => new Promise<void>((ok) => server.close(() => ok())),
  };
}

if (process.argv[1] && /fake-supabase\.ts$/.test(process.argv[1])) {
  startFakeSupabase({ port: Number(process.env.PORT) || 54399 }).then((s) => {
    console.log(`FAKE Supabase listening on ${s.url}  (development only, not real)`);
    console.log(`  NEXT_PUBLIC_SUPABASE_URL=${s.url}`);
    console.log(`  NEXT_PUBLIC_SUPABASE_ANON_KEY=${s.anonKey}`);
    console.log(`  SUPABASE_SERVICE_ROLE_KEY=${s.serviceKey}   # server-only`);
    console.log(`  Emails are not sent: open ${s.url}/__mailbox to find the sign-in link.`);
  });
}
