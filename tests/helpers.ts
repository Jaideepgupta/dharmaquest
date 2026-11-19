import { SupabaseLearningRepository } from '../lib/learning/repository';
import type { LearningState } from '../lib/learning/store-types';
import { applyOps, type OpBody } from '../lib/learning/ops';
import { FakeDb } from './fake-supabase';

export const ME = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const OTHER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

export function world(user = ME) {
  const db = new FakeDb(user);
  db.seed('lessons', ['gita-overview', 'gita-ch1', 'gita-ch2', 'verse-2-47', 'darshana-samkhya', 'ramayana'].map((slug, i) => ({ id: uid(100 + i), slug, title: `Title of ${slug}` })));
  db.seed('scripture_categories', ['bhagavad-gita', 'other-gitas', 'ramayana', 'mahabharata', 'upanishads', 'vedas'].map((slug, i) => ({ id: uid(200 + i), slug, title: `Cat ${slug}` })));
  const cat = (s: string) => uid(200 + ['bhagavad-gita', 'other-gitas', 'ramayana', 'mahabharata', 'upanishads', 'vedas'].indexOf(s));
  db.seed('scriptures', [
    { id: uid(300), slug: 'bhagavad-gita', title: 'Bhagavad Gita', category_id: cat('bhagavad-gita') },
    { id: uid(301), slug: 'ashtavakra-gita', title: 'Ashtavakra Gita', category_id: cat('other-gitas') },
    { id: uid(302), slug: 'ramayana', title: 'Ramayana', category_id: cat('ramayana') },
    { id: uid(303), slug: 'isha-upanishad', title: 'Isha Upanishad', category_id: cat('upanishads') }, // catalogue-only: no page
  ]);
  db.seed('darshanas', [{ id: uid(400), slug: 'samkhya', name: 'Samkhya' }]);
  db.seed('chapters', [1, 2, 3].map((n) => ({ id: uid(500 + n), scripture_id: uid(300), number: n, unit_kind: 'chapter', english_title: `Title ${n}` })));
  db.seed('verses', [{ id: uid(600), scripture_id: uid(300), label: '2.47' }]);
  const repo = new SupabaseLearningRepository(db.client(), user);
  return { db, repo };
}
export const empty = (): LearningState => ({ version: 1, lessons: {}, bookmarks: [], recent: [], days: [] });
export const bm = (kind: LearningState['bookmarks'][number]['kind'], id: string, addedAt = 1000) => ({ kind, id, title: `T ${id}`, href: '/x', addedAt });


/** A device: in-memory "local store" that behaves like lib/learning/store.ts (applies a change, emits an operation). */
export class FakeLocal {
  state: LearningState = empty();
  private listeners = new Set<(op: OpBody) => void>();
  resets = 0;
  get = () => this.state;
  replace = (s: LearningState) => { this.state = s; };
  reset = () => { this.state = empty(); this.resets += 1; };
  subscribeOps = (fn: (op: OpBody) => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  /** A user action: updates local state and emits the same operation the real store would. */
  act(op: OpBody) { this.state = applyOps(this.state, [op]); this.listeners.forEach((l) => l(op)); }
}
