import type { ItemGenerator } from '@/engine/registry'
import { choice } from '../../kit'
import { bankGenerators, classifyGenerators, fmt, G, num, round, table, type Bank } from './factory'

// =====================================================================================================================
// Foundation: solids, liquids and gases (Year 6 materials)
// =====================================================================================================================

const MEANS_STATE: Record<string, string> = {
  Solid: 'Keeps its own shape and volume.',
  Liquid: 'Flows and takes the shape of its container, but keeps its volume.',
  Gas: 'Spreads out to fill whatever container it is in.',
}

const materialsClassify = classifyGenerators('chem.particles.materials', {
  id: 'state',
  categories: ['Solid', 'Liquid', 'Gas'],
  items: [
    ['ice', 'Solid'],
    ['an iron nail', 'Solid'],
    ['a wooden spoon', 'Solid'],
    ['a grain of sand', 'Solid'],
    ['a chocolate bar (at room temperature)', 'Solid'],
    ['a pebble', 'Solid'],
    ['milk', 'Liquid'],
    ['orange juice', 'Liquid'],
    ['vinegar', 'Liquid'],
    ['cooking oil', 'Liquid'],
    ['honey', 'Liquid'],
    ['tap water', 'Liquid'],
    ['steam', 'Gas'],
    ['oxygen', 'Gas'],
    ['carbon dioxide', 'Gas'],
    ['helium in a party balloon', 'Gas'],
    ['the air in a football', 'Gas'],
  ],
  ask: (x) => `At room temperature, is ${x} a solid, a liquid or a gas?`,
  hint: 'Does it keep its shape, take the shape of its container, or spread out to fill all the space?',
  means: MEANS_STATE,
  sortPrompt: 'Match each material (at room temperature) to its state.',
})

const materials: Bank = {
  skill: 'chem.particles.materials',
  mcqs: [
    {
      q: 'Which property belongs to a liquid but not to a solid?',
      a: 'It flows and takes the shape of its container',
      wrong: [{ label: 'It has a fixed volume', misconception: 'liquid-volume', feedback: 'Solids and liquids both keep their volume. The difference is shape.' }, 'It keeps its own shape', 'It can be held in your hand'],
      hint: 'Think about pouring.',
      why: 'Liquids can be poured and take the shape of their container, but they keep the same volume. Solids keep their own shape.',
      lv: [1, 3],
    },
    {
      q: 'Sand can be poured like a liquid. Why is it still a solid?',
      a: 'Each grain keeps its own shape and volume',
      wrong: [{ label: 'Because it is heavy', misconception: 'heavy-solid', feedback: 'Being heavy has nothing to do with being a solid. Look at a single grain.' }, 'Because it is dry', 'It is actually a liquid'],
      hint: 'Look at one grain under a magnifying glass.',
      why: 'Sand pours because it is made of lots of tiny solid grains. Each grain keeps its own shape, so sand is a solid.',
      lv: [2, 4],
    },
    {
      q: 'Which property belongs only to gases?',
      a: 'It spreads out to fill any container completely',
      wrong: [{ label: 'It can flow', misconception: 'only-gas-flows', feedback: 'Liquids flow too.' }, { label: 'It has no mass', misconception: 'gas-no-mass', feedback: 'Gases do have mass: a full gas cylinder is heavier than an empty one.' }, 'It keeps its own shape'],
      hint: 'Think about what happens when you open a bottle of perfume.',
      why: 'A gas spreads out to fill all the space it is in, and it can be squashed. Liquids flow too, but they stay at the bottom of a container.',
      lv: [2, 4],
    },
    {
      q: 'Water can be a solid, a liquid or a gas. What is it called in each state?',
      a: 'Ice, water, steam (water vapour)',
      wrong: ['Steam, water, ice', { label: 'Ice, steam, water', misconception: 'order-states', feedback: 'Solid first, then liquid, then gas.' }, 'Snow, ice, water'],
      hint: 'Solid, then liquid, then gas.',
      why: 'Solid water is ice, liquid water is water, and water as a gas is steam or water vapour.',
      keepOrder: true,
      lv: [1, 2],
    },
  ],
}

// =====================================================================================================================
// The particle model
// =====================================================================================================================

