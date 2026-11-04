import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import * as A from './actions'
import { blocksOf, isDayShift, lastConfirmedShiftPlan, legacyFieldsFor, makeRota, onDutyAt, proposeShiftPlan, rotaSummary, shiftPlanFor, spanAt, spansOf } from './shifts'
import { tsOf } from './dates'
import { applyFamilyEvent, projectFamily } from './project'
import type { FamilyState } from './types'

const T = (date: string, time = '12:00') => tsOf(date, time)
const apply = (f: FamilyState, evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, f)

function family(): FamilyState {
  const now = T('2026-09-21', '06:00') // a Monday
  const events: AppEvent[] = [
    ...A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, now),
    ...A.saveMember('dad', { id: 'mum', name: 'Mum', role: 'parent', colour: '#f72585', active: true }, now + 1),
    ...A.saveMember('dad', { id: 'robin', name: 'Robin', role: 'baby', colour: '#b388ff', active: true, birthday: '2026-09-15' }, now + 2),
  ]
  return projectFamily(events)
}

describe('shifts: isDayShift', () => {
  it('treats the day window as [dayStart, nightStart) and everything else as night', () => {
    expect(isDayShift('06:59', '07:00', '19:00')).toBe(false)
    expect(isDayShift('07:00', '07:00', '19:00')).toBe(true)
    expect(isDayShift('12:00', '07:00', '19:00')).toBe(true)
    expect(isDayShift('18:59', '07:00', '19:00')).toBe(true)
    expect(isDayShift('19:00', '07:00', '19:00')).toBe(false)
    expect(isDayShift('23:59', '07:00', '19:00')).toBe(false)
    expect(isDayShift('00:00', '07:00', '19:00')).toBe(false)
  })
})

describe('shifts: proposing a week', () => {
  it('with nothing confirmed yet, proposes 4-hour blocks from 22:00 taken in turns', () => {
    const f = family()
    const p = proposeShiftPlan(f, 'robin', '2026-09-21', ['dad', 'mum'])!
    expect(spansOf(p.blocks!, '22:00').map((s) => `${s.start}-${s.end} ${s.parentId}`)).toEqual(['22:00-02:00 dad', '02:00-06:00 mum', '06:00-10:00 dad', '10:00-14:00 mum', '14:00-18:00 dad', '18:00-22:00 mum'])
  })

  it('returns undefined with fewer than two parents to assign', () => {
    const f = family()
    expect(proposeShiftPlan(f, 'robin', '2026-09-21', ['dad'])).toBeUndefined()
  })

  it('swaps last confirmed week\'s parents (so the hard overnight shift rotates), keeping its hours', () => {
    let f = family()
    f = apply(f, A.saveShiftPlan('dad', { babyId: 'robin', weekOf: '2026-09-21', dayParentId: 'dad', nightParentId: 'mum', dayStart: '06:30', nightStart: '20:00', confirmed: true }, T('2026-09-20')))
    const p = proposeShiftPlan(f, 'robin', '2026-09-28', ['dad', 'mum'])
    expect(p).toEqual({ dayParentId: 'mum', nightParentId: 'dad', dayStart: '06:30', nightStart: '20:00' })
  })

  it('ignores an unconfirmed plan when proposing the next one, and looks further back than just the prior week', () => {
    let f = family()
    f = apply(f, A.saveShiftPlan('dad', { babyId: 'robin', weekOf: '2026-09-21', dayParentId: 'dad', nightParentId: 'mum', dayStart: '07:00', nightStart: '19:00', confirmed: true }, T('2026-09-20')))
    // Week of the 28th was only ever proposed, never confirmed - the 5th should still swap off the 21st, not the 28th.
    f = apply(f, A.saveShiftPlan('dad', { babyId: 'robin', weekOf: '2026-09-28', dayParentId: 'dad', nightParentId: 'mum', dayStart: '07:00', nightStart: '19:00', confirmed: false }, T('2026-09-27')))
    expect(lastConfirmedShiftPlan(f, 'robin', '2026-10-05')?.weekOf).toBe('2026-09-21')
    const p = proposeShiftPlan(f, 'robin', '2026-10-05', ['dad', 'mum'])
    expect(p).toEqual({ dayParentId: 'mum', nightParentId: 'dad', dayStart: '07:00', nightStart: '19:00' })
  })
})

