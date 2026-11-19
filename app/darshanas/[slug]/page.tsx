import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import BookmarkButton from '@/components/BookmarkButton';
import RecentTracker from '@/components/RecentTracker';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { darshanas, getDarshana, vedantaSchools } from '@/lib/content/darshanas';
import { darshanaComparison, relations, thinkers } from '@/lib/content/comparison';

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return darshanas.map((d) => ({ slug: d.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const d = getDarshana(params.slug);
  if (!d) return {};
  return { title: `${d.name} Darshana`, description: d.summary };
}

export default function DarshanaPage({ params }: Props) {
  const d = getDarshana(params.slug);
  if (!d) notFound();
  const i = darshanas.findIndex((x) => x.slug === d.slug);
  const prev = darshanas[i - 1];
  const next = darshanas[i + 1];
  const row = darshanaComparison.entries.find((e) => e.id === d.slug);
  const answers = ['reality', 'self', 'liberation', 'knowledge'] as const;
  const label = (id: string) => darshanaComparison.dimensions.find((x) => x.id === id)?.label ?? id;

  return (
    <>
      <RecentTracker href={`/darshanas/${d.slug}`} title={`${d.name} Darshana`} kind="Darshana" />
      <PageHeader crumbs={[{ label: 'Darshanas', href: '/darshanas' }, { label: d.name }]} kicker={`DARSHANA ${d.number} OF 06`} title={d.name} sanskrit={d.sanskrit} lede={d.focus}>
        <div className="page-badges"><BookmarkButton id={d.slug} kind="darshana" title={`${d.name} Darshana`} href={`/darshanas/${d.slug}`} /> <Link href={`/learn/lessons/darshana-${d.slug}`} className="chip">Lesson and quiz</Link></div>
        <blockquote className="core-q"><span>Core question</span>{d.coreQuestion}</blockquote>
      </PageHeader>

      <section className="section tight">
        <div className="container detail-grid">
          <div className="prose">
            <h2>Overview</h2>
            <p>{d.summary}</p>

            <h2>Key concepts</h2>
            <ul className="catalog">
              {d.keyConcepts.map((k) => <li key={k.term}><div><b>{k.term}</b></div><p>{k.meaning}</p></li>)}
            </ul>

            {row && (
              <>
                <h2>How {d.name} answers the big questions</h2>
                <dl className="answers">
                  {answers.map((k) => <div key={k}><dt>{label(k)}</dt><dd>{row.cells[k]}</dd></div>)}
                </dl>
                <h2>Texts</h2>
                <p>{row.cells.texts}</p>
                <p className="note-small">Summaries are DharmaQuest’s own, based on standard scholarly outlines. They are not quotations from the texts.</p>
              </>
            )}

            {thinkers[d.slug] && (
              <>
                <h2>Major thinkers</h2>
                <ul className="catalog">{thinkers[d.slug].map((t) => <li key={t.name}><div><b>{t.name}</b></div><p>{t.note}</p></li>)}</ul>
              </>
            )}

            {relations[d.slug] && (
              <>
                <h2>Relation to other schools</h2>
                {relations[d.slug].map((r) => <p key={r}>{r}</p>)}
              </>
            )}

            <div className="cta-row">
              <Link href={`/darshanas/compare${d.slug === 'vedanta' ? '?set=vedanta' : ''}`} className="button button-primary">{d.slug === 'vedanta' ? 'Compare the Vedanta sub-schools' : `Compare ${d.name} with other schools`} <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>

            {d.slug === 'vedanta' && (
              <>
                <h2>Sub-schools of Vedanta</h2>
                <ul className="catalog">
                  {vedantaSchools.map((s) => <li key={s.name}><div><b>{s.name}</b><span className="chip">{s.founder}</span></div><p>{s.summary}</p></li>)}
                </ul>
              </>
            )}
          </div>

          <aside className="side-card" aria-label="About this Darshana">
            <h2>Foundational text</h2>
            <p className="ft"><b>{d.foundationalText}</b><br />{d.foundationalAttribution}</p>
            <h3>Content status</h3>
            <dl>
              <div><dt>Overview and comparison</dt><dd><StatusBadge status="published" /></dd></div>
              <div><dt>Detailed lessons and quotations from the texts</dt><dd><StatusBadge status={d.detailStatus} /></dd></div>
            </dl>
            <p className="note-small" style={{ marginTop: 12 }}>Quotations and commentary are added only once sourced from identified editions.</p>
            {d.notes && <ul className="notes">{d.notes.map((n) => <li key={n}>{n}</li>)}</ul>}
          </aside>
        </div>

        <div className="container pager">
          {prev ? <Link href={`/darshanas/${prev.slug}`}><ArrowLeft size={15} aria-hidden="true" /> {prev.name}</Link> : <span />}
          {next ? <Link href={`/darshanas/${next.slug}`}>{next.name} <ArrowRight size={15} aria-hidden="true" /></Link> : <span />}
        </div>
      </section>
    </>
  );
}
