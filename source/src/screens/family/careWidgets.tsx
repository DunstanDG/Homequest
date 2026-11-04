/** Small shared pieces for the Care screen: the 24h pulse rings, the shift-handover banner, and the live feed-run banner.
 * Kept out of Care.tsx because it was already a big file. */
import { useNavigate } from 'react-router-dom'
import * as CA from '@/family/careActions'
import { useApp, useFamily, useMe, useNow } from '@/app/context'
import { activeFeedRunFor, ageDays, babyDay, feedActiveSec, feedSideResult, handoverGaps, predictNextSleep, pulseCounts, pulseFill, pulseTargets } from '@/family/care'
import { fmtDuration, ymdOf } from '@/family/dates'
import { fmtClock } from '@/family/timers'
import type { Member } from '@/family/types'
import { Icon } from '@/ui/icons'

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="pulse-ring pulse-stat">
      <strong className="ps-value">{value}</strong>
      <span className="pr-label">{label}</span>
    </div>
  )
}

function Ring({ fill, warm, count, label }: { fill: number; warm: boolean; count: number; label: string }) {
  const r = 21
  const c = 2 * Math.PI * r
  return (
    <div className="pulse-ring">
      <svg width={52} height={52} viewBox="0 0 52 52">
        <circle cx={26} cy={26} r={r} fill="none" stroke="var(--line)" strokeWidth={6} />
        <circle
          cx={26}
          cy={26}
          r={r}
          fill="none"
          stroke={warm ? 'var(--care-warm)' : 'var(--care-neutral)'}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - fill)}
          transform="rotate(-90 26 26)"
        />
        <text x={26} y={31} textAnchor="middle" className="pr-count">
          {count}
        </text>
      </svg>
      <span className="pr-label">{label}</span>
    </div>
  )
}

/** Three rings (feeds, wet, dirty) for the last rolling 24 hours, with maximums set by the baby's age, plus today's
 * ml fed and sleep time in two plain tiles alongside them — one strip, so the numbers aren't shown twice over. General
 * guidance, never a diagnosis — the ring is never red (see care.css). */
export function PulseRings({ baby }: { baby: Member }) {
  const f = useFamily()
  const now = useNow(30_000)
  const days = ageDays(baby, now)
  if (days == null) return null
  const target = pulseTargets(days)
  const counts = pulseCounts(f, baby.id, now)
  const today = babyDay(f, baby.id, ymdOf(now))
  return (
    <div className="pulse-rings" aria-label="Last 24 hours, and today so far">
      <Ring fill={pulseFill(counts.feeds, target.feeds)} warm={counts.feeds < target.feeds[0]} count={counts.feeds} label="feeds" />
      <Ring fill={pulseFill(counts.wet, target.wet)} warm={counts.wet < target.wet[0]} count={counts.wet} label="wet" />
      <Ring fill={pulseFill(counts.dirty, target.dirty)} warm={counts.dirty < target.dirty[0]} count={counts.dirty} label="dirty" />
      <StatTile value={today.ml ? `${today.ml}` : '–'} label="ml today" />
      <StatTile value={today.sleepMinutes ? fmtDuration(today.sleepMinutes) : '–'} label="slept today" />
    </div>
  )
}

/** "Next sleep is likely around..." — a rough guess from recent naps or, without enough history, an age-typical wake
 * window. Always labelled as a guess: this is not a schedule and nothing here ever nudges you to hit a time. */
export function SleepPrediction({ baby }: { baby: Member }) {
  const f = useFamily()
  const now = useNow(60_000)
  const p = predictNextSleep(f, baby.id, now)
  if (!p) return null
  const soon = p.nextAt <= now
  return (
    <p className="note">
      {soon ? 'Next sleep may already be due' : `Next sleep is likely around ${fmtClock2(p.nextAt)}`} — a rough guess from {p.basis}, not a schedule.
    </p>
  )
}

