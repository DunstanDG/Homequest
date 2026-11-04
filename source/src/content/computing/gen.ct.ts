import type { ItemGenerator } from '@/engine/registry'
import type { Figure, Rng } from '@/engine/types'
import { choice, codeFigure } from '../kit'
import { at, err, factGenerators, G, num, pickN, text, type FactSet, type Program } from './helpers'

// =====================================================================================================================
// Algorithms as instructions (foundation)
// =====================================================================================================================

const instructions: FactSet = {
  skill: 'ct.instructions',
  facts: [
    {
      lv: [1, 3],
      q: 'What is an algorithm?',
      a: 'A precise set of step-by-step instructions to solve a problem or do a task',
      wrong: [
        { label: 'Any program written in Python', misconception: 'algorithm-is-code', feedback: 'An algorithm can be written in English, as a flowchart or in pseudocode. A program is an algorithm written in a programming language.' },
        { label: 'A type of computer hardware', feedback: 'Hardware is the physical parts of a computer. An algorithm is a list of steps.' },
        { label: 'A mistake in a program', feedback: 'A mistake in a program is a bug. An algorithm is a set of steps.' },
      ],
      hint: 'Think of a recipe: it tells you exactly what to do, in order.',
      exp: 'An algorithm is a precise, ordered set of steps for solving a problem. A recipe and a set of directions are everyday algorithms.',
    },
    {
      lv: [2, 4],
      q: 'Why do the instructions in an algorithm for a computer need to be precise?',
      a: 'A computer does exactly what it is told and cannot guess what you meant',
      wrong: [
        { label: 'So the program uses less electricity', feedback: 'Precision is about the computer doing the right thing, not about saving power.' },
        { label: 'Because computers only understand English', misconception: 'computers-understand-english', feedback: 'Computers do not understand English at all; programs are translated into machine code.' },
        { label: 'So the computer can fill in any missing steps itself', misconception: 'computer-guesses', feedback: 'A computer cannot fill in missing steps. It only follows the instructions it is given.' },
      ],
      hint: 'What happens if you leave out a step when giving instructions to a computer?',
      exp: 'Computers follow instructions exactly. If a step is missing or unclear, the computer will not "work out what you meant", so the result will be wrong.',
    },
    {
      lv: [2, 4],
      q: 'What is the difference between an algorithm and a program?',
      a: 'A program is an algorithm written in a language that a computer can run',
      wrong: [
        { label: 'There is no difference: they are the same thing', misconception: 'algorithm-is-code', feedback: 'An algorithm can be written on paper in English or as a flowchart. It only becomes a program when written in a programming language.' },
        { label: 'An algorithm is always longer than a program', feedback: 'Length has nothing to do with it.' },
        { label: 'A program is written in English, and an algorithm in code', feedback: 'It is the other way round: the program is the version written in code.' },
      ],
      hint: 'Which one could you write on paper for a person to follow?',
      exp: 'An algorithm is the plan: the steps. A program is that algorithm written in a programming language such as Python, so a computer can carry it out.',
    },
    {
      lv: [1, 3],
      q: 'What is debugging?',
      a: 'Finding and fixing errors in an algorithm or program',
      wrong: [
        { label: 'Running a program for the first time', feedback: 'Running a program is not the same as debugging it, although running it can reveal bugs.' },
        { label: 'Deleting a program you no longer need', feedback: 'Debugging means fixing errors, not deleting.' },
        { label: 'Writing comments to explain the code', feedback: 'Comments help people understand code, but writing them is not debugging.' },
      ],
      hint: 'A "bug" is an error.',
      exp: 'A bug is an error in an algorithm or program. Debugging is the process of finding and fixing bugs.',
    },
    {
      lv: [3, 5],
      q: 'An algorithm for making toast says: "Spread butter on the toast. Put the bread in the toaster." What is wrong with it?',
      a: 'The steps are in the wrong order',
      wrong: [
        { label: 'It needs a loop', feedback: 'Nothing here needs to be repeated. The problem is which step comes first.' },
        { label: 'It is missing a decision', feedback: 'A decision could be added, but the real bug is the order of the steps.' },
        { label: 'Nothing: the order of steps does not matter', misconception: 'order-irrelevant', feedback: 'Order matters in an algorithm: you cannot butter toast that has not been toasted yet.' },
      ],
      hint: 'Imagine following the steps exactly as written.',
      exp: 'Sequence matters. Following these steps exactly, you would butter plain bread and then toast it. The steps need to be swapped.',
    },
  ],
  sequences: [
    {
      lv: [1, 3],
      q: 'Put the steps of this algorithm for making toast in order.',
      steps: ['Take a slice of bread out of the bag', 'Put the bread in the toaster', 'Push the lever down', 'Wait for the toast to pop up', 'Spread butter on the toast'],
      hint: 'You cannot butter toast that has not been made yet.',
      exp: 'Each step depends on the one before it, so this is the only order that works.',
    },
    {
      lv: [2, 4],
      q: 'Put the steps of this algorithm for planting a seed in order.',
      steps: ['Fill a pot with soil', 'Make a small hole in the soil', 'Drop the seed into the hole', 'Cover the seed with soil', 'Water the pot'],
      hint: 'The hole has to exist before the seed can go in it.',
      exp: 'Soil, hole, seed, cover, water. Getting the sequence wrong (for example covering before dropping the seed in) means the algorithm fails.',
    },
    {
      lv: [2, 4],
      q: 'Put the steps of this algorithm for logging in to a school computer in order.',
      steps: ['Switch on the computer', 'Wait for the login screen', 'Type your username', 'Type your password', 'Press Enter'],
      hint: 'You can only type once the login screen has appeared.',
      exp: 'Switch on, wait for the login screen, username, password, then press Enter to submit them.',
    },
    {
      lv: [3, 5],
      q: 'Put the steps of this algorithm for posting a letter in order.',
      steps: ['Write the letter', 'Fold it and put it in the envelope', 'Seal the envelope', 'Write the address and stick on a stamp', 'Put it in the post box'],
      hint: 'The letter has to be finished before it goes into the envelope.',
      exp: 'Write, fold and put it in, seal, address and stamp, then post. Posting must be last and writing must be first.',
    },
  ],
}

