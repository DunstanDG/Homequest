import type { ItemGenerator } from '@/engine/registry'
import { choice } from '../../kit'
import { bankGenerators, err, fmt, G, num, round, table, type Bank } from './factory'

// =====================================================================================================================
// The particle model and changes of state
// =====================================================================================================================

const particlesBank: Bank = {
  skill: 'phys.matter.particles',
  links: [
    {
      prompt: 'Match each state of matter to its particles.',
      pairs: [
        ['Solid', 'Close together in a regular pattern, vibrating on the spot'],
        ['Liquid', 'Close together but randomly arranged, moving around each other'],
        ['Gas', 'Far apart, moving quickly in all directions'],
      ],
      hint: 'Which state keeps its shape? Which can be squashed?',
      ask: (s) => `How are the particles arranged and moving in a ${s.toLowerCase()}?`,
      lv: [1, 3],
    },
    {
      prompt: 'Match each change of state to its name.',
      pairs: [
        ['Solid to liquid', 'Melting'],
        ['Liquid to solid', 'Freezing'],
        ['Liquid to gas, all through the liquid at its boiling point', 'Boiling'],
        ['Liquid to gas, only at the surface, below the boiling point', 'Evaporating'],
        ['Gas to liquid', 'Condensing'],
        ['Solid straight to gas', 'Subliming'],
      ],
      hint: 'Boiling and evaporating both turn liquid to gas; the difference is where and at what temperature.',
      ask: (c) => `What is this change of state called? "${c}"`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'Ice melts into water. What kind of change is this?',
      a: 'A physical change: it can be reversed and no new substance is made',
      wrong: [{ label: 'A chemical change, because a new substance forms', misconception: 'melting-chemical', feedback: 'Water and ice are the same substance. Freezing the water gets the ice back.' }, 'A change that destroys some of the particles', 'A change that creates new particles'],
      hint: 'Can you get the ice back?',
      why: 'Changes of state are physical changes. The particles are the same; only their arrangement and movement change, and the change can be reversed.',
      lv: [1, 3],
    },
    {
      q: 'A metal bar gets slightly longer when it is heated. What happens to its particles?',
      a: 'They vibrate more and move slightly further apart',
      wrong: [{ label: 'The particles get bigger', misconception: 'particles-expand', feedback: 'The particles stay the same size. They take up more room because they vibrate more and move apart.' }, 'More particles are made', 'The particles stop vibrating'],
      hint: 'Particles never change size.',
      why: 'Heating gives particles more energy. They vibrate more and push slightly further apart, so the material expands.',
      lv: [2, 4],
    },
    {
      q: 'While a solid is melting, its temperature stays the same even though it is still being heated. Where is the energy going?',
      a: 'Into overcoming the forces between particles, letting them move around each other',
      wrong: [{ label: 'It is being destroyed', misconception: 'energy-destroyed', feedback: 'Energy is never destroyed. It is being used to change the state.' }, 'Into making the particles bigger', 'Into speeding the particles up a lot'],
      hint: 'A change of state needs the particles to break free of their fixed positions.',
      why: 'During melting, the energy supplied overcomes the forces holding the particles in fixed positions, rather than raising the temperature. That is why heating curves have flat parts.',
      lv: [3, 5],
    },
    {
      q: 'Through a microscope, tiny smoke specks in air are seen jiggling about randomly. What causes this?',
      a: 'Invisible, fast-moving air particles hitting the smoke specks unevenly',
      wrong: [{ label: 'The smoke specks are alive', misconception: 'brownian-alive', feedback: 'Smoke is not alive. The jiggling is caused by collisions with air particles.' }, 'Light pushing the specks', 'The microscope shaking'],
      hint: 'You cannot see air particles, but they are moving very fast.',
      why: 'This is Brownian motion. Fast-moving air particles bombard each speck from all sides, slightly more on one side than another at any moment, so it jiggles randomly. It is evidence for moving particles.',
      lv: [4, 5],
    },
    {
      q: 'A smell spreads across a room faster on a hot day. Why?',
      a: 'The particles move faster when they are hotter, so they diffuse more quickly',
      wrong: [{ label: 'Hot air holds more smell', misconception: 'hot-air-holds', feedback: 'It is about speed: hotter particles move faster.' }, 'The particles get bigger', 'The smell particles get lighter'],
      hint: 'How does temperature affect particle speed?',
      why: 'At a higher temperature the particles have more energy and move faster, so they spread out (diffuse) more quickly.',
      lv: [2, 4],
    },
    {
      q: 'Why can a gas be squashed into a smaller volume, but a liquid cannot (easily)?',
      a: 'The particles in a gas are far apart, with lots of space between them',
      wrong: [{ label: 'Gas particles are smaller', misconception: 'gas-particles-small', feedback: 'It is the spaces between the particles that matter, not their size.' }, 'Gas particles are softer', 'Liquids have no particles'],
      hint: 'Think about the spaces between the particles.',
      why: 'Gas particles are far apart, so pushing them closer is easy. In a liquid the particles are already touching.',
      lv: [1, 3],
    },
  ],
}

