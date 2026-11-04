/**
 * The parts of family/homework.ts that need nothing but the family state - which pieces are still open, and the
 * steps for a homework session - kept separate so routines.ts can use them without importing the calendar (which
 * itself imports routines.ts). homework.ts re-exports all of this.
 */
import { addDays } from './dates'
import type { FamilyState, MemberId, RoutineStep, TaskEvent, Ymd } from './types'

/** Assumed length of a piece with no estimate. */
export const DEFAULT_HOMEWORK_MIN = 30
export const minutesOf = (t: TaskEvent): number => t.minutes ?? DEFAULT_HOMEWORK_MIN

/** Has this piece been handed in? (Waiting for a parent's check counts as done; sent back does not.) */
export function homeworkDone(f: FamilyState, t: TaskEvent): boolean {
  const d = f.done[`${t.taskId}|${t.date ?? 'any'}`]
  return !!d && d.status !== 'rejected'
}

/** Every one-off homework task for this child, open ones only, soonest due first. */
export function openHomework(f: FamilyState, childId: MemberId): TaskEvent[] {
  return Object.values(f.tasks)
    .filter((t) => !t.deleted && !t.dropped && t.kind === 'homework' && t.assignee === childId && !t.recur && !homeworkDone(f, t))
    .sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999') || a.title.localeCompare(b.title))
}

/** Steps for today's homework session: pieces planned for today or earlier (slipped), then anything due tomorrow
 * that isn't planned, soonest due first. If nothing is planned at all, the three soonest-due pieces, so starting
 * the session is never a dead end; with no homework at all, one short "check for new homework" step. */
export function homeworkSessionSteps(f: FamilyState, childId: MemberId, today: Ymd): RoutineStep[] {
  const open = openHomework(f, childId)
  const tomorrow = addDays(today, 1)
  let pick = open.filter((t) => (t.doOn && t.doOn <= today) || (!t.doOn && t.date && t.date <= tomorrow))
  if (!pick.length) pick = open.slice(0, 3)
  if (!pick.length) return [{ id: `hw-check-${today}`, title: 'Check for any new homework', minutes: 5, emoji: '🔎' }]
  return pick.map((t) => ({ id: `hw-${t.taskId}`, title: t.subject ? `${t.subject}: ${t.title}` : t.title, minutes: minutesOf(t), emoji: '📚', taskId: t.taskId, notes: t.notes }))
}
