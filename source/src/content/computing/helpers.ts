import type { ItemGenerator } from '@/engine/registry'
import type { CommonError, Figure, ItemBody, Rng } from '@/engine/types'
import { choice, generatorFor, matchItem, orderItem, reveal, textItem } from '../kit'

export const G = generatorFor('computing')

export type Wrong = string | { label: string; misconception?: string; feedback?: string }

/** Array element that is known to exist (keeps noUncheckedIndexedAccess quiet without hiding real bugs). */
export const at = <T,>(arr: readonly T[], i: number): T => arr[((i % arr.length) + arr.length) % arr.length] as T

/** `n` distinct items picked at random. */
export const pickN = <T,>(rng: Rng, arr: readonly T[], n: number): T[] => rng.shuffle(arr).slice(0, Math.min(n, arr.length))

export const others = <T,>(arr: readonly T[], not: T): T[] => arr.filter((x) => x !== not)

export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

/** Pick the record whose band includes `d`; if none does, the nearest band. Never throws on a non-empty list. */
export function forLevel<T extends { lv: [number, number] }>(rng: Rng, list: readonly T[], d: number): T {
  const inBand = list.filter((x) => x.lv[0] <= d && d <= x.lv[1])
  if (inBand.length) return rng.pick(inBand)
  const dist = (x: T) => (d < x.lv[0] ? x.lv[0] - d : d - x.lv[1])
  const best = Math.min(...list.map(dist))
  return rng.pick(list.filter((x) => dist(x) === best))
}

export const levelsOf = (list: readonly { lv: [number, number] }[]): [number, number] => [Math.min(...list.map((x) => x.lv[0])), Math.max(...list.map((x) => x.lv[1]))]

// ------------------------------------------------------------------ programs

/** A generated program and exactly what it prints, one entry per line. `stdin` is what the user types, in order.
 * The tests run these through real Python (when available) to check the expected output. */
export interface Program {
  code: string
  output: string[]
  stdin?: string[]
}

/** How Python prints a float: whole numbers keep ".0". */
export const pyFloat = (x: number): string => (Number.isInteger(x) ? `${x}.0` : String(x))
/** How Python prints a Boolean. */
export const pyBool = (b: boolean): string => (b ? 'True' : 'False')
/** Python's // and % for integers (floor division; the remainder takes the sign of the divisor). */
export const pyDiv = (a: number, b: number): number => Math.floor(a / b)
export const pyMod = (a: number, b: number): number => a - b * Math.floor(a / b)
/** How Python prints a list of numbers or strings. */
export const pyList = (xs: (number | string)[]): string => `[${xs.map((x) => (typeof x === 'string' ? `'${x}'` : String(x))).join(', ')}]`

// ------------------------------------------------------------------ numeric

interface NumArgs {
  prompt: string
  answer: number
  hint: string
  explanation: string
  prefix?: string
  suffix?: string
  figure?: Figure
  errors?: CommonError[]
  tolerance?: number
}

/** One-box numeric item. Common errors that equal the answer (or repeat) are dropped. */
export function num(a: NumArgs): ItemBody {
  const seen = new Set<number>([a.answer])
  const errors = (a.errors ?? []).filter((e) => {
    const v = e.values?.[0]
    if (v === undefined || !Number.isFinite(v) || seen.has(v)) return false
    seen.add(v)
    return true
  })
  return {
    kind: 'numeric',
    prompt: a.prompt,
    hint: a.hint,
    explanation: a.explanation,
    figure: a.figure,
    keypad: 'number',
    fields: [{ answer: a.answer, prefix: a.prefix, suffix: a.suffix, tolerance: a.tolerance }],
    commonErrors: errors.length ? errors : undefined,
  }
}

/** Typed answer with an optional figure (the kit's textItem has no figure). `accept[0]` is shown when wrong. */
export function text(a: { prompt: string; accept: string[]; explanation: string; hint: string; figure?: Figure; placeholder?: string }): ItemBody {
  return { kind: 'text', prompt: a.prompt, hint: a.hint, explanation: a.explanation, figure: a.figure, accept: [...new Set(a.accept)], placeholder: a.placeholder }
}

export const err = (value: number, tag: string, message: string): CommonError => ({ values: [value], tag, message })

// ------------------------------------------------------------------ binary / hex

export const toBin = (n: number, width = 8): string => n.toString(2).padStart(width, '0')
export const toHex = (n: number, width = 2): string => n.toString(16).toUpperCase().padStart(width, '0')
/** 8-bit binary with a space between the nibbles, for reading. */
export const nibbles = (b: string): string => b.replace(/(.{4})(?=.)/g, '$1 ')

/** Accepted ways of typing a binary answer: padded, nibble-spaced, and without leading zeros. */
export function binAccept(n: number, width = 8): string[] {
  const padded = toBin(n, width)
  const out = [padded, nibbles(padded), n.toString(2)]
  return [...new Set(out)]
}

/** Accepted ways of typing a list of values: "3, 5, 1", "3,5,1", "3 5 1", "[3, 5, 1]". */
export function listAccept(xs: (number | string)[]): string[] {
  const s = xs.map(String)
  return [...new Set([s.join(', '), s.join(','), s.join(' '), `[${s.join(', ')}]`, `[${s.join(',')}]`])]
}

export const commaList = (xs: (number | string)[]) => xs.map(String).join(', ')

