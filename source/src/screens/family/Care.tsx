import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import * as A from '@/family/actions'
import { expectedBabies, bornBabies } from '@/family/arrival/arrival'
import { notifyTypeOn, useApp, useFamily, useMe, useNow } from '@/app/context'
import { activeFeedRunFor, looksAfterOf, babyLast24h, babyLogs, babySummaryText, babyWeek, milkAges, describeBaby, lastBaby, loggedBy, petDay, petLogs, recentDuplicate, suggestMeal, timeOf } from '@/family/care'
import {
  ageDays,
  doseLock,
  feedDurationHint,
  isAnomalousNappyColour,
  liveMedRules,
  LONG_SLEEP_MIN,
  nextDoseAt,
  nextFeedReminderAt,
  MAX_SLEEP_MIN,
  overlappingSleep,
  sleepDurationHint,
  sleepSpan,
  totalMilkMl,
} from '@/family/care'
import { careRecipients, feedReminderTag, sleepReminderTag } from '@/family/notify'
import { cancelNotificationFor, scheduleNotificationFor } from '@/app/push'
import { mealLock, needsReorder, treatmentDue, currentStock, vetHistory } from '@/family/dog'
import * as CA from '@/family/careActions'
import { FeedRunBanner, DueBanner } from './careWidgets'
import { BabyDaySheet, BabyNowCard, NightToggle, PetNowCard, useNightMode, withDayBreaks } from './careNow'
import { ShiftCard, TimetableCard } from './careShifts'
import { PlantsPanel } from './carePlants'
import { livePlants } from '@/family/plants'
import { addDays, ago, dayName, fmtDuration, hmOf, tsOf, ymdOf } from '@/family/dates'
import { activeTimers, elapsedMs } from '@/family/timers'
import type { AppEvent } from '@/engine/types'
import type { BabyEvent, Member, NappyColour, PetEvent, PetKind } from '@/family/types'
import { Avatar, SectionHead, Seg } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'
import { MiniTimer } from '@/ui/timers'
import { copyText } from '@/ui/util'

/** The Plants tab's id among the baby and pet tabs. */
const PLANTS = 'plants'

/** When did it happen? "Now" unless a parent is logging something a bit late - possibly an earlier day
 * entirely (atDate), not just an earlier time today (at). */
function useWhen(initialAgo = 0) {
  const [agoMin, setAgo] = useState(initialAgo)
  const [at, setAt] = useState('')
  const [atDate, setAtDate] = useState('')
  const resolve = (): number => {
    const now = Date.now()
    if (atDate) return Math.min(tsOf(atDate, at || hmOf(now)), now)
    if (at) {
      const t = tsOf(ymdOf(now), at)
      return t > now ? t - 86_400_000 : t
    }
    return now - agoMin * 60_000
  }
  const reset = () => (setAgo(0), setAt(''), setAtDate(''))
  const late = agoMin > 0 || !!at || !!atDate
  return { agoMin, setAgo, at, setAt, atDate, setAtDate, resolve, reset, late }
}

const NEAR_PRESETS: [number, string][] = [
  [0, 'Now'],
  [5, '5 min ago'],
  [15, '15 min'],
  [30, '30 min'],
  [60, '1 hour'],
]
/** A sleep is usually logged longer after the fact than a feed or a nappy. */
const SLEEP_PRESETS: [number, string][] = [
  [30, '30 min ago'],
  [60, '1 hour'],
  [120, '2 hours'],
  [180, '3 hours'],
  [240, '4 hours'],
]

function WhenChips({ w, label = 'When:', presets = NEAR_PRESETS }: { w: ReturnType<typeof useWhen>; label?: string; presets?: [number, string][] }) {
  const today = ymdOf(Date.now())
  return (
    <div className="when-row">
      <span className="note">{label}</span>
      <div className="chips small-gap">
        {presets.map(([m, text]) => (
          <button
            key={String(m)}
            type="button"
            className={`chip small${!w.at && !w.atDate && w.agoMin === m ? ' selected' : ''}`}
            onClick={() => {
              w.setAgo(m)
              w.setAt('')
              w.setAtDate('')
            }}
          >
            {text}
          </button>
        ))}
        <button
          type="button"
          className={`chip small${w.atDate === addDays(today, -1) ? ' selected' : ''}`}
          onClick={() => {
            w.setAtDate(addDays(today, -1))
            w.setAgo(0)
          }}
        >
          Yesterday
        </button>
        <input
          type="date"
          className="tbox slim"
          aria-label="On a specific date"
          max={today}
          value={w.atDate}
          onChange={(e) => {
            w.setAtDate(e.target.value)
            w.setAgo(0)
          }}
        />
        <input
          type="time"
          className="tbox slim"
          aria-label="At a specific time"
          value={w.at}
          onChange={(e) => {
            w.setAt(e.target.value)
            w.setAgo(0)
          }}
        />
      </div>
    </div>
  )
}

export function Care() {
  const f = useFamily()
  const now = useNow(60_000)
  const [params, setParams] = useSearchParams()
  const me = useMe()!
  // Children see only what they help look after (People › edit child › Looks after); adults see everything.
  const duties = looksAfterOf(me)
  const babies = duties.has('baby') ? bornBabies(f) : []
  const pets = duties.has('pets') ? Object.values(f.members).filter((m) => m.active && m.role === 'pet') : []
  const subjects = [...babies, ...pets]
  const plantsOn = duties.has('plants')
  // Plants are one more tab after the baby and pets (the only one when there are neither). `?s=plants` opens it.
  const [selState, setSel] = useState<string | undefined>(params.get('s') ?? subjects[0]?.id ?? PLANTS)
  const sel = (selState === PLANTS && plantsOn) || subjects.some((s) => s.id === selState) ? selState : (subjects[0]?.id ?? (plantsOn ? PLANTS : undefined))
  const cur = sel === PLANTS ? undefined : subjects.find((s) => s.id === sel)
  const pick = (id: string) => {
    setSel(id)
    if (params.get('s')) setParams({}, { replace: true })
  }
  const nav = useNavigate()
  const nm = useNightMode(now)
  // The two-week plan is for the first fortnight (or before the birth): after that it's just a link at the bottom.
  const curDays = cur?.role === 'baby' ? ageDays(cur, now) : undefined
  const earlyDays = expectedBabies(f).length > 0 || (curDays != null && curDays <= 14)
  const plantCount = livePlants(f).length
  return (
    <div className={`screen care${nm.night ? ' night' : ''}`}>
      <header className="screen-head">
        <div className="sh-title">
          <p className="eyebrow">Care</p>
          <h1>{cur ? cur.name : sel === PLANTS ? 'Plants' : 'Care'}</h1>
        </div>
        {subjects.length > 0 && (
          <div className="head-actions">
            <NightToggle night={nm.night} setting={nm.setting} onCycle={nm.cycle} />
          </div>
        )}
      </header>
      {subjects.length > 0 && (
        <div className="chips">
          {subjects.map((s) => (
            <button key={s.id} type="button" className={`chip with-avatar${cur?.id === s.id ? ' selected' : ''}`} onClick={() => pick(s.id)}>
              <Avatar m={s} size={24} /> {s.name}
            </button>
          ))}
          {plantsOn && (
            <button type="button" className={`chip with-avatar${sel === PLANTS ? ' selected' : ''}`} onClick={() => pick(PLANTS)}>
              <span className="chip-emoji" aria-hidden="true">
                🪴
              </span>{' '}
              Plants{plantCount ? '' : ' +'}
            </button>
          )}
        </div>
      )}
      {earlyDays && cur?.role === 'baby' && (
        <Link to="/baby" className="slim-link">
          <Icon name="heart" size={16} /> The first two weeks <Icon name="chevron" size={14} />
        </Link>
      )}
      {cur?.role === 'baby' && <BabyPanel baby={cur} />}
      {cur?.role === 'pet' && <PetPanel pet={cur} />}
      {sel === PLANTS && <PlantsPanel />}
      {!sel && <p className="note">Nothing to look after here yet. A grown-up can choose what you help with: the dog, the plants or the baby.</p>}
      {sel === PLANTS && subjects.length === 0 && me.role === 'parent' && (
        <p className="note">
          A baby or a pet to look after too? Add them in{' '}
          <button type="button" className="link-btn" onClick={() => nav('/parent?tab=family')}>
            Parent area › Family
          </button>
          .
        </p>
      )}
      {(babies.length > 0 || expectedBabies(f).length > 0) && !earlyDays && cur?.role === 'baby' && (
        <Link to="/baby" className="link-btn wide muted small">
          New-baby plan and first-two-weeks ideas
        </Link>
      )}
      {expectedBabies(f).length > 0 && babies.length === 0 && (
        <Link to="/baby" className="slim-link">
          <Icon name="heart" size={16} /> New-baby plan <Icon name="chevron" size={14} />
        </Link>
      )}
    </div>
  )
}

