import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import { makeRng } from '@/engine/rng'
import * as A from './actions'
import * as P from './planActions'
import { itemsOn, makeCalCtx } from './calendar'
import { tsOf } from './dates'
import { areasOf, dumpList, dumpState, dumpTotals, parseDump } from './dump'
import { ARRIVAL_RECIPES, STARTER_RECIPES, ingredientsFor, lastPlanned, mealAt, planIdFor, suggestMeals } from './meals'
import { busyEvenings } from './planning'
import { applyFamilyEvent, projectFamily } from './project'
import { activeRunFor, allRuns, finishByTs, foldRun, isStale, plannedMinutes, routineItemsOn, routineOccursOn, routinesOn, runOf, runView, spareLabel, startBy, stepsAtTypicalTimes, typicalSec } from './routines'
import { MAIN_LIST, addAmounts, formatQty, groupByAisle, guessAisle, itemsOf, listText, mergeNeeds, nameKey, parseIngredients, parseLine, regulars } from './shopping'
import type { FamilyState, RoutineStep } from './types'

const T = (date: string, time = '12:00') => tsOf(date, time)
const MIN = 60_000

function family(): FamilyState {
  const now = T('2026-09-21', '06:00')
  const events: AppEvent[] = [
    ...A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, now),
    ...A.saveMember('dad', { id: 'mum', name: 'Mum', role: 'parent', colour: '#f72585', active: true }, now + 1),
    ...A.saveMember('dad', { id: 'ellie', name: 'Ellie', role: 'child', colour: '#ffc857', active: true }, now + 2),
    ...A.setEconomy('dad', { effectiveFrom: '2026-09-21' }, now + 3),
  ]
  return projectFamily(events)
}
const apply = (f: FamilyState, evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, f)

const steps = (...mins: number[]): RoutineStep[] => mins.map((m, i) => ({ id: `s${i + 1}`, title: `Step ${i + 1}`, minutes: m }))

/** A saved session with three steps (5, 10, 5 minutes), finish by 07:45, linked to a chore that pays coins. */
function withMorning(f: FamilyState) {
  const task = A.saveTask('dad', { taskId: 'task-morning', title: 'Morning routine', assignee: 'ellie', kind: 'routine', part: 'morning', minutes: 20, date: '2026-09-21', recur: { freq: 'daily' } }, T('2026-09-20', '09:00'))
  const routine = P.saveRoutine('dad', { routineId: 'rt-morning', title: 'Morning routine', emoji: '🌅', ownerId: 'ellie', steps: steps(5, 10, 5), finishBy: '07:45', startAt: '07:10', date: '2026-09-21', recur: { freq: 'daily', schoolDaysOnly: true }, taskId: 'task-morning' }, T('2026-09-20', '09:00'))
  return apply(f, [...task, ...routine])
}

