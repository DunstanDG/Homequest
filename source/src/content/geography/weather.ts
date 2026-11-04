import type { ItemGenerator } from '@/engine/registry'
import { bankGenerators, G, lower, num, type Bank } from './factory'

// =====================================================================================================================
// Weather and climate
// =====================================================================================================================

const weatherClimate: Bank = {
  skill: 'weather.weather-climate',
  terms: [
    { term: 'Weather', def: 'The day-to-day conditions of the atmosphere, such as temperature, rain and wind' },
    { term: 'Climate', def: 'The average weather of a place, worked out over a long period (usually 30 years)' },
    { term: 'Precipitation', def: 'Water falling from the sky as rain, sleet, snow or hail' },
    { term: 'Humidity', def: 'The amount of water vapour in the air' },
    { term: 'Air pressure', def: 'The weight of the atmosphere pressing down on the Earth\'s surface' },
    { term: 'Prevailing wind', def: 'The direction the wind blows from most often at a place' },
  ],
  links: [
    {
      prompt: 'Match each weather instrument to what it measures.',
      pairs: [
        ['Rain gauge', 'Precipitation'],
        ['Thermometer', 'Temperature'],
        ['Barometer', 'Air pressure'],
        ['Anemometer', 'Wind speed'],
        ['Wind vane', 'Wind direction'],
        ['Hygrometer', 'Humidity'],
      ],
      hint: '"Anemos" is Greek for wind; "baros" means weight.',
      ask: (l) => `What does ${/^[AEIOU]/.test(l) ? 'an' : 'a'} ${l.toLowerCase()} measure?`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'Which statement describes CLIMATE rather than weather?',
      a: 'Summers in southern Spain are usually hot and dry',
      wrong: [
        { label: 'It snowed in Leeds yesterday', misconception: 'weather-climate', feedback: 'That is one day\'s conditions: weather.' },
        { label: 'This afternoon will be windy on the coast', misconception: 'weather-climate', feedback: 'A forecast for one afternoon is weather.' },
        { label: 'There were thunderstorms in London last night', misconception: 'weather-climate', feedback: 'One night\'s storms are weather. Climate is the usual pattern over many years.' },
      ],
      hint: 'Climate is about what is usual over many years, not what happens on one day.',
      why: 'Climate describes the average conditions over a long time ("usually hot and dry"). Weather is what happens on a particular day.',
      lv: [1, 3],
    },
    {
      q: 'Why is a thermometer kept in a Stevenson screen (a white box with slatted sides, raised above the ground)?',
      a: 'So it measures the air temperature in the shade, without direct sunlight or heat from the ground',
      wrong: [
        { label: 'To keep it warm so it does not freeze', misconception: 'screen-warmth', feedback: 'The screen is not there to keep it warm; the slats let air flow freely.' },
        'To stop people reading it',
        'So it can measure the rainfall too',
      ],
      hint: 'Would a thermometer in full sunshine give a fair reading of the air?',
      why: 'The white paint reflects sunlight, the slats let air move through, and the height keeps it away from heat given off by the ground, so the reading is the true air temperature in the shade.',
      lv: [3, 5],
    },
    {
      q: 'Why does it usually get colder as you climb a mountain?',
      a: 'The air is thinner higher up, so it holds less heat',
      wrong: [
        { label: 'You are further from the Sun', misconception: 'closer-to-sun', feedback: 'A few kilometres makes no difference compared with the 150 million km to the Sun. Thinner air is the reason.' },
        'Mountains are always covered in snow',
        'There is more wind at the top, which makes the air colder',
      ],
      hint: 'Think about the air itself, not the Sun.',
      why: 'The atmosphere is mostly warmed from the ground up, and air higher up is less dense, so it holds less heat. Temperature falls with altitude.',
      lv: [3, 5],
    },
    {
      q: 'Over how many years is a place\'s climate usually averaged?',
      a: 'About 30 years',
      wrong: ['1 year', '5 years', '1,000 years'],
      hint: 'It has to be long enough to smooth out an unusual year or two.',
      why: 'Climate is usually based on 30 years of records, so one unusually wet or hot year does not distort it.',
      lv: [2, 4],
    },
  ],
}

