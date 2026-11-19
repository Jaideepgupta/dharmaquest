'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Sparkles } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { VerseStudy } from '@/lib/content/types';

type View = 'brief' | 'detailed';
const STORAGE_KEY = 'dq-reading-view';
/**
 * Brief and Detailed sections are paired so the reader keeps their place on switch.
 * Detailed-only sections map to the nearest Brief neighbour.
 */
const TO_BRIEF: Record<string, string> = { words: 'say', translations: 'say', terms: 'mean', context: 'why', commentary: 'why', apply: 'learn', related: 'learn' };
const TO_DETAILED: Record<string, string> = { say: 'words', mean: 'terms', why: 'context', learn: 'apply' };

export default function VerseReader({ v }: { v: VerseStudy }) {
  const [view, setView] = useState<View>('brief');
  const barRef = useRef<HTMLDivElement>(null);
  const anchor = useRef<{ id: string; top: number } | null>(null);

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('view');
      const saved = q ?? window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'detailed' || saved === 'brief') setView(saved);
    } catch { /* storage unavailable: default to brief */ }
  }, []);

  const switchTo = useCallback((next: View) => {
    if (next === view) return;
    // Find the section nearest the top of the reading area and remember its offset.
    const barBottom = barRef.current?.getBoundingClientRect().bottom ?? 0;
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-sec]'));
    let best: { id: string; top: number } | null = null;
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      // A section needs a meaningful amount visible to count as "where you are".
      if (r.bottom > barBottom + 60) { best = { id: s.dataset.sec!, top: r.top }; break; }
    }
    anchor.current = best;
    setView(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      const url = new URL(window.location.href);
      url.searchParams.set('view', next);
      window.history.replaceState(null, '', url);
    } catch { /* ignore */ }
  }, [view]);

  useLayoutEffect(() => {
    const a = anchor.current;
    if (!a) return;
    anchor.current = null;
    const counterpart = (view === 'brief' ? TO_BRIEF : TO_DETAILED)[a.id];
    const target = counterpart ? document.querySelector<HTMLElement>(`[data-sec="${counterpart}"]`) : null;
    if (target) window.scrollBy({ top: target.getBoundingClientRect().top - a.top, behavior: 'instant' });
  }, [view]);

  return (
    <div className="reader">
      <div ref={barRef} className="reader-bar" role="group" aria-label="Reading mode">
        <span className="reader-ref">{v.reference}</span>
        <div className="mode-toggle compact">
          <button type="button" aria-pressed={view === 'brief'} className={view === 'brief' ? 'selected' : ''} onClick={() => switchTo('brief')}><Sparkles size={14} aria-hidden="true" /> Brief</button>
          <button type="button" aria-pressed={view === 'detailed'} className={view === 'detailed' ? 'selected' : ''} onClick={() => switchTo('detailed')}><BookOpen size={14} aria-hidden="true" /> Detailed</button>
        </div>
      </div>

      <section className="verse-card" aria-label="Verse text">
        <div className="verse-sanskrit" lang="sa">{v.sanskrit.map((l) => <span key={l}>{l}</span>)}</div>
        <div className="verse-translit" lang="sa-Latn">{v.transliteration.map((l) => <span key={l}>{l}</span>)}</div>
        <p className="verse-src">{v.sourceLines.join(' · ')}</p>
      </section>

      {view === 'brief' ? (
        <div className="reader-body" data-view="brief">
          <section data-sec="say" className="rb"><h2>What is being said?</h2><p>{v.brief.say}</p><p className="note-small">DharmaQuest summary of the Sanskrit. It is not a translation.</p></section>
          <section data-sec="mean" className="rb"><h2>What does it mean?</h2><p>{v.brief.mean}</p></section>
          <section data-sec="why" className="rb"><h2>Why is it important?</h2><p>{v.brief.why}</p></section>
          <section data-sec="learn" className="rb"><h2>What can we learn from it?</h2><p>{v.brief.learn}</p></section>
        </div>
      ) : (
        <div className="reader-body" data-view="detailed">
          <section data-sec="words" className="rb"><h2>Word by word</h2>
            <dl className="words">{v.words.map((w) => <div key={w.word}><dt lang="sa-Latn">{w.word}</dt><dd>{w.gloss}</dd></div>)}</dl>
            <p className="note-small">{v.wordsNote}</p></section>

          <section data-sec="translations" className="rb"><h2>Translations</h2>
            <div className="tl"><h3>Hindi</h3>{v.hindi.text ? <p>{v.hindi.text}</p> : <p><StatusBadge status={v.hindi.status} /></p>}{v.hindi.translator && <p className="note-small">Translator: {v.hindi.translator}</p>}</div>
            <div className="tl"><h3>English</h3>{v.english.text ? <p>{v.english.text}</p> : <p><StatusBadge status={v.english.status} /></p>}{v.english.translator && <p className="note-small">Translator: {v.english.translator}</p>}</div>
            <p className="note-small">Translations are added only with a named translator and a public-domain or licensed text.</p></section>

          <section data-sec="terms" className="rb"><h2>Key terms</h2>
            <ul className="catalog">{v.detailed.terms.map((t) => <li key={t.term}><div><b>{t.term}</b></div><p>{t.meaning}</p></li>)}</ul>
            <h3>How the verse is built</h3>
            <ul className="notes">{v.detailed.structure.map((s) => <li key={s}>{s}</li>)}</ul></section>

          <section data-sec="context" className="rb"><h2>Context</h2><p>{v.detailed.context}</p></section>

          <section data-sec="commentary" className="rb"><h2>Traditional commentaries</h2><p><StatusBadge status="under-review" /></p><p>{v.detailed.commentaryNote}</p></section>

          <section data-sec="apply" className="rb"><h2>Practical application</h2><p>{v.detailed.apply}</p></section>

          <section data-sec="related" className="rb"><h2>Related verses</h2>
            <ul className="catalog">{v.detailed.related.map((r) => <li key={r.ref}><div><b>{r.href ? <Link href={r.href}>Gita {r.ref}</Link> : `Gita ${r.ref}`}</b></div><p>{r.topic}</p></li>)}</ul></section>
        </div>
      )}

      <section className="rb provenance" aria-label="Sources and provenance"><h2>Sources and provenance</h2>
        <ul className="notes">{v.provenance.map((p) => <li key={p}>{p}</li>)}</ul></section>
    </div>
  );
}
