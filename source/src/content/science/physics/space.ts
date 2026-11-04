import type { ItemGenerator } from '@/engine/registry'
import { choice, orderItem } from '../../kit'
import { bankGenerators, err, fmt, G, num, round, type Bank } from './factory'

// =====================================================================================================================
// Sun, Earth and Moon (Year 5 foundation)
// =====================================================================================================================

const BODY_MEANS: Record<string, string> = {
  Star: 'A huge ball of hot gas that gives out its own light.',
  Planet: 'A large body that orbits a star.',
  Moon: 'A natural satellite that orbits a planet.',
}

const basicsBank: Bank = {
  skill: 'phys.space.basics',
  sorts: [
    {
      id: 'body',
      categories: ['Star', 'Planet', 'Moon'],
      items: [
        ['the Sun', 'Star'],
        ['Proxima Centauri', 'Star'],
        ['Earth', 'Planet'],
        ['Mars', 'Planet'],
        ['Jupiter', 'Planet'],
        ['Neptune', 'Planet'],
        ['the Moon', 'Moon'],
        ['Titan (which orbits Saturn)', 'Moon'],
        ['Europa (which orbits Jupiter)', 'Moon'],
      ],
      ask: (x) => `Is ${x} a star, a planet or a moon?`,
      hint: 'Stars make their own light. Planets orbit stars. Moons orbit planets.',
      means: BODY_MEANS,
      sortPrompt: 'Match each object to what it is.',
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'Why do we have day and night?',
      a: 'The Earth spins on its axis once every 24 hours',
      wrong: [{ label: 'The Sun moves around the Earth every 24 hours', misconception: 'sun-orbits-earth', feedback: 'The Sun only appears to move across the sky because the Earth is spinning.' }, 'The Earth orbits the Sun every 24 hours', 'The Moon blocks the Sun at night'],
      hint: 'Is it the Earth or the Sun that is moving?',
      why: 'The Earth spins once a day. The half facing the Sun has day; the half facing away has night.',
      lv: [1, 3],
    },
    {
      q: 'How long does the Earth take to orbit the Sun once?',
      a: 'About 365 days (one year)',
      wrong: [{ label: '24 hours', misconception: 'orbit-day', feedback: '24 hours is one spin of the Earth (a day), not one orbit.' }, 'About 28 days', 'About 12 hours'],
      hint: 'This length of time is what we call a year.',
      why: 'One orbit of the Sun takes about 365¼ days: one year. The extra quarter day is why we have a leap year every four years.',
      lv: [1, 3],
    },
    {
      q: 'What is the Sun?',
      a: 'A star',
      wrong: [{ label: 'A planet', misconception: 'sun-planet', feedback: 'The Sun is a star: it gives out its own light. Planets do not.' }, 'A moon', 'A galaxy'],
      hint: 'It gives out its own light.',
      why: 'The Sun is a star: a huge ball of hot gas that gives out light. It looks bigger and brighter than other stars only because it is so much closer.',
      lv: [1, 2],
    },
    {
      q: 'Why does the Sun seem to move across the sky during the day?',
      a: 'Because the Earth is spinning',
      wrong: [{ label: 'Because the Sun orbits the Earth each day', misconception: 'sun-orbits-earth', feedback: 'The Earth orbits the Sun, not the other way round. The daily movement is caused by the Earth spinning.' }, 'Because the wind pushes clouds past it', 'Because the Moon pulls it'],
      hint: 'Think of how trees seem to move when you are on a train.',
      why: 'The Earth spins from west to east, so the Sun appears to rise in the east, move across the sky and set in the west.',
      lv: [2, 4],
    },
    {
      q: 'What shape are the Sun, Earth and Moon?',
      a: 'Roughly spherical (ball-shaped)',
      wrong: [{ label: 'Flat discs', misconception: 'flat-earth', feedback: 'Photos from space, ships disappearing over the horizon and the curved shadow of Earth on the Moon all show the Earth is round.' }, 'Cubes', 'Rings'],
      hint: 'Look at the shadow of the Earth on the Moon during a lunar eclipse.',
      why: 'The Sun, Earth and Moon are all roughly spheres. Evidence includes photos from space and the curved shadow of the Earth on the Moon.',
      lv: [1, 2],
    },
  ],
}

// =====================================================================================================================
// The solar system
// =====================================================================================================================

const PLANETS = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']

