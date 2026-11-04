/**
 * Travel and alarms: today's journeys as the home server planned them, alarms, regular trips (the school run,
 * the commute), saved places and each person's travel habits. Hidden from the More hub until a home server has
 * introduced itself (see family/travel and docs/TRAVEL_AND_ALARMS.md).
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, useCalCtx, useFamily, useMe, useNow } from '@/app/context'
import { itemsOn, peopleOf, recurCtxFor } from '@/family/calendar'
import { addDays, friendlyDay, longDay, ymdOf } from '@/family/dates'
import * as T from '@/family/travel/actions'
import {
  MODE_EMOJI,
  MODE_LABEL,
  alarmsOn,
  clashesFor,
  hopSummary,
  homePlaceOf,
  leadMinOf,
  legTitle,
  legsFor,
  livePlaces,
  modeOf,
  ringIdFor,
  ringingNow,
  serverOn,
  statusOf,
  tripsOn,
  modesFor,
} from '@/family/travel/travel'
import type { AlarmEvent, PlaceEvent, TravelMode, TripEvent } from '@/family/travel/types'
import type { MemberId, Ymd } from '@/family/types'
import { MemberChips, SectionHead, Seg } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { EmptyState } from '@/ui/primitives'
import { JourneyTimes } from './journeyTimes'
import { usePeople } from './shared'
import { AlarmSheet, PlaceSheet, TripSheet } from './travelParts'

type Tab = 'today' | 'times' | 'alarms' | 'trips' | 'places'

export function Travel() {
  const f = useFamily()
  const me = useMe()!
  const nav = useNavigate()
  const [tab, setTab] = useState<Tab>('today')
  if (!serverOn(f)) {
    return (
      <div className="screen travel">
        <header className="screen-head">
          <div className="sh-title">
            <p className="eyebrow">Travel and alarms</p>
            <h1>Not set up</h1>
          </div>
        </header>
        <EmptyState icon="clock" title="No home server connected">
          Travel planning and speaker alarms need the family’s home server. Once it is connected, this screen fills in by itself.
          {me.role === 'parent' && (
            <button type="button" className="btn ghost block" onClick={() => nav('/parent?tab=data')}>
              Open settings
            </button>
          )}
        </EmptyState>
      </div>
    )
  }
  return (
    <div className="screen travel">
      <header className="screen-head">
        <div className="sh-title">
          <p className="eyebrow">Travel and alarms</p>
          <h1>Getting there</h1>
        </div>
      </header>
      <Seg<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { id: 'today', label: 'Today' },
          { id: 'times', label: 'Times' },
          { id: 'alarms', label: 'Alarms' },
          { id: 'trips', label: 'Trips' },
          { id: 'places', label: 'Places' },
        ]}
      />
      {tab === 'today' && <TodayTab />}
      {tab === 'times' && <JourneyTimes />}
      {tab === 'alarms' && <AlarmsTab />}
      {tab === 'trips' && <TripsTab />}
      {tab === 'places' && <PlacesTab />}
    </div>
  )
}

// ------------------------------------------------------------------ today

function TodayTab() {
  const f = useFamily()
  const ctx = useCalCtx()
  const me = useMe()!
  const { act, toast } = useApp()
  const now = useNow(30_000)
  const today = ymdOf(now)
  const people = usePeople()
  const [day, setDay] = useState<Ymd>(today)
  const ctxFor = (m: MemberId[]) => recurCtxFor(ctx, m)
  const trips = tripsOn(f, day, ctxFor, peopleOf(f))
  const alarms = alarmsOn(f, day, ctxFor)
  const ringing = day === today ? ringingNow(f, today) : []
  const items = itemsOn(ctx, day)
  const busyFor = (m: MemberId) =>
    items
      .filter((i) => i.source !== 'travel' && i.busy && !i.allDay && i.start && i.end && (i.everyone || i.members.includes(m)))
      .map((i) => ({ title: i.title, start: i.start!, end: i.end!, refId: i.calId }))
  const clashes = people.flatMap((p) => clashesFor(p.id, legsFor(f, p.id, day), busyFor(p.id)))

  return (
    <>
      <div className="row-between day-nav">
        <button type="button" className="icon-btn" aria-label="Previous day" onClick={() => setDay(addDays(day, -1))} disabled={day <= today}>
          <Icon name="back" size={22} />
        </button>
        <strong>
          {friendlyDay(day, today)} <small className="muted">{longDay(day)}</small>
        </strong>
        <button type="button" className="icon-btn" aria-label="Next day" onClick={() => setDay(addDays(day, 1))}>
          <Icon name="chevron" size={22} />
        </button>
      </div>

      {ringing.map((r) => (
        <div key={r.refId} className="card ringing-card">
          <h3>🔔 Going now{r.memberId ? ` for ${f.members[r.memberId]?.name ?? 'someone'}` : ''}</h3>
          {r.note && <p>{r.note}</p>}
          <button type="button" className="btn danger big block" onClick={() => (act(T.stopRing(me.id, ringIdFor(r.refId, today))), toast('Stopping…'))}>
            Stop
          </button>
        </div>
      ))}

      {clashes.length > 0 && (
        <div className="note warn">
          {clashes.map((c) => (
            <p key={`${c.memberId}-${c.leg.key}`}>
              ⚠️ {f.members[c.memberId]?.name}: {legTitle(c.leg).toLowerCase()} ({c.leg.leaveBy}) runs into {c.withTitle}.
            </p>
          ))}
        </div>
      )}

      <SectionHead title="Journeys" />
      {trips.length === 0 && <p className="muted">No journeys planned.</p>}
      {trips.length > 0 && (
        <ul className="card list travel-list">
          {trips.flatMap((t) =>
            t.members.map((m) => {
              const legs = legsFor(f, m, day).filter((l) => l.refId === t.refId)
              const st = statusOf(f, t.refId, day)
              return (
                <li key={`${t.refId}-${m}`} className="travel-trip">
                  <div className="row-between">
                    <strong>
                      {MODE_EMOJI[t.spec.mode]} {t.title}
                    </strong>
                    <small className="muted">{f.members[m]?.name}</small>
                  </div>
                  {legs.length === 0 && <small className="muted">{st?.state === 'failed' ? `Couldn’t plan: ${st.note ?? ''}` : 'Planning…'}</small>}
                  {legs.map((l) => (
                    <div key={l.key} className={`travel-leg${l.status === 'disrupted' ? ' warn' : ''}`}>
                      <span className="tl-time">{l.leaveBy ?? '--:--'}</span>
                      <span>
                        {legTitle(l)}
                        <small className="muted">
                          {' '}
                          {[hopSummary(l), l.arrive && `arrive ${l.arrive}`, l.status === 'disrupted' && 'disrupted', l.status === 'unknown' && 'not confirmed', l.note].filter(Boolean).join(' · ')}
                        </small>
                      </span>
                    </div>
                  ))}
                </li>
              )
            }),
          )}
        </ul>
      )}

      <SectionHead title="Alarms" />
      {alarms.length === 0 ? (
        <p className="muted">No alarms.</p>
      ) : (
        <ul className="card list">
          {alarms.map((a) => (
            <li key={a.alarmId} className="row-between">
              <span>
                <strong>{a.time}</strong> {a.title}
              </span>
              <small className="muted">
                {f.members[a.memberId]?.name}
                {statusOf(f, a.alarmId, day)?.state === 'scheduled' ? ' · ✓' : ''}
              </small>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

// ------------------------------------------------------------------ alarms

function AlarmsTab() {
  const f = useFamily()
  const [edit, setEdit] = useState<{ alarm?: AlarmEvent } | undefined>()
  const list = Object.values(f.travel.alarms)
    .filter((a) => !a.deleted)
    .sort((a, b) => a.time.localeCompare(b.time))
  return (
    <>
      <SectionHead
        title="Alarms"
        sub="Rung on the home speakers in the family’s alarm voice."
        action={
          <button type="button" className="btn primary small" onClick={() => setEdit({})}>
            + Alarm
          </button>
        }
      />
      {list.length === 0 && <p className="muted">No alarms yet.</p>}
      <ul className="card list">
        {list.map((a) => (
          <li key={a.alarmId}>
            <button type="button" className="row-between plain-row" onClick={() => setEdit({ alarm: a })}>
              <span>
                <strong>{a.time}</strong> {a.title}
                <small className="muted"> · {f.members[a.memberId]?.name}</small>
              </span>
              <small className="muted">{a.recur ? 'repeats' : a.date}</small>
            </button>
          </li>
        ))}
      </ul>
      <AlarmSheet open={!!edit} onClose={() => setEdit(undefined)} alarm={edit?.alarm} />
    </>
  )
}

// ------------------------------------------------------------------ regular trips

function TripsTab() {
  const f = useFamily()
  const [edit, setEdit] = useState<{ trip?: TripEvent } | undefined>()
  const list = Object.values(f.travel.trips).filter((t) => !t.deleted)
  return (
    <>
      <SectionHead
        title="Regular trips"
        sub="Journeys that aren’t calendar events, like the school run. For a one-off, add travel to the calendar event instead."
        action={
          <button type="button" className="btn primary small" onClick={() => setEdit({})}>
            + Trip
          </button>
        }
      />
      {list.length === 0 && <p className="muted">No regular trips yet.</p>}
      <ul className="card list">
        {list.map((t) => {
          const place = f.travel.places[t.spec.placeId]
          return (
            <li key={t.tripId}>
              <button type="button" className="row-between plain-row" onClick={() => setEdit({ trip: t })}>
                <span>
                  <strong>
                    {MODE_EMOJI[t.spec.mode]} {t.title}
                  </strong>
                  <small className="muted">
                    {' '}
                    · {t.members.map((m) => f.members[m]?.name).join(', ')} · {place?.name ?? 'somewhere'} by {t.spec.arriveBy}
                    {t.leaveAt ? `, home at ${t.leaveAt}` : ''}
                  </small>
                </span>
                <small className="muted">{t.recur?.interval === 2 ? 'every other week' : t.recur ? 'repeats' : t.date}</small>
              </button>
            </li>
          )
        })}
      </ul>
      <TripSheet open={!!edit} onClose={() => setEdit(undefined)} trip={edit?.trip} />
    </>
  )
}

// ------------------------------------------------------------------ places and habits

function PlacesTab() {
  const f = useFamily()
  const me = useMe()!
  const { act, toast } = useApp()
  const people = usePeople()
  const [edit, setEdit] = useState<{ place?: PlaceEvent } | undefined>()
  const [who, setWho] = useState<MemberId>(me.id)
  const places = livePlaces(f)
  const prefs = f.travel.prefs[who]
  const home = homePlaceOf(f, who)
  const lead = leadMinOf(f, who)
  const mode = modeOf(f, who)
  const save = (patch: { leadMin?: number; mode?: TravelMode; homePlaceId?: string }) => {
    act(T.savePrefs(me.id, { memberId: who, homePlaceId: prefs?.homePlaceId, leadMin: prefs?.leadMin, mode: prefs?.mode, ...patch }))
    toast('Saved.')
  }
  return (
    <>
      <SectionHead
        title="Places"
        action={
          <button type="button" className="btn primary small" onClick={() => setEdit({})}>
            + Place
          </button>
        }
      />
      {places.length === 0 && <p className="muted">Add Home first, with its station, then the places you travel to.</p>}
      <ul className="card list">
        {places.map((p) => (
          <li key={p.placeId}>
            <button type="button" className="row-between plain-row" onClick={() => setEdit({ place: p })}>
              <span>
                <strong>{p.name}</strong>
                <small className="muted">
                  {' '}
                  · {p.stationName ?? p.station ?? 'no station'}
                  {p.walkMin != null ? `, ${p.walkMin} min walk` : ''}
                </small>
              </span>
              <small className="muted">{p.kind}</small>
            </button>
          </li>
        ))}
      </ul>

      <SectionHead title="Travel habits" sub="Used to work out leave times. Each person can have their own." />
      <MemberChips members={people} value={[who]} onChange={(v) => v[0] && setWho(v[0])} size="small" />
      <div className="card">
        <label className="field">
          <span>Leave home this many minutes before the train</span>
          <input
            className="tbox slim"
            inputMode="numeric"
            defaultValue={String(lead)}
            key={`${who}-lead`}
            onBlur={(e) => Number(e.target.value) !== lead && save({ leadMin: Math.min(90, Math.max(0, Number(e.target.value.replace(/\D/g, '')) || 0)) })}
          />
        </label>
        <div className="field">
          <span>Usual way to travel</span>
          <Seg<TravelMode> value={mode} onChange={(m) => save({ mode: m })} options={modesFor(f).map((m) => ({ id: m, label: `${MODE_EMOJI[m]} ${MODE_LABEL[m]}` }))} />
        </div>
        {places.filter((p) => p.kind === 'home').length > 1 && (
          <div className="field">
            <span>Home</span>
            <div className="chips">
              {places
                .filter((p) => p.kind === 'home')
                .map((p) => (
                  <button key={p.placeId} type="button" className={`chip small${home?.placeId === p.placeId ? ' selected' : ''}`} onClick={() => save({ homePlaceId: p.placeId })}>
                    {p.name}
                  </button>
                ))}
            </div>
          </div>
        )}
        <p className="muted small">
          {f.travel.features?.linked.includes(who) ? '📱 Phone linked: alarms and announcements stop when they leave home.' : '📱 Phone not linked yet: alarms run until Stop or the time limit.'}
        </p>
      </div>
      <PlaceSheet open={!!edit} onClose={() => setEdit(undefined)} place={edit?.place} />
    </>
  )
}
