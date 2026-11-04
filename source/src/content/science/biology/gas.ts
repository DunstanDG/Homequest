import type { ItemGenerator } from '@/engine/registry'
import { textItem } from '../../kit'
import { bankGenerators, classifyGenerators, G, num, type Bank } from './factory'

// =====================================================================================================================
// Breathing and respiration: lungs and gas exchange, the mechanism of breathing, aerobic and anaerobic respiration
// =====================================================================================================================

const AIR_TABLE = {
  type: 'table' as const,
  head: ['Gas', 'Inhaled air (%)', 'Exhaled air (%)'],
  rows: [
    ['Nitrogen', 'about 78', 'about 78'],
    ['Oxygen', 'about 21', 'about 16'],
    ['Carbon dioxide', 'about 0.04', 'about 4'],
  ],
}

const lungs: Bank = {
  skill: 'bio.gas.lungs',
  noun: 'part of the gas exchange system',
  meaningPrompt: (t) => `Which description matches the ${t.toLowerCase()}?`,
  matchPrompt: 'Match each part of the gas exchange system to its description.',
  terms: [
    { term: 'Trachea', def: 'The windpipe: a tube held open by rings of cartilage that carries air down towards the lungs' },
    { term: 'Bronchi', def: 'The two tubes that branch off the windpipe, one going into each lung' },
    { term: 'Bronchioles', def: 'Small tubes that branch through each lung and end in air sacs' },
    { term: 'Alveoli', def: 'Tiny air sacs where oxygen passes into the blood and carbon dioxide passes out' },
    { term: 'Diaphragm', def: 'A sheet of muscle underneath the lungs' },
    { term: 'Intercostal muscles', def: 'Muscles between the ribs that move the ribcage' },
  ],
  orders: [
    {
      prompt: 'Put these in the order that air passes through them when you breathe in.',
      steps: ['Nose or mouth', 'Trachea', 'Bronchus', 'Bronchiole', 'Alveolus'],
      direction: ['first', 'last'],
      hint: 'The tubes get narrower and narrower as they go deeper into the lungs.',
      why: 'Air goes in through the nose or mouth, down the trachea, into a bronchus, along smaller and smaller bronchioles, and finally into an alveolus (air sac).',
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'Why are the walls of the alveoli only one cell thick?',
      a: 'So that gases only have a short distance to diffuse',
      wrong: [
        { label: 'So that the lungs are lighter', misconception: 'alveoli-light', feedback: 'It is about making diffusion quick, not weight.' },
        { label: 'So that air cannot get into the blood', misconception: 'alveoli-barrier', feedback: 'The point is to let oxygen into the blood easily.' },
        { label: 'So that the alveoli can contract like muscles', misconception: 'alveoli-muscle', feedback: 'Alveoli do not contract; the diaphragm and intercostal muscles do the work.' },
      ],
      hint: 'Oxygen has to get from the air in the alveolus into the blood.',
      why: 'Thin walls (and thin capillary walls) mean oxygen and carbon dioxide only have a very short distance to diffuse, so gas exchange is fast.',
      lv: [2, 4],
    },
    {
      q: 'Why do the lungs contain millions of alveoli instead of one big air sac?',
      a: 'It gives a much larger surface area for gas exchange',
      wrong: [
        { label: 'So that the lungs can hold less air', misconception: 'alveoli-less-air', feedback: 'The aim is more surface for oxygen to cross, not less air.' },
        { label: 'So that there is more room for the heart', misconception: 'alveoli-heart', feedback: 'It is about surface area for gas exchange.' },
        { label: 'Each alveolus does a different job', misconception: 'alveoli-different-jobs', feedback: 'They all do the same job: gas exchange.' },
      ],
      hint: 'Think about the surface area of many small bubbles compared with one big balloon.',
      why: 'Lots of tiny air sacs have a far larger total surface area than one big sac, so much more oxygen can diffuse into the blood at once.',
      lv: [2, 4],
    },
    {
      q: 'Look at the table. Why is there less oxygen in exhaled air than in inhaled air?',
      a: 'Some of the oxygen passed into the blood and was used by cells for respiration',
      wrong: [
        { label: 'The lungs turn oxygen into nitrogen', misconception: 'oxygen-to-nitrogen', feedback: 'The nitrogen stays about the same; it is not made from oxygen.' },
        { label: 'Oxygen is heavier, so it stays in the lungs', misconception: 'oxygen-heavy', feedback: 'Oxygen is not left behind; it diffuses into the blood.' },
        { label: 'We breathe out oxygen through the skin instead', misconception: 'skin-oxygen', feedback: 'Oxygen is taken into the blood in the alveoli.' },
      ],
      hint: 'Where does the oxygen go after it reaches the alveoli?',
      why: 'Oxygen diffuses from the alveoli into the blood and is carried to cells, which use it in respiration. Carbon dioxide made by respiration is breathed out, so exhaled air has more of it.',
      figure: AIR_TABLE,
      lv: [2, 4],
    },
    {
      q: 'Look at the table. Which gas is at about the same percentage in inhaled and exhaled air?',
      a: 'Nitrogen',
      wrong: [
        { label: 'Oxygen', misconception: 'oxygen-same', feedback: 'Oxygen goes down from about 21% to about 16%.' },
        { label: 'Carbon dioxide', misconception: 'co2-same', feedback: 'Carbon dioxide goes up a lot, from about 0.04% to about 4%.' },
      ],
      hint: 'Compare the two columns for each gas.',
      why: 'Nitrogen is about 78% in both, because the body does not use it. Oxygen goes down (used in respiration) and carbon dioxide goes up (made in respiration).',
      figure: AIR_TABLE,
      lv: [1, 3],
    },
    {
      q: 'Cells lining the trachea make sticky mucus. What is the mucus for?',
      a: 'To trap dust and microbes before they reach the lungs',
      wrong: [
        { label: 'To digest food that goes down the wrong way', misconception: 'mucus-digest', feedback: 'Mucus traps particles; it does not digest food.' },
        { label: 'To absorb oxygen', misconception: 'mucus-oxygen', feedback: 'Oxygen is absorbed in the alveoli.' },
        { label: 'To make the trachea waterproof', misconception: 'mucus-waterproof', feedback: 'Its job is trapping dust and microbes.' },
      ],
      hint: 'Cilia then sweep the mucus up and away.',
      why: 'Mucus traps dust and microbes. Cilia (tiny hairs) sweep the mucus up to the throat, where it is swallowed, keeping the lungs clean.',
      lv: [2, 4],
    },
  ],
  written: [
    {
      prompt: 'Explain how the alveoli are adapted for gas exchange.',
      model: 'There are millions of alveoli, which give the lungs a very large surface area, so lots of oxygen can diffuse into the blood at once. Their walls are only one cell thick, so gases only have a short distance to diffuse. Each alveolus is surrounded by many capillaries, giving a good blood supply that carries oxygen away and brings carbon dioxide, and their moist lining helps gases dissolve.',
      checklist: ['Large surface area', 'Thin walls (one cell thick) so a short diffusion distance', 'Good blood supply (many capillaries)', 'Moist lining', 'Uses the word diffusion'],
      hint: 'Think about surface area, distance and blood supply.',
      passMark: 3,
    },
  ],
}