const planetOrder = G('phys.space.solar-system.order', 'phys.space.solar-system', [1, 5], (rng, d) => {
  const n = d <= 2 ? 4 : d <= 4 ? 5 : 8
  const pick = n === 8 ? PLANETS : rng.shuffle(PLANETS.map((p, i) => [p, i] as [string, number])).slice(0, n).sort((a, b) => a[1] - b[1]).map((x) => x[0])
  return orderItem({
    rng,
    prompt: n === 8 ? 'Put all eight planets in order of distance from the Sun, closest first.' : 'Put these planets in order of distance from the Sun, closest first.',
    correct: pick,
    direction: ['closest to the Sun', 'furthest from the Sun'],
    hint: '"My Very Easy Method Just Speeds Up Naming" gives Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.',
    explanation: 'From the Sun outwards: Mercury, Venus, Earth, Mars (the rocky inner planets), then the asteroid belt, then Jupiter, Saturn, Uranus and Neptune (the giant outer planets).',
  })
})

const ROCK_MEANS: Record<string, string> = {
  'Rocky inner planet': 'Small, with a rocky surface, and inside the asteroid belt: Mercury, Venus, Earth, Mars.',
  'Giant outer planet': 'Huge, made mostly of gas (and ice), and beyond the asteroid belt: Jupiter, Saturn, Uranus, Neptune.',
}

const solarBank: Bank = {
  skill: 'phys.space.solar-system',
  sorts: [
    {
      id: 'kind',
      categories: Object.keys(ROCK_MEANS),
      items: PLANETS.map((p, i) => [p, i < 4 ? 'Rocky inner planet' : 'Giant outer planet'] as [string, string]),
      ask: (p) => `Is ${p} a rocky inner planet or a giant outer planet?`,
      hint: 'The four planets inside the asteroid belt are rocky; the four outside it are giants.',
      means: ROCK_MEANS,
      lv: [1, 4],
    },
  ],
  mcqs: [
    { q: 'Which is the largest planet in the solar system?', a: 'Jupiter', wrong: [{ label: 'Saturn', misconception: 'saturn-largest', feedback: 'Saturn is the second largest. Jupiter is bigger.' }, 'Earth', 'Neptune'], hint: 'It is the fifth planet from the Sun.', why: 'Jupiter is the largest planet, more than ten times wider than the Earth.', lv: [1, 3] },
    { q: 'Which planet is closest to the Sun?', a: 'Mercury', wrong: [{ label: 'Venus', misconception: 'venus-closest', feedback: 'Venus is second. Mercury is closest.' }, 'Earth', 'Mars'], hint: 'It is also the smallest planet.', why: 'Mercury is the closest planet to the Sun (and the smallest).', lv: [1, 2] },
    {
      q: 'Which planet has the hottest surface?',
      a: 'Venus',
      wrong: [{ label: 'Mercury', misconception: 'closest-hottest', feedback: 'Mercury is closer to the Sun, but it has almost no atmosphere to trap heat. Venus\'s thick carbon dioxide atmosphere makes it hotter.' }, 'Mars', 'Jupiter'],
      hint: 'Being closest to the Sun is not the whole story: think about atmospheres.',
      why: 'Venus is the hottest planet because its very thick atmosphere of carbon dioxide traps energy (a runaway greenhouse effect), even though Mercury is closer to the Sun.',
      lv: [3, 5],
    },
    { q: 'Where is the asteroid belt?', a: 'Between Mars and Jupiter', wrong: [{ label: 'Between Earth and Mars', misconception: 'asteroid-earth-mars', feedback: 'It lies further out, separating the rocky planets from the giants.' }, 'Beyond Neptune', 'Between the Sun and Mercury'], hint: 'It separates the rocky planets from the giant planets.', why: 'The asteroid belt is a band of rocky lumps orbiting the Sun between Mars and Jupiter.', lv: [2, 4] },
    { q: 'Which planet is often called the "red planet"?', a: 'Mars', wrong: ['Jupiter', 'Venus', 'Mercury'], hint: 'Its surface is covered with reddish iron oxide dust (rust).', why: 'Mars looks red because its surface dust contains iron oxide.', lv: [1, 2] },
    { q: 'What is Pluto now classed as?', a: 'A dwarf planet', wrong: [{ label: 'The ninth planet', misconception: 'pluto-planet', feedback: 'Pluto was called a planet until 2006, when it was reclassified as a dwarf planet.' }, 'A moon of Neptune', 'A star'], hint: 'It was reclassified in 2006.', why: 'In 2006 astronomers agreed a definition of "planet" that Pluto does not meet, so it is now a dwarf planet.', lv: [2, 4] },
    { q: 'Which planet is famous for its large, bright ring system?', a: 'Saturn', wrong: [{ label: 'Mars', misconception: 'mars-rings', feedback: 'Mars has no rings.' }, 'Mercury', 'Venus'], hint: 'It is the sixth planet from the Sun.', why: 'Saturn has the most spectacular rings, made of ice and rock. (The other giant planets have fainter rings too.)', lv: [1, 3] },
    {
      q: 'Why can we see the planets in the night sky, even though they do not give out their own light?',
      a: 'They reflect light from the Sun',
      wrong: [{ label: 'They glow because they are hot', misconception: 'planets-glow', feedback: 'Planets are not hot enough to glow. We see sunlight reflected off them.' }, 'They reflect light from the Moon', 'They are actually stars'],
      hint: 'How do we see the Moon?',
      why: 'Planets are non-luminous: we see them because they reflect sunlight towards us.',
      lv: [2, 4],
    },
    {
      q: 'How does the time a planet takes to orbit the Sun change the further it is from the Sun?',
      a: 'Planets further from the Sun take longer to orbit',
      wrong: [{ label: 'Planets further from the Sun take less time', misconception: 'far-faster', feedback: 'Outer planets have much further to go and move more slowly, so their years are longer.' }, 'All planets take one year', 'It depends only on the planet\'s size'],
      hint: 'Neptune\'s year is about 165 Earth years.',
      why: 'The further from the Sun, the longer the path and the slower the planet moves, so outer planets have much longer years.',
      lv: [3, 5],
    },
  ],
}

