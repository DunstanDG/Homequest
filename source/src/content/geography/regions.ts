import type { ItemGenerator } from '@/engine/registry'
import { choice } from '../kit'
import { bankGenerators, G, type Bank } from './factory'

// =====================================================================================================================
// Africa
// =====================================================================================================================

const africa: Bank = {
  skill: 'regions.africa',
  links: [
    {
      prompt: 'Match each feature of Africa to its description.',
      pairs: [
        ['The Sahara', 'The largest hot desert in the world, covering much of North Africa'],
        ['The Nile', 'The longest river in Africa, flowing north through Egypt to the Mediterranean'],
        ['Mount Kilimanjaro', 'The highest mountain in Africa, a volcano in Tanzania'],
        ['Lake Victoria', 'The largest lake in Africa, shared by Uganda, Kenya and Tanzania'],
        ['The Great Rift Valley', 'A huge valley in East Africa, formed where plates are pulling apart'],
        ['The Sahel', 'A semi-arid strip along the southern edge of the Sahara'],
        ['Victoria Falls', 'A huge waterfall on the Zambezi River, between Zambia and Zimbabwe'],
      ],
      hint: 'Use the clues in each description: desert, river, mountain, lake, valley, waterfall.',
      ask: (l) => `Which description matches ${l}?`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'Which statement about Africa is correct?',
      a: 'It is a continent of more than 50 countries with very varied landscapes, climates and cultures',
      wrong: [
        { label: 'It is a single country', misconception: 'africa-country', feedback: 'Africa is a continent of more than 50 separate countries.' },
        { label: 'It is almost entirely desert', misconception: 'africa-desert', feedback: 'Africa has deserts, but also rainforest, savanna, mountains and Mediterranean coasts.' },
        { label: 'Everyone in Africa speaks the same language', misconception: 'africa-one-language', feedback: 'Well over a thousand languages are spoken across Africa.' },
      ],
      hint: 'Avoid treating a whole continent as if it were all the same.',
      why: 'Africa is hugely diverse. It has more countries than any other continent, every biome from rainforest to desert, and well over a thousand languages.',
      lv: [1, 3],
    },
    {
      q: 'Which large rainforest is found in central Africa?',
      a: 'The Congo rainforest',
      wrong: [{ label: 'The Amazon rainforest', misconception: 'amazon-africa', feedback: 'The Amazon is in South America.' }, 'The Sahara rainforest', 'The Kalahari rainforest'],
      hint: 'It is named after a great river in central Africa.',
      why: 'The Congo Basin holds the second-largest tropical rainforest in the world, after the Amazon.',
      lv: [2, 4],
    },
    {
      q: 'Why is the Sahel especially at risk of desertification?',
      a: 'Its rainfall is low and unreliable, and overgrazing and cutting trees for fuel expose the soil',
      wrong: [{ label: 'It has too much rain, which washes the soil away', misconception: 'too-wet', feedback: 'The Sahel is semi-arid: the problem is too little, unreliable rain.' }, 'It is covered in ice', 'It is in the middle of the rainforest'],
      hint: 'It is on the edge of the Sahara.',
      why: 'Droughts, combined with overgrazing, over-cultivation and cutting trees for firewood, leave soil bare. Wind and occasional heavy rain then erode it, and the land turns to desert.',
      lv: [3, 5],
    },
    {
      q: 'The Equator crosses Africa. Which biome is mainly found along it in central Africa?',
      a: 'Tropical rainforest',
      wrong: [{ label: 'Hot desert', misconception: 'equator-desert', feedback: 'Hot deserts are around the tropics, about 15-30° from the Equator, such as the Sahara.' }, 'Tundra', 'Temperate deciduous forest'],
      hint: 'Hot and wet all year.',
      why: 'Near the Equator, high temperatures and rising air give heavy rain all year, supporting rainforest. Moving away from it you find savanna, then hot desert.',
      lv: [2, 4],
    },
  ],
  written: [
    {
      prompt: 'Africa is often described as if it were one place. Using examples, explain why this is misleading.',
      model: 'Africa is a continent of more than 50 countries, so it is misleading to describe it as one place. Its physical geography is very varied: the Sahara is a hot desert, the Congo Basin is tropical rainforest, and East Africa has savanna and high mountains such as Kilimanjaro. Its human geography is varied too: some cities, such as Lagos and Nairobi, are large and modern, while other people live in small rural villages. Levels of development also differ greatly between countries.',
      checklist: ['States that Africa is a continent with many countries', 'Gives a named physical example', 'Gives a contrasting physical or human example', 'Mentions differences in development, culture or language'],
      hint: 'Contrast different biomes, places and ways of life.',
    },
  ],
}

