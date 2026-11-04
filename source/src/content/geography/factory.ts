import type { ItemGenerator } from '@/engine/registry'
import type { CommonError, Figure, ItemBody, Rng } from '@/engine/types'
import { choice, generatorFor, matchItem, orderItem, reveal } from '../kit'

/**
 * Data-driven generator factory for the geography pack. Each skill gets a Bank of facts (terms and definitions,
 * hand-written multiple-choice questions with misconception feedback, linked pairs such as landform-process,
 * sequences for ordering, and written tasks). The factory turns the bank into generators, so most of the pack is
 * typing checked facts, not code.
 */

export const G = generatorFor('geography')

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

/** A one-to-one set of pairs (landform - process, biome - adaptation...). Lefts are unique, rights are unique. */
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
  /** Skill key without the subject prefix, e.g. 'rivers.processes'. */
  skill: string
  /** What the terms are called in prompts: 'term', 'landform', 'process'... */
  noun?: string
  /** Override "What does X mean?" (e.g. for map symbols: "How is X shown?"). */
  meaningPrompt?: (term: string) => string
  /** Override "Match each <noun> to what it means." */
  matchPrompt?: string
  terms?: Term[]
  mcqs?: Mcq[]
  links?: Links[]
  orders?: Sequence[]
  written?: Written[]
}

const slug = (s: string) =>
  s
    .toLowerCase()
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

const PROPER = /^(UK|HIC|LIC|NEE|GDP|GNI|HDI|TNC|NGO|OS|CBD|Earth|Equator|Sun|Prime|Europe|Asia|Africa|Arctic|Antarctic|Atlantic|Pacific|Indian|Sahara|Amazon|Himalaya|Ganges|Nile|Russia|China|India|Iceland|Japan|Mount|Lake|River|Hawaii|Britain|British|England|Scotland|Wales|Ireland|North|Northern|South|Southern|Siberia|Moscow|Ural|Volga|Trans|Tigris|Dead|Red|Rift|Great|Old|Durdle|Spurn|Lulworth|Swanage|Striding|Red|Windermere|Matterhorn|Nant|San|Mid|Kilimanjaro|Victoria|Congo|Madagascar|Mumbai|Paris|Brandt|Fair|Fairtrade|Richter|Mercalli|Saffir)\b/
export const lower = (s: string) => (/^[A-Z][a-z]/.test(s) && !PROPER.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s)

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
          wrong: others.map((o) => ({ label: o.term, misconception: `confused-${slug(o.term)}`, feedback: `${o.term} means: ${lower(o.def)}` })),
          hint: t.hint ?? 'Pick out the key idea in the description, then rule out the options you know mean something else.',
          explanation: `${t.term}: ${lower(t.def)}`,
        })
      }),
      G(`${key}.term-meaning`, key, [2, 4], (rng) => {
        const t = rng.pick(terms)
        const others = rng.shuffle(terms.filter((x) => x !== t)).slice(0, 3)
        return choice({
          rng,
          prompt: b.meaningPrompt ? b.meaningPrompt(t.term) : `What does "${t.term}" mean?`,
          correct: t.def,
          wrong: others.map((o) => ({ label: o.def, misconception: `confused-${slug(o.term)}`, feedback: `That describes ${lower(o.term)}.` })),
          hint: 'Rule out the descriptions you recognise as belonging to other terms first.',
          explanation: `${t.term}: ${lower(t.def)}`,
        })
      }),
      G(`${key}.term-match`, key, [2, 4], (rng, d) => {
        const n = Math.min(terms.length, d >= 4 ? 5 : 4)
        const pick = rng.shuffle(terms).slice(0, n)
        return matchItem({
          prompt: b.matchPrompt ?? `Match each ${noun} to what it means.`,
          pairs: pick.map((t) => ({ left: t.term, right: t.def })),
          hint: 'Start with the ones you are sure of, then use the leftovers to narrow down the rest.',
          explanation: pick.map((t) => `${t.term}: ${lower(t.def)}`).join('\n'),
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
            prompt: (l.ask as (x: string) => string)(left.replace(/^The /, 'the ')),
            correct: right,
            wrong: others.map(([ol, or]) => ({ label: or, misconception: `confused-${slug(ol)}`, feedback: `That goes with ${lower(ol)}.` })),
            hint: l.hint,
            explanation: `${left}: ${lower(right)}`,
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

/** A single numeric answer box. Common errors equal to the answer are dropped. */
export function num(a: NumArgs): ItemBody {
  const errors = (a.errors ?? []).filter((e) => !(e.values && e.values.length === 1 && Math.abs((e.values[0] ?? NaN) - a.answer) < 1e-9))
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

/** Format with thousands separators (UK style). */
export const fmt = (n: number) => n.toLocaleString('en-GB')

// --------------------------------------------------------------------- classify

export interface Classify {
  /** Generator id suffix, e.g. 'renewable'. */
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
        wrong: c.categories.filter((x) => x !== cat).map((x) => ({ label: x, misconception: `classified-${slug(x)}`, feedback: `${x}: ${lower(c.means[x] ?? '')}` })),
        keepOrder: true,
        hint: c.hint,
        explanation: `${item.charAt(0).toUpperCase() + item.slice(1)}: ${lower(cat)}. ${c.means[cat] ?? ''}`.trim(),
      })
    }),
  ]
  if (c.categories.length >= 3) {
    gens.push(
      G(`${skill}.${c.id}-sort`, skill, [2, 4], (rng) => {
        const pairs = c.categories.map((cat) => [rng.pick(c.items.filter(([, k]) => k === cat))[0], cat] as [string, string])
        return matchItem({
          prompt: 'Match each example to the right category.',
          pairs: rng.shuffle(pairs).map(([left, right]) => ({ left: left.charAt(0).toUpperCase() + left.slice(1), right })),
          hint: c.hint,
          explanation: pairs.map(([l, r]) => `${l.charAt(0).toUpperCase() + l.slice(1)}: ${r}. ${c.means[r] ?? ''}`).join('\n'),
        })
      }),
    )
  }
  return gens
}
