/**
 * German starter content. This is a SAMPLE scheme of work (typical KS3 first-year topics), included to prove
 * the platform handles a very different subject from maths: content here is data-driven vocabulary and
 * grammar patterns, not calculations. Replace the word lists with the ones from the school's own scheme.
 */

export type Gender = 'der' | 'die' | 'das'

export interface Word {
  de: string
  en: string
  gender?: Gender
}

export type TopicKind = 'phrase' | 'number' | 'noun'

export interface Topic {
  kind: TopicKind
  words: Word[]
}

export const TOPICS: Record<string, Topic> = {
  greetings: {
    kind: 'phrase',
    words: [
      { de: 'Hallo', en: 'hello' },
      { de: 'Guten Morgen', en: 'good morning' },
      { de: 'Guten Tag', en: 'good day' },
      { de: 'Guten Abend', en: 'good evening' },
      { de: 'Gute Nacht', en: 'good night' },
      { de: 'Tschüss', en: 'bye' },
      { de: 'Auf Wiedersehen', en: 'goodbye' },
      { de: 'Bitte', en: 'please' },
      { de: 'Danke', en: 'thank you' },
      { de: "Wie geht's?", en: 'how are you?' },
    ],
  },
  numbers: {
    kind: 'number',
    words: [
      { de: 'eins', en: '1' },
      { de: 'zwei', en: '2' },
      { de: 'drei', en: '3' },
      { de: 'vier', en: '4' },
      { de: 'fünf', en: '5' },
      { de: 'sechs', en: '6' },
      { de: 'sieben', en: '7' },
      { de: 'acht', en: '8' },
      { de: 'neun', en: '9' },
      { de: 'zehn', en: '10' },
      { de: 'elf', en: '11' },
      { de: 'zwölf', en: '12' },
      { de: 'zwanzig', en: '20' },
    ],
  },
  family: {
    kind: 'noun',
    words: [
      { de: 'Vater', en: 'father', gender: 'der' },
      { de: 'Mutter', en: 'mother', gender: 'die' },
      { de: 'Bruder', en: 'brother', gender: 'der' },
      { de: 'Schwester', en: 'sister', gender: 'die' },
      { de: 'Onkel', en: 'uncle', gender: 'der' },
      { de: 'Tante', en: 'aunt', gender: 'die' },
      { de: 'Großvater', en: 'grandfather', gender: 'der' },
      { de: 'Großmutter', en: 'grandmother', gender: 'die' },
      { de: 'Sohn', en: 'son', gender: 'der' },
      { de: 'Tochter', en: 'daughter', gender: 'die' },
    ],
  },
  animals: {
    kind: 'noun',
    words: [
      { de: 'Hund', en: 'dog', gender: 'der' },
      { de: 'Katze', en: 'cat', gender: 'die' },
      { de: 'Pferd', en: 'horse', gender: 'das' },
      { de: 'Vogel', en: 'bird', gender: 'der' },
      { de: 'Kaninchen', en: 'rabbit', gender: 'das' },
      { de: 'Maus', en: 'mouse', gender: 'die' },
      { de: 'Fisch', en: 'fish', gender: 'der' },
      { de: 'Meerschweinchen', en: 'guinea pig', gender: 'das' },
    ],
  },
  school: {
    kind: 'noun',
    words: [
      { de: 'Schule', en: 'school', gender: 'die' },
      { de: 'Klassenzimmer', en: 'classroom', gender: 'das' },
      { de: 'Lehrer', en: 'teacher (male)', gender: 'der' },
      { de: 'Lehrerin', en: 'teacher (female)', gender: 'die' },
      { de: 'Buch', en: 'book', gender: 'das' },
      { de: 'Stift', en: 'pen', gender: 'der' },
      { de: 'Tasche', en: 'bag', gender: 'die' },
      { de: 'Heft', en: 'exercise book', gender: 'das' },
      { de: 'Tisch', en: 'table', gender: 'der' },
      { de: 'Tafel', en: 'board', gender: 'die' },
    ],
  },
  food: {
    kind: 'noun',
    words: [
      { de: 'Brot', en: 'bread', gender: 'das' },
      { de: 'Käse', en: 'cheese', gender: 'der' },
      { de: 'Milch', en: 'milk', gender: 'die' },
      { de: 'Apfel', en: 'apple', gender: 'der' },
      { de: 'Wasser', en: 'water', gender: 'das' },
      { de: 'Wurst', en: 'sausage', gender: 'die' },
      { de: 'Kuchen', en: 'cake', gender: 'der' },
      { de: 'Butter', en: 'butter', gender: 'die' },
      { de: 'Ei', en: 'egg', gender: 'das' },
      { de: 'Saft', en: 'juice', gender: 'der' },
    ],
  },
}

