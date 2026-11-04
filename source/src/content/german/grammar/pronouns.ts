import type { ItemGenerator } from '@/engine/registry'
import { choice, generatorFor, matchItem, textItem } from '../../kit'
import { cap, DEF, GENDER_WORD, NOUNS, pickN, q, type Gen, type Noun } from './data'

const G = generatorFor('german')

// =================================================================== personal pronouns (nominative)

interface PronPerson {
  de: string
  en: string
  /** Present tense of spielen for this person, used after inversion so the pronoun is mid-sentence. */
  spielen: string
}

const PRON: PronPerson[] = [
  { de: 'ich', en: 'I', spielen: 'spiele' },
  { de: 'du', en: 'you - talking to one friend', spielen: 'spielst' },
  { de: 'er', en: 'he', spielen: 'spielt' },
  { de: 'sie', en: 'she', spielen: 'spielt' },
  { de: 'wir', en: 'we', spielen: 'spielen' },
  { de: 'ihr', en: 'you - talking to two or more friends', spielen: 'spielt' },
  { de: 'sie', en: 'they', spielen: 'spielen' },
  { de: 'Sie', en: 'you - polite, to an adult', spielen: 'spielen' },
]

const PRON_RULE = 'ich (I), du (you, one friend), er (he), sie (she), es (it), wir (we), ihr (you, several friends), sie (they), Sie (you, polite - always with a capital S).'

const PRON_FEEDBACK: Record<string, string> = {
  Sie: 'Sie with a capital S is the polite "you", for adults you do not know well.',
  sie: 'sie (small s) means "she" or "they".',
  du: 'du is "you" for one friend or family member.',
  ihr: 'ihr is "you" for two or more friends.',
  er: 'er means "he" (or "it" for a masculine noun).',
  es: 'es means "it" for a neuter noun.',
  wir: 'wir means "we".',
  ich: 'ich means "I".',
}

/** A pronoun that refers to a noun: by grammatical gender, not by meaning. */
const REPLACE_NOUNS = NOUNS.filter((n) => n.cat !== 'family' && n.pl)
const PRED: Record<Noun['cat'], string[]> = {
  family: ['nett'],
  pet: ['alt', 'klein', 'süß', 'sehr laut'],
  school: ['neu', 'alt', 'auf dem Tisch'],
  home: ['groß', 'neu', 'alt'],
  thing: ['neu', 'kaputt', 'toll'],
  media: ['lustig', 'langweilig', 'neu'],
  food: ['lecker', 'frisch'],
  clothes: ['neu', 'schön', 'zu klein'],
  place: ['groß', 'modern', 'alt'],
  transport: ['neu', 'alt', 'schnell'],
}
const pron3 = (g: Gen | 'pl') => (g === 'm' ? 'Er' : g === 'n' ? 'Es' : 'Sie')

function replaceCase(rng: Parameters<ItemGenerator['generate']>[0], allowPlural: boolean) {
  const n = rng.pick(REPLACE_NOUNS)
  const plural = allowPlural && rng.chance(0.25)
  const pred = rng.pick(PRED[n.cat])
  const subj = plural ? `Die ${n.pl}` : `${cap(DEF.nom[n.g])} ${n.de}`
  const verb = plural ? 'sind' : 'ist'
  const answer = plural ? 'Sie' : pron3(n.g)
  return { n, plural, sentence: `${subj} ${verb} ${pred}.`, gap: `___ ${verb} ${pred}.`, answer, full: `${answer} ${verb} ${pred}.` }
}

const replaceRule = (n: Noun, plural: boolean) =>
  plural ? 'A plural noun becomes sie (they).' : `${n.de} is ${GENDER_WORD[n.g]} (${DEF.nom[n.g]} ${n.de}), so "it" is ${pron3(n.g).toLowerCase()}: der → er, die → sie, das → es. German uses the grammatical gender even for things.`

