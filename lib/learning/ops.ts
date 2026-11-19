/**
 * Operations: the unit of change that is queued and sent to the account.
 *
 * Why operations and not merges: a union-merge can never express "this was deleted". After the first
 * sign-in on a device the account is the source of truth, and local changes travel as operations.
 *
 * Pure and dependency-free (shared by the browser store, the sync engine and tests).
 */
import type { Bookmark, BookmarkKind, LearningState } from './store-types';

export type OpBody =
  | { t: 'complete'; id: string; at: number }
  | { t: 'uncomplete'; id: string }
  | { t: 'quiz'; id: string; best: number; total: number; last: number; at: number }
  | { t: 'bm+'; b: Bookmark }
  | { t: 'bm-'; kind: BookmarkKind; id: string }
  | { t: 'day'; day: string };

/** A queued operation carries a unique id so it can be removed after it is sent, even if the queue changed meanwhile. */
export type Op = OpBody & { qid: string };

/**
 * Independent facts the account stores. Two operations on the same key are alternatives: only the
 * last one matters, so earlier ones are dropped (bounded queue; on/off/on toggling collapses to one).
 * Operations on different keys never interact, so their relative order is irrelevant.
 */
export const opKey = (op: OpBody): string => {
  switch (op.t) {
    case 'complete': case 'uncomplete': return `lesson:${op.id}:completion`;
    case 'quiz': return `lesson:${op.id}:quiz`;
    case 'bm+': return `bm:${op.b.kind}:${op.b.id}`;
    case 'bm-': return `bm:${op.kind}:${op.id}`;
    case 'day': return `day:${op.day}`;
  }
};

export const MAX_QUEUE = 1000;

/** Appends `op`, dropping any earlier operation on the same key. */
export function coalesce(queue: Op[], op: Op): Op[] {
  const k = opKey(op);
  return [...queue.filter((o) => opKey(o) !== k), op].slice(-MAX_QUEUE);
}

/**
 * The state the account WILL have once `ops` are applied to `state`. Semantics deliberately mirror the
 * repository (earliest completion wins; a quiz op sets the score; removing an absent bookmark is a no-op),
 * so a pull can show "remote + not-yet-sent changes" without the UI flickering back.
 */
export function applyOps(state: LearningState, ops: readonly OpBody[]): LearningState {
  const lessons = { ...state.lessons };
  let bookmarks = [...state.bookmarks];
  let days = state.days;
  for (const op of ops) {
    switch (op.t) {
      case 'complete': {
        const prev = lessons[op.id] ?? {};
        lessons[op.id] = { ...prev, completedAt: prev.completedAt === undefined ? op.at : Math.min(prev.completedAt, op.at) };
        break;
      }
      case 'uncomplete': {
        const prev = lessons[op.id];
        if (!prev) break;
        const { completedAt: _drop, ...rest } = prev; void _drop;
        if (rest.quiz) lessons[op.id] = rest; else delete lessons[op.id];
        break;
      }
      case 'quiz': lessons[op.id] = { ...(lessons[op.id] ?? {}), quiz: { best: op.best, total: op.total, last: op.last, at: op.at } }; break;
      case 'bm+': if (!bookmarks.some((x) => x.kind === op.b.kind && x.id === op.b.id)) bookmarks = [{ ...op.b }, ...bookmarks]; break;
      case 'bm-': bookmarks = bookmarks.filter((x) => !(x.kind === op.kind && x.id === op.id)); break;
      case 'day': if (!days.includes(op.day)) days = [...days, op.day].sort(); break;
    }
  }
  bookmarks.sort((a, b) => b.addedAt - a.addedAt || `${a.kind}:${a.id}`.localeCompare(`${b.kind}:${b.id}`));
  return { ...state, lessons, bookmarks, days };
}

/* ---------- validation of queued operations read back from storage ---------- */
const KINDS = new Set<string>(['verse', 'chapter', 'scripture', 'lesson', 'darshana']);
const RESERVED = new Set(['__proto__', 'constructor', 'prototype']);
const str = (v: unknown, max = 300): v is string => typeof v === 'string' && v.length > 0 && v.length <= max;
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const lessonId = (v: unknown): v is string => str(v, 80) && !RESERVED.has(v);

export function sanitizeOps(raw: unknown): Op[] {
  if (!Array.isArray(raw)) return [];
  const out: Op[] = [];
  for (const x of raw.slice(0, MAX_QUEUE)) {
    if (!x || typeof x !== 'object') continue;
    const o = x as Record<string, unknown>;
    if (!str(o.qid, 64)) continue;
    const qid = o.qid;
    switch (o.t) {
      case 'complete': if (lessonId(o.id) && num(o.at)) out.push({ t: 'complete', id: o.id, at: o.at, qid }); break;
      case 'uncomplete': if (lessonId(o.id)) out.push({ t: 'uncomplete', id: o.id, qid }); break;
      case 'quiz':
        if (lessonId(o.id) && num(o.best) && num(o.total) && num(o.last) && num(o.at) && o.total > 0 && o.best >= 0 && o.best <= o.total && o.last >= 0 && o.last <= o.best)
          out.push({ t: 'quiz', id: o.id, best: o.best, total: o.total, last: o.last, at: o.at, qid });
        break;
      case 'bm+': {
        const b = o.b as Record<string, unknown> | undefined;
        if (b && str(b.id, 120) && KINDS.has(String(b.kind)) && str(b.title) && str(b.href) && String(b.href).startsWith('/') && !String(b.href).startsWith('//') && num(b.addedAt))
          out.push({ t: 'bm+', b: { id: b.id, kind: b.kind as BookmarkKind, title: b.title, href: b.href as string, addedAt: b.addedAt }, qid });
        break;
      }
      case 'bm-': if (str(o.id, 120) && KINDS.has(String(o.kind))) out.push({ t: 'bm-', kind: o.kind as BookmarkKind, id: o.id, qid }); break;
      case 'day': if (typeof o.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.day)) out.push({ t: 'day', day: o.day, qid }); break;
    }
  }
  return out;
}

let counter = 0;
export const newQid = () => `${Date.now().toString(36)}-${(counter++).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
