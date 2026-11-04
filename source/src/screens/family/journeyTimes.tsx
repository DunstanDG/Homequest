/**
 * "How long to get there?": pick two saved places and a time, and see every way of going side by side (walk, bus,
 * train, car, bike) with when to leave and when you'd arrive. The home server works it out, reached through the
 * assistant bridge on the family's Tailscale network like the planning help in the event form.
 */
import { useState } from 'react'
import { useApp, useFamily, useMe, useNow } from '@/app/context'
import { friendlyDay, ymdOf } from '@/family/dates'
import { assistantUrl, isJourneyAnswer, journeyBody, type JourneyAnswer, type JourneyMode } from '@/family/travel/assistant'
import { homePlaceOf, livePlaces } from '@/family/travel/travel'
import type { Hm } from '@/family/types'
import { Seg } from '@/ui/fam'

const LABEL: Record<JourneyMode, string> = { walk: '🚶 Walk', bus: '🚌 Bus', train: '🚆 Train', car: '🚗 Car', bike: '🚲 Bike' }

const ROUND = (n: number) => `${Math.floor(n / 60) ? `${Math.floor(n / 60)} h ` : ''}${n % 60} min`.replace(/ 0 min$/, '')

export function JourneyTimes() {
  const f = useFamily()
  const me = useMe()!
  const { sync } = useApp()
  const now = useNow()
  const today = ymdOf(now)
  const url = assistantUrl(f)
  const places = livePlaces(f)
  const home = homePlaceOf(f, me.id)
  const [from, setFrom] = useState(home?.placeId ?? places[0]?.placeId ?? '')
  const [to, setTo] = useState(places.find((p) => p.placeId !== (home?.placeId ?? places[0]?.placeId))?.placeId ?? '')
  const [date, setDate] = useState(today)
  const [time, setTime] = useState<Hm>('09:00')
  const [when, setWhen] = useState<'arrive' | 'leave'>('arrive')
  const [res, setRes] = useState<JourneyAnswer>()
  const [state, setState] = useState<'idle' | 'working' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  if (!url) return <p className="note">Journey times work over the family’s Tailscale network once the assistant is set up on the home server.</p>
  if (places.length < 2) return <p className="note">Save at least two places (Places tab) and you can compare ways of getting between them.</p>

  const ask = async () => {
    setState('working')
    setMsg('')
    try {
      const r = await fetch(`${url}/journey`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-family-key': sync.config()?.familyKey ?? '' },
        body: JSON.stringify(journeyBody(from, to, date, time, when)),
      })
      const data: unknown = await r.json().catch(() => undefined)
      if (r.ok && isJourneyAnswer(data)) {
        setRes(data)
        setState('idle')
      } else {
        setMsg((data as { error?: string } | undefined)?.error ?? 'The home server couldn’t work that out.')
        setState('error')
      }
    } catch {
      setMsg('Can’t reach the home server. Check Tailscale is on.')
      setState('error')
    }
  }

  const swap = () => (setFrom(to), setTo(from), setRes(undefined))

  return (
    <div className="card journey-times">
      <h3>How long to get there?</h3>
      <div className="grid2">
        <label className="field">
          <span>From</span>
          <select className="tbox" value={from} onChange={(e) => (setFrom(e.target.value), setRes(undefined))}>
            {places.map((p) => (
              <option key={p.placeId} value={p.placeId}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>To</span>
          <select className="tbox" value={to} onChange={(e) => (setTo(e.target.value), setRes(undefined))}>
            {places.map((p) => (
              <option key={p.placeId} value={p.placeId}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button type="button" className="link-btn" onClick={swap}>
        ⇅ Swap
      </button>
      <Seg<'arrive' | 'leave'> value={when} onChange={setWhen} options={[{ id: 'arrive', label: 'Arrive by' }, { id: 'leave', label: 'Leave at' }]} />
      <div className="grid2">
        <label className="field">
          <span>Day</span>
          <input type="date" className="tbox" value={date} min={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
        <label className="field">
          <span>Time</span>
          <input type="time" className="tbox" value={time} onChange={(e) => e.target.value && setTime(e.target.value)} />
        </label>
      </div>
      <button type="button" className="btn primary block" disabled={!from || !to || from === to || state === 'working'} onClick={ask}>
        {state === 'working' ? 'Working it out…' : 'Show journey times'}
      </button>
      {state === 'error' && <p className="note warn">{msg}</p>}
      {res && (
        <ul className="list journey-options" aria-live="polite">
          <li className="stack">
            <small className="muted">
              {res.from} to {res.to}, {res.when === 'arrive' ? 'arriving by' : 'leaving at'} {res.time} {friendlyDay(res.date, today)}
            </small>
          </li>
          {res.options.map((o) => (
            <li key={o.mode} className="stack">
              <div style={{ display: 'grid', gap: 2 }}>
                <strong>{LABEL[o.mode] ?? o.mode}</strong>
                {o.ok ? (
                  <span>
                    {o.minutes != null && <strong>{ROUND(o.minutes)}</strong>} · leave {o.leaveBy}, arrive {o.arrive}
                  </span>
                ) : (
                  <span className="muted">{o.note?.includes('try again') ? 'Still loading' : 'Not available'}</span>
                )}
              </div>
              {o.steps?.map((s, i) => (
                <small key={i} className="muted">
                  {s}
                </small>
              ))}
              {o.note && <small className="muted">{o.note}</small>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
