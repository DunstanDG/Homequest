import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import * as A from './actions'
import * as P from './planActions'
import { makeCalCtx, tasksFor } from './calendar'
import { addDays, tsOf } from './dates'
import { dumpList } from './dump'
import { childWarning, dumpForViewer, firstThen, nextUpOrder, pickNext, rowKey } from './calmToday'
import { applyFamilyEvent, projectFamily } from './project'
import type { FamilyState } from './types'

const T = (date: string, time = '12:00') => tsOf(date, time)
const apply = (f: FamilyState, evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, f)
const TODAY = '2026-11-04'

function family(): FamilyState {
  const t0 = T('2026-10-01', '08:00')
  return projectFamily([
    ...A.saveMember('mum', { id: 'mum', name: 'Mum', role: 'parent', colour: '#4cc9f0', active: true }, t0),
    ...A.saveMember('mum', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, t0 + 1),
    ...A.saveMember('mum', { id: 'kid', name: 'Kid', role: 'child', colour: '#ffc857', active: true }, t0 + 2),
  ])
}

describe('brain dump privacy for children', () => {
  it('shows a child only what is for them or what they wrote; grown-ups see everything', () => {
    let f = family()
    f = apply(f, P.addDump('mum', [{ title: 'Renew car insurance', area: 'Admin' }, { title: 'Pack the hospital bag', ownerId: 'dad' }, { title: 'Sort your Lego', ownerId: 'kid' }], T('2026-11-01')))
    f = apply(f, P.addDump('kid', [{ title: 'Ask about swimming' }], T('2026-11-02')))
    const all = dumpList(f)
    expect(all).toHaveLength(4)
    expect(dumpForViewer(f, all, 'kid').map((d) => d.title).sort()).toEqual(['Ask about swimming', 'Sort your Lego'])
    expect(dumpForViewer(f, all, 'mum')).toHaveLength(4)
    expect(dumpForViewer(f, all, undefined)).toHaveLength(4)
  })
})

describe('next up', () => {
  it('offers something timed and current first, then what is due soonest, and skips "not now"', () => {
    let f = family()
    f = apply(f, [
      ...A.saveTask('mum', { taskId: 'later', title: 'Homework due Friday', assignee: 'kid', kind: 'homework', part: 'any', date: addDays(TODAY, 2) }, T('2026-11-01')),
      ...A.saveTask('mum', { taskId: 'today', title: 'Bins out', assignee: 'kid', kind: 'chore', part: 'any', date: TODAY }, T('2026-11-01')),
      ...A.saveTask('mum', { taskId: 'timed', title: 'Piano practice', assignee: 'kid', kind: 'chore', part: 'any', date: TODAY, time: '16:15' }, T('2026-11-01')),
      ...A.saveTask('mum', { taskId: 'evening', title: 'Timed later', assignee: 'kid', kind: 'chore', part: 'any', date: TODAY, time: '20:00' }, T('2026-11-01')),
    ])
    const now = T(TODAY, '16:00')
    const rows = tasksFor(makeCalCtx(f), 'kid', TODAY, now)
    const order = nextUpOrder(rows, now).map((r) => r.task.taskId)
    expect(order[0]).toBe('timed')
    expect(order.indexOf('today')).toBeLessThan(order.indexOf('later'))
    const ordered = nextUpOrder(rows, now)
    expect(pickNext(ordered, new Set([rowKey(ordered[0]!)]))!.task.taskId).toBe(order[1])
    expect(pickNext(ordered, new Set(ordered.map(rowKey)))).toBeUndefined()
  })

  it('leaves done things out', () => {
    let f = family()
    f = apply(f, A.saveTask('mum', { taskId: 'a', title: 'A', assignee: 'kid', kind: 'chore', part: 'any', date: TODAY }, T('2026-11-01')))
    f = apply(f, A.completeTask('kid', f, f.tasks.a!, TODAY, {}, T(TODAY, '09:00')))
    const now = T(TODAY, '10:00')
    expect(nextUpOrder(tasksFor(makeCalCtx(f), 'kid', TODAY, now), now)).toEqual([])
  })
})

describe('warnings for children', () => {
  it('turns a tight gap into a calm line and keeps the rest for grown-ups', () => {
    expect(childWarning('only 5 min between Chess club and the walk home', ['Mum'])).toBe('Chess club runs close to walk home: Mum knows.')
    expect(childWarning('only 5 min between Chess club and the walk home', ['Mum', 'Dad'])).toBe('Chess club runs close to walk home: Mum and Dad know.')
    expect(childWarning('Overbooked: 3 hours more than the free time', ['Mum'])).toBeUndefined()
  })
})

describe('first, then', () => {
  it('uses the next free time in the plan, or something you enjoy', () => {
    const now = T(TODAY, '16:00')
    expect(firstThen('Maths sheet', [{ start: '17:00', end: '19:30', kind: 'free', title: 'Free time' }], now)).toEqual({ first: 'Maths sheet', then: 'free time at 17:00', emoji: '🎮' })
    expect(firstThen('Maths sheet', [{ start: '15:00', end: '17:00', kind: 'free', title: 'Free time' }], now).then).toBe('free time')
    expect(firstThen('Maths sheet', [], now)).toEqual({ first: 'Maths sheet', then: 'something you enjoy', emoji: '🌟' })
  })
})
