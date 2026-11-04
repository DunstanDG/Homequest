import type { ItemGenerator } from '@/engine/registry'
import { choice, generatorFor, matchItem, textItem } from '../../kit'
import {
  accept,
  cap,
  DEF,
  einForm,
  enPlural,
  fixAn,
  GENDER_WORD,
  NOUNS,
  nounsIn,
  others,
  pickN,
  q,
  TYPE_HINT,
  type Case,
  type Noun,
  type Num,
} from './data'

const G = generatorFor('german')

// =================================================================== plurals

/** Umlaut the last a / o / u / au of a word (for building wrong plurals). */
export function umlaut(w: string): string {
  const map: Record<string, string> = { a: 'ä', o: 'ö', u: 'ü', au: 'äu', A: 'Ä', O: 'Ö', U: 'Ü', Au: 'Äu' }
  return w.replace(/(au|Au|a|o|u|A|O|U)(?=[^aouAOU]*$)/, (m) => map[m] ?? m)
}

/** The rule a plural follows, for explanations. */
export function pluralRule(n: Noun): string {
  const s = n.de
  const p = n.pl ?? ''
  if (p === s) return /chen$/.test(s) ? 'Nouns ending in -chen never change in the plural.' : 'Many masculine and neuter nouns ending in -er, -el or -en do not change in the plural.'
  if (/in$/.test(s) && p === `${s}nen`) return 'Nouns ending in -in (female people) add -nen.'
  if (/e$/.test(s) && p === `${s}n`) return 'Most nouns ending in -e add -n.'
  if (/ung$/.test(s)) return 'Nouns ending in -ung add -en.'
  if (/um$/.test(s)) return `${s} is special: -um changes to -en.`
  if (p === `${s}en` || p === `${s}n`) return n.g === 'f' ? 'Many feminine nouns add -en or -n.' : 'This noun adds -en.'
  if (p === `${s}s`) return 'Words borrowed from other languages, and words ending in a vowel other than -e, usually add -s.'
  if (p === `${s}e`) return 'Many masculine and neuter nouns add -e.'
  const u = umlaut(s)
  if (p === `${u}er`) return 'Many short neuter nouns add -er and an umlaut on a, o or u.'
  if (p === `${s}er`) return 'Some short neuter nouns add -er.'
  if (p === `${u}e`) return 'Many one-syllable nouns add -e and an umlaut on a, o or u.'
  if (p === u) return 'Some nouns ending in -er, -el or -en just add an umlaut.'
  if (p === `${s}en`) return 'This noun adds -en.'
  return 'This plural has to be learnt with the word.'
}

/** Plausible wrong plurals built from the common patterns. */
function wrongPlurals(n: Noun): { label: string; feedback: string }[] {
  const s = n.de
  const u = umlaut(s)
  const nEnd = /(e|el|er)$/.test(s) ? 'n' : /en$/.test(s) ? '' : 'en'
  const raw: [string, string][] = [
    [`${s}e`, 'Adding -e is common, but not for this word.'],
    [`${s}${nEnd}`, 'Adding -(e)n is common for feminine nouns, but not here.'],
    [`${s}er`, 'Adding -er is used for some short neuter nouns, but not this one.'],
    [`${s}s`, 'Adding -s is mainly for borrowed words like Autos and Handys.'],
    [`${u}e`, 'Umlaut plus -e is a real pattern, but not for this word.'],
    [`${u}er`, 'Umlaut plus -er is a real pattern, but not for this word.'],
    [u, 'Just adding an umlaut is a real pattern, but not for this word.'],
    [s, 'Some nouns do not change in the plural, but this one does.'],
  ]
  const seen = new Set<string>([n.pl ?? ''])
  const out: { label: string; feedback: string }[] = []
  for (const [w, fb] of raw) {
    if (seen.has(w) || w === '') continue
    seen.add(w)
    out.push({ label: w, feedback: fb })
  }
  return out
}

/** Nouns used for plural questions: leave out words whose wrong plurals happen to be real words (Mutter -> Muttern
 * "nuts"; Cousin -> Cousine) or that have no single plural. */
const PLURAL_NOUNS = NOUNS.filter((n) => n.pl && !['Mutter', 'Cousin', 'Cousine', 'Baby', 'Spiel'].includes(n.de))
const EASY_PLURAL = PLURAL_NOUNS.filter((n) => n.pl === `${n.de}n` || n.pl === `${n.de}nen` || /chen$/.test(n.de) || n.pl === `${n.de}s`)
const HARD_PLURAL = PLURAL_NOUNS.filter((n) => /[äöü]/.test(n.pl ?? '') && !/[äöü]/.test(n.de))

