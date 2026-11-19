import type { LearningState } from './store';
import type { LessonMeta, Level } from './types';

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];
const done = (s: LearningState, id: string) => s.lessons[id]?.completedAt !== undefined;

export function completedCount(s: LearningState, lessons: LessonMeta[]) {
  return lessons.filter((l) => done(s, l.id)).length;
}

/** The level the learner is currently working in: where they most recently completed a lesson. */
export function currentLevel(s: LearningState, lessons: LessonMeta[]): Level {
  let latest: { at: number; level: Level } | null = null;
  for (const l of lessons) {
    const at = s.lessons[l.id]?.completedAt;
    if (at !== undefined && (!latest || at > latest.at)) latest = { at, level: l.level };
  }
  if (!latest) return 'beginner';
  const idx = LEVELS.indexOf(latest.level);
  // If that level is finished, move on to the next level with remaining lessons.
  for (let i = idx; i < LEVELS.length; i++) {
    if (lessons.some((l) => l.level === LEVELS[i] && !done(s, l.id))) return LEVELS[i];
  }
  return latest.level;
}

export function nextLesson(s: LearningState, lessons: LessonMeta[]): LessonMeta | null {
  const lv = currentLevel(s, lessons);
  return (
    lessons.find((l) => l.level === lv && !done(s, l.id)) ??
    lessons.find((l) => !done(s, l.id)) ??
    null
  );
}

/** Deterministic suggestion for a given local date; the first incomplete lesson at or after the day's slot. */
export function pickDaily(s: LearningState, dayNum: number, lessons: LessonMeta[]): LessonMeta {
  const n = lessons.length;
  for (let i = 0; i < n; i++) {
    const l = lessons[(dayNum + i) % n];
    if (!done(s, l.id)) return l;
  }
  return lessons[dayNum % n];
}
