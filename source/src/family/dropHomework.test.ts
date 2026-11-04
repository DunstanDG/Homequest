import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import * as A from './actions'
import { makeCalCtx, tasksFor } from './calendar'
import { tsOf } from './dates'
import { balanceFor } from './economy'
import { missingHomework, openHomework } from './homework'
import { applyFamilyEvent, projectFamily } from './project'
import type { FamilyState } from './types'

const T = (date: string, time = '12:00') => tsOf(date, time)
const apply = (f: FamilyState, evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, f)
const MON = '2026-09-28'

function family(): FamilyState {
  const now = T('2026-09-20', '08:00')
  return projectFamily([
    ...A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, now),
    ...A.saveMember('dad', { id: 'ellie', name: 'Ellie', role: 'child', colour: '#ffc857', active: true }, now + 1),
    ...A.saveTask('ellie', { taskId: 'essay', title: 'Essay', assignee: 'ellie', kind: 'homework', part: 'any', minutes: 30, coins: 10, date: MON, subject: 'English' }, now + 2),
    ...A.saveTask('ellie', { taskId: 'maths', title: 'Maths sheet', assignee: 'ellie', kind: 'homework', part: 'any', minutes: 30, coins: 6, date: MON }, now + 3),
  ])
}
const avail = (f: FamilyState) => balanceFor(f, 'ellie').available
const doneOf = (f: FamilyState, id: string) => f.done[`${id}|${MON}`]!

describe('dropping homework ("not needed")', () => {
  it('takes an open piece off every list, keeps it on file, and restoring brings it back', () => {
    let f = family()
    expect(openHomework(f, 'ellie').map((t) => t.taskId)).toEqual(['essay', 'maths'])
    f = apply(f, A.dropHomework('dad', f.tasks.essay!, undefined, 0, 'skip it', T(MON, '09:00')).events)
    expect(openHomework(f, 'ellie').map((t) => t.taskId)).toEqual(['maths'])
    expect(tasksFor(makeCalCtx(f), 'ellie', MON, T(MON, '10:00')).map((r) => r.task.taskId)).toEqual(['maths'])
    expect(f.tasks.essay).toMatchObject({ dropped: { by: 'dad', why: 'skip it' } })
    f = apply(f, A.restoreHomework('dad', f.tasks.essay!, T(MON, '09:30')))
    expect(openHomework(f, 'ellie')).toHaveLength(2)
    expect(f.tasks.essay!.dropped).toBeUndefined()
  })

  it('cancels coins that were waiting for a check, so none arrive', () => {
    let f = family()
    f = apply(f, A.completeTask('ellie', f, f.tasks.essay!, MON, {}, T(MON, '17:00')))
    expect(balanceFor(f, 'ellie').waiting).toBe(10)
    const r = A.dropHomework('dad', f.tasks.essay!, doneOf(f, 'essay'), avail(f), undefined, T(MON, '18:00'))
    f = apply(f, r.events)
    expect(balanceFor(f, 'ellie')).toMatchObject({ waiting: 0, tasks: 0, available: 0 })
    expect(r.takenBack).toBe(0)
  })

  it('takes paid coins back, and keeps the history of what happened', () => {
    let f = family()
    f = apply(f, A.completeTask('dad', f, f.tasks.essay!, MON, {}, T(MON, '17:00')))
    expect(avail(f)).toBe(10)
    const r = A.dropHomework('dad', f.tasks.essay!, doneOf(f, 'essay'), avail(f), undefined, T(MON, '18:00'))
    f = apply(f, r.events)
    expect(r).toMatchObject({ takenBack: 10, shortBy: 0 })
    expect(avail(f)).toBe(0)
    expect(f.adjusts.some((a) => a.delta === -10 && a.reason.includes('Essay'))).toBe(true)
  })

  it('stops at zero when some of the coins were already spent', () => {
    let f = family()
    f = apply(f, A.completeTask('dad', f, f.tasks.essay!, MON, {}, T(MON, '17:00')))
    f = apply(f, A.adjustCoins('dad', 'ellie', -7, 'Spent on a treat', T(MON, '17:30'))) // 3 left
    const r = A.dropHomework('dad', f.tasks.essay!, doneOf(f, 'essay'), avail(f), undefined, T(MON, '18:00'))
    f = apply(f, r.events)
    expect(r).toMatchObject({ takenBack: 3, shortBy: 7 })
    expect(avail(f)).toBe(0)
  })

  it('leaves a dropped piece out of "missing" and does not pay it later', () => {
    let f = family()
    f = apply(f, A.dropHomework('dad', f.tasks.maths!, undefined, 0, undefined, T(MON, '08:00')).events)
    expect(missingHomework(makeCalCtx(f), 'ellie', MON)).not.toContain('Maths sheet')
  })
})

describe('un-ticking an approved task', () => {
  it('takes the coins back', () => {
    let f = family()
    f = apply(f, A.completeTask('dad', f, f.tasks.maths!, MON, {}, T(MON, '17:00')))
    const r = A.untickTask('dad', doneOf(f, 'maths'), 'ellie', avail(f), T(MON, '18:00'))
    f = apply(f, r.events)
    expect(r.shortBy).toBe(0)
    expect(avail(f)).toBe(0)
    expect(f.done[`maths|${MON}`]).toBeUndefined()
  })

  it('never leaves the balance below zero if some were spent', () => {
    let f = family()
    f = apply(f, A.completeTask('dad', f, f.tasks.maths!, MON, {}, T(MON, '17:00')))
    f = apply(f, A.adjustCoins('dad', 'ellie', -4, 'Spent', T(MON, '17:30'))) // 2 left of 6
    const r = A.untickTask('dad', doneOf(f, 'maths'), 'ellie', avail(f), T(MON, '18:00'))
    f = apply(f, r.events)
    expect(r.shortBy).toBe(4)
    expect(avail(f)).toBe(0)
  })
})
