import type { ItemGenerator } from '@/engine/registry'
import type { Rng } from '@/engine/types'
import { choice } from '../../kit'
import { bankGenerators, err, fix, fmt, G, num, round, table, type Bank, type Mcq } from './factory'

// =====================================================================================================================
// Quantities and units
// =====================================================================================================================

const unitsBank: Bank = {
  skill: 'phys.ws.units',
  links: [
    {
      prompt: 'Match each quantity to its unit.',
      pairs: [
        ['Force', 'newton (N)'],
        ['Energy', 'joule (J)'],
        ['Power', 'watt (W)'],
        ['Current', 'amp (A)'],
        ['Potential difference', 'volt (V)'],
        ['Resistance', 'ohm (Ω)'],
        ['Mass', 'kilogram (kg)'],
        ['Speed', 'metres per second (m/s)'],
        ['Frequency', 'hertz (Hz)'],
        ['Time', 'second (s)'],
        ['Pressure', 'newtons per square metre (N/m^{2})'],
        ['Moment', 'newton metre (N m)'],
        ['Density', 'kilograms per cubic metre (kg/m^{3})'],
        ['Gravitational field strength', 'newtons per kilogram (N/kg)'],
      ],
      hint: 'Several units are named after scientists (Newton, Joule, Watt, Ohm, Hertz). The rest are built from metres, seconds and kilograms.',
      ask: (q) => `What is the standard unit of ${q.toLowerCase()}?`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'Weight is a force. What unit is weight measured in?',
      a: 'newtons (N)',
      wrong: [
        { label: 'kilograms (kg)', misconception: 'weight-in-kg', feedback: 'Kilograms measure mass (how much matter). Weight is the pull of gravity, a force, so it is in newtons.' },
        'joules (J)',
        'grams (g)',
      ],
      hint: 'All forces share the same unit.',
      why: 'Weight is the force of gravity on an object, so like every force it is measured in newtons. Mass is measured in kilograms.',
      lv: [1, 3],
    },
    {
      q: 'What does the prefix "kilo" (as in kilometre, kilojoule, kilowatt) mean?',
      a: '1000 times',
      wrong: [{ label: '100 times', misconception: 'kilo-100', feedback: '100 times would be "hecto", which is rarely used. Kilo means 1000.' }, '10 times', { label: 'One thousandth of', misconception: 'kilo-milli', feedback: 'That is "milli", as in millimetre.' }],
      hint: 'How many metres are in a kilometre?',
      why: 'Kilo means 1000: 1 km = 1000 m, 1 kJ = 1000 J, 1 kW = 1000 W.',
      lv: [1, 3],
    },
    {
      q: 'What does the prefix "milli" (as in millimetre, milliamp) mean?',
      a: 'One thousandth of',
      wrong: [{ label: '1000 times', misconception: 'milli-kilo', feedback: 'That is "kilo". Milli means one thousandth.' }, 'One hundredth of', 'One millionth of'],
      hint: 'How many millimetres are in a metre?',
      why: 'Milli means one thousandth: 1 mm = 0.001 m and 1 mA = 0.001 A, so there are 1000 mm in a metre.',
      lv: [2, 4],
    },
    {
      q: 'Which of these is a unit of energy?',
      a: 'kilojoule (kJ)',
      wrong: [
        { label: 'kilowatt (kW)', misconception: 'power-energy', feedback: 'A watt is a unit of power: how fast energy is transferred, not an amount of energy.' },
        { label: 'newton (N)', misconception: 'force-energy', feedback: 'The newton is the unit of force.' },
        'kilogram (kg)',
      ],
      hint: 'Food labels use it.',
      why: 'Energy is measured in joules; a kilojoule is 1000 joules. Watts measure power, newtons measure force and kilograms measure mass.',
      lv: [2, 4],
    },
    {
      q: 'Which of these is NOT a unit of speed?',
      a: 'm/s^{2}',
      wrong: ['m/s', 'km/h', 'cm/s'],
      hint: 'Speed is a distance divided by a time.',
      why: 'Speed is distance ÷ time, so its units are a distance unit per time unit, such as m/s, km/h or cm/s. m/s^{2} is the unit of acceleration (how fast speed changes), which you meet later.',
      lv: [3, 5],
    },
    {
      q: 'Density can be given in g/cm^{3} or in kg/m^{3}. Water has a density of 1 g/cm^{3}. What is this in kg/m^{3}?',
      a: '1000 kg/m^{3}',
      wrong: [{ label: '1 kg/m^{3}', misconception: 'density-units-same', feedback: 'A cubic metre is a million cubic centimetres, so the numbers are different in the two units.' }, '0.001 kg/m^{3}', '100 kg/m^{3}'],
      hint: '1 m^{3} holds 1,000,000 cm^{3} of water. What is the mass of that in kg?',
      why: '1 m^{3} = 1,000,000 cm^{3}. At 1 g per cm^{3} that is 1,000,000 g = 1000 kg, so water is 1000 kg/m^{3}.',
      lv: [4, 5],
    },
  ],
}

