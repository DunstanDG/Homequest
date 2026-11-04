/**
 * Grammar data tables for KS3 German. Every form a question shows or marks is built from these tables (or
 * written out in full in them), so the prompt, the answer and the explanation always agree.
 *
 * Checked against standard modern German (post-1996 spelling). Words whose gender or plural is regional or
 * disputed (Radiergummi, Socke, Pizza plural, Taxi plural, Park plural...) are deliberately left out, as are weak
 * masculine nouns (der Junge -> den Jungen), which would break the simple case tables.
 */
import type { Rng } from '@/engine/types'

// ------------------------------------------------------------------ text helpers

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export const q = (s: string) => `"${s}"`
/** Join words into a sentence: tidy spaces, capital first letter. */
export const words = (...parts: (string | undefined | false)[]) => parts.filter((p): p is string => !!p && p.trim() !== '').join(' ').replace(/\s+/g, ' ').trim()
export const sent = (...parts: (string | undefined | false)[]) => cap(words(...parts))
/** English "a" → "an" before a vowel (a apple → an apple). Only for English text. */
export const fixAn = (s: string) => s.replace(/\b([Aa]) (?=[aeiouAEIOU])/g, '$1n ')
export const others = <T,>(list: readonly T[], not: T) => list.filter((x) => x !== not)
export const pickN = <T,>(rng: Rng, list: readonly T[], n: number): T[] => rng.shuffle(list).slice(0, n)

/**
 * Accepted typed answers: the canonical answer first, then the spellings a pupil without a German keyboard
 * would type (ae/oe/ue for ä/ö/ü, ss for ß, in any combination) and, for sentences, the same without commas.
 * We do NOT use the judge's ignoreAccents option: it would accept "fahrt" for "fährt", which is exactly the
 * mistake a stem-changing-verb question is testing.
 */
export function accept(...answers: string[]): string[] {
  const out: string[] = []
  const push = (s: string) => {
    const t = s.replace(/\s+/g, ' ').trim()
    if (t && !out.includes(t)) out.push(t)
  }
  for (const a of answers) {
    for (const f of [a, a.replace(/,/g, '')]) {
      for (let mask = 0; mask < 16; mask++) {
        let s = f
        if (mask & 1) s = s.replace(/ä/g, 'ae').replace(/Ä/g, 'Ae')
        if (mask & 2) s = s.replace(/ö/g, 'oe').replace(/Ö/g, 'Oe')
        if (mask & 4) s = s.replace(/ü/g, 'ue').replace(/Ü/g, 'Ue')
        if (mask & 8) s = s.replace(/ß/g, 'ss')
        push(s)
      }
    }
  }
  return out
}

export const TYPE_HINT = 'No German keyboard? Type ae, oe, ue for ä, ö, ü and ss for ß.'

// ------------------------------------------------------------------ genders, cases, articles

export type Gen = 'm' | 'f' | 'n'
export type Num = Gen | 'pl'
export type Case = 'nom' | 'acc' | 'dat'

export const GENDER_WORD: Record<Num, string> = { m: 'masculine', f: 'feminine', n: 'neuter', pl: 'plural' }
export const CASE_WORD: Record<Case, string> = { nom: 'nominative', acc: 'accusative', dat: 'dative' }

export const DEF: Record<Case, Record<Num, string>> = {
  nom: { m: 'der', f: 'die', n: 'das', pl: 'die' },
  acc: { m: 'den', f: 'die', n: 'das', pl: 'die' },
  dat: { m: 'dem', f: 'der', n: 'dem', pl: 'den' },
}

/** Endings for ein, kein and the possessives (mein, dein, sein, ihr, unser, euer, Ihr). */
export const EIN_END: Record<Case, Record<Num, string>> = {
  nom: { m: '', f: 'e', n: '', pl: 'e' },
  acc: { m: 'en', f: 'e', n: '', pl: 'e' },
  dat: { m: 'em', f: 'er', n: 'em', pl: 'en' },
}

/** ein / kein / mein... with its ending. "euer" drops its second e when an ending is added (eure, euren). */
export function einForm(stem: string, c: Case, g: Num): string {
  const e = EIN_END[c][g]
  if (e && /^euer$/i.test(stem)) return `${stem.slice(0, 2)}r${e}`
  return `${stem}${e}`
}

// ------------------------------------------------------------------ nouns

export type Cat = 'family' | 'pet' | 'school' | 'home' | 'thing' | 'media' | 'food' | 'clothes' | 'place' | 'transport'

export interface Noun {
  de: string
  en: string
  g: Gen
  /** Nominative plural; left out for mass nouns and words with a disputed plural. */
  pl?: string
  enPl?: string
  cat: Cat
}

const N = (de: string, g: Gen, en: string, cat: Cat, pl?: string, enPl?: string): Noun => ({ de, g, en, cat, pl, enPl })

