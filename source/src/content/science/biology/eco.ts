import type { ItemGenerator } from '@/engine/registry'
import type { Figure, Rng } from '@/engine/types'
import { choice, orderItem, reveal } from '../../kit'
import { bankGenerators, classifyGenerators, fmt, G, num, orderedChoice, round, type Bank } from './factory'

// =====================================================================================================================
// Ecosystems: food chains, food webs and interdependence, adaptation and competition, sampling with quadrats,
// bioaccumulation
// =====================================================================================================================

// ----------------------------------------------------------------------------------------------- food chains

/** Real, simple food chains (producer first). Every consumer here genuinely eats the organism before it. */
const CHAINS: string[][] = [
  ['grass', 'rabbit', 'fox'],
  ['oak tree', 'caterpillar', 'blue tit', 'sparrowhawk'],
  ['algae', 'water flea', 'stickleback', 'pike'],
  ['grass', 'grasshopper', 'frog', 'grass snake'],
  ['lettuce', 'slug', 'hedgehog'],
  ['phytoplankton', 'krill', 'penguin', 'leopard seal'],
  ['grass', 'vole', 'barn owl'],
  ['rose bush', 'aphid', 'ladybird'],
]

const LEVEL_NAMES = ['Producer', 'Primary consumer', 'Secondary consumer', 'Tertiary consumer']
const LEVEL_MEANS: Record<string, string> = {
  Producer: 'a producer makes its own food by photosynthesis',
  'Primary consumer': 'a primary consumer eats the producer',
  'Secondary consumer': 'a secondary consumer eats the primary consumer',
  'Tertiary consumer': 'a tertiary consumer eats the secondary consumer',
}

const showChain = (c: string[]) => c.join(' → ')
/** "is" or "are" after an organism name (algae and phytoplankton are plural). */
const be = (s: string) => (s === 'algae' || s === 'phytoplankton' ? 'are' : 'is')

/** Words that are not made plural with -s (mass nouns, or the same in the plural). */
const MASS = new Set(['grass', 'algae', 'phytoplankton', 'pondweed', 'krill', 'fish', 'pike', 'lettuce'])
const plural = (s: string) => (MASS.has(s) ? s : s.endsWith('x') || s.endsWith('sh') ? `${s}es` : `${s}s`)
/** "stores" or "store" after a producer name. */
const verbS = (s: string, v: string) => (s === 'algae' || s === 'phytoplankton' ? v : `${v}s`)
const the = (s: string) => `the ${s}`

const foodChains: Bank = {
  skill: 'bio.eco.food-chains',
  terms: [
    { term: 'Producer', def: 'An organism that makes its own food by photosynthesis, such as a green plant' },
    { term: 'Consumer', def: 'An organism that gets its energy by eating other organisms' },
    { term: 'Herbivore', def: 'An animal that eats only plants' },
    { term: 'Carnivore', def: 'An animal that eats only other animals' },
    { term: 'Omnivore', def: 'An animal that eats both plants and animals' },
    { term: 'Predator', def: 'An animal that hunts and kills other animals for food' },
    { term: 'Prey', def: 'An animal that is hunted and eaten by another animal' },
    { term: 'Decomposer', def: 'An organism, such as a bacterium or fungus, that breaks down dead organisms and waste' },
  ],
  mcqs: [
    {
      q: 'What do the arrows in a food chain show?',
      a: 'The direction in which energy is transferred, from the food to the organism that eats it',
      wrong: [
        { label: 'Which animal chases which, pointing from the predator to its prey', misconception: 'arrow-predator-to-prey', feedback: 'The arrow points from the organism that is eaten to the one that eats it: the way the energy goes.' },
        { label: 'Which organism is the biggest', misconception: 'arrow-size', feedback: 'Arrows show the transfer of energy, not size.' },
        { label: 'The direction the animals move in their habitat', misconception: 'arrow-movement', feedback: 'Arrows show the transfer of energy through feeding.' },
      ],
      hint: 'Think of the arrow as meaning "is eaten by".',
      why: 'In a food chain each arrow means "is eaten by". It shows energy being transferred from the food to the consumer.',
      lv: [1, 3],
    },
    {
      q: 'Where does the energy in almost every food chain come from in the first place?',
      a: 'The Sun: producers capture light energy in photosynthesis',
      wrong: [
        { label: 'The soil, through the roots of plants', misconception: 'energy-from-soil', feedback: 'Plants take water and minerals from the soil, but their energy comes from light.' },
        { label: 'The top predator', misconception: 'energy-from-top', feedback: 'The top predator is at the end of the chain, receiving energy, not supplying it.' },
        { label: 'Water in rivers and lakes', misconception: 'energy-from-water', feedback: 'Water is a raw material for photosynthesis, not an energy source.' },
      ],
      hint: 'What do plants need in order to photosynthesise?',
      why: 'Producers such as green plants and algae capture light energy from the Sun and store it in glucose. This energy is passed along the food chain.',
      lv: [1, 3],
    },
    {
      q: 'In a field there are far fewer foxes than rabbits. What is the main reason?',
      a: 'At each step of a food chain a lot of energy is lost, so less energy is available to support animals higher up',
      wrong: [
        { label: 'Foxes are bigger, so they need less food', misconception: 'big-need-less', feedback: 'Bigger animals generally need more food, not less.' },
        { label: 'Foxes do not respire, so they do not need much energy', misconception: 'predators-no-respiration', feedback: 'All animals respire. The point is that less energy reaches the top of the chain.' },
        { label: 'Rabbits eat the foxes\' food', misconception: 'rabbits-compete-foxes', feedback: 'Rabbits eat grass; foxes eat rabbits. They do not compete for food.' },
      ],
      hint: 'Where does the energy the rabbits took in go before a fox eats a rabbit?',
      why: 'Rabbits use most of the energy from their food for moving, keeping warm and other life processes, and some is lost in waste. Only a small part is stored in their bodies and passed on to foxes, so the same area can support far fewer foxes.',
      lv: [3, 5],
    },
    {
      q: 'Why do food chains rarely have more than four or five links?',
      a: 'So much energy is lost at each step that there is not enough left to support another level',
      wrong: [
        { label: 'Because there are only five kinds of animal in each habitat', misconception: 'five-animals', feedback: 'Habitats have many kinds of organism. The limit is set by energy.' },
        { label: 'Because top predators eat the producers', misconception: 'top-eats-producer', feedback: 'Top predators eat other animals, not producers.' },
        { label: 'Because energy increases at each step and becomes too much', misconception: 'energy-increases', feedback: 'Energy decreases along a food chain.' },
      ],
      hint: 'Is there more or less energy available at each step along the chain?',
      why: 'At each step, much of the energy is used for movement and keeping warm (released by respiration), or is in parts that are not eaten or in waste. Only a small fraction is passed on, so after a few steps there is too little to support another level.',
      lv: [4, 5],
    },
  ],
}

