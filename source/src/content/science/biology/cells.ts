import type { ItemGenerator } from '@/engine/registry'
import { choice } from '../../kit'
import { bankGenerators, classifyGenerators, G, fmt, num, round, type Bank } from './factory'

// =====================================================================================================================
// Cells: organelles, plant and animal cells, specialised cells, microscopes, magnification, diffusion,
// unicellular organisms, levels of organisation
// =====================================================================================================================

const organelles: Bank = {
  skill: 'bio.cells.organelles',
  noun: 'part of the cell',
  meaningPrompt: (t) => `What is the job of the ${t.toLowerCase()}?`,
  matchPrompt: 'Match each part of the cell to its job.',
  terms: [
    { term: 'Nucleus', def: 'Controls the activities of the cell and contains the genetic material (DNA)' },
    { term: 'Cell membrane', def: 'Controls which substances move into and out of the cell' },
    { term: 'Cytoplasm', def: 'Jelly-like substance where most of the cell\'s chemical reactions take place' },
    { term: 'Mitochondria', def: 'Where aerobic respiration takes place, releasing energy for the cell' },
    { term: 'Cell wall', def: 'Made of cellulose; strengthens and supports a plant cell' },
    { term: 'Chloroplasts', def: 'Contain chlorophyll, which absorbs light for photosynthesis' },
    { term: 'Vacuole', def: 'A permanent space filled with cell sap that helps keep a plant cell firm' },
    { term: 'Ribosomes', def: 'Tiny structures where proteins are made' },
  ],
  mcqs: [
    {
      q: 'Which part of a cell contains the genetic material that controls what the cell does?',
      a: 'The nucleus',
      wrong: [
        { label: 'The cytoplasm', misconception: 'cytoplasm-controls', feedback: 'The cytoplasm is where most reactions happen, but the instructions come from the nucleus.' },
        { label: 'The cell membrane', misconception: 'membrane-controls', feedback: 'The membrane controls what goes in and out, not the whole cell.' },
        { label: 'The vacuole', misconception: 'vacuole-controls', feedback: 'The vacuole holds cell sap.' },
      ],
      hint: 'It is often called the "control centre" of the cell.',
      why: 'The nucleus contains DNA, the genetic material with the instructions that control the cell\'s activities.',
      lv: [1, 2],
    },
    {
      q: 'A plant cell has a cell wall. Does it also have a cell membrane?',
      a: 'Yes: the cell membrane is just inside the cell wall',
      wrong: [
        { label: 'No: the cell wall replaces the membrane', misconception: 'wall-replaces-membrane', feedback: 'Plant cells have both. The wall gives strength; the membrane controls what goes in and out.' },
        { label: 'Only if the plant cell is in a leaf', misconception: 'membrane-leaf-only', feedback: 'Every plant cell has a cell membrane.' },
        { label: 'No: only animal cells have membranes', misconception: 'membrane-animal-only', feedback: 'All cells have a cell membrane.' },
      ],
      hint: 'The wall and the membrane do different jobs.',
      why: 'All cells have a cell membrane. In plant cells it lies just inside the cell wall. The wall supports the cell; the membrane controls what enters and leaves.',
      lv: [3, 5],
    },
    {
      q: 'Muscle cells need a lot of energy. Which part of the cell would you expect them to have a lot of?',
      a: 'Mitochondria',
      wrong: [
        { label: 'Chloroplasts', misconception: 'chloroplast-energy', feedback: 'Chloroplasts are for photosynthesis, and are only found in plant cells.' },
        { label: 'Vacuoles', misconception: 'vacuole-energy', feedback: 'Vacuoles store cell sap; they do not release energy.' },
        { label: 'Cell walls', misconception: 'wall-energy', feedback: 'Animal cells do not have cell walls.' },
      ],
      hint: 'Which part of the cell releases energy by respiration?',
      why: 'Respiration takes place in mitochondria and releases energy. Cells that need a lot of energy, like muscle cells and sperm cells, have many mitochondria.',
      lv: [2, 4],
    },
  ],
}

