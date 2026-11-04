import type { ItemGenerator } from '@/engine/registry'
import type { Rng } from '@/engine/types'
import { choice, textItem } from '../../kit'
import { bankGenerators, cap, classifyGenerators, fix, fmt, G, num, round, table, type Bank } from './factory'
import { EQUATIONS, isBalanced, parseFormula, showEq, showSide, sideAtoms, type Equation } from './formula'

// =====================================================================================================================
// Physical and chemical changes
// =====================================================================================================================

const MEANS_CHANGE: Record<string, string> = {
  'Chemical change': 'New substances are made, and it is usually hard to reverse.',
  'Physical change': 'No new substance is made, and it is usually easy to reverse.',
}

const changeClassify = classifyGenerators('chem.reactions.changes', {
  id: 'classify',
  categories: ['Chemical change', 'Physical change'],
  items: [
    ['ice melting', 'Physical change'],
    ['water boiling', 'Physical change'],
    ['salt dissolving in water', 'Physical change'],
    ['steam condensing on a mirror', 'Physical change'],
    ['wax melting', 'Physical change'],
    ['chocolate melting', 'Physical change'],
    ['sugar dissolving in tea', 'Physical change'],
    ['a glass bottle breaking', 'Physical change'],
    ['wood burning', 'Chemical change'],
    ['an iron nail rusting', 'Chemical change'],
    ['an egg being fried', 'Chemical change'],
    ['bread being toasted', 'Chemical change'],
    ['milk going sour', 'Chemical change'],
    ['magnesium burning in air', 'Chemical change'],
    ['a cake baking', 'Chemical change'],
    ['a firework exploding', 'Chemical change'],
  ],
  ask: (x) => `Is ${x} a chemical change or a physical change?`,
  hint: 'Has a NEW substance been made, or is it the same substance in a different form?',
  means: MEANS_CHANGE,
})

const changes: Bank = {
  skill: 'chem.reactions.changes',
  terms: [
    { term: 'Chemical reaction', def: 'A change in which atoms are rearranged to make new substances' },
    { term: 'Reactants', def: 'The substances you start with in a chemical reaction' },
    { term: 'Products', def: 'The new substances made in a chemical reaction' },
    { term: 'Precipitate', def: 'An insoluble solid that forms when two solutions react' },
    { term: 'Physical change', def: 'A change in which no new substance is made, such as melting or dissolving' },
  ],
  mcqs: [
    {
      q: 'Which observation is NOT a sign that a chemical reaction has happened?',
      a: 'Bubbles forming in a pan of water as it boils',
      wrong: [
        { label: 'Bubbles of gas when an indigestion tablet is put in water', misconception: 'fizzing-physical', feedback: 'Fizzing here comes from a new gas (carbon dioxide) being made, so it IS a reaction.' },
        'A solid suddenly appearing when two clear solutions are mixed',
        'A shiny copper surface turning black when it is heated in air',
      ],
      hint: 'Boiling makes bubbles too. Is anything new made when water boils?',
      why: 'The bubbles in boiling water are just water as a gas (steam): no new substance, so it is a physical change. The other options all make new substances.',
      lv: [3, 5],
    },
    {
      q: 'Which of these is a sign that a chemical reaction is happening?',
      a: 'A gas is given off (fizzing) when two substances are mixed',
      wrong: [
        { label: 'A solid changes into a liquid', misconception: 'melting-chemical', feedback: 'That is melting, a physical change.' },
        'The mixture is stirred',
        { label: 'A solid seems to disappear when it is added to water', misconception: 'dissolving-chemical', feedback: 'That is dissolving, a physical change.' },
      ],
      hint: 'Look for evidence of a NEW substance.',
      why: 'Signs of a chemical reaction include fizzing (a gas made), a colour change, a temperature change, a precipitate forming, and light or sound being given off.',
      lv: [1, 3],
    },
    {
      q: 'Clear sodium chloride solution and clear silver nitrate solution are mixed. A white solid suddenly appears. What is the white solid called?',
      a: 'A precipitate',
      wrong: [{ label: 'A solute', misconception: 'solute-precipitate', feedback: 'A solute is dissolved. This solid is insoluble and comes out of the solution.' }, 'A solvent', 'A residue'],
      hint: 'It is an insoluble solid made by a reaction between two solutions.',
      why: 'When two solutions react to make an insoluble solid, the solid is called a precipitate. Here it is silver chloride.',
      lv: [3, 5],
    },
  ],
}

// =====================================================================================================================
// Word equations
// =====================================================================================================================

interface Reaction {
  reactants: string[]
  products: string[]
  /** How the reaction is described in a question, e.g. "Magnesium burns in oxygen". */
  says: string
}

const R = (r: string, p: string, says: string): Reaction => ({ reactants: r.split(' + '), products: p.split(' + '), says })

const REACTIONS: Reaction[] = [
  R('magnesium + oxygen', 'magnesium oxide', 'Magnesium burns in oxygen to make magnesium oxide.'),
  R('iron + sulfur', 'iron sulfide', 'Iron and sulfur are heated together and react to make iron sulfide.'),
  R('carbon + oxygen', 'carbon dioxide', 'Carbon burns in plenty of oxygen to make carbon dioxide.'),
  R('hydrogen + oxygen', 'water', 'Hydrogen burns in oxygen to make water.'),
  R('methane + oxygen', 'carbon dioxide + water', 'Methane burns in plenty of oxygen, making carbon dioxide and water.'),
  R('calcium carbonate', 'calcium oxide + carbon dioxide', 'Calcium carbonate is heated and breaks down into calcium oxide and carbon dioxide.'),
  R('copper carbonate', 'copper oxide + carbon dioxide', 'Copper carbonate is heated and breaks down into copper oxide and carbon dioxide.'),
  R('magnesium + hydrochloric acid', 'magnesium chloride + hydrogen', 'Magnesium reacts with hydrochloric acid to make magnesium chloride and hydrogen.'),
  R('zinc + sulfuric acid', 'zinc sulfate + hydrogen', 'Zinc reacts with sulfuric acid to make zinc sulfate and hydrogen.'),
  R('sodium hydroxide + hydrochloric acid', 'sodium chloride + water', 'Sodium hydroxide neutralises hydrochloric acid, making sodium chloride and water.'),
  R('sodium + water', 'sodium hydroxide + hydrogen', 'Sodium reacts with water to make sodium hydroxide and hydrogen.'),
  R('sodium + chlorine', 'sodium chloride', 'Sodium reacts with chlorine to make sodium chloride.'),
  R('zinc + copper sulfate', 'zinc sulfate + copper', 'Zinc reacts with copper sulfate solution to make zinc sulfate and copper.'),
  R('copper oxide + sulfuric acid', 'copper sulfate + water', 'Copper oxide reacts with sulfuric acid to make copper sulfate and water.'),
  R('calcium carbonate + hydrochloric acid', 'calcium chloride + water + carbon dioxide', 'Calcium carbonate reacts with hydrochloric acid to make calcium chloride, water and carbon dioxide.'),
  R('iron + oxygen', 'iron oxide', 'Iron reacts with oxygen to make iron oxide.'),
]

