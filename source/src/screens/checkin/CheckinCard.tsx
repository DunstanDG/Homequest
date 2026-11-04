import { Link } from 'react-router-dom'
import { checkinOf, hasCheckin, openPart } from '@/family/checkin/checkin'
import { useCalCtx, useFamily, useMe } from '@/app/context'
import { dayTypeOf } from '@/family/checkin/dayType'
import { ymdOf } from '@/family/dates'
import type { Member } from '@/family/types'
import { Icon } from '@/ui/icons'

/** The Today card for whichever check-in is open now. Once it is done it shrinks to a line with a way back in. */
export function CheckinCard({ view, now }: { view: Member; now: number }) {
  const f = useFamily()
  const ctx = useCalCtx()
  const me = useMe()!
  const mine = view.id === me.id
  if (!hasCheckin(view) || (!mine && me.role !== 'parent')) return null
  const part = openPart(f, view.id, now, dayTypeOf(ctx, view.id, ymdOf(now)))
  if (!part) return null
  const done = checkinOf(f, view.id, ymdOf(now), part)
  const to = `/checkin/${part}${mine ? '' : `?for=${view.id}`}`
  const name = part === 'morning' ? 'Morning check-in' : 'Evening check-in'
  const emoji = part === 'morning' ? '🌅' : '🌙'
  const who = mine ? '' : `${view.name}'s `
  if (done) {
    return (
      <div className="card checkin-done">
        <span aria-hidden>{emoji}</span>
        <span className="grow muted">
          {who}
          {name} done
        </span>
        <Link to={to} className="link-btn">
          Open
        </Link>
      </div>
    )
  }
  return (
    <div className="card callout checkin-card">
      <span className="checkin-emoji" aria-hidden>
        {emoji}
      </span>
      <div className="grow">
        <h3>
          {who}
          {name}
        </h3>
        <p className="muted">{part === 'morning' ? 'Look at the day ahead, tick off your morning habits, and say how you are.' : 'Look back at the day, add anything missed, wind down.'}</p>
        <Link to={to} className="btn primary small">
          <Icon name="play" size={16} /> Start
        </Link>
      </div>
    </div>
  )
}
