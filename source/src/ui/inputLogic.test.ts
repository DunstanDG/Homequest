import { describe, expect, it } from 'vitest'
import { displayNumeric, exprKey, numericKey } from './inputLogic'
import { parseNumber } from '@/engine/judge'

describe('numeric keypad', () => {
  const type = (keys: string[]) => keys.reduce(numericKey, '')
  it('builds decimals, negatives and fractions the judge can parse', () => {
    expect(type(['3', '.', '5'])).toBe('3.5')
    expect(parseNumber(type(['-', '4', '.', '2']))?.value).toBe(-4.2)
    expect(parseNumber(type(['3', '/', '4']))?.value).toBe(0.75)
    expect(parseNumber(type(['1', ' ', '1', '/', '2']))?.value).toBe(1.5)
  })
  it('ignores impossible input', () => {
    expect(type(['.', '.'])).toBe('0.')
    expect(type(['/'])).toBe('')
    expect(type(['3', '/', '4', '/'])).toBe('3/4')
    expect(type([' '])).toBe('')
    expect(type(['3', '.', '1', '.'])).toBe('3.1')
  })
  it('toggles the sign and backspaces', () => {
    expect(type(['5', '-'])).toBe('-5')
    expect(type(['5', '-', '-'])).toBe('5')
    expect(type(['1', '2', 'back'])).toBe('1')
    expect(type(['back'])).toBe('')
  })
  it('caps length', () => {
    expect(type(Array(30).fill('9')).length).toBe(14)
  })
  it('shows fractions stacked', () => {
    expect(displayNumeric('1 3/4')).toBe('1 {3|4}')
    expect(displayNumeric('3/')).toBe('3/')
  })
})

describe('expression keypad', () => {
  it('appends symbols and shortcuts', () => {
    expect([...'3x', 'plus', '2'].reduce(exprKey, '')).toBe('3x+2')
    expect(['x', 'sq'].reduce(exprKey, '')).toBe('x^2')
    expect(['x', 'mul', '2', 'back'].reduce(exprKey, '')).toBe('x*')
  })
})
