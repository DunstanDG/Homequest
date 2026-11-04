import { useEffect, useRef, useState } from 'react'
import type { Answer, Item } from '@/engine/types'
import { judge } from '@/engine/judge'
import type { Planned } from '@/engine/planner'
import { Icon } from '@/ui/icons'
import { Keypad, type KeyDef } from '@/ui/keypad'
import { numericKey } from '@/ui/inputLogic'
import { Rich } from '@/ui/rich'
import { buzz } from '@/ui/primitives'
import type { GameProps } from './types'

/** Equation Defence: several multiplication-fact questions fall from the top at once; typing the right
 * answer and firing destroys the lowest (most-fallen) meteor carrying it. A meteor that reaches the base
 * unsolved costs a life and counts as one wrong attempt - same scoring as getting it wrong in any other
 * game, just under time pressure instead of a "submit" button. Built for automaticity: quick, repeated
 * recall of facts the learner has already started to know, without the formality of a normal question screen. */

const LIVES = 4
const MAX_OPEN = 3
const LAND_PCT = 86

interface Meteor {
  slotId: string
  item: Item
  planned: Planned
  durationMs: number
  bornAt: number
  state: 'falling' | 'hit' | 'missed'
  /** Which of the MAX_OPEN horizontal lanes this meteor falls in, so concurrent ones don't overlap. */
  lane: number
  /** Set the moment a falling meteor is hit or lands: its `top`, frozen (in percent) at wherever the fall
   * animation had it at that instant, so the hit/missed animations (which only touch scale/opacity/translateY,
   * not top - see styles.css) hold it exactly where it stopped instead of it snapping back to the top. */
  landedTop?: number
}

/** The meteor's start and landing `top`, in percent - must stay in sync with the `meteor-fall` @keyframes
 * in styles.css, which mirrors these same two numbers. */
const START_PCT = -14

/** Harder facts fall a little slower, so the extra thinking time roughly matches the extra difficulty.
 * Slower across the board than the original 6200ms base - three of these landing close together at the
 * faster pace read as overwhelming rather than challenging. */
const fallDuration = (difficulty: number) => 8200 + Math.max(0, difficulty) * 900

/** Minimum gap between one meteor appearing and the next being allowed to spawn, so a newly-opened lane
 * doesn't fill instantly - see the spawn-scheduling effect below. The very first meteor of a wave is exempt
 * (spawns immediately), only the ones after it are paced out. */
const SPAWN_STAGGER_MS = 1800

