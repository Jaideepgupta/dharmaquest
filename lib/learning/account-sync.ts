/**
 * Orchestrates account sync for one browser: reacts to session changes, handles the first-sign-in
 * choice, mirrors local changes to the account, and signs out safely.
 *
 * Rules (each one is tested):
 *  - Progress already in this browser is NEVER silently added to an account. On first sign-in the person is
 *    asked. Data that belongs to a different account is never offered for merging, only discarded.
 *  - After the first sync the account is the source of truth (deletions propagate); local changes travel as
 *    queued operations.
 *  - Signing out clears this device (progress is in the account) unless that would lose unsent changes,
 *    in which case the person must confirm.
 *  - Nothing here can break learning: sync problems only change the status.
 */
import type { Op, OpBody } from './ops';
import { syncOnSignIn, type LearningRepository } from './repository';
import { SyncEngine, type QueueStore } from './sync';
import type { LearningState } from './store-types';

export type Phase = 'signed-out' | 'needs-choice' | 'syncing' | 'synced' | 'offline' | 'auth-expired' | 'error';

export interface SyncStatus {
  phase: Phase;
  userId: string | null;
  email: string | null;
  pending: number;
  lastSyncedAt: number | null;
  /** Operations the account refused (bad data); reported, never retried. */
  dropped: number;
  /** Why the person is being asked: browser has progress with no account, or from a different account. */
  choice: null | { kind: 'anonymous' | 'foreign'; lessons: number; bookmarks: number; days: number };
  message: string | null;
}

export interface LocalPort {
  get(): LearningState;
  replace(state: LearningState): void;
  /** Clears learning data on this device without emitting operations. */
  reset(): void;
  subscribeOps(fn: (op: OpBody) => void): () => void;
}
export interface MarkerStore { read(): string | null; write(userId: string): void; clear(): void }

export interface Deps {
  local: LocalPort;
  marker: MarkerStore;
  repoFor(userId: string): LearningRepository;
  queueFor(userId: string): QueueStore;
  refreshSession?: () => Promise<boolean>;
  /** Defers a flush (debounce). Default: setTimeout. Tests pass a manual scheduler. */
  schedule?: (fn: () => void, ms: number) => void;
  now?: () => number;
}

const hasData = (s: LearningState) => Object.keys(s.lessons).length > 0 || s.bookmarks.length > 0 || s.days.length > 0;

export class AccountSync {
  private _status: SyncStatus = { phase: 'signed-out', userId: null, email: null, pending: 0, lastSyncedAt: null, dropped: 0, choice: null, message: null };
  private listeners = new Set<(s: SyncStatus) => void>();
  private engine: SyncEngine | null = null;
  private unsubOps: (() => void) | null = null;
  private seq = 0;
  private flushTimer = false;

  constructor(private readonly d: Deps) {}

