/**
 * The weekly plan (/week, 0.18): one short script that replaced the weekly summit and the round table screen as places
 * to go. Most of it only reads what other screens own; the one thing it writes besides the summit's "done" marker is
 * "this week's 5" (`week-focus`): up to five things that matter this week, so everything else can wait.
 */
import type { AppEvent } from '@/engine/types'
import { makeEvent } from '@/engine/make'
import { itemsBetween, makeCalCtx, type AgendaItem } from './calendar'
import { addDays, dayName, startOfWeek, weekday } from './dates'
import { dumpList, dumpState } from './dump'
import { currentRoundTable } from './travel/roundTable'
import type { FamilyState, MemberId, TaskEvent, WeekFocusItem, Ymd } from './types'

export const WEEK_FOCUS_MAX = 5

/** The week the plan is about: this week from Monday to Thursday; from Friday on, the week ahead. */
export const planWeekOf = (today: Ymd): Ymd => (weekday(today) >= 4 ? addDays(startOfWeek(today), 7) : startOfWeek(today))

/** The same, except that once the round table has moved on to next week (it can be set to any day), so does the plan,
 * so its agenda and the rest of the steps are about the same week. */
export function planWeekFor(f: FamilyState, today: Ymd): Ymd {
  const rt = currentRoundTable(f, today)
  return rt && rt.weekOf > startOfWeek(today) ? rt.weekOf : planWeekOf(today)
}

const itemKey = (i: Pick<WeekFocusItem, 'kind' | 'ref' | 'title'>) => `${i.kind}:${i.kind === 'note' ? i.title.trim().toLowerCase() : i.ref}`

/** Save (or replace) a week's five. Blank and repeated entries are dropped and only the first five are kept. */
export function saveWeekFocus(actor: MemberId, weekOf: Ymd, items: readonly WeekFocusItem[], now = Date.now()): AppEvent[] {
  const seen = new Set<string>()
  const clean: WeekFocusItem[] = []
  for (const i of items) {
    const title = i.title.trim().slice(0, 120)
    if (!title) continue
    const k = itemKey({ ...i, title })
    if (seen.has(k)) continue
    seen.add(k)
    clean.push({ kind: i.kind, ref: i.kind === 'note' ? '' : i.ref, title })
    if (clean.length === WEEK_FOCUS_MAX) break
  }
  return [makeEvent(actor, { type: 'week-focus', weekOf, items: clean }, now)]
}

const itemsOf = (f: FamilyState, weekOf: Ymd): WeekFocusItem[] => f.weekFocus[weekOf]?.items ?? []

/** The five for the week that `today` is in (what Today can show). Empty when none were picked. */
export const weekFocusFor = (f: FamilyState, today: Ymd): WeekFocusItem[] => itemsOf(f, startOfWeek(today))

/** What the top of /week shows: the plan week's five or, from Friday until next week's are picked, this week's. */
export function shownWeekFocus(f: FamilyState, today: Ymd): { weekOf: Ymd; items: WeekFocusItem[]; which: 'this' | 'next' } | undefined {
  const plan = planWeekFor(f, today)
  const thisWeek = startOfWeek(today)
  if (itemsOf(f, plan).length) return { weekOf: plan, items: itemsOf(f, plan), which: plan === thisWeek ? 'this' : 'next' }
  if (plan !== thisWeek && itemsOf(f, thisWeek).length) return { weekOf: thisWeek, items: itemsOf(f, thisWeek), which: 'this' }
  return undefined
}

const taskDone = (f: FamilyState, t: TaskEvent) => {
  const d = f.done[`${t.taskId}|${t.date ?? 'any'}`]
  return !!d && d.status !== 'rejected'
}

/** One-off tasks that are still open: the raw material for loose ends and for the five. Shared, not private. */
const openTasks = (f: FamilyState) => Object.values(f.tasks).filter((t) => !t.deleted && !t.dropped && !t.recur && !t.priv && t.kind !== 'routine' && !taskDone(f, t))