// =====================================================================================================================
// Days, years and seasons
// =====================================================================================================================

const seasonQ = G('phys.space.day-seasons.which', 'phys.space.day-seasons', [2, 4], (rng, d) => {
  const months: [string, string, string][] = [
    ['June', 'summer', 'winter'],
    ['July', 'summer', 'winter'],
    ['December', 'winter', 'summer'],
    ['January', 'winter', 'summer'],
  ]
  const [month, uk, south] = rng.pick(months)
  const askSouth = d >= 3
  const place = askSouth ? rng.pick(['Australia', 'New Zealand', 'Argentina', 'South Africa']) : 'the UK'
  const correct = askSouth ? south : uk
  return choice({
    rng,
    prompt: `In ${month}, what season is it in ${place}${askSouth ? ' (in the southern hemisphere)' : ''}?`,
    correct: correct.charAt(0).toUpperCase() + correct.slice(1),
    wrong: ['Summer', 'Winter', 'Spring', 'Autumn']
      .filter((x) => x.toLowerCase() !== correct)
      .map((x) => (askSouth && x.toLowerCase() === uk ? { label: x, misconception: 'same-season-everywhere', feedback: 'The hemispheres have opposite seasons: when the northern half is tilted towards the Sun, the southern half is tilted away.' } : x)),
    keepOrder: true,
    hint: askSouth ? 'When the northern hemisphere is tilted towards the Sun, the southern hemisphere is tilted away.' : 'Think about when the UK is warmest.',
    explanation: `In ${month} the northern hemisphere is tilted ${uk === 'summer' ? 'towards' : 'away from'} the Sun, so it is ${uk} in the UK and ${south} in the southern hemisphere.`,
  })
})

