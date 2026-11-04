import type { ItemGenerator } from '@/engine/registry'
import type { CommonError, Figure, ItemBody, Rng } from '@/engine/types'
import { choice, generatorFor, matchItem, orderItem, reveal } from '../../kit'

/**
 * Helpers for the Physics part of the Science pack.
 *
 * Fact-based skills are written as a `Bank` (terms, hand-written multiple choice with misconception feedback,
 * one-to-one pairings, sequences, written tasks, and "which category?" sorts). `bankGenerators` turns a bank into
 * generators. Calculation generators live next to their topic and use `num`, which always takes the answer computed
 * in code from the same numbers that appear in the prompt.
 *
 * Every generator id starts with `phys.` and every skill id with `science.phys.`.
 */

export const G = generatorFor('science')

export type Wrong = string | { label: string; misconception?: string; feedback?: string }

export interface Term {
  term: string
  def: string
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

/** A one-to-one set of pairs: lefts unique, rights unique. */
export interface Links {
  prompt: string
  pairs: [string, string][]
  hint: string
  /** If given, also ask single choice questions: ask(left) -> the matching right. */
  ask?: (left: string) => string
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
  figure?: Figure
}

/** Sort examples into categories. Each example belongs to exactly one category. */
export interface Sort {
  id: string
  categories: string[]
  items: [string, string][]
  ask: (item: string) => string
  hint: string
  /** One sentence per category, used in feedback and explanations. */
  means: Record<string, string>
  lv?: [number, number]
  sortPrompt?: string
}

export interface Bank {
  /** Skill key without the subject prefix, e.g. 'phys.energy.stores'. */
  skill: string
  noun?: string
  matchPrompt?: string
  terms?: Term[]
  mcqs?: Mcq[]
  links?: Links[]
  orders?: Sequence[]
  written?: Written[]
  sorts?: Sort[]
}

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[_^]\{([^}]*)\}/g, '$1')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)

