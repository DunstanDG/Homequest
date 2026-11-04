/**
 * Building blocks for travel and alarms: the station picker, the place editor, the "Getting there" section of the
 * event form, trip status lines, the stand-alone trip and alarm sheets, and the ringing banner.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, useFamily, useMe, useNow } from '@/app/context'
import { searchStations, stationName, useStations } from '@/app/stations'
import { hmOf, ymdOf } from '@/family/dates'
import * as T from '@/family/travel/actions'
import { MODE_EMOJI, MODE_LABEL, legsFor, modesFor, livePlaces, ringIdFor, ringingNow, serverOn, settingsOf, statusOf } from '@/family/travel/travel'
import type { AlarmEvent, PlaceEvent, PlaceKind, TravelMode, TripEvent, TripSpec, ViaStop } from '@/family/travel/types'
import type { MemberId, Ymd } from '@/family/types'
import { MemberChips, Seg } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'
import { RepeatPicker, initialRepeat, repeatToRecur, usePeople, type RepeatState } from './shared'

// ------------------------------------------------------------------ stations

export function StationPicker({ value, onChange, label }: { value?: string; onChange: (crs: string | undefined, name?: string) => void; label: string }) {
  const { list, error } = useStations()
  const [q, setQ] = useState('')
  const hits = searchStations(list, q)
  const name = stationName(list, value)
  return (
    <div className="field station-picker">
      <span>{label}</span>
      {value && !q ? (
        <div className="row-between">
          <strong>
            {name ?? value} <small className="muted">{value}</small>
          </strong>
          <button type="button" className="btn ghost small" onClick={() => onChange(undefined)}>
            Change
          </button>
        </div>
      ) : (
        <>
          <input className="tbox" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Station name or code, e.g. Haywards Heath" />
          {hits.length > 0 && (
            <ul className="station-hits">
              {hits.map((s) => (
                <li key={s.crs}>
                  <button type="button" onClick={() => (onChange(s.crs, s.name), setQ(''))}>
                    {s.name} <small className="muted">{s.crs}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {error && <small className="note warn">{error}</small>}
        </>
      )}
    </div>
  )
}

// ------------------------------------------------------------------ places

const KIND_LABEL: Record<PlaceKind, string> = { home: '🏠 Home', work: '💼 Work', school: '🏫 School', other: '📍 Other' }

export function PlaceSheet({ open, onClose, place, onSaved }: { open: boolean; onClose: () => void; place?: PlaceEvent; onSaved?: (placeId: string) => void }) {
  return (
    <Sheet open={open} onClose={onClose} title={place ? 'Edit place' : 'New place'}>
      {open && <PlaceForm place={place} onDone={(id) => (id && onSaved?.(id), onClose())} />}
    </Sheet>
  )
}

function PlaceForm({ place, onDone }: { place?: PlaceEvent; onDone: (placeId?: string) => void }) {
  const { act, toast } = useApp()
  const me = useMe()!
  const f = useFamily()
  const [name, setName] = useState(place?.name ?? '')
  const [kind, setKind] = useState<PlaceKind>(place?.kind ?? 'other')
  const [station, setStation] = useState(place?.station)
  const [stationNm, setStationNm] = useState(place?.stationName)
  const [walk, setWalk] = useState(String(place?.walkMin ?? settingsOf(f).walkMin))
  const save = () => {
    const evs = T.savePlace(me.id, { placeId: place?.placeId, name: name.trim(), kind, station, stationName: stationNm, walkMin: Math.max(0, Math.min(120, Number(walk) || 0)) })
    act(evs)
    toast(place ? 'Place updated.' : 'Place saved.')
    onDone((evs[0] as { placeId: string }).placeId)
  }
  return (
    <>
      <label className="field">
        <span>Name</span>
        <input className="tbox" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. School, Grandma's, The office" maxLength={40} autoFocus={!place} />
      </label>
      <div className="chips">
        {(Object.keys(KIND_LABEL) as PlaceKind[]).map((k) => (
          <button key={k} type="button" className={`chip small${kind === k ? ' selected' : ''}`} onClick={() => setKind(k)}>
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>
      <StationPicker label="Nearest station" value={station} onChange={(c, n) => (setStation(c), setStationNm(n))} />
      <label className="field">
        <span>{kind === 'home' ? 'Minutes walk to the station' : 'Minutes walk from the station'}</span>
        <input className="tbox slim" inputMode="numeric" value={walk} onChange={(e) => setWalk(e.target.value.replace(/\D/g, ''))} />
      </label>
      <button type="button" className="btn primary big block" disabled={!name.trim()} onClick={save}>
        <Icon name="check" size={20} /> Save place
      </button>
      {place && (
        <button type="button" className="btn ghost block" onClick={() => (act(T.deletePlace(me.id, place)), toast('Place removed.'), onDone())}>
          <Icon name="trash" size={18} /> Remove
        </button>
      )}
    </>
  )
}

// ------------------------------------------------------------------ the "Getting there" section

/**
 * Edits a TripSpec. `undefined` means no travel. Used by the calendar event form and by the regular-trip sheet.
 * `defaultMode` is the person's usual way of travelling.
 */
