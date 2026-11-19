-- Row-level security and grants, tested as the real API roles.
\i supabase/tests/helpers.sql
begin;

-- ===================== fixtures (as superuser) =====================
select set_config('dq.skip_audit', 'on', true);
insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a@example.test'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b@example.test'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'editor@example.test');
insert into public.editors (user_id) values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');

insert into public.content_sources (slug, kind, title, license) values ('t-translation', 'translation', 'T', 'public_domain'), ('t-primary', 'primary_text', 'P', 'public_domain');
create function t.sid(s text) returns uuid language sql as $$ select id from public.content_sources where slug = s $$;

-- Draft content that the public must never see
insert into public.scriptures (slug, tradition_id, title, status) values ('zz-draft-scripture', (select id from public.traditions where slug = 'sanatan-dharma'), 'Draft', 'draft');
insert into public.verses (scripture_id, label, source_id, sanskrit, status)
  values ((select id from public.scriptures where slug = 'rigveda'), 'draft.1', t.sid('t-primary'), array['x'], 'draft');
insert into public.verse_translations (verse_id, language, body, translator, source_id, license, status) values
  ((select id from public.verses where label = '2.47'), 'en', 'Published translation', 'T. Translator', t.sid('t-translation'), 'public_domain', 'published'),
  ((select id from public.verses where label = '2.47'), 'hi', null, null, t.sid('t-translation'), 'unknown', 'draft'),
  ((select id from public.verses where label = 'draft.1'), 'en', 'Translation of a draft verse', 'T. Translator', t.sid('t-translation'), 'public_domain', 'published');
insert into public.darshanas (slug, tradition_id, name, status, number) values ('zz-draft-darshana', (select id from public.traditions where slug = 'sanatan-dharma'), 'Draft school', 'draft', 7);
insert into public.comparison_cells (darshana_id, dimension_id, body, status)
  values ((select id from public.darshanas where slug = 'zz-draft-darshana'), (select id from public.comparison_dimensions where set_kind = 'darshana' and slug = 'reality'), 'Draft cell body text here', 'published');
insert into public.lessons (slug, title, level, collection, sections, minutes, status) values ('zz-draft-lesson', 'D', 'beginner', 'x', '[]', 3, 'draft');
insert into public.quizzes (slug, lesson_id, title, status) values ('zz-draft-quiz', (select id from public.lessons where slug = 'zz-draft-lesson'), 'D', 'draft');
insert into public.quiz_questions (quiz_id, position, kind, prompt, answer, explanation) values ((select id from public.quizzes where slug = 'zz-draft-quiz'), 1, 'tf', 'Secret?', 'true', 'e');

-- User data for A and B
insert into public.user_progress (user_id, lesson_id, completed_at) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (select id from public.lessons where slug = 'gita-overview'), now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (select id from public.lessons where slug = 'gita-overview'), now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (select id from public.lessons where slug = 'gita-ch1'), now());
insert into public.bookmarks (user_id, verse_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (select id from public.verses where label = '2.47')),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (select id from public.verses where label = '2.47'));
insert into public.user_study_days (user_id, day) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', current_date);
select set_config('dq.skip_audit', 'off', true);

-- ===================== hardening =====================
create table public.zz_future_table (id int);
select t.assert(not has_table_privilege('anon', 'public.zz_future_table', 'select') and not has_table_privilege('authenticated', 'public.zz_future_table', 'select'),
  'tables created in future are NOT exposed to API roles by default');
select t.assert(not has_function_privilege('anon', 'public.audit_row()', 'execute') and not has_function_privilege('authenticated', 'public.handle_new_user()', 'execute'),
  'internal trigger functions are not callable by API roles');

-- ===================== anon (not signed in) =====================
set local role anon;
select t.assert((select count(*) from public.scriptures where slug = 'bhagavad-gita') = 1, 'anon can read a published scripture');
select t.assert((select count(*) from public.scriptures where status <> 'published') = 0 and (select count(*) from public.scriptures where slug = 'zz-draft-scripture') = 0, 'anon cannot see draft scriptures');
select t.assert((select count(*) from public.verses where label = '2.47') = 1 and (select count(*) from public.verses where label = 'draft.1') = 0, 'anon sees the published verse, not the draft one');
select t.assert((select count(*) from public.verse_translations where language = 'en' and body = 'Published translation') = 1, 'anon sees a published translation of a published verse');
select t.assert((select count(*) from public.verse_translations where language = 'hi') = 0, 'anon does NOT see a draft translation of a published verse');
select t.assert((select count(*) from public.verse_translations where body = 'Translation of a draft verse') = 0, 'anon does NOT see a translation whose verse is a draft');
select t.assert((select count(*) from public.darshanas where slug = 'zz-draft-darshana') = 0 and (select count(*) from public.comparison_cells where body = 'Draft cell body text here') = 0, 'anon cannot see draft darshanas or their cells');
select t.assert((select count(*) from public.lessons where slug = 'zz-draft-lesson') = 0 and (select count(*) from public.quizzes where slug = 'zz-draft-quiz') = 0 and (select count(*) from public.quiz_questions where prompt = 'Secret?') = 0, 'anon cannot see draft lessons, quizzes or their questions');
select t.assert((select count(*) from public.traditions where slug = 'islam') = 0 and (select count(*) from public.traditions where slug = 'sanatan-dharma') = 1, 'planned traditions are hidden; the active one is visible');
select t.assert((select count(*) from public.content_sources) > 0, 'anon can read source records (provenance is public)');
select t.assert((select count(*) from public.comparison_cells) = 96, 'anon sees all 96 published comparison cells');
select t.assert((select count(*) from public.quiz_questions) = 60, 'anon sees all 60 published quiz questions');
select t.assert(public.is_editor() = false, 'anon is not an editor');

