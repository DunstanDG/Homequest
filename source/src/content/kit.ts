import type { ChoiceOption, Figure, ItemBody, Rng } from '@/engine/types'
import type { ItemGenerator } from '@/engine/registry'

/**
 * Subject-agnostic building blocks for writing generators. Every subject pack can use these;
 * subject-specific helpers (like the maths fraction/algebra helpers) live next to their pack.
 */

type Wrong = string | { label: string; misconception?: string; feedback?: string }

export interface ChoiceArgs {
  rng: Rng
  prompt: string
  correct: string
  wrong: Wrong[]
  hint?: string
  explanation: string
  figure?: Figure
  /** Keep options in the order given instead of shuffling (e.g. ordered scales). */
  keepOrder?: boolean
}

/** Multiple choice: one correct option, distractors de-duplicated, shuffled unless keepOrder. */
export function choice(a: ChoiceArgs): ItemBody {
  const seen = new Set<string>([a.correct])
  const wrong: { label: string; misconception?: string; feedback?: string }[] = []
  for (const w of a.wrong) {
    const o = typeof w === 'string' ? { label: w } : w
    if (seen.has(o.label)) continue
    seen.add(o.label)
    wrong.push(o)
  }
  const all: (Omit<ChoiceOption, 'id'> & { correct?: boolean })[] = [{ label: a.correct, correct: true }, ...wrong]
  // keepOrder means "show these in their natural order" (Sample A, B, C; 10, 20, 30; solid, liquid, gas), never "put
  // the right answer first", which is what keeping the given order used to do. With no natural order to find, shuffle.
  const natural = a.keepOrder ? naturalOrder(all.map((o) => o.label)) : undefined
  const ordered = natural ? natural.map((i) => all[i]!) : a.rng.shuffle(all)
  return {
    kind: 'choice',
    prompt: a.prompt,
    hint: a.hint,
    explanation: a.explanation,
    figure: a.figure,
    options: ordered.map((o, i) => ({ id: `o${i}`, ...o })),
  }
}

/** Well-known short sequences that read best in this order. */
const SEQUENCES: string[][] = [
  ['solid', 'liquid', 'gas'],
  ['mean', 'median', 'mode', 'range'],
  ['acidic', 'neutral', 'alkaline'],
  ['increases', 'decreases', 'stays the same'],
  ['increase', 'decrease', 'stay the same'],
  ['goes up', 'goes down', 'stays the same'],
  ['more', 'less', 'the same'],
  ['bigger', 'smaller', 'the same'],
  ['higher', 'lower', 'the same'],
  ['true', 'false'],
  ['yes', 'no'],
  ['always', 'sometimes', 'never'],
  ['certain', 'likely', 'even chance', 'unlikely', 'impossible'],
  ['impossible', 'unlikely', 'even chance', 'likely', 'certain'],
]

/**
 * The natural display order of a set of option labels, as indexes, or undefined if there isn't an obvious one.
 * Numbers sort by value ("2 cm" < "10 cm"); labels that differ only in a final letter or number sort by it
 * ("Sample B" < "Sample C", "Part 2" < "Part 10"); a few well-known sequences keep their usual order.
 */
export function naturalOrder(labels: readonly string[]): number[] | undefined {
  const idx = labels.map((_, i) => i)
  const num = (s: string) => {
    const m = s.replace(/−/g, '-').replace(/(\d),(\d{3})/g, '$1$2').match(/^\s*[£$€]?\s*(-?\d+(?:\.\d+)?)/)
    return m ? Number(m[1]) : NaN
  }
  const nums = labels.map(num)
  if (nums.every((n) => !Number.isNaN(n)) && new Set(nums).size === nums.length) return idx.sort((a, b) => nums[a]! - nums[b]!)
  const tail = labels.map((l) => l.match(/^(.*?)\b([A-Z]|\d+)\)?$/))
  if (tail.every((m) => !!m) && new Set(tail.map((m) => m![1])).size === 1) {
    const key = (i: number) => tail[i]![2]!
    const isNum = /^\d+$/.test(key(0))
    return idx.sort((a, b) => (isNum ? Number(key(a)) - Number(key(b)) : key(a).localeCompare(key(b))))
  }
  const low = labels.map((l) => l.trim().toLowerCase().replace(/[.!]$/, ''))
  for (const seq of SEQUENCES) {
    if (low.every((l) => seq.includes(l))) return idx.sort((a, b) => seq.indexOf(low[a]!) - seq.indexOf(low[b]!))
  }
  return undefined
}

