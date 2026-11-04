import type { ItemGenerator } from '@/engine/registry'
import { choice } from '../../kit'
import { bankGenerators, err, fmt, G, num, round, type Bank } from './factory'

// =====================================================================================================================
// How light travels
// =====================================================================================================================

const LUM_MEANS: Record<string, string> = {
  Luminous: 'It gives out its own light.',
  'Non-luminous': 'It does not give out its own light; we see it because light reflects off it into our eyes.',
}

const SEE_MEANS: Record<string, string> = {
  Transparent: 'Lets light straight through, so you can see clearly through it.',
  Translucent: 'Lets some light through but scatters it, so you cannot see clearly through it.',
  Opaque: 'Does not let any light through, so it casts a dark shadow.',
}

const travelBank: Bank = {
  skill: 'phys.light.travel',
  sorts: [
    {
      id: 'luminous',
      categories: ['Luminous', 'Non-luminous'],
      items: [
        ['the Sun', 'Luminous'],
        ['a candle flame', 'Luminous'],
        ['a lit torch bulb', 'Luminous'],
        ['a glowing television screen', 'Luminous'],
        ['a star', 'Luminous'],
        ['the Moon', 'Non-luminous'],
        ['a mirror', 'Non-luminous'],
        ['a book', 'Non-luminous'],
        ['a bicycle reflector', 'Non-luminous'],
        ['the planet Venus', 'Non-luminous'],
      ],
      ask: (x) => `Is ${x} luminous or non-luminous?`,
      hint: 'Does it make its own light, or does it only reflect light from something else?',
      means: LUM_MEANS,
      lv: [1, 4],
    },
    {
      id: 'see-through',
      categories: ['Transparent', 'Translucent', 'Opaque'],
      items: [
        ['clear window glass', 'Transparent'],
        ['clean water', 'Transparent'],
        ['clear plastic film', 'Transparent'],
        ['frosted glass', 'Translucent'],
        ['tracing paper', 'Translucent'],
        ['greaseproof paper', 'Translucent'],
        ['a wooden door', 'Opaque'],
        ['a sheet of metal', 'Opaque'],
        ['thick cardboard', 'Opaque'],
        ['a brick wall', 'Opaque'],
      ],
      ask: (x) => `Is ${x} transparent, translucent or opaque?`,
      hint: 'Can you see clearly through it, see only blurry light, or see nothing at all?',
      means: SEE_MEANS,
      sortPrompt: 'Match each material to how it lets light through.',
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'How are you able to see a book, which does not give out light?',
      a: 'Light from a source reflects off the book and enters your eyes',
      wrong: [{ label: 'Light comes out of your eyes and hits the book', misconception: 'eyes-emit-light', feedback: 'Eyes are detectors: light has to come INTO them. In a totally dark room you see nothing.' }, 'The book gives out a small amount of light', 'Your eyes send sound waves to the book'],
      hint: 'What happens in a completely dark room?',
      why: 'Non-luminous objects are seen because light from a luminous source (the Sun, a lamp) bounces off them and travels into our eyes.',
      lv: [1, 3],
    },
    {
      q: 'Why do shadows have sharp edges?',
      a: 'Light travels in straight lines, so it cannot bend round the object',
      wrong: [{ label: 'Shadows are made of dark light', misconception: 'dark-light', feedback: 'A shadow is just an area where light cannot reach.' }, 'Light travels in curves', 'The object absorbs the shadow'],
      hint: 'How does light travel?',
      why: 'Light travels in straight lines. An opaque object blocks the light and leaves an area behind it where the light cannot reach: the shadow.',
      lv: [1, 3],
    },
    {
      q: 'What is the speed of light in a vacuum (as used at KS3)?',
      a: '300,000 km/s',
      wrong: [{ label: '340 m/s', misconception: 'light-sound-speed', feedback: 'That is roughly the speed of sound in air. Light is almost a million times faster.' }, '300 km/s', '3,000 km/s'],
      hint: 'Light could go round the Earth more than 7 times in a second.',
      why: 'Light travels at about 300,000 km/s (3 × 10^{8} m/s) in a vacuum: nothing travels faster.',
      lv: [1, 3],
    },
    {
      q: 'Unlike sound, light can travel through a vacuum. What does this allow?',
      a: 'Light from the Sun and stars to reach us across space',
      wrong: [{ label: 'Us to hear explosions on the Sun', misconception: 'sound-in-space', feedback: 'Sound needs particles, so it cannot cross space.' }, 'Light to travel faster in water than in air', 'Shadows to form'],
      hint: 'What lies between the Earth and the Sun?',
      why: 'Space is a vacuum. Light does not need a medium, so sunlight and starlight can cross it. Sound cannot.',
      lv: [2, 4],
    },
    {
      q: 'When light hits an object, which three things can happen to it?',
      a: 'It can be reflected, absorbed or transmitted',
      wrong: [{ label: 'It can be reflected, created or destroyed', misconception: 'light-destroyed', feedback: 'Absorbed light is not destroyed: its energy warms the object.' }, 'It can be heated, cooled or frozen', 'It can only be reflected'],
      hint: 'Bounce off, soak in, or go through.',
      why: 'Light can bounce off (reflection), be taken in (absorption, which warms the object) or pass through (transmission).',
      lv: [2, 4],
    },
  ],
}

