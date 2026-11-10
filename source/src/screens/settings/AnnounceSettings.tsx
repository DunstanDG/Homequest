/**
 * Read-outs (/settings/announcements): make this device read tasks out loud when they're due, and see what's coming up.
 * The device settings live in `settings.announcer` (device-local); the device also tells the family it's an announcer
 * (an `announcer` event) so the task form can say where a read-out will be heard. See src/app/announcer.tsx.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, useCalCtx, useFamily, useNow } from '@/app/context'
import { canSpeak, defaultAnnouncer, pickVoice, speak, useVoices, type AnnouncerPrefs } from '@/app/announcer'
import { announcementText, upcomingAnnouncements } from '@/family/announce'
import { hmOf, toMin, ymdOf } from '@/family/dates'
import { Icon } from '@/ui/icons'
import { Choice, Toggle } from './CalmSettings'

const RATES = [
  { value: 'slow', label: 'Slower', rate: 0.8 },
  { value: 'normal', label: 'Normal', rate: 0.95 },
  { value: 'fast', label: 'Faster', rate: 1.1 },
] as const
type RateId = (typeof RATES)[number]['value']
const rateId = (r = 0.95): RateId => (r < 0.88 ? 'slow' : r > 1.02 ? 'fast' : 'normal')

export function AnnounceSettings() {
  const nav = useNavigate()
  const { settings, updateSettings, repo } = useApp()
  const f = useFamily()
  const ctx = useCalCtx()
  const now = useNow(30_000)
  const voices = useVoices()
  const p: AnnouncerPrefs = settings.announcer ?? defaultAnnouncer()
  const set = (patch: Partial<AnnouncerPrefs>) => updateSettings({ announcer: { ...p, ...patch } })
  const [name, setName] = useState(p.name)
  const [tested, setTested] = useState(false)
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'))
  const voice = pickVoice(voices, p.voice)
  const upcoming = upcomingAnnouncements(ctx, ymdOf(now), toMin(hmOf(now)), now)
  const me = repo.me()
  const meName = (me && f.members[me]?.name) || 'Maya'
  const speakers = !!f.travel.features?.taskAnnouncements
  const others = Object.values(f.announcers).filter((d) => d.on && d.deviceId !== p.deviceId)
  const sample = upcoming[0]?.text ?? announcementText({ title: 'Empty the dishwasher', kind: 'chore' }, meName, hmOf(now))

  return (
    <div className="screen calm-settings calm-ui announce-settings">
      <header className="screen-head">
        <button type="button" className="icon-btn" onClick={() => (history.length > 1 ? nav(-1) : nav('/settings'))} aria-label="Back">
          <Icon name="back" />
        </button>
        <div className="sh-title">
          <p className="eyebrow">Settings</p>
          <h1>Read-outs</h1>
        </div>
      </header>
      <p className="muted calm-settings-lead">
        Any task can be read out loud when it’s due: switch on “Read it out when it’s due” on the task. This is where it’s heard: a phone or tablet left on HomeQuest (for example in the kitchen) and, when the home server
        supports it, the home speakers.
      </p>

      <div className="card calm-set">
        <strong>The home speakers</strong>
        <p className="muted small">{speakers ? 'Yes: the home server reads tasks out on the speakers (not during quiet hours).' : 'Not yet: the home server needs an update before the speakers can read tasks out. Until then, use a device here.'}</p>
        {others.length > 0 && <p className="muted small">Other devices reading out: {others.map((d) => d.name).join(', ')}.</p>}
      </div>

      {!canSpeak() ? (
        <p className="note warn">This browser can’t read things out loud. Try Chrome or Safari on the device you want to use.</p>
      ) : (
        <>
          <Toggle
            legend="This device reads out tasks"
            hint="Leave HomeQuest open on it, plugged in, with the volume up. It reads each task once, at its time."
            checked={p.on}
            onChange={(on) => set({ on, deviceId: p.deviceId, name: name.trim() || p.name })}
          >
            {p.on ? <p>On. {speakers && !p.alsoWithSpeakers ? 'The home speakers do it at the moment, so this device stays quiet unless you switch on “Here as well” below.' : 'Tasks will be read out here.'}</p> : <p>Off on this device.</p>}
          </Toggle>

          {p.on && (
            <>
              <div className="card calm-set">
                <label className="field">
                  <span>What is this device called?</span>
                  <input className="tbox" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} onBlur={() => set({ name: name.trim() || 'Kitchen tablet' })} placeholder="e.g. Kitchen tablet" />
                </label>
                <small className="muted">The family sees this name on a task, so they know where it’ll be heard.</small>
              </div>

              {english.length > 1 && (
                <div className="card calm-set">
                  <label className="field">
                    <span>Voice</span>
                    <select className="tbox" value={voice?.name ?? ''} onChange={(e) => set({ voice: e.target.value })}>
                      {english.map((v) => (
                        <option key={v.name} value={v.name}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              <Choice name="announce-rate" legend="Speed" value={rateId(p.rate)} options={RATES.map((r) => ({ value: r.value, label: r.label }))} onChange={(v) => set({ rate: RATES.find((r) => r.value === v)!.rate })} />

              <Toggle legend="A soft chime first" hint="Two gentle notes before it speaks, so it doesn’t start out of nowhere." checked={p.chime !== false} onChange={(chime) => set({ chime })} />
              <Toggle legend="Keep the screen on" hint="So the device doesn’t go to sleep and miss things. Best when it’s plugged in." checked={p.keepAwake !== false} onChange={(keepAwake) => set({ keepAwake })} />
              {speakers && <Toggle legend="Here as well as on the speakers" hint="Normally this device stays quiet when the home speakers read things out, so nothing is said twice." checked={!!p.alsoWithSpeakers} onChange={(alsoWithSpeakers) => set({ alsoWithSpeakers })} />}
            </>
          )}

          <div className="card calm-set">
            <strong>Try it</strong>
            <p className="muted small">“{sample}”</p>
            <button
              type="button"
              className="btn small"
              onClick={() => {
                setTested(true)
                void speak(sample, p)
              }}
            >
              <Icon name="volume" size={16} /> Play it
            </button>
            {tested && <small className="muted">Nothing heard? Check the volume, and that the device isn’t on silent.</small>}
          </div>
        </>
      )}

      <div className="card calm-set">
        <strong>Coming up today</strong>
        {upcoming.length ? (
          <ul className="announce-list">
            {upcoming.map((a) => (
              <li key={a.key}>
                <span className="announce-time">{a.time}</span> <span className="grow">{f.tasks[a.taskId]?.title ?? ''}</span> <small className="muted">{f.members[a.memberId]?.name}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small">Nothing to read out for the rest of today. Switch it on for a task in the task’s form.</p>
        )}
        <small className="muted">Nothing is read out during quiet hours, once it’s done, or while someone has paused with 🌿 Calm.</small>
      </div>
    </div>
  )
}
