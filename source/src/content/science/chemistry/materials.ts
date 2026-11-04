import type { ItemGenerator } from '@/engine/registry'
import { choice, orderItem } from '../../kit'
import { bankGenerators, cap, classifyGenerators, G, table, type Bank } from './factory'

// =====================================================================================================================
// The reactivity series
// =====================================================================================================================

/** The KS3 reactivity series of metals, most reactive first (carbon fits between aluminium and zinc, hydrogen between
 * lead and copper). */
export const SERIES = ['potassium', 'sodium', 'calcium', 'magnesium', 'aluminium', 'zinc', 'iron', 'lead', 'copper', 'silver', 'gold']
const rank = (m: string) => SERIES.indexOf(m)

const reactivity: Bank = {
  skill: 'chem.metals.reactivity',
  mcqs: [
    {
      q: 'Which metal does NOT react with dilute hydrochloric acid?',
      a: 'Copper',
      wrong: [
        { label: 'Magnesium', misconception: 'mg-unreactive', feedback: 'Magnesium fizzes quickly in acid, giving off hydrogen.' },
        { label: 'Zinc', misconception: 'zn-unreactive', feedback: 'Zinc reacts steadily with acid, giving off hydrogen.' },
        { label: 'Iron', misconception: 'fe-unreactive', feedback: 'Iron reacts slowly with acid, giving off hydrogen.' },
      ],
      hint: 'Metals below hydrogen in the reactivity series do not react with dilute acids.',
      why: 'Copper is below hydrogen in the reactivity series, so it does not react with dilute acids. Magnesium, zinc and iron all do.',
      lv: [2, 4],
    },
    {
      q: 'Why is gold found in the ground as the pure metal, while most metals are found as compounds?',
      a: 'Gold is very unreactive, so it does not combine with other elements',
      wrong: [{ label: 'Gold is very reactive', misconception: 'gold-reactive', feedback: 'A reactive metal would have combined with oxygen or other elements long ago.' }, 'Gold is very heavy', 'Gold is magnetic'],
      hint: 'Where is gold in the reactivity series?',
      why: 'Gold is at the bottom of the reactivity series. It hardly reacts at all, so it stays as the element and does not tarnish.',
      lv: [2, 4],
    },
    {
      q: 'Which metal reacts with cold water so vigorously that the hydrogen catches fire?',
      a: 'Potassium',
      wrong: [{ label: 'Iron', misconception: 'iron-water', feedback: 'Iron only rusts slowly with water and air.' }, 'Copper', 'Magnesium'],
      hint: 'It is at the very top of the reactivity series.',
      why: 'Potassium is the most reactive common metal. It reacts violently with cold water and the hydrogen given off ignites with a lilac flame.',
      lv: [1, 3],
    },
    {
      q: 'Magnesium reacts only very slowly with cold water. How can you make it react faster with water?',
      a: 'Heat it in steam',
      wrong: [{ label: 'Cool the water down', misconception: 'cool-faster', feedback: 'Lower temperatures make reactions slower.' }, 'Use a bigger lump', 'Add oil to the water'],
      hint: 'Higher temperature speeds up reactions.',
      why: 'Magnesium reacts vigorously with steam, making magnesium oxide and hydrogen.',
      lv: [4, 5],
    },
    {
      q: 'Why are some metals more reactive than others? (At Year 9 level.)',
      a: 'More reactive metals lose their outer electrons more easily when they react',
      wrong: [{ label: 'More reactive metals are heavier', misconception: 'heavy-reactive', feedback: 'Gold is very dense but very unreactive. Reactivity is about electrons.' }, 'More reactive metals are shinier', 'More reactive metals have more protons'],
      hint: 'Metals form positive ions when they react.',
      why: 'When metals react they lose outer electrons. The more easily a metal loses them, the more reactive it is.',
      lv: [5, 5],
    },
  ],
  written: [
    {
      prompt: 'A student adds pieces of magnesium, zinc and copper of the same size to separate tubes of the same dilute acid. Describe what she would see and how it shows the order of reactivity.',
      model:
        'Magnesium would fizz quickly, giving off lots of hydrogen bubbles, and the tube would get warm. Zinc would fizz more slowly. Copper would not react at all, with no bubbles. The faster the bubbles, the more reactive the metal, so the order is magnesium, then zinc, then copper.',
      checklist: ['Says magnesium fizzes fastest', 'Says zinc fizzes more slowly', 'Says copper does not react', 'Links the rate of bubbling to reactivity / gives the order'],
      hint: 'The rate of fizzing tells you how reactive each metal is.',
    },
  ],
}