function fmtClock2(ts: number): string {
  const d = new Date(ts)
  const h = d.getHours()
  const m = d.getMinutes()
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`
}

/** "Here's what's due" for whoever just picked the app up: one line, not a wall of warnings, and never red. */
export function HandoverBanner({ baby }: { baby: Member }) {
  const f = useFamily()
  const now = useNow(30_000)
  const g = handoverGaps(f, baby.id, now)
  if (!g.feed && !g.nappy) return null
  const bits: string[] = []
  if (g.feed) bits.push(g.feed.lastAt == null ? 'No feed logged yet' : 'A feed looks overdue')
  if (g.nappy) bits.push('Nappy count is behind for this time of day')
  return (
    <div className="handover-banner">
      <Icon name="clock" size={20} />
      <div>
        <strong>Worth a look</strong>
        <p>{bits.join(' · ')}.</p>
      </div>
    </div>
  )
}

/** The live pause/switch-side/stop feed session, if one is running, so reopening the app picks straight back up. */
export function FeedRunBanner({ baby, onStop }: { baby: Member; onStop: (feedRunId: string, opts: { minutes: number; side: 'L' | 'R' | 'both'; activeSec: number; startedTs: number; method: 'breast' | 'bottle' | 'pump' }) => void }) {
  const { act } = useApp()
  const f = useFamily()
  const me = useMe()!
  const now = useNow(1000)
  const run = activeFeedRunFor(f, baby.id, now)
  if (!run || run.method === 'bottle') return null
  const sec = feedActiveSec(run, now)
  return (
    <div className="feed-run-banner">
      <div className="fr-top">
        <span>
          {run.method === 'pump' ? 'Pumping' : `Feeding ${baby.name}`} · <b>{run.side === 'L' ? 'left' : 'right'}</b>
        </span>
        <span className="fr-clock">{fmtClock(sec)}</span>
      </div>
      <div className="fr-sides">
        <span>
          L <b>{fmtClock(Math.round(run.activeMsBySide.L / 1000) + (run.status === 'running' && run.side === 'L' ? Math.round((now - run.lastTs) / 1000) : 0))}</b>
        </span>
        <span>
          R <b>{fmtClock(Math.round(run.activeMsBySide.R / 1000) + (run.status === 'running' && run.side === 'R' ? Math.round((now - run.lastTs) / 1000) : 0))}</b>
        </span>
      </div>
      <div className="fr-actions">
        {run.status === 'running' ? (
          <>
            <button type="button" className="btn small" onClick={() => act(CA.switchFeedSide(me.id, baby.id, run.id, run.side === 'L' ? 'R' : 'L'))}>
              Switch side
            </button>
            <button type="button" className="btn small" onClick={() => act(CA.pauseFeedRun(me.id, baby.id, run.id))}>
              <Icon name="pause" size={16} /> Pause
            </button>
          </>
        ) : (
          <button type="button" className="btn small" onClick={() => act(CA.resumeFeedRun(me.id, baby.id, run.id))}>
            <Icon name="play" size={16} /> Resume
          </button>
        )}
        <button
          type="button"
          className="btn primary small"
          onClick={() => onStop(run.id, { minutes: Math.max(1, Math.round(sec / 60)), side: feedSideResult(run), activeSec: sec, startedTs: run.startedTs, method: run.method })}
        >
          <Icon name="stop" size={16} /> Stop
        </button>
      </div>
      <div className="fr-adjust">
        <span className="note">Started late, or missed a pause? Adjust:</span>
        <div className="chips small-gap">
          {[-300, -60, 60, 300].map((d) => (
            <button key={d} type="button" className="chip small" onClick={() => act(CA.adjustFeedRun(me.id, baby.id, run.id, d))}>
              {d > 0 ? '+' : ''}
              {d / 60}m
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/** A due-soon or overdue banner for something the family should check on (a treatment, a reorder). Same palette rule. */
export function DueBanner({ text, action, onAction }: { text: string; action: string; onAction: () => void }) {
  return (
    <div className="due-banner">
      <span>
        <Icon name="bell" size={18} /> {text}
      </span>
      <button type="button" className="btn small" onClick={onAction}>
        {action}
      </button>
    </div>
  )
}

export function useNavTo(path: string) {
  const nav = useNavigate()
  return () => nav(path)
}
