import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AccountSync, type MarkerStore, type SyncStatus } from '../lib/learning/account-sync';
import { SupabaseLearningRepository } from '../lib/learning/repository';
import { memoryQueue, type QueueStore } from '../lib/learning/sync';
import type { OpBody } from '../lib/learning/ops';
import { FakeDb } from './fake-supabase';
import { world, FakeLocal, empty, bm, ME, OTHER, uid } from './helpers';

/** One browser: its own local store, marker, queues and a manual flush scheduler, talking to a shared database. */
function device(db: FakeDb, opts: { marker?: string | null } = {}) {
  const local = new FakeLocal();
  let marker: string | null = opts.marker ?? null;
  const markerStore: MarkerStore = { read: () => marker, write: (u) => { marker = u; }, clear: () => { marker = null; } };
  const queues = new Map<string, QueueStore>();
  const timers: (() => void)[] = [];
  const sync = new AccountSync({
    local, marker: markerStore,
    repoFor: (uidx) => new SupabaseLearningRepository(db.client(), uidx),
    queueFor: (uidx) => { if (!queues.has(uidx)) queues.set(uidx, memoryQueue()); return queues.get(uidx)!; },
    schedule: (fn) => { timers.push(fn); },
  });
  return { local, sync, queues, get marker() { return marker; }, runTimers: async () => { const t = timers.splice(0); t.forEach((f) => f()); await tick(); }, status: () => sync.status };
}
const tick = () => new Promise((r) => setTimeout(r, 5));
const dbAs = (db: FakeDb, user: string) => { db.currentUser = user; return db; };
const bmIds = (s: { bookmarks: { id: string }[] }) => s.bookmarks.map((b) => b.id).sort();

test('empty browser, new sign-in: syncs straight away, no questions asked', async () => {
  const { db } = world(); const d = device(db);
  await d.sync.onSession(ME, 'me@example.test');
  assert.equal(d.status().phase, 'synced'); assert.equal(d.marker, ME); assert.equal(d.status().choice, null);
});

test('progress already in the browser is NEVER added to an account without asking', async () => {
  const { db, repo } = world(); const d = device(db);
  d.local.state = { ...empty(), lessons: { 'gita-ch1': { completedAt: 5 } }, bookmarks: [bm('verse', 'bg-2-47')] };
  await d.sync.onSession(ME);
  assert.equal(d.status().phase, 'needs-choice'); assert.equal(d.status().choice!.kind, 'anonymous');
  assert.deepEqual([d.status().choice!.lessons, d.status().choice!.bookmarks], [1, 1], 'the person is told what is there');
  assert.equal(db.mine('user_progress').length, 0, 'nothing has been sent yet');
  assert.equal((await repo.load()).bookmarks.length, 0);
});

test('choosing "add" merges the browser into the account; the account then matches the device', async () => {
  const { db, repo } = world();
  await repo.save({ ...empty(), lessons: { 'gita-ch2': { completedAt: 9 } }, bookmarks: [bm('lesson', 'gita-ch2', 50)], days: ['2026-03-01'] });
  const d = device(db);
  d.local.state = { ...empty(), lessons: { 'gita-ch1': { completedAt: 5 } }, bookmarks: [bm('verse', 'bg-2-47', 40)], days: ['2026-03-02'] };
  await d.sync.onSession(ME); await d.sync.resolveChoice('add');
  assert.equal(d.status().phase, 'synced'); assert.equal(d.marker, ME);
  assert.deepEqual(Object.keys(d.local.state.lessons).sort(), ['gita-ch1', 'gita-ch2']);
  assert.deepEqual(bmIds(d.local.state), ['bg-2-47', 'gita-ch2']);
  assert.deepEqual(d.local.state.days, ['2026-03-01', '2026-03-02']);
  const remote = await repo.load(); assert.deepEqual(Object.keys(remote.lessons).sort(), ['gita-ch1', 'gita-ch2']);
});

test('choosing "discard" clears the browser and starts from the account', async () => {
  const { db, repo } = world(); await repo.save({ ...empty(), lessons: { 'gita-ch2': { completedAt: 9 } } });
  const d = device(db); d.local.state = { ...empty(), lessons: { 'gita-ch1': { completedAt: 5 } } };
  await d.sync.onSession(ME); await d.sync.resolveChoice('discard');
  assert.deepEqual(Object.keys(d.local.state.lessons), ['gita-ch2']); assert.equal(db.mine('user_progress').length, 1, 'the browser data never reached the account');
});