const plantAnimal: Bank = {
  skill: 'bio.cells.plant-animal',
  mcqs: [
    {
      q: 'Root hair cells are plant cells, but they have no chloroplasts. Why not?',
      a: 'They are underground, where there is no light for photosynthesis',
      wrong: [
        { label: 'Because roots are dead', misconception: 'roots-dead', feedback: 'Root cells are alive: they respire and absorb water.' },
        { label: 'Because their cell wall blocks chloroplasts', misconception: 'wall-blocks', feedback: 'The cell wall has nothing to do with it.' },
        { label: 'Because only animal cells have chloroplasts', misconception: 'animal-chloroplasts', feedback: 'It is the other way round: only plant cells (and some single-celled organisms) have chloroplasts.' },
      ],
      hint: 'What do chloroplasts need in order to work?',
      why: 'Chloroplasts absorb light for photosynthesis. Root cells are in the dark soil, so chloroplasts would be no use there.',
      lv: [2, 4],
    },
    {
      q: 'A cell has a nucleus, a cell membrane, cytoplasm and a cell wall, but no chloroplasts. Which of these could it be?',
      a: 'A cell from a plant root',
      wrong: [
        { label: 'A human cheek cell', misconception: 'animal-wall', feedback: 'Animal cells do not have a cell wall.' },
        { label: 'A red blood cell', misconception: 'rbc-nucleus', feedback: 'Red blood cells have no nucleus and no cell wall.' },
        { label: 'A palisade cell from a leaf', misconception: 'palisade-no-chloroplasts', feedback: 'Palisade cells are packed with chloroplasts.' },
      ],
      hint: 'The cell wall tells you it is a plant cell. Which plant cells have no chloroplasts?',
      why: 'The cell wall shows it is a plant cell. Having no chloroplasts fits a root cell, which grows in the dark.',
      lv: [3, 5],
    },
    {
      q: 'What is a plant cell wall made of?',
      a: 'Cellulose',
      wrong: [
        { label: 'Starch', misconception: 'wall-starch', feedback: 'Starch is how plants store food. Cell walls are made of cellulose.' },
        { label: 'Chlorophyll', misconception: 'wall-chlorophyll', feedback: 'Chlorophyll is the green substance in chloroplasts.' },
        { label: 'Fat', misconception: 'wall-fat', feedback: 'Cell walls are made of cellulose, a tough fibre.' },
      ],
      hint: 'It is the same substance as the "fibre" in vegetables.',
      why: 'Plant cell walls are made of cellulose, which is strong and gives the cell support.',
      lv: [2, 4],
    },
    {
      q: 'Which of these is found in both plant cells and animal cells?',
      a: 'Mitochondria',
      wrong: [
        { label: 'Chloroplasts', misconception: 'chloroplast-both', feedback: 'Chloroplasts are only found in plant cells.' },
        { label: 'A cell wall', misconception: 'wall-both', feedback: 'Only plant cells (not animal cells) have a cell wall.' },
        { label: 'A permanent vacuole', misconception: 'vacuole-both', feedback: 'A large permanent vacuole is a plant cell feature.' },
      ],
      hint: 'Plants respire as well as animals.',
      why: 'Plant and animal cells both respire, so both have mitochondria. Chloroplasts, a cell wall and a permanent vacuole are only in plant cells.',
      lv: [1, 3],
    },
    {
      q: 'Why do animal cells not need a cell wall, while plant cells do?',
      a: 'Animals have other ways of being supported, such as a skeleton; plants rely on firm cells to hold them up',
      wrong: [
        { label: 'Animal cells are too small to have a cell wall', misconception: 'size-wall', feedback: 'Size is not the reason. Many animal cells are bigger than plant cells.' },
        { label: 'Animal cells have chloroplasts instead', misconception: 'animal-chloroplasts', feedback: 'Animal cells never have chloroplasts.' },
        { label: 'A cell wall would stop animal cells respiring', misconception: 'wall-blocks-respiration', feedback: 'Plant cells respire perfectly well with a cell wall.' },
      ],
      hint: 'What holds a plant upright? What holds you upright?',
      why: 'Plants have no skeleton. Cell walls, and vacuoles full of cell sap, keep plant cells firm so the plant can stand up. Many animals are supported by a skeleton instead.',
      lv: [4, 5],
    },
  ],
}

const plantAnimalClassify = classifyGenerators('bio.cells.plant-animal', {
  id: 'where-found',
  categories: ['Both plant and animal cells', 'Plant cells only'],
  items: [
    ['a nucleus', 'Both plant and animal cells'],
    ['a cell membrane', 'Both plant and animal cells'],
    ['cytoplasm', 'Both plant and animal cells'],
    ['mitochondria', 'Both plant and animal cells'],
    ['ribosomes', 'Both plant and animal cells'],
    ['a cell wall', 'Plant cells only'],
    ['chloroplasts', 'Plant cells only'],
    ['a permanent vacuole', 'Plant cells only'],
  ],
  ask: (item) => `Where would you find ${item}?`,
  hint: 'Plant cells have everything an animal cell has, plus three extra parts.',
  means: {
    'Both plant and animal cells': 'Plant and animal cells both have a nucleus, cell membrane, cytoplasm, mitochondria and ribosomes.',
    'Plant cells only': 'Only plant cells have a cell wall, chloroplasts and a permanent vacuole.',
  },
})

