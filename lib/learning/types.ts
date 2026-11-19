export type Level = 'beginner' | 'intermediate' | 'advanced';

export interface LessonSection { heading: string; paragraphs?: string[]; bullets?: string[] }

export interface Lesson {
  id: string;
  title: string;
  level: Level;
  collection: string;
  summary: string;
  sections: LessonSection[];
  readMore: { label: string; href: string }[];
  quizId?: string;
  minutes: number;
}

export interface LessonMeta { id: string; title: string; level: Level; collection: string; minutes: number }

export type Question =
  | { type: 'mcq' | 'teaching'; prompt: string; options: string[]; answer: number; explanation: string }
  | { type: 'tf'; prompt: string; answer: boolean; explanation: string }
  | { type: 'match'; prompt: string; pairs: { left: string; right: string }[]; explanation: string };

export interface Quiz { id: string; title: string; questions: Question[] }

export const LEVELS: { id: Level; label: string; blurb: string }[] = [
  { id: 'beginner', label: 'Beginner', blurb: 'Foundations: the main texts and the first big questions.' },
  { id: 'intermediate', label: 'Intermediate', blurb: 'Connect texts and compare ideas across traditions.' },
  { id: 'advanced', label: 'Advanced', blurb: 'Philosophical traditions and how they read the same sources.' },
];
