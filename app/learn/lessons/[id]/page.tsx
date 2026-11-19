import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import BookmarkButton from '@/components/BookmarkButton';
import RecentTracker from '@/components/RecentTracker';
import LessonActions from '@/components/LessonActions';
import LessonStatus from '@/components/LessonStatus';
import QuizRunner from '@/components/QuizRunner';
import { getLesson, lessons } from '@/lib/learning/lessons';
import { getQuiz } from '@/lib/learning/quizzes';
import { LEVELS } from '@/lib/learning/types';

type Props = { params: { id: string } };

export const dynamicParams = false;
export function generateStaticParams() { return lessons.map((l) => ({ id: l.id })); }
export function generateMetadata({ params }: Props): Metadata {
  const l = getLesson(params.id);
  return l ? { title: l.title, description: l.summary } : {};
}

export default function LessonPage({ params }: Props) {
  const l = getLesson(params.id);
  if (!l) notFound();
  const i = lessons.findIndex((x) => x.id === l.id);
  const prev = lessons[i - 1];
  const next = lessons[i + 1];
  const quiz = l.quizId ? getQuiz(l.quizId) : undefined;
  const level = LEVELS.find((x) => x.id === l.level)!;
  const href = `/learn/lessons/${l.id}`;

  return (
    <>
      <RecentTracker href={href} title={l.title} kind="Lesson" />
      <PageHeader crumbs={[{ label: 'Learn', href: '/learn' }, { label: 'Lessons', href: '/learn/lessons' }, { label: l.title }]} kicker={`${level.label.toUpperCase()} · ${l.collection.toUpperCase()}`} title={l.title} lede={l.summary}>
        <div className="page-badges"><span className="chip">About {l.minutes} min</span> <LessonStatus id={l.id} /> <BookmarkButton id={l.id} kind="lesson" title={l.title} href={href} /></div>
      </PageHeader>
      <section className="section tight">
        <div className="container narrow">
          <article className="prose lesson-body">
            {l.sections.map((s) => (
              <section key={s.heading}>
                <h2>{s.heading}</h2>
                {s.paragraphs?.map((p) => <p key={p}>{p}</p>)}
                {s.bullets && <ul className="notes spaced">{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
              </section>
            ))}
            <p className="note-small">Lessons are DharmaQuest summaries of the library content. They are not translations or commentary.</p>
          </article>

          <div className="read-more">
            <h2>Go deeper</h2>
            <ul className="related">{l.readMore.map((r) => <li key={r.href}><Link href={r.href}>{r.label} <ArrowRight size={14} aria-hidden="true" /></Link></li>)}</ul>
          </div>

          <div className="quiz-wrap">
            <h2 className="quiz-title">Check your understanding</h2>
            {quiz ? <QuizRunner key={l.id} quiz={quiz} lessonId={l.id} /> : <p className="muted">A quiz for this lesson is in preparation.</p>}
          </div>

          <div className="complete-row"><LessonActions id={l.id} /></div>

          <div className="pager">
            {prev ? <Link href={`/learn/lessons/${prev.id}`}><ArrowLeft size={15} aria-hidden="true" /> {prev.title}</Link> : <span />}
            {next ? <Link href={`/learn/lessons/${next.id}`}>{next.title} <ArrowRight size={15} aria-hidden="true" /></Link> : <span />}
          </div>
        </div>
      </section>
    </>
  );
}
