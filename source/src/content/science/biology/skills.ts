import type { Skill } from '@/engine/types'

/**
 * Biology part of the KS3 science skill graph (England national curriculum, Years 7-9).
 * Ids are permanent: progress is stored against them. Prerequisites stay inside the Biology part.
 */
const S = (id: string, year: number, strand: string, name: string, description: string, prereqs: string[]): Skill => ({
  id: `science.bio.${id}`,
  subject: 'science',
  year,
  strand,
  name,
  description,
  prereqs: prereqs.map((p) => `science.bio.${p}`),
  origin: 'syllabus',
})

const WS = 'Biology: Working scientifically'
const CELLS = 'Biology: Cells'
const BODY = 'Biology: Skeleton and muscles'
const NUT = 'Biology: Nutrition and digestion'
const GAS = 'Biology: Breathing and respiration'
const PHOTO = 'Biology: Photosynthesis and plants'
const REPRO = 'Biology: Reproduction'
const HEALTH = 'Biology: Health'
const ECO = 'Biology: Ecosystems'
const GEN = 'Biology: Genetics and evolution'

export const biologySkills: Skill[] = [
  // Working scientifically
  S('ws.variables', 7, WS, 'Variables', 'Identify the independent, dependent and control variables in an investigation.', []),
  S('ws.fair-test', 7, WS, 'Fair tests and planning', 'Plan a fair test: change one variable, control the others, repeat readings, and work safely.', ['ws.variables']),
  S('ws.results', 7, WS, 'Results tables and means', 'Record results in a table, calculate a mean and a range, and spot anomalous results.', ['ws.fair-test']),
  S('ws.graphs', 8, WS, 'Graphs and patterns', 'Choose a bar chart or line graph, read values from graphs and describe trends.', ['ws.results']),
  S('ws.evaluate', 9, WS, 'Evaluating investigations', 'Judge whether results are repeatable, reproducible, accurate and precise, and suggest improvements.', ['ws.graphs']),

  // Cells
  S('cells.organelles', 7, CELLS, 'Parts of a cell', 'Name the parts of animal and plant cells and describe what each does.', []),
  S('cells.plant-animal', 7, CELLS, 'Plant and animal cells', 'Compare plant and animal cells: which parts they share and which only plant cells have.', ['cells.organelles']),
  S('cells.specialised', 7, CELLS, 'Specialised cells', 'Explain how the features of specialised cells help them do their jobs.', ['cells.plant-animal']),
  S('cells.microscope', 7, CELLS, 'Using a microscope', 'Name the parts of a light microscope, prepare a slide and focus safely.', []),
  S('cells.magnification', 7, CELLS, 'Magnification', 'Calculate total magnification and use magnification = image size / actual size, converting mm and µm.', ['cells.microscope']),
  S('cells.diffusion', 7, CELLS, 'Diffusion', 'Describe diffusion and how substances move into and out of cells.', ['cells.organelles']),
  S('cells.unicellular', 7, CELLS, 'Unicellular organisms', 'Describe single-celled organisms such as amoeba, euglena, yeast and bacteria.', ['cells.plant-animal']),
  S('cells.organisation', 7, CELLS, 'Cells, tissues, organs and systems', 'Put the levels of organisation in order and give examples of each.', ['cells.specialised']),

  // Skeleton and muscles
  S('body.skeleton', 7, BODY, 'The skeleton', 'Describe the functions of the skeleton and name the main bones.', ['cells.organisation']),
  S('body.muscles', 7, BODY, 'Joints and muscles', 'Describe joints, tendons and ligaments, and how antagonistic muscles move bones.', ['body.skeleton']),

  // Nutrition and digestion
  S('nutrition.food-groups', 8, NUT, 'Nutrients', 'Name the nutrients in a balanced diet, what each is for and foods that contain them.', []),
  S('nutrition.food-tests', 8, NUT, 'Food tests', 'Test foods for starch, sugar, protein and fat, and interpret the colour changes.', ['nutrition.food-groups']),
  S('nutrition.balanced-diet', 8, NUT, 'A balanced diet', 'Explain energy needs, deficiency diseases and the effects of an unbalanced diet; use food labels.', ['nutrition.food-groups']),
  S('nutrition.digestive-system', 8, NUT, 'The digestive system', 'Put the organs of the digestive system in order and describe what each one does.', ['cells.organisation', 'nutrition.food-groups']),
  S('nutrition.enzymes', 8, NUT, 'Digestive enzymes', 'Describe how enzymes, bile and gut bacteria help digestion.', ['nutrition.digestive-system']),

  // Breathing and respiration
  S('gas.lungs', 8, GAS, 'The lungs and gas exchange', 'Name the parts of the gas exchange system and explain how alveoli are adapted.', ['cells.organisation', 'cells.diffusion']),
  S('gas.breathing', 8, GAS, 'Breathing', 'Describe how the ribs and diaphragm move air in and out; breathing rate, exercise and lung volume.', ['gas.lungs']),
  S('gas.aerobic', 8, GAS, 'Aerobic respiration', 'Write the word equation for aerobic respiration and explain where and why it happens.', ['cells.organelles', 'gas.lungs']),
  S('gas.anaerobic', 8, GAS, 'Anaerobic respiration', 'Describe anaerobic respiration in muscles and in yeast (fermentation), and compare it with aerobic.', ['gas.aerobic']),

  // Photosynthesis and plants
  S('photo.equation', 8, PHOTO, 'Photosynthesis', 'Write the word equation for photosynthesis and explain why it matters for life on Earth.', ['cells.plant-animal']),
  S('photo.leaves', 8, PHOTO, 'Leaves, roots and minerals', 'Explain how leaves and roots are adapted, and why plants need minerals.', ['photo.equation', 'cells.specialised']),
  S('photo.starch-test', 8, PHOTO, 'Testing a leaf for starch', 'Follow and explain the method for testing a leaf for starch and predict results.', ['photo.equation', 'nutrition.food-tests']),
  S('photo.rate', 9, PHOTO, 'Rate of photosynthesis', 'Investigate how light, carbon dioxide and temperature affect the rate of photosynthesis.', ['photo.equation', 'ws.graphs']),

  // Reproduction
  S('repro.human-systems', 7, REPRO, 'Human reproductive systems', 'Name the parts of the male and female reproductive systems and what they do.', ['cells.specialised']),
  S('repro.puberty', 7, REPRO, 'Puberty and the menstrual cycle', 'Describe the changes at puberty and the main stages of the menstrual cycle.', ['repro.human-systems']),
  S('repro.pregnancy', 7, REPRO, 'Fertilisation, pregnancy and birth', 'Describe fertilisation, gestation, the placenta and birth.', ['repro.human-systems']),
  S('repro.flowers', 7, REPRO, 'Parts of a flower', 'Name the parts of a flower and describe what they do.', ['cells.organisation']),
  S('repro.pollination', 7, REPRO, 'Pollination and fertilisation in plants', 'Compare insect and wind pollination and describe fertilisation in plants.', ['repro.flowers']),
  S('repro.seeds', 7, REPRO, 'Seed dispersal and germination', 'Describe how seeds are dispersed, why, and what they need to germinate.', ['repro.pollination']),

  // Health
  S('health.drugs', 8, HEALTH, 'Drugs and medicines', 'Classify drugs as medicinal or recreational and as stimulants or depressants; addiction.', []),
  S('health.smoking-alcohol', 8, HEALTH, 'Smoking and alcohol', 'Describe the effects of smoking and alcohol on the body.', ['health.drugs', 'gas.lungs']),

  // Ecosystems
  S('eco.food-chains', 7, ECO, 'Food chains', 'Build food chains and name producers and consumers; arrows show the transfer of energy.', []),
  S('eco.food-webs', 8, ECO, 'Food webs and interdependence', 'Use food webs to predict the effect of a change in one population; ecosystem vocabulary.', ['eco.food-chains']),
  S('eco.adaptation', 8, ECO, 'Adaptation and competition', 'Explain how organisms are adapted to their environment and what they compete for.', ['eco.food-webs']),
  S('eco.sampling', 8, ECO, 'Sampling with quadrats', 'Use quadrats to estimate the size of a population.', ['ws.results', 'eco.adaptation']),
  S('eco.bioaccumulation', 9, ECO, 'Bioaccumulation', 'Explain how toxic substances build up along a food chain.', ['eco.food-webs']),

  // Genetics and evolution
  S('gen.variation', 8, GEN, 'Variation', 'Classify variation as inherited or environmental, and continuous or discontinuous; species.', ['ws.results']),
  S('gen.dna', 9, GEN, 'DNA, genes and chromosomes', 'Describe how DNA, genes and chromosomes carry inherited information, and how the DNA model was discovered.', ['cells.organelles', 'gen.variation']),
  S('gen.natural-selection', 9, GEN, 'Natural selection', 'Explain how natural selection leads to evolution, with examples.', ['gen.dna', 'eco.adaptation']),
  S('gen.extinction', 9, GEN, 'Extinction and gene banks', 'Explain why species become extinct and how gene banks help protect biodiversity.', ['gen.natural-selection']),
]
