/**
 * The top of the Care screen: one "Now" card that answers "what's the state of play?" at a glance (who's on duty,
 * when the last feed and nappy were, asleep or awake, the last 24 hours), night mode, and the day-detail sheet
 * opened from the 7-day table. Kept out of Care.tsx, which was already long.
 */
import type { ReactNode } from 'react'
import { useFamily, useNow } from '@/app/context'
import { ageDays, babyDay, babyLast24h, babyLogs, describeBaby, handoverGaps, lastBaby, lastPet, petDay, petPlan, predictNextSleep, pulseCounts, pulseTargets } from '@/family/care'
import { onDutyAt } from '@/family/shifts'
import { addDays, ago, dayName, fmtDuration, hmOf, longDay, ymdOf } from '@/family/dates'
import type { BabyEvent, Member, PetEvent } from '@/family/types'
import { Avatar } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'

// ------------------------------------------------------------------ night mode

export { useNightMode, type NightSetting } from '@/app/night'
import type { NightSetting } from '@/app/night'

export function NightToggle({ night, setting, onCycle }: { night: boolean; setting: NightSetting; onCycle: () => void }) {
  const label = setting === 'auto' ? `Night mode: automatic (${night ? 'on now' : 'off now'})` : `Night mode: ${setting}`
  return (
    <button type="button" className={`icon-btn night-toggle${night ? ' on' : ''}`} aria-label={label} title={label} onClick={onCycle}>
      <span aria-hidden="true">{night ? '🌙' : '☀️'}</span>
      {setting !== 'auto' && <small className="night-pin">•</small>}
    </button>
  )
}

// ------------------------------------------------------------------ baby

const sinceText = (at: number | undefined, now: number) => (at ? ago(at, now).replace(/ ago$/, '') : '–')

/** The time since something, big, with "ago" leading the small line under it ("2h 17m" / "ago · wet + dirty"), so it
 * reads as time since the last one rather than a duration or a count. */
function Since({ at, now, sub }: { at: number | undefined; now: number; sub: string }) {
  const t = sinceText(at, now)
  return (
    <>
      <b className="since">{t}</b>
      <small className="muted">{at && t !== 'just now' ? `ago${sub ? ` · ${sub}` : ''}` : sub}</small>
    </>
  )
}

/** Short form for a tile's small line: "40m", "8h", "2 days". */
const shortSince = (at: number, now: number) => {
  const m = Math.max(0, Math.round((now - at) / 60_000))
  return m < 60 ? `${m}m` : m < 48 * 60 ? `${Math.floor(m / 60)}h` : `${Math.floor(m / 1440)} days`
}

