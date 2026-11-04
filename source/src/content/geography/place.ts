import type { ItemGenerator } from '@/engine/registry'
import { choice, matchItem, orderItem, textItem } from '../kit'
import { bankGenerators, G, num, type Bank } from './factory'

// =====================================================================================================================
// Continents and oceans
// =====================================================================================================================

const CONTINENTS = ['Africa', 'Antarctica', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'] as const
type Continent = (typeof CONTINENTS)[number]

/** Countries that lie wholly (or very clearly) in one continent. Transcontinental countries are deliberately left out. */
const COUNTRY_CONTINENT: [string, Continent][] = [
  ['France', 'Europe'], ['Germany', 'Europe'], ['Italy', 'Europe'], ['Spain', 'Europe'], ['Poland', 'Europe'], ['Norway', 'Europe'], ['Greece', 'Europe'], ['Ireland', 'Europe'],
  ['Kenya', 'Africa'], ['Nigeria', 'Africa'], ['Ghana', 'Africa'], ['Morocco', 'Africa'], ['Ethiopia', 'Africa'], ['South Africa', 'Africa'], ['Tanzania', 'Africa'],
  ['China', 'Asia'], ['India', 'Asia'], ['Japan', 'Asia'], ['Pakistan', 'Asia'], ['Thailand', 'Asia'], ['Vietnam', 'Asia'], ['Saudi Arabia', 'Asia'], ['Bangladesh', 'Asia'],
  ['Brazil', 'South America'], ['Argentina', 'South America'], ['Peru', 'South America'], ['Chile', 'South America'], ['Colombia', 'South America'],
  ['Canada', 'North America'], ['the USA', 'North America'], ['Mexico', 'North America'],
  ['Australia', 'Oceania'], ['New Zealand', 'Oceania'], ['Fiji', 'Oceania'],
]

const continentsBank: Bank = {
  skill: 'place.continents-oceans',
  mcqs: [
    {
      q: 'Which is the largest ocean?',
      a: 'The Pacific Ocean',
      wrong: [
        { label: 'The Atlantic Ocean', misconception: 'atlantic-largest', feedback: 'The Atlantic is the second largest. The Pacific is bigger than all the land on Earth put together.' },
        'The Indian Ocean',
        { label: 'The Arctic Ocean', misconception: 'arctic-largest', feedback: 'The Arctic is the smallest of the five oceans.' },
      ],
      hint: 'It lies between Asia and Australia on one side and the Americas on the other.',
      why: 'The Pacific is the largest and deepest ocean. In order of size the oceans are Pacific, Atlantic, Indian, Southern and Arctic.',
      lv: [1, 2],
    },
    {
      q: 'How many continents are there (using the seven-continent model taught in UK schools)?',
      a: '7',
      wrong: ['5', '6', '8'],
      keepOrder: false,
      hint: 'Count them: Africa, Antarctica, Asia, Europe, North America, Oceania, South America.',
      why: 'The seven continents are Africa, Antarctica, Asia, Europe, North America, Oceania (Australia and nearby islands) and South America.',
      lv: [1, 1],
    },
    {
      q: 'Which is the largest continent by area?',
      a: 'Asia',
      wrong: [{ label: 'Africa', misconception: 'africa-largest', feedback: 'Africa is huge and is the second largest, but Asia is bigger.' }, 'North America', 'Antarctica'],
      hint: 'It contains both China and India.',
      why: 'Asia is the largest continent, covering almost a third of the Earth\'s land. Africa is second.',
      lv: [1, 2],
    },
    {
      q: 'Which continent has no permanent population, only visiting scientists?',
      a: 'Antarctica',
      wrong: ['Oceania', 'Europe', { label: 'The Arctic', misconception: 'arctic-continent', feedback: 'The Arctic is mostly frozen ocean, not a continent. The continent around the South Pole is Antarctica.' }],
      hint: 'It surrounds the South Pole.',
      why: 'Antarctica is covered by a thick ice sheet. Scientists live at research stations there for a time, but nobody lives there permanently.',
      lv: [1, 2],
    },
    {
      q: 'Which ocean lies between Africa and Australia?',
      a: 'The Indian Ocean',
      wrong: ['The Atlantic Ocean', { label: 'The Pacific Ocean', misconception: 'pacific-everywhere', feedback: 'The Pacific is east of Australia. The ocean between Africa and Australia is the Indian Ocean.' }, 'The Southern Ocean'],
      hint: 'It is named after a country on its northern shore.',
      why: 'The Indian Ocean is bordered by Africa to the west, Asia to the north and Australia to the east.',
      lv: [2, 3],
    },
    {
      q: 'Which ocean separates Europe and Africa from North and South America?',
      a: 'The Atlantic Ocean',
      wrong: [{ label: 'The Pacific Ocean', misconception: 'pacific-everywhere', feedback: 'The Pacific is on the other side of the Americas, between them and Asia.' }, 'The Indian Ocean', 'The Arctic Ocean'],
      hint: 'It is the ocean you would cross flying from London to New York.',
      why: 'The Atlantic lies between Europe and Africa to the east and the Americas to the west.',
      lv: [1, 3],
    },
    {
      q: 'Which ocean surrounds Antarctica?',
      a: 'The Southern Ocean',
      wrong: [{ label: 'The Arctic Ocean', misconception: 'arctic-antarctic', feedback: 'The Arctic Ocean is around the North Pole. Antarctica, at the South Pole, is surrounded by the Southern Ocean.' }, 'The Indian Ocean', 'The Atlantic Ocean'],
      hint: 'Antarctica is in the far south.',
      why: 'The Southern Ocean circles Antarctica. The Arctic Ocean is at the opposite end of the Earth, around the North Pole.',
      lv: [2, 3],
    },
    {
      q: 'Which continent does the Equator NOT pass through?',
      a: 'Europe',
      wrong: [
        { label: 'Africa', misconception: 'equator-africa', feedback: 'The Equator crosses Africa, through countries such as Kenya and Uganda.' },
        { label: 'South America', misconception: 'equator-sa', feedback: 'The Equator crosses northern South America, through Ecuador, Colombia and Brazil.' },
        { label: 'Asia', misconception: 'equator-asia', feedback: 'The Equator crosses the islands of Indonesia in South East Asia.' },
      ],
      hint: 'The UK is in this continent. Think about how far north it is.',
      why: 'Europe lies entirely in the northern hemisphere, well north of the Equator. The Equator crosses Africa, South America and the islands of Indonesia in Asia.',
      lv: [3, 5],
    },
    {
      q: 'Which continent has more countries than any other?',
      a: 'Africa',
      wrong: [{ label: 'Asia', misconception: 'asia-most-countries', feedback: 'Asia is the largest continent by area and population, but Africa has more separate countries (over 50).' }, 'Europe', 'South America'],
      hint: 'It has over 50 countries.',
      why: 'Africa has more than 50 countries, more than any other continent.',
      lv: [3, 5],
    },
    {
      q: 'Which two continents are almost entirely in the southern hemisphere?',
      a: 'Antarctica and Oceania',
      wrong: [
        { label: 'Africa and South America', misconception: 'equator-crossers', feedback: 'The Equator crosses both Africa and South America, so large parts of them are in the northern hemisphere.' },
        'Europe and Asia',
        'North America and Antarctica',
      ],
      hint: 'Think about which continents are wholly south of the Equator.',
      why: 'Antarctica is around the South Pole and Australia (the main part of Oceania) is wholly south of the Equator. Africa and South America are split by the Equator.',
      lv: [4, 5],
    },
  ],
  links: [
    {
      prompt: 'Match each mountain range to its continent.',
      pairs: [['The Andes', 'South America'], ['The Rocky Mountains', 'North America'], ['The Himalayas', 'Asia'], ['The Alps', 'Europe'], ['The Atlas Mountains', 'Africa'], ['The Great Dividing Range', 'Oceania']],
      hint: 'The Alps are where many people go skiing in France, Switzerland and Austria.',
      ask: (l) => `In which continent would you find ${l.charAt(0).toLowerCase() + l.slice(1)}?`,
      lv: [2, 4],
    },
    {
      prompt: 'Match each river to its continent.',
      pairs: [['The Amazon', 'South America'], ['The Nile', 'Africa'], ['The Mississippi', 'North America'], ['The Yangtze', 'Asia'], ['The Danube', 'Europe'], ['The Murray', 'Oceania']],
      hint: 'The Nile flows north through Egypt to the Mediterranean Sea.',
      ask: (l) => `Which continent does the river ${l.replace('The ', '')} flow through?`,
      lv: [3, 5],
    },
  ],
  orders: [
    {
      prompt: 'Put the oceans in order of size, largest first.',
      steps: ['Pacific', 'Atlantic', 'Indian', 'Southern', 'Arctic'],
      direction: ['largest', 'smallest'],
      hint: 'The largest is between Asia and the Americas; the smallest is around the North Pole.',
      why: 'Pacific, Atlantic, Indian, Southern, Arctic. The Pacific alone covers about a third of the Earth\'s surface.',
      lv: [2, 4],
    },
    {
      prompt: 'Put these continents in order of area, largest first.',
      steps: ['Asia', 'Africa', 'North America', 'South America', 'Europe'],
      direction: ['largest', 'smallest'],
      hint: 'Asia is the largest continent; Europe is one of the smallest.',
      why: 'Asia, Africa, North America, South America, (Antarctica), Europe, Oceania.',
      lv: [3, 5],
    },
  ],
}

const continentGenerators: ItemGenerator[] = [
  G('place.continents-oceans.country', 'place.continents-oceans', [1, 3], (rng, d) => {
    const [country, cont] = rng.pick(COUNTRY_CONTINENT)
    const wrong = rng.shuffle(CONTINENTS.filter((c) => c !== cont && c !== 'Antarctica')).slice(0, d <= 1 ? 2 : 3)
    return choice({
      rng,
      prompt: `Which continent is ${country} in?`,
      correct: cont,
      wrong,
      hint: 'Picture a world map. Is it north or south of the Equator? East or west of the UK?',
      explanation: `${country.charAt(0).toUpperCase() + country.slice(1)} is in ${cont}.`,
    })
  }),
  G('place.continents-oceans.sort', 'place.continents-oceans', [2, 4], (rng) => {
    const conts = rng.shuffle(['Europe', 'Africa', 'Asia', 'South America', 'North America', 'Oceania'] as Continent[]).slice(0, 4)
    const pairs = conts.map((c) => {
      const options = COUNTRY_CONTINENT.filter(([, k]) => k === c)
      return { left: rng.pick(options)[0].replace(/^the /, 'The '), right: c }
    })
    return matchItem({
      prompt: 'Match each country to its continent.',
      pairs,
      hint: 'Start with the country you know best, then work through the rest.',
      explanation: pairs.map((p) => `${p.left} is in ${p.right}.`).join('\n'),
    })
  }),
]

// =====================================================================================================================
// The United Kingdom
// =====================================================================================================================

/** Approximate latitudes (degrees north) used only to order cities north-south. */
const UK_CITIES: [string, number][] = [
  ['Inverness', 57.5], ['Aberdeen', 57.1], ['Edinburgh', 56.0], ['Newcastle upon Tyne', 55.0], ['Belfast', 54.6], ['Leeds', 53.8],
  ['Manchester', 53.5], ['Nottingham', 53.0], ['Birmingham', 52.5], ['Cambridge', 52.2], ['Cardiff', 51.5], ['Southampton', 50.9], ['Plymouth', 50.4],
]

const ukBank: Bank = {
  skill: 'place.uk',
  links: [
    {
      prompt: 'Match each country of the UK to its capital city.',
      pairs: [['England', 'London'], ['Scotland', 'Edinburgh'], ['Wales', 'Cardiff'], ['Northern Ireland', 'Belfast']],
      hint: 'Glasgow is Scotland\'s biggest city, but it is not the capital.',
      ask: (l) => `What is the capital city of ${l}?`,
      lv: [1, 2],
    },
    {
      prompt: 'Match each city to the river it stands on.',
      pairs: [['London', 'River Thames'], ['Newcastle upon Tyne', 'River Tyne'], ['Glasgow', 'River Clyde'], ['Liverpool', 'River Mersey'], ['Belfast', 'River Lagan'], ['Cardiff', 'River Taff'], ['Nottingham', 'River Trent'], ['Dundee', 'River Tay']],
      hint: 'Some cities give the answer away in their name.',
      ask: (l) => `Which river flows through ${l}?`,
      lv: [2, 4],
    },
    {
      prompt: 'Match each mountain to the UK country where it is the highest peak.',
      pairs: [['Ben Nevis', 'Scotland'], ['Yr Wyddfa (Snowdon)', 'Wales'], ['Scafell Pike', 'England'], ['Slieve Donard', 'Northern Ireland']],
      hint: '"Ben" is a Gaelic word for mountain, used in Scotland.',
      ask: (l) => `${l} is the highest mountain in which country of the UK?`,
      lv: [2, 4],
    },
    {
      prompt: 'Match each upland area to the UK country it is in.',
      pairs: [['The Pennines', 'England'], ['The Grampian Mountains', 'Scotland'], ['The Cambrian Mountains', 'Wales'], ['The Mourne Mountains', 'Northern Ireland']],
      hint: 'The Pennines are called "the backbone of England".',
      lv: [3, 4],
    },
    {
      prompt: 'Match each stretch of water to where it is.',
      pairs: [['Irish Sea', 'Between Great Britain and Ireland'], ['North Sea', 'Off the east coast of England and Scotland'], ['English Channel', 'Between southern England and France'], ['Atlantic Ocean', 'Off the west coast of Ireland and Scotland']],
      hint: 'The Channel Tunnel runs under one of these.',
      lv: [2, 3],
    },
  ],
  mcqs: [
    {
      q: 'What is the difference between Great Britain and the United Kingdom?',
      a: 'The UK is Great Britain (England, Scotland and Wales) plus Northern Ireland',
      wrong: [
        { label: 'They are two names for exactly the same place', misconception: 'gb-equals-uk', feedback: 'Great Britain is the island with England, Scotland and Wales. The UK also includes Northern Ireland.' },
        { label: 'Great Britain includes Northern Ireland but the UK does not', misconception: 'gb-uk-reversed', feedback: 'It is the other way round: Northern Ireland is in the UK, but it is not on the island of Great Britain.' },
        { label: 'The UK includes the Republic of Ireland', misconception: 'uk-includes-ireland', feedback: 'The Republic of Ireland is a separate, independent country.' },
      ],
      hint: 'Great Britain is the name of an island.',
      why: 'Great Britain is the largest island, containing England, Scotland and Wales. The United Kingdom of Great Britain and Northern Ireland adds Northern Ireland.',
      lv: [2, 4],
    },
    {
      q: 'What is the longest river in the UK?',
      a: 'River Severn',
      wrong: [
        { label: 'River Thames', misconception: 'thames-longest', feedback: 'The Thames is the longest river wholly in England, but the Severn is slightly longer overall.' },
        'River Trent',
        { label: 'River Tay', misconception: 'tay-uk', feedback: 'The Tay is the longest river in Scotland, but it is much shorter than the Severn.' },
      ],
      hint: 'It rises in mid-Wales and flows into the Bristol Channel.',
      why: 'The River Severn, at about 350 km, is the UK\'s longest river. It starts in the Cambrian Mountains of Wales and flows through England to the Bristol Channel.',
      lv: [2, 4],
    },
    {
      q: 'What is the highest mountain in the UK?',
      a: 'Ben Nevis',
      wrong: [
        { label: 'Yr Wyddfa (Snowdon)', misconception: 'snowdon-highest', feedback: 'Yr Wyddfa is the highest mountain in Wales, at about 1,085 m. Ben Nevis is higher.' },
        { label: 'Scafell Pike', misconception: 'scafell-highest', feedback: 'Scafell Pike is the highest in England, at about 978 m.' },
        'Slieve Donard',
      ],
      hint: 'It is in the Scottish Highlands, near Fort William.',
      why: 'Ben Nevis, in the Scottish Highlands, is about 1,345 m high, the highest point in the UK.',
      lv: [1, 2],
    },
    {
      q: 'Which lake has the largest surface area in the UK?',
      a: 'Lough Neagh',
      wrong: [
        { label: 'Loch Ness', misconception: 'loch-ness-largest', feedback: 'Loch Ness holds a huge volume of water because it is very deep, but its surface area is much smaller than Lough Neagh\'s.' },
        { label: 'Windermere', misconception: 'windermere-largest', feedback: 'Windermere is the largest natural lake in England, but it is much smaller.' },
        { label: 'Loch Lomond', misconception: 'lomond-largest', feedback: 'Loch Lomond is the largest lake in Great Britain by area, but Lough Neagh in Northern Ireland is bigger.' },
      ],
      hint: 'It is in Northern Ireland. "Lough" is the Irish spelling of "loch".',
      why: 'Lough Neagh in Northern Ireland has the largest surface area of any lake in the UK.',
      lv: [3, 5],
    },
    {
      q: 'Which UK capital city is furthest north?',
      a: 'Edinburgh',
      wrong: [{ label: 'Belfast', misconception: 'belfast-north', feedback: 'Belfast is quite far north, but Edinburgh is further north still.' }, 'Cardiff', 'London'],
      hint: 'Which country of the UK is furthest north?',
      why: 'Edinburgh, the capital of Scotland, is the most northerly of the four capitals. Cardiff and London are the furthest south.',
      lv: [2, 3],
    },
    {
      q: 'Which upland area is often called "the backbone of England"?',
      a: 'The Pennines',
      wrong: ['The Cotswolds', 'The Lake District', 'Dartmoor'],
      hint: 'It runs north to south down the middle of northern England.',
      why: 'The Pennines form a long chain of hills running down the middle of northern England, like a backbone.',
      lv: [2, 4],
    },
    {
      q: 'Which group of islands lies off the north coast of mainland Scotland?',
      a: 'The Orkney Islands',
      wrong: [
        { label: 'The Isles of Scilly', misconception: 'scilly', feedback: 'The Isles of Scilly are off the south-west tip of England, near Cornwall.' },
        { label: 'The Isle of Wight', misconception: 'wight', feedback: 'The Isle of Wight is off the south coast of England.' },
        { label: 'Anglesey', misconception: 'anglesey', feedback: 'Anglesey is off the north-west coast of Wales.' },
      ],
      hint: 'Shetland is even further north.',
      why: 'Orkney lies just off the north coast of Scotland, with Shetland further north again.',
      lv: [3, 5],
    },
    {
      q: 'Which sea would you cross on a ferry from Wales to Ireland?',
      a: 'The Irish Sea',
      wrong: ['The North Sea', 'The English Channel', 'The Mediterranean Sea'],
      hint: 'It is named after the island on the other side.',
      why: 'The Irish Sea lies between Great Britain and the island of Ireland. Ferries run from Holyhead in Wales to Dublin.',
      lv: [1, 2],
    },
  ],
}

const ukGenerators: ItemGenerator[] = [
  G('place.uk.north-south', 'place.uk', [3, 5], (rng, d) => {
    const n = d >= 5 ? 5 : 4
    // Choose cities at least ~0.4 degrees apart so the order is clear-cut.
    const chosen: [string, number][] = []
    for (const c of rng.shuffle(UK_CITIES)) {
      if (chosen.every(([, lat]) => Math.abs(lat - c[1]) >= 0.4)) chosen.push(c)
      if (chosen.length === n) break
    }
    const sorted = [...chosen].sort((a, b) => b[1] - a[1])
    return orderItem({
      rng,
      prompt: 'Put these UK cities in order from north to south.',
      correct: sorted.map(([c]) => c),
      direction: ['furthest north', 'furthest south'],
      hint: 'Scottish cities are furthest north; cities on the south coast of England are furthest south.',
      explanation: `From north to south: ${sorted.map(([c]) => c).join(', ')}.`,
    })
  }),
]

// =====================================================================================================================
// Countries and capitals (stable, uncontroversial capitals only)
// =====================================================================================================================

interface Capital {
  country: string
  capital: string
  continent: string
  /** A city often wrongly given as the capital, with why. */
  trap?: [string, string]
  /** Other spellings accepted when typed. */
  alt?: string[]
}

const CAPITALS: Capital[] = [
  { country: 'France', capital: 'Paris', continent: 'Europe', trap: ['Marseille', 'Marseille is a large port in the south, but the capital is Paris.'] },
  { country: 'Germany', capital: 'Berlin', continent: 'Europe', trap: ['Munich', 'Munich is a big city in the south of Germany, but the capital is Berlin.'] },
  { country: 'Spain', capital: 'Madrid', continent: 'Europe', trap: ['Barcelona', 'Barcelona is a famous city on the coast, but the capital is Madrid, in the centre of Spain.'] },
  { country: 'Italy', capital: 'Rome', continent: 'Europe', trap: ['Milan', 'Milan is an important business city in the north, but the capital is Rome.'] },
  { country: 'Portugal', capital: 'Lisbon', continent: 'Europe', trap: ['Porto', 'Porto is Portugal\'s second city, in the north. The capital is Lisbon.'] },
  { country: 'Ireland', capital: 'Dublin', continent: 'Europe', trap: ['Belfast', 'Belfast is the capital of Northern Ireland, which is part of the UK.'] },
  { country: 'Poland', capital: 'Warsaw', continent: 'Europe', trap: ['Krakow', 'Krakow is a historic city in the south, but the capital is Warsaw.'], alt: ['Warszawa'] },
  { country: 'Norway', capital: 'Oslo', continent: 'Europe' },
  { country: 'Sweden', capital: 'Stockholm', continent: 'Europe' },
  { country: 'Denmark', capital: 'Copenhagen', continent: 'Europe' },
  { country: 'Greece', capital: 'Athens', continent: 'Europe' },
  { country: 'Austria', capital: 'Vienna', continent: 'Europe' },
  { country: 'Belgium', capital: 'Brussels', continent: 'Europe' },
  { country: 'Switzerland', capital: 'Bern', continent: 'Europe', trap: ['Zurich', 'Zurich is Switzerland\'s largest city, but the capital (the federal city) is Bern.'], alt: ['Berne'] },
  { country: 'Kenya', capital: 'Nairobi', continent: 'Africa', trap: ['Mombasa', 'Mombasa is Kenya\'s main port on the coast, but the capital is Nairobi.'] },
  { country: 'Nigeria', capital: 'Abuja', continent: 'Africa', trap: ['Lagos', 'Lagos was the capital until 1991, when the government moved to Abuja.'] },
  { country: 'Ghana', capital: 'Accra', continent: 'Africa' },
  { country: 'Morocco', capital: 'Rabat', continent: 'Africa', trap: ['Casablanca', 'Casablanca is Morocco\'s largest city, but the capital is Rabat.'] },
  { country: 'Ethiopia', capital: 'Addis Ababa', continent: 'Africa' },
  { country: 'Canada', capital: 'Ottawa', continent: 'North America', trap: ['Toronto', 'Toronto is Canada\'s largest city, but the capital is Ottawa.'] },
  { country: 'the USA', capital: 'Washington, D.C.', continent: 'North America', trap: ['New York', 'New York is the largest city in the USA, but the capital is Washington, D.C.'], alt: ['Washington DC', 'Washington', 'Washington D.C.'] },
  { country: 'Mexico', capital: 'Mexico City', continent: 'North America' },
  { country: 'Brazil', capital: 'Brasília', continent: 'South America', trap: ['Rio de Janeiro', 'Rio de Janeiro was the capital until 1960, when the government moved to the new city of Brasília.'], alt: ['Brasilia'] },
  { country: 'Argentina', capital: 'Buenos Aires', continent: 'South America' },
  { country: 'Peru', capital: 'Lima', continent: 'South America' },
  { country: 'Chile', capital: 'Santiago', continent: 'South America' },
  { country: 'Colombia', capital: 'Bogotá', continent: 'South America', alt: ['Bogota'] },
  { country: 'China', capital: 'Beijing', continent: 'Asia', trap: ['Shanghai', 'Shanghai is a huge port city on the coast, but the capital is Beijing.'] },
  { country: 'Japan', capital: 'Tokyo', continent: 'Asia', trap: ['Kyoto', 'Kyoto was the old imperial capital, but the capital today is Tokyo.'] },
  { country: 'India', capital: 'New Delhi', continent: 'Asia', trap: ['Mumbai', 'Mumbai is India\'s financial centre, but the capital is New Delhi.'], alt: ['Delhi'] },
  { country: 'Pakistan', capital: 'Islamabad', continent: 'Asia', trap: ['Karachi', 'Karachi is a huge port city, but the capital is Islamabad.'] },
  { country: 'Bangladesh', capital: 'Dhaka', continent: 'Asia' },
  { country: 'Thailand', capital: 'Bangkok', continent: 'Asia' },
  { country: 'Vietnam', capital: 'Hanoi', continent: 'Asia', trap: ['Ho Chi Minh City', 'Ho Chi Minh City is a large city in the south, but the capital is Hanoi, in the north.'] },
  { country: 'South Korea', capital: 'Seoul', continent: 'Asia' },
  { country: 'Turkey', capital: 'Ankara', continent: 'Europe and Asia', trap: ['Istanbul', 'Istanbul is Turkey\'s largest and most famous city, but the capital is Ankara.'] },
  { country: 'Saudi Arabia', capital: 'Riyadh', continent: 'Asia', trap: ['Mecca', 'Mecca is Islam\'s holiest city, but the capital of Saudi Arabia is Riyadh.'] },
  { country: 'Russia', capital: 'Moscow', continent: 'Europe and Asia', trap: ['St Petersburg', 'St Petersburg was the capital in the past, but the capital today is Moscow.'] },
  { country: 'Australia', capital: 'Canberra', continent: 'Oceania', trap: ['Sydney', 'Sydney is Australia\'s most famous city, but the capital is Canberra, which was built to be the capital.'] },
  { country: 'New Zealand', capital: 'Wellington', continent: 'Oceania', trap: ['Auckland', 'Auckland is New Zealand\'s largest city, but the capital is Wellington.'] },
]

const Cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const capitalGenerators: ItemGenerator[] = [
  G('place.capitals.pick', 'place.countries-capitals', [1, 3], (rng, d) => {
    const pool = d <= 1 ? CAPITALS.filter((c) => !c.trap) : d >= 3 ? CAPITALS.filter((c) => c.trap) : CAPITALS
    const c = rng.pick(pool)
    const near = rng.shuffle(CAPITALS.filter((x) => x !== c && x.continent === c.continent))
    const far = rng.shuffle(CAPITALS.filter((x) => x !== c && x.continent !== c.continent))
    const wrong: { label: string; misconception?: string; feedback?: string }[] = []
    if (c.trap && d >= 2) wrong.push({ label: c.trap[0], misconception: 'big-city-not-capital', feedback: c.trap[1] })
    for (const x of [...near, ...far]) {
      if (wrong.length >= 3) break
      wrong.push({ label: x.capital, misconception: 'other-capital', feedback: `${x.capital} is the capital of ${x.country}.` })
    }
    return choice({
      rng,
      prompt: `What is the capital city of ${c.country}?`,
      correct: c.capital,
      wrong,
      hint: c.trap ? 'The capital is where the national government is based. It is not always the biggest or most famous city.' : `It is in ${c.continent}.`,
      explanation: `The capital of ${c.country} is ${c.capital}.${c.trap ? ` ${c.trap[1]}` : ''}`,
    })
  }),
  G('place.capitals.reverse', 'place.countries-capitals', [2, 4], (rng) => {
    const c = rng.pick(CAPITALS)
    const wrong = rng.shuffle(CAPITALS.filter((x) => x !== c)).slice(0, 3)
    return choice({
      rng,
      prompt: `${c.capital} is the capital city of which country?`,
      correct: Cap(c.country),
      wrong: wrong.map((x) => ({ label: Cap(x.country), feedback: `The capital of ${x.country} is ${x.capital}.` })),
      hint: `It is in ${c.continent}.`,
      explanation: `${c.capital} is the capital of ${c.country}.`,
    })
  }),
  G('place.capitals.match', 'place.countries-capitals', [2, 4], (rng, d) => {
    const pick = rng.shuffle(d >= 4 ? CAPITALS.filter((c) => c.trap) : CAPITALS).slice(0, d >= 4 ? 5 : 4)
    return matchItem({
      prompt: 'Match each country to its capital city.',
      pairs: pick.map((c) => ({ left: Cap(c.country), right: c.capital })),
      hint: 'Remember that the capital is not always the biggest city.',
      explanation: pick.map((c) => `${Cap(c.country)}: ${c.capital}`).join('\n'),
    })
  }),
  G('place.capitals.type', 'place.countries-capitals', [3, 5], (rng, d) => {
    const c = rng.pick(d >= 5 ? CAPITALS.filter((x) => x.trap) : CAPITALS)
    return textItem({
      prompt: `Type the capital city of ${c.country}.`,
      accept: [c.capital, ...(c.alt ?? [])],
      ignoreAccents: true,
      placeholder: 'Capital city',
      hint: `It begins with "${c.capital.charAt(0)}".`,
      explanation: `The capital of ${c.country} is ${c.capital}.${c.trap ? ` ${c.trap[1]}` : ''}`,
    })
  }),
]

// =====================================================================================================================
// Latitude and longitude
// =====================================================================================================================

const latLongBank: Bank = {
  skill: 'place.lat-long',
  noun: 'line or term',
  terms: [
    { term: 'Equator', def: 'The imaginary line at 0° latitude, halfway between the North and South Poles' },
    { term: 'Prime Meridian', def: 'The line of 0° longitude, which runs through Greenwich in London' },
    { term: 'Tropic of Cancer', def: 'The line of latitude about 23.5° north of the Equator' },
    { term: 'Tropic of Capricorn', def: 'The line of latitude about 23.5° south of the Equator' },
    { term: 'Arctic Circle', def: 'The line of latitude about 66.5° north of the Equator' },
    { term: 'Antarctic Circle', def: 'The line of latitude about 66.5° south of the Equator' },
    { term: 'Latitude', def: 'How far north or south of the Equator a place is, measured in degrees' },
    { term: 'Longitude', def: 'How far east or west of the Prime Meridian a place is, measured in degrees' },
    { term: 'Hemisphere', def: 'Half of the Earth, for example the half north of the Equator' },
  ],
  mcqs: [
    {
      q: 'Which line is at 0° latitude?',
      a: 'The Equator',
      wrong: [
        { label: 'The Prime Meridian', misconception: 'lat-long-swap', feedback: 'The Prime Meridian is 0° longitude. Latitude is measured from the Equator.' },
        'The Tropic of Cancer',
        'The Arctic Circle',
      ],
      hint: 'Latitude is measured north and south from this line.',
      why: 'The Equator is 0° latitude. Latitude increases to 90° at the North and South Poles.',
      lv: [1, 2],
    },
    {
      q: 'Which way do lines of latitude run around the globe?',
      a: 'East to west, parallel to the Equator',
      wrong: [{ label: 'North to south, from pole to pole', misconception: 'lat-long-swap', feedback: 'Lines that run from pole to pole are lines of longitude (meridians).' }, 'Diagonally across the globe', 'In circles around the North Pole only'],
      hint: 'Think "latitude = ladder": the rungs go across.',
      why: 'Lines of latitude (parallels) run east-west around the globe, parallel to the Equator. Lines of longitude run from pole to pole.',
      lv: [1, 3],
    },
    {
      q: 'What is the latitude of the North Pole?',
      a: '90°N',
      wrong: [{ label: '0°', misconception: 'equator-zero', feedback: '0° is the Equator.' }, { label: '180°', misconception: 'long-max', feedback: 'Longitude goes up to 180°, but latitude only goes up to 90°.' }, { label: '66.5°N', misconception: 'arctic-circle', feedback: 'That is the Arctic Circle, not the pole.' }],
      hint: 'From the Equator to the pole is a quarter of a full circle.',
      why: 'The North Pole is 90°N, a quarter of a circle (90°) round from the Equator.',
      lv: [2, 3],
    },
    {
      q: 'The Equator passes through which of these countries?',
      a: 'Kenya',
      wrong: [
        'Egypt',
        { label: 'Nigeria', misconception: 'nigeria-equator', feedback: 'Nigeria is close, but all of it lies a little north of the Equator.' },
        'South Africa',
      ],
      hint: 'It is in East Africa.',
      why: 'The Equator crosses Africa through countries including Gabon, the Congo, Uganda, Kenya and Somalia.',
      lv: [2, 4],
    },
    {
      q: 'Which of these countries is entirely in the southern hemisphere?',
      a: 'Australia',
      wrong: [
        { label: 'Brazil', misconception: 'brazil-south', feedback: 'Most of Brazil is south of the Equator, but the Equator crosses the north of the country.' },
        'India',
        'Japan',
      ],
      hint: 'Which country is completely south of the Equator?',
      why: 'All of Australia lies south of the Equator. The Equator crosses northern Brazil, and India and Japan are in the northern hemisphere.',
      lv: [2, 4],
    },
    {
      q: 'Why is it hotter at the Equator than at the poles?',
      a: 'The Sun\'s rays hit the ground more directly, so their heat is concentrated on a smaller area',
      wrong: [
        { label: 'The Equator is closer to the Sun', misconception: 'closer-to-sun', feedback: 'The difference in distance is tiny. What matters is the angle the Sun\'s rays hit the ground.' },
        { label: 'There is more cloud at the poles, which blocks the heat', misconception: 'cloud', feedback: 'Cloud is not the main reason. The low angle of the Sun at the poles spreads its energy thinly.' },
        { label: 'The Earth spins faster at the Equator, creating heat', misconception: 'spin-heat', feedback: 'Spinning does not heat the ground. The angle of the Sun\'s rays does.' },
      ],
      hint: 'Think of a torch shining straight down compared with shining at a low angle.',
      why: 'At the Equator the Sun is high in the sky, so its energy falls on a small area. Near the poles the rays arrive at a low angle and spread over a larger area, and travel through more atmosphere.',
      lv: [4, 5],
    },
    {
      q: 'Why are the seasons in Australia the opposite of those in the UK?',
      a: 'The Earth\'s axis is tilted, so when the northern hemisphere leans towards the Sun the southern hemisphere leans away',
      wrong: [
        { label: 'The Earth is closer to the Sun during the UK\'s summer', misconception: 'distance-seasons', feedback: 'The Earth is actually closest to the Sun in early January, during the UK\'s winter. Seasons are caused by the tilt.' },
        { label: 'Australia is on the opposite side of the Sun', misconception: 'opposite-side', feedback: 'Both countries are on the same planet, so they are the same distance from the Sun. The tilt is what matters.' },
        { label: 'The Sun moves north and south of the Equator', misconception: 'sun-moves', feedback: 'It looks that way from Earth, but it is the tilt of the Earth as it orbits that causes this.' },
      ],
      hint: 'The Earth\'s axis is tilted by about 23.5°.',
      why: 'The Earth\'s axis is tilted by about 23.5°. In June the northern hemisphere is tilted towards the Sun (UK summer) while the southern hemisphere is tilted away (Australian winter). In December it is the other way round.',
      lv: [4, 5],
    },
    {
      q: 'What is the largest possible value of longitude?',
      a: '180°',
      wrong: [{ label: '90°', misconception: 'lat-max', feedback: '90° is the largest latitude (at the poles). Longitude goes up to 180° east or west.' }, '360°', '100°'],
      hint: 'Longitude is measured east or west, half way round the world each way.',
      why: 'Longitude goes from 0° at the Prime Meridian up to 180° east or 180° west, which meet on the opposite side of the world.',
      lv: [3, 5],
    },
  ],
}

const latLongGenerators: ItemGenerator[] = [
  G('place.lat-long.write', 'place.lat-long', [1, 4], (rng, d) => {
    const lat = 5 * rng.int(1, 16)
    let lon = 5 * rng.int(1, d >= 4 ? 34 : 16)
    if (lat === lon) lon += 5
    const ns = rng.chance(0.5) ? 'N' : 'S'
    const ew = rng.chance(0.5) ? 'E' : 'W'
    const nsWord = ns === 'N' ? 'north' : 'south'
    const ewWord = ew === 'E' ? 'east' : 'west'
    const flip = (x: string) => ({ N: 'S', S: 'N', E: 'W', W: 'E' })[x] as string
    const correct = `${lat}°${ns} ${lon}°${ew}`
    return choice({
      rng,
      prompt: `A place is ${lat}° ${nsWord} of the Equator and ${lon}° ${ewWord} of the Prime Meridian. How is its location written?`,
      correct,
      wrong: [
        { label: `${lon}°${ns} ${lat}°${ew}`, misconception: 'lat-long-swap', feedback: 'Latitude (north or south of the Equator) comes first, then longitude (east or west).' },
        { label: `${lat}°${flip(ns)} ${lon}°${ew}`, misconception: 'wrong-hemisphere-ns', feedback: `The place is ${nsWord} of the Equator, so the latitude ends in ${ns}.` },
        { label: `${lat}°${ns} ${lon}°${flip(ew)}`, misconception: 'wrong-hemisphere-ew', feedback: `The place is ${ewWord} of the Prime Meridian, so the longitude ends in ${ew}.` },
      ],
      hint: 'Latitude comes first, then longitude. Each needs a letter for its direction.',
      explanation: `Write latitude first (${lat}°${ns}, ${nsWord} of the Equator), then longitude (${lon}°${ew}, ${ewWord} of the Prime Meridian): ${correct}.`,
    })
  }),
  G('place.lat-long.hemispheres', 'place.lat-long', [3, 5], (rng) => {
    const lat = rng.int(5, 70)
    const lon = rng.int(5, 175)
    const ns = rng.chance(0.5) ? 'N' : 'S'
    const ew = rng.chance(0.5) ? 'E' : 'W'
    const nsH = ns === 'N' ? 'Northern' : 'Southern'
    const ewH = ew === 'E' ? 'eastern' : 'western'
    const all = [
      ['Northern', 'eastern'],
      ['Northern', 'western'],
      ['Southern', 'eastern'],
      ['Southern', 'western'],
    ].map(([a, b]) => `${a} and ${b} hemispheres`)
    const correct = `${nsH} and ${ewH} hemispheres`
    return choice({
      rng,
      prompt: `A place is at ${lat}°${ns} ${lon}°${ew}. Which hemispheres is it in?`,
      correct,
      wrong: all.filter((x) => x !== correct).map((x) => ({ label: x, feedback: 'N or S tells you which side of the Equator; E or W tells you which side of the Prime Meridian.' })),
      keepOrder: true,
      hint: 'The letter after the latitude says north or south of the Equator; the letter after the longitude says east or west of the Prime Meridian.',
      explanation: `${ns} means ${ns === 'N' ? 'north' : 'south'} of the Equator (${nsH.toLowerCase()} hemisphere). ${ew} means ${ew === 'E' ? 'east' : 'west'} of the Prime Meridian (${ewH} hemisphere).`,
    })
  }),
]

// =====================================================================================================================
// Time zones (longitude based: 360° in 24 hours = 15° per hour)
// =====================================================================================================================

const timeBank: Bank = {
  skill: 'place.time-zones',
  mcqs: [
    {
      q: 'Why do different places in the world have different times?',
      a: 'The Earth rotates, so the Sun is overhead at different places at different times',
      wrong: [
        { label: 'The Earth orbits the Sun once a day', misconception: 'orbit-day', feedback: 'The Earth orbits the Sun once a year. It rotates on its axis once a day.' },
        { label: 'Each government chooses any time it likes, with no link to the Sun', misconception: 'random-time', feedback: 'Governments do choose time zones, but they follow the Sun: midday is roughly when the Sun is highest.' },
        'The Moon blocks the Sun from some places',
      ],
      hint: 'What causes day and night?',
      why: 'The Earth rotates once every 24 hours. As it turns, different places face the Sun, so "midday" happens at different times around the world.',
      lv: [1, 3],
    },
    {
      q: 'How many degrees of longitude make a one-hour time difference?',
      a: '15°',
      wrong: [{ label: '24°', misconception: 'hours-as-degrees', feedback: 'There are 24 hours in a day, but 360° in a circle: 360 ÷ 24 = 15.' }, '10°', '30°'],
      hint: 'The Earth turns 360° in 24 hours.',
      why: '360° ÷ 24 hours = 15° per hour.',
      lv: [1, 3],
    },
    {
      q: 'Compared with the UK, are places to the east ahead of or behind UK time?',
      a: 'Ahead (later in the day)',
      wrong: [{ label: 'Behind (earlier in the day)', misconception: 'east-behind', feedback: 'The Earth spins towards the east, so places to the east see the sunrise first and are ahead.' }, 'Always the same time', 'It depends on the season only'],
      hint: 'The Sun rises in the east.',
      why: 'The Earth rotates from west to east, so places further east see the Sun rise earlier. Their clocks are ahead of the UK\'s.',
      lv: [1, 3],
    },
    {
      q: 'What is the International Date Line?',
      a: 'A line roughly along 180° longitude where the date changes by one day',
      wrong: [
        { label: 'Another name for the Equator', misconception: 'dateline-equator', feedback: 'The Equator is 0° latitude. The Date Line runs from pole to pole, roughly along 180° longitude.' },
        { label: 'The line of 0° longitude through Greenwich', misconception: 'dateline-prime', feedback: 'That is the Prime Meridian. The Date Line is on the opposite side of the world.' },
        'The border between two time zones in Europe',
      ],
      hint: 'It is on the opposite side of the world from Greenwich.',
      why: 'The International Date Line roughly follows 180° longitude in the Pacific. Crossing it westwards you skip forward a day; eastwards you go back a day.',
      lv: [3, 5],
    },
    {
      q: 'What does GMT stand for?',
      a: 'Greenwich Mean Time',
      wrong: ['Global Measured Time', 'Great Meridian Time', 'Greenwich Midday Time'],
      hint: 'It is named after a place in London.',
      why: 'Greenwich Mean Time is the time at the Prime Meridian (0°) in Greenwich, London. In summer the UK uses British Summer Time, one hour ahead.',
      lv: [1, 2],
    },
  ],
}

const timeGenerators: ItemGenerator[] = [
  G('place.time.difference', 'place.time-zones', [2, 3], (rng) => {
    const h = rng.int(1, 11)
    const ew = rng.chance(0.5) ? 'east' : 'west'
    return num({
      prompt: `Using longitude alone, how many hours' difference is there between Greenwich (0°) and a place at ${h * 15}°${ew === 'east' ? 'E' : 'W'}?`,
      answer: h,
      suffix: 'hours',
      hint: 'Every 15° of longitude is one hour.',
      explanation: `${h * 15} ÷ 15 = ${h} hours. The place is ${ew} of Greenwich, so it is ${h} hours ${ew === 'east' ? 'ahead' : 'behind'}.`,
      errors: [{ values: [h * 15], tag: 'degrees-not-hours', message: 'That is the number of degrees. Divide by 15 to get hours.' }],
    })
  }),
  G('place.time.clock', 'place.time-zones', [3, 5], (rng, d) => {
    const h = rng.int(1, d >= 5 ? 11 : 8)
    const east = rng.chance(0.5)
    const start = d >= 5 ? rng.int(0, 23) : east ? rng.int(6, 23 - h) : rng.int(h + 1, 20)
    const ans = (((start + (east ? h : -h)) % 24) + 24) % 24
    const wrongWay = (((start + (east ? -h : h)) % 24) + 24) % 24
    const pad = (n: number) => String(n).padStart(2, '0')
    return num({
      prompt: `It is ${pad(start)}:00 at Greenwich (0°). Using longitude alone, what time is it at ${h * 15}°${east ? 'E' : 'W'}? Give the hour on the 24-hour clock.`,
      answer: ans,
      suffix: ':00',
      hint: `First turn ${h * 15}° into hours (15° per hour). Then decide: is the place ahead or behind?`,
      explanation: `${h * 15}° ÷ 15 = ${h} hours. It is ${east ? 'east, so ahead' : 'west, so behind'}: ${pad(start)}:00 ${east ? '+' : '−'} ${h} hours = ${pad(ans)}:00${(east && start + h >= 24) || (!east && start - h < 0) ? (east ? ' the next day' : ' the day before') : ''}. (Real time zones follow country borders, so actual clocks can differ a little.)`,
      errors: [{ values: [wrongWay], tag: 'east-west-reversed', message: 'Check the direction: places to the east are ahead, places to the west are behind.' }],
    })
  }),
  G('place.time.between', 'place.time-zones', [4, 5], (rng) => {
    const a = rng.int(1, 6)
    const b = rng.int(1, 6)
    return num({
      prompt: `Using longitude alone, how many hours' difference is there between a place at ${a * 15}°E and a place at ${b * 15}°W?`,
      answer: a + b,
      suffix: 'hours',
      hint: 'They are on opposite sides of the Prime Meridian. How many degrees apart are they altogether?',
      explanation: `${a * 15}° + ${b * 15}° = ${(a + b) * 15}° apart. ${(a + b) * 15} ÷ 15 = ${a + b} hours.`,
      errors: [{ values: [Math.abs(a - b)], tag: 'subtracted-across-meridian', message: 'One is east and one is west of 0°, so add the longitudes, don\'t subtract.' }],
    })
  }),
]

// =====================================================================================================================

export const placeGenerators: ItemGenerator[] = [
  ...bankGenerators(continentsBank),
  ...continentGenerators,
  ...bankGenerators(ukBank),
  ...ukGenerators,
  ...capitalGenerators,
  ...bankGenerators(latLongBank),
  ...latLongGenerators,
  ...bankGenerators(timeBank),
  ...timeGenerators,
]