export const NOUNS: Noun[] = [
  // family and people
  N('Bruder', 'm', 'brother', 'family', 'Brüder'),
  N('Schwester', 'f', 'sister', 'family', 'Schwestern'),
  N('Vater', 'm', 'father', 'family', 'Väter'),
  N('Mutter', 'f', 'mother', 'family', 'Mütter'),
  N('Onkel', 'm', 'uncle', 'family', 'Onkel'),
  N('Tante', 'f', 'aunt', 'family', 'Tanten'),
  N('Opa', 'm', 'grandad', 'family', 'Opas'),
  N('Oma', 'f', 'grandma', 'family', 'Omas'),
  N('Sohn', 'm', 'son', 'family', 'Söhne'),
  N('Tochter', 'f', 'daughter', 'family', 'Töchter', 'daughters'),
  N('Cousin', 'm', 'cousin (boy)', 'family', 'Cousins', 'cousins (boys)'),
  N('Cousine', 'f', 'cousin (girl)', 'family', 'Cousinen', 'cousins (girls)'),
  N('Freund', 'm', 'friend (boy)', 'family', 'Freunde', 'friends'),
  N('Freundin', 'f', 'friend (girl)', 'family', 'Freundinnen', 'friends (girls)'),
  N('Kind', 'n', 'child', 'family', 'Kinder', 'children'),
  N('Baby', 'n', 'baby', 'family', 'Babys', 'babies'),
  // pets
  N('Hund', 'm', 'dog', 'pet', 'Hunde'),
  N('Katze', 'f', 'cat', 'pet', 'Katzen'),
  N('Pferd', 'n', 'horse', 'pet', 'Pferde'),
  N('Kaninchen', 'n', 'rabbit', 'pet', 'Kaninchen'),
  N('Meerschweinchen', 'n', 'guinea pig', 'pet', 'Meerschweinchen'),
  N('Vogel', 'm', 'bird', 'pet', 'Vögel'),
  N('Fisch', 'm', 'fish', 'pet', 'Fische', 'fish'),
  N('Maus', 'f', 'mouse', 'pet', 'Mäuse', 'mice'),
  N('Hamster', 'm', 'hamster', 'pet', 'Hamster'),
  N('Schildkröte', 'f', 'tortoise', 'pet', 'Schildkröten', 'tortoises'),
  // school
  N('Buch', 'n', 'book', 'school', 'Bücher'),
  N('Heft', 'n', 'exercise book', 'school', 'Hefte'),
  N('Stift', 'm', 'pen', 'school', 'Stifte'),
  N('Bleistift', 'm', 'pencil', 'school', 'Bleistifte'),
  N('Lineal', 'n', 'ruler', 'school', 'Lineale'),
  N('Tasche', 'f', 'bag', 'school', 'Taschen'),
  N('Rucksack', 'm', 'rucksack', 'school', 'Rucksäcke'),
  N('Taschenrechner', 'm', 'calculator', 'school', 'Taschenrechner'),
  N('Wörterbuch', 'n', 'dictionary', 'school', 'Wörterbücher', 'dictionaries'),
  // home
  N('Tisch', 'm', 'table', 'home', 'Tische'),
  N('Stuhl', 'm', 'chair', 'home', 'Stühle'),
  N('Bett', 'n', 'bed', 'home', 'Betten'),
  N('Lampe', 'f', 'lamp', 'home', 'Lampen'),
  N('Uhr', 'f', 'clock', 'home', 'Uhren'),
  N('Sofa', 'n', 'sofa', 'home', 'Sofas'),
  N('Schrank', 'm', 'cupboard', 'home', 'Schränke'),
  N('Fenster', 'n', 'window', 'home', 'Fenster'),
  N('Tür', 'f', 'door', 'home', 'Türen'),
  N('Haus', 'n', 'house', 'home', 'Häuser'),
  N('Zimmer', 'n', 'room', 'home', 'Zimmer'),
  N('Garten', 'm', 'garden', 'home', 'Gärten'),
  N('Wohnung', 'f', 'flat', 'home', 'Wohnungen'),
  // things
  N('Handy', 'n', 'mobile phone', 'thing', 'Handys'),
  N('Computer', 'm', 'computer', 'thing', 'Computer'),
  N('Fernseher', 'm', 'television', 'thing', 'Fernseher'),
  N('Fahrrad', 'n', 'bike', 'thing', 'Fahrräder'),
  N('Ball', 'm', 'ball', 'thing', 'Bälle'),
  N('Schlüssel', 'm', 'key', 'thing', 'Schlüssel'),
  N('Geschenk', 'n', 'present', 'thing', 'Geschenke'),
  N('Gitarre', 'f', 'guitar', 'thing', 'Gitarren'),
  // media
  N('Film', 'm', 'film', 'media', 'Filme'),
  N('Roman', 'm', 'novel', 'media', 'Romane'),
  N('Spiel', 'n', 'game', 'media', 'Spiele'),
  N('Lied', 'n', 'song', 'media', 'Lieder'),
  N('Foto', 'n', 'photo', 'media', 'Fotos'),
  N('Zeitung', 'f', 'newspaper', 'media', 'Zeitungen'),
  N('Zeitschrift', 'f', 'magazine', 'media', 'Zeitschriften'),
  // food (countable)
  N('Apfel', 'm', 'apple', 'food', 'Äpfel'),
  N('Banane', 'f', 'banana', 'food', 'Bananen'),
  N('Ei', 'n', 'egg', 'food', 'Eier'),
  N('Tomate', 'f', 'tomato', 'food', 'Tomaten', 'tomatoes'),
  N('Karotte', 'f', 'carrot', 'food', 'Karotten'),
  N('Orange', 'f', 'orange', 'food', 'Orangen'),
  N('Wurst', 'f', 'sausage', 'food', 'Würste'),
  // clothes
  N('Pullover', 'm', 'jumper', 'clothes', 'Pullover'),
  N('Rock', 'm', 'skirt', 'clothes', 'Röcke'),
  N('Hut', 'm', 'hat', 'clothes', 'Hüte'),
  N('Mantel', 'm', 'coat', 'clothes', 'Mäntel'),
  N('Schuh', 'm', 'shoe', 'clothes', 'Schuhe'),
  N('Jacke', 'f', 'jacket', 'clothes', 'Jacken'),
  N('Bluse', 'f', 'blouse', 'clothes', 'Blusen'),
  N('Mütze', 'f', 'woolly hat', 'clothes', 'Mützen'),
  N('Kleid', 'n', 'dress', 'clothes', 'Kleider', 'dresses'),
  N('Hemd', 'n', 'shirt', 'clothes', 'Hemden'),
  N('T-Shirt', 'n', 'T-shirt', 'clothes', 'T-Shirts'),
  // places
  N('Bahnhof', 'm', 'station', 'place', 'Bahnhöfe'),
  N('Supermarkt', 'm', 'supermarket', 'place', 'Supermärkte'),
  N('Strand', 'm', 'beach', 'place', 'Strände', 'beaches'),
  N('Spielplatz', 'm', 'playground', 'place', 'Spielplätze'),
  N('Schule', 'f', 'school', 'place', 'Schulen'),
  N('Stadt', 'f', 'town', 'place', 'Städte'),
  N('Kirche', 'f', 'church', 'place', 'Kirchen', 'churches'),
  N('Bäckerei', 'f', 'bakery', 'place', 'Bäckereien', 'bakeries'),
  N('Bibliothek', 'f', 'library', 'place', 'Bibliotheken', 'libraries'),
  N('Kino', 'n', 'cinema', 'place', 'Kinos'),
  N('Schwimmbad', 'n', 'swimming pool', 'place', 'Schwimmbäder'),
  N('Museum', 'n', 'museum', 'place', 'Museen'),
  N('Restaurant', 'n', 'restaurant', 'place', 'Restaurants'),
  N('Café', 'n', 'café', 'place', 'Cafés'),
  N('Hotel', 'n', 'hotel', 'place', 'Hotels'),
  N('Rathaus', 'n', 'town hall', 'place', 'Rathäuser'),
  // transport
  N('Bus', 'm', 'bus', 'transport'),
  N('Zug', 'm', 'train', 'transport', 'Züge'),
  N('Auto', 'n', 'car', 'transport', 'Autos'),
  N('Straßenbahn', 'f', 'tram', 'transport', 'Straßenbahnen'),
  N('U-Bahn', 'f', 'underground', 'transport'),
  N('Flugzeug', 'n', 'plane', 'transport', 'Flugzeuge'),
  N('Schiff', 'n', 'ship', 'transport', 'Schiffe'),
]

