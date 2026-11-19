import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyDbError, RepositoryError } from '../lib/learning/repository';
import { SyncEngine, localStorageQueue, memoryQueue } from '../lib/learning/sync';
import type { Op } from '../lib/learning/ops';
import { world, empty, bm } from './helpers';

test('classifyDbError: which failures are worth retrying', () => {
  assert.equal(classifyDbError({ message: 'x' }, undefined), 'transient', 'no HTTP status = the network failed');
  assert.equal(classifyDbError({ message: 'x' }, 0), 'transient');
  assert.equal(classifyDbError({ message: 'x' }, 503), 'transient');
  assert.equal(classifyDbError({ message: 'x' }, 429), 'transient', 'rate limited: back off and retry');
  assert.equal(classifyDbError({ message: 'x' }, 408), 'transient');
  assert.equal(classifyDbError({ message: 'x' }, 401), 'auth');
  assert.equal(classifyDbError({ message: 'JWT expired' }, 400), 'auth');
  assert.equal(classifyDbError({ message: 'x', code: 'PGRST301' }, 400), 'auth');
  for (const s of [400, 403, 404, 409, 422]) assert.equal(classifyDbError({ message: 'x' }, s), 'permanent', String(s));
});

const flushed = (db: ReturnType<typeof world>['db']) => db.log.filter((w) => w.table === 'user_progress' || w.table === 'bookmarks' || w.table === 'user_study_days');

test('flush sends queued operations and empties the queue', async () => {
  const { repo, db } = world(); const q = memoryQueue(); const e = new SyncEngine(repo, q);
  e.enqueue({ t: 'complete', id: 'gita-ch1', at: 5 }); e.enqueue({ t: 'bm+', b: bm('verse', 'bg-2-47') }); e.enqueue({ t: 'day', day: '2026-03-01' });
  assert.equal(e.pending(), 3);
  const f = await e.flush();
  assert.deepEqual([f.sent, f.remaining, f.stopped, f.dropped.length], [3, 0, null, 0]);
  assert.equal(e.pending(), 0);
  assert.equal(db.mine('user_progress').length, 1); assert.equal(db.mine('bookmarks').length, 1); assert.equal(db.mine('user_study_days').length, 1);
});

test('a transient failure keeps EVERYTHING queued, in order; the next flush completes it', async () => {
  const { repo, db } = world(); const e = new SyncEngine(repo, memoryQueue());
  e.enqueue({ t: 'complete', id: 'gita-ch1', at: 5 }); e.enqueue({ t: 'complete', id: 'gita-ch2', at: 6 }); e.enqueue({ t: 'day', day: '2026-03-01' });
  db.fail = { table: 'user_progress', op: 'select', message: 'Failed to fetch', times: 1, throws: true };   // the network drops on the first call
  const f1 = await e.flush();
  assert.equal(f1.stopped, 'transient'); assert.equal(f1.sent, 0); assert.equal(f1.remaining, 3, 'nothing lost, nothing sent out of order');
  const f2 = await e.flush();
  assert.deepEqual([f2.sent, f2.remaining, f2.stopped], [3, 0, null]);
  assert.equal(db.mine('user_progress').length, 2);
});

test('HTTP 5xx and 429 are retried, never dropped', async () => {
  for (const status of [500, 502, 503, 429]) {
    const { repo, db } = world(); const e = new SyncEngine(repo, memoryQueue());
    e.enqueue({ t: 'day', day: '2026-03-01' });
    db.fail = { table: 'user_study_days', op: 'upsert', message: 'server trouble', times: 1, status };
    const f = await e.flush(); assert.equal(f.stopped, 'transient', String(status)); assert.equal(f.remaining, 1);
    assert.equal((await e.flush()).remaining, 0);
  }
});

