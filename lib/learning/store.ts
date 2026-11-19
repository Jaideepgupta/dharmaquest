'use client';

/**
 * Local-only learning state (Phase 4). Everything lives in this browser.
 * Designed so a Supabase-backed implementation can later replace the
 * persistence functions while the rest of the UI keeps using the same hook.
 */
import { useEffect, useState, useSyncExternalStore } from 'react';

export const STORAGE_KEY = 'dq-progress-v1';
export const MAX_RECENT = 8;
const MAX_DAYS = 800;
const MAX_BOOKMARKS = 500;

import type { Bookmark, BookmarkKind, LearningState, LessonProgress, RecentItem } from './store-types';
import type { OpBody } from './ops';
export type { Bookmark, BookmarkKind, LearningState, LessonProgress, RecentItem };

const KINDS: BookmarkKind[] = ['verse', 'chapter', 'scripture', 'lesson', 'darshana'];
const EMPTY: LearningState = { version: 1, lessons: {}, bookmarks: [], recent: [], days: [] };

/* ---------- date helpers (local calendar, not UTC) ---------- */
export function localDate(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
export function dayNumber(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

/** Consecutive study days ending today or yesterday; 0 if the last study day is older. */
export function computeStreak(days: string[], today = localDate()): number {
  if (!days.length) return 0;
  const set = new Set(days.map(dayNumber));
  let cursor = dayNumber(today);
  if (!set.has(cursor)) cursor -= 1; // today not yet studied: the streak is still alive until the day ends
  let n = 0;
  while (set.has(cursor)) { n += 1; cursor -= 1; }
  return n;
}

/* ---------- validation: never trust stored/imported data ---------- */
const isStr = (v: unknown, max = 300): v is string => typeof v === 'string' && v.length > 0 && v.length <= max;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
// Keys that would alter an object's prototype instead of adding an entry.
const RESERVED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const safeHref = (v: unknown): v is string => isStr(v, 300) && v.startsWith('/') && !v.startsWith('//');

export function sanitize(raw: unknown): LearningState {
  const out: LearningState = { version: 1, lessons: {}, bookmarks: [], recent: [], days: [] };
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Record<string, unknown>;

  if (r.lessons && typeof r.lessons === 'object') {
    for (const [id, v] of Object.entries(r.lessons as Record<string, unknown>)) {
      if (!isStr(id, 80) || RESERVED_KEYS.has(id) || !v || typeof v !== 'object') continue;
      const p = v as Record<string, unknown>;
      const lp: LessonProgress = {};
      if (isNum(p.completedAt)) lp.completedAt = p.completedAt;
      const q = p.quiz as Record<string, unknown> | undefined;
      if (q && isNum(q.best) && isNum(q.total) && isNum(q.last) && isNum(q.at) && q.total > 0 && q.best >= 0 && q.best <= q.total && q.last >= 0 && q.last <= q.total) {
        lp.quiz = { best: q.best, total: q.total, last: q.last, at: q.at };
      }
      if (lp.completedAt !== undefined || lp.quiz) out.lessons[id] = lp;
    }
  }
  if (Array.isArray(r.bookmarks)) {
    const seen = new Set<string>();
    for (const b of r.bookmarks.slice(0, MAX_BOOKMARKS)) {
      if (!b || typeof b !== 'object') continue;
      const o = b as Record<string, unknown>;
      if (isStr(o.id, 120) && KINDS.includes(o.kind as BookmarkKind) && isStr(o.title) && safeHref(o.href) && isNum(o.addedAt) && !seen.has(`${o.kind}:${o.id}`)) {
        seen.add(`${o.kind}:${o.id}`);
        out.bookmarks.push({ id: o.id, kind: o.kind as BookmarkKind, title: o.title, href: o.href, addedAt: o.addedAt });
      }
    }
  }
  if (Array.isArray(r.recent)) {
    for (const x of r.recent.slice(0, MAX_RECENT)) {
      if (!x || typeof x !== 'object') continue;
      const o = x as Record<string, unknown>;
      if (safeHref(o.href) && isStr(o.title) && isStr(o.kind, 40) && isNum(o.at)) out.recent.push({ href: o.href, title: o.title, kind: o.kind, at: o.at });
    }
  }
  if (Array.isArray(r.days)) {
    out.days = Array.from(new Set(r.days.filter(isDate))).sort().slice(-MAX_DAYS);
  }
  const d = r.daily as Record<string, unknown> | undefined;
  if (d && isDate(d.date) && isStr(d.id, 80)) out.daily = { date: d.date, id: d.id };
  return out;
}

/* ---------- tiny external store ---------- */
let current: LearningState = EMPTY;
let loaded = false;
let persistent = true;
const listeners = new Set<() => void>();

function readStorage(): LearningState {
  let txt: string | null;
  try {
    txt = window.localStorage.getItem(STORAGE_KEY);
    persistent = true;
  } catch {
    persistent = false; // storage blocked (private mode, policy): work in memory and tell the user
    return current;
  }
  if (!txt) return EMPTY;
  try {
    return sanitize(JSON.parse(txt));
  } catch {
    return EMPTY; // corrupted value: start clean instead of crashing
  }
}

function ensureLoaded() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  current = readStorage();
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === null) { current = readStorage(); emit(); }
  });
}

