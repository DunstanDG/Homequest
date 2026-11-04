import type { ItemGenerator } from '@/engine/registry'
import { choice } from '../../kit'
import { bankGenerators, classifyGenerators, fmt, G, num, round, table, type Bank } from './factory'

// =====================================================================================================================
// Earth's structure and rocks
// =====================================================================================================================

const rockClassify = classifyGenerators('chem.earth.rocks', {
  id: 'rock-type',
  categories: ['Igneous', 'Sedimentary', 'Metamorphic'],
  items: [
    ['granite', 'Igneous'],
    ['basalt', 'Igneous'],
    ['obsidian', 'Igneous'],
    ['sandstone', 'Sedimentary'],
    ['limestone', 'Sedimentary'],
    ['chalk', 'Sedimentary'],
    ['mudstone', 'Sedimentary'],
    ['marble', 'Metamorphic'],
    ['slate', 'Metamorphic'],
    ['quartzite', 'Metamorphic'],
  ],
  ask: (x) => `What type of rock is ${x}?`,
  hint: 'Igneous rocks come from cooled magma, sedimentary from layers of sediment, metamorphic from rocks changed by heat and pressure.',
  means: {
    Igneous: 'Formed when molten rock (magma or lava) cools and crystallises.',
    Sedimentary: 'Formed from layers of sediment that are compacted and cemented together.',
    Metamorphic: 'Formed when existing rock is changed by heat and pressure without melting.',
  },
  sortPrompt: 'Match each rock to its type.',
})

const rocks: Bank = {
  skill: 'chem.earth.rocks',
  links: [
    {
      prompt: 'Match each layer of the Earth to its description.',
      pairs: [
        ['Crust', 'The thin, solid, rocky outer layer'],
        ['Mantle', 'The thick layer of hot rock that is mostly solid but can flow very slowly'],
        ['Outer core', 'Liquid iron and nickel'],
        ['Inner core', 'Solid iron and nickel at the centre'],
      ],
      hint: 'The two core layers are both iron and nickel; one is liquid and one is solid.',
      ask: (l) => `Which description fits the ${l.toLowerCase()}?`,
      lv: [1, 4],
    },
    {
      prompt: 'Match each metamorphic rock to the rock it formed from.',
      pairs: [
        ['Marble', 'Limestone'],
        ['Slate', 'Mudstone or shale'],
        ['Quartzite', 'Sandstone'],
      ],
      hint: 'Marble and limestone are both made of calcium carbonate.',
      ask: (l) => `Which rock is ${l.toLowerCase()} formed from?`,
      lv: [3, 5],
    },
  ],
  mcqs: [
    {
      q: 'Why do sedimentary rocks sometimes contain fossils, while igneous rocks do not?',
      a: 'Sedimentary rocks form at low temperatures from layers of sediment that can bury remains; igneous rocks form from molten rock, which would destroy them',
      wrong: [
        { label: 'Animals only lived on sedimentary rocks', misconception: 'fossil-habitat', feedback: 'It is about how the rock forms, not where animals lived.' },
        'Igneous rocks are too hard to dig into',
        'Fossils dissolve in igneous rocks',
      ],
      hint: 'Think about the temperatures involved in forming each rock.',
      why: 'Dead organisms can be buried in layers of sediment, which slowly become rock without being heated much, so fossils survive. Molten rock is far too hot for remains to survive.',
      lv: [3, 5],
    },
    {
      q: 'Basalt has tiny crystals, but granite has large crystals. Why?',
      a: 'Basalt cooled quickly at the surface; granite cooled slowly underground',
      wrong: [
        { label: 'Basalt cooled slowly; granite cooled quickly', misconception: 'crystal-size-reversed', feedback: 'Slow cooling gives the crystals more time to grow, so slow cooling means BIG crystals.' },
        'Basalt is sedimentary',
        'Granite was squashed more',
      ],
      hint: 'Crystals need time to grow.',
      why: 'Lava that erupts cools quickly, giving small crystals (basalt). Magma that cools slowly deep underground has time to grow large crystals (granite).',
      lv: [3, 5],
    },
    {
      q: 'Which property is typical of sedimentary rocks?',
      a: 'They are often porous, with grains that are not tightly locked together',
      wrong: [{ label: 'They have interlocking crystals', misconception: 'sed-crystals', feedback: 'Interlocking crystals are typical of igneous (and many metamorphic) rocks.' }, 'They formed from molten rock', 'They are always very hard'],
      hint: 'Sedimentary rocks are made of grains cemented together.',
      why: 'Sedimentary rocks are made of separate grains cemented together, so there are often gaps that can hold water (porous), and they can be crumbly.',
      lv: [2, 4],
    },
    {
      q: 'Which layer of the Earth do we live on?',
      a: 'The crust',
      wrong: [{ label: 'The mantle', misconception: 'live-mantle', feedback: 'The mantle lies beneath the crust.' }, 'The outer core', 'The inner core'],
      hint: 'It is the thinnest, outermost layer.',
      why: 'We live on the crust, the thin rocky outer layer of the Earth.',
      keepOrder: true,
      lv: [1, 2],
    },
  ],
  orders: [
    {
      prompt: 'Put the layers of the Earth in order.',
      steps: ['Crust', 'Mantle', 'Outer core', 'Inner core'],
      direction: ['surface', 'centre'],
      hint: 'The core has two parts.',
      why: 'From the surface: crust, mantle, outer core (liquid), inner core (solid).',
      lv: [1, 3],
    },
  ],
}

