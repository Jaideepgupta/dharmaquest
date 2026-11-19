import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { getCategory, scriptureCategories } from '@/lib/content/scriptures';

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return scriptureCategories.filter((c) => c.slug !== 'darshanas').map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const c = getCategory(params.slug);
  if (!c) return {};
  return { title: c.title, description: c.overview[0], openGraph: { title: `${c.title} · DharmaQuest`, description: c.overview[0] } };
}

export default function ScripturePage({ params }: Props) {
  const c = getCategory(params.slug);
  if (!c || c.slug === 'darshanas') notFound();

  return (
    <>
      <PageHeader crumbs={[{ label: 'Scriptures', href: '/scriptures' }, { label: c.title }]} kicker={c.classification.join(' · ').toUpperCase()} title={c.title} sanskrit={c.sanskrit} lede={c.tagline}>
        <div className="page-badges"><StatusBadge status={c.detailStatus} /></div>
      </PageHeader>

      <section className="section tight">
        <div className="container detail-grid">
          <div className="prose">
            <h2>Overview</h2>
            {c.overview.map((p) => <p key={p}>{p}</p>)}

            {c.items && (
              <>
                <h2>{c.itemsHeading ?? 'Contents'}</h2>
                <ul className="catalog">
                  {c.items.map((i) => (
                    <li key={i.name}>
                      <div><b>{i.name}</b>{i.tag && <span className="chip">{i.tag}</span>}</div>
                      {i.note && <p>{i.note}</p>}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <aside className="side-card" aria-label="About this collection">
            <h2>At a glance</h2>
            <dl>
              <div><dt>Classification</dt><dd>{c.classification.join(', ')}</dd></div>
              <div><dt>Learning content</dt><dd><StatusBadge status={c.detailStatus} /></dd></div>
            </dl>
            {c.notes && c.notes.length > 0 && (
              <>
                <h3>Notes on sources</h3>
                <ul className="notes">{c.notes.map((n) => <li key={n}>{n}</li>)}</ul>
              </>
            )}
            {c.related && (
              <>
                <h3>Related</h3>
                <ul className="related">
                  {c.related.map((r) => <li key={r.href}><Link href={r.href}>{r.label} <ArrowRight size={14} aria-hidden="true" /></Link></li>)}
                </ul>
              </>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