const breathing: Bank = {
  skill: 'bio.gas.breathing',
  orders: [
    {
      prompt: 'Put these steps of breathing in (inhaling) in order.',
      steps: [
        'The intercostal muscles and the diaphragm contract',
        'The ribs move up and out and the diaphragm flattens',
        'The volume inside the chest increases',
        'The pressure inside the chest decreases',
        'Air is pushed into the lungs from outside',
      ],
      direction: ['first', 'last'],
      hint: 'Muscles first, then movement, then volume, then pressure.',
      why: 'Muscles contract → ribs move up and out, diaphragm flattens → chest volume increases → pressure inside falls below the air pressure outside → air moves in.',
      lv: [3, 5],
    },
  ],
  links: [
    {
      prompt: 'In the bell jar model of the lungs, match each part of the model to the part of the body it represents.',
      pairs: [
        ['Balloons', 'Lungs'],
        ['Rubber sheet at the bottom', 'Diaphragm'],
        ['Glass jar', 'Ribcage (chest wall)'],
        ['Glass tube at the top', 'Trachea'],
      ],
      hint: 'Pulling the rubber sheet down makes the balloons inflate.',
      ask: (l) => `In the bell jar model, what ${l === 'Balloons' ? 'do' : 'does'} the ${l.toLowerCase()} represent?`,
      lv: [2, 4],
    },
  ],
  mcqs: [
    {
      q: 'What is one way in which the bell jar model is NOT like real breathing?',
      a: 'The glass jar cannot move, but the real ribs move up and out',
      wrong: [
        { label: 'The balloons get bigger when air goes in', misconception: 'model-balloon', feedback: 'That is like the real lungs; it is not a weakness of the model.' },
        { label: 'Pulling the rubber sheet down lets air in', misconception: 'model-sheet', feedback: 'That matches how the diaphragm works.' },
        { label: 'Air enters through a tube at the top', misconception: 'model-tube', feedback: 'That matches the trachea.' },
      ],
      hint: 'Look for a part of the model that behaves differently from the body.',
      why: 'In the model the jar is rigid, but the real ribcage moves when the intercostal muscles contract. (Also, the real diaphragm is dome-shaped and flattens; it is not pulled down by hand.)',
      lv: [3, 5],
    },
    {
      q: 'Why does your breathing rate increase during exercise?',
      a: 'Your muscles respire faster, so they need more oxygen and make more carbon dioxide to remove',
      wrong: [
        { label: 'Exercise makes the air contain less oxygen', misconception: 'exercise-air', feedback: 'The air is the same; your muscles need more of it.' },
        { label: 'To cool the lungs down', misconception: 'breathing-cool', feedback: 'The main reason is gas exchange for respiration.' },
        { label: 'Because the heart stops pumping during exercise', misconception: 'heart-stops', feedback: 'The heart beats faster during exercise.' },
      ],
      hint: 'What do working muscles need more of, and what do they make more of?',
      why: 'Working muscles respire faster to release more energy. They need more oxygen and produce more carbon dioxide, so you breathe faster and deeper (and your heart beats faster).',
      lv: [2, 4],
    },
    {
      q: 'During an asthma attack, why does a person find it hard to breathe?',
      a: 'The muscles around the bronchioles tighten and the lining swells, making the airways narrower',
      wrong: [
        { label: 'The alveoli fill with blood', misconception: 'asthma-blood', feedback: 'Asthma affects the airways (bronchioles), not the alveoli.' },
        { label: 'The diaphragm stops working completely', misconception: 'asthma-diaphragm', feedback: 'The diaphragm still works; the airways are narrower.' },
        { label: 'The lungs run out of oxygen to make', misconception: 'lungs-make-oxygen', feedback: 'The lungs do not make oxygen; they take it from the air.' },
      ],
      hint: 'Think about the width of the tubes that air has to pass through.',
      why: 'In an asthma attack the airways become narrower, so less air can flow through. A reliever inhaler contains a drug that relaxes the muscles around the airways.',
      lv: [3, 5],
    },
  ],
}

