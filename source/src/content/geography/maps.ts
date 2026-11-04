import type { ItemGenerator } from '@/engine/registry'
import type { Figure } from '@/engine/types'
import { choice } from '../kit'
import { bankGenerators, fmt, G, num, type Bank } from './factory'

// =====================================================================================================================
// Compass directions (foundation)
// =====================================================================================================================

const DIRS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'] as const
const VEC: [number, number][] = [
  [0, 1],
  [1, 1],
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, -1],
  [-1, 0],
  [-1, 1],
]
const dirAt = (i: number) => DIRS[((i % 8) + 8) % 8] as string

const compassGenerators: ItemGenerator[] = [
  G('maps.compass.direction', 'maps.compass', [1, 4], (rng, d) => {
    const i = rng.int(0, 7)
    const k = rng.int(1, 2)
    const ax = rng.int(2, 6)
    const ay = rng.int(2, 6)
    const [vx, vy] = VEC[i] as [number, number]
    const bx = ax + k * vx
    const by = ay + k * vy
    const figure: Figure = {
      type: 'coord-grid',
      xRange: [0, 8],
      yRange: [0, 8],
      points: [
        { x: ax, y: ay, label: 'A' },
        { x: bx, y: by, label: 'B' },
      ],
    }
    const correct = dirAt(i)
    const reverse = d >= 3 && rng.chance(0.5)
    // Asking "A from B" flips the answer.
    const ans = reverse ? dirAt(i + 4) : correct
    const from = reverse ? 'B' : 'A'
    const to = reverse ? 'A' : 'B'
    return choice({
      rng,
      prompt: `North is at the top of the map. In which direction is ${to} from ${from}?`,
      figure,
      correct: ans,
      wrong: [
        { label: dirAt(i + (reverse ? 0 : 4)), misconception: 'direction-reversed', feedback: `That is the direction of ${from} from ${to}. Start at ${from} and look towards ${to}.` },
        { label: dirAt(i + (reverse ? 5 : 1)), misconception: 'compass-neighbour', feedback: 'Close, but that is 45° round. Check whether the line is straight across, straight up, or diagonal.' },
        { label: dirAt(i + (reverse ? 3 : -1)), misconception: 'compass-neighbour', feedback: 'Close, but that is 45° round. Check whether the line is straight across, straight up, or diagonal.' },
      ],
      hint: `Put your finger on ${from}, then ask: to get to ${to}, do I go up (north), down (south), right (east) or left (west), or a mix of two?`,
      explanation: `Starting at ${from}, ${to} is ${ans}. A diagonal direction combines north or south with east or west, and north or south is always said first.`,
    })
  }),
  G('maps.compass.turn', 'maps.compass', [2, 5], (rng, d) => {
    const start = rng.int(0, 7)
    const steps = d <= 2 ? rng.pick([2, 4]) : d <= 3 ? rng.pick([1, 2, 4]) : rng.pick([1, 3, 5, 6])
    const clockwise = rng.chance(0.5)
    const ans = dirAt(start + (clockwise ? steps : -steps))
    const other = dirAt(start + (clockwise ? -steps : steps))
    const pool = DIRS.filter((x) => x !== ans && x !== other)
    const extra = rng.shuffle(pool).slice(0, 2)
    return choice({
      rng,
      prompt: `You are facing ${dirAt(start)}. You turn ${steps * 45}° ${clockwise ? 'clockwise' : 'anticlockwise'}. Which direction are you facing now?`,
      correct: ans,
      wrong: [{ label: other, misconception: 'turned-wrong-way', feedback: `That is where you would face after turning ${clockwise ? 'anticlockwise' : 'clockwise'}. Clockwise goes N, NE, E, SE...` }, ...extra],
      hint: 'Each step round the eight-point compass is 45°. Clockwise goes N, NE, E, SE, S, SW, W, NW.',
      explanation: `${steps * 45}° is ${steps} step${steps > 1 ? 's' : ''} of 45°. Going ${clockwise ? 'clockwise' : 'anticlockwise'} from ${dirAt(start)} lands on ${ans}.`,
    })
  }),
  G('maps.compass.opposite', 'maps.compass', [1, 3], (rng) => {
    const i = rng.int(0, 7)
    const ans = dirAt(i + 4)
    return choice({
      rng,
      prompt: `What is the opposite direction to ${dirAt(i)}?`,
      correct: ans,
      wrong: [
        { label: dirAt(i + 2), misconception: 'right-angle', feedback: 'That is only a quarter turn (90°) away. Opposite is a half turn (180°).' },
        { label: dirAt(i - 2), misconception: 'right-angle', feedback: 'That is only a quarter turn (90°) away. Opposite is a half turn (180°).' },
        dirAt(i + 3),
      ],
      hint: 'Opposite means a half turn: 180°, or four steps round the compass.',
      explanation: `${dirAt(i)} and ${ans} are opposite: half a turn apart.`,
    })
  }),
]

// =====================================================================================================================
// Grid references
// =====================================================================================================================

const FEATURES = ['a church', 'a farm', 'a campsite', 'a car park', 'a windmill', 'a youth hostel', 'a pub', 'a school', 'a viewpoint', 'a picnic site']
const LETTERS = ['A', 'B', 'C', 'D']

interface MapPoint {
  label: string
  feature: string
  e: number
  n: number
  x: number
  y: number
}

/** A 6 x 5 square map extract with eastings e0..e0+6 and northings n0..n0+5 (disjoint ranges so swaps show). */
function gridMap(rng: { int(a: number, b: number): number; shuffle<T>(a: readonly T[]): T[] }, count: number) {
  const e0 = rng.int(10, 40)
  const n0 = rng.int(50, 80)
  const feats = rng.shuffle(FEATURES)
  const used = new Set<string>()
  const pts: MapPoint[] = []
  for (let i = 0; i < count; i++) {
    let de = 0
    let dn = 0
    for (let t = 0; t < 30; t++) {
      de = rng.int(0, 5)
      dn = rng.int(0, 4)
      if (!used.has(`${de},${dn}`)) break
    }
    used.add(`${de},${dn}`)
    const x = e0 + de + rng.int(3, 7) / 10
    const y = n0 + dn + rng.int(3, 7) / 10
    pts.push({ label: LETTERS[i] as string, feature: feats[i] as string, e: e0 + de, n: n0 + dn, x, y })
  }
  const figure: Figure = {
    type: 'coord-grid',
    xRange: [e0, e0 + 6],
    yRange: [n0, n0 + 5],
    xStep: 1,
    yStep: 1,
    points: pts.map((p) => ({ x: p.x, y: p.y, label: p.label })),
  }
  return { e0, n0, pts, figure }
}

const ref4 = (e: number, n: number) => `${e}${n}`