function foodChainGenerators(): ItemGenerator[] {
  return [
    G('bio.eco.food-chains.order', 'bio.eco.food-chains', [1, 3], (rng) => {
      const c = rng.pick(CHAINS)
      return orderItem({
        rng,
        prompt: 'Put these organisms in order to make a food chain.',
        correct: c.map((x) => x.charAt(0).toUpperCase() + x.slice(1)),
        direction: ['start (producer)', 'end'],
        hint: 'A food chain always starts with a producer, a plant or alga that makes its own food.',
        explanation: `${showChain(c)}. The chain starts with the producer (${c[0]}), and each arrow points to the organism that eats it.`,
      })
    }),
    G('bio.eco.food-chains.identify', 'bio.eco.food-chains', [1, 4], (rng, d) => {
      const c = rng.pick(CHAINS)
      const others = (i: number) => c.filter((_, k) => k !== i)
      if (d <= 2) {
        return choice({
          rng,
          prompt: `Here is a food chain:\n${showChain(c)}\nWhich organism is the producer?`,
          correct: c[0]!,
          wrong: others(0).map((x) => ({ label: x, misconception: 'consumer-as-producer', feedback: `The ${x} is an animal: it has to eat other organisms, so it is a consumer.` })),
          hint: 'The producer makes its own food by photosynthesis. Where does a food chain start?',
          explanation: `The ${c[0]} ${be(c[0]!)} the producer: ${be(c[0]!) === 'are' ? 'they make their' : 'it makes its'} own food by photosynthesis, and the chain starts with ${be(c[0]!) === 'are' ? 'them' : 'it'}.`,
        })
      }
      if (d === 3) {
        return choice({
          rng,
          prompt: `Here is a food chain:\n${showChain(c)}\nWhich organism is a herbivore?`,
          correct: c[1]!,
          wrong: others(1).map((x, k) => ({
            label: x,
            misconception: k === 0 ? 'producer-as-herbivore' : 'carnivore-as-herbivore',
            feedback: k === 0 ? `The ${x} ${be(x)} the producer. A herbivore is an animal that eats producers such as plants.` : `The ${x} eats other animals, so it is not a herbivore.`,
          })),
          hint: 'A herbivore eats plants. Which animal eats the producer?',
          explanation: `The ${c[1]} eats the ${c[0]}, which ${be(c[0]!)} the producer, so it is the herbivore (the primary consumer).`,
        })
      }
      const i = rng.int(2, c.length - 1)
      return choice({
        rng,
        prompt: `Here is a food chain:\n${showChain(c)}\nIn this food chain, which organism is the prey of the ${c[i]}?`,
        correct: c[i - 1]!,
        wrong: others(i - 1)
          .filter((x) => x !== c[i])
          .map((x) => ({ label: x, misconception: 'prey-wrong-link', feedback: `The arrow from the ${x} does not point to the ${c[i]}.` }))
          .concat([{ label: c[i]!, misconception: 'prey-is-self', feedback: `The ${c[i]} is the predator in this question.` }]),
        hint: `Find the arrow that points to the ${c[i]}. Where does it come from?`,
        explanation: `The arrow ${c[i - 1]} → ${c[i]} means the ${c[i - 1]} is eaten by the ${c[i]}, so the ${c[i - 1]} is its prey.`,
      })
    }),
    G('bio.eco.food-chains.level', 'bio.eco.food-chains', [2, 4], (rng) => {
      const c = rng.pick(CHAINS)
      const i = rng.int(0, c.length - 1)
      const correct = LEVEL_NAMES[i]!
      return orderedChoice({
        prompt: `Here is a food chain:\n${showChain(c)}\nWhat ${be(c[i]!)} the ${c[i]} in this food chain?`,
        correct,
        wrong: LEVEL_NAMES.filter((x) => x !== correct).map((x) => ({ label: x, misconception: `level-${x.toLowerCase().replace(/ /g, '-')}`, feedback: `No: ${LEVEL_MEANS[x]}.` })),
        order: LEVEL_NAMES,
        hint: 'Count along from the start: producer, then primary, secondary and tertiary consumers.',
        explanation: `The ${c[i]} ${be(c[i]!)} the ${correct.toLowerCase()}: ${LEVEL_MEANS[correct]}. Chain: ${showChain(c)}.`,
      })
    }),
    G('bio.eco.food-chains.energy', 'bio.eco.food-chains', [3, 5], (rng, d) => {
      const c = rng.pick(CHAINS)
      const start = rng.pick([1000, 2000, 5000, 10000, 20000, 50000])
      const pct = rng.pick([5, 10, 20])
      const next = (start * pct) / 100
      if (d === 3) {
        return num({
          prompt: `In a food chain (${showChain(c)}), the ${c[0]} ${verbS(c[0]!, 'store')} ${fmt(start)} kJ of energy. The ${plural(c[1]!)} that eat ${be(c[0]!) === 'are' ? 'them' : 'it'} get ${fmt(next)} kJ. What percentage of the energy is passed on to the ${plural(c[1]!)}?`,
          answer: pct,
          suffix: '%',
          hint: 'Percentage = (energy passed on ÷ energy at the start) × 100.',
          explanation: `${fmt(next)} ÷ ${fmt(start)} × 100 = ${pct}%. Most of the energy is not passed on: it is used by the producer itself, or is in parts that are not eaten.`,
          errors: [{ values: [100 - pct], tag: 'lost-not-passed', message: 'That is the percentage that was NOT passed on.' }],
        })
      }
      if (d === 4) {
        return num({
          prompt: `In a food chain (${showChain(c)}), the ${c[0]} ${verbS(c[0]!, 'store')} ${fmt(start)} kJ of energy. Only ${pct}% of it is passed on to the ${plural(c[1]!)}. How much energy is passed on?`,
          answer: next,
          suffix: 'kJ',
          hint: `Find ${pct}% of ${fmt(start)}: divide by 100, then multiply by ${pct}.`,
          explanation: `${pct}% of ${fmt(start)} kJ = ${fmt(start)} ÷ 100 × ${pct} = ${fmt(next)} kJ.`,
          errors: [{ values: [start - next], tag: 'lost-not-passed', message: 'That is the energy NOT passed on.' }],
        })
      }
      const third = (next * 10) / 100
      return num({
        prompt: `In a food chain (${showChain(c)}), the ${c[0]} ${verbS(c[0]!, 'store')} ${fmt(start)} kJ of energy. ${pct}% of it is passed on to the ${plural(c[1]!)}, and then 10% of the energy in the ${plural(c[1]!)} is passed on to the ${plural(c[2]!)}. How much energy reaches the ${plural(c[2]!)}?`,
        answer: third,
        suffix: 'kJ',
        hint: 'Do it in two steps: find the energy in the second organism first.',
        explanation: `${pct}% of ${fmt(start)} = ${fmt(next)} kJ in the ${plural(c[1]!)}. 10% of ${fmt(next)} = ${fmt(third)} kJ in the ${plural(c[2]!)}.`,
        errors: [{ values: [next], tag: 'one-step', message: `That is the energy in the ${plural(c[1]!)}. Take 10% of it for the ${plural(c[2]!)}.` }],
      })
    }),
  ]
}

// ----------------------------------------------------------------------------------------------- food webs

interface Web {
  name: string
  intro: string
  /** organism -> what it eats (empty for producers) */
  eats: Record<string, string[]>
}