const daysBank: Bank = {
  skill: 'phys.space.day-seasons',
  mcqs: [
    {
      q: 'What causes the seasons on Earth?',
      a: 'The tilt of the Earth\'s axis as it orbits the Sun',
      wrong: [{ label: 'The Earth being closer to the Sun in summer', misconception: 'distance-seasons', feedback: 'The Earth\'s distance from the Sun changes only a little, and the two hemispheres have opposite seasons at the same time, so distance cannot be the cause.' }, 'The Earth spinning faster in summer', 'The Moon blocking the Sun in winter'],
      hint: 'If it were distance, both hemispheres would have summer at the same time.',
      why: 'The Earth\'s axis is tilted (about 23°). For part of the year the northern hemisphere leans towards the Sun (summer) and for part it leans away (winter). The southern hemisphere has the opposite seasons.',
      lv: [2, 4],
    },
    {
      q: 'Why is it warmer in the UK in summer than in winter?',
      a: 'The Sun is higher in the sky, so its energy is more concentrated, and days are longer',
      wrong: [{ label: 'The Earth is much closer to the Sun', misconception: 'distance-seasons', feedback: 'In fact the Earth is slightly closest to the Sun in early January, during the UK winter.' }, 'The Sun gives out more energy in summer', 'There are fewer clouds in space in summer'],
      hint: 'Shine a torch straight down, then at a slant. Which patch is brighter?',
      why: 'When our hemisphere is tilted towards the Sun, the Sun climbs higher, so its rays hit the ground more directly (energy is less spread out), and there are more hours of daylight to warm the ground.',
      lv: [3, 5],
    },
    {
      q: 'In the UK in December, how long are the days compared with the nights?',
      a: 'The days are shorter than the nights',
      wrong: [{ label: 'The days are longer than the nights', misconception: 'day-length-backwards', feedback: 'That is in June. In December the northern hemisphere is tilted away from the Sun.' }, 'Days and nights are always exactly 12 hours each', 'There is no daylight at all'],
      hint: 'Think about when it gets dark after school.',
      why: 'In December the northern hemisphere is tilted away from the Sun, so the UK has short days and long nights.',
      lv: [1, 3],
    },
    {
      q: 'Roughly how long are day and night at the equator throughout the year?',
      a: 'About 12 hours each, all year round',
      wrong: [{ label: 'Very long days in June and very short days in December', misconception: 'equator-seasons', feedback: 'That is what happens far from the equator. At the equator day length hardly changes.' }, '24 hours of daylight all year', 'It changes from 6 hours to 18 hours'],
      hint: 'The tilt makes little difference at the middle of the Earth.',
      why: 'At the equator, day and night are each about 12 hours long all through the year. Day length changes more and more the further you go towards the poles.',
      lv: [3, 5],
    },
    {
      q: 'Why do we have a leap year (366 days) every four years?',
      a: 'The Earth takes about 365¼ days to orbit the Sun, so the extra quarters add up to a day',
      wrong: [{ label: 'The Earth spins more slowly every fourth year', misconception: 'leap-spin', feedback: 'It is about the length of the orbit, not the spin.' }, 'The Moon takes longer to orbit', 'To keep the clocks right after summer time'],
      hint: 'A year is not exactly 365 days.',
      why: 'One orbit takes about 365¼ days. Every four years the four quarters make an extra day, added as 29 February.',
      lv: [2, 4],
    },
    {
      q: 'In which direction does the Sun rise?',
      a: 'In the east',
      wrong: [{ label: 'In the west', misconception: 'sun-rises-west', feedback: 'The Sun sets in the west.' }, 'In the north', 'In the south'],
      hint: 'The Earth spins from west to east.',
      why: 'The Earth spins from west to east, so the Sun appears to rise in the east and set in the west.',
      lv: [1, 2],
    },
  ],
  written: [
    {
      prompt: 'Explain why the UK has summer and winter. Use the words "tilt", "axis" and "hemisphere".',
      model:
        'The Earth\'s axis is tilted. As the Earth orbits the Sun, for part of the year the northern hemisphere (where the UK is) is tilted towards the Sun. Then the Sun is higher in the sky, its energy is more concentrated on the ground and the days are longer, so it is summer. Six months later the northern hemisphere is tilted away from the Sun: the Sun is lower, its energy is more spread out and the days are shorter, so it is winter.',
      checklist: ['Says the Earth\'s axis is tilted', 'Says the northern hemisphere tilts towards the Sun in summer and away in winter', 'Mentions the Sun being higher (energy more concentrated)', 'Mentions longer days in summer and shorter in winter'],
      hint: 'It is not about distance from the Sun.',
    },
  ],
}

// =====================================================================================================================
// Phases of the Moon and eclipses
// =====================================================================================================================

const MAIN_PHASES = ['New moon', 'First quarter', 'Full moon', 'Last quarter']
const ALL_PHASES = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent']

const phaseOrder = G('phys.space.moon.order', 'phys.space.moon', [2, 5], (rng, d) => {
  const full = d >= 4
  const steps = full ? (d === 4 ? ALL_PHASES.slice(0, 5) : ALL_PHASES) : MAIN_PHASES
  return orderItem({
    rng,
    prompt: full ? 'Put these phases of the Moon in order, starting from a new moon.' : 'Put the four main phases of the Moon in order, starting from a new moon.',
    correct: steps,
    direction: ['first', 'last'],
    hint: 'After a new moon the lit part grows (waxes) until full moon, then shrinks (wanes).',
    explanation: 'New moon, waxing crescent, first quarter, waxing gibbous, full moon, waning gibbous, last quarter, waning crescent, then new moon again: about 29½ days in all.',
  })
})

