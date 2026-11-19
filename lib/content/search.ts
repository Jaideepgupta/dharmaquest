import { scriptureCategories } from './scriptures';
import { darshanas } from './darshanas';
import { bhagavadGitaChapters, gitaTexts, verseStudies } from './gita';
import { categoryHref } from './scriptures';
import { vedantaComparison, thinkers } from './comparison';
import { lessons } from '../learning/lessons';
import type { SearchEntry } from './types';

const concepts: { title: string; subtitle: string; href: string; keywords: string }[] = [
  { title: 'Karma', subtitle: 'Action and its consequences', href: '/gita/bhagavad-gita/2/47', keywords: 'karma yoga action phala fruits' },
  { title: 'Dharma', subtitle: 'Duty and right action', href: '/darshanas/purva-mimamsa', keywords: 'dharma duty' },
  { title: 'Atman', subtitle: 'The Self', href: '/darshanas/vedanta', keywords: 'atman self soul' },
  { title: 'Brahman', subtitle: 'Ultimate reality', href: '/darshanas/vedanta', keywords: 'brahman reality absolute' },
  { title: 'Moksha', subtitle: 'Liberation', href: '/darshanas/vedanta', keywords: 'moksha liberation freedom mukti' },
  { title: 'Pramana', subtitle: 'Means of valid knowledge', href: '/darshanas/nyaya', keywords: 'pramana perception inference knowledge epistemology' },
  { title: 'Purusha and Prakriti', subtitle: 'Consciousness and nature', href: '/darshanas/samkhya', keywords: 'purusha prakriti gunas sattva rajas tamas' },
  { title: 'Samadhi', subtitle: 'Absorbed awareness', href: '/darshanas/yoga', keywords: 'samadhi meditation dhyana ashtanga eight limbs patanjali' },
  { title: 'Mahavakya', subtitle: 'The great statements of the Upanishads', href: '/scriptures/upanishads', keywords: 'mahavakya tat tvam asi aham brahmasmi' },
  { title: 'Prasthanatraya', subtitle: 'Three foundations of Vedanta', href: '/darshanas/vedanta', keywords: 'prasthanatraya upanishads brahma sutras gita' },
];

export function buildSearchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const c of scriptureCategories) {
    if (c.slug === 'bhagavad-gita' || c.slug === 'other-gitas') continue; // covered by the Gita Library entries below
    entries.push({
      title: c.title,
      subtitle: c.tagline,
      href: categoryHref(c.slug),
      kind: c.slug === 'ramayana' || c.slug === 'mahabharata' ? 'Epic' : 'Scripture',
      keywords: `${c.sanskrit ?? ''} ${c.classification.join(' ')}`,
    });
    if (c.slug === 'upanishads') {
      for (const i of c.items ?? []) {
        if (i.name.startsWith('Other')) continue;
        entries.push({
          title: i.name,
          subtitle: i.note ?? '',
          href: `/scriptures/${c.slug}`,
          kind: 'Upanishad',
          keywords: `${i.tag ?? ''} ${c.title}`,
        });
      }
    }
  }

  for (const g of gitaTexts) {
    entries.push({
      title: g.name,
      subtitle: g.tagline,
      href: g.slug === 'bhagavad-gita' ? '/gita/bhagavad-gita' : `/gita/${g.slug}`,
      kind: 'Gita',
      keywords: `${g.sanskrit} ${g.speakers.join(' ')} ${g.relatedTraditions.join(' ')}`,
    });
  }
  for (const ch of bhagavadGitaChapters) {
    entries.push({
      title: `Bhagavad Gita chapter ${ch.number}: ${ch.englishTitle}`,
      subtitle: ch.name,
      href: `/gita/bhagavad-gita/${ch.number}`,
      kind: 'Gita',
      keywords: `${ch.sanskritName} ${ch.concepts.join(' ')} adhyaya chapter`,
    });
  }
  for (const v of verseStudies) {
    entries.push({
      title: v.reference,
      subtitle: v.brief.say,
      href: `/gita/bhagavad-gita/${v.chapter}/${v.verse}`,
      kind: 'Gita',
      keywords: `${v.sanskrit.join(' ')} ${v.transliteration.join(' ')} karma phala adhikara verse shloka`,
    });
  }

  for (const d of darshanas) {
    entries.push({
      title: d.name,
      subtitle: d.coreQuestion,
      href: `/darshanas/${d.slug}`,
      kind: 'Darshana',
      keywords: `${d.sanskrit} ${d.focus} ${d.keyConcepts.map((k) => k.term).join(' ')} ${(thinkers[d.slug] ?? []).map((t) => t.name).join(' ')}`,
    });
  }

  entries.push(
    { title: 'Compare the Darshanas', subtitle: 'Side-by-side comparison of the six schools', href: '/darshanas/compare', kind: 'Darshana', keywords: 'compare comparison table differences schools' },
    { title: 'Compare Vedanta sub-schools', subtitle: 'Advaita, Vishishtadvaita, Dvaita and more', href: '/darshanas/compare?set=vedanta', kind: 'Darshana', keywords: 'compare vedanta sub-schools comparison differences' },
  );
  for (const e of vedantaComparison.entries) {
    entries.push({ title: e.name, subtitle: e.cells.relation, href: `/darshanas/compare?set=vedanta&schools=${e.id === 'advaita' ? 'advaita,vishishtadvaita' : `advaita,${e.id}`}`, kind: 'Darshana', keywords: `${e.cells.teachers} ${e.cells.texts} vedanta` });
  }

  for (const k of concepts) entries.push({ ...k, kind: 'Concept' });

  entries.push(
    { title: 'Beginner path', subtitle: 'Foundations and first steps', href: '/learn#beginner', kind: 'Path', keywords: 'start new learn' },
    { title: 'Intermediate path', subtitle: 'Connections between texts', href: '/learn#intermediate', kind: 'Path', keywords: 'learn' },
    { title: 'Advanced path', subtitle: 'Study of philosophical traditions', href: '/learn#advanced', kind: 'Path', keywords: 'learn study' },
  );

  for (const l of lessons) {
    entries.push({ title: l.title, subtitle: `Lesson · ${l.summary}`, href: `/learn/lessons/${l.id}`, kind: 'Lesson', keywords: `${l.collection} ${l.level} quiz lesson` });
  }
  entries.push({ title: 'My learning', subtitle: 'Progress, bookmarks and quiz results', href: '/progress', kind: 'Path', keywords: 'progress bookmarks streak dashboard saved' });

  return entries;
}

export const normalise = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function searchIndex(index: SearchEntry[], query: string, kind?: string): SearchEntry[] {
  const q = normalise(query.trim());
  return index
    .filter((e) => (!kind || e.kind === kind))
    .map((e) => {
      if (!q) return { e, score: 0 };
      const title = normalise(e.title);
      const hay = normalise(`${e.title} ${e.subtitle} ${e.keywords}`);
      const terms = q.split(/\s+/);
      if (!terms.every((t) => hay.includes(t))) return { e, score: -1 };
      const score = title.startsWith(q) ? 3 : title.includes(q) ? 2 : 1;
      return { e, score };
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.e);
}
