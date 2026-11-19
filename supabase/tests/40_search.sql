-- search_content(): accent-insensitive, Devanagari-aware, safe with hostile input, published rows only.
\i supabase/tests/helpers.sql
begin;

select set_config('dq.skip_audit', 'on', true);
insert into auth.users (id, email) values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'editor@example.test');
insert into public.editors (user_id) values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');
insert into public.scriptures (slug, tradition_id, title, status) values ('zz-secret', (select id from public.traditions where slug = 'sanatan-dharma'), 'Secretdraftxyz', 'draft');

set local role anon;

-- Finds the right things
select t.assert(exists (select 1 from public.search_content('karma') where kind = 'concept'),            '"karma" finds the concept');
select t.assert(exists (select 1 from public.search_content('karma') where kind = 'verse' and slug = '2.47'), '"karma" finds verse 2.47');
select t.assert(exists (select 1 from public.search_content('karma') where kind = 'chapter' and slug = 'chapter-3'), '"karma" finds Bhagavad Gita chapter 3 (Karma Yoga)');
select t.assert(exists (select 1 from public.search_content('karma') where kind = 'lesson'),              '"karma" finds lessons');

-- Sanskrit: IAST with and without diacritics, and Devanagari
select t.assert(exists (select 1 from public.search_content('karmaṇy') where kind = 'verse' and slug = '2.47'),   'IAST with diacritics ("karmaṇy") finds 2.47');
select t.assert(exists (select 1 from public.search_content('karmany') where kind = 'verse' and slug = '2.47'),   'accent-insensitive: plain "karmany" finds the same verse');
select t.assert(exists (select 1 from public.search_content('KARMAṆY') where kind = 'verse' and slug = '2.47'),   'case-insensitive');
select t.assert(exists (select 1 from public.search_content('कर्मण्येव') where kind = 'verse' and slug = '2.47'), 'a Devanagari word finds the verse');
select t.assert(exists (select 1 from public.search_content('वेदान्त') where kind = 'darshana' and slug = 'vedanta'), 'a Devanagari school name finds the Darshana');
select t.assert(exists (select 1 from public.search_content('phaleṣu kadācana') where kind = 'verse'), 'a multi-word IAST phrase works');

-- Ranking and filtering
select t.assert((select kind || ':' || slug from public.search_content('yoga') limit 1) = 'darshana:yoga', 'an exact title match ranks first');
select t.assert(not exists (select 1 from public.search_content('karma', array['darshana']) where kind <> 'darshana'), 'the kind filter restricts results');
select t.assert((select count(*) from public.search_content('a', null, 1000)) <= 100, 'the result limit is clamped to 100');
select t.assert((select count(*) from public.search_content('a', null, 0)) = 1, 'a zero limit still returns at most one row');

-- Hostile / odd input must be inert
select t.assert((select count(*) from public.search_content('%')) = 0, '"%" is treated literally (no match-everything)');
select t.assert((select count(*) from public.search_content('_')) = 0, '"_" is treated literally');
select t.assert((select count(*) from public.search_content('\')) = 0, 'a backslash is handled');
select t.assert((select count(*) from public.search_content('')) = 0 and (select count(*) from public.search_content('   ')) = 0, 'empty and blank queries return nothing');
select t.assert((select count(*) from public.search_content($$'; drop table public.verses; --$$)) = 0, 'SQL-injection style input returns nothing');
select t.assert((select count(*) from public.verses) = (select count(*) from public.verses where source_id is not null) and (select count(*) from public.verses) >= 1, '...and the verses table is intact (still present, every row still sourced)');
select t.assert((select count(*) from public.search_content(repeat('x', 100000))) = 0, 'a very long query is handled');
select t.assert((select count(*) from public.search_content(null)) = 0, 'a NULL query returns nothing');

-- Drafts never leak
select t.assert((select count(*) from public.search_content('Secretdraftxyz')) = 0, 'anon search never returns a draft');
reset role;

set local role authenticated;
select t.as_user('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');
select t.assert((select count(*) from public.search_content('Secretdraftxyz')) = 1, 'an editor''s search does include drafts');
reset role;

rollback;