const lightTime = G('phys.light.travel.calc', 'phys.light.travel', [2, 5], (rng, d) => {
  const c = 300000
  if (d <= 3) {
    const t = rng.pick([1, 2, 3, 5, 10, 0.5])
    const dist = c * t
    return num({
      prompt: `Light travels at 300,000 km/s. How long does light take to travel ${fmt(dist)} km? Give your answer in seconds.`,
      answer: t,
      suffix: 's',
      hint: 'Time = distance ÷ speed.',
      explanation: `Time = ${fmt(dist)} km ÷ 300,000 km/s = ${fmt(t)} s.`,
      errors: [err(dist * c, 'multiplied', 'Time = distance ÷ speed.')],
    })
  }
  if (d === 4) {
    const t = rng.pick([2, 4, 5, 8, 20, 60])
    return num({
      prompt: `Light travels at 300,000 km/s. How far does light travel in ${t} s? Give your answer in km.`,
      answer: c * t,
      suffix: 'km',
      hint: 'Distance = speed × time.',
      explanation: `Distance = 300,000 × ${t} = ${fmt(c * t)} km.`,
      errors: [err(round(c / t, 6), 'divided', 'Distance = speed × time.')],
    })
  }
  const km = rng.pick([1.7, 3.4, 0.68, 1.02, 2.04])
  const tSound = round((km * 1000) / 340)
  return num({
    prompt: `A firework explodes ${fmt(km)} km away. Sound travels at 340 m/s and light at 300,000 km/s. Roughly how long after seeing the flash do you hear the bang? Give your answer in seconds.`,
    answer: tSound,
    suffix: 's',
    tolerance: 0.05,
    hint: 'Light arrives almost instantly. Work out how long the sound takes: time = distance (in m) ÷ 340.',
    explanation: `The light takes only about ${fmt((km / c) * 1e6, 1)} millionths of a second, so it arrives almost at once. The sound takes ${fmt(km * 1000)} m ÷ 340 m/s = ${fmt(tSound)} s, so you hear the bang about ${fmt(tSound)} s after the flash.`,
    errors: [err(round(km / 340, 6), 'km-not-m', 'Change km into metres before dividing by 340 m/s.')],
  })
})

// =====================================================================================================================
// Reflection
// =====================================================================================================================

