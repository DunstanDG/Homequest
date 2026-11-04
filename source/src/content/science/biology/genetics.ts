import type { ItemGenerator } from '@/engine/registry'
import type { Figure } from '@/engine/types'
import { choice } from '../../kit'
import { bankGenerators, classifyGenerators, fmt, G, num, orderedChoice, type Bank } from './factory'

// =====================================================================================================================
// Genetics and evolution: variation, DNA, genes and chromosomes, natural selection, extinction and gene banks
// =====================================================================================================================

const variation: Bank = {
  skill: 'bio.gen.variation',
  terms: [
    { term: 'Variation', def: 'The differences between individuals' },
    { term: 'Species', def: 'A group of organisms that can breed with each other to produce fertile offspring' },
    { term: 'Inherited variation', def: 'Differences caused by the genes passed on from parents' },
    { term: 'Environmental variation', def: 'Differences caused by a person\'s surroundings, lifestyle or experiences' },
    { term: 'Continuous variation', def: 'Variation where a characteristic can have any value within a range, such as height' },
    { term: 'Discontinuous variation', def: 'Variation where a characteristic can only be one of a few separate groups, such as blood group' },
  ],
  mcqs: [
    {
      q: 'Identical twins have exactly the same genes. One twin is heavier than the other. What causes this difference?',
      a: 'The environment, such as diet and exercise',
      wrong: [
        { label: 'Their genes', misconception: 'twins-genes', feedback: 'Identical twins have the same genes, so a difference between them must be environmental.' },
        { label: 'Their blood group', misconception: 'twins-blood', feedback: 'Blood group does not affect body mass, and identical twins have the same blood group.' },
        { label: 'It cannot happen: identical twins always have the same mass', misconception: 'twins-identical-mass', feedback: 'Identical twins can differ in mass, scars, fitness and more, because their environments differ.' },
      ],
      hint: 'If their genes are the same, what else could be different?',
      why: 'Identical twins have the same genes, so differences between them, such as body mass, are caused by the environment: diet, exercise and lifestyle.',
      lv: [2, 4],
    },
    {
      q: 'A horse and a donkey can breed to produce a mule, but mules are almost always infertile (they cannot breed). What does this tell us?',
      a: 'Horses and donkeys are different species',
      wrong: [
        { label: 'Horses and donkeys are the same species', misconception: 'mule-same-species', feedback: 'Members of the same species produce fertile offspring. Mules are not fertile.' },
        { label: 'Mules are a new species', misconception: 'mule-new-species', feedback: 'Mules cannot breed with each other, so they cannot be a species.' },
        { label: 'Donkeys are a type of horse', misconception: 'donkey-horse', feedback: 'Because their offspring are infertile, they are different species.' },
      ],
      hint: 'Look at the definition of a species: what kind of offspring must they produce?',
      why: 'A species is a group that can breed together to produce fertile offspring. Horses and donkeys produce infertile mules, so they are different species.',
      lv: [3, 5],
    },
    {
      q: 'Which type of graph is best for showing continuous variation, such as the heights of everyone in a class?',
      a: 'A histogram (or a bar chart with grouped values, with no gaps between the bars)',
      wrong: [
        { label: 'A pie chart', misconception: 'pie-variation', feedback: 'Pie charts show parts of a whole, not a spread of measurements.' },
        { label: 'A bar chart with one bar for each pupil\'s name', misconception: 'bar-per-person', feedback: 'That would be very hard to read. Heights are grouped into ranges.' },
        { label: 'A table with no graph', misconception: 'no-graph', feedback: 'A graph shows the spread much more clearly.' },
      ],
      hint: 'The heights are grouped into ranges, like 140-149 cm, 150-159 cm.',
      why: 'For continuous data, the values are grouped into ranges and shown as a histogram, with no gaps between the bars. Discontinuous data, such as blood group, goes on an ordinary bar chart with gaps.',
      lv: [3, 5],
    },
  ],
}

const causeClassify = classifyGenerators('bio.gen.variation', {
  id: 'cause',
  categories: ['Inherited', 'Environmental', 'Both inherited and environmental'],
  items: [
    ['blood group', 'Inherited'],
    ['natural eye colour', 'Inherited'],
    ['natural hair colour', 'Inherited'],
    ['having a scar', 'Environmental'],
    ['the language a person speaks', 'Environmental'],
    ['dyed hair colour', 'Environmental'],
    ['having pierced ears', 'Environmental'],
    ['height', 'Both inherited and environmental'],
    ['body mass', 'Both inherited and environmental'],
  ],
  ask: (item) => `Think about the differences between people in this characteristic: ${item}. Are they inherited, environmental, or both?`,
  hint: 'Could you be born with it? Could your lifestyle or surroundings change it? Or both?',
  sortPrompt: 'Match each characteristic to the cause of its variation.',
  means: {
    Inherited: 'Inherited characteristics are controlled by the genes passed on from your parents.',
    Environmental: 'Environmental characteristics come from your surroundings, lifestyle or experiences.',
    'Both inherited and environmental': 'Genes set a range (for example how tall you could grow), but diet, health and lifestyle also have an effect.',
  },
})