// =====================================================================================================================
// The rock cycle
// =====================================================================================================================

const rockCycle: Bank = {
  skill: 'chem.earth.rock-cycle',
  noun: 'process',
  terms: [
    { term: 'Weathering', def: 'The breaking down of rock where it is, by physical, chemical or biological processes' },
    { term: 'Erosion', def: 'The wearing away and removal of rock fragments, for example by rivers, waves, wind or ice' },
    { term: 'Transport', def: 'Moving rock fragments from one place to another' },
    { term: 'Deposition', def: 'Sediment being dropped and settling, for example at the bottom of a lake or sea' },
    { term: 'Compaction', def: 'Layers of sediment being squashed by the weight of the layers above' },
    { term: 'Cementation', def: 'Dissolved minerals gluing grains of sediment together' },
    { term: 'Uplift', def: 'Rocks being pushed up to the surface by movements of the Earth\'s crust' },
  ],
  links: [
    {
      prompt: 'Match each type of weathering to an example.',
      pairs: [
        ['Physical weathering', 'Water freezes in a crack, expands and splits the rock'],
        ['Chemical weathering', 'Acid rain reacts with limestone and dissolves it'],
        ['Biological weathering', 'Plant roots grow into cracks and push the rock apart'],
      ],
      hint: 'Is it a force, a reaction, or a living thing?',
      ask: (l) => `Which is an example of ${l.toLowerCase()}?`,
      lv: [2, 4],
    },
  ],
  mcqs: [
    {
      q: 'Which process in the rock cycle turns sedimentary rock into metamorphic rock?',
      a: 'Heat and pressure, without melting',
      wrong: [{ label: 'Melting and then cooling', misconception: 'metamorphic-melts', feedback: 'If the rock melted and cooled, it would become IGNEOUS rock.' }, 'Weathering and erosion', 'Compaction and cementation'],
      hint: '"Meta" means change: the rock changes while still solid.',
      why: 'Metamorphic rocks form when heat and pressure deep underground change existing rock without melting it.',
      lv: [2, 4],
    },
    {
      q: 'Which rock type forms when magma cools and crystallises?',
      a: 'Igneous',
      wrong: [{ label: 'Metamorphic', misconception: 'metamorphic-melts', feedback: 'Metamorphic rocks form WITHOUT melting.' }, 'Sedimentary'],
      hint: '"Ignis" is Latin for fire.',
      why: 'Igneous rocks form when molten rock (magma underground, lava at the surface) cools and crystallises.',
      keepOrder: true,
      lv: [1, 3],
    },
    {
      q: 'Why does freeze-thaw weathering happen most in places where the temperature often goes above and below 0 °C?',
      a: 'Water in cracks repeatedly freezes and expands, then melts, widening the crack a little each time',
      wrong: [{ label: 'Ice is heavier than water, so it crushes the rock', misconception: 'ice-heavier', feedback: 'Ice is less dense than water. It is the expansion on freezing that does the damage.' }, 'Cold weather makes the rock melt', 'Rock dissolves in very cold water'],
      hint: 'What happens to the volume of water when it freezes?',
      why: 'Water expands when it freezes, pushing on the sides of the crack. When it thaws, more water gets in. Repeated many times, this breaks pieces off.',
      lv: [3, 5],
    },
  ],
  orders: [
    {
      prompt: 'Put the stages in the formation of a sedimentary rock in order.',
      steps: ['Weathering breaks rock into small pieces', 'Erosion and transport carry the pieces away', 'Deposition: the sediment settles in layers', 'Compaction: the weight of new layers squashes the layers below', 'Cementation: minerals glue the grains together'],
      direction: ['first', 'last'],
      hint: 'The rock has to be broken up and moved before it can settle and be squashed.',
      why: 'Weathering → erosion and transport → deposition → compaction → cementation forms sedimentary rock.',
      lv: [2, 5],
    },
    {
      prompt: 'Put the stages of freeze-thaw weathering in order.',
      steps: ['Rain water trickles into a crack in the rock', 'The water freezes at night and expands', 'The ice pushes the crack wider', 'The ice melts and more water gets in', 'After many cycles a piece of rock breaks off'],
      direction: ['first', 'last'],
      hint: 'It starts with water getting into a crack.',
      why: 'Water enters, freezes and expands, widening the crack; it thaws, more water enters, and eventually the rock splits.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Describe how a piece of granite on a mountain could eventually become part of a sedimentary rock.',
      model:
        'The granite is weathered, for example by freeze-thaw, which breaks it into small pieces. Erosion by a river transports the pieces downhill, rounding them as they go. When the river slows down, for example where it reaches the sea, the sediment is deposited in layers. Over millions of years more layers build up on top, compacting the lower layers, and minerals cement the grains together to form sedimentary rock such as sandstone.',
      checklist: ['Mentions weathering breaking up the granite', 'Mentions erosion / transport (e.g. by a river)', 'Mentions deposition in layers', 'Mentions compaction and/or cementation', 'Puts the stages in a sensible order'],
      hint: 'Follow the rock fragments from the mountain to the sea.',
    },
  ],
}