interface Conversion {
  big: string
  small: string
  factor: number
  /** Allowed steps for a value in the big unit at each difficulty (so both sides of the conversion are tidy). */
  steps: number[]
  /** Largest value in the big unit (default 12, or 9 at the harder levels). */
  max?: number
}

const CONVERSIONS: Conversion[] = [
  { big: 'km', small: 'm', factor: 1000, steps: [1, 1, 0.5, 0.1, 0.05] },
  { big: 'm', small: 'cm', factor: 100, steps: [1, 1, 0.5, 0.1, 0.05] },
  { big: 'cm', small: 'mm', factor: 10, steps: [1, 1, 0.5, 0.1, 0.1] },
  { big: 'kg', small: 'g', factor: 1000, steps: [1, 1, 0.5, 0.1, 0.05] },
  { big: 'kJ', small: 'J', factor: 1000, steps: [1, 1, 0.5, 0.1, 0.05] },
  { big: 'kW', small: 'W', factor: 1000, steps: [1, 1, 0.5, 0.1, 0.05] },
  { big: 'A', small: 'mA', factor: 1000, steps: [0.1, 0.1, 0.05, 0.01, 0.01], max: 2 },
  { big: 'minutes', small: 's', factor: 60, steps: [1, 1, 0.5, 0.5, 0.25] },
  { big: 'hours', small: 'minutes', factor: 60, steps: [1, 1, 0.5, 0.25, 0.25] },
  { big: 'hours', small: 's', factor: 3600, steps: [1, 1, 0.5, 0.5, 0.25] },
]

const unitName = (u: string) => (u === 's' ? 'seconds' : u)

const convert = G('phys.ws.units.convert', 'phys.ws.units', [1, 5], (rng, d) => {
  const pool = d <= 1 ? CONVERSIONS.filter((c) => c.factor !== 3600 && c.big !== 'A') : d <= 2 ? CONVERSIONS.filter((c) => c.factor !== 3600) : CONVERSIONS
  const c = rng.pick(pool)
  const step = c.steps[d - 1] ?? 1
  const maxSteps = Math.round((c.max ?? (d <= 2 ? 12 : 9)) / step)
  let big = round(rng.int(1, maxSteps) * step, 4)
  if (d >= 3 && Number.isInteger(big)) big = round(big + step, 4) // make the harder levels genuinely fractional
  const small = round(big * c.factor, 4)
  const down = d <= 1 ? true : rng.chance(0.5) // big -> small (multiply) or small -> big (divide)
  const given = down ? big : small
  const answer = down ? small : big
  const from = down ? c.big : c.small
  const to = down ? c.small : c.big
  const wrongWay = down ? given / c.factor : given * c.factor
  return num({
    prompt: `Convert ${fmt(given)} ${unitName(from)} into ${unitName(to)}.`,
    answer,
    suffix: unitName(to),
    hint: `There are ${fmt(c.factor)} ${unitName(c.small)} in 1 ${c.big === 'hours' ? 'hour' : c.big === 'minutes' ? 'minute' : c.big}. Going to a smaller unit gives a bigger number.`,
    explanation: `1 ${c.big === 'hours' ? 'hour' : c.big === 'minutes' ? 'minute' : c.big} = ${fmt(c.factor)} ${unitName(c.small)}. ${down ? `Multiply by ${fmt(c.factor)}` : `Divide by ${fmt(c.factor)}`}: ${fmt(given)} ${down ? '×' : '÷'} ${fmt(c.factor)} = ${fmt(answer)} ${unitName(to)}.`,
    errors: [err(wrongWay, 'conversion-wrong-way', down ? `You divided, but ${unitName(to)} are smaller units, so there should be more of them.` : `You multiplied, but ${unitName(to)} are bigger units, so there should be fewer of them.`)],
  })
})

// =====================================================================================================================
// Using and rearranging equations
// =====================================================================================================================

/** A physics relation written as product = a × b, together with its usual textbook form. */
interface Eq {
  key: string
  product: [string, string]
  a: [string, string]
  b: [string, string]
  /** Which quantity is the subject in the usual form. */
  usual: 'product' | 'a'
  /** Values for a and b at each difficulty (the product is computed). */
  aVals: number[]
  bVals: number[]
  context: string
  /** Quantities that can sensibly be asked for. */
  find: ('product' | 'a' | 'b')[]
}

