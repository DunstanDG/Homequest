import type { ItemGenerator } from '@/engine/registry'
import { choice } from '../../kit'
import { bankGenerators, fix, fmt, G, num, round, table, type Bank } from './factory'

// =====================================================================================================================
// Pure and impure substances
// =====================================================================================================================

const pure: Bank = {
  skill: 'chem.separation.pure',
  terms: [
    { term: 'Pure substance', def: 'A single element or compound, not mixed with anything else' },
    { term: 'Impure substance', def: 'A substance with small amounts of other substances mixed in' },
    { term: 'Melting point', def: 'The temperature at which a solid turns into a liquid' },
    { term: 'Boiling point', def: 'The temperature at which a liquid boils and turns into a gas' },
  ],
  mcqs: [
    {
      q: 'A carton says "100% pure orange juice". Is it pure in the chemistry sense?',
      a: 'No: it is a mixture of water, sugars, acids and other substances',
      wrong: [
        { label: 'Yes, because nothing has been added to it', misconception: 'everyday-pure', feedback: 'In everyday language "pure" means nothing added. In chemistry it means only ONE substance.' },
        'Yes, because it comes from oranges only',
        'No, because it contains orange bits',
      ],
      hint: 'In chemistry, "pure" means only one substance.',
      why: 'In chemistry a pure substance is a single element or compound. Orange juice contains many different substances, so it is a mixture, even if nothing has been added.',
      lv: [2, 4],
    },
    {
      q: 'How can you tell from melting point data whether a solid is pure?',
      a: 'A pure substance melts at one sharp, fixed temperature',
      wrong: [
        { label: 'A pure substance melts over a wide range of temperatures', misconception: 'pure-range', feedback: 'It is the other way round: IMPURE substances melt over a range.' },
        'A pure substance has a higher mass',
        'A pure substance melts at exactly 100 °C',
      ],
      hint: 'Which melts more cleanly: one substance, or a mixture?',
      why: 'A pure substance melts and boils at fixed, sharp temperatures. Impurities make a substance melt over a range of temperatures, usually lower than the pure melting point.',
      lv: [2, 4],
    },
    {
      q: 'Salt is spread on icy roads in winter. Why does this help?',
      a: 'The salt makes the water impure, which lowers its freezing point, so ice melts at below 0 °C',
      wrong: [
        { label: 'Salt is hot, so it melts the ice', misconception: 'salt-hot', feedback: 'The salt is not warm. It changes the temperature at which the water freezes.' },
        'Salt raises the freezing point of water',
        'Salt soaks up the water',
      ],
      hint: 'How do impurities affect melting and freezing points?',
      why: 'Impurities lower the melting (freezing) point. Salty water freezes below 0 °C, so roads stay ice-free on colder nights.',
      lv: [3, 5],
    },
    {
      q: 'What effect does dissolving salt in water have on the water\'s boiling point?',
      a: 'It raises it above 100 °C',
      wrong: [{ label: 'It lowers it below 100 °C', misconception: 'impurity-lowers-bp', feedback: 'Impurities LOWER the melting point but RAISE the boiling point.' }, 'It has no effect', 'It makes the water boil at exactly 0 °C'],
      hint: 'Impurities affect melting and boiling points in opposite directions.',
      why: 'Impurities raise the boiling point. Salty water boils at a little above 100 °C.',
      lv: [4, 5],
    },
  ],
}

interface Sample {
  label: string
  melt: string
  pure: boolean
}