export const nounsIn = (...cats: Cat[]) => NOUNS.filter((n) => cats.includes(n.cat))
export const enPlural = (n: Noun) => n.enPl ?? `${n.en}s`
/** Dative plural: add -n unless the plural already ends in -n or -s (den Kindern, den Autos). */
export const datPlural = (pl: string) => (/[ns]$/.test(pl) ? pl : `${pl}n`)

// ------------------------------------------------------------------ persons and verbs

export type Slot = 0 | 1 | 2 | 3 | 4 | 5
/** Which pronoun group each slot of a verb table belongs to. */
export const SLOT_LABEL = ['ich', 'du', 'er / sie / es', 'wir', 'ihr', 'sie / Sie'] as const

export interface Person {
  de: string
  en: string
  slot: Slot
}

/** Subjects for verb drills. "sie" and "Sie" are avoided at the start of a sentence, where they are ambiguous. */
export const PERSONS: Person[] = [
  { de: 'ich', en: 'I', slot: 0 },
  { de: 'du', en: 'you', slot: 1 },
  { de: 'er', en: 'he', slot: 2 },
  { de: 'Lena', en: 'Lena', slot: 2 },
  { de: 'mein Bruder', en: 'my brother', slot: 2 },
  { de: 'wir', en: 'we', slot: 3 },
  { de: 'ihr', en: 'you (all)', slot: 4 },
  { de: 'meine Eltern', en: 'my parents', slot: 5 },
  { de: 'Mia und Ben', en: 'Mia and Ben', slot: 5 },
]

