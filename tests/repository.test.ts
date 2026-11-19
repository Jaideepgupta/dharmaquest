import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RepositoryError, SupabaseLearningRepository, syncOnSignIn } from '../lib/learning/repository';
import type { LearningState } from '../lib/learning/store-types';
import { FakeDb } from './fake-supabase';

const ME = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

function world(user = ME) {
  const db = new FakeDb(user);
  db.seed('lessons', ['gita-overview', 'gita-ch1', 'gita-ch2', 'verse-2-47', 'darshana-samkhya', 'ramayana'].map((slug, i) => ({ id: uid(100 + i), slug, title: `Title of ${slug}` })));
  db.seed('scripture_categories', ['bhagavad-gita', 'other-gitas', 'ramayana', 'mahabharata', 'upanishads', 'vedas'].map((slug, i) => ({ id: uid(200 + i), slug, title: `Cat ${slug}` })));
  const cat = (s: string) => uid(200 + ['bhagavad-gita', 'other-gitas', 'ramayana', 'mahabharata', 'upanishads', 'vedas'].indexOf(s));
  db.seed('scriptures', [
    { id: uid(300), slug: 'bhagavad-gita', title: 'Bhagavad Gita', category_id: cat('bhagavad-gita') },
    { id: uid(301), slug: 'ashtavakra-gita', title: 'Ashtavakra Gita', category_id: cat('other-gitas') },
    { id: uid(302), slug: 'ramayana', title: 'Ramayana', category_id: cat('ramayana') },
    { id: uid(303), slug: 'isha-upanishad', title: 'Isha Upanishad', category_id: cat('upanishads') }, // catalogue-only: no page
  ]);
  db.seed('darshanas', [{ id: uid(400), slug: 'samkhya', name: 'Samkhya' }]);
  db.seed('chapters', [1, 2, 3].map((n) => ({ id: uid(500 + n), scripture_id: uid(300), number: n, unit_kind: 'chapter', english_title: `Title ${n}` })));
  db.seed('verses', [{ id: uid(600), scripture_id: uid(300), label: '2.47' }]);
  const repo = new SupabaseLearningRepository(db.client(), user);
  return { db, repo };
}
const empty = (): LearningState => ({ version: 1, lessons: {}, bookmarks: [], recent: [], days: [] });
const bm = (kind: LearningState['bookmarks'][number]['kind'], id: string, addedAt = 1000) => ({ kind, id, title: `T ${id}`, href: '/x', addedAt });

test('constructor rejects a user id that is not a UUID', () => {
  assert.throws(() => new SupabaseLearningRepository(new FakeDb(ME).client(), "x'; drop table users; --"), /UUID/);
});

test('load: empty account gives an empty state', async () => {
  const { repo } = world();
  const s = await repo.load();
  assert.deepEqual([s.lessons, s.bookmarks, s.days], [{}, [], []]);
});

test('save then load round-trips progress, quiz scores, study days and bookmarks', async () => {
  const { repo } = world();
  const local: LearningState = { ...empty(), days: ['2026-03-01', '2026-03-02'],
    lessons: { 'gita-ch1': { completedAt: Date.parse('2026-03-01T10:00:00Z'), quiz: { best: 3, total: 4, last: 2, at: Date.parse('2026-03-01T10:05:00Z') } }, 'gita-ch2': { quiz: { best: 1, total: 4, last: 1, at: Date.parse('2026-03-02T09:00:00Z') } } },
    bookmarks: [bm('verse', 'bg-2-47'), bm('chapter', 'bg-2'), bm('lesson', 'gita-ch1'), bm('darshana', 'samkhya'), bm('scripture', 'ramayana'), bm('scripture', 'ashtavakra-gita'), bm('scripture', 'upanishads')] };
  const res = await repo.save(local);
  assert.deepEqual(res.skipped, [], 'nothing skipped');
  const back = await repo.load();
  assert.deepEqual(back.lessons, local.lessons);
  assert.deepEqual(back.days, local.days);
  assert.deepEqual(back.bookmarks.map((b) => `${b.kind}:${b.id}`).sort(), local.bookmarks.map((b) => `${b.kind}:${b.id}`).sort());
});