const moonBank: Bank = {
  skill: 'phys.space.moon',
  links: [
    {
      prompt: 'Match each event to the arrangement of the Sun, Earth and Moon.',
      pairs: [
        ['Solar eclipse', 'The Moon passes between the Sun and the Earth, and its shadow falls on the Earth'],
        ['Lunar eclipse', 'The Earth passes between the Sun and the Moon, and the Moon moves into the Earth\'s shadow'],
        ['Full moon', 'The Moon is on the far side of the Earth from the Sun, so we see its whole lit half'],
        ['New moon', 'The Moon is roughly between the Earth and the Sun, so its lit half faces away from us'],
      ],
      hint: 'In an eclipse, one body\'s shadow falls on another.',
      ask: (e) => `What is the arrangement of the Sun, Earth and Moon during a ${e.toLowerCase()}?`,
      lv: [2, 5],
    },
  ],
  mcqs: [
    {
      q: 'Why does the Moon shine?',
      a: 'It reflects light from the Sun',
      wrong: [{ label: 'It makes its own light', misconception: 'moon-luminous', feedback: 'The Moon is non-luminous: it only reflects sunlight.' }, 'It reflects light from the Earth\'s cities', 'It is on fire'],
      hint: 'Is the Moon luminous?',
      why: 'The Moon gives out no light of its own. We see it because sunlight reflects off it.',
      lv: [1, 2],
    },
    {
      q: 'Why does the Moon seem to change shape during the month?',
      a: 'As it orbits the Earth we see different amounts of its sunlit half',
      wrong: [{ label: 'The Earth\'s shadow covers different parts of it', misconception: 'phases-shadow', feedback: 'The Earth\'s shadow only falls on the Moon during a lunar eclipse. Phases are about which part of the lit half faces us.' }, 'The Moon really changes shape', 'Clouds cover parts of it'],
      hint: 'Half of the Moon is always lit by the Sun.',
      why: 'The Sun always lights half of the Moon. As the Moon orbits the Earth, we see different amounts of that lit half, from none (new moon) to all of it (full moon).',
      lv: [2, 4],
    },
    {
      q: 'Roughly how long does it take to go from one full moon to the next?',
      a: 'About a month (29½ days)',
      wrong: [{ label: 'About a day', misconception: 'phase-day', feedback: 'The Moon rises and sets each day, but its phases take about a month to repeat.' }, 'About a week', 'About a year'],
      hint: 'The word "month" comes from "moon".',
      why: 'The cycle of phases takes about 29½ days.',
      lv: [1, 3],
    },
    {
      q: 'At which phase of the Moon can a solar eclipse happen?',
      a: 'New moon',
      wrong: [{ label: 'Full moon', misconception: 'solar-eclipse-full', feedback: 'At full moon the Earth is between the Sun and Moon: that is when a LUNAR eclipse can happen.' }, 'First quarter', 'Last quarter'],
      hint: 'For a solar eclipse the Moon must be between the Sun and the Earth.',
      why: 'A solar eclipse needs the Moon between the Sun and Earth, which is the new moon position. Eclipses do not happen every month because the Moon\'s orbit is slightly tilted.',
      lv: [4, 5],
    },
    {
      q: 'Why should you never look directly at the Sun, even during a partial eclipse?',
      a: 'The Sun\'s light can permanently damage your retina',
      wrong: [{ label: 'It is safe during an eclipse because the Moon blocks the Sun', misconception: 'eclipse-safe', feedback: 'Even a thin sliver of the Sun can damage your eyes. Use proper eclipse glasses or a pinhole projector.' }, 'It might make the eclipse end', 'Only because it is too bright to see the Moon'],
      hint: 'Think about the retina.',
      why: 'Sunlight focused by the eye\'s lens can burn the retina and cause permanent damage. Use special eclipse glasses or project an image with a pinhole instead.',
      lv: [1, 3],
    },
  ],
}

// =====================================================================================================================
// Gravity, mass and weight
// =====================================================================================================================

const WORLDS: [string, number][] = [
  ['the Moon', 1.6],
  ['Mars', 3.7],
  ['Jupiter', 25],
]