test('a PERMANENT rejection drops only that operation and the rest still goes through', async () => {
  const { repo, db } = world(); const e = new SyncEngine(repo, memoryQueue());
  e.enqueue({ t: 'complete', id: 'gita-ch1', at: 5 });
  e.enqueue({ t: 'complete', id: 'no-such-lesson', at: 6 });          // unknown lesson: can never succeed
  e.enqueue({ t: 'bm+', b: bm('verse', 'bg-99-1') });                  // unmappable: can never succeed
  e.enqueue({ t: 'complete', id: 'gita-ch2', at: 7 });
  const f = await e.flush();
  assert.equal(f.stopped, null); assert.equal(f.dropped.length, 2); assert.equal(f.sent, 2); assert.equal(e.pending(), 0, 'a poisoned operation never blocks the queue');
  assert.deepEqual(db.mine('user_progress').map((r) => r.lesson_id).sort(), [db.rows('lessons').find((l) => l.slug === 'gita-ch1')!.id, db.rows('lessons').find((l) => l.slug === 'gita-ch2')!.id].sort());
});

test('a database rule violation (e.g. an invalid score) is dropped, not retried forever', async () => {
  const { repo, db } = world(); const q = memoryQueue(); const e = new SyncEngine(repo, q);
  q.write([{ t: 'quiz', id: 'gita-ch1', best: 2, total: 4, last: 2, at: 1, qid: 'q1' } as Op]);
  db.fail = { table: 'user_progress', op: 'upsert', message: 'violates check constraint "quiz_scores_in_range"', times: 1, status: 400, code: '23514' };
  const f = await e.flush(); assert.equal(f.dropped.length, 1); assert.equal(f.remaining, 0);
});

test('an expired session: refreshed once and retried; if refresh fails the queue is kept and flush stops as "auth"', async () => {
  { const { repo, db } = world(); let refreshed = 0; const e = new SyncEngine(repo, memoryQueue(), { refreshSession: async () => { refreshed++; return true; } });
    e.enqueue({ t: 'day', day: '2026-03-01' }); db.fail = { table: 'user_study_days', op: 'upsert', message: 'JWT expired', times: 1, status: 401 };
    const f = await e.flush(); assert.deepEqual([f.sent, f.stopped, refreshed], [1, null, 1], 'one refresh, then the same operation succeeds'); }
  { const { repo, db } = world(); const e = new SyncEngine(repo, memoryQueue(), { refreshSession: async () => false });
    e.enqueue({ t: 'day', day: '2026-03-01' }); db.fail = { table: 'user_study_days', op: 'upsert', message: 'JWT expired', times: 5, status: 401 };
    const f = await e.flush(); assert.deepEqual([f.stopped, f.remaining], ['auth', 1]); }
  { const { repo, db } = world(); let refreshed = 0; const e = new SyncEngine(repo, memoryQueue(), { refreshSession: async () => { refreshed++; return true; } });
    e.enqueue({ t: 'day', day: '2026-03-01' }); db.fail = { table: 'user_study_days', op: 'upsert', message: 'JWT expired', times: 99, status: 401 };
    const f = await e.flush(); assert.equal(f.stopped, 'auth'); assert.equal(refreshed, 1, 'refresh is attempted ONCE per operation, never in a loop'); }
});

test('flush is single-flight: concurrent calls share one run and nothing is sent twice', async () => {
  const { repo, db } = world(); const e = new SyncEngine(repo, memoryQueue());
  e.enqueue({ t: 'bm+', b: bm('verse', 'bg-2-47') }); e.enqueue({ t: 'complete', id: 'gita-ch1', at: 5 });
  const [a, b, c] = await Promise.all([e.flush(), e.flush(), e.flush()]);
  assert.equal(a, b); assert.equal(b, c, 'the same promise');
  assert.equal(flushed(db).filter((w) => w.table === 'bookmarks').length, 1, 'the bookmark was inserted once');
});

test('operations enqueued DURING a flush are sent in the same run', async () => {
  const { repo } = world(); const e = new SyncEngine(repo, memoryQueue());
  e.enqueue({ t: 'complete', id: 'gita-ch1', at: 5 });
  const p = e.flush(); e.enqueue({ t: 'complete', id: 'gita-ch2', at: 6 });
  const f = await p; assert.equal(f.sent + (await e.flush()).sent, 2); assert.equal(e.pending(), 0);
});

