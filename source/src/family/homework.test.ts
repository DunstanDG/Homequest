import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import * as A from './actions'
import * as P from './planActions'
import { makeCalCtx, tasksFor } from './calendar'
import { addDays, tsOf } from './dates'
import {
  AT_RISK_ALERT_AT,
  DAILY_HOMEWORK_CAP_MIN,
  checkinPrompt,
  expectedSubjects,
  freeHomeworkMinutes,
  homeworkAlertAt,
  homeworkSessionSteps,
  homeworkSummary,
  lessonSubjectsOn,
  missingHomework,
  nextLessonOf,
  openHomework,
  planUnplanned,
  suggestDoOn,
} from './homework'
import { runOf } from './routines'
import { SAMPLE_PACK } from './school/sample'
import { applyFamilyEvent, projectFamily } from './project'
import type { FamilyState } from './types'

const T = (date: string, time = '12:00') => tsOf(date, time)
const apply = (f: FamilyState, evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, f)

// 2026-09-28 is a Monday in Week A of the sample school timetable (Week B is anchored on 2026-09-21).
const MON = '2026-09-28'

function family(): FamilyState {
  const now = T('2026-09-20', '08:00')
  return projectFamily([
    ...A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, now),
    ...A.saveMember('dad', { id: 'ellie', name: 'Ellie', role: 'child', colour: '#ffc857', active: true }, now + 1),
    ...A.importSchoolPack('dad', 'ellie', SAMPLE_PACK, now + 2),
  ])
}

const hw = (f: FamilyState, id: string, d: Partial<Parameters<typeof A.saveTask>[1]> & { date: string }, at = T(MON, '17:00')) =>
  apply(f, A.saveTask('ellie', { taskId: id, title: id, assignee: 'ellie', kind: 'homework', part: 'any', minutes: 30, ...d }, at))

describe('homework: the after-school check-in', () => {
  it("lists the day's lesson subjects once each, in timetable order", () => {
    const ctx = makeCalCtx(family())
    expect(lessonSubjectsOn(ctx, 'ellie', MON)).toEqual(['Geography', 'Drama', 'Science', 'Maths', 'Religion & Philosophy'])
    expect(lessonSubjectsOn(ctx, 'ellie', '2026-10-03')).toEqual([]) // Saturday
  })

  it('shows only after the last lesson, and not once the check-in is done', () => {
    let f = family()
    expect(checkinPrompt(makeCalCtx(f), 'ellie', T(MON, '14:30'))).toBeUndefined() // still in lessons
    expect(checkinPrompt(makeCalCtx(f), 'ellie', T(MON, '15:30'))?.subjects).toContain('Science')
    expect(checkinPrompt(makeCalCtx(f), 'ellie', T(MON, '22:00'))).toBeUndefined() // too late in the evening
    f = apply(f, A.homeworkCheckin('ellie', f, 'ellie', MON, ['Drama'], 1, T(MON, '15:40')))
    expect(checkinPrompt(makeCalCtx(f), 'ellie', T(MON, '16:00'))).toBeUndefined()
  })

  it('a "none set" from the weekly nudge keeps the check-in showing, minus that subject', () => {
    let f = family()
    f = apply(f, A.markNoHomework('ellie', f, 'ellie', MON, 'Science', T(MON, '12:00')))
    const p = checkinPrompt(makeCalCtx(f), 'ellie', T(MON, '15:30'))!
    expect(p.subjects).not.toContain('Science')
    expect(p.subjects).toContain('Maths')
    f = apply(f, A.homeworkCheckin('ellie', f, 'ellie', MON, ['Maths'], 0, T(MON, '15:45')))
    expect(f.hwCheckins[`ellie|${MON}`]!.none.sort()).toEqual(['Maths', 'Science'])
    expect(checkinPrompt(makeCalCtx(f), 'ellie', T(MON, '16:00'))).toBeUndefined()
  })

  it('treats a subject with homework set today as already logged', () => {
    let f = family()
    f = hw(f, 'sci', { subject: 'Science', date: '2026-10-05', setOn: MON })
    const p = checkinPrompt(makeCalCtx(f), 'ellie', T(MON, '15:30'))!
    expect(p.logged).toEqual(['Science'])
    expect(p.subjects).not.toContain('Science')
  })

  it("defaults the due date to the subject's next lesson", () => {
    const ctx = makeCalCtx(family())
    expect(nextLessonOf(ctx, 'ellie', 'Science', MON)).toBe('2026-09-29') // Tuesday, Week A
    expect(nextLessonOf(ctx, 'ellie', 'Underwater basket weaving', MON)).toBe(addDays(MON, 7))
  })
})

