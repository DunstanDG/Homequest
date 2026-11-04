/**
 * Onboarding and "what's new": the welcome tour (route /welcome), the setup checklist, the What's new sheet, the
 * release history (on the News screen) and the one banner slot at the top of Today. The rules and words live in
 * src/app/onboarding/; this file is just the screens.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp, useCalCtx, useFamily, useMe, useNow, useSyncStatus } from '@/app/context'
import { breakdownAvailable } from '@/app/breakdown'
import { dayWord, historyByWeek, NEW_FOR_DAYS, daysAgo, notesFor, unseenRecent, whatsNew, type Viewer } from '@/app/onboarding/notes'
import { RELEASES } from '@/app/onboarding/releases'
import { markSeen, snooze, updateOnboard, useOnboard, useUpdate } from '@/app/onboarding/store'
import { setupComplete, setupSteps, tourFor } from '@/app/onboarding/tour'
import { shouldAsk } from '@/app/update'
import { ymdOf } from '@/family/dates'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'

// ------------------------------------------------------------------ who's looking

/** Who is reading, for picking the notes and tour cards that apply. */
export function useViewer(): Viewer {
  const f = useFamily()
  const ctx = useCalCtx()
  const me = useMe()!
  return useMemo(() => {
    const people = Object.values(f.members).filter((m) => m.active)
    return {
      role: me.role,
      has: {
        care: people.some((m) => m.role === 'baby' || m.role === 'pet'),
        baby: people.some((m) => m.role === 'baby'),
        children: people.some((m) => m.role === 'child'),
        school: Object.keys(ctx.schools).length > 0,
      },
    }
  }, [f.members, ctx.schools, me.role])
}

function useSetup() {
  const f = useFamily()
  const ctx = useCalCtx()
  const sync = useSyncStatus()
  const { settings, demo } = useApp()
  const steps = setupSteps({
    f,
    schoolKids: Object.keys(ctx.schools).length,
    syncOn: sync.status !== 'off',
    syncSkipped: !!settings.skipSyncSetup,
    notificationsOn: typeof Notification !== 'undefined' && Notification.permission === 'granted',
    aiReady: breakdownAvailable(sync, demo),
  })
  return { steps, complete: setupComplete(steps) }
}

// ------------------------------------------------------------------ the welcome tour

/** Full-screen swipeable cards. Skip is always there; "Show me" leaves the tour where it was (Today then offers to
 * finish it). Parents end on the setup checklist. */
