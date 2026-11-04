import { describe, expect, it } from 'vitest'
import * as A from './actions'
import type { AgendaItem } from './calendar'
import { makeCalCtx } from './calendar'
import { tsOf } from './dates'
import { projectFamily } from './project'
import { drainOf, minutesLeft, nextTransition, nextTransitionFrom, stageOf, transitionText } from './transitions'
import type { TravelLeg } from './travel/types'

const D = '2026-11-04'
const T = (time: string, sec = 0) => tsOf(D, time) + sec * 1000
const leg = (o: Partial<TravelLeg>): TravelLeg => ({ key: 'l1', refId: 'school', direction: 'out', fromName: 'Home', toName: 'School', mode: 'train', status: 'planned', ...o })
const item = (o: Partial<AgendaItem>): AgendaItem => ({ key: 'i1', source: 'cal', title: 'Swimming', date: D, allDay: false, members: ['kid'], everyone: false, category: 'activity', busy: true, ...o })

describe('nextTransitionFrom', () => {
  it('picks the next leave-by, then the next timed event start', () => {
    const legs = [leg({ key: 'out', leaveBy: '07:42' }), leg({ key: 'back', direction: 'back', toName: 'Home', leaveBy: '15:20' })]
    const items = [item({ key: 'swim', start: '17:00' }), item({ key: 'school', source: 'school', title: 'School', start: '08:30' })]
    expect(nextTransitionFrom(legs, items, D, T('07:00'))).toMatchObject({ kind: 'leave', title: 'School', at: T('07:42') })
    // The everyday school block is not a transition of its own; the trip home is ("leave for home").
    expect(nextTransitionFrom(legs, items, D, T('08:00'))).toMatchObject({ kind: 'leave', title: 'home', at: T('15:20') })
    expect(nextTransitionFrom(legs, items, D, T('15:30'))).toMatchObject({ kind: 'start', title: 'Swimming', at: T('17:00') })
    expect(nextTransitionFrom(legs, items, D, T('17:00'))).toBeUndefined()
  })

  it('ignores all-day items, untimed legs and lessons', () => {
    const items = [item({ allDay: true, start: '09:00' }), item({ key: 'l', source: 'lesson', start: '09:00' }), item({ key: 'r', source: 'routine', start: '09:00' })]
    expect(nextTransitionFrom([leg({})], items, D, T('08:00'))).toBeUndefined()
  })

  it('leaving comes first when both are at the same minute', () => {
    const t = nextTransitionFrom([leg({ leaveBy: '16:30' })], [item({ start: '16:30' })], D, T('16:00'))
    expect(t?.kind).toBe('leave')
  })
})

describe('stages and words', () => {
  const t = { key: 'k', kind: 'leave' as const, title: 'School', at: T('08:00') }
  it('shows at 10, 5 and 1 minutes, and not before or after', () => {
    expect(stageOf(t, T('07:49'))).toBeUndefined()
    expect(stageOf(t, T('07:50'))).toBe(10)
    expect(stageOf(t, T('07:54', 59))).toBe(10)
    expect(stageOf(t, T('07:55'))).toBe(5)
    expect(stageOf(t, T('07:59'))).toBe(1)
    expect(stageOf(t, T('08:00'))).toBeUndefined()
  })
  it('counts whole minutes, or just says "about" when countdowns are hidden', () => {
    expect(transitionText(t, T('07:50'), false)).toBe('10 minutes until we leave for School')
    expect(transitionText(t, T('07:52', 30), false)).toBe('8 minutes until we leave for School')
    expect(transitionText(t, T('07:59', 30), false)).toBe('1 minute until we leave for School')
    expect(transitionText(t, T('07:52'), true)).toBe('We leave for School in about 10 minutes')
    expect(transitionText(t, T('07:57'), true)).toBe('We leave for School in about 5 minutes')
    expect(transitionText(t, T('07:59', 20), true)).toBe('We leave for School in about a minute')
    const s = { key: 's', kind: 'start' as const, title: 'Swimming', at: T('17:00') }
    expect(transitionText(s, T('16:55'), false)).toBe('5 minutes until Swimming')
    expect(transitionText(s, T('16:55'), true)).toBe('Swimming starts in about 5 minutes')
    expect(minutesLeft(t, T('07:59', 59))).toBe(1)
  })
  it('the calm bar drains from full at 10 minutes to empty', () => {
    expect(drainOf(t, T('07:40'))).toBe(1)
    expect(drainOf(t, T('07:55'))).toBeCloseTo(0.5)
    expect(drainOf(t, T('08:05'))).toBe(0)
  })
})

describe('nextTransition (from the family state)', () => {
  it('uses the home server plan for the phone holder, else their next timed event', () => {
    let f = projectFamily([
      ...A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, T('06:00')),
      ...A.saveMember('kid', { id: 'kid', name: 'Kid', role: 'child', colour: '#ffc857', active: true }, T('06:00')),
      ...A.saveCal('dad', { title: 'Swimming', date: D, allDay: false, start: '17:00', end: '18:00', members: ['kid'], category: 'activity', busy: true }, T('06:00')),
      ...A.saveCal('dad', { title: 'Dentist', date: D, allDay: false, start: '11:00', members: ['dad'], category: 'appointment', busy: true }, T('06:00')),
    ])
    f = { ...f, travel: { ...f.travel, days: { [`kid|${D}`]: { type: 'travel-day', memberId: 'kid', date: D, legs: [leg({ leaveBy: '07:42' })], id: 'td', ts: T('06:00'), day: D, learnerId: 'server', v: 1 } } } }
    const ctx = makeCalCtx(f)
    expect(nextTransition(ctx, 'kid', T('07:35'))).toMatchObject({ kind: 'leave', title: 'School' })
    expect(nextTransition(ctx, 'kid', T('08:00'))).toMatchObject({ kind: 'start', title: 'Swimming' })
    expect(nextTransition(ctx, 'dad', T('08:00'))).toMatchObject({ kind: 'start', title: 'Dentist' })
  })
})
