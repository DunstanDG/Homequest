/**
 * Parent → Data → Home server: what the family's home server can do, quiet hours and travel defaults, each
 * person's speakers, and a Check connection button. See docs/TRAVEL_AND_ALARMS.md.
 */
import { useState } from 'react'
import { useApp, useFamily, useMe, useNow } from '@/app/context'
import { ago } from '@/family/dates'
import * as T from '@/family/travel/actions'
import { lastPing, serverOn, settingsOf } from '@/family/travel/travel'
import { Pill } from '@/ui/primitives'
import { usePeople } from '@/screens/family/shared'

const num = (v: string, lo: number, hi: number, dflt: number) => {
  const n = Number(v.replace(/\D/g, ''))
  return Number.isFinite(n) && v !== '' ? Math.min(hi, Math.max(lo, n)) : dflt
}

export function HomeServerSection() {
  const f = useFamily()
  const me = useMe()
  const { act, toast } = useApp()
  const people = usePeople()
  const now = useNow(10_000)
  const s = settingsOf(f)
  const feat = f.travel.features
  const [quietFrom, setQuietFrom] = useState(s.quietFrom)
  const [quietTo, setQuietTo] = useState(s.quietTo)
  const [lead, setLead] = useState(String(s.leadMin))
  const [change, setChange] = useState(String(s.changeMin))
  const [walk, setWalk] = useState(String(s.walkMin))
  const [alert, setAlert] = useState(String(s.alertMin))
  const [watch, setWatch] = useState(String(s.watchHours))
  const [speakers, setSpeakers] = useState<Record<string, string[]>>(s.speakers)
  if (!me || me.role !== 'parent') return null
  const ping = lastPing(f)
  const waiting = ping && !ping.pongTs && now - ping.sentTs < 120_000
  const save = () => {
    act(
      T.saveHomeSettings(me.id, {
        quietFrom,
        quietTo,
        leadMin: num(lead, 0, 90, s.leadMin),
        changeMin: num(change, 0, 60, s.changeMin),
        walkMin: num(walk, 0, 120, s.walkMin),
        alertMin: num(alert, 1, 120, s.alertMin),
        watchHours: num(watch, 1, 12, s.watchHours),
        speakers,
      }),
    )
    toast('Home server settings saved.')
  }
  return (
    <section className="card">
      <div className="quest-top">
        <h3 id="sec-home-server">Home server</h3>
        {serverOn(f) ? <Pill tone="good">Connected</Pill> : <Pill tone="neutral">Not set up</Pill>}
      </div>
      {!feat ? (
        <p className="muted">
          A small service on your own home server can plan journeys with live train times, ring alarms on the home speakers and send leave-time alerts. Once it is running it introduces itself here and
          the Travel and alarms screen appears. See <code>docs/TRAVEL_AND_ALARMS.md</code>.
        </p>
      ) : (
        <>
          <ul className="facts">
            <li>
              <span>Alarms on speakers</span>
              <strong>{feat.alarms ? 'On' : 'Off'}</strong>
            </li>
            <li>
              <span>Live train planning</span>
              <strong>{feat.trains ? 'On' : 'Off'}</strong>
            </li>
            <li>
              <span>Driving times</span>
              <strong>{feat.car ? 'On' : 'Not yet'}</strong>
            </li>
            <li>
              <span>Phones linked (stop when they leave)</span>
              <strong>{feat.linked.length ? feat.linked.map((m) => f.members[m]?.name ?? '?').join(', ') : 'None'}</strong>
            </li>
            <li>
              <span>Server version</span>
              <strong>{feat.version}</strong>
            </li>
          </ul>
          <div className="row-between">
            <span className="muted small">{waiting ? 'Waiting for a reply…' : ping?.pongTs ? `Last reply ${ago(ping.pongTs, now)}` : ping ? 'No reply to the last check' : 'Not checked yet'}</span>
            <button type="button" className="btn ghost small" disabled={!!waiting} onClick={() => act(T.pingServer(me.id))}>
              Check connection
            </button>
          </div>
        </>
      )}

      <h4>Quiet hours</h4>
      <p className="muted small">No speaker announcements or alarms in this window: phones get a notification instead.</p>
      <div className="grid2">
        <label className="field">
          <span>From</span>
          <input type="time" className="tbox" value={quietFrom} onChange={(e) => setQuietFrom(e.target.value)} />
        </label>
        <label className="field">
          <span>Until</span>
          <input type="time" className="tbox" value={quietTo} onChange={(e) => setQuietTo(e.target.value)} />
        </label>
      </div>

      <h4>Travel defaults</h4>
      <div className="grid2">
        <label className="field">
          <span>Leave before the train (min)</span>
          <input className="tbox" inputMode="numeric" value={lead} onChange={(e) => setLead(e.target.value)} />
        </label>
        <label className="field">
          <span>Time to change trains (min)</span>
          <input className="tbox" inputMode="numeric" value={change} onChange={(e) => setChange(e.target.value)} />
        </label>
        <label className="field">
          <span>Walk from the station (min)</span>
          <input className="tbox" inputMode="numeric" value={walk} onChange={(e) => setWalk(e.target.value)} />
        </label>
        <label className="field">
          <span>Alert if leave time moves (min)</span>
          <input className="tbox" inputMode="numeric" value={alert} onChange={(e) => setAlert(e.target.value)} />
        </label>
        <label className="field">
          <span>Watch for disruption from (hours before)</span>
          <input className="tbox" inputMode="numeric" value={watch} onChange={(e) => setWatch(e.target.value)} />
        </label>
      </div>
      <p className="muted small">Each person can change their own leave-before-the-train time in Travel → Places.</p>

      {feat && feat.speakers.length > 0 && (
        <>
          <h4>Everyone’s speakers</h4>
          <p className="muted small">Where their alarms and train announcements play.</p>
          {people.map((p) => (
            <div key={p.id} className="field">
              <span>{p.name}</span>
              <div className="chips">
                {feat.speakers.map((sp) => {
                  const on = (speakers[p.id] ?? []).includes(sp.id)
                  return (
                    <button
                      key={sp.id}
                      type="button"
                      className={`chip small${on ? ' selected' : ''}`}
                      onClick={() => setSpeakers({ ...speakers, [p.id]: on ? (speakers[p.id] ?? []).filter((x) => x !== sp.id) : [...(speakers[p.id] ?? []), sp.id] })}
                    >
                      🔊 {sp.name}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </>
      )}

      <button type="button" className="btn block" onClick={save}>
        Save
      </button>
    </section>
  )
}
