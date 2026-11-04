import type { ItemGenerator } from '@/engine/registry'
import type { Figure } from '@/engine/types'
import { choice } from '../../kit'
import { bankGenerators, cap, classifyGenerators, G, num, table, type Bank } from './factory'
import { ELEMENTS } from './formula'

// =====================================================================================================================
// Groups and periods
// =====================================================================================================================

const GROUP_ORDER = [1, 2, 3, 4, 5, 6, 7, 0]
/** Main-group elements in periods 2-4 (plus helium), shown in the figure. Hydrogen is left out on purpose. */
const LAYOUT: Record<number, string[]> = {
  1: ['', '', '', '', '', '', '', 'He'],
  2: ['Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne'],
  3: ['Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar'],
  4: ['K', 'Ca', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr'],
}

const PT_FIGURE: Figure = table(
  ['Period', ...GROUP_ORDER.map((g) => `Group ${g}`)],
  [1, 2, 3, 4].map((p) => [String(p), ...(LAYOUT[p] ?? [])]),
)

/** Elements in the figure that have data (name) available, for "which group / period" questions. */
const IN_FIGURE = ELEMENTS.filter((e) => e.group !== null && e.period <= 4 && Object.values(LAYOUT).some((row) => row.includes(e.symbol)))

const tableGenerators: ItemGenerator[] = [
  G('chem.periodic.table.group-of', 'chem.periodic.table', [1, 4], (rng, d) => {
    const e = rng.pick(IN_FIGURE)
    const askPeriod = d >= 3 && rng.chance(0.5)
    if (askPeriod) {
      return num({
        prompt: `Use the part of the periodic table shown. Which period (row) is ${e.name} (${e.symbol}) in?`,
        answer: e.period,
        figure: PT_FIGURE,
        hint: 'Periods are the horizontal rows, numbered from the top.',
        explanation: `${cap(e.name)} is in period ${e.period} (row ${e.period}) and group ${e.group}.`,
        errors: e.group !== null && e.group !== e.period ? [{ values: [e.group], tag: 'group-period-swap', message: 'That is its group (column). Periods are the rows.' }] : [],
      })
    }
    return num({
      prompt: `Use the part of the periodic table shown. Which group (column) is ${e.name} (${e.symbol}) in? (Write 0 for group 0.)`,
      answer: e.group ?? 0,
      figure: PT_FIGURE,
      hint: 'Groups are the vertical columns.',
      explanation: `${cap(e.name)} is in group ${e.group} (column) and period ${e.period} (row).`,
      errors: e.group !== e.period ? [{ values: [e.period], tag: 'group-period-swap', message: 'That is its period (row). Groups are the columns.' }] : [],
    })
  }),
  G('chem.periodic.table.same-group', 'chem.periodic.table', [2, 4], (rng) => {
    const e = rng.pick(IN_FIGURE.filter((x) => x.symbol !== 'He'))
    const sameGroup = IN_FIGURE.filter((x) => x.group === e.group && x !== e)
    const target = rng.pick(sameGroup)
    const samePeriod = IN_FIGURE.filter((x) => x.period === e.period && x.group !== e.group)
    const wrongs = rng.shuffle(samePeriod).slice(0, 3)
    return choice({
      rng,
      prompt: `Which element would you expect to have the most similar chemical properties to ${e.name} (${e.symbol})?`,
      correct: `${cap(target.name)} (${target.symbol})`,
      wrong: wrongs.map((w) => ({ label: `${cap(w.name)} (${w.symbol})`, misconception: 'period-similar', feedback: `${cap(w.name)} is in the same PERIOD (row). Elements in the same GROUP (column) have similar properties.` })),
      figure: PT_FIGURE,
      hint: 'Elements with similar properties are in the same column.',
      explanation: `${cap(target.name)} is in the same group as ${e.name} (group ${e.group}), so they react in similar ways.`,
    })
  }),
]

const tableBank: Bank = {
  skill: 'chem.periodic.table',
  terms: [
    { term: 'Group', def: 'A vertical column of the periodic table; its elements have similar properties' },
    { term: 'Period', def: 'A horizontal row of the periodic table' },
    { term: 'Periodic table', def: 'A chart of all the elements, arranged so that elements with similar properties line up' },
    { term: 'Atomic number', def: 'The number that sets each element\'s place in the modern periodic table' },
  ],
  mcqs: [
    {
      q: 'Where are the metals found in the periodic table?',
      a: 'On the left and in the middle',
      wrong: [{ label: 'On the right', misconception: 'metals-right', feedback: 'The non-metals are on the right, beyond the zig-zag "staircase" line.' }, 'Only in the top row', 'Only in group 0'],
      hint: 'Sodium and iron are metals; oxygen and neon are not.',
      why: 'Metals are on the left and in the centre (most elements are metals). Non-metals are on the right of the staircase line.',
      lv: [1, 3],
    },
    {
      q: 'In 1869 Dmitri Mendeleev published his periodic table. Why did he leave gaps in it?',
      a: 'For elements that had not been discovered yet, whose properties he predicted',
      wrong: [
        { label: 'Because he made mistakes', misconception: 'gaps-mistakes', feedback: 'The gaps were deliberate. Elements were later found that fitted them.' },
        'To make the table fit on a page',
        'For elements that do not exist',
      ],
      hint: 'He was confident enough in the pattern to predict new elements.',
      why: 'Mendeleev left gaps where the pattern said an element should be, and predicted its properties. When elements such as gallium and germanium were discovered and matched his predictions, people became convinced his table was right.',
      lv: [3, 5],
    },
    {
      q: 'Mendeleev arranged the elements mainly by atomic mass. What are they arranged by in the modern periodic table?',
      a: 'Atomic number (number of protons)',
      wrong: [{ label: 'Atomic mass', misconception: 'modern-by-mass', feedback: 'That was Mendeleev\'s method. Today they are ordered by atomic number.' }, 'Date of discovery', 'Alphabetical order'],
      hint: 'It is the number of protons in each atom.',
      why: 'Elements are now arranged in order of atomic number. This fixed a few places where ordering by mass put elements in the wrong group.',
      lv: [4, 5],
    },
  ],
}

// =====================================================================================================================
// Metals and non-metals
// =====================================================================================================================

const metalClassify = classifyGenerators('chem.periodic.metals-nonmetals', {
  id: 'element',
  categories: ['Metal', 'Non-metal'],
  items: ELEMENTS.filter((e) => e.kind !== 'metalloid' && ['Na', 'Mg', 'Al', 'K', 'Ca', 'Fe', 'Cu', 'Zn', 'Ag', 'Au', 'Pb', 'Hg', 'Li', 'Ni', 'C', 'N', 'O', 'S', 'P', 'Cl', 'Br', 'I', 'He', 'Ne', 'Ar', 'H', 'F'].includes(e.symbol)).map(
    (e) => [`${e.name} (${e.symbol})`, e.kind === 'metal' ? 'Metal' : 'Non-metal'] as [string, string],
  ),
  ask: (x) => `Is ${x} a metal or a non-metal?`,
  hint: 'Metals are on the left and in the middle of the periodic table.',
  means: { Metal: 'Found on the left and in the middle of the periodic table.', 'Non-metal': 'Found on the right of the periodic table (plus hydrogen).' },
})

const propertyClassify = classifyGenerators('chem.periodic.metals-nonmetals', {
  id: 'property',
  categories: ['Typical of metals', 'Typical of non-metals'],
  items: [
    ['shiny when freshly cut or polished', 'Typical of metals'],
    ['conducts electricity well', 'Typical of metals'],
    ['can be hammered into shape (malleable)', 'Typical of metals'],
    ['can be drawn out into wires (ductile)', 'Typical of metals'],
    ['makes a ringing sound when hit (sonorous)', 'Typical of metals'],
    ['dull, not shiny', 'Typical of non-metals'],
    ['brittle when solid', 'Typical of non-metals'],
    ['does not conduct heat or electricity well', 'Typical of non-metals'],
    ['forms an acidic oxide', 'Typical of non-metals'],
  ],
  ask: (x) => `Is "${x}" a property typical of metals or of non-metals?`,
  hint: 'Think of copper wire compared with a lump of sulfur.',
  means: { 'Typical of metals': 'Metals are usually shiny, malleable, ductile, sonorous and good conductors.', 'Typical of non-metals': 'Non-metals are usually dull, brittle when solid and poor conductors.' },
})

const metals: Bank = {
  skill: 'chem.periodic.metals-nonmetals',
  terms: [
    { term: 'Malleable', def: 'Can be hammered or bent into shape without breaking' },
    { term: 'Ductile', def: 'Can be pulled out into a thin wire' },
    { term: 'Sonorous', def: 'Makes a ringing sound when hit' },
    { term: 'Brittle', def: 'Breaks or shatters easily when hit' },
    { term: 'Conductor', def: 'A material that lets electricity or heat pass through it easily' },
    { term: 'Insulator', def: 'A material that does not let electricity or heat pass through it easily' },
  ],
  mcqs: [
    {
      q: 'Which of these metals is magnetic?',
      a: 'Iron',
      wrong: [
        { label: 'Copper', misconception: 'all-metals-magnetic', feedback: 'Most metals are not magnetic. Only iron, nickel and cobalt (and steel, which is mostly iron) are.' },
        { label: 'Aluminium', misconception: 'all-metals-magnetic', feedback: 'Aluminium cans are not attracted to magnets: that is how recycling centres sort them from steel cans.' },
        'Gold',
      ],
      hint: 'Only three elements are magnetic.',
      why: 'Iron, nickel and cobalt are the magnetic elements. Steel is magnetic because it is mostly iron. Most metals, like copper and aluminium, are not.',
      lv: [1, 3],
    },
    {
      q: 'Which non-metal is unusual because it conducts electricity?',
      a: 'Carbon, in the form of graphite',
      wrong: [{ label: 'Sulfur', misconception: 'sulfur-conducts', feedback: 'Sulfur is a typical non-metal: an insulator.' }, 'Oxygen', 'Iodine'],
      hint: 'Pencil "lead" is made of it.',
      why: 'Graphite, a form of carbon, conducts electricity, which is why it is used for electrodes. Most non-metals are insulators.',
      lv: [3, 5],
    },
    {
      q: 'Which metal is a liquid at room temperature?',
      a: 'Mercury',
      wrong: [{ label: 'Bromine', misconception: 'bromine-metal', feedback: 'Bromine is a liquid too, but it is a non-metal (a halogen).' }, 'Sodium', 'Lead'],
      hint: 'It used to be used in thermometers.',
      why: 'Mercury is the only metal that is liquid at room temperature. (Bromine is the only liquid non-metal.)',
      lv: [2, 4],
    },
    {
      q: 'Why are electrical wires made of copper?',
      a: 'Copper is ductile and a very good conductor of electricity',
      wrong: [{ label: 'Copper is magnetic', misconception: 'copper-magnetic', feedback: 'Copper is not magnetic. Wires need conductivity and ductility.' }, 'Copper is brittle', 'Copper is an insulator'],
      hint: 'A wire needs to be drawn out thin and to carry a current.',
      why: 'Copper can be pulled into thin wires (ductile) and conducts electricity very well.',
      lv: [2, 4],
    },
  ],
}

// =====================================================================================================================
// Group 1
// =====================================================================================================================

/** Melting points of the alkali metals, rounded to the nearest °C (data-book values). */
const G1_MP: [string, number][] = [
  ['Lithium', 181],
  ['Sodium', 98],
  ['Potassium', 63],
  ['Rubidium', 39],
  ['Caesium', 28],
]

const group1: Bank = {
  skill: 'chem.periodic.group1',
  mcqs: [
    {
      q: 'Why are lithium, sodium and potassium stored under oil?',
      a: 'They react with oxygen and water vapour in the air, and oil keeps the air out',
      wrong: [{ label: 'To stop them melting', misconception: 'oil-melting', feedback: 'They are solids at room temperature. The oil is to keep air and water away.' }, 'Because they are poisonous', 'To keep them shiny for display'],
      hint: 'What would happen if they touched water?',
      why: 'Group 1 metals are very reactive: they react with oxygen and with water. Oil keeps air and moisture away.',
      lv: [1, 3],
    },
    {
      q: 'What are the products when sodium reacts with water?',
      a: 'Sodium hydroxide and hydrogen',
      wrong: [{ label: 'Sodium oxide and hydrogen', misconception: 'oxide-not-hydroxide', feedback: 'With water the product is the hydroxide.' }, 'Sodium chloride and water', { label: 'Sodium hydroxide and oxygen', misconception: 'water-oxygen', feedback: 'The gas given off burns with a squeaky pop: it is hydrogen.' }],
      hint: 'The gas given off burns with a squeaky pop.',
      why: 'sodium + water → sodium hydroxide + hydrogen. The sodium hydroxide dissolves, making an alkaline solution: that is why they are called alkali metals.',
      lv: [2, 4],
    },
    {
      q: 'How does the reactivity of the group 1 metals change going down the group?',
      a: 'It increases',
      wrong: [{ label: 'It decreases', misconception: 'g1-trend-down', feedback: 'Lithium fizzes gently, sodium whizzes around, potassium catches fire: reactivity INCREASES down group 1.' }, 'It stays the same'],
      hint: 'Compare lithium, sodium and potassium in water.',
      why: 'Reactivity increases down group 1: lithium fizzes steadily, sodium melts and whizzes around, potassium bursts into a lilac flame.',
      keepOrder: true,
      lv: [1, 3],
    },
    {
      q: 'Potassium is dropped into water. What would you see?',
      a: 'It whizzes around on the surface and burns with a lilac flame',
      wrong: [{ label: 'It sinks and slowly fizzes', misconception: 'g1-sinks', feedback: 'Group 1 metals are less dense than water, so they float. Potassium reacts very vigorously.' }, 'Nothing happens', 'It turns the water green'],
      hint: 'Potassium is more reactive than sodium.',
      why: 'Potassium floats, reacts violently, whizzes around and the hydrogen given off catches fire with a lilac flame.',
      lv: [2, 4],
    },
    {
      q: 'Universal indicator is added to the water after sodium has reacted with it. What colour does it go?',
      a: 'Purple, because sodium hydroxide is a strong alkali',
      wrong: [{ label: 'Red, because an acid forms', misconception: 'g1-acid', feedback: 'A hydroxide forms, which is an alkali.' }, 'Green, because water is neutral', 'Orange, because hydrogen is acidic'],
      hint: 'Why are they called the ALKALI metals?',
      why: 'The reaction makes sodium hydroxide, a strong alkali, so the indicator turns purple.',
      lv: [3, 5],
    },
    {
      q: 'Which property makes the group 1 metals unusual compared with most metals?',
      a: 'They are soft enough to cut with a knife and have low densities',
      wrong: [{ label: 'They conduct electricity', misconception: 'g1-conduct', feedback: 'All metals conduct electricity; that is not unusual.' }, 'They are shiny when freshly cut', 'They are solids at room temperature'],
      hint: 'Most metals are hard and dense.',
      why: 'Group 1 metals are soft (they can be cut with a knife) and lithium, sodium and potassium are less dense than water, so they float. They are still shiny conductors like other metals.',
      lv: [3, 5],
    },
  ],
  orders: [
    {
      prompt: 'Put these group 1 metals in order of reactivity.',
      steps: ['Lithium', 'Sodium', 'Potassium', 'Rubidium'],
      direction: ['least reactive', 'most reactive'],
      hint: 'Reactivity changes steadily down the group.',
      why: 'Reactivity increases down group 1: lithium < sodium < potassium < rubidium.',
      lv: [2, 4],
    },
  ],
  written: [
    {
      prompt: 'Describe what you would see when a small piece of sodium is added to a trough of water, and name the products.',
      model:
        'The sodium floats because it is less dense than water. It fizzes as hydrogen gas is given off, melts into a shiny silvery ball because the reaction gives out heat, and whizzes around on the surface until it disappears. The products are sodium hydroxide, which dissolves to make an alkaline solution, and hydrogen.',
      checklist: ['Says it floats', 'Says it fizzes / bubbles of gas', 'Says it melts into a ball and/or moves around', 'Names sodium hydroxide and hydrogen as products'],
      hint: 'Think about what you would see, then what is made.',
    },
  ],
}

const group1Generators: ItemGenerator[] = [
  G('chem.periodic.group1.predict', 'chem.periodic.group1', [3, 5], (rng, d) => {
    const hide = d >= 5 ? rng.pick([3, 4]) : 3
    const shown = G1_MP.slice(0, hide)
    const [name, real] = G1_MP[hide] as [string, number]
    const prev = shown[shown.length - 1]?.[1] ?? 0
    const fig = table(['Element', 'Melting point (°C)'], [...shown.map(([n, m]) => [n, String(m)]), [name, '?']])
    return choice({
      rng,
      prompt: `Use the pattern in the table to predict the melting point of ${name.toLowerCase()}.`,
      correct: `About ${Math.round(real / 5) * 5} °C`,
      wrong: [
        { label: `About ${Math.round((prev + 40) / 5) * 5} °C`, misconception: 'trend-reversed', feedback: 'Melting points go DOWN the group, so it must be lower than the one above.' },
        { label: `About ${Math.round((prev * 2 + 100) / 10) * 10} °C`, misconception: 'trend-reversed', feedback: 'Melting points go DOWN the group.' },
        { label: 'Below −50 °C', misconception: 'trend-overshoot', feedback: 'The values fall steadily but not that sharply; it is still a solid at −50 °C.' },
      ],
      keepOrder: false,
      figure: fig,
      hint: 'Is the melting point going up or down the group? By roughly how much each time?',
      explanation: `Melting points decrease down group 1, so ${name.toLowerCase()} should melt below ${prev} °C. Its actual melting point is about ${real} °C.`,
    })
  }),
]

// =====================================================================================================================
// Group 7
// =====================================================================================================================

const HALOGENS = ['fluorine', 'chlorine', 'bromine', 'iodine']
const HALIDE: Record<string, string> = { chlorine: 'chloride', bromine: 'bromide', iodine: 'iodide' }

const group7: Bank = {
  skill: 'chem.periodic.group7',
  links: [
    {
      prompt: 'Match each halogen to how it looks at room temperature.',
      pairs: [
        ['Fluorine', 'Pale yellow gas'],
        ['Chlorine', 'Green-yellow gas'],
        ['Bromine', 'Red-brown liquid'],
        ['Iodine', 'Grey-black solid'],
      ],
      hint: 'Going down group 7 the colours get darker and the state goes from gas to liquid to solid.',
      ask: (l) => `What does ${l.toLowerCase()} look like at room temperature?`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'How does the reactivity of the halogens change going down group 7?',
      a: 'It decreases',
      wrong: [{ label: 'It increases', misconception: 'g7-like-g1', feedback: 'That is the trend in group 1. In group 7, reactivity DECREASES down the group.' }, 'It stays the same'],
      hint: 'Fluorine is the most reactive non-metal of all.',
      why: 'Reactivity decreases down group 7: fluorine is the most reactive and iodine the least (of these four). This is the opposite of group 1.',
      keepOrder: true,
      lv: [1, 3],
    },
    {
      q: 'How do the melting and boiling points change going down group 7?',
      a: 'They increase',
      wrong: [{ label: 'They decrease', misconception: 'g7-mp-like-g1', feedback: 'In group 1 they decrease; in group 7 they increase, which is why the halogens go from gas to liquid to solid.' }, 'They stay the same'],
      hint: 'Fluorine and chlorine are gases, bromine is a liquid, iodine is a solid.',
      why: 'Melting and boiling points increase down group 7, so the state changes from gas (fluorine, chlorine) to liquid (bromine) to solid (iodine).',
      keepOrder: true,
      lv: [2, 4],
    },
    {
      q: 'Why is chlorine added to drinking water and swimming pools?',
      a: 'To kill bacteria',
      wrong: ['To make the water taste better', { label: 'To make the water alkaline', misconception: 'chlorine-alkali', feedback: 'Chlorine is used because it kills microorganisms.' }, 'To colour the water'],
      hint: 'It is about keeping people healthy.',
      why: 'Chlorine kills bacteria and other microorganisms, making water safe to drink and swim in.',
      lv: [1, 3],
    },
    {
      q: 'How do halogen molecules exist?',
      a: 'As pairs of atoms joined together, such as Cl_{2}',
      wrong: [{ label: 'As single atoms, like the noble gases', misconception: 'halogen-monatomic', feedback: 'The noble gases are single atoms; the halogens form diatomic molecules.' }, 'As giant structures of metal atoms', 'As molecules of three atoms'],
      hint: 'Chlorine gas has the formula Cl_{2}.',
      why: 'The halogens are diatomic: each molecule is two atoms joined together (F_{2}, Cl_{2}, Br_{2}, I_{2}).',
      lv: [3, 5],
    },
    {
      q: 'Sodium reacts with chlorine. What is the product?',
      a: 'Sodium chloride',
      wrong: [{ label: 'Sodium chlorine', misconception: 'no-ide', feedback: 'In a compound, the halogen\'s name ends in -ide.' }, 'Sodium chlorate', 'Sodium hydroxide'],
      hint: 'Halogens + metals make salts called halides.',
      why: 'sodium + chlorine → sodium chloride. Halogens react with metals to form halides (chlorides, bromides, iodides).',
      lv: [2, 4],
    },
  ],
  orders: [
    {
      prompt: 'Put the halogens in order of reactivity.',
      steps: ['Fluorine', 'Chlorine', 'Bromine', 'Iodine'],
      direction: ['most reactive', 'least reactive'],
      hint: 'Reactivity decreases down group 7.',
      why: 'Fluorine > chlorine > bromine > iodine: reactivity decreases down the group.',
      lv: [2, 4],
    },
  ],
}

const group7Generators: ItemGenerator[] = [
  G('chem.periodic.group7.displacement', 'chem.periodic.group7', [3, 5], (rng, d) => {
    const pool = ['chlorine', 'bromine', 'iodine']
    const x = rng.pick(pool)
    const y = rng.pick(pool.filter((h) => h !== x))
    const metal = rng.pick(['potassium', 'sodium'])
    const salt = `${metal} ${HALIDE[y]}`
    const reacts = HALOGENS.indexOf(x) < HALOGENS.indexOf(y)
    if (d <= 4) {
      const yes = `Yes, because ${x} is more reactive than ${y}`
      const no = `No, because ${x} is less reactive than ${y}`
      return choice({
        rng,
        prompt: `${cap(x)} solution is added to ${salt} solution. Will there be a displacement reaction?`,
        correct: reacts ? yes : no,
        wrong: [
          reacts ? { label: no, misconception: 'g7-trend', feedback: `${cap(x)} is higher in group 7, so it is MORE reactive.` } : { label: yes, misconception: 'g7-trend', feedback: `${cap(x)} is lower in group 7, so it is LESS reactive.` },
          reacts ? { label: `No, because ${x} is more reactive than ${y}`, misconception: 'displace-rule', feedback: 'A MORE reactive halogen does displace a less reactive one.' } : { label: `Yes, because ${y} is more reactive than ${x}`, misconception: 'displace-rule', feedback: `The halogen being added (${x}) has to be the more reactive one.` },
          { label: 'No, because two halogens can never react', misconception: 'no-halogen-reaction', feedback: 'They can, when the added halogen is more reactive.' },
        ],
        hint: 'A more reactive halogen pushes a less reactive one out of its compound. Reactivity decreases down the group.',
        explanation: reacts
          ? `${cap(x)} is above ${y} in group 7, so it is more reactive and displaces it: ${x} + ${salt} → ${metal} ${HALIDE[x]} + ${y}.`
          : `${cap(x)} is below ${y} in group 7, so it is less reactive and cannot displace it. No reaction.`,
      })
    }
    // Level 5: products of a reaction that does happen.
    const [a, b] = HALOGENS.indexOf(x) < HALOGENS.indexOf(y) ? [x, y] : [y, x]
    const s = `${metal} ${HALIDE[b]}`
    return choice({
      rng,
      prompt: `Complete the word equation:\n${a} + ${s} → ?`,
      correct: `${metal} ${HALIDE[a]} + ${b}`,
      wrong: [
        { label: `${metal} ${HALIDE[b]} + ${a}`, misconception: 'displace-nothing', feedback: 'That just repeats the reactants the other way round.' },
        { label: `${metal} + ${a} ${HALIDE[b]}`, misconception: 'halogen-displaces-metal', feedback: 'The halogen displaces the other halogen, not the metal.' },
        { label: 'No reaction', misconception: 'g7-trend', feedback: `${cap(a)} is more reactive than ${b}, so it does react.` },
      ],
      hint: 'The more reactive halogen takes the place of the less reactive one.',
      explanation: `${cap(a)} is more reactive than ${b}, so it displaces it: ${a} + ${s} → ${metal} ${HALIDE[a]} + ${b}.`,
    })
  }),
]

// =====================================================================================================================
// Group 0
// =====================================================================================================================

/** Boiling points of the noble gases, rounded to the nearest °C (data-book values). */
const G0_BP: [string, number][] = [
  ['Helium', -269],
  ['Neon', -246],
  ['Argon', -186],
  ['Krypton', -153],
  ['Xenon', -108],
]

const group0: Bank = {
  skill: 'chem.periodic.group0',
  links: [
    {
      prompt: 'Match each noble gas to a use.',
      pairs: [
        ['Helium', 'Filling party balloons and airships'],
        ['Neon', 'Glowing advertising signs'],
        ['Argon', 'Filling light bulbs and shielding metals during welding'],
      ],
      hint: 'One is less dense than air; one glows red-orange when electricity passes through it; one is the cheapest unreactive gas to stop hot metal reacting.',
      ask: (l) => `What is ${l.toLowerCase()} used for?`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'Why are the noble gases so unreactive?',
      a: 'Their atoms have a full outer shell of electrons',
      wrong: [{ label: 'They are gases, and gases cannot react', misconception: 'gases-unreactive', feedback: 'Plenty of gases react (oxygen, chlorine, hydrogen). The noble gases are special because of their electrons.' }, 'Their atoms have no electrons', 'They are too cold to react'],
      hint: 'Think about the electrons in the outer shell.',
      why: 'Noble gas atoms have full outer shells, which is a very stable arrangement, so they do not need to gain, lose or share electrons.',
      lv: [3, 5],
    },
    {
      q: 'Why is helium used in balloons instead of hydrogen, even though hydrogen is less dense?',
      a: 'Helium is unreactive and will not burn; hydrogen is flammable',
      wrong: [{ label: 'Helium is less dense than hydrogen', misconception: 'helium-lightest', feedback: 'Hydrogen is actually less dense. Helium is chosen for safety.' }, 'Helium is cheaper to make', 'Hydrogen is a liquid'],
      hint: 'Think about what happens if a spark reaches the gas.',
      why: 'Both are less dense than air, but hydrogen burns explosively. Helium is a noble gas, so it is unreactive and safe.',
      lv: [2, 4],
    },
    {
      q: 'How do noble gases exist?',
      a: 'As single atoms',
      wrong: [{ label: 'As pairs of atoms, like Cl_{2}', misconception: 'noble-diatomic', feedback: 'That is how halogens exist. Noble gases are monatomic.' }, 'As giant structures', 'As compounds with oxygen'],
      hint: 'They do not even bond to each other.',
      why: 'Because they are so unreactive, noble gas atoms do not join together: they exist as single atoms (they are monatomic).',
      lv: [2, 4],
    },
    {
      q: 'Why is argon used inside filament light bulbs?',
      a: 'It is unreactive, so the hot filament does not react with it',
      wrong: [{ label: 'It glows brightly when heated', misconception: 'argon-glows', feedback: 'The filament glows. The argon is there because it does not react.' }, 'It conducts electricity to the filament', 'It is a fuel'],
      hint: 'What would happen to a very hot metal filament in air?',
      why: 'In air, the white-hot filament would react with oxygen and burn out. Argon is unreactive, so the filament lasts.',
      lv: [3, 5],
    },
  ],
}

const group0Generators: ItemGenerator[] = [
  G('chem.periodic.group0.trend', 'chem.periodic.group0', [2, 5], (rng, d) => {
    const hide = d >= 4 ? 4 : rng.int(1, 3)
    const fig = table(['Element', 'Boiling point (°C)'], G0_BP.map(([n, b], i) => [n, i === hide ? '?' : String(b)]))
    const [name, real] = G0_BP[hide] as [string, number]
    if (d <= 3) {
      const above = G0_BP[hide - 1]?.[1] ?? 0
      const below = G0_BP[hide + 1]?.[1] ?? 0
      return choice({
        rng,
        prompt: `Use the table. Which is the best estimate of the boiling point of ${name.toLowerCase()}?`,
        correct: `Between ${above} °C and ${below} °C`,
        wrong: [
          { label: `Below ${above} °C`, misconception: 'trend-reversed', feedback: 'Boiling points increase down the group, so it must be above the element above it.' },
          { label: `Above ${below} °C`, misconception: 'trend-reversed', feedback: 'It must be below the element underneath it.' },
          'Exactly 0 °C',
        ],
        figure: fig,
        hint: 'Is there a steady pattern down the group?',
        explanation: `Boiling points increase down group 0, so ${name.toLowerCase()} boils between ${above} °C and ${below} °C (actually about ${real} °C).`,
      })
    }
    return choice({
      rng,
      prompt: 'Use the pattern in the table to predict the boiling point of xenon.',
      correct: 'About −110 °C',
      wrong: [
        { label: 'About −170 °C', misconception: 'trend-reversed', feedback: 'That is lower than krypton. Boiling points increase down the group.' },
        { label: 'About −290 °C', misconception: 'below-absolute-zero', feedback: 'Nothing can be colder than about −273 °C, and the trend goes up anyway.' },
        'About +50 °C',
      ],
      figure: fig,
      hint: 'Look at the jumps between neighbours: roughly how big is each one?',
      explanation: `Boiling points rise by roughly 20 to 60 °C each step down the group, so xenon should be about −110 °C. Its actual boiling point is about ${real} °C.`,
    })
  }),
]

export const periodicGenerators: ItemGenerator[] = [
  ...tableGenerators,
  ...bankGenerators(tableBank),
  ...metalClassify,
  ...propertyClassify,
  ...bankGenerators(metals),
  ...bankGenerators(group1),
  ...group1Generators,
  ...bankGenerators(group7),
  ...group7Generators,
  ...bankGenerators(group0),
  ...group0Generators,
]