// =====================================================================================================================
// The atmosphere
// =====================================================================================================================

const GASES: [string, number, string][] = [
  ['Nitrogen', 78, 'about 78%'],
  ['Oxygen', 21, 'about 21%'],
  ['Argon', 0.9, 'about 0.9%'],
  ['Carbon dioxide', 0.04, 'about 0.04%'],
]

const atmosphere: Bank = {
  skill: 'chem.earth.atmosphere',
  links: [
    {
      prompt: 'Match each gas to roughly how much of dry air it makes up.',
      pairs: GASES.map(([g, , p]) => [g, p] as [string, string]),
      hint: 'Most of the air is not oxygen.',
      ask: (l) => `Roughly what percentage of dry air is ${l.toLowerCase()}?`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'Which gas makes up most of the Earth\'s atmosphere?',
      a: 'Nitrogen',
      wrong: [{ label: 'Oxygen', misconception: 'air-mostly-oxygen', feedback: 'Oxygen is only about 21%. Nitrogen is about 78%.' }, 'Carbon dioxide', 'Argon'],
      hint: 'It is about four-fifths of the air.',
      why: 'Dry air is about 78% nitrogen, 21% oxygen, 0.9% argon and 0.04% carbon dioxide, plus tiny amounts of other gases. Air also contains a variable amount of water vapour.',
      lv: [1, 3],
      figure: { type: 'bar-chart', bars: [{ label: 'Nitrogen', value: 78 }, { label: 'Oxygen', value: 21 }, { label: 'Argon', value: 0.9 }, { label: 'Other', value: 0.1 }], yLabel: 'Percentage of dry air', showValues: false },
    },
    {
      q: 'Scientists think the Earth\'s early atmosphere was mostly carbon dioxide, with little or no oxygen. Where did most of the oxygen come from?',
      a: 'Photosynthesis by early plants and algae',
      wrong: [{ label: 'Volcanoes', misconception: 'volcano-oxygen', feedback: 'Volcanoes gave out carbon dioxide and water vapour, not oxygen.' }, 'Oxygen leaking from the Earth\'s core', 'Burning fossil fuels'],
      hint: 'Which process takes in carbon dioxide and gives out oxygen?',
      why: 'Algae and later plants photosynthesised, using up carbon dioxide and releasing oxygen. Over hundreds of millions of years oxygen built up to today\'s level.',
      lv: [3, 5],
    },
    {
      q: 'The early atmosphere had much more carbon dioxide than today. Where did most of it go?',
      a: 'It was used by photosynthesis, dissolved in the oceans, and locked up in sedimentary rocks and fossil fuels',
      wrong: [{ label: 'It escaped into space', misconception: 'co2-space', feedback: 'Carbon dioxide is a heavy gas. It was removed by processes on Earth.' }, 'It turned into nitrogen', 'It was breathed in by animals'],
      hint: 'Think of plants, the sea and rocks like limestone.',
      why: 'Carbon dioxide was absorbed by photosynthesis, dissolved in the oceans, and much of that carbon ended up in sedimentary rocks such as limestone, and in fossil fuels.',
      lv: [4, 5],
    },
  ],
}

