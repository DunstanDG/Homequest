import type { ItemGenerator } from '@/engine/registry'
import { choice, textItem } from '../../kit'
import { bankGenerators, classifyGenerators, G, num, type Bank } from './factory'

// =====================================================================================================================
// Photosynthesis and plants: the equation, leaves and minerals, testing a leaf for starch, rate of photosynthesis
// =====================================================================================================================

const PHOTO_PARTS = [
  { word: 'carbon dioxide', accept: ['carbon dioxide'] },
  { word: 'water', accept: ['water'] },
  { word: 'glucose', accept: ['glucose'] },
  { word: 'oxygen', accept: ['oxygen'] },
]

const equation: Bank = {
  skill: 'bio.photo.equation',
  terms: [
    { term: 'Photosynthesis', def: 'The process in which plants use light energy to make glucose from carbon dioxide and water' },
    { term: 'Chlorophyll', def: 'The green substance in chloroplasts that absorbs light' },
    { term: 'Producer', def: 'An organism that makes its own food, such as a green plant' },
    { term: 'Glucose', def: 'The sugar made in photosynthesis' },
  ],
  links: [
    {
      prompt: 'Plants turn some of the glucose they make into other substances. Match each one to what it is used for.',
      pairs: [
        ['Used in respiration', 'To release energy for the plant\'s cells'],
        ['Turned into starch', 'To store energy, for example in potatoes'],
        ['Turned into cellulose', 'To build cell walls'],
        ['Turned into proteins (using nitrates)', 'For growth and repair'],
      ],
      hint: 'Cellulose is what cell walls are made of.',
      lv: [3, 5],
    },
  ],
  mcqs: [
    {
      q: 'Which is the word equation for photosynthesis?',
      a: 'carbon dioxide + water → glucose + oxygen',
      wrong: [
        { label: 'glucose + oxygen → carbon dioxide + water', misconception: 'respiration-equation', feedback: 'That is aerobic respiration: photosynthesis is the reverse.' },
        { label: 'oxygen + water → glucose + carbon dioxide', misconception: 'swapped-gases', feedback: 'Plants take in carbon dioxide and give out oxygen in photosynthesis.' },
        { label: 'carbon dioxide + glucose → water + oxygen', misconception: 'glucose-reactant', feedback: 'Glucose is made by photosynthesis, so it is a product.' },
      ],
      hint: 'Plants take in a gas from the air and water from the soil.',
      why: 'Photosynthesis: carbon dioxide + water → glucose + oxygen, using light energy absorbed by chlorophyll.',
      lv: [1, 3],
    },
    {
      q: 'In which part of a plant cell does photosynthesis take place?',
      a: 'The chloroplasts',
      wrong: [
        { label: 'The mitochondria', misconception: 'mito-photosynthesis', feedback: 'Mitochondria are where respiration happens.' },
        { label: 'The nucleus', misconception: 'nucleus-photosynthesis', feedback: 'The nucleus controls the cell.' },
        { label: 'The cell wall', misconception: 'wall-photosynthesis', feedback: 'The cell wall gives support.' },
      ],
      hint: 'Which part contains chlorophyll?',
      why: 'Photosynthesis happens in chloroplasts, which contain the green pigment chlorophyll that absorbs light.',
      lv: [1, 3],
    },
    {
      q: 'Where does a plant get most of the raw materials it uses to make glucose?',
      a: 'Carbon dioxide from the air and water from the soil',
      wrong: [
        { label: 'Food from the soil, taken in through the roots', misconception: 'food-from-soil', feedback: 'Plants make their own food. The soil gives water and minerals, not glucose.' },
        { label: 'Oxygen from the air and minerals from the soil', misconception: 'oxygen-raw-material', feedback: 'Oxygen is a product of photosynthesis, not a raw material.' },
        { label: 'Sunlight only', misconception: 'light-is-matter', feedback: 'Light provides the energy, but the glucose is built from carbon dioxide and water.' },
      ],
      hint: 'Look at the left-hand side of the word equation.',
      why: 'The glucose is built from carbon dioxide (taken in through the stomata) and water (taken up by the roots). Light provides the energy. The soil also provides small amounts of minerals.',
      lv: [3, 5],
    },
    {
      q: 'Why is photosynthesis important for animals as well as plants?',
      a: 'It makes the oxygen animals need, and plants are the start of almost every food chain',
      wrong: [
        { label: 'It removes oxygen from the air, which is poisonous to animals', misconception: 'oxygen-poisonous', feedback: 'Photosynthesis adds oxygen to the air, and animals need it.' },
        { label: 'It is not important for animals at all', misconception: 'animals-independent', feedback: 'Animals rely on plants for food and oxygen.' },
        { label: 'It makes carbon dioxide for animals to breathe in', misconception: 'co2-for-animals', feedback: 'Photosynthesis uses carbon dioxide and makes oxygen.' },
      ],
      hint: 'Think about what animals breathe and what they eat.',
      why: 'Photosynthesis releases oxygen, which animals use in respiration, and the glucose made by plants passes along food chains as food for animals.',
      lv: [2, 4],
    },
    {
      q: 'Which is the balanced symbol equation for photosynthesis?',
      a: '6CO_{2} + 6H_{2}O → C_{6}H_{12}O_{6} + 6O_{2}',
      wrong: [
        { label: 'CO_{2} + H_{2}O → C_{6}H_{12}O_{6} + O_{2}', misconception: 'unbalanced', feedback: 'That is not balanced: count the carbon atoms on each side.' },
        { label: 'C_{6}H_{12}O_{6} + 6O_{2} → 6CO_{2} + 6H_{2}O', misconception: 'respiration-symbol', feedback: 'That is aerobic respiration.' },
        { label: '6CO_{2} + 6O_{2} → C_{6}H_{12}O_{6} + 6H_{2}O', misconception: 'oxygen-reactant', feedback: 'Oxygen is made in photosynthesis; water is used.' },
      ],
      hint: 'Glucose is C_{6}H_{12}O_{6}. There must be 6 carbon atoms on each side.',
      why: 'Six molecules of carbon dioxide and six of water make one molecule of glucose and six of oxygen: 6CO_{2} + 6H_{2}O → C_{6}H_{12}O_{6} + 6O_{2}.',
      lv: [5, 5],
    },
  ],
}