const pluralGenerators: ItemGenerator[] = [
  G('gram.plurals.pick', 'grammar.plurals', [1, 3], (rng, d) => {
    const n = rng.pick(d === 1 ? EASY_PLURAL : PLURAL_NOUNS)
    if (d === 1) {
      const rest = pickN(rng, others(PLURAL_NOUNS, n), 2)
      return choice({
        rng,
        prompt: `What does ${q(`die ${n.pl}`)} mean?`,
        correct: `the ${enPlural(n)}`,
        wrong: [
          { label: `the ${n.en}`, misconception: 'plural-as-singular', feedback: `That is the singular: ${DEF.nom[n.g]} ${n.de}. die + ${n.pl} is the plural.` },
          ...rest.map((r) => `the ${enPlural(r)}`),
        ],
        hint: 'die can mean "the" for a feminine noun OR for any plural.',
        explanation: `${DEF.nom[n.g]} ${n.de} = the ${n.en}; die ${n.pl} = the ${enPlural(n)}. ${pluralRule(n)}`,
      })
    }
    const wrong = pickN(rng, wrongPlurals(n), 3).map((w) => ({ label: `die ${w.label}`, misconception: 'wrong-plural-pattern', feedback: w.feedback }))
    if (n.g !== 'f' && d === 2) wrong[2] = { label: `${DEF.nom[n.g]} ${n.pl}`, misconception: 'plural-article', feedback: 'Every plural takes die, whatever the gender of the singular.' }
    return choice({
      rng,
      prompt: `What is the plural of ${q(`${DEF.nom[n.g]} ${n.de}`)} (${n.en})?`,
      correct: `die ${n.pl}`,
      wrong,
      hint: 'Plurals in German follow a few patterns: -e, -(e)n, -er, -s, an umlaut, or no change. Say them out loud.',
      explanation: `die ${n.pl}. ${pluralRule(n)}`,
    })
  }),

  G('gram.plurals.match', 'grammar.plurals', [2, 3], (rng) => {
    const four = pickN(rng, PLURAL_NOUNS, 4)
    return matchItem({
      prompt: 'Match each singular noun to its plural.',
      pairs: four.map((n) => ({ left: `${DEF.nom[n.g]} ${n.de}`, right: `die ${n.pl}` })),
      hint: 'Look at the start of each word first, then check the ending.',
      explanation: four.map((n) => `${DEF.nom[n.g]} ${n.de} → die ${n.pl}`).join('; ') + '. Every plural uses die.',
    })
  }),

  G('gram.plurals.type', 'grammar.plurals', [3, 5], (rng, d) => {
    const n = rng.pick(d === 3 ? EASY_PLURAL : d === 5 ? HARD_PLURAL : PLURAL_NOUNS)
    const pl = n.pl ?? n.de
    return textItem({
      prompt: `Type the plural of ${q(`${DEF.nom[n.g]} ${n.de}`)} (${n.en}). You can leave out "die".`,
      accept: accept(pl, `die ${pl}`),
      placeholder: 'Plural',
      hint: `${n.g === 'f' ? 'Most feminine nouns add -(e)n.' : 'Masculine and neuter nouns often add -e or -er, sometimes with an umlaut.'} ${TYPE_HINT}`,
      explanation: `die ${pl}. ${pluralRule(n)}`,
    })
  }),
]

// =================================================================== ein / eine

const INDEF_NOUNS = NOUNS

const indefGenerators: ItemGenerator[] = [
  G('gram.indef.pick', 'grammar.indefinite-article', [1, 3], (rng, d) => {
    const n = rng.pick(INDEF_NOUNS)
    const correct = einForm('ein', 'nom', n.g)
    if (d === 1) {
      return choice({
        rng,
        prompt: `How do you say ${q(fixAn(`a ${n.en}`))} in German?`,
        correct: `${correct} ${n.de}`,
        wrong: [
          { label: `${DEF.nom[n.g]} ${n.de}`, misconception: 'definite-for-indefinite', feedback: `${DEF.nom[n.g]} means "the". "A" is ein or eine.` },
          { label: `${n.g === 'f' ? 'ein' : 'eine'} ${n.de}`, misconception: 'wrong-gender', feedback: `${n.de} is ${GENDER_WORD[n.g]} (${DEF.nom[n.g]} ${n.de}), so "a" is ${correct}.` },
        ],
        hint: `Start from "the": ${DEF.nom[n.g]} ${n.de}.`,
        explanation: `${DEF.nom[n.g]} ${n.de} → ${correct} ${n.de}. der and das words take ein; die words take eine.`,
      })
    }
    const frame = rng.pick(['Das ist ___', 'Hier ist ___', 'Da ist ___'])
    return choice({
      rng,
      prompt: `Choose the word for "a":  ${frame.replace('___', '___ ' + n.de)}.  (${n.en})`,
      correct,
      wrong: [
        { label: n.g === 'f' ? 'ein' : 'eine', misconception: 'wrong-gender', feedback: `${n.de} is ${GENDER_WORD[n.g]}: ${DEF.nom[n.g]} ${n.de}.` },
        { label: 'einen', misconception: 'accusative-for-nominative', feedback: 'einen is only for a masculine object (accusative). After "das ist" you need the nominative.' },
      ],
      keepOrder: false,
      hint: `What is "the ${n.en}"? der and das go to ein, die goes to eine.`,
      explanation: `${DEF.nom[n.g]} ${n.de} is ${GENDER_WORD[n.g]}, so: ${frame.replace('___', `${correct} ${n.de}`)}.`,
    })
  }),

  G('gram.indef.type', 'grammar.indefinite-article', [3, 5], (rng, d) => {
    const n = rng.pick(INDEF_NOUNS)
    const art = einForm('ein', 'nom', n.g)
    if (d === 5) {
      return textItem({
        prompt: `Type the German for ${q(fixAn(`a ${n.en}`))} (with ein or eine).`,
        accept: accept(`${art} ${n.de}`),
        placeholder: 'ein / eine + noun',
        hint: `Think of the article first: is it der, die or das? ${TYPE_HINT}`,
        explanation: `${DEF.nom[n.g]} ${n.de} → ${art} ${n.de} (${GENDER_WORD[n.g]}).`,
      })
    }
    return textItem({
      prompt: `Type ein or eine:  Das ist ___ ${n.de}.  (${n.en})`,
      accept: [art],
      placeholder: 'ein / eine',
      hint: 'Is it der, die or das? That tells you.',
      explanation: `${DEF.nom[n.g]} ${n.de} → Das ist ${art} ${n.de}. Masculine and neuter: ein. Feminine: eine.`,
    })
  }),
]

