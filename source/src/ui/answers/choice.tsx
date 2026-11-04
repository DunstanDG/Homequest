import { useState } from 'react'
import type { ChoiceItem } from '@/engine/types'
import { Rich } from '../rich'
import { Foot } from '../foot'
import { CheckButton, type AnswerProps } from './shared'

export function ChoiceAnswer({ item, locked, onSubmit }: AnswerProps<ChoiceItem>) {
  const [sel, setSel] = useState<string | null>(null)
  return (
    <>
      <div className="options" role="radiogroup">
        {item.options.map((o) => {
          const chosen = sel === o.id
          let state = ''
          if (locked) {
            if (o.correct) state = ' good'
            else if (chosen) state = ' bad'
            else state = ' dim'
          } else if (chosen) state = ' selected'
          return (
            <button key={o.id} type="button" role="radio" aria-checked={chosen} className={`option${state}`} disabled={locked} onClick={() => setSel(o.id)}>
              <Rich text={o.label} />
            </button>
          )
        })}
      </div>
      {!locked && (
        <Foot>
          <CheckButton disabled={!sel} onClick={() => sel && onSubmit({ kind: 'choice', optionId: sel })} />
        </Foot>
      )}
    </>
  )
}