const specialised: Bank = {
  skill: 'bio.cells.specialised',
  links: [
    {
      prompt: 'Match each specialised cell to the feature that helps it do its job.',
      pairs: [
        ['Red blood cell', 'No nucleus, so there is more room to carry oxygen'],
        ['Sperm cell', 'A tail to swim to the egg'],
        ['Egg cell', 'Cytoplasm with a store of nutrients for the new embryo'],
        ['Nerve cell', 'Long and thin with branched ends, to carry electrical impulses'],
        ['Root hair cell', 'A long, thin extension giving a large surface area to absorb water'],
        ['Ciliated epithelial cell', 'Tiny hairs that sweep mucus away from the lungs'],
        ['Palisade cell', 'Packed with chloroplasts to absorb light for photosynthesis'],
        ['Muscle cell', 'Protein fibres that can contract (get shorter)'],
      ],
      hint: 'Think about each cell\'s job first: carry, swim, absorb, sweep...',
      ask: (l) => `Which feature helps ${/^[AEIOU]/.test(l) ? 'an' : 'a'} ${l.toLowerCase()} do its job?`,
      lv: [1, 4],
    },
    {
      prompt: 'Match each specialised cell to where it is found.',
      pairs: [
        ['Red blood cell', 'In the blood'],
        ['Root hair cell', 'In the roots of a plant'],
        ['Palisade cell', 'Near the top surface of a leaf'],
        ['Ciliated epithelial cell', 'Lining the trachea (windpipe) and bronchi'],
        ['Sperm cell', 'Made in the testes'],
        ['Egg cell', 'Released from an ovary'],
      ],
      hint: 'The name often gives a clue: root, palisade (leaf), blood.',
      ask: (l) => `Where is ${/^[AEIOU]/.test(l) ? 'an' : 'a'} ${l.toLowerCase()} found?`,
      lv: [2, 4],
    },
  ],
  mcqs: [
    {
      q: 'What is a specialised cell?',
      a: 'A cell with special features that help it do a particular job',
      wrong: [
        { label: 'Any cell that has a nucleus', misconception: 'nucleus-specialised', feedback: 'Most cells have a nucleus. Specialised means adapted for a job.' },
        { label: 'A cell that can do every job in the body', misconception: 'does-everything', feedback: 'It is the opposite: specialised cells do one particular job well.' },
        { label: 'A cell that has been damaged', misconception: 'damaged', feedback: 'Specialised cells are healthy cells adapted to their job.' },
      ],
      hint: 'Think of a specialist: someone who is expert in one thing.',
      why: 'A specialised cell has a structure adapted to one job, for example a red blood cell has no nucleus so it can carry more oxygen.',
      lv: [1, 2],
    },
    {
      q: 'Why does a sperm cell contain lots of mitochondria?',
      a: 'To release energy for swimming to the egg',
      wrong: [
        { label: 'To carry oxygen to the egg', misconception: 'sperm-oxygen', feedback: 'Red blood cells carry oxygen, not sperm.' },
        { label: 'To make food by photosynthesis', misconception: 'mito-photosynthesis', feedback: 'Photosynthesis happens in chloroplasts, in plant cells.' },
        { label: 'To protect the genetic material', misconception: 'mito-protect', feedback: 'Mitochondria release energy by respiration.' },
      ],
      hint: 'What happens in mitochondria, and what does a sperm cell need to do?',
      why: 'Mitochondria are where aerobic respiration releases energy. The sperm cell needs lots of energy to move its tail and swim to the egg.',
      lv: [3, 5],
    },
    {
      q: 'Why do root hair cells have a large surface area?',
      a: 'So they can absorb more water and minerals from the soil',
      wrong: [
        { label: 'So they can absorb more light', misconception: 'root-light', feedback: 'Roots are underground in the dark.' },
        { label: 'So they can hold the plant up on their own', misconception: 'root-support', feedback: 'Root hairs are very thin; their job is absorbing, not support.' },
        { label: 'So they can make more glucose', misconception: 'root-photosynthesis', feedback: 'Glucose is made in the leaves by photosynthesis.' },
      ],
      hint: 'What does a plant take in through its roots?',
      why: 'A bigger surface area in contact with the soil means more water and minerals can be absorbed.',
      lv: [2, 4],
    },
  ],
  written: [
    {
      prompt: 'Explain how a root hair cell is adapted to its job.',
      model: 'A root hair cell absorbs water and minerals from the soil. It has a long, thin extension (the root hair) that gives it a large surface area, so more water and minerals can be absorbed. It has no chloroplasts, because it is underground where there is no light for photosynthesis.',
      checklist: ['States the job: absorbing water and minerals', 'Mentions the long, thin root hair', 'Links it to a large surface area', 'Mentions no chloroplasts and explains why'],
      hint: 'State the job first, then link each feature to it.',
    },
    {
      prompt: 'Explain how a red blood cell is adapted to its job.',
      model: 'A red blood cell carries oxygen around the body. It has no nucleus, so there is more room inside it for the substance that carries oxygen (haemoglobin). Its disc shape, dented in the middle, gives it a large surface area so oxygen can move in and out quickly, and it is small and flexible enough to squeeze through narrow blood vessels.',
      checklist: ['States the job: carrying oxygen', 'Mentions no nucleus and more room for oxygen', 'Mentions its shape or large surface area', 'Mentions it is small or flexible to fit through capillaries'],
      hint: 'State the job first, then link each feature to it.',
    },
    {
      prompt: 'Explain how a sperm cell is adapted to its job.',
      model: 'A sperm cell carries the father\'s genetic material to the egg. It has a tail so it can swim to the egg, and lots of mitochondria to release the energy needed for swimming. Its head contains the nucleus with the genetic material, and the tip of the head contains enzymes that help it get into the egg.',
      checklist: ['States the job: reaching and fertilising the egg', 'Mentions the tail for swimming', 'Mentions many mitochondria for energy', 'Mentions the nucleus or the enzymes in the head'],
      hint: 'State the job first, then link each feature to it.',
    },
  ],
}