/** Open one-off tasks from before today, oldest first: "things from before", offered a fresh start (never "overdue"). */
export const looseEnds = (f: FamilyState, today: Ymd): TaskEvent[] =>
  openTasks(f)
    .filter((t) => !!t.date && t.date < today)
    .sort((a, b) => a.date!.localeCompare(b.date!) || a.title.localeCompare(b.title) || a.taskId.localeCompare(b.taskId))

/** Is a picked thing done already (so the card can show a tick)? Events and typed-in things are never "done". */
export function focusItemDone(f: FamilyState, i: WeekFocusItem): boolean {
  if (i.kind === 'task') {
    const t = f.tasks[i.ref]
    return !!t && !t.recur && taskDone(f, t)
  }
  if (i.kind === 'dump') {
    const d = f.dump[i.ref]
    return !!d && dumpState(f, d) === 'done'
  }
  return false
}

/** Calendar items worth picking as one of the five: the family's own events, school events and closures,
 * birthdays and clean-up days. Not lessons, clubs, meals or routines, which are the shape of every week. */
const EVENT_SOURCES = new Set<AgendaItem['source']>(['cal', 'school-event', 'closure', 'birthday', 'arrival', 'house'])

/** The week at a glance: one line per day, Monday to Sunday, with only the things that make a day different (the
 * family's own events, school events and closures, birthdays, clean-up days). Always seven rows. */
export function weekGlance(f: FamilyState, weekOf: Ymd): { date: Ymd; titles: string[] }[] {
  const byDay = itemsBetween(makeCalCtx(f), weekOf, addDays(weekOf, 6))
  return [0, 1, 2, 3, 4, 5, 6].map((n) => {
    const date = addDays(weekOf, n)
    const titles: string[] = []
    for (const it of byDay[date] ?? []) if (EVENT_SOURCES.has(it.source) && !titles.includes(it.title)) titles.push(it.title)
    return { date, titles }
  })
}

export type FocusCandidate = WeekFocusItem & { key: string; sub: string }

/** Things to choose the five from, in a fixed order: the week's events by day, then tasks (this week's by day, then
 * from before, then any time), then the brain dump (in its own order, leaving out "someday" and private thoughts). */
export function focusCandidates(f: FamilyState, weekOf: Ymd, today: Ymd): { events: FocusCandidate[]; tasks: FocusCandidate[]; dump: FocusCandidate[] } {
  const weekEnd = addDays(weekOf, 6)
  const seen = new Set<string>()
  const events: FocusCandidate[] = []
  for (const [date, items] of Object.entries(itemsBetween(makeCalCtx(f), weekOf, weekEnd)).sort(([a], [b]) => a.localeCompare(b))) {
    for (const it of items) {
      if (!EVENT_SOURCES.has(it.source)) continue
      const dupe = `${date}|${it.title.toLowerCase()}`
      if (seen.has(dupe)) continue
      seen.add(dupe)
      events.push({ kind: 'event', ref: it.key, title: it.title, key: `event:${it.key}`, sub: dayName(date) })
    }
  }
  const tasks = openTasks(f)
    .filter((t) => !t.date || t.date <= weekEnd)
    .sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999') || a.title.localeCompare(b.title) || a.taskId.localeCompare(b.taskId))
    .map((t): FocusCandidate => ({
      kind: 'task',
      ref: t.taskId,
      title: t.title,
      key: `task:${t.taskId}`,
      sub: !t.date ? 'Any time' : t.date < today ? 'From before' : t.date < weekOf ? 'Before then' : dayName(t.date),
    }))
  const dump = dumpList(f, { show: 'open' })
    .filter((d) => dumpState(f, d) === 'open' && !d.priv && d.priority !== 'someday')
    .map((d): FocusCandidate => ({ kind: 'dump', ref: d.itemId, title: d.title, key: `dump:${d.itemId}`, sub: d.area ?? 'Brain dump' }))
  return { events, tasks, dump }
}

export const focusKey = itemKey
