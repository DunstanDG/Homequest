import type { ItemGenerator } from '@/engine/registry'
import type { CommonError, Figure, ItemBody } from '@/engine/types'
import { F, G, choice, composition, gcd, multi, num, reduce, round, shuffledNotSorted } from './helpers'

const ex = (tag: string, message: string, ...values: number[]): CommonError => ({ tag, message, values })

/** A probability answer n/d that must be given in lowest terms (decimals are also accepted). */
function prob(a: { prompt: string; n: number; d: number; hint: string; explanation: string; figure?: Figure; errors?: CommonError[] }): ItemBody {
  const r = reduce(a.n, a.d)
  return num({ prompt: a.prompt, figure: a.figure, answer: r.answer, display: r.display, lowest: true, hint: a.hint, explanation: a.explanation, errors: a.errors })
}
const frac = (n: number, d: number) => {
  const r = reduce(n, d)
  return r.d === 1 ? String(r.n) : F(r.n, r.d)
}
const plural = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many)

// ------------------------------------------------------------ scenario data
interface Scenario {
  intro: string
  outcomes: (number | string)[]
  events: [string, (o: number | string) => boolean][]
}
const isPrimeNum = (n: number) => n > 1 && Array.from({ length: n - 1 }, (_v, i) => i + 2).every((k) => k === n || n % k !== 0)
const num1 = (o: number | string) => o as number
const diceEvents: [string, (o: number | string) => boolean][] = [
  ['a 6', (o) => num1(o) === 6],
  ['an even number', (o) => num1(o) % 2 === 0],
  ['a number greater than 4', (o) => num1(o) > 4],
  ['a prime number', (o) => isPrimeNum(num1(o))],
  ['a multiple of 3', (o) => num1(o) % 3 === 0],
  ['a number less than 3', (o) => num1(o) < 3],
  ['a square number', (o) => [1, 4].includes(num1(o))],
  ['a number that is not a 6', (o) => num1(o) !== 6],
]
const spinnerEvents: [string, (o: number | string) => boolean][] = [
  ['a multiple of 4', (o) => num1(o) % 4 === 0],
  ['an odd number', (o) => num1(o) % 2 === 1],
  ['a prime number', (o) => isPrimeNum(num1(o))],
  ['a number less than 4', (o) => num1(o) < 4],
  ['a factor of 8', (o) => 8 % num1(o) === 0],
]
const cardEvents: [string, (o: number | string) => boolean][] = [
  ['a multiple of 5', (o) => num1(o) % 5 === 0],
  ['a square number', (o) => [1, 4, 9, 16].includes(num1(o))],
  ['a prime number', (o) => isPrimeNum(num1(o))],
  ['a number greater than 12', (o) => num1(o) > 12],
  ['an even number', (o) => num1(o) % 2 === 0],
  ['a factor of 12', (o) => 12 % num1(o) === 0],
]
const rangeTo = (n: number) => Array.from({ length: n }, (_v, i) => i + 1)
const SCENARIOS: Record<string, Scenario> = {
  dice: { intro: 'A fair six-sided dice is rolled.', outcomes: rangeTo(6), events: diceEvents },
  spinner: { intro: 'A fair spinner has 8 equal sections numbered 1 to 8.', outcomes: rangeTo(8), events: spinnerEvents },
  cards: { intro: 'Twenty cards are numbered 1 to 20. One card is picked at random.', outcomes: rangeTo(20), events: cardEvents },
}
const WORDS = ['PROBABILITY', 'MATHEMATICS', 'STATISTICS', 'BANANA', 'MISSISSIPPI', 'CALCULATOR']
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U'])

