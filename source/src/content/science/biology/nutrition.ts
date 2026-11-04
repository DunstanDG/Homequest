import type { ItemGenerator } from '@/engine/registry'
import type { Rng } from '@/engine/types'
import { choice } from '../../kit'
import { bankGenerators, classifyGenerators, G, fmt, lower, num, type Bank } from './factory'

// =====================================================================================================================
// Nutrition and digestion: nutrients, food tests, balanced diet, digestive system, enzymes
// =====================================================================================================================

const foodGroups: Bank = {
  skill: 'bio.nutrition.food-groups',
  noun: 'nutrient',
  meaningPrompt: (t) => `What is the main job of ${t.toLowerCase()} in the diet?`,
  matchPrompt: 'Match each nutrient to its main job in the diet.',
  terms: [
    { term: 'Carbohydrates', def: 'The body\'s main source of energy' },
    { term: 'Lipids (fats and oils)', def: 'A store of energy, and a layer of insulation that helps keep the body warm' },
    { term: 'Protein', def: 'Needed for growth and to repair cells and tissues' },
    { term: 'Vitamins', def: 'Needed in small amounts to keep healthy, for example vitamin C for healthy skin and gums' },
    { term: 'Minerals', def: 'Needed in small amounts to keep healthy, for example calcium for strong bones and teeth' },
    { term: 'Fibre', def: 'Not digested, but keeps food moving through the gut and helps prevent constipation' },
    { term: 'Water', def: 'Needed by every cell for chemical reactions, and to replace what is lost in sweat and urine' },
  ],
  mcqs: [
    {
      q: 'Which of these foods is a good source of vitamin C?',
      a: 'Oranges',
      wrong: [
        { label: 'Butter', misconception: 'vitc-butter', feedback: 'Butter is mainly fat.' },
        { label: 'White rice', misconception: 'vitc-rice', feedback: 'Rice is mainly carbohydrate (starch).' },
        { label: 'Cooking oil', misconception: 'vitc-oil', feedback: 'Oil is pure fat.' },
      ],
      hint: 'Citrus fruits are famous for it.',
      why: 'Fresh fruit and vegetables, especially citrus fruits like oranges, are good sources of vitamin C.',
      lv: [1, 3],
    },
    {
      q: 'Which of these foods is the best source of fibre?',
      a: 'Wholemeal bread',
      wrong: [
        { label: 'Sugar', misconception: 'fibre-sugar', feedback: 'Sugar is a carbohydrate with no fibre.' },
        { label: 'Butter', misconception: 'fibre-butter', feedback: 'Butter is mainly fat, with no fibre.' },
        { label: 'Chicken', misconception: 'fibre-meat', feedback: 'Meat is mainly protein; fibre comes from plants.' },
      ],
      hint: 'Fibre comes from plant cell walls.',
      why: 'Fibre is found in plant foods such as wholemeal bread, brown rice, fruit, vegetables and beans.',
      lv: [2, 4],
    },
    {
      q: 'Which of these foods is a good source of calcium?',
      a: 'Milk',
      wrong: [
        { label: 'Sugar', misconception: 'calcium-sugar', feedback: 'Sugar contains no calcium.' },
        { label: 'Cooking oil', misconception: 'calcium-oil', feedback: 'Oil is pure fat.' },
        { label: 'Pasta', misconception: 'calcium-pasta', feedback: 'Pasta is mainly carbohydrate.' },
      ],
      hint: 'Think of foods that help build strong bones and teeth.',
      why: 'Milk, cheese and yoghurt are good sources of calcium, which is needed for strong bones and teeth.',
      lv: [1, 3],
    },
    {
      q: 'Gram for gram, which nutrient contains the most energy?',
      a: 'Lipids (fats and oils)',
      wrong: [
        { label: 'Carbohydrates', misconception: 'carbs-most-energy', feedback: 'Carbohydrates are the main source of energy we use, but fat contains about twice as much energy per gram.' },
        { label: 'Vitamins', misconception: 'vitamins-energy', feedback: 'Vitamins provide no energy.' },
        { label: 'Fibre', misconception: 'fibre-energy', feedback: 'We cannot digest fibre, so we get almost no energy from it.' },
      ],
      hint: 'Animals store energy for the winter as this.',
      why: 'Lipids contain about twice as much energy per gram as carbohydrates or protein, which is why they make a good energy store.',
      lv: [3, 5],
    },
    {
      q: 'Which mineral is needed to make red blood cells?',
      a: 'Iron',
      wrong: [
        { label: 'Calcium', misconception: 'calcium-blood', feedback: 'Calcium is for strong bones and teeth.' },
        { label: 'Vitamin C', misconception: 'vitamin-mineral', feedback: 'Vitamin C is a vitamin, not a mineral.' },
        { label: 'Fibre', misconception: 'fibre-mineral', feedback: 'Fibre is not a mineral.' },
      ],
      hint: 'A lack of it causes anaemia.',
      why: 'Iron is needed to make haemoglobin, the substance in red blood cells that carries oxygen.',
      lv: [2, 4],
    },
  ],
}