const states: Bank = {
  skill: 'chem.particles.states',
  links: [
    {
      prompt: 'Match each state to how its particles are arranged and move.',
      pairs: [
        ['Solid', 'Touching, in a regular pattern, vibrating on the spot'],
        ['Liquid', 'Touching, in a random arrangement, moving around each other'],
        ['Gas', 'Far apart, randomly arranged, moving quickly in all directions'],
      ],
      hint: 'Which state can flow? Which can be squashed?',
      ask: (l) => `How are the particles arranged and moving in a ${l.toLowerCase()}?`,
      lv: [1, 3],
    },
    {
      prompt: 'Match each property to its explanation in terms of particles.',
      pairs: [
        ['Solids keep their shape', 'The particles are held in fixed positions by strong forces'],
        ['Liquids can flow', 'The particles can move around each other'],
        ['Gases can be squashed easily', 'There are big spaces between the particles'],
        ['Solids and liquids cannot be squashed', 'The particles are already touching'],
        ['Gases fill their container', 'The particles move quickly in all directions'],
      ],
      hint: 'Each explanation is about how close the particles are, or how they move.',
      ask: (l) => `Which particle idea explains this? "${l}"`,
      lv: [2, 5],
    },
  ],
  mcqs: [
    {
      q: 'What is between the particles of a gas?',
      a: 'Nothing: empty space',
      wrong: [
        { label: 'Air', misconception: 'air-between-particles', feedback: 'Air is itself made of particles. Between the particles there is nothing at all.' },
        'Water vapour',
        'Smaller particles',
      ],
      hint: 'If there were something there, what would that something be made of?',
      why: 'The gaps between gas particles are empty space (a vacuum). Air is a mixture of gas particles, so it cannot be "between" them.',
      lv: [2, 4],
    },
    {
      q: 'Do the particles in a solid move?',
      a: 'Yes, they vibrate about fixed positions',
      wrong: [
        { label: 'No, they are completely still', misconception: 'solid-particles-still', feedback: 'Particles in a solid still vibrate. They just cannot move from place to place.' },
        'Yes, they move around each other',
        'Yes, they move quickly in all directions',
      ],
      hint: 'They cannot swap places, but are they totally still?',
      why: 'Particles in a solid vibrate on the spot. The hotter the solid, the more they vibrate.',
      lv: [1, 3],
    },
    {
      q: 'When a metal bar is heated it expands (gets slightly bigger). What happens to its particles?',
      a: 'They vibrate more and take up more room, so the gaps between them get slightly bigger',
      wrong: [
        { label: 'The particles themselves get bigger', misconception: 'particles-expand', feedback: 'The particles stay the same size. It is the spacing between them that increases.' },
        { label: 'More particles are made', misconception: 'more-particles', feedback: 'Heating does not create particles. The number stays the same.' },
        'The particles melt',
      ],
      hint: 'Particles never change size. What changes instead?',
      why: 'Heating gives the particles more energy, so they vibrate more and push each other slightly further apart. The particles are the same size and number.',
      lv: [3, 5],
    },
    {
      q: 'Why can a liquid be poured, but a solid cannot?',
      a: 'The particles in a liquid can move around each other',
      wrong: [
        { label: 'Liquid particles are far apart', misconception: 'liquid-far-apart', feedback: 'Liquid particles are still touching; that is why liquids cannot be squashed.' },
        'Liquid particles are smaller than solid particles',
        'Liquid particles are softer',
      ],
      hint: 'Compare how the particles move in each.',
      why: 'In a liquid the particles are touching but can slide past each other, so the liquid flows. In a solid they are held in fixed positions.',
      lv: [2, 4],
    },
    {
      q: 'Which state of matter has the weakest forces between its particles?',
      a: 'Gas',
      wrong: ['Solid', { label: 'Liquid', misconception: 'liquid-weakest', feedback: 'Liquid particles still attract each other enough to stay together. Gas particles hardly attract each other at all.' }],
      hint: 'In which state are the particles free to fly apart?',
      why: 'Gas particles are far apart and the forces between them are very weak, so they move freely in all directions.',
      keepOrder: true,
      lv: [2, 4],
    },
  ],
  written: [
    {
      prompt: 'Use the particle model to explain why you can squash a syringe full of air, but not a syringe full of water.',
      model:
        'Air is a gas, so its particles are far apart with big spaces between them. Pushing the plunger moves the particles closer together into those spaces. In water, a liquid, the particles are already touching, so there is no space to push them into and the water cannot be squashed.',
      checklist: ['Says gas particles are far apart / have spaces between them', 'Says squashing pushes the gas particles closer together', 'Says liquid particles are touching / close together', 'Links this to there being no space to squash into'],
      hint: 'Compare how close together the particles are in each.',
    },
  ],
}

