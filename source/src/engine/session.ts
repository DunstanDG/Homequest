import type {
  Answer,
  AppEvent,
  AttemptEvent,
  Award,
  BadgeEvent,
  FeedbackCategory,
  FeedbackEvent,
  GameId,
  Item,
  Judgement,
  LearnerId,
  PointPart,
  SessionEvent,
  SessionMode,
  SkillId,
  SubjectId,
} from './types'
import { applyAttempt, isDue } from './mastery'
import { applyEvent, dayOf, project, skillOf } from './events'
import { newBadges } from './badges'
import { finaliseDiagnostic, initDiagnostic, observe, planNext, type PlannerCtx, type Planned } from './planner'
import { scoreAttempt, scoreFeedback, scoreSession } from './points'
import { formatNumber, judge, plainText } from './judge'
import { freshSeed, makeRng, uid } from './rng'
import type { Registry } from './registry'
import type { LearnerState } from './types'

/** What a Session needs from the app: read current state, and append events. */
export interface SessionStore {
  get(): LearnerState
  apply(events: AppEvent[]): void
}

/** In-memory store for tests and the triage/simulation scripts. */
export function createMemoryStore(learnerId: LearnerId, registry: Registry, initial: AppEvent[] = []): SessionStore & { events: AppEvent[] } {
  const events = [...initial]
  let state = project(learnerId, events, registry.graph)
  return {
    events,
    get: () => state,
    apply(evs) {
      for (const e of evs) {
        events.push(e)
        state = applyEvent(state, e, registry.graph)
      }
    },
  }
}

export interface SessionOptions {
  registry: Registry
  store: SessionStore
  learnerId: LearnerId
  subject: SubjectId
  gameId: GameId
  mode: SessionMode
  /** Max questions (Infinity for time-boxed games). */
  length?: number
  seed?: number
  focusSkills?: SkillId[]
  /** After a wrong first try, allow one retry with the hint revealed. */
  allowRetry?: boolean
  /** Only auto-marked questions (no written, self-marked ones) - exam conditions. Sprint and the gap finder are
   * always like this. */
  quickOnly?: boolean
  now?: () => number
}

export interface PlannedQuestion {
  planned: Planned
  item: Item
  index: number
}

export interface SubmitResult {
  judgement: Judgement
  /** Award for THIS submission. */
  award: Award
  attemptNo: 1 | 2
  /** The learner may try again (hint now available). Question is not finished yet. */
  canRetry: boolean
  /** Answer couldn't be read (blank/garbled). Nothing was recorded. */
  unparseable: boolean
  combo: number
  newBadges: string[]
  /** Ability before/after for this skill (first tries only), for "level up" flourishes. */
  theta: [number, number]
}

export interface SessionSummary {
  sessionId: string
  answered: number
  correct: number
  bestCombo: number
  xp: number
  parts: PointPart[]
  skillDeltas: Record<SkillId, [number, number]>
  newBadges: string[]
  /** Gap Finder only. */
  weak: SkillId[]
  strong: SkillId[]
  completed: boolean
}

export class Session {
  readonly id = uid('s')
  readonly startedAt: number
  readonly ctx: PlannerCtx
  private readonly o: SessionOptions
  private readonly now: () => number
  private readonly asked = new Set<string>()
  private readonly rng
  private cur?: { planned: Planned; item: Item; shownAt: number; attemptNo: 1 | 2; hintUsed: boolean; firstAttemptDone: boolean }
  private index = 0
  /** Questions in flight for games that show several at once (e.g. Equation Defence's falling meteors).
   * Independent of `cur`/`next()`/`submit()`, which stay exactly as they were for one-at-a-time shells. */
  private concurrent = new Map<string, { planned: Planned; item: Item; shownAt: number }>()
  answered = 0
  correct = 0
  combo = 0
  bestCombo = 0
  private xp = 0
  private parts: PointPart[] = []
  private skillStart: Record<SkillId, number> = {}
  private badgeIds: string[] = []
  private finished = false

