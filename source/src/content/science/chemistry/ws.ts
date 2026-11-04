import type { ItemGenerator } from '@/engine/registry'
import { choice } from '../../kit'
import { bankGenerators, fix, fmt, G, num, round, table, type Bank } from './factory'

// =====================================================================================================================
// Hazard symbols and lab safety
// =====================================================================================================================

const hazards: Bank = {
  skill: 'chem.ws.hazards',
  noun: 'hazard',
  matchPrompt: 'Match each hazard to what it warns you about.',
  terms: [
    { term: 'Flammable', def: 'Catches fire easily, so keep it away from flames and sparks' },
    { term: 'Corrosive', def: 'Destroys living tissue such as skin and eyes, and can attack metals' },
    { term: 'Toxic', def: 'Can cause death, even in small amounts, if swallowed, breathed in or absorbed through the skin' },
    { term: 'Oxidising', def: 'Gives off oxygen, which makes other substances burn more fiercely' },
    { term: 'Explosive', def: 'May explode if heated, knocked or set alight' },
    { term: 'Hazardous to the environment', def: 'Harms living things in the environment, especially in rivers and lakes' },
    { term: 'Harmful or irritant', def: 'Can cause less serious harm, such as a rash, sore eyes or coughing' },
    { term: 'Health hazard', def: 'Can cause serious long-term damage to health, for example to the lungs' },
  ],
  links: [
    {
      prompt: 'Match each hazard symbol picture to its hazard.',
      pairs: [
        ['A flame', 'Flammable'],
        ['A flame above a circle', 'Oxidising'],
        ['A skull and crossbones', 'Toxic'],
        ['Liquid dripping onto a hand and a surface, eating into them', 'Corrosive'],
        ['An exploding bomb', 'Explosive'],
        ['A dead tree and a dead fish', 'Hazardous to the environment'],
        ['An exclamation mark', 'Harmful or irritant'],
        ['A person with a starburst on their chest', 'Health hazard'],
      ],
      hint: 'The symbols are designed to be read without words: think what each picture is showing happening.',
      ask: (l) => `A hazard symbol shows ${l.charAt(0).toLowerCase() + l.slice(1)}. What does it mean?`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'Which hazard symbol warns you to keep a chemical away from naked flames because it catches fire easily?',
      a: 'Flammable',
      wrong: [
        { label: 'Oxidising', misconception: 'oxidising-flammable', feedback: 'Oxidising chemicals do not burn themselves; they give off oxygen that makes OTHER things burn more fiercely.' },
        'Corrosive',
        'Toxic',
      ],
      hint: 'Which hazard is about the chemical itself burning?',
      why: 'Flammable means it catches fire easily (for example ethanol). Its symbol is a flame.',
      lv: [1, 2],
    },
    {
      q: 'The "oxidising" symbol is a flame above a circle. Why is an oxidising chemical dangerous near fuels?',
      a: 'It gives off oxygen, which makes other substances burn more fiercely',
      wrong: [
        { label: 'It burns very easily itself', misconception: 'oxidising-flammable', feedback: 'That is "flammable". An oxidiser supplies oxygen to help other things burn.' },
        { label: 'It dissolves skin', misconception: 'oxidising-corrosive', feedback: 'That is "corrosive".' },
        'It is poisonous if breathed in',
      ],
      hint: 'Burning needs fuel, heat and one other thing.',
      why: 'Burning needs oxygen. An oxidising chemical supplies extra oxygen, so a fire involving it burns more fiercely.',
      lv: [2, 4],
    },
    {
      q: 'You are using concentrated sodium hydroxide solution, which is corrosive. What is the most important precaution?',
      a: 'Wear eye protection and avoid getting it on your skin',
      wrong: [
        { label: 'Keep it away from Bunsen flames', misconception: 'corrosive-flammable', feedback: 'That is the precaution for a flammable chemical. Corrosive chemicals attack skin and eyes.' },
        'Use it only in a fume cupboard because it is a gas',
        'Wash it down the sink straight away',
      ],
      hint: 'What does a corrosive substance damage?',
      why: 'Corrosive substances destroy living tissue, and eyes are easily damaged, so eye protection (goggles) is essential and spills on skin must be washed off with plenty of water.',
      lv: [2, 4],
    },
    {
      q: 'Why should you never pour a chemical with the "hazardous to the environment" symbol down the sink?',
      a: 'It could harm living things in rivers and lakes',
      wrong: ['It might block the sink', { label: 'It will catch fire in the drain', misconception: 'environment-flammable', feedback: 'That would be the flammable symbol. This symbol shows a dead tree and fish.' }, 'It will make the sink smell'],
      hint: 'Look at what the symbol shows: a dead tree and a dead fish.',
      why: 'Water from sinks ends up in the environment. Chemicals that are toxic to water life should go in a labelled waste container instead.',
      lv: [2, 4],
    },
    {
      q: 'When heating a liquid in a test tube, which way should the open end point?',
      a: 'Away from yourself and everyone else',
      wrong: [
        { label: 'Towards you, so you can see inside', misconception: 'look-in-tube', feedback: 'Hot liquid can suddenly spit out of the tube. Never point it at anyone, including you.' },
        'Straight down into the flame',
        'It does not matter',
      ],
      hint: 'Hot liquid can "spit" out suddenly.',
      why: 'Heated liquids can suddenly boil and shoot out, so the open end must point away from all people.',
      lv: [1, 3],
    },
    {
      q: 'Which of these is the correct thing to do in a science lab?',
      a: 'Stand up while heating things, and tie long hair back',
      wrong: [
        { label: 'Taste a chemical to identify it, as long as it is only a tiny amount', misconception: 'taste-test', feedback: 'Never taste anything in a lab, however small the amount.' },
        { label: 'Leave a lit Bunsen burner on a blue flame while you fetch something', misconception: 'blue-flame-safe', feedback: 'A blue flame is hard to see. Turn it to the yellow safety flame if you leave it, even briefly.' },
        'Clear up broken glass with your hands so it is done quickly',
      ],
      hint: 'Think about which choice protects you if something spills or catches fire.',
      why: 'Standing lets you move away quickly if something spills; tying hair back stops it catching in a flame. Never taste chemicals, never pick up broken glass with your hands, and use the safety flame when the Bunsen is not being used.',
      lv: [1, 3],
    },
    {
      q: 'A chemical bottle has the exclamation mark symbol. Which statement best describes the hazard?',
      a: 'It may cause less serious harm, such as skin or eye irritation',
      wrong: [
        { label: 'It is safe because it is not a skull and crossbones', misconception: 'irritant-safe', feedback: 'It is less dangerous than "toxic", but it can still harm you. Handle it with care.' },
        'It will explode if dropped',
        'It catches fire easily',
      ],
      hint: 'This is a warning sign, but for a less serious hazard than toxic or corrosive.',
      why: 'The exclamation mark means harmful or irritant: it can cause rashes, sore eyes or coughing, so it still needs care (eye protection, no skin contact).',
      lv: [3, 5],
    },
    {
      q: 'Dilute hydrochloric acid is labelled "irritant", but concentrated hydrochloric acid is labelled "corrosive". Why are the labels different?',
      a: 'The concentrated acid has more acid in the same volume, so it does much more damage',
      wrong: [
        { label: 'They are different chemicals', misconception: 'concentration-different-chemical', feedback: 'It is the same acid; only the amount of acid dissolved in each volume of water is different.' },
        'Dilute acid is hotter',
        'Concentrated acid is a solid',
      ],
      hint: 'What does "dilute" mean?',
      why: 'Hazards depend on concentration. Diluting an acid with water spreads the acid particles out, so it is less dangerous, but still an irritant.',
      lv: [4, 5],
    },
  ],
  written: [
    {
      prompt: 'A student is going to heat some copper sulfate solution in an evaporating dish with a Bunsen burner. Write a short risk assessment: name two hazards and how to reduce each risk.',
      model:
        'Copper sulfate is harmful and could get in my eyes if it spits when heated, so I will wear eye protection and not lean over the dish. The Bunsen flame and hot dish could burn me or set hair or paper alight, so I will tie my hair back, stand up while heating, use tongs to move the dish and let it cool before touching it.',
      checklist: ['Names a hazard from the chemical (e.g. harmful, could spit into eyes)', 'Gives a precaution for it (e.g. eye protection)', 'Names a hazard from the heating (burns, fire)', 'Gives a precaution for it (tie hair back, tongs, let it cool, stand up)'],
      hint: 'Think about the chemical, the flame and the hot equipment.',
    },
  ],
}

