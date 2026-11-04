import type { ItemGenerator } from '@/engine/registry'
import type { Rng } from '@/engine/types'
import { choice, matchItem, reveal } from '../../kit'
import { bankGenerators, G, fmt, lower, num, orderedChoice, round, type Bank } from './factory'

// =====================================================================================================================
// Working scientifically (Biology contexts): variables, fair tests, results, graphs, evaluation
// =====================================================================================================================

interface Investigation {
  /** Finishes "Maya is investigating ..." */
  aim: string
  iv: string
  dv: string
  controls: string[]
  /** Categoric independent variables are shown on a bar chart; continuous ones on a line graph. */
  ivKind: 'categoric' | 'continuous'
}

export const INVESTIGATIONS: Investigation[] = [
  {
    aim: 'how the distance of a lamp from some pondweed affects the number of bubbles of gas the pondweed gives off',
    iv: 'Distance of the lamp from the pondweed',
    dv: 'Number of bubbles given off in one minute',
    controls: ['Temperature of the water', 'Type and size of the piece of pondweed', 'Amount of carbon dioxide dissolved in the water'],
    ivKind: 'continuous',
  },
  {
    aim: 'how temperature affects how quickly the enzyme amylase breaks down starch',
    iv: 'Temperature of the mixture',
    dv: 'Time taken for the starch to be broken down',
    controls: ['Volume of starch solution', 'Volume of amylase solution', 'pH of the mixture'],
    ivKind: 'continuous',
  },
  {
    aim: 'how the length of time spent exercising affects a person\'s pulse rate',
    iv: 'Length of time spent exercising',
    dv: 'Pulse rate straight after exercising',
    controls: ['Type of exercise', 'The person doing the exercise', 'How hard the exercise is (for example, the step height)'],
    ivKind: 'continuous',
  },
  {
    aim: 'how the type of food affects how much it heats up some water when it burns',
    iv: 'Type of food',
    dv: 'Temperature rise of the water',
    controls: ['Mass of food burnt', 'Volume of water in the tube', 'Distance between the burning food and the tube'],
    ivKind: 'categoric',
  },
  {
    aim: 'how temperature affects how quickly yeast respires',
    iv: 'Temperature of the yeast mixture',
    dv: 'Number of bubbles of carbon dioxide produced in one minute',
    controls: ['Mass of yeast', 'Mass of sugar', 'Volume of water'],
    ivKind: 'continuous',
  },
  {
    aim: 'how temperature affects the number of cress seeds that germinate',
    iv: 'Temperature the seeds are kept at',
    dv: 'Number of seeds that have germinated after five days',
    controls: ['Number of seeds in each dish', 'Volume of water added to each dish', 'Type of seed'],
    ivKind: 'continuous',
  },
  {
    aim: 'how the colour of light affects the rate of photosynthesis in pondweed',
    iv: 'Colour of the light',
    dv: 'Number of bubbles given off in one minute',
    controls: ['Distance of the lamp from the pondweed', 'Temperature of the water', 'Type and size of the piece of pondweed'],
    ivKind: 'categoric',
  },
  {
    aim: 'whether more daisies grow in a sunny part of the school field or a shady part',
    iv: 'Part of the field (sunny or shady)',
    dv: 'Number of daisies in each quadrat',
    controls: ['Size of the quadrat', 'Number of quadrats used in each part', 'Day the daisies are counted'],
    ivKind: 'categoric',
  },
  {
    aim: 'how different activities (sitting, walking and jogging) affect breathing rate',
    iv: 'Type of activity',
    dv: 'Number of breaths taken in one minute',
    controls: ['The person doing the activities', 'How long each activity lasts', 'Rest time between activities'],
    ivKind: 'categoric',
  },
  {
    aim: 'how the concentration of sugar solution affects how much gas yeast produces',
    iv: 'Concentration of the sugar solution',
    dv: 'Volume of carbon dioxide produced in ten minutes',
    controls: ['Mass of yeast', 'Temperature', 'Volume of sugar solution'],
    ivKind: 'continuous',
  },
]

const ROLE = {
  iv: 'The independent variable is the one you change on purpose.',
  dv: 'The dependent variable is the one you measure to see the effect.',
  cv: 'A control variable is one you keep the same so the test is fair.',
}

// ----------------------------------------------------------------------------------------------- variables

const variablesBank: Bank = {
  skill: 'bio.ws.variables',
  terms: [
    { term: 'Independent variable', def: 'The variable you change on purpose in an investigation' },
    { term: 'Dependent variable', def: 'The variable you measure to see the effect of the change' },
    { term: 'Control variable', def: 'A variable you keep the same so that the test is fair' },
    { term: 'Categoric variable', def: 'A variable whose values are names or labels, such as colour or type of food' },
    { term: 'Continuous variable', def: 'A variable that can have any number value within a range, such as temperature or mass' },
  ],
  mcqs: [
    {
      q: 'Which of these is a continuous variable?',
      a: 'The temperature of a water bath',
      wrong: [
        { label: 'The colour of a light filter', misconception: 'categoric-as-continuous', feedback: 'Colours are names, not numbers: a categoric variable.' },
        { label: 'The type of food burnt', misconception: 'categoric-as-continuous', feedback: 'Types of food are labels: a categoric variable.' },
        { label: 'The species of plant', misconception: 'categoric-as-continuous', feedback: 'Species names are labels: a categoric variable.' },
      ],
      hint: 'A continuous variable is measured with a number and can take any value in a range.',
      why: 'Temperature can be any value (20 °C, 20.5 °C, 21.3 °C ...), so it is continuous. Colour, type of food and species are names, so they are categoric.',
      lv: [2, 4],
    },
    {
      q: 'Which of these is a categoric variable?',
      a: 'The type of exercise (walking, jogging or skipping)',
      wrong: [
        { label: 'The length of a leaf', misconception: 'continuous-as-categoric', feedback: 'Length is measured with a number and can be any value: continuous.' },
        { label: 'The mass of yeast', misconception: 'continuous-as-categoric', feedback: 'Mass is a number that can be any value: continuous.' },
        { label: 'The time taken for starch to break down', misconception: 'continuous-as-categoric', feedback: 'Time is measured with a number: continuous.' },
      ],
      hint: 'Categoric values are words or labels, not measurements.',
      why: 'Types of exercise are labels, so the variable is categoric. Length, mass and time are measured with numbers, so they are continuous.',
      lv: [2, 4],
    },
  ],
}

