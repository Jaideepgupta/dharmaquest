import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('app/globals.css', 'utf8');
const vars = (block: string) => new Map([...block.matchAll(/--([a-z0-9-]+):([^;}]+)/g)].map((m) => [m[1], m[2].trim()]));
const light = vars(/:root\{color-scheme:light;([^}]*)\}/.exec(css)![1]);
const darkAttr = vars(/:root\[data-theme=dark\]\{([^}]*)\}/.exec(css)![1]);
const darkMedia = vars(/@media \(prefers-color-scheme:dark\)\{:root:not\(\[data-theme=light\]\)\{([^}]*)\}\}/.exec(css)![1]);
const core = vars(/^:root\{--ink[^}]*\}/m.exec(css)![0]);
const afterTokens = css.slice(css.indexOf('@media (prefers-color-scheme:dark)'));
const rules = afterTokens.slice(afterTokens.indexOf('}}\n') + 3);

test('every themed token has a dark value, and the two dark blocks are identical', () => {
  const missing = [...light.keys()].filter((k) => !darkAttr.has(k));
  assert.deepEqual(missing, []);
  assert.deepEqual([...darkMedia].sort(), [...darkAttr].sort(), 'attribute and media-query dark blocks must match');
});

test('every core token (ink, paper, ...) is overridden in dark', () => {
  assert.deepEqual([...core.keys()].filter((k) => !darkAttr.has(k)), []);
});

test('every var(--x) used by a rule is defined', () => {
  const defined = new Set([...core.keys(), ...light.keys(), ...darkAttr.keys()]);
  const used = new Set([...rules.matchAll(/var\(--([a-z0-9-]+)/g)].map((m) => m[1]));
  assert.deepEqual([...used].filter((u) => !defined.has(u)), []);
});

test('no raw colour literals in rules (use a token); decorative shadows are the only exception', () => {
  const offenders: string[] = [];
  for (const decl of rules.matchAll(/([a-z-]+)\s*:\s*([^;{}]+)/gi)) {
    if (/shadow/i.test(decl[1])) continue;
    const lit = decl[2].match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g);
    if (lit && !/^(--)/.test(decl[1])) offenders.push(`${decl[1]}: ${lit.join(' ')}`);
  }
  assert.deepEqual(offenders, []);
});

test('dark text tokens are lighter than the dark page background (sanity)', () => {
  const lum = (hex: string) => { const f = (i: number) => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(1) + 0.7152 * f(3) + 0.0722 * f(5); };
  assert.ok(lum(darkAttr.get('ink')!) > lum(darkAttr.get('paper')!) + 0.5);
  assert.ok(lum(darkAttr.get('muted')!) > lum(darkAttr.get('paper')!) + 0.25);
});