export function TripEditor({ value, onChange, defaultMode = 'train', timed = true }: { value?: TripSpec; onChange: (v: TripSpec | undefined) => void; defaultMode?: TravelMode; timed?: boolean }) {
  const f = useFamily()
  const places = livePlaces(f).filter((p) => p.kind !== 'home')
  const [newPlace, setNewPlace] = useState(false)
  const mode: TravelMode = value?.mode ?? 'none'
  const set = (patch: Partial<TripSpec>) => onChange({ placeId: value?.placeId ?? places[0]?.placeId ?? '', mode: value?.mode ?? defaultMode, ...value, ...patch })
  const place = value ? f.travel.places[value.placeId] : undefined
  const via = value?.via ?? []
  const changeMin = settingsOf(f).changeMin

  if (!timed) return <p className="note">Give the event a start time to plan travel for it.</p>
  return (
    <div className="trip-editor">
      <Seg<TravelMode>
        label="How are they getting there?"
        value={mode}
        onChange={(m) => (m === 'none' ? onChange(undefined) : set({ mode: m }))}
        options={(['none', ...modesFor(f)] as TravelMode[]).map((m) => ({ id: m, label: m === 'none' ? 'No travel' : `${MODE_EMOJI[m]} ${MODE_LABEL[m]}` }))}
      />
      {!value && <small className="muted">Not sure which way is quickest? Travel → Times compares walking, bus, train and car for any two places.</small>}
      {value && (
        <>
          <div className="field">
            <span>Where to</span>
            <div className="chips">
              {places.map((p) => (
                <button key={p.placeId} type="button" className={`chip small${value.placeId === p.placeId ? ' selected' : ''}`} onClick={() => set({ placeId: p.placeId })}>
                  {p.name}
                </button>
              ))}
              <button type="button" className="chip small" onClick={() => setNewPlace(true)}>
                + New place
              </button>
            </div>
            {place?.station && mode === 'train' && (
              <small className="muted">
                Train to {place.stationName ?? place.station}, then {place.walkMin ?? 0} min walk
              </small>
            )}
            {place && !place.station && mode === 'train' && <small className="note warn">This place has no station yet. Edit it in Travel → Places.</small>}
            {place && mode === 'bus' && <small className="muted">Bus times come from the timetable (not live). Walking to and from the stops is included.</small>}
          </div>
          {mode === 'train' && (
            <div className="field">
              <span>Changes</span>
              {via.map((v, i) => (
                <div key={`${v.station}-${i}`} className="row-between via-row">
                  <span>
                    Change at <strong>{v.stationName ?? v.station}</strong>
                  </span>
                  <span className="inline-field">
                    <input
                      className="tbox slim"
                      inputMode="numeric"
                      aria-label="Minutes to change"
                      value={String(v.changeMin)}
                      onChange={(e) => set({ via: via.map((x, j) => (j === i ? { ...x, changeMin: Math.min(60, Number(e.target.value.replace(/\D/g, '')) || 0) } : x)) })}
                    />
                    <small className="muted">min</small>
                    <button type="button" className="icon-btn" aria-label="Remove this change" onClick={() => set({ via: via.filter((_, j) => j !== i) })}>
                      <Icon name="x" size={18} />
                    </button>
                  </span>
                </div>
              ))}
              <AddVia onAdd={(v) => set({ via: [...via, { ...v, changeMin }] })} />
            </div>
          )}
          {(mode === 'walk' || mode === 'car') && (
            <label className="field">
              <span>Door to door, minutes</span>
              <input
                className="tbox slim"
                inputMode="numeric"
                value={value.minutes != null ? String(value.minutes) : ''}
                placeholder={mode === 'walk' ? String(place?.walkMin ?? 20) : '30'}
                onChange={(e) => set({ minutes: e.target.value ? Math.min(600, Number(e.target.value.replace(/\D/g, ''))) : undefined })}
              />
            </label>
          )}
          <label className="field">
            <span>Arrive by (optional)</span>
            <input type="time" className="tbox slim" value={value.arriveBy ?? ''} onChange={(e) => set({ arriveBy: e.target.value || undefined })} />
            <small className="muted">Leave empty to arrive for the start time.</small>
          </label>
          <label className="switch-row">
            <span className="sr-main">
              <strong>Plan the journey home</strong>
            </span>
            <input type="checkbox" className="switch" checked={value.returnHome !== false} onChange={(e) => set({ returnHome: e.target.checked })} />
          </label>
          <label className="switch-row">
            <span className="sr-main">
              <strong>Announce at home</strong>
              <small className="muted">Train times on the speakers before leave time, while their phone is at home</small>
            </span>
            <input type="checkbox" className="switch" checked={value.announce !== false} onChange={(e) => set({ announce: e.target.checked })} />
          </label>
        </>
      )}
      <PlaceSheet open={newPlace} onClose={() => setNewPlace(false)} onSaved={(id) => set({ placeId: id })} />
    </div>
  )
}

