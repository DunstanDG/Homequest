import type { ItemGenerator } from '@/engine/registry'
import type { Figure } from '@/engine/types'
import { choice } from '../kit'
import { bankGenerators, classifyGenerators, fmt, G, num, type Bank } from './factory'

// =====================================================================================================================
// Population distribution and density
// =====================================================================================================================

const distribution: Bank = {
  skill: 'population.distribution',
  terms: [
    { term: 'Population distribution', def: 'The way people are spread out across an area' },
    { term: 'Population density', def: 'The average number of people living in each square kilometre' },
    { term: 'Densely populated', def: 'Describes an area where many people live close together' },
    { term: 'Sparsely populated', def: 'Describes an area where few people live, spread far apart' },
  ],
  mcqs: [
    {
      q: 'Which of these areas is sparsely populated?',
      a: 'The Sahara Desert',
      wrong: [{ label: 'The Nile valley in Egypt', misconception: 'nile-sparse', feedback: 'The Nile valley is densely populated: almost all of Egypt\'s people live along the river.' }, 'South-east England', 'Eastern China'],
      hint: 'Where would it be hard to find water and grow food?',
      why: 'Very dry, very cold, very high or densely forested areas are sparsely populated. The Sahara is too dry to support many people.',
      lv: [1, 3],
    },
    {
      q: 'Which is a PHYSICAL reason why an area might be densely populated?',
      a: 'Flat, fertile land with a reliable water supply',
      wrong: [{ label: 'Lots of jobs in factories and offices', misconception: 'physical-human', feedback: 'Jobs are a human (economic) factor.' }, { label: 'Good roads and railways', misconception: 'physical-human', feedback: 'Transport links are a human factor.' }, { label: 'Good schools and hospitals', misconception: 'physical-human', feedback: 'Services are a human factor.' }],
      hint: 'Physical factors are about the natural environment.',
      why: 'Physical factors include relief, climate, soil and water. Human factors include jobs, transport, services and government policies.',
      lv: [2, 4],
    },
    {
      q: 'Roughly how many people live in the world today?',
      a: 'About 8 billion',
      wrong: ['About 800 million', 'About 80 billion', 'About 2 billion'],
      hint: 'It passed 7 billion around 2011.',
      why: 'The world\'s population is about 8 billion, and still growing, though more slowly than in the past.',
      lv: [2, 4],
    },
  ],
}

const densityGenerators: ItemGenerator[] = [
  G('population.density.calc', 'population.distribution', [2, 5], (rng, d) => {
    const area = d <= 2 ? rng.int(2, 9) * 1000 : rng.int(12, 95) * 1000
    const dens = d <= 2 ? rng.int(2, 9) * 10 : d === 3 ? rng.int(11, 99) : rng.int(101, 450)
    const pop = area * dens
    const name = rng.pick(['Region A', 'An island', 'A county', 'A country'])
    if (d >= 5) {
      // Reverse: find the population from density and area.
      return num({
        prompt: `${name} has an area of ${fmt(area)} km² and a population density of ${dens} people per km². What is its population?`,
        answer: pop,
        suffix: 'people',
        hint: 'Population density = population ÷ area, so population = density × area.',
        explanation: `${dens} × ${fmt(area)} = ${fmt(pop)} people.`,
        errors: [{ values: [area / dens], tag: 'divided', message: 'Rearrange: population = density × area.' }],
      })
    }
    return num({
      prompt: `${name} has a population of ${fmt(pop)} and an area of ${fmt(area)} km². What is its population density?`,
      answer: dens,
      suffix: 'people per km²',
      hint: 'Population density = population ÷ area.',
      explanation: `${fmt(pop)} ÷ ${fmt(area)} = ${dens} people per km².`,
      errors: [{ values: [Math.round((area / pop) * 1e6) / 1e6], tag: 'area-over-population', message: 'Divide the population by the area, not the other way round.' }],
    })
  }),
]

// =====================================================================================================================
// Population growth
// =====================================================================================================================

const growth: Bank = {
  skill: 'population.growth',
  terms: [
    { term: 'Birth rate', def: 'The number of live births per 1,000 people per year' },
    { term: 'Death rate', def: 'The number of deaths per 1,000 people per year' },
    { term: 'Natural increase', def: 'Growth in population when there are more births than deaths' },
    { term: 'Life expectancy', def: 'The average number of years a person can expect to live' },
    { term: 'Infant mortality rate', def: 'The number of babies who die before their first birthday per 1,000 live births' },
    { term: 'Fertility rate', def: 'The average number of children born to each woman' },
  ],
  mcqs: [
    {
      q: 'Why are birth rates often high in lower-income countries?',
      a: 'Children may be needed to work and to care for parents in old age, and access to contraception can be limited',
      wrong: [{ label: 'Because people there do not like small families', misconception: 'stereotype', feedback: 'It is about circumstances, not preference: economic needs, high infant mortality and access to family planning.' }, 'Because death rates are low', 'Because there are more hospitals'],
      hint: 'Think about money, health care and family planning.',
      why: 'Where many babies die young, children work on farms, and there are no pensions, families tend to be larger. Education for women and access to contraception lower birth rates.',
      lv: [3, 5],
    },
    {
      q: 'Which of these would most likely cause the death rate in a country to fall?',
      a: 'Better access to clean water and vaccinations',
      wrong: [{ label: 'More people moving to the country', misconception: 'migration-death', feedback: 'Migration changes the population size, but not the rate at which people die.' }, 'A higher birth rate', 'Fewer doctors'],
      hint: 'What stops people dying of disease?',
      why: 'Clean water, sanitation, vaccinations and better health care reduce deaths from disease, so death rates fall.',
      lv: [1, 3],
    },
  ],
}

const growthGenerators: ItemGenerator[] = [
  G('population.growth.natural', 'population.growth', [2, 5], (rng, d) => {
    const br = rng.int(8, 45)
    const dr = d >= 5 && rng.chance(0.4) ? rng.int(br + 1, br + 6) : rng.int(5, Math.max(6, br - 1))
    const ni = br - dr
    if (d >= 4) {
      const pct = Math.round(ni) / 10
      return num({
        prompt: `A country has a birth rate of ${br} per 1,000 and a death rate of ${dr} per 1,000. What is its rate of natural ${ni >= 0 ? 'increase' : 'change'} as a percentage? (Use a minus sign for a decrease.)`,
        answer: pct,
        suffix: '%',
        tolerance: 0.001,
        hint: 'Find births − deaths per 1,000, then divide by 10 to get a percentage (per 100).',
        explanation: `${br} − ${dr} = ${ni} per 1,000. Per 100 that is ${ni} ÷ 10 = ${pct}%.${ni < 0 ? ' It is negative: a natural decrease, so the population shrinks unless people migrate in.' : ''}`,
        errors: [
          { values: [ni], tag: 'per-thousand', message: `${ni} is per 1,000. A percentage is per 100, so divide by 10.` },
          { values: [(br + dr) / 10], tag: 'added', message: 'Natural increase is births MINUS deaths.' },
        ],
      })
    }
    return num({
      prompt: `A country has a birth rate of ${br} per 1,000 people and a death rate of ${dr} per 1,000. What is its natural increase per 1,000 people?`,
      answer: ni,
      suffix: 'per 1,000',
      hint: 'Natural increase = birth rate − death rate.',
      explanation: `${br} − ${dr} = ${ni} per 1,000 people per year.`,
      errors: [{ values: [br + dr], tag: 'added', message: 'Natural increase is births MINUS deaths.' }],
    })
  }),
]