const ALL_SUBSTANCES = [...new Set(REACTIONS.flatMap((r) => [...r.reactants, ...r.products]))]
const wordEq = (r: Reaction) => `${r.reactants.join(' + ')} → ${r.products.join(' + ')}`

const wordEquationGenerators: ItemGenerator[] = [
  G('chem.reactions.word-equations.reactant-or-product', 'chem.reactions.word-equations', [1, 3], (rng) => {
    const r = rng.pick(REACTIONS)
    const askReactant = rng.chance(0.5)
    const pool = askReactant ? r.reactants : r.products
    const target = rng.pick(pool)
    const wrongPool = askReactant ? r.products : r.reactants
    const outside = rng.shuffle(ALL_SUBSTANCES.filter((s) => !r.reactants.includes(s) && !r.products.includes(s))).slice(0, 3 - Math.min(2, wrongPool.length))
    return choice({
      rng,
      prompt: `${wordEq(r)}\nWhich of these is a ${askReactant ? 'reactant' : 'product'} in this reaction?`,
      correct: cap(target),
      wrong: [
        ...wrongPool.slice(0, 2).map((w) => ({ label: cap(w), misconception: 'reactant-product-swap', feedback: `${cap(w)} is on the ${askReactant ? 'right' : 'left'} of the arrow, so it is a ${askReactant ? 'product' : 'reactant'}.` })),
        ...outside.map((w) => ({ label: cap(w), misconception: 'not-in-equation', feedback: `${cap(w)} is not in this equation at all.` })),
      ],
      hint: 'Reactants are on the left of the arrow; products are on the right.',
      explanation: `Reactants (what you start with) are on the left: ${r.reactants.join(', ')}. Products (what is made) are on the right: ${r.products.join(', ')}.`,
    })
  }),

  G('chem.reactions.word-equations.write', 'chem.reactions.word-equations', [2, 4], (rng) => {
    const r = rng.pick(REACTIONS)
    const correct = wordEq(r)
    const swapped = `${r.products.join(' + ')} → ${r.reactants.join(' + ')}`
    const other = rng.pick(REACTIONS.filter((x) => x !== r && x.reactants.some((s) => r.reactants.includes(s))).concat(REACTIONS.filter((x) => x !== r)))
    const mixed = `${r.reactants.join(' + ')} → ${other.products.join(' + ')}`
    const plusArrow = `${r.reactants.join(' + ')} + ${r.products.join(' + ')}`
    return choice({
      rng,
      prompt: `${r.says} Which is the correct word equation?`,
      correct,
      wrong: [
        { label: swapped, misconception: 'reactant-product-swap', feedback: 'The reactants (what you start with) go on the LEFT of the arrow.' },
        { label: mixed, misconception: 'wrong-products', feedback: 'Check the products against the description.' },
        { label: plusArrow, misconception: 'no-arrow', feedback: 'An equation needs an arrow between the reactants and the products.' },
      ],
      hint: 'Starting substances on the left, then an arrow, then what is made.',
      explanation: `${correct}. The arrow means "react to make"; a plus sign on the left means "reacts with", on the right "and".`,
    })
  }),

  G('chem.reactions.word-equations.complete', 'chem.reactions.word-equations', [3, 5], (rng, d) => {
    const r = rng.pick(REACTIONS.filter((x) => x.products.length + x.reactants.length >= 3))
    const sideP = d >= 4 || rng.chance(0.6)
    const list = sideP ? r.products : r.reactants
    const gapI = rng.int(0, list.length - 1)
    const gap = list[gapI] ?? ''
    const show = (xs: string[], hide: boolean) => xs.map((x, i) => (hide && i === gapI ? '______' : x)).join(' + ')
    const shown = `${show(r.reactants, !sideP)} → ${show(r.products, sideP)}`
    if (d >= 5) {
      return textItem({
        prompt: `${r.says.replace(/ to make .*$| and breaks down .*$|, making .*$/, '.')}\nComplete the word equation:\n${shown}`,
        accept: [gap, ...(gap === 'sulfuric acid' ? ['sulphuric acid'] : []), ...(gap.includes('sulfate') ? [gap.replace('sulfate', 'sulphate')] : [])],
        placeholder: 'Name of substance',
        hint: 'Think about which elements are in the reactants: atoms are not created or destroyed.',
        explanation: `${wordEq(r)}.`,
      })
    }
    const wrongs = rng.shuffle(ALL_SUBSTANCES.filter((s) => !r.reactants.includes(s) && !r.products.includes(s))).slice(0, 3)
    return choice({
      rng,
      prompt: `Complete the word equation:\n${shown}`,
      correct: cap(gap),
      wrong: wrongs.map((w) => ({ label: cap(w), misconception: 'atoms-from-nowhere', feedback: `Check the elements: ${w} cannot be made from (or make) the other substances shown.` })),
      hint: 'The same elements must appear on both sides of the arrow.',
      explanation: `${wordEq(r)}. Every element in the reactants ends up in the products, so the missing substance must contain the elements that are not yet accounted for.`,
    })
  }),
]

// =====================================================================================================================
// Conservation of mass
// =====================================================================================================================

interface MassReaction {
  eq: string
  /** Masses in g in the real reacting ratio (from relative formula masses). */
  a: [string, number]
  b?: [string, number]
  product: [string, number]
  /** Second product (for decompositions). */
  product2?: [string, number]
}

const MASS_REACTIONS: MassReaction[] = [
  { eq: 'magnesium + oxygen → magnesium oxide', a: ['magnesium', 24], b: ['oxygen', 16], product: ['magnesium oxide', 40] },
  { eq: 'carbon + oxygen → carbon dioxide', a: ['carbon', 12], b: ['oxygen', 32], product: ['carbon dioxide', 44] },
  { eq: 'iron + sulfur → iron sulfide', a: ['iron', 56], b: ['sulfur', 32], product: ['iron sulfide', 88] },
  { eq: 'calcium + oxygen → calcium oxide', a: ['calcium', 80], b: ['oxygen', 32], product: ['calcium oxide', 112] },
  { eq: 'calcium carbonate → calcium oxide + carbon dioxide', a: ['calcium carbonate', 100], product: ['calcium oxide', 56], product2: ['carbon dioxide', 44] },
  { eq: 'magnesium carbonate → magnesium oxide + carbon dioxide', a: ['magnesium carbonate', 84], product: ['magnesium oxide', 40], product2: ['carbon dioxide', 44] },
]

const SCALES = [0.1, 0.2, 0.25, 0.5, 1, 2]