const pureGenerators: ItemGenerator[] = [
  G('chem.separation.pure.data', 'chem.separation.pure', [2, 5], (rng, d) => {
    // Pure aspirin-like solid with a sharp melting point; the impure samples melt lower and over a range.
    const mp = rng.pick([79, 114, 122, 135, 156])
    const samples: Sample[] = [
      { label: 'A', melt: `${mp}`, pure: true },
      { label: 'B', melt: `${mp - rng.int(8, 12)} to ${mp - rng.int(3, 5)}`, pure: false },
      { label: 'C', melt: `${mp - rng.int(18, 25)} to ${mp - rng.int(9, 13)}`, pure: false },
    ]
    const shuffled = rng.shuffle(samples).map((x, i) => ({ ...x, label: String.fromCharCode(65 + i) }))
    const pureOne = shuffled.find((x) => x.pure) as Sample
    const fig = table(['Sample', 'Melting point (°C)'], shuffled.map((x) => [x.label, x.melt]))
    if (d <= 4) {
      return choice({
        rng,
        prompt: `Three samples of a white solid were tested. The pure substance melts at ${mp} °C. Which sample is pure?`,
        correct: `Sample ${pureOne.label}`,
        wrong: shuffled.filter((x) => !x.pure).map((x) => ({ label: `Sample ${x.label}`, misconception: 'impure-range', feedback: `Sample ${x.label} melts over a range of temperatures, so it contains impurities.` })),
        keepOrder: true,
        figure: fig,
        hint: 'Look for a sharp melting point rather than a range.',
        explanation: `Sample ${pureOne.label} melts at one fixed temperature (${mp} °C), so it is pure. The others melt over a range of lower temperatures, which shows they are impure.`,
      })
    }
    // Level 5: which is the MOST impure?
    const worst = shuffled.reduce((a, b) => (Number(b.melt.split(' ')[0]) < Number(a.melt.split(' ')[0]) ? b : a))
    return choice({
      rng,
      prompt: `Three samples of a solid were tested. The pure substance melts at ${mp} °C. Which sample is likely to contain the MOST impurity?`,
      correct: `Sample ${worst.label}`,
      wrong: shuffled.filter((x) => x !== worst).map((x) => `Sample ${x.label}`),
      keepOrder: true,
      figure: fig,
      hint: 'More impurity generally means a lower melting point and a wider range.',
      explanation: `Sample ${worst.label} melts furthest below ${mp} °C and over the widest range, so it is likely to contain the most impurity.`,
    })
  }),
]

// =====================================================================================================================
// Dissolving and solutions
// =====================================================================================================================

const solutions: Bank = {
  skill: 'chem.separation.solutions',
  terms: [
    { term: 'Solute', def: 'The substance that dissolves, such as salt in salt water' },
    { term: 'Solvent', def: 'The liquid that a substance dissolves in, such as the water in salt water' },
    { term: 'Solution', def: 'The mixture formed when a substance dissolves in a liquid' },
    { term: 'Soluble', def: 'Able to dissolve in a particular liquid' },
    { term: 'Insoluble', def: 'Not able to dissolve in a particular liquid' },
    { term: 'Saturated solution', def: 'A solution in which no more solute will dissolve at that temperature' },
    { term: 'Solubility', def: 'The mass of a substance that will dissolve in 100 g of a solvent at a given temperature' },
  ],
  mcqs: [
    {
      q: 'When sugar dissolves in tea, what happens to the sugar particles?',
      a: 'They separate and spread out between the water particles',
      wrong: [
        { label: 'They disappear', misconception: 'dissolving-disappears', feedback: 'The sugar is still there; you can taste it. Its particles are too small to see.' },
        { label: 'They melt', misconception: 'dissolve-melt', feedback: 'Melting needs heat and involves only one substance. Dissolving is a solid mixing with a liquid.' },
        'They turn into water particles',
      ],
      hint: 'You cannot see the sugar, but you can still taste it.',
      why: 'When a solute dissolves its particles separate and mix in between the solvent particles. They are too small to see, but they are still there.',
      lv: [1, 3],
    },
    {
      q: 'Which of these is insoluble in water?',
      a: 'Sand',
      wrong: [{ label: 'Salt', misconception: 'salt-insoluble', feedback: 'Salt dissolves in water: that is why sea water tastes salty.' }, 'Sugar', 'Coffee granules'],
      hint: 'Which one stays at the bottom of the glass however much you stir?',
      why: 'Sand does not dissolve in water, so it is insoluble. Salt, sugar and instant coffee all dissolve.',
      lv: [1, 2],
    },
    {
      q: 'How does warming water usually affect how much of a solid like sugar can dissolve in it?',
      a: 'More can dissolve in warmer water',
      wrong: [{ label: 'Less can dissolve in warmer water', misconception: 'warm-less-soluble', feedback: 'For most solids, solubility goes up as the temperature rises.' }, 'It makes no difference', 'None can dissolve in warm water'],
      hint: 'Think about dissolving sugar in hot tea compared with iced tea.',
      why: 'For most solids, solubility increases with temperature, so more dissolves in warm water.',
      lv: [2, 4],
    },
    {
      q: 'Salt dissolves in water but not in cooking oil. What does this show?',
      a: 'Whether a substance is soluble depends on the solvent',
      wrong: ['Salt is insoluble', 'Oil is not a liquid', { label: 'Salt is soluble in everything', misconception: 'soluble-everything', feedback: 'Solubility always depends on which solvent you use.' }],
      hint: 'Soluble in what?',
      why: 'A substance can be soluble in one solvent and insoluble in another. Nail varnish, for example, dissolves in propanone (nail varnish remover) but not in water.',
      lv: [3, 5],
    },
  ],
}

