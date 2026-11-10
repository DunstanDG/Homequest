/**
 * The announcer: on a phone or tablet set up in Settings › Read-outs (a kitchen tablet, an old phone on the shelf), reads
 * tasks out loud when they're due. It only works while HomeQuest is open on that device; "keep the screen on" helps.
 * The rules for what is read out, and the wording, are in family/announce.ts.
 *
 * Safari (iPhone and iPad) only lets a page speak after someone has tapped it, so after each reload the device shows a
 * small "Tap to turn on read-outs" button until it has been tapped.
 */
import { useEffect, useRef, useState } from 'react'
import { useApp, useCalCtx, useFamily, useNow } from './context'
import { ANNOUNCE_WINDOW_MIN, claimAnnouncement, dueAnnouncements, saveAnnouncer, type Announcement } from '@/family/announce'
import { toMin, ymdOf, hmOf } from '@/family/dates'
import { uid } from '@/engine/rng'

export interface AnnouncerPrefs {
  on: boolean
  deviceId: string
  name: string
  /** A SpeechSynthesisVoice name; empty = the best British English voice there is. */
  voice?: string
  rate?: number
  chime?: boolean
  keepAwake?: boolean
  /** Also read out here when the home speakers do it (normally the device steps back, so nothing is said twice). */
  alsoWithSpeakers?: boolean
}

export const defaultAnnouncer = (): AnnouncerPrefs => ({ on: false, deviceId: uid('dev'), name: 'Kitchen tablet', rate: 0.95, chime: true, keepAwake: true })

// ------------------------------------------------------------------ speaking

const synth = (): SpeechSynthesis | undefined => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : undefined)
export const canSpeak = (): boolean => !!synth()

/** British English first, then any English, then whatever the device has. */
export function pickVoice(voices: SpeechSynthesisVoice[], wanted?: string): SpeechSynthesisVoice | undefined {
  return (wanted ? voices.find((v) => v.name === wanted) : undefined) ?? voices.find((v) => v.lang === 'en-GB') ?? voices.find((v) => v.lang.startsWith('en')) ?? voices[0]
}

export function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => synth()?.getVoices() ?? [])
  useEffect(() => {
    const s = synth()
    if (!s) return
    const load = () => setVoices(s.getVoices())
    load()
    s.addEventListener?.('voiceschanged', load)
    return () => s.removeEventListener?.('voiceschanged', load)
  }, [])
  return voices
}

/** A soft two-note chime, so a read-out doesn't start out of nowhere. */
function chime(): Promise<void> {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return Promise.resolve()
    const ctx = new Ctx()
    const note = (freq: number, at: number) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = freq
      g.gain.setValueAtTime(0.0001, ctx.currentTime + at)
      g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + at + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.6)
      o.connect(g).connect(ctx.destination)
      o.start(ctx.currentTime + at)
      o.stop(ctx.currentTime + at + 0.65)
    }
    note(660, 0)
    note(880, 0.28)
    return new Promise((r) => setTimeout(() => (void ctx.close(), r()), 950))
  } catch {
    return Promise.resolve()
  }
}

/** Say something (after the chime, unless it's off). Resolves when it has finished, or after 20 s at most. */
export async function speak(text: string, p: Pick<AnnouncerPrefs, 'voice' | 'rate' | 'chime'>): Promise<void> {
  const s = synth()
  if (!s) return
  if (p.chime !== false) await chime()
  await new Promise<void>((resolve) => {
    const u = new SpeechSynthesisUtterance(text)
    const v = pickVoice(s.getVoices(), p.voice)
    if (v) u.voice = v
    u.lang = v?.lang ?? 'en-GB'
    u.rate = p.rate ?? 0.95
    u.pitch = 1
    const done = () => resolve()
    u.onend = done
    u.onerror = done
    setTimeout(done, 20_000)
    s.cancel()
    s.speak(u)
  })
}

// ------------------------------------------------------------------ the running announcer

/** Mounted once (App.tsx). Does nothing unless this device is an announcer. */
export function TaskAnnouncer() {
  const { settings, repo, act } = useApp()
  const f = useFamily()
  const ctx = useCalCtx()
  const now = useNow(10_000)
  const prefs = settings.announcer
  const on = !!prefs?.on && canSpeak()
  const [unlocked, setUnlocked] = useState(false)
  const busy = useRef(false)
  const said = useRef(new Set<string>())

  // Keep the screen on while it's an announcer (where the browser allows it).
  useEffect(() => {
    if (!on || !prefs?.keepAwake) return
    type Lock = { release(): Promise<void> }
    const nav = navigator as Navigator & { wakeLock?: { request(t: 'screen'): Promise<Lock> } }
    let lock: Lock | undefined
    const get = async () => {
      try {
        if (nav.wakeLock && document.visibilityState === 'visible') lock = await nav.wakeLock.request('screen')
      } catch {
        /* not allowed here: fine */
      }
    }
    void get()
    const onVis = () => document.visibilityState === 'visible' && void get()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      void lock?.release().catch(() => {})
    }
  }, [on, prefs?.keepAwake])

  // Read out whatever is due.
  useEffect(() => {
    if (!on || !prefs || busy.current) return
    if (f.travel.features?.taskAnnouncements && !prefs.alsoWithSpeakers) return
    const me = repo.me()
    if (!me) return
    const list: Announcement[] = dueAnnouncements(ctx, ymdOf(now), toMin(hmOf(now)), now, ANNOUNCE_WINDOW_MIN).filter((a) => !said.current.has(a.key))
    if (!list.length) return
    busy.current = true
    void (async () => {
      for (const a of list) {
        said.current.add(a.key)
        act(claimAnnouncement(me, a.key, prefs.deviceId))
        await speak(a.text, prefs)
      }
      busy.current = false
    })()
  }, [on, now, f])

  // Tell the family this device is (still) an announcer, so the task form can say where things will be heard.
  useEffect(() => {
    if (!prefs?.deviceId) return
    const cur = f.announcers[prefs.deviceId]
    const me = repo.me()
    if (me && (!cur || cur.on !== prefs.on || cur.name !== prefs.name)) act(saveAnnouncer(me, prefs.deviceId, prefs.name, prefs.on))
  }, [prefs?.deviceId, prefs?.on, prefs?.name])

  if (!on || unlocked) return null
  return (
    <button
      type="button"
      className="announce-unlock"
      aria-label="Tap once to let this device read things out loud"
      onClick={() => {
        // Speaking once from a tap is what lets Safari speak later on its own.
        const s = synth()
        if (s) {
          const u = new SpeechSynthesisUtterance(' ')
          u.volume = 0
          s.speak(u)
        }
        setUnlocked(true)
      }}
    >
      🔊 Tap to turn on read-outs
    </button>
  )
}
