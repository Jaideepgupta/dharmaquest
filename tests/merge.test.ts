import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyLimits, LIMITS, mergeStates } from '../lib/learning/merge';
import type { LearningState } from '../lib/learning/store-types';

/* ---------- seeded random states drawn from SMALL domains so collisions (the hard cases) are common ---------- */
function rng(seed: number) { return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = <T,>(r: () => number, xs: readonly T[]) => xs[Math.floor(r() * xs.length)];

function randomState(r: () => number): LearningState {
  const s: LearningState = { version: 1, lessons: {}, bookmarks: [], recent: [], days: [] };
  for (const id of ['l1', 'l2', 'l3', 'l4']) {
    if (r() < 0.5) continue;
    const p: LearningState['lessons'][string] = {};
    if (r() < 0.6) p.completedAt = pick(r, [1, 2, 3, 4]);
    if (r() < 0.6) {
      const total = pick(r, [3, 4, 5]);          // totals differ on purpose: a quiz can change length
      const best = Math.floor(r() * (total + 1));
      p.quiz = { best, total, last: Math.floor(r() * (best + 1)), at: pick(r, [1, 2, 3, 4]) };
    }
    if (p.completedAt !== undefined || p.quiz) s.lessons[id] = p;
  }
  const seen = new Set<string>();
  for (let i = 0; i < Math.floor(r() * 5); i++) {
    const kind = pick(r, ['verse', 'chapter', 'lesson'] as const); const id = pick(r, ['x', 'y', 'z']);
    if (seen.has(kind + id)) continue; seen.add(kind + id);
    s.bookmarks.push({ kind, id, title: pick(r, ['T1', 'T2', 'T3']), href: '/x', addedAt: pick(r, [1, 2, 3, 4]) });
  }
  const hrefs = new Set<string>();
  for (let i = 0; i < Math.floor(r() * 4); i++) { const href = pick(r, ['/a', '/b', '/c']); if (hrefs.has(href)) continue; hrefs.add(href); s.recent.push({ href, title: pick(r, ['A', 'B']), kind: 'k', at: pick(r, [1, 2, 3]) }); }
  s.days = Array.from(new Set(Array.from({ length: Math.floor(r() * 4) }, () => pick(r, ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04'])))).sort();
  if (r() < 0.5) s.daily = { date: pick(r, ['2026-01-01', '2026-01-02']), id: pick(r, ['l1', 'l2']) };
  return s;
}

const canon = (s: LearningState) => JSON.stringify(s, (_k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v));
const N = 4000;

test('merge is commutative: merge(a,b) = merge(b,a)', () => {
  const r = rng(1);
  for (let i = 0; i < N; i++) { const a = randomState(r), b = randomState(r); assert.equal(canon(mergeStates(a, b)), canon(mergeStates(b, a)), `case ${i}`); }
});
test('merge is associative: merge(merge(a,b),c) = merge(a,merge(b,c))', () => {
  const r = rng(2);
  for (let i = 0; i < N; i++) { const a = randomState(r), b = randomState(r), c = randomState(r);
    assert.equal(canon(mergeStates(mergeStates(a, b), c)), canon(mergeStates(a, mergeStates(b, c))), `case ${i}`); }
});
test('merge is idempotent: merge(a,a) = merge(a) and re-merging a result changes nothing', () => {
  const r = rng(3);
  for (let i = 0; i < N; i++) { const a = randomState(r), b = randomState(r); const m = mergeStates(a, b);
    assert.equal(canon(mergeStates(m, m)), canon(m), `self ${i}`); assert.equal(canon(mergeStates(m, a)), canon(m), `absorb a ${i}`); assert.equal(canon(mergeStates(m, b)), canon(m), `absorb b ${i}`); }
});
test('merge with the empty state is the identity (after canonicalisation)', () => {
  const r = rng(4); const empty: LearningState = { version: 1, lessons: {}, bookmarks: [], recent: [], days: [] };
  for (let i = 0; i < 500; i++) { const a = randomState(r); assert.equal(canon(mergeStates(a, empty)), canon(mergeStates(a, a))); }
});

test('merge never loses anything the user earned (monotonic)', () => {
  const r = rng(5);
  for (let i = 0; i < N; i++) {
    const a = randomState(r), b = randomState(r), m = mergeStates(a, b);
    for (const src of [a, b]) {
      for (const [id, p] of Object.entries(src.lessons)) {
        const got = m.lessons[id]; assert.ok(got, `lesson ${id} kept`);
        if (p.completedAt !== undefined) { assert.ok(got.completedAt !== undefined, 'completion kept'); assert.ok(got.completedAt! <= p.completedAt, 'earliest completion kept'); }
        if (p.quiz) { assert.ok(got.quiz, 'quiz kept'); assert.ok(got.quiz!.best * p.quiz.total >= p.quiz.best * got.quiz!.total, 'best score ratio never decreases'); }
      }
      for (const bm of src.bookmarks) assert.ok(m.bookmarks.some((x) => x.kind === bm.kind && x.id === bm.id), 'bookmark kept');
      for (const d of src.days) assert.ok(m.days.includes(d), 'study day kept');
    }
    // nothing invented either
    for (const id of Object.keys(m.lessons)) assert.ok(id in a.lessons || id in b.lessons);
    assert.ok(m.bookmarks.length <= a.bookmarks.length + b.bookmarks.length);
  }
});

test('merged quiz records stay internally valid (last <= best <= total)', () => {
  const r = rng(6);
  for (let i = 0; i < N; i++) { const m = mergeStates(randomState(r), randomState(r));
    for (const p of Object.values(m.lessons)) if (p.quiz) { assert.ok(p.quiz.last <= p.quiz.best && p.quiz.best <= p.quiz.total && p.quiz.total > 0); } }
});

test('worked example: two devices, different progress, nothing lost', () => {
  const phone: LearningState = { version: 1, days: ['2026-03-01'], recent: [], lessons: { 'gita-ch1': { completedAt: 100, quiz: { best: 4, total: 4, last: 4, at: 100 } } },
    bookmarks: [{ kind: 'verse', id: 'bg-2-47', title: 'Gita 2.47', href: '/v', addedAt: 50 }] };
  const laptop: LearningState = { version: 1, days: ['2026-03-02'], recent: [], lessons: { 'gita-ch1': { completedAt: 90, quiz: { best: 2, total: 4, last: 2, at: 200 } }, 'gita-ch2': { completedAt: 300 } },
    bookmarks: [{ kind: 'verse', id: 'bg-2-47', title: 'Gita 2.47', href: '/v', addedAt: 40 }, { kind: 'lesson', id: 'gita-ch3', title: 'Ch3', href: '/l', addedAt: 60 }] };
  const m = mergeStates(phone, laptop);
  assert.equal(m.lessons['gita-ch1'].completedAt, 90, 'earliest completion');
  assert.equal(m.lessons['gita-ch1'].quiz!.best, 4, 'best score from the phone survives a worse later attempt on the laptop');
  assert.equal(m.lessons['gita-ch2'].completedAt, 300);
  assert.equal(m.bookmarks.length, 2, 'duplicate bookmark collapsed');
  assert.equal(m.bookmarks.find((b) => b.id === 'bg-2-47')!.addedAt, 40, 'earliest save time kept');
  assert.deepEqual(m.days, ['2026-03-01', '2026-03-02']);
});

test('applyLimits: caps sizes deterministically, keeps the NEWEST bookmarks, is idempotent', () => {
  const s: LearningState = { version: 1, lessons: {}, recent: [], days: [],
    bookmarks: Array.from({ length: 700 }, (_, i) => ({ kind: 'lesson' as const, id: `l${i}`, title: `t${i}`, href: '/x', addedAt: i })) };
  const l = applyLimits(s);
  assert.equal(l.bookmarks.length, LIMITS.bookmarks);
  assert.equal(l.bookmarks[0].addedAt, 699, 'newest first');
  assert.equal(Math.min(...l.bookmarks.map((b) => b.addedAt)), 200, 'the 200 oldest are the ones dropped');
  assert.equal(canon(applyLimits(l)), canon(l), 'idempotent');
  const days = Array.from({ length: 900 }, (_, i) => new Date(Date.UTC(2024, 0, 1 + i)).toISOString().slice(0, 10));
  assert.equal(applyLimits({ ...s, bookmarks: [], days }).days.length, LIMITS.days);
  assert.equal(applyLimits({ ...s, bookmarks: [], days }).days.at(-1), days.at(-1), 'most recent days kept');
});

test('merge is a pure function: inputs are not mutated', () => {
  const r = rng(7);
  for (let i = 0; i < 300; i++) { const a = randomState(r), b = randomState(r); const [ja, jb] = [canon(a), canon(b)]; mergeStates(a, b); assert.equal(canon(a), ja); assert.equal(canon(b), jb); }
});