const personalGenerators: ItemGenerator[] = [
  G('gram.pron.english', 'grammar.personal-pronouns', [1, 3], (rng, d) => {
    const p = rng.pick(d === 1 ? PRON.filter((x) => !x.en.includes('-')) : PRON)
    // sie and Sie are never offered against each other at level 1, where there is no sentence to tell them apart.
    const distract = PRON.filter((x) => x.de !== p.de && !(d === 1 && x.de.toLowerCase() === p.de.toLowerCase())).map((x) => x.de)
    const wrong = pickN(rng, [...new Set(distract)], 3).map((w) => ({ label: w, misconception: 'wrong-pronoun', feedback: PRON_FEEDBACK[w] ?? '' }))
    if (d === 1) {
      return choice({
        rng,
        prompt: `Which German pronoun means ${q(p.en)}?`,
        correct: p.de,
        wrong,
        hint: 'Think of how you would start a sentence about this person.',
        explanation: PRON_RULE,
      })
    }
    return choice({
      rng,
      prompt: `Fill the gap:  Heute ${p.spielen} ___ Tennis.  (${p.en})`,
      correct: p.de,
      wrong,
      hint: `Check the verb ending too: ${p.spielen}.`,
      explanation: `Heute ${p.spielen} ${p.de} Tennis. ${PRON_RULE}`,
    })
  }),

  G('gram.pron.replace', 'grammar.personal-pronouns', [2, 4], (rng, d) => {
    const c = replaceCase(rng, d >= 3)
    return choice({
      rng,
      prompt: `Replace the noun with a pronoun:  ${c.sentence}  →  ${c.gap}`,
      correct: c.answer,
      wrong: ['Er', 'Sie', 'Es']
        .filter((x) => x !== c.answer)
        .map((x) => ({ label: x, misconception: 'pronoun-gender', feedback: replaceRule(c.n, c.plural) })),
      keepOrder: true,
      hint: c.plural ? 'Is the noun singular or plural?' : `Look at the article: ${DEF.nom[c.n.g]}.`,
      explanation: `${c.full} ${replaceRule(c.n, c.plural)}`,
    })
  }),

  G('gram.pron.type', 'grammar.personal-pronouns', [3, 5], (rng, d) => {
    if (d >= 4 && rng.chance(0.5)) {
      // Not polite Sie: the judge ignores capitals, so typed Sie and sie cannot be told apart.
      const p = rng.pick(PRON.filter((x) => (x.en.includes('-') && x.de !== 'Sie') || x.de === 'sie'))
      return textItem({
        prompt: `Type the pronoun:  Heute ${p.spielen} ___ Tennis.  (${p.en})`,
        accept: [p.de],
        placeholder: 'Pronoun',
        hint: 'Which "you" is it: one friend, several friends, or polite?',
        explanation: `Heute ${p.spielen} ${p.de} Tennis. ${PRON_RULE}`,
      })
    }
    const c = replaceCase(rng, d >= 4)
    return textItem({
      prompt: `Type the pronoun that replaces the noun:  ${c.sentence}  →  ${c.gap}`,
      accept: [c.answer],
      placeholder: 'er / sie / es',
      hint: c.plural ? 'Singular or plural?' : `What is the article of ${c.n.de}?`,
      explanation: `${c.full} ${replaceRule(c.n, c.plural)}`,
    })
  }),
]

// =================================================================== accusative pronouns

interface AccPron {
  nom: string
  acc: string
  en: string
}

const ACC_PRON: AccPron[] = [
  { nom: 'ich', acc: 'mich', en: 'me' },
  { nom: 'du', acc: 'dich', en: 'you - one friend' },
  { nom: 'er', acc: 'ihn', en: 'him' },
  { nom: 'sie', acc: 'sie', en: 'her' },
  { nom: 'wir', acc: 'uns', en: 'us' },
  { nom: 'ihr', acc: 'euch', en: 'you - several friends' },
  { nom: 'sie', acc: 'sie', en: 'them' },
  { nom: 'Sie', acc: 'Sie', en: 'you - polite' },
]

/** Sentence frames with an accusative object slot. `not` = the subject's own pronoun (that would be reflexive). */
const ACC_FRAMES: { de: string; en: string; not?: string }[] = [
  { de: 'Lena besucht ___ am Wochenende.', en: 'Lena is visiting X at the weekend.' },
  { de: 'Mein Opa ruft ___ jeden Tag an.', en: 'My grandad phones X every day.' },
  { de: 'Der Lehrer fragt ___.', en: 'The teacher is asking X.' },
  { de: 'Das Geschenk ist für ___.', en: 'The present is for X.' },
  { de: 'Ich sehe ___ morgen.', en: 'I will see X tomorrow.', not: 'mich' },
  { de: 'Wir brauchen ___.', en: 'We need X.', not: 'uns' },
  { de: 'Ben kennt ___ nicht.', en: 'Ben does not know X.' },
  { de: 'Ich finde ___ sehr nett.', en: 'I find X very nice.', not: 'mich' },
]

const ACC_PRON_RULE = 'Object pronouns (accusative): mich, dich, ihn, sie, es, uns, euch, sie, Sie. Only ich, du, er, wir and ihr change; sie, es and Sie stay the same.'

