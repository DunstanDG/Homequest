import { describe, expect, it } from 'vitest'
import { isJourneyAnswer, journeyBody } from './assistant'

describe('journey times', () => {
  it('sends only the two place ids, the day, the time and which way round', () => {
    expect(journeyBody('pl-home', 'pl-pool', '2026-11-03', '08:35', 'arrive')).toEqual({ from: 'pl-home', to: 'pl-pool', date: '2026-11-03', time: '08:35', when: 'arrive' })
  })
  it('only trusts an answer shaped like one', () => {
    const ok = { from: 'Home', to: 'Pool', date: '2026-11-03', when: 'arrive', time: '08:35', options: [{ mode: 'walk', ok: true, minutes: 22 }, { mode: 'car', ok: false, note: 'needs TomTom' }] }
    expect(isJourneyAnswer(ok)).toBe(true)
    expect(isJourneyAnswer({ ...ok, options: [{ mode: 'walk' }] })).toBe(false)
    expect(isJourneyAnswer({ error: 'x' })).toBe(false)
    expect(isJourneyAnswer(undefined)).toBe(false)
  })
})