const microscope: Bank = {
  skill: 'bio.cells.microscope',
  noun: 'part of the microscope',
  meaningPrompt: (t) => `What does the ${t.toLowerCase()} of a microscope do?`,
  matchPrompt: 'Match each part of the microscope to what it does.',
  terms: [
    { term: 'Eyepiece lens', def: 'The lens at the top that you look through' },
    { term: 'Objective lens', def: 'One of the lenses just above the slide; you turn to a different one to change the magnification' },
    { term: 'Stage', def: 'The flat platform where the slide is placed' },
    { term: 'Coarse focusing wheel', def: 'Moves the stage a long way, to get the image roughly into focus' },
    { term: 'Fine focusing wheel', def: 'Moves the stage a tiny amount, to make the image sharp' },
    { term: 'Lamp or mirror', def: 'Shines light up through the slide so you can see the specimen' },
    { term: 'Clips', def: 'Hold the slide in place so it does not move' },
  ],
  orders: [
    {
      prompt: 'Put these steps for viewing a slide with a light microscope in order.',
      steps: [
        'Turn the lowest-power objective lens so it is over the stage',
        'Put the slide on the stage and hold it with the clips',
        'Looking from the side, turn the coarse focusing wheel so the lens is close to the slide',
        'Looking through the eyepiece, turn the coarse focusing wheel to move them apart until the image is roughly in focus',
        'Turn the fine focusing wheel until the image is sharp',
      ],
      direction: ['first', 'last'],
      hint: 'Always start with the lowest magnification, and never move the lens towards the slide while looking through the eyepiece.',
      why: 'Start on low power (easiest to find the specimen), bring the lens close while watching from the side so it cannot hit the slide, then focus by moving them apart, finishing with the fine focusing wheel.',
      lv: [3, 5],
    },
    {
      prompt: 'Put these steps for making a slide of onion cells in order.',
      steps: [
        'Put a drop of water in the middle of a clean slide',
        'Peel a thin layer of onion skin with forceps and lay it flat in the water',
        'Add a drop of iodine solution to stain the cells',
        'Lower a coverslip on top at an angle, using a mounted needle',
        'Put the slide on the stage and look at it with the lowest-power objective lens',
      ],
      direction: ['first', 'last'],
      hint: 'The coverslip goes on after the specimen and the stain.',
      why: 'The specimen goes on the slide, is stained so the parts show up, and is covered with a coverslip (lowered at an angle to avoid air bubbles) before it is viewed.',
      lv: [3, 5],
    },
  ],
  mcqs: [
    {
      q: 'Why is a stain such as iodine added to onion cells on a slide?',
      a: 'To make parts of the cell, like the nucleus, easier to see',
      wrong: [
        { label: 'To kill any bacteria on the slide', misconception: 'stain-kills', feedback: 'Stains are used to add colour so structures show up.' },
        { label: 'To stick the coverslip down', misconception: 'stain-glue', feedback: 'The coverslip is held by the liquid; the stain adds colour.' },
        { label: 'To make the cells grow bigger', misconception: 'stain-grow', feedback: 'A stain does not change the size of the cells.' },
      ],
      hint: 'Most cell parts are almost see-through.',
      why: 'Many parts of cells are colourless. A stain colours some of them, such as the nucleus, so they can be seen clearly.',
      lv: [1, 3],
    },
    {
      q: 'Why should the specimen on a slide be very thin?',
      a: 'So that light can pass through it',
      wrong: [
        { label: 'So that it dries out quickly', misconception: 'thin-dry', feedback: 'Drying out would spoil the specimen.' },
        { label: 'So that it does not need a stain', misconception: 'thin-no-stain', feedback: 'Thin specimens are often still stained.' },
        { label: 'So that the microscope does not break', misconception: 'thin-break', feedback: 'The thickness matters for light, not for the microscope.' },
      ],
      hint: 'Where does the light in a light microscope come from?',
      why: 'Light shines up from below through the specimen. If it is too thick, light cannot get through and you will not see the cells clearly.',
      lv: [2, 4],
    },
    {
      q: 'Why is a coverslip lowered onto a slide at an angle?',
      a: 'To stop air bubbles being trapped',
      wrong: [
        { label: 'To make the specimen look bigger', misconception: 'coverslip-magnify', feedback: 'The lenses magnify, not the coverslip.' },
        { label: 'So the stain soaks in faster', misconception: 'coverslip-stain', feedback: 'The angle is about air bubbles.' },
        { label: 'So it can be removed easily later', misconception: 'coverslip-remove', feedback: 'The angle is about air bubbles.' },
      ],
      hint: 'What might look like round blobs under the microscope if you drop the coverslip flat?',
      why: 'Lowering the coverslip gently from one side pushes the air out, so no air bubbles get in the way of the view.',
      lv: [2, 4],
    },
    {
      q: 'Why should you start with the lowest-power objective lens?',
      a: 'You can see a larger area, so it is easier to find the specimen',
      wrong: [
        { label: 'The highest-power lens might melt', misconception: 'lens-melt', feedback: 'Lenses do not melt. Low power just makes the specimen easier to find.' },
        { label: 'Low power shows more detail', misconception: 'low-more-detail', feedback: 'Higher power shows more detail, but a smaller area.' },
        { label: 'It uses less electricity', misconception: 'lens-electricity', feedback: 'The lens choice does not change the electricity used.' },
      ],
      hint: 'Think about how much of the slide you can see at low power compared with high power.',
      why: 'At low power you see a bigger area of the slide, so it is easier to find what you want to look at before zooming in.',
      lv: [2, 4],
    },
    {
      q: 'Why should you look from the side while moving the objective lens close to the slide?',
      a: 'So the lens does not crash into the slide and break it',
      wrong: [
        { label: 'So you can see the cells more clearly', misconception: 'side-clearer', feedback: 'You cannot see the cells from the side; this step is for safety.' },
        { label: 'So that light can get in', misconception: 'side-light', feedback: 'Light comes from the lamp or mirror below.' },
        { label: 'To make the image the right way up', misconception: 'side-flip', feedback: 'Looking from the side does not change the image.' },
      ],
      hint: 'What could go wrong if the lens moved too far?',
      why: 'Watching from the side lets you stop before the lens touches the slide, so neither is damaged.',
      lv: [3, 5],
    },
  ],
}

// ----------------------------------------------------------------------------------------------- magnification