/** Typed answer. `accept[0]` is the canonical answer shown when she is wrong. */
export function textItem(a: { prompt: string; accept: string[]; explanation: string; hint?: string; ignoreAccents?: boolean; placeholder?: string }): ItemBody {
  return {
    kind: 'text',
    prompt: a.prompt,
    hint: a.hint,
    explanation: a.explanation,
    accept: a.accept,
    ignoreAccents: a.ignoreAccents,
    placeholder: a.placeholder,
  }
}

/** Pair-matching (vocabulary, definitions, terms and meanings). Pair ids are the correct pairing. */
export function matchItem(a: { prompt: string; pairs: { left: string; right: string }[]; explanation: string; hint?: string }): ItemBody {
  return {
    kind: 'match',
    prompt: a.prompt,
    hint: a.hint,
    explanation: a.explanation,
    pairs: a.pairs.map((p, i) => ({ id: `p${i}`, ...p })),
  }
}

/** Make sure a shuffled order isn't already the answer. */
export function shuffledNotSorted<T>(rng: Rng, correct: T[]): T[] {
  for (let i = 0; i < 20; i++) {
    const s = rng.shuffle(correct)
    if (s.some((x, idx) => x !== correct[idx])) return s
  }
  return [...correct].reverse()
}

/** Generator constructor for a subject: `defineGenerators('german')` gives a G('id', 'skill', [lo, hi], fn) helper. */
export const generatorFor =
  (subject: string) =>
  (id: string, skill: string, levels: [number, number], generate: ItemGenerator['generate']): ItemGenerator => ({
    id: `${subject}.${id}`,
    skillId: `${subject}.${skill}`,
    levels,
    generate,
  })

/**
 * A written answer she marks herself against a model and a checklist (see RevealItem). For "explain", "describe",
 * source questions and short paragraphs - anything that can't honestly be auto-marked. Keep the model to the
 * length you'd expect from a good Year 8 answer, and make each checklist point something she can see for herself
 * in her own writing ("Gives a reason", "Uses a quotation"). `passMark` defaults to just over half the points.
 */
export function reveal(a: { prompt: string; model: string; checklist: string[]; passMark?: number; hint?: string; explanation?: string; figure?: Figure; placeholder?: string }): ItemBody {
  return {
    kind: 'reveal',
    prompt: a.prompt,
    hint: a.hint,
    explanation: a.explanation ?? 'Compare your answer with the model: what did it include that yours did not?',
    figure: a.figure,
    model: a.model,
    checklist: a.checklist,
    passMark: a.passMark ?? Math.ceil(a.checklist.length / 2 + 0.01),
    placeholder: a.placeholder,
  }
}

/** Put items in order (timelines, process steps, sentence building). `correct` is the right order; the shown order
 * is shuffled so it's never already right. */
export function orderItem(a: { rng: Rng; prompt: string; correct: string[]; direction: [string, string]; explanation: string; hint?: string; figure?: Figure }): ItemBody {
  const items = a.correct.map((label, i) => ({ id: `i${i}`, label }))
  return {
    kind: 'order',
    prompt: a.prompt,
    hint: a.hint,
    explanation: a.explanation,
    figure: a.figure,
    items: shuffledNotSorted(a.rng, items),
    correctOrder: items.map((x) => x.id),
    directionLabel: a.direction,
  }
}

/** A text to read alongside a question (extract, poem, source). Blank lines separate paragraphs. */
export const passage = (text: string, opts: { title?: string; source?: string } = {}): Figure => ({ type: 'passage', text, ...opts })

/** A code listing to read alongside a question (Python, pseudocode, HTML). Indentation is kept. */
export const codeFigure = (code: string, language = 'Python'): Figure => ({ type: 'code', code, language })