// =====================================================================================================================
// Asia: China and India
// =====================================================================================================================

const asia: Bank = {
  skill: 'regions.asia',
  links: [
    {
      prompt: 'Match each feature of Asia to its description.',
      pairs: [
        ['The Himalayas', 'The world\'s highest mountain range, formed where the Indian plate collides with the Eurasian plate'],
        ['Mount Everest', 'The world\'s highest mountain above sea level, on the border of Nepal and China'],
        ['The Yangtze', 'The longest river in Asia, flowing across China to the sea near Shanghai'],
        ['The Ganges', 'A river sacred to Hindus that flows across northern India to the Bay of Bengal'],
        ['The Three Gorges Dam', 'A huge dam on the Yangtze that generates hydroelectric power'],
        ['The Gobi', 'A large cold desert in northern China and Mongolia'],
      ],
      hint: 'Look for clues: mountain, river, dam, desert.',
      ask: (l) => `Which description matches ${l}?`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'What is the Indian monsoon?',
      a: 'A seasonal change in wind direction that brings very heavy rain to India, mainly from June to September',
      wrong: [{ label: 'A type of tropical storm that hits India every week', misconception: 'monsoon-storm', feedback: 'A monsoon is a season of wind and rain, not a single storm.' }, 'A cold wind from the Himalayas that brings snow to all of India', 'A drought that lasts for the whole summer'],
      hint: 'It is a season, not a single event.',
      why: 'In summer the land heats up, drawing in moist winds from the Indian Ocean, which bring heavy rain. Farmers depend on it, but it can also cause flooding.',
      lv: [2, 4],
    },
    {
      q: 'Which two countries have the largest populations in the world?',
      a: 'India and China',
      wrong: [{ label: 'The USA and Russia', misconception: 'large-area-large-pop', feedback: 'Russia is the largest country by area, but India and China have by far the largest populations.' }, 'Brazil and Indonesia', 'Japan and Pakistan'],
      hint: 'Both are in Asia and each has well over a billion people.',
      why: 'India and China each have about 1.4 billion people, far more than any other country.',
      lv: [1, 3],
    },
    {
      q: 'China introduced a policy in about 1980 that limited most families to one child. Why?',
      a: 'To slow the very rapid growth of its population',
      wrong: [{ label: 'Because its population was falling', misconception: 'policy-reversed', feedback: 'The aim was to slow fast growth, not to stop a fall.' }, 'Because there were too few schools for girls', 'To increase the number of workers quickly'],
      hint: 'What was the government worried would happen to food and resources?',
      why: 'China\'s leaders feared that rapid population growth would outstrip food and resources. The one-child policy lasted until 2015, and now China has an ageing population.',
      lv: [3, 5],
    },
    {
      q: 'Why does the Ganges form a huge delta where it reaches the sea in Bangladesh?',
      a: 'The river slows down and deposits large amounts of sediment at its mouth',
      wrong: [{ label: 'The river erodes the land faster at its mouth', misconception: 'delta-erosion', feedback: 'Deltas are formed by deposition, not erosion.' }, 'An earthquake raised the land', 'Glaciers left the sediment there'],
      hint: 'What happens when a river loses energy?',
      why: 'As the river enters the sea it slows and drops the silt it has carried from the Himalayas, building up a large, flat, fertile delta.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Explain why the monsoon is both a benefit and a hazard for people in India.',
      model: 'The monsoon brings most of India\'s yearly rainfall in a few months. This is a benefit because farmers rely on the rain to grow crops such as rice, and it refills rivers and reservoirs for drinking water. However, very heavy monsoon rain can cause rivers to flood, destroying homes, crops and roads and spreading water-borne diseases. If the monsoon is late or weak, crops can fail, causing food shortages.',
      checklist: ['Explains what the monsoon is (seasonal heavy rain)', 'Gives a benefit, such as farming or water supply', 'Gives a hazard, such as flooding or disease', 'Mentions the problem of a late or weak monsoon'],
      hint: 'Think about too much rain, the right amount, and too little.',
    },
  ],
}