const reactivityGenerators: ItemGenerator[] = [
  G('chem.metals.reactivity.order', 'chem.metals.reactivity', [2, 5], (rng, d) => {
    const n = d <= 3 ? 4 : 5
    const pick = rng
      .shuffle(SERIES)
      .slice(0, n)
      .sort((a, b) => rank(a) - rank(b))
    return orderItem({
      rng,
      prompt: 'Put these metals in order of reactivity.',
      correct: pick.map(cap),
      direction: ['most reactive', 'least reactive'],
      hint: 'Potassium and sodium are near the top; copper, silver and gold are at the bottom.',
      explanation: `Reactivity series (most reactive first): ${SERIES.join(', ')}. So: ${pick.join(', ')}.`,
    })
  }),
  G('chem.metals.reactivity.more-reactive', 'chem.metals.reactivity', [1, 3], (rng, d) => {
    const four = rng.shuffle(SERIES).slice(0, d <= 1 ? 3 : 4)
    const most = rng.chance(0.5)
    const target = four.reduce((a, b) => (most ? (rank(b) < rank(a) ? b : a) : rank(b) > rank(a) ? b : a))
    return choice({
      rng,
      prompt: `Which of these metals is the ${most ? 'most' : 'least'} reactive?`,
      correct: cap(target),
      wrong: four.filter((m) => m !== target).map((m) => ({ label: cap(m), misconception: 'reactivity-series', feedback: `${cap(m)} is ${rank(m) < rank(target) ? 'more' : 'less'} reactive than ${target}.` })),
      hint: 'Remember the reactivity series from potassium at the top to gold at the bottom.',
      explanation: `In the reactivity series (${SERIES.join(', ')}), ${target} is the ${most ? 'highest' : 'lowest'} of these.`,
    })
  }),
  G('chem.metals.reactivity.data', 'chem.metals.reactivity', [3, 5], (rng, d) => {
    const OBS = ['Lots of bubbles straight away; the tube gets hot', 'Steady bubbling', 'A few bubbles, slowly', 'No bubbles at all']
    const letters = rng.shuffle(['W', 'X', 'Y', 'Z'])
    // letters[i] gets observation i: letters[0] is the most reactive.
    const rows = rng.shuffle(letters.map((l, i) => [`Metal ${l}`, OBS[i] ?? '']))
    const fig = table(['Metal added to dilute acid', 'Observation'], rows)
    if (d <= 4) {
      const most = rng.chance(0.5)
      const target = most ? letters[0] : letters[3]
      return choice({
        rng,
        prompt: `Four metals were added to the same dilute acid. Which metal is the ${most ? 'most' : 'least'} reactive?`,
        correct: `Metal ${target}`,
        wrong: letters.filter((l) => l !== target).map((l) => `Metal ${l}`),
        keepOrder: false,
        figure: fig,
        hint: 'The faster a metal makes bubbles of hydrogen, the more reactive it is.',
        explanation: `Metal ${letters[0]} reacted fastest, so it is the most reactive; metal ${letters[3]} did not react, so it is the least reactive (it is below hydrogen in the series, like copper).`,
      })
    }
    return orderItem({
      rng,
      prompt: 'Four metals were added to the same dilute acid. Use the observations to put them in order of reactivity.',
      correct: letters.map((l) => `Metal ${l}`),
      direction: ['most reactive', 'least reactive'],
      figure: fig,
      hint: 'More bubbles, more quickly, means more reactive.',
      explanation: `From fastest reaction to no reaction: ${letters.map((l) => `metal ${l}`).join(', ')}.`,
    })
  }),
]

// =====================================================================================================================
// Displacement
// =====================================================================================================================

/** Metals and a soluble salt of each, as used in school displacement experiments. */
const SALTS: Record<string, string> = {
  magnesium: 'magnesium sulfate',
  zinc: 'zinc sulfate',
  iron: 'iron sulfate',
  copper: 'copper sulfate',
  lead: 'lead nitrate',
  silver: 'silver nitrate',
}
const DISP = Object.keys(SALTS)
const anion = (salt: string) => salt.split(' ')[1] ?? ''