const weightCalc = G('phys.space.gravity.weight', 'phys.space.gravity', [1, 5], (rng, d) => {
  const m = rng.pick([2, 5, 10, 20, 30, 40, 45, 50, 60, 70])
  if (d <= 2) {
    return num({
      prompt: `What is the weight on Earth of a ${m} kg object? Use g = 10 N/kg. Give your answer in newtons.`,
      answer: m * 10,
      suffix: 'N',
      hint: 'Weight = mass × gravitational field strength.',
      explanation: `Weight = ${m} kg × 10 N/kg = ${m * 10} N.`,
      errors: [err(m, 'weight-is-mass', 'Weight is a force in newtons. Multiply the mass by g.'), err(m / 10, 'divided', 'Multiply by g, do not divide.')],
    })
  }
  if (d === 3) {
    return num({
      prompt: `An object has a weight of ${m * 10} N on Earth. What is its mass? Use g = 10 N/kg. Give your answer in kg.`,
      answer: m,
      suffix: 'kg',
      hint: 'Mass = weight ÷ g.',
      explanation: `Mass = ${m * 10} N ÷ 10 N/kg = ${m} kg.`,
      errors: [err(m * 100, 'multiplied', 'Divide the weight by g to get the mass.')],
    })
  }
  const [world, g] = rng.pick(WORLDS)
  if (d === 4) {
    const ma = rng.pick([50, 55, 60, 65, 70, 75, 80])
    return num({
      prompt: `On ${world}, the gravitational field strength is about ${fmt(g)} N/kg. What would a ${ma} kg astronaut weigh there? Give your answer in newtons.`,
      answer: round(ma * g),
      suffix: 'N',
      hint: 'Weight = mass × gravitational field strength. The mass is the same everywhere.',
      explanation: `Weight = ${ma} kg × ${fmt(g)} N/kg = ${fmt(ma * g)} N. (On Earth she would weigh ${ma * 10} N; her mass is still ${ma} kg.)`,
      errors: [err(ma * 10, 'used-earth-g', `Use the field strength for ${world}, not Earth's 10 N/kg.`), err(ma, 'weight-is-mass', 'Weight is a force: multiply mass by g.')],
    })
  }
  const m5 = rng.pick([50, 55, 60, 65, 70, 75, 80])
  const wE = m5 * 10
  const wW = round(m5 * g)
  return num({
    prompt: `An astronaut weighs ${wE} N on Earth (g = 10 N/kg). On ${world} the gravitational field strength is about ${fmt(g)} N/kg. What would the astronaut weigh on ${world}? Give your answer in newtons.`,
    answer: wW,
    suffix: 'N',
    hint: 'First find the mass from the Earth weight (mass = weight ÷ 10). Mass does not change. Then multiply by the new g.',
    explanation: `Mass = ${wE} ÷ 10 = ${m5} kg (the same everywhere). Weight on ${world} = ${m5} × ${fmt(g)} = ${fmt(wW)} N.`,
    errors: [err(round(wE * g, 6), 'skipped-mass', 'Find the mass first (divide the Earth weight by 10).'), err(wE, 'same-weight', 'Weight changes with g; it is mass that stays the same.')],
  })
})