const statesClassify = classifyGenerators('chem.particles.states', {
  id: 'which-state',
  categories: ['Solid', 'Liquid', 'Gas'],
  items: [
    ['particles vibrate about fixed positions', 'Solid'],
    ['particles are arranged in a regular pattern', 'Solid'],
    ['particles touch but slide past each other', 'Liquid'],
    ['particles are close together in a random arrangement and can move around', 'Liquid'],
    ['particles are far apart and move quickly in all directions', 'Gas'],
    ['particles have big empty spaces between them', 'Gas'],
  ],
  ask: (x) => `In which state of matter are the "${x}"?`,
  hint: 'Two states have particles that touch. Which of those two has a regular pattern?',
  means: { Solid: 'Particles touch, in a regular pattern, and vibrate on the spot.', Liquid: 'Particles touch, randomly arranged, and move around each other.', Gas: 'Particles are far apart and move quickly in all directions.' },
  sortPrompt: 'Match each description of the particles to the state of matter.',
  lv: [1, 3],
})

// =====================================================================================================================
// Changes of state
// =====================================================================================================================

const changes: Bank = {
  skill: 'chem.particles.changes',
  noun: 'change of state',
  terms: [
    { term: 'Melting', def: 'A solid turning into a liquid' },
    { term: 'Freezing', def: 'A liquid turning into a solid' },
    { term: 'Boiling', def: 'A liquid turning into a gas throughout the liquid, at its boiling point' },
    { term: 'Evaporation', def: 'A liquid turning into a gas from its surface, at a temperature below its boiling point' },
    { term: 'Condensation', def: 'A gas turning into a liquid' },
    { term: 'Sublimation', def: 'A solid turning straight into a gas without becoming a liquid' },
  ],
  mcqs: [
    {
      q: 'Water vapour in the air turns into droplets on a cold window. What is this change called?',
      a: 'Condensation',
      wrong: [{ label: 'Evaporation', misconception: 'evap-condense', feedback: 'Evaporation is liquid to gas. Here gas is turning into liquid.' }, 'Melting', 'Freezing'],
      hint: 'Is it going from gas to liquid, or liquid to gas?',
      why: 'The cold glass cools the water vapour, and it condenses (gas to liquid).',
      lv: [1, 3],
    },
    {
      q: 'What happens to the mass of an ice cube when it melts completely in a sealed bag?',
      a: 'It stays the same',
      wrong: [
        { label: 'It decreases', misconception: 'mass-lost-melting', feedback: 'No particles leave the bag; they are just arranged differently. Mass is conserved.' },
        { label: 'It increases', misconception: 'mass-gained-melting', feedback: 'No particles are added. The same particles are now in a liquid.' },
      ],
      hint: 'Are any particles added or lost?',
      why: 'A change of state is a physical change. The particles are the same and none escape, so the mass stays the same.',
      keepOrder: true,
      lv: [2, 4],
    },
    {
      q: 'Why does a puddle dry up on a warm day, even though it never reaches 100 °C?',
      a: 'Some fast-moving particles at the surface escape into the air (evaporation)',
      wrong: [
        { label: 'The water boils', misconception: 'evap-is-boiling', feedback: 'Boiling only happens at the boiling point (100 °C for water). Evaporation happens at lower temperatures.' },
        'The water soaks into the ground only',
        'The water particles are destroyed by the Sun',
      ],
      hint: 'There is a way for a liquid to become a gas below its boiling point.',
      why: 'Particles in a liquid move at different speeds. Fast ones at the surface can escape into the air. This evaporation happens at any temperature, faster when warm.',
      lv: [2, 4],
    },
    {
      q: 'While pure water is boiling, its temperature stays at 100 °C even though it is still being heated. Where does the energy go?',
      a: 'It is used to overcome the forces between particles so they can separate into a gas',
      wrong: [
        { label: 'It is lost because the thermometer is broken', misconception: 'thermometer-broken', feedback: 'This always happens during a change of state. It is not a fault.' },
        'It makes the particles bigger',
        { label: 'It makes the water particles move faster, so the temperature should rise', misconception: 'energy-always-temp', feedback: 'During boiling the energy breaks particles away from each other instead of raising the temperature.' },
      ],
      hint: 'In a gas the particles are far apart. What has to be overcome to get them there?',
      why: 'During a change of state the energy transferred is used to overcome the attractive forces between particles, not to raise the temperature. That is why the temperature stays steady until all the water has boiled.',
      lv: [4, 5],
    },
    {
      q: 'Solid carbon dioxide ("dry ice") turns straight into a gas at room temperature. What is this called?',
      a: 'Sublimation',
      wrong: [{ label: 'Melting', misconception: 'sublimation-melting', feedback: 'Melting gives a liquid. Dry ice skips the liquid state.' }, 'Evaporation', 'Condensation'],
      hint: 'It skips the liquid state.',
      why: 'Changing directly from a solid into a gas is called sublimation.',
      lv: [3, 5],
    },
  ],
  orders: [
    {
      prompt: 'A block of ice at −10 °C is heated until it is steam at 110 °C. Put the stages in order.',
      steps: ['The ice warms up to 0 °C', 'The ice melts at 0 °C', 'The water warms up to 100 °C', 'The water boils at 100 °C', 'The steam warms up above 100 °C'],
      direction: ['first', 'last'],
      hint: 'The temperature rises, then stays steady while the state changes, then rises again.',
      why: 'Temperature rises until the melting point, stays at 0 °C while the ice melts, rises again to the boiling point, stays at 100 °C while it boils, then the steam heats up.',
      lv: [3, 5],
    },
  ],
}

