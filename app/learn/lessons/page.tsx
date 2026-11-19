import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import LessonStatus from '@/components/LessonStatus';
import { lessonsByLevel } from '@/lib/learning/lessons';
import { LEVELS } from '@/lib/learning/types';

export const metadata: Metadata = {
  title: 'Lessons',
  description: 'Short lessons with quizzes on the Bhagavad Gita, the Upanishads, the Darshanas and more.',
};

export default function LessonsPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'Learn', href: '/learn' }, { label: 'Lessons' }]} kicker="SHORT LESSONS" title="Lessons"
        lede="Each lesson is a few minutes of reading drawn from the library, with a link to go deeper. Most end with a short quiz. Levels suggest an order of study and do not rate difficulty." />
      <section className="section tight">
        <div className="container">
          {LEVELS.map((lv) => (
            <div key={lv.id} className="lesson-level" id={lv.id}>
              <h2>{lv.label}</h2>
              <p className="muted">{lv.blurb}</p>
              <ul className="lesson-grid">
                {lessonsByLevel(lv.id).map((l) => (
                  <li key={l.id}>
                    <Link href={`/learn/lessons/${l.id}`} className="lesson-card">
                      <span className="darshana-number">{l.collection.toUpperCase()}</span>
                      <h3>{l.title}</h3>
                      <p>{l.summary}</p>
                      <span className="lesson-meta">About {l.minutes} min · {l.quizId ? 'Quiz included' : 'Quiz in preparation'}</span>
                      <LessonStatus id={l.id} />
                      <span className="card-link">Open lesson <ArrowRight size={15} aria-hidden="true" /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