const magnificationBank: Bank = {
  skill: 'bio.cells.magnification',
  mcqs: [
    {
      q: 'How many micrometres (µm) are there in 1 millimetre (mm)?',
      a: '1000',
      wrong: [
        { label: '10', misconception: 'mm-um-10', feedback: 'There are 10 mm in 1 cm. There are 1000 µm in 1 mm.' },
        { label: '100', misconception: 'mm-um-100', feedback: 'There are 1000 µm in 1 mm.' },
        { label: '1 000 000', misconception: 'mm-um-million', feedback: 'There are 1 000 000 µm in 1 m, but 1000 µm in 1 mm.' },
      ],
      order: ['10', '100', '1000', '1 000 000'],
      hint: '"Micro" means one millionth of a metre, and a millimetre is a thousandth of a metre.',
      why: '1 mm = 1000 µm. So to change mm into µm, multiply by 1000.',
      lv: [2, 4],
    },
    {
      q: 'Which formula is used to calculate magnification?',
      a: 'magnification = image size ÷ actual size',
      wrong: [
        { label: 'magnification = actual size ÷ image size', misconception: 'mag-upside-down', feedback: 'That would give a number less than 1. The image is bigger than the real thing.' },
        { label: 'magnification = image size × actual size', misconception: 'mag-multiply', feedback: 'Multiplying the sizes does not give how many times bigger it looks.' },
        { label: 'magnification = image size − actual size', misconception: 'mag-subtract', feedback: 'Magnification is "how many times bigger", so it is a division.' },
      ],
      hint: 'Magnification tells you how many times bigger the image is than the real object.',
      why: 'Magnification = image size ÷ actual size. Both sizes must be in the same units.',
      lv: [1, 3],
    },
    {
      q: 'An electron microscope can show the inside of a mitochondrion, but a school light microscope cannot. Why?',
      a: 'An electron microscope has a much higher magnification and can show much finer detail',
      wrong: [
        { label: 'Light microscopes cannot see mitochondria because they are inside the nucleus', misconception: 'mito-in-nucleus', feedback: 'Mitochondria are in the cytoplasm, not the nucleus.' },
        { label: 'Electron microscopes use coloured stains', misconception: 'em-stains', feedback: 'It is about magnification and detail, not colour.' },
        { label: 'Electron microscopes can be used on living cells only', misconception: 'em-living', feedback: 'Specimens for electron microscopes are not alive. Their advantage is detail.' },
      ],
      hint: 'Compare how much each kind of microscope can magnify.',
      why: 'Electron microscopes magnify far more than light microscopes and show much finer detail (they have a higher resolution), so tiny structures inside cells can be seen.',
      lv: [4, 5],
    },
  ],
}

const OBJECTIVES = [4, 10, 40]
const EYEPIECES = [5, 10, 15]
const MAGS = [40, 50, 100, 200, 400, 500, 1000]
const ACTUAL_MM = [0.01, 0.02, 0.025, 0.04, 0.05, 0.1, 0.2]

function magnificationGenerators(): ItemGenerator[] {
  return [
    G('bio.cells.magnification.total', 'bio.cells.magnification', [1, 3], (rng) => {
      const e = rng.pick(EYEPIECES)
      const o = rng.pick(OBJECTIVES)
      return num({
        prompt: `A microscope has a ×${e} eyepiece lens and a ×${o} objective lens. What is the total magnification?`,
        answer: e * o,
        prefix: '×',
        hint: 'Combine the two lenses: is it adding or multiplying?',
        explanation: `Total magnification = eyepiece × objective = ${e} × ${o} = ×${e * o}.`,
        errors: [{ values: [e + o], tag: 'added-lenses', message: 'The magnifications multiply, they do not add.' }],
      })
    }),
    G('bio.cells.magnification.calc', 'bio.cells.magnification', [2, 5], (rng, d) => {
      // Find a combination that gives a tidy image size (whole number or one decimal place, mm).
      let M = 100
      let a = 0.1
      for (let k = 0; k < 40; k++) {
        M = rng.pick(MAGS)
        a = rng.pick(ACTUAL_MM)
        const img = M * a
        if (img >= 2 && img <= 100 && Math.abs(img * 10 - Math.round(img * 10)) < 1e-9) break
      }
      const img = round(M * a, 3)
      const aUm = round(a * 1000, 3)
      if (d <= 2) {
        return num({
          prompt: `The image of a cell is ${fmt(img)} mm wide. The real cell is ${fmt(a)} mm wide. What is the magnification?`,
          answer: M,
          prefix: '×',
          hint: 'Magnification = image size ÷ actual size.',
          explanation: `Magnification = image size ÷ actual size = ${fmt(img)} ÷ ${fmt(a)} = ×${M}.`,
          errors: [{ values: [round(a / img, 6)], tag: 'mag-upside-down', message: 'You divided the wrong way round. The image is bigger, so the magnification is more than 1.' }],
        })
      }
      if (d === 3) {
        if (rng.chance(0.5)) {
          return num({
            prompt: `A cell is ${fmt(a)} mm wide. It is viewed at a magnification of ×${M}. How wide is the image?`,
            answer: img,
            suffix: 'mm',
            hint: 'Image size = magnification × actual size.',
            explanation: `Image size = magnification × actual size = ${M} × ${fmt(a)} = ${fmt(img)} mm.`,
            errors: [{ values: [round(a / M, 8)], tag: 'divided', message: 'The image is bigger than the real cell, so multiply.' }],
          })
        }
        return num({
          prompt: `The image of a cell is ${fmt(img)} mm wide at a magnification of ×${M}. How wide is the real cell, in mm?`,
          answer: a,
          suffix: 'mm',
          hint: 'Actual size = image size ÷ magnification.',
          explanation: `Actual size = image size ÷ magnification = ${fmt(img)} ÷ ${M} = ${fmt(a)} mm.`,
          errors: [{ values: [round(img * M, 6)], tag: 'multiplied', message: 'The real cell is smaller than the image, so divide.' }],
        })
      }
      if (d === 4) {
        return num({
          prompt: `The image of a cell is ${fmt(img)} mm wide at a magnification of ×${M}. How wide is the real cell? Give your answer in micrometres (µm). (1 mm = 1000 µm)`,
          answer: aUm,
          suffix: 'µm',
          hint: 'Work out the actual size in mm first, then multiply by 1000 to change mm into µm.',
          explanation: `Actual size = ${fmt(img)} ÷ ${M} = ${fmt(a)} mm. In µm: ${fmt(a)} × 1000 = ${fmt(aUm)} µm.`,
          errors: [
            { values: [a], tag: 'forgot-convert', message: 'That is the size in mm. The question asks for µm: multiply by 1000.' },
            { values: [round(img * M, 6)], tag: 'multiplied', message: 'The real cell is smaller than the image, so divide.' },
          ],
        })
      }
      return num({
        prompt: `A cell is ${fmt(aUm)} µm wide. In a drawing, the cell is ${fmt(img)} mm wide. What is the magnification of the drawing? (1 mm = 1000 µm)`,
        answer: M,
        prefix: '×',
        hint: 'Both sizes must be in the same units before you divide. Change the image size into µm first.',
        explanation: `Image size = ${fmt(img)} mm = ${fmt(round(img * 1000, 3))} µm. Magnification = ${fmt(round(img * 1000, 3))} ÷ ${fmt(aUm)} = ×${M}.`,
        errors: [{ values: [round(img / aUm, 6)], tag: 'mixed-units', message: 'The units do not match: change mm into µm before dividing.' }],
      })
    }),
  ]
}

