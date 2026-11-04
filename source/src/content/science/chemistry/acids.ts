import type { ItemGenerator } from '@/engine/registry'
import { choice, textItem } from '../../kit'
import { bankGenerators, cap, classifyGenerators, G, num, table, type Bank } from './factory'

// =====================================================================================================================
// Acids, alkalis and pH
// =====================================================================================================================

const MEANS_PH: Record<string, string> = {
  Acidic: 'pH below 7.',
  Neutral: 'pH exactly 7.',
  Alkaline: 'pH above 7.',
}

const everydayClassify = classifyGenerators('chem.acids.ph', {
  id: 'everyday',
  categories: ['Acidic', 'Neutral', 'Alkaline'],
  items: [
    ['lemon juice', 'Acidic'],
    ['vinegar', 'Acidic'],
    ['stomach acid', 'Acidic'],
    ['cola', 'Acidic'],
    ['dilute hydrochloric acid', 'Acidic'],
    ['pure water', 'Neutral'],
    ['salt (sodium chloride) solution', 'Neutral'],
    ['sugar solution', 'Neutral'],
    ['oven cleaner', 'Alkaline'],
    ['soap solution', 'Alkaline'],
    ['sodium hydroxide solution', 'Alkaline'],
    ['bicarbonate of soda solution', 'Alkaline'],
    ['household bleach', 'Alkaline'],
  ],
  ask: (x) => `Is ${x} acidic, neutral or alkaline?`,
  hint: 'Sour-tasting foods are usually acids. Many cleaning products are alkalis.',
  means: MEANS_PH,
  sortPrompt: 'Match each substance to the right category.',
})

/** Universal indicator: colour band, what it shows, and a pH typical of that band. */
const UI_BANDS: { colour: string; meaning: string; ph: number[] }[] = [
  { colour: 'Red', meaning: 'Strongly acidic', ph: [0, 1, 2] },
  { colour: 'Orange or yellow', meaning: 'Weakly acidic', ph: [4, 5, 6] },
  { colour: 'Green', meaning: 'Neutral', ph: [7] },
  { colour: 'Blue', meaning: 'Weakly alkaline', ph: [9, 10] },
  { colour: 'Purple', meaning: 'Strongly alkaline', ph: [13, 14] },
]

const ph: Bank = {
  skill: 'chem.acids.ph',
  terms: [
    { term: 'Acid', def: 'A substance that forms a solution with a pH below 7' },
    { term: 'Alkali', def: 'A base that dissolves in water, forming a solution with a pH above 7' },
    { term: 'Base', def: 'A substance that neutralises an acid' },
    { term: 'Indicator', def: 'A substance that changes colour depending on whether a solution is acidic or alkaline' },
    { term: 'pH scale', def: 'A scale from 0 to 14 that shows how acidic or alkaline a solution is' },
    { term: 'Neutral', def: 'Neither acidic nor alkaline: pH 7' },
  ],
  links: [
    {
      prompt: 'Match each universal indicator colour to what it shows.',
      pairs: UI_BANDS.map((b) => [b.colour, b.meaning] as [string, string]),
      hint: 'The colours run like a rainbow: red at the acid end, purple at the alkali end, green in the middle.',
      ask: (l) => `Universal indicator turns ${l.toLowerCase()} in a solution. What does this show?`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'What colour does an acid turn blue litmus paper?',
      a: 'Red',
      wrong: [{ label: 'It stays blue', misconception: 'litmus-swap', feedback: 'Blue litmus stays blue in an ALKALI. Acids turn it red.' }, 'Green', 'Purple'],
      hint: 'Litmus has only two colours.',
      why: 'Acids turn blue litmus red. Alkalis turn red litmus blue. Neutral solutions do not change the colour of either.',
      lv: [1, 3],
    },
    {
      q: 'What colour does an alkali turn red litmus paper?',
      a: 'Blue',
      wrong: [{ label: 'It stays red', misconception: 'litmus-swap', feedback: 'Red litmus stays red in an ACID. Alkalis turn it blue.' }, 'Green', 'Yellow'],
      hint: 'Litmus has only two colours.',
      why: 'Alkalis turn red litmus blue. Acids turn blue litmus red.',
      lv: [1, 3],
    },
    {
      q: 'Why is universal indicator more useful than litmus?',
      a: 'It shows how strongly acidic or alkaline a solution is, not just whether it is an acid or an alkali',
      wrong: [{ label: 'It is the only indicator that works on alkalis', misconception: 'litmus-acid-only', feedback: 'Litmus works on both acids and alkalis, but only shows which one.' }, 'It never changes colour', 'It makes the solution neutral'],
      hint: 'Litmus has two colours; universal indicator has many.',
      why: 'Universal indicator is a mixture of indicators that gives a range of colours, so you can estimate the pH, not just say acid or alkali.',
      lv: [2, 4],
    },
    {
      q: 'What is the difference between a concentrated acid and a dilute acid?',
      a: 'A concentrated acid has more acid particles in the same volume of water',
      wrong: [
        { label: 'A concentrated acid is always a strong acid', misconception: 'concentrated-strong', feedback: 'Concentration is about how much acid is in the water. Strength is a different idea.' },
        'A dilute acid is hotter',
        'A dilute acid is a different chemical',
      ],
      hint: 'Diluting means adding more water.',
      why: 'Concentration is how much of a substance is dissolved in a given volume. A dilute acid has fewer acid particles in the same volume, so it is less hazardous.',
      lv: [3, 5],
    },
    {
      q: 'Which of these is a base but NOT an alkali?',
      a: 'Copper oxide, because it neutralises acids but does not dissolve in water',
      wrong: [
        { label: 'Sodium hydroxide, because it dissolves in water', misconception: 'alkali-not-base', feedback: 'Sodium hydroxide dissolves in water, so it IS an alkali (alkalis are soluble bases).' },
        'Hydrochloric acid, because it is in the lab',
        'Water, because it is neutral',
      ],
      hint: 'All alkalis are bases, but only bases that dissolve in water are alkalis.',
      why: 'A base is anything that neutralises an acid. An alkali is a base that dissolves in water. Copper oxide is insoluble, so it is a base but not an alkali.',
      lv: [4, 5],
    },
  ],
}

