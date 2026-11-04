import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import * as A from './actions'
import * as CA from './careActions'
import { babyDay, babyLast24h, describeBaby, feedRunOf, milkAges, totalMilkMl } from './care'
import { tsOf } from './dates'
import { applyFamilyEvent, projectFamily } from './project'
import type { BabyEvent, FamilyState } from './types'
import { withDayBreaks } from '@/screens/family/careNow'

const T = (date: string, time = '12:00') => tsOf(date, time)
const MIN = 60_000

function family(): FamilyState {
  const now = T('2026-09-21', '06:00')
  return projectFamily([
    ...A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, now),
    ...A.saveMember('dad', { id: 'bub', name: 'Bub', role: 'baby', colour: '#b388ff', active: true, birthday: '2026-09-01' }, now + 1),
  ])
}
const apply = (f: FamilyState, evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, f)

describe('pumping', () => {
  it('logs a session with its side and time, and puts the milk in stock; removing the session takes it back out', () => {
    let f = family()
    const evs = CA.logPump('dad', 'bub', { at: T('2026-09-21', '07:00'), ml: 120, side: 'both', minutes: 15, location: 'freezer' }, T('2026-09-21', '07:20'))
    f = apply(f, evs)
    const entry = f.babies.find((b) => b.kind === 'pump')!
    expect(describeBaby(entry)).toBe('Pumped 120 ml, both sides, 15 min')
    expect(totalMilkMl(f, 'bub')).toBe(120)
    expect(milkAges(f, 'bub', '2026-09-24')).toEqual([{ ml: 120, location: 'freezer', days: 3 }])
    expect(babyDay(f, 'bub', '2026-09-21')).toMatchObject({ pumpedMl: 120, feeds: [] })
    const linked = f.milkStock.filter((m) => m.pumpEventId === entry.id)
    f = apply(f, [...A.undo('dad', entry.id), ...linked.flatMap((m) => A.undo('dad', m.id))])
    expect(totalMilkMl(f, 'bub')).toBe(0)
  })

  it('a session without an amount leaves the stock alone', () => {
    const f = apply(family(), CA.logPump('dad', 'bub', { at: T('2026-09-21', '07:00'), side: 'L', minutes: 10 }))
    expect(totalMilkMl(f, 'bub')).toBe(0)
    expect(describeBaby(f.babies[0]!)).toBe('Pumped, left, 10 min')
  })

  it('runs on the feed timer (side switching and all) and is logged as a pump entry when stopped', () => {
    let f = family()
    const start = CA.startFeedRun('dad', 'bub', 'pump', { side: 'L' }, T('2026-09-21', '08:00'))
    f = apply(f, start.events)
    f = apply(f, CA.switchFeedSide('dad', 'bub', start.feedRunId, 'R', T('2026-09-21', '08:08')))
    expect(feedRunOf(f, start.feedRunId)?.method).toBe('pump')
    f = apply(f, CA.stopPumpRun('dad', 'bub', start.feedRunId, { startedTs: T('2026-09-21', '08:00'), ml: 90, side: 'both', minutes: 16 }, T('2026-09-21', '08:16')))
    expect(feedRunOf(f, start.feedRunId)?.status).toBe('done')
    expect(f.babies.filter((b) => b.kind === 'pump').map(describeBaby)).toEqual(['Pumped 90 ml, both sides, 16 min'])
    expect(f.babies.some((b) => b.kind === 'feed')).toBe(false)
    expect(totalMilkMl(f, 'bub')).toBe(90)
  })

  it('a forgotten pumping session closes as a pump entry (not a feed) with no amount', () => {
    let f = family()
    const start = CA.startFeedRun('dad', 'bub', 'pump', { side: 'L' }, T('2026-09-21', '08:00'))
    f = apply(f, start.events)
    f = apply(f, CA.autoCloseFeedRun('dad', feedRunOf(f, start.feedRunId)!, T('2026-09-21', '12:00')))
    expect(f.babies.map((b) => b.kind)).toEqual(['pump'])
    expect(totalMilkMl(f, 'bub')).toBe(0)
  })
})

describe('the last 24 hours and day breaks', () => {
  it('shows everything across midnight, newest first, with a break where the day changes', () => {
    let f = family()
    for (const [d, t] of [
      ['2026-09-20', '21:00'],
      ['2026-09-20', '23:30'],
      ['2026-09-21', '02:00'],
      ['2026-09-21', '05:30'],
    ] as const)
      f = apply(f, A.logBaby('dad', { babyId: 'bub', kind: 'nappy', at: T(d, t), nappy: { wet: true, dirty: false } }))
    f = apply(f, A.logBaby('dad', { babyId: 'bub', kind: 'nappy', at: T('2026-09-19', '12:00'), nappy: { wet: true, dirty: false } }))
    const now = T('2026-09-21', '07:00')
    const logs = babyLast24h(f, 'bub', now)
    expect(logs.map((l) => new Date(l.at).getHours())).toEqual([5, 2, 23, 21])
    const rows = withDayBreaks<BabyEvent>(logs, '2026-09-21')
    expect(rows.map((r) => (r.kind === 'break' ? r.label : 'x'))).toEqual(['x', 'x', 'Yesterday', 'x', 'x'])
    // A list that is all from an earlier day starts with its label.
    expect(withDayBreaks<BabyEvent>(logs.slice(2), '2026-09-21')[0]).toEqual({ kind: 'break', label: 'Yesterday' })
  })

  it('leaves out a sleep that is still going, and lists medicine doses by name', () => {
    let f = family()
    f = apply(f, A.logBaby('dad', { babyId: 'bub', kind: 'sleep', at: T('2026-09-21', '06:00') }))
    f = apply(f, CA.logMedicine('dad', 'bub', 'Vitamin D', {}, T('2026-09-21', '06:30')))
    const logs = babyLast24h(f, 'bub', T('2026-09-21', '07:00') + MIN)
    expect(logs.map(describeBaby)).toEqual(['Vitamin D'])
    expect(babyDay(f, 'bub', '2026-09-21').health.map(describeBaby)).toEqual(['Vitamin D'])
  })
})