// A robot on a grid: forwards and turns. Directions: 0 up, 1 right, 2 down, 3 left.
const DIRS = ['up', 'right', 'down', 'left'] as const
const describePos = (x: number, y: number): string => {
  const parts: string[] = []
  if (y !== 0) parts.push(`${Math.abs(y)} square${Math.abs(y) === 1 ? '' : 's'} ${y > 0 ? 'up' : 'down'}`)
  if (x !== 0) parts.push(`${Math.abs(x)} square${Math.abs(x) === 1 ? '' : 's'} ${x > 0 ? 'right' : 'left'}`)
  return parts.length ? `${parts.join(' and ')} from the start` : 'Back on the start square'
}
function runRobot(cmds: { f?: number; turn?: 'L' | 'R' }[], flipTurns = false, ignoreTurns = false): [number, number] {
  let x = 0
  let y = 0
  let dir = 0
  for (const c of cmds) {
    if (c.turn && !ignoreTurns) {
      const t = flipTurns ? (c.turn === 'L' ? 'R' : 'L') : c.turn
      dir = (dir + (t === 'R' ? 1 : 3)) % 4
    }
    if (c.f) {
      const d = DIRS[dir]
      if (d === 'up') y += c.f
      else if (d === 'down') y -= c.f
      else if (d === 'right') x += c.f
      else x -= c.f
    }
  }
  return [x, y]
}

const robotGenerator = G('ct.instructions.robot', 'ct.instructions', [1, 5], (rng, d) => {
  const moves = d <= 2 ? 2 : d <= 4 ? 3 : 4
  const cmds: { f?: number; turn?: 'L' | 'R' }[] = []
  for (let i = 0; i < moves; i++) {
    if (i > 0) cmds.push({ turn: d <= 1 ? 'R' : rng.pick(['L', 'R'] as const) })
    cmds.push({ f: rng.int(1, 4) })
  }
  const text = cmds.map((c) => (c.f ? `FORWARD ${c.f}` : c.turn === 'R' ? 'TURN RIGHT' : 'TURN LEFT')).join(', ')
  const [x, y] = runRobot(cmds)
  const correct = describePos(x, y)
  const [fx, fy] = runRobot(cmds, true)
  const [ix, iy] = runRobot(cmds, false, true)
  const total = cmds.reduce((s, c) => s + (c.f ?? 0), 0)
  return choice({
    rng,
    prompt: `A robot starts on a grid facing up the page. Each TURN is a quarter turn on the spot, and FORWARD moves it that many squares the way it is facing. It follows: ${text}. Where does it finish?`,
    correct,
    wrong: [
      { label: describePos(fx, fy), misconception: 'left-right-swapped', feedback: 'That is where it would be if left and right were swapped. Turn right means clockwise.' },
      { label: describePos(ix, iy), misconception: 'ignored-turns', feedback: 'That ignores the turns: every instruction matters, in order.' },
      { label: describePos(total, 0), feedback: 'That adds up all the moves as if they were in one direction.' },
      { label: describePos(-x, y), feedback: 'Check which way it is facing after each turn.' },
    ],
    hint: 'Trace it with your finger on squared paper, keeping track of which way the robot faces after each turn.',
    explanation: `Follow each instruction in order, turning on the spot each time. The robot finishes ${correct.charAt(0).toLowerCase()}${correct.slice(1)}.`,
  })
})

// =====================================================================================================================
// The four computational thinking techniques: decomposition, abstraction, pattern recognition, algorithms
// =====================================================================================================================

type Technique = 'Decomposition' | 'Abstraction' | 'Pattern recognition' | 'Algorithm design'
const TECHNIQUE_DEF: Record<Technique, string> = {
  Decomposition: 'Decomposition means breaking a problem into smaller parts.',
  Abstraction: 'Abstraction means removing details that are not needed.',
  'Pattern recognition': 'Pattern recognition means spotting similarities or repeated steps.',
  'Algorithm design': 'Algorithm design means writing precise step-by-step instructions to solve the problem.',
}
const SCENARIOS: { t: Technique; s: string }[] = [
  { t: 'Decomposition', s: 'Splitting the job of making a video game into designing the levels, drawing the characters and coding the controls' },
  { t: 'Decomposition', s: 'Breaking the job of planning the school sports day into smaller jobs: timetable the events, organise the equipment and record the results' },
  { t: 'Decomposition', s: 'Dividing a long essay into an introduction, three main paragraphs and a conclusion before starting to write' },
  { t: 'Decomposition', s: 'Splitting a tidying robot\'s task into: find an object, pick it up, put it in the box' },
  { t: 'Decomposition', s: 'Breaking a quiz program into parts: ask a question, check the answer, update the score' },
  { t: 'Abstraction', s: 'Drawing a map of the London Underground that shows the order of the stations but not the real distances between them' },
  { t: 'Abstraction', s: 'Making a football game where each player is drawn as a simple circle, because their faces do not matter to the game' },
  { t: 'Abstraction', s: 'Storing only each pupil\'s name, form and test score for a results program, and leaving out their favourite colour' },
  { t: 'Abstraction', s: 'Planning a bus route using only the roads and the bus stops, ignoring which shops are on each street' },
  { t: 'Abstraction', s: 'Pressing "Play" in a music app without needing to know how the app turns the file into sound' },
  { t: 'Pattern recognition', s: 'Noticing that working out the area of every rectangle in a task uses the same steps: length times width' },
  { t: 'Pattern recognition', s: 'Spotting that the same two instructions are repeated to draw each side of a square, so a loop could be used' },
  { t: 'Pattern recognition', s: 'Realising that the method used to sort one class\'s test scores will also work for every other class' },
  { t: 'Pattern recognition', s: 'Noticing that most of the scam emails the school received asked people to "confirm" their password' },
  { t: 'Algorithm design', s: 'Writing out step-by-step instructions that anyone could follow to make a cheese sandwich' },
  { t: 'Algorithm design', s: 'Drawing a flowchart showing exactly what a vending machine should do each time a coin is put in' },
  { t: 'Algorithm design', s: 'Writing precise steps for a robot to follow to find its way out of a maze' },
]
const TECHNIQUES: Technique[] = ['Decomposition', 'Abstraction', 'Pattern recognition', 'Algorithm design']

const scenarioGenerator = (skill: string, t: Technique): ItemGenerator =>
  G(`${skill}.which`, skill, [1, 3], (rng) => {
    const sc = rng.pick(SCENARIOS.filter((x) => x.t === t))
    return choice({
      rng,
      prompt: `Which computational thinking technique is this? "${sc.s}"`,
      correct: t,
      wrong: TECHNIQUES.filter((x) => x !== t).map((x) => ({ label: x, misconception: `ct-${x.toLowerCase().replace(/ /g, '-')}`, feedback: TECHNIQUE_DEF[x] })),
      keepOrder: true,
      hint: 'Is it breaking things up, leaving details out, spotting something repeated, or writing exact steps?',
      explanation: `${TECHNIQUE_DEF[t]} Here: ${sc.s.charAt(0).toLowerCase()}${sc.s.slice(1)}.`,
    })
  })

