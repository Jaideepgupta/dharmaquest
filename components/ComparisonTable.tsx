'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import type { CompareSet } from '@/lib/content/types';

export default function ComparisonTable({ sets }: { sets: CompareSet[] }) {
  const [setId, setSetId] = useState<CompareSet['id']>(sets[0].id);
  const [schools, setSchools] = useState<string[]>(sets[0].entries.map((e) => e.id));
  const [rows, setRows] = useState<string[]>(sets[0].dimensions.map((d) => d.id));

  const set = useMemo(() => sets.find((s) => s.id === setId) ?? sets[0], [sets, setId]);

  // Restore a shared comparison from the URL.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const wanted = sets.find((s) => s.id === q.get('set'));
    if (!wanted) return;
    setSetId(wanted.id);
    const ids = (q.get('schools') ?? '').split(',').filter((id) => wanted.entries.some((e) => e.id === id));
    setSchools(ids.length >= 2 ? ids : wanted.entries.map((e) => e.id));
    setRows(wanted.dimensions.map((d) => d.id));
  }, [sets]);

  const sync = useCallback((id: string, picked: string[], all: number) => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('set', id);
      if (picked.length === all) url.searchParams.delete('schools');
      else url.searchParams.set('schools', picked.join(','));
      window.history.replaceState(null, '', url);
    } catch { /* ignore */ }
  }, []);

  const chooseSet = (next: CompareSet) => {
    setSetId(next.id);
    const all = next.entries.map((e) => e.id);
    setSchools(all);
    setRows(next.dimensions.map((d) => d.id));
    sync(next.id, all, all.length);
  };

  const toggleSchool = (id: string) => {
    const next = schools.includes(id) ? schools.filter((s) => s !== id) : set.entries.map((e) => e.id).filter((x) => x === id || schools.includes(x));
    if (next.length < 2) return; // a comparison needs at least two
    setSchools(next);
    sync(set.id, next, set.entries.length);
  };

  const toggleRow = (id: string) => {
    const next = rows.includes(id) ? rows.filter((r) => r !== id) : set.dimensions.map((d) => d.id).filter((x) => x === id || rows.includes(x));
    if (next.length < 1) return;
    setRows(next);
  };

  const reset = () => chooseSet(set);

  const shownEntries = set.entries.filter((e) => schools.includes(e.id));
  const shownDims = set.dimensions.filter((d) => rows.includes(d.id));

  return (
    <div className="cmp-wrap">
      <div className="cmp-tabs" role="group" aria-label="Choose what to compare">
        {sets.map((s) => (
          <button key={s.id} type="button" aria-pressed={s.id === setId} className={s.id === setId ? 'active' : ''} onClick={() => chooseSet(s)}>{s.title}</button>
        ))}
      </div>

      <p className="cmp-intro">{set.intro}</p>

      <div className="cmp-controls">
        <fieldset>
          <legend>Schools to compare <span className="muted-inline">(choose at least two)</span></legend>
          <div className="cmp-checks">
            {set.entries.map((e) => (
              <label key={e.id} className={schools.includes(e.id) ? 'on' : ''}>
                <input type="checkbox" checked={schools.includes(e.id)} onChange={() => toggleSchool(e.id)} disabled={schools.includes(e.id) && schools.length <= 2} />
                {e.name}
              </label>
            ))}
          </div>
        </fieldset>
        <details className="cmp-rows">
          <summary>Rows shown ({shownDims.length} of {set.dimensions.length})</summary>
          <div className="cmp-checks">
            {set.dimensions.map((d) => (
              <label key={d.id} className={rows.includes(d.id) ? 'on' : ''}>
                <input type="checkbox" checked={rows.includes(d.id)} onChange={() => toggleRow(d.id)} disabled={rows.includes(d.id) && rows.length <= 1} />
                {d.label}
              </label>
            ))}
          </div>
        </details>
        <button type="button" className="cmp-reset" onClick={reset}><RotateCcw size={14} aria-hidden="true" /> Reset</button>
      </div>

      <p className="cmp-caution">{set.caution}</p>

      {shownEntries.length > 3 && <p className="cmp-hint">Scroll sideways to see every school, or choose fewer schools above. Row labels stay in place.</p>}
      <div className="cmp-scroll" role="region" aria-label={`${set.title} comparison table`} tabIndex={0}>
        <table className="cmp">
          <caption className="sr-only">{set.title}: comparison of {shownEntries.map((e) => e.name).join(', ')}</caption>
          <thead>
            <tr>
              <th scope="col">Aspect</th>
              {shownEntries.map((e) => (
                <th scope="col" key={e.id}>{e.href ? <Link href={e.href}>{e.name}</Link> : e.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shownDims.map((d) => (
              <tr key={d.id}>
                <th scope="row">{d.label}</th>
                {shownEntries.map((e) => <td key={e.id} data-label={e.name}>{e.cells[d.id]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