describe('sessions: a run', () => {
  it('measures each step and what is left against the finish-by time', () => {
    let f = withMorning(family())
    const t0 = T('2026-09-21', '07:10')
    const { runId, events } = P.startRun('ellie', 'ellie', { routine: f.routines['rt-morning']! }, t0)
    f = apply(f, events)
    f = apply(f, P.finishStep('ellie', f, runId, 's1', 'done', t0 + 6 * MIN))
    const v = runView(runOf(f, runId)!, t0 + 7 * MIN)
    expect(v.current?.step.id).toBe('s2')
    expect(v.next?.step.id).toBe('s3')
    expect(v.stepElapsedSec).toBe(60)
    expect(v.stepLeftSec).toBe(540)
    expect(v.plannedLeftSec).toBe(540 + 300)
    expect(v.driftSec).toBe(60) // step 1 took 6 minutes against 5 planned
    expect(v.done).toBe(1)
    // 07:17 now + 14 min planned = 07:31, so 14 minutes to spare before 07:45
    expect(Math.round(v.spareSec! / 60)).toBe(14)
    expect(spareLabel(v.spareSec!)).toBe('14m to spare')
  })

  it('leaves paused time out', () => {
    let f = withMorning(family())
    const t0 = T('2026-09-21', '07:10')
    const { runId, events } = P.startRun('ellie', 'ellie', { routine: f.routines['rt-morning']! }, t0)
    f = apply(f, events)
    f = apply(f, P.pauseRun('ellie', runId, t0 + 3 * MIN))
    expect(runOf(f, runId)!.status).toBe('paused')
    f = apply(f, P.resumeRun('ellie', runId, t0 + 13 * MIN))
    const v = runView(runOf(f, runId)!, t0 + 15 * MIN)
    expect(v.elapsedSec).toBe(5 * 60) // 3 minutes before the pause, 2 after
    expect(v.stepElapsedSec).toBe(5 * 60)
    f = apply(f, P.finishStep('ellie', f, runId, 's1', 'done', t0 + 15 * MIN))
    expect(runOf(f, runId)!.steps[0]!.activeSec).toBe(300)
  })

  it('extra time lengthens only the current step', () => {
    let f = withMorning(family())
    const t0 = T('2026-09-21', '07:10')
    const { runId, events } = P.startRun('ellie', 'ellie', { routine: f.routines['rt-morning']! }, t0)
    f = apply(f, events)
    f = apply(f, P.extendRun('ellie', runId, 60, t0 + 4 * MIN))
    const v = runView(runOf(f, runId)!, t0 + 4 * MIN)
    expect(v.stepPlannedSec).toBe(360)
    expect(v.plannedSec).toBe(20 * 60) // the plan itself is unchanged
    expect(v.plannedLeftSec).toBe(120 + 600 + 300)
  })

  it('never lets the current step count as negative time left', () => {
    let f = withMorning(family())
    const t0 = T('2026-09-21', '07:10')
    const { runId, events } = P.startRun('ellie', 'ellie', { routine: f.routines['rt-morning']! }, t0)
    f = apply(f, events)
    const v = runView(runOf(f, runId)!, t0 + 9 * MIN) // 4 minutes over on step 1
    expect(v.stepLeftSec).toBe(-240)
    expect(v.plannedLeftSec).toBe(600 + 300)
  })

  it('finishes by itself on the last step and ticks the linked task once, with the minutes', () => {
    let f = withMorning(family())
    const t0 = T('2026-09-21', '07:10')
    const { runId, events } = P.startRun('ellie', 'ellie', { routine: f.routines['rt-morning']! }, t0)
    f = apply(f, events)
    f = apply(f, P.finishStep('ellie', f, runId, 's1', 'done', t0 + 5 * MIN))
    f = apply(f, P.finishStep('ellie', f, runId, 's2', 'skipped', t0 + 6 * MIN))
    expect(f.done['task-morning|2026-09-21']).toBeUndefined()
    const last = P.finishStep('ellie', f, runId, 's3', 'done', t0 + 12 * MIN)
    expect(last.map((e) => e.type)).toEqual(['run', 'task-done'])
    f = apply(f, last)
    const r = runOf(f, runId)!
    expect(r.status).toBe('done')
    expect(r.endedTs).toBe(t0 + 12 * MIN)
    expect(f.done['task-morning|2026-09-21']?.minutes).toBe(12)
    // a second tap, or another phone, does nothing
    expect(P.finishStep('ellie', f, runId, 's3', 'done', t0 + 13 * MIN)).toEqual([])
    expect(P.finishEarly('ellie', f, runId, t0 + 13 * MIN)).toEqual([])
  })

  it('does not tick the task when nothing was really done', () => {
    let f = withMorning(family())
    const t0 = T('2026-09-21', '07:10')
    const { runId, events } = P.startRun('ellie', 'ellie', { routine: f.routines['rt-morning']! }, t0)
    f = apply(f, events)
    const ev = P.finishEarly('ellie', f, runId, t0 + MIN)
    expect(ev.every((e) => e.type === 'run')).toBe(true)
    f = apply(f, ev)
    expect(runOf(f, runId)!.status).toBe('done')
    expect(runOf(f, runId)!.steps.every((s) => s.status === 'skipped')).toBe(true)
    expect(Object.keys(f.done)).toHaveLength(0)
  })

  it('finishing early after some real steps still counts', () => {
    let f = withMorning(family())
    const t0 = T('2026-09-21', '07:10')
    const { runId, events } = P.startRun('ellie', 'ellie', { routine: f.routines['rt-morning']! }, t0)
    f = apply(f, events)
    f = apply(f, P.finishStep('ellie', f, runId, 's1', 'done', t0 + 5 * MIN))
    const ev = P.finishEarly('ellie', f, runId, t0 + 6 * MIN)
    expect(ev.map((e) => e.type)).toEqual(['run', 'run', 'task-done'])
    f = apply(f, ev)
    expect(f.done['task-morning|2026-09-21']).toBeDefined()
  })

  it('undoing the last step reopens the run and takes the task tick back', () => {
    let f = withMorning(family())
    const t0 = T('2026-09-21', '07:10')
    const started = P.startRun('ellie', 'ellie', { routine: f.routines['rt-morning']! }, t0)
    const runId = started.runId
    f = apply(f, started.events)
    f = apply(f, P.finishStep('ellie', f, runId, 's1', 'done', t0 + 5 * MIN))
    f = apply(f, P.finishStep('ellie', f, runId, 's2', 'done', t0 + 10 * MIN))
    const last = P.finishStep('ellie', f, runId, 's3', 'done', t0 + 15 * MIN)
    f = apply(f, last)
    expect(runOf(f, runId)!.status).toBe('done')
    f = apply(f, P.undoEvents('ellie', last, t0 + 16 * MIN))
    expect(runOf(f, runId)!.status).toBe('running')
    expect(runOf(f, runId)!.steps[2]!.status).toBe('todo')
    expect(f.done['task-morning|2026-09-21']).toBeUndefined()
  })

  it('a rebuild from the whole log gives the same run as applying events one by one', () => {
    let f = withMorning(family())
    const t0 = T('2026-09-21', '07:10')
    const s = P.startRun('ellie', 'ellie', { routine: f.routines['rt-morning']! }, t0)
    const evs = [...s.events, ...P.pauseRun('ellie', s.runId, t0 + MIN), ...P.resumeRun('ellie', s.runId, t0 + 4 * MIN)]
    f = apply(f, evs)
    const whole = projectFamily([...Object.values(f.routines), ...evs] as AppEvent[])
    expect(foldRun(whole.runs[s.runId]!, whole.voided)).toEqual(runOf(f, s.runId))
  })

  it('a session that has been left for hours is not "active" any more', () => {
    let f = withMorning(family())
    const t0 = T('2026-09-21', '07:10')
    const s = P.startRun('ellie', 'ellie', { routine: f.routines['rt-morning']! }, t0)
    f = apply(f, s.events)
    expect(activeRunFor(f, 'ellie', t0 + 30 * MIN)?.id).toBe(s.runId)
    expect(isStale(runOf(f, s.runId)!, t0 + 9 * 60 * MIN)).toBe(true)
    expect(activeRunFor(f, 'ellie', t0 + 9 * 60 * MIN)).toBeUndefined()
    expect(activeRunFor(f, 'dad', t0 + MIN)).toBeUndefined()
  })

  it('editing the plan later does not change a run in progress', () => {
    let f = withMorning(family())
    const t0 = T('2026-09-21', '07:10')
    const s = P.startRun('ellie', 'ellie', { routine: f.routines['rt-morning']! }, t0)
    f = apply(f, s.events)
    f = apply(f, P.saveRoutine('dad', { ...f.routines['rt-morning']!, steps: steps(1) }, t0 + MIN))
    expect(runOf(f, s.runId)!.steps).toHaveLength(3)
  })

  it('only pays the session\'s own person, and only on a day it falls', () => {
    let f = withMorning(family())
    // Dad runs Ellie's session: it is a run, but the coins are not his to hand out.
    const t0 = T('2026-09-21', '07:10')
    const dad = P.startRun('dad', 'dad', { routine: f.routines['rt-morning']! }, t0)
    f = apply(f, dad.events)
    const ev = P.finishSteps('dad', f, dad.runId, ['s1', 's2', 's3'], 'done', t0 + 10 * MIN)
    expect(ev.map((e) => e.type)).not.toContain('task-done')
    // A weekday task run on a Saturday: no payout.
    f = withMorning(family())
    f = apply(f, A.saveTask('dad', { taskId: 'task-morning', title: 'Morning routine', assignee: 'ellie', kind: 'routine', part: 'morning', minutes: 20, date: '2026-09-14', recur: { freq: 'weekly', byWeekday: [0, 1, 2, 3, 4] } }, T('2026-09-20', '09:00')))
    const sat = T('2026-09-26', '08:00')
    const w = P.startRun('ellie', 'ellie', { routine: f.routines['rt-morning']! }, sat)
    f = apply(f, w.events)
    expect(P.finishSteps('ellie', f, w.runId, ['s1', 's2', 's3'], 'done', sat + 10 * MIN).map((e) => e.type)).not.toContain('task-done')
  })

  it('a session with nobody set still shows on everyone\'s day', () => {
    let f = family()
    f = apply(f, P.saveRoutine('dad', { routineId: 'rt-any', title: 'Tidy', steps: steps(5), date: '2026-09-21', startAt: '17:00' }, T('2026-09-20', '09:00')))
    expect(routinesOn(f, '2026-09-21', { memberId: 'ellie' }).map((r) => r.routineId)).toEqual(['rt-any'])
  })

  it('a finish-by just after midnight gives a start time before midnight', () => {
    expect(startBy('00:15', steps(30))).toBe('23:45')
  })

  it('an empty session cannot be started', () => {
    expect(P.startRun('dad', 'dad', { title: 'Nothing', steps: [] }).events).toEqual([])
  })
})

