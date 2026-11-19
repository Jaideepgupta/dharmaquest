-- The database itself must reject data that breaks the content rules (not only the UI).
\i supabase/tests/helpers.sql
begin;

-- Fixtures
select set_config('dq.skip_audit', 'on', true);
insert into public.content_sources (slug, kind, title, license) values
  ('t-translation', 'translation', 'Test translation', 'public_domain'),
  ('t-editorial',   'editorial',   'Test editorial',   'editorial'),
  ('t-commentary',  'commentary',  'Test commentary',  'public_domain'),
  ('t-primary',     'primary_text','Test primary',     'public_domain');

create function t.sid(s text) returns uuid language sql as $$ select id from public.content_sources where slug = s $$;
create function t.scr(s text) returns uuid language sql as $$ select id from public.scriptures where slug = s $$;
create function t.verse() returns uuid language sql as $$ select id from public.verses where label = '2.47' $$;

-- ---- Verses ----
select t.expect_error($$insert into public.verses (scripture_id, label) values (t.scr('rigveda'), 'x.1')$$, 'a verse without a source is rejected', '23514');
select t.expect_error(format($$insert into public.verses (scripture_id, label, source_id) values (%L, 'x.2', %L)$$, t.scr('rigveda'), t.sid('t-translation')),
  'a verse cannot cite a translation as its source', '23514');
select t.expect_error(format($$insert into public.verses (scripture_id, label, source_id, status) values (%L, 'x.3', %L, 'published')$$, t.scr('rigveda'), t.sid('t-primary')),
  'a published verse needs Sanskrit text', '23514');
select t.expect_error(format($$insert into public.verses (scripture_id, label, source_id, transliteration) values (%L, 'x.4', %L, array['abc'])$$, t.scr('rigveda'), t.sid('t-primary')),
  'transliteration needs a named scheme', '23514');
select t.expect_ok(format($$insert into public.verses (scripture_id, label, source_id, sanskrit, status) values (%L, 'x.5', %L, array['ॐ'], 'published')$$, t.scr('rigveda'), t.sid('t-primary')),
  'a verse on a scripture with NO chapters is allowed (flat structure)');
select t.expect_error(format($$insert into public.verses (scripture_id, label, source_id) values (%L, '2.47', %L)$$, t.scr('bhagavad-gita'), t.sid('t-primary')),
  'duplicate verse label within a scripture is rejected', '23505');
select t.expect_error(format($$insert into public.verses (scripture_id, chapter_id, label, source_id) values (%L, (select id from public.chapters where slug = 'bala-kanda'), 'y.1', %L)$$, t.scr('bhagavad-gita'), t.sid('t-primary')),
  'a verse cannot sit in a chapter of a DIFFERENT scripture (composite key)', '23503');

-- ---- Structure ----
select t.expect_error(format($$insert into public.chapters (scripture_id, number, slug, name) values (%L, 1, 'c1', 'Chapter')$$, t.scr('rigveda')),
  'chapters cannot be added to a scripture declared flat/none', '23514');
select t.expect_error($$update public.scriptures set chapter_count = 5 where slug = 'rigveda'$$, 'a chapter count cannot be set on a flat scripture', '23514');
select t.expect_error($$update public.scriptures set structure_kind = 'chaptered', chapter_count = -1 where slug = 'rigveda'$$, 'negative chapter counts are rejected', '23514');
select t.expect_error($$update public.scriptures set parent_scripture_id = id where slug = 'rigveda'$$, 'a scripture cannot be its own parent', '23514');
select t.expect_error($$insert into public.scriptures (slug, tradition_id, title, parent_scripture_id)
  values ('x-islam-text', (select id from public.traditions where slug = 'islam'), 'X', (select id from public.scriptures where slug = 'bhagavad-gita'))$$,
  'a scripture cannot be embedded in a text of ANOTHER tradition', '23503');
