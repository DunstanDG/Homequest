import { useEffect, useRef, useState } from 'react'
import { HomeServerSection } from './HomeServer'
import { OnboardingLinks } from '@/screens/onboarding/Onboarding'
import { VersionCard } from '@/screens/onboarding/VersionCard'
import { parseBackup, makeBackup } from '@/storage/backup'
import { notifyTypeOn, useApp, useFamily, useMe, useSyncStatus, type NotifyKind } from '@/app/context'
import { ENV_SUPABASE_ANON_KEY, ENV_SUPABASE_URL, ENV_VAPID_PUBLIC_KEY } from '@/app/config'
import { currentFamilyCode, eraseDevice, enableSharing } from '@/app/pairing'
import { currentPushSubscription, isPushSupported, loadNotifyChoices, savePushPrefs, subscribeToPush, unsubscribeFromPush, type CalmNotifyChoices } from '@/app/push'
import { CAP_CHOICES, DEFAULT_CAP_ADULT, DEFAULT_CAP_CHILD, DEFAULT_MORNING_AT } from '../../../supabase/functions/_shared/notifyPlan'
import { Icon } from '@/ui/icons'
import { Pill } from '@/ui/primitives'
import { copyText, downloadText } from '@/ui/util'
import { Coparenting } from '@/screens/family/Coparenting'
import * as CA from '@/family/careActions'
import { cleanVoiceSettings, COMMAND_PHRASES, DEFAULT_VOICE, validZone } from '../../../supabase/functions/_shared/careCommand'
import { PrivateKeys } from '@/screens/family/PrivateKeys'
import { createInvite, familyStatus, inviteErrorText } from '@/storage/invites'

/** Make one-time invite codes for other families (supabase/schema_v5.sql). Hidden until the project has invites. */
function InviteFamilies() {
  const sync = useSyncStatus()
  const { demo } = useApp()
  const familyKey = sync.config()?.familyKey
  const url = sync.effectiveUrl()
  const anonKey = sync.effectiveAnonKey()
  const [state, setState] = useState<'checking' | 'hidden' | 'ready'>('checking')
  const [open, setOpen] = useState(0)
  const [made, setMade] = useState<{ code: string; expiresAt: string } | undefined>()
  const [msg, setMsg] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!familyKey || !url || !anonKey || demo) return setState('hidden')
    let live = true
    void familyStatus({ url, anonKey, familyKey }).then((st) => {
      if (!live) return
      if (st.ok && !st.notSetUp && st.approved) (setOpen(st.openInvites), setState('ready'))
      else setState('hidden')
    })
    return () => {
      live = false
    }
  }, [familyKey, url, anonKey, demo])
  if (state !== 'ready' || !familyKey || !url || !anonKey) return null
  const make = async () => {
    setBusy(true)
    setMsg(undefined)
    const r = await createInvite({ url, anonKey, familyKey })
    setBusy(false)
    if (!r.ok) return setMsg(inviteErrorText(r.error))
    setMade({ code: r.code, expiresAt: r.expiresAt })
    setOpen((n) => n + 1)
  }
  const until = made?.expiresAt ? new Date(made.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) : ''
  return (
    <section className="card">
      <h3 id="sec-invite">Invite another family</h3>
      <p className="muted">
        HomeQuest families share one server, and a new family needs an invite to turn on sharing. Each code works once, for one family, for 14 days. They get their own separate space: they can’t see
        anything of yours, and you can’t see theirs.
      </p>
      {made && (
        <div className="codebox">
          <code>{made.code}</code>
          <button type="button" className="btn ghost small" onClick={async () => setMsg((await copyText(made.code)) ? 'Invite code copied.' : 'Could not copy - select it manually.')}>
            <Icon name="copy" size={16} /> Copy
          </button>
          <p className="note">
            They open HomeQuest, start their family, then go to Parent area › Data › Turn on sharing and enter this code{until ? `. It works until ${until}` : ''}.
          </p>
        </div>
      )}
      <button type="button" className="btn ghost" disabled={busy || open >= 5} onClick={() => void make()}>
        <Icon name="plus" size={18} /> {made ? 'Make another invite' : 'Make an invite code'}
      </button>
      {open > 0 && <p className="note">{open} of 5 invites waiting to be used.</p>}
      {msg && <p className="note">{msg}</p>}
    </section>
  )
}