/** Simplified webs: every feeding link is real; the webs just leave a lot out. */
const WEBS: Web[] = [
  {
    name: 'woodland',
    intro: 'The table shows part of a woodland food web.',
    eats: {
      'oak tree': [],
      grass: [],
      caterpillar: ['oak tree'],
      rabbit: ['grass'],
      vole: ['grass'],
      'blue tit': ['caterpillar'],
      fox: ['rabbit', 'vole'],
      'tawny owl': ['vole', 'blue tit'],
      sparrowhawk: ['blue tit'],
    },
  },
  {
    name: 'pond',
    intro: 'The table shows part of a pond food web.',
    eats: {
      algae: [],
      pondweed: [],
      'water flea': ['algae'],
      tadpole: ['algae'],
      'pond snail': ['pondweed', 'algae'],
      stickleback: ['water flea'],
      'great diving beetle': ['tadpole'],
      heron: ['stickleback', 'tadpole'],
      pike: ['stickleback'],
    },
  },
  {
    name: 'Antarctic',
    intro: 'The table shows part of an Antarctic food web.',
    eats: {
      phytoplankton: [],
      krill: ['phytoplankton'],
      fish: ['krill'],
      penguin: ['krill', 'fish'],
      'blue whale': ['krill'],
      'leopard seal': ['penguin', 'fish', 'krill'],
      'killer whale': ['leopard seal', 'penguin'],
    },
  },
]

const orgs = (w: Web) => Object.keys(w.eats)
const producers = (w: Web) => orgs(w).filter((o) => w.eats[o]!.length === 0)
const eatenBy = (w: Web, o: string) => orgs(w).filter((x) => w.eats[x]!.includes(o))
const herbivores = (w: Web) => orgs(w).filter((o) => w.eats[o]!.length > 0 && w.eats[o]!.every((f) => w.eats[f]!.length === 0))
const notEaten = (w: Web) => orgs(w).filter((o) => w.eats[o]!.length > 0 && eatenBy(w, o).length === 0)

function webTable(w: Web): Figure {
  return {
    type: 'table',
    head: ['Organism', 'What it eats'],
    rows: orgs(w).map((o) => [o.charAt(0).toUpperCase() + o.slice(1), w.eats[o]!.length ? w.eats[o]!.join(', ') : 'Nothing: it is a producer']),
  }
}

/** Every chain from a producer to an organism that nothing eats. */
function allChains(w: Web): string[][] {
  const out: string[][] = []
  const walk = (path: string[]) => {
    const last = path[path.length - 1]!
    const next = eatenBy(w, last)
    if (!next.length) {
      if (path.length > 1) out.push(path)
      return
    }
    for (const n of next) walk([...path, n])
  }
  for (const p of producers(w)) walk([p])
  return out
}

const isChain = (w: Web, c: string[]) => w.eats[c[0]!]!.length === 0 && c.every((o, i) => i === 0 || w.eats[o]!.includes(c[i - 1]!))

interface Effect {
  x: string
  y: string
  result: 'Increase' | 'Decrease'
  why: string
}

/** Direct, unambiguous effects of a fall in x on y: y eats only x (decrease), or x eats y and none of y's other predators (increase). */
function effects(w: Web): Effect[] {
  const out: Effect[] = []
  for (const x of orgs(w)) {
    for (const y of orgs(w)) {
      if (x === y) continue
      if (w.eats[y]!.length === 1 && w.eats[y]![0] === x) {
        out.push({ x, y, result: 'Decrease', why: `In this food web, ${plural(y)} only eat ${plural(x)}. With less food, fewer ${plural(y)} survive and breed, so the ${numberOf(y)} decreases.` })
      } else if (w.eats[x]!.includes(y) && y !== 'oak tree' && !eatenBy(w, y).some((z) => z !== x && w.eats[x]!.includes(z))) {
        // Skipped when x also eats another predator of y: then fewer x means more of that predator, and the effect is unclear.
        out.push({ x, y, result: 'Increase', why: `${capF(plural(x))} eat ${plural(y)}. With fewer ${plural(x)}, ${fewer(y)} eaten, so the ${numberOf(y)} increases.` })
      }
    }
  }
  return out
}

/** Producers and swarming plankton are measured as an amount; other organisms are counted. */
const AMOUNT = new Set(['grass', 'algae', 'phytoplankton', 'pondweed', 'krill'])
const numberOf = (s: string) => (AMOUNT.has(s) ? `amount of ${s}` : `number of ${plural(s)}`)
const fewer = (s: string) => (AMOUNT.has(s) ? `less ${s} is` : `fewer ${plural(s)} are`)
const capF = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const foodWebs: Bank = {
  skill: 'bio.eco.food-webs',
  terms: [
    { term: 'Food web', def: 'A diagram showing how the food chains in an ecosystem are linked together' },
    { term: 'Habitat', def: 'The place where an organism lives' },
    { term: 'Population', def: 'All the organisms of one species living in the same area' },
    { term: 'Community', def: 'All the populations of different species living in the same area' },
    { term: 'Ecosystem', def: 'A community of organisms together with the non-living parts of their environment' },
    { term: 'Interdependence', def: 'The way organisms in an ecosystem depend on each other, for example for food or pollination' },
  ],
  mcqs: [
    {
      q: 'Why does a food web give a more realistic picture of an ecosystem than a single food chain?',
      a: 'Most animals eat more than one kind of food and are eaten by more than one kind of animal',
      wrong: [
        { label: 'Food webs do not include producers', misconception: 'web-no-producers', feedback: 'Food webs do include producers; every chain in the web starts with one.' },
        { label: 'Food chains show energy, but food webs do not', misconception: 'web-no-energy', feedback: 'The arrows in a food web also show energy transfer.' },
        { label: 'In a food web each animal only ever eats one thing', misconception: 'web-one-food', feedback: 'It is the opposite: a web shows animals eating several kinds of food.' },
      ],
      hint: 'Does a fox eat only rabbits?',
      why: 'Real animals have varied diets and several predators. A food web shows all these links, so it shows how a change to one population can affect many others.',
      lv: [2, 4],
    },
    {
      q: 'Bees feed on nectar from flowers, and many flowers need bees to carry their pollen. What is this an example of?',
      a: 'Interdependence',
      wrong: [
        { label: 'Competition', misconception: 'interdependence-competition', feedback: 'Competition is when organisms struggle for the same resource. Here both benefit from each other.' },
        { label: 'Bioaccumulation', misconception: 'interdependence-bioaccumulation', feedback: 'Bioaccumulation is the build-up of toxic substances along a food chain.' },
        { label: 'Photosynthesis', misconception: 'interdependence-photosynthesis', feedback: 'Photosynthesis is how plants make food.' },
      ],
      hint: 'The bees and the flowers depend on each other.',
      why: 'Organisms in an ecosystem depend on each other for food, pollination, shelter and more. This is called interdependence.',
      lv: [1, 3],
    },
    {
      q: 'Which of these is a population?',
      a: 'All the rabbits living in one field',
      wrong: [
        { label: 'All the animals and plants living in one field', misconception: 'population-community', feedback: 'That is a community: populations of many different species.' },
        { label: 'One rabbit and its burrow', misconception: 'population-individual', feedback: 'A population is all the organisms of one species in an area, not one individual.' },
        { label: 'The field, its soil, its weather and everything living there', misconception: 'population-ecosystem', feedback: 'That is an ecosystem: the living community and its non-living environment.' },
      ],
      hint: 'A population is made of just one species.',
      why: 'A population is all the organisms of one species in an area. All the populations together make a community; the community plus its environment is an ecosystem.',
      lv: [2, 4],
    },
  ],
}