  constructor(o: SessionOptions) {
    this.o = o
    this.now = o.now ?? Date.now
    this.startedAt = this.now()
    this.rng = makeRng(o.seed ?? Math.floor(Math.random() * 2 ** 31))
    const st = o.store.get()
    this.ctx = {
      subject: o.subject,
      mode: o.mode,
      now: this.startedAt,
      rng: this.rng,
      registry: o.registry,
      year: st.year,
      focusSkills: o.focusSkills,
      history: [],
    }
    if (o.mode === 'diagnostic') this.ctx.diag = initDiagnostic(st, this.ctx)
  }

  get length() {
    return this.o.length ?? 10
  }
  get done() {
    return this.answered >= this.length
  }

  /** Pick and build the next question. Returns null when the plan is exhausted. */
  next(): PlannedQuestion | null {
    if (this.finished || this.done) return null
    this.ctx.now = this.now()
    const st = this.o.store.get()
    const planned = planNext(st, this.ctx)
    if (!planned) return null
    let item: Item | undefined
    // Written, self-marked questions only in unhurried practice: not against the clock, and not in the gap finder,
    // whose verdicts need honest marking.
    const quick = this.o.mode === 'sprint' || this.o.mode === 'diagnostic' || !!this.o.quickOnly
    for (let tries = 0; tries < 12 && !item; tries++) {
      const candidate = this.o.registry.makeItem(planned.skillId, planned.difficulty, freshSeed(this.rng), { quick })
      if (!this.asked.has(candidate.id) && !st.flaggedItems[candidate.id]) item = candidate
    }
    item ??= this.o.registry.makeItem(planned.skillId, planned.difficulty, freshSeed(this.rng), { quick })
    this.asked.add(item.id)
    this.cur = { planned, item, shownAt: this.now(), attemptNo: 1, hintUsed: false, firstAttemptDone: false }
    this.index++
    return { planned, item, index: this.index }
  }

  get current() {
    return this.cur
  }

  /** Reveal the hint. Answering after a hint earns reduced credit. */
  useHint(): string | undefined {
    if (!this.cur) return undefined
    this.cur.hintUsed = true
    return this.cur.item.hint
  }

  submit(answer: Answer, timeMs?: number): SubmitResult {
    const cur = this.cur
    if (!cur) throw new Error('submit() with no current question')
    const { item, planned } = cur
    const judgement = judge(item, answer)
    const st = this.o.store.get()
    const before = skillOf(st, item.skillId)
    const noop: SubmitResult = {
      judgement,
      award: { total: 0, parts: [] },
      attemptNo: cur.attemptNo,
      canRetry: false,
      unparseable: true,
      combo: this.combo,
      newBadges: [],
      theta: [before.theta, before.theta],
    }
    if (judgement.unparseable) return noop

    const ts = this.now()
    const day = dayOf(ts)
    const attemptNo = cur.attemptNo
    const isRetry = attemptNo === 2
    const time = timeMs ?? ts - cur.shownAt
    this.skillStart[item.skillId] ??= before.theta

    const after = applyAttempt(before, {
      correct: judgement.correct,
      difficulty: item.difficulty,
      ts,
      day,
      hintUsed: cur.hintUsed,
      misconception: judgement.misconception,
      attemptNo,
    })
    const comboBefore = this.combo
    const award = scoreAttempt({
      state: st,
      before,
      after,
      difficulty: item.difficulty,
      correct: judgement.correct,
      hintUsed: cur.hintUsed,
      attemptNo,
      category: planned.category,
      mode: this.o.mode,
      combo: isRetry ? 0 : comboBefore,
      day,
      wasDue: isDue(before, ts),
      afterStruggle: before.recent.length >= 2 && before.recent.slice(-2).every((x) => !x),
      isRetry,
    })

    const ev: AttemptEvent = {
      id: uid('a'),
      ts,
      day,
      learnerId: this.o.learnerId,
      v: 1,
      type: 'attempt',
      subject: item.subject,
      skillId: item.skillId,
      item: { itemId: item.id, generatorId: item.generatorId, seed: item.seed, difficulty: item.difficulty },
      gameId: this.o.gameId,
      sessionId: this.id,
      mode: this.o.mode,
      category: planned.category,
      attemptNo,
      correct: judgement.correct,
      timeMs: time,
      hintUsed: cur.hintUsed,
      given: judgement.given,
      expected: judgement.expected,
      misconception: judgement.misconception,
      award,
      contentVersion: this.o.registry.version(item.subject),
    }
    this.o.store.apply([ev])
    this.xp += award.total
    this.parts.push(...award.parts)

    let canRetry = false
    if (!isRetry) {
      this.answered++
      cur.firstAttemptDone = true
      if (judgement.correct) {
        this.correct++
        this.combo++
        this.bestCombo = Math.max(this.bestCombo, this.combo)
      } else {
        this.combo = 0
        canRetry = !!this.o.allowRetry
        if (canRetry) cur.attemptNo = 2
      }
      observe(this.ctx, planned, judgement.correct, 1)
    }

    const badges = this.awardBadges({ attempt: ev, combo: this.combo })
    return {
      judgement,
      award,
      attemptNo,
      canRetry,
      unparseable: false,
      combo: this.combo,
      newBadges: badges,
      theta: [before.theta, skillOf(this.o.store.get(), item.skillId).theta],
    }
  }

