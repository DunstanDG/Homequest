import { describe, expect, it } from 'vitest'
import { calmClasses, calmOf, parseCalmOverride } from './calm'

describe('calm classes and the demo override', () => {
  it('puts nothing on <html> by default', () => {
    expect(calmClasses(calmOf(undefined))).toEqual([])
  })
  it('turns each setting into its class', () => {
    expect(calmClasses(calmOf({ textScale: 'larger', font: 'readable', contrast: 'high', lowStim: true, hideCountdowns: true }))).toEqual([
      'calm-zoom',
      'calm-text-larger',
      'calm-font-readable',
      'calm-contrast-high',
      'calm-low-stim',
      'calm-no-countdowns',
    ])
  })
  it('reads ?calm= words, ignoring ones it does not know', () => {
    expect(parseCalmOverride('Larger,readable, lowstim,nocount,quiet,one,sparkly')).toEqual({ textScale: 'larger', font: 'readable', lowStim: true, hideCountdowns: true, celebrate: 'quiet', focus: 'one' })
    expect(parseCalmOverride('')).toEqual({})
  })
})