const equationClassify = classifyGenerators('bio.photo.equation', {
  id: 'reactant-product',
  categories: ['Used up (a reactant)', 'Made (a product)'],
  items: [
    ['carbon dioxide', 'Used up (a reactant)'],
    ['water', 'Used up (a reactant)'],
    ['glucose', 'Made (a product)'],
    ['oxygen', 'Made (a product)'],
  ],
  ask: (item) => `In photosynthesis, is ${item} used up or made?`,
  hint: 'Reactants are on the left of the arrow; products are on the right.',
  means: {
    'Used up (a reactant)': 'Carbon dioxide and water are used up.',
    'Made (a product)': 'Glucose and oxygen are made.',
  },
  lv: [1, 3],
})

function equationGenerators(): ItemGenerator[] {
  return [
    G('bio.photo.equation.gap', 'bio.photo.equation', [2, 4], (rng) => {
      const i = rng.int(0, 3)
      const parts = PHOTO_PARTS.map((p, k) => (k === i ? '____' : p.word))
      return textItem({
        prompt: `Fill in the missing word in the equation for photosynthesis:\n${parts[0]} + ${parts[1]} → ${parts[2]} + ${parts[3]}`,
        accept: PHOTO_PARTS[i]!.accept,
        hint: i < 2 ? 'This is a raw material the plant takes in.' : 'This is something the plant makes.',
        explanation: 'carbon dioxide + water → glucose + oxygen (light energy is absorbed by chlorophyll).',
        placeholder: 'missing word',
      })
    }),
  ]
}

// ----------------------------------------------------------------------------------------------- leaves, roots, minerals