// ==================================================================== BABY

type BabySheetKind = 'feed' | 'solid' | 'health' | 'growth' | 'note'
type FeedMode = 'breast' | 'bottle' | 'pump'

function BabyPanel({ baby }: { baby: Member }) {
  const { act, toast, sync, settings } = useApp()
  const f = useFamily()
  const me = useMe()!
  const nav = useNavigate()
  const now = useNow(20_000)
  const today = ymdOf(now)
  const when = useWhen()
  const [sheet, setSheet] = useState<{ kind: BabySheetKind; mode?: FeedMode } | undefined>()
  const [dayOpen, setDayOpen] = useState<string | undefined>()
  const [pumpStop, setPumpStop] = useState<{ feedRunId: string; startedTs: number; minutes: number; side: 'L' | 'R' | 'both' } | undefined>()
  const logs = babyLogs(f, baby.id)
  const lf = lastBaby(f, baby.id, 'feed')
  const timers = activeTimers(f, { subjectId: baby.id })
  const sleeping = timers.find((t) => t.purpose === 'sleep')
  const week = babyWeek(f, baby.id, today, 7)
  const last24 = babyLast24h(f, baby.id, now)
  const [copied, setCopied] = useState(false)
  const noMedRules = Object.keys(f.medRules).length === 0
  useEffect(() => {
    if (noMedRules) act(CA.seedMedRules(me.id, f))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noMedRules])
  const lastSleep = logs.find((l) => l.kind === 'sleep' && l.endAt != null)
  const seenSleepId = useRef<string | undefined>(lastSleep?.id)
  useEffect(() => {
    if (!lastSleep?.endAt || lastSleep.id === seenSleepId.current) return
    seenSleepId.current = lastSleep.id
    const minutes = Math.round((lastSleep.endAt - lastSleep.at) / 60_000)
    const hint = sleepDurationHint(minutes)
    if (hint === 'short') toast(`That nap was under 10 minutes — sometimes it takes another go to properly settle.`)
    else if (hint === 'long') toast(`That was a long one (${fmtDuration(minutes)}) — worth a peek if it's unusual for them.`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSleep?.id])

  const log = (evs: AppEvent[], msg: string) => {
    act(evs)
    when.reset()
    toast(msg, { undo: () => act(evs.flatMap((e) => A.undo(me.id, e.id))) })
    const fed = evs.find((e) => e.type === 'baby' && e.kind === 'feed')
    if (fed && fed.type === 'baby') void scheduleFeedReminder(fed.at)
  }
  /** Reschedule (or, if the type is switched off, cancel) the "next feed expected" reminder for this baby -
   * called whenever a feed is logged, same tag each time so it supersedes rather than piling up. */
  const scheduleFeedReminder = async (feedAt: number) => {
    const tag = feedReminderTag(baby.id)
    if (!notifyTypeOn(settings, 'feeds')) return cancelNotificationFor(sync, tag)
    const fireAt = nextFeedReminderAt(ageDays(baby, feedAt), feedAt)
    if (!fireAt) return cancelNotificationFor(sync, tag)
    await scheduleNotificationFor(sync, careRecipients(f), { fireAt, title: `${baby.name}: feed due soon`, body: `It's been about the usual gap since the last feed.`, tag })
  }
  const [nappyOpen, setNappyOpen] = useState(false)
  const [sleepOpen, setSleepOpen] = useState(false)
  const nappy = (wet: boolean, dirty: boolean, colour?: NappyColour) => {
    log(
      A.logBaby(me.id, { babyId: baby.id, kind: 'nappy', at: when.resolve(), nappy: { wet, dirty, colour } }),
      wet && dirty ? 'Wet and dirty nappy logged.' : dirty ? 'Dirty nappy logged.' : 'Wet nappy logged.',
    )
    setNappyOpen(false)
  }
  const startSleep = () => {
    const { events, timerId } = A.startTimer(me.id, { memberId: me.id, label: `${baby.name} sleeping`, purpose: 'sleep', subjectId: baby.id })
    act(events)
    toast('Sleep timer started. Tap Awake when they wake up.')
    if (notifyTypeOn(settings, 'sleep')) {
      void scheduleNotificationFor(sync, careRecipients(f), {
        fireAt: Date.now() + LONG_SLEEP_MIN * 60_000,
        title: `${baby.name}: still asleep`,
        body: `That's a long one — worth a check-in?`,
        tag: sleepReminderTag(timerId),
      })
    }
  }
  const wakeUp = () => {
    if (!sleeping) return
    act(A.finishTimer(me.id, f, sleeping.id, elapsedMs(sleeping, Date.now())))
    void cancelNotificationFor(sync, sleepReminderTag(sleeping.id))
    toast('Sleep logged.')
  }
  const run = activeFeedRunFor(f, baby.id, now)
  const startRun = (mode: 'breast' | 'pump', side: 'L' | 'R') => {
    if (run && run.method !== 'bottle') {
      toast(run.method === 'pump' ? 'Finish the pumping session first.' : 'A feed is already running.')
      return setSheet(undefined)
    }
    act(CA.startFeedRun(me.id, baby.id, mode, { side }).events)
    setSheet(undefined)
  }
  const stopFeed = (feedRunId: string, opts: { minutes: number; side: 'L' | 'R' | 'both'; activeSec: number; startedTs: number; method: 'breast' | 'bottle' | 'pump' }) => {
    if (opts.method === 'pump') return setPumpStop({ feedRunId, startedTs: opts.startedTs, minutes: opts.minutes, side: opts.side })
    act(CA.stopFeedRun(me.id, f, feedRunId, { minutes: opts.minutes, side: opts.side, babyId: baby.id, method: 'breast', startedTs: opts.startedTs }))
    const hint = feedDurationHint(opts.activeSec, ageDays(baby, now) ?? null)
    toast(
      hint === 'short'
        ? `Feed logged: ${opts.minutes} min. That was a short one — worth another try if they still seem hungry?`
        : hint === 'long'
          ? `Feed logged: ${opts.minutes} min. That ran long — everything OK?`
          : `Feed logged: ${opts.minutes} min.`,
    )
    void scheduleFeedReminder(Date.now())
  }

  // One-tap repeats of the last feed: the same bottle again, or the other side.
  const lastBottle = logs.find((l) => l.kind === 'feed' && l.feed?.method === 'bottle' && l.feed.ml)
  const nextSide: 'L' | 'R' = lf?.feed?.method === 'breast' && lf.feed.side === 'L' ? 'R' : 'L'
  const stock = totalMilkMl(f, baby.id)
  const repeats: { label: string; run: () => void }[] = []
  if (!run && lf?.feed?.method === 'breast') repeats.push({ label: `Start ${nextSide === 'L' ? 'left' : 'right'} side`, run: () => startRun('breast', nextSide) })
  if (lastBottle?.feed?.ml) {
    const b = lastBottle.feed
    const short = b.milk === 'expressed' && stock < (b.ml ?? 0)
    if (!short)
      repeats.push({
        label: `Bottle ${b.ml} ml${b.milk === 'expressed' ? ' expressed' : b.milk === 'formula' ? ' formula' : ''} again`,
        run: () => {
          const evs = A.logBaby(me.id, { babyId: baby.id, kind: 'feed', at: Date.now(), feed: { method: 'bottle', ml: b.ml, milk: b.milk } })
          const deduct = b.milk === 'expressed' && b.ml ? CA.deductMilk(me.id, f, baby.id, b.ml, evs[0]!.id) : []
          log([...evs, ...deduct], `Bottle ${b.ml} ml logged.`)
        },
      })
  }
  if (lf?.feed?.method === 'breast' && !lastBottle) {
    /* nothing else to repeat */
  }
  const feedSub = run
    ? run.method === 'pump'
      ? 'pumping…'
      : 'feeding…'
    : lf?.feed?.method === 'bottle'
      ? `last: bottle${lf.feed.ml ? ` ${lf.feed.ml} ml` : ''}`
      : lf?.feed?.method === 'breast'
        ? `next: ${nextSide === 'L' ? 'left' : 'right'}`
        : 'breast · bottle · pump'

  return (
    <>
      <FeedRunBanner baby={baby} onStop={stopFeed} />
      {timers.filter((t) => t.purpose !== 'sleep').length > 0 && (
        <div className="stack-gap">
          {timers
            .filter((t) => t.purpose !== 'sleep')
            .map((t) => (
              <MiniTimer key={t.id} timer={t} />
            ))}
        </div>
      )}
      <BabyNowCard baby={baby} sleepingSince={sleeping ? sleeping.segments[0]?.from : undefined} onOpenDay={setDayOpen} />

      <div className="care-pad" role="group" aria-label="Log">
        <button type="button" className="pad-big tone-d" onClick={() => setSheet({ kind: 'feed' })}>
          <span className="pad-emoji">🍼</span>
          <strong>Feed</strong>
          <small>{feedSub}</small>
        </button>
        <button type="button" className="pad-big tone-a" onClick={() => setNappyOpen(true)}>
          <span className="pad-emoji">💧</span>
          <strong>Nappy</strong>
          <small>wet · dirty · both</small>
        </button>
        {sleeping ? (
          <button type="button" className="pad-big tone-c on" onClick={wakeUp}>
            <span className="pad-emoji">⏰</span>
            <strong>Awake</strong>
            <small>asleep {fmtDuration(Math.max(0, Math.round(elapsedMs(sleeping, now) / 60_000)))}</small>
          </button>
        ) : (
          <button type="button" className="pad-big tone-c" onClick={() => setSleepOpen(true)}>
            <span className="pad-emoji">😴</span>
            <strong>Sleep</strong>
            <small>timer or log</small>
          </button>
        )}
      </div>
      <div className="care-pad-small" role="group" aria-label="More">
        <button type="button" onClick={() => setSheet({ kind: 'solid' })}>
          <span>🥣</span>Solids
        </button>
        <button type="button" onClick={() => setSheet({ kind: 'health' })}>
          <span>💊</span>Medicine
        </button>
        <button type="button" onClick={() => setSheet({ kind: 'growth' })}>
          <span>⚖️</span>Weight
        </button>
        <button type="button" onClick={() => setSheet({ kind: 'note' })}>
          <span>📝</span>Note
        </button>
        {me.role === 'parent' && (
          <button type="button" onClick={() => nav('/vault')}>
            <span>🛡️</span>Vault
          </button>
        )}
      </div>
      {repeats.length > 0 && (
        <div className="chips repeat-chips">
          {repeats.map((r) => (
            <button key={r.label} type="button" className="chip small" onClick={r.run}>
              ↻ {r.label}
            </button>
          ))}
        </div>
      )}

      <SectionHead title="Last 24 hours" />
      <LogList logs={last24} empty="Nothing logged in the last 24 hours." />

      <SectionHead
        title="Last 7 days"
        sub="Tap a day for everything that happened."
        action={
          <button
            type="button"
            className="btn small ghost"
            onClick={async () => {
              const ok = await copyText(babySummaryText(f, baby.id, today))
              setCopied(ok)
              toast(ok ? 'Summary copied. Paste it into a message.' : 'Could not copy.')
            }}
          >
            <Icon name="copy" size={14} /> {copied ? 'Copied' : 'Copy'}
          </button>
        }
      />
      <div className="card table-card">
        <table className="mini-table day-table">
          <thead>
            <tr>
              <th />
              <th>Feeds</th>
              <th>Wet</th>
              <th>Dirty</th>
              <th>Sleep</th>
              <th aria-label="Open" />
            </tr>
          </thead>
          <tbody>
            {week
              .slice()
              .reverse()
              .map((d) => (
                <tr
                  key={d.day}
                  className={d.day === today ? 'today' : ''}
                  onClick={() => setDayOpen(d.day)}
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' ? setDayOpen(d.day) : undefined)}
                  role="button"
                  aria-label={`Open ${d.day === today ? 'today' : dayName(d.day, true)}`}
                >
                  <th scope="row">{d.day === today ? 'Today' : d.day === addDays(today, -1) ? 'Yest.' : dayName(d.day)}</th>
                  <td>{d.feeds.length}</td>
                  <td>{d.wet}</td>
                  <td>{d.dirty}</td>
                  <td>{d.sleepMinutes ? fmtDuration(d.sleepMinutes) : '–'}</td>
                  <td className="muted">›</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <details className="care-fold">
        <summary>
          <Icon name="clock" size={16} /> Shifts and rota
        </summary>
        <ShiftCard baby={baby} />
      </details>
      <TimetableCard baby={baby} limit={3} />

      {sheet && <BabySheet kind={sheet.kind} mode={sheet.mode} baby={baby} when={when} onClose={() => setSheet(undefined)} log={log} startRun={startRun} />}
      {sleepOpen && (
        <SleepSheet
          baby={baby}
          onClose={() => setSleepOpen(false)}
          onStartTimer={() => {
            setSleepOpen(false)
            startSleep()
          }}
          onLog={(evs, msg) => {
            setSleepOpen(false)
            log(evs, msg)
          }}
        />
      )}
      {nappyOpen && <NappySheet baby={baby} now={now} when={when} onLog={nappy} onClose={() => setNappyOpen(false)} />}
      {dayOpen && (
        <BabyDaySheet baby={baby} day={dayOpen} onDay={setDayOpen} onClose={() => setDayOpen(undefined)} renderList={(l) => <LogList logs={l} empty="Nothing logged that day." noBreaks />} />
      )}
      {pumpStop && (
        <PumpStopSheet
          baby={baby}
          minutes={pumpStop.minutes}
          side={pumpStop.side}
          onClose={() => setPumpStop(undefined)}
          onSave={(ml, location, side) => {
            act(CA.stopPumpRun(me.id, baby.id, pumpStop.feedRunId, { startedTs: pumpStop.startedTs, ml, side, minutes: pumpStop.minutes, location }))
            toast(ml ? `Pumped ${ml} ml, added to the ${location}.` : 'Pumping session logged.')
            setPumpStop(undefined)
          }}
        />
      )}
    </>
  )
}

const ML_CHIPS = [30, 60, 90, 120, 150, 180, 210, 240]

function MlPicker({ ml, setMl }: { ml: number; setMl: (n: number) => void }) {
  return (
    <>
      <div className="chips">
        {ML_CHIPS.map((m) => (
          <button key={m} type="button" className={`chip${ml === m ? ' selected' : ''}`} onClick={() => setMl(m)}>
            {m} ml
          </button>
        ))}
      </div>
      <label className="field">
        <span>Or type the amount (ml)</span>
        <input className="tbox" inputMode="numeric" value={ml || ''} onChange={(e) => setMl(Number(e.target.value.replace(/\D/g, '').slice(0, 3)) || 0)} />
      </label>
    </>
  )
}

/** Milk in stock, oldest first: shown where it matters (bottle and pump), not as its own card. */
function StockLine({ baby }: { baby: Member }) {
  const f = useFamily()
  const today = ymdOf(Date.now())
  const ages = milkAges(f, baby.id, today)
  const total = ages.reduce((s, a) => s + a.ml, 0)
  if (!total) return <p className="muted small">No expressed milk in stock.</p>
  const oldest = ages[0]
  return (
    <p className="muted small stock-line">
      🧊 <b>{total} ml</b> expressed in stock
      {oldest?.days != null && (
        <>
          {' '}
          · oldest: {oldest.ml} ml in the {oldest.location}, {oldest.days === 0 ? 'from today' : `${oldest.days} day${oldest.days === 1 ? '' : 's'} old`}
        </>
      )}
    </p>
  )
}

function PumpStopSheet({
  baby,
  minutes,
  side: runSide,
  onClose,
  onSave,
}: {
  baby: Member
  minutes: number
  side: 'L' | 'R' | 'both'
  onClose: () => void
  onSave: (ml: number, location: 'fridge' | 'freezer', side: 'L' | 'R' | 'both') => void
}) {
  const [ml, setMl] = useState(0)
  const [where, setWhere] = useState<'fridge' | 'freezer'>('fridge')
  const [side, setSide] = useState<'L' | 'R' | 'both'>(runSide)
  return (
    <Sheet open onClose={onClose} title={`Pumping done · ${baby.name}`}>
      <p className="muted">{minutes} min. Which side, and how much did you get?</p>
      <Seg
        value={side}
        onChange={setSide}
        label="Which side"
        options={[
          { id: 'L', label: 'Left' },
          { id: 'R', label: 'Right' },
          { id: 'both', label: 'Both' },
        ]}
      />
      <MlPicker ml={ml} setMl={setMl} />
      <Seg
        value={where}
        onChange={setWhere}
        options={[
          { id: 'fridge', label: 'Fridge' },
          { id: 'freezer', label: 'Freezer' },
        ]}
      />
      <StockLine baby={baby} />
      <button type="button" className="btn primary big block" disabled={!ml} onClick={() => onSave(ml, where, side)}>
        Add {ml || ''} ml to stock
      </button>
      <button type="button" className="btn ghost block" onClick={() => onSave(0, where, side)}>
        Log the session without an amount
      </button>
    </Sheet>
  )
}

/** Time of day, with the day too when it isn't today: "14:10" or "Tue 14:10". */
const whenText = (ts: number) => (ymdOf(ts) === ymdOf(Date.now()) ? hmOf(ts) : `${dayName(ymdOf(ts)).slice(0, 3)} ${hmOf(ts)}`)

const SLEEP_LENGTHS = [15, 30, 45, 60, 90, 120, 180]

/** Sleep, like a feed: start the timer now, or log one that already happened - when they fell asleep and for how long. */
function SleepSheet({ baby, onClose, onStartTimer, onLog }: { baby: Member; onClose: () => void; onStartTimer: () => void; onLog: (evs: AppEvent[], msg: string) => void }) {
  const f = useFamily()
  const me = useMe()!
  const w = useWhen(60)
  const [minutes, setMinutes] = useState(45)
  const at = w.resolve()
  const span = sleepSpan(at, minutes)
  const clash = span.ok ? overlappingSleep(f, baby.id, span.at, span.endAt) : undefined
  const runningSince = activeTimers(f, { subjectId: baby.id }).find((t) => t.purpose === 'sleep')?.segments[0]?.from
  const runningClash = span.ok && runningSince != null && span.endAt > runningSince
  return (
    <Sheet open onClose={onClose} title={`Sleep · ${baby.name}`}>
      <button type="button" className="btn primary big block" onClick={onStartTimer}>
        <Icon name="timer" size={20} /> Start sleep timer
      </button>
      <p className="note center">or log a sleep that already happened</p>
      <p className="note">Slept for:</p>
      <div className="chips">
        {SLEEP_LENGTHS.map((m) => (
          <button key={m} type="button" className={`chip small${minutes === m ? ' selected' : ''}`} onClick={() => setMinutes(m)}>
            {fmtDuration(m)}
          </button>
        ))}
        <input
          type="number"
          inputMode="numeric"
          className="tbox slim"
          aria-label="Other length, in minutes"
          placeholder="min"
          min={1}
          max={MAX_SLEEP_MIN}
          value={SLEEP_LENGTHS.includes(minutes) ? '' : minutes || ''}
          onChange={(e) => setMinutes(Math.max(0, Math.round(Number(e.target.value)) || 0))}
        />
      </div>
      <WhenChips w={w} label="Fell asleep:" presets={SLEEP_PRESETS} />
      {span.ok && (
        <p className="note" role="status">
          {whenText(span.at)} to {whenText(span.endAt)} · {fmtDuration(minutes)}
        </p>
      )}
      {!span.ok && span.reason === 'future' && (
        <p className="note warn" role="status">
          That would end in the future. Choose an earlier start or a shorter sleep, or start the timer instead.
        </p>
      )}
      {!span.ok && span.reason === 'toolong' && <p className="note warn">A sleep can be up to 24 hours.</p>}
      {clash && (
        <p className="note warn" role="status">
          That overlaps a sleep already logged ({whenText(clash.at)} to {whenText(clash.endAt ?? clash.at)}). You can still log it.
        </p>
      )}
      {runningClash && (
        <p className="note warn" role="status">
          {baby.name}’s sleep timer is running, and this overlaps it.
        </p>
      )}
      <button
        type="button"
        className="btn block"
        disabled={!span.ok}
        onClick={() => {
          const sp = sleepSpan(w.resolve(), minutes)
          if (!sp.ok) return
          onLog(A.logBaby(me.id, { babyId: baby.id, kind: 'sleep', at: sp.at, endAt: sp.endAt }), `Sleep logged: ${fmtDuration(minutes)} from ${whenText(sp.at)}.`)
        }}
      >
        {span.ok ? `Log ${fmtDuration(minutes)} from ${whenText(span.at)}` : 'Log sleep'}
      </button>
    </Sheet>
  )
}

/** Wet/Dirty/Both all open here rather than logging instantly, so "when did this happen" (same Now/5 min
 * ago/... picker as feeds) applies to nappies too. Dirty ones also get a quick "what colour?" - the pure logic
 * already knows what's typical at this age (see care.ts), so an unusual pick gets a gentle note. Skippable. */
function NappySheet({
  baby,
  now,
  when,
  onLog,
  onClose,
}: {
  baby: Member
  now: number
  when: ReturnType<typeof useWhen>
  onLog: (wet: boolean, dirty: boolean, c?: NappyColour) => void
  onClose: () => void
}) {
  const [type, setType] = useState<'wet' | 'dirty' | 'both'>('wet')
  const wet = type !== 'dirty'
  const dirty = type !== 'wet'
  const [picked, setPicked] = useState<NappyColour>()
  const days = ageDays(baby, now)
  const COLOURS: { id: NappyColour; label: string; swatch: string }[] = [
    { id: 'black', label: 'Black', swatch: '#2b2b2b' },
    { id: 'green', label: 'Green', swatch: '#4a7a3d' },
    { id: 'yellow', label: 'Yellow', swatch: '#e0b93c' },
    { id: 'brown', label: 'Brown', swatch: '#8a5a34' },
    { id: 'red', label: 'Red', swatch: '#c94f4f' },
    { id: 'white', label: 'Pale/white', swatch: '#e8e6df' },
    { id: 'other', label: "Other / didn't check", swatch: 'transparent' },
  ]
  const anomalous = picked && days != null ? isAnomalousNappyColour(picked, days) : false
  return (
    <Sheet open onClose={onClose} title={`Nappy · ${baby.name}`}>
      <div className="nappy-pick" role="group" aria-label="What kind?">
        {(
          [
            ['wet', '💧', 'Wet'],
            ['dirty', '💩', 'Dirty'],
            ['both', '💧💩', 'Both'],
          ] as const
        ).map(([id, emoji, label]) => (
          <button key={id} type="button" className={type === id ? 'on' : ''} aria-pressed={type === id} onClick={() => setType(id)}>
            <span>{emoji}</span>
            {label}
          </button>
        ))}
      </div>
      <WhenChips w={when} />
      {dirty && (
        <>
          <p className="note">What colour?</p>
          <div className="chips">
            {COLOURS.map((c) => (
              <button key={c.id} type="button" className={`chip small${picked === c.id ? ' selected' : ''}`} onClick={() => setPicked(c.id)}>
                {c.id !== 'other' && <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 5, background: c.swatch, marginRight: 6 }} />}
                {c.label}
              </button>
            ))}
          </div>
          {anomalous && picked && (
            <div className="dose-lock">
              <Icon name="info" size={16} />
              <span>
                {picked === 'red' || picked === 'white'
                  ? 'Not the usual colour — worth mentioning to your midwife or GP if it continues.'
                  : 'Not the usual colour for this age — worth keeping an eye on.'}
              </span>
            </div>
          )}
        </>
      )}
      {type === 'wet' ? (
        <button type="button" className="btn primary big block" onClick={() => onLog(true, false)}>
          Log wet nappy
        </button>
      ) : (
        <>
          <button type="button" className="btn primary big block" disabled={!picked} onClick={() => onLog(wet, dirty, picked)}>
            Log it
          </button>
          <button type="button" className="btn ghost block" onClick={() => onLog(wet, dirty, 'other')}>
            Skip colour — just log it
          </button>
        </>
      )}
    </Sheet>
  )
}

/** Does this log entry carry a duration worth editing alongside its time? Breastfeeds, sleeps and walks have one; a
 * bottle, a nappy, a dose and so on are a single instant with nothing to stretch. (A sleep still running has no end
 * yet, and is never in the list.) */
function logDurationMinutes(l: BabyEvent | PetEvent): number | undefined {
  if ('babyId' in l) {
    if (l.kind === 'sleep') return l.endAt != null ? Math.max(1, Math.round((l.endAt - l.at) / 60_000)) : undefined
    return l.kind === 'feed' && l.feed?.method === 'breast' ? (l.feed.minutes ?? 0) : l.kind === 'pump' ? (l.pump?.minutes ?? 0) : undefined
  }
  return l.kind === 'walk' ? (l.minutes ?? 0) : undefined
}

/** Edit a log entry's time - and, for a feed or walk, its duration - once someone notices it's wrong (an
 * auto-closed feed run guessed short, a late-night entry landed under the wrong minute). Saving voids the old
 * entry and logs a corrected copy (see A.editBaby / A.editPet), same as every other correction in this app. */
function EditLogSheet({ entry, onClose }: { entry: BabyEvent | PetEvent; onClose: () => void }) {
  const { act, toast } = useApp()
  const me = useMe()!
  const durationMin = logDurationMinutes(entry)
  const [date, setDate] = useState(ymdOf(entry.at))
  const [time, setTime] = useState(hmOf(entry.at))
  const [minutes, setMinutes] = useState(durationMin ?? 0)
  const isPump = 'babyId' in entry && entry.kind === 'pump'
  const [pumpMl, setPumpMl] = useState(isPump && 'babyId' in entry ? (entry.pump?.ml ?? 0) : 0)
  const f = useFamily()
  const today = ymdOf(Date.now())
  const isSleep = 'babyId' in entry && entry.kind === 'sleep'
  const sleepEdit = isSleep ? sleepSpan(tsOf(date, time), minutes) : undefined
  const people = Object.values(f.members).filter((m) => m.active && (m.role === 'parent' || m.role === 'child'))
  const isBabyEntry = 'babyId' in entry && entry.kind !== 'pump'
  const original = 'babyId' in entry ? (entry.by ?? (entry.voice ? '' : entry.learnerId)) : ''
  const [by, setBy] = useState<string>(original)
  const byPatch = isBabyEntry && by !== original ? { by: by || undefined } : {}
  const sleepClash = isSleep && sleepEdit?.ok && 'babyId' in entry ? overlappingSleep(f, entry.babyId, sleepEdit.at, sleepEdit.endAt, entry.id) : undefined
  const save = () => {
    const at = Math.min(tsOf(date, time), Date.now())
    if ('babyId' in entry && entry.kind === 'pump') {
      // A pumping session owns its milk in stock: replace both, so the amount and the link stay right.
      const old = f.milkStock.filter((m) => !f.voided[m.id] && m.action === 'add' && m.pumpEventId === entry.id)
      const location = old[0]?.location
      act([...old.flatMap((m) => A.undo(me.id, m.id)), ...A.undo(me.id, entry.id), ...CA.logPump(me.id, entry.babyId, { at, ml: pumpMl, side: entry.pump?.side, minutes, location })])
    } else if ('babyId' in entry && entry.kind === 'sleep') {
      if (!sleepEdit?.ok) return
      act(A.editBaby(me.id, entry, { at: sleepEdit.at, endAt: sleepEdit.endAt, ...byPatch }))
    } else if ('babyId' in entry) {
      const feed = entry.feed?.method === 'breast' ? { ...entry.feed, minutes } : entry.feed
      act(A.editBaby(me.id, entry, { at, feed, ...byPatch }))
    } else {
      act(A.editPet(me.id, entry, entry.kind === 'walk' ? { at, minutes } : { at }))
    }
    toast('Entry updated.')
    onClose()
  }
  return (
    <Sheet open onClose={onClose} title="Edit entry">
      <p className="note">{'babyId' in entry ? describeBaby(entry) : describePet(entry)}</p>
      <div className="chips small-gap">
        <input type="date" className="tbox slim" aria-label="Date" max={today} value={date} onChange={(e) => setDate(e.target.value)} />
        <input type="time" className="tbox slim" aria-label="Time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      {isBabyEntry && (
        <div className="field">
          <span>Who</span>
          <div className="chips small-gap">
            {people.map((m) => (
              <button key={m.id} type="button" className={`chip small${by === m.id ? ' selected' : ''}`} aria-pressed={by === m.id} onClick={() => setBy(m.id)}>
                {m.name}
              </button>
            ))}
            <button type="button" className={`chip small${by === '' ? ' selected' : ''}`} aria-pressed={by === ''} onClick={() => setBy('')}>
              Not sure
            </button>
          </div>
          {!!(entry as BabyEvent).voice && !by && <p className="note">Logged by voice, so no one is credited yet.</p>}
        </div>
      )}
      {isPump && (
        <label className="field">
          <span>Amount (ml)</span>
          <input type="number" className="tbox" min={0} value={pumpMl} onChange={(e) => setPumpMl(Math.max(0, Math.round(Number(e.target.value)) || 0))} />
        </label>
      )}
      {durationMin != null && (
        <label className="field">
          <span>{isSleep ? 'Slept for (minutes)' : 'Duration (minutes)'}</span>
          <input type="number" className="tbox" min={isSleep ? 1 : 0} value={minutes} onChange={(e) => setMinutes(Math.max(0, Math.round(Number(e.target.value)) || 0))} />
        </label>
      )}
      {sleepEdit?.ok && (
        <p className="note" role="status">
          {whenText(sleepEdit.at)} to {whenText(sleepEdit.endAt)} · {fmtDuration(minutes)}
        </p>
      )}
      {sleepEdit && !sleepEdit.ok && (
        <p className="note warn" role="status">
          {sleepEdit.reason === 'future' ? 'That would end in the future.' : sleepEdit.reason === 'toolong' ? 'A sleep can be up to 24 hours.' : 'Enter how long they slept.'}
        </p>
      )}
      {sleepClash && (
        <p className="note warn" role="status">
          That overlaps a sleep already logged ({whenText(sleepClash.at)} to {whenText(sleepClash.endAt ?? sleepClash.at)}).
        </p>
      )}
      <button type="button" className="btn primary big block" disabled={!!sleepEdit && !sleepEdit.ok} onClick={save}>
        Save
      </button>
    </Sheet>
  )
}

