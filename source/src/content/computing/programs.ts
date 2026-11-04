import type { Rng } from '@/engine/types'
import { at, pickN, pyBool, pyDiv, pyFloat, pyList, pyMod, type Program } from './helpers'

/**
 * Python program builders. Each one makes a small, varied program from the rng and works out exactly what Python
 * prints. The generators in gen.python.ts ask questions about them; computing.test.ts runs every builder through a
 * real Python interpreter (when one is installed) to make sure the expected output is right.
 */

export const NAMES = ['Maya', 'Sam', 'Priya', 'Leo', 'Ava', 'Omar', 'Zara', 'Finn', 'Isla', 'Noah', 'Ellie', 'Kai']
export const WORDS = ['python', 'laptop', 'planet', 'rocket', 'garden', 'castle', 'pencil', 'dragon', 'window', 'robot', 'pixel', 'binary', 'keyboard', 'computer', 'network', 'mouse', 'screen', 'printer', 'galaxy', 'jungle']
const GREETINGS = ['Hello', 'Good morning', 'Welcome back', 'Hi there', 'Game over', 'Well done']
const COMPOUNDS: [string, string][] = [
  ['sun', 'flower'],
  ['foot', 'ball'],
  ['rain', 'bow'],
  ['key', 'board'],
  ['lap', 'top'],
  ['pass', 'word'],
  ['star', 'fish'],
  ['note', 'book'],
]

const P = (code: string[], output: (string | number)[], stdin?: (string | number)[]): Program => ({ code: code.join('\n'), output: output.map(String), stdin: stdin?.map(String) })

// ------------------------------------------------------------------ output

type Line = [string, string]
const printLineMakers: ((rng: Rng) => Line)[] = [
  (rng) => {
    const g = rng.pick(GREETINGS)
    return [`print("${g}")`, g]
  },
  (rng) => {
    const a = rng.int(2, 15)
    const b = rng.int(2, 15)
    return [`print(${a} + ${b})`, String(a + b)]
  },
  (rng) => {
    const a = rng.int(2, 9)
    const b = rng.int(2, 9)
    return [`print("${a} + ${b}")`, `${a} + ${b}`]
  },
  (rng) => {
    const n = rng.int(3, 99)
    return [`print("Score:", ${n})`, `Score: ${n}`]
  },
  (rng) => {
    const [a, b] = rng.pick(COMPOUNDS)
    return [`print("${a}" + "${b}")`, `${a}${b}`]
  },
  (rng) => {
    const [a, b] = rng.pick(COMPOUNDS)
    return [`print("${a}", "${b}")`, `${a} ${b}`]
  },
]
const printLineMakersHard: ((rng: Rng) => Line)[] = [
  (rng) => {
    const a = rng.int(3, 12)
    const b = rng.int(3, 12)
    return [`print(${a} * ${b})`, String(a * b)]
  },
  (rng) => {
    const s = rng.pick(['ha', 'na', 'Go', 'ab'])
    const k = rng.int(2, 4)
    return [`print("${s}" * ${k})`, s.repeat(k)]
  },
  (rng) => {
    const a = rng.int(1, 9)
    const b = rng.int(1, 9)
    return [`print("${a}" + "${b}")`, `${a}${b}`]
  },
  (rng) => {
    const a = rng.int(2, 9)
    const b = rng.int(2, 9)
    return [`print("Total:", ${a} + ${b})`, `Total: ${a + b}`]
  },
]

export function printProgram(rng: Rng, d: number): Program {
  const makers = d <= 2 ? printLineMakers : [...printLineMakers, ...printLineMakersHard, ...printLineMakersHard]
  const lines = pickN(rng, makers, 3).map((m) => m(rng))
  return P(
    lines.map((l) => l[0]),
    lines.map((l) => l[1]),
  )
}

// ------------------------------------------------------------------ variables

type Opd = string | number
interface Stmt {
  v: string
  l: Opd
  op?: '+' | '-' | '*'
  r?: Opd
}
function runStmts(stmts: Stmt[]): Record<string, number> {
  const env: Record<string, number> = {}
  const val = (o: Opd) => (typeof o === 'number' ? o : (env[o] ?? Number.NaN))
  for (const s of stmts) {
    const l = val(s.l)
    if (!s.op || s.r === undefined) env[s.v] = l
    else {
      const r = val(s.r)
      env[s.v] = s.op === '+' ? l + r : s.op === '-' ? l - r : l * r
    }
  }
  return env
}
const renderStmt = (s: Stmt) => `${s.v} = ${s.l}${s.op ? ` ${s.op} ${s.r}` : ''}`

