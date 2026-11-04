import type { ItemGenerator } from '@/engine/registry'
import { orderItem } from '../kit'
import { bankGenerators, G, type Bank } from './factory'

// =====================================================================================================================
// Ecosystems
// =====================================================================================================================

const ecosystems: Bank = {
  skill: 'biomes.ecosystems',
  terms: [
    { term: 'Ecosystem', def: 'A community of plants and animals and the non-living environment they live in, all linked together' },
    { term: 'Producer', def: 'A living thing, usually a green plant, that makes its own food using energy from sunlight' },
    { term: 'Consumer', def: 'An animal that gets its energy by eating other living things' },
    { term: 'Decomposer', def: 'An organism such as a fungus or bacterium that breaks down dead material, returning nutrients to the soil' },
    { term: 'Food web', def: 'A diagram showing many linked feeding relationships in an ecosystem' },
    { term: 'Abiotic', def: 'Describes the non-living parts of an ecosystem, such as climate, soil and water' },
    { term: 'Biotic', def: 'Describes the living parts of an ecosystem, such as plants, animals and fungi' },
    { term: 'Nutrient cycle', def: 'The movement of nutrients between living things, the soil and the leaf litter' },
  ],
  mcqs: [
    {
      q: 'In a pond, the number of small fish suddenly falls because of disease. What is most likely to happen to the water fleas they eat?',
      a: 'The number of water fleas increases, because fewer are being eaten',
      wrong: [
        { label: 'The number of water fleas decreases too', misconception: 'food-web-direction', feedback: 'The fish eat the fleas. With fewer fish, fewer fleas are eaten, so their numbers rise (at least at first).' },
        'Nothing happens to the water fleas',
        'The water fleas start eating the herons',
      ],
      hint: 'Fish eat water fleas. What happens to the prey when there are fewer predators?',
      why: 'Every part of a food web is linked. Fewer predators means fewer prey are eaten, so the prey population rises, which may then reduce the algae they feed on.',
      lv: [3, 5],
    },
    {
      q: 'Which of these is an ABIOTIC part of an ecosystem?',
      a: 'The amount of rainfall',
      wrong: [{ label: 'The fungi on a fallen log', misconception: 'biotic-abiotic', feedback: 'Fungi are living, so they are biotic.' }, { label: 'The trees in a wood', misconception: 'biotic-abiotic', feedback: 'Trees are living: biotic.' }, { label: 'Earthworms in the soil', misconception: 'biotic-abiotic', feedback: 'Earthworms are living: biotic.' }],
      hint: 'Abiotic means "not living".',
      why: 'Abiotic factors are the non-living parts: rainfall, temperature, sunlight, soil and water. Biotic factors are the living things.',
      lv: [1, 3],
    },
    {
      q: 'Where does almost all the energy in a food chain come from in the first place?',
      a: 'The Sun',
      wrong: [{ label: 'The soil', misconception: 'energy-soil', feedback: 'Plants take water and nutrients from the soil, but their energy comes from sunlight.' }, 'The top predator', 'Rain'],
      hint: 'What do producers need to make their food?',
      why: 'Producers capture energy from sunlight by photosynthesis. Consumers get that energy by eating producers or other consumers.',
      lv: [1, 2],
    },
  ],
}

/** Food chains, in order of energy flow (producer first). */
const CHAINS: { place: string; chain: string[] }[] = [
  { place: 'a UK pond', chain: ['Algae', 'Water flea', 'Small fish', 'Heron'] },
  { place: 'a UK woodland', chain: ['Oak leaves', 'Caterpillar', 'Blue tit', 'Sparrowhawk'] },
  { place: 'the savanna', chain: ['Grass', 'Zebra', 'Lion'] },
  { place: 'the Southern Ocean', chain: ['Phytoplankton', 'Krill', 'Penguin', 'Leopard seal'] },
  { place: 'a UK hedgerow', chain: ['Grass seeds', 'Field mouse', 'Barn owl'] },
  { place: 'the tundra', chain: ['Lichen', 'Caribou', 'Wolf'] },
]