// =====================================================================================================================
// Demographic transition model
// =====================================================================================================================

const DTM: { stage: string; desc: string }[] = [
  { stage: 'Stage 1', desc: 'High birth rate and high, fluctuating death rate; population stays low' },
  { stage: 'Stage 2', desc: 'High birth rate but rapidly falling death rate; population grows rapidly' },
  { stage: 'Stage 3', desc: 'Falling birth rate and low death rate; growth slows down' },
  { stage: 'Stage 4', desc: 'Low birth rate and low death rate; population is high but stable' },
  { stage: 'Stage 5', desc: 'Birth rate falls below death rate; population slowly declines' },
]

const dtm: Bank = {
  skill: 'population.dtm',
  links: [
    {
      prompt: 'Match each stage of the demographic transition model to its description.',
      pairs: DTM.map((s) => [s.stage, s.desc]),
      hint: 'Death rates fall first (stage 2); birth rates fall later (stage 3).',
      ask: (l) => `Which description matches ${l} of the demographic transition model?`,
      lv: [1, 4],
    },
  ],
  orders: [
    {
      prompt: 'Put the descriptions of the demographic transition model in order, from stage 1 to stage 5.',
      steps: DTM.map((s) => s.desc),
      direction: ['stage 1', 'stage 5'],
      hint: 'First the death rate falls, then the birth rate falls, and finally births drop below deaths.',
      why: DTM.map((s) => `${s.stage}: ${s.desc.charAt(0).toLowerCase()}${s.desc.slice(1)}.`).join(' '),
      lv: [3, 5],
    },
  ],
  mcqs: [
    {
      q: 'In stage 2 of the demographic transition model, why does the death rate fall so quickly?',
      a: 'Improvements in health care, clean water and food supply',
      wrong: [{ label: 'Families decide to have fewer children', misconception: 'birth-death-confused', feedback: 'That lowers the BIRTH rate, which happens later, in stage 3.' }, 'Many people emigrate', 'War and famine increase'],
      hint: 'What stops people dying young?',
      why: 'Better medicine, vaccinations, sanitation and food mean fewer people die, but birth rates stay high for a while, so the population grows rapidly.',
      lv: [2, 4],
    },
    {
      q: 'Which stage of the demographic transition model is the UK usually placed in?',
      a: 'Stage 4',
      wrong: [{ label: 'Stage 2', misconception: 'uk-stage2', feedback: 'Stage 2 has high birth rates and fast growth. The UK has low birth and death rates.' }, 'Stage 1', 'Stage 3'],
      hint: 'The UK has low birth rates and low death rates.',
      why: 'The UK has low birth and death rates, so it is usually placed in stage 4. Some countries with very low birth rates, such as Japan, are often placed in stage 5.',
      lv: [3, 5],
    },
    {
      q: 'In which stage does the total population grow most rapidly?',
      a: 'Stage 2',
      wrong: [{ label: 'Stage 4', misconception: 'high-is-growing', feedback: 'The population is high in stage 4 but it is stable, not growing fast.' }, 'Stage 1', 'Stage 5'],
      hint: 'Look for the biggest gap between birth rate and death rate.',
      why: 'In stage 2 the death rate falls sharply while the birth rate stays high, so the gap (natural increase) is largest.',
      lv: [2, 4],
    },
  ],
}

// =====================================================================================================================
// Population structure
// =====================================================================================================================

const structure: Bank = {
  skill: 'population.structure',
  terms: [
    { term: 'Population pyramid', def: 'A graph showing the percentage of males and females in each age group of a population' },
    { term: 'Dependent population', def: 'People who are too young or too old to work, usually under 16 and over 64' },
    { term: 'Economically active population', def: 'People of working age, usually 16 to 64' },
    { term: 'Ageing population', def: 'When the proportion of older people in a population is increasing' },
    { term: 'Youthful population', def: 'When a large proportion of the population is young, usually under 16' },
  ],
  mcqs: [
    {
      q: 'A population pyramid has a very wide base that narrows quickly towards the top. What does this suggest?',
      a: 'A high birth rate and a short life expectancy, typical of a lower-income country',
      wrong: [{ label: 'An ageing population, typical of a higher-income country', misconception: 'pyramid-reversed', feedback: 'An ageing population has a narrow base and a wide top.' }, 'A population that is not changing at all', 'That most people are aged over 65'],
      hint: 'The base shows the youngest age groups.',
      why: 'A wide base means many children (high birth rate); a narrow top means few people live to old age (high death rate, shorter life expectancy).',
      lv: [2, 4],
    },
    {
      q: 'Which is a challenge of an ageing population?',
      a: 'More money is needed for pensions and health care, paid for by fewer workers',
      wrong: [{ label: 'Too many new schools are needed', misconception: 'youthful-challenge', feedback: 'That is a challenge of a youthful population.' }, 'Birth rates rise rapidly', 'There are too many young workers'],
      hint: 'Think about who pays tax and who needs care.',
      why: 'As the proportion of older people grows, the cost of pensions and care rises while the share of people of working age paying tax falls.',
      lv: [3, 5],
    },
  ],
}