const typeClassify = classifyGenerators('bio.gen.variation', {
  id: 'continuous',
  categories: ['Continuous', 'Discontinuous'],
  items: [
    ['height', 'Continuous'],
    ['body mass', 'Continuous'],
    ['hand span', 'Continuous'],
    ['the length of a leaf', 'Continuous'],
    ['arm length', 'Continuous'],
    ['blood group', 'Discontinuous'],
    ['whether a pea plant\'s seeds are round or wrinkled', 'Discontinuous'],
    ['the number of seeds in a pea pod', 'Discontinuous'],
  ],
  ask: (item) => `Is variation in ${item} continuous or discontinuous?`,
  hint: 'Continuous: it can be any value in a range and is measured. Discontinuous: it falls into separate groups or is counted.',
  means: {
    Continuous: 'Continuous variation can take any value within a range; you measure it.',
    Discontinuous: 'Discontinuous variation falls into separate groups, or is a whole number you count.',
  },
})

interface BloodSet {
  total: number
  counts: [number, number, number, number]
}
const BLOOD: BloodSet[] = [
  { total: 20, counts: [9, 7, 3, 1] },
  { total: 20, counts: [10, 6, 3, 1] },
  { total: 25, counts: [12, 9, 3, 1] },
  { total: 25, counts: [11, 10, 3, 1] },
  { total: 50, counts: [23, 19, 6, 2] },
  { total: 50, counts: [24, 18, 5, 3] },
]
const GROUPS = ['O', 'A', 'B', 'AB']

function variationGenerators(): ItemGenerator[] {
  return [
    G('bio.gen.variation.blood-chart', 'bio.gen.variation', [2, 4], (rng, d) => {
      const b = rng.pick(BLOOD)
      const figure: Figure = { type: 'bar-chart', bars: GROUPS.map((g, i) => ({ label: g, value: b.counts[i]! })), yLabel: 'Number of pupils', showValues: true }
      const i = rng.int(0, 3)
      if (d <= 2) {
        return num({
          prompt: `The bar chart shows the blood groups of ${b.total} pupils. How many pupils have blood group ${GROUPS[i]}?`,
          figure,
          answer: b.counts[i]!,
          hint: `Find the bar labelled ${GROUPS[i]} and read its height.`,
          explanation: `The bar for blood group ${GROUPS[i]} shows ${b.counts[i]} pupils. Blood group is an example of discontinuous variation, so it is shown on a bar chart with gaps.`,
        })
      }
      if (d === 3) {
        // Counts are listed largest first, so a lower index always has more pupils.
        const hi = rng.int(0, 2)
        const lo = rng.int(hi + 1, 3)
        const diff = b.counts[hi]! - b.counts[lo]!
        return num({
          prompt: `The bar chart shows the blood groups of ${b.total} pupils. How many more pupils have blood group ${GROUPS[hi]} than blood group ${GROUPS[lo]}?`,
          figure,
          answer: diff,
          hint: 'Read both bars, then subtract the smaller from the larger.',
          explanation: `${GROUPS[hi]}: ${b.counts[hi]}, ${GROUPS[lo]}: ${b.counts[lo]}. Difference = ${b.counts[hi]} - ${b.counts[lo]} = ${diff}.`,
          errors: [{ values: [b.counts[hi]! + b.counts[lo]!], tag: 'added', message: '"How many more" means find the difference: subtract.' }],
        })
      }
      const pct = (b.counts[i]! * 100) / b.total
      return num({
        prompt: `The bar chart shows the blood groups of ${b.total} pupils. What percentage of the pupils have blood group ${GROUPS[i]}?`,
        figure,
        answer: pct,
        suffix: '%',
        hint: 'Percentage = (number in that group ÷ total) × 100.',
        explanation: `${b.counts[i]} ÷ ${b.total} × 100 = ${pct}%.`,
        errors: [{ values: [b.counts[i]!], tag: 'count-not-percent', message: 'That is the number of pupils. Divide by the total and multiply by 100.' }],
      })
    }),
  ]
}

// ----------------------------------------------------------------------------------------------- DNA

