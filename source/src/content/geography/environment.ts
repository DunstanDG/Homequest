import type { ItemGenerator } from '@/engine/registry'
import { bankGenerators, classifyGenerators, type Bank } from './factory'

// =====================================================================================================================
// Deforestation
// =====================================================================================================================

const deforestation: Bank = {
  skill: 'environment.deforestation',
  terms: [
    { term: 'Deforestation', def: 'Cutting down and removing trees from a forest on a large scale' },
    { term: 'Selective logging', def: 'Cutting down only some mature trees, leaving the rest of the forest to regrow' },
    { term: 'Cattle ranching', def: 'Clearing forest to create pasture for large herds of beef cattle' },
    { term: 'Subsistence farming', def: 'Growing food mainly to feed your own family, not to sell' },
    { term: 'Afforestation', def: 'Planting trees where there were none, or replanting areas that have been cleared' },
    { term: 'Soil erosion', def: 'Soil being washed or blown away, often after the protective plant cover is removed' },
  ],
  links: [
    {
      prompt: 'Match each cause of deforestation in the Amazon to its description.',
      pairs: [
        ['Cattle ranching', 'Clearing land for pasture: the largest single cause in the Amazon'],
        ['Commercial farming', 'Clearing land for large fields of crops such as soya'],
        ['Logging', 'Cutting down valuable hardwood trees such as mahogany'],
        ['Mining', 'Clearing land to dig for minerals such as iron ore and gold'],
        ['Road building', 'Clearing routes through the forest, which then opens it up to settlers'],
        ['Hydroelectric power', 'Flooding large areas of forest behind new dams'],
      ],
      hint: 'Each cause clears the forest for a different purpose.',
      ask: (l) => `Which description matches this cause of deforestation: ${l.toLowerCase()}?`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'How does tropical deforestation contribute to climate change?',
      a: 'Trees store carbon; when they are burned or rot, carbon dioxide is released, and fewer trees remain to absorb it',
      wrong: [{ label: 'Trees give off carbon dioxide, so removing them cools the planet', misconception: 'trees-emit', feedback: 'Growing trees absorb carbon dioxide. Burning them releases the stored carbon.' }, 'Deforestation makes the Sun stronger', 'It has no effect on the atmosphere'],
      hint: 'Trees take in carbon dioxide as they grow.',
      why: 'Rainforests store huge amounts of carbon. Burning cleared forest releases it as carbon dioxide, and the lost trees can no longer absorb carbon dioxide from the air.',
      lv: [2, 4],
    },
    {
      q: 'Why does soil erosion increase after rainforest is cleared?',
      a: 'There is no canopy to intercept the heavy rain and no roots to hold the soil together',
      wrong: [{ label: 'It rains more after the trees are cut down', misconception: 'more-rain', feedback: 'Rainfall may actually decrease. The problem is that the soil is no longer protected.' }, 'The soil freezes and cracks', 'Animals dig up the soil'],
      hint: 'What did the trees do for the soil before they were removed?',
      why: 'The canopy intercepts rain and roots bind the soil. Once cleared, heavy rain hits bare ground and washes the thin soil away, often into rivers.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Evaluate whether the economic benefits of deforestation in the Amazon outweigh the environmental costs.',
      model: 'Deforestation brings economic benefits: cattle ranching, soya farming and mining create jobs and earn money from exports, and new roads and dams provide transport and energy. However, the environmental costs are serious. Clearing the forest destroys habitats and threatens huge numbers of species, releases carbon dioxide that adds to climate change, and leads to soil erosion. Indigenous people can lose their land and way of life. Overall, I think the costs outweigh the benefits, because the damage is global and long-lasting, while sustainable alternatives such as selective logging and ecotourism can still provide income.',
      checklist: ['Gives an economic benefit with an example', 'Gives an environmental cost', 'Gives another cost or benefit (e.g. for indigenous people, climate)', 'Reaches a judgement with a reason', 'Mentions a sustainable alternative'],
      hint: 'Weigh up who gains and who loses, now and in the future.',
      passMark: 3,
    },
  ],
}

const deforestationGenerators: ItemGenerator[] = classifyGenerators('environment.deforestation', {
  id: 'sustainable',
  categories: ['Sustainable', 'Not sustainable'],
  items: [
    ['selective logging, leaving younger trees to grow', 'Sustainable'],
    ['ecotourism that funds forest protection', 'Sustainable'],
    ['replanting trees after logging', 'Sustainable'],
    ['protecting areas as national parks', 'Sustainable'],
    ['clear-felling large areas for cattle pasture', 'Not sustainable'],
    ['burning forest to clear land for soya fields', 'Not sustainable'],
    ['open-pit mining in the forest', 'Not sustainable'],
  ],
  ask: (x) => `Is this a sustainable way to use the rainforest: ${x}?`,
  hint: 'Sustainable use meets people\'s needs now without destroying the forest for the future.',
  means: {
    Sustainable: 'The forest can keep providing for people in the future.',
    'Not sustainable': 'It destroys the forest, so it cannot keep providing in the future.',
  },
  lv: [1, 4],
})

