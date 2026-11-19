-- Migration 2: the content model.
-- Principles enforced here (not only in the UI):
--  * every verse / translation / commentary names a source (content_sources);
--  * translation, editorial explanation and traditional commentary are separate tables;
--  * a scripture belongs to exactly one tradition and is never forced to have chapters or verses;
--  * only published rows are ever public (see migration 4 for row-level security).

-- ---------------------------------------------------------------------------
-- Traditions and classification
-- ---------------------------------------------------------------------------
create table public.traditions (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null check (btrim(name) <> ''),
  description text,
  -- 'planned' traditions exist in the model but are not shown or populated yet.
  status      text not null default 'planned' check (status in ('active', 'planned')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.classifications (
  id           uuid primary key default gen_random_uuid(),
  tradition_id uuid not null references public.traditions(id) on delete cascade,
  slug         text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label        text not null,
  description  text,
  unique (tradition_id, slug)
);

-- ---------------------------------------------------------------------------
-- Sources: where every piece of text comes from
-- ---------------------------------------------------------------------------
create table public.content_sources (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kind          public.source_kind not null,
  title         text not null check (btrim(title) <> ''),
  creators      text[] not null default '{}',
  translators   text[] not null default '{}',
  publisher     text,
  year          int check (year between 1 and 2200),
  edition       text,
  license       public.license_kind not null default 'unknown',
  license_notes text,
  url           text check (url is null or url ~ '^https?://'),
  verified      boolean not null default false,
  verified_on   date,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint source_verified_has_date check (not verified or verified_on is not null),
  constraint source_unknown_license_unverified check (license <> 'unknown' or not verified)
);

-- ---------------------------------------------------------------------------
-- Scriptures
-- ---------------------------------------------------------------------------
create table public.scripture_categories (
  id           uuid primary key default gen_random_uuid(),
  tradition_id uuid not null references public.traditions(id) on delete restrict,
  slug         text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title        text not null,
  sanskrit_title text,
  tagline      text,
  overview     text[] not null default '{}',
  position     int not null default 0,
  presentation jsonb not null default '{}',        -- UI hints only (glyph, tone)
  status       public.content_status not null default 'draft',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (tradition_id, slug),
  unique (id, tradition_id)
);

create table public.category_classifications (
  category_id       uuid not null references public.scripture_categories(id) on delete cascade,
  classification_id uuid not null references public.classifications(id) on delete restrict,
  primary key (category_id, classification_id)
);

create table public.scriptures (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  tradition_id        uuid not null references public.traditions(id) on delete restrict,
  category_id         uuid,
  -- A text embedded in another (e.g. the Bhagavad Gita within the Mahabharata). Same tradition only.
  parent_scripture_id uuid,
  title               text not null check (btrim(title) <> ''),
  sanskrit_title      text,
  tagline             text,
  intro               text,
  context             text,
  location_note       text,                         -- where it is found, as traditionally stated
  structure_kind      public.structure_kind not null default 'none',
  chapter_count       int check (chapter_count is null or chapter_count >= 0),   -- null = not verified
  verse_count         int check (verse_count is null or verse_count >= 0),       -- null = not verified
  structure_note      text,
  date_note           text,                         -- dates are disputed: a note, never a single date
  speakers            text[] not null default '{}',
  themes              text[] not null default '{}',
  key_teachings       text[] not null default '{}',
  attributes          jsonb not null default '{}',  -- catalogue extras (e.g. traditional Vedic affiliation)
  position            int not null default 0,
  status              public.content_status not null default 'draft',
  detail_status       public.content_status not null default 'under_review',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (id, tradition_id),
  foreign key (category_id, tradition_id) references public.scripture_categories (id, tradition_id),
  foreign key (parent_scripture_id, tradition_id) references public.scriptures (id, tradition_id),
  constraint scripture_not_own_parent check (parent_scripture_id is distinct from id),
  -- Flat/none texts have no chapters, so a chapter count makes no sense for them.
  constraint scripture_flat_has_no_chapter_count
    check (structure_kind in ('chaptered', 'collection') or chapter_count is null)
);
create index scriptures_category_idx on public.scriptures (category_id);
create index scriptures_parent_idx on public.scriptures (parent_scripture_id);

create table public.scripture_classifications (
  scripture_id      uuid not null references public.scriptures(id) on delete cascade,
  classification_id uuid not null references public.classifications(id) on delete restrict,
  primary key (scripture_id, classification_id)
);

create table public.scripture_sources (
  scripture_id uuid not null references public.scriptures(id) on delete cascade,
  source_id    uuid not null references public.content_sources(id) on delete restrict,
  role         text not null default 'reference' check (role in ('text', 'edition', 'reference')),
  primary key (scripture_id, source_id, role)
);

-- Chapters: any named division (chapter, kanda, parva, skandha...). Optional per scripture.
create table public.chapters (
  id                uuid primary key default gen_random_uuid(),
  scripture_id      uuid not null references public.scriptures(id) on delete cascade,
  parent_chapter_id uuid,
  unit_kind         text not null default 'chapter' check (unit_kind ~ '^[a-z_]+$'),
  number            int not null check (number > 0),
  slug              text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sanskrit_name     text,
  name              text not null,
  english_title     text,
  verse_count       int check (verse_count is null or verse_count >= 0),
  intro             text,
  summary           text,
  message           text,
  key_concepts      text[] not null default '{}',
  important_verses  jsonb not null default '[]' check (jsonb_typeof(important_verses) = 'array'),
  position          int not null default 0,
  status            public.content_status not null default 'draft',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (id, scripture_id),
  unique (scripture_id, unit_kind, number),
  unique (scripture_id, slug),
  foreign key (parent_chapter_id, scripture_id) references public.chapters (id, scripture_id)
);
create index chapters_scripture_idx on public.chapters (scripture_id, position);

-- A scripture declared flat/none cannot have chapters.
create function public.chapters_require_structure() returns trigger
language plpgsql as $$
declare k public.structure_kind;
begin
  select structure_kind into k from public.scriptures where id = new.scripture_id;
  if k not in ('chaptered', 'collection') then
    raise exception 'scripture % has structure_kind %, so it cannot have chapters', new.scripture_id, k
      using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger chapters_structure before insert or update of scripture_id on public.chapters
  for each row execute function public.chapters_require_structure();

-- Asserts a source row has one of the allowed kinds (used by several tables).
create function public.assert_source_kind(src uuid, allowed public.source_kind[], ctx text) returns void
language plpgsql stable as $$
declare k public.source_kind;
begin
  select kind into k from public.content_sources where id = src;
  if k is null or not (k = any (allowed)) then
    raise exception '% requires a source of kind %, got %', ctx, allowed, coalesce(k::text, 'missing')
      using errcode = 'check_violation';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Verses and everything attached to them
-- ---------------------------------------------------------------------------
create table public.verses (
  id                     uuid primary key default gen_random_uuid(),
  scripture_id           uuid not null references public.scriptures(id) on delete cascade,
  chapter_id             uuid,
  number                 int check (number is null or number > 0),
  label                  text not null check (btrim(label) <> ''),   -- e.g. '2.47'; flexible for other schemes
  position               int not null default 0,
  sanskrit               text[] not null default '{}',
  transliteration        text[] not null default '{}',
  transliteration_scheme text check (transliteration_scheme in ('IAST', 'ISO15919', 'Harvard-Kyoto', 'ITRANS')),
  -- The edition the Sanskrit was taken from. Required for every verse: no verse without a source.
  source_id              uuid not null references public.content_sources(id) on delete restrict,
  status                 public.content_status not null default 'draft',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (id, scripture_id),
  unique (scripture_id, label),
  foreign key (chapter_id, scripture_id) references public.chapters (id, scripture_id),
  constraint verse_published_has_sanskrit check (status <> 'published' or cardinality(sanskrit) > 0),
  constraint verse_translit_has_scheme check (cardinality(transliteration) = 0 or transliteration_scheme is not null)
);
create index verses_chapter_idx on public.verses (chapter_id, position);

create function public.verses_check_source() returns trigger
language plpgsql as $$
begin
  perform public.assert_source_kind(new.source_id, array['primary_text', 'dataset', 'scholarly_work']::public.source_kind[], 'a verse');
  return new;
end $$;
create trigger verses_source_kind before insert or update of source_id on public.verses
  for each row execute function public.verses_check_source();

create table public.verse_words (
  verse_id uuid not null references public.verses(id) on delete cascade,
  position int not null check (position > 0),
  word     text not null,
  gloss    text not null,
  origin   text not null default 'dharmaquest_editorial' check (origin in ('dharmaquest_editorial', 'contributor')),
  primary key (verse_id, position)
);

create table public.verse_translations (
  id         uuid primary key default gen_random_uuid(),
  verse_id   uuid not null references public.verses(id) on delete cascade,
  language   text not null check (language ~ '^[a-z]{2,3}(-[A-Za-z]+)?$'),
  body       text,
  translator text,
  source_id  uuid not null references public.content_sources(id) on delete restrict,
  license    public.license_kind not null default 'unknown',
  status     public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (verse_id, language, source_id),
  -- A published translation must carry its text, its translator and a known licence.
  constraint translation_published_complete check (
    status <> 'published'
    or (btrim(coalesce(body, '')) <> '' and btrim(coalesce(translator, '')) <> '' and license <> 'unknown')
  )
);
create function public.translations_check_source() returns trigger
language plpgsql as $$
begin
  perform public.assert_source_kind(new.source_id, array['translation']::public.source_kind[], 'a translation');
  return new;
end $$;
create trigger translations_source_kind before insert or update of source_id on public.verse_translations
  for each row execute function public.translations_check_source();

-- DharmaQuest's own explanations. Labelled editorial: never presented as translation or commentary.
create table public.verse_explanations (
  id         uuid primary key default gen_random_uuid(),
  verse_id   uuid not null references public.verses(id) on delete cascade,
  kind       public.explanation_kind not null,
  body       text not null check (btrim(body) <> ''),
  payload    jsonb not null default '{}',        -- structured extras (e.g. brief view parts, key terms)
  origin     text not null default 'dharmaquest_editorial' check (origin in ('dharmaquest_editorial', 'contributor')),
  reviewed_by text,
  status     public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (verse_id, kind)
);

-- ---------------------------------------------------------------------------
-- Philosophers, darshanas, concepts, comparison
-- ---------------------------------------------------------------------------
create table public.philosophers (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  tradition_id uuid not null references public.traditions(id) on delete restrict,
  name         text not null,
  note         text,
  date_note    text,
  status       public.content_status not null default 'draft',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.darshanas (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  tradition_id            uuid not null references public.traditions(id) on delete restrict,
  -- 'sub_school' rows (e.g. Advaita) belong to a parent darshana (Vedanta): they are NOT separate darshanas.
  kind                    public.darshana_kind not null default 'darshana',
  parent_id               uuid references public.darshanas(id) on delete restrict,
  number                  int check (number is null or number > 0),
  name                    text not null,
  sanskrit_name           text,
  focus                   text,
  core_question           text,
  summary                 text,
  foundational_text       text,
  foundational_attribution text,
  foundational_scripture_id uuid references public.scriptures(id) on delete set null,
  notes                   text[] not null default '{}',
  position                int not null default 0,
  status                  public.content_status not null default 'draft',
  detail_status           public.content_status not null default 'under_review',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint darshana_sub_school_has_parent check ((kind = 'sub_school') = (parent_id is not null)),
  constraint darshana_not_own_parent check (parent_id is distinct from id)
);
create unique index darshanas_number_uidx on public.darshanas (tradition_id, number) where kind = 'darshana';

create function public.darshanas_check_parent() returns trigger
language plpgsql as $$
declare pk public.darshana_kind; pt uuid;
begin
  if new.parent_id is not null then
    select kind, tradition_id into pk, pt from public.darshanas where id = new.parent_id;
    if pk is distinct from 'darshana' then
      raise exception 'a sub_school must belong to a darshana, not to another sub_school' using errcode = 'check_violation';
    end if;
    if pt is distinct from new.tradition_id then
      raise exception 'a sub_school must be in the same tradition as its parent' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;
create trigger darshanas_parent before insert or update of parent_id, tradition_id on public.darshanas
  for each row execute function public.darshanas_check_parent();

create table public.darshana_philosophers (
  darshana_id    uuid not null references public.darshanas(id) on delete cascade,
  philosopher_id uuid not null references public.philosophers(id) on delete cascade,
  role           text,
  primary key (darshana_id, philosopher_id)
);

create table public.concepts (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  tradition_id  uuid not null references public.traditions(id) on delete restrict,
  term          text not null,
  sanskrit_term text,
  definition    text,                    -- general definition; school-specific meaning lives in darshana_concepts
  status        public.content_status not null default 'draft',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tradition_id, slug)
);

create table public.darshana_concepts (
  darshana_id uuid not null references public.darshanas(id) on delete cascade,
  concept_id  uuid not null references public.concepts(id) on delete cascade,
  meaning     text not null,
  primary key (darshana_id, concept_id)
);
create table public.chapter_concepts (
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  concept_id uuid not null references public.concepts(id) on delete cascade,
  primary key (chapter_id, concept_id)
);
create table public.verse_concepts (
  verse_id   uuid not null references public.verses(id) on delete cascade,
  concept_id uuid not null references public.concepts(id) on delete cascade,
  note       text,
  primary key (verse_id, concept_id)
);

create table public.comparison_dimensions (
  id       uuid primary key default gen_random_uuid(),
  set_kind public.darshana_kind not null,       -- which comparison the row belongs to
  slug     text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label    text not null,
  position int not null default 0,
  unique (set_kind, slug)
);

create table public.comparison_cells (
  darshana_id  uuid not null references public.darshanas(id) on delete cascade,
  dimension_id uuid not null references public.comparison_dimensions(id) on delete cascade,
  body         text not null check (btrim(body) <> ''),
  source_id    uuid references public.content_sources(id) on delete set null,
  status       public.content_status not null default 'draft',
  updated_at   timestamptz not null default now(),
  primary key (darshana_id, dimension_id)
);
create function public.cells_check_set() returns trigger
language plpgsql as $$
declare dk public.darshana_kind; sk public.darshana_kind;
begin
  select kind into dk from public.darshanas where id = new.darshana_id;
  select set_kind into sk from public.comparison_dimensions where id = new.dimension_id;
  if dk is distinct from sk then
    raise exception 'a % cannot use a % comparison dimension', dk, sk using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger cells_set before insert or update on public.comparison_cells
  for each row execute function public.cells_check_set();

-- Traditional commentary on a verse, chapter or scripture. Attributed to a commentator and school.
create table public.commentaries (
  id            uuid primary key default gen_random_uuid(),
  commentator_id uuid references public.philosophers(id) on delete restrict,
  school_id     uuid references public.darshanas(id) on delete set null,
  work_title    text not null,
  verse_id      uuid references public.verses(id) on delete cascade,
  chapter_id    uuid references public.chapters(id) on delete cascade,
  scripture_id  uuid references public.scriptures(id) on delete cascade,
  excerpt       text,
  language      text check (language ~ '^[a-z]{2,3}(-[A-Za-z]+)?$'),
  translator    text,
  source_id     uuid not null references public.content_sources(id) on delete restrict,
  license       public.license_kind not null default 'unknown',
  status        public.content_status not null default 'draft',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint commentary_has_one_target check (num_nonnulls(verse_id, chapter_id, scripture_id) = 1),
  constraint commentary_published_complete check (
    status <> 'published'
    or (btrim(coalesce(excerpt, '')) <> '' and commentator_id is not null and license <> 'unknown')
  )
);
create function public.commentaries_check_source() returns trigger
language plpgsql as $$
begin
  perform public.assert_source_kind(new.source_id, array['commentary', 'scholarly_work']::public.source_kind[], 'a commentary');
  return new;
end $$;
create trigger commentaries_source_kind before insert or update of source_id on public.commentaries
  for each row execute function public.commentaries_check_source();

-- ---------------------------------------------------------------------------
-- Lessons and quizzes
-- ---------------------------------------------------------------------------
create table public.lessons (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title        text not null,
  level        public.level_kind not null,
  collection   text not null,
  scripture_id uuid references public.scriptures(id) on delete set null,
  summary      text,
  sections     jsonb not null check (jsonb_typeof(sections) = 'array'),
  read_more    jsonb not null default '[]' check (jsonb_typeof(read_more) = 'array'),
  minutes      int not null check (minutes between 1 and 120),
  position     int not null default 0,
  status       public.content_status not null default 'draft',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index lessons_level_idx on public.lessons (level, position);

create table public.quizzes (
  id        uuid primary key default gen_random_uuid(),
  slug      text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  lesson_id uuid not null unique references public.lessons(id) on delete cascade,
  title     text not null,
  status    public.content_status not null default 'draft'
);

-- Shape rules for quiz questions, written defensively (no casts on values of the wrong type).
create function public.valid_question(k public.question_kind, options jsonb, answer jsonb, pairs jsonb) returns boolean
language plpgsql immutable as $$
declare n int;
begin
  if k in ('mcq', 'teaching') then
    if options is null or jsonb_typeof(options) <> 'array' or pairs is not null then return false; end if;
    n := jsonb_array_length(options);
    if n < 2 or n > 8 then return false; end if;
    if answer is null or jsonb_typeof(answer) <> 'number' then return false; end if;
    return (answer #>> '{}') ~ '^[0-9]+$' and (answer #>> '{}')::int < n;
  elsif k = 'tf' then
    return answer is not null and jsonb_typeof(answer) = 'boolean' and options is null and pairs is null;
  elsif k = 'match' then
    if pairs is null or jsonb_typeof(pairs) <> 'array' or options is not null or answer is not null then return false; end if;
    n := jsonb_array_length(pairs);
    return n between 2 and 8;
  end if;
  return false;
end $$;

create table public.quiz_questions (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     uuid not null references public.quizzes(id) on delete cascade,
  position    int not null check (position > 0),
  kind        public.question_kind not null,
  prompt      text not null check (btrim(prompt) <> ''),
  options     jsonb,       -- mcq / teaching: array of strings
  answer      jsonb,       -- mcq / teaching: option index; tf: boolean
  pairs       jsonb,       -- match: array of {left, right}
  explanation text not null check (btrim(explanation) <> ''),   -- every answer is explained
  unique (quiz_id, position),
  constraint question_shape check (public.valid_question(kind, options, answer, pairs))
);

-- updated_at triggers
do $$
declare t text;
begin
  foreach t in array array['traditions','content_sources','scripture_categories','scriptures','chapters','verses',
    'verse_translations','verse_explanations','philosophers','darshanas','concepts','comparison_cells','commentaries','lessons']
  loop
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;