const phGenerators: ItemGenerator[] = [
  G('chem.acids.ph.value', 'chem.acids.ph', [1, 4], (rng, d) => {
    if (d <= 2) {
      const v = rng.pick([1, 2, 3, 4, 5, 6, 7, 7, 8, 9, 10, 11, 12, 13])
      const cat = v < 7 ? 'Acidic' : v === 7 ? 'Neutral' : 'Alkaline'
      return choice({
        rng,
        prompt: `A solution has a pH of ${v}. Is it acidic, neutral or alkaline?`,
        correct: cat,
        wrong: ['Acidic', 'Neutral', 'Alkaline'].filter((x) => x !== cat).map((x) => ({ label: x, misconception: 'ph-scale', feedback: 'Below 7 is acidic, 7 is neutral, above 7 is alkaline.' })),
        keepOrder: true,
        hint: 'The middle of the pH scale (7) is neutral.',
        explanation: `pH ${v} is ${v < 7 ? 'below' : v === 7 ? 'exactly' : 'above'} 7, so the solution is ${cat.toLowerCase()}.`,
      })
    }
    const vals = rng.shuffle([1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13]).slice(0, 4)
    // Only ask for "the most alkaline" when one of them is alkaline (and likewise for acidic).
    const canAcid = vals.some((v) => v < 7)
    const canAlk = vals.some((v) => v > 7)
    const wantAcid = canAcid && canAlk ? rng.chance(0.5) : canAcid
    const target = wantAcid ? Math.min(...vals) : Math.max(...vals)
    const word = wantAcid ? 'the most acidic' : 'the most alkaline'
    return choice({
      rng,
      prompt: `Four solutions have these pH values. Which is ${word}?`,
      correct: `pH ${target}`,
      wrong: vals.filter((v) => v !== target).map((v) => ({ label: `pH ${v}`, misconception: 'ph-direction', feedback: wantAcid ? 'The LOWER the pH, the more acidic.' : 'The HIGHER the pH, the more alkaline.' })),
      hint: 'Acids are at the low end of the pH scale; alkalis at the high end.',
      explanation: `The ${wantAcid ? 'lowest' : 'highest'} pH is ${target}, so that solution is ${word}.`,
    })
  }),
  G('chem.acids.ph.indicator', 'chem.acids.ph', [2, 4], (rng, d) => {
    const b = rng.pick(UI_BANDS)
    const v = rng.pick(b.ph)
    if (d <= 3) {
      return choice({
        rng,
        prompt: `A solution has a pH of ${v}. What colour will it turn universal indicator?`,
        correct: b.colour,
        wrong: UI_BANDS.filter((x) => x !== b).map((x) => ({ label: x.colour, misconception: 'ui-colour', feedback: `${x.colour} shows a ${x.meaning.toLowerCase()} solution.` })),
        hint: 'Red at pH 0, green at 7, purple at 14, with the rainbow in between.',
        explanation: `pH ${v} is ${b.meaning.toLowerCase()}, so universal indicator turns ${b.colour.toLowerCase()}.`,
      })
    }
    return choice({
      rng,
      prompt: `Universal indicator turns ${b.colour.toLowerCase()} in a solution. Which pH is it most likely to have?`,
      correct: `pH ${v}`,
      wrong: UI_BANDS.filter((x) => x !== b).map((x) => ({ label: `pH ${x.ph[Math.floor(x.ph.length / 2)]}`, misconception: 'ui-colour', feedback: `That pH would give ${x.colour.toLowerCase()}.` })),
      hint: 'Red at pH 0, green at 7, purple at 14, with the rainbow in between.',
      explanation: `${b.colour} shows a ${b.meaning.toLowerCase()} solution, so pH ${v} fits.`,
    })
  }),
]

