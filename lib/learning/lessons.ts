import { bhagavadGitaChapters, getGita, verseStudies } from '@/lib/content/gita';
import { darshanas } from '@/lib/content/darshanas';
import { darshanaComparison, vedantaComparison, relations } from '@/lib/content/comparison';
import { getCategory } from '@/lib/content/scriptures';
import { getQuiz } from './quizzes';
import type { Lesson, LessonSection, Level } from './types';

const words = (sections: LessonSection[], summary: string) =>
  [summary, ...sections.flatMap((s) => [s.heading, ...(s.paragraphs ?? []), ...(s.bullets ?? [])])].join(' ').split(/\s+/).length;

function make(l: Omit<Lesson, 'minutes' | 'quizId'> & { quizId?: string }): Lesson {
  const quizId = l.quizId && getQuiz(l.quizId) ? l.quizId : undefined;
  const minutes = Math.max(3, Math.ceil(words(l.sections, l.summary) / 170) + (quizId ? 2 : 0));
  return { ...l, quizId, minutes };
}

const gitaBook = getGita('bhagavad-gita')!;

const overview = make({
  id: 'gita-overview', title: 'The Bhagavad Gita: an overview', level: 'beginner', collection: 'Bhagavad Gita',
  summary: 'Who speaks, where it is set, how the text is organised and what it teaches.',
  sections: [
    { heading: 'What it is', paragraphs: [gitaBook.intro, gitaBook.context] },
    { heading: 'Structure', paragraphs: [gitaBook.structureNote] },
    { heading: 'Main teachings', bullets: gitaBook.keyTeachings },
    { heading: 'Themes', bullets: gitaBook.themes },
  ],
  readMore: [{ label: 'Bhagavad Gita and its chapters', href: '/gita/bhagavad-gita' }, { label: 'The Gita Library', href: '/gita' }],
  quizId: 'gita-overview',
});

const chapterLevel = (n: number): Level => (n <= 3 ? 'beginner' : n <= 12 ? 'intermediate' : 'advanced');

const chapters: Lesson[] = bhagavadGitaChapters.map((c) =>
  make({
    id: `gita-ch${c.number}`,
    title: `Bhagavad Gita chapter ${c.number}: ${c.englishTitle}`,
    level: chapterLevel(c.number),
    collection: 'Bhagavad Gita',
    summary: c.intro,
    sections: [
      { heading: 'What happens in this chapter', paragraphs: [c.happens] },
      { heading: 'Main message', paragraphs: [c.message] },
      { heading: 'Key concepts', bullets: c.concepts },
      { heading: 'Important verses', bullets: c.importantVerses.map((v) => `Gita ${v.ref}: ${v.topic}`) },
    ],
    readMore: [{ label: `Chapter ${c.number} study page`, href: `/gita/bhagavad-gita/${c.number}` }],
    quizId: `gita-ch${c.number}`,
  }),
);

const v = verseStudies[0];
const verseLesson = make({
  id: 'verse-2-47', title: 'Bhagavad Gita 2.47: the claim to action', level: 'beginner', collection: 'Bhagavad Gita',
  summary: 'One verse, studied closely: what it says, what its key words mean and how to read it.',
  sections: [
    { heading: 'What is being said?', paragraphs: [v.brief.say] },
    { heading: 'What does it mean?', paragraphs: [v.brief.mean] },
    { heading: 'Why is it important?', paragraphs: [v.brief.why] },
    { heading: 'Key terms', bullets: v.detailed.terms.map((t) => `${t.term}: ${t.meaning}`) },
    { heading: 'What can we learn?', paragraphs: [v.brief.learn] },
  ],
  readMore: [{ label: 'Full verse page with word-by-word study', href: `/gita/bhagavad-gita/${v.chapter}/${v.verse}` }],
  quizId: 'verse-2-47',
});

const darshanaLevel: Record<string, Level> = { nyaya: 'advanced', vaisheshika: 'advanced', samkhya: 'intermediate', yoga: 'intermediate', 'purva-mimamsa': 'advanced', vedanta: 'advanced' };