/** Straight-line assignments. Returns the program; the final line prints one or two variables. */
export function assignProgram(rng: Rng, d: number): Program {
  const [x, y] = [rng.int(2, 9), rng.int(2, 9)]
  let stmts: Stmt[]
  let show: string[]
  if (d <= 2) {
    const op = rng.pick(['+', '-', '*'] as const)
    stmts = [{ v: 'a', l: x }, { v: 'b', l: y }, { v: 'c', l: 'a', op, r: 'b' }]
    show = ['c']
  } else if (d === 3) {
    const k = rng.int(2, 4)
    const z = rng.int(1, 6)
    stmts = [{ v: 'a', l: x }, { v: 'a', l: 'a', op: '+', r: y }, { v: 'b', l: 'a', op: '*', r: k }, { v: 'a', l: 'b', op: '-', r: z }]
    show = ['a']
  } else if (d === 4) {
    if (rng.chance(0.5)) stmts = [{ v: 'a', l: x }, { v: 'b', l: y }, { v: 'a', l: 'a', op: '+', r: 'b' }, { v: 'b', l: 'a', op: '-', r: 'b' }]
    else stmts = [{ v: 'a', l: x }, { v: 'b', l: y }, { v: 'b', l: 'a', op: '*', r: 2 }, { v: 'a', l: 'b', op: '+', r: 'a' }]
    show = ['a', 'b']
  } else {
    const yy = x === y ? y + 1 : y
    if (rng.chance(0.5)) stmts = [{ v: 'a', l: x }, { v: 'b', l: yy }, { v: 'a', l: 'b' }, { v: 'b', l: 'a' }]
    else stmts = [{ v: 'a', l: x }, { v: 'b', l: yy }, { v: 'temp', l: 'a' }, { v: 'a', l: 'b' }, { v: 'b', l: 'temp' }]
    show = ['a', 'b']
  }
  const env = runStmts(stmts)
  return P([...stmts.map(renderStmt), `print(${show.join(', ')})`], [show.map((v) => env[v]).join(' ')])
}

// ------------------------------------------------------------------ data types and casting

export function castProgram(rng: Rng, d: number): Program {
  const n = rng.int(2, 9)
  const m = rng.int(2, 9)
  const options: (() => Program)[] = [
    () => P([`print(int("${n}") + ${m})`], [n + m]),
    () => P([`print("${n}" + "${m}")`], [`${n}${m}`]),
    () => P([`print(str(${n}) + "${m}")`], [`${n}${m}`]),
  ]
  if (d >= 3) {
    options.push(
      () => P([`print(float(${n}))`], [pyFloat(n)]),
      () => P([`print(${n * m} / ${m})`], [pyFloat(n)]),
      () => P([`print(int("${n}${m}") + 1)`], [n * 10 + m + 1]),
    )
  }
  if (d >= 4) {
    const dec = rng.int(1, 9)
    options.push(
      () => P([`print(int(${n}.${dec}))`], [n]),
      () => P([`print("${n}" * ${m > 4 ? 3 : m})`], [String(n).repeat(m > 4 ? 3 : m)]),
      () => P([`x = ${n}`, `y = str(x) + str(x)`, `print(int(y) + 1)`], [n * 11 + 1]),
    )
  }
  return rng.pick(options)()
}

// ------------------------------------------------------------------ arithmetic

export interface ArithCase {
  expr: string
  value: number
  /** How Python prints it. */
  printed: string
  /** A tempting wrong value and why. */
  traps: { v: number; tag: string; msg: string }[]
}

