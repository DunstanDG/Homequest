import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as A from '@/family/actions'
import { elapsedMs, elapsedSec, fmtClock, remainingSec, totalSec } from '@/family/timers'
import type { MemberId, TimerState } from '@/family/types'
import { useApp, useFamily, useMe, useNow } from '@/app/context'
import { cancelNotificationFor } from '@/app/push'
import { sleepReminderTag } from '@/family/notify'
import { Avatar } from './fam'
import { Icon } from './icons'
import { Ring, Sheet, buzz } from './primitives'
import { startWhiteNoise, type WhiteNoiseHandle } from './whiteNoise'

/** Three soft beeps. Needs a user gesture earlier in the session (starting the timer counts). */
export function playAlarm() {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    const ctx = new Ctor()
    for (let i = 0; i < 3; i++) {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = 880
      o.connect(g)
      g.connect(ctx.destination)
      const t = ctx.currentTime + i * 0.35
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28)
      o.start(t)
      o.stop(t + 0.3)
    }
    setTimeout(() => void ctx.close(), 1500)
  } catch {
    /* no audio: the screen still changes */
  }
}

/** One soft two-note chime: "that step's time is up", gentler than the timer alarm. */
export function playChime() {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    const ctx = new Ctor()
    ;[660, 880].forEach((hz, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = hz
      o.connect(g)
      g.connect(ctx.destination)
      const t = ctx.currentTime + i * 0.22
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
      o.start(t)
      o.stop(t + 0.55)
    })
    setTimeout(() => void ctx.close(), 1200)
  } catch {
    /* no audio: the screen still changes */
  }
}

/** Keep the screen on while a timer runs (where the browser allows it). */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    let lock: { release(): Promise<void> } | null = null
    let cancelled = false
    const grab = async () => {
      try {
        const nav = navigator as Navigator & { wakeLock?: { request(t: 'screen'): Promise<{ release(): Promise<void> }> } }
        if (nav.wakeLock && document.visibilityState === 'visible') {
          const l = await nav.wakeLock.request('screen')
          if (cancelled) void l.release()
          else lock = l
        }
      } catch {
        /* not allowed: fine */
      }
    }
    void grab()
    const onVis = () => document.visibilityState === 'visible' && void grab()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVis)
      void lock?.release().catch(() => undefined)
    }
  }, [active])
}

/** Rings the alarm once when a running countdown reaches zero. */
/** Timers that have already rung on this phone this session (survives the screen re-mounting). */
const RUNG = new Set<string>()

export function useTimerAlarm(t: TimerState | undefined, now: number) {
  const { settings } = useApp()
  const left = t ? remainingSec(t, now) : undefined
  useEffect(() => {
    // Only ring when the time has just run out; a timer that was already long overdue when this screen opened stays quiet.
    if (!t || t.status !== 'running' || left === undefined || left > 0 || left < -30) return
    const k = `${t.id}:${totalSec(t)}`
    if (RUNG.has(k)) return
    RUNG.add(k)
    if (!settings.quietTimers) {
      playAlarm()
      buzz([300, 120, 300, 120, 500])
    }
  }, [t, left, settings.quietTimers])
}

const PRESETS = [10, 15, 20, 25, 30, 45, 60]