const gridBank: Bank = {
  skill: 'maps.grid-4',
  mcqs: [
    {
      q: 'When giving a grid reference, which do you give first?',
      a: 'Eastings (the numbers along the bottom, going across)',
      wrong: [
        { label: 'Northings (the numbers up the side)', misconception: 'northings-first', feedback: 'Northings come second. Remember "along the corridor, then up the stairs".' },
        'Whichever number is smaller',
        'Whichever number is larger',
      ],
      hint: '"Along the corridor, then up the stairs."',
      why: 'Eastings first, then northings: go along the bottom of the map to the line on the left of the square, then up the side to the line below it.',
      lv: [1, 2],
    },
    {
      q: 'A four-figure grid reference names a grid square. Which corner of the square do its numbers come from?',
      a: 'The bottom-left (south-west) corner',
      wrong: [
        { label: 'The top-right (north-east) corner', misconception: 'wrong-corner', feedback: 'Use the lines to the left of and below the square: the bottom-left corner.' },
        'The centre of the square',
        'The top-left (north-west) corner',
      ],
      hint: 'Use the easting line to the left of the square and the northing line below it.',
      why: 'A grid square is named by the easting line on its left (west) edge and the northing line on its bottom (south) edge, which meet at its bottom-left corner.',
      lv: [2, 4],
    },
    {
      q: 'Which way do the numbers of eastings increase on an Ordnance Survey map?',
      a: 'From west to east (left to right)',
      wrong: [{ label: 'From east to west (right to left)', misconception: 'eastings-reversed', feedback: 'Eastings get bigger as you go east, which is to the right on a map with north at the top.' }, 'From south to north (bottom to top)', 'They do not change'],
      hint: 'The clue is in the name.',
      why: 'Eastings increase as you go east (to the right). Northings increase as you go north (up the map).',
      lv: [1, 3],
    },
  ],
}

const grid4Generators: ItemGenerator[] = [
  G('maps.grid4.give', 'maps.grid-4', [1, 4], (rng, d) => {
    const { pts, figure } = gridMap(rng, 3)
    const p = pts[0] as MapPoint
    const correct = ref4(p.e, p.n)
    const hint = 'Go along the bottom first to the line on the LEFT of the square (easting), then up the side to the line BELOW it (northing).'
    const explanation = `${p.label} is in the square whose bottom-left corner is easting ${p.e} and northing ${p.n}. Eastings first, then northings: ${correct}.`
    if (d <= 2) {
      return choice({
        rng,
        prompt: `The map extract shows ${p.feature} at ${p.label}. What is the four-figure grid reference of the square it is in?`,
        figure,
        correct,
        wrong: [
          { label: ref4(p.n, p.e), misconception: 'northings-first', feedback: 'That has the northing first. Eastings (along) come before northings (up).' },
          { label: ref4(p.e + 1, p.n), misconception: 'right-hand-line', feedback: 'You used the easting line to the right of the square. Use the line on its left.' },
          { label: ref4(p.e, p.n + 1), misconception: 'top-line', feedback: 'You used the northing line above the square. Use the line below it.' },
        ],
        hint,
        explanation,
      })
    }
    return num({
      prompt: `The map extract shows ${p.feature} at ${p.label}. Type the four-figure grid reference of the square it is in.`,
      figure,
      answer: Number(correct),
      display: correct,
      hint,
      explanation,
      errors: [
        { values: [Number(ref4(p.n, p.e))], tag: 'northings-first', message: 'You gave the northing first. Eastings (along the bottom) come first.' },
        { values: [Number(ref4(p.e + 1, p.n + 1))], tag: 'wrong-corner', message: 'You used the top-right corner. Use the lines to the left and below the square.' },
      ],
    })
  }),
  G('maps.grid4.find', 'maps.grid-4', [2, 5], (rng) => {
    const { pts, figure } = gridMap(rng, 4)
    const target = rng.pick(pts)
    return choice({
      rng,
      prompt: `Which point on the map is in grid square ${ref4(target.e, target.n)}?`,
      figure,
      correct: target.label,
      wrong: pts.filter((p) => p !== target).map((p) => ({ label: p.label, feedback: `${p.label} is in square ${ref4(p.e, p.n)}.` })),
      hint: `Find easting ${target.e} along the bottom and northing ${target.n} up the side. The square is to the right of and above where they cross.`,
      explanation: `Square ${ref4(target.e, target.n)} has easting ${target.e} on its left edge and northing ${target.n} on its bottom edge. Point ${target.label} is in it.`,
    })
  }),
  G('maps.grid4.neighbour', 'maps.grid-4', [3, 5], (rng, d) => {
    const e = rng.int(10, 45)
    const n = rng.int(50, 85)
    const moves: [string, number, number][] =
      d <= 3
        ? [
            ['east', 1, 0],
            ['north', 0, 1],
            ['west', -1, 0],
            ['south', 0, -1],
          ]
        : [
            ['north-east', 1, 1],
            ['south-west', -1, -1],
            ['north-west', -1, 1],
            ['south-east', 1, -1],
          ]
    const [dir, de, dn] = rng.pick(moves)
    const ans = ref4(e + de, n + dn)
    return num({
      prompt: `What is the four-figure grid reference of the square directly ${dir} of square ${ref4(e, n)}?`,
      answer: Number(ans),
      display: ans,
      hint: 'Moving east or west changes the first two digits (eastings). Moving north or south changes the last two (northings).',
      explanation: `Square ${ref4(e, n)} has easting ${e} and northing ${n}. Moving ${dir} makes the easting ${e + de} and the northing ${n + dn}: ${ans}.`,
      errors: [{ values: [Number(ref4(e + dn, n + de))], tag: 'axes-swapped', message: 'You changed the wrong pair of digits. East-west changes the eastings (first two digits); north-south changes the northings (last two).' }],
    })
  }),
]

const grid6Generators: ItemGenerator[] = [
  G('maps.grid6.zoom', 'maps.grid-6', [1, 4], (rng, d) => {
    const E = rng.int(10, 45)
    const N = rng.int(50, 85)
    let a = rng.int(1, 9)
    const b = rng.int(1, 9)
    if (a === b) a = a === 9 ? 8 : a + 1
    const figure: Figure = { type: 'coord-grid', xRange: [0, 10], yRange: [0, 10], xStep: 1, yStep: 1, points: [{ x: a, y: b, label: 'X' }] }
    const correct = `${E}${a}${N}${b}`
    const prompt = `The diagram shows grid square ${E}${N} enlarged and divided into tenths. Its left edge is easting ${E} and its bottom edge is northing ${N}. ${d <= 2 ? 'What is the six-figure grid reference of X?' : 'Type the six-figure grid reference of X.'}`
    const hint = 'Eastings first: the two-digit easting, then how many tenths across. Then the two-digit northing, then how many tenths up.'
    const explanation = `Easting ${E} plus ${a} tenths across gives ${E}${a}. Northing ${N} plus ${b} tenths up gives ${N}${b}. Six-figure reference: ${correct}.`
    if (d <= 2) {
      return choice({
        rng,
        prompt,
        figure,
        correct,
        wrong: [
          { label: `${N}${b}${E}${a}`, misconception: 'northings-first', feedback: 'That gives the northing first. Eastings always come first.' },
          { label: `${E}${b}${N}${a}`, misconception: 'tenths-swapped', feedback: 'The tenths are swapped: the first tenth digit is how far ACROSS, the second is how far UP.' },
          { label: `${E}${N}${a}${b}`, misconception: 'square-then-tenths', feedback: 'Each tenth digit goes straight after its own two-digit number: easting then tenths across, northing then tenths up.' },
        ],
        hint,
        explanation,
      })
    }
    return num({
      prompt: `${prompt} Use six digits with no spaces.`,
      figure,
      answer: Number(correct),
      display: correct,
      hint,
      explanation,
      errors: [
        { values: [Number(`${N}${b}${E}${a}`)], tag: 'northings-first', message: 'You gave the northing first. Eastings always come first.' },
        { values: [Number(`${E}${N}${a}${b}`)], tag: 'square-then-tenths', message: 'Put each tenth digit straight after its own two-digit number: easting + tenths across, then northing + tenths up.' },
        { values: [Number(`${E}${b}${N}${a}`)], tag: 'tenths-swapped', message: 'The tenths are swapped: the first is how far across, the second how far up.' },
      ],
    })
  }),
  G('maps.grid6.words', 'maps.grid-6', [3, 5], (rng) => {
    const E = rng.int(10, 45)
    const N = rng.int(50, 85)
    let a = rng.int(1, 9)
    const b = rng.int(1, 9)
    if (a === b) a = a === 1 ? 2 : a - 1
    const correct = `${E}${a}${N}${b}`
    return num({
      prompt: `A trig point is in grid square ${E}${N}. It is ${a} tenths of the way across the square from the west and ${b} tenths of the way up from the south. Type its six-figure grid reference (no spaces).`,
      answer: Number(correct),
      display: correct,
      hint: 'Split the square reference into easting and northing, then put the right tenths digit after each.',
      explanation: `Square ${E}${N} has easting ${E} and northing ${N}. Add ${a} tenths across to the easting (${E}${a}) and ${b} tenths up to the northing (${N}${b}): ${correct}.`,
      errors: [
        { values: [Number(`${E}${N}${a}${b}`)], tag: 'square-then-tenths', message: 'Put each tenth digit straight after its own two-digit number: easting + tenths across, then northing + tenths up.' },
        { values: [Number(`${E}${b}${N}${a}`)], tag: 'tenths-swapped', message: 'The tenths are swapped: the first is how far across, the second how far up.' },
      ],
    })
  }),
  G('maps.grid6.square', 'maps.grid-6', [2, 4], (rng) => {
    const E = rng.int(10, 45)
    const N = rng.int(50, 85)
    const a = rng.int(1, 9)
    const b = rng.int(1, 9)
    const six = `${E}${a}${N}${b}`
    const four = `${E}${N}`
    return num({
      prompt: `A bridge is at six-figure grid reference ${six}. Which four-figure grid square is it in?`,
      answer: Number(four),
      display: four,
      hint: 'A six-figure reference is three digits of easting then three digits of northing. The third and sixth digits are tenths.',
      explanation: `${six} splits into easting ${E}${a} and northing ${N}${b}. Drop the tenths (${a} and ${b}) to get the square: ${four}.`,
      errors: [{ values: [Number(six.slice(0, 4))], tag: 'first-four-digits', message: 'The first four digits mix up eastings and northings. Take digits 1-2 (easting) and 4-5 (northing).' }],
    })
  }),
]