select t.expect_error($$insert into public.scriptures (slug, tradition_id, title) values ('x', (select id from public.traditions limit 1), 'X')$$, 'anon cannot insert content', '42501');
select t.expect_error($$update public.scriptures set title = 'hacked'$$, 'anon cannot update content', '42501');
select t.expect_error($$delete from public.verses$$, 'anon cannot delete content', '42501');
select t.expect_error($$select * from public.profiles$$, 'anon cannot read profiles', '42501');
select t.expect_error($$select * from public.user_progress$$, 'anon cannot read progress', '42501');
select t.expect_error($$select * from public.bookmarks$$, 'anon cannot read bookmarks', '42501');
select t.expect_error($$select * from public.user_study_days$$, 'anon cannot read study days', '42501');
select t.expect_error($$select * from public.editors$$, 'anon cannot read the editors list', '42501');
select t.expect_error($$select * from public.audit_log$$, 'anon cannot read the audit log', '42501');
select t.expect_error($$select public.audit_row()$$, 'anon cannot call internal functions', '42501');
select t.expect_error($$insert into public.editors (user_id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')$$, 'anon cannot make anyone an editor', '42501');
reset role;

-- ===================== signed-in user A =====================
set local role authenticated;
select t.as_user('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
select t.assert(auth.uid() = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'the simulated request identifies user A');
select t.assert((select count(*) from public.scriptures where slug = 'zz-draft-scripture') = 0, 'a signed-in user still cannot see drafts');
select t.assert((select count(*) from public.user_progress) = 1 and (select count(*) from public.user_progress where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') = 1, 'A sees only A''s progress (B has two rows hidden)');
select t.assert((select count(*) from public.bookmarks) = 1, 'A sees only A''s bookmarks');
select t.assert((select count(*) from public.user_study_days) = 0, 'A does not see B''s study days');
select t.assert((select count(*) from public.profiles) = 1, 'A sees only A''s profile');
select t.assert(public.is_editor() = false, 'A is not an editor');

select t.expect_error($$insert into public.user_progress (user_id, lesson_id, completed_at) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (select id from public.lessons where slug = 'ramayana'), now())$$, 'A cannot write progress for B', '42501');
select t.expect_error($$insert into public.bookmarks (user_id, lesson_id) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (select id from public.lessons where slug = 'ramayana'))$$, 'A cannot write bookmarks for B', '42501');
select t.expect_error($$insert into public.user_study_days (user_id, day) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', current_date - 1)$$, 'A cannot write study days for B', '42501');
select t.assert(t.rows($$update public.user_progress set completed_at = null where user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'$$) = 0, 'A''s update of B''s progress affects zero rows');
select t.assert(t.rows($$delete from public.bookmarks where user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'$$) = 0, 'A''s delete of B''s bookmarks affects zero rows');
select t.assert(t.rows($$update public.profiles set display_name = 'pwned' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'$$) = 0, 'A cannot rename B''s profile');
select t.expect_error($$update public.user_progress set user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$, 'A cannot hand their row to B by changing user_id', '42501');
select t.expect_error($$update public.profiles set id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$, 'A cannot change their profile id', '42501');
select t.expect_error($$insert into public.profiles (id) values (gen_random_uuid())$$, 'profiles cannot be created by clients (only by the signup trigger)', '42501');
select t.expect_error($$insert into public.editors (user_id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')$$, 'A cannot make themselves an editor', '42501');
select t.expect_error($$update public.editors set user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$, 'A cannot edit the editors list', '42501');
select t.expect_error($$insert into public.scriptures (slug, tradition_id, title) values ('x', (select id from public.traditions limit 1), 'X')$$, 'a non-editor cannot insert content', '42501');
select t.expect_error($$insert into public.verse_translations (verse_id, language, source_id) values ((select id from public.verses where label = '2.47'), 'fr', (select id from public.content_sources where slug = 't-translation'))$$, 'a non-editor cannot add a translation', '42501');
select t.assert(t.rows($$update public.scriptures set title = 'hacked' where slug = 'bhagavad-gita'$$) = 0, 'a non-editor''s update of published content affects zero rows');
select t.assert(t.rows($$delete from public.verses where label = '2.47'$$) = 0, 'a non-editor''s delete of a verse affects zero rows');
select t.assert((select count(*) from public.audit_log) = 0, 'a non-editor sees nothing in the audit log');

-- A's own operations work
select t.expect_ok($$insert into public.user_progress (user_id, lesson_id, completed_at) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (select id from public.lessons where slug = 'ramayana'), now())$$, 'A can record their own progress');
select t.expect_ok($$insert into public.bookmarks (user_id, scripture_id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (select id from public.scriptures where slug = 'ramayana'))$$, 'A can bookmark');
select t.expect_ok($$insert into public.user_study_days (user_id, day) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', current_date)$$, 'A can record a study day');
select t.assert(t.rows($$update public.profiles set display_name = 'Asha' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$) = 1, 'A can edit their own display name');
select t.expect_error($$update public.profiles set display_name = repeat('x', 81) where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$, 'display names are length-limited', '23514');
select t.assert(t.rows($$delete from public.bookmarks where scripture_id = (select id from public.scriptures where slug = 'ramayana')$$) = 1, 'A can delete their own bookmark');
select t.assert((select count(*) from public.search_content('karma')) > 0, 'a signed-in user can use search');
reset role;

select t.assert((select count(*) from public.user_progress where user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') = 2 and (select count(*) from public.bookmarks where user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') = 1
  and (select display_name from public.profiles where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') is null, 'B''s data was completely untouched by A''s attempts');

-- ===================== editor E =====================
set local role authenticated;
select t.as_user('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');
select t.assert(public.is_editor() = true, 'E is an editor');
select t.assert((select count(*) from public.scriptures where slug = 'zz-draft-scripture') = 1, 'an editor can see drafts');
select t.assert((select count(*) from public.verse_translations where language = 'hi') = 1, 'an editor can see draft translations');
select t.assert((select count(*) from public.traditions where slug = 'islam') = 1, 'an editor can see planned traditions');
select t.expect_ok($$update public.verses set position = position + 1 where label = '2.47'$$, 'an editor can update a verse');
select t.expect_ok($$insert into public.verse_explanations (verse_id, kind, body, status) values ((select id from public.verses where label = '2.47'), 'context', 'x', 'draft') on conflict (verse_id, kind) do update set body = 'edited by editor'$$, 'an editor can upsert an explanation');
select t.expect_error($$insert into public.verse_translations (verse_id, language, body, translator, source_id, license, status) values ((select id from public.verses where label = '2.47'), 'de', 'x', null, (select id from public.content_sources where slug = 't-translation'), 'public_domain', 'published')$$,
  'even an editor cannot publish an unattributed translation (the database rules still apply)', '23514');
select t.assert((select count(*) from public.audit_log where actor = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' and table_name = 'verses' and op = 'UPDATE') = 1, 'the editor''s change is in the audit log, attributed to them');
select t.assert((select count(*) from public.audit_log where table_name = 'verse_explanations') >= 1, 'explanation edits are audited');
select t.expect_error($$insert into public.audit_log (table_name, op) values ('x', 'forged')$$, 'nobody can forge audit entries', '42501');
select t.expect_error($$update public.audit_log set op = 'x'$$, 'nobody can alter audit entries', '42501');
select t.expect_error($$delete from public.audit_log$$, 'nobody can delete audit entries', '42501');
select t.expect_error($$insert into public.editors (user_id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')$$, 'an editor cannot grant editor rights (service role only)', '42501');
-- Editors are still just users where personal data is concerned.
select t.assert((select count(*) from public.user_progress) = 0 and (select count(*) from public.bookmarks) = 0 and (select count(*) from public.user_study_days) = 0, 'an editor CANNOT read other users'' progress, bookmarks or study days');
select t.assert((select count(*) from public.editors) = 1, 'an editor sees only their own editors row');
reset role;

-- ===================== service role (server-side) =====================
set local role service_role;
select t.assert((select count(*) from public.scriptures where slug = 'zz-draft-scripture') = 1, 'service role bypasses RLS (drafts visible)');
select t.assert((select count(*) from public.user_progress) >= 3, 'service role can read user data for server-side jobs');
select t.expect_ok($$insert into public.editors (user_id) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')$$, 'only the service role can grant editor rights');
reset role;

rollback;
