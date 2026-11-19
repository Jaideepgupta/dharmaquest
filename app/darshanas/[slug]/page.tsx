import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { darshanas, getDarshana, vedantaSchools } from '@/lib/content/darshanas';

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

  return (
    <>
      <PageHeader crumbs={[{ label: 'Darshanas', href: '/darshanas' }, { label: d.name }]} kicker={`DARSHANA ${d.number} OF 06`} title={d.name} sanskrit={d.sanskrit} lede={d.focus}>
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
            <h3>Learning content</h3>
            <p><StatusBadge status={d.detailStatus} /></p>
            <p className="note-small">Detailed lessons, quotations from the texts and commentary are added only once sourced from identified editions.</p>
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