const structureGenerators: ItemGenerator[] = [
  G('population.structure.read', 'population.structure', [2, 5], (rng, d) => {
    const ageing = rng.chance(0.5)
    const young = ageing ? rng.int(14, 19) : rng.int(38, 46)
    const old = ageing ? rng.int(18, 25) : rng.int(2, 5)
    const working = 100 - young - old
    const figure: Figure = {
      type: 'table',
      head: ['Age group', '% of population'],
      rows: [
        ['0-15', `${young}%`],
        ['16-64', `${working}%`],
        ['65 and over', `${old}%`],
      ],
    }
    if (d >= 4) {
      const ratio = Math.round(((young + old) / working) * 100)
      return num({
        prompt: 'The table shows the age structure of a country. Work out its dependency ratio: (dependants ÷ working-age people) × 100. Give your answer to the nearest whole number.',
        figure,
        answer: ratio,
        hint: 'Dependants are those aged 0-15 and 65 and over. Add them, divide by the 16-64 group, then multiply by 100.',
        explanation: `Dependants = ${young} + ${old} = ${young + old}%. Working age = ${working}%. (${young + old} ÷ ${working}) × 100 = ${ratio}. That means about ${ratio} dependants for every 100 people of working age.`,
        errors: [{ values: [Math.round((working / (young + old)) * 100)], tag: 'ratio-upside-down', message: 'Divide the dependants by the working-age group, not the other way round.' }],
      })
    }
    return choice({
      rng,
      prompt: 'The table shows the age structure of a country. Which statement best describes it?',
      figure,
      correct: ageing ? 'It has an ageing population, typical of a higher-income country' : 'It has a youthful population, typical of a lower-income country',
      wrong: [
        { label: ageing ? 'It has a youthful population, typical of a lower-income country' : 'It has an ageing population, typical of a higher-income country', misconception: 'pyramid-reversed', feedback: `Look at the 0-15 group (${young}%) compared with the 65 and over group (${old}%).` },
        'Most of its people are over 65',
        'It has no dependent population',
      ],
      hint: 'Compare the size of the youngest and oldest groups.',
      explanation: ageing
        ? `Only ${young}% are under 16 and ${old}% are 65 or over: a low birth rate and long life expectancy, typical of an ageing, higher-income country.`
        : `${young}% are under 16 but only ${old}% are 65 or over: a high birth rate and shorter life expectancy, typical of a youthful, lower-income country.`,
    })
  }),
]

// =====================================================================================================================
// Migration
// =====================================================================================================================

const migration: Bank = {
  skill: 'population.migration',
  terms: [
    { term: 'Migration', def: 'The movement of people from one place to another to live' },
    { term: 'Emigrant', def: 'A person who leaves their country to live in another' },
    { term: 'Immigrant', def: 'A person who arrives in a country to live there' },
    { term: 'Refugee', def: 'A person forced to leave their country because of war, persecution or disaster' },
    { term: 'Economic migrant', def: 'A person who moves voluntarily to find work or better pay' },
    { term: 'Internal migration', def: 'Moving to live somewhere else within the same country' },
    { term: 'Remittances', def: 'Money sent home by migrants to their families' },
  ],
  mcqs: [
    {
      q: 'Which of these is an example of FORCED migration?',
      a: 'People fleeing their homes because of a civil war',
      wrong: [{ label: 'A nurse moving abroad for a better-paid job', misconception: 'voluntary-forced', feedback: 'That is voluntary: they chose to move for work.' }, { label: 'A family retiring to the seaside', misconception: 'voluntary-forced', feedback: 'That is a voluntary choice.' }, { label: 'A student moving to another city for university', misconception: 'voluntary-forced', feedback: 'That is voluntary.' }],
      hint: 'Forced migrants have no real choice.',
      why: 'Forced migration happens when people have to leave, because of war, persecution or natural disasters. Voluntary migration is a choice, often for work or a better life.',
      lv: [1, 3],
    },
    {
      q: 'Which is a benefit of emigration for the country people leave?',
      a: 'Remittances sent home by migrants can support families and the economy',
      wrong: [{ label: 'It gains more young workers', misconception: 'source-host', feedback: 'The country people LEAVE loses young workers. That is a benefit for the receiving country.' }, 'Its population grows faster', 'It always has fewer elderly people'],
      hint: 'What might migrants send back home?',
      why: 'Remittances can be an important source of income for families and countries. However, the source country may lose skilled young workers (a "brain drain").',
      lv: [3, 5],
    },
  ],
}

const migrationGenerators: ItemGenerator[] = classifyGenerators('population.migration', {
  id: 'push-pull',
  categories: ['Push factor', 'Pull factor'],
  items: [
    ['war or conflict at home', 'Push factor'],
    ['few jobs and low wages at home', 'Push factor'],
    ['drought and crop failure at home', 'Push factor'],
    ['persecution for a person\'s beliefs', 'Push factor'],
    ['better-paid jobs in another country', 'Pull factor'],
    ['better schools and hospitals elsewhere', 'Pull factor'],
    ['family members already living in the new country', 'Pull factor'],
    ['a safer place to live', 'Pull factor'],
  ],
  ask: (x) => `Is this a push factor or a pull factor for migration: ${x}?`,
  hint: 'Push factors make people want to leave; pull factors attract them to a new place.',
  means: {
    'Push factor': 'Something that makes people want to leave where they live.',
    'Pull factor': 'Something that attracts people to a new place.',
  },
  lv: [1, 4],
})

// =====================================================================================================================
// Settlement
// =====================================================================================================================

const settlement: Bank = {
  skill: 'urban.settlement',
  terms: [
    { term: 'Site', def: 'The actual land that a settlement is built on' },
    { term: 'Situation', def: 'Where a settlement is in relation to the area around it, such as rivers, roads and other towns' },
    { term: 'Function', def: 'The main purpose of a settlement or what it does, such as a port or market town' },
    { term: 'Settlement hierarchy', def: 'Arranging settlements in order of size and the number of services they provide' },
    { term: 'Conurbation', def: 'A large urban area formed when several towns and cities grow and merge together' },
  ],
  orders: [
    {
      prompt: 'Put these settlements in order of size, smallest first (the settlement hierarchy).',
      steps: ['Isolated dwelling', 'Hamlet', 'Village', 'Town', 'City', 'Conurbation'],
      direction: ['smallest', 'largest'],
      hint: 'A hamlet is just a few houses, smaller than a village.',
      why: 'Isolated dwelling, hamlet, village, town, city, conurbation. Larger settlements have more services, but there are fewer of them.',
      lv: [2, 4],
    },
  ],
  links: [
    {
      prompt: 'Match each site factor to why early settlers chose it.',
      pairs: [
        ['Wet point site', 'Close to a reliable water supply, such as a spring'],
        ['Dry point site', 'Raised ground above a floodplain, safe from flooding'],
        ['Defensive site', 'A hilltop or river bend that was easy to defend'],
        ['Bridging point', 'Where a river was shallow or narrow enough to cross'],
        ['Route centre', 'Where several valleys or roads meet'],
      ],
      hint: '"Wet" and "dry" refer to water supply and flooding.',
      ask: (l) => `What is a ${l.toLowerCase()}?`,
      lv: [1, 4],
    },
    {
      prompt: 'Match each English place-name ending to what it usually tells you about the settlement\'s origins.',
      pairs: [
        ['-ford (e.g. Oxford)', 'A place where a river could be crossed'],
        ['-chester or -caster (e.g. Lancaster)', 'The site of a Roman fort'],
        ['-by (e.g. Grimsby)', 'A Viking farm or village'],
        ['-ham (e.g. Birmingham)', 'An Anglo-Saxon homestead or village'],
      ],
      hint: 'Oxford was where oxen crossed the river.',
      lv: [4, 5],
    },
  ],
  mcqs: [
    {
      q: 'As you go up the settlement hierarchy, what usually happens?',
      a: 'Settlements get larger, there are fewer of them, and they have more services',
      wrong: [{ label: 'Settlements get larger and there are more of them', misconception: 'more-large', feedback: 'There are many small villages but only a few large cities.' }, 'Settlements get smaller and have more services', 'Every settlement has the same services'],
      hint: 'How many cities are there compared with villages?',
      why: 'Larger settlements are rarer but offer more, and more specialised, services (such as hospitals and universities), so people travel further to use them.',
      lv: [2, 4],
    },
  ],
}

