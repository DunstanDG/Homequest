import type { Answer, ChoiceItem, ExprItem, Item, Judgement, MatchItem, NumericItem, OrderItem, RevealItem, TextItem } from './types'

// ------------------------------------------------------------------ numbers

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return String(n)
  return String(Number(n.toPrecision(12)))
}

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))

function clean(raw: string): string {
  return raw
    .replace(/[−–—]/g, '-')
    .replace(/[×]/g, '*')
    .replace(/[÷]/g, '/')
    .replace(/[£$€%]/g, '')
    .replace(/,(?=\d{3}\b)/g, '')
    .trim()
}

export interface ParsedNumber {
  value: number
  /** Set when the input was typed as a fraction a/b or mixed number. */
  fraction?: { num: number; den: number }
}

/** Accepts 12, -3.5, 3/4, 1 1/2 (mixed number), 1e3. Returns null if it isn't a single number. */
export function parseNumber(raw: string): ParsedNumber | null {
  const s = clean(raw)
  if (s === '') return null
  let m = /^(-?)\s*(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(s)
  if (m) {
    const whole = Number(m[2])
    const num = Number(m[3])
    const den = Number(m[4])
    if (den === 0) return null
    const sign = m[1] === '-' ? -1 : 1
    return { value: sign * (whole + num / den), fraction: { num: sign * (whole * den + num), den } }
  }
  m = /^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/.exec(s)
  if (m) {
    const num = Number(m[1])
    const den = Number(m[2])
    if (den === 0) return null
    return { value: num / den, fraction: Number.isInteger(num) && Number.isInteger(den) ? { num, den } : undefined }
  }
  if (/^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/i.test(s)) return { value: Number(s) }
  return null
}

/** Default is effectively exact (float noise only). Generators that want leeway say so explicitly. */
const tolFor = (answer: number, tolerance?: number) => tolerance ?? Math.max(1e-9, Math.abs(answer) * 1e-9)

// ------------------------------------------------------------------ numeric

function fillTemplate(template: string | undefined, values: string[], fields: NumericItem['fields']): string {
  if (!template) return values.join(', ')
  return template.replace(/\{(\d+)\}/g, (_m, i) => {
    const v = values[Number(i)] ?? '?'
    return fields[Number(i)]?.superscript ? `^${v}` : v
  })
}

function judgeNumeric(item: NumericItem, ans: Extract<Answer, { kind: 'numeric' }>): Judgement {
  const expectedVals = item.fields.map((f) => f.display ?? formatNumber(f.answer))
  const expected = fillTemplate(item.template, expectedVals, item.fields)
  const given = fillTemplate(item.template, ans.values, item.fields)
  const parsed = item.fields.map((_f, i) => parseNumber(ans.values[i] ?? ''))
  if (parsed.some((p) => p === null)) return { correct: false, expected, given, unparseable: true }

  const nums = parsed as ParsedNumber[]
  const allValueOk = item.fields.every((f, i) => Math.abs((nums[i] as ParsedNumber).value - f.answer) <= tolFor(f.answer, f.tolerance))

  if (allValueOk) {
    // Lowest-terms check: the value is right but the typed fraction still simplifies.
    const notSimplified = item.fields.some((f, i) => {
      const fr = (nums[i] as ParsedNumber).fraction
      return f.requireLowestTerms && fr && gcd(fr.num, fr.den) !== 1
    })
    if (notSimplified) {
      return { correct: false, expected, given, misconception: 'not-simplified', feedback: 'Right value, but the fraction can be simplified further.' }
    }
    return { correct: true, expected, given }
  }

  for (const e of item.commonErrors ?? []) {
    if (e.values && e.values.length === item.fields.length && e.values.every((v, i) => Math.abs((nums[i] as ParsedNumber).value - v) <= tolFor(v, item.fields[i]?.tolerance))) {
      return { correct: false, expected, given, misconception: e.tag, feedback: e.message }
    }
  }
  return { correct: false, expected, given }
}

// -------------------------------------------------------------- expressions

type Node =
  | { t: 'num'; v: number }
  | { t: 'var'; name: string }
  | { t: 'neg'; a: Node }
  | { t: 'bin'; op: '+' | '-' | '*' | '/' | '^'; a: Node; b: Node }

function normaliseExpr(raw: string): string {
  return raw
    .replace(/[−–—]/g, '-')
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/\s+/g, '')
}