// =====================================================================================================================
// Neutralisation
// =====================================================================================================================

const neutralisation: Bank = {
  skill: 'chem.acids.neutralisation',
  mcqs: [
    {
      q: 'What are the products when an acid reacts with an alkali?',
      a: 'A salt and water',
      wrong: [{ label: 'A salt and hydrogen', misconception: 'alkali-hydrogen', feedback: 'Hydrogen is made when an acid reacts with a METAL.' }, 'Only water', 'An acid and a base'],
      hint: 'acid + alkali → ? + ?',
      why: 'acid + alkali → salt + water. This is neutralisation.',
      lv: [1, 3],
    },
    {
      q: 'Indigestion tablets help a person with too much stomach acid. How?',
      a: 'They contain a base that neutralises some of the acid',
      wrong: [{ label: 'They contain more acid to cancel it out', misconception: 'acid-cancels-acid', feedback: 'Adding acid would make it worse. A base is needed.' }, 'They make the stomach produce more acid', 'They absorb all the water in the stomach'],
      hint: 'What reacts with an acid to make it less acidic?',
      why: 'Indigestion remedies contain bases such as magnesium hydroxide or calcium carbonate, which neutralise excess stomach acid.',
      lv: [1, 3],
    },
    {
      q: 'A farmer finds that a field\'s soil is too acidic for crops. What could the farmer spread on it?',
      a: 'Lime (calcium hydroxide or calcium carbonate), which neutralises the acid',
      wrong: [{ label: 'Vinegar', misconception: 'acid-for-acid', feedback: 'Vinegar is an acid; it would make the soil more acidic.' }, 'Salt', 'Sugar'],
      hint: 'The farmer needs a base.',
      why: 'Lime is a base, so it neutralises the acid in the soil and raises the pH.',
      lv: [2, 4],
    },
    {
      q: 'An alkali is slowly added to an acid that contains universal indicator. What happens to the pH?',
      a: 'It rises towards 7 and then above 7 if too much alkali is added',
      wrong: [{ label: 'It falls towards 0', misconception: 'ph-falls-with-alkali', feedback: 'Adding alkali makes the solution less acidic, so the pH goes UP.' }, 'It stays the same until the very end, then jumps to 14', 'It stays at 7 the whole time'],
      hint: 'Is the solution getting more or less acidic?',
      why: 'As the alkali neutralises the acid, the pH rises. It reaches 7 (neutral, green) when exactly the right amount has been added, then goes above 7 if you add more.',
      lv: [2, 4],
    },
    {
      q: 'What is a neutral solution\'s pH?',
      a: '7',
      wrong: [{ label: '0', misconception: 'neutral-zero', feedback: 'pH 0 is very strongly acidic. Neutral is in the middle of the scale.' }, '14', '1'],
      hint: 'It is the middle of the 0 to 14 scale.',
      why: 'A neutral solution has pH 7 and turns universal indicator green.',
      lv: [1, 2],
    },
  ],
  orders: [
    {
      prompt: 'Put the steps for neutralising 25 cm^{3} of hydrochloric acid with sodium hydroxide solution in order.',
      steps: [
        'Measure 25 cm^{3} of the acid into a conical flask with a measuring cylinder',
        'Add a few drops of universal indicator',
        'Add the sodium hydroxide a little at a time, swirling after each addition',
        'Stop when the indicator turns green',
        'Record the volume of sodium hydroxide added',
      ],
      direction: ['first', 'last'],
      hint: 'The indicator needs to be in before you start adding the alkali.',
      why: 'Measure the acid, add indicator, add alkali slowly while swirling, stop at green (pH 7), and record how much was needed.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'A student adds sodium hydroxide solution to hydrochloric acid until the universal indicator turns green. Describe what has happened, including the pH change and the products.',
      model:
        'The acid started with a low pH (red indicator). As the alkali was added it neutralised the acid and the pH rose. When the indicator turned green the pH was 7, so the solution was neutral. The reaction made a salt, sodium chloride, and water: sodium hydroxide + hydrochloric acid → sodium chloride + water.',
      checklist: ['Says the pH started low / acidic', 'Says the pH rose as alkali was added', 'Says green means pH 7 / neutral', 'Names the products as a salt (sodium chloride) and water'],
      hint: 'Start with the colour and pH of the acid.',
    },
  ],
}