describe('sessions: learning the usual', () => {
  it('uses the middle of the last five times a step took', () => {
    let f = withMorning(family())
    const times = [4, 6, 9, 5, 5, 30] // minutes for step 1; the first is now outside the last five
    times.forEach((m, i) => {
      const t0 = T('2026-09-21', '07:00') + i * 24 * 60 * MIN
      const s = P.startRun('ellie', 'ellie', { routine: f.routines['rt-morning']! }, t0)
      f = apply(f, s.events)
      f = apply(f, P.finishSteps('ellie', f, s.runId, ['s1', 's2', 's3'], 'done', t0 + m * MIN))
    })
    const typ = typicalSec(f, 'rt-morning')
    expect(typ['s1']!.n).toBe(5)
    expect(typ['s1']!.sec).toBe(6 * 60) // the five newest step-1 times are 6, 9, 5, 5, 30 minutes: the middle is 6
    // the other two were ticked at the same instant as step 1, so they say nothing about how long they take
    expect(typ['s2']).toBeUndefined()
    const tuned = stepsAtTypicalTimes(f.routines['rt-morning']!.steps, { s1: { sec: 400, n: 3 } })
    expect(tuned[0]!.minutes).toBe(6.5)
    expect(tuned[1]!.minutes).toBe(10) // no data: unchanged
  })

  it('does not learn from abandoned runs', () => {
    let f = withMorning(family())
    const t0 = T('2026-09-21', '07:10')
    const s = P.startRun('ellie', 'ellie', { routine: f.routines['rt-morning']! }, t0)
    f = apply(f, s.events)
    f = apply(f, P.finishStep('ellie', f, s.runId, 's1', 'done', t0 + 5 * MIN))
    f = apply(f, P.abandonRun('ellie', s.runId, t0 + 6 * MIN))
    expect(runOf(f, s.runId)!.status).toBe('abandoned')
    expect(typicalSec(f, 'rt-morning')).toEqual({})
  })
})

describe('sessions: planning and the calendar', () => {
  it('adds up the plan and works out when to start', () => {
    expect(plannedMinutes(steps(5, 10, 5))).toBe(20)
    expect(startBy('07:45', steps(5, 10, 5))).toBe('07:25')
    expect(startBy(undefined, steps(5))).toBeUndefined()
  })

  it('a finish-by shortly after midnight belongs to the next day', () => {
    const start = tsOf('2026-09-21', '22:30')
    expect(finishByTs('2026-09-21', '00:30', start)).toBe(tsOf('2026-09-22', '00:30'))
    // a finish-by that has just passed stays put, so it reads as "behind"
    expect(finishByTs('2026-09-21', '22:15', start)).toBe(tsOf('2026-09-21', '22:15'))
  })

  it('shows on the days it repeats (school days only), for its owner, without blocking their time', () => {
    const f = withMorning(family())
    const r = f.routines['rt-morning']!
    expect(routineOccursOn(r, '2026-09-21')).toBe(true) // Monday
    expect(routineOccursOn(r, '2026-09-26')).toBe(false) // Saturday
    const ctx = makeCalCtx(f)
    const mon = itemsOn(ctx, '2026-09-21').filter((i) => i.source === 'routine')
    expect(mon).toHaveLength(1)
    expect(mon[0]).toMatchObject({ start: '07:10', end: '07:30', busy: false, category: 'session', members: ['ellie'] })
    expect(itemsOn(ctx, '2026-09-26').filter((i) => i.source === 'routine')).toHaveLength(0)
    expect(itemsOn(ctx, '2026-09-21', { members: ['dad'] }).filter((i) => i.source === 'routine')).toHaveLength(0)
    expect(routineItemsOn(f, '2026-09-21')).toHaveLength(1)
  })

  it('a deleted session disappears from the calendar', () => {
    let f = withMorning(family())
    f = apply(f, P.deleteRoutine('dad', f.routines['rt-morning']!, T('2026-09-21', '09:00')))
    expect(itemsOn(makeCalCtx(f), '2026-09-21').filter((i) => i.source === 'routine')).toHaveLength(0)
    expect(allRuns(f)).toHaveLength(0)
  })
})

