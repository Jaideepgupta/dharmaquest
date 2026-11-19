import type { CompareSet, Thinker } from './types';

/**
 * Comparison data. These are DharmaQuest's own summaries of widely stated
 * positions, based on standard scholarly outlines (see FURTHER_READING).
 * They are not quotations from the texts. Each cell is an explanation, not a label,
 * and schools differ internally, so these are outlines of the classical positions.
 */
export const FURTHER_READING = [
  'Chandradhar Sharma, A Critical Survey of Indian Philosophy',
  'Surendranath Dasgupta, A History of Indian Philosophy (5 vols.)',
  'Satischandra Chatterjee and Dhirendramohan Datta, An Introduction to Indian Philosophy',
  'M. Hiriyanna, Outlines of Indian Philosophy',
  'S. Radhakrishnan and C. A. Moore (eds.), A Sourcebook in Indian Philosophy',
];

export const darshanaComparison: CompareSet = {
  id: 'darshanas',
  title: 'The six Darshanas',
  intro:
    'The six classical schools that accept the authority of the Vedas. They overlap in some areas and disagree sharply in others.',
  caution:
    'Each school has a long history of internal debate and later development. These cells outline the classical positions and do not capture every thinker or period.',
  dimensions: [
    { id: 'reality', label: 'View of reality' },
    { id: 'self', label: 'Nature of the Self' },
    { id: 'liberation', label: 'Liberation' },
    { id: 'knowledge', label: 'Sources of knowledge' },
    { id: 'texts', label: 'Important texts' },
    { id: 'thinkers', label: 'Major thinkers' },
    { id: 'distinct', label: 'What sets it apart' },
  ],
  entries: [
    {
      id: 'nyaya', name: 'Nyaya', href: '/darshanas/nyaya',
      cells: {
        reality: 'Realist. The world and its many distinct entities are real and can be known. Nyaya analyses sixteen topics (padarthas), beginning with the means of knowledge (pramana) and the objects of knowledge (prameya).',
        self: 'The Self (atman) is a distinct, eternal substance, the bearer of knowledge, desire and effort. Consciousness is treated as a quality of the Self and not as its essence.',
        liberation: 'Apavarga: the final end of suffering, reached through right knowledge of the objects of knowledge, including the Self.',
        knowledge: 'Four pramanas: perception (pratyaksha), inference (anumana), comparison (upamana) and reliable testimony (shabda).',
        texts: 'The Nyaya Sutras (attributed to Gautama, also called Akshapada); Vatsyayana’s commentary; later Navya-Nyaya works such as Gangesha’s Tattvachintamani.',
        thinkers: 'Gautama (Akshapada), Vatsyayana, Udayana, Gangesha.',
        distinct: 'The school most devoted to the method of reasoning and debate. Its logic and theory of knowledge were drawn on by many other schools.',
      },
    },
    {
      id: 'vaisheshika', name: 'Vaisheshika', href: '/darshanas/vaisheshika',
      cells: {
        reality: 'Realist pluralism. Reality is analysed into categories (padarthas): substance, quality, action, universal, particularity and inherence. Later authors add absence (abhava). Its atomism concerns the structure of matter in its own philosophical framework.',
        self: 'The Self is one of nine substances (earth, water, fire, air, ether, time, space, self and mind): an eternal substance, distinct from the mind and body.',
        liberation: 'Moksha: release from the cycle of birth and death, associated with true knowledge (tattvajnana) of the categories.',
        knowledge: 'Two pramanas in the classical school: perception and inference. Testimony is treated as a kind of inference.',
        texts: 'The Vaisheshika Sutras (attributed to Kanada); Prashastapada’s Padarthadharmasangraha.',
        thinkers: 'Kanada, Prashastapada.',
        distinct: 'Supplies the system of categories and substances that Nyaya came to adopt, which is why the two are often studied together.',
      },
    },
    {
      id: 'samkhya', name: 'Samkhya', href: '/darshanas/samkhya',
      cells: {
        reality: 'Dualism of two ultimate principles: purusha (conscious, inactive) and prakriti (insentient primal nature made of the three gunas). The world evolves from prakriti in stages. The classical list has twenty-five principles.',
        self: 'Purusha is pure consciousness: a witness, not an agent. Classical Samkhya holds that there are many purushas, each distinct.',
        liberation: 'Kaivalya: the isolation of purusha from prakriti, reached through discriminating knowledge of their difference.',
        knowledge: 'Three pramanas: perception, inference and reliable testimony.',
        texts: 'The Samkhya Karika of Ishvarakrishna; Vachaspati Mishra’s Tattva-Kaumudi; the later Samkhya-Pravachana-Sutra, with Vijnanabhikshu’s commentary.',
        thinkers: 'Kapila (the traditional founder), Ishvarakrishna, Vachaspati Mishra, Vijnanabhikshu.',
        distinct: 'The classical school does not posit a creator God. Samkhya ideas also appear in the Mahabharata, the Gita and the Puranas, in forms that differ from the classical school.',
      },
    },
    {
      id: 'yoga', name: 'Yoga', href: '/darshanas/yoga',
      cells: {
        reality: 'Shares Samkhya’s framework of purusha and prakriti and adds Ishvara, a special purusha untouched by affliction and karma. Its emphasis is on practice more than on metaphysics.',
        self: 'Purusha is pure awareness, distinct from the mind (chitta). Suffering is traced to confusing the two.',
        liberation: 'Kaivalya: the stilling of the mind’s fluctuations (chitta-vritti-nirodha), with awareness abiding in its own nature. Samadhi is the culminating practice.',
        knowledge: 'Three pramanas, as listed in the Yoga Sutras: perception, inference and testimony (agama).',
        texts: 'The Yoga Sutras (attributed to Patanjali); Vyasa’s Bhashya; Vachaspati Mishra’s Tattva-Vaisharadi.',
        thinkers: 'Patanjali, Vyasa, Vachaspati Mishra, Vijnanabhikshu.',
        distinct: 'A systematic discipline of eight limbs (ashtanga), from ethical restraints to samadhi. The word “yoga” is also used for other paths, such as Karma Yoga in the Bhagavad Gita, which are not the Yoga Darshana.',
      },
    },
    {
      id: 'purva-mimamsa', name: 'Purva Mimamsa', href: '/darshanas/purva-mimamsa',
      cells: {
        reality: 'Realist. The world is real, and the Veda is regarded as authorless (apaurusheya) and self-authenticating. Its central concern is what the Vedic injunctions require.',
        self: 'The Self is an eternal, individual knower and agent that continues after death and receives the results of its actions.',
        liberation: 'Early Mimamsa centres on dharma and its results (such as heaven) more than on liberation. Later thinkers, including Kumarila and Prabhakara, accept liberation as the end of rebirth.',
        knowledge: 'Prabhakara accepts five pramanas: perception, inference, comparison, testimony and presumption (arthapatti). Kumarila adds a sixth, non-apprehension (anupalabdhi).',
        texts: 'The Mimamsa Sutras (attributed to Jaimini); Shabara’s Bhashya; Kumarila Bhatta’s Shlokavarttika; Prabhakara’s Brihati.',
        thinkers: 'Jaimini, Shabara, Kumarila Bhatta, Prabhakara.',
        distinct: 'Developed principles of textual interpretation and a theory of language and meaning that other schools drew on. Ritual action (karma) is its centre, which is why it is called “earlier” (purva) inquiry.',
      },
    },
    {
      id: 'vedanta', name: 'Vedanta', href: '/darshanas/vedanta',
      cells: {
        reality: 'Centres on Brahman as ultimate reality, understood differently by each sub-school. See the Vedanta comparison for how they differ.',
        self: 'The Self (atman) is central. Whether it is identical with, part of, or distinct from Brahman is what separates the sub-schools.',
        liberation: 'Moksha, understood as knowledge of Brahman. Its nature differs: realisation of identity in Advaita; closeness to God or service of God in the theistic schools.',
        knowledge: 'The Upanishads, Brahma Sutras and Bhagavad Gita (the Prasthanatraya) are the foundational sources, supported by reasoning. Each sub-school reads them through its own line of commentary.',
        texts: 'The Brahma Sutras (attributed to Badarayana), the Upanishads and the Bhagavad Gita, with the commentaries of each sub-school’s founders.',
        thinkers: 'Badarayana, Gaudapada, Shankara, Ramanuja, Madhva and others. See the sub-school comparison.',
        distinct: 'Often called Uttara Mimamsa (“later inquiry”): concerned with knowledge of Brahman, in contrast to Purva Mimamsa’s concern with ritual.',
      },
    },
  ],
};