const darshanaLessons: Lesson[] = darshanas.map((d) => {
  const row = darshanaComparison.entries.find((e) => e.id === d.slug)!;
  const rel = relations[d.slug] ?? [];
  return make({
    id: `darshana-${d.slug}`, title: `${d.name} Darshana`, level: darshanaLevel[d.slug], collection: 'Darshanas',
    summary: `Core question: “${d.coreQuestion}”`,
    sections: [
      { heading: 'Overview', paragraphs: [d.summary] },
      { heading: 'Key concepts', bullets: d.keyConcepts.map((k) => `${k.term}: ${k.meaning}`) },
      { heading: 'How it answers the big questions', bullets: [row.cells.reality, row.cells.self, row.cells.liberation, row.cells.knowledge] },
      { heading: 'Texts', paragraphs: [row.cells.texts] },
      ...(rel.length ? [{ heading: 'Relation to other schools', paragraphs: rel }] : []),
    ],
    readMore: [{ label: `${d.name} page`, href: `/darshanas/${d.slug}` }, { label: 'Compare the Darshanas', href: '/darshanas/compare' }],
    quizId: `darshana-${d.slug}`,
  });
});

const subschools = make({
  id: 'vedanta-subschools', title: 'Vedanta sub-schools', level: 'advanced', collection: 'Darshanas',
  summary: 'Six traditions within Vedanta, and how they differ on Brahman, the Self and the world.',
  sections: [
    { heading: 'A note on terms', paragraphs: [vedantaComparison.intro] },
    { heading: 'How each tradition relates Brahman, soul and world', bullets: vedantaComparison.entries.map((e) => `${e.name}: ${e.cells.relation}`) },
    { heading: 'Founding teachers', bullets: vedantaComparison.entries.map((e) => `${e.name}: ${e.cells.teachers}`) },
  ],
  readMore: [{ label: 'Compare the Vedanta sub-schools', href: '/darshanas/compare?set=vedanta' }],
  quizId: 'vedanta-subschools',
});

function collectionLesson(slug: string, id: string, level: Level, title: string, summary: string): Lesson {
  const c = getCategory(slug)!;
  // Only real source notes: the generic "lessons are in preparation" line is not one, and an empty section must never render.
  const sourceNotes = (c.notes ?? []).filter((n) => !n.startsWith('Detailed lessons'));
  return make({
    id, title, level, collection: c.title, summary,
    sections: [
      { heading: 'Overview', paragraphs: c.overview },
      ...(c.items ? [{ heading: c.itemsHeading ?? 'Contents', bullets: c.items.map((i) => (i.note ? `${i.name}${i.tag ? ` (${i.tag})` : ''}: ${i.note}` : i.name)) }] : []),
      ...(sourceNotes.length ? [{ heading: 'Notes on sources', bullets: sourceNotes }] : []),
    ],
    readMore: [{ label: `${c.title}`, href: `/scriptures/${c.slug}` }],
    quizId: id,
  });
}

const collections: Lesson[] = [
  collectionLesson('vedas', 'vedas', 'beginner', 'The Vedas', 'The oldest layer of the Vedic corpus and its four layers.'),
  collectionLesson('ramayana', 'ramayana', 'beginner', 'Ramayana', 'The journey of Rama, its seven Kandas and its retellings.'),
  collectionLesson('upanishads', 'upanishads', 'intermediate', 'The Upanishads', 'Thirteen principal Upanishads and what each explores.'),
  collectionLesson('mahabharata', 'mahabharata', 'intermediate', 'Mahabharata', 'The great Itihasa, its eighteen Parvas and its link to the Gita.'),
];

const order: Record<Level, string[]> = {
  beginner: ['gita-overview', 'gita-ch1', 'gita-ch2', 'verse-2-47', 'gita-ch3', 'ramayana', 'vedas'],
  intermediate: ['upanishads', 'mahabharata', 'darshana-samkhya', 'darshana-yoga', ...Array.from({ length: 9 }, (_, i) => `gita-ch${i + 4}`)],
  advanced: ['darshana-vedanta', 'vedanta-subschools', 'darshana-nyaya', 'darshana-vaisheshika', 'darshana-purva-mimamsa', ...Array.from({ length: 6 }, (_, i) => `gita-ch${i + 13}`)],
};

const byId = new Map<string, Lesson>([overview, ...chapters, verseLesson, ...darshanaLessons, subschools, ...collections].map((l) => [l.id, l]));

/** Lessons in suggested study order within each level. The level is an order of study, not a judgement of difficulty. */
export const lessons: Lesson[] = (['beginner', 'intermediate', 'advanced'] as Level[]).flatMap((lv) =>
  order[lv].map((id) => {
    const l = byId.get(id);
    if (!l) throw new Error(`Lesson ${id} missing`);
    return { ...l, level: lv };
  }),
);

export const lessonMeta = lessons.map(({ id, title, level, collection, minutes }) => ({ id, title, level, collection, minutes }));

export const getLesson = (id: string) => lessons.find((l) => l.id === id);
export const lessonsByLevel = (lv: Level) => lessons.filter((l) => l.level === lv);
