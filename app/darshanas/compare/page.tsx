import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import ComparisonTable from '@/components/ComparisonTable';
import { compareSets, FURTHER_READING } from '@/lib/content/comparison';

export const metadata: Metadata = {
  title: 'Compare the Darshanas',
  description: 'Compare the six classical Darshanas, and the Vedanta sub-schools, side by side: view of reality, the Self, liberation, sources of knowledge, texts and thinkers.',
};

export default function ComparePage() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'Darshanas', href: '/darshanas' }, { label: 'Compare' }]} kicker="SIDE BY SIDE" title="Compare the Darshanas"
        lede="See how the schools answer the same questions. Choose which to compare. Vedanta’s sub-schools have their own comparison, because they are traditions within one Darshana." />
      <section className="section tight">
        <div className="container">
          <ComparisonTable sets={compareSets} />

          <div className="prose wide">
            <h2>About these summaries</h2>
            <p>The cells are DharmaQuest’s own plain-language summaries of widely stated classical positions. They are not quotations from the texts, and they do not replace reading the texts and their commentaries. Where a school’s positions changed over time or differ between its thinkers, that is noted.</p>
            <h2>Further reading</h2>
            <ul className="notes spaced">{FURTHER_READING.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
        </div>
      </section>
    </>
  );
}