export const probabilityGenerators: ItemGenerator[] = [
  // ======================================================== SCALE (Y7)
  G('ps.words', 'probability.scale', [1, 2], (rng, d) => {
    const bank: [string, string][] = [
      ['0', 'impossible'],
      ['1', 'certain'],
      [rng.pick(['1/2', '0.5', '50%']), 'even chance'],
      [rng.pick(['0.1', '1/10', '10%', '0.2', '1/5']), 'unlikely'],
      [rng.pick(['0.8', '0.9', '90%', '4/5']), 'likely'],
    ]
    const pool = d === 1 ? bank.slice(0, 3) : bank
    const [value, word] = rng.pick(pool)
    const all = ['impossible', 'unlikely', 'even chance', 'likely', 'certain']
    return choice({
      rng,
      prompt: `An event has a probability of ${value}. Which word best describes it?`,
      correct: word,
      wrong: (d === 1 ? ['impossible', 'even chance', 'certain'] : all).filter((w) => w !== word),
      keepOrder: true,
      hint: 'Probabilities go from 0 (impossible) to 1 (certain). 0.5 is halfway.',
      explanation: `${value} is ${word === 'impossible' ? 'zero: it can never happen' : word === 'certain' ? 'one: it always happens' : word === 'even chance' ? 'halfway between 0 and 1' : word === 'unlikely' ? 'close to 0' : 'close to 1'}, so the event is ${word}.`,
    })
  }),

  G('ps.valid', 'probability.scale', [2, 3], (rng) => {
    const valid = ['0.3', '3/4', '1/2', '3/5', '45%', '0', '1', '0.05', '7/10', '0.99']
    const invalid: [string, string][] = [
      ['1.2', 'It is bigger than 1'],
      ['1.5', 'It is bigger than 1'],
      ['−0.2', 'It is below 0'],
      ['5/4', 'It is bigger than 1'],
      ['110%', 'It is bigger than 100%'],
      ['−1/2', 'It is below 0'],
    ]
    const [bad, why] = rng.pick(invalid)
    return choice({
      rng,
      prompt: 'Which of these can NOT be a probability?',
      correct: bad,
      wrong: rng.shuffle(valid).slice(0, 3),
      hint: 'Every probability is between 0 and 1 (inclusive).',
      explanation: `${why}. Probabilities must be between 0 and 1.`,
    })
  }),

  G('ps.mark', 'probability.scale', [2, 3], (rng, d) => {
    const p = d === 2 ? rng.int(1, 9) / 10 : rng.pick([0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95])
    return num({
      prompt: 'The arrow A marks the probability of an event on this scale. What probability does A show? (Decimal or fraction.)',
      figure: { type: 'number-line', min: 0, max: 1, marks: [{ at: 0, label: '0' }, { at: 0.5, label: '½' }, { at: 1, label: '1' }, { at: p, label: 'A' }] },
      answer: p,
      hint: 'The scale runs from 0 to 1. Halfway is 0.5.',
      explanation: `A is at ${p}.`,
    })
  }),

  G('ps.order', 'probability.scale', [3, 4], (rng, d) => {
    const pool: [string, number, string][] = [
      ['Rolling a 7 on a normal dice', 0, '0'],
      ['Picking a king from a normal pack of 52 cards', 1 / 13, '1/13'],
      ['Rolling a 6 on a normal dice', 1 / 6, '1/6'],
      ['Picking a heart from a normal pack of cards', 1 / 4, '1/4'],
      ['Rolling an even number on a normal dice', 1 / 2, '1/2'],
      ['Rolling a number less than 5 on a normal dice', 2 / 3, '2/3'],
      ['Picking a card that is NOT a spade from a normal pack', 3 / 4, '3/4'],
      ['Rolling a number bigger than 1 on a normal dice', 5 / 6, '5/6'],
      ['Rolling a number less than 7 on a normal dice', 1, '1'],
    ]
    const count = d === 3 ? 3 : 5
    const chosen = rng.shuffle(pool).slice(0, count).sort((a, b) => a[1] - b[1])
    const items = chosen.map((c, i) => ({ id: `e${i}`, label: c[0] }))
    return {
      kind: 'order',
      prompt: 'Put these events in order from LEAST likely to MOST likely.',
      hint: 'Work out the probability of each event, then compare them.',
      explanation: chosen.map((c) => `${c[0]}: ${c[2]}`).join('; ') + '.',
      items: shuffledNotSorted(rng, items),
      correctOrder: items.map((i) => i.id),
      directionLabel: ['least likely', 'most likely'],
    }
  }),

  // ========================================== CALCULATING PROBABILITY (Y7)
  G('pc.simple', 'probability.calculating', [1, 3], (rng, d) => {
    const colours = ['red', 'blue', 'green', 'yellow']
    const k = d === 1 ? 2 : 3
    let counts: number[] = []
    for (let g = 0; g < 200; g++) {
      counts = colours.slice(0, k).map(() => rng.int(1, d === 3 ? 9 : 5))
      const total = counts.reduce((a, b) => a + b, 0)
      if (d === 3 && gcd(counts[0] as number, total) === 1) continue
      if (d < 3 && total > 12) continue
      break
    }
    const total = counts.reduce((a, b) => a + b, 0)
    const which = rng.int(0, k - 1)
    const n = counts[which] as number
    const bag = counts.map((c, i) => `${c} ${colours[i]}`).join(', ').replace(/, ([^,]*)$/, ' and $1')
    return prob({
      prompt: `A bag contains ${bag} counters. One counter is taken without looking. What is the probability that it is ${colours[which]}? (Fraction in its simplest form.)`,
      n,
      d: total,
      hint: 'Probability = number of ways it can happen ÷ total number of possible outcomes.',
      explanation: `${n} of the ${total} counters are ${colours[which]}, so P = ${F(n, total)}${gcd(n, total) > 1 ? ` = ${frac(n, total)}` : ''}.`,
      errors: [ex('part-to-part', `You compared ${colours[which]} with the OTHER counters. The bottom of the fraction is the TOTAL number of counters (${total}).`, n / (total - n)), ex('equally-likely', 'The colours are not equally likely: there are different numbers of each.', 1 / k)],
    })
  }),

  G('pc.dice-cards', 'probability.calculating', [2, 4], (rng, d) => {
    if (d === 4 && rng.chance(0.5)) {
      const w = rng.pick(WORDS)
      const asVowel = rng.chance(0.4)
      const letters = w.split('')
      const target = rng.pick(letters.filter((l) => !VOWELS.has(l)))
      const count = asVowel ? letters.filter((l) => VOWELS.has(l)).length : letters.filter((l) => l === target).length
      return prob({
        prompt: `A letter is chosen at random from the word ${w}. What is the probability that it is ${asVowel ? 'a vowel' : `the letter ${target}`}? (Fraction in its simplest form.)`,
        n: count,
        d: letters.length,
        hint: `Count the letters in the word first (${letters.length}), then how many of them are a match.`,
        explanation: `${w} has ${letters.length} letters. ${count} ${plural(count, 'is', 'are')} ${asVowel ? 'vowels' : target}. P = ${F(count, letters.length)}${gcd(count, letters.length) > 1 ? ` = ${frac(count, letters.length)}` : ''}.`,
        errors: [ex('distinct-letters', 'Count EVERY letter in the word, including repeats.', 1 / new Set(letters).size)],
      })
    }
    const key = d === 2 ? 'dice' : rng.pick(['dice', 'spinner', 'cards'])
    const sc = SCENARIOS[key] as Scenario
    let ev = rng.pick(sc.events)
    // Avoid trivially-equal-to-0 or 1 events at this level.
    for (let g = 0; g < 20; g++) {
      const c = sc.outcomes.filter(ev[1]).length
      if (c > 0 && c < sc.outcomes.length) break
      ev = rng.pick(sc.events)
    }
    const count = sc.outcomes.filter(ev[1]).length
    const total = sc.outcomes.length
    return prob({
      prompt: `${sc.intro} What is the probability of getting ${ev[0]}? (Fraction in its simplest form.)`,
      n: count,
      d: total,
      hint: 'List the outcomes that count, then divide by the total number of outcomes.',
      explanation: `${count} of the ${total} outcomes are ${ev[0]}: ${sc.outcomes.filter(ev[1]).join(', ')}. P = ${F(count, total)}${gcd(count, total) > 1 ? ` = ${frac(count, total)}` : ''}.`,
      errors: [ex('part-to-part', 'The bottom of the fraction is ALL the outcomes, not just the ones that do not count.', count / (total - count))],
    })
  }),

  G('pc.not', 'probability.calculating', [3, 4], (rng, d) => {
    if (d === 3) {
      const p = rng.pick([0.1, 0.2, 0.25, 0.35, 0.4, 0.65, 0.7, 0.85])
      const thing = rng.pick(['it rains tomorrow', 'a bus is late', 'Sam wins the game', 'a seed grows'])
      return num({
        prompt: `The probability that ${thing} is ${p}. What is the probability that it does NOT happen?`,
        answer: round(1 - p, 3),
        hint: 'Probabilities of an event happening and NOT happening add up to 1.',
        explanation: `1 − ${p} = ${round(1 - p, 3)}.`,
        errors: [ex('gave-same', 'That is the probability that it DOES happen. Take it away from 1.', p)],
      })
    }
    const den = rng.pick([5, 7, 8, 9, 10, 12])
    const a = rng.int(1, Math.floor(den / 3))
    const b = rng.int(1, Math.floor(den / 3))
    const c = den - a - b
    return prob({
      prompt: `A bag has red, blue and green counters. P(red) = ${F(a, den)} and P(blue) = ${F(b, den)}. What is P(green)? (Fraction in its simplest form.)`,
      n: c,
      d: den,
      hint: 'All the probabilities add up to 1, so P(green) = 1 − P(red) − P(blue).',
      explanation: `${F(a, den)} + ${F(b, den)} = ${F(a + b, den)}. 1 − ${F(a + b, den)} = ${F(c, den)}${gcd(c, den) > 1 ? ` = ${frac(c, den)}` : ''}.`,
      errors: [ex('added', 'You added the probabilities. The three must add to 1, so subtract from 1.', (a + b) / den)],
    })
  }),

  G('pc.or', 'probability.calculating', [4, 4], (rng) => {
    const a = rng.pick([0.1, 0.15, 0.2, 0.25, 0.3])
    const b = rng.pick([0.2, 0.3, 0.35, 0.4, 0.45])
    const askNeither = rng.chance(0.5)
    return num({
      prompt: `A spinner can land on red, blue or green. P(red) = ${a} and P(blue) = ${b}. What is the probability of ${askNeither ? 'NOT landing on red or blue' : 'landing on red or blue'}?`,
      answer: round(askNeither ? 1 - a - b : a + b, 3),
      hint: askNeither ? 'First add P(red) and P(blue), then take the total from 1.' : 'The spinner cannot land on both at once, so you can add the probabilities.',
      explanation: askNeither ? `${a} + ${b} = ${round(a + b, 3)}. 1 − ${round(a + b, 3)} = ${round(1 - a - b, 3)}.` : `${a} + ${b} = ${round(a + b, 3)}.`,
      errors: [ex('gave-other', askNeither ? 'That is the probability of red or blue. "Not" means take it from 1.' : 'You found the probability of NOT red or blue. Add P(red) and P(blue).', round(askNeither ? a + b : 1 - a - b, 3)), ex('multiplied', 'For "or" with events that cannot happen together, ADD the probabilities.', round(a * b, 4))],
    })
  }),

  G('pc.expected', 'probability.calculating', [4, 5], (rng, d) => {
    if (d === 4) {
      const trials = rng.pick([60, 120, 180, 300, 600])
      const [name, p] = rng.pick<[string, number]>([['a 6', 1 / 6], ['an even number', 1 / 2], ['a number greater than 4', 1 / 3]])
      return num({
        prompt: `A fair dice is rolled ${trials} times. How many times would you expect to get ${name}?`,
        answer: trials * p,
        hint: 'Expected number = probability × number of trials.',
        explanation: `P = ${frac(1, Math.round(1 / p))}. ${trials} × ${frac(1, Math.round(1 / p))} = ${trials * p}.`,
        errors: [ex('gave-probability', 'That is the probability. Multiply it by the number of rolls.', round(p, 4)), ex('used-complement', 'You found how many times it would NOT happen.', trials * (1 - p))],
      })
    }
    const p = rng.pick([0.05, 0.15, 0.35, 0.45, 0.6])
    const trials = rng.pick([200, 400, 500, 1000])
    return num({
      prompt: `The probability that a light bulb is faulty is ${p}. A factory makes ${trials} bulbs. How many would you expect to be faulty?`,
      answer: round(trials * p, 2),
      hint: 'Expected number = probability × number of items.',
      explanation: `${trials} × ${p} = ${round(trials * p, 2)}.`,
      errors: [ex('used-complement', 'You found the number that are NOT faulty.', round(trials * (1 - p), 2)), ex('gave-probability', 'Multiply the probability by the number of bulbs.', p)],
    })
  }),

  G('pc.reverse', 'probability.calculating', [5, 5], (rng) => {
    const den = rng.pick([5, 7, 8, 9])
    const num_ = rng.int(1, den - 2)
    const k = rng.int(2, 5)
    const colour = rng.pick(['red', 'blue', 'green'])
    const total = den * k
    const wantTotal = rng.chance(0.5)
    return num({
      prompt: `The probability of picking a ${colour} counter from a bag is ${F(num_, den)}. There are ${num_ * k} ${colour} counters in the bag. ${wantTotal ? 'How many counters are in the bag altogether?' : 'How many counters are NOT ' + colour + '?'}`,
      answer: wantTotal ? total : total - num_ * k,
      hint: `${num_} out of every ${den} counters are ${colour}. How many groups of ${num_} are in ${num_ * k}?`,
      explanation: `${num_ * k} ÷ ${num_} = ${k} groups. Total = ${k} × ${den} = ${total}.${wantTotal ? '' : ` Not ${colour}: ${total} − ${num_ * k} = ${total - num_ * k}.`}`,
      errors: wantTotal ? [ex('gave-denominator', `${den} is the bottom of the fraction, not the total number of counters.`, den)] : [ex('gave-total', 'That is the total. Take away the counters that ARE that colour.', total)],
    })
  }),

  // ============================================== RELATIVE FREQUENCY (Y7)
  G('rf.calc', 'probability.relative-frequency', [2, 3], (rng, d) => {
    const trials = rng.pick(d === 2 ? [20, 50, 100] : [40, 200, 250, 500])
    const thing = rng.pick([
      ['A coin is flipped', 'heads'],
      ['A drawing pin is dropped', 'point up'],
      ['A spinner is spun', 'red'],
    ] as [string, string][])
    const hits = rng.int(Math.round(trials * 0.2), Math.round(trials * 0.7))
    return num({
      prompt: `${thing[0]} ${trials} times. It lands ${thing[1]} ${hits} times. What is the relative frequency of ${thing[1]}? (Decimal or fraction.)`,
      answer: hits / trials,
      hint: 'Relative frequency = number of times it happened ÷ total number of trials.',
      explanation: `${hits} ÷ ${trials} = ${round(hits / trials, 4)}.`,
      errors: [ex('part-to-part', 'Divide by the TOTAL number of trials, not by the number of times it did not happen.', hits / (trials - hits))],
    })
  }),

  G('rf.table', 'probability.relative-frequency', [3, 4], (rng, d) => {
    const total = rng.pick([20, 25, 40, 50, 100])
    const faces = d === 3 ? 4 : 6
    const counts = composition(rng, total, faces)
    const face = rng.int(1, faces)
    const hit = counts[face - 1] as number
    return num({
      prompt: `A ${faces}-sided spinner was spun and the results were recorded. What is the relative frequency of a ${face}? (Decimal or fraction.)`,
      figure: { type: 'table', head: ['Score', 'Frequency'], rows: counts.map((c, i) => [String(i + 1), String(c)]) },
      answer: hit / total,
      hint: 'First add up the frequencies to find the total number of spins.',
      explanation: `Total spins = ${counts.join(' + ')} = ${total}. Relative frequency of ${face} = ${hit} ÷ ${total} = ${round(hit / total, 4)}.`,
      errors: [ex('gave-frequency', 'That is the frequency. Divide by the total number of spins.', hit), ex('used-faces', `Do not divide by the number of sections (${faces}). Divide by the total number of spins.`, hit / faces)],
    })
  }),

  G('rf.reliable', 'probability.relative-frequency', [3, 4], (rng, d) => {
    const small = rng.pick([10, 20])
    const big = rng.pick([200, 500, 1000])
    const sh = Math.round(small * (0.3 + rng.next() * 0.4))
    const bh = Math.round(big * (0.45 + rng.next() * 0.1))
    if (d === 3) {
      return choice({
        rng,
        prompt: `Amy flips a coin ${small} times and gets ${sh} heads. Ben flips the same coin ${big} times and gets ${bh} heads. Whose results give the better estimate of the probability of heads?`,
        correct: `Ben’s – more trials give a more reliable estimate`,
        wrong: [`Amy’s – it is easier to count`, 'They are equally reliable', 'Neither – you cannot estimate probabilities from an experiment'],
        hint: 'What happens to relative frequency as you do more and more trials?',
        explanation: 'The more times you repeat an experiment, the closer the relative frequency gets to the true probability.',
      })
    }
    const p = rng.pick([0.2, 0.25, 0.4, 0.5])
    const spins = rng.pick([100, 200, 400])
    const larger = rng.pick([1000, 2000, 5000])
    return num({
      prompt: `A biased spinner landed on blue ${Math.round(p * spins)} times in ${spins} spins. Use this to estimate how many times it will land on blue in ${larger} spins.`,
      answer: p * larger,
      hint: 'Use the relative frequency as the estimated probability, then multiply by the number of spins.',
      explanation: `Relative frequency = ${Math.round(p * spins)} ÷ ${spins} = ${p}. ${p} × ${larger} = ${p * larger}.`,
      errors: [ex('gave-probability', 'That is the estimated probability. Multiply by the number of spins.', p), ex('gave-earlier', 'That is the number from the earlier experiment. Scale it up.', Math.round(p * spins))],
    })
  }),

  // ================================================ SAMPLE SPACE (Y8)
  G('sp.count', 'probability.sample-space', [1, 3], (rng, d) => {
    const bank: [string, number, number[]][] =
      d === 1
        ? [
            ['Two coins are flipped. How many different outcomes are there?', 4, [2, 3]],
            ['A coin is flipped and a dice is rolled. How many different outcomes are there?', 12, [8, 7]],
            ['Two fair dice are rolled. How many different outcomes are there?', 36, [12, 6]],
          ]
        : d === 2
          ? [
              ['A menu has 3 starters and 4 mains. How many different ways are there to choose one starter and one main?', 12, [7]],
              ['A spinner has 3 colours and another has 5 numbers. How many different pairs of results are there?', 15, [8]],
              ['Amy has 5 tops and 2 pairs of jeans. How many different outfits can she make?', 10, [7]],
            ]
          : [
              ['Three coins are flipped. How many different outcomes are there?', 8, [6, 9]],
              ['A café offers 3 starters, 4 mains and 2 desserts. How many different three-course meals are possible?', 24, [9]],
              ['A password is one letter from A, B, C followed by one digit from 0 to 9 and then one letter from X, Y. How many passwords?', 60, [15, 25]],
            ]
    const [q, a, wrong] = rng.pick(bank)
    return num({
      prompt: q,
      answer: a,
      hint: 'Multiply the number of choices at each stage.',
      explanation: `Multiply the numbers of choices: the total is ${a}.`,
      errors: wrong.map((w) => ex('added-choices', 'Do not add the numbers of choices. Multiply them (every choice can be paired with every other).', w)),
    })
  }),

  G('sp.list', 'probability.sample-space', [2, 3], (rng, d) => {
    if (d === 2) {
      return choice({
        rng,
        prompt: 'A coin is flipped twice, one after the other. Which list shows ALL the possible outcomes?',
        correct: 'HH, HT, TH, TT',
        wrong: ['HH, HT, TT', 'HH, TT', 'HH, HT, TH'],
        hint: 'HT (head then tail) and TH (tail then head) are different outcomes.',
        explanation: 'There are 4 outcomes. Order matters: HT and TH are different.',
      })
    }
    const s1 = rng.pick([['H', 'T'], ['R', 'B']])
    const s2 = ['1', '2', '3']
    const all = s1.flatMap((a) => s2.map((b) => a + b))
    const dropped = rng.int(0, all.length - 1)
    return choice({
      rng,
      prompt: `A spinner (${s1.join(' or ')}) and a spinner (1, 2 or 3) are each spun once. Which list shows ALL the possible outcomes?`,
      correct: all.join(', '),
      wrong: [all.filter((_v, i) => i !== dropped).join(', '), all.slice(0, 3).join(', '), [...all.slice(0, 5), all[0]].join(', ')],
      hint: 'Pair each result of the first spinner with every result of the second.',
      explanation: `There should be ${s1.length} × ${s2.length} = ${all.length} outcomes: ${all.join(', ')}.`,
    })
  }),

  G('sp.table', 'probability.sample-space', [2, 4], (rng, d) => {
    const sidesA = d === 4 ? rng.pick([4, 6]) : 6
    const sidesB = d === 4 ? rng.pick([4, 6]) : d === 3 ? 4 : 6
    const rowsN = rangeTo(sidesA)
    const colsN = rangeTo(sidesB)
    const grid = rowsN.map((r) => colsN.map((c) => r + c))
    const total = sidesA * sidesB
    const figure: Figure = { type: 'table', head: ['+', ...colsN.map(String)], rows: rowsN.map((r, i) => [String(r), ...(grid[i] as number[]).map(String)]) }
    const all = grid.flat()
    const dName = (n: number) => `${n}-sided`
    const diceText = sidesA === sidesB ? `two fair ${dName(sidesA)} dice` : `a fair ${dName(sidesA)} dice and a fair ${dName(sidesB)} dice`
    if (d === 2) {
      const k = rng.int(4, Math.min(sidesA + sidesB - 2, 9))
      const ways = all.filter((v) => v === k).length
      return num({
        prompt: `The table shows the total scores when ${diceText} are rolled and added. In how many ways can a total of ${k} be made?`,
        figure,
        answer: ways,
        hint: `Count how many cells in the table show ${k}.`,
        explanation: `${k} appears ${ways} time${ways === 1 ? '' : 's'} in the table.`,
        errors: [ex('gave-total-cells', 'That is the total number of cells. Count only those showing the score asked.', total)],
      })
    }
    if (d === 3) {
      const k = rng.int(3, sidesA + sidesB - 1)
      const ways = all.filter((v) => v === k).length
      return prob({
        prompt: `The table shows the total scores when ${diceText} are rolled and added. What is the probability of a total of ${k}? (Fraction in its simplest form.)`,
        figure,
        n: ways,
        d: total,
        hint: 'Count the cells with that total, and divide by the total number of cells.',
        explanation: `${ways} of the ${total} outcomes give a total of ${k}. P = ${F(ways, total)}${gcd(ways, total) > 1 ? ` = ${frac(ways, total)}` : ''}.`,
        errors: [ex('gave-count', 'That is the number of ways. Divide by the total number of outcomes.', ways)],
      })
    }
    const preds: [string, (v: number, r: number, c: number) => boolean][] = [
      ['a total of 5 or more', (v) => v >= 5],
      ['an even total', (v) => v % 2 === 0],
      ['the same number on both dice', (_v, r, c) => r === c],
      ['a total less than 5', (v) => v < 5],
      ['a total that is a prime number', (v) => isPrimeNum(v)],
    ]
    const [desc, f] = rng.pick(preds)
    const ways = rowsN.reduce((acc, r) => acc + colsN.filter((c) => f(r + c, r, c)).length, 0)
    return prob({
      prompt: `${diceText.charAt(0).toUpperCase()}${diceText.slice(1)} are rolled and the scores are added. What is the probability of ${desc}? (Fraction in its simplest form. Drawing a table may help.)`,
      n: ways,
      d: total,
      hint: `Make a table of all ${total} outcomes, then count the ones you want.`,
      explanation: `There are ${sidesA} × ${sidesB} = ${total} equally likely outcomes. ${ways} give ${desc}. P = ${F(ways, total)}${gcd(ways, total) > 1 ? ` = ${frac(ways, total)}` : ''}.`,
      errors: [ex('gave-count', 'That is the number of ways. Divide by the total number of outcomes.', ways), ex('outcomes-added', `The total number of outcomes is ${sidesA} × ${sidesB} = ${total}, not ${sidesA} + ${sidesB}.`, ways / (sidesA + sidesB))],
    })
  }),

  // ================================================== VENN (Y8)
  G('vn.read', 'probability.venn', [1, 3], (rng, d) => {
    const left = rng.int(2, 12)
    const both = rng.int(1, 8)
    const right = rng.int(2, 12)
    const outside = rng.int(1, 8)
    const fig = (o: string): Figure => ({ type: 'venn', leftLabel: 'Football', rightLabel: 'Hockey', left: String(left), both: String(both), right: String(right), outside: o })
    if (d === 1) {
      const ask = rng.pick(['both', 'football only', 'hockey only'] as const)
      const a = ask === 'both' ? both : ask === 'football only' ? left : right
      return num({
        prompt: `The Venn diagram shows how many students in a class play football and hockey. How many students ${ask === 'both' ? 'play BOTH sports' : ask === 'football only' ? 'play football only' : 'play hockey only'}?`,
        figure: fig(String(outside)),
        answer: a,
        hint: ask === 'both' ? 'Look at the part where the two circles overlap.' : 'Look at the part of the circle that does not overlap.',
        explanation: `Read the number from the ${ask === 'both' ? 'overlap' : 'part of the circle outside the overlap'}: ${a}.`,
      })
    }
    if (d === 2) {
      const sport = rng.pick(['football', 'hockey'] as const)
      const a = sport === 'football' ? left + both : right + both
      return num({
        prompt: `The Venn diagram shows how many students play football and hockey. How many students play ${sport} altogether (including those who play both)?`,
        figure: fig(String(outside)),
        answer: a,
        hint: 'The whole circle includes the overlap.',
        explanation: `${sport === 'football' ? left : right} (${sport} only) + ${both} (both) = ${a}.`,
        errors: [ex('forgot-overlap', 'The whole circle includes the students in the overlap.', sport === 'football' ? left : right)],
      })
    }
    const total = left + both + right + outside
    return num({
      prompt: `${total} students were asked about football and hockey. The Venn diagram shows the results. How many students play NEITHER sport?`,
      figure: fig('?'),
      answer: outside,
      hint: `Add up the numbers in the circles, then take that total away from ${total}.`,
      explanation: `${left} + ${both} + ${right} = ${left + both + right}. ${total} − ${left + both + right} = ${outside}.`,
      errors: [ex('double-counted', 'You may have counted the overlap twice, or not at all. Add each region once.', total - left - right - 2 * both, total - left - right)],
    })
  }),

  G('vn.prob', 'probability.venn', [3, 4], (rng, d) => {
    const left = rng.int(2, 10)
    const both = rng.int(1, 6)
    const right = rng.int(2, 10)
    const outside = rng.int(1, 8)
    const total = left + both + right + outside
    const opts: [string, number][] = [
      ['plays both sports', both],
      ['plays hockey', right + both],
      ['plays football but NOT hockey', left],
      ['plays neither sport', outside],
    ]
    const use = d === 3 ? opts.slice(0, 2) : opts
    const [desc, n] = rng.pick(use)
    return prob({
      prompt: `The Venn diagram shows the sports played by ${total} students. One student is chosen at random. What is the probability that the student ${desc}? (Fraction in its simplest form.)`,
      figure: { type: 'venn', leftLabel: 'Football', rightLabel: 'Hockey', left: String(left), both: String(both), right: String(right), outside: String(outside) },
      n,
      d: total,
      hint: 'Probability = number of students who match ÷ total number of students.',
      explanation: `${n} of the ${total} students ${desc.replace('plays', 'play').replace('NOT', 'do NOT')}. P = ${F(n, total)}${gcd(n, total) > 1 ? ` = ${frac(n, total)}` : ''}.`,
      errors: [ex('wrong-total', 'The bottom of the fraction is the number of ALL the students (add every region).', n / (total - outside))],
    })
  }),

  G('vn.classify', 'probability.venn', [2, 4], (rng, d) => {
    const props: [string, (n: number) => boolean][] = [
      ['even numbers', (n) => n % 2 === 0],
      ['multiples of 3', (n) => n % 3 === 0],
      ['multiples of 5', (n) => n % 5 === 0],
      ['prime numbers', (n) => isPrimeNum(n)],
      ['square numbers', (n) => [1, 4, 9, 16, 25].includes(n)],
      ['factors of 24', (n) => 24 % n === 0],
      ['numbers less than 10', (n) => n < 10],
    ]
    const top = d === 2 ? 20 : 30
    for (let g = 0; g < 300; g++) {
      const pa = rng.pick(props)
      const pb = rng.pick(props)
      if (pa === pb) continue
      const all = rangeTo(top)
      const inA = all.filter(pa[1])
      const inB = all.filter(pb[1])
      const bothN = all.filter((n) => pa[1](n) && pb[1](n)).length
      const eitherN = all.filter((n) => pa[1](n) || pb[1](n)).length
      const neither = top - eitherN
      if (bothN === 0 || neither === 0 || inA.length < 3 || inB.length < 3) continue
      const setup = `The numbers 1 to ${top} are sorted into two sets. Set A = ${pa[0]}. Set B = ${pb[0]}.`
      if (d === 2) {
        return num({
          prompt: `${setup} How many numbers are in BOTH A and B?`,
          answer: bothN,
          hint: 'List the members of each set, then look for numbers in both lists.',
          explanation: `A: ${inA.join(', ')}. B: ${inB.join(', ')}. In both: ${all.filter((n) => pa[1](n) && pb[1](n)).join(', ')} (${bothN}).`,
          errors: [ex('added', 'Do not add the sizes of the two sets. Only count numbers that are in both lists.', inA.length + inB.length)],
        })
      }
      if (d === 3) {
        return num({
          prompt: `${setup} How many numbers are in NEITHER set?`,
          answer: neither,
          hint: `Count the numbers that are in A or B (or both), and take away from ${top}.`,
          explanation: `A: ${inA.join(', ')}. B: ${inB.join(', ')}. In A or B: ${eitherN} numbers (the ${bothN} in both are only counted once). ${top} − ${eitherN} = ${neither}.`,
          errors: [ex('double-counted', 'Numbers in both sets have been counted twice. Count each number once.', top - inA.length - inB.length)],
        })
      }
      const askEither = rng.chance(0.5)
      return prob({
        prompt: `${setup} A number is chosen at random from 1 to ${top}. What is the probability that it is ${askEither ? 'in A or B (or both)' : 'in neither set'}? (Fraction in its simplest form.)`,
        n: askEither ? eitherN : neither,
        d: top,
        hint: 'Sort the numbers into a Venn diagram first.',
        explanation: `A: ${inA.join(', ')}. B: ${inB.join(', ')}. Both: ${bothN}. In A or B: ${eitherN}. Neither: ${neither}. P = ${F(askEither ? eitherN : neither, top)}.`,
        errors: [ex('double-counted', 'Numbers in both sets must only be counted once.', (inA.length + inB.length) / top)],
      })
    }
    throw new Error('vn.classify: no candidate')
  }),

  G('vn.sets', 'probability.venn', [2, 4], (rng, d) => {
    const bank: [string, string, string][] = [
      ['A ∩ B', 'The items that are in BOTH A and B', 'intersection'],
      ['A ∪ B', 'The items that are in A, or B, or both', 'union'],
      ['A′', 'The items that are NOT in A', 'complement'],
      ['ξ', 'Everything being considered (the universal set)', 'universal set'],
    ]
    const use = d === 2 ? bank.slice(0, 2) : bank
    const [sym, meaning] = rng.pick(use)
    return choice({
      rng,
      prompt: `In set notation, what does ${sym} mean?`,
      correct: meaning,
      wrong: bank.filter((b) => b[0] !== sym).map((b) => b[1]),
      hint: '∩ looks like an “n” for “and” (in both). ∪ looks like a “u” for “union” (put together).',
      explanation: `${sym} means: ${meaning.charAt(0).toLowerCase()}${meaning.slice(1)}.`,
    })
  }),

  // =================================================== INDEPENDENT (Y8)
  G('ind.identify', 'probability.independent', [1, 2], (rng) => {
    const indep = [
      'Flipping a coin, then rolling a dice',
      'Spinning a spinner twice',
      'Rolling a dice twice',
      'Picking a card from a pack, putting it back and shuffling, then picking again',
    ]
    const dep = [
      'Picking two sweets from a bag one after the other, and eating the first',
      'Picking two cards from a pack without replacing the first',
      'Taking two names out of a hat and keeping the first name out',
    ]
    const askIndep = rng.chance(0.6)
    const right = rng.pick(askIndep ? indep : dep)
    const wrongs = rng.shuffle(askIndep ? dep : indep).slice(0, 2)
    return choice({
      rng,
      prompt: `Which of these pairs of events ${askIndep ? 'IS' : 'is NOT'} independent?`,
      correct: right,
      wrong: wrongs,
      hint: 'Events are independent if the first result has NO effect on the probabilities for the second.',
      explanation: askIndep ? 'The first event does not change what can happen in the second, so they are independent.' : 'Taking something out and not replacing it changes the probabilities of the next pick, so they are NOT independent.',
    })
  }),

  G('ind.mult', 'probability.independent', [2, 4], (rng, d) => {
    if (d === 2) {
      const ctx: [string, string, number, number][] = [
        ['coin', 'a fair coin lands heads', 1, 2],
        ['dice', 'a fair dice shows a 6', 1, 6],
        ['dice', 'a fair dice shows an even number', 1, 2],
        ['dice', 'a fair dice shows a number less than 3', 1, 3],
        ['spinner', 'a fair spinner with 4 equal sections lands on red', 1, 4],
        ['spinner', 'a fair spinner with 5 equal sections lands on an odd number', 3, 5],
      ]
      const a = rng.pick(ctx)
      const b = rng.pick(ctx.filter((c) => c[0] !== a[0]))
      const n = a[2] * b[2]
      const dd = a[3] * b[3]
      return prob({
        prompt: `Two independent things happen. First, ${a[1]}. Second, ${b[1]}. What is the probability that BOTH happen? (Fraction in its simplest form.)`,
        n,
        d: dd,
        hint: 'For independent events: P(A and B) = P(A) × P(B).',
        explanation: `${F(a[2], a[3])} × ${F(b[2], b[3])} = ${F(n, dd)}${gcd(n, dd) > 1 ? ` = ${frac(n, dd)}` : ''}.`,
        errors: [ex('added', 'For "and" you MULTIPLY the probabilities (adding is not right).', (a[2] * b[3] + b[2] * a[3]) / dd)],
      })
    }
    if (d === 3) {
      const [pa, qa] = [rng.int(1, 4), rng.pick([5, 7])]
      const [pb, qb] = [rng.int(1, 3), rng.pick([4, 8, 10])]
      const nn = pa * pb
      const dd = qa * qb
      return prob({
        prompt: `A and B are independent events. P(A) = ${F(pa, qa)} and P(B) = ${F(pb, qb)}. What is P(A and B)? (Fraction in its simplest form.)`,
        n: nn,
        d: dd,
        hint: 'Multiply the probabilities. Multiply the tops, multiply the bottoms.',
        explanation: `${F(pa, qa)} × ${F(pb, qb)} = ${F(nn, dd)}${gcd(nn, dd) > 1 ? ` = ${frac(nn, dd)}` : ''}.`,
        errors: [ex('added', 'For "and" you MULTIPLY. You added.', (pa * qb + pb * qa) / dd)],
      })
    }
    const p = rng.pick([0.8, 0.9, 0.7, 0.6, 0.3, 0.2])
    const late = rng.chance(0.4)
    const q = late ? round(1 - p, 2) : p
    return num({
      prompt: `The probability that a bus is on time is ${p}. Whether it is on time on one day does not affect any other day. What is the probability that it is ${late ? 'LATE on both Monday and Tuesday' : 'on time on both Monday and Tuesday'}?`,
      answer: round(q * q, 4),
      hint: late ? 'First find P(late) = 1 − P(on time). Then multiply the two probabilities.' : 'Multiply the probability for Monday by the probability for Tuesday.',
      explanation: late ? `P(late) = 1 − ${p} = ${q}. ${q} × ${q} = ${round(q * q, 4)}.` : `${p} × ${p} = ${round(p * p, 4)}.`,
      errors: [ex('doubled', 'For two days you MULTIPLY the probabilities, not double the probability.', round(q * 2, 3)), ex('gave-single', 'That is the probability for ONE day. Multiply the two days together.', q), ...(late ? [ex('used-on-time', 'You used P(on time). The question asks about being LATE: take it from 1 first.', round(p * p, 4))] : [])],
    })
  }),

  G('ind.repeated', 'probability.independent', [4, 5], (rng, d) => {
    if (d === 4) {
      const [thing, n, p, den, name] = rng.pick<[string, number, number, number, string]>([
        ['A fair coin is flipped', 3, 1, 2, 'heads every time'],
        ['A fair dice is rolled', 2, 1, 6, 'a 6 both times'],
        ['A fair dice is rolled', 3, 1, 2, 'an even number every time'],
        ['A fair spinner with 4 equal sections is spun', 3, 1, 4, 'red every time'],
      ])
      const top = p ** n
      const bottom = den ** n
      return prob({
        prompt: `${thing} ${n} times. What is the probability of getting ${name}? (Fraction in its simplest form.)`,
        n: top,
        d: bottom,
        hint: 'Multiply the probability for each go together.',
        explanation: `${Array(n).fill(F(p, den)).join(' × ')} = ${F(top, bottom)}.`,
        errors: [ex('multiplied-by-n', `Multiply the probability by ITSELF ${n} times, not by ${n}.`, (p * n) / den)],
      })
    }
    const dice = rng.chance(0.5)
    if (dice) {
      return prob({
        prompt: 'A fair dice is rolled twice. What is the probability of getting AT LEAST ONE 6? (Fraction in its simplest form.)',
        n: 11,
        d: 36,
        hint: 'It is easier to find the probability of NO sixes, then take that from 1.',
        explanation: `P(no 6 on one roll) = ${F(5, 6)}. P(no 6 in two rolls) = ${F(5, 6)} × ${F(5, 6)} = ${F(25, 36)}. P(at least one 6) = 1 − ${F(25, 36)} = ${F(11, 36)}.`,
        errors: [ex('added', 'You cannot just add the two probabilities: that counts the “double 6” twice.', 1 / 3), ex('gave-none', 'That is the probability of NO sixes. Take it from 1.', 25 / 36)],
      })
    }
    return multi({
      prompt: 'A fair coin is flipped three times. Give the probability of (a) getting three heads, and (b) getting AT LEAST ONE tail. (Fractions or decimals.)',
      fields: [{ answer: 1 / 8, display: '1/8', requireLowestTerms: true }, { answer: 7 / 8, display: '7/8', requireLowestTerms: true }],
      template: '(a) {0}    (b) {1}',
      keypad: 'fraction',
      hint: '(a) multiply the three probabilities. (b) “At least one tail” is everything except “all heads”.',
      explanation: `(a) ${F(1, 2)} × ${F(1, 2)} × ${F(1, 2)} = ${F(1, 8)}. (b) 1 − ${F(1, 8)} = ${F(7, 8)}.`,
    })
  }),
]