test('bookmarks map to the right database column and come back with correct titles and links', async () => {
  const { db, repo } = world();
  await repo.save({ ...empty(), bookmarks: [bm('verse', 'bg-2-47'), bm('chapter', 'bg-2'), bm('scripture', 'upanishads'), bm('scripture', 'ashtavakra-gita'), bm('lesson', 'gita-overview')] });
  const rows = db.mine('bookmarks');
  assert.ok(rows.some((r) => r.verse_id === uid(600)), 'verse -> verse_id');
  assert.ok(rows.some((r) => r.chapter_id === uid(502)), 'chapter -> chapter_id');
  assert.ok(rows.some((r) => r.category_id === uid(204)), 'a collection page -> category_id');
  assert.ok(rows.some((r) => r.scripture_id === uid(301)), 'a Gita -> scripture_id');
  assert.ok(rows.every((r) => TARGET_COLS.filter((c) => r[c] != null).length === 1), 'exactly one target per row');
  const back = await repo.load();
  const by = (k: string, id: string) => back.bookmarks.find((b) => b.kind === k && b.id === id)!;
  assert.deepEqual([by('verse', 'bg-2-47').title, by('verse', 'bg-2-47').href], ['Bhagavad Gita 2.47', '/gita/bhagavad-gita/2/47']);
  assert.equal(by('chapter', 'bg-2').href, '/gita/bhagavad-gita/2');
  assert.equal(by('scripture', 'upanishads').href, '/scriptures/upanishads');
  assert.equal(by('scripture', 'ashtavakra-gita').href, '/gita/ashtavakra-gita');
  assert.equal(by('lesson', 'gita-overview').title, 'Title of gita-overview', 'real lesson title, not a placeholder');
});
const TARGET_COLS = ['verse_id', 'chapter_id', 'scripture_id', 'category_id', 'lesson_id', 'darshana_id'];

test('items that cannot be mapped are REPORTED, never silently dropped, and never block the rest', async () => {
  const { db, repo } = world();
  const res = await repo.save({ ...empty(), lessons: { 'gita-ch1': { completedAt: 5 }, 'no-such-lesson': { completedAt: 6 } },
    bookmarks: [bm('verse', 'bg-2-47'), bm('verse', 'bg-99-1'), bm('verse', 'not-a-verse'), bm('chapter', 'bg-77'), bm('scripture', 'isha-upanishad'), bm('scripture', 'nope'), bm('lesson', 'nope'), bm('darshana', 'nope')] });
  assert.equal(db.mine('user_progress').length, 1, 'the valid lesson was saved');
  assert.equal(db.mine('bookmarks').length, 1, 'only the valid bookmark was saved');
  assert.deepEqual(res.skipped.map((s) => s.id).sort(), ['bg-77', 'bg-99-1', 'isha-upanishad', 'no-such-lesson', 'nope', 'nope', 'nope', 'not-a-verse'].sort());
  assert.ok(res.skipped.every((s) => s.reason.length > 5));
});

test('save is idempotent: repeating it creates no duplicates and changes nothing', async () => {
  const { db, repo } = world();
  const s: LearningState = { ...empty(), days: ['2026-03-01'], lessons: { 'gita-ch1': { completedAt: 5, quiz: { best: 2, total: 4, last: 2, at: 7 } } }, bookmarks: [bm('verse', 'bg-2-47'), bm('lesson', 'gita-ch1')] };
  await repo.save(s);
  const snap = JSON.stringify([db.mine('user_progress'), db.mine('user_study_days'), db.mine('bookmarks').map((r) => ({ ...r, id: 0 }))]);
  await repo.save(s); await repo.save(s);
  assert.equal(JSON.stringify([db.mine('user_progress'), db.mine('user_study_days'), db.mine('bookmarks').map((r) => ({ ...r, id: 0 }))]), snap);
  assert.equal(db.mine('bookmarks').length, 2);
});

test('every write carries the signed-in user id and never anyone else’s', async () => {
  const { db, repo } = world();
  await repo.save({ ...empty(), days: ['2026-03-01'], lessons: { 'gita-ch1': { completedAt: 5 } }, bookmarks: [bm('verse', 'bg-2-47')] });
  await repo.completeLesson('gita-ch2', 10); await repo.addBookmark(bm('lesson', 'gita-ch2')); await repo.addStudyDay('2026-03-05'); await repo.recordQuiz('gita-ch1', 3, 4, 3, Date.parse('2026-03-06T00:00:00Z'));
  for (const w of db.log) for (const r of w.rows) if (['user_progress', 'user_study_days', 'bookmarks'].includes(w.table)) assert.equal(r.user_id, ME, `${w.table} ${w.op}`);
});