const atmosphereGenerators: ItemGenerator[] = [
  G('chem.earth.atmosphere.oxygen-percent', 'chem.earth.atmosphere', [3, 5], (rng) => {
    const start = rng.pick([50, 100, 200, 250])
    const pct = rng.pick([18, 19, 20, 21])
    const end = round(start * (1 - pct / 100), 1)
    return num({
      prompt: `A student passes ${start} cm^{3} of air back and forth over hot copper until all the oxygen has reacted. ${fmt(end)} cm^{3} of gas is left. What percentage of the air was oxygen in her experiment?`,
      answer: pct,
      suffix: '%',
      tolerance: 0.5,
      hint: 'The volume that disappeared was the oxygen. Divide by the starting volume and multiply by 100.',
      explanation: `Oxygen used = ${start} − ${fmt(end)} = ${fmt(start - end)} cm^{3}. Percentage = ${fmt(start - end)} ÷ ${start} × 100 = ${pct}%. (The accepted value is about 21%.)`,
      errors: [{ values: [round((end / start) * 100, 1)], tag: 'percent-left', message: 'That is the percentage of gas LEFT. The oxygen is the part that was used up.' }],
    })
  }),
]

// =====================================================================================================================
// The carbon cycle
// =====================================================================================================================

const carbonClassify = classifyGenerators('chem.earth.carbon-cycle', {
  id: 'add-remove',
  categories: ['Adds carbon dioxide to the air', 'Removes carbon dioxide from the air'],
  items: [
    ['respiration', 'Adds carbon dioxide to the air'],
    ['burning fossil fuels', 'Adds carbon dioxide to the air'],
    ['decomposition of dead plants by microorganisms', 'Adds carbon dioxide to the air'],
    ['volcanic eruptions', 'Adds carbon dioxide to the air'],
    ['burning wood', 'Adds carbon dioxide to the air'],
    ['photosynthesis', 'Removes carbon dioxide from the air'],
    ['carbon dioxide dissolving in the oceans', 'Removes carbon dioxide from the air'],
    ['planting new forests', 'Removes carbon dioxide from the air'],
  ],
  ask: (x) => `What effect does this have on the amount of carbon dioxide in the air: ${x}?`,
  hint: 'Burning and respiration give carbon dioxide out. Which process takes it in to make glucose?',
  means: {
    'Adds carbon dioxide to the air': 'Respiration, combustion, decomposition and volcanoes release carbon dioxide.',
    'Removes carbon dioxide from the air': 'Photosynthesis and dissolving in the oceans take carbon dioxide out of the air.',
  },
})

