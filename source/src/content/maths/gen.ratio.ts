import type { ItemGenerator } from '@/engine/registry'
import type { CommonError, Figure } from '@/engine/types'
import { G, choice, gcd, multi, num, round } from './helpers'

const ex = (tag: string, message: string, ...values: number[]): CommonError => ({ tag, message, values })

const smallestPrimeFactor = (n: number) => {
  for (let i = 2; i <= n; i++) if (n % i === 0) return i
  return n
}
const coprime = (rng: { int(a: number, b: number): number }, lo: number, hi: number): [number, number] => {
  for (;;) {
    const p = rng.int(lo, hi)
    const q = rng.int(lo, hi)
    if (p !== q && gcd(p, q) === 1) return [p, q]
  }
}
const NAMES = [['Amy', 'Ben'], ['Zara', 'Leo'], ['Priya', 'Sam'], ['Mia', 'Jack'], ['Nina', 'Omar']]

export const ratioGenerators: ItemGenerator[] = [
  // ========================================================= INTRO (Y7)
  G('ri.simplify', 'ratio.intro', [1, 5], (rng, d) => {
    if (d === 4) {
      const [p, q] = coprime(rng, 1, 5)
      let r = rng.int(1, 6)
      while (gcd(gcd(p, q), r) !== 1 || r === p || r === q) r = rng.int(1, 6)
      const k = rng.int(2, 6)
      return multi({
        prompt: `Simplify the ratio  ${p * k} : ${q * k} : ${r * k}`,
        fields: [{ answer: p }, { answer: q }, { answer: r }],
        template: '{0} : {1} : {2}',
        hint: 'Find a number that divides into ALL the parts.',
        explanation: `Divide every part by ${k}: ${p} : ${q} : ${r}.`,
      })
    }
    if (d === 5) {
      const [p, q] = coprime(rng, 1, 6)
      const k = rng.pick([10, 20, 25, 30, 40, 50])
      const cm = p * k
      const m2 = (q * k) / 100
      const cm2 = q * k
      return multi({
        prompt: `Simplify the ratio  ${cm} cm : ${m2} m`,
        fields: [{ answer: p }, { answer: q }],
        template: '{0} : {1}',
        hint: 'Change both to the same unit first (1 m = 100 cm).',
        explanation: `${m2} m = ${cm2} cm. So ${cm} : ${cm2}, divide both by ${gcd(cm, cm2)}: ${p} : ${q}.`,
        errors: [{ tag: 'units-not-converted', message: 'The units are different - change them to match before simplifying.', values: [cm / (m2 * 10) / gcd(cm, m2 * 10) || 1, 1] }],
      })
    }
    const [p, q] = coprime(rng, 1, d === 1 ? 4 : 7)
    const k = rng.int(2, d === 1 ? 4 : 9)
    const f = smallestPrimeFactor(k)
    const errs: CommonError[] = k / f > 1 ? [ex('not-fully-simplified', 'Good start, but it can still be simplified further.', p * (k / f), q * (k / f))] : []
    const [ctx1, ctx2] = rng.pick([['red counters', 'blue counters'], ['girls', 'boys'], ['cats', 'dogs'], ['apples', 'pears']])
    const words = d === 3
    return multi({
      prompt: words ? `A box has ${p * k} ${ctx1} and ${q * k} ${ctx2}. Write the ratio of ${ctx1} to ${ctx2} in its simplest form.` : `Simplify the ratio  ${p * k} : ${q * k}`,
      fields: [{ answer: p }, { answer: q }],
      template: '{0} : {1}',
      hint: 'Divide both numbers by the highest common factor.',
      explanation: `Both numbers divide by ${k}: ${p * k} ÷ ${k} = ${p} and ${q * k} ÷ ${k} = ${q}. So ${p} : ${q}.`,
      errors: [...errs, ...(words && p !== q ? [ex('ratio-order-reversed', `Check the order: the ratio of ${ctx1} to ${ctx2} has ${ctx1} first.`, q, p)] : [])],
    })
  }),

  // ======================================================= SHARING (Y7)
  G('rs.share', 'ratio.sharing', [1, 4], (rng, d) => {
    const [n1, n2] = rng.pick(NAMES)
    if (d === 4) {
      const parts: [number, number, number] = rng.pick<[number, number, number]>([[2, 3, 5], [1, 2, 3], [3, 4, 5], [2, 2, 3], [1, 3, 4]])
      const sumP = parts[0] + parts[1] + parts[2]
      const unit = rng.int(4, 15)
      const T = unit * sumP
      return multi({
        prompt: `£${T} is shared between ${n1}, ${n2} and Chen in the ratio ${parts.join(' : ')}. How much does each person get?`,
        fields: [{ answer: parts[0] * unit }, { answer: parts[1] * unit }, { answer: parts[2] * unit }],
        template: `${n1} £{0}, ${n2} £{1}, Chen £{2}`,
        hint: `Add the parts (${sumP}), divide the total by that to find one part, then multiply.`,
        explanation: `${parts.join(' + ')} = ${sumP} parts. £${T} ÷ ${sumP} = £${unit} per part. So £${parts[0] * unit}, £${parts[1] * unit}, £${parts[2] * unit}.`,
      })
    }
    const [a, b] = d === 1 ? rng.pick<[number, number]>([[1, 2], [1, 3], [2, 3], [1, 4]]) : coprime(rng, 1, d === 2 ? 4 : 7)
    const unit = rng.int(d === 1 ? 2 : 4, d === 3 ? 20 : 12)
    const T = unit * (a + b)
    return multi({
      prompt: `£${T} is shared between ${n1} and ${n2} in the ratio ${a} : ${b}. How much does each person get?`,
      fields: [{ answer: a * unit }, { answer: b * unit }],
      template: `${n1} £{0}, ${n2} £{1}`,
      hint: `Add the parts (${a} + ${b} = ${a + b}), divide the total by ${a + b} to find one part, then multiply.`,
      explanation: `${a} + ${b} = ${a + b} parts. £${T} ÷ ${a + b} = £${unit} per part. ${n1}: ${a} × ${unit} = £${a * unit}. ${n2}: ${b} × ${unit} = £${b * unit}.`,
      errors: [
        ex('shared-equally', 'A ratio does not mean equal shares. Work out the value of ONE part first.', T / 2, T / 2),
        ...(a !== b ? [ex('shares-swapped', `Check who gets which share: ${n1} gets ${a} part${a > 1 ? 's' : ''}.`, b * unit, a * unit)] : []),
        ex('divided-by-part-not-total', `Divide by the TOTAL number of parts (${a + b}), not by a single part.`, T / a, T / b),
      ],
    })
  }),
  G('rs.difference', 'ratio.sharing', [5, 5], (rng) => {
    const [n1, n2] = rng.pick(NAMES)
    const [a, b] = rng.pick<[number, number]>([[2, 5], [3, 5], [3, 7], [4, 7], [2, 3], [3, 4], [1, 4]])
    const k = rng.int(3, 15)
    const diff = (b - a) * k
    return num({
      prompt: `${n1} and ${n2} share some money in the ratio ${a} : ${b}. ${n2} gets £${diff} more than ${n1}. How much money was shared altogether?`,
      answer: (a + b) * k,
      prefix: '£',
      hint: `The difference between the shares is ${b - a} part${b - a > 1 ? 's' : ''}. Use that to find the value of one part.`,
      explanation: `${b} − ${a} = ${b - a} parts = £${diff}, so 1 part = £${k}. Total ${a + b} parts = £${(a + b) * k}.`,
      errors: [ex('difference-not-total', 'That is the DIFFERENCE. The question asks for the total shared.', diff), ex('one-share-only', `That is ${n2}'s share. The total includes both.`, b * k)],
    })
  }),

  // ======================================================== UNITARY (Y7)
  G('ru.unit', 'ratio.unitary', [1, 4], (rng, d) => {
    if (d === 1) {
      const n = rng.int(3, 8)
      const p = rng.int(2, 6)
      const m2 = rng.int(n + 1, 12)
      return num({
        prompt: `${n} pens cost £${n * p}. How much do ${m2} pens cost?`,
        answer: m2 * p,
        prefix: '£',
        hint: 'Find the cost of ONE pen first.',
        explanation: `£${n * p} ÷ ${n} = £${p} for one pen. ${m2} pens: ${m2} × ${p} = £${m2 * p}.`,
        errors: [ex('multiplied-total', 'Do not multiply the total cost - find the price of one pen first.', n * p * m2)],
      })
    }
    if (d === 2) {
      const n = rng.int(3, 8)
      const unit = rng.int(45, 195) / 100
      const m2 = rng.int(n + 2, 15)
      return num({
        prompt: `${n} chocolate bars cost £${round(n * unit, 2).toFixed(2)}. How much do ${m2} chocolate bars cost?`,
        answer: round(m2 * unit, 2),
        prefix: '£',
        hint: 'Divide to find the price of one bar, then multiply.',
        explanation: `£${round(n * unit, 2).toFixed(2)} ÷ ${n} = £${unit.toFixed(2)} each. ${m2} × ${unit.toFixed(2)} = £${round(m2 * unit, 2).toFixed(2)}.`,
      })
    }
    if (d === 3) {
      const unit = rng.pick([0.2, 0.3, 0.25, 0.4, 0.5, 0.6])
      const n = rng.int(4, 10)
      const budget = round(unit * rng.int(12, 40), 2)
      return num({
        prompt: `${n} apples cost £${round(n * unit, 2).toFixed(2)}. How many apples can you buy for £${budget.toFixed(2)}?`,
        answer: round(budget / unit, 4),
        hint: 'Find the cost of one apple, then see how many of those fit into the money you have.',
        explanation: `£${round(n * unit, 2).toFixed(2)} ÷ ${n} = £${unit.toFixed(2)} each. £${budget.toFixed(2)} ÷ £${unit.toFixed(2)} = ${round(budget / unit, 4)}.`,
      })
    }
    const people = rng.pick([4, 6, 8])
    const flour = rng.pick([200, 240, 300, 320, 360])
    const per = flour / people
    const target = people + rng.pick([2, 4, 6, 10])
    return num({
      prompt: `A recipe for ${people} people uses ${flour} g of flour. How much flour is needed for ${target} people?`,
      answer: per * target,
      suffix: 'g',
      hint: `Work out the flour for ONE person, then multiply by ${target}.`,
      explanation: `${flour} ÷ ${people} = ${per} g each. ${per} × ${target} = ${per * target} g.`,
    })
  }),
  G('ru.better-value', 'ratio.unitary', [3, 4], (rng, d) => {
    const unitA = rng.int(20, 60) / 100
    const nA = rng.pick([4, 5, 6, 8])
    const nB = nA + rng.pick([2, 4, 5])
    let unitB = round(unitA + rng.pick([-0.04, -0.03, -0.02, 0.02, 0.03]), 2)
    if (unitB === unitA) unitB = round(unitA - 0.02, 2)
    const costA = round(nA * unitA, 2)
    const costB = round(nB * unitB, 2)
    const better = unitA < unitB ? `${nA} for £${costA.toFixed(2)}` : `${nB} for £${costB.toFixed(2)}`
    const other = unitA < unitB ? `${nB} for £${costB.toFixed(2)}` : `${nA} for £${costA.toFixed(2)}`
    void d
    return choice({
      rng,
      prompt: `Which is the better value?  A pack of ${nA} pencils for £${costA.toFixed(2)}, or a pack of ${nB} pencils for £${costB.toFixed(2)}?`,
      correct: better,
      wrong: [{ label: other, misconception: 'compared-total-cost', feedback: 'Compare the price of ONE pencil in each pack, not the total price.' }, 'They are the same value'],
      hint: 'Work out the cost of one pencil for each pack.',
      explanation: `A: £${costA.toFixed(2)} ÷ ${nA} = £${unitA.toFixed(3)} each. B: £${costB.toFixed(2)} ÷ ${nB} = £${unitB.toFixed(3)} each. The lower price per pencil is better value: ${better}.`,
    })
  }),

  // ================================================= PROPORTION (Y8)
  G('rp.direct', 'ratio.proportion', [1, 3], (rng, d) => {
    const x1 = rng.int(2, 8)
    const k = rng.int(2, 9)
    const x2 = rng.int(x1 + 1, 15)
    const unit = d === 3 ? rng.pick([1.5, 2.5, 3.5]) : k
    if (d === 1) {
      return num({
        prompt: `${x1} identical books cost £${x1 * k}. Cost is directly proportional to the number of books. How much do ${x2} books cost?`,
        answer: x2 * k,
        prefix: '£',
        hint: 'Direct proportion: double the books, double the cost. Find the cost of 1 book.',
        explanation: `£${x1 * k} ÷ ${x1} = £${k}. ${x2} × ${k} = £${x2 * k}.`,
      })
    }
    return num({
      prompt: `y is directly proportional to x. When x = ${x1}, y = ${round(x1 * unit, 2)}. Find y when x = ${x2}.`,
      answer: round(x2 * unit, 2),
      prefix: 'y =',
      hint: 'Find how much y is for each 1 of x (divide y by x), then multiply by the new x.',
      explanation: `y ÷ x = ${round(x1 * unit, 2)} ÷ ${x1} = ${unit}. So y = ${unit} × ${x2} = ${round(x2 * unit, 2)}.`,
    })
  }),
  G('rp.inverse', 'ratio.proportion', [3, 5], (rng, d) => {
    if (d === 5) {
      const x1 = rng.pick([2, 4, 5, 6])
      const y1 = rng.pick([12, 15, 20, 30])
      const c = x1 * y1
      const x2 = rng.pick([3, 6, 10, 12, 15].filter((v) => c % v === 0 && v !== x1))
      return num({
        prompt: `y is inversely proportional to x. When x = ${x1}, y = ${y1}. Find y when x = ${x2}.`,
        answer: c / x2,
        prefix: 'y =',
        hint: 'For inverse proportion, x × y stays the same. Find that number first.',
        explanation: `x × y = ${x1} × ${y1} = ${c}. So y = ${c} ÷ ${x2} = ${c / x2}.`,
        errors: [ex('direct-instead-of-inverse', 'This is INVERSE proportion: when x gets bigger, y gets smaller.', (y1 * x2) / x1)],
      })
    }
    const scenarios: { who: string; task: string; unit: string }[] = [
      { who: 'workers', task: 'to build a wall', unit: 'days' },
      { who: 'taps', task: 'to fill a tank', unit: 'minutes' },
      { who: 'painters', task: 'to paint a fence', unit: 'hours' },
    ]
    const s = rng.pick(scenarios)
    const n1 = rng.pick([2, 3, 4, 6])
    const t1 = rng.pick([6, 8, 10, 12, 15])
    const total = n1 * t1
    const n2 = rng.pick([n1 + 2, n1 * 2, n1 + 3, 12].filter((v) => total % v === 0 && v !== n1))
    return num({
      prompt: `${n1} ${s.who} take ${t1} ${s.unit} ${s.task}. How long would it take ${n2} ${s.who} working at the same rate?`,
      answer: total / n2,
      suffix: s.unit,
      hint: `More ${s.who} means LESS time. Find the total amount of work (${n1} × ${t1}) and share it out.`,
      explanation: `${n1} × ${t1} = ${total} ${s.who}-${s.unit}. ${total} ÷ ${n2} = ${total / n2} ${s.unit}.`,
      errors: [ex('direct-instead-of-inverse', `With more ${s.who} it takes LESS time, so the answer should be smaller than ${t1}.`, (t1 * n2) / n1)],
    })
  }),
  G('rp.identify', 'ratio.proportion', [2, 4], (rng, d) => {
    const inverse = [
      'The number of workers on a job and the time taken to finish it',
      'The speed of a car and the time to travel a fixed distance',
      'The number of people sharing a prize and the amount each gets',
    ]
    const direct = [
      'The number of items bought and the total cost (same price each)',
      'The distance a car travels at steady speed and the time it takes',
      'The amount of flour and the number of cakes made',
    ]
    const neither = ['A child\'s age and their height', 'The temperature outside and the number of ice creams sold', 'The number of pages in a book and the number of words on page 1']
    const askInverse = rng.chance(0.5)
    const correct = rng.pick(askInverse ? inverse : direct)
    const wrong = [...rng.shuffle(askInverse ? direct : inverse).slice(0, 1), ...rng.shuffle(neither).slice(0, d >= 3 ? 2 : 1)]
    return choice({
      rng,
      prompt: `Which of these is an example of ${askInverse ? 'INVERSE' : 'DIRECT'} proportion?`,
      correct,
      wrong,
      hint: askInverse ? 'Inverse: as one goes UP, the other goes DOWN (and their product is constant).' : 'Direct: as one doubles, the other doubles too.',
      explanation: `${correct} is ${askInverse ? 'inverse' : 'direct'} proportion.`,
    })
  }),

  // ==================================================== COMPOUND UNITS (Y8)
  G('cu.speed', 'ratio.compound-units', [1, 3], (rng, d) => {
    if (d === 1) {
      const t = rng.int(2, 5)
      const s = rng.pick([30, 40, 45, 50, 60, 80])
      return num({
        prompt: `A car travels ${s * t} km in ${t} hours. What is its average speed?`,
        answer: s,
        suffix: 'km/h',
        hint: 'Speed = distance ÷ time.',
        explanation: `${s * t} ÷ ${t} = ${s} km/h.`,
        errors: [ex('multiplied-not-divided', 'Speed is distance DIVIDED by time.', s * t * t)],
      })
    }
    if (d === 2) {
      const t = rng.int(2, 5)
      const s = rng.pick([25, 30, 45, 50, 60])
      return num({ prompt: `A train travels at ${s} km/h for ${t} hours. How far does it go?`, answer: s * t, suffix: 'km', hint: 'Distance = speed × time.', explanation: `${s} × ${t} = ${s * t} km.`, errors: [ex('divided-not-multiplied', 'Distance is speed MULTIPLIED by time.', s / t)] })
    }
    const s = rng.pick([40, 60, 80])
    const t = rng.pick([1.5, 2.5, 0.5, 3.5])
    const dist = s * t
    return num({
      prompt: `A bus travels ${dist} km at an average speed of ${s} km/h. How many minutes does the journey take?`,
      answer: t * 60,
      suffix: 'minutes',
      hint: 'Time = distance ÷ speed gives hours. Then convert to minutes (× 60).',
      explanation: `${dist} ÷ ${s} = ${t} hours = ${t} × 60 = ${t * 60} minutes.`,
      errors: [ex('hours-not-minutes', 'That is the time in HOURS. The question wants minutes: multiply by 60.', t)],
    })
  }),
  G('cu.time-hm', 'ratio.compound-units', [4, 5], (rng) => {
    let s = 60
    let t = 1.5
    for (let i = 0; i < 30; i++) {
      s = rng.pick([40, 48, 60, 72, 80, 96, 100])
      t = rng.pick([1.25, 1.5, 1.75, 2.25, 2.5, 2.75, 3.25])
      if (Number.isInteger(s * t)) break
    }
    if (!Number.isInteger(s * t)) {
      s = 60
      t = 2.5
    }
    const dist = s * t
    const h = Math.floor(t)
    const min = Math.round((t - h) * 60)
    return multi({
      prompt: `A car travels ${dist} km at an average speed of ${s} km/h. How long does the journey take?`,
      fields: [{ answer: h }, { answer: min }],
      template: '{0} hours {1} minutes',
      hint: 'Time = distance ÷ speed. The decimal part of the hours needs converting to minutes.',
      explanation: `${dist} ÷ ${s} = ${t} hours = ${h} hours and ${t - h} × 60 = ${min} minutes.`,
      errors: [ex('decimal-time-as-minutes', `${t - h} of an hour is not ${round((t - h) * 100, 0)} minutes. There are 60 minutes in an hour.`, h, round((t - h) * 100, 0))],
    })
  }),
  G('cu.density-pressure', 'ratio.compound-units', [4, 5], (rng, d) => {
    const kind = d === 5 ? rng.int(1, 2) : rng.int(0, 2)
    if (kind === 0) {
      const dens = rng.pick([2, 2.5, 4, 5, 7.5, 8, 10.5])
      const vol = rng.pick([20, 30, 40, 50, 60])
      return num({
        prompt: `A metal block has mass ${round(dens * vol, 1)} g and volume ${vol} cm³. What is its density?`,
        answer: dens,
        suffix: 'g/cm³',
        hint: 'Density = mass ÷ volume.',
        explanation: `${round(dens * vol, 1)} ÷ ${vol} = ${dens} g/cm³.`,
        errors: [ex('inverted', 'You divided the wrong way round: density = mass ÷ volume.', round(vol / (dens * vol), 6))],
      })
    }
    if (kind === 1) {
      const area = rng.pick([2, 4, 5, 0.5, 0.25])
      const p = rng.pick([50, 100, 120, 200, 300])
      return num({
        prompt: `A force of ${round(p * area, 2)} N acts on an area of ${area} m². What is the pressure?`,
        answer: p,
        suffix: 'N/m²',
        hint: 'Pressure = force ÷ area.',
        explanation: `${round(p * area, 2)} ÷ ${area} = ${p} N/m².`,
        errors: [ex('multiplied-not-divided', 'Pressure is force DIVIDED by area.', round(p * area * area, 4))],
      })
    }
    const dens = rng.pick([2.5, 4, 7.5, 8])
    const vol = rng.pick([12, 20, 30])
    return num({
      prompt: `A metal has density ${dens} g/cm³. What is the mass of ${vol} cm³ of it?`,
      answer: dens * vol,
      suffix: 'g',
      hint: 'Rearrange density = mass ÷ volume: mass = density × volume.',
      explanation: `${dens} × ${vol} = ${dens * vol} g.`,
      errors: [ex('divided-not-multiplied', 'To find the mass you MULTIPLY density by volume.', round(dens / vol, 6))],
    })
  }),

  // ==================================================== SCALE FACTORS (Y8)
  G('sc.enlarge', 'ratio.scale-factors', [1, 4], (rng, d) => {
    const w = rng.int(2, 8)
    const h = rng.int(w + 1, 12)
    const k = rng.int(2, 5)
    const fig: Figure = { type: 'shape', shape: 'rectangle', labels: { w: `${h} cm`, h: `${w} cm` } }
    if (d === 1) return num({ prompt: `This rectangle is enlarged by scale factor ${k}. What is the length of the new long side?`, figure: fig, answer: h * k, suffix: 'cm', hint: 'Multiply every length by the scale factor.', explanation: `${h} × ${k} = ${h * k} cm.` })
    if (d === 2) return num({ prompt: `A rectangle ${w} cm by ${h} cm is enlarged. The short side becomes ${w * k} cm. What is the new length of the long side?`, answer: h * k, suffix: 'cm', hint: `First find the scale factor: ${w * k} ÷ ${w}.`, explanation: `Scale factor = ${w * k} ÷ ${w} = ${k}. ${h} × ${k} = ${h * k} cm.` })
    if (d === 3) {
      const kk = rng.int(2, 5)
      return num({ prompt: `A shape is enlarged by scale factor ${kk}. How many times bigger is its AREA?`, answer: kk * kk, hint: 'Area involves two lengths (length × width), and BOTH get multiplied by the scale factor.', explanation: `Area scale factor = ${kk}² = ${kk * kk}.`, errors: [ex('area-scaled-by-k', 'Lengths multiply by the scale factor, but AREAS multiply by the scale factor squared.', kk)] })
    }
    return num({
      prompt: `A rectangle has area ${w * h} cm². It is enlarged by scale factor ${k}. What is the area of the enlarged rectangle?`,
      figure: fig,
      answer: w * h * k * k,
      suffix: 'cm²',
      hint: 'Area scales by the scale factor SQUARED.',
      explanation: `${w * h} × ${k}² = ${w * h} × ${k * k} = ${w * h * k * k} cm².`,
      errors: [ex('area-scaled-by-k', `You multiplied by ${k}. The area scale factor is ${k}² = ${k * k}.`, w * h * k)],
    })
  }),
  G('sc.map', 'ratio.scale-factors', [2, 4], (rng, d) => {
    if (d === 2) {
      const sc = rng.pick([100, 200, 500])
      const cm = rng.int(2, 9)
      return num({ prompt: `A map has scale 1 : ${sc}. A wall measures ${cm} cm on the map. How long is the real wall in metres?`, answer: (cm * sc) / 100, suffix: 'm', hint: `1 cm on the map is ${sc} cm in real life. Then change cm to m (÷ 100).`, explanation: `${cm} × ${sc} = ${cm * sc} cm = ${(cm * sc) / 100} m.` })
    }
    if (d === 3) {
      const sc = rng.pick([25000, 50000, 20000, 10000])
      const cm = rng.int(2, 9)
      return num({ prompt: `A map has scale 1 : ${sc}. Two villages are ${cm} cm apart on the map. How far apart are they in real life, in km?`, answer: (cm * sc) / 100000, suffix: 'km', hint: `1 cm : ${sc} cm. Then convert cm → m (÷ 100) → km (÷ 1000), that is ÷ 100 000.`, explanation: `${cm} × ${sc} = ${cm * sc} cm = ${(cm * sc) / 100000} km.` })
    }
    const sc = rng.pick([20000, 25000, 50000])
    const km = rng.pick([1, 2, 3, 4, 5])
    return num({ prompt: `A map has scale 1 : ${sc}. A path is ${km} km long in real life. How long is it on the map, in cm?`, answer: (km * 100000) / sc, suffix: 'cm', hint: `${km} km = ${km * 100000} cm. Then divide by ${sc}.`, explanation: `${km} km = ${km * 100000} cm. ${km * 100000} ÷ ${sc} = ${(km * 100000) / sc} cm.`, errors: [ex('multiplied-not-divided', 'Going from real life TO the map makes the length smaller: divide.', km * 100000 * sc)] })
  }),
]