test('one user cannot see or touch another user’s rows (and the repository never asks to)', async () => {
  const a = world(ME); const b = new SupabaseLearningRepository(a.db.client(), OTHER);
  await a.repo.save({ ...empty(), lessons: { 'gita-ch1': { completedAt: 5 } }, bookmarks: [bm('verse', 'bg-2-47')] });
  a.db.currentUser = OTHER;
  const theirs = await b.load();
  assert.deepEqual([Object.keys(theirs.lessons), theirs.bookmarks.length], [[], 0], 'OTHER sees none of ME’s data');
  await b.save({ ...empty(), lessons: { 'gita-ch2': { completedAt: 9 } } });
  a.db.currentUser = ME;
  const mine = await a.repo.load();
  assert.deepEqual(Object.keys(mine.lessons), ['gita-ch1'], 'ME is untouched by OTHER’s save');
  // The fake enforces RLS: forging a write for another user is rejected.
  const forged = a.db.client().from('user_progress').upsert([{ user_id: OTHER, lesson_id: uid(100), completed_at: null }], { onConflict: 'user_id,lesson_id' });
  assert.match(String((await forged).error?.message), /row-level security/);
});

test('invalid scores are never sent: a malformed local record is rejected by the schema, not stored', async () => {
  const { db, repo } = world();
  await assert.rejects(repo.save({ ...empty(), lessons: { 'gita-ch1': { quiz: { best: 9, total: 4, last: 1, at: 1 } } } }), (e: unknown) => e instanceof RepositoryError && /quiz_scores_in_range/.test((e as Error).message));
  assert.equal(db.mine('user_progress').length, 0);
});

test('a failure mid-save surfaces as a RepositoryError and a retry completes safely without duplicates', async () => {
  const { db, repo } = world();
  const s: LearningState = { ...empty(), days: ['2026-03-01', '2026-03-02'], lessons: { 'gita-ch1': { completedAt: 5 } }, bookmarks: [bm('verse', 'bg-2-47'), bm('chapter', 'bg-2')] };
  db.fail = { table: 'bookmarks', op: 'insert', message: 'connection reset', times: 1 };
  await assert.rejects(repo.save(s), (e: unknown) => e instanceof RepositoryError && (e as RepositoryError).table === 'bookmarks' && /connection reset/.test((e as Error).message));
  assert.equal(db.mine('user_progress').length, 1, 'earlier steps persisted');
  assert.equal(db.mine('bookmarks').length, 0, 'no half-written bookmark batch');
  await repo.save(s);                                 // retry
  assert.equal(db.mine('user_progress').length, 1);
  assert.equal(db.mine('user_study_days').length, 2);
  assert.equal(db.mine('bookmarks').length, 2);
  await repo.save(s);
  assert.equal(db.mine('bookmarks').length, 2, 'still no duplicates after another retry');
});

test('read errors are not swallowed', async () => {
  const { db, repo } = world();
  db.fail = { table: 'user_progress', op: 'select', message: 'permission denied', times: 1 };
  await assert.rejects(repo.load(), (e: unknown) => e instanceof RepositoryError && /permission denied/.test((e as Error).message));
});

test('operations: complete keeps the EARLIEST time; uncomplete keeps the quiz; recordQuiz adds a study day', async () => {
  const { db, repo } = world();
  await repo.completeLesson('gita-ch1', 5000);
  await repo.completeLesson('gita-ch1', 9000);
  assert.equal((await repo.load()).lessons['gita-ch1'].completedAt, 5000, 'a later completion does not overwrite');
  await repo.completeLesson('gita-ch1', 1000);
  assert.equal((await repo.load()).lessons['gita-ch1'].completedAt, 1000, 'an earlier one does');
  await repo.recordQuiz('gita-ch1', 3, 4, 3, Date.parse('2026-03-06T08:00:00Z'));
  assert.ok(db.mine('user_study_days').some((r) => r.day === '2026-03-06'), 'a quiz counts as a study day');
  await repo.uncompleteLesson('gita-ch1');
  const after = (await repo.load()).lessons['gita-ch1'];
  assert.equal(after.completedAt, undefined, 'completion removed');
  assert.equal(after.quiz?.best, 3, 'quiz score kept');
  await assert.rejects(repo.completeLesson('ghost', 1), /unknown lesson/);
  await assert.rejects(repo.addStudyDay('06/03/2026'), /invalid day/);
});

test('operations: bookmarks add idempotently and remove only the targeted one — removal PROPAGATES', async () => {
  const { db, repo } = world();
  assert.equal(await repo.addBookmark(bm('verse', 'bg-2-47')), true);
  assert.equal(await repo.addBookmark(bm('verse', 'bg-2-47')), true, 'adding twice is fine');
  assert.equal(await repo.addBookmark(bm('lesson', 'gita-ch1')), true);
  assert.equal(await repo.addBookmark(bm('verse', 'ghost')), false, 'unmappable returns false');
  assert.equal(db.mine('bookmarks').length, 2);
  await repo.removeBookmark('verse', 'bg-2-47');
  const left = (await repo.load()).bookmarks;
  assert.deepEqual(left.map((b) => b.id), ['gita-ch1'], 'only the removed one is gone');
  await repo.removeBookmark('verse', 'ghost');           // no-op, no throw
});

