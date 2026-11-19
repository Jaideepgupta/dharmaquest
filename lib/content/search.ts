import { scriptureCategories } from './scriptures';
import { darshanas } from './darshanas';
import type { SearchEntry } from './types';

const concepts: { title: string; subtitle: string; href: string; keywords: string }[] = [
  { title: 'Karma', subtitle: 'Action and its consequences', href: '/scriptures/bhagavad-gita', keywords: 'karma yoga action phala fruits' },
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
    entries.push({
      title: c.title,
      subtitle: c.tagline,
      href: `/scriptures/${c.slug}`,
      kind: c.slug === 'ramayana' || c.slug === 'mahabharata' ? 'Epic' : 'Scripture',
      keywords: `${c.sanskrit ?? ''} ${c.classification.join(' ')}`,
    });
    if (c.slug === 'upanishads' || c.slug === 'other-gitas') {
      for (const i of c.items ?? []) {
        if (i.name.startsWith('Other')) continue;
        entries.push({
          title: i.name,
          subtitle: i.note ?? '',
          href: `/scriptures/${c.slug}`,
          kind: c.slug === 'upanishads' ? 'Upanishad' : 'Gita',
          keywords: `${i.tag ?? ''} ${c.title}`,
        });
      }
    }
    if (c.slug === 'bhagavad-gita') {
      for (const i of c.items ?? []) {
        entries.push({
          title: `Bhagavad Gita ${i.name}`,
          subtitle: i.note ?? '',
          href: `/scriptures/${c.slug}`,
          kind: 'Gita',
          keywords: 'chapter adhyaya',
        });
      }
    }
  }

  for (const d of darshanas) {
    entries.push({
      title: d.name,
      subtitle: d.coreQuestion,
      href: `/darshanas/${d.slug}`,
      kind: 'Darshana',
      keywords: `${d.sanskrit} ${d.focus} ${d.keyConcepts.map((k) => k.term).join(' ')}`,
    });
  }

  for (const k of concepts) entries.push({ ...k, kind: 'Concept' });

  entries.push(
    { title: 'Beginner path', subtitle: 'Foundations and first steps', href: '/learn#beginner', kind: 'Path', keywords: 'start new learn' },
    { title: 'Intermediate path', subtitle: 'Connections between texts', href: '/learn#intermediate', kind: 'Path', keywords: 'learn' },
    { title: 'Advanced path', subtitle: 'Study of philosophical traditions', href: '/learn#advanced', kind: 'Path', keywords: 'learn study' },
  );

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