function variableGenerators(): ItemGenerator[] {
  return [
    G('bio.ws.variables.pick-iv', 'bio.ws.variables', [1, 3], (rng) => {
      const inv = rng.pick(INVESTIGATIONS)
      const cv = rng.pick(inv.controls)
      return choice({
        rng,
        prompt: `Maya is investigating ${inv.aim}.\nWhat is the independent variable?`,
        correct: inv.iv,
        wrong: [
          { label: inv.dv, misconception: 'iv-dv-swap', feedback: `That is what she measures, so it is the dependent variable. ${ROLE.iv}` },
          { label: cv, misconception: 'control-as-iv', feedback: `She keeps that the same, so it is a control variable. ${ROLE.iv}` },
        ],
        hint: 'Which one does Maya choose and change herself?',
        explanation: `${ROLE.iv} Here Maya changes: ${lower(inv.iv)}. She measures: ${lower(inv.dv)}.`,
      })
    }),
    G('bio.ws.variables.pick-dv', 'bio.ws.variables', [1, 3], (rng) => {
      const inv = rng.pick(INVESTIGATIONS)
      const cv = rng.pick(inv.controls)
      return choice({
        rng,
        prompt: `Maya is investigating ${inv.aim}.\nWhat is the dependent variable?`,
        correct: inv.dv,
        wrong: [
          { label: inv.iv, misconception: 'iv-dv-swap', feedback: `That is what she changes, so it is the independent variable. ${ROLE.dv}` },
          { label: cv, misconception: 'control-as-dv', feedback: `She keeps that the same, so it is a control variable. ${ROLE.dv}` },
        ],
        hint: 'Which one does Maya measure or count to see what happens?',
        explanation: `${ROLE.dv} Here Maya measures: ${lower(inv.dv)}.`,
      })
    }),
    G('bio.ws.variables.pick-control', 'bio.ws.variables', [2, 4], (rng) => {
      const inv = rng.pick(INVESTIGATIONS)
      const cv = rng.pick(inv.controls)
      return choice({
        rng,
        prompt: `Maya is investigating ${inv.aim}.\nWhich of these is a control variable?`,
        correct: cv,
        wrong: [
          { label: inv.iv, misconception: 'iv-as-control', feedback: `That is the variable she changes on purpose (independent). ${ROLE.cv}` },
          { label: inv.dv, misconception: 'dv-as-control', feedback: `That is what she measures (dependent). ${ROLE.cv}` },
        ],
        hint: 'Which one should stay the same every time, so it cannot affect the results?',
        explanation: `${ROLE.cv} The control variables here include: ${inv.controls.map(lower).join('; ')}.`,
      })
    }),
    G('bio.ws.variables.match', 'bio.ws.variables', [3, 5], (rng) => {
      const inv = rng.pick(INVESTIGATIONS)
      const cv = rng.pick(inv.controls)
      return matchItem({
        prompt: `Maya is investigating ${inv.aim}.\nMatch each type of variable to the right variable in her investigation.`,
        pairs: [
          { left: 'Independent variable', right: inv.iv },
          { left: 'Dependent variable', right: inv.dv },
          { left: 'Control variable', right: cv },
        ],
        hint: 'Changed, measured, kept the same.',
        explanation: `Independent (changed): ${lower(inv.iv)}.\nDependent (measured): ${lower(inv.dv)}.\nControl (kept the same): ${lower(cv)}.`,
      })
    }),
    G('bio.ws.variables.kind', 'bio.ws.variables', [2, 4], (rng) => {
      const inv = rng.pick(INVESTIGATIONS)
      const correct = inv.ivKind === 'categoric' ? 'Categoric' : 'Continuous'
      const other = inv.ivKind === 'categoric' ? 'Continuous' : 'Categoric'
      return orderedChoice({
        prompt: `Maya is investigating ${inv.aim}. Her independent variable is: ${lower(inv.iv)}.\nIs this a categoric or a continuous variable?`,
        correct,
        wrong: [
          {
            label: other,
            misconception: `${other.toLowerCase()}-confused`,
            feedback: inv.ivKind === 'categoric' ? 'Its values are names or labels, not numbers on a scale.' : 'It is measured with numbers and can take any value in a range.',
          },
        ],
        order: ['Categoric', 'Continuous'],
        hint: 'Are the values words (labels) or numbers that could be anything in a range?',
        explanation:
          inv.ivKind === 'categoric'
            ? `${inv.iv} has values that are labels, so it is categoric. Results for a categoric independent variable go on a bar chart.`
            : `${inv.iv} is measured with numbers and can take any value in a range, so it is continuous. Results go on a line graph.`,
      })
    }),
  ]
}

// ----------------------------------------------------------------------------------------------- fair tests

