import type { Skill } from '@/engine/types'

/**
 * CHEMISTRY SKILL GRAPH - the Chemistry part of KS3 Science (Years 7-9), England national curriculum.
 *
 * Strands follow the usual KS3 scheme of work (AQA KS3 / Activate / Exploring Science): the particle model; atoms,
 * elements and compounds; pure substances and separating mixtures; chemical reactions; acids and alkalis; the periodic
 * table; metals and materials; the Earth and atmosphere; plus a "working scientifically" strand for the lab (hazard
 * symbols, apparatus, tables of results). Year 8 is the densest because that is where she is now. Prerequisites answer
 * "if she gets this wrong, what earlier idea is the likely reason?" and stay inside the Chemistry part.
 */

const S = (id: string, year: number, strand: string, name: string, description: string, prereqs: string[], origin: Skill['origin'] = 'syllabus'): Skill => ({
  id: `science.chem.${id}`,
  subject: 'science',
  year,
  strand,
  name,
  description,
  prereqs: prereqs.map((p) => `science.chem.${p}`),
  origin,
})

const WS = 'Chemistry: Working scientifically'
const PART = 'Chemistry: Particles'
const ATOM = 'Chemistry: Atoms, elements and compounds'
const SEP = 'Chemistry: Separating mixtures'
const RXN = 'Chemistry: Chemical reactions'
const ACID = 'Chemistry: Acids and alkalis'
const PT = 'Chemistry: The periodic table'
const MAT = 'Chemistry: Metals and materials'
const EARTH = 'Chemistry: Earth and atmosphere'

