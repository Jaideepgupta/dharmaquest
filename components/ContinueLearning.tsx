'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLearning } from '@/lib/learning/store';
import { completedCount, nextLesson } from '@/lib/learning/recommend';
import type { LessonMeta } from '@/lib/learning/types';

/** Shows the visitor's real progress when there is some; otherwise the sample journey passed as children. */
export default function ContinueLearning({ meta, children }: { meta: LessonMeta[]; children: React.ReactNode }) {
  const { state, ready } = useLearning();
  const done = ready ? completedCount(state, meta) : 0;
  if (!ready || done === 0) return <>{children}</>;
  const next = nextLesson(state, meta);
  return (
    <div className="resume">
      <p className="resume-count"><b>{done}</b> of {meta.length} lessons completed</p>
      {next ? (
        <Link className="lesson-link" href={`/learn/lessons/${next.id}`}>
          <span><b>Next: {next.title}</b><small>{next.collection} · about {next.minutes} min</small></span><ArrowRight size={16} aria-hidden="true" />
        </Link>
      ) : <p>You have completed every lesson.</p>}
      <Link className="text-link dark-link" href="/progress">See all your progress <ArrowRight size={15} aria-hidden="true" /></Link>
    </div>
  );
}
