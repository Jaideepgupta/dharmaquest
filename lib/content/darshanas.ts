import type { Darshana } from './types';

export const darshanas: Darshana[] = [
  {
    slug: 'nyaya',
    number: '01',
    name: 'Nyaya',
    sanskrit: 'न्याय',
    focus: 'Logic, reasoning and valid knowledge',
    coreQuestion: 'How do we know what is true?',
    summary:
      'Nyaya is the school of logic and epistemology. It studies the means by which reliable knowledge is gained and how to reason and debate soundly.',
    keyConcepts: [
      { term: 'Pramana', meaning: 'A valid means of knowledge.' },
      { term: 'Pratyaksha', meaning: 'Perception.' },
      { term: 'Anumana', meaning: 'Inference.' },
      { term: 'Upamana', meaning: 'Comparison.' },
      { term: 'Shabda', meaning: 'Reliable testimony.' },
    ],
    foundationalText: 'Nyaya Sutras',
    foundationalAttribution: 'Traditionally attributed to Gautama (Akshapada).',
    notes: ['Nyaya later combined with Vaisheshika, and the two are often studied together.'],
    detailStatus: 'under-review',
  },
  {
    slug: 'vaisheshika',
    number: '02',
    name: 'Vaisheshika',
    sanskrit: 'वैशेषिक',
    focus: 'Categories of reality',
    coreQuestion: 'What makes up the world?',
    summary:
      'Vaisheshika analyses reality into fundamental categories. In its classical form it includes an atomistic account of matter, which should be understood in its own philosophical context and not as modern physics.',
    keyConcepts: [
      { term: 'Dravya', meaning: 'Substance.' },
      { term: 'Guna', meaning: 'Quality.' },
      { term: 'Karma', meaning: 'Action or motion (here, in the sense of physical activity).' },
      { term: 'Samanya', meaning: 'Universal or generality.' },
      { term: 'Vishesha', meaning: 'Particularity.' },
      { term: 'Samavaya', meaning: 'Inherence.' },
    ],
    foundationalText: 'Vaisheshika Sutras',
    foundationalAttribution: 'Traditionally attributed to Kanada.',
    detailStatus: 'under-review',
  },
  {
    slug: 'samkhya',
    number: '03',
    name: 'Samkhya',
    sanskrit: 'सांख्य',
    focus: 'Consciousness, nature and liberation',
    coreQuestion: 'What is consciousness, and how is it different from nature?',
    summary:
      'Samkhya distinguishes conscious awareness from the material world and describes how the world evolves. Liberation is understood as discriminating knowledge of this difference.',
    keyConcepts: [
      { term: 'Purusha', meaning: 'Conscious witness, pure awareness.' },
      { term: 'Prakriti', meaning: 'Primal nature, the source of the material world.' },
      { term: 'Gunas', meaning: 'Three strands of nature: sattva, rajas and tamas.' },
      { term: 'Tattvas', meaning: 'The principles of reality; the classical list has twenty-five.' },
    ],
    foundationalText: 'Samkhya Karika',
    foundationalAttribution: 'By Ishvarakrishna. The classical Samkhya Karika is the best-known surviving text of the school.',
    detailStatus: 'under-review',
  },
  {
    slug: 'yoga',
    number: '04',
    name: 'Yoga',
    sanskrit: 'योग',
    focus: 'Discipline of the mind and inner clarity',
    coreQuestion: 'How can we discipline the mind and attain inner clarity?',
    summary:
      'The Yoga Darshana presents a systematic practice for steadying the mind. It shares much of its framework with Samkhya, and adds a practical discipline and the notion of Ishvara.',
    keyConcepts: [
      { term: 'Chitta vritti nirodha', meaning: 'The stilling of the fluctuations of the mind, as defined in the Yoga Sutras.' },
      { term: 'Ashtanga', meaning: 'The eight limbs: yama, niyama, asana, pranayama, pratyahara, dharana, dhyana, samadhi.' },
      { term: 'Samadhi', meaning: 'Absorbed, concentrated awareness.' },
    ],
    foundationalText: 'Yoga Sutras',
    foundationalAttribution: 'Traditionally attributed to Patanjali.',
    notes: ['“Yoga” is also used for many other paths (such as Karma Yoga and Bhakti Yoga in the Bhagavad Gita), which differ from the Yoga Darshana.'],
    detailStatus: 'under-review',
  },
  {
    slug: 'purva-mimamsa',
    number: '05',
    name: 'Purva Mimamsa',
    sanskrit: 'पूर्वमीमांसा',
    focus: 'Vedic interpretation, Dharma and ritual duty',
    coreQuestion: 'How do we understand Dharma and our duties?',
    summary:
      'Purva Mimamsa is the school of Vedic interpretation. It develops rules for understanding the Vedic injunctions and treats Dharma as duty enjoined by the Veda, with extensive reflection on language and meaning.',
    keyConcepts: [
      { term: 'Dharma', meaning: 'In Mimamsa, duty as enjoined by the Veda.' },
      { term: 'Vidhi', meaning: 'Injunction.' },
      { term: 'Shabda', meaning: 'Word and verbal testimony, with a developed theory of meaning.' },
    ],
    foundationalText: 'Mimamsa Sutras',
    foundationalAttribution: 'Traditionally attributed to Jaimini.',
    notes: ['Called “Purva” (earlier) Mimamsa in contrast to Uttara (later) Mimamsa, a name for Vedanta.'],
    detailStatus: 'under-review',
  },
  {
    slug: 'vedanta',
    number: '06',
    name: 'Vedanta',
    sanskrit: 'वेदान्त',
    focus: 'Brahman, Atman and liberation',
    coreQuestion: 'What is the ultimate nature of reality and the Self?',
    summary:
      'Vedanta draws on the Upanishads, the Brahma Sutras and the Bhagavad Gita. Its schools agree on the importance of knowing Brahman and the Self but differ, sometimes sharply, on how they relate.',
    keyConcepts: [
      { term: 'Brahman', meaning: 'Ultimate reality.' },
      { term: 'Atman', meaning: 'The Self.' },
      { term: 'Moksha', meaning: 'Liberation.' },
      { term: 'Prasthanatraya', meaning: 'The three foundational sources: Upanishads, Brahma Sutras and Bhagavad Gita.' },
    ],
    foundationalText: 'Brahma Sutras',
    foundationalAttribution: 'Traditionally attributed to Badarayana.',
    notes: [
      'The Vedanta traditions below are sub-schools within Vedanta. They are not separate Darshanas.',
    ],
    detailStatus: 'under-review',
  },
];

export const vedantaSchools = [
  { name: 'Advaita Vedanta', founder: 'Adi Shankara', summary: 'Non-dualism: Atman and Brahman are ultimately one.' },
  { name: 'Vishishtadvaita', founder: 'Ramanuja', summary: 'Qualified non-dualism: souls and the world are real, and form the body of Brahman.' },
  { name: 'Dvaita', founder: 'Madhvacharya', summary: 'Dualism: God, souls and matter are eternally distinct.' },
  { name: 'Shuddhadvaita', founder: 'Vallabhacharya', summary: 'Pure non-dualism, with a devotional emphasis.' },
  { name: 'Dvaitadvaita', founder: 'Nimbarkacharya', summary: 'Dualistic non-dualism: difference and non-difference together.' },
  { name: 'Achintya Bhedabheda', founder: 'Chaitanya tradition', summary: 'Inconceivable difference and non-difference.' },
];

export const getDarshana = (slug: string) => darshanas.find((d) => d.slug === slug);
