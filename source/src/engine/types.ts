/**
 * Core domain types. Everything in /engine is pure TypeScript (no React, no DOM)
 * so it can be unit-tested, run in Node scripts, and reused if the app is ever
 * wrapped as a native app.
 *
 * The big idea: the app's ONLY source of truth is an append-only list of
 * AppEvents. Progress, points, badges, mastery and the parent dashboard are all
 * projections (folds) over that list. That makes sync trivial (union of events
 * by id) and lets us change how we score/analyse without losing history.
 */

import type { FamilyEvent } from '../family/types'

export type SubjectId = string // 'maths' | 'german' | 'history' | ...
export type SkillId = string // e.g. 'maths.number.standard-form'
export type LearnerId = string
export type GameId = string
export type ItemKind = 'numeric' | 'expr' | 'choice' | 'order' | 'match' | 'text' | 'reveal'

/** Mini-markup for text: {a|b} = fraction, ^{2} = superscript, _{2} = subscript. */
export type Rich = string

// ---------------------------------------------------------------- Curriculum

export interface Skill {
  id: SkillId
  subject: SubjectId
  name: string
  /** Wording taken from the school syllabus (or a short description for foundations). */
  description: string
  /** School year the skill is first taught. Years below 7 are "foundation" building blocks. */
  year: number
  strand: string
  /** Skills that should be secure before this one is comfortable. Drives gap-finding. */
  prereqs: SkillId[]
  /** 'syllabus' = from the school document; 'foundation' = added by us to enable gap-finding. */
  origin: 'syllabus' | 'foundation'
}

// -------------------------------------------------------------------- Items

export type Figure =
  | {
      type: 'coord-grid'
      xRange: [number, number]
      yRange: [number, number]
      points?: { x: number; y: number; label?: string }[]
      polygons?: { points: [number, number][]; label?: string; ghost?: boolean }[]
      lines?: { from: [number, number]; to: [number, number]; label?: string }[]
      /** Mirror line: axis 'x' draws the vertical line x = at; axis 'y' draws the horizontal line y = at. */
      mirror?: { axis: 'x' | 'y'; at: number }
      xLabel?: string
      yLabel?: string
      /** Grid spacing (default chosen from range). */
      xStep?: number
      yStep?: number
      /** Draw dots at the ends of each line segment. */
      dots?: boolean
    }
  | { type: 'bar-chart'; bars: { label: string; value: number }[]; yLabel?: string; showValues?: boolean }
  /**
   * Labelled shape. Label keys per shape (all optional; only labelled sides are drawn with a value):
   *  rectangle: w (bottom), h (side) | triangle: b (base), h (perpendicular height), a, c (slanted sides)
   *  trapezium: a (top), b (bottom), h (height), c (slanted side) | parallelogram: b, h | circle: r (radius) or d (diameter)
   *  cuboid: l, w, h | cylinder: r or d, h | prism (triangular): b, h (triangle), l (length)
   *  l-shape (a rectangle with a notch cut from the top-right corner): w (bottom), h (left side),
   *    top (top edge), right (right edge, below the notch), cw (notch width), ch (notch height)
   */
  | { type: 'shape'; shape: 'rectangle' | 'triangle' | 'trapezium' | 'circle' | 'parallelogram' | 'cuboid' | 'cylinder' | 'prism' | 'l-shape'; labels: Record<string, string> }
  /**
   * Angle diagrams (not drawn to scale). Label values are Rich text like '65°', 'x', '(2x + 10)°'.
   *  straight: a, b, c - consecutive angles along a straight line, left to right
   *  point: a..e - consecutive angles around a point
   *  vertical: a (top), b (right), c (bottom), d (left) - two crossing lines
   *  parallel-alternate / parallel-corresponding: p (upper junction), q (lower junction) are the equal pair;
   *    r (optional) is the angle on a straight line next to q at the lower junction
   *  triangle: a, b, c at the three vertices
   */
  | { type: 'angles'; kind: 'straight' | 'point' | 'vertical' | 'parallel-alternate' | 'parallel-corresponding' | 'triangle'; labels: Record<string, string> }
  | { type: 'number-line'; min: number; max: number; marks: { at: number; label: string }[] }
  /** Axes start at 0 and are scaled to fit points and line. */
  | { type: 'scatter'; points: [number, number][]; xLabel: string; yLabel: string; line?: [[number, number], [number, number]] }
  | { type: 'venn'; leftLabel: string; rightLabel: string; left: string; both: string; right: string; outside: string }
  | { type: 'table'; head: string[]; rows: string[][] }
  /** A text to read: an extract, a poem, a historical source, a scripture passage. Paragraphs are separated by a
   * blank line; single line breaks are kept (for poetry). `source` is the attribution shown underneath. */
  | { type: 'passage'; title?: string; text: string; source?: string }
  /** A code listing (pseudocode, Python, HTML), shown monospaced with its line breaks and indentation kept. */
  | { type: 'code'; code: string; language?: string }