const displacementGenerators: ItemGenerator[] = [
  G('chem.metals.displacement.predict', 'chem.metals.displacement', [2, 4], (rng) => {
    const m = rng.pick(DISP)
    const n = rng.pick(DISP.filter((x) => x !== m))
    const salt = SALTS[n] ?? ''
    const reacts = rank(m) < rank(n)
    const yes = `Yes: ${m} is more reactive than ${n}, so it displaces it`
    const no = `No: ${m} is less reactive than ${n}, so it cannot displace it`
    return choice({
      rng,
      prompt: `A piece of ${m} is put into ${salt} solution. Will a displacement reaction happen?`,
      correct: reacts ? yes : no,
      wrong: [
        reacts ? { label: no, misconception: 'reactivity-series', feedback: `${cap(m)} is above ${n} in the reactivity series.` } : { label: yes, misconception: 'reactivity-series', feedback: `${cap(m)} is below ${n} in the reactivity series.` },
        { label: 'No: metals never react with solutions of other metals\' compounds', misconception: 'no-displacement', feedback: 'They do, if the metal added is more reactive.' },
      ],
      keepOrder: true,
      hint: 'A more reactive metal can push a less reactive metal out of its compound.',
      explanation: reacts
        ? `${cap(m)} is more reactive than ${n}, so it displaces it: ${m} + ${salt} → ${m} ${anion(salt)} + ${n}.`
        : `${cap(m)} is less reactive than ${n}, so there is no reaction.`,
    })
  }),
  G('chem.metals.displacement.products', 'chem.metals.displacement', [3, 5], (rng) => {
    const pairs = DISP.flatMap((m) => DISP.filter((n) => rank(m) < rank(n)).map((n) => [m, n] as [string, string]))
    const [m, n] = rng.pick(pairs)
    const salt = SALTS[n] ?? ''
    const an = anion(salt)
    return choice({
      rng,
      prompt: `Complete the word equation:\n${m} + ${salt} → ?`,
      correct: `${m} ${an} + ${n}`,
      wrong: [
        { label: `${n} ${an} + ${m}`, misconception: 'displace-nothing', feedback: 'That is just the reactants again. The more reactive metal ends up in the compound.' },
        { label: `${m} oxide + ${n} ${an}`, misconception: 'displace-oxide', feedback: 'No oxygen is involved. The metals swap places.' },
        { label: 'No reaction', misconception: 'reactivity-series', feedback: `${cap(m)} is more reactive than ${n}, so it does react.` },
      ],
      hint: 'The more reactive metal takes the place of the less reactive one in the compound.',
      explanation: `${cap(m)} is more reactive than ${n}, so it displaces it: ${m} + ${salt} → ${m} ${an} + ${n}.`,
    })
  }),
  G('chem.metals.displacement.grid', 'chem.metals.displacement', [4, 5], (rng, d) => {
    const letters = rng.shuffle(['A', 'B', 'C', 'D'])
    // letters[0] is most reactive. A metal reacts with a salt solution of any metal below it.
    const order = ['A', 'B', 'C', 'D']
    const rows = order.map((x) => [
      `Metal ${x}`,
      ...order.map((y) => (x === y ? '—' : letters.indexOf(x) < letters.indexOf(y) ? '✓ reaction' : '✗ no reaction')),
    ])
    const fig = table(['', ...order.map((y) => `Solution of ${y} sulfate`)], rows)
    if (d <= 4) {
      return choice({
        rng,
        prompt: 'Four metals were each put into solutions of the others\' sulfates. Which metal is the most reactive?',
        correct: `Metal ${letters[0]}`,
        wrong: letters.slice(1).map((l) => `Metal ${l}`),
        keepOrder: false,
        figure: fig,
        hint: 'The most reactive metal displaces all the others, so it reacts in every solution.',
        explanation: `Metal ${letters[0]} reacted with all three other solutions, so it can displace all the other metals: it is the most reactive.`,
      })
    }
    return orderItem({
      rng,
      prompt: 'Four metals were each put into solutions of the others\' sulfates. Use the results to put the metals in order of reactivity.',
      correct: letters.map((l) => `Metal ${l}`),
      direction: ['most reactive', 'least reactive'],
      figure: fig,
      hint: 'Count how many reactions each metal had. More reactions means more reactive.',
      explanation: `Number of reactions: ${letters.map((l, i) => `${l} ${3 - i}`).join(', ')}. So the order is ${letters.join(', ')}.`,
    })
  }),
]