// =====================================================================================================================
// Climate change: causes and evidence
// =====================================================================================================================

const climateChange: Bank = {
  skill: 'environment.climate-change',
  terms: [
    { term: 'Greenhouse effect', def: 'The natural process where gases in the atmosphere trap heat and keep the Earth warm enough for life' },
    { term: 'Enhanced greenhouse effect', def: 'Extra warming caused by human activities adding more heat-trapping gases to the atmosphere' },
    { term: 'Greenhouse gas', def: 'A gas, such as carbon dioxide or methane, that traps heat in the atmosphere' },
    { term: 'Fossil fuel', def: 'A fuel such as coal, oil or gas, formed from the remains of ancient plants and animals' },
    { term: 'Ice core', def: 'A long cylinder of ice drilled from a glacier or ice sheet, containing trapped bubbles of ancient air' },
  ],
  orders: [
    {
      prompt: 'Put the stages of the greenhouse effect in order.',
      steps: [
        'Energy from the Sun passes through the atmosphere',
        'The Earth\'s surface absorbs the energy and warms up',
        'The warm surface gives off heat back towards space',
        'Greenhouse gases absorb some of this heat and send it back down',
        'The lower atmosphere and the surface stay warmer',
      ],
      direction: ['first', 'last'],
      hint: 'The Sun\'s energy gets in easily; the heat finds it harder to get out.',
      why: 'Sunlight passes through the atmosphere and warms the surface, which gives off heat. Greenhouse gases trap some of that heat. More greenhouse gases trap more heat: the enhanced greenhouse effect.',
      lv: [3, 5],
    },
  ],
  mcqs: [
    {
      q: 'Which human activity releases the most carbon dioxide?',
      a: 'Burning fossil fuels for electricity, transport and industry',
      wrong: [{ label: 'Recycling paper', misconception: 'recycling', feedback: 'Recycling usually saves energy and emissions.' }, 'Planting trees', 'Using solar panels'],
      hint: 'Coal, oil and gas are made of ancient carbon.',
      why: 'Burning coal, oil and gas releases carbon that was locked away for millions of years. It is the biggest human source of carbon dioxide.',
      lv: [1, 3],
    },
    {
      q: 'Which of these is a NATURAL cause of climate change?',
      a: 'Changes in the Earth\'s orbit around the Sun over thousands of years',
      wrong: [{ label: 'Cattle farming releasing methane', misconception: 'natural-human', feedback: 'Farming is a human activity.' }, { label: 'Burning fossil fuels', misconception: 'natural-human', feedback: 'That is a human cause.' }, { label: 'Deforestation', misconception: 'natural-human', feedback: 'That is caused by people.' }],
      hint: 'Which one has nothing to do with people?',
      why: 'Natural causes include changes in the Earth\'s orbit (which drove past ice ages), changes in the Sun\'s output and large volcanic eruptions. Today\'s rapid warming is mainly caused by human activity.',
      lv: [2, 4],
    },
    {
      q: 'How do ice cores provide evidence about past climates?',
      a: 'Bubbles of air trapped in the ice show how much carbon dioxide was in the atmosphere when each layer formed',
      wrong: [{ label: 'They show the exact daily weather from millions of years ago', misconception: 'ice-weather', feedback: 'They give clues about long-term climate, not daily weather.' }, 'They contain fossils of dinosaurs', 'They measure how fast glaciers move today'],
      hint: 'Each year\'s snow traps a little of the air.',
      why: 'Layers of ice build up each year, trapping air bubbles. Scientists analyse them to find past carbon dioxide levels and temperatures going back hundreds of thousands of years.',
      lv: [3, 5],
    },
    {
      q: 'Roughly how much has the Earth\'s average surface temperature risen since the late 1800s?',
      a: 'More than 1°C',
      wrong: ['About 0.01°C', 'About 10°C', 'It has not changed'],
      hint: 'It sounds small, but it is a global average.',
      why: 'Average global temperatures have risen by more than 1°C since the late 1800s, mainly because of greenhouse gases from human activity.',
      lv: [3, 5],
    },
  ],
}

// =====================================================================================================================
// Climate change: effects and responses
// =====================================================================================================================

