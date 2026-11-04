import type { ItemGenerator } from '@/engine/registry'
import { choice, matchItem, textItem } from '../../kit'
import { bankGenerators, cap, classifyGenerators, fmt, G, num, table, type Bank } from './factory'
import { BY_SYMBOL, COMPOUNDS, ELEMENTS, elementsIn, LATIN_SYMBOLS, parseFormula, rfm, totalAtoms, type Compound } from './formula'

// =====================================================================================================================
// Atoms and elements
// =====================================================================================================================

const elements: Bank = {
  skill: 'chem.atoms.elements',
  terms: [
    { term: 'Atom', def: 'The smallest particle of an element that can exist' },
    { term: 'Element', def: 'A substance made of only one type of atom' },
    { term: 'Molecule', def: 'Two or more atoms chemically joined together' },
    { term: 'Compound', def: 'A substance made of two or more different elements chemically joined together' },
    { term: 'Chemical symbol', def: 'A one- or two-letter code for an element, such as O or Na' },
  ],
  mcqs: [
    {
      q: 'Which of these is an element?',
      a: 'Copper',
      wrong: [
        { label: 'Water', misconception: 'water-element', feedback: 'Water is a compound of hydrogen and oxygen.' },
        { label: 'Carbon dioxide', misconception: 'compound-as-element', feedback: 'Carbon dioxide is a compound: carbon and oxygen joined together.' },
        { label: 'Air', misconception: 'air-element', feedback: 'Air is a mixture of gases.' },
      ],
      hint: 'An element contains only one type of atom. Which one is on the periodic table?',
      why: 'Copper is made of only copper atoms, so it is an element. Water and carbon dioxide are compounds; air is a mixture.',
      lv: [1, 2],
    },
    {
      q: 'Which of these is an element?',
      a: 'Oxygen',
      wrong: [
        { label: 'Salt (sodium chloride)', misconception: 'compound-as-element', feedback: 'Sodium chloride is a compound of two elements, sodium and chlorine.' },
        { label: 'Steel', misconception: 'alloy-element', feedback: 'Steel is a mixture (an alloy) of iron with carbon and sometimes other elements.' },
        'Glucose',
      ],
      hint: 'Only one type of atom.',
      why: 'Oxygen is made only of oxygen atoms (in O_{2} molecules), so it is an element.',
      lv: [1, 3],
    },
    {
      q: 'Oxygen gas is made of O_{2} molecules. Is oxygen an element or a compound?',
      a: 'An element, because both atoms in the molecule are oxygen atoms',
      wrong: [
        { label: 'A compound, because the atoms are joined together', misconception: 'molecule-means-compound', feedback: 'A compound needs DIFFERENT elements joined. Two oxygen atoms joined is still just oxygen.' },
        'A mixture, because there are two atoms',
        'Neither: it is a molecule, so it cannot be an element',
      ],
      hint: 'How many different types of atom are there?',
      why: 'Molecules can be elements or compounds. O_{2} contains only oxygen atoms, so oxygen is an element. A compound must contain at least two different elements.',
      lv: [3, 5],
    },
    {
      q: 'How many elements are known today?',
      a: '118',
      wrong: [{ label: '4 (earth, air, fire and water)', misconception: 'ancient-elements', feedback: 'That was the Ancient Greek idea. Modern elements are substances made of one type of atom.' }, '26', '1,000'],
      hint: 'Count the boxes on a periodic table.',
      why: 'There are 118 known elements, each with its own box on the periodic table.',
      lv: [2, 4],
    },
    {
      q: 'In the early 1800s John Dalton put forward an idea about atoms. Which statement was part of his theory?',
      a: 'All matter is made of tiny atoms, and atoms of the same element are identical to each other',
      wrong: [
        { label: 'Atoms contain protons, neutrons and electrons', misconception: 'dalton-subatomic', feedback: 'These particles were discovered long after Dalton. He thought atoms could not be split.' },
        'Atoms are mostly empty space with a tiny nucleus',
        'Matter is made of earth, air, fire and water',
      ],
      hint: 'Dalton imagined atoms as tiny solid spheres.',
      why: 'Dalton suggested that everything is made of tiny atoms that cannot be created, destroyed or divided, that all atoms of one element are the same, and that atoms of different elements are different.',
      lv: [3, 5],
    },
    {
      q: 'How is an atom of gold different from an atom of silver?',
      a: 'They are atoms of different elements, so they are different from each other',
      wrong: [
        { label: 'A gold atom is gold-coloured and a silver atom is silver-coloured', misconception: 'atoms-have-colour', feedback: 'Single atoms do not have the colour of the bulk metal. Colour is a property of lots of atoms together.' },
        'They are identical: all atoms are the same',
        'A gold atom is shiny and a silver atom is dull',
      ],
      hint: 'Can a single atom be "shiny" or "yellow"?',
      why: 'Each element has its own type of atom, with a different mass and size. Properties like colour and shininess belong to large numbers of atoms together, not single atoms.',
      lv: [4, 5],
    },
  ],
}