describe('brain dump', () => {
  const members = [
    { id: 'dad', name: 'Dad' },
    { id: 'mum', name: 'Mum' },
    { id: 'ellie', name: 'Ellie' },
  ]

  it('reads area, time, owner and priority from a line', () => {
    const [a] = parseDump('Book dentist #admin ~10 @Mum !', members)
    expect(a).toMatchObject({ title: 'Book dentist', area: 'Admin', minutes: 10, ownerId: 'mum', priority: 'high' })
  })

  it('reads many lines, bullets, tick boxes and headings', () => {
    const items = parseDump(['Home:', '- [ ] Fix the bathroom door ~1h30', '* Paint the gate #someday', '', 'Admin:', '1. Renew car insurance (20m) !!', 'Call the council'].join('\n'), members)
    expect(items.map((i) => i.title)).toEqual(['Fix the bathroom door', 'Paint the gate', 'Renew car insurance', 'Call the council'])
    expect(items.map((i) => i.area)).toEqual(['Home', 'Home', 'Admin', 'Admin'])
    expect(items[0]!.minutes).toBe(90)
    expect(items[1]!.priority).toBe('someday')
    expect(items[2]).toMatchObject({ minutes: 20, priority: 'high' })
  })

  it('leaves alone anything it does not understand', () => {
    const [a, b] = parseDump('Email @Zed about the (2) plans\nBuy 15 screws ~', members)
    expect(a!.title).toBe('Email @Zed about the (2) plans')
    expect(a!.ownerId).toBeUndefined()
    expect(b!.title).toBe('Buy 15 screws ~')
    expect(b!.minutes).toBeUndefined()
  })

  it('keeps the list in the order it was written, important things first, someday last', () => {
    let f = family()
    const now = T('2026-09-21', '09:00')
    f = apply(f, P.addDump('dad', parseDump('Sort the loft\nBook MOT !\nLearn to juggle #someday\nPost the parcel', members), now))
    expect(dumpList(f).map((d) => d.title)).toEqual(['Book MOT', 'Sort the loft', 'Post the parcel', 'Learn to juggle'])
    expect(dumpList(f, { q: 'mot' })).toHaveLength(1)
  })

  it('editing an item keeps its place in the list', () => {
    let f = family()
    f = apply(f, P.addDump('dad', parseDump('First\nSecond'), T('2026-09-21', '09:00')))
    const first = dumpList(f)[0]!
    f = apply(f, P.saveDump('dad', first, { notes: 'later, with a ladder' }, T('2026-09-22', '09:00')))
    expect(dumpList(f).map((d) => d.title)).toEqual(['First', 'Second'])
  })

  it('is done when a session step made from it is done, and open again if that is undone', () => {
    let f = family()
    f = apply(f, P.addDump('dad', parseDump('Clear the gutters ~30\nSort the cupboard ~15'), T('2026-09-21', '09:00')))
    const items = dumpList(f)
    const made = P.sessionFromDump('dad', items, { title: 'Saturday jobs' }, T('2026-09-21', '09:05'))
    f = apply(f, made.events)
    const routine = f.routines[made.routineId]!
    expect(routine.steps.map((s) => [s.title, s.minutes, !!s.dumpId])).toEqual([['Clear the gutters', 30, true], ['Sort the cupboard', 15, true]])
    const t0 = T('2026-09-26', '10:00')
    const run = P.startRun('dad', 'dad', { routine }, t0)
    f = apply(f, run.events)
    const tick = P.finishStep('dad', f, run.runId, routine.steps[0]!.id, 'done', t0 + 20 * MIN)
    f = apply(f, tick)
    expect(dumpList(f).map((d) => d.title)).toEqual(['Sort the cupboard'])
    expect(dumpList(f, { show: 'done' }).map((d) => d.title)).toEqual(['Clear the gutters'])
    f = apply(f, P.undoEvents('dad', tick, t0 + 21 * MIN))
    expect(dumpList(f)).toHaveLength(2)
    // a skipped step leaves the item on the list
    f = apply(f, P.finishStep('dad', f, run.runId, routine.steps[0]!.id, 'skipped', t0 + 22 * MIN))
    expect(dumpList(f)).toHaveLength(2)
  })

  it('scheduling makes a task, ticking the task finishes the item, unscheduling puts it back', () => {
    let f = family()
    f = apply(f, P.addDump('dad', parseDump('Book the boiler service ~10'), T('2026-09-21', '09:00')))
    const item = dumpList(f)[0]!
    f = apply(f, P.scheduleDump('dad', f, item, { date: '2026-09-24', assignee: 'mum' }, T('2026-09-21', '10:00')))
    const sched = f.dump[item.itemId]!
    expect(sched.taskId).toBe(`dump-${item.itemId}`)
    expect(f.tasks[sched.taskId!]).toMatchObject({ title: 'Book the boiler service', assignee: 'mum', date: '2026-09-24', coins: 0, minutes: 10 })
    expect(dumpState(f, sched)).toBe('scheduled')
    // moving it to another day re-saves the same task
    f = apply(f, P.scheduleDump('dad', f, sched, { date: '2026-09-25', assignee: 'mum' }, T('2026-09-21', '10:30')))
    expect(Object.values(f.tasks).filter((t) => !t.deleted)).toHaveLength(1)
    expect(f.tasks[sched.taskId!]!.date).toBe('2026-09-25')
    // give the job to a child and it pays coins
    f = apply(f, P.scheduleDump('dad', f, f.dump[item.itemId]!, { date: '2026-09-25', assignee: 'ellie' }, T('2026-09-21', '10:40')))
    expect(f.tasks[sched.taskId!]!.coins).toBeGreaterThan(0)
    // unschedule
    f = apply(f, P.unscheduleDump('dad', f, f.dump[item.itemId]!, T('2026-09-21', '11:00')))
    expect(dumpState(f, f.dump[item.itemId]!)).toBe('open')
    // and schedule again, then do it
    f = apply(f, P.scheduleDump('dad', f, f.dump[item.itemId]!, { date: '2026-09-25', assignee: 'mum' }, T('2026-09-21', '11:05')))
    const task = f.tasks[`dump-${item.itemId}`]!
    f = apply(f, A.completeTask('mum', f, task, '2026-09-25', {}, T('2026-09-25', '12:00')))
    expect(dumpState(f, f.dump[item.itemId]!)).toBe('done')
  })

  it('scheduling in the same breath as editing keeps the edits, and an "anyone" item stays unowned', () => {
    let f = family()
    f = apply(f, P.addDump('dad', parseDump('Tidy the shed'), T('2026-09-21', '09:00')))
    const item = dumpList(f)[0]!
    f = apply(f, P.scheduleDump('dad', f, item, { date: '2026-09-24', assignee: 'dad', patch: { area: 'Garden', priority: 'high', minutes: 40, ownerId: undefined } }, T('2026-09-21', '10:00')))
    expect(f.dump[item.itemId]).toMatchObject({ area: 'Garden', priority: 'high', minutes: 40, ownerId: undefined })
    expect(f.tasks[`dump-${item.itemId}`]).toMatchObject({ minutes: 40, assignee: 'dad' })
  })

  it('putting an item back reopens it even if a session step had finished it', () => {
    let f = family()
    f = apply(f, P.addDump('dad', parseDump('Clear the gutters ~20'), T('2026-09-21', '09:00')))
    const item = dumpList(f)[0]!
    const routine = P.sessionFromDump('dad', [item], { title: 'Jobs' }, T('2026-09-21', '09:05'))
    f = apply(f, routine.events)
    const run = P.startRun('dad', 'dad', { routine: f.routines[routine.routineId]! }, T('2026-09-21', '10:00'))
    f = apply(f, run.events)
    f = apply(f, P.finishStep('dad', f, run.runId, f.routines[routine.routineId]!.steps[0]!.id, 'done', T('2026-09-21', '10:20')))
    expect(dumpState(f, f.dump[item.itemId]!)).toBe('done')
    f = apply(f, P.saveDump('dad', f.dump[item.itemId]!, { status: 'open' }, T('2026-09-21', '11:00')))
    expect(dumpState(f, f.dump[item.itemId]!)).toBe('open')
  })

  it('dropping and deleting take an item off the list; totals ignore finished ones', () => {
    let f = family()
    f = apply(f, P.addDump('dad', parseDump('A ~10\nB ~20\nC\nD'), T('2026-09-21', '09:00')))
    const [a, b, c] = dumpList(f)
    f = apply(f, P.saveDump('dad', a!, { status: 'dropped' }, T('2026-09-21', '09:10')))
    f = apply(f, P.deleteDump('dad', b!, T('2026-09-21', '09:11')))
    expect(dumpList(f).map((d) => d.title)).toEqual(['C', 'D'])
    expect(dumpTotals(f, dumpList(f))).toEqual({ count: 2, minutes: 0, unestimated: 2 })
    expect(dumpList(f, { show: 'done' }).map((d) => d.title)).toEqual(['A'])
    void c
  })

  it('lists the areas in use, busiest first, then suggestions', () => {
    let f = family()
    f = apply(f, P.addDump('dad', parseDump('a #Home\nb #Home\nc #Admin\nd'), T('2026-09-21', '09:00')))
    const areas = areasOf(f)
    expect(areas.slice(0, 2)).toEqual([{ name: 'Home', count: 2 }, { name: 'Admin', count: 1 }])
    expect(areas.map((a) => a.name)).toContain('Errands')
  })

  it('adds a dump item to an existing session once', () => {
    let f = withMorning(family())
    f = apply(f, P.addDump('dad', parseDump('Water the plants ~5'), T('2026-09-21', '09:00')))
    const item = dumpList(f)[0]!
    f = apply(f, P.addDumpToRoutine('dad', f.routines['rt-morning']!, [item], T('2026-09-21', '09:05')))
    expect(f.routines['rt-morning']!.steps).toHaveLength(4)
    f = apply(f, P.addDumpToRoutine('dad', f.routines['rt-morning']!, [item], T('2026-09-21', '09:06')))
    expect(f.routines['rt-morning']!.steps).toHaveLength(4)
    expect(f.routines['rt-morning']!.ownerId).toBe('ellie') // the rest of the plan is untouched
  })
})