// A mixed "which technique" question at levels 3-5 where she sees two scenarios and picks the odd one out.
const PROBLEMS: { p: string; parts: string[] }[] = [
  { p: 'making a quiz game', parts: ['Store the quiz questions and their answers', 'Check whether each quiz answer is correct', 'Keep track of the quiz score', 'Show the final quiz score'] },
  { p: 'organising a class party', parts: ['Choose a date for the party', 'Plan the party food and drink', 'Pick the music for the party', 'Send out the party invitations'] },
  { p: 'programming a vending machine', parts: ['Take the customer\'s coins', 'Work out which snack was chosen', 'Drop the chosen snack into the tray', 'Give the customer any change'] },
  { p: 'building a weather app', parts: ['Download the latest weather forecast', 'Find the user\'s location', 'Show the temperature on screen', 'Show a sun or cloud symbol for the weather'] },
  { p: 'baking a birthday cake', parts: ['Weigh out the flour, sugar and butter', 'Mix the cake batter', 'Bake the cake in the oven', 'Ice and decorate the cake'] },
  { p: 'planning a family holiday', parts: ['Choose a holiday destination', 'Book the flights or train tickets', 'Book a hotel or campsite', 'Pack the suitcases'] },
]

const decompositionParts = G('ct.decomposition.parts', 'ct.decomposition', [1, 4], (rng, d) => {
  const [p, ...rest] = rng.shuffle(PROBLEMS)
  const prob = p ?? at(PROBLEMS, 0)
  const own = rng.pick(prob.parts)
  const foreign = rest.slice(0, 3).map((o) => rng.pick(o.parts))
  if (d <= 2) {
    return choice({
      rng,
      prompt: `Maya is decomposing the problem of ${prob.p}. Which of these is one of the smaller parts of that problem?`,
      correct: own,
      wrong: foreign.map((f) => ({ label: f, feedback: 'That is part of a different problem.' })),
      hint: 'Which one would you actually need to do to finish this particular job?',
      explanation: `Decomposition breaks a problem into smaller parts. For ${prob.p}, the parts could be: ${prob.parts.map((x) => x.toLowerCase()).join('; ')}.`,
    })
  }
  const odd = at(foreign, 0)
  const ownThree = pickN(rng, prob.parts, 3)
  return choice({
    rng,
    prompt: `Maya decomposed the problem of ${prob.p} into four parts, but one of them does not belong. Which one is it?`,
    correct: odd,
    wrong: ownThree.map((x) => ({ label: x, feedback: `That is a genuine part of ${prob.p}.` })),
    hint: 'Three of these are needed for the same job.',
    explanation: `"${odd}" belongs to a different problem. The parts of ${prob.p} are: ${prob.parts.map((x) => x.toLowerCase()).join('; ')}.`,
  })
})

const decomposition: FactSet = {
  skill: 'ct.decomposition',
  facts: [
    {
      lv: [1, 3],
      q: 'What is decomposition?',
      a: 'Breaking a problem down into smaller parts that are easier to solve',
      wrong: [
        { label: 'Removing details that are not needed', misconception: 'ct-abstraction', feedback: 'That is abstraction.' },
        { label: 'Spotting things that repeat or are similar', misconception: 'ct-pattern-recognition', feedback: 'That is pattern recognition.' },
        { label: 'Finding and fixing errors in a program', feedback: 'That is debugging.' },
      ],
      hint: 'Think of the word "decompose": things breaking down.',
      exp: 'Decomposition means breaking a big problem into smaller, more manageable parts.',
    },
    {
      lv: [2, 4],
      q: 'Which is a benefit of decomposing a large programming project?',
      a: 'Different people can work on different parts at the same time',
      wrong: [
        { label: 'The program will never contain any bugs', feedback: 'Decomposition helps, but no method guarantees zero bugs.' },
        { label: 'The program no longer needs to be tested', feedback: 'Every part still needs testing. Decomposition does make testing each part easier.' },
        { label: 'The finished program will always be shorter', feedback: 'Decomposition is about organising the work, not making the code shorter.' },
      ],
      hint: 'Think about a team building a game together.',
      exp: 'Smaller parts are easier to understand, can be shared out across a team, and can be tested one at a time.',
    },
    {
      lv: [3, 5],
      q: 'A smaller part found by decomposition is still too big to solve easily. What should you do?',
      a: 'Decompose that part further into even smaller parts',
      wrong: [
        { label: 'Start the whole problem again from scratch', feedback: 'There is no need to start again: keep breaking the big part down.' },
        { label: 'Leave that part out of the program', feedback: 'Leaving out a needed part means the program will not work.' },
        { label: 'Combine it with another part to make it simpler', feedback: 'Combining parts makes them bigger, not easier.' },
      ],
      hint: 'Decomposition can be repeated.',
      exp: 'You can keep decomposing until each part is small enough to solve on its own.',
    },
  ],
  written: [
    {
      q: 'Explain how you could use decomposition to plan a program for a school library that lets pupils borrow and return books.',
      model: 'I would break the problem into smaller parts that can each be solved separately. For example: storing the details of each book, letting a pupil borrow a book, recording when a book is returned, and showing which books are overdue. Each part is easier to program and test on its own, and different people could work on different parts.',
      checklist: ['Says decomposition means breaking the problem into smaller parts', 'Names at least three sensible parts of this library program', 'Gives a benefit, such as each part being easier to solve or test', 'Mentions sharing the parts between people or solving them one at a time'],
    },
    {
      q: 'Explain what decomposition is and why it is useful when solving a big problem. Use an example.',
      model: 'Decomposition is breaking a big problem into smaller parts that are easier to understand and solve. For example, making a game could be split into designing the levels, drawing the characters and programming the controls. Each part can be worked on separately, sometimes by different people, and tested on its own before being put together.',
      checklist: ['Defines decomposition as breaking a problem into smaller parts', 'Gives a clear example with some of its smaller parts', 'Explains a benefit such as smaller parts being easier to solve', 'Mentions working on or testing parts separately'],
    },
  ],
}

const ABSTRACT_TASKS: { task: string; keep: string[]; drop: string[] }[] = [
  { task: 'a program that works out the price of a cinema ticket', keep: ['The customer\'s age', 'Whether the film is in 3D', 'The time of day the film is shown'], drop: ['The colour of the customer\'s coat', 'The customer\'s favourite sweets', 'The customer\'s shoe size'] },
  { task: 'a sat nav that finds the quickest route', keep: ['Which roads connect to which', 'The speed limit on each road', 'Where there are roadworks'], drop: ['The colour of the houses along the road', 'The names of people who live on each street', 'Which shops sell ice cream'] },
  { task: 'a program that works out a pupil\'s average test score', keep: ['Each of the pupil\'s test scores', 'How many tests the pupil took', 'Which pupil the scores belong to'], drop: ['The colour of pen used in each test', 'The pupil\'s hair colour', 'What the pupil had for breakfast'] },
  { task: 'a computer game of noughts and crosses', keep: ['Which squares are empty', 'Whose turn it is', 'Which squares hold an X or an O'], drop: ['What the players had for lunch', 'The brand of the players\' chairs', 'The weather outside'] },
  { task: 'a weather app showing tomorrow\'s forecast', keep: ['The expected temperature', 'The chance of rain', 'The user\'s town'], drop: ['The user\'s favourite song', 'The colour of the user\'s phone case', 'The user\'s middle name'] },
]