// =====================================================================================================================
// Chemical symbols
// =====================================================================================================================

/** Elements a Year 7 is expected to know (no transition metals she has not met). */
const SYMBOL_SET = ['H', 'He', 'Li', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca', 'Fe', 'Cu', 'Zn', 'Br', 'Ag', 'Sn', 'I', 'Au', 'Hg', 'Pb', 'Ni']
  .map((s) => BY_SYMBOL[s])
  .filter((e): e is NonNullable<typeof e> => !!e)
const EASY = SYMBOL_SET.filter((e) => !LATIN_SYMBOLS[e.symbol])
const LATIN = SYMBOL_SET.filter((e) => LATIN_SYMBOLS[e.symbol])

const symbolGenerators: ItemGenerator[] = [
  G('chem.atoms.symbols.name-to-symbol', 'chem.atoms.symbols', [1, 4], (rng, d) => {
    const pool = d <= 2 ? EASY : d === 3 ? SYMBOL_SET : LATIN
    const e = rng.pick(pool)
    const others = rng.shuffle(SYMBOL_SET.filter((x) => x !== e)).slice(0, 3)
    const latin = LATIN_SYMBOLS[e.symbol]
    return choice({
      rng,
      prompt: `What is the chemical symbol for ${e.name}?`,
      correct: e.symbol,
      wrong: others.map((o) => ({ label: o.symbol, misconception: 'wrong-symbol', feedback: `${o.symbol} is ${o.name}.` })),
      hint: latin ? 'This one does not come from its English name.' : 'Most symbols are the first letter of the English name, sometimes with one more letter from the name.',
      explanation: latin ? `${cap(e.name)} is ${e.symbol}, from its Latin name "${latin}".` : `${cap(e.name)} is ${e.symbol}.`,
    })
  }),
  G('chem.atoms.symbols.symbol-to-name', 'chem.atoms.symbols', [2, 5], (rng, d) => {
    const pool = d <= 3 ? EASY : SYMBOL_SET
    const e = rng.pick(pool)
    const latin = LATIN_SYMBOLS[e.symbol]
    return textItem({
      prompt: `Which element has the chemical symbol ${e.symbol}? Type its name.`,
      accept: e.symbol === 'S' ? ['sulfur', 'sulphur'] : e.symbol === 'Al' ? ['aluminium', 'aluminum'] : [e.name],
      placeholder: 'Element name',
      hint: latin ? 'The symbol comes from the Latin name, so think of the elements whose symbols do not match their English names.' : `Its name starts with "${e.name.charAt(0)}".`,
      explanation: latin ? `${e.symbol} is ${e.name} (from the Latin "${latin}").` : `${e.symbol} is ${e.name}.`,
    })
  }),
  G('chem.atoms.symbols.match', 'chem.atoms.symbols', [2, 4], (rng, d) => {
    const pool = d <= 2 ? EASY : SYMBOL_SET
    const pick = rng.shuffle(pool).slice(0, d >= 4 ? 5 : 4)
    return matchItem({
      prompt: 'Match each element to its chemical symbol.',
      pairs: pick.map((e) => ({ left: cap(e.name), right: e.symbol })),
      hint: 'Most symbols come from the English name. A few come from Latin.',
      explanation: pick.map((e) => `${cap(e.name)} = ${e.symbol}`).join(', '),
    })
  }),
  G('chem.atoms.symbols.capitals', 'chem.atoms.symbols', [3, 5], (rng) => {
    const cases: { el: string; right: string; wrongs: { label: string; feedback: string }[] }[] = [
      { el: 'cobalt', right: 'Co', wrongs: [{ label: 'CO', feedback: 'CO (two capitals) is carbon monoxide, a compound of carbon and oxygen.' }, { label: 'co', feedback: 'A symbol always starts with a capital letter.' }, { label: 'cO', feedback: 'The first letter is the capital one.' }] },
      { el: 'magnesium', right: 'Mg', wrongs: [{ label: 'MG', feedback: 'Only the first letter is a capital.' }, { label: 'mg', feedback: 'A symbol always starts with a capital letter. (mg means milligrams.)' }, { label: 'mG', feedback: 'The first letter is the capital one.' }] },
      { el: 'calcium', right: 'Ca', wrongs: [{ label: 'CA', feedback: 'Only the first letter is a capital.' }, { label: 'ca', feedback: 'A symbol always starts with a capital letter.' }, { label: 'cA', feedback: 'The first letter is the capital one.' }] },
      { el: 'helium', right: 'He', wrongs: [{ label: 'HE', feedback: 'Only the first letter is a capital.' }, { label: 'he', feedback: 'A symbol always starts with a capital letter.' }, { label: 'H', feedback: 'H on its own is hydrogen.' }] },
      { el: 'chlorine', right: 'Cl', wrongs: [{ label: 'CL', feedback: 'Only the first letter is a capital.' }, { label: 'C', feedback: 'C on its own is carbon.' }, { label: 'cl', feedback: 'A symbol always starts with a capital letter.' }] },
    ]
    const c = rng.pick(cases)
    return choice({
      rng,
      prompt: `Which is the correctly written symbol for ${c.el}?`,
      correct: c.right,
      wrong: c.wrongs.map((w) => ({ ...w, misconception: 'symbol-capitals' })),
      hint: 'A symbol has one capital letter, sometimes followed by one small letter.',
      explanation: `${cap(c.el)} is ${c.right}: the first letter is always a capital and any second letter is lower case. Getting this wrong can change the meaning completely (Co is cobalt, but CO is carbon monoxide).`,
    })
  }),
]

// =====================================================================================================================
// Elements, compounds and mixtures
// =====================================================================================================================

const MEANS_ECM: Record<string, string> = {
  Element: 'Made of only one type of atom.',
  Compound: 'Two or more different elements chemically joined in fixed proportions.',
  Mixture: 'Two or more substances mixed together but not chemically joined.',
}

const ecmClassify = classifyGenerators('chem.atoms.mixtures', {
  id: 'classify',
  categories: ['Element', 'Compound', 'Mixture'],
  items: [
    ['gold', 'Element'],
    ['copper', 'Element'],
    ['iron', 'Element'],
    ['sulfur', 'Element'],
    ['nitrogen gas', 'Element'],
    ['helium', 'Element'],
    ['water', 'Compound'],
    ['carbon dioxide', 'Compound'],
    ['sodium chloride', 'Compound'],
    ['magnesium oxide', 'Compound'],
    ['methane', 'Compound'],
    ['iron sulfide', 'Compound'],
    ['air', 'Mixture'],
    ['sea water', 'Mixture'],
    ['crude oil', 'Mixture'],
    ['ink', 'Mixture'],
    ['steel', 'Mixture'],
    ['soil', 'Mixture'],
  ],
  ask: (x) => `Is ${x} an element, a compound or a mixture?`,
  hint: 'One type of atom: element. Different elements chemically joined: compound. Not chemically joined: mixture.',
  means: MEANS_ECM,
  sortPrompt: 'Match each substance to the right category.',
})

const particleClassify = classifyGenerators('chem.atoms.mixtures', {
  id: 'particle-picture',
  categories: ['Element', 'Compound', 'Mixture'],
  items: [
    ['separate single atoms, all of the same type', 'Element'],
    ['molecules each made of two identical atoms joined together', 'Element'],
    ['identical molecules, each made of two different types of atom joined together', 'Compound'],
    ['identical molecules, each made of one carbon atom joined to two oxygen atoms', 'Compound'],
    ['single atoms of two different types, not joined to each other', 'Mixture'],
    ['some molecules made of two hydrogen atoms and some made of two oxygen atoms, not joined to each other', 'Mixture'],
  ],
  ask: (x) => `A particle diagram shows ${x}. Is the substance an element, a compound or a mixture?`,
  hint: 'Count the different TYPES of atom, then check whether different types are joined to each other.',
  means: MEANS_ECM,
  sortPrompt: 'Match each particle description to what it shows.',
  lv: [2, 5],
})

const mixtures: Bank = {
  skill: 'chem.atoms.mixtures',
  mcqs: [
    {
      q: 'Iron (a magnetic grey metal) is heated with sulfur (a yellow powder) and they react. What is true about the iron sulfide made?',
      a: 'It is a new substance with different properties: for example it is not magnetic like iron',
      wrong: [
        { label: 'It is still magnetic because it contains iron', misconception: 'compound-keeps-properties', feedback: 'A compound has its own properties, different from the elements in it.' },
        { label: 'The iron can be pulled out of it with a magnet', misconception: 'compound-separable', feedback: 'That works for a MIXTURE of iron and sulfur, not for the compound.' },
        'It is a mixture of iron and sulfur',
      ],
      hint: 'Did a chemical reaction happen?',
      why: 'Iron and sulfur have reacted to form a compound, iron sulfide. Compounds have different properties from their elements and cannot be separated by physical methods such as a magnet.',
      lv: [3, 5],
    },
    {
      q: 'Sodium is a very reactive metal and chlorine is a poisonous gas. What are the properties of the compound they make, sodium chloride?',
      a: 'It is table salt, safe to eat in small amounts',
      wrong: [
        { label: 'It is a poisonous, reactive metal', misconception: 'compound-keeps-properties', feedback: 'Compounds do not keep the properties of their elements.' },
        'It is a green gas',
        'It is the same as a mixture of sodium and chlorine',
      ],
      hint: 'Compounds can be very different from the elements that made them.',
      why: 'Sodium chloride is ordinary salt. This shows that a compound has completely different properties from the elements it is made from.',
      lv: [2, 4],
    },
    {
      q: 'How can you separate a mixture of iron filings and sulfur powder?',
      a: 'Use a magnet to pull out the iron',
      wrong: [
        { label: 'You cannot; they are joined together', misconception: 'mixture-joined', feedback: 'In a mixture the substances are not chemically joined, so they can be separated physically.' },
        'Heat it strongly',
        'Add water and filter out the iron',
      ],
      hint: 'In a mixture each substance keeps its own properties.',
      why: 'In a mixture the iron keeps its properties, including being magnetic, so a magnet separates it. (Heating would make them react to form iron sulfide.)',
      lv: [1, 3],
    },
    {
      q: 'Which statement is true for compounds but NOT for mixtures?',
      a: 'The elements are always present in fixed proportions',
      wrong: [
        { label: 'They contain more than one substance', misconception: 'compound-many-substances', feedback: 'A compound is ONE substance (containing more than one element).' },
        { label: 'They can be separated by filtering', misconception: 'compound-filter', feedback: 'Compounds can only be broken down by chemical reactions.' },
        'The substances keep their own properties',
      ],
      hint: 'Water is always H_{2}O. Can you make salty water with any amount of salt?',
      why: 'A compound always has the same elements in the same proportions (water is always two hydrogen atoms to one oxygen atom). A mixture can be in any proportions.',
      lv: [3, 5],
    },
  ],
}

// =====================================================================================================================
// Compounds and formulae
// =====================================================================================================================

const SIMPLE = COMPOUNDS.filter((c) => !c.element && !c.formula.includes('('))
const ALLC = COMPOUNDS.filter((c) => !c.element)
const nameOf = (sym: string) => BY_SYMBOL[sym]?.name ?? sym
const listNames = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)