// =================================================================== accusative

interface AccFrame {
  de: string
  en: string
  cats: Noun['cat'][]
  def: boolean
}

const ACC_FRAMES: AccFrame[] = [
  { de: 'Ich habe', en: 'I have got', cats: ['family', 'pet', 'school', 'thing'], def: false },
  { de: 'Ich kaufe', en: 'I am buying', cats: ['food', 'clothes', 'school', 'thing'], def: true },
  { de: 'Ich sehe', en: 'I can see', cats: ['pet', 'place', 'transport'], def: true },
  { de: 'Ich brauche', en: 'I need', cats: ['school', 'clothes'], def: true },
  { de: 'Wir suchen', en: 'We are looking for', cats: ['place', 'pet', 'school'], def: true },
  { de: 'Er isst', en: 'He is eating', cats: ['food'], def: true },
]

/** People you would not say you "have" or "buy" in a simple drill sentence. */
const ODD_TO_HAVE = ['Kind', 'Baby', 'Sohn', 'Tochter', 'Vater', 'Mutter']

/** "Ich habe" + "the" is unnatural, so frames with def:false only ask for ein. */
function accCase(rng: Parameters<ItemGenerator['generate']>[0], wantDef: boolean | null) {
  const pool = ACC_FRAMES.filter((f) => wantDef !== true || f.def)
  const frame = rng.pick(pool)
  const n = rng.pick(nounsIn(...frame.cats).filter((x) => !ODD_TO_HAVE.includes(x.de)))
  const def = wantDef ?? (frame.def ? rng.chance(0.5) : false)
  return { frame, n, def }
}

const ACC_RULE = 'In the accusative (the object of the verb) only the masculine changes: der → den, ein → einen. die, das and eine stay the same.'