/** Recursive-descent parser with implicit multiplication (3x, 2(x+1), (x+1)(x-2), xy). Returns null on syntax errors. */
export function parseExpr(raw: string): Node | null {
  const s = normaliseExpr(raw)
  if (s === '') return null
  let i = 0
  const peek = () => s[i]
  const isDigit = (c?: string) => c !== undefined && c >= '0' && c <= '9'
  const isLetter = (c?: string) => c !== undefined && /[a-zA-Z]/.test(c)

  function parseExpression(): Node {
    let left = parseTerm()
    while (peek() === '+' || peek() === '-') {
      const op = s[i++] as '+' | '-'
      left = { t: 'bin', op, a: left, b: parseTerm() }
    }
    return left
  }
  function parseTerm(): Node {
    let left = parseUnary()
    for (;;) {
      const c = peek()
      if (c === '*' || c === '/') {
        i++
        left = { t: 'bin', op: c, a: left, b: parseUnary() }
      } else if (isLetter(c) || c === '(') {
        left = { t: 'bin', op: '*', a: left, b: parsePower() } // implicit multiplication
      } else break
    }
    return left
  }
  function parseUnary(): Node {
    if (peek() === '-') {
      i++
      return { t: 'neg', a: parseUnary() }
    }
    if (peek() === '+') {
      i++
      return parseUnary()
    }
    return parsePower()
  }
  function parsePower(): Node {
    const base = parseAtom()
    if (peek() === '^') {
      i++
      let exp: Node
      if (peek() === '-' || peek() === '+') {
        const neg = s[i++] === '-'
        const a = parseAtom()
        exp = neg ? { t: 'neg', a } : a
      } else exp = parseAtom()
      return { t: 'bin', op: '^', a: base, b: exp }
    }
    return base
  }
  function parseAtom(): Node {
    const c = peek()
    if (c === '(') {
      i++
      const e = parseExpression()
      if (peek() !== ')') throw new Error('expected )')
      i++
      return e
    }
    if (isDigit(c) || c === '.') {
      let j = i
      while (isDigit(s[j]) || s[j] === '.') j++
      const v = Number(s.slice(i, j))
      if (Number.isNaN(v)) throw new Error('bad number')
      i = j
      return { t: 'num', v }
    }
    if (isLetter(c)) {
      i++
      return { t: 'var', name: (c as string).toLowerCase() }
    }
    throw new Error('unexpected token')
  }

  try {
    const node = parseExpression()
    if (i !== s.length) return null
    return node
  } catch {
    return null
  }
}

function evalNode(n: Node, env: Record<string, number>): number {
  switch (n.t) {
    case 'num':
      return n.v
    case 'var':
      return env[n.name] ?? Number.NaN
    case 'neg':
      return -evalNode(n.a, env)
    case 'bin': {
      const a = evalNode(n.a, env)
      const b = evalNode(n.b, env)
      switch (n.op) {
        case '+':
          return a + b
        case '-':
          return a - b
        case '*':
          return a * b
        case '/':
          return b === 0 ? Number.NaN : a / b
        case '^':
          return a ** b
      }
    }
  }
}

function varsOf(n: Node, acc = new Set<string>()): Set<string> {
  if (n.t === 'var') acc.add(n.name)
  else if (n.t === 'neg') varsOf(n.a, acc)
  else if (n.t === 'bin') {
    varsOf(n.a, acc)
    varsOf(n.b, acc)
  }
  return acc
}

const SAMPLE_POINTS = [-3.5, -2, -1.25, 0.5, 1, 1.75, 2, 3, 4.5, 7]

/** Are two expressions equal as functions? Tested at several deterministic points. */
export function exprEquivalent(a: string, b: string): boolean {
  const pa = parseExpr(a)
  const pb = parseExpr(b)
  if (!pa || !pb) return false
  const vars = [...new Set([...varsOf(pa), ...varsOf(pb)])]
  let compared = 0
  for (let k = 0; k < SAMPLE_POINTS.length; k++) {
    const env: Record<string, number> = {}
    vars.forEach((v, idx) => (env[v] = SAMPLE_POINTS[(k + idx * 3) % SAMPLE_POINTS.length] as number))
    const x = evalNode(pa, env)
    const y = evalNode(pb, env)
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    compared++
    if (Math.abs(x - y) > 1e-7 * Math.max(1, Math.abs(x), Math.abs(y))) return false
  }
  return compared >= 3
}

