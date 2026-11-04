import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import { makeEvent } from '@/engine/make'
import * as A from '../actions'
import { itemsOn, makeCalCtx, recurCtxFor, peopleOf } from '../calendar'
import { tsOf } from '../dates'
import { applyFamilyEvent, projectFamily } from '../project'
import type { FamilyState } from '../types'
import * as T from './actions'
import { alarmsOn, clashesFor, hopSummary, homePlaceOf, isQuiet, lastPing, legsFor, ringIdFor, ringingNow, serverOn, settingsOf, tripsOn } from './travel'

const at = (date: string, time = '12:00') => tsOf(date, time)

function family(): FamilyState {
  const now = at('2026-10-26', '06:00')
  return projectFamily([
    ...A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, now),
    ...A.saveMember('dad', { id: 'kid', name: 'Kid', role: 'child', colour: '#ffc857', active: true }, now + 1),
  ])
}
const apply = (f: FamilyState, evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, f)
const server = (body: Record<string, unknown>, ts: number): AppEvent => makeEvent('dad', body as never, ts)
const ctxFor = (f: FamilyState) => {
  const ctx = makeCalCtx(f)
  return (m: string[]) => recurCtxFor(ctx, m)
}

describe('travel: places, prefs and settings', () => {
  it('starts hidden with defaults', () => {
    const f = family()
    expect(serverOn(f)).toBe(false)
    expect(settingsOf(f)).toMatchObject({ quietFrom: '21:30', quietTo: '06:30', leadMin: 10, changeMin: 5, walkMin: 10 })
  })
  it('keeps the latest place and finds the home place', () => {
    let f = family()
    f = apply(f, T.savePlace('dad', { placeId: 'home', name: 'Home', kind: 'home', station: 'PRP', stationName: 'Preston Park', walkMin: 4 }, at('2026-10-26')))
    f = apply(f, T.savePlace('dad', { placeId: 'sch', name: 'School', kind: 'school', station: 'HHE', walkMin: 30 }, at('2026-10-26', '12:01')))
    expect(homePlaceOf(f, 'kid')?.station).toBe('PRP')
    f = apply(f, T.deletePlace('dad', f.travel.places.sch!, at('2026-10-26', '12:02')))
    expect(f.travel.places.sch!.deleted).toBe(true)
  })
  it('quiet hours wrap midnight', () => {
    const s = { quietFrom: '21:30', quietTo: '06:30' }
    expect(isQuiet('23:00', s)).toBe(true)
    expect(isQuiet('06:00', s)).toBe(true)
    expect(isQuiet('06:30', s)).toBe(false)
    expect(isQuiet('12:00', { quietFrom: '12:00', quietTo: '13:00' })).toBe(true)
  })
})

describe('travel: trips on a day', () => {
  it('a school run every other week from 2 November, weekdays only', () => {
    let f = family()
    f = apply(
      f,
      T.saveTrip(
        'dad',
        {
          tripId: 'run',
          title: 'School run',
          members: ['kid'],
          date: '2026-11-02',
          recur: { freq: 'weekly', interval: 2, byWeekday: [0, 1, 2, 3, 4], schoolDaysOnly: true },
          spec: { placeId: 'sch', mode: 'train', arriveBy: '08:30' },
          leaveAt: '15:05',
        },
        at('2026-10-26'),
      ),
    )
    const on = (d: string) => tripsOn(f, d, ctxFor(f), peopleOf(f)).map((t) => t.refId)
    expect(on('2026-10-30')).toEqual([])
    expect(on('2026-11-02')).toEqual(['run'])
    expect(on('2026-11-06')).toEqual(['run'])
    expect(on('2026-11-07')).toEqual([]) // Saturday
    expect(on('2026-11-09')).toEqual([]) // the other week
    expect(on('2026-11-16')).toEqual(['run'])
  })
  it('calendar events with a trip are included, private and untimed ones are not', () => {
    let f = family()
    f = apply(
      f,
      A.saveCal(
        'dad',
        { calId: 'c1', title: 'Dinner', date: '2026-11-03', allDay: false, start: '19:00', end: '21:00', members: ['dad'], category: 'social', busy: true, trip: { placeId: 'x', mode: 'train' } },
        at('2026-10-26'),
      ),
    )
    f = apply(
      f,
      A.saveCal('dad', { calId: 'c2', title: 'Holiday', date: '2026-11-03', allDay: true, members: ['dad'], category: 'family', busy: false, trip: { placeId: 'x', mode: 'train' } }, at('2026-10-26')),
    )
    const trips = tripsOn(f, '2026-11-03', ctxFor(f), peopleOf(f))
    expect(trips.map((t) => [t.refId, t.arriveBy, t.leaveAt])).toEqual([['c1', '19:00', '21:00']])
  })
})