/** Everything you need first thing, in one card: duty, last feed and nappy, asleep/awake, and the last 24 hours. */
export function BabyNowCard({ baby, sleepingSince, onOpenDay }: { baby: Member; sleepingSince?: number; onOpenDay: (day: string) => void }) {
  const f = useFamily()
  const now = useNow(30_000)
  const duty = onDutyAt(f, baby.id, now)
  const lf = lastBaby(f, baby.id, 'feed')
  const ln = lastBaby(f, baby.id, 'nappy')
  const logs = babyLogs(f, baby.id)
  const ld = logs.find((l) => l.kind === 'nappy' && l.nappy?.dirty)
  const lastSleep = logs.find((l) => l.kind === 'sleep' && l.endAt != null)
  const days = ageDays(baby, now)
  const target = days != null ? pulseTargets(days) : undefined
  const c = pulseCounts(f, baby.id, now)
  const last24 = babyLast24h(f, baby.id, now)
  const ml = last24.reduce((s, l) => s + (l.kind === 'feed' ? (l.feed?.ml ?? 0) : 0), 0)
  const slept = Math.round(last24.reduce((s, l) => s + (l.kind === 'sleep' && l.endAt ? Math.min(l.endAt, now) - Math.max(l.at, now - 86_400_000) : 0), 0) / 60_000)
  const pred = sleepingSince ? undefined : predictNextSleep(f, baby.id, now)
  const gaps = handoverGaps(f, baby.id, now)
  const warn: string[] = []
  if (gaps.feed) warn.push(gaps.feed.lastAt == null ? 'No feed logged yet' : 'A feed looks overdue')
  if (gaps.nappy) warn.push('Nappy count is behind for this time of day')
  const low = (n: number, t?: [number, number]) => (t && n < t[0] ? ' low' : '')
  const age = baby.birthday && days != null ? ageLabel(days) : ''
  return (
    <section className="card now-card" aria-label={`${baby.name} now`}>
      <div className="now-top">
        <Avatar m={baby} size={26} />
        <div className="grow">
          <small className="muted">{age || baby.name}</small>
        </div>
        {duty && (
          <span className="now-duty" title="On duty now (from the shift rota)">
            <Avatar m={f.members[duty.parentId]} size={20} /> {f.members[duty.parentId]?.name ?? 'Someone'} until {duty.end}
          </span>
        )}
      </div>
      <div className="now-grid">
        <div>
          <small>Fed</small>
          <Since at={lf?.at} now={now} sub={lf ? describeBaby(lf) : 'nothing yet'} />
        </div>
        <div>
          <small>Nappy</small>
          <Since at={ln?.at} now={now} sub={!ln ? 'none yet' : ln.nappy?.dirty ? (ln.nappy.wet ? 'wet + dirty' : 'dirty') : ld ? `wet, dirty ${shortSince(ld.at, now)} ago` : 'wet'} />
        </div>
        <div>
          <small>{sleepingSince ? 'Asleep' : 'Awake'}</small>
          <b>{sleepingSince ? fmtDuration(Math.max(0, Math.round((now - sleepingSince) / 60_000))) : lastSleep?.endAt ? fmtDuration(Math.max(0, Math.round((now - lastSleep.endAt) / 60_000))) : '–'}</b>
          <small className="muted">{pred ? (pred.nextAt <= now ? 'sleep may be due' : `sleep likely ~${hmOf(pred.nextAt)}`) : sleepingSince ? `since ${hmOf(sleepingSince)}` : ''}</small>
        </div>
      </div>
      <button type="button" className="now-24" onClick={() => onOpenDay(ymdOf(now))} aria-label="Last 24 hours: open today's detail">
        <span className="muted">24h</span>
        <span className={low(c.feeds, target?.feeds)}>{c.feeds} feeds</span>
        <span className={low(c.wet, target?.wet)}>{c.wet} wet</span>
        <span className={low(c.dirty, target?.dirty)}>{c.dirty} dirty</span>
        {ml > 0 && <span>{ml} ml</span>}
        {slept > 0 && <span>slept {fmtDuration(slept)}</span>}
      </button>
      {warn.length > 0 && (
        <p className="now-warn">
          <Icon name="clock" size={14} /> {warn.join(' · ')}.
        </p>
      )}
    </section>
  )
}

function ageLabel(days: number): string {
  if (days < 14) return `${days} day${days === 1 ? '' : 's'} old`
  if (days < 70) return `${Math.floor(days / 7)} weeks old`
  const m = Math.floor(days / 30.4)
  return m < 24 ? `${m} months old` : `${Math.floor(m / 12)} years old`
}