const solutionGenerators: ItemGenerator[] = [
  G('chem.separation.solutions.mass', 'chem.separation.solutions', [2, 4], (rng, d) => {
    const solute = rng.pick(['salt', 'sugar', 'copper sulfate'])
    const water = rng.pick([50, 100, 150, 200, 250])
    // Keep well below the solubility of all three solids (at most 25 g per 100 g of water).
    const s = d <= 2 ? rng.pick([5, 10, 15, 20, 25].filter((x) => x <= water / 4)) : rng.int(3, Math.floor(water / 4)) + (d >= 4 ? rng.pick([0, 0.5]) : 0)
    if (d <= 3) {
      return num({
        prompt: `${s} g of ${solute} is completely dissolved in ${water} g of water. What is the mass of the solution? Give your answer in g.`,
        answer: water + s,
        suffix: 'g',
        tolerance: 0.01,
        hint: 'When something dissolves, no particles are lost.',
        explanation: `Mass is conserved when something dissolves: ${water} + ${fmt(s)} = ${fmt(water + s)} g.`,
        errors: [{ values: [water], tag: 'dissolved-disappears', message: 'The solute has not disappeared. Its mass is still there in the solution.' }],
      })
    }
    const total = round(water + s, 2)
    return num({
      prompt: `Some ${solute} is dissolved in ${water} g of water. The solution has a mass of ${fmt(total)} g. What mass of ${solute} was dissolved? Give your answer in g.`,
      answer: s,
      suffix: 'g',
      tolerance: 0.01,
      hint: 'Mass of solution = mass of solute + mass of solvent.',
      explanation: `${fmt(total)} − ${water} = ${fmt(s)} g of ${solute}.`,
    })
  }),

  G('chem.separation.solutions.solubility', 'chem.separation.solutions', [3, 5], (rng, d) => {
    // Solubility of an unnamed solid X at several temperatures (g per 100 g water), increasing.
    const temps = [20, 40, 60, 80]
    const base = rng.pick([10, 15, 20, 25, 30])
    const step = rng.pick([10, 15, 20])
    const sol = temps.map((_, i) => base + i * step)
    const fig = table(['Temperature (°C)', 'Solubility of X (g per 100 g of water)'], temps.map((t, i) => [t, sol[i] ?? 0]))
    const i = rng.int(0, 3)
    const t = temps[i] ?? 20
    const sAt = sol[i] ?? 0
    if (d === 3) {
      return num({
        prompt: `Use the table. What is the maximum mass of X that dissolves in 100 g of water at ${t} °C? Give your answer in g.`,
        answer: sAt,
        suffix: 'g',
        figure: fig,
        hint: 'Read across from the temperature to the solubility.',
        explanation: `At ${t} °C the solubility is ${sAt} g per 100 g of water. Adding any more would give a saturated solution with undissolved solid left over.`,
      })
    }
    if (d === 4) {
      const water = rng.pick([50, 200, 300])
      const ans = (sAt * water) / 100
      return num({
        prompt: `Use the table. What is the maximum mass of X that dissolves in ${water} g of water at ${t} °C? Give your answer in g.`,
        answer: ans,
        suffix: 'g',
        tolerance: 0.01,
        figure: fig,
        hint: 'The table is for 100 g of water. How many times bigger or smaller is your amount of water?',
        explanation: `${sAt} g dissolves in 100 g, so in ${water} g: ${sAt} × ${water} ÷ 100 = ${fmt(ans)} g.`,
        errors: [{ values: [sAt], tag: 'not-scaled', message: 'That is for 100 g of water. Scale it to the amount of water you have.' }],
      })
    }
    const hiI = rng.int(1, 3)
    const loI = rng.int(0, hiI - 1)
    const crystals = (sol[hiI] ?? 0) - (sol[loI] ?? 0)
    return num({
      prompt: `A saturated solution of X in 100 g of water is made at ${temps[hiI]} °C, then cooled to ${temps[loI]} °C. What mass of crystals of X forms? Give your answer in g.`,
      answer: crystals,
      suffix: 'g',
      figure: fig,
      hint: 'How much was dissolved at the start, and how much can stay dissolved at the end?',
      explanation: `At ${temps[hiI]} °C, ${sol[hiI]} g was dissolved. At ${temps[loI]} °C only ${sol[loI]} g can stay dissolved, so ${sol[hiI]} − ${sol[loI]} = ${crystals} g comes out as crystals.`,
    })
  }),
]

