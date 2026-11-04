/**
 * Habits inside a routine. A routine can hold a "My habits" step, which is replaced when the session starts by whichever of the
 * owner's habits are due for that part of the day (in the order of their habit list, "before you leave" ones last), and a habit can
 * be pinned to a step of its own. Ticking one of these steps writes the same `habit-done` tick as the check-in does, so a habit is
 * counted once and shows ticked in both places. The habit stays the source of truth: a habit that is in no routine still shows
 * in the check-in.
 */
import type { CheckinPart, FamilyState, MemberId, RoutineEvent, RoutineStep, Ymd } from '../types'
import { habitStatus, liveHabits } from './habits'

/** Minutes a habit takes in a routine (the suggestions know better than a flat 2). */
const MINUTES: Record<string, number> = {
  'teeth-am': 2,
  'teeth-pm': 2,
  'wash-face': 1,
  moisturise: 1,
  meditate: 5,
  floss: 1,
  skincare: 4,
  shower: 8,
  hair: 10,
  nails: 5,
  toenails: 5,
  stretch: 3,
  clothes: 3,
}
export const habitMinutes = (starterKey?: string): number => (starterKey ? MINUTES[starterKey] : undefined) ?? 2

export const stepIdForHabit = (habitId: string): string => `hb-${habitId}`

/** Does a step depend on the owner's habits (so the session has to be expanded to be shown or run)? */
export const hasHabitSteps = (steps: readonly RoutineStep[]): boolean => steps.some((s) => s.habitsSlot || s.habitId)

/**
 * The steps to show or run on `date`: a "My habits" step becomes one step per due habit that is not yet ticked, a pinned habit step
 * stays only while its habit is due and not yet ticked, and a pinned habit that has been deleted drops out. Everything else is
 * left exactly as saved.
 */
export function withHabitSteps(f: FamilyState, steps: readonly RoutineStep[], ownerId: MemberId | undefined, date: Ymd, o: { noLeaving?: boolean } = {}): RoutineStep[] {
  if (!hasHabitSteps(steps)) return [...steps]
  const pinned = new Set(steps.map((s) => s.habitId).filter((x): x is string => !!x))
  const out: RoutineStep[] = []
  for (const s of steps) {
    if (s.habitsSlot) {
      if (!ownerId) continue
      const part: CheckinPart = s.habitsSlot
      const todo = liveHabits(f, ownerId)
        .filter((h) => (h.when === part || h.when === 'either') && !pinned.has(h.habitId))
        .map((h) => habitStatus(f, h, date))
        .filter((st) => st.due && !st.done && !(o.noLeaving && st.habit.leaving))
      // The "before you leave" checklist goes last in the morning, whatever order the habits are in.
      const ordered = [...todo.filter((st) => !st.habit.leaving), ...todo.filter((st) => st.habit.leaving)]
      for (const st of ordered) {
        out.push({ id: stepIdForHabit(st.habit.habitId), title: st.habit.title, minutes: habitMinutes(st.habit.starterKey), emoji: st.habit.emoji, habitId: st.habit.habitId })
      }
      continue
    }
    if (s.habitId) {
      const h = f.habits[s.habitId]
      if (!h || h.deleted) continue
      const st = habitStatus(f, h, date)
      if (!st.due || st.done) continue
    }
    out.push(s)
  }
  return out
}

/** Is this a session for days off (weekends and holidays)? */
export const isOffDaySession = (r: Pick<RoutineEvent, 'recur'>): boolean =>
  !!r.recur?.offDaysOnly || (!!r.recur?.byWeekday && r.recur.byWeekday.length === 2 && r.recur.byWeekday.includes(5) && r.recur.byWeekday.includes(6))

/** Whether the "before you leave" checklist is left out of days off: when the person said they have no time to be out by. */
export const noLeavingOnDaysOff = (f: FamilyState, memberId: MemberId | undefined): boolean => {
  const plan = memberId ? f.routinePlans?.[memberId] : undefined
  return !!plan && !plan.weekend.leave
}
