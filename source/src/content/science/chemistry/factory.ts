import type { ItemGenerator } from '@/engine/registry'
import type { CommonError, Figure, ItemBody, Rng } from '@/engine/types'
import { choice, generatorFor, matchItem, orderItem, reveal } from '../../kit'

/**
 * Data-driven generator factory for the Chemistry part of the Science pack. Each skill gets a Bank of checked facts
 * (terms and definitions, hand-written multiple-choice questions with misconception feedback, one-to-one pairings,
 * sequences and written tasks); the factory turns a bank into generators. Calculation generators live next to their
 * topic and use `num` below.
 *
 * Every generator id starts with `chem.` and every skill id with `science.chem.` (see SCIENCE_BRIEF).
 */

export const G = generatorFor('science')

export type Wrong = string | { label: string; misconception?: string; feedback?: string }

export interface Term {
  term: string
  def: string
  /** Optional hint for "which term is this?" (must not give the answer away). */
  hint?: string
}

export interface Mcq {
  q: string
  a: string
  wrong: Wrong[]
  hint: string
  why: string
  /** Difficulty range this question suits (default [1, 5]). */
  lv?: [number, number]
  figure?: Figure
  keepOrder?: boolean
}

/** A one-to-one set of pairs. Lefts are unique, rights are unique. */
export interface Links {
  prompt: string
  pairs: [string, string][]
  hint: string
  /** If given, also ask single choice questions: ask(left) -> the right that goes with it. */
  ask?: (left: string) => string
  /** Difficulty range (default [2, 4]). */
  lv?: [number, number]
}

export interface Sequence {
  prompt: string
  steps: string[]
  direction: [string, string]
  hint: string
  why: string
  lv?: [number, number]
}

export interface Written {
  prompt: string
  model: string
  checklist: string[]
  hint: string
  passMark?: number
}

export interface Bank {
  /** Skill key without the subject prefix, e.g. 'chem.particles.states'. */
  skill: string
  /** What the terms are called in prompts: 'term', 'hazard symbol'... */
  noun?: string
  meaningPrompt?: (term: string) => string
  matchPrompt?: string
  terms?: Term[]
  mcqs?: Mcq[]
  links?: Links[]
  orders?: Sequence[]
  written?: Written[]
}

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/_\{(\d+)\}/g, '$1')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)

const inRange = (lv: [number, number] | undefined, d: number, dflt: [number, number] = [1, 5]) => {
  const [lo, hi] = lv ?? dflt
  return d >= lo && d <= hi
}

/** Pick from the entries suiting this difficulty, falling back to all of them. */
export function pickFor<T extends { lv?: [number, number] }>(rng: Rng, list: T[], d: number, dflt: [number, number] = [1, 5]): T {
  const fit = list.filter((x) => inRange(x.lv, d, dflt))
  return rng.pick(fit.length ? fit : list)
}

const levelsOf = (list: { lv?: [number, number] }[], dflt: [number, number]): [number, number] => [
  Math.min(...list.map((x) => (x.lv ?? dflt)[0])),
  Math.max(...list.map((x) => (x.lv ?? dflt)[1])),
]

/** Words that keep their capital letter when they start a definition used mid-sentence. */
const PROPER = /^(Earth|Sun|Dalton|Mendeleev|Thomson|Rutherford|Bohr|Chadwick|UK|I)\b/
/** Lower-case the first letter of an ordinary word (never a chemical symbol or formula such as CO_{2} or Fe). */
export const lower = (s: string) => (/^(A|An|It|[A-Z][a-z]{2,})\b/.test(s) && !PROPER.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s)
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export const an = (word: string) => (/^[aeiou]/i.test(word) ? 'an' : 'a')

