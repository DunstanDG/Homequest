import { useMemo, useState } from 'react'
import type { MatchItem } from '@/engine/types'
import { hashString, makeRng } from '@/engine/rng'
import { Rich } from '../rich'
import { Foot } from '../foot'
import { CheckButton, type AnswerProps } from './shared'

/** Tap a left card then a right card to pair them. Tap a paired card to undo. */
export function MatchAnswer({ item, locked, judgement, onSubmit }: AnswerProps<MatchItem>) {
  const [pairs, setPairs] = useState<Record<string, string>>({})
  const [left, setLeft] = useState<string | null>(null)
  // Deterministic shuffle so the right-hand column never lines up with the left.
  const rights = useMemo(() => {
    const r = makeRng(hashString(item.id)).shuffle(item.pairs)
    return r.every((p, i) => p.id === item.pairs[i]?.id) && r.length > 1 ? [...r.slice(1), r[0] as (typeof r)[number]] : r
  }, [item])
  const pairIndex = (leftId: string) => Object.keys(pairs).indexOf(leftId)
  const rightOwner = (rightId: string) => Object.keys(pairs).find((k) => pairs[k] === rightId)

  const tapLeft = (id: string) => {
    if (locked) return
    if (pairs[id]) {
      setPairs(({ [id]: _drop, ...rest }) => rest)
      setLeft(null)
    } else setLeft(left === id ? null : id)
  }
  const tapRight = (id: string) => {
    if (locked) return
    const owner = rightOwner(id)
    if (owner) {
      setPairs(({ [owner]: _drop, ...rest }) => rest)
      return
    }
    if (left) {
      setPairs((p) => ({ ...p, [left]: id }))
      setLeft(null)
    }
  }
  const done = Object.keys(pairs).length === item.pairs.length
  const verdict = (leftId: string) => (locked && judgement ? (pairs[leftId] === leftId ? ' good' : ' bad') : '')

  return (
    <>
      <p className="note">Tap a card on the left, then its partner on the right.</p>
      <div className="match">
        <div className="match-col">
          {item.pairs.map((p) => {
            const idx = pairIndex(p.id)
            return (
              <button key={p.id} type="button" disabled={locked} className={`mcard${left === p.id ? ' selected' : ''}${idx >= 0 ? ` paired p${idx % 5}` : ''}${verdict(p.id)}`} onClick={() => tapLeft(p.id)}>
                <Rich text={p.left} />
              </button>
            )
          })}
        </div>
        <div className="match-col">
          {rights.map((p) => {
            const owner = rightOwner(p.id)
            const idx = owner ? pairIndex(owner) : -1
            return (
              <button key={p.id} type="button" disabled={locked} className={`mcard${idx >= 0 ? ` paired p${idx % 5}` : ''}${owner ? verdict(owner) : ''}`} onClick={() => tapRight(p.id)}>
                <Rich text={p.right} />
              </button>
            )
          })}
        </div>
      </div>
      {!locked && (
        <Foot>
          <CheckButton disabled={!done} onClick={() => onSubmit({ kind: 'match', pairs })} />
        </Foot>
      )}
    </>
  )
}