export function arithCase(rng: Rng, d: number): ArithCase {
  const a = rng.int(7, 30)
  const b = rng.int(2, 6)
  const c = rng.int(2, 5)
  const simple: (() => ArithCase)[] = [
    () => ({ expr: `${a} + ${b}`, value: a + b, printed: String(a + b), traps: [] }),
    () => ({ expr: `${a} * ${b}`, value: a * b, printed: String(a * b), traps: [] }),
    () => {
      const v = pyDiv(a, b)
      return { expr: `${a} // ${b}`, value: v, printed: String(v), traps: [{ v: pyMod(a, b), tag: 'div-mod-swapped', msg: '// gives the whole number of times it goes in; % gives the remainder.' }, { v: Math.round(a / b), tag: 'rounded', msg: '// does not round: it always rounds down.' }] }
    },
    () => {
      const v = pyMod(a, b)
      return { expr: `${a} % ${b}`, value: v, printed: String(v), traps: [{ v: pyDiv(a, b), tag: 'div-mod-swapped', msg: '% gives the remainder, not how many times it goes in.' }] }
    },
  ]
  const harder: (() => ArithCase)[] = [
    () => ({ expr: `${b} ** ${c}`, value: b ** c, printed: String(b ** c), traps: [{ v: b * c, tag: 'power-as-multiply', msg: `** means "to the power of": ${b} ** ${c} is ${b} multiplied by itself ${c} times.` }] }),
    () => ({ expr: `${a} + ${b} * ${c}`, value: a + b * c, printed: String(a + b * c), traps: [{ v: (a + b) * c, tag: 'left-to-right', msg: 'Multiplication happens before addition.' }] }),
    () => ({ expr: `(${a} + ${b}) * ${c}`, value: (a + b) * c, printed: String((a + b) * c), traps: [{ v: a + b * c, tag: 'ignored-brackets', msg: 'Brackets are worked out first.' }] }),
    () => {
      const v = a - pyDiv(b * 3 + 1, c)
      return { expr: `${a} - ${b * 3 + 1} // ${c}`, value: v, printed: String(v), traps: [{ v: pyDiv(a - (b * 3 + 1), c), tag: 'left-to-right', msg: '// is done before -, just like division.' }] }
    },
    () => {
      const e = b * 4
      const v = e / 2 // b*4 is even so this is a whole number
      return { expr: `${e} / 2`, value: v, printed: pyFloat(v), traps: [] }
    },
  ]
  const hardest: (() => ArithCase)[] = [
    () => {
      const v = pyMod(a * c, b + 1)
      return { expr: `${a} * ${c} % ${b + 1}`, value: v, printed: String(v), traps: [{ v: a * pyMod(c, b + 1), tag: 'precedence', msg: '* and % have the same priority, so work left to right: multiply first.' }] }
    },
    () => {
      const v = a + b ** 2
      return { expr: `${a} + ${b} ** 2`, value: v, printed: String(v), traps: [{ v: (a + b) ** 2, tag: 'left-to-right', msg: '** happens before +.' }, { v: a + b * 2, tag: 'power-as-multiply', msg: '** 2 means squared, not times 2.' }] }
    },
    () => {
      const v = pyDiv(a, b) * c
      return { expr: `${a} // ${b} * ${c}`, value: v, printed: String(v), traps: [{ v: pyDiv(a, b * c), tag: 'precedence', msg: '// and * have the same priority, so work left to right.' }] }
    },
    () => {
      const v = (a + b) / 2
      return { expr: `(${a} + ${b}) / 2`, value: v, printed: pyFloat(v), traps: [{ v: a + b / 2, tag: 'ignored-brackets', msg: 'The brackets are worked out first.' }] }
    },
  ]
  const pool = d <= 2 ? simple : d === 3 ? [...simple, ...harder] : d === 4 ? harder : [...harder, ...hardest]
  return rng.pick(pool)()
}

export const arithProgram = (rng: Rng, d: number): Program => {
  const c = arithCase(rng, d)
  return P([`print(${c.expr})`], [c.printed])
}

// ------------------------------------------------------------------ input

export function inputProgram(rng: Rng, d: number): Program & { typed: string[]; note: string } {
  const n = rng.int(2, 9)
  const k = rng.int(2, 4)
  const m = rng.int(2, 9)
  const name = rng.pick(NAMES)
  const opts: (() => Program & { typed: string[]; note: string })[] = [
    () => ({ ...P(['name = input("What is your name? ")', 'print("Hello " + name)'], [`Hello ${name}`], [name]), typed: [name], note: 'input() stores exactly what is typed, as a string, and + joins the two strings.' }),
    () => ({ ...P(['num = int(input("Enter a number: "))', `print(num * ${k})`], [n * k], [n]), typed: [String(n)], note: 'int() turns the typed text into a whole number, so * multiplies.' }),
    () => ({ ...P(['num = input("Enter a number: ")', `print(num * ${k})`], [String(n).repeat(k)], [n]), typed: [String(n)], note: `input() always gives a string. A string times ${k} repeats it ${k} times.` }),
  ]
  if (d >= 3) {
    opts.push(
      () => ({ ...P(['a = input("First number: ")', 'b = input("Second number: ")', 'print(a + b)'], [`${n}${m}`], [n, m]), typed: [String(n), String(m)], note: 'Both inputs are strings, so + joins them together instead of adding.' }),
      () => ({ ...P(['a = int(input("First number: "))', 'b = int(input("Second number: "))', 'print(a + b)'], [n + m], [n, m]), typed: [String(n), String(m)], note: 'Both inputs are converted with int(), so + adds them.' }),
    )
  }
  if (d >= 4) {
    const price = rng.pick([1.5, 2.5, 3.5, 0.5, 4.5])
    opts.push(
      () => ({ ...P(['price = float(input("Price: "))', 'print(price * 2)'], [pyFloat(price * 2)], [price]), typed: [String(price)], note: 'float() makes a decimal number, and a float times a whole number is still a float, so Python shows .0 on a whole result.' }),
      () => ({ ...P(['age = int(input("Age: "))', 'age = age + 1', 'print("Next year you will be", age)'], [`Next year you will be ${n + 11}`], [n + 10]), typed: [String(n + 10)], note: 'int() makes the age a number so 1 can be added. print with a comma puts a space between the parts.' }),
    )
  }
  return rng.pick(opts)()
}