test('pull: flushes first, then loads, so a pending removal is not undone by the load', async () => {
  const { repo } = world(); const e = new SyncEngine(repo, memoryQueue());
  await repo.save({ ...empty(), bookmarks: [bm('verse', 'bg-2-47'), bm('lesson', 'gita-ch1')] });
  e.enqueue({ t: 'bm-', kind: 'verse', id: 'bg-2-47' });
  const r = await e.pull({ ...empty(), recent: [{ href: '/x', title: 'X', kind: 'k', at: 1 }] });
  assert.ok(r.state); assert.deepEqual(r.state!.bookmarks.map((b) => b.id), ['gita-ch1'], 'the removal was sent, then the account was loaded');
  assert.equal(r.state!.recent.length, 1, 'local-only data (recent pages) is preserved');
});

test('pull keeps local state when offline (returns null; nothing is lost)', async () => {
  const { repo, db } = world(); const e = new SyncEngine(repo, memoryQueue());
  e.enqueue({ t: 'complete', id: 'gita-ch1', at: 5 });
  db.fail = { table: 'user_progress', op: 'select', message: 'Failed to fetch', times: 9, throws: true };
  const r = await e.pull(empty()); assert.equal(r.state, null); assert.equal((r as { stopped: string }).stopped, 'transient'); assert.equal(e.pending(), 1);
});

test('pull re-applies operations that arrive WHILE the account is being loaded (no flicker back)', async () => {
  const { repo } = world(); const e = new SyncEngine(repo, memoryQueue());
  const realLoad = repo.load.bind(repo);
  repo.load = async () => { const s = await realLoad(); e.enqueue({ t: 'bm+', b: bm('lesson', 'gita-ch2', 777) }); return s; };   // the user acts mid-pull
  const r = await e.pull(empty());
  assert.ok(r.state); assert.ok(r.state!.bookmarks.some((b) => b.id === 'gita-ch2'), 'the just-made change is still visible');
  assert.equal(e.pending(), 1, 'and is still queued to be sent');
});

test('a permanent load failure is reported as permanent (not "offline")', async () => {
  const { repo, db } = world(); const e = new SyncEngine(repo, memoryQueue());
  db.fail = { table: 'user_progress', op: 'select', message: 'permission denied', times: 1, status: 403 };
  const r = await e.pull(empty()); assert.equal(r.state, null); assert.equal((r as { stopped: string }).stopped, 'permanent');
});

/* ---------- persistence ---------- */
function fakeWindow() {
  const store = new Map<string, string>();
  (globalThis as unknown as { window: unknown }).window = { localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { if ((globalThis as { __quota?: boolean }).__quota) throw new Error('QuotaExceededError'); store.set(k, v); }, removeItem: (k: string) => { store.delete(k); } } };
  return store;
}
test('the queue survives a reload (localStorage) and is validated on read', async () => {
  const store = fakeWindow();
  const q1 = localStorageQueue('k'); const { repo } = world(); const e1 = new SyncEngine(repo, q1);
  e1.enqueue({ t: 'bm-', kind: 'verse', id: 'bg-2-47' }); e1.enqueue({ t: 'day', day: '2026-03-01' });
  const q2 = localStorageQueue('k');                      // "after a reload": a fresh object over the same storage
  assert.equal(q2.read().length, 2);
  store.set('k', JSON.stringify([{ t: 'complete', id: '__proto__', at: 1, qid: 'a' }, { t: 'day', day: 'bad', qid: 'b' }, { t: 'day', day: '2026-03-02', qid: 'c' }]));
  assert.deepEqual(localStorageQueue('k').read().map((o) => o.qid), ['c'], 'tampered/invalid entries are discarded');
  store.set('k', '{broken'); assert.deepEqual(localStorageQueue('k').read(), [], 'corrupt JSON gives an empty queue, not a crash');
});
test('when storage is full the queue keeps working in memory', () => {
  fakeWindow(); (globalThis as { __quota?: boolean }).__quota = true;
  try { const q = localStorageQueue('k'); q.write([{ t: 'day', day: '2026-03-01', qid: 'a' }]); assert.equal(q.read().length, 1); }
  finally { (globalThis as { __quota?: boolean }).__quota = false; }
});