export function MeteorDefence({ session, game, onDone, onExit }: GameProps) {
  const [meteors, setMeteors] = useState<Meteor[]>([])
  const [value, setValue] = useState('')
  const [lives, setLives] = useState(LIVES)
  const [remaining, setRemaining] = useState((game.timeLimitSec ?? 90) * 1000)
  const [ended, setEnded] = useState<'cleared' | 'overwhelmed' | 'time' | null>(null)
  const [miss, setMiss] = useState(false)
  const timers = useRef<Map<string, number>>(new Map())
  const finished = useRef(false)
  // Mirrors `meteors` for the spawn-scheduling timeout below to read a fresh value from, since that callback
  // fires later and can't trust whatever `meteors` was closed over when the timeout was scheduled.
  const meteorsRef = useRef<Meteor[]>(meteors)
  meteorsRef.current = meteors
  const spawnTimer = useRef<number | undefined>(undefined)
  const nextSpawnAt = useRef(0)

  const finish = (completed: boolean) => {
    if (finished.current) return
    finished.current = true
    for (const t of timers.current.values()) window.clearTimeout(t)
    timers.current.clear()
    if (spawnTimer.current) window.clearTimeout(spawnTimer.current)
    onDone(session.finish(completed))
  }

  const land = (slotId: string) => {
    if (!timers.current.has(slotId)) return // already resolved (hit, or landed) - never double-score
    timers.current.delete(slotId)
    setMeteors((ms) => ms.map((m) => (m.slotId === slotId ? { ...m, state: 'missed', landedTop: LAND_PCT } : m)))
    session.resolve(slotId, undefined)
    buzz([30, 40, 30])
    setLives((l) => {
      const next = l - 1
      if (next <= 0) window.setTimeout(() => setEnded('overwhelmed'), 350)
      return next
    })
    window.setTimeout(() => setMeteors((ms) => ms.filter((m) => m.slotId !== slotId)), 500)
  }

  const spawn = () => {
    const s = session.spawn()
    if (!s) return false
    const durationMs = fallDuration(s.planned.difficulty)
    // Reads the live ref, not the `meteors` this closure was created with - spawn() can now fire from a
    // delayed, staggered timeout (see the effect below), by which point a plain closure over `meteors` could
    // be stale and hand out a lane something else has since taken.
    const usedLanes = new Set(meteorsRef.current.filter((x) => x.state === 'falling').map((x) => x.lane))
    let lane = 0
    while (usedLanes.has(lane) && lane < MAX_OPEN - 1) lane++
    const m: Meteor = { slotId: s.slotId, item: s.item, planned: s.planned, durationMs, bornAt: Date.now(), state: 'falling', lane }
    setMeteors((ms) => [...ms, m])
    const t = window.setTimeout(() => land(s.slotId), durationMs)
    timers.current.set(s.slotId, t)
    return true
  }

  // Keep the sky topped up, until the wave is over or the session runs out of questions to give - but
  // staggered rather than instant. Without pacing, this effect re-fires the instant a meteor is added
  // (since `meteors` just changed) and fills all open lanes in the same tick, so a fresh wave (or a lane
  // that just opened up) used to dump 2-3 meteors on screen at once. `nextSpawnAt` is a cooldown the timeout
  // sets after each spawn; `spawnTimer` guards against scheduling a second timeout while one is already
  // pending (this effect re-runs on every meteors change, including ones a scheduled spawn didn't cause).
  useEffect(() => {
    if (ended || finished.current) return
    if (meteors.filter((m) => m.state === 'falling').length >= MAX_OPEN) return
    if (spawnTimer.current !== undefined) return
    const wait = Math.max(0, nextSpawnAt.current - Date.now())
    spawnTimer.current = window.setTimeout(() => {
      spawnTimer.current = undefined
      if (ended || finished.current) return
      nextSpawnAt.current = Date.now() + SPAWN_STAGGER_MS
      const spawned = spawn()
      if (!spawned && meteorsRef.current.length === 0) setEnded('cleared')
    }, wait)
  }, [meteors, ended])

  // Countdown, mirroring Sprint's timer.
  useEffect(() => {
    if (ended || finished.current) return
    const id = window.setInterval(() => setRemaining((r) => Math.max(0, r - 250)), 250)
    return () => window.clearInterval(id)
  }, [ended])
  useEffect(() => {
    if (!ended && remaining <= 0) setEnded('time')
  }, [remaining, ended])

  // Once the wave has ended, let the last explosions/impacts play out before closing the session.
  useEffect(() => {
    if (!ended) return
    const t = window.setTimeout(() => finish(ended !== 'overwhelmed'), 1200)
    return () => window.clearTimeout(t)
  }, [ended])

  useEffect(() => () => finish(false), []) // eslint-disable-line react-hooks/exhaustive-deps

  const fire = () => {
    const v = value.trim()
    if (!v || ended) return
    const falling = meteors.filter((m) => m.state === 'falling')
    const answer: Answer = { kind: 'numeric', values: [v] }
    const hits = falling.filter((m) => judge(m.item, answer).correct)
    if (!hits.length) {
      setMiss(true)
      window.setTimeout(() => setMiss(false), 260)
      setValue('')
      return
    }
    // The lowest one - most fallen, closest to landing - is the one the laser reaches first.
    const target = hits.reduce((a, b) => ((Date.now() - a.bornAt) / a.durationMs > (Date.now() - b.bornAt) / b.durationMs ? a : b))
    const t = timers.current.get(target.slotId)
    if (t) window.clearTimeout(t)
    timers.current.delete(target.slotId)
    session.resolve(target.slotId, answer)
    // Freeze it where the fall animation had it at this instant, so the hit animation (scale/opacity only)
    // plays in place instead of the meteor jumping anywhere.
    const progress = Math.min(1, (Date.now() - target.bornAt) / target.durationMs)
    const landedTop = START_PCT + progress * (LAND_PCT - START_PCT)
    setMeteors((ms) => ms.map((m) => (m.slotId === target.slotId ? { ...m, state: 'hit', landedTop } : m)))
    buzz(18)
    setValue('')
    window.setTimeout(() => setMeteors((ms) => ms.filter((m) => m.slotId !== target.slotId)), 380)
  }

  const press = (k: string) => {
    if (ended) return
    if (k === 'fire') return fire()
    setValue((v) => numericKey(v, k))
  }

  const keys: KeyDef[] = [
    { k: '7' }, { k: '8' }, { k: '9' }, { k: 'back', label: <Icon name="backspace" size={22} />, tone: 'action', aria: 'Delete' },
    { k: '4' }, { k: '5' }, { k: '6' }, { k: '', tone: 'blank' },
    { k: '1' }, { k: '2' }, { k: '3' }, { k: '', tone: 'blank' },
    { k: '0' }, { k: '', tone: 'blank' }, { k: '', tone: 'blank' },
    { k: 'fire', label: <Icon name="bolt" size={22} />, tone: 'action', aria: 'Fire' },
  ]

  return (
    <div className="qscreen shell-meteor" style={{ ['--accent' as string]: game.color }}>
      <header className="qhead">
        <button type="button" className="icon-btn" onClick={() => (finish(false), onExit())} aria-label="Leave game">
          <Icon name="x" />
        </button>
        <div className="qprog">
          <div className="timerbar">
            <div className="timerfill" style={{ width: `${(remaining / ((game.timeLimitSec ?? 90) * 1000)) * 100}%` }} />
          </div>
          <span className="qlabel">{Math.ceil(remaining / 1000)}s · {session.correct} destroyed</span>
        </div>
        <div className="lives" aria-label={`${Math.max(0, lives)} lives left`}>
          {Array.from({ length: LIVES }, (_, i) => (
            <Icon key={i} name="heart" size={16} className={i < lives ? 'lit' : 'lost'} />
          ))}
        </div>
      </header>

      <div className="meteor-field">
        {meteors.map((m) => (
          <div
            key={m.slotId}
            className={`meteor${m.state !== 'falling' ? ` ${m.state}` : ''}`}
            style={{
              left: `${((m.lane + 0.5) / MAX_OPEN) * 100}%`,
              ...(m.state === 'falling' ? { animation: `meteor-fall ${m.durationMs}ms linear forwards` } : { top: `${m.landedTop ?? LAND_PCT}%` }),
            }}
          >
            <Icon name="meteor" size={26} />
            <span className="meteor-q">
              <Rich text={m.item.prompt} />
            </span>
          </div>
        ))}
        <div className="base-line" style={{ top: `${LAND_PCT + 6}%` }} />
        {ended && (
          <div className="overlay">
            <div className="timeup">{ended === 'overwhelmed' ? 'Base overwhelmed!' : ended === 'time' ? "Time's up!" : 'Wave clear!'}</div>
          </div>
        )}
      </div>

      <footer className="qfoot meteor-foot">
        <div className={`fire-readout${miss ? ' miss' : ''}`}>{value || <span className="ph">Type the answer…</span>}</div>
        <Keypad keys={keys} cols={4} onPress={press} />
      </footer>
    </div>
  )
}
