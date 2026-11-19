import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import VerseReader from '@/components/VerseReader';
import { getChapter, getVerseStudy, verseStudies } from '@/lib/content/gita';

type Props = { params: { chapter: string; verse: string } };

export const dynamicParams = false;
export function generateStaticParams() {
  return verseStudies.map((v) => ({ chapter: String(v.chapter), verse: String(v.verse) }));
}

export function generateMetadata({ params }: Props): Metadata {
  const v = getVerseStudy(Number(params.chapter), Number(params.verse));
  return v ? { title: v.reference, description: v.brief.mean } : {};
}

export default function VersePage({ params }: Props) {
  const v = getVerseStudy(Number(params.chapter), Number(params.verse));
  const c = getChapter(Number(params.chapter));
  if (!v || !c) notFound();
  return (
    <>
      <PageHeader crumbs={[{ label: 'Gita Library', href: '/gita' }, { label: 'Bhagavad Gita', href: '/gita/bhagavad-gita' }, { label: `Chapter ${c.number}`, href: `/gita/bhagavad-gita/${c.number}` }, { label: `Verse ${v.verse}` }]}
        kicker={`${c.name.toUpperCase()}`} title={v.reference} />
      <section className="section tight">
        <div className="container narrow">
          <VerseReader v={v} />
          <div className="pager"><Link href={`/gita/bhagavad-gita/${c.number}`}><ArrowLeft size={15} aria-hidden="true" /> Back to chapter {c.number}</Link><span /></div>
        </div>
      </section>
    </>
  );
}