// =====================================================================================================================
// Urbanisation
// =====================================================================================================================

const urbanisation: Bank = {
  skill: 'urban.urbanisation',
  terms: [
    { term: 'Urbanisation', def: 'An increase in the proportion of people living in towns and cities' },
    { term: 'Megacity', def: 'A city with a population of more than 10 million people' },
    { term: 'Rural-urban migration', def: 'The movement of people from the countryside to towns and cities' },
    { term: 'Counter-urbanisation', def: 'The movement of people out of large cities to smaller towns and villages' },
    { term: 'Suburbanisation', def: 'The growth of housing areas on the outskirts of a city' },
    { term: 'Urban sprawl', def: 'The uncontrolled spread of a city into the surrounding countryside' },
  ],
  links: [
    {
      prompt: 'Match each zone of a typical UK city (the Burgess model) to its description.',
      pairs: [
        ['Central business district (CBD)', 'The centre: shops, offices and banks, with high land values'],
        ['Inner city', 'Older terraced housing and former factories, often being redeveloped'],
        ['Suburbs', 'Semi-detached and detached houses with gardens'],
        ['Rural-urban fringe', 'The edge of the city, where it meets the countryside: business parks, golf courses and farmland'],
      ],
      hint: 'Land is most expensive in the centre and cheaper further out.',
      ask: (l) => `Which description matches this zone of a city: ${l}?`,
      lv: [2, 4],
    },
  ],
  orders: [
    {
      prompt: 'Put the zones of a typical UK city in order, from the centre outwards.',
      steps: ['Central business district (CBD)', 'Inner city', 'Inner suburbs', 'Outer suburbs', 'Rural-urban fringe'],
      direction: ['centre', 'edge'],
      hint: 'The oldest housing is close to the centre; the newest is near the edge.',
      why: 'Cities grew outwards over time: the CBD at the centre, then the inner city (19th-century housing and industry), then suburbs, and finally the rural-urban fringe.',
      lv: [3, 5],
    },
  ],
  mcqs: [
    {
      q: 'Why is urbanisation happening fastest today in lower-income and newly emerging countries?',
      a: 'Rural-urban migration and high natural increase in the cities',
      wrong: [{ label: 'People are leaving cities for the countryside', misconception: 'counter-urbanisation', feedback: 'That is counter-urbanisation, which is more common in some higher-income countries.' }, 'Their cities have fewer jobs than the countryside', 'Their governments ban living in rural areas'],
      hint: 'Two things make cities grow: people moving in, and births.',
      why: 'People move to cities hoping for jobs, schools and health care (pull factors) and to escape rural poverty (push factors). Many migrants are young, so birth rates in cities are also high.',
      lv: [2, 4],
    },
    {
      q: 'Roughly what share of the world\'s people live in urban areas today?',
      a: 'More than half',
      wrong: ['About a tenth', 'About a quarter', 'Almost all (over 95%)'],
      hint: 'The world became majority-urban in the early 2000s.',
      why: 'Since around 2007, more than half of the world\'s population has lived in towns and cities, and the share is still rising.',
      lv: [3, 5],
    },
  ],
}

// =====================================================================================================================
// Sustainable cities
// =====================================================================================================================

const sustainableCities: Bank = {
  skill: 'urban.sustainable-cities',
  terms: [
    { term: 'Informal settlement', def: 'An area of housing built by people on land they do not own, often without services such as clean water' },
    { term: 'Sustainable city', def: 'A city that meets the needs of people today without harming the environment for future generations' },
    { term: 'Brownfield site', def: 'Land that has been built on before and can be cleared and reused' },
    { term: 'Greenfield site', def: 'Land that has never been built on, often farmland on the edge of a city' },
    { term: 'Regeneration', def: 'Improving a run-down area, for example with new housing, jobs and services' },
    { term: 'Self-help scheme', def: 'A project where residents are given materials and support to improve their own homes' },
  ],
  mcqs: [
    {
      q: 'Which of these would make a city more sustainable?',
      a: 'An efficient public transport system and safe cycle lanes',
      wrong: [{ label: 'Building new motorways into the city centre', misconception: 'more-roads', feedback: 'More roads usually mean more cars, congestion and pollution.' }, 'Building houses on greenfield sites far from jobs', 'Sending all waste to landfill'],
      hint: 'Which option reduces pollution and car use?',
      why: 'Sustainable cities reduce car use, pollution and waste: good public transport, cycling, recycling, green spaces and energy-efficient buildings.',
      lv: [1, 3],
    },
    {
      q: 'Why might a council prefer building on a brownfield site rather than a greenfield site?',
      a: 'It reuses land and protects the countryside from urban sprawl',
      wrong: [{ label: 'Brownfield sites are always cheaper to build on', misconception: 'brownfield-cheap', feedback: 'They can be more expensive, because old buildings must be cleared and the ground may be polluted.' }, 'Greenfield sites have no space', 'Brownfield sites have no people nearby'],
      hint: 'What would be lost by building on a greenfield site?',
      why: 'Building on brownfield land regenerates run-down areas and saves countryside, although it can cost more to clear and clean up the site.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Describe the challenges faced by people living in informal settlements in a rapidly growing city, such as the favelas of Rio de Janeiro.',
      model: 'Many homes in informal settlements are built from scrap materials on steep hillsides or land that floods, so they can be dangerous in heavy rain. There is often no reliable clean water supply or proper sewage system, so diseases can spread. Many people work in the informal economy, with low pay and no job security. Crime can be a problem, and services such as schools and health centres may be overcrowded or far away.',
      checklist: ['Describes poor-quality housing or a dangerous site', 'Mentions lack of clean water or sanitation and its effect on health', 'Mentions jobs, income or the informal economy', 'Mentions another challenge, such as crime, services or overcrowding'],
      hint: 'Think about homes, water, health, jobs and safety.',
    },
    {
      prompt: 'Describe three features of a sustainable city and explain how each one helps.',
      model: 'A sustainable city has good public transport, such as trams and buses, which reduces car use, congestion and air pollution. It recycles and reuses waste, so less goes to landfill and fewer resources are used. It also has green spaces such as parks, which give wildlife a habitat, help absorb rainwater to reduce flooding, and improve people\'s wellbeing.',
      checklist: ['Describes a transport feature and how it helps', 'Describes a waste, energy or water feature and how it helps', 'Describes a third feature, such as green space or housing, and how it helps', 'Links the features to the environment or future generations'],
      hint: 'Think about transport, waste, energy, water and green space.',
    },
  ],
}