const leaves: Bank = {
  skill: 'bio.photo.leaves',
  noun: 'part of a leaf',
  meaningPrompt: (t) => `Which description matches the ${t.toLowerCase()} of a leaf?`,
  matchPrompt: 'Match each part of a leaf to its description.',
  terms: [
    { term: 'Waxy cuticle', def: 'A waterproof layer on the top surface that reduces water loss' },
    { term: 'Upper epidermis', def: 'A thin, transparent layer of cells near the top that lets light through' },
    { term: 'Palisade layer', def: 'Tall cells packed with chloroplasts, where most photosynthesis happens' },
    { term: 'Spongy layer', def: 'Loosely packed cells with air spaces between them, so gases can move through the leaf' },
    { term: 'Stomata', def: 'Tiny pores, mostly on the underside, that let gases in and out' },
    { term: 'Guard cells', def: 'Pairs of cells that open and close the pores on the underside' },
    { term: 'Xylem', def: 'Tubes that carry water and minerals up from the roots' },
    { term: 'Phloem', def: 'Tubes that carry dissolved sugars around the plant' },
  ],
  links: [
    {
      prompt: 'Match each mineral to the reason plants need it.',
      pairs: [
        ['Nitrates', 'To make proteins for healthy growth'],
        ['Phosphates', 'For healthy roots'],
        ['Potassium', 'For healthy leaves and flowers'],
        ['Magnesium', 'To make chlorophyll'],
      ],
      hint: 'Proteins contain nitrogen; chlorophyll contains magnesium.',
      ask: (l) => `Why do plants need ${l.toLowerCase()}?`,
      lv: [2, 4],
    },
  ],
  mcqs: [
    {
      q: 'Why are most leaves broad and flat?',
      a: 'To give a large surface area to absorb as much light as possible',
      wrong: [
        { label: 'To stop the plant falling over', misconception: 'leaf-balance', feedback: 'Leaf shape is about catching light.' },
        { label: 'To store water', misconception: 'leaf-water-store', feedback: 'Thin, flat leaves are not good for storing water.' },
        { label: 'So that animals cannot eat them', misconception: 'leaf-defence', feedback: 'Shape is mainly about catching light for photosynthesis.' },
      ],
      hint: 'What does a leaf need to catch for photosynthesis?',
      why: 'A broad, flat leaf has a large surface area to absorb light. Being thin also means gases have only a short distance to travel.',
      lv: [1, 3],
    },
    {
      q: 'How does carbon dioxide get into a leaf?',
      a: 'It diffuses in through the stomata',
      wrong: [
        { label: 'It is taken up by the roots and carried in the xylem', misconception: 'co2-roots', feedback: 'Roots take up water and minerals. Carbon dioxide comes from the air.' },
        { label: 'It is made by the chloroplasts', misconception: 'co2-made', feedback: 'Chloroplasts use carbon dioxide; they do not make it.' },
        { label: 'It soaks in through the waxy cuticle', misconception: 'co2-cuticle', feedback: 'The waxy cuticle is waterproof and gases mostly cannot get through it.' },
      ],
      hint: 'The leaf has tiny pores on its underside.',
      why: 'Carbon dioxide diffuses from the air into the leaf through the stomata, then through the air spaces in the spongy layer to the cells.',
      lv: [2, 4],
    },
    {
      q: 'How does water get from the soil to the leaves?',
      a: 'It is absorbed by root hair cells and carried up the stem in the xylem',
      wrong: [
        { label: 'It is absorbed through the stomata from the air', misconception: 'water-stomata', feedback: 'Water mainly leaves through the stomata; it is taken in by the roots.' },
        { label: 'It is carried in the phloem', misconception: 'water-phloem', feedback: 'Phloem carries sugars. Xylem carries water.' },
        { label: 'It is made in the leaves by photosynthesis', misconception: 'water-made', feedback: 'Photosynthesis uses water; it does not make it.' },
      ],
      hint: 'Which cells have a large surface area for absorbing water?',
      why: 'Root hair cells absorb water from the soil. It travels up through xylem vessels in the roots, stem and leaves.',
      lv: [2, 4],
    },
    {
      q: 'Why do farmers add fertilisers to their fields?',
      a: 'To replace minerals, such as nitrates, that crops have taken out of the soil',
      wrong: [
        { label: 'To give the plants glucose', misconception: 'fertiliser-food', feedback: 'Plants make their own glucose by photosynthesis.' },
        { label: 'To kill insects', misconception: 'fertiliser-pesticide', feedback: 'That is a pesticide (insecticide), not a fertiliser.' },
        { label: 'To add carbon dioxide to the soil', misconception: 'fertiliser-co2', feedback: 'Plants get carbon dioxide from the air.' },
      ],
      hint: 'Plants take something other than water out of the soil.',
      why: 'Crops take minerals from the soil, and when they are harvested those minerals are removed. Fertilisers put minerals such as nitrates, phosphates and potassium back.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Explain how a leaf is adapted for photosynthesis.',
      model: 'A leaf is broad and flat, giving a large surface area to absorb light. It is thin, so carbon dioxide only has a short distance to diffuse to the cells. The palisade cells near the top are packed with chloroplasts to absorb as much light as possible. Stomata on the underside let carbon dioxide in and oxygen out, and air spaces in the spongy layer let gases move through the leaf. Xylem brings water to the leaf.',
      checklist: ['Large surface area to absorb light', 'Thin, so a short distance for gases', 'Palisade cells with many chloroplasts', 'Stomata let carbon dioxide in (and oxygen out)', 'Xylem brings water'],
      hint: 'What does photosynthesis need? Explain how the leaf gets each one.',
      passMark: 3,
    },
  ],
}

