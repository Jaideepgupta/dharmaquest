import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verseStudies } from '../lib/content/gita';

/**
 * Permanent guard for the Sanskrit fields of every verse study: the hand-written IAST must convert back to exactly the
 * Devanagari on the page. This catches typos and unsandhied compounds (the 4.8 bug found while adding these verses).
 * It cannot prove the Sanskrit is the right verse: that was checked against two independent public texts (see provenance).
 */
const VOW = ['ai', 'au', 'ā', 'ī', 'ū', 'ṝ', 'ṛ', 'a', 'i', 'u', 'e', 'o'];
const IND: Record<string, string> = { a: 'अ', ā: 'आ', i: 'इ', ī: 'ई', u: 'उ', ū: 'ऊ', ṛ: 'ऋ', ṝ: 'ॠ', e: 'ए', ai: 'ऐ', o: 'ओ', au: 'औ' };
const MAT: Record<string, string> = { a: '', ā: 'ा', i: 'ि', ī: 'ी', u: 'ु', ū: 'ू', ṛ: 'ृ', ṝ: 'ॄ', e: 'े', ai: 'ै', o: 'ो', au: 'ौ' };
const CON: Record<string, string> = {
  kh: 'ख', gh: 'घ', ch: 'छ', jh: 'झ', ṭh: 'ठ', ḍh: 'ढ', th: 'थ', dh: 'ध', ph: 'फ', bh: 'भ',
  k: 'क', g: 'ग', ṅ: 'ङ', c: 'च', j: 'ज', ñ: 'ञ', ṭ: 'ट', ḍ: 'ड', ṇ: 'ण', t: 'त', d: 'द', n: 'न', p: 'प', b: 'ब', m: 'म',
  y: 'य', r: 'र', l: 'ल', v: 'व', ś: 'श', ṣ: 'ष', s: 'स', h: 'ह',
};
const CKEYS = Object.keys(CON).sort((a, b) => b.length - a.length);

function toDevanagari(iast: string): string {
  const t = iast.normalize('NFC').toLowerCase().replace(/[\s\-|]+/g, '').replace(/’/g, 'ऽ');
  let out = ''; let afterCons = false;
  for (let i = 0; i < t.length;) {
    const ch = t[i];
    if (ch === 'ऽ') { if (afterCons) out += '्'; out += 'ऽ'; afterCons = false; i++; continue; }
    if (ch === 'ṃ') { out += 'ं'; afterCons = false; i++; continue; }
    if (ch === 'ḥ') { out += 'ः'; afterCons = false; i++; continue; }
    const c = CKEYS.find((k) => t.startsWith(k, i));
    if (c) { if (afterCons) out += '्'; out += CON[c]; i += c.length; afterCons = true; continue; }
    const v = VOW.find((k) => t.startsWith(k, i));
    if (v) { out += afterCons ? MAT[v] : IND[v]; afterCons = false; i += v.length; continue; }
    throw new Error(`unhandled character ${JSON.stringify(ch)} in ${iast}`);
  }
  return afterCons ? out + '्' : out;
}
const clean = (s: string) => s.normalize('NFC').replace(/[।॥|\s‌‍]+/g, '').replace(/ऽ/g, '');

test('every verse study: IAST converts back to exactly the Devanagari shown', () => {
  assert.ok(verseStudies.length >= 8);
  for (const v of verseStudies) {
    assert.equal(v.sanskrit.length, v.transliteration.length, `${v.reference}: same number of lines`);
    const back = v.transliteration.map(toDevanagari).map(clean).join('');
    assert.equal(back, v.sanskrit.map(clean).join(''), `${v.reference}: IAST and Devanagari disagree`);
  }
});

test('verse studies are unique, ordered sensibly and consistent with their reference', () => {
  const keys = verseStudies.map((v) => `${v.chapter}.${v.verse}`);
  assert.equal(new Set(keys).size, keys.length, 'no duplicates');
  for (const v of verseStudies) assert.equal(v.reference, `Bhagavad Gita ${v.chapter}.${v.verse}`);
  assert.equal(`${verseStudies[0].chapter}.${verseStudies[0].verse}`, '2.47', 'the lesson generator reads the first entry');
});

test('a verse page only offers a lesson that exists for that verse (regression: 4.8 once linked to the 2.47 lesson)', async () => {
  const { readFileSync } = await import('node:fs');
  const page = readFileSync('app/gita/bhagavad-gita/[chapter]/[verse]/page.tsx', 'utf8');
  assert.ok(!/href="\/learn\/lessons\/verse-\d+-\d+"/.test(page), 'no hard-coded verse lesson link');
  assert.ok(/getLesson\(`verse-\$\{v\.chapter\}-\$\{v\.verse\}`\)/.test(page), 'the chip is conditional on the lesson existing');
});