const reflectionCalc = G('phys.light.reflection.angles', 'phys.light.reflection', [1, 5], (rng, d) => {
  const i = rng.pick([15, 20, 25, 30, 35, 40, 50, 55, 60, 65, 70])
  if (d <= 2) {
    return num({
      prompt: `A ray of light hits a plane mirror with an angle of incidence of ${i}°. What is the angle of reflection? Give your answer in degrees.`,
      answer: i,
      suffix: '°',
      hint: 'The law of reflection: angle of incidence = angle of reflection.',
      explanation: `Angle of reflection = angle of incidence = ${i}°. Both are measured from the normal.`,
      errors: [err(90 - i, 'measured-from-mirror', 'Angles are measured from the normal, and the two angles are equal.')],
    })
  }
  if (d === 3) {
    const g = 90 - i
    return num({
      prompt: `A ray of light hits a plane mirror. The angle between the ray and the mirror surface is ${g}°. What is the angle of reflection (measured from the normal)? Give your answer in degrees.`,
      answer: i,
      suffix: '°',
      hint: 'The normal is at 90° to the mirror. Angles of incidence and reflection are measured from the normal.',
      explanation: `The angle of incidence = 90° − ${g}° = ${i}°. By the law of reflection, the angle of reflection is also ${i}°.`,
      errors: [err(g, 'measured-from-mirror', 'That angle is measured from the mirror. Measure from the normal: 90° minus it.')],
    })
  }
  if (d === 4) {
    if (rng.chance(0.5)) {
      const dist = rng.pick([0.5, 1, 1.5, 2, 3])
      return num({
        prompt: `You stand ${fmt(dist)} m in front of a flat (plane) mirror. How far is your image from YOU? Give your answer in metres.`,
        answer: round(dist * 2),
        suffix: 'm',
        hint: 'Your image appears as far behind the mirror as you are in front of it.',
        explanation: `The image is ${fmt(dist)} m behind the mirror and you are ${fmt(dist)} m in front, so it is ${fmt(dist * 2)} m from you.`,
        errors: [err(dist, 'image-distance', 'That is the distance from the mirror to the image. Add the distance from you to the mirror.')],
      })
    }
    return num({
      prompt: `A ray of light hits a plane mirror with an angle of incidence of ${i}°. What is the angle between the incoming ray and the reflected ray? Give your answer in degrees.`,
      answer: 2 * i,
      suffix: '°',
      hint: 'The normal sits between the two rays. Add the angle of incidence and the angle of reflection.',
      explanation: `The angle of reflection is also ${i}°, so the angle between the rays is ${i}° + ${i}° = ${2 * i}°.`,
      errors: [err(i, 'one-angle', 'That is only one of the two angles. The rays are on both sides of the normal.')],
    })
  }
  const between = 2 * i
  const g = 90 - i
  return rng.chance(0.5)
    ? num({
        prompt: `A ray of light reflects off a plane mirror. The angle between the incoming ray and the reflected ray is ${between}°. What is the angle of incidence? Give your answer in degrees.`,
        answer: i,
        suffix: '°',
        hint: 'The normal splits the angle between the rays into two equal parts.',
        explanation: `Angle of incidence = angle of reflection, and together they make ${between}°. So the angle of incidence is ${between}° ÷ 2 = ${i}°.`,
        errors: [err(between, 'whole-angle', 'Halve it: the normal is in the middle.'), err(90 - i, 'from-mirror', 'Measure from the normal, not the mirror.')],
      })
    : num({
        prompt: `A ray of light hits a plane mirror at ${g}° to the mirror surface. What is the angle between the incoming ray and the reflected ray? Give your answer in degrees.`,
        answer: between,
        suffix: '°',
        hint: 'First find the angle of incidence (from the normal), then double it.',
        explanation: `Angle of incidence = 90° − ${g}° = ${i}°. The reflected ray makes the same angle with the normal, so the angle between the rays is 2 × ${i}° = ${between}°.`,
        errors: [err(2 * g, 'doubled-mirror-angle', 'Angles are measured from the normal. Find 90° minus the angle to the mirror first.')],
      })
})

