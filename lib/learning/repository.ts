/**
 * Account-backed persistence for learning state (Supabase), behind a small interface.
 *
 * STATUS: written and unit-tested against an in-memory fake (tests/repository.test.ts).
 * It has NOT been run against a real Supabase project: do that before wiring it into the UI.
 * It is deliberately not imported by any page yet, so the site is unchanged.
 *
 * Design:
 *  - The client is injected (SupabaseLike), so this file needs no supabase-js dependency and no secrets.
 *  - Row-level security is the real gate; this code also only ever writes rows for `userId`.
 *  - First sign-in: syncOnSignIn() merges local + account state (see merge.ts), then saves it.
 *    Afterwards each change is sent as an operation (complete, remove bookmark, ...). Operations,
 *    not merges, are what let removals propagate: a union-merge can never express "deleted".
 *  - Every write is an idempotent upsert or a diff, so a failed sync can simply be retried.
 */
import { applyLimits, mergeStates } from './merge';
import type { Bookmark, BookmarkKind, LearningState, LessonProgress } from './store-types';

/* ---------- minimal client surface (structurally compatible with supabase-js) ---------- */
export type DbResult<T> = PromiseLike<{ data: T | null; error: { message: string } | null }>;
export interface FilterApi extends DbResult<Record<string, unknown>[]> {
  eq(column: string, value: unknown): FilterApi;
  in(column: string, values: unknown[]): FilterApi;
}
export interface TableApi {
  select(columns: string): FilterApi;
  upsert(rows: Record<string, unknown>[], options?: { onConflict?: string }): DbResult<unknown>;
  insert(rows: Record<string, unknown>[]): DbResult<unknown>;
  delete(): FilterApi;
}
export interface SupabaseLike { from(table: string): TableApi }

export class RepositoryError extends Error {
  constructor(public readonly table: string, message: string) {
    super(`${table}: ${message}`);
    this.name = 'RepositoryError';
  }
}

export interface LearningRepository {
  load(): Promise<LearningState>;
  /** Upsert-only: makes the account contain everything in `state`. Never deletes. */
  save(state: LearningState): Promise<SaveResult>;
  completeLesson(lessonId: string, at: number): Promise<void>;
  uncompleteLesson(lessonId: string): Promise<void>;
  recordQuiz(lessonId: string, best: number, total: number, last: number, at: number): Promise<void>;
  addBookmark(b: Bookmark): Promise<boolean>;
  removeBookmark(kind: BookmarkKind, id: string): Promise<void>;
  addStudyDay(day: string): Promise<void>;
}

export interface SaveResult {
  lessons: number;
  days: number;
  bookmarks: number;
  /** Items that could not be mapped to a database row (e.g. unknown ids). Reported, never silently dropped. */
  skipped: { what: string; id: string; reason: string }[];
}

async function run<T>(table: string, q: DbResult<T>): Promise<T | null> {
  const { data, error } = await q;
  if (error) throw new RepositoryError(table, error.message);
  return data;
}
const rows = async (table: string, q: FilterApi) => ((await run(table, q)) ?? []) as Record<string, unknown>[];
const iso = (ms?: number) => (ms === undefined ? null : new Date(ms).toISOString());
const ms = (v: unknown) => (typeof v === 'string' ? Date.parse(v) : undefined);

/* ---------- ids: how browser ids map to database rows ---------- */
interface Index {
  lessons: Map<string, string>;                         // slug -> id
  lessonSlugs: Map<string, string>;                     // id -> slug
  lessonTitles: Map<string, string>;                    // id -> title
  scriptures: Map<string, { id: string; title: string; categorySlug: string | null }>;
  scripturesById: Map<string, { slug: string; title: string; categorySlug: string | null }>;
  categories: Map<string, { id: string; title: string }>;
  categoriesById: Map<string, { slug: string; title: string }>;
  darshanas: Map<string, { id: string; title: string }>;
  darshanasById: Map<string, { slug: string; title: string }>;
  gitaChapters: Map<number, { id: string; title: string }>;      // Bhagavad Gita chapters by number
  gitaChaptersById: Map<string, { number: number; title: string }>;
  gitaVerses: Map<string, string>;                      // label '2.47' -> id
  gitaVersesById: Map<string, string>;
}