describe('homework: planning a day to do it', () => {
  it('suggests the earliest day with room before it is due', () => {
    const f = family()
    const ctx = makeCalCtx(f)
    const s = suggestDoOn(ctx, 'ellie', '2026-10-02', 30, T(MON, '10:00'))
    const firstWithRoom = [0, 1, 2, 3].map((i) => addDays(MON, i)).find((d) => freeHomeworkMinutes(ctx, 'ellie', d) >= 30)
    expect(s.date).toBe(firstWithRoom)
  })

  it('spreads the load: a day already at the cap is passed over', () => {
    let f = family()
    const first = suggestDoOn(makeCalCtx(f), 'ellie', '2026-10-02', 30, T(MON, '10:00')).date
    f = hw(f, 'big', { date: '2026-10-09', doOn: first, minutes: DAILY_HOMEWORK_CAP_MIN })
    const next = suggestDoOn(makeCalCtx(f), 'ellie', '2026-10-02', 30, T(MON, '10:00'))
    expect(next.date > first).toBe(true)
  })

  it('plans every unplanned piece in one go without piling them onto one day', () => {
    let f = family()
    for (const id of ['a', 'b', 'c', 'd']) f = hw(f, id, { date: '2026-10-05', minutes: 45 })
    const plan = planUnplanned(makeCalCtx(f), 'ellie', T(MON, '10:00'))
    expect(plan).toHaveLength(4)
    const perDay: Record<string, number> = {}
    for (const p of plan) perDay[p.doOn.date] = (perDay[p.doOn.date] ?? 0) + 45
    expect(Object.values(perDay).every((m) => m <= DAILY_HOMEWORK_CAP_MIN)).toBe(true)
  })

  it("skips today once this evening's homework time has gone", () => {
    const f = family()
    expect(suggestDoOn(makeCalCtx(f), 'ellie', '2026-10-02', 30, T(MON, '21:00')).date > MON).toBe(true)
  })

  it('suggests today for something due today or tomorrow', () => {
    const f = family()
    expect(suggestDoOn(makeCalCtx(f), 'ellie', MON, 30, T(MON, '10:00')).date).toBe(MON)
  })

  it('planned homework shows from its planned day, then as slipped if it was not done', () => {
    let f = family()
    f = hw(f, 'geo', { subject: 'Geography', date: '2026-10-05', doOn: '2026-09-30' })
    const ctx = makeCalCtx(f)
    const on = (d: string) => tasksFor(ctx, 'ellie', d, T(d, '09:00')).find((r) => r.task.taskId === 'geo')
    expect(on(MON)).toBeUndefined() // planned for Wednesday, due next Monday: not cluttering Monday
    expect(on('2026-09-30')?.slipped).toBe(false)
    expect(on('2026-10-01')?.slipped).toBe(true) // Thursday: still not done
    // Without a plan it keeps the old behaviour: shown a week before it's due.
    f = hw(f, 'eng', { subject: 'English', date: '2026-10-05' })
    expect(tasksFor(makeCalCtx(f), 'ellie', MON, T(MON, '09:00')).some((r) => r.task.taskId === 'eng')).toBe(true)
  })
})