const EQS: Eq[] = [
  { key: 'speed', product: ['distance', 'm'], a: ['speed', 'm/s'], b: ['time', 's'], usual: 'a', aVals: [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25], bVals: [4, 5, 6, 8, 10, 12, 20, 30, 40, 50, 60], context: 'a moving object', find: ['product', 'a', 'b'] },
  { key: 'pressure', product: ['force', 'N'], a: ['pressure', 'N/m^{2}'], b: ['area', 'm^{2}'], usual: 'a', aVals: [50, 100, 200, 250, 400, 500, 1000, 2000], bVals: [2, 3, 4, 5, 6, 8, 10], context: 'a force pressing on a surface', find: ['product', 'a', 'b'] },
  { key: 'density', product: ['mass', 'g'], a: ['density', 'g/cm^{3}'], b: ['volume', 'cm^{3}'], usual: 'a', aVals: [2, 3, 4, 5, 7, 8, 10, 11], bVals: [5, 10, 20, 25, 30, 40, 50, 60], context: 'a block of material', find: ['product', 'a', 'b'] },
  { key: 'weight', product: ['weight', 'N'], a: ['mass', 'kg'], b: ['gravitational field strength', 'N/kg'], usual: 'product', aVals: [2, 3, 5, 8, 12, 15, 25, 40, 45, 50, 60, 75], bVals: [10], context: 'an object on Earth (g = 10 N/kg)', find: ['product', 'a'] },
  { key: 'moment', product: ['moment', 'N m'], a: ['force', 'N'], b: ['distance from the pivot', 'm'], usual: 'product', aVals: [4, 5, 8, 10, 12, 20, 25, 30, 40, 50], bVals: [2, 3, 4, 5, 0.5, 1.5, 2.5], context: 'a force turning something about a pivot', find: ['product', 'a', 'b'] },
  { key: 'power', product: ['energy transferred', 'J'], a: ['power', 'W'], b: ['time', 's'], usual: 'a', aVals: [5, 10, 20, 25, 40, 50, 60, 100, 200, 500], bVals: [2, 4, 5, 10, 20, 30, 60, 120], context: 'an electrical appliance', find: ['product', 'a', 'b'] },
  { key: 'work', product: ['work done', 'J'], a: ['force', 'N'], b: ['distance moved', 'm'], usual: 'product', aVals: [5, 10, 20, 25, 30, 40, 50, 100, 200], bVals: [2, 3, 4, 5, 6, 8, 10, 0.5, 1.5], context: 'a force moving an object', find: ['product', 'a', 'b'] },
  { key: 'resistance', product: ['potential difference', 'V'], a: ['resistance', 'Ω'], b: ['current', 'A'], usual: 'a', aVals: [2, 3, 4, 5, 6, 10, 12, 20], bVals: [0.5, 1, 1.5, 2, 3, 0.2, 0.25], context: 'a component in a circuit', find: ['product', 'a', 'b'] },
]

const nameOf = (e: Eq, w: 'product' | 'a' | 'b') => (w === 'product' ? e.product[0] : w === 'a' ? e.a[0] : e.b[0])
const unitOf = (e: Eq, w: 'product' | 'a' | 'b') => (w === 'product' ? e.product[1] : w === 'a' ? e.a[1] : e.b[1])
const usualForm = (e: Eq) => (e.usual === 'a' ? `${e.a[0]} = ${e.product[0]} ÷ ${e.b[0]}` : `${e.product[0]} = ${e.a[0]} × ${e.b[0]}`)
const formFor = (e: Eq, w: 'product' | 'a' | 'b') =>
  w === 'product' ? `${e.product[0]} = ${e.a[0]} × ${e.b[0]}` : w === 'a' ? `${e.a[0]} = ${e.product[0]} ÷ ${e.b[0]}` : `${e.b[0]} = ${e.product[0]} ÷ ${e.a[0]}`

const rearrange = G('phys.ws.equations.rearrange', 'phys.ws.equations', [2, 5], (rng, d) => {
  const e = rng.pick(EQS.filter((x) => x.key !== 'weight' || d <= 3))
  const t: 'product' | 'a' | 'b' = d >= 4 ? 'b' : e.usual === 'a' ? 'product' : 'a'
  const T = nameOf(e, t)
  const others = (['product', 'a', 'b'] as const).filter((w) => w !== t)
  const [o1, o2] = others.map((w) => nameOf(e, w)) as [string, string]
  const correct = formFor(e, t)
  const wrong =
    t === 'product'
      ? [
          { label: `${T} = ${o1} ÷ ${o2}`, misconception: 'rearrange-divide', feedback: `Multiply both sides of ${usualForm(e)} by ${e.b[0]} to get ${e.product[0]} on its own.` },
          `${T} = ${o2} ÷ ${o1}`,
          `${T} = ${o1} + ${o2}`,
        ]
      : [
          { label: `${T} = ${o1} × ${o2}`, misconception: 'rearrange-multiply', feedback: `${e.product[0]} is the product of the other two, so to find one of them you divide ${e.product[0]} by the other.` },
          { label: `${T} = ${nameOf(e, others.find((w) => w !== 'product') as 'a' | 'b')} ÷ ${e.product[0]}`, misconception: 'rearrange-upside-down', feedback: 'That fraction is upside down. Check by putting in some easy numbers.' },
          `${T} = ${e.product[0]} − ${nameOf(e, others.find((w) => w !== 'product') as 'a' | 'b')}`,
        ]
  return choice({
    rng,
    prompt: `The equation for ${e.context} is:\n${usualForm(e)}\nRearrange it to make ${T} the subject.`,
    correct,
    wrong,
    hint: `Try it with easy numbers: if ${e.a[0]} were 2 and ${e.b[0]} were 3, ${e.product[0]} would be 6. Which option still works?`,
    explanation: `${e.product[0]} = ${e.a[0]} × ${e.b[0]}, so ${correct}. Check with numbers: 6 = 2 × 3, so 2 = 6 ÷ 3 and 3 = 6 ÷ 2.`,
  })
})