const chainGenerators: ItemGenerator[] = [
  G('biomes.ecosystems.chain', 'biomes.ecosystems', [2, 4], (rng) => {
    const c = rng.pick(CHAINS)
    return orderItem({
      rng,
      prompt: `Put this food chain from ${c.place} in order, starting with the producer.`,
      correct: c.chain,
      direction: ['producer', 'top consumer'],
      hint: 'The producer is the plant (or plant-like) living thing. Each arrow points to the animal that eats it.',
      explanation: `${c.chain.join(' → ')}. Energy passes from the producer (${c.chain[0]?.toLowerCase()}) to each consumer in turn.`,
    })
  }),
]

// =====================================================================================================================
// Global biomes
// =====================================================================================================================

const world: Bank = {
  skill: 'biomes.world',
  links: [
    {
      prompt: 'Match each biome to where it is found.',
      pairs: [
        ['Tropical rainforest', 'Along the Equator, for example the Amazon Basin'],
        ['Hot desert', 'Around the tropics, about 15-30° from the Equator, for example the Sahara'],
        ['Savanna grassland', 'Between rainforests and hot deserts, for example much of East Africa'],
        ['Tundra', 'Around and north of the Arctic Circle, for example northern Alaska'],
        ['Temperate deciduous forest', 'Mid-latitudes with mild climates, for example much of the UK'],
        ['Taiga (boreal forest)', 'A wide belt south of the tundra, for example much of Siberia'],
      ],
      hint: 'Biomes form rough bands parallel to the Equator, because climate changes with latitude.',
      ask: (l) => `Where is this biome found: ${l.toLowerCase()}?`,
      lv: [2, 4],
    },
    {
      prompt: 'Match each biome to its climate.',
      pairs: [
        ['Tropical rainforest', 'Hot (about 27°C) and wet all year'],
        ['Hot desert', 'Very hot days, cold nights, and less than 250 mm of rain a year'],
        ['Savanna grassland', 'Hot all year, with one wet season and one long dry season'],
        ['Tundra', 'Long, very cold winters, short cool summers and little precipitation'],
        ['Temperate deciduous forest', 'Mild summers, cool winters and rain spread through the year'],
      ],
      hint: 'Two clues: how hot, and how much rain (and when).',
      ask: (l) => `What is the climate of this biome: ${l.toLowerCase()}?`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'What is a biome?',
      a: 'A very large ecosystem, such as a tropical rainforest, spread over a large area of the world',
      wrong: [{ label: 'A single pond or hedgerow', misconception: 'biome-small', feedback: 'That is a small-scale ecosystem. A biome is global in scale.' }, 'A type of rock', 'Another name for a food chain'],
      hint: 'Think of a scale much bigger than a pond.',
      why: 'A biome is a global-scale ecosystem with a similar climate, plants and animals wherever it occurs, such as tropical rainforest or tundra.',
      lv: [1, 2],
    },
    {
      q: 'What mainly controls where the world\'s biomes are found?',
      a: 'Climate, especially temperature and rainfall',
      wrong: [{ label: 'The number of people living there', misconception: 'people-biomes', feedback: 'People change biomes, but climate decides which biome would naturally be there.' }, 'The type of rock only', 'How far a place is from London'],
      hint: 'Plants need the right amount of warmth and water.',
      why: 'Temperature and rainfall decide which plants can grow, and plants decide which animals can live there. Because climate changes with latitude, biomes form rough bands.',
      lv: [2, 3],
    },
    {
      q: 'Why are many hot deserts found around 30° north and south of the Equator?',
      a: 'Air sinks there, creating high pressure, so clouds and rain rarely form',
      wrong: [
        { label: 'They are the closest places to the Sun', misconception: 'closer-to-sun', feedback: 'Distance from the Sun is not the reason. The global pattern of sinking air is.' },
        { label: 'Air rises there, so it is too windy to rain', misconception: 'rising-air-dry', feedback: 'Rising air makes clouds and rain. Deserts form where air is sinking.' },
        'There are no oceans at that latitude',
      ],
      hint: 'Rain needs rising air. What is the air doing at 30°?',
      why: 'Air rises at the Equator (giving rainforest rain), moves away from it high up, and sinks around 30° N and S. Sinking air warms and stays dry, so deserts form there.',
      lv: [4, 5],
    },
  ],
}

// =====================================================================================================================
// Tropical rainforest
// =====================================================================================================================

