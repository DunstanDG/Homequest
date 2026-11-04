import type { ItemGenerator } from '@/engine/registry'
import type { Figure, Rng } from '@/engine/types'
import { choice } from '../../kit'
import { bankGenerators, err, fmt, G, num, round, type Bank } from './factory'

// =====================================================================================================================
// Speed
// =====================================================================================================================

interface Mover {
  who: string
  verb: string
  speeds: number[]
  times: number[]
}

const MOVERS: Mover[] = [
  { who: 'A sprinter', verb: 'runs', speeds: [8, 9, 10], times: [10, 12, 20] },
  { who: 'A cyclist', verb: 'rides', speeds: [4, 5, 6, 8, 10], times: [30, 60, 120, 300] },
  { who: 'A car', verb: 'drives', speeds: [10, 15, 20, 25, 30], times: [10, 20, 30, 60] },
  { who: 'A train', verb: 'travels', speeds: [40, 50, 60], times: [30, 60, 120] },
  { who: 'A walker', verb: 'walks', speeds: [1, 1.5, 2], times: [60, 100, 120, 300] },
  { who: 'A swimmer', verb: 'swims', speeds: [1, 1.5, 2], times: [20, 50, 100] },
]

const speedCalc = G('phys.motion.speed.calc', 'phys.motion.speed', [1, 5], (rng, d) => {
  const m = rng.pick(MOVERS)
  const v = rng.pick(m.speeds)
  const t = rng.pick(m.times)
  const s = round(v * t)
  if (d <= 2) {
    return num({
      prompt: `${m.who} ${m.verb} ${fmt(s)} m in ${t} s. What is the average speed? Give your answer in m/s.`,
      answer: v,
      suffix: 'm/s',
      hint: 'Speed = distance ÷ time.',
      explanation: `Speed = ${fmt(s)} m ÷ ${t} s = ${fmt(v)} m/s.`,
      errors: [err(s * t, 'multiplied', 'Speed = distance DIVIDED by time.'), err(round(t / s, 6), 'upside-down', 'Divide the distance by the time, not the time by the distance.')],
    })
  }
  if (d === 3) {
    return num({
      prompt: `${m.who} ${m.verb} at an average speed of ${fmt(v)} m/s for ${t} s. How far does it go? Give your answer in metres.`,
      answer: s,
      suffix: 'm',
      hint: 'Distance = speed × time.',
      explanation: `Distance = ${fmt(v)} m/s × ${t} s = ${fmt(s)} m.`,
      errors: [err(round(v / t, 6), 'divided', 'Distance = speed × time. You divided.')],
    })
  }
  if (d === 4) {
    return num({
      prompt: `${m.who} ${m.verb} ${fmt(s)} m at an average speed of ${fmt(v)} m/s. How long does it take? Give your answer in seconds.`,
      answer: t,
      suffix: 's',
      hint: 'Time = distance ÷ speed.',
      explanation: `Time = ${fmt(s)} m ÷ ${fmt(v)} m/s = ${t} s.`,
      errors: [err(s * v, 'multiplied', 'Time = distance ÷ speed. You multiplied.')],
    })
  }
  // Level 5: kilometres and minutes, answer in m/s.
  const v5 = rng.pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25])
  const mins = rng.pick([5, 10, 15, 20, 30])
  const km = round((v5 * mins * 60) / 1000)
  return num({
    prompt: `A journey of ${fmt(km)} km takes ${mins} minutes. What is the average speed in m/s?`,
    answer: v5,
    suffix: 'm/s',
    hint: 'Change kilometres to metres and minutes to seconds before dividing.',
    explanation: `${fmt(km)} km = ${fmt(km * 1000)} m and ${mins} minutes = ${mins * 60} s. Speed = ${fmt(km * 1000)} ÷ ${mins * 60} = ${fmt(v5)} m/s.`,
    errors: [err(round(km / mins, 6), 'no-conversion', 'That is in km per minute. Change to metres and seconds first.')],
  })
})