const breathingClassify = classifyGenerators('bio.gas.breathing', {
  id: 'in-or-out',
  categories: ['Breathing in (inhaling)', 'Breathing out (exhaling)'],
  items: [
    ['the intercostal muscles contract', 'Breathing in (inhaling)'],
    ['the ribs move up and out', 'Breathing in (inhaling)'],
    ['the diaphragm contracts and flattens', 'Breathing in (inhaling)'],
    ['the volume of the chest increases', 'Breathing in (inhaling)'],
    ['the pressure inside the chest falls', 'Breathing in (inhaling)'],
    ['the intercostal muscles relax', 'Breathing out (exhaling)'],
    ['the ribs move down and in', 'Breathing out (exhaling)'],
    ['the diaphragm relaxes and moves back up into a dome', 'Breathing out (exhaling)'],
    ['the volume of the chest decreases', 'Breathing out (exhaling)'],
    ['the pressure inside the chest rises', 'Breathing out (exhaling)'],
  ],
  ask: (item) => `"${item.charAt(0).toUpperCase() + item.slice(1)}." Does this happen when breathing in or breathing out?`,
  hint: 'Breathing in: the chest gets bigger. Breathing out: it gets smaller.',
  means: {
    'Breathing in (inhaling)': 'The muscles contract, the chest gets bigger, the pressure falls and air moves in.',
    'Breathing out (exhaling)': 'The muscles relax, the chest gets smaller, the pressure rises and air moves out.',
  },
})