// =====================================================================================================================
// Filtration, evaporation and crystallisation
// =====================================================================================================================

const filtering: Bank = {
  skill: 'chem.separation.filtering',
  terms: [
    { term: 'Filtration', def: 'Separating an insoluble solid from a liquid by passing it through filter paper' },
    { term: 'Residue', def: 'The solid left behind in the filter paper' },
    { term: 'Filtrate', def: 'The liquid (or solution) that passes through the filter paper' },
    { term: 'Evaporation', def: 'Heating a solution so that the solvent turns into a gas and leaves the dissolved solid behind' },
    { term: 'Crystallisation', def: 'Letting a concentrated solution cool slowly so that crystals of the solid form' },
  ],
  mcqs: [
    {
      q: 'Sandy salt water is poured through filter paper. What is the residue?',
      a: 'Sand',
      wrong: [{ label: 'Salt', misconception: 'dissolved-in-residue', feedback: 'The salt is dissolved, so its particles pass through the paper with the water.' }, 'Salt water', 'Pure water'],
      hint: 'The residue is what cannot get through the paper.',
      why: 'Sand is insoluble and its grains are too big to pass through the holes in the filter paper, so it is the residue. The salt water passes through as the filtrate.',
      lv: [1, 3],
    },
    {
      q: 'Why can dissolved salt pass through filter paper but sand cannot?',
      a: 'The dissolved salt particles are tiny and fit through the holes; sand grains are too big',
      wrong: [
        { label: 'Salt is lighter than sand', misconception: 'filter-weight', feedback: 'Filtering works by size, not by weight.' },
        'Filter paper attracts sand',
        'Salt particles are liquid',
      ],
      hint: 'Filter paper works like a very fine sieve.',
      why: 'Filter paper has tiny holes. Water and dissolved particles are small enough to pass through; insoluble grains are too large.',
      lv: [2, 4],
    },
    {
      q: 'Why does leaving a solution to evaporate slowly give bigger crystals than heating it quickly until it is dry?',
      a: 'Slow evaporation gives the particles time to build up into large, regular crystals',
      wrong: [
        { label: 'Heating makes the crystals melt into smaller pieces', misconception: 'heat-melts-crystals', feedback: 'The crystals are not melting. Fast evaporation just gives the particles less time to arrange themselves.' },
        'Slow evaporation adds more solute',
        'There is no difference in crystal size',
      ],
      hint: 'Think about how much time the particles have to line up.',
      why: 'When the solvent evaporates slowly, particles join on to existing crystals in a regular pattern, so large crystals grow. Fast heating gives lots of tiny crystals (a powder).',
      lv: [3, 5],
    },
    {
      q: 'Which method is best for getting the salt back out of salt water?',
      a: 'Evaporation',
      wrong: [
        { label: 'Filtration', misconception: 'filter-dissolved', feedback: 'Dissolved salt passes straight through filter paper.' },
        { label: 'Chromatography', misconception: 'chrom-salt', feedback: 'Chromatography separates small amounts of dyes, not salt from water.' },
        'Using a magnet',
      ],
      hint: 'You need to get rid of the water and keep the salt.',
      why: 'Heating the salt water evaporates the water and leaves the salt behind.',
      lv: [1, 3],
    },
  ],
  orders: [
    {
      prompt: 'Put the steps for getting pure salt from rock salt (salt mixed with sand and grit) in order.',
      steps: [
        'Crush the rock salt into small pieces',
        'Add water and stir so the salt dissolves',
        'Filter the mixture to remove the sand and grit',
        'Heat the filtrate in an evaporating dish to evaporate some of the water',
        'Leave the solution to cool so salt crystals form',
      ],
      direction: ['first', 'last'],
      hint: 'You have to dissolve the salt before you can filter out the insoluble part.',
      why: 'Crushing helps the salt dissolve; dissolving lets it pass through the filter paper while the sand stays behind; evaporating and crystallising gets the salt back out of the filtrate.',
      lv: [2, 5],
    },
  ],
}

