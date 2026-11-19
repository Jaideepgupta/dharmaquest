import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { GitaText } from '@/lib/content/types';

export default function GitaDetail({ g, children }: { g: GitaText; children?: React.ReactNode }) {
  return (
    <section className="section tight">
      <div className="container detail-grid">
        <div className="prose">
          <h2>Introduction</h2>
          <p>{g.intro}</p>
          <h2>Context</h2>
          <p>{g.context}</p>

          <h2>Speakers</h2>
          <ul className="chips">{g.speakers.map((s) => <li key={s} className="chip">{s}</li>)}</ul>

          <h2>Main themes</h2>
          <ul className="notes spaced">{g.themes.map((t) => <li key={t}>{t}</li>)}</ul>

          <h2>Key teachings</h2>
          <ul className="notes spaced">{g.keyTeachings.map((t) => <li key={t}>{t}</li>)}</ul>

          {children}

          <h2>Related traditions</h2>
          <ul className="chips">{g.relatedTraditions.map((t) => <li key={t} className="chip">{t}</li>)}</ul>

          <h2>References</h2>
          <ul className="notes spaced">{g.references.map((r) => <li key={r}>{r}</li>)}</ul>
        </div>

        <aside className="side-card" aria-label="At a glance">
          <h2>At a glance</h2>
          <dl>
            <div><dt>Classification</dt><dd>{g.classification.join(', ')}</dd></div>
            <div><dt>Where it is found</dt><dd>{g.location}</dd></div>
            <div><dt>Chapters</dt><dd>{g.chapters ?? 'Not yet verified'}</dd></div>
            <div><dt>Verses</dt><dd>{g.verses ? `${g.verses} (traditional count)` : 'Not yet verified'}</dd></div>
            <div><dt>Learning content</dt><dd><StatusBadge status={g.detailStatus} /></dd></div>
          </dl>
          <p className="note-small" style={{ marginTop: 14 }}>{g.structureNote}</p>
          <h3>Related</h3>
          <ul className="related"><li><Link href="/gita">Gita Library <ArrowRight size={14} aria-hidden="true" /></Link></li></ul>
        </aside>
      </div>
    </section>
  );
}