function breathingGenerators(): ItemGenerator[] {
  return [
    G('bio.gas.breathing.rate', 'bio.gas.breathing', [2, 4], (rng, d) => {
      if (d <= 3) {
        const secs = rng.pick([10, 15, 20, 30])
        const perMin = rng.pick(secs === 10 ? [12, 18, 24, 30, 36] : secs === 15 ? [12, 16, 20, 24, 28, 32] : secs === 20 ? [12, 15, 18, 21, 24, 30] : [12, 14, 16, 18, 20, 24, 30])
        const counted = (perMin * secs) / 60
        return num({
          prompt: `Maya counts ${counted} breaths in ${secs} seconds. What is her breathing rate in breaths per minute?`,
          answer: perMin,
          suffix: 'breaths per minute',
          hint: `How many lots of ${secs} seconds are there in one minute?`,
          explanation: `There are ${60 / secs} lots of ${secs} seconds in a minute, so ${counted} × ${60 / secs} = ${perMin} breaths per minute.`,
          errors: [{ values: [counted], tag: 'not-scaled', message: 'That is the number in the time counted, not in a whole minute.' }],
        })
      }
      const vol = rng.pick([0.4, 0.5, 0.6])
      const rate = rng.pick([12, 15, 20, 25, 30])
      const total = Math.round(vol * rate * 10) / 10
      return num({
        prompt: `Each breath Maya takes contains ${vol} litres of air. She takes ${rate} breaths per minute. What volume of air does she breathe in each minute?`,
        answer: total,
        suffix: 'litres',
        hint: 'Volume per minute = volume per breath × number of breaths per minute.',
        explanation: `${vol} × ${rate} = ${total} litres per minute. During exercise both numbers go up, so much more air is breathed in.`,
        errors: [{ values: [vol + rate], tag: 'added', message: 'Multiply the volume of each breath by the number of breaths.' }],
      })
    }),
  ]
}

// ----------------------------------------------------------------------------------------------- aerobic respiration

const RESP_PARTS = [
  { word: 'glucose', accept: ['glucose'] },
  { word: 'oxygen', accept: ['oxygen'] },
  { word: 'carbon dioxide', accept: ['carbon dioxide'] },
  { word: 'water', accept: ['water'] },
]

