import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { quizzes, placeAnswers } from '../lib/learning/quizzes';
import { lessons } from '../lib/learning/lessons';
import { bhagavadGitaChapters, gitaTexts, verseStudies } from '../lib/content/gita';
import { darshanas } from '../lib/content/darshanas';
import { darshanaComparison, vedantaComparison, thinkers, relations } from '../lib/content/comparison';
import { categoryHref, scriptureCategories } from '../lib/content/scriptures';
import { buildSearchIndex } from '../lib/content/search';
import { seedSql } from '../scripts/export-seed';

/* ---------- quizzes ---------- */
test('every quiz question is well-formed and explained (mirrors the database rules)', () => {
  for (const z of quizzes) {
    assert.ok(z.questions.length >= 3, `${z.id} has at least 3 questions`);
    for (const q of z.questions) {
      assert.ok(q.prompt.trim().length > 5 && q.explanation.trim().length > 10, `${z.id}: prompt/explanation present`);
      if (q.type === 'match') {
        assert.ok(q.pairs.length >= 2 && q.pairs.length <= 8, `${z.id}: pair count`);
        assert.equal(new Set(q.pairs.map((p) => p.right)).size, q.pairs.length, `${z.id}: right-hand items are unique (else the match UI is ambiguous)`);
        assert.equal(new Set(q.pairs.map((p) => p.left)).size, q.pairs.length, `${z.id}: left-hand items are unique`);
      } else if (q.type === 'tf') {
        assert.equal(typeof q.answer, 'boolean');
      } else {
        assert.ok(q.options.length >= 2 && q.options.length <= 8, `${z.id}: option count`);
        assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, `${z.id}: answer index in range`);
        assert.equal(new Set(q.options).size, q.options.length, `${z.id}: no duplicate options in "${q.prompt}"`);
        assert.ok(q.options.every((o) => o.trim().length > 0), `${z.id}: no blank options`);
      }
    }
  }
});
test('quiz ids and lesson ids line up; ids are unique', () => {
  const lessonIds = new Set(lessons.map((l) => l.id));
  assert.equal(lessonIds.size, lessons.length, 'lesson ids unique');
  assert.equal(new Set(quizzes.map((z) => z.id)).size, quizzes.length, 'quiz ids unique');
  for (const z of quizzes) assert.ok(lessonIds.has(z.id), `quiz ${z.id} has a lesson`);
  assert.equal(lessons.filter((l) => l.quizId).length, quizzes.length, 'every quiz is attached to its lesson');
});
test('the correct answer is not guessable by position (all slots used, none dominant)', () => {
  const pos = [0, 0, 0, 0]; let n = 0;
  for (const z of quizzes) for (const q of z.questions) if (q.type === 'mcq' || q.type === 'teaching') { pos[q.answer]++; n++; }
  for (let i = 0; i < 4; i++) { assert.ok(pos[i] / n >= 0.15, `position ${i} is correct at least 15% of the time (${pos})`); assert.ok(pos[i] / n <= 0.4, `position ${i} is correct at most 40% of the time (${pos})`); }
});
test('placeAnswers keeps every option, keeps the correct option correct, and leaves ordered options alone', () => {
  const authored = [{ id: 't', title: 't', questions: [
    { type: 'mcq' as const, prompt: 'How many?', options: ['Two', 'Three', 'Four', 'Six'], answer: 2, explanation: 'because' },
    { type: 'mcq' as const, prompt: 'Who?', options: ['A one', 'B two', 'C three', 'D four'], answer: 0, explanation: 'because' },
    { type: 'mcq' as const, prompt: 'What?', options: ['W one', 'W two', 'W three', 'W four'], answer: 0, explanation: 'because' },
  ] }];
  const out = placeAnswers(authored)[0].questions;
  assert.deepEqual(out[0], authored[0].questions[0], 'number-word options untouched');
  for (let i = 1; i < 3; i++) {
    const a = authored[0].questions[i], b = out[i];
    if (a.type !== 'mcq' || b.type !== 'mcq') throw new Error('type');
    assert.deepEqual([...b.options].sort(), [...a.options].sort(), 'same options');
    assert.equal(b.options[b.answer], a.options[a.answer], 'the correct option is still the correct one');
  }
  assert.deepEqual(placeAnswers(authored), placeAnswers(authored), 'deterministic');
});

/* ---------- lessons ---------- */
test('lessons are complete and honest', () => {
  for (const l of lessons) {
    assert.ok(l.sections.length >= 2, `${l.id}: has sections`);
    assert.ok(l.sections.every((s) => s.heading && (s.paragraphs?.length || s.bullets?.length)), `${l.id}: no empty sections`);
    assert.ok(l.minutes >= 3 && l.minutes <= 30, `${l.id}: realistic duration`);
    assert.ok(l.summary.length > 10);
  }
  assert.equal(lessons.length, 31);
  assert.equal(lessons.filter((l) => l.level === 'beginner').length, 7);
});

/* ---------- every internal link must resolve to a real page ---------- */
function routes(): Set<string> {
  const r = new Set(['/', '/scriptures', '/gita', '/gita/bhagavad-gita', '/darshanas', '/darshanas/compare', '/learn', '/learn/lessons', '/progress', '/about']);
  const dedicated = ['darshanas', 'bhagavad-gita', 'other-gitas'];
  for (const c of scriptureCategories) if (!dedicated.includes(c.slug)) r.add(`/scriptures/${c.slug}`);
  for (const g of gitaTexts) if (g.slug !== 'bhagavad-gita') r.add(`/gita/${g.slug}`);
  for (const c of bhagavadGitaChapters) r.add(`/gita/bhagavad-gita/${c.number}`);
  for (const v of verseStudies) r.add(`/gita/bhagavad-gita/${v.chapter}/${v.verse}`);
  for (const d of darshanas) r.add(`/darshanas/${d.slug}`);
  for (const l of lessons) r.add(`/learn/lessons/${l.id}`);
  return r;
}
const bare = (href: string) => href.split('#')[0].split('?')[0] || '/';