export const chemistrySkills: Skill[] = [
  // ------------------------------------------------------------- working scientifically
  S('ws.hazards', 7, WS, 'Hazard symbols and lab safety', 'Recognise the hazard symbols and what they warn about, and follow the basic rules for working safely in a lab.', []),
  S('ws.apparatus', 7, WS, 'Lab apparatus', 'Name common apparatus, choose the right piece for a job, measure carefully and use a Bunsen burner.', ['ws.hazards']),
  S('ws.results', 8, WS, 'Tables of results', 'Identify variables, calculate means and ranges from repeat readings, spot anomalous results and choose the right kind of graph.', ['ws.apparatus']),

  // ------------------------------------------------------------- particles
  S('particles.materials', 6, PART, 'Solids, liquids and gases', 'Sort everyday materials into solids, liquids and gases by how they behave.', [], 'foundation'),
  S('particles.states', 7, PART, 'The particle model', 'Describe the arrangement and movement of particles in solids, liquids and gases, and use it to explain their properties.', ['particles.materials']),
  S('particles.changes', 7, PART, 'Changes of state', 'Melting, freezing, boiling, evaporating, condensing and subliming; melting and boiling points; using data to predict a state.', ['particles.states']),
  S('particles.diffusion', 7, PART, 'Diffusion and gas pressure', 'Explain diffusion and gas pressure using moving particles, and how temperature affects them.', ['particles.states']),
  S('particles.density', 8, PART, 'Density and particles', 'Explain density differences using particle spacing, and calculate density = mass ÷ volume.', ['particles.states']),

  // ------------------------------------------------------------- atoms, elements and compounds
  S('atoms.elements', 7, ATOM, 'Atoms and elements', 'What atoms, elements and molecules are, and Dalton\'s idea of atoms.', ['particles.states']),
  S('atoms.symbols', 7, ATOM, 'Chemical symbols', 'Match element names to their chemical symbols, including those from Latin names.', ['atoms.elements']),
  S('atoms.mixtures', 7, ATOM, 'Elements, compounds and mixtures', 'Tell elements, compounds and mixtures apart from descriptions and particle pictures.', ['atoms.elements']),
  S('atoms.compounds', 8, ATOM, 'Compounds and formulae', 'Name simple compounds, and read a chemical formula to say which elements and how many atoms it contains.', ['atoms.symbols', 'atoms.mixtures']),
  S('atoms.formula-mass', 9, ATOM, 'Relative formula mass', 'Calculate the relative formula mass of a compound from relative atomic masses.', ['atoms.compounds']),
  S('atoms.structure', 9, ATOM, 'Inside the atom', 'Protons, neutrons and electrons; atomic number and mass number; how the model of the atom developed.', ['atoms.elements', 'periodic.table']),

  // ------------------------------------------------------------- separating mixtures
  S('separation.pure', 7, SEP, 'Pure and impure substances', 'What "pure" means in chemistry, and using melting and boiling points to test purity.', ['atoms.mixtures', 'particles.changes']),
  S('separation.solutions', 7, SEP, 'Dissolving and solutions', 'Solute, solvent, solution, solubility and saturated solutions; mass is conserved when something dissolves.', ['particles.states']),
  S('separation.filtering', 7, SEP, 'Filtration, evaporation and crystallisation', 'Separate insoluble solids by filtering, and get a dissolved solid back by evaporation or crystallisation.', ['separation.solutions']),
  S('separation.distillation', 7, SEP, 'Distillation', 'Use simple distillation to get a solvent from a solution, and fractional distillation to separate liquids.', ['separation.solutions', 'particles.changes']),
  S('separation.chromatography', 7, SEP, 'Chromatography', 'Separate and identify dyes with paper chromatography, and read a chromatogram.', ['separation.solutions']),
  S('separation.choosing', 8, SEP, 'Choosing a separation method', 'Choose and sequence separation techniques for a given mixture.', ['separation.filtering', 'separation.distillation', 'separation.chromatography']),

  // ------------------------------------------------------------- chemical reactions
  S('reactions.changes', 7, RXN, 'Physical and chemical changes', 'Tell chemical reactions from physical changes, and spot the signs that a reaction has happened.', ['particles.changes']),
  S('reactions.word-equations', 8, RXN, 'Word equations', 'Identify reactants and products, and write word equations.', ['reactions.changes', 'atoms.compounds']),
  S('reactions.conservation', 8, RXN, 'Conservation of mass', 'Mass is conserved in reactions; explain apparent mass changes when gases join or escape, and calculate missing masses.', ['reactions.word-equations']),
  S('reactions.combustion', 8, RXN, 'Combustion and oxidation', 'Burning fuels and elements, the fire triangle, incomplete combustion, rusting, and acidic and basic oxides.', ['reactions.word-equations']),
  S('reactions.gas-tests', 8, RXN, 'Testing for gases', 'Tests for oxygen, hydrogen, carbon dioxide (and water and chlorine).', ['reactions.changes']),
  S('reactions.decomposition', 8, RXN, 'Thermal decomposition', 'Heat breaks some compounds down; metal carbonates give a metal oxide and carbon dioxide.', ['reactions.word-equations']),
  S('reactions.energy', 8, RXN, 'Exothermic and endothermic', 'Classify reactions as exothermic or endothermic from temperature changes and everyday examples.', ['reactions.changes', 'ws.results']),
  S('reactions.symbol-equations', 9, RXN, 'Balanced symbol equations', 'Read symbol equations, count atoms on each side and balance simple equations.', ['reactions.conservation', 'atoms.compounds']),
  S('reactions.catalysts', 9, RXN, 'Catalysts and rates', 'What catalysts do, and how temperature, concentration and surface area change the rate of a reaction.', ['reactions.energy']),

  // ------------------------------------------------------------- acids and alkalis
  S('acids.ph', 7, ACID, 'Acids, alkalis and pH', 'The pH scale, indicators (universal indicator and litmus), everyday acids and alkalis, and their hazards.', ['ws.hazards']),
  S('acids.neutralisation', 7, ACID, 'Neutralisation', 'Acid + alkali gives a salt and water; how pH changes; everyday uses of neutralisation.', ['acids.ph']),
  S('acids.salts', 8, ACID, 'Making salts', 'Name the salt from an acid and a metal, base or carbonate, and give the other products.', ['acids.neutralisation', 'reactions.word-equations']),

  // ------------------------------------------------------------- periodic table
  S('periodic.table', 8, PT, 'Groups and periods', 'How the periodic table is arranged (groups, periods, metals and non-metals) and Mendeleev\'s contribution.', ['atoms.symbols']),
  S('periodic.metals-nonmetals', 8, PT, 'Metals and non-metals', 'Physical and chemical properties of metals and non-metals, including their oxides.', ['periodic.table']),
  S('periodic.group1', 8, PT, 'Group 1: the alkali metals', 'Properties, reactions with water and trends down group 1.', ['periodic.table', 'periodic.metals-nonmetals']),
  S('periodic.group7', 8, PT, 'Group 7: the halogens', 'Properties, trends and displacement reactions of the halogens.', ['periodic.table', 'reactions.word-equations']),
  S('periodic.group0', 8, PT, 'Group 0: the noble gases', 'Why the noble gases are unreactive, their uses and trends.', ['periodic.table']),

  // ------------------------------------------------------------- metals and materials
  S('metals.reactivity', 9, MAT, 'The reactivity series', 'Order metals by reactivity using their reactions with water, acids and oxygen.', ['periodic.group1', 'reactions.combustion', 'acids.salts']),
  S('metals.displacement', 9, MAT, 'Displacement reactions', 'Predict and explain displacement reactions using the reactivity series.', ['metals.reactivity', 'reactions.word-equations']),
  S('metals.extraction', 9, MAT, 'Extracting metals', 'Ores, extraction by heating with carbon (reduction) or by electrolysis, depending on reactivity.', ['metals.reactivity']),
  S('materials.types', 9, MAT, 'Ceramics, polymers and composites', 'Properties and uses of ceramics, polymers and composites, and choosing materials for a job.', ['periodic.metals-nonmetals']),

  // ------------------------------------------------------------- Earth and atmosphere
  S('earth.rocks', 8, EARTH, 'Earth\'s structure and rocks', 'The layers of the Earth, and how igneous, sedimentary and metamorphic rocks form.', ['atoms.mixtures', 'particles.changes']),
  S('earth.rock-cycle', 8, EARTH, 'The rock cycle', 'Weathering, erosion, deposition and the processes linking the three rock types.', ['earth.rocks']),
  S('earth.atmosphere', 8, EARTH, 'The atmosphere', 'The gases in today\'s air, and how the atmosphere has changed over Earth\'s history.', ['atoms.mixtures']),
  S('earth.carbon-cycle', 8, EARTH, 'The carbon cycle', 'Processes that move carbon into and out of the atmosphere, and where carbon is stored.', ['reactions.combustion', 'earth.atmosphere']),
  S('earth.climate', 9, EARTH, 'Climate change', 'The greenhouse effect, how human activity adds greenhouse gases, the effects and what can be done.', ['earth.carbon-cycle']),
  S('earth.resources', 9, EARTH, 'Earth\'s resources and recycling', 'Finite resources, and the benefits and costs of recycling.', ['metals.extraction', 'materials.types']),
]