// =====================================================================================================================
// Scale and distance
// =====================================================================================================================

const scaleBank: Bank = {
  skill: 'maps.scale',
  mcqs: [
    {
      q: 'What does a scale of 1:50 000 mean?',
      a: '1 cm on the map stands for 50 000 cm (500 m) on the ground',
      wrong: [
        { label: '1 cm on the map stands for 50 000 m on the ground', misconception: 'units-mixed', feedback: 'The units are the same on both sides of a ratio scale: 1 cm to 50 000 cm, which is 500 m.' },
        { label: '1 cm on the map stands for 50 km on the ground', misconception: 'units-mixed', feedback: '50 000 cm is 500 m, not 50 km.' },
        'The map covers an area of 50 000 square kilometres',
      ],
      hint: 'A ratio has the same units on both sides.',
      why: '1:50 000 means one unit on the map is 50 000 of the same units on the ground. 50 000 cm = 500 m, so 2 cm on the map is 1 km.',
      lv: [1, 3],
    },
    {
      q: 'Which map shows more detail: a 1:25 000 map or a 1:50 000 map?',
      a: 'The 1:25 000 map',
      wrong: [
        { label: 'The 1:50 000 map', misconception: 'bigger-number-more-detail', feedback: 'A bigger number means the ground is shrunk more. On a 1:25 000 map things are drawn twice as large.' },
        'They show exactly the same detail',
        'It depends only on the size of the paper',
      ],
      hint: 'Which one shrinks the real world less?',
      why: 'At 1:25 000 the real world is shrunk 25 000 times; at 1:50 000 it is shrunk 50 000 times. So a 1:25 000 map draws everything twice as big and can show more detail (like field boundaries).',
      lv: [2, 4],
    },
    {
      q: 'How could you measure the distance along a winding road on a map?',
      a: 'Lay a piece of string (or the edge of a sheet of paper) along the bends, then measure it against the scale line',
      wrong: [
        { label: 'Measure a straight line between the two ends with a ruler', misconception: 'as-the-crow-flies', feedback: 'That gives the straight-line distance, which is shorter than the road.' },
        'Count the grid squares the road passes through',
        'Multiply the number of bends by the scale',
      ],
      hint: 'The road is not straight, so a ruler alone will not follow it.',
      why: 'String or a paper edge can follow the bends. Mark the start and end, straighten it out, and measure it against the scale line.',
      lv: [3, 5],
    },
    {
      q: 'On Ordnance Survey maps, how wide is each grid square in real life?',
      a: '1 km',
      wrong: ['1 m', '100 m', '10 km'],
      hint: 'They are the squares used in grid references.',
      why: 'OS grid squares are 1 km by 1 km on the ground. On a 1:50 000 map they are 2 cm wide; on a 1:25 000 map they are 4 cm wide.',
      lv: [2, 4],
    },
  ],
}

const SCALES: { ratio: number; label: string; kmPerCm: number }[] = [
  { ratio: 50000, label: '1:50 000', kmPerCm: 0.5 },
  { ratio: 25000, label: '1:25 000', kmPerCm: 0.25 },
]

const r2 = (x: number) => Math.round(x * 1000) / 1000

const scaleGenerators: ItemGenerator[] = [
  G('maps.scale.distance', 'maps.scale', [2, 4], (rng, d) => {
    const s = d <= 2 ? (SCALES[0] as (typeof SCALES)[number]) : rng.pick(SCALES)
    const cm = d <= 2 ? rng.int(1, 8) * 2 : d === 3 ? rng.int(2, 15) : rng.int(5, 25) / 2 + 0.5 * rng.int(0, 1)
    const cmR = Math.round(cm * 2) / 2
    const km = r2(cmR * s.kmPerCm)
    return num({
      prompt: `On a ${s.label} map, two villages are ${cmR} cm apart. How far apart are they in real life, in kilometres?`,
      answer: km,
      suffix: 'km',
      tolerance: 0.001,
      hint: `On a ${s.label} map, 1 cm stands for ${s.ratio} cm = ${s.kmPerCm * 1000} m = ${s.kmPerCm} km.`,
      explanation: `${cmR} cm × ${s.ratio} = ${fmt(cmR * s.ratio)} cm on the ground. Divide by 100 000 to get km: ${km} km. (Shortcut: each cm is ${s.kmPerCm} km.)`,
      errors: [
        { values: [cmR * s.ratio], tag: 'no-unit-conversion', message: 'That is the distance in centimetres. Divide by 100 000 to get kilometres.' },
        { values: [r2((cmR * s.ratio) / 100)], tag: 'converted-to-metres', message: 'That is the distance in metres. Divide by 1000 to get kilometres.' },
        { values: [r2(cmR / s.kmPerCm)], tag: 'divided-scale', message: 'You divided instead of multiplying. Each map centimetre stands for a real distance, so multiply.' },
      ],
    })
  }),
  G('maps.scale.reverse', 'maps.scale', [3, 5], (rng) => {
    const s = rng.pick(SCALES)
    const km = s.ratio === 50000 ? rng.int(1, 9) * 0.5 : rng.int(1, 12) * 0.25
    const cm = r2(km / s.kmPerCm)
    return num({
      prompt: `A footpath is ${km} km long. How long will it be on a ${s.label} map, in centimetres?`,
      answer: cm,
      suffix: 'cm',
      tolerance: 0.001,
      hint: `On a ${s.label} map, 1 cm stands for ${s.kmPerCm} km. How many of those make ${km} km?`,
      explanation: `Each cm is ${s.kmPerCm} km, so ${km} ÷ ${s.kmPerCm} = ${cm} cm.`,
      errors: [{ values: [r2(km * s.kmPerCm)], tag: 'multiplied-not-divided', message: 'Going from the real world to the map makes things smaller: divide by the km per cm.' }],
    })
  }),
  G('maps.scale.walk', 'maps.scale', [4, 5], (rng) => {
    const s = rng.pick(SCALES)
    const speed = rng.pick([4, 5])
    // Pick a real distance that gives whole minutes.
    const km = speed === 4 ? rng.pick([1, 2, 3, 4, 5, 6]) : rng.pick([1, 2, 2.5, 3, 4, 5])
    const cm = r2(km / s.kmPerCm)
    const mins = (km / speed) * 60
    return num({
      prompt: `On a ${s.label} map a walk measures ${cm} cm. Walking at ${speed} km per hour, how many minutes will it take?`,
      answer: mins,
      suffix: 'minutes',
      hint: 'First turn the map distance into km. Then time = distance ÷ speed (in hours), and multiply by 60 for minutes.',
      explanation: `${cm} cm × ${s.kmPerCm} km = ${km} km. ${km} ÷ ${speed} = ${r2(km / speed)} hours = ${mins} minutes.`,
      errors: [{ values: [r2(km / speed)], tag: 'hours-not-minutes', message: 'That is the time in hours. Multiply by 60 for minutes.' }],
    })
  }),
]

