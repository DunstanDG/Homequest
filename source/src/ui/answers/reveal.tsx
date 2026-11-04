import { useState } from 'react'
import { REVEAL_MIN_CHARS } from '@/engine/judge'
import type { RevealItem } from '@/engine/types'
import { Rich } from '../rich'
import { Foot } from '../foot'
import { CheckButton, type AnswerProps } from './shared'

/**
 * A written answer she marks herself: write first, then "Show the model answer" reveals a good answer and a
 * checklist, she ticks the points her answer made, and "Mark it" submits. The model stays hidden until she has
 * written something, so she can't copy it.
 */
export function RevealAnswer({ item, locked, onSubmit, nudge }: AnswerProps<RevealItem>) {
  const [text, setText] = useState('')
  const [shown, setShown] = useState(false)
  const [ticked, setTicked] = useState<number[]>([])
  const enough = text.trim().length >= REVEAL_MIN_CHARS
  const toggle = (i: number) => setTicked((t) => (t.includes(i) ? t.filter((x) => x !== i) : [...t, i]))
  return (
    <>
      <div className={`answer-area${nudge ? ' shake' : ''}`} key={nudge}>
        <textarea
          className="tbox reveal-input"
          value={text}
          disabled={locked || shown}
          placeholder={item.placeholder ?? 'Write your answer here, then check it against a model answer.'}
          onChange={(e) => setText(e.target.value)}
          aria-label="Your answer"
        />
        {!shown && !locked && <p className="note">{enough ? 'When you are happy with it, show the model answer.' : `Write at least a sentence first (${REVEAL_MIN_CHARS} characters).`}</p>}
        {(shown || locked) && (
          <>
            <div className="reveal-model">
              <h4>Model answer</h4>
              <Rich text={item.model} />
            </div>
            <p className="note">Tick each point your answer made. Be honest: this is how you get better at it.</p>
            <div className="reveal-checklist" role="group" aria-label="What a good answer does">
              {item.checklist.map((c, i) => (
                <label key={i} className={`reveal-check${ticked.includes(i) ? ' on' : ''}`}>
                  <input type="checkbox" checked={ticked.includes(i)} disabled={locked} onChange={() => toggle(i)} />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>
      {!locked && (
        <Foot>
          {shown ? (
            <CheckButton onClick={() => onSubmit({ kind: 'reveal', text, ticked })}>Mark it ({ticked.length} of {item.checklist.length})</CheckButton>
          ) : (
            <CheckButton disabled={!enough} onClick={() => setShown(true)}>
              Show the model answer
            </CheckButton>
          )}
        </Foot>
      )}
    </>
  )
}