const calc = G('phys.ws.equations.calc', 'phys.ws.equations', [1, 5], (rng, d) => {
  const e = rng.pick(EQS)
  const usualSubject: 'product' | 'a' = e.usual === 'a' ? 'a' : 'product'
  const others = e.find.filter((w) => w !== usualSubject)
  const t: 'product' | 'a' | 'b' =
    d <= 2 ? usualSubject : d === 3 ? (e.usual === 'a' ? 'product' : 'a') : d === 4 ? (e.find.includes('b') ? 'b' : 'a') : rng.pick(others)
  const a = rng.pick(e.aVals)
  const b = rng.pick(e.bVals)
  const p = round(a * b, 6)
  const val = { product: p, a, b }
  const ans = val[t]
  const shown = (['product', 'a', 'b'] as const).filter((w) => w !== t)
  const lines = shown.map((w) => `${nameOf(e, w)} = ${fmt(val[w])} ${unitOf(e, w)}`).join('\n')
  const wrongs =
    t === 'product'
      ? [err(round(a / b, 6), 'divided-not-multiplied', `You divided, but ${e.product[0]} = ${e.a[0]} × ${e.b[0]}.`)]
      : [
          err(round(val[shown[0] as 'product' | 'a' | 'b'] * val[shown[1] as 'product' | 'a' | 'b'], 6), 'multiplied-not-divided', `You multiplied. To find ${nameOf(e, t)} you divide: ${formFor(e, t)}.`),
          err(round(t === 'a' ? b / p : a / p, 6), 'upside-down', 'Your division is upside down.'),
        ]
  return num({
    prompt: `Use ${usualForm(e)}${e.key === 'weight' ? ' (g = 10 N/kg)' : ''}.\n${lines}\nCalculate the ${nameOf(e, t)}. Give your answer in ${unitOf(e, t)}.`,
    answer: ans,
    suffix: unitOf(e, t),
    hint: t === usualSubject ? 'Put the numbers straight into the equation.' : `Rearrange first: ${e.product[0]} = ${e.a[0]} × ${e.b[0]}.`,
    explanation: `${formFor(e, t)} = ${t === 'product' ? `${fmt(a)} × ${fmt(b)}` : `${fmt(p)} ÷ ${fmt(t === 'a' ? b : a)}`} = ${fmt(ans)} ${unitOf(e, t)}.`,
    errors: wrongs,
  })
})

const eqBank: Bank = {
  skill: 'phys.ws.equations',
  mcqs: [
    {
      q: 'A student uses speed = distance ÷ time with the distance in kilometres and the time in hours. What unit will the speed be in?',
      a: 'km/h',
      wrong: [{ label: 'm/s', misconception: 'units-follow-inputs', feedback: 'The units of the answer come from the units you put in: km ÷ h gives km/h.' }, 'km/s', 'm/h'],
      hint: 'The unit is built from the units you divide.',
      why: 'Dividing a distance in km by a time in hours gives a speed in km/h. To get m/s you need metres and seconds.',
      lv: [2, 4],
    },
    {
      q: 'Before using power = energy ÷ time to get a power in watts, what must the time be in?',
      a: 'seconds',
      wrong: [{ label: 'minutes', misconception: 'time-in-minutes', feedback: 'A watt is one joule per second, so the time must be in seconds.' }, 'hours', 'any unit, it makes no difference'],
      hint: 'What is one watt?',
      why: 'One watt means one joule per second. Use energy in joules and time in seconds to get watts.',
      lv: [2, 4],
    },
    {
      q: 'Which equation is the same as density = mass ÷ volume?',
      a: 'mass = density × volume',
      wrong: [{ label: 'mass = volume ÷ density', misconception: 'rearrange-upside-down', feedback: 'Try numbers: 6 ÷ 3 = 2, so 6 = 2 × 3, not 3 ÷ 2.' }, 'volume = density × mass', 'mass = density ÷ volume'],
      hint: 'Multiply both sides by volume.',
      why: 'Multiplying both sides of density = mass ÷ volume by volume gives mass = density × volume.',
      lv: [2, 4],
    },
  ],
}