export type Forms = [string, string, string, string, string, string]

export const SEIN: Forms = ['bin', 'bist', 'ist', 'sind', 'seid', 'sind']
export const HABEN: Forms = ['habe', 'hast', 'hat', 'haben', 'habt', 'haben']
export const WERDEN: Forms = ['werde', 'wirst', 'wird', 'werden', 'werdet', 'werden']
export const WAR: Forms = ['war', 'warst', 'war', 'waren', 'wart', 'waren']
export const HATTE: Forms = ['hatte', 'hattest', 'hatte', 'hatten', 'hattet', 'hatten']

/** Stem-changing verbs in the present tense, written out in full. */
export interface IrregularVerb {
  inf: string
  en: string
  forms: Forms
  /** The vowel change in the du and er/sie/es forms. */
  change: string
  /** A complement that fits any subject. */
  rest: string
}

export const IRREGULAR: IrregularVerb[] = [
  { inf: 'fahren', en: 'go (by transport)', forms: ['fahre', 'fährst', 'fährt', 'fahren', 'fahrt', 'fahren'], change: 'a → ä', rest: 'mit dem Bus' },
  { inf: 'schlafen', en: 'sleep', forms: ['schlafe', 'schläfst', 'schläft', 'schlafen', 'schlaft', 'schlafen'], change: 'a → ä', rest: 'am Wochenende lange' },
  { inf: 'tragen', en: 'wear', forms: ['trage', 'trägst', 'trägt', 'tragen', 'tragt', 'tragen'], change: 'a → ä', rest: 'eine Jacke' },
  { inf: 'laufen', en: 'run', forms: ['laufe', 'läufst', 'läuft', 'laufen', 'lauft', 'laufen'], change: 'au → äu', rest: 'sehr schnell' },
  { inf: 'waschen', en: 'wash', forms: ['wasche', 'wäschst', 'wäscht', 'waschen', 'wascht', 'waschen'], change: 'a → ä', rest: 'das Auto' },
  { inf: 'essen', en: 'eat', forms: ['esse', 'isst', 'isst', 'essen', 'esst', 'essen'], change: 'e → i', rest: 'einen Apfel' },
  { inf: 'lesen', en: 'read', forms: ['lese', 'liest', 'liest', 'lesen', 'lest', 'lesen'], change: 'e → ie', rest: 'ein Buch' },
  { inf: 'sehen', en: 'see / watch', forms: ['sehe', 'siehst', 'sieht', 'sehen', 'seht', 'sehen'], change: 'e → ie', rest: 'einen Film' },
  { inf: 'nehmen', en: 'take', forms: ['nehme', 'nimmst', 'nimmt', 'nehmen', 'nehmt', 'nehmen'], change: 'e → i (and -hm- → -mm-)', rest: 'den Bus' },
  { inf: 'sprechen', en: 'speak', forms: ['spreche', 'sprichst', 'spricht', 'sprechen', 'sprecht', 'sprechen'], change: 'e → i', rest: 'Deutsch' },
  { inf: 'treffen', en: 'meet', forms: ['treffe', 'triffst', 'trifft', 'treffen', 'trefft', 'treffen'], change: 'e → i', rest: 'Freunde in der Stadt' },
  { inf: 'geben', en: 'give', forms: ['gebe', 'gibst', 'gibt', 'geben', 'gebt', 'geben'], change: 'e → i', rest: 'dem Hund Wasser' },
  { inf: 'helfen', en: 'help', forms: ['helfe', 'hilfst', 'hilft', 'helfen', 'helft', 'helfen'], change: 'e → i', rest: 'zu Hause' },
  { inf: 'vergessen', en: 'forget', forms: ['vergesse', 'vergisst', 'vergisst', 'vergessen', 'vergesst', 'vergessen'], change: 'e → i', rest: 'oft die Hausaufgaben' },
]

/** Regular verbs, conjugated in full (no rules applied at runtime). */
export interface RegularVerb {
  inf: string
  en: string
  forms: Forms
  rest: string
}