function AddVia({ onAdd }: { onAdd: (v: Omit<ViaStop, 'changeMin'>) => void }) {
  const [open, setOpen] = useState(false)
  if (!open)
    return (
      <button type="button" className="btn ghost small" onClick={() => setOpen(true)}>
        + Add a change
      </button>
    )
  return <StationPicker label="Change at" onChange={(crs, name) => (crs && onAdd({ station: crs, stationName: name }), setOpen(false))} />
}

/** "Planning…", "Leave by 07:32 for the 07:42 · Scheduled ✓", or why it couldn't. */
export function TripStatus({ refId, date, members }: { refId: string; date: Ymd; members: MemberId[] }) {
  const f = useFamily()
  if (!serverOn(f)) return null
  const st = statusOf(f, refId, date)
  const legs = members.flatMap((m) => legsFor(f, m, date)).filter((l) => l.refId === refId)
  const out = legs.find((l) => l.direction !== 'back')
  if (st?.state === 'failed') return <p className="note warn">Couldn’t plan: {st.note ?? 'no workable journey found'}</p>
  if (!out) return <p className="note muted">Planning… the home server picks this up within a minute.</p>
  const first = out.hops?.[0]
  return (
    <p className={`note${out.status === 'disrupted' ? ' warn' : ''}`}>
      {out.leaveBy ? `Leave by ${out.leaveBy}` : 'Planned'}
      {first ? ` for the ${first.line && out.mode === 'bus' ? `${first.line} bus at ` : ''}${first.dep}` : ''}
      {out.arrive ? ` · arrive ${out.arrive}` : ''}
      {out.status === 'disrupted' ? ' · disrupted' : ''}
      {st?.state === 'scheduled' || st?.state === 'done' ? ' · Scheduled ✓' : ''}
    </p>
  )
}

// ------------------------------------------------------------------ regular trips

export function TripSheet({ open, onClose, trip }: { open: boolean; onClose: () => void; trip?: TripEvent }) {
  return (
    <Sheet open={open} onClose={onClose} title={trip ? 'Edit regular trip' : 'New regular trip'}>
      {open && <TripForm trip={trip} onDone={onClose} />}
    </Sheet>
  )
}

