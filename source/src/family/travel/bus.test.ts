import { describe, expect, it } from 'vitest'
import { makeEvent } from '@/engine/make'
import * as A from '../actions'
import { tsOf } from '../dates'
import { applyFamilyEvent, projectFamily } from '../project'
import { hopSummary, modesFor } from './travel'

const at = (t = '12:00') => tsOf('2026-11-03', t)
const base = () => projectFamily([...A.saveMember('dad', { id: 'kid', name: 'Kid', role: 'child', colour: '#ffc857', active: true }, at('06:00'))])
const srv = (body: Record<string, unknown>, ts = at()) => makeEvent('dad', body as never, ts)

describe('buses (0.15)', () => {
  it('offers Bus only when the home server has a journey planner for it', () => {
    let f = base()
    expect(modesFor(f)).toEqual(['train', 'walk', 'car'])
    f = applyFamilyEvent(f, srv({ type: 'server-features', alarms: true, trains: true, car: false, bus: true, speakers: [], linked: [], version: '0.15.0' }))
    expect(modesFor(f)).toEqual(['train', 'bus', 'walk', 'car'])
  })

  it('keeps bus legs and their bus numbers', () => {
    const f = applyFamilyEvent(
      base(),
      srv({
        type: 'travel-day',
        memberId: 'kid',
        date: '2026-11-03',
        legs: [{ key: 'c1:out', refId: 'c1', direction: 'out', mode: 'bus', status: 'planned', fromName: 'Home', toName: 'Pool', leaveBy: '08:05', arrive: '08:31',
          hops: [{ from: 'Preston Park', to: 'Seven Dials', dep: '08:12', arr: '08:20', line: '26' }, { from: 'Seven Dials', to: 'Churchill Sq', dep: '08:24', arr: '08:28', line: '7' }] }],
      }),
    )
    const leg = f.travel.days['kid|2026-11-03']!.legs[0]!
    expect(leg.mode).toBe('bus')
    expect(hopSummary(leg)).toBe('Bus 26 at 08:12 to Seven Dials, change for the 7 at 08:24')
  })
})
