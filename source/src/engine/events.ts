import { isLearningEvent, type AppEvent, type AttemptEvent, type LearnerState, type SkillStats } from './types'
import { applyAttempt, newSkillStats, THETA_START } from './mastery'
import { levelFromXp, nextStreak } from './points'
import { applySpell } from '@/spelling/model'
import type { SkillGraph } from './skillGraph'

/** Local calendar day for a timestamp, 'YYYY-MM-DD'. */
export function dayOf(ts: number, tzOffsetMinutes?: number): string {
  const d = new Date(ts)
  if (tzOffsetMinutes == null) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  }
  return new Date(ts - tzOffsetMinutes * 60_000).toISOString().slice(0, 10)
}

export function emptyState(learnerId: string): LearnerState {
  return {
    learnerId,
    name: 'Learner',
    year: 8,
    skills: {},
    xp: 0,
    xpBySubject: {},
    xpByDay: {},
    attemptsByDay: {},
    skillDay: {},
    streak: { current: 0, best: 0 },
    badges: {},
    feedback: {},
    goals: {},
    spelling: {},
    feedbackAwardedByDay: {},
    flaggedItems: {},
    totals: { attempts: 0, correct: 0, sessions: 0, feedback: 0, bestCombo: 0, timeMs: 0 },
    sessions: [],
    eventCount: 0,
    lastEventTs: 0,
  }
}

export function skillOf(state: LearnerState, id: string): SkillStats {
  return state.skills[id] ?? newSkillStats(id)
}

/**
 * When she answers a standard-or-harder question correctly, the building blocks
 * underneath it are very likely fine. Record that as a soft floor so the
 * planner doesn't waste time re-checking them. Real evidence always overrides it.
 */
function propagateSuccess(skills: Record<string, SkillStats>, graph: SkillGraph, ev: AttemptEvent) {
  if (!ev.correct || ev.hintUsed || ev.attemptNo !== 1 || ev.item.difficulty < 3 || !graph.has(ev.skillId)) return
  for (const { skill, depth } of graph.ancestors(ev.skillId)) {
    const floor = depth === 1 ? 3.0 : 2.7
    const cur = skills[skill.id] ?? newSkillStats(skill.id)
    if (cur.inferredFloor < floor) skills[skill.id] = { ...cur, inferredFloor: floor }
  }
}

/**
 * Fold ONE event into the state. Pure: returns a new state object.
 * `graph` is optional; without it we just skip inference between skills.
 */
