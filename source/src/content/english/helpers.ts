import type { ItemGenerator } from '@/engine/registry'
import type { Figure, Rng } from '@/engine/types'
import { choice, generatorFor, matchItem, orderItem, reveal, textItem } from '../kit'

/**
 * Small, data-driven building blocks for the English pack. Almost every English question is "a row from a table":
 * a multiple-choice question bank, an example to classify, a term to match, a sentence to correct, a sequence to
 * order, or a writing task. These factories turn tables into generators so each skill is mostly data.
 */

export const G = generatorFor('english')

export type Wrong = string | { label: string; misconception?: string; feedback?: string }
/** A difficulty tag on a data row: one level (used as level-1..level+1) or an inclusive range. */
export type Lv = number | [number, number]

/** Straight double quotes around a phrase. */
export const q = (s: string) => `"${s}"`

/** Rows that suit difficulty d. A single-number tag fits d-1..d+1; falls back to every row if none fit. */
export function atLevel<T extends { lv?: Lv }>(rows: readonly T[], d: number): T[] {
  const fit = rows.filter((r) => {
    if (r.lv === undefined) return true
    const [lo, hi] = typeof r.lv === 'number' ? [r.lv - 1, r.lv + 1] : r.lv
    return lo <= d && d <= hi
  })
  return fit.length ? fit : [...rows]
}

export const sample = <T,>(rng: Rng, arr: readonly T[], n: number): T[] => rng.shuffle(arr).slice(0, n)

