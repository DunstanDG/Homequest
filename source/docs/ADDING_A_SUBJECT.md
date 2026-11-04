# Adding a subject, or a game

Not every subject is "answer a numbered question". The structure handles that by keeping three things separate:

1. **Skills**: what she is supposed to know, and what depends on what. Every subject has these.
2. **Item kinds**: how a question is asked and marked. Subjects pick the kinds that suit them.
3. **Games**: how a session feels. Games work on any subject that has skills and items.

Points, progress, revision scheduling, the skill map, the parent screens and the feedback loop all sit on top of skills and
items, so a new subject gets them for free.

## What fits which subject

| Subject | Skills look like | Best item kinds today | What needs extending |
| --- | --- | --- | --- |
| **Maths** (done) | A prerequisite graph by year and strand | numeric, expr, choice, order, match, figures | Nothing |
| **German** (sample included) | Vocabulary topics, then grammar that depends on them | text (typed, accent tolerant), choice, match | Audio for listening and pronunciation |
| **Science** | Concepts by unit (cells, forces, particles), formulas, working scientifically | numeric (with units in the suffix), choice, match (term to definition), order (process steps) | A `label` item kind: tap a part of a diagram. Practical skills and graphs of data (the chart figures already help) |
| **History** (done) | Periods 1066 to the present; chronology, sources, causation | choice, order (timelines), match, numeric (dates), `reveal`, `passage` sources | Nothing |
| **English** (done) | Language skills, reading, poetry, Shakespeare, writing | choice, match, order, text, `reveal`, `passage` figures | Nothing |
| **Geography** (done) | Place knowledge, map skills, physical and human geography | choice, match, order, numeric (grid references, scale, density), `reveal` | Real map images |
| **Computer Studies** (done) | Python, algorithms, data representation, hardware, networks, safety | numeric, text (program output), choice, order, `reveal`, `code` figures | Running her own code |

Two honest limits to plan around:

- **Free writing is not auto-marked.** The engine judges exact answers, numbers, algebra and choices. For essays, "explain why" and speaking, the right design is self-marking against a model answer and checklist (the `reveal` kind), with the parent able to review. Do not fake it with keyword matching; it teaches the wrong things.
- **Listening and speaking need audio.** The browser can read text aloud through the speech synthesis API for German listening questions, which is a small addition. Recording and judging her speech is a much bigger job, and is not planned.

## Adding a subject in five steps

Use `src/content/german/` as a small worked example and `src/content/maths/` as a large one.

### 1. Write the skill graph

```ts
import type { Skill } from '@/engine/types'

const S = (id: string, year: number, strand: string, name: string, description: string, prereqs: string[]): Skill => ({
  id: `history.${id}`, subject: 'history', year, strand, name, description,
  prereqs: prereqs.map((p) => `history.${p}`),
  origin: 'syllabus',            // use 'foundation' for earlier-year building blocks you add underneath
})

export const historySkills: Skill[] = [
  S('romans.invasion', 7, 'Roman Britain', 'The Roman invasion', 'Why and how Rome invaded Britain.', []),
  S('romans.life', 7, 'Roman Britain', 'Life in Roman Britain', 'Towns, roads, trade and religion.', ['romans.invasion']),
  // ...
]
```

Prerequisites are what power gap-finding, so spend the time here. Ask "if she gets this wrong, what earlier idea is the most likely reason?"
Cross-subject prerequisites are allowed (Science can depend on Maths). Ids are permanent, because progress is stored against them.

### 2. Write generators

A generator produces one question for a skill at a difficulty from 1 to 5, from a seeded random source. It must be
deterministic: same seed, same question.

```ts
import { generatorFor, choice, matchItem, textItem } from '../kit'

const G = generatorFor('history')

export const historyGenerators = [
  G('romans.invasion.who', 'romans.invasion', [1, 3], (rng, d) =>
    choice({
      rng,
      prompt: 'Which emperor ordered the invasion of Britain in AD 43?',
      correct: 'Claudius',
      wrong: ['Julius Caesar', 'Hadrian', 'Nero'],
      hint: 'Julius Caesar visited earlier, but he did not conquer Britain.',
      explanation: 'Claudius sent about 40,000 soldiers in AD 43.',
    }),
  ),
]
```