const compoundGenerators: ItemGenerator[] = [
  G('chem.atoms.compounds.count-atoms', 'chem.atoms.compounds', [2, 5], (rng, d) => {
    const pool = d <= 2 ? SIMPLE.filter((c) => totalAtoms(c.formula) <= 4) : d === 3 ? SIMPLE : SIMPLE.filter((c) => totalAtoms(c.formula) >= 4)
    const c: Compound = d >= 5 ? rng.pick(ALLC.filter((x) => x.formula.includes('(') || totalAtoms(x.formula) >= 6)) : rng.pick(pool)
    const counts = parseFormula(c.formula)
    const els = Object.keys(counts)
    const askTotal = d >= 4 || els.length === 1 || rng.chance(0.4)
    if (askTotal) {
      const tot = totalAtoms(c.formula)
      return num({
        prompt: `How many atoms are there altogether in one ${c.formula} (${c.name})?`,
        answer: tot,
        suffix: 'atoms',
        hint: c.formula.includes('(') ? 'A small number after a bracket multiplies everything inside the bracket.' : 'A small number after a symbol tells you how many of THAT atom. No number means one.',
        explanation: `${c.formula}: ${els.map((e) => `${counts[e]} ${nameOf(e)}`).join(' + ')} = ${tot} atoms.`,
        errors: [{ values: [els.length], tag: 'counted-elements', message: 'That is the number of different elements. Count every atom.' }],
      })
    }
    const el = rng.pick(els)
    return num({
      prompt: `How many ${nameOf(el)} atoms are there in one ${c.formula} (${c.name})?`,
      answer: counts[el] ?? 0,
      suffix: 'atoms',
      hint: 'The small number AFTER a symbol tells you how many of that atom. No number means one.',
      explanation: `In ${c.formula} there ${counts[el] === 1 ? 'is 1 atom' : `are ${counts[el]} atoms`} of ${nameOf(el)} (${el}).`,
    })
  }),

  G('chem.atoms.compounds.which-elements', 'chem.atoms.compounds', [1, 3], (rng) => {
    const c = rng.pick(SIMPLE.filter((x) => elementsIn(x.formula).length >= 2))
    const els = elementsIn(c.formula)
    const correct = cap(listNames(els.map(nameOf)))
    // Distractors: swap one element for a look-alike, or drop/add one.
    const swaps: Record<string, string> = { C: 'Ca', Ca: 'C', Cu: 'C', Co: 'Cu', S: 'Na', Na: 'N', N: 'Na', O: 'Os', Cl: 'C', H: 'He', K: 'P', Mg: 'Mn', Zn: 'Sn', Fe: 'F', Al: 'Ag' }
    const wrongs = new Set<string>()
    for (const e of els) {
      const sw = swaps[e]
      if (sw && BY_SYMBOL[sw] && !els.includes(sw)) wrongs.add(listNames(els.map((x) => (x === e ? sw : x)).map(nameOf)))
    }
    wrongs.add(listNames(els.slice(0, -1).map(nameOf)))
    wrongs.add(listNames([...els, els.includes('H') ? 'N' : 'H'].map(nameOf)))
    return choice({
      rng,
      prompt: `Which elements are in ${c.formula}?`,
      correct,
      wrong: [...wrongs].map(cap).filter((w) => w !== correct).slice(0, 3),
      hint: 'Split the formula into symbols: each starts with a capital letter.',
      explanation: `${c.formula} (${c.name}) contains ${correct.charAt(0).toLowerCase() + correct.slice(1)}.`,
    })
  }),

  G('chem.atoms.compounds.formula-name', 'chem.atoms.compounds', [2, 4], (rng, d) => {
    const pool = SIMPLE.filter((x) => elementsIn(x.formula).length >= 2 && !['H_{2}O', 'NH_{3}', 'CH_{4}', 'C_{6}H_{12}O_{6}', 'H_{2}O_{2}', 'H_{2}SO_{4}', 'HNO_{3}', 'HCl'].includes(x.formula))
    const pick = rng.shuffle(pool).slice(0, d >= 4 ? 5 : 4)
    return matchItem({
      prompt: 'Match each formula to the name of the compound.',
      pairs: pick.map((c) => ({ left: c.formula, right: cap(c.name) })),
      hint: 'Name the metal first, then the non-metal part: -ide for two elements, -ate when oxygen is there as well.',
      explanation: pick.map((c) => `${c.formula} = ${c.name}`).join(', '),
    })
  }),

  G('chem.atoms.compounds.naming', 'chem.atoms.compounds', [2, 5], (rng, d) => {
    // Naming a two-element compound: metal + non-metal-ide.
    const metals = ['sodium', 'potassium', 'magnesium', 'calcium', 'zinc', 'copper', 'iron', 'lithium', 'aluminium']
    const ides: [string, string, string][] = [
      ['oxygen', 'oxide', ''],
      ['chlorine', 'chloride', 'chlorate'],
      ['sulfur', 'sulfide', 'sulfate'],
      ['bromine', 'bromide', 'bromate'],
      ['iodine', 'iodide', 'iodate'],
    ]
    const m = rng.pick(metals)
    const [nm, ide, ate] = rng.pick(ides)
    const correct = `${m} ${ide}`
    const ateWrong =
      nm === 'oxygen'
        ? { label: cap(`${m} hydroxide`), misconception: 'hydroxide-for-oxide', feedback: 'A hydroxide contains hydrogen as well as oxygen. With only the metal and oxygen it is an oxide.' }
        : { label: cap(`${m} ${ate}`), misconception: 'ate-for-ide', feedback: '-ate means oxygen is also present. With only two elements the ending is -ide.' }
    if (d <= 3) {
      return choice({
        rng,
        prompt: `A compound is made only of ${m} and ${nm}. What is it called?`,
        correct: cap(correct),
        wrong: [
          { label: cap(`${m} ${nm}`), misconception: 'no-ide', feedback: `The non-metal's name changes its ending to -ide: ${nm} becomes ${ide}.` },
          ateWrong,
          { label: cap(`${ide} ${m}`), misconception: 'metal-second', feedback: 'The metal is named first.' },
        ],
        hint: 'The metal keeps its name and comes first. The non-metal changes its ending.',
        explanation: `${cap(m)} + ${nm} → ${correct}. With just two elements, the non-metal ends in -ide.`,
      })
    }
    const ates: [string, string, string][] = [
      ['carbon and oxygen', 'carbonate', 'carbide'],
      ['sulfur and oxygen', 'sulfate', 'sulfide'],
      ['nitrogen and oxygen', 'nitrate', 'nitride'],
    ]
    const [parts, ateName, ideName] = rng.pick(ates)
    const m2 = rng.pick(['sodium', 'potassium', 'magnesium', 'calcium', 'zinc', 'copper'])
    return choice({
      rng,
      prompt: `A compound contains ${m2}, ${parts}. What is it most likely to be called?`,
      correct: cap(`${m2} ${ateName}`),
      wrong: [
        { label: cap(`${m2} ${ideName}`), misconception: 'ide-for-ate', feedback: '-ide is for compounds of just two elements. Here there are three, including oxygen.' },
        { label: cap(`${m2} oxide`), misconception: 'oxide-for-ate', feedback: 'An oxide contains only the metal and oxygen.' },
        { label: cap(`${ateName} ${m2}`), misconception: 'metal-second', feedback: 'The metal is named first.' },
      ],
      hint: 'Three elements, one of them oxygen: the ending is not -ide.',
      explanation: `A metal + another non-metal + oxygen usually gives an -ate name: ${m2} ${ateName}.`,
    })
  }),
]