// ------------------------------------------------------------------ comparison and logic

const OPS = ['>', '<', '>=', '<=', '==', '!='] as const
type Op = (typeof OPS)[number]
export const cmp = (a: number, op: Op, b: number): boolean => (op === '>' ? a > b : op === '<' ? a < b : op === '>=' ? a >= b : op === '<=' ? a <= b : op === '==' ? a === b : a !== b)

export function compareProgram(rng: Rng, d: number): Program {
  const a = rng.int(2, 20)
  const near = d >= 3 ? rng.pick([a, a + 1, a - 1]) : rng.int(2, 20)
  const op = rng.pick(d <= 2 ? (['>', '<', '=='] as const) : OPS)
  if (d >= 4 && rng.chance(0.4)) {
    const w = rng.pick(WORDS)
    const variant = rng.int(0, 2)
    if (variant === 0) return P([`word = "${w}"`, `print(word == "${w.charAt(0).toUpperCase()}${w.slice(1)}")`], ['False'])
    if (variant === 1) return P([`word = "${w}"`, `print(len(word) >= ${near % 9 + 2})`], [pyBool(w.length >= (near % 9) + 2)])
    return P([`n = ${a}`, 'print(n % 2 == 0)'], [pyBool(a % 2 === 0)])
  }
  return P([`a = ${a}`, `b = ${near}`, `print(a ${op} b)`], [pyBool(cmp(a, op, near))])
}

export function logicProgram(rng: Rng, d: number): Program {
  const a = rng.int(1, 20)
  const b = rng.int(1, 20)
  const p = rng.int(5, 15)
  const q = rng.int(5, 15)
  const forms: [string, boolean][] = [
    [`a > ${p} and b < ${q}`, a > p && b < q],
    [`a > ${p} or b > ${q}`, a > p || b > q],
    [`not a > ${p}`, !(a > p)],
    [`a == ${a} and b == ${b + 1}`, false],
  ]
  if (d >= 3) {
    forms.push([`a >= ${p} and not b >= ${q}`, a >= p && !(b >= q)], [`a < ${p} or b < ${q} and a > b`, a < p || (b < q && a > b)], [`not (a > ${p} or b > ${q})`, !(a > p || b > q)])
  }
  const pool = d <= 2 ? forms.slice(0, 4) : d === 3 ? forms : forms.slice(4)
  const [e, v] = rng.pick(pool)
  return P([`a = ${a}`, `b = ${b}`, `print(${e})`], [pyBool(v)])
}

// ------------------------------------------------------------------ selection

export const IF_CONTEXTS: { v: string; yes: string; no: string; lo: number; hi: number }[] = [
  { v: 'temperature', yes: 'Wear a T-shirt', no: 'Wear a coat', lo: 5, hi: 30 },
  { v: 'score', yes: 'You passed', no: 'Try again', lo: 20, hi: 80 },
  { v: 'age', yes: 'Adult ticket', no: 'Child ticket', lo: 8, hi: 20 },
  { v: 'battery', yes: 'Battery OK', no: 'Charge me', lo: 5, hi: 60 },
  { v: 'points', yes: 'Level up', no: 'Keep playing', lo: 50, hi: 150 },
  { v: 'speed', yes: 'Too fast', no: 'OK', lo: 20, hi: 50 },
]

export function ifProgram(rng: Rng, d: number): Program & { value: number; threshold: number; op: Op; res: boolean } {
  const ctx = rng.pick(IF_CONTEXTS)
  const t = rng.int(ctx.lo + 3, ctx.hi - 3)
  const op = rng.pick(d <= 2 ? (['>', '<'] as const) : (['>', '<', '>=', '<='] as const))
  const value = d <= 2 ? rng.pick([t - rng.int(2, 5), t + rng.int(2, 5)]) : rng.pick([t, t, t - 1, t + 1])
  const res = cmp(value, op, t)
  // The "yes" label goes with high values, so a < or <= test prints the "no" label in its if branch.
  const [ifLabel, elseLabel] = op === '>' || op === '>=' ? [ctx.yes, ctx.no] : [ctx.no, ctx.yes]
  const body = [`if ${ctx.v} ${op} ${t}:`, `    print("${ifLabel}")`, 'else:', `    print("${elseLabel}")`]
  const out = res ? ifLabel : elseLabel
  if (d >= 3) return { ...P([`${ctx.v} = int(input("Enter ${ctx.v}: "))`, ...body], [out], [value]), value, threshold: t, op, res }
  return { ...P([`${ctx.v} = ${value}`, ...body], [out]), value, threshold: t, op, res }
}

