import type { ItemGenerator } from '@/engine/registry'
import { bankGenerators, classifyGenerators, G, num, type Bank } from './factory'

// =====================================================================================================================
// Structure of the Earth
// =====================================================================================================================

const structure: Bank = {
  skill: 'tectonics.structure',
  noun: 'layer or term',
  terms: [
    { term: 'Crust', def: 'The thin, rocky outer layer of the Earth that we live on' },
    { term: 'Mantle', def: 'The thickest layer, made of hot rock that flows very slowly' },
    { term: 'Outer core', def: 'A layer of liquid iron and nickel around the centre of the Earth' },
    { term: 'Inner core', def: 'The solid centre of the Earth, made of iron and nickel, kept solid by enormous pressure' },
    { term: 'Tectonic plate', def: 'One of the large, slowly moving pieces that the Earth\'s outer shell is broken into' },
    { term: 'Convection currents', def: 'Slow circular movements in the mantle as hot rock rises and cooler rock sinks' },
    { term: 'Oceanic crust', def: 'Crust under the oceans: thinner, denser and younger, mostly basalt' },
    { term: 'Continental crust', def: 'Crust that forms the land: thicker, less dense and older, often granite' },
  ],
  orders: [
    {
      prompt: 'Put the layers of the Earth in order from the surface to the centre.',
      steps: ['Crust', 'Mantle', 'Outer core', 'Inner core'],
      direction: ['surface', 'centre'],
      hint: 'We live on the thinnest layer, on the outside.',
      why: 'Crust (thin and rocky), mantle (thick, slowly flowing rock), outer core (liquid iron and nickel), inner core (solid iron and nickel).',
      lv: [1, 3],
    },
  ],
  mcqs: [
    {
      q: 'The inner core is hotter than the outer core. Why is it solid?',
      a: 'The enormous pressure at the centre of the Earth keeps it solid',
      wrong: [{ label: 'It is actually cooler than the outer core', misconception: 'core-cool', feedback: 'The inner core is the hottest part of the Earth. Pressure, not temperature, explains it.' }, 'It is made of rock, not metal', 'It is frozen water'],
      hint: 'Think about the weight of everything above it.',
      why: 'The weight of all the layers above creates such huge pressure that the iron and nickel cannot melt, even at over 5,000°C.',
      lv: [4, 5],
    },
    {
      q: 'Roughly how fast do tectonic plates move?',
      a: 'A few centimetres a year, about as fast as fingernails grow',
      wrong: ['A few metres a day', 'About 1 km a year', 'They do not move at all'],
      hint: 'You cannot see them moving, but over millions of years they cross oceans.',
      why: 'Plates move a few centimetres a year. Over millions of years this is enough to open oceans such as the Atlantic.',
      lv: [2, 4],
    },
    {
      q: 'Which of these is evidence that the continents were once joined together?',
      a: 'The coasts of South America and Africa fit together, and the same fossils are found on both',
      wrong: [{ label: 'Both continents have mountains', misconception: 'weak-evidence', feedback: 'Every continent has mountains, so that is not evidence they were joined.' }, 'Both continents have hot climates', 'People speak similar languages in both'],
      hint: 'Think of a jigsaw.',
      why: 'The matching coastlines, rocks and fossils (such as the reptile Mesosaurus) on continents now far apart support the idea of continental drift.',
      lv: [3, 5],
    },
  ],
}

// =====================================================================================================================
// Plate boundaries
// =====================================================================================================================