export function Welcome() {
  const nav = useNavigate()
  const me = useMe()!
  const v = useViewer()
  const ob = useOnboard(me.id)
  const cards = tourFor(me.role, !!v.has.care)
  const [i, setI] = useState(() => Math.min(ob.tourStep ?? 0, cards.length - 1))
  const [setup, setSetup] = useState(false)
  const track = useRef<HTMLDivElement>(null)
  const last = i === cards.length - 1
  const isParent = me.role === 'parent'

  const settle = useRef<number | undefined>(undefined)
  useEffect(() => {
    const el = track.current
    if (el && Math.round(el.scrollLeft / el.clientWidth) !== i) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
    updateOnboard(me.id, { tourStep: i })
  }, [i, me.id])

  const finish = () => {
    updateOnboard(me.id, { tourPending: false, tourDone: true, tourStep: undefined })
    nav('/', { replace: true })
  }
  const showMe = (to: string) => {
    updateOnboard(me.id, { tourPending: false, tourStep: i })
    nav(to)
  }
  // Follow a swipe: whichever card is mostly in view is the current one.
  // (Waits for the scroll to settle, so a smooth scroll started by Next/Back isn't mistaken for a swipe back.)
  const onScroll = () => {
    window.clearTimeout(settle.current)
    settle.current = window.setTimeout(() => {
      const el = track.current
      if (!el) return
      const n = Math.round(el.scrollLeft / el.clientWidth)
      if (n >= 0 && n < cards.length) setI(n)
    }, 140)
  }

  return (
    <div className="screen welcome">
      <div className="welcome-top">
        <span className="muted small">
          {i + 1} of {cards.length}
        </span>
        <button type="button" className="link-btn" onClick={finish}>
          Skip
        </button>
      </div>
      <div className="welcome-track" ref={track} onScroll={onScroll}>
        {cards.map((c) => (
          <section key={c.id} className={`welcome-card t-${c.tone}`} aria-label={c.title}>
            <span className="welcome-emoji" aria-hidden="true">
              {c.emoji}
            </span>
            <h1>{c.title}</h1>
            <p>{c.body}</p>
            {c.to && (
              <button type="button" className="btn ghost small" onClick={() => showMe(c.to!)}>
                Show me <Icon name="chevron" size={14} />
              </button>
            )}
          </section>
        ))}
      </div>
      <div className="welcome-dots" aria-hidden="true">
        {cards.map((c, k) => (
          <i key={c.id} className={k === i ? 'on' : ''} />
        ))}
      </div>
      <div className="welcome-nav">
        <button type="button" className="btn ghost" disabled={i === 0} onClick={() => setI(i - 1)}>
          Back
        </button>
        {last ? (
          isParent ? (
            <button type="button" className="btn primary" onClick={() => setSetup(true)}>
              Set things up
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={finish}>
              Let’s go
            </button>
          )
        ) : (
          <button type="button" className="btn primary" onClick={() => setI(i + 1)}>
            Next
          </button>
        )}
      </div>
      {setup && <SetupSheet onClose={finish} onGo={(to) => (updateOnboard(me.id, { tourPending: false, tourDone: true, tourStep: undefined }), nav(to))} />}
    </div>
  )
}

// ------------------------------------------------------------------ setup checklist

export function SetupSheet({ onClose, onGo }: { onClose: () => void; onGo?: (to: string) => void }) {
  const nav = useNavigate()
  const { updateSettings } = useApp()
  const { steps } = useSetup()
  const done = steps.filter((s) => s.done).length
  return (
    <Sheet open onClose={onClose} title={`Set up HomeQuest · ${done} of ${steps.length}`}>
      <ul className="ob-steps">
        {steps.map((s) => (
          <li key={s.id} className={s.done ? 'done' : ''}>
            <button
              type="button"
              disabled={s.done}
              onClick={() => {
                if (onGo) onGo(s.to)
                else {
                  onClose()
                  nav(s.to)
                }
              }}
            >
              <span className="ob-step-ic" aria-hidden="true">
                {s.done ? <Icon name="check" size={18} /> : s.emoji}
              </span>
              <span className="grow">
                <strong>
                  {s.title}
                  {s.optional && !s.done && <small className="pill">optional</small>}
                </strong>
                {!s.done && <small>{s.hint}</small>}
              </span>
              {!s.done && <Icon name="chevron" size={16} />}
            </button>
          </li>
        ))}
      </ul>
      <div className="btn-row">
        <button type="button" className="btn primary" onClick={onClose}>
          Done for now
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            updateSettings({ hideGettingStarted: true })
            onClose()
          }}
        >
          Hide the checklist
        </button>
      </div>
      <p className="note">It ticks itself off as things get set up. Bring it back any time from Parent area › Data.</p>
    </Sheet>
  )
}

// ------------------------------------------------------------------ what's new

const MAX_DETAIL = 5