const gravityBank: Bank = {
  skill: 'phys.space.gravity',
  links: [
    {
      prompt: 'Match each quantity to its description.',
      pairs: [
        ['Mass', 'The amount of matter in an object, in kilograms'],
        ['Weight', 'The force of gravity on an object, in newtons'],
        ['Gravitational field strength', 'The force of gravity on each kilogram, in N/kg'],
      ],
      hint: 'One is an amount of stuff, one is a force, and one is force per kilogram.',
      ask: (q) => `What is ${q.toLowerCase()}?`,
      lv: [1, 3],
    },
  ],
  mcqs: [
    {
      q: 'An astronaut goes from the Earth to the Moon. What happens to her mass and weight?',
      a: 'Her mass stays the same; her weight is less',
      wrong: [{ label: 'Her mass and weight are both less', misconception: 'mass-changes', feedback: 'Mass is the amount of matter in her, which does not change when she travels.' }, 'Her mass is less; her weight stays the same', 'Both stay the same'],
      hint: 'Which one depends on gravity?',
      why: 'Mass (the amount of matter) is the same everywhere. Weight = mass × g, and g on the Moon is about one-sixth of Earth\'s, so she weighs much less.',
      lv: [1, 3],
    },
    {
      q: 'What keeps the Moon in orbit around the Earth?',
      a: 'The gravitational pull of the Earth on the Moon',
      wrong: [{ label: 'There is no force; it just keeps going round', misconception: 'orbit-no-force', feedback: 'Without a force, the Moon would fly off in a straight line. Gravity pulls it into a curved path.' }, 'The Sun\'s light pushing it', 'Magnetism between the Earth and Moon'],
      hint: 'Something must keep pulling it towards the Earth.',
      why: 'The Earth\'s gravity constantly pulls the Moon towards it, bending its path into an orbit. In the same way, the Sun\'s gravity keeps the planets in orbit.',
      lv: [2, 4],
    },
    {
      q: 'Why is the gravitational field strength on Jupiter much bigger than on the Moon?',
      a: 'Jupiter has a much bigger mass',
      wrong: [{ label: 'Jupiter is made of gas', misconception: 'gas-gravity', feedback: 'What matters is mass, not what it is made of.' }, 'Jupiter is further from the Sun', 'Jupiter spins faster'],
      hint: 'What does the strength of gravity depend on?',
      why: 'The more massive an object, the stronger its gravitational field. Jupiter\'s mass is enormous compared with the Moon\'s.',
      lv: [2, 4],
    },
    {
      q: 'How does the gravitational force between two objects change as they move further apart?',
      a: 'It gets weaker',
      wrong: [{ label: 'It gets stronger', misconception: 'gravity-distance', feedback: 'Gravity gets weaker with distance, which is why far-off planets feel a weaker pull from the Sun.' }, 'It stays the same', 'It disappears completely as soon as they leave the ground'],
      hint: 'Astronauts in orbit are still pulled by the Earth, but less strongly than on the ground.',
      why: 'Gravity acts between all masses and gets weaker as the distance between them increases.',
      lv: [2, 4],
    },
    {
      q: 'Kitchen scales say a bag of flour is 1 kg. What is its weight on Earth?',
      a: '10 N',
      wrong: [{ label: '1 kg', misconception: 'weight-in-kg', feedback: 'Kilograms measure mass. Weight is a force in newtons: 1 kg × 10 N/kg = 10 N.' }, '1 N', '100 N'],
      hint: 'Weight = mass × 10 N/kg.',
      why: 'Weight = 1 kg × 10 N/kg = 10 N. In everyday speech we say "weight" for mass, but in science they are different.',
      lv: [1, 3],
    },
  ],
}

// =====================================================================================================================
// Stars, galaxies and light years
// =====================================================================================================================

const lightYears = G('phys.space.stars.calc', 'phys.space.stars', [1, 5], (rng, d) => {
  const c = 300000
  if (d <= 2) {
    const ly = rng.pick([4, 8, 25, 50, 100, 640])
    return num({
      prompt: `A star is ${ly} light years away. How many years ago did the light we see from it tonight leave the star?`,
      answer: ly,
      suffix: 'years',
      hint: 'A light year is the distance light travels in one year.',
      explanation: `Light takes one year to travel one light year, so light from a star ${ly} light years away left it ${ly} years ago. We see the star as it was then.`,
    })
  }
  if (d === 3) {
    const mins = rng.pick([1, 2, 5, 10])
    return num({
      prompt: `Light travels at 300,000 km/s. How far does light travel in ${mins} minute${mins > 1 ? 's' : ''}? Give your answer in km.`,
      answer: c * 60 * mins,
      suffix: 'km',
      hint: 'Change minutes to seconds first, then distance = speed × time.',
      explanation: `${mins} minute${mins > 1 ? 's' : ''} = ${60 * mins} s. Distance = 300,000 × ${60 * mins} = ${fmt(c * 60 * mins)} km.`,
      errors: [err(c * mins, 'no-seconds', 'Change the minutes into seconds first.')],
    })
  }
  if (d === 4) {
    return num({
      prompt: 'The Sun is about 150,000,000 km from the Earth. Light travels at 300,000 km/s. How long does sunlight take to reach us? Give your answer in seconds.',
      answer: 500,
      suffix: 's',
      hint: 'Time = distance ÷ speed.',
      explanation: 'Time = 150,000,000 ÷ 300,000 = 500 s, which is just over 8 minutes. We always see the Sun as it was about 8 minutes ago.',
      errors: [err(150000000 * 300000, 'multiplied', 'Time = distance ÷ speed.')],
    })
  }
  const hours = rng.pick([1, 2, 24])
  return num({
    prompt: `Light travels at 300,000 km/s. How far does light travel in ${hours === 24 ? 'one day (24 hours)' : `${hours} hour${hours > 1 ? 's' : ''}`}? Give your answer in km.`,
    answer: c * 3600 * hours,
    suffix: 'km',
    tolerance: 0.5,
    hint: 'Change the time into seconds (1 hour = 3600 s), then distance = speed × time.',
    explanation: `${hours} h = ${fmt(3600 * hours)} s. Distance = 300,000 × ${fmt(3600 * hours)} = ${fmt(c * 3600 * hours)} km. A light YEAR is about 365 times further than a light day: roughly 9.5 million million km.`,
    errors: [err(c * 60 * hours, 'minutes-not-seconds', 'An hour is 3600 seconds, not 60.')],
  })
})

