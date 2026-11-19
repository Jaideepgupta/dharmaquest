import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Learning paths',
  description: 'Beginner, intermediate and advanced reading routes through the DharmaQuest library.',
};

const paths = [
  { id: 'beginner', level: 'Beginner', title: 'New to the wisdom', blurb: 'Build a foundation: the main texts, the big questions and a feel for how the traditions fit together.',
    steps: [
      { label: 'Bhagavad Gita: overview and chapters', href: '/scriptures/bhagavad-gita' },
      { label: 'The Upanishads: a first look', href: '/scriptures/upanishads' },
      { label: 'Ramayana: the seven Kandas', href: '/scriptures/ramayana' },
      { label: 'The Six Darshanas: the core questions', href: '/darshanas' },
    ] },
  { id: 'intermediate', level: 'Intermediate', title: 'Curious explorer', blurb: 'Connect texts and compare ideas across traditions.',
    steps: [
      { label: 'Mahabharata and its Parvas', href: '/scriptures/mahabharata' },
      { label: 'Other Gitas: different voices, different contexts', href: '/scriptures/other-gitas' },
      { label: 'Samkhya and Yoga', href: '/darshanas/samkhya' },
      { label: 'The Vedas and their four layers', href: '/scriptures/vedas' },
    ] },
  { id: 'advanced', level: 'Advanced', title: 'Dedicated student', blurb: 'Study philosophical traditions and how they read the same sources.',
    steps: [
      { label: 'Vedanta and its sub-schools', href: '/darshanas/vedanta' },
      { label: 'Nyaya: logic and the Pramanas', href: '/darshanas/nyaya' },
      { label: 'Purva Mimamsa: interpretation and Dharma', href: '/darshanas/purva-mimamsa' },
      { label: 'Puranas and traditions', href: '/scriptures/puranas' },
    ] },
];

export default function LearnPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'Learn' }]} kicker="LEARN AT YOUR OWN PACE" title="Learning paths"
        lede="Three suggested routes through the library. These are reading recommendations. Structured lessons with quizzes, bookmarks and progress tracking are in preparation." />
      <section className="section tight">
        <div className="container paths">
          {paths.map((p) => (
            <article key={p.id} id={p.id} className="path-block">
              <span className="path-level">{p.level.toUpperCase()}</span>
              <h2>{p.title}</h2>
              <p>{p.blurb}</p>
              <ol>
                {p.steps.map((s, i) => (
                  <li key={s.href}><Link href={s.href}><span className="journey-n" aria-hidden="true">{i + 1}</span>{s.label}<ArrowRight size={15} aria-hidden="true" /></Link></li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