const fairTestBank: Bank = {
  skill: 'bio.ws.fair-test',
  terms: [
    { term: 'Fair test', def: 'An investigation where only the independent variable is changed and all the other variables are kept the same' },
    { term: 'Hypothesis', def: 'An idea that explains something and can be tested by an investigation' },
    { term: 'Prediction', def: 'A statement of what you think will happen in an investigation, often with a reason' },
    { term: 'Hazard', def: 'Something that could cause harm, such as a hot liquid or a flammable chemical' },
    { term: 'Risk assessment', def: 'A plan that lists the hazards in an investigation and how to reduce the chance of harm' },
    { term: 'Method', def: 'The step-by-step instructions for carrying out an investigation' },
  ],
  mcqs: [
    {
      q: 'Why do scientists repeat their measurements in an investigation?',
      a: 'To spot any anomalous results and to calculate a mean',
      wrong: [
        { label: 'To make sure they get the answer they predicted', misconception: 'confirm-prediction', feedback: 'Results should be recorded honestly, even if they do not match the prediction.' },
        { label: 'To make the investigation take longer', misconception: 'repeat-pointless', feedback: 'Repeats are useful: they show whether results are consistent.' },
        { label: 'Because the first result is always wrong', misconception: 'first-wrong', feedback: 'The first result is not always wrong, but repeats let you check.' },
      ],
      hint: 'If one result is very different from the others, how would you know?',
      why: 'Repeating lets you see if a result does not fit the pattern (an anomaly), and lets you calculate a mean, which is a better estimate than a single reading.',
      lv: [1, 3],
    },
    {
      q: 'Why must the control variables be kept the same?',
      a: 'So that any change in the dependent variable is caused only by the independent variable',
      wrong: [
        { label: 'So that the investigation is quicker to do', misconception: 'control-speed', feedback: 'It is about fairness, not speed.' },
        { label: 'So that the results come out the same every time', misconception: 'control-same-results', feedback: 'The results should change as the independent variable changes; that is the point of the investigation.' },
        { label: 'So that you do not need to repeat the investigation', misconception: 'control-no-repeats', feedback: 'You should still repeat readings in a fair test.' },
      ],
      hint: 'If two things changed at once, could you tell which one caused the effect?',
      why: 'If another variable changed as well, you could not tell which variable caused the change in your results. Keeping control variables the same makes it a fair test.',
      lv: [2, 4],
    },
    {
      q: 'Ethanol is used to remove the green colour from a leaf. Why is the tube of ethanol heated in a beaker of hot water instead of directly over a Bunsen flame?',
      a: 'Ethanol is flammable, so it must be kept away from flames',
      wrong: [
        { label: 'Ethanol is corrosive and would melt the tube', misconception: 'hazard-confused', feedback: 'The main hazard of ethanol is that it catches fire easily.' },
        { label: 'A Bunsen flame is not hot enough', misconception: 'flame-too-cool', feedback: 'A flame is plenty hot; the problem is that ethanol vapour can catch fire.' },
        { label: 'Hot water makes the ethanol turn blue-black', misconception: 'iodine-confusion', feedback: 'Blue-black is the colour of iodine with starch, not ethanol.' },
      ],
      hint: 'Think about the hazard symbol you would find on a bottle of ethanol.',
      why: 'Ethanol is highly flammable. Heating it in a water bath (with the Bunsen burner turned off, or using water from a kettle) avoids a fire.',
      lv: [3, 5],
    },
    {
      q: 'Which of these is the best prediction for an investigation into how temperature affects how quickly yeast respires?',
      a: 'As the temperature increases, more bubbles will be produced, because the yeast respires faster when it is warmer',
      wrong: [
        { label: 'Yeast is a fungus', misconception: 'fact-not-prediction', feedback: 'That is a true fact, but it does not say what will happen in the investigation.' },
        { label: 'The yeast will do something', misconception: 'vague-prediction', feedback: 'A prediction should say what will change and how.' },
        { label: 'I will use 5 g of yeast and 10 g of sugar', misconception: 'method-not-prediction', feedback: 'That is part of the method, not a prediction.' },
      ],
      hint: 'A good prediction says what will happen to the dependent variable when the independent variable changes, and why.',
      why: 'A prediction links the two variables ("as ... increases, ... will ...") and ideally gives a scientific reason.',
      lv: [2, 4],
    },
  ],
  orders: [
    {
      prompt: 'Put these steps for measuring the effect of exercise on pulse rate in order.',
      steps: [
        'Sit still for a few minutes, then measure your resting pulse rate',
        'Do step-ups for exactly two minutes',
        'Immediately measure your pulse rate again',
        'Rest until your pulse rate is back to its resting value',
        'Repeat the test and calculate a mean',
      ],
      direction: ['first', 'last'],
      hint: 'You need a starting value before you can see the effect of exercise.',
      why: 'Measure the resting pulse first, exercise for a fixed time, measure straight away, let the pulse recover, then repeat so you can calculate a mean.',
      lv: [3, 5],
    },
    {
      prompt: 'Put these steps for finding out how much energy is in a piece of food in order.',
      steps: [
        'Put 20 cm^{3} of water into a boiling tube held in a clamp',
        'Measure the starting temperature of the water',
        'Set fire to the piece of food on a mounted needle, using a Bunsen burner',
        'Hold the burning food under the boiling tube until it stops burning',
        'Measure the final temperature of the water and work out the temperature rise',
      ],
      direction: ['first', 'last'],
      hint: 'You need to know the starting temperature before any heat goes into the water.',
      why: 'Set up the water, record its starting temperature, burn the food under the tube, then record the final temperature. The bigger the temperature rise, the more energy the food released.',
      lv: [3, 5],
    },
  ],
}

function fairTestGenerators(): ItemGenerator[] {
  return [
    G('bio.ws.fair-test.unfair', 'bio.ws.fair-test', [2, 4], (rng) => {
      const inv = rng.pick(INVESTIGATIONS)
      const cv = rng.pick(inv.controls)
      return choice({
        rng,
        prompt: `Maya is investigating ${inv.aim}. Halfway through, she changes this as well: ${lower(cv)}.\nWhat is the problem?`,
        correct: `She cannot tell whether a change in the results was caused by the independent variable or by the change in ${lower(cv)}`,
        wrong: [
          { label: 'There is no problem, because she still measured the dependent variable', misconception: 'measured-so-fine', feedback: 'Measuring is not enough: if two things change, you cannot tell which caused the effect.' },
          { label: 'She will need a different dependent variable', misconception: 'change-dv', feedback: 'The dependent variable is fine; the problem is that a control variable changed.' },
          { label: 'Her results will definitely all be the same', misconception: 'results-same', feedback: 'Her results could be anything; the problem is that she cannot say what caused them.' },
        ],
        hint: 'How many variables should be changed in a fair test?',
        explanation: `${cap1(lower(cv))} should be a control variable. If it changes too, the test is no longer fair: any difference could be caused by either variable.`,
      })
    }),
    G('bio.ws.fair-test.why-control', 'bio.ws.fair-test', [3, 5], (rng) => {
      const inv = rng.pick(INVESTIGATIONS)
      const cv = rng.pick(inv.controls)
      return reveal({
        prompt: `Maya is investigating ${inv.aim}. Explain why she must keep this the same: ${lower(cv)}.`,
        model: `${cap1(lower(cv))} is a control variable. If it changed, it could also affect the results (${lower(inv.dv)}). Then Maya could not tell whether the change in her results was caused by the independent variable (${lower(inv.iv)}) or by the change in ${lower(cv)}. Keeping it the same makes it a fair test.`,
        checklist: ['Says it is a control variable', 'Says it could also affect the results (the dependent variable)', 'Says she could not tell what caused the change', 'Uses the words "fair test"'],
        hint: 'What would happen to your conclusion if two things changed at once?',
      })
    }),
  ]
}