select t.expect_error($$insert into public.scriptures (slug, tradition_id, title, category_id)
  values ('x-islam-text2', (select id from public.traditions where slug = 'islam'), 'X', (select id from public.scripture_categories where slug = 'vedas'))$$,
  'a scripture cannot use ANOTHER tradition''s category', '23503');
select t.expect_error($$insert into public.scriptures (slug, tradition_id, title) values ('Bad Slug', (select id from public.traditions where slug = 'islam'), 'X')$$, 'slugs must be lowercase url-safe', '23514');

-- ---- Translations ----
select t.expect_error(format($$insert into public.verse_translations (verse_id, language, body, translator, source_id, license, status)
  values (%L, 'en', 'text', null, %L, 'public_domain', 'published')$$, t.verse(), t.sid('t-translation')),
  'a published translation must name its translator', '23514');
select t.expect_error(format($$insert into public.verse_translations (verse_id, language, body, translator, source_id, status)
  values (%L, 'en', 'text', 'Someone', %L, 'published')$$, t.verse(), t.sid('t-translation')),
  'a published translation must have a known licence (unknown is rejected)', '23514');
select t.expect_error(format($$insert into public.verse_translations (verse_id, language, body, translator, source_id, license, status)
  values (%L, 'en', '   ', 'Someone', %L, 'public_domain', 'published')$$, t.verse(), t.sid('t-translation')),
  'a published translation cannot be blank', '23514');
select t.expect_error(format($$insert into public.verse_translations (verse_id, language, body, translator, source_id, license)
  values (%L, 'en', 'text', 'Someone', %L, 'public_domain')$$, t.verse(), t.sid('t-editorial')),
  'editorial text cannot be filed as a translation', '23514');
select t.expect_error(format($$insert into public.verse_translations (verse_id, language, source_id) values (%L, 'English', %L)$$, t.verse(), t.sid('t-translation')),
  'language must be a language code', '23514');
select t.expect_ok(format($$insert into public.verse_translations (verse_id, language, body, translator, source_id, license, status)
  values (%L, 'en', 'A complete, attributed translation', 'Test Translator', %L, 'public_domain', 'published')$$, t.verse(), t.sid('t-translation')),
  'a complete, attributed, licensed translation IS accepted');
select t.expect_ok(format($$insert into public.verse_translations (verse_id, language, source_id) values (%L, 'hi', %L)$$, t.verse(), t.sid('t-translation')),
  'an unfinished draft translation may exist (not public)');

-- ---- Commentary ----
select t.expect_error(format($$insert into public.commentaries (work_title, source_id) values ('W', %L)$$, t.sid('t-commentary')), 'a commentary must target something', '23514');
select t.expect_error(format($$insert into public.commentaries (work_title, source_id, verse_id, scripture_id) values ('W', %L, %L, %L)$$, t.sid('t-commentary'), t.verse(), t.scr('bhagavad-gita')),
  'a commentary targets exactly one thing', '23514');
select t.expect_error(format($$insert into public.commentaries (work_title, source_id, verse_id, excerpt, license, status) values ('W', %L, %L, 'text', 'public_domain', 'published')$$, t.sid('t-commentary'), t.verse()),
  'a published commentary must be attributed to a commentator', '23514');
select t.expect_error(format($$insert into public.commentaries (work_title, source_id, verse_id) values ('W', %L, %L)$$, t.sid('t-editorial'), t.verse()),
  'editorial text cannot be filed as traditional commentary', '23514');

-- ---- Explanations / editorial ----
select t.expect_error(format($$insert into public.verse_explanations (verse_id, kind, body) values (%L, 'brief_summary', 'again')$$, t.verse()), 'one explanation per kind per verse', '23505');
select t.expect_error(format($$insert into public.verse_explanations (verse_id, kind, body) values (%L, 'context', '  ')$$, t.verse()), 'explanations cannot be blank', '23514');
select t.expect_error(format($$insert into public.verse_words (verse_id, position, word, gloss, origin) values (%L, 99, 'w', 'g', 'someone-else')$$, t.verse()), 'word gloss origin must be editorial or contributor', '23514');