// =====================================================================================================================
// OS map symbols
// =====================================================================================================================

const symbolsBank: Bank = {
  skill: 'maps.symbols',
  noun: 'map feature',
  meaningPrompt: (t) => `How is this shown on an Ordnance Survey map: ${t.charAt(0).toLowerCase() + t.slice(1)}?`,
  matchPrompt: 'Match each map feature to how it is shown on an Ordnance Survey map.',
  terms: [
    { term: 'Campsite', def: 'A small tent symbol' },
    { term: 'Caravan site', def: 'A small caravan symbol' },
    { term: 'Picnic site', def: 'A small picnic table symbol' },
    { term: 'Viewpoint', def: 'A half-circle with lines spreading out like rays' },
    { term: 'Place of worship with a tower', def: 'A black square with a cross on top' },
    { term: 'Place of worship with a spire, minaret or dome', def: 'A black circle with a cross on top' },
    { term: 'Spot height', def: 'A black dot with a number beside it, giving the height in metres' },
    { term: 'Triangulation pillar (trig point)', def: 'A small triangle with a dot in the middle' },
    { term: 'Public house', def: 'The letters PH' },
    { term: 'Contour line', def: 'A thin orange-brown line joining places of the same height' },
    { term: 'Coniferous woodland', def: 'Green shading with small pointed tree symbols' },
    { term: 'Motorway', def: 'A thick blue road line' },
    { term: 'Parking', def: 'A letter P, usually in blue' },
  ],
  mcqs: [
    {
      q: 'Why do Ordnance Survey maps use symbols?',
      a: 'To show a lot of information clearly in a small space',
      wrong: ['To make the map look more colourful', { label: 'Because the features are too small to measure', misconception: 'symbols-size', feedback: 'Symbols are not to scale; they are a code that saves space and is easy to read.' }, 'So that only experts can read the map'],
      hint: 'Imagine writing "church with a tower" every time one appears.',
      why: 'Symbols are a quick code: they save space and keep a busy map readable. The key explains what each means.',
      lv: [1, 2],
    },
    {
      q: 'Where on an OS map do you find out what each symbol means?',
      a: 'In the key (legend)',
      wrong: ['In the grid references', 'On the scale line', 'In the compass rose'],
      hint: 'It "unlocks" the map.',
      why: 'The key, or legend, lists every symbol with its meaning.',
      lv: [1, 2],
    },
    {
      q: 'What colour are rivers, lakes and the sea on an OS map?',
      a: 'Blue',
      wrong: ['Green', 'Orange-brown', 'Black'],
      hint: 'The same colour you would use for water in a drawing.',
      why: 'Water features are blue. Woodland is green, contour lines are orange-brown and buildings are black or grey.',
      lv: [1, 2],
    },
    {
      q: 'What is the difference between the symbols for coniferous and non-coniferous (deciduous) woodland?',
      a: 'Coniferous trees are drawn as pointed shapes; non-coniferous trees are drawn as rounded shapes',
      wrong: [
        { label: 'Coniferous woodland is blue; non-coniferous is green', misconception: 'woodland-colour', feedback: 'Both kinds of woodland are green. The shape of the little trees tells you which kind.' },
        'They use exactly the same symbol',
        'Coniferous woodland is shown with the letters CW',
      ],
      hint: 'Think of the shape of a pine tree compared with an oak.',
      why: 'Conifers such as pines have a pointed shape, so they are drawn as pointed trees. Broadleaved trees are drawn with rounded tops.',
      lv: [3, 5],
    },
  ],
}

// =====================================================================================================================
// Contours and relief
// =====================================================================================================================

const reliefBank: Bank = {
  skill: 'maps.relief',
  noun: 'term',
  terms: [
    { term: 'Contour line', def: 'A line on a map joining places that are the same height above sea level' },
    { term: 'Contour interval', def: 'The difference in height between one contour line and the next' },
    { term: 'Spot height', def: 'A dot on a map with the exact height of that point written beside it' },
    { term: 'Relief', def: 'The shape and height of the land' },
    { term: 'Gradient', def: 'How steep a slope is' },
    { term: 'Spur', def: 'A ridge of high land sticking out from a hill into lower land' },
  ],
  mcqs: [
    {
      q: 'What do contour lines that are very close together show?',
      a: 'A steep slope',
      wrong: [{ label: 'A gentle slope', misconception: 'contours-reversed', feedback: 'Far-apart contours show a gentle slope. Close together means the height changes quickly: steep.' }, 'Flat land', 'A river'],
      hint: 'If you climb lots of contour lines in a short distance, how fast are you going up?',
      why: 'Each contour is a step up in height. When they are close together, you go up a lot over a short distance, so the slope is steep.',
      lv: [1, 3],
    },
    {
      q: 'An area of a map has no contour lines at all over a large area. What is the land most likely to be like?',
      a: 'Flat or almost flat',
      wrong: [{ label: 'Very steep', misconception: 'no-contours-steep', feedback: 'Steep land has many contour lines close together.' }, 'The top of a mountain', 'A cliff'],
      hint: 'Contours show changes in height.',
      why: 'If there are no contours, the height is not changing much, so the land is flat, like a floodplain.',
      lv: [2, 3],
    },
    {
      q: 'On a map, contour lines form V-shapes where they cross a stream in a valley. Which way do the Vs point?',
      a: 'Uphill (upstream)',
      wrong: [{ label: 'Downhill (downstream)', misconception: 'v-downstream', feedback: 'Vs pointing downhill show a spur (a ridge). In a valley the Vs point upstream, towards higher ground.' }, 'Always north', 'Towards the sea in every case, whatever the slope'],
      hint: 'A valley cuts back into higher ground.',
      why: 'A valley is a dip in the land, so each contour bends back uphill to cross it. The Vs point upstream. On a spur they point downhill.',
      lv: [4, 5],
    },
    {
      q: 'A map shows a hill with contours that are far apart at the bottom and close together near the top. What shape is the slope?',
      a: 'Gentle at the bottom and steep near the top (concave)',
      wrong: [{ label: 'Steep at the bottom and gentle near the top', misconception: 'contours-reversed', feedback: 'Close contours mean steep. They are close near the top, so the top part is steep.' }, 'The same steepness all the way up', 'Flat at the top'],
      hint: 'Close together = steep; far apart = gentle.',
      why: 'The slope starts gently where contours are spread out and gets steeper where they bunch together near the top. This is a concave slope.',
      lv: [4, 5],
    },
  ],
}