const cap1 = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// ----------------------------------------------------------------------------------------------- results

interface ResultsContext {
  title: string
  ivHead: string
  ivValues: string[]
  dvHead: string
  /** Typical value of the dependent variable for each row (rows follow ivValues). */
  base: number[]
  unit: string
  ivName: string
  dvName: string
  /** How to name one row, e.g. "at 20 °C". */
  row: (v: string) => string
  /** Largest value that makes sense (e.g. 50 seeds out of 50). Anomalies never go above it. */
  max?: number
}

const RESULTS: ResultsContext[] = [
  { title: 'Bubbles of gas from pondweed at different lamp distances', ivHead: 'Distance of lamp (cm)', ivValues: ['10', '20', '30', '40'], dvHead: 'Bubbles per minute', base: [42, 30, 21, 14], unit: 'bubbles per minute', ivName: 'distance of the lamp', dvName: 'number of bubbles per minute', row: (v) => `at ${v} cm` },
  { title: 'Pulse rate after exercising for different lengths of time', ivHead: 'Time exercising (minutes)', ivValues: ['0', '1', '2', '3'], dvHead: 'Pulse rate (beats per minute)', base: [72, 96, 112, 124], unit: 'beats per minute', ivName: 'time spent exercising', dvName: 'pulse rate', row: (v) => `after ${v} minute${v === '1' ? '' : 's'}` },
  { title: 'Time for amylase to break down starch at different temperatures', ivHead: 'Temperature (°C)', ivValues: ['20', '30', '40'], dvHead: 'Time (s)', base: [180, 120, 60], unit: 's', ivName: 'temperature', dvName: 'time taken', row: (v) => `at ${v} °C` },
  { title: 'Bubbles of carbon dioxide from yeast at different temperatures', ivHead: 'Temperature (°C)', ivValues: ['15', '25', '35'], dvHead: 'Bubbles per minute', base: [8, 19, 33], unit: 'bubbles per minute', ivName: 'temperature', dvName: 'number of bubbles per minute', row: (v) => `at ${v} °C` },
  { title: 'Number of cress seeds (out of 50) germinated at different temperatures', ivHead: 'Temperature (°C)', ivValues: ['5', '15', '25'], dvHead: 'Seeds germinated', base: [12, 31, 44], unit: 'seeds', ivName: 'temperature', dvName: 'number of seeds that germinated', row: (v) => `at ${v} °C`, max: 50 },
  { title: 'Breathing rate during different activities', ivHead: 'Activity', ivValues: ['Sitting', 'Walking', 'Jogging'], dvHead: 'Breaths per minute', base: [14, 20, 32], unit: 'breaths per minute', ivName: 'activity', dvName: 'breathing rate', row: (v) => `for ${v.toLowerCase()}` },
]

/** Three repeat readings around `m` (small spread); sum divisible by 3 when `exact`. */
function repeats(rng: Rng, m: number, exact: boolean): number[] {
  const spread = Math.max(1, Math.round(m * 0.04))
  for (let tries = 0; tries < 50; tries++) {
    const v = [m + rng.int(-spread, spread), m + rng.int(-spread, spread), m + rng.int(-spread, spread)]
    const s = v[0]! + v[1]! + v[2]!
    if (new Set(v).size < 2) continue
    if (exact === (s % 3 === 0)) return v
  }
  return exact ? [m - spread, m, m + spread] : [m - spread, m, m + spread + 1]
}

function resultsTable(rng: Rng, ctx: ResultsContext, exactRow: number, exact: boolean, anomaly?: { row: number; trial: number }) {
  const data = ctx.base.map((b, i) => repeats(rng, b, i === exactRow ? exact : rng.chance(0.5)))
  if (anomaly) {
    const row = data[anomaly.row]!
    const b = ctx.base[anomaly.row]!
    // Far enough from the rest that it is clearly anomalous, and in a direction that keeps it positive.
    const high = Math.round(b * 1.6) + 1
    const canGoHigh = ctx.max === undefined || high <= ctx.max
    row[anomaly.trial] = canGoHigh && (rng.chance(0.5) || b < 20) ? high : Math.round(b * 0.45)
  }
  return {
    data,
    figure: {
      type: 'table' as const,
      head: [ctx.ivHead, 'Trial 1', 'Trial 2', 'Trial 3'],
      rows: ctx.ivValues.map((iv, i) => [iv, ...data[i]!.map(String)]),
    },
  }
}

const resultsBank: Bank = {
  skill: 'bio.ws.results',
  terms: [
    { term: 'Mean', def: 'The total of a set of values divided by how many values there are' },
    { term: 'Range', def: 'The difference between the largest and smallest values in a set of results' },
    { term: 'Anomalous result', def: 'A result that does not fit the pattern of the other results' },
    { term: 'Trial', def: 'One run of an experiment; several of these give repeat readings' },
    { term: 'Results table', def: 'A table for recording measurements, with units in the column headings' },
  ],
  mcqs: [
    {
      q: 'In a results table, which column should the independent variable go in?',
      a: 'The first (left-hand) column',
      wrong: [
        { label: 'The last (right-hand) column', misconception: 'iv-last-column', feedback: 'The last columns are for the measurements (and the mean).' },
        { label: 'It does not go in the table', misconception: 'iv-not-recorded', feedback: 'You must record the values you chose for the independent variable.' },
        { label: 'Any column, as long as it has a heading', misconception: 'any-column', feedback: 'The convention is to put the independent variable first, so the table is easy to read.' },
      ],
      hint: 'You read a table from left to right: what you changed, then what you found.',
      why: 'The independent variable goes in the first column, then the dependent variable readings (and the mean) in the columns after it.',
      lv: [1, 3],
    },
    {
      q: 'Where should the units go in a results table?',
      a: 'In the column headings, for example "Time (s)"',
      wrong: [
        { label: 'After every number in the table', misconception: 'units-everywhere', feedback: 'That works but is cluttered; scientists put units once, in the heading.' },
        { label: 'Nowhere: units are not needed in a table', misconception: 'no-units', feedback: 'Without units, a number like 20 could mean 20 seconds or 20 minutes.' },
        { label: 'Only at the bottom of the table', misconception: 'units-bottom', feedback: 'Units go in the column headings.' },
      ],
      hint: 'Look at how a heading like "Temperature (°C)" is written.',
      why: 'Units go in the column headings in brackets, so the numbers in the table do not need them.',
      lv: [1, 3],
    },
    {
      q: 'When you calculate a mean, what should you do with an anomalous result?',
      a: 'Leave it out of the calculation',
      wrong: [
        { label: 'Include it, because every result counts', misconception: 'include-anomaly', feedback: 'An anomalous result would pull the mean away from the true value, so it is left out.' },
        { label: 'Double it', misconception: 'double-anomaly', feedback: 'There is no reason to double a result.' },
        { label: 'Replace it with the result you expected', misconception: 'invent-result', feedback: 'You must never make up results. Leave it out, or repeat that reading.' },
      ],
      hint: 'An anomaly does not fit the pattern. Would it make the mean better or worse?',
      why: 'Anomalous results are left out when calculating a mean (and, if possible, that reading is repeated). You should still record it and mention it.',
      lv: [2, 4],
    },
  ],
}