const abstractionDetails = G('ct.abstraction.details', 'ct.abstraction', [1, 4], (rng, d) => {
  const t = rng.pick(ABSTRACT_TASKS)
  if (d <= 2 || rng.chance(0.5)) {
    const drop = rng.pick(t.drop)
    return choice({
      rng,
      prompt: `A programmer is designing ${t.task}. Using abstraction, which detail can be left out?`,
      correct: drop,
      wrong: t.keep.map((k) => ({ label: k, misconception: 'removed-needed-detail', feedback: 'That detail is needed to solve this problem, so it must be kept.' })),
      hint: 'Which detail makes no difference to the result?',
      explanation: `Abstraction removes details that do not affect the problem. "${drop}" makes no difference to ${t.task}, so it can be left out.`,
    })
  }
  const keep = rng.pick(t.keep)
  return choice({
    rng,
    prompt: `A programmer is designing ${t.task}. After using abstraction, which detail must still be kept?`,
    correct: keep,
    wrong: t.drop.map((k) => ({ label: k, feedback: 'That makes no difference to the result, so abstraction would remove it.' })),
    hint: 'Which detail changes the answer the program gives?',
    explanation: `Abstraction keeps only what matters. "${keep}" affects the result of ${t.task}, so it stays.`,
  })
})

const abstraction: FactSet = {
  skill: 'ct.abstraction',
  facts: [
    {
      lv: [1, 3],
      q: 'What is abstraction?',
      a: 'Removing unnecessary details so you can focus on what is important',
      wrong: [
        { label: 'Breaking a problem down into smaller parts', misconception: 'ct-decomposition', feedback: 'That is decomposition.' },
        { label: 'Spotting things that repeat or are similar', misconception: 'ct-pattern-recognition', feedback: 'That is pattern recognition.' },
        { label: 'Making a problem more complicated by adding detail', feedback: 'It is the opposite: abstraction takes detail away.' },
      ],
      hint: 'Think of a map: it does not show every tree.',
      exp: 'Abstraction removes details that are not needed, so the problem is simpler to think about and solve.',
    },
    {
      lv: [2, 4],
      q: 'The London Underground map is often given as an example of abstraction. Why?',
      a: 'It shows the order of stations and lines but leaves out real distances and street details',
      wrong: [
        { label: 'It shows every street in London accurately', feedback: 'It does the opposite: it leaves the streets out.' },
        { label: 'It splits London into separate zones', misconception: 'ct-decomposition', feedback: 'The zones are not the point here. The map is famous because it leaves out detail passengers do not need.' },
        { label: 'It was the first map ever made by a computer', feedback: 'It was not made by a computer; it is a well-known example of leaving out detail.' },
      ],
      hint: 'What do passengers actually need to know?',
      exp: 'Passengers need to know which stations are on which line and where to change. The map leaves out real distances and streets, which is abstraction.',
    },
    {
      lv: [3, 5],
      q: 'A game of football is being programmed. Which is the best example of abstraction?',
      a: 'Showing each player as a simple shape, because their appearance does not affect the game',
      wrong: [
        { label: 'Splitting the program into parts for players, the ball and the score', misconception: 'ct-decomposition', feedback: 'That is decomposition.' },
        { label: 'Noticing that every player moves using the same code', misconception: 'ct-pattern-recognition', feedback: 'That is pattern recognition.' },
        { label: 'Adding the exact number of blades of grass to the pitch', feedback: 'That adds detail. Abstraction removes it.' },
      ],
      hint: 'Which option removes detail that does not matter?',
      exp: 'Abstraction keeps what matters to the problem (positions, the ball, the goals) and removes what does not (faces, blades of grass).',
    },
  ],
  written: [
    {
      q: 'A programmer is making an app that tells people when the next bus will arrive. Explain how abstraction could be used, giving examples of details to keep and details to remove.',
      model: 'Abstraction means removing details that are not needed so the problem is simpler. The app needs to keep the bus stops, the bus routes and the times the buses are due. It can remove details such as the colour of each bus, the driver\'s name and which shops are near each stop, because these do not change when the bus will arrive.',
      checklist: ['Explains abstraction as removing unnecessary detail', 'Gives at least two details the app must keep', 'Gives at least two details that can be removed', 'Explains why the removed details are not needed'],
    },
    {
      q: 'Explain what abstraction is, using a map as an example.',
      model: 'Abstraction is removing details that are not needed so that you can focus on what matters. A map is an abstraction of the real world: a walking map shows paths, roads and landmarks, but leaves out details like individual trees, cars and the colour of every building. This makes the map simpler and easier to use for finding your way.',
      checklist: ['Defines abstraction as removing unnecessary detail', 'Names details a map keeps', 'Names details a map leaves out', 'Explains why this makes the map more useful'],
    },
  ],
}

const SHAPES: { name: string; sides: number; turn: number }[] = [
  { name: 'square', sides: 4, turn: 90 },
  { name: 'equilateral triangle', sides: 3, turn: 120 },
  { name: 'regular pentagon', sides: 5, turn: 72 },
  { name: 'regular hexagon', sides: 6, turn: 60 },
  { name: 'regular octagon', sides: 8, turn: 45 },
]

const patternLoop = G('ct.patterns.loop', 'ct.patterns', [1, 4], (rng, d) => {
  const s = rng.pick(d <= 1 ? SHAPES.slice(0, 2) : SHAPES)
  const len = rng.pick([20, 30, 40, 50, 60])
  const steps = Array.from({ length: s.sides }, () => `FORWARD ${len}, TURN RIGHT ${s.turn}`).join(', ')
  return num({
    prompt: `These instructions draw ${/^[aeiou]/.test(s.name) ? 'an' : 'a'} ${s.name}: ${steps}. Using pattern recognition, they can be written as a loop around "FORWARD ${len}, TURN RIGHT ${s.turn}". How many times should the loop repeat?`,
    answer: s.sides,
    suffix: 'times',
    hint: 'Count how many times the same pair of instructions appears.',
    explanation: `The pair "FORWARD ${len}, TURN RIGHT ${s.turn}" appears ${s.sides} times, once for each side, so the loop repeats ${s.sides} times.`,
    errors: [err(s.sides * 2, 'counted-instructions', 'That counts every instruction separately. Count the repeated pair instead.')],
  })
})