export const GRADE_SETS: { v: string; labels: [string, string, string, string] }[] = [
  { v: 'mark', labels: ['Grade A', 'Grade B', 'Grade C', 'Not yet'] },
  { v: 'score', labels: ['Gold', 'Silver', 'Bronze', 'No medal'] },
  { v: 'temp', labels: ['Hot', 'Warm', 'Cool', 'Cold'] },
  { v: 'steps', labels: ['Amazing', 'Great', 'Good', 'Keep moving'] },
]

export function elifProgram(rng: Rng, d: number): Program & { value: number; bug: boolean } {
  const g = rng.pick(GRADE_SETS)
  const t3 = rng.int(2, 4) * 10
  const t2 = t3 + rng.int(1, 3) * 10
  const t1 = t2 + rng.int(1, 3) * 10
  const ts = [t1, t2, t3]
  const bug = d >= 5 || (d === 4 && rng.chance(0.5))
  const value = d <= 2 ? rng.pick([t1 + rng.int(1, 9), t2 + rng.int(1, 9), t3 + rng.int(1, 9), t3 - rng.int(1, 9)]) : rng.pick([t1, t2, t3, t1 - 1, t2 - 1, t3 - 1, t1 + 5])
  let code: string[]
  let out: string
  if (!bug) {
    code = [`${g.v} = ${value}`, `if ${g.v} >= ${t1}:`, `    print("${g.labels[0]}")`, `elif ${g.v} >= ${t2}:`, `    print("${g.labels[1]}")`, `elif ${g.v} >= ${t3}:`, `    print("${g.labels[2]}")`, 'else:', `    print("${g.labels[3]}")`]
    out = value >= t1 ? g.labels[0] : value >= t2 ? g.labels[1] : value >= t3 ? g.labels[2] : g.labels[3]
  } else {
    // Conditions checked from the lowest boundary up: the first true branch wins.
    code = [`${g.v} = ${value}`, `if ${g.v} >= ${t3}:`, `    print("${g.labels[2]}")`, `elif ${g.v} >= ${t2}:`, `    print("${g.labels[1]}")`, `elif ${g.v} >= ${t1}:`, `    print("${g.labels[0]}")`, 'else:', `    print("${g.labels[3]}")`]
    out = value >= t3 ? g.labels[2] : value >= t2 ? g.labels[1] : value >= t1 ? g.labels[0] : g.labels[3]
  }
  void ts
  return { ...P(code, [out]), value, bug }
}

// ------------------------------------------------------------------ for loops

export function rangeValues(a: number, b: number, s = 1): number[] {
  const out: number[] = []
  if (s > 0) for (let i = a; i < b; i += s) out.push(i)
  else for (let i = a; i > b; i += s) out.push(i)
  return out
}
export const rangeText = (a: number, b: number, s = 1) => (s !== 1 ? `range(${a}, ${b}, ${s})` : a === 0 && b > 0 ? `range(${b})` : `range(${a}, ${b})`)

export function forPrintProgram(rng: Rng, d: number): Program & { a: number; b: number; s: number } {
  let a: number
  let b: number
  let s = 1
  if (d <= 2) {
    a = rng.pick([0, 1])
    b = a + rng.int(3, 6)
  } else if (d === 3) {
    a = rng.int(0, 5)
    b = a + rng.int(3, 7)
  } else if (d === 4) {
    a = rng.int(0, 4)
    s = rng.pick([2, 3])
    b = a + rng.int(5, 12)
  } else {
    a = rng.int(8, 15)
    s = -rng.pick([1, 2, 3])
    b = a - rng.int(4, 10)
  }
  const vals = rangeValues(a, b, s)
  return { ...P([`for i in ${rangeText(a, b, s)}:`, '    print(i)'], vals), a, b, s }
}

