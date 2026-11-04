/**
 * Homework: keeping a school-age child on top of it, from "was anything set today?" through "when will I do it?" to
 * "is anything about to slip?". Pure logic over the family state and the school timetable (no React), same as the
 * rest of family/. Homework itself is still an ordinary task (kind 'homework': `date` is the due date) - this adds:
 *
 *  - a planned day (`doOn`) separate from the due date, and a suggestion for it that looks at the child's free time
 *    after school (clubs and busy calendar items count against it) and at homework already planned for each day;
 *  - the after-school check-in: which subjects the child actually had today, so they can say "nothing" or add what
 *    was set with the subject and a sensible due date already filled in;
 *  - the "nothing logged for Science this week?" nudge, from the school's own rule of which subjects set homework
 *    in Week A and Week B;
 *  - a one-glance summary for parents, the steps for a daily homework session, and when to warn that a piece due
 *    tomorrow still isn't done.
 */
import { busySpans, gapsIn, itemsOn, type CalCtx } from './calendar'
import { addDays, dayRange, startOfWeek, toMin, tsOf, weekday, ymdOf } from './dates'
import type { SchoolPack } from './school/types'
import { DEFAULT_HOMEWORK_MIN, homeworkDone, minutesOf, openHomework } from './homeworkCore'
import type { FamilyState, Hm, MemberId, TaskEvent, Ymd } from './types'

export { DEFAULT_HOMEWORK_MIN, homeworkDone, homeworkSessionSteps, openHomework } from './homeworkCore'

/** When homework can realistically happen: after school on a school day (or any weekday out of term), and a
 * daytime window at weekends. Used only to judge how much room a day has, never to schedule a time. */
export const HOMEWORK_WINDOW_WEEKDAY = { start: '16:00', end: '20:00' } as const
export const HOMEWORK_WINDOW_WEEKEND = { start: '10:00', end: '18:00' } as const
/** Don't plan more than this much homework onto one day when suggesting (a child can still choose to). */
export const DAILY_HOMEWORK_CAP_MIN = 90
/** The after-school check-in shows from the end of the last lesson until this time. */
export const CHECKIN_UNTIL: Hm = '21:00'
/** Parents (and the child) get the "due tomorrow, not done" warning at this time the evening before. */
export const AT_RISK_ALERT_AT: Hm = '18:00'

const same = (a?: string, b?: string): boolean => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase()

// ------------------------------------------------------------------ room in a day, and planning a piece onto one

/** Free minutes in the homework window on `date`, after school, clubs and anything busy on the calendar. */
export function freeHomeworkMinutes(ctx: CalCtx, childId: MemberId, date: Ymd): number {
  const w = weekday(date) > 4 ? HOMEWORK_WINDOW_WEEKEND : HOMEWORK_WINDOW_WEEKDAY
  const busy = busySpans(itemsOn(ctx, date, { members: [childId], skipTasks: true }), childId)
  return gapsIn(busy, { start: toMin(w.start), end: toMin(w.end) }, 15).reduce((s, g) => s + (g.end - g.start), 0)
}

/** Minutes of homework already planned for `date` (not yet done), optionally leaving one task out. */
export function plannedHomeworkMinutes(f: FamilyState, childId: MemberId, date: Ymd, exceptTaskId?: string): number {
  return openHomework(f, childId)
    .filter((t) => t.doOn === date && t.taskId !== exceptTaskId)
    .reduce((s, t) => s + minutesOf(t), 0)
}

export interface DoOnSuggestion {
  date: Ymd
  /** Why this day, in words for the form: "free evening", "fits with 30 min already planned", ... */
  reason: string
}

/**
 * The day to suggest doing a piece on: the earliest day from today up to the day before it's due with room for it
 * (free time after clubs and busy items, kept under DAILY_HOMEWORK_CAP_MIN including what's already planned that
 * day) - earliest so it's done well before the deadline, and the cap is what spreads several pieces over the week.
 * If no day has room, the roomiest one. Today is skipped once its homework window has passed.
 */