// =====================================================================================================================
// Distillation
// =====================================================================================================================

const distillation: Bank = {
  skill: 'chem.separation.distillation',
  terms: [
    { term: 'Simple distillation', def: 'Separating a solvent from a solution by boiling the solvent off and condensing it' },
    { term: 'Fractional distillation', def: 'Separating a mixture of liquids that have different boiling points' },
    { term: 'Condenser', def: 'The cooled tube in which the vapour turns back into a liquid' },
    { term: 'Distillate', def: 'The liquid collected after the vapour has condensed' },
  ],
  mcqs: [
    {
      q: 'Which method would you use to get pure drinking water from sea water?',
      a: 'Simple distillation',
      wrong: [
        { label: 'Evaporation', misconception: 'evaporation-keeps-water', feedback: 'Evaporation leaves the salt but lets the water escape into the air. You want to keep the water.' },
        { label: 'Filtration', misconception: 'filter-dissolved', feedback: 'Dissolved salt goes straight through filter paper.' },
        'Chromatography',
      ],
      hint: 'You need to collect the water, not lose it.',
      why: 'In simple distillation the water boils off, then the steam is cooled in a condenser and collected as pure water. The salt stays behind.',
      lv: [1, 3],
    },
    {
      q: 'In a condenser, why does the cold water go in at the bottom and out at the top?',
      a: 'So the outer jacket stays completely full of cold water and cools the vapour well',
      wrong: [
        { label: 'So the water flows in the same direction as the vapour', misconception: 'condenser-same-direction', feedback: 'It flows the opposite way to the vapour. Going in at the bottom keeps the jacket full.' },
        'Because hot water sinks',
        'It does not matter which way it goes',
      ],
      hint: 'What would happen if water came in at the top and ran straight out of the bottom?',
      why: 'Filling from the bottom means the jacket fills completely with cold water, so the whole tube stays cold and condenses the vapour efficiently.',
      lv: [4, 5],
    },
    {
      q: 'In simple distillation of salt water, what happens to the steam in the condenser?',
      a: 'It cools and condenses back into liquid water',
      wrong: [
        { label: 'It turns into salt', misconception: 'steam-to-salt', feedback: 'Only water boils off. The salt stays in the flask.' },
        'It is heated further until it disappears',
        'It freezes into ice',
      ],
      hint: 'The condenser is cold.',
      why: 'The condenser is cooled by cold water, so the steam loses energy and condenses back into a liquid, which drips into the collecting beaker.',
      lv: [1, 3],
    },
    {
      q: 'Where should the thermometer bulb be placed during distillation?',
      a: 'Level with the side arm leading to the condenser, to measure the temperature of the vapour',
      wrong: [
        { label: 'Down in the boiling liquid', misconception: 'thermometer-in-liquid', feedback: 'You need the temperature of the vapour going into the condenser, which tells you what is distilling over.' },
        'Inside the condenser',
        'In the collecting beaker',
      ],
      hint: 'You want to know the boiling point of whatever is going over into the condenser.',
      why: 'With the bulb at the side arm, the thermometer reads the temperature of the vapour leaving the flask, which shows which substance is distilling.',
      lv: [3, 5],
    },
  ],
  orders: [
    {
      prompt: 'Put the stages of simple distillation of salty water in order.',
      steps: ['The salty water is heated in a flask', 'The water boils and turns into steam', 'The steam passes into the condenser', 'The steam cools and condenses into liquid water', 'Pure water drips into the beaker, and the salt stays in the flask'],
      direction: ['first', 'last'],
      hint: 'Follow the water from the flask to the beaker.',
      why: 'Heat → boil → vapour travels to the condenser → condenses → collected. The salt cannot boil at this temperature, so it stays behind.',
      lv: [2, 4],
    },
  ],
}