  /** Learner flags the current question ("doesn't work", "doesn't make sense", "not covered in class"...). */
  flag(category: FeedbackCategory, note?: string, given?: string): FeedbackEvent {
    const cur = this.cur
    if (!cur) throw new Error('flag() with no current question')
    const ts = this.now()
    const day = dayOf(ts)
    const st = this.o.store.get()
    const award = scoreFeedback(st, day)
    const ev: FeedbackEvent = {
      id: uid('f'),
      ts,
      day,
      learnerId: this.o.learnerId,
      v: 1,
      type: 'feedback',
      subject: cur.item.subject,
      skillId: cur.item.skillId,
      item: { itemId: cur.item.id, generatorId: cur.item.generatorId, seed: cur.item.seed, difficulty: cur.item.difficulty },
      gameId: this.o.gameId,
      category,
      note: note?.trim() || undefined,
      snapshot: { prompt: plainText(cur.item.prompt), expected: judge(cur.item, solutionless(cur.item)).expected, given, kind: cur.item.kind },
      contentVersion: this.o.registry.version(cur.item.subject),
      award,
    }
    this.o.store.apply([ev])
    this.xp += award.total
    this.parts.push(...award.parts)
    this.awardBadges({})
    // If it was flagged before being answered, it should not count as an answered question.
    if (!cur.firstAttemptDone && this.index > 0) {
      this.index--
      this.cur = undefined
    }
    return ev
  }

  /** How many spawned questions are still in flight (unresolved). */
  get openCount() {
    return this.concurrent.size
  }

  /** Start one more question without disturbing any other in-flight one or `cur` — for games that show
   * several questions on screen at once. Each spawned question is resolved exactly once via resolve(),
   * whether answered correctly, wrongly, or left to reach the bottom unsolved. Counts toward `length`
   * the moment it is spawned, so it stops handing out new ones once enough are in flight or answered. */
  spawn(): { slotId: string; planned: Planned; item: Item } | null {
    if (this.finished || this.answered + this.concurrent.size >= this.length) return null
    this.ctx.now = this.now()
    const st = this.o.store.get()
    const planned = planNext(st, this.ctx)
    if (!planned) return null
    let item: Item | undefined
    // Several questions on screen at once, against the clock: never a written one.
    for (let tries = 0; tries < 12 && !item; tries++) {
      const candidate = this.o.registry.makeItem(planned.skillId, planned.difficulty, freshSeed(this.rng), { quick: true })
      if (!this.asked.has(candidate.id) && !st.flaggedItems[candidate.id]) item = candidate
    }
    item ??= this.o.registry.makeItem(planned.skillId, planned.difficulty, freshSeed(this.rng), { quick: true })
    this.asked.add(item.id)
    const slotId = uid('m')
    this.concurrent.set(slotId, { planned, item, shownAt: this.now() })
    this.index++
    return { slotId, planned, item }
  }