/** Lower-case the first letter unless the first word is an acronym or proper noun. */
const KEEP = /^(Earth|Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Milky|UK|I|National|Hooke|ROY|LED)\b/
export const lower = (s: string) => (/^([A-Z][a-z]|A )/.test(s) && !KEEP.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s)
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export const an = (word: string) => (/^[aeiou]/i.test(word) ? 'an' : 'a')
/** Add a full stop unless the sentence already ends with punctuation. */
export const stop = (s: string) => (/[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`)

const inRange = (lv: [number, number] | undefined, d: number, dflt: [number, number]) => {
  const [lo, hi] = lv ?? dflt
  return d >= lo && d <= hi
}

/** Pick from the entries that suit this difficulty, falling back to all of them. */
export function pickFor<T extends { lv?: [number, number] }>(rng: Rng, list: T[], d: number, dflt: [number, number] = [1, 5]): T {
  const fit = list.filter((x) => inRange(x.lv, d, dflt))
  return rng.pick(fit.length ? fit : list)
}

const levelsOf = (list: { lv?: [number, number] }[], dflt: [number, number]): [number, number] => [
  Math.min(...list.map((x) => (x.lv ?? dflt)[0])),
  Math.max(...list.map((x) => (x.lv ?? dflt)[1])),
]

/** Build every generator a bank supports. */
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
          wrong: others.map((o) => ({ label: o.term, misconception: `confused-${slug(o.term)}`, feedback: `${o.term}: ${stop(lower(o.def))}` })),
          hint: t.hint ?? 'Pick out the key idea in the description, then rule out the options you know mean something else.',
          explanation: `${t.term}: ${stop(lower(t.def))}`,
        })
      }),
      G(`${key}.term-meaning`, key, [2, 4], (rng) => {
        const t = rng.pick(terms)
        const others = rng.shuffle(terms.filter((x) => x !== t)).slice(0, 3)
        return choice({
          rng,
          prompt: `In physics, what does "${lower(t.term)}" mean?`,
          correct: t.def,
          wrong: others.map((o) => ({ label: o.def, misconception: `confused-${slug(o.term)}`, feedback: `That describes ${lower(o.term)}.` })),
          hint: 'Rule out the descriptions you recognise as belonging to other words first.',
          explanation: `${t.term}: ${stop(lower(t.def))}`,
        })
      }),
      G(`${key}.term-match`, key, [2, 4], (rng, d) => {
        const n = Math.min(terms.length, d >= 4 ? 5 : 4)
        const pick = rng.shuffle(terms).slice(0, n)
        return matchItem({
          prompt: b.matchPrompt ?? `Match each ${noun} to what it means.`,
          pairs: pick.map((t) => ({ left: t.term, right: t.def })),
          hint: 'Start with the ones you are sure of, then use the leftovers to narrow down the rest.',
          explanation: pick.map((t) => `${t.term}: ${stop(lower(t.def))}`).join('\n'),
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
          explanation: pick.map(([left, right]) => `${left}: ${stop(lower(right))}`).join('\n'),
        })
      }),
    )
    const askable = links.filter((l) => l.ask)
    if (askable.length) {
      gens.push(
        G(`${key}.link-pick`, key, levelsOf(askable, [1, 4]), (rng, d) => {
          const l = pickFor(rng, askable, d, [1, 4])
          const [left, right] = rng.pick(l.pairs)
          const others = rng.shuffle(l.pairs.filter(([x]) => x !== left)).slice(0, 3)
          return choice({
            rng,
            prompt: (l.ask as (x: string) => string)(left),
            correct: right,
            wrong: others.map(([ol, or]) => ({ label: or, misconception: `confused-${slug(ol)}`, feedback: `That goes with ${lower(ol)}.` })),
            hint: l.hint,
            explanation: `${left}: ${stop(lower(right))}`,
          })
        }),
      )
    }
  }

  if (b.orders?.length) {
    const orders = b.orders
    gens.push(
      G(`${key}.order`, key, levelsOf(orders, [2, 5]), (rng, d) => {
        const s = pickFor(rng, orders, d, [2, 5])
        return orderItem({ rng, prompt: s.prompt, correct: s.steps, direction: s.direction, hint: s.hint, explanation: s.why })
      }),
    )
  }

  for (const s of b.sorts ?? []) gens.push(...sortGenerators(key, s))

  if (b.written?.length) {
    const written = b.written
    gens.push(
      G(`${key}.explain`, key, [3, 5], (rng) => {
        const w = rng.pick(written)
        return reveal({ prompt: w.prompt, model: w.model, checklist: w.checklist, hint: w.hint, passMark: w.passMark, figure: w.figure })
      }),
    )
  }
  return gens
}

/** "Which category?" single questions, plus a one-of-each match when there are 3+ categories. */
export function sortGenerators(skill: string, c: Sort): ItemGenerator[] {
  const gens: ItemGenerator[] = [
    G(`${skill}.${c.id}`, skill, c.lv ?? [1, 4], (rng) => {
      const [item, cat] = rng.pick(c.items)
      // At most four options, kept in the categories' own order.
      const shown = new Set(rng.shuffle(c.categories.filter((x) => x !== cat)).slice(0, 3))
      return choice({
        rng,
        prompt: c.ask(item),
        correct: cat,
        wrong: c.categories.filter((x) => shown.has(x)).map((x) => ({ label: x, misconception: `classified-${slug(x)}`, feedback: stop(c.means[x] ?? x) })),
        keepOrder: true,
        hint: c.hint,
        explanation: `${cap(item)}: ${lower(cat)}. ${c.means[cat] ?? ''}`.trim(),
      })
    }),
  ]
  if (c.categories.length >= 3) {
    gens.push(
      G(`${skill}.${c.id}-sort`, skill, [2, 4], (rng, d) => {
        const cats = c.categories.length > 4 ? rng.shuffle(c.categories).slice(0, d >= 4 ? 5 : 4) : c.categories
        const pairs = cats.map((cat) => [rng.pick(c.items.filter(([, k]) => k === cat))[0], cat] as [string, string])
        return matchItem({
          prompt: c.sortPrompt ?? 'Match each example to the right category.',
          pairs: rng.shuffle(pairs).map(([left, right]) => ({ left: cap(left), right })),
          hint: c.hint,
          explanation: pairs.map(([l, r]) => `${cap(l)}: ${lower(r)}. ${c.means[r] ?? ''}`.trim()).join('\n'),
        })
      }),
    )
  } else {
    // Two categories: pick the one example that belongs to the other group.
    gens.push(
      G(`${skill}.${c.id}-odd`, skill, [2, 4], (rng) => {
        const big = c.categories.filter((k) => c.items.filter(([, x]) => x === k).length >= 3)
        const catA = rng.pick(big.length ? big : c.categories)
        const catB = c.categories.find((k) => k !== catA) as string
        const same = rng.shuffle(c.items.filter(([, k]) => k === catA)).slice(0, 3)
        const odd = rng.pick(c.items.filter(([, k]) => k === catB))
        return choice({
          rng,
          prompt: `Three of these belong in the group "${lower(catA)}". Which one does not?`,
          correct: cap(odd[0]),
          wrong: same.map(([x]) => ({ label: cap(x), misconception: `classified-${slug(catB)}`, feedback: `${cap(x)}: ${lower(catA)}. ${c.means[catA] ?? ''}`.trim() })),
          hint: c.hint,
          explanation: `${cap(odd[0])}: ${lower(catB)}. ${c.means[catB] ?? ''}`.trim(),
        })
      }),
    )
  }
  return gens
}

// --------------------------------------------------------------------- numbers

/** Round to dp decimal places (kills float noise like 27.000000000000004). */
export const round = (x: number, dp = 6) => {
  const f = 10 ** dp
  return Math.round(x * f) / f
}

/** Format a number UK style (comma thousands separators), dropping float noise. */
export const fmt = (n: number, dp = 4) => round(n, dp).toLocaleString('en-GB', { maximumFractionDigits: dp })

/** Fixed decimal places, for measured values ("12.0"). */
export const fix = (n: number, dp: number) => round(n, dp).toFixed(dp)

export interface NumArgs {
  prompt: string
  answer: number
  prefix?: string
  suffix?: string
  tolerance?: number
  hint: string
  explanation: string
  figure?: Figure
  errors?: CommonError[]
}

/** One numeric answer box. Common errors that equal the answer, are not finite, or repeat are dropped. */
export function num(a: NumArgs): ItemBody {
  const answer = round(a.answer, 9)
  const tol = Math.max(a.tolerance ?? 0, 1e-9)
  const seen = new Set<string>()
  const errors = (a.errors ?? [])
    .map((e) => ({ ...e, values: e.values?.map((v) => round(v, 9)) }))
    .filter((e) => {
      if (!e.values || e.values.length !== 1 || !e.values.every((v) => Number.isFinite(v))) return false
      if (Math.abs((e.values[0] as number) - answer) <= tol) return false
      const k = String(e.values[0])
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
    fields: [{ answer, prefix: a.prefix, suffix: a.suffix, tolerance: a.tolerance }],
    commonErrors: errors.length ? errors : undefined,
  }
}

/** A common-error entry for `num`. */
export const err = (value: number, tag: string, message: string): CommonError => ({ values: [value], tag, message })

/** A table figure; numbers are formatted UK style. */
export const table = (head: string[], rows: (string | number)[][]): Figure => ({ type: 'table', head, rows: rows.map((r) => r.map((c) => (typeof c === 'number' ? fmt(c) : c))) })

/** Choose a value from a list with the rng. */
export const pickOne = <T>(rng: Rng, xs: readonly T[]): T => rng.pick(xs)

/** n distinct values from a list (n <= length). */
export const pickSome = <T>(rng: Rng, xs: readonly T[], n: number): T[] => rng.shuffle(xs).slice(0, n)