// =====================================================================================================================
// Tables, graphs and patterns
// =====================================================================================================================

interface Experiment {
  who: string
  method: string
  x: [string, string]
  y: [string, string]
  controls: string[]
  /** Build the readings for this run: x values and the rule y(x). */
  make: (rng: Rng) => { xs: number[]; f: (x: number) => number; dp: number; rule: string }
  /** Straight line through the origin? */
  proportional: boolean
}

const EXPERIMENTS: Experiment[] = [
  {
    who: 'Ava',
    method: 'hangs different loads on a spring and measures how far it stretches (its extension)',
    x: ['load', 'N'],
    y: ['extension', 'cm'],
    controls: ['the spring used', 'how the ruler is lined up'],
    make: (rng) => {
      const k = rng.pick([1.5, 2, 2.5, 3, 4])
      return { xs: [1, 2, 3, 4, 5, 6], f: (x) => k * x, dp: 1, rule: `the extension goes up by ${fmt(k)} cm for every 1 N` }
    },
    proportional: true,
  },
  {
    who: 'Ben',
    method: 'changes the potential difference across a resistor and measures the current through it',
    x: ['potential difference', 'V'],
    y: ['current', 'A'],
    controls: ['the resistor used', 'the temperature of the resistor'],
    make: (rng) => {
      const r = rng.pick([2, 4, 5, 10])
      return { xs: [1, 2, 3, 4, 5, 6], f: (x) => x / r, dp: 2, rule: `the current goes up by ${fmt(1 / r)} A for every 1 V` }
    },
    proportional: true,
  },
  {
    who: 'Cara',
    method: 'times a toy robot moving at a steady speed and measures how far it has gone',
    x: ['time', 's'],
    y: ['distance', 'cm'],
    controls: ['the surface the robot moves on', 'the batteries in the robot'],
    make: (rng) => {
      const v = rng.pick([4, 5, 6, 8, 12, 15])
      return { xs: [2, 4, 6, 8, 10, 12], f: (x) => v * x, dp: 0, rule: `the distance goes up by ${fmt(2 * v)} cm every 2 s` }
    },
    proportional: true,
  },
  {
    who: 'Dev',
    method: 'heats a beaker of water with an immersion heater and records the temperature every minute',
    x: ['heating time', 'min'],
    y: ['temperature', '°C'],
    controls: ['the mass of water', 'the heater used'],
    make: (rng) => {
      const t0 = rng.pick([14, 16, 18, 20, 22])
      const r = rng.pick([4, 5, 6, 8])
      return { xs: [0, 1, 2, 3, 4, 5], f: (x) => t0 + r * x, dp: 0, rule: `the temperature goes up by ${r} °C every minute, starting from ${t0} °C` }
    },
    proportional: false,
  },
  {
    who: 'Ella',
    method: 'hangs different loads on a spring and measures its total length',
    x: ['load', 'N'],
    y: ['length of spring', 'cm'],
    controls: ['the spring used', 'how the ruler is lined up'],
    make: (rng) => {
      const l0 = rng.pick([5, 6, 8, 10, 12])
      const k = rng.pick([1, 2, 3])
      return { xs: [1, 2, 3, 4, 5, 6], f: (x) => l0 + k * x, dp: 0, rule: `the length goes up by ${k} cm for every 1 N, from an unstretched length of ${l0} cm` }
    },
    proportional: false,
  },
  {
    who: 'Finn',
    method: 'pours different volumes of a liquid into a beaker on a balance (set to zero with the empty beaker) and records the mass',
    x: ['volume', 'cm^{3}'],
    y: ['mass', 'g'],
    controls: ['the liquid used', 'the beaker used'],
    make: (rng) => {
      const rho = rng.pick([0.8, 0.9, 1.2, 1.5])
      return { xs: [10, 20, 30, 40, 50, 60], f: (x) => rho * x, dp: 0, rule: `the mass goes up by ${fmt(rho * 10)} g for every 10 cm^{3}` }
    },
    proportional: true,
  },
  {
    who: 'Gita',
    method: 'hangs different masses on a newtonmeter and records the weight',
    x: ['mass', 'kg'],
    y: ['weight', 'N'],
    controls: ['the newtonmeter used', 'the place the test is done'],
    make: () => ({ xs: [0.5, 1, 1.5, 2, 2.5, 3], f: (x) => 10 * x, dp: 0, rule: 'the weight goes up by 5 N for every 0.5 kg' }),
    proportional: true,
  },
]

const xHead = (e: Experiment) => `${e.x[0][0]?.toUpperCase()}${e.x[0].slice(1)} (${e.x[1]})`
const yHead = (e: Experiment) => `${e.y[0][0]?.toUpperCase()}${e.y[0].slice(1)} (${e.y[1]})`
const show = (v: number, dp: number) => (dp === 0 ? fmt(v) : fmt(v, dp))