const compounds: Bank = {
  skill: 'chem.atoms.compounds',
  mcqs: [
    {
      q: 'What does the small 2 in CO_{2} tell you?',
      a: 'There are two oxygen atoms for each carbon atom',
      wrong: [
        { label: 'There are two carbon atoms', misconception: 'subscript-before', feedback: 'A small number applies to the symbol just BEFORE it, which is O.' },
        { label: 'There are two molecules of carbon dioxide', misconception: 'subscript-molecules', feedback: 'A big number in front (2CO_{2}) would mean two molecules. The small one counts atoms.' },
        'The molecule has two elements',
      ],
      hint: 'A small number belongs to the symbol right before it.',
      why: 'In a formula, a small (subscript) number tells you how many of the atom just before it. CO_{2} has one carbon atom and two oxygen atoms.',
      lv: [1, 3],
    },
    {
      q: 'What is the difference between 2H and H_{2}?',
      a: '2H is two separate hydrogen atoms; H_{2} is one molecule made of two hydrogen atoms joined',
      wrong: [
        { label: 'There is no difference', misconception: 'coefficient-subscript', feedback: 'Both have two atoms, but in H_{2} they are joined as a molecule.' },
        '2H is a molecule; H_{2} is two separate atoms',
        'H_{2} has two molecules, 2H has one',
      ],
      hint: 'A big number in front counts separate particles; a small number counts atoms joined inside one particle.',
      why: 'A big number in front tells you how many separate particles; a small number after a symbol tells you how many atoms are joined in one particle.',
      lv: [3, 5],
    },
    {
      q: 'What is the chemical formula of water?',
      a: 'H_{2}O',
      wrong: [{ label: 'HO_{2}', misconception: 'subscript-wrong-atom', feedback: 'That would be one hydrogen and two oxygens. Water has two hydrogens and one oxygen.' }, 'H_{2}O_{2}', 'H2O'],
      hint: 'Two hydrogen atoms, one oxygen atom.',
      why: 'Water molecules are made of two hydrogen atoms joined to one oxygen atom: H_{2}O. (H_{2}O_{2} is hydrogen peroxide, a different compound.)',
      lv: [1, 2],
    },
  ],
}

