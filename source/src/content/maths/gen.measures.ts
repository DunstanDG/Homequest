import type { ItemGenerator } from '@/engine/registry'
import type { CommonError } from '@/engine/types'
import { G, choice, num, round, sup } from './helpers'

const ex = (tag: string, message: string, ...values: number[]): CommonError => ({ tag, message, values })

const PI = 3.14
/** Students may use 3.14 or their calculator's pi: accept about half a percent either side (capped). */
const piTol = (answer: number) => Math.min(Math.abs(answer) * 0.005 + 0.05, 4)
const piNote = 'Use π = 3.14 (or your calculator’s π). Give your answer to 1 decimal place, or as accurately as you like.'

export const measuresGenerators: ItemGenerator[] = [
  // =========================================== CIRCLES & TRAPEZIUMS (Y8)
  G('ct.formula', 'geometry.circles-trapeziums', [1, 2], (rng, d) => {
    const which = d === 1 ? rng.pick(['c-r', 'c-d', 'a-r'] as const) : rng.pick(['c-r', 'c-d', 'a-r', 'parts'] as const)
    if (which === 'c-r') {
      return choice({
        rng,
        prompt: 'A circle has radius r. Which formula gives its circumference?',
        correct: '2πr',
        wrong: [`π${sup('r', 2)}`, 'πr', `2π${sup('r', 2)}`],
        hint: 'Circumference is the distance around the circle.',
        explanation: 'Circumference = 2 × π × radius, or π × diameter.',
      })
    }
    if (which === 'c-d') {
      return choice({
        rng,
        prompt: 'A circle has diameter d. Which formula gives its circumference?',
        correct: 'πd',
        wrong: [`π${sup('d', 2)}`, '2πd', 'π + d'],
        hint: 'The circumference is a bit more than 3 times the diameter.',
        explanation: 'Circumference = π × diameter, because the circumference is about 3.14 times the diameter.',
      })
    }
    if (which === 'a-r') {
      return choice({
        rng,
        prompt: 'A circle has radius r. Which formula gives its AREA?',
        correct: `π${sup('r', 2)}`,
        wrong: ['2πr', 'πd', '(πr)^{2}'],
        hint: 'Area involves multiplying two lengths together, so r appears squared.',
        explanation: `Area = π × radius squared = π${sup('r', 2)}.`,
      })
    }
    const parts: [string, string, string[]][] = [
      ['the distance across a circle through its centre', 'diameter', ['radius', 'circumference', 'chord']],
      ['the distance around the edge of a circle', 'circumference', ['diameter', 'radius', 'area']],
      ['the distance from the centre of a circle to its edge', 'radius', ['diameter', 'circumference', 'arc']],
    ]
    const [desc, right, wrong] = rng.pick(parts)
    return choice({ rng, prompt: `What is the name for ${desc}?`, correct: right, wrong, hint: 'Think about which part of the circle is being described.', explanation: `It is called the ${right}.` })
  }),

  G('ct.radius', 'geometry.circles-trapeziums', [1, 2], (rng, d) => {
    const r = rng.int(2, 15)
    const toRadius = rng.chance(0.5)
    if (d === 1 || toRadius) {
      return num({
        prompt: `A circle has diameter ${2 * r} cm. What is its radius?`,
        figure: { type: 'shape', shape: 'circle', labels: { d: `${2 * r} cm` } },
        answer: r,
        suffix: 'cm',
        hint: 'The radius is half the diameter.',
        explanation: `${2 * r} ÷ 2 = ${r} cm.`,
        errors: [ex('doubled', 'The radius is HALF the diameter, not double.', 4 * r)],
      })
    }
    return num({
      prompt: `A circle has radius ${r} cm. What is its diameter?`,
      figure: { type: 'shape', shape: 'circle', labels: { r: `${r} cm` } },
      answer: 2 * r,
      suffix: 'cm',
      hint: 'The diameter is twice the radius.',
      explanation: `${r} × 2 = ${2 * r} cm.`,
      errors: [ex('halved', 'The diameter is DOUBLE the radius.', r / 2)],
    })
  }),

  G('ct.circumference', 'geometry.circles-trapeziums', [2, 5], (rng, d) => {
    if (d === 2) {
      const r = rng.int(2, 12)
      const C = round(2 * PI * r, 2)
      return num({
        prompt: `A circle has radius ${r} cm. Work out its circumference. ${piNote}`,
        figure: { type: 'shape', shape: 'circle', labels: { r: `${r} cm` } },
        answer: C,
        tolerance: piTol(C),
        suffix: 'cm',
        hint: 'Circumference = 2 × π × radius.',
        explanation: `2 × 3.14 × ${r} = ${C} cm.`,
        errors: [ex('used-area-formula', 'That uses π × r², the AREA formula. Circumference is 2 × π × r.', round(PI * r * r, 2)), ex('forgot-2', 'Circumference is 2πr, so double the radius too.', round(PI * r, 2))],
      })
    }
    if (d === 3) {
      const dia = rng.int(3, 20)
      const C = round(PI * dia, 2)
      return num({
        prompt: `A circle has diameter ${dia} cm. Work out its circumference. ${piNote}`,
        figure: { type: 'shape', shape: 'circle', labels: { d: `${dia} cm` } },
        answer: C,
        tolerance: piTol(C),
        suffix: 'cm',
        hint: 'Circumference = π × diameter.',
        explanation: `3.14 × ${dia} = ${C} cm.`,
        errors: [ex('doubled-diameter', 'With the diameter you use π × d. Multiplying by 2 as well is only for the radius.', round(2 * PI * dia, 2)), ex('used-area-formula', 'That uses the AREA formula.', round(PI * dia * dia, 2))],
      })
    }
    if (d === 4) {
      const dia = rng.int(4, 20)
      const C = round(PI * dia, 2)
      const wantRadius = rng.chance(0.5)
      return num({
        prompt: `A circle has a circumference of ${C} cm. Work out its ${wantRadius ? 'radius' : 'diameter'}. Use π = 3.14.`,
        answer: wantRadius ? dia / 2 : dia,
        tolerance: 0.1,
        suffix: 'cm',
        hint: 'Work backwards: divide the circumference by π to get the diameter.',
        explanation: `Diameter = ${C} ÷ 3.14 = ${dia} cm${wantRadius ? `, so radius = ${dia} ÷ 2 = ${dia / 2} cm` : ''}.`,
        errors: [ex('multiplied-not-divided', 'To go backwards from the circumference, DIVIDE by π.', round(C * PI, 1)), ...(wantRadius ? [ex('gave-diameter', 'That is the diameter. The radius is half of it.', dia)] : [])],
      })
    }
    const dia = rng.pick([4, 6, 8, 10, 12, 14, 20])
    const P = round((PI * dia) / 2 + dia, 2)
    return num({
      prompt: `A semicircle has diameter ${dia} cm. Work out its perimeter, including the straight edge. Use π = 3.14.`,
      answer: P,
      tolerance: piTol(P),
      suffix: 'cm',
      hint: 'Half of the circumference, plus the straight edge (the diameter).',
      explanation: `Curved edge: 3.14 × ${dia} ÷ 2 = ${round((PI * dia) / 2, 2)}. Add the straight edge: ${round((PI * dia) / 2, 2)} + ${dia} = ${P} cm.`,
      errors: [ex('forgot-straight-edge', 'You found the curved part only. The perimeter also includes the straight edge.', round((PI * dia) / 2, 2)), ex('forgot-halve', 'A semicircle has HALF the circumference (plus the straight edge).', round(PI * dia + dia, 2))],
    })
  }),

  G('ct.area-circle', 'geometry.circles-trapeziums', [3, 5], (rng, d) => {
    if (d === 3) {
      const r = rng.int(2, 10)
      const A = round(PI * r * r, 2)
      return num({
        prompt: `A circle has radius ${r} cm. Work out its area. ${piNote}`,
        figure: { type: 'shape', shape: 'circle', labels: { r: `${r} cm` } },
        answer: A,
        tolerance: piTol(A),
        suffix: 'cm²',
        hint: 'Area = π × r × r. Square the radius first.',
        explanation: `${r}² = ${r * r}. 3.14 × ${r * r} = ${A} cm².`,
        errors: [ex('used-circumference', 'That is 2πr, the CIRCUMFERENCE formula. Area = π × r².', round(2 * PI * r, 2)), ex('squared-after', 'Square ONLY the radius, then multiply by π. (π × r)² is not the same.', round((PI * r) ** 2, 2)), ex('doubled-not-squared', 'r² means r × r, not r × 2.', round(PI * r * 2, 2))],
      })
    }
    if (d === 4) {
      const r = rng.int(2, 9)
      const A = round(PI * r * r, 2)
      return num({
        prompt: `A circle has diameter ${2 * r} cm. Work out its area. ${piNote}`,
        figure: { type: 'shape', shape: 'circle', labels: { d: `${2 * r} cm` } },
        answer: A,
        tolerance: piTol(A),
        suffix: 'cm²',
        hint: 'The formula needs the RADIUS, and you are given the diameter.',
        explanation: `Radius = ${2 * r} ÷ 2 = ${r} cm. Area = 3.14 × ${r}² = ${A} cm².`,
        errors: [ex('used-diameter', 'You used the diameter in πr². Halve it to get the radius first.', round(PI * (2 * r) ** 2, 2))],
      })
    }
    const r = rng.int(2, 8)
    const semi = rng.chance(0.5)
    const A = round((PI * r * r) / (semi ? 2 : 4), 2)
    return num({
      prompt: `Work out the area of a ${semi ? 'semicircle' : 'quarter circle'} with radius ${r} cm. Use π = 3.14.`,
      answer: A,
      tolerance: piTol(A),
      suffix: 'cm²',
      hint: `Find the area of the whole circle first, then ${semi ? 'halve' : 'quarter'} it.`,
      explanation: `Whole circle: 3.14 × ${r}² = ${round(PI * r * r, 2)}. ${semi ? 'Half' : 'A quarter'} of that is ${A} cm².`,
      errors: [ex('whole-circle', `You found the whole circle. Take ${semi ? 'half' : 'a quarter'} of it.`, round(PI * r * r, 2))],
    })
  }),

  G('ct.trapezium', 'geometry.circles-trapeziums', [3, 5], (rng, d) => {
    const a = rng.int(3, 9)
    const b = a + rng.int(2, 6)
    const h = rng.int(3, 10)
    const A = ((a + b) * h) / 2
    if (d === 3) {
      return num({
        prompt: 'Find the area of this trapezium.',
        figure: { type: 'shape', shape: 'trapezium', labels: { a: `${a} cm`, b: `${b} cm`, h: `${h} cm` } },
        answer: A,
        suffix: 'cm²',
        hint: 'Area = ½ × (sum of the parallel sides) × height.',
        explanation: `½ × (${a} + ${b}) × ${h} = ½ × ${a + b} × ${h} = ${A} cm².`,
        errors: [ex('forgot-half', 'Remember the ½: the area is half of (a + b) × h.', (a + b) * h), ex('multiplied-sides', 'ADD the two parallel sides (do not multiply them).', (a * b * h) / 2)],
      })
    }
    if (d === 4) {
      const c = h + rng.int(1, 3)
      return num({
        prompt: 'Find the area of this trapezium. (The slanted side is not needed.)',
        figure: { type: 'shape', shape: 'trapezium', labels: { a: `${a} cm`, b: `${b} cm`, h: `${h} cm`, c: `${c} cm` } },
        answer: A,
        suffix: 'cm²',
        hint: 'Use the two PARALLEL sides and the perpendicular height.',
        explanation: `½ × (${a} + ${b}) × ${h} = ${A} cm². The slanted side (${c} cm) is not part of the formula.`,
        errors: [ex('used-slant', 'You used the slanted side. Use the perpendicular height.', ((a + b) * c) / 2)],
      })
    }
    const findB = rng.chance(0.5)
    if (findB) {
      return num({
        prompt: `A trapezium has area ${A} cm². Its parallel sides are ${a} cm and b cm, and the distance between them is ${h} cm. Work out b.`,
        answer: b,
        suffix: 'cm',
        hint: `Area = ½ × (${a} + b) × ${h}. Double the area first, divide by ${h}, then subtract ${a}.`,
        explanation: `2 × ${A} = ${2 * A}. ${2 * A} ÷ ${h} = ${a + b}. b = ${a + b} − ${a} = ${b} cm.`,
        errors: [ex('stopped-early', `${a + b} is a + b. Take away ${a} to find b.`, a + b)],
      })
    }
    return num({
      prompt: `A trapezium has parallel sides ${a} cm and ${b} cm and an area of ${A} cm². Work out the distance between the parallel sides (its height).`,
      answer: h,
      suffix: 'cm',
      hint: 'Double the area, then divide by the sum of the parallel sides.',
      explanation: `2 × ${A} = ${2 * A}. ${2 * A} ÷ (${a} + ${b}) = ${2 * A} ÷ ${a + b} = ${h} cm.`,
      errors: [ex('forgot-double', 'Area is ½ × (a + b) × h, so double the area first.', A / (a + b))],
    })
  }),

  // ============================================== 3D SHAPES & VOLUME (Y8)
  G('vo.cuboid', 'geometry.volume', [1, 4], (rng, d) => {
    if (d === 1) {
      const l = rng.int(2, 8)
      const w = rng.int(2, 6)
      const h = rng.int(2, 6)
      return num({
        prompt: 'Find the volume of this cuboid.',
        figure: { type: 'shape', shape: 'cuboid', labels: { l: `${l} cm`, w: `${w} cm`, h: `${h} cm` } },
        answer: l * w * h,
        suffix: 'cm³',
        hint: 'Volume = length × width × height.',
        explanation: `${l} × ${w} × ${h} = ${l * w * h} cm³.`,
        errors: [ex('added', 'Volume is found by MULTIPLYING the three lengths.', l + w + h), ex('area-only', 'That is the area of one face. Multiply by the third length as well.', l * w)],
      })
    }
    if (d === 2) {
      const s = rng.int(2, 9)
      return num({
        prompt: `A cube has sides of ${s} cm. What is its volume?`,
        answer: s ** 3,
        suffix: 'cm³',
        hint: 'A cube has all three lengths equal: side × side × side.',
        explanation: `${s} × ${s} × ${s} = ${s ** 3} cm³.`,
        errors: [ex('times-3', 'Volume of a cube is side CUBED (s × s × s), not s × 3.', s * 3), ex('squared', 'That is the area of one face. Multiply by the side once more.', s * s)],
      })
    }
    if (d === 3) {
      const l = rng.int(3, 9)
      const w = rng.int(2, 6)
      const h = rng.int(2, 8)
      return num({
        prompt: `A cuboid has volume ${l * w * h} cm³. Its length is ${l} cm and its width is ${w} cm. What is its height?`,
        answer: h,
        suffix: 'cm',
        hint: 'Height = volume ÷ (length × width).',
        explanation: `${l} × ${w} = ${l * w}. ${l * w * h} ÷ ${l * w} = ${h} cm.`,
        errors: [ex('gave-base', 'That is the area of the base. Divide the volume by it to get the height.', l * w)],
      })
    }
    const l = rng.int(3, 9)
    const w = rng.int(2, 6)
    const h = rng.int(2, 7)
    return num({
      prompt: 'Find the total surface area of this cuboid.',
      figure: { type: 'shape', shape: 'cuboid', labels: { l: `${l} cm`, w: `${w} cm`, h: `${h} cm` } },
      answer: 2 * (l * w + l * h + w * h),
      suffix: 'cm²',
      hint: 'A cuboid has 6 faces in 3 matching pairs. Find each different face, double them, and add.',
      explanation: `${l}×${w} = ${l * w}, ${l}×${h} = ${l * h}, ${w}×${h} = ${w * h}. Sum = ${l * w + l * h + w * h}. Doubled = ${2 * (l * w + l * h + w * h)} cm².`,
      errors: [ex('forgot-double', 'There are TWO of each face. Double your total.', l * w + l * h + w * h), ex('gave-volume', 'That is the volume. Surface area means the area of all the outside faces.', l * w * h)],
    })
  }),

  G('vo.capacity', 'geometry.volume', [3, 4], (rng, d) => {
    if (d === 3) {
      const l = rng.pick([20, 25, 40, 50])
      const w = rng.pick([20, 30, 40])
      const h = rng.pick([10, 20, 25, 50])
      const vol = l * w * h
      return num({
        prompt: `A fish tank measures ${l} cm by ${w} cm by ${h} cm. How many litres of water does it hold when full? (1 litre = 1000 cm³)`,
        answer: vol / 1000,
        suffix: 'litres',
        hint: 'Find the volume in cm³ first, then divide by 1000.',
        explanation: `${l} × ${w} × ${h} = ${vol} cm³. ${vol} ÷ 1000 = ${vol / 1000} litres.`,
        errors: [ex('forgot-convert', 'That is in cm³. Divide by 1000 to get litres.', vol)],
      })
    }
    const l = rng.pick([2, 3, 4])
    const w = rng.pick([1, 1.5, 2])
    const h = rng.pick([1, 2])
    return num({
      prompt: `A water tank is ${l} m long, ${w} m wide and ${h} m deep. How many litres does it hold when full? (1 m³ = 1000 litres)`,
      answer: l * w * h * 1000,
      suffix: 'litres',
      hint: 'Find the volume in m³, then multiply by 1000.',
      explanation: `${l} × ${w} × ${h} = ${l * w * h} m³. × 1000 = ${l * w * h * 1000} litres.`,
      errors: [ex('forgot-convert', 'That is in m³. Multiply by 1000 to get litres.', l * w * h)],
    })
  }),

  G('vo.prism', 'geometry.volume', [3, 4], (rng, d) => {
    if (d === 3) {
      const b = rng.int(2, 4) * 2
      const h = rng.int(2, 8)
      const l = rng.int(3, 12)
      const A = (b * h) / 2
      return num({
        prompt: 'This prism has a triangular cross-section. Find its volume.',
        figure: { type: 'shape', shape: 'prism', labels: { b: `${b} cm`, h: `${h} cm`, l: `${l} cm` } },
        answer: A * l,
        suffix: 'cm³',
        hint: 'Volume of a prism = area of cross-section × length.',
        explanation: `Cross-section: ½ × ${b} × ${h} = ${A} cm². Volume = ${A} × ${l} = ${A * l} cm³.`,
        errors: [ex('forgot-half', 'The cross-section is a TRIANGLE, so halve b × h first.', b * h * l), ex('area-only', 'That is the area of the cross-section. Multiply by the length.', A)],
      })
    }
    const a = rng.int(3, 6)
    const b = a + rng.int(2, 4)
    const h = rng.int(2, 6)
    const l = rng.int(4, 10)
    const A = ((a + b) * h) / 2
    return num({
      prompt: `A prism has a trapezium cross-section with parallel sides ${a} cm and ${b} cm, and height ${h} cm. The prism is ${l} cm long. Find its volume.`,
      answer: A * l,
      suffix: 'cm³',
      hint: 'Find the area of the trapezium, then multiply by the length.',
      explanation: `Cross-section: ½ × (${a} + ${b}) × ${h} = ${A} cm². Volume = ${A} × ${l} = ${A * l} cm³.`,
      errors: [ex('forgot-length', 'That is the area of the cross-section. Multiply by the length of the prism.', A)],
    })
  }),

  G('vo.cylinder', 'geometry.volume', [4, 5], (rng, d) => {
    const r = rng.int(2, 6)
    const h = rng.int(3, 10)
    if (d === 4) {
      const V = round(PI * r * r * h, 2)
      return num({
        prompt: `Find the volume of this cylinder. ${piNote}`,
        figure: { type: 'shape', shape: 'cylinder', labels: { r: `${r} cm`, h: `${h} cm` } },
        answer: V,
        tolerance: piTol(V),
        suffix: 'cm³',
        hint: 'Volume = area of the circular end × height = πr² × h.',
        explanation: `Circle: 3.14 × ${r}² = ${round(PI * r * r, 2)}. × ${h} = ${V} cm³.`,
        errors: [ex('forgot-height', 'That is the area of the circular end. Multiply by the height.', round(PI * r * r, 2)), ex('used-circumference', 'You used 2πr for the end. Volume needs the AREA πr².', round(2 * PI * r * h, 2))],
      })
    }
    if (rng.chance(0.5)) {
      const V = round(PI * r * r * h, 2)
      return num({
        prompt: `A cylinder has diameter ${2 * r} cm and height ${h} cm. Find its volume. Use π = 3.14.`,
        figure: { type: 'shape', shape: 'cylinder', labels: { d: `${2 * r} cm`, h: `${h} cm` } },
        answer: V,
        tolerance: piTol(V),
        suffix: 'cm³',
        hint: 'You are given the diameter. Halve it to get the radius.',
        explanation: `Radius = ${r} cm. Volume = 3.14 × ${r}² × ${h} = ${V} cm³.`,
        errors: [ex('used-diameter', 'You used the diameter as the radius.', round(PI * (2 * r) ** 2 * h, 2))],
      })
    }
    const SA = round(2 * PI * r * r + 2 * PI * r * h, 2)
    return num({
      prompt: `Find the total surface area of a cylinder with radius ${r} cm and height ${h} cm (including both circular ends). Use π = 3.14.`,
      figure: { type: 'shape', shape: 'cylinder', labels: { r: `${r} cm`, h: `${h} cm` } },
      answer: SA,
      tolerance: piTol(SA),
      suffix: 'cm²',
      hint: 'Two circles + a curved rectangle. The rectangle is as long as the circumference.',
      explanation: `Two ends: 2 × 3.14 × ${r}² = ${round(2 * PI * r * r, 2)}. Curved surface: 2 × 3.14 × ${r} × ${h} = ${round(2 * PI * r * h, 2)}. Total = ${SA} cm².`,
      errors: [ex('forgot-ends', 'You found the curved surface only. Add the two circular ends.', round(2 * PI * r * h, 2)), ex('one-end', 'There are TWO circular ends.', round(PI * r * r + 2 * PI * r * h, 2))],
    })
  }),
]