export function WhatsNewSheet({ onClose }: { onClose: () => void }) {
  const nav = useNavigate()
  const me = useMe()!
  const v = useViewer()
  const today = ymdOf(useNow(60_000))
  const ob = useOnboard(me.id)
  // Freeze what was unseen when the sheet opened, so marking it seen doesn't reshuffle what's on screen.
  const [w] = useState(() => whatsNew(v, today, new Set(ob.seen)))
  const [more, setMore] = useState(false)
  const [fixes, setFixes] = useState(false)
  useEffect(() => {
    markSeen(
      me.id,
      notesFor(v, today)
        .filter((n) => daysAgo(n.date, today) < NEW_FOR_DAYS)
        .map((n) => n.id),
    )
  }, [me.id, v, today])
  const go = (to: string) => {
    onClose()
    nav(to)
  }
  const shown = more ? w.features : w.features.slice(0, MAX_DETAIL)
  return (
    <Sheet open onClose={onClose} title="What’s new">
      {!w.day ? (
        <p className="note">Nothing new right now.</p>
      ) : (
        <>
          <p className="eyebrow ob-day">New {dayWord(w.day, today)}</p>
          <ul className="ob-notes">
            {shown.map((n) => (
              <li key={n.id}>
                <span className="ob-note-emoji" aria-hidden="true">
                  {n.emoji}
                </span>
                <div className="grow">
                  <strong>{n.title}</strong>
                  {n.body && <p>{n.body}</p>}
                  {n.to && (
                    <button type="button" className="link-btn" onClick={() => go(n.to!)}>
                      Show me ›
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {w.features.length > MAX_DETAIL && !more && (
            <button type="button" className="btn ghost small block" onClick={() => setMore(true)}>
              {w.features.length - MAX_DETAIL} more
            </button>
          )}
          {w.fixes.length > 0 && (
            <div className="ob-fixes">
              <button type="button" className="link-btn" onClick={() => setFixes((x) => !x)} aria-expanded={fixes}>
                Plus {w.fixes.length} fix{w.fixes.length === 1 ? '' : 'es'} {fixes ? '▴' : '▾'}
              </button>
              {fixes && (
                <ul>
                  {w.fixes.map((n) => (
                    <li key={n.id}>{n.title}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {w.week.length > 0 && (
            <>
              <p className="eyebrow ob-day">Earlier this week</p>
              <ul className="ob-week">
                {w.week.map((l) => (
                  <li key={l.area}>
                    <span aria-hidden="true">{l.emoji}</span>
                    <span>
                      <strong>{l.label}:</strong> {l.items.join(' · ')}
                    </span>
                  </li>
                ))}
                {w.weekFixes > 0 && (
                  <li>
                    <span aria-hidden="true">🔧</span>
                    <span>
                      {w.weekFixes} smaller fix{w.weekFixes === 1 ? '' : 'es'}
                    </span>
                  </li>
                )}
              </ul>
            </>
          )}
        </>
      )}
      <button type="button" className="btn ghost block" onClick={() => go('/news')}>
        All updates
      </button>
    </Sheet>
  )
}

/** Every update, a week at a time, one line per area (for the News screen). */
export function ReleaseHistory() {
  const v = useViewer()
  const today = ymdOf(Date.now())
  const weeks = historyByWeek(v, today)
  return (
    <>
      {weeks.map((w) => (
        <article className="card" key={w.weekOf}>
          <div className="news-top">
            <strong>Week of {new Date(`${w.weekOf}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' })}</strong>
          </div>
          <ul className="ob-week">
            {w.lines.map((l) => (
              <li key={l.area}>
                <span aria-hidden="true">{l.emoji}</span>
                <span>
                  <strong>{l.label}:</strong> {l.items.join(' · ')}
                </span>
              </li>
            ))}
            {w.fixes > 0 && (
              <li>
                <span aria-hidden="true">🔧</span>
                <span>
                  {w.fixes} smaller fix{w.fixes === 1 ? '' : 'es'}
                </span>
              </li>
            )}
          </ul>
        </article>
      ))}
    </>
  )
}

// ------------------------------------------------------------------ the one banner on Today

/**
 * At most one banner, in this order: an update waiting > an unfinished tour > setup (a newcomer's first 14 days)
 * > what's new.
 * "Not now" (✕) puts a banner off until tomorrow; for What's new it counts as seen.
 */
export function TodayBanner() {
  const nav = useNavigate()
  const me = useMe()!
  const { settings } = useApp()
  const now = useNow(60_000)
  const today = ymdOf(now)
  const v = useViewer()
  const ob = useOnboard(me.id)
  const upd = useUpdate()
  const setup = useSetup()
  const [sheet, setSheet] = useState<'news' | 'setup'>()
  const unseen = unseenRecent(v, today, new Set(ob.seen))
  const tourLeft = tourFor(me.role, !!v.has.care).length - (ob.tourStep ?? 0)
  const off = (k: 'update' | 'tour' | 'setup' | 'news') => ob.snooze?.[k] === today

  let banner: { kind: 'update' | 'tour' | 'setup' | 'news'; emoji: string; title: string; sub: string; action: string; onAction: () => void } | undefined
  if (shouldAsk(upd.ready, now) && upd.apply && !off('update')) banner = { kind: 'update', emoji: '⬆️', title: 'Update ready', sub: 'Restart to get the latest. It only takes a second.', action: 'Restart', onAction: upd.apply }
  else if (!ob.tourDone && !ob.tourPending && ob.tourStep !== undefined && !off('tour'))
    banner = { kind: 'tour', emoji: '👋', title: 'Finish the tour', sub: `${tourLeft} card${tourLeft === 1 ? '' : 's'} left`, action: 'Continue', onAction: () => nav('/welcome') }
  else if (me.role === 'parent' && ob.newcomer && !settings.hideGettingStarted && !setup.complete && now - ob.firstSeen < 14 * 86_400_000 && !off('setup')) {
    const done = setup.steps.filter((s) => s.done).length
    banner = { kind: 'setup', emoji: '🧰', title: 'Set up HomeQuest', sub: `${done} of ${setup.steps.length} done`, action: 'Open', onAction: () => setSheet('setup') }
  } else if (unseen.length && !off('news')) {
    const day = unseen[0]!.date
    const ofDay = unseen.filter((n) => n.date === day && !n.fix).length || unseen.filter((n) => n.date === day).length
    banner = { kind: 'news', emoji: '✨', title: `New ${dayWord(day, today)}`, sub: `${ofDay} thing${ofDay === 1 ? '' : 's'}${unseen.some((n) => n.date !== day) ? ', and more this week' : ''}`, action: 'See what’s new', onAction: () => setSheet('news') }
  }

  return (
    <>
      {banner && (
        <div className={`ob-banner k-${banner.kind}`} role="status">
          <button type="button" className="ob-banner-main" onClick={banner.onAction}>
            <span className="ob-banner-emoji" aria-hidden="true">
              {banner.emoji}
            </span>
            <span className="grow">
              <strong>{banner.title}</strong>
              <small>{banner.sub}</small>
            </span>
            <span className="ob-banner-action">{banner.action}</span>
          </button>
          <button
            type="button"
            className="ob-banner-x"
            aria-label="Not now"
            onClick={() => (banner!.kind === 'news' ? markSeen(me.id, unseen.map((n) => n.id)) : snooze(me.id, banner!.kind, today))}
          >
            <Icon name="x" size={16} />
          </button>
        </div>
      )}
      {sheet === 'news' && <WhatsNewSheet onClose={() => setSheet(undefined)} />}
      {sheet === 'setup' && <SetupSheet onClose={() => setSheet(undefined)} />}
    </>
  )
}

/** The links in Parent area › Data: run the tour again, and the history. */
export function OnboardingLinks() {
  const nav = useNavigate()
  const me = useMe()!
  const [setup, setSetup] = useState(false)
  return (
    <>
      <div className="btn-row">
        <button
          type="button"
          className="btn small"
          onClick={() => {
            updateOnboard(me.id, { tourPending: true, tourDone: false, tourStep: 0 })
            nav('/welcome')
          }}
        >
          👋 Welcome tour
        </button>
        {me.role === 'parent' && (
          <button type="button" className="btn small" onClick={() => setSetup(true)}>
            🧰 Setup checklist
          </button>
        )}
        <Link to="/news" className="btn small">
          ✨ All updates
        </Link>
      </div>
      {setup && <SetupSheet onClose={() => setSetup(false)} />}
    </>
  )
}

/** Release notes used to seed a new person's "seen" list. */
export const ALL_NOTE_IDS = RELEASES.map((r) => r.id)
