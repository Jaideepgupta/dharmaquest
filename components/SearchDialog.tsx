'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, X, ArrowRight } from 'lucide-react';
import { buildSearchIndex, searchIndex } from '@/lib/content/search';

const KINDS = ['All', 'Scripture', 'Gita', 'Upanishad', 'Darshana', 'Concept', 'Epic', 'Path'] as const;
const SUGGESTIONS = ['Karma', 'Atman', 'Katha', 'Ashtavakra', 'Samkhya', 'Mahavakya'];

export default function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<(typeof KINDS)[number]>('All');
  const index = useMemo(() => buildSearchIndex(), []);
  const results = useMemo(
    () => searchIndex(index, query, kind === 'All' ? undefined : kind).slice(0, 30),
    [index, query, kind],
  );

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      inputRef.current?.focus();
    }
    if (!open && d.open) d.close();
  }, [open]);

  const hasQuery = query.trim().length > 0;

  return (
    <dialog
      ref={dialogRef}
      className="search-dialog"
      aria-labelledby="search-title"
      onClose={onClose}
      onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
    >
      <div className="search-panel">
        <div className="search-head">
          <h2 id="search-title" className="sr-only">Search DharmaQuest</h2>
          <Search size={18} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search scriptures, Gitas, Upanishads, concepts…"
            aria-label="Search DharmaQuest"
            autoComplete="off"
          />
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close search"><X size={18} /></button>
        </div>

        <div className="search-filters" role="group" aria-label="Filter results by type">
          {KINDS.map((k) => (
            <button key={k} type="button" aria-pressed={kind === k} className={kind === k ? 'active' : ''} onClick={() => setKind(k)}>{k}</button>
          ))}
        </div>

        {!hasQuery && (
          <div className="search-suggest">
            <span>Try:</span>
            {SUGGESTIONS.map((s) => <button key={s} type="button" onClick={() => setQuery(s)}>{s}</button>)}
          </div>
        )}

        <div className="search-results" aria-live="polite">
          {results.length === 0 ? (
            <p className="search-empty">
              No results for “{query}”{kind !== 'All' ? ` in ${kind}` : ''}. Try another word, or clear the filter.
            </p>
          ) : (
            <ul>
              {results.map((r) => (
                <li key={`${r.kind}-${r.title}-${r.href}`}>
                  <Link href={r.href} onClick={onClose}>
                    <span className="result-kind">{r.kind}</span>
                    <span className="result-text"><b>{r.title}</b><small>{r.subtitle}</small></span>
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="search-foot">Searches titles, collections, Darshanas and concepts. Verse-level and Sanskrit-word search will arrive as verse content is added.</p>
      </div>
    </dialog>
  );
}