const carbonCycle: Bank = {
  skill: 'chem.earth.carbon-cycle',
  mcqs: [
    {
      q: 'Which of these is a carbon store?',
      a: 'Fossil fuels such as coal',
      wrong: [{ label: 'Nitrogen in the air', misconception: 'nitrogen-carbon', feedback: 'Nitrogen contains no carbon.' }, 'Water in the oceans (the H_{2}O itself)', 'Oxygen gas'],
      hint: 'A carbon store must contain carbon compounds.',
      why: 'Carbon is stored in the atmosphere (as carbon dioxide), in living things, in the oceans (dissolved carbon dioxide), in fossil fuels and in rocks such as limestone.',
      lv: [1, 3],
    },
    {
      q: 'How do microorganisms put carbon back into the atmosphere when a plant dies?',
      a: 'They feed on the dead plant and respire, releasing carbon dioxide',
      wrong: [{ label: 'They photosynthesise', misconception: 'decomposers-photosynthesise', feedback: 'Decomposers such as bacteria and fungi respire; they do not photosynthesise.' }, 'They turn the carbon into oxygen', 'They burn the plant'],
      hint: 'What process releases carbon dioxide in every living thing?',
      why: 'Decomposers break down dead material and respire, giving out carbon dioxide.',
      lv: [2, 4],
    },
    {
      q: 'Fossil fuels such as coal contain carbon. Where did that carbon originally come from?',
      a: 'Carbon dioxide in the air, taken in by plants by photosynthesis millions of years ago',
      wrong: [{ label: 'The Earth\'s core', misconception: 'core-carbon', feedback: 'Fossil fuels formed from the remains of living things.' }, 'Volcanic lava', 'It was made when the coal was burned'],
      hint: 'Coal formed from ancient plants.',
      why: 'Ancient plants took in carbon dioxide by photosynthesis. When they died and were buried, their carbon was slowly turned into coal over millions of years.',
      lv: [3, 5],
    },
  ],
  orders: [
    {
      prompt: 'Follow a carbon atom through part of the carbon cycle. Put the steps in order.',
      steps: ['Carbon dioxide in the air', 'Taken in by a grass plant during photosynthesis', 'Eaten by a cow, becoming part of its body', 'Released as carbon dioxide when the cow respires'],
      direction: ['first', 'last'],
      hint: 'Start and end in the air.',
      why: 'Photosynthesis takes carbon from the air into plants; feeding passes it to animals; respiration returns it to the air as carbon dioxide.',
      lv: [2, 4],
    },
  ],
  written: [
    {
      prompt: 'Explain why cutting down and burning large areas of forest increases the amount of carbon dioxide in the atmosphere.',
      model:
        'Burning the trees is combustion, which releases the carbon stored in the wood as carbon dioxide. Also, with fewer trees there is less photosynthesis, so less carbon dioxide is taken out of the air. Both effects mean more carbon dioxide stays in the atmosphere.',
      checklist: ['Says burning (combustion) releases carbon dioxide', 'Says the carbon was stored in the trees', 'Says fewer trees means less photosynthesis', 'Says less carbon dioxide is removed from the air'],
      hint: 'There are two separate effects.',
    },
  ],
}

// =====================================================================================================================
// Climate change
// =====================================================================================================================

/** Approximate yearly averages of carbon dioxide measured at Mauna Loa, Hawaii (parts per million). */
const CO2_PPM: [number, number][] = [
  [1960, 317],
  [1970, 326],
  [1980, 339],
  [1990, 354],
  [2000, 370],
  [2010, 390],
  [2020, 414],
]