function emit() { listeners.forEach((l) => l()); }

/* ---------- operation feed: lets the (optional) account sync mirror local changes ---------- */
const opListeners = new Set<(op: OpBody) => void>();
export function subscribeOps(fn: (op: OpBody) => void) { opListeners.add(fn); return () => { opListeners.delete(fn); }; }
const emitOp = (op: OpBody) => { for (const l of opListeners) { try { l(op); } catch { /* a sync problem must never break learning */ } } };

/**
 * Re-read storage right before a mutation so each action applies onto the latest saved state.
 * Without this, a page that missed a storage event (e.g. restored from the back/forward cache)
 * would overwrite changes saved by another tab.
 */
function fresh() {
  ensureLoaded();
  if (typeof window === 'undefined') return;
  const latest = readStorage();
  if (persistent) current = latest;
}

function commit(next: LearningState) {
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    persistent = true;
  } catch {
    persistent = false; // quota exceeded or storage blocked: keep working in memory
  }
  emit();
}

function subscribe(cb: () => void) {
  ensureLoaded();
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
const getSnapshot = () => { ensureLoaded(); return current; };
const getServerSnapshot = () => EMPTY;

export function useLearning() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return { state, ready, persistent };
}

/* ---------- actions ---------- */
const withDay = (s: LearningState): LearningState => {
  const t = localDate();
  return s.days.includes(t) ? s : { ...s, days: [...s.days, t].sort().slice(-MAX_DAYS) };
};
/** Emits a study-day operation when an action newly marks today as studied. */
const emitDayIfNew = (before: LearningState, after: LearningState) => {
  const day = after.days.find((d) => !before.days.includes(d));
  if (day) emitOp({ t: 'day', day });
};

export function completeLesson(id: string) {
  fresh();
  const prev = current.lessons[id] ?? {};
  const before = current;
  const at = Date.now();
  // Keep the EARLIEST completion time, exactly as merge and the account do.
  commit(withDay({ ...current, lessons: { ...current.lessons, [id]: { ...prev, completedAt: prev.completedAt ?? at } } }));
  emitOp({ t: 'complete', id, at });
  emitDayIfNew(before, current);
}
export function uncompleteLesson(id: string) {
  fresh();
  const prev = current.lessons[id];
  if (!prev) return;
  const { completedAt: _drop, ...rest } = prev; void _drop;
  const lessons = { ...current.lessons };
  if (rest.quiz) lessons[id] = rest; else delete lessons[id];
  commit({ ...current, lessons });
  emitOp({ t: 'uncomplete', id });
}
export function recordQuiz(id: string, score: number, total: number) {
  fresh();
  const prev = current.lessons[id] ?? {};
  const best = Math.max(prev.quiz?.best ?? 0, score);
  const before = current;
  const at = Date.now();
  commit(withDay({ ...current, lessons: { ...current.lessons, [id]: { ...prev, quiz: { best, total, last: score, at } } } }));
  emitOp({ t: 'quiz', id, best, total, last: score, at });
  emitDayIfNew(before, current);
}
export function toggleBookmark(b: Omit<Bookmark, 'addedAt'>) {
  fresh();
  const exists = current.bookmarks.some((x) => x.id === b.id && x.kind === b.kind);
  const added: Bookmark = { ...b, addedAt: Date.now() };
  commit({
    ...current,
    bookmarks: exists
      ? current.bookmarks.filter((x) => !(x.id === b.id && x.kind === b.kind))
      : [added, ...current.bookmarks].slice(0, MAX_BOOKMARKS),
  });
  emitOp(exists ? { t: 'bm-', kind: b.kind, id: b.id } : { t: 'bm+', b: added });
}
export function recordView(item: Omit<RecentItem, 'at'>) {
  fresh();
  if (current.recent[0]?.href === item.href) return;
  const recent = [{ ...item, at: Date.now() }, ...current.recent.filter((r) => r.href !== item.href)].slice(0, MAX_RECENT);
  commit({ ...current, recent });
}
export function setDaily(date: string, id: string) {
  fresh();
  if (current.daily?.date === date) return;
  commit({ ...current, daily: { date, id } });
}
/** Replaces the local state with `next` (validated). Used by account sync; emits NO operations. */
export function replaceState(next: LearningState) { fresh(); commit(sanitize(next)); }
export function getState(): LearningState { ensureLoaded(); return current; }

export function exportData(): string { fresh(); return JSON.stringify({ app: 'dharmaquest', exportedAt: new Date().toISOString(), data: current }, null, 2); }
export function importData(text: string): { ok: boolean; error?: string } {
  try {
    const parsed = JSON.parse(text);
    const data = parsed?.app === 'dharmaquest' ? parsed.data : parsed;
    if (!data || typeof data !== 'object' || (data as { version?: unknown }).version !== 1) return { ok: false, error: 'This file is not a DharmaQuest export.' };
    commit(sanitize(data));
    return { ok: true };
  } catch { return { ok: false, error: 'The file could not be read as JSON.' }; }
}
export function clearAll() { fresh(); commit({ ...EMPTY, lessons: {}, bookmarks: [], recent: [], days: [] }); }