const accusativeGenerators: ItemGenerator[] = [
  G('gram.acc.def-pick', 'grammar.accusative', [1, 3], (rng, d) => {
    const { frame, n } = accCase(rng, true)
    const g = d === 1 ? 'm' : n.g
    const noun = d === 1 ? rng.pick(nounsIn(...frame.cats).filter((x) => x.g === 'm')) ?? n : n
    const correct = DEF.acc[g]
    return choice({
      rng,
      prompt: `Choose the word for "the":  ${frame.de} ___ ${noun.de}.  (${frame.en} the ${noun.en}.)`,
      correct,
      wrong: (['der', 'die', 'das', 'den'] as const)
        .filter((a) => a !== correct)
        .map((a) =>
          a === 'der' && g === 'm'
            ? { label: a, misconception: 'nominative-for-accusative', feedback: `der is the subject form. ${noun.de} is the object here, so masculine der changes to den.` }
            : { label: a, misconception: 'wrong-gender', feedback: `${noun.de} is ${GENDER_WORD[noun.g]} (${DEF.nom[noun.g]} ${noun.de}).` },
        ),
      keepOrder: true,
      hint: `Who is doing the action, and what is it being done to? Is ${noun.de} der, die or das?`,
      explanation: `${noun.de} is the object, so it is in the accusative: ${DEF.nom[noun.g] === correct ? `${correct} stays ${correct}` : `${DEF.nom[noun.g]} → ${correct}`}. ${ACC_RULE}`,
    })
  }),

  G('gram.acc.indef-pick', 'grammar.accusative', [2, 4], (rng, d) => {
    const { frame, n } = accCase(rng, false)
    // Level 4 mixes in nominative sentences so she has to decide which case is needed.
    if (d === 4 && rng.chance(0.4)) {
      const correct = einForm('ein', 'nom', n.g)
      return choice({
        rng,
        prompt: `Choose the word for "a":  Das ist ___ ${n.de}.  (${fixAn(`That is a ${n.en}.`)})`,
        correct,
        wrong: [
          ...(n.g === 'm' ? [{ label: 'einen', misconception: 'accusative-for-nominative', feedback: 'After "das ist" there is no object: the noun is in the nominative, so it stays ein.' }] : []),
          ...['ein', 'eine', 'einen'].filter((x) => x !== correct && !(n.g === 'm' && x === 'einen')),
        ],
        keepOrder: true,
        hint: 'sein (ist) never takes an object. Which case does that leave?',
        explanation: `"Das ist" is followed by the nominative: ${correct} ${n.de}. Only a verb with an object (haben, sehen, kaufen...) needs the accusative.`,
      })
    }
    const correct = einForm('ein', 'acc', n.g)
    return choice({
      rng,
      prompt: `Choose the word for "a":  ${frame.de} ___ ${n.de}.  (${fixAn(`${frame.en} a ${n.en}.`)})`,
      correct,
      wrong: ['ein', 'eine', 'einen']
        .filter((x) => x !== correct)
        .map((x) =>
          x === 'ein' && n.g === 'm'
            ? { label: x, misconception: 'nominative-for-accusative', feedback: `ein is the subject form. ${n.de} is the object, so masculine ein → einen.` }
            : x === 'einen'
              ? { label: x, misconception: 'einen-for-non-masculine', feedback: `einen is only for masculine nouns. ${n.de} is ${GENDER_WORD[n.g]}.` }
              : { label: x, misconception: 'wrong-gender', feedback: `${n.de} is ${GENDER_WORD[n.g]} (${DEF.nom[n.g]} ${n.de}).` },
        ),
      keepOrder: true,
      hint: `Is ${n.de} der, die or das? Then: is it the object?`,
      explanation: `${frame.de} ${correct} ${n.de}. ${ACC_RULE}`,
    })
  }),

  G('gram.acc.type', 'grammar.accusative', [3, 5], (rng, d) => {
    // Level 5: sometimes the noun is the subject (nominative) instead, so she must decide.
    if (d === 5 && rng.chance(0.35)) {
      const n = rng.pick(nounsIn('pet', 'thing', 'clothes'))
      const def = rng.chance(0.5)
      const art = def ? DEF.nom[n.g] : einForm('ein', 'nom', n.g)
      return textItem({
        prompt: `Type the missing word for "${def ? 'the' : 'a'}":  ___ ${n.de} ist neu.  (${fixAn(`${def ? 'The' : 'A'} ${n.en} is new.`)})`,
        accept: [art],
        placeholder: def ? 'der / die / das / den' : 'ein / eine / einen',
        hint: 'Is the noun doing the action (subject) or having it done to it (object)?',
        explanation: `${n.de} is the subject here, so it stays in the nominative: ${cap(art)} ${n.de} ist neu.`,
      })
    }
    const { frame, n, def } = accCase(rng, null)
    const plural = d >= 4 && def && !!n.pl && rng.chance(0.3)
    const art = plural ? 'die' : def ? DEF.acc[n.g] : einForm('ein', 'acc', n.g)
    const noun = plural ? (n.pl as string) : n.de
    const enNoun = plural ? enPlural(n) : n.en
    return textItem({
      prompt: `Type the missing word for "${def ? 'the' : 'a'}":  ${frame.de} ___ ${noun}.  (${fixAn(`${frame.en} ${def ? 'the' : 'a'} ${enNoun}.`)})`,
      accept: [art],
      placeholder: def ? 'der / die / das / den' : 'ein / eine / einen',
      hint: plural ? 'This noun is plural.' : `${n.de} is ${GENDER_WORD[n.g]}. Is it the subject or the object?`,
      explanation: `${frame.de} ${art} ${noun}. ${plural ? 'Plurals use die in the nominative and accusative.' : ACC_RULE}`,
    })
  }),

  G('gram.acc.who', 'grammar.accusative', [4, 5], (rng, d) => {
    const subjects = [
      { de: 'der Lehrer', en: 'the teacher' },
      { de: 'der Vater', en: 'the father' },
      { de: 'der Opa', en: 'grandad' },
      { de: 'mein Bruder', en: 'my brother' },
    ]
    const objects = [
      { de: 'den Hund', nom: 'der Hund', en: 'the dog' },
      { de: 'den Hamster', nom: 'der Hamster', en: 'the hamster' },
      { de: 'den Vogel', nom: 'der Vogel', en: 'the bird' },
    ]
    const verbs = [
      { de: 'sieht', en: 'sees', back: 'sieht' },
      { de: 'sucht', en: 'is looking for', back: 'sucht' },
      { de: 'füttert', en: 'is feeding', back: 'füttert' },
    ]
    const s = rng.pick(subjects)
    const o = rng.pick(objects)
    const v = rng.pick(verbs)
    const objectFirst = d === 5 || rng.chance(0.6)
    const de = objectFirst ? `${cap(o.de)} ${v.de} ${s.de}.` : `${cap(s.de)} ${v.de} ${o.de}.`
    const subjAcc = s.de.replace(/^der /, 'den ').replace(/^mein /, 'meinen ')
    return choice({
      rng,
      prompt: `What does this sentence mean?  ${de}`,
      correct: `${cap(s.en)} ${v.en} ${o.en}.`,
      wrong: [
        { label: `${cap(o.en)} ${v.en} ${s.en}.`, misconception: 'word-order-not-case', feedback: `In German the case shows who does what: ${o.de} is accusative (the object), whatever its position. "${cap(o.nom)} ${v.de} ${subjAcc}" would mean that.` },
      ],
      hint: 'Look at the articles, not the word order: which noun has den (the object)?',
      explanation: `${o.de} is accusative, so it is the object; ${s.de} is nominative, so it is the subject. German can put the object first for emphasis, and the meaning stays the same.`,
    })
  }),
]

