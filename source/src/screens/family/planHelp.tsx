/**
 * "Planning help" in the event form: as the date, time, people or travel change, asks the home server's quick
 * planner (via the assistant bridge, about a second, no language model) when everyone's free, what the chosen time
 * clashes with and when to leave. Shown only when an assistant is set up; quietly says so if it can't be reached.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, useFamily, useNow } from '@/app/context'
import { friendlyDay, ymdOf } from '@/family/dates'
import { askAboutDraft, assistantUrl, helpBody, isEventHelp, type EventDraft, type EventHelp } from '@/family/travel/assistant'
import { MODE_EMOJI } from '@/family/travel/travel'
import type { Hm } from '@/family/types'

const WAIT_MS = 700

export function PlanHelp({ draft, title, onPick }: { draft: EventDraft; title: string; onPick: (start: Hm, end: Hm) => void }) {
  const f = useFamily()
  const { sync, toast } = useApp()
  const today = ymdOf(useNow())
  const nav = useNavigate()
  const url = assistantUrl(f)
  const [help, setHelp] = useState<EventHelp>()
  const [state, setState] = useState<'idle' | 'checking' | 'error'>('idle')
  const seq = useRef(0)
  const body = JSON.stringify(helpBody(draft))

  useEffect(() => {
    if (!url) return
    const n = ++seq.current
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      setState('checking')
      try {
        const res = await fetch(`${url}/plan-event`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-family-key': sync.config()?.familyKey ?? '' },
          body,
          signal: ctrl.signal,
        })
        const data: unknown = await res.json().catch(() => undefined)
        if (n !== seq.current) return
        if (res.ok && isEventHelp(data)) {
          setHelp(data)
          setState('idle')
        } else setState('error')
      } catch (e) {
        if (n === seq.current && (e as Error)?.name !== 'AbortError') setState('error')
      }
    }, WAIT_MS)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [url, body, sync])

  if (!url) return null
  const timed = !!draft.start && !!draft.end && draft.end > draft.start
  const hard = help?.clashes.filter((c) => c.hard) ?? []
  const soft = help?.clashes.filter((c) => !c.hard) ?? []
  const names = (draft.everyone ? Object.values(f.members).filter((m) => m.role === 'parent' || m.role === 'child') : draft.members.map((m) => f.members[m])).map((m) => m?.name).filter(Boolean) as string[]
  const place = draft.trip?.placeId ? f.travel.places[draft.trip.placeId]?.name : undefined
  const mode = draft.trip?.mode

  return (
    <div className="card plan-help" aria-live="polite">
      <div className="row-between ph-head">
        <strong>Planning help</strong>
        <small className="muted">{state === 'checking' ? 'Checking…' : state === 'error' ? 'Can’t reach the home server' : help ? `for ${friendlyDay(help.date, today)}` : ''}</small>
      </div>
      {state === 'error' && !help && <p className="muted ph-note">Planning help works over the family’s Tailscale network. Check Tailscale is on, or carry on without it.</p>}
      {help && (
        <>
          {timed && hard.length === 0 && soft.length === 0 && <p className="ph-ok">✓ Everyone’s free then.</p>}
          {hard.map((c, i) => (
            <p key={`h${i}`} className="ph-clash">
              ⚠️ {c.who}: {c.title} {c.start}–{c.end}
            </p>
          ))}
          {soft.map((c, i) => (
            <p key={`s${i}`} className="muted ph-soft">
              {c.who}: {c.title} {c.start}–{c.end} (can move)
            </p>
          ))}
          {help.warnings.map((w) => (
            <p key={w} className="ph-warn">
              ⚠️ {w}
            </p>
          ))}
          {help.travel.map((t, i) => (
            <div key={i} className="ph-travel">
              {t.out && (
                <p>
                  {mode ? MODE_EMOJI[mode] : '🚆'} <strong>{t.who.join(', ')}</strong>: leave {t.out.leaveBy ?? '?'}, arrive {t.out.arrive ?? '?'}
                  {t.out.status === 'disrupted' ? ' (disrupted)' : ''}
                  {(t.out.trains || t.out.note) && <small className="muted"> · {t.out.trains ?? t.out.note}</small>}
                </p>
              )}
              {t.back && t.back.arrive && (
                <p className="muted">
                  Back: leave {t.back.leaveBy ?? '?'}, home {t.back.arrive}
                  {t.back.trains && <small> · {t.back.trains}</small>}
                </p>
              )}
            </div>
          ))}
          {help.slots.length > 0 && (
            <>
              <small className="muted">{timed && (hard.length || soft.length) ? 'Free for everyone instead:' : 'Free for everyone:'}</small>
              <div className="chips ph-slots">
                {help.slots.map((s) => (
                  <button key={s.from} type="button" className="chip small" onClick={() => onPick(s.suggest, s.suggestEnd)} title={`Free ${s.from}–${s.to}`}>
                    {s.suggest}–{s.suggestEnd}
                  </button>
                ))}
              </div>
            </>
          )}
          {help.slots.length === 0 && <p className="muted">No {help.minutes}-minute gap when everyone’s free that day.</p>}
        </>
      )}
      <button type="button" className="btn ghost small block" onClick={() => (toast('This event isn’t saved yet: come back and add it when you’re ready.'), nav(`/assistant?q=${encodeURIComponent(askAboutDraft(title, draft, names, place))}`))}>
        Ask the assistant about this
      </button>
    </div>
  )
}