const weatherNumeric: ItemGenerator[] = [
  G('weather.wc.daily-range', 'weather.weather-climate', [2, 4], (rng, d) => {
    const max = d >= 4 ? rng.int(1, 8) : rng.int(12, 28)
    const min = d >= 4 ? -rng.int(1, 9) : max - rng.int(4, 12)
    return num({
      prompt: `A school weather station recorded a maximum temperature of ${max}°C and a minimum of ${min}°C in one day. What was the temperature range?`,
      answer: max - min,
      suffix: '°C',
      hint: 'Range = maximum − minimum. If the minimum is below zero, count up from it to zero and then on to the maximum.',
      explanation: `${max} − (${min}) = ${max - min}°C.`,
      errors: min < 0 ? [{ values: [max + min], tag: 'negative-subtraction', message: 'Below-zero temperatures make the gap bigger: from ' + min + '°C up to 0 is ' + -min + ' degrees, then on to ' + max + '.' }] : [],
    })
  }),
]

// =====================================================================================================================
// Types of rainfall
// =====================================================================================================================

const rainfall: Bank = {
  skill: 'weather.rainfall',
  terms: [
    { term: 'Relief rainfall', def: 'Rain formed when moist air is forced to rise over hills or mountains' },
    { term: 'Convectional rainfall', def: 'Rain formed when the Sun heats the ground strongly and warm air rises quickly' },
    { term: 'Frontal rainfall', def: 'Rain formed when warm air meets cold air and is forced to rise over it' },
    { term: 'Rain shadow', def: 'A drier area on the sheltered side of high ground, where sinking air warms up' },
    { term: 'Condensation', def: 'When water vapour cools and turns back into tiny liquid droplets' },
    { term: 'Front', def: 'The boundary between a mass of warm air and a mass of cold air' },
  ],
  orders: [
    {
      prompt: 'Put the stages of relief rainfall in order.',
      steps: ['Moist air is blown in from the sea', 'The air is forced to rise over high ground', 'The rising air cools', 'Water vapour condenses to form clouds', 'Rain falls on the windward side', 'Air sinks and warms on the other side, giving a rain shadow'],
      direction: ['first', 'last'],
      hint: 'All rainfall needs air to rise, cool and condense. What makes the air rise here?',
      why: 'Moist air from the sea is pushed up over hills, cools and condenses, so the windward side is wet. On the far side the air sinks and warms, so it is drier: a rain shadow.',
      lv: [3, 5],
    },
    {
      prompt: 'Put the stages of convectional rainfall in order.',
      steps: ['The Sun heats the ground strongly', 'Air near the ground warms and rises quickly', 'The rising air cools', 'Water vapour condenses into tall clouds', 'Heavy rain falls, often with thunder'],
      direction: ['first', 'last'],
      hint: 'It starts with heating.',
      why: 'Strong heating makes air rise rapidly. It cools, condenses into towering cumulonimbus clouds, and heavy showers or thunderstorms follow, often in the afternoon.',
      lv: [3, 4],
    },
  ],
  mcqs: [
    {
      q: 'What do relief, convectional and frontal rainfall all have in common?',
      a: 'Air rises, cools, and its water vapour condenses into clouds',
      wrong: [
        { label: 'They only happen near mountains', misconception: 'all-relief', feedback: 'Only relief rainfall needs high ground. The others are caused by heating or by fronts.' },
        'They all happen only in summer',
        { label: 'Air sinks and warms up', misconception: 'sinking-rain', feedback: 'Sinking air warms and clouds disappear. Rain needs rising air.' },
      ],
      hint: 'What has to happen to water vapour for it to form clouds?',
      why: 'In every type, air rises and cools. Cool air holds less water vapour, so it condenses into clouds and then rain. The types differ only in what makes the air rise.',
      lv: [2, 4],
    },
    {
      q: 'Which type of rainfall happens most afternoons in tropical rainforests?',
      a: 'Convectional rainfall',
      wrong: [
        { label: 'Relief rainfall', misconception: 'relief-everywhere', feedback: 'Relief rain needs hills. In the rainforest the cause is intense heating by the Sun.' },
        { label: 'Frontal rainfall', misconception: 'frontal-tropics', feedback: 'Fronts are typical of mid-latitudes like the UK, not the tropics.' },
        'Acid rain',
      ],
      hint: 'The Sun is overhead and heats the ground strongly every morning.',
      why: 'Intense morning heating makes warm, moist air rise; by afternoon it has formed towering clouds and heavy rain.',
      lv: [2, 4],
    },
    {
      q: 'Why does the west of the UK get more rain than the east?',
      a: 'Moist south-westerly winds from the Atlantic rise over the western hills, causing relief rainfall',
      wrong: [
        { label: 'The west is closer to the Equator', misconception: 'west-equator', feedback: 'East and west of the UK are at similar latitudes. The hills and the winds are the reason.' },
        { label: 'Most rain blows in from the North Sea', misconception: 'east-wind', feedback: 'The prevailing wind in the UK is from the south-west, off the Atlantic.' },
        'The west has fewer towns',
      ],
      hint: 'Where are the UK\'s highest mountains, and where does the wind usually come from?',
      why: 'The prevailing winds blow from the Atlantic, and the highest land (Wales, the Lake District, western Scotland) is in the west. Air rises over it and drops its rain; the east is in a rain shadow.',
      lv: [3, 5],
    },
    {
      q: 'Which type of rainfall is linked with depressions (low-pressure systems) crossing the UK?',
      a: 'Frontal rainfall',
      wrong: ['Convectional rainfall', 'Relief rainfall', 'Monsoon rainfall'],
      hint: 'Depressions have warm fronts and cold fronts.',
      why: 'Depressions bring warm and cold air masses together. Where warm air is forced up over cold air at a front, frontal rain falls.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Explain how relief rainfall forms. You may use the Lake District as an example.',
      model: 'Prevailing south-westerly winds bring moist air from the Atlantic towards the Lake District. The mountains force the air to rise. As it rises it cools, and the water vapour condenses into clouds, so heavy rain falls on the windward side. The air then sinks down the other side, warming up, so places to the east are drier; this is called a rain shadow.',
      checklist: ['Says the air is moist (often from the sea)', 'Says the air is forced to rise over high ground', 'Explains that rising air cools and condenses into clouds', 'Mentions the rain shadow on the sheltered side'],
      hint: 'Rise, cool, condense, rain... and what happens on the other side?',
    },
  ],
}

