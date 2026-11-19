import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { bhagavadGitaChapters, getChapter, getVerseStudy } from '@/lib/content/gita';

type Props = { params: { chapter: string } };

export const dynamicParams = false;
export function generateStaticParams() {
  return bhagavadGitaChapters.map((c) => ({ chapter: String(c.number) }));
}

export function generateMetadata({ params }: Props): Metadata {
  const c = getChapter(Number(params.chapter));
  return c ? { title: `Bhagavad Gita ${c.number}: ${c.englishTitle}`, description: c.intro } : {};
}

export default function ChapterPage({ params }: Props) {
  const n = Number(params.chapter);
  const c = getChapter(n);
  if (!c) notFound();
  const prev = getChapter(n - 1);
  const next = getChapter(n + 1);

  return (
    <>
      <PageHeader crumbs={[{ label: 'Gita Library', href: '/gita' }, { label: 'Bhagavad Gita', href: '/gita/bhagavad-gita' }, { label: `Chapter ${c.number}` }]}
        kicker={`CHAPTER ${c.number} OF 18 · ${c.verseCount} VERSES`} title={c.englishTitle} sanskrit={c.sanskritName} lede={c.name} />
      <section className="section tight">
        <div className="container detail-grid">
          <div className="prose">
            <h2>Introduction</h2><p>{c.intro}</p>
            <h2>What happens in this chapter</h2><p>{c.happens}</p>
            <h2>Main philosophical message</h2><p>{c.message}</p>
            <p className="note-small">Chapter guides are DharmaQuest summaries. They are not translations or commentary.</p>

            <h2>Important verses</h2>
            <ul className="catalog">
              {c.importantVerses.map((v) => {
                const [ch, vs] = v.ref.split('.').map(Number);
                const study = getVerseStudy(ch, vs);
                return (
                  <li key={v.ref}>
                    <div><b>{study ? <Link href={`/gita/bhagavad-gita/${ch}/${vs}`}>Gita {v.ref}</Link> : `Gita ${v.ref}`}</b>
                      {study ? <span className="chip">Study page</span> : <span className="chip chip-muted">Study page: in preparation</span>}</div>
                    <p>{v.topic}</p>
                  </li>
                );
              })}
            </ul>
          </div>
          <aside className="side-card" aria-label="Key concepts">
            <h2>Key concepts</h2>
            <ul className="chips">{c.concepts.map((k) => <li key={k} className="chip">{k}</li>)}</ul>
            <h3>All chapters</h3>
            <ul className="related"><li><Link href="/gita/bhagavad-gita#chapters">See the eighteen chapters <ArrowRight size={14} aria-hidden="true" /></Link></li></ul>
          </aside>
        </div>
        <div className="container pager">
          {prev ? <Link href={`/gita/bhagavad-gita/${prev.number}`}><ArrowLeft size={15} aria-hidden="true" /> Chapter {prev.number}: {prev.englishTitle}</Link> : <span />}
          {next ? <Link href={`/gita/bhagavad-gita/${next.number}`}>Chapter {next.number}: {next.englishTitle} <ArrowRight size={15} aria-hidden="true" /></Link> : <span />}
        </div>
      </section>
    </>
  );
}