const variables = G('phys.ws.graphs.variables', 'phys.ws.graphs', [1, 3], (rng, d) => {
  const e = rng.pick(EXPERIMENTS)
  const askDep = d >= 2 && rng.chance(0.5)
  const control = rng.pick(e.controls)
  const indep = `The ${e.x[0]}`
  const dep = `The ${e.y[0]}`
  const ctl = `${control[0]?.toUpperCase()}${control.slice(1)}`
  return choice({
    rng,
    prompt: `${e.who} ${e.method}. Which is the ${askDep ? 'dependent' : 'independent'} variable?`,
    correct: askDep ? dep : indep,
    wrong: askDep
      ? [{ label: indep, misconception: 'swapped-variables', feedback: 'That is the independent variable: the one she chooses and changes.' }, { label: ctl, misconception: 'control-as-dependent', feedback: 'That is a control variable: it is kept the same for a fair test.' }]
      : [{ label: dep, misconception: 'swapped-variables', feedback: 'That is the dependent variable: the one she measures.' }, { label: ctl, misconception: 'control-as-independent', feedback: 'That is a control variable: it is kept the same for a fair test.' }],
    hint: 'The independent variable is the one you change on purpose. The dependent variable is the one you measure.',
    explanation: `${e.who} changes the ${e.x[0]} (independent variable) and measures the ${e.y[0]} (dependent variable). ${ctl}: a control variable, kept the same to make it a fair test.`,
  })
})

const anomaly = G('phys.ws.graphs.anomaly', 'phys.ws.graphs', [2, 4], (rng, d) => {
  const e = rng.pick(EXPERIMENTS)
  const m = e.make(rng)
  const ys = m.xs.map(m.f)
  const i = rng.int(1, m.xs.length - 1)
  const stepY = (ys[1] as number) - (ys[0] as number)
  const size = (d >= 4 ? 0.5 : rng.pick([1.5, 2])) * stepY
  const off = rng.chance(0.5) && (ys[i] as number) - size > 0 ? -size : size
  const shownYs = ys.map((y, k) => round(k === i ? y + off : y, 4))
  const labels = m.xs.map((x) => `The reading at ${fmt(x)} ${e.x[1]}`)
  const correct = labels[i] as string
  return choice({
    rng,
    prompt: `${e.who} ${e.method}. One result does not fit the pattern. Which is the anomalous result?`,
    figure: table([xHead(e), yHead(e)], m.xs.map((x, k) => [fmt(x), show(shownYs[k] as number, m.dp)])),
    correct,
    wrong: rng.shuffle(labels.filter((_, k) => k !== i)).slice(0, 3),
    hint: 'Work out how much the result changes from one row to the next. Which row breaks that pattern?',
    explanation: `The pattern is that ${m.rule}. At ${fmt(m.xs[i] as number)} ${e.x[1]} the result should be ${show(ys[i] as number, m.dp)} ${e.y[1]}, but it was recorded as ${show(shownYs[i] as number, m.dp)} ${e.y[1]}. An anomalous result should be checked and repeated, and left out of any mean.`,
  })
})

const predict = G('phys.ws.graphs.predict', 'phys.ws.graphs', [2, 5], (rng, d) => {
  const e = rng.pick(EXPERIMENTS)
  const m = e.make(rng)
  const shownXs = m.xs.slice(0, 5)
  const rows = shownXs.map((x) => [fmt(x), show(m.f(x), m.dp)])
  const gap = (m.xs[1] as number) - (m.xs[0] as number)
  if (d <= 3) {
    const x = round((shownXs[shownXs.length - 1] as number) + gap * (d === 2 ? 1 : 2), 4)
    const ans = round(m.f(x), 4)
    return num({
      prompt: `${e.who} ${e.method}. If the pattern continues, what would the ${e.y[0]} be at ${fmt(x)} ${e.x[1]}?`,
      figure: table([xHead(e), yHead(e)], rows),
      answer: ans,
      suffix: e.y[1],
      hint: 'Find how much the result goes up between rows, then keep going.',
      explanation: `The pattern is that ${m.rule}. Continuing it, at ${fmt(x)} ${e.x[1]} the ${e.y[0]} is ${show(ans, m.dp)} ${e.y[1]}.`,
    })
  }
  if (d === 4) {
    const k = rng.int(0, 3)
    const x = round(((shownXs[k] as number) + (shownXs[k + 1] as number)) / 2, 4)
    const ans = round(m.f(x), 4)
    return num({
      prompt: `${e.who} ${e.method}. Use the pattern to predict the ${e.y[0]} at ${fmt(x)} ${e.x[1]} (halfway between two readings).`,
      figure: table([xHead(e), yHead(e)], rows),
      answer: ans,
      suffix: e.y[1],
      hint: 'The pattern goes up by the same amount each step, so halfway between two x values the result is halfway between the two results.',
      explanation: `Halfway between ${show(m.f(shownXs[k] as number), m.dp)} and ${show(m.f(shownXs[k + 1] as number), m.dp)} is ${fmt(ans)} ${e.y[1]}.`,
    })
  }
  // Level 5: work backwards from a result to the x value.
  const x = round((shownXs[shownXs.length - 1] as number) + gap * rng.int(2, 4), 4)
  const y = round(m.f(x), 4)
  return num({
    prompt: `${e.who} ${e.method}. If the pattern continues, at what ${e.x[0]} would the ${e.y[0]} be ${show(y, m.dp)} ${e.y[1]}?`,
    figure: table([xHead(e), yHead(e)], rows),
    answer: x,
    suffix: e.x[1],
    hint: 'Keep extending the table, or work out how many more steps are needed to reach that result.',
    explanation: `The pattern is that ${m.rule}. Extending the table, the ${e.y[0]} reaches ${show(y, m.dp)} ${e.y[1]} at ${fmt(x)} ${e.x[1]}.`,
  })
})