/** Choose a length and start a timer. Used for homework, tidying, reading, anything. */
export function StartTimerSheet({
  open,
  onClose,
  label,
  memberId,
  taskId,
  taskDate,
  defaultMinutes = 20,
  purpose = 'focus',
}: {
  open: boolean
  onClose: () => void
  label: string
  memberId: MemberId
  taskId?: string
  taskDate?: string
  defaultMinutes?: number
  purpose?: TimerState['purpose']
}) {
  const { act } = useApp()
  const me = useMe()
  const nav = useNavigate()
  const [mins, setMins] = useState<number | 0>(defaultMinutes)
  const [custom, setCustom] = useState('')
  useEffect(() => {
    if (open) {
      setMins(defaultMinutes)
      setCustom('')
    }
  }, [open, defaultMinutes])
  const go = () => {
    const m = custom ? Math.max(1, Math.min(600, Number(custom) || 0)) : mins
    const { timerId, events } = A.startTimer(me?.id ?? memberId, { memberId, label, plannedSec: m ? m * 60 : 0, taskId, taskDate: taskDate as never, purpose })
    act(events)
    onClose()
    nav(`/timer/${timerId}`)
  }
  return (
    <Sheet open={open} onClose={onClose} title="Start a timer">
      <p className="muted">{label}</p>
      <div className="chips">
        {PRESETS.map((m) => (
          <button key={m} type="button" className={`chip${!custom && mins === m ? ' selected' : ''}`} onClick={() => (setMins(m), setCustom(''))}>
            {m} min
          </button>
        ))}
        <button type="button" className={`chip${!custom && mins === 0 ? ' selected' : ''}`} onClick={() => (setMins(0), setCustom(''))}>
          Count up
        </button>
      </div>
      <label className="field">
        <span>Or type minutes</span>
        <input className="tbox" inputMode="numeric" value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="e.g. 35" />
      </label>
      <button type="button" className="btn primary big block" onClick={go}>
        <Icon name="play" size={20} /> Start
      </button>
    </Sheet>
  )
}

/** Compact running-timer row for the Today screen and the trackers. Tap to open the full-screen timer.
 * A running sleep timer also gets a play/mute control for looped white noise (see `ui/whiteNoise.ts`) — off by
 * default, since a parent may be in the room and not want it, or may specifically want it as a settling aid. Web
 * Audio needs a user gesture to start, so it is only ever started from this button's own click, never on mount. */
export function MiniTimer({ timer }: { timer: TimerState }) {
  const nav = useNavigate()
  const f = useFamily()
  const now = useNow(1000)
  useTimerAlarm(timer, now)
  const left = remainingSec(timer, now)
  const over = left !== undefined && left <= 0
  const shown = left === undefined ? elapsedSec(timer, now) : Math.abs(left)
  const noiseAvailable = timer.purpose === 'sleep' && timer.status === 'running'
  const [noiseOn, setNoiseOn] = useState(false)
  const noiseRef = useRef<WhiteNoiseHandle | undefined>(undefined)
  const stopNoise = () => {
    noiseRef.current?.stop()
    noiseRef.current = undefined
    setNoiseOn(false)
  }
  // Stop cleanly the moment the sleep timer is no longer actively running (paused/finished), and on unmount.
  useEffect(() => {
    if (!noiseAvailable) stopNoise()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noiseAvailable])
  useEffect(() => stopNoise, [])
  const toggleNoise = (e: MouseEvent) => {
    e.stopPropagation()
    if (noiseRef.current) stopNoise()
    else {
      const handle = startWhiteNoise()
      if (handle) {
        noiseRef.current = handle
        setNoiseOn(true)
      }
    }
  }
  return (
    <div className={`mini-timer${over ? ' over' : ''}${timer.status === 'paused' ? ' paused' : ''}`}>
      <button type="button" className="mt-tap" onClick={() => nav(`/timer/${timer.id}`)}>
        <Avatar m={f.members[timer.memberId]} size={30} />
        <span className="mt-main">
          <strong>{timer.label}</strong>
          <small>{timer.status === 'paused' ? 'Paused' : over ? 'Time is up' : left === undefined ? 'Counting up' : 'Time left'}</small>
        </span>
        <span className="mt-clock">
          {over ? '+' : ''}
          {fmtClock(shown)}
        </span>
      </button>
      {noiseAvailable && (
        <button type="button" className="icon-btn small" aria-label={noiseOn ? 'Mute white noise' : 'Play white noise'} onClick={toggleNoise}>
          <Icon name={noiseOn ? 'volume' : 'volume-mute'} size={18} />
        </button>
      )}
      <button type="button" className="icon-btn small" aria-label="Open timer" onClick={() => nav(`/timer/${timer.id}`)}>
        <Icon name="chevron" size={18} />
      </button>
    </div>
  )
}