// =====================================================================================================================
// Lab apparatus
// =====================================================================================================================

const apparatus: Bank = {
  skill: 'chem.ws.apparatus',
  noun: 'piece of apparatus',
  matchPrompt: 'Match each piece of apparatus to what it is used for.',
  terms: [
    { term: 'Measuring cylinder', def: 'Measures the volume of a liquid' },
    { term: 'Beaker', def: 'A simple container for holding, mixing and heating liquids' },
    { term: 'Tripod and gauze', def: 'A stand that holds a beaker or evaporating dish above a Bunsen burner' },
    { term: 'Evaporating dish', def: 'A shallow dish used to heat a solution so the water evaporates and leaves the solid behind' },
    { term: 'Filter funnel and filter paper', def: 'Separate an insoluble solid from a liquid' },
    { term: 'Thermometer', def: 'Measures temperature' },
    { term: 'Top-pan balance', def: 'Measures mass' },
    { term: 'Spatula', def: 'Used to scoop up small amounts of a solid' },
    { term: 'Tongs', def: 'Used to hold or move hot objects' },
    { term: 'Pipette', def: 'Transfers small volumes of liquid, drop by drop or as an exact volume' },
    { term: 'Condenser', def: 'Cools a vapour so that it turns back into a liquid' },
    { term: 'Heat-proof mat', def: 'Protects the bench from the heat of a Bunsen burner' },
  ],
  links: [
    {
      prompt: 'Match each quantity to the instrument used to measure it.',
      pairs: [
        ['Temperature', 'Thermometer'],
        ['Mass', 'Top-pan balance'],
        ['Volume of a liquid', 'Measuring cylinder'],
        ['Time', 'Stopwatch'],
        ['pH', 'pH meter or universal indicator'],
      ],
      hint: 'Think about what each instrument has on its scale or display.',
      ask: (l) => `Which instrument would you use to measure ${l.toLowerCase()}?`,
      lv: [1, 3],
    },
    {
      prompt: 'Match each quantity to the unit it is usually measured in during a chemistry practical.',
      pairs: [
        ['Temperature', '°C (degrees Celsius)'],
        ['Mass', 'g (grams)'],
        ['Volume of a liquid', 'cm^{3} (cubic centimetres)'],
        ['Time', 's (seconds)'],
      ],
      hint: '1 cm^{3} is the same volume as 1 ml.',
      ask: (l) => `What unit is ${l.toLowerCase()} usually measured in during a chemistry practical?`,
      lv: [2, 4],
    },
  ],
  mcqs: [
    {
      q: 'How should you read the volume of water in a measuring cylinder?',
      a: 'With your eye level with the bottom of the curved surface (the meniscus)',
      wrong: [
        { label: 'From above, looking down at the top of the curve', misconception: 'parallax', feedback: 'Looking from above or below gives a wrong reading (parallax). Get your eye level with the liquid.' },
        { label: 'At the top edge where the water touches the glass', misconception: 'meniscus-top', feedback: 'For water you read the bottom of the meniscus, not where it climbs the glass.' },
        'Hold it up to the light and read the highest mark you can see',
      ],
      hint: 'Two things matter: where your eye is, and which part of the curved surface you read.',
      why: 'Water forms a curved surface called a meniscus. Put the cylinder on a flat bench, get your eye level with the liquid and read the bottom of the meniscus.',
      lv: [2, 4],
    },
    {
      q: 'Which Bunsen burner flame should you use as the "safety flame" when the burner is lit but not being used?',
      a: 'The yellow flame, with the air hole closed',
      wrong: [
        { label: 'The blue flame, with the air hole open', misconception: 'blue-safety', feedback: 'The blue roaring flame is the hottest and is hard to see. That makes it the dangerous one to leave.' },
        'Any flame, as long as the gas is turned down low',
        'The blue flame, with the air hole closed',
      ],
      hint: 'The safety flame needs to be easy to see.',
      why: 'With the air hole closed the flame is yellow, cooler and easy to see, so nobody touches it by accident. Open the air hole to get the hot blue flame for heating.',
      lv: [1, 3],
    },
    {
      q: 'Why is the blue Bunsen flame hotter than the yellow flame?',
      a: 'The air hole is open, so more oxygen mixes with the gas and it burns completely',
      wrong: [
        { label: 'More gas is coming out', misconception: 'more-gas-hotter', feedback: 'The gas supply can be the same. The difference is the air (oxygen) mixed in through the air hole.' },
        'Blue light is hotter than yellow light',
        'The air hole is closed, so the heat cannot escape',
      ],
      hint: 'What does opening the air hole let into the barrel?',
      why: 'Opening the air hole lets air in, so the gas is mixed with oxygen before it burns. It burns completely, giving a hotter, clean blue flame. The yellow flame has glowing bits of unburnt carbon (soot).',
      lv: [3, 5],
    },
    {
      q: 'You need to measure out 8 cm^{3} of acid as accurately as possible. Which measuring cylinder should you use?',
      a: 'A 10 cm^{3} measuring cylinder',
      wrong: [
        { label: 'A 100 cm^{3} measuring cylinder', misconception: 'bigger-better', feedback: 'A big cylinder has widely spaced marks for small volumes, so the reading is less precise.' },
        { label: 'A 250 cm^{3} beaker', misconception: 'beaker-measure', feedback: 'The marks on a beaker are only rough guides; they are not for accurate measuring.' },
        'A 50 cm^{3} measuring cylinder',
      ],
      hint: 'Choose the smallest cylinder that can still hold the whole volume.',
      why: 'The smallest cylinder that holds the volume has the finest scale divisions, so it gives the most precise reading.',
      lv: [3, 5],
    },
    {
      q: 'Why is a conical flask often used instead of a beaker when a mixture has to be swirled?',
      a: 'Its narrow neck stops the liquid splashing out',
      wrong: ['It measures volume more accurately than a beaker', 'It can be heated to a higher temperature', { label: 'It keeps the liquid cold', misconception: 'flask-insulates', feedback: 'A conical flask is ordinary glass; it does not insulate.' }],
      hint: 'Compare the shapes of the tops.',
      why: 'The sloping sides and narrow neck mean you can swirl the liquid without it spilling.',
      lv: [2, 4],
    },
  ],
  orders: [
    {
      prompt: 'Put the steps for lighting a Bunsen burner in order.',
      steps: [
        'Put the Bunsen burner on a heat-proof mat',
        'Close the air hole',
        'Light a splint (or use a lighter)',
        'Turn on the gas and hold the flame just above the top of the barrel',
        'Open the air hole to get a blue flame for heating',
      ],
      direction: ['first', 'last'],
      hint: 'The flame should start as the visible yellow safety flame.',
      why: 'Set it up safely, close the air hole so it lights with the yellow safety flame, have the flame ready before the gas comes on, then open the air hole for the hot blue flame.',
      lv: [2, 4],
    },
  ],
}