const boundaries: Bank = {
  skill: 'tectonics.boundaries',
  noun: 'boundary or term',
  terms: [
    { term: 'Constructive boundary', def: 'Where two plates move apart and magma rises to form new crust' },
    { term: 'Destructive boundary', def: 'Where an oceanic plate meets a continental plate and sinks beneath it' },
    { term: 'Collision boundary', def: 'Where two continental plates push together and the crust is folded upwards into mountains' },
    { term: 'Conservative boundary', def: 'Where two plates slide past each other' },
    { term: 'Subduction', def: 'When a denser oceanic plate sinks beneath another plate into the mantle and melts' },
    { term: 'Fold mountains', def: 'Mountains formed when layers of rock are crumpled upwards as plates push together' },
  ],
  links: [
    {
      prompt: 'Match each place to the type of plate boundary found there.',
      pairs: [
        ['Iceland (the Mid-Atlantic Ridge)', 'Constructive boundary'],
        ['The Andes (west coast of South America)', 'Destructive boundary'],
        ['The Himalayas', 'Collision boundary'],
        ['The San Andreas Fault, California', 'Conservative boundary'],
      ],
      hint: 'Iceland is getting wider. The Himalayas are where India meets the rest of Asia.',
      ask: (l) => `What type of plate boundary is found at ${l}?`,
      lv: [2, 5],
    },
    {
      prompt: 'Match each type of plate boundary to the hazards found there.',
      pairs: [
        ['Constructive boundary', 'Gentle volcanic eruptions and small earthquakes'],
        ['Destructive boundary', 'Explosive volcanoes and powerful earthquakes'],
        ['Conservative boundary', 'Earthquakes, but no volcanoes'],
        ['Collision boundary', 'Earthquakes and fold mountains, but few or no volcanoes'],
      ],
      hint: 'Volcanoes need magma rising through the crust. Where is no crust being made or melted?',
      ask: (l) => `Which hazards are typical at a ${l.toLowerCase()}?`,
      lv: [3, 5],
    },
  ],
  mcqs: [
    {
      q: 'Why are there no volcanoes at a conservative plate boundary?',
      a: 'No crust is being made or destroyed, so no magma rises to the surface',
      wrong: [{ label: 'The plates are moving too slowly', misconception: 'speed', feedback: 'Speed is not the reason. The plates slide past each other without any melting or gap.' }, 'The crust there is too cold', 'They are always under the sea'],
      hint: 'What happens to the crust when plates slide past each other?',
      why: 'At a conservative boundary the plates slide past each other. There is no gap for magma to rise into and no plate is melted, so there are earthquakes but no volcanoes.',
      lv: [3, 5],
    },
    {
      q: 'At a destructive boundary, why does the oceanic plate sink under the continental plate?',
      a: 'Oceanic crust is denser (heavier for its size) than continental crust',
      wrong: [{ label: 'The oceanic plate is moving faster', misconception: 'faster-sinks', feedback: 'Density, not speed, decides which plate sinks.' }, 'The weight of the sea water pushes it down', 'Continental crust is older, so it is always on top'],
      hint: 'Oceanic crust is mostly basalt; continental crust is lighter rock such as granite.',
      why: 'Denser oceanic crust is subducted beneath lighter continental crust. As it sinks it melts, and the magma can rise to form volcanoes.',
      lv: [3, 5],
    },
    {
      q: 'What is the "Ring of Fire"?',
      a: 'A belt of volcanoes and earthquakes around the edge of the Pacific Ocean',
      wrong: [{ label: 'A ring of volcanoes around the Atlantic Ocean', misconception: 'atlantic-ring', feedback: 'It surrounds the Pacific, where many plate boundaries meet.' }, 'The hot liquid outer core', 'A circle of deserts around the Equator'],
      hint: 'It surrounds the largest ocean.',
      why: 'Most of the world\'s volcanoes and many large earthquakes occur around the Pacific Ocean, where many destructive boundaries are found.',
      lv: [2, 4],
    },
  ],
}

// =====================================================================================================================
// Volcanoes
// =====================================================================================================================

