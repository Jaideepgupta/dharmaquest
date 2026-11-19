'use client';

/**
 * A tiny external store for the account/sync status, importable anywhere without pulling in Supabase.
 * The runtime (lib/auth/runtime.ts, loaded only when accounts are enabled) publishes into it.
 */
import { useSyncExternalStore } from 'react';
import type { SyncStatus } from '@/lib/learning/account-sync';

export const SIGNED_OUT: SyncStatus = { phase: 'signed-out', userId: null, email: null, pending: 0, lastSyncedAt: null, dropped: 0, choice: null, message: null };

let current: SyncStatus = SIGNED_OUT;
let ready = false;
const listeners = new Set<() => void>();

export function publishStatus(s: SyncStatus) { current = s; listeners.forEach((l) => l()); }
export function markReady() { ready = true; listeners.forEach((l) => l()); }
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };

export function useAccountStatus(): { status: SyncStatus; ready: boolean } {
  const status = useSyncExternalStore(subscribe, () => current, () => SIGNED_OUT);
  const isReady = useSyncExternalStore(subscribe, () => ready, () => false);
  return { status, ready: isReady };
}
/** True when a signed-in account is syncing this device (used to adjust local-only controls). */
export const isLinked = (s: SyncStatus) => s.userId !== null && s.phase !== 'signed-out' && s.phase !== 'needs-choice';