const WEB_WRITTEN: { web: string; prompt: string; model: string; checklist: string[] }[] = [
  {
    web: 'woodland',
    prompt: 'A disease kills most of the rabbits in this woodland. Explain what might happen to the number of voles.',
    model: 'Foxes eat both rabbits and voles. With fewer rabbits to eat, the foxes are likely to eat more voles, so the number of voles may decrease. On the other hand, the rabbits and voles both eat grass, so with fewer rabbits there is more grass for the voles, which could help them increase. Because foxes now depend more on voles, a decrease is the more likely result, at least at first.',
    checklist: ['Says foxes eat both rabbits and voles', 'Says foxes would eat more voles, so voles may decrease', 'Says there would be more grass for the voles', 'Weighs up the two effects or gives a conclusion'],
  },
  {
    web: 'pond',
    prompt: 'Pollution kills most of the sticklebacks in this pond. Explain what is likely to happen to the water fleas and to the pike.',
    model: 'Sticklebacks eat water fleas, so with fewer sticklebacks fewer water fleas are eaten and the number of water fleas is likely to increase. Pike only eat sticklebacks in this food web, so the pike will have less food. Fewer pike will survive and breed, so the number of pike is likely to decrease. The herons may also eat more tadpoles instead.',
    checklist: ['Water fleas increase', 'Because fewer are eaten by sticklebacks', 'Pike decrease', 'Because sticklebacks are their only food in this web'],
  },
  {
    web: 'Antarctic',
    prompt: 'Overfishing of krill greatly reduces the amount of krill. Explain how this could affect the other animals in this food web.',
    model: 'Krill are eaten by fish, penguins, blue whales and leopard seals, so almost every animal in the web depends on them. Blue whales and fish only eat krill here, so their numbers are likely to fall. Penguins would have less krill and fewer fish to eat, so they would also decrease, and then leopard seals and killer whales, which eat penguins, would have less food too. Phytoplankton might increase because fewer are eaten.',
    checklist: ['Names animals that eat krill directly', 'Says animals that eat only krill (blue whale or fish) will decrease', 'Describes a knock-on effect further up the web', 'Mentions phytoplankton could increase'],
  },
]

function foodWebGenerators(): ItemGenerator[] {
  return [
    G('bio.eco.food-webs.effect', 'bio.eco.food-webs', [2, 4], (rng) => {
      const w = rng.pick(WEBS)
      const e = rng.pick(effects(w))
      return orderedChoice({
        prompt: `${w.intro} If the ${numberOf(e.x)} suddenly fell, what would most likely happen to the ${numberOf(e.y)}?`,
        figure: webTable(w),
        correct: e.result,
        wrong: [
          { label: e.result === 'Increase' ? 'Decrease' : 'Increase', misconception: 'web-effect-reversed', feedback: e.why },
          { label: 'Stay the same', misconception: 'web-no-effect', feedback: `The ${e.x} and the ${e.y} are linked in the food web, so a change in one affects the other.` },
        ],
        order: ['Increase', 'Decrease', 'Stay the same'],
        hint: `Is the ${e.y} food for the ${e.x}, or is the ${e.x} food for the ${e.y}?`,
        explanation: e.why,
      })
    }),
    G('bio.eco.food-webs.which-chain', 'bio.eco.food-webs', [2, 4], (rng) => {
      const w = rng.pick(WEBS)
      const chains = allChains(w).filter((c) => c.length >= 3)
      const c = rng.pick(chains)
      const wrongs: { label: string; misconception: string; feedback: string }[] = [
        { label: showChain([...c].reverse()), misconception: 'chain-reversed', feedback: 'The arrows go the wrong way: they should point from the food to the animal that eats it.' },
      ]
      const names = orgs(w)
      for (let k = 0; k < 40 && wrongs.length < 3; k++) {
        const i = rng.int(1, c.length - 1)
        const swap = rng.pick(names)
        const bad = c.map((o, j) => (j === i ? swap : o))
        if (new Set(bad).size !== bad.length || isChain(w, bad)) continue
        const label = showChain(bad)
        if (wrongs.some((x) => x.label === label)) continue
        wrongs.push({ label, misconception: 'chain-wrong-link', feedback: `In this web the ${swap} does not eat the ${bad[i - 1]}.` })
      }
      return choice({
        rng,
        prompt: `${w.intro} Which of these is a food chain from this food web?`,
        figure: webTable(w),
        correct: showChain(c),
        wrong: wrongs,
        hint: 'Start with a producer. Check each arrow: does the next organism really eat the one before it?',
        explanation: `${showChain(c)}: ${c
          .slice(1)
          .map((o, i) => `the ${o} eats the ${c[i]}`)
          .join(', ')}.`,
      })
    }),
    G('bio.eco.food-webs.roles', 'bio.eco.food-webs', [1, 3], (rng, d) => {
      const w = rng.pick(WEBS)
      const kinds = d <= 1 ? ['producer'] : ['producer', 'herbivore', 'top']
      const kind = rng.pick(kinds)
      const set = kind === 'producer' ? producers(w) : kind === 'herbivore' ? herbivores(w) : notEaten(w)
      const others = orgs(w).filter((o) => !set.includes(o))
      const correct = rng.pick(set)
      const question = kind === 'producer' ? 'Which of these is a producer?' : kind === 'herbivore' ? 'Which of these is a herbivore (it eats only plants or algae)?' : 'Which of these animals is not eaten by any other animal in this food web?'
      const meaning =
        kind === 'producer'
          ? 'Producers make their own food by photosynthesis, so they eat nothing.'
          : kind === 'herbivore'
            ? 'A herbivore eats only producers.'
            : 'Nothing in this web eats it, so it is at the top of its food chains.'
      return choice({
        rng,
        prompt: `${w.intro} ${question}`,
        figure: webTable(w),
        correct: capF(the(correct)),
        wrong: rng
          .shuffle(others)
          .slice(0, 3)
          .map((o) => ({ label: capF(the(o)), misconception: `not-${kind}`, feedback: `Check the table for the ${o}: ${w.eats[o]!.length ? `it eats ${w.eats[o]!.join(', ')}` : 'it is a producer'}${eatenBy(w, o).length ? `, and it is eaten by ${eatenBy(w, o).join(', ')}` : ''}.` })),
        hint: kind === 'top' ? 'Look for an animal that does not appear in the "What it eats" column.' : 'Read the "What it eats" column carefully.',
        explanation: `The ${correct}. ${meaning} In this web: ${set.map((s) => `the ${s}`).join(', ')}.`,
      })
    }),
    G('bio.eco.food-webs.count', 'bio.eco.food-webs', [3, 5], (rng) => {
      const w = rng.pick(WEBS)
      const chains = allChains(w)
      const ends = [...new Set(chains.map((c) => c[c.length - 1]!))]
      const end = rng.pick(ends)
      const mine = chains.filter((c) => c[c.length - 1] === end)
      return num({
        prompt: `${w.intro} Each food chain starts with a producer. How many different food chains in this web end with the ${end}?`,
        figure: webTable(w),
        answer: mine.length,
        hint: `Work backwards from the ${end}: what does it eat, and what do those organisms eat?`,
        explanation: `The food chains ending with the ${end} are:\n${mine.map(showChain).join('\n')}`,
      })
    }),
    G('bio.eco.food-webs.explain', 'bio.eco.food-webs', [4, 5], (rng) => {
      const t = rng.pick(WEB_WRITTEN)
      const w = WEBS.find((x) => x.name === t.web)!
      return reveal({
        prompt: `${w.intro} ${t.prompt}`,
        figure: webTable(w),
        model: t.model,
        checklist: t.checklist,
        hint: 'Find every arrow that links the organisms in the question, directly or through another animal.',
      })
    }),
  ]
}