// =====================================================================================================================
// Air pressure
// =====================================================================================================================

const pressure: Bank = {
  skill: 'weather.pressure',
  terms: [
    { term: 'Anticyclone', def: 'An area of high pressure with sinking air, usually bringing settled, dry weather' },
    { term: 'Depression', def: 'An area of low pressure with rising air, bringing cloud, wind and rain' },
    { term: 'Isobar', def: 'A line on a weather map joining places with the same air pressure' },
    { term: 'Warm front', def: 'The boundary where advancing warm air rises gently over cold air' },
    { term: 'Cold front', def: 'The boundary where advancing cold air pushes under warm air, forcing it up steeply' },
    { term: 'Wind', def: 'Air moving from an area of high pressure towards an area of low pressure' },
  ],
  mcqs: [
    {
      q: 'What weather does an anticyclone usually bring to the UK in summer?',
      a: 'Hot, dry, sunny weather with clear skies',
      wrong: [{ label: 'Strong winds and heavy rain', misconception: 'high-low-swapped', feedback: 'That is typical of a depression (low pressure).' }, 'Snow and blizzards', 'Thick cloud and drizzle all day'],
      hint: 'Air is sinking in an anticyclone.',
      why: 'In an anticyclone air sinks and warms, so clouds do not form. Summer days are hot and sunny; winter days are cold and clear, with frost and fog.',
      lv: [1, 3],
    },
    {
      q: 'What weather does an anticyclone usually bring to the UK in winter?',
      a: 'Cold, clear days with frost and fog at night',
      wrong: [{ label: 'Mild, wet and windy weather', misconception: 'high-low-swapped', feedback: 'That is typical of a depression.' }, 'Heatwaves', 'Thunderstorms every afternoon'],
      hint: 'Clear skies let heat escape at night.',
      why: 'With no cloud cover at night, heat escapes into space, so temperatures fall sharply, giving frost and fog.',
      lv: [3, 4],
    },
    {
      q: 'On a weather map, what do isobars that are very close together show?',
      a: 'Strong winds',
      wrong: [{ label: 'Calm weather', misconception: 'isobars-reversed', feedback: 'Widely spaced isobars mean calm weather; close isobars mean the pressure changes quickly and winds are strong.' }, 'Heavy snow', 'Hot sunshine'],
      hint: 'Compare with contour lines: close together means a steep change.',
      why: 'Close isobars show a big pressure difference over a short distance, so air moves quickly from high to low pressure: strong winds.',
      lv: [2, 4],
    },
    {
      q: 'Why do few clouds form in an area of high pressure?',
      a: 'The air is sinking and warming, so water vapour does not condense',
      wrong: [{ label: 'The air is rising quickly', misconception: 'rising-high', feedback: 'Rising air is a feature of low pressure, and it makes clouds.' }, 'There is no water vapour in the air', 'The Sun burns the clouds away'],
      hint: 'Think about what makes clouds: rising, cooling air.',
      why: 'Clouds need air to rise and cool. In high pressure the air sinks and warms, so condensation does not happen and skies are clear.',
      lv: [3, 5],
    },
    {
      q: 'Roughly what is the average air pressure at sea level?',
      a: 'About 1013 millibars',
      wrong: ['About 100 millibars', 'About 10 millibars', 'About 10 000 millibars'],
      hint: 'It is just over one thousand.',
      why: 'Average sea-level pressure is about 1013 mb. Above this is called high pressure; below it, low pressure.',
      lv: [4, 5],
    },
  ],
  written: [
    {
      prompt: 'Describe and explain the weather a depression brings as it passes over the UK.',
      model: 'A depression is an area of low pressure where air is rising. As the warm front arrives, warm air rises gently over cold air, giving thickening cloud and steady rain. Behind it the warm sector is milder, with drizzle. When the cold front passes, warm air is forced up steeply, causing heavy showers and sometimes thunder, followed by colder, clearer weather. Close isobars mean the winds are strong.',
      checklist: ['Says a depression is low pressure with rising air', 'Describes the weather at the warm front', 'Describes the weather at or after the cold front', 'Links strong winds to close isobars or the pressure difference'],
      hint: 'Work through it in time order: warm front, warm sector, cold front.',
    },
  ],
}