const neutralisationGenerators: ItemGenerator[] = [
  G('chem.acids.neutralisation.ph-table', 'chem.acids.neutralisation', [3, 5], (rng, d) => {
    const vn = rng.pick([8, 10, 12, 14])
    const vols = Array.from({ length: 11 }, (_, i) => i * 2)
    const phAt = (v: number) => (v < vn - 4 ? 1 : v === vn - 4 ? 2 : v === vn - 2 ? 3 : v === vn ? 7 : v === vn + 2 ? 11 : v === vn + 4 ? 12 : 13)
    const fig = table(['Volume of alkali added (cm^{3})', 'pH'], vols.map((v) => [v, phAt(v)]))
    if (d <= 4) {
      return num({
        prompt: 'An alkali was added to 25 cm^{3} of an acid and the pH was measured. What volume of alkali exactly neutralised the acid? Give your answer in cm^{3}.',
        answer: vn,
        suffix: 'cm^{3}',
        figure: fig,
        hint: 'What pH is neutral?',
        explanation: `The pH is 7 (neutral) after ${vn} cm^{3} of alkali, so that volume exactly neutralised the acid. After that, extra alkali makes the solution alkaline.`,
        errors: [{ values: [20], tag: 'last-reading', message: 'That is the last reading, when there is far too much alkali. Look for pH 7.' }],
      })
    }
    const v = rng.pick(vols.filter((x) => x !== vn))
    const p = phAt(v)
    const correct = p < 7 ? 'Acidic: there is not yet enough alkali to neutralise all the acid' : 'Alkaline: more alkali has been added than is needed to neutralise the acid'
    return choice({
      rng,
      prompt: `An alkali was added to an acid and the pH was measured. Describe the solution after ${v} cm^{3} of alkali had been added.`,
      correct,
      wrong: [
        p < 7 ? { label: 'Alkaline: more alkali has been added than is needed to neutralise the acid', misconception: 'ph-reading', feedback: `The pH at ${v} cm^{3} is ${p}, which is below 7.` } : { label: 'Acidic: there is not yet enough alkali to neutralise all the acid', misconception: 'ph-reading', feedback: `The pH at ${v} cm^{3} is ${p}, which is above 7.` },
        { label: 'Neutral: the acid and alkali have exactly cancelled out', misconception: 'ph-reading', feedback: `Neutral is pH 7, which is at ${vn} cm^{3}.` },
      ],
      figure: fig,
      hint: 'Read the pH at that volume and compare it with 7.',
      explanation: `At ${v} cm^{3} the pH is ${p}. ${p < 7 ? 'Below 7, so it is still acidic.' : 'Above 7, so it is now alkaline.'} It was exactly neutral at ${vn} cm^{3}.`,
    })
  }),
]

// =====================================================================================================================
// Making salts
// =====================================================================================================================