export const REGULAR: RegularVerb[] = [
  { inf: 'spielen', en: 'play', forms: ['spiele', 'spielst', 'spielt', 'spielen', 'spielt', 'spielen'], rest: 'Fußball' },
  { inf: 'wohnen', en: 'live', forms: ['wohne', 'wohnst', 'wohnt', 'wohnen', 'wohnt', 'wohnen'], rest: 'in Hamburg' },
  { inf: 'lernen', en: 'learn', forms: ['lerne', 'lernst', 'lernt', 'lernen', 'lernt', 'lernen'], rest: 'Deutsch' },
  { inf: 'kaufen', en: 'buy', forms: ['kaufe', 'kaufst', 'kauft', 'kaufen', 'kauft', 'kaufen'], rest: 'eine Zeitschrift' },
  { inf: 'hören', en: 'listen to', forms: ['höre', 'hörst', 'hört', 'hören', 'hört', 'hören'], rest: 'Musik' },
  { inf: 'machen', en: 'do / make', forms: ['mache', 'machst', 'macht', 'machen', 'macht', 'machen'], rest: 'Hausaufgaben' },
  { inf: 'kochen', en: 'cook', forms: ['koche', 'kochst', 'kocht', 'kochen', 'kocht', 'kochen'], rest: 'Spaghetti' },
  { inf: 'besuchen', en: 'visit', forms: ['besuche', 'besuchst', 'besucht', 'besuchen', 'besucht', 'besuchen'], rest: 'Oma' },
]

/** Modal verbs. mögen is used with a noun ("Ich mag Pizza"), the others with an infinitive. */
export interface Modal {
  inf: string
  en: string
  forms: Forms
  /** English for "I ___ / he ___" (only where English changes for he/she). */
  enI: string
  enHe: string
  withInfinitive: boolean
}

export const MODALS: Modal[] = [
  { inf: 'können', en: 'can / be able to', forms: ['kann', 'kannst', 'kann', 'können', 'könnt', 'können'], enI: 'can', enHe: 'can', withInfinitive: true },
  { inf: 'müssen', en: 'must / have to', forms: ['muss', 'musst', 'muss', 'müssen', 'müsst', 'müssen'], enI: 'have to', enHe: 'has to', withInfinitive: true },
  { inf: 'wollen', en: 'want to', forms: ['will', 'willst', 'will', 'wollen', 'wollt', 'wollen'], enI: 'want to', enHe: 'wants to', withInfinitive: true },
  { inf: 'dürfen', en: 'be allowed to', forms: ['darf', 'darfst', 'darf', 'dürfen', 'dürft', 'dürfen'], enI: 'am allowed to', enHe: 'is allowed to', withInfinitive: true },
  { inf: 'sollen', en: 'be supposed to / should', forms: ['soll', 'sollst', 'soll', 'sollen', 'sollt', 'sollen'], enI: 'should', enHe: 'should', withInfinitive: true },
  { inf: 'möchten', en: 'would like to', forms: ['möchte', 'möchtest', 'möchte', 'möchten', 'möchtet', 'möchten'], enI: 'would like to', enHe: 'would like to', withInfinitive: true },
  { inf: 'mögen', en: 'like', forms: ['mag', 'magst', 'mag', 'mögen', 'mögt', 'mögen'], enI: 'like', enHe: 'likes', withInfinitive: false },
]

/** English modal phrase for a slot: "I am allowed to", "he is allowed to", "you are allowed to". */
export function enModal(m: Modal, slot: Slot): string {
  if (slot === 2) return m.enHe
  if (m.enI === 'am allowed to') return slot === 0 ? 'am allowed to' : 'are allowed to'
  return m.enI
}

/** Infinitive phrases that work after any modal and any subject. `sep` marks a separable verb (aufstehen). */
export interface Activity {
  mid: string
  inf: string
  en: string
  /** zu-infinitive (zu spielen, aufzustehen). */
  zu: string
  sep?: boolean
}

export const ACTIVITIES: Activity[] = [
  { mid: 'Tennis', inf: 'spielen', en: 'play tennis', zu: 'zu spielen' },
  { mid: 'früh', inf: 'aufstehen', en: 'get up early', zu: 'aufzustehen', sep: true },
  { mid: 'ins Kino', inf: 'gehen', en: 'go to the cinema', zu: 'zu gehen' },
  { mid: 'Hausaufgaben', inf: 'machen', en: 'do homework', zu: 'zu machen' },
  { mid: 'Gitarre', inf: 'spielen', en: 'play the guitar', zu: 'zu spielen' },
  { mid: 'ein Eis', inf: 'essen', en: 'eat an ice cream', zu: 'zu essen' },
  { mid: 'nach Hause', inf: 'gehen', en: 'go home', zu: 'zu gehen' },
  { mid: 'heute Abend', inf: 'fernsehen', en: 'watch TV this evening', zu: 'fernzusehen', sep: true },
  { mid: 'gut', inf: 'schwimmen', en: 'swim well', zu: 'zu schwimmen' },
  { mid: 'Deutsch', inf: 'sprechen', en: 'speak German', zu: 'zu sprechen' },
  { mid: 'die Küche', inf: 'aufräumen', en: 'tidy the kitchen', zu: 'aufzuräumen', sep: true },
  { mid: 'mit dem Bus', inf: 'fahren', en: 'go by bus', zu: 'zu fahren' },
  { mid: 'am Samstag', inf: 'einkaufen', en: 'go shopping on Saturday', zu: 'einzukaufen', sep: true },
  { mid: 'ein Buch', inf: 'lesen', en: 'read a book', zu: 'zu lesen' },
]

