import type { ItemGenerator } from '@/engine/registry'
import type { CommonError, Rng } from '@/engine/types'
import { F, G, choice, gcd, lcm, m, mp, multi, num, reduce, round, shuffledNotSorted, spaced, sup } from './helpers'

const mixed = (w: number, n: number, d: number) => `${w}${F(n, d)}`
/** Show an improper fraction as a mixed number string that the judge can parse, e.g. '1 1/2'. */
function frDisplay(n: number, d: number): string {
  const r = reduce(n, d)
  if (r.d === 1) return String(r.n)
  if (r.n > r.d) return `${Math.floor(r.n / r.d)} ${r.n % r.d}/${r.d}`
  return `${r.n}/${r.d}`
}
const frRich = (n: number, d: number): string => {
  const r = reduce(n, d)
  if (r.d === 1) return String(r.n)
  if (r.n > r.d) return mixed(Math.floor(r.n / r.d), r.n % r.d, r.d)
  return F(r.n, r.d)
}
const ex = (tag: string, message: string, ...values: number[]): CommonError => ({ tag, message, values })

function digitsDistinct(rng: Rng, count: number, firstNonZero = true): number[] {
  for (;;) {
    const d = rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, count)
    if (!firstNonZero || d[0] !== 0) return d
  }
}

