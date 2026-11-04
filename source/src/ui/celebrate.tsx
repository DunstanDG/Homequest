/**
 * Celebrating a tick. `celebrateEvents()` is called from `act` in context.tsx for every batch of events this phone
 * writes; if it holds a finished task (or the end of a routine or session) by the phone's holder, it decides what to
 * show (celebrateLogic.ts, which respects the calm settings) and shows it. The host mounts itself once, on the first
 * celebration, so no screen needs to know about it. Events synced from other phones never come through here.
 */
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { calmOf, prefersReducedMotion } from '@/app/calm'
import type { Settings } from '@/app/context'
import type { Repo } from '@/storage/repo'
import { tasksFor } from '@/family/calendar'
import { makeCalCtx } from '@/family/calendar'
import { ymdOf } from '@/family/dates'
import type { AppEvent } from '@/engine/types'
import { decideCelebration, type Decision, type Moment } from './celebrateLogic'
import { doneOn } from '@/screens/family/rewards/rewardsLogic'
import './celebrate.css'

interface Shown {
  id: number
  d: Decision
}

let nextId = 1
let pick = Math.floor(Math.random() * 100)
const pending: Shown[] = []
let listener: ((s: Shown) => void) | undefined
let mounted = false

function ensureHost() {
  if (mounted || typeof document === 'undefined') return
  mounted = true
  const el = document.createElement('div')
  el.className = 'cel-root'
  document.body.appendChild(el)
  createRoot(el).render(<CelebrationHost />)
}

export function showCelebration(d: Decision) {
  if (!d.show) return
  const s = { id: nextId++, d }
  ensureHost()
  if (listener) listener(s)
  else pending.push(s)
  if (d.haptic !== 'none') {
    try {
      navigator.vibrate?.(d.haptic === 'tick' ? 20 : [12])
    } catch {
      /* no haptics */
    }
  }
  if (d.chime) chime(d.big)
}

/** A soft two-note chime made with WebAudio (no audio files). Quieter than the timer chime. */
function chime(big: boolean) {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    const ctx = new Ctor()
    const notes = big ? [523, 659, 784] : [659, 880]
    notes.forEach((hz, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = hz
      o.connect(g)
      g.connect(ctx.destination)
      const t = ctx.currentTime + i * 0.12
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.07, t + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45)
      o.start(t)
      o.stop(t + 0.5)
    })
    setTimeout(() => void ctx.close(), 1200)
  } catch {
    /* no audio: the screen still changes */
  }
}

/** Called after `repo.apply(events)`. Never throws: a celebration must not get in the way of ticking something off. */
export function celebrateEvents(repo: Repo, settings: Settings, events: AppEvent[], now = Date.now()): void {
  try {
    const me = repo.me()
    if (!me) return
    const mine = events.filter((e) => e.learnerId === me && (e.type === 'task-done' || (e.type === 'run' && e.action === 'end' && e.outcome !== 'abandoned')))
    if (!mine.length) return
    const f = repo.family()
    const role = f.members[me]?.role === 'child' ? 'child' : 'parent'
    const calm = calmOf(settings.calm, role)
    if (calm.celebrate === 'off') return
    let coins = 0
    let needsCheck = false
    for (const e of mine) {
      if (e.type === 'task-done' && (!e.payee || e.payee === me)) {
        coins += e.coins
        needsCheck ||= e.needsCheck
      }
    }
    const today = ymdOf(now)
    let moment: Moment = 'normal'
    const doneToday = doneOn(f, me, today).length
    const rows = tasksFor(makeCalCtx(f), me, today, now)
    const allDone = rows.length >= 2 && rows.every((r) => !!r.done && r.done.status !== 'rejected')
    if (allDone) moment = 'all'
    else if (doneToday <= mine.length) moment = 'first'
    const d = decideCelebration(calm, { reducedMotion: prefersReducedMotion(), quietTimers: !!settings.quietTimers }, { coins, needsCheck, moment }, pick++)
    showCelebration(d)
  } catch {
    /* ignore */
  }
}

const SHAPES = ['✨', '⭐', '🎉', '💛', '🌟', '🟡', '🔸']

function CelebrationHost() {
  const [items, setItems] = useState<Shown[]>([])
  useEffect(() => {
    const add = (s: Shown) => {
      setItems((prev) => [...prev.slice(-1), s])
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== s.id)), s.d.burst ? 2600 : 2400)
    }
    listener = add
    pending.splice(0).forEach(add)
    return () => {
      listener = undefined
    }
  }, [])
  return (
    <div className="cel-layer" aria-live="polite" role="status">
      {items.map(({ id, d }) => (
        <div key={id} className={`cel-item${d.big ? ' big' : ''}`}>
          {d.burst && <Burst n={d.big ? 30 : 16} />}
          <div className={`cel-card${d.burst ? ' moving' : ''}`}>
            <span className="cel-msg">{d.message}</span>
            {d.chip && <span className={`cel-chip${d.burst ? ' flying' : ''}`}>{d.chip}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

function Burst({ n }: { n: number }) {
  return (
    <div className="cel-burst" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + (i % 3) * 0.2
        const r = 90 + ((i * 37) % 90)
        return (
          <span
            key={i}
            style={{ ['--dx' as string]: `${Math.round(Math.cos(a) * r)}px`, ['--dy' as string]: `${Math.round(Math.sin(a) * r - 40)}px`, ['--rot' as string]: `${(i * 53) % 360}deg`, animationDelay: `${(i % 5) * 20}ms` }}
          >
            {SHAPES[i % SHAPES.length]}
          </span>
        )
      })}
    </div>
  )
}