function LogList({ logs, empty = 'Nothing logged yet today.', noBreaks }: { logs: (BabyEvent | PetEvent)[]; empty?: string; noBreaks?: boolean }) {
  const f = useFamily()
  const { act, toast } = useApp()
  const me = useMe()!
  const [editing, setEditing] = useState<BabyEvent | PetEvent | undefined>(undefined)
  if (!logs.length) return <p className="note">{empty}</p>
  const today = ymdOf(Date.now())
  const rows = noBreaks ? logs.map((l) => ({ kind: 'entry' as const, l })) : withDayBreaks(logs, today)
  return (
    <>
      <ul className="log-list">
        {rows.map((r, i) =>
          r.kind === 'break' ? (
            <li key={`b${i}`} className="log-break">
              <span>{r.label}</span>
            </li>
          ) : (
            <li key={r.l.id}>
              <span className="log-time">{timeOf(r.l.at)}</span>
              <span className="log-what">{'babyId' in r.l ? describeBaby(r.l) : describePet(r.l)}</span>
              <small className="muted">
                {(() => {
                  const w = loggedBy(f, r.l)
                  return w.voice ? 'logged by voice' : w.name
                })()}
              </small>
              <button type="button" className="icon-btn small" aria-label="Edit this entry" onClick={() => setEditing(r.l)}>
                <Icon name="pencil" size={16} />
              </button>
              <button
                type="button"
                className="icon-btn small"
                aria-label="Remove this entry"
                onClick={() => {
                  const l = r.l
                  // Undoing a bottle from expressed milk puts the milk back; undoing a pumping session takes its milk out again.
                  const linked = f.milkStock.filter((m) => !f.voided[m.id] && ((m.action === 'deduct' && m.feedEventId === l.id) || (m.action === 'add' && m.pumpEventId === l.id)))
                  act([...A.undo(me.id, l.id), ...linked.flatMap((m) => A.undo(me.id, m.id))])
                  toast('Entry removed.')
                }}
              >
                <Icon name="x" size={16} />
              </button>
            </li>
          ),
        )}
      </ul>
      {editing && <EditLogSheet entry={editing} onClose={() => setEditing(undefined)} />}
    </>
  )
}

