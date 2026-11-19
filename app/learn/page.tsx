import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import LessonStatus from '@/components/LessonStatus';
import { lessonsByLevel } from '@/lib/learning/lessons';
import { LEVELS } from '@/lib/learning/types';

export const metadata: Metadata = {
  title: 'Learning paths',
  description: 'Beginner, intermediate and advanced reading routes through the DharmaQuest library.',
};

export default function LearnPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'Learn' }]} kicker="LEARN AT YOUR OWN PACE" title="Learning paths"
        lede="Three suggested routes through the library. Each step is a short lesson with a quiz. Levels suggest an order of study and do not rate difficulty. Your progress is saved privately in this browser.">
        <div className="hero-buttons" style={{ marginTop: 22 }}>
          <Link href="/learn/lessons" className="button button-primary">Browse all lessons <ArrowRight size={16} aria-hidden="true" /></Link>
          <Link href="/progress" className="button button-outline">My learning</Link>
        </div>
      </PageHeader>
      <section className="section tight">
        <div className="container paths">
          {LEVELS.map((lv) => (
            <article key={lv.id} id={lv.id} className="path-block">
              <span className="path-level">{lv.label.toUpperCase()}</span>
              <h2>{lv.id === 'beginner' ? 'New to the wisdom' : lv.id === 'intermediate' ? 'Curious explorer' : 'Dedicated student'}</h2>
              <p>{lv.blurb}</p>
              <ol>
                {lessonsByLevel(lv.id).slice(0, 6).map((l, i) => (
                  <li key={l.id}><Link href={`/learn/lessons/${l.id}`}><span className="journey-n" aria-hidden="true">{i + 1}</span><span className="pl-t">{l.title}</span><LessonStatus id={l.id} /><ArrowRight size={15} aria-hidden="true" /></Link></li>
                ))}
              </ol>
              <Link className="text-link dark-link" href={`/learn/lessons#${lv.id}`}>All {lv.label.toLowerCase()} lessons ({lessonsByLevel(lv.id).length}) <ArrowRight size={15} aria-hidden="true" /></Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
