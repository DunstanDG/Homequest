import type { CommonError, Figure, ItemBody, NumericField, Rng } from '@/engine/types'
import { formatNumber } from '@/engine/judge'

// ------------------------------------------------------------- number utils
export const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))
export const lcm = (a: number, b: number): number => Math.abs(a * b) / gcd(a, b)
export const round = (n: number, dp = 0) => Number(n.toFixed(dp))
export const isPrime = (n: number) => {
  if (n < 2) return false
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false
  return true
}
export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

/** `parts` positive integers adding to `total`, spread unevenly (at least three different values when possible). */
export function composition(rng: Rng, total: number, parts: number): number[] {
  for (let g = 0; g < 100; g++) {
    const out = Array.from({ length: parts }, () => 1)
    for (let i = 0; i < total - parts; i++) {
      const k = rng.int(0, parts - 1)
      out[k] = (out[k] as number) + 1
    }
    if (new Set(out).size > 2) return out
  }
  return Array.from({ length: parts }, (_v, i) => (i === 0 ? total - (parts - 1) : 1))
}

// ------------------------------------------------------------- text helpers
/** 1234567 -> '1 234 567' */
export const spaced = (n: number | string): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
/** Fraction n/d reduced: { answer, display, n, d }. */
export function reduce(n: number, d: number) {
  const g = gcd(n, d)
  const nn = n / g
  const dd = d / g
  return { n: nn, d: dd, answer: nn / dd, display: dd === 1 ? String(nn) : `${nn}/${dd}` }
}
/** Number with a proper minus sign. */
export const m = (n: number): string => {
  const s = formatNumber(Math.abs(n))
  return n < 0 ? `−${s}` : s
}
/** Number in brackets if negative: (−3). */
export const mp = (n: number): string => (n < 0 ? `(${m(n)})` : m(n))
export const F = (n: number | string, d: number | string): string => `{${n}|${d}}`
export const sup = (base: string | number, exp: string | number): string => `${base}^{${exp}}`
export const money = (n: number): string => `£${Number.isInteger(n) ? n : n.toFixed(2)}`
export const cm2 = 'cm^{2}'
export const cm3 = 'cm^{3}'

/** "3x + 4" style: coef*var + const with proper signs. */
export function lin(a: number, b: number, v = 'x'): string {
  const head = a === 1 ? v : a === -1 ? `−${v}` : `${m(a)}${v}`
  if (a === 0) return m(b)
  if (b === 0) return head
  return `${head} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`
}
/** ASCII version for expression answers: '3x+4'. */
export function linA(a: number, b: number, v = 'x'): string {
  const head = a === 1 ? v : a === -1 ? `-${v}` : `${a}${v}`
  if (a === 0) return String(b)
  if (b === 0) return head
  return `${head}${b < 0 ? '-' : '+'}${Math.abs(b)}`
}

// ------------------------------------------------------- item constructors
interface NumArgs {
  prompt: string
  answer: number
  hint?: string
  explanation: string
  prefix?: string
  suffix?: string
  tolerance?: number
  lowest?: boolean
  keypad?: 'number' | 'fraction'
  figure?: Figure
  errors?: CommonError[]
  display?: string
}
/** Drop "common errors" that happen to coincide with the right answer (e.g. 2 squared vs 2 x 2). */
function usefulErrors(errors: CommonError[] | undefined, fields: NumericField[]): CommonError[] | undefined {
  const keep = (errors ?? []).filter(
    (e) => !(e.values && e.values.length === fields.length && e.values.every((v, i) => Math.abs(v - (fields[i]?.answer ?? Number.NaN)) < 1e-9)),
  )
  return keep.length ? keep : undefined
}

export const num = (a: NumArgs): ItemBody => ({
  kind: 'numeric',
  prompt: a.prompt,
  hint: a.hint,
  explanation: a.explanation,
  figure: a.figure,
  keypad: a.keypad ?? (a.lowest ? 'fraction' : 'number'),
  fields: [{ answer: a.answer, prefix: a.prefix, suffix: a.suffix, tolerance: a.tolerance, requireLowestTerms: a.lowest, display: a.display }],
  commonErrors: usefulErrors(a.errors, [{ answer: a.answer }]),
})

interface MultiArgs {
  prompt: string
  fields: NumericField[]
  template?: string
  hint?: string
  explanation: string
  figure?: Figure
  keypad?: 'number' | 'fraction'
  errors?: CommonError[]
}
export const multi = (a: MultiArgs): ItemBody => ({
  kind: 'numeric',
  prompt: a.prompt,
  hint: a.hint,
  explanation: a.explanation,
  figure: a.figure,
  keypad: a.keypad ?? 'number',
  fields: a.fields,
  template: a.template,
  commonErrors: usefulErrors(a.errors, a.fields),
})

interface ExprArgs {
  prompt: string
  answer: string
  variables: string[]
  prefix?: string
  form?: 'any' | 'expanded' | 'simplified' | 'factorised'
  expectedFactor?: string
  hint?: string
  explanation: string
  figure?: Figure
  errors?: CommonError[]
}
export const expr = (a: ExprArgs): ItemBody => ({
  kind: 'expr',
  prompt: a.prompt,
  hint: a.hint,
  explanation: a.explanation,
  figure: a.figure,
  answer: a.answer,
  prefix: a.prefix,
  form: a.form ?? 'any',
  expectedFactor: a.expectedFactor,
  variables: a.variables,
  commonErrors: a.errors,
})

// Subject-agnostic constructors live in ../kit; re-exported so existing maths generators keep importing from here.
export { choice, shuffledNotSorted } from '../kit'

/** Distinct nearby wrong numbers for multiple choice. */
export function nearby(rng: Rng, correct: number, count: number, spread: number, dp = 0): number[] {
  const out = new Set<number>()
  let guard = 0
  while (out.size < count && guard++ < 200) {
    const delta = rng.int(1, Math.max(1, spread)) * (rng.chance(0.5) ? 1 : -1)
    const v = round(correct + (dp ? delta / 10 ** dp : delta), dp)
    if (v !== correct) out.add(v)
  }
  return [...out]
}

// ------------------------------------------------------------- generator DSL
import type { ItemGenerator } from '@/engine/registry'
/** Short-hand generator constructor: G('bidmas.basic', 'number.bidmas', [1,3], (rng, d) => ...). */
export const G = (id: string, skill: string, levels: [number, number], generate: ItemGenerator['generate']): ItemGenerator => ({
  id: `maths.${id}`,
  skillId: `maths.${skill}`,
  levels,
  generate,
})
