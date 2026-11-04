import type { ItemGenerator } from '@/engine/registry'
import type { CommonError, Figure, Rng } from '@/engine/types'
import { G, choice, m, mp, multi } from './helpers'

type P = [number, number]
const ex = (tag: string, message: string, ...values: number[]): CommonError => ({ tag, message, values })
const pt = (p: P) => `(${m(p[0])}, ${m(p[1])})`
const same = (a: P, b: P) => a[0] === b[0] && a[1] === b[1]

/** A scalene triangle with integer vertices and no sliver shapes. */
function scalene(rng: Rng, lo: number, hi: number): P[] {
  const d2 = (p: P, q: P) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2
  for (let g = 0; g < 1000; g++) {
    const pts: P[] = [0, 1, 2].map(() => [rng.int(lo, hi), rng.int(lo, hi)] as P)
    const [a, b, c] = pts as [P, P, P]
    const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
    if (Math.abs(cross) < 6) continue
    if (new Set([d2(a, b), d2(b, c), d2(a, c)]).size < 3) continue
    return pts
  }
  return [
    [lo, lo],
    [lo + 3, lo],
    [lo, lo + 2],
  ]
}

type Op = { name: string; f: (p: P) => P }
const translate = (dx: number, dy: number): Op => ({ name: `Translation ${dx === 0 ? '' : `${Math.abs(dx)} ${dx > 0 ? 'right' : 'left'}`}${dx !== 0 && dy !== 0 ? ' and ' : ''}${dy === 0 ? '' : `${Math.abs(dy)} ${dy > 0 ? 'up' : 'down'}`}`, f: ([x, y]) => [x + dx, y + dy] })
const reflectX: Op = { name: 'Reflection in the x-axis', f: ([x, y]) => [x, -y] }
const reflectY: Op = { name: 'Reflection in the y-axis', f: ([x, y]) => [-x, y] }
const reflectVert = (k: number): Op => ({ name: `Reflection in the line x = ${m(k)}`, f: ([x, y]) => [2 * k - x, y] })
const reflectHoriz = (k: number): Op => ({ name: `Reflection in the line y = ${m(k)}`, f: ([x, y]) => [x, 2 * k - y] })
const reflectYeqX: Op = { name: 'Reflection in the line y = x', f: ([x, y]) => [y, x] }
const rot180: Op = { name: 'Rotation 180° about the origin', f: ([x, y]) => [-x, -y] }
const rotCW: Op = { name: 'Rotation 90° clockwise about the origin', f: ([x, y]) => [y, -x] }
const rotACW: Op = { name: 'Rotation 90° anticlockwise about the origin', f: ([x, y]) => [-y, x] }

const grid = (r: number, extra: Partial<Extract<Figure, { type: 'coord-grid' }>> = {}): Figure => ({ type: 'coord-grid', xRange: [-r, r], yRange: [-r, r], ...extra })
const point = (prompt: string, p: P, figure: Figure, hint: string, explanation: string, errors?: CommonError[]) =>
  multi({ prompt, figure, fields: [{ answer: p[0] }, { answer: p[1] }], template: '({0}, {1})', hint, explanation, errors })

