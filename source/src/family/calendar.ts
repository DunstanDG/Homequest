/**
 * The shared calendar: one function that answers "what is on for these people on this day?" by merging
 *   - calendar events (one-off and repeating),
 *   - the school layer (lessons, clubs, closures, school dates) computed from each child's school pack,
 *   - homework due dates and timed tasks,
 *   - birthdays.
 * Everything else (agenda, free-time finder, gaps, week strip) is built on top of it.
 */
import { arrivalItemsOn } from './arrival/arrival'
import { addDays, dayRange, fromMin, monthName, toMin, ymdOf } from './dates'
import { expandDates, occursOn, type RecurCtx } from './recur'
import { mealItemsOn } from './meals'
import { routineItemsOn } from './routines'
import { houseItemsOn } from './house/agenda'
import { makeSchool, type SchoolCalc } from './school/school'
import type { CalCategory, FamilyState, Hm, MemberId, TaskEvent, Ymd } from './types'
import { hopSummary, legSpan, legTitle } from './travel/travel'

export type AgendaCategory = CalCategory | 'lesson' | 'club' | 'homework' | 'closure' | 'birthday' | 'task' | 'session' | 'travel'

export interface AgendaItem {
  key: string
  source: 'cal' | 'lesson' | 'school' | 'club' | 'school-event' | 'closure' | 'task' | 'birthday' | 'arrival' | 'routine' | 'meal' | 'house' | 'travel'
  title: string
  sub?: string
  date: Ymd
  start?: Hm
  end?: Hm
  allDay: boolean
  members: MemberId[]
  everyone: boolean
  category: AgendaCategory
  busy: boolean
  location?: string
  notes?: string
  calId?: string
  taskId?: string
  taskDone?: boolean
  help?: { note: string; offers: MemberId[] }
  /** True if a parent has laid a one-day edit on top of this school-timetable item (see CalOverrideEvent). */
  overridden?: boolean
  /** Travel blocks only: the event/trip the journey serves, and whether the trains are disrupted. */
  travelRef?: string
  travelStatus?: 'planned' | 'disrupted' | 'unknown'
}

/** Sources generated fresh from the school pack rather than a persisted record - the only ones a
 * CalOverrideEvent (keyed by the item's own `key`) can apply to. */
const OVERRIDABLE_SOURCES = new Set<AgendaItem['source']>(['lesson', 'school', 'club', 'school-event', 'closure'])

/** Apply any one-day edit/cancellation laid on top of a school-timetable-derived item. Returns undefined if
 * the item should be left out entirely (cancelled). Items from any other source pass through untouched. */
function applyOverride(item: AgendaItem, overrides: Record<string, import('./types').CalOverrideEvent>): AgendaItem | undefined {
  if (!OVERRIDABLE_SOURCES.has(item.source)) return item
  const o = overrides[item.key]
  if (!o || o.cleared) return item
  if (o.cancelled) return undefined
  return {
    ...item,
    title: o.title ?? item.title,
    start: o.start ?? item.start,
    end: o.end ?? item.end,
    location: o.location ?? item.location,
    notes: o.notes ?? item.notes,
    overridden: true,
  }
}

export interface CalCtx {
  family: FamilyState
  schools: Record<MemberId, SchoolCalc>
}

export function makeCalCtx(family: FamilyState): CalCtx {
  const schools: Record<MemberId, SchoolCalc> = {}
  for (const [memberId, pack] of Object.entries(family.schools)) {
    const fix: Record<Ymd, 'A' | 'B'> = {}
    for (const [k, w] of Object.entries(family.weekFix)) if (k.startsWith(`${memberId}|`)) fix[k.slice(memberId.length + 1)] = w
    schools[memberId] = makeSchool(pack, fix)
  }
  return { family, schools }
}

/** People who can be busy or vote: active parents and children. */
export const peopleOf = (f: FamilyState): MemberId[] =>
  Object.values(f.members)
    .filter((m) => m.active && (m.role === 'parent' || m.role === 'child'))
    .map((m) => m.id)

export function recurCtxFor(ctx: CalCtx, members: MemberId[]): RecurCtx {
  const sc = members.map((m) => ctx.schools[m]).find(Boolean) ?? Object.values(ctx.schools)[0]
  if (!sc) return {}
  return { isSchoolDay: (d) => sc.isSchoolDay(d), schoolWeek: (d) => sc.weekOf(d)?.week }
}

const sortItems = (a: AgendaItem, b: AgendaItem): number => {
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1
  const s = (a.start ?? '') < (b.start ?? '') ? -1 : (a.start ?? '') > (b.start ?? '') ? 1 : 0
  return s || (a.title < b.title ? -1 : 1)
}

