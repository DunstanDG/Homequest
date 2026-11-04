import type { ItemGenerator } from '@/engine/registry'
import type { CommonError, Figure, Rng } from '@/engine/types'
import { G, choice, lin, money, multi, num, round } from './helpers'

const ex = (tag: string, message: string, ...values: number[]): CommonError => ({ tag, message, values })
const deg = (n: number) => `${n}°`
/** Angle label for an expression like 2x + 10. */
const lab = (a: number, b: number) => (b === 0 ? `${a === 1 ? '' : a}x°` : `(${lin(a, b)})°`)
const ANGLE_STEP = (rng: Rng, lo: number, hi: number, step = 5) => rng.int(lo / step, hi / step) * step

const coef = (n: number) => (n === 1 ? '' : String(n))
const br = (a: number, b: number) => `(${lin(a, b)})`

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'.split('')
const threeLetters = (rng: Rng): [string, string, string] => {
  const s = rng.shuffle(LETTERS)
  return [s[0] as string, s[1] as string, s[2] as string]
}

export const geometryGenerators: ItemGenerator[] = [
  // ============================================ ANGLE PROPERTIES (Y7)
  G('ap.straight', 'geometry.angle-properties', [1, 3], (rng, d) => {
    if (d === 1) {
      const a = ANGLE_STEP(rng, 30, 150)
      return num({
        prompt: 'The angles on a straight line add up to a fixed total. Work out angle x.',
        figure: { type: 'angles', kind: 'straight', labels: { a: deg(a), b: 'x' } },
        answer: 180 - a,
        suffix: '°',
        hint: 'Angles on a straight line add up to 180°.',
        explanation: `x = 180° − ${a}° = ${180 - a}°.`,
        errors: [ex('used-90', 'Angles on a straight line add up to 180°, not 90°.', 90 - a), ex('used-360', 'A full turn is 360°, but a straight line is only half a turn: 180°.', 360 - a)],
      })
    }
    if (d === 2) {
      const a = ANGLE_STEP(rng, 20, 90)
      const b = ANGLE_STEP(rng, 20, 80)
      return num({
        prompt: 'Work out angle x.',
        figure: { type: 'angles', kind: 'straight', labels: { a: deg(a), b: 'x', c: deg(b) } },
        answer: 180 - a - b,
        suffix: '°',
        hint: 'Add up the angles you know, then take the total away from 180°.',
        explanation: `${a} + ${b} = ${a + b}. x = 180° − ${a + b}° = ${180 - a - b}°.`,
        errors: [ex('used-360', 'Angles on a straight line add up to 180°, not 360°.', 360 - a - b), ex('added-not-subtracted', `You added the angles. Subtract them from 180° instead.`, a + b)],
      })
    }
    const a = rng.int(5, 15) * 10
    return num({
      prompt: 'The two angles marked x are equal. Work out x.',
      figure: { type: 'angles', kind: 'straight', labels: { a: deg(a), b: 'x', c: 'x' } },
      answer: (180 - a) / 2,
      suffix: '°',
      hint: `Take ${a}° from 180° first. The rest is shared between two equal angles.`,
      explanation: `180 − ${a} = ${180 - a}. Two equal angles: x = ${180 - a} ÷ 2 = ${(180 - a) / 2}°.`,
      errors: [ex('forgot-to-halve', 'There are TWO angles marked x, so share what is left between them.', 180 - a)],
    })
  }),

  G('ap.point', 'geometry.angle-properties', [1, 3], (rng, d) => {
    if (d === 1) {
      const a = ANGLE_STEP(rng, 90, 140)
      const b = ANGLE_STEP(rng, 90, 140)
      return num({
        prompt: 'Angles around a point add up to a fixed total. Work out angle x.',
        figure: { type: 'angles', kind: 'point', labels: { a: deg(a), b: deg(b), c: 'x' } },
        answer: 360 - a - b,
        suffix: '°',
        hint: 'Angles around a point add up to 360°.',
        explanation: `${a} + ${b} = ${a + b}. x = 360° − ${a + b}° = ${360 - a - b}°.`,
        errors: [ex('used-180', 'Angles around a point make a full turn: 360°, not 180°.', 180 - a - b)],
      })
    }
    if (d === 2) {
      const a = ANGLE_STEP(rng, 40, 100)
      const b = ANGLE_STEP(rng, 40, 100)
      const c = ANGLE_STEP(rng, 40, 100)
      return num({
        prompt: 'Work out angle x.',
        figure: { type: 'angles', kind: 'point', labels: { a: deg(a), b: deg(b), c: deg(c), d: 'x' } },
        answer: 360 - a - b - c,
        suffix: '°',
        hint: 'Add the three known angles, then subtract from 360°.',
        explanation: `${a} + ${b} + ${c} = ${a + b + c}. x = 360° − ${a + b + c}° = ${360 - a - b - c}°.`,
        errors: [ex('used-180', 'Angles around a point add up to 360°.', 180 - a - b - c)],
      })
    }
    const a = ANGLE_STEP(rng, 60, 120, 10)
    const b = ANGLE_STEP(rng, 60, 120, 10)
    const rest = 360 - a - b
    return num({
      prompt: 'The two angles marked x are equal. Work out x.',
      figure: { type: 'angles', kind: 'point', labels: { a: deg(a), b: deg(b), c: 'x', d: 'x' } },
      answer: rest / 2,
      suffix: '°',
      hint: 'Find what is left of the 360°, then share it equally.',
      explanation: `360 − ${a} − ${b} = ${rest}. x = ${rest} ÷ 2 = ${rest / 2}°.`,
      errors: [ex('forgot-to-halve', 'There are TWO angles marked x.', rest)],
    })
  }),

  G('ap.vertical', 'geometry.angle-properties', [1, 3], (rng, d) => {
    const a = ANGLE_STEP(rng, 30, 150)
    if (d === 1) {
      return num({
        prompt: 'Two straight lines cross. Work out angle x.',
        figure: { type: 'angles', kind: 'vertical', labels: { a: deg(a), c: 'x' } },
        answer: a,
        suffix: '°',
        hint: 'Angles directly opposite each other where two lines cross are equal.',
        explanation: `Vertically opposite angles are equal, so x = ${a}°.`,
        errors: [ex('used-supplementary', 'The angle you want is DIRECTLY opposite, so it is equal, not 180° minus.', 180 - a)],
      })
    }
    if (d === 2) {
      return num({
        prompt: 'Two straight lines cross. Work out angle x.',
        figure: { type: 'angles', kind: 'vertical', labels: { a: deg(a), b: 'x' } },
        answer: 180 - a,
        suffix: '°',
        hint: 'Angle x and the angle you are given sit together on a straight line.',
        explanation: `They are on a straight line, so x = 180° − ${a}° = ${180 - a}°.`,
        errors: [ex('used-opposite', 'x is NEXT to the given angle, not opposite it. Angles on a line add to 180°.', a)],
      })
    }
    return multi({
      prompt: 'Two straight lines cross. Work out angles x and y.',
      figure: { type: 'angles', kind: 'vertical', labels: { a: deg(a), b: 'x', c: 'y' } },
      fields: [{ answer: 180 - a }, { answer: a }],
      template: 'x = {0}°    y = {1}°',
      hint: 'x is next to the given angle (straight line). y is opposite it.',
      explanation: `x = 180° − ${a}° = ${180 - a}° (straight line). y = ${a}° (vertically opposite).`,
      errors: [ex('swapped', 'You have x and y the wrong way round. x is next to the given angle; y is opposite it.', a, 180 - a)],
    })
  }),

  G('ap.algebra', 'geometry.angle-properties', [4, 5], (rng, d) => {
    if (d === 4) {
      for (let g = 0; g < 500; g++) {
        const x = rng.int(10, 40)
        const p = rng.int(1, 3)
        const r = rng.int(1, 3)
        const q = rng.pick([0, 0, 10, 20, 30, -10, -20])
        const s = 180 - q - (p + r) * x
        const a1 = p * x + q
        const a2 = r * x + s
        if (Math.abs(s) > 60 || a1 < 20 || a2 < 20 || a1 > 160 || a2 > 160) continue
        return num({
          prompt: 'Angles on a straight line add up to 180°. Work out the value of x.',
          figure: { type: 'angles', kind: 'straight', labels: { a: lab(p, q), b: lab(r, s) } },
          prefix: 'x =',
          answer: x,
          hint: 'Write an equation: the two expressions add up to 180. Then collect like terms.',
          explanation: `${br(p, q)} + ${br(r, s)} = 180 → ${lin(p + r, q + s)} = 180 → ${p + r}x = ${180 - q - s} → x = ${x}.`,
          errors: [ex('gave-angle', `That is the size of an angle, not x. Solve for x first.`, a1), ex('gave-angle', 'That is the size of an angle, not x. Solve for x first.', a2)],
        })
      }
    }
    // d5: vertically opposite (equal) or triangle (sum 180)
    if (rng.chance(0.5)) {
      for (let g = 0; g < 500; g++) {
        const x = rng.int(8, 30)
        const p = rng.int(2, 5)
        const r = rng.int(1, p - 1)
        const q = rng.pick([-20, -10, 0, 10, 20])
        const s = p * x + q - r * x
        const a1 = p * x + q
        if (Math.abs(s) > 60 || a1 < 20 || a1 > 170 || s === q) continue
        return multi({
          prompt: 'Two straight lines cross. Work out the value of x, and the size of the marked angles.',
          figure: { type: 'angles', kind: 'vertical', labels: { a: lab(p, q), c: lab(r, s) } },
          fields: [{ answer: x }, { answer: a1 }],
          template: 'x = {0}    angle = {1}°',
          hint: 'Vertically opposite angles are equal, so set the two expressions equal to each other.',
          explanation: `${lin(p, q)} = ${lin(r, s)} → ${coef(p - r)}x = ${s - q} → x = ${x}. The angle is ${p}×${x}${q ? ` ${q < 0 ? '−' : '+'} ${Math.abs(q)}` : ''} = ${a1}°.`,
          errors: [ex('added-not-equal', 'Opposite angles are EQUAL. You need an equation with = between the two expressions, not adding them to 180.', round((180 - q - s) / (p + r), 4), round(p * ((180 - q - s) / (p + r)) + q, 4))],
        })
      }
    }
    for (let g = 0; g < 800; g++) {
      const x = rng.int(10, 30)
      const ps = [rng.int(1, 3), rng.int(1, 3), rng.int(1, 3)] as [number, number, number]
      const q1 = rng.pick([-20, -10, 0, 10, 20])
      const q2 = rng.pick([-20, -10, 0, 10, 20])
      const q3 = 180 - q1 - q2 - (ps[0] + ps[1] + ps[2]) * x
      const angles = [ps[0] * x + q1, ps[1] * x + q2, ps[2] * x + q3]
      if (Math.abs(q3) > 40 || angles.some((a) => a < 15 || a > 150)) continue
      return multi({
        prompt: 'Angles in a triangle add up to 180°. Work out the value of x, and the size of the largest angle.',
        figure: { type: 'angles', kind: 'triangle', labels: { a: lab(ps[0], q1), b: lab(ps[1], q2), c: lab(ps[2], q3) } },
        fields: [{ answer: x }, { answer: Math.max(...angles) }],
        template: 'x = {0}    largest angle = {1}°',
        hint: 'Add all three expressions and set the total equal to 180.',
        explanation: `${br(ps[0], q1)} + ${br(ps[1], q2)} + ${br(ps[2], q3)} = 180 → ${lin(ps[0] + ps[1] + ps[2], q1 + q2 + q3)} = 180 → x = ${x}. The angles are ${angles.join('°, ')}°.`,
      })
    }
    throw new Error('ap.algebra: no candidate')
  }),

  G('ap.reason', 'geometry.angle-properties', [2, 3], (rng, d) => {
    const kinds = d === 2 ? (['straight', 'point', 'vertical'] as const) : (['straight', 'point', 'vertical', 'triangle'] as const)
    const k = rng.pick(kinds)
    const facts: Record<string, string> = {
      straight: 'Angles on a straight line add up to 180°',
      point: 'Angles around a point add up to 360°',
      vertical: 'Vertically opposite angles are equal',
      triangle: 'Angles in a triangle add up to 180°',
    }
    const a = ANGLE_STEP(rng, 40, 100)
    const b = ANGLE_STEP(rng, 30, 80)
    let figure: Figure
    if (k === 'straight') figure = { type: 'angles', kind: 'straight', labels: { a: deg(a), b: 'x' } }
    else if (k === 'point') figure = { type: 'angles', kind: 'point', labels: { a: deg(a), b: deg(b), c: 'x' } }
    else if (k === 'vertical') figure = { type: 'angles', kind: 'vertical', labels: { a: deg(a), c: 'x' } }
    else figure = { type: 'angles', kind: 'triangle', labels: { a: deg(a), b: deg(b), c: 'x' } }
    return choice({
      rng,
      prompt: 'Which fact would you use to find angle x?',
      figure,
      correct: facts[k] as string,
      wrong: Object.entries(facts)
        .filter(([key]) => key !== k)
        .map(([, v]) => v),
      hint: 'Look at the diagram. What shape or pattern do the angles make?',
      explanation: `${facts[k]}, so this is the fact to use.`,
    })
  }),

  // ================================================== 2D SHAPES (Y7)
  G('sh.triangle-type', 'geometry.2d-shapes', [1, 3], (rng, d) => {
    if (d === 1) {
      const kind = rng.pick(['Equilateral', 'Isosceles', 'Scalene'] as const)
      let sides: number[] = []
      for (let g = 0; g < 200; g++) {
        if (kind === 'Equilateral') {
          const s = rng.int(3, 10)
          sides = [s, s, s]
        } else if (kind === 'Isosceles') {
          const a = rng.int(4, 10)
          const b = rng.int(2, 2 * a - 1)
          if (b === a) continue
          sides = [a, a, b]
        } else {
          const a = rng.int(3, 12)
          const b = rng.int(3, 12)
          const c = rng.int(3, 12)
          const [x, y, z] = [a, b, c].sort((p, q) => p - q) as [number, number, number]
          if (new Set([a, b, c]).size < 3 || x + y <= z || x * x + y * y === z * z) continue
          sides = [a, b, c]
        }
        break
      }
      sides = rng.shuffle(sides)
      return choice({
        rng,
        prompt: `A triangle has sides ${sides.join(' cm, ')} cm. What type of triangle is it?`,
        correct: kind,
        wrong: ['Equilateral', 'Isosceles', 'Scalene'].filter((k) => k !== kind),
        keepOrder: true,
        hint: 'Equilateral: all sides equal. Isosceles: exactly two equal. Scalene: none equal.',
        explanation: kind === 'Equilateral' ? 'All three sides are equal.' : kind === 'Isosceles' ? 'Two sides are equal (and the third is different).' : 'All three sides are different lengths.',
      })
    }
    if (d === 2) {
      const kind = rng.pick(['Equilateral', 'Isosceles', 'Right-angled'] as const)
      let angles: number[]
      if (kind === 'Equilateral') angles = [60, 60, 60]
      else if (kind === 'Isosceles') {
        let a = rng.int(35, 80)
        while (a === 60 || a === 45) a = rng.int(35, 80)
        angles = [a, a, 180 - 2 * a]
      } else {
        let b = rng.int(20, 70)
        while (b === 45) b = rng.int(20, 70)
        angles = [90, b, 90 - b]
      }
      angles = rng.shuffle(angles)
      return choice({
        rng,
        prompt: `A triangle has angles ${angles.map(deg).join(', ')}. Which name fits it best?`,
        correct: kind,
        wrong: ['Equilateral', 'Isosceles', 'Right-angled'].filter((k) => k !== kind),
        keepOrder: true,
        hint: 'Look for a right angle first, then for equal angles.',
        explanation: kind === 'Equilateral' ? 'All three angles are 60°, so all sides are equal.' : kind === 'Isosceles' ? 'Two angles are equal, so two sides are equal.' : 'One of the angles is 90°.',
      })
    }
    const eq = rng.int(5, 11)
    const third = rng.int(2, eq - 1)
    return num({
      prompt: `An isosceles triangle has two equal sides of ${eq} cm and a perimeter of ${eq * 2 + third} cm. How long is the third side?`,
      answer: third,
      suffix: 'cm',
      hint: 'Take the two equal sides away from the perimeter.',
      explanation: `${eq} + ${eq} = ${eq * 2}. ${eq * 2 + third} − ${eq * 2} = ${third} cm.`,
      errors: [ex('gave-equal-side', 'The third side is different from the equal sides. Subtract both equal sides from the perimeter.', eq)],
    })
  }),

  G('sh.iso-angle', 'geometry.2d-shapes', [2, 4], (rng, d) => {
    if (d === 2) {
      const apex = rng.int(10, 70) * 2
      return num({
        prompt: `An isosceles triangle has an apex (top) angle of ${apex}°. What is the size of each base angle?`,
        answer: (180 - apex) / 2,
        suffix: '°',
        hint: 'The two base angles are equal. Subtract the apex angle from 180°, then halve.',
        explanation: `180 − ${apex} = ${180 - apex}. ${180 - apex} ÷ 2 = ${(180 - apex) / 2}°.`,
        errors: [ex('forgot-to-halve', 'There are two equal base angles, so share the remainder between them.', 180 - apex)],
      })
    }
    if (d === 3) {
      const base = rng.int(25, 80)
      return num({
        prompt: `An isosceles triangle has two equal base angles of ${base}°. What is the apex angle?`,
        answer: 180 - 2 * base,
        suffix: '°',
        hint: 'Two base angles, so double it first.',
        explanation: `2 × ${base} = ${2 * base}. 180 − ${2 * base} = ${180 - 2 * base}°.`,
        errors: [ex('one-base-angle', 'There are TWO base angles. You only took one away.', 180 - base)],
      })
    }
    const k = rng.int(1, 14) * 3
    const apex = (180 - 2 * k) / 3
    return num({
      prompt: `In an isosceles triangle each base angle is ${k}° bigger than the apex angle. What is the size of the apex angle?`,
      answer: apex,
      suffix: '°',
      hint: `Let the apex angle be a. The base angles are a + ${k}. All three add up to 180.`,
      explanation: `a + (a + ${k}) + (a + ${k}) = 180 → 3a + ${2 * k} = 180 → a = ${180 - 2 * k} ÷ 3 = ${apex}°.`,
      errors: [ex('gave-base-angle', 'That is the base angle. The question asks for the apex angle.', apex + k)],
    })
  }),

  G('sh.quad-angle', 'geometry.2d-shapes', [2, 4], (rng, d) => {
    if (d === 2) {
      const a = ANGLE_STEP(rng, 60, 120)
      const b = ANGLE_STEP(rng, 60, 110)
      const c = ANGLE_STEP(rng, 60, 100)
      return num({
        prompt: `Three angles of a quadrilateral are ${a}°, ${b}° and ${c}°. What is the fourth angle?`,
        answer: 360 - a - b - c,
        suffix: '°',
        hint: 'The angles in a quadrilateral add up to 360°.',
        explanation: `${a} + ${b} + ${c} = ${a + b + c}. 360 − ${a + b + c} = ${360 - a - b - c}°.`,
        errors: [ex('used-180', 'A quadrilateral has angles adding to 360° (it splits into two triangles).', 180 - a - b - c)],
      })
    }
    if (d === 3) {
      const a = ANGLE_STEP(rng, 50, 130, 10)
      const adj = rng.chance(0.5)
      return num({
        prompt: `A parallelogram has one angle of ${a}°. What is the size of the ${adj ? 'angle next to it (adjacent)' : 'angle opposite it'}?`,
        answer: adj ? 180 - a : a,
        suffix: '°',
        hint: adj ? 'Adjacent angles in a parallelogram add up to 180°.' : 'Opposite angles in a parallelogram are equal.',
        explanation: adj ? `Adjacent angles add to 180°: 180 − ${a} = ${180 - a}°.` : `Opposite angles are equal: ${a}°.`,
        errors: [ex('mixed-up-rule', adj ? 'Adjacent angles are NOT equal. They add up to 180°.' : 'Opposite angles are equal, not 180° minus.', adj ? a : 180 - a)],
      })
    }
    for (let g = 0; g < 100; g++) {
      const a = rng.int(6, 16) * 10
      const c = rng.int(2, 9) * 10
      if ((360 - a - c) % 2 !== 0) continue
      return num({
        prompt: `A kite has two equal angles. The other two angles are ${a}° and ${c}°. What is the size of each of the equal angles?`,
        answer: (360 - a - c) / 2,
        suffix: '°',
        hint: 'Angles in a quadrilateral add up to 360°. Take away the two you know, then share what is left.',
        explanation: `360 − ${a} − ${c} = ${360 - a - c}. Shared between two equal angles: ${(360 - a - c) / 2}° each.`,
        errors: [ex('forgot-to-halve', 'There are TWO equal angles, so share the remainder.', 360 - a - c)],
      })
    }
    throw new Error('sh.quad-angle: no candidate')
  }),

  G('sh.quad-property', 'geometry.2d-shapes', [2, 3], (rng, d) => {
    const pool: [string, string][] = [
      ['Square', 'four equal sides and four right angles'],
      ['Rectangle', 'four right angles, with opposite sides equal but adjacent sides different'],
      ['Trapezium', 'exactly one pair of parallel sides'],
      ['Kite', 'two pairs of equal adjacent sides and no parallel sides'],
      ['Rhombus', 'four equal sides, but the angles are not right angles'],
      ['Parallelogram', 'opposite sides equal and parallel, adjacent sides different lengths, no right angles'],
    ]
    const use = d === 2 ? pool.slice(0, 4) : pool
    const [name, desc] = rng.pick(use)
    return choice({
      rng,
      prompt: `Which quadrilateral has ${desc}?`,
      correct: name,
      wrong: pool.filter(([n]) => n !== name).map(([n]) => n),
      hint: 'Think about sides (equal? parallel?) and angles (right angles?).',
      explanation: `A ${name.toLowerCase()} has ${desc}.`,
    })
  }),

  G('sh.special-cases', 'geometry.2d-shapes', [4, 5], (rng) => {
    const pool: [string, boolean, string][] = [
      ['Every square is a rectangle.', true, 'A square has four right angles and opposite sides equal, so it is a special rectangle.'],
      ['Every square is a rhombus.', true, 'A square has four equal sides, so it is a special rhombus.'],
      ['Every rectangle is a parallelogram.', true, 'A rectangle has two pairs of parallel sides, so it is a special parallelogram.'],
      ['Every rhombus is a parallelogram.', true, 'A rhombus has two pairs of parallel sides, so it is a special parallelogram.'],
      ['Every rectangle is a square.', false, 'A rectangle can have different side lengths (e.g. 3 by 5), so it is not always a square.'],
      ['Every parallelogram is a rectangle.', false, 'A parallelogram can lean over with no right angles.'],
      ['Every rhombus is a square.', false, 'A rhombus can have angles that are not 90°.'],
      ['A kite always has four equal sides.', false, 'A kite has two pairs of equal adjacent sides. All four are only equal in the special case of a rhombus.'],
    ]
    const [text, truth, why] = rng.pick(pool)
    return choice({
      rng,
      prompt: `Is this statement always true, or not always true?  “${text}”`,
      correct: truth ? 'Always true' : 'Not always true',
      wrong: [truth ? 'Not always true' : 'Always true'],
      keepOrder: true,
      hint: 'Try to think of an example that breaks the rule.',
      explanation: why,
    })
  }),

  // ============================================ AREA AND PERIMETER (Y7)
  G('ar.rect', 'geometry.area-perimeter', [2, 4], (rng, d) => {
    if (d === 2) {
      const l = rng.pick([4.5, 6.5, 7.5, 8.5, 12.5])
      const w = rng.int(2, 6)
      const ask = rng.chance(0.5)
      return num({
        prompt: `A rectangle is ${l} cm long and ${w} cm wide. What is its ${ask ? 'area' : 'perimeter'}?`,
        figure: { type: 'shape', shape: 'rectangle', labels: { w: `${l} cm`, h: `${w} cm` } },
        answer: ask ? l * w : 2 * (l + w),
        suffix: ask ? 'cm²' : 'cm',
        hint: ask ? 'Area = length × width.' : 'Perimeter = add up all four sides.',
        explanation: ask ? `${l} × ${w} = ${l * w} cm².` : `2 × (${l} + ${w}) = ${2 * (l + w)} cm.`,
        errors: [ex('mixed-area-perimeter', ask ? 'That is the perimeter. Area is length × width.' : 'That is the area. Perimeter is the distance around the edge.', ask ? 2 * (l + w) : l * w)],
      })
    }
    if (d === 3) {
      const s = rng.int(3, 12)
      const l = rng.int(2, 10)
      if (rng.chance(0.5)) {
        return num({
          prompt: `A square has a perimeter of ${4 * s} cm. What is its area?`,
          answer: s * s,
          suffix: 'cm²',
          hint: 'Find one side first: perimeter ÷ 4.',
          explanation: `Side = ${4 * s} ÷ 4 = ${s} cm. Area = ${s} × ${s} = ${s * s} cm².`,
          errors: [ex('gave-side', 'That is the length of one side. Now find the area.', s)],
        })
      }
      const w = rng.int(2, 8)
      const P = 2 * (l + w)
      return num({
        prompt: `A rectangle has a perimeter of ${P} cm and a length of ${l} cm. What is its area?`,
        answer: l * w,
        suffix: 'cm²',
        hint: 'Half the perimeter is length + width. Find the width, then the area.',
        explanation: `Length + width = ${P} ÷ 2 = ${P / 2}, so width = ${P / 2} − ${l} = ${w} cm. Area = ${l} × ${w} = ${l * w} cm².`,
        errors: [ex('gave-width', 'That is the width. Now multiply length × width for the area.', w)],
      })
    }
    const w = rng.int(2, 9)
    return num({
      prompt: `A rectangle has an area of ${3 * w * w} cm². Its length is 3 times its width. What is its perimeter?`,
      answer: 8 * w,
      suffix: 'cm',
      hint: `If the width is w, the length is 3w and the area is 3w × w = 3w². Find w first.`,
      explanation: `3w² = ${3 * w * w} → w² = ${w * w} → w = ${w}. Length = ${3 * w}. Perimeter = 2 × (${w} + ${3 * w}) = ${8 * w} cm.`,
      errors: [ex('gave-area-length', 'Work out the width first, then the length, then the perimeter.', 3 * w)],
    })
  }),

  G('ar.triangle', 'geometry.area-perimeter', [2, 4], (rng, d) => {
    const b = rng.int(3, 14)
    const h = rng.int(3, 12)
    if (d === 2) {
      return num({
        prompt: 'Find the area of this triangle.',
        figure: { type: 'shape', shape: 'triangle', labels: { b: `${b} cm`, h: `${h} cm` } },
        answer: (b * h) / 2,
        suffix: 'cm²',
        hint: 'Area of a triangle = ½ × base × height.',
        explanation: `½ × ${b} × ${h} = ${(b * h) / 2} cm².`,
        errors: [ex('forgot-half', 'A triangle is HALF of a rectangle. Halve base × height.', b * h)],
      })
    }
    if (d === 3) {
      const a = b + rng.int(1, 3)
      const c = h + rng.int(1, 4)
      return num({
        prompt: 'Find the area of this triangle. (Careful: use the perpendicular height.)',
        figure: { type: 'shape', shape: 'triangle', labels: { b: `${b} cm`, h: `${h} cm`, a: `${a} cm`, c: `${c} cm` } },
        answer: (b * h) / 2,
        suffix: 'cm²',
        hint: 'The height must be at right angles to the base. The slanted sides are not the height.',
        explanation: `½ × ${b} × ${h} = ${(b * h) / 2} cm². The slanted sides (${a} and ${c}) are not needed.`,
        errors: [ex('used-slant', 'You used a slanted side. The height is the perpendicular (right-angle) distance.', (b * c) / 2, (a * h) / 2, (a * c) / 2)],
      })
    }
    const bb = b % 2 === 0 ? b : b + 1
    const hh = h
    const A = (bb * hh) / 2
    return num({
      prompt: `A triangle has an area of ${A} cm² and a base of ${bb} cm. What is its perpendicular height?`,
      answer: hh,
      suffix: 'cm',
      hint: 'Double the area to get base × height, then divide by the base.',
      explanation: `2 × ${A} = ${2 * A} = ${bb} × height, so height = ${2 * A} ÷ ${bb} = ${hh} cm.`,
      errors: [ex('forgot-double', 'Area is ½ × base × height, so first DOUBLE the area.', A / bb)],
    })
  }),

  G('ar.l-shape', 'geometry.area-perimeter', [3, 4], (rng, d) => {
    const w = rng.int(7, 14)
    const h = rng.int(6, 12)
    const cw = rng.int(2, w - 3)
    const ch = rng.int(2, h - 3)
    const area = w * h - cw * ch
    if (d === 3) {
      const askArea = rng.chance(0.6)
      return num({
        prompt: askArea ? 'This L-shape is a rectangle with a corner cut out. Find its area.' : 'Find the perimeter of this L-shape.',
        figure: { type: 'shape', shape: 'l-shape', labels: { w: `${w} cm`, h: `${h} cm`, cw: `${cw} cm`, ch: `${ch} cm` } },
        answer: askArea ? area : 2 * (w + h),
        suffix: askArea ? 'cm²' : 'cm',
        hint: askArea ? 'Full rectangle minus the missing corner.' : 'The perimeter of an L-shape equals the perimeter of the rectangle around it.',
        explanation: askArea ? `${w} × ${h} = ${w * h}. Missing corner: ${cw} × ${ch} = ${cw * ch}. ${w * h} − ${cw * ch} = ${area} cm².` : `Same as the rectangle around it: 2 × (${w} + ${h}) = ${2 * (w + h)} cm.`,
        errors: askArea ? [ex('forgot-subtract', 'You found the full rectangle. Take away the missing corner.', w * h)] : [ex('added-only-labels', 'The perimeter of an L-shape equals the perimeter of its bounding rectangle (the notch does not change it).', w + h + cw + ch, w + h + cw + ch + (w - cw) + (h - ch))],
      })
    }
    const top = w - cw
    const right = h - ch
    return num({
      prompt: 'Find the area of this L-shape. Some lengths are missing, so you will need to work them out.',
      figure: { type: 'shape', shape: 'l-shape', labels: { w: `${w} cm`, h: `${h} cm`, top: `${top} cm`, right: `${right} cm` } },
      answer: area,
      suffix: 'cm²',
      hint: 'Work out the size of the missing corner (its sides are the differences), then subtract from the big rectangle.',
      explanation: `Missing corner: ${w} − ${top} = ${cw} by ${h} − ${right} = ${ch}. Area = ${w} × ${h} − ${cw} × ${ch} = ${w * h} − ${cw * ch} = ${area} cm².`,
      errors: [ex('forgot-subtract', 'You found the full rectangle. Take away the missing corner.', w * h), ex('added-parts', 'You added labelled lengths instead of using areas. Split the shape into rectangles.', top * right)],
    })
  }),

  G('ar.compound', 'geometry.area-perimeter', [4, 5], (rng, d) => {
    if (d === 4) {
      const w = rng.int(4, 12) * 2
      const h = rng.int(3, 8)
      const th = rng.int(2, 7)
      return num({
        prompt: `A house front is a rectangle ${w} m wide and ${h} m tall, with a triangular roof on top. The roof has a base of ${w} m and a height of ${th} m. What is the total area?`,
        answer: w * h + (w * th) / 2,
        suffix: 'm²',
        hint: 'Rectangle + triangle.',
        explanation: `Rectangle: ${w} × ${h} = ${w * h}. Triangle: ½ × ${w} × ${th} = ${(w * th) / 2}. Total = ${w * h + (w * th) / 2} m².`,
        errors: [ex('forgot-half', 'The roof is a TRIANGLE, so halve base × height.', w * h + w * th)],
      })
    }
    const w = rng.int(10, 20)
    const h = rng.int(6, 12)
    const pw = rng.int(2, 5)
    const ph = rng.int(2, 4)
    const grass = w * h - pw * ph
    const rate = rng.pick([1.5, 2, 2.5, 3.2])
    const cost = grass * rate
    return num({
      prompt: `A garden is ${w} m by ${h} m. It has a rectangular pond ${pw} m by ${ph} m. The rest is turf. Turf costs ${money(rate)} per m². How much does it cost to turf the garden?`,
      answer: cost,
      prefix: '£',
      hint: 'Turf area = garden − pond. Then multiply by the cost per m².',
      explanation: `Garden ${w * h} m² − pond ${pw * ph} m² = ${grass} m². ${grass} × ${rate} = ${money(cost)}.`,
      errors: [ex('forgot-pond', 'You turfed the pond too. Take its area away first.', w * h * rate)],
    })
  }),

  G('ar.units', 'geometry.area-perimeter', [3, 4], (rng, d) => {
    if (d === 3) {
      const a = rng.pick([2, 3, 2.5, 1.5, 4])
      return num({
        prompt: `Convert ${a} m² into cm².`,
        answer: a * 10000,
        suffix: 'cm²',
        hint: '1 m = 100 cm, so 1 m² = 100 × 100 cm².',
        explanation: `1 m² = 100 cm × 100 cm = 10 000 cm². ${a} × 10 000 = ${a * 10000} cm².`,
        errors: [ex('times-100', 'Areas use two lengths, so multiply by 100 twice (× 10 000), not just once.', a * 100)],
      })
    }
    const l = rng.pick([4, 6, 8])
    const w = rng.pick([3, 5])
    const tile = rng.pick([50, 25])
    const tiles = (l * w * 10000) / (tile * tile)
    return num({
      prompt: `A floor is ${l} m by ${w} m. It is covered with square tiles of side ${tile} cm. How many tiles are needed?`,
      answer: tiles,
      hint: 'Convert to the same units first. Compare areas, or count how many tiles fit along each side.',
      explanation: `Along the length: ${l * 100} ÷ ${tile} = ${(l * 100) / tile}. Along the width: ${w * 100} ÷ ${tile} = ${(w * 100) / tile}. Tiles = ${(l * 100) / tile} × ${(w * 100) / tile} = ${tiles}.`,
      errors: [ex('wrong-units', 'The floor is in metres and the tiles are in centimetres. Convert them to the same unit.', l * w / tile, (l * w * 100) / (tile * tile))],
    })
  }),

  // ================================================= NOTATION (Y7)
  G('no.angle-vertex', 'geometry.notation', [1, 2], (rng, d) => {
    const [p, q, r] = threeLetters(rng)
    if (d === 1) {
      return choice({
        rng,
        prompt: `In the name ∠${p}${q}${r}, which letter is at the corner (vertex) where the angle is?`,
        correct: q,
        wrong: [p, r],
        hint: 'The middle letter names the corner. The outer letters name the two arms.',
        explanation: `In ∠${p}${q}${r} the angle is at ${q}, between the lines ${q}${p} and ${q}${r}.`,
      })
    }
    return choice({
      rng,
      prompt: `Triangle ${p}${q}${r}. Which angle is at corner ${p}?`,
      correct: `∠${q}${p}${r}`,
      wrong: [`∠${p}${q}${r}`, `∠${p}${r}${q}`],
      hint: 'The corner letter goes in the middle.',
      explanation: `The corner letter goes in the middle: ∠${q}${p}${r} (or ∠${r}${p}${q}).`,
    })
  }),

  G('no.marks', 'geometry.notation', [1, 3], (rng, d) => {
    const pool: [string, string][] = [
      ['A small square drawn in the corner of an angle', 'It is a right angle (90°)'],
      ['The same number of dashes on two sides', 'Those sides are equal in length'],
      ['The same number of arrows on two lines', 'Those lines are parallel'],
      ['The same number of small arcs on two angles', 'Those angles are equal'],
    ]
    const [sym, meaning] = rng.pick(pool)
    const others = pool.filter(([s]) => s !== sym).map(([, mm]) => mm)
    return choice({
      rng,
      prompt: `In a diagram, what does this mean?  ${sym}`,
      correct: meaning,
      wrong: d === 1 ? rng.shuffle(others).slice(0, 2) : others,
      hint: 'These are standard markings mathematicians use so we do not need to write everything in words.',
      explanation: `${sym}: ${meaning.charAt(0).toLowerCase()}${meaning.slice(1)}.`,
    })
  }),

  G('no.name-angle', 'geometry.notation', [2, 3], (rng, d) => {
    const [p, q, r] = threeLetters(rng)
    if (d === 2) {
      return choice({
        rng,
        prompt: `Triangle ${p}${q}${r}. Which is the correct name for the angle at ${q}?`,
        correct: `∠${p}${q}${r}`,
        wrong: [`∠${q}${p}${r}`, `∠${p}${r}${q}`, `∠${q}${r}${p}`],
        hint: 'The letter at the corner must be in the middle.',
        explanation: `The corner is ${q}, so it goes in the middle: ∠${p}${q}${r}.`,
      })
    }
    return choice({
      rng,
      prompt: `In triangle ${p}${q}${r}, which side is opposite the angle at ${p}?`,
      correct: `${q}${r}`,
      wrong: [`${p}${q}`, `${p}${r}`],
      hint: 'The opposite side is the one that does NOT touch that corner.',
      explanation: `${p}${q} and ${p}${r} both touch ${p}. The side opposite is ${q}${r}.`,
    })
  }),

  G('no.symbols', 'geometry.notation', [3, 4], (rng, d) => {
    const bank: [string, string, string][] = [
      ['AB ∥ CD', 'Line AB is parallel to line CD', 'The symbol ∥ means parallel.'],
      ['AB ⊥ CD', 'Line AB is perpendicular (at right angles) to line CD', 'The symbol ⊥ means perpendicular: the lines meet at 90°.'],
      ['AB = CD', 'Line AB is the same length as line CD', 'An equals sign between two line names means they have the same length.'],
    ]
    const use = d === 3 ? bank.slice(0, 2) : bank
    const [sym, meaning, why] = rng.pick(use)
    return choice({
      rng,
      prompt: `In a geometry question, what does  ${sym}  mean?`,
      correct: meaning,
      wrong: bank.filter((b) => b[0] !== sym).map((b) => b[1]).concat('Angle ABC is a right angle'),
      hint: 'These are standard symbols. Think about what each looks like.',
      explanation: why,
    })
  }),

  // =========================================== PARALLEL LINES (Y8)
  G('pl.find', 'geometry.parallel-lines', [1, 3], (rng, d) => {
    const p = ANGLE_STEP(rng, 40, 140)
    const kind = rng.chance(0.5) ? ('parallel-alternate' as const) : ('parallel-corresponding' as const)
    const name = kind === 'parallel-alternate' ? 'alternate' : 'corresponding'
    if (d === 1) {
      return num({
        prompt: `The two lines with arrows are parallel. The marked angles are ${name} angles. Work out x.`,
        figure: { type: 'angles', kind, labels: { p: deg(p), q: 'x' } },
        answer: p,
        suffix: '°',
        hint: `${name.charAt(0).toUpperCase()}${name.slice(1)} angles between parallel lines are equal.`,
        explanation: `${name.charAt(0).toUpperCase()}${name.slice(1)} angles are equal, so x = ${p}°.`,
        errors: [ex('used-supplementary', `${name.charAt(0).toUpperCase()}${name.slice(1)} angles are EQUAL, not 180° minus.`, 180 - p)],
      })
    }
    if (d === 2) {
      return num({
        prompt: 'The two lines with arrows are parallel. Work out x.',
        figure: { type: 'angles', kind, labels: { p: deg(p), q: 'x' } },
        answer: p,
        suffix: '°',
        hint: kind === 'parallel-alternate' ? 'Look for a Z shape.' : 'Look for an F shape.',
        explanation: `These are ${name} angles (${kind === 'parallel-alternate' ? 'Z' : 'F'} shape) between parallel lines, so they are equal: x = ${p}°.`,
        errors: [ex('used-supplementary', 'These angles are equal, not supplementary.', 180 - p)],
      })
    }
    return num({
      prompt: 'The two lines with arrows are parallel. Work out x.',
      figure: { type: 'angles', kind, labels: { p: deg(p), r: 'x' } },
      answer: 180 - p,
      suffix: '°',
      hint: `Step 1: find the ${name} angle to ${p}°. Step 2: use angles on a straight line to find x.`,
      explanation: `The angle at the lower line is ${p}° (${name} angles are equal). x is on a straight line with it: 180° − ${p}° = ${180 - p}°.`,
      errors: [ex('stopped-at-step-1', `${p}° is the ${name} angle. But x is next to it on a straight line, so take it from 180°.`, p)],
    })
  }),

  G('pl.reason', 'geometry.parallel-lines', [2, 3], (rng, d) => {
    const p = ANGLE_STEP(rng, 40, 140)
    const kind = rng.chance(0.5) ? ('parallel-alternate' as const) : ('parallel-corresponding' as const)
    const right = kind === 'parallel-alternate' ? 'Alternate angles are equal' : 'Corresponding angles are equal'
    const all = ['Alternate angles are equal', 'Corresponding angles are equal', 'Vertically opposite angles are equal', 'Angles on a straight line add up to 180°']
    return choice({
      rng,
      prompt: d === 2 ? `The lines with arrows are parallel. Why is x = ${p}°?` : `The lines with arrows are parallel. Which reason should you give for x = ${p}°?`,
      figure: { type: 'angles', kind, labels: { p: deg(p), q: 'x' } },
      correct: right,
      wrong: all.filter((a) => a !== right),
      hint: kind === 'parallel-alternate' ? 'The angles form a Z shape.' : 'The angles form an F shape.',
      explanation: `${right} (${kind === 'parallel-alternate' ? 'Z' : 'F'} shape), so x = ${p}°.`,
    })
  }),

  G('pl.algebra', 'geometry.parallel-lines', [4, 5], (rng, d) => {
    if (d === 5 && rng.chance(0.5)) {
      // p equals q (alternate/corresponding), r is on a straight line with q: (a x + b) + (c x + e) = 180
      for (let g = 0; g < 500; g++) {
        const x = rng.int(10, 40)
        const a = rng.int(1, 3)
        const c = rng.int(1, 3)
        const b = rng.pick([0, 10, 20, -10, -20])
        const e = 180 - b - (a + c) * x
        if (Math.abs(e) > 60 || a * x + b < 20 || c * x + e < 20) continue
        return num({
          prompt: 'The two lines with arrows are parallel. Work out the value of x.',
          figure: { type: 'angles', kind: rng.chance(0.5) ? 'parallel-alternate' : 'parallel-corresponding', labels: { p: lab(a, b), r: lab(c, e) } },
          prefix: 'x =',
          answer: x,
          hint: 'The first angle equals the angle at the lower line (parallel lines). That angle and the second one are on a straight line, so they add to 180.',
          explanation: `${br(a, b)} + ${br(c, e)} = 180 → ${lin(a + c, b + e)} = 180 → x = ${x}.`,
        })
      }
    }
    for (let g = 0; g < 500; g++) {
      const x = rng.int(8, 30)
      const a = rng.int(2, 5)
      const c = rng.int(1, a - 1)
      const b = rng.pick([-20, -10, 0, 10, 20])
      const e = a * x + b - c * x
      const ang = a * x + b
      if (Math.abs(e) > 60 || ang < 30 || ang > 160 || e === b) continue
      const kind = rng.chance(0.5) ? ('parallel-alternate' as const) : ('parallel-corresponding' as const)
      const fig: Figure = { type: 'angles', kind, labels: { p: lab(a, b), q: lab(c, e) } }
      const why = kind === 'parallel-alternate' ? 'alternate' : 'corresponding'
      if (d === 4) {
        return num({
          prompt: 'The two lines with arrows are parallel. Work out the value of x.',
          figure: fig,
          prefix: 'x =',
          answer: x,
          hint: `${why.charAt(0).toUpperCase()}${why.slice(1)} angles are equal. Write an equation with = between the two expressions.`,
          explanation: `${lin(a, b)} = ${lin(c, e)} → ${coef(a - c)}x = ${e - b} → x = ${x}.`,
          errors: [ex('added-to-180', `${why.charAt(0).toUpperCase()}${why.slice(1)} angles are equal, not adding to 180.`, round((180 - b - e) / (a + c), 3))],
        })
      }
      return multi({
        prompt: 'The two lines with arrows are parallel. Work out the value of x and the size of the angles.',
        figure: fig,
        fields: [{ answer: x }, { answer: ang }],
        template: 'x = {0}    angle = {1}°',
        hint: 'Set the two expressions equal, solve for x, then substitute back.',
        explanation: `${lin(a, b)} = ${lin(c, e)} → ${coef(a - c)}x = ${e - b} → x = ${x}. Angle = ${a} × ${x}${b ? ` ${b < 0 ? '−' : '+'} ${Math.abs(b)}` : ''} = ${ang}°.`,
      })
    }
    throw new Error('pl.algebra: no candidate')
  }),
]