/** Full-screen timer: big clock, few buttons, keeps the screen awake. */
export function TimerScreen() {
  const { id } = useParams()
  const nav = useNavigate()
  const { act, toast, sync } = useApp()
  const f = useFamily()
  const me = useMe()
  const now = useNow(1000)
  const t = id ? f.timers[id] : undefined
  useTimerAlarm(t, now)
  useWakeLock(t?.status === 'running')

  if (!t) {
    return (
      <div className="screen timer-screen">
        <p>That timer is not here any more.</p>
        <button type="button" className="btn primary" onClick={() => nav('/')}>
          Back to today
        </button>
      </div>
    )
  }
  const actor = me?.id ?? t.memberId
  const left = remainingSec(t, now)
  const total = totalSec(t)
  const elapsed = elapsedSec(t, now)
  const over = left !== undefined && left <= 0
  const ended = t.status === 'done' || t.status === 'cancelled'
  const task = t.taskId ? f.tasks[t.taskId] : undefined
  const progress = total ? Math.min(1, elapsed / total) : (elapsed % 3600) / 3600
  const shown = left === undefined ? elapsed : Math.abs(left)

  const finish = () => {
    const evs = A.finishTimer(actor, f, t.id, elapsedMs(t, Date.now()), {}, Date.now())
    act(evs)
    const done = evs.find((e) => e.type === 'task-done')
    if (done && done.type === 'task-done') toast(done.needsCheck ? `Nice one! ${done.coins} coins waiting for a parent to check.` : `Done! +${done.coins} coins.`)
    else toast('Timer finished.')
    if (t.purpose === 'sleep') void cancelNotificationFor(sync, sleepReminderTag(t.id))
    nav(-1)
  }

  return (
    <div className={`screen timer-screen${over ? ' over' : ''}`}>
      <header className="screen-head">
        <button type="button" className="icon-btn" onClick={() => nav(-1)} aria-label="Back">
          <Icon name="back" />
        </button>
        <div className="sh-title">
          <p className="eyebrow">{t.purpose === 'focus' ? 'Focus timer' : t.purpose === 'walk' ? 'Walk' : t.purpose === 'feed' ? 'Feed' : t.purpose === 'sleep' ? 'Sleep' : 'Timer'}</p>
          <h1>{t.label}</h1>
        </div>
        <Avatar m={f.members[t.memberId]} size={40} />
      </header>

      <div className="timer-body">
        <Ring value={ended ? 1 : progress} size={280} stroke={16} tone={over ? 'good' : 'accent'}>
          <div className="timer-face">
            <div className="timer-clock">
              {over ? '+' : ''}
              {fmtClock(shown)}
            </div>
            <div className="timer-sub">{ended ? (t.status === 'done' ? 'Finished' : 'Cancelled') : t.status === 'paused' ? 'Paused' : over ? "Time's up" : left === undefined ? 'elapsed' : `of ${fmtClock(total)}`}</div>
          </div>
        </Ring>
        {task && (
          <p className="muted timer-task">
            {task.subject ? `${task.subject} · ` : ''}
            {task.title}
            {task.coins ? ` · ${task.coins} coins` : ''}
          </p>
        )}
        {over && !ended && <p className="lead timer-msg">Nice focus. Finish up, or add a few more minutes.</p>}
      </div>

      {!ended && (
        <div className="timer-actions">
          {t.status === 'running' ? (
            <button type="button" className="btn big" onClick={() => act(A.pauseTimer(actor, t.id))}>
              <Icon name="pause" size={20} /> Pause
            </button>
          ) : (
            <button type="button" className="btn big" onClick={() => act(A.resumeTimer(actor, t.id))}>
              <Icon name="play" size={20} /> Resume
            </button>
          )}
          <button type="button" className="btn primary big" onClick={finish}>
            <Icon name="check" size={20} /> {t.taskId ? "I'm done" : 'Finish'}
          </button>
          {total > 0 && (
            <button type="button" className="btn ghost" onClick={() => act(A.extendTimer(actor, t.id, 300))}>
              <Icon name="plus" size={18} /> 5 more minutes
            </button>
          )}
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              act(A.cancelTimer(actor, t.id))
              if (t.purpose === 'sleep') void cancelNotificationFor(sync, sleepReminderTag(t.id))
              nav(-1)
            }}
          >
            Cancel timer
          </button>
        </div>
      )}
      {ended && (
        <div className="timer-actions">
          <button type="button" className="btn primary big" onClick={() => nav(-1)}>
            Back
          </button>
        </div>
      )}
    </div>
  )
}