export interface ItemsOpts {
  /** Only items involving at least one of these people (everyone-items always match). */
  members?: MemberId[]
  /** 'lessons' lists each lesson; 'block' folds a school day into one "School 08:30-15:05" item. Default 'block'. */
  schoolDetail?: 'lessons' | 'block'
  /** Leave out homework due dates and timed tasks (used when the tasks are listed separately). */
  skipTasks?: boolean
}

export function itemsOn(ctx: CalCtx, date: Ymd, opts: ItemsOpts = {}): AgendaItem[] {
  const f = ctx.family
  const people = peopleOf(f)
  const out: AgendaItem[] = []
  const detail = opts.schoolDetail ?? 'block'

  // ---- calendar events
  for (const c of Object.values(f.cal)) {
    if (c.deleted) continue
    const members = c.everyone ? people : c.members
    let hit = false
    if (c.recur) hit = expandDates(c.recur, c.date, date, date, c.exdates, recurCtxFor(ctx, members)).length > 0
    else hit = date >= c.date && date <= (c.endDate ?? c.date) && !(c.exdates ?? []).includes(date)
    if (!hit) continue
    out.push({
      key: `cal:${c.calId}:${date}`,
      source: 'cal',
      title: c.title,
      date,
      start: c.allDay ? undefined : c.start,
      end: c.allDay ? undefined : c.end,
      allDay: c.allDay,
      members,
      everyone: !!c.everyone,
      category: c.category,
      busy: c.busy,
      location: c.location,
      notes: c.notes,
      calId: c.calId,
      help: c.help ? { note: c.help.note, offers: f.help[`${c.calId}|${date}`] ?? [] } : undefined,
    })
  }

  // ---- school layer, per child
  const closuresSeen = new Set<string>()
  for (const [memberId, sc] of Object.entries(ctx.schools)) {
    if (!f.members[memberId]?.active) continue
    const info = sc.day(date)
    if ((info.kind === 'holiday' || info.kind === 'inset') && info.label && !closuresSeen.has(info.label)) {
      closuresSeen.add(info.label)
      out.push({ key: `closure:${date}:${info.label}`, source: 'closure', title: info.kind === 'inset' ? `${info.label}: school closed` : info.label, date, allDay: true, members: people, everyone: true, category: 'closure', busy: false })
    }
    if (info.kind === 'school') {
      if (info.early) out.push({ key: `early:${memberId}:${date}`, source: 'school-event', title: info.early, date, allDay: true, members: [memberId], everyone: false, category: 'school', busy: false })
      const lessons = sc.lessons(date)
      if (detail === 'lessons') {
        for (const l of lessons) out.push({ key: `lesson:${memberId}:${date}:${l.period}`, source: 'lesson', title: l.subject, sub: `${l.room} · ${l.teacher}`, date, start: l.start, end: l.end, allDay: false, members: [memberId], everyone: false, category: 'lesson', busy: true })
      } else if (lessons.length) {
        const w = sc.weekOf(date)
        out.push({ key: `school:${memberId}:${date}`, source: 'school', title: 'School', sub: `${lessons.length} lessons${w ? ` · Week ${w.week}${w.assumed ? ' (assumed)' : ''}` : ''}`, date, start: '08:30', end: lessons[lessons.length - 1]!.end, allDay: false, members: [memberId], everyone: false, category: 'school', busy: true })
      }
      for (const c of sc.clubs(date)) out.push({ key: `club:${memberId}:${date}:${c.id}`, source: 'club', title: c.name, sub: [c.room, c.note].filter(Boolean).join(' · ') || undefined, date, start: c.start, end: c.end, allDay: false, members: [memberId], everyone: false, category: 'club', busy: true, location: c.room })
    }
    for (const e of sc.events(date)) {
      const parents = Object.values(f.members).filter((m) => m.active && m.role === 'parent').map((m) => m.id)
      out.push({ key: `sev:${memberId}:${date}:${e.title}`, source: 'school-event', title: e.title, sub: e.notes, date, start: e.time, end: e.endTime, allDay: !e.time, members: e.audience === 'parents' ? parents : [memberId], everyone: false, category: 'school', busy: false })
    }
  }

  // ---- travel planned by the home server (see family/travel)
  for (const day of Object.values(f.travel.days)) {
    if (day.date !== date || !f.members[day.memberId]?.active) continue
    for (const leg of day.legs) {
      const span = legSpan(leg)
      if (!span) continue
      out.push({
        key: `travel:${day.memberId}:${date}:${leg.key}`,
        source: 'travel',
        title: legTitle(leg),
        sub: [hopSummary(leg), leg.status === 'disrupted' ? 'disrupted' : leg.status === 'unknown' ? 'times not confirmed' : '', leg.note ?? ''].filter(Boolean).join(' · ') || undefined,
        date,
        start: span.start,
        end: span.end,
        allDay: false,
        members: [day.memberId],
        everyone: false,
        category: 'travel',
        busy: true,
        travelRef: leg.refId,
        travelStatus: leg.status,
      })
    }
  }

  // ---- birthdays
  for (const m of Object.values(f.members)) {
    if (m.active && m.birthday && m.birthday.slice(5) === date.slice(5) && m.birthday.slice(0, 4) < date.slice(0, 4)) {
      out.push({ key: `bday:${m.id}:${date}`, source: 'birthday', title: `${m.name}'s birthday`, date, allDay: true, members: people, everyone: true, category: 'birthday', busy: false })
    }
  }

  // ---- the new-baby plan: the medical milestones that fall on this day
  out.push(...arrivalItemsOn(f, date))

  // ---- tasks on the calendar: homework due dates and anything with a time
  if (!opts.skipTasks) {
    out.push(...routineItemsOn(f, date, (m) => recurCtxFor(ctx, m ? [m] : [])))
    out.push(...houseItemsOn(f, date, (m) => recurCtxFor(ctx, m ? [m] : [])))
    out.push(...mealItemsOn(f, date))
    for (const t of Object.values(f.tasks)) {
      if (t.deleted || t.dropped || !t.date) continue
      const dates = t.recur ? expandDates(t.recur, t.date, date, date, t.exdates, recurCtxFor(ctx, [t.assignee])) : t.date === date ? [date] : []
      if (!dates.length) continue
      const done = f.done[`${t.taskId}|${t.recur ? date : t.date}`]
      if (t.kind === 'homework' && !t.time) out.push({ key: `task:${t.taskId}:${date}`, source: 'task', title: `${t.subject ? `${t.subject}: ` : ''}${t.title} due`, date, allDay: true, members: [t.assignee], everyone: false, category: 'homework', busy: false, taskId: t.taskId, taskDone: !!done && done.status !== 'rejected' })
      else if (t.time) out.push({ key: `task:${t.taskId}:${date}`, source: 'task', title: t.title, date, start: t.time, end: t.minutes ? fromMin(toMin(t.time) + t.minutes) : undefined, allDay: false, members: [t.assignee], everyone: false, category: 'task', busy: false, taskId: t.taskId, taskDone: !!done && done.status !== 'rejected' })
    }
  }

  const overridden = out.map((i) => applyOverride(i, f.calOverrides)).filter((i): i is AgendaItem => !!i)
  const items = opts.members?.length ? overridden.filter((i) => i.everyone || i.members.some((m) => opts.members!.includes(m))) : overridden
  return items.sort(sortItems)
}