// =====================================================================================================================
// Tables of results: variables, means, range, anomalies, graphs
// =====================================================================================================================

interface Investigation {
  /** What the question says she is investigating. */
  aim: string
  iv: string
  dv: string
  controls: string[]
  /** Wrong answers for the independent variable that are other plausible variables. */
  others: string[]
  /** Is the independent variable categoric (bar chart) or continuous (line graph)? */
  ivType: 'categoric' | 'continuous'
}

const INVESTIGATIONS: Investigation[] = [
  {
    aim: 'how the temperature of hydrochloric acid affects how long a piece of magnesium ribbon takes to react',
    iv: 'The temperature of the acid',
    dv: 'The time for the magnesium to react',
    controls: ['The length of magnesium ribbon', 'The volume of acid', 'The concentration of the acid'],
    others: ['The type of metal'],
    ivType: 'continuous',
  },
  {
    aim: 'how the temperature of water affects the mass of sugar that dissolves in 100 g of water',
    iv: 'The temperature of the water',
    dv: 'The mass of sugar that dissolves',
    controls: ['The mass of water', 'The type of sugar', 'The amount of stirring'],
    others: ['The size of the beaker'],
    ivType: 'continuous',
  },
  {
    aim: 'which of four metals gives the biggest temperature rise when added to copper sulfate solution',
    iv: 'The type of metal',
    dv: 'The temperature rise',
    controls: ['The mass of metal powder', 'The volume of copper sulfate solution', 'The concentration of copper sulfate solution'],
    others: ['The starting temperature of the solution'],
    ivType: 'categoric',
  },
  {
    aim: 'how the concentration of acid affects the volume of gas made in one minute when marble chips are added',
    iv: 'The concentration of the acid',
    dv: 'The volume of gas made in one minute',
    controls: ['The mass of marble chips', 'The size of the marble chips', 'The volume of acid', 'The temperature'],
    others: ['The type of acid'],
    ivType: 'continuous',
  },
  {
    aim: 'which indigestion remedy neutralises the most acid',
    iv: 'The type of indigestion remedy',
    dv: 'The volume of acid neutralised',
    controls: ['The mass of each remedy', 'The concentration of the acid', 'The indicator used'],
    others: ['The temperature of the room'],
    ivType: 'categoric',
  },
  {
    aim: 'how the mass of a fuel burned affects the temperature rise of 100 cm^{3} of water heated by it',
    iv: 'The mass of fuel burned',
    dv: 'The temperature rise of the water',
    controls: ['The volume of water', 'The type of fuel', 'The distance from the flame to the container'],
    others: ['The type of container'],
    ivType: 'continuous',
  },
  {
    aim: 'how the surface area of calcium carbonate (lumps or powder) affects how quickly carbon dioxide is given off',
    iv: 'The size of the calcium carbonate pieces',
    dv: 'How quickly carbon dioxide is given off',
    controls: ['The mass of calcium carbonate', 'The volume of acid', 'The concentration of the acid', 'The temperature'],
    others: ['The type of acid'],
    ivType: 'categoric',
  },
]