export function forSumProgram(rng: Rng, d: number): Program {
  if (d <= 2) {
    const n = rng.int(3, 6)
    const w = rng.pick(GREETINGS)
    return P([`for i in range(${n}):`, `    print("${w}")`], Array.from({ length: n }, () => w))
  }
  if (d === 3) {
    const a = rng.int(1, 3)
    const b = a + rng.int(3, 5)
    const vals = rangeValues(a, b)
    return P(['total = 0', `for i in range(${a}, ${b}):`, '    total = total + i', 'print(total)'], [vals.reduce((x, y) => x + y, 0)])
  }
  if (d === 4) {
    const a = rng.int(1, 4)
    const b = a + rng.int(3, 6)
    const k = rng.int(2, 5)
    return P([`for i in range(${a}, ${b}):`, `    x = i * ${k}`, 'print(x)'], [(b - 1) * k])
  }
  const n = rng.int(3, 5)
  const k = rng.int(2, 3)
  let total = 1
  for (let i = 0; i < n; i++) total *= k
  return P(['total = 1', `for i in range(${n}):`, `    total = total * ${k}`, 'print(total)'], [total])
}

// ------------------------------------------------------------------ while loops

export function whileProgram(rng: Rng, d: number): Program & { loops: number } {
  if (d <= 2) {
    const start = rng.int(0, 3)
    const step = rng.int(1, 3)
    const limit = start + rng.int(4, 10)
    let x = start
    let loops = 0
    while (x < limit) {
      x += step
      loops++
    }
    return { ...P([`x = ${start}`, `while x < ${limit}:`, `    x = x + ${step}`, 'print(x)'], [x]), loops }
  }
  if (d === 3) {
    const n = rng.int(5, 12)
    const step = rng.int(2, 3)
    const out: number[] = []
    let x = n
    while (x > 0) {
      out.push(x)
      x -= step
    }
    return { ...P([`n = ${n}`, 'while n > 0:', '    print(n)', `    n = n - ${step}`], out), loops: out.length }
  }
  if (d === 4) {
    const start = rng.int(1, 3)
    const limit = rng.int(20, 100)
    let x = start
    let count = 0
    while (x <= limit) {
      x *= 2
      count++
    }
    return { ...P([`x = ${start}`, 'count = 0', `while x <= ${limit}:`, '    x = x * 2', '    count = count + 1', 'print(count)'], [count]), loops: count }
  }
  const target = rng.int(15, 40)
  const step = rng.int(3, 7)
  let total = 0
  let count = 0
  while (total < target) {
    total += step
    count++
  }
  return { ...P(['total = 0', 'count = 0', `while total < ${target}:`, `    total = total + ${step}`, '    count = count + 1', 'print(count, total)'], [`${count} ${total}`]), loops: count }
}

// ------------------------------------------------------------------ strings

export interface StrCase extends Program {
  word: string
}
export function stringProgram(rng: Rng, d: number): StrCase {
  const w = rng.pick(WORDS)
  const w2 = rng.pick(WORDS.filter((x) => x !== w))
  const i = rng.int(0, w.length - 1)
  const pool: (() => [string[], string | number])[] = [
    () => [[`print(len(word))`], w.length],
    () => [[`print(word[${i}])`], at([...w], i)],
    () => [[`print(word + "${w2}")`], w + w2],
    () => [[`print(word.upper())`], w.toUpperCase()],
  ]
  if (d >= 3) {
    pool.push(
      () => [[`print(word[-1])`], at([...w], w.length - 1)],
      () => [[`print(word[0] + word[-1])`], `${w[0]}${w[w.length - 1]}`],
      () => [[`print(word * 2)`], w + w],
      () => [[`print(len(word + "${w2}"))`], w.length + w2.length],
    )
  }
  if (d >= 4) {
    pool.push(
      () => [[`print(word[len(word) - 2])`], at([...w], w.length - 2)],
      () => [[`print(word[1].upper() + word[2])`], `${(w[1] ?? '').toUpperCase()}${w[2] ?? ''}`],
      () => [[`print(word[-2] + word[1])`], `${w[w.length - 2]}${w[1]}`],
    )
  }
  const [lines, out] = rng.pick(d >= 4 ? pool.slice(4) : pool)()
  return { ...P([`word = "${w}"`, ...lines], [out]), word: w }
}

