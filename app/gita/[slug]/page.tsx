import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import GitaDetail from '@/components/GitaDetail';
import { getGita, gitaTexts } from '@/lib/content/gita';

type Props = { params: { slug: string } };

export const dynamicParams = false;
export function generateStaticParams() {
  return gitaTexts.filter((g) => g.slug !== 'bhagavad-gita').map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const g = getGita(params.slug);
  return g ? { title: g.name, description: g.intro } : {};
}

export default function GitaPage({ params }: Props) {
  const g = getGita(params.slug);
  if (!g || g.slug === 'bhagavad-gita') notFound();
  return (
    <>
      <PageHeader crumbs={[{ label: 'Gita Library', href: '/gita' }, { label: g.name }]} kicker={g.classification.join(' · ').toUpperCase()} title={g.name} sanskrit={g.sanskrit} lede={g.tagline}>
        <div className="page-badges"><StatusBadge status={g.detailStatus} /></div>
      </PageHeader>
      <GitaDetail g={g}>
        <h2>Chapter list</h2>
        <p className="muted">The chapter list for this text has not been verified against an identified edition and is not shown. It will be added with its source.</p>
      </GitaDetail>
    </>
  );
}
