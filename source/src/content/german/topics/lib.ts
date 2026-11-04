/**
 * Shared helpers for the German Topics part (vocabulary, reading, translation, sounds and spelling, culture).
 * Everything here is data-driven: a topic file is mostly word lists and sentence records, and these factories turn
 * them into generators.
 */
import type { ItemGenerator } from '@/engine/registry'
import type { Figure, ItemBody, Rng } from '@/engine/types'
import { choice, generatorFor, matchItem, orderItem, passage, reveal, textItem } from '../../kit'

export const G = generatorFor('german')

export type Gender = 'der' | 'die' | 'das'
export type Wrong = string | { label: string; misconception?: string; feedback?: string }

/** A vocabulary entry. `g` is the gender for nouns ('pl' = a plural noun, which takes "die"). */
export interface W {
  de: string
  en: string
  g?: Gender | 'pl'
  /** Other spellings or synonyms accepted when typing (without the article). */
  alt?: string[]
  /** A memory aid or note, shown in the explanation. */
  tip?: string
}

export const q = (s: string) => `"${s}"`
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export const pickN = <T>(rng: Rng, list: T[], n: number): T[] => rng.shuffle(list).slice(0, n)
export const others = <T>(list: T[], not: T): T[] => list.filter((x) => x !== not)

/** The word for "the" in front of a noun (plurals take "die"). */
export const art = (w: W): string => (w.g === 'pl' ? 'die' : (w.g ?? ''))
/** German with its article, e.g. "der Rock". */
export const withArt = (w: W): string => (w.g ? `${art(w)} ${w.de}` : w.de)
/** How a word is shown in questions: with its article, and "(plural)" for plural nouns. */
export const show = (w: W): string => (w.g === 'pl' ? `${withArt(w)} (plural)` : withArt(w))

const GENDER_NOTE: Record<Gender | 'pl', string> = {
  der: 'It is masculine (der).',
  die: 'It is feminine (die).',
  das: 'It is neuter (das).',
  pl: 'It is plural, so it takes die.',
}
export const genderNote = (w: W): string => (w.g ? GENDER_NOTE[w.g] : '')
/** Add a full stop unless the text already ends with . ! ? or ... */
export const stop = (s: string): string => (/[.!?]$/.test(s) ? s : `${s}.`)
/** Join sentence parts, skipping empty ones (no double spaces). */
export const join = (...parts: (string | undefined)[]): string => parts.map((p) => (p ?? '').trim()).filter(Boolean).join(' ')

/** Spell umlauts and ß the way you type them without a German keyboard: ä -> ae, ß -> ss. */
export const translit = (s: string): string =>
  s
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae')
    .replace(/Ö/g, 'Oe')
    .replace(/Ü/g, 'Ue')
    .replace(/ß/g, 'ss')

const hasSpecial = (s: string) => /[äöüÄÖÜß]/.test(s)
export const keyboardTip = (s: string): string =>
  hasSpecial(s) ? ' (No German keyboard? Type ae, oe, ue for ä, ö, ü and ss for ß.)' : ''

/**
 * Accepted typed answers: each form as written, with ae/oe/ue/ss instead of ä/ö/ü/ß, and without commas.
 * (The judge already ignores capital letters, extra spaces and a full stop at the end.)
 */
export function accepts(...forms: string[]): string[] {
  const out: string[] = []
  const add = (s: string) => {
    const t = s.trim().replace(/\s+/g, ' ')
    if (t && !out.includes(t)) out.push(t)
  }
  for (const f of forms) {
    const noComma = f.replace(/,/g, '')
    for (const v of [f, translit(f), noComma, translit(noComma)]) add(v)
  }
  return out
}

/** Longest word of a phrase: the "key" word for hints. */
const keyWord = (s: string) => s.split(/\s+/).reduce((a, b) => (b.replace(/[^\p{L}]/gu, '').length > a.replace(/[^\p{L}]/gu, '').length ? b : a), '')

