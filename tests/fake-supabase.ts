/**
 * In-memory stand-in for the Supabase client, for repository tests only.
 * It enforces what the real database enforces (row-level security by user, bookmark target rules,
 * quiz-score constraints, unique keys) so a repository bug fails here as it would against Postgres.
 * It is NOT proof of compatibility with the real supabase-js: that needs an integration run.
 */
import type { DbResult, FilterApi, SupabaseLike, TableApi } from '../lib/learning/repository';

type Row = Record<string, unknown>;
const USER_TABLES = new Set(['user_progress', 'user_study_days', 'bookmarks']);
const TARGETS = ['verse_id', 'chapter_id', 'scripture_id', 'category_id', 'lesson_id', 'darshana_id'];

export class FakeDb {
  tables: Record<string, Row[]> = {};
  log: { table: string; op: string; rows: Row[] }[] = [];
  /** Make the next `times` operations of this kind fail, to test error handling and retries. */
  fail: { table: string; op: string; message: string; times: number } | null = null;
  constructor(public currentUser: string) {}

  seed(table: string, rows: Row[]) { this.tables[table] = [...(this.tables[table] ?? []), ...rows.map((r) => ({ ...r }))]; }
  rows(table: string) { return this.tables[table] ?? []; }
  mine(table: string) { return this.rows(table).filter((r) => r.user_id === this.currentUser); }

  private check(table: string, op: string): string | null {
    if (this.fail && this.fail.table === table && this.fail.op === op && this.fail.times > 0) { this.fail.times -= 1; return this.fail.message; }
    return null;
  }
  private visible(table: string): Row[] { return USER_TABLES.has(table) ? this.rows(table).filter((r) => r.user_id === this.currentUser) : this.rows(table); }

  private validate(table: string, r: Row): string | null {
    if (USER_TABLES.has(table) && r.user_id !== this.currentUser) return 'new row violates row-level security policy';
    if (table === 'user_progress') {
      const q = [r.quiz_best, r.quiz_total, r.quiz_last, r.quiz_at];
      const set = q.filter((x) => x !== undefined && x !== null).length;
      if (set !== 0 && set !== 4 && ('quiz_best' in r)) return 'violates check constraint "quiz_fields_together"';
      if (r.quiz_best != null) {
        const [b, t, l] = [Number(r.quiz_best), Number(r.quiz_total), Number(r.quiz_last)];
        if (!(t > 0 && b >= 0 && b <= t && l >= 0 && l <= t && l <= b)) return 'violates check constraint "quiz_scores_in_range"';
      }
    }
    if (table === 'user_study_days' && !(typeof r.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.day) && r.day >= '2020-01-01' && r.day <= '2100-01-01')) return 'violates check constraint on day';
    if (table === 'bookmarks' && TARGETS.filter((c) => r[c] != null).length !== 1) return 'violates check constraint "bookmark_has_one_target"';
    return null;
  }

  client(): SupabaseLike {
    const db = this;
    class Query implements FilterApi {
      private preds: ((r: Row) => boolean)[] = [];
      constructor(private table: string, private kind: 'select' | 'delete', private cols = '*') {}
      eq(c: string, v: unknown) { this.preds.push((r) => r[c] === v); return this; }
      in(c: string, vs: unknown[]) { this.preds.push((r) => vs.includes(r[c])); return this; }
      then<A, B>(ok?: ((v: { data: Row[] | null; error: { message: string } | null }) => A | PromiseLike<A>) | null, bad?: ((e: unknown) => B | PromiseLike<B>) | null) {
        return Promise.resolve(this.run()).then(ok, bad);
      }
      private run(): { data: Row[] | null; error: { message: string } | null } {
        const err = db.check(this.table, this.kind); if (err) return { data: null, error: { message: err } };
        const match = (r: Row) => this.preds.every((p) => p(r));
        if (this.kind === 'delete') {
          const gone = db.visible(this.table).filter(match);
          db.tables[this.table] = db.rows(this.table).filter((r) => !gone.includes(r));
          db.log.push({ table: this.table, op: 'delete', rows: gone });
          return { data: [], error: null };
        }
        const cols = this.cols === '*' ? null : this.cols.split(',').map((c) => c.trim());
        return { data: db.visible(this.table).filter(match).map((r) => (cols ? Object.fromEntries(cols.map((c) => [c, r[c]])) : { ...r })), error: null };
      }
    }
    const write = (table: string, op: 'upsert' | 'insert', rows: Row[], onConflict?: string): DbResult<unknown> => {
      const run = () => {
        const err = db.check(table, op); if (err) return { data: null, error: { message: err } };
        for (const r of rows) { const v = db.validate(table, r); if (v) return { data: null, error: { message: v } }; }
        const next = db.rows(table).map((r) => ({ ...r }));
        for (const r of rows) {
          if (op === 'upsert') {
            const keys = (onConflict ?? '').split(',').filter(Boolean);
            const hit = next.find((x) => keys.length && keys.every((k) => x[k] === r[k]));
            if (hit) { Object.assign(hit, r); continue; }
          } else if (table === 'bookmarks') {
            if (next.filter((x) => x.user_id === r.user_id).length >= 500) return { data: null, error: { message: 'bookmark limit reached (500)' } };
            const col = TARGETS.find((c) => r[c] != null)!;
            if (next.some((x) => x.user_id === r.user_id && x[col] === r[col])) return { data: null, error: { message: `duplicate key value violates unique constraint "bookmarks_user_${col}_uidx"` } };
          }
          next.push({ ...r });
        }
        db.tables[table] = next; db.log.push({ table, op, rows });
        return { data: null, error: null };
      };
      return { then: (ok, bad) => Promise.resolve(run()).then(ok, bad) } as DbResult<unknown>;
    };
    return {
      from(table: string): TableApi {
        return {
          select: (cols: string) => new Query(table, 'select', cols),
          upsert: (rows, opts) => write(table, 'upsert', rows, opts?.onConflict),
          insert: (rows) => write(table, 'insert', rows),
          delete: () => new Query(table, 'delete'),
        };
      },
    };
  }
}