interface Measure {
  what: string
  unit: string
  /** Typical value range (whole numbers) and decimal places to show. */
  lo: number
  hi: number
  dp: 0 | 1
}

const MEASURES: Measure[] = [
  { what: 'Temperature rise', unit: '°C', lo: 5, hi: 40, dp: 1 },
  { what: 'Time for the magnesium to react', unit: 's', lo: 20, hi: 90, dp: 0 },
  { what: 'Volume of gas collected', unit: 'cm^{3}', lo: 20, hi: 80, dp: 0 },
  { what: 'Mass lost', unit: 'g', lo: 1, hi: 5, dp: 1 },
  { what: 'Time for the cross to disappear', unit: 's', lo: 30, hi: 120, dp: 0 },
]

/** Three repeats whose mean is exactly `m` (to the measure's dp). */
function threeRepeats(rng: import('@/engine/types').Rng, mean: number, step: number): number[] {
  const a = rng.int(1, 3) * step
  const b = rng.int(0, 2) * step
  return rng.shuffle([round(mean - a, 2), round(mean + a - b, 2), round(mean + b, 2)])
}

const resultsGenerators: ItemGenerator[] = [
  G('chem.ws.results.variables', 'chem.ws.results', [1, 4], (rng, d) => {
    const inv = rng.pick(INVESTIGATIONS)
    const kind = d <= 1 ? 'iv' : rng.pick(['iv', 'dv', 'control'] as const)
    if (kind === 'iv') {
      return choice({
        rng,
        prompt: `A class investigates ${inv.aim}. What is the independent variable?`,
        correct: inv.iv,
        wrong: [
          { label: inv.dv, misconception: 'iv-dv-swap', feedback: 'That is what they measure: the dependent variable.' },
          { label: inv.controls[0] ?? '', misconception: 'iv-control', feedback: 'That must be kept the same: it is a control variable.' },
          ...inv.others,
        ],
        hint: 'The independent variable is the one you choose to change on purpose.',
        explanation: `The independent variable is what you change: ${inv.iv.charAt(0).toLowerCase() + inv.iv.slice(1)}. The dependent variable is what you measure: ${inv.dv.charAt(0).toLowerCase() + inv.dv.slice(1)}.`,
      })
    }
    if (kind === 'dv') {
      return choice({
        rng,
        prompt: `A class investigates ${inv.aim}. What is the dependent variable?`,
        correct: inv.dv,
        wrong: [
          { label: inv.iv, misconception: 'iv-dv-swap', feedback: 'That is what they change: the independent variable.' },
          { label: inv.controls[0] ?? '', misconception: 'dv-control', feedback: 'That must be kept the same: it is a control variable.' },
          ...inv.others,
        ],
        hint: 'The dependent variable is what you measure or observe.',
        explanation: `The dependent variable is what you measure: ${inv.dv.charAt(0).toLowerCase() + inv.dv.slice(1)}. It depends on what you changed (${inv.iv.charAt(0).toLowerCase() + inv.iv.slice(1)}).`,
      })
    }
    const ctrl = rng.pick(inv.controls)
    return choice({
      rng,
      prompt: `A class investigates ${inv.aim}. Which of these must be kept the same to make it a fair test?`,
      correct: ctrl,
      wrong: [
        { label: inv.iv, misconception: 'control-iv', feedback: 'That is the variable being changed on purpose, so it cannot be kept the same.' },
        { label: inv.dv, misconception: 'control-dv', feedback: 'That is what is being measured, so it is the result, not something to keep the same.' },
      ],
      hint: 'In a fair test only one thing is changed. Which option is neither changed nor measured?',
      explanation: `${ctrl} is a control variable. If it changed too, you could not tell whether the result was caused by ${inv.iv.charAt(0).toLowerCase() + inv.iv.slice(1)}.`,
    })
  }),

  G('chem.ws.results.mean', 'chem.ws.results', [2, 4], (rng, d) => {
    const m = rng.pick(MEASURES)
    const step = m.dp === 1 ? 0.1 * rng.int(1, 4) : rng.int(1, 3)
    const mean = m.dp === 1 ? round(rng.int(m.lo * 10 + 15, m.hi * 10) / 10, 1) : rng.int(m.lo + 5, m.hi)
    const reps = threeRepeats(rng, mean, step)
    const fig = table(['', 'Repeat 1', 'Repeat 2', 'Repeat 3'], [[`${m.what} (${m.unit})`, ...reps.map((x) => fix(x, m.dp))]])
    const sum = round(reps.reduce((a, b) => a + b, 0), 2)
    if (d <= 3 || rng.chance(0.5)) {
      return num({
        prompt: `The table shows three repeat readings. Calculate the mean ${m.what.toLowerCase()}. Give your answer in ${m.unit}.`,
        answer: mean,
        suffix: m.unit,
        tolerance: m.dp === 1 ? 0.05 : 0.5,
        figure: fig,
        hint: 'Add up the repeat readings, then divide by how many there are.',
        explanation: `Mean = (${reps.map((x) => fix(x, m.dp)).join(' + ')}) ÷ 3 = ${fmt(sum, 2)} ÷ 3 = ${fix(mean, m.dp)} ${m.unit}.`,
        errors: [{ values: [sum], tag: 'forgot-divide', message: 'That is the total. Now divide by the number of readings (3).' }, { values: [round(sum / 2, 2)], tag: 'divide-wrong-n', message: 'There are three readings, so divide by 3.' }],
      })
    }
    const hi = Math.max(...reps)
    const lo = Math.min(...reps)
    const range = round(hi - lo, 2)
    return num({
      prompt: `The table shows three repeat readings. What is the difference between the highest and lowest reading (the range)? Give your answer in ${m.unit}.`,
      answer: range,
      suffix: m.unit,
      tolerance: 0.01,
      figure: fig,
      hint: 'Find the biggest and smallest readings first.',
      explanation: `Highest ${fix(hi, m.dp)} − lowest ${fix(lo, m.dp)} = ${fix(range, m.dp)} ${m.unit}. A small spread means the repeats agree well.`,
    })
  }),

  G('chem.ws.results.anomaly', 'chem.ws.results', [3, 5], (rng, d) => {
    const m = rng.pick(MEASURES.filter((x) => x.dp === 0))
    const mean = rng.int(m.lo + 10, m.hi - 5)
    const good = threeRepeats(rng, mean, 1)
    const odd = rng.chance(0.5) ? mean + rng.int(15, 25) : mean - rng.int(10, Math.min(18, mean - 3))
    const pos = rng.int(0, 3)
    const reps = [...good.slice(0, pos), odd, ...good.slice(pos)]
    const heads = ['', 'Repeat 1', 'Repeat 2', 'Repeat 3', 'Repeat 4']
    const fig = table(heads, [[`${m.what} (${m.unit})`, ...reps.map((x) => fmt(x, 0))]])
    if (d <= 3) {
      return choice({
        rng,
        prompt: 'Which repeat in the table is anomalous (does not fit the pattern of the others)?',
        correct: `Repeat ${pos + 1}`,
        wrong: [0, 1, 2, 3].filter((i) => i !== pos).map((i) => `Repeat ${i + 1}`),
        keepOrder: true,
        figure: fig,
        hint: 'Three of the readings are close together. Which one is far away from them?',
        explanation: `Repeat ${pos + 1} (${odd} ${m.unit}) is far from the other three, which are all close to ${mean} ${m.unit}. It is anomalous, probably caused by a mistake, so it should be left out of the mean (or the reading repeated).`,
      })
    }
    const all = round(reps.reduce((a, b) => a + b, 0) / 4, 2)
    return num({
      prompt: `One of these repeat readings is anomalous. Leave it out and calculate the mean of the others. Give your answer in ${m.unit}.`,
      answer: mean,
      suffix: m.unit,
      tolerance: 0.5,
      figure: fig,
      hint: 'Find the reading that does not fit, then take the mean of the rest.',
      explanation: `The anomalous reading is ${odd} ${m.unit}. Mean of the others = (${good.join(' + ')}) ÷ 3 = ${mean} ${m.unit}.`,
      errors: [{ values: [all], tag: 'included-anomaly', message: 'That includes the anomalous result. Leave it out, then divide by 3.' }],
    })
  }),

  G('chem.ws.results.graph-type', 'chem.ws.results', [2, 4], (rng) => {
    const inv = rng.pick(INVESTIGATIONS)
    const correct = inv.ivType === 'categoric' ? 'A bar chart' : 'A line graph'
    return choice({
      rng,
      prompt: `A class investigates ${inv.aim}. What kind of graph should they draw?`,
      correct,
      wrong: [
        inv.ivType === 'categoric'
          ? { label: 'A line graph', misconception: 'line-for-categoric', feedback: 'The independent variable is a set of separate categories, with nothing in between, so the points should not be joined with a line.' }
          : { label: 'A bar chart', misconception: 'bar-for-continuous', feedback: 'The independent variable is a number that can take any value, so a line graph shows the pattern between the readings.' },
        'A pie chart',
      ],
      hint: 'Is the thing they change a number on a scale, or a set of separate types?',
      explanation:
        inv.ivType === 'categoric'
          ? `The independent variable (${inv.iv.charAt(0).toLowerCase() + inv.iv.slice(1)}) is categoric (separate types), so draw a bar chart.`
          : `The independent variable (${inv.iv.charAt(0).toLowerCase() + inv.iv.slice(1)}) is continuous (a number that can take any value), so draw a line graph.`,
    })
  }),

  G('chem.ws.results.read-bar', 'chem.ws.results', [1, 3], (rng, d) => {
    // Metals listed most reactive first; the bigger temperature rises go to the more reactive metals, as they would.
    const all = ['Magnesium', 'Zinc', 'Iron', 'Tin', 'Lead']
    const drop = rng.int(0, 4)
    const metals = rng.shuffle(all.filter((_, i) => i !== drop))
    const values = rng
      .shuffle([4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26])
      .slice(0, 4)
      .sort((a, b) => b - a)
    const rankOf = (m: string) => all.filter((_, i) => i !== drop).indexOf(m)
    const bars = metals.map((label) => ({ label, value: values[rankOf(label)] ?? 0 }))
    const best = bars.reduce((a, b) => (b.value > a.value ? b : a))
    const worst = bars.reduce((a, b) => (b.value < a.value ? b : a))
    if (d <= 2) {
      return choice({
        rng,
        prompt: 'A student added four metal powders to copper sulfate solution and measured the temperature rise. Which metal gave the biggest temperature rise?',
        correct: best.label,
        wrong: bars.filter((b) => b !== best).map((b) => b.label),
        figure: { type: 'bar-chart', bars, yLabel: 'Temperature rise (°C)', showValues: d <= 1 },
        hint: 'Look for the tallest bar.',
        explanation: `${best.label} has the tallest bar (${best.value} °C).`,
      })
    }
    return num({
      prompt: `How much bigger was the temperature rise for ${best.label.toLowerCase()} than for ${worst.label.toLowerCase()}? Give your answer in °C.`,
      answer: best.value - worst.value,
      suffix: '°C',
      figure: { type: 'bar-chart', bars, yLabel: 'Temperature rise (°C)', showValues: true },
      hint: 'Read both bars, then subtract.',
      explanation: `${best.value} − ${worst.value} = ${best.value - worst.value} °C.`,
    })
  }),
]

export const wsGenerators: ItemGenerator[] = [...bankGenerators(hazards), ...bankGenerators(apparatus), ...resultsGenerators]