// =====================================================================================================================
// Relative formula mass
// =====================================================================================================================

const RFM_POOL = COMPOUNDS.filter((c) => {
  const els = elementsIn(c.formula)
  return els.every((e) => BY_SYMBOL[e])
})

const arTable = (f: string) => table(['Element', 'Symbol', 'Relative atomic mass (A_{r})'], elementsIn(f).map((e) => [cap(nameOf(e)), e, String(BY_SYMBOL[e]?.ar ?? '')]))

const formulaMassGenerators: ItemGenerator[] = [
  G('chem.atoms.formula-mass.calc', 'chem.atoms.formula-mass', [2, 5], (rng, d) => {
    const pool =
      d <= 2
        ? RFM_POOL.filter((c) => totalAtoms(c.formula) <= 3 && !c.formula.includes('Cl') && !c.formula.includes('Cu'))
        : d === 3
          ? RFM_POOL.filter((c) => totalAtoms(c.formula) <= 5 && !c.formula.includes('('))
          : d === 4
            ? RFM_POOL.filter((c) => totalAtoms(c.formula) >= 4 && !c.formula.includes('('))
            : RFM_POOL.filter((c) => c.formula.includes('(') || totalAtoms(c.formula) >= 7)
    const c = rng.pick(pool)
    const counts = parseFormula(c.formula)
    const els = Object.keys(counts)
    const mr = rfm(c.formula)
    const naive = els.reduce((s, e) => s + (BY_SYMBOL[e]?.ar ?? 0), 0)
    const working = els.map((e) => ((counts[e] ?? 1) > 1 ? `(${counts[e]} × ${BY_SYMBOL[e]?.ar})` : String(BY_SYMBOL[e]?.ar))).join(' + ')
    return num({
      prompt: `Calculate the relative formula mass (M_{r}) of ${c.name}, ${c.formula}. Use the relative atomic masses in the table (standard rounded values).`,
      answer: mr,
      figure: arTable(c.formula),
      tolerance: 0.01,
      hint: 'Multiply each relative atomic mass by the number of those atoms in the formula, then add them all up.',
      explanation: `M_{r} of ${c.formula} = ${working} = ${fmt(mr, 1)}. Relative formula mass has no units.`,
      errors: [{ values: [Math.round(naive * 10) / 10], tag: 'ignored-subscripts', message: 'You have added each element once. Multiply by the small numbers: how many of each atom are there?' }],
    })
  }),

  G('chem.atoms.formula-mass.compare', 'chem.atoms.formula-mass', [3, 5], (rng) => {
    const four = rng.shuffle(RFM_POOL.filter((c) => totalAtoms(c.formula) <= 7)).slice(0, 4)
    const masses = four.map((c) => rfm(c.formula))
    if (new Set(masses).size < 4) {
      // Ties make "largest" ambiguous; fall back to a fixed, tie-free set.
      four.splice(0, 4, ...(['H_{2}O', 'CO_{2}', 'CaCO_{3}', 'NaOH'].map((f) => RFM_POOL.find((c) => c.formula === f)).filter(Boolean) as Compound[]))
    }
    const best = four.reduce((a, b) => (rfm(b.formula) > rfm(a.formula) ? b : a))
    const allEls = [...new Set(four.flatMap((c) => elementsIn(c.formula)))]
    return choice({
      rng,
      prompt: 'Which of these has the largest relative formula mass? Use the relative atomic masses in the table.',
      correct: best.formula,
      wrong: four.filter((c) => c !== best).map((c) => ({ label: c.formula, misconception: 'rfm-compare', feedback: `M_{r} of ${c.formula} = ${fmt(rfm(c.formula), 1)}, but M_{r} of ${best.formula} = ${fmt(rfm(best.formula), 1)}.` })),
      figure: table(['Element', 'A_{r}'], allEls.map((e) => [e, String(BY_SYMBOL[e]?.ar ?? '')])),
      hint: 'Work out each M_{r}. More atoms does not always mean heavier: it depends which atoms.',
      explanation: four.map((c) => `${c.formula} = ${fmt(rfm(c.formula), 1)}`).join('; ') + `. The largest is ${best.formula}.`,
    })
  }),
]

