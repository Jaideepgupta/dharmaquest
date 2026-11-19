import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Our approach',
  description: 'How DharmaQuest handles sources, translations, interpretations and different traditions.',
};

const principles = [
  ['Every verse has a source', 'Each verse shown on DharmaQuest names the text and location it comes from. We do not write or reconstruct Sanskrit passages.'],
  ['Translators are named', 'A translation is shown only with its translator identified. Where we do not yet have a verified public-domain or licensed translation, the page says “Content under review”.'],
  ['Text and commentary are kept apart', 'Scripture, traditional commentary and modern interpretation are labelled separately, so an interpretation is never presented as a statement of the text.'],
  ['Texts are classified accurately', 'Shruti, Smriti, Itihasa, Purana and philosophical literature are distinct categories, and each collection shows its classification.'],
  ['Schools are credited', 'Where traditions interpret a teaching differently, each reading is attributed to the school that holds it.'],
  ['Uncertainty is stated', 'Where dates, authorship or counts are disputed or unverified, we say so rather than choosing one.'],
  ['Traditions stay separate', 'DharmaQuest begins with Sanatan Dharma. If other traditions are added, each will have its own scriptures and be presented in its own terms, and never merged with another.'],
];

export default function AboutPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'Our approach' }]} kicker="A THOUGHTFUL WAY TO LEARN" title="Respect the source. Make room for inquiry."
        lede="DharmaQuest is an independent learning project. These are the rules we follow when adding content." />
      <section className="section tight">
        <div className="container">
          <ol className="principles">
            {principles.map(([t, d], i) => (
              <li key={t}><span className="journey-n" aria-hidden="true">{i + 1}</span><div><h2>{t}</h2><p>{d}</p></div></li>
            ))}
          </ol>
          <p className="note-small pad">This site is a learning aid and does not replace study with a teacher or the texts themselves.</p>
        </div>
      </section>
    </>
  );
}