/** Items for a run of days (week view, month dots). */
export function itemsBetween(ctx: CalCtx, from: Ymd, to: Ymd, opts: ItemsOpts = {}): Record<Ymd, AgendaItem[]> {
  const out: Record<Ymd, AgendaItem[]> = {}
  for (const d of dayRange(from, to)) out[d] = itemsOn(ctx, d, opts)
  return out
}

// ------------------------------------------------------------------- busy & free

export interface Span {
  start: number
  end: number
}

/** Minutes-of-day intervals when this person is busy. All-day busy items block the whole day. */
export function busySpans(items: AgendaItem[], member: MemberId): Span[] {
  const spans: Span[] = []
  for (const i of items) {
    if (!i.busy || !(i.everyone || i.members.includes(member))) continue
    if (i.allDay || !i.start) spans.push({ start: 0, end: 1440 })
    else {
      const s = toMin(i.start)
      spans.push({ start: s, end: i.end ? Math.max(s + 1, toMin(i.end)) : s + 60 })
    }
  }
  return mergeSpans(spans)
}

export function mergeSpans(spans: Span[]): Span[] {
  const s = [...spans].sort((a, b) => a.start - b.start)
  const out: Span[] = []
  for (const x of s) {
    const last = out[out.length - 1]
    if (last && x.start <= last.end) last.end = Math.max(last.end, x.end)
    else out.push({ ...x })
  }
  return out
}

export interface FreeSlot {
  date: Ymd
  start: Hm
  end: Hm
  minutes: number
}

/** Gaps in `window` not covered by `busy`, at least `minMinutes` long. */
export function gapsIn(busy: Span[], window: Span, minMinutes: number): Span[] {
  const out: Span[] = []
  let cursor = window.start
  for (const b of mergeSpans(busy)) {
    if (b.end <= window.start) continue
    if (b.start >= window.end) break
    if (b.start - cursor >= minMinutes) out.push({ start: cursor, end: Math.min(b.start, window.end) })
    cursor = Math.max(cursor, b.end)
  }
  if (window.end - cursor >= minMinutes) out.push({ start: cursor, end: window.end })
  return out
}

export interface FreeOpts {
  members: MemberId[]
  from: Ymd
  days: number
  minMinutes: number
  window?: { start: Hm; end: Hm }
}

