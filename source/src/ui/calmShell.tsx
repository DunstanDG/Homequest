/**
 * The calm shell (0.18, see docs/calm/C-access.md), mounted once in App.tsx:
 *   - applies this phone's comfort settings app-wide (classes on <html>, styled at the end of styles.css);
 *   - the "🌿 Calm" button (in the tab bar, or a small corner button on full-screen pages) and its sheet: a breather,
 *     "just one thing today", pausing questions and reminders, and letting a grown-up (or the family) know;
 *   - gentle banners at the top: someone would like some help (on parents' phones), "Sam is on it", and the visual
 *     transition warning ("10 minutes until we leave for School").
 * Also the calm countdown parts used by the timers and the session screen: `DrainBar` and `untilLabel`.
 */
import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { CALM_CLASSES, calmClasses, endOfToday, motionOk, parseCalmOverride, useCalm } from '@/app/calm'
import { useApp, useCalCtx, useFamily, useMe, useNow } from '@/app/context'
import { calmPauseOf, endCalmPause, helpOnIt, helpRequests, pauseCalm } from '@/family/calmPause'
import { hmOf } from '@/family/dates'
import { drainOf, nextTransition, stageOf, transitionText } from '@/family/transitions'
import type { FamilyState, Member, MemberId } from '@/family/types'
import { Icon } from './icons'
import { Sheet } from './primitives'

// ------------------------------------------------------------------ calm countdown parts

/** "until 17:20", to the nearest minute. */
export const untilLabel = (endMs: number): string => `until ${hmOf(Math.round(endMs / 60_000) * 60_000)}`

/** A calm bar that slowly drains (1 = full). `smoothMs` is how often it is updated, so it glides between updates. */
export function DrainBar({ value, smoothMs = 1000 }: { value: number; smoothMs?: number }) {
  const v = Math.min(1, Math.max(0, value))
  return (
    <span className="calm-drain" aria-hidden="true">
      <i style={{ width: `${Math.round(v * 1000) / 10}%`, transitionDuration: `${smoothMs}ms` }} />
    </span>
  )
}

// ------------------------------------------------------------------ the sheet's open state (shared by the buttons)

let sheetOpen = false
const sheetSubs = new Set<() => void>()
const setSheet = (v: boolean) => {
  sheetOpen = v
  sheetSubs.forEach((f) => f())
}
/** Open the Calm sheet from anywhere. */
export const openCalmSheet = () => setSheet(true)
const useSheetOpen = () =>
  useSyncExternalStore(
    (cb) => {
      sheetSubs.add(cb)
      return () => void sheetSubs.delete(cb)
    },
    () => sheetOpen,
  )

// ------------------------------------------------------------------ banners dismissed on this phone

const DISMISS_KEY = 'hq-calm-dismissed'
const readDismissed = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(DISMISS_KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}
function useDismissed(): [Set<string>, (key: string) => void] {
  const [list, setList] = useState<string[]>(readDismissed)
  const dismiss = (key: string) =>
    setList((prev) => {
      const next = [...prev.filter((k) => k !== key), key].slice(-40)
      try {
        localStorage.setItem(DISMISS_KEY, JSON.stringify(next))
      } catch {
        /* private mode: dismissed for this visit only */
      }
      return next
    })
  return [new Set(list), dismiss]
}

// ------------------------------------------------------------------ the shell

/** Full-screen pages with no room for the corner button (games and the welcome tour). */
const NO_CORNER = ['/play', '/spelling/play', '/welcome', '/dev']