  /** Resolve one spawned question. Pass the learner's answer, or `undefined` if it reached the bottom
   * unsolved (scored as a miss, same as a wrong first attempt — no hint, no retry). Returns undefined if
   * that slot was already resolved or never existed (safe to call defensively). */
  resolve(slotId: string, answer: Answer | undefined): SubmitResult | undefined {
    const slot = this.concurrent.get(slotId)
    if (!slot) return undefined
    this.concurrent.delete(slotId)
    const { item, planned, shownAt } = slot
    const judgement = judge(item, answer ?? missedAnswerFor(item))
    if (judgement.unparseable) return undefined // shouldn't happen for a well-formed miss; never drop it silently
    const st = this.o.store.get()
    const before = skillOf(st, item.skillId)
    const ts = this.now()
    const day = dayOf(ts)
    this.skillStart[item.skillId] ??= before.theta
    const after = applyAttempt(before, { correct: judgement.correct, difficulty: item.difficulty, ts, day, hintUsed: false, misconception: judgement.misconception, attemptNo: 1 })
    const award = scoreAttempt({
      state: st,
      before,
      after,
      difficulty: item.difficulty,
      correct: judgement.correct,
      hintUsed: false,
      attemptNo: 1,
      category: planned.category,
      mode: this.o.mode,
      combo: this.combo,
      day,
      wasDue: isDue(before, ts),
      afterStruggle: before.recent.length >= 2 && before.recent.slice(-2).every((x) => !x),
      isRetry: false,
    })
    const ev: AttemptEvent = {
      id: uid('a'),
      ts,
      day,
      learnerId: this.o.learnerId,
      v: 1,
      type: 'attempt',
      subject: item.subject,
      skillId: item.skillId,
      item: { itemId: item.id, generatorId: item.generatorId, seed: item.seed, difficulty: item.difficulty },
      gameId: this.o.gameId,
      sessionId: this.id,
      mode: this.o.mode,
      category: planned.category,
      attemptNo: 1,
      correct: judgement.correct,
      timeMs: ts - shownAt,
      hintUsed: false,
      given: judgement.given,
      expected: judgement.expected,
      misconception: judgement.misconception,
      award,
      contentVersion: this.o.registry.version(item.subject),
    }
    this.o.store.apply([ev])
    this.xp += award.total
    this.parts.push(...award.parts)
    this.answered++
    if (judgement.correct) {
      this.correct++
      this.combo++
      this.bestCombo = Math.max(this.bestCombo, this.combo)
    } else {
      this.combo = 0
    }
    observe(this.ctx, planned, judgement.correct, 1)
    const badges = this.awardBadges({ attempt: ev, combo: this.combo })
    return {
      judgement,
      award,
      attemptNo: 1,
      canRetry: false,
      unparseable: false,
      combo: this.combo,
      newBadges: badges,
      theta: [before.theta, skillOf(this.o.store.get(), item.skillId).theta],
    }
  }

  private awardBadges(ctx: Parameters<typeof newBadges>[1]): string[] {
    const st = this.o.store.get()
    const fresh = newBadges(st, ctx)
    if (!fresh.length) return []
    const ts = this.now()
    const evs: BadgeEvent[] = fresh.map((b) => ({
      id: uid('b'),
      ts,
      day: dayOf(ts),
      learnerId: this.o.learnerId,
      v: 1,
      type: 'badge',
      badgeId: b.id,
      detail: b.detail,
    }))
    this.o.store.apply(evs)
    this.badgeIds.push(...fresh.map((b) => b.id))
    return fresh.map((b) => b.id)
  }