describe('shopping: reading lines', () => {
  it('reads quantity, unit, name and note', () => {
    expect(parseLine('500g mince')).toMatchObject({ name: 'Mince', qty: 500, unit: 'g' })
    expect(parseLine('3 apples')).toMatchObject({ name: 'Apples', qty: 3 })
    expect(parseLine('milk x2')).toMatchObject({ name: 'Milk', qty: 2 })
    expect(parseLine('x2 milk')).toMatchObject({ name: 'Milk', qty: 2 })
    expect(parseLine('2 tins chopped tomatoes')).toMatchObject({ name: 'Chopped tomatoes', qty: 2, unit: 'tin' })
    expect(parseLine('bread (the seeded one)')).toMatchObject({ name: 'Bread', note: 'the seeded one' })
    expect(parseLine('1/2 cabbage')).toMatchObject({ qty: 0.5, name: 'Cabbage' })
    expect(parseLine('1½ kg potatoes')).toMatchObject({ qty: 1.5, unit: 'kg' })
    expect(parseLine('- [ ] eggs')).toMatchObject({ name: 'Eggs' })
    expect(parseLine('   ')).toBeUndefined()
  })

  it('keeps a description with its ingredient', () => {
    const list = parseIngredients('1 onion, finely chopped\n2 carrots, grated, 1 tin tomatoes')
    expect(list).toHaveLength(3)
    expect(list.map((i) => i.name.toLowerCase()).some((n) => /^(finely chopped|grated)$/.test(n))).toBe(false)
    expect(list[0]!.qty).toBe(1)
  })

  it('splits a list of ingredients on commas and lines but not inside brackets', () => {
    const list = parseIngredients('Oats, apples (Bramley, if you can), 2 tbsp maple syrup\nwalnuts')
    expect(list.map((i) => i.name)).toEqual(['Oats', 'Apples', 'Maple syrup', 'Walnuts'])
  })

  it('sorts things into supermarket aisles', () => {
    const cases: [string, string][] = [
      ['Semi-skimmed milk', 'dairy'],
      ['Chicken breasts', 'meat'],
      ['Frozen peas', 'frozen'],
      ['Chicken stock cubes', 'cupboard'],
      ['Red pepper', 'produce'],
      ['Black pepper', 'cupboard'],
      ['Nappies', 'baby'],
      ['Baby wipes', 'baby'],
      ['Antibacterial wipes', 'household'],
      ['Dog treats', 'pet'],
      ['Strawberries', 'produce'],
      ['Tortilla wraps', 'cupboard'],
      ['Sourdough loaf', 'bakery'],
      ['Ice cream', 'frozen'],
      ['Peanut butter', 'cupboard'],
      ['Green beans', 'produce'],
      ['Orange juice', 'drinks'],
      ['Chopped tomatoes', 'cupboard'],
      ['Cherry tomatoes', 'produce'],
      ['Toilet roll', 'household'],
      ['Macaroni', 'cupboard'],
      ['Zzzz thing', 'other'],
    ]
    for (const [name, aisle] of cases) expect([name, guessAisle(name)]).toEqual([name, aisle])
  })

  it('treats singular and plural as the same item', () => {
    expect(nameKey('Tomatoes')).toBe(nameKey('tomato'))
    expect(nameKey('Strawberries')).toBe(nameKey('strawberry'))
    expect(nameKey('Apples')).toBe(nameKey('apple'))
    expect(nameKey('Grapes')).not.toBe(nameKey('Grapefruit'))
  })

  it('adds amounts in the same kind of unit and refuses to mix kinds', () => {
    expect(addAmounts({ qty: 200, unit: 'g' }, { qty: 300, unit: 'g' })).toEqual({ qty: 500, unit: 'g' })
    expect(addAmounts({ qty: 600, unit: 'g' }, { qty: 0.5, unit: 'kg' })).toEqual({ qty: 1.1, unit: 'kg' })
    expect(addAmounts({ qty: 2, unit: 'tin' }, { qty: 1, unit: 'tin' })).toEqual({ qty: 3, unit: 'tin' })
    expect(addAmounts({ qty: 2 }, { qty: 3 })).toEqual({ qty: 5, unit: undefined })
    expect(addAmounts({ qty: 2, unit: 'tin' }, { qty: 200, unit: 'g' })).toBeUndefined()
    expect(addAmounts({ qty: 2 }, { qty: 200, unit: 'g' })).toBeUndefined()
  })

  it('merges duplicates and shows amounts tidily', () => {
    const needs = mergeNeeds([
      { name: 'Beef mince', qty: 500, unit: 'g', from: 'a' },
      { name: 'beef mince', qty: 250, unit: 'g', from: 'b' },
      { name: 'Onion', qty: 1, from: 'a' },
      { name: 'Onions', qty: 2, from: 'b' },
      { name: 'Tomatoes', qty: 2, unit: 'tin', from: 'a' },
      { name: 'Tomatoes', qty: 300, unit: 'g', from: 'b' },
    ])
    expect(needs.map((n) => [n.name, formatQty(n.qty, n.unit), n.from])).toEqual([
      ['Beef mince', '750g', ['a', 'b']],
      ['Onion', '3', ['a', 'b']],
      ['Tomatoes', '2 tins', ['a']],
      ['Tomatoes', '300g', ['b']],
    ])
    expect(formatQty(1.5, 'kg')).toBe('1.5kg')
    expect(formatQty(1, 'bunch')).toBe('1 bunch')
    expect(formatQty(2, 'bunch')).toBe('2 bunches')
    expect(formatQty(undefined, undefined)).toBe('')
  })
})