const patterns: FactSet = {
  skill: 'ct.patterns',
  facts: [
    {
      lv: [1, 3],
      q: 'What is pattern recognition in computational thinking?',
      a: 'Spotting similarities or things that repeat, within or between problems',
      wrong: [
        { label: 'Breaking a problem down into smaller parts', misconception: 'ct-decomposition', feedback: 'That is decomposition.' },
        { label: 'Removing details that are not needed', misconception: 'ct-abstraction', feedback: 'That is abstraction.' },
        { label: 'Drawing patterns using a computer program', feedback: 'It is not about drawing; it is about noticing what is the same.' },
      ],
      hint: 'What is "the same" each time?',
      exp: 'Pattern recognition means noticing similarities and repetition, so a solution can be reused.',
    },
    {
      lv: [2, 4],
      q: 'Why is pattern recognition useful when writing a program?',
      a: 'Repeated steps can be written once and reused, for example in a loop or a function',
      wrong: [
        { label: 'It makes the program use more memory', feedback: 'That is not a benefit, and it is not what pattern recognition does.' },
        { label: 'It means the program does not need any decisions', feedback: 'Programs can still need decisions; spotting patterns does not remove them.' },
        { label: 'It means every part of the program must be different', feedback: 'It is the opposite: it finds what is the same.' },
      ],
      hint: 'What can you do with steps you have spotted are repeated?',
      exp: 'Once you spot a repeated pattern you can write it once (in a loop or function) and reuse it. This saves time and reduces mistakes.',
    },
    {
      lv: [3, 5],
      q: 'A programmer has already written code to find the highest score in Class 8A. She notices that Class 8B\'s scores are stored in exactly the same way. What should she do?',
      a: 'Reuse the same method for Class 8B',
      wrong: [
        { label: 'Write a completely new method from scratch', feedback: 'That wastes time when the problem is the same.' },
        { label: 'Leave Class 8B out of the program', feedback: 'That does not solve the problem.' },
        { label: 'Decompose the 8A method into smaller parts first', misconception: 'ct-decomposition', feedback: 'There is no need: the method already works and the problems match.' },
      ],
      hint: 'The two problems follow the same pattern.',
      exp: 'Spotting that the problems are the same lets her reuse her solution. That is the point of pattern recognition.',
    },
  ],
}

const constructsData: { t: 'Sequence' | 'Selection' | 'Iteration'; s: string; code?: string }[] = [
  { t: 'Selection', s: 'If it is raining, take an umbrella; otherwise wear sunglasses.' },
  { t: 'Selection', s: 'If the password is correct, open the account; otherwise show an error message.' },
  { t: 'Selection', s: 'Choose which message to show depending on whether the score is above 50.' },
  { t: 'Iteration', s: 'Keep stirring the sauce until it is thick.' },
  { t: 'Iteration', s: 'Do 10 star jumps.' },
  { t: 'Iteration', s: 'Keep asking for the password until the right one is typed in.' },
  { t: 'Sequence', s: 'Put on your socks, then put on your shoes, then tie the laces.' },
  { t: 'Sequence', s: 'Instructions that are carried out one after another, in the order they are written.' },
  { t: 'Selection', s: 'This Python code:', code: 'if age >= 13:\n    print("You can join")\nelse:\n    print("Too young")' },
  { t: 'Iteration', s: 'This Python code:', code: 'for i in range(5):\n    print("Hip hip hooray!")' },
  { t: 'Iteration', s: 'This Python code:', code: 'lives = 3\nwhile lives > 0:\n    lives = lives - 1' },
  { t: 'Sequence', s: 'This Python code:', code: 'name = "Sam"\nprint("Hello")\nprint(name)' },
]
const CONSTRUCT_DEF = {
  Sequence: 'Sequence: instructions run one after another, in order.',
  Selection: 'Selection: a decision chooses which instructions run (if... else).',
  Iteration: 'Iteration: instructions are repeated (a loop).',
}

const constructWhich = G('ct.constructs.which', 'ct.constructs', [1, 4], (rng, d) => {
  const pool = d <= 2 ? constructsData.filter((c) => !c.code) : constructsData
  const c = rng.pick(pool)
  return choice({
    rng,
    prompt: c.code ? 'Which programming construct is the main idea of this Python code?' : `Which programming construct is this? "${c.s}"`,
    figure: c.code ? codeFigure(c.code, 'Python') : undefined,
    correct: c.t,
    wrong: (['Sequence', 'Selection', 'Iteration'] as const).filter((x) => x !== c.t).map((x) => ({ label: x, misconception: `construct-${x.toLowerCase()}`, feedback: CONSTRUCT_DEF[x] })),
    keepOrder: true,
    hint: 'Is something repeated? Is there a choice? Or is it just steps in order?',
    explanation: CONSTRUCT_DEF[c.t],
  })
})

const constructs: FactSet = {
  skill: 'ct.constructs',
  facts: [
    {
      lv: [2, 4],
      q: 'What is the difference between count-controlled and condition-controlled iteration?',
      a: 'Count-controlled repeats a set number of times; condition-controlled repeats until a condition changes',
      wrong: [
        { label: 'Count-controlled uses if; condition-controlled uses else', misconception: 'loop-vs-selection', feedback: 'if and else are selection, not iteration.' },
        { label: 'They are the same thing with different names', feedback: 'They are different kinds of loop.' },
        { label: 'Count-controlled repeats forever; condition-controlled repeats once', feedback: 'Neither is right: a count-controlled loop repeats a fixed number of times.' },
      ],
      hint: 'A for loop with range(10) knows in advance how many times it will run.',
      exp: 'A count-controlled loop (such as for i in range(10)) repeats a fixed number of times. A condition-controlled loop (such as while) keeps going while a condition is true.',
    },
    {
      lv: [3, 5],
      q: 'A program asks for a PIN and keeps asking until the correct one is entered. Which kind of loop fits best?',
      a: 'A condition-controlled loop, such as while',
      wrong: [
        { label: 'A count-controlled loop, such as for i in range(3)', misconception: 'for-when-unknown', feedback: 'You do not know in advance how many tries the user will need, so a fixed count does not fit.' },
        { label: 'No loop: an if statement is enough', misconception: 'if-instead-of-loop', feedback: 'An if statement only checks once; it cannot ask again.' },
        { label: 'Sequence, with the question written out 100 times', feedback: 'That is very long, and still fails if they need 101 tries.' },
      ],
      hint: 'Do you know beforehand how many times it will need to ask?',
      exp: 'The number of attempts is not known in advance, so the loop should repeat while the PIN is wrong: a condition-controlled (while) loop.',
    },
    {
      lv: [1, 3],
      q: 'What are the three basic building blocks of every algorithm?',
      a: 'Sequence, selection and iteration',
      wrong: [
        { label: 'Input, output and storage', misconception: 'hardware-not-constructs', feedback: 'Those describe what a computer system does with data, not the building blocks of an algorithm.' },
        { label: 'Decomposition, abstraction and debugging', feedback: 'Decomposition and abstraction are thinking techniques, not programming constructs.' },
        { label: 'Variables, strings and lists', feedback: 'These are ways of storing data, not the building blocks of control.' },
      ],
      hint: 'Steps in order, choices, and repetition.',
      exp: 'Every algorithm can be built from sequence (steps in order), selection (choices) and iteration (repetition).',
    },
  ],
}