export interface CommonError {
  /** Wrong answer values (numeric) or an expression string (expr). */
  values?: number[]
  expr?: string
  /** Stable id for the misconception, e.g. 'added-denominators'. Tracked across sessions. */
  tag: string
  message: Rich
}

export interface ItemBase {
  /** `${generatorId}@${difficulty}#${seed}` - fully reproducible. */
  id: string
  skillId: SkillId
  subject: SubjectId
  difficulty: number // 1 warm-up .. 3 standard for the year .. 5 challenge
  generatorId: string
  seed: number
  prompt: Rich
  figure?: Figure
  hint?: Rich
  /** Worked solution shown after answering. */
  explanation: Rich
}

export interface NumericField {
  label?: Rich
  prefix?: Rich
  suffix?: Rich
  answer: number
  tolerance?: number
  /** Answer must be a fraction in lowest terms (or an integer). */
  requireLowestTerms?: boolean
  /** Render this field small and raised, e.g. the exponent in 3.2 x 10^5. */
  superscript?: boolean
  /** How to show the correct answer, e.g. '5/6' (otherwise the number is formatted). Must parse back to `answer`. */
  display?: string
}

export interface NumericItem extends ItemBase {
  kind: 'numeric'
  fields: NumericField[]
  /** Optional inline layout, e.g. '{0} × 10{1}' (field 1 flagged superscript). Default: fields stacked. */
  template?: string
  keypad?: 'number' | 'fraction'
  commonErrors?: CommonError[]
}

export interface ExprItem extends ItemBase {
  kind: 'expr'
  /** Canonical expression, e.g. '3x+12'. */
  answer: string
  prefix?: Rich // e.g. 'x ='
  form?: 'any' | 'expanded' | 'simplified' | 'factorised'
  /** For 'factorised': the common factor that should be outside the bracket, e.g. '3'. */
  expectedFactor?: string
  variables: string[] // shown as keypad keys
  commonErrors?: CommonError[]
}

export interface ChoiceOption {
  id: string
  label: Rich
  correct?: boolean
  misconception?: string
  feedback?: Rich
}
export interface ChoiceItem extends ItemBase {
  kind: 'choice'
  options: ChoiceOption[]
}

export interface OrderItem extends ItemBase {
  kind: 'order'
  items: { id: string; label: Rich }[] // display order (shuffled)
  correctOrder: string[]
  directionLabel: [string, string] // e.g. ['smallest', 'largest']
}

export interface MatchItem extends ItemBase {
  kind: 'match'
  pairs: { id: string; left: Rich; right: Rich }[]
}

export interface TextItem extends ItemBase {
  kind: 'text'
  accept: string[]
  ignoreAccents?: boolean
  placeholder?: string
}

/**
 * A written answer she marks herself: she writes, then sees a model answer and a checklist of what a good answer
 * covers, and ticks the points she made. Correct when she ticks at least `passMark` of them. Used for "explain
 * why", source analysis and short paragraphs, which can't honestly be auto-marked. Her answer is kept (as the
 * attempt's `given`) for a parent to read.
 */
export interface RevealItem extends ItemBase {
  kind: 'reveal'
  /** A good answer, shown after she has written hers. */
  model: Rich
  /** What a good answer does, one point per line ("Names a cause", "Uses evidence from the source"). */
  checklist: string[]
  /** How many checklist points make it a pass. */
  passMark: number
  placeholder?: string
}

export type Item = NumericItem | ExprItem | ChoiceItem | OrderItem | MatchItem | TextItem | RevealItem

export type Answer =
  | { kind: 'numeric'; values: string[] }
  | { kind: 'expr'; value: string }
  | { kind: 'choice'; optionId: string }
  | { kind: 'order'; order: string[] }
  | { kind: 'match'; pairs: Record<string, string> }
  | { kind: 'text'; value: string }
  /** Her written answer and the indexes of the checklist points she ticked. */
  | { kind: 'reveal'; text: string; ticked: number[] }

