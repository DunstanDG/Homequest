import { useState } from 'react'
import type { ExprItem } from '@/engine/types'
import { Rich } from '../rich'
import { Keypad, exprKeys } from '../keypad'
import { Foot } from '../foot'
import { displayExpr, exprKey } from '../inputLogic'
import { CheckButton, resultClass, useKeys, type AnswerProps } from './shared'

const FORM_NOTE: Record<string, string> = {
  expanded: 'Write your answer expanded and simplified.',
  simplified: 'Write your answer in its simplest form.',
  factorised: 'Write your answer factorised, with the common factor outside the brackets.',
}

export function ExprAnswer({ item, locked, judgement, onSubmit, nudge }: AnswerProps<ExprItem>) {
  const [value, setValue] = useState('')
  const press = (k: string) => !locked && setValue((v) => exprKey(v, k))
  const canCheck = value.trim() !== ''
  const submit = () => canCheck && onSubmit({ kind: 'expr', value })
  const keys = exprKeys(item.variables)

  useKeys(!locked, (e) => {
    if (e.key === 'Enter') return submit()
    if (e.key === 'Backspace') return press('back')
    if (e.key.length === 1 && /[0-9a-zA-Z+\-*/^().]/.test(e.key)) {
      e.preventDefault()
      press(e.key)
    }
  })

  return (
    <>
      <div className={`answer-area${nudge ? ' shake' : ''}`} key={nudge}>
        <div className="answer-row">
          {item.prefix && <Rich text={item.prefix} className="afix" />}
          <div className={`abox wide${value ? ' filled' : ''}${locked ? '' : ' active'}${resultClass(locked, judgement)}`}>
            {value ? <Rich text={displayExpr(value)} /> : <span className="ph">&nbsp;</span>}
            {!locked && <span className="caret" />}
          </div>
        </div>
        {item.form && item.form !== 'any' && FORM_NOTE[item.form] && <p className="note">{FORM_NOTE[item.form]}</p>}
      </div>
      {!locked && (
        <Foot>
          <Keypad keys={keys.top} cols={keys.top.length} onPress={press} dense />
          <Keypad keys={keys.main} cols={4} onPress={press} />
          <CheckButton disabled={!canCheck} onClick={submit} />
        </Foot>
      )}
    </>
  )
}