const reflectionBank: Bank = {
  skill: 'phys.light.reflection',
  terms: [
    { term: 'Normal', def: 'An imaginary line drawn at 90° to a surface where a ray hits it' },
    { term: 'Angle of incidence', def: 'The angle between the incoming ray and the normal' },
    { term: 'Angle of reflection', def: 'The angle between the reflected ray and the normal' },
    { term: 'Specular reflection', def: 'Reflection from a smooth surface, where parallel rays stay parallel and a clear image forms' },
    { term: 'Diffuse reflection', def: 'Reflection from a rough surface, which scatters light in many directions' },
    { term: 'Incident ray', def: 'The ray of light travelling towards a surface' },
  ],
  mcqs: [
    {
      q: 'Which statement is the law of reflection?',
      a: 'The angle of incidence equals the angle of reflection',
      wrong: [{ label: 'The angle of incidence is always 90°', misconception: 'incidence-90', feedback: 'The angle of incidence can be anything from 0° to 90°.' }, 'Light always reflects straight back the way it came', 'The angle of reflection is always bigger'],
      hint: 'Both angles are measured from the normal.',
      why: 'The law of reflection: angle of incidence = angle of reflection, both measured from the normal.',
      lv: [1, 3],
    },
    {
      q: 'Why can you see your face in a mirror but not in a sheet of white paper, even though both reflect lots of light?',
      a: 'The mirror is smooth so it gives specular reflection; the paper is rough so it scatters the light (diffuse reflection)',
      wrong: [{ label: 'Paper absorbs all the light', misconception: 'paper-absorbs', feedback: 'White paper reflects most light: that is why it looks bright. It just scatters it.' }, 'Mirrors give out their own light', 'Paper is transparent'],
      hint: 'Think about how smooth each surface is.',
      why: 'A smooth mirror reflects parallel rays in the same direction, keeping the image. Rough paper reflects light in all directions, so no clear image forms.',
      lv: [3, 5],
    },
    {
      q: 'Which describes your image in a flat (plane) mirror?',
      a: 'The same size, the right way up, and reversed left to right',
      wrong: [{ label: 'Smaller and upside down', misconception: 'mirror-inverted', feedback: 'That describes the image in a pinhole camera, not a plane mirror.' }, 'Bigger and the right way up', 'The same size and upside down'],
      hint: 'Raise your right hand in front of a mirror.',
      why: 'A plane mirror image is the same size, upright, appears as far behind the mirror as the object is in front, and is laterally inverted (left and right swapped).',
      lv: [2, 4],
    },
    {
      q: 'A periscope lets you see over a wall. What is inside a simple periscope?',
      a: 'Two plane mirrors, each at 45° to the tube',
      wrong: [{ label: 'One mirror at 90° to the tube', misconception: 'periscope-90', feedback: 'A mirror at 90° would send the light straight back.' }, 'Two lenses that bend light round corners', 'A prism that splits light into colours'],
      hint: 'The light has to turn through 90° twice.',
      why: 'Each 45° mirror turns the light through 90°. The top mirror sends it down the tube and the bottom one sends it into your eye.',
      lv: [3, 5],
    },
  ],
}

// =====================================================================================================================
// Refraction and lenses
// =====================================================================================================================

const BOUNDARIES: { desc: string; into: 'slower' | 'faster' | 'normal' }[] = [
  { desc: 'from air into a glass block', into: 'slower' },
  { desc: 'from air into water', into: 'slower' },
  { desc: 'from air into a clear plastic block', into: 'slower' },
  { desc: 'from a glass block out into air', into: 'faster' },
  { desc: 'from water out into air', into: 'faster' },
  { desc: 'from air into a glass block, hitting it along the normal (at 90° to the surface)', into: 'normal' },
]

const refractDirection = G('phys.light.refraction.bend', 'phys.light.refraction', [2, 5], (rng, d) => {
  const b = rng.pick(d <= 2 ? BOUNDARIES.filter((x) => x.into !== 'normal') : BOUNDARIES)
  const askSpeed = d >= 4 && rng.chance(0.5)
  if (askSpeed) {
    const correct = b.into === 'faster' ? 'It speeds up' : 'It slows down'
    return choice({
      rng,
      prompt: `A ray of light travels ${b.desc}. What happens to its speed as it crosses the boundary?`,
      correct,
      wrong: [b.into === 'faster' ? 'It slows down' : { label: 'It speeds up', misconception: 'denser-faster', feedback: 'Light travels slower in glass and water than in air.' }, 'It stays exactly the same', 'It stops'],
      hint: 'Light travels fastest in air (and fastest of all in a vacuum). It is slower in water and glass.',
      explanation: b.into === 'faster' ? 'Light travels faster in air than in glass or water, so it speeds up as it comes out.' : `Light travels more slowly in glass, plastic or water than in air, so it slows down as it goes in${b.into === 'normal' ? ', even though it does not change direction along the normal' : ''}.`,
    })
  }
  const correct = b.into === 'slower' ? 'It bends towards the normal' : b.into === 'faster' ? 'It bends away from the normal' : 'It carries straight on without bending'
  return choice({
    rng,
    prompt: `A ray of light travels ${b.desc}. What happens to its direction?`,
    correct,
    wrong: ['It bends towards the normal', 'It bends away from the normal', 'It carries straight on without bending', 'It reflects straight back'].filter((x) => x !== correct).map((x) => ({ label: x, misconception: 'refraction-direction', feedback: 'Slowing down bends light towards the normal; speeding up bends it away; along the normal it does not bend.' })),
    hint: 'Light slows down going into glass or water and speeds up coming out. Slowing down bends it towards the normal.',
    explanation:
      b.into === 'slower'
        ? 'The light slows down as it enters the denser material, so it bends towards the normal.'
        : b.into === 'faster'
          ? 'The light speeds up as it comes out into air, so it bends away from the normal.'
          : 'Along the normal the light slows down but does not change direction.',
  })
})

