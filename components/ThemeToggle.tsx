'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

type Choice = 'system' | 'light' | 'dark';
const KEY = 'dq-theme';
const ORDER: Choice[] = ['system', 'light', 'dark'];
const LABEL: Record<Choice, string> = { system: 'Automatic (follows your device)', light: 'Light', dark: 'Dark' };

function read(): Choice {
  try { const v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : 'system'; } catch { return 'system'; }
}

/** Applies the choice to <html data-theme>. "system" removes the attribute so the OS setting decides. */
export function applyTheme(choice: Choice) {
  const root = document.documentElement;
  if (choice === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', choice);
}

export default function ThemeToggle() {
  const [choice, setChoice] = useState<Choice>('system');
  const [ready, setReady] = useState(false);
  useEffect(() => { setChoice(read()); setReady(true); }, []);

  const next = ORDER[(ORDER.indexOf(choice) + 1) % ORDER.length];
  const change = () => {
    setChoice(next); applyTheme(next);
    try { if (next === 'system') localStorage.removeItem(KEY); else localStorage.setItem(KEY, next); } catch { /* storage blocked: still applies for this visit */ }
  };
  const Icon = choice === 'light' ? Sun : choice === 'dark' ? Moon : Monitor;

  return (
    <button type="button" className="icon-button theme-toggle" onClick={change} disabled={!ready}
      aria-label={`Colour theme: ${LABEL[choice]}. Switch to ${LABEL[next]}`} title={`Theme: ${LABEL[choice]}`}>
      <Icon size={19} aria-hidden="true" />
    </button>
  );
}