const meltMass = G('phys.matter.particles.mass', 'phys.matter.particles', [1, 3], (rng, d) => {
  const m = rng.pick([50, 75, 120, 150, 200, 250, 300])
  const thing = rng.pick(['a block of ice in a sealed plastic bag', 'a bar of chocolate in a sealed foil packet', 'some butter in a closed pot'])
  const change = thing.startsWith('a block') ? 'melts completely into water' : 'melts'
  if (d <= 2) {
    return num({
      prompt: `${thing[0]?.toUpperCase()}${thing.slice(1)} has a mass of ${m} g (not counting the container). It ${change}. What is its mass now? Give your answer in grams.`,
      answer: m,
      suffix: 'g',
      hint: 'Is anything added or lost when something melts?',
      explanation: `Mass is conserved in a change of state: the same particles are still there, just arranged differently. It is still ${m} g.`,
    })
  }
  const lost = rng.pick([10, 15, 20, 25, 30])
  return num({
    prompt: `A beaker holds ${m} g of water. It is left in a warm, sunny room for a week and some water evaporates. The water left has a mass of ${m - lost} g. What mass of water vapour went into the air? Give your answer in grams.`,
    answer: lost,
    suffix: 'g',
    hint: 'Mass is conserved: the particles that left the beaker are now in the air.',
    explanation: `${m} − ${m - lost} = ${lost} g of water particles left the liquid and became water vapour in the air. None were destroyed.`,
  })
})

const heatingCurve = G('phys.matter.particles.curve', 'phys.matter.particles', [2, 5], (rng, d) => {
  const r = rng.pick([5, 10])
  const k1 = rng.int(3, 5)
  const t0 = 20
  const mp = t0 + r * k1
  const plateau = rng.int(2, 4)
  const after = rng.int(2, 3)
  const times: number[] = []
  const temps: number[] = []
  for (let t = 0; t <= k1 + plateau + after; t++) {
    times.push(t)
    temps.push(t <= k1 ? t0 + r * t : t <= k1 + plateau ? mp : mp + r * (t - k1 - plateau))
  }
  const cooling = d === 5
  const ts = cooling ? [...temps].reverse() : temps
  const fig = table(['Time (min)', 'Temperature (°C)'], times.map((t, i) => [t, ts[i] as number]))
  const what = cooling ? 'A liquid wax is left to cool and its temperature is recorded every minute.' : 'A solid wax is heated steadily and its temperature is recorded every minute.'
  if (d === 4) {
    return num({
      prompt: `${what} For how many minutes did the temperature stay constant while the wax was melting?`,
      figure: fig,
      answer: plateau,
      suffix: 'minutes',
      hint: 'Find the rows where the temperature stops rising, and count the minutes between the first and last of them.',
      explanation: `The temperature stays at ${mp} °C from ${k1} min to ${k1 + plateau} min: ${plateau} minutes. During that time the energy supplied is being used to melt the wax rather than raise its temperature.`,
      errors: [err(plateau + 1, 'counted-rows', 'Count the minutes between the first and last constant readings, not the number of rows.')],
    })
  }
  return num({
    prompt: `${what} What is the ${cooling ? 'freezing' : 'melting'} point of the wax? Give your answer in °C.`,
    figure: fig,
    answer: mp,
    suffix: '°C',
    hint: `Look for where the temperature stays the same for several minutes: the wax is changing state there.`,
    explanation: `The temperature stays at ${mp} °C for ${plateau} minutes while the wax ${cooling ? 'freezes' : 'melts'}, so its ${cooling ? 'freezing' : 'melting'} point is ${mp} °C.${cooling ? ' (A substance freezes at the same temperature that it melts.)' : ''}`,
  })
})

// =====================================================================================================================
// Density
// =====================================================================================================================

