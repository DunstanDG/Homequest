import { useState } from 'react'
import type { NumericField, NumericItem } from '@/engine/types'
import { Rich } from '../rich'
import { Keypad, numberKeys } from '../keypad'
import { Foot } from '../foot'
import { displayNumeric, numericKey } from '../inputLogic'
import { CheckButton, resultClass, useKeys, type AnswerProps } from './shared'

function Box({ field, value, active, locked, cls, onTap }: { field: NumericField; value: string; active: boolean; locked: boolean; cls: string; onTap: () => void }) {
  return (
    <button
      type="button"
      className={`abox${field.superscript ? ' sup' : ''}${active && !locked ? ' active' : ''}${value ? ' filled' : ''}${cls}`}
      onClick={onTap}
      aria-label={field.label ? undefined : 'Answer box'}
    >
      {value ? <Rich text={displayNumeric(value)} /> : <span className="ph">&nbsp;</span>}
      {active && !locked && <span className="caret" />}
    </button>
  )
}

export function NumericAnswer({ item, locked, judgement, onSubmit, nudge }: AnswerProps<NumericItem>) {
  const [vals, setVals] = useState<string[]>(() => item.fields.map(() => ''))
  const [active, setActive] = useState(0)
  const kind = item.keypad ?? 'number'
  const multi = item.fields.length > 1
  const cls = resultClass(locked, judgement)

  const press = (k: string) => {
    if (locked) return
    if (k === 'next') return setActive((a) => (a + 1) % item.fields.length)
    setVals((v) => v.map((x, i) => (i === active ? numericKey(x, k) : x)))
  }
  const canCheck = vals.every((v) => v.trim() !== '')
  const submit = () => canCheck && onSubmit({ kind: 'numeric', values: vals })

  useKeys(!locked, (e) => {
    if (e.key === 'Enter') return submit()
    if (e.key === 'Tab' && multi) {
      e.preventDefault()
      return press('next')
    }
    if (e.key === 'Backspace') return press('back')
    if (/^[0-9]$/.test(e.key) || e.key === '.' || e.key === '-' || (kind === 'fraction' && (e.key === '/' || e.key === ' '))) {
      e.preventDefault()
      press(e.key)
    }
  })

  const box = (i: number) => {
    const f = item.fields[i] as NumericField
    return <Box key={`b${i}`} field={f} value={vals[i] as string} active={active === i} locked={locked} cls={cls} onTap={() => setActive(i)} />
  }

  let body
  if (item.template) {
    const parts = item.template.split(/(\{\d+\})/g).filter(Boolean)
    body = (
      <div className="answer-row template">
        {parts.map((p, k) => {
          const m = /^\{(\d+)\}$/.exec(p)
          return m ? box(Number(m[1])) : <Rich key={`t${k}`} text={p} className="afix" />
        })}
      </div>
    )
  } else {
    body = (
      <div className="answer-stack">
        {item.fields.map((f, i) => (
          <div className="answer-row" key={i}>
            {f.label && <Rich text={f.label} className="alabel" />}
            {f.prefix && <Rich text={f.prefix} className="afix" />}
            {box(i)}
            {f.suffix && <Rich text={f.suffix} className="afix" />}
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className={`answer-area${nudge ? ' shake' : ''}`} key={nudge}>
        {body}
      </div>
      {!locked && (
        <Foot>
          <Keypad keys={numberKeys(kind, multi)} cols={4} onPress={press} />
          <CheckButton disabled={!canCheck} onClick={submit} />
        </Foot>
      )}
    </>
  )
}