// ----------------------------------------------------------------------------------------------- adaptation

const adaptation: Bank = {
  skill: 'bio.eco.adaptation',
  terms: [
    { term: 'Adaptation', def: 'A feature that helps an organism to survive in its habitat' },
    { term: 'Camouflage', def: 'Colours or patterns that help an organism blend in with its surroundings' },
    { term: 'Competition', def: 'When organisms struggle with each other for the same resource that is in short supply' },
    { term: 'Hibernation', def: 'Going into a deep sleep through the winter to save energy when food is scarce' },
    { term: 'Migration', def: 'Moving to a different area for part of the year, for example to find food' },
  ],
  links: [
    {
      prompt: 'Match each adaptation of a polar bear to how it helps it survive in the Arctic.',
      pairs: [
        ['Thick white fur', 'Keeps it warm and camouflages it against the snow'],
        ['A thick layer of fat under the skin', 'Insulates the body and stores energy'],
        ['Small ears', 'Reduce the surface area that heat can be lost from'],
        ['Large, wide feet', 'Spread its weight so it does not sink into snow'],
        ['Sharp teeth and claws', 'Catch and eat seals'],
      ],
      hint: 'Most of a polar bear\'s problems are keeping warm and catching food on the ice.',
      ask: (l) => `How does this feature help a polar bear survive: ${l.charAt(0).toLowerCase() + l.slice(1)}?`,
      lv: [1, 4],
    },
    {
      prompt: 'Match each adaptation of a camel to how it helps it survive in the desert.',
      pairs: [
        ['A hump', 'Stores fat, which can be used for energy when food is scarce'],
        ['Long eyelashes and nostrils that can close', 'Keep sand out of its eyes and nose'],
        ['Large, flat feet', 'Stop it sinking into soft sand'],
        ['Being able to drink a lot of water very quickly', 'Lets it refill after going a long time without water'],
      ],
      hint: 'The camel\'s problems are sand, heat, and food and water being hard to find.',
      ask: (l) => `How does this feature help a camel survive: ${l.charAt(0).toLowerCase() + l.slice(1)}?`,
      lv: [2, 4],
    },
    {
      prompt: 'Match each adaptation of a cactus to how it helps it survive in the desert.',
      pairs: [
        ['Spines instead of broad leaves', 'Reduce water loss and protect it from animals'],
        ['A thick, fleshy stem', 'Stores water'],
        ['A thick, waxy layer on the stem', 'Waterproofs the surface to cut down water loss'],
        ['Shallow roots that spread out widely', 'Absorb as much water as possible when it rains'],
      ],
      hint: 'Almost every cactus adaptation is about water: getting it, storing it, or not losing it.',
      ask: (l) => `How does this feature help a cactus survive: ${l.charAt(0).toLowerCase() + l.slice(1)}?`,
      lv: [2, 4],
    },
  ],
  mcqs: [
    {
      q: 'What does a camel\'s hump contain?',
      a: 'Fat, which is a store of energy',
      wrong: [
        { label: 'Water', misconception: 'hump-water', feedback: 'A common myth. The hump is mostly fat, an energy store.' },
        { label: 'Air, to keep it cool', misconception: 'hump-air', feedback: 'The hump is mostly fat.' },
        { label: 'Its stomach', misconception: 'hump-stomach', feedback: 'The stomach is inside the body cavity, not in the hump.' },
      ],
      hint: 'It is an energy store, not a water tank.',
      why: 'A camel\'s hump stores fat that can be used for energy when food is scarce. Storing fat in one place, rather than all over the body, also helps the camel lose heat from the rest of its body.',
      lv: [3, 5],
    },
    {
      q: 'Fennec foxes live in hot deserts and have very large ears. How do the large ears help them?',
      a: 'They give a large surface area to lose heat from, and help the fox hear its prey',
      wrong: [
        { label: 'They help the fox keep warm at night', misconception: 'big-ears-warm', feedback: 'Large ears lose heat. Arctic foxes have small ears to keep heat in.' },
        { label: 'They store water', misconception: 'ears-water', feedback: 'Ears do not store water.' },
        { label: 'They are used for digging burrows', misconception: 'ears-dig', feedback: 'Foxes dig with their paws.' },
      ],
      hint: 'Compare them with the small ears of an Arctic fox.',
      why: 'Large ears have a big surface area, so the fox can lose heat to keep cool. They also give excellent hearing for finding prey. Arctic foxes have small ears to reduce heat loss.',
      lv: [4, 5],
    },
    {
      q: 'Bluebells grow on the floor of deciduous woods and flower early in spring. Why is this an advantage?',
      a: 'They can get plenty of light before the leaves on the trees grow and shade them',
      wrong: [
        { label: 'There are more insects in winter', misconception: 'insects-winter', feedback: 'There are fewer insects in winter. The advantage is light.' },
        { label: 'It is warmer in early spring than in summer', misconception: 'spring-warmer', feedback: 'Summer is warmer. The point is that the trees have no leaves yet.' },
        { label: 'They do not need light, so the timing does not matter', misconception: 'bluebell-no-light', feedback: 'Bluebells photosynthesise, so they need light.' },
      ],
      hint: 'What do the trees above them not have yet in early spring?',
      why: 'In early spring the trees have no leaves yet, so lots of light reaches the woodland floor. Bluebells grow and flower then, avoiding competition with the trees for light.',
      lv: [3, 5],
    },
    {
      q: 'Why do some animals, such as hedgehogs, hibernate in winter?',
      a: 'Food is hard to find, so hibernating saves energy until spring',
      wrong: [
        { label: 'Because they are too warm in winter', misconception: 'hibernate-warm', feedback: 'Winter is cold, and food is scarce.' },
        { label: 'To grow new fur', misconception: 'hibernate-fur', feedback: 'Hibernation is about saving energy when food is scarce.' },
        { label: 'Because their predators hibernate too', misconception: 'hibernate-predators', feedback: 'The main reason is a lack of food in winter.' },
      ],
      hint: 'Hedgehogs eat insects, slugs and worms. Are these easy to find in winter?',
      why: 'In winter food is scarce and it is cold. Hibernating animals go into a deep sleep with a slower heart rate and lower body temperature, so they use very little energy until food is available again.',
      lv: [1, 3],
    },
    {
      q: 'Swallows spend the summer in the UK but fly to Africa in the autumn. Why?',
      a: 'The insects they eat become scarce in the UK in winter',
      wrong: [
        { label: 'They cannot fly in cold weather', misconception: 'cold-no-flight', feedback: 'Many birds fly all winter in the UK. Swallows leave to find food.' },
        { label: 'To hibernate in Africa', misconception: 'migrate-hibernate', feedback: 'Migrating and hibernating are different ways of coping with winter.' },
        { label: 'Because the days are longer in the UK in winter', misconception: 'winter-days', feedback: 'Winter days in the UK are shorter, not longer.' },
      ],
      hint: 'What do swallows eat, and when is it easy to find?',
      why: 'Swallows catch flying insects. In the UK winter there are very few, so swallows migrate to Africa where food is available, and return in spring.',
      lv: [2, 4],
    },
  ],
  written: [
    {
      prompt: 'Explain how a polar bear is adapted to survive in the Arctic.',
      model: 'A polar bear has thick white fur, which keeps it warm and camouflages it against the snow so it can creep up on seals. Under its skin is a thick layer of fat that insulates it and stores energy. Its ears are small, which reduces heat loss. It has large, wide feet to spread its weight on snow and ice, and sharp teeth and claws for catching seals.',
      checklist: ['Thick fur for warmth', 'White colour for camouflage, linked to hunting', 'Fat layer for insulation or an energy store', 'Small ears to reduce heat loss', 'Large feet or sharp claws, with a reason'],
      hint: 'For each feature, say how it helps: keeping warm, hunting, or moving on snow.',
      passMark: 3,
    },
    {
      prompt: 'Explain how a cactus is adapted to survive in a hot, dry desert.',
      model: 'A cactus has spines instead of broad leaves. This gives a smaller surface area, so less water is lost, and the spines protect it from animals that want the water inside. Its thick stem stores water and does the photosynthesis. The stem has a thick waxy layer that reduces water loss. Its roots spread out widely near the surface so it can absorb as much rain as possible when it does rain.',
      checklist: ['Spines reduce water loss (smaller surface area)', 'Spines protect from animals', 'Thick stem stores water', 'Waxy layer reduces water loss', 'Widespread roots absorb water quickly when it rains'],
      hint: 'Every feature is about water: collecting it, storing it, or not losing it.',
      passMark: 3,
    },
  ],
}