/** Boiling points at normal pressure, °C (rounded data-book values). */
const LIQUIDS: [string, number][] = [
  ['Propanone', 56],
  ['Methanol', 65],
  ['Ethanol', 78],
  ['Water', 100],
]

const distillationGenerators: ItemGenerator[] = [
  G('chem.separation.distillation.first-off', 'chem.separation.distillation', [3, 5], (rng, d) => {
    const pair = rng.shuffle(LIQUIDS).slice(0, d >= 5 ? 3 : 2)
    const fig = table(['Liquid', 'Boiling point (°C)'], pair.map(([n, b]) => [n, b]))
    const first = pair.reduce((a, b) => (b[1] < a[1] ? b : a))
    const last = pair.reduce((a, b) => (b[1] > a[1] ? b : a))
    return choice({
      rng,
      prompt: `A mixture of ${pair.map(([n]) => n.toLowerCase()).join(', ').replace(/, ([^,]*)$/, ' and $1')} is separated by fractional distillation. Which liquid is collected first?`,
      correct: first[0],
      wrong: pair.filter((x) => x !== first).map(([n]) => ({ label: n, misconception: 'highest-bp-first', feedback: n === last[0] ? 'This has the highest boiling point, so it boils off last.' : 'Compare the boiling points: the lowest one boils off first.' })),
      figure: fig,
      hint: 'As the mixture is heated, which liquid reaches its boiling point first?',
      explanation: `${first[0]} has the lowest boiling point (${first[1]} °C), so it boils first, condenses in the condenser and is collected first.`,
    })
  }),
]

// =====================================================================================================================
// Chromatography
// =====================================================================================================================

const chromatography: Bank = {
  skill: 'chem.separation.chromatography',
  terms: [
    { term: 'Chromatography', def: 'A method for separating the dissolved substances in a mixture, such as the dyes in an ink' },
    { term: 'Chromatogram', def: 'The paper with the separated spots on it after chromatography' },
    { term: 'Solvent front', def: 'How far up the paper the solvent has travelled' },
    { term: 'Baseline', def: 'The pencil line on which the spots of mixture are placed at the start' },
  ],
  mcqs: [
    {
      q: 'Why is the baseline on chromatography paper drawn in pencil, not ink?',
      a: 'Ink would dissolve in the solvent and separate too, which would spoil the results',
      wrong: [
        { label: 'Pencil is easier to see', misconception: 'pencil-visible', feedback: 'Visibility is not the reason. The pencil (graphite) is insoluble, so it stays put.' },
        'Ink would make the paper too wet',
        'Pencil helps the solvent move up the paper',
      ],
      hint: 'What would happen to the line itself when the solvent reaches it?',
      why: 'Graphite in pencil is insoluble, so the line stays where it is. An ink line would dissolve and its dyes would travel up the paper, mixing with the results.',
      lv: [2, 4],
    },
    {
      q: 'Why must the baseline be above the level of the solvent in the beaker?',
      a: 'Otherwise the spots would dissolve into the solvent in the beaker instead of travelling up the paper',
      wrong: [
        { label: 'So the solvent travels faster', misconception: 'speed-solvent', feedback: 'The reason is to stop the spots washing out into the beaker.' },
        'So the paper does not get wet',
        'So the pencil line does not smudge',
      ],
      hint: 'What would happen to a spot that sat under the solvent?',
      why: 'If the spots were under the solvent, the dyes would simply dissolve into the beaker and nothing would separate on the paper.',
      lv: [3, 5],
    },
    {
      q: 'Why do different dyes travel different distances up the paper?',
      a: 'They have different solubilities in the solvent and are attracted to the paper by different amounts',
      wrong: [
        { label: 'Darker dyes are heavier so they travel less far', misconception: 'dark-heavy', feedback: 'Colour has nothing to do with it. It depends on solubility and attraction to the paper.' },
        'The dyes were put on at different heights',
        'The solvent carries all dyes the same distance',
      ],
      hint: 'A dye that dissolves well in the solvent spends more time moving with it.',
      why: 'A dye that is very soluble in the solvent, and only weakly attracted to the paper, moves further up. Each dye has its own balance, so they separate.',
      lv: [3, 5],
    },
  ],
}