  /** Close the session: writes the session event, session-completion points and any badges. */
  finish(completed = this.done): SessionSummary {
    if (!this.finished) {
      this.finished = true
      const st = this.o.store.get()
      if (this.o.mode === 'diagnostic') finaliseDiagnostic(st, this.ctx)
      const ts = this.now()
      const award = scoreSession({ answered: this.answered, correct: this.correct, completed, mode: this.o.mode })
      const skillDeltas: Record<SkillId, [number, number]> = {}
      for (const [id, start] of Object.entries(this.skillStart)) skillDeltas[id] = [start, skillOf(st, id).theta]
      if (this.answered > 0) {
        const ev: SessionEvent = {
          id: uid('S'),
          ts,
          day: dayOf(ts),
          learnerId: this.o.learnerId,
          v: 1,
          type: 'session',
          sessionId: this.id,
          subject: this.o.subject,
          gameId: this.o.gameId,
          mode: this.o.mode,
          startedAt: this.startedAt,
          answered: this.answered,
          correct: this.correct,
          completed,
          award,
          skillDeltas,
        }
        this.o.store.apply([ev])
        this.xp += award.total
        this.parts.push(...award.parts)
        this.awardBadges({ session: ev, combo: this.bestCombo })
      }
    }
    return this.summary(completed)
  }

  summary(completed = this.done): SessionSummary {
    const st = this.o.store.get()
    const skillDeltas: Record<SkillId, [number, number]> = {}
    for (const [id, start] of Object.entries(this.skillStart)) skillDeltas[id] = [start, skillOf(st, id).theta]
    // Merge parts by code so the summary reads cleanly.
    const merged = new Map<string, PointPart>()
    for (const p of this.parts) {
      const m = merged.get(p.code)
      merged.set(p.code, m ? { ...m, points: m.points + p.points } : { ...p })
    }
    return {
      sessionId: this.id,
      answered: this.answered,
      correct: this.correct,
      bestCombo: this.bestCombo,
      xp: this.xp,
      parts: [...merged.values()].sort((a, b) => b.points - a.points),
      skillDeltas,
      newBadges: this.badgeIds,
      weak: this.ctx.diag?.weak ?? [],
      strong: this.ctx.diag?.strong ?? [],
      completed,
    }
  }
}

/** A guaranteed-wrong-but-parseable answer, for scoring a spawned question that was never attempted
 * (e.g. a meteor that reached the bottom). Must parse cleanly so the miss is recorded as a real wrong
 * attempt rather than silently dropped as "unparseable". */
function missedAnswerFor(item: Item): Answer {
  switch (item.kind) {
    case 'numeric':
      return { kind: 'numeric', values: item.fields.map((f) => formatNumber(f.answer + 1)) }
    case 'expr':
      return { kind: 'expr', value: '__missed__' }
    case 'choice':
      return { kind: 'choice', optionId: '__missed__' }
    case 'order':
      return { kind: 'order', order: [] }
    case 'match':
      return { kind: 'match', pairs: {} }
    case 'text':
      return { kind: 'text', value: '__missed__' }
    case 'reveal':
      return { kind: 'reveal', text: '(not answered in time)', ticked: [] }
  }
}

/** A dummy answer used only to read the item's expected-answer string for snapshots. */
function solutionless(item: Item): Answer {
  switch (item.kind) {
    case 'numeric':
      return { kind: 'numeric', values: item.fields.map(() => '') }
    case 'expr':
      return { kind: 'expr', value: '' }
    case 'choice':
      return { kind: 'choice', optionId: '' }
    case 'order':
      return { kind: 'order', order: [] }
    case 'match':
      return { kind: 'match', pairs: {} }
    case 'text':
      return { kind: 'text', value: '' }
    case 'reveal':
      return { kind: 'reveal', text: '', ticked: [] }
  }
}

