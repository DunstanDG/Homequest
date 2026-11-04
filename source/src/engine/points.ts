import type { Award, LearnerState, PlanCategory, PointPart, SessionMode, SkillStats, StreakState } from './types'
import { expectedCorrect } from './mastery'

/**
 * POINTS (XP) - one currency across every subject and game.
 *
 * Design goals:
 *  1. Reward effort AND improvement against her own past, not just being good.
 *  2. Reward coming back: spaced revision, retrying things she got wrong, daily habit.
 *  3. Resist grinding: easy repeats and huge single-skill binges pay less.
 *  4. Be transparent: every award is a list of named parts shown on the summary
 *     screen and in the parent view. No hidden maths.
 *
 * Awards are computed once, at the moment of the attempt, and stored inside the
 * event. Changing these rules later never rewrites history.
 */

export const DIFFICULTY_BASE: Record<number, number> = { 1: 10, 2: 13, 3: 15, 4: 20, 5: 25 }

export function baseFor(difficulty: number): number {
  return DIFFICULTY_BASE[Math.min(5, Math.max(1, Math.round(difficulty)))] ?? 15
}

// ----------------------------------------------------------------- levels

/** Total XP needed to reach level L. L2=100, L3=300, L4=600, L5=1000, L10=4500. */
export const xpToReach = (level: number) => 50 * (level - 1) * level

export function levelFromXp(xp: number): { level: number; into: number; span: number; progress: number } {
  let level = Math.max(1, Math.floor((1 + Math.sqrt(1 + (4 * Math.max(0, xp)) / 50)) / 2))
  while (xpToReach(level + 1) <= xp) level++
  while (level > 1 && xpToReach(level) > xp) level--
  const floor = xpToReach(level)
  const span = xpToReach(level + 1) - floor
  return { level, into: xp - floor, span, progress: (xp - floor) / span }
}

// ------------------------------------------------------------------ streak

export function daysBetween(a: string, b: string): number {
  const da = Date.parse(a + 'T00:00:00Z')
  const db = Date.parse(b + 'T00:00:00Z')
  return Math.round((db - da) / 86_400_000)
}

/**
 * Gentle streak: it survives ONE missed day (gap of up to 2 days), because a
 * strict streak punishes a busy weekend and makes practice feel like a chore.
 */
export function nextStreak(prev: StreakState, day: string): StreakState {
  if (prev.lastDay === day) return prev
  let current = 1
  if (prev.lastDay) {
    const gap = daysBetween(prev.lastDay, day)
    if (gap < 0) return prev
    current = gap <= 2 ? prev.current + 1 : 1
  }
  return { current, best: Math.max(prev.best, current), lastDay: day }
}

// ------------------------------------------------------------ attempt score

export interface ScoreInput {
  state: LearnerState
  before: SkillStats
  after: SkillStats
  difficulty: number
  correct: boolean
  hintUsed: boolean
  attemptNo: 1 | 2
  category: PlanCategory
  mode: SessionMode
  /** Consecutive correct answers immediately before this one in this session. */
  combo: number
  day: string
  /** Was the skill due for revision when asked? */
  wasDue: boolean
  /** Did this attempt follow >=2 recent misses on the skill? */
  afterStruggle: boolean
  /** Did she just fail this same item (i.e. this is the retry)? */
  isRetry: boolean
}

export function scoreAttempt(i: ScoreInput): Award {
  const parts: PointPart[] = []
  const add = (code: string, label: string, points: number) => {
    if (points !== 0) parts.push({ code, label, points: Math.round(points) })
  }

  const skillDay = i.state.skillDay[`${i.before.skillId}|${i.day}`] ?? { attempts: 0, easyCorrect: 0 }

  // Diagnostics are about finding gaps, so trying earns points even when it's wrong.
  if (i.mode === 'diagnostic') {
    add('explorer', 'Explorer: every answer helps map your skills', 3)
  }

  if (i.correct) {
    let base = baseFor(i.difficulty)
    if (i.hintUsed) base *= 0.5
    if (i.isRetry) base *= 0.5

    // Anti-grind: piles of easy repeats on one skill and daily binges pay less.
    const tooEasy = i.difficulty <= i.before.theta - 1.5
    if (tooEasy && skillDay.easyCorrect >= 5) base *= 0.4
    else if (skillDay.attempts >= 25) base *= 0.5

    add('base', i.isRetry ? 'Second try' : i.hintUsed ? 'Correct (with hint)' : 'Correct', base)

    if (i.combo >= 3 && !i.isRetry) {
      const mult = Math.min(0.5, 0.1 * (i.combo - 2))
      add('combo', `Combo x${i.combo + 1}`, base * mult)
    }

    if (!i.isRetry && !i.hintUsed) {
      if (i.difficulty >= i.before.theta + 0.75) add('stretch', 'Stretch: harder than your usual level', 6)
      if (i.wasDue && i.category === 'review') add('revision', 'Revision: remembered it after a break', 8)
      if (i.category === 'gap-probe') add('foundation', 'Foundation check', 5)
      if (
        i.attemptNo === 1 &&
        i.after.n >= 3 &&
        i.after.theta >= i.before.bestTheta + 0.2 &&
        i.after.lastPbDay !== i.day &&
        i.before.lastPbDay !== i.day
      ) {
        add('pb', 'New personal best on this skill', 12)
      }
    }

    if (i.afterStruggle && !i.isRetry) add('comeback', 'Bounce back after a tricky patch', 10)
    if (i.isRetry) add('fixed', 'Fixed it on the second try', 3)
  } else if (i.mode !== 'diagnostic') {
    // Effort points only for honest attempts; keeps "try again" cheap emotionally.
    add('effort', 'Good try', 2)
  }

  // First activity of a new day: daily bonus scaled by streak (capped).
  const isFirstToday = i.state.streak.lastDay !== i.day
  if (isFirstToday) {
    const streak = nextStreak(i.state.streak, i.day).current
    add('daily', streak > 1 ? `Daily bonus: ${streak}-day streak` : 'Daily bonus', 5 + 2 * Math.min(streak, 10))
  }

  return { total: parts.reduce((s, p) => s + p.points, 0), parts }
}

export const FEEDBACK_AWARD = 3
export const FEEDBACK_DAILY_CAP = 3

export function scoreFeedback(state: LearnerState, day: string): Award {
  const used = state.feedbackAwardedByDay[day] ?? 0
  if (used >= FEEDBACK_DAILY_CAP) return { total: 0, parts: [] }
  return { total: FEEDBACK_AWARD, parts: [{ code: 'feedback', label: 'Thanks for the feedback', points: FEEDBACK_AWARD }] }
}

export function scoreSession(opts: { answered: number; correct: number; completed: boolean; mode: SessionMode }): Award {
  const parts: PointPart[] = []
  if (opts.completed && opts.answered >= 5) {
    parts.push({ code: 'finish', label: 'Session complete', points: 10 })
    if (opts.mode === 'diagnostic') parts.push({ code: 'map', label: 'Skill map explored', points: 20 })
    if (opts.correct / Math.max(1, opts.answered) >= 0.8) parts.push({ code: 'sharp', label: 'Sharp: 80%+ correct', points: 10 })
  }
  return { total: parts.reduce((s, p) => s + p.points, 0), parts }
}

/** Convenience for UI/tests: expected chance of being right on this item. */
export const chanceRight = expectedCorrect