const chromatographyGenerators: ItemGenerator[] = [
  G('chem.separation.chromatography.dyes', 'chem.separation.chromatography', [2, 5], (rng, d) => {
    // Known dyes A-E with distinct spot heights; ink X contains 2 (or 3 at L5) of them.
    const heights = rng.shuffle([1.5, 2.5, 3.5, 4.5, 5.5, 6.5]).slice(0, 5)
    const dyes = ['A', 'B', 'C', 'D', 'E'].map((n, i) => ({ n, h: heights[i] ?? 1 }))
    const k = d >= 5 ? 3 : 2
    const inX = rng.shuffle(dyes).slice(0, k).sort((a, b) => a.n.localeCompare(b.n))
    const rows = [['Ink X', inX.map((x) => fix(x.h, 1)).sort().join(' and ')], ...dyes.map((x) => [`Dye ${x.n}`, fix(x.h, 1)])]
    const fig = table(['Sample', 'Height of spot(s) above baseline (cm)'], rows)
    if (d <= 2) {
      return num({
        prompt: 'The table shows a chromatography experiment. What is the smallest number of different dyes in ink X?',
        answer: k,
        suffix: 'dyes',
        figure: fig,
        hint: 'Each spot is a different substance.',
        explanation: `Ink X separates into ${k} spots, so it contains at least ${k} different dyes.`,
      })
    }
    const correct = inX.map((x) => x.n).join(' and ').replace(/ and (?=.* and )/g, ', ')
    const others = dyes.filter((x) => !inX.includes(x))
    const wrongs = [
      [inX[0], others[0]],
      [others[0], others[1]],
      [inX[1], others[1]],
      d >= 5 ? [inX[0], inX[1]] : [inX[0]],
    ]
      .map((g) => g.filter((x): x is NonNullable<typeof x> => !!x).map((x) => x.n).sort().join(' and ').replace(/ and (?=.* and )/g, ', '))
      .filter((w) => w && w !== correct)
    return choice({
      rng,
      prompt: 'The table shows a chromatography experiment with ink X and five known dyes. Which dyes are in ink X?',
      correct: `Dyes ${correct}`,
      wrong: [...new Set(wrongs)].slice(0, 3).map((w) => ({ label: `Dyes ${w}`, misconception: 'chromatogram-match', feedback: 'Check every spot from ink X: each must match a dye at exactly the same height, and every spot must be accounted for.' })),
      figure: fig,
      hint: 'A dye is in the ink if one of the ink\'s spots is at exactly the same height.',
      explanation: `Ink X has spots at ${[...inX].sort((a, b) => a.h - b.h).map((x) => `${fix(x.h, 1)} cm`).join(' and ')}, matching dye${k > 1 ? 's' : ''} ${correct}.`,
    })
  }),

  G('chem.separation.chromatography.rf', 'chem.separation.chromatography', [4, 5], (rng) => {
    const solvent = rng.pick([8, 10, 12, 16, 20])
    const rf = rng.pick([0.25, 0.4, 0.5, 0.6, 0.75, 0.8])
    const spot = round(solvent * rf, 2)
    return num({
      prompt: `On a chromatogram the solvent travelled ${solvent} cm from the baseline and a red spot travelled ${fmt(spot)} cm. Calculate the R_{f} value of the red dye. (R_{f} = distance moved by the spot ÷ distance moved by the solvent.)`,
      answer: rf,
      tolerance: 0.005,
      hint: 'Divide the smaller distance by the larger one. R_{f} is always less than 1.',
      explanation: `R_{f} = ${fmt(spot)} ÷ ${solvent} = ${fmt(rf)}. R_{f} values have no units and are always less than 1.`,
      errors: [{ values: [round(solvent / spot, 4)], tag: 'rf-upside-down', message: 'R_{f} is the spot distance divided by the solvent distance, so it must be less than 1.' }],
    })
  }),
]

// =====================================================================================================================
// Choosing a separation method
// =====================================================================================================================

