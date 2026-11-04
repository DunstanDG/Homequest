import { describe, expect, it } from 'vitest'
import { emptyFamily, projectFamily } from '../project'
import { makeCalCtx } from '../calendar'
import * as P from '../planActions'
import { routinesOn, sessionStepsOn, routineDoneOn } from '../routines'
import { makeEvent } from '@/engine/make'
import type { AppEvent } from '@/engine/types'
import type { FamilyState, MemberId } from '../types'
import * as C from './actions'
import { configOf, nextOpenAt, openPart } from './checkin'
import { dayTypeOf } from './dayType'
import { applyRoutinePlan, existingRoutine, planDefaults } from './routinePlan'
import { routineForPart } from './routineCard'
import { withHabitSteps } from './routineHabits'

const ts = (d: string, hm: string) => Date.parse(`${d}T${hm}:00`)
const MON = '2026-10-12'
const SAT = '2026-10-17'

function family(): { f: FamilyState; evs: AppEvent[]; apply: (e: AppEvent[]) => FamilyState } {
  let evs: AppEvent[] = []
  const mk = (id: string, name: string, role: 'parent' | 'child') => makeEvent('mum', { type: 'member', memberId: id, name, role, emoji: '🙂', color: 'a', active: true } as never, ts(MON, '06:00'))
  evs = [mk('mum', 'Sam', 'parent'), mk('kid', 'Maya', 'child')]
  const apply = (e: AppEvent[]) => {
    evs = [...evs, ...e]
    return projectFamily(evs)
  }
  return { f: projectFamily(evs), evs, apply }
}

const input = (memberId: MemberId, role: 'parent' | 'child', schoolDays: boolean) => ({ memberId, ...planDefaults(role), schoolDays })

describe('weekday and weekend check-in windows', () => {
  it('does nothing for someone the family does not have', () => {
    const { apply } = family()
    const f = apply(applyRoutinePlan('mum', projectFamily([]), input('kid', 'child', false), ts(MON, '09:00')))
    // setup on a family that does not know Maya writes nothing
    expect(configOf(f, 'kid').morningFrom).toBe('06:00')
  })

  it('opens at the wake-up time for the kind of day', () => {
    const { f: f0, apply } = family()
    const f = apply(applyRoutinePlan('mum', f0, input('kid', 'child', false), ts(MON, '09:00')))
    expect(configOf(f, 'kid', 'weekday').morningFrom).toBe('07:00')
    expect(configOf(f, 'kid', 'weekend').morningFrom).toBe('08:00')
    expect(openPart(f, 'kid', ts(MON, '07:30'), 'weekday')).toBe('morning')
    expect(openPart(f, 'kid', ts(SAT, '07:30'), 'weekend')).toBeUndefined()
    expect(openPart(f, 'kid', ts(SAT, '08:30'), 'weekend')).toBe('morning')
    // evening opens an hour before bed
    expect(configOf(f, 'kid', 'weekday').eveningFrom).toBe('18:30')
    expect(configOf(f, 'kid', 'weekend').eveningFrom).toBe('19:00')
  })

  it('works out the next reminder from the next day type', () => {
    const { f: f0, apply } = family()
    let f = apply(applyRoutinePlan('mum', f0, input('kid', 'child', false), ts(MON, '09:00')))
    f = apply(C.saveCheckinConfig('mum', 'kid', { ...configOf(f, 'kid'), weekend: f.checkinConfig.kid!.weekend, remind: true }, ts(MON, '09:01')))
    const ctx = makeCalCtx(f)
    // Friday evening after the evening check-in opened: next is Saturday morning at the weekend time
    const fri = '2026-10-16'
    const at = nextOpenAt(f, 'kid', 'morning', ts(fri, '20:00'), (d) => dayTypeOf(ctx, 'kid', d))
    expect(at).toBe(ts(SAT, '08:00'))
  })

  it('treats Saturday and Sunday as weekend for people without a school', () => {
    const { f } = family()
    const ctx = makeCalCtx(f)
    expect(dayTypeOf(ctx, 'mum', MON)).toBe('weekday')
    expect(dayTypeOf(ctx, 'kid', SAT)).toBe('weekend')
  })
})