// ----------------------------------------------------------------------------------------------- starch test

const REASON = {
  light: 'No light reached it, so it could not photosynthesise',
  chlorophyll: 'It has no chlorophyll, so it could not photosynthesise',
  co2: 'It had no carbon dioxide, so it could not photosynthesise',
  all: 'It had light, chlorophyll, carbon dioxide and water, so it photosynthesised and stored starch',
}
type Factor = keyof typeof REASON

interface Setup {
  setup: string
  part: string
  factor: Factor
}

/** The sentence that says which leaf was tested. */
const tested = (s: Setup) => (s.setup.includes('part of one leaf') ? 'That leaf was then tested with iodine solution' : 'One of its leaves was then tested with iodine solution')

const SETUPS: Setup[] = [
  { setup: 'A plant with variegated leaves (green and white) was left in sunlight for a day.', part: 'the green parts of the leaf', factor: 'all' },
  { setup: 'A plant with variegated leaves (green and white) was left in sunlight for a day.', part: 'the white parts of the leaf', factor: 'chlorophyll' },
  { setup: 'A destarched plant had part of one leaf covered with black paper on both sides, then was left in sunlight for a day.', part: 'the covered part of the leaf', factor: 'light' },
  { setup: 'A destarched plant had part of one leaf covered with black paper on both sides, then was left in sunlight for a day.', part: 'the uncovered part of the leaf', factor: 'all' },
  { setup: 'A plant was kept in a dark cupboard for two days.', part: 'the leaf', factor: 'light' },
  { setup: 'A destarched plant was sealed in a clear bag with a chemical that absorbs carbon dioxide, then left in sunlight for a day.', part: 'the leaf', factor: 'co2' },
  { setup: 'A plant was left on a sunny windowsill for a day.', part: 'the leaf', factor: 'all' },
]

