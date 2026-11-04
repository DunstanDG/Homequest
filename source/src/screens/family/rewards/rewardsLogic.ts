/**
 * Pure helpers for the rewards side of Today: what someone finished (never what they missed), the weekly thank-you,
 * the shared family goal, the "started something hard" bonus and the forgiving "N of the last 7 days" week.
 */
import { addDays, startOfWeek, ymdOf } from '@/family/dates'
import { goalTotal } from '@/family/economy'
import { makeEvent } from '@/engine/make'
import type { AppEvent } from '@/engine/types'
import type { CoinGoalEvent, FamilyState, MemberId, TaskEvent, Ymd } from '@/family/types'

export interface DoneItem {
  key: string
  emoji: string
  title: string
  ts: number
}

const TASK_EMOJI: Record<string, string> = { homework: '📚', chore: '🧹', routine: '🔁', study: '🧠', other: '⭐' }

/** Everything `memberId` finished between two timestamps: ticked tasks, finished routines or sessions, care logs. */
export function doneBetween(f: FamilyState, memberId: MemberId, from: number, to: number): DoneItem[] {
  const out: DoneItem[] = []
  const inside = (ts: number) => ts >= from && ts < to
  for (const d of Object.values(f.done)) {
    if (d.status === 'rejected' || !inside(d.ts)) continue
    if (d.by !== memberId && d.payee !== memberId) continue
    const t = f.tasks[d.taskId]
    if (!t || t.deleted) continue
    out.push({ key: d.eventId, emoji: TASK_EMOJI[t.kind] ?? '⭐', title: t.title, ts: d.ts })
  }
  for (const [runId, evs] of Object.entries(f.runs)) {
    const start = evs.find((e) => e.action === 'start')
    const end = evs[evs.length - 1]
    if (!start || !end || end.action !== 'end' || end.outcome === 'abandoned' || !inside(end.ts)) continue
    if ((start.memberId ?? start.learnerId) !== memberId) continue
    out.push({ key: `run:${runId}`, emoji: start.emoji ?? '🔁', title: start.title ?? 'A routine', ts: end.ts })
  }
  for (const p of f.pets) {
    if (p.learnerId !== memberId || p.kind === 'note' || f.voided[p.id] || !inside(p.ts)) continue
    const pet = f.members[p.petId]?.name
    out.push({ key: p.id, emoji: '🐾', title: `${pet ?? 'Pet'}: ${p.kind}`, ts: p.ts })
  }
  for (const b of f.babies) {
    if (b.learnerId !== memberId || f.voided[b.id] || !inside(b.ts)) continue
    out.push({ key: b.id, emoji: '🍼', title: `${f.members[b.babyId]?.name ?? 'Baby'}: ${b.kind}`, ts: b.ts })
  }
  return out.sort((a, b) => a.ts - b.ts)
}

const dayStart = (d: Ymd): number => new Date(`${d}T00:00:00`).getTime()

export const doneOn = (f: FamilyState, memberId: MemberId, day: Ymd): DoneItem[] => doneBetween(f, memberId, dayStart(day), dayStart(addDays(day, 1)))

/** Things handled since Monday. */
export const handledThisWeek = (f: FamilyState, memberId: MemberId, today: Ymd): number => doneBetween(f, memberId, dayStart(startOfWeek(today)), dayStart(addDays(today, 1))).length

export function weeklyLine(n: number): string | undefined {
  if (n < 3) return undefined
  return `You've handled ${n} thing${n === 1 ? '' : 's'} this week. Thank you.`
}

/** Show "Look what you did" from mid-afternoon, or as soon as one thing is done. Never with nothing to show. */
export const showDoneToday = (count: number, hour: number): boolean => count > 0 && (hour >= 15 || count >= 1)

export interface GoalProgress {
  goal: CoinGoalEvent
  total: number
  target: number
  pct: number
  label: string
}

/** The family goal closest to done (most coins in, as a share), if any. */
export function familyGoal(f: FamilyState): GoalProgress | undefined {
  const rows = Object.values(f.goals)
    .filter((g) => !g.deleted && g.targetCoins > 0)
    .map((goal) => {
      const total = goalTotal(f, goal.goalId)
      const target = goal.targetCoins
      return { goal, total, target, pct: Math.min(1, total / target), label: `${goal.emoji ? `${goal.emoji} ` : ''}${goal.title} · ${total} / ${target} 🪙` }
    })
    .sort((a, b) => b.pct - a.pct)
  return rows.find((r) => r.pct < 1) ?? rows[0]
}

// ------------------------------------------------------------------------ start bonus

export const START_BONUS = 5
export const START_BONUS_MINUTES = 30
export const startBonusId = (memberId: MemberId, day: Ymd): string => `start-bonus:${memberId}:${day}`

export interface StartInfo {
  taskId?: string
  taskDate?: string
  plannedSec: number
}

/** Does starting this focus timer count as "getting started on something hard"? A task of 30 min or more, or an overdue one. */
export function isHardStart(f: FamilyState, s: StartInfo, today: Ymd): boolean {
  const t: TaskEvent | undefined = s.taskId ? f.tasks[s.taskId] : undefined
  if (!t || t.deleted) return false
  const key = s.taskDate ?? t.date ?? 'any'
  if (f.done[`${t.taskId}|${key}`]) return false
  const long = (t.minutes ?? 0) >= START_BONUS_MINUTES || s.plannedSec >= START_BONUS_MINUTES * 60
  const overdue = !!t.date && t.date < today && !t.recur
  return long || overdue
}

/**
 * The bonus coins event for starting something hard, or none. At most one per person per day: the event id comes from
 * member + date, so two phones writing it produce the same event and the second is dropped when they sync.
 */
export function startBonusEvents(
  f: FamilyState,
  actor: MemberId,
  memberId: MemberId,
  s: StartInfo,
  now: number = Date.now(),
): AppEvent[] {
  const today = ymdOf(now)
  const id = startBonusId(memberId, today)
  if (f.adjusts.some((a) => a.id === id)) return []
  if (!isHardStart(f, s, today)) return []
  return [makeEvent(actor, { type: 'coins', memberId, delta: START_BONUS, reason: 'Getting started on something big' }, now, id)]
}

// ------------------------------------------------------------------------ forgiving week

export interface WeekDay {
  day: Ymd
  played: boolean
  today: boolean
}

/** The last 7 days (oldest first, today last) and how many had some StudyQuest. Rest days are simply rest days. */
export function lastSevenDays(played: (day: Ymd) => boolean, today: Ymd): { days: WeekDay[]; count: number } {
  const days: WeekDay[] = []
  for (let i = 6; i >= 0; i--) {
    const day = addDays(today, -i)
    days.push({ day, played: played(day), today: i === 0 })
  }
  return { days, count: days.filter((d) => d.played).length }
}

export function weekCopy(count: number, playedToday: boolean): { head: string; sub: string } {
  if (count === 0) return { head: 'A fresh start', sub: 'Fancy a quick game?' }
  return { head: `${count} of the last 7 days ⭐`, sub: playedToday ? 'Played today, lovely' : 'Fancy a quick game?' }
}
