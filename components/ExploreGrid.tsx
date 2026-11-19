'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { categoryHref, scriptureCategories } from '@/lib/content/scriptures';

const filters = [
  { label: 'All', slugs: null },
  { label: 'Vedic texts', slugs: ['vedas', 'upanishads'] },
  { label: 'Gitas', slugs: ['bhagavad-gita', 'other-gitas'] },
  { label: 'Epics & Puranas', slugs: ['ramayana', 'mahabharata', 'puranas'] },
  { label: 'Philosophy & Yoga', slugs: ['darshanas', 'yoga-and-spirituality'] },
] as const;

export default function ExploreGrid({ limit }: { limit?: number }) {
  const [filter, setFilter] = useState<string>('All');
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const f = filters.find((x) => x.label === filter);
    const q = query.trim().toLowerCase();
    return scriptureCategories.filter((c) => {
      const inFilter = !f?.slugs || (f.slugs as readonly string[]).includes(c.slug);
      const inQuery = !q || `${c.title} ${c.tagline} ${c.sanskrit ?? ''} ${c.classification.join(' ')}`.toLowerCase().includes(q);
      return inFilter && inQuery;
    });
  }, [filter, query]);

  const shown = limit ? items.slice(0, limit) : items;

  return (
    <>
      <div className="explore-toolbar">
        <div className="category-tabs" role="group" aria-label="Filter collections">
          {filters.map((f) => (
            <button key={f.label} type="button" aria-pressed={filter === f.label} className={filter === f.label ? 'active' : ''} onClick={() => setFilter(f.label)}>{f.label}</button>
          ))}
        </div>
        <label className="search-box">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Filter collections</span>
          <input id="scripture-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter collections…" />
        </label>
      </div>
      <p className="results-count" aria-live="polite">{items.length} {items.length === 1 ? 'collection' : 'collections'}</p>
      <div className="scripture-grid">
        {shown.map((item, i) => (
          <article className="scripture-card" key={item.slug}>
            <div className={`card-art ${item.tone}`} aria-hidden="true">
              <span className="card-art-symbol">{item.glyph}</span>
              <span className="card-index">{String(i + 1).padStart(2, '0')}</span>
              <span className="card-art-caption">{item.classification[0].toUpperCase()}</span>
            </div>
            <div className="scripture-card-body">
              <div className="card-meta">{item.tagline}</div>
              <h3>{item.title}</h3>
              {item.sanskrit && <p className="card-subtitle" lang="sa">{item.sanskrit}</p>}
              <p className="card-description">{item.overview[0].split('. ')[0].replace(/\.$/, '')}.</p>
              <Link href={categoryHref(item.slug)} className="card-link">
                Explore {item.title} <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
        {shown.length === 0 && <div className="empty-state">No collections match “{query}”. Try another word or choose All.</div>}
      </div>
    </>
  );
}
