import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import * as A from './actions'
import { babyDay, babyLast24h, describeBaby, MAX_SLEEP_MIN, overlappingSleep, sleepSpan } from './care'
import { tsOf } from './dates'
import { applyFamilyEvent, projectFamily } from './project'
import type { FamilyState } from './types'

const T = (date: string, time = '12:00') => tsOf(date, time)
const MIN = 60_000
const NOW = T('2026-10-09', '15:00')

function family(): FamilyState {
  return projectFamily([
    ...A.saveMember('mum', { id: 'mum', name: 'Mum', role: 'parent', colour: '#4cc9f0', active: true }, NOW - 1000),
    ...A.saveMember('mum', { id: 'bub', name: 'Bub', role: 'baby', colour: '#b388ff', active: true, birthday: '2026-09-01' }, NOW - 999),
  ])
}
const apply = (f: FamilyState, evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, f)

describe('logging a sleep after the fact', () => {
  it('a start and a length make a finished sleep that shows up like a timed one', () => {
    const span = sleepSpan(T('2026-10-09', '13:00'), 45, NOW)
    expect(span).toEqual({ ok: true, at: T('2026-10-09', '13:00'), endAt: T('2026-10-09', '13:45') })
    if (!span.ok) return
    const f = apply(family(), A.logBaby('mum', { babyId: 'bub', kind: 'sleep', at: span.at, endAt: span.endAt }, NOW))
    const entry = f.babies[0]!
    expect(describeBaby(entry)).toBe('Sleep, 45m')
    expect(babyDay(f, 'bub', '2026-10-09')).toMatchObject({ sleepMinutes: 45 })
    expect(babyLast24h(f, 'bub', NOW)).toHaveLength(1)
  })

  it('a sleep still going on, nothing, or longer than a day cannot be logged this way', () => {
    expect(sleepSpan(NOW - 30 * MIN, 45, NOW)).toEqual({ ok: false, reason: 'future' })
    expect(sleepSpan(NOW - 60 * MIN, 60, NOW)).toMatchObject({ ok: true })
    expect(sleepSpan(NOW - 60 * MIN, 0, NOW)).toEqual({ ok: false, reason: 'empty' })
    expect(sleepSpan(NOW - 60 * MIN, Number.NaN, NOW)).toEqual({ ok: false, reason: 'empty' })
    expect(sleepSpan(NOW - 30 * 60 * MIN, MAX_SLEEP_MIN + 1, NOW)).toEqual({ ok: false, reason: 'toolong' })
  })

  it('a night that runs past midnight counts on the day it started', () => {
    const at = T('2026-10-08', '22:30')
    const span = sleepSpan(at, 8 * 60, NOW)
    expect(span).toMatchObject({ ok: true, endAt: T('2026-10-09', '06:30') })
    if (!span.ok) return
    const f = apply(family(), A.logBaby('mum', { babyId: 'bub', kind: 'sleep', at: span.at, endAt: span.endAt }, NOW))
    expect(babyDay(f, 'bub', '2026-10-08').sleepMinutes).toBe(480)
    expect(babyDay(f, 'bub', '2026-10-09').sleepMinutes).toBe(0)
  })

  it('warns about overlapping a sleep already logged, but not about one that merely touches, or the entry being edited', () => {
    const f = apply(family(), A.logBaby('mum', { babyId: 'bub', kind: 'sleep', at: T('2026-10-09', '10:00'), endAt: T('2026-10-09', '11:00') }, NOW))
    const existing = f.babies[0]!
    expect(overlappingSleep(f, 'bub', T('2026-10-09', '10:30'), T('2026-10-09', '11:30'))?.id).toBe(existing.id)
    expect(overlappingSleep(f, 'bub', T('2026-10-09', '11:00'), T('2026-10-09', '12:00'))).toBeUndefined()
    expect(overlappingSleep(f, 'bub', T('2026-10-09', '09:00'), T('2026-10-09', '10:00'))).toBeUndefined()
    expect(overlappingSleep(f, 'bub', T('2026-10-09', '10:30'), T('2026-10-09', '11:30'), existing.id)).toBeUndefined()
    expect(overlappingSleep(f, 'other', T('2026-10-09', '10:30'), T('2026-10-09', '11:30'))).toBeUndefined()
  })

  it('editing a sleep’s start and length replaces it, and a removed sleep stops counting', () => {
    let f = apply(family(), A.logBaby('mum', { babyId: 'bub', kind: 'sleep', at: T('2026-10-09', '10:00'), endAt: T('2026-10-09', '10:30') }, NOW))
    const old = f.babies[0]!
    f = apply(f, A.editBaby('mum', old, { at: T('2026-10-09', '10:15'), endAt: T('2026-10-09', '11:45') }, NOW + 1))
    const live = f.babies.filter((b) => !f.voided[b.id])
    expect(live).toHaveLength(1)
    expect(describeBaby(live[0]!)).toBe('Sleep, 1h 30m')
    expect(babyDay(f, 'bub', '2026-10-09').sleepMinutes).toBe(90)
    f = apply(f, A.undo('mum', live[0]!.id))
    expect(babyDay(f, 'bub', '2026-10-09').sleepMinutes).toBe(0)
  })
})