const formulaMass: Bank = {
  skill: 'chem.atoms.formula-mass',
  mcqs: [
    {
      q: 'What is the relative atomic mass (A_{r}) of an element?',
      a: 'The mass of one of its atoms compared with the mass of other atoms (a carbon atom is 12)',
      wrong: [
        { label: 'The number of protons in one atom', misconception: 'ar-is-z', feedback: 'That is the atomic number. Relative atomic mass also counts the neutrons (and averages over isotopes).' },
        'The mass of the element in grams',
        'The number of atoms in a molecule',
      ],
      hint: 'The word "relative" means "compared with".',
      why: 'Relative atomic mass compares the mass of an atom with other atoms, on a scale where carbon-12 is exactly 12. It has no units.',
      lv: [2, 4],
    },
    {
      q: 'Why does relative formula mass (M_{r}) have no units?',
      a: 'It compares masses with each other, so it is a ratio rather than a mass in grams',
      wrong: ['Because it is always a whole number', { label: 'It is measured in grams, but we leave the g off', misconception: 'mr-grams', feedback: 'M_{r} is a comparison, not an actual mass in grams.' }, 'Because atoms have no mass'],
      hint: 'Think about the word "relative".',
      why: 'M_{r} tells you how heavy a particle is compared with others. A comparison (ratio) has no units.',
      lv: [4, 5],
    },
  ],
}