Advice that saves pain:

- **Vary by data, not by copy.** For fact-based subjects keep a data table (`vocab.ts` in German) and let generators draw from it. That makes each new topic mostly typing data, not writing code.
- **Every wrong option should be a real misconception**, with a `feedback` line: `wrong: [{ label: 'Hadrian', misconception: 'wrong-emperor', feedback: 'Hadrian built the wall, about 80 years later.' }]`. Wrong answers that show why are where the learning is.
- **Always write a `hint` and an `explanation`.** The hint is shown mid-question for reduced XP. The explanation is shown after.
- **Cover difficulty levels 2 to 4 for every skill** (foundation skills 2 to 3). The tests fail if there is a hole, because the planner needs to move up and down.

### 3. Write the pack and register it

```ts
export const historyPack: SubjectPack = {
  id: 'history', name: 'History', tagline: 'Past, present, and why it matters', color: '#f4a261',
  skills: historySkills, generators: historyGenerators, version: '0.1.0',
}
```

Add it in `src/content/index.ts`: `new Registry([mathsPack, germanPack, historyPack])`. It appears in the subject picker, on the skill map, in the parent Topics screen and in every game.

### 4. Test it

Copy `src/content/german/german.test.ts`: it checks the graph, checks each skill has questions at every level, and runs the quality audit. Then:

```bash
npm run audit:content -- --sample=2      # read real generated questions
npm run dev                              # open /#/dev to see them rendered
```

### 5. Bump the version when you change content

Change `version` in the pack whenever question wording or answers change. Feedback and the "What's new" screen tie back to it.

## Item kinds

| Kind | Marking | Use for |
| --- | --- | --- |
| `numeric` | One or more numeric boxes, tolerance, fractions, optional template like `( _ , _ )`, units in prefix or suffix | Calculations, coordinates |
| `expr` | Algebra by substitution, with optional required form (expanded, simplified, factorised) | Algebra |
| `choice` | One correct option, per-option feedback | Facts, reasons, identification |
| `order` | Put items in sequence | Timelines, process steps, sentence building |
| `match` | Pair left items to right items | Terms and definitions, words and translations |
| `text` | Typed answer against a list of accepted answers; optional accent tolerance | Vocabulary, spelling |
| `reveal` | Self-marked: she writes, then ticks a checklist against a model answer; pass at `passMark` ticks. Skipped by timed games, the gap finder and exam mode | Explain, describe, evaluate, source analysis, short writing |

To add a kind (for example `reveal` or `label`), add the item and answer types in `engine/types.ts`, a marking case in
`engine/judge.ts` (including `solutionFor`, which the tests use), and an answer widget in `src/ui/answers/`, then
register it in `AnswerView.tsx`. The rest of the app does not need to change.

Figures (`coord-grid`, `bar-chart`, `shape`, `angles`, `number-line`, `scatter`, `venn`, `table`) are attached to any item with `figure:`. A new figure type is a union member in `types.ts` and a renderer in `src/ui/figures/`.

## Adding a game

Most games are the same loop with a different feel. Add a `GameDef` in `src/games/index.ts` and put it in the `GAMES` array; Home and the Play screen pick it up.

```ts
export const boss: GameDef = {
  id: 'boss', name: 'Boss Battle', tagline: 'Beat 12 hard questions',
  blurb: ['Only your strongest topics, at full difficulty.'],
  icon: 'bolt', color: '#ef476f',
  mode: 'practice', length: 12, allowRetry: false, shell: 'tower',
}
```

The `shell` is one of the existing chromes: `tower` (floors, hints, retry), `sprint` (countdown) or `scan` (no hints, a scanner).
If the game needs a different mode of play (a memory-match board, a drag-and-drop map), give it a `Component` that receives a
`Session` and calls `next()`, `submit()`, `flag()` and `finish()`. Points, progress and feedback then work with no extra code.

To change *what* a game asks, add a session mode in `engine/planner.ts`. Sprint's "only things she knows, easier levels" is a good short example (`sprintPool`).