const dna: Bank = {
  skill: 'bio.gen.dna',
  terms: [
    { term: 'DNA', def: 'The chemical that carries the genetic information (the instructions) in cells' },
    { term: 'Gene', def: 'A section of DNA that carries the instructions for a characteristic' },
    { term: 'Chromosome', def: 'A long, coiled strand of DNA, found in the nucleus' },
    { term: 'Double helix', def: 'The shape of a DNA molecule: two strands twisted around each other' },
    { term: 'Heredity', def: 'The passing on of characteristics from parents to their offspring' },
  ],
  orders: [
    {
      prompt: 'Put these in order of size, from smallest to largest.',
      steps: ['Gene', 'Chromosome', 'Nucleus', 'Cell'],
      direction: ['smallest', 'largest'],
      hint: 'A gene is a section of a chromosome. Where are chromosomes found?',
      why: 'A gene is a short section of DNA on a chromosome. Chromosomes are found in the nucleus, and the nucleus is inside the cell.',
      lv: [2, 4],
    },
  ],
  mcqs: [
    {
      q: 'Where in a cell are the chromosomes found?',
      a: 'In the nucleus',
      wrong: [
        { label: 'In the mitochondria', misconception: 'chromosomes-mitochondria', feedback: 'Mitochondria are where respiration happens. Chromosomes are in the nucleus.' },
        { label: 'In the cell membrane', misconception: 'chromosomes-membrane', feedback: 'The membrane controls what enters and leaves. Chromosomes are in the nucleus.' },
        { label: 'In the cell wall', misconception: 'chromosomes-wall', feedback: 'Only plant cells have a cell wall, and it is for support.' },
      ],
      hint: 'Which part of the cell controls its activities?',
      why: 'Chromosomes, made of DNA, are found in the nucleus. They carry the instructions that control the cell.',
      lv: [1, 3],
    },
    {
      q: 'How many chromosomes are there in a normal human body cell?',
      a: '46 (23 pairs)',
      wrong: [
        { label: '23', misconception: 'chromosomes-23', feedback: '23 is the number in a sperm or egg cell. Body cells have 23 pairs: 46.' },
        { label: '2', misconception: 'chromosomes-2', feedback: 'There are far more: 23 pairs.' },
        { label: '100', misconception: 'chromosomes-100', feedback: 'Human body cells have 46.' },
      ],
      order: ['2', '23', '46 (23 pairs)', '100'],
      hint: 'They come in pairs, one of each pair from each parent.',
      why: 'Human body cells have 46 chromosomes, in 23 pairs. One chromosome of each pair came from the mother and one from the father.',
      lv: [1, 3],
    },
    {
      q: 'How many chromosomes are there in a human sperm cell or egg cell?',
      a: '23',
      wrong: [
        { label: '46', misconception: 'gamete-46', feedback: 'Body cells have 46. Gametes have half as many: 23.' },
        { label: '92', misconception: 'gamete-92', feedback: 'Gametes have fewer chromosomes than body cells, not more.' },
        { label: '1', misconception: 'gamete-1', feedback: 'Gametes contain one chromosome from each pair: 23.' },
      ],
      order: ['1', '23', '46', '92'],
      hint: 'A gamete has one chromosome from each pair.',
      why: 'Sperm and egg cells have 23 chromosomes, one from each pair. When they join at fertilisation, the fertilised egg has 46.',
      lv: [2, 4],
    },
    {
      q: 'Why do children usually look a bit like both of their parents?',
      a: 'They inherit half of their chromosomes (and genes) from their mother and half from their father',
      wrong: [
        { label: 'They copy their parents\' habits as they grow up', misconception: 'look-copy', feedback: 'Habits are environmental. Looks such as eye colour come from genes.' },
        { label: 'They get all their genes from whichever parent they live with', misconception: 'genes-one-parent', feedback: 'Genes come from both parents, at fertilisation.' },
        { label: 'Their parents\' blood mixes with theirs before birth', misconception: 'blood-inheritance', feedback: 'Characteristics are passed on in the DNA of the sperm and egg, not in blood.' },
      ],
      hint: 'What does each gamete bring at fertilisation?',
      why: 'The egg carries 23 chromosomes from the mother and the sperm carries 23 from the father. The child has a mixture of genes from both, so shows some characteristics of each.',
      lv: [2, 4],
    },
    {
      q: 'In 1953, James Watson and Francis Crick worked out the structure of DNA. Whose X-ray photographs of DNA gave them vital evidence?',
      a: 'Rosalind Franklin',
      wrong: [
        { label: 'Charles Darwin', misconception: 'dna-darwin', feedback: 'Darwin explained evolution by natural selection, almost 100 years earlier.' },
        { label: 'Gregor Mendel', misconception: 'dna-mendel', feedback: 'Mendel studied inheritance in pea plants in the 1860s, long before DNA\'s structure was known.' },
        { label: 'Isaac Newton', misconception: 'dna-newton', feedback: 'Newton was a physicist, centuries earlier.' },
      ],
      hint: 'She was an expert in X-ray crystallography working in London.',
      why: 'Rosalind Franklin\'s X-ray images of DNA, along with work by Maurice Wilkins, helped Watson and Crick work out that DNA is a double helix.',
      lv: [3, 5],
    },
    {
      q: 'What shape did Watson and Crick show a DNA molecule has?',
      a: 'A double helix',
      wrong: [
        { label: 'A single straight line', misconception: 'dna-line', feedback: 'DNA has two strands twisted together.' },
        { label: 'A flat circle', misconception: 'dna-circle', feedback: 'Human DNA is a double helix: two twisted strands.' },
        { label: 'A cube', misconception: 'dna-cube', feedback: 'DNA is a long, twisted molecule.' },
      ],
      hint: 'Think of a twisted ladder.',
      why: 'DNA is a double helix: two long strands twisted around each other, like a twisted ladder.',
      lv: [2, 4],
    },
    {
      q: 'Why do identical twins have exactly the same genes?',
      a: 'They both develop from the same fertilised egg, which split into two',
      wrong: [
        { label: 'They come from two eggs fertilised by two sperm at the same time', misconception: 'identical-two-eggs', feedback: 'That gives non-identical twins, who are no more alike genetically than other brothers and sisters.' },
        { label: 'They are born on the same day', misconception: 'same-birthday', feedback: 'Non-identical twins are also born on the same day but have different genes.' },
        { label: 'They grow up in the same house', misconception: 'same-house', feedback: 'That is environment, not genes.' },
      ],
      hint: 'How many eggs and how many sperm were involved?',
      why: 'Identical twins form when one fertilised egg splits into two embryos, so they have the same genes. Non-identical twins come from two different eggs and two different sperm.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Explain how characteristics such as eye colour are passed on from parents to their children.',
      model: 'Characteristics are controlled by genes, which are sections of DNA. Genes are found on chromosomes in the nucleus of each cell. Human body cells have 46 chromosomes, but sperm and egg cells have only 23. At fertilisation, the nucleus of the sperm joins the nucleus of the egg, so the child gets 23 chromosomes from each parent. The child therefore has a mixture of genes from both parents.',
      checklist: ['Mentions genes or DNA', 'Says genes are on chromosomes in the nucleus', 'Says gametes have half the number of chromosomes (23)', 'Says half the genes come from each parent at fertilisation'],
      hint: 'Start with what controls the characteristic, then explain what happens at fertilisation.',
    },
  ],
}

