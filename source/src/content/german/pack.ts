import type { ItemGenerator, SubjectPack } from '@/engine/registry'
import type { Skill } from '@/engine/types'
import { choice, generatorFor, matchItem, textItem } from '../kit'
import { grammarGenerators, grammarSkills } from './grammar'
import { topicGenerators, topicSkills } from './topics'
import { ENDING_WORDS, HABEN, REGULAR_VERBS, SEIN, SUBJECTS, TOPICS, TRICKY_VERBS, type Gender, type Sentence, type VerbForm, type Word } from './vocab'

export const GERMAN_VERSION = '1.0.0'

const G = generatorFor('german')

// ------------------------------------------------------------------- skills

const S = (id: string, year: number, strand: string, name: string, description: string, prereqs: string[]): Skill => ({
  id: `german.${id}`,
  subject: 'german',
  year,
  strand,
  name,
  description,
  prereqs: prereqs.map((p) => `german.${p}`),
  origin: 'syllabus',
})

export const germanSkills: Skill[] = [
  S('vocab.greetings', 7, 'Vocabulary', 'Greetings and polite phrases', 'Say hello and goodbye, and be polite in German.', []),
  S('vocab.numbers', 7, 'Vocabulary', 'Numbers 1 to 12, and 20', 'Recognise and write the German numbers.', []),
  S('vocab.family', 7, 'Vocabulary', 'Family members', 'Name family members, with their articles.', ['vocab.greetings']),
  S('vocab.animals', 7, 'Vocabulary', 'Pets and animals', 'Name common pets and animals, with their articles.', ['vocab.greetings']),
  S('vocab.school', 7, 'Vocabulary', 'School and classroom', 'Name school objects and people, with their articles.', ['vocab.greetings']),
  S('vocab.food', 8, 'Vocabulary', 'Food and drink', 'Name everyday food and drink, with their articles.', ['vocab.family']),
  S('grammar.articles', 7, 'Grammar', 'der, die, das', 'Choose the right word for "the" for masculine, feminine and neuter nouns.', ['vocab.family']),
  S('grammar.sein-haben', 7, 'Grammar', 'sein and haben', 'Use "to be" and "to have" with every person.', ['vocab.greetings']),
  S('grammar.regular-verbs', 8, 'Grammar', 'Regular verbs in the present tense', 'Build present-tense forms from the stem: ich spiele, du spielst...', ['grammar.sein-haben']),
]

// -------------------------------------------------------------- helpers

const quote = (s: string) => `"${s}"`
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const de = (w: Word, article: boolean) => (article && w.gender ? `${w.gender} ${w.de}` : w.de)
const en = (w: Word, kind: string) => (kind === 'noun' ? `the ${w.en}` : w.en)
const others = <T,>(list: T[], not: T) => list.filter((x) => x !== not)

// ----------------------------------------------------------- vocabulary

