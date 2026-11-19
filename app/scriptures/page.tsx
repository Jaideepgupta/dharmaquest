import type { Metadata } from 'next';
import ExploreGrid from '@/components/ExploreGrid';
import PageHeader from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Scriptures',
  description: 'Browse the Vedas, Upanishads, Bhagavad Gita, other Gitas, Ramayana, Mahabharata, Puranas, Darshanas and yoga texts.',
};

export default function ScripturesPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'Scriptures' }]} kicker="THE LIBRARY" title="Scriptures"
        lede="Nine collections from the Sanatan Dharma tradition. Each is kept distinct, with its classification and context shown." />
      <section className="section tight">
        <div className="container"><ExploreGrid /></div>
      </section>
    </>
  );
}