-- ---- Sources ----
select t.expect_error($$insert into public.content_sources (slug, kind, title, verified) values ('t-bad1', 'primary_text', 'T', true)$$, 'verified sources need a verification date', '23514');
select t.expect_error($$insert into public.content_sources (slug, kind, title, license, verified, verified_on) values ('t-bad2', 'primary_text', 'T', 'unknown', true, current_date)$$, 'an unknown licence cannot be marked verified', '23514');
select t.expect_error($$insert into public.content_sources (slug, kind, title, url) values ('t-bad3', 'primary_text', 'T', 'javascript:alert(1)')$$, 'source URLs must be http(s)', '23514');
select t.expect_error($$delete from public.content_sources where slug = 'bg-sanskrit-standard'$$, 'a source that is still cited cannot be deleted', '23503');

-- ---- Darshanas ----
select t.expect_error($$insert into public.darshanas (slug, tradition_id, kind, name) values ('t-orphan', (select id from public.traditions where slug = 'sanatan-dharma'), 'sub_school', 'Orphan')$$,
  'a sub-school must have a parent', '23514');
select t.expect_error($$insert into public.darshanas (slug, tradition_id, kind, name, parent_id) values ('t-child', (select id from public.traditions where slug = 'sanatan-dharma'), 'darshana', 'Child', (select id from public.darshanas where slug = 'vedanta'))$$,
  'a darshana cannot have a parent', '23514');
select t.expect_error($$insert into public.darshanas (slug, tradition_id, kind, name, parent_id) values ('t-grand', (select id from public.traditions where slug = 'sanatan-dharma'), 'sub_school', 'Grand', (select id from public.darshanas where slug = 'advaita'))$$,
  'a sub-school cannot sit under another sub-school', '23514');
select t.expect_error($$insert into public.darshanas (slug, tradition_id, kind, number, name) values ('t-seventh', (select id from public.traditions where slug = 'sanatan-dharma'), 'darshana', 3, 'Another third')$$,
  'two darshanas cannot share a number', '23505');
select t.expect_error($$insert into public.comparison_cells (darshana_id, dimension_id, body)
  values ((select id from public.darshanas where slug = 'advaita'), (select id from public.comparison_dimensions where set_kind = 'darshana' and slug = 'reality'), 'cross-set')$$,
  'a sub-school cannot use a Darshana comparison dimension', '23514');

-- ---- Quiz shape ----
select t.expect_ok($$insert into public.lessons (slug, title, level, collection, sections, minutes) values ('t-lesson', 'T', 'beginner', 'T', '[]', 3)$$, 'fixture lesson');
select t.expect_ok($$insert into public.quizzes (slug, lesson_id, title) values ('t-quiz', (select id from public.lessons where slug = 't-lesson'), 'T')$$, 'fixture quiz');
create function t.qq(k text, opts text, ans text, prs text, expl text default 'because') returns text language sql as $$
  select format('insert into public.quiz_questions (quiz_id, position, kind, prompt, options, answer, pairs, explanation) values ((select id from public.quizzes where slug = ''t-quiz''), (select coalesce(max(position),0)+1 from public.quiz_questions where quiz_id = (select id from public.quizzes where slug = ''t-quiz'')), %L::public.question_kind, ''Q?'', %s, %s, %s, %L)', k, coalesce(opts, 'null'), coalesce(ans, 'null'), coalesce(prs, 'null'), expl) $$;