/** Build the generators for one bank. */
export function bankGenerators(b: Bank): ItemGenerator[] {
  const gens: ItemGenerator[] = []
  const key = b.skill
  const noun = b.noun ?? 'term'
  const terms = b.terms ?? []

  if (terms.length >= 4) {
    gens.push(
      G(`${key}.term-name`, key, [1, 3], (rng, d) => {
        const t = rng.pick(terms)
        const others = rng.shuffle(terms.filter((x) => x !== t)).slice(0, d <= 1 ? 2 : 3)
        return choice({
          rng,
          prompt: `Which ${noun} matches this description?\n"${t.def}"`,
          correct: t.term,
          wrong: others.map((o) => ({ label: o.term, misconception: `confused-${slug(o.term)}`, feedback: `${o.term}: ${lower(o.def)}.` })),
          hint: t.hint ?? 'Pick out the key idea in the description, then rule out the options you know mean something else.',
          explanation: `${t.term}: ${lower(t.def)}.`,
        })
      }),
      G(`${key}.term-meaning`, key, [2, 4], (rng) => {
        const t = rng.pick(terms)
        const others = rng.shuffle(terms.filter((x) => x !== t)).slice(0, 3)
        return choice({
          rng,
          prompt: b.meaningPrompt ? b.meaningPrompt(t.term) : `What does "${lower(t.term)}" mean?`,
          correct: t.def,
          wrong: others.map((o) => ({ label: o.def, misconception: `confused-${slug(o.term)}`, feedback: `That describes ${lower(o.term)}.` })),
          hint: 'Rule out the descriptions you recognise as belonging to other terms first.',
          explanation: `${t.term}: ${lower(t.def)}.`,
        })
      }),
      G(`${key}.term-match`, key, [2, 4], (rng, d) => {
        const n = Math.min(terms.length, d >= 4 ? 5 : 4)
        const pick = rng.shuffle(terms).slice(0, n)
        return matchItem({
          prompt: b.matchPrompt ?? `Match each ${noun} to what it means.`,
          pairs: pick.map((t) => ({ left: t.term, right: t.def })),
          hint: 'Start with the ones you are sure of, then use the leftovers to narrow down the rest.',
          explanation: pick.map((t) => `${t.term}: ${lower(t.def)}.`).join('\n'),
        })
      }),
    )
  }

  if (b.mcqs?.length) {
    const mcqs = b.mcqs
    gens.push(
      G(`${key}.quiz`, key, levelsOf(mcqs, [1, 5]), (rng, d) => {
        const m = pickFor(rng, mcqs, d)
        return choice({ rng, prompt: m.q, correct: m.a, wrong: m.wrong, hint: m.hint, explanation: m.why, figure: m.figure, keepOrder: m.keepOrder })
      }),
    )
  }

  if (b.links?.length) {
    const links = b.links
    gens.push(
      G(`${key}.link-match`, key, levelsOf(links, [2, 4]), (rng, d) => {
        const l = pickFor(rng, links, d, [2, 4])
        const n = Math.min(l.pairs.length, d >= 4 ? 5 : 4)
        const pick = rng.shuffle(l.pairs).slice(0, n)
        return matchItem({
          prompt: l.prompt,
          pairs: pick.map(([left, right]) => ({ left, right })),
          hint: l.hint,
          explanation: pick.map(([left, right]) => `${left}: ${lower(right)}`).join('\n'),
        })
      }),
    )
    const askable = links.filter((l) => l.ask)
    if (askable.length) {
      gens.push(
        G(`${key}.link-pick`, key, [1, 4], (rng) => {
          const l = rng.pick(askable)
          const [left, right] = rng.pick(l.pairs)
          const others = rng.shuffle(l.pairs.filter(([x]) => x !== left)).slice(0, 3)
          return choice({
            rng,
            prompt: (l.ask as (x: string) => string)(left),
            correct: right,
            wrong: others.map(([ol, or]) => ({ label: or, misconception: `confused-${slug(ol)}`, feedback: `That goes with ${lower(ol)}.` })),
            hint: l.hint,
            explanation: `${left}: ${lower(right)}.`,
          })
        }),
      )
    }
  }

  if (b.orders?.length) {
    const orders = b.orders
    gens.push(
      G(`${key}.order`, key, levelsOf(orders, [3, 5]), (rng, d) => {
        const s = pickFor(rng, orders, d, [3, 5])
        return orderItem({ rng, prompt: s.prompt, correct: s.steps, direction: s.direction, hint: s.hint, explanation: s.why })
      }),
    )
  }

  if (b.written?.length) {
    const written = b.written
    gens.push(
      G(`${key}.explain`, key, [3, 5], (rng) => {
        const w = rng.pick(written)
        return reveal({ prompt: w.prompt, model: w.model, checklist: w.checklist, hint: w.hint, passMark: w.passMark })
      }),
    )
  }
  return gens
}

