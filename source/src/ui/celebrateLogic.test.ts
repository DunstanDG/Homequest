import { describe, expect, it } from 'vitest'
import { calmOf } from '@/app/calm'
import { chipFor, decideCelebration, messageFor } from './celebrateLogic'

const env = { reducedMotion: false, quietTimers: false }
const tick = { coins: 20, needsCheck: false, moment: 'normal' as const }

describe('decideCelebration', () => {
  it('full gets burst, chip, haptic and chime', () => {
    const d = decideCelebration(calmOf({ celebrate: 'full' }), env, tick)
    expect(d).toMatchObject({ show: true, burst: true, big: false, chip: '+20 🪙', haptic: 'tick', chime: true })
  })
  it('is the default', () => {
    expect(decideCelebration(calmOf(undefined), env, tick).burst).toBe(true)
  })
  it('no chime on quiet timers', () => {
    expect(decideCelebration(calmOf({}), { ...env, quietTimers: true }, tick)).toMatchObject({ burst: true, chime: false })
  })
  it('bigger moments are big', () => {
    expect(decideCelebration(calmOf({}), env, { ...tick, moment: 'first' }).big).toBe(true)
    expect(decideCelebration(calmOf({}), env, { ...tick, moment: 'all' }).big).toBe(true)
  })
  it('quiet is a toast and a gentle haptic only', () => {
    expect(decideCelebration(calmOf({ celebrate: 'quiet' }), env, tick)).toMatchObject({ show: true, burst: false, chime: false, haptic: 'gentle' })
  })
  it('off shows nothing, even with lowStim', () => {
    expect(decideCelebration(calmOf({ celebrate: 'off' }), env, tick).show).toBe(false)
    expect(decideCelebration(calmOf({ celebrate: 'off', lowStim: true }), env, tick).show).toBe(false)
  })
  it('lowStim and reduced motion never move or make a sound', () => {
    for (const [prefs, e] of [
      [{ lowStim: true }, env],
      [{}, { ...env, reducedMotion: true }],
      [{ celebrate: 'quiet' as const, lowStim: true }, env],
    ] as const) {
      const d = decideCelebration(calmOf(prefs), e, { ...tick, moment: 'all' })
      expect(d).toMatchObject({ show: true, burst: false, big: false, chime: false, haptic: 'none' })
    }
  })
})

describe('copy', () => {
  it('rotates messages', () => {
    expect(messageFor('normal', 0)).not.toBe(messageFor('normal', 1))
    expect(messageFor('normal', 99)).toBeTruthy()
  })
  it('chip wording', () => {
    expect(chipFor({ coins: 0, needsCheck: false })).toBeUndefined()
    expect(chipFor({ coins: 10, needsCheck: true })).toBe('10 🪙 once checked')
  })
})