const displacement: Bank = {
  skill: 'chem.metals.displacement',
  mcqs: [
    {
      q: 'An iron nail is left in blue copper sulfate solution. What would you see?',
      a: 'A pink-brown coating of copper forms on the nail and the blue colour fades',
      wrong: [
        { label: 'Nothing happens', misconception: 'no-displacement', feedback: 'Iron is more reactive than copper, so it displaces it.' },
        { label: 'The nail turns blue', misconception: 'nail-blue', feedback: 'The copper sulfate gives the solution its blue colour. As copper is displaced, the blue fades.' },
        'The nail grows bigger and turns silver',
      ],
      hint: 'Iron is more reactive than copper.',
      why: 'Iron displaces copper: iron + copper sulfate → iron sulfate + copper. Copper metal coats the nail and the blue copper sulfate is used up, so the colour fades (iron sulfate solution is pale green).',
      lv: [2, 4],
    },
    {
      q: 'What is a displacement reaction?',
      a: 'A more reactive element takes the place of a less reactive element in a compound',
      wrong: [{ label: 'A less reactive metal pushes out a more reactive one', misconception: 'reverse-displacement', feedback: 'It is the other way round: only a MORE reactive element can displace a less reactive one.' }, 'Any reaction where a gas is made', 'Moving a solution from one beaker to another'],
      hint: 'Think of a stronger player taking another\'s place in a team.',
      why: 'In displacement, a more reactive element pushes a less reactive one out of its compound, e.g. zinc + copper sulfate → zinc sulfate + copper.',
      lv: [1, 3],
    },
    {
      q: 'In the thermite reaction, aluminium reacts with iron oxide. Why does this happen?',
      a: 'Aluminium is more reactive than iron, so it takes the oxygen from the iron oxide',
      wrong: [{ label: 'Iron is more reactive than aluminium', misconception: 'fe-above-al', feedback: 'Aluminium is above iron in the reactivity series.' }, 'Iron oxide is a fuel', 'The aluminium melts the iron oxide'],
      hint: 'Which metal is higher in the reactivity series?',
      why: 'aluminium + iron oxide → aluminium oxide + iron. The more reactive aluminium displaces iron. The reaction is so exothermic that the iron is made molten.',
      lv: [4, 5],
    },
  ],
}

// =====================================================================================================================
// Extracting metals
// =====================================================================================================================

const extractionClassify = classifyGenerators('chem.metals.extraction', {
  id: 'method',
  categories: ['Electrolysis', 'Heating with carbon', 'Found as the element'],
  items: [
    ['potassium', 'Electrolysis'],
    ['sodium', 'Electrolysis'],
    ['calcium', 'Electrolysis'],
    ['magnesium', 'Electrolysis'],
    ['aluminium', 'Electrolysis'],
    ['zinc', 'Heating with carbon'],
    ['iron', 'Heating with carbon'],
    ['lead', 'Heating with carbon'],
    ['copper', 'Heating with carbon'],
    ['gold', 'Found as the element'],
  ],
  ask: (x) => `How is ${x} usually obtained, according to the reactivity series?`,
  hint: 'Carbon sits between aluminium and zinc in the reactivity series.',
  means: {
    Electrolysis: 'For metals more reactive than carbon: carbon cannot take the oxygen away from them.',
    'Heating with carbon': 'For metals less reactive than carbon: carbon takes the oxygen from the metal oxide (reduction).',
    'Found as the element': 'Very unreactive metals are found uncombined in the ground.',
  },
  sortPrompt: 'Match each metal to how it is usually obtained.',
})