describe('routine setup', () => {
  it('makes a weekday and a weekend session for the morning and the evening, and only the right one is due', () => {
    const { f: f0, apply } = family()
    const f = apply(applyRoutinePlan('mum', f0, input('kid', 'child', false), ts(MON, '09:00')))
    const ctx = makeCalCtx(f)
    const mon = routinesOn(f, MON, { memberId: 'kid' }).filter((r) => r.ownerId === 'kid')
    const sat = routinesOn(f, SAT, { memberId: 'kid' }).filter((r) => r.ownerId === 'kid')
    expect(mon.map((r) => r.part).sort()).toEqual(['evening', 'morning'])
    expect(sat.map((r) => r.part).sort()).toEqual(['evening', 'morning'])
    expect(mon.find((r) => r.part === 'morning')!.startAt).toBe('07:00')
    expect(sat.find((r) => r.part === 'morning')!.startAt).toBe('08:00')
    expect(mon.find((r) => r.part === 'morning')!.finishBy).toBe('08:15')
    expect(routineForPart(ctx, 'kid', 'morning', MON, ts(MON, '07:00'))?.routine.routineId).not.toBe(routineForPart(ctx, 'kid', 'morning', SAT, ts(SAT, '08:00'))?.routine.routineId)
  })

  it('is safe to run twice: no copies of sessions, habits or the checklist', () => {
    const { f: f0, apply } = family()
    let f = apply(applyRoutinePlan('mum', f0, input('kid', 'child', false), ts(MON, '09:00')))
    const counts = (g: FamilyState) => [Object.values(g.routines).filter((r) => !r.deleted).length, Object.values(g.habits).filter((h) => !h.deleted).length]
    const first = counts(f)
    f = apply(applyRoutinePlan('mum', f, input('kid', 'child', false), ts(MON, '10:00')))
    expect(counts(f)).toEqual(first)
    expect(first[0]).toBe(4)
  })

  it('takes over a Morning routine that already exists instead of making a second', () => {
    const { f: f0, apply } = family()
    let f = apply(
      P.saveRoutine(
        'mum',
        { routineId: 'old', title: 'Morning routine', ownerId: 'kid', steps: [{ id: 'a', title: 'Teeth and wash', minutes: 4 }], finishBy: '08:00', startAt: '07:30', date: MON, taskId: 'pay' },
        ts(MON, '06:30'),
      ),
    )
    f = apply(applyRoutinePlan('mum', f, input('kid', 'child', false), ts(MON, '09:00')))
    const am = Object.values(f.routines).filter((r) => !r.deleted && r.part === 'morning')
    expect(am.map((r) => r.routineId).sort()).toEqual(['old', 'rt-kid-am-we'])
    const old = f.routines.old!
    expect(old.title).toBe('Morning routine')
    expect(old.taskId).toBe('pay')
    expect(old.startAt).toBe('07:00')
    expect(old.steps.map((s) => s.title)).toEqual(['Teeth and wash', 'My morning habits'])
    void f0
    expect(existingRoutine(f, 'kid', 'morning')?.routineId).toBe('old')
  })

  it('uses school days and days off for a child with a school, and Mon-Fri / Sat-Sun otherwise', () => {
    const { f: f0, apply } = family()
    const f = apply(applyRoutinePlan('mum', f0, input('kid', 'child', true), ts(MON, '09:00')))
    expect(f.routines['rt-kid-am-wd']!.recur).toMatchObject({ schoolDaysOnly: true })
    expect(f.routines['rt-kid-am-we']!.recur).toMatchObject({ offDaysOnly: true })
    const g = apply(applyRoutinePlan('mum', f0, input('mum', 'parent', false), ts(MON, '09:00')))
    expect(g.routines['rt-mum-am-wd']!.recur).toMatchObject({ byWeekday: [0, 1, 2, 3, 4] })
    expect(g.routines['rt-mum-am-we']!.recur).toMatchObject({ byWeekday: [5, 6] })
  })

  it('removes checklist items that are no longer wanted, and brings them back', () => {
    const { f: f0, apply } = family()
    let f = apply(applyRoutinePlan('mum', f0, { ...input('kid', 'child', false), leaving: ['Bag packed', 'Shoes on'] }, ts(MON, '09:00')))
    const live = (g: FamilyState) =>
      Object.values(g.habits)
        .filter((h) => !h.deleted && h.leaving)
        .map((h) => h.title)
        .sort()
    expect(live(f)).toEqual(['Bag packed', 'Shoes on'])
    f = apply(applyRoutinePlan('mum', f, { ...input('kid', 'child', false), leaving: ['Bag packed'] }, ts(MON, '10:00')))
    expect(live(f)).toEqual(['Bag packed'])
    f = apply(applyRoutinePlan('mum', f, { ...input('kid', 'child', false), leaving: ['Bag packed', 'Shoes on'] }, ts(MON, '11:00')))
    expect(live(f)).toEqual(['Bag packed', 'Shoes on'])
  })
})