/** Separable verbs: the verb part conjugated in full, plus its prefix. */
export interface SepVerb {
  inf: string
  en: string
  prefix: string
  forms: Forms
  /** What goes between the verb and the prefix. */
  mid: string
  enMid: string
  aux: 'haben' | 'sein'
  pp: string
}

export const SEPARABLE: SepVerb[] = [
  { inf: 'aufstehen', en: 'get up', prefix: 'auf', forms: ['stehe', 'stehst', 'steht', 'stehen', 'steht', 'stehen'], mid: 'um sieben Uhr', enMid: 'at seven o’clock', aux: 'sein', pp: 'aufgestanden' },
  { inf: 'fernsehen', en: 'watch TV', prefix: 'fern', forms: ['sehe', 'siehst', 'sieht', 'sehen', 'seht', 'sehen'], mid: 'am Abend', enMid: 'in the evening', aux: 'haben', pp: 'ferngesehen' },
  { inf: 'einkaufen', en: 'go shopping', prefix: 'ein', forms: ['kaufe', 'kaufst', 'kauft', 'kaufen', 'kauft', 'kaufen'], mid: 'im Supermarkt', enMid: 'at the supermarket', aux: 'haben', pp: 'eingekauft' },
  { inf: 'anrufen', en: 'phone', prefix: 'an', forms: ['rufe', 'rufst', 'ruft', 'rufen', 'ruft', 'rufen'], mid: 'Tante Anna', enMid: 'Aunt Anna', aux: 'haben', pp: 'angerufen' },
  { inf: 'ankommen', en: 'arrive', prefix: 'an', forms: ['komme', 'kommst', 'kommt', 'kommen', 'kommt', 'kommen'], mid: 'um zehn Uhr', enMid: 'at ten o’clock', aux: 'sein', pp: 'angekommen' },
  { inf: 'abfahren', en: 'leave (set off)', prefix: 'ab', forms: ['fahre', 'fährst', 'fährt', 'fahren', 'fahrt', 'fahren'], mid: 'um acht Uhr', enMid: 'at eight o’clock', aux: 'sein', pp: 'abgefahren' },
  { inf: 'aufräumen', en: 'tidy up', prefix: 'auf', forms: ['räume', 'räumst', 'räumt', 'räumen', 'räumt', 'räumen'], mid: 'die Küche', enMid: 'the kitchen', aux: 'haben', pp: 'aufgeräumt' },
  { inf: 'mitkommen', en: 'come along', prefix: 'mit', forms: ['komme', 'kommst', 'kommt', 'kommen', 'kommt', 'kommen'], mid: 'heute', enMid: 'today', aux: 'sein', pp: 'mitgekommen' },
  { inf: 'aufwachen', en: 'wake up', prefix: 'auf', forms: ['wache', 'wachst', 'wacht', 'wachen', 'wacht', 'wachen'], mid: 'früh', enMid: 'early', aux: 'sein', pp: 'aufgewacht' },
  { inf: 'zumachen', en: 'close', prefix: 'zu', forms: ['mache', 'machst', 'macht', 'machen', 'macht', 'machen'], mid: 'das Fenster', enMid: 'the window', aux: 'haben', pp: 'zugemacht' },
  { inf: 'aufmachen', en: 'open', prefix: 'auf', forms: ['mache', 'machst', 'macht', 'machen', 'macht', 'machen'], mid: 'die Tür', enMid: 'the door', aux: 'haben', pp: 'aufgemacht' },
  { inf: 'anfangen', en: 'start', prefix: 'an', forms: ['fange', 'fängst', 'fängt', 'fangen', 'fangt', 'fangen'], mid: 'mit den Hausaufgaben', enMid: 'on the homework', aux: 'haben', pp: 'angefangen' },
  { inf: 'ausgehen', en: 'go out', prefix: 'aus', forms: ['gehe', 'gehst', 'geht', 'gehen', 'geht', 'gehen'], mid: 'am Samstag', enMid: 'on Saturday', aux: 'sein', pp: 'ausgegangen' },
]

// ------------------------------------------------------------------ perfect tense

