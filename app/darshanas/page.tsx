import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { darshanas, vedantaSchools } from '@/lib/content/darshanas';

export const metadata: Metadata = {
  title: 'Explore the Six Darshanas',
  description: 'Nyaya, Vaisheshika, Samkhya, Yoga, Purva Mimamsa and Vedanta: the six classical schools of Indian philosophy.',
};

export default function DarshanasPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'Darshanas' }]} kicker="THE BIG QUESTIONS" title="Explore the Six Darshanas" sanskrit="षड्दर्शन"
        lede="The six classical schools of Indian philosophy that accept the authority of the Vedas. Each asks a different core question.">
        <div className="hero-buttons" style={{ marginTop: 22 }}><Link href="/darshanas/compare" className="button button-primary">Compare the schools side by side <ArrowRight size={16} aria-hidden="true" /></Link></div>
      </PageHeader>
      <section className="section tight">
        <div className="container">
          <ul className="d-cards">
            {darshanas.map((d) => (
              <li key={d.slug}>
                <Link href={`/darshanas/${d.slug}`} className="d-card">
                  <span className="darshana-number">{d.number}</span>
                  <h2>{d.name} <span lang="sa">{d.sanskrit}</span></h2>
                  <p className="d-focus">{d.focus}</p>
                  <p className="d-q">“{d.coreQuestion}”</p>
                  <span className="card-link">Open {d.name} <ArrowRight size={15} aria-hidden="true" /></span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="prose wide">
            <h2 id="vedanta-schools">Vedanta sub-schools</h2>
            <p>Within Vedanta there are several traditions. These are sub-schools of one Darshana and not six further Darshanas. They differ, among other things, on how the individual Self relates to Brahman.</p>
          </div>
          <ul className="catalog two-col">
            {vedantaSchools.map((s) => (
              <li key={s.name}><div><b>{s.name}</b><span className="chip">{s.founder}</span></div><p>{s.summary}</p></li>
            ))}
          </ul>
          <p className="note-small pad">These summaries are deliberately brief. For a fuller side-by-side view, use the comparison.</p>
          <p className="cta-row"><Link href="/darshanas/compare?set=vedanta" className="button button-outline">Compare the Vedanta sub-schools <ArrowRight size={16} aria-hidden="true" /></Link></p>
        </div>
      </section>
    </>
  );
}