const refractionBank: Bank = {
  skill: 'phys.light.refraction',
  terms: [
    { term: 'Refraction', def: 'The change in direction of light as it passes from one material into another and changes speed' },
    { term: 'Convex lens', def: 'A lens that is thicker in the middle and brings light rays together' },
    { term: 'Concave lens', def: 'A lens that is thinner in the middle and spreads light rays out' },
    { term: 'Focal point', def: 'The point where parallel rays of light meet after passing through a convex lens' },
    { term: 'Normal', def: 'An imaginary line at 90° to the surface where a ray crosses it' },
  ],
  mcqs: [
    {
      q: 'Why does a swimming pool look shallower than it really is?',
      a: 'Light from the bottom bends away from the normal as it leaves the water',
      wrong: [{ label: 'Water magnifies everything', misconception: 'water-magnifies', feedback: 'It is about light changing direction at the surface.' }, 'Light bends towards the normal as it leaves the water', 'The water absorbs the light from the deep end'],
      hint: 'Light speeds up when it leaves water and enters air.',
      why: 'Light from the bottom speeds up and bends away from the normal at the surface. Your brain assumes light travels in straight lines, so the bottom seems higher than it is.',
      lv: [3, 5],
    },
    {
      q: 'Why does a straight straw look bent where it enters a glass of water?',
      a: 'Light from the part under water is refracted as it leaves the water',
      wrong: [{ label: 'The water really bends the straw', misconception: 'straw-really-bent', feedback: 'Take it out and it is straight. The light bends, not the straw.' }, 'Light reflects off the water surface', 'The glass is curved'],
      hint: 'Is the straw really bent?',
      why: 'Light from the underwater part of the straw changes direction at the water surface, so that part appears in a different place from where it really is.',
      lv: [2, 4],
    },
    {
      q: 'What causes refraction?',
      a: 'Light changing speed as it goes from one material into another',
      wrong: [{ label: 'Light bouncing off a surface', misconception: 'refraction-reflection', feedback: 'That is reflection.' }, 'Light being absorbed', 'Light changing colour'],
      hint: 'It happens at the boundary between two materials.',
      why: 'Light travels at different speeds in different materials. The change of speed at a boundary makes it change direction (unless it hits along the normal).',
      lv: [1, 3],
    },
    {
      q: 'Which lens is used as a magnifying glass?',
      a: 'A convex lens',
      wrong: [{ label: 'A concave lens', misconception: 'concave-magnifies', feedback: 'A concave lens spreads light out and makes things look smaller.' }, 'A flat sheet of glass', 'A mirror'],
      hint: 'Magnifying glasses are fatter in the middle.',
      why: 'A convex (converging) lens is thicker in the middle and brings rays together. Held close to an object, it makes it look bigger.',
      lv: [2, 4],
    },
    {
      q: 'Parallel rays of light pass through a convex lens. What happens to them?',
      a: 'They are brought together at the focal point',
      wrong: [{ label: 'They spread out', misconception: 'convex-diverges', feedback: 'That is what a concave lens does.' }, 'They carry on parallel', 'They reflect back'],
      hint: 'Convex lenses are converging lenses.',
      why: 'A convex lens refracts parallel rays so that they converge (meet) at the focal point.',
      lv: [2, 4],
    },
  ],
  written: [
    {
      prompt: 'A ray of light enters a rectangular glass block at an angle and comes out the other side. Describe and explain what happens to its direction at each surface.',
      model:
        'As the ray enters the glass it slows down, so it bends towards the normal. It travels in a straight line through the block. As it leaves the glass it speeds up again, so it bends away from the normal. Because the two sides of the block are parallel, the ray comes out travelling in the same direction as it went in, but shifted sideways.',
      checklist: ['Slows down entering the glass', 'Bends towards the normal on the way in', 'Speeds up and bends away from the normal on the way out', 'Comes out parallel to the original ray (shifted sideways)'],
      hint: 'Talk about speed and the normal at both surfaces.',
    },
  ],
}

// =====================================================================================================================
// Colour
// =====================================================================================================================

