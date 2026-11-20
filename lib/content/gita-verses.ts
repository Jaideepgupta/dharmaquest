import type { VerseStudy } from './types';

/**
 * Verse studies added after 2.47 (which lives in gita.ts as the original template).
 *
 * Source rules, same as 2.47:
 *  - The Sanskrit was compared word for word between two independent public copies (see PROVENANCE below). Verses where
 *    the copies disagreed in the words themselves (e.g. 18.66, `त्वा` vs `त्वां`) are NOT here: they stay "under review".
 *  - Transliteration (IAST), word glosses, summaries and explanations are DharmaQuest's own and are labelled as such.
 *  - No Hindi/English translation until a named, public-domain or licensed translator is added.
 *  - No commentary is quoted or summarised until verified quotations are added.
 */

const chapterNames: Record<number, string> = { 2: 'Sankhya Yoga', 3: 'Karma Yoga', 4: 'Jnana Karma Sannyasa Yoga', 6: 'Dhyana Yoga', 9: 'Raja Vidya Raja Guhya Yoga' };

const sourceLines = (ch: number, v: number) => [`Bhagavad Gita, Chapter ${ch} (${chapterNames[ch]}), verse ${v}`, 'Part of the Mahabharata, Bhishma Parva'];

const WORDS_NOTE =
  'This is the DharmaQuest word gloss, our own reading of the Sanskrit. It is not taken from a published translation. Glosses give the most common sense of each word; commentaries will be cited once their texts are added.';

const COMMENTARY_NOTE =
  'Verified quotations from traditional commentators are not yet added, so DharmaQuest does not summarise their readings. Commentary on this verse: content under review.';

const provenance = (note?: string) => [
  'Sanskrit text: ancient (public domain). Compared word for word between two independent public copies, the open "gita/gita" dataset and the Sanskrit Wikisource edition of the chapter. They agree on every word; they differ only in spelling conventions (for example the anusvāra versus the conjunct nasal), and the conjunct style is used here, as on the 2.47 page.' + (note ? ' ' + note : ''),
  'Transliteration (IAST), word gloss, summaries and explanations: written by DharmaQuest. These are editorial and are not translations or commentary.',
  'Hindi and English translations: none yet. They will be added only from a named, public-domain or licensed translator.',
];

const none = { status: 'under-review' as const };
const href = (ch: number, v: number) => `/gita/bhagavad-gita/${ch}/${v}`;