const averageSpeed = G('phys.motion.speed.average', 'phys.motion.speed', [4, 5], (rng) => {
  for (let i = 0; i < 50; i++) {
    const t1 = rng.pick([20, 30, 40, 50, 60, 100])
    const t2 = rng.pick([20, 30, 40, 50, 60, 100])
    const v1 = rng.pick([1, 2, 3, 4])
    const v2 = rng.pick([2, 4, 5, 6, 8])
    if (v1 === v2) continue
    const s1 = v1 * t1
    const s2 = v2 * t2
    const avg = (s1 + s2) / (t1 + t2)
    if (Math.abs(avg * 10 - Math.round(avg * 10)) > 1e-9) continue
    return num({
      prompt: `Jo walks ${s1} m in ${t1} s, then runs ${s2} m in ${t2} s. What is her average speed for the whole journey? Give your answer in m/s.`,
      answer: avg,
      suffix: 'm/s',
      hint: 'Average speed = TOTAL distance ÷ TOTAL time.',
      explanation: `Total distance = ${s1} + ${s2} = ${s1 + s2} m. Total time = ${t1} + ${t2} = ${t1 + t2} s. Average speed = ${s1 + s2} ÷ ${t1 + t2} = ${fmt(avg)} m/s.`,
      errors: [err((v1 + v2) / 2, 'averaged-speeds', 'You averaged the two speeds. She spends different times at each speed, so use total distance ÷ total time.')],
    })
  }
  return num({
    prompt: 'Jo walks 100 m in 50 s, then runs 200 m in 50 s. What is her average speed for the whole journey? Give your answer in m/s.',
    answer: 3,
    suffix: 'm/s',
    hint: 'Average speed = TOTAL distance ÷ TOTAL time.',
    explanation: 'Total distance = 300 m, total time = 100 s, so average speed = 3 m/s.',
  })
})

const speedBank: Bank = {
  skill: 'phys.motion.speed',
  mcqs: [
    {
      q: 'Why do we usually talk about AVERAGE speed for a journey?',
      a: 'Because the speed changes during the journey',
      wrong: [{ label: 'Because speed cannot be measured exactly', misconception: 'average-measurement', feedback: 'Speed can be measured well. "Average" is because it changes along the way.' }, 'Because the distance changes', 'Because it is the top speed'],
      hint: 'A car stops at traffic lights and speeds up again.',
      why: 'Real journeys speed up and slow down. Average speed = total distance ÷ total time; at any moment the actual speed may be higher or lower.',
      lv: [1, 3],
    },
    {
      q: 'Which is the fastest?',
      a: '20 m/s',
      wrong: [{ label: '50 km/h', misconception: 'bigger-number-faster', feedback: '50 km/h is about 14 m/s. Compare speeds in the same units.' }, '15 m/s', '10 m/s'],
      hint: '1 km/h is a bit less than 0.3 m/s.',
      why: '20 m/s = 72 km/h, which is faster than 50 km/h (about 14 m/s) and 10 m/s.',
      lv: [3, 5],
    },
    {
      q: 'A speed camera measures the time a car takes to travel between two lines painted 10 m apart. What else does it need to work out the speed?',
      a: 'Nothing else: speed = 10 m ÷ the time',
      wrong: [{ label: 'The mass of the car', misconception: 'speed-mass', feedback: 'Mass does not affect speed = distance ÷ time.' }, 'The colour of the car', 'The driver\'s age'],
      hint: 'Speed = distance ÷ time.',
      why: 'Knowing the distance (10 m) and the time is enough: speed = distance ÷ time.',
      lv: [2, 4],
    },
  ],
}

// =====================================================================================================================
// Distance-time graphs
// =====================================================================================================================

interface Journey {
  pts: [number, number][]
  segs: { label: string; dt: number; dd: number }[]
  yStep: number
}

/** Three-part journey whose corners all sit on grid lines; one part is stationary. Level 5 may come back. */
function makeJourney(rng: Rng, back: boolean): Journey {
  for (let tries = 0; tries < 200; tries++) {
    const yStep = rng.pick([10, 20, 50])
    const dts = [rng.int(1, 4) * 10, rng.int(1, 3) * 10, rng.int(1, 4) * 10]
    const stillAt = back ? 1 : rng.int(0, 2)
    const dds = [0, 1, 2].map((i) => (i === stillAt ? 0 : rng.int(1, 5) * yStep))
    if (back) dds[2] = -(dds[0] as number) // returns to the start
    const speeds = dds.map((dd, i) => Math.abs(dd) / (dts[i] as number))
    if (speeds.some((v) => Math.abs(v * 10 - Math.round(v * 10)) > 1e-9)) continue
    const moving = speeds.filter((v) => v > 0)
    if (moving.length !== 2 || (!back && moving[0] === moving[1])) continue
    const pts: [number, number][] = [[0, 0]]
    for (let i = 0; i < 3; i++) {
      const [x, y] = pts[i] as [number, number]
      pts.push([x + (dts[i] as number), y + (dds[i] as number)])
    }
    const yMax = Math.max(...pts.map((p) => p[1]))
    if (yMax / yStep > 10 || yMax <= 0) continue
    return { pts, segs: ['A', 'B', 'C'].map((label, i) => ({ label, dt: dts[i] as number, dd: dds[i] as number })), yStep }
  }
  return {
    pts: [[0, 0], [20, 60], [40, 60], [50, 100]],
    segs: [
      { label: 'A', dt: 20, dd: 60 },
      { label: 'B', dt: 20, dd: 0 },
      { label: 'C', dt: 10, dd: 40 },
    ],
    yStep: 20,
  }
}