interface Animal {
  name: string
  body: number
}
/** Chromosome numbers in body cells (well established values). */
const ANIMALS: Animal[] = [
  { name: 'a dog', body: 78 },
  { name: 'a cat', body: 38 },
  { name: 'a horse', body: 64 },
  { name: 'a chimpanzee', body: 48 },
  { name: 'a fruit fly', body: 8 },
  { name: 'a mouse', body: 40 },
  { name: 'a cow', body: 60 },
  { name: 'a pea plant', body: 14 },
]

function dnaGenerators(): ItemGenerator[] {
  return [
    G('bio.gen.dna.chromosome-number', 'bio.gen.dna', [2, 4], (rng, d) => {
      const a = rng.pick(ANIMALS)
      const gamete = a.body / 2
      const gname = a.name === 'a pea plant' ? 'a pollen grain\'s male gamete' : 'a sperm cell'
      if (d <= 3) {
        return num({
          prompt: `The body cells of ${a.name} each contain ${a.body} chromosomes. How many chromosomes are there in ${gname} from ${a.name}?`,
          answer: gamete,
          suffix: 'chromosomes',
          hint: 'Gametes contain one chromosome from each pair.',
          explanation: `Gametes have half the number of chromosomes of a body cell: ${a.body} ÷ 2 = ${gamete}.`,
          errors: [{ values: [a.body * 2], tag: 'doubled', message: 'Gametes have half as many chromosomes as body cells, not twice as many.' }],
        })
      }
      return num({
        prompt: `The egg cells of ${a.name} each contain ${gamete} chromosomes. How many chromosomes will there be in the fertilised egg?`,
        answer: a.body,
        suffix: 'chromosomes',
        hint: 'At fertilisation, the chromosomes from the egg and from the male gamete come together.',
        explanation: `The egg and the male gamete each bring ${gamete} chromosomes, so the fertilised egg has ${gamete} + ${gamete} = ${a.body}, the same number as a body cell.`,
        errors: [{ values: [gamete], tag: 'not-combined', message: 'The male gamete brings the same number again: add them together.' }],
      })
    }),
  ]
}

// ----------------------------------------------------------------------------------------------- natural selection