// =====================================================================================================================
// Inside the atom
// =====================================================================================================================

const SMALL = ELEMENTS.filter((e) => e.z <= 20)

const structure: Bank = {
  skill: 'chem.atoms.structure',
  noun: 'term',
  meaningPrompt: (t) => `Which description fits the ${t.toLowerCase()}?`,
  matchPrompt: 'Match each part of the atom to its description.',
  terms: [
    { term: 'Proton', def: 'In the nucleus, with a positive charge and a relative mass of 1' },
    { term: 'Neutron', def: 'In the nucleus, with no charge and a relative mass of 1' },
    { term: 'Electron', def: 'Moves around the nucleus in shells, with a negative charge and a very small mass' },
    { term: 'Nucleus', def: 'The tiny centre of the atom, containing protons and neutrons' },
    { term: 'Atomic number', def: 'The number of protons in an atom' },
    { term: 'Mass number', def: 'The total number of protons and neutrons in an atom' },
  ],
  mcqs: [
    {
      q: 'An atom has the same number of protons and electrons. What is its overall charge?',
      a: 'No overall charge (neutral)',
      wrong: [{ label: 'Positive', misconception: 'atom-positive', feedback: 'The positive protons are balanced by the same number of negative electrons.' }, 'Negative', 'It depends on the number of neutrons'],
      hint: 'Each proton is +1, each electron is −1.',
      why: 'The charges cancel out: equal numbers of +1 protons and −1 electrons give an overall charge of zero.',
      lv: [2, 4],
    },
    {
      q: 'Rutherford fired alpha particles at thin gold foil. Most went straight through, but a very few bounced back. What did this show?',
      a: 'An atom is mostly empty space, with a tiny, dense, positive nucleus',
      wrong: [
        { label: 'Atoms are solid spheres that cannot be divided', misconception: 'dalton-model', feedback: 'If atoms were solid, the particles could not pass straight through.' },
        { label: 'Atoms are a ball of positive charge with electrons dotted through it', misconception: 'plum-pudding', feedback: 'That plum pudding model was what the experiment overturned: it could not explain particles bouncing back.' },
        'Gold atoms are bigger than other atoms',
      ],
      hint: 'Why would most particles pass straight through, but a few bounce right back?',
      why: 'Most alpha particles passed through because the atom is mostly empty space. The few that bounced back had hit a tiny, concentrated, positive centre: the nucleus.',
      lv: [4, 5],
    },
    {
      q: 'Atoms of the same element always have the same number of which particle?',
      a: 'Protons',
      wrong: [{ label: 'Neutrons', misconception: 'same-neutrons', feedback: 'Atoms of one element can have different numbers of neutrons (these are called isotopes).' }, 'Nuclei', 'Shells'],
      hint: 'Which number decides what the element is?',
      why: 'The number of protons (the atomic number) decides which element an atom is. Change it and you have a different element.',
      lv: [3, 5],
    },
  ],
  orders: [
    {
      prompt: 'Put these ideas about the atom in the order they were put forward.',
      steps: [
        'Dalton: atoms are tiny solid spheres that cannot be divided',
        'Thomson: atoms contain electrons, dotted in a ball of positive charge (plum pudding model)',
        'Rutherford: atoms have a tiny positive nucleus, and are mostly empty space',
        'Bohr: electrons orbit the nucleus in fixed shells',
        'Chadwick: the nucleus also contains neutrons',
      ],
      direction: ['earliest', 'latest'],
      hint: 'Each model was built on the discovery before it. The neutron came last.',
      why: 'Dalton (early 1800s), Thomson discovered the electron (1897), Rutherford\'s gold foil experiment led to the nuclear model (1911), Bohr added shells (1913), Chadwick discovered the neutron (1932).',
      lv: [3, 5],
    },
  ],
}