describe('shopping: lists', () => {
  it('creates the main list on first use, and merges a repeat instead of listing it twice', () => {
    let f = family()
    f = apply(f, P.addTextToList('dad', f, MAIN_LIST, 'milk\n500g mince\nbananas x6', T('2026-09-21', '09:00')))
    expect(f.shopLists[MAIN_LIST]?.name).toBe('Shopping')
    expect(itemsOf(f, MAIN_LIST)).toHaveLength(3)
    f = apply(f, P.addTextToList('mum', f, MAIN_LIST, '250g mince\nMilk\nbananas x2', T('2026-09-21', '09:05')))
    const items = itemsOf(f, MAIN_LIST)
    expect(items).toHaveLength(3)
    expect(items.find((i) => i.name === 'Mince')).toMatchObject({ qty: 750, unit: 'g', aisle: 'meat' })
    expect(items.find((i) => i.name === 'Bananas')?.qty).toBe(8)
    expect(items.find((i) => i.name === 'Milk')?.aisle).toBe('dairy')
  })

  it('a ticked item is not merged into: the next one is a new line', () => {
    let f = family()
    f = apply(f, P.addTextToList('dad', f, MAIN_LIST, 'milk', T('2026-09-21', '09:00')))
    f = apply(f, P.tickItem('dad', itemsOf(f, MAIN_LIST)[0]!, true, T('2026-09-21', '09:30')))
    f = apply(f, P.addTextToList('dad', f, MAIN_LIST, 'milk', T('2026-09-21', '10:00')))
    const items = itemsOf(f, MAIN_LIST)
    expect(items).toHaveLength(2)
    expect(items.filter((i) => i.done)).toHaveLength(1)
  })

  it('two phones adding the same first item at once still make one main list', () => {
    let f = family()
    const a = P.addTextToList('dad', f, MAIN_LIST, 'milk', T('2026-09-21', '09:00'))
    const b = P.addTextToList('mum', f, MAIN_LIST, 'eggs', T('2026-09-21', '09:00'))
    f = projectFamily([...Object.values(f.members), ...a, ...b] as AppEvent[])
    expect(Object.values(f.shopLists)).toHaveLength(1)
    expect(itemsOf(f, MAIN_LIST)).toHaveLength(2)
  })

  it('lays the list out in walking order, ticked things last, and can write it as text', () => {
    let f = family()
    f = apply(f, P.addTextToList('dad', f, MAIN_LIST, 'nappies\nmilk\nbread\napples\nbananas\nfrozen peas', T('2026-09-21', '09:00')))
    const bananas = itemsOf(f, MAIN_LIST).find((i) => i.name === 'Bananas')!
    f = apply(f, P.tickItem('dad', bananas, true, T('2026-09-21', '09:10')))
    const groups = groupByAisle(itemsOf(f, MAIN_LIST))
    expect(groups.map((g) => g.aisle)).toEqual(['produce', 'bakery', 'dairy', 'frozen', 'baby'])
    expect(groups[0]!.items.map((i) => i.name)).toEqual(['Apples', 'Bananas'])
    const text = listText('Shopping', itemsOf(f, MAIN_LIST))
    expect(text).toContain('- Apples')
    expect(text).not.toContain('Bananas') // already in the basket
  })

  it('remembers what you buy often and offers it again', () => {
    let f = family()
    for (let i = 0; i < 3; i++) {
      f = apply(f, P.addTextToList('dad', f, MAIN_LIST, 'milk', T('2026-09-21', `0${i + 1}:00`)))
      f = apply(f, P.tickItem('dad', itemsOf(f, MAIN_LIST).find((x) => !x.done)!, true, T('2026-09-21', `0${i + 1}:30`)))
    }
    f = apply(f, P.addTextToList('dad', f, MAIN_LIST, 'one-off candles', T('2026-09-21', '05:00')))
    expect(regulars(f, MAIN_LIST).map((r) => r.name)).toEqual(['Milk'])
    f = apply(f, P.addTextToList('dad', f, MAIN_LIST, 'milk', T('2026-09-21', '06:00')))
    expect(regulars(f, MAIN_LIST)).toEqual([]) // already on the list
  })

  it('clears what has been ticked', () => {
    let f = family()
    f = apply(f, P.addTextToList('dad', f, MAIN_LIST, 'a\nb\nc', T('2026-09-21', '09:00')))
    const [a, b] = itemsOf(f, MAIN_LIST)
    f = apply(f, [...P.tickItem('dad', a!, true, T('2026-09-21', '09:10')), ...P.tickItem('dad', b!, true, T('2026-09-21', '09:11'))])
    f = apply(f, P.clearTicked('dad', itemsOf(f, MAIN_LIST), T('2026-09-21', '09:20')))
    expect(itemsOf(f, MAIN_LIST).map((i) => i.name)).toEqual(['C'])
  })
})