// ----------------------------------------------------------------------------------------------- diffusion

interface DiffusionCase {
  where: string
  what: string
  from: string
  to: string
  why: string
}

const DIFFUSION: DiffusionCase[] = [
  { where: 'In the lungs', what: 'oxygen', from: 'the air in the alveoli', to: 'the blood', why: 'The air in the alveoli has more oxygen than the blood arriving at the lungs.' },
  { where: 'In the lungs', what: 'carbon dioxide', from: 'the blood', to: 'the air in the alveoli', why: 'Blood arriving at the lungs has more carbon dioxide than the air in the alveoli.' },
  { where: 'In a working muscle', what: 'oxygen', from: 'the blood', to: 'the muscle cells', why: 'Muscle cells use up oxygen in respiration, so there is less oxygen inside them than in the blood.' },
  { where: 'In a working muscle', what: 'carbon dioxide', from: 'the muscle cells', to: 'the blood', why: 'Muscle cells make carbon dioxide in respiration, so there is more inside them than in the blood.' },
  { where: 'In a leaf in sunlight', what: 'carbon dioxide', from: 'the air outside the leaf', to: 'the cells inside the leaf', why: 'Leaf cells use carbon dioxide in photosynthesis, so there is less inside the leaf than in the air.' },
  { where: 'In a leaf in sunlight', what: 'oxygen', from: 'the cells inside the leaf', to: 'the air outside the leaf', why: 'Leaf cells make oxygen in photosynthesis, so there is more inside the leaf than in the air.' },
  { where: 'At the placenta', what: 'oxygen', from: 'the mother\'s blood', to: 'the fetus\'s blood', why: 'The mother\'s blood is rich in oxygen; the fetus\'s blood has less because the fetus uses it.' },
  { where: 'At the placenta', what: 'carbon dioxide', from: 'the fetus\'s blood', to: 'the mother\'s blood', why: 'The fetus makes carbon dioxide in respiration, so its blood has more than the mother\'s.' },
  { where: 'In an amoeba living in a pond', what: 'oxygen', from: 'the pond water', to: 'the amoeba', why: 'The amoeba uses oxygen in respiration, so there is less inside it than in the water.' },
]