const journeyFigure = (j: Journey): Figure => {
  const xMax = (j.pts[3] as [number, number])[0]
  const yMax = Math.max(...j.pts.map((p) => p[1]))
  return {
    type: 'coord-grid',
    xRange: [0, xMax],
    yRange: [0, Math.ceil(yMax / j.yStep) * j.yStep],
    xStep: 10,
    yStep: j.yStep,
    xLabel: 'time (s)',
    yLabel: 'distance from start (m)',
    dots: true,
    lines: j.segs.map((s, i) => ({ from: j.pts[i] as [number, number], to: j.pts[i + 1] as [number, number], label: s.label })),
  }
}

const dtGraph = G('phys.motion.dt-graphs.read', 'phys.motion.dt-graphs', [1, 5], (rng, d) => {
  const j = makeJourney(rng, d >= 5)
  const fig = journeyFigure(j)
  const intro = 'The distance-time graph shows a short journey in three parts, A, B and C.'
  const still = j.segs.find((s) => s.dd === 0) as Journey['segs'][number]
  const moving = j.segs.filter((s) => s.dd !== 0)
  if (d <= 2) {
    const askStill = d === 1 || rng.chance(0.5)
    if (askStill) {
      return choice({
        rng,
        prompt: `${intro} In which part is the object stopped (stationary)?`,
        figure: fig,
        correct: `Part ${still.label}`,
        wrong: moving.map((s) => ({ label: `Part ${s.label}`, misconception: 'sloped-is-stopped', feedback: `In part ${s.label} the distance changes, so the object is moving.` })),
        keepOrder: true,
        hint: 'If the object is stopped, its distance from the start does not change as time goes on.',
        explanation: `In part ${still.label} the line is flat (horizontal): time passes but the distance stays the same, so the object is stationary.`,
      })
    }
    const total = (j.pts[3] as [number, number])[1]
    return num({
      prompt: `${intro} How far from the start is the object at the end of the journey? Give your answer in metres.`,
      figure: fig,
      answer: total,
      suffix: 'm',
      hint: 'Read the distance axis at the end of the line.',
      explanation: `The line ends at ${total} m on the distance axis.`,
    })
  }
  if (d === 3 || d === 5) {
    const s = rng.pick(moving)
    const v = Math.abs(s.dd) / s.dt
    return num({
      prompt: `${intro}${d === 5 ? ' In part C the object comes back towards the start.' : ''} What is the speed in part ${s.label}? Give your answer in m/s.`,
      figure: fig,
      answer: v,
      suffix: 'm/s',
      hint: `Read how much the distance changes in part ${s.label} and how long part ${s.label} lasts. Speed = distance ÷ time.`,
      explanation: `In part ${s.label} the distance changes by ${Math.abs(s.dd)} m in ${s.dt} s. Speed = ${Math.abs(s.dd)} ÷ ${s.dt} = ${fmt(v)} m/s.`,
      errors: [err(round(s.dt / Math.abs(s.dd), 6), 'upside-down', 'Divide the distance by the time, not the other way round.')],
    })
  }
  // Level 4: fastest part, or average speed for the whole journey.
  if (rng.chance(0.5)) {
    const fastest = moving.reduce((a, b) => (Math.abs(b.dd) / b.dt > Math.abs(a.dd) / a.dt ? b : a))
    return choice({
      rng,
      prompt: `${intro} In which part is the object moving fastest?`,
      figure: fig,
      correct: `Part ${fastest.label}`,
      wrong: j.segs.filter((s) => s !== fastest).map((s) => ({ label: `Part ${s.label}`, misconception: s.dd === 0 ? 'flat-is-fast' : 'longest-is-fastest', feedback: s.dd === 0 ? 'A flat line means not moving at all.' : `Part ${s.label} has a gentler slope: ${Math.abs(s.dd)} m in ${s.dt} s.` })),
      keepOrder: true,
      hint: 'The steeper the line, the faster the object is moving.',
      explanation: j.segs.map((s) => `Part ${s.label}: ${Math.abs(s.dd)} m in ${s.dt} s = ${fmt(Math.abs(s.dd) / s.dt)} m/s`).join('\n') + `\nThe steepest line, part ${fastest.label}, is the fastest.`,
    })
  }
  const total = (j.pts[3] as [number, number])[1]
  const time = (j.pts[3] as [number, number])[0]
  const avg = total / time
  return num({
    prompt: `${intro} What is the average speed for the whole journey, including the stop? Give your answer in m/s, to 1 decimal place if needed.`,
    figure: fig,
    answer: round(avg, 1),
    tolerance: 0.051,
    suffix: 'm/s',
    hint: 'Average speed = total distance ÷ total time.',
    explanation: `Total distance = ${total} m, total time = ${time} s. Average speed = ${total} ÷ ${time} = ${fmt(avg, 2)} m/s${Math.abs(avg - round(avg, 1)) > 1e-9 ? ` ≈ ${fmt(round(avg, 1))} m/s` : ''}.`,
  })
})