test('syncOnSignIn: merges this browser with the account, saves the union, loses nothing from either side', async () => {
  const { db, repo } = world();
  // Account already has progress from another device.
  await repo.save({ ...empty(), days: ['2026-03-01'], lessons: { 'gita-ch1': { completedAt: 8000, quiz: { best: 4, total: 4, last: 4, at: 8100 } }, 'gita-ch2': { completedAt: 9000 } }, bookmarks: [bm('verse', 'bg-2-47', 500)] });
  // This browser has different progress, including a WORSE score for ch1 and an earlier completion.
  const local: LearningState = { ...empty(), days: ['2026-03-02'], lessons: { 'gita-ch1': { completedAt: 7000, quiz: { best: 1, total: 4, last: 1, at: 9999 } }, 'verse-2-47': { completedAt: 7500 } },
    bookmarks: [bm('darshana', 'samkhya', 600), bm('verse', 'bg-2-47', 400)] };
  const { state, result } = await syncOnSignIn(local, repo);
  assert.equal(state.lessons['gita-ch1'].completedAt, 7000, 'earliest completion');
  assert.equal(state.lessons['gita-ch1'].quiz!.best, 4, 'the account’s better score survives the browser’s worse one');
  assert.ok(state.lessons['gita-ch2'] && state.lessons['verse-2-47'], 'lessons from both sides are present');
  assert.deepEqual(state.days, ['2026-03-01', '2026-03-02']);
  assert.equal(state.bookmarks.length, 2, 'duplicate bookmark collapsed');
  assert.deepEqual(result.skipped, []);
  const after = await repo.load();
  assert.deepEqual(Object.keys(after.lessons).sort(), ['gita-ch1', 'gita-ch2', 'verse-2-47']);
  assert.equal(after.lessons['gita-ch1'].quiz!.best, 4);
  assert.equal(db.mine('bookmarks').length, 2, 'no duplicate rows in the database');
  // A second sign-in on another device (re-sync) changes nothing.
  const again = await syncOnSignIn(after, repo);
  assert.equal(JSON.stringify(again.state.lessons), JSON.stringify(after.lessons));
  assert.equal(db.mine('bookmarks').length, 2);
});

test('syncOnSignIn enforces the 500-bookmark cap BEFORE writing, keeping the newest', async () => {
  const { db, repo } = world();
  db.seed('lessons', Array.from({ length: 600 }, (_, i) => ({ id: uid(1000 + i), slug: `cap-${i}`, title: `Cap ${i}` })));
  const many = Array.from({ length: 600 }, (_, i) => bm('lesson', `cap-${i}`, 1_000_000 + i));
  const { state, result } = await syncOnSignIn({ ...empty(), bookmarks: many }, repo);
  assert.equal(state.bookmarks.length, 500, 'merged state is capped');
  assert.equal(db.mine('bookmarks').length, 500, 'exactly 500 rows written (the database trigger would reject more)');
  const kept = new Set(db.mine('bookmarks').map((r) => r.lesson_id));
  assert.ok(kept.has(uid(1000 + 599)) && !kept.has(uid(1000 + 99)), 'the newest are kept, the 100 oldest dropped');
  assert.deepEqual(result.skipped, []);
});

test('save() applies the cap itself (not only via syncOnSignIn), so the database cap is never hit', async () => {
  const { db, repo } = world();
  db.seed('lessons', Array.from({ length: 600 }, (_, i) => ({ id: uid(1000 + i), slug: `cap-${i}`, title: `Cap ${i}` })));
  await repo.save({ ...empty(), bookmarks: Array.from({ length: 600 }, (_, i) => bm('lesson', `cap-${i}`, 1_000_000 + i)) });
  assert.equal(db.mine('bookmarks').length, 500);
  // and the fake really does reject the 501st, like the database trigger does
  const over = db.client().from('bookmarks').insert([{ user_id: ME, lesson_id: uid(100) }]);
  assert.match(String((await over).error?.message), /limit reached/);
});

test('unmappable bookmarks in bulk are reported, not written', async () => {
  const { db, repo } = world();
  const many = Array.from({ length: 40 }, (_, i) => bm('lesson', `x${i}`, i));
  const { result } = await syncOnSignIn({ ...empty(), bookmarks: [...many, bm('verse', 'bg-2-47', 99999)] }, repo);
  assert.equal(db.mine('bookmarks').length, 1);
  assert.equal(result.skipped.length, 40);
});