const foodClassify = classifyGenerators('bio.nutrition.food-groups', {
  id: 'main-nutrient',
  categories: ['Carbohydrate', 'Lipid (fat or oil)', 'Protein'],
  items: [
    ['pasta', 'Carbohydrate'],
    ['rice', 'Carbohydrate'],
    ['potatoes', 'Carbohydrate'],
    ['white bread', 'Carbohydrate'],
    ['sugar', 'Carbohydrate'],
    ['butter', 'Lipid (fat or oil)'],
    ['olive oil', 'Lipid (fat or oil)'],
    ['lard', 'Lipid (fat or oil)'],
    ['chicken breast', 'Protein'],
    ['white fish (such as cod)', 'Protein'],
    ['egg white', 'Protein'],
  ],
  ask: (item) => `Which nutrient is ${item} a particularly good source of?`,
  hint: 'Starchy and sugary foods, fatty foods, or meat, fish and eggs?',
  sortPrompt: 'Match each food to the main nutrient it provides.',
  means: {
    Carbohydrate: 'Starchy and sugary foods such as bread, pasta, rice and potatoes are rich in carbohydrate.',
    'Lipid (fat or oil)': 'Butter, oils and lard are almost all fat.',
    Protein: 'Meat, fish and eggs are rich in protein.',
  },
})

// ----------------------------------------------------------------------------------------------- food tests

interface FoodTest {
  nutrient: string
  reagent: string
  start: string
  positive: string
}
const TESTS: FoodTest[] = [
  { nutrient: 'Starch', reagent: 'Iodine solution', start: 'orange-brown', positive: 'blue-black' },
  { nutrient: 'Sugar', reagent: 'Benedict\'s solution (heated)', start: 'blue', positive: 'brick-red' },
  { nutrient: 'Protein', reagent: 'Biuret solution', start: 'blue', positive: 'purple' },
  { nutrient: 'Fat', reagent: 'Ethanol, then water', start: 'clear', positive: 'cloudy white' },
]