export interface Judgement {
  correct: boolean
  /** Set if the wrong answer matched a known misconception. */
  misconception?: string
  /** Targeted feedback for that misconception (or per-option feedback). */
  feedback?: Rich
  /** Human-readable correct answer, for display and for feedback triage. */
  expected: string
  /** Readable form of what was submitted. */
  given: string
  /** True if the answer could not be parsed (empty, gibberish). UI may re-prompt instead of marking wrong. */
  unparseable?: boolean
}

export type ItemBody = DistributiveOmit<Item, 'id' | 'skillId' | 'subject' | 'difficulty' | 'generatorId' | 'seed'>
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

// ------------------------------------------------------------------- Events

export type FeedbackCategory = 'bug' | 'confusing' | 'not-taught' | 'too-hard' | 'too-easy' | 'other'
export type PlanCategory = 'frontier' | 'review' | 'gap-probe' | 'diagnostic' | 'focus' | 'fluency'
export type SessionMode = 'practice' | 'diagnostic' | 'focus' | 'sprint' | 'review'

export interface EventBase {
  id: string
  ts: number
  /** Local calendar day 'YYYY-MM-DD' at creation (kept so replay is deterministic). */
  day: string
  learnerId: LearnerId
  v: 1
  /** Private to this family member: only they (on a phone holding their key) ever receive it. Everyone else's phone neither
   * downloads nor shows it (see family/privacy.ts and supabase/schema_v3.sql). Absent = shared with the family. */
  priv?: string
}

export interface PointPart {
  code: string
  label: string
  points: number
}
export interface Award {
  total: number
  parts: PointPart[]
}

export interface ItemRef {
  itemId: string
  generatorId: string
  seed: number
  difficulty: number
}

export interface AttemptEvent extends EventBase {
  type: 'attempt'
  subject: SubjectId
  skillId: SkillId
  item: ItemRef
  gameId: GameId
  sessionId: string
  mode: SessionMode
  category: PlanCategory
  /** 1 = first try at this item; 2 = a retry after a hint. Only attempt 1 moves ability. */
  attemptNo: 1 | 2
  correct: boolean
  timeMs: number
  hintUsed: boolean
  given: string
  expected: string
  misconception?: string
  award: Award
  contentVersion: string
}

export interface FeedbackEvent extends EventBase {
  type: 'feedback'
  subject: SubjectId
  skillId: SkillId
  item: ItemRef
  gameId: GameId
  category: FeedbackCategory
  note?: string
  /** Snapshot so a report can be triaged without regenerating the question. */
  snapshot: { prompt: string; expected: string; given?: string; kind: ItemKind }
  contentVersion: string
  award: Award
}

export interface SessionEvent extends EventBase {
  type: 'session'
  sessionId: string
  subject: SubjectId
  gameId: GameId
  mode: SessionMode
  startedAt: number
  answered: number
  correct: number
  completed: boolean
  award: Award
  /** skillId -> [thetaBefore, thetaAfter] for the summary screen and parent view. */
  skillDeltas: Record<SkillId, [number, number]>
}

export interface BadgeEvent extends EventBase {
  type: 'badge'
  badgeId: string
  detail?: string
}

/** Parent-only actions. They sync like everything else. */
export interface TaughtEvent extends EventBase {
  type: 'taught'
  skillId: SkillId
  taught: boolean
}
export interface FeedbackStatusEvent extends EventBase {
  type: 'feedback-status'
  feedbackId: string
  status: 'open' | 'fixed' | 'wont-fix' | 'not-a-bug'
  /** Shown to the learner in "What's new" once fixed - closes the loop. */
  note?: string
}
export interface GoalEvent extends EventBase {
  type: 'goal'
  goalId: string
  label: string
  xpTarget: number
  active: boolean
}
export interface ProfileEvent extends EventBase {
  type: 'profile'
  name: string
  year: number
}

/**
 * One word in the spelling game reaching its end for this turn: spelt right, or skipped.
 * Only the outcome is recorded (not every keystroke), so the log stays small.
 */
export interface SpellEvent extends EventBase {
  type: 'spell'
  wordId: string
  /** 'first' = the word's turn in a round; 'retry' = asked again later in the same round after a miss. */
  ask: 'first' | 'retry'
  outcome: 'right' | 'skipped'
  /** Guesses made, including the right one. */
  tries: number
  /** How many hint steps were opened (0 = spelt from the definition alone). */
  hints: number
  ms: number
  round: string
  award: Award
}