const conservationGenerators: ItemGenerator[] = [
  G('chem.reactions.conservation.missing-mass', 'chem.reactions.conservation', [2, 5], (rng, d) => {
    const r = rng.pick(MASS_REACTIONS)
    const k = d <= 2 ? rng.pick([1, 2, 0.5]) : rng.pick(SCALES)
    const A = round(r.a[1] * k, 2)
    if (r.b) {
      const B = round(r.b[1] * k, 2)
      const P = round(r.product[1] * k, 2)
      const askProduct = d <= 3 || rng.chance(0.5)
      if (askProduct) {
        return num({
          prompt: `${r.eq}\n${fmt(A)} g of ${r.a[0]} reacts completely with ${fmt(B)} g of ${r.b[0]}. What mass of ${r.product[0]} is made? Give your answer in g.`,
          answer: P,
          suffix: 'g',
          tolerance: 0.01,
          hint: 'Atoms are not created or destroyed, so the total mass stays the same.',
          explanation: `Mass is conserved: ${fmt(A)} + ${fmt(B)} = ${fmt(P)} g of ${r.product[0]}.`,
          errors: [{ values: [A], tag: 'forgot-oxygen', message: `Don't forget the mass of the ${r.b[0]} that joined on.` }],
        })
      }
      return num({
        prompt: `${r.eq}\n${fmt(A)} g of ${r.a[0]} reacts completely to make ${fmt(P)} g of ${r.product[0]}. What mass of ${r.b[0]} reacted? Give your answer in g.`,
        answer: B,
        suffix: 'g',
        tolerance: 0.01,
        hint: 'Total mass of reactants = total mass of products.',
        explanation: `Mass is conserved: ${fmt(P)} − ${fmt(A)} = ${fmt(B)} g of ${r.b[0]}.`,
        errors: [{ values: [round(A + P, 2)], tag: 'added-instead', message: 'Subtract: the product mass already includes the first reactant.' }],
      })
    }
    const P = round(r.product[1] * k, 2)
    const P2 = round((r.product2?.[1] ?? 0) * k, 2)
    return num({
      prompt: `${r.eq}\n${fmt(A)} g of ${r.a[0]} is heated until it has all broken down, leaving ${fmt(P)} g of ${r.product[0]}. What mass of ${r.product2?.[0]} was given off? Give your answer in g.`,
      answer: P2,
      suffix: 'g',
      tolerance: 0.01,
      hint: 'The mass that seems to be "lost" has escaped as a gas.',
      explanation: `Mass is conserved: ${fmt(A)} − ${fmt(P)} = ${fmt(P2)} g of ${r.product2?.[0]}, which escaped into the air.`,
      errors: [{ values: [round(A + P, 2)], tag: 'added-instead', message: 'Subtract the mass left from the starting mass.' }],
    })
  }),

  G('chem.reactions.conservation.open-closed', 'chem.reactions.conservation', [2, 5], (rng, d) => {
    const cases: { setup: string; answer: 'Increase' | 'Decrease' | 'Stay the same'; why: string; lv: number }[] = [
      { setup: 'Magnesium ribbon is heated in an open crucible until it has all turned into magnesium oxide.', answer: 'Increase', why: 'Oxygen atoms from the air join on to the magnesium, so the solid gains their mass.', lv: 3 },
      { setup: 'Marble chips (calcium carbonate) are added to hydrochloric acid in an open flask on a balance.', answer: 'Decrease', why: 'Carbon dioxide gas is made and escapes into the air, so its mass leaves the flask.', lv: 2 },
      { setup: 'Two solutions are mixed in a sealed flask and a precipitate forms.', answer: 'Stay the same', why: 'Nothing can get in or out of a sealed flask, so the total mass is conserved.', lv: 2 },
      { setup: 'Copper carbonate is heated strongly in an open test tube.', answer: 'Decrease', why: 'It breaks down into copper oxide and carbon dioxide gas, which escapes.', lv: 3 },
      { setup: 'Iron wool is left to rust in damp air on an open dish.', answer: 'Increase', why: 'Oxygen (and water) from the air join on to the iron, adding mass.', lv: 4 },
      { setup: 'Marble chips are added to hydrochloric acid in a flask with a balloon sealed over the top.', answer: 'Stay the same', why: 'The carbon dioxide made is trapped in the balloon, so no mass escapes.', lv: 4 },
      { setup: 'A candle burns on a balance.', answer: 'Decrease', why: 'The products (carbon dioxide and water vapour) are gases that escape into the air.', lv: 3 },
    ]
    const fits = cases.filter((c) => Math.abs(c.lv - d) <= 1)
    const c = rng.pick(fits.length ? fits : cases)
    return choice({
      rng,
      prompt: `${c.setup} What happens to the mass shown on the balance?`,
      correct: c.answer,
      wrong: (['Increase', 'Decrease', 'Stay the same'] as const)
        .filter((x) => x !== c.answer)
        .map((x) => ({ label: x, misconception: 'open-system-mass', feedback: 'Ask: can a gas get IN (from the air) or OUT (into the air)?' })),
      keepOrder: true,
      hint: 'Atoms are never destroyed, but gases can join from the air or escape into it.',
      explanation: c.why,
    })
  }),
]

const conservation: Bank = {
  skill: 'chem.reactions.conservation',
  mcqs: [
    {
      q: 'What does the law of conservation of mass say about a chemical reaction?',
      a: 'The total mass of the products equals the total mass of the reactants',
      wrong: [
        { label: 'The products always weigh less, because some mass is used up', misconception: 'mass-used-up', feedback: 'No mass is used up. Atoms are only rearranged.' },
        'The products always weigh more',
        'Mass is only conserved in physical changes',
      ],
      hint: 'Atoms are rearranged, not created or destroyed.',
      why: 'In a reaction atoms are rearranged into new substances; none are made or destroyed, so the total mass stays the same.',
      lv: [1, 3],
    },
  ],
  written: [
    {
      prompt: 'When magnesium is burned in a crucible, the mass of the solid goes up. A student says this proves that mass is not conserved. Explain why the student is wrong.',
      model:
        'The magnesium reacts with oxygen from the air to make magnesium oxide. The oxygen atoms join on to the magnesium, so the solid gains their mass. If we included the mass of the oxygen that reacted, the total mass before and after would be the same, so mass is still conserved.',
      checklist: ['Says magnesium reacts with oxygen', 'Says the oxygen comes from the air', 'Says the extra mass is the mass of the oxygen that joined on', 'States that total mass is conserved / atoms are not created or destroyed'],
      hint: 'Where did the extra mass come from?',
    },
  ],
}

// =====================================================================================================================
// Combustion and oxidation
// =====================================================================================================================