const foodTests: Bank = {
  skill: 'bio.nutrition.food-tests',
  links: [
    {
      prompt: 'Match each nutrient to the test used to find it.',
      pairs: [
        ['Starch', 'Iodine solution'],
        ['Sugar (glucose)', 'Benedict\'s solution, heated in a water bath'],
        ['Protein', 'Biuret solution'],
        ['Fat', 'Ethanol, then water (emulsion test)'],
      ],
      hint: 'Iodine is the one you also use on leaves.',
      ask: (l) => `Which test would you use to find ${l.toLowerCase().replace(' (glucose)', '')} in a food?`,
      lv: [1, 4],
    },
    {
      prompt: 'Match each test to the colour change you see if the nutrient is present.',
      pairs: [
        ['Iodine solution (starch)', 'Orange-brown to blue-black'],
        ['Benedict\'s solution (sugar)', 'Blue to brick-red'],
        ['Biuret solution (protein)', 'Blue to purple'],
        ['Ethanol and water (fat)', 'Clear to cloudy white'],
      ],
      hint: 'Two of the tests start blue. Which one needs heating and goes red?',
      ask: (l) => `What colour change shows a positive result for the ${lower(l.replace(/ \(.*\)$/, ''))} test?`,
      lv: [2, 4],
    },
  ],
  mcqs: [
    {
      q: 'Which of these would turn iodine solution blue-black?',
      a: 'A slice of potato',
      wrong: [
        { label: 'Cooking oil', misconception: 'iodine-oil', feedback: 'Oil is fat. Iodine tests for starch.' },
        { label: 'Egg white', misconception: 'iodine-protein', feedback: 'Egg white is mainly protein. Iodine tests for starch.' },
        { label: 'Pure water', misconception: 'iodine-water', feedback: 'Water contains no starch, so the iodine stays orange-brown.' },
      ],
      hint: 'Iodine detects starch. Which food is starchy?',
      why: 'Potatoes are full of starch, so iodine turns from orange-brown to blue-black.',
      lv: [1, 3],
    },
    {
      q: 'In the test for sugar, what must you do after adding Benedict\'s solution?',
      a: 'Heat the tube in a hot water bath',
      wrong: [
        { label: 'Put the tube in the fridge', misconception: 'benedicts-cold', feedback: 'Benedict\'s test needs heating, not cooling.' },
        { label: 'Add iodine solution', misconception: 'benedicts-iodine', feedback: 'Iodine is a different test (for starch).' },
        { label: 'Nothing: the colour changes straight away', misconception: 'benedicts-no-heat', feedback: 'Without heating, Benedict\'s solution stays blue even if sugar is present.' },
      ],
      hint: 'This is the only one of the food tests that needs a water bath.',
      why: 'The food and Benedict\'s solution are heated in a hot water bath for a few minutes. If sugar is present, the blue colour changes (green, yellow, orange or brick-red, depending on how much sugar).',
      lv: [2, 4],
    },
    {
      q: 'Benedict\'s solution stays blue after heating with a food. What does this show?',
      a: 'The food does not contain sugar (such as glucose)',
      wrong: [
        { label: 'The food contains a lot of sugar', misconception: 'blue-means-sugar', feedback: 'Benedict\'s starts blue. Staying blue is a negative result.' },
        { label: 'The food contains starch', misconception: 'benedicts-starch', feedback: 'Benedict\'s does not test for starch; iodine does.' },
        { label: 'The food contains protein', misconception: 'benedicts-protein', feedback: 'Protein is tested with biuret solution.' },
      ],
      hint: 'Benedict\'s solution is blue to start with.',
      why: 'If there is no sugar, Benedict\'s solution stays blue. A positive result is a change to green, yellow, orange or brick-red.',
      lv: [2, 4],
    },
  ],
}

function subsets(n: number): number[][] {
  const out: number[][] = []
  for (let i = 0; i < n; i++) out.push([i])
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) out.push([i, j])
  return out
}

const describeSet = (s: number[]) => {
  const names = s.map((i) => TESTS[i]!.nutrient.toLowerCase())
  const text = names.length === 1 ? names[0]! : `${names[0]} and ${names[1]}`
  return text.charAt(0).toUpperCase() + text.slice(1) + ' only'
}

function foodTestGenerators(): ItemGenerator[] {
  return [
    G('bio.nutrition.food-tests.interpret', 'bio.nutrition.food-tests', [2, 5], (rng: Rng, d) => {
      const all = subsets(TESTS.length)
      const pool = d <= 2 ? all.filter((s) => s.length === 1) : all
      const set = rng.pick(pool)
      const others = rng.shuffle(all.filter((s) => s.join() !== set.join())).slice(0, 3)
      return choice({
        rng,
        prompt: 'A food sample was tested for four nutrients. The table shows the results. Which nutrients does the food contain?',
        figure: {
          type: 'table',
          head: ['Test', 'Colour at start', 'Colour at end'],
          rows: TESTS.map((t, i) => [t.reagent, t.start, set.includes(i) ? t.positive : t.start]),
        },
        correct: describeSet(set),
        wrong: others.map((s) => ({ label: describeSet(s), misconception: 'food-test-misread', feedback: 'Check each test: a nutrient is only present if its colour changed.' })),
        hint: 'A colour change means the nutrient is there. No change means it is not.',
        explanation: TESTS.map((t, i) => `${t.reagent}: ${set.includes(i) ? `changed to ${t.positive}, so ${t.nutrient.toLowerCase()} is present` : `stayed ${t.start}, so no ${t.nutrient.toLowerCase()}`}.`).join('\n'),
      })
    }),
  ]
}

// ----------------------------------------------------------------------------------------------- balanced diet

