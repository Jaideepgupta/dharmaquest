import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyOps, coalesce, MAX_QUEUE, opKey, sanitizeOps, type Op, type OpBody } from '../lib/learning/ops';
import { SupabaseLearningRepository } from '../lib/learning/repository';
import { SyncEngine, memoryQueue } from '../lib/learning/sync';
import { world, empty, bm, ME } from './helpers';

let n = 0;
const op = (b: OpBody): Op => ({ ...b, qid: `q${n++}` }) as Op;

test('coalesce: only the last operation per fact is kept', () => {
  let q: Op[] = [];
  q = coalesce(q, op({ t: 'bm+', b: bm('verse', 'bg-2-47') }));
  q = coalesce(q, op({ t: 'bm-', kind: 'verse', id: 'bg-2-47' }));
  q = coalesce(q, op({ t: 'bm+', b: bm('verse', 'bg-2-47') }));
  assert.deepEqual(q.map((o) => o.t), ['bm+'], 'on/off/on collapses to one operation: the final intent');
  q = coalesce(q, op({ t: 'complete', id: 'a', at: 1 }));
  q = coalesce(q, op({ t: 'uncomplete', id: 'a' }));
  assert.deepEqual(q.map((o) => o.t), ['bm+', 'uncomplete']);
  q = coalesce(q, op({ t: 'quiz', id: 'a', best: 1, total: 4, last: 1, at: 1 }));
  q = coalesce(q, op({ t: 'quiz', id: 'a', best: 3, total: 4, last: 2, at: 2 }));
  assert.equal(q.filter((o) => o.t === 'quiz').length, 1);
  assert.equal((q.find((o) => o.t === 'quiz') as Extract<Op, { t: 'quiz' }>).best, 3, 'the later quiz result wins');
  q = coalesce(q, op({ t: 'day', day: '2026-01-01' })); q = coalesce(q, op({ t: 'day', day: '2026-01-01' }));
  assert.equal(q.filter((o) => o.t === 'day').length, 1);
  assert.equal(new Set(['lesson:a:completion', 'lesson:a:quiz', 'bm:verse:x', 'day:d']).size, 4);
  assert.equal(opKey({ t: 'complete', id: 'a', at: 1 }), opKey({ t: 'uncomplete', id: 'a' }), 'complete and uncomplete are alternatives');
});
test('coalesce bounds the queue', () => {
  let q: Op[] = [];
  for (let i = 0; i < MAX_QUEUE + 50; i++) q = coalesce(q, op({ t: 'day', day: `2026-01-${String((i % 28) + 1).padStart(2, '0')}-${i}` } as OpBody));
  assert.ok(q.length <= MAX_QUEUE);
});

test('applyOps: earliest completion wins; uncomplete keeps the quiz; removing an absent bookmark is a no-op', () => {
  let s = empty();
  s = applyOps(s, [{ t: 'complete', id: 'a', at: 500 }, { t: 'complete', id: 'a', at: 900 }, { t: 'complete', id: 'a', at: 100 }]);
  assert.equal(s.lessons.a.completedAt, 100);
  s = applyOps(s, [{ t: 'quiz', id: 'a', best: 3, total: 4, last: 3, at: 7 }, { t: 'uncomplete', id: 'a' }]);
  assert.equal(s.lessons.a.completedAt, undefined); assert.equal(s.lessons.a.quiz!.best, 3);
  s = applyOps(s, [{ t: 'uncomplete', id: 'ghost' }, { t: 'bm-', kind: 'verse', id: 'nope' }]);
  assert.deepEqual(Object.keys(s.lessons), ['a']);
  s = applyOps(s, [{ t: 'bm+', b: bm('verse', 'x', 5) }, { t: 'bm+', b: bm('verse', 'x', 9) }]);
  assert.equal(s.bookmarks.length, 1, 'adding twice does not duplicate'); assert.equal(s.bookmarks[0].addedAt, 5);
  s = applyOps(s, [{ t: 'day', day: '2026-02-02' }, { t: 'day', day: '2026-01-01' }, { t: 'day', day: '2026-02-02' }]);
  assert.deepEqual(s.days, ['2026-01-01', '2026-02-02']);
});
test('applyOps is pure', () => {
  const s = empty(); const before = JSON.stringify(s);
  applyOps(s, [{ t: 'complete', id: 'a', at: 1 }, { t: 'bm+', b: bm('verse', 'x') }, { t: 'day', day: '2026-01-01' }]);
  assert.equal(JSON.stringify(s), before);
});

/**
 * The pure model (applyOps) must agree with what the real repository does to the database, otherwise a pull
 * would show different state than the one just sent. Random operation sequences, compared both ways.
 */
