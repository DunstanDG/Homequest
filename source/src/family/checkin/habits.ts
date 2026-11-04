/**
 * Personal care habits: meditate, moisturise, cut nails. Each person has their own list, each habit says which check-in it
 * belongs to (morning, evening or either) and how often (every day, every 2 weeks for nails, certain weekdays). A habit that
 * is not due is folded away rather than nagging. A tick is appended, so it can be undone, and can be for an earlier day.
 */
import { addDays, daysBetween, weekday, ymdOf } from '../dates'
import type { CheckinPart, FamilyState, HabitDoneEvent, HabitEvent, HabitWhen, MemberId, Ymd } from '../types'

export interface StarterHabit {
  key: string
  title: string
  emoji: string
  when: HabitWhen
  everyDays: number
  weekdays?: number[]
  /** Offered ticked in the first-time picker. */
  preset?: boolean
}

/** Suggestions, shown when someone sets up their habits. They are copied into the person's own list, which they then edit. */
export const STARTER_HABITS: StarterHabit[] = [
  { key: 'teeth-am', title: 'Brush teeth (morning)', emoji: '🪥', when: 'morning', everyDays: 1, preset: true },
  { key: 'teeth-pm', title: 'Brush teeth (evening)', emoji: '🪥', when: 'evening', everyDays: 1, preset: true },
  { key: 'wash-face', title: 'Wash face', emoji: '🧼', when: 'morning', everyDays: 1 },
  { key: 'moisturise', title: 'Moisturise', emoji: '🧴', when: 'either', everyDays: 1 },
  { key: 'meditate', title: 'Meditate', emoji: '🧘', when: 'morning', everyDays: 1 },
  { key: 'floss', title: 'Floss', emoji: '🦷', when: 'evening', everyDays: 1 },
  { key: 'skincare', title: 'Skincare routine', emoji: '✨', when: 'evening', everyDays: 1 },
  { key: 'shower', title: 'Shower or bath', emoji: '🚿', when: 'either', everyDays: 2 },
  { key: 'hair', title: 'Wash hair', emoji: '💆', when: 'either', everyDays: 3 },
  { key: 'nails', title: 'Cut fingernails', emoji: '✂️', when: 'either', everyDays: 14 },
  { key: 'toenails', title: 'Cut toenails', emoji: '🦶', when: 'either', everyDays: 28 },
  { key: 'stretch', title: 'Stretch', emoji: '🤸', when: 'morning', everyDays: 1 },
  { key: 'clothes', title: 'Lay out clothes for tomorrow', emoji: '👕', when: 'evening', everyDays: 1 },
]

export const liveHabits = (f: FamilyState, memberId: MemberId): HabitEvent[] =>
  Object.values(f.habits)
    .filter((h) => !h.deleted && h.memberId === memberId)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title) || (a.habitId < b.habitId ? -1 : 1))

/** Every tick of this habit that still stands, newest day first. */
export const habitTicks = (f: FamilyState, habitId: string): HabitDoneEvent[] =>
  (f.habitDone[habitId] ?? []).filter((e) => !f.voided[e.id]).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.at - a.at))

export const habitDoneOn = (f: FamilyState, habitId: string, date: Ymd): HabitDoneEvent | undefined => habitTicks(f, habitId).find((e) => e.date === date)

/** The latest day before `date` it was done. */
export const lastDoneBefore = (f: FamilyState, habitId: string, date: Ymd): Ymd | undefined => habitTicks(f, habitId).find((e) => e.date < date)?.date

export interface HabitStatus {
  habit: HabitEvent
  /** Ticked for this day. */
  done: boolean
  tickId?: string
  /** It falls on this day (ignoring today's tick). */
  due: boolean
  lastDone?: Ymd
  /** Days until it is next due, when it is not due now. */
  dueIn?: number
}

export function habitStatus(f: FamilyState, h: HabitEvent, date: Ymd): HabitStatus {
  const tick = habitDoneOn(f, h.habitId, date)
  const last = lastDoneBefore(f, h.habitId, date)
  if (h.weekdays?.length) {
    const days = [...h.weekdays].sort((a, b) => a - b)
    const wd = weekday(date)
    const due = days.includes(wd)
    const next = days.find((d) => d > wd) ?? days[0]! + 7
    return { habit: h, done: !!tick, tickId: tick?.id, due, lastDone: last, dueIn: due ? undefined : next - wd }
  }
  const every = Math.max(1, Math.round(h.everyDays || 1))
  const gap = last ? daysBetween(last, date) : undefined
  const due = gap == null || gap >= every
  return { habit: h, done: !!tick, tickId: tick?.id, due, lastDone: last, dueIn: due ? undefined : every - (gap ?? 0) }
}

export interface HabitsForPart {
  /** Due (or already ticked) and belonging to this check-in. */
  shown: HabitStatus[]
  /** Belonging to this check-in but not due today: folded away. */
  later: HabitStatus[]
}

export function habitsForPart(f: FamilyState, memberId: MemberId, part: CheckinPart, date: Ymd): HabitsForPart {
  const mine = liveHabits(f, memberId).filter((h) => h.when === part || h.when === 'either')
  const all = mine.map((h) => habitStatus(f, h, date))
  return { shown: all.filter((s) => s.due || s.done), later: all.filter((s) => !s.due && !s.done) }
}

/** "Every day", "Every 2 weeks", "Mon, Wed, Fri". */
export function habitRepeatLabel(h: Pick<HabitEvent, 'everyDays' | 'weekdays'>): string {
  if (h.weekdays?.length)
    return [...h.weekdays]
      .sort((a, b) => a - b)
      .map((d) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d])
      .join(', ')
  const n = h.everyDays
  if (n <= 1) return 'Every day'
  if (n === 7) return 'Every week'
  if (n % 7 === 0) return `Every ${n / 7} weeks`
  if (n === 30) return 'Every month'
  return `Every ${n} days`
}

/** "last done 3 days ago" / "due in 4 days". */
export function habitNote(s: HabitStatus, today: Ymd): string {
  if (s.dueIn != null) return `Due in ${s.dueIn} day${s.dueIn === 1 ? '' : 's'}`
  if (!s.lastDone) return 'Not done yet'
  const n = daysBetween(s.lastDone, today)
  return n === 1 ? 'Last done yesterday' : `Last done ${n} days ago`
}

/** Days from today that a habit tick may be logged for: today or the day before (a check-in is about now or last night). */
export const tickDays = (today: Ymd): Ymd[] => [today, addDays(today, -1)]

export const dayOfTs = (ts: number): Ymd => ymdOf(ts)