const rainforest: Bank = {
  skill: 'biomes.rainforest',
  noun: 'feature',
  terms: [
    { term: 'Emergent layer', def: 'The tallest trees, up to about 50 m high, which stick out above the rest of the forest' },
    { term: 'Canopy', def: 'A dense, almost continuous layer of treetops that blocks out most of the light' },
    { term: 'Buttress roots', def: 'Large ridges of root above the ground that support tall trees growing in shallow soil' },
    { term: 'Drip tips', def: 'Pointed tips on leaves that let heavy rain run off quickly' },
    { term: 'Lianas', def: 'Woody vines rooted in the ground that climb up trees to reach the light' },
    { term: 'Epiphytes', def: 'Plants that grow on the branches of trees to reach the light, taking water and nutrients from the air and rain' },
    { term: 'Biodiversity', def: 'The variety of different living things in an area' },
  ],
  orders: [
    {
      prompt: 'Put the layers of a tropical rainforest in order from the top down.',
      steps: ['Emergent layer', 'Canopy', 'Under canopy', 'Shrub layer', 'Forest floor'],
      direction: ['top', 'bottom'],
      hint: 'A few giant trees poke out above a continuous "roof" of treetops.',
      why: 'Emergents (up to about 50 m), then the dense canopy, then the under canopy of younger trees, the shrub layer, and the dark forest floor.',
      lv: [2, 4],
    },
  ],
  mcqs: [
    {
      q: 'Why is rainforest soil poor in nutrients even though the forest is so lush?',
      a: 'Nutrients are recycled so quickly that most are stored in the plants, and heavy rain washes the rest out of the soil',
      wrong: [
        { label: 'Rainforest soil is always rich and fertile', misconception: 'fertile-soil', feedback: 'It looks that way, but the soil is thin and poor: the nutrients are in the living plants.' },
        'There are no decomposers in the rainforest',
        'The soil is frozen for most of the year',
      ],
      hint: 'Hot, wet conditions mean dead leaves rot very fast. Where do the nutrients go?',
      why: 'Fallen leaves decompose in weeks in the hot, damp conditions; plants take up the nutrients quickly, and heavy rain leaches the rest away. If the forest is cleared, the soil soon becomes infertile.',
      lv: [4, 5],
    },
    {
      q: 'Which describes the climate of a tropical rainforest?',
      a: 'Hot (about 27°C) all year, with over 2,000 mm of rain a year',
      wrong: [{ label: 'Hot summers, cold winters and little rain', misconception: 'seasonal', feedback: 'There are no real seasons: it is hot and wet all year round.' }, 'Mild, with snow in winter', 'Hot, with a long dry season of six months'],
      hint: 'Rainforests lie on the Equator.',
      why: 'On the Equator the Sun is high all year, so temperatures stay around 27°C, and convectional rain falls most afternoons, giving over 2,000 mm a year.',
      lv: [1, 3],
    },
    {
      q: 'How is the sloth adapted to life in the rainforest?',
      a: 'It moves slowly and algae grows in its fur, helping it stay camouflaged in the trees',
      wrong: ['It has a hump that stores fat', { label: 'It has thick white fur to keep warm', misconception: 'wrong-biome', feedback: 'That would suit the Arctic, not the hot rainforest.' }, 'It has large ears to lose heat in the desert'],
      hint: 'Sloths spend almost all their lives hanging in the canopy.',
      why: 'Sloths move slowly to save energy and are hard for predators like harpy eagles to spot, helped by the greenish algae in their fur.',
      lv: [2, 4],
    },
  ],
  written: [
    {
      prompt: 'Explain how plants in the tropical rainforest are adapted to the climate and to the lack of light.',
      model: 'Many leaves have drip tips so that the heavy daily rain runs off quickly and does not damage the leaf. Tall emergent trees have buttress roots to support them, because the soil is shallow. In the dark lower layers, lianas climb up the trees to reach the light, and epiphytes grow high on branches, collecting water from the rain and air. This means plants can survive both the heavy rain and the competition for sunlight.',
      checklist: ['Names at least two plant adaptations', 'Explains how one adaptation helps with heavy rain', 'Explains how one adaptation helps plants reach the light', 'Links an adaptation to shallow soil or tall height'],
      hint: 'Two problems: very heavy rain, and very little light below the canopy.',
    },
  ],
}

// =====================================================================================================================
// Hot deserts
// =====================================================================================================================