const choosing: Bank = {
  skill: 'chem.separation.choosing',
  links: [
    {
      prompt: 'Match each mixture to the best way to separate it.',
      pairs: [
        ['Sand from water', 'Filtration'],
        ['Pure water from sea water', 'Simple distillation'],
        ['The dyes in a felt-tip pen ink', 'Chromatography'],
        ['Iron filings from sulfur powder', 'Using a magnet'],
      ],
      hint: 'Ask: is the thing you want dissolved or not? Is it a liquid you need to keep?',
      ask: (l) => `What is the best way to separate ${l.charAt(0).toLowerCase() + l.slice(1)}?`,
      lv: [2, 4],
    },
  ],
  mcqs: [
    {
      q: 'Which method gets solid copper sulfate crystals from copper sulfate solution?',
      a: 'Crystallisation',
      wrong: [
        { label: 'Filtration', misconception: 'filter-dissolved', feedback: 'The copper sulfate is dissolved, so it passes straight through the filter paper.' },
        { label: 'Chromatography', misconception: 'chrom-salt', feedback: 'Chromatography identifies dyes; it does not recover a solid.' },
        'Simple distillation',
      ],
      hint: 'You want to keep the solid, and get nice crystals.',
      why: 'Heat the solution to evaporate some water, then leave it to cool and crystallise. Copper sulfate crystals form.',
      lv: [2, 4],
    },
    {
      q: 'A forensic scientist wants to check whether the ink on a forged note came from a suspect\'s pen. Which method should she use?',
      a: 'Chromatography',
      wrong: ['Filtration', 'Fractional distillation', { label: 'Evaporation', misconception: 'evap-ink', feedback: 'Evaporation would leave all the dyes together in one patch; it would not separate them.' }],
      hint: 'She needs to compare the dyes in two inks.',
      why: 'Chromatography separates the dyes in each ink so the patterns of spots can be compared.',
      lv: [2, 4],
    },
    {
      q: 'Crude oil is a mixture of many liquids with different boiling points. How is it separated?',
      a: 'Fractional distillation',
      wrong: [{ label: 'Simple distillation', misconception: 'simple-for-many-liquids', feedback: 'Simple distillation separates a solvent from a dissolved solid. Many liquids with different boiling points need fractional distillation.' }, 'Filtration', 'Chromatography'],
      hint: 'It is a mixture of liquids with different boiling points.',
      why: 'In fractional distillation the different liquids (fractions) condense at different heights in a column, according to their boiling points.',
      lv: [3, 5],
    },
  ],
  orders: [
    {
      prompt: 'You have a mixture of sand, salt and water. Put the steps for getting dry sand and solid salt in order.',
      steps: ['Stir the mixture so all the salt is dissolved', 'Filter the mixture: the sand stays in the filter paper', 'Pour the filtrate (salt solution) into an evaporating dish', 'Heat the filtrate to evaporate the water', 'Collect the salt left in the evaporating dish'],
      direction: ['first', 'last'],
      hint: 'Separate the insoluble part first, then deal with the solution.',
      why: 'Filtration removes the insoluble sand (residue); the salt solution passes through as the filtrate, and evaporating the water leaves the salt.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Describe how you would get a sample of pure, dry salt from a mixture of salt and sand. Explain why each step works.',
      model:
        'First I would add water and stir. The salt dissolves but the sand is insoluble. Next I would filter the mixture: the sand grains are too big to pass through the filter paper so they stay behind as the residue, while the salt solution passes through as the filtrate. Finally I would heat the filtrate in an evaporating dish. The water evaporates and the salt is left behind.',
      checklist: ['Adds water to dissolve the salt', 'Says the sand is insoluble', 'Filters to remove the sand (residue)', 'Evaporates the water from the filtrate to leave the salt', 'Explains why at least one step works'],
      hint: 'Use the fact that salt dissolves in water but sand does not.',
    },
  ],
}

export const separationGenerators: ItemGenerator[] = [
  ...bankGenerators(pure),
  ...pureGenerators,
  ...bankGenerators(solutions),
  ...solutionGenerators,
  ...bankGenerators(filtering),
  ...bankGenerators(distillation),
  ...distillationGenerators,
  ...bankGenerators(chromatography),
  ...chromatographyGenerators,
  ...bankGenerators(choosing),
]
