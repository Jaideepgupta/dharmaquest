-- Migration 4: access control (grants + row-level security), audit trail, search.
--
-- Model:
--   anon / authenticated  : read PUBLISHED content only
--   editor                : read and write all content (row in public.editors)
--   signed-in user        : read/write only their own rows
--   service_role          : bypasses RLS (server-side jobs, seeding)
-- Grants are minimised as well as RLS being enabled (defence in depth).

create function public.is_editor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.editors where user_id = (select auth.uid()))
$$;

-- ---------------------------------------------------------------------------
-- Audit trail for content that carries claims about sources
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  actor      uuid,
  table_name text not null,
  row_id     text,
  op         text not null,
  old_row    jsonb,
  new_row    jsonb
);

create function public.audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
declare j jsonb;
begin
  if coalesce(current_setting('dq.skip_audit', true), '') = 'on' then
    return coalesce(new, old);
  end if;
  j := to_jsonb(coalesce(new, old));
  insert into public.audit_log (actor, table_name, row_id, op, old_row, new_row)
  values ((select auth.uid()), tg_table_name,
          coalesce(j ->> 'id', (j ->> 'darshana_id') || ':' || (j ->> 'dimension_id')),
          tg_op,
          case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
          case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['content_sources','scriptures','verses','verse_translations','verse_explanations',
    'commentaries','darshanas','comparison_cells','lessons','quiz_questions']
  loop
    execute format('create trigger %I_audit after insert or update or delete on public.%I for each row execute function public.audit_row()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Grants: start from nothing for API roles, then grant what is needed
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

do $$
declare t text;
begin
  -- Public (read-only) content. Editors write through the authenticated role + RLS.
  foreach t in array array['traditions','classifications','content_sources','scripture_categories','category_classifications',
    'scriptures','scripture_classifications','scripture_sources','chapters','verses','verse_words','verse_translations',
    'verse_explanations','philosophers','darshanas','darshana_philosophers','concepts','darshana_concepts','chapter_concepts',
    'verse_concepts','comparison_dimensions','comparison_cells','commentaries','lessons','quizzes','quiz_questions']
  loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy editors_all on public.%I for all to authenticated using (public.is_editor()) with check (public.is_editor())', t);
  end loop;
end $$;

-- Functions the API roles legitimately call (directly, or via constraints/indexes/policies they trigger).
grant execute on function public.is_editor() to anon, authenticated;
grant execute on function public.f_unaccent(text), public.f_arr_text(text[]) to anon, authenticated;
grant execute on function public.valid_question(public.question_kind, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.assert_source_kind(uuid, public.source_kind[], text) to authenticated;

-- ---------------------------------------------------------------------------
-- Public read policies: published content only
-- ---------------------------------------------------------------------------
create policy public_read on public.traditions for select to anon, authenticated using (status = 'active');
create policy public_read on public.classifications for select to anon, authenticated using (true);
create policy public_read on public.content_sources for select to anon, authenticated using (true);
create policy public_read on public.scripture_categories for select to anon, authenticated using (status = 'published');
create policy public_read on public.scriptures for select to anon, authenticated using (status = 'published');
create policy public_read on public.chapters for select to anon, authenticated using (status = 'published');
create policy public_read on public.verses for select to anon, authenticated using (status = 'published');
create policy public_read on public.philosophers for select to anon, authenticated using (status = 'published');
create policy public_read on public.darshanas for select to anon, authenticated using (status = 'published');
create policy public_read on public.concepts for select to anon, authenticated using (status = 'published');
create policy public_read on public.lessons for select to anon, authenticated using (status = 'published');
create policy public_read on public.quizzes for select to anon, authenticated using (status = 'published');
create policy public_read on public.comparison_dimensions for select to anon, authenticated using (true);

-- Rows hanging off a verse are public only when the verse and the row itself are published.
create policy public_read on public.verse_translations for select to anon, authenticated
  using (status = 'published' and exists (select 1 from public.verses v where v.id = verse_id and v.status = 'published'));
create policy public_read on public.verse_explanations for select to anon, authenticated
  using (status = 'published' and exists (select 1 from public.verses v where v.id = verse_id and v.status = 'published'));
create policy public_read on public.verse_words for select to anon, authenticated
  using (exists (select 1 from public.verses v where v.id = verse_id and v.status = 'published'));
create policy public_read on public.verse_concepts for select to anon, authenticated
  using (exists (select 1 from public.verses v where v.id = verse_id and v.status = 'published'));
create policy public_read on public.commentaries for select to anon, authenticated using (status = 'published');

-- Join tables follow their parent's visibility.
create policy public_read on public.category_classifications for select to anon, authenticated
  using (exists (select 1 from public.scripture_categories c where c.id = category_id and c.status = 'published'));
create policy public_read on public.scripture_classifications for select to anon, authenticated
  using (exists (select 1 from public.scriptures s where s.id = scripture_id and s.status = 'published'));
create policy public_read on public.scripture_sources for select to anon, authenticated
  using (exists (select 1 from public.scriptures s where s.id = scripture_id and s.status = 'published'));
create policy public_read on public.chapter_concepts for select to anon, authenticated
  using (exists (select 1 from public.chapters c where c.id = chapter_id and c.status = 'published'));
create policy public_read on public.darshana_philosophers for select to anon, authenticated
  using (exists (select 1 from public.darshanas d where d.id = darshana_id and d.status = 'published'));
create policy public_read on public.darshana_concepts for select to anon, authenticated
  using (exists (select 1 from public.darshanas d where d.id = darshana_id and d.status = 'published'));
create policy public_read on public.comparison_cells for select to anon, authenticated
  using (status = 'published' and exists (select 1 from public.darshanas d where d.id = darshana_id and d.status = 'published'));
create policy public_read on public.quiz_questions for select to anon, authenticated
  using (exists (select 1 from public.quizzes q where q.id = quiz_id and q.status = 'published'));

-- ---------------------------------------------------------------------------
-- User data: each user sees and changes only their own rows
-- ---------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.editors        enable row level security;
alter table public.user_progress  enable row level security;
alter table public.user_study_days enable row level security;
alter table public.bookmarks      enable row level security;
alter table public.audit_log      enable row level security;

grant select, update on public.profiles to authenticated;
grant select on public.editors to authenticated;       -- own row only (policy); no client can write it
grant select, insert, update, delete on public.user_progress, public.user_study_days, public.bookmarks to authenticated;
grant select on public.audit_log to authenticated;

create policy own_select on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy own_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy own_select on public.editors for select to authenticated using (user_id = (select auth.uid()));

create policy own_all on public.user_progress for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy own_all on public.user_study_days for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy own_all on public.bookmarks for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy editors_read on public.audit_log for select to authenticated using (public.is_editor());

-- Future tables should not be exposed to API roles by default.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated, public;

-- ---------------------------------------------------------------------------
-- Search: titles, transliteration, Sanskrit (Devanagari) and concepts, published rows only.
-- SECURITY INVOKER, so row-level security applies to whoever calls it.
-- Accent-insensitive: "karmanya" finds "karmaṇy". Substring match + trigram similarity.
-- At current volume a scan is fine; add GIN trigram indexes on these expressions as content grows.
-- ---------------------------------------------------------------------------
create function public.search_content(q text, kinds text[] default null, max_results int default 30)
returns table (kind text, slug text, title text, subtitle text, parent_slug text, rank real)
language sql stable security invoker set search_path = public, extensions as $$
  with needle as (select public.f_unaccent(lower(btrim(q))) as t),
  docs as (
    select 'scripture'::text as kind, s.slug, s.title, s.tagline as subtitle, null::text as parent_slug,
           lower(s.title) as main,
           public.f_unaccent(lower(s.title || ' ' || coalesce(s.sanskrit_title, '') || ' ' || coalesce(s.tagline, ''))) as doc
      from public.scriptures s
    union all
    select 'chapter', c.slug, coalesce(c.english_title, c.name), c.name, sc.slug,
           lower(coalesce(c.english_title, c.name)),
           public.f_unaccent(lower(c.name || ' ' || coalesce(c.english_title, '') || ' ' || coalesce(c.sanskrit_name, '') || ' ' || public.f_arr_text(c.key_concepts)))
      from public.chapters c join public.scriptures sc on sc.id = c.scripture_id
    union all
    select 'verse', v.label, sc.title || ' ' || v.label, public.f_arr_text(v.transliteration), sc.slug,
           lower(v.label),
           public.f_unaccent(lower(sc.title || ' ' || v.label || ' ' || public.f_arr_text(v.transliteration) || ' ' || public.f_arr_text(v.sanskrit)))
      from public.verses v join public.scriptures sc on sc.id = v.scripture_id
    union all
    select 'darshana', d.slug, d.name, d.core_question, null,
           lower(d.name),
           public.f_unaccent(lower(d.name || ' ' || coalesce(d.sanskrit_name, '') || ' ' || coalesce(d.focus, '')))
      from public.darshanas d
    union all
    select 'concept', k.slug, k.term, k.definition, null,
           lower(k.term),
           public.f_unaccent(lower(k.term || ' ' || coalesce(k.sanskrit_term, '') || ' ' || coalesce(k.definition, '')))
      from public.concepts k
    union all
    select 'philosopher', p.slug, p.name, p.note, null,
           lower(p.name),
           public.f_unaccent(lower(p.name || ' ' || coalesce(p.note, '')))
      from public.philosophers p
    union all
    select 'lesson', l.slug, l.title, l.summary, null,
           lower(l.title),
           public.f_unaccent(lower(l.title || ' ' || coalesce(l.summary, '') || ' ' || l.collection))
      from public.lessons l
  )
  select d.kind, d.slug, d.title, d.subtitle, d.parent_slug,
         (case when public.f_unaccent(d.main) = n.t then 3 when public.f_unaccent(d.main) like n.t || '%' then 2 else 1 end)::real as rank
    from docs d, needle n
   where n.t <> ''
     and (kinds is null or d.kind = any (kinds))
     and d.doc like '%' || replace(replace(replace(n.t, '\', '\\'), '%', '\%'), '_', '\_') || '%'
   order by 6 desc, d.title
   limit least(greatest(max_results, 1), 100)
$$;
grant execute on function public.search_content(text, text[], int) to anon, authenticated;
