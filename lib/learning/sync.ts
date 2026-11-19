/**
 * The queue engine: a persistent, coalescing queue of operations sent to the account in order.
 *
 * - transient failures (offline, timeouts, 5xx, 429) keep the queue and stop: retry later
 * - auth failures stop and ask the caller to refresh the session once
 * - permanent failures (the database rejected that exact request) DROP the operation and carry on,
 *   so one poisoned operation can never block everything behind it
 * - a pull = flush first, then load, then re-apply anything queued meanwhile, so the UI never reverts
 *   a change the person just made
 */
import { applyOps, coalesce, newQid, sanitizeOps, type Op, type OpBody } from './ops';
import { RepositoryError, type LearningRepository } from './repository';
import type { LearningState } from './store-types';

export interface QueueStore { read(): Op[]; write(ops: Op[]): void }

export const memoryQueue = (initial: Op[] = []): QueueStore => {
  let ops = initial;
  return { read: () => ops, write: (o) => { ops = o; } };
};

/** localStorage-backed queue. Everything read back is validated; failures degrade to an in-memory queue. */
export function localStorageQueue(key: string): QueueStore {
  let fallback: Op[] | null = null;
  return {
    read() {
      if (fallback) return fallback;
      try { const t = window.localStorage.getItem(key); return t ? sanitizeOps(JSON.parse(t)) : []; } catch { return []; }
    },
    write(ops) {
      try { if (ops.length) window.localStorage.setItem(key, JSON.stringify(ops)); else window.localStorage.removeItem(key); fallback = null; }
      catch { fallback = ops; }
    },
  };
}

export interface FlushResult {
  sent: number;
  dropped: { op: Op; reason: string }[];
  remaining: number;
  stopped: null | 'transient' | 'auth';
}

export interface EngineHooks {
  /** Called once per failing operation when the session looks expired. Return true if it was refreshed. */
  refreshSession?: () => Promise<boolean>;
}

export class SyncEngine {
  private inflight: Promise<FlushResult> | null = null;

  constructor(private readonly repo: LearningRepository, private readonly queue: QueueStore, private readonly hooks: EngineHooks = {}) {}

  pending(): number { return this.queue.read().length; }

  enqueue(body: OpBody): Op {
    const op = { ...body, qid: newQid() } as Op;
    this.queue.write(coalesce(this.queue.read(), op));
    return op;
  }

  /** Removes one operation by id (re-reading the queue, so operations added meanwhile are untouched). */
  private remove(qid: string) { this.queue.write(this.queue.read().filter((o) => o.qid !== qid)); }

  private async apply(op: Op): Promise<void> {
    switch (op.t) {
      case 'complete': return this.repo.completeLesson(op.id, op.at);
      case 'uncomplete': return this.repo.uncompleteLesson(op.id);
      case 'quiz': return this.repo.recordQuiz(op.id, op.best, op.total, op.last, op.at);
      case 'day': return this.repo.addStudyDay(op.day);
      case 'bm-': return this.repo.removeBookmark(op.kind, op.id);
      case 'bm+': if (!(await this.repo.addBookmark(op.b))) throw new RepositoryError('bookmarks', 'cannot be mapped to a stored item', 'permanent');
    }
  }

  /** Sends queued operations in order. Safe to call repeatedly and concurrently (single-flight). */
  flush(): Promise<FlushResult> {
    this.inflight ??= this.run().finally(() => { this.inflight = null; });
    return this.inflight;
  }

  private async run(): Promise<FlushResult> {
    const result: FlushResult = { sent: 0, dropped: [], remaining: 0, stopped: null };
    for (;;) {
      const op = this.queue.read()[0];
      if (!op) break;
      let refreshed = false;
      for (;;) {
        try {
          await this.apply(op);
          this.remove(op.qid);
          result.sent += 1;
          break;
        } catch (e) {
          const kind = e instanceof RepositoryError ? e.kind : 'transient';
          if (kind === 'permanent') {
            this.remove(op.qid);
            result.dropped.push({ op, reason: e instanceof Error ? e.message : 'rejected' });
            break;
          }
          if (kind === 'auth' && !refreshed && this.hooks.refreshSession && (await this.hooks.refreshSession().catch(() => false))) { refreshed = true; continue; }
          result.stopped = kind;
          result.remaining = this.pending();
          return result;
        }
      }
    }
    result.remaining = this.pending();
    return result;
  }

  /**
   * Make this device match the account: flush, load, then re-apply anything queued during the load.
   * Returns null when it could not complete (offline etc.), in which case the caller keeps local state.
   */
  async pull(local: LearningState): Promise<{ state: LearningState; flush: FlushResult } | { state: null; flush: FlushResult; stopped: 'transient' | 'auth' | 'permanent' }> {
    const flush = await this.flush();
    if (flush.stopped) return { state: null, flush, stopped: flush.stopped };
    try {
      const remote = await this.repo.load();
      const state = applyOps({ ...remote, recent: local.recent, ...(local.daily ? { daily: local.daily } : {}) }, this.queue.read());
      return { state, flush };
    } catch (e) {
      const kind = e instanceof RepositoryError ? e.kind : 'transient';
      return { state: null, flush, stopped: kind };
    }
  }

  clear() { this.queue.write([]); }
}
