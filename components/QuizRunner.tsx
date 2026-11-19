'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { completeLesson, recordQuiz, useLearning } from '@/lib/learning/store';
import type { Question, Quiz } from '@/lib/learning/types';

type Answer = number | boolean | string[] | null;
const LABEL: Record<Question['type'], string> = { mcq: 'Multiple choice', teaching: 'Identify the correct teaching', tf: 'True or false', match: 'Match the concepts' };

function isAnswered(q: Question, a: Answer) {
  if (a === null || a === undefined) return false;
  if (q.type === 'match') return Array.isArray(a) && a.length === q.pairs.length && a.every(Boolean);
  return true;
}
function isCorrect(q: Question, a: Answer) {
  if (q.type === 'match') return Array.isArray(a) && q.pairs.every((p, i) => a[i] === p.right);
  return a === q.answer;
}

export default function QuizRunner({ quiz, lessonId }: { quiz: Quiz; lessonId: string }) {
  const { state } = useLearning();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>(() => quiz.questions.map(() => null));
  const [checked, setChecked] = useState<boolean[]>(() => quiz.questions.map(() => false));
  const [finished, setFinished] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);

  // Move focus to the new heading after the question (or result) has rendered, so keyboard and screen-reader users land in the right place.
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    headingRef.current?.focus();
  }, [i, finished]);

  const q = quiz.questions[i];
  const total = quiz.questions.length;
  const score = useMemo(() => quiz.questions.filter((qq, k) => isCorrect(qq, answers[k])).length, [quiz, answers]);
  const lessonDone = state.lessons[lessonId]?.completedAt !== undefined;

  const set = (v: Answer) => setAnswers((a) => a.map((x, k) => (k === i ? v : x)));
  const check = () => setChecked((c) => c.map((x, k) => (k === i ? true : x)));
  const next = () => {
    if (i + 1 < total) { setI(i + 1); return; }
    const final = quiz.questions.filter((qq, k) => isCorrect(qq, answers[k])).length;
    recordQuiz(lessonId, final, total);
    setFinished(true);
  };
  const retry = () => { setI(0); setAnswers(quiz.questions.map(() => null)); setChecked(quiz.questions.map(() => false)); setFinished(false); };

  if (finished) {
    return (
      <section className="quiz" aria-labelledby="quiz-result">
        <h2 id="quiz-result" ref={headingRef} tabIndex={-1}>Your result: {score} of {total}</h2>
        <p className="quiz-sub">{score === total ? 'All correct.' : 'Review the explanations below, then try again if you like.'}</p>
        <ol className="quiz-review">
          {quiz.questions.map((qq, k) => {
            const ok = isCorrect(qq, answers[k]);
            return (
              <li key={qq.prompt} className={ok ? 'ok' : 'no'}>
                <span className="qr-icon">{ok ? <CheckCircle2 size={18} aria-label="Correct" /> : <XCircle size={18} aria-label="Incorrect" />}</span>
                <div><b>{qq.prompt}</b><p>{qq.explanation}</p></div>
              </li>
            );
          })}
        </ol>
        <div className="lesson-actions">
          <button type="button" className="button button-outline" onClick={retry}><RotateCcw size={15} aria-hidden="true" /> Try again</button>
          {!lessonDone && <button type="button" className="button button-primary" onClick={() => completeLesson(lessonId)}>Mark lesson complete</button>}
          {lessonDone && <span className="badge badge-ok">Lesson completed</span>}
        </div>
        <p className="note-small">Your best score is saved in this browser only.</p>
      </section>
    );
  }

  const a = answers[i];
  const done = checked[i];
  const ok = isCorrect(q, a);

  return (
    <section className="quiz" aria-labelledby="quiz-q">
      <p className="quiz-meta"><span>Question {i + 1} of {total}</span><span className="chip">{LABEL[q.type]}</span></p>
      <div className="quiz-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={i + (done ? 1 : 0)} aria-label="Quiz progress"><span style={{ width: `${((i + (done ? 1 : 0)) / total) * 100}%` }} /></div>

      <fieldset className="quiz-fs" disabled={done}>
        <legend id="quiz-q"><h2 ref={headingRef} tabIndex={-1}>{q.prompt}</h2></legend>

        {(q.type === 'mcq' || q.type === 'teaching') && (
          <div className="quiz-opts">
            {q.options.map((o, k) => (
              <label key={o} className={`opt ${a === k ? 'sel' : ''} ${done && k === q.answer ? 'right' : ''} ${done && a === k && k !== q.answer ? 'wrong' : ''}`}>
                <input type="radio" name={`q${i}`} checked={a === k} onChange={() => set(k)} /> <span>{o}</span>
              </label>
            ))}
          </div>
        )}

        {q.type === 'tf' && (
          <div className="quiz-opts">
            {[true, false].map((v) => (
              <label key={String(v)} className={`opt ${a === v ? 'sel' : ''} ${done && v === q.answer ? 'right' : ''} ${done && a === v && v !== q.answer ? 'wrong' : ''}`}>
                <input type="radio" name={`q${i}`} checked={a === v} onChange={() => set(v)} /> <span>{v ? 'True' : 'False'}</span>
              </label>
            ))}
          </div>
        )}

        {q.type === 'match' && (
          <MatchRows q={q} value={Array.isArray(a) ? a : q.pairs.map(() => '')} onChange={set} done={done} />
        )}
      </fieldset>

      <div aria-live="polite" className="quiz-fb">
        {done && (
          <div className={`fb ${ok ? 'ok' : 'no'}`}>
            <b>{ok ? 'Correct.' : 'Not quite.'}</b> {q.explanation}
          </div>
        )}
      </div>

      <div className="lesson-actions">
        {!done
          ? <button type="button" className="button button-primary" disabled={!isAnswered(q, a)} onClick={check}>Check answer</button>
          : <button type="button" className="button button-primary" onClick={next}>{i + 1 < total ? 'Next question' : 'See result'}</button>}
      </div>
    </section>
  );
}

function MatchRows({ q, value, onChange, done }: { q: Extract<Question, { type: 'match' }>; value: string[]; onChange: (v: string[]) => void; done: boolean }) {
  // Offer the right-hand items in a rotated order so the correct pairing is never in line.
  const rights = q.pairs.map((p) => p.right);
  const choices = rights.map((_, k) => rights[(k + 1) % rights.length]);
  return (
    <div className="match">
      {q.pairs.map((p, k) => {
        const id = `m-${k}`;
        const state = done ? (value[k] === p.right ? 'right' : 'wrong') : '';
        return (
          <div key={p.left} className={`match-row ${state}`}>
            <label htmlFor={id}>{p.left}</label>
            <select id={id} value={value[k] ?? ''} onChange={(e) => onChange(value.map((x, j) => (j === k ? e.target.value : x)))}>
              <option value="">Choose…</option>
              {choices.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {done && value[k] !== p.right && <span className="match-fix">Answer: {p.right}</span>}
          </div>
        );
      })}
    </div>
  );
}