const NOTIFY_TYPES: { id: NotifyKind; label: string }[] = [
  { id: 'meds', label: 'Next safe dose (medicine)' },
  { id: 'tasks', label: 'Tasks and chores due' },
  { id: 'homework', label: 'Homework coming up tomorrow (to the child and parents)' },
  { id: 'checkin', label: 'Morning and evening check-in reminders (if switched on for a person)' },
  { id: 'events', label: 'Calendar items coming up (events, lessons, clubs...)' },
  { id: 'sleep', label: 'Baby still asleep, worth checking in?' },
  { id: 'feeds', label: 'Feed due soon' },
]

function NotificationsSection() {
  const { sync, toast, settings, updateSettings } = useApp()
  const me = useMe()
  const [subscribed, setSubscribed] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [choices, setChoices] = useState<CalmNotifyChoices>(loadNotifyChoices)
  const configured = !!currentFamilyCode(sync)
  const supported = isPushSupported()
  const isChild = me?.role === 'child'
  const changeChoices = (next: CalmNotifyChoices) => {
    setChoices(next)
    void savePushPrefs(sync, me?.role, next)
  }

  useEffect(() => {
    let cancelled = false
    void currentPushSubscription().then((s) => !cancelled && setSubscribed(!!s))
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="card">
      <div className="quest-top">
        <h3 id="sec-notifications">Notifications</h3>
        <Pill tone={subscribed ? 'good' : 'neutral'}>{!supported ? 'Not supported' : subscribed ? 'On' : 'Off'}</Pill>
      </div>
      <p className="muted">
        Get a notification on this device even when HomeQuest is closed - medicine doses, tasks due, a baby still asleep, and feeds due soon. Choose which below.
        {!configured && ' This needs sharing turned on first, so there is somewhere to store the subscription and a job that can send to it.'}
      </p>
      {!supported ? (
        <p className="note">This browser does not support push notifications. On iPhone/iPad, add HomeQuest to the Home Screen first - Safari only allows notifications for installed PWAs.</p>
      ) : (
        <div className="btn-row">
          {!subscribed ? (
            <button
              type="button"
              className="btn primary block"
              disabled={busy || !configured || !ENV_VAPID_PUBLIC_KEY}
              onClick={async () => {
                setBusy(true)
                try {
                  const res = await subscribeToPush(sync, me?.id ?? '', ENV_VAPID_PUBLIC_KEY ?? '', me?.role)
                  if (res.ok) {
                    setSubscribed(true)
                    toast('Notifications enabled on this device.')
                  } else {
                    toast(res.error)
                  }
                } catch (e) {
                  toast(`Couldn’t turn on notifications: ${e instanceof Error ? e.message : String(e)}`)
                } finally {
                  setBusy(false)
                }
              }}
            >
              <Icon name="bell" size={18} /> Enable notifications on this device
            </button>
          ) : (
            <button
              type="button"
              className="btn ghost small"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                try {
                  await unsubscribeFromPush(sync)
                  setSubscribed(false)
                  toast('Notifications turned off on this device.')
                } catch (e) {
                  toast(`Couldn’t turn off notifications: ${e instanceof Error ? e.message : String(e)}`)
                } finally {
                  setBusy(false)
                }
              }}
            >
              Turn off on this device
            </button>
          )}
        </div>
      )}
      {configured && !ENV_VAPID_PUBLIC_KEY && <p className="note warn">No VAPID public key configured for this build - see docs/PUSH_NOTIFICATIONS.md.</p>}
      {supported && subscribed && (
        <div className="stack-gap">
          <p className="note">What to notify about on this device:</p>
          {NOTIFY_TYPES.map((n) => (
            <label key={n.id} className="switch-row">
              <span className="sr-main">{n.label}</span>
              <input
                type="checkbox"
                className="switch"
                checked={notifyTypeOn(settings, n.id)}
                onChange={(e) => updateSettings({ notifyTypes: { ...settings.notifyTypes, [n.id]: e.target.checked } })}
              />
            </label>
          ))}
          <p className="note">How they arrive:</p>
          <p className="muted">
            Reminders that land close together come as one message. Medicine and baby feed reminders always come straight away, on their own.
          </p>
          <label className="switch-row">
            <span className="sr-main">One summary in the morning instead of separate reminders</span>
            <input
              type="checkbox"
              className="switch"
              checked={!!choices.morning}
              onChange={(e) => changeChoices({ ...choices, morning: e.target.checked })}
            />
          </label>
          {choices.morning && (
            <label className="field">
              <span>Send it at</span>
              <input
                type="time"
                value={choices.morningAt ?? DEFAULT_MORNING_AT}
                onChange={(e) => changeChoices({ ...choices, morningAt: e.target.value || DEFAULT_MORNING_AT })}
              />
            </label>
          )}
          <label className="field">
            <span>Most messages a day</span>
            <select value={choices.cap ?? 0} onChange={(e) => changeChoices({ ...choices, cap: Number(e.target.value) || undefined })}>
              <option value={0}>Usual ({isChild ? DEFAULT_CAP_CHILD : DEFAULT_CAP_ADULT})</option>
              {CAP_CHOICES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <p className="muted">Anything over that waits, and is dropped if it is no longer useful. Medicine and baby reminders are never counted or held back.</p>
          {me?.role === 'parent' && (
            <>
              <label className="switch-row">
                <span className="sr-main">Repeat reminders for children</span>
                <input type="checkbox" className="switch" checked={!!choices.repeatKids} onChange={(e) => changeChoices({ ...choices, repeatKids: e.target.checked })} />
              </label>
              <p className="muted">Off by default: a child hears about each thing once. Switch on to let them get a second nudge. This is for the whole family.</p>
            </>
          )}
          <p className="muted">When someone pauses with “I’m overwhelmed”, their reminders wait until the pause ends, apart from medicine and baby ones.</p>
        </div>
      )}
    </section>
  )
}