const starsBank: Bank = {
  skill: 'phys.space.stars',
  orders: [
    {
      prompt: 'Put these in order of size, smallest first.',
      steps: ['The Moon', 'The Earth', 'The Sun', 'The solar system', 'The Milky Way galaxy', 'The universe'],
      direction: ['smallest', 'largest'],
      hint: 'A galaxy contains billions of stars, and each star may have its own solar system.',
      why: 'The Moon orbits the Earth; the Earth is one planet orbiting the Sun; the Sun and its planets make the solar system; our solar system is one of billions of star systems in the Milky Way; the universe contains billions of galaxies.',
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'What is a light year?',
      a: 'The distance light travels in one year',
      wrong: [{ label: 'The time light takes to reach the Earth from the Sun', misconception: 'light-year-time', feedback: 'Despite the word "year", a light year is a DISTANCE.' }, 'A year in which there is more sunlight', 'The time it takes a star to burn out'],
      hint: 'Despite its name, it is not a length of time.',
      why: 'A light year is a unit of distance: how far light travels in a year, about 9.5 million million km. It is used for the huge distances between stars.',
      lv: [1, 3],
    },
    {
      q: 'What is a galaxy?',
      a: 'An enormous group of billions of stars held together by gravity',
      wrong: [{ label: 'Another name for the solar system', misconception: 'galaxy-solar-system', feedback: 'The solar system is one star and its planets. A galaxy has billions of stars.' }, 'A large planet', 'A cloud of gas around the Earth'],
      hint: 'Our one is called the Milky Way.',
      why: 'A galaxy is a huge collection of stars, gas and dust held together by gravity. Our Sun is one of the hundreds of billions of stars in the Milky Way.',
      lv: [1, 3],
    },
    {
      q: 'Apart from the Sun, roughly how far away is the nearest star to Earth?',
      a: 'Just over 4 light years',
      wrong: [{ label: 'About 8 light minutes', misconception: 'nearest-star-sun', feedback: 'That is the Sun. The next nearest star, Proxima Centauri, is about 4.2 light years away.' }, 'About 4 km', 'About 400,000 km'],
      hint: 'It is called Proxima Centauri.',
      why: 'Proxima Centauri is about 4.2 light years away: light from it takes just over four years to reach us.',
      lv: [3, 5],
    },
    {
      q: 'Why does the Sun look so much bigger and brighter than the other stars?',
      a: 'It is much closer to us than any other star',
      wrong: [{ label: 'It is the biggest star in the universe', misconception: 'sun-biggest', feedback: 'The Sun is a fairly ordinary, medium-sized star. Many stars are far larger.' }, 'It is not a star', 'Other stars only shine at night'],
      hint: 'Think about how a car\'s headlights look close up and far away.',
      why: 'The Sun is an ordinary star; it looks huge and bright because it is about 8 light minutes away, while other stars are light years away.',
      lv: [2, 4],
    },
    {
      q: 'When you look at a star that is 100 light years away, what are you seeing?',
      a: 'Light that left the star 100 years ago',
      wrong: [{ label: 'The star exactly as it is right now', misconception: 'instant-light', feedback: 'The light took 100 years to arrive, so you see the star as it was then.' }, 'Light reflected from the Moon', 'Light that left the star 100 seconds ago'],
      hint: 'How long did the light take to reach you?',
      why: 'Light takes 100 years to cover 100 light years, so we see the star as it was 100 years ago. Looking at distant objects is looking back in time.',
      lv: [2, 4],
    },
  ],
}

export const spaceGenerators: ItemGenerator[] = [
  ...bankGenerators(basicsBank),
  planetOrder,
  ...bankGenerators(solarBank),
  seasonQ,
  ...bankGenerators(daysBank),
  phaseOrder,
  ...bankGenerators(moonBank),
  weightCalc,
  ...bankGenerators(gravityBank),
  lightYears,
  ...bankGenerators(starsBank),
]