const diffusionBank: Bank = {
  skill: 'bio.cells.diffusion',
  mcqs: [
    {
      q: 'What is diffusion?',
      a: 'The spreading out of particles from where there are lots of them to where there are fewer',
      wrong: [
        { label: 'The movement of particles from where there are few to where there are lots', misconception: 'diffusion-reversed', feedback: 'That is backwards. Particles spread out from high concentration to low concentration.' },
        { label: 'The breaking down of large food molecules into small ones', misconception: 'diffusion-digestion', feedback: 'That is digestion.' },
        { label: 'The release of energy from glucose', misconception: 'diffusion-respiration', feedback: 'That is respiration.' },
      ],
      hint: 'Think about what happens to the smell of perfume sprayed in one corner of a room.',
      why: 'Diffusion is the net movement of particles from an area of high concentration to an area of low concentration, until they are evenly spread.',
      lv: [1, 3],
    },
    {
      q: 'A drop of food colouring is placed in a beaker of water and left. What happens?',
      a: 'The colour slowly spreads through all the water, even without stirring',
      wrong: [
        { label: 'The colour stays as a drop at the bottom forever', misconception: 'no-diffusion-liquid', feedback: 'Particles in liquids move about randomly, so the colour spreads out.' },
        { label: 'The colour moves to the top and stays there', misconception: 'colour-floats', feedback: 'The particles spread out evenly, not to one place.' },
        { label: 'The colour disappears completely', misconception: 'colour-vanishes', feedback: 'The colour is still there, just spread out (paler).' },
      ],
      hint: 'Particles in a liquid are always moving and bumping around.',
      why: 'The particles of food colouring and water move randomly, so the colour gradually spreads from where it is concentrated until it is even throughout the water. That is diffusion.',
      lv: [1, 3],
    },
    {
      q: 'How does temperature affect the rate of diffusion?',
      a: 'Diffusion is faster at higher temperatures, because the particles move faster',
      wrong: [
        { label: 'Diffusion is slower at higher temperatures', misconception: 'hot-slower', feedback: 'Heating gives particles more energy, so they move and spread faster.' },
        { label: 'Temperature makes no difference', misconception: 'temp-no-effect', feedback: 'Temperature affects how fast particles move.' },
        { label: 'Diffusion only happens above 37 °C', misconception: 'diffusion-37', feedback: 'Diffusion happens at any temperature, just faster when warmer.' },
      ],
      hint: 'What happens to the speed of particles when they are heated?',
      why: 'At higher temperatures particles have more energy and move faster, so they spread out more quickly.',
      lv: [2, 4],
    },
    {
      q: 'Which part of a cell do substances diffuse through to get into or out of the cell?',
      a: 'The cell membrane',
      wrong: [
        { label: 'The nucleus', misconception: 'nucleus-entry', feedback: 'The nucleus is inside the cell. Substances enter through the membrane.' },
        { label: 'The mitochondria', misconception: 'mito-entry', feedback: 'Mitochondria are inside the cell, in the cytoplasm.' },
        { label: 'The chloroplasts', misconception: 'chloroplast-entry', feedback: 'Chloroplasts are inside some plant cells.' },
      ],
      hint: 'It is the outer layer of every cell.',
      why: 'Substances such as oxygen, carbon dioxide and glucose diffuse through the cell membrane, which surrounds every cell.',
      lv: [1, 3],
    },
  ],
  written: [
    {
      prompt: 'Explain why oxygen diffuses from the air in the alveoli into the blood.',
      model: 'Diffusion is the movement of particles from a high concentration to a low concentration. The air in the alveoli contains more oxygen than the blood arriving at the lungs, because the body\'s cells have used oxygen up in respiration. So oxygen diffuses across the thin walls of the alveoli and capillaries into the blood.',
      checklist: ['Defines diffusion (high to low concentration)', 'Says there is more oxygen in the alveoli than in the blood', 'Explains why the blood has less oxygen (used in respiration)', 'Mentions the thin walls'],
      hint: 'Compare the concentration of oxygen in the two places.',
    },
    {
      prompt: 'An amoeba is a single-celled organism with no lungs. Explain how it gets the oxygen it needs.',
      model: 'Oxygen diffuses into the amoeba through its cell membrane. The amoeba uses oxygen in respiration, so the concentration of oxygen inside it is lower than in the water around it. Oxygen therefore moves from the high concentration in the water to the low concentration in the cell. Because the amoeba is so small, the oxygen does not have far to travel.',
      checklist: ['Says oxygen enters by diffusion', 'Mentions the cell membrane', 'Explains the concentration difference (oxygen used in respiration)', 'Mentions the short distance because it is small'],
      hint: 'Where is there more oxygen: in the water or inside the amoeba?',
    },
  ],
}

function diffusionGenerators(): ItemGenerator[] {
  return [
    G('bio.cells.diffusion.direction', 'bio.cells.diffusion', [1, 4], (rng) => {
      const c = rng.pick(DIFFUSION)
      return choice({
        rng,
        prompt: `${c.where}, which way does ${c.what} diffuse?`,
        correct: `From ${c.from} into ${c.to}`,
        wrong: [
          { label: `From ${c.to} into ${c.from}`, misconception: 'diffusion-reversed', feedback: `That is the wrong way. ${c.why}` },
          { label: 'Equally in both directions, so there is no overall movement', misconception: 'no-net-movement', feedback: 'Particles move both ways, but more move from high to low concentration, so there is an overall movement.' },
        ],
        hint: `Where is there more ${c.what}? Diffusion goes from high concentration to low concentration.`,
        explanation: `${c.why} So ${c.what} diffuses from ${c.from} (high concentration) into ${c.to} (low concentration).`,
      })
    }),
  ]
}

// ----------------------------------------------------------------------------------------------- unicellular