/** Route for a scripture slug, mirroring the site's routing (see categoryHref in lib/content/scriptures). */
function scriptureHref(slug: string, categorySlug: string | null): string | null {
  if (slug === 'bhagavad-gita') return '/gita/bhagavad-gita';
  if (categorySlug === 'other-gitas') return `/gita/${slug}`;
  if (slug === 'ramayana' || slug === 'mahabharata') return `/scriptures/${slug}`;
  return null; // catalogue-only entries (e.g. one Upanishad) have no page, so they cannot be bookmarked
}
const categoryHref = (slug: string) => (slug === 'darshanas' ? '/darshanas' : slug === 'bhagavad-gita' ? '/gita/bhagavad-gita' : slug === 'other-gitas' ? '/gita' : `/scriptures/${slug}`);

const COLUMN: Record<BookmarkKind | 'category', string> = {
  verse: 'verse_id', chapter: 'chapter_id', scripture: 'scripture_id', category: 'category_id', lesson: 'lesson_id', darshana: 'darshana_id',
};

export class SupabaseLearningRepository implements LearningRepository {
  private index?: Promise<Index>;

  constructor(private readonly db: SupabaseLike, private readonly userId: string) {
    if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new Error('userId must be a UUID');
  }

  /* ---- content index (public, read-only; RLS limits it to published content) ---- */
  private loadIndex(): Promise<Index> {
    this.index ??= (async () => {
      const [ls, ss, cs, ds, chs, vs] = await Promise.all([
        rows('lessons', this.db.from('lessons').select('id,slug,title')),
        rows('scriptures', this.db.from('scriptures').select('id,slug,title,category_id')),
        rows('scripture_categories', this.db.from('scripture_categories').select('id,slug,title')),
        rows('darshanas', this.db.from('darshanas').select('id,slug,name')),
        rows('chapters', this.db.from('chapters').select('id,scripture_id,number,unit_kind,english_title')),
        rows('verses', this.db.from('verses').select('id,scripture_id,label')),
      ]);
      const ix: Index = {
        lessons: new Map(), lessonSlugs: new Map(), lessonTitles: new Map(), scriptures: new Map(), scripturesById: new Map(), categories: new Map(), categoriesById: new Map(),
        darshanas: new Map(), darshanasById: new Map(), gitaChapters: new Map(), gitaChaptersById: new Map(), gitaVerses: new Map(), gitaVersesById: new Map(),
      };
      for (const r of ls) { ix.lessons.set(String(r.slug), String(r.id)); ix.lessonSlugs.set(String(r.id), String(r.slug)); ix.lessonTitles.set(String(r.id), String(r.title)); }
      for (const r of cs) { ix.categories.set(String(r.slug), { id: String(r.id), title: String(r.title) }); ix.categoriesById.set(String(r.id), { slug: String(r.slug), title: String(r.title) }); }
      for (const r of ss) {
        const cat = r.category_id ? ix.categoriesById.get(String(r.category_id))?.slug ?? null : null;
        ix.scriptures.set(String(r.slug), { id: String(r.id), title: String(r.title), categorySlug: cat });
        ix.scripturesById.set(String(r.id), { slug: String(r.slug), title: String(r.title), categorySlug: cat });
      }
      for (const r of ds) { ix.darshanas.set(String(r.slug), { id: String(r.id), title: String(r.name) }); ix.darshanasById.set(String(r.id), { slug: String(r.slug), title: String(r.name) }); }
      const bg = ix.scriptures.get('bhagavad-gita')?.id;
      for (const r of chs) if (r.scripture_id === bg && r.unit_kind === 'chapter') {
        const title = `Bhagavad Gita chapter ${r.number}: ${r.english_title ?? ''}`.replace(/: $/, '');
        ix.gitaChapters.set(Number(r.number), { id: String(r.id), title });
        ix.gitaChaptersById.set(String(r.id), { number: Number(r.number), title });
      }
      for (const r of vs) if (r.scripture_id === bg) { ix.gitaVerses.set(String(r.label), String(r.id)); ix.gitaVersesById.set(String(r.id), String(r.label)); }
      return ix;
    })();
    return this.index;
  }

  /** Browser bookmark -> database column + id, or null when it cannot be represented. */
  private async target(b: Bookmark): Promise<{ column: string; id: string } | null> {
    const ix = await this.loadIndex();
    switch (b.kind) {
      case 'lesson': { const id = ix.lessons.get(b.id); return id ? { column: COLUMN.lesson, id } : null; }
      case 'darshana': { const d = ix.darshanas.get(b.id); return d ? { column: COLUMN.darshana, id: d.id } : null; }
      case 'chapter': { const m = /^bg-(\d+)$/.exec(b.id); const c = m && ix.gitaChapters.get(Number(m[1])); return c ? { column: COLUMN.chapter, id: c.id } : null; }
      case 'verse': { const m = /^bg-(\d+)-(\d+)$/.exec(b.id); const v = m && ix.gitaVerses.get(`${m[1]}.${m[2]}`); return v ? { column: COLUMN.verse, id: v } : null; }
      case 'scripture': {
        // A scripture page, or a collection page that is a category (e.g. the Upanishads).
        const s = ix.scriptures.get(b.id);
        if (s && scriptureHref(b.id, s.categorySlug)) return { column: COLUMN.scripture, id: s.id };
        const c = ix.categories.get(b.id);
        return c ? { column: COLUMN.category, id: c.id } : null;
      }
    }
  }

