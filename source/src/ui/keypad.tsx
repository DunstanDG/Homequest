import type { ReactNode } from 'react'
import { Icon } from './icons'

export interface KeyDef {
  /** Value passed to onPress. */
  k: string
  label?: ReactNode
  tone?: 'digit' | 'op' | 'var' | 'action' | 'blank'
  aria?: string
  disabled?: boolean
}

export function Keypad({ keys, cols, onPress, dense }: { keys: KeyDef[]; cols: number; onPress: (k: string) => void; dense?: boolean }) {
  return (
    <div className={dense ? 'keypad dense' : 'keypad'} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {keys.map((key, i) =>
        key.tone === 'blank' ? (
          <span key={i} />
        ) : (
          <button
            key={i}
            type="button"
            className={`key ${key.tone ?? 'digit'}`}
            aria-label={key.aria ?? (typeof key.label === 'string' ? key.label : key.k)}
            disabled={key.disabled}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => onPress(key.k)}
          >
            {key.label ?? key.k}
          </button>
        ),
      )}
    </div>
  )
}

const back: KeyDef = { k: 'back', label: <Icon name="backspace" size={22} />, tone: 'action', aria: 'Delete' }
const blank: KeyDef = { k: '', tone: 'blank' }

/** 4x4: digits, delete, minus, decimal point, and (for fraction items) slash and mixed-number space. */
export function numberKeys(kind: 'number' | 'fraction', multi: boolean): KeyDef[] {
  return [
    { k: '7' }, { k: '8' }, { k: '9' }, back,
    { k: '4' }, { k: '5' }, { k: '6' }, { k: '-', label: '±', tone: 'op', aria: 'Plus or minus' },
    { k: '1' }, { k: '2' }, { k: '3' }, { k: '.', tone: 'op' },
    { k: '0' },
    kind === 'fraction' ? { k: '/', label: '⁄', tone: 'op', aria: 'Fraction bar' } : blank,
    kind === 'fraction' ? { k: ' ', label: '␣', tone: 'op', aria: 'Space for a mixed number' } : blank,
    multi ? { k: 'next', label: <Icon name="chevron" size={22} />, tone: 'action', aria: 'Next box' } : blank,
  ]
}

/** Algebra keypad: variable/power row on top, then digits and operators. */
export function exprKeys(vars: string[]): { top: KeyDef[]; main: KeyDef[] } {
  return {
    top: [
      ...vars.map((v): KeyDef => ({ k: v, tone: 'var' })),
      { k: 'sq', label: 'x²', tone: 'op', aria: 'Squared' },
      { k: '^', label: 'xʸ', tone: 'op', aria: 'Power' },
      { k: '(', tone: 'op' },
      { k: ')', tone: 'op' },
    ],
    main: [
      { k: '7' }, { k: '8' }, { k: '9' }, back,
      { k: '4' }, { k: '5' }, { k: '6' }, { k: 'plus', label: '+', tone: 'op' },
      { k: '1' }, { k: '2' }, { k: '3' }, { k: 'minus', label: '−', tone: 'op' },
      { k: '0' }, { k: '.', tone: 'op' }, { k: 'mul', label: '×', tone: 'op' }, { k: 'div', label: '÷', tone: 'op' },
    ],
  }
}
