import type { Skill } from '@/engine/types'

const S = (id: string, year: number, strand: string, name: string, description: string, prereqs: string[]): Skill => ({
  id: `german.grammar.${id}`,
  subject: 'german',
  year,
  strand,
  name,
  description,
  // Existing skills are written in full ('german.grammar.articles'); new ones by their short name.
  prereqs: prereqs.map((p) => (p.startsWith('german.') ? p : `german.grammar.${p}`)),
  origin: 'syllabus',
})

const NOUNS = 'Grammar: Nouns and cases'
const PREPS = 'Grammar: Prepositions'
const PRON = 'Grammar: Pronouns'
const ADJ = 'Grammar: Adjectives and comparison'
const VERBS = 'Grammar: Verbs'
const TENSES = 'Grammar: Tenses'
const ORDER = 'Grammar: Word order'

const ARTICLES = 'german.grammar.articles'
const SEIN_HABEN = 'german.grammar.sein-haben'
const REGULAR = 'german.grammar.regular-verbs'
const FAMILY = 'german.vocab.family'

export const grammarSkills: Skill[] = [
  // ---------------------------------------------------------------- nouns and cases
  S('plurals', 7, NOUNS, 'Plural nouns', 'Form and recognise the plurals of common nouns (Hund → Hunde, Buch → Bücher), always with die.', [ARTICLES]),
  S('indefinite-article', 7, NOUNS, 'ein and eine', 'Say "a" with ein (masculine and neuter) and eine (feminine).', [ARTICLES]),
  S('accusative', 7, NOUNS, 'The accusative case', 'Change der to den and ein to einen for a masculine direct object; die, das, eine and ein stay the same.', ['indefinite-article', SEIN_HABEN]),
  S('negation', 7, NOUNS, 'Negatives: nicht and kein', 'Say "not" with nicht and "not a / no" with kein, with the right ending (keinen Bruder).', ['accusative']),
  S('possessives', 7, NOUNS, 'Possessives: mein, dein, sein, ihr...', 'Say my, your, his, her, our and their, with the ending that matches the noun (meine Schwester).', ['indefinite-article', FAMILY]),
  S('possessive-accusative', 8, NOUNS, 'Possessives in the accusative', 'Add -en to a possessive before a masculine object: Ich besuche meinen Onkel.', ['possessives', 'accusative']),

  // ---------------------------------------------------------------- prepositions
  S('dative', 8, PREPS, 'The dative after mit, zu, von, bei, aus, nach, seit', 'Use dem, der, dem, den (and einem, meiner...) after the dative prepositions.', ['accusative']),
  S('contractions', 8, PREPS, 'zum, zur, im, ins, am', 'Shorten a preposition and article into one word: zu dem → zum, in das → ins.', ['dative']),
  S('accusative-prepositions', 8, PREPS, 'Prepositions with the accusative', 'Use the accusative after für, ohne, durch, gegen and um.', ['accusative']),
  S('two-way-prepositions', 9, PREPS, 'Two-way prepositions', 'in, an, auf, unter, neben, hinter...: dative for position (wo?), accusative for movement (wohin?).', ['dative', 'accusative-prepositions', 'contractions']),

  // ---------------------------------------------------------------- pronouns
  S('personal-pronouns', 7, PRON, 'Personal pronouns', 'Use ich, du, er, sie, es, wir, ihr, sie and Sie, and replace a noun with er, sie or es by its gender.', [ARTICLES, SEIN_HABEN]),
  S('accusative-pronouns', 8, PRON, 'Pronouns in the accusative', 'Use mich, dich, ihn, sie, es, uns, euch for a direct object: Ich sehe ihn.', ['personal-pronouns', 'accusative']),

  // ---------------------------------------------------------------- adjectives and comparison
  S('gern', 7, ADJ, 'gern, lieber, am liebsten', 'Say what you like, prefer and like most of all by adding gern, lieber or am liebsten after the verb.', [REGULAR]),
  S('comparatives', 8, ADJ, 'Comparatives', 'Compare two things with -er and als: Lukas ist größer als Mia. Includes besser and mehr.', [SEIN_HABEN, 'gern']),
  S('superlatives', 9, ADJ, 'Superlatives', 'Say which is the most: am größten, am besten, am liebsten.', ['comparatives']),
  S('adjective-endings-definite', 9, ADJ, 'Adjective endings after der, die, das', 'Add -e or -en to an adjective before a noun after der/die/das, in the nominative and accusative.', ['accusative']),
  S('adjective-endings-indefinite', 9, ADJ, 'Adjective endings after ein, kein, mein', 'Add -er, -e, -es or -en to an adjective after ein-words, in the nominative and accusative.', ['adjective-endings-definite', 'possessive-accusative']),

  // ---------------------------------------------------------------- verbs
  S('irregular-verbs', 8, VERBS, 'Stem-changing verbs', 'Present tense of verbs that change their vowel with du and er/sie/es: fahren → du fährst, lesen → er liest.', [REGULAR]),
  S('separable-verbs', 8, VERBS, 'Separable verbs', 'Split verbs like aufstehen and fernsehen in the present: Ich stehe um sieben Uhr auf.', ['irregular-verbs', 'verb-second']),
  S('modal-verbs', 8, VERBS, 'Modal verbs', 'Conjugate können, müssen, wollen, dürfen, sollen, mögen and möchten, and know what each one means.', [REGULAR]),
  S('modal-word-order', 8, VERBS, 'Modal verbs with an infinitive', 'Put the modal second and the infinitive at the end: Ich muss heute Hausaufgaben machen.', ['modal-verbs', 'verb-second']),
  S('imperative', 9, VERBS, 'Giving instructions (imperative)', 'Give commands to one friend, several friends and an adult: Komm! Kommt! Kommen Sie!', ['irregular-verbs', 'separable-verbs']),

  // ---------------------------------------------------------------- tenses
  S('perfect-haben', 8, TENSES, 'The perfect tense with haben', 'Say what you did with haben + a past participle at the end: Ich habe Fußball gespielt.', [REGULAR, SEIN_HABEN, 'verb-second']),
  S('perfect-irregular', 8, TENSES, 'Irregular past participles', 'Learn the common irregular participles: gegessen, getrunken, gesehen, geschrieben...', ['perfect-haben', 'irregular-verbs']),
  S('perfect-sein', 8, TENSES, 'The perfect tense with sein', 'Use sein for movement and change: Ich bin nach Spanien gefahren.', ['perfect-haben']),
  S('perfect-separable', 9, TENSES, 'Perfect tense: separable, inseparable and -ieren verbs', 'aufgestanden, ferngesehen; besucht, vergessen; fotografiert - where the ge- goes, or why there is none.', ['perfect-irregular', 'perfect-sein', 'separable-verbs']),
  S('imperfect', 8, TENSES, 'war, hatte and es gab', 'Describe the past with war (was), hatte (had) and es gab (there was / there were).', [SEIN_HABEN, 'accusative']),
  S('future', 8, TENSES, 'The future with werden', 'Say what will happen with werden + an infinitive at the end: Ich werde Tennis spielen.', ['modal-word-order']),
  S('time-frames', 9, TENSES, 'Using three time frames', 'Recognise and switch between past, present and future, and match tenses to time phrases.', ['perfect-sein', 'future', 'imperfect']),

  // ---------------------------------------------------------------- word order
  S('verb-second', 7, ORDER, 'Verb second and inversion', 'The verb is always the second idea: after a time phrase the subject moves behind it (Am Samstag spiele ich...).', [REGULAR]),
  S('questions', 7, ORDER, 'Asking questions', 'Make yes/no questions by putting the verb first, and use question words: wer, was, wo, wohin, woher, wann, wie, warum.', ['verb-second']),
  S('conjunctions', 8, ORDER, 'und, aber, oder, denn', 'Join sentences with conjunctions that do not change the word order.', ['verb-second']),
  S('weil', 8, ORDER, 'weil: verb to the end', 'Give reasons with weil, sending the verb to the end of the clause.', ['conjunctions']),
  S('time-manner-place', 8, ORDER, 'Time - manner - place', 'Put when, how and where in that order: Ich fahre am Montag mit dem Bus zur Schule.', ['verb-second']),
  S('subordinate-clauses', 9, ORDER, 'dass, wenn and obwohl', 'Use more subordinating conjunctions, and invert the main clause when the sentence starts with one (Wenn es regnet, bleibe ich zu Hause).', ['weil']),
  S('um-zu', 9, ORDER, 'um ... zu (in order to)', 'Say why you do something with um ... zu + infinitive at the end: um ein Fahrrad zu kaufen.', ['modal-word-order', 'weil']),
]