describe('shifts: who is on duty', () => {
  it('is undefined for a week nobody has confirmed', () => {
    const f = family()
    expect(onDutyAt(f, 'robin', T('2026-09-22', '03:00'))).toBeUndefined()
  })

  it('is undefined for a saved-but-unconfirmed proposal', () => {
    let f = family()
    f = apply(f, A.saveShiftPlan('dad', { babyId: 'robin', weekOf: '2026-09-21', dayParentId: 'dad', nightParentId: 'mum', dayStart: '07:00', nightStart: '19:00', confirmed: false }, T('2026-09-20')))
    expect(onDutyAt(f, 'robin', T('2026-09-22', '03:00'))).toBeUndefined()
  })

  it('names the right parent for day vs night once confirmed', () => {
    let f = family()
    f = apply(f, A.saveShiftPlan('dad', { babyId: 'robin', weekOf: '2026-09-21', dayParentId: 'dad', nightParentId: 'mum', dayStart: '07:00', nightStart: '19:00', confirmed: true }, T('2026-09-20')))
    expect(shiftPlanFor(f, 'robin', '2026-09-21')?.confirmed).toBe(true)
    expect(onDutyAt(f, 'robin', T('2026-09-23', '14:00'))).toEqual({ parentId: 'dad', shift: 'day', plan: expect.anything(), start: '07:00', end: '19:00' })
    expect(onDutyAt(f, 'robin', T('2026-09-23', '23:00'))).toEqual({ parentId: 'mum', shift: 'night', plan: expect.anything(), start: '19:00', end: '07:00' })
    expect(onDutyAt(f, 'robin', T('2026-09-24', '02:00'))).toEqual({ parentId: 'mum', shift: 'night', plan: expect.anything(), start: '19:00', end: '07:00' })
  })

  it('a later save for the same babyId+weekOf replaces the earlier one (upsert, latest wins)', () => {
    let f = family()
    f = apply(f, A.saveShiftPlan('dad', { babyId: 'robin', weekOf: '2026-09-21', dayParentId: 'dad', nightParentId: 'mum', dayStart: '07:00', nightStart: '19:00', confirmed: true }, T('2026-09-20')))
    f = apply(f, A.saveShiftPlan('mum', { babyId: 'robin', weekOf: '2026-09-21', dayParentId: 'mum', nightParentId: 'dad', dayStart: '07:00', nightStart: '19:00', confirmed: true }, T('2026-09-20', '18:00')))
    expect(onDutyAt(f, 'robin', T('2026-09-23', '14:00'))?.parentId).toBe('mum')
  })
})

describe('shifts: a rota of 4-hour blocks', () => {
  const rota = makeRota('22:00', 4, ['dad', 'mum'])

  it('makes 22-02, 02-06, 06-10, 10-14, 14-18, 18-22, taking turns', () => {
    expect(spansOf(rota, '22:00').map((s) => `${s.start}-${s.end} ${s.parentId}`)).toEqual(['22:00-02:00 dad', '02:00-06:00 mum', '06:00-10:00 dad', '10:00-14:00 mum', '14:00-18:00 dad', '18:00-22:00 mum'])
  })

  it('finds the block for any time, across midnight', () => {
    expect(spanAt(rota, '23:30')?.parentId).toBe('dad')
    expect(spanAt(rota, '01:59')?.parentId).toBe('dad')
    expect(spanAt(rota, '02:00')?.parentId).toBe('mum')
    expect(spanAt(rota, '21:59')?.start).toBe('18:00')
  })

  it('sums each parent\'s hours and their longest break', () => {
    const s = rotaSummary(rota)
    expect(s.map((x) => [x.parentId, x.onMinutes / 60, x.longestOffMinutes / 60]).sort()).toEqual([['dad', 12, 4], ['mum', 12, 4]])
    // two blocks in a row for one parent gives the other a longer sleep
    const custom = [{ start: '22:00', parentId: 'dad' }, { start: '02:00', parentId: 'dad' }, { start: '06:00', parentId: 'mum' }, { start: '14:00', parentId: 'dad' }, { start: '18:00', parentId: 'mum' }]
    expect(rotaSummary(custom).find((x) => x.parentId === 'mum')!.longestOffMinutes / 60).toBe(8)
  })

  it('is used for who is on duty once confirmed, and next week proposes the parents swapped', () => {
    let f = family()
    f = apply(f, A.saveShiftPlan('dad', { babyId: 'robin', weekOf: '2026-09-21', ...legacyFieldsFor(rota), blocks: rota, confirmed: true }, T('2026-09-20')))
    expect(onDutyAt(f, 'robin', T('2026-09-23', '03:00'))).toMatchObject({ parentId: 'mum', start: '02:00', end: '06:00' })
    expect(onDutyAt(f, 'robin', T('2026-09-23', '23:00'))).toMatchObject({ parentId: 'dad', start: '22:00', end: '02:00' })
    const next = proposeShiftPlan(f, 'robin', '2026-09-28', ['dad', 'mum'])!
    expect(spanAt(next.blocks!, '23:00')?.parentId).toBe('mum')
    expect(spanAt(next.blocks!, '03:00')?.parentId).toBe('dad')
  })

  it('reads an old day/night plan as two blocks', () => {
    expect(blocksOf({ dayStart: '07:00', nightStart: '19:00', dayParentId: 'dad', nightParentId: 'mum' })).toEqual([{ start: '07:00', parentId: 'dad' }, { start: '19:00', parentId: 'mum' }])
  })
})
