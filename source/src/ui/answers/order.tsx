import { useState } from 'react'
import type { OrderItem } from '@/engine/types'
import { Rich } from '../rich'
import { Foot } from '../foot'
import { CheckButton, type AnswerProps } from './shared'

/** Tap-to-place ordering: tap items in order to fill the slots; tap a placed item to take it back. */
export function OrderAnswer({ item, locked, judgement, onSubmit }: AnswerProps<OrderItem>) {
  const [placed, setPlaced] = useState<string[]>([])
  const byId = new Map(item.items.map((i) => [i.id, i]))
  const pool = item.items.filter((i) => !placed.includes(i.id))
  const shown = locked && judgement && !judgement.correct ? item.correctOrder : placed
  const [lo, hi] = item.directionLabel
  return (
    <>
      <div className="order-dir">
        <span>{lo}</span>
        <span className="arrow">→</span>
        <span>{hi}</span>
      </div>
      <div className="order-slots">
        {item.items.map((_, i) => {
          const id = shown[i]
          const it = id ? byId.get(id) : undefined
          const state = locked && judgement ? (judgement.correct ? ' good' : ' shown') : ''
          return (
            <button
              key={i}
              type="button"
              className={`slot${it ? ' filled' : ''}${state}`}
              disabled={locked || !it}
              onClick={() => id && !locked && setPlaced((p) => p.filter((x) => x !== id))}
              aria-label={it ? `Position ${i + 1}, remove` : `Empty position ${i + 1}`}
            >
              <span className="slot-n">{i + 1}</span>
              {it ? <Rich text={it.label} /> : <span className="ph">&nbsp;</span>}
            </button>
          )
        })}
      </div>
      {!locked && (
        <div className="order-pool">
          {pool.map((i) => (
            <button key={i.id} type="button" className="chip" onClick={() => setPlaced((p) => [...p, i.id])}>
              <Rich text={i.label} />
            </button>
          ))}
        </div>
      )}
      {locked && judgement && !judgement.correct && <p className="note">Correct order shown above.</p>}
      {!locked && (
        <Foot>
          <CheckButton disabled={placed.length < item.items.length} onClick={() => onSubmit({ kind: 'order', order: placed })} />
        </Foot>
      )}
    </>
  )
}