function rng(seed: number) { return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
test('MODEL CHECK: applyOps agrees with the repository on random operation sequences', async () => {
  const r = rng(11);
  const lessons = ['gita-overview', 'gita-ch1', 'gita-ch2'];
  const marks = [['verse', 'bg-2-47'], ['chapter', 'bg-2'], ['lesson', 'gita-ch1'], ['darshana', 'samkhya'], ['scripture', 'ramayana']] as const;
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
  for (let round = 0; round < 60; round++) {
    const bodies: OpBody[] = [];
    for (let i = 0; i < 25; i++) {
      const k = Math.floor(r() * 6);
      if (k === 0) bodies.push({ t: 'complete', id: pick(lessons), at: 1000 + Math.floor(r() * 9000) });
      else if (k === 1) bodies.push({ t: 'uncomplete', id: pick(lessons) });
      else if (k === 2) { const total = pick([3, 4]); const best = Math.floor(r() * (total + 1)); bodies.push({ t: 'quiz', id: pick(lessons), best, total, last: Math.floor(r() * (best + 1)), at: 1000 + Math.floor(r() * 9000) }); }
      else if (k === 3) { const [kind, id] = pick(marks); bodies.push({ t: 'bm+', b: bm(kind, id, 1000 + Math.floor(r() * 9000)) }); }
      else if (k === 4) { const [kind, id] = pick(marks); bodies.push({ t: 'bm-', kind, id }); }
      else bodies.push({ t: 'day', day: pick(['2026-03-01', '2026-03-02', '2026-03-03']) });
    }
    // Apply ONE AT A TIME, in order (so nothing is coalesced), and compare with the pure model.
    const direct = world(); const eng2 = new SyncEngine(direct.repo, memoryQueue());
    for (const b of bodies) { eng2.enqueue(b); const f = await eng2.flush(); assert.equal(f.stopped, null); assert.deepEqual(f.dropped, []); }
    const remote = await direct.repo.load();
    const model = applyOps(empty(), bodies);
    const norm = (s: typeof remote) => JSON.stringify({ l: Object.fromEntries(Object.entries(s.lessons).sort()), b: s.bookmarks.map((x) => `${x.kind}:${x.id}:${x.addedAt}`).sort(), d: s.days });
    // A bookmark's saved-at can differ when it is re-added after a removal, so bookmarks are compared by membership.
    const a = JSON.parse(norm(remote)), m = JSON.parse(norm(model));
    assert.deepEqual(a.l, m.l, `round ${round}: lessons`);
    assert.deepEqual(a.d, m.d, `round ${round}: days`);
    assert.deepEqual(a.b.map((x: string) => x.split(':').slice(0, 2).join(':')).sort(), m.b.map((x: string) => x.split(':').slice(0, 2).join(':')).sort(), `round ${round}: bookmarks`);
  }
});

test('sanitizeOps keeps valid operations and rejects everything else', () => {
  const good = [{ t: 'complete', id: 'a', at: 1, qid: 'q1' }, { t: 'uncomplete', id: 'a', qid: 'q2' }, { t: 'quiz', id: 'a', best: 3, total: 4, last: 2, at: 1, qid: 'q3' },
    { t: 'bm+', b: { id: 'x', kind: 'verse', title: 'T', href: '/ok', addedAt: 1 }, qid: 'q4' }, { t: 'bm-', kind: 'verse', id: 'x', qid: 'q5' }, { t: 'day', day: '2026-01-01', qid: 'q6' }];
  assert.equal(sanitizeOps(good).length, 6);
  const bad: unknown[] = [null, 5, 'x', [], {}, { t: 'complete', id: 'a', at: 1 }, { t: 'complete', id: '__proto__', at: 1, qid: 'q' }, { t: 'complete', id: 'a', at: NaN, qid: 'q' },
    { t: 'quiz', id: 'a', best: 9, total: 4, last: 1, at: 1, qid: 'q' }, { t: 'quiz', id: 'a', best: 3, total: 4, last: 3.5, at: 1, qid: 'q' },
    { t: 'bm+', b: { id: 'x', kind: 'verse', title: 'T', href: 'javascript:alert(1)', addedAt: 1 }, qid: 'q' }, { t: 'bm+', b: { id: 'x', kind: 'verse', title: 'T', href: '//evil.example', addedAt: 1 }, qid: 'q' },
    { t: 'bm-', kind: 'hacker', id: 'x', qid: 'q' }, { t: 'day', day: 'tomorrow', qid: 'q' }, { t: 'nuke', qid: 'q' }];
  assert.deepEqual(sanitizeOps(bad), []);
  assert.deepEqual(sanitizeOps('not an array'), []);
  assert.ok(sanitizeOps(Array.from({ length: 5000 }, (_, i) => ({ t: 'day', day: '2026-01-01', qid: `q${i}` }))).length <= MAX_QUEUE);
  void ME;
});