// =====================================================================================================================
// Development
// =====================================================================================================================

const measures: Bank = {
  skill: 'development.measures',
  terms: [
    { term: 'Development', def: 'Improving people\'s standard of living and quality of life' },
    { term: 'GDP per capita', def: 'The total value of goods and services produced by a country in a year, divided by its population' },
    { term: 'Human Development Index (HDI)', def: 'A score from 0 to 1 that combines life expectancy, education and income' },
    { term: 'Life expectancy', def: 'The average number of years a person can expect to live' },
    { term: 'Literacy rate', def: 'The percentage of adults who can read and write' },
    { term: 'Infant mortality rate', def: 'The number of babies who die before their first birthday per 1,000 live births' },
  ],
  mcqs: [
    {
      q: 'Why is the HDI often thought to be a better measure of development than GDP per capita alone?',
      a: 'It combines economic and social measures: income, health and education',
      wrong: [{ label: 'It only measures how rich a country is', misconception: 'hdi-money', feedback: 'GDP per capita only measures wealth. HDI adds health and education.' }, 'It is easier to calculate', 'It never changes over time'],
      hint: 'How many different things does HDI include?',
      why: 'GDP per capita is an average of wealth, which can hide big inequalities and says nothing about health or education. HDI combines life expectancy, education and income.',
      lv: [3, 5],
    },
    {
      q: 'Why can GDP per capita give a misleading picture of how well-off people are?',
      a: 'It is an average, so it hides big differences between rich and poor people',
      wrong: [{ label: 'It does not use money', misconception: 'gdp-money', feedback: 'GDP is measured in money. The problem is that it is an average.' }, 'It only counts children', 'It measures the size of the country'],
      hint: 'What does "per capita" (per person) assume?',
      why: 'GDP per capita divides national wealth equally among everyone, but in reality wealth may be concentrated among a few people.',
      lv: [3, 5],
    },
  ],
}

const measureGenerators: ItemGenerator[] = [
  ...classifyGenerators('development.measures', {
    id: 'direction',
    categories: ['Usually rises', 'Usually falls'],
    items: [
      ['life expectancy', 'Usually rises'],
      ['GDP per capita', 'Usually rises'],
      ['literacy rate', 'Usually rises'],
      ['HDI score', 'Usually rises'],
      ['number of doctors per 1,000 people', 'Usually rises'],
      ['infant mortality rate', 'Usually falls'],
      ['birth rate', 'Usually falls'],
      ['percentage of people working in farming', 'Usually falls'],
    ],
    ask: (x) => `As a country becomes more developed, what usually happens to its ${x}?`,
    hint: 'Development means people are healthier, better educated and better off.',
    means: {
      'Usually rises': 'This goes up as health, wealth and education improve.',
      'Usually falls': 'This goes down as health care, education and job opportunities improve.',
    },
    lv: [1, 4],
  }),
  G('development.measures.gdp', 'development.measures', [3, 5], (rng) => {
    const pop = rng.int(2, 60)
    const per = rng.int(1, 60) * 1000
    const gdpBn = (pop * per) / 1000
    return num({
      prompt: `A country produces goods and services worth $${fmt(gdpBn)} billion a year and has a population of ${pop} million. What is its GDP per capita, in dollars?`,
      answer: per,
      prefix: '$',
      hint: 'GDP per capita = GDP ÷ population. Write both as full numbers, or notice that billion ÷ million = thousand.',
      explanation: `$${fmt(gdpBn)} billion ÷ ${pop} million = $${fmt(gdpBn / pop)} thousand = $${fmt(per)} per person.`,
      errors: [{ values: [per / 1000], tag: 'units-billion-million', message: `That is in thousands of dollars. A billion divided by a million is a thousand, so multiply by 1,000.` }],
    })
  }),
]

const gap: Bank = {
  skill: 'development.gap',
  terms: [
    { term: 'High-income country (HIC)', def: 'A wealthy country with a high standard of living, such as the UK' },
    { term: 'Low-income country (LIC)', def: 'A country where most people have low incomes and limited access to services' },
    { term: 'Newly emerging economy (NEE)', def: 'A country whose economy is growing rapidly as it industrialises, such as India or Brazil' },
    { term: 'Development gap', def: 'The difference in standard of living between the world\'s richest and poorest countries' },
    { term: 'Brandt line', def: 'A line drawn in 1980 dividing the richer "North" from the poorer "South" of the world' },
  ],
  links: [
    {
      prompt: 'Match each cause of uneven development to its type.',
      pairs: [
        ['A landlocked country with no coastline for trade', 'Physical'],
        ['Relying on exporting raw materials with low, changing prices', 'Economic'],
        ['A history of colonial rule that took resources away', 'Historical'],
      ],
      hint: 'Physical causes come from the natural environment.',
      lv: [3, 5],
    },
  ],
  mcqs: [
    {
      q: 'Why does relying on exporting primary products (such as cocoa beans) often keep a country poor?',
      a: 'Raw materials earn low and unreliable prices; most of the profit is made by whoever processes them',
      wrong: [{ label: 'Primary products cannot be sold abroad', misconception: 'no-export', feedback: 'They are sold abroad, but for low prices.' }, 'Primary products are always expensive', 'Farming needs no workers'],
      hint: 'Compare the price of cocoa beans with the price of a chocolate bar.',
      why: 'Prices of raw materials are low and go up and down. Processing them into manufactured goods (like chocolate) adds much more value, often in other countries.',
      lv: [3, 5],
    },
    {
      q: 'Which of these is usually classified as a newly emerging economy (NEE)?',
      a: 'India',
      wrong: [{ label: 'The UK', misconception: 'hic-nee', feedback: 'The UK is a high-income country (HIC).' }, { label: 'Japan', misconception: 'hic-nee', feedback: 'Japan is a high-income country (HIC).' }, { label: 'Germany', misconception: 'hic-nee', feedback: 'Germany is a high-income country (HIC).' }],
      hint: 'NEEs are growing fast as they industrialise.',
      why: 'NEEs such as India, Brazil and China have rapidly growing economies and industries, but still have large differences in wealth.',
      lv: [2, 4],
    },
  ],
  written: [
    {
      prompt: 'Explain how physical factors can make it harder for a country to develop.',
      model: 'If a country is landlocked, it has no ports, so trading goods is slower and more expensive. A hot, dry climate can cause droughts, so crops fail and people may go hungry, which makes it hard to earn money. Frequent natural hazards such as floods or earthquakes can destroy homes, roads and businesses, so money has to be spent rebuilding instead of on schools and hospitals. Diseases such as malaria, common in hot, wet climates, mean people are too ill to work or go to school.',
      checklist: ['Names a physical factor (e.g. landlocked, climate, hazards, disease)', 'Explains how it affects money, trade or farming', 'Names and explains a second physical factor', 'Links the factor back to slower development'],
      hint: 'Think about location, climate, hazards and disease, and use "so" or "which means" to explain.',
    },
  ],
}