const climate: Bank = {
  skill: 'chem.earth.climate',
  terms: [
    { term: 'Greenhouse effect', def: 'Gases in the atmosphere absorbing heat (infrared) given off by the Earth\'s surface, keeping the Earth warmer than it would otherwise be' },
    { term: 'Greenhouse gas', def: 'A gas that absorbs infrared radiation, such as carbon dioxide, methane or water vapour' },
    { term: 'Global warming', def: 'The rise in the Earth\'s average surface temperature' },
    { term: 'Climate change', def: 'Long-term changes in weather patterns, such as temperature and rainfall, across the world' },
    { term: 'Fossil fuel', def: 'A fuel such as coal, oil or natural gas, formed over millions of years from the remains of living things' },
  ],
  mcqs: [
    {
      q: 'Which human activity adds the most carbon dioxide to the atmosphere?',
      a: 'Burning fossil fuels',
      wrong: [{ label: 'Breathing out', misconception: 'breathing-co2', feedback: 'Respiration is part of the natural carbon cycle. Burning fossil fuels releases carbon that was locked away for millions of years.' }, 'Using aerosol sprays', 'Recycling plastics'],
      hint: 'Think about power stations, cars and planes.',
      why: 'Burning coal, oil and gas releases carbon that had been stored underground for millions of years, adding extra carbon dioxide to the air.',
      lv: [1, 3],
    },
    {
      q: 'Is the greenhouse effect itself a bad thing?',
      a: 'No: without it the Earth would be too cold for most life; the problem is that extra greenhouse gases are making it stronger',
      wrong: [{ label: 'Yes: without it the Earth would be cooler and better for life', misconception: 'greenhouse-all-bad', feedback: 'Without any greenhouse effect the Earth would be frozen.' }, 'Yes: it is caused only by humans', 'No: it has no effect on temperature'],
      hint: 'What would the Earth be like with no atmosphere to keep heat in?',
      why: 'The natural greenhouse effect keeps the Earth warm enough for life. Adding more greenhouse gases strengthens it, causing global warming.',
      lv: [3, 5],
    },
    {
      q: 'Which of these is a source of methane, a greenhouse gas?',
      a: 'Cattle farming',
      wrong: [{ label: 'Wind turbines', misconception: 'wind-methane', feedback: 'Wind turbines do not release greenhouse gases when they run.' }, 'Solar panels', 'Planting trees'],
      hint: 'It comes from the digestion of certain animals.',
      why: 'Cattle release methane from their digestion. Rice paddies and rotting waste in landfill sites also release methane.',
      lv: [2, 4],
    },
    {
      q: 'Which is an effect of climate change?',
      a: 'Sea levels rising as ice on land melts and sea water warms and expands',
      wrong: [{ label: 'The hole in the ozone layer', misconception: 'ozone-climate', feedback: 'Ozone depletion is a different problem, caused by other gases.' }, 'Earthquakes becoming more common', 'The Earth spinning faster'],
      hint: 'What happens to ice and to water as the planet warms?',
      why: 'Warming melts glaciers and ice sheets, and warmer water expands, so sea levels rise. Other effects include more extreme weather and changes to where species can live.',
      lv: [2, 4],
    },
    {
      q: 'Which action would reduce the amount of carbon dioxide released?',
      a: 'Generating electricity from wind and solar power instead of burning coal',
      wrong: [{ label: 'Burning more wood instead of recycling paper', misconception: 'burn-wood-better', feedback: 'Burning wood releases carbon dioxide too.' }, 'Cutting down forests to build houses', 'Driving instead of walking short distances'],
      hint: 'Which option avoids burning anything?',
      why: 'Wind and solar power generate electricity without burning fuel, so they release far less carbon dioxide than coal.',
      lv: [1, 3],
    },
  ],
  written: [
    {
      prompt: 'Explain how burning fossil fuels can lead to climate change.',
      model:
        'Burning fossil fuels releases carbon dioxide, a greenhouse gas. Carbon dioxide absorbs some of the heat (infrared radiation) given off by the Earth\'s surface and stops it escaping into space. More carbon dioxide means more heat is trapped, so the average temperature rises (global warming). This changes weather patterns, causing climate change such as more extreme weather and rising sea levels.',
      checklist: ['Says burning fossil fuels releases carbon dioxide', 'Says carbon dioxide is a greenhouse gas that traps / absorbs heat', 'Says the Earth\'s average temperature rises', 'Gives at least one effect (sea level, extreme weather, habitats)'],
      hint: 'Link the gas to the heat, then the heat to the effects.',
    },
  ],
}