describe('habits inside a routine', () => {
  const setup = () => {
    const { f: f0, apply } = family()
    let f = apply(applyRoutinePlan('mum', f0, { ...input('kid', 'child', false), leaving: ['Bag packed'], habitKeys: ['teeth-am', 'teeth-pm', 'nails'] }, ts(MON, '06:00')))
    return { f, apply }
  }

  it('expands the "My habits" step into the due morning habits, leaving ones last', () => {
    const { f } = setup()
    const r = f.routines['rt-kid-am-wd']!
    const steps = sessionStepsOn(f, r, MON)
    expect(steps.map((s) => s.title)).toEqual(['Get up and dressed', 'Breakfast', 'Brush teeth (morning)', 'Cut fingernails', 'Bag packed'])
  })

  it('leaves out habits already ticked and ones not due', () => {
    const { f, apply } = setup()
    const teeth = Object.values(f.habits).find((h) => h.starterKey === 'teeth-am')!
    const g = apply(C.tickHabit('kid', f, teeth.habitId, MON, ts(MON, '06:50')))
    const steps = sessionStepsOn(g, g.routines['rt-kid-am-wd']!, MON)
    expect(steps.some((s) => s.habitId === teeth.habitId)).toBe(false)
    // nails were done yesterday: not due today
    const nails = Object.values(g.habits).find((h) => h.starterKey === 'nails')!
    const h = apply(C.tickHabit('kid', g, nails.habitId, '2026-10-11', ts(MON, '06:55')))
    expect(sessionStepsOn(h, h.routines['rt-kid-am-wd']!, MON).some((s) => s.habitId === nails.habitId)).toBe(false)
  })

  it('ticking the step in a run writes one habit tick, shown in the check-in too, and never doubles', () => {
    const { f, apply } = setup()
    const r = f.routines['rt-kid-am-wd']!
    const src = P.runSourceFor(f, r, MON)
    const run = P.startRun('kid', 'kid', src, ts(MON, '07:00'))
    let g = apply(run.events)
    const teeth = Object.values(g.habits).find((h) => h.starterKey === 'teeth-am')!
    const stepId = src.steps!.find((s) => s.habitId === teeth.habitId)!.id
    const done = P.finishSteps('kid', g, run.runId, [stepId], 'done', ts(MON, '07:05'))
    expect(done.filter((e) => e.type === 'habit-done')).toHaveLength(1)
    g = apply(done)
    expect(g.habitDone[teeth.habitId]!.filter((e) => !g.voided[e.id])).toHaveLength(1)
    // ticked in the check-in afterwards: nothing more is written
    expect(C.tickHabit('kid', g, teeth.habitId, MON, ts(MON, '07:10'))).toHaveLength(0)
    // undoing the step takes the tick back
    g = apply(P.undoEvents('kid', done, ts(MON, '07:11')))
    expect(C.tickHabit('kid', g, teeth.habitId, MON, ts(MON, '07:12'))).toHaveLength(1)
  })

  it('a habit ticked first in the check-in means the step does not double it in the run', () => {
    const { f, apply } = setup()
    const teeth = Object.values(f.habits).find((h) => h.starterKey === 'teeth-am')!
    const g = apply(C.tickHabit('kid', f, teeth.habitId, MON, ts(MON, '06:55')))
    const run = P.startRun('kid', 'kid', P.runSourceFor(g, g.routines['rt-kid-am-wd']!, MON), ts(MON, '07:00'))
    expect(run.events).toHaveLength(1)
    expect(JSON.stringify(run.events[0])).not.toContain(teeth.habitId)
  })

  it('a pinned habit step stays only while its habit is due, and a deleted habit drops out', () => {
    const { f, apply } = setup()
    const nails = Object.values(f.habits).find((h) => h.starterKey === 'nails')!
    const steps = [{ id: 's1', title: 'Nails', minutes: 5, habitId: nails.habitId }]
    expect(withHabitSteps(f, steps, 'kid', MON)).toHaveLength(1)
    const g = apply(C.deleteHabit('kid', nails, ts(MON, '08:00')))
    expect(withHabitSteps(g, steps, 'kid', MON)).toHaveLength(0)
  })

  it('shows the routine as done once a run of it has finished', () => {
    const { f, apply } = setup()
    const r = f.routines['rt-kid-am-wd']!
    const src = P.runSourceFor(f, r, MON)
    const run = P.startRun('kid', 'kid', src, ts(MON, '07:00'))
    let g = apply(run.events)
    g = apply(
      P.finishSteps(
        'kid',
        g,
        run.runId,
        src.steps!.map((s) => s.id),
        'done',
        ts(MON, '07:20'),
      ),
    )
    expect(routineDoneOn(g, r.routineId, MON)).toBe(true)
    expect(routineForPart(makeCalCtx(g), 'kid', 'morning', MON, ts(MON, '07:30'))?.done).toBe(true)
  })
})

describe('recurrence off days', () => {
  it('unknown plan events are ignored by older phones', () => {
    const f = projectFamily([makeEvent('mum', { type: 'something-new', x: 1 } as never, 1)])
    expect(f.routinePlans).toEqual({})
    void emptyFamily
  })
})

describe('days off without a leave time', () => {
  it('drops the before-you-leave steps from the weekend session', () => {
    const { f: f0, apply } = family()
    const f = apply(applyRoutinePlan('mum', f0, { ...input('kid', 'child', false), leaving: ['Bag packed'], habitKeys: ['teeth-am'] }, ts(MON, '06:00')))
    expect(sessionStepsOn(f, f.routines['rt-kid-am-wd']!, MON).map((s) => s.title)).toContain('Bag packed')
    expect(sessionStepsOn(f, f.routines['rt-kid-am-we']!, SAT).map((s) => s.title)).not.toContain('Bag packed')
    const g = apply(
      applyRoutinePlan('mum', f, { ...input('kid', 'child', false), weekend: { wake: '08:00', leave: '10:00', bed: '20:00' }, leaving: ['Bag packed'], habitKeys: ['teeth-am'] }, ts(MON, '07:00')),
    )
    expect(sessionStepsOn(g, g.routines['rt-kid-am-we']!, SAT).map((s) => s.title)).toContain('Bag packed')
  })
})