test('SHARED COMPUTER: data that belongs to a different account is never merged, even if "add" is attempted', async () => {
  const { db } = world();
  const d = device(db, { marker: OTHER });                       // this browser last belonged to OTHER (never signed out cleanly)
  d.local.state = { ...empty(), lessons: { 'gita-ch1': { completedAt: 5 } }, bookmarks: [bm('verse', 'bg-2-47')] };
  await d.sync.onSession(ME);
  assert.equal(d.status().choice!.kind, 'foreign', 'the person is told this is not their data');
  await d.sync.resolveChoice('add');                              // forged / mistaken: must NOT merge
  assert.equal(db.mine('user_progress').length, 0, "OTHER's progress was not written into ME's account");
  assert.equal(db.mine('bookmarks').length, 0);
  assert.deepEqual(d.local.state, empty(), "and it was cleared from the device");
  assert.equal(d.marker, ME);
});

test('sign out clears the device, so the next person cannot see it or inherit it', async () => {
  const { db } = world(); const d = device(db);
  await d.sync.onSession(ME); d.local.act({ t: 'complete', id: 'gita-ch1', at: 5 }); await d.runTimers();
  assert.equal((await d.sync.signOut()).ok, true);
  assert.deepEqual(d.local.state, empty()); assert.equal(d.marker, null); assert.equal(d.status().phase, 'signed-out');
  // someone else signs in on the same browser
  dbAs(db, OTHER); await d.sync.onSession(OTHER);
  assert.equal(d.status().phase, 'synced', 'no leftover data, so no prompt'); assert.equal(db.mine('user_progress').length, 0, 'nothing from the previous person');
});

test('sign out with UNSENT changes (offline) refuses unless forced', async () => {
  const { db } = world(); const d = device(db);
  await d.sync.onSession(ME);
  d.local.act({ t: 'bm+', b: bm('verse', 'bg-2-47', 5) });
  db.fail = { table: 'bookmarks', op: 'select', message: 'Failed to fetch', times: 99, throws: true };
  const r = await d.sync.signOut(); assert.deepEqual(r, { ok: false, pending: 1 });
  assert.equal(bmIds(d.local.state)[0], 'bg-2-47', 'nothing was cleared'); assert.equal(d.status().phase !== 'signed-out', true);
  assert.equal((await d.sync.signOut({ force: true })).ok, true); assert.deepEqual(d.local.state, empty());
});

test('changes made while signed in are queued, then sent', async () => {
  const { db, repo } = world(); const d = device(db);
  await d.sync.onSession(ME);
  d.local.act({ t: 'complete', id: 'gita-ch1', at: 5 }); d.local.act({ t: 'bm+', b: bm('verse', 'bg-2-47', 6) }); d.local.act({ t: 'day', day: '2026-03-01' });
  assert.equal(d.status().pending, 3, 'queued immediately');
  await d.runTimers();
  assert.equal(d.status().pending, 0); assert.equal(d.status().phase, 'synced');
  const r = await repo.load(); assert.deepEqual([Object.keys(r.lessons), bmIds(r), r.days], [['gita-ch1'], ['bg-2-47'], ['2026-03-01']]);
});

test('OFFLINE: the device keeps working and syncs later; nothing is lost', async () => {
  const { db, repo } = world(); const d = device(db);
  await d.sync.onSession(ME);
  db.fail = { table: 'user_progress', op: 'select', message: 'Failed to fetch', times: 3, throws: true };
  d.local.act({ t: 'complete', id: 'gita-ch1', at: 5 }); await d.runTimers();
  assert.equal(d.status().phase, 'offline'); assert.equal(d.status().pending, 1);
  assert.ok(d.local.state.lessons['gita-ch1'], 'the local change is still there');
  db.fail = null; await d.sync.syncNow();
  assert.equal(d.status().phase, 'synced'); assert.equal(d.status().pending, 0);
  assert.ok((await repo.load()).lessons['gita-ch1']);
});

test('DELETIONS PROPAGATE between devices (a removed bookmark is not resurrected)', async () => {
  const { db } = world();
  const a = device(db), b = device(db);
  await a.sync.onSession(ME); await b.sync.onSession(ME);
  a.local.act({ t: 'bm+', b: bm('verse', 'bg-2-47', 5) }); await a.runTimers();
  await b.sync.syncNow(); assert.deepEqual(bmIds(b.local.state), ['bg-2-47'], 'device B received it');
  a.local.act({ t: 'bm-', kind: 'verse', id: 'bg-2-47' }); await a.runTimers();   // A removes it
  await b.sync.syncNow();
  assert.deepEqual(bmIds(b.local.state), [], 'device B no longer has it');
  await a.sync.syncNow(); await b.sync.syncNow();
  assert.deepEqual([bmIds(a.local.state), bmIds(b.local.state)], [[], []], 'and it never comes back');
});

