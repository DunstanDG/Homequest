/**
 * Pure editing rules for the on-screen keypads (kept out of React so they can be unit-tested).
 * Values are plain strings in the format the judge already parses: "-3.5", "3/4", "1 1/2", "3x+2", "x^2".
 */

const MAX_LEN = 14

export type NumKey = string // '0'..'9' | '.' | '-' | '/' | ' ' | 'back'

/** Apply one key press to a numeric field's text. */
export function numericKey(value: string, key: NumKey): string {
  if (key === 'back') return value.slice(0, -1)
  if (key === '-') return value.startsWith('-') ? value.slice(1) : `-${value}`
  if (value.length >= MAX_LEN) return value
  if (/^\d$/.test(key)) return value + key
  if (key === '.') {
    const token = value.split(/[ /]/).pop() ?? ''
    if (token.includes('.')) return value
    return token === '' || token === '-' ? `${value}0.` : `${value}.`
  }
  if (key === '/') {
    if (value.includes('/') || !/\d$/.test(value)) return value
    return `${value}/`
  }
  if (key === ' ') {
    // Mixed number: only directly after a whole number.
    return /^-?\d+$/.test(value) ? `${value} ` : value
  }
  return value
}

/** Turn typed fractions into the fraction markup so the answer box shows a stacked fraction. */
export function displayNumeric(value: string): string {
  return value.replace(/(\d+)\/(\d+)/g, '{$1|$2}')
}

const EXPR_INSERT: Record<string, string> = { sq: '^2', mul: '*', div: '/', minus: '-', plus: '+' }

/** Apply one key press to an algebra expression's text. `key` is a literal to append, or a named action. */
export function exprKey(value: string, key: string): string {
  if (key === 'back') return value.slice(0, -1)
  if (value.length >= 30) return value
  return value + (EXPR_INSERT[key] ?? key)
}

/** Expression text for display: * becomes ×, / stays a slash. */
export function displayExpr(value: string): string {
  return value.replace(/\*/g, '×')
}
