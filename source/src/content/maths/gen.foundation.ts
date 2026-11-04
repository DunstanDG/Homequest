import type { ItemGenerator } from '@/engine/registry'
import { F, G, choice, gcd, m, multi, nearby, num, round, shuffledNotSorted, sum, sup } from './helpers'

export const foundationGenerators: ItemGenerator[] = [
  // ------------------------------------------------------------ times tables
  G('f.tt.multiply', 'f.times-tables', [1, 5], (rng, d) => {
    const pools: Record<number, number[]> = { 1: [2, 5, 10], 2: [2, 3, 4, 5, 6, 10], 3: [3, 4, 6, 7, 8, 9], 4: [6, 7, 8, 9, 11, 12], 5: [7, 8, 9, 11, 12] }
    const a = rng.pick(pools[d] as number[])
    const b = rng.int(d <= 2 ? 2 : 3, 12)
    return num({
      prompt: `${a} × ${b} = ?`,
      answer: a * b,
      hint: `Think of the ${a} times table, or split ${b} into easier pieces.`,
      explanation: `${a} × ${b} = ${a * b}.`,
    })
  }),
  G('f.tt.divide', 'f.times-tables', [2, 5], (rng, d) => {
    const b = rng.pick(d <= 3 ? [2, 3, 4, 5, 6, 10] : [6, 7, 8, 9, 11, 12])
    const c = rng.int(2, 12)
    return num({
      prompt: `${b * c} ÷ ${b} = ?`,
      answer: c,
      hint: `What times ${b} makes ${b * c}?`,
      explanation: `${b} × ${c} = ${b * c}, so ${b * c} ÷ ${b} = ${c}.`,
    })
  }),
  G('f.tt.missing', 'f.times-tables', [3, 5], (rng) => {
    const a = rng.int(3, 12)
    const b = rng.int(3, 12)
    return num({
      prompt: `${a} × ? = ${a * b}`,
      answer: b,
      hint: 'Use division: undo the multiplication.',
      explanation: `${a * b} ÷ ${a} = ${b}.`,
    })
  }),

  // --------------------------------------------------------- written methods
  G('f.wm.add-sub', 'f.written-methods', [1, 3], (rng, d) => {
    if (rng.chance(0.5) || d === 1) {
      const a = rng.int(d === 1 ? 120 : 1200, d === 1 ? 680 : 6800)
      const b = rng.int(d === 1 ? 110 : 1100, d === 1 ? 290 : 2900)
      return num({ prompt: `${a} + ${b} = ?`, answer: a + b, hint: 'Line the digits up in columns and carry.', explanation: `${a} + ${b} = ${a + b}.` })
    }
    const b = rng.int(d === 2 ? 120 : 1200, d === 2 ? 480 : 4800)
    const a = b + rng.int(d === 2 ? 130 : 1300, d === 2 ? 490 : 4900)
    return num({ prompt: `${a} − ${b} = ?`, answer: a - b, hint: 'Take care when you need to exchange (borrow).', explanation: `${a} − ${b} = ${a - b}.` })
  }),
  G('f.wm.multiply', 'f.written-methods', [3, 5], (rng, d) => {
    const a = rng.int(d === 3 ? 12 : 120, d === 3 ? 99 : 480)
    const b = rng.int(d === 3 ? 3 : 12, d === 3 ? 9 : 45)
    return num({
      prompt: `${a} × ${b} = ?`,
      answer: a * b,
      hint: 'Use the grid method or long multiplication.',
      explanation: `${a} × ${b} = ${a * b}.`,
    })
  }),
  G('f.wm.divide', 'f.written-methods', [4, 5], (rng, d) => {
    const b = rng.int(d === 4 ? 3 : 12, d === 4 ? 9 : 25)
    const c = rng.int(d === 4 ? 40 : 30, d === 4 ? 180 : 90)
    return num({ prompt: `${b * c} ÷ ${b} = ?`, answer: c, hint: 'Short or long division - work digit by digit.', explanation: `${b} × ${c} = ${b * c}, so the answer is ${c}.` })
  }),

  // ---------------------------------------------------------------- decimals
  G('f.dec.round', 'f.decimals', [1, 4], (rng, d) => {
    const dp = d === 1 ? 0 : d === 2 ? 1 : d === 3 ? 2 : 3
    const whole = rng.int(1, 60)
    const extra = rng.int(1, 9999)
    const n = Number(`${whole}.${String(extra).padStart(4, '0')}`)
    const ans = round(n, dp)
    const where = dp === 0 ? 'the nearest whole number' : `${dp} decimal place${dp > 1 ? 's' : ''}`
    return num({
      prompt: `Round ${n} to ${where}.`,
      answer: ans,
      hint: `Look at the digit just after the ${dp === 0 ? 'decimal point' : 'place you are rounding to'}: 5 or more rounds up.`,
      explanation: `${n} rounded to ${where} is ${ans}.`,
    })
  }),
  G('f.dec.add', 'f.decimals', [2, 4], (rng, d) => {
    const a = round(rng.int(100, 900) / 100 + (d === 4 ? rng.int(1, 9) : 0), 2)
    const b = round(rng.int(10, 990) / (d === 2 ? 10 : 100), 2)
    return num({ prompt: `${a} + ${b} = ?`, answer: round(a + b, 2), hint: 'Line up the decimal points.', explanation: `${a} + ${b} = ${round(a + b, 2)}.` })
  }),

  // ------------------------------------------------------- squares and cubes
  G('f.sq.square', 'f.squares-cubes', [1, 4], (rng, d) => {
    const n = rng.int(d === 1 ? 2 : d === 2 ? 6 : 10, d === 1 ? 6 : d === 2 ? 12 : 15)
    return num({
      prompt: `What is ${sup(n, 2)}?`,
      answer: n * n,
      hint: `${sup(n, 2)} means ${n} × ${n}.`,
      explanation: `${sup(n, 2)} = ${n} × ${n} = ${n * n}.`,
      errors: [{ values: [n * 2], tag: 'doubled-not-squared', message: `Squaring is ${n} × ${n}, not ${n} × 2.` }],
    })
  }),
  G('f.sq.cube', 'f.squares-cubes', [2, 5], (rng, d) => {
    const n = rng.int(2, d <= 3 ? 4 : 6)
    return num({
      prompt: `What is ${sup(n, 3)}?`,
      answer: n ** 3,
      hint: `${sup(n, 3)} means ${n} × ${n} × ${n}.`,
      explanation: `${n} × ${n} = ${n * n}, then × ${n} = ${n ** 3}.`,
      errors: [{ values: [n * 3], tag: 'tripled-not-cubed', message: `Cubing is ${n} × ${n} × ${n}, not ${n} × 3.` }],
    })
  }),
  G('f.sq.sum', 'f.squares-cubes', [4, 5], (rng) => {
    const a = rng.int(3, 9)
    const b = rng.int(2, 8)
    return num({
      prompt: `Work out ${sup(a, 2)} + ${sup(b, 2)}.`,
      answer: a * a + b * b,
      hint: 'Square each number first, then add.',
      explanation: `${a * a} + ${b * b} = ${a * a + b * b}.`,
      errors: [{ values: [(a + b) ** 2], tag: 'squared-the-sum', message: 'Square each number separately, then add.' }],
    })
  }),

  // ----------------------------------------------------- factors / multiples
  G('f.fm.factor', 'f.factors-multiples', [1, 2], (rng, d) => {
    const n = rng.pick(d === 1 ? [12, 18, 20, 24, 30] : [36, 40, 42, 48, 60])
    const factors = Array.from({ length: n }, (_, i) => i + 1).filter((i) => n % i === 0)
    const correct = rng.pick(factors.filter((f) => f > 1 && f < n))
    const wrong = Array.from({ length: n }, (_, i) => i + 2).filter((i) => n % i !== 0 && i < n)
    return choice({
      rng,
      prompt: `Which of these is a factor of ${n}?`,
      correct: String(correct),
      wrong: rng.shuffle(wrong).slice(0, 3).map(String),
      hint: 'A factor divides exactly into the number with nothing left over.',
      explanation: `${n} ÷ ${correct} = ${n / correct} exactly, so ${correct} is a factor.`,
    })
  }),
  G('f.fm.multiple', 'f.factors-multiples', [1, 3], (rng, d) => {
    const n = rng.int(3, d === 1 ? 6 : 9)
    const correct = n * rng.int(4, 12)
    const wrong = nearby(rng, correct, 6, 3).filter((w) => w % n !== 0)
    return choice({
      rng,
      prompt: `Which of these is a multiple of ${n}?`,
      correct: String(correct),
      wrong: wrong.slice(0, 3).map(String),
      hint: `Multiples of ${n} are in the ${n} times table.`,
      explanation: `${correct} = ${n} × ${correct / n}, so it is a multiple of ${n}.`,
    })
  }),
  G('f.fm.prime', 'f.factors-multiples', [2, 4], (rng, d) => {
    const primes = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97]
    const traps = d === 2 ? [15, 21, 25, 27, 33, 35, 39] : [51, 57, 87, 91, 77, 85, 93, 95]
    const p = rng.pick(primes)
    return choice({
      rng,
      prompt: 'Which of these is a prime number?',
      correct: String(p),
      wrong: rng.shuffle(traps).slice(0, 3).map(String),
      hint: 'A prime has exactly two factors: 1 and itself. Try dividing by 2, 3, 5, 7.',
      explanation: `${p} has no factors other than 1 and ${p}. The others each divide by something else (for example ${traps[0]} = ${(traps[0] as number) % 3 === 0 ? '3 × ' + (traps[0] as number) / 3 : '5 × ' + (traps[0] as number) / 5}).`,
    })
  }),
  G('f.fm.count', 'f.factors-multiples', [3, 4], (rng) => {
    const n = rng.pick([12, 16, 18, 20, 24, 28, 30, 36])
    const count = Array.from({ length: n }, (_, i) => i + 1).filter((i) => n % i === 0).length
    return num({
      prompt: `How many factors does ${n} have? (Include 1 and ${n}.)`,
      answer: count,
      hint: 'List them in pairs: 1 × ?, 2 × ?, ...',
      explanation: `Factors of ${n}: ${Array.from({ length: n }, (_, i) => i + 1).filter((i) => n % i === 0).join(', ')} - that is ${count}.`,
    })
  }),

  // ---------------------------------------------------------- fraction basics
  G('f.fr.equivalent', 'f.fractions', [1, 2], (rng, d) => {
    const den = rng.pick([2, 3, 4, 5])
    const num0 = rng.int(1, den - 1)
    const k = rng.int(2, d === 1 ? 4 : 6)
    return num({
      prompt: `${F(num0, den)} = ${F('?', den * k)}`,
      answer: num0 * k,
      hint: `What did the denominator ${den} get multiplied by to make ${den * k}? Do the same to the top.`,
      explanation: `${den} × ${k} = ${den * k}, so ${num0} × ${k} = ${num0 * k}.`,
    })
  }),
  G('f.fr.simplify', 'f.fractions', [2, 3], (rng, d) => {
    const den = rng.pick([3, 4, 5, 7])
    let n = rng.int(1, den - 1)
    while (gcd(n, den) !== 1) n = rng.int(1, den - 1)
    const k = rng.int(2, d === 2 ? 4 : 8)
    return num({
      prompt: `Write ${F(n * k, den * k)} in its simplest form.`,
      answer: n / den,
      lowest: true,
      hint: `Divide the top and bottom by the same number (their highest common factor is ${k}).`,
      explanation: `${n * k} ÷ ${k} = ${n} and ${den * k} ÷ ${k} = ${den}, so ${F(n * k, den * k)} = ${F(n, den)}.`,
    })
  }),
  G('f.fr.of-amount', 'f.fractions', [3, 5], (rng, d) => {
    const den = rng.pick(d === 3 ? [2, 3, 4, 5] : [6, 8, 9, 10, 12])
    const n = rng.int(1, den - 1)
    const unit = rng.int(2, d === 3 ? 12 : 15)
    const total = den * unit
    return num({
      prompt: `Find ${F(n, den)} of ${total}.`,
      answer: n * unit,
      hint: `Divide by the bottom (${den}) first, then multiply by the top (${n}).`,
      explanation: `${total} ÷ ${den} = ${unit}, then ${unit} × ${n} = ${n * unit}.`,
      errors: [{ values: [unit], tag: 'forgot-numerator', message: `That is ${F(1, den)} of ${total}. You need ${n} of those parts.` }],
    })
  }),

  // ---------------------------------------------------------- negative numbers
  G('f.neg.order', 'f.negatives', [3, 4], (rng, d) => {
    const pool = new Set<number>()
    while (pool.size < (d === 3 ? 4 : 5)) pool.add(rng.int(-9, 6))
    const sorted = [...pool].sort((a, b) => a - b)
    const items = sorted.map((v) => ({ id: `n${v}`, label: m(v) }))
    return {
      kind: 'order',
      prompt: 'Put these numbers in order, smallest first.',
      hint: 'On a number line, numbers further left are smaller. −9 is smaller than −2.',
      explanation: `In order: ${sorted.map(m).join(', ')}.`,
      items: shuffledNotSorted(rng, items),
      correctOrder: items.map((i) => i.id),
      directionLabel: ['smallest', 'largest'],
    }
  }),
  G('f.neg.temperature', 'f.negatives', [1, 3], (rng, d) => {
    if (d === 1) {
      const a = rng.int(-9, -2)
      const b = rng.int(-9, -2)
      const colder = Math.min(a, b)
      if (a === b) return num({ prompt: 'What is −4 + 6?', answer: 2, explanation: 'Start at −4 and go up 6: you reach 2.' })
      return choice({
        rng,
        prompt: `Which temperature is colder: ${m(a)}°C or ${m(b)}°C?`,
        correct: `${m(colder)}°C`,
        wrong: [`${m(Math.max(a, b))}°C`],
        hint: 'Picture a thermometer. Lower down means colder.',
        explanation: `${m(colder)} is further below zero, so it is colder.`,
      })
    }
    const start = rng.int(-8, -2)
    const rise = rng.int(3, 12)
    return num({
      prompt: d === 2 ? `The temperature is ${m(start)}°C and rises by ${rise}°C. What is the new temperature?` : `Overnight the temperature fell from ${rise}°C to ${m(start)}°C. By how many degrees did it fall?`,
      answer: d === 2 ? start + rise : rise - start,
      suffix: '°C',
      hint: 'Use a number line. Count up to zero first, then carry on.',
      explanation: d === 2 ? `${m(start)} + ${rise} = ${m(start + rise)}.` : `From ${rise} down to 0 is ${rise}, then down to ${m(start)} is ${-start} more: ${rise - start}.`,
    })
  }),

  // ------------------------------------------------------ missing numbers
  G('f.mn.missing', 'f.missing-numbers', [1, 3], (rng, d) => {
    if (d === 1) {
      const a = rng.int(5, 40)
      const t = a + rng.int(5, 40)
      return num({ prompt: `? + ${a} = ${t}`, answer: t - a, hint: 'Undo the addition with subtraction.', explanation: `${t} − ${a} = ${t - a}.` })
    }
    const a = rng.int(2, 9)
    const b = rng.int(2, 9)
    const x = rng.int(2, 12)
    const t = d === 2 ? a * x - b : a * x + b
    return num({
      prompt: `${a} × ? ${d === 2 ? '−' : '+'} ${b} = ${t}`,
      answer: x,
      hint: `First undo the ${d === 2 ? 'subtraction' : 'addition'}, then undo the multiplication.`,
      explanation: `${t} ${d === 2 ? '+' : '−'} ${b} = ${a * x}, then ${a * x} ÷ ${a} = ${x}.`,
    })
  }),
  G('f.mn.formula', 'f.missing-numbers', [3, 4], (rng, d) => {
    const per = rng.int(3, 9)
    const fee = rng.int(2, 8)
    const n = rng.int(3, 9)
    const total = per * n + fee
    return num({
      prompt:
        d === 3
          ? `Cost = £${per} for each ticket + £${fee} booking fee. What is the cost of ${n} tickets?`
          : `Cost = £${per} for each ticket + £${fee} booking fee. The total cost was £${total}. How many tickets were bought?`,
      answer: d === 3 ? total : n,
      prefix: d === 3 ? '£' : undefined,
      hint: d === 3 ? 'Multiply the tickets first, then add the fee.' : 'Take off the fee first, then divide by the ticket price.',
      explanation: d === 3 ? `${per} × ${n} = ${per * n}, plus ${fee} = ${total}.` : `${total} − ${fee} = ${per * n}, then ÷ ${per} = ${n}.`,
    })
  }),

  // ------------------------------------------------------------ simple ratio
  G('f.ratio.scale', 'f.ratio', [1, 3], (rng, d) => {
    const base = rng.int(2, 5)
    const k = rng.int(2, d === 1 ? 4 : 8)
    const per = rng.int(2, d === 3 ? 7 : 4)
    return num({
      prompt: `A recipe uses ${base} eggs to make ${base * per} pancakes. How many eggs are needed for ${base * per * k} pancakes?`,
      answer: base * k,
      hint: `The number of pancakes is ${k} times bigger, so the eggs are too.`,
      explanation: `${base * per * k} ÷ ${base * per} = ${k}, so eggs: ${base} × ${k} = ${base * k}.`,
    })
  }),
  G('f.ratio.everyone', 'f.ratio', [2, 3], (rng) => {
    const a = rng.int(1, 3)
    const b = rng.int(2, 5)
    const k = rng.int(3, 8)
    return num({
      prompt: `For every ${a} red ${a === 1 ? "bead" : "beads"} there are ${b} blue beads. There are ${a * k} red beads. How many blue beads are there?`,
      answer: b * k,
      hint: `${a * k} is ${k} lots of ${a}. So multiply the blue by ${k} too.`,
      explanation: `${a} × ${k} = ${a * k} red, so blue = ${b} × ${k} = ${b * k}.`,
    })
  }),

  // ------------------------------------------------------------------ angles
  G('f.ang.type', 'f.angles', [1, 2], (rng, d) => {
    const kinds: [string, () => number][] = [
      ['acute', () => rng.int(10, 85)],
      ['right', () => 90],
      ['obtuse', () => rng.int(95, 175)],
      ['reflex', () => rng.int(185, 350)],
    ]
    const pool = d === 1 ? kinds.slice(0, 3) : kinds
    const [name, make] = rng.pick(pool)
    const deg = make()
    return choice({
      rng,
      keepOrder: true,
      prompt: `What type of angle is ${deg}°?`,
      correct: name,
      wrong: ['acute', 'right', 'obtuse', 'reflex'].filter((k) => k !== name),
      hint: 'Acute < 90°, right = 90°, obtuse between 90° and 180°, reflex > 180°.',
      explanation: `${deg}° is ${name}.`,
    })
  }),
  G('f.ang.triangle', 'f.angles', [2, 3], (rng, d) => {
    const a = rng.int(30, 80)
    const b = rng.int(30, d === 2 ? 70 : 90)
    return num({
      prompt: `Two angles in a triangle are ${a}° and ${b}°. What is the third angle?`,
      answer: 180 - a - b,
      suffix: '°',
      hint: 'The angles in a triangle add up to 180°.',
      explanation: `180 − ${a} − ${b} = ${180 - a - b}.`,
    })
  }),

  // ------------------------------------------------------ rectangle area
  G('f.area.rect', 'f.area', [1, 4], (rng, d) => {
    const l = rng.int(3, d === 1 ? 9 : 15)
    const w = rng.int(2, d === 1 ? 7 : 11)
    const wantArea = rng.chance(0.5)
    if (d === 4) {
      return num({
        prompt: `A rectangle has area ${l * w} cm² and length ${l} cm. What is its perimeter?`,
        answer: 2 * (l + w),
        suffix: 'cm',
        hint: `Find the width first: area ÷ length.`,
        explanation: `Width = ${l * w} ÷ ${l} = ${w}. Perimeter = 2 × (${l} + ${w}) = ${2 * (l + w)}.`,
      })
    }
    return num({
      prompt: `Find the ${wantArea ? 'area' : 'perimeter'} of this rectangle.`,
      figure: { type: 'shape', shape: 'rectangle', labels: { w: `${l} cm`, h: `${w} cm` } },
      answer: wantArea ? l * w : 2 * (l + w),
      suffix: wantArea ? 'cm²' : 'cm',
      hint: wantArea ? 'Area = length × width.' : 'Perimeter = add up all four sides.',
      explanation: wantArea ? `${l} × ${w} = ${l * w} cm².` : `${l} + ${w} + ${l} + ${w} = ${2 * (l + w)} cm.`,
      errors: wantArea ? [{ values: [2 * (l + w)], tag: 'area-perimeter-mixup', message: 'That is the perimeter (distance around). Area is length × width.' }] : [{ values: [l * w], tag: 'area-perimeter-mixup', message: 'That is the area. Perimeter is the distance around the edge.' }],
    })
  }),

  // ------------------------------------------------------------ coordinates
  G('f.coord.read', 'f.coordinates', [1, 3], (rng, d) => {
    const x = rng.int(1, d === 1 ? 5 : 9)
    const y = rng.int(1, d === 1 ? 5 : 9)
    return multi({
      prompt: 'What are the coordinates of point A?',
      figure: { type: 'coord-grid', xRange: [0, d === 1 ? 6 : 10], yRange: [0, d === 1 ? 6 : 10], points: [{ x, y, label: 'A' }] },
      fields: [{ answer: x, label: 'x' }, { answer: y, label: 'y' }],
      template: '({0}, {1})',
      hint: 'Go along the x-axis first ("along the corridor") and then up the y-axis ("up the stairs").',
      explanation: `A is ${x} across and ${y} up: (${x}, ${y}).`,
      errors: [{ values: [y, x], tag: 'coordinates-swapped', message: 'The x-coordinate (across) comes first, then y (up).' }],
    })
  }),

  // ------------------------------------------------------------------ chance
  G('f.chance.words', 'f.chance', [1, 2], (rng, d) => {
    const cases: [string, string][] = [
      ['rolling a 7 on a normal 6-sided dice', 'impossible'],
      ['the sun rising tomorrow', 'certain'],
      ['flipping a coin and getting heads', 'even chance'],
      ['rolling a number less than 7 on a normal dice', 'certain'],
      ['picking a red ball from a bag with 1 red and 9 blue balls', 'unlikely'],
      ['picking a red ball from a bag with 9 red and 1 blue ball', 'likely'],
      ['a fair spinner with 2 equal halves landing on blue', 'even chance'],
    ]
    const easy = cases.filter((c) => ['impossible', 'certain', 'even chance'].includes(c[1]))
    const [ev, ans] = rng.pick(d === 1 ? easy : cases)
    return choice({
      rng,
      keepOrder: true,
      prompt: `How likely is this? "${ev}"`,
      correct: ans,
      wrong: ['impossible', 'unlikely', 'even chance', 'likely', 'certain'],
      hint: 'Think about how many outcomes are possible and how many count.',
      explanation: `${ev} is ${ans}.`,
    })
  }),

  G('f.chance.compare', 'f.chance', [3, 3], (rng) => {
    let a: [number, number] = [1, 1]
    let b: [number, number] = [1, 1]
    for (let g = 0; g < 100; g++) {
      a = [rng.int(1, 6), rng.int(1, 6)]
      b = [rng.int(1, 6), rng.int(1, 6)]
      if (a[0] * (b[0] + b[1]) !== b[0] * (a[0] + a[1]) || rng.chance(0.15)) break
    }
    const pa = a[0] * (b[0] + b[1])
    const pb = b[0] * (a[0] + a[1])
    const correct = pa > pb ? 'Bag A' : pb > pa ? 'Bag B' : 'Equally likely'
    return choice({
      rng,
      keepOrder: true,
      prompt: `Bag A has ${a[0]} red and ${a[1]} blue counters. Bag B has ${b[0]} red and ${b[1]} blue counters. You pick one counter without looking from one of the bags. Which bag gives you the better chance of picking red?`,
      correct,
      wrong: ['Bag A', 'Bag B', 'Equally likely'],
      hint: 'Compare the fraction of each bag that is red, not just the number of red counters.',
      explanation: `Bag A: ${F(a[0], a[0] + a[1])} are red. Bag B: ${F(b[0], b[0] + b[1])} are red. ${correct === 'Equally likely' ? 'These fractions are equal.' : `${correct} has the bigger fraction.`}`,
    })
  }),

  // ---------------------------------------------------------- charts and mean
  G('f.cm.bar', 'f.charts-mean', [1, 2], (rng, d) => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    const vals = labels.map(() => rng.int(2, 12))
    const i = rng.int(0, 4)
    const j = (i + rng.int(1, 4)) % 5
    return num({
      prompt: d === 1 ? `How many books were read on ${labels[i]}?` : `How many MORE books were read on ${labels[i]} than on ${labels[j]}? (Type a negative number if fewer.)`,
      figure: { type: 'bar-chart', bars: labels.map((label, k) => ({ label, value: vals[k] as number })), yLabel: 'Books read', showValues: false },
      answer: d === 1 ? (vals[i] as number) : (vals[i] as number) - (vals[j] as number),
      hint: 'Follow the top of the bar across to the scale on the left.',
      explanation: d === 1 ? `The ${labels[i]} bar reaches ${vals[i]}.` : `${vals[i]} − ${vals[j]} = ${(vals[i] as number) - (vals[j] as number)}.`,
    })
  }),
  G('f.cm.mean', 'f.charts-mean', [2, 4], (rng, d) => {
    const n = d === 2 ? 3 : 4
    const mean = rng.int(4, 15)
    const vals: number[] = []
    for (let k = 0; k < n - 1; k++) vals.push(rng.int(Math.max(1, mean - 4), mean + 4))
    const last = mean * n - sum(vals)
    if (last < 1) vals[0] = (vals[0] as number) + (1 - last)
    const all = [...vals, mean * n - sum(vals)]
    if (d < 4) return num({ prompt: `Find the mean of ${all.join(', ')}.`, answer: mean, hint: 'Add them up, then divide by how many numbers there are.', explanation: `${all.join(' + ')} = ${sum(all)}, ÷ ${n} = ${mean}.` })
    return num({
      prompt: `The mean of ${n} numbers is ${mean}. Three of them are ${all.slice(0, n - 1).join(', ')}. What is the fourth?`,
      answer: all[n - 1] as number,
      hint: `The total of all ${n} numbers is ${mean} × ${n}.`,
      explanation: `Total = ${mean} × ${n} = ${mean * n}. The three known add to ${sum(all.slice(0, n - 1))}, so the fourth is ${all[n - 1]}.`,
    })
  }),
]