function BabySheet({
  kind,
  mode: initialMode,
  baby,
  when,
  onClose,
  log,
  startRun,
}: {
  kind: BabySheetKind
  mode?: FeedMode
  baby: Member
  when: ReturnType<typeof useWhen>
  onClose: () => void
  log: (evs: AppEvent[], msg: string) => void
  startRun: (mode: 'breast' | 'pump', side: 'L' | 'R') => void
}) {
  const f = useFamily()
  const me = useMe()!
  const { sync, settings } = useApp()
  const last = lastBaby(f, baby.id, 'feed')
  const lastBottle = babyLogs(f, baby.id).find((l) => l.kind === 'feed' && l.feed?.method === 'bottle')
  const stock = totalMilkMl(f, baby.id)
  const [mode, setMode] = useState<FeedMode>(initialMode ?? (last?.feed?.method === 'bottle' ? 'bottle' : 'breast'))
  const [ml, setMl] = useState<number>(lastBottle?.feed?.ml ?? 90)
  const [milk, setMilk] = useState<'formula' | 'expressed'>(lastBottle?.feed?.milk ?? (stock > 0 ? 'expressed' : 'formula'))
  const nextSide: 'L' | 'R' = last?.feed?.method === 'breast' && last.feed.side === 'L' ? 'R' : 'L'
  const [side, setSide] = useState<'L' | 'R'>(nextSide)
  const [pumpSide, setPumpSide] = useState<'L' | 'R' | 'both'>('both')
  const [mins, setMins] = useState(10)
  const [pumpMl, setPumpMl] = useState(0)
  const [where, setWhere] = useState<'fridge' | 'freezer'>('fridge')
  const [text, setText] = useState('')
  const [num, setNum] = useState('')
  const [what, setWhat] = useState('Vitamin D')
  const save = (d: Omit<Parameters<typeof A.logBaby>[1], 'babyId' | 'at'>, msg: string) => {
    const evs = A.logBaby(me.id, { babyId: baby.id, at: when.resolve(), ...d })
    // A bottle of expressed milk comes off the stock (undoing the feed puts it back: see LogList).
    const feedEvent = evs[0]
    const deduct = d.feed?.method === 'bottle' && d.feed.milk === 'expressed' && d.feed.ml && feedEvent ? CA.deductMilk(me.id, f, baby.id, d.feed.ml, feedEvent.id) : []
    log([...evs, ...deduct], msg)
    onClose()
  }
  const title = { feed: 'Feed', solid: 'Solids', health: 'Medicine or health', growth: 'Weight', note: 'Note' }[kind]
  return (
    <Sheet open onClose={onClose} title={`${title} · ${baby.name}`}>
      {kind === 'feed' && (
        <Seg
          value={mode}
          onChange={setMode}
          label="Kind of feed"
          options={[
            { id: 'breast', label: '🤱 Breast' },
            { id: 'bottle', label: '🍼 Bottle' },
            { id: 'pump', label: '🧴 Pump' },
          ]}
        />
      )}
      {kind === 'feed' && mode === 'bottle' && (
        <>
          <MlPicker ml={ml} setMl={setMl} />
          <Seg
            value={milk}
            onChange={setMilk}
            options={[
              { id: 'formula', label: 'Formula' },
              { id: 'expressed', label: 'Expressed milk' },
            ]}
          />
          {milk === 'expressed' && <StockLine baby={baby} />}
          {milk === 'expressed' && ml > stock && <p className="note warn">That's more than the {stock} ml recorded in stock. It will still be logged; the stock just goes to zero.</p>}
          <WhenChips w={when} />
          <button type="button" className="btn primary big block" disabled={!ml} onClick={() => save({ kind: 'feed', feed: { method: 'bottle', ml, milk } }, `Bottle ${ml} ml logged.`)}>
            Log bottle
          </button>
        </>
      )}
      {kind === 'feed' && mode === 'breast' && (
        <>
          <p className="muted">{last?.feed?.method === 'breast' && last.feed.side ? `Last time: ${last.feed.side === 'L' ? 'left' : 'right'}.` : 'Which side?'}</p>
          <Seg
            value={side}
            onChange={setSide}
            options={[
              { id: 'L', label: 'Left' },
              { id: 'R', label: 'Right' },
            ]}
          />
          <button type="button" className="btn primary big block" onClick={() => startRun('breast', side)}>
            <Icon name="timer" size={20} /> Start feed timer
          </button>
          <p className="note center">or log a feed that already happened</p>
          <div className="chips">
            {[5, 10, 15, 20, 30].map((m) => (
              <button key={m} type="button" className={`chip small${mins === m ? ' selected' : ''}`} onClick={() => setMins(m)}>
                {m} min
              </button>
            ))}
          </div>
          <WhenChips w={when} />
          <button type="button" className="btn block" onClick={() => save({ kind: 'feed', feed: { method: 'breast', side, minutes: mins } }, 'Feed logged.')}>
            Log {mins} min on the {side === 'L' ? 'left' : 'right'}
          </button>
        </>
      )}
      {kind === 'feed' && mode === 'pump' && (
        <>
          <Seg
            value={pumpSide}
            onChange={setPumpSide}
            label="Which side"
            options={[
              { id: 'L', label: 'Left' },
              { id: 'R', label: 'Right' },
              { id: 'both', label: 'Both' },
            ]}
          />
          <button type="button" className="btn primary big block" onClick={() => startRun('pump', pumpSide === 'R' ? 'R' : 'L')}>
            <Icon name="timer" size={20} /> Start pumping timer
          </button>
          <p className="note center">or log a session that already happened</p>
          <MlPicker ml={pumpMl} setMl={setPumpMl} />
          <div className="chips">
            {[5, 10, 15, 20, 30].map((m) => (
              <button key={m} type="button" className={`chip small${mins === m ? ' selected' : ''}`} onClick={() => setMins(m)}>
                {m} min
              </button>
            ))}
          </div>
          <Seg
            value={where}
            onChange={setWhere}
            options={[
              { id: 'fridge', label: 'Fridge' },
              { id: 'freezer', label: 'Freezer' },
            ]}
          />
          <StockLine baby={baby} />
          <WhenChips w={when} />
          <button
            type="button"
            className="btn block"
            onClick={() => {
              log(
                CA.logPump(me.id, baby.id, { at: when.resolve(), ml: pumpMl, side: pumpSide, minutes: mins, location: where }),
                pumpMl ? `Pumped ${pumpMl} ml, added to the ${where}.` : 'Pumping session logged.',
              )
              onClose()
            }}
          >
            Log {pumpMl ? `${pumpMl} ml, ` : ''}
            {mins} min pumping
          </button>
        </>
      )}
      {kind === 'solid' && (
        <>
          <label className="field">
            <span>What did they eat?</span>
            <input className="tbox" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Banana and porridge" maxLength={80} />
          </label>
          <WhenChips w={when} />
          <button type="button" className="btn primary big block" onClick={() => save({ kind: 'feed', feed: { method: 'solid' }, note: text.trim() || undefined }, 'Solids logged.')}>
            Log solids
          </button>
        </>
      )}
      {kind === 'health' && (
        <>
          <div className="chips">
            {[...liveMedRules(f).map((r) => r.name), 'Gripe water', 'Temperature'].map((w) => (
              <button key={w} type="button" className={`chip small${what === w ? ' selected' : ''}`} onClick={() => setWhat(w)}>
                {w}
              </button>
            ))}
          </div>
          <label className="field">
            <span>Or something else</span>
            <input
              className="tbox"
              value={[...liveMedRules(f).map((r) => r.name), 'Gripe water', 'Temperature'].includes(what) ? '' : what}
              onChange={(e) => setWhat(e.target.value || 'Vitamin D')}
              placeholder="e.g. Teething gel"
              maxLength={40}
            />
          </label>
          {what === 'Temperature' && (
            <label className="field">
              <span>Temperature (°C)</span>
              <input className="tbox" inputMode="decimal" value={num} onChange={(e) => setNum(e.target.value.replace(/[^\d.]/g, '').slice(0, 4))} placeholder="36.8" />
            </label>
          )}
          {what !== 'Temperature' &&
            (() => {
              const lock = doseLock(f, baby.id, what)
              return lock.locked ? (
                <div className="dose-lock">
                  <Icon name="lock" size={16} />
                  <span>{lock.reason} Not a hard stop — you can still log it if you need to.</span>
                </div>
              ) : null
            })()}
          <WhenChips w={when} />
          {what === 'Temperature' ? (
            <button type="button" className="btn primary big block" onClick={() => save({ kind: 'health', health: what, tempC: Number(num) || undefined }, `${what} logged.`)}>
              Log it
            </button>
          ) : (
            <button
              type="button"
              className="btn primary big block"
              onClick={() => {
                const at = when.resolve()
                log(CA.logMedicine(me.id, baby.id, what, {}, at), `${what} logged.`)
                const fireAt = nextDoseAt(f, what, at)
                if (fireAt && notifyTypeOn(settings, 'meds')) {
                  void scheduleNotificationFor(sync, careRecipients(f), {
                    fireAt,
                    title: `${baby.name}: ${what} due`,
                    body: `It's been the recommended gap since the last ${what.toLowerCase()} dose.`,
                    tag: `med:${baby.id}:${what}`,
                  })
                }
                onClose()
              }}
            >
              Log it
            </button>
          )}
        </>
      )}
      {kind === 'growth' && (
        <>
          <label className="field">
            <span>Weight (kg)</span>
            <input className="tbox" inputMode="decimal" value={num} onChange={(e) => setNum(e.target.value.replace(/[^\d.]/g, '').slice(0, 5))} placeholder="e.g. 4.35" autoFocus />
          </label>
          <button type="button" className="btn primary big block" disabled={!Number(num)} onClick={() => save({ kind: 'growth', weightKg: Number(num) }, 'Weight logged.')}>
            Log weight
          </button>
        </>
      )}
      {kind === 'note' && (
        <>
          <label className="field">
            <span>Note</span>
            <input className="tbox" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Fussy after the evening feed" maxLength={200} autoFocus />
          </label>
          <button type="button" className="btn primary big block" disabled={!text.trim()} onClick={() => save({ kind: 'note', note: text.trim() }, 'Note saved.')}>
            Save note
          </button>
        </>
      )}
    </Sheet>
  )
}

// ==================================================================== DOG

function describePet(l: PetEvent): string {
  switch (l.kind) {
    case 'walk':
      return `Walk${l.minutes ? `, ${l.minutes} min` : ''}${l.poo ? ' (poo)' : ''}`
    case 'feed':
      return `Fed${l.meal ? ` (${l.meal})` : ''}${l.note ? `: ${l.note}` : ''}`
    case 'water':
      return 'Fresh water'
    case 'toilet':
      return l.poo ? 'Toilet: poo' : 'Toilet: wee'
    case 'meds':
      return `Medicine${l.note ? `: ${l.note}` : ''}`
    case 'groom':
      return 'Groomed'
    case 'vet':
      return `Vet${l.note ? `: ${l.note}` : ''}`
    default:
      return l.note ?? 'Note'
  }
}

type PetSheetKind = 'walk' | 'feed' | 'toilet' | 'meds' | 'vet' | 'note' | 'treatment' | 'output' | 'stock'

function PetPanel({ pet }: { pet: Member }) {
  const { act, toast } = useApp()
  const nav = useNavigate()
  const f = useFamily()
  const me = useMe()!
  const now = useNow(20_000)
  const today = ymdOf(now)
  const when = useWhen()
  const [sheet, setSheet] = useState<PetSheetKind | undefined>()
  const [dup, setDup] = useState<{ existing: PetEvent; run: () => void } | undefined>()
  const timers = activeTimers(f, { subjectId: pet.id })
  const logs = petLogs(f, pet.id)

  const log = (draft: Omit<Parameters<typeof A.logPet>[2], 'petId' | 'at'>, msg: string) => {
    const at = when.resolve()
    const run = () => {
      const evs = A.logPet(me.id, f, { petId: pet.id, at, ...draft })
      act(evs)
      when.reset()
      toast(msg, { undo: () => act(evs.flatMap((e) => A.undo(me.id, e.id))) })
    }
    const existing = recentDuplicate(f, pet.id, draft.kind, at)
    if (existing && !when.late) setDup({ existing, run })
    else run()
  }
  const stock = currentStock(f, pet.id)
  const reorderDue = stock ? needsReorder(f, pet.id) : false
  const treatments = [...new Set(logs.filter((l) => l.kind === 'treatment').map((l) => l.treatment!.product))]

  const startWalk = () => {
    const { events } = A.startTimer(me.id, { memberId: me.id, label: `Walking ${pet.name}`, purpose: 'walk', subjectId: pet.id })
    act(events)
    setSheet(undefined)
  }

  const days = [6, 5, 4, 3, 2, 1, 0].map((i) => addDays(today, -i)).map((day) => petDay(f, pet.id, day))
  const maxWalk = Math.max(30, ...days.map((x) => x.walkMinutes))

  return (
    <>
      <PetNowCard pet={pet} />

      {timers.length > 0 && (
        <div className="stack-gap">
          {timers.map((t) => (
            <MiniTimer key={t.id} timer={t} />
          ))}
        </div>
      )}

      {reorderDue && stock && (
        <DueBanner
          text={`${stock.product} is running low.`}
          action="Add to shopping list"
          onAction={() => {
            act(CA.reorderStock(me.id, f, stock))
            toast('Added to the shopping list.')
          }}
        />
      )}
      {treatments.map((product) => {
        const t = logs.find((l) => l.kind === 'treatment' && l.treatment!.product === product)!
        const due = treatmentDue(f, pet.id, product, t.treatment!.cycleDays)
        return due.due ? <DueBanner key={product} text={`${product} is due.`} action="Log it" onAction={() => setSheet('treatment')} /> : null
      })}
      {(() => {
        const lock = mealLock(f, pet.id, 'breakfast')
        return (
          <div className="care-pad four" role="group" aria-label="Log">
            <button type="button" className="pad-big tone-a" onClick={() => setSheet('walk')}>
              <span className="pad-emoji">🦮</span>
              <strong>Walk</strong>
              <small>time or log</small>
            </button>
            <button type="button" className="pad-big tone-b" onClick={() => (lock.locked ? toast(`Already fed by ${f.members[lock.by!]?.name ?? 'someone'} at ${hmOf(lock.at!)}.`) : setSheet('feed'))}>
              <span className="pad-emoji">🍖</span>
              <strong>{lock.locked ? 'Fed' : 'Feed'}</strong>
              <small>{lock.locked ? `${f.members[lock.by!]?.name ?? '?'} ${hmOf(lock.at!)}` : suggestMeal(Date.now())}</small>
            </button>
            <button type="button" className="pad-big tone-c" onClick={() => log({ kind: 'water' }, 'Fresh water logged.')}>
              <span className="pad-emoji">💧</span>
              <strong>Water</strong>
              <small>one tap</small>
            </button>
            <button type="button" className="pad-big tone-d" onClick={() => setSheet('toilet')}>
              <span className="pad-emoji">💩</span>
              <strong>Toilet</strong>
              <small>wee · poo</small>
            </button>
          </div>
        )
      })()}
      <div className="care-pad-small" role="group" aria-label="More">
        <button type="button" onClick={() => setSheet('meds')}>
          <span>💊</span>Medicine
        </button>
        <button type="button" onClick={() => setSheet('treatment')}>
          <span>🛡️</span>Flea/worm
        </button>
        <button type="button" onClick={() => log({ kind: 'groom' }, 'Grooming logged.')}>
          <span>✂️</span>Groomed
        </button>
        <button type="button" onClick={() => setSheet('vet')}>
          <span>🩺</span>Vet
        </button>
        <button type="button" onClick={() => setSheet('output')}>
          <span>🚨</span>Upset tummy
        </button>
        <button type="button" onClick={() => setSheet('stock')}>
          <span>🥫</span>Food
        </button>
        <button type="button" onClick={() => setSheet('note')}>
          <span>📝</span>Note
        </button>
        {me.role === 'parent' && (
          <button type="button" onClick={() => nav('/vault')}>
            <span>🗂️</span>Vault
          </button>
        )}
      </div>
      <details className="care-fold slim" open={when.late}>
        <summary>Logging something from earlier?</summary>
        <WhenChips w={when} />
      </details>

      <SectionHead title="Last 24 hours" />
      <LogList logs={logs.filter((l) => l.at > now - 86_400_000)} empty="Nothing logged in the last 24 hours." />

      <SectionHead title="Walks this week" />
      <div className="card bars">
        {days.map((x) => (
          <div key={x.day} className={`bar-col${x.day === today ? ' today' : ''}`}>
            <span className="bar-v" style={{ height: `${(x.walkMinutes / maxWalk) * 100}%` }} title={`${x.walkMinutes} min`} />
            <small>{x.day === today ? 'Today' : dayName(x.day)}</small>
            <small className="muted">{x.walkMinutes || '–'}</small>
          </div>
        ))}
      </div>

      {sheet && <PetSheet kind={sheet} pet={pet} when={when} onClose={() => setSheet(undefined)} log={(dr, m) => (setSheet(undefined), log(dr, m))} startWalk={startWalk} />}
      <Sheet open={!!dup} onClose={() => setDup(undefined)} title="Already logged?">
        {dup && (
          <>
            <p>
              {f.members[dup.existing.learnerId]?.name ?? 'Someone'} logged {describePet(dup.existing).toLowerCase()} {ago(dup.existing.at, now)} ({hmOf(dup.existing.at)}). Log another one?
            </p>
            <button
              type="button"
              className="btn primary block"
              onClick={() => {
                dup.run()
                setDup(undefined)
              }}
            >
              Yes, log another
            </button>
            <button type="button" className="btn ghost block" onClick={() => setDup(undefined)}>
              No, that was it
            </button>
          </>
        )}
      </Sheet>
    </>
  )
}

function PetSheet({
  kind,
  pet,
  when,
  onClose,
  log,
  startWalk,
}: {
  kind: PetSheetKind
  pet: Member
  when: ReturnType<typeof useWhen>
  onClose: () => void
  log: (d: Omit<Parameters<typeof A.logPet>[2], 'petId' | 'at'>, msg: string) => void
  startWalk: () => void
}) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const [mins, setMins] = useState(30)
  const [poo, setPoo] = useState(false)
  const [wee, setWee] = useState(false)
  const [meal, setMeal] = useState<NonNullable<PetEvent['meal']>>(suggestMeal(Date.now()))
  const [text, setText] = useState('')
  const [product, setProduct] = useState('Nexgard')
  const [cycle, setCycle] = useState(28)
  const [firmness, setFirmness] = useState<1 | 2 | 3 | 4 | 5 | undefined>(undefined)
  const [stockProduct, setStockProduct] = useState(currentStock(f, pet.id)?.product ?? '')
  const [weightKg, setWeightKg] = useState(currentStock(f, pet.id) ? String(currentStock(f, pet.id)!.weightG / 1000) : '12')
  const [dailyG, setDailyG] = useState(currentStock(f, pet.id)?.dailyG ? String(currentStock(f, pet.id)!.dailyG) : '300')
  const title: Record<PetSheetKind, string> = {
    walk: 'Walk',
    feed: 'Feeding',
    toilet: 'Toilet',
    meds: 'Medicine',
    vet: 'Vet',
    note: 'Note',
    treatment: 'Flea / worming',
    output: 'Upset tummy',
    stock: 'Food stock',
  }
  const k: PetKind = kind === 'treatment' || kind === 'output' || kind === 'stock' ? 'note' : kind
  return (
    <Sheet open onClose={onClose} title={`${title[kind]} · ${pet.name}`}>
      {kind === 'walk' && (
        <>
          <button type="button" className="btn primary big block" onClick={startWalk}>
            <Icon name="timer" size={20} /> Start walk timer
          </button>
          <p className="note center">or log a walk that already happened</p>
          <div className="chips">
            {[10, 20, 30, 45, 60, 90].map((m) => (
              <button key={m} type="button" className={`chip small${mins === m ? ' selected' : ''}`} onClick={() => setMins(m)}>
                {m} min
              </button>
            ))}
          </div>
          <label className="switch-row">
            <span className="sr-main">
              <strong>Did a poo</strong>
            </span>
            <input type="checkbox" className="switch" checked={poo} onChange={(e) => setPoo(e.target.checked)} />
          </label>
          <label className="switch-row">
            <span className="sr-main">
              <strong>Did a wee</strong>
            </span>
            <input type="checkbox" className="switch" checked={wee} onChange={(e) => setWee(e.target.checked)} />
          </label>
          <WhenChips w={when} />
          <button
            type="button"
            className="btn block"
            onClick={() =>
              log({ kind: 'walk', minutes: mins, poo: poo || undefined, wee: wee || undefined }, `${mins} minute walk logged.${wee || poo ? '' : ' No wee or poo — might need out again before bed.'}`)
            }
          >
            Log {mins} min walk
          </button>
        </>
      )}
      {kind === 'feed' && (
        <>
          <Seg
            value={meal}
            onChange={setMeal}
            options={[
              { id: 'breakfast', label: 'Breakfast' },
              { id: 'dinner', label: 'Dinner' },
              { id: 'snack', label: 'Snack' },
            ]}
          />
          <WhenChips w={when} />
          <button type="button" className="btn primary big block" onClick={() => log({ kind: 'feed', meal }, `${pet.name}'s ${meal} logged.`)}>
            Log {meal}
          </button>
        </>
      )}
      {kind === 'toilet' && (
        <>
          <Seg
            value={poo ? 'poo' : 'wee'}
            onChange={(v) => setPoo(v === 'poo')}
            options={[
              { id: 'wee', label: 'Wee' },
              { id: 'poo', label: 'Poo' },
            ]}
          />
          <WhenChips w={when} />
          <button type="button" className="btn primary big block" onClick={() => log({ kind: 'toilet', poo }, 'Toilet logged.')}>
            Log it
          </button>
        </>
      )}
      {kind === 'treatment' && (
        <>
          <div className="chips">
            {['Nexgard', 'Bravecto', 'Drontal', 'Advocate'].map((p) => (
              <button key={p} type="button" className={`chip small${product === p ? ' selected' : ''}`} onClick={() => setProduct(p)}>
                {p}
              </button>
            ))}
          </div>
          <label className="field">
            <span>Product</span>
            <input className="tbox" value={product} onChange={(e) => setProduct(e.target.value)} maxLength={40} />
          </label>
          <label className="field">
            <span>Repeats every (days)</span>
            <input className="tbox" inputMode="numeric" value={cycle} onChange={(e) => setCycle(Number(e.target.value.replace(/\D/g, '').slice(0, 3)) || 28)} />
          </label>
          <WhenChips w={when} />
          <button
            type="button"
            className="btn primary big block"
            disabled={!product.trim()}
            onClick={() => {
              act(CA.logTreatment(me.id, f, pet.id, product.trim(), cycle, when.resolve()))
              toast(`${product} logged. Locked for ${cycle} days.`)
              onClose()
            }}
          >
            Log {product}
          </button>
        </>
      )}
      {kind === 'output' && (
        <>
          <Seg
            value={text === 'vomit' ? 'vomit' : 'diarrhoea'}
            onChange={(v) => setText(v)}
            options={[
              { id: 'diarrhoea', label: 'Diarrhoea' },
              { id: 'vomit', label: 'Was sick' },
            ]}
          />
          {text !== 'vomit' && (
            <>
              <p className="note">Firmness (1 firm — 5 very runny)</p>
              <div className="firmness-scale">
                {([1, 2, 3, 4, 5] as const).map((n) => (
                  <button key={n} type="button" className={firmness === n ? 'selected' : ''} onClick={() => setFirmness(n)}>
                    {n}
                  </button>
                ))}
              </div>
            </>
          )}
          <WhenChips w={when} />
          <button
            type="button"
            className="btn primary big block"
            onClick={() => {
              act(CA.logOutput(me.id, f, pet.id, text === 'vomit' ? 'vomit' : 'diarrhoea', { firmness }, when.resolve()))
              toast('Logged. Find the 7-day history under Vet.')
              onClose()
            }}
          >
            Log it
          </button>
          <SectionHead title="Last 7 days" />
          {vetHistory(f, pet.id, 7).length === 0 ? (
            <p className="note">Nothing logged in the last 7 days.</p>
          ) : (
            <ul className="log-list">
              {vetHistory(f, pet.id, 7).map((r, i) => (
                <li key={i}>
                  <span className="log-time">{hmOf(r.at)}</span>
                  <span className="log-what">{r.kind === 'vomit' ? 'Was sick' : `Diarrhoea${r.firmness ? ` (${r.firmness}/5)` : ''}`}</span>
                  <small className="muted">{dayName(ymdOf(r.at))}</small>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {kind === 'stock' && (
        <>
          <label className="field">
            <span>Product</span>
            <input className="tbox" value={stockProduct} onChange={(e) => setStockProduct(e.target.value)} placeholder="e.g. Chunky kibble 12kg" maxLength={60} />
          </label>
          <div className="row-fields">
            <label className="field">
              <span>Bag weight (kg)</span>
              <input className="tbox" inputMode="decimal" value={weightKg} onChange={(e) => setWeightKg(e.target.value.replace(/[^\d.]/g, '').slice(0, 6))} />
            </label>
            <label className="field">
              <span>Fed per day (g)</span>
              <input className="tbox" inputMode="numeric" value={dailyG} onChange={(e) => setDailyG(e.target.value.replace(/\D/g, '').slice(0, 5))} />
            </label>
          </div>
          <button
            type="button"
            className="btn primary big block"
            disabled={!stockProduct.trim() || !Number(weightKg)}
            onClick={() => {
              act(
                CA.openStock(me.id, {
                  petId: pet.id,
                  product: stockProduct.trim(),
                  weightG: Math.round(Number(weightKg) * 1000),
                  dailyG: Number(dailyG) || undefined,
                  openedDate: ymdOf(when.resolve()),
                }),
              )
              toast('New bag logged.')
              onClose()
            }}
          >
            Opened new bag
          </button>
          {currentStock(f, pet.id) && (
            <p className="note">
              Current bag: {currentStock(f, pet.id)!.product}, opened {dayName(currentStock(f, pet.id)!.openedDate)}.
            </p>
          )}
        </>
      )}
      {(kind === 'meds' || kind === 'vet' || kind === 'note') && (
        <>
          <label className="field">
            <span>{kind === 'meds' ? 'Which medicine?' : kind === 'vet' ? 'What was it for?' : 'Note'}</span>
            <input
              className="tbox"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={kind === 'meds' ? 'e.g. Flea tablet' : kind === 'vet' ? 'e.g. Booster jab' : ''}
              maxLength={120}
              autoFocus
            />
          </label>
          <WhenChips w={when} />
          <button type="button" className="btn primary big block" disabled={kind === 'note' && !text.trim()} onClick={() => log({ kind: k, note: text.trim() || undefined }, 'Logged.')}>
            Save
          </button>
        </>
      )}
    </Sheet>
  )
}
