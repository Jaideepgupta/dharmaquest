/**
 * The magic-link landing logic, as a pure function: exchange the one-time code for a session, then say where to go.
 * It never reflects text from the URL back into a page (no `error_description`), only fixed error codes.
 */
import { safeNext } from './safe-redirect';

export type AuthErrorCode = 'link_expired' | 'access_denied' | 'invalid_link' | 'exchange_failed' | 'unknown';
export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  link_expired: 'That sign-in link has expired. Please request a new one.',
  access_denied: 'Sign-in was cancelled or is not allowed.',
  invalid_link: 'That sign-in link is not valid. Please request a new one.',
  exchange_failed: 'That sign-in link could not be used. It may have been used already, or opened in a different browser from the one where you asked for it. Please request a new one and open it in this browser.',
  unknown: 'Sign-in did not complete. Please try again.',
};
export const isAuthErrorCode = (v: unknown): v is AuthErrorCode => typeof v === 'string' && v in AUTH_ERROR_MESSAGES;

export interface CallbackDeps {
  siteOrigin: string;
  exchange(code: string): Promise<{ error: { message: string } | null }>;
}

const CODE = /^[A-Za-z0-9._~-]{8,512}$/;

export async function handleAuthCallback(url: URL, deps: CallbackDeps): Promise<{ location: string; ok: boolean }> {
  const fail = (code: AuthErrorCode) => ({ ok: false, location: `/account?auth_error=${code}` });
  const p = url.searchParams;
  if (p.has('error') || p.has('error_code') || p.has('error_description')) {
    const c = p.get('error_code');
    return fail(c === 'otp_expired' ? 'link_expired' : p.get('error') === 'access_denied' ? 'access_denied' : 'unknown');
  }
  const code = p.get('code');
  if (!code || !CODE.test(code)) return fail('invalid_link');
  try {
    const { error } = await deps.exchange(code);
    if (error) return fail('exchange_failed');
  } catch { return fail('exchange_failed'); }
  return { ok: true, location: safeNext(p.get('next'), deps.siteOrigin, '/account') };
}