// =====================================================================================================================
// Flowcharts
// =====================================================================================================================

type Symbol = 'Terminator (rounded box)' | 'Process (rectangle)' | 'Input/output (parallelogram)' | 'Decision (diamond)'
const SYMBOL_FOR: { text: string; s: Symbol }[] = [
  { text: 'Start', s: 'Terminator (rounded box)' },
  { text: 'Stop', s: 'Terminator (rounded box)' },
  { text: 'INPUT name', s: 'Input/output (parallelogram)' },
  { text: 'OUTPUT "Well done!"', s: 'Input/output (parallelogram)' },
  { text: 'Ask the user for their age', s: 'Input/output (parallelogram)' },
  { text: 'Display the total on screen', s: 'Input/output (parallelogram)' },
  { text: 'total = total + price', s: 'Process (rectangle)' },
  { text: 'count = 0', s: 'Process (rectangle)' },
  { text: 'Add 1 to the score', s: 'Process (rectangle)' },
  { text: 'area = length × width', s: 'Process (rectangle)' },
  { text: 'Is score > 50?', s: 'Decision (diamond)' },
  { text: 'Is the password correct?', s: 'Decision (diamond)' },
  { text: 'Is count = 10?', s: 'Decision (diamond)' },
]
const SYMBOLS: Symbol[] = ['Terminator (rounded box)', 'Process (rectangle)', 'Input/output (parallelogram)', 'Decision (diamond)']
const SYMBOL_USE: Record<Symbol, string> = {
  'Terminator (rounded box)': 'The terminator marks the start or end of the flowchart.',
  'Process (rectangle)': 'A process box holds a calculation or an action, such as setting a variable.',
  'Input/output (parallelogram)': 'The parallelogram is for data going in (input) or coming out (output).',
  'Decision (diamond)': 'The diamond asks a yes/no question and has two ways out.',
}

const symbolWhich = G('ct.flowchart-symbols.which', 'ct.flowchart-symbols', [1, 4], (rng) => {
  const x = rng.pick(SYMBOL_FOR)
  return choice({
    rng,
    prompt: `Which flowchart symbol should contain: ${x.text}`,
    correct: x.s,
    wrong: SYMBOLS.filter((s) => s !== x.s).map((s) => ({ label: s, misconception: `symbol-${s.split(' ')[0]?.toLowerCase()}`, feedback: SYMBOL_USE[s] })),
    keepOrder: true,
    hint: 'Is it the start or end, a calculation, data in or out, or a question?',
    explanation: SYMBOL_USE[x.s],
  })
})

const flowSymbols: FactSet = {
  skill: 'ct.flowchart-symbols',
  termNoun: 'flowchart symbol',
  terms: [
    { term: 'Terminator (rounded box)', def: 'Marks where the flowchart starts or stops', hint: 'Every flowchart has one at the beginning and one at the end.' },
    { term: 'Process (rectangle)', def: 'Holds an action or calculation, such as total = total + 1', hint: 'This is the plainest box of all.' },
    { term: 'Input/output (parallelogram)', def: 'Shows data being entered by the user or displayed', hint: 'A slanted box.' },
    { term: 'Decision (diamond)', def: 'Asks a yes/no question and has two exits', hint: 'It has two arrows coming out of it.' },
    { term: 'Flow line (arrow)', def: 'Shows which step comes next', hint: 'It joins the boxes together.' },
    { term: 'Subroutine (rectangle with double sides)', def: 'Runs a separate named block of steps that has its own flowchart', hint: 'It looks like a process box with extra lines down each side.' },
  ],
  facts: [
    {
      lv: [2, 4],
      q: 'How many arrows should come out of a decision (diamond) symbol?',
      a: '2',
      wrong: [
        { label: '1', misconception: 'decision-one-exit', feedback: 'A decision needs a way out for Yes and another for No.' },
        { label: '3', feedback: 'A flowchart decision asks a yes/no question, so there are two ways out.' },
        { label: '0', feedback: 'Only the end terminator has no arrow out.' },
      ],
      keepOrder: false,
      hint: 'A decision is a yes/no question.',
      exp: 'A decision asks a yes/no question, so it has two exits: one labelled Yes and one labelled No.',
    },
    {
      lv: [3, 5],
      q: 'In a flowchart, how is a loop (iteration) usually shown?',
      a: 'An arrow goes back up to an earlier step, controlled by a decision',
      wrong: [
        { label: 'With a special circle symbol labelled LOOP', feedback: 'There is no separate loop symbol in standard flowcharts.' },
        { label: 'By drawing the same boxes again underneath', feedback: 'That is just sequence repeated, and would be very long.' },
        { label: 'With two terminator symbols next to each other', feedback: 'Terminators only mark the start and end.' },
      ],
      hint: 'How would you show "go back and do it again" with arrows?',
      exp: 'A loop is drawn as a flow line going back to an earlier box. A decision decides whether to go round again or carry on.',
    },
  ],
}

// Flowchart tracing: flowcharts written as a numbered table of boxes.
type Row = [string, string, string, string]
const flowFigure = (rows: Row[]): Figure => ({ type: 'table', head: ['Box', 'Symbol', 'Contents', 'Next'], rows })

const BANDS: { v: string; unit: string; labels: [string, string, string] }[] = [
  { v: 'temperature', unit: '°C', labels: ['Cold', 'Mild', 'Hot'] },
  { v: 'score', unit: '', labels: ['Try again', 'Good', 'Excellent'] },
  { v: 'speed', unit: ' mph', labels: ['Slow', 'Steady', 'Fast'] },
]