const trend = G('phys.ws.graphs.trend', 'phys.ws.graphs', [3, 5], (rng) => {
  const e = rng.pick(EXPERIMENTS)
  const m = e.make(rng)
  const pts = m.xs.map((x) => [x, round(m.f(x), 4)] as [number, number])
  const X = e.x[0]
  const Y = e.y[0]
  const prop = `The ${Y} is directly proportional to the ${X}`
  const notProp = `As the ${X} increases the ${Y} increases steadily, but they are not directly proportional`
  return choice({
    rng,
    prompt: `${e.who} ${e.method} and plots a graph of the results. Which statement best describes the relationship? (Think about where a line through the points would cross the ${Y} axis.)`,
    figure: { type: 'scatter', points: pts, xLabel: `${X} (${e.x[1]})`, yLabel: `${Y} (${e.y[1]})` },
    correct: e.proportional ? prop : notProp,
    wrong: [
      e.proportional
        ? { label: notProp, misconception: 'missed-proportional', feedback: `The points lie on a straight line that would pass through the origin (0, 0), so they are directly proportional.` }
        : { label: prop, misconception: 'linear-is-proportional', feedback: `A straight line is not enough: for direct proportion the line must also pass through the origin. Here the ${Y} is not zero when the ${X} is zero.` },
      { label: `As the ${X} increases the ${Y} decreases`, misconception: 'misread-trend', feedback: 'Look again: the points go up from left to right.' },
      `There is no relationship between the ${X} and the ${Y}`,
    ],
    hint: 'Directly proportional means a straight line that goes through the origin: double one and the other doubles.',
    explanation: e.proportional
      ? `The points make a straight line which would go through (0, 0): doubling the ${X} doubles the ${Y}. That is direct proportion.`
      : `The points make a straight line, but it does not go through the origin: when the ${X} is 0, the ${Y} is ${fmt(m.f(0))} ${e.y[1]}, not 0. Doubling the ${X} does not double the ${Y}, so they are not directly proportional.`,
  })
})

interface Repeats {
  what: string
  unit: string
  dp: number
  base: number[]
  spread: number
}

const REPEATS: Repeats[] = [
  { what: 'the time for a toy car to roll down a ramp', unit: 's', dp: 1, base: [1.8, 2.1, 2.4, 2.6, 3.2], spread: 0.1 },
  { what: 'the time for 10 swings of a pendulum', unit: 's', dp: 1, base: [9.8, 12.4, 14.2, 15.6, 18.0], spread: 0.1 },
  { what: 'the distance a trolley rolls along the floor', unit: 'cm', dp: 0, base: [64, 85, 120, 146, 172], spread: 1 },
  { what: 'the time for a paper cone to fall to the floor', unit: 's', dp: 1, base: [1.2, 1.5, 1.7, 2.3], spread: 0.1 },
  { what: 'the current through a lamp', unit: 'A', dp: 2, base: [0.24, 0.31, 0.45, 0.52], spread: 0.01 },
]