const competeClassify = classifyGenerators('bio.eco.adaptation', {
  id: 'compete-for',
  categories: ['Plants compete for this', 'Animals compete for this', 'Both plants and animals compete for this'],
  items: [
    ['light', 'Plants compete for this'],
    ['minerals from the soil', 'Plants compete for this'],
    ['food', 'Animals compete for this'],
    ['mates', 'Animals compete for this'],
    ['water', 'Both plants and animals compete for this'],
    ['space', 'Both plants and animals compete for this'],
  ],
  ask: (item) => `Which organisms compete with each other for ${item}?`,
  hint: 'Plants make their own food but need what photosynthesis uses. Animals have to find food and partners.',
  sortPrompt: 'Match each resource to which organisms compete for it.',
  means: {
    'Plants compete for this': 'Plants compete for light, water, minerals and space.',
    'Animals compete for this': 'Animals compete for food, water, space (territory) and mates.',
    'Both plants and animals compete for this': 'Water and space are needed by both plants and animals.',
  },
})

// ----------------------------------------------------------------------------------------------- sampling

const sampling: Bank = {
  skill: 'bio.eco.sampling',
  terms: [
    { term: 'Quadrat', def: 'A square frame placed on the ground to count the organisms inside it' },
    { term: 'Random sampling', def: 'Choosing where to take samples by chance, so the results are not biased' },
    { term: 'Transect', def: 'A line across an area along which samples are taken, to see how organisms change from one place to another' },
    { term: 'Abundance', def: 'How many of a species there are in an area' },
    { term: 'Distribution', def: 'Where the organisms of a species are found in an area' },
  ],
  orders: [
    {
      prompt: 'Put these steps for estimating the number of daisies on a field in order.',
      steps: [
        'Lay two tape measures at right angles along two edges of the field',
        'Use random numbers to choose a pair of coordinates',
        'Place the quadrat at those coordinates and count the daisies inside it',
        'Repeat for at least ten quadrats and calculate the mean number per quadrat',
        'Multiply the mean by the number of quadrats that would fit in the whole field',
      ],
      direction: ['first', 'last'],
      hint: 'You need a grid before you can choose random coordinates, and you need a mean before you can scale up.',
      why: 'Set up a grid, choose random positions, count in each quadrat, find the mean, then scale up to the whole area.',
      lv: [3, 5],
    },
  ],
  mcqs: [
    {
      q: 'Why should quadrats be placed randomly, not just where there are lots of daisies?',
      a: 'So the sample is not biased and represents the whole area fairly',
      wrong: [
        { label: 'So that the counting is quicker', misconception: 'random-quick', feedback: 'Random placing is about fairness, not speed.' },
        { label: 'So that you always find some daisies in every quadrat', misconception: 'random-always-find', feedback: 'Some random quadrats may have none; that is part of a fair sample.' },
        { label: 'Because daisies move around', misconception: 'daisies-move', feedback: 'Daisies do not move. The point is to avoid choosing places that are not typical.' },
      ],
      hint: 'What would happen to your estimate if you only put quadrats where daisies were thickest?',
      why: 'If you choose where to put the quadrat, you might pick the best patches and overestimate. Random placing gives a fair, unbiased sample.',
      lv: [2, 4],
    },
    {
      q: 'Why is it better to use many quadrats rather than just one or two?',
      a: 'The mean is more likely to represent the whole area, because odd results have less effect',
      wrong: [
        { label: 'More quadrats always give a higher count', misconception: 'more-higher', feedback: 'More quadrats give a more reliable mean, not a higher one.' },
        { label: 'One quadrat is enough if it is placed carefully', misconception: 'one-enough', feedback: 'One quadrat could land in an unusual patch. More samples give a more representative result.' },
        { label: 'So the field is covered completely', misconception: 'cover-field', feedback: 'Sampling is used because counting the whole field would take too long.' },
      ],
      hint: 'What if your only quadrat landed on an unusually bare patch?',
      why: 'Using many quadrats and finding the mean reduces the effect of any unusual samples, so the estimate is more likely to be close to the true value.',
      lv: [2, 4],
    },
    {
      q: 'Maya wants to see how the number of plants changes from the shady edge of a wood out into an open, sunny field. What should she use?',
      a: 'A transect: quadrats placed at regular intervals along a line from the wood into the field',
      wrong: [
        { label: 'Quadrats placed randomly all over the field', misconception: 'random-for-change', feedback: 'Random quadrats estimate numbers, but a transect shows how numbers change across an area.' },
        { label: 'A single quadrat in the middle of the field', misconception: 'single-quadrat', feedback: 'One quadrat cannot show a change from one place to another.' },
        { label: 'A pooter', misconception: 'pooter', feedback: 'A pooter collects small insects. It will not show how plants change across an area.' },
      ],
      hint: 'She wants to see a change along a line.',
      why: 'A transect is a line across the area. Placing quadrats at regular intervals along it shows how the distribution of a species changes, for example with the amount of light.',
      lv: [3, 5],
    },
  ],
}