const densityCalc = G('phys.matter.density.calc', 'phys.matter.density', [1, 5], (rng, d) => {
  const rho = rng.pick([0.5, 0.8, 2, 2.5, 3, 4, 7, 8, 11])
  const v = rng.pick([10, 20, 25, 40, 50, 60, 100])
  const m = round(rho * v)
  if (d <= 2) {
    return num({
      prompt: `A block has a mass of ${fmt(m)} g and a volume of ${v} cm^{3}. What is its density? Give your answer in g/cm^{3}.`,
      answer: rho,
      suffix: 'g/cm^{3}',
      hint: 'Density = mass ÷ volume.',
      explanation: `Density = ${fmt(m)} g ÷ ${v} cm^{3} = ${fmt(rho)} g/cm^{3}.`,
      errors: [err(round(m * v, 6), 'multiplied', 'Density = mass DIVIDED by volume.'), err(round(v / m, 6), 'upside-down', 'Divide the mass by the volume.')],
    })
  }
  if (d === 3) {
    return num({
      prompt: `A material has a density of ${fmt(rho)} g/cm^{3}. What is the mass of ${v} cm^{3} of it? Give your answer in grams.`,
      answer: m,
      suffix: 'g',
      hint: 'Mass = density × volume.',
      explanation: `Mass = ${fmt(rho)} × ${v} = ${fmt(m)} g.`,
      errors: [err(round(rho / v, 6), 'divided', 'Mass = density × volume.')],
    })
  }
  if (d === 4) {
    if (rng.chance(0.5)) {
      return num({
        prompt: `A material has a density of ${fmt(rho)} g/cm^{3}. What volume does ${fmt(m)} g of it take up? Give your answer in cm^{3}.`,
        answer: v,
        suffix: 'cm^{3}',
        hint: 'Volume = mass ÷ density.',
        explanation: `Volume = ${fmt(m)} ÷ ${fmt(rho)} = ${v} cm^{3}.`,
        errors: [err(round(m * rho, 6), 'multiplied', 'Volume = mass ÷ density.')],
      })
    }
    const [l, w, h] = rng.pick([
      [5, 2, 2],
      [5, 4, 2],
      [10, 2, 1],
      [4, 3, 2],
      [5, 5, 2],
      [10, 5, 2],
    ]) as [number, number, number]
    const vol = l * w * h
    const mass = round(rho * vol)
    return num({
      prompt: `A rectangular block measures ${l} cm × ${w} cm × ${h} cm and has a mass of ${fmt(mass)} g. What is its density? Give your answer in g/cm^{3}.`,
      answer: rho,
      suffix: 'g/cm^{3}',
      hint: 'First find the volume: length × width × height.',
      explanation: `Volume = ${l} × ${w} × ${h} = ${vol} cm^{3}. Density = ${fmt(mass)} ÷ ${vol} = ${fmt(rho)} g/cm^{3}.`,
      errors: [err(round(mass / (l + w + h), 6), 'added-sides', 'Volume is length × width × height, not the sum.')],
    })
  }
  // Level 5: displacement (a stone, or a metal nut, with a realistic density).
  const [obj, rho5] = rng.pick([
    ['small stone', 2.5],
    ['small stone', 3],
    ['pebble', 2],
    ['steel nut', 8],
    ['brass weight', 8.5],
  ] as [string, number][])
  const start = rng.pick([20, 30, 40, 50])
  const sv = rng.pick([2, 4, 6, 8, 10, 12])
  const sm = round(rho5 * sv)
  return num({
    prompt: `To find the density of a ${obj}, Lily puts it into a measuring cylinder of water. The water level rises from ${start} cm^{3} to ${start + sv} cm^{3}. The ${obj}'s mass is ${fmt(sm)} g. What is its density? Give your answer in g/cm^{3}.`,
    answer: rho5,
    suffix: 'g/cm^{3}',
    hint: 'The rise in the water level is the volume of the object.',
    explanation: `Volume of the ${obj} = ${start + sv} − ${start} = ${sv} cm^{3}. Density = ${fmt(sm)} ÷ ${sv} = ${fmt(rho5)} g/cm^{3}.`,
    errors: [err(round(sm / (start + sv), 6), 'used-final-level', 'Use the RISE in the water level as the volume, not the final reading.')],
  })
})