/** Events produced by the learning games and the learner's own profile. */
export type LearningEvent =
  | AttemptEvent
  | FeedbackEvent
  | SessionEvent
  | BadgeEvent
  | TaughtEvent
  | FeedbackStatusEvent
  | GoalEvent
  | ProfileEvent
  | SpellEvent

/** Everything that can be in the log: learning events plus the family layer (calendar, tasks, trackers, coins...). */
export type AppEvent = LearningEvent | FamilyEvent

const LEARNING_TYPES: ReadonlySet<string> = new Set(['attempt', 'feedback', 'session', 'badge', 'taught', 'feedback-status', 'goal', 'profile', 'spell'])
export const isLearningEvent = (e: AppEvent): e is LearningEvent => LEARNING_TYPES.has(e.type)

// -------------------------------------------------------------- Projections

export interface SkillStats {
  skillId: SkillId
  /** Ability on the 1..5 difficulty scale: the difficulty at which she is right 50% of the time. */
  theta: number
  minTheta: number
  bestTheta: number
  /** First-try attempts counted for ability. */
  n: number
  correct: number
  /** Memory stability in days (how long until recall probability decays to 1/e). */
  stability: number
  firstTs?: number
  lastTs?: number
  /** Distinct days practised. */
  days: string[]
  /** Last few first-try outcomes, newest last. */
  recent: boolean[]
  misconceptions: Record<string, number>
  maxDifficultyCorrect: number
  /** Lower bound on ability implied by success on harder dependent skills. */
  inferredFloor: number
  /** True if flagged "not covered in class yet" (by her or by parent). */
  notTaught: boolean
  notTaughtSource?: 'learner' | 'parent'
  /** Day (YYYY-MM-DD) of the last 'personal best' award, to cap it. */
  lastPbDay?: string
}

/** What the spelling game knows about one word for one learner. Built by folding `spell` events (see spelling/model.ts). */
export interface SpellStat {
  /** 0 = brand new or keeps going wrong ... 5 = solid. Sets how soon it comes back. */
  box: number
  /** Turns it has had (first asks and retries). */
  seen: number
  right: number
  /** Spelt right first time with no help. */
  clean: number
  skips: number
  /** Clean turns in a row. */
  streak: number
  /** How the last first-ask went: c = clean, l = light help, h = heavy help, s = skipped. */
  last: 'c' | 'l' | 'h' | 's'
  firstTs: number
  lastTs: number
  /** When it is next due (ms). */
  dueTs: number
}

export interface StreakState {
  current: number
  best: number
  lastDay?: string
}

export interface FeedbackRecord {
  id: string
  ts: number
  skillId: SkillId
  subject: SubjectId
  category: FeedbackCategory
  note?: string
  item: ItemRef
  snapshot: FeedbackEvent['snapshot']
  status: FeedbackStatusEvent['status']
  resolutionNote?: string
  resolvedTs?: number
}

export interface Goal {
  id: string
  label: string
  xpTarget: number
  active: boolean
  /** XP total when the goal was created; progress = xp - baseline. */
  baseline: number
  createdTs: number
}

export interface LearnerState {
  learnerId: LearnerId
  name: string
  year: number
  skills: Record<SkillId, SkillStats>
  xp: number
  xpBySubject: Record<SubjectId, number>
  xpByDay: Record<string, number>
  attemptsByDay: Record<string, number>
  /** Per skill per day counters used for anti-grind diminishing returns. */
  skillDay: Record<string, { attempts: number; easyCorrect: number }>
  streak: StreakState
  badges: Record<string, { ts: number; detail?: string }>
  feedback: Record<string, FeedbackRecord>
  goals: Record<string, Goal>
  /** Spelling game progress per word id. */
  spelling: Record<string, SpellStat>
  feedbackAwardedByDay: Record<string, number>
  flaggedItems: Record<string, true>
  totals: { attempts: number; correct: number; sessions: number; feedback: number; bestCombo: number; timeMs: number }
  sessions: SessionEvent[]
  eventCount: number
  lastEventTs: number
}

export interface Rng {
  next(): number // [0,1)
  int(min: number, max: number): number // inclusive
  pick<T>(arr: readonly T[]): T
  shuffle<T>(arr: readonly T[]): T[]
  chance(p: number): boolean
}