// =================================================================== negation

interface NegItem {
  gap: string
  ans: 'nicht' | 'kein' | 'keine' | 'keinen'
  pos: string
  en: string
  /** Other correct negative word orders, for typed answers. */
  alt?: string[]
  /** Typed only when the negative sentence has one clear word order. */
  typed: boolean
}

const NEG: NegItem[] = [
  { gap: 'Das Wetter ist ___ gut.', ans: 'nicht', pos: 'Das Wetter ist gut.', en: 'The weather is not good.', typed: true },
  { gap: 'Ich schwimme ___ gern.', ans: 'nicht', pos: 'Ich schwimme gern.', en: 'I do not like swimming.', typed: true },
  { gap: 'Mia wohnt ___ in Berlin.', ans: 'nicht', pos: 'Mia wohnt in Berlin.', en: 'Mia does not live in Berlin.', typed: true },
  { gap: 'Der Film ist ___ langweilig.', ans: 'nicht', pos: 'Der Film ist langweilig.', en: 'The film is not boring.', typed: true },
  { gap: 'Er kann ___ schwimmen.', ans: 'nicht', pos: 'Er kann schwimmen.', en: 'He cannot swim.', typed: true },
  { gap: 'Das Buch ist ___ teuer.', ans: 'nicht', pos: 'Das Buch ist teuer.', en: 'The book is not expensive.', typed: true },
  { gap: 'Ben spielt ___ gern Tennis.', ans: 'nicht', pos: 'Ben spielt gern Tennis.', en: 'Ben does not like playing tennis.', alt: ['Ben spielt Tennis nicht gern.'], typed: true },
  { gap: 'Ich finde Mathe ___ interessant.', ans: 'nicht', pos: 'Ich finde Mathe interessant.', en: 'I do not find maths interesting.', typed: true },
  { gap: 'Wir gehen heute ___ ins Kino.', ans: 'nicht', pos: 'Wir gehen heute ins Kino.', en: 'We are not going to the cinema today.', typed: false },
  { gap: 'Ich mag den Film ___.', ans: 'nicht', pos: 'Ich mag den Film.', en: 'I do not like the film.', typed: false },
  { gap: 'Ich habe ___ Bruder.', ans: 'keinen', pos: 'Ich habe einen Bruder.', en: 'I have not got a brother.', typed: true },
  { gap: 'Ich habe ___ Zeit.', ans: 'keine', pos: 'Ich habe Zeit.', en: 'I have not got any time.', typed: true },
  { gap: 'Das ist ___ Hund.', ans: 'kein', pos: 'Das ist ein Hund.', en: 'That is not a dog.', typed: true },
  { gap: 'Das ist ___ Katze.', ans: 'keine', pos: 'Das ist eine Katze.', en: 'That is not a cat.', typed: true },
  { gap: 'Wir haben heute ___ Hausaufgaben.', ans: 'keine', pos: 'Wir haben heute Hausaufgaben.', en: 'We have not got any homework today.', typed: true },
  { gap: 'Er isst ___ Fleisch.', ans: 'kein', pos: 'Er isst Fleisch.', en: 'He does not eat meat.', typed: true },
  { gap: 'Lena hat ___ Fahrrad.', ans: 'kein', pos: 'Lena hat ein Fahrrad.', en: 'Lena has not got a bike.', typed: true },
  { gap: 'Es gibt ___ Supermarkt.', ans: 'keinen', pos: 'Es gibt einen Supermarkt.', en: 'There is no supermarket.', typed: true },
  { gap: 'Ich trinke ___ Milch.', ans: 'keine', pos: 'Ich trinke Milch.', en: 'I do not drink milk.', typed: true },
  { gap: 'Ich habe ___ Geschwister.', ans: 'keine', pos: 'Ich habe Geschwister.', en: 'I have not got any brothers or sisters.', typed: true },
]

const NEG_RULE = 'Use kein (with ein-endings: kein, keine, keinen) to negate a noun with ein or no article. Use nicht for everything else: verbs, adjectives, gern, places, and nouns with der/die/das.'

function negWhy(it: NegItem): string {
  if (it.ans === 'nicht') return 'There is no "ein" noun to negate here, so you use nicht.'
  const e = it.ans.slice(4)
  return `The noun has ${/ eine?n? /.test(it.pos) ? 'ein' : 'no article'} in the positive sentence, so you use kein, ${e ? `with the ending -${e}` : 'with no ending'}.`
}