const dtBank: Bank = {
  skill: 'phys.motion.dt-graphs',
  links: [
    {
      prompt: 'Match each shape of line on a distance-time graph to what it means.',
      pairs: [
        ['Horizontal (flat) line', 'Stationary: not moving'],
        ['Straight line sloping upwards', 'Moving away at a steady speed'],
        ['Line curving upwards, getting steeper', 'Speeding up (accelerating)'],
        ['Line curving, getting less steep', 'Slowing down (decelerating)'],
        ['Straight line sloping down to the time axis', 'Coming back to the start at a steady speed'],
      ],
      hint: 'The slope (gradient) of a distance-time graph is the speed.',
      ask: (l) => `On a distance-time graph, what does this show? "${l}"`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'On a distance-time graph, what does the gradient (steepness) of the line tell you?',
      a: 'The speed',
      wrong: [{ label: 'The distance travelled', misconception: 'gradient-distance', feedback: 'You read the distance from the vertical axis. The slope is how fast it changes: the speed.' }, 'The time taken', 'The direction of the force'],
      hint: 'Gradient = change in distance ÷ change in time.',
      why: 'Gradient = distance ÷ time, which is speed. Steeper means faster.',
      lv: [2, 4],
    },
    {
      q: 'Two runners start together. On a distance-time graph, runner P\'s line is steeper than runner Q\'s. Which is true?',
      a: 'P is running faster than Q',
      wrong: [{ label: 'Q is running faster than P', misconception: 'steeper-slower', feedback: 'A steeper line means more distance covered each second.' }, 'P has run for longer', 'They are running at the same speed'],
      hint: 'Steeper means more distance in the same time.',
      why: 'The steeper line covers more distance in each second, so P is faster.',
      lv: [2, 4],
    },
  ],
}

// =====================================================================================================================
// Relative motion
// =====================================================================================================================

