/**
 * The small decisions behind the calm Today (0.18): which one thing is "next up", what a child may see of the family
 * brain dump, how a planning warning is put to a child, and the "First, then" pair. Pure, so it can be tested.
 */
import type { TaskRow } from './calendar'
import { hmOf, toMin, ymdOf } from './dates'
import type { DumpEvent, FamilyState, MemberId } from './types'
import type { PlanBlock } from './travel/types'

/** A timed task counts as "now" from this long before its time until this long after. */
const NOW_BEFORE_MIN = 30
const NOW_AFTER_MIN = 90

const PART_START: Record<string, number> = { morning: 6 * 60, day: 9 * 60, afternoon: 12 * 60, evening: 17 * 60 }

const open = (r: TaskRow): boolean => !r.done || r.done.status === 'rejected'

/** Smaller is sooner: something timed and current first, then what's due soonest (anything from before counts as
 * due now), then what's planned for today, then this part of the day, then the rest. */
function rank(r: TaskRow, now: number): number[] {
  const t = r.task
  const mins = toMin(hmOf(now))
  const today = ymdOf(now)
  const timedNow = !!t.time && toMin(t.time) - mins <= NOW_BEFORE_MIN && mins - toMin(t.time) <= NOW_AFTER_MIN
  const plannedToday = t.kind === 'homework' && !!t.doOn && t.doOn <= today
  const due = r.overdue || plannedToday || r.date === today ? 0 : r.dueIn !== undefined ? Math.max(0, r.dueIn) : 99
  const partStart = PART_START[t.part]
  const partNow = partStart === undefined ? 1 : partStart <= mins ? 0 : 2
  return [timedNow ? 0 : 1, due, partNow, t.time ? toMin(t.time) : 24 * 60, t.minutes ?? 30]
}

/** The open rows in the order they'd be offered one at a time. Done rows are left out. */
export function nextUpOrder(rows: readonly TaskRow[], now: number): TaskRow[] {
  const keyed = rows.filter(open).map((r) => ({ r, k: rank(r, now) }))
  keyed.sort((a, b) => {
    for (let i = 0; i < a.k.length; i++) if (a.k[i] !== b.k[i]) return a.k[i]! - b.k[i]!
    return a.r.task.title.localeCompare(b.r.task.title)
  })
  return keyed.map((x) => x.r)
}

/** The first row not skipped with "Not now" (keys are `taskId|date`). */
export function pickNext(ordered: readonly TaskRow[], skipped: ReadonlySet<string>): TaskRow | undefined {
  return ordered.find((r) => !skipped.has(rowKey(r)))
}

export const rowKey = (r: TaskRow): string => `${r.task.taskId}|${r.date}`

/** What a child may see of the family's brain dump: only things for them, or that they wrote themselves. The grown-ups'
 * admin (insurance, the hospital bag) is not a child's to carry. Everyone else sees the list as it is. */
export function dumpForViewer(f: FamilyState, items: readonly DumpEvent[], viewer: MemberId | undefined): DumpEvent[] {
  if (!viewer || f.members[viewer]?.role !== 'child') return [...items]
  return items.filter((d) => d.ownerId === viewer || d.learnerId === viewer)
}

/** A planning warning, as a child should hear it: a gap that's tight becomes a calm "X runs close to Y: Mum knows."
 * Anything else (overload, clashes) is for the grown-ups only, so undefined. */
export function childWarning(w: string, grownUps: readonly string[]): string | undefined {
  const m = /only \d+ ?min(?:ute)?s? between (.+?) and (.+?)\.?$/i.exec(w.trim())
  if (!m) return undefined
  const who = grownUps.length === 0 ? 'A grown-up knows' : grownUps.length === 1 ? `${grownUps[0]} knows` : `${grownUps.slice(0, -1).join(', ')} and ${grownUps[grownUps.length - 1]} know`
  const a = m[1]!.trim()
  const b = m[2]!.trim().replace(/^the /i, '')
  return `${a.charAt(0).toUpperCase()}${a.slice(1)} runs close to ${b}: ${who}.`
}

export interface FirstThen {
  first: string
  then: string
  emoji: string
}

/** "First: Maths sheet → Then: free time 🎮". `then` is the next free time in the day plan after now (or the one on
 * now), falling back to "something you enjoy". */
export function firstThen(first: string, blocks: readonly PlanBlock[] | undefined, now: number): FirstThen {
  const t = hmOf(now)
  const free = (blocks ?? []).filter((b) => b.kind === 'free' && b.end > t).sort((a, b) => a.start.localeCompare(b.start))[0]
  if (free) return { first, then: free.start > t ? `free time at ${free.start}` : 'free time', emoji: '🎮' }
  return { first, then: 'something you enjoy', emoji: '🌟' }
}