export function suggestDoOn(
  ctx: CalCtx,
  childId: MemberId,
  due: Ymd,
  minutes = DEFAULT_HOMEWORK_MIN,
  now = Date.now(),
  exceptTaskId?: string,
  /** Minutes per day planned in the same batch but not saved yet (see planUnplanned). */
  extraPlanned: Record<Ymd, number> = {},
): DoOnSuggestion {
  const today = ymdOf(now)
  const windowEnd = weekday(today) > 4 ? HOMEWORK_WINDOW_WEEKEND.end : HOMEWORK_WINDOW_WEEKDAY.end
  const first = now > tsOf(today, windowEnd) - 30 * 60_000 ? addDays(today, 1) : today
  const last = addDays(due, -1)
  if (last < first) return { date: due <= today ? today : first > due ? due : first, reason: due <= today ? 'due today' : 'due very soon' }
  let best: { date: Ymd; room: number } | undefined
  for (const d of dayRange(first, last)) {
    const free = freeHomeworkMinutes(ctx, childId, d)
    const planned = plannedHomeworkMinutes(ctx.family, childId, d, exceptTaskId) + (extraPlanned[d] ?? 0)
    const room = Math.min(free, DAILY_HOMEWORK_CAP_MIN) - planned
    if (room >= minutes) return { date: d, reason: planned ? `fits with ${planned} min already planned` : free >= 120 ? 'free evening' : `${free} min free` }
    if (!best || room > best.room) best = { date: d, room }
  }
  return { date: best!.date, reason: 'busiest week - this day has the most room' }
}

/** A planned day for every open piece that doesn't have one, soonest due first so the urgent ones get the early
 * days, each suggestion taking the ones before it into account. Pieces already late are left alone. */
export function planUnplanned(ctx: CalCtx, childId: MemberId, now = Date.now()): { task: TaskEvent; doOn: DoOnSuggestion }[] {
  const today = ymdOf(now)
  const extra: Record<Ymd, number> = {}
  const out: { task: TaskEvent; doOn: DoOnSuggestion }[] = []
  for (const t of openHomework(ctx.family, childId)) {
    if (t.doOn || !t.date || t.date < today) continue
    const s = suggestDoOn(ctx, childId, t.date, minutesOf(t), now, t.taskId, extra)
    extra[s.date] = (extra[s.date] ?? 0) + minutesOf(t)
    out.push({ task: t, doOn: s })
  }
  return out
}

// ------------------------------------------------------------------ the after-school check-in

/** Subjects the child had today, in timetable order, each once. */
export function lessonSubjectsOn(ctx: CalCtx, childId: MemberId, date: Ymd): string[] {
  const school = ctx.schools[childId]
  if (!school) return []
  return [...new Set(school.lessons(date).map((l) => l.subject))]
}

/** When today's last lesson ends (the check-in shows from then), or undefined on a non-school day. */
export function schoolEndsAt(ctx: CalCtx, childId: MemberId, date: Ymd): Hm | undefined {
  const lessons = ctx.schools[childId]?.lessons(date) ?? []
  return lessons.length ? lessons[lessons.length - 1]!.end : undefined
}

/** The next school day after `after` with a lesson in `subject` - the natural default due date for homework set in
 * that subject today. Falls back to a week on if the subject isn't on the timetable in the next three weeks. */
export function nextLessonOf(ctx: CalCtx, childId: MemberId, subject: string, after: Ymd): Ymd {
  const school = ctx.schools[childId]
  if (school) {
    for (let i = 1; i <= 21; i++) {
      const d = addDays(after, i)
      if (school.lessons(d).some((l) => same(l.subject, subject))) return d
    }
  }
  return addDays(after, 7)
}

export interface CheckinPrompt {
  date: Ymd
  /** Today's lesson subjects still to answer for: not yet logged today, not already said "none". */
  subjects: string[]
  /** Subjects that already have homework logged today (set today or added today). */
  logged: string[]
}

/** Whether to show the after-school check-in now, and for which subjects. Undefined outside the window, on a
 * non-school day, without a school timetable, or once the child has done today's check-in. */
export function checkinPrompt(ctx: CalCtx, childId: MemberId, now = Date.now()): CheckinPrompt | undefined {
  const date = ymdOf(now)
  const ends = schoolEndsAt(ctx, childId, date)
  if (!ends || now < tsOf(date, ends) || now > tsOf(date, CHECKIN_UNTIL)) return undefined
  const rec = ctx.family.hwCheckins[`${childId}|${date}`]
  if (rec && !rec.partial) return undefined
  const saidNone = new Set((rec?.none ?? []).map((x) => x.toLowerCase()))
  const all = lessonSubjectsOn(ctx, childId, date).filter((s) => !saidNone.has(s.toLowerCase()))
  const loggedToday = Object.values(ctx.family.tasks).filter((t) => !t.deleted && !t.dropped && t.kind === 'homework' && t.assignee === childId && t.setOn === date)
  const logged = all.filter((s) => loggedToday.some((t) => same(t.subject, s)))
  return { date, subjects: all.filter((s) => !logged.includes(s)), logged }
}