const desert: Bank = {
  skill: 'biomes.desert',
  links: [
    {
      prompt: 'Match each desert adaptation to how it helps.',
      pairs: [
        ['A cactus\'s thick, fleshy stem', 'Stores water for long dry spells'],
        ['Spines instead of leaves', 'Reduce water loss and protect the plant from animals'],
        ['Very long roots', 'Reach water deep underground'],
        ['A camel\'s hump', 'Stores fat that can be used for energy'],
        ['A camel\'s long eyelashes', 'Keep blowing sand out of its eyes'],
        ['A fennec fox\'s large ears', 'Give off heat to keep it cool'],
        ['Being active only at night (nocturnal)', 'Avoids the hottest part of the day'],
      ],
      hint: 'The two big problems in a hot desert are heat and lack of water.',
      ask: (l) => `How does this adaptation help in a hot desert: ${l.charAt(0).toLowerCase() + l.slice(1)}?`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'What is the usual definition of a desert?',
      a: 'An area that receives less than 250 mm of precipitation a year',
      wrong: [{ label: 'Any area that is hot all year', misconception: 'desert-hot', feedback: 'Deserts are defined by low rainfall, not heat. Antarctica is a cold desert.' }, 'Any area covered by sand dunes', 'An area with no plants or animals at all'],
      hint: 'It is about water, not temperature.',
      why: 'A desert gets less than 250 mm of precipitation a year. Many hot deserts are rocky rather than sandy, and they do have plants and animals.',
      lv: [1, 3],
    },
    {
      q: 'Why do hot deserts get very cold at night?',
      a: 'There are few clouds, so heat escapes quickly into space after sunset',
      wrong: [{ label: 'The Sun moves further away at night', misconception: 'sun-distance', feedback: 'At night the Sun has set; the cold comes from heat escaping through clear skies.' }, 'Cold winds blow from the poles every night', 'The sand releases cold air'],
      hint: 'Clouds act like a blanket.',
      why: 'With almost no cloud cover, the ground heats quickly in the day and loses heat quickly at night, so the daily temperature range can be over 20°C.',
      lv: [2, 4],
    },
    {
      q: 'What is the world\'s largest hot desert?',
      a: 'The Sahara',
      wrong: [{ label: 'The Gobi', misconception: 'gobi-hot', feedback: 'The Gobi in Asia is a cold desert, with freezing winters.' }, 'The Kalahari', 'The Atacama'],
      hint: 'It covers much of North Africa.',
      why: 'The Sahara covers much of North Africa and is the largest hot desert. (Antarctica is the largest desert of all, but it is a cold desert.)',
      lv: [1, 3],
    },
    {
      q: 'Some desert plants have seeds that lie dormant for years, then grow, flower and set seed within a few weeks after rain. Why?',
      a: 'To complete their whole life cycle while water is briefly available',
      wrong: [{ label: 'Because the seeds are dead until it rains', misconception: 'dormant-dead', feedback: 'Dormant seeds are alive but inactive, waiting for the right conditions.' }, 'To avoid being eaten by camels', 'Because they only need sunlight, never water'],
      hint: 'Rain in the desert is rare and does not last.',
      why: 'These short-lived plants make the most of rare rainfall, quickly flowering and producing seeds that can survive the long dry period that follows.',
      lv: [4, 5],
    },
  ],
}

// =====================================================================================================================
// Savanna
// =====================================================================================================================