const combustion: Bank = {
  skill: 'chem.reactions.combustion',
  terms: [
    { term: 'Combustion', def: 'A reaction in which a substance burns, reacting quickly with oxygen and giving out energy as heat and light' },
    { term: 'Oxidation', def: 'A reaction in which a substance gains oxygen' },
    { term: 'Fuel', def: 'A substance that is burned to release energy' },
    { term: 'Incomplete combustion', def: 'Burning with too little oxygen, which can make carbon monoxide and soot' },
    { term: 'Rusting', def: 'The slow oxidation of iron, which needs both oxygen and water' },
  ],
  links: [
    {
      prompt: 'Match each way of putting out a fire to the side of the fire triangle it removes.',
      pairs: [
        ['Putting a fire blanket over a chip-pan fire', 'Oxygen'],
        ['Cutting a firebreak through a forest', 'Fuel'],
        ['Spraying water on burning wood', 'Heat'],
      ],
      hint: 'The fire triangle is heat, fuel and oxygen. Which one does each action take away?',
      ask: (l) => `${l} stops a fire burning. Which side of the fire triangle does it remove?`,
      lv: [2, 4],
    },
    {
      prompt: 'Match each element to the oxide it makes when it burns in oxygen.',
      pairs: [
        ['Magnesium', 'Magnesium oxide (a white powder)'],
        ['Carbon', 'Carbon dioxide (a gas)'],
        ['Sulfur', 'Sulfur dioxide (a choking gas)'],
        ['Hydrogen', 'Water'],
        ['Copper (heated in air)', 'Copper oxide (a black solid)'],
      ],
      hint: 'The element joins with oxygen. Hydrogen oxide is better known by another name.',
      ask: (l) => `What is made when ${l.toLowerCase()} reacts with oxygen?`,
      lv: [2, 4],
    },
  ],
  mcqs: [
    {
      q: 'What are the products when methane (natural gas) burns completely in plenty of oxygen?',
      a: 'Carbon dioxide and water',
      wrong: [
        { label: 'Carbon monoxide and water', misconception: 'complete-co', feedback: 'Carbon monoxide is made when there is NOT enough oxygen (incomplete combustion).' },
        'Carbon dioxide and hydrogen',
        { label: 'Smoke and ash only', misconception: 'burning-destroys', feedback: 'The atoms in methane (carbon and hydrogen) end up as carbon dioxide and water.' },
      ],
      hint: 'Methane contains carbon and hydrogen. Each joins with oxygen.',
      why: 'Methane is a hydrocarbon (carbon and hydrogen). When it burns completely, the carbon makes carbon dioxide and the hydrogen makes water: methane + oxygen → carbon dioxide + water.',
      lv: [1, 3],
    },
    {
      q: 'Why can a gas boiler with a poor air supply be dangerous?',
      a: 'Incomplete combustion makes carbon monoxide, a toxic gas with no colour or smell',
      wrong: [
        { label: 'It makes too much oxygen', misconception: 'boiler-oxygen', feedback: 'Burning uses up oxygen; it does not make it.' },
        'It makes the water too hot',
        'It makes hydrogen, which explodes',
      ],
      hint: 'What does a fuel make when it burns without enough oxygen?',
      why: 'Without enough oxygen, fuels burn incompletely and make carbon monoxide. It is toxic and has no colour or smell, which is why homes have carbon monoxide detectors.',
      lv: [3, 5],
    },
    {
      q: 'Iron nails are set up in three test tubes: one in dry air, one in boiled water with oil on top (no air), and one in water open to the air. Which nail rusts?',
      a: 'The one in water open to the air',
      wrong: [
        { label: 'The one in dry air', misconception: 'rust-needs-air-only', feedback: 'There is oxygen but no water, and rusting needs both.' },
        { label: 'The one in boiled water with oil on top', misconception: 'rust-needs-water-only', feedback: 'Boiling removes dissolved air and the oil stops more getting in, so there is water but no oxygen.' },
        'All three rust equally',
      ],
      hint: 'Rusting needs two things.',
      why: 'Rusting needs both oxygen and water. Only the nail in water that is open to the air has both.',
      lv: [3, 5],
    },
    {
      q: 'How does painting a bicycle frame stop it rusting?',
      a: 'It keeps oxygen and water away from the iron',
      wrong: [{ label: 'It makes the iron less reactive', misconception: 'paint-changes-metal', feedback: 'The iron is unchanged; the paint is a barrier.' }, 'It makes the frame stronger', 'It reacts with the rust and removes it'],
      hint: 'What does rusting need?',
      why: 'Paint, oil and grease are barriers that stop oxygen and water reaching the iron, so it cannot rust.',
      lv: [2, 4],
    },
    {
      q: 'Sulfur dioxide dissolves in rain water. What kind of solution does it make?',
      a: 'An acidic solution',
      wrong: [{ label: 'An alkaline solution', misconception: 'non-metal-oxide-alkaline', feedback: 'Metal oxides form alkalis; non-metal oxides form acids.' }, 'A neutral solution', 'It does not dissolve'],
      hint: 'Sulfur is a non-metal.',
      why: 'Non-metal oxides such as sulfur dioxide and carbon dioxide dissolve in water to form acidic solutions. Sulfur dioxide from burning fuels is one cause of acid rain.',
      lv: [3, 5],
    },
    {
      q: 'Magnesium oxide is added to water with universal indicator. Which colour would you expect?',
      a: 'Blue or purple (alkaline)',
      wrong: [{ label: 'Red (acidic)', misconception: 'metal-oxide-acidic', feedback: 'Metal oxides are bases; the ones that dissolve in water make alkaline solutions.' }, 'Green (neutral)', 'Colourless'],
      hint: 'Magnesium is a metal.',
      why: 'Metal oxides are bases. Those that dissolve in water, like magnesium oxide (slightly), form alkaline solutions.',
      lv: [4, 5],
    },
  ],
  written: [
    {
      prompt: 'Explain why a fire blanket can put out a small fire in a frying pan.',
      model:
        'A fire needs fuel, heat and oxygen (the fire triangle). The fire blanket covers the pan and stops oxygen from the air reaching the burning oil. Without oxygen the combustion reaction cannot continue, so the fire goes out.',
      checklist: ['Names the three things a fire needs (fuel, heat, oxygen)', 'Says the blanket stops oxygen / air reaching the fire', 'Says that without oxygen the burning cannot continue'],
      hint: 'Use the fire triangle.',
    },
  ],
}

const oxideClassify = classifyGenerators('chem.reactions.combustion', {
  id: 'oxide-type',
  categories: ['Acidic oxide', 'Basic oxide'],
  items: [
    ['carbon dioxide', 'Acidic oxide'],
    ['sulfur dioxide', 'Acidic oxide'],
    ['nitrogen dioxide', 'Acidic oxide'],
    ['magnesium oxide', 'Basic oxide'],
    ['calcium oxide', 'Basic oxide'],
    ['sodium oxide', 'Basic oxide'],
    ['copper oxide', 'Basic oxide'],
  ],
  ask: (x) => `Is ${x} an acidic oxide or a basic oxide?`,
  hint: 'Is the element joined to oxygen a metal or a non-metal?',
  means: { 'Acidic oxide': 'Oxides of non-metals; those that dissolve in water make acids.', 'Basic oxide': 'Oxides of metals; they neutralise acids, and those that dissolve make alkalis.' },
  lv: [3, 5],
})

// =====================================================================================================================
// Testing for gases
// =====================================================================================================================

const GAS_TESTS: [string, string, string][] = [
  ['Oxygen', 'A glowing splint relights', 'oxygen'],
  ['Hydrogen', 'A lit splint gives a squeaky pop', 'hydrogen'],
  ['Carbon dioxide', 'Limewater turns milky (cloudy)', 'carbon dioxide'],
  ['Chlorine', 'Damp litmus paper is bleached white', 'chlorine'],
]