const aerobic: Bank = {
  skill: 'bio.gas.aerobic',
  terms: [
    { term: 'Respiration', def: 'A chemical reaction in every living cell that releases energy from glucose' },
    { term: 'Breathing', def: 'Moving air into and out of the lungs' },
    { term: 'Limewater', def: 'A solution that turns cloudy (milky) when carbon dioxide is bubbled through it' },
    { term: 'Plasma', def: 'The liquid part of the blood, which carries dissolved glucose and carbon dioxide' },
    { term: 'Red blood cells', def: 'Blood cells that carry oxygen from the lungs to the rest of the body' },
  ],
  mcqs: [
    {
      q: 'Which is the word equation for aerobic respiration?',
      a: 'glucose + oxygen → carbon dioxide + water',
      wrong: [
        { label: 'carbon dioxide + water → glucose + oxygen', misconception: 'photosynthesis-equation', feedback: 'That is photosynthesis: it is respiration backwards.' },
        { label: 'glucose → lactic acid', misconception: 'anaerobic-equation', feedback: 'That is anaerobic respiration in muscles: no oxygen is used.' },
        { label: 'glucose + carbon dioxide → oxygen + water', misconception: 'mixed-equation', feedback: 'Respiration uses oxygen and produces carbon dioxide.' },
      ],
      hint: 'Aerobic means "with air": it uses oxygen.',
      why: 'Aerobic respiration: glucose + oxygen → carbon dioxide + water, releasing energy.',
      lv: [1, 3],
    },
    {
      q: 'Where in a cell does aerobic respiration happen?',
      a: 'In the mitochondria',
      wrong: [
        { label: 'In the lungs', misconception: 'respiration-in-lungs', feedback: 'The lungs are where gas exchange happens. Respiration happens inside every cell, in the mitochondria.' },
        { label: 'In the nucleus', misconception: 'respiration-nucleus', feedback: 'The nucleus controls the cell. Respiration happens in mitochondria.' },
        { label: 'In the chloroplasts', misconception: 'respiration-chloroplast', feedback: 'Chloroplasts are for photosynthesis.' },
      ],
      hint: 'Which part of a cell is often called its "powerhouse"?',
      why: 'Aerobic respiration takes place in the mitochondria of cells, all over the body.',
      lv: [1, 3],
    },
    {
      q: 'What is the difference between breathing and respiration?',
      a: 'Breathing moves air in and out of the lungs; respiration is a chemical reaction in cells that releases energy',
      wrong: [
        { label: 'There is no difference: they are two words for the same thing', misconception: 'breathing-is-respiration', feedback: 'They are different. Breathing is movement of air; respiration is a reaction in cells.' },
        { label: 'Breathing happens in cells; respiration happens in the lungs', misconception: 'swapped', feedback: 'It is the other way round.' },
        { label: 'Only animals breathe and only plants respire', misconception: 'plants-respire-only', feedback: 'All living things respire, including animals.' },
      ],
      hint: 'One is a physical movement; the other is a chemical reaction.',
      why: 'Breathing is the movement of air into and out of the lungs. Respiration is the chemical reaction in every living cell that releases energy from glucose.',
      lv: [2, 4],
    },
    {
      q: 'When do plants respire?',
      a: 'All the time, day and night',
      wrong: [
        { label: 'Only at night, when they cannot photosynthesise', misconception: 'plants-respire-night', feedback: 'Plants respire all the time. At night it is just easier to notice, because photosynthesis stops.' },
        { label: 'Never: plants photosynthesise instead of respiring', misconception: 'plants-no-respiration', feedback: 'Plant cells need energy too, so they respire all the time.' },
        { label: 'Only in the daytime', misconception: 'plants-respire-day', feedback: 'Respiration happens day and night.' },
      ],
      hint: 'Do plant cells need energy at night?',
      why: 'Every living cell needs energy all the time, so plants respire day and night. In daylight they also photosynthesise, usually faster than they respire.',
      lv: [3, 5],
    },
    {
      q: 'What is the energy released by respiration used for?',
      a: 'Movement, keeping warm and growth',
      wrong: [
        { label: 'Making oxygen for the body', misconception: 'energy-oxygen', feedback: 'Respiration uses oxygen; it does not make it.' },
        { label: 'Only for thinking', misconception: 'energy-thinking', feedback: 'Energy is used for many things, including muscle contraction and keeping warm.' },
        { label: 'Making glucose by photosynthesis', misconception: 'energy-photosynthesis', feedback: 'Photosynthesis uses energy from light, not from respiration.' },
      ],
      hint: 'Think about what your body does all day.',
      why: 'The energy from respiration is used for muscle contraction (movement), keeping the body warm, growth and repair, and many other life processes.',
      lv: [2, 4],
    },
    {
      q: 'Air you breathe out is bubbled through limewater, and the limewater turns cloudy. What does this show?',
      a: 'Exhaled air contains carbon dioxide',
      wrong: [
        { label: 'Exhaled air contains oxygen', misconception: 'limewater-oxygen', feedback: 'Limewater tests for carbon dioxide, not oxygen.' },
        { label: 'Exhaled air contains glucose', misconception: 'limewater-glucose', feedback: 'Glucose is not a gas.' },
        { label: 'The limewater has gone off', misconception: 'limewater-off', feedback: 'Cloudy limewater is the positive test for carbon dioxide.' },
      ],
      hint: 'Limewater is the test for one gas.',
      why: 'Limewater turns cloudy (milky) with carbon dioxide. The carbon dioxide in exhaled air was made by respiration in your cells.',
      lv: [1, 3],
    },
  ],
}