const naturalSelection: Bank = {
  skill: 'bio.gen.natural-selection',
  terms: [
    { term: 'Evolution', def: 'The gradual change in the inherited characteristics of a species over many generations' },
    { term: 'Natural selection', def: 'The process in which individuals best suited to their environment are more likely to survive, breed and pass on their genes' },
    { term: 'Fossil', def: 'The preserved remains or traces of an organism that lived long ago' },
    { term: 'Mutation', def: 'A random change in a gene, which can produce new variation' },
    { term: 'Generation', def: 'One step in a family line: parents are one generation, their offspring are the next' },
  ],
  orders: [
    {
      prompt: 'Put these steps of natural selection in order.',
      steps: [
        'Individuals in a population vary, because of differences in their genes',
        'Some individuals have characteristics that make them better suited to their environment',
        'These individuals are more likely to survive and reproduce',
        'They pass on the genes for these useful characteristics to their offspring',
        'Over many generations, the useful characteristic becomes more common in the population',
      ],
      direction: ['first', 'last'],
      hint: 'It starts with variation and ends many generations later.',
      why: 'Variation → better-suited individuals survive → they reproduce → they pass on their genes → over many generations the characteristic becomes common. This is natural selection, and it leads to evolution.',
      lv: [2, 5],
    },
  ],
  mcqs: [
    {
      q: 'Which scientist published "On the Origin of Species" in 1859, explaining evolution by natural selection?',
      a: 'Charles Darwin',
      wrong: [
        { label: 'Rosalind Franklin', misconception: 'origin-franklin', feedback: 'Franklin\'s X-ray images helped show the structure of DNA in the 1950s.' },
        { label: 'Isaac Newton', misconception: 'origin-newton', feedback: 'Newton was a physicist who worked on gravity and light.' },
        { label: 'Francis Crick', misconception: 'origin-crick', feedback: 'Crick helped work out the structure of DNA in 1953.' },
      ],
      hint: 'He sailed to the Galápagos Islands on HMS Beagle.',
      why: 'Charles Darwin published "On the Origin of Species" in 1859. Alfred Russel Wallace had come up with the same idea independently.',
      lv: [1, 3],
    },
    {
      q: 'During the Industrial Revolution, soot made tree trunks near cities darker. Dark peppered moths became more common there. Why?',
      a: 'Dark moths were better camouflaged on the dark bark, so birds ate fewer of them and more survived to breed',
      wrong: [
        { label: 'The soot dyed the pale moths dark', misconception: 'soot-dyes', feedback: 'The moths\' colour is inherited. It was not dyed by soot.' },
        { label: 'Each moth changed its colour to match the trees', misconception: 'moth-changes', feedback: 'Individual moths cannot change their inherited colour. The population changed over generations.' },
        { label: 'Birds preferred to eat dark moths', misconception: 'birds-prefer-dark', feedback: 'It was the other way round: pale moths stood out on dark bark and were eaten more.' },
      ],
      hint: 'Which moths would a bird spot more easily on a dark tree trunk?',
      why: 'On dark, sooty bark, pale moths were easy for birds to see and eat. Dark moths survived more often, bred, and passed on the genes for dark colour, so they became more common: natural selection.',
      lv: [2, 4],
    },
    {
      q: 'After laws reduced air pollution in the 1950s, tree trunks became paler again. What happened to the peppered moth population?',
      a: 'Pale moths became more common again',
      wrong: [
        { label: 'Dark moths became even more common', misconception: 'dark-still-wins', feedback: 'On pale bark, dark moths are easier for birds to spot.' },
        { label: 'All the moths died out', misconception: 'moths-extinct', feedback: 'The population survived; the balance of colours changed.' },
        { label: 'Nothing changed, because evolution only goes one way', misconception: 'evolution-one-way', feedback: 'Natural selection favours whatever suits the current environment.' },
      ],
      hint: 'Which colour is now better camouflaged?',
      why: 'On cleaner, paler bark, pale moths are better camouflaged, so they survive and breed more. Over generations, pale moths became more common again. Natural selection follows changes in the environment.',
      lv: [4, 5],
    },
    {
      q: 'Rabbits living in a snowy area vary in fur colour. Over many generations, the population becomes mostly white. Which is the best explanation?',
      a: 'Whiter rabbits are better camouflaged, so more of them survive to breed and pass on their genes',
      wrong: [
        { label: 'Each rabbit\'s fur turns whiter because it wants to hide', misconception: 'wants-to-change', feedback: 'Animals cannot change their inherited characteristics by wanting to.' },
        { label: 'The snow bleaches their fur, and the young are born with bleached fur', misconception: 'acquired-inherited', feedback: 'Changes during an animal\'s life are not passed on in its genes.' },
        { label: 'Foxes prefer to eat white rabbits', misconception: 'foxes-prefer-white', feedback: 'White rabbits are harder to see in snow, so they are caught less often.' },
      ],
      hint: 'Which rabbits are hardest for a fox to see in the snow?',
      why: 'Rabbits with whiter fur are harder for predators to see, so they are more likely to survive and breed. Their offspring inherit the genes for white fur, so over many generations the population becomes whiter.',
      lv: [2, 4],
    },
    {
      q: 'Why can using antibiotics too often lead to antibiotic-resistant bacteria?',
      a: 'Any bacteria that happen to be resistant survive the antibiotic and reproduce, so resistant bacteria become more common',
      wrong: [
        { label: 'The antibiotic teaches each bacterium how to resist it', misconception: 'antibiotic-teaches', feedback: 'Bacteria do not learn. A few are already resistant because of mutations, and they survive.' },
        { label: 'People\'s bodies become resistant to the antibiotic', misconception: 'person-resistant', feedback: 'It is the bacteria that become resistant, not the person.' },
        { label: 'Antibiotics turn viruses into bacteria', misconception: 'virus-to-bacteria', feedback: 'Antibiotics cannot change one type of microbe into another.' },
      ],
      hint: 'Think of natural selection: which bacteria survive the antibiotic?',
      why: 'A random mutation may make a few bacteria resistant. The antibiotic kills the others, so the resistant ones survive and multiply. This is natural selection, and it happens fast because bacteria reproduce very quickly.',
      lv: [3, 5],
    },
    {
      q: 'How do fossils provide evidence for evolution?',
      a: 'They show that organisms living long ago were different from those alive today, and how they changed over time',
      wrong: [
        { label: 'They show that all species have always looked the same', misconception: 'fossils-no-change', feedback: 'Fossils show many changes, and many species that no longer exist.' },
        { label: 'They contain living cells we can watch evolve', misconception: 'fossils-alive', feedback: 'Fossils are not alive; they are preserved remains or traces.' },
        { label: 'They are only found in the oldest rocks', misconception: 'fossils-oldest-rocks', feedback: 'Fossils are found in rocks of many ages, which lets us compare them.' },
      ],
      hint: 'Compare a fossil from very old rocks with an organism alive now.',
      why: 'Fossils from rocks of different ages show how living things have gradually changed, and that many species have become extinct.',
      lv: [2, 4],
    },
  ],
  written: [
    {
      prompt: 'Explain how natural selection caused dark peppered moths to become more common in industrial areas.',
      model: 'Peppered moths vary in colour: some are pale and some are dark, and the colour is inherited. When soot made tree trunks dark, pale moths were easy for birds to see and eat, but dark moths were camouflaged. More dark moths survived and reproduced, passing on the genes for dark colour to their offspring. Over many generations, dark moths became the most common kind in industrial areas.',
      checklist: ['Says there was variation in colour (inherited)', 'Says dark moths were better camouflaged on sooty trees', 'Says birds ate more pale moths', 'Says dark moths survived to reproduce and passed on their genes', 'Says the change happened over many generations'],
      hint: 'Use the steps: variation, survival, reproduction, passing on genes, many generations.',
      passMark: 3,
    },
    {
      prompt: 'Explain how a population of bacteria can become resistant to an antibiotic.',
      model: 'In a population of bacteria there is variation. A random mutation may make a few bacteria resistant to the antibiotic. When the antibiotic is used, it kills the bacteria that are not resistant, but the resistant ones survive. They reproduce and pass on the gene for resistance, so soon most of the population is resistant. This is natural selection, and it is quick because bacteria reproduce very fast.',
      checklist: ['Mentions variation or a mutation', 'Says the antibiotic kills the non-resistant bacteria', 'Says the resistant bacteria survive and reproduce', 'Says resistance is passed on, so it becomes more common', 'Names this as natural selection'],
      hint: 'Which bacteria survive the antibiotic, and what do they do next?',
      passMark: 3,
    },
  ],
}