const negationGenerators: ItemGenerator[] = [
  G('gram.neg.choose', 'grammar.negation', [1, 3], (rng, d) => {
    const pool = d === 1 ? NEG.filter((x) => x.ans === 'nicht' || x.ans === 'kein') : NEG
    const it = rng.pick(pool)
    const wrongFb = (o: string) =>
      it.ans === 'nicht'
        ? { label: o, misconception: 'kein-for-nicht', feedback: 'kein only goes with a noun that would have ein or no article. Here you need nicht.' }
        : o === 'nicht'
          ? { label: o, misconception: 'nicht-for-kein', feedback: `This noun has ${/ ein/.test(it.pos) ? 'ein' : 'no article'} in the positive sentence, so it is negated with kein, not nicht.` }
          : { label: o, misconception: 'kein-ending', feedback: 'Right word, wrong ending: kein takes the same endings as ein.' }
    return choice({
      rng,
      prompt: `Make it negative. Fill the gap:  ${it.gap}  (${it.en})`,
      correct: it.ans,
      wrong: others(['nicht', 'kein', 'keine', 'keinen'], it.ans).map(wrongFb),
      keepOrder: true,
      hint: `The positive sentence is: ${it.pos} Is there an "ein" noun, or a noun with no article?`,
      explanation: `${it.gap.replace('___', it.ans)} ${negWhy(it)} ${NEG_RULE}`,
    })
  }),

  G('gram.neg.kein-form', 'grammar.negation', [2, 4], (rng, d) => {
    const frame = rng.pick([
      { de: 'Ich habe', en: 'I have not got', cats: ['pet', 'thing', 'school'] as Noun['cat'][], c: 'acc' as Case },
      { de: 'Wir brauchen', en: 'We do not need', cats: ['school', 'clothes', 'thing'] as Noun['cat'][], c: 'acc' as Case },
      { de: 'Das ist', en: 'That is not', cats: ['pet', 'thing', 'school', 'clothes'] as Noun['cat'][], c: 'nom' as Case },
    ])
    const n = rng.pick(nounsIn(...frame.cats).filter((x) => x.pl))
    const plural = d >= 4 && frame.c === 'acc' && rng.chance(0.35)
    const g: Num = plural ? 'pl' : n.g
    const correct = einForm('kein', frame.c, g)
    const noun = plural ? (n.pl as string) : n.de
    const enObj = plural ? `any ${enPlural(n)}` : fixAn(`a ${n.en}`)
    return choice({
      rng,
      prompt: `Choose the right form of kein:  ${frame.de} ___ ${noun}.  (${frame.en} ${enObj}.)`,
      correct,
      wrong: ['kein', 'keine', 'keinen', 'nicht']
        .filter((x) => x !== correct)
        .map((x) =>
          x === 'nicht'
            ? { label: x, misconception: 'nicht-for-kein', feedback: 'A noun that would have ein (or no article) is negated with kein, not nicht.' }
            : { label: x, misconception: 'kein-ending', feedback: plural ? 'In the plural, kein becomes keine.' : `kein takes the same ending as ein would: ${frame.de} ${einForm('ein', frame.c, g)} ${noun}.` },
        ),
      keepOrder: true,
      hint: `What would "a" be here: ${plural ? 'plural nouns have no ein, but kein takes -e' : `ein, eine or einen`}?`,
      explanation: `${frame.de} ${correct} ${noun}. ${plural ? 'In the plural, kein becomes keine (nominative and accusative).' : `${n.de} is ${GENDER_WORD[n.g]} and ${frame.c === 'acc' ? 'the object (accusative)' : 'after "das ist" (nominative)'}, so ${einForm('ein', frame.c, n.g)} → ${correct}.`}`,
    })
  }),

  G('gram.neg.type', 'grammar.negation', [3, 5], (rng, d) => {
    const pool = NEG.filter((x) => x.typed)
    const it = rng.pick(d === 3 ? pool.filter((x) => x.ans !== 'nicht') : pool)
    const neg = it.gap.replace('___', it.ans)
    return textItem({
      prompt: `Make this sentence negative:  ${it.pos}  (${it.en})`,
      accept: accept(neg, ...(it.alt ?? [])),
      placeholder: 'Type the whole sentence',
      hint: `nicht or kein? ${TYPE_HINT}`,
      explanation: `${neg} ${negWhy(it)}`,
    })
  }),
]

// =================================================================== possessives

interface Owner {
  en: string
  stem: string
}

const OWNERS: Owner[] = [
  { en: 'my', stem: 'mein' },
  { en: 'your, talking to one friend', stem: 'dein' },
  { en: 'his', stem: 'sein' },
  { en: 'her', stem: 'ihr' },
  { en: 'our', stem: 'unser' },
  { en: 'your, talking to two or more friends', stem: 'euer' },
  { en: 'their', stem: 'ihr' },
  { en: 'your, polite (to an adult)', stem: 'Ihr' },
]
const enOwner = (o: Owner) => o.en.split(',')[0] as string
/** "your pen (talking to one friend)" - the bracket removes the dein / euer / Ihr ambiguity. */
const ownerNote = (o: Owner) => (o.en.includes(',') ? ` (${o.en.split(', ')[1]})` : '')
const POSS_NOUNS = nounsIn('family', 'pet', 'school', 'thing', 'clothes')
const POSS_RULE = 'Possessives take the same endings as ein: no ending for masculine and neuter in the nominative, -e for feminine and plural, and -en for a masculine object (accusative).'