describe('meals', () => {
  it('ships with recipes that read cleanly', () => {
    expect(STARTER_RECIPES.length).toBeGreaterThanOrEqual(12)
    expect(new Set(STARTER_RECIPES.map((r) => r.recipeId)).size).toBe(STARTER_RECIPES.length)
    for (const r of STARTER_RECIPES) {
      expect(r.ingredients.length).toBeGreaterThan(2)
      for (const i of r.ingredients) expect(i.name.length).toBeGreaterThan(1)
    }
    const spag = STARTER_RECIPES.find((r) => r.recipeId === 'starter-spag-bol')!
    expect(spag.ingredients[0]).toMatchObject({ name: 'Beef mince', qty: 500, unit: 'g', aisle: 'meat' })
    expect(ARRIVAL_RECIPES).toHaveLength(8)
    expect(ARRIVAL_RECIPES.filter((r) => r.meal === 'breakfast')).toHaveLength(4)
  })

  it('seeding adds each pack once, even from two phones', () => {
    let f = family()
    const a = P.seedRecipes('dad', f, STARTER_RECIPES)
    const b = P.seedRecipes('mum', f, STARTER_RECIPES)
    f = projectFamily([...a, ...b] as AppEvent[])
    expect(Object.keys(f.recipes)).toHaveLength(STARTER_RECIPES.length)
    expect(P.seedRecipes('dad', f, STARTER_RECIPES)).toEqual([])
    // a recipe deleted on purpose is not put back
    f = apply(f, P.deleteRecipe('dad', f.recipes['starter-pizza']!, T('2026-09-21', '11:00')))
    expect(P.seedRecipes('dad', f, STARTER_RECIPES)).toEqual([])
  })

  function withRecipes(): FamilyState {
    let f = family()
    f = apply(f, P.seedRecipes('dad', f, [...STARTER_RECIPES, ...ARRIVAL_RECIPES]))
    return f
  }

  it('one meal per day and slot: planning again replaces it', () => {
    let f = withRecipes()
    f = apply(f, P.planMeal('dad', { date: '2026-09-22', slot: 'dinner', recipe: f.recipes['starter-pizza']! }, T('2026-09-21', '09:00')))
    f = apply(f, P.planMeal('mum', { date: '2026-09-22', slot: 'dinner', title: 'Takeaway', cookId: 'mum' }, T('2026-09-21', '09:01')))
    expect(Object.values(f.meals).filter((m) => !m.deleted)).toHaveLength(1)
    expect(mealAt(f, '2026-09-22', 'dinner')).toMatchObject({ title: 'Takeaway', planId: planIdFor('2026-09-22', 'dinner') })
    expect(P.planMeal('dad', { date: '2026-09-22', slot: 'lunch' })).toEqual([]) // nothing to plan
    f = apply(f, P.clearMeal('dad', mealAt(f, '2026-09-22', 'dinner')!, T('2026-09-21', '09:02')))
    expect(mealAt(f, '2026-09-22', 'dinner')).toBeUndefined()
  })

  it('shows breakfast, lunch and dinner on the calendar for everyone, at their usual times (and never a snack)', () => {
    let f = withRecipes()
    f = apply(f, P.planMeal('dad', { date: '2026-09-22', slot: 'dinner', recipe: f.recipes['starter-pizza']!, cookId: 'dad' }, T('2026-09-21', '09:00')))
    f = apply(f, P.planMeal('dad', { date: '2026-09-22', slot: 'lunch', title: 'Leftovers' }, T('2026-09-21', '09:00')))
    f = apply(f, P.planMeal('dad', { date: '2026-09-22', slot: 'snack', title: 'Apple' }, T('2026-09-21', '09:00')))
    const items = itemsOn(makeCalCtx(f), '2026-09-22').filter((i) => i.source === 'meal')
    expect(items).toHaveLength(2)
    expect(items.find((i) => i.sub === 'Lunch')).toMatchObject({ title: '🥪 Leftovers', start: '12:00', end: '13:00', allDay: false })
    expect(items.find((i) => i.title.includes('pizza'))).toMatchObject({ title: '🍕 Homemade pizza night', sub: 'Dinner · Dad cooks', start: '18:00', end: '19:00', everyone: true, busy: false })
  })

  it('works out what to buy, scaled to the servings, without the pantry things', () => {
    let f = withRecipes()
    f = apply(f, P.planMeal('dad', { date: '2026-09-22', slot: 'dinner', recipe: f.recipes['starter-spag-bol']!, servings: 8 }, T('2026-09-21', '09:00')))
    f = apply(f, P.planMeal('dad', { date: '2026-09-23', slot: 'dinner', recipe: f.recipes['starter-chilli']! }, T('2026-09-21', '09:00')))
    f = apply(f, P.planMeal('dad', { date: '2026-09-24', slot: 'dinner', title: 'Out for dinner' }, T('2026-09-21', '09:00')))
    const ps = ingredientsFor(f, '2026-09-21', '2026-09-27')
    expect(ps.bare.map((m) => m.title)).toEqual(['Out for dinner'])
    const mince = ps.needs.find((n) => n.name === 'Beef mince')!
    expect(mince).toMatchObject({ qty: 1.5, unit: 'kg' }) // 1kg for double spag bol + 500g for chilli
    expect(formatQty(mince.qty, mince.unit)).toBe('1.5kg')
    expect(ps.needs.find((n) => n.name === 'Chopped tomatoes' || /tomatoes/i.test(n.name))?.qty).toBe(5) // 4 + 1 tins
    expect(ps.needs.some((n) => /olive oil|salt/i.test(n.name))).toBe(false)
    expect(ps.needs.find((n) => n.name === 'Beef mince')!.from).toHaveLength(2)
  })

  it('adds the week to the list once; changing a meal makes it count as new again', () => {
    let f = withRecipes()
    f = apply(f, P.planMeal('dad', { date: '2026-09-22', slot: 'dinner', recipe: f.recipes['starter-fajitas']! }, T('2026-09-21', '09:00')))
    f = apply(f, P.planMeal('dad', { date: '2026-09-23', slot: 'dinner', recipe: f.recipes['starter-jacket']! }, T('2026-09-21', '09:00')))
    const first = P.addPlanToList('dad', f, MAIN_LIST, '2026-09-21', '2026-09-27', T('2026-09-21', '10:00'))
    expect(first.meals).toBe(2)
    expect(first.lines).toBeGreaterThan(8)
    f = apply(f, first.events)
    const count = itemsOf(f, MAIN_LIST).length
    expect(count).toBe(first.lines)
    expect(f.meals[planIdFor('2026-09-22', 'dinner')]!.shopped).toBe(true)
    const again = P.addPlanToList('dad', f, MAIN_LIST, '2026-09-21', '2026-09-27', T('2026-09-21', '10:05'))
    expect(again).toMatchObject({ lines: 0, meals: 0 })
    f = apply(f, P.planMeal('dad', { date: '2026-09-23', slot: 'dinner', recipe: f.recipes['starter-curry']! }, T('2026-09-21', '10:10')))
    const third = P.addPlanToList('dad', f, MAIN_LIST, '2026-09-21', '2026-09-27', T('2026-09-21', '10:15'))
    expect(third.meals).toBe(1)
    f = apply(f, third.events)
    expect(itemsOf(f, MAIN_LIST).some((i) => /curry/i.test(i.name))).toBe(true)
  })

  it('leaves out the things you say you already have', () => {
    let f = withRecipes()
    f = apply(f, P.planMeal('dad', { date: '2026-09-22', slot: 'dinner', recipe: f.recipes['starter-spag-bol']! }, T('2026-09-21', '09:00')))
    const all = P.addPlanToList('dad', f, MAIN_LIST, '2026-09-21', '2026-09-27', T('2026-09-21', '10:00'))
    const skipped = P.addPlanToList('dad', f, MAIN_LIST, '2026-09-21', '2026-09-27', T('2026-09-21', '10:00'), { skip: new Set([nameKey('Beef mince'), nameKey('Spaghetti')]) })
    expect(skipped.lines).toBe(all.lines - 2)
    const g = apply(f, skipped.events)
    expect(itemsOf(g, MAIN_LIST).some((i) => /mince|spaghetti/i.test(i.name))).toBe(false)
    expect(g.meals[planIdFor('2026-09-22', 'dinner')]!.shopped).toBe(true)
  })

  it('a run can name the saved session it came from without carrying the whole thing', () => {
    const f = withMorning(family())
    const { events } = P.startRun('ellie', 'ellie', { routineId: 'rt-morning', title: 'Morning routine', steps: steps(5, 10, 5) }, T('2026-09-21', '07:10'))
    const g = apply(f, events)
    expect(allRuns(g)[0]!.routineId).toBe('rt-morning')
  })

  it('a meal keeps its "shopped for" mark when only the cook changes, and loses it when the food does', () => {
    let f = withRecipes()
    f = apply(f, P.planMeal('dad', { date: '2026-09-22', slot: 'dinner', recipe: f.recipes['starter-fajitas']! }, T('2026-09-21', '09:00')))
    f = apply(f, P.addPlanToList('dad', f, MAIN_LIST, '2026-09-21', '2026-09-27', T('2026-09-21', '10:00')).events)
    const m = f.meals[planIdFor('2026-09-22', 'dinner')]!
    expect(m.shopped).toBe(true)
    f = apply(f, P.planMeal('dad', { date: '2026-09-22', slot: 'dinner', recipe: f.recipes['starter-fajitas']!, cookId: 'mum', existing: m }, T('2026-09-21', '11:00')))
    expect(f.meals[planIdFor('2026-09-22', 'dinner')]).toMatchObject({ cookId: 'mum', shopped: true })
    f = apply(f, P.planMeal('dad', { date: '2026-09-22', slot: 'dinner', recipe: f.recipes['starter-curry']!, existing: f.meals[planIdFor('2026-09-22', 'dinner')]! }, T('2026-09-21', '12:00')))
    expect(f.meals[planIdFor('2026-09-22', 'dinner')]!.shopped).toBeFalsy()
  })

  it('suggests a week without repeating, without touching what is planned, and quick meals on busy nights', () => {
    let f = withRecipes()
    const week = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27']
    f = apply(f, P.planMeal('dad', { date: '2026-09-24', slot: 'dinner', title: 'Out for dinner' }, T('2026-09-20', '09:00')))
    const quick = new Set(['2026-09-22', '2026-09-25'])
    for (let seed = 1; seed <= 20; seed++) {
      const s = suggestMeals(f, week, makeRng(seed), { today: '2026-09-21', quick })
      expect(s).toHaveLength(6)
      expect(s.some((x) => x.date === '2026-09-24')).toBe(false)
      expect(new Set(s.map((x) => x.recipeId)).size).toBe(6)
      for (const x of s) {
        const r = f.recipes[x.recipeId!]!
        expect(r.meal === 'dinner' || r.meal === 'any').toBe(true)
        if (quick.has(x.date)) expect(r.minutes!).toBeLessThanOrEqual(30)
      }
    }
    // different seeds give different weeks
    const a = suggestMeals(f, week, makeRng(1), { today: '2026-09-21' }).map((x) => x.recipeId).join()
    const b = suggestMeals(f, week, makeRng(2), { today: '2026-09-21' }).map((x) => x.recipeId).join()
    expect(a).not.toBe(b)
    // same seed, same week
    expect(suggestMeals(f, week, makeRng(1), { today: '2026-09-21' }).map((x) => x.recipeId).join()).toBe(a)
    // and they can be planned in one go
    f = apply(f, P.planSuggestions('dad', f, suggestMeals(f, week, makeRng(3), { today: '2026-09-21' }), 'dinner', T('2026-09-21', '10:00')))
    expect(week.every((d) => mealAt(f, d, 'dinner'))).toBe(true)
  })

  it('leans towards meals not had for a while', () => {
    let f = withRecipes()
    f = apply(f, P.planMeal('dad', { date: '2026-09-19', slot: 'dinner', recipe: f.recipes['starter-pizza']! }, T('2026-09-19', '09:00')))
    expect(lastPlanned(f, '2026-09-21')['starter-pizza']).toBe('2026-09-19')
    let pizza = 0
    let other = 0
    for (let seed = 1; seed <= 300; seed++) {
      const s = suggestMeals(f, ['2026-09-22'], makeRng(seed), { today: '2026-09-21' })[0]!
      if (s.recipeId === 'starter-pizza') pizza++
      else if (s.recipeId === 'starter-spag-bol') other++
    }
    expect(pizza).toBeLessThan(other) // had it two days ago, so it comes up less than one not had for ages
  })

  it('finds the evenings someone is out at tea time', () => {
    let f = withRecipes()
    f = apply(f, A.saveCal('dad', { title: 'Football', date: '2026-09-23', allDay: false, start: '17:00', end: '18:30', members: ['ellie'], category: 'activity', busy: true }, T('2026-09-20', '09:00')))
    f = apply(f, A.saveCal('dad', { title: 'Dentist', date: '2026-09-24', allDay: false, start: '09:00', end: '09:30', members: ['dad'], category: 'appointment', busy: true }, T('2026-09-20', '09:00')))
    const set = busyEvenings(makeCalCtx(f), ['2026-09-22', '2026-09-23', '2026-09-24'], ['ellie', 'dad'])
    expect([...set]).toEqual(['2026-09-23'])
    expect(busyEvenings(makeCalCtx(f), ['2026-09-23'], ['mum']).size).toBe(0)
  })
})