select t.expect_ok(t.qq('mcq', $$'["a","b","c"]'::jsonb$$, $$'1'::jsonb$$, null), 'a well-formed multiple-choice question is accepted');
select t.expect_ok(t.qq('tf', null, $$'true'::jsonb$$, null), 'a well-formed true/false question is accepted');
select t.expect_ok(t.qq('match', null, null, $$'[{"left":"a","right":"b"},{"left":"c","right":"d"}]'::jsonb$$), 'a well-formed match question is accepted');
select t.expect_error(t.qq('mcq', $$'["a","b"]'::jsonb$$, $$'2'::jsonb$$, null), 'MCQ answer index out of range is rejected', '23514');
select t.expect_error(t.qq('mcq', $$'["a","b"]'::jsonb$$, $$'"x"'::jsonb$$, null), 'MCQ answer of the wrong type is rejected cleanly (no cast error)', '23514');
select t.expect_error(t.qq('mcq', $$'["a","b"]'::jsonb$$, $$'-1'::jsonb$$, null), 'negative MCQ answer is rejected', '23514');
select t.expect_error(t.qq('mcq', $$'["a"]'::jsonb$$, $$'0'::jsonb$$, null), 'an MCQ needs at least two options', '23514');
select t.expect_error(t.qq('mcq', $$'{"a":1}'::jsonb$$, $$'0'::jsonb$$, null), 'MCQ options must be an array', '23514');
select t.expect_error(t.qq('tf', $$'["a","b"]'::jsonb$$, $$'true'::jsonb$$, null), 'a true/false question has no options', '23514');
select t.expect_error(t.qq('tf', null, $$'1'::jsonb$$, null), 'a true/false answer must be boolean', '23514');
select t.expect_error(t.qq('match', null, null, $$'[{"left":"a","right":"b"}]'::jsonb$$), 'a match question needs at least two pairs', '23514');
select t.expect_error(t.qq('mcq', $$'["a","b"]'::jsonb$$, $$'0'::jsonb$$, null, '   '), 'every question needs a non-blank explanation', '23514');
select t.expect_error($$insert into public.quiz_questions (quiz_id, position, kind, prompt, explanation) values ((select id from public.quizzes where slug = 't-quiz'), 50, 'tf', 'Q?', 'x')$$, 'a question with no answer data is rejected', '23514');

