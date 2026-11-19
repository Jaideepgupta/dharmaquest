'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Download, Trash2, Upload, X } from 'lucide-react';
import { clearAll, computeStreak, dayNumber, exportData, importData, localDate, setDaily, toggleBookmark, useLearning, type BookmarkKind } from '@/lib/learning/store';
import { completedCount, currentLevel, nextLesson, pickDaily } from '@/lib/learning/recommend';
import { LEVELS, type LessonMeta } from '@/lib/learning/types';
import { isLinked, useAccountStatus } from '@/lib/auth/status';

const KIND_LABEL: Record<BookmarkKind, string> = { verse: 'Verses', chapter: 'Chapters', scripture: 'Scriptures', lesson: 'Lessons', darshana: 'Darshanas' };
const KIND_ORDER: BookmarkKind[] = ['verse', 'chapter', 'lesson', 'scripture', 'darshana'];

export default function ProgressDashboard({ meta: lessons }: { meta: LessonMeta[] }) {
  const { state, ready, persistent } = useLearning();
  const { status: account } = useAccountStatus();
  const linked = isLinked(account);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const today = ready ? localDate() : '1970-01-01';
  useEffect(() => {
    if (!ready) return;
    if (state.daily?.date !== today) setDaily(today, pickDaily(state, dayNumber(today), lessons).id);
  }, [ready, today, state, lessons]);

  if (!ready) return <p className="muted" aria-live="polite">Loading your learning…</p>;

  const total = lessons.length;
  const done = completedCount(state, lessons);
  const streak = computeStreak(state.days, today);
  const studiedToday = state.days.includes(today);
  const next = nextLesson(state, lessons);
  const level = LEVELS.find((l) => l.id === currentLevel(state, lessons));
  const dailyId = state.daily?.date === today ? state.daily.id : pickDaily(state, dayNumber(today), lessons).id;
  const daily = lessons.find((l) => l.id === dailyId);
  const hasAnything = done > 0 || state.bookmarks.length > 0 || state.recent.length > 0 || Object.keys(state.lessons).length > 0;

  const collections = Array.from(new Set(lessons.map((l) => l.collection)));
  const quizzesTaken = lessons.filter((l) => state.lessons[l.id]?.quiz);

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 1_000_000) { setMsg('That file is too large to be a DharmaQuest export.'); return; }
    const r = importData(await file.text());
    setMsg(r.ok ? 'Imported. Your progress has been replaced with the contents of the file.' : r.error ?? 'Import failed.');
    if (fileRef.current) fileRef.current.value = '';
  };
  const onExport = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `dharmaquest-progress-${localDate()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div className="dash">
      {!persistent && <p className="warn" role="alert">Your browser is blocking local storage, so progress can’t be saved between visits. Everything still works for this visit.</p>}

      <ul className="stats" aria-label="Your numbers">
        <li><b>{done}<small> / {total}</small></b><span>Lessons completed</span></li>
        <li><b>{streak}<small> {streak === 1 ? 'day' : 'days'}</small></b><span>Current streak{streak > 0 && !studiedToday ? ' · study today to continue it' : ''}</span></li>
        <li><b>{state.days.length}</b><span>{state.days.length === 1 ? 'Day studied' : 'Days studied'}</span></li>
        <li><b>{state.bookmarks.length}</b><span>{state.bookmarks.length === 1 ? 'Bookmark' : 'Bookmarks'}</span></li>
      </ul>
      <p className="note-small">A streak counts consecutive days on which you completed a lesson or finished a quiz. These are your own numbers, kept in this browser.</p>

      <div className="dash-cols">
        <section className="dash-card" aria-labelledby="d-next">
          <h2 id="d-next">Continue learning</h2>
          {next ? (
            <>
              <p className="muted">Current path: <b>{level?.label}</b></p>
              <Link className="lesson-link" href={`/learn/lessons/${next.id}`}><span><b>{next.title}</b><small>{next.collection} · about {next.minutes} min</small></span><ArrowRight size={16} aria-hidden="true" /></Link>
            </>
          ) : <p>You have completed every lesson. Browse the library or revisit a lesson any time.</p>}
        </section>
        <section className="dash-card" aria-labelledby="d-daily">
          <h2 id="d-daily">Today’s suggestion</h2>
          {daily && <Link className="lesson-link" href={`/learn/lessons/${daily.id}`}><span><b>{daily.title}</b><small>{daily.collection} · about {daily.minutes} min</small></span><ArrowRight size={16} aria-hidden="true" /></Link>}
          <p className="note-small">Picked by date from the lesson list, skipping any you have completed. No pressure to follow it.</p>
        </section>
      </div>

      <section className="dash-card" aria-labelledby="d-prog">
        <h2 id="d-prog">Reading progress</h2>
        <ul className="bars">
          {collections.map((c) => {
            const ls = lessons.filter((l) => l.collection === c);
            const n = ls.filter((l) => state.lessons[l.id]?.completedAt !== undefined).length;
            return (
              <li key={c}>
                <div><b>{c}</b><span>{n} of {ls.length} {ls.length === 1 ? 'lesson' : 'lessons'}</span></div>
                <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={ls.length} aria-valuenow={n} aria-label={`${c} lessons completed`}><span style={{ width: `${(n / ls.length) * 100}%` }} /></div>
              </li>
            );
          })}
        </ul>
        {LEVELS.map((lv) => {
          const ls = lessons.filter((l) => l.level === lv.id);
          const n = ls.filter((l) => state.lessons[l.id]?.completedAt !== undefined).length;
          return <p key={lv.id} className="note-small" style={{ margin: '4px 0' }}>{lv.label} path: {n} of {ls.length}</p>;
        })}
      </section>

      <div className="dash-cols">
        <section className="dash-card" aria-labelledby="d-quiz">
          <h2 id="d-quiz">Quiz results</h2>
          {quizzesTaken.length === 0 ? <p className="muted">No quizzes taken yet. Each lesson with a quiz offers one at the end.</p> : (
            <ul className="plain">
              {quizzesTaken.map((l) => { const q = state.lessons[l.id].quiz!; return <li key={l.id}><Link href={`/learn/lessons/${l.id}`}>{l.title}</Link><span>Best {q.best}/{q.total}</span></li>; })}
            </ul>
          )}
        </section>
        <section className="dash-card" aria-labelledby="d-recent">
          <h2 id="d-recent">Recently viewed</h2>
          {state.recent.length === 0 ? <p className="muted">Pages you open will appear here.</p> : (
            <ul className="plain">{state.recent.map((r) => <li key={r.href}><Link href={r.href}>{r.title}</Link><span>{r.kind}</span></li>)}</ul>
          )}
        </section>
      </div>

      <section className="dash-card" aria-labelledby="d-bm">
        <h2 id="d-bm">Bookmarks</h2>
        {state.bookmarks.length === 0 ? <p className="muted">Use the Save button on a verse, chapter, lesson or collection to keep it here.</p> : (
          KIND_ORDER.filter((k) => state.bookmarks.some((b) => b.kind === k)).map((k) => (
            <div key={k} className="bm-group">
              <h3>{KIND_LABEL[k]}</h3>
              <ul className="plain">
                {state.bookmarks.filter((b) => b.kind === k).map((b) => (
                  <li key={`${b.kind}:${b.id}`}>
                    <Link href={b.href}>{b.title}</Link>
                    <button type="button" className="icon-button small" aria-label={`Remove bookmark: ${b.title}`} onClick={() => toggleBookmark({ id: b.id, kind: b.kind, title: b.title, href: b.href })}><X size={15} /></button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <section className="dash-card" aria-labelledby="d-data">
        <h2 id="d-data">Your data</h2>
        {linked ? (
          <p className="muted">Your progress is saved to your account (<b>{account.email}</b>) and kept in step across your devices. To sign out or delete your account, use the <Link href="/account">Account page</Link>. You can still export a copy below.</p>
        ) : (
          <p className="muted">Everything on this page is stored only in this browser. It isn’t sent anywhere. Clearing your browser data will erase it, so export a copy if you want to keep it or move it to another device.</p>
        )}
        <div className="lesson-actions">
          <button type="button" className="button button-outline" onClick={onExport} disabled={!hasAnything}><Download size={15} aria-hidden="true" /> Export</button>
          <label className={`button button-outline file-btn ${linked ? 'disabled' : ''}`}><Upload size={15} aria-hidden="true" /> Import<input ref={fileRef} type="file" accept="application/json,.json" disabled={linked} onChange={(e) => onImport(e.target.files?.[0])} /></label>
          {!linked && (!confirmClear
            ? <button type="button" className="cmp-reset" onClick={() => setConfirmClear(true)} disabled={!hasAnything}><Trash2 size={14} aria-hidden="true" /> Clear all</button>
            : <span className="confirm"><b>Erase all progress, bookmarks and history?</b>
                <button type="button" className="button button-small button-dark" onClick={() => { clearAll(); setConfirmClear(false); setMsg('All local data cleared.'); }}>Yes, erase</button>
                <button type="button" className="cmp-reset" onClick={() => setConfirmClear(false)}>Cancel</button></span>)}
        </div>
        <p className="note-small" aria-live="polite">{msg}</p>
        {!linked && <p className="note-small">Importing replaces what is currently saved.</p>}
      </section>
    </div>
  );
}