// =====================================================================================================================
// UK climate
// =====================================================================================================================

const ukClimate: Bank = {
  skill: 'weather.uk-climate',
  links: [
    {
      prompt: 'Match each factor to how it affects the UK\'s climate.',
      pairs: [
        ['Latitude', 'The UK is far from the Equator, so the Sun\'s rays are spread out and summers are only mild'],
        ['North Atlantic Drift', 'A warm ocean current that keeps winters mild, especially in the west'],
        ['Prevailing south-westerly winds', 'Usually bring mild, moist air from the Atlantic Ocean'],
        ['Altitude', 'High places such as the Scottish Highlands are colder, with more snow'],
        ['Distance from the sea', 'Inland areas have warmer summers and colder winters than coasts'],
      ],
      hint: 'The sea heats up and cools down more slowly than the land.',
      ask: (l) => `How does this factor affect the UK's climate: ${lower(l)}?`,
      lv: [2, 4],
    },
    {
      prompt: 'Match each air mass to the weather it brings to the UK.',
      pairs: [
        ['Tropical maritime (from the south-west)', 'Warm and moist: mild, cloudy and wet'],
        ['Polar maritime (from the north-west)', 'Cool and moist: showers, sometimes with hail'],
        ['Arctic maritime (from the north)', 'Very cold: snow in winter, especially in the north'],
        ['Polar continental (from the east, in winter)', 'Bitterly cold and dry, from mainland Europe'],
        ['Tropical continental (from the south-east, in summer)', 'Hot and dry: heatwaves'],
      ],
      hint: 'Maritime air has crossed the sea (moist); continental air has crossed land (dry). Tropical is warm; polar and arctic are cold.',
      lv: [4, 5],
    },
  ],
  mcqs: [
    {
      q: 'Which description best fits the UK\'s climate?',
      a: 'Temperate maritime: mild, with rain all year',
      wrong: [{ label: 'Tropical: hot and wet all year', misconception: 'tropical-uk', feedback: 'Tropical climates are near the Equator. The UK is in the mid-latitudes.' }, 'Polar: frozen most of the year', 'Arid: very little rain'],
      hint: 'The UK is surrounded by sea and rarely has extreme temperatures.',
      why: 'The UK has a temperate maritime climate: no extremes of heat or cold, and rain in every month, because of its latitude and the surrounding sea.',
      lv: [1, 3],
    },
    {
      q: 'Which part of the UK usually has the warmest summers?',
      a: 'The south-east of England',
      wrong: [{ label: 'The north-west of Scotland', misconception: 'scotland-warm', feedback: 'North-west Scotland is further north and nearer the Atlantic, so its summers are cooler.' }, 'Northern Ireland', 'The north-east of England'],
      hint: 'Think about both latitude and distance from the Atlantic.',
      why: 'The south-east is furthest south and furthest from the cooling Atlantic, and is closest to mainland Europe, so its summers are warmest.',
      lv: [2, 4],
    },
    {
      q: 'Why are winters on the west coast of the UK usually milder than in inland areas further east?',
      a: 'The warm North Atlantic Drift and the sea, which cools slowly, keep the west milder',
      wrong: [
        { label: 'The west is closer to the Equator', misconception: 'west-equator', feedback: 'East and west are at similar latitudes. The ocean is the reason.' },
        { label: 'There is more sunshine in the west in winter', misconception: 'sunshine', feedback: 'The west is usually cloudier. The warmth comes from the ocean.' },
        'The west has more trees',
      ],
      hint: 'What is just off the west coast?',
      why: 'The North Atlantic Drift brings warm water from the Gulf of Mexico area, and the sea keeps its heat into winter. Westerly winds carry this mildness on to western coasts.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Explain why the west of the UK is wetter than the east.',
      model: 'The prevailing wind in the UK blows from the south-west, across the Atlantic Ocean, so it carries a lot of moisture. The highest land, such as Snowdonia, the Lake District and the Scottish Highlands, is in the west. The moist air is forced to rise over these mountains, cools and condenses, giving relief rainfall. By the time the air reaches the east it has lost much of its moisture and is sinking, so the east lies in a rain shadow.',
      checklist: ['Mentions the prevailing south-westerly winds from the Atlantic', 'Mentions that the highest land is in the west', 'Explains relief rainfall (rises, cools, condenses)', 'Explains the rain shadow in the east'],
      hint: 'Two things matter: where the wind comes from, and where the mountains are.',
    },
  ],
}