interface Substance {
  name: string
  mp: number
  bp: number
}

/** Melting and boiling points at normal pressure, rounded to the nearest degree (data-book values). */
const SUBSTANCES: Substance[] = [
  { name: 'Water', mp: 0, bp: 100 },
  { name: 'Ethanol', mp: -114, bp: 78 },
  { name: 'Oxygen', mp: -218, bp: -183 },
  { name: 'Nitrogen', mp: -210, bp: -196 },
  { name: 'Mercury', mp: -39, bp: 357 },
  { name: 'Bromine', mp: -7, bp: 59 },
  { name: 'Copper', mp: 1085, bp: 2562 },
  { name: 'Iron', mp: 1538, bp: 2862 },
]

const stateAt = (s: Substance, t: number) => (t < s.mp ? 'Solid' : t < s.bp ? 'Liquid' : 'Gas')
const TEMPS = [-250, -200, -150, -100, -50, -20, 20, 50, 80, 150, 500, 1000, 2000, 3000]

const changesGenerators: ItemGenerator[] = [
  G('chem.particles.changes.state-at', 'chem.particles.changes', [2, 5], (rng, d) => {
    const four = rng.shuffle(SUBSTANCES).slice(0, 4)
    const s = rng.pick(four)
    // A temperature that is clearly not at a melting or boiling point.
    // Not wildly above the boiling point either (ethanol at 2,000 °C would just break down).
    const temps = d <= 2 ? [20] : TEMPS.filter((t) => Math.abs(t - s.mp) >= 10 && Math.abs(t - s.bp) >= 10 && t <= s.bp + 300)
    const t = rng.pick(temps)
    const state = stateAt(s, t)
    const fig = table(
      ['Substance', 'Melting point (°C)', 'Boiling point (°C)'],
      four.map((x) => [x.name, x.mp, x.bp]),
    )
    return choice({
      rng,
      prompt: `Use the table. What state is ${s.name.toLowerCase()} in at ${fmt(t)} °C?`,
      correct: state,
      wrong: ['Solid', 'Liquid', 'Gas']
        .filter((x) => x !== state)
        .map((x) => ({ label: x, misconception: 'mp-bp-reading', feedback: `Compare ${fmt(t)} °C with both the melting point (${fmt(s.mp)} °C) and the boiling point (${fmt(s.bp)} °C).` })),
      keepOrder: true,
      figure: fig,
      hint: 'Below the melting point it is solid; between the melting and boiling points it is liquid; above the boiling point it is gas.',
      explanation:
        state === 'Solid'
          ? `${fmt(t)} °C is below the melting point (${fmt(s.mp)} °C), so it is a solid.`
          : state === 'Liquid'
            ? `${fmt(t)} °C is above the melting point (${fmt(s.mp)} °C) but below the boiling point (${fmt(s.bp)} °C), so it is a liquid.`
            : `${fmt(t)} °C is above the boiling point (${fmt(s.bp)} °C), so it is a gas.`,
    })
  }),

  G('chem.particles.changes.cooling-curve', 'chem.particles.changes', [3, 5], (rng, d) => {
    // A cooling curve for an unnamed substance: falls, flattens at the freezing point, falls again.
    const fp = rng.pick([42, 48, 54, 56, 62, 68, 70, 74])
    const start = fp + rng.pick([20, 24, 28])
    const drop = rng.pick([6, 8])
    const rows: [number, number][] = []
    let temp = start
    let minute = 0
    while (temp > fp) {
      rows.push([minute, temp])
      temp = Math.max(fp, temp - drop)
      minute++
    }
    const plateau = rng.int(3, 5)
    for (let i = 0; i < plateau; i++) rows.push([minute++, fp])
    for (let i = 1; i <= 3; i++) rows.push([minute++, fp - i * rng.pick([4, 5])])
    const fig = table(['Time (minutes)', 'Temperature (°C)'], rows)
    if (d <= 4) {
      return num({
        prompt: 'A liquid was left to cool and its temperature recorded every minute. Use the table to find its freezing point. Give your answer in °C.',
        answer: fp,
        suffix: '°C',
        figure: fig,
        hint: 'Look for where the temperature stops falling for a few minutes.',
        explanation: `The temperature stays at ${fp} °C for ${plateau} readings while the liquid freezes. Energy is being released as the particles settle into fixed positions, so the temperature does not fall until it has all frozen. The freezing point is ${fp} °C (the same as the melting point).`,
        errors: [{ values: [start], tag: 'start-temp', message: 'That is the starting temperature. Look for the flat part.' }],
      })
    }
    return choice({
      rng,
      prompt: `A liquid was left to cool and its temperature recorded every minute. Why does the temperature stay at ${fp} °C for a few minutes?`,
      correct: 'The substance is freezing, and energy released as it freezes stops the temperature falling',
      wrong: [
        { label: 'The thermometer stopped working', misconception: 'thermometer-broken', feedback: 'The flat section is real: it happens every time a pure substance changes state.' },
        { label: 'The substance is boiling', misconception: 'boil-on-cooling', feedback: 'It is cooling, not being heated, so it cannot be boiling.' },
        'The room temperature is the same as the liquid',
      ],
      figure: fig,
      hint: 'A flat section on a heating or cooling curve always means the same thing.',
      explanation: `${fp} °C is the freezing point. While the liquid freezes, energy is released as the particles settle into fixed positions, which balances the energy lost to the surroundings, so the temperature stays steady until it has all frozen.`,
    })
  }),
]

