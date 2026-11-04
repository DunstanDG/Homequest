import { describe, expect, it } from 'vitest'
import { weekTitle } from './calTitle'

describe('weekTitle', () => {
  it('names one month once', () => {
    expect(weekTitle('2026-10-05')).toEqual({ title: '5 – 11 Oct', year: '2026' })
  })
  it('shows both months when the week spans two', () => {
    expect(weekTitle('2026-09-28')).toEqual({ title: '28 Sep – 4 Oct', year: '2026' })
  })
  it('shows both years over New Year', () => {
    expect(weekTitle('2025-12-29')).toEqual({ title: '29 Dec – 4 Jan', year: '2025–26' })
  })
})