/** Accept both straight and curly apostrophes / quotes in typed answers. */
export function variants(answers: string[]): string[] {
  const out: string[] = []
  for (const a of answers) {
    for (const v of [a, a.replace(/'/g, '’'), a.replace(/’/g, "'")]) if (!out.includes(v)) out.push(v)
  }
  return out
}

// ------------------------------------------------------------------ question bank

/** A complete multiple-choice question as data. */
export interface MC {
  q: string
  a: string
  w: Wrong[]
  hint: string
  ex: string
  lv?: Lv
  fig?: Figure
}

/** Multiple choice drawn from a bank of fully written questions. Up to 3 wrong options are used per question. */
export function bankGen(id: string, skill: string, levels: [number, number], rows: MC[], figure?: Figure): ItemGenerator {
  return G(id, skill, levels, (rng, d) => {
    const r = rng.pick(atLevel(rows, d))
    return choice({ rng, prompt: r.q, correct: r.a, wrong: sample(rng, r.w, 3), hint: r.hint, explanation: r.ex, figure: r.fig ?? figure })
  })
}

// ------------------------------------------------------------------ classify an example

export interface Example {
  /** The example sentence or phrase. */
  text: string
  /** Its category (must be a key of the category info). */
  a: string
  /** Categories that ALSO arguably apply, so must never be offered as wrong options. */
  not?: string[]
  /** Why the answer is right, specific to this example. */
  why: string
  lv?: Lv
}

/**
 * "Which X is this?" Wrong options are other categories, each with feedback saying what that category really is,
 * so a wrong pick teaches the definition. Categories listed in `not` are never offered, which keeps exactly one
 * defensible answer when an example could be read two ways.
 */
export function classifyGen(
  id: string,
  skill: string,
  levels: [number, number],
  o: {
    rows: Example[]
    /** Category name -> one-sentence definition, shown as feedback when that category is wrongly chosen. */
    cats: Record<string, string>
    prompt: (e: Example) => string
    hint: string
    options?: number
    keepOrder?: boolean
    figure?: (e: Example) => Figure | undefined
  },
): ItemGenerator {
  const names = Object.keys(o.cats)
  return G(id, skill, levels, (rng, d) => {
    const e = rng.pick(atLevel(o.rows, d))
    const pool = names.filter((n) => n !== e.a && !(e.not ?? []).includes(n))
    const wrongNames = o.keepOrder ? pool.slice(0, (o.options ?? 4) - 1) : sample(rng, pool, (o.options ?? 4) - 1)
    const wrong = wrongNames.map((n) => ({ label: n, misconception: `not-${slug(n)}`, feedback: o.cats[n] }))
    const ordered = o.keepOrder ? names.filter((n) => n === e.a || wrongNames.includes(n)) : null
    const item = choice({ rng, prompt: o.prompt(e), correct: e.a, wrong, hint: o.hint, explanation: e.why, figure: o.figure?.(e), keepOrder: !!o.keepOrder })
    if (ordered && item.kind === 'choice') {
      item.options.sort((x, y) => ordered.indexOf(x.label) - ordered.indexOf(y.label))
      item.options.forEach((opt, i) => (opt.id = `o${i}`))
    }
    return item
  })
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// ------------------------------------------------------------------ terms and definitions

export interface Term {
  term: string
  def: string
  lv?: Lv
}

/** Match four terms to their definitions. */
export function termMatchGen(id: string, skill: string, levels: [number, number], terms: Term[], prompt = 'Match each term to its meaning.'): ItemGenerator {
  return G(id, skill, levels, (rng, d) => {
    const pool = atLevel(terms, d)
    const four = sample(rng, pool.length >= 4 ? pool : terms, 4)
    return matchItem({
      prompt,
      pairs: four.map((t) => ({ left: t.term, right: t.def })),
      hint: 'Start with the pair you are surest of, then work through the rest by elimination.',
      explanation: four.map((t) => `${t.term}: ${t.def}`).join(' | '),
    })
  })
}

/** Given a definition, pick the term (distractors are other terms from the same table). */
export function termChoiceGen(id: string, skill: string, levels: [number, number], terms: Term[], what = 'term'): ItemGenerator {
  return G(id, skill, levels, (rng, d) => {
    const t = rng.pick(atLevel(terms, d))
    const wrong = sample(
      rng,
      terms.filter((x) => x.term !== t.term),
      3,
    ).map((x) => ({ label: x.term, misconception: 'confused-term', feedback: `${x.term} means: ${x.def}` }))
    return choice({
      rng,
      prompt: `Which ${what} means: ${t.def}`,
      correct: t.term,
      wrong,
      hint: 'Rule out the terms you can define confidently first.',
      explanation: `${t.term}: ${t.def}`,
    })
  })
}

// ------------------------------------------------------------------ typed answers

export interface TextQ {
  q: string
  accept: string[]
  hint: string
  ex: string
  lv?: Lv
  placeholder?: string
}

export function textGen(id: string, skill: string, levels: [number, number], rows: TextQ[], figure?: Figure): ItemGenerator {
  return G(id, skill, levels, (rng, d) => {
    const r = rng.pick(atLevel(rows, d))
    const item = textItem({ prompt: r.q, accept: variants(r.accept), hint: r.hint, explanation: r.ex, placeholder: r.placeholder ?? 'Type your answer' })
    return figure ? { ...item, figure } : item
  })
}

// ------------------------------------------------------------------ sequences

export interface Sequence {
  /** e.g. 'the plot of Macbeth' */
  name: string
  steps: string[]
  lv?: Lv
}

/** Put a random selection of steps (kept in their true order) into sequence. More steps at higher levels. */
export function sequenceGen(id: string, skill: string, levels: [number, number], seqs: Sequence[], o: { prompt?: (s: Sequence) => string; direction?: [string, string]; hint?: string; all?: boolean } = {}): ItemGenerator {
  return G(id, skill, levels, (rng, d) => {
    const s = rng.pick(atLevel(seqs, d))
    const n = o.all ? s.steps.length : Math.min(s.steps.length, d <= 2 ? 3 : d === 3 ? 4 : d === 4 ? 5 : 6)
    const idx = sample(
      rng,
      s.steps.map((_, i) => i),
      n,
    ).sort((a, b) => a - b)
    const chosen = idx.map((i) => s.steps[i] as string)
    return orderItem({
      rng,
      prompt: o.prompt ? o.prompt(s) : `Put these events from ${s.name} in order.`,
      correct: chosen,
      direction: o.direction ?? ['first', 'last'],
      hint: o.hint ?? 'Find the event that starts everything off, then ask "what does this lead to?"',
      explanation: `The order is: ${chosen.join(' → ')}.`,
    })
  })
}

// ------------------------------------------------------------------ matching pairs from a table

export interface Pair {
  left: string
  right: string
  lv?: Lv
}

export function pairMatchGen(id: string, skill: string, levels: [number, number], pairs: Pair[], prompt: string, hint: string, count = 4): ItemGenerator {
  return G(id, skill, levels, (rng, d) => {
    const pool = atLevel(pairs, d)
    const src = pool.length >= count ? pool : pairs
    // keep left and right labels unique
    const chosen: Pair[] = []
    for (const p of rng.shuffle(src)) {
      if (chosen.length >= count) break
      if (chosen.some((c) => c.left === p.left || c.right === p.right)) continue
      chosen.push(p)
    }
    return matchItem({ prompt, pairs: chosen.map((p) => ({ left: p.left, right: p.right })), hint, explanation: chosen.map((p) => `${p.left} → ${p.right}`).join(' | ') })
  })
}

// ------------------------------------------------------------------ written answers

export interface Task {
  prompt: string
  model: string
  checklist: string[]
  hint?: string
  fig?: Figure
  passMark?: number
}

export function revealGen(id: string, skill: string, levels: [number, number], tasks: Task[]): ItemGenerator {
  return G(id, skill, levels, (rng) => {
    const t = rng.pick(tasks)
    return reveal({
      prompt: t.prompt,
      model: t.model,
      checklist: t.checklist,
      passMark: t.passMark,
      hint: t.hint,
      figure: t.fig,
      explanation: 'Compare your answer with the model: tick only the points you really made, then note one thing to add next time.',
      placeholder: 'Write your answer here',
    })
  })
}