const flowBranch = G('ct.flowchart-trace.branch', 'ct.flowchart-trace', [1, 5], (rng, d) => {
  const b = rng.pick(BANDS)
  const lo = rng.int(2, 6) * 5
  const hi = lo + rng.int(2, 5) * 5
  const strict = d <= 3 ? true : rng.chance(0.5)
  const op = strict ? '<' : '≤'
  const test = (x: number, t: number) => (strict ? x < t : x <= t)
  // Level 3+: values on or next to a boundary.
  const candidates = d <= 2 ? [lo - rng.int(2, 6), Math.round((lo + hi) / 2), hi + rng.int(2, 9)] : [lo, hi, lo - 1, hi + 1, lo + 1, hi - 1]
  const x = rng.pick(candidates)
  const out = test(x, lo) ? b.labels[0] : test(x, hi) ? b.labels[1] : b.labels[2]
  const rows: Row[] = [
    ['1', 'Terminator', 'Start', '2'],
    ['2', 'Input', `INPUT ${b.v}`, '3'],
    ['3', 'Decision', `Is ${b.v} ${op} ${lo}?`, 'Yes: 4. No: 5'],
    ['4', 'Output', `OUTPUT "${b.labels[0]}"`, '8'],
    ['5', 'Decision', `Is ${b.v} ${op} ${hi}?`, 'Yes: 6. No: 7'],
    ['6', 'Output', `OUTPUT "${b.labels[1]}"`, '8'],
    ['7', 'Output', `OUTPUT "${b.labels[2]}"`, '8'],
    ['8', 'Terminator', 'Stop', ''],
  ]
  return choice({
    rng,
    prompt: `Follow the flowchart. The input is ${x}${b.unit}. What is output?`,
    figure: flowFigure(rows),
    correct: out,
    wrong: b.labels.filter((l) => l !== out).map((l) => ({ label: l, misconception: 'boundary', feedback: `Check box 3 first: is ${x} ${op} ${lo}? Then box 5 if needed. ${strict ? '"<" means strictly less than, so equal does not count.' : '"≤" means less than or equal to, so equal counts as Yes.'}` })),
    keepOrder: true,
    hint: `Start at box 1 and follow the Next column. At each decision, put ${x} into the question.`,
    explanation: `Box 3: is ${x} ${op} ${lo}? ${test(x, lo) ? 'Yes, so go to box 4' : `No, so go to box 5: is ${x} ${op} ${hi}? ${test(x, hi) ? 'Yes, so box 6' : 'No, so box 7'}`}. Output: ${out}.`,
  })
})

const flowLoop = G('ct.flowchart-trace.loop', 'ct.flowchart-trace', [2, 5], (rng, d) => {
  if (d <= 3 || rng.chance(0.5)) {
    // Doubling until over a limit.
    const start = rng.pick(d <= 2 ? [1, 2] : [1, 2, 3, 5])
    const limit = rng.int(10, d <= 3 ? 60 : 200)
    let x = start
    let loops = 0
    while (x <= limit) {
      x *= 2
      loops++
    }
    const rows: Row[] = [
      ['1', 'Terminator', 'Start', '2'],
      ['2', 'Process', `x = ${start}`, '3'],
      ['3', 'Decision', `Is x > ${limit}?`, 'Yes: 5. No: 4'],
      ['4', 'Process', 'x = x × 2', '3'],
      ['5', 'Output', 'OUTPUT x', '6'],
      ['6', 'Terminator', 'Stop', ''],
    ]
    if (d >= 4 && rng.chance(0.5)) {
      return num({
        prompt: 'Follow the flowchart. How many times is box 4 carried out?',
        figure: flowFigure(rows),
        answer: loops,
        suffix: 'times',
        hint: 'Keep a list of the values of x. Each time you go through box 4, add a tally mark.',
        explanation: `x goes ${start}${Array.from({ length: loops }, (_, i) => ` → ${start * 2 ** (i + 1)}`).join('')}. Box 4 runs ${loops} times; then x = ${x} is more than ${limit}, so the loop stops.`,
        errors: [err(loops + 1, 'off-by-one', 'That counts one too many: once x is more than the limit, box 4 is skipped.'), err(loops - 1, 'off-by-one', 'Count again: box 4 runs every time the answer to box 3 is No.')],
      })
    }
    return num({
      prompt: 'Follow the flowchart. What number is output?',
      figure: flowFigure(rows),
      answer: x,
      hint: 'Write down x each time it changes. Stop as soon as the answer to box 3 is Yes.',
      explanation: `x goes ${start}${Array.from({ length: loops }, (_, i) => ` → ${start * 2 ** (i + 1)}`).join('')}. ${x} is the first value greater than ${limit}, so ${x} is output.`,
      errors: [err(x / 2, 'stopped-early', `${x / 2} is not more than ${limit}, so the loop goes round again.`), err(x * 2, 'one-extra', 'The loop stops as soon as x is more than the limit.')],
    })
  }
  // Running total.
  const n = rng.int(3, d >= 5 ? 7 : 5)
  const step = rng.int(1, 3)
  let total = 0
  for (let c = 1; c <= n; c++) total += c * step
  const rows: Row[] = [
    ['1', 'Terminator', 'Start', '2'],
    ['2', 'Process', 'count = 0, total = 0', '3'],
    ['3', 'Process', 'count = count + 1', '4'],
    ['4', 'Process', step === 1 ? 'total = total + count' : `total = total + count × ${step}`, '5'],
    ['5', 'Decision', `Is count = ${n}?`, 'Yes: 6. No: 3'],
    ['6', 'Output', 'OUTPUT total', '7'],
    ['7', 'Terminator', 'Stop', ''],
  ]
  const terms = Array.from({ length: n }, (_, i) => (i + 1) * step)
  return num({
    prompt: 'Follow the flowchart. What number is output?',
    figure: flowFigure(rows),
    answer: total,
    hint: 'Make a table with columns for count and total, and fill in a row each time round the loop.',
    explanation: `count goes 1 to ${n}. total = ${terms.join(' + ')} = ${total}.`,
    errors: [err(total - n * step, 'off-by-one', `That stops one loop early. The loop only stops after count reaches ${n}.`)],
  })
})

// =====================================================================================================================
// Pseudocode (AQA-style: ← for assignment, FOR ... TO ... includes both ends)
// =====================================================================================================================

/** A pseudocode program, its output, and an equivalent Python program (used by the tests to double-check). */
export type PseudoProgram = Program & { python: string }