const relative = G('phys.motion.relative.calc', 'phys.motion.relative', [2, 5], (rng, d) => {
  if (d === 2 || d === 3) {
    const a = rng.pick([20, 25, 30, 35])
    const b = rng.pick([10, 15, 20, 25, 30].filter((x) => x < a))
    const same = d === 2
    const rel = same ? a - b : a + b
    return num({
      prompt: same
        ? `On a motorway, car P travels at ${a} m/s and car Q, in the next lane, travels at ${b} m/s in the same direction. How fast is car P moving relative to car Q? Give your answer in m/s.`
        : `Two trains pass each other on parallel tracks, going in opposite directions. One travels at ${a} m/s and the other at ${b} m/s. What is their speed relative to each other? Give your answer in m/s.`,
      answer: rel,
      suffix: 'm/s',
      hint: same ? 'Moving the same way: the gap changes by the difference in speeds.' : 'Moving towards each other: the gap closes by both speeds added together.',
      explanation: same
        ? `Same direction, so subtract: ${a} − ${b} = ${rel} m/s. To the people in car Q, car P seems to creep past at only ${rel} m/s.`
        : `Opposite directions, so add: ${a} + ${b} = ${rel} m/s. That is why passing trains seem to rush by.`,
      errors: [err(same ? a + b : a - b, same ? 'added-same-direction' : 'subtracted-opposite', same ? 'They are going the same way, so the relative speed is the difference.' : 'They are going opposite ways, so add the speeds.')],
    })
  }
  if (d === 4) {
    const a = rng.pick([20, 25, 30])
    const b = rng.pick([10, 15, 20].filter((x) => x < a))
    const rel = a - b
    const t = rng.pick([5, 10, 20, 30])
    const gap = rel * t
    return num({
      prompt: `A car travelling at ${a} m/s is ${gap} m behind a lorry travelling at ${b} m/s in the same direction. How long does the car take to catch up with the lorry? Give your answer in seconds.`,
      answer: t,
      suffix: 's',
      hint: 'Work out how fast the gap is closing (the relative speed), then time = gap ÷ relative speed.',
      explanation: `Relative speed = ${a} − ${b} = ${rel} m/s. Time = ${gap} m ÷ ${rel} m/s = ${t} s.`,
      errors: [err(round(gap / a, 6), 'used-own-speed', 'Use the relative speed (the difference), because the lorry is moving too.'), err(round(gap / (a + b), 6), 'added-speeds', 'They move the same way, so the gap closes at the DIFFERENCE of the speeds.')],
    })
  }
  const train = rng.pick([20, 25, 30, 40])
  const walk = rng.pick([1, 1.5, 2])
  const forwards = rng.chance(0.5)
  const ans = forwards ? train + walk : train - walk
  return num({
    prompt: `A train moves at ${train} m/s. A passenger walks along the carriage at ${fmt(walk)} m/s (relative to the train) towards the ${forwards ? 'front' : 'back'} of the train. How fast is the passenger moving relative to the ground? Give your answer in m/s.`,
    answer: ans,
    suffix: 'm/s',
    hint: `Is the passenger walking the same way the train is going, or the opposite way?`,
    explanation: forwards
      ? `Walking the same way as the train, so add: ${train} + ${fmt(walk)} = ${fmt(ans)} m/s.`
      : `Walking against the direction of the train, so subtract: ${train} − ${fmt(walk)} = ${fmt(ans)} m/s. She is still moving forwards relative to the ground, just a little slower than the train.`,
    errors: [err(forwards ? train - walk : train + walk, 'wrong-direction', 'Check which way she walks compared with the train.')],
  })
})

const relativeBank: Bank = {
  skill: 'phys.motion.relative',
  mcqs: [
    {
      q: 'You are sitting on a moving train. Relative to you, how fast is the passenger sitting opposite you moving?',
      a: 'Not moving at all (0 m/s)',
      wrong: [{ label: 'The same speed as the train', misconception: 'relative-frame', feedback: 'Relative to the ground, yes. But relative to YOU, the passenger stays in the same place.' }, 'Twice the speed of the train', 'It cannot be worked out'],
      hint: 'Does the distance between you and them change?',
      why: 'Speed depends on what you measure it against. You and the passenger move together, so relative to you they are stationary, even though both of you are moving relative to the ground.',
      lv: [2, 4],
    },
    {
      q: 'Two cars drive side by side in the same direction at exactly the same speed. What is the speed of one relative to the other?',
      a: '0 m/s',
      wrong: [{ label: 'Double their speed', misconception: 'add-same-direction', feedback: 'You add speeds only when they move in opposite directions.' }, 'The same as their speed', 'It depends on their mass'],
      hint: 'Does the gap between them change?',
      why: 'The gap between them stays the same, so their relative speed is zero.',
      lv: [1, 3],
    },
    {
      q: 'Why does a car coming the other way on a road seem to flash past so quickly?',
      a: 'Their relative speed is your speed and theirs added together',
      wrong: [{ label: 'Because it is always faster than you', misconception: 'other-car-faster', feedback: 'It need not be faster. Moving in opposite directions, the speeds add.' }, 'Because their relative speed is the difference of your speeds', 'Because of air resistance'],
      hint: 'You are moving towards each other.',
      why: 'For objects moving in opposite directions, relative speed = speed of one + speed of the other, so the gap closes very fast.',
      lv: [2, 4],
    },
  ],
}

export const motionGenerators: ItemGenerator[] = [
  speedCalc,
  averageSpeed,
  ...bankGenerators(speedBank),
  dtGraph,
  ...bankGenerators(dtBank),
  relative,
  ...bankGenerators(relativeBank),
]