export function applyEvent(prev: LearnerState, ev: AppEvent, graph?: SkillGraph): LearnerState {
  const s: LearnerState = {
    ...prev,
    skills: { ...prev.skills },
    xpBySubject: { ...prev.xpBySubject },
    xpByDay: { ...prev.xpByDay },
    attemptsByDay: { ...prev.attemptsByDay },
    skillDay: { ...prev.skillDay },
    badges: { ...prev.badges },
    feedback: { ...prev.feedback },
    goals: { ...prev.goals },
    spelling: prev.spelling,
    feedbackAwardedByDay: { ...prev.feedbackAwardedByDay },
    flaggedItems: { ...prev.flaggedItems },
    totals: { ...prev.totals },
    eventCount: prev.eventCount + 1,
    lastEventTs: Math.max(prev.lastEventTs, ev.ts),
  }

  const addXp = (subject: string | undefined, day: string, total: number) => {
    s.xp += total
    s.xpByDay[day] = (s.xpByDay[day] ?? 0) + total
    if (subject) s.xpBySubject[subject] = (s.xpBySubject[subject] ?? 0) + total
  }

  switch (ev.type) {
    case 'attempt': {
      const before = skillOf(prev, ev.skillId)
      let after = applyAttempt(before, {
        correct: ev.correct,
        difficulty: ev.item.difficulty,
        ts: ev.ts,
        day: ev.day,
        hintUsed: ev.hintUsed,
        misconception: ev.misconception,
        attemptNo: ev.attemptNo,
      })
      if (ev.award.parts.some((p) => p.code === 'pb')) after = { ...after, lastPbDay: ev.day }
      s.skills[ev.skillId] = after
      if (graph) propagateSuccess(s.skills, graph, ev)

      addXp(ev.subject, ev.day, ev.award.total)
      s.streak = nextStreak(prev.streak, ev.day)
      s.attemptsByDay[ev.day] = (s.attemptsByDay[ev.day] ?? 0) + 1
      const key = `${ev.skillId}|${ev.day}`
      const sd = prev.skillDay[key] ?? { attempts: 0, easyCorrect: 0 }
      s.skillDay[key] = {
        attempts: sd.attempts + 1,
        easyCorrect: sd.easyCorrect + (ev.correct && ev.item.difficulty <= before.theta - 1.5 ? 1 : 0),
      }
      s.totals.attempts += 1
      s.totals.correct += ev.correct ? 1 : 0
      s.totals.timeMs += Math.min(ev.timeMs, 120_000)
      break
    }
    case 'feedback': {
      addXp(ev.subject, ev.day, ev.award.total)
      if (ev.award.total > 0) s.feedbackAwardedByDay[ev.day] = (s.feedbackAwardedByDay[ev.day] ?? 0) + 1
      s.totals.feedback += 1
      s.flaggedItems[ev.item.itemId] = true
      s.feedback[ev.id] = {
        id: ev.id,
        ts: ev.ts,
        skillId: ev.skillId,
        subject: ev.subject,
        category: ev.category,
        note: ev.note,
        item: ev.item,
        snapshot: ev.snapshot,
        status: 'open',
      }
      if (ev.category === 'not-taught') {
        const cur = skillOf(prev, ev.skillId)
        s.skills[ev.skillId] = { ...cur, notTaught: true, notTaughtSource: 'learner' }
      }
      break
    }
    case 'session': {
      addXp(ev.subject, ev.day, ev.award.total)
      s.totals.sessions += 1
      s.sessions = [...prev.sessions, ev].slice(-200)
      break
    }
    case 'badge': {
      s.badges[ev.badgeId] = { ts: ev.ts, detail: ev.detail }
      break
    }
    case 'taught': {
      const cur = skillOf(prev, ev.skillId)
      if (ev.taught && cur.notTaught) {
        // Once it has been taught, results from before it was taught shouldn't count against her.
        const theta = Math.max(cur.theta, THETA_START)
        s.skills[ev.skillId] = { ...cur, notTaught: false, notTaughtSource: undefined, theta, minTheta: theta, recent: [], stability: 1.5 }
      } else {
        s.skills[ev.skillId] = { ...cur, notTaught: !ev.taught, notTaughtSource: ev.taught ? undefined : 'parent' }
      }
      break
    }
    case 'feedback-status': {
      const f = prev.feedback[ev.feedbackId]
      if (f) s.feedback[ev.feedbackId] = { ...f, status: ev.status, resolutionNote: ev.note, resolvedTs: ev.ts }
      break
    }
    case 'goal': {
      const existing = prev.goals[ev.goalId]
      s.goals[ev.goalId] = {
        id: ev.goalId,
        label: ev.label,
        xpTarget: ev.xpTarget,
        active: ev.active,
        baseline: existing?.baseline ?? prev.xp,
        createdTs: existing?.createdTs ?? ev.ts,
      }
      break
    }
    case 'spell': {
      s.spelling = { ...prev.spelling, [ev.wordId]: applySpell(prev.spelling[ev.wordId], ev) }
      addXp('spelling', ev.day, ev.award.total)
      s.streak = nextStreak(prev.streak, ev.day)
      s.totals.timeMs += Math.min(ev.ms, 120_000)
      break
    }
    case 'profile': {
      s.name = ev.name
      s.year = ev.year
      break
    }
  }
  return s
}

/**
 * Replay a full event list for ONE learner (sorted by ts, then id, so every device converges).
 * The log can hold the whole family's events; only this learner's learning events are folded in.
 */
export function project(learnerId: string, events: AppEvent[], graph?: SkillGraph): LearnerState {
  const sorted = events.filter((e) => e.learnerId === learnerId && isLearningEvent(e)).sort((a, b) => a.ts - b.ts || (a.id < b.id ? -1 : 1))
  let st = emptyState(learnerId)
  for (const e of sorted) st = applyEvent(st, e, graph)
  return st
}

export function levelInfo(state: LearnerState) {
  return levelFromXp(state.xp)
}

/** Merge two event lists by id (the whole sync algorithm, really). */
export function mergeEvents(a: AppEvent[], b: AppEvent[]): AppEvent[] {
  const m = new Map<string, AppEvent>()
  for (const e of a) m.set(e.id, e)
  for (const e of b) if (!m.has(e.id)) m.set(e.id, e)
  return [...m.values()].sort((x, y) => x.ts - y.ts || (x.id < y.id ? -1 : 1))
}