function samplingGenerators(): ItemGenerator[] {
  const PLANTS = ['daisies', 'dandelions', 'buttercups', 'clover plants', 'plantains']
  return [
    G('bio.eco.sampling.mean', 'bio.eco.sampling', [2, 4], (rng, d) => {
      const plant = rng.pick(PLANTS)
      const n = d <= 2 ? 5 : rng.pick([5, 6, 8])
      let counts: number[] = []
      for (let k = 0; k < 40; k++) {
        counts = Array.from({ length: n }, () => rng.int(0, 14))
        const s = counts.reduce((a, b) => a + b, 0)
        if (d <= 3 ? s % n === 0 : s % n !== 0 && ((s * 10) / n) % 1 === 0) break
      }
      const sum = counts.reduce((a, b) => a + b, 0)
      const mean = sum / n
      const ans = round(mean, 1)
      const whole = Number.isInteger(mean)
      return num({
        prompt: `Maya placed ${n} quadrats at random on the school field and counted the ${plant} in each one. Calculate the mean number of ${plant} per quadrat.${whole ? '' : ' Give your answer to 1 decimal place.'}`,
        figure: { type: 'table', head: ['Quadrat', ...counts.map((_, i) => String(i + 1))], rows: [[`Number of ${plant}`, ...counts.map(String)]] },
        answer: ans,
        tolerance: whole ? undefined : 0.05,
        hint: 'Add up all the counts, then divide by the number of quadrats (including any with 0).',
        explanation: `Total = ${counts.join(' + ')} = ${sum}. Mean = ${sum} ÷ ${n} = ${fmt(round(mean, 3))}${whole || round(mean, 3) === ans ? '' : `, which is ${fmt(ans)} to 1 decimal place`}.`,
        errors: [
          { values: [sum], tag: 'forgot-divide', message: 'That is the total. Divide by the number of quadrats.' },
          ...(counts.includes(0) ? [{ values: [round(sum / counts.filter((c) => c > 0).length, 1)], tag: 'ignored-zero', message: 'Quadrats with 0 still count: divide by the total number of quadrats.' }] : []),
        ],
      })
    }),
    G('bio.eco.sampling.estimate', 'bio.eco.sampling', [3, 5], (rng: Rng, d) => {
      const plant = rng.pick(PLANTS)
      const mean = rng.pick([2, 3, 4, 5, 6, 1.5, 2.5, 3.5])
      const len = rng.pick([20, 30, 40, 50, 60])
      const wid = rng.pick([10, 20, 25, 30])
      const area = len * wid
      if (d === 3) {
        const est = mean * area
        return num({
          prompt: `Maya found a mean of ${fmt(mean)} ${plant} per quadrat. Each quadrat is 1 m^{2}. The field has an area of ${fmt(area)} m^{2}. Estimate the number of ${plant} on the whole field.`,
          answer: est,
          hint: 'How many 1 m^{2} quadrats would fit on the field? Multiply by the mean per quadrat.',
          explanation: `${fmt(area)} quadrats would fit on the field. Estimate = ${fmt(mean)} × ${fmt(area)} = ${fmt(est)} ${plant}.`,
          errors: [{ values: [mean], tag: 'not-scaled', message: 'That is the mean for one quadrat. Scale it up to the whole field.' }],
        })
      }
      if (d === 4) {
        const est = mean * area
        return num({
          prompt: `Maya found a mean of ${fmt(mean)} ${plant} per quadrat. Each quadrat is 1 m^{2}. The field is a rectangle ${len} m long and ${wid} m wide. Estimate the number of ${plant} on the whole field.`,
          answer: est,
          hint: 'Work out the area of the field first (length × width).',
          explanation: `Area = ${len} × ${wid} = ${fmt(area)} m^{2}, so ${fmt(area)} quadrats would fit. Estimate = ${fmt(mean)} × ${fmt(area)} = ${fmt(est)} ${plant}.`,
          errors: [
            { values: [mean * (len + wid)], tag: 'added-sides', message: 'The area of a rectangle is length × width, not length + width.' },
            { values: [area], tag: 'area-only', message: 'That is the area. Multiply it by the mean number per quadrat.' },
          ],
        })
      }
      const est = mean * 4 * area
      return num({
        prompt: `Maya used quadrats measuring 50 cm × 50 cm and found a mean of ${fmt(mean)} ${plant} per quadrat. The field is a rectangle ${len} m long and ${wid} m wide. Estimate the number of ${plant} on the whole field.`,
        answer: est,
        hint: 'A 50 cm × 50 cm quadrat is 0.25 m^{2}. How many fit in 1 m^{2}?',
        explanation: `Each quadrat is 0.5 m × 0.5 m = 0.25 m^{2}, so 4 fit in each m^{2}: that is ${fmt(mean * 4)} ${plant} per m^{2}. Area = ${len} × ${wid} = ${fmt(area)} m^{2}. Estimate = ${fmt(mean * 4)} × ${fmt(area)} = ${fmt(est)} ${plant}.`,
        errors: [{ values: [mean * area], tag: 'quadrat-as-1m2', message: 'The quadrat is only 0.25 m^{2}, not 1 m^{2}. Four of them fit in each square metre.' }],
      })
    }),
  ]
}

// ----------------------------------------------------------------------------------------------- bioaccumulation