  get status(): SyncStatus { return this._status; }
  subscribe(fn: (s: SyncStatus) => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  private set(patch: Partial<SyncStatus>) { this._status = { ...this._status, ...patch }; this.listeners.forEach((l) => l(this._status)); }

  /** Called whenever the auth session is known or changes. Idempotent for the same user. */
  async onSession(userId: string | null, email: string | null = null): Promise<void> {
    const my = ++this.seq;
    if (!userId) { this.detach(); this.set({ phase: 'signed-out', userId: null, email: null, pending: 0, choice: null, message: null }); return; }

    if (this._status.userId === userId && this.engine) { this.set({ email }); await this.syncNow(); return; }   // token refresh etc.
    this.detach();
    this.set({ userId, email, phase: 'syncing', choice: null, message: null });

    const marker = this.d.marker.read();
    const local = this.d.local.get();
    if (marker !== userId && hasData(local)) {
      if (my !== this.seq) return;
      this.set({ phase: 'needs-choice', choice: { kind: marker ? 'foreign' : 'anonymous', lessons: Object.keys(local.lessons).length, bookmarks: local.bookmarks.length, days: local.days.length } });
      return;
    }
    if (marker !== userId) this.d.marker.write(userId);
    await this.activate(userId, my);
  }

  /** The person's answer to "this browser already has progress". 'add' is only allowed for progress that has no account. */
  async resolveChoice(choice: 'add' | 'discard'): Promise<void> {
    const st = this._status;
    if (st.phase !== 'needs-choice' || !st.userId || !st.choice) return;
    const my = ++this.seq;
    const userId = st.userId;
    this.set({ phase: 'syncing', message: null });
    if (choice === 'add' && st.choice.kind === 'anonymous') {
      try {
        const repo = this.d.repoFor(userId);
        const { state, result } = await syncOnSignIn(this.d.local.get(), repo);
        this.d.local.replace({ ...state, recent: this.d.local.get().recent });
        this.d.marker.write(userId);
        this.set({ dropped: result.skipped.length });
      } catch {
        // Nothing was lost: local data is untouched, the person can try again.
        this.set({ phase: 'needs-choice', message: 'Could not reach your account. Your progress on this device is unchanged. Please try again.' });
        return;
      }
    } else {
      // 'discard', or any attempt to merge another account's data: clear this device, never merge.
      this.d.local.reset();
      this.d.queueFor(userId).write([]);
      this.d.marker.write(userId);
    }
    await this.activate(userId, my);
  }

  private async activate(userId: string, my: number): Promise<void> {
    if (my !== this.seq) return;
    this.engine = new SyncEngine(this.d.repoFor(userId), this.d.queueFor(userId), { refreshSession: this.d.refreshSession });
    this.unsubOps = this.d.local.subscribeOps((op) => {
      this.engine?.enqueue(op);
      this.set({ pending: this.engine?.pending() ?? 0 });
      this.scheduleFlush();
    });
    await this.syncNow();
  }

  private scheduleFlush() {
    if (this.flushTimer) return;
    this.flushTimer = true;
    (this.d.schedule ?? ((fn, ms) => { setTimeout(fn, ms); }))(() => { this.flushTimer = false; void this.syncNow(); }, 800);
  }

  /** Flush queued changes, then bring this device in line with the account. */
  async syncNow(): Promise<void> {
    const engine = this.engine; const my = this.seq;
    if (!engine) return;
    this.set({ phase: 'syncing' });
    const res = await engine.pull(this.d.local.get());
    if (my !== this.seq || engine !== this.engine) return;      // signed out or switched account meanwhile
    this.set({ pending: engine.pending(), dropped: this._status.dropped + res.flush.dropped.length });
    if (res.state) {
      this.d.local.replace(res.state);
      this.set({ phase: 'synced', lastSyncedAt: (this.d.now ?? Date.now)(), message: null });
    } else if (res.stopped === 'auth') {
      this.set({ phase: 'auth-expired', message: 'Your session has expired. Sign in again to keep syncing.' });
    } else if (res.stopped === 'permanent') {
      this.set({ phase: 'error', message: 'Your account could not be read. Your progress on this device is safe.' });
    } else {
      this.set({ phase: 'offline', message: 'You appear to be offline. Changes are saved on this device and will sync later.' });
    }
  }

  /**
   * Sign out of this device. Progress lives in the account, so this device is cleared (so the next person
   * to use this browser cannot see it or merge it into their own account), unless that would lose unsent
   * changes: then `force` is required.
   */
  async signOut(opts: { force?: boolean } = {}): Promise<{ ok: true } | { ok: false; pending: number }> {
    const engine = this.engine; const userId = this._status.userId;
    if (engine && userId) {
      const f = await engine.flush();
      if (f.remaining > 0 && !opts.force) return { ok: false, pending: f.remaining };
    }
    this.seq += 1;
    this.detach();
    this.d.local.reset();
    if (userId) this.d.queueFor(userId).write([]);
    this.d.marker.clear();
    this.set({ phase: 'signed-out', userId: null, email: null, pending: 0, lastSyncedAt: null, dropped: 0, choice: null, message: null });
    return { ok: true };
  }

  /** After the account was deleted on the server: wipe everything local about it. */
  wipeAfterDeletion(): void { void this.signOut({ force: true }); }

  private detach() { this.unsubOps?.(); this.unsubOps = null; this.engine = null; this.flushTimer = false; }
  dispose() { this.seq += 1; this.detach(); this.listeners.clear(); }

  /** For tests: the queue as the engine sees it. */
  pendingOps(): Op[] { return this.engine ? this.d.queueFor(this._status.userId!).read() : []; }
}