/** Nouns whose ending gives away the article. */
export const ENDING_WORDS: { de: string; gender: Gender; rule: string }[] = [
  { de: 'Zeitung', gender: 'die', rule: 'Nouns ending in -ung are feminine.' },
  { de: 'Wohnung', gender: 'die', rule: 'Nouns ending in -ung are feminine.' },
  { de: 'Freiheit', gender: 'die', rule: 'Nouns ending in -heit are feminine.' },
  { de: 'Gesundheit', gender: 'die', rule: 'Nouns ending in -heit are feminine.' },
  { de: 'Möglichkeit', gender: 'die', rule: 'Nouns ending in -keit are feminine.' },
  { de: 'Freundin', gender: 'die', rule: 'Nouns ending in -in (a female person) are feminine.' },
  { de: 'Mädchen', gender: 'das', rule: 'Nouns ending in -chen are neuter.' },
  { de: 'Häuschen', gender: 'das', rule: 'Nouns ending in -chen are neuter.' },
  { de: 'Büchlein', gender: 'das', rule: 'Nouns ending in -lein are neuter.' },
]

export interface VerbForm {
  inf: string
  en: string
  stem: string
  /** What follows the verb in the practice sentence. */
  rest: string
  /** Endings need an extra -e- (arbeiten -> du arbeitest). */
  eInsert?: boolean
  /** Stem ends in -z/-s/-ss so "du" takes just -t (tanzen -> du tanzt). */
  sibilant?: boolean
}

export const REGULAR_VERBS: VerbForm[] = [
  { inf: 'spielen', en: 'play', stem: 'spiel', rest: 'Fußball' },
  { inf: 'wohnen', en: 'live', stem: 'wohn', rest: 'in Berlin' },
  { inf: 'lernen', en: 'learn', stem: 'lern', rest: 'Deutsch' },
  { inf: 'machen', en: 'do / make', stem: 'mach', rest: 'Hausaufgaben' },
  { inf: 'kaufen', en: 'buy', stem: 'kauf', rest: 'Brot' },
  { inf: 'hören', en: 'listen to', stem: 'hör', rest: 'Musik' },
]

export const TRICKY_VERBS: VerbForm[] = [
  { inf: 'arbeiten', en: 'work', stem: 'arbeit', rest: 'in einer Schule', eInsert: true },
  { inf: 'tanzen', en: 'dance', stem: 'tanz', rest: 'gern', sibilant: true },
]

export const SUBJECTS: { s: string; end: string; slot: 'ich' | 'du' | 'er' | 'wir' | 'ihr' | 'sie' }[] = [
  { s: 'Ich', end: 'e', slot: 'ich' },
  { s: 'Du', end: 'st', slot: 'du' },
  { s: 'Er', end: 't', slot: 'er' },
  { s: 'Wir', end: 'en', slot: 'wir' },
  { s: 'Ihr', end: 't', slot: 'ihr' },
  { s: 'Die Kinder', end: 'en', slot: 'sie' },
]

export interface Sentence {
  subject: string
  form: string
  rest: string
  en: string
}

export const SEIN: Sentence[] = [
  { subject: 'Ich', form: 'bin', rest: 'zwölf Jahre alt', en: 'I am twelve years old' },
  { subject: 'Du', form: 'bist', rest: 'mein Freund', en: 'You are my friend' },
  { subject: 'Er', form: 'ist', rest: 'Lehrer', en: 'He is a teacher' },
  { subject: 'Wir', form: 'sind', rest: 'in der Schule', en: 'We are at school' },
  { subject: 'Ihr', form: 'seid', rest: 'müde', en: 'You (all) are tired' },
  { subject: 'Die Kinder', form: 'sind', rest: 'zu Hause', en: 'The children are at home' },
]

export const HABEN: Sentence[] = [
  { subject: 'Ich', form: 'habe', rest: 'einen Hund', en: 'I have a dog' },
  { subject: 'Du', form: 'hast', rest: 'eine Katze', en: 'You have a cat' },
  { subject: 'Sie', form: 'hat', rest: 'ein Buch', en: 'She has a book' },
  { subject: 'Wir', form: 'haben', rest: 'Hunger', en: 'We are hungry' },
  { subject: 'Ihr', form: 'habt', rest: 'Zeit', en: 'You (all) have time' },
  { subject: 'Die Kinder', form: 'haben', rest: 'Ferien', en: 'The children are on holiday' },
]