const reliefGenerators: ItemGenerator[] = [
  G('maps.relief.height', 'maps.relief', [2, 4], (rng, d) => {
    const ci = rng.pick([5, 10, 10, 20])
    const base = ci * rng.int(2, 12)
    const k = rng.int(2, d >= 4 ? 9 : 6)
    const ans = base + k * ci
    return num({
      prompt: `On a map the contour interval is ${ci} m. A path starts on the ${base} m contour and climbs, crossing ${k} more contour lines. What height does it reach?`,
      answer: ans,
      suffix: 'm',
      hint: `Each contour line crossed going uphill adds ${ci} m.`,
      explanation: `${k} contour lines × ${ci} m = ${k * ci} m higher. ${base} + ${k * ci} = ${ans} m.`,
      errors: [{ values: [base + k], tag: 'added-count', message: `Each contour line is ${ci} m higher, not 1 m. Multiply the number of lines by the interval.` }],
    })
  }),
  G('maps.relief.gradient', 'maps.relief', [4, 5], (rng, d) => {
    const ratio = rng.pick([5, 8, 10, 20, 25])
    const rise = rng.pick([20, 40, 50, 100])
    const run = rise * ratio
    if (d >= 5) {
      const s = rng.pick(SCALES)
      const cmOnMap = r2(run / 1000 / s.kmPerCm)
      if (Number.isInteger(cmOnMap * 2)) {
        return num({
          prompt: `On a ${s.label} map, a path between two points is ${cmOnMap} cm long. The points are ${rise} m apart in height. What is the average gradient as "1 in ?"`,
          answer: ratio,
          prefix: '1 in',
          hint: `First turn the map distance into metres (1 cm = ${s.kmPerCm * 1000} m). Then divide the horizontal distance by the height difference.`,
          explanation: `${cmOnMap} cm × ${s.kmPerCm * 1000} m = ${run} m. Gradient = ${run} ÷ ${rise} = ${ratio}, so 1 in ${ratio}: it rises 1 m for every ${ratio} m along.`,
          errors: [{ values: [r2(rise / run)], tag: 'divided-wrong-way', message: 'Divide the horizontal distance by the rise, so you get "1 in a number bigger than 1".' }],
        })
      }
    }
    return num({
      prompt: `A road rises ${rise} m over a horizontal distance of ${fmt(run)} m. What is its average gradient as "1 in ?"`,
      answer: ratio,
      prefix: '1 in',
      hint: 'Gradient "1 in x" means it rises 1 m for every x m along. Divide the distance along by the rise.',
      explanation: `${fmt(run)} ÷ ${rise} = ${ratio}. The road rises 1 m for every ${ratio} m along: a gradient of 1 in ${ratio}.`,
      errors: [{ values: [r2(rise / run)], tag: 'divided-wrong-way', message: 'Divide the horizontal distance by the rise, so you get "1 in a number bigger than 1".' }],
    })
  }),
]

// =====================================================================================================================
// Graphs and data presentation
// =====================================================================================================================

const graphsBank: Bank = {
  skill: 'maps.graphs',
  links: [
    {
      prompt: 'Match each set of data to the best way of presenting it.',
      pairs: [
        ['How river discharge changes hour by hour during a storm', 'Line graph'],
        ['The percentage of a country\'s electricity from each energy source', 'Pie chart'],
        ['Whether house prices fall as distance from the city centre increases', 'Scatter graph'],
        ['Population density of each region, shaded darker for higher values', 'Choropleth map'],
        ['Numbers of people migrating between countries, with arrows of different widths', 'Flow line map'],
        ['Monthly temperature and rainfall for one place', 'Climate graph'],
      ],
      hint: 'Change over time suits a line; parts of a whole suit a pie; a relationship between two sets of numbers suits a scatter graph.',
      ask: (l) => `Which would be the best way to present this data?\n${l}`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'A choropleth map shows data by...',
      a: 'Shading areas in darker or lighter colours depending on their value',
      wrong: [
        { label: 'Drawing arrows of different widths between places', misconception: 'flow-line', feedback: 'That is a flow line map.' },
        { label: 'Drawing symbols sized to the value at each place', misconception: 'proportional-symbols', feedback: 'That is a proportional symbol map.' },
        'Joining places with the same height',
      ],
      hint: 'Think of a map where the counties are coloured darker where more people live.',
      why: 'A choropleth map shades areas: usually darker shades mean higher values. It is good for data like population density.',
      lv: [2, 4],
    },
    {
      q: 'On a scatter graph, the points go up from left to right in a rough line. What does this show?',
      a: 'A positive correlation: as one value increases, so does the other',
      wrong: [
        { label: 'A negative correlation', misconception: 'correlation-reversed', feedback: 'Negative correlation slopes downwards: as one value goes up, the other goes down.' },
        'No correlation',
        { label: 'That one value causes the other', misconception: 'correlation-causation', feedback: 'A pattern on a scatter graph shows a link, but it does not prove that one thing causes the other.' },
      ],
      hint: 'Up from left to right means both get bigger together.',
      why: 'Points rising from left to right show positive correlation. It suggests a link but does not on its own prove cause and effect.',
      lv: [3, 5],
    },
    {
      q: 'Why should a line graph NOT be used to show the number of shops of each type on a high street?',
      a: 'The categories are separate, so there is nothing "in between" them for a line to show',
      wrong: ['Line graphs can only show temperatures', 'Shops cannot be counted', 'Line graphs must always go upwards'],
      hint: 'What would a point halfway between "cafés" and "banks" mean?',
      why: 'Line graphs are for continuous data, usually change over time. Separate categories like types of shop are best shown with a bar chart.',
      lv: [3, 5],
    },
  ],
}

const SITES = ['Beach', 'Castle', 'Museum', 'Park', 'Pier', 'Zoo']

const graphsGenerators: ItemGenerator[] = [
  G('maps.graphs.read-bar', 'maps.graphs', [1, 4], (rng, d) => {
    const n = 5
    const names = rng.shuffle(SITES).slice(0, n)
    const values = rng.shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, n).map((v) => v * 10)
    const bars = names.map((label, i) => ({ label, value: values[i] as number }))
    const figure: Figure = { type: 'bar-chart', bars, yLabel: 'Visitors (thousands)', showValues: d <= 2 }
    const max = bars.reduce((a, b) => (b.value > a.value ? b : a))
    if (d <= 2) {
      const min = bars.reduce((a, b) => (b.value < a.value ? b : a))
      return choice({
        rng,
        prompt: 'The bar chart shows visitors to attractions in a seaside town last summer. Which attraction had the most visitors?',
        figure,
        correct: max.label,
        wrong: bars.filter((b) => b !== max).map((b) => ({ label: b.label, misconception: b === min ? 'read-smallest' : undefined, feedback: `${b.label} had ${b.value} thousand visitors.` })),
        hint: 'Look for the tallest bar.',
        explanation: `${max.label} has the tallest bar, with ${max.value} thousand visitors.`,
      })
    }
    const [a, b] = rng.shuffle(bars).slice(0, 2) as [(typeof bars)[number], (typeof bars)[number]]
    const hi = a.value >= b.value ? a : b
    const lo = hi === a ? b : a
    if (d === 3) {
      return num({
        prompt: `The bar chart shows visitors to attractions in a seaside town last summer. How many more visitors (in thousands) did the ${hi.label.toLowerCase()} have than the ${lo.label.toLowerCase()}?`,
        figure,
        answer: hi.value - lo.value,
        suffix: 'thousand',
        hint: 'Read the height of each bar against the scale on the side, then subtract.',
        explanation: `${hi.label}: ${hi.value} thousand. ${lo.label}: ${lo.value} thousand. ${hi.value} − ${lo.value} = ${hi.value - lo.value} thousand more.`,
      })
    }
    const total = bars.reduce((s, x) => s + x.value, 0)
    return num({
      prompt: 'The bar chart shows visitors to attractions in a seaside town last summer. What was the total number of visitors to all five attractions, in thousands?',
      figure,
      answer: total,
      suffix: 'thousand',
      hint: 'Read every bar carefully against the scale, then add them up.',
      explanation: `${bars.map((x) => x.value).join(' + ')} = ${total} thousand visitors.`,
    })
  }),
]

