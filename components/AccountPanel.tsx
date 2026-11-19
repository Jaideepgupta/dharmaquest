'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, CloudOff, Loader2, LogOut, Mail, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react';
import { publicConfig } from '@/lib/supabase/public-config';
import { useAccountStatus } from '@/lib/auth/status';

type Rt = typeof import('@/lib/auth/runtime');
const COOLDOWN_KEY = 'dq-otp-cooldown';
const COOLDOWN_MS = 60_000;

const ago = (t: number | null) => {
  if (!t) return null;
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  return s < 10 ? 'just now' : s < 60 ? `${s} seconds ago` : s < 3600 ? `${Math.round(s / 60)} minutes ago` : 'a while ago';
};

export default function AccountPanel() {
  const enabled = publicConfig().enabled;
  const { status, ready } = useAccountStatus();
  const [rt, setRt] = useState<Rt | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The resend cooldown applies to ONE address (asking for another address is never blocked).
  const [cooldown, setCooldown] = useState<{ email: string; until: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [unsent, setUnsent] = useState<number | null>(null);
  const [deleteText, setDeleteText] = useState('');
  const [deleted, setDeleted] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    import('@/lib/auth/runtime').then(async (m) => { if (!alive) return; setRt(m); setUrlError(m.consumeUrlError()); await m.startAccountSync(); });
    try { const c = JSON.parse(window.sessionStorage.getItem(COOLDOWN_KEY) ?? 'null'); if (c && typeof c.email === 'string' && typeof c.until === 'number') setCooldown(c); } catch { /* ignore */ }
    return () => { alive = false; };
  }, [enabled]);

  useEffect(() => { if (!cooldown || cooldown.until <= Date.now()) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [cooldown]);

  if (!enabled) {
    return (
      <div className="acct-card">
        <h2>Accounts are not switched on yet</h2>
        <p>Your lessons, quiz results and bookmarks are kept privately in this browser, and everything on the site works without an account.</p>
        <p><Link href="/progress" className="button button-outline">Go to My learning</Link></p>
      </div>
    );
  }
  if (!rt || !ready) return <p className="muted" aria-live="polite"><Loader2 size={14} className="spin" aria-hidden="true" /> Loading…</p>;

  const norm = (e: string) => e.trim().toLowerCase();
  const wait = cooldown && norm(sentTo ?? email) === cooldown.email ? Math.max(0, Math.ceil((cooldown.until - now) / 1000)) : 0;
  const signedIn = status.userId !== null;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || wait > 0) return;
    setBusy(true); setError(null);
    const r = await rt.sendMagicLink(email);
    setBusy(false);
    if (r.ok) {
      const c = { email: norm(email), until: Date.now() + COOLDOWN_MS }; setCooldown(c); setNow(Date.now());
      try { window.sessionStorage.setItem(COOLDOWN_KEY, JSON.stringify(c)); } catch { /* ignore */ }
      setSentTo(email.trim());
    } else {
      setError(r.reason === 'invalid_email' ? 'Please enter a valid email address.' : r.reason === 'rate_limited' ? 'Too many sign-in emails have been requested. Please wait a few minutes and try again.' : 'We could not send the link. Please try again in a moment.');
    }
  };

  const doSignOut = async (force = false) => {
    setBusy(true);
    const r = await rt.signOut({ force });
    setBusy(false);
    if (!r.ok) setUnsent(r.pending); else { setUnsent(null); setSentTo(null); setCooldown(null); }
  };

  const doDelete = async () => {
    setBusy(true); setError(null);
    const r = await rt.deleteAccount(deleteText.trim());
    setBusy(false);
    if (r.ok) { setDeleted(true); setDeleteText(''); }
    else setError(r.error === 'not_configured' ? 'Account deletion is not available on this site yet. Please contact the site owner.' : r.error === 'confirmation_required' ? 'Type DELETE exactly to confirm.' : 'The account could not be deleted. Nothing was changed. Please try again.');
  };

  /* ---------------- deleted ---------------- */
  if (deleted) {
    return (
      <div className="acct-card" role="status">
        <h2>Your account has been deleted</h2>
        <p>Your account and all the progress, bookmarks and quiz results stored with it have been permanently erased, and this device has been cleared. You are welcome to keep using the site without an account.</p>
      </div>
    );
  }

  /* ---------------- signed out ---------------- */
  if (!signedIn) {
    return (
      <div className="acct-grid">
        <div className="acct-card">
          <h2 ref={headingRef}>Sign in with an email link</h2>
          <p>Enter your email and we will send you a one-time link. No password to remember or store. If this is your first time, your account is created automatically.</p>
          {urlError && <p className="warn" role="alert">{urlError}</p>}
          {sentTo ? (
            <div role="status" className="acct-sent">
              <CheckCircle2 size={20} aria-hidden="true" />
              <div>
                <b>Check your email</b>
                <p>If <b>{sentTo}</b> can receive email, a sign-in link is on its way. <b>Open it in this same browser</b>: a link opened elsewhere will not work.</p>
                <p className="note-small">Can’t see it? Check your spam folder. You can ask for another link {wait > 0 ? `in ${wait} seconds` : 'now'}.</p>
                <div className="lesson-actions">
                  <button type="button" className="button button-outline" disabled={busy || wait > 0} onClick={send as unknown as () => void}>{wait > 0 ? `Resend in ${wait}s` : 'Send another link'}</button>
                  <button type="button" className="cmp-reset" onClick={() => { setSentTo(null); setError(null); }}>Use a different email</button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={send} noValidate>
              <label htmlFor="acct-email">Email address</label>
              <input id="acct-email" name="email" type="email" inputMode="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} aria-describedby={error ? 'acct-err' : undefined} aria-invalid={error ? true : undefined} />
              {error && <p id="acct-err" className="acct-err" role="alert">{error}</p>}
              <button type="submit" className="button button-primary" disabled={busy || wait > 0}><Mail size={16} aria-hidden="true" /> {busy ? 'Sending…' : wait > 0 ? `Wait ${wait}s` : 'Email me a sign-in link'}</button>
            </form>
          )}
        </div>
        <aside className="acct-card quiet">
          <h2>Why sign in?</h2>
          <ul className="notes spaced">
            <li>Keep your progress, quiz results and bookmarks across devices.</li>
            <li>It is optional. Everything works without an account.</li>
            <li>Progress already in this browser is only added to your account if you say so.</li>
          </ul>
          <p className="note-small">We use your email only to send the sign-in link. You can delete your account, and everything stored with it, at any time.</p>
        </aside>
      </div>
    );
  }

  /* ---------------- first sign-in on this device: ask ---------------- */
  if (status.phase === 'needs-choice' && status.choice) {
    const c = status.choice;
    const what = `${c.lessons} ${c.lessons === 1 ? 'lesson' : 'lessons'}, ${c.bookmarks} ${c.bookmarks === 1 ? 'bookmark' : 'bookmarks'} and ${c.days} study ${c.days === 1 ? 'day' : 'days'}`;
    return (
      <div className="acct-card" role="group" aria-labelledby="choice-h">
        <h2 id="choice-h">{c.kind === 'anonymous' ? 'Add this browser’s progress to your account?' : 'This browser has progress from another account'}</h2>
        <p>Signed in as <b>{status.email}</b>. This browser already holds {what}.</p>
        {c.kind === 'anonymous'
          ? <p>You can add it to your account, so it is kept and shared across your devices. Or discard it and start from what your account already has.</p>
          : <p>It belongs to someone else, or to an account that was not signed out. For privacy it will <b>not</b> be added to your account. You can export it first from <Link href="/progress">My learning</Link> in a different tab, then discard it.</p>}
        {status.message && <p className="warn" role="alert">{status.message}</p>}
        <div className="lesson-actions">
          {c.kind === 'anonymous' && <button type="button" className="button button-primary" disabled={busy} onClick={() => rt.resolveChoice('add')}>Add to my account</button>}
          <button type="button" className={c.kind === 'anonymous' ? 'button button-outline' : 'button button-primary'} disabled={busy} onClick={() => rt.resolveChoice('discard')}>Discard it and continue</button>
        </div>
      </div>
    );
  }

  /* ---------------- signed in ---------------- */
  const label =
    status.phase === 'synced' ? { icon: <CheckCircle2 size={18} aria-hidden="true" />, text: `Synced ${ago(status.lastSyncedAt) ?? ''}`.trim(), cls: 'ok' } :
    status.phase === 'syncing' ? { icon: <Loader2 size={18} className="spin" aria-hidden="true" />, text: 'Syncing…', cls: '' } :
    status.phase === 'offline' ? { icon: <CloudOff size={18} aria-hidden="true" />, text: status.pending ? `Offline: ${status.pending} change${status.pending === 1 ? '' : 's'} waiting to sync` : 'Offline', cls: 'warn' } :
    status.phase === 'auth-expired' ? { icon: <ShieldAlert size={18} aria-hidden="true" />, text: 'Session expired', cls: 'warn' } :
    { icon: <ShieldAlert size={18} aria-hidden="true" />, text: 'Sync problem', cls: 'warn' };

  return (
    <div className="acct-grid">
      <div className="acct-card">
        <h2>Your account</h2>
        <p>Signed in as <b>{status.email}</b></p>
        <p className={`acct-sync ${label.cls}`} role="status" aria-live="polite">{label.icon} <span>{label.text}</span></p>
        {status.message && <p className="note-small">{status.message}</p>}
        {status.dropped > 0 && <p className="note-small">{status.dropped} {status.dropped === 1 ? 'change' : 'changes'} could not be saved to your account and {status.dropped === 1 ? 'was' : 'were'} skipped.</p>}
        <p className="note-small">Your progress is saved to your account and shown here as <Link href="/progress">My learning</Link>.</p>
        <div className="lesson-actions">
          <button type="button" className="button button-outline" disabled={busy || status.phase === 'syncing'} onClick={() => rt.syncNow()}><RefreshCw size={15} aria-hidden="true" /> Sync now</button>
          <button type="button" className="button button-outline" disabled={busy} onClick={() => doSignOut(false)}><LogOut size={15} aria-hidden="true" /> Sign out</button>
        </div>
        {unsent !== null && (
          <div className="warn" role="alert">
            <p><b>{unsent} change{unsent === 1 ? '' : 's'} could not be sent yet.</b> Signing out clears this device, so they would be lost.</p>
            <div className="lesson-actions">
              <button type="button" className="button button-small button-dark" onClick={() => doSignOut(true)}>Sign out anyway</button>
              <button type="button" className="cmp-reset" onClick={() => setUnsent(null)}>Stay signed in</button>
            </div>
          </div>
        )}
        <p className="note-small">Signing out also clears the progress shown on this device, so the next person using this browser cannot see it. It stays safe in your account.</p>
      </div>

      <div className="acct-card danger">
        <h2>Delete my account</h2>
        <p>This permanently erases your account and everything stored with it: progress, quiz results and bookmarks. It cannot be undone.</p>
        <label htmlFor="acct-del">Type <b>DELETE</b> to confirm</label>
        <input id="acct-del" value={deleteText} onChange={(e) => setDeleteText(e.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false} />
        {error && <p className="acct-err" role="alert">{error}</p>}
        <button type="button" className="button button-dark" disabled={busy || deleteText.trim() !== 'DELETE'} onClick={doDelete}><Trash2 size={15} aria-hidden="true" /> Delete my account</button>
      </div>
    </div>
  );
}
