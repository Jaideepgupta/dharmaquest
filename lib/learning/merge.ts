/**
 * Merging two learning states (e.g. this browser's and the account's) when someone signs in.
 *
 * Laws, verified by property tests in tests/merge.test.ts:
 *  - commutative:  merge(a, b) = merge(b, a)       (the order devices sync in never matters)
 *  - associative:  merge(merge(a, b), c) = merge(a, merge(b, c))
 *  - idempotent:   merge(a, a) = a                 (syncing again changes nothing)
 *  - monotonic:    nothing the user earned is lost (completions, best scores, bookmarks, study days)
 *
 * To keep those laws, merge is a pure union with total-order tie-breaks and applies NO size limits.
 * Limits are a separate step (applyLimits) run just before persisting; truncating inside the merge
 * would discard information a later merge needs and break associativity.
 *
 * Quiz scores: the merged record is the single "best" record by (score ratio, quiz length, best,
 * time, last). So `last` means "the last score of the attempt that produced the best result", not
 * necessarily the most recent attempt overall. The dashboard shows only the best score.
 */
import type { Bookmark, LearningState, LessonProgress, RecentItem } from './store-types';

export const LIMITS = { bookmarks: 500, recent: 8, days: 800 } as const;

type Quiz = NonNullable<LessonProgress['quiz']>;

/** Total order on quiz records. Cross-multiplies to compare best/total exactly (no floating point). */
function quizCmp(a: Quiz, b: Quiz): number {
  return a.best * b.total - b.best * a.total || a.total - b.total || a.best - b.best || a.at - b.at || a.last - b.last;
}
const betterQuiz = (a?: Quiz, b?: Quiz): Quiz | undefined => (!a ? b && { ...b } : !b ? { ...a } : { ...(quizCmp(a, b) >= 0 ? a : b) });

function mergeLesson(a?: LessonProgress, b?: LessonProgress): LessonProgress {
  const out: LessonProgress = {};
  const done = [a?.completedAt, b?.completedAt].filter((x): x is number => x !== undefined);
  if (done.length) out.completedAt = Math.min(...done); // the earliest completion is the true one
  const quiz = betterQuiz(a?.quiz, b?.quiz);
  if (quiz) out.quiz = quiz;
  return out;
}

const bmKey = (b: Pick<Bookmark, 'kind' | 'id'>) => `${b.kind}:${b.id}`;
const bmOrder = (x: Bookmark, y: Bookmark) => y.addedAt - x.addedAt || bmKey(x).localeCompare(bmKey(y));

export function mergeStates(a: LearningState, b: LearningState): LearningState {
  const lessons: LearningState['lessons'] = {};
  for (const id of new Set([...Object.keys(a.lessons), ...Object.keys(b.lessons)])) {
    const m = mergeLesson(a.lessons[id], b.lessons[id]);
    if (m.completedAt !== undefined || m.quiz) lessons[id] = m;
  }

  // Bookmarks: union by (kind, id); the earliest save time wins; ties broken by title.
  const marks = new Map<string, Bookmark>();
  for (const x of [...a.bookmarks, ...b.bookmarks]) {
    const prev = marks.get(bmKey(x));
    if (!prev || x.addedAt < prev.addedAt || (x.addedAt === prev.addedAt && x.title < prev.title)) marks.set(bmKey(x), x);
  }

  // Recent: the latest visit per page.
  const pages = new Map<string, RecentItem>();
  for (const x of [...a.recent, ...b.recent]) {
    const prev = pages.get(x.href);
    if (!prev || x.at > prev.at || (x.at === prev.at && x.title < prev.title)) pages.set(x.href, x);
  }

  const daily = [a.daily, b.daily].filter((d): d is NonNullable<LearningState['daily']> => !!d)
    .sort((x, y) => y.date.localeCompare(x.date) || y.id.localeCompare(x.id))[0];

  return {
    version: 1,
    lessons,
    bookmarks: [...marks.values()].sort(bmOrder),
    recent: [...pages.values()].sort((x, y) => y.at - x.at || x.href.localeCompare(y.href)),
    days: Array.from(new Set([...a.days, ...b.days])).sort(),
    ...(daily ? { daily: { ...daily } } : {}),
  };
}

/** Deterministic size limits, applied before persisting (the database enforces the bookmark cap too). */
export function applyLimits(s: LearningState): LearningState {
  return {
    ...s,
    bookmarks: [...s.bookmarks].sort(bmOrder).slice(0, LIMITS.bookmarks),
    recent: [...s.recent].sort((x, y) => y.at - x.at || x.href.localeCompare(y.href)).slice(0, LIMITS.recent),
    days: [...s.days].sort().slice(-LIMITS.days),
  };
}