const floatSink = G('phys.matter.density.float', 'phys.matter.density', [2, 4], (rng, d) => {
  const rho = rng.pick([0.2, 0.4, 0.5, 0.6, 0.8, 0.9, 1.2, 1.5, 2, 2.5, 7, 8])
  const v = rng.pick([10, 20, 50, 100])
  const m = round(rho * v)
  const floats = rho < 1
  return choice({
    rng,
    prompt: `${d >= 3 ? `An object has a mass of ${fmt(m)} g and a volume of ${v} cm^{3}.` : `An object has a density of ${fmt(rho)} g/cm^{3}.`} Water has a density of 1 g/cm^{3}. Will the object float or sink in water?`,
    correct: floats ? 'It floats' : 'It sinks',
    wrong: [floats ? { label: 'It sinks', misconception: 'heavy-sinks', feedback: 'Whether something floats depends on its density compared with water, not just its mass.' } : { label: 'It floats', misconception: 'density-compare', feedback: 'It is denser than water, so it sinks.' }, 'It is impossible to tell'],
    keepOrder: true,
    hint: 'Objects less dense than water float; objects denser than water sink.',
    explanation: `${d >= 3 ? `Density = ${fmt(m)} ÷ ${v} = ${fmt(rho)} g/cm^{3}. ` : ''}That is ${floats ? 'less' : 'more'} than water's 1 g/cm^{3}, so it ${floats ? 'floats' : 'sinks'}.`,
  })
})

const densityBank: Bank = {
  skill: 'phys.matter.density',
  orders: [
    {
      prompt: 'Put the steps in order to find the density of an irregular stone using a displacement can (eureka can).',
      steps: ['Fill the displacement can with water and let the extra drain out of the spout until it stops dripping', 'Put an empty measuring cylinder under the spout', 'Lower the stone gently into the can on a thread', 'Wait for all the overflowing water to collect in the measuring cylinder', 'Read the volume of water collected: this is the stone\'s volume', 'Divide the stone\'s mass (from a balance) by this volume to get its density'],
      direction: ['first', 'last'],
      hint: 'You need the mass and the volume before you can calculate.',
      why: 'The stone pushes out (displaces) its own volume of water, which is collected and measured. Then density = mass ÷ volume.',
      lv: [3, 5],
    },
  ],
  mcqs: [
    {
      q: 'A block of wood is cut in half. What happens to the density of each half?',
      a: 'It stays the same',
      wrong: [{ label: 'It halves', misconception: 'density-depends-size', feedback: 'Both the mass and the volume halve, so mass ÷ volume stays the same.' }, 'It doubles', 'It becomes zero'],
      hint: 'Density = mass ÷ volume. What happens to each?',
      why: 'Halving the block halves both its mass and its volume, so the density (mass ÷ volume) is unchanged. Density is a property of the material, not the size of the piece.',
      lv: [2, 4],
    },
    {
      q: 'Why does ice float on water?',
      a: 'Ice is less dense than liquid water',
      wrong: [{ label: 'Ice is lighter than water', misconception: 'light-floats', feedback: 'A big iceberg is very heavy. What matters is density.' }, 'Ice has air inside it', 'Cold things always float'],
      hint: 'Compare the densities.',
      why: 'Water is unusual: its particles take up a little more space as ice than as liquid, so ice is less dense than water and floats.',
      lv: [2, 4],
    },
    {
      q: 'Why do gases have a much lower density than solids or liquids?',
      a: 'Their particles are much further apart, so there is less mass in each cm^{3}',
      wrong: [{ label: 'Gas particles have no mass', misconception: 'gas-no-mass', feedback: 'Gas particles do have mass; there are just far fewer of them in each cm^{3}.' }, 'Gas particles are bigger', 'Gases are always hot'],
      hint: 'Think about the spaces between the particles.',
      why: 'In a gas the particles are far apart, so a given volume contains far fewer particles and much less mass.',
      lv: [1, 3],
    },
    {
      q: 'Cooking oil is poured onto water and floats in a layer on top. What does this tell you?',
      a: 'The oil is less dense than water',
      wrong: [{ label: 'The oil is denser than water', misconception: 'top-is-denser', feedback: 'Denser liquids sink to the bottom; less dense liquids float on top.' }, 'The oil has more mass than the water', 'Oil and water have the same density'],
      hint: 'Which goes to the bottom: denser or less dense?',
      why: 'Liquids that do not mix form layers, with the densest at the bottom. The oil floats, so it is less dense than water.',
      lv: [1, 3],
    },
  ],
}

export const matterGenerators: ItemGenerator[] = [
  ...bankGenerators(particlesBank),
  meltMass,
  heatingCurve,
  densityCalc,
  floatSink,
  ...bankGenerators(densityBank),
]
