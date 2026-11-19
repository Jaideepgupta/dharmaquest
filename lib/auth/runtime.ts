'use client';

/**
 * Browser runtime for accounts. Loaded ONLY when Supabase is configured (dynamic import), so a site without
 * the environment variables downloads none of this, nor the Supabase client.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { publicConfig } from '@/lib/supabase/public-config';
import { AccountSync } from '@/lib/learning/account-sync';
import { SupabaseLearningRepository, type SupabaseLike } from '@/lib/learning/repository';
import { localStorageQueue } from '@/lib/learning/sync';
import { clearAll, getState, replaceState, subscribeOps } from '@/lib/learning/store';
import { markReady, publishStatus } from './status';
import { AUTH_ERROR_MESSAGES, isAuthErrorCode, type AuthErrorCode } from './callback';

const MARKER_KEY = 'dq-sync-v1';
const queueKey = (userId: string) => `dq-sync-queue-v1:${userId}`;

let clientPromise: Promise<SupabaseClient | null> | null = null;
export function getBrowserClient(): Promise<SupabaseClient | null> {
  const cfg = publicConfig();
  if (!cfg.enabled) return Promise.resolve(null);
  clientPromise ??= import('@supabase/ssr').then((m) => m.createBrowserClient(cfg.url, cfg.anonKey));
  return clientPromise;
}

const marker = {
  read: () => { try { return window.localStorage.getItem(MARKER_KEY); } catch { return null; } },
  write: (u: string) => { try { window.localStorage.setItem(MARKER_KEY, u); } catch { /* ignore */ } },
  clear: () => { try { window.localStorage.removeItem(MARKER_KEY); } catch { /* ignore */ } },
};

let sync: AccountSync | null = null;
let started: Promise<void> | null = null;

/** Starts (once) the session listener and the sync engine. Safe to call from any page. */
export function startAccountSync(): Promise<void> {
  started ??= (async () => {
    const client = await getBrowserClient();
    if (!client) return;
    sync = new AccountSync({
      local: { get: getState, replace: replaceState, reset: clearAll, subscribeOps },
      marker,
      repoFor: (userId) => new SupabaseLearningRepository(client as unknown as SupabaseLike, userId),
      queueFor: (userId) => localStorageQueue(queueKey(userId)),
      refreshSession: async () => !(await client.auth.refreshSession()).error,
    });
    sync.subscribe(publishStatus);

    // IMPORTANT: never call the client from inside onAuthStateChange itself (it holds an internal lock and would
    // deadlock). Defer the work with setTimeout.
    client.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => { void sync?.onSession(session?.user?.id ?? null, session?.user?.email ?? null); }, 0);
    });
    const { data } = await client.auth.getSession();
    await sync.onSession(data.session?.user?.id ?? null, data.session?.user?.email ?? null);

    const kick = () => { if (sync?.status.userId && sync.status.phase !== 'needs-choice') void sync.syncNow(); };
    window.addEventListener('online', kick);
    let last = 0;
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Date.now() - last > 30_000) { last = Date.now(); kick(); } });
    markReady();
  })();
  return started;
}

/* ---------- actions used by the account page ---------- */
export type SendResult = { ok: true } | { ok: false; reason: 'invalid_email' | 'rate_limited' | 'failed' };
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

export async function sendMagicLink(rawEmail: string): Promise<SendResult> {
  const email = rawEmail.trim();
  if (email.length > 254 || !EMAIL.test(email)) return { ok: false, reason: 'invalid_email' };
  const client = await getBrowserClient();
  if (!client) return { ok: false, reason: 'failed' };
  const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback`, shouldCreateUser: true } });
  if (!error) return { ok: true };
  if (error.status === 429 || /rate limit/i.test(error.message)) return { ok: false, reason: 'rate_limited' };
  if (/invalid/i.test(error.message) && /email/i.test(error.message)) return { ok: false, reason: 'invalid_email' };
  return { ok: false, reason: 'failed' };
}

export async function resolveChoice(choice: 'add' | 'discard') { await sync?.resolveChoice(choice); }
export async function syncNow() { await sync?.syncNow(); }

export async function signOut(opts: { force?: boolean } = {}): Promise<{ ok: true } | { ok: false; pending: number }> {
  if (!sync) return { ok: true };
  const r = await sync.signOut(opts);
  if (!r.ok) return r;
  const client = await getBrowserClient();
  await client?.auth.signOut({ scope: 'local' });
  try { window.sessionStorage.removeItem('dq-otp-cooldown'); } catch { /* ignore */ }
  return { ok: true };
}

export async function deleteAccount(confirm: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/account/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm }), credentials: 'same-origin' });
  let body: { ok?: boolean; error?: string } = {};
  try { body = await res.json(); } catch { /* non-JSON error page */ }
  if (res.ok && body.ok) {
    sync?.wipeAfterDeletion();
    const client = await getBrowserClient();
    await client?.auth.signOut({ scope: 'local' }).catch(() => undefined);
    return { ok: true };
  }
  return { ok: false, error: body.error ?? 'failed' };
}

/** Reads a sign-in error from the URL (?auth_error=code, or a #error fragment) as a FIXED message, then cleans the URL. */
export function consumeUrlError(): string | null {
  const url = new URL(window.location.href);
  let code: AuthErrorCode | null = null;
  const q = url.searchParams.get('auth_error');
  if (isAuthErrorCode(q)) code = q;
  else if (url.hash.includes('error')) {
    const h = new URLSearchParams(url.hash.replace(/^#/, ''));
    code = h.get('error_code') === 'otp_expired' ? 'link_expired' : h.get('error') === 'access_denied' ? 'access_denied' : 'unknown';
  }
  if (!code && !q) return null;
  url.searchParams.delete('auth_error'); url.hash = '';
  window.history.replaceState(null, '', url);
  return AUTH_ERROR_MESSAGES[code ?? 'unknown'];
}
