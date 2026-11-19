/**
 * Content model. Deliberately flat and serialisable so it can later be loaded
 * from Supabase/PostgreSQL without changing the UI layer.
 */
export type ContentStatus = 'published' | 'under-review';

/** Traditional classification of a text. Never merge these categories. */
export type Classification =
  | 'Shruti'
  | 'Smriti'
  | 'Itihasa'
  | 'Purana'
  | 'Darshana literature'
  | 'Yoga & devotional literature';

export interface CatalogItem {
  name: string;
  /** One factual line. Anything unverified is omitted, not guessed. */
  note?: string;
  /** Optional grouping label (e.g. associated Veda, kanda, tradition). */
  tag?: string;
}

export interface ScriptureCategory {
  slug: string;
  title: string;
  sanskrit?: string;
  tone: 'saffron' | 'plum' | 'gold' | 'green' | 'blue' | 'rose' | 'maroon';
  glyph: string;
  tagline: string;
  classification: Classification[];
  overview: string[];
  /** Heading for the catalogue list below the overview. */
  itemsHeading?: string;
  items?: CatalogItem[];
  notes?: string[];
  /** Overall status of the *detailed* learning content for this category. */
  detailStatus: ContentStatus;
  related?: { label: string; href: string }[];
}

export interface Darshana {
  slug: string;
  number: string;
  name: string;
  sanskrit: string;
  focus: string;
  coreQuestion: string;
  summary: string;
  keyConcepts: { term: string; meaning: string }[];
  foundationalText: string;
  foundationalAttribution: string;
  notes?: string[];
  detailStatus: ContentStatus;
}

export interface SourceRef {
  id: string;
  title: string;
  /** Traditional attribution, flagged as such. */
  attribution?: string;
  locator: string;
}

export interface VerseRecord {
  id: string;
  reference: string;
  sanskrit: string[];
  transliteration: string[];
  transliterationScheme: string;
  source: SourceRef;
  /** Translations stay empty until a verified, licensed/public-domain one is added. */
  hindi: { text?: string; translator?: string; status: ContentStatus };
  english: { text?: string; translator?: string; status: ContentStatus };
  briefSummary: string;
  summaryNote: string;
  theme: string;
}

export interface SearchEntry {
  title: string;
  subtitle: string;
  href: string;
  kind: 'Scripture' | 'Gita' | 'Upanishad' | 'Darshana' | 'Concept' | 'Epic' | 'Path';
  keywords: string;
}