  /* ---- reading ---- */
  async load(): Promise<LearningState> {
    const ix = await this.loadIndex();
    const [prog, days, marks] = await Promise.all([
      rows('user_progress', this.db.from('user_progress').select('lesson_id,completed_at,quiz_best,quiz_total,quiz_last,quiz_at').eq('user_id', this.userId)),
      rows('user_study_days', this.db.from('user_study_days').select('day').eq('user_id', this.userId)),
      rows('bookmarks', this.db.from('bookmarks').select('verse_id,chapter_id,scripture_id,category_id,lesson_id,darshana_id,created_at').eq('user_id', this.userId)),
    ]);

    const lessons: LearningState['lessons'] = {};
    for (const r of prog) {
      const slug = ix.lessonSlugs.get(String(r.lesson_id));
      if (!slug) continue; // lesson no longer published
      const p: LessonProgress = {};
      const done = ms(r.completed_at); if (done !== undefined) p.completedAt = done;
      if (r.quiz_best != null && r.quiz_total != null) p.quiz = { best: Number(r.quiz_best), total: Number(r.quiz_total), last: Number(r.quiz_last), at: ms(r.quiz_at) ?? 0 };
      if (p.completedAt !== undefined || p.quiz) lessons[slug] = p;
    }

    const bookmarks: Bookmark[] = [];
    for (const r of marks) {
      const at = ms(r.created_at) ?? 0;
      let b: Bookmark | null = null;
      if (r.lesson_id) { const slug = ix.lessonSlugs.get(String(r.lesson_id)); if (slug) b = { id: slug, kind: 'lesson', title: ix.lessonTitles.get(String(r.lesson_id)) ?? slug, href: `/learn/lessons/${slug}`, addedAt: at }; }
      else if (r.darshana_id) { const d = ix.darshanasById.get(String(r.darshana_id)); if (d) b = { id: d.slug, kind: 'darshana', title: `${d.title} Darshana`, href: `/darshanas/${d.slug}`, addedAt: at }; }
      else if (r.chapter_id) { const c = ix.gitaChaptersById.get(String(r.chapter_id)); if (c) b = { id: `bg-${c.number}`, kind: 'chapter', title: c.title, href: `/gita/bhagavad-gita/${c.number}`, addedAt: at }; }
      else if (r.verse_id) { const label = ix.gitaVersesById.get(String(r.verse_id)); if (label) { const [c, v] = label.split('.'); b = { id: `bg-${c}-${v}`, kind: 'verse', title: `Bhagavad Gita ${label}`, href: `/gita/bhagavad-gita/${c}/${v}`, addedAt: at }; } }
      else if (r.scripture_id) { const s = ix.scripturesById.get(String(r.scripture_id)); const href = s && scriptureHref(s.slug, s.categorySlug); if (s && href) b = { id: s.slug, kind: 'scripture', title: s.title, href, addedAt: at }; }
      else if (r.category_id) { const c = ix.categoriesById.get(String(r.category_id)); if (c) b = { id: c.slug, kind: 'scripture', title: c.title, href: categoryHref(c.slug), addedAt: at }; }
      if (b) bookmarks.push(b);
    }

    return { version: 1, lessons, bookmarks, recent: [], days: days.map((r) => String(r.day)).sort() };
  }