const ACIDS: { name: string; ending: string; other: string[] }[] = [
  { name: 'hydrochloric acid', ending: 'chloride', other: ['sulfate', 'nitrate'] },
  { name: 'sulfuric acid', ending: 'sulfate', other: ['chloride', 'nitrate'] },
  { name: 'nitric acid', ending: 'nitrate', other: ['chloride', 'sulfate'] },
]
/** -ide / -ate confusion distractor for each acid's salt. */
const CONFUSE: Record<string, { label: string; feedback: string }> = {
  chloride: { label: 'chlorate', feedback: 'Hydrochloric acid gives chlorides. (Chlorates contain oxygen too.)' },
  sulfate: { label: 'sulfide', feedback: 'Sulfuric acid gives sulfates. A sulfide contains only the metal and sulfur.' },
  nitrate: { label: 'nitride', feedback: 'Nitric acid gives nitrates. A nitride contains only the metal and nitrogen.' },
}

type ReactantKind = 'metal' | 'oxide' | 'hydroxide' | 'carbonate'
const SALT_REACTANTS: { name: string; metal: string; kind: ReactantKind }[] = [
  { name: 'magnesium', metal: 'magnesium', kind: 'metal' },
  { name: 'zinc', metal: 'zinc', kind: 'metal' },
  { name: 'iron', metal: 'iron', kind: 'metal' },
  { name: 'copper oxide', metal: 'copper', kind: 'oxide' },
  { name: 'magnesium oxide', metal: 'magnesium', kind: 'oxide' },
  { name: 'zinc oxide', metal: 'zinc', kind: 'oxide' },
  { name: 'sodium hydroxide', metal: 'sodium', kind: 'hydroxide' },
  { name: 'potassium hydroxide', metal: 'potassium', kind: 'hydroxide' },
  { name: 'calcium hydroxide', metal: 'calcium', kind: 'hydroxide' },
  { name: 'calcium carbonate', metal: 'calcium', kind: 'carbonate' },
  { name: 'copper carbonate', metal: 'copper', kind: 'carbonate' },
  { name: 'magnesium carbonate', metal: 'magnesium', kind: 'carbonate' },
  { name: 'sodium carbonate', metal: 'sodium', kind: 'carbonate' },
]

/** Nitric acid is left out with metals: it is an oxidising acid and does not reliably give hydrogen with them. */
const acidFor = (rng: import('@/engine/types').Rng, kind: ReactantKind) => rng.pick(kind === 'metal' ? ACIDS.filter((a) => a.ending !== 'nitrate') : ACIDS)

const OTHER_PRODUCTS: Record<ReactantKind, string> = {
  metal: 'hydrogen',
  oxide: 'water',
  hydroxide: 'water',
  carbonate: 'water + carbon dioxide',
}
const RULE: Record<ReactantKind, string> = {
  metal: 'acid + metal → salt + hydrogen',
  oxide: 'acid + metal oxide (a base) → salt + water',
  hydroxide: 'acid + metal hydroxide (an alkali) → salt + water',
  carbonate: 'acid + metal carbonate → salt + water + carbon dioxide',
}