function aerobicGenerators(): ItemGenerator[] {
  return [
    G('bio.gas.aerobic.equation-gap', 'bio.gas.aerobic', [2, 4], (rng) => {
      const i = rng.int(0, 3)
      const parts = RESP_PARTS.map((p, k) => (k === i ? '____' : p.word))
      const target = RESP_PARTS[i]!
      return textItem({
        prompt: `Fill in the missing word in the equation for aerobic respiration:\n${parts[0]} + ${parts[1]} → ${parts[2]} + ${parts[3]}`,
        accept: target.accept,
        hint: i < 2 ? 'This is something the cell takes in (a reactant).' : 'This is something the cell makes (a product).',
        explanation: 'glucose + oxygen → carbon dioxide + water (energy is released).',
        placeholder: 'missing word',
      })
    }),
  ]
}

// ----------------------------------------------------------------------------------------------- anaerobic respiration

const anaerobic: Bank = {
  skill: 'bio.gas.anaerobic',
  links: [
    {
      prompt: 'Match each type of respiration to its word equation.',
      pairs: [
        ['Aerobic respiration', 'glucose + oxygen → carbon dioxide + water'],
        ['Anaerobic respiration in human muscles', 'glucose → lactic acid'],
        ['Anaerobic respiration in yeast (fermentation)', 'glucose → ethanol + carbon dioxide'],
      ],
      hint: 'Only one of them uses oxygen. Yeast makes the alcohol in beer and wine.',
      ask: (l) => `What is the word equation for ${l.charAt(0).toLowerCase() + l.slice(1)}?`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'When does anaerobic respiration happen in human muscles?',
      a: 'During very hard exercise, when the muscles cannot get enough oxygen',
      wrong: [
        { label: 'Only when we are asleep', misconception: 'anaerobic-sleep', feedback: 'At rest muscles get plenty of oxygen and respire aerobically.' },
        { label: 'All the time, instead of aerobic respiration', misconception: 'anaerobic-always', feedback: 'Most of the time cells respire aerobically.' },
        { label: 'Only after eating a big meal', misconception: 'anaerobic-meal', feedback: 'It is linked to a shortage of oxygen, not to eating.' },
      ],
      hint: '"Anaerobic" means "without air".',
      why: 'When muscles work so hard that the blood cannot bring enough oxygen, they also respire anaerobically, making lactic acid.',
      lv: [1, 3],
    },
    {
      q: 'Why do you keep breathing hard for a while after a sprint?',
      a: 'To take in extra oxygen to break down the lactic acid made during the sprint (the oxygen debt)',
      wrong: [
        { label: 'To breathe out the lactic acid', misconception: 'breathe-out-lactic', feedback: 'Lactic acid is not a gas. Extra oxygen is needed to break it down.' },
        { label: 'Because the lungs are damaged by running', misconception: 'lungs-damaged', feedback: 'Healthy lungs are not damaged by exercise.' },
        { label: 'To cool the brain down', misconception: 'cool-brain', feedback: 'The extra breathing is to supply oxygen.' },
      ],
      hint: 'What builds up in the muscles during anaerobic respiration?',
      why: 'Anaerobic respiration makes lactic acid. Afterwards, extra oxygen is needed to break it down. This extra oxygen is called the oxygen debt.',
      lv: [3, 5],
    },
    {
      q: 'In bread making, why does the dough rise?',
      a: 'Yeast respires and produces bubbles of carbon dioxide',
      wrong: [
        { label: 'Yeast produces oxygen gas', misconception: 'yeast-oxygen', feedback: 'Yeast uses sugar and gives off carbon dioxide, not oxygen.' },
        { label: 'The flour expands when it gets wet', misconception: 'flour-expands', feedback: 'It is the gas made by the yeast that makes it rise.' },
        { label: 'Lactic acid makes it swell', misconception: 'lactic-bread', feedback: 'Yeast makes ethanol and carbon dioxide, not lactic acid.' },
      ],
      hint: 'Which gas does yeast make when it respires?',
      why: 'Yeast respires the sugar in the dough and gives off carbon dioxide. The gas bubbles make the dough rise. (Any ethanol made evaporates during baking.)',
      lv: [2, 4],
    },
    {
      q: 'Which type of respiration releases more energy from each glucose molecule?',
      a: 'Aerobic respiration',
      wrong: [
        { label: 'Anaerobic respiration', misconception: 'anaerobic-more', feedback: 'Anaerobic respiration only partly breaks down glucose, so it releases much less energy.' },
        { label: 'They release exactly the same amount', misconception: 'same-energy', feedback: 'Aerobic respiration releases much more.' },
      ],
      hint: 'In which one is glucose broken down completely?',
      why: 'Aerobic respiration breaks glucose down completely to carbon dioxide and water, releasing much more energy. Anaerobic respiration is quicker to start but releases far less energy.',
      lv: [2, 4],
    },
  ],
  written: [
    {
      prompt: 'Compare aerobic and anaerobic respiration in human muscles.',
      model: 'Both types of respiration release energy from glucose. Aerobic respiration needs oxygen and produces carbon dioxide and water. Anaerobic respiration happens without oxygen, for example during very hard exercise, and produces lactic acid. Anaerobic respiration releases much less energy than aerobic, and afterwards extra oxygen is needed to break down the lactic acid (the oxygen debt).',
      checklist: ['Both release energy from glucose', 'Aerobic needs oxygen; anaerobic does not', 'Correct products for each (carbon dioxide and water; lactic acid)', 'Anaerobic releases less energy', 'Mentions oxygen debt'],
      hint: 'Give a similarity, then differences: oxygen, products, energy.',
      passMark: 3,
    },
  ],
}