function resultsGenerators(): ItemGenerator[] {
  return [
    G('bio.ws.results.mean', 'bio.ws.results', [2, 4], (rng, d) => {
      const ctx = rng.pick(RESULTS)
      const row = rng.int(0, ctx.ivValues.length - 1)
      const exact = d <= 2
      const anomaly = d >= 4 ? { row, trial: rng.int(0, 2) } : undefined
      const { data, figure } = resultsTable(rng, ctx, row, exact || !!anomaly, anomaly)
      const vals = data[row]!
      const used = anomaly ? vals.filter((_, i) => i !== anomaly.trial) : vals
      const sum = used.reduce((a, b) => a + b, 0)
      const mean = sum / used.length
      const ans = round(mean, 1)
      const whole = Number.isInteger(mean)
      const allMean = round(vals.reduce((a, b) => a + b, 0) / 3, 1)
      return num({
        prompt: `${ctx.title}.\nCalculate the mean ${ctx.dvName} ${ctx.row(ctx.ivValues[row]!)}${anomaly ? ', leaving out the anomalous result' : ''}.${whole ? '' : ' Give your answer to 1 decimal place.'}`,
        figure,
        answer: ans,
        tolerance: whole ? undefined : 0.05,
        suffix: ctx.unit,
        hint: anomaly ? 'Find the result that does not fit, then add up the other two and divide by 2.' : 'Add up the three trials, then divide by how many there are.',
        explanation: `${used.join(' + ')} = ${sum}. ${sum} ÷ ${used.length} = ${fmt(round(mean, 3))}${whole || round(mean, 3) === ans ? '' : `, which is ${fmt(ans)} to 1 decimal place`}.${anomaly ? ` The anomalous result (${vals[anomaly.trial]}) was left out because it is far from the other two.` : ''}`,
        errors: [
          ...(anomaly ? [{ values: [allMean], tag: 'included-anomaly', message: 'That includes the anomalous result. Leave it out and divide by 2.' }] : []),
          { values: [sum], tag: 'forgot-divide', message: 'That is the total. Now divide by the number of results.' },
        ],
      })
    }),
    G('bio.ws.results.anomaly', 'bio.ws.results', [2, 4], (rng) => {
      const ctx = rng.pick(RESULTS)
      const row = rng.int(0, ctx.ivValues.length - 1)
      const trial = rng.int(0, 2)
      const { data, figure } = resultsTable(rng, ctx, row, true, { row, trial })
      const label = (r: number, t: number) => `Trial ${t + 1} ${ctx.row(ctx.ivValues[r]!)} (${data[r]![t]})`
      const wrongs: string[] = []
      for (let k = 0; k < 20 && wrongs.length < 3; k++) {
        const r = rng.int(0, ctx.ivValues.length - 1)
        const t = rng.int(0, 2)
        if (r === row && t === trial) continue
        const l = label(r, t)
        if (!wrongs.includes(l)) wrongs.push(l)
      }
      return choice({
        rng,
        prompt: `${ctx.title}.\nWhich result is anomalous?`,
        figure,
        correct: label(row, trial),
        wrong: wrongs.map((w) => ({ label: w, misconception: 'not-anomalous', feedback: 'That result is close to the other trials in its row.' })),
        hint: 'Compare the three trials in each row. Which one is far away from the other two?',
        explanation: `${label(row, trial)} is very different from the other trials in the same row (${data[row]!.filter((_, i) => i !== trial).join(' and ')}), so it does not fit the pattern.`,
      })
    }),
    G('bio.ws.results.range', 'bio.ws.results', [2, 3], (rng) => {
      const ctx = rng.pick(RESULTS)
      const row = rng.int(0, ctx.ivValues.length - 1)
      const { data, figure } = resultsTable(rng, ctx, row, true)
      const vals = data[row]!
      const hi = Math.max(...vals)
      const lo = Math.min(...vals)
      return num({
        prompt: `${ctx.title}.\nWhat is the range of the three trials ${ctx.row(ctx.ivValues[row]!)}? (Range = largest value − smallest value.)`,
        figure,
        answer: hi - lo,
        suffix: ctx.unit,
        hint: 'Find the biggest and smallest of the three trials in that row.',
        explanation: `Largest ${hi}, smallest ${lo}. Range = ${hi} − ${lo} = ${hi - lo}. A small range means the repeats are close together.`,
        errors: [{ values: [hi], tag: 'range-is-max', message: 'That is the largest value. Subtract the smallest from it.' }],
      })
    }),
  ]
}

// ----------------------------------------------------------------------------------------------- graphs

const niceStep = (span: number, target: number) => {
  const raw = span / target
  const pow = 10 ** Math.floor(Math.log10(raw))
  const m = raw / pow
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * pow
}

interface LineContext {
  intro: string
  xLabel: string
  yLabel: string
  xName: string
  yName: string
  xUnit: string
  yUnit: string
  xs: number[]
  slopes: number[]
  intercepts: number[]
}