const volcanoes: Bank = {
  skill: 'tectonics.volcanoes',
  noun: 'feature or term',
  terms: [
    { term: 'Magma chamber', def: 'A store of molten rock deep underground beneath a volcano' },
    { term: 'Vent', def: 'The opening through which molten rock, ash and gas escape' },
    { term: 'Crater', def: 'The bowl-shaped hollow at the top of a volcano' },
    { term: 'Lava', def: 'Molten rock that has reached the Earth\'s surface' },
    { term: 'Pyroclastic flow', def: 'A very fast-moving cloud of hot gas, ash and rock that flows down a volcano' },
    { term: 'Lahar', def: 'A mudflow of volcanic ash mixed with water from rain or melted snow' },
    { term: 'Shield volcano', def: 'A wide volcano with gentle slopes, built from runny lava, with frequent gentle eruptions' },
    { term: 'Composite volcano', def: 'A steep-sided cone built from layers of ash and sticky lava, with rare but explosive eruptions' },
  ],
  links: [
    {
      prompt: 'Match each volcano to its type.',
      pairs: [
        ['Mauna Loa, Hawaii', 'Shield volcano'],
        ['Mount Fuji, Japan', 'Composite volcano'],
      ],
      hint: 'Hawaiian volcanoes have runny lava and gentle slopes.',
      ask: (l) => `What type of volcano is ${l}?`,
      lv: [3, 4],
    },
  ],
  mcqs: [
    {
      q: 'Which word describes a volcano that has not erupted for a long time but could erupt again?',
      a: 'Dormant',
      wrong: [{ label: 'Extinct', misconception: 'dormant-extinct', feedback: 'Extinct volcanoes are not expected ever to erupt again.' }, 'Active', 'Composite'],
      hint: 'It is "sleeping".',
      why: 'Active volcanoes have erupted recently; dormant ones have not erupted for a long time but may again; extinct ones are not expected to erupt again.',
      lv: [1, 3],
    },
    {
      q: 'Why are composite volcanoes more explosive than shield volcanoes?',
      a: 'Their lava is thick and sticky, so gas builds up until it escapes violently',
      wrong: [{ label: 'Their lava is runny, so it flows out quickly', misconception: 'runny-explosive', feedback: 'Runny lava lets gas escape easily, which gives gentle eruptions like those of shield volcanoes.' }, 'They are always taller', 'They are found only at constructive boundaries'],
      hint: 'Think about shaking a fizzy drink with a thick lid on it.',
      why: 'Sticky (viscous) lava traps gas. Pressure builds until the volcano erupts explosively. Runny lava lets gas escape gently.',
      lv: [3, 5],
    },
    {
      q: 'Hawaii is in the middle of the Pacific plate, far from any boundary. Why does it have volcanoes?',
      a: 'It lies over a hotspot, where a plume of very hot magma rises through the plate',
      wrong: [{ label: 'It is on a destructive plate boundary', misconception: 'hawaii-boundary', feedback: 'Hawaii is in the middle of a plate, not on a boundary.' }, 'Volcanoes can appear anywhere at random', 'The sea water heats the rock'],
      hint: 'The plate moves over a fixed source of heat.',
      why: 'A hotspot is a place where hot magma rises from deep in the mantle. As the plate moves over it, a chain of volcanic islands forms.',
      lv: [4, 5],
    },
  ],
}

// =====================================================================================================================
// Earthquakes
// =====================================================================================================================

const earthquakes: Bank = {
  skill: 'tectonics.earthquakes',
  noun: 'term',
  terms: [
    { term: 'Focus', def: 'The point underground where an earthquake starts' },
    { term: 'Epicentre', def: 'The point on the Earth\'s surface directly above where an earthquake starts' },
    { term: 'Seismic waves', def: 'Shock waves of energy that spread out from where an earthquake starts' },
    { term: 'Seismometer', def: 'An instrument that detects and records ground shaking' },
    { term: 'Aftershock', def: 'A smaller earthquake that follows the main one' },
    { term: 'Tsunami', def: 'A series of huge sea waves caused by an earthquake or eruption that moves the sea bed' },
    { term: 'Mercalli scale', def: 'A scale that rates an earthquake by the effects and damage people observe' },
  ],
  mcqs: [
    {
      q: 'Why does shaking usually cause the most damage near the epicentre?',
      a: 'It is closest to the focus, so the seismic waves are strongest there',
      wrong: [{ label: 'The epicentre is always in a city', misconception: 'epicentre-city', feedback: 'Epicentres can be anywhere, including under the sea.' }, 'The waves only travel upwards', 'Seismometers are placed there'],
      hint: 'Waves lose energy as they travel.',
      why: 'Seismic waves spread out from the focus and lose energy as they travel. The epicentre is the nearest point on the surface, so shaking is strongest there.',
      lv: [2, 4],
    },
    {
      q: 'What causes most earthquakes?',
      a: 'Pressure building up as plates stick, then being released suddenly when they slip',
      wrong: [{ label: 'Volcanic ash falling on the ground', misconception: 'ash-quakes', feedback: 'Ash fall does not cause earthquakes. Plate movement does.' }, 'Strong winds shaking the ground', 'Heavy rain soaking the soil'],
      hint: 'Plates do not slide past each other smoothly.',
      why: 'Friction makes plates stick. Stress builds until the rocks suddenly slip, releasing energy as seismic waves.',
      lv: [1, 3],
    },
    {
      q: 'Which earthquake is likely to cause more damage, if everything else is equal?',
      a: 'One with a shallow focus',
      wrong: [{ label: 'One with a deep focus', misconception: 'deep-focus', feedback: 'Deep-focus earthquakes lose more energy before their waves reach the surface.' }, 'Focus depth makes no difference', 'One in the middle of a plate'],
      hint: 'Which waves have further to travel to reach the surface?',
      why: 'With a shallow focus, the seismic waves reach the surface with more of their energy, so shaking is stronger.',
      lv: [3, 5],
    },
  ],
}