const unicellular: Bank = {
  skill: 'bio.cells.unicellular',
  terms: [
    { term: 'Unicellular', def: 'Made of only one cell' },
    { term: 'Multicellular', def: 'Made of many cells' },
    { term: 'Binary fission', def: 'A way of reproducing where one cell divides into two identical cells' },
    { term: 'Flagellum', def: 'A whip-like tail that some single-celled organisms use to move' },
    { term: 'Pseudopod', def: 'A part of an amoeba that flows outwards so it can move and surround food (a "false foot")' },
    { term: 'Contractile vacuole', def: 'A small space in an amoeba that collects extra water and squeezes it out of the cell' },
    { term: 'Eyespot', def: 'A light-sensitive spot that helps a euglena swim towards light' },
  ],
  links: [
    {
      prompt: 'Match each single-celled organism to a feature it has.',
      pairs: [
        ['Amoeba', 'Changes shape and moves using pseudopods'],
        ['Euglena', 'Has chloroplasts, a flagellum and an eyespot'],
        ['Yeast', 'A single-celled fungus that reproduces by budding'],
        ['Bacterium', 'Has no nucleus; its genetic material is loose in the cytoplasm'],
        ['Paramecium', 'Covered in tiny hairs (cilia) that beat to move it through water'],
      ],
      hint: 'Euglena is the green one; yeast is used to make bread.',
      ask: (l) => `Which of these features belongs to ${l === 'Yeast' ? 'yeast' : `a${/^[AIOU]/.test(l) ? 'n' : ''} ${l.toLowerCase()}`}?`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'Euglena is a single-celled organism. In what way is it like a plant?',
      a: 'It has chloroplasts, so it can make its own food by photosynthesis',
      wrong: [
        { label: 'It has roots to take in water', misconception: 'euglena-roots', feedback: 'Euglena is a single cell; it has no roots.' },
        { label: 'It has a flagellum', misconception: 'flagellum-plant', feedback: 'A flagellum helps it swim, which is more like an animal.' },
        { label: 'It has a nucleus', misconception: 'nucleus-plant', feedback: 'Both plant and animal cells have a nucleus, so that does not make it plant-like.' },
      ],
      hint: 'What do plant cells have that animal cells do not?',
      why: 'Euglena has chloroplasts and can photosynthesise like a plant. It can also swim using its flagellum and take in food, like an animal.',
      lv: [2, 4],
    },
    {
      q: 'How does an amoeba feed?',
      a: 'It surrounds a piece of food with its pseudopods and takes it into the cell',
      wrong: [
        { label: 'By photosynthesis in its chloroplasts', misconception: 'amoeba-photosynthesis', feedback: 'An amoeba has no chloroplasts.' },
        { label: 'Through a mouth and digestive system', misconception: 'amoeba-mouth', feedback: 'An amoeba is a single cell, so it has no organs.' },
        { label: 'It does not need food', misconception: 'amoeba-no-food', feedback: 'All living things need food for energy.' },
      ],
      hint: 'Think about how it moves.',
      why: 'An amoeba flows around food using pseudopods, traps it in a small vacuole and digests it inside the cell.',
      lv: [2, 4],
    },
    {
      q: 'Why can a single-celled organism get all the oxygen it needs by diffusion?',
      a: 'It is very small, so oxygen only has a short distance to travel into the cell',
      wrong: [
        { label: 'It does not respire, so it needs no oxygen', misconception: 'no-respiration', feedback: 'Single-celled organisms do respire.' },
        { label: 'It has tiny lungs', misconception: 'tiny-lungs', feedback: 'A single cell has no organs.' },
        { label: 'Its nucleus absorbs oxygen', misconception: 'nucleus-oxygen', feedback: 'Oxygen enters through the cell membrane.' },
      ],
      hint: 'Compare the distance oxygen has to travel into one cell with the distance into the middle of your body.',
      why: 'A single cell is tiny, so oxygen can diffuse through the membrane to every part of it quickly. Large organisms need lungs and blood to deliver oxygen.',
      lv: [3, 5],
    },
  ],
}

// ----------------------------------------------------------------------------------------------- organisation

const LEVELS = ['Cell', 'Tissue', 'Organ', 'Organ system', 'Organism']

const organisation: Bank = {
  skill: 'bio.cells.organisation',
  terms: [
    { term: 'Cell', def: 'The basic building block of all living things' },
    { term: 'Tissue', def: 'A group of similar cells working together to do a job' },
    { term: 'Organ', def: 'A group of different tissues working together to do a job' },
    { term: 'Organ system', def: 'A group of organs working together to do a job' },
    { term: 'Organism', def: 'A whole living thing' },
  ],
  orders: [
    {
      prompt: 'Put the levels of organisation in order, from smallest to largest.',
      steps: LEVELS,
      direction: ['smallest', 'largest'],
      hint: 'Cells make tissues; what do tissues make?',
      why: 'Cells → tissues → organs → organ systems → organism. Each level is made of the one before it.',
      lv: [1, 4],
    },
  ],
  links: [
    {
      prompt: 'Match each organ to the organ system it belongs to.',
      pairs: [
        ['Heart', 'Circulatory system'],
        ['Lungs', 'Gas exchange (breathing) system'],
        ['Stomach', 'Digestive system'],
        ['Brain', 'Nervous system'],
        ['Ovaries', 'Reproductive system'],
        ['Femur (thigh bone)', 'Skeletal system'],
      ],
      hint: 'Think about the job of each organ: pumping, breathing, digesting...',
      ask: (l) => `Which organ system ${l === 'Lungs' || l === 'Ovaries' ? 'do the' : 'does the'} ${l.toLowerCase()} belong to?`,
      lv: [2, 4],
    },
  ],
}

const organisationClassify = classifyGenerators('bio.cells.organisation', {
  id: 'level',
  categories: LEVELS,
  items: [
    ['a muscle cell', 'Cell'],
    ['a palisade cell', 'Cell'],
    ['a red blood cell', 'Cell'],
    ['muscle tissue', 'Tissue'],
    ['nervous tissue', 'Tissue'],
    ['the heart', 'Organ'],
    ['the stomach', 'Organ'],
    ['a leaf', 'Organ'],
    ['the brain', 'Organ'],
    ['the digestive system', 'Organ system'],
    ['the circulatory system', 'Organ system'],
    ['the nervous system', 'Organ system'],
    ['a rabbit', 'Organism'],
    ['an oak tree', 'Organism'],
  ],
  ask: (item) => `What level of organisation is ${item}?`,
  hint: 'Tissue = similar cells; organ = different tissues; organ system = several organs.',
  sortPrompt: 'Match each example to its level of organisation.',
  means: {
    Cell: 'A single cell is the smallest level.',
    Tissue: 'A tissue is a group of similar cells working together.',
    Organ: 'An organ is made of several tissues working together.',
    'Organ system': 'An organ system is a group of organs working together.',
    Organism: 'An organism is a whole living thing.',
  },
})

export const cellsGenerators: ItemGenerator[] = [
  ...bankGenerators(organelles),
  ...bankGenerators(plantAnimal),
  ...plantAnimalClassify,
  ...bankGenerators(specialised),
  ...bankGenerators(microscope),
  ...bankGenerators(magnificationBank),
  ...magnificationGenerators(),
  ...bankGenerators(diffusionBank),
  ...diffusionGenerators(),
  ...bankGenerators(unicellular),
  ...bankGenerators(organisation),
  ...organisationClassify,
]
