/** Shapes shared by the browser store, the merge logic and the account repository. No runtime code. */
export type BookmarkKind = 'verse' | 'chapter' | 'scripture' | 'lesson' | 'darshana';

export interface Bookmark { id: string; kind: BookmarkKind; title: string; href: string; addedAt: number }
export interface RecentItem { href: string; title: string; kind: string; at: number }
export interface LessonProgress { completedAt?: number; quiz?: { best: number; total: number; last: number; at: number } }

export interface LearningState {
  version: 1;
  lessons: Record<string, LessonProgress>;
  bookmarks: Bookmark[];
  recent: RecentItem[];
  /** Local calendar days (YYYY-MM-DD) with real study activity. */
  days: string[];
  daily?: { date: string; id: string };
}