test('"mark as not completed" propagates too', async () => {
  const { db } = world(); const a = device(db), b = device(db);
  await a.sync.onSession(ME); await b.sync.onSession(ME);
  a.local.act({ t: 'complete', id: 'gita-ch1', at: 5 }); await a.runTimers(); await b.sync.syncNow();
  assert.ok(b.local.state.lessons['gita-ch1']);
  a.local.act({ t: 'uncomplete', id: 'gita-ch1' }); await a.runTimers(); await b.sync.syncNow();
  assert.equal(b.local.state.lessons['gita-ch1'], undefined);
});

test('repeated session events for the same user (token refresh) do not re-merge or re-prompt', async () => {
  const { db } = world(); const d = device(db);
  await d.sync.onSession(ME, 'a@x.test'); const before = d.status().lastSyncedAt;
  d.local.state = { ...d.local.state, lessons: { 'gita-ch1': { completedAt: 1 } } };       // would trigger a prompt if treated as a new sign-in
  await d.sync.onSession(ME, 'a@x.test'); await d.sync.onSession(ME, 'a@x.test');
  assert.notEqual(d.status().phase, 'needs-choice'); assert.ok(before !== null);
});

test('a session event for a DIFFERENT user while one is active switches cleanly (stale work is ignored)', async () => {
  const { db } = world(); const d = device(db);
  await d.sync.onSession(ME);
  d.local.act({ t: 'complete', id: 'gita-ch1', at: 5 });
  dbAs(db, OTHER); await d.sync.onSession(OTHER);
  assert.equal(d.status().userId, OTHER);
  assert.equal(d.status().phase, 'needs-choice', "ME's local progress is not silently inherited by OTHER");
  assert.equal(d.status().choice!.kind, 'foreign');
});

test('a failed "add" leaves the browser data untouched and lets the person retry', async () => {
  const { db } = world(); const d = device(db);
  d.local.state = { ...empty(), lessons: { 'gita-ch1': { completedAt: 5 } } };
  await d.sync.onSession(ME);
  db.fail = { table: 'user_progress', op: 'select', message: 'Failed to fetch', times: 1, throws: true };
  await d.sync.resolveChoice('add');
  assert.equal(d.status().phase, 'needs-choice'); assert.ok(d.status().message); assert.ok(d.local.state.lessons['gita-ch1'], 'untouched'); assert.equal(d.marker, null);
  await d.sync.resolveChoice('add'); assert.equal(d.status().phase, 'synced'); assert.equal(db.mine('user_progress').length, 1);
});

test('operations the account refuses are counted, not retried, and do not stop syncing', async () => {
  const { db } = world(); const d = device(db);
  await d.sync.onSession(ME);
  d.local.act({ t: 'complete', id: 'ghost-lesson', at: 1 }); d.local.act({ t: 'complete', id: 'gita-ch1', at: 2 });
  await d.runTimers();
  assert.equal(d.status().dropped, 1); assert.equal(d.status().pending, 0); assert.equal(db.mine('user_progress').length, 1);
});

test('signed-out sessions: ops are not queued, nothing is sent', async () => {
  const { db } = world(); const d = device(db);
  await d.sync.onSession(null);
  d.local.act({ t: 'complete', id: 'gita-ch1', at: 5 }); await d.runTimers();
  assert.equal(db.log.length, 0); assert.equal(d.status().phase, 'signed-out');
});

test('status updates reach subscribers; dispose stops everything', async () => {
  const { db } = world(); const d = device(db); const seen: string[] = [];
  const un = d.sync.subscribe((s: SyncStatus) => seen.push(s.phase));
  await d.sync.onSession(ME); assert.ok(seen.includes('syncing') && seen.includes('synced'));
  un(); const n = seen.length; await d.sync.syncNow(); assert.equal(seen.length, n, 'unsubscribed');
  d.sync.dispose(); d.local.act({ t: 'complete', id: 'gita-ch1', at: 5 }); await d.runTimers(); assert.equal(db.mine('user_progress').length, 0, 'after dispose nothing is mirrored');
});