// --------------------------------------------------------------------- classify

export interface Classify {
  /** Generator id suffix, e.g. 'state'. */
  id: string
  /** The categories, in the order they should be shown. */
  categories: string[]
  /** [item, category] - each item belongs to exactly one category. */
  items: [string, string][]
  /** Question for one item. */
  ask: (item: string) => string
  hint: string
  /** One line explaining what each category means (used in feedback and explanations). */
  means: Record<string, string>
  lv?: [number, number]
  /** Prompt for the one-of-each matching version. */
  sortPrompt?: string
}

/** "Which category does this belong to?" choices, plus a one-of-each match when there are 3+ categories. */
export function classifyGenerators(skill: string, c: Classify): ItemGenerator[] {
  const gens: ItemGenerator[] = [
    G(`${skill}.${c.id}`, skill, c.lv ?? [1, 4], (rng) => {
      const [item, cat] = rng.pick(c.items)
      return choice({
        rng,
        prompt: c.ask(item),
        correct: cat,
        wrong: c.categories.filter((x) => x !== cat).map((x) => ({ label: x, misconception: `classified-${slug(x)}`, feedback: `${cap(x)}: ${lower(c.means[x] ?? '')}` })),
        keepOrder: true,
        hint: c.hint,
        explanation: `${cap(item)}: ${lower(cat)}. ${c.means[cat] ?? ''}`.trim(),
      })
    }),
  ]
  if (c.categories.length >= 3) {
    gens.push(
      G(`${skill}.${c.id}-sort`, skill, [2, 4], (rng) => {
        const pairs = c.categories.map((cat) => [rng.pick(c.items.filter(([, k]) => k === cat))[0], cat] as [string, string])
        return matchItem({
          prompt: c.sortPrompt ?? 'Match each example to the right category.',
          pairs: rng.shuffle(pairs).map(([left, right]) => ({ left: cap(left), right })),
          hint: c.hint,
          explanation: pairs.map(([l, r]) => `${cap(l)}: ${r}. ${c.means[r] ?? ''}`.trim()).join('\n'),
        })
      }),
    )
  }
  return gens
}

// --------------------------------------------------------------------- numeric helper

export interface NumArgs {
  prompt: string
  answer: number
  display?: string
  prefix?: string
  suffix?: string
  tolerance?: number
  hint: string
  explanation: string
  figure?: Figure
  errors?: CommonError[]
}

/** A single numeric answer box. Common errors equal to the answer (or duplicated) are dropped. */
export function num(a: NumArgs): ItemBody {
  const tol = a.tolerance ?? 1e-9
  const errors = (a.errors ?? []).filter(
    (e) => !(e.values && e.values.length === 1 && Math.abs((e.values[0] ?? NaN) - a.answer) <= Math.max(tol, 1e-9)) && e.values?.every((v) => Number.isFinite(v)),
  )
  const seen = new Set<string>()
  const unique = errors.filter((e) => {
    const k = JSON.stringify(e.values)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  return {
    kind: 'numeric',
    prompt: a.prompt,
    hint: a.hint,
    explanation: a.explanation,
    figure: a.figure,
    keypad: 'number',
    fields: [{ answer: a.answer, prefix: a.prefix, suffix: a.suffix, tolerance: a.tolerance, display: a.display }],
    commonErrors: unique.length ? unique : undefined,
  }
}

/** Round to dp decimal places (kills float noise like 27.000000000000004). */
export const round = (x: number, dp = 2) => {
  const f = 10 ** dp
  return Math.round(x * f) / f
}

/** Format a number UK style, dropping float noise. */
export const fmt = (n: number, dp = 2) => round(n, dp).toLocaleString('en-GB', { maximumFractionDigits: dp })

/** Fixed decimal places, for measured values ("12.0"). */
export const fix = (n: number, dp: number) => round(n, dp).toFixed(dp)

/** A results table figure. */
export const table = (head: string[], rows: (string | number)[][]): Figure => ({ type: 'table', head, rows: rows.map((r) => r.map((c) => (typeof c === 'number' ? fmt(c) : c))) })