export const PSEUDO: Record<string, (rng: Rng, d: number) => PseudoProgram> = {
  sequence: (rng) => {
    const a = rng.int(2, 9)
    const b = rng.int(2, 9)
    const c = rng.int(1, 5)
    const code = `a ← ${a}\nb ← ${b}\na ← a + b\nb ← a * ${c}\nOUTPUT b - a`
    const a2 = a + b
    const b2 = a2 * c
    return { code, output: [String(b2 - a2)], python: `a = ${a}\nb = ${b}\na = a + b\nb = a * ${c}\nprint(b - a)` }
  },
  ifelse: (rng, d) => {
    const t = rng.int(3, 9) * 5
    const x = d >= 3 ? rng.pick([t, t - 1, t + 1]) : rng.pick([t - rng.int(3, 12), t + rng.int(3, 12)])
    const op = rng.pick(['>', '≥', '<', '≤'] as const)
    const pyOp = { '>': '>', '≥': '>=', '<': '<', '≤': '<=' }[op]
    const res = op === '>' ? x > t : op === '≥' ? x >= t : op === '<' ? x < t : x <= t
    const code = `score ← ${x}\nIF score ${op} ${t} THEN\n    OUTPUT "Level up"\nELSE\n    OUTPUT "Keep going"\nENDIF`
    return { code, output: [res ? 'Level up' : 'Keep going'], python: `score = ${x}\nif score ${pyOp} ${t}:\n    print("Level up")\nelse:\n    print("Keep going")` }
  },
  forsum: (rng, d) => {
    const a = rng.int(1, 3)
    const b = a + rng.int(2, d >= 4 ? 6 : 4)
    let total = 0
    for (let i = a; i <= b; i++) total += i
    return { code: `total ← 0\nFOR i ← ${a} TO ${b}\n    total ← total + i\nENDFOR\nOUTPUT total`, output: [String(total)], python: `total = 0\nfor i in range(${a}, ${b + 1}):\n    total = total + i\nprint(total)` }
  },
  while: (rng, d) => {
    const start = rng.int(1, 3)
    const limit = rng.int(20, d >= 4 ? 150 : 60)
    const m = rng.pick([2, 3])
    let x = start
    let count = 0
    while (x < limit) {
      x *= m
      count++
    }
    return {
      code: `x ← ${start}\ncount ← 0\nWHILE x < ${limit}\n    x ← x * ${m}\n    count ← count + 1\nENDWHILE\nOUTPUT count`,
      output: [String(count)],
      python: `x = ${start}\ncount = 0\nwhile x < ${limit}:\n    x = x * ${m}\n    count = count + 1\nprint(count)`,
    }
  },
  forif: (rng) => {
    const k = rng.pick([2, 3, 4, 5])
    const a = rng.int(1, 5)
    const b = a + rng.int(8, 15)
    let c = 0
    for (let i = a; i <= b; i++) if (i % k === 0) c++
    return {
      code: `count ← 0\nFOR n ← ${a} TO ${b}\n    IF n MOD ${k} = 0 THEN\n        count ← count + 1\n    ENDIF\nENDFOR\nOUTPUT count`,
      output: [String(c)],
      python: `count = 0\nfor n in range(${a}, ${b + 1}):\n    if n % ${k} == 0:\n        count = count + 1\nprint(count)`,
    }
  },
}

const PSEUDO_HINT = 'In this pseudocode, ← means "is set to", and FOR i ← 1 TO 5 runs for 1, 2, 3, 4 and 5 (both ends included). MOD gives the remainder after dividing.'

const pseudoTrace = G('ct.pseudocode.trace', 'ct.pseudocode', [1, 5], (rng, d) => {
  const kinds = d <= 1 ? ['sequence', 'ifelse'] : d === 2 ? ['sequence', 'ifelse', 'forsum'] : d === 3 ? ['ifelse', 'forsum', 'while'] : ['forsum', 'while', 'forif']
  const kind = rng.pick(kinds)
  const p = (PSEUDO[kind] ?? PSEUDO.sequence!)(rng, d)
  const out = at(p.output, 0)
  const isNum = /^-?\d+$/.test(out)
  const explain: Record<string, string> = {
    sequence: 'Work down one line at a time, updating a and b as you go.',
    ifelse: 'Put the value into the condition: if it is true the THEN part runs, otherwise the ELSE part runs.',
    forsum: 'FOR ... TO includes both the start and the end value, so add up every value of i.',
    while: 'Each time round, check the condition first. The loop stops as soon as the condition is false.',
    forif: 'n MOD k = 0 is true when n is a multiple of k, so count the multiples in the range (both ends included).',
  }
  if (isNum) {
    return num({
      prompt: 'Trace this pseudocode. What is output?',
      figure: codeFigure(p.code, 'Pseudocode'),
      answer: Number(out),
      hint: PSEUDO_HINT,
      explanation: `${explain[kind] ?? ''} The output is ${out}.`,
    })
  }
  return text({
    prompt: 'Trace this pseudocode. What is output? (Type just the words, without quotation marks.)',
    figure: codeFigure(p.code, 'Pseudocode'),
    accept: [out],
    hint: PSEUDO_HINT,
    explanation: `${explain[kind] ?? ''} The output is ${out}.`,
  })
})

const pseudoFacts: FactSet = {
  skill: 'ct.pseudocode',
  facts: [
    {
      lv: [1, 3],
      q: 'What is pseudocode?',
      a: 'A way of writing an algorithm that looks like code but is not a real programming language',
      wrong: [
        { label: 'A programming language that runs on every computer', misconception: 'pseudocode-runs', feedback: 'Pseudocode cannot be run by a computer. It is for people to read.' },
        { label: 'Code that has been deliberately broken', feedback: '"Pseudo" means "pretend": it is not broken code, it is code-like writing for planning.' },
        { label: 'A diagram made of boxes and arrows', misconception: 'pseudocode-flowchart', feedback: 'That is a flowchart.' },
      ],
      hint: '"Pseudo" means "not really".',
      exp: 'Pseudocode describes an algorithm in a structured, code-like way, without worrying about the exact rules (syntax) of a real language.',
    },
    {
      lv: [2, 4],
      q: 'Why do programmers often plan algorithms in pseudocode first?',
      a: 'They can focus on the logic without worrying about the exact syntax of a language',
      wrong: [
        { label: 'Because pseudocode runs faster than Python', misconception: 'pseudocode-runs', feedback: 'Pseudocode does not run at all.' },
        { label: 'Because computers can only understand pseudocode', feedback: 'Computers cannot understand pseudocode; it is for people.' },
        { label: 'Because pseudocode never contains mistakes', feedback: 'Pseudocode can contain logic errors, just like a program.' },
      ],
      hint: 'Think about what makes writing real code tricky at first.',
      exp: 'Pseudocode lets you plan the steps clearly. It can then be turned into any programming language.',
    },
    {
      lv: [3, 5],
      q: 'In pseudocode, how many times does the loop "FOR i ← 3 TO 7" run?',
      a: '5',
      wrong: [
        { label: '4', misconception: 'range-exclusive', feedback: 'In pseudocode FOR ... TO includes both ends: 3, 4, 5, 6, 7. (Python\'s range() is different.)' },
        { label: '7', feedback: 'It starts at 3, not 1.' },
        { label: '10', feedback: 'Count the values from 3 to 7.' },
      ],
      hint: 'List the values of i.',
      exp: 'i takes the values 3, 4, 5, 6 and 7: that is 7 - 3 + 1 = 5 times.',
    },
  ],
}

// =====================================================================================================================

export const ctGenerators: ItemGenerator[] = [
  ...factGenerators(instructions),
  robotGenerator,
  ...factGenerators(decomposition),
  scenarioGenerator('ct.decomposition', 'Decomposition'),
  decompositionParts,
  ...factGenerators(abstraction),
  scenarioGenerator('ct.abstraction', 'Abstraction'),
  abstractionDetails,
  ...factGenerators(patterns),
  scenarioGenerator('ct.patterns', 'Pattern recognition'),
  patternLoop,
  ...factGenerators(constructs),
  constructWhich,
  ...factGenerators(flowSymbols),
  symbolWhich,
  flowBranch,
  flowLoop,
  ...factGenerators(pseudoFacts),
  pseudoTrace,
]