const anaerobicClassify = classifyGenerators('bio.gas.anaerobic', {
  id: 'compare',
  categories: ['Aerobic only', 'Anaerobic only', 'Both'],
  items: [
    ['needs oxygen', 'Aerobic only'],
    ['releases the most energy from each glucose molecule', 'Aerobic only'],
    ['produces carbon dioxide and water', 'Aerobic only'],
    ['produces lactic acid in human muscles', 'Anaerobic only'],
    ['happens when muscles cannot get enough oxygen', 'Anaerobic only'],
    ['produces ethanol in yeast', 'Anaerobic only'],
    ['uses glucose', 'Both'],
    ['releases energy', 'Both'],
  ],
  ask: (item) => `Which type of respiration ${item}?`,
  hint: 'Think about oxygen, the products and the amount of energy.',
  sortPrompt: 'Match each statement to the type of respiration it describes.',
  means: {
    'Aerobic only': 'Aerobic respiration uses oxygen and makes carbon dioxide and water, releasing the most energy.',
    'Anaerobic only': 'Anaerobic respiration happens without oxygen and makes lactic acid (muscles) or ethanol and carbon dioxide (yeast).',
    Both: 'Both kinds of respiration use glucose and release energy.',
  },
})

export const gasGenerators: ItemGenerator[] = [
  ...bankGenerators(lungs),
  ...bankGenerators(breathing),
  ...breathingClassify,
  ...breathingGenerators(),
  ...bankGenerators(aerobic),
  ...aerobicGenerators(),
  ...bankGenerators(anaerobic),
  ...anaerobicClassify,
]