describe('travel: plans from the home server', () => {
  const leg = {
    key: 'out',
    refId: 'run',
    direction: 'out',
    fromName: 'Home',
    toName: 'School',
    mode: 'train',
    leaveBy: '07:32',
    arrive: '08:24',
    status: 'planned',
    hops: [{ from: 'Preston Park', to: 'Haywards Heath', dep: '07:42', arr: '07:53', platform: '2' }],
  }

  it('shows travel blocks on the calendar and leaves bad legs out', () => {
    let f = family()
    f = apply(f, [server({ type: 'travel-day', memberId: 'kid', date: '2026-11-02', legs: [leg, { key: 'bad', status: 'nonsense' }, { ...leg, key: 'x', leaveBy: '25:00' }] }, at('2026-11-01'))])
    expect(legsFor(f, 'kid', '2026-11-02')).toHaveLength(2)
    const items = itemsOn(makeCalCtx(f), '2026-11-02').filter((i) => i.source === 'travel')
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ title: 'Travel to School', start: '07:32', end: '08:24', members: ['kid'], busy: true })
    expect(items[0]!.sub).toContain('07:42 to Haywards Heath')
  })
  it('an older plan never replaces a newer one', () => {
    let f = family()
    f = apply(f, [server({ type: 'travel-day', memberId: 'kid', date: '2026-11-02', legs: [leg] }, at('2026-11-01', '20:00'))])
    f = apply(f, [server({ type: 'travel-day', memberId: 'kid', date: '2026-11-02', legs: [] }, at('2026-11-01', '19:00'))])
    expect(legsFor(f, 'kid', '2026-11-02')).toHaveLength(1)
  })
  it('summarises a change of trains', () => {
    const s = hopSummary({ ...leg, hops: [...leg.hops, { from: 'Haywards Heath', to: 'Lewes', dep: '08:05', late: 3 }] } as never)
    expect(s).toBe('07:42 to Haywards Heath, change for the 08:05 (+3) · platform 2')
  })
  it('finds a clash with something else that person is busy with', () => {
    const c = clashesFor(
      'kid',
      [leg as never],
      [
        { title: 'Breakfast club', start: '07:30', end: '08:00' },
        { title: 'The school run itself', start: '08:30', end: '15:05', refId: 'run' },
      ],
    )
    expect(c.map((x) => x.withTitle)).toEqual(['Breakfast club'])
  })
  it('reports ringing until someone taps Stop', () => {
    let f = family()
    f = apply(f, [server({ type: 'sched-status', refId: 'al1', date: '2026-11-02', memberId: 'kid', state: 'ringing' }, at('2026-11-02', '07:00'))])
    expect(ringingNow(f, '2026-11-02')).toHaveLength(1)
    f = apply(f, T.stopRing('kid', ringIdFor('al1', '2026-11-02'), at('2026-11-02', '07:01')))
    expect(ringingNow(f, '2026-11-02')).toHaveLength(0)
  })
  it('features switch the controls on, and Check connection pairs ping and pong', () => {
    let f = family()
    f = apply(f, [
      server({ type: 'server-features', alarms: true, trains: true, car: false, speakers: [{ id: 'media_player.a', name: 'Kitchen' }, { bad: 1 }], linked: ['dad'], version: '1' }, at('2026-11-01')),
    ])
    expect(serverOn(f)).toBe(true)
    expect(f.travel.features!.speakers).toEqual([{ id: 'media_player.a', name: 'Kitchen' }])
    const ping = T.pingServer('dad', at('2026-11-01', '12:00'))
    f = apply(f, ping)
    expect(lastPing(f)?.pongTs).toBeUndefined()
    f = apply(f, [server({ type: 'server-pong', pingId: (ping[0] as { pingId: string }).pingId, version: '1.0' }, at('2026-11-01', '12:01'))])
    expect(lastPing(f)).toMatchObject({ version: '1.0' })
  })
  it('alarms repeat on their days', () => {
    let f = family()
    f = apply(
      f,
      T.saveAlarm(
        'dad',
        { alarmId: 'a', memberId: 'kid', title: 'Wake up', date: '2026-11-02', time: '06:45', recur: { freq: 'weekly', byWeekday: [0, 1, 2, 3, 4] }, stopWhenLeave: true },
        at('2026-10-26'),
      ),
    )
    expect(alarmsOn(f, '2026-11-03', ctxFor(f)).map((a) => a.alarmId)).toEqual(['a'])
    expect(alarmsOn(f, '2026-11-07', ctxFor(f))).toEqual([])
  })
})
