-- DharmaQuest backend, migration 1: extensions, enum types and shared helpers.
-- Target: Supabase (PostgreSQL 15+). Also runs on plain PostgreSQL with supabase/tests/shim.sql.

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
-- Publication state of any content row. Only 'published' rows are visible to the public.
create type public.content_status as enum ('draft', 'under_review', 'published');

-- What kind of work a content_sources row describes.
create type public.source_kind as enum
  ('primary_text', 'translation', 'commentary', 'scholarly_work', 'dataset', 'editorial');

-- Licensing of a text. 'unknown' is allowed only while content is not published.
create type public.license_kind as enum
  ('public_domain', 'licensed', 'cc_by', 'cc_by_sa', 'permission', 'editorial', 'unknown');

-- How a scripture is organised. Chapters/verses are optional: not every text has them.
create type public.structure_kind as enum ('chaptered', 'flat', 'collection', 'none');

create type public.explanation_kind as enum
  ('brief_summary', 'detailed_explanation', 'context', 'practical_application');

create type public.level_kind as enum ('beginner', 'intermediate', 'advanced');
create type public.question_kind as enum ('mcq', 'teaching', 'tf', 'match');
create type public.darshana_kind as enum ('darshana', 'sub_school');

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Immutable wrappers so they can be used in expression indexes.
create function public.f_unaccent(text) returns text
language sql immutable parallel safe strict
set search_path = extensions, pg_temp
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, $1) $$;

create function public.f_arr_text(text[]) returns text
language sql immutable parallel safe strict
as $$ select array_to_string($1, ' ') $$;