// ------------------------------------------------------------------ the "nothing logged this week?" nudge

/** The subjects the school says set homework in this week (A or B), as timetable subject names. */
export function expectedSubjects(pack: SchoolPack, week: 'A' | 'B'): string[] {
  const rules = pack.homeworkRules
  if (!rules) return []
  const given = week === 'A' ? rules.subjectsA : rules.subjectsB
  if (given?.length) return given
  // No structured list: pick out timetable subjects named in the rule's text.
  const text = (week === 'A' ? rules.A : rules.B).toLowerCase()
  const subjects = new Set<string>()
  for (const day of pack.timetable[week]) for (const cell of day) if (cell && text.includes(cell[0].toLowerCase())) subjects.add(cell[0])
  return [...subjects]
}

/**
 * Subjects that usually set homework this week but have nothing logged for it yet, shown from Thursday so there's
 * time for it to have been set. "Logged" means a homework task in that subject set this week (or, for older tasks
 * without a set date, due in the next three weeks); a subject the child said "none" for in a check-in this week
 * counts as answered and isn't nagged about.
 */
export function missingHomework(ctx: CalCtx, childId: MemberId, today: Ymd): string[] {
  const school = ctx.schools[childId]
  const week = school?.weekOf(today)?.week
  if (!school || !week || weekday(today) < 3 || weekday(today) > 4 || !school.isSchoolDay(today)) return []
  const monday = startOfWeek(today)
  const sunday = addDays(monday, 6)
  const f = ctx.family
  const tasks = Object.values(f.tasks).filter((t) => !t.deleted && !t.dropped && t.kind === 'homework' && t.assignee === childId)
  const saidNone = new Set<string>()
  for (const d of dayRange(monday, sunday)) for (const s of f.hwCheckins[`${childId}|${d}`]?.none ?? []) saidNone.add(s.toLowerCase())
  return expectedSubjects(school.pack, week).filter((subject) => {
    if (saidNone.has(subject.toLowerCase())) return false
    return !tasks.some((t) => same(t.subject, subject) && (t.setOn ? t.setOn >= monday && t.setOn <= sunday : !!t.date && t.date >= monday && t.date <= addDays(monday, 21)))
  })
}

// ------------------------------------------------------------------ the parent's view

export interface HomeworkSummary {
  open: TaskEvent[]
  /** Open and due within the next 7 days (including today). */
  dueThisWeek: TaskEvent[]
  /** Open with no planned day yet. */
  unplanned: TaskEvent[]
  /** Open, planned for a day that has already gone by, not yet late. */
  slipped: TaskEvent[]
  /** Open and past the due date. */
  overdue: TaskEvent[]
  /** Handed in and waiting for a parent to check. */
  waitingCheck: TaskEvent[]
  missing: string[]
}

export function homeworkSummary(ctx: CalCtx, childId: MemberId, today: Ymd): HomeworkSummary {
  const f = ctx.family
  const open = openHomework(f, childId)
  const waitingCheck = Object.values(f.tasks).filter((t) => !t.deleted && !t.dropped && t.kind === 'homework' && t.assignee === childId && f.done[`${t.taskId}|${t.date ?? 'any'}`]?.status === 'pending')
  return {
    open,
    dueThisWeek: open.filter((t) => !!t.date && t.date >= today && t.date <= addDays(today, 6)),
    unplanned: open.filter((t) => !t.doOn && !(t.date && t.date < today)),
    slipped: open.filter((t) => !!t.doOn && t.doOn < today && !(t.date && t.date < today)),
    overdue: open.filter((t) => !!t.date && t.date < today),
    waitingCheck,
    missing: missingHomework(ctx, childId, today),
  }
}

// The daily homework session's steps: see homeworkCore.ts (homeworkSessionSteps).

// ------------------------------------------------------------------ "due tomorrow and not done" alerts

export const homeworkAlertTag = (taskId: string, memberId: MemberId): string => `hw:${taskId}:${memberId}`

/** When to warn about this piece (AT_RISK_ALERT_AT the evening before it's due), or undefined if that has passed,
 * it has no due date, or it's already done. */
export function homeworkAlertAt(f: FamilyState, t: TaskEvent, now = Date.now()): number | undefined {
  if (!t.date || homeworkDone(f, t)) return undefined
  const at = tsOf(addDays(t.date, -1), AT_RISK_ALERT_AT)
  return at > now ? at : undefined
}
