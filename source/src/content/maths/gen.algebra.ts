import type { ItemGenerator } from '@/engine/registry'
import type { CommonError, Figure } from '@/engine/types'
import { F, G, choice, expr, gcd, lin, linA, m, mp, multi, num, round } from './helpers'

const ex = (tag: string, message: string, ...values: number[]): CommonError => ({ tag, message, values })
const ee = (tag: string, message: string, e: string): CommonError => ({ tag, message, expr: e })

/** 'ax^2+bx+c' ASCII (for answers) - skips zero terms, handles signs. */
function polyA(a: number, b: number, c: number, v = 'x'): string {
  const parts: string[] = []
  const term = (coef: number, body: string) => {
    if (coef === 0) return
    const abs = Math.abs(coef)
    const mag = body === '' ? String(abs) : abs === 1 ? body : `${abs}${body}`
    parts.push(`${coef < 0 ? '-' : parts.length ? '+' : ''}${mag}`)
  }
  term(a, `${v}^2`)
  term(b, v)
  term(c, '')
  return parts.join('') || '0'
}
/** Pretty version with proper minus signs for prompts. */
function polyR(a: number, b: number, c: number, v = 'x'): string {
  const parts: string[] = []
  const term = (coef: number, body: string) => {
    if (coef === 0) return
    const abs = Math.abs(coef)
    const mag = body === '' ? String(abs) : abs === 1 ? body : `${abs}${body}`
    parts.push(parts.length === 0 ? `${coef < 0 ? '−' : ''}${mag}` : `${coef < 0 ? '−' : '+'} ${mag}`)
  }
  term(a, `${v}^{2}`)
  term(b, v)
  term(c, '')
  return parts.join(' ') || '0'
}

function coprimePair(rng: { int(a: number, b: number): number }, lo: number, hi: number): [number, number] {
  for (;;) {
    const p = rng.int(lo, hi)
    const q = rng.int(lo, hi)
    if (p !== q && gcd(p, q) === 1) return [p, q]
  }
}

/** Figure helper: an infinite-looking line y = mx + c across a grid. */
export function lineFigure(mm: number, c: number, range: number, points: { x: number; y: number; label?: string }[] = []): Figure {
  const x0 = -range
  const x1 = range
  return {
    type: 'coord-grid',
    xRange: [-range, range],
    yRange: [-range, range],
    points,
    lines: [{ from: [x0, mm * x0 + c], to: [x1, mm * x1 + c] }],
  }
}