/** One day in full, opened from the 7-day table: totals and every entry, with ‹ › to step through the days. */
export function BabyDaySheet({ baby, day, onDay, onClose, renderList }: { baby: Member; day: string; onDay: (d: string) => void; onClose: () => void; renderList: (logs: BabyEvent[]) => ReactNode }) {
  const f = useFamily()
  const today = ymdOf(Date.now())
  const d = babyDay(f, baby.id, day)
  const oldest = addDays(today, -29)
  return (
    <Sheet open onClose={onClose} title={day === today ? 'Today' : day === addDays(today, -1) ? 'Yesterday' : longDay(day)}>
      <div className="day-nav">
        <button type="button" className="icon-btn small" aria-label="Day before" disabled={day <= oldest} onClick={() => onDay(addDays(day, -1))}>
          <span className="arrow">‹</span>
        </button>
        <span className="muted small">{dayName(day, true)}</span>
        <button type="button" className="icon-btn small" aria-label="Day after" disabled={day >= today} onClick={() => onDay(addDays(day, 1))}>
          <span className="arrow">›</span>
        </button>
      </div>
      <div className="day-totals">
        <span>
          <b>{d.feeds.length}</b> feeds
        </span>
        <span>
          <b>{d.wet}</b> wet
        </span>
        <span>
          <b>{d.dirty}</b> dirty
        </span>
        {d.ml > 0 && (
          <span>
            <b>{d.ml}</b> ml
          </span>
        )}
        {d.breastMinutes > 0 && (
          <span>
            <b>{fmtDuration(d.breastMinutes)}</b> breast
          </span>
        )}
        {d.pumpedMl > 0 && (
          <span>
            <b>{d.pumpedMl}</b> ml pumped
          </span>
        )}
        <span>
          <b>{d.sleepMinutes ? fmtDuration(d.sleepMinutes) : '–'}</b> sleep
        </span>
      </div>
      {renderList(d.all)}
    </Sheet>
  )
}

// ------------------------------------------------------------------ dog

export function PetNowCard({ pet }: { pet: Member }) {
  const f = useFamily()
  const now = useNow(30_000)
  const d = petDay(f, pet.id, ymdOf(now))
  const plan = petPlan(f, pet.id)
  const lw = lastPet(f, pet.id, 'walk')
  const lm = lastPet(f, pet.id, 'feed')
  const lt = lastPet(f, pet.id, 'toilet')
  const by = (l?: PetEvent) => (l ? f.members[l.learnerId]?.name : undefined)
  return (
    <section className="card now-card" aria-label={`${pet.name} now`}>
      <div className="now-top">
        <Avatar m={pet} size={26} />
        <div className="grow">
          <small className="muted">{pet.petKind ?? 'Dog'}</small>
        </div>
      </div>
      <div className="now-grid">
        <div>
          <small>Walked</small>
          <Since at={lw?.at} now={now} sub={lw ? `by ${by(lw) ?? '?'}` : 'not yet'} />
        </div>
        <div>
          <small>Fed</small>
          <Since at={lm?.at} now={now} sub={lm ? `by ${by(lm) ?? '?'}` : 'not yet'} />
        </div>
        <div>
          <small>Toilet</small>
          <Since at={lt?.at} now={now} sub={lt ? (lt.poo ? 'poo' : 'wee') : 'not yet'} />
        </div>
      </div>
      <div className="now-24 static">
        <span className="muted">Today</span>
        <span className={d.walks.length < plan.walksPerDay ? 'low' : ''}>
          {d.walks.length}/{plan.walksPerDay} walks{d.walkMinutes ? ` · ${d.walkMinutes} min` : ''}
        </span>
        <span className={d.meals.length < plan.mealsPerDay ? 'low' : ''}>
          {d.meals.length}/{plan.mealsPerDay} meals
        </span>
        <span>{d.water.length} water</span>
      </div>
    </section>
  )
}

/** Entries with a "Yesterday" / day label where the date changes, so a list that runs across midnight reads clearly. */
export function withDayBreaks<T extends { at: number }>(logs: readonly T[], today: string): ({ kind: 'entry'; l: T } | { kind: 'break'; label: string })[] {
  const out: ({ kind: 'entry'; l: T } | { kind: 'break'; label: string })[] = []
  let last: string | undefined
  for (const l of logs) {
    const d = ymdOf(l.at)
    if (last !== undefined && d !== last) out.push({ kind: 'break', label: d === addDays(today, -1) ? 'Yesterday' : longDay(d) })
    if (last === undefined && d !== today) out.push({ kind: 'break', label: d === addDays(today, -1) ? 'Yesterday' : longDay(d) })
    last = d
    out.push({ kind: 'entry', l })
  }
  return out
}