export const vedantaComparison: CompareSet = {
  id: 'vedanta',
  title: 'Vedanta sub-schools',
  intro:
    'These are traditions within Vedanta. They are not separate Darshanas. They agree that the Upanishads, Brahma Sutras and Bhagavad Gita are central, and they differ on how Brahman, the individual Self and the world relate.',
  caution:
    'Each tradition has its own sub-lineages and a large body of later writing. These cells outline the main positions associated with each founder, not every view held within the tradition.',
  dimensions: [
    { id: 'relation', label: 'Brahman, soul and world' },
    { id: 'brahman', label: 'Nature of Brahman' },
    { id: 'self', label: 'Nature of the Self' },
    { id: 'world', label: 'The world' },
    { id: 'liberation', label: 'Liberation' },
    { id: 'knowledge', label: 'Sources and method' },
    { id: 'texts', label: 'Key texts' },
    { id: 'teachers', label: 'Founding teachers' },
    { id: 'emphasis', label: 'Characteristic emphasis' },
  ],
  entries: [
    {
      id: 'advaita', name: 'Advaita Vedanta',
      cells: {
        relation: 'Non-dual: the individual Self (jiva) is ultimately identical with Brahman. Apparent difference is attributed to ignorance (avidya).',
        brahman: 'Nirguna Brahman: pure being and consciousness without attributes. Ishvara is Brahman understood through maya.',
        self: 'Atman is not different from Brahman. The sense of a separate individual is superimposed.',
        world: 'Not ultimately real, and not wholly unreal either. Often described as mithya, dependent on Brahman.',
        liberation: 'Moksha is knowledge of the Self’s identity with Brahman, which may be realised in this life (jivanmukti).',
        knowledge: 'Shruti, especially the Upanishadic Mahavakyas, is primary, supported by reasoning and contemplation. Six pramanas are generally accepted.',
        texts: 'Shankara’s commentaries on the Brahma Sutras, the principal Upanishads and the Bhagavad Gita; Gaudapada’s Karika on the Mandukya Upanishad.',
        teachers: 'Gaudapada and Adi Shankara, followed by later teachers.',
        emphasis: 'Knowledge (jnana) of non-duality.',
      },
    },
    {
      id: 'vishishtadvaita', name: 'Vishishtadvaita',
      cells: {
        relation: 'Qualified non-dualism: Brahman is one, and souls and matter are real and inseparable from Brahman, forming its “body”.',
        brahman: 'Saguna Brahman, identified with Narayana (Vishnu), who has auspicious qualities.',
        self: 'The soul is real, eternal and distinct, yet dependent on and inseparable from Brahman.',
        world: 'Real, as part of the body of Brahman.',
        liberation: 'Attaining the presence of Brahman and serving the Lord, with the soul keeping its individuality.',
        knowledge: 'Shruti is primary. Perception and reasoning are valid within their domain. Devotion (bhakti) and surrender (prapatti) are central in practice.',
        texts: 'Ramanuja’s Sri Bhashya on the Brahma Sutras and his Gita Bhashya.',
        teachers: 'Ramanuja, within the Sri Vaishnava tradition.',
        emphasis: 'Devotion and surrender to God.',
      },
    },
    {
      id: 'dvaita', name: 'Dvaita',
      cells: {
        relation: 'Dualism: God (Vishnu) and individual souls are eternally distinct, and matter is distinct as well. The tradition lists five differences: God–soul, God–matter, soul–soul, soul–matter and matter–matter.',
        brahman: 'Vishnu as the independent supreme reality, on whom everything else depends.',
        self: 'Souls are many, real and eternally distinct from God and from each other, and dependent on God.',
        world: 'Real, and distinct from God and from souls.',
        liberation: 'Attaining closeness to Vishnu through his grace, while remaining distinct from him. Souls differ in their degree of bliss.',
        knowledge: 'Three pramanas: perception, inference and testimony (agama).',
        texts: 'Madhva’s commentaries on the Brahma Sutras, Upanishads and Bhagavad Gita; his Anuvyakhyana.',
        teachers: 'Madhvacharya.',
        emphasis: 'Dependence on God, grace and devotion.',
      },
    },
    {
      id: 'shuddhadvaita', name: 'Shuddhadvaita',
      cells: {
        relation: 'Pure non-dualism: Brahman alone is real. The world and souls are real manifestations of Brahman, and are not products of illusion.',
        brahman: 'Brahman is identified with Krishna.',
        self: 'The soul is a part of Brahman.',
        world: 'Real, as a manifestation of Brahman.',
        liberation: 'Through grace (pushti) and loving devotion, leading to participation in Krishna’s divine play (lila).',
        knowledge: 'Shruti is primary, and the Bhagavata Purana is held in especially high regard in the tradition.',
        texts: 'Vallabha’s Anubhashya on the Brahma Sutras and his Subodhini on the Bhagavata Purana.',
        teachers: 'Vallabhacharya.',
        emphasis: 'The path of grace (Pushtimarga).',
      },
    },
    {
      id: 'dvaitadvaita', name: 'Dvaitadvaita',
      cells: {
        relation: 'Difference and non-difference are both real: souls and the world are different from Brahman in some respects and non-different in others.',
        brahman: 'Brahman is identified with Krishna.',
        self: 'The soul is dependent on Brahman, and both different from and non-different from it.',
        world: 'Real, and dependent on Brahman.',
        liberation: 'Through devotion and surrender, according to the tradition.',
        knowledge: 'Shruti is primary.',
        texts: 'Nimbarka’s Vedanta-Parijata-Saurabha, a short commentary on the Brahma Sutras.',
        teachers: 'Nimbarkacharya.',
        emphasis: 'The coexistence of difference and non-difference.',
      },
    },
    {
      id: 'achintya-bhedabheda', name: 'Achintya Bhedabheda',
      cells: {
        relation: 'Inconceivable (achintya) difference and non-difference: souls and the world are both different from and one with God, in a relation that reason cannot fully grasp.',
        brahman: 'Krishna as the supreme form of the Godhead (Bhagavan), in the Chaitanya tradition.',
        self: 'The soul is an eternal part of God with its own individuality.',
        world: 'Real, as an expression of God’s energy.',
        liberation: 'Prema (loving devotion to Krishna) is held to be the highest goal, beyond release alone.',
        knowledge: 'Shruti, with the Bhagavata Purana especially authoritative. God is known through devotion.',
        texts: 'Jiva Goswami’s Sandarbhas; Baladeva Vidyabhushana’s Govinda Bhashya.',
        teachers: 'Chaitanya Mahaprabhu (the inspiration of the tradition), Jiva Goswami, Baladeva Vidyabhushana.',
        emphasis: 'Devotion (bhakti) as the highest path.',
      },
    },
  ],
};