function vocabGenerators(topic: string): ItemGenerator[] {
  const t = TOPICS[topic]
  if (!t) throw new Error(`Unknown topic ${topic}`)
  const { kind, words } = t
  const skill = `vocab.${topic}`
  const gendered = kind === 'noun'
  const askDe = (w: Word) => (kind === 'number' ? `What number is ${quote(de(w, true))}?` : `What does ${quote(de(w, true))} mean?`)
  const askEn = (w: Word) =>
    kind === 'number' ? `How do you write the number ${w.en} in German?` : `How do you say ${quote(en(w, kind))} in German?`

  return [
    G(`vocab.${topic}.recognise`, skill, [1, 2], (rng, d) => {
      const w = rng.pick(words)
      const rest = rng.shuffle(others(words, w)).slice(0, 3)
      if (d === 1) {
        return choice({
          rng,
          prompt: askDe(w),
          correct: en(w, kind),
          wrong: rest.map((x) => en(x, kind)),
          hint: `It starts with the sound of "${w.de.charAt(0)}"...`,
          explanation: `${de(w, true)} means ${en(w, kind)}.`,
        })
      }
      return choice({
        rng,
        prompt: askEn(w),
        correct: de(w, true),
        wrong: rest.map((x) => de(x, true)),
        hint: `The German starts with "${w.de.charAt(0)}".`,
        explanation: `${en(w, kind)} is ${de(w, true)} in German.`,
      })
    }),

    G(`vocab.${topic}.match`, skill, [2, 3], (rng) => {
      const four = rng.shuffle(words).slice(0, 4)
      return matchItem({
        prompt: 'Match each German word to its English meaning.',
        pairs: four.map((w) => ({ left: de(w, true), right: en(w, kind) })),
        hint: 'Start with the ones you are sure about.',
        explanation: four.map((w) => `${de(w, true)} = ${en(w, kind)}`).join(', '),
      })
    }),

    G(`vocab.${topic}.write`, skill, [3, 5], (rng, d) => {
      const w = rng.pick(words)
      const withArticle = gendered && d >= 4
      const accept = gendered && !withArticle ? [de(w, false), de(w, true)] : [de(w, withArticle)]
      return textItem({
        prompt: `Type the German for ${quote(en(w, kind))}${withArticle ? ', including der / die / das' : ''}.`,
        accept,
        placeholder: 'Type in German',
        hint: `It starts with "${w.de.charAt(0)}" and the word has ${w.de.length} letters.`,
        explanation: `${en(w, kind)} is ${de(w, gendered)} in German.`,
      })
    }),
  ]
}

// ----------------------------------------------------------- articles

const GENDERED: Word[] = ['family', 'animals', 'school', 'food'].flatMap((k) => TOPICS[k]?.words ?? []).filter((w) => w.gender)
const ARTICLES: Gender[] = ['der', 'die', 'das']
const GENDER_NAME: Record<Gender, string> = { der: 'masculine', die: 'feminine', das: 'neuter' }

const articleGenerators: ItemGenerator[] = [
  G('articles.pick', 'grammar.articles', [1, 3], (rng) => {
    const w = rng.pick(GENDERED)
    const g = w.gender as Gender
    return choice({
      rng,
      prompt: `Which word for "the" goes with ${quote(w.de)} (${w.en})?`,
      correct: g,
      wrong: others(ARTICLES, g),
      keepOrder: true,
      hint: 'Every German noun is masculine (der), feminine (die) or neuter (das). You have to learn it with the word.',
      explanation: `${w.de} is ${GENDER_NAME[g]}: ${g} ${w.de}.`,
    })
  }),
  G('articles.type', 'grammar.articles', [3, 5], (rng) => {
    const w = rng.pick(GENDERED)
    const g = w.gender as Gender
    return textItem({
      prompt: `Fill the gap with der, die or das:  ___ ${w.de}  (the ${w.en})`,
      accept: [g],
      placeholder: 'der / die / das',
      hint: 'Think of the whole phrase, e.g. "der Hund", and say it out loud.',
      explanation: `${g} ${w.de}. (${cap(GENDER_NAME[g])}.)`,
    })
  }),
  G('articles.endings', 'grammar.articles', [4, 5], (rng) => {
    const w = rng.pick(ENDING_WORDS)
    return choice({
      rng,
      prompt: `Use the ending to work out the article:  ___ ${w.de}`,
      correct: w.gender,
      wrong: others(ARTICLES, w.gender),
      keepOrder: true,
      hint: 'Look at how the word ends. Some endings always give the same gender.',
      explanation: `${w.rule} So: ${w.gender} ${w.de}.`,
    })
  }),
]

// ------------------------------------------------------- sein / haben