/** Number of top-level +/- separated terms, ignoring anything inside brackets. */
function termCount(raw: string): number {
  const s = normaliseExpr(raw)
  let depth = 0
  let count = 1
  for (let i = 1; i < s.length; i++) {
    const c = s[i]
    if (c === '(') depth++
    else if (c === ')') depth--
    else if ((c === '+' || c === '-') && depth === 0 && s[i - 1] !== '^' && s[i - 1] !== '(') count++
  }
  return count
}

function judgeExpr(item: ExprItem, ans: Extract<Answer, { kind: 'expr' }>): Judgement {
  const expected = tidy(item.answer)
  const given = tidy(ans.value)
  if (!parseExpr(ans.value)) return { correct: false, expected, given, unparseable: true }

  if (exprEquivalent(ans.value, item.answer)) {
    const s = normaliseExpr(ans.value)
    if (item.form === 'expanded' || item.form === 'simplified') {
      if (item.form === 'expanded' && s.includes('(') && !item.answer.includes('/')) {
        return { correct: false, expected, given, misconception: 'not-expanded', feedback: 'That is equivalent, but the question wants the brackets multiplied out.' }
      }
      if (termCount(ans.value) > termCount(item.answer)) {
        return { correct: false, expected, given, misconception: 'not-simplified', feedback: 'Right idea - now collect the like terms so it is fully simplified.' }
      }
    }
    if (item.form === 'factorised') {
      const m = /^(.*?)\((.+)\)$/.exec(s.replace(/\*\(/g, '('))
      if (!m) return { correct: false, expected, given, misconception: 'not-factorised', feedback: 'That is equivalent, but you need to write it with a bracket - take a common factor outside.' }
      const factor = (m[1] ?? '').replace(/\*/g, '')
      if (item.expectedFactor && factor !== normaliseExpr(item.expectedFactor)) {
        return { correct: false, expected, given, misconception: 'not-fully-factorised', feedback: 'Good start, but you can take out a bigger common factor.' }
      }
    }
    return { correct: true, expected, given }
  }

  for (const e of item.commonErrors ?? []) {
    if (e.expr && exprEquivalent(ans.value, e.expr)) return { correct: false, expected, given, misconception: e.tag, feedback: e.message }
  }
  return { correct: false, expected, given }
}

function tidy(e: string): string {
  return normaliseExpr(e).replace(/\*/g, '').replace(/-/g, '-')
}

// ------------------------------------------------------------------- others

function judgeChoice(item: ChoiceItem, ans: Extract<Answer, { kind: 'choice' }>): Judgement {
  const right = item.options.find((o) => o.correct)
  const chosen = item.options.find((o) => o.id === ans.optionId)
  const strip = (s: string) => s.replace(/\{([^|}]*)\|([^}]*)\}/g, (_m, a: string, b: string) => `${/[\s+−-]/.test(a.trim().replace(/^[−-]/, '')) ? `(${a})` : a}/${/[\s+−-]/.test(b.trim().replace(/^[−-]/, '')) ? `(${b})` : b}`).replace(/[\^_]\{([^}]*)\}/g, (_m, g) => g)
  return {
    correct: !!chosen?.correct,
    misconception: chosen?.correct ? undefined : chosen?.misconception,
    feedback: chosen?.correct ? undefined : chosen?.feedback,
    expected: strip(right?.label ?? '?'),
    given: strip(chosen?.label ?? ''),
    unparseable: !chosen,
  }
}

function judgeOrder(item: OrderItem, ans: Extract<Answer, { kind: 'order' }>): Judgement {
  const label = (id: string) => item.items.find((i) => i.id === id)?.label ?? id
  const expected = item.correctOrder.map(label).join(', ')
  const given = ans.order.map(label).join(', ')
  if (ans.order.length !== item.correctOrder.length) return { correct: false, expected, given, unparseable: true }
  return { correct: ans.order.every((id, i) => id === item.correctOrder[i]), expected, given }
}

function judgeMatch(item: MatchItem, ans: Extract<Answer, { kind: 'match' }>): Judgement {
  const expected = item.pairs.map((p) => `${p.left} = ${p.right}`).join('; ')
  const given = item.pairs.map((p) => `${p.left} = ${item.pairs.find((q) => q.id === ans.pairs[p.id])?.right ?? '?'}`).join('; ')
  if (Object.keys(ans.pairs).length < item.pairs.length) return { correct: false, expected, given, unparseable: true }
  return { correct: item.pairs.every((p) => ans.pairs[p.id] === p.id), expected, given }
}