const bioaccumulation: Bank = {
  skill: 'bio.eco.bioaccumulation',
  terms: [
    { term: 'Bioaccumulation', def: 'The build-up of a toxic substance in organisms, getting more concentrated at each step of a food chain' },
    { term: 'Pesticide', def: 'A chemical used to kill pests, such as insects that damage crops' },
    { term: 'Persistent', def: 'Not easily broken down, so it stays in the environment or in the body for a long time' },
    { term: 'Toxic', def: 'Poisonous: able to harm or kill living things' },
  ],
  orders: [
    {
      prompt: 'A persistent pesticide is sprayed on fields next to a lake. Put these in the order the pesticide reaches them.',
      steps: ['Crops in the field', 'Water in the lake (washed in by rain)', 'Tiny plankton in the lake', 'Small fish', 'Large fish', 'Fish-eating birds, such as ospreys'],
      direction: ['first', 'last'],
      hint: 'Rain washes it into the lake, then it passes along the food chain from the smallest organisms.',
      why: 'Rain washes pesticide from the fields into the lake. Plankton absorb it, small fish eat lots of plankton, large fish eat lots of small fish, and birds eat lots of large fish. The pesticide becomes more concentrated at each step.',
      lv: [2, 4],
    },
  ],
  mcqs: [
    {
      q: 'Why does a persistent pesticide reach its highest concentration in the top predator of a food chain?',
      a: 'Each animal eats many of the organisms below it, and the pesticide is not broken down or removed, so it builds up',
      wrong: [
        { label: 'Top predators are sprayed with pesticide directly', misconception: 'predator-sprayed', feedback: 'They get it through their food, not by being sprayed.' },
        { label: 'The top predator makes the pesticide in its own body', misconception: 'predator-makes-toxin', feedback: 'The pesticide comes from outside; it builds up through eating.' },
        { label: 'The pesticide becomes stronger as it is digested', misconception: 'toxin-strengthens', feedback: 'The pesticide itself does not change. There is just more of it per kilogram of animal.' },
      ],
      hint: 'How many small fish does a big fish eat in its lifetime?',
      why: 'Each organism eats many of the ones below it. A persistent pesticide is not broken down or excreted, so it is stored in the body and builds up. By the top of the food chain it can be concentrated enough to harm or kill.',
      lv: [2, 4],
    },
    {
      q: 'In the 1950s and 1960s, the insecticide DDT built up in birds of prey such as peregrine falcons. What happened to these birds?',
      a: 'They laid eggs with thin shells that often broke, so fewer chicks hatched and their numbers fell',
      wrong: [
        { label: 'They became immune and their numbers rose', misconception: 'ddt-immune', feedback: 'Their numbers fell sharply. DDT is one reason it was later banned in many countries.' },
        { label: 'Nothing, because DDT only affects insects', misconception: 'ddt-insects-only', feedback: 'DDT built up along food chains and harmed birds at the top.' },
        { label: 'They stopped eating and starved, because DDT tastes bitter', misconception: 'ddt-taste', feedback: 'The main effect was on their eggs.' },
      ],
      hint: 'The effect was seen in their nests.',
      why: 'DDT built up in birds at the top of food chains. It made their eggshells thin, so eggs broke during incubation and populations of birds of prey fell sharply. DDT was later banned in the UK and many other countries.',
      lv: [3, 5],
    },
    {
      q: 'Why are large predatory fish such as tuna likely to contain more mercury than small fish?',
      a: 'They are near the top of the food chain and eat many smaller fish, so mercury builds up in them',
      wrong: [
        { label: 'They swim near the surface, where the water has more mercury', misconception: 'mercury-surface', feedback: 'The build-up comes from what they eat over a long life.' },
        { label: 'Big fish make mercury in their muscles', misconception: 'fish-make-mercury', feedback: 'Mercury is a pollutant from outside; it builds up through feeding.' },
        { label: 'Small fish get rid of mercury by passing it to big fish on purpose', misconception: 'mercury-on-purpose', feedback: 'Small fish do not get rid of it: when they are eaten, it passes to the predator.' },
      ],
      hint: 'Think about bioaccumulation along a food chain.',
      why: 'Mercury is not easily removed from the body, so it builds up along food chains. Large, long-lived predators such as tuna eat many smaller fish, so they contain more.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'A pesticide that is not broken down is sprayed on crops. Explain why it may harm birds of prey, even though the birds never eat the crops.',
      model: 'Rain washes the pesticide into rivers or it is taken in by insects and small animals. Small animals eat the crops or plankton containing the pesticide, and each one absorbs a small amount. Larger animals eat many of the small ones, and the pesticide is not broken down or excreted, so it builds up in their bodies. Birds of prey eat many of these animals, so the pesticide becomes most concentrated in them. This is called bioaccumulation, and it can reach a level that harms or kills them.',
      checklist: ['Says the pesticide passes along a food chain', 'Says each animal eats many of the ones below it', 'Says the pesticide is not broken down or excreted, so it builds up', 'Says it is most concentrated in the top predator', 'Uses the word bioaccumulation'],
      hint: 'Follow the pesticide along the food chain from the crops to the bird.',
      passMark: 3,
    },
  ],
}

function bioaccumulationGenerators(): ItemGenerator[] {
  return [
    G('bio.eco.bioaccumulation.calc', 'bio.eco.bioaccumulation', [2, 4], (rng, d) => {
      const per = rng.pick([1, 2, 3, 5])
      const n1 = rng.pick([10, 20, 50])
      const n2 = rng.pick([10, 20, 40])
      if (d <= 3) {
        return num({
          prompt: `Each small fish in a polluted lake contains ${per} units of a pesticide. A large fish eats ${n1} small fish, and none of the pesticide is broken down or removed from its body. How many units of pesticide does the large fish contain?`,
          answer: per * n1,
          suffix: 'units',
          hint: 'Every small fish it eats adds the same amount.',
          explanation: `${n1} small fish × ${per} units = ${per * n1} units. The pesticide builds up because it is not broken down.`,
          errors: [{ values: [per + n1], tag: 'added', message: 'Each small fish adds the same amount, so multiply.' }],
        })
      }
      return num({
        prompt: `Each small fish in a polluted lake contains ${per} units of a pesticide. Each large fish eats ${n1} small fish, and an osprey eats ${n2} large fish. None of the pesticide is broken down or removed. How many units of pesticide does the osprey contain?`,
        answer: per * n1 * n2,
        suffix: 'units',
        hint: 'First find how much is in one large fish.',
        explanation: `One large fish: ${n1} × ${per} = ${per * n1} units. The osprey: ${n2} × ${per * n1} = ${fmt(per * n1 * n2)} units. That is ${fmt(n1 * n2)} times as much as one small fish.`,
        errors: [{ values: [per * n1], tag: 'one-step', message: 'That is one large fish. The osprey eats many large fish.' }],
      })
    }),
    G('bio.eco.bioaccumulation.chart', 'bio.eco.bioaccumulation', [3, 5], (rng, d) => {
      const a = rng.pick([1, 2])
      const k = [rng.pick([5, 10]), rng.pick([5, 10]), rng.pick([4, 5, 10])]
      const names = ['Plankton', 'Small fish', 'Large fish', 'Osprey']
      const vals = [a, a * k[0]!, a * k[0]! * k[1]!, a * k[0]! * k[1]! * k[2]!]
      const figure: Figure = { type: 'bar-chart', bars: names.map((label, i) => ({ label, value: vals[i]! })), yLabel: 'Concentration of pesticide (units per kg)', showValues: true }
      if (d <= 3) {
        const i = rng.int(1, 3)
        return num({
          prompt: `The bar chart shows the concentration of a pesticide in organisms in a lake food chain. How many times greater is the concentration in the ${names[i]!.toLowerCase()} than in the ${names[i - 1]!.toLowerCase()}?`,
          figure,
          answer: k[i - 1]!,
          suffix: 'times',
          hint: 'Divide the larger value by the smaller one.',
          explanation: `${fmt(vals[i]!)} ÷ ${fmt(vals[i - 1]!)} = ${k[i - 1]}. The concentration goes up at each step because of bioaccumulation.`,
          errors: [{ values: [vals[i]! - vals[i - 1]!], tag: 'subtracted', message: '"How many times greater" means divide, not subtract.' }],
        })
      }
      return num({
        prompt: 'The bar chart shows the concentration of a pesticide in organisms in a lake food chain. How many times greater is the concentration in the osprey than in the plankton?',
        figure,
        answer: vals[3]! / vals[0]!,
        suffix: 'times',
        hint: 'Divide the osprey value by the plankton value.',
        explanation: `${fmt(vals[3]!)} ÷ ${fmt(vals[0]!)} = ${fmt(vals[3]! / vals[0]!)}. The pesticide is most concentrated at the top of the food chain.`,
        errors: [{ values: [vals[3]! - vals[0]!], tag: 'subtracted', message: '"How many times greater" means divide, not subtract.' }],
      })
    }),
  ]
}

export const ecoGenerators: ItemGenerator[] = [
  ...bankGenerators(foodChains),
  ...foodChainGenerators(),
  ...bankGenerators(foodWebs),
  ...foodWebGenerators(),
  ...bankGenerators(adaptation),
  ...competeClassify,
  ...bankGenerators(sampling),
  ...samplingGenerators(),
  ...bankGenerators(bioaccumulation),
  ...bioaccumulationGenerators(),
]