const quakeGenerators: ItemGenerator[] = [
  G('tectonics.earthquakes.richter', 'tectonics.earthquakes', [4, 5], (rng) => {
    const a = rng.int(3, 6)
    const steps = rng.int(1, 3)
    const b = a + steps
    const ans = 10 ** steps
    return num({
      prompt: `On the Richter scale, each whole number up means the ground shaking (the size of the seismic waves) is 10 times greater. How many times greater is the shaking in a magnitude ${b} earthquake than in a magnitude ${a} earthquake?`,
      answer: ans,
      suffix: 'times',
      hint: `Each step up multiplies by 10. How many steps from ${a} to ${b}?`,
      explanation: `${b} − ${a} = ${steps} step${steps > 1 ? 's' : ''}, so ${Array(steps).fill('10').join(' × ')} = ${ans} times greater shaking. (The energy released goes up even faster, about 30 times per step.)`,
      errors: [
        { values: [steps], tag: 'linear-scale', message: 'The scale is not linear: each step multiplies the shaking by 10.' },
        { values: [10 * steps], tag: 'added-tens', message: 'Each step MULTIPLIES by 10, so two steps is 10 × 10, not 10 + 10.' },
      ],
    })
  }),
]

// =====================================================================================================================
// Living with tectonic hazards
// =====================================================================================================================