  /* ---- writing ---- */
  async save(input: LearningState): Promise<SaveResult> {
    const state = applyLimits(input);
    const ix = await this.loadIndex();
    const skipped: SaveResult['skipped'] = [];

    const progressRows: Record<string, unknown>[] = [];
    for (const [slug, p] of Object.entries(state.lessons)) {
      const lessonId = ix.lessons.get(slug);
      if (!lessonId) { skipped.push({ what: 'lesson', id: slug, reason: 'not a published lesson' }); continue; }
      progressRows.push({
        user_id: this.userId, lesson_id: lessonId, completed_at: iso(p.completedAt),
        quiz_best: p.quiz?.best ?? null, quiz_total: p.quiz?.total ?? null, quiz_last: p.quiz?.last ?? null, quiz_at: iso(p.quiz?.at),
      });
    }
    if (progressRows.length) await run('user_progress', this.db.from('user_progress').upsert(progressRows, { onConflict: 'user_id,lesson_id' }));

    const dayRows = state.days.map((day) => ({ user_id: this.userId, day }));
    if (dayRows.length) await run('user_study_days', this.db.from('user_study_days').upsert(dayRows, { onConflict: 'user_id,day' }));

    // Bookmarks: diff against what the account already has (partial unique indexes can't be upsert targets).
    const existing = await this.load();
    const have = new Set(existing.bookmarks.map((b) => `${b.kind}:${b.id}`));
    const toInsert: Record<string, unknown>[] = [];
    let kept = 0;
    for (const b of state.bookmarks) {
      if (have.has(`${b.kind}:${b.id}`)) { kept += 1; continue; }
      const t = await this.target(b);
      if (!t) { skipped.push({ what: `bookmark(${b.kind})`, id: b.id, reason: 'cannot be mapped to a stored item' }); continue; }
      toInsert.push({ user_id: this.userId, [t.column]: t.id, created_at: iso(b.addedAt) });
    }
    if (toInsert.length) await run('bookmarks', this.db.from('bookmarks').insert(toInsert));

    return { lessons: progressRows.length, days: dayRows.length, bookmarks: toInsert.length + kept, skipped };
  }

  async completeLesson(lessonId: string, at: number) {
    const ix = await this.loadIndex(); const id = ix.lessons.get(lessonId);
    if (!id) throw new RepositoryError('lessons', `unknown lesson ${lessonId}`);
    const cur = await rows('user_progress', this.db.from('user_progress').select('completed_at').eq('user_id', this.userId).eq('lesson_id', id));
    const prev = ms(cur[0]?.completed_at);
    // Keep the earliest completion time, exactly as merge() does.
    await run('user_progress', this.db.from('user_progress').upsert([{ user_id: this.userId, lesson_id: id, completed_at: iso(prev === undefined ? at : Math.min(prev, at)) }], { onConflict: 'user_id,lesson_id' }));
  }
  async uncompleteLesson(lessonId: string) {
    const ix = await this.loadIndex(); const id = ix.lessons.get(lessonId);
    if (!id) throw new RepositoryError('lessons', `unknown lesson ${lessonId}`);
    await run('user_progress', this.db.from('user_progress').upsert([{ user_id: this.userId, lesson_id: id, completed_at: null }], { onConflict: 'user_id,lesson_id' }));
  }
  async recordQuiz(lessonId: string, best: number, total: number, last: number, at: number) {
    const ix = await this.loadIndex(); const id = ix.lessons.get(lessonId);
    if (!id) throw new RepositoryError('lessons', `unknown lesson ${lessonId}`);
    await run('user_progress', this.db.from('user_progress').upsert([{ user_id: this.userId, lesson_id: id, quiz_best: best, quiz_total: total, quiz_last: last, quiz_at: iso(at) }], { onConflict: 'user_id,lesson_id' }));
    await this.addStudyDay(new Date(at).toISOString().slice(0, 10));
  }
  async addBookmark(b: Bookmark): Promise<boolean> {
    const t = await this.target(b);
    if (!t) return false;
    const found = await rows('bookmarks', this.db.from('bookmarks').select('created_at').eq('user_id', this.userId).eq(t.column, t.id));
    if (found.length) return true;
    await run('bookmarks', this.db.from('bookmarks').insert([{ user_id: this.userId, [t.column]: t.id, created_at: iso(b.addedAt) }]));
    return true;
  }
  async removeBookmark(kind: BookmarkKind, id: string) {
    const t = await this.target({ kind, id, title: '', href: '/', addedAt: 0 });
    if (!t) return;
    await run('bookmarks', this.db.from('bookmarks').delete().eq('user_id', this.userId).eq(t.column, t.id));
  }
  async addStudyDay(day: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new RepositoryError('user_study_days', `invalid day ${day}`);
    await run('user_study_days', this.db.from('user_study_days').upsert([{ user_id: this.userId, day }], { onConflict: 'user_id,day' }));
  }
}

/** First sign-in: combine this browser's progress with the account's, save, and return the result. */
export async function syncOnSignIn(local: LearningState, repo: LearningRepository): Promise<{ state: LearningState; result: SaveResult }> {
  const remote = await repo.load();
  const state = applyLimits(mergeStates(local, remote));
  const result = await repo.save(state);
  return { state, result };
}
