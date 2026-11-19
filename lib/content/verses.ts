import type { VerseRecord } from './types';

/**
 * Wisdom of the Day source data.
 * Rule: no verse is added without a traceable source. Translations stay
 * "under-review" until a verified public-domain or licensed text is entered.
 */
export const verseOfTheDay: VerseRecord = {
  id: 'bg-2-47',
  reference: 'Bhagavad Gita 2.47',
  sanskrit: [
    'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।',
    'मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
  ],
  transliteration: [
    'karmaṇy evādhikāras te mā phaleṣu kadācana |',
    'mā karma-phala-hetur bhūr mā te saṅgo ’stv akarmaṇi ||',
  ],
  transliterationScheme: 'IAST',
  source: {
    id: 'src-bg',
    title: 'Bhagavad Gita',
    attribution: 'Part of the Mahabharata, Bhishma Parva',
    locator: 'Chapter 2 (Sankhya Yoga), verse 47',
  },
  hindi: { status: 'under-review' },
  english: { status: 'under-review' },
  briefSummary:
    'Krishna explains that we should focus on performing our responsibilities without becoming attached to the results. The teaching also warns against using this idea as an excuse for inaction.',
  summaryNote: 'DharmaQuest summary. It is not a translation.',
  theme: 'Karma Yoga',
};
