import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStreak, dayNumber, localDate, sanitize } from '../lib/learning/store';

test('localDate formats the LOCAL calendar day as YYYY-MM-DD', () => {
  assert.equal(localDate(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  assert.equal(localDate(new Date(2026, 11, 31, 0, 0)), '2026-12-31');
  assert.match(localDate(), /^\d{4}-\d{2}-\d{2}$/);
});

test('computeStreak: consecutive days ending today or yesterday', () => {
  const t = '2026-03-10';
  assert.equal(computeStreak([], t), 0);
  assert.equal(computeStreak(['2026-03-10'], t), 1);
  assert.equal(computeStreak(['2026-03-08', '2026-03-09', '2026-03-10'], t), 3);
  assert.equal(computeStreak(['2026-03-08', '2026-03-09'], t), 2, 'ends yesterday: still alive');
  assert.equal(computeStreak(['2026-03-07', '2026-03-08'], t), 0, 'last study 2 days ago: broken');
  assert.equal(computeStreak(['2026-03-05', '2026-03-07', '2026-03-08', '2026-03-09', '2026-03-10'], t), 4, 'a gap ends the count');
});
test('computeStreak is correct across month, year and leap-day boundaries', () => {
  assert.equal(computeStreak(['2026-02-27', '2026-02-28', '2026-03-01'], '2026-03-01'), 3);
  assert.equal(computeStreak(['2025-12-30', '2025-12-31', '2026-01-01'], '2026-01-01'), 3);
  assert.equal(computeStreak(['2024-02-28', '2024-02-29', '2024-03-01'], '2024-03-01'), 3, 'leap day');
  assert.equal(computeStreak(['2025-02-28', '2025-03-01'], '2025-03-01'), 2, 'no leap day in 2025');
});
test('computeStreak is not fooled by duplicates or unsorted input', () => {
  assert.equal(computeStreak(['2026-03-10', '2026-03-09', '2026-03-10', '2026-03-09'], '2026-03-10'), 2);
});
test('dayNumber is DST-proof (uses UTC day arithmetic, not 24h offsets)', () => {
  assert.equal(dayNumber('2026-03-30') - dayNumber('2026-03-29'), 1);
  assert.equal(dayNumber('2026-11-02') - dayNumber('2026-11-01'), 1);
});

const valid = { version: 1, lessons: { a: { completedAt: 5, quiz: { best: 3, total: 4, last: 2, at: 9 } } },
  bookmarks: [{ id: 'x', kind: 'verse', title: 'T', href: '/gita/bhagavad-gita/2/47', addedAt: 1 }],
  recent: [{ href: '/a', title: 'A', kind: 'Verse', at: 1 }], days: ['2026-01-01'], daily: { date: '2026-01-01', id: 'gita-ch1' } };

test('sanitize accepts a valid state unchanged', () => assert.deepEqual(sanitize(valid), valid));
test('sanitize survives garbage of every JSON type', () => {
  for (const g of [null, undefined, 0, 1, 'x', true, [], [1, 2], {}, { lessons: 5 }, { bookmarks: 'no' }, { days: { a: 1 } }]) {
    const s = sanitize(g as unknown); assert.equal(s.version, 1); assert.ok(Array.isArray(s.bookmarks) && Array.isArray(s.days) && typeof s.lessons === 'object');
  }
});
test('sanitize rejects unsafe or malformed links', () => {
  const bad = ['javascript:alert(1)', '//evil.example', 'https://evil.example', 'data:text/html,x', '', '/ok'.padEnd(400, 'x'), 'relative/path'];
  for (const href of bad) assert.equal(sanitize({ ...valid, bookmarks: [{ ...valid.bookmarks[0], href }] }).bookmarks.length, 0, href.slice(0, 30));
  assert.equal(sanitize({ ...valid, bookmarks: [{ ...valid.bookmarks[0], href: '/fine?x=1#y' }] }).bookmarks.length, 1);
  for (const href of bad) assert.equal(sanitize({ ...valid, recent: [{ ...valid.recent[0], href }] }).recent.length, 0, href.slice(0, 30));
});
test('sanitize rejects impossible quiz records and wrong types', () => {
  const q = (quiz: unknown) => sanitize({ lessons: { l: { quiz } } }).lessons.l;
  assert.equal(q({ best: 99, total: 4, last: 1, at: 1 }), undefined, 'best > total');
  assert.equal(q({ best: 2, total: 0, last: 0, at: 1 }), undefined, 'zero total');
  assert.equal(q({ best: -1, total: 4, last: 0, at: 1 }), undefined, 'negative');
  assert.equal(q({ best: 2, total: 4, last: 5, at: 1 }), undefined, 'last > total');
  assert.equal(q({ best: '3', total: 4, last: 1, at: 1 }), undefined, 'string number');
  assert.equal(q({ best: NaN, total: 4, last: 1, at: 1 }), undefined, 'NaN');
  assert.equal(q({ best: Infinity, total: 4, last: 1, at: 1 }), undefined, 'Infinity');
  assert.deepEqual(q({ best: 3, total: 4, last: 2, at: 1 }), { quiz: { best: 3, total: 4, last: 2, at: 1 } });
  assert.equal(sanitize({ lessons: { l: { completedAt: 'yesterday' } } }).lessons.l, undefined);
});
test('sanitize drops unknown bookmark kinds, duplicates and non-objects; caps the list', () => {
  const b = (id: string, kind = 'verse') => ({ id, kind, title: 'T', href: '/x', addedAt: 1 });
  assert.equal(sanitize({ bookmarks: [b('a', 'hacker'), b('a'), b('a'), 'str', null, 5] }).bookmarks.length, 1);
  assert.equal(sanitize({ bookmarks: Array.from({ length: 900 }, (_, i) => b(`id${i}`)) }).bookmarks.length, 500);
});
test('sanitize: days must be real YYYY-MM-DD strings; deduplicated and sorted; daily validated', () => {
  assert.deepEqual(sanitize({ days: ['2026-02-02', 'banana', 5, '2026-01-01', '2026-02-02', '2026-1-1'] }).days, ['2026-01-01', '2026-02-02']);
  assert.equal(sanitize({ daily: { date: 'nope', id: 'x' } }).daily, undefined);
  assert.equal(sanitize({ daily: { date: '2026-01-01', id: '' } }).daily, undefined);
});
test('sanitize: huge strings are rejected, not stored', () => {
  assert.equal(sanitize({ bookmarks: [{ ...valid.bookmarks[0], title: 'x'.repeat(10_000) }] }).bookmarks.length, 0);
  assert.equal(Object.keys(sanitize({ lessons: { ['k'.repeat(500)]: { completedAt: 1 } } }).lessons).length, 0);
});
test('sanitize does not let __proto__/constructor keys poison the result', () => {
  const s = sanitize(JSON.parse('{"lessons":{"__proto__":{"completedAt":1},"constructor":{"completedAt":2},"prototype":{"completedAt":3},"real":{"completedAt":4}}}'));
  assert.equal(({} as Record<string, unknown>).completedAt, undefined, 'Object.prototype untouched');
  assert.equal(Object.getPrototypeOf(s.lessons), Object.prototype, 'the lessons map keeps a normal prototype');
  assert.equal('completedAt' in s.lessons, false, 'no value leaks in through the prototype chain');
  assert.deepEqual(Object.keys(s.lessons), ['real'], 'only the legitimate key survives');
  const m = sanitize(JSON.parse('{"bookmarks":[{"id":"__proto__","kind":"verse","title":"T","href":"/x","addedAt":1}]}'));
  assert.ok(m.bookmarks.length <= 1);
});
test('sanitize is idempotent', () => assert.deepEqual(sanitize(sanitize(valid)), sanitize(valid)));
