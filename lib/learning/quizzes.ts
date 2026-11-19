import type { Quiz } from './types';

/**
 * Every question must be answerable from content already on the site, and every
 * answer carries an explanation. Do not add questions that depend on unsourced claims.
 */
export const quizzes: Quiz[] = [
  {
    id: 'gita-overview', title: 'Bhagavad Gita overview',
    questions: [
      { type: 'mcq', prompt: 'Between whom is the Bhagavad Gita a dialogue?', options: ['Arjuna and Krishna', 'Rama and Hanuman', 'Janaka and Ashtavakra', 'Yudhishthira and Bhishma'], answer: 0, explanation: 'The Gita is a dialogue between Arjuna and Krishna, narrated to the blind king Dhritarashtra by Sanjaya.' },
      { type: 'tf', prompt: 'The Bhagavad Gita is part of the Mahabharata.', answer: true, explanation: 'It sits in the Bhishma Parva of the Mahabharata.' },
      { type: 'mcq', prompt: 'How many chapters does the Bhagavad Gita have?', options: ['12', '18', '20', '24'], answer: 1, explanation: 'The Bhagavad Gita has eighteen chapters.' },
      { type: 'tf', prompt: 'Every Gita text has eighteen chapters.', answer: false, explanation: 'Different Gitas have different origins and structures. The Gita Library warns against assuming they share the Bhagavad Gita’s structure.' },
      { type: 'match', prompt: 'Match each chapter number to its name.', pairs: [{ left: 'Chapter 2', right: 'Sankhya Yoga' }, { left: 'Chapter 3', right: 'Karma Yoga' }, { left: 'Chapter 6', right: 'Dhyana Yoga' }, { left: 'Chapter 12', right: 'Bhakti Yoga' }], explanation: 'Chapter 2 is Sankhya Yoga, 3 is Karma Yoga, 6 is Dhyana Yoga and 12 is Bhakti Yoga.' },
    ],
  },
  {
    id: 'gita-ch1', title: 'Chapter 1 quiz',
    questions: [
      { type: 'tf', prompt: 'Chapter 1 opens with a question from Dhritarashtra to Sanjaya.', answer: true, explanation: 'Verse 1.1 is Dhritarashtra’s question to Sanjaya about what happened at Kurukshetra.' },
      { type: 'mcq', prompt: 'Whom does Arjuna ask to place the chariot between the two armies?', options: ['Sanjaya', 'Krishna', 'Bhishma', 'Drona'], answer: 1, explanation: 'Krishna is Arjuna’s charioteer, and Arjuna asks him to position the chariot.' },
      { type: 'mcq', prompt: 'What does Arjuna do at the end of the chapter?', options: ['He begins the battle at once', 'He sets down his bow and sits in the chariot', 'He leaves the battlefield on foot', 'He asks Sanjaya to speak'], answer: 1, explanation: 'In verse 1.47 Arjuna sits down in the chariot, setting aside his bow and arrows.' },
      { type: 'teaching', prompt: 'What role does chapter 1 play in the Gita as a whole?', options: ['It explains the three gunas', 'It sets up the crisis of duty and compassion that the teaching answers', 'It describes the universal form', 'It lists the qualities of the devotee'], answer: 1, explanation: 'The teaching begins from Arjuna’s crisis. His question is what makes the rest of the Gita necessary.' },
    ],
  },
  {
    id: 'gita-ch2', title: 'Chapter 2 quiz',
    questions: [
      { type: 'mcq', prompt: 'Which verse says one’s claim is to action alone and not to its fruits?', options: ['2.20', '2.47', '3.35', '18.66'], answer: 1, explanation: 'Verse 2.47. Verse 2.20 is about the Self, 3.35 about one’s own duty and 18.66 about taking refuge.' },
      { type: 'tf', prompt: 'In chapter 2 Krishna teaches that the Self is destroyed when the body dies.', answer: false, explanation: 'Verse 2.20 teaches that the Self is neither born nor dies. The Self is distinct from the body.' },
      { type: 'match', prompt: 'Match each concept to its meaning.', pairs: [{ left: 'Atman', right: 'The Self' }, { left: 'Svadharma', right: 'One’s own duty' }, { left: 'Sthitaprajna', right: 'A person of steady wisdom' }, { left: 'Samatva', right: 'Equanimity' }], explanation: 'These are the key concepts of chapter 2: the Self, one’s own duty, the person of steady wisdom, and equanimity.' },
      { type: 'teaching', prompt: 'Which statement best matches the teaching of verse 2.47?', options: ['Act with commitment, but do not make the fruit your motive and do not cling to inaction', 'Never act, because results are an illusion', 'Act only when the result is guaranteed', 'Give up all action to reach freedom'], answer: 0, explanation: 'The verse names two errors: making the fruit your motive, and attachment to inaction. It is not a call to stop acting.' },
    ],
  },
  {
    id: 'gita-ch3', title: 'Chapter 3 quiz',
    questions: [
      { type: 'mcq', prompt: 'What does “karma” mean in “Karma Yoga”?', options: ['Knowledge', 'Action', 'Devotion', 'Renunciation'], answer: 1, explanation: 'Karma means action. Chapter 3 is called the yoga of action.' },
      { type: 'tf', prompt: 'In chapter 3 Krishna says no one can remain wholly without action.', answer: true, explanation: 'Krishna explains that no one can remain wholly without action, which leads into the teaching on acting without attachment.' },
      { type: 'mcq', prompt: 'What does “yajna” mean in this chapter’s teaching?', options: ['Action done as an offering', 'A kind of weapon', 'A school of logic', 'The fruit of an action'], answer: 0, explanation: 'Yajna is action done as an offering, not for personal gain.' },
      { type: 'mcq', prompt: 'Which two are named as obstacles in chapter 3?', options: ['Wealth and fame', 'Desire and anger', 'Youth and age', 'Food and sleep'], answer: 1, explanation: 'Desire (kama) and anger are described as obstacles.' },
    ],
  },
  {
    id: 'verse-2-47', title: 'Gita 2.47 quiz',
    questions: [
      { type: 'mcq', prompt: 'In verse 2.47, what does “adhikara” mean?', options: ['Fruit', 'Right or entitlement', 'Inaction', 'Duty to others'], answer: 1, explanation: 'Adhikara is right, entitlement or authority. The verse says your adhikara is over action, not over results.' },
      { type: 'mcq', prompt: 'What does “phala” mean?', options: ['Action', 'Attachment', 'Fruit or result', 'Knowledge'], answer: 2, explanation: 'Phala is the fruit, result or outcome of an action.' },
      { type: 'tf', prompt: 'The verse tells us to avoid action altogether.', answer: false, explanation: 'Its last line says “let there be no attachment to inaction”, which guards against that reading.' },
      { type: 'teaching', prompt: 'What does the last line of the verse guard against?', options: ['Working too hard', 'Reading the verse as permission to disengage from action', 'Studying scripture', 'Caring about other people'], answer: 1, explanation: 'The verse warns against attachment to inaction, so detachment from results is not an excuse to stop acting.' },
    ],
  },
  {
    id: 'darshana-nyaya', title: 'Nyaya quiz',
    questions: [
      { type: 'mcq', prompt: 'What is Nyaya’s core question?', options: ['What makes up the world?', 'How do we know what is true?', 'How can the mind become steady?', 'What is the nature of Brahman?'], answer: 1, explanation: 'Nyaya is the school of logic and valid knowledge: “How do we know what is true?”' },
      { type: 'mcq', prompt: 'How many pramanas (means of knowledge) does Nyaya accept?', options: ['Two', 'Three', 'Four', 'Six'], answer: 2, explanation: 'Four: perception, inference, comparison and reliable testimony.' },
      { type: 'match', prompt: 'Match each pramana to its meaning.', pairs: [{ left: 'Pratyaksha', right: 'Perception' }, { left: 'Anumana', right: 'Inference' }, { left: 'Upamana', right: 'Comparison' }, { left: 'Shabda', right: 'Reliable testimony' }], explanation: 'These are the four pramanas of Nyaya.' },
    ],
  },
  {
    id: 'darshana-vaisheshika', title: 'Vaisheshika quiz',
    questions: [
      { type: 'mcq', prompt: 'What is Vaisheshika’s core question?', options: ['What makes up the world?', 'How do we know what is true?', 'How do we understand duty?', 'What is liberation?'], answer: 0, explanation: 'Vaisheshika analyses reality into categories: “What makes up the world?”' },
      { type: 'mcq', prompt: 'Which category was added by later authors to the original six?', options: ['Substance', 'Quality', 'Absence (abhava)', 'Action'], answer: 2, explanation: 'The original six are substance, quality, action, universal, particularity and inherence. Later authors add absence.' },
      { type: 'tf', prompt: 'In Vaisheshika, the Self is counted among the substances.', answer: true, explanation: 'The Self is one of nine substances, alongside earth, water, fire, air, ether, time, space and mind.' },
    ],
  },
  {
    id: 'darshana-samkhya', title: 'Samkhya quiz',
    questions: [
      { type: 'mcq', prompt: 'What are Samkhya’s two ultimate principles?', options: ['Brahman and maya', 'Purusha and prakriti', 'Dharma and karma', 'Atman and ishvara'], answer: 1, explanation: 'Purusha (conscious, inactive) and prakriti (insentient primal nature).' },
      { type: 'tf', prompt: 'Classical Samkhya holds that there is only one purusha.', answer: false, explanation: 'Classical Samkhya holds that there are many purushas, each distinct.' },
      { type: 'mcq', prompt: 'Which are the three gunas?', options: ['Sattva, rajas, tamas', 'Dharma, artha, kama', 'Jnana, karma, bhakti', 'Sat, chit, ananda'], answer: 0, explanation: 'Sattva, rajas and tamas are the three strands of nature.' },
      { type: 'match', prompt: 'Match each term to its meaning.', pairs: [{ left: 'Purusha', right: 'Conscious witness' }, { left: 'Prakriti', right: 'Primal nature' }, { left: 'Gunas', right: 'Three strands of nature' }, { left: 'Kaivalya', right: 'Isolation of purusha from prakriti' }], explanation: 'These are the central terms of Samkhya.' },
    ],
  },
  {
    id: 'darshana-yoga', title: 'Yoga Darshana quiz',
    questions: [
      { type: 'mcq', prompt: 'How many limbs (ashtanga) does Yoga list?', options: ['Four', 'Six', 'Eight', 'Ten'], answer: 2, explanation: 'Yama, niyama, asana, pranayama, pratyahara, dharana, dhyana and samadhi.' },
      { type: 'tf', prompt: 'Karma Yoga in the Bhagavad Gita is the same thing as the Yoga Darshana.', answer: false, explanation: 'The word “yoga” is used for many paths. The Yoga Darshana is the school of the Yoga Sutras.' },
      { type: 'mcq', prompt: 'What does Yoga add to Samkhya’s framework?', options: ['Ishvara and a practical discipline', 'A new set of gunas', 'The rejection of purusha', 'The authority of reason alone'], answer: 0, explanation: 'Yoga shares the purusha–prakriti framework and adds Ishvara and a practical discipline.' },
      { type: 'mcq', prompt: 'What is “chitta-vritti-nirodha”?', options: ['Study of the Vedas', 'Stilling the fluctuations of the mind', 'Ritual sacrifice', 'Inference from signs'], answer: 1, explanation: 'It is the stilling of the mind’s fluctuations, as defined in the Yoga Sutras.' },
    ],
  },
  {
    id: 'darshana-purva-mimamsa', title: 'Purva Mimamsa quiz',
    questions: [
      { type: 'mcq', prompt: 'What is the central concern of Purva Mimamsa?', options: ['What the Vedic injunctions require', 'The structure of matter', 'Discriminating purusha from prakriti', 'Debate and logic'], answer: 0, explanation: 'It is the school of Vedic interpretation, centred on dharma and ritual action.' },
      { type: 'tf', prompt: 'Purva Mimamsa regards the Veda as authorless (apaurusheya).', answer: true, explanation: 'The Veda is regarded as authorless and self-authenticating.' },
      { type: 'mcq', prompt: 'Why is it called “purva” Mimamsa?', options: ['It is the oldest school of all', 'It means “earlier” inquiry, in contrast to the “later” inquiry of Vedanta', 'It deals only with the past', 'It was founded in the east'], answer: 1, explanation: 'Purva means earlier. Vedanta is also called Uttara (later) Mimamsa.' },
    ],
  },
  {
    id: 'darshana-vedanta', title: 'Vedanta quiz',
    questions: [
      { type: 'mcq', prompt: 'Which three texts form the Prasthanatraya of Vedanta?', options: ['Upanishads, Brahma Sutras and Bhagavad Gita', 'Vedas, Puranas and Ramayana', 'Yoga Sutras, Nyaya Sutras and Samkhya Karika', 'Rigveda, Samaveda and Yajurveda'], answer: 0, explanation: 'The Upanishads, the Brahma Sutras and the Bhagavad Gita are Vedanta’s three foundational sources.' },
      { type: 'tf', prompt: 'The Vedanta sub-schools are separate Darshanas.', answer: false, explanation: 'They are traditions within Vedanta. The six Darshanas are Nyaya, Vaisheshika, Samkhya, Yoga, Purva Mimamsa and Vedanta.' },
      { type: 'match', prompt: 'Match each term to its meaning.', pairs: [{ left: 'Brahman', right: 'Ultimate reality' }, { left: 'Atman', right: 'The Self' }, { left: 'Moksha', right: 'Liberation' }], explanation: 'These are Vedanta’s central terms.' },
    ],
  },
  {
    id: 'vedanta-subschools', title: 'Vedanta sub-schools quiz',
    questions: [
      { type: 'match', prompt: 'Match each sub-school to its founding teacher.', pairs: [{ left: 'Advaita', right: 'Adi Shankara' }, { left: 'Vishishtadvaita', right: 'Ramanuja' }, { left: 'Dvaita', right: 'Madhvacharya' }, { left: 'Shuddhadvaita', right: 'Vallabhacharya' }], explanation: 'Each tradition is associated with its founding teacher and his commentaries.' },
      { type: 'mcq', prompt: 'Which sub-school holds that the individual Self is ultimately identical with Brahman?', options: ['Dvaita', 'Vishishtadvaita', 'Advaita', 'Dvaitadvaita'], answer: 2, explanation: 'Advaita is non-dual: the individual Self is ultimately identical with Brahman.' },
      { type: 'tf', prompt: 'Vishishtadvaita holds that souls and matter are unreal.', answer: false, explanation: 'In Vishishtadvaita, souls and matter are real and form the “body” of Brahman.' },
      { type: 'mcq', prompt: 'How many fundamental differences does the Dvaita tradition list?', options: ['Two', 'Three', 'Five', 'Seven'], answer: 2, explanation: 'Five: God–soul, God–matter, soul–soul, soul–matter and matter–matter.' },
    ],
  },
  {
    id: 'vedas', title: 'The Vedas quiz',
    questions: [
      { type: 'mcq', prompt: 'How many Vedas are traditionally recognised?', options: ['Two', 'Three', 'Four', 'Six'], answer: 2, explanation: 'Rigveda, Samaveda, Yajurveda and Atharvaveda.' },
      { type: 'tf', prompt: 'The Vedas are classed as Shruti.', answer: true, explanation: 'Shruti means “that which is heard”.' },
      { type: 'mcq', prompt: 'Which Veda is transmitted in Shukla and Krishna recensions?', options: ['Rigveda', 'Samaveda', 'Yajurveda', 'Atharvaveda'], answer: 2, explanation: 'The Yajurveda has Shukla and Krishna recensions.' },
      { type: 'match', prompt: 'Match each Vedic layer to its description.', pairs: [{ left: 'Samhita', right: 'Collection of hymns and formulae' }, { left: 'Brahmana', right: 'Ritual explanation' }, { left: 'Aranyaka', right: 'Forest texts' }, { left: 'Upanishad', right: 'Philosophical inquiry' }], explanation: 'These are the four traditional layers of each Veda.' },
    ],
  },
  {
    id: 'upanishads', title: 'The Upanishads quiz',
    questions: [
      { type: 'mcq', prompt: 'Which Upanishad is associated with the Mahavakya “tat tvam asi”?', options: ['Mandukya', 'Chandogya', 'Aitareya', 'Katha'], answer: 1, explanation: 'The Chandogya Upanishad, of the Samaveda.' },
      { type: 'mcq', prompt: 'Which Mahavakya is associated with the Brihadaranyaka Upanishad?', options: ['aham brahmāsmi', 'prajñānam brahma', 'ayam ātmā brahma', 'tat tvam asi'], answer: 0, explanation: 'Brihadaranyaka is associated with “aham brahmāsmi”.' },
      { type: 'tf', prompt: 'The list of thirteen principal Upanishads is a complete list of all Upanishads.', answer: false, explanation: 'It is an initial learning collection, not an exhaustive list.' },
      { type: 'match', prompt: 'Match each Upanishad to its traditional Vedic affiliation.', pairs: [{ left: 'Aitareya', right: 'Rigveda' }, { left: 'Chandogya', right: 'Samaveda' }, { left: 'Isha', right: 'Shukla Yajurveda' }, { left: 'Mundaka', right: 'Atharvaveda' }], explanation: 'These are the traditional affiliations shown in the Upanishads collection.' },
    ],
  },
  {
    id: 'ramayana', title: 'Ramayana quiz',
    questions: [
      { type: 'mcq', prompt: 'How many Kandas (books) does the Ramayana have?', options: ['Five', 'Seven', 'Eighteen', 'Twelve'], answer: 1, explanation: 'Seven, from Bala Kanda to Uttara Kanda.' },
      { type: 'mcq', prompt: 'To whom is the Sanskrit Ramayana traditionally attributed?', options: ['Vyasa', 'Valmiki', 'Tulsidas', 'Kamban'], answer: 1, explanation: 'Valmiki. Vyasa is associated with the Mahabharata.' },
      { type: 'tf', prompt: 'Some scholars and traditions treat the Uttara Kanda as a later addition.', answer: true, explanation: 'This is noted in the Ramayana collection.' },
      { type: 'match', prompt: 'Match each work to its description.', pairs: [{ left: 'Valmiki’s Ramayana', right: 'The Sanskrit epic' }, { left: 'Kamban’s Iramavataram', right: 'A Tamil retelling' }, { left: 'Tulsidas’s Ramcharitmanas', right: 'An Awadhi retelling' }], explanation: 'The story has been retold in many languages and traditions.' },
    ],
  },
  {
    id: 'mahabharata', title: 'Mahabharata quiz',
    questions: [
      { type: 'mcq', prompt: 'How many Parvas (books) does the Mahabharata have?', options: ['Seven', 'Twelve', 'Eighteen', 'Twenty-four'], answer: 2, explanation: 'Eighteen Parvas, from Adi Parva to Svargarohana Parva.' },
      { type: 'tf', prompt: 'The Bhagavad Gita is found in the Bhishma Parva.', answer: true, explanation: 'The Gita forms part of the Bhishma Parva.' },
      { type: 'mcq', prompt: 'To whom is the Mahabharata traditionally attributed?', options: ['Valmiki', 'Vyasa', 'Patanjali', 'Kanada'], answer: 1, explanation: 'Vyasa.' },
    ],
  },
];

export const getQuiz = (id: string) => quizzes.find((q) => q.id === id);