// =====================================================================================================================
// Tropical storms
// =====================================================================================================================

const storms: Bank = {
  skill: 'weather.tropical-storms',
  terms: [
    { term: 'Hurricane', def: 'The name for a tropical storm in the Atlantic and north-east Pacific' },
    { term: 'Typhoon', def: 'The name for a tropical storm in the north-west Pacific' },
    { term: 'Cyclone', def: 'The name for a tropical storm in the Indian Ocean and South Pacific' },
    { term: 'Eye', def: 'The calm, clear centre of a tropical storm, where air sinks' },
    { term: 'Eyewall', def: 'The ring of tall clouds around the centre of a storm, with the strongest winds and heaviest rain' },
    { term: 'Storm surge', def: 'A rise in sea level as strong winds and low pressure push water onto the coast' },
  ],
  orders: [
    {
      prompt: 'Put the stages in the life of a tropical storm in order.',
      steps: [
        'The sea surface is heated to about 27°C or more',
        'Warm, moist air rises quickly, creating low pressure',
        'More air rushes in and spirals upwards, spun by the Earth\'s rotation',
        'Rising air cools and condenses into huge clouds, releasing heat that powers the storm',
        'An eye of sinking air forms at the centre',
        'Over land the storm loses its supply of warm, moist air and weakens',
      ],
      direction: ['first', 'last'],
      hint: 'It needs a warm ocean to start, and it dies when it is cut off from one.',
      why: 'Warm seas power the storm: rising moist air creates low pressure, the Earth\'s spin makes it rotate, and condensation releases energy. Over land or cooler water it loses its energy supply.',
      lv: [3, 5],
    },
  ],
  mcqs: [
    {
      q: 'Where do tropical storms form?',
      a: 'Over warm oceans, roughly between 5° and 30° north and south of the Equator',
      wrong: [
        { label: 'Exactly on the Equator', misconception: 'equator-storms', feedback: 'At the Equator the Earth\'s spin is too weak to make the storm rotate, so they form a little way away from it.' },
        { label: 'Over large continents such as Asia', misconception: 'over-land', feedback: 'They need a warm ocean for energy. They weaken quickly over land.' },
        'Near the North and South Poles',
      ],
      hint: 'They need warm water, and the Earth\'s spin to make them rotate.',
      why: 'Tropical storms need sea temperatures of about 27°C or more, found in the tropics. They do not form right on the Equator because the spinning effect of the Earth (the Coriolis effect) is too weak there.',
      lv: [2, 4],
    },
    {
      q: 'Why do tropical storms weaken when they reach land?',
      a: 'They lose their supply of heat and moisture from the warm ocean',
      wrong: [
        { label: 'Mountains block the wind completely', misconception: 'blocked', feedback: 'Friction with the land does slow winds, but the main reason is losing the warm ocean that powers the storm.' },
        'People fire rockets into them',
        'The eye fills with cold water',
      ],
      hint: 'What powers the storm in the first place?',
      why: 'Evaporation from a warm sea feeds the storm with energy. Over land that supply is cut off, and friction slows the winds, so the storm dies down.',
      lv: [2, 4],
    },
    {
      q: 'Which of these is a SECONDARY effect of a tropical storm?',
      a: 'Disease spreading because water supplies are contaminated',
      wrong: [
        { label: 'Buildings destroyed by strong winds', misconception: 'primary-secondary', feedback: 'That is caused directly by the storm: a primary effect.' },
        { label: 'Flooding of coastal areas by a storm surge', misconception: 'primary-secondary', feedback: 'The surge is part of the storm itself: a primary effect.' },
        { label: 'Trees blown over', misconception: 'primary-secondary', feedback: 'That is a direct, primary effect of the winds.' },
      ],
      hint: 'Secondary effects happen later, as a result of the primary effects.',
      why: 'Primary effects are caused directly by the storm (wind damage, storm surge, flooding). Secondary effects follow from them, such as disease from dirty water, shortages of food, and loss of jobs.',
      lv: [3, 5],
    },
    {
      q: 'What scale is used to rate hurricanes from category 1 to 5 by wind speed?',
      a: 'The Saffir-Simpson scale',
      wrong: [{ label: 'The Richter scale', misconception: 'richter-hurricane', feedback: 'The Richter scale is for earthquakes.' }, 'The Beaufort scale only', 'The HDI scale'],
      hint: 'It is named after an engineer and a meteorologist.',
      why: 'The Saffir-Simpson scale rates hurricanes from category 1 to 5 using sustained wind speed. Category 5 is the most powerful.',
      lv: [4, 5],
    },
  ],
  written: [
    {
      prompt: 'Explain why a tropical storm of the same strength often causes more deaths in a lower-income country than in a higher-income country.',
      model: 'Higher-income countries can afford satellites and forecasting, so they warn people days in advance and organise evacuation. Their buildings are usually stronger and built to withstand high winds. In lower-income countries many people live in poorly built homes on low-lying coasts, there may be fewer warnings or ways to evacuate, and emergency services have less money. After the storm, a lack of clean water and healthcare can lead to disease, increasing the death toll.',
      checklist: ['Mentions warnings, forecasting or evacuation', 'Mentions the quality of buildings', 'Mentions emergency services, healthcare or clean water after the storm', 'Clearly compares the two kinds of country'],
      hint: 'Think before, during and after the storm.',
    },
  ],
}

export const weatherGenerators: ItemGenerator[] = [
  ...bankGenerators(weatherClimate),
  ...weatherNumeric,
  ...bankGenerators(rainfall),
  ...bankGenerators(pressure),
  ...bankGenerators(ukClimate),
  ...bankGenerators(storms),
]
