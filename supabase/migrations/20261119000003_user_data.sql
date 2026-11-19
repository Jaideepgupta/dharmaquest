-- Migration 3: per-user data. Mirrors what the browser stores today (lib/learning/store.ts)
-- so progress can later move from localStorage to an account without changing meaning.

-- The "users" entity: Supabase manages auth.users; this table holds the app profile.
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 80),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Editors may write content. Managed only with the service role (no client can grant this).
create table public.editors (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id) on delete set null
);

-- A profile row is created automatically for each new account.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lesson completion and best quiz score. One row per user and lesson.
create table public.user_progress (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  lesson_id    uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz,
  quiz_best    int,
  quiz_total   int,
  quiz_last    int,
  quiz_at      timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (user_id, lesson_id),
  constraint quiz_fields_together check (
    (quiz_best is null) = (quiz_total is null) and (quiz_best is null) = (quiz_last is null) and (quiz_best is null) = (quiz_at is null)
  ),
  constraint quiz_scores_in_range check (
    quiz_best is null or (quiz_total > 0 and quiz_best between 0 and quiz_total and quiz_last between 0 and quiz_total and quiz_last <= quiz_best)
  )
);
create trigger user_progress_updated_at before update on public.user_progress
  for each row execute function public.set_updated_at();

-- Real study activity, one row per local calendar day. Streaks are computed from this, never stored.
create table public.user_study_days (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day     date not null check (day between date '2020-01-01' and date '2100-01-01'),
  primary key (user_id, day)
);

-- Bookmarks target exactly one thing. Real foreign keys (not free text) keep them valid.
create table public.bookmarks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  verse_id     uuid references public.verses(id) on delete cascade,
  chapter_id   uuid references public.chapters(id) on delete cascade,
  scripture_id uuid references public.scriptures(id) on delete cascade,
  category_id  uuid references public.scripture_categories(id) on delete cascade,   -- e.g. the Upanishads collection page
  lesson_id    uuid references public.lessons(id) on delete cascade,
  darshana_id  uuid references public.darshanas(id) on delete cascade,
  created_at   timestamptz not null default now(),
  constraint bookmark_has_one_target check (num_nonnulls(verse_id, chapter_id, scripture_id, category_id, lesson_id, darshana_id) = 1)
);
create unique index bookmarks_user_verse_uidx     on public.bookmarks (user_id, verse_id)     where verse_id is not null;
create unique index bookmarks_user_chapter_uidx   on public.bookmarks (user_id, chapter_id)   where chapter_id is not null;
create unique index bookmarks_user_scripture_uidx on public.bookmarks (user_id, scripture_id) where scripture_id is not null;
create unique index bookmarks_user_category_uidx  on public.bookmarks (user_id, category_id)  where category_id is not null;
create unique index bookmarks_user_lesson_uidx    on public.bookmarks (user_id, lesson_id)    where lesson_id is not null;
create unique index bookmarks_user_darshana_uidx  on public.bookmarks (user_id, darshana_id)  where darshana_id is not null;
create index bookmarks_user_created_idx on public.bookmarks (user_id, created_at desc);

-- Abuse guard: the same cap the browser store applies.
create function public.bookmarks_cap() returns trigger
language plpgsql as $$
begin
  if (select count(*) from public.bookmarks where user_id = new.user_id) >= 500 then
    raise exception 'bookmark limit reached (500)' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger bookmarks_limit before insert on public.bookmarks
  for each row execute function public.bookmarks_cap();