const gasTests: Bank = {
  skill: 'chem.reactions.gas-tests',
  links: [
    {
      prompt: 'Match each gas to its test result.',
      pairs: GAS_TESTS.map(([g, t]) => [g, t] as [string, string]),
      hint: 'One gas helps things burn, one burns with a pop, one reacts with limewater, and one is a bleach.',
      ask: (l) => `What is the positive test result for ${l.toLowerCase()}?`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'A metal is added to dilute acid and it fizzes. The gas gives a squeaky pop with a lit splint. Which gas is it?',
      a: 'Hydrogen',
      wrong: [{ label: 'Oxygen', misconception: 'pop-oxygen', feedback: 'Oxygen relights a GLOWING splint; it does not pop.' }, 'Carbon dioxide', 'Chlorine'],
      hint: 'Which gas burns rapidly with a pop?',
      why: 'Hydrogen burns with a squeaky pop. Metals react with acids to make a salt and hydrogen.',
      lv: [1, 3],
    },
    {
      q: 'Green copper carbonate is heated and the gas given off is bubbled through limewater, which turns milky. Which gas is it?',
      a: 'Carbon dioxide',
      wrong: [{ label: 'Oxygen', misconception: 'limewater-oxygen', feedback: 'Limewater turning milky is the test for carbon dioxide only.' }, 'Hydrogen', 'Water vapour'],
      hint: 'Limewater is a solution of calcium hydroxide. It reacts with one particular gas.',
      why: 'Carbon dioxide turns limewater milky (cloudy). Heating a metal carbonate gives a metal oxide and carbon dioxide.',
      lv: [1, 3],
    },
    {
      q: 'Why does a glowing splint relight in oxygen?',
      a: 'Oxygen is needed for burning, and pure oxygen makes the splint burn much more fiercely',
      wrong: [
        { label: 'Oxygen is a fuel that catches fire', misconception: 'oxygen-fuel', feedback: 'Oxygen does not burn itself; it helps the splint (the fuel) burn.' },
        'Oxygen is hot',
        'Oxygen reacts with the splint to make hydrogen',
      ],
      hint: 'What does burning need?',
      why: 'Air is only about 21% oxygen. In pure oxygen the glowing wood burns much faster, so it bursts back into flame.',
      lv: [3, 5],
    },
    {
      q: 'Which test shows that a liquid contains water?',
      a: 'It turns white anhydrous copper sulfate blue',
      wrong: [{ label: 'It turns limewater milky', misconception: 'limewater-water', feedback: 'That is the test for carbon dioxide.' }, 'It relights a glowing splint', 'It turns universal indicator green'],
      hint: 'There is a white powder that changes colour when water is added.',
      why: 'Anhydrous ("without water") copper sulfate is white and turns blue when water is added. (This shows water is present, not that it is pure.)',
      lv: [3, 5],
    },
    {
      q: 'Hydrogen peroxide breaks down when a catalyst is added and gives off a gas that relights a glowing splint. Which gas is it?',
      a: 'Oxygen',
      wrong: [{ label: 'Hydrogen', misconception: 'peroxide-hydrogen', feedback: 'Hydrogen gives a squeaky pop with a LIT splint.' }, 'Carbon dioxide', 'Chlorine'],
      hint: 'Which gas relights a glowing splint?',
      why: 'Oxygen relights a glowing splint. Hydrogen peroxide → water + oxygen.',
      lv: [2, 4],
    },
  ],
}

// =====================================================================================================================
// Thermal decomposition
// =====================================================================================================================

const decomposition: Bank = {
  skill: 'chem.reactions.decomposition',
  mcqs: [
    {
      q: 'What is thermal decomposition?',
      a: 'Using heat to break a compound down into simpler substances',
      wrong: [
        { label: 'Burning a substance in oxygen', misconception: 'decomp-combustion', feedback: 'Combustion needs oxygen. Thermal decomposition breaks one compound into others using heat alone.' },
        'Melting a solid',
        'Dissolving a substance in hot water',
      ],
      hint: '"Thermal" means heat; "decompose" means break down.',
      why: 'In thermal decomposition, heating breaks one compound down into two or more simpler substances. No oxygen is needed.',
      lv: [1, 3],
    },
    {
      q: 'What are the products when a metal carbonate is heated and decomposes?',
      a: 'A metal oxide and carbon dioxide',
      wrong: [
        { label: 'The metal and carbon dioxide', misconception: 'carbonate-to-metal', feedback: 'The oxygen does not all leave; a metal OXIDE is left behind.' },
        'A metal oxide and oxygen',
        'A metal and water',
      ],
      hint: 'A carbonate contains a metal, carbon and oxygen. Which gas can form and escape?',
      why: 'Metal carbonate → metal oxide + carbon dioxide, for example calcium carbonate → calcium oxide + carbon dioxide.',
      lv: [2, 4],
    },
    {
      q: 'Green copper carbonate is heated strongly. What colour is the solid left at the end?',
      a: 'Black',
      wrong: [{ label: 'Green', misconception: 'no-change', feedback: 'A new substance (copper oxide) forms, so the colour changes.' }, 'Blue', 'Pink-brown'],
      hint: 'The solid left is copper oxide.',
      why: 'Copper carbonate (green) → copper oxide (black) + carbon dioxide. The colour change shows a new substance has formed.',
      lv: [3, 5],
    },
    {
      q: 'Why is thermal decomposition an endothermic reaction?',
      a: 'It only keeps going while energy is supplied by heating',
      wrong: [
        { label: 'Because it gives out heat', misconception: 'endo-exo-swap', feedback: 'Giving out heat would be exothermic.' },
        'Because a gas is made',
        'Because the products are cold',
      ],
      hint: 'What happens if you stop heating?',
      why: 'Thermal decomposition takes in energy from the surroundings: it stops as soon as the heating stops.',
      lv: [4, 5],
    },
  ],
}

const CARBONATES: [string, string, number, number][] = [
  // name, metal oxide, M_r of carbonate, M_r of oxide (rounded A_r values)
  ['calcium carbonate', 'calcium oxide', 100, 56],
  ['magnesium carbonate', 'magnesium oxide', 84, 40],
  ['zinc carbonate', 'zinc oxide', 125, 81],
]

const decompositionGenerators: ItemGenerator[] = [
  G('chem.reactions.decomposition.products', 'chem.reactions.decomposition', [2, 4], (rng, d) => {
    const metals = ['calcium', 'magnesium', 'zinc', 'copper', 'iron', 'lead']
    const m = rng.pick(metals)
    const correct = `${m} oxide + carbon dioxide`
    if (d >= 4) {
      return textItem({
        prompt: `Complete the word equation for heating ${m} carbonate:\n${m} carbonate → ${m} oxide + ______`,
        accept: ['carbon dioxide', 'CO2'],
        placeholder: 'Name of gas',
        hint: 'Which gas turns limewater milky?',
        explanation: `${m} carbonate → ${correct}. All metal carbonates that decompose give the metal oxide and carbon dioxide.`,
      })
    }
    return choice({
      rng,
      prompt: `Which word equation shows the thermal decomposition of ${m} carbonate?`,
      correct: `${m} carbonate → ${correct}`,
      wrong: [
        { label: `${m} carbonate → ${m} + carbon dioxide`, misconception: 'carbonate-to-metal', feedback: 'A metal oxide is left, not the metal.' },
        { label: `${m} carbonate → ${m} oxide + oxygen`, misconception: 'carbonate-oxygen', feedback: 'The gas given off is carbon dioxide.' },
        { label: `${m} carbonate + oxygen → ${correct}`, misconception: 'decomp-needs-oxygen', feedback: 'Thermal decomposition needs only heat: there is only one reactant.' },
      ],
      hint: 'One reactant; two products, one of which is a gas.',
      explanation: `${m} carbonate → ${correct}.`,
    })
  }),
  G('chem.reactions.decomposition.mass-loss', 'chem.reactions.decomposition', [3, 5], (rng, d) => {
    const [name, oxide, mc, mo] = rng.pick(CARBONATES)
    const k = rng.pick([0.05, 0.1, 0.2, 0.5])
    const start = round(mc * k, 2)
    const end = round(mo * k, 2)
    const lost = round(start - end, 2)
    const fig = table(['', 'Mass (g)'], [[`Mass of ${name} at the start`, fix(start, 2)], [`Mass of ${oxide} left at the end`, fix(end, 2)]])
    if (d <= 4) {
      return num({
        prompt: `${cap(name)} is heated until it has completely decomposed. Use the results to work out the mass of carbon dioxide given off. Give your answer in g.`,
        answer: lost,
        suffix: 'g',
        tolerance: 0.005,
        figure: fig,
        hint: 'The missing mass has escaped as a gas.',
        explanation: `Mass of carbon dioxide = ${fix(start, 2)} − ${fix(end, 2)} = ${fix(lost, 2)} g. Mass is conserved; it seems to go down only because the gas escapes.`,
      })
    }
    const pct = round((lost / start) * 100, 0)
    return num({
      prompt: `${cap(name)} is heated until it has completely decomposed. What percentage of the starting mass is lost? Give your answer to the nearest whole number.`,
      answer: pct,
      suffix: '%',
      tolerance: 0.5,
      figure: fig,
      hint: 'Find the mass lost, divide by the starting mass, then multiply by 100.',
      explanation: `Mass lost = ${fix(start, 2)} − ${fix(end, 2)} = ${fix(lost, 2)} g. Percentage = ${fix(lost, 2)} ÷ ${fix(start, 2)} × 100 = ${pct}%.`,
    })
  }),
]