function TripForm({ trip, onDone }: { trip?: TripEvent; onDone: () => void }) {
  const { act, toast } = useApp()
  const me = useMe()!
  const people = usePeople()
  const today = ymdOf(useNow(3600_000))
  const [title, setTitle] = useState(trip?.title ?? '')
  const [members, setMembers] = useState<MemberId[]>(trip?.members ?? [me.id])
  const [date, setDate] = useState<Ymd>(trip?.date ?? today)
  const [rep, setRep] = useState<RepeatState>(trip?.recur ? initialRepeat(trip.recur) : { kind: 'weekdays', days: [], until: '' })
  const [spec, setSpec] = useState<TripSpec | undefined>(trip?.spec ?? { placeId: '', mode: 'train', arriveBy: '09:00' })
  const [leaveAt, setLeaveAt] = useState(trip?.leaveAt ?? '17:00')
  const ok = title.trim() && spec && spec.placeId && spec.arriveBy && members.length
  const save = () => {
    if (!ok || !spec) return
    act(
      T.saveTrip(me.id, {
        tripId: trip?.tripId,
        title: title.trim(),
        members,
        date,
        recur: repeatToRecur(rep, date, trip?.recur),
        exdates: trip?.exdates,
        spec,
        leaveAt: spec.returnHome === false ? undefined : leaveAt,
      }),
    )
    toast(trip ? 'Trip updated.' : 'Trip saved.')
    onDone()
  }
  return (
    <>
      <label className="field">
        <span>Name</span>
        <input className="tbox" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. School run, Office days" maxLength={40} autoFocus={!trip} />
      </label>
      <div className="field">
        <span>Who travels</span>
        <MemberChips members={people} value={members} multi onChange={setMembers} size="small" />
      </div>
      <label className="field">
        <span>Starting</span>
        <input type="date" className="tbox slim" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <RepeatPicker value={rep} onChange={setRep} />
      <TripEditor value={spec} onChange={setSpec} />
      {spec && spec.returnHome !== false && (
        <label className="field">
          <span>Heading home at</span>
          <input type="time" className="tbox slim" value={leaveAt} onChange={(e) => setLeaveAt(e.target.value)} />
        </label>
      )}
      {spec && !spec.arriveBy && <p className="note warn">Set an arrive-by time for a regular trip.</p>}
      <button type="button" className="btn primary big block" disabled={!ok} onClick={save}>
        <Icon name="check" size={20} /> Save trip
      </button>
      {trip && (
        <button type="button" className="btn ghost block" onClick={() => (act(T.deleteTrip(me.id, trip)), toast('Trip removed.'), onDone())}>
          <Icon name="trash" size={18} /> Remove
        </button>
      )}
    </>
  )
}

// ------------------------------------------------------------------ alarms

export function AlarmSheet({ open, onClose, alarm }: { open: boolean; onClose: () => void; alarm?: AlarmEvent }) {
  return (
    <Sheet open={open} onClose={onClose} title={alarm ? 'Edit alarm' : 'New alarm'}>
      {open && <AlarmForm alarm={alarm} onDone={onClose} />}
    </Sheet>
  )
}