export const transformGenerators: ItemGenerator[] = [
  G('tr.translate', 'geometry.transformations', [1, 3], (rng, d) => {
    if (d === 1) {
      const a: P = [rng.int(1, 5), rng.int(1, 5)]
      const dx = rng.int(1, 4)
      const dy = rng.int(1, 4)
      const img: P = [a[0] + dx, a[1] + dy]
      return point(
        `Point A is at ${pt(a)}. It is translated ${dx} right and ${dy} up. What are the coordinates of its image A′?`,
        img,
        grid(9, { points: [{ x: a[0], y: a[1], label: 'A' }] }),
        'Right adds to x. Up adds to y.',
        `x: ${a[0]} + ${dx} = ${img[0]}. y: ${a[1]} + ${dy} = ${img[1]}. A′ = ${pt(img)}.`,
        [ex('swapped-xy', 'The first number is x (left/right) and the second is y (up/down).', a[0] + dy, a[1] + dx)],
      )
    }
    if (d === 2) {
      const a: P = [rng.int(-4, 4), rng.int(-4, 4)]
      const dx = rng.pick([-5, -4, -3, -2, 2, 3, 4, 5])
      const dy = rng.pick([-5, -4, -3, -2, 2, 3, 4, 5])
      const img: P = [a[0] + dx, a[1] + dy]
      return point(
        `Point A is at ${pt(a)}. It is translated ${Math.abs(dx)} ${dx > 0 ? 'right' : 'left'} and ${Math.abs(dy)} ${dy > 0 ? 'up' : 'down'}. What are the coordinates of A′?`,
        img,
        grid(9, { points: [{ x: a[0], y: a[1], label: 'A' }] }),
        'Left subtracts from x. Down subtracts from y.',
        `x: ${m(a[0])} ${dx > 0 ? '+' : '−'} ${Math.abs(dx)} = ${m(img[0])}. y: ${m(a[1])} ${dy > 0 ? '+' : '−'} ${Math.abs(dy)} = ${m(img[1])}. A′ = ${pt(img)}.`,
        [ex('wrong-direction', 'Check the directions: left and down make the coordinate smaller.', a[0] + Math.abs(dx) * (dx > 0 ? -1 : 1), a[1] + Math.abs(dy) * (dy > 0 ? -1 : 1))],
      )
    }
    const a: P = [rng.int(-4, 3), rng.int(-4, 3)]
    const dx = rng.int(-5, 5)
    const dy = rng.int(-5, 5)
    if (dx === 0 && dy === 0) return point(`Point A is at ${pt(a)}. It is translated 3 right and 2 up. What are the coordinates of A′?`, [a[0] + 3, a[1] + 2], grid(9, { points: [{ x: a[0], y: a[1], label: 'A' }] }), 'Right adds to x. Up adds to y.', `A′ = ${pt([a[0] + 3, a[1] + 2])}.`)
    const img: P = [a[0] + dx, a[1] + dy]
    return multi({
      prompt: `A is at ${pt(a)} and its image A′ is at ${pt(img)}. How far has it moved to the right, and how far up? (Use a negative number for left or down.)`,
      figure: grid(9, { points: [{ x: a[0], y: a[1], label: 'A' }, { x: img[0], y: img[1], label: 'A′' }] }),
      fields: [{ answer: dx }, { answer: dy }],
      template: '{0} right    {1} up',
      hint: 'Subtract the coordinates of A from the coordinates of A′.',
      explanation: `x: ${m(img[0])} − ${mp(a[0])} = ${m(dx)}. y: ${m(img[1])} − ${mp(a[1])} = ${m(dy)}.`,
      errors: [ex('swapped-xy', 'The first number is the horizontal move (x); the second is the vertical move (y).', dy, dx)],
    })
  }),

  G('tr.reflect', 'geometry.transformations', [2, 5], (rng, d) => {
    if (d === 2) {
      const tri = scalene(rng, 1, 6)
      const a = tri[0] as P
      const inX = rng.chance(0.5)
      const img: P = inX ? [a[0], -a[1]] : [-a[0], a[1]]
      return point(
        `Triangle vertex A is at ${pt(a)}. It is reflected in the ${inX ? 'x-axis' : 'y-axis'}. What are the coordinates of A′?`,
        img,
        grid(8, { polygons: [{ points: tri, label: 'A' }], points: [{ x: a[0], y: a[1], label: 'A' }] }),
        inX ? 'The x-axis is the horizontal line. Reflecting in it flips up ↔ down: y changes sign.' : 'The y-axis is the vertical line. Reflecting in it flips left ↔ right: x changes sign.',
        `A′ = ${pt(img)}: ${inX ? 'x stays the same, y changes sign' : 'y stays the same, x changes sign'}.`,
        [ex('swapped-axes', inX ? 'Reflecting in the x-axis flips the y-coordinate (not x).' : 'Reflecting in the y-axis flips the x-coordinate (not y).', inX ? -a[0] : a[0], inX ? a[1] : -a[1])],
      )
    }
    if (d === 3) {
      const k = rng.int(-2, 3)
      const vertical = rng.chance(0.5)
      const a: P = vertical ? [k + rng.int(1, 4) * (rng.chance(0.5) ? 1 : -1), rng.int(-4, 4)] : [rng.int(-4, 4), k + rng.int(1, 4) * (rng.chance(0.5) ? 1 : -1)]
      const img: P = vertical ? [2 * k - a[0], a[1]] : [a[0], 2 * k - a[1]]
      return point(
        `Point A is at ${pt(a)}. It is reflected in the line ${vertical ? 'x' : 'y'} = ${m(k)}. What are the coordinates of A′?`,
        img,
        grid(9, { points: [{ x: a[0], y: a[1], label: 'A' }], mirror: { axis: vertical ? 'x' : 'y', at: k } }),
        `Count how far A is from the mirror line. A′ is the same distance on the other side.`,
        `A is ${Math.abs(vertical ? a[0] - k : a[1] - k)} unit${Math.abs(vertical ? a[0] - k : a[1] - k) === 1 ? '' : 's'} from the line, so A′ is the same distance on the other side: ${pt(img)}.`,
        [ex('reflected-in-axis', 'You reflected in an axis. The mirror line here is not the axis.', vertical ? -a[0] : a[0], vertical ? a[1] : -a[1])],
      )
    }
    if (d === 4) {
      const anti = rng.chance(0.4)
      const src: P = [rng.pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]), rng.pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6])]
      const img: P = anti ? [-src[1], -src[0]] : [src[1], src[0]]
      const line = anti ? { from: [-8, 8] as P, to: [8, -8] as P } : { from: [-8, -8] as P, to: [8, 8] as P }
      return point(
        `Point A is at ${pt(src)}. It is reflected in the line y = ${anti ? '−x' : 'x'}. What are the coordinates of A′?`,
        img,
        grid(8, { points: [{ x: src[0], y: src[1], label: 'A' }], lines: [line] }),
        anti ? 'Reflecting in y = −x swaps x and y AND changes both signs.' : 'Reflecting in y = x swaps the x and y coordinates.',
        `A′ = ${pt(img)}.`,
        [ex('wrong-diagonal', anti ? 'Swapping x and y is for y = x. For y = −x the signs change as well.' : 'For y = x just swap x and y (no sign changes).', ...(anti ? [src[1], src[0]] : [-src[1], -src[0]]))],
      )
    }
    const k = rng.int(-1, 3)
    const tri = scalene(rng, -4, 4)
    const [a, b] = tri as [P, P, P]
    const ia: P = [a[0], 2 * k - a[1]]
    const ib: P = [b[0], 2 * k - b[1]]
    return multi({
      prompt: `Triangle vertices A ${pt(a)} and B ${pt(b)} are reflected in the line y = ${m(k)}. What are the coordinates of A′ and B′?`,
      figure: grid(9, { polygons: [{ points: tri, label: 'T' }], mirror: { axis: 'y', at: k } }),
      fields: [{ answer: ia[0] }, { answer: ia[1] }, { answer: ib[0] }, { answer: ib[1] }],
      template: "A′ ({0}, {1})    B′ ({2}, {3})",
      hint: 'For each vertex, find its distance from the mirror line and go the same distance the other side.',
      explanation: `y-values: 2 × ${m(k)} − ${m(a[1])} = ${m(ia[1])} and 2 × ${m(k)} − ${m(b[1])} = ${m(ib[1])}. The x-values do not change.`,
    })
  }),

  G('tr.rotate', 'geometry.transformations', [3, 5], (rng, d) => {
    const centre: P = d === 5 ? [rng.int(-2, 2), rng.int(-2, 2)] : [0, 0]
    const rel: P = [rng.pick([-4, -3, -2, -1, 1, 2, 3, 4]), rng.pick([-4, -3, -2, -1, 1, 2, 3, 4])]
    const a: P = [centre[0] + rel[0], centre[1] + rel[1]]
    const turns = d === 3 ? rot180 : rng.chance(0.5) ? rotCW : rotACW
    const relImg = turns.f(rel)
    const img: P = [centre[0] + relImg[0], centre[1] + relImg[1]]
    const wrongDir = turns === rotCW ? rotACW.f(rel) : turns === rotACW ? rotCW.f(rel) : null
    const about = same(centre, [0, 0]) ? 'the origin' : `the point C ${pt(centre)}`
    const angle = turns === rot180 ? '180°' : turns === rotCW ? '90° clockwise' : '90° anticlockwise'
    return point(
      `Point A is at ${pt(a)}. It is rotated ${angle} about ${about}. What are the coordinates of A′?`,
      img,
      grid(9, { points: [{ x: a[0], y: a[1], label: 'A' }, { x: centre[0], y: centre[1], label: same(centre, [0, 0]) ? 'O' : 'C' }] }),
      d === 5 ? 'Work out where A is relative to the centre C, rotate that, then add the centre back on.' : turns === rot180 ? 'A half-turn: both coordinates change sign.' : 'Sketch it: a quarter turn moves the point round to the next quadrant.',
      d === 5 ? `A is (${m(rel[0])}, ${m(rel[1])}) from C. After the turn it is (${m(relImg[0])}, ${m(relImg[1])}) from C, so A′ = ${pt(img)}.` : `A′ = ${pt(img)}.`,
      wrongDir ? [ex('wrong-direction', 'That is a turn in the opposite direction. Clockwise goes the way the hands of a clock move.', centre[0] + wrongDir[0], centre[1] + wrongDir[1])] : [ex('reflected-not-rotated', 'A half-turn changes BOTH signs. You changed only one.', centre[0] - rel[0], a[1]), ex('reflected-not-rotated', 'A half-turn changes BOTH signs. You changed only one.', a[0], centre[1] - rel[1])],
    )
  }),

  G('tr.identify', 'geometry.transformations', [3, 4], (rng, d) => {
    const tri = scalene(rng, 1, 4)
    const ops: Op[] = [reflectX, reflectY, rot180, translate(rng.pick([-6, -5, 4, 5]), rng.pick([-5, -4, 0, 4, 5])), rotCW, rotACW, ...(d === 4 ? [reflectVert(5), reflectHoriz(-5), reflectYeqX] : [])]
    const target = rng.pick(ops)
    const key = (poly: P[]) =>
      poly
        .map((p) => p.join(','))
        .sort()
        .join(';')
    const image = tri.map(target.f)
    const distractors = ops.filter((o) => o !== target && key(tri.map(o.f)) !== key(image)).map((o) => o.name)
    return choice({
      rng,
      prompt: `Shape A is transformed to shape B. Which single transformation does this?`,
      figure: grid(9, { polygons: [{ points: tri, label: 'A' }, { points: image, label: 'B' }] }),
      correct: target.name,
      wrong: rng.shuffle(distractors).slice(0, 3),
      hint: 'Is B the same way round as A (translation), a mirror image (reflection), or turned (rotation)? Check where one corner goes.',
      explanation: `Vertex ${pt(tri[0] as P)} goes to ${pt(image[0] as P)}. That is a ${target.name.charAt(0).toLowerCase()}${target.name.slice(1)}.`,
    })
  }),

  G('tr.mirror-line', 'geometry.transformations', [3, 4], (rng, d) => {
    const vertical = d === 3 ? true : rng.chance(0.5)
    const k = rng.int(-2, 3)
    const off = rng.int(1, 4)
    const along = rng.int(-4, 4)
    const a: P = vertical ? [k - off, along] : [along, k - off]
    const b: P = vertical ? [k + off, along] : [along, k + off]
    const correct = vertical ? `x = ${m(k)}` : `y = ${m(k)}`
    const wrong = vertical
      ? [`x = ${m(k + 1)}`, `x = ${m(k - 1)}`, `y = ${m(along)}`, 'x = 0']
      : [`y = ${m(k + 1)}`, `y = ${m(k - 1)}`, `x = ${m(along)}`, 'y = 0']
    return choice({
      rng,
      prompt: `Point A ${pt(a)} is reflected to give A′ ${pt(b)}. What is the equation of the mirror line?`,
      figure: grid(9, { points: [{ x: a[0], y: a[1], label: 'A' }, { x: b[0], y: b[1], label: 'A′' }] }),
      correct,
      wrong,
      hint: 'The mirror line is exactly halfway between A and A′. Is the line vertical (x = …) or horizontal (y = …)?',
      explanation: `${vertical ? 'The y-coordinates match, so the mirror is a vertical line x = …' : 'The x-coordinates match, so the mirror is a horizontal line y = …'}. Halfway between ${m(vertical ? a[0] : a[1])} and ${m(vertical ? b[0] : b[1])} is ${m(k)}, so the line is ${correct}.`,
    })
  }),
]