export const algebraGenerators: ItemGenerator[] = [
  // ============================================================= NOTATION (Y7)
  G('an.express', 'algebra.notation', [1, 3], (rng, d) => {
    const v = rng.pick(['n', 'x', 'a', 'p'])
    const k = rng.int(2, 9)
    type Q = { text: string; correct: string; wrong: (string | { label: string; misconception: string; feedback: string })[] }
    const set: Record<number, Q[]> = {
      1: [
        { text: `${k} more than ${v}`, correct: `${v} + ${k}`, wrong: [{ label: `${k}${v}`, misconception: 'juxtaposition-means-add', feedback: `${k}${v} means ${k} TIMES ${v}. "More than" means add.` }, `${v} − ${k}`, `${k} − ${v}`] },
        { text: `${k} times ${v}`, correct: `${k}${v}`, wrong: [{ label: `${v} + ${k}`, misconception: 'times-as-plus', feedback: 'In algebra, a number next to a letter means multiply.' }, `${v}^{${k}}`, `${k} + ${v}`] },
        { text: `${v} divided by ${k}`, correct: F(v, k), wrong: [{ label: F(k, v), misconception: 'division-reversed', feedback: `"${v} divided by ${k}" puts ${v} on the top.` }, `${k}${v}`, `${v} − ${k}`] },
        { text: `${k} less than ${v}`, correct: `${v} − ${k}`, wrong: [{ label: `${k} − ${v}`, misconception: 'subtraction-reversed', feedback: `"${k} less than ${v}" means take ${k} away FROM ${v}.` }, `${k}${v}`, `${v} + ${k}`] },
      ],
      2: [
        { text: `double ${v}, then add ${k}`, correct: `2${v} + ${k}`, wrong: [{ label: `2(${v} + ${k})`, misconception: 'bracket-misplaced', feedback: `Only the ${v} is doubled - the ${k} is added afterwards.` }, `${2 * k}${v}`, `${v} + ${2 + k}`] },
        { text: `add ${k} to ${v}, then multiply the result by 3`, correct: `3(${v} + ${k})`, wrong: [{ label: `3${v} + ${k}`, misconception: 'bracket-missing', feedback: 'The whole sum is multiplied by 3, so it needs brackets.' }, `${v} + ${3 * k}`, `3 + ${v} + ${k}`] },
        { text: `${k} times ${v}, then subtract 4`, correct: `${k}${v} − 4`, wrong: [{ label: `${k}(${v} − 4)`, misconception: 'bracket-misplaced', feedback: `Only ${v} is multiplied by ${k}.` }, `4 − ${k}${v}`, `${k + 4}${v}`] },
      ],
      3: [
        { text: `Pens cost £${v} each. Write the cost, in pounds, of ${k} pens.`, correct: `${k}${v}`, wrong: [`${v} + ${k}`, F(v, k), `${v}^{${k}}`] },
        { text: `Tom is ${v} years old. His sister is ${k} years younger. Write his sister's age.`, correct: `${v} − ${k}`, wrong: [`${k} − ${v}`, `${v} + ${k}`, `${k}${v}`] },
        { text: `A square has sides of length ${v} cm. Write an expression for its perimeter.`, correct: `4${v}`, wrong: [{ label: `${v}^{2}`, misconception: 'area-not-perimeter', feedback: 'That is the area. Perimeter adds the four sides.' }, `${v} + 4`, `2${v}`] },
        { text: `A bag has ${v} sweets. ${k} friends each take 2 sweets. How many are left?`, correct: `${v} − ${2 * k}`, wrong: [`${v} − ${k}`, `${v} − 2`, `2${k}${v}`] },
      ],
    }
    const q = rng.pick(set[d] as Q[])
    return choice({
      rng,
      prompt: d === 3 ? q.text : `Which expression means "${q.text}"?`,
      correct: q.correct,
      wrong: q.wrong,
      hint: 'Try it with a number: pretend the letter is 10 and see what each option gives.',
      explanation: `The correct expression is ${q.correct}.`,
    })
  }),
  G('an.substitute', 'algebra.notation', [1, 4], (rng, d) => {
    if (d === 1) {
      const a = rng.int(2, 9)
      const n = rng.int(2, 9)
      return num({ prompt: `Find the value of ${a}n when n = ${n}.`, answer: a * n, hint: `${a}n means ${a} × n.`, explanation: `${a} × ${n} = ${a * n}.`, errors: [ex('juxtaposition-as-digits', `${a}n means ${a} TIMES n, not the digits ${a} and ${n} next to each other.`, Number(`${a}${n}`))] })
    }
    if (d === 2) {
      const a = rng.int(2, 6)
      const b = rng.int(1, 9)
      const n = rng.int(2, 9)
      const plus = rng.chance(0.6)
      return num({ prompt: `Find the value of ${a}n ${plus ? '+' : '−'} ${b} when n = ${n}.`, answer: plus ? a * n + b : a * n - b, hint: 'Multiply first, then add or subtract.', explanation: `${a} × ${n} = ${a * n}; ${plus ? a * n + b : a * n - b}.` })
    }
    if (d === 3) {
      const a = rng.int(2, 5)
      const n = rng.int(2, 5)
      return num({
        prompt: `Find the value of ${a}n^{2} when n = ${n}.`,
        answer: a * n * n,
        hint: 'Square the n first, then multiply by the number in front.',
        explanation: `n² = ${n * n}, then ${a} × ${n * n} = ${a * n * n}.`,
        errors: [ex('squared-whole-term', `Only the n is squared - not the ${a}.`, (a * n) ** 2), ex('squared-as-doubled', 'Squaring is n × n, not n × 2.', a * n * 2)],
      })
    }
    const a = rng.int(2, 6)
    const b = rng.int(2, 6)
    const p = rng.int(2, 6)
    const q = rng.int(2, 6)
    return num({ prompt: `Find the value of ${a}p + ${b}q^{2} when p = ${p} and q = ${q}.`, answer: a * p + b * q * q, hint: 'Substitute both letters, then follow BIDMAS: squares first.', explanation: `${a} × ${p} = ${a * p}; ${q}² = ${q * q}, ${b} × ${q * q} = ${b * q * q}. Total ${a * p + b * q * q}.` })
  }),

  // ========================================================= SIMPLIFYING (Y7)
  G('as.collect', 'algebra.simplifying', [1, 5], (rng, d) => {
    const v = rng.pick(['x', 'n', 'a', 'y'])
    if (d === 1) {
      const a = rng.int(2, 9)
      const b = rng.int(2, 9)
      return expr({ prompt: `Simplify  ${a}${v} + ${b}${v}`, answer: `${a + b}${v}`, variables: [v], form: 'simplified', hint: 'These are like terms - add the numbers in front.', explanation: `${a}${v} + ${b}${v} = ${a + b}${v}.` })
    }
    if (d === 2) {
      const a = rng.int(2, 9)
      const b = rng.int(2, 9)
      const c = rng.int(1, 9)
      const e = rng.int(1, c + 4)
      return expr({
        prompt: `Simplify  ${a}${v} + ${c} + ${b}${v} − ${e}`,
        answer: linA(a + b, c - e, v),
        variables: [v],
        form: 'simplified',
        hint: `Collect the ${v} terms together and the plain numbers together.`,
        explanation: `${v} terms: ${a}${v} + ${b}${v} = ${a + b}${v}. Numbers: ${c} − ${e} = ${c - e}. So ${lin(a + b, c - e, v)}.`,
        errors: [ee('combined-unlike-terms', `${v} terms and plain numbers cannot be added together.`, `${a + b + c - e}${v}`)],
      })
    }
    if (d === 3) {
      const [a, b, c, e] = [rng.int(2, 6), rng.int(2, 6), rng.int(2, 6), rng.int(1, 5)]
      return expr({
        prompt: `Simplify  ${a}a + ${b}b + ${c}a − ${e}b`,
        answer: `${a + c}a${b - e === 0 ? '' : b - e > 0 ? `+${b - e === 1 ? '' : b - e}b` : `${b - e === -1 ? '-' : b - e}b`}`,
        variables: ['a', 'b'],
        form: 'simplified',
        hint: 'a terms with a terms, b terms with b terms.',
        explanation: `a: ${a}a + ${c}a = ${a + c}a. b: ${b}b − ${e}b = ${b - e}b.`,
        errors: [ee('combined-unlike-terms', 'a and b are different letters - you cannot combine them.', `${a + b + c - e}ab`)],
      })
    }
    if (d === 4) {
      const [a, b, c, e] = [rng.int(2, 6), rng.int(2, 6), rng.int(1, 3), rng.int(2, 6)]
      const sq = a - c
      return expr({
        prompt: `Simplify  ${a}n^{2} + ${b}n − ${c === 1 ? '' : c}n^{2} + ${e}n`,
        answer: polyA(sq, b + e, 0, 'n'),
        variables: ['n'],
        form: 'simplified',
        hint: 'n² terms and n terms are different - keep them apart.',
        explanation: `n²: ${a} − ${c} = ${sq}. n: ${b} + ${e} = ${b + e}. So ${polyR(sq, b + e, 0, 'n')}.`,
        errors: [ee('combined-squared-and-linear', 'n² and n are different types of term - they cannot be added.', `${a + b - c + e}n^2`)],
      })
    }
    const kind = rng.int(0, 2)
    if (kind === 0) {
      const [a, b] = [rng.int(2, 6), rng.int(2, 6)]
      return expr({ prompt: `Simplify  ${a}x × ${b}x`, answer: `${a * b}x^2`, variables: ['x'], form: 'simplified', hint: 'Multiply the numbers, then multiply the letters: x × x = x².', explanation: `${a} × ${b} = ${a * b} and x × x = x², so ${a * b}x².`, errors: [ee('added-not-multiplied', 'x × x is x², not 2x.', `${a * b}x`)] })
    }
    if (kind === 1) {
      const [a, b] = [rng.int(2, 6), rng.int(2, 6)]
      return expr({ prompt: `Simplify  ${a}a × ${b}b`, answer: `${a * b}ab`, variables: ['a', 'b'], form: 'simplified', hint: 'Multiply the numbers, then write the letters together.', explanation: `${a} × ${b} = ${a * b}, so ${a * b}ab.` })
    }
    const [q, k] = [rng.int(2, 5), rng.int(2, 5)]
    return expr({ prompt: `Simplify  ${q * k * 3}xy ÷ ${k}x`, answer: `${q * 3}y`, variables: ['x', 'y'], form: 'simplified', hint: 'Divide the numbers, then cancel the letters that appear on both parts.', explanation: `${q * k * 3} ÷ ${k} = ${q * 3}, and the x cancels, leaving ${q * 3}y.` })
  }),
  G('as.difference', 'algebra.simplifying', [1, 2], (rng, d) => {
    const v = rng.pick(['n', 'x', 'a'])
    const val = rng.int(3, 6)
    const set = [
      { prompt: `Which expression means ${v} × ${v}?`, correct: `${v}^{2}`, wrong: [{ label: `2${v}`, misconception: 'squared-means-double', feedback: `2${v} means ${v} + ${v} (or 2 × ${v}). Squared means ${v} × ${v}.` }, `${v} + 2`, `${v}${v}${v}`] },
      { prompt: `Which expression means ${v} + ${v}?`, correct: `2${v}`, wrong: [{ label: `${v}^{2}`, misconception: 'doubling-as-squaring', feedback: `${v}² means ${v} × ${v}. Adding ${v} to itself gives 2${v}.` }, `${v} + 2`, `${v}${v}`] },
      { prompt: `When ${v} = ${val}, what is the value of ${v}^{2}?`, correct: String(val * val), wrong: [{ label: String(val * 2), misconception: 'squared-means-double', feedback: `${v}² = ${v} × ${v} = ${val} × ${val}, not ${val} × 2.` }, String(val + 2), String(val * val * val)] },
      { prompt: `When ${v} = ${val}, what is the value of 2${v}?`, correct: String(2 * val), wrong: [{ label: String(val * val), misconception: 'doubling-as-squaring', feedback: `2${v} means 2 × ${v}.` }, String(val + 2), `2${val}`] },
    ]
    const q = rng.pick(d === 1 ? set.slice(0, 2) : set)
    return choice({ rng, prompt: q.prompt, correct: q.correct, wrong: q.wrong, hint: 'Substitute a number to test which one fits.', explanation: `The correct answer is ${q.correct}.` })
  }),

  // ======================================================= SINGLE BRACKETS (Y7)
  G('br.expand', 'algebra.single-brackets', [1, 5], (rng, d) => {
    if (d === 1) {
      const a = rng.int(2, 9)
      const b = rng.int(2, 9)
      return expr({
        prompt: `Expand  ${a}(x + ${b})`,
        answer: linA(a, a * b),
        variables: ['x'],
        form: 'expanded',
        hint: `Multiply EVERYTHING inside the bracket by ${a}.`,
        explanation: `${a} × x = ${a}x and ${a} × ${b} = ${a * b}. So ${lin(a, a * b)}.`,
        errors: [ee('bracket-second-term', `You multiplied x by ${a} but forgot to multiply the ${b}.`, `${a}x+${b}`)],
      })
    }
    if (d === 2) {
      const a = rng.int(2, 6)
      const b = rng.int(2, 5)
      const c = rng.int(1, 9)
      const minus = rng.chance(0.5)
      return expr({
        prompt: `Expand  ${a}(${b}x ${minus ? '−' : '+'} ${c})`,
        answer: linA(a * b, minus ? -a * c : a * c),
        variables: ['x'],
        form: 'expanded',
        hint: `Multiply each term inside by ${a}. Keep the sign in front of each term.`,
        explanation: `${a} × ${b}x = ${a * b}x; ${a} × ${c} = ${a * c}. So ${lin(a * b, minus ? -a * c : a * c)}.`,
        errors: [ee('bracket-second-term', `Multiply both terms inside the bracket by ${a}.`, linA(a * b, minus ? -c : c))],
      })
    }
    if (d === 3) {
      if (rng.chance(0.5)) {
        const b = rng.int(2, 9)
        return expr({ prompt: `Expand  x(x + ${b})`, answer: `x^2+${b}x`, variables: ['x'], form: 'expanded', hint: 'x × x = x². Then x × the second term.', explanation: `x × x = x² and x × ${b} = ${b}x.`, errors: [ee('bracket-second-term', 'Multiply x by BOTH terms in the bracket.', `x^2+${b}`)] })
      }
      const a = rng.int(2, 6)
      const b = rng.int(2, 6)
      const c = rng.int(2, 9)
      return expr({ prompt: `Expand  ${a}(${b}x − ${c})`, answer: linA(a * b, -a * c), variables: ['x'], form: 'expanded', hint: 'Watch the minus sign.', explanation: `${a * b}x − ${a * c}.` })
    }
    if (d === 4) {
      const [a, b, c, e] = [rng.int(2, 5), rng.int(1, 6), rng.int(2, 5), rng.int(1, 6)]
      return expr({
        prompt: `Expand and simplify  ${a}(x + ${b}) + ${c}(x + ${e})`,
        answer: linA(a + c, a * b + c * e),
        variables: ['x'],
        form: 'expanded',
        hint: 'Expand each bracket first, then collect like terms.',
        explanation: `${lin(a, a * b)} + ${lin(c, c * e)} = ${lin(a + c, a * b + c * e)}.`,
      })
    }
    const a = rng.int(2, 4)
    const b = rng.int(2, 4)
    const p = rng.int(1, 5)
    const c = rng.int(2, 3)
    const q = rng.int(1, 5)
    const x1 = a * b - c
    const k = -a * p + c * q
    return expr({
      prompt: `Expand and simplify  ${a}(${b}x − ${p}) − ${c}(x − ${q})`,
      answer: linA(x1, k),
      variables: ['x'],
      form: 'expanded',
      hint: 'Take care: the minus in front of the second bracket changes BOTH signs inside it.',
      explanation: `${lin(a * b, -a * p)} − ${lin(c, -c * q)} = ${lin(x1, k)}.`,
      errors: [ee('negative-bracket-sign', 'The minus outside the second bracket multiplies both terms, so the second term changes sign too.', linA(x1, -a * p - c * q))],
    })
  }),

  // ===================================================== SOLVING EQUATIONS (Y7)
  G('eq.solve', 'algebra.solving-equations', [1, 5], (rng, d) => {
    const x = rng.int(2, 12)
    if (d === 1) {
      const a = rng.int(2, 15)
      const plus = rng.chance(0.5)
      return num({ prompt: `Solve  x ${plus ? '+' : '−'} ${a} = ${plus ? x + a : x - a}`, prefix: 'x =', answer: x, hint: `Do the inverse: ${plus ? 'subtract' : 'add'} ${a} on both sides.`, explanation: `x = ${plus ? x + a : x - a} ${plus ? '−' : '+'} ${a} = ${x}.` })
    }
    if (d === 2) {
      const a = rng.int(2, 9)
      if (rng.chance(0.5)) return num({ prompt: `Solve  ${a}x = ${a * x}`, prefix: 'x =', answer: x, hint: `Divide both sides by ${a}.`, explanation: `x = ${a * x} ÷ ${a} = ${x}.` })
      return num({ prompt: `Solve  ${F('x', a)} = ${x}`, prefix: 'x =', answer: x * a, hint: `Multiply both sides by ${a}.`, explanation: `x = ${x} × ${a} = ${x * a}.` })
    }
    if (d === 3) {
      const a = rng.int(2, 6)
      const b = rng.int(1, 12)
      const c = a * x + b
      const wrong = c / a - b
      return num({
        prompt: `Solve  ${a}x + ${b} = ${c}`,
        prefix: 'x =',
        answer: x,
        hint: `Undo the + ${b} first, then undo the × ${a}.`,
        explanation: `${c} − ${b} = ${a * x}, then ÷ ${a} = ${x}.`,
        errors: [ex('inverse-order', `Undo the addition FIRST (subtract ${b}), and only then divide by ${a}.`, wrong)],
      })
    }
    if (d === 4) {
      if (rng.chance(0.5)) {
        const a = rng.int(2, 7)
        const b = rng.int(1, 9)
        const c = a * x - b
        return num({ prompt: `Solve  ${a}x − ${b} = ${c}`, prefix: 'x =', answer: x, hint: `Add ${b} to both sides, then divide by ${a}.`, explanation: `${c} + ${b} = ${a * x}; ÷ ${a} = ${x}.`, errors: [ex('inverse-order', `Undo the subtraction first (add ${b}), then divide.`, c / a + b)] })
      }
      const a = rng.int(2, 5)
      const b = rng.int(1, 9)
      return num({ prompt: `Solve  ${F('x', a)} + ${b} = ${x + b}`, prefix: 'x =', answer: x * a, hint: `Subtract ${b} first, then multiply by ${a}.`, explanation: `${x + b} − ${b} = ${x}; × ${a} = ${x * a}.` })
    }
    if (rng.chance(0.5)) {
      const a = rng.int(2, 5)
      const b = rng.int(1, 8)
      return num({ prompt: `Solve  ${F(`x + ${b}`, a)} = ${x}`, prefix: 'x =', answer: a * x - b, hint: `Multiply both sides by ${a}, then subtract ${b}.`, explanation: `x + ${b} = ${a * x}, so x = ${a * x - b}.` })
    }
    const a = rng.int(2, 4)
    const y = rng.int(1, 6)
    const c = rng.int(1, 9)
    return num({ prompt: `Solve  ${a + c} − ${a}x = ${m(a + c - a * y)}`, prefix: 'x =', answer: y, hint: 'Subtract from both sides to get the x term alone, and be careful with the sign.', explanation: `${a + c} − ${a}x = ${a + c - a * y} → ${a}x = ${a * y} → x = ${y}.` })
  }),

  // ============================================================ SEQUENCES (Y7)
  G('sq.next', 'algebra.sequences', [1, 3], (rng, d) => {
    const start = rng.int(2, 30)
    if (d === 1 || d === 2) {
      const step = rng.int(2, d === 1 ? 6 : 9) * (d === 2 ? -1 : 1)
      const s0 = d === 2 ? start + 40 : start
      const terms = [0, 1, 2, 3].map((i) => s0 + step * i)
      return num({ prompt: `Find the next term in the sequence:  ${terms.join(', ')}, ...`, answer: s0 + step * 4, hint: `Work out the difference between neighbouring terms: it is ${step}.`, explanation: `The rule is ${step > 0 ? '+' : '−'}${Math.abs(step)}. ${terms[3]} ${step > 0 ? '+' : '−'} ${Math.abs(step)} = ${s0 + step * 4}.` })
    }
    const step = rng.pick([0.3, 0.4, 0.5, 0.7, 1.5, 2.5])
    const s0 = rng.int(1, 9) / 2
    const terms = [0, 1, 2, 3].map((i) => round(s0 + step * i, 2))
    return num({ prompt: `Find the next term in the sequence:  ${terms.join(', ')}, ...`, answer: round(s0 + step * 4, 2), hint: 'Find the constant difference between terms - it may be a decimal.', explanation: `Difference ${step}. ${terms[3]} + ${step} = ${round(s0 + step * 4, 2)}.` })
  }),
  G('sq.term-n', 'algebra.sequences', [3, 4], (rng, d) => {
    const a = rng.int(2, 8)
    const b = rng.int(-3, 6)
    const n = rng.int(10, d === 3 ? 20 : 50)
    const terms = [1, 2, 3, 4].map((i) => a * i + b)
    return num({
      prompt: `A sequence starts  ${terms.join(', ')}, ...  and continues in the same way. What is the ${n}th term?`,
      answer: a * n + b,
      hint: `The sequence goes up in ${a}s, so the rule starts with ${a}n. Compare ${a}n with the first term to find what to add or subtract.`,
      explanation: `nth term = ${lin(a, b, 'n')}. When n = ${n}: ${a} × ${n} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${a * n + b}.`,
      errors: b !== 0 ? [ex('missing-constant', `That is ${a} × ${n}. Check the first term - the rule needs a number added or subtracted too.`, a * n)] : undefined,
    })
  }),
  G('sq.nth-term', 'algebra.sequences', [3, 5], (rng, d) => {
    const dec = d === 5
    const a = (dec ? -1 : 1) * rng.int(2, 7)
    const b = rng.int(dec ? 10 : -4, dec ? 30 : 9)
    const terms = [1, 2, 3, 4].map((i) => a * i + b)
    return expr({
      prompt: `Find the nth term of the sequence  ${terms.map(m).join(', ')}, ...`,
      answer: linA(a, b, 'n'),
      prefix: 'nth term =',
      variables: ['n'],
      form: 'simplified',
      hint: `Find the difference (${a}). The rule begins ${a}n. Now compare ${a}n to the first term.`,
      explanation: `Difference = ${a}, so ${a}n. First term ${terms[0]} − ${a} = ${b}. nth term = ${lin(a, b, 'n')}.`,
      errors: [
        ...(b !== 0 ? [ee('missing-constant', 'Good, the n-part is right - but compare with the first term to find the number to add or subtract.', `${a}n`)] : []),
        ee('used-difference-as-add', `The difference goes in front of n as a multiplier: ${a}n, not n + ${a}.`, `n+${a}`),
      ],
    })
  }),
  G('sq.which-term', 'algebra.sequences', [5, 5], (rng) => {
    const a = rng.int(2, 7)
    const b = rng.int(1, 9)
    const n = rng.int(8, 30)
    if (rng.chance(0.6)) {
      return num({ prompt: `The nth term of a sequence is ${lin(a, b, 'n')}. Which term in the sequence is equal to ${a * n + b}?`, prefix: 'n =', answer: n, hint: `Solve ${a}n + ${b} = ${a * n + b}.`, explanation: `${a * n + b} − ${b} = ${a * n}, ÷ ${a} = ${n}. It is term number ${n}.` })
    }
    const inSeq = rng.chance(0.5)
    const target = inSeq ? a * n + b : a * n + b + rng.int(1, a - 1)
    return choice({
      rng,
      keepOrder: true,
      prompt: `The nth term of a sequence is ${lin(a, b, 'n')}. Is ${target} a term in this sequence?`,
      correct: inSeq ? 'Yes' : 'No',
      wrong: [inSeq ? 'No' : 'Yes'],
      hint: `Solve ${a}n + ${b} = ${target}. If n is a whole number, it is in the sequence.`,
      explanation: `${target} − ${b} = ${target - b}; ÷ ${a} = ${round((target - b) / a, 3)}. ${inSeq ? 'A whole number, so yes.' : 'Not a whole number, so no.'}`,
    })
  }),

  // ========================================================= FACTORISING (Y8)
  G('fac.common', 'algebra.factorising', [1, 5], (rng, d) => {
    let g: number
    let p: number
    let q: number
    let poly: string
    let ans: string
    let factor: string
    let promptExpr: string
    if (d === 1) {
      g = rng.int(2, 9)
      q = rng.int(2, 9)
      promptExpr = lin(g, g * q)
      poly = linA(g, g * q)
      ans = `${g}(x+${q})`
      factor = String(g)
    } else if (d === 2) {
      g = rng.int(2, 6)
      ;[p, q] = coprimePair(rng, 2, 6)
      promptExpr = lin(g * p, g * q)
      poly = linA(g * p, g * q)
      ans = `${g}(${linA(p, q)})`
      factor = String(g)
    } else if (d === 3) {
      if (rng.chance(0.5)) {
        q = rng.int(2, 9)
        promptExpr = `x^{2} + ${q}x`
        poly = `x^2+${q}x`
        ans = `x(x+${q})`
        factor = 'x'
      } else {
        g = rng.int(2, 9)
        q = rng.int(2, 9)
        promptExpr = lin(g, -g * q)
        poly = linA(g, -g * q)
        ans = `${g}(x-${q})`
        factor = String(g)
      }
    } else if (d === 4) {
      g = rng.int(2, 6)
      if (rng.chance(0.5)) {
        ;[p, q] = coprimePair(rng, 2, 6)
        promptExpr = lin(g * p, -g * q)
        poly = linA(g * p, -g * q)
        ans = `${g}(${linA(p, -q)})`
        factor = String(g)
      } else {
        q = rng.int(2, 6)
        promptExpr = `${g}x^{2} + ${g * q}x`
        poly = `${g}x^2+${g * q}x`
        ans = `${g}x(x+${q})`
        factor = `${g}x`
      }
    } else {
      g = rng.int(2, 5)
      ;[p, q] = coprimePair(rng, 2, 5)
      const neg = rng.chance(0.5) ? -1 : 1
      promptExpr = `${g * p}x^{2} ${neg < 0 ? '−' : '+'} ${g * q}x`
      poly = `${g * p}x^2${neg < 0 ? '-' : '+'}${g * q}x`
      ans = `${g}x(${p}x${neg < 0 ? '-' : '+'}${q})`
      factor = `${g}x`
    }
    return expr({
      prompt: `Factorise fully  ${promptExpr}`,
      answer: ans,
      variables: ['x'],
      form: 'factorised',
      expectedFactor: factor,
      hint: 'Find the biggest number (and letter) that goes into every term. Write it outside the bracket.',
      explanation: `The highest common factor is ${factor}. ${promptExpr} = ${ans.replace(/\^2/g, '²')}. Check by expanding.`,
      errors: [ee('partial-factorise', 'That is a start, but there is a bigger common factor you can take out.', poly)],
    })
  }),
  G('fac.choose', 'algebra.factorising', [2, 4], (rng, d) => {
    const g = rng.int(2, 6)
    const [p, q] = coprimePair(rng, 2, 5)
    const full = `${g}(${lin(p, q)})`
    const wrong: { label: string; misconception?: string; feedback?: string }[] = []
    const f = [...Array(g).keys()].map((i) => i + 1).filter((k) => k > 1 && k < g && g % k === 0)
    for (const k of f) wrong.push({ label: `${k}(${lin((g / k) * p, (g / k) * q)})`, misconception: 'partial-factorise', feedback: `That is correct so far, but you can still take a common factor out of the bracket.` })
    wrong.push({ label: lin(g * p, g * q), misconception: 'not-factorised', feedback: 'That is the original expression - no factor has been taken out.' })
    wrong.push({ label: `${g}(${lin(p, q)}) + ${g}`, misconception: 'wrong-expansion', feedback: 'Expanding this does not give the original expression.' })
    if (d >= 3) wrong.push({ label: `${g * p}(x + ${q})`, misconception: 'wrong-factor', feedback: `${g * p} does not divide into ${g * q}.` })
    return choice({
      rng,
      prompt: `Which of these is ${lin(g * p, g * q)} written in FULLY factorised form?`,
      correct: full,
      wrong,
      hint: 'Expand each option to check it gives the original - then see if a bigger factor can be taken out.',
      explanation: `${lin(g * p, g * q)} = ${full}. The HCF of ${g * p} and ${g * q} is ${g}.`,
    })
  }),

  // ==================================================== COMPLEX EQUATIONS (Y8)
  G('ce.both-sides', 'algebra.complex-equations', [1, 5], (rng, d) => {
    let promptEq = ''
    let x0 = 0
    let err: number | undefined
    let explanation = ''
    if (d <= 2 || d === 4) {
      const neg = d === 4
      x0 = neg ? -rng.int(1, 8) : rng.int(1, 9)
      const c = rng.int(1, 4)
      const a = c + rng.int(1, 5)
      const b = d === 1 ? rng.int(1, 8) : rng.int(-8, 8)
      const dd = b + (a - c) * x0
      promptEq = `${lin(a, b)} = ${lin(c, dd)}`
      err = (dd + b) / (a - c)
      explanation = `Subtract ${c === 1 ? 'x' : `${c}x`} from both sides: ${lin(a - c, b)} = ${dd}. Then ${b === 0 ? '' : `${b > 0 ? 'subtract' : 'add'} ${Math.abs(b)}: ${(a - c) === 1 ? 'x' : `${a - c}x`} = ${dd - b}. Then `}divide by ${a - c}: x = ${x0}.`
    } else if (d === 3) {
      x0 = rng.int(1, 8)
      const c = rng.int(1, 3)
      const a = c + rng.int(1, 4)
      const p = rng.int(1, 6)
      const dd = a * p + (a - c) * x0
      promptEq = `${a}(x + ${p}) = ${lin(c, dd)}`
      explanation = `Expand: ${a}x + ${a * p} = ${lin(c, dd)}. Subtract ${c === 1 ? 'x' : `${c}x`}: ${lin(a - c, a * p)} = ${dd}. So ${a - c === 1 ? 'x' : `${a - c}x`} = ${dd - a * p}, x = ${x0}.`
    } else {
      for (;;) {
        const a = rng.int(2, 4)
        const b = rng.int(2, 3)
        const c = rng.int(2, 5)
        const p = rng.int(1, 6)
        const q = rng.int(1, 6)
        const den = a * b - c
        if (den === 0) continue
        const numr = c * q + a * p
        if (numr % den !== 0) continue
        x0 = numr / den
        if (x0 === 0 || Math.abs(x0) > 12) continue
        promptEq = `${a}(${b === 1 ? '' : b}x − ${p}) = ${c}(x + ${q})`
        explanation = `Expand both: ${lin(a * b, -a * p)} = ${lin(c, c * q)}. Collect x terms and numbers: ${a * b - c}x = ${c * q + a * p}. So x = ${x0}.`
        break
      }
    }
    return num({
      prompt: `Solve  ${promptEq}`,
      prefix: 'x =',
      answer: x0,
      hint: 'Get all the x terms on one side (subtract the smaller x-term from both sides), then solve the two-step equation that is left.',
      explanation,
      errors: err !== undefined && Number.isFinite(err) ? [ex('sign-when-moving-terms', 'When you move a term to the other side, its sign changes - check the sign of your number terms.', err)] : undefined,
    })
  }),

  // ======================================================== LINEAR GRAPHS (Y8)
  G('lg.read', 'algebra.linear-graphs', [1, 2], (rng, d) => {
    const x = rng.int(d === 1 ? 1 : -6, 6)
    const y = rng.int(d === 1 ? -6 : -6, 6)
    return multi({
      prompt: 'What are the coordinates of point P?',
      figure: { type: 'coord-grid', xRange: [-7, 7], yRange: [-7, 7], points: [{ x, y, label: 'P' }] },
      fields: [{ answer: x, label: 'x' }, { answer: y, label: 'y' }],
      template: '({0}, {1})',
      hint: 'Read along the x-axis first (left is negative), then up or down the y-axis.',
      explanation: `P is at (${x}, ${y}).`,
      errors: x !== y ? [ex('coordinates-swapped', 'The x-coordinate (across) comes first, then the y-coordinate (up/down).', y, x)] : undefined,
    })
  }),
  G('lg.table-value', 'algebra.linear-graphs', [2, 3], (rng, d) => {
    const mm = rng.int(-4, 5) || 2
    const c = rng.int(-6, 6)
    const x = -rng.int(1, 5)
    const y = mm * x + c
    return num({
      prompt: `A line has the equation  y = ${lin(mm, c)}.  Find y when x = ${m(x)}.`,
      prefix: 'y =',
      answer: y,
      hint: `Replace x with ${m(x)} - use brackets: ${mm}(${m(x)}). Take care with negatives.`,
      explanation: `y = ${mm} × (${m(x)}) ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${m(mm * x)} ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${m(y)}.`,
      errors: d === 3 ? [ex('ignored-negative', 'x is negative - substitute its sign too.', mm * -x + c)] : undefined,
    })
  }),
  G('lg.mc', 'algebra.linear-graphs', [2, 3], (rng) => {
    const mm = rng.int(-5, 6) || 3
    const c = rng.int(-7, 8) || 4
    const askGrad = rng.chance(0.5)
    return num({
      prompt: `For the line  y = ${lin(mm, c)}:  what is the ${askGrad ? 'gradient (m)' : 'y-intercept (where it crosses the y-axis)'}?`,
      answer: askGrad ? mm : c,
      hint: 'In y = mx + c: m is the number multiplying x (gradient) and c is the number on its own (y-intercept).',
      explanation: `In y = mx + c, m = ${mm} and c = ${c}.`,
      errors: [ex('m-and-c-swapped', 'You have swapped m and c. m multiplies x; c stands alone.', askGrad ? c : mm)],
    })
  }),
  G('lg.gradient', 'algebra.linear-graphs', [3, 4], (rng, d) => {
    const mm = rng.pick([-3, -2, -1, 1, 2, 3])
    const c = rng.int(-2, 3)
    const x1 = rng.int(-3, 0)
    const dx = rng.int(1, 2)
    const x2 = x1 + dx
    const p1 = { x: x1, y: mm * x1 + c, label: 'A' }
    const p2 = { x: x2, y: mm * x2 + c, label: 'B' }
    if (d === 3) {
      return num({
        prompt: `A straight line passes through A(${x1}, ${m(p1.y)}) and B(${x2}, ${m(p2.y)}). What is its gradient?`,
        figure: lineFigure(mm, c, 7, [p1, p2]),
        answer: mm,
        hint: 'Gradient = change in y ÷ change in x. Go from A to B.',
        explanation: `Change in y = ${m(p2.y - p1.y)}, change in x = ${dx}. ${m(p2.y - p1.y)} ÷ ${dx} = ${m(mm)}.`,
        errors: Math.abs(mm) !== 1 ? [ex('gradient-upside-down', 'You divided x by y. Gradient is CHANGE IN Y over CHANGE IN X.', dx / (p2.y - p1.y))] : undefined,
      })
    }
    const xb = rng.int(1, 3)
    const B = { x: xb, y: mm * xb + c, label: 'B' }
    return expr({
      prompt: `This line crosses the y-axis at (0, ${m(c)}) and passes through B(${xb}, ${m(B.y)}). Write the equation of the line in the form y = mx + c.`,
      figure: lineFigure(mm, c, 7, [{ x: 0, y: c, label: 'C' }, B]),
      prefix: 'y =',
      answer: linA(mm, c),
      variables: ['x'],
      form: 'simplified',
      hint: 'c is where it crosses the y-axis. Find the gradient m from the two points.',
      explanation: `c = ${m(c)}. Gradient = (${m(B.y)} − ${m(c)}) ÷ ${xb} = ${m(mm)}. So y = ${lin(mm, c)}.`,
    })
  }),
  G('lg.on-line', 'algebra.linear-graphs', [3, 4], (rng) => {
    const mm = rng.int(2, 5)
    const c = rng.int(-4, 5)
    const x = rng.int(-3, 4)
    const y = mm * x + c
    const wrong = [`(${m(x)}, ${m(y + rng.int(1, 3))})`, `(${m(y)}, ${m(x)})`, `(${m(x + 1)}, ${m(y)})`, `(${m(-x)}, ${m(y)})`].filter((s) => s !== `(${m(x)}, ${m(y)})`)
    return choice({
      rng,
      prompt: `Which of these points lies on the line  y = ${lin(mm, c)}?`,
      correct: `(${m(x)}, ${m(y)})`,
      wrong,
      hint: 'Substitute the x-value of each point into the equation and see if you get the given y-value.',
      explanation: `When x = ${m(x)}: y = ${mm} × ${mp(x)} ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${m(y)}. So (${m(x)}, ${m(y)}) is on the line.`,
    })
  }),

  // =================================================== REAL-LIFE GRAPHS (Y8)
  G('rl.journey', 'algebra.real-life-graphs', [1, 5], (rng, d) => {
    let out: { t1: number; s1: number; rest: number; t3: number; s3: number; back: boolean }
    for (;;) {
      const t1 = rng.int(1, 2)
      const s1 = rng.pick([20, 30, 40, 60])
      const rest = rng.int(1, 2)
      const back = d === 5
      const d1 = s1 * t1
      let t3: number
      let s3: number
      if (back) {
        t3 = rng.pick([1, 2].filter((t) => d1 % t === 0))
        s3 = d1 / t3
      } else {
        t3 = rng.int(1, 2)
        s3 = rng.pick([20, 30, 40, 60])
      }
      out = { t1, s1, rest, t3, s3, back }
      const total = d1 + (back ? -d1 : s3 * t3)
      const time = t1 + rest + t3
      if (d !== 4 || (total % time === 0 && total > 0)) break
    }
    const { t1, s1, rest, t3, s3, back } = out
    const d1 = s1 * t1
    const d2 = back ? 0 : d1 + s3 * t3
    const T = t1 + rest + t3
    const yMax = Math.ceil(Math.max(d1, d2) / 20) * 20 + 20
    const fig: Figure = {
      type: 'coord-grid',
      xRange: [0, T + 1],
      yRange: [0, yMax],
      xStep: 1,
      yStep: yMax > 100 ? 20 : 10,
      xLabel: 'Time (hours)',
      yLabel: 'Distance from home (km)',
      dots: true,
      lines: [
        { from: [0, 0], to: [t1, d1] },
        { from: [t1, d1], to: [t1 + rest, d1] },
        { from: [t1 + rest, d1], to: [T, d2] },
      ],
    }
    const story = 'The graph shows a cyclist\'s journey.'
    if (d === 1) return num({ prompt: `${story} How far from home was the cyclist after ${t1} hour${t1 > 1 ? 's' : ''}?`, figure: fig, answer: d1, suffix: 'km', hint: `Find ${t1} on the time axis, go up to the line, then across to the distance axis.`, explanation: `After ${t1} h the line is at ${d1} km.` })
    if (d === 2) return num({ prompt: `${story} For how many hours did the cyclist stop (stay still)?`, figure: fig, answer: rest, suffix: 'hours', hint: 'A flat (horizontal) section means the distance is not changing.', explanation: `The flat section runs from ${t1} h to ${t1 + rest} h: ${rest} hour${rest > 1 ? 's' : ''}.` })
    if (d === 3)
      return num({
        prompt: `${story} What was the cyclist's speed during the first part of the journey?`,
        figure: fig,
        answer: s1,
        suffix: 'km/h',
        hint: 'Speed = distance ÷ time. Use the first section of the graph.',
        explanation: `${d1} km in ${t1} h: ${d1} ÷ ${t1} = ${s1} km/h.`,
        errors: [ex('time-over-distance', 'Speed is DISTANCE divided by TIME.', t1 / d1)],
      })
    if (d === 4)
      return num({
        prompt: `${story} What was the cyclist's average speed for the whole journey, including the stop?`,
        figure: fig,
        answer: d2 / T,
        suffix: 'km/h',
        hint: 'Average speed = total distance ÷ total time (the stop counts as time!).',
        explanation: `Total distance ${d2} km, total time ${T} h. ${d2} ÷ ${T} = ${d2 / T} km/h.`,
        errors: [ex('ignored-the-stop', 'The time spent stopped still counts in the total time.', d2 / (T - rest))],
      })
    return num({
      prompt: `${story} In the last section the cyclist rides straight back home. What was the speed on the way back?`,
      figure: fig,
      answer: s3,
      suffix: 'km/h',
      hint: 'The distance covered is the drop in the graph. Speed = distance ÷ time.',
      explanation: `The graph drops ${d1} km in ${t3} h. ${d1} ÷ ${t3} = ${s3} km/h.`,
    })
  }),
  G('rl.convert', 'algebra.real-life-graphs', [2, 4], (rng, d) => {
    const [pounds, dollars] = rng.pick<[number, number]>([[40, 50], [40, 60], [20, 30], [60, 75]])
    const rate = dollars / pounds
    const fig: Figure = {
      type: 'coord-grid',
      xRange: [0, pounds * 2],
      yRange: [0, dollars * 2],
      xStep: pounds / 2,
      yStep: dollars / 2,
      xLabel: 'Pounds (£)',
      yLabel: 'Dollars ($)',
      dots: true,
      points: [{ x: pounds, y: dollars, label: `(${pounds}, ${dollars})` }],
      lines: [{ from: [0, 0], to: [pounds * 2, dollars * 2] }],
    }
    const story = 'This conversion graph changes pounds (£) to dollars ($).'
    if (d === 2) {
      const k = rng.pick([pounds / 2, pounds * 1.5])
      return num({ prompt: `${story} How many dollars is £${k}?`, figure: fig, answer: k * rate, prefix: '$', hint: 'Find £ on the bottom axis, up to the line, across to the $ axis.', explanation: `£${k} → $${k * rate} (rate: $${rate} per £1).` })
    }
    if (d === 3) {
      const k = rng.pick([10, 20, 30, 50, 70].filter((v) => (v * rate) % 0.5 === 0))
      return num({ prompt: `${story} The line passes through (${pounds}, ${dollars}). How many dollars is £${k}?`, figure: fig, answer: round(k * rate, 2), prefix: '$', hint: `Work out how many dollars £1 is worth first: ${dollars} ÷ ${pounds}.`, explanation: `£1 = $${rate}. £${k} × ${rate} = $${round(k * rate, 2)}.`, errors: [ex('wrong-direction', 'Check which axis is which: pounds go across, dollars go up.', round(k / rate, 2))] })
    }
    const k = rng.pick([10, 20, 30, 50].filter((v) => (v / rate) % 0.5 === 0))
    const usd = round(k, 2)
    return num({ prompt: `${story} The line passes through (${pounds}, ${dollars}). Convert $${usd} into pounds.`, figure: fig, answer: round(usd / rate, 2), prefix: '£', hint: 'Now you are going from dollars to pounds: divide by the rate.', explanation: `$${rate} = £1, so $${usd} ÷ ${rate} = £${round(usd / rate, 2)}.`, errors: [ex('wrong-direction', 'To go from dollars back to pounds you must divide, not multiply.', round(usd * rate, 2))] })
  }),

  // ======================================================= REARRANGING (Y8)
  G('rf.subject', 'algebra.rearranging', [1, 5], (rng, d) => {
    if (d === 1) {
      const a = rng.int(2, 12)
      return expr({ prompt: `Make x the subject of  y = x + ${a}`, prefix: 'x =', answer: `y-${a}`, variables: ['y'], hint: `Undo the + ${a} by subtracting ${a} from both sides.`, explanation: `Subtract ${a} from both sides: x = y − ${a}.`, errors: [ee('wrong-inverse', `Do the OPPOSITE operation: subtract, not add.`, `y+${a}`)] })
    }
    if (d === 2) {
      const a = rng.int(2, 9)
      return expr({ prompt: `Make x the subject of  y = ${a}x`, prefix: 'x =', answer: `y/${a}`, variables: ['y'], hint: `Undo the × ${a} by dividing both sides by ${a}.`, explanation: `Divide both sides by ${a}: x = ${F('y', a)}.`, errors: [ee('wrong-inverse', 'Undo multiplication by DIVIDING.', `${a}y`)] })
    }
    if (d === 3) {
      const a = rng.int(2, 6)
      const b = rng.int(1, 9)
      return expr({
        prompt: `Make x the subject of  y = ${a}x + ${b}`,
        prefix: 'x =',
        answer: `(y-${b})/${a}`,
        variables: ['y'],
        hint: `Do the inverse steps in reverse order: subtract ${b}, then divide by ${a}.`,
        explanation: `y − ${b} = ${a}x, so x = ${F(`y − ${b}`, a)}.`,
        errors: [ee('divided-only-one-term', `You must divide the WHOLE of (y − ${b}) by ${a}, not just the ${b}.`, `y-${b}/${a}`)],
      })
    }
    if (d === 4) {
      const pick = rng.int(0, 2)
      if (pick === 0) return expr({ prompt: 'Make w the subject of  A = lw', prefix: 'w =', answer: 'A/l', variables: ['A', 'l'], hint: 'Divide both sides by l.', explanation: 'w = A ÷ l.' })
      if (pick === 1) return expr({ prompt: 'Make a the subject of  v = u + at', prefix: 'a =', answer: '(v-u)/t', variables: ['v', 'u', 't'], hint: 'Subtract u first, then divide by t.', explanation: 'v − u = at, so a = (v − u) ÷ t.', errors: [ee('divided-only-one-term', 'Divide the whole of (v − u) by t.', 'v-u/t')] })
      return expr({ prompt: 'Make x the subject of  y = mx + c', prefix: 'x =', answer: '(y-c)/m', variables: ['y', 'm', 'c'], hint: 'Subtract c, then divide by m.', explanation: 'y − c = mx, so x = (y − c) ÷ m.', errors: [ee('divided-only-one-term', 'Divide the whole of (y − c) by m.', 'y-c/m')] })
    }
    if (rng.chance(0.5)) return expr({ prompt: 'Make l the subject of  P = 2(l + w)', prefix: 'l =', answer: 'P/2-w', variables: ['P', 'w'], hint: 'Divide both sides by 2 first, then subtract w.', explanation: 'P ÷ 2 = l + w, so l = P/2 − w.' })
    return expr({ prompt: 'Make h the subject of  V = lwh', prefix: 'h =', answer: 'V/(lw)', variables: ['V', 'l', 'w'], hint: 'h is multiplied by l and w. Divide both sides by both.', explanation: 'h = V ÷ (l × w).', errors: [ee('divided-one-letter', 'You must divide by BOTH l and w.', 'V/l')] })
  }),
]