test('RACE: a sync that finishes AFTER sign-out must not put the previous person\'s progress back on the device', async () => {
  const { db, repo } = world();
  await repo.save({ ...empty(), lessons: { 'gita-ch2': { completedAt: 9 } }, bookmarks: [bm('verse', 'bg-2-47', 5)] });
  const d = device(db);
  await d.sync.onSession(ME);
  // make the next account load slow, so sign-out can happen while it is in flight
  let release!: () => void; const gate = new Promise<void>((r) => { release = r; });
  const real = SupabaseLearningRepository.prototype.load;
  SupabaseLearningRepository.prototype.load = async function (this: SupabaseLearningRepository) { await gate; return real.call(this); };
  try {
    const pending = d.sync.syncNow();
    await tick();
    assert.equal((await d.sync.signOut({ force: true })).ok, true);
    release(); await pending; await tick();
    assert.deepEqual(d.local.state, empty(), 'the late result was discarded: the device stays clear');
    assert.equal(d.status().phase, 'signed-out');
  } finally { SupabaseLearningRepository.prototype.load = real; }
});

test('RACE: a session refresh during a flush does not replace the engine, so nothing is sent twice', async () => {
  const { db } = world(); const d = device(db);
  await d.sync.onSession(ME);
  d.local.act({ t: 'complete', id: 'gita-ch1', at: 5 });
  const writes = () => db.log.filter((w) => w.table === 'user_progress' && w.op === 'upsert').length;
  const p = d.runTimers();                       // flush starts
  await d.sync.onSession(ME);                    // token refresh arrives mid-flush
  await p; await tick();
  assert.equal(writes(), 1, 'the operation was sent exactly once');
  assert.equal(d.status().pending, 0);
});

test('"discard" clears the device even if the account cannot be reached afterwards', async () => {
  const { db } = world(); const d = device(db);
  d.local.state = { ...empty(), lessons: { 'gita-ch1': { completedAt: 5 } }, bookmarks: [bm('verse', 'bg-2-47')] };
  await d.sync.onSession(ME);
  db.fail = { table: 'user_progress', op: 'select', message: 'Failed to fetch', times: 99, throws: true };
  await d.sync.resolveChoice('discard');
  assert.deepEqual(d.local.state, empty(), 'cleared even though syncing failed');
  assert.equal(d.status().phase, 'offline');
});

/* ---------- randomized two-device convergence ---------- */
function rng(seed: number) { return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
test('CONVERGENCE: two devices doing random things, with random network failures, end up identical', async () => {
  const r = rng(2026);
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
  const marks = [['verse', 'bg-2-47'], ['chapter', 'bg-2'], ['lesson', 'gita-ch1'], ['darshana', 'samkhya']] as const;
  for (let round = 0; round < 40; round++) {
    const { db } = world(); const devs = [device(db), device(db)];
    for (const d of devs) await d.sync.onSession(ME);
    for (let step = 0; step < 40; step++) {
      const d = pick(devs); const k = r();
      if (k < 0.55) {
        const b = r(); let op: OpBody;
        if (b < 0.25) op = { t: 'complete', id: pick(['gita-ch1', 'gita-ch2', 'gita-overview']), at: 1000 + step };
        else if (b < 0.4) op = { t: 'uncomplete', id: pick(['gita-ch1', 'gita-ch2', 'gita-overview']) };
        else if (b < 0.7) { const [kind, id] = pick(marks); op = { t: 'bm+', b: bm(kind, id, 1000 + step) }; }
        else if (b < 0.9) { const [kind, id] = pick(marks); op = { t: 'bm-', kind, id }; }
        else op = { t: 'day', day: pick(['2026-03-01', '2026-03-02']) };
        d.local.act(op);
      } else if (k < 0.8) { await d.runTimers(); }
      else if (k < 0.9) { await d.sync.syncNow(); }
      else { db.fail = { table: pick(['user_progress', 'bookmarks', 'user_study_days']), op: pick(['select', 'upsert', 'insert']), message: 'Failed to fetch', times: 1, throws: true }; }
    }
    db.fail = null;
    // quiesce: everyone flushes, then everyone pulls twice
    for (let i = 0; i < 2; i++) for (const d of devs) { await d.runTimers(); await d.sync.syncNow(); }
    const [a, b] = devs; const norm = (s: typeof a.local.state) => JSON.stringify({ l: Object.fromEntries(Object.entries(s.lessons).map(([k, v]) => [k, v.completedAt !== undefined]).sort()), b: bmIds(s), d: s.days });
    assert.equal(a.status().pending + b.status().pending, 0, `round ${round}: queues drained`);
    assert.equal(norm(a.local.state), norm(b.local.state), `round ${round}: both devices show the same thing`);
    const remote = await new SupabaseLearningRepository(db.client(), ME).load();
    assert.equal(norm(a.local.state), norm({ ...remote }), `round ${round}: and it matches the account`);
  }
});
void uid;