const possessiveGenerators: ItemGenerator[] = [
  G('gram.poss.pick', 'grammar.possessives', [1, 3], (rng, d) => {
    if (d === 1) {
      const o = rng.pick(OWNERS.filter((x) => x.stem !== 'Ihr'))
      const stems = ['mein', 'dein', 'sein', 'ihr', 'unser', 'euer']
      return choice({
        rng,
        prompt: `Which German word means ${q(enOwner(o))}${ownerNote(o)}?`,
        correct: o.stem,
        wrong: pickN(rng, others(stems, o.stem), 3),
        hint: 'mein, dein, sein... look like ich, du, er. ihr means both "her" and "their".',
        explanation: `${enOwner(o)} = ${o.stem}. The set: mein (my), dein (your), sein (his), ihr (her), unser (our), euer (your, plural), ihr (their), Ihr (your, polite).`,
      })
    }
    const n = rng.pick(POSS_NOUNS)
    const o = rng.pick(OWNERS.filter((x) => x.stem !== 'Ihr'))
    const correct = einForm(o.stem, 'nom', n.g)
    const wrong = [einForm(o.stem, 'nom', n.g === 'f' ? 'm' : 'f'), einForm(o.stem, 'acc', 'm'), `${o.stem}es`]
      .filter((w) => w !== correct)
      .map((w) => ({ label: w, misconception: 'possessive-ending', feedback: `${n.de} is ${GENDER_WORD[n.g]}: ${DEF.nom[n.g]} ${n.de}, ${einForm('ein', 'nom', n.g)} ${n.de}, so ${correct} ${n.de}.` }))
    return choice({
      rng,
      prompt: `Choose the right word:  Das ist ___ ${n.de}.  (That is ${enOwner(o)} ${n.en}${ownerNote(o)}.)`,
      correct,
      wrong,
      hint: `What would "${fixAn(`a ${n.en}`)}" be? The possessive takes the same ending as ein/eine.`,
      explanation: `Das ist ${correct} ${n.de}. ${POSS_RULE}`,
    })
  }),

  G('gram.poss.match', 'grammar.possessives', [2, 3], (rng) => {
    const pool = OWNERS.filter((o) => o.en !== 'their' && o.stem !== 'Ihr')
    const four = pickN(rng, pool, 4)
    return matchItem({
      prompt: 'Match each English word to its German possessive.',
      pairs: four.map((o) => ({ left: `${enOwner(o)}${ownerNote(o)}`, right: o.stem })),
      hint: 'They look like the pronouns: ich → mein, du → dein, er → sein...',
      explanation: four.map((o) => `${enOwner(o)}${ownerNote(o)} = ${o.stem}`).join('; ') + '.',
    })
  }),

  G('gram.poss.type', 'grammar.possessives', [3, 5], (rng, d) => {
    const n = rng.pick(POSS_NOUNS.filter((x) => x.pl))
    const o = rng.pick(d === 3 ? OWNERS.slice(0, 4) : OWNERS)
    const plural = d === 5 && rng.chance(0.5)
    const g: Num = plural ? 'pl' : n.g
    const correct = einForm(o.stem, 'nom', g)
    const noun = plural ? (n.pl as string) : n.de
    const verb = plural ? 'sind' : 'ist'
    const enNoun = plural ? enPlural(n) : n.en
    return textItem({
      prompt: `Type the missing word:  Das ${verb} ___ ${noun}.  (${plural ? 'Those are' : 'That is'} ${enOwner(o)} ${enNoun}${ownerNote(o)}.)`,
      accept: accept(correct),
      placeholder: 'mein, dein, sein...',
      hint: `${plural ? 'The noun is plural.' : `${n.de} is ${GENDER_WORD[n.g]}.`} Use the same ending as ein${plural ? 'e' : ''} would have.`,
      explanation: `Das ${verb} ${correct} ${noun}. ${POSS_RULE}${o.stem === 'euer' && correct !== 'euer' ? ' Note: euer drops its second e when it gets an ending (eure).' : ''}`,
    })
  }),
]

// =================================================================== possessives in the accusative

const OWNER_OF: { subj: string; slot: 0 | 1 | 2 | 3 | 4 | 5; stem: string; en: string; enSubj: string }[] = [
  { subj: 'ich', slot: 0, stem: 'mein', en: 'my', enSubj: 'I' },
  { subj: 'er', slot: 2, stem: 'sein', en: 'his', enSubj: 'He' },
  { subj: 'Lena', slot: 2, stem: 'ihr', en: 'her', enSubj: 'Lena' },
  { subj: 'mein Bruder', slot: 2, stem: 'sein', en: 'his', enSubj: 'My brother' },
  { subj: 'wir', slot: 3, stem: 'unser', en: 'our', enSubj: 'We' },
  { subj: 'ihr', slot: 4, stem: 'euer', en: 'your', enSubj: 'You (all)' },
  { subj: 'meine Eltern', slot: 5, stem: 'ihr', en: 'their', enSubj: 'My parents' },
]