// =====================================================================================================================
// Climate graphs
// =====================================================================================================================

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

type ClimateKind = 'uk' | 'rainforest' | 'desert' | 'tundra' | 'savanna'
const CLIMATE_NAME: Record<ClimateKind, string> = {
  uk: 'Temperate maritime (like the UK)',
  rainforest: 'Tropical rainforest',
  desert: 'Hot desert',
  tundra: 'Tundra',
  savanna: 'Tropical savanna',
}

interface Climate {
  kind: ClimateKind
  temps: number[]
  rain: number[]
  south: boolean
}

function makeClimate(rng: { int(a: number, b: number): number; chance(p: number): boolean }, kind: ClimateKind, south: boolean): Climate {
  // Peak month index (0 = Jan) for the warm season.
  const peak = south ? 0 : 6
  const shape = (mean: number, amp: number) => MONTHS.map((_, m) => Math.round(mean + amp * Math.cos(((m - peak) * Math.PI) / 6)))
  let temps: number[]
  let rain: number[]
  switch (kind) {
    case 'uk':
      temps = shape(rng.int(9, 11), rng.int(5, 7))
      rain = MONTHS.map(() => rng.int(45, 95))
      break
    case 'rainforest':
      temps = shape(27, 1)
      rain = MONTHS.map(() => rng.int(160, 320))
      break
    case 'desert':
      temps = shape(rng.int(24, 27), rng.int(7, 9))
      rain = MONTHS.map(() => rng.int(0, 8))
      break
    case 'tundra':
      temps = shape(rng.int(-13, -9), rng.int(15, 18))
      rain = MONTHS.map((_, m) => rng.int(8, 20) + (Math.abs(m - peak) <= 2 ? rng.int(10, 25) : 0))
      break
    case 'savanna':
      temps = shape(rng.int(25, 27), 3)
      rain = MONTHS.map((_, m) => (Math.min(Math.abs(m - peak), 12 - Math.abs(m - peak)) <= 2 ? rng.int(130, 250) : rng.int(0, 20)))
      break
  }
  return { kind, temps, rain, south }
}

const climateTable = (c: Climate): Figure => ({
  type: 'table',
  head: ['', ...MONTHS],
  rows: [
    ['Temp (°C)', ...c.temps.map(String)],
    ['Rain (mm)', ...c.rain.map(String)],
  ],
})

/** Make one month clearly the wettest. */
function withWettest(rng: { int(a: number, b: number): number }, c: Climate): { c: Climate; wet: number } {
  const wet = rng.int(0, 11)
  const rain = [...c.rain]
  rain[wet] = Math.max(...rain) + rng.int(8, 30)
  return { c: { ...c, rain }, wet }
}

const climateGenerators: ItemGenerator[] = [
  G('maps.climate.wettest', 'maps.climate-graphs', [1, 2], (rng) => {
    const kind = rng.pick<ClimateKind>(['uk', 'rainforest', 'savanna'])
    const { c, wet } = withWettest(rng, makeClimate(rng, kind, rng.chance(0.3)))
    const sorted = [...c.rain.keys()].sort((a, b) => (c.rain[b] as number) - (c.rain[a] as number))
    const wrong = rng.shuffle(sorted.slice(1, 6)).slice(0, 3)
    return choice({
      rng,
      prompt: 'The table shows climate data for a place. Which month is the wettest?',
      figure: climateTable(c),
      correct: MONTH_NAMES[wet] as string,
      wrong: wrong.map((m) => ({ label: MONTH_NAMES[m] as string, feedback: `${MONTH_NAMES[m]} had ${c.rain[m]} mm.` })),
      hint: 'Look along the rainfall row for the biggest number.',
      explanation: `${MONTH_NAMES[wet]} has the most rain: ${c.rain[wet]} mm. On a climate graph this is the tallest bar.`,
    })
  }),
  G('maps.climate.range', 'maps.climate-graphs', [2, 4], (rng, d) => {
    const kind = rng.pick<ClimateKind>(d >= 4 ? ['tundra', 'desert', 'uk'] : ['uk', 'desert', 'savanna'])
    const c = makeClimate(rng, kind, rng.chance(0.3))
    const max = Math.max(...c.temps)
    const min = Math.min(...c.temps)
    return num({
      prompt: 'The table shows climate data for a place. What is the annual temperature range?',
      figure: climateTable(c),
      answer: max - min,
      suffix: '°C',
      hint: 'Range = highest monthly temperature − lowest monthly temperature.',
      explanation: `Highest ${max}°C, lowest ${min}°C. Range = ${max} − (${min}) = ${max - min}°C.${min < 0 ? ' Subtracting a negative number is the same as adding.' : ''}`,
      errors: [
        { values: [max + min], tag: 'added-max-min', message: 'The range is the difference: subtract the lowest from the highest.' },
        ...(min < 0 ? [{ values: [max - Math.abs(min)], tag: 'negative-subtraction', message: 'The lowest is below zero, so the gap is bigger: highest − (negative) = highest + that number.' }] : []),
      ],
    })
  }),
  G('maps.climate.total', 'maps.climate-graphs', [3, 4], (rng) => {
    const kind = rng.pick<ClimateKind>(['desert', 'tundra', 'uk'])
    const c = makeClimate(rng, kind, false)
    const total = c.rain.reduce((a, b) => a + b, 0)
    return num({
      prompt: 'The table shows climate data for a place. What is the total annual rainfall?',
      figure: climateTable(c),
      answer: total,
      suffix: 'mm',
      hint: 'Add up all twelve rainfall values. Add them in groups to keep track.',
      explanation: `${c.rain.join(' + ')} = ${total} mm.`,
    })
  }),
  G('maps.climate.biome', 'maps.climate-graphs', [3, 5], (rng) => {
    const kind = rng.pick<ClimateKind>(['uk', 'rainforest', 'desert', 'tundra', 'savanna'])
    const c = makeClimate(rng, kind, rng.chance(0.3))
    const clue: Record<ClimateKind, string> = {
      uk: 'mild temperatures all year (never very hot or very cold) and rain spread through every month',
      rainforest: 'hot all year (about 26-28°C) with heavy rain every month',
      desert: 'very little rain in any month and hot summers',
      tundra: 'temperatures below freezing for most of the year and little precipitation',
      savanna: 'hot all year with a clear wet season and a long dry season',
    }
    return choice({
      rng,
      prompt: 'The table shows climate data for a place. Which climate does it most likely show?',
      figure: climateTable(c),
      correct: CLIMATE_NAME[kind],
      wrong: (Object.keys(CLIMATE_NAME) as ClimateKind[])
        .filter((k) => k !== kind)
        .map((k) => ({ label: CLIMATE_NAME[k], feedback: `A ${CLIMATE_NAME[k].toLowerCase()} climate has ${clue[k]}.` })),
      hint: 'Check two things: how hot or cold it is through the year, and how much rain falls and when.',
      explanation: `The data show ${clue[kind]}, which matches a ${CLIMATE_NAME[kind].toLowerCase()} climate.`,
    })
  }),
  G('maps.climate.hemisphere', 'maps.climate-graphs', [4, 5], (rng) => {
    const kind: ClimateKind = 'uk'
    const south = rng.chance(0.5)
    const c = makeClimate(rng, kind, south)
    return choice({
      rng,
      prompt: 'The table shows climate data for a place outside the tropics. Which hemisphere is it in?',
      figure: climateTable(c),
      correct: south ? 'Southern hemisphere' : 'Northern hemisphere',
      wrong: [
        { label: south ? 'Northern hemisphere' : 'Southern hemisphere', misconception: 'hemisphere-seasons', feedback: south ? 'The warmest months are December to February, which is summer in the southern hemisphere.' : 'The warmest months are June to August, which is summer in the northern hemisphere.' },
        'It is impossible to tell from climate data',
      ],
      keepOrder: true,
      hint: 'Find the warmest months. When is summer in the UK?',
      explanation: south
        ? 'The warmest months are around December to February. Summer at that time of year means the southern hemisphere.'
        : 'The warmest months are around June to August, the same as the UK, so it is in the northern hemisphere.',
    })
  }),
]