const seinHabenGenerators: ItemGenerator[] = [
  G('seinhaben.pick', 'grammar.sein-haben', [1, 3], (rng) => {
    const verb = rng.chance(0.5) ? { name: 'sein', list: SEIN } : { name: 'haben', list: HABEN }
    const s: Sentence = rng.pick(verb.list)
    const forms = verb.list.map((x) => x.form)
    const wrong = rng.shuffle(others(forms, s.form)).slice(0, 3)
    return choice({
      rng,
      prompt: `Choose the right form of ${quote(verb.name)}:  ${s.subject} ___ ${s.rest}.`,
      correct: s.form,
      wrong,
      hint: `In English: ${s.en}.`,
      explanation: `${s.subject} ${s.form} ${s.rest}. (${s.en}.)`,
    })
  }),
  G('seinhaben.write', 'grammar.sein-haben', [3, 5], (rng) => {
    const verb = rng.chance(0.5) ? { name: 'sein', list: SEIN } : { name: 'haben', list: HABEN }
    const s: Sentence = rng.pick(verb.list)
    return textItem({
      prompt: `Type the missing form of ${quote(verb.name)}:  ${s.subject} ___ ${s.rest}.`,
      accept: [s.form],
      placeholder: 'Type the verb',
      hint: `In English: ${s.en}.`,
      explanation: `${s.subject} ${s.form} ${s.rest}. (${s.en}.)`,
    })
  }),
]

// ---------------------------------------------------- regular verbs

/** Present-tense form for a subject. */
function conjugate(v: VerbForm, slot: (typeof SUBJECTS)[number]['slot'], end: string): string {
  if (v.eInsert && (slot === 'du' || slot === 'er' || slot === 'ihr')) return `${v.stem}e${end}`
  if (v.sibilant && slot === 'du') return `${v.stem}t`
  return `${v.stem}${end}`
}

const verbGenerators: ItemGenerator[] = [
  G('verbs.pick', 'grammar.regular-verbs', [1, 3], (rng) => {
    const v = rng.pick(REGULAR_VERBS)
    const sub = rng.pick(SUBJECTS)
    const correct = conjugate(v, sub.slot, sub.end)
    const wrong = ['e', 'st', 't', 'en'].map((e) => `${v.stem}${e}`)
    return choice({
      rng,
      prompt: `Choose the right verb:  ${sub.s} ___ ${v.rest}.  (${v.inf} = to ${v.en})`,
      correct,
      wrong,
      hint: `Take the stem "${v.stem}-" and add the ending for ${sub.s.toLowerCase()}.`,
      explanation: `${sub.s} ${correct} ${v.rest}. Stem ${v.stem}- + -${correct.slice(v.stem.length)}.`,
    })
  }),
  G('verbs.write', 'grammar.regular-verbs', [3, 5], (rng, d) => {
    const v = rng.pick(d >= 5 ? [...REGULAR_VERBS, ...TRICKY_VERBS] : REGULAR_VERBS)
    const sub = rng.pick(SUBJECTS)
    const correct = conjugate(v, sub.slot, sub.end)
    const special = v.eInsert
      ? 'Stems ending in -t add an extra -e- before -st and -t (du arbeitest, er arbeitet).'
      : v.sibilant
        ? 'When the stem ends in -z, "du" just adds -t (du tanzt).'
        : ''
    return textItem({
      prompt: `Type the verb in the present tense:  ${sub.s} ___ ${v.rest}.  (${v.inf} = to ${v.en})`,
      accept: [correct],
      placeholder: 'Type the verb',
      hint: `Stem: ${v.stem}-. Which ending goes with ${sub.s.toLowerCase()}?`,
      explanation: `${sub.s} ${correct} ${v.rest}. ${special}`.trim(),
    })
  }),
]

// --------------------------------------------------------------- pack

export const germanPack: SubjectPack = {
  id: 'german',
  name: 'German',
  tagline: 'Words, grammar, reading and culture',
  color: '#ff8fab',
  version: GERMAN_VERSION,
  // The original starter skills (kept: progress is stored against their ids), then the KS3 topics and grammar parts.
  skills: [...germanSkills, ...topicSkills, ...grammarSkills],
  generators: [...Object.keys(TOPICS).flatMap(vocabGenerators), ...articleGenerators, ...seinHabenGenerators, ...verbGenerators, ...topicGenerators, ...grammarGenerators],
}