const aidTrade: Bank = {
  skill: 'development.aid-trade',
  terms: [
    { term: 'Short-term (emergency) aid', def: 'Help given straight after a disaster, such as food, water, tents and medicine' },
    { term: 'Long-term (development) aid', def: 'Help over many years to improve standards of living, such as building schools or wells' },
    { term: 'Bilateral aid', def: 'Aid given directly from one government to another' },
    { term: 'Multilateral aid', def: 'Aid given by rich countries through international organisations such as the World Bank' },
    { term: 'Tied aid', def: 'Aid given on the condition that the receiving country spends it on goods from the donor' },
    { term: 'NGO', def: 'A non-governmental organisation, such as a charity, that works to help people' },
    { term: 'Fair trade', def: 'A system that guarantees producers in poorer countries a fair, minimum price for their goods' },
  ],
  mcqs: [
    {
      q: 'How does Fairtrade help farmers in poorer countries?',
      a: 'They are guaranteed a minimum price, plus an extra premium to spend on community projects',
      wrong: [{ label: 'They are given their crops for free', misconception: 'fairtrade-free', feedback: 'Farmers grow the crops; Fairtrade guarantees they are paid fairly for them.' }, 'Their goods are always sold at the lowest possible price', 'They no longer need to sell anything'],
      hint: 'The word "fair" is about the price.',
      why: 'Fairtrade sets a minimum price that covers the cost of production, and pays a premium that communities use for schools, clinics or better farming.',
      lv: [2, 4],
    },
    {
      q: 'What is a disadvantage of tied aid for the receiving country?',
      a: 'It must buy goods from the donor, which may cost more or not be what it needs most',
      wrong: [{ label: 'It never has to be spent', misconception: 'tied-unused', feedback: 'Tied aid must be spent, on the donor\'s terms.' }, 'It is always given as cash with no conditions', 'It can only be used for emergencies'],
      hint: '"Tied" means it comes with strings attached.',
      why: 'Tied aid benefits the donor\'s businesses as well as the receiver. The receiving country may pay more than it would elsewhere or get things it does not need most.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Evaluate whether aid is a good way to reduce the development gap.',
      model: 'Aid can save lives after disasters, and long-term aid such as building wells and schools can improve health and education, helping people to earn more in the future. Small, bottom-up projects run by NGOs often help the poorest people directly. However, aid can create dependency if a country relies on it, some may be lost to corruption, and tied aid benefits the donor. Overall, aid helps most when it is long-term, run with local communities and combined with fairer trade, which lets countries earn their own income.',
      checklist: ['Gives a benefit of aid with an explanation', 'Gives a problem with aid (e.g. dependency, corruption, tied aid)', 'Mentions a type of aid or an example', 'Reaches a judgement, perhaps comparing with trade'],
      hint: 'Weigh up benefits and problems, then decide what kind of aid works best.',
    },
  ],
}

// =====================================================================================================================
// Economic sectors
// =====================================================================================================================

const SECTOR_MEANS: Record<string, string> = {
  Primary: 'Taking raw materials from the land or sea.',
  Secondary: 'Making or manufacturing products, including building.',
  Tertiary: 'Providing a service to people or businesses.',
  Quaternary: 'Research, development and information technology.',
}

const sectors: Bank = {
  skill: 'economy.sectors',
  mcqs: [
    {
      q: 'In which sector do most people in the UK work today?',
      a: 'Tertiary (services)',
      wrong: [{ label: 'Secondary (manufacturing)', misconception: 'uk-manufacturing', feedback: 'Manufacturing employed many more people in the past, but most UK jobs are now in services.' }, 'Primary (farming, fishing, mining)', 'Quaternary (research)'],
      hint: 'Think about the jobs in shops, schools, hospitals and offices.',
      why: 'Around four in five UK workers are in the tertiary sector, such as retail, health, education and finance.',
      lv: [1, 3],
    },
    {
      q: 'As a country develops, how does its employment structure usually change?',
      a: 'The share of primary jobs falls, while tertiary jobs grow',
      wrong: [{ label: 'The share of primary jobs grows', misconception: 'primary-grows', feedback: 'Farming becomes mechanised, so fewer people work in it as a country develops.' }, 'It stays exactly the same', 'Everyone moves into the secondary sector for ever'],
      hint: 'Compare a lower-income country, where many people farm, with the UK.',
      why: 'In LICs most people work in farming. As countries industrialise, secondary jobs grow; later, services (tertiary) and research (quaternary) take over.',
      lv: [3, 5],
    },
    {
      q: 'What is deindustrialisation?',
      a: 'The decline of manufacturing industry in a country or region',
      wrong: [{ label: 'The growth of new factories', misconception: 'industrialisation', feedback: 'That is industrialisation.' }, 'Moving from the city to the countryside', 'Replacing services with farming'],
      hint: '"De-" means undoing.',
      why: 'Deindustrialisation is the decline of manufacturing, as happened in many UK industrial areas from the 1970s, when factories closed or moved abroad.',
      lv: [3, 5],
    },
  ],
}

const sectorGenerators: ItemGenerator[] = classifyGenerators('economy.sectors', {
  id: 'classify',
  categories: ['Primary', 'Secondary', 'Tertiary', 'Quaternary'],
  items: [
    ['a farmer', 'Primary'],
    ['a fisher', 'Primary'],
    ['a coal miner', 'Primary'],
    ['a forester cutting down trees', 'Primary'],
    ['a worker in a car factory', 'Secondary'],
    ['a builder', 'Secondary'],
    ['a steelworker', 'Secondary'],
    ['a baker in a bread factory', 'Secondary'],
    ['a teacher', 'Tertiary'],
    ['a nurse', 'Tertiary'],
    ['a shop assistant', 'Tertiary'],
    ['a bus driver', 'Tertiary'],
    ['a scientist researching new medicines', 'Quaternary'],
    ['a researcher developing new computer technology', 'Quaternary'],
  ],
  ask: (x) => `Which sector of the economy does ${x} work in?`,
  hint: 'Primary: raw materials. Secondary: making things. Tertiary: services. Quaternary: research and IT.',
  means: SECTOR_MEANS,
  lv: [1, 4],
})

// =====================================================================================================================
// Tourism
// =====================================================================================================================