const POSS_VERBS: { forms: string[]; en: [string, string]; cats: Noun['cat'][] }[] = [
  { forms: ['besuche', 'besuchst', 'besucht', 'besuchen', 'besucht', 'besuchen'], en: ['visit', 'visits'], cats: ['family'] },
  { forms: ['suche', 'suchst', 'sucht', 'suchen', 'sucht', 'suchen'], en: ['are looking for', 'is looking for'], cats: ['school', 'thing', 'clothes', 'pet'] },
  { forms: ['füttere', 'fütterst', 'füttert', 'füttern', 'füttert', 'füttern'], en: ['feed', 'feeds'], cats: ['pet'] },
]

function possAccCase(rng: Parameters<ItemGenerator['generate']>[0], d: number) {
  const ow = rng.pick(OWNER_OF)
  const v = rng.pick(POSS_VERBS)
  const pool = nounsIn(...v.cats).filter((n) => n.pl && n.de !== 'Kind' && n.de !== 'Baby')
  // Lower levels lean on masculine nouns, where the ending actually changes.
  const pool2 = pool.filter((x) => !(ow.subj === 'mein Bruder' && x.de === 'Bruder'))
  const n = rng.pick(d <= 3 && rng.chance(0.6) ? pool2.filter((x) => x.g === 'm') : pool2)
  const plural = d >= 5 && rng.chance(0.3)
  const g: Num = plural ? 'pl' : n.g
  const correct = einForm(ow.stem, 'acc', g)
  const noun = plural ? (n.pl as string) : n.de
  let enVerb = ow.slot === 2 ? v.en[1] : v.en[0]
  if (ow.slot === 0 && enVerb === 'are looking for') enVerb = 'am looking for'
  const de = `${cap(ow.subj)} ${v.forms[ow.slot]} ___ ${noun}.`
  const en = `${ow.enSubj} ${enVerb} ${ow.en} ${plural ? enPlural(n) : n.en}.`
  return { ow, n, g, correct, noun, de, en, plural }
}

const possAccGenerators: ItemGenerator[] = [
  G('gram.possacc.pick', 'grammar.possessive-accusative', [2, 4], (rng, d) => {
    const c = possAccCase(rng, d)
    const nom = einForm(c.ow.stem, 'nom', c.g)
    const wrong = [einForm(c.ow.stem, 'nom', 'm'), einForm(c.ow.stem, 'acc', 'm'), einForm(c.ow.stem, 'acc', 'f'), ...(d >= 4 ? [einForm(c.ow.stem, 'dat', 'm')] : [])]
      .filter((w) => w !== c.correct)
      .map((w) =>
        w === nom
          ? { label: w, misconception: 'nominative-for-accusative', feedback: `That is the subject form. ${c.n.de} is the object, so ${c.g === 'm' ? 'it needs -en' : 'it takes the accusative ending'}.` }
          : w.endsWith('em')
            ? { label: w, misconception: 'dative-for-accusative', feedback: '-em is a dative ending (after mit, zu...). A direct object takes the accusative.' }
            : { label: w, misconception: 'possessive-ending', feedback: `${c.n.de} is ${GENDER_WORD[c.n.g]}${c.plural ? ' (here plural)' : ''}: think of ${c.plural ? 'keine' : einForm('ein', 'acc', c.n.g)} ${c.noun}.` },
      )
    return choice({
      rng,
      prompt: `Choose the right word:  ${c.de}  (${c.en})`,
      correct: c.correct,
      wrong,
      hint: `What would "a" be here: ${c.plural ? 'the noun is plural' : `ein, eine or einen ${c.n.de}`}? The possessive copies that ending.`,
      explanation: `${c.de.replace('___', c.correct)} ${c.n.de} is the object (accusative)${c.plural ? ', and plural' : ` and ${GENDER_WORD[c.n.g]}`}, so ${c.ow.stem} → ${c.correct}. ${POSS_RULE}`,
    })
  }),

  G('gram.possacc.type', 'grammar.possessive-accusative', [3, 5], (rng, d) => {
    const c = possAccCase(rng, d)
    return textItem({
      prompt: `Type the missing possessive:  ${c.de}  (${c.en})`,
      accept: accept(c.correct),
      placeholder: 'meinen, ihre, unser...',
      hint: `Which possessive means "${c.ow.en}"? Then: is ${c.n.de} masculine, feminine or neuter${d >= 5 ? ', or plural' : ''}?`,
      explanation: `${c.de.replace('___', c.correct)} ${POSS_RULE}${c.ow.stem === 'euer' && c.correct !== 'euer' ? ' euer drops its second e before an ending: euren, eure.' : ''}`,
    })
  }),
]

export const nounGenerators: ItemGenerator[] = [
  ...pluralGenerators,
  ...indefGenerators,
  ...accusativeGenerators,
  ...negationGenerators,
  ...possessiveGenerators,
  ...possAccGenerators,
]