const climateResponses: Bank = {
  skill: 'environment.climate-responses',
  terms: [
    { term: 'Mitigation', def: 'Reducing the causes of climate change, for example by cutting greenhouse gas emissions' },
    { term: 'Adaptation', def: 'Changing the way we live to cope with the effects of climate change' },
    { term: 'Carbon capture and storage', def: 'Catching carbon dioxide from power stations and storing it underground' },
    { term: 'Thermal expansion', def: 'Sea water taking up more space as it warms, raising sea levels' },
    { term: 'Coral bleaching', def: 'Corals turning white and often dying when sea water becomes too warm' },
  ],
  mcqs: [
    {
      q: 'Melting of which ice raises sea levels most?',
      a: 'Ice sheets and glaciers on land, such as in Greenland and Antarctica',
      wrong: [{ label: 'Floating sea ice in the Arctic Ocean', misconception: 'sea-ice', feedback: 'Floating ice already displaces its own weight of water, so melting it barely changes sea level (like ice melting in a drink).' }, 'Ice in freezers', 'Hailstones'],
      hint: 'Think of ice cubes melting in a full glass of water.',
      why: 'Floating sea ice already displaces water, so it hardly changes sea level when it melts. Ice on land adds new water to the ocean. Warming water also expands.',
      lv: [4, 5],
    },
    {
      q: 'Why are countries such as Bangladesh and low-lying Pacific islands especially at risk from climate change?',
      a: 'Much of their land is only just above sea level, so rising seas and storm surges can flood it',
      wrong: [{ label: 'They produce the most greenhouse gases', misconception: 'blame', feedback: 'They produce relatively little. They are at risk because of their low height above the sea.' }, 'They are getting colder', 'They have no rivers'],
      hint: 'Think about height above sea level.',
      why: 'Low-lying coasts and islands face flooding, salt water spoiling farmland and drinking water, and stronger storm surges as seas rise.',
      lv: [2, 4],
    },
    {
      q: 'In 2015, almost every country signed an international agreement on climate change in Paris. What was its main aim?',
      a: 'To keep global warming well below 2°C, and try to limit it to 1.5°C',
      wrong: ['To stop all use of electricity', 'To make every country use the same amount of energy', 'To ban all cars by 2020'],
      hint: 'It set a limit on warming.',
      why: 'The Paris Agreement aims to keep the rise in global temperature well below 2°C above pre-industrial levels, and to try to limit it to 1.5°C, by cutting emissions.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Explain the difference between mitigation and adaptation, and give an example of each.',
      model: 'Mitigation means reducing the causes of climate change by cutting the amount of greenhouse gases released. An example is replacing coal power stations with wind farms and solar panels. Adaptation means changing how we live to cope with the effects of climate change that are already happening. An example is building higher flood defences in coastal cities as sea levels rise, or growing crops that can survive drought.',
      checklist: ['Defines mitigation correctly', 'Gives a correct example of mitigation', 'Defines adaptation correctly', 'Gives a correct example of adaptation'],
      hint: 'One tackles the cause; the other copes with the effects.',
    },
    {
      prompt: 'Describe two effects of climate change on people and two on the environment.',
      model: 'For people, rising sea levels threaten low-lying coastal cities and islands, which may flood more often, forcing people to move. More frequent droughts and heatwaves can cause crops to fail and food prices to rise. For the environment, warmer seas cause coral bleaching, and many species must move towards the poles or to higher ground; those that cannot may become extinct. Melting ice in the Arctic also reduces the habitat of animals such as polar bears.',
      checklist: ['Describes an effect on people', 'Describes a second, different effect on people', 'Describes an effect on the environment or wildlife', 'Describes a second, different effect on the environment'],
      hint: 'Think about sea level, extreme weather, food, ice and wildlife.',
    },
  ],
}

const responseGenerators: ItemGenerator[] = classifyGenerators('environment.climate-responses', {
  id: 'mitigate-adapt',
  categories: ['Mitigation', 'Adaptation'],
  items: [
    ['replacing coal power stations with wind farms', 'Mitigation'],
    ['planting forests to absorb carbon dioxide', 'Mitigation'],
    ['improving public transport so fewer people drive', 'Mitigation'],
    ['insulating homes to use less energy for heating', 'Mitigation'],
    ['building higher sea walls as sea levels rise', 'Adaptation'],
    ['growing crops that can survive drought', 'Adaptation'],
    ['building homes on stilts in flood-prone areas', 'Adaptation'],
    ['collecting and storing rainwater for dry spells', 'Adaptation'],
  ],
  ask: (x) => `Is this mitigation or adaptation: ${x}?`,
  hint: 'Mitigation tackles the causes (emissions). Adaptation helps people cope with the effects.',
  means: {
    Mitigation: 'It reduces greenhouse gas emissions or removes them from the air.',
    Adaptation: 'It helps people cope with the effects of climate change.',
  },
  lv: [1, 4],
})