const tourism: Bank = {
  skill: 'economy.tourism',
  terms: [
    { term: 'Mass tourism', def: 'Large numbers of people visiting the same popular destinations, often on package holidays' },
    { term: 'Ecotourism', def: 'Tourism that protects the environment and benefits local people' },
    { term: 'Honeypot site', def: 'A popular place that attracts large numbers of visitors' },
    { term: 'Leakage', def: 'Money from tourism that leaves the country, for example to foreign-owned hotels' },
    { term: 'Multiplier effect', def: 'When money spent in an area creates more jobs and spending, which brings further benefits' },
  ],
  mcqs: [
    {
      q: 'Which is a reason why global tourism has grown so much since the 1960s?',
      a: 'Cheaper air travel and more paid holiday time',
      wrong: [{ label: 'There are fewer places to visit', misconception: 'fewer-places', feedback: 'There are more destinations than ever.' }, 'People have less money to spend', 'Holidays have become longer to travel to'],
      hint: 'Think about cost, time and transport.',
      why: 'Cheaper flights, higher incomes, more paid holidays and booking on the internet have all made travel easier and more affordable.',
      lv: [1, 3],
    },
    {
      q: 'Why are many tourism jobs described as "seasonal"?',
      a: 'They are only available at the busiest times of year, such as the summer',
      wrong: [{ label: 'They change with the weather each day', misconception: 'daily-weather', feedback: 'Seasonal refers to times of year, not daily weather.' }, 'They are only for older people', 'They pay more in winter'],
      hint: 'What happens at a beach resort in winter?',
      why: 'Many resorts are busy only in certain seasons, so jobs are temporary and workers may be unemployed for part of the year.',
      lv: [2, 4],
    },
  ],
  written: [
    {
      prompt: 'Evaluate the impacts of tourism on a popular National Park, such as the Lake District.',
      model: 'Tourism brings money to the area and creates jobs in hotels, cafés and outdoor activity centres, which helps the local economy through the multiplier effect. However, honeypot sites become very crowded, traffic causes congestion and pollution, and footpaths are eroded by walkers. Many houses are bought as holiday homes, so prices rise and local young people cannot afford to live there. Overall, tourism is essential to the economy, but it needs to be managed, for example with park-and-ride schemes and path repairs.',
      checklist: ['Gives a positive economic impact', 'Gives a negative environmental impact', 'Gives a negative social impact (e.g. house prices, congestion)', 'Reaches a judgement or suggests management'],
      hint: 'Consider the economy, the environment and local people.',
    },
  ],
}

const tourismGenerators: ItemGenerator[] = classifyGenerators('economy.tourism', {
  id: 'impact',
  categories: ['Positive impact', 'Negative impact'],
  items: [
    ['new jobs in hotels and restaurants', 'Positive impact'],
    ['money to improve roads and airports', 'Positive impact'],
    ['money to protect wildlife through park entry fees', 'Positive impact'],
    ['footpath erosion from large numbers of walkers', 'Negative impact'],
    ['traffic congestion in small towns', 'Negative impact'],
    ['jobs that disappear out of season', 'Negative impact'],
    ['profits leaking abroad to foreign-owned hotels', 'Negative impact'],
  ],
  ask: (x) => `Is this a positive or a negative impact of tourism: ${x}?`,
  hint: 'Does it help or harm local people and the environment?',
  means: {
    'Positive impact': 'It benefits local people, the economy or the environment.',
    'Negative impact': 'It harms local people, the economy or the environment.',
  },
  lv: [1, 4],
})

// =====================================================================================================================
// Globalisation
// =====================================================================================================================

const globalisation: Bank = {
  skill: 'economy.globalisation',
  terms: [
    { term: 'Globalisation', def: 'The process by which the world is becoming more connected through trade, communication and culture' },
    { term: 'Transnational corporation (TNC)', def: 'A company that operates in more than one country' },
    { term: 'Interdependence', def: 'When countries rely on each other for goods, services and investment' },
    { term: 'Containerisation', def: 'Carrying goods in standard-sized metal boxes that are easy to move between ships, trains and lorries' },
    { term: 'Outsourcing', def: 'Paying another company, often abroad, to do work that used to be done in-house' },
    { term: 'Supply chain', def: 'The series of steps and places involved in making and delivering a product' },
  ],
  mcqs: [
    {
      q: 'Why do many TNCs build factories in newly emerging economies?',
      a: 'Wages and costs are lower, and there are growing markets to sell to',
      wrong: [{ label: 'Workers there are paid more', misconception: 'higher-wages', feedback: 'Wages are usually lower, which is one reason TNCs move there.' }, 'There are no laws at all', 'They cannot sell their products anywhere else'],
      hint: 'Companies want to keep costs down and sell more.',
      why: 'Lower labour and land costs, sometimes fewer regulations, and fast-growing populations of new customers all attract TNCs.',
      lv: [2, 4],
    },
    {
      q: 'Which development has done most to speed up globalisation since the 1990s?',
      a: 'The internet and fast global communications',
      wrong: ['The invention of the steam engine', 'Horse-drawn transport', 'Fewer international flights'],
      hint: 'Think about how quickly a business can contact a factory on the other side of the world.',
      why: 'The internet lets companies, workers and customers communicate instantly worldwide. Container ships and cheaper flights have also helped.',
      lv: [2, 4],
    },
  ],
  written: [
    {
      prompt: 'A TNC opens a large factory in a newly emerging economy. Explain one advantage and one disadvantage for the host country.',
      model: 'One advantage is that the factory creates thousands of jobs, giving people a regular income, and the company pays taxes that the government can spend on schools and roads. Local suppliers may also get more business through the multiplier effect. One disadvantage is that wages may be low and working hours long, and much of the profit goes back to the TNC\'s home country. If costs rise, the TNC might move the factory elsewhere, leaving people unemployed.',
      checklist: ['Gives a clear advantage (e.g. jobs, taxes, skills)', 'Explains how the advantage helps the country', 'Gives a clear disadvantage (e.g. low wages, profits leave, pollution)', 'Explains why the disadvantage matters'],
      hint: 'Use "this means that..." to develop each point.',
    },
  ],
}

// =====================================================================================================================
// Energy
// =====================================================================================================================