const climateGenerators: ItemGenerator[] = [
  G('chem.earth.climate.co2-data', 'chem.earth.climate', [2, 5], (rng, d) => {
    const fig = table(['Year', 'Carbon dioxide (parts per million)'], CO2_PPM.map(([y, p]) => [String(y), String(p)]))
    if (d <= 2) {
      return choice({
        rng,
        prompt: 'The table shows approximate yearly averages of carbon dioxide in the air, measured at Mauna Loa in Hawaii. What is the trend?',
        correct: 'Carbon dioxide has increased every decade',
        wrong: [{ label: 'Carbon dioxide has decreased', misconception: 'trend-reversed', feedback: 'Each value is bigger than the one before.' }, 'Carbon dioxide has stayed about the same', 'Carbon dioxide went up and then down'],
        figure: fig,
        hint: 'Compare the first and last values, and check the ones in between.',
        explanation: 'Each reading is higher than the one before, so the concentration of carbon dioxide has risen steadily, from about 317 ppm in 1960 to about 414 ppm in 2020.',
      })
    }
    const i = rng.int(0, CO2_PPM.length - 2)
    const j = d >= 4 ? rng.int(i + 2, CO2_PPM.length - 1) : i + 1
    const [y1, p1] = CO2_PPM[i] as [number, number]
    const [y2, p2] = CO2_PPM[Math.min(j, CO2_PPM.length - 1)] as [number, number]
    if (d <= 4) {
      return num({
        prompt: `Use the table. By how much did carbon dioxide increase between ${y1} and ${y2}? Give your answer in parts per million (ppm).`,
        answer: p2 - p1,
        suffix: 'ppm',
        figure: fig,
        hint: 'Subtract the earlier value from the later one.',
        explanation: `${p2} − ${p1} = ${p2 - p1} ppm.`,
      })
    }
    const first = CO2_PPM[0] as [number, number]
    const last = CO2_PPM[CO2_PPM.length - 1] as [number, number]
    const pct = round(((last[1] - first[1]) / first[1]) * 100, 0)
    return num({
      prompt: `Use the table. By what percentage did carbon dioxide increase from ${first[0]} to ${last[0]}? Give your answer to the nearest whole number.`,
      answer: pct,
      suffix: '%',
      tolerance: 0.5,
      figure: fig,
      hint: 'Percentage increase = increase ÷ starting value × 100.',
      explanation: `Increase = ${last[1]} − ${first[1]} = ${last[1] - first[1]} ppm. ${last[1] - first[1]} ÷ ${first[1]} × 100 = ${pct}%.`,
      errors: [{ values: [last[1] - first[1]], tag: 'not-percent', message: 'That is the increase in ppm. Now turn it into a percentage of the 1960 value.' }],
    })
  }),
]

// =====================================================================================================================
// Earth's resources and recycling
// =====================================================================================================================