// =====================================================================================================================
// Plastic pollution and sustainability
// =====================================================================================================================

const sustainability: Bank = {
  skill: 'environment.sustainability',
  terms: [
    { term: 'Sustainability', def: 'Meeting the needs of people today without stopping future generations from meeting their needs' },
    { term: 'Microplastics', def: 'Tiny pieces of plastic less than 5 mm long' },
    { term: 'Single-use plastic', def: 'Plastic items designed to be used once and thrown away, such as straws and carrier bags' },
    { term: 'Biodegradable', def: 'Able to be broken down naturally by bacteria and other living things' },
    { term: 'Carbon footprint', def: 'The total amount of greenhouse gases released by a person\'s or organisation\'s activities' },
  ],
  orders: [
    {
      prompt: 'Put the waste hierarchy in order, from the best option to the worst.',
      steps: ['Reduce', 'Reuse', 'Recycle', 'Recover energy', 'Dispose (landfill)'],
      direction: ['best', 'worst'],
      hint: 'The best waste is waste that is never created.',
      why: 'Reducing waste is best, then reusing items, then recycling materials, then recovering energy by burning waste, and finally landfill as a last resort.',
      lv: [2, 4],
    },
  ],
  mcqs: [
    {
      q: 'How does plastic in the ocean harm wildlife?',
      a: 'Animals can get tangled in it or mistake it for food, and microplastics enter food chains',
      wrong: [{ label: 'It dissolves quickly and makes the water warmer', misconception: 'plastic-dissolves', feedback: 'Plastic does not dissolve; it breaks into smaller and smaller pieces that last for centuries.' }, 'It has no effect because it sinks immediately', 'It only harms ships'],
      hint: 'Think of a turtle and a floating plastic bag.',
      why: 'Turtles, seabirds and whales eat plastic, which can block their stomachs. Animals get entangled in nets and rings. Microplastics are eaten by small creatures and passed up food chains.',
      lv: [1, 3],
    },
    {
      q: 'How does most plastic waste get into the oceans?',
      a: 'It is dropped as litter or poorly managed on land, then carried by rivers, drains and wind to the sea',
      wrong: [{ label: 'It is made in factories under the sea', misconception: 'sea-factories', feedback: 'Plastic is made on land; most marine plastic comes from land.' }, 'It rains down from clouds', 'Fish produce it'],
      hint: 'Rivers carry things downstream to the sea.',
      why: 'Most ocean plastic starts on land: litter, overflowing bins and badly managed waste are washed by rivers into the sea. Lost fishing gear also adds a lot.',
      lv: [2, 4],
    },
    {
      q: 'Why is plastic pollution such a long-lasting problem?',
      a: 'Most plastics are not biodegradable, so they last for hundreds of years, breaking into ever smaller pieces',
      wrong: [{ label: 'Plastic breaks down completely within a few weeks', misconception: 'plastic-rots', feedback: 'Most plastic takes hundreds of years to break down, and never fully disappears.' }, 'Plastic turns into oil in the sea', 'Plastic is eaten by decomposers in a few days'],
      hint: 'Can bacteria break plastic down?',
      why: 'Decomposers cannot break most plastics down, so they persist for centuries, fragmenting into microplastics that are almost impossible to remove.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Suggest how your school could become more sustainable. Explain how each idea would help.',
      model: 'The school could ban single-use plastic bottles in the canteen and install water fountains, which would reduce plastic waste going to landfill or the sea. It could put recycling bins in every classroom so paper and cans are recycled instead of thrown away. Turning off lights and computers when rooms are empty, or fitting solar panels, would reduce energy use and the school\'s carbon footprint. Encouraging students to walk, cycle or share lifts would cut traffic and air pollution.',
      checklist: ['Suggests an idea about waste or plastic and explains how it helps', 'Suggests an idea about energy and explains how it helps', 'Suggests an idea about transport or another area and explains how it helps', 'Uses a key term such as sustainable, carbon footprint or recycling'],
      hint: 'Think about waste, energy and transport.',
    },
  ],
}

export const environmentGenerators: ItemGenerator[] = [
  ...bankGenerators(deforestation),
  ...deforestationGenerators,
  ...bankGenerators(climateChange),
  ...bankGenerators(climateResponses),
  ...responseGenerators,
  ...bankGenerators(sustainability),
]