/** Unique by a key (keeps the first). */
export function uniqueBy<T>(list: T[], key: (x: T) => string): T[] {
  const seen = new Set<string>()
  return list.filter((x) => {
    const k = key(x)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/**
 * Three vocabulary generators for one word list:
 *  - recognise (L1-2): German -> English at 1, English -> German at 2 (multiple choice)
 *  - match (L2-3): pair 4 (or 5) German words with English
 *  - write (L3-5): type the German; nouns need their article from level 4
 */
export function vocabGens(id: string, skill: string, words: W[], topic: string): ItemGenerator[] {
  return [
    G(`top.${id}.recognise`, skill, [1, 2], (rng, d) => {
      const w = rng.pick(words)
      const rest = pickN(rng, others(words, w), 3)
      if (d <= 1) {
        return choice({
          rng,
          prompt: `What does ${q(show(w))} mean?`,
          correct: w.en,
          wrong: rest.map((x) => x.en),
          hint: `Topic: ${topic}. Rule out the options you are sure about first.`,
          explanation: join(/[.!?]$/.test(w.en) ? `${withArt(w)} means "${w.en}"` : `${withArt(w)} means "${w.en}".`, genderNote(w), w.tip),
        })
      }
      return choice({
        rng,
        prompt: `How do you say ${q(w.en)} in German?`,
        correct: show(w),
        wrong: rest.map(show),
        hint: `The key German word starts with "${keyWord(w.de).slice(0, 2)}".`,
        explanation: join(`"${w.en}" is ${stop(withArt(w))}`, genderNote(w), w.tip),
      })
    }),

    G(`top.${id}.match`, skill, [2, 3], (rng, d) => {
      const set = pickN(rng, words, d >= 3 && words.length >= 6 ? 5 : 4)
      return matchItem({
        prompt: 'Match each German word or phrase to its English meaning.',
        pairs: set.map((w) => ({ left: show(w), right: w.en })),
        hint: `Topic: ${topic}. Start with the ones you are sure about.`,
        explanation: set.map((w) => `${withArt(w)} = ${w.en}`).join('; '),
      })
    }),

    G(`top.${id}.write`, skill, [3, 5], (rng, d) => {
      const w = rng.pick(words)
      const needArt = !!w.g && d >= 4
      const bare = [w.de, ...(w.alt ?? [])]
      const forms = needArt ? bare.map((b) => `${art(w)} ${b}`) : w.g ? [...bare, ...bare.map((b) => `${art(w)} ${b}`)] : bare
      const words_ = w.de.split(/\s+/).length
      return textItem({
        prompt: `Type the German for ${q(w.en)}${needArt ? ', with its word for "the" (der, die or das)' : ''}.`,
        accept: accepts(...forms),
        placeholder: 'Type in German',
        hint:
          words_ > 1
            ? `${words_} words, starting with "${w.de.charAt(0)}".`
            : `It starts with "${w.de.charAt(0)}" and has ${w.de.length} letters.`,
        explanation: join(`"${w.en}" is ${stop(withArt(w))}`, genderNote(w), w.tip, keyboardTip(w.de)),
      })
    }),
  ]
}

/** A gap-fill sentence. `de` contains ___ where the answer goes. */
export interface Gap {
  de: string
  answer: string
  wrong: Wrong[]
  en: string
  why: string
  /** Other typed answers that are also right. */
  alt?: string[]
  /** false = recognition only (the typed version would have more than one right answer). */
  typed?: boolean
  /** An English cue shown with the multiple-choice prompt when the gap is otherwise open, e.g. "(short)". */
  cue?: string
}

export const fill = (de: string, answer: string) => de.replace('___', answer)

/** Gap-fill: choose the missing word (pick levels), then type it (type levels). */
export function gapGens(id: string, skill: string, gaps: Gap[], pick: [number, number], type?: [number, number]): ItemGenerator[] {
  const gens: ItemGenerator[] = [
    G(`top.${id}.pick`, skill, pick, (rng) => {
      const g = rng.pick(gaps)
      return choice({
        rng,
        prompt: `Choose the missing word${g.answer.includes(' ') ? 's' : ''}:  ${g.de}${g.cue ? `  (${g.cue})` : ''}`,
        correct: g.answer,
        wrong: g.wrong,
        hint: `In English: ${g.en}`,
        explanation: `${fill(g.de, g.answer)} (${g.en}) ${g.why}`,
      })
    }),
  ]
  const typable = gaps.filter((g) => g.typed !== false)
  if (type && typable.length) {
    gens.push(
      G(`top.${id}.type`, skill, type, (rng) => {
        const g = rng.pick(typable)
        return textItem({
          prompt: `Type the missing word${g.answer.includes(' ') ? 's' : ''}:  ${g.de}   (${g.en})`,
          accept: accepts(g.answer, ...(g.alt ?? [])),
          placeholder: 'Type the missing word',
          hint: `It starts with "${g.answer.charAt(0)}".`,
          explanation: `${fill(g.de, g.answer)} ${g.why}${keyboardTip(g.answer)}`,
        })
      }),
    )
  }
  return gens
}

/** A German sentence with its meaning and plausible wrong meanings. */
export interface Sent {
  de: string
  en: string
  wrong: Wrong[]
  why: string
  lv?: number
}

/** Pick a record whose level is near d (within 1 if possible). */
export function nearLevel<T extends { lv?: number }>(rng: Rng, list: T[], d: number): T {
  const near = list.filter((x) => Math.abs((x.lv ?? 3) - d) <= 1)
  return rng.pick(near.length ? near : list)
}

/** "What does this German sentence mean?" from hand-written records. */
export function meaningGen(id: string, skill: string, levels: [number, number], list: Sent[], hint: string): ItemGenerator {
  return G(`top.${id}`, skill, levels, (rng, d) => {
    const s = nearLevel(rng, list, d)
    return choice({
      rng,
      prompt: `What does this mean?  ${q(s.de)}`,
      correct: s.en,
      wrong: s.wrong,
      hint,
      explanation: `${s.de} = ${s.en} ${s.why}`,
    })
  })
}

/** A fact question (culture). */
export interface Fact {
  q: string
  a: string
  wrong: Wrong[]
  why: string
  hint: string
  lv: number
  figure?: Figure
}

export function factGen(id: string, skill: string, levels: [number, number], facts: Fact[]): ItemGenerator {
  return G(`top.${id}`, skill, levels, (rng, d) => {
    const f = nearLevel(rng, facts, d)
    return choice({ rng, prompt: f.q, correct: f.a, wrong: f.wrong, hint: f.hint, explanation: f.why, figure: f.figure })
  })
}

/** A short writing task she marks herself against a model and checklist. */
export interface Task {
  prompt: string
  model: string
  checklist: string[]
  hint: string
  passMark?: number
  /** Shown in the empty answer box; defaults to an invitation to write in German. */
  placeholder?: string
  /** Shown after she has marked herself; defaults to a reminder to compare structures and spelling. */
  explanation?: string
}

export function revealGen(id: string, skill: string, levels: [number, number], tasks: Task[]): ItemGenerator {
  return G(`top.${id}`, skill, levels, (rng): ItemBody => {
    const t = rng.pick(tasks)
    return reveal({
      prompt: t.prompt,
      model: t.model,
      checklist: t.checklist,
      passMark: t.passMark,
      hint: t.hint,
      explanation: t.explanation ?? 'Compare your German with the model. Did you use the same structures? Check verb positions and spellings.',
      placeholder: t.placeholder ?? 'Schreib hier auf Deutsch... (write here in German)',
    })
  })
}

/** Choose 3 distinct wrong options from candidate labels (in order), skipping the correct one. */
export function takeWrong(correct: string, cands: Wrong[], n = 3): Wrong[] {
  const seen = new Set([correct])
  const out: Wrong[] = []
  for (const c of cands) {
    const label = typeof c === 'string' ? c : c.label
    if (seen.has(label)) continue
    seen.add(label)
    out.push(c)
    if (out.length >= n) break
  }
  return out
}

/** A sentence to build from tiles. `tiles` are in the correct order; the first tile starts with a capital letter so
 * only one order is right. */
export interface Build {
  tiles: string[]
  en: string
  why: string
  lv?: number
}

/** "Put the words in order" from hand-written tile records. */
export function buildGen(id: string, skill: string, levels: [number, number], list: Build[], hint: string): ItemGenerator {
  return G(`top.${id}`, skill, levels, (rng, d) => {
    const b = nearLevel(rng, list, d)
    return orderItem({
      rng,
      prompt: `Put the words in order to say: ${q(b.en)}`,
      correct: b.tiles,
      direction: ['start', 'end'],
      hint,
      explanation: `${b.tiles.join(' ')}. ${b.why}`,
    })
  })
}

/** A comprehension question on a passage. */
export interface RQ {
  q: string
  a: string
  wrong: Wrong[]
  why: string
  lv: number
  hint?: string
}

/** A short original German text with questions in English. */
export interface Reading {
  title: string
  text: string
  lv: number
  qs: RQ[]
}

/** Reading comprehension: pick a text near the level, then a question near the level. */
export function readingGen(id: string, skill: string, levels: [number, number], texts: Reading[]): ItemGenerator {
  return G(`top.${id}`, skill, levels, (rng, d) => {
    const t = nearLevel(rng, texts, d)
    const rq = nearLevel(rng, t.qs, d)
    return choice({
      rng,
      prompt: rq.q,
      correct: rq.a,
      wrong: rq.wrong,
      figure: passage(t.text, { title: t.title }),
      hint: rq.hint ?? 'Find the words from the question in the text first, then read the whole sentence around them.',
      explanation: rq.why,
    })
  })
}

/** An English sentence to type in German, with every correct version listed. */
export interface Tr {
  en: string
  /** Correct German versions (word-order variants included); [0] is shown as the answer. */
  de: string[]
  why: string
  hint: string
  lv?: number
}

export function typeTranslateGen(id: string, skill: string, levels: [number, number], list: Tr[]): ItemGenerator {
  return G(`top.${id}`, skill, levels, (rng, d) => {
    const t = nearLevel(rng, list, d)
    const main = t.de[0] as string
    return textItem({
      prompt: `Translate into German:  ${q(t.en)}`,
      accept: accepts(...t.de),
      placeholder: 'Type the German sentence',
      hint: t.hint,
      explanation: `${main}.${t.de.length > 1 ? ` Also right: ${t.de.slice(1, 4).join(' / ')}.` : ''} ${t.why}${keyboardTip(t.de.join(' '))}`,
    })
  })
}

/**
 * Multiple choice with the options in a fixed, natural order (der / die / das, ei / ie, ß / ss). The kit's
 * `keepOrder` always puts the correct option first, which would give the answer away, so this builds the item
 * directly.
 */
export function fixedChoice(a: { prompt: string; order: string[]; correct: string; feedback?: Record<string, { misconception: string; feedback: string }>; hint: string; explanation: string }): ItemBody {
  return {
    kind: 'choice',
    prompt: a.prompt,
    hint: a.hint,
    explanation: a.explanation,
    options: a.order.map((label, i) => ({ id: `o${i}`, label, ...(label === a.correct ? { correct: true } : (a.feedback?.[label] ?? {})) })),
  }
}