const meanCalc = G('phys.ws.graphs.mean', 'phys.ws.graphs', [2, 5], (rng, d) => {
  const r = rng.pick(REPEATS)
  const mean = rng.pick(r.base)
  const s = r.spread
  const devs = rng.pick([
    [-1, 0, 1],
    [-2, 1, 1],
    [2, -1, -1],
    [-1, -1, 2],
    [0, 0, 0],
    [1, 1, -2],
  ])
  const reads = rng.shuffle(devs.map((k) => round(mean + k * s, 4)))
  if (d <= 2) {
    return num({
      prompt: `A group measures ${r.what} three times: ${reads.map((x) => `${fix(x, r.dp)} ${r.unit}`).join(', ')}. Calculate the mean.`,
      answer: mean,
      suffix: r.unit,
      tolerance: s / 4,
      hint: 'Add the three readings, then divide by 3.',
      explanation: `Mean = (${reads.map((x) => fix(x, r.dp)).join(' + ')}) ÷ 3 = ${fix(round(mean * 3, 4), r.dp)} ÷ 3 = ${fix(mean, r.dp)} ${r.unit}.`,
      errors: [err(round(mean * 3, 4), 'forgot-to-divide', 'That is the total. Now divide by how many readings there are.')],
    })
  }
  if (d === 3) {
    const range = round(Math.max(...reads) - Math.min(...reads), 4)
    if (range > 0) {
      return num({
        prompt: `A group measures ${r.what} three times: ${reads.map((x) => `${fix(x, r.dp)} ${r.unit}`).join(', ')}. What is the range of the readings (the difference between the largest and smallest)?`,
        answer: range,
        suffix: r.unit,
        tolerance: s / 4,
        hint: 'Largest reading minus smallest reading.',
        explanation: `Range = ${fix(Math.max(...reads), r.dp)} − ${fix(Math.min(...reads), r.dp)} = ${fix(range, r.dp)} ${r.unit}. A small range means the repeats agree well.`,
      })
    }
  }
  // Levels 4-5 (and level 3 when all readings agree): one reading is anomalous and must be left out.
  const off = s * rng.pick([8, 10, 12, 15])
  const bad = round(mean - off > mean * 0.4 && rng.chance(0.5) ? mean - off : mean + off, 4)
  const four = rng.shuffle([...reads, bad])
  const allMean = round((reads.reduce((a, b) => a + b, 0) + bad) / 4, 6)
  return num({
    prompt: `A group measures ${r.what} four times: ${four.map((x) => `${fix(x, r.dp)} ${r.unit}`).join(', ')}. One reading is anomalous. Calculate the mean of the other three.`,
    answer: mean,
    suffix: r.unit,
    tolerance: s / 4,
    hint: 'Find the reading that is far from the others, leave it out, then average the rest.',
    explanation: `${fix(bad, r.dp)} ${r.unit} is far from the other readings, so it is left out. Mean = (${reads.map((x) => fix(x, r.dp)).join(' + ')}) ÷ 3 = ${fix(mean, r.dp)} ${r.unit}.`,
    errors: [err(allMean, 'included-anomaly', 'You included the anomalous reading. Leave it out and average the other three.')],
  })
})

const graphsBank: Bank = {
  skill: 'phys.ws.graphs',
  mcqs: [
    ...(
      [
        ['how far a toy car rolls on different floor surfaces (carpet, wood, tiles, lino)', false],
        ['how the extension of a spring changes as the load increases', true],
        ['which of four brands of battery lights a bulb for longest', false],
        ['how the temperature of a cup of tea changes over 20 minutes', true],
        ['how the current through a wire changes with the potential difference across it', true],
        ['how well five different materials block sound', false],
        ['how the time for a parachute to fall changes with the area of the parachute', true],
        ['how many paperclips each of four different magnets can pick up', false],
      ] as [string, boolean][]
    ).map(
      ([inv, line]): Mcq => ({
        q: `A class investigates ${inv}. What kind of graph should they draw?`,
        a: line ? 'A line graph' : 'A bar chart',
        wrong: line
          ? [{ label: 'A bar chart', misconception: 'bar-for-continuous', feedback: 'The independent variable here is measured on a continuous scale (it can take any value), so a line graph is right.' }, 'A pie chart']
          : [{ label: 'A line graph', misconception: 'line-for-categoric', feedback: 'The independent variable here is a set of categories with nothing in between, so the points should not be joined: use a bar chart.' }, 'A pie chart'],
        hint: 'Is the thing they change a set of separate categories, or a number that could take any value?',
        why: line
          ? 'The independent variable is continuous (it can take any value in a range), so plot a line graph.'
          : 'The independent variable is categoric (separate named groups), so draw a bar chart.',
        lv: [2, 4],
      }),
    ),
    {
      q: 'Why do scientists repeat measurements and calculate a mean?',
      a: 'To reduce the effect of random errors and spot anomalous results',
      wrong: [{ label: 'To make the experiment a fair test', misconception: 'repeats-fair-test', feedback: 'A fair test comes from controlling variables. Repeats make results more reliable.' }, 'To make the results bigger', 'Because the first result is always wrong'],
      hint: 'No single measurement is perfect.',
      why: 'Every reading has some random error. Repeating and averaging smooths this out, and repeats show up any anomalous reading.',
      lv: [2, 4],
    },
  ],
}

export const wsGenerators: ItemGenerator[] = [
  ...bankGenerators(unitsBank),
  convert,
  rearrange,
  calc,
  ...bankGenerators(eqBank),
  variables,
  anomaly,
  predict,
  trend,
  meanCalc,
  ...bankGenerators(graphsBank),
]
