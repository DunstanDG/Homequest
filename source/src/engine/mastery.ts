import type { SkillId, SkillStats } from './types'

/**
 * MASTERY MODEL
 * -------------
 * Each skill has an ability estimate `theta` on the same 1..5 scale as item
 * difficulty (1 = warm-up, 3 = what the syllabus expects, 5 = challenge).
 * theta is the difficulty at which she is right ~50% of the time.
 *
 * P(correct) = logistic(K * (theta - difficulty)), updated Elo-style after every
 * first-try answer. The step size shrinks as evidence accumulates.
 *
 * On top of that sits a simple forgetting curve: every skill has a memory
 * "stability" in days. Recall probability decays as exp(-days / stability).
 * Successful spaced practice grows stability (so revision gaps stretch out);
 * failures shrink it. Decay lowers the *effective* theta, and a skill whose
 * recall drops below DUE_RECALL is flagged as due for revision.
 */

export const K = 1.5
export const THETA_START = 2.5
export const THETA_MIN = 0.5
export const THETA_MAX = 5.5
/** The planner aims for questions she gets right about this often - hard enough to learn from. */
export const TARGET_P = 0.7
export const DUE_RECALL = 0.75
export const DAY_MS = 86_400_000

export type Tier = 'new' | 'learning' | 'developing' | 'secure' | 'mastered'

export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
export const logistic = (x: number) => 1 / (1 + Math.exp(-x))

export function newSkillStats(skillId: SkillId): SkillStats {
  return {
    skillId,
    theta: THETA_START,
    minTheta: THETA_START,
    bestTheta: THETA_START,
    n: 0,
    correct: 0,
    stability: 1.5,
    days: [],
    recent: [],
    misconceptions: {},
    maxDifficultyCorrect: 0,
    inferredFloor: 0,
    notTaught: false,
  }
}

/** Probability she answers an item of the given difficulty correctly. */
export function expectedCorrect(theta: number, difficulty: number): number {
  return logistic(K * (theta - difficulty))
}

/** Difficulty at which she'd be right `p` of the time. */
export function difficultyForP(theta: number, p = TARGET_P): number {
  return theta - Math.log(p / (1 - p)) / K
}

export function retrievability(s: SkillStats, now: number): number {
  if (s.lastTs == null) return 1
  const days = Math.max(0, (now - s.lastTs) / DAY_MS)
  return Math.exp(-days / s.stability)
}

/** Ability after forgetting, and after giving benefit of the doubt for inferred skills. */
export function effectiveTheta(s: SkillStats, now: number): number {
  const base = s.n < 4 ? Math.max(s.theta, s.inferredFloor) : s.theta
  const decay = 1.2 * (1 - retrievability(s, now))
  return clamp(base - decay, THETA_MIN, THETA_MAX)
}

/** 0..1 - chance of getting a standard (difficulty 3) question right today. */
export function mastery(s: SkillStats, now: number): number {
  return logistic(K * (effectiveTheta(s, now) - 3))
}

export function tier(s: SkillStats | undefined, now: number): Tier {
  if (!s || (s.n === 0 && s.inferredFloor === 0)) return 'new'
  const m = mastery(s, now)
  if (m >= 0.9 && s.n >= 10 && s.days.length >= 3) return 'mastered'
  if (m >= 0.75 && (s.n >= 5 || s.n === 0)) return 'secure'
  if (m >= 0.5) return 'developing'
  return 'learning'
}

export function isDue(s: SkillStats | undefined, now: number): boolean {
  if (!s || s.n < 1 || s.notTaught) return false
  return retrievability(s, now) < DUE_RECALL
}

/** When (ms timestamp) this skill next drops below the revision threshold. */
export function dueAt(s: SkillStats): number | undefined {
  if (s.lastTs == null) return undefined
  return s.lastTs + s.stability * -Math.log(DUE_RECALL) * DAY_MS
}

export function recentAccuracy(s: SkillStats, window = 5): number | undefined {
  const r = s.recent.slice(-window)
  if (r.length === 0) return undefined
  return r.filter(Boolean).length / r.length
}

export interface AttemptInput {
  correct: boolean
  difficulty: number
  ts: number
  day: string
  hintUsed: boolean
  misconception?: string
  attemptNo: 1 | 2
}

/** Pure: returns updated stats. Retries (attemptNo 2) never change ability. */
export function applyAttempt(prev: SkillStats, a: AttemptInput): SkillStats {
  if (a.attemptNo !== 1) {
    return { ...prev, lastTs: a.ts }
  }
  const outcome = a.correct ? (a.hintUsed ? 0.6 : 1) : 0
  const p = expectedCorrect(prev.theta, a.difficulty)
  const step = Math.max(0.25, 1.2 / (1 + 0.3 * prev.n))
  const theta = clamp(prev.theta + step * (outcome - p), THETA_MIN, THETA_MAX)

  // Forgetting: spaced success grows stability; massed practice barely does; failure shrinks it.
  let stability = prev.stability
  if (a.correct && !a.hintUsed) {
    const gapDays = prev.lastTs == null ? 0 : (a.ts - prev.lastTs) / DAY_MS
    stability = gapDays >= 0.3 * prev.stability ? Math.min(90, stability * 1.7) : Math.min(90, stability * 1.05)
  } else if (!a.correct) {
    stability = Math.max(1, stability * 0.55)
  }

  const misconceptions = a.misconception
    ? { ...prev.misconceptions, [a.misconception]: (prev.misconceptions[a.misconception] ?? 0) + 1 }
    : prev.misconceptions

  return {
    ...prev,
    theta,
    minTheta: Math.min(prev.minTheta, theta),
    bestTheta: Math.max(prev.bestTheta, theta),
    n: prev.n + 1,
    correct: prev.correct + (a.correct ? 1 : 0),
    stability,
    firstTs: prev.firstTs ?? a.ts,
    lastTs: a.ts,
    days: prev.days.includes(a.day) ? prev.days : [...prev.days, a.day],
    recent: [...prev.recent, a.correct && !a.hintUsed].slice(-6),
    misconceptions,
    maxDifficultyCorrect: a.correct ? Math.max(prev.maxDifficultyCorrect, a.difficulty) : prev.maxDifficultyCorrect,
  }
}

export const TIER_LABEL: Record<Tier, string> = {
  new: 'Not started',
  learning: 'Learning',
  developing: 'Developing',
  secure: 'Secure',
  mastered: 'Mastered',
}
