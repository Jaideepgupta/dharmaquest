-- The seed (generated from the site's real content) must satisfy the model's own invariants.
\i supabase/tests/helpers.sql
begin;

select t.assert((select count(*) from public.traditions) = 5, '5 traditions: Sanatan Dharma + 4 planned');
select t.assert((select count(*) from public.traditions where status = 'active') = 1, 'only Sanatan Dharma is active');
select t.assert(not exists (select 1 from public.scriptures s join public.traditions tr on tr.id = s.tradition_id where tr.status = 'planned'),
  'planned traditions contain no scriptures (no mixing, nothing invented)');

select t.assert((select count(*) from public.scripture_categories) = 9, '9 scripture categories');
select t.assert((select count(*) from public.scriptures) = 49, '49 scriptures (Gitas, Vedas, Upanishads, epics, Puranas, yoga texts)');
select t.assert((select count(*) from public.scriptures where slug like '%-upanishad') = 13, '13 principal Upanishads');
select t.assert((select count(*) from public.scriptures s join public.scripture_categories c on c.id = s.category_id where c.slug = 'puranas') = 18, '18 Mahapuranas');

-- Flexible structure: chapters exist only where the text supports them.
select t.assert((select count(*) from public.chapters c join public.scriptures s on s.id = c.scripture_id where s.slug = 'bhagavad-gita') = 18, 'Bhagavad Gita has 18 chapters');
select t.assert((select count(*) from public.chapters c join public.scriptures s on s.id = c.scripture_id where s.slug = 'ramayana' and c.unit_kind = 'kanda') = 7, 'Ramayana has 7 kandas');
select t.assert((select count(*) from public.chapters c join public.scriptures s on s.id = c.scripture_id where s.slug = 'mahabharata' and c.unit_kind = 'parva') = 18, 'Mahabharata has 18 parvas');
select t.assert(not exists (select 1 from public.chapters c join public.scriptures s on s.id = c.scripture_id where s.structure_kind not in ('chaptered','collection')),
  'no chapters on flat/none scriptures');
select t.assert((select count(*) from public.scriptures where structure_kind = 'none') > 30, 'most catalogue entries have no chapter structure and are not forced to');
select t.assert((select chapter_count from public.scriptures where slug = 'ashtavakra-gita') is null, 'unverified chapter counts are NULL, not guessed (Ashtavakra Gita)');
select t.assert((select verse_count from public.scriptures where slug = 'uddhava-gita') is null, 'unverified verse counts are NULL (Uddhava Gita)');

-- Bhagavad Gita counts: the traditional 700 vs. the 701 numbered verses of the common recension.
select t.assert((select verse_count from public.scriptures where slug = 'bhagavad-gita') = 700, 'BG traditional verse count is 700');
select t.assert((select sum(c.verse_count) from public.chapters c join public.scriptures s on s.id = c.scripture_id where s.slug = 'bhagavad-gita') = 701,
  'BG per-chapter counts sum to 701 (chapter 13 has the extra opening verse in the common recension), as documented');

-- Embedded texts keep their parent.
select t.assert((select p.slug from public.scriptures s join public.scriptures p on p.id = s.parent_scripture_id where s.slug = 'bhagavad-gita') = 'mahabharata', 'Bhagavad Gita sits within the Mahabharata');
select t.assert((select p.slug from public.scriptures s join public.scriptures p on p.id = s.parent_scripture_id where s.slug = 'uddhava-gita') = 'bhagavata-purana', 'Uddhava Gita sits within the Bhagavata Purana');

-- Source integrity
select t.assert(not exists (select 1 from public.verses where source_id is null), 'every verse has a source');
select t.assert((select count(*) from public.verses) = 1, 'exactly one verse (2.47): only sourced verses are present');
select t.assert((select count(*) from public.verse_translations) = 0, 'NO translations exist: none is invented before a named translator is added');
select t.assert((select count(*) from public.commentaries) = 0, 'NO commentaries exist: none is invented');
select t.assert((select count(*) from public.verse_words) = 12, '12 word glosses for 2.47');
select t.assert((select bool_and(origin = 'dharmaquest_editorial') from public.verse_words), 'word glosses are labelled editorial');
select t.assert((select count(*) from public.verse_explanations) = 4, '4 editorial explanations for 2.47');
select t.assert((select verified and license = 'public_domain' from public.content_sources where slug = 'bg-sanskrit-standard'), 'the Sanskrit source is verified, public domain');
select t.assert(not (select verified from public.content_sources where slug = 'gita-json-dataset'), 'the third-party dataset is NOT marked verified/usable');
select t.assert(not exists (select 1 from public.content_sources where license = 'unknown' and verified), 'no source with an unknown licence is marked verified');
select t.assert((select count(*) from public.content_sources where kind = 'scholarly_work') = 5, '5 further-reading works recorded as sources');

-- Darshanas: sub-schools are a different kind with a parent and are not counted as darshanas.
select t.assert((select count(*) from public.darshanas where kind = 'darshana') = 6, 'six classical Darshanas');
select t.assert((select count(*) from public.darshanas where kind = 'sub_school') = 6, 'six Vedanta sub-schools');
select t.assert(not exists (select 1 from public.darshanas d join public.darshanas p on p.id = d.parent_id where d.kind = 'sub_school' and p.slug <> 'vedanta'), 'every sub-school belongs to Vedanta');
select t.assert((select count(distinct number) from public.darshanas where kind = 'darshana') = 6, 'Darshanas are numbered 1 to 6');

-- Comparison: complete grid, no gaps.
select t.assert((select count(*) from public.comparison_cells) = 6*7 + 6*9, 'comparison grid is complete (6x7 + 6x9 = 96 cells)');
select t.assert(not exists (
  select 1 from public.darshanas d join public.comparison_dimensions cd on cd.set_kind = d.kind
  left join public.comparison_cells c on c.darshana_id = d.id and c.dimension_id = cd.id where c.darshana_id is null), 'no school is missing a comparison cell');
-- Name-list rows (teachers, thinkers) can be short. Every other cell must be an explanation.
-- KNOWN THIN CELL, tracked on purpose: Dvaitadvaita / sources ("Shruti is primary."). It is accurate but
-- sparse and needs a sourced expansion; do not pad it with unverified text. Any NEW thin cell fails here.
select t.assert(
  coalesce((select array_agg(d.slug || '/' || cd.slug order by d.slug, cd.slug)
              from public.comparison_cells c
              join public.darshanas d on d.id = c.darshana_id
              join public.comparison_dimensions cd on cd.id = c.dimension_id
             where length(btrim(c.body)) < 20 and cd.slug not in ('teachers', 'thinkers')), array[]::text[])
  = array['dvaitadvaita/knowledge'],
  'comparison cells are explanations; the only thin one is the tracked Dvaitadvaita/knowledge cell');

-- Lessons and quizzes
select t.assert((select count(*) from public.lessons) = 31, '31 lessons');
select t.assert((select count(*) from public.quizzes) = 16, '16 quizzes');
select t.assert((select count(*) from public.quiz_questions) = 60, '60 quiz questions');
select t.assert(not exists (select 1 from public.quiz_questions where btrim(explanation) = ''), 'every quiz question has an explanation');
select t.assert((select count(distinct kind) from public.quiz_questions) = 4, 'all four question types are used');
select t.assert(not exists (select 1 from public.lessons where exists (select 1 from jsonb_array_elements(read_more) r where r ->> 'href' not like '/%')), 'lesson links are site-relative');

-- Seeding must not have flooded the audit trail.
select t.assert((select count(*) from public.audit_log) = 0, 'seeding is not written to the audit log');

rollback;