const balancedDiet: Bank = {
  skill: 'bio.nutrition.balanced-diet',
  terms: [
    { term: 'Balanced diet', def: 'Eating the right amounts of all the different nutrients, plus fibre and water' },
    { term: 'Malnutrition', def: 'Eating too much or too little of some nutrients, so the diet is not balanced' },
    { term: 'Deficiency disease', def: 'An illness caused by not having enough of a particular vitamin or mineral' },
    { term: 'Obesity', def: 'Having so much body fat that it is likely to harm a person\'s health' },
    { term: 'Starvation', def: 'Not eating enough food over a long time, so the body does not get the energy it needs' },
  ],
  links: [
    {
      prompt: 'Match each deficiency disease to its cause.',
      pairs: [
        ['Scurvy', 'Not enough vitamin C'],
        ['Rickets', 'Not enough vitamin D or calcium'],
        ['Anaemia', 'Not enough iron'],
        ['Night blindness', 'Not enough vitamin A'],
      ],
      hint: 'Sailors on long voyages without fresh fruit used to get scurvy.',
      ask: (l) => `What causes ${l.toLowerCase()}?`,
      lv: [1, 4],
    },
    {
      prompt: 'Match each deficiency disease to one of its symptoms.',
      pairs: [
        ['Scurvy', 'Bleeding gums and wounds that heal slowly'],
        ['Rickets', 'Soft, weak bones that may bend'],
        ['Anaemia', 'Tiredness, because the blood carries less oxygen'],
        ['Night blindness', 'Difficulty seeing in dim light'],
      ],
      hint: 'Rickets affects bones; anaemia affects the blood.',
      ask: (l) => `Which of these is a symptom of ${l.toLowerCase()}?`,
      lv: [2, 4],
    },
  ],
  mcqs: [
    {
      q: 'Two people are the same age and size. One is a builder and one works at a desk. Why does the builder need more energy from food each day?',
      a: 'The builder is more physically active, so their muscles use more energy',
      wrong: [
        { label: 'Builders are always taller', misconception: 'job-height', feedback: 'They are the same size. The difference is activity.' },
        { label: 'Desk workers do not need any energy', misconception: 'rest-no-energy', feedback: 'Everyone needs energy, even at rest, to keep warm and keep organs working.' },
        { label: 'The builder needs more vitamins, which contain energy', misconception: 'vitamin-energy', feedback: 'Vitamins provide no energy.' },
      ],
      hint: 'Energy needs depend on age, size and how active you are.',
      why: 'The more active a person is, the more energy they use. Age, size, and whether someone is growing or pregnant also affect how much energy they need.',
      lv: [1, 3],
    },
    {
      q: 'What is likely to happen if someone regularly takes in more energy from food than they use?',
      a: 'The extra is stored as fat, so they gain weight',
      wrong: [
        { label: 'The extra energy is breathed out', misconception: 'energy-breathed', feedback: 'Spare energy from food is stored, mainly as fat.' },
        { label: 'They will get scurvy', misconception: 'energy-scurvy', feedback: 'Scurvy is caused by a lack of vitamin C.' },
        { label: 'Nothing: the body always uses up every bit of energy', misconception: 'energy-always-used', feedback: 'Energy that is not used is stored.' },
      ],
      hint: 'Where does the body store spare energy?',
      why: 'Energy that is not used is stored as fat. Over time this can lead to obesity, which increases the risk of problems such as heart disease and type 2 diabetes.',
      lv: [2, 4],
    },
    {
      q: 'Why do teenagers need plenty of protein in their diet?',
      a: 'They are growing quickly, and protein is needed to build new cells',
      wrong: [
        { label: 'Protein is their main source of energy', misconception: 'protein-energy', feedback: 'The main energy source is carbohydrate.' },
        { label: 'Protein keeps food moving through the gut', misconception: 'protein-fibre', feedback: 'That is the job of fibre.' },
        { label: 'Protein stops them getting colds', misconception: 'protein-colds', feedback: 'Protein is for growth and repair.' },
      ],
      hint: 'What is protein used for?',
      why: 'Protein is needed for growth and repair. Teenagers grow quickly, so they need plenty of it.',
      lv: [2, 4],
    },
  ],
}