export const compareSets = [darshanaComparison, vedantaComparison];

export const relations: Record<string, string[]> = {
  nyaya: ['Traditionally paired with Vaisheshika. Later Nyaya adopts Vaisheshika’s categories, and the two are often studied together.'],
  vaisheshika: ['Traditionally paired with Nyaya, which shares its realist outlook and came to adopt its categories.'],
  samkhya: ['Yoga shares Samkhya’s framework of purusha and prakriti.', 'Vedanta texts engage critically with Samkhya’s view of nature as the source of the world.'],
  yoga: ['Shares Samkhya’s metaphysical framework and adds Ishvara and a practical discipline.'],
  'purva-mimamsa': ['Purva Mimamsa (“earlier inquiry”) and Vedanta, or Uttara Mimamsa (“later inquiry”), are traditionally seen as two parts of one inquiry into the Veda: ritual action and knowledge of Brahman.'],
  vedanta: ['Traditionally called Uttara Mimamsa, in relation to Purva Mimamsa.', 'Vedanta sub-schools are not separate Darshanas. Compare them side by side.'],
};

export const thinkers: Record<string, Thinker[]> = {
  nyaya: [
    { name: 'Gautama (Akshapada)', note: 'Traditionally attributed author of the Nyaya Sutras.' },
    { name: 'Vatsyayana', note: 'Author of the classic commentary on the Nyaya Sutras.' },
    { name: 'Udayana', note: 'A later Nyaya thinker who also wrote on Vaisheshika.' },
    { name: 'Gangesha', note: 'Author of the Tattvachintamani, associated with Navya-Nyaya.' },
  ],
  vaisheshika: [
    { name: 'Kanada', note: 'Traditionally attributed author of the Vaisheshika Sutras.' },
    { name: 'Prashastapada', note: 'Author of the Padarthadharmasangraha, a major exposition of the school.' },
  ],
  samkhya: [
    { name: 'Kapila', note: 'The traditional founder of Samkhya.' },
    { name: 'Ishvarakrishna', note: 'Author of the Samkhya Karika.' },
    { name: 'Vachaspati Mishra', note: 'Author of the Tattva-Kaumudi on the Samkhya Karika.' },
    { name: 'Vijnanabhikshu', note: 'Commentator on the later Samkhya-Pravachana-Sutra.' },
  ],
  yoga: [
    { name: 'Patanjali', note: 'Traditionally attributed author of the Yoga Sutras.' },
    { name: 'Vyasa', note: 'Author of the Bhashya, the earliest major commentary on the Yoga Sutras.' },
    { name: 'Vachaspati Mishra', note: 'Author of the Tattva-Vaisharadi on Vyasa’s Bhashya.' },
  ],
  'purva-mimamsa': [
    { name: 'Jaimini', note: 'Traditionally attributed author of the Mimamsa Sutras.' },
    { name: 'Shabara', note: 'Author of the major commentary on the Mimamsa Sutras.' },
    { name: 'Kumarila Bhatta', note: 'Founder of one of the two main Mimamsa lines.' },
    { name: 'Prabhakara', note: 'Founder of the other main Mimamsa line.' },
  ],
  vedanta: [
    { name: 'Badarayana', note: 'Traditionally attributed author of the Brahma Sutras.' },
    { name: 'Gaudapada', note: 'Author of the Karika on the Mandukya Upanishad.' },
    { name: 'Founders of the sub-schools', note: 'Adi Shankara, Ramanuja, Madhva and others, covered in the sub-school comparison.' },
  ],
};