// =====================================================================================================================
// Exothermic and endothermic
// =====================================================================================================================

const energyClassify = classifyGenerators('chem.reactions.energy', {
  id: 'classify',
  categories: ['Exothermic', 'Endothermic'],
  items: [
    ['burning a fuel', 'Exothermic'],
    ['neutralising an acid with an alkali', 'Exothermic'],
    ['respiration in your cells', 'Exothermic'],
    ['a hand warmer heating up as iron powder reacts with oxygen', 'Exothermic'],
    ['magnesium reacting with hydrochloric acid', 'Exothermic'],
    ['thermal decomposition of calcium carbonate', 'Endothermic'],
    ['photosynthesis', 'Endothermic'],
    ['citric acid reacting with sodium hydrogencarbonate solution', 'Endothermic'],
    ['an instant cold pack for sports injuries', 'Endothermic'],
  ],
  ask: (x) => `Is ${x} exothermic or endothermic?`,
  hint: 'Exothermic gives energy OUT to the surroundings (they warm up). Endothermic takes energy IN (they cool down, or it needs heating).',
  means: {
    Exothermic: 'Transfers energy to the surroundings, so the temperature of the surroundings goes up.',
    Endothermic: 'Takes in energy from the surroundings, so the temperature goes down (or it needs continuous heating).',
  },
})

const energy: Bank = {
  skill: 'chem.reactions.energy',
  terms: [
    { term: 'Exothermic', def: 'A reaction that transfers energy to the surroundings, so the temperature rises' },
    { term: 'Endothermic', def: 'A reaction that takes in energy from the surroundings, so the temperature falls' },
    { term: 'Surroundings', def: 'Everything around the reacting chemicals, such as the solvent, the container and the air' },
    { term: 'Energy transfer', def: 'Energy moving from one store to another, such as from a chemical store to a thermal store' },
  ],
  mcqs: [
    {
      q: 'In an exothermic reaction the thermometer reading goes up. Where is the energy going?',
      a: 'From the chemicals to the surroundings',
      wrong: [{ label: 'From the surroundings into the chemicals', misconception: 'endo-exo-swap', feedback: 'That is endothermic, and the temperature would fall.' }, 'Nowhere: it is being destroyed', 'Into the thermometer only'],
      hint: '"Exo" means out.',
      why: 'Exothermic reactions transfer energy from the chemicals to the surroundings, which is why the surroundings (and thermometer) warm up.',
      lv: [2, 4],
    },
    {
      q: 'Reactions break bonds in the reactants and make new bonds in the products. Why are some reactions exothermic overall?',
      a: 'More energy is released making new bonds than is needed to break the old bonds',
      wrong: [
        { label: 'Breaking bonds releases energy', misconception: 'breaking-releases', feedback: 'Breaking bonds always NEEDS energy. Making bonds releases it.' },
        'The reactants are hot to start with',
        'Exothermic reactions do not break any bonds',
      ],
      hint: 'Breaking bonds takes energy in; making bonds gives energy out.',
      why: 'Breaking bonds takes in energy and making bonds gives out energy. If more is given out making the products\' bonds than was taken in, the reaction is exothermic overall.',
      lv: [5, 5],
    },
  ],
}

const energyGenerators: ItemGenerator[] = [
  G('chem.reactions.energy.temp-change', 'chem.reactions.energy', [2, 5], (rng, d) => {
    const reactions = ['Reaction A', 'Reaction B', 'Reaction C', 'Reaction D']
    // Two rises and two falls, all different sizes, in a random order.
    const changes = rng.shuffle([...rng.shuffle([-12, -9, -6, -4]).slice(0, 2), ...rng.shuffle([3, 5, 8, 11, 15, 24]).slice(0, 2)])
    const rows = reactions.map((r, i) => {
      const start = rng.pick([18, 19, 20, 21, 22])
      const change = changes[i] ?? 5
      return { r, start, end: start + change, change }
    })
    const fig = table(['Reaction', 'Start temperature (°C)', 'End temperature (°C)'], rows.map((x) => [x.r, x.start, x.end]))
    const pick = rng.pick(rows)
    if (d <= 3) {
      return num({
        prompt: `Use the table. What is the temperature change for ${pick.r}? Give a negative number for a fall. Answer in °C.`,
        answer: pick.change,
        suffix: '°C',
        figure: fig,
        hint: 'Temperature change = end temperature − start temperature.',
        explanation: `${pick.end} − ${pick.start} = ${pick.change > 0 ? '+' : ''}${pick.change} °C, so it is ${pick.change > 0 ? 'exothermic (the temperature rose)' : 'endothermic (the temperature fell)'}.`,
        errors: [{ values: [-pick.change], tag: 'start-minus-end', message: 'Do end − start, so a fall gives a negative number.' }],
      })
    }
    const endo = rows.filter((x) => x.change < 0)
    const target = d >= 5 ? rows.reduce((a, b) => (b.change > a.change ? b : a)) : rng.pick(endo)
    return choice({
      rng,
      prompt: d >= 5 ? 'Use the table. Which reaction is the most exothermic?' : 'Use the table. Which of these reactions is endothermic?',
      correct: target.r,
      wrong: rows
        .filter((x) => x !== target && (d >= 5 ? true : x.change > 0))
        .map((x) => ({ label: x.r, misconception: 'endo-exo-swap', feedback: `${x.r} changes by ${x.change > 0 ? '+' : ''}${x.change} °C.` })),
      keepOrder: true,
      figure: fig,
      hint: d >= 5 ? 'Find the biggest rise in temperature.' : 'In an endothermic reaction the temperature goes down.',
      explanation:
        d >= 5
          ? `${target.r} has the biggest temperature rise (+${target.change} °C), so it transfers the most energy to the surroundings.`
          : `${target.r}: the temperature falls by ${-target.change} °C, so it takes in energy from the surroundings: endothermic.`,
    })
  }),
]