const ACC_OBJ_NOUNS = NOUNS.filter((n) => ['school', 'thing', 'clothes', 'media', 'pet'].includes(n.cat))

function accPronCase(rng: Parameters<ItemGenerator['generate']>[0], d: number) {
  if (d >= 3 && rng.chance(0.45)) {
    // Replace a noun object: Ich kaufe den Rucksack → Ich kaufe ihn.
    const n = rng.pick(ACC_OBJ_NOUNS)
    const verb = n.cat === 'pet' ? 'Ich füttere' : n.cat === 'media' ? 'Ich mag' : 'Ich suche'
    const answer = n.g === 'm' ? 'ihn' : n.g === 'f' ? 'sie' : 'es'
    return {
      prompt: `Replace the object with a pronoun:  ${verb} ${DEF.acc[n.g]} ${n.de}.  →  ${verb} ___.`,
      answer,
      sentence: `${verb} ${answer}.`,
      why: `${DEF.nom[n.g]} ${n.de} is ${GENDER_WORD[n.g]}, so "it" as an object is ${answer}${n.g === 'm' ? ' (er → ihn)' : ''}.`,
      cue: n.g,
    }
  }
  const p = rng.pick(ACC_PRON)
  const frame = rng.pick(ACC_FRAMES.filter((f) => f.not !== p.acc))
  return {
    prompt: `Fill the gap:  ${frame.de}  (${frame.en.replace('X', p.en.split(' - ')[0] as string)})${p.en.includes(' - ') ? `  ["you" here: ${p.en.split(' - ')[1]}]` : ''}`,
    answer: p.acc,
    sentence: frame.de.replace('___', p.acc),
    why: `"${p.en.split(' - ')[0]}" as an object is ${p.acc} (${p.nom} → ${p.acc}).`,
    cue: p.nom,
  }
}

const accPronGenerators: ItemGenerator[] = [
  G('gram.accpron.match', 'grammar.accusative-pronouns', [1, 2], (rng) => {
    const pool = ACC_PRON.filter((p) => ['ich', 'du', 'er', 'wir', 'ihr'].includes(p.nom))
    const four = pickN(rng, pool, 4)
    return matchItem({
      prompt: 'Match each subject pronoun to its object (accusative) form.',
      pairs: four.map((p) => ({ left: p.nom, right: p.acc })),
      hint: 'Think of "I see him": er becomes...?',
      explanation: ACC_PRON_RULE,
    })
  }),

  G('gram.accpron.pick', 'grammar.accusative-pronouns', [2, 4], (rng, d) => {
    const c = accPronCase(rng, d)
    const all = ['mich', 'dich', 'ihn', 'sie', 'es', 'uns', 'euch', 'er', 'ich', 'du', 'ihm', 'Sie']
    const fb = (w: string) =>
      ['er', 'ich', 'du'].includes(w)
        ? { label: w, misconception: 'nominative-pronoun', feedback: `${w} is the subject form. As the object it changes.` }
        : w === 'ihm'
          ? { label: w, misconception: 'dative-pronoun', feedback: 'ihm is the dative (to him). A direct object needs the accusative: ihn.' }
          : { label: w, misconception: 'wrong-pronoun', feedback: `${w} is a different person.` }
    const near = c.answer === 'ihn' ? ['er', 'ihm', 'sie'] : c.answer === 'mich' ? ['ich', 'dich', 'uns'] : c.answer === 'dich' ? ['du', 'mich', 'euch'] : pickN(rng, all.filter((x) => x !== c.answer), 3)
    return choice({
      rng,
      prompt: c.prompt,
      correct: c.answer,
      wrong: near.filter((x) => x !== c.answer).map(fb),
      hint: 'The pronoun is the object here (it has the action done to it).',
      explanation: `${c.sentence} ${c.why} ${ACC_PRON_RULE}`,
    })
  }),

  G('gram.accpron.type', 'grammar.accusative-pronouns', [3, 5], (rng, d) => {
    const c = accPronCase(rng, d)
    return textItem({
      prompt: c.prompt.replace('Fill the gap', 'Type the missing pronoun'),
      accept: [c.answer],
      placeholder: 'mich, dich, ihn...',
      hint: 'Object pronouns: mich, dich, ihn, sie, es, uns, euch, sie, Sie.',
      explanation: `${c.sentence} ${c.why}`,
    })
  }),
]

export const pronounGenerators: ItemGenerator[] = [...personalGenerators, ...accPronGenerators]