const starchTest: Bank = {
  skill: 'bio.photo.starch-test',
  orders: [
    {
      prompt: 'Put these steps for testing a leaf for starch in order.',
      steps: [
        'Put the leaf in boiling water for about a minute',
        'Turn off the Bunsen burner, then put the leaf in a tube of ethanol standing in the hot water',
        'Wait until the leaf turns pale because the chlorophyll has been removed',
        'Rinse the leaf in water to soften it',
        'Spread the leaf on a white tile and add iodine solution',
      ],
      direction: ['first', 'last'],
      hint: 'The iodine goes on at the very end, once the green colour has gone.',
      why: 'Boiling water kills and softens the leaf; hot ethanol removes the chlorophyll (Bunsen off, because ethanol is flammable); rinsing softens it again; then iodine shows where starch is.',
      lv: [2, 5],
    },
  ],
  mcqs: [
    {
      q: 'Why is a leaf put in hot ethanol before testing it with iodine?',
      a: 'To remove the green chlorophyll, so the colour change is easy to see',
      wrong: [
        { label: 'To make starch in the leaf', misconception: 'ethanol-makes-starch', feedback: 'Ethanol does not make starch; photosynthesis does.' },
        { label: 'To turn the starch into glucose', misconception: 'ethanol-digests', feedback: 'Ethanol removes chlorophyll; it does not change the starch.' },
        { label: 'To kill any insects on the leaf', misconception: 'ethanol-insects', feedback: 'Its job is to remove the green colour.' },
      ],
      hint: 'What colour is the leaf before, and what colour is it after?',
      why: 'Ethanol dissolves the chlorophyll, turning the leaf pale. Otherwise the green colour would hide the blue-black colour of iodine with starch.',
      lv: [2, 4],
    },
    {
      q: 'Why must the Bunsen burner be turned off before the ethanol is used?',
      a: 'Ethanol is flammable and could catch fire',
      wrong: [
        { label: 'To save gas', misconception: 'save-gas', feedback: 'The reason is safety: ethanol catches fire easily.' },
        { label: 'Ethanol only works when it is cold', misconception: 'ethanol-cold', feedback: 'The ethanol is warmed in hot water; it must just be kept away from flames.' },
        { label: 'The flame would turn the leaf blue-black', misconception: 'flame-colour', feedback: 'Only iodine with starch gives the blue-black colour.' },
      ],
      hint: 'Look for the hazard symbol on a bottle of ethanol.',
      why: 'Ethanol is highly flammable. It is heated in a beaker of hot water with the flame turned off.',
      lv: [1, 3],
    },
    {
      q: 'Before some experiments, a plant is "destarched" by keeping it in the dark for a day or two. Why?',
      a: 'So the plant uses up its stored starch, and any starch found later must have been made during the experiment',
      wrong: [
        { label: 'So the plant makes extra starch in the dark', misconception: 'dark-makes-starch', feedback: 'Plants cannot photosynthesise in the dark.' },
        { label: 'To remove the chlorophyll from the leaves', misconception: 'dark-removes-chlorophyll', feedback: 'Ethanol removes chlorophyll during the test.' },
        { label: 'To kill the plant before testing it', misconception: 'dark-kills', feedback: 'A day or two in the dark does not kill a plant.' },
      ],
      hint: 'If the leaf already had starch at the start, could you tell whether new starch was made?',
      why: 'In the dark the plant cannot photosynthesise, so it uses up its starch store. Then any starch found at the end must have been made during the experiment.',
      lv: [3, 5],
    },
    {
      q: 'Why do we test a leaf for starch, rather than for glucose, to show it has photosynthesised?',
      a: 'Plants quickly turn the glucose they make into starch to store it',
      wrong: [
        { label: 'Leaves never contain glucose', misconception: 'no-glucose', feedback: 'Glucose is made in leaves, but much of it is quickly changed into starch.' },
        { label: 'Iodine can only be used on plants', misconception: 'iodine-plants', feedback: 'Iodine tests for starch in any food.' },
        { label: 'Starch is the gas made by photosynthesis', misconception: 'starch-gas', feedback: 'Oxygen is the gas made. Starch is a solid store of energy.' },
      ],
      hint: 'What happens to glucose that a plant does not need straight away?',
      why: 'Glucose made by photosynthesis is soon converted into starch for storage, so starch builds up in leaves that have been photosynthesising.',
      lv: [4, 5],
    },
  ],
}

function starchGenerators(): ItemGenerator[] {
  return [
    G('bio.photo.starch-test.predict', 'bio.photo.starch-test', [2, 5], (rng, d) => {
      const s = rng.pick(SETUPS)
      const starch = s.factor === 'all'
      if (d <= 3) {
        return choice({
          rng,
          prompt: `${s.setup} ${tested(s)}. What colour will ${s.part} turn?`,
          correct: starch ? 'Blue-black' : 'Orange-brown (it stays the colour of iodine)',
          wrong: [
            { label: starch ? 'Orange-brown (it stays the colour of iodine)' : 'Blue-black', misconception: starch ? 'missed-starch' : 'assumed-starch', feedback: REASON[s.factor] + '.' },
            { label: 'Brick-red', misconception: 'benedicts-colour', feedback: 'Brick-red is a positive Benedict\'s test for sugar, not iodine.' },
            { label: 'Purple', misconception: 'biuret-colour', feedback: 'Purple is a positive biuret test for protein.' },
          ],
          hint: 'Starch is only made where the plant could photosynthesise. Did this part have light, chlorophyll and carbon dioxide?',
          explanation: `${REASON[s.factor]}. So ${s.part} ${starch ? 'contains starch and turns blue-black' : 'has no starch and stays orange-brown'}.`,
        })
      }
      const wrongs = (Object.keys(REASON) as Factor[]).filter((f) => f !== s.factor)
      return choice({
        rng,
        prompt: `${s.setup} ${tested(s)}, and ${s.part} turned ${starch ? 'blue-black' : 'orange-brown'}. Which is the best explanation?`,
        correct: REASON[s.factor],
        wrong: wrongs.map((f) => ({ label: REASON[f], misconception: `reason-${f}`, feedback: 'That does not fit how this plant was treated. Re-read the set-up.' })),
        hint: 'Which of light, chlorophyll and carbon dioxide was missing (if any)?',
        explanation: `${REASON[s.factor]}. Starch is only made where photosynthesis can happen: it needs light, chlorophyll, carbon dioxide and water.`,
      })
    }),
  ]
}