// =====================================================================================================================
// Diffusion and gas pressure
// =====================================================================================================================

const diffusion: Bank = {
  skill: 'chem.particles.diffusion',
  noun: 'term',
  terms: [
    { term: 'Diffusion', def: 'The spreading out of particles from where there are lots of them to where there are fewer, caused by their random movement' },
    { term: 'Gas pressure', def: 'The force of gas particles colliding with the walls of their container' },
    { term: 'Concentration', def: 'How much of a substance there is in a given volume' },
    { term: 'Random movement', def: 'Particles moving in every direction, changing direction whenever they collide' },
  ],
  mcqs: [
    {
      q: 'Someone sprays perfume at the front of a classroom. A few minutes later people at the back can smell it. Why?',
      a: 'The perfume particles diffuse: they move randomly and spread out through the air',
      wrong: [
        { label: 'The perfume particles are pushed by the air particles all in one direction', misconception: 'diffusion-directed', feedback: 'Particles move randomly in all directions. They spread out because they collide and change direction, not because they are pushed one way.' },
        'The smell travels as a sound wave',
        'Perfume particles are attracted to people',
      ],
      hint: 'The air in the room might be still, but the particles are not.',
      why: 'Perfume particles move randomly and collide with air particles. Over time they spread from where there are lots of them (near the spray) to where there are fewer: this is diffusion.',
      lv: [1, 3],
    },
    {
      q: 'Why does diffusion happen faster in a gas than in a liquid?',
      a: 'Gas particles move faster and have more space between them',
      wrong: [
        { label: 'Gas particles are bigger', misconception: 'gas-particles-bigger', feedback: 'Particles do not change size between states. They move faster and are further apart in a gas.' },
        'There are more particles in a gas',
        'Liquids do not have particles',
      ],
      hint: 'Compare how fast the particles move and how crowded they are.',
      why: 'In a gas the particles move quickly and have lots of space, so they spread out fast. In a liquid they are touching and move more slowly, so diffusion is slower.',
      lv: [2, 4],
    },
    {
      q: 'A purple crystal of potassium manganate(VII) is put in a beaker of still water. What happens over a few hours?',
      a: 'The purple colour slowly spreads through all of the water',
      wrong: [
        { label: 'Nothing happens unless the water is stirred', misconception: 'needs-stirring', feedback: 'Stirring speeds it up, but the particles move on their own, so diffusion happens anyway.' },
        'The purple colour stays at the bottom for ever',
        'The colour rises to the top only',
      ],
      hint: 'Particles in a liquid are always moving, even when the liquid looks still.',
      why: 'The dissolved particles move randomly among the water particles and spread from high concentration to low concentration, so the colour spreads through all the water.',
      lv: [1, 3],
    },
    {
      q: 'How does warming a liquid change how fast something diffuses through it?',
      a: 'It speeds diffusion up, because the particles move faster',
      wrong: [
        { label: 'It slows diffusion down, because the particles get bigger', misconception: 'particles-expand', feedback: 'Particles do not get bigger when heated; they move faster.' },
        'It makes no difference',
        'It stops diffusion completely',
      ],
      hint: 'What happens to particle speed when temperature rises?',
      why: 'At a higher temperature the particles have more energy and move faster, so they spread out more quickly.',
      lv: [2, 4],
    },
    {
      q: 'What causes the pressure of a gas inside a container?',
      a: 'Gas particles colliding with the walls of the container',
      wrong: [
        { label: 'The weight of the gas pressing down on the bottom only', misconception: 'pressure-weight', feedback: 'Gas pressure pushes on every wall equally, not just the bottom, because particles hit every surface.' },
        'The gas particles getting bigger',
        'The particles sticking to the walls',
      ],
      hint: 'Particles are moving in all directions inside the container.',
      why: 'Gas particles move quickly in all directions and keep hitting the walls. Each collision pushes on the wall; together these pushes are the gas pressure.',
      lv: [1, 3],
    },
    {
      q: 'A sealed can of gas is heated. Why does the pressure inside go up?',
      a: 'The particles move faster, so they hit the walls harder and more often',
      wrong: [
        { label: 'The particles expand and fill more of the can', misconception: 'particles-expand', feedback: 'Particles never get bigger. They speed up.' },
        { label: 'More gas particles are made', misconception: 'more-particles', feedback: 'The can is sealed, so the number of particles stays the same.' },
        'The particles slow down and crowd together',
      ],
      hint: 'Heating gives particles more energy. What does that do to their movement?',
      why: 'Heating makes the particles move faster. They collide with the walls more often and with more force, so the pressure increases. This is why aerosol cans warn you not to heat them.',
      lv: [3, 5],
    },
    {
      q: 'A blown-up balloon is put in a freezer. Why does it shrink?',
      a: 'The gas particles slow down and hit the inside of the balloon less hard and less often',
      wrong: [
        { label: 'The gas particles shrink', misconception: 'particles-shrink', feedback: 'Particles do not change size. They slow down.' },
        { label: 'Some of the air turns into ice', misconception: 'air-freezes', feedback: 'A freezer is nowhere near cold enough to freeze the gases in air.' },
        'Gas leaks out of the balloon because it is cold',
      ],
      hint: 'Compare the push from the particles inside with the push from the air outside.',
      why: 'Cooling slows the particles, so they push less on the inside of the balloon. The pressure outside is now bigger, so the balloon gets smaller until the pressures balance.',
      lv: [3, 5],
    },
    {
      q: 'A syringe is sealed at the end and the plunger is pushed in, so the gas has a smaller volume. What happens to the pressure, and why?',
      a: 'It increases, because the particles hit the walls more often',
      wrong: [
        { label: 'It decreases, because there is less room', misconception: 'squash-lowers-pressure', feedback: 'The same number of particles in less space hit the walls more often, so the pressure rises.' },
        'It stays the same, because the number of particles has not changed',
        { label: 'It increases, because the particles get faster', misconception: 'squash-speeds-up', feedback: 'At the same temperature the particles move at the same speed. They hit the walls more often because there is less space.' },
      ],
      hint: 'Same number of particles, same speed, less space.',
      why: 'In a smaller volume the particles do not have as far to travel between collisions, so they hit the walls more often and the pressure goes up.',
      lv: [4, 5],
    },
    {
      q: 'A long glass tube has cotton wool soaked in ammonia at one end and cotton wool soaked in hydrochloric acid at the other. The gases meet and make a white ring nearer the hydrochloric acid end. What does this show?',
      a: 'Ammonia particles move faster than hydrogen chloride particles, because they are lighter',
      wrong: [
        { label: 'Hydrogen chloride particles move faster', misconception: 'heavier-faster', feedback: 'If hydrogen chloride were faster, it would travel further and the ring would form nearer the ammonia end.' },
        'Both gases move at the same speed',
        'The gases only move when the tube is shaken',
      ],
      hint: 'The gas that travels further in the same time is the faster one.',
      why: 'The ring forms where the gases meet. Ammonia has travelled further, so its particles move faster. Ammonia particles are lighter (relative formula mass 17) than hydrogen chloride particles (36.5), and lighter particles diffuse faster.',
      lv: [5, 5],
    },
  ],
  written: [
    {
      prompt: 'Explain why a bicycle tyre that was pumped up on a cold morning feels harder in the afternoon sun.',
      model:
        'The air in the tyre is a gas, and its pressure comes from the particles colliding with the inside of the tyre. In the sun the air warms up, so the particles move faster. They hit the inside of the tyre more often and harder, so the pressure rises and the tyre feels harder.',
      checklist: ['Says pressure is caused by particles hitting the walls (inside of the tyre)', 'Says the particles move faster when heated', 'Says they collide more often and/or harder', 'Concludes the pressure increases'],
      hint: 'Start with what causes gas pressure.',
    },
  ],
}