const responses: Bank = {
  skill: 'tectonics.responses',
  terms: [
    { term: 'Prediction', def: 'Monitoring signs such as small earthquakes, gas and ground swelling to forecast an eruption' },
    { term: 'Protection', def: 'Designing buildings and structures to withstand a hazard' },
    { term: 'Planning', def: 'Preparing in advance, for example with evacuation routes, drills and hazard maps' },
    { term: 'Primary effect', def: 'An effect caused directly by the hazard, such as buildings collapsing' },
    { term: 'Secondary effect', def: 'An effect that happens later as a result of the primary effects, such as disease or job losses' },
  ],
  mcqs: [
    {
      q: 'Why do many people choose to live near active volcanoes?',
      a: 'Volcanic soils are very fertile, and there can be jobs in tourism and geothermal energy',
      wrong: [{ label: 'Volcanoes never erupt without months of warning', misconception: 'always-warning', feedback: 'Eruptions can be hard to predict exactly. People stay mainly for the benefits.' }, 'The air near volcanoes is cleaner', 'Land near volcanoes is always flat'],
      hint: 'Think about farming and money.',
      why: 'Weathered volcanic rock makes fertile soil, and volcanoes bring tourism, geothermal energy and minerals. Many people also have family ties to the area or cannot afford to move.',
      lv: [2, 4],
    },
    {
      q: 'How can a building be designed to survive an earthquake?',
      a: 'Use foundations with rubber shock absorbers and a steel frame that can sway',
      wrong: [{ label: 'Build it from heavy, unreinforced bricks', misconception: 'heavy-safe', feedback: 'Heavy, rigid, unreinforced walls are the most likely to collapse.' }, 'Make it as tall as possible', 'Paint it a bright colour'],
      hint: 'The building needs to absorb the shaking, not resist it rigidly.',
      why: 'Earthquake-resistant buildings have deep foundations with shock absorbers, cross-bracing and flexible steel frames, so they sway rather than collapse.',
      lv: [2, 4],
    },
    {
      q: 'Why do earthquakes of similar strength often kill more people in lower-income countries?',
      a: 'Buildings are often less well built, and there is less money for warnings, rescue and healthcare',
      wrong: [{ label: 'Earthquakes are always stronger in lower-income countries', misconception: 'stronger-poor', feedback: 'The question says similar strength. The difference is in how well people are protected.' }, 'There are more people in higher-income countries', 'Higher-income countries never have earthquakes'],
      hint: 'Think about what money can buy before and after an earthquake.',
      why: 'Wealth affects building quality, emergency services, preparation and recovery. Poorly built homes collapse more easily and help may arrive more slowly.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Explain why the effects of an earthquake are often greater in a lower-income country (LIC) than in a higher-income country (HIC).',
      model: 'In HICs, strict building regulations mean that buildings are designed to withstand shaking, for example with deep foundations and flexible steel frames. In LICs many people live in poorly built homes that collapse more easily. HICs can afford emergency services, trained rescue teams and good hospitals, so injured people are treated quickly. In LICs roads may be blocked and help may be slow, so secondary effects such as disease from contaminated water can kill more people. HICs also practise earthquake drills, so people know what to do.',
      checklist: ['Mentions building quality or regulations', 'Mentions emergency response, rescue or healthcare', 'Mentions preparation, such as drills, warnings or planning', 'Makes a clear comparison between LICs and HICs'],
      hint: 'Think about before (preparation), during (buildings) and after (response).',
    },
    {
      prompt: 'Explain why some people continue to live near an active volcano, despite the risk.',
      model: 'Many people live near volcanoes because the soil is very fertile, made from weathered volcanic ash and lava, so crops grow well. Volcanoes also attract tourists, which provides jobs in hotels and guiding. Some countries use the heat underground for geothermal energy. In addition, some people have lived there for generations and do not want to leave their family and land, or cannot afford to move. Better monitoring now gives some warning of eruptions, so people feel the risk is acceptable.',
      checklist: ['Gives an economic reason (farming, tourism or energy)', 'Explains why the soil is fertile or how the benefit works', 'Gives a social reason (family, home or cost of moving)', 'Mentions monitoring or prediction reducing the risk'],
      hint: 'Think about money, family, and how people manage the risk.',
    },
  ],
}

const responseGenerators: ItemGenerator[] = classifyGenerators('tectonics.responses', {
  id: 'timing',
  categories: ['Immediate response', 'Long-term response'],
  items: [
    ['rescue teams searching collapsed buildings', 'Immediate response'],
    ['handing out tents, food and clean water', 'Immediate response'],
    ['treating the injured in field hospitals', 'Immediate response'],
    ['rebuilding homes to earthquake-resistant designs', 'Long-term response'],
    ['repairing roads and the water supply', 'Long-term response'],
    ['introducing stricter building regulations', 'Long-term response'],
  ],
  ask: (x) => `Is this an immediate response or a long-term response to an earthquake: ${x}?`,
  hint: 'Immediate responses save lives in the first hours and days; long-term responses rebuild over months and years.',
  means: {
    'Immediate response': 'Happens in the first hours and days to save lives and meet basic needs.',
    'Long-term response': 'Happens over months and years to rebuild and reduce future risk.',
  },
  lv: [1, 4],
})

export const tectonicsGenerators: ItemGenerator[] = [
  ...bankGenerators(structure),
  ...bankGenerators(boundaries),
  ...bankGenerators(volcanoes),
  ...bankGenerators(earthquakes),
  ...quakeGenerators,
  ...bankGenerators(responses),
  ...responseGenerators,
]