type Prim = 'R' | 'G' | 'B'
const COLOURS: Record<string, Prim[]> = {
  white: ['R', 'G', 'B'],
  red: ['R'],
  green: ['G'],
  blue: ['B'],
  yellow: ['R', 'G'],
  cyan: ['G', 'B'],
  magenta: ['R', 'B'],
  black: [],
}
const PRIM_NAME: Record<Prim, string> = { R: 'red', G: 'green', B: 'blue' }
const nameOf = (set: Prim[]) => {
  const key = (['R', 'G', 'B'] as Prim[]).filter((p) => set.includes(p)).join('')
  return Object.entries(COLOURS).find(([, v]) => v.join('') === key)?.[0] ?? 'black'
}
const meet = (a: Prim[], b: Prim[]) => a.filter((p) => b.includes(p))
const list = (set: Prim[]) => (set.length === 0 ? 'no colours' : set.length === 3 ? 'all colours' : set.map((p) => PRIM_NAME[p]).join(' and '))
const shade = (c: string) => (c === 'black' ? 'black' : c)

const colourObjects = G('phys.light.colour.objects', 'phys.light.colour', [2, 5], (rng, d) => {
  const prims = ['red', 'green', 'blue']
  const secs = ['yellow', 'cyan', 'magenta']
  if (d === 3 || d === 5) {
    // Filters.
    const first = d === 3 ? rng.pick(prims) : rng.pick([...prims, ...secs])
    const second = d === 3 ? (rng.chance(0.5) ? null : rng.pick(prims)) : rng.pick([...prims, ...secs].filter((x) => x !== first))
    const after1 = meet(COLOURS.white as Prim[], COLOURS[first] as Prim[])
    const after2 = second ? meet(after1, COLOURS[second] as Prim[]) : after1
    const seen = after2.length ? nameOf(after2) : 'no light gets through (black)'
    const opts = ['red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'white', 'no light gets through (black)']
    return choice({
      rng,
      prompt: second
        ? `White light shines through a ${first} filter and then through a ${second} filter. What comes out of the second filter?`
        : `White light shines through a ${first} filter. What colour of light comes out?`,
      correct: seen,
      wrong: rng.shuffle(opts.filter((o) => o !== seen && o !== 'white')).slice(0, 3).map((o) => ({ label: o, misconception: 'filter-colour', feedback: 'A filter only lets through the colours it is named after (yellow = red + green, cyan = green + blue, magenta = red + blue) and absorbs the rest.' })),
      hint: 'A filter transmits only its own colour(s) and absorbs all others. Yellow = red + green, cyan = green + blue, magenta = red + blue.',
      explanation: second
        ? `The ${first} filter lets through ${list(after1)}. The ${second} filter lets through only ${list(COLOURS[second] as Prim[])}, so ${after2.length === 0 ? 'no light at all gets through' : after2.length === 1 ? `only ${list(after2)} light comes out` : `${list(after2)} light comes out, which looks ${nameOf(after2)}`}.`
        : `A ${first} filter absorbs every colour except ${first}, so only ${first} light comes out.`,
    })
  }
  // Objects under coloured light.
  const obj = d === 2 ? rng.pick(['white', ...prims, 'black']) : rng.pick([...secs, ...prims, 'white'])
  const lightC = d === 2 ? rng.pick(prims) : rng.pick(obj && secs.includes(obj) ? prims : [...prims, ...secs])
  const reflected = meet(COLOURS[obj] as Prim[], COLOURS[lightC] as Prim[])
  const seen = shade(nameOf(reflected))
  const opts = ['red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'white', 'black']
  const wrong = rng
    .shuffle(opts.filter((o) => o !== seen))
    .slice(0, 3)
  if (!wrong.includes(obj) && obj !== seen) wrong[0] = obj
  return choice({
    rng,
    prompt: `In a dark room, a ${obj} T-shirt is lit only by ${lightC} light. What colour does the T-shirt look?`,
    correct: seen,
    wrong: wrong.map((o) => (o === obj ? { label: o, misconception: 'colour-fixed', feedback: `It only looks ${obj} in white light. The colour you see depends on which colours are in the light AND which the object reflects.` } : o)),
    hint: 'An object reflects only its own colour(s) of light and absorbs the rest. If none of the light it reflects is there, it looks black.',
    explanation: `A ${obj} object reflects ${list(COLOURS[obj] as Prim[])}${obj === 'black' ? ' (it absorbs everything)' : ''}. The ${lightC} light contains ${list(COLOURS[lightC] as Prim[])}. So it reflects ${list(reflected)} and looks ${seen}.`,
  })
})

const mixLights = G('phys.light.colour.mix', 'phys.light.colour', [3, 5], (rng) => {
  const pairs: [string, string][] = [
    ['red', 'green'],
    ['red', 'blue'],
    ['green', 'blue'],
  ]
  const three = rng.chance(0.25)
  const [a, b] = rng.pick(pairs)
  const mix = three ? 'white' : nameOf([...(COLOURS[a] as Prim[]), ...(COLOURS[b] as Prim[])])
  return choice({
    rng,
    prompt: three ? 'Red, green and blue spotlights overlap on a white screen. What colour is the patch where all three overlap?' : `A ${a} spotlight and a ${b} spotlight overlap on a white screen. What colour is the overlap?`,
    correct: mix,
    wrong: rng.shuffle(['yellow', 'cyan', 'magenta', 'white', 'black', 'brown'].filter((x) => x !== mix)).slice(0, 3).map((x) => (x === 'brown' || x === 'black' ? { label: x, misconception: 'paint-mixing', feedback: 'Mixing PAINTS can give dark colours, but adding coloured LIGHTS always makes a brighter colour.' } : x)),
    hint: 'For light: red + green = yellow, red + blue = magenta, green + blue = cyan, all three = white.',
    explanation: three ? 'Red + green + blue light together make white light.' : `${a[0]?.toUpperCase()}${a.slice(1)} + ${b} light = ${mix}. Mixing coloured lights adds colours together, unlike mixing paints.`,
  })
})

const colourBank: Bank = {
  skill: 'phys.light.colour',
  orders: [
    {
      prompt: 'Put the colours of the visible spectrum in order, starting with the one refracted least by a prism.',
      steps: ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet'],
      direction: ['refracted least', 'refracted most'],
      hint: 'Remember "Richard Of York Gave Battle In Vain".',
      why: 'The spectrum is red, orange, yellow, green, blue, indigo, violet. Red is refracted (bent) least by a prism and violet the most.',
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'White light passes through a prism and spreads into a spectrum of colours. What is this called?',
      a: 'Dispersion',
      wrong: [{ label: 'Reflection', misconception: 'dispersion-reflection', feedback: 'Reflection is bouncing off a surface.' }, 'Absorption', 'Diffusion'],
      hint: 'It means "spreading out".',
      why: 'Dispersion: white light is a mixture of colours, and each colour is refracted by a slightly different amount, so they spread out.',
      lv: [1, 3],
    },
    {
      q: 'Why does a prism split white light into colours?',
      a: 'Each colour is refracted by a different amount',
      wrong: [{ label: 'The prism adds colour to the light', misconception: 'prism-adds-colour', feedback: 'The colours were already in the white light. The prism only separates them.' }, 'The prism absorbs the white', 'Each colour is reflected at a different angle inside'],
      hint: 'Were the colours already in the white light?',
      why: 'White light is a mixture of all the colours of the spectrum. Glass slows each colour by a slightly different amount, so each bends differently and they separate.',
      lv: [2, 4],
    },
    {
      q: 'What are the three primary colours of LIGHT?',
      a: 'Red, green and blue',
      wrong: [{ label: 'Red, yellow and blue', misconception: 'paint-primaries', feedback: 'Those are the traditional primary colours of paint. For light, they are red, green and blue.' }, 'Red, white and blue', 'Cyan, magenta and yellow'],
      hint: 'Look closely at a TV screen: each pixel has three tiny lights.',
      why: 'Red, green and blue light can be mixed to make all the other colours we see, including white.',
      lv: [1, 3],
    },
    {
      q: 'Why does a black object look black?',
      a: 'It absorbs all colours of light and reflects (almost) none',
      wrong: [{ label: 'It reflects black light', misconception: 'black-light', feedback: 'There is no "black light" in the spectrum: black is what you see when no light comes from something.' }, 'It reflects all colours', 'It gives out darkness'],
      hint: 'What reaches your eyes from it?',
      why: 'A black object absorbs all the colours that hit it, so almost no light reflects into your eyes.',
      lv: [1, 3],
    },
  ],
}

// =====================================================================================================================
// The eye and the camera
// =====================================================================================================================

const eyeBank: Bank = {
  skill: 'phys.light.eye',
  links: [
    {
      prompt: 'Match each part of the eye to its job.',
      pairs: [
        ['Cornea', 'Clear front layer that starts to bend (refract) the light'],
        ['Iris', 'Coloured ring of muscle that changes the size of the pupil'],
        ['Pupil', 'Hole that lets light into the eye'],
        ['Lens', 'Focuses the light onto the retina'],
        ['Retina', 'Its light-sensitive cells detect the light and send signals to the optic nerve'],
        ['Optic nerve', 'Carries electrical signals from the retina to the brain'],
      ],
      hint: 'Follow the light from the front of the eye to the brain.',
      ask: (p) => `What is the job of the ${p.toLowerCase()}?`,
      lv: [1, 4],
    },
    {
      prompt: 'Match each part of a camera to the part of the eye that does the same job.',
      pairs: [
        ['Camera lens', 'Lens (with the cornea)'],
        ['Image sensor (or film)', 'Retina'],
        ['Aperture (adjustable hole)', 'Pupil'],
      ],
      hint: 'Which part of the eye detects the light, like the sensor?',
      lv: [3, 5],
    },
  ],
  orders: [
    {
      prompt: 'Put these in order to describe how you see an object.',
      steps: ['Light from a source reflects off the object', 'The light passes through the cornea', 'It passes through the pupil', 'The lens focuses it onto the retina', 'Light-sensitive cells in the retina send signals along the optic nerve', 'The brain interprets the signals as an image'],
      direction: ['first', 'last'],
      hint: 'Start outside the eye; finish in the brain.',
      why: 'Light reflected from the object enters the eye through the cornea and pupil, the lens focuses it onto the retina, and the retina\'s cells send electrical signals along the optic nerve to the brain.',
      lv: [2, 5],
    },
  ],
  mcqs: [
    {
      q: 'What happens to your pupils when you walk from a dark room into bright sunlight?',
      a: 'They get smaller, letting in less light',
      wrong: [{ label: 'They get bigger, letting in more light', misconception: 'pupil-backwards', feedback: 'In bright light the iris makes the pupil smaller to protect the retina.' }, 'They stay the same', 'They change colour'],
      hint: 'Too much light could damage the retina.',
      why: 'The iris muscles make the pupil smaller in bright light (less light in) and bigger in dim light (more light in).',
      lv: [1, 3],
    },
    {
      q: 'What is the image like in a pinhole camera?',
      a: 'Upside down, and usually smaller than the object',
      wrong: [{ label: 'The right way up and bigger', misconception: 'pinhole-upright', feedback: 'Rays from the top of the object travel in straight lines through the hole to the bottom of the screen.' }, 'The right way up and the same size', 'Coloured differently from the object'],
      hint: 'Rays from the top of the object go through the hole in straight lines.',
      why: 'Light travels in straight lines through the pinhole, so light from the top of the object lands at the bottom of the screen: the image is inverted (and usually smaller).',
      lv: [2, 4],
    },
    {
      q: 'The hole in a pinhole camera is made bigger. What happens to the image?',
      a: 'It becomes brighter but more blurred',
      wrong: [{ label: 'It becomes sharper and brighter', misconception: 'bigger-hole-sharper', feedback: 'More light gets in, but the rays from each point spread over a bigger patch, so it blurs.' }, 'It turns the right way up', 'It disappears'],
      hint: 'More light gets in, but from a wider range of directions.',
      why: 'A bigger hole lets in more light (brighter), but each point on the object makes a bigger patch on the screen, so the patches overlap and the image blurs.',
      lv: [3, 5],
    },
    {
      q: 'The image formed on your retina is upside down. Why do you see things the right way up?',
      a: 'The brain interprets the signals and turns the picture the right way up',
      wrong: [{ label: 'The lens turns the image the right way up', misconception: 'lens-rights-image', feedback: 'The lens is what makes the image upside down in the first place.' }, 'The image is not really upside down', 'The pupil flips it'],
      hint: 'Which part of you makes sense of what you see?',
      why: 'The lens forms an inverted image on the retina, and the brain interprets the signals from it so that we perceive the world the right way up.',
      lv: [3, 5],
    },
  ],
}

export const lightGenerators: ItemGenerator[] = [
  ...bankGenerators(travelBank),
  lightTime,
  reflectionCalc,
  ...bankGenerators(reflectionBank),
  refractDirection,
  ...bankGenerators(refractionBank),
  colourObjects,
  mixLights,
  ...bankGenerators(colourBank),
  ...bankGenerators(eyeBank),
]