const LINES: LineContext[] = [
  {
    intro: 'Maya measured the height of a bean seedling every 2 days and drew this graph with a line of best fit.',
    xLabel: 'Time (days)',
    yLabel: 'Height (cm)',
    xName: 'time',
    yName: 'height',
    xUnit: 'days',
    yUnit: 'cm',
    xs: [2, 4, 6, 8, 10],
    slopes: [1, 1.5, 2, 2.5, 3],
    intercepts: [0, 1, 2],
  },
  {
    intro: 'Maya burnt different masses of bread under a tube of water and measured the temperature rise of the water.',
    xLabel: 'Mass of bread (g)',
    yLabel: 'Temperature rise (°C)',
    xName: 'mass of bread',
    yName: 'temperature rise',
    xUnit: 'g',
    yUnit: '°C',
    xs: [0.5, 1, 1.5, 2],
    slopes: [10, 15, 20],
    intercepts: [0],
  },
  {
    intro: 'Maya added different masses of yeast to sugar solution and measured the volume of carbon dioxide made in 10 minutes.',
    xLabel: 'Mass of yeast (g)',
    yLabel: 'Volume of gas (cm^{3})',
    xName: 'mass of yeast',
    yName: 'volume of gas',
    xUnit: 'g',
    yUnit: 'cm^{3}',
    xs: [1, 2, 3, 4, 5],
    slopes: [4, 5, 6, 8, 10],
    intercepts: [0],
  },
]

function lineGraph(rng: Rng) {
  const ctx = rng.pick(LINES)
  const s = rng.pick(ctx.slopes)
  const c = rng.pick(ctx.intercepts)
  const f = (x: number) => round(c + s * x, 3)
  const xMax = ctx.xs[ctx.xs.length - 1]!
  const noiseStep = Math.max(0.5, round(s * (ctx.xs[1]! - ctx.xs[0]!) * 0.15, 1))
  const points: [number, number][] = ctx.xs.map((x) => [x, round(Math.max(0, f(x) + rng.pick([-1, 0, 1]) * noiseStep), 2)])
  const line: [[number, number], [number, number]] = [
    [0, f(0)],
    [xMax, f(xMax)],
  ]
  const maxY = Math.max(...points.map((p) => p[1]), f(0), f(xMax), 1)
  const sy = niceStep(maxY, 5)
  const maxX = Math.max(xMax, 1)
  const sx = niceStep(maxX, 5)
  return { ctx, s, c, f, points, line, sy, sx, figure: { type: 'scatter' as const, points, line, xLabel: ctx.xLabel, yLabel: ctx.yLabel } }
}

/** x values on vertical grid lines inside the data range. */
const gridXs = (sx: number, xMax: number) => {
  const out: number[] = []
  for (let v = sx; v <= xMax + 1e-9; v += sx) out.push(round(v, 3))
  return out
}

const graphsBank: Bank = {
  skill: 'bio.ws.graphs',
  terms: [
    { term: 'Line of best fit', def: 'A smooth line or curve drawn through the middle of the points, with about as many points on each side' },
    { term: 'Positive correlation', def: 'As one variable increases, the other variable also increases' },
    { term: 'Negative correlation', def: 'As one variable increases, the other variable decreases' },
    { term: 'No correlation', def: 'There is no pattern linking the two variables' },
    { term: 'Bar chart', def: 'A graph used when the independent variable is categoric (names or labels)' },
    { term: 'Line graph', def: 'A graph used when both variables are continuous (numbers on a scale)' },
  ],
  mcqs: [
    {
      q: 'On a graph of results, which axis should the independent variable go on?',
      a: 'The x-axis (horizontal)',
      wrong: [
        { label: 'The y-axis (vertical)', misconception: 'iv-on-y', feedback: 'The y-axis is for the dependent variable: what you measured.' },
        { label: 'Either axis, it does not matter', misconception: 'axis-any', feedback: 'There is a convention: independent on x, dependent on y.' },
        { label: 'It is not plotted', misconception: 'iv-not-plotted', feedback: 'Both variables are plotted: one on each axis.' },
      ],
      hint: 'What you change goes along the bottom.',
      why: 'The independent variable (what you change) goes on the x-axis and the dependent variable (what you measure) goes on the y-axis.',
      lv: [1, 3],
    },
    {
      q: 'Maya draws a line graph. One point is far away from her line of best fit. What should she do?',
      a: 'Treat it as an anomalous result: ignore it when drawing the line, and repeat that reading if she can',
      wrong: [
        { label: 'Bend the line so it goes through that point', misconception: 'line-through-every-point', feedback: 'A line of best fit shows the overall pattern; it does not have to go through every point.' },
        { label: 'Rub the point out and pretend it never happened', misconception: 'hide-anomaly', feedback: 'Never hide results. Record the anomaly, but leave it out of the line.' },
        { label: 'Start the whole investigation again with a new independent variable', misconception: 'restart', feedback: 'One odd point does not mean the whole investigation was wrong.' },
      ],
      hint: 'What is a point that does not fit the pattern called?',
      why: 'A point far from the pattern is an anomalous result. Leave it out when drawing the line of best fit, mention it, and repeat that measurement if possible.',
      lv: [3, 5],
    },
  ],
}