const resources: Bank = {
  skill: 'chem.earth.resources',
  terms: [
    { term: 'Finite resource', def: 'A resource that will eventually run out because it cannot be replaced, such as metal ores or crude oil' },
    { term: 'Renewable resource', def: 'A resource that can be replaced as fast as we use it, such as wood from managed forests' },
    { term: 'Recycling', def: 'Collecting used materials and processing them so they can be made into new products' },
    { term: 'Landfill', def: 'Burying waste in large holes in the ground' },
  ],
  mcqs: [
    {
      q: 'Which is a benefit of recycling aluminium cans instead of extracting new aluminium?',
      a: 'It uses far less energy and saves aluminium ore',
      wrong: [{ label: 'It produces more aluminium than was in the cans', misconception: 'recycle-more', feedback: 'Recycling cannot make more metal than you started with.' }, 'It needs more electricity than electrolysis', 'It makes aluminium magnetic'],
      hint: 'Extracting aluminium from its ore needs a lot of electricity.',
      why: 'Melting down used aluminium takes much less energy than extracting it from bauxite ore by electrolysis, and it saves ore and reduces mining and landfill.',
      lv: [2, 4],
    },
    {
      q: 'Which is a disadvantage of recycling?',
      a: 'Collecting, transporting and sorting the waste uses energy and costs money',
      wrong: [{ label: 'It uses up more ore', misconception: 'recycle-uses-ore', feedback: 'Recycling SAVES ore.' }, 'It increases the amount of landfill', 'It always uses more energy than making things new'],
      hint: 'Think about bin lorries and sorting plants.',
      why: 'Recycling has costs: waste has to be collected, transported and sorted, which uses energy and money. Usually the benefits are still bigger, especially for metals.',
      lv: [3, 5],
    },
    {
      q: 'Which of these is a finite resource?',
      a: 'Iron ore',
      wrong: [{ label: 'Wood from a managed forest', misconception: 'wood-finite', feedback: 'Trees can be replanted, so wood is renewable if forests are managed.' }, 'Wind', 'Sunlight'],
      hint: 'Which one cannot be replaced once it is used up?',
      why: 'Metal ores formed over millions of years and cannot be replaced, so they are finite. Recycling helps them last longer.',
      lv: [1, 3],
    },
  ],
  orders: [
    {
      prompt: 'Put these ways of dealing with waste in order, from most to least preferred.',
      steps: ['Reduce: use less in the first place', 'Reuse: use the item again', 'Recycle: turn it into something new', 'Landfill: bury it'],
      direction: ['most preferred', 'least preferred'],
      hint: 'The best option avoids making the waste at all.',
      why: 'Reducing avoids using resources at all; reusing needs little energy; recycling needs some energy; landfill wastes the material completely.',
      lv: [2, 4],
    },
  ],
}

const resourcesGenerators: ItemGenerator[] = [
  G('chem.earth.resources.percent', 'chem.earth.resources', [2, 5], (rng, d) => {
    const total = rng.pick([20, 40, 50, 80, 200])
    const pct = rng.pick([25, 30, 40, 45, 60, 65, 75, 80])
    const recycled = (total * pct) / 100
    const fig = table(['Waste collected in one week', 'Mass (kg)'], [['Total waste', String(total)], ['Recycled', fmt(recycled)]])
    if (d <= 4) {
      return num({
        prompt: 'A school records its waste for a week. What percentage of the waste was recycled?',
        answer: pct,
        suffix: '%',
        tolerance: 0.5,
        figure: fig,
        hint: 'Percentage = recycled mass ÷ total mass × 100.',
        explanation: `${fmt(recycled)} ÷ ${total} × 100 = ${pct}%.`,
        errors: [{ values: [100 - pct], tag: 'not-recycled', message: 'That is the percentage NOT recycled.' }],
      })
    }
    const target = pct + rng.pick([10, 15, 20])
    const more = (total * (target - pct)) / 100
    return num({
      prompt: `A school records its waste for a week. The school wants to recycle ${target}% of its waste. How many more kilograms would it need to recycle each week (with the same total)?`,
      answer: more,
      suffix: 'kg',
      tolerance: 0.01,
      figure: fig,
      hint: `Work out ${target}% of the total, then compare it with what is recycled now.`,
      explanation: `${target}% of ${total} kg = ${fmt((total * target) / 100)} kg. It recycles ${fmt(recycled)} kg now, so it needs ${fmt(more)} kg more.`,
    })
  }),
]

export const earthGenerators: ItemGenerator[] = [
  ...rockClassify,
  ...bankGenerators(rocks),
  ...bankGenerators(rockCycle),
  ...bankGenerators(atmosphere),
  ...atmosphereGenerators,
  ...carbonClassify,
  ...bankGenerators(carbonCycle),
  ...bankGenerators(climate),
  ...climateGenerators,
  ...bankGenerators(resources),
  ...resourcesGenerators,
]