export function sliceProgram(rng: Rng, d: number): StrCase {
  const w = rng.pick(WORDS.filter((x) => x.length >= 6))
  const a = rng.int(0, 2)
  const b = rng.int(a + 2, Math.min(w.length, a + 5))
  const n = rng.int(2, w.length - 2)
  const pool: (() => [string, string])[] = [
    () => [`print(word[${a}:${b}])`, w.slice(a, b)],
    () => [`print(word[:${n}])`, w.slice(0, n)],
    () => [`print(word[${n}:])`, w.slice(n)],
  ]
  if (d >= 4) {
    pool.push(
      () => [`print(word[-3:])`, w.slice(-3)],
      () => [`print(word[${a}:${b}].upper())`, w.slice(a, b).toUpperCase()],
      () => [`print(word[:${n}] + word[${n}:])`, w],
      () => [`print(word[1:] + word[0])`, w.slice(1) + w[0]],
    )
  }
  const [line, out] = rng.pick(d >= 4 ? pool.slice(2) : pool)()
  return { ...P([`word = "${w}"`, line], [out]), word: w }
}

// ------------------------------------------------------------------ lists

const LIST_SETS: string[][] = [
  ['apple', 'banana', 'cherry', 'grape', 'kiwi', 'mango'],
  ['red', 'orange', 'yellow', 'green', 'blue', 'purple'],
  ['Maya', 'Sam', 'Priya', 'Leo', 'Ava', 'Omar'],
  ['cat', 'dog', 'rabbit', 'hamster', 'parrot', 'goldfish'],
]