export const moreVerseStudies: VerseStudy[] = [
  /* ---------------------------------------------------------------- 2.13 */
  {
    chapter: 2, verse: 13, reference: 'Bhagavad Gita 2.13',
    sanskrit: ['देहिनोऽस्मिन्यथा देहे कौमारं यौवनं जरा ।', 'तथा देहान्तरप्राप्तिर्धीरस्तत्र न मुह्यति ॥'],
    transliteration: ['dehino ’smin yathā dehe kaumāraṃ yauvanaṃ jarā |', 'tathā dehāntara-prāptir dhīras tatra na muhyati ||'],
    transliterationScheme: 'IAST',
    sourceLines: sourceLines(2, 13),
    words: [
      { word: 'dehinaḥ', gloss: 'of the embodied one (the one who has a body)' },
      { word: 'asmin', gloss: 'in this' },
      { word: 'yathā', gloss: 'as, just as' },
      { word: 'dehe', gloss: 'in the body' },
      { word: 'kaumāram', gloss: 'childhood' },
      { word: 'yauvanam', gloss: 'youth' },
      { word: 'jarā', gloss: 'old age' },
      { word: 'tathā', gloss: 'so, in the same way' },
      { word: 'deha-antara-prāptiḥ', gloss: 'attainment of another body (compound)' },
      { word: 'dhīraḥ', gloss: 'the steady, resolute or wise one' },
      { word: 'tatra', gloss: 'in that matter, there' },
      { word: 'na', gloss: 'not' },
      { word: 'muhyati', gloss: 'is bewildered, is deluded' },
    ],
    wordsNote: WORDS_NOTE,
    hindi: none, english: none,
    brief: {
      say: 'Just as the embodied one passes through childhood, youth and old age in this body, so too it takes on another body. The steady person is not bewildered by this.',
      mean: 'Krishna starts from ordinary experience: a person changes greatly from childhood to old age and is still recognised as the same person. He uses this to say that a steady person is not thrown into confusion by the passing from one body to another.',
      why: 'It is among the first statements in Krishna’s teaching in chapter 2, given in answer to Arjuna’s grief. It introduces the idea of continuity through change that the next verses develop.',
      learn: 'The verse invites us to notice how much about us changes over a life while something is still called “I”, and to ask what that implies.',
    },
    detailed: {
      terms: [
        { term: 'Dehin', meaning: 'The embodied one: the one who has (-in) a body (deha). In this part of chapter 2 it points to the Self that dwells in the body.' },
        { term: 'Dhīra', meaning: 'Steady, resolute, wise: a person who is not shaken. The verse says such a person is not deluded about this passage.' },
        { term: 'Muhyati', meaning: 'Is bewildered or deluded. The verse says what the steady one does not do.' },
        { term: 'Deha-antara-prāpti', meaning: 'Literally “attainment of another body”. The verse treats it as continuing the same sequence as childhood, youth and old age.' },
      ],
      structure: [
        'First half (line 1): as the embodied one passes through childhood, youth and old age in this body …',
        'Second half (line 2): … so there is the attainment of another body, and the steady one is not deluded about it.',
      ],
      context:
        'Verse 2.13 comes early in Krishna’s teaching in chapter 2. Arjuna has put down his bow in grief; from 2.11 Krishna begins to speak about grief and about the Self. This verse comes before the verse on heat, cold, pleasure and pain (2.14) and the teaching that the Self is neither born nor dies (2.20).',
      apply:
        'Read as a reflection on continuity through change, the verse prompts the question of what in us stays constant while our bodies and circumstances change. Different traditions answer that question differently.',
      related: [
        { ref: '2.20', topic: 'The Self is neither born nor dies', href: href(2, 20) },
        { ref: '2.22', topic: 'Worn-out clothes are discarded for new ones, as the body is' },
        { ref: '2.47', topic: 'The claim to action, not to its fruits', href: href(2, 47) },
      ],
      commentaryNote: COMMENTARY_NOTE,
    },
    provenance: provenance(),
  },

  /* ---------------------------------------------------------------- 2.20 */
  {
    chapter: 2, verse: 20, reference: 'Bhagavad Gita 2.20',
    sanskrit: ['न जायते म्रियते वा कदाचिन्नायं भूत्वा भविता वा न भूयः ।', 'अजो नित्यः शाश्वतोऽयं पुराणो न हन्यते हन्यमाने शरीरे ॥'],
    transliteration: ['na jāyate mriyate vā kadācin nāyaṃ bhūtvā bhavitā vā na bhūyaḥ |', 'ajo nityaḥ śāśvato ’yaṃ purāṇo na hanyate hanyamāne śarīre ||'],
    transliterationScheme: 'IAST',
    sourceLines: sourceLines(2, 20),
    words: [
      { word: 'na', gloss: 'not' },
      { word: 'jāyate', gloss: 'is born' },
      { word: 'mriyate', gloss: 'dies' },
      { word: 'vā', gloss: 'or' },
      { word: 'kadācit', gloss: 'ever, at any time' },
      { word: 'ayam', gloss: 'this one' },
      { word: 'bhūtvā', gloss: 'having come into being' },
      { word: 'bhavitā', gloss: 'will come to be' },
      { word: 'bhūyaḥ', gloss: 'again, further' },
      { word: 'ajaḥ', gloss: 'unborn' },
      { word: 'nityaḥ', gloss: 'constant, eternal' },
      { word: 'śāśvataḥ', gloss: 'everlasting' },
      { word: 'purāṇaḥ', gloss: 'ancient, primeval' },
      { word: 'hanyate', gloss: 'is killed' },
      { word: 'hanyamāne śarīre', gloss: 'when the body is being killed (locative absolute)' },
    ],
    wordsNote:
      WORDS_NOTE + ' The second half of line 1 (bhūtvā bhavitā vā na bhūyaḥ) can be construed in more than one way, and commentators differ. DharmaQuest does not choose between them here.',
    hindi: none, english: none,
    brief: {
      say: 'This one is never born and never dies. It is unborn, constant, everlasting and ancient. It is not killed when the body is killed.',
      mean: 'Krishna describes the one who dwells in the body as beyond birth and death, and distinct from the body that is born, ages and dies.',
      why: 'It is one of the best-known verses on the Self in the Gita. It stands at the centre of Krishna’s teaching in chapter 2 and answers Arjuna’s fear of killing and being killed.',
      learn: 'The verse separates what is said to change (the body) from what is said not to change (the Self). How this Self is understood in relation to the Divine differs between the Vedanta schools.',
    },
    detailed: {
      terms: [
        { term: 'Ayam', meaning: '“This one”. The verse does not name the Self; in context it refers to the embodied one introduced in the earlier verses of the chapter.' },
        { term: 'Aja', meaning: 'Unborn (a-ja). The first of four words that say the one spoken of does not come into being.' },
        { term: 'Nitya · Śāśvata · Purāṇa', meaning: 'Constant, everlasting and ancient: three words in a row stressing that the one spoken of does not pass away.' },
        { term: 'Hanyate', meaning: '“Is killed”. The verse says that even when the body is killed, this one is not.' },
      ],
      structure: [
        'First half (line 1): never born, never dies, and not something that comes into being and then ceases (see the note on the second half of the line).',
        'Second half (line 2): unborn, constant, everlasting, ancient; not killed when the body is killed.',
      ],
      context:
        'Verse 2.20 is within Krishna’s teaching on the Self in chapter 2. Verse 2.19 says that neither the one who thinks it kills nor the one who thinks it is killed understands. A closely related verse with similar wording appears in the Katha Upanishad (1.2.18).',
      apply:
        'The verse is often read as separating what changes from what does not. Different Vedanta schools understand the relationship between this Self and the Divine differently, and this page does not decide between them.',
      related: [
        { ref: '2.13', topic: 'The embodied one passes through childhood, youth and old age', href: href(2, 13) },
        { ref: '2.22', topic: 'Worn-out clothes are discarded for new ones, as the body is' },
        { ref: '2.23', topic: 'Weapons cannot cut this one; fire cannot burn it' },
      ],
      commentaryNote: COMMENTARY_NOTE,
    },
    provenance: provenance(),
  },

  /* ---------------------------------------------------------------- 3.35 */
  {
    chapter: 3, verse: 35, reference: 'Bhagavad Gita 3.35',
    sanskrit: ['श्रेयान्स्वधर्मो विगुणः परधर्मात्स्वनुष्ठितात् ।', 'स्वधर्मे निधनं श्रेयः परधर्मो भयावहः ॥'],
    transliteration: ['śreyān sva-dharmo viguṇaḥ para-dharmāt sv-anuṣṭhitāt |', 'sva-dharme nidhanaṃ śreyaḥ para-dharmo bhayāvahaḥ ||'],
    transliterationScheme: 'IAST',
    sourceLines: sourceLines(3, 35),
    words: [
      { word: 'śreyān', gloss: 'better' },
      { word: 'sva-dharmaḥ', gloss: 'one’s own dharma, one’s own duty (compound)' },
      { word: 'viguṇaḥ', gloss: 'lacking merit, imperfectly done' },
      { word: 'para-dharmāt', gloss: 'than another’s dharma (ablative)' },
      { word: 'su-anuṣṭhitāt', gloss: 'than well performed, well carried out' },
      { word: 'sva-dharme', gloss: 'in one’s own dharma' },
      { word: 'nidhanam', gloss: 'death, end' },
      { word: 'śreyaḥ', gloss: 'better' },
      { word: 'para-dharmaḥ', gloss: 'another’s dharma' },
      { word: 'bhaya-āvahaḥ', gloss: 'bringing fear, bringing danger' },
    ],
    wordsNote: WORDS_NOTE + ' The word svadharma is read in more than one way by traditional commentators and modern readers; the neutral gloss is given here.',
    hindi: none, english: none,
    brief: {
      say: 'One’s own dharma, even if imperfectly done, is better than another’s dharma well performed. Death in one’s own dharma is better; another’s dharma brings fear.',
      mean: 'Krishna says that it is better to follow one’s own path of duty, even imperfectly, than to take up someone else’s and do it well.',
      why: 'It is a much-quoted verse on duty in the chapter on action (Karma Yoga). A nearly identical first line appears again in chapter 18.',
      learn: 'The verse asks which duties are truly one’s own and warns against imitating another’s path. What counts as “one’s own” is read differently by different readers.',
    },
    detailed: {
      terms: [
        { term: 'Svadharma', meaning: 'One’s own dharma or duty. Readings differ on what it means here: duty according to one’s role or station, according to one’s nature, or one’s own path. DharmaQuest does not choose.' },
        { term: 'Paradharma', meaning: 'Another’s dharma: the duty or path that belongs to someone else.' },
        { term: 'Viguṇa', meaning: 'Lacking merit or quality. Here it describes one’s own duty done imperfectly.' },
        { term: 'Bhayāvaha', meaning: 'Bringing fear or danger, said here of another’s dharma.' },
      ],
      structure: [
        'First half (line 1): one’s own dharma, though imperfect, is better than another’s dharma, well performed.',
        'Second half (line 2): death in one’s own dharma is better; another’s dharma brings fear.',
      ],
      context:
        'Verse 3.35 is in chapter 3 (Karma Yoga). Right after it, in 3.36, Arjuna asks what drives a person to do wrong even without wishing to. Chapter 18 repeats the first line with a different continuation (18.47).',
      apply:
        'The verse can prompt reflection on which responsibilities are authentically one’s own, and on the pull of comparing oneself with others. Readers differ on how it relates to social roles; this page takes no side.',
      related: [
        { ref: '2.31', topic: 'Arjuna is reminded to consider his own dharma' },
        { ref: '2.47', topic: 'The claim to action, not to its fruits', href: href(2, 47) },
        { ref: '18.47', topic: 'The first line repeats, with a different second half' },
      ],
      commentaryNote: COMMENTARY_NOTE,
    },
    provenance: provenance(),
  },

  /* ----------------------------------------------------------------- 4.7 */
  {
    chapter: 4, verse: 7, reference: 'Bhagavad Gita 4.7',
    sanskrit: ['यदा यदा हि धर्मस्य ग्लानिर्भवति भारत ।', 'अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम् ॥'],
    transliteration: ['yadā yadā hi dharmasya glānir bhavati bhārata |', 'abhyutthānam adharmasya tadātmānaṃ sṛjāmy aham ||'],
    transliterationScheme: 'IAST',
    sourceLines: sourceLines(4, 7),
    words: [
      { word: 'yadā yadā', gloss: 'whenever (repeated for emphasis: “whenever, whenever”)' },
      { word: 'hi', gloss: 'indeed' },
      { word: 'dharmasya', gloss: 'of dharma' },
      { word: 'glāniḥ', gloss: 'decline, weakening' },
      { word: 'bhavati', gloss: 'there is, arises' },
      { word: 'bhārata', gloss: 'O descendant of Bharata (a form of address to Arjuna)' },
      { word: 'abhyutthānam', gloss: 'rising up, ascendancy' },
      { word: 'adharmasya', gloss: 'of adharma (the opposite of dharma)' },
      { word: 'tadā', gloss: 'then' },
      { word: 'ātmānam', gloss: 'myself (reflexive: “the self”)' },
      { word: 'sṛjāmi', gloss: 'I send forth, I bring forth' },
      { word: 'aham', gloss: 'I' },
    ],
    wordsNote: WORDS_NOTE,
    hindi: none, english: none,
    brief: {
      say: 'Whenever dharma declines and adharma rises, O Bharata, then I send myself forth.',
      mean: 'Krishna says that when dharma weakens and adharma gains ground, he brings himself forth.',
      why: 'It is one of the most quoted verses of the Gita. In several traditions it is the textual basis for the idea of avatāra (divine descent), and it is read together with the next verse.',
      learn: 'The verse links the idea of a divine response to a loss of dharma. How this “sending forth” is understood differs between traditions and schools.',
    },
    detailed: {
      terms: [
        { term: 'Dharma', meaning: 'A wide word: right order, duty, law, righteousness. It is left untranslated here because no single English word covers it.' },
        { term: 'Glāni', meaning: 'Decline, languishing: the weakening of dharma that the verse names as the occasion.' },
        { term: 'Adharma', meaning: 'The opposite of dharma; its rise is the second condition named.' },
        { term: 'Sṛjāmi', meaning: '“I send forth” or “I bring forth”. The verse says Krishna does this to himself (ātmānam).' },
      ],
      structure: [
        'First half (line 1): whenever there is a decline of dharma, O Bharata …',
        'Second half (line 2): … and a rise of adharma, then I send forth myself.',
      ],
      context:
        'Verse 4.7 is in chapter 4. Just before it (4.5–4.6), Krishna tells Arjuna that many births of his have passed, and says that though unborn he comes into being through his own power. It is followed by 4.8, which names the purposes of this coming.',
      apply:
        'Readers and traditions differ on how to understand this: as the doctrine of avatāra, as a statement about how the Divine acts in the world, or in other ways. This page does not decide between these.',
      related: [
        { ref: '4.8', topic: 'Protection of the good, destruction of wrongdoers, establishing dharma', href: href(4, 8) },
        { ref: '4.5', topic: 'Krishna says many births have passed, for him and for Arjuna' },
        { ref: '4.9', topic: 'One who knows his birth and action as divine is not reborn' },
      ],
      commentaryNote: COMMENTARY_NOTE,
    },
    provenance: provenance('One copy marks the joined vowel in tadātmānaṃ with an avagraha (tadā ’tmānaṃ); the form used here omits it. The words are the same.'),
  },

  /* ----------------------------------------------------------------- 4.8 */
  {
    chapter: 4, verse: 8, reference: 'Bhagavad Gita 4.8',
    sanskrit: ['परित्राणाय साधूनां विनाशाय च दुष्कृताम् ।', 'धर्मसंस्थापनार्थाय सम्भवामि युगे युगे ॥'],
    transliteration: ['paritrāṇāya sādhūnāṃ vināśāya ca duṣkṛtām |', 'dharma-saṃsthāpanārthāya sambhavāmi yuge yuge ||'],
    transliterationScheme: 'IAST',
    sourceLines: sourceLines(4, 8),
    words: [
      { word: 'paritrāṇāya', gloss: 'for the protection, for the rescue' },
      { word: 'sādhūnām', gloss: 'of the good, of the virtuous (sādhu)' },
      { word: 'vināśāya', gloss: 'for the destruction' },
      { word: 'ca', gloss: 'and' },
      { word: 'duṣkṛtām', gloss: 'of the evildoers, of those who do wrong' },
      { word: 'dharma-saṃsthāpana-arthāya', gloss: 'for the purpose of establishing dharma firmly (compound)' },
      { word: 'sambhavāmi', gloss: 'I come into being, I appear' },
      { word: 'yuge yuge', gloss: 'age after age, in every yuga (repeated)' },
    ],
    wordsNote: WORDS_NOTE,
    hindi: none, english: none,
    brief: {
      say: 'For the protection of the good, for the destruction of wrongdoers, and for establishing dharma firmly, I come into being, age after age.',
      mean: 'Krishna names three purposes for his coming forth: protecting the good, putting an end to wrongdoing, and re-establishing dharma. He says this happens in every age.',
      why: 'It completes the thought of the previous verse. Together, 4.7 and 4.8 are often cited as the source of the idea of avatāra in several traditions.',
      learn: 'The verse states what the coming forth is for. Traditions differ on how it should be understood, and on what “destruction of wrongdoers” means.',
    },
    detailed: {
      terms: [
        { term: 'Sādhu', meaning: 'A good, upright or holy person. The verse names their protection as the first purpose.' },
        { term: 'Duṣkṛt', meaning: 'One who does wrong (literally “bad-doer”).' },
        { term: 'Dharma-saṃsthāpana', meaning: 'The firm establishing of dharma: the third purpose named.' },
        { term: 'Yuge yuge', meaning: '“Age after age”: yuga is an age or era; the repetition makes it “in every age”.' },
      ],
      structure: [
        'First half (line 1): for the protection of the good and the destruction of those who do wrong …',
        'Second half (line 2): … and for establishing dharma firmly, I come into being, age after age.',
      ],
      context:
        'Verse 4.8 follows 4.7 in chapter 4 and finishes its thought. Verse 4.9 goes on to say that the one who truly knows the divine birth and action is not reborn.',
      apply:
        'The verse is read in many ways within and across traditions; this page does not take a position on the doctrine of avatāra or on how to read “destruction of wrongdoers”.',
      related: [
        { ref: '4.7', topic: 'Whenever dharma declines, I send myself forth', href: href(4, 7) },
        { ref: '4.9', topic: 'One who knows his birth and action as divine is not reborn' },
      ],
      commentaryNote: COMMENTARY_NOTE,
    },
    provenance: provenance('Spelling: one copy writes saṃbhavāmi (with an anusvāra), the other sambhavāmi (conjunct); the conjunct is used here.'),
  },

  /* ----------------------------------------------------------------- 6.5 */
  {
    chapter: 6, verse: 5, reference: 'Bhagavad Gita 6.5',
    sanskrit: ['उद्धरेदात्मनात्मानं नात्मानमवसादयेत् ।', 'आत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः ॥'],
    transliteration: ['uddhared ātmanātmānaṃ nātmānam avasādayet |', 'ātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ ||'],
    transliterationScheme: 'IAST',
    sourceLines: sourceLines(6, 5),
    words: [
      { word: 'uddharet', gloss: 'one should lift up, raise' },
      { word: 'ātmanā', gloss: 'by the self (instrumental)' },
      { word: 'ātmānam', gloss: 'the self (object)' },
      { word: 'na', gloss: 'not' },
      { word: 'avasādayet', gloss: 'one should let sink, should degrade' },
      { word: 'ātmā', gloss: 'the self' },
      { word: 'eva', gloss: 'only, indeed' },
      { word: 'hi', gloss: 'for, indeed' },
      { word: 'ātmanaḥ', gloss: 'of the self' },
      { word: 'bandhuḥ', gloss: 'friend, relative' },
      { word: 'ripuḥ', gloss: 'enemy' },
    ],
    wordsNote:
      WORDS_NOTE + ' The word ātman appears six times and has several senses in the Gita (the person, the mind, the Self). How each occurrence is read here is a matter of commentary; DharmaQuest does not decide.',
    hindi: none, english: none,
    brief: {
      say: 'One should lift oneself up by oneself, and should not let oneself sink. For the self alone is the friend of the self, and the self alone is the enemy of the self.',
      mean: 'Krishna says that a person’s own self can be their greatest help or their greatest obstacle, and that one should raise oneself up and not degrade oneself.',
      why: 'It is a key verse on self-discipline in the chapter on meditation (Dhyana Yoga). It turns the question of who is responsible for one’s progress back onto the person.',
      learn: 'The verse asks us to notice that help and hindrance are often internal, and to take responsibility for lifting ourselves up. How the two “selves” in it are read depends on the commentary.',
    },
    detailed: {
      terms: [
        { term: 'Ātman', meaning: 'Self. Here one word is used for both the one who lifts and the one who is lifted; readings take it as the person, the mind or the higher Self, and differ.' },
        { term: 'Uddharet', meaning: '“One should lift up”: the verse’s first instruction.' },
        { term: 'Bandhu · Ripu', meaning: 'Friend and enemy: the two roles the verse says the self can play for itself.' },
        { term: 'Avasādayet', meaning: '“Should let sink” or “should degrade”: what the verse says not to do to oneself.' },
      ],
      structure: [
        'First half (line 1): one should raise oneself by oneself and not let oneself sink …',
        'Second half (line 2): … for the self alone is the friend of the self, and the self alone is its enemy.',
      ],
      context:
        'Verse 6.5 is in chapter 6 (Dhyana Yoga). The next verse, 6.6, continues the thought, saying the self is a friend to the one who has mastered it and acts like an enemy to the one who has not.',
      apply:
        'Read as practical guidance, the verse points to self-effort and self-honesty. Readings of what “self” means here differ across traditions, so this page does not give a single reading.',
      related: [
        { ref: '6.6', topic: 'The self is a friend to one who has mastered it, an enemy to one who has not' },
        { ref: '2.47', topic: 'The claim to action, not to its fruits', href: href(2, 47) },
      ],
      commentaryNote: COMMENTARY_NOTE,
    },
    provenance: provenance('One copy marks the joined vowels in uddharedātmanātmānaṃ with avagrahas (ātmanā ’tmānaṃ); the form used here omits them. The words are the same.'),
  },

  /* ---------------------------------------------------------------- 9.22 */
  {
    chapter: 9, verse: 22, reference: 'Bhagavad Gita 9.22',
    sanskrit: ['अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते ।', 'तेषां नित्याभियुक्तानां योगक्षेमं वहाम्यहम् ॥'],
    transliteration: ['ananyāś cintayanto māṃ ye janāḥ paryupāsate |', 'teṣāṃ nityābhiyuktānāṃ yoga-kṣemaṃ vahāmy aham ||'],
    transliterationScheme: 'IAST',
    sourceLines: sourceLines(9, 22),
    words: [
      { word: 'ananyāḥ', gloss: 'not thinking of any other, single-minded (an-anya)' },
      { word: 'cintayantaḥ', gloss: 'contemplating, thinking of' },
      { word: 'mām', gloss: 'me' },
      { word: 'ye janāḥ', gloss: 'those people who' },
      { word: 'paryupāsate', gloss: 'worship, attend upon' },
      { word: 'teṣām', gloss: 'of those' },
      { word: 'nitya-abhiyuktānām', gloss: 'of those constantly steadfast, always devoted (compound)' },
      { word: 'yoga-kṣemam', gloss: 'gaining and keeping (compound; see the note in the explanation)' },
      { word: 'vahāmi', gloss: 'I carry, I bring' },
      { word: 'aham', gloss: 'I' },
    ],
    wordsNote: WORDS_NOTE + ' The compound yoga-kṣema is commonly explained as acquiring what one lacks and preserving what one has; other readings exist.',
    hindi: none, english: none,
    brief: {
      say: 'Those people who worship me, thinking of no other and contemplating me, to those who are constantly steadfast I carry what they need to gain and to keep.',
      mean: 'Krishna says that to those who are single-minded in devotion to him and constantly steadfast, he looks after both what they lack (yoga) and what they hold (kṣema).',
      why: 'It is a well-known verse of devotion in the chapter often called the “royal knowledge, royal secret” (Raja Vidya Raja Guhya Yoga), expressing the assurance Krishna gives devotees.',
      learn: 'The verse presents steady devotion and the assurance given in return. Traditions emphasise the verse in different ways, and its terms are read in more than one way.',
    },
    detailed: {
      terms: [
        { term: 'Ananya', meaning: 'Literally “without another”: single-minded, thinking of no other. It qualifies the devotees the verse describes.' },
        { term: 'Nitya-abhiyukta', meaning: 'Constantly yoked, steadfast, always engaged: the second description of those the verse speaks about.' },
        { term: 'Yoga-kṣema', meaning: 'Commonly explained as “gaining what one lacks and preserving what one has”. The verse says Krishna carries it for such devotees.' },
        { term: 'Paryupāsate', meaning: 'Worship, attend upon fully: the verb for the devotees’ practice.' },
      ],
      structure: [
        'First half (line 1): those people who worship me, single-minded and contemplating me …',
        'Second half (line 2): … to those constantly steadfast, I carry gaining and keeping (yoga-kṣema).',
      ],
      context:
        'Verse 9.22 is in chapter 9. The verses just after it (from 9.23) go on to speak of devotees of other deities, and 9.26 speaks of the simple offering of a leaf, flower, fruit or water with devotion.',
      apply:
        'The verse can be read as an expression of trust and steady devotion. Traditions read its promise differently, and this page does not decide between those readings.',
      related: [
        { ref: '9.26', topic: 'A leaf, a flower, fruit or water offered with devotion' },
        { ref: '4.8', topic: 'Protection of the good, and establishing dharma', href: href(4, 8) },
      ],
      commentaryNote: COMMENTARY_NOTE,
    },
    provenance: provenance(),
  },
];