export const numberGenerators: ItemGenerator[] = [
  // ============================================================ PLACE VALUE
  G('pv.order', 'number.place-value', [1, 5], (rng, d) => {
    let labels: string[]
    if (d === 1) {
      const set = new Set<number>()
      while (set.size < 4) set.add(rng.int(101, 998))
      labels = [...set].map(String)
    } else if (d === 2) {
      const set = new Set<number>()
      while (set.size < 4) set.add(rng.int(11, 99))
      labels = [...set].map((v) => (v / 10).toFixed(1))
    } else if (d === 4) {
      const lead = rng.int(1, 9)
      const set = new Set<number>()
      while (set.size < 4) set.add(lead * 1_000_000 + rng.int(0, 9) * 100_000 + rng.int(0, 9) * 10_000 + rng.int(0, 9) * 1000)
      labels = [...set].map((v) => spaced(v))
    } else {
      const want = d === 3 ? 4 : 5
      for (;;) {
        const [a, b, c] = [rng.int(1, 9), rng.int(1, 9), rng.int(1, 9)]
        const cands = [`0.${a}`, `0.${a}${b}`, `0.${a}${b}${c}`, `0.0${b}`, `0.${b}`, `0.${b}${a}`, `0.0${a}${c}`, `0.${c}`]
        const seen = new Set<number>()
        const picks: string[] = []
        for (const cand of rng.shuffle(cands)) {
          if (!seen.has(Number(cand))) {
            seen.add(Number(cand))
            picks.push(cand)
          }
          if (picks.length === want) break
        }
        if (picks.length === want) {
          labels = picks
          break
        }
      }
    }
    const val = (s: string) => Number(s.replace(/ /g, ''))
    const sorted = [...labels].sort((x, y) => val(x) - val(y))
    const items = sorted.map((l, i) => ({ id: `n${i}`, label: l }))
    return {
      kind: 'order',
      prompt: 'Put these numbers in order, smallest first.',
      hint: d >= 3 && d !== 4 ? 'Line up the decimal points and compare digit by digit. Extra digits do not make a decimal bigger!' : 'Compare the biggest place value first.',
      explanation: `In order: ${sorted.join(', ')}.`,
      items: shuffledNotSorted(rng, items),
      correctOrder: items.map((i) => i.id),
      directionLabel: ['smallest', 'largest'],
    }
  }),

  G('pv.digit-value', 'number.place-value', [1, 5], (rng, d) => {
    const intLen = d === 1 ? 4 : d === 2 ? 6 : d === 4 ? 7 : 2
    const decLen = d === 3 ? 3 : d === 5 ? 4 : 0
    let ds = digitsDistinct(rng, Math.min(10, intLen + decLen))
    while (decLen > 0 && ds[ds.length - 1] === 0) ds = digitsDistinct(rng, intLen + decLen)
    const intPart = ds.slice(0, intLen).join('')
    const decPart = ds.slice(intLen).join('')
    const shown = decLen ? `${intPart}.${decPart}` : spaced(intPart)
    const idxs = ds.map((v, i) => [v, i] as const).filter(([v]) => v !== 0)
    const [digit, idx] = rng.pick(idxs)
    const exp = idx < intLen ? intLen - 1 - idx : -(idx - intLen + 1)
    const answer = round(digit * 10 ** exp, 6)
    return num({
      prompt: `What is the value of the digit ${digit} in ${shown}?`,
      answer,
      hint: 'Find which column the digit is in: units, tens, hundreds... or tenths, hundredths...',
      explanation: `The ${digit} is in the ${exp >= 0 ? `${10 ** exp}s` : `${'1/' + 10 ** -exp}`} column, so its value is ${answer}.`,
      errors: [{ values: [digit], tag: 'digit-not-value', message: `${digit} is the digit itself. The question asks for what it is worth in that column.` }],
    })
  }),

  G('pv.symbol', 'number.place-value', [2, 5], (rng, d) => {
    let a: string
    let b: string
    for (;;) {
      const [x, y, z] = [rng.int(1, 9), rng.int(0, 9), rng.int(1, 9)]
      if (d === 2) {
        a = `${x}.${y}`
        b = `${x}.${y}${z}`
      } else if (d === 3) {
        a = `0.${x}`
        b = `0.${y}${z}`
      } else if (d === 4) {
        a = rng.chance(0.4) ? `0.${x}` : `0.${x}${y}`
        b = rng.chance(0.5) ? `0.${x}0` : `0.${z}`
      } else {
        a = `0.0${x}`
        b = `0.${z}`
        if (rng.chance(0.4)) b = `0.${x}0`
        if (rng.chance(0.3)) a = `0.${x}`
      }
      if (a !== b) break
    }
    const sym = Number(a) < Number(b) ? '<' : Number(a) > Number(b) ? '>' : '='
    return choice({
      rng,
      keepOrder: true,
      prompt: `Which symbol makes this true?  ${a}  ?  ${b}`,
      correct: sym,
      wrong: ['<', '>', '='],
      hint: 'Write both with the same number of decimal places (add zeros on the end) then compare.',
      explanation: `${a} = ${Number(a).toFixed(3)} and ${b} = ${Number(b).toFixed(3)}, so ${a} ${sym} ${b}.`,
    })
  }),

  G('pv.shift', 'number.place-value', [2, 4], (rng, d) => {
    const dp = rng.int(0, d === 2 ? 1 : 2)
    const base = rng.int(11, 999) / 10 ** dp
    const mult = d === 2 ? rng.pick([10, 100]) : rng.pick([10, 100, 1000])
    const times = d === 2 ? true : rng.chance(0.5)
    const ans = round(times ? base * mult : base / mult, 8)
    const wrong = round(times ? base / mult : base * mult, 8)
    return num({
      prompt: `${base} ${times ? '×' : '÷'} ${mult} = ?`,
      answer: ans,
      hint: `Every digit moves ${String(mult).length - 1} place${mult > 10 ? 's' : ''} ${times ? 'left (bigger)' : 'right (smaller)'}.`,
      explanation: `${base} ${times ? '×' : '÷'} ${mult} = ${ans}.`,
      errors: [ex('wrong-direction', `The digits should move the other way - ${times ? 'multiplying makes the number bigger' : 'dividing makes it smaller'}.`, wrong)],
    })
  }),

  // ======================================================== FOUR OPERATIONS
  G('ops.addsub-dec', 'number.four-operations', [1, 3], (rng, d) => {
    if (d === 1) {
      const a = rng.int(11, 89) / 10
      const b = rng.int(11, 89) / 10
      return num({ prompt: `${a} + ${b} = ?`, answer: round(a + b, 1), hint: 'Line up the decimal points.', explanation: `${a} + ${b} = ${round(a + b, 1)}.` })
    }
    if (d === 2) {
      const a = rng.int(500, 990) / 100
      const b = rng.int(11, 49) / 10
      return num({ prompt: `${a} − ${b} = ?`, answer: round(a - b, 2), hint: 'Write 0 on the end of the shorter decimal so the columns match.', explanation: `${a.toFixed(2)} − ${b.toFixed(2)} = ${round(a - b, 2)}.` })
    }
    const a = rng.int(1000, 2400) / 100
    const b = rng.int(100, 900) / 100
    const c = rng.int(11, 59) / 10
    return num({
      prompt: `${a} + ${b} − ${c} = ?`,
      answer: round(a + b - c, 2),
      hint: 'Work left to right and line up the decimal points each time.',
      explanation: `${a} + ${b} = ${round(a + b, 2)}, then − ${c} = ${round(a + b - c, 2)}.`,
    })
  }),
  G('ops.mult-dec', 'number.four-operations', [3, 5], (rng, d) => {
    let prompt: string
    let ans: number
    if (d === 3) {
      const a = rng.int(11, 79) / 10
      const b = rng.int(2, 9)
      prompt = `${a} × ${b} = ?`
      ans = round(a * b, 1)
    } else if (d === 4) {
      const a = rng.int(2, 9) / 10
      const b = rng.int(2, 9) / 10
      const c = rng.chance(0.5) ? rng.int(2, 9) : 0
      prompt = c ? `${c + a} × ${b} = ?` : `${a} × ${b} = ?`
      ans = round((c + a) * b, 2)
    } else if (rng.chance(0.5)) {
      const a = rng.int(120, 480)
      const b = rng.int(21, 64)
      prompt = `${a} × ${b} = ?`
      ans = a * b
    } else {
      const a = rng.int(21, 89) / 10
      const b = rng.int(11, 39) / 100
      prompt = `${a} × ${b} = ?`
      ans = round(a * b, 3)
    }
    return num({
      prompt,
      answer: ans,
      hint: 'Ignore the decimal points, multiply, then put the decimal point back: count the decimal places in the question.',
      explanation: `${prompt.replace(' = ?', '')} = ${ans}.`,
      errors: [ex('decimal-point-slip', 'Digits look right, but check where the decimal point goes: count the decimal places in the question.', round(ans * 10, 6), round(ans / 10, 6))],
    })
  }),
  G('ops.div-dec', 'number.four-operations', [3, 5], (rng, d) => {
    let a: number
    let b: number
    let ans: number
    if (d === 3) {
      let q = rng.int(11, 99)
      if (q % 10 === 0) q += 1
      ans = q / 10
      b = rng.int(2, 9)
      a = round(ans * b, 1)
    } else if (d === 4) {
      b = rng.pick([0.1, 0.2, 0.5, 0.25])
      ans = rng.int(2, 30)
      a = round(ans * b, 3)
    } else {
      b = rng.pick([0.04, 0.06, 0.05, 0.3, 0.4, 0.8])
      ans = rng.int(3, 40)
      a = round(ans * b, 3)
    }
    return num({
      prompt: `${a} ÷ ${b} = ?`,
      answer: ans,
      hint: d >= 4 ? 'Multiply both numbers by 10 or 100 until the divisor is a whole number.' : 'Divide as normal, keeping the decimal point in line.',
      explanation: d >= 4 ? `Multiply both by ${Number.isInteger(round(b * 10, 6)) ? 10 : 100}: ${round(a * (Number.isInteger(round(b * 10, 6)) ? 10 : 100), 3)} ÷ ${round(b * (Number.isInteger(round(b * 10, 6)) ? 10 : 100), 3)} = ${ans}.` : `${a} ÷ ${b} = ${ans}.`,
      errors: [ex('decimal-point-slip', 'Check the size of your answer - dividing by a decimal below 1 makes the answer bigger.', round(ans * 10, 6), round(ans / 10, 6))],
    })
  }),
  G('ops.word', 'number.four-operations', [2, 4], (rng, d) => {
    if (d === 2) {
      const n = rng.int(3, 8)
      const p = rng.int(15, 95) / 100
      return num({ prompt: `${n} pencils cost £${p.toFixed(2)} each. What is the total cost?`, answer: round(n * p, 2), prefix: '£', hint: 'Multiply the price by the number of pencils.', explanation: `${n} × ${p.toFixed(2)} = £${(n * p).toFixed(2)}.` })
    }
    if (d === 3) {
      const n = rng.int(2, 4)
      const p = rng.int(60, 180) / 100
      const book = rng.int(300, 650) / 100
      const spent = round(n * p + book, 2)
      const pay = Math.ceil(spent / 5) * 5 + (rng.chance(0.4) ? 5 : 0)
      return num({
        prompt: `Sam buys ${n} pens at £${p.toFixed(2)} each and a book for £${book.toFixed(2)}. He pays with £${pay}. How much change does he get?`,
        answer: round(pay - spent, 2),
        prefix: '£',
        hint: 'Work out the total spent first, then subtract from what he paid.',
        explanation: `Pens: ${n} × ${p.toFixed(2)} = ${(n * p).toFixed(2)}. Total = ${(n * p).toFixed(2)} + ${book.toFixed(2)} = £${spent.toFixed(2)}. Change = ${pay} − ${spent.toFixed(2)} = £${(pay - spent).toFixed(2)}.`,
      })
    }
    const people = rng.int(3, 6)
    const each = rng.int(80, 190) / 10
    const tip = rng.pick([1.5, 2, 2.5])
    const bill = round(people * each, 2)
    return num({
      prompt: `${people} friends split a £${bill.toFixed(2)} bill equally, then each adds a £${tip.toFixed(2)} tip. How much does each person pay?`,
      answer: round(each + tip, 2),
      prefix: '£',
      hint: 'Divide the bill first, then add the tip.',
      explanation: `${bill.toFixed(2)} ÷ ${people} = ${each.toFixed(2)}; + ${tip.toFixed(2)} = £${(each + tip).toFixed(2)}.`,
    })
  }),

  // =================================================================== BIDMAS
  G('bidmas.order', 'number.bidmas', [1, 5], (rng, d) => {
    type T = { text: string; value: number; wrong?: [number, string, string] }
    const a = rng.int(2, 12)
    const b = rng.int(2, 6)
    const c = rng.int(2, 6)
    const e = rng.int(2, 9)
    const lr = 'Multiplication and division are done before addition and subtraction.'
    const brk = 'Do the brackets first.'
    const templates: Record<number, (() => T)[]> = {
      1: [
        () => ({ text: `${a} + ${b} × ${c}`, value: a + b * c, wrong: [(a + b) * c, 'left-to-right', lr] }),
        () => ({ text: `${b * c + a} − ${b} × ${c}`, value: a, wrong: [(b * c + a - b) * c, 'left-to-right', lr] }),
        () => ({ text: `${a} + ${b * e} ÷ ${b}`, value: a + e, wrong: [(a + b * e) / b, 'left-to-right', lr] }),
      ],
      2: [
        () => ({ text: `(${a} + ${b}) × ${c}`, value: (a + b) * c, wrong: [a + b * c, 'ignored-brackets', brk] }),
        () => ({ text: `${a + b + 6} − (${b} + ${c})`, value: a + 6 - c, wrong: [a + 6 + c, 'ignored-brackets', brk] }),
        () => ({ text: `${a + b} × (${a} − ${Math.max(1, a - c)})`, value: (a + b) * (a - Math.max(1, a - c)), wrong: [(a + b) * a - Math.max(1, a - c), 'ignored-brackets', brk] }),
      ],
      3: [
        () => ({ text: `${a} + ${sup(b + 1, 2)}`, value: a + (b + 1) ** 2, wrong: [a + 2 * (b + 1), 'index-as-multiply', 'Squaring means multiply the number by itself, not by 2.'] }),
        () => ({ text: `${e} × (${a} + ${b}) − ${c}`, value: e * (a + b) - c, wrong: [e * a + b - c, 'ignored-brackets', brk] }),
        () => ({ text: `${sup(b + 2, 2)} − ${b} × ${c}`, value: (b + 2) ** 2 - b * c, wrong: [((b + 2) ** 2 - b) * c, 'left-to-right', lr] }),
      ],
      4: [
        () => ({ text: `(${a} + ${b})${'^{2}'} − ${c} × ${e}`, value: (a + b) ** 2 - c * e, wrong: [a + b ** 2 - c * e, 'ignored-brackets', brk] }),
        () => ({ text: `${e} × ${sup(b, 2)} + ${a}`, value: e * b * b + a, wrong: [(e * b) ** 2 + a, 'index-precedence', 'The index applies only to the number directly before it: do the power first.'] }),
        () => {
          const dv = rng.int(2, 6)
          const bb = rng.int(2, 5)
          const cc = rng.int(2, 5)
          const k = Math.ceil((bb * cc + 2) / dv) + rng.int(0, 5)
          const aa = dv * k - bb * cc
          return { text: `(${aa} + ${bb} × ${cc}) ÷ ${dv}`, value: k, wrong: [(aa + bb) * cc / dv, 'ignored-precedence', 'Inside the brackets, multiply before adding.'] }
        },
      ],
      5: [
        () => {
          const [p, q, r, s] = [rng.int(2, 5), rng.int(2, 6), rng.int(2, 4), rng.int(4, 9)]
          const t = rng.int(1, s - 1)
          return { text: `${p} × (${q} + ${r} × (${s} − ${t}))`, value: p * (q + r * (s - t)) }
        },
        () => {
          const aa = rng.int(5, 9)
          const cc = rng.int(2, 6)
          const mm = rng.int(2, Math.max(2, Math.floor((aa * aa - 1) / cc)))
          const bb = aa * aa - cc * mm
          const dd = rng.int(2, 5)
          const ee = rng.int(2, 6)
          return { text: `(${sup(aa, 2)} − ${bb}) ÷ ${cc} + ${dd} × ${ee}`, value: mm + dd * ee, wrong: [(aa * aa - bb) / (cc + dd) * ee, 'ignored-precedence', 'Do the bracket, then the division and multiplication, and only then add.'] }
        },
      ],
    }
    const t = rng.pick(templates[d] as (() => T)[])()
    const errs = t.wrong && t.wrong[0] !== t.value ? [ex(t.wrong[1], t.wrong[2], t.wrong[0])] : undefined
    return num({
      prompt: `Work out  ${t.text}`,
      answer: t.value,
      hint: 'B-I-D-M-A-S: Brackets, Indices, Division/Multiplication, Addition/Subtraction.',
      explanation: `Follow BIDMAS. ${t.text.replace(/\^\{(\d+)\}/g, '^$1')} = ${t.value}.`,
      errors: errs,
    })
  }),

  // ============================================================== PROPERTIES
  G('props.prime', 'number.properties', [1, 4], (rng, d) => {
    if (d === 1) {
      return choice({
        rng,
        prompt: 'Which of these is the only EVEN prime number?',
        correct: '2',
        wrong: ['4', '6', '8', '1'],
        hint: 'Primes have exactly two factors. Which even numbers only have two?',
        explanation: '2 has only the factors 1 and 2. Every other even number is also divisible by 2, so it has more factors.',
      })
    }
    const primes = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97]
    const notPrime = d === 2 ? [1, 9, 15, 21, 25, 27, 33, 35] : [49, 51, 57, 63, 77, 87, 91, 93, 111]
    if (rng.chance(0.5)) {
      const p = rng.pick(primes)
      const traps = rng.shuffle(notPrime).slice(0, 3)
      return choice({
        rng,
        prompt: 'Which of these is a prime number?',
        correct: String(p),
        wrong: traps.map(String),
        hint: 'Try dividing by 2, 3, 5 and 7 - if any goes in exactly, it is not prime.',
        explanation: `${p} is only divisible by 1 and itself. ${traps[0]} is divisible by ${[3, 5, 7].find((k) => (traps[0] as number) % k === 0) ?? 'another number'}, so it is not prime.`,
      })
    }
    const np = rng.pick(notPrime.filter((n) => n > 1))
    const ps = rng.shuffle(primes).slice(0, 3)
    return choice({
      rng,
      prompt: 'Which of these is NOT a prime number?',
      correct: String(np),
      wrong: ps.map(String),
      hint: 'Look for a number that divides into one of these exactly.',
      explanation: `${np} = ${np % 3 === 0 ? `3 × ${np / 3}` : np % 7 === 0 ? `7 × ${np / 7}` : np % 5 === 0 ? `5 × ${np / 5}` : `${np}`} so it has extra factors.`,
    })
  }),
  G('props.hcf', 'number.properties', [2, 5], (rng, d) => {
    const g = rng.int(d === 2 ? 2 : 3, d === 2 ? 5 : d === 3 ? 8 : 12)
    const pairs = (): [number, number] => {
      for (;;) {
        const p = rng.int(2, d === 5 ? 6 : 5)
        const q = rng.int(2, d === 5 ? 9 : 7)
        if (p !== q && gcd(p, q) === 1) return [p, q]
      }
    }
    if (d === 5) {
      const [p, q] = pairs()
      let r = rng.int(2, 9)
      while (gcd(gcd(p, q), r) !== 1 || r === p || r === q) r = rng.int(2, 9)
      const [A, B, C] = [g * p, g * q, g * r]
      return num({
        prompt: `Find the highest common factor (HCF) of ${A}, ${B} and ${C}.`,
        answer: gcd(gcd(A, B), C),
        hint: 'List the factors of each number, then find the biggest one they all share.',
        explanation: `HCF(${A}, ${B}, ${C}) = ${gcd(gcd(A, B), C)}.`,
        errors: [ex('hcf-lcm-mixup', 'That looks like a common MULTIPLE. The HCF is the biggest number that divides into all of them.', lcm(lcm(A, B), C))],
      })
    }
    const [p, q] = pairs()
    const [A, B] = [g * p, g * q]
    return num({
      prompt: `Find the highest common factor (HCF) of ${A} and ${B}.`,
      answer: g,
      hint: `List the factors of ${A} and of ${B}, then pick the biggest that appears in both lists.`,
      explanation: `Both ${A} = ${g} × ${p} and ${B} = ${g} × ${q}. The biggest shared factor is ${g}.`,
      errors: [ex('hcf-lcm-mixup', 'That looks like a common MULTIPLE (the LCM). The HCF is the biggest number that divides into both.', lcm(A, B))],
    })
  }),
  G('props.lcm', 'number.properties', [2, 5], (rng, d) => {
    const pools: Record<number, [number, number][]> = {
      2: [[4, 6], [3, 5], [6, 9], [2, 7], [4, 10]],
      3: [[8, 12], [6, 10], [9, 12], [10, 15], [6, 8]],
      4: [[12, 18], [15, 20], [14, 21], [16, 24], [18, 30]],
    }
    if (d === 5) {
      const set = rng.pick<[number, number, number]>([[4, 6, 10], [6, 8, 12], [3, 4, 5], [6, 9, 15], [4, 10, 14], [5, 6, 8]])
      return num({
        prompt: `Find the lowest common multiple (LCM) of ${set[0]}, ${set[1]} and ${set[2]}.`,
        answer: lcm(lcm(set[0], set[1]), set[2]),
        hint: 'List multiples of the biggest number until one is also a multiple of the others.',
        explanation: `LCM = ${lcm(lcm(set[0], set[1]), set[2])}.`,
        errors: [ex('multiplied-not-lcm', 'That is a common multiple, but not the lowest one.', set[0] * set[1] * set[2])],
      })
    }
    const [a, b] = rng.pick(pools[d] as [number, number][])
    const errs = a * b !== lcm(a, b) ? [ex('multiplied-not-lcm', `${a * b} is a common multiple, but there is a smaller one.`, a * b)] : []
    return num({
      prompt: `Find the lowest common multiple (LCM) of ${a} and ${b}.`,
      answer: lcm(a, b),
      hint: `Write out the multiples of ${a} and of ${b} until you spot the first number in both lists.`,
      explanation: `Multiples of ${a}: ${[1, 2, 3, 4, 5].map((k) => a * k).join(', ')}...  Multiples of ${b}: ${[1, 2, 3, 4, 5].map((k) => b * k).join(', ')}...  First match: ${lcm(a, b)}.`,
      errors: [...errs, ex('hcf-lcm-mixup', 'That is a factor, but the LCM is a common MULTIPLE - it must be at least as big as both numbers.', gcd(a, b))],
    })
  }),
  G('props.word', 'number.properties', [3, 5], (rng, d) => {
    const g = rng.int(2, 6)
    const [p, q] = rng.pick<[number, number]>([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5]])
    if (rng.chance(0.5)) {
      const [a, b] = [g * p * (d - 1), g * q * (d - 1)]
      return num({
        prompt: `Two buses leave the station together. One leaves every ${a} minutes and the other every ${b} minutes. After how many minutes will they next leave together?`,
        answer: lcm(a, b),
        suffix: 'minutes',
        hint: 'Which type of problem is this - "at the same time again" means multiples.',
        explanation: `Find the LCM of ${a} and ${b}: ${lcm(a, b)}.`,
      })
    }
    const [a, b] = [g * p * (d - 1), g * q * (d - 1)]
    return num({
      prompt: `Ribbons of length ${a} cm and ${b} cm are cut into equal pieces with no ribbon left over. What is the longest possible length of each piece?`,
      answer: gcd(a, b),
      suffix: 'cm',
      hint: 'The piece length must divide into both lengths - "biggest possible" means highest common factor.',
      explanation: `HCF of ${a} and ${b} is ${gcd(a, b)}.`,
    })
  }),

  // ==================================================== FRACTIONS/DECIMALS/%
  G('fdp.convert', 'number.fdp', [1, 4], (rng, d) => {
    if (d === 1) {
      const [n, den, dec] = rng.pick<[number, number, number]>([[1, 2, 0.5], [1, 4, 0.25], [3, 4, 0.75], [1, 5, 0.2], [2, 5, 0.4], [3, 5, 0.6], [1, 10, 0.1], [7, 10, 0.7], [9, 10, 0.9]])
      return num({ prompt: `Write ${F(n, den)} as a decimal.`, answer: dec, hint: `Divide the top by the bottom: ${n} ÷ ${den}.`, explanation: `${n} ÷ ${den} = ${dec}.` })
    }
    if (d === 2) {
      if (rng.chance(0.5)) {
        const dec = rng.int(1, 19) * 5 / 100
        return num({ prompt: `Write ${dec} as a percentage.`, answer: round(dec * 100, 1), suffix: '%', hint: 'Percent means "out of 100": multiply by 100.', explanation: `${dec} × 100 = ${round(dec * 100, 1)}%.` })
      }
      const [n, den] = rng.pick<[number, number]>([[3, 20], [7, 20], [11, 25], [3, 25], [9, 50], [17, 50], [7, 10], [13, 20]])
      return num({ prompt: `Write ${F(n, den)} as a percentage.`, answer: (n * 100) / den, suffix: '%', hint: `Make the denominator 100: ${den} × ${100 / den} = 100.`, explanation: `${n} × ${100 / den} = ${(n * 100) / den}, so ${(n * 100) / den}%.` })
    }
    if (d === 3) {
      const pct = rng.pick([15, 35, 45, 60, 65, 24, 36, 12, 8, 55, 85])
      const r = reduce(pct, 100)
      return num({
        prompt: `Write ${pct}% as a fraction in its simplest form.`,
        answer: r.answer,
        display: r.display,
        lowest: true,
        hint: `${pct}% = ${F(pct, 100)}. Now simplify by dividing top and bottom by the same number.`,
        explanation: `${F(pct, 100)} = ${F(r.n, r.d)} (divide by ${gcd(pct, 100)}).`,
      })
    }
    const [n, den] = rng.pick<[number, number]>([[3, 8], [5, 8], [7, 8], [7, 40], [9, 40], [3, 16], [1, 8]])
    return num({
      prompt: `Write ${F(n, den)} as a decimal.`,
      answer: n / den,
      hint: `Divide ${n} by ${den}. Try ${F(1, den)} first, then multiply by ${n}.`,
      explanation: `${n} ÷ ${den} = ${n / den}.`,
    })
  }),
  G('fdp.match', 'number.fdp', [2, 4], (rng, d) => {
    const bank: [string, string, string][] = [
      [F(1, 2), '0.5', '50%'], [F(1, 4), '0.25', '25%'], [F(3, 4), '0.75', '75%'], [F(1, 5), '0.2', '20%'],
      [F(1, 10), '0.1', '10%'], [F(3, 10), '0.3', '30%'], [F(2, 5), '0.4', '40%'], [F(3, 5), '0.6', '60%'],
      [F(1, 8), '0.125', '12.5%'], [F(3, 8), '0.375', '37.5%'], [F(7, 10), '0.7', '70%'], [F(4, 5), '0.8', '80%'],
    ]
    const pool = d === 4 ? bank : bank.slice(0, 8)
    const count = d === 2 ? 3 : 4
    const chosen = rng.shuffle(pool).slice(0, count)
    const useDec = rng.chance(0.5)
    return {
      kind: 'match',
      prompt: `Match each fraction to the equal ${useDec ? 'decimal' : 'percentage'}.`,
      hint: `Convert each fraction: divide top by bottom${useDec ? '' : ', then multiply by 100'}.`,
      explanation: chosen.map((c) => `${c[0]} = ${useDec ? c[1] : c[2]}`).join('; '),
      pairs: chosen.map((c, i) => ({ id: `p${i}`, left: c[0], right: useDec ? c[1] : c[2] })),
    }
  }),
  G('fdp.percent-of', 'number.fdp', [1, 4], (rng, d) => {
    const pct = d === 1 ? 10 : d === 2 ? rng.pick([50, 25, 10]) : d === 3 ? rng.pick([5, 20, 25, 10]) : rng.pick([15, 30, 35, 12.5])
    const unit = pct === 12.5 ? 8 : pct === 35 || pct === 15 ? 20 : pct === 25 || pct === 5 ? 20 : pct === 20 ? 5 : 10
    const amount = unit * rng.int(2, d === 1 ? 9 : 12)
    const ans = round((amount * pct) / 100, 4)
    const wrong = round(amount / pct, 4)
    return num({
      prompt: `Work out ${pct}% of ${amount}.`,
      answer: ans,
      hint: pct === 10 ? 'Find 10% by dividing by 10.' : pct === 25 ? '25% is a quarter: divide by 4.' : pct === 50 ? '50% is a half.' : pct === 5 ? 'Find 10% (÷10), then halve it.' : pct === 15 ? '15% = 10% + 5%.' : pct === 20 ? '20% = 2 × 10%.' : pct === 30 ? '30% = 3 × 10%.' : 'Break the percentage into pieces you can find: 10%, 5%, 1%...',
      explanation: `${pct}% of ${amount} = ${ans}.`,
      errors: wrong !== ans ? [ex('divided-by-percent', `Dividing by ${pct} does not find ${pct}%. Think of ${pct}% as ${pct} out of every 100.`, wrong)] : undefined,
    })
  }),
  G('fdp.order-mixed', 'number.fdp', [4, 5], (rng) => {
    const bank: [number, string, string, string][] = [
      [0.5, F(1, 2), '0.5', '50%'], [0.6, F(3, 5), '0.6', '60%'], [0.625, F(5, 8), '0.625', '62.5%'], [0.65, F(13, 20), '0.65', '65%'],
      [0.7, F(7, 10), '0.7', '70%'], [0.75, F(3, 4), '0.75', '75%'], [0.8, F(4, 5), '0.8', '80%'], [0.85, F(17, 20), '0.85', '85%'],
    ]
    const picks = rng.shuffle(bank).slice(0, 4)
    const shown = picks.map((p) => ({ v: p[0], label: p[1 + rng.int(0, 2)] as string }))
    const sorted = [...shown].sort((a, b) => a.v - b.v)
    const items = sorted.map((s, i) => ({ id: `n${i}`, label: s.label }))
    return {
      kind: 'order',
      prompt: 'Put these in order, smallest first.',
      hint: 'Change everything to decimals (or percentages) so you can compare like with like.',
      explanation: sorted.map((s) => `${s.label} = ${s.v}`).join(', ') + '.',
      items: shuffledNotSorted(rng, items),
      correctOrder: items.map((i) => i.id),
      directionLabel: ['smallest', 'largest'],
    }
  }),

  // =========================================================== INDICES / ROOTS (Y8)
  G('roots.roots', 'number.indices-roots', [1, 4], (rng, d) => {
    if (d <= 2) {
      const n = rng.int(d === 1 ? 2 : 6, d === 1 ? 10 : 15)
      return num({
        prompt: `What is √${n * n}?`,
        answer: n,
        hint: `Which number multiplied by itself gives ${n * n}?`,
        explanation: `${n} × ${n} = ${n * n}, so √${n * n} = ${n}.`,
        errors: [ex('halved-not-rooted', 'A square root is not half the number. Which number times itself gives it?', (n * n) / 2)],
      })
    }
    if (d === 3) {
      const n = rng.int(2, 6)
      return num({
        prompt: `What is ∛${n ** 3}? (the cube root)`,
        answer: n,
        hint: `Which number multiplied by itself three times gives ${n ** 3}?`,
        explanation: `${n} × ${n} × ${n} = ${n ** 3}, so ∛${n ** 3} = ${n}.`,
        errors: [ex('third-not-rooted', 'A cube root is not a third of the number.', (n ** 3) / 3)],
      })
    }
    const a = rng.int(3, 12)
    const b = rng.int(2, 5)
    const plus = rng.chance(0.5)
    return num({
      prompt: `Work out  √${a * a} ${plus ? '+' : '−'} ∛${b ** 3}`,
      answer: plus ? a + b : a - b,
      hint: 'Find each root separately, then add or subtract.',
      explanation: `√${a * a} = ${a} and ∛${b ** 3} = ${b}, so the answer is ${plus ? a + b : a - b}.`,
    })
  }),
  G('roots.evaluate', 'number.indices-roots', [1, 3], (rng, d) => {
    const base = d === 1 ? rng.pick([2, 3, 10]) : rng.pick([2, 3, 4, 5, 10])
    const exp = d === 1 ? rng.int(2, 4) : d === 2 ? rng.int(3, 6) : rng.int(4, 7)
    const ans = base ** exp
    if (ans > 300000) return num({ prompt: `What is ${sup(2, 8)}?`, answer: 256, hint: '2^{8}: keep doubling.', explanation: '2, 4, 8, 16, 32, 64, 128, 256.' })
    return num({
      prompt: `What is ${sup(base, exp)}?`,
      answer: ans,
      hint: `${sup(base, exp)} means ${base} multiplied by itself ${exp} times.`,
      explanation: `${Array(exp).fill(base).join(' × ')} = ${ans}.`,
      errors: [ex('multiplied-by-index', `${sup(base, exp)} is not ${base} × ${exp}. The small number tells you how many ${base}s to multiply.`, base * exp)],
    })
  }),
  G('roots.laws', 'number.indices-roots', [2, 5], (rng, d) => {
    const base = rng.pick([2, 3, 4, 5, 6, 7, 10])
    const p = rng.int(2, 9)
    const q = rng.int(2, 6)
    if (d === 2) {
      return multi({
        prompt: `Write ${sup(base, p)} × ${sup(base, q)} as a single power of ${base}.`,
        fields: [{ answer: p + q, superscript: true }],
        template: `${base}{0}`,
        hint: 'When you multiply powers of the same base, ADD the indices.',
        explanation: `${sup(base, p)} × ${sup(base, q)} = ${sup(base, `${p} + ${q}`)} = ${sup(base, p + q)}.`,
        errors: [ex('multiplied-indices', 'When multiplying, you add the powers - not multiply them.', p * q)],
      })
    }
    if (d === 3) {
      const big = p + q
      return multi({
        prompt: `Write ${sup(base, big)} ÷ ${sup(base, q)} as a single power of ${base}.`,
        fields: [{ answer: p, superscript: true }],
        template: `${base}{0}`,
        hint: 'When you divide powers of the same base, SUBTRACT the indices.',
        explanation: `${sup(base, big)} ÷ ${sup(base, q)} = ${sup(base, `${big} − ${q}`)} = ${sup(base, p)}.`,
        errors: [ex('divided-indices', 'When dividing, subtract the powers - not divide them.', round(big / q, 4))],
      })
    }
    if (d === 4) {
      const r = rng.int(1, p + q - 1)
      return multi({
        prompt: `Write (${sup(base, p)} × ${sup(base, q)}) ÷ ${sup(base, r)} as a single power of ${base}.`,
        fields: [{ answer: p + q - r, superscript: true }],
        template: `${base}{0}`,
        hint: 'Add the indices for ×, then subtract for ÷.',
        explanation: `${p} + ${q} = ${p + q}, then ${p + q} − ${r} = ${p + q - r}.`,
      })
    }
    const b2 = rng.pick([2, 3])
    const [x, y, z] = [rng.int(2, 4), rng.int(2, 4), rng.int(1, 3)]
    return num({
      prompt: `Work out the value of ${sup(b2, x)} × ${sup(b2, y)} ÷ ${sup(b2, z)}.`,
      answer: b2 ** (x + y - z),
      hint: 'Combine into a single power first, then calculate.',
      explanation: `${sup(b2, `${x} + ${y} − ${z}`)} = ${sup(b2, x + y - z)} = ${b2 ** (x + y - z)}.`,
    })
  }),

  // ================================================================ STANDARD FORM
  G('sf.to', 'number.standard-form', [1, 5], (rng, d) => {
    const mantissaOf = (dec: number) => {
      const first = rng.int(1, 9)
      if (dec === 0) return String(first)
      let rest = ''
      for (let i = 0; i < dec; i++) rest += rng.int(i === dec - 1 ? 1 : 0, 9)
      return `${first}.${rest}`
    }
    const cfg: Record<number, { dec: number; exps: number[] }> = {
      1: { dec: 0, exps: [2, 3, 4] },
      2: { dec: 1, exps: [3, 4, 5] },
      3: { dec: 1, exps: [5, 6, 7, 8, -2, -3, -4] },
      4: { dec: 2, exps: [8, 9, 10, 11, -3, -4, -5, -6] },
      5: { dec: 2, exps: [-4, -5, -6, -7, 9, 10] },
    }
    const c = cfg[d] as { dec: number; exps: number[] }
    const mant = mantissaOf(c.dec)
    const exp = rng.pick(c.exps)
    const ord = ordinary(mant, exp)
    const shown = exp > 0 ? spaced(ord) : ord
    const a = Number(mant)
    return multi({
      prompt: `Write ${shown} in standard form.`,
      fields: [{ answer: a }, { answer: exp, superscript: true }],
      template: '{0} × 10{1}',
      hint: 'Move the decimal point so the first number is between 1 and 10. Count how many places you moved: that is the power of 10 (negative for small numbers).',
      explanation: `${shown} = ${mant} × 10^{${exp}}.`,
      errors: [
        { tag: 'not-standard-form', message: 'The first number must be at least 1 and less than 10 in standard form.', values: [round(a * 10, 6), exp - 1] },
        { tag: 'not-standard-form', message: 'The first number must be at least 1 and less than 10 in standard form.', values: [round(a / 10, 6), exp + 1] },
        ...(exp < 0 ? [{ tag: 'exponent-sign', message: 'Small numbers (less than 1) have a NEGATIVE power of 10.', values: [a, -exp] }] : []),
      ],
    })
  }),
  G('sf.from', 'number.standard-form', [2, 4], (rng, d) => {
    const mant = d === 2 ? `${rng.int(1, 9)}.${rng.int(1, 9)}` : `${rng.int(1, 9)}.${rng.int(1, 9)}${rng.int(1, 9)}`
    const exp = d === 2 ? rng.int(2, 5) : rng.pick([6, 7, 8, -2, -3, -4, -5])
    const ord = ordinary(mant, exp)
    const ans = Number(ord)
    return num({
      prompt: `Write ${mant} × 10^{${exp}} as an ordinary number.`,
      answer: ans,
      tolerance: Math.abs(ans) * 1e-9,
      hint: exp > 0 ? `Move the decimal point ${exp} places to the RIGHT.` : `Move the decimal point ${-exp} places to the LEFT (the number is small).`,
      explanation: `${mant} × 10^{${exp}} = ${exp > 0 ? spaced(ord) : ord}.`,
      errors: [ex('wrong-number-of-zeros', 'Check how many places the decimal point moves - count carefully.', ans * 10, ans / 10)],
    })
  }),
  G('sf.compare', 'number.standard-form', [3, 4], (rng) => {
    const a = rng.int(11, 99) / 10
    const b = rng.int(11, 99) / 10
    const e1 = rng.int(3, 8)
    const e2 = e1 + rng.pick([-1, 1])
    const v1 = a * 10 ** e1
    const v2 = b * 10 ** e2
    const s1 = `${a} × 10^{${e1}}`
    const s2 = `${b} × 10^{${e2}}`
    const bigger = v1 > v2 ? s1 : s2
    const smaller = v1 > v2 ? s2 : s1
    return choice({
      rng,
      prompt: 'Which of these numbers is bigger?',
      correct: bigger,
      wrong: [{ label: smaller, misconception: 'compared-mantissa-only', feedback: 'Compare the powers of 10 first - a bigger power means a much bigger number.' }],
      hint: 'Compare the power of 10 first. If they differ by 1, the bigger power usually wins - but check!',
      explanation: `${s1} = ${spaced(Math.round(v1))} and ${s2} = ${spaced(Math.round(v2))}. So ${bigger} is bigger.`,
    })
  }),
  G('sf.calc', 'number.standard-form', [5, 5], (rng) => {
    const a = rng.int(2, 9)
    const b = rng.int(2, 9)
    const e1 = rng.int(2, 7)
    const e2 = rng.int(2, 7)
    const p = a * b
    const [mant, exp] = p >= 10 ? [p / 10, e1 + e2 + 1] : [p, e1 + e2]
    return multi({
      prompt: `Work out (${a} × 10^{${e1}}) × (${b} × 10^{${e2}}). Give your answer in standard form.`,
      fields: [{ answer: mant }, { answer: exp, superscript: true }],
      template: '{0} × 10{1}',
      hint: 'Multiply the front numbers, and multiply the powers of 10 (add the indices). Then check the front number is between 1 and 10.',
      explanation: `${a} × ${b} = ${p}; 10^{${e1}} × 10^{${e2}} = 10^{${e1 + e2}}. So ${p} × 10^{${e1 + e2}}${p >= 10 ? ` = ${p / 10} × 10^{${e1 + e2 + 1}}` : ''}.`,
      errors: p >= 10 ? [{ tag: 'not-standard-form', message: 'The front number must be less than 10 - adjust it and change the power.', values: [p, e1 + e2] }] : undefined,
    })
  }),

  // ============================================================ DIRECTED NUMBERS
  G('dn.addsub', 'number.directed-numbers', [1, 2], (rng, d) => {
    if (d === 1) {
      if (rng.chance(0.5)) {
        const a = rng.int(-9, -1)
        const b = rng.int(1, 14)
        return num({ prompt: `${m(a)} + ${b} = ?`, answer: a + b, hint: 'Picture a number line. Start at the first number and move right.', explanation: `${m(a)} + ${b} = ${m(a + b)}.` })
      }
      const a = rng.int(1, 9)
      const b = rng.int(a + 1, a + 9)
      return num({ prompt: `${a} − ${b} = ?`, answer: a - b, hint: 'Go down past zero into the negatives.', explanation: `${a} − ${b} = ${m(a - b)}.` })
    }
    const kind = rng.int(0, 3)
    const a = rng.int(-9, 9)
    const b = rng.int(1, 9)
    if (kind === 0) return num({ prompt: `${m(a)} − ${b} = ?`, answer: a - b, hint: 'Subtracting moves you LEFT on the number line.', explanation: `${m(a)} − ${b} = ${m(a - b)}.` })
    if (kind === 1)
      return num({
        prompt: `${m(a)} − (${m(-b)}) = ?`,
        answer: a + b,
        hint: 'Subtracting a negative is the same as adding.',
        explanation: `Two minuses make a plus: ${m(a)} + ${b} = ${m(a + b)}.`,
        errors: [ex('double-negative', 'Subtracting a negative number is the same as ADDING the positive.', a - b)],
      })
    if (kind === 2) return num({ prompt: `${m(a)} + (${m(-b)}) = ?`, answer: a - b, hint: 'Adding a negative is the same as subtracting.', explanation: `${m(a)} + (${m(-b)}) = ${m(a)} − ${b} = ${m(a - b)}.` })
    return num({ prompt: `${m(-b)} − ${m(-Math.abs(a) - 1)} = ?`, answer: -b + Math.abs(a) + 1, hint: 'Subtracting a negative means add the positive.', explanation: `${m(-b)} + ${Math.abs(a) + 1} = ${m(-b + Math.abs(a) + 1)}.` })
  }),
  G('dn.context', 'number.directed-numbers', [2, 3], (rng, d) => {
    const kind = rng.int(0, d === 3 ? 3 : 2)
    if (kind === 0) {
      const low = rng.int(-12, -2)
      const high = rng.int(4, 15)
      return num({ prompt: `Overnight the temperature was ${m(low)}°C. By midday it was ${high}°C. How many degrees did it rise?`, answer: high - low, suffix: '°C', hint: 'Count from the low temperature up to the high one - through zero.', explanation: `${high} − (${m(low)}) = ${high - low}.` })
    }
    if (kind === 1) {
      const depth = rng.int(20, 80)
      const rise = rng.int(5, depth - 5)
      return num({ prompt: `A submarine is at ${m(-depth)} m. It rises ${rise} m. Where is it now?`, answer: -depth + rise, suffix: 'm', hint: 'Rising means going UP: add.', explanation: `${m(-depth)} + ${rise} = ${m(-depth + rise)}.` })
    }
    if (kind === 2) {
      const bal = rng.int(20, 90)
      const dep = rng.int(bal + 5, bal + 80)
      return num({ prompt: `Priya's account is overdrawn: her balance is ${m(-bal)} pounds. She pays in £${dep}. What is her balance now?`, answer: dep - bal, prefix: '£', hint: 'Start at the negative and add the deposit.', explanation: `${m(-bal)} + ${dep} = ${dep - bal}.` })
    }
    const down = rng.int(2, 4)
    const up = rng.int(down + 3, down + 9)
    return num({ prompt: `A lift starts on floor 1 and goes down ${down + 1} floors to the basement levels (floor 0 is the ground). It then goes up ${up} floors. Which floor is it on now?`, answer: 1 - (down + 1) + up, hint: 'Going down subtracts, going up adds. Floors below ground are negative.', explanation: `1 − ${down + 1} = ${m(-down)}, then + ${up} = ${m(-down + up)}.` })
  }),
  G('dn.multdiv', 'number.directed-numbers', [3, 4], (rng, d) => {
    const a = rng.int(2, d === 3 ? 9 : 12)
    const b = rng.int(2, d === 3 ? 9 : 12)
    let sa = rng.chance(0.5) ? -1 : 1
    let sb = rng.chance(0.5) ? -1 : 1
    if (sa === 1 && sb === 1) (rng.chance(0.5) ? (sa = -1) : (sb = -1))
    const A = sa * a
    const B = sb * b
    const mult = rng.chance(0.55)
    // Multiplication: A x B. Division: build the dividend from a quotient so it is always exact.
    const real = mult ? A * B : A
    const prompt = mult ? `${mp(A)} × ${mp(B)} = ?` : `${m(A * B)} ÷ ${mp(B)} = ?`
    const sameSigns = mult ? Math.sign(A) === Math.sign(B) : Math.sign(A * B) === Math.sign(B)
    return num({
      prompt,
      answer: real,
      hint: 'Same signs give a positive answer; different signs give a negative answer.',
      explanation: `${sameSigns ? 'Same' : 'Different'} signs, so the answer is ${real > 0 ? 'positive' : 'negative'}: ${m(real)}.`,
      errors: [ex('sign-rule', 'The size is right, but check the sign: same signs give positive, different signs give negative.', -real)],
    })
  }),
  G('dn.mixed', 'number.directed-numbers', [4, 5], (rng, d) => {
    if (d === 4) {
      if (rng.chance(0.5)) {
        const a = rng.int(2, 6)
        const b = rng.int(2, 6)
        const c = rng.int(1, 9)
        return num({ prompt: `${mp(-a)} × ${mp(-b)} + ${mp(-c)} = ?`, answer: a * b - c, hint: 'Do the multiplication first (BIDMAS), then the addition.', explanation: `${mp(-a)} × ${mp(-b)} = ${a * b}; ${a * b} + ${mp(-c)} = ${m(a * b - c)}.` })
      }
      const a = rng.int(1, 9)
      const b = rng.int(2, 8)
      const c = rng.int(2, 5)
      return num({
        prompt: `${m(-a)} − ${mp(-b)} × ${c} = ?`,
        answer: -a + b * c,
        hint: 'Multiplication comes first. Then subtracting a negative means adding.',
        explanation: `${mp(-b)} × ${c} = ${m(-b * c)}; ${m(-a)} − (${m(-b * c)}) = ${m(-a + b * c)}.`,
        errors: [ex('ignored-precedence', 'Do the multiplication before the subtraction.', (-a + b) * c)],
      })
    }
    const a = rng.int(2, 6)
    const b = rng.int(2, 6)
    const c = rng.int(2, 6)
    return num({
      prompt: `${mp(-a)}^{2} − ${b} × ${mp(-c)} = ?`,
      answer: a * a + b * c,
      hint: '(−a)² means (−a) × (−a), which is positive.',
      explanation: `${mp(-a)}^{2} = ${a * a}; ${b} × ${mp(-c)} = ${m(-b * c)}; ${a * a} − (${m(-b * c)}) = ${a * a + b * c}.`,
      errors: [ex('negative-square', 'A negative number squared is POSITIVE: (−a) × (−a).', -a * a + b * c)],
    })
  }),

  // ============================================================ FRACTION ARITHMETIC
  G('fa.addsub', 'number.fraction-arithmetic', [1, 3], (rng, d) => {
    const opAdd = rng.chance(0.6)
    if (d === 1) {
      const den = rng.pick([5, 6, 7, 8, 9, 10, 12])
      const a = opAdd ? rng.int(1, den - 1) : rng.int(2, den - 1)
      const b = opAdd ? rng.int(1, den - 1) : rng.int(1, a - 1)
      const N = opAdd ? a + b : a - b
      return num({
        prompt: `Work out ${F(a, den)} ${opAdd ? '+' : '−'} ${F(b, den)}. Give your answer in its simplest form.`,
        answer: N / den,
        display: frDisplay(N, den),
        lowest: true,
        hint: 'The denominators match, so just add or subtract the numerators. Then simplify.',
        explanation: `${a} ${opAdd ? '+' : '−'} ${b} = ${N}, so ${F(N, den)}${reduce(N, den).d !== den ? ` = ${frRich(N, den)}` : ''}.`,
      })
    }
    if (d === 2) {
      const [d1, d2] = rng.pick<[number, number]>([[2, 3], [2, 5], [3, 4], [3, 5], [4, 5], [2, 4], [3, 6], [4, 8], [5, 10], [2, 6]])
      const coprime = (den: number) => {
        let n = rng.int(1, den - 1)
        while (gcd(n, den) !== 1) n = rng.int(1, den - 1)
        return n
      }
      let a = coprime(d1)
      let b = coprime(d2)
      const L = lcm(d1, d2)
      let A = a * (L / d1)
      let B = b * (L / d2)
      if (!opAdd && A < B) {
        ;[a, b] = [b, a]
        ;[A, B] = [B, A]
        return num({
          prompt: `Work out ${F(a, d2)} − ${F(b, d1)}. Give your answer in its simplest form.`,
          answer: (A - B) / L,
          display: frDisplay(A - B, L),
          lowest: true,
          hint: `Find a common denominator (${L}) and change both fractions.`,
          explanation: `${F(a, d2)} = ${F(A, L)} and ${F(b, d1)} = ${F(B, L)}; ${A} − ${B} = ${A - B}, so ${F(A - B, L)}${reduce(A - B, L).d !== L ? ` = ${frRich(A - B, L)}` : ''}.`,
        })
      }
      const N = opAdd ? A + B : A - B
      return num({
        prompt: `Work out ${F(a, d1)} ${opAdd ? '+' : '−'} ${F(b, d2)}. Give your answer in its simplest form.`,
        answer: N / L,
        display: N === 0 ? '0' : frDisplay(N, L),
        lowest: true,
        hint: `Find a common denominator (${L}) and change both fractions first.`,
        explanation: `${F(a, d1)} = ${F(A, L)} and ${F(b, d2)} = ${F(B, L)}; ${A} ${opAdd ? '+' : '−'} ${B} = ${N}, so ${F(N, L)}${reduce(Math.abs(N) || 1, L).d !== L ? ` = ${frRich(N, L)}` : ''}.`,
        errors: opAdd ? [ex('added-denominators', 'You cannot add the denominators. Change to a common denominator, then add the numerators only.', (a + b) / (d1 + d2))] : undefined,
      })
    }
    const [w1, w2] = [rng.int(1, 3), rng.int(1, 3)]
    const [d1, d2] = rng.pick<[number, number]>([[2, 4], [2, 3], [3, 6], [4, 8], [2, 5]])
    const coprime = (den: number) => {
      let n = rng.int(1, den - 1)
      while (gcd(n, den) !== 1) n = rng.int(1, den - 1)
      return n
    }
    const n1 = coprime(d1)
    const n2 = coprime(d2)
    const L = lcm(d1, d2)
    const T1 = (w1 * d1 + n1) * (L / d1)
    const T2 = (w2 * d2 + n2) * (L / d2)
    return num({
      prompt: `Work out ${mixed(w1, n1, d1)} + ${mixed(w2, n2, d2)}. Give your answer in its simplest form.`,
      answer: (T1 + T2) / L,
      display: frDisplay(T1 + T2, L),
      lowest: true,
      hint: 'Add the whole numbers, then add the fractions (common denominator!). Carry over if the fraction part is 1 or more.',
      explanation: `Wholes: ${w1} + ${w2} = ${w1 + w2}. Fractions: ${F(n1 * (L / d1), L)} + ${F(n2 * (L / d2), L)} = ${F(n1 * (L / d1) + n2 * (L / d2), L)}. Total = ${frRich(T1 + T2, L)}.`,
    })
  }),
  G('fa.multdiv', 'number.fraction-arithmetic', [3, 5], (rng, d) => {
    const divide = rng.chance(0.5)
    if (d === 3) {
      const b = rng.int(2, 7)
      const dd = rng.int(2, 8)
      const A = rng.int(1, b - 1)
      const C = rng.int(1, dd - 1)
      const N = divide ? A * dd : A * C
      const D = divide ? b * C : b * dd
      return num({
        prompt: `Work out ${F(A, b)} ${divide ? '÷' : '×'} ${F(C, dd)}. Give your answer in its simplest form.`,
        answer: N / D,
        display: frDisplay(N, D),
        lowest: true,
        hint: divide ? 'Keep the first fraction, flip the second one upside down, then multiply.' : 'Multiply the tops together and the bottoms together, then simplify.',
        explanation: divide ? `${F(A, b)} × ${F(dd, C)} = ${F(N, D)} = ${frRich(N, D)}.` : `${F(A * C, b * dd)} = ${frRich(N, D)}.`,
        errors: divide ? [ex('forgot-to-flip', 'When dividing by a fraction, flip it (turn it upside down) and multiply.', (A * C) / (b * dd))] : undefined,
      })
    }
    const mk = () => {
      const den = rng.int(2, 5)
      let n = rng.int(1, den - 1)
      while (gcd(n, den) !== 1) n = rng.int(1, den - 1)
      return { w: rng.int(1, 3), n, d: den }
    }
    const p = mk()
    const q = mk()
    const P = p.w * p.d + p.n
    const Q = q.w * q.d + q.n
    if (d === 4) {
      const N = P * Q
      const D = p.d * q.d
      return num({
        prompt: `Work out ${mixed(p.w, p.n, p.d)} × ${mixed(q.w, q.n, q.d)}. Give your answer in its simplest form.`,
        answer: N / D,
        display: frDisplay(N, D),
        lowest: true,
        hint: 'Change each mixed number to an improper fraction first, then multiply.',
        explanation: `${F(P, p.d)} × ${F(Q, q.d)} = ${F(N, D)} = ${frRich(N, D)}.`,
        errors: [ex('multiplied-wholes-and-fractions', 'Convert to improper fractions - do not multiply the whole parts and the fraction parts separately.', p.w * q.w + (p.n / p.d) * (q.n / q.d))],
      })
    }
    if (divide) {
      const N = P * q.d
      const D = p.d * Q
      return num({
        prompt: `Work out ${mixed(p.w, p.n, p.d)} ÷ ${mixed(q.w, q.n, q.d)}. Give your answer in its simplest form.`,
        answer: N / D,
        display: frDisplay(N, D),
        lowest: true,
        hint: 'Improper fractions first. Then keep the first, flip the second, multiply.',
        explanation: `${F(P, p.d)} ÷ ${F(Q, q.d)} = ${F(P, p.d)} × ${F(q.d, Q)} = ${F(N, D)} = ${frRich(N, D)}.`,
        errors: [ex('forgot-to-flip', 'When dividing by a fraction, flip it and multiply.', (P * Q) / (p.d * q.d))],
      })
    }
    const L = lcm(p.d, q.d)
    const T1 = P * (L / p.d)
    const T2 = Q * (L / q.d)
    const hi = Math.max(T1, T2)
    const lo = Math.min(T1, T2)
    const [big, small] = T1 >= T2 ? [p, q] : [q, p]
    return num({
      prompt: `Work out ${mixed(big.w, big.n, big.d)} − ${mixed(small.w, small.n, small.d)}. Give your answer in its simplest form.`,
      answer: (hi - lo) / L,
      display: hi === lo ? '0' : frDisplay(hi - lo, L),
      lowest: true,
      hint: 'Change to improper fractions with a common denominator, subtract, then simplify.',
      explanation: `${F(hi, L)} − ${F(lo, L)} = ${F(hi - lo, L)}${hi === lo ? '' : ` = ${frRich(hi - lo, L)}`}.`,
    })
  }),

  // ============================================================ PERCENTAGE CHANGE
  G('pc.change', 'number.percentage-change', [1, 5], (rng, d) => {
    if (d <= 2) {
      const dec = d === 2 || rng.chance(0.4)
      const pct = d === 1 ? rng.pick([10, 20, 5]) : rng.pick([10, 15, 20, 25, 30])
      const base = pct === 5 || pct === 15 ? rng.int(2, 10) * 20 : rng.int(2, 12) * 10
      const change = round((base * pct) / 100, 2)
      return num({
        prompt: dec ? `A coat costs £${base}. In a sale it is reduced by ${pct}%. What is the sale price?` : `A £${base} game console is increased in price by ${pct}%. What is its new price?`,
        answer: dec ? round(base - change, 2) : round(base + change, 2),
        prefix: '£',
        hint: `Find ${pct}% of £${base} first (that's the change), then ${dec ? 'subtract' : 'add'} it.`,
        explanation: `${pct}% of ${base} = ${change}. ${dec ? `${base} − ${change}` : `${base} + ${change}`} = £${dec ? round(base - change, 2) : round(base + change, 2)}.`,
        errors: [ex('gave-the-change-only', `That is the amount of the ${dec ? 'reduction' : 'increase'}. The question asks for the new price.`, change)],
      })
    }
    if (d === 3) {
      const old = rng.pick([20, 25, 40, 50, 80, 200])
      const pct = rng.pick([10, 20, 25, 30, 40, 50, 15, 5])
      const up = rng.chance(0.65)
      const nw = round(up ? old * (1 + pct / 100) : old * (1 - pct / 100), 2)
      return num({
        prompt: `A price ${up ? 'rises' : 'falls'} from £${old} to £${nw}. What is the percentage ${up ? 'increase' : 'decrease'}?`,
        answer: pct,
        suffix: '%',
        hint: 'Percentage change = (change ÷ ORIGINAL) × 100.',
        explanation: `Change = ${Math.abs(round(nw - old, 2))}. ${Math.abs(round(nw - old, 2))} ÷ ${old} × 100 = ${pct}%.`,
      })
    }
    if (d === 4) {
      const P = rng.pick([500, 800, 1000, 1200, 2000])
      const r = rng.pick([2, 3, 4, 5])
      const t = rng.int(2, 5)
      const one = (P * r) / 100
      return num({
        prompt: `£${P} is invested at ${r}% simple interest per year for ${t} years. How much interest is earned in total?`,
        answer: one * t,
        prefix: '£',
        hint: 'Simple interest is the same amount every year: find 1 year, then multiply.',
        explanation: `1 year: ${r}% of ${P} = £${one}. ${t} years: ${one} × ${t} = £${one * t}.`,
        errors: [ex('one-year-only', `That is only one year of interest. Multiply by ${t}.`, one)],
      })
    }
    const pct = rng.pick([20, 25, 10, 40])
    const orig = rng.pick([40, 60, 80, 120, 200])
    const now = round(orig * (1 - pct / 100), 2)
    return num({
      prompt: `After a ${pct}% reduction, a jacket costs £${now}. What was its original price?`,
      answer: orig,
      prefix: '£',
      hint: `£${now} is ${100 - pct}% of the original. Find 1% first.`,
      explanation: `${100 - pct}% = £${now}, so 1% = £${round(now / (100 - pct), 4)} and 100% = £${orig}.`,
      errors: [ex('reverse-percentage-error', `Adding ${pct}% to the sale price does not undo the reduction, because the ${pct}% was taken off the ORIGINAL price.`, round(now * (1 + pct / 100), 4))],
    })
  }),
]

/** '4.5', 4 -> '45000'; '5.6', -4 -> '0.00056'. */
export function ordinary(mant: string, exp: number): string {
  const [ip, fp = ''] = mant.split('.')
  const digits = (ip as string) + fp
  const point = (ip as string).length + exp
  if (point >= digits.length) return digits + '0'.repeat(point - digits.length)
  if (point <= 0) return '0.' + '0'.repeat(-point) + digits
  return digits.slice(0, point) + '.' + digits.slice(point)
}