function ago(ts: number | undefined): string {
  if (!ts) return 'never'
  const s = Math.round((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400) return `${Math.round(s / 3600)} h ago`
  return `${Math.round(s / 86400)} days ago`
}

export function Data() {
  const { repo, registry, settings, updateSettings, demo } = useApp()
  const sync = useSyncStatus()
  const f = useFamily()
  const fileRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState(sync.config()?.url ?? ENV_SUPABASE_URL ?? '')
  const [anon, setAnon] = useState(sync.config()?.anonKey ?? ENV_SUPABASE_ANON_KEY ?? '')
  const [showCode, setShowCode] = useState(false)
  const [invite, setInvite] = useState('')
  const [shareErr, setShareErr] = useState<string | undefined>()
  const [turningOn, setTurningOn] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [erase, setErase] = useState(0)
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), 2600)
    return () => clearTimeout(t)
  }, [msg])
  const code = currentFamilyCode(sync)
  const configured = !!code
  const ready = !!sync.effectiveUrl() && !!sync.effectiveAnonKey()

  const doExport = () => {
    const stamp = new Date().toISOString().slice(0, 10)
    downloadText(`homequest-${(f.name || 'family').toLowerCase().replace(/\W+/g, '-')}-${stamp}.json`, makeBackup(repo.learnerId, repo.allEvents()))
    setMsg('Backup downloaded.')
  }

  const doImport = async (file: File | undefined) => {
    if (!file) return
    const res = parseBackup(await file.text())
    if (!res.ok) return setMsg(res.error)
    const n = await repo.importEvents(res.backup.events)
    setMsg(n ? `Imported ${n} new event${n === 1 ? '' : 's'}.` : 'Nothing new in that file.')
    if (fileRef.current) fileRef.current.value = ''
  }

  const last = sync.last

  return (
    <div className="parent-pane">
      <section className="card">
        <div className="quest-top">
          <h3 id="sec-sync">Sharing between your phones</h3>
          <Pill tone={!configured ? 'neutral' : sync.status === 'error' ? 'bad' : 'good'}>
            {!configured ? 'Off' : sync.status === 'error' ? 'Problem' : sync.status === 'syncing' ? 'Syncing' : 'On'}
          </Pill>
        </div>
        {!configured ? (
          <>
            <p className="muted">
              {ENV_SUPABASE_URL && ENV_SUPABASE_ANON_KEY
                ? 'Everything lives on this phone. Turn on sharing to keep the calendar, lists, trackers and coins in step on all your family’s phones (and backed up). Your family gets its own private space; nothing leaves this phone until you do this.'
                : "Everything lives on this phone. To share the calendar, lists, trackers and coins between phones, connect the family's Supabase project. Nothing leaves this phone until you do this."}
            </p>
            {!(ENV_SUPABASE_URL && ENV_SUPABASE_ANON_KEY) && (
              <>
                <label className="field">
                  <span>Project URL</span>
                  <input className="tbox" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://abcd.supabase.co" autoCapitalize="none" autoCorrect="off" />
                </label>
                <label className="field">
                  <span>Public (anon) key</span>
                  <input className="tbox" value={anon} onChange={(e) => setAnon(e.target.value)} placeholder="eyJ..." autoCapitalize="none" autoCorrect="off" />
                </label>
              </>
            )}
            <label className="field">
              <span>Invite code (if you were given one)</span>
              <input
                className="tbox"
                value={invite}
                onChange={(e) => (setInvite(e.target.value), setShareErr(undefined))}
                placeholder="hqi...."
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </label>
            <button
              type="button"
              className="btn primary block"
              disabled={demo || turningOn || (!(ENV_SUPABASE_URL && ENV_SUPABASE_ANON_KEY) && !(url.startsWith('https://') && anon.length > 20))}
              onClick={async () => {
                setTurningOn(true)
                const r = await enableSharing(repo, sync, { url, anonKey: anon, invite })
                setTurningOn(false)
                if (!r.ok) return setShareErr(r.error)
                setShareErr(undefined)
                setShowCode(true)
                void sync.syncNow()
              }}
            >
              <Icon name="cloud" size={18} /> Turn on sharing
            </button>
            {shareErr && <p className="note warn">{shareErr}</p>}
            {demo && <p className="note warn">This is the demo with made-up data, so sharing is switched off here.</p>}
          </>
        ) : (
          <>
            <p className="muted">
              Last sync: {ago(last?.at)}
              {last && !last.ok ? ` - failed: ${last.error}` : last ? ` (${last.pulled} in, ${last.pushed} out)` : ''}. {repo.pendingCount()} waiting to send.
            </p>
            <p className="note">
              {sync.realtime
                ? 'Instant updates: on — changes from the family’s other phones arrive within a few seconds.'
                : 'Instant updates: not connected — checking for changes every 25 seconds while the app is open.'}
            </p>
            {!ready && <p className="note">The project URL or key is missing, so nothing can sync yet.</p>}
            <div className="btn-row">
              <button type="button" className="btn primary" disabled={sync.status === 'syncing'} onClick={() => void sync.syncNow()}>
                <Icon name="refresh" size={18} /> Sync now
              </button>
              <button type="button" className="btn ghost" onClick={() => setShowCode((s) => !s)}>
                <Icon name="eye" size={18} /> {showCode ? 'Hide' : 'Show'} family code
              </button>
            </div>
            {showCode && code && (
              <div className="codebox">
                <code>{code}</code>
                <button type="button" className="btn ghost small" onClick={async () => setMsg((await copyText(code)) ? 'Family code copied.' : 'Could not copy - select it manually.')}>
                  <Icon name="copy" size={16} /> Copy
                </button>
                <p className="note">
                  On another phone, open HomeQuest, choose "Join my family" and enter this code{!(ENV_SUPABASE_URL && ENV_SUPABASE_ANON_KEY) ? ' plus the same project URL and key' : ''}. Treat the
                  code like a password.
                </p>
              </div>
            )}
            <button
              type="button"
              className="btn ghost small"
              onClick={async () => {
                await sync.setConfig(undefined)
                setShowCode(false)
                setMsg('Sharing turned off on this device. Progress stays here.')
              }}
            >
              Turn off sharing
            </button>
          </>
        )}
      </section>

      <InviteFamilies />

      <NotificationsSection />

      <Coparenting />

      <PrivateSection />
      <VoiceSection />
      <HomeServerSection />

      <section className="card">
        <h3 id="sec-backup">Backup</h3>
        <p className="muted">
          {repo.allEvents().length} events stored {repo.isPersistent() ? 'on this device' : '(temporary - this browser is blocking storage)'}. A backup holds the whole family (calendar, tasks,
          trackers, coins and StudyQuest history) and also works with the feedback triage script.
        </p>
        <div className="btn-row">
          <button type="button" className="btn primary" onClick={doExport}>
            <Icon name="download" size={18} /> Export
          </button>
          <button type="button" className="btn ghost" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={18} /> Import
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => void doImport(e.target.files?.[0])} />
        </div>
      </section>

      <section className="card">
        <h3>Settings</h3>
        <label className="switch-row">
          <span className="sr-main">
            <strong>Sprint without a clock</strong>
            <small className="muted">Relaxed mode by default</small>
          </span>
          <input type="checkbox" className="switch" checked={!!settings.relaxedSprint} onChange={(e) => updateSettings({ relaxedSprint: e.target.checked })} />
        </label>
        <label className="switch-row">
          <span className="sr-main">
            <strong>Setup checklist on Today</strong>
            <small className="muted">A slim banner for the first two weeks, until each step is done</small>
          </span>
          <input type="checkbox" className="switch" checked={!settings.hideGettingStarted} onChange={(e) => updateSettings({ hideGettingStarted: !e.target.checked })} />
        </label>
      </section>

      <section className="card">
        <h3 id="sec-help">Help and updates</h3>
        <VersionCard />
        <OnboardingLinks />
      </section>

      <section className="card">
        <h3>Content</h3>
        <ul className="facts">
          {[...registry.packs.values()].map((p) => (
            <li key={p.id}>
              <span>{p.name}</span>
              <strong>
                v{p.version} · {p.skills.filter((s) => registry.hasContent(s.id)).length} topics
              </strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="card danger">
        <h3>Erase this device</h3>
        <p className="muted">Deletes all progress stored here. If sharing is on and has synced, your Supabase copy is untouched.</p>
        {erase === 0 ? (
          <button type="button" className="btn ghost small" onClick={() => setErase(1)}>
            <Icon name="trash" size={16} /> Erase...
          </button>
        ) : (
          <div className="btn-row">
            <button
              type="button"
              className="btn danger small"
              onClick={async () => {
                await eraseDevice(repo)
                location.reload()
              }}
            >
              Yes, erase everything
            </button>
            <button type="button" className="btn ghost small" onClick={() => setErase(0)}>
              Cancel
            </button>
          </div>
        )}
      </section>

      {msg && (
        <div className="toast" role="status">
          {msg}
        </div>
      )}
    </div>
  )
}

/** Private key: make it, add it to another phone, hold a copy for someone. The sheet itself lives in family/PrivateKeys.tsx. */
function PrivateSection() {
  const { sync } = useApp()
  useSyncStatus()
  const [open, setOpen] = useState(false)
  return (
    <section className="card">
      <div className="quest-top">
        <h3 id="sec-private">Private things</h3>
        <Pill tone={sync.ownKey() ? 'good' : 'neutral'}>{sync.ownKey() ? 'Key on this phone' : 'No key yet'}</Pill>
      </div>
      <p className="muted">
        Brain dump items marked private, and an adult’s check-in mood, are stored with a personal key so other phones never receive them. Make your key, put it on a second phone, or hold a copy of a
        child’s so a lost phone can be restored. Needs the one-time database update (<code>supabase/schema_v3.sql</code>).
      </p>
      <button type="button" className="btn block" onClick={() => setOpen(true)}>
        Private key
      </button>
      {open && <PrivateKeys onClose={() => setOpen(false)} />}
    </section>
  )
}

/** Voice logging: the two defaults the log-care function reads, the phrases to set up, and a pointer to the guide. */
function VoiceSection() {
  const f = useFamily()
  const me = useMe()
  const { act, toast } = useApp()
  const browserZone = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      return DEFAULT_VOICE.tz
    }
  })()
  const saved = cleanVoiceSettings(f.voice ? { bottleMl: f.voice.bottleMl, milk: f.voice.milk, tz: f.voice.tz } : { ...DEFAULT_VOICE, tz: validZone(browserZone) ? browserZone : DEFAULT_VOICE.tz })
  const [ml, setMl] = useState(String(saved.bottleMl))
  const [milk, setMilk] = useState(saved.milk)
  const [tz, setTz] = useState(saved.tz)
  if (!me || me.role !== 'parent') return null
  const next = cleanVoiceSettings({ bottleMl: Number(ml), milk, tz })
  const dirty = !f.voice || next.bottleMl !== saved.bottleMl || next.milk !== saved.milk || next.tz !== saved.tz
  return (
    <section className="card">
      <div className="quest-top">
        <h3 id="sec-voice">Voice logging</h3>
        <Pill tone="neutral">Untested on real speakers</Pill>
      </div>
      <p className="muted">
        Say a fixed phrase to a Google Home speaker to log a feed or a nappy hands-free: {Object.values(COMMAND_PHRASES).join(', ')}. It takes a one-off set-up with Home Assistant and a small function
        in your Supabase project (see <code>docs/VOICE_LOGGING.md</code>). Entries made this way show as “logged by voice” until you set who in Edit entry.
      </p>
      <div className="row-fields">
        <label className="field">
          <span>“Bottle” logs (ml)</span>
          <input className="tbox" inputMode="numeric" value={ml} onChange={(e) => setMl(e.target.value.replace(/\D/g, '').slice(0, 3))} style={{ width: 90 }} />
        </label>
        <label className="field grow">
          <span>Milk</span>
          <select className="tbox" value={milk} onChange={(e) => setMilk(e.target.value === 'expressed' ? 'expressed' : 'formula')}>
            <option value="formula">Formula</option>
            <option value="expressed">Expressed</option>
          </select>
        </label>
      </div>
      <label className="field">
        <span>Time zone (so entries land on the right day)</span>
        <input className="tbox" value={tz} onChange={(e) => setTz(e.target.value)} aria-invalid={!validZone(tz)} />
      </label>
      {!validZone(tz) && <p className="note warn">That time zone is not recognised, for example Europe/London.</p>}
      <button
        type="button"
        className="btn block"
        disabled={!dirty || !validZone(tz)}
        onClick={() => {
          act(CA.saveVoiceConfig(me.id, next))
          toast('Voice logging settings saved.')
        }}
      >
        Save
      </button>
    </section>
  )
}