// =====================================================================================================================
// Density and particles
// =====================================================================================================================

/** Densities of metals in g/cm^{3}, rounded to 1 decimal place (data-book values). */
const METAL_DENSITY: [string, number][] = [
  ['Aluminium', 2.7],
  ['Zinc', 7.1],
  ['Iron', 7.9],
  ['Lead', 11.3],
  ['Gold', 19.3],
]

const density: Bank = {
  skill: 'chem.particles.density',
  mcqs: [
    {
      q: 'For most substances, which state is the densest?',
      a: 'Solid',
      wrong: ['Liquid', { label: 'Gas', misconception: 'gas-densest', feedback: 'Gas particles are far apart, so a gas has very little mass in each cm^{3}: gases are the least dense.' }],
      hint: 'In which state are the particles packed most closely?',
      why: 'In most solids the particles are packed tightly in a regular pattern, so there is more mass in each cm^{3}. (Water is an unusual exception: ice is less dense than liquid water.)',
      keepOrder: true,
      lv: [1, 3],
    },
    {
      q: 'Why is a gas much less dense than the same substance as a liquid?',
      a: 'Its particles are much further apart, so there is less mass in each cm^{3}',
      wrong: [
        { label: 'Its particles are lighter', misconception: 'gas-particles-lighter', feedback: 'They are the same particles with the same mass; they are just spread out more.' },
        'Its particles are smaller',
        'A gas has no mass',
      ],
      hint: 'The particles are the same. What is different about how they are arranged?',
      why: 'Density is mass per unit volume. In a gas the same particles are spread over a much bigger volume, so each cm^{3} contains less mass.',
      lv: [2, 4],
    },
    {
      q: 'Ice floats on water. What does this tell you?',
      a: 'Ice is less dense than liquid water',
      wrong: [
        { label: 'Ice is lighter than water', misconception: 'lighter-floats', feedback: 'A huge iceberg is heavier than a cup of water, but it still floats. It is density, not mass, that matters.' },
        'Ice is denser than liquid water',
        'Ice has no particles',
      ],
      hint: 'Floating depends on how much mass is packed into each cm^{3}.',
      why: 'Things float in water if they are less dense than water. Water is unusual: its particles are slightly further apart in ice than in liquid water, so ice is less dense and floats.',
      lv: [2, 4],
    },
    {
      q: 'Which unit is used for density in chemistry practicals?',
      a: 'g/cm^{3}',
      wrong: [{ label: 'g', misconception: 'density-unit-mass', feedback: 'Grams are a unit of mass. Density is mass divided by volume.' }, 'cm^{3}', 'cm^{3}/g'],
      hint: 'Density = mass ÷ volume. Divide the units in the same way.',
      why: 'Density = mass (g) ÷ volume (cm^{3}), so its unit is g/cm^{3} (grams per cubic centimetre).',
      lv: [1, 3],
    },
  ],
}