const structureGenerators: ItemGenerator[] = [
  G('chem.atoms.structure.count', 'chem.atoms.structure', [2, 5], (rng, d) => {
    const e = rng.pick(SMALL)
    const n = e.mass - e.z
    const what = d <= 2 ? rng.pick(['protons', 'electrons'] as const) : d === 3 ? rng.pick(['protons', 'electrons', 'neutrons'] as const) : 'neutrons'
    const fig = table(['Element', 'Atomic number', 'Mass number'], [[`${cap(e.name)} (${e.symbol})`, String(e.z), String(e.mass)]])
    const answer = what === 'neutrons' ? n : e.z
    return num({
      prompt: `How many ${what} are there in this atom of ${e.name}?`,
      answer,
      figure: fig,
      hint: what === 'neutrons' ? 'Mass number = protons + neutrons.' : what === 'protons' ? 'Which number counts the protons?' : 'An atom is neutral, so its negative charges balance its positive ones.',
      explanation:
        what === 'neutrons'
          ? `Neutrons = mass number − atomic number = ${e.mass} − ${e.z} = ${n}.`
          : what === 'protons'
            ? `The atomic number is the number of protons: ${e.z}.`
            : `The atom is neutral, so electrons = protons = atomic number = ${e.z}.`,
      errors: what === 'neutrons' ? [{ values: [e.mass], tag: 'neutrons-mass-number', message: 'The mass number counts protons AND neutrons. Subtract the protons.' }, { values: [e.mass + e.z], tag: 'added', message: 'Subtract the atomic number from the mass number.' }] : [],
    })
  }),

  G('chem.atoms.structure.shells', 'chem.atoms.structure', [5, 5], (rng) => {
    const e = rng.pick(SMALL.filter((x) => x.z >= 3))
    const shells: number[] = []
    let left = e.z
    for (const cap8 of [2, 8, 8, 2]) {
      if (left <= 0) break
      shells.push(Math.min(cap8, left))
      left -= Math.min(cap8, left)
    }
    const outer = shells[shells.length - 1] ?? 0
    const group = e.group
    const correct = group === 0 ? 'Group 0' : `Group ${outer}`
    const others = rng
      .shuffle(['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5', 'Group 6', 'Group 7', 'Group 0'].filter((g) => g !== correct && g !== `Group ${shells.length}`))
      .slice(0, 2)
    return choice({
      rng,
      prompt: `An atom has the electron arrangement ${shells.join(', ')}. Which group of the periodic table is it in?`,
      correct,
      wrong: [
        { label: `Group ${shells.length}`, misconception: 'shells-are-group', feedback: 'The number of shells gives the PERIOD (row), not the group.' },
        ...others.map((g) => ({ label: g, misconception: 'shell-group', feedback: 'The group number is the number of electrons in the outer shell (a full outer shell means group 0).' })),
      ],
      hint: 'Look at the last number: the outer shell.',
      explanation: `The outer shell has ${outer} electron${outer === 1 ? '' : 's'}, so it is in ${correct.toLowerCase()} (it is ${e.name}). It has ${shells.length} shells, so it is in period ${shells.length}.`,
    })
  }),
]

export const atomsGenerators: ItemGenerator[] = [
  ...bankGenerators(elements),
  ...symbolGenerators,
  ...ecmClassify,
  ...particleClassify,
  ...bankGenerators(mixtures),
  ...compoundGenerators,
  ...bankGenerators(compounds),
  ...formulaMassGenerators,
  ...bankGenerators(formulaMass),
  ...bankGenerators(structure),
  ...structureGenerators,
]