// =====================================================================================================================
// Russia
// =====================================================================================================================

const russia: Bank = {
  skill: 'regions.russia',
  links: [
    {
      prompt: 'Match each feature of Russia to its description.',
      pairs: [
        ['The Ural Mountains', 'A mountain range traditionally seen as the boundary between Europe and Asia'],
        ['Lake Baikal', 'The deepest lake in the world, in southern Siberia'],
        ['The Volga', 'The longest river in Europe, flowing into the Caspian Sea'],
        ['Siberia', 'The vast region of Russia east of the Urals, with very cold winters'],
        ['The Trans-Siberian Railway', 'A railway running across the country from Moscow to Vladivostok on the Pacific coast'],
        ['The taiga', 'A huge belt of coniferous forest covering much of Russia'],
      ],
      hint: 'Look for clues: mountains, lake, river, region, railway, forest.',
      ask: (l) => `Which description matches ${l}?`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'Which is the largest country in the world by area?',
      a: 'Russia',
      wrong: [{ label: 'China', misconception: 'pop-not-area', feedback: 'China has a very large population, but Russia is much larger in area.' }, 'Canada', 'The USA'],
      hint: 'It stretches across both Europe and Asia.',
      why: 'Russia is by far the largest country by area, about 70 times the size of the UK, stretching from Europe to the Pacific Ocean.',
      lv: [1, 2],
    },
    {
      q: 'Russia stretches so far from west to east that it covers how many time zones?',
      a: '11',
      wrong: [{ label: '1', misconception: 'one-zone', feedback: 'A country that wide cannot share one time: the Sun rises hours earlier in the east than the west.' }, '3', '24'],
      hint: 'It is more than ten.',
      why: 'Russia spans 11 time zones. When it is evening in Moscow, it is already the next morning on the Pacific coast.',
      lv: [2, 4],
    },
    {
      q: 'Where do most of Russia\'s people live?',
      a: 'In the west, in the European part of Russia',
      wrong: [{ label: 'In Siberia, spread evenly across the east', misconception: 'siberia-dense', feedback: 'Siberia is huge but sparsely populated because of its harsh climate.' }, 'Along the Arctic coast', 'In the mountains'],
      hint: 'Which part has a milder climate and the capital city?',
      why: 'Most Russians live west of the Urals, where the climate is milder, the land is better for farming and the big cities, including Moscow, are found.',
      lv: [3, 5],
    },
    {
      q: 'Much of northern Russia has permafrost. Why does this make building difficult?',
      a: 'Heat from buildings can thaw the frozen ground, so it becomes soft and the buildings sink or crack',
      wrong: [{ label: 'The ground is too hot to build on', misconception: 'permafrost-hot', feedback: 'Permafrost is permanently frozen ground.' }, 'There is no rock to build on anywhere in Russia', 'Permafrost is always under water'],
      hint: 'What happens to frozen soil if a warm building sits on it?',
      why: 'If permafrost thaws, the ground becomes waterlogged and unstable. Buildings and pipelines are often raised on stilts to stop heat reaching the ground.',
      lv: [4, 5],
    },
  ],
}

// =====================================================================================================================
// The Middle East
// =====================================================================================================================

const ME_CAPITALS: { country: string; capital: string; trap?: [string, string] }[] = [
  { country: 'Saudi Arabia', capital: 'Riyadh', trap: ['Mecca', 'Mecca is Islam\'s holiest city, but the capital is Riyadh.'] },
  { country: 'Iran', capital: 'Tehran' },
  { country: 'Iraq', capital: 'Baghdad' },
  { country: 'Jordan', capital: 'Amman' },
  { country: 'Oman', capital: 'Muscat' },
  { country: 'Qatar', capital: 'Doha' },
  { country: 'the United Arab Emirates', capital: 'Abu Dhabi', trap: ['Dubai', 'Dubai is the UAE\'s largest and best-known city, but the capital is Abu Dhabi.'] },
  { country: 'Syria', capital: 'Damascus' },
  { country: 'Lebanon', capital: 'Beirut' },
]