// ----------------------------------------------------------------------------------------------- extinction

const extinction: Bank = {
  skill: 'bio.gen.extinction',
  terms: [
    { term: 'Extinct', def: 'When there are no individuals of a species left alive anywhere' },
    { term: 'Endangered', def: 'When a species has so few individuals left that it is at risk of becoming extinct' },
    { term: 'Biodiversity', def: 'The variety of different species living in an area' },
    { term: 'Gene bank', def: 'A store of genetic material, such as seeds, that can be used to grow new individuals of a species' },
    { term: 'Captive breeding', def: 'Breeding endangered animals in zoos or wildlife parks, sometimes releasing them back into the wild' },
    { term: 'Conservation', def: 'Protecting species and their habitats' },
  ],
  mcqs: [
    {
      q: 'What does it mean when a species is extinct?',
      a: 'There are no individuals of that species left alive anywhere',
      wrong: [
        { label: 'There are only a few left in the wild', misconception: 'extinct-endangered', feedback: 'That is endangered. Extinct means none are left at all.' },
        { label: 'It has moved to a different country', misconception: 'extinct-moved', feedback: 'Extinct means none are left anywhere.' },
        { label: 'It only lives in zoos', misconception: 'extinct-zoo', feedback: 'That is "extinct in the wild". Fully extinct means none are left anywhere, even in zoos.' },
      ],
      hint: 'Dinosaurs and dodos are examples.',
      why: 'A species is extinct when every individual has died. Once a species is extinct, its unique genes are lost for ever.',
      lv: [1, 3],
    },
    {
      q: 'What is the main purpose of a seed bank, such as the Millennium Seed Bank run by Kew?',
      a: 'To store seeds of many plant species so they can be grown again if they become rare or extinct in the wild',
      wrong: [
        { label: 'To sell seeds to gardeners', misconception: 'seed-bank-shop', feedback: 'A seed bank is a conservation store, not a shop.' },
        { label: 'To make new species by mixing seeds', misconception: 'seed-bank-new-species', feedback: 'Seed banks keep existing species safe.' },
        { label: 'To store food for people in case of famine', misconception: 'seed-bank-food', feedback: 'The seeds are kept to protect plant species and their genes.' },
      ],
      hint: 'It is a type of gene bank.',
      why: 'Seed banks dry and freeze seeds so they stay alive for many years. If a plant species dies out in the wild, the stored seeds can be used to grow it again.',
      lv: [2, 4],
    },
    {
      q: 'Why are seeds in a seed bank dried and stored at very low temperatures?',
      a: 'So they stay alive but inactive for many years, without germinating or rotting',
      wrong: [
        { label: 'To kill the seeds so they cannot spread diseases', misconception: 'seeds-killed', feedback: 'The aim is to keep the seeds alive so they can grow later.' },
        { label: 'To make them germinate faster', misconception: 'cold-germinates', feedback: 'Seeds need water and warmth to germinate. Dry and cold stops them germinating.' },
        { label: 'To make them smaller so more fit in', misconception: 'cold-smaller', feedback: 'The point is to keep them alive for a long time.' },
      ],
      hint: 'Think about what seeds need to germinate.',
      why: 'Without water and warmth, seeds cannot germinate, and very slow reactions mean they stay alive for decades. The Millennium Seed Bank stores seeds at about -20 °C.',
      lv: [3, 5],
    },
    {
      q: 'Why is a species with only a small population more at risk of extinction?',
      a: 'There is less variation, so it is less likely that some individuals could survive a new disease or a change in the environment',
      wrong: [
        { label: 'Small populations always have more predators', misconception: 'small-more-predators', feedback: 'The number of predators does not depend on the size of the prey population in that way.' },
        { label: 'Small populations reproduce faster', misconception: 'small-faster', feedback: 'That would help them. The problem is the lack of variation.' },
        { label: 'There is no extra risk: small and large populations are equally safe', misconception: 'no-extra-risk', feedback: 'Small populations are at greater risk.' },
      ],
      hint: 'Think about natural selection: what does a population need for some individuals to survive a change?',
      why: 'With few individuals there is little genetic variation. If a new disease or environmental change occurs, there may be no individuals with characteristics that let them survive, so the whole species could die out.',
      lv: [4, 5],
    },
    {
      q: 'Most scientists think a huge asteroid hit the Earth about 66 million years ago, and many species, including the dinosaurs, died out. How could an asteroid make so many species extinct?',
      a: 'It changed the environment quickly (for example, dust blocked sunlight so plants died), faster than species could adapt',
      wrong: [
        { label: 'It landed directly on every dinosaur', misconception: 'asteroid-hit-all', feedback: 'The impact itself was in one place. The worldwide effects on the environment caused the extinctions.' },
        { label: 'It brought new predators from space', misconception: 'space-predators', feedback: 'There is no evidence of that. The asteroid changed the climate and food supply.' },
        { label: 'It made the dinosaurs evolve into mammals', misconception: 'dinosaurs-to-mammals', feedback: 'Mammals already existed. Dinosaurs (apart from the ancestors of birds) died out.' },
      ],
      hint: 'What would happen to food chains if sunlight was blocked for a long time?',
      why: 'The impact threw dust into the atmosphere and changed the climate. With less sunlight, plants died, so food chains collapsed. Species could not adapt fast enough, so many became extinct.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Explain why it is important to stop species becoming extinct, and describe two ways in which people try to protect endangered species.',
      model: 'When a species becomes extinct, its genes are lost for ever and the ecosystem loses biodiversity. Other species that depend on it, for food or for pollination, may also suffer. Some species may also be useful to us, for example as sources of new medicines. To protect endangered species, people set up nature reserves to protect habitats, breed animals in zoos (captive breeding) and release them into the wild, ban hunting, and store seeds in seed banks such as the Millennium Seed Bank.',
      checklist: ['Says genes or biodiversity are lost for ever', 'Mentions other species depending on it (interdependence)', 'Mentions a possible use to humans, such as medicines', 'Describes one way to protect species', 'Describes a second way'],
      hint: 'Give reasons why extinction matters, then describe two ways of protecting species.',
      passMark: 3,
    },
  ],
}