const extraction: Bank = {
  skill: 'chem.metals.extraction',
  terms: [
    { term: 'Ore', def: 'A rock that contains enough of a metal compound to make extracting the metal worthwhile' },
    { term: 'Reduction', def: 'A reaction in which a substance loses oxygen' },
    { term: 'Electrolysis', def: 'Using electricity to break down a molten or dissolved compound' },
    { term: 'Extraction', def: 'Getting a metal out of its ore' },
  ],
  mcqs: [
    {
      q: 'Why can iron be extracted by heating iron oxide with carbon, but aluminium cannot be extracted this way?',
      a: 'Carbon is more reactive than iron but less reactive than aluminium',
      wrong: [
        { label: 'Aluminium oxide does not contain oxygen', misconception: 'al-oxide', feedback: 'It does. The problem is that carbon is not reactive enough to take it away.' },
        'Iron is more reactive than aluminium',
        'Aluminium is too expensive to heat',
      ],
      hint: 'Where is carbon in the reactivity series?',
      why: 'Carbon can only take oxygen from metals below it in the reactivity series. Aluminium is above carbon, so it is extracted by electrolysis instead.',
      lv: [3, 5],
    },
    {
      q: 'copper oxide + carbon → copper + carbon dioxide. What has happened to the copper oxide?',
      a: 'It has been reduced: it has lost oxygen',
      wrong: [{ label: 'It has been oxidised: it has gained oxygen', misconception: 'redox-swap', feedback: 'The CARBON gains oxygen (oxidation). The copper oxide loses it.' }, 'It has been neutralised', 'It has decomposed on its own'],
      hint: 'Copper oxide becomes copper. Has it gained or lost oxygen?',
      why: 'Copper oxide loses its oxygen to the carbon, so it is reduced. The carbon gains oxygen, so it is oxidised.',
      lv: [3, 5],
    },
    {
      q: 'Why is aluminium more expensive to extract than iron?',
      a: 'Electrolysis uses a lot of electricity',
      wrong: [{ label: 'Aluminium is rarer than iron in the Earth\'s crust', misconception: 'al-rare', feedback: 'Aluminium is actually the most common metal in the crust. The cost comes from the electricity.' }, 'Aluminium has to be mined from the sea bed', 'Aluminium ore is radioactive'],
      hint: 'Think about the method used.',
      why: 'Aluminium is more reactive than carbon, so it is extracted by electrolysis, which needs huge amounts of electricity.',
      lv: [4, 5],
    },
    {
      q: 'In a blast furnace, what is iron oxide heated with to extract the iron?',
      a: 'Carbon (in the form of coke)',
      wrong: [{ label: 'Aluminium', misconception: 'thermite-industry', feedback: 'Aluminium could do it, but it is far more expensive than carbon.' }, 'Oxygen', 'Copper'],
      hint: 'It is cheap and more reactive than iron.',
      why: 'Carbon (coke) is cheap and more reactive than iron, so it removes the oxygen from iron oxide: iron oxide + carbon → iron + carbon dioxide.',
      lv: [2, 4],
    },
  ],
}

// =====================================================================================================================
// Ceramics, polymers and composites
// =====================================================================================================================

const materialClassify = classifyGenerators('chem.materials.types', {
  id: 'classify',
  categories: ['Ceramic', 'Polymer', 'Composite', 'Metal'],
  items: [
    ['a clay brick', 'Ceramic'],
    ['a china (porcelain) mug', 'Ceramic'],
    ['a glass window', 'Ceramic'],
    ['a pottery plant pot', 'Ceramic'],
    ['a poly(ethene) carrier bag', 'Polymer'],
    ['a PVC drainpipe', 'Polymer'],
    ['a nylon rope', 'Polymer'],
    ['a rubber band', 'Polymer'],
    ['reinforced concrete', 'Composite'],
    ['fibreglass (glass fibres set in plastic resin)', 'Composite'],
    ['a carbon-fibre bike frame', 'Composite'],
    ['a steel nail', 'Metal'],
    ['copper wire', 'Metal'],
    ['an aluminium can', 'Metal'],
  ],
  ask: (x) => `What type of material is ${x}?`,
  hint: 'Ceramics are hard and brittle; polymers are long-chain molecules (plastics, rubber); composites combine two materials.',
  means: {
    Ceramic: 'Hard, brittle, heat-resistant insulators such as brick, pottery and glass.',
    Polymer: 'Very long chain molecules made by joining many small molecules (monomers), such as plastics and rubber.',
    Composite: 'Two or more materials combined to give better properties than either on its own.',
    Metal: 'Shiny, strong, malleable conductors.',
  },
  sortPrompt: 'Match each object to the type of material it is made from.',
})