export function normaliseText(s: string, ignoreAccents = false): string {
  let t = s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/^[\s.!?,;:]+|[\s.!?,;:]+$/g, '')
  if (ignoreAccents) t = t.replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '')
  return t
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[])
  for (let j = 1; j <= b.length; j++) (dp[0] as number[])[j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      (dp[i] as number[])[j] = Math.min(
        (dp[i - 1] as number[])[j]! + 1,
        (dp[i] as number[])[j - 1]! + 1,
        (dp[i - 1] as number[])[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
  return (dp[a.length] as number[])[b.length] as number
}

function judgeText(item: TextItem, ans: Extract<Answer, { kind: 'text' }>): Judgement {
  const g = normaliseText(ans.value, item.ignoreAccents)
  const expected = item.accept[0] ?? ''
  if (g === '') return { correct: false, expected, given: ans.value, unparseable: true }
  const accepted = item.accept.map((a) => normaliseText(a, item.ignoreAccents))
  if (accepted.includes(g)) return { correct: true, expected, given: ans.value }
  if (accepted.some((a) => a.length > 3 && levenshtein(a, g) === 1)) {
    return { correct: false, expected, given: ans.value, misconception: 'spelling', feedback: 'So close - check the spelling.' }
  }
  return { correct: false, expected, given: ans.value }
}

/** Shortest written answer that counts as an attempt at a self-marked question. */
export const REVEAL_MIN_CHARS = 15

function judgeReveal(item: RevealItem, ans: Extract<Answer, { kind: 'reveal' }>): Judgement {
  const text = ans.text.trim()
  const ticked = [...new Set(ans.ticked)].filter((i) => i >= 0 && i < item.checklist.length)
  const expected = plainText(item.model)
  if (text.length < REVEAL_MIN_CHARS) return { correct: false, expected, given: ans.text, unparseable: true }
  const correct = ticked.length >= item.passMark
  return {
    correct,
    expected,
    given: text,
    feedback: correct ? undefined : `You ticked ${ticked.length} of ${item.checklist.length}. Compare yours with the model and try adding what was missing next time.`,
  }
}

// -------------------------------------------------------------------- entry

export function judge(item: Item, answer: Answer): Judgement {
  if (item.kind !== answer.kind) throw new Error(`Answer kind ${answer.kind} does not match item kind ${item.kind}`)
  switch (item.kind) {
    case 'numeric':
      return judgeNumeric(item, answer as Extract<Answer, { kind: 'numeric' }>)
    case 'expr':
      return judgeExpr(item, answer as Extract<Answer, { kind: 'expr' }>)
    case 'choice':
      return judgeChoice(item, answer as Extract<Answer, { kind: 'choice' }>)
    case 'order':
      return judgeOrder(item, answer as Extract<Answer, { kind: 'order' }>)
    case 'match':
      return judgeMatch(item, answer as Extract<Answer, { kind: 'match' }>)
    case 'text':
      return judgeText(item, answer as Extract<Answer, { kind: 'text' }>)
    case 'reveal':
      return judgeReveal(item, answer as Extract<Answer, { kind: 'reveal' }>)
  }
}

/** The answer that is always correct - used by tests and by the content audit. */
export function solutionFor(item: Item): Answer {
  switch (item.kind) {
    case 'numeric':
      return { kind: 'numeric', values: item.fields.map((f) => f.display ?? formatNumber(f.answer)) }
    case 'expr':
      return { kind: 'expr', value: item.answer }
    case 'choice':
      return { kind: 'choice', optionId: (item.options.find((o) => o.correct) as { id: string }).id }
    case 'order':
      return { kind: 'order', order: item.correctOrder }
    case 'match':
      return { kind: 'match', pairs: Object.fromEntries(item.pairs.map((p) => [p.id, p.id])) }
    case 'text':
      return { kind: 'text', value: item.accept[0] ?? '' }
    case 'reveal':
      return { kind: 'reveal', text: plainText(item.model), ticked: item.checklist.map((_, i) => i) }
  }
}

/** Plain-text prompt for feedback snapshots (strips mini-markup). */
export function plainText(r: string): string {
  return r.replace(/(\d)\{(\d+)\|(\d+)\}/g, '$1 $2/$3').replace(/\{([^|}]*)\|([^}]*)\}/g, (_m, a: string, b: string) => `${/[\s+−-]/.test(a.trim().replace(/^[−-]/, '')) ? `(${a})` : a}/${/[\s+−-]/.test(b.trim().replace(/^[−-]/, '')) ? `(${b})` : b}`).replace(/[\^_]\{([^}]*)\}/g, (m, g) => (m.startsWith('^') ? `^${g}` : `_${g}`))
}