const climateBank: Bank = {
  skill: 'maps.climate-graphs',
  mcqs: [
    {
      q: 'On a climate graph, how are temperature and rainfall usually shown?',
      a: 'Temperature as a red line; rainfall as blue bars',
      wrong: [{ label: 'Temperature as blue bars; rainfall as a red line', misconception: 'climate-graph-swapped', feedback: 'It is the other way round: rainfall is a total for the month, shown as bars; temperature is an average that changes smoothly, shown as a line.' }, 'Both as pie charts', 'Both as lines on the same scale'],
      hint: 'Which one is a monthly total that you could pour into a measuring cylinder?',
      why: 'Rainfall is a monthly total, so it is drawn as bars (usually blue). Temperature is a monthly average, drawn as a line (usually red), with its own scale on the other side.',
      lv: [1, 3],
    },
    {
      q: 'Why does a climate graph need two different vertical axes?',
      a: 'Temperature (°C) and rainfall (mm) are measured in different units',
      wrong: ['To make the graph look balanced', 'Because one is for the northern hemisphere and one for the southern', 'Because rainfall is always bigger than temperature'],
      hint: 'Look at the units.',
      why: 'One axis shows temperature in °C and the other shows rainfall in mm. They are different measurements, so each needs its own scale.',
      lv: [2, 4],
    },
  ],
}

// =====================================================================================================================
// Fieldwork
// =====================================================================================================================

const fieldworkBank: Bank = {
  skill: 'maps.fieldwork',
  noun: 'term',
  terms: [
    { term: 'Primary data', def: 'Information you collect yourself, for example by measuring or counting' },
    { term: 'Secondary data', def: 'Information collected by someone else, such as census results or maps' },
    { term: 'Quantitative data', def: 'Data in the form of numbers that can be measured or counted' },
    { term: 'Qualitative data', def: 'Data in the form of words, opinions, photos or sketches' },
    { term: 'Hypothesis', def: 'A statement you can test, such as "the river gets wider downstream"' },
    { term: 'Random sampling', def: 'Choosing sample points by chance so every point has an equal chance of being picked' },
    { term: 'Systematic sampling', def: 'Taking samples at regular intervals, such as every 10 metres' },
    { term: 'Stratified sampling', def: 'Dividing an area into groups and sampling each group in proportion to its size' },
    { term: 'Risk assessment', def: 'Identifying the hazards of a fieldwork site and how to reduce them' },
  ],
  links: [
    {
      prompt: 'Match each fieldwork measurement to a suitable method.',
      pairs: [
        ['River velocity', 'Time a float over a measured distance'],
        ['River depth', 'Use a metre rule at regular intervals across the channel'],
        ['Pebble size', 'Measure the longest axis of each pebble with a ruler'],
        ['Pedestrian numbers', 'Count people passing a point for a set time'],
        ['Quality of an area', 'Score it on an environmental quality survey'],
        ['Slope angle of a beach', 'Use a clinometer between two ranging poles'],
      ],
      hint: 'Velocity is speed: you need a distance and a time.',
      ask: (l) => `Which is a suitable fieldwork method for measuring: ${l.toLowerCase()}?`,
      lv: [2, 4],
    },
  ],
  orders: [
    {
      prompt: 'Put the stages of a geographical enquiry in order.',
      steps: ['Ask a question or write a hypothesis', 'Plan and collect data', 'Present the data', 'Analyse the results', 'Write a conclusion', 'Evaluate the enquiry'],
      direction: ['first', 'last'],
      hint: 'You cannot present data you have not collected, and you cannot conclude before you analyse.',
      why: 'An enquiry starts with a question, then data is collected, presented and analysed. The conclusion answers the question, and the evaluation looks at how reliable the method and results were.',
      lv: [3, 5],
    },
  ],
  mcqs: [
    {
      q: 'Why do geographers take several measurements at each site rather than just one?',
      a: 'To make the results more reliable by reducing the effect of a one-off error',
      wrong: [{ label: 'To make the fieldwork take longer', misconception: 'busywork', feedback: 'Repeats are about reliability: an average of several readings is less affected by one odd result.' }, 'Because the first measurement is always wrong', 'So they can pick the result they like best'],
      hint: 'What if one reading was taken badly?',
      why: 'Repeating measurements and taking an average reduces the effect of an unusual result, making the data more reliable.',
      lv: [3, 5],
    },
    {
      q: 'Which of these is secondary data?',
      a: 'Census figures downloaded from a government website',
      wrong: [
        { label: 'A count of cars you made outside school', misconception: 'primary-secondary', feedback: 'You collected it yourself, so it is primary data.' },
        { label: 'River widths your class measured', misconception: 'primary-secondary', feedback: 'You collected it yourself, so it is primary data.' },
        { label: 'A questionnaire you gave to shoppers', misconception: 'primary-secondary', feedback: 'You collected it yourself, so it is primary data.' },
      ],
      hint: 'Secondary data was collected by someone else.',
      why: 'Secondary data comes from other people or organisations, such as the census, maps or websites. Primary data you collect first-hand.',
      lv: [1, 3],
    },
  ],
  written: [
    {
      prompt: 'Your class measured the width of a river at three sites, once each, on a day after heavy rain. Suggest two weaknesses of this method and how you could improve it.',
      model: 'One weakness is that we only measured once at each site, so a mistake in one reading would affect the results; we could take three measurements at each site and use the average. Another weakness is that we only used three sites, which may not show the pattern along the whole river; we could use more sites at regular intervals downstream. Also, the river was higher than usual after heavy rain, so the widths may not be typical; we could repeat the fieldwork on a different day.',
      checklist: ['Identifies a weakness in the method', 'Explains why that weakness matters for the results', 'Suggests a practical improvement', 'Gives a second weakness with an improvement'],
      hint: 'Think about how many readings, how many sites, and whether the day was typical.',
    },
    {
      prompt: 'Describe two hazards of doing fieldwork in a river and how you would reduce the risk of each.',
      model: 'The water could be fast-flowing or deep, so someone could be swept over. To reduce this, only work in shallow, slow parts of the river, check the depth with a metre rule first, and never go in after heavy rain. Rocks on the bed can be slippery, so people could fall; wearing shoes with good grip and working in pairs, with a teacher nearby, reduces this risk.',
      checklist: ['Names a specific hazard', 'Explains how it could cause harm', 'Gives a realistic way to reduce the risk', 'Covers a second hazard with a precaution'],
      hint: 'Think about the water itself and the ground underfoot.',
    },
  ],
}