const savanna: Bank = {
  skill: 'biomes.savanna',
  links: [
    {
      prompt: 'Match each savanna plant or animal adaptation to how it helps.',
      pairs: [
        ['The baobab tree\'s thick trunk', 'Stores water through the dry season'],
        ['The acacia\'s thorns', 'Protect it from being eaten by grazing animals'],
        ['The acacia\'s long tap root', 'Reaches water deep underground'],
        ['Grasses that grow fast after rain', 'Make use of the wet season, then die back and survive the drought'],
        ['Herds of wildebeest migrating', 'Follow the rains to find fresh grass and water'],
        ['A giraffe\'s long neck', 'Reaches leaves high in trees that other animals cannot'],
      ],
      hint: 'The big challenge is the long dry season.',
      ask: (l) => `How does this adaptation help in the savanna: ${l.charAt(0).toLowerCase() + l.slice(1)}?`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'What is the main feature of the savanna\'s climate?',
      a: 'It is hot all year, with a wet season and a long dry season',
      wrong: [{ label: 'It is wet and hot every month of the year', misconception: 'savanna-rainforest', feedback: 'That is the tropical rainforest. The savanna has a long dry season.' }, 'It has four seasons like the UK', 'It is cold all year with little rain'],
      hint: 'The grass turns green and then golden-brown during the year.',
      why: 'Savannas are hot all year but have a wet season (when the grasses grow quickly) and a long dry season (when they turn brown and fires are common).',
      lv: [1, 3],
    },
    {
      q: 'Where is the savanna found in relation to other biomes?',
      a: 'Between the tropical rainforest and the hot desert',
      wrong: ['Between the tundra and the taiga', { label: 'Right on the Equator', misconception: 'savanna-equator', feedback: 'The Equator itself is mostly rainforest. Savanna lies a little further from it.' }, 'Only on high mountains'],
      hint: 'It gets less rain than the rainforest but more than the desert.',
      why: 'The savanna is a transition zone: drier than the rainforest towards the Equator, and wetter than the desert further out.',
      lv: [2, 4],
    },
    {
      q: 'Why are fires common in the savanna, and why do many plants survive them?',
      a: 'The grass becomes very dry in the dry season; many plants have thick bark or roots that survive underground and regrow',
      wrong: [{ label: 'Lightning only strikes in the savanna', misconception: 'lightning', feedback: 'Lightning strikes everywhere. The dry grass is what makes fire spread.' }, 'People start every fire on purpose', 'The plants are not alive during the dry season'],
      hint: 'Think about the state of the grass at the end of the dry season.',
      why: 'Dry grass burns easily. Savanna plants are adapted with fire-resistant bark (like the baobab) and roots that survive below ground, so they regrow after the fire.',
      lv: [4, 5],
    },
  ],
}

// =====================================================================================================================
// Temperate deciduous forest
// =====================================================================================================================

const deciduous: Bank = {
  skill: 'biomes.deciduous',
  orders: [
    {
      prompt: 'Put the layers of a temperate deciduous forest in order from the top down.',
      steps: ['Canopy (oak, ash, beech)', 'Sub-canopy (younger trees such as holly)', 'Shrub layer (bramble, hazel)', 'Ground (herb) layer (bluebells, ferns)'],
      direction: ['top', 'bottom'],
      hint: 'The tallest trees form the top layer; flowers and ferns are at the bottom.',
      why: 'The canopy of tall trees is at the top, then the sub-canopy, the shrub layer and the ground layer of flowers, grasses and ferns.',
      lv: [2, 4],
    },
  ],
  links: [
    {
      prompt: 'Match each adaptation in a deciduous woodland to how it helps.',
      pairs: [
        ['Trees losing their leaves in autumn', 'Saves water and energy through the cold winter'],
        ['Bluebells flowering in early spring', 'Get light before the canopy leaves grow and shade them'],
        ['Hedgehogs hibernating', 'Survive the winter when food is scarce'],
        ['Squirrels burying nuts in autumn', 'Store food to eat during the winter'],
        ['Some birds migrating south in autumn', 'Find warmer places with more food in winter'],
      ],
      hint: 'The challenge is the change of seasons, especially cold winters with less light.',
      ask: (l) => `How does this help plants or animals in a deciduous forest: ${l.charAt(0).toLowerCase() + l.slice(1)}?`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'What does "deciduous" mean?',
      a: 'Trees that lose their leaves every autumn',
      wrong: [{ label: 'Trees that keep their leaves all year', misconception: 'deciduous-evergreen', feedback: 'Those are evergreen trees, like holly or pine.' }, 'Trees with needles instead of leaves', 'Trees that only grow in the tropics'],
      hint: 'Think of an oak tree in winter.',
      why: 'Deciduous trees, such as oak, ash and beech, drop their leaves in autumn and grow new ones in spring.',
      lv: [1, 2],
    },
    {
      q: 'Which describes the climate of temperate deciduous forests, like those in the UK?',
      a: 'Four seasons, mild summers, cool winters and rain all year',
      wrong: [{ label: 'Hot and wet every day of the year', misconception: 'rainforest-climate', feedback: 'That is the tropical rainforest climate.' }, 'Very dry, with less than 250 mm of rain a year', 'Below freezing for most of the year'],
      hint: 'Think about the weather in the UK through a year.',
      why: 'Temperate deciduous forests have four distinct seasons, mild temperatures (rarely extreme) and rain spread through the year.',
      lv: [2, 3],
    },
    {
      q: 'Why does a deciduous forest have a thicker ground layer of plants than a tropical rainforest?',
      a: 'More light reaches the ground, especially in spring before the trees are in full leaf',
      wrong: [{ label: 'The soil is frozen, so only small plants grow', misconception: 'frozen-soil', feedback: 'UK woodland soil is not frozen. The difference is light.' }, 'There is more rain in a deciduous forest', 'There are no animals to eat the ground plants'],
      hint: 'Compare how much light gets through each canopy, and when.',
      why: 'The rainforest canopy blocks most light all year. In deciduous forests the canopy is more open, and before the leaves come out in spring the ground layer gets plenty of light.',
      lv: [4, 5],
    },
  ],
}