const materials: Bank = {
  skill: 'chem.materials.types',
  terms: [
    { term: 'Ceramic', def: 'A hard, brittle material that is a good insulator and can withstand high temperatures, such as brick or pottery' },
    { term: 'Polymer', def: 'A substance made of very long chain molecules formed by joining lots of small molecules together' },
    { term: 'Monomer', def: 'A small molecule that can join with many others to make a polymer' },
    { term: 'Composite', def: 'A material made of two or more different materials combined, with better properties than either alone' },
    { term: 'Biodegradable', def: 'Able to be broken down by microorganisms' },
  ],
  mcqs: [
    {
      q: 'Why is concrete reinforced with steel rods for bridges and buildings?',
      a: 'Concrete is strong when squashed but weak when stretched or bent; the steel resists stretching',
      wrong: [{ label: 'Steel makes the concrete lighter', misconception: 'steel-light', feedback: 'Steel is denser than concrete. It is added for strength under tension.' }, 'Steel stops the concrete getting wet', 'Steel makes the concrete set faster'],
      hint: 'Concrete and steel are good at resisting different kinds of force.',
      why: 'Concrete resists compression well but cracks under tension. Steel rods resist tension, so the composite is strong in both ways.',
      lv: [3, 5],
    },
    {
      q: 'Which property makes ceramics a good choice for the inside of a pottery kiln or an oven?',
      a: 'They have very high melting points and are good heat insulators',
      wrong: [{ label: 'They conduct heat well', misconception: 'ceramic-conductor', feedback: 'Ceramics are thermal insulators, which keeps the heat in.' }, 'They are flexible', 'They are very light and stretchy'],
      hint: 'What does an oven lining need to cope with?',
      why: 'Ceramics can withstand very high temperatures without melting and do not let heat through easily.',
      lv: [2, 4],
    },
    {
      q: 'Poly(ethene) is made from ethene. What are the ethene molecules called in this reaction?',
      a: 'Monomers',
      wrong: [{ label: 'Polymers', misconception: 'monomer-polymer-swap', feedback: 'The polymer is the long chain (poly(ethene)). The small units are monomers.' }, 'Composites', 'Ceramics'],
      hint: '"Mono" means one; "poly" means many.',
      why: 'Many small ethene molecules (monomers) join to form the long chain polymer poly(ethene).',
      lv: [2, 4],
    },
    {
      q: 'Which of these is a natural polymer?',
      a: 'Wool',
      wrong: [{ label: 'Nylon', misconception: 'nylon-natural', feedback: 'Nylon is a synthetic (man-made) polymer.' }, 'Poly(ethene)', 'Glass'],
      hint: 'It comes from an animal.',
      why: 'Wool, silk, cotton, natural rubber, starch and DNA are natural polymers. Nylon and poly(ethene) are synthetic.',
      lv: [3, 5],
    },
    {
      q: 'Why are many plastics a problem when they are thrown away?',
      a: 'Most are not biodegradable, so they last for hundreds of years',
      wrong: [{ label: 'They dissolve in rain and poison the soil straight away', misconception: 'plastic-dissolves', feedback: 'The problem is that most plastics do NOT break down.' }, 'They are too heavy for bin lorries', 'They conduct electricity'],
      hint: 'What happens to a plastic bottle buried in the ground?',
      why: 'Most plastics are not broken down by microorganisms, so they build up in landfill and the oceans, harming wildlife.',
      lv: [2, 4],
    },
    {
      q: 'Why is a carbon-fibre composite used for racing bike frames?',
      a: 'It is very strong but has a low density, so the frame is light',
      wrong: [{ label: 'It is cheap and easy to recycle', misconception: 'cf-cheap', feedback: 'Carbon fibre is expensive and hard to recycle. It is chosen for strength and lightness.' }, 'It is magnetic', 'It is a good conductor of heat'],
      hint: 'A racing cyclist wants a frame that is strong and...?',
      why: 'Carbon-fibre composites combine high strength with low density, so frames are strong and light.',
      lv: [3, 5],
    },
  ],
}

export const materialsGenerators: ItemGenerator[] = [
  ...bankGenerators(reactivity),
  ...reactivityGenerators,
  ...displacementGenerators,
  ...bankGenerators(displacement),
  ...extractionClassify,
  ...bankGenerators(extraction),
  ...materialClassify,
  ...bankGenerators(materials),
]
