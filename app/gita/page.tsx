import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { gitaTexts } from '@/lib/content/gita';

export const metadata: Metadata = {
  title: 'Gita Library',
  description: 'The Bhagavad Gita and other Gitas: Ashtavakra, Uddhava, Avadhuta, Devi, Shiva, Guru and Ganesha Gita, each with its own context.',
};

export default function GitaLibrary() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'Gita Library' }]} kicker="MANY CONVERSATIONS, MANY PATHS" title="Gita Library" sanskrit="गीता"
        lede="“Gita” means “song”. Several traditions have teaching-dialogues of this name. They differ in origin, speakers, outlook and structure, so each is presented in its own context." />
      <section className="section tight">
        <div className="container">
          <ul className="d-cards">
            {gitaTexts.map((g) => (
              <li key={g.slug}>
                <Link href={`/gita/${g.slug}`} className="d-card">
                  <span className="darshana-number">{g.classification.join(' · ').toUpperCase()}</span>
                  <h2>{g.name} <span lang="sa">{g.sanskrit}</span></h2>
                  <p className="d-focus">{g.location}</p>
                  <p className="d-q">{g.tagline}</p>
                  <p className="note-small">{g.chapters ? `${g.chapters} chapters` : 'Chapter count: not yet verified'}</p>
                  <StatusBadge status={g.detailStatus} />
                  <span className="card-link" style={{ marginTop: 16 }}>Open {g.name} <ArrowRight size={15} aria-hidden="true" /></span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="note-small pad">The Bhagavad Gita has a full chapter-by-chapter study path. For the other Gitas, only widely stated context is shown until details are checked against identified editions. Further Gita texts will be added once their sources are identified.</p>
        </div>
      </section>
    </>
  );
}