export function CalmShell({ tabs }: { tabs: boolean }) {
  const calm = useCalm()
  const { demo, act } = useApp()
  const f = useFamily()

  // Classes on <html>, before paint so nothing jumps.
  const classes = calmClasses(calm).join(' ')
  useLayoutEffect(() => {
    const el = document.documentElement
    const want = classes.split(' ')
    for (const k of CALM_CLASSES) el.classList.toggle(k, want.includes(k))
  }, [classes])
  useEffect(() => {
    if (calm.font === 'readable') void import('./calmFont').then((m) => m.loadReadableFont())
  }, [calm.font])
  // Demo and testing only: ?demo=1&calm=larger,readable (see parseCalmOverride); `askhelp` has the first child ask for
  // help, to preview the grown-ups' banner.
  useEffect(() => {
    const q = demo ? new URLSearchParams(location.search).get('calm') : null
    if (!q) return
    calm.set(parseCalmOverride(q))
    const kid = /askhelp/.test(q) ? Object.values(f.members).find((m) => m.role === 'child' && m.active) : undefined
    if (kid) act(pauseCalm(kid.id, f, kid.id, endOfToday(), { askHelp: true }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo])

  return (
    <>
      <CalmBanners />
      <CalmButton tabs={tabs} />
      <CalmSheet />
    </>
  )
}

/** "🌿 Calm": the last item of the tab bar (shown first), or a small corner button on full-screen pages. */
function CalmButton({ tabs }: { tabs: boolean }) {
  const { pathname } = useLocation()
  const [bar, setBar] = useState<Element | null>(null)
  useEffect(() => setBar(tabs ? document.querySelector('nav.tabbar') : null), [tabs, pathname])
  useEffect(() => {
    // Leave room under the corner button so it never sits on the end of a page.
    const corner = !tabs && !NO_CORNER.some((p) => pathname === p || pathname.startsWith(`${p}/`))
    document.documentElement.classList.toggle('calm-corner-on', corner)
    return () => document.documentElement.classList.remove('calm-corner-on')
  }, [tabs, pathname])
  const btn = (where: 'bar' | 'corner') => (
    <button type="button" className={`calm-pill calm-ui ${where}`} onClick={openCalmSheet} aria-haspopup="dialog" aria-label="Calm: a breather, or a quieter day">
      <span className="calm-pill-emoji" aria-hidden="true">
        🌿
      </span>
      {where === 'bar' && <span className="calm-pill-label">Calm</span>}
    </button>
  )
  if (tabs) return bar ? createPortal(btn('bar'), bar) : null
  if (NO_CORNER.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null
  return btn('corner')
}

const firstName = (m: Member | undefined) => m?.name ?? 'Someone'
const joinNames = (names: string[]): string => (names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`)
const grownUps = (f: FamilyState, me: MemberId): Member[] => Object.values(f.members).filter((m) => m.active && m.role === 'parent' && m.id !== me)

/** The gentle banners at the top of every page. A polite live region, so screen readers mention them without interrupting. */
function CalmBanners() {
  const f = useFamily()
  const me = useMe()
  const { act } = useApp()
  const calm = useCalm()
  const ctx = useCalCtx()
  const now = useNow(15_000)
  const [dismissed, dismiss] = useDismissed()
  const [shownStage, setShownStage] = useState<Record<string, true>>({})
  if (!me) return <div className="calm-banners" aria-live="polite" />

  // Someone would like a calm moment and some help: on the grown-ups' phones.
  const asks = me.role === 'parent' ? helpRequests(f, now, me.id).filter((r) => !dismissed.has(r.pause.ev.id)) : []
  // "Sam is on it", back on the phone of whoever asked (for a couple of hours).
  const mine = calmPauseOf(f, me.id, now)
  const onIt = mine && !mine.askHelp && mine.helper && mine.helper !== me.id && now - mine.ts < 2 * 3600_000 && !dismissed.has(mine.ev.id) ? mine : undefined
  // The next change in the day, at 10, 5 and 1 minutes.
  const t = nextTransition(ctx, me.id, now)
  const stage = t ? stageOf(t, now) : undefined
  const tKey = t && stage ? `${t.key}:${stage}` : undefined
  const showT = t && tKey && !shownStage[tKey]

  return (
    <div className="calm-banners calm-ui" aria-live="polite">
      {asks.map((r) => (
        <div key={r.pause.ev.id} className="calm-banner help">
          <span className="calm-banner-emoji" aria-hidden="true">
            🌿
          </span>
          <div className="calm-banner-text">
            <strong>{firstName(f.members[r.memberId])} would like a calm moment and some help 💚</strong>
            <small>Since {hmOf(r.pause.ts)}. No rush, just a gentle check-in.</small>
            <span className="calm-banner-btns">
              <button type="button" className="btn small primary" onClick={() => act(helpOnIt(me.id, f, r.memberId))}>
                I'm on it
              </button>
            </span>
          </div>
          <button type="button" className="icon-btn calm-x" aria-label="Dismiss" onClick={() => dismiss(r.pause.ev.id)}>
            <Icon name="x" size={18} />
          </button>
        </div>
      ))}
      {onIt && (
        <div className="calm-banner help">
          <span className="calm-banner-emoji" aria-hidden="true">
            💚
          </span>
          <div className="calm-banner-text">
            <strong>{firstName(f.members[onIt.helper!])} is on it</strong>
            <small>They saw your message. Take your time.</small>
          </div>
          <button type="button" className="icon-btn calm-x" aria-label="Dismiss" onClick={() => dismiss(onIt.ev.id)}>
            <Icon name="x" size={18} />
          </button>
        </div>
      )}
      {showT && (
        <div className="calm-banner transition">
          <span className="calm-banner-emoji" aria-hidden="true">
            {t.kind === 'leave' ? '🎒' : '🕒'}
          </span>
          <div className="calm-banner-text">
            <strong>{transitionText(t, now, calm.hideCountdowns)}</strong>
            <small>{t.kind === 'leave' ? `Leave by ${hmOf(t.at)}` : `Starts at ${hmOf(t.at)}`}</small>
            <DrainBar value={drainOf(t, now)} smoothMs={15_000} />
          </div>
          <button type="button" className="icon-btn calm-x" aria-label="Dismiss" onClick={() => setShownStage((s) => ({ ...s, [tKey]: true }))}>
            <Icon name="x" size={18} />
          </button>
        </div>
      )}
    </div>
  )
}

// ------------------------------------------------------------------ the sheet

function CalmSheet() {
  const open = useSheetOpen()
  const [view, setView] = useState<'menu' | 'breathe'>('menu')
  const close = () => {
    setSheet(false)
    setView('menu')
  }
  return (
    <Sheet open={open} onClose={close} title={view === 'breathe' ? 'Take a breather' : 'A calm moment'}>
      <div className="calm-ui">{view === 'breathe' ? <Breather onDone={() => setView('menu')} /> : <CalmMenu onBreathe={() => setView('breathe')} onClose={close} />}</div>
    </Sheet>
  )
}

function CalmMenu({ onBreathe, onClose }: { onBreathe(): void; onClose(): void }) {
  const f = useFamily()
  const me = useMe()
  const nav = useNavigate()
  const { act, toast } = useApp()
  const calm = useCalm()
  const now = useNow(60_000)
  if (!me) return null
  const child = me.role === 'child'
  const synced = calmPauseOf(f, me.id, now)
  const anything = calm.paused || !!synced
  const adults = grownUps(f, me.id)
  const names = joinNames(adults.map((m) => m.name))

  const oneThing = () => {
    calm.pause()
    toast('Today will show just one thing. 💚')
    onClose()
  }
  const pauseAll = () => {
    act(pauseCalm(me.id, f, me.id, endOfToday(), {}))
    toast('Questions and reminders can wait until tomorrow.')
    onClose()
  }
  const askHelp = () => {
    act(pauseCalm(me.id, f, me.id, endOfToday(), { askHelp: true }))
    toast(names ? `We've let ${names} know. 💚` : `We've let the family know. 💚`)
    onClose()
  }
  const backToNormal = () => {
    calm.resume()
    act(endCalmPause(me.id, f, me.id))
    toast('Back to normal. Nice and steady.')
    onClose()
  }

  return (
    <>
      <p className="muted calm-intro">It's OK to feel like this. Pick whatever helps, or just close this.</p>
      {anything && (
        <div className="calm-status">
          <strong>Calm mode is on until the end of today</strong>
          <small className="muted">
            {[calm.paused ? 'Today shows one thing' : '', synced ? 'questions and reminders are waiting' : '', synced?.askHelp ? `${names || 'the family'} can see you asked for help` : ''].filter(Boolean).join(', ')}
            .
          </small>
        </div>
      )}
      <div className="calm-options">
        <CalmOption emoji="🌬️" title="Take a breather" sub="One slow minute of breathing" onClick={onBreathe} />
        <CalmOption emoji="☝️" title="Just show me one thing today" sub="Today shows only the next thing to do" on={calm.paused} onClick={oneThing} />
        <CalmOption emoji="🔕" title="Pause questions and reminders for today" sub="Nothing new asks you anything until tomorrow" on={!!synced} onClick={pauseAll} />
        <CalmOption
          emoji="💚"
          title={child ? 'Let a grown-up know' : 'Let the family know'}
          sub={synced?.askHelp ? 'Sent. They can see it.' : names ? `${names} will see a gentle message` : 'They will see a gentle message'}
          on={!!synced?.askHelp}
          onClick={askHelp}
        />
        {anything && <CalmOption emoji="🌤️" title="Back to normal" sub="Everything as usual again" onClick={backToNormal} />}
      </div>
      <button
        type="button"
        className="btn ghost block calm-settings-link"
        onClick={() => {
          onClose()
          nav('/settings/calm')
        }}
      >
        <Icon name="settings" size={18} /> Comfort and accessibility settings
      </button>
    </>
  )
}

function CalmOption({ emoji, title, sub, on, onClick }: { emoji: string; title: string; sub: string; on?: boolean; onClick(): void }) {
  return (
    <button type="button" className={`calm-option${on ? ' on' : ''}`} onClick={onClick} aria-pressed={on === undefined ? undefined : on}>
      <span className="calm-option-emoji" aria-hidden="true">
        {emoji}
      </span>
      <span className="calm-option-text">
        <strong>{title}</strong>
        <small>{sub}</small>
      </span>
      {on && <Icon name="check" size={18} aria-hidden="true" />}
    </button>
  )
}

/** One minute of paced breathing: in for 4, out for 6, six times. A growing and shrinking circle, or (when motion
 * isn't OK) the same steps written down, with the current one highlighted. */
export function Breather({ onDone }: { onDone(): void }) {
  const calm = useCalm()
  const moving = motionOk(calm)
  const [start, setStart] = useState(() => Date.now())
  const now = useNow(250)
  const t = Math.max(0, (now - start) / 1000)
  const finished = t >= 60
  const phase: 'in' | 'out' = t % 10 < 4 ? 'in' : 'out'
  const breath = Math.min(6, Math.floor(t / 10) + 1)
  if (finished) {
    return (
      <div className="calm-breathe done">
        <p className="calm-breathe-word">That was one calm minute 💚</p>
        <p className="muted">Notice how you feel now. You can do another, or carry on when you're ready.</p>
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => setStart(Date.now())}>
            Another minute
          </button>
          <button type="button" className="btn primary" onClick={onDone}>
            Done
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="calm-breathe">
      {moving ? (
        <div className="calm-breathe-stage" aria-hidden="true">
          <span key={start} className="calm-breathe-circle" />
        </div>
      ) : (
        <ol className="calm-breathe-steps">
          <li className={phase === 'in' ? 'now' : ''}>Breathe in slowly through your nose, counting to 4.</li>
          <li className={phase === 'out' ? 'now' : ''}>Breathe out gently through your mouth, counting to 6.</li>
          <li>Do this six times. There's no rush.</li>
        </ol>
      )}
      <p className="calm-breathe-word" aria-live="polite">
        {phase === 'in' ? 'Breathe in…' : '…and slowly out'}
      </p>
      <p className="calm-breathe-dots" aria-label={`Breath ${breath} of 6`}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <i key={i} className={i < breath ? 'done' : i === breath ? 'now' : ''} />
        ))}
      </p>
      <button type="button" className="btn ghost block" onClick={onDone}>
        Stop
      </button>
    </div>
  )
}