// =====================================================================================================================
// Balanced symbol equations
// =====================================================================================================================

/** Equations with at least one coefficient bigger than 1 (so a "missing number" question is worth asking). */
const WITH_COEF = EQUATIONS.filter((e) => [...e.lhs, ...e.rhs].some(([k]) => k > 1))
const SIMPLE_EQ = EQUATIONS.filter((e) => [...e.lhs, ...e.rhs].length <= 3)

function unbalance(rng: Rng, e: Equation): Equation {
  // Drop the coefficient of one term with k > 1 (or add a 2 if none), which always unbalances it.
  const terms = [...e.lhs.map((t, i) => ['l', i, t] as const), ...e.rhs.map((t, i) => ['r', i, t] as const)]
  const big = terms.filter(([, , t]) => t[0] > 1)
  const [s, i] = big.length ? rng.pick(big) : rng.pick(terms)
  const change = (side: Equation['lhs'], idx: number) => side.map((t, j) => (j === idx ? ([t[0] > 1 ? 1 : 2, t[1]] as [number, string]) : t))
  return s === 'l' ? { ...e, lhs: change(e.lhs, i) } : { ...e, rhs: change(e.rhs, i) }
}

const symbolEquationGenerators: ItemGenerator[] = [
  G('chem.reactions.symbol-equations.is-balanced', 'chem.reactions.symbol-equations', [2, 4], (rng, d) => {
    const e = rng.pick(d <= 2 ? SIMPLE_EQ : EQUATIONS)
    const show = rng.chance(0.5) ? e : unbalance(rng, e)
    const bal = isBalanced(show)
    const l = sideAtoms(show.lhs)
    const r = sideAtoms(show.rhs)
    const off = Object.keys({ ...l, ...r }).filter((k) => (l[k] ?? 0) !== (r[k] ?? 0))
    return choice({
      rng,
      prompt: `Is this symbol equation balanced?\n${showEq(show)}`,
      correct: bal ? 'Yes, it is balanced' : 'No, it is not balanced',
      wrong: [bal ? { label: 'No, it is not balanced', misconception: 'balance-count', feedback: 'Count each type of atom on both sides: they match.' } : { label: 'Yes, it is balanced', misconception: 'balance-count', feedback: `Count each type of atom on both sides: ${off.map((k) => `${k} is ${l[k] ?? 0} on the left but ${r[k] ?? 0} on the right`).join('; ')}.` }],
      keepOrder: true,
      hint: 'Count the atoms of each element on the left, then on the right. A big number in front multiplies the whole formula.',
      explanation: bal
        ? `Balanced: ${Object.keys(l).map((k) => `${k} ${l[k]} = ${r[k] ?? 0}`).join(', ')}. The balanced equation is ${showEq(e)}.`
        : `Not balanced: ${off.map((k) => `${k} is ${l[k] ?? 0} on the left but ${r[k] ?? 0} on the right`).join('; ')}. The balanced equation is ${showEq(e)}.`,
    })
  }),

  G('chem.reactions.symbol-equations.count', 'chem.reactions.symbol-equations', [2, 4], (rng, d) => {
    const e = rng.pick(EQUATIONS.filter((x) => (d <= 2 ? x.lhs.length + x.rhs.length <= 3 : true)))
    const useLeft = rng.chance(0.5)
    const s = useLeft ? e.lhs : e.rhs
    const atoms = sideAtoms(s)
    const el = rng.pick(Object.keys(atoms))
    const n = atoms[el] ?? 0
    const naive = s.reduce((acc, [, f]) => acc + (parseFormula(f)[el] ?? 0), 0)
    return num({
      prompt: `${showEq(e)}\nHow many ${el} atoms are there on the ${useLeft ? 'left-hand (reactant)' : 'right-hand (product)'} side?`,
      answer: n,
      suffix: 'atoms',
      hint: 'Multiply the small number after the symbol by the big number in front of the formula, then add up every formula on that side.',
      explanation: `On the ${useLeft ? 'left' : 'right'}: ${s
        .filter(([, f]) => parseFormula(f)[el])
        .map(([k, f]) => `${k > 1 ? `${k}${f}` : f} has ${k > 1 ? `${k} × ${parseFormula(f)[el]} = ` : ''}${k * (parseFormula(f)[el] ?? 0)}`)
        .join('; ')}. Total = ${n} ${el} atoms.`,
      errors: [{ values: [naive], tag: 'ignored-coefficient', message: 'Remember to multiply by the big number in front of each formula.' }],
    })
  }),

  G('chem.reactions.symbol-equations.missing-number', 'chem.reactions.symbol-equations', [3, 5], (rng, d) => {
    const pool = d <= 3 ? WITH_COEF.filter((e) => e.lhs.length + e.rhs.length <= 3) : d === 4 ? WITH_COEF.filter((e) => e.lhs.length + e.rhs.length <= 4) : WITH_COEF
    const e = rng.pick(pool.length ? pool : WITH_COEF)
    const terms = [...e.lhs.map((t, i) => ['l', i, t] as const), ...e.rhs.map((t, i) => ['r', i, t] as const)].filter(([, , t]) => t[0] > 1)
    const [s, i, t] = rng.pick(terms)
    const shown = `${s === 'l' ? showSide(e.lhs, i) : showSide(e.lhs)} → ${s === 'r' ? showSide(e.rhs, i) : showSide(e.rhs)}`
    return num({
      prompt: `What number goes in the gap to balance this equation?\n${shown}`,
      answer: t[0],
      hint: 'Count the atoms of each element on both sides. Which number makes them equal?',
      explanation: `${showEq(e)}. With ${t[0]} in front of ${t[1]}, every element has the same number of atoms on both sides.`,
      errors: [{ values: [1], tag: 'coef-one', message: 'With 1 (no number) the atoms do not balance. Count them again.' }],
    })
  }),

  G('chem.reactions.symbol-equations.word', 'chem.reactions.symbol-equations', [2, 4], (rng) => {
    const e = rng.pick(EQUATIONS)
    const others = rng.shuffle(EQUATIONS.filter((x) => x !== e && x.word !== e.word)).slice(0, 3)
    return choice({
      rng,
      prompt: `Which word equation matches this symbol equation?\n${showEq(e)}`,
      correct: e.word,
      wrong: others.map((o) => ({ label: o.word, misconception: 'symbol-word', feedback: `That goes with ${showEq(o)}.` })),
      hint: 'Work out what each formula is called. Start with the products.',
      explanation: `${showEq(e)} is ${e.word}.`,
    })
  }),
]