const saltGenerators: ItemGenerator[] = [
  G('chem.acids.salts.name', 'chem.acids.salts', [1, 4], (rng, d) => {
    const pool = d <= 2 ? SALT_REACTANTS.filter((r) => r.kind !== 'carbonate') : SALT_REACTANTS
    const r = rng.pick(pool)
    const a = acidFor(rng, r.kind)
    const salt = `${r.metal} ${a.ending}`
    const conf = CONFUSE[a.ending]
    return choice({
      rng,
      prompt: `${cap(r.name)} reacts with ${a.name}. Which salt is made?`,
      correct: cap(salt),
      wrong: [
        ...a.other.slice(0, 2).map((o) => ({ label: cap(`${r.metal} ${o}`), misconception: 'salt-acid-ending', feedback: `${cap(o)}s come from ${ACIDS.find((x) => x.ending === o)?.name}. This is ${a.name}.` })),
        ...(conf ? [{ label: cap(`${r.metal} ${conf.label}`), misconception: 'salt-ide-ate', feedback: conf.feedback }] : []),
      ],
      hint: 'The first part of the name comes from the metal; the second part comes from the acid.',
      explanation: `The metal (${r.metal}) gives the first part and ${a.name} gives "${a.ending}", so the salt is ${salt}.`,
    })
  }),
  G('chem.acids.salts.other-products', 'chem.acids.salts', [2, 5], (rng) => {
    const r = rng.pick(SALT_REACTANTS)
    const a = acidFor(rng, r.kind)
    const salt = `${r.metal} ${a.ending}`
    const correct = `${salt} + ${OTHER_PRODUCTS[r.kind]}`
    const opts = [`${salt} + hydrogen`, `${salt} + water`, `${salt} + water + carbon dioxide`, `${salt} + oxygen`]
    return choice({
      rng,
      prompt: `Complete the word equation:\n${r.name} + ${a.name} → ?`,
      correct,
      wrong: opts
        .filter((o) => o !== correct)
        .map((o) => ({
          label: o,
          misconception: 'salt-other-product',
          feedback: o.endsWith('hydrogen') ? 'Hydrogen is made when an acid reacts with a METAL.' : o.endsWith('carbon dioxide') ? 'Carbon dioxide is made only when the acid reacts with a CARBONATE.' : o.endsWith('oxygen') ? 'Oxygen is not made when acids react.' : 'Water (and no other gas) is made when an acid reacts with a metal oxide or hydroxide.',
        })),
      hint: 'Is the reactant a metal, a metal oxide/hydroxide, or a metal carbonate?',
      explanation: `${cap(RULE[r.kind])}. So: ${r.name} + ${a.name} → ${correct}.`,
    })
  }),
  G('chem.acids.salts.type', 'chem.acids.salts', [3, 5], (rng) => {
    const r = rng.pick(SALT_REACTANTS)
    const a = acidFor(rng, r.kind)
    const salt = `${r.metal} ${a.ending}`
    const rest = OTHER_PRODUCTS[r.kind]
    return textItem({
      prompt: `Type the name of the salt to complete the word equation:\n${r.name} + ${a.name} → ______ + ${rest}`,
      accept: [salt, salt.replace('sulfate', 'sulphate')],
      placeholder: 'Name of salt',
      hint: 'Metal first, then the part that comes from the acid (chloride, sulfate or nitrate).',
      explanation: `${r.name} + ${a.name} → ${salt} + ${rest}.`,
    })
  }),
]

const salts: Bank = {
  skill: 'chem.acids.salts',
  links: [
    {
      prompt: 'Match each acid to the kind of salt it makes.',
      pairs: [
        ['Hydrochloric acid', 'Chlorides'],
        ['Sulfuric acid', 'Sulfates'],
        ['Nitric acid', 'Nitrates'],
      ],
      hint: 'Look at the first part of each acid\'s name.',
      ask: (l) => `Which kind of salt does ${l.toLowerCase()} make?`,
      lv: [1, 3],
    },
  ],
  mcqs: [
    {
      q: 'In chemistry, what is a salt?',
      a: 'A compound made when the hydrogen in an acid is replaced by a metal',
      wrong: [{ label: 'Only sodium chloride, the salt we eat', misconception: 'salt-only-nacl', feedback: 'Table salt is just one salt. Copper sulfate and potassium nitrate are salts too.' }, 'Any white powder', 'A substance with a pH of 14'],
      hint: 'Table salt is one example, but there are many others.',
      why: 'A salt forms when an acid reacts and its hydrogen is replaced by a metal (for example in neutralisation). Sodium chloride, copper sulfate and calcium nitrate are all salts.',
      lv: [2, 4],
    },
  ],
  orders: [
    {
      prompt: 'Put the steps for making copper sulfate crystals from copper oxide and sulfuric acid in order.',
      steps: [
        'Warm some dilute sulfuric acid in a beaker',
        'Add copper oxide a spatula at a time, stirring, until no more will react',
        'Filter to remove the excess copper oxide',
        'Heat the blue filtrate in an evaporating dish to evaporate some of the water',
        'Leave the solution to cool and crystallise',
      ],
      direction: ['first', 'last'],
      hint: 'Adding the base in excess makes sure all the acid is used up; then the extra must be removed.',
      why: 'Excess copper oxide uses up all the acid; filtering removes the unreacted copper oxide; evaporating and crystallising gets solid copper sulfate from the solution.',
      lv: [3, 5],
    },
  ],
}

export const acidsGenerators: ItemGenerator[] = [
  ...everydayClassify,
  ...bankGenerators(ph),
  ...phGenerators,
  ...bankGenerators(neutralisation),
  ...neutralisationGenerators,
  ...saltGenerators,
  ...bankGenerators(salts),
]
