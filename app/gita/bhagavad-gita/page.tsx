import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import GitaDetail from '@/components/GitaDetail';
import { bhagavadGitaChapters, getGita } from '@/lib/content/gita';

const g = getGita('bhagavad-gita')!;

export const metadata: Metadata = { title: 'Bhagavad Gita', description: g.intro };

export default function BhagavadGita() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'Gita Library', href: '/gita' }, { label: 'Bhagavad Gita' }]} kicker="SMRITI · ITIHASA" title={g.name} sanskrit={g.sanskrit} lede={g.tagline}>
        <div className="page-badges"><StatusBadge status="published" /> <span className="note-small" style={{ margin: 0 }}>Chapter guides are published. Verse-level study is available for verse 2.47, with more verses to follow as sources are verified.</span></div>
        <div className="hero-buttons" style={{ marginTop: 22 }}>
          <Link href="/gita/bhagavad-gita/1" className="button button-primary">Start learning <ArrowRight size={16} aria-hidden="true" /></Link>
          <Link href="/gita/bhagavad-gita/2/47" className="button button-outline">Read verse 2.47</Link>
        </div>
      </PageHeader>
      <GitaDetail g={g}>
        <h2 id="chapters">The eighteen chapters</h2>
        <ol className="chapter-list">
          {bhagavadGitaChapters.map((c) => (
            <li key={c.number}>
              <Link href={`/gita/bhagavad-gita/${c.number}`}>
                <span className="journey-n" aria-hidden="true">{c.number}</span>
                <span className="ch-text"><b>{c.name}</b><span lang="sa" className="ch-sa">{c.sanskritName}</span><small>{c.englishTitle} · {c.verseCount} verses</small></span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
        <p className="note-small">English titles are short DharmaQuest labels. Verse counts follow the commonly printed recension.</p>
      </GitaDetail>
    </>
  );
}