const extinctionClassify = classifyGenerators('bio.gen.extinction', {
  id: 'threat-or-protect',
  categories: ['Can cause extinction', 'Helps protect species'],
  items: [
    ['cutting down rainforests', 'Can cause extinction'],
    ['hunting and poaching', 'Can cause extinction'],
    ['pollution of rivers and seas', 'Can cause extinction'],
    ['bringing a new predator into an area', 'Can cause extinction'],
    ['a new disease spreading through a population', 'Can cause extinction'],
    ['a fast change in climate', 'Can cause extinction'],
    ['storing seeds in a seed bank', 'Helps protect species'],
    ['captive breeding programmes in zoos', 'Helps protect species'],
    ['setting up nature reserves', 'Helps protect species'],
    ['banning trade in endangered animals', 'Helps protect species'],
  ],
  ask: (item) => `"${item.charAt(0).toUpperCase() + item.slice(1)}." Does this tend to cause extinction, or help protect species?`,
  hint: 'Does it destroy habitats or kill organisms, or does it keep them safe?',
  means: {
    'Can cause extinction': 'Habitat loss, hunting, pollution, new predators or diseases and climate change can all wipe out species.',
    'Helps protect species': 'Seed banks, captive breeding, nature reserves and bans on hunting and trade help species survive.',
  },
})