export type PerfType = 'regular' | 'irregular' | 'mixed' | 'separable' | 'inseparable' | 'ieren'

export interface PerfVerb {
  inf: string
  aux: 'haben' | 'sein'
  pp: string
  type: PerfType
  /** Complement that sits before the participle. */
  mid: string
  /** English simple past of the whole phrase, without the subject. */
  en: string
  /** English meaning of the infinitive. */
  enInf: string
}

const P = (inf: string, aux: 'haben' | 'sein', pp: string, type: PerfType, mid: string, en: string, enInf: string): PerfVerb => ({ inf, aux, pp, type, mid, en, enInf })

export const PERFECT: PerfVerb[] = [
  // regular, haben
  P('spielen', 'haben', 'gespielt', 'regular', 'Fußball', 'played football', 'play'),
  P('machen', 'haben', 'gemacht', 'regular', 'die Hausaufgaben', 'did the homework', 'do / make'),
  P('kaufen', 'haben', 'gekauft', 'regular', 'ein T-Shirt', 'bought a T-shirt', 'buy'),
  P('hören', 'haben', 'gehört', 'regular', 'Musik', 'listened to music', 'listen to'),
  P('kochen', 'haben', 'gekocht', 'regular', 'Spaghetti', 'cooked spaghetti', 'cook'),
  P('tanzen', 'haben', 'getanzt', 'regular', 'auf der Party', 'danced at the party', 'dance'),
  P('lernen', 'haben', 'gelernt', 'regular', 'für den Test', 'revised for the test', 'learn'),
  P('arbeiten', 'haben', 'gearbeitet', 'regular', 'im Garten', 'worked in the garden', 'work'),
  P('zelten', 'haben', 'gezeltet', 'regular', 'am See', 'camped by the lake', 'camp'),
  P('chatten', 'haben', 'gechattet', 'regular', 'mit Freunden', 'chatted with friends', 'chat'),
  P('warten', 'haben', 'gewartet', 'regular', 'auf den Bus', 'waited for the bus', 'wait'),
  P('surfen', 'haben', 'gesurft', 'regular', 'im Internet', 'surfed the internet', 'surf'),
  // irregular (strong) and mixed, haben
  P('essen', 'haben', 'gegessen', 'irregular', 'eine Pizza', 'ate a pizza', 'eat'),
  P('trinken', 'haben', 'getrunken', 'irregular', 'Orangensaft', 'drank orange juice', 'drink'),
  P('sehen', 'haben', 'gesehen', 'irregular', 'einen Film', 'saw a film', 'see / watch'),
  P('lesen', 'haben', 'gelesen', 'irregular', 'ein Buch', 'read a book', 'read'),
  P('schreiben', 'haben', 'geschrieben', 'irregular', 'eine E-Mail', 'wrote an email', 'write'),
  P('nehmen', 'haben', 'genommen', 'irregular', 'den Zug', 'took the train', 'take'),
  P('finden', 'haben', 'gefunden', 'irregular', 'einen Schlüssel', 'found a key', 'find'),
  P('sprechen', 'haben', 'gesprochen', 'irregular', 'mit dem Lehrer', 'spoke to the teacher', 'speak'),
  P('treffen', 'haben', 'getroffen', 'irregular', 'meine Freunde', 'met my friends', 'meet'),
  P('singen', 'haben', 'gesungen', 'irregular', 'ein Lied', 'sang a song', 'sing'),
  P('schlafen', 'haben', 'geschlafen', 'irregular', 'lange', 'slept for a long time', 'sleep'),
  P('helfen', 'haben', 'geholfen', 'irregular', 'meiner Mutter', 'helped my mother', 'help'),
  P('tragen', 'haben', 'getragen', 'irregular', 'eine Jacke', 'wore a jacket', 'wear / carry'),
  P('waschen', 'haben', 'gewaschen', 'irregular', 'das Auto', 'washed the car', 'wash'),
  P('gewinnen', 'haben', 'gewonnen', 'irregular', 'das Spiel', 'won the match', 'win'),
  P('bringen', 'haben', 'gebracht', 'mixed', 'ein Geschenk', 'brought a present', 'bring'),
  // sein
  P('gehen', 'sein', 'gegangen', 'irregular', 'ins Kino', 'went to the cinema', 'go'),
  P('fahren', 'sein', 'gefahren', 'irregular', 'nach Spanien', 'went to Spain', 'go (by transport)'),
  P('fliegen', 'sein', 'geflogen', 'irregular', 'nach Italien', 'flew to Italy', 'fly'),
  P('kommen', 'sein', 'gekommen', 'irregular', 'spät nach Hause', 'came home late', 'come'),
  P('bleiben', 'sein', 'geblieben', 'irregular', 'zu Hause', 'stayed at home', 'stay'),
  // schwimmen is left out: Duden allows both "ist" and "hat geschwommen", so a haben/sein question would have two answers.
  P('laufen', 'sein', 'gelaufen', 'irregular', 'zur Schule', 'ran to school', 'run'),
  P('wandern', 'sein', 'gewandert', 'regular', 'in den Bergen', 'went hiking in the mountains', 'hike'),
  P('reisen', 'sein', 'gereist', 'regular', 'nach Österreich', 'travelled to Austria', 'travel'),
  P('sein', 'sein', 'gewesen', 'irregular', 'in Berlin', 'was in Berlin', 'be'),
  // separable
  P('aufstehen', 'sein', 'aufgestanden', 'separable', 'um sieben Uhr', 'got up at seven o’clock', 'get up'),
  P('ankommen', 'sein', 'angekommen', 'separable', 'spät', 'arrived late', 'arrive'),
  P('aufwachen', 'sein', 'aufgewacht', 'separable', 'früh', 'woke up early', 'wake up'),
  P('ausgehen', 'sein', 'ausgegangen', 'separable', 'mit Freunden', 'went out with friends', 'go out'),
  P('abfahren', 'sein', 'abgefahren', 'separable', 'um acht Uhr', 'left at eight o’clock', 'leave (set off)'),
  P('fernsehen', 'haben', 'ferngesehen', 'separable', 'am Abend', 'watched TV in the evening', 'watch TV'),
  P('einkaufen', 'haben', 'eingekauft', 'separable', 'im Supermarkt', 'went shopping at the supermarket', 'go shopping'),
  P('aufräumen', 'haben', 'aufgeräumt', 'separable', 'die Küche', 'tidied the kitchen', 'tidy up'),
  P('anrufen', 'haben', 'angerufen', 'separable', 'meine Oma', 'phoned my grandma', 'phone'),
  P('zumachen', 'haben', 'zugemacht', 'separable', 'das Fenster', 'closed the window', 'close'),
  // inseparable prefixes and -ieren: no ge-
  P('besuchen', 'haben', 'besucht', 'inseparable', 'meine Tante', 'visited my aunt', 'visit'),
  P('bekommen', 'haben', 'bekommen', 'inseparable', 'eine gute Note', 'got a good mark', 'get / receive'),
  P('vergessen', 'haben', 'vergessen', 'inseparable', 'die Hausaufgaben', 'forgot the homework', 'forget'),
  P('verlieren', 'haben', 'verloren', 'inseparable', 'den Schlüssel', 'lost the key', 'lose'),
  P('bezahlen', 'haben', 'bezahlt', 'inseparable', 'die Rechnung', 'paid the bill', 'pay'),
  P('erzählen', 'haben', 'erzählt', 'inseparable', 'eine Geschichte', 'told a story', 'tell'),
  P('verkaufen', 'haben', 'verkauft', 'inseparable', 'das alte Fahrrad', 'sold the old bike', 'sell'),
  P('fotografieren', 'haben', 'fotografiert', 'ieren', 'den Dom', 'photographed the cathedral', 'photograph'),
  P('telefonieren', 'haben', 'telefoniert', 'ieren', 'mit meiner Tante', 'phoned my aunt', 'phone'),
  P('reparieren', 'haben', 'repariert', 'ieren', 'das Fahrrad', 'repaired the bike', 'repair'),
  P('probieren', 'haben', 'probiert', 'ieren', 'den Kuchen', 'tried the cake', 'try'),
]