interface FoodLabel {
  food: string
  per100: number
  servings: number[]
}
const LABELS: FoodLabel[] = [
  { food: 'a breakfast cereal', per100: 1600, servings: [25, 30, 40, 50] },
  { food: 'a loaf of bread', per100: 1000, servings: [30, 40, 60, 80] },
  { food: 'a bag of pasta', per100: 1500, servings: [60, 80, 100] },
  { food: 'a bar of chocolate', per100: 2200, servings: [20, 25, 40, 50] },
  { food: 'a tin of baked beans', per100: 350, servings: [100, 200, 220] },
  { food: 'a block of cheese', per100: 1700, servings: [20, 30, 40] },
  { food: 'a carton of yoghurt', per100: 400, servings: [100, 125, 150] },
]

function dietGenerators(): ItemGenerator[] {
  return [
    G('bio.nutrition.balanced-diet.label', 'bio.nutrition.balanced-diet', [2, 5], (rng, d) => {
      const f = rng.pick(LABELS)
      const g = rng.pick(f.servings)
      const e = (f.per100 * g) / 100
      if (d >= 4) {
        return num({
          prompt: `The label on ${f.food} says it contains ${fmt(f.per100)} kJ of energy per 100 g. What mass of it would give you ${fmt(e)} kJ?`,
          answer: g,
          suffix: 'g',
          hint: `How many kJ are in 1 g? Then how many grams give ${fmt(e)} kJ?`,
          explanation: `1 g contains ${fmt(f.per100)} ÷ 100 = ${fmt(f.per100 / 100)} kJ. Mass = ${fmt(e)} ÷ ${fmt(f.per100 / 100)} = ${g} g.`,
          errors: [{ values: [(e / f.per100) * 1], tag: 'forgot-100', message: 'The label is per 100 g, not per gram. Multiply by 100.' }],
        })
      }
      return num({
        prompt: `The label on ${f.food} says it contains ${fmt(f.per100)} kJ of energy per 100 g. How much energy is in a ${g} g portion?`,
        answer: e,
        suffix: 'kJ',
        hint: 'Work out the energy in 1 g first (divide by 100), then multiply by the mass of the portion.',
        explanation: `Energy in 1 g = ${fmt(f.per100)} ÷ 100 = ${fmt(f.per100 / 100)} kJ. Energy in ${g} g = ${fmt(f.per100 / 100)} × ${g} = ${fmt(e)} kJ.`,
        errors: [{ values: [f.per100 * g], tag: 'forgot-100', message: 'The label is per 100 g, so divide by 100.' }],
      })
    }),
  ]
}

// ----------------------------------------------------------------------------------------------- digestive system