function extinctionGenerators(): ItemGenerator[] {
  const CHANGES: { what: string; good: string; bad: string[] }[] = [
    {
      what: 'a new disease spreads through a population of plants',
      good: 'Some individuals may happen to be resistant to the disease, survive and breed',
      bad: ['Every individual will be affected in exactly the same way', 'The plants will choose to become resistant', 'Variation makes no difference to survival'],
    },
    {
      what: 'the climate in an area becomes hotter and drier',
      good: 'Some individuals may cope better with heat and drought, survive and breed',
      bad: ['Every individual will be affected in exactly the same way', 'Each individual will change its genes to suit the heat', 'Variation makes no difference to survival'],
    },
  ]
  return [
    G('bio.gen.extinction.variation', 'bio.gen.extinction', [3, 5], (rng) => {
      const c = rng.pick(CHANGES)
      return choice({
        rng,
        prompt: `Suppose ${c.what}. Why is a species with a lot of variation less likely to become extinct?`,
        correct: c.good,
        wrong: c.bad.map((b) => ({ label: b, misconception: 'variation-survival', feedback: 'Individuals vary. Those that happen to have helpful characteristics survive and pass them on: natural selection.' })),
        hint: 'If everyone is different, is it likely that someone has a helpful characteristic?',
        explanation: 'With lots of variation, it is more likely that some individuals already have characteristics that help them survive the change. They survive, breed and pass on their genes, so the species continues.',
      })
    }),
    G('bio.gen.extinction.population', 'bio.gen.extinction', [2, 4], (rng, d) => {
      const start = rng.pick([400, 500, 800, 1000, 2000])
      const pct = rng.pick([10, 20, 25, 40, 50, 75])
      const end = start - (start * pct) / 100
      if (d === 3) {
        return num({
          prompt: `A survey found ${fmt(start)} of an endangered bird species in a nature reserve. Ten years later there were ${fmt(end)}. By how many birds did the population fall?`,
          answer: start - end,
          suffix: 'birds',
          hint: 'Subtract the later number from the earlier number.',
          explanation: `${fmt(start)} - ${fmt(end)} = ${fmt(start - end)} birds. The population has decreased but is not extinct, because some birds are still alive.`,
          errors: [{ values: [start + end], tag: 'added', message: 'To find how much it fell, subtract.' }],
        })
      }
      if (d <= 2) {
        return orderedChoice({
          prompt: `A survey found ${fmt(start)} of an endangered bird species in a nature reserve. Ten years later there were ${fmt(end)}. What is the best description of what happened?`,
          correct: 'The population decreased',
          wrong: [
            { label: 'The population increased', misconception: 'misread-decrease', feedback: `${fmt(end)} is less than ${fmt(start)}.` },
            { label: 'The species became extinct', misconception: 'decrease-extinct', feedback: 'Extinct means none are left. There are still some birds.' },
          ],
          order: ['The population increased', 'The population decreased', 'The species became extinct'],
          hint: 'Compare the two numbers. Is there any left?',
          explanation: `The population fell from ${fmt(start)} to ${fmt(end)}. It has decreased, but it is not extinct because some birds are still alive.`,
        })
      }
      return num({
        prompt: `A survey found ${fmt(start)} of an endangered bird species in a nature reserve. Ten years later there were ${fmt(end)}. By what percentage did the population decrease?`,
        answer: pct,
        suffix: '%',
        hint: 'Find the decrease, then divide by the starting number and multiply by 100.',
        explanation: `Decrease = ${fmt(start)} - ${fmt(end)} = ${fmt(start - end)}. ${fmt(start - end)} ÷ ${fmt(start)} × 100 = ${pct}%.`,
        errors: [{ values: [100 - pct], tag: 'percent-remaining', message: 'That is the percentage left. The question asks for the percentage decrease.' }],
      })
    }),
  ]
}

export const geneticsGenerators: ItemGenerator[] = [
  ...bankGenerators(variation),
  ...causeClassify,
  ...typeClassify,
  ...variationGenerators(),
  ...bankGenerators(dna),
  ...dnaGenerators(),
  ...bankGenerators(naturalSelection),
  ...bankGenerators(extinction),
  ...extinctionClassify,
  ...extinctionGenerators(),
]