export const perfOf = (inf: string) => PERFECT.find((p) => p.inf === inf)

/** English subject + past phrase: "my parents went to Spain". */
export const enPast = (p: Person, v: PerfVerb) => cap(`${p.en} ${v.en}`)

// ------------------------------------------------------------------ time phrases

export const PAST_TIMES = ['gestern', 'letztes Wochenende', 'letzten Samstag', 'letzte Woche', 'in den Ferien', 'vorgestern']
export const PRESENT_TIMES = ['jeden Tag', 'normalerweise', 'oft', 'manchmal', 'jeden Samstag']
export const FUTURE_TIMES = ['morgen', 'nächstes Wochenende', 'nächste Woche', 'nächstes Jahr', 'übermorgen']
export const TIME_EN: Record<string, string> = {
  gestern: 'yesterday',
  'letztes Wochenende': 'last weekend',
  'letzten Samstag': 'last Saturday',
  'letzte Woche': 'last week',
  'in den Ferien': 'in the holidays',
  vorgestern: 'the day before yesterday',
  'jeden Tag': 'every day',
  normalerweise: 'normally',
  oft: 'often',
  manchmal: 'sometimes',
  'jeden Samstag': 'every Saturday',
  morgen: 'tomorrow',
  'nächstes Wochenende': 'next weekend',
  'nächste Woche': 'next week',
  'nächstes Jahr': 'next year',
  übermorgen: 'the day after tomorrow',
}