export function listProgram(rng: Rng, d: number): Program {
  if (rng.chance(0.5)) {
    const items = pickN(rng, rng.pick(LIST_SETS), rng.int(4, 5))
    const i = rng.int(0, items.length - 1)
    const extra = rng.pick(['pear', 'pink', 'Kai', 'tortoise'])
    const lit = pyList(items).replace(/'/g, '"')
    const pool: (() => Program)[] = [
      () => P([`items = ${lit}`, `print(items[${i}])`], [at(items, i)]),
      () => P([`items = ${lit}`, 'print(len(items))'], [items.length]),
    ]
    if (d >= 3) {
      pool.push(
        () => P([`items = ${lit}`, 'print(items[-1])'], [at(items, -1)]),
        () => P([`items = ${lit}`, `items.append("${extra}")`, 'print(len(items))'], [items.length + 1]),
      )
    }
    if (d >= 4) {
      const changed = [...items]
      changed[i] = extra
      pool.push(
        () => P([`items = ${lit}`, `items[${i}] = "${extra}"`, 'print(items)'], [pyList(changed)]),
        () => P([`items = ${lit}`, `items.append("${extra}")`, 'print(items[len(items) - 1])'], [extra]),
      )
    }
    return rng.pick(d >= 4 ? pool.slice(2) : pool)()
  }
  const nums = Array.from({ length: rng.int(4, 5) }, () => rng.int(1, 20))
  const lit = pyList(nums)
  const pool: (() => Program)[] = [
    () => P([`nums = ${lit}`, `print(nums[${1}] + nums[${2}])`], [at(nums, 1) + at(nums, 2)]),
    () => P([`nums = ${lit}`, 'total = 0', 'for n in nums:', '    total = total + n', 'print(total)'], [nums.reduce((x, y) => x + y, 0)]),
  ]
  if (d >= 4) {
    const k = rng.int(5, 15)
    pool.push(
      () => P([`nums = ${lit}`, 'count = 0', 'for n in nums:', `    if n > ${k}:`, '        count = count + 1', 'print(count)'], [nums.filter((n) => n > k).length]),
      () => {
        let big = at(nums, 0)
        for (const n of nums) if (n > big) big = n
        return P([`nums = ${lit}`, 'biggest = nums[0]', 'for n in nums:', '    if n > biggest:', '        biggest = n', 'print(biggest)'], [big])
      },
      () => P([`nums = ${lit}`, `nums[0] = nums[0] * 2`, 'print(nums)'], [pyList([at(nums, 0) * 2, ...nums.slice(1)])]),
    )
  }
  return rng.pick(d >= 4 ? pool.slice(1) : pool)()
}

// ------------------------------------------------------------------ functions

export function functionProgram(rng: Rng, d: number): Program {
  const a = rng.int(2, 9)
  const b = rng.int(2, 9)
  const k = rng.int(2, 5)
  const pool: (() => Program)[] = [
    () => P(['def double(n):', '    return n * 2', '', `print(double(${a}))`], [a * 2]),
    () => P(['def area(width, height):', '    return width * height', '', `print(area(${a}, ${b}))`], [a * b]),
    () => P([`def add_${k}(n):`, `    return n + ${k}`, '', `print(add_${k}(${a}))`], [a + k]),
  ]
  if (d >= 3) {
    pool.push(
      () => P(['def calc(x, y):', '    return x + y * 2', '', `print(calc(${a}, ${b}))`], [a + b * 2]),
      () => P(['def calc(x, y):', '    return x - y', '', `print(calc(${b}, ${a}))`], [b - a]),
      () => P(['def greet(name):', '    print("Hi " + name)', '', `greet("${rng.pick(NAMES.filter((x) => x !== 'Sam'))}")`, 'greet("Sam")'], ['', 'Hi Sam']),
    )
  }
  if (d >= 4) {
    pool.push(
      () => P(['def add(x, y):', '    return x + y', '', `print(add(add(${a}, ${b}), ${k}))`], [a + b + k]),
      () => P(['def triple(n):', '    return n * 3', '', `x = triple(${a})`, 'print(triple(x))'], [a * 9]),
      () => P(['def biggest(x, y):', '    if x > y:', '        return x', '    return y', '', `print(biggest(${a}, ${b + 10}) * 2)`], [Math.max(a, b + 10) * 2]),
      () => {
        let t = 0
        for (let i = 1; i <= a; i++) t += i
        return P(['def total_to(n):', '    total = 0', '    for i in range(1, n + 1):', '        total = total + i', '    return total', '', `print(total_to(${a}))`], [t])
      },
    )
  }
  const prog = rng.pick(d >= 4 ? pool.slice(3) : pool)()
  // Fill in the greet output (the first name is random).
  if (prog.code.includes('greet("')) {
    const first = /greet\("([A-Za-z]+)"\)/.exec(prog.code)?.[1] ?? ''
    prog.output = [`Hi ${first}`, 'Hi Sam']
  }
  return prog
}

// ------------------------------------------------------------------ tracing whole programs

export function traceProgram(rng: Rng, d: number): Program {
  const pool: (() => Program)[] = [
    () => {
      const k = rng.pick([2, 3, 4, 5])
      const a = rng.int(1, 6)
      const b = a + rng.int(8, 16)
      const c = rangeValues(a, b).filter((n) => n % k === 0).length
      return P(['count = 0', `for n in range(${a}, ${b}):`, `    if n % ${k} == 0:`, '        count = count + 1', 'print(count)'], [c])
    },
    () => {
      let x = rng.int(0, 4)
      let y = x + rng.int(8, 15)
      const code = [`x = ${x}`, `y = ${y}`, 'while x < y:', '    x = x + 2', '    y = y - 1', 'print(x, y)']
      while (x < y) {
        x += 2
        y -= 1
      }
      return P(code, [`${x} ${y}`])
    },
    () => {
      const n = rng.int(3, 5)
      let r = 1
      for (let i = 1; i <= n; i++) r *= i
      return P(['result = 1', `for i in range(1, ${n + 1}):`, '    result = result * i', 'print(result)'], [r])
    },
  ]
  if (d >= 4) {
    pool.push(
      () => {
        const a = rng.int(2, 5)
        const b = rng.int(2, 5)
        return P(['total = 0', `for i in range(${a}):`, `    for j in range(${b}):`, '        total = total + 1', 'print(total)'], [a * b])
      },
      () => {
        const n = rng.int(4, 7)
        let c = 0
        for (let i = 1; i < n; i++) for (let j = 0; j < i; j++) c++
        return P(['count = 0', `for i in range(1, ${n}):`, '    for j in range(i):', '        count = count + 1', 'print(count)'], [c])
      },
      () => {
        const w = rng.pick(WORDS)
        const vowels = [...w].filter((ch) => 'aeiou'.includes(ch)).length
        return P([`word = "${w}"`, 'vowels = 0', 'for letter in word:', '    if letter in "aeiou":', '        vowels = vowels + 1', 'print(vowels)'], [vowels])
      },
      () => {
        const start = rng.int(10, 30)
        let n = start
        let steps = 0
        while (n !== 1 && steps < 200) {
          n = n % 2 === 0 ? n / 2 : n + 1
          steps++
        }
        return P([`n = ${start}`, 'steps = 0', 'while n != 1:', '    if n % 2 == 0:', '        n = n // 2', '    else:', '        n = n + 1', '    steps = steps + 1', 'print(steps)'], [steps])
      },
    )
  }
  return rng.pick(d >= 5 ? pool.slice(3) : pool)()
}

/** Every builder, for the tests to run through Python. */
export const PROGRAM_BUILDERS: Record<string, (rng: Rng, d: number) => Program> = {
  print: printProgram,
  assign: assignProgram,
  cast: castProgram,
  arith: arithProgram,
  input: inputProgram,
  compare: compareProgram,
  logic: logicProgram,
  if: ifProgram,
  elif: elifProgram,
  forPrint: forPrintProgram,
  forSum: forSumProgram,
  while: whileProgram,
  string: stringProgram,
  slice: sliceProgram,
  list: listProgram,
  function: functionProgram,
  trace: traceProgram,
}