describe('homework: the "nothing logged this week?" nudge', () => {
  const THU = '2026-10-01'
  it('uses the school rule for Week A', () => {
    expect(expectedSubjects(SAMPLE_PACK, 'A')).toEqual(['English', 'Maths', 'Science'])
  })

  it('from Thursday, names rule subjects with nothing logged and nothing answered', () => {
    let f = family()
    expect(missingHomework(makeCalCtx(f), 'ellie', '2026-09-30')).toEqual([]) // Wednesday: too early to nag
    expect(missingHomework(makeCalCtx(f), 'ellie', THU)).toEqual(['English', 'Maths', 'Science'])
    f = hw(f, 'sci', { subject: 'Science', date: '2026-10-08', setOn: '2026-09-29' })
    f = apply(f, A.homeworkCheckin('ellie', f, 'ellie', '2026-09-29', ['English'], 1, T('2026-09-29', '16:00')))
    expect(missingHomework(makeCalCtx(f), 'ellie', THU)).toEqual(['Maths'])
  })
})

describe('homework: parents, sessions and alerts', () => {
  it('sorts open homework into planned/unplanned/slipped/overdue and waiting-for-a-check', () => {
    let f = family()
    const WED = '2026-09-30'
    f = hw(f, 'late', { date: '2026-09-29' })
    f = hw(f, 'slip', { date: '2026-10-05', doOn: MON })
    f = hw(f, 'free', { date: '2026-10-02' })
    f = hw(f, 'plan', { date: '2026-10-02', doOn: '2026-10-01' })
    f = hw(f, 'handed', { date: '2026-10-02' })
    f = apply(f, A.completeTask('ellie', f, f.tasks.handed!, '2026-10-02', {}, T(WED, '17:00')))
    const s = homeworkSummary(makeCalCtx(f), 'ellie', WED)
    expect(s.overdue.map((t) => t.taskId)).toEqual(['late'])
    expect(s.slipped.map((t) => t.taskId)).toEqual(['slip'])
    expect(s.unplanned.map((t) => t.taskId)).toEqual(['free'])
    expect(s.waitingCheck.map((t) => t.taskId)).toEqual(['handed'])
    expect(openHomework(f, 'ellie').map((t) => t.taskId)).not.toContain('handed')
  })

  it("builds a session from today's planned pieces (and anything due tomorrow), and ticks each piece off as its step is done", () => {
    let f = family()
    f = hw(f, 'today', { subject: 'Maths', date: '2026-10-02', doOn: MON })
    f = hw(f, 'tomorrow', { subject: 'English', date: '2026-09-29' })
    f = hw(f, 'later', { subject: 'History', date: '2026-10-09', doOn: '2026-10-05' })
    const steps = homeworkSessionSteps(f, 'ellie', MON)
    expect(steps.map((s) => s.taskId)).toEqual(['tomorrow', 'today'])
    const { runId, events } = P.startRun('ellie', 'ellie', { title: 'Homework', steps }, T(MON, '16:30'))
    f = apply(f, events)
    const stepId = runOf(f, runId)!.steps.find((s) => s.step.taskId === 'today')!.step.id
    f = apply(f, P.finishSteps('ellie', f, runId, [stepId], 'done', T(MON, '17:00')))
    expect(f.done['today|2026-10-02']?.status).toBe('pending') // a child's tick waits for a parent's check, as on the list
    expect(f.done['tomorrow|2026-09-29']).toBeUndefined()
  })

  it('a homework session with nothing open is never empty', () => {
    expect(homeworkSessionSteps(family(), 'ellie', MON)).toHaveLength(1)
  })

  it('warns the evening before the due date, unless it is done', () => {
    let f = family()
    f = hw(f, 'x', { date: '2026-10-02' })
    expect(homeworkAlertAt(f, f.tasks.x!, T(MON, '09:00'))).toBe(tsOf('2026-10-01', AT_RISK_ALERT_AT))
    expect(homeworkAlertAt(f, f.tasks.x!, T('2026-10-01', '19:00'))).toBeUndefined() // already past the warning time
    f = apply(f, A.completeTask('dad', f, f.tasks.x!, '2026-10-02', {}, T(MON, '18:00')))
    expect(homeworkAlertAt(f, f.tasks.x!, T(MON, '09:00'))).toBeUndefined()
  })
})