// =====================================================================================================================
// Tundra and polar
// =====================================================================================================================

const tundra: Bank = {
  skill: 'biomes.tundra',
  terms: [
    { term: 'Permafrost', def: 'Ground that stays frozen all year round, for at least two years in a row' },
    { term: 'Active layer', def: 'The top layer of soil above the permanently frozen ground, which thaws in summer' },
    { term: 'Tundra', def: 'A cold, treeless biome near the Arctic with low-growing plants such as mosses and lichens' },
    { term: 'Polar region', def: 'The area around the North or South Pole, covered by ice for most or all of the year' },
    { term: 'Lichen', def: 'A tough organism made of a fungus and an alga living together, able to grow on bare rock' },
  ],
  links: [
    {
      prompt: 'Match each cold-environment adaptation to how it helps.',
      pairs: [
        ['Plants growing low to the ground', 'Shelters them from strong, cold winds'],
        ['Plants with shallow roots', 'Cope with the frozen ground just below the surface'],
        ['An Arctic fox\'s small ears', 'Lose less heat'],
        ['An Arctic fox\'s fur turning white in winter', 'Camouflage against the snow'],
        ['Caribou migrating south in winter', 'Find food when the tundra is frozen'],
        ['A thick layer of fat (blubber)', 'Insulates the body against the cold'],
      ],
      hint: 'The challenges are cold, wind, frozen ground and a short growing season.',
      ask: (l) => `How does this help in the tundra: ${l.charAt(0).toLowerCase() + l.slice(1)}?`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'Why are there almost no trees in the tundra?',
      a: 'The growing season is very short, and permafrost stops deep roots growing',
      wrong: [{ label: 'There is too much rain', misconception: 'tundra-wet', feedback: 'The tundra gets little precipitation. Cold and frozen ground are the problems.' }, 'People have cut them all down', 'The soil is too hot'],
      hint: 'Think about what is under the surface.',
      why: 'Summers are short and cool, and the ground just below the surface is frozen solid, so trees cannot root deeply. Plants are low mosses, lichens, grasses and dwarf shrubs.',
      lv: [2, 4],
    },
    {
      q: 'Why is thawing permafrost a worry for climate change?',
      a: 'It releases greenhouse gases such as methane that were locked in the frozen ground',
      wrong: [{ label: 'It makes the tundra colder', misconception: 'thaw-cold', feedback: 'Thawing is caused by warming, and it releases gases that add to the warming.' }, 'It stops the Sun reaching the ground', 'It has no effect on the atmosphere'],
      hint: 'Dead plants have been frozen in the ground for thousands of years.',
      why: 'Permafrost holds the remains of plants that never rotted. When it thaws, they decompose, releasing carbon dioxide and methane, which add to global warming: a positive feedback.',
      lv: [4, 5],
    },
    {
      q: 'The tundra is sometimes called a "cold desert". Why?',
      a: 'It receives very little precipitation, often less than 250 mm a year',
      wrong: [{ label: 'It is covered in sand dunes', misconception: 'desert-sand', feedback: 'Deserts are defined by low precipitation, not sand.' }, 'Nothing lives there', 'It is next to the Sahara'],
      hint: 'What defines a desert?',
      why: 'Like hot deserts, the tundra gets very little precipitation, because cold air holds little moisture.',
      lv: [3, 5],
    },
  ],
}

export const biomesGenerators: ItemGenerator[] = [
  ...bankGenerators(ecosystems),
  ...chainGenerators,
  ...bankGenerators(world),
  ...bankGenerators(rainforest),
  ...bankGenerators(desert),
  ...bankGenerators(savanna),
  ...bankGenerators(deciduous),
  ...bankGenerators(tundra),
]