const middleEast: Bank = {
  skill: 'regions.middle-east',
  links: [
    {
      prompt: 'Match each feature of the Middle East to its description.',
      pairs: [
        ['The Dead Sea', 'A very salty lake whose shores are the lowest land on Earth'],
        ['The Tigris and Euphrates', 'Two rivers that flow through Iraq, where some of the earliest farming and cities developed'],
        ['The Rub\' al Khali (Empty Quarter)', 'One of the largest sand deserts in the world, in the Arabian Peninsula'],
        ['The Suez Canal', 'A canal in Egypt linking the Mediterranean Sea to the Red Sea'],
        ['The Strait of Hormuz', 'A narrow sea passage through which many oil tankers sail'],
      ],
      hint: 'Look for clues: lake, rivers, desert, canal, strait.',
      ask: (l) => `Which description matches ${l}?`,
      lv: [2, 4],
    },
  ],
  mcqs: [
    {
      q: 'Which natural resource has brought great wealth to several Middle Eastern countries, such as Saudi Arabia and Qatar?',
      a: 'Oil and natural gas',
      wrong: ['Coal', 'Timber from rainforests', 'Fresh water'],
      hint: 'It is a fossil fuel found beneath the desert and sea.',
      why: 'The region holds a large share of the world\'s oil and gas reserves. Exports have made several countries very wealthy, though most are now trying to rely less on oil.',
      lv: [1, 3],
    },
    {
      q: 'Many Middle Eastern countries are short of fresh water. How do several Gulf states get much of their drinking water?',
      a: 'Desalination: removing salt from sea water',
      wrong: [{ label: 'From large rivers flowing through every country', misconception: 'rivers-everywhere', feedback: 'Most Gulf states have no permanent rivers at all.' }, 'From melting glaciers', 'From heavy monsoon rains'],
      hint: 'They are surrounded by sea, but it is salty.',
      why: 'With very little rain and no permanent rivers, countries such as Qatar and the UAE rely on desalination plants, which use a lot of energy.',
      lv: [3, 5],
    },
    {
      q: 'Which three major world religions began in the Middle East?',
      a: 'Judaism, Christianity and Islam',
      wrong: ['Hinduism, Buddhism and Sikhism', 'Buddhism, Christianity and Shinto', 'Hinduism, Islam and Taoism'],
      hint: 'They are sometimes called the Abrahamic religions.',
      why: 'Judaism, Christianity and Islam all began in the Middle East, which is why cities there are important to many people around the world.',
      lv: [2, 4],
    },
    {
      q: 'What is the climate of most of the Middle East?',
      a: 'Hot desert: very hot summers and very little rain',
      wrong: [{ label: 'Tropical rainforest: hot and wet all year', misconception: 'me-rainforest', feedback: 'Most of the region lies in the belt of sinking, dry air either side of the Tropic of Cancer, which gives desert conditions.' }, 'Tundra: cold all year', 'Temperate maritime, like the UK'],
      hint: 'Think about the latitude of the Arabian Peninsula.',
      why: 'Most of the region lies around the Tropic of Cancer, in the belt of sinking, dry air, so it has a hot desert climate.',
      lv: [1, 3],
    },
  ],
}

const meGenerators: ItemGenerator[] = [
  G('regions.middle-east.capitals', 'regions.middle-east', [2, 4], (rng) => {
    const c = rng.pick(ME_CAPITALS)
    const others = rng.shuffle(ME_CAPITALS.filter((x) => x !== c)).slice(0, c.trap ? 2 : 3)
    const wrong = [
      ...(c.trap ? [{ label: c.trap[0], misconception: 'big-city-not-capital', feedback: c.trap[1] }] : []),
      ...others.map((x) => ({ label: x.capital, misconception: 'other-capital', feedback: `${x.capital} is the capital of ${x.country}.` })),
    ]
    return choice({
      rng,
      prompt: `What is the capital city of ${c.country}?`,
      correct: c.capital,
      wrong,
      hint: 'The capital is where the national government is based, not always the most famous city.',
      explanation: `The capital of ${c.country} is ${c.capital}.${c.trap ? ` ${c.trap[1]}` : ''}`,
    })
  }),
]

export const regionsGenerators: ItemGenerator[] = [...bankGenerators(africa), ...bankGenerators(asia), ...bankGenerators(russia), ...bankGenerators(middleEast), ...meGenerators]