const digestive: Bank = {
  skill: 'bio.nutrition.digestive-system',
  links: [
    {
      prompt: 'Match each part of the digestive system to its job.',
      pairs: [
        ['Mouth', 'Teeth break food into smaller pieces and saliva starts to digest starch'],
        ['Oesophagus', 'A muscular tube that carries food down to the stomach'],
        ['Stomach', 'Churns food with acid and enzymes; the acid also kills bacteria'],
        ['Small intestine', 'Finishes digestion and absorbs small food molecules into the blood'],
        ['Large intestine', 'Absorbs water from the remaining undigested food'],
        ['Rectum', 'Stores faeces until they leave the body'],
        ['Liver', 'Makes bile, which breaks fats into small droplets'],
        ['Pancreas', 'Makes digestive enzymes and releases them into the small intestine'],
      ],
      hint: 'Follow the food: chew, swallow, churn, absorb food, absorb water, store waste.',
      ask: (l) => `What is the job of the ${l.toLowerCase()}?`,
      lv: [1, 4],
    },
  ],
  orders: [
    {
      prompt: 'Put these parts of the digestive system in the order that food passes through them.',
      steps: ['Mouth', 'Oesophagus', 'Stomach', 'Small intestine', 'Large intestine', 'Rectum', 'Anus'],
      direction: ['first', 'last'],
      hint: 'The small intestine comes before the large intestine.',
      why: 'Mouth → oesophagus → stomach → small intestine → large intestine → rectum → anus. (The liver and pancreas help digestion, but food does not pass through them.)',
      lv: [1, 5],
    },
  ],
  mcqs: [
    {
      q: 'Which of these organs does food NOT pass through?',
      a: 'The liver',
      wrong: [
        { label: 'The stomach', misconception: 'stomach-bypass', feedback: 'Food is churned in the stomach.' },
        { label: 'The oesophagus', misconception: 'oesophagus-bypass', feedback: 'All swallowed food goes down the oesophagus.' },
        { label: 'The small intestine', misconception: 'small-intestine-bypass', feedback: 'Food passes through the small intestine, where it is absorbed.' },
      ],
      hint: 'Two organs help digestion by making substances, without food passing through them.',
      why: 'The liver makes bile and the pancreas makes enzymes. Both pass into the small intestine through tubes, but food itself never goes through the liver or pancreas.',
      lv: [2, 4],
    },
    {
      q: 'The inside of the small intestine is covered in villi. How do villi help?',
      a: 'They give a large surface area, so digested food is absorbed into the blood quickly',
      wrong: [
        { label: 'They churn food like the stomach', misconception: 'villi-churn', feedback: 'Churning happens in the stomach. Villi are for absorption.' },
        { label: 'They make bile', misconception: 'villi-bile', feedback: 'Bile is made by the liver.' },
        { label: 'They absorb water to make faeces', misconception: 'villi-water', feedback: 'That is mainly the large intestine.' },
      ],
      hint: 'Villi are tiny finger-like folds. What does folding do to the area?',
      why: 'Villi give the small intestine a huge surface area. They also have thin walls and a good blood supply, so small food molecules pass into the blood quickly.',
      lv: [3, 5],
    },
    {
      q: 'How is food moved along the oesophagus and intestines?',
      a: 'Muscles in the wall of the gut squeeze it along',
      wrong: [
        { label: 'Gravity pulls it down', misconception: 'gravity-gut', feedback: 'You can swallow even when upside down: muscles push food along, not gravity.' },
        { label: 'It is carried along in the blood', misconception: 'blood-carries-food', feedback: 'Undigested food stays inside the gut.' },
        { label: 'Tiny hairs sweep it along', misconception: 'cilia-gut', feedback: 'Cilia sweep mucus in the airways, not food in the gut.' },
      ],
      hint: 'The gut wall contains muscle.',
      why: 'Waves of muscle contraction in the gut wall (called peristalsis) squeeze food along.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Describe what happens to a piece of bread from the moment it enters your mouth until the sugars from it reach your blood.',
      model: 'In the mouth, teeth break the bread into smaller pieces and saliva, which contains amylase, starts to digest the starch. The food is swallowed down the oesophagus and churned in the stomach. In the small intestine, more enzymes from the pancreas finish breaking the starch down into sugars. These small molecules are absorbed through the villi of the small intestine into the blood.',
      checklist: ['Teeth break the food up (chewing)', 'Mentions amylase or an enzyme breaking down starch', 'Mentions the oesophagus and stomach in the right order', 'Sugars are absorbed into the blood in the small intestine'],
      hint: 'Follow the bread through each organ. What happens to the starch?',
    },
  ],
}

// ----------------------------------------------------------------------------------------------- enzymes

