import { useRef, useState } from 'react'
import type { TextItem } from '@/engine/types'
import { Foot } from '../foot'
import { CheckButton, resultClass, type AnswerProps } from './shared'

const ACCENTS = ['ä', 'ö', 'ü', 'ß', 'é', 'è', 'ê', 'à', 'ç', 'ñ']

export function TextAnswer({ item, locked, judgement, onSubmit, nudge }: AnswerProps<TextItem>) {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  const insert = (ch: string) => {
    const el = ref.current
    const s = el?.selectionStart ?? value.length
    const e = el?.selectionEnd ?? value.length
    setValue(value.slice(0, s) + ch + value.slice(e))
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(s + 1, s + 1)
    })
  }
  const submit = () => value.trim() && onSubmit({ kind: 'text', value })
  return (
    <>
      <div className={`answer-area${nudge ? ' shake' : ''}`} key={nudge}>
        <input
          ref={ref}
          className={`tbox${resultClass(locked, judgement)}`}
          value={value}
          disabled={locked}
          placeholder={item.placeholder ?? 'Type your answer'}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        {!locked && (
          <div className="accents">
            {ACCENTS.map((a) => (
              <button key={a} type="button" className="chip small" onPointerDown={(e) => e.preventDefault()} onClick={() => insert(a)}>
                {a}
              </button>
            ))}
          </div>
        )}
      </div>
      {!locked && (
        <Foot>
          <CheckButton disabled={!value.trim()} onClick={submit} />
        </Foot>
      )}
    </>
  )
}