-- ---- User data ----
select t.expect_ok($$insert into auth.users (id, email) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a@example.test')$$, 'create a user');
select t.assert(exists (select 1 from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 'a profile row is created automatically for each new user');
select t.expect_ok($$insert into auth.users (id, email) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b@example.test')$$, 'create a second user');

select t.expect_error($$insert into public.bookmarks (user_id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')$$, 'a bookmark with no target is rejected', '23514');
select t.expect_error($$insert into public.bookmarks (user_id, verse_id, lesson_id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', t.verse(), (select id from public.lessons limit 1))$$, 'a bookmark with two targets is rejected', '23514');
select t.expect_ok($$insert into public.bookmarks (user_id, verse_id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', t.verse())$$, 'a valid verse bookmark is accepted');
select t.expect_error($$insert into public.bookmarks (user_id, verse_id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', t.verse())$$, 'the same item cannot be bookmarked twice', '23505');
select t.expect_ok($$insert into public.bookmarks (user_id, verse_id) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', t.verse())$$, 'a different user can bookmark the same item');
select t.expect_error($$insert into public.bookmarks (user_id, verse_id) values ('cccccccc-cccc-cccc-cccc-cccccccccccc', t.verse())$$, 'a bookmark needs a real user (foreign key)', '23503');
select t.expect_ok($$insert into public.bookmarks (user_id, category_id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (select id from public.scripture_categories where slug = 'upanishads'))$$, 'a collection page (category) can be bookmarked');
select t.expect_error($$insert into public.bookmarks (user_id, category_id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (select id from public.scripture_categories where slug = 'upanishads'))$$, 'the same collection cannot be bookmarked twice', '23505');
select t.expect_error($$insert into public.bookmarks (user_id, category_id, darshana_id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (select id from public.scripture_categories where slug = 'vedas'), (select id from public.darshanas limit 1))$$, 'a category plus another target is rejected (exactly one)', '23514');
select t.expect_error($$insert into public.bookmarks (user_id, lesson_id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', gen_random_uuid())$$, 'a bookmark must point at something that exists', '23503');

-- bookmark cap (500): create enough distinct targets inside this rolled-back transaction
do $$
declare i int;
begin
  insert into public.lessons (slug, title, level, collection, sections, minutes)
  select 'cap-' || g, 'Cap ' || g, 'beginner', 'cap', '[]', 3 from generate_series(1, 520) g;
  insert into public.bookmarks (user_id, lesson_id)
  select 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', id from (select id from public.lessons where slug like 'cap-%' and slug <> 'cap-520' order by slug limit 499) x;
  begin
    insert into public.bookmarks (user_id, lesson_id) select 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', id from public.lessons where slug = 'cap-520';
    raise exception 'TEST FAILED: bookmark 501 was accepted';
  exception when check_violation then
    raise notice 'ok   - a user cannot exceed 500 bookmarks';
  end;
end $$;

select t.expect_error($$insert into public.user_progress (user_id, lesson_id, quiz_best, quiz_total, quiz_last, quiz_at) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (select id from public.lessons where slug = 't-lesson'), 9, 4, 4, now())$$, 'a best score above the total is rejected', '23514');
select t.expect_error($$insert into public.user_progress (user_id, lesson_id, quiz_best, quiz_total, quiz_last, quiz_at) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (select id from public.lessons where slug = 't-lesson'), 2, 4, 3, now())$$, 'last score above best is rejected', '23514');
select t.expect_error($$insert into public.user_progress (user_id, lesson_id, quiz_best) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (select id from public.lessons where slug = 't-lesson'), 2)$$, 'quiz fields must be set together', '23514');
select t.expect_error($$insert into public.user_progress (user_id, lesson_id, quiz_best, quiz_total, quiz_last, quiz_at) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (select id from public.lessons where slug = 't-lesson'), -1, 4, 0, now())$$, 'negative scores are rejected', '23514');
select t.expect_ok($$insert into public.user_progress (user_id, lesson_id, completed_at, quiz_best, quiz_total, quiz_last, quiz_at) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (select id from public.lessons where slug = 't-lesson'), now(), 4, 4, 3, now())$$, 'a valid progress row is accepted');
select t.expect_error($$insert into public.user_progress (user_id, lesson_id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (select id from public.lessons where slug = 't-lesson'))$$, 'one progress row per user and lesson', '23505');
select t.expect_error($$insert into public.user_study_days (user_id, day) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', date '1999-01-01')$$, 'implausible study days are rejected', '23514');
select t.expect_ok($$insert into public.user_study_days (user_id, day) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', current_date)$$, 'a study day is accepted');
select t.expect_error($$insert into public.user_study_days (user_id, day) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', current_date)$$, 'one row per user and day', '23505');

-- ---- Cascades ----
select t.assert((select count(*) from public.user_progress where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') = 1, 'progress exists before deleting the account');
delete from auth.users where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
select t.assert(not exists (select 1 from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
  and not exists (select 1 from public.user_progress where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
  and not exists (select 1 from public.bookmarks where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
  and not exists (select 1 from public.user_study_days where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'deleting an account erases ALL of that user''s data (right to erasure)');
select t.assert(exists (select 1 from public.bookmarks where user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 'other users'' data is untouched');
delete from public.scriptures where slug = 'bhagavad-gita';
select t.assert(not exists (select 1 from public.chapters c join public.verses v on v.chapter_id = c.id), 'deleting a scripture cascades to its chapters and verses');

-- ---- Timestamps & audit ----
select set_config('dq.skip_audit', 'off', true);
do $$
declare before_ts timestamptz;
begin
  select updated_at into before_ts from public.scriptures where slug = 'rigveda';
  perform pg_sleep(0.01);
  update public.scriptures set tagline = 'changed' where slug = 'rigveda';
  if (select updated_at from public.scriptures where slug = 'rigveda') <= before_ts then raise exception 'TEST FAILED: updated_at not bumped'; end if;
  raise notice 'ok   - updated_at is maintained automatically';
end $$;
select t.assert(exists (select 1 from public.audit_log where table_name = 'scriptures' and op = 'UPDATE' and old_row ->> 'tagline' is distinct from new_row ->> 'tagline'),
  'edits to content are written to the audit log with old and new values');

rollback;