const densityGenerators: ItemGenerator[] = [
  G('chem.particles.density.calc', 'chem.particles.density', [2, 5], (rng, d) => {
    // Density = mass / volume with tidy numbers.
    const dens = d <= 2 ? rng.int(2, 9) : d === 3 ? rng.pick([0.5, 1.5, 2.5, 2.7, 3.5, 7.9, 8.5]) : rng.pick([0.8, 1.2, 2.7, 7.1, 7.9, 11.3])
    const vol = d <= 3 ? rng.pick([2, 4, 5, 10, 20]) : rng.pick([5, 10, 20, 25, 40, 50])
    const mass = round(dens * vol, 2)
    if (d <= 4) {
      return num({
        prompt: `A block has a mass of ${fmt(mass)} g and a volume of ${fmt(vol)} cm^{3}. Calculate its density. Give your answer in g/cm^{3}.`,
        answer: dens,
        suffix: 'g/cm^{3}',
        tolerance: 0.01,
        hint: 'Density = mass ÷ volume.',
        explanation: `Density = mass ÷ volume = ${fmt(mass)} ÷ ${fmt(vol)} = ${fmt(dens)} g/cm^{3}.`,
        errors: [
          { values: [round(vol / mass, 4)], tag: 'density-upside-down', message: 'That is volume ÷ mass. Density is mass ÷ volume.' },
          { values: [round(mass * vol, 2)], tag: 'density-multiplied', message: 'Divide the mass by the volume; do not multiply.' },
        ],
      })
    }
    return num({
      prompt: `A liquid has a density of ${fmt(dens)} g/cm^{3}. What is the mass of ${fmt(vol)} cm^{3} of it? Give your answer in g.`,
      answer: mass,
      suffix: 'g',
      tolerance: 0.01,
      hint: 'Rearrange density = mass ÷ volume to find the mass.',
      explanation: `Mass = density × volume = ${fmt(dens)} × ${fmt(vol)} = ${fmt(mass)} g.`,
      errors: [{ values: [round(dens / vol, 4)], tag: 'divided', message: 'Mass = density × volume. Multiply, do not divide.' }],
    })
  }),

  G('chem.particles.density.identify', 'chem.particles.density', [3, 5], (rng, d) => {
    const [metal, dens] = rng.pick(METAL_DENSITY)
    const vol = rng.pick([2, 5, 10, 20])
    const mass = round(dens * vol, 1)
    const fig = table(['Metal', 'Density (g/cm^{3})'], METAL_DENSITY.map(([m, x]) => [m, x.toFixed(1)]))
    return choice({
      rng,
      prompt: `A metal block has a mass of ${fmt(mass, 1)} g and a volume of ${vol} cm^{3}. Use the table to identify the metal.`,
      correct: metal,
      wrong: METAL_DENSITY.filter(([m]) => m !== metal).map(([m]) => m),
      figure: fig,
      hint: d >= 5 ? 'Work out the density first.' : 'Density = mass ÷ volume. Then find that density in the table.',
      explanation: `Density = ${fmt(mass, 1)} ÷ ${vol} = ${dens.toFixed(1)} g/cm^{3}, which matches ${metal.toLowerCase()}.`,
    })
  }),

  G('chem.particles.density.float', 'chem.particles.density', [2, 4], (rng) => {
    const items: [string, number][] = [
      ['a cork', 0.2],
      ['a piece of oak wood', 0.7],
      ['a candle (paraffin wax)', 0.9],
      ['an ice cube', 0.9],
      ['a glass marble', 2.5],
      ['an iron nail', 7.9],
      ['an aluminium spoon', 2.7],
      ['a piece of polystyrene', 0.05],
    ]
    const [what, dens] = rng.pick(items)
    const floats = dens < 1
    return choice({
      rng,
      prompt: `Water has a density of 1.0 g/cm^{3}. The density of ${what} is about ${fmt(dens)} g/cm^{3}. Will it float or sink in water?`,
      correct: floats ? 'Float' : 'Sink',
      wrong: [floats ? { label: 'Sink', misconception: 'float-sink', feedback: 'It is less dense than water, so it floats.' } : { label: 'Float', misconception: 'float-sink', feedback: 'It is denser than water, so it sinks.' }],
      keepOrder: true,
      hint: 'Compare its density with the density of water.',
      explanation: `${fmt(dens)} g/cm^{3} is ${floats ? 'less' : 'more'} than 1.0 g/cm^{3}, so it ${floats ? 'floats' : 'sinks'}. Objects less dense than water float; denser ones sink.`,
    })
  }),
]

export const particlesGenerators: ItemGenerator[] = [
  ...materialsClassify,
  ...bankGenerators(materials),
  ...bankGenerators(states),
  ...statesClassify,
  ...bankGenerators(changes),
  ...changesGenerators,
  ...bankGenerators(diffusion),
  ...bankGenerators(density),
  ...densityGenerators,
]