// ----------------------------------------------------------------------------------------------- rate of photosynthesis

const rate: Bank = {
  skill: 'bio.photo.rate',
  mcqs: [
    {
      q: 'Pondweed gives off bubbles of gas in the light. Which gas is in the bubbles?',
      a: 'Mostly oxygen',
      wrong: [
        { label: 'Mostly carbon dioxide', misconception: 'bubbles-co2', feedback: 'Photosynthesis uses carbon dioxide and gives off oxygen.' },
        { label: 'Mostly water vapour', misconception: 'bubbles-water', feedback: 'The bubbles are a product of photosynthesis: oxygen.' },
        { label: 'Mostly nitrogen', misconception: 'bubbles-nitrogen', feedback: 'Nitrogen is not made by photosynthesis.' },
      ],
      hint: 'Which gas is a product of photosynthesis?',
      why: 'The bubbles are mostly oxygen made by photosynthesis. Counting them is a simple way to compare the rate of photosynthesis.',
      lv: [1, 3],
    },
    {
      q: 'Which change would increase the rate of photosynthesis of a pondweed plant?',
      a: 'Moving a lamp closer to it',
      wrong: [
        { label: 'Moving the lamp further away', misconception: 'further-faster', feedback: 'Further away means less light, so a slower rate.' },
        { label: 'Putting it in a dark cupboard', misconception: 'dark-faster', feedback: 'With no light there is no photosynthesis.' },
        { label: 'Removing the carbon dioxide from the water', misconception: 'less-co2', feedback: 'Carbon dioxide is a raw material; removing it slows photosynthesis.' },
      ],
      hint: 'What does photosynthesis need more of to go faster?',
      why: 'More light (a closer lamp), more carbon dioxide, or a warmer temperature (up to a point) increase the rate of photosynthesis.',
      lv: [1, 3],
    },
    {
      q: 'In the pondweed experiment, why is a beaker of water often put between the lamp and the pondweed?',
      a: 'To absorb heat from the lamp, so the temperature stays the same',
      wrong: [
        { label: 'To make the light brighter', misconception: 'water-brighter', feedback: 'The water is there to stop the lamp warming the pondweed.' },
        { label: 'To give the pondweed extra water', misconception: 'water-for-plant', feedback: 'The pondweed is already in water.' },
        { label: 'To provide carbon dioxide', misconception: 'water-co2', feedback: 'It is a heat shield, so temperature is a control variable.' },
      ],
      hint: 'Lamps get hot. Temperature affects the rate too.',
      why: 'The lamp gives off heat as well as light. The water absorbs the heat, so temperature stays constant and only light intensity changes: a fair test.',
      lv: [3, 5],
    },
    {
      q: 'As light intensity increases, the rate of photosynthesis increases at first, then levels off. Why does it level off?',
      a: 'Something else, such as the amount of carbon dioxide or the temperature, is now limiting the rate',
      wrong: [
        { label: 'The plant has run out of chlorophyll', misconception: 'chlorophyll-runs-out', feedback: 'Chlorophyll is not used up.' },
        { label: 'Too much light kills the plant straight away', misconception: 'light-kills', feedback: 'The rate levels off; it does not drop to zero.' },
        { label: 'The plant starts to respire instead of photosynthesising', misconception: 'respire-instead', feedback: 'Plants respire all the time; that is not why the rate levels off.' },
      ],
      hint: 'Photosynthesis needs several things. If you give more of one, what stops it going even faster?',
      why: 'Once there is plenty of light, another factor such as carbon dioxide concentration or temperature becomes the one holding the rate back. This is called a limiting factor.',
      lv: [4, 5],
    },
    {
      q: 'Some greenhouse growers burn paraffin heaters in their greenhouses in winter. How does this help the plants grow faster?',
      a: 'The heaters warm the air and also release carbon dioxide, both of which can speed up photosynthesis',
      wrong: [
        { label: 'The heaters give off oxygen for the plants', misconception: 'heater-oxygen', feedback: 'Burning uses oxygen and releases carbon dioxide.' },
        { label: 'The smoke kills all the plants\' cells', misconception: 'smoke-kills', feedback: 'That would not help them grow.' },
        { label: 'The light from the flames is the plants\' main source of light', misconception: 'flame-light', feedback: 'The flames give very little light compared with the Sun or lamps.' },
      ],
      hint: 'What does burning a fuel produce, apart from heat?',
      why: 'Burning paraffin releases heat and carbon dioxide. Warmth and extra carbon dioxide can both increase the rate of photosynthesis, so crops grow faster.',
      lv: [4, 5],
    },
  ],
  written: [
    {
      prompt: 'Describe how you could use pondweed to investigate how light intensity affects the rate of photosynthesis. Include how you would make it a fair test.',
      model: 'Put a piece of pondweed in a test tube of water and place a lamp at a set distance, for example 10 cm. Leave it a few minutes to adjust, then count the bubbles given off in one minute. Repeat at different distances (20 cm, 30 cm, 40 cm), doing three counts at each distance and calculating a mean. Keep the same piece of pondweed, the same temperature (using a beaker of water as a heat shield) and the same amount of carbon dioxide in the water.',
      checklist: ['Changes the distance of the lamp (independent variable)', 'Counts bubbles in a fixed time (dependent variable)', 'Names at least two control variables', 'Repeats and calculates a mean'],
      hint: 'Say what you change, what you measure, and what you keep the same.',
    },
  ],
}