/** When is everyone in `members` free at the same time? Weekends open up automatically because there is no school in the way. */
export function freeSlots(ctx: CalCtx, o: FreeOpts): FreeSlot[] {
  const win: Span = { start: toMin(o.window?.start ?? '08:00'), end: toMin(o.window?.end ?? '20:30') }
  const out: FreeSlot[] = []
  for (let i = 0; i < o.days; i++) {
    const date = addDays(o.from, i)
    const items = itemsOn(ctx, date, { schoolDetail: 'block', skipTasks: true })
    const busy = o.members.flatMap((m) => busySpans(items, m))
    for (const g of gapsIn(busy, win, o.minMinutes)) out.push({ date, start: fromMin(g.start), end: fromMin(g.end), minutes: g.end - g.start })
  }
  return out
}

// ------------------------------------------------------------------------ tasks

export interface TaskRow {
  task: TaskEvent
  /** The occurrence date this row is for ('any' for tasks with no date). */
  date: Ymd | 'any'
  done?: import('./types').TaskDone
  overdue: boolean
  /** Days until due (negative if overdue); undefined if it has no due date. */
  dueIn?: number
  /** Homework planned for an earlier day than the one being listed, and still not done. */
  slipped?: boolean
}

const PART_ORDER = { morning: 0, day: 1, afternoon: 2, evening: 3, any: 4 } as const

/** Homework is shown from a week ahead; other one-off tasks only when due or overdue. */
export const HOMEWORK_LOOKAHEAD = 7

/** What is on this person's list for `date`: repeating tasks that fall today, one-offs that are due or overdue, and things ticked off today. */
export function tasksFor(ctx: CalCtx, memberId: MemberId, date: Ymd, now: number = Date.now()): TaskRow[] {
  const f = ctx.family
  const rc = recurCtxFor(ctx, [memberId])
  const today = ymdOf(now)
  const rows: TaskRow[] = []
  for (const t of Object.values(f.tasks)) {
    if (t.deleted || t.dropped || t.assignee !== memberId) continue
    if (t.recur) {
      if (!t.date || !occursOn(t.recur, t.date, date, rc) || (t.exdates ?? []).includes(date)) continue
      const done = f.done[`${t.taskId}|${date}`]
      rows.push({ task: t, date, done, overdue: false })
      continue
    }
    const key = t.date ?? 'any'
    const done = f.done[`${t.taskId}|${key}`]
    const doneToday = done && done.status !== 'rejected' && ymdOf(done.ts) === date
    if (done && done.status !== 'rejected' && !doneToday) continue
    if (t.date) {
      const dueIn = Math.round((Date.parse(`${t.date}T12:00:00Z`) - Date.parse(`${date}T12:00:00Z`)) / 86_400_000)
      if (t.kind === 'homework' && t.doOn && !done) {
        // Planned homework shows from its planned day (and, whatever the plan, from the day before it's due), not
        // from a week ahead - the plan is the point, so it doesn't clutter the days before it.
        if (date < t.doOn && dueIn > 1) continue
      } else {
        const look = t.kind === 'homework' ? HOMEWORK_LOOKAHEAD : 0
        if (!done && dueIn > look) continue
      }
      rows.push({ task: t, date: t.date, done, overdue: !done && dueIn < 0 && date <= today, dueIn, slipped: !done && t.kind === 'homework' && !!t.doOn && t.doOn < date && dueIn >= 0 })
    } else rows.push({ task: t, date: 'any', done, overdue: false })
  }
  return rows.sort((a, b) => Number(!!a.done) - Number(!!b.done) || Number(b.overdue) - Number(a.overdue) || PART_ORDER[a.task.part] - PART_ORDER[b.task.part] || (a.task.time ?? '99') .localeCompare(b.task.time ?? '99') || (a.dueIn ?? 99) - (b.dueIn ?? 99) || a.task.title.localeCompare(b.task.title))
}

// ------------------------------------------------------------------- help wanted

export interface HelpWanted {
  item: AgendaItem
  needed: string
  offers: MemberId[]
}

/** Events in the next `days` days where someone asked for a hand and nobody has offered yet (or which the viewer could offer for). */
export function helpWanted(ctx: CalCtx, from: Ymd, days: number, viewer?: MemberId): HelpWanted[] {
  const out: HelpWanted[] = []
  for (let i = 0; i < days; i++) {
    for (const it of itemsOn(ctx, addDays(from, i), { skipTasks: true })) {
      if (!it.help) continue
      if (viewer && it.members.length === 1 && it.members[0] === viewer && !it.everyone) {
        // it's their own request: they don't need to be nagged about it
        continue
      }
      out.push({ item: it, needed: it.help.note, offers: it.help.offers })
    }
  }
  return out
}

/** 'Mon 21 Sep' style label used by month headers. */
export const monthTitle = (d: Ymd): string => `${monthName(d, true)} ${d.slice(0, 4)}`