// =====================================================================================================================
// Analysing fieldwork data
// =====================================================================================================================

const DATASETS: { what: string; unit: string; lo: number; hi: number }[] = [
  { what: 'pebble lengths (cm) measured on a beach', unit: 'cm', lo: 2, hi: 15 },
  { what: 'river depths (cm) measured across a channel', unit: 'cm', lo: 10, hi: 60 },
  { what: 'pedestrian counts in five minutes at different points on a high street', unit: 'people', lo: 5, hi: 60 },
  { what: 'environmental quality scores for different streets', unit: 'points', lo: 4, hi: 20 },
  { what: 'river widths (m) measured downstream', unit: 'm', lo: 2, hi: 18 },
]

const dataGenerators: ItemGenerator[] = [
  G('maps.data.stats', 'maps.data-analysis', [1, 5], (rng, d) => {
    const ds = rng.pick(DATASETS)
    const n = d <= 2 ? 5 : d <= 4 ? 7 : 8
    let vals = Array.from({ length: n }, () => rng.int(ds.lo, ds.hi))
    const stat = d <= 1 ? 'range' : d === 2 ? rng.pick(['range', 'mode']) : d === 3 ? rng.pick(['median', 'mean']) : d === 4 ? 'mean' : rng.pick(['median', 'mean'])
    if (stat === 'mean') {
      // Adjust the last value so the mean is a whole number.
      const sum = vals.slice(0, -1).reduce((a, b) => a + b, 0)
      let last = vals[n - 1] as number
      while ((sum + last) % n !== 0) last++
      vals = [...vals.slice(0, -1), last]
    }
    if (stat === 'mode') {
      const m = vals[0] as number
      vals = vals.map((v, i) => (i === 2 ? m : v))
      // Make every other value distinct from each other and from m.
      const seen = new Set<number>([m])
      vals = vals.map((v, i) => {
        if (i === 0 || i === 2) return v
        let x = v
        while (seen.has(x)) x++
        seen.add(x)
        return x
      })
    }
    const sorted = [...vals].sort((a, b) => a - b)
    const figure: Figure = { type: 'table', head: ['Site', ...vals.map((_, i) => String(i + 1))], rows: [[ds.unit, ...vals.map(String)]] }
    const sum = vals.reduce((a, b) => a + b, 0)
    let answer: number
    let explanation: string
    let hint: string
    const errors: { values: number[]; tag: string; message: string }[] = []
    switch (stat) {
      case 'range':
        answer = (sorted[n - 1] as number) - (sorted[0] as number)
        hint = 'Range = largest value − smallest value.'
        explanation = `Largest ${sorted[n - 1]}, smallest ${sorted[0]}. Range = ${sorted[n - 1]} − ${sorted[0]} = ${answer}. The range shows how spread out the data is.`
        break
      case 'mode':
        answer = vals[0] as number
        hint = 'The mode is the value that appears most often.'
        explanation = `${answer} appears twice; every other value appears once. The mode is ${answer}.`
        break
      case 'median': {
        if (n % 2 === 1) {
          answer = sorted[(n - 1) / 2] as number
          explanation = `In order: ${sorted.join(', ')}. The middle value is ${answer}.`
        } else {
          const a = sorted[n / 2 - 1] as number
          const b = sorted[n / 2] as number
          answer = (a + b) / 2
          explanation = `In order: ${sorted.join(', ')}. There are two middle values, ${a} and ${b}, so the median is halfway between them: ${answer}.`
        }
        hint = 'Put the values in order first, then find the middle.'
        const unsortedMid = n % 2 === 1 ? (vals[(n - 1) / 2] as number) : ((vals[n / 2 - 1] as number) + (vals[n / 2] as number)) / 2
        errors.push({ values: [unsortedMid], tag: 'median-unsorted', message: 'You took the middle of the list without putting it in order first.' })
        break
      }
      default:
        answer = sum / n
        hint = 'Add all the values, then divide by how many there are.'
        explanation = `Total = ${vals.join(' + ')} = ${sum}. ${sum} ÷ ${n} = ${answer}.`
        errors.push({ values: [sum], tag: 'forgot-divide', message: `That is the total. Divide by the number of values (${n}).` })
    }
    const statName = { range: 'range', mode: 'mode', median: 'median', mean: 'mean' }[stat]
    return num({
      prompt: `The table shows ${ds.what}. What is the ${statName}?`,
      figure,
      answer,
      suffix: ds.unit,
      tolerance: 0.001,
      hint,
      explanation,
      errors,
    })
  }),
]

const dataBank: Bank = {
  skill: 'maps.data-analysis',
  mcqs: [
    {
      q: 'Why might the median be a better average than the mean for a set of fieldwork data?',
      a: 'It is not pulled up or down by one extreme value (an anomaly)',
      wrong: [{ label: 'It always gives a bigger number', misconception: 'median-bigger', feedback: 'The median can be bigger or smaller than the mean. Its advantage is that extreme values do not distort it.' }, 'It uses every value in the calculation', 'It is the most common value'],
      hint: 'Imagine one pedestrian count of 500 among counts of about 20.',
      why: 'The mean uses every value, so one extreme result (an anomaly) can drag it a long way. The median is just the middle value, so it is not affected much.',
      lv: [3, 5],
    },
    {
      q: 'What is an anomaly in a set of results?',
      a: 'A result that does not fit the general pattern',
      wrong: ['The most common result', 'The average of all the results', 'The first result recorded'],
      hint: 'On a scatter graph it would sit well away from the other points.',
      why: 'An anomaly is a result that does not fit the pattern. It might be a real but unusual value, or a mistake, so it should be checked and discussed.',
      lv: [2, 4],
    },
    {
      q: 'Your hypothesis was "pebbles get smaller further along the beach". The mean pebble size went from 9 cm at site 1 to 4 cm at site 5. What should your conclusion say?',
      a: 'The results support the hypothesis, because the mean pebble size decreased along the beach',
      wrong: [
        { label: 'The results prove the hypothesis is true everywhere', misconception: 'overclaim', feedback: 'Fieldwork results can support a hypothesis for that place and time, but they cannot prove it is always true.' },
        { label: 'The results reject the hypothesis', misconception: 'misread', feedback: 'The pebbles did get smaller, so the hypothesis is supported.' },
        'No conclusion can be made from averages',
      ],
      hint: 'Use careful words: does the data support it, or prove it for every beach?',
      why: 'A good conclusion refers back to the hypothesis and the evidence: the mean fell from 9 cm to 4 cm, so the results support the hypothesis for this beach.',
      lv: [4, 5],
    },
  ],
}

// =====================================================================================================================

export const mapsGenerators: ItemGenerator[] = [
  ...compassGenerators,
  ...bankGenerators(gridBank),
  ...grid4Generators,
  ...grid6Generators,
  ...bankGenerators(scaleBank),
  ...scaleGenerators,
  ...bankGenerators(symbolsBank),
  ...bankGenerators(reliefBank),
  ...reliefGenerators,
  ...bankGenerators(graphsBank),
  ...graphsGenerators,
  ...bankGenerators(climateBank),
  ...climateGenerators,
  ...bankGenerators(fieldworkBank),
  ...bankGenerators(dataBank),
  ...dataGenerators,
]