const RATE_DISTANCES = [10, 20, 30, 40]

function rateGenerators(): ItemGenerator[] {
  return [
    G('bio.photo.rate.bubbles', 'bio.photo.rate', [2, 4], (rng, d) => {
      const mins = rng.pick(d <= 2 ? [2, 5] : [3, 4, 5])
      const perMin = rng.int(4, 30)
      const total = perMin * mins
      return num({
        prompt: `A piece of pondweed gave off ${total} bubbles in ${mins} minutes. What was the rate in bubbles per minute?`,
        answer: perMin,
        suffix: 'bubbles per minute',
        hint: 'Rate = number of bubbles ÷ time in minutes.',
        explanation: `${total} ÷ ${mins} = ${perMin} bubbles per minute.`,
        errors: [{ values: [total * mins], tag: 'multiplied', message: 'Divide the number of bubbles by the time.' }],
      })
    }),
    G('bio.photo.rate.trend', 'bio.photo.rate', [2, 4], (rng) => {
      const start = rng.int(36, 60)
      const drops = [rng.int(10, 14), rng.int(6, 9), rng.int(3, 5)]
      const values = [start, start - drops[0]!, start - drops[0]! - drops[1]!, start - drops[0]! - drops[1]! - drops[2]!]
      return choice({
        rng,
        prompt: 'Maya put a lamp at different distances from some pondweed and counted the bubbles given off in one minute. What do her results show?',
        figure: { type: 'table', head: ['Distance of lamp (cm)', 'Bubbles per minute'], rows: RATE_DISTANCES.map((x, i) => [String(x), String(values[i])]) },
        correct: 'The closer the lamp, the faster the rate of photosynthesis, because the light is more intense',
        wrong: [
          { label: 'The further away the lamp, the faster the rate of photosynthesis', misconception: 'further-faster', feedback: 'Check the table: the bubble count goes down as the distance goes up.' },
          { label: 'The distance of the lamp makes no difference', misconception: 'no-effect', feedback: 'The number of bubbles changes a lot with distance.' },
          { label: 'The closer the lamp, the faster the rate, because the plant needs less carbon dioxide', misconception: 'wrong-reason', feedback: 'The pattern is right, but the reason is wrong: a closer lamp gives more light.' },
        ],
        hint: 'Read down the table. What happens to the bubbles as the distance increases?',
        explanation: `At 10 cm there were ${values[0]} bubbles per minute; at 40 cm only ${values[3]}. A closer lamp gives brighter (more intense) light, so photosynthesis is faster.`,
      })
    }),
  ]
}

export const plantsGenerators: ItemGenerator[] = [
  ...bankGenerators(equation),
  ...equationClassify,
  ...equationGenerators(),
  ...bankGenerators(leaves),
  ...bankGenerators(starchTest),
  ...starchGenerators(),
  ...bankGenerators(rate),
  ...rateGenerators(),
]