const symbolEquations: Bank = {
  skill: 'chem.reactions.symbol-equations',
  mcqs: [
    {
      q: 'To balance an equation, which numbers are you allowed to change?',
      a: 'Only the big numbers in front of the formulae',
      wrong: [
        { label: 'The small numbers in the formulae', misconception: 'change-subscripts', feedback: 'Changing a small number changes the substance (H_{2}O to H_{2}O_{2} turns water into hydrogen peroxide).' },
        'Any of the numbers',
        'None: equations are always balanced already',
      ],
      hint: 'If you changed H_{2}O to H_{2}O_{2}, would it still be water?',
      why: 'The small numbers are part of each substance\'s formula. You balance by changing how many of each particle there are: the big numbers in front.',
      lv: [3, 5],
    },
    {
      q: 'Why must a symbol equation be balanced?',
      a: 'Atoms are not created or destroyed in a reaction, so each type of atom must appear in the same number on both sides',
      wrong: [{ label: 'To make the equation look tidy', misconception: 'balance-cosmetic', feedback: 'Balancing is not cosmetic: it shows conservation of mass.' }, 'So there are the same number of molecules on each side', 'So the reactants and products have the same names'],
      hint: 'Think about conservation of mass.',
      why: 'Mass is conserved because atoms are only rearranged. A balanced equation has the same number of each type of atom on both sides (the number of molecules can change).',
      lv: [2, 4],
    },
  ],
}

// =====================================================================================================================
// Catalysts and rates
// =====================================================================================================================

const catalysts: Bank = {
  skill: 'chem.reactions.catalysts',
  terms: [
    { term: 'Catalyst', def: 'A substance that speeds up a reaction without being used up itself' },
    { term: 'Enzyme', def: 'A biological catalyst, found in living things' },
    { term: 'Rate of reaction', def: 'How quickly reactants are used up or products are made' },
    { term: 'Surface area', def: 'The total area of the outside of a solid that can come into contact with other reactants' },
  ],
  links: [
    {
      prompt: 'Match each change to why it speeds up the reaction.',
      pairs: [
        ['Raising the temperature', 'Particles move faster, so they collide more often and with more energy'],
        ['Using a more concentrated acid', 'There are more acid particles in the same volume, so collisions happen more often'],
        ['Using powder instead of lumps', 'More surface is exposed, so more particles can collide at once'],
        ['Adding a catalyst', 'It provides another route for the reaction that needs less energy'],
      ],
      hint: 'Reactions happen when particles collide with enough energy.',
      ask: (l) => `${l} speeds up a reaction. Why?`,
      lv: [3, 5],
    },
  ],
  mcqs: [
    {
      q: 'Manganese(IV) oxide is added to hydrogen peroxide as a catalyst. At the end, how much manganese(IV) oxide is left?',
      a: 'The same mass as at the start',
      wrong: [{ label: 'None: it has been used up', misconception: 'catalyst-used-up', feedback: 'Catalysts are not used up. They can be filtered out and used again.' }, 'More than at the start', 'Half of it'],
      hint: 'What is special about a catalyst?',
      why: 'A catalyst speeds up the reaction but is not used up, so the same mass is left at the end and it can be used again.',
      lv: [2, 4],
    },
    {
      q: 'Why are catalysts useful in industry?',
      a: 'Reactions happen faster or at lower temperatures, which saves energy and money',
      wrong: [{ label: 'They increase the mass of product made from the same reactants', misconception: 'catalyst-more-product', feedback: 'A catalyst makes the same product faster; it cannot make more product than the reactants allow.' }, 'They are used up, so they are cheap', 'They make reactions endothermic'],
      hint: 'A catalyst changes the speed of a reaction, not how much product the reactants can make.',
      why: 'Catalysts let reactions run faster or at lower temperatures, so less energy (and fuel) is needed. They are not used up, so a small amount can be reused many times.',
      lv: [3, 5],
    },
    {
      q: 'A car\'s catalytic converter contains metals such as platinum. What does it do?',
      a: 'Speeds up reactions that turn harmful exhaust gases into less harmful ones',
      wrong: ['Makes the engine more powerful', { label: 'Absorbs the exhaust gases so nothing comes out', misconception: 'converter-absorbs', feedback: 'Gases still come out; they have been changed into less harmful ones.' }, 'Adds fuel to the engine'],
      hint: 'The metals are catalysts.',
      why: 'The catalyst speeds up reactions that turn carbon monoxide and other harmful gases into less harmful ones such as carbon dioxide.',
      lv: [3, 5],
    },
  ],
}

const catalystGenerators: ItemGenerator[] = [
  G('chem.reactions.catalysts.data', 'chem.reactions.catalysts', [2, 4], (rng, d) => {
    // Time to collect 50 cm^{3} of oxygen from hydrogen peroxide with different powders.
    const powders = rng.shuffle(['Powder A', 'Powder B', 'Powder C', 'No powder'])
    const times = new Map<string, number>()
    times.set('No powder', rng.pick([300, 360, 420]))
    const cat = rng.shuffle(['Powder A', 'Powder B', 'Powder C'])
    times.set(cat[0] ?? 'Powder A', rng.pick([20, 25, 30]))
    times.set(cat[1] ?? 'Powder B', rng.pick([60, 75, 90]))
    times.set(cat[2] ?? 'Powder C', times.get('No powder') ?? 300)
    const fig = table(['Powder added', 'Time to collect 50 cm^{3} of oxygen (s)'], powders.map((p) => [p, times.get(p) ?? 0]))
    if (d <= 3) {
      return choice({
        rng,
        prompt: 'Different powders were added to hydrogen peroxide solution. Which powder is the best catalyst for this reaction?',
        correct: cat[0] ?? 'Powder A',
        wrong: [cat[1] ?? '', { label: cat[2] ?? '', misconception: 'catalyst-slowest', feedback: 'This took the same time as with no powder at all, so it is not a catalyst here.' }, { label: 'No powder', misconception: 'control-as-catalyst', feedback: 'That is the control: the reaction with no catalyst.' }],
        keepOrder: true,
        figure: fig,
        hint: 'The best catalyst makes the gas fastest: the shortest time.',
        explanation: `${cat[0]} gave 50 cm^{3} of oxygen in the shortest time (${times.get(cat[0] ?? '')} s), so it speeds up the reaction the most.`,
      })
    }
    return choice({
      rng,
      prompt: 'Different powders were added to hydrogen peroxide solution. Which powder does NOT act as a catalyst for this reaction?',
      correct: cat[2] ?? 'Powder C',
      wrong: [cat[0] ?? '', cat[1] ?? ''].map((x) => ({ label: x, misconception: 'catalyst-reading', feedback: `${x} made the gas faster than with no powder, so it is a catalyst.` })),
      keepOrder: true,
      figure: fig,
      hint: 'Compare each powder with the reaction with no powder.',
      explanation: `${cat[2]} took the same time as with no powder (${times.get('No powder')} s), so it does not speed up the reaction.`,
    })
  }),
]

export const reactionsGenerators: ItemGenerator[] = [
  ...changeClassify,
  ...bankGenerators(changes),
  ...wordEquationGenerators,
  ...conservationGenerators,
  ...bankGenerators(conservation),
  ...bankGenerators(combustion),
  ...oxideClassify,
  ...bankGenerators(gasTests),
  ...bankGenerators(decomposition),
  ...decompositionGenerators,
  ...energyClassify,
  ...bankGenerators(energy),
  ...energyGenerators,
  ...symbolEquationGenerators,
  ...bankGenerators(symbolEquations),
  ...bankGenerators(catalysts),
  ...catalystGenerators,
]
