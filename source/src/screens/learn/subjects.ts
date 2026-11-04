import type { Registry } from '@/engine/registry'
import { skillRows, type SkillRow } from '@/engine/report'
import { dayOf } from '@/engine/events'
import type { LearnerState, SubjectId } from '@/engine/types'
import type { GameDef } from '@/games/types'

/** The Learn tab can focus one subject, or 'all' for the mixed daily quest. Stored in settings.subject: any value
 * that isn't a pack id (including 'all') makes `useSubject()` fall back to the first pack for Skills/Progress. */
export const ALL = 'all'
export type Focus = SubjectId | typeof ALL

/** Packs don't carry an emoji, so the Learn grid keeps its own (fallback: first letter of the name). */
const SUBJECT_EMOJI: Record<string, string> = {
  maths: '🔢',
  english: '📖',
  science: '🔬',
  history: '🏛️',
  geography: '🌍',
  computing: '💻',
  german: '🇩🇪',
}
/** Tile labels short enough for a quarter of a phone screen. */
const SHORT: Record<string, string> = { computing: 'Computing', geography: 'Geography' }
export const subjectShort = (id: string, name: string): string => SHORT[id] ?? name

export const subjectEmoji = (id: string, name: string): string => SUBJECT_EMOJI[id] ?? name.charAt(0)

/** Games that only make sense in some subjects (anything not listed works in every subject). */
const GAME_SUBJECTS: Record<string, SubjectId[]> = {
  // Equation Defence drops times-table facts (its defaultFocus is maths.f.times-tables).
  meteors: ['maths'],
}
export const gameFits = (g: GameDef, focus: Focus): boolean => focus === ALL || !GAME_SUBJECTS[g.id] || GAME_SUBJECTS[g.id]!.includes(focus)
/** Which subject to launch a game in when the focus is 'all'. */
export const gameSubject = (g: GameDef, focus: Focus, mixedPick: SubjectId): SubjectId => (focus !== ALL ? focus : GAME_SUBJECTS[g.id]?.[0] ?? mixedPick)
/** Spelling is an English activity. */
export const spellingFits = (focus: Focus): boolean => focus === ALL || focus === 'english'

export interface SubjectProgress {
  id: SubjectId
  /** Year 7/8 syllabus skills that have content. */
  total: number
  /** Of those, secure or mastered. */
  secure: number
  /** Started (anything above 'new'). */
  started: number
  due: number
  /** Most recent session in this subject. */
  lastTs?: number
  playedToday: boolean
}

/** One pass over the whole skill graph, grouped by subject. */
export function subjectProgress(state: LearnerState, registry: Registry, now: number): Map<SubjectId, SubjectProgress> {
  const today = dayOf(now)
  const out = new Map<SubjectId, SubjectProgress>()
  for (const id of registry.packs.keys()) out.set(id, { id, total: 0, secure: 0, started: 0, due: 0, playedToday: false })
  for (const r of skillRows(state, registry, now)) {
    if (!r.hasContent) continue
    const p = out.get(r.skill.subject)
    if (!p) continue
    if (r.due && !r.notTaught) p.due++
    if (r.skill.origin !== 'syllabus') continue
    p.total++
    if (r.tier === 'secure' || r.tier === 'mastered') p.secure++
    if (r.tier !== 'new') p.started++
  }
  for (const s of state.sessions) {
    const p = out.get(s.subject)
    if (!p) continue
    if (!p.lastTs || s.ts > p.lastTs) p.lastTs = s.ts
    if (dayOf(s.ts) === today) p.playedToday = true
  }
  return out
}

/** The subject the mixed daily quest plays next: most revision due among subjects not played today, otherwise the
 * one left longest. Re-evaluated after every round, so the quest naturally rotates through the subjects. */
export function mixedPick(progress: Map<SubjectId, SubjectProgress>, order: SubjectId[]): SubjectId {
  const list = order.map((id) => progress.get(id)).filter((p): p is SubjectProgress => !!p)
  const fresh = list.filter((p) => !p.playedToday)
  const pool = fresh.length ? fresh : list
  const withDue = pool.filter((p) => p.due > 0).sort((a, b) => b.due - a.due)
  if (withDue[0]) return withDue[0].id
  const byAge = [...pool].sort((a, b) => (a.lastTs ?? 0) - (b.lastTs ?? 0))
  return (byAge[0]?.id ?? order[0]) as SubjectId
}

/** Started skills with the lowest mastery (the parent view's "could use a hand"). */
export function weakestSkills(state: LearnerState, registry: Registry, now: number, n = 3): SkillRow[] {
  return skillRows(state, registry, now)
    .filter((r) => r.hasContent && !r.notTaught && r.stats && r.stats.n >= 3 && (r.tier === 'learning' || r.tier === 'developing'))
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, n)
}

/** Sessions per subject over the last `days` days, busiest first. */
export function recentSubjects(state: LearnerState, now: number, days = 7): { subject: SubjectId; sessions: number }[] {
  const since = now - days * 86_400_000
  const by = new Map<SubjectId, number>()
  for (const s of state.sessions) if (s.ts >= since) by.set(s.subject, (by.get(s.subject) ?? 0) + 1)
  return [...by.entries()].map(([subject, sessions]) => ({ subject, sessions })).sort((a, b) => b.sessions - a.sessions)
}