const enzymes: Bank = {
  skill: 'bio.nutrition.enzymes',
  terms: [
    { term: 'Enzyme', def: 'A biological catalyst: a protein that speeds up a reaction without being used up' },
    { term: 'Digestion', def: 'Breaking down large food molecules into small molecules that can be absorbed' },
    { term: 'Absorption', def: 'Small food molecules passing from the gut into the blood' },
    { term: 'Bile', def: 'A liquid made by the liver that breaks fats into small droplets and neutralises stomach acid' },
    { term: 'Gut bacteria', def: 'Microorganisms living in the intestines that help break down some food and make some vitamins' },
  ],
  links: [
    {
      prompt: 'Match each enzyme to the reaction it speeds up.',
      pairs: [
        ['Carbohydrase (for example amylase)', 'Starch → sugars'],
        ['Protease', 'Proteins → amino acids'],
        ['Lipase', 'Lipids (fats) → fatty acids and glycerol'],
      ],
      hint: 'The start of each enzyme\'s name tells you what it breaks down: carbohydr-, prote-, lip-.',
      ask: (l) => `What does ${l.replace(/^Carbohydrase \(for example amylase\)$/, 'a carbohydrase such as amylase').toLowerCase()} break down, and into what?`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'Why must starch be digested before the body can use it?',
      a: 'Starch molecules are too big to pass from the gut into the blood',
      wrong: [
        { label: 'Starch is poisonous until it is digested', misconception: 'starch-poison', feedback: 'Starch is not poisonous; it is just too big to be absorbed.' },
        { label: 'Starch only gives energy after it is digested by the lungs', misconception: 'lungs-digest', feedback: 'Digestion happens in the digestive system, not the lungs.' },
        { label: 'Undigested starch would turn into fat in the mouth', misconception: 'starch-fat', feedback: 'The issue is size: big molecules cannot be absorbed.' },
      ],
      hint: 'Think about the size of the molecules and the wall of the small intestine.',
      why: 'Large molecules like starch cannot pass through the wall of the small intestine. Enzymes break them into small molecules (sugars) that can be absorbed into the blood.',
      lv: [2, 4],
    },
    {
      q: 'Which of these makes the enzyme amylase?',
      a: 'The salivary glands',
      wrong: [
        { label: 'The gall bladder', misconception: 'gall-bladder-enzymes', feedback: 'The gall bladder stores bile, which is not an enzyme.' },
        { label: 'The large intestine', misconception: 'large-intestine-enzymes', feedback: 'The large intestine mainly absorbs water.' },
        { label: 'The oesophagus', misconception: 'oesophagus-enzymes', feedback: 'The oesophagus just carries food to the stomach.' },
      ],
      hint: 'Digestion of starch starts in the mouth.',
      why: 'Amylase is made by the salivary glands (it is in saliva) and by the pancreas. It breaks starch down into sugars.',
      lv: [2, 4],
    },
    {
      q: 'How does bile help digestion?',
      a: 'It breaks fats into small droplets, giving lipase a bigger surface to work on',
      wrong: [
        { label: 'It is an enzyme that breaks down protein', misconception: 'bile-enzyme', feedback: 'Bile is not an enzyme. Protease breaks down protein.' },
        { label: 'It absorbs water in the large intestine', misconception: 'bile-water', feedback: 'Bile works in the small intestine on fats.' },
        { label: 'It turns starch into sugar', misconception: 'bile-starch', feedback: 'That is the job of amylase.' },
      ],
      hint: 'Think of washing-up liquid on a greasy plate.',
      why: 'Bile, made by the liver, breaks large drops of fat into tiny droplets (emulsifies them). This gives a much larger surface area for lipase to act on. It also neutralises stomach acid.',
      lv: [3, 5],
    },
    {
      q: 'How do bacteria in the large intestine help us?',
      a: 'They help break down some food we cannot digest ourselves, and make some vitamins',
      wrong: [
        { label: 'They make bile', misconception: 'bacteria-bile', feedback: 'Bile is made by the liver.' },
        { label: 'All bacteria in the gut are harmful and should be removed', misconception: 'all-bacteria-bad', feedback: 'Many gut bacteria are helpful.' },
        { label: 'They pump food along the gut', misconception: 'bacteria-pump', feedback: 'Muscles in the gut wall move food along.' },
      ],
      hint: 'Not all bacteria are harmful.',
      why: 'Helpful gut bacteria break down some substances we cannot digest and make some vitamins (such as vitamin K) that we can absorb.',
      lv: [3, 5],
    },
    {
      q: 'Human digestive enzymes work best at about which temperature?',
      a: '37 °C (body temperature)',
      wrong: [
        { label: '0 °C', misconception: 'enzyme-cold', feedback: 'Enzymes work very slowly when cold.' },
        { label: '100 °C', misconception: 'enzyme-boiling', feedback: 'At high temperatures enzymes change shape and stop working.' },
        { label: '20 °C (room temperature)', misconception: 'enzyme-room', feedback: 'Our enzymes work best at our body temperature.' },
      ],
      hint: 'Where do these enzymes normally work?',
      why: 'Human enzymes work best at about body temperature, 37 °C. At much higher temperatures they change shape and stop working (they are denatured).',
      lv: [3, 5],
    },
  ],
}

export const nutritionGenerators: ItemGenerator[] = [
  ...bankGenerators(foodGroups),
  ...foodClassify,
  ...bankGenerators(foodTests),
  ...foodTestGenerators(),
  ...bankGenerators(balancedDiet),
  ...dietGenerators(),
  ...bankGenerators(digestive),
  ...bankGenerators(enzymes),
]