const energy: Bank = {
  skill: 'resources.energy',
  links: [
    {
      prompt: 'Match each energy source to how it produces electricity.',
      pairs: [
        ['Hydroelectric power', 'Water stored behind a dam flows through turbines'],
        ['Geothermal energy', 'Heat from hot rocks underground is used to make steam'],
        ['Tidal power', 'The rise and fall of the sea turns turbines'],
        ['Solar power', 'Panels turn sunlight into electricity'],
        ['Wind power', 'Moving air turns the blades of turbines'],
        ['Nuclear power', 'Splitting uranium atoms releases heat to make steam'],
        ['Biomass', 'Burning plant material or waste releases heat'],
      ],
      hint: 'The name usually tells you the source of the energy.',
      ask: (l) => `How does ${l.charAt(0).toLowerCase() + l.slice(1)} produce electricity?`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'How were fossil fuels such as coal formed?',
      a: 'From the remains of plants and animals buried and squashed over millions of years',
      wrong: [{ label: 'From volcanic lava cooling', misconception: 'fossil-igneous', feedback: 'Cooled lava forms igneous rock, not fuel.' }, 'From dinosaur bones only', 'From sea water evaporating'],
      hint: 'The word "fossil" is a clue.',
      why: 'Coal formed from ancient swamp forests, and oil and gas from tiny sea creatures, buried and compressed over millions of years. They cannot be replaced in a human lifetime.',
      lv: [1, 3],
    },
    {
      q: 'What is a main disadvantage of wind and solar power?',
      a: 'They do not produce electricity all the time, because the wind and sunshine vary',
      wrong: [{ label: 'They release lots of carbon dioxide while working', misconception: 'renewable-co2', feedback: 'They produce no carbon dioxide while generating electricity.' }, 'They will run out in 50 years', 'They are only possible in the Arctic'],
      hint: 'What happens on a calm night?',
      why: 'Wind and solar are renewable and clean, but their output varies, so they need back-up or energy storage.',
      lv: [2, 4],
    },
    {
      q: 'Why is nuclear power classed as non-renewable even though it produces very little carbon dioxide?',
      a: 'It uses uranium, which is mined and will eventually run out',
      wrong: [{ label: 'Because it produces lots of greenhouse gases', misconception: 'nuclear-co2', feedback: 'Nuclear power produces very little carbon dioxide; the issue is its fuel.' }, 'Because it uses the wind', 'Because power stations cannot be rebuilt'],
      hint: 'Where does its fuel come from?',
      why: 'Uranium is a finite resource dug from the ground. Nuclear power is low-carbon but non-renewable, and produces radioactive waste.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'A company wants to build a wind farm on hills near a village. Evaluate whether it should go ahead.',
      model: 'A wind farm would produce renewable electricity without releasing carbon dioxide, which helps reduce climate change and makes the country less dependent on imported fossil fuels. It could also bring some jobs and payments to the community. However, some residents may think the turbines spoil the view and are noisy, and they can harm birds. The wind does not blow all the time, so back-up power is still needed. On balance, I think it should go ahead if it is carefully sited away from homes and bird migration routes, because the benefits for the climate are large.',
      checklist: ['Gives an environmental advantage', 'Gives a disadvantage for local people or wildlife', 'Mentions that wind power is intermittent or needs back-up', 'Reaches a clear judgement with a reason'],
      hint: 'Think about the climate, local people, wildlife and reliability.',
    },
  ],
}

const energyGenerators: ItemGenerator[] = classifyGenerators('resources.energy', {
  id: 'renewable',
  categories: ['Renewable', 'Non-renewable'],
  items: [
    ['coal', 'Non-renewable'],
    ['oil', 'Non-renewable'],
    ['natural gas', 'Non-renewable'],
    ['nuclear power (uranium)', 'Non-renewable'],
    ['wind power', 'Renewable'],
    ['solar power', 'Renewable'],
    ['hydroelectric power', 'Renewable'],
    ['tidal power', 'Renewable'],
    ['geothermal energy', 'Renewable'],
  ],
  ask: (x) => `Is this energy source renewable or non-renewable: ${x}?`,
  hint: 'Renewable sources will not run out; non-renewable sources are finite.',
  means: {
    Renewable: 'It will not run out, because it is naturally replaced.',
    'Non-renewable': 'It is finite: once used, it cannot be replaced in a human lifetime.',
  },
  lv: [1, 4],
})

// =====================================================================================================================
// Food and water
// =====================================================================================================================

const foodWater: Bank = {
  skill: 'resources.food-water',
  terms: [
    { term: 'Food security', def: 'When everyone has reliable access to enough safe, nutritious food' },
    { term: 'Water security', def: 'When there is a reliable supply of enough clean water for people\'s needs' },
    { term: 'Water stress', def: 'When the demand for water is greater than the supply available, or poor quality limits its use' },
    { term: 'Irrigation', def: 'Artificially watering crops' },
    { term: 'Desalination', def: 'Removing salt from sea water so it can be used' },
    { term: 'Water transfer', def: 'Moving water through pipes or canals from an area with a surplus to an area with a shortage' },
    { term: 'Food miles', def: 'The distance food travels from where it is produced to where it is eaten' },
  ],
  mcqs: [
    {
      q: 'Why does south-east England often have water stress even though the UK is a wet country?',
      a: 'It has a high population and demand, but less rainfall than the north and west',
      wrong: [{ label: 'It is the wettest part of the UK', misconception: 'se-wettest', feedback: 'The south-east is one of the driest parts of the UK. The wettest areas are in the north and west.' }, 'It has no rivers', 'Water cannot be stored there'],
      hint: 'Compare where most people live with where most rain falls.',
      why: 'Most rain falls in the north and west, but most people live in the south and east, so demand there can exceed supply.',
      lv: [3, 5],
    },
    {
      q: 'Which is a sustainable way to increase water supply in a dry area?',
      a: 'Collecting rainwater from roofs and using drip irrigation on crops',
      wrong: [{ label: 'Pumping groundwater faster than it is replaced', misconception: 'overabstraction', feedback: 'That uses up the store, so it is not sustainable.' }, 'Watering crops in the midday sun with sprinklers', 'Building more swimming pools'],
      hint: 'Sustainable means it could carry on for ever without running out or causing harm.',
      why: 'Rainwater harvesting and drip irrigation make the most of every drop. Over-pumping groundwater and wasteful sprinklers use up supplies.',
      lv: [2, 4],
    },
  ],
  written: [
    {
      prompt: 'Suggest how a country could increase its food security in a sustainable way.',
      model: 'A country could use drip irrigation, which gives water straight to plant roots and wastes much less than sprinklers. Farmers could use organic methods and crop rotation to keep the soil fertile without heavy chemical use. Reducing food waste in shops and homes would mean more of the food already grown is eaten. Growing food locally reduces food miles and dependence on imports.',
      checklist: ['Suggests a farming or water method', 'Explains why it is sustainable', 'Suggests reducing waste or another approach', 'Uses an appropriate term (e.g. irrigation, food miles)'],
      hint: 'Think about water, soil, waste and where food comes from.',
    },
  ],
}

export const humanGenerators: ItemGenerator[] = [
  ...bankGenerators(distribution),
  ...densityGenerators,
  ...bankGenerators(growth),
  ...growthGenerators,
  ...bankGenerators(dtm),
  ...bankGenerators(structure),
  ...structureGenerators,
  ...bankGenerators(migration),
  ...migrationGenerators,
  ...bankGenerators(settlement),
  ...bankGenerators(urbanisation),
  ...bankGenerators(sustainableCities),
  ...bankGenerators(measures),
  ...measureGenerators,
  ...bankGenerators(gap),
  ...bankGenerators(aidTrade),
  ...bankGenerators(sectors),
  ...sectorGenerators,
  ...bankGenerators(tourism),
  ...tourismGenerators,
  ...bankGenerators(globalisation),
  ...bankGenerators(energy),
  ...energyGenerators,
  ...bankGenerators(foodWater),
]