function graphGenerators(): ItemGenerator[] {
  return [
    G('bio.ws.graphs.which-graph', 'bio.ws.graphs', [1, 4], (rng) => {
      const inv = rng.pick(INVESTIGATIONS)
      const correct = inv.ivKind === 'categoric' ? 'A bar chart' : 'A line graph'
      const other = inv.ivKind === 'categoric' ? 'A line graph' : 'A bar chart'
      return choice({
        rng,
        prompt: `Maya investigated ${inv.aim}.\nWhat type of graph should she draw to show her results?`,
        correct,
        wrong: [
          {
            label: other,
            misconception: 'graph-type',
            feedback: inv.ivKind === 'categoric' ? 'Her independent variable is categoric (labels), so the points could not be joined in a meaningful line.' : 'Her independent variable is continuous (numbers), so a line graph shows the pattern between the values.',
          },
          { label: 'A pie chart', misconception: 'pie-chart', feedback: 'Pie charts show parts of a whole, not how one variable affects another.' },
        ],
        hint: `Her independent variable is: ${lower(inv.iv)}. Is it categoric or continuous?`,
        explanation:
          inv.ivKind === 'categoric'
            ? `The independent variable (${lower(inv.iv)}) is categoric, so a bar chart is used.`
            : `The independent variable (${lower(inv.iv)}) is continuous, so a line graph is used.`,
      })
    }),
    G('bio.ws.graphs.read', 'bio.ws.graphs', [2, 4], (rng, d) => {
      const g = lineGraph(rng)
      const xMax = g.ctx.xs[g.ctx.xs.length - 1]!
      const xsGrid = gridXs(g.sx, xMax)
      // Prefer x values where the line meets a grid line or a half-square, so the reading is clear.
      const good = xsGrid.filter((x) => Math.abs(g.f(x) / (g.sy / 2) - Math.round(g.f(x) / (g.sy / 2))) < 1e-9)
      if (d >= 4) {
        // Reverse read: from a y value on a grid line, find x.
        const ys: number[] = []
        for (let y = g.sy; y < g.f(xMax) - 1e-9; y += g.sy) if (y > g.f(0)) ys.push(round(y, 3))
        const goodY = ys.filter((y) => {
          const x = (y - g.c) / g.s
          return Math.abs(x / (g.sx / 2) - Math.round(x / (g.sx / 2))) < 1e-9
        })
        if (goodY.length) {
          const y = rng.pick(goodY)
          const x = round((y - g.c) / g.s, 3)
          return num({
            prompt: `${g.ctx.intro}\nUse the line of best fit to find the ${g.ctx.xName} when the ${g.ctx.yName} is ${fmt(y)} ${g.ctx.yUnit}.`,
            figure: g.figure,
            answer: x,
            tolerance: g.sx / 4,
            suffix: g.ctx.xUnit,
            hint: `Find ${fmt(y)} on the y-axis, go across to the line, then straight down to the x-axis.`,
            explanation: `Go across from ${fmt(y)} ${g.ctx.yUnit} to the line, then down: the ${g.ctx.xName} is ${fmt(x)} ${g.ctx.xUnit}.`,
          })
        }
      }
      const x = rng.pick(good.length ? good : xsGrid)
      const y = g.f(x)
      return num({
        prompt: `${g.ctx.intro}\nUse the line of best fit to find the ${g.ctx.yName} when the ${g.ctx.xName} is ${fmt(x)} ${g.ctx.xUnit}.`,
        figure: g.figure,
        answer: y,
        tolerance: good.length ? g.sy / 4 : g.sy / 2,
        suffix: g.ctx.yUnit,
        hint: `Find ${fmt(x)} on the x-axis, go up to the line (not to a point), then across to the y-axis.`,
        explanation: `Go up from ${fmt(x)} ${g.ctx.xUnit} to the line of best fit, then across: the ${g.ctx.yName} is about ${fmt(round(y, 2))} ${g.ctx.yUnit}.`,
      })
    }),
    G('bio.ws.graphs.trend', 'bio.ws.graphs', [2, 4], (rng) => {
      const ctx = rng.pick(RESULTS.filter((r) => !isNaN(Number(r.ivValues[0]))))
      const up = ctx.base[ctx.base.length - 1]! > ctx.base[0]!
      const name = ctx.ivName
      const dvName = ctx.dvName
      const points: [number, number][] = ctx.ivValues.map((v, i) => [Number(v), ctx.base[i]!])
      return choice({
        rng,
        prompt: `${ctx.title}. Which sentence describes the pattern in the results?`,
        figure: { type: 'scatter', points, xLabel: ctx.ivHead, yLabel: ctx.dvHead },
        correct: `As the ${name} increases, the ${dvName} ${up ? 'increases' : 'decreases'}`,
        wrong: [
          { label: `As the ${name} increases, the ${dvName} ${up ? 'decreases' : 'increases'}`, misconception: 'trend-reversed', feedback: 'Read the graph from left to right: are the points going up or down?' },
          { label: `The ${dvName} stays the same whatever the ${name}`, misconception: 'trend-none', feedback: 'The points clearly change from left to right.' },
          { label: `As the ${dvName} increases, the ${name} stays the same`, misconception: 'trend-backwards', feedback: 'Describe how the dependent variable changes as the independent variable increases.' },
        ],
        hint: 'Read from left to right along the x-axis. What happens to the height of the points?',
        explanation: `Moving to the right (${name} increasing), the points go ${up ? 'up' : 'down'}, so the ${dvName} ${up ? 'increases' : 'decreases'}. This is a ${up ? 'positive' : 'negative'} correlation.`,
      })
    }),
  ]
}

// ----------------------------------------------------------------------------------------------- evaluating

