'use client';

import { Check } from 'lucide-react';
import { useLearning } from '@/lib/learning/store';

export default function LessonStatus({ id }: { id: string }) {
  const { state, ready } = useLearning();
  const p = ready ? state.lessons[id] : undefined;
  if (!p) return null;
  return (
    <span className="ls">
      {p.completedAt !== undefined && <span className="badge badge-ok"><Check size={12} aria-hidden="true" /> Completed</span>}
      {p.quiz && <span className="badge badge-quiz">Quiz {p.quiz.best}/{p.quiz.total}</span>}
    </span>
  );
}