function AlarmForm({ alarm, onDone }: { alarm?: AlarmEvent; onDone: () => void }) {
  const { act, toast } = useApp()
  const me = useMe()!
  const f = useFamily()
  const people = usePeople()
  const today = ymdOf(useNow(3600_000))
  const speakers = f.travel.features?.speakers ?? []
  const [title, setTitle] = useState(alarm?.title ?? 'Time to get up')
  const [who, setWho] = useState<MemberId>(alarm?.memberId ?? me.id)
  const [date, setDate] = useState<Ymd>(alarm?.date ?? today)
  const [time, setTime] = useState(alarm?.time ?? '07:00')
  const [rep, setRep] = useState<RepeatState>(initialRepeat(alarm?.recur))
  const [sp, setSp] = useState<string[]>(alarm?.speakers ?? [])
  const [stopLeave, setStopLeave] = useState(alarm?.stopWhenLeave ?? true)
  const linked = f.travel.features?.linked.includes(who)
  const save = () => {
    act(
      T.saveAlarm(me.id, {
        alarmId: alarm?.alarmId,
        memberId: who,
        title: title.trim() || 'Alarm',
        date,
        time,
        recur: repeatToRecur(rep, date, alarm?.recur),
        exdates: alarm?.exdates,
        speakers: sp,
        stopWhenLeave: stopLeave,
      }),
    )
    toast(alarm ? 'Alarm updated.' : 'Alarm set.')
    onDone()
  }
  return (
    <>
      <label className="field">
        <span>What should it say?</span>
        <input className="tbox" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
      </label>
      <div className="field">
        <span>For</span>
        <MemberChips members={people} value={[who]} onChange={(v) => v[0] && setWho(v[0])} size="small" />
      </div>
      <div className="grid2">
        <label className="field">
          <span>Date</span>
          <input type="date" className="tbox" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field">
          <span>Time</span>
          <input type="time" className="tbox" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>
      <RepeatPicker value={rep} onChange={setRep} />
      {speakers.length > 0 && (
        <div className="field">
          <span>Speakers</span>
          <div className="chips">
            {speakers.map((s) => (
              <button key={s.id} type="button" className={`chip small${sp.includes(s.id) ? ' selected' : ''}`} onClick={() => setSp(sp.includes(s.id) ? sp.filter((x) => x !== s.id) : [...sp, s.id])}>
                🔊 {s.name}
              </button>
            ))}
          </div>
          {!sp.length && <small className="muted">None picked: uses their usual speakers from Settings.</small>}
        </div>
      )}
      <label className="switch-row">
        <span className="sr-main">
          <strong>Stop when they leave home</strong>
          <small className="muted">{linked ? 'Their phone is linked, so it stops as soon as they go.' : 'Their phone isn’t linked yet, so it runs until Stop or the time limit.'}</small>
        </span>
        <input type="checkbox" className="switch" checked={stopLeave} onChange={(e) => setStopLeave(e.target.checked)} />
      </label>
      <button type="button" className="btn primary big block" onClick={save}>
        <Icon name="check" size={20} /> {alarm ? 'Save' : 'Set alarm'}
      </button>
      {alarm && (
        <button type="button" className="btn ghost block" onClick={() => (act(T.deleteAlarm(me.id, alarm)), toast('Alarm removed.'), onDone())}>
          <Icon name="trash" size={18} /> Remove
        </button>
      )}
    </>
  )
}

// ------------------------------------------------------------------ ringing

/** A bar across the top of every screen while an alarm or announcement is going, with a big Stop. */
export function RingingBanner() {
  const f = useFamily()
  const me = useMe()
  const { act, toast } = useApp()
  const nav = useNavigate()
  const now = useNow(15_000)
  if (!me || !serverOn(f)) return null
  const today = ymdOf(now)
  const ringing = ringingNow(f, today).filter((r) => !r.memberId || r.memberId === me.id || me.role === 'parent')
  if (!ringing.length) return null
  const r = ringing[0]!
  const who = r.memberId && r.memberId !== me.id ? f.members[r.memberId]?.name : undefined
  return (
    <div className="ringing-banner" role="alert">
      <button type="button" className="rb-text" onClick={() => nav('/travel')}>
        <strong>🔔 {who ? `${who}’s alarm` : 'Alarm'} is going</strong>
        <small>{r.note ?? `since ${hmOf(r.since)}`}</small>
      </button>
      <button type="button" className="btn danger" onClick={() => (act(T.stopRing(me.id, ringIdFor(r.refId, today))), toast('Stopping… the speakers go quiet within a few seconds.'))}>
        Stop
      </button>
    </div>
  )
}

/** Tapping a home server notification while the app is open takes you to Travel and alarms (see src/sw.ts). */
export function useServiceWorkerNavigate() {
  const nav = useNavigate()
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) return
    const on = (e: MessageEvent) => {
      const d = e.data as { type?: string; to?: string } | undefined
      if (d?.type === 'navigate' && d.to === '/travel') nav('/travel')
    }
    navigator.serviceWorker.addEventListener('message', on)
    return () => navigator.serviceWorker.removeEventListener('message', on)
  }, [nav])
}