test('all lesson links point at real pages', () => {
  const ok = routes();
  for (const l of lessons) for (const r of l.readMore) assert.ok(ok.has(bare(r.href)), `${l.id} -> ${r.href}`);
});
test('all search results point at real pages', () => {
  const ok = routes();
  const index = buildSearchIndex();
  assert.ok(index.length >= 100, `search index has ${index.length} entries`);
  for (const e of index) assert.ok(ok.has(bare(e.href)), `search "${e.title}" -> ${e.href}`);
});
test('all category, comparison and cross-reference links point at real pages', () => {
  const ok = routes();
  for (const c of scriptureCategories) {
    assert.ok(ok.has(bare(categoryHref(c.slug))), `category ${c.slug}`);
    for (const rel of c.related ?? []) assert.ok(ok.has(bare(rel.href)), `${c.slug} related -> ${rel.href}`);
  }
  for (const set of [darshanaComparison, vedantaComparison]) for (const e of set.entries) if (e.href) assert.ok(ok.has(bare(e.href)), `compare ${e.id}`);
  for (const k of Object.keys(thinkers)) assert.ok(darshanas.some((d) => d.slug === k), `thinkers key ${k} is a darshana`);
  for (const k of Object.keys(relations)) assert.ok(darshanas.some((d) => d.slug === k), `relations key ${k} is a darshana`);
  for (const l of verseStudies.flatMap((v) => v.detailed.related)) if (l.href) assert.ok(ok.has(bare(l.href)), `related verse ${l.ref}`);
});
test('search index has no duplicate (kind, title, href) rows', () => {
  const seen = new Set<string>();
  for (const e of buildSearchIndex()) { const k = `${e.kind}|${e.title}|${e.href}`; assert.ok(!seen.has(k), `duplicate ${k}`); seen.add(k); }
});

/* ---------- Bhagavad Gita data integrity ---------- */
const COUNTS = [47, 72, 43, 42, 29, 47, 30, 28, 34, 42, 55, 20, 35, 27, 20, 24, 28, 78]; // checked against a public-domain Sanskrit text
test('Bhagavad Gita chapters: 18, with verified verse counts', () => {
  assert.equal(bhagavadGitaChapters.length, 18);
  bhagavadGitaChapters.forEach((c, i) => { assert.equal(c.number, i + 1); assert.equal(c.verseCount, COUNTS[i], `chapter ${c.number} verse count`); });
  assert.equal(COUNTS.reduce((a, b) => a + b, 0), 701, 'common recension; the traditional count is 700 (chapter 13 has an extra opening verse)');
});
test('every cited verse reference falls inside its chapter', () => {
  for (const c of bhagavadGitaChapters) for (const v of c.importantVerses) {
    const [ch, vs] = v.ref.split('.').map(Number);
    assert.equal(ch, c.number, `${v.ref} cited in chapter ${c.number}`);
    assert.ok(vs >= 1 && vs <= COUNTS[c.number - 1], `${v.ref} within ${COUNTS[c.number - 1]} verses`);
    assert.ok(v.topic.trim().length > 8);
  }
  assert.equal(bhagavadGitaChapters.flatMap((c) => c.importantVerses).length, 51, 'all 51 cited verses were checked against a public-domain Sanskrit text');
});

/* ---------- source-integrity guards for verse content ---------- */
test('verse studies: sourced, and no translation without a named translator', () => {
  for (const v of verseStudies) {
    assert.ok(v.sanskrit.length >= 1 && v.sourceLines.length >= 1 && v.provenance.length >= 1, `${v.reference}: source and provenance`);
    assert.ok(v.words.length >= 1 && v.wordsNote.length > 20, 'word gloss is labelled');
    for (const t of [v.hindi, v.english]) {
      if (t.text) { assert.ok(t.translator && t.translator.trim(), `${v.reference}: a translation needs a translator`); assert.equal(t.status, 'published'); }
      else assert.equal(t.status, 'under-review', 'absent translations are marked under review');
    }
  }
});
test('catalogue facts are not invented: unverified counts stay null for Gitas other than the Bhagavad Gita', () => {
  for (const g of gitaTexts) if (g.slug !== 'bhagavad-gita') { assert.equal(g.chapters, null, g.slug); assert.equal(g.verses, null, g.slug); assert.equal(g.detailStatus, 'under-review'); }
});

/* ---------- comparison ---------- */
test('comparison grids are complete', () => {
  for (const set of [darshanaComparison, vedantaComparison]) for (const e of set.entries) for (const d of set.dimensions) {
    assert.ok((e.cells[d.id] ?? '').trim().length > 0, `${set.id}: ${e.id}/${d.id}`);
  }
  assert.equal(darshanaComparison.entries.length, 6);
  assert.equal(vedantaComparison.entries.length, 6);
});

/* ---------- the generated seed must match the content ---------- */
test('supabase/seed.sql is up to date with the content (run: npm run db:seed)', () => {
  const onDisk = readFileSync(join(__dirname, '..', 'supabase', 'seed.sql'), 'utf8');
  assert.equal(onDisk, seedSql, 'seed.sql is stale: run `npm run db:seed` and commit the result');
});
test('seed SQL escapes quotes safely and contains no stray template markers', () => {
  assert.ok(!/undefined|\[object Object\]|NaN/.test(seedSql), 'no leaked JS values');
  assert.ok(seedSql.startsWith('-- GENERATED'));
  assert.ok(seedSql.includes("set local dq.skip_audit = 'on'"));
});