/** 1234567 -> '1,234,567'. */
export const commas = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

// ------------------------------------------------------------------ fact skills

/** A term and its definition, for recall, matching and typing questions. */
export interface Term {
  term: string
  def: string
  /** A clue that points towards the term without naming it. */
  hint: string
  /** Other accepted typed forms (case is ignored). Leave out to stop the term being asked as a typed answer. */
  typed?: string[]
}

/** A multiple-choice fact with misconception distractors. */
export interface Fact {
  lv: [number, number]
  q: string
  a: string
  wrong: Wrong[]
  hint: string
  exp: string
  figure?: Figure
  keepOrder?: boolean
}

/** Steps to put in order. */
export interface Sequence {
  lv: [number, number]
  q: string
  steps: string[]
  direction?: [string, string]
  hint: string
  exp: string
}

/** A written answer she marks herself. */
export interface Written {
  q: string
  model: string
  checklist: string[]
  hint?: string
  passMark?: number
}

export interface FactSet {
  /** Skill id without the 'computing.' prefix, e.g. 'hw.cpu'. */
  skill: string
  /** Generator id stem, e.g. 'hw.cpu'. */
  id?: string
  /** What the terms are, for prompts: "Which term means..." / "Match each device to..." */
  termNoun?: string
  terms?: Term[]
  /** Levels for the definition -> term question (default [1, 3]). */
  termLevels?: [number, number]
  facts?: Fact[]
  sequences?: Sequence[]
  written?: Written[]
}

/** Builds the standard generators for a skill whose content is facts in a table. */
export function factGenerators(set: FactSet): ItemGenerator[] {
  const stem = set.id ?? set.skill
  const noun = set.termNoun ?? 'term'
  const gens: ItemGenerator[] = []
  const terms = set.terms ?? []

  if (terms.length >= 4) {
    gens.push(
      G(`${stem}.term`, set.skill, set.termLevels ?? [1, 3], (rng, d) => {
        const t = rng.pick(terms)
        const rest = pickN(rng, others(terms, t), 3)
        if (d <= 2 || rng.chance(0.5)) {
          return choice({
            rng,
            prompt: `Which ${noun} is this? "${t.def}"`,
            correct: t.term,
            wrong: rest.map((x) => ({ label: x.term, feedback: `${x.term}: ${x.def}.` })),
            hint: t.hint,
            explanation: `${t.term}: ${t.def}.`,
          })
        }
        return choice({
          rng,
          prompt: `Which description matches "${t.term}"?`,
          correct: t.def,
          wrong: rest.map((x) => ({ label: x.def, feedback: `That describes ${x.term}.` })),
          hint: t.hint,
          explanation: `${t.term}: ${t.def}.`,
        })
      }),
      G(`${stem}.match`, set.skill, [2, 4], (rng, d) => {
        const n = Math.min(terms.length, d <= 2 ? 3 : d === 3 ? 4 : 5)
        const pick = pickN(rng, terms, n)
        return matchItem({
          prompt: `Match each ${noun} to its description.`,
          pairs: pick.map((t) => ({ left: t.term, right: t.def })),
          hint: 'Start with the pairs you are surest of, then use the clues in the descriptions for the rest.',
          explanation: pick.map((t) => `${t.term}: ${t.def}.`).join(' '),
        })
      }),
    )
    const typeable = terms.filter((t) => t.typed)
    if (typeable.length >= 3) {
      gens.push(
        G(`${stem}.type`, set.skill, [3, 5], (rng) => {
          const t = rng.pick(typeable)
          return textItem({
            prompt: `Which ${noun} matches this description? Type your answer. "${t.def}"`,
            accept: [t.term, ...(t.typed ?? [])],
            placeholder: `Type the ${noun}`,
            hint: t.hint,
            explanation: `${t.term}: ${t.def}.`,
          })
        }),
      )
    }
  }

  const facts = set.facts ?? []
  if (facts.length) {
    gens.push(
      G(`${stem}.fact`, set.skill, levelsOf(facts), (rng, d) => {
        const f = forLevel(rng, facts, d)
        return choice({ rng, prompt: f.q, correct: f.a, wrong: f.wrong, hint: f.hint, explanation: f.exp, figure: f.figure, keepOrder: f.keepOrder })
      }),
    )
  }

  const seqs = set.sequences ?? []
  if (seqs.length) {
    gens.push(
      G(`${stem}.order`, set.skill, levelsOf(seqs), (rng, d) => {
        const s = forLevel(rng, seqs, d)
        return orderItem({ rng, prompt: s.q, correct: s.steps, direction: s.direction ?? ['first', 'last'], hint: s.hint, explanation: s.exp })
      }),
    )
  }

  const written = set.written ?? []
  if (written.length) {
    gens.push(
      G(`${stem}.explain`, set.skill, [3, 5], (rng) => {
        const w = rng.pick(written)
        return reveal({ prompt: w.q, model: w.model, checklist: w.checklist, hint: w.hint, passMark: w.passMark })
      }),
    )
  }
  return gens
}

/** A written-answer generator outside a fact set. */
export function writtenGenerator(id: string, skill: string, list: Written[], levels: [number, number] = [3, 5]): ItemGenerator {
  return G(id, skill, levels, (rng) => {
    const w = rng.pick(list)
    return reveal({ prompt: w.q, model: w.model, checklist: w.checklist, hint: w.hint, passMark: w.passMark })
  })
}
