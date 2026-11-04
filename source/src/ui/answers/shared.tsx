import { useEffect, type ReactNode } from 'react'
import type { Answer, Judgement } from '@/engine/types'

export interface AnswerProps<I> {
  item: I
  /** True once the answer has been judged (or while feedback is showing). */
  locked: boolean
  judgement?: Judgement | null
  onSubmit: (a: Answer) => void
  /** Increments when the last submission couldn't be read, to trigger a shake. */
  nudge: number
}

/** Physical keyboard support (handy on desktop and for testing). Ignored while typing in a real input. */
export function useKeys(enabled: boolean, handler: (e: KeyboardEvent) => void) {
  useEffect(() => {
    if (!enabled) return
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      handler(e)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [enabled, handler])
}

export function CheckButton({ disabled, onClick, children = 'Check' }: { disabled?: boolean; onClick: () => void; children?: ReactNode }) {
  return (
    <button type="button" className="btn primary big block" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}

export const resultClass = (locked: boolean, j?: Judgement | null) => (locked && j ? (j.correct ? ' good' : ' bad') : '')