const evaluateBank: Bank = {
  skill: 'bio.ws.evaluate',
  terms: [
    { term: 'Repeatable', def: 'When the same person uses the same method and equipment again, they get similar results' },
    { term: 'Reproducible', def: 'When a different person, or a different method or equipment, is used, similar results are obtained' },
    { term: 'Accurate', def: 'Close to the true value' },
    { term: 'Precise', def: 'Repeat measurements are close together, with very little spread' },
    { term: 'Resolution', def: 'The smallest change a measuring instrument can show' },
    { term: 'Valid', def: 'Results come from a fair test and measure what the investigation was meant to measure' },
  ],
  mcqs: [
    {
      q: 'How could Maya check whether her results are reproducible?',
      a: 'Ask another group to do the same investigation and compare their results with hers',
      wrong: [
        { label: 'Do the investigation again herself with exactly the same equipment', misconception: 'repeatable-vs-reproducible', feedback: 'That checks if results are repeatable. Reproducible means someone else (or other equipment) gets similar results.' },
        { label: 'Use a bigger beaker', misconception: 'random-change', feedback: 'Changing the beaker on its own does not check anything.' },
        { label: 'Draw a bigger graph', misconception: 'graph-size', feedback: 'The size of a graph does not change how trustworthy the results are.' },
      ],
      hint: 'Reproducible is about someone else, or different equipment, getting the same results.',
      why: 'Results are reproducible if another person, or a different method or equipment, gives similar results. Repeating it yourself checks if they are repeatable.',
      lv: [3, 5],
    },
    {
      q: 'Maya times how long it takes for a colour change using a stopwatch. Why might her times not be very accurate?',
      a: 'Her reaction time when starting and stopping the stopwatch adds an error',
      wrong: [
        { label: 'Stopwatches measure in minutes, not seconds', misconception: 'stopwatch-units', feedback: 'Stopwatches usually show hundredths of a second.' },
        { label: 'Colour changes always happen instantly', misconception: 'instant-colour', feedback: 'If it were instant there would be nothing to time.' },
        { label: 'The stopwatch is too precise', misconception: 'too-precise', feedback: 'Too much precision is not a problem; human reaction time is.' },
      ],
      hint: 'Think about the person pressing the buttons.',
      why: 'A person takes a fraction of a second to react when starting and stopping a stopwatch, and it can be hard to judge exactly when a colour has changed.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Maya tested how temperature affects how quickly amylase breaks down starch. She only did one trial at each temperature, and she let the volume of amylase vary a little each time. Evaluate her method and suggest two improvements.',
      model:
        'Maya\'s method is not a fair test, because the volume of amylase changed as well as the temperature, so she cannot be sure the temperature caused the changes in time. She should measure the same volume of amylase each time using a measuring cylinder or syringe. Doing only one trial means she cannot spot anomalous results, so she should repeat each temperature at least three times and calculate a mean.',
      checklist: ['Says the volume of amylase should be kept the same (control variable)', 'Says it is not a fair test, or explains why', 'Suggests repeating each temperature and calculating a mean', 'Says repeats help spot anomalous results'],
      hint: 'Look for a variable that should have been controlled, and think about why one trial is not enough.',
    },
    {
      prompt: 'Two groups investigated how the distance of a lamp affects the number of bubbles from pondweed. Group A counted bubbles for 1 minute each time. Group B counted for 10 seconds and did not use the same piece of pondweed each time. Whose results are likely to be more trustworthy? Explain why.',
      model:
        'Group A\'s results are likely to be more trustworthy. Counting for a whole minute gives bigger numbers, so a miscounted bubble or a gap between bubbles makes less difference. Group B changed the piece of pondweed, which is a control variable, so their test was not fair: different pieces might give off bubbles at different rates whatever the light.',
      checklist: ['Chooses Group A', 'Explains why counting for longer is better', 'Says the pondweed is a control variable (or the test was not fair)', 'Links the change in pondweed to the results being affected'],
      hint: 'Which group kept everything the same apart from the distance?',
    },
    {
      prompt: 'Maya wants to find out whether pupils who sleep more have faster reaction times. She tests three friends. Explain why her conclusion might not be valid, and how she could improve the investigation.',
      model:
        'Three people is a very small sample, so the results could be due to chance or to other differences between the friends, such as how much practice they have had. Many other variables, like time of day or how tired they feel, are hard to control. She could test many more pupils, use the same reaction-time test at the same time of day for everyone, and repeat each test to calculate a mean.',
      checklist: ['Says the sample is too small', 'Names another variable that could affect reaction time', 'Suggests testing more people', 'Suggests repeats or controlling variables'],
      hint: 'How many people did she test? What else might affect reaction time?',
    },
  ],
}

function evaluateGenerators(): ItemGenerator[] {
  return [
    G('bio.ws.evaluate.precise', 'bio.ws.evaluate', [2, 4], (rng) => {
      const ctx = rng.pick(RESULTS)
      const i = rng.int(0, ctx.base.length - 1)
      const m = ctx.base[i]!
      const tight = [m - 1, m, m + 1]
      const sp = Math.max(4, Math.round(m * 0.25))
      const loose = [m - sp, m + Math.round(sp / 2), m + sp]
      const aFirst = rng.chance(0.5)
      const A = aFirst ? tight : loose
      const B = aFirst ? loose : tight
      return orderedChoice({
        prompt: `Two groups measured the ${ctx.dvName} ${ctx.row(ctx.ivValues[i]!)} (${ctx.title.toLowerCase()}).\nGroup A: ${A.join(', ')}\nGroup B: ${B.join(', ')}\nWhose results are more precise?`,
        correct: aFirst ? 'Group A' : 'Group B',
        wrong: [
          { label: aFirst ? 'Group B' : 'Group A', misconception: 'precise-spread', feedback: 'Their repeats are more spread out. Precise means the repeats are close together.' },
          { label: 'Both are equally precise', misconception: 'precise-equal', feedback: 'Look at the spread (range) of each set.' },
        ],
        order: ['Group A', 'Group B', 'Both are equally precise'],
        hint: 'Precise results have a small spread. Work out the range for each group.',
        explanation: `Range for Group A = ${Math.max(...A) - Math.min(...A)}; Group B = ${Math.max(...B) - Math.min(...B)}. The smaller spread is more precise. (Precise is not the same as accurate: accurate means close to the true value.)`,
      })
    }),
    G('bio.ws.evaluate.accurate', 'bio.ws.evaluate', [3, 5], (rng) => {
      const truth = rng.pick([20, 25, 30, 37, 40])
      const off = rng.pick([4, 5, 6])
      const goodA = rng.chance(0.5)
      const accurateSet = [truth - 1, truth, truth + 1]
      const preciseButWrong = [truth + off, truth + off + 1, truth + off]
      const A = goodA ? accurateSet : preciseButWrong
      const B = goodA ? preciseButWrong : accurateSet
      return orderedChoice({
        prompt: `A water bath is known to be at exactly ${truth} °C. Two thermometers are each used three times to measure it.\nThermometer A: ${A.join(', ')} °C\nThermometer B: ${B.join(', ')} °C\nWhich thermometer gives the more accurate readings?`,
        correct: goodA ? 'Thermometer A' : 'Thermometer B',
        wrong: [
          { label: goodA ? 'Thermometer B' : 'Thermometer A', misconception: 'precise-as-accurate', feedback: `Its readings are close together (precise) but all about ${off} °C too high, so they are not accurate.` },
          { label: 'They are equally accurate', misconception: 'accurate-equal', feedback: `Compare each set with the true value of ${truth} °C.` },
        ],
        order: ['Thermometer A', 'Thermometer B', 'They are equally accurate'],
        hint: `Accurate means close to the true value (${truth} °C).`,
        explanation: `${goodA ? 'Thermometer A' : 'Thermometer B'} reads close to ${truth} °C, so it is accurate. The other thermometer's readings are close to each other (precise) but all too high: precise is not the same as accurate.`,
      })
    }),
  ]
}

export const wsGenerators: ItemGenerator[] = [
  ...bankGenerators(variablesBank),
  ...variableGenerators(),
  ...bankGenerators(fairTestBank),
  ...fairTestGenerators(),
  ...bankGenerators(resultsBank),
  ...resultsGenerators(),
  ...bankGenerators(graphsBank),
  ...graphGenerators(),
  ...bankGenerators(evaluateBank),
  ...evaluateGenerators(),
]
