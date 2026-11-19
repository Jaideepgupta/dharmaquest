'use client';

import { Check, Undo2 } from 'lucide-react';
import { completeLesson, uncompleteLesson, useLearning } from '@/lib/learning/store';

export default function LessonActions({ id }: { id: string }) {
  const { state, ready } = useLearning();
  const done = ready && state.lessons[id]?.completedAt !== undefined;
  return (
    <div className="lesson-actions">
      {done ? (
        <>
          <span className="badge badge-ok"><Check size={12} aria-hidden="true" /> Completed</span>
          <button type="button" className="cmp-reset" onClick={() => uncompleteLesson(id)}><Undo2 size={14} aria-hidden="true" /> Mark as not completed</button>
        </>
      ) : (
        <button type="button" className="button button-primary" onClick={() => completeLesson(id)}><Check size={16} aria-hidden="true" /> Mark lesson complete</button>
      )}
    </div>
  );
}
