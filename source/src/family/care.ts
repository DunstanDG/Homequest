/** Selectors for the dog and baby trackers. Pure functions over the family state. */
import { addDays, daysBetween, dayRange, fmtDuration, hmOf, longDay, shortDay, ymdOf } from './dates'
import type { BabyEvent, BabyKind, CareDuty, FamilyState, MedRuleEvent, Member, MemberId, NappyColour, PetEvent, PetKind, Ymd } from './types'

const HOUR = 3_600_000

// ------------------------------------------------------------------------- dog

export const petLogs = (f: FamilyState, petId: MemberId): PetEvent[] => f.pets.filter((l) => l.petId === petId && !f.voided[l.id]).sort((a, b) => b.at - a.at)

export interface PetDay {
  day: Ymd
  walks: PetEvent[]
  meals: PetEvent[]
  water: PetEvent[]
  toilet: PetEvent[]
  other: PetEvent[]
  walkMinutes: number
}

export function petDay(f: FamilyState, petId: MemberId, day: Ymd): PetDay {
  const logs = petLogs(f, petId).filter((l) => ymdOf(l.at) === day)
  const by = (k: PetKind) => logs.filter((l) => l.kind === k)
  return {
    day,
    walks: by('walk'),
    meals: by('feed'),
    water: by('water'),
    toilet: by('toilet'),
    other: logs.filter((l) => !['walk', 'feed', 'water', 'toilet'].includes(l.kind)),
    walkMinutes: by('walk').reduce((s, l) => s + (l.minutes ?? 0), 0),
  }
}

export function lastPet(f: FamilyState, petId: MemberId, kind: PetKind): PetEvent | undefined {
  return petLogs(f, petId).find((l) => l.kind === kind)
}

/** Breakfast before 11, dinner from 3pm, otherwise a snack. */
export function suggestMeal(at: number): NonNullable<PetEvent['meal']> {
  const h = new Date(at).getHours()
  if (h < 11) return 'breakfast'
  if (h >= 15) return 'dinner'
  return 'snack'
}

/** If someone already did this a moment ago, return that entry, so the app can ask "Dad fed Alfie 20 min ago. Log another?" */
export function recentDuplicate(f: FamilyState, petId: MemberId, kind: PetKind, now: number, windowMs = 3 * HOUR): PetEvent | undefined {
  if (kind !== 'feed' && kind !== 'walk' && kind !== 'meds') return undefined
  const l = lastPet(f, petId, kind)
  return l && now - l.at >= 0 && now - l.at < (kind === 'walk' ? HOUR : windowMs) ? l : undefined
}

export const petPlan = (f: FamilyState, petId: MemberId) => f.members[petId]?.petPlan ?? { walksPerDay: 2, mealsPerDay: 2 }

// ------------------------------------------------------------------------ baby

export const babyLogs = (f: FamilyState, babyId: MemberId): BabyEvent[] => f.babies.filter((l) => l.babyId === babyId && !f.voided[l.id]).sort((a, b) => b.at - a.at)

export interface BabyDay {
  day: Ymd
  feeds: BabyEvent[]
  wet: number
  dirty: number
  nappies: BabyEvent[]
  sleeps: BabyEvent[]
  sleepMinutes: number
  ml: number
  breastMinutes: number
  health: BabyEvent[]
  notes: BabyEvent[]
  weights: BabyEvent[]
  pumps: BabyEvent[]
  pumpedMl: number
  /** Every entry that day (finished sleeps only), newest first. */
  all: BabyEvent[]
}

export function babyDay(f: FamilyState, babyId: MemberId, day: Ymd): BabyDay {
  const logs = babyLogs(f, babyId).filter((l) => ymdOf(l.at) === day)
  const feeds = logs.filter((l) => l.kind === 'feed')
  const nappies = logs.filter((l) => l.kind === 'nappy')
  const sleeps = logs.filter((l) => l.kind === 'sleep' && l.endAt != null)
  return {
    day,
    feeds,
    nappies,
    wet: nappies.filter((n) => n.nappy?.wet).length,
    dirty: nappies.filter((n) => n.nappy?.dirty).length,
    sleeps,
    sleepMinutes: Math.round(sleeps.reduce((s, l) => s + Math.max(0, (l.endAt ?? l.at) - l.at), 0) / 60_000),
    ml: feeds.reduce((s, l) => s + (l.feed?.ml ?? 0), 0),
    breastMinutes: feeds.reduce((s, l) => s + (l.feed?.method === 'breast' ? (l.feed.minutes ?? 0) : 0), 0),
    health: logs.filter((l) => l.kind === 'health' || l.kind === 'medicine'),
    notes: logs.filter((l) => l.kind === 'note'),
    weights: logs.filter((l) => l.kind === 'growth'),
    pumps: logs.filter((l) => l.kind === 'pump'),
    pumpedMl: logs.reduce((s, l) => s + (l.kind === 'pump' ? (l.pump?.ml ?? 0) : 0), 0),
    all: logs.filter((l) => l.kind !== 'sleep' || l.endAt != null),
  }
}

/** Everything logged for the baby in the last 24 hours (newest first): what a parent wants at 7am, across midnight. */
export function babyLast24h(f: FamilyState, babyId: MemberId, now: number): BabyEvent[] {
  // `now` may be a few seconds stale (screens refresh it on a timer), so anything just logged still counts.
  return babyLogs(f, babyId).filter((l) => l.at > now - 86_400_000 && l.at <= now + 10 * 60_000 && (l.kind !== 'sleep' || l.endAt != null))
}

/** How old the milk in stock is, oldest first: "fridge, expressed 3 days ago". Facts only; no use-by rules here. */
export function milkAges(f: FamilyState, babyId: MemberId, today: Ymd): { ml: number; location: 'fridge' | 'freezer'; days?: number }[] {
  return milkStock(f, babyId).map((l) => ({
    ml: l.ml,
    location: l.location,
    days: l.expressedDate ? Math.max(0, Math.round((Date.parse(`${today}T12:00:00Z`) - Date.parse(`${l.expressedDate}T12:00:00Z`)) / 86_400_000)) : undefined,
  }))
}

export const lastBaby = (f: FamilyState, babyId: MemberId, kind: BabyEvent['kind']): BabyEvent | undefined => babyLogs(f, babyId).find((l) => l.kind === kind)

export function babyWeek(f: FamilyState, babyId: MemberId, endDay: Ymd, days = 7): BabyDay[] {
  return dayRange(addDays(endDay, -(days - 1)), endDay).map((d) => babyDay(f, babyId, d))
}

/** Who to credit on a log row: the person set under Edit entry > Who, else "voice" for an entry made by a spoken
 * command nobody has claimed yet, else whoever's phone logged it. */
export function loggedBy(f: FamilyState, l: BabyEvent | PetEvent): { name?: string; voice?: boolean } {
  if ('by' in l && l.by) return { name: f.members[l.by]?.name }
  if ('voice' in l && l.voice) return { voice: true }
  return { name: f.members[l.learnerId]?.name }
}

/** One-line description of a baby log entry: "Bottle 90 ml", "Breast, left, 12 min", "Wet + dirty nappy". */
export function describeBaby(l: BabyEvent): string {
  switch (l.kind) {
    case 'feed': {
      const x = l.feed
      if (!x) return 'Feed'
      if (x.method === 'bottle') return `Bottle${x.ml ? ` ${x.ml} ml` : ''}${x.milk ? ` (${x.milk})` : ''}`
      if (x.method === 'solid') return `Solids${l.note ? `: ${l.note}` : ''}`
      const side = x.side === 'L' ? 'left' : x.side === 'R' ? 'right' : x.side === 'both' ? 'both sides' : ''
      return `Breast${side ? `, ${side}` : ''}${x.minutes ? `, ${x.minutes} min` : ''}`
    }
    case 'nappy':
      return l.nappy?.wet && l.nappy.dirty ? 'Wet + dirty nappy' : l.nappy?.dirty ? 'Dirty nappy' : 'Wet nappy'
    case 'sleep':
      return l.endAt ? `Sleep, ${fmtDuration(Math.round((l.endAt - l.at) / 60_000))}` : 'Sleep'
    case 'pump': {
      const p = l.pump
      const side = p?.side === 'L' ? 'left' : p?.side === 'R' ? 'right' : p?.side === 'both' ? 'both sides' : ''
      return `Pumped${p?.ml ? ` ${p.ml} ml` : ''}${side ? `, ${side}` : ''}${p?.minutes ? `, ${p.minutes} min` : ''}`
    }
    case 'medicine':
      return `${l.medicine?.name ?? 'Medicine'}${l.medicine?.ml ? ` ${l.medicine.ml} ml` : ''}${l.medicine?.mg ? ` ${l.medicine.mg} mg` : ''}`
    case 'growth':
      return l.weightKg ? `Weight ${l.weightKg} kg` : 'Growth'
    case 'health':
      return `${l.health ?? 'Health'}${l.tempC ? ` ${l.tempC}°C` : ''}`
    default:
      return l.note ?? 'Note'
  }
}

/** A plain-text summary a parent can paste into a message or read out at a health visitor appointment. */
export function babySummaryText(f: FamilyState, babyId: MemberId, endDay: Ymd, days = 7): string {
  const name = f.members[babyId]?.name ?? 'Baby'
  const rows = babyWeek(f, babyId, endDay, days)
  const lines = [`${name}: last ${days} days to ${longDay(endDay)}`]
  for (const r of rows) {
    const bits = [`${r.feeds.length} feeds${r.ml ? ` (${r.ml} ml bottle)` : ''}`, `${r.wet} wet`, `${r.dirty} dirty`]
    if (r.sleepMinutes) bits.push(`sleep ${fmtDuration(r.sleepMinutes)}`)
    lines.push(`${shortDay(r.day)}: ${bits.join(', ')}`)
  }
  const w = babyLogs(f, babyId)
    .filter((l) => l.kind === 'growth' && l.weightKg)
    .slice(0, 3)
  if (w.length) lines.push(`Weights: ${w.map((x) => `${x.weightKg} kg (${shortDay(ymdOf(x.at))})`).join(', ')}`)
  return lines.join('\n')
}

export const timeOf = (ts: number): string => hmOf(ts)

// ------------------------------------------------------------------ new (Tier 1) additions below

// ------------------------------------------------------------------ 24h pulse rings

export interface PulseTarget {
  feeds: [number, number]
  wet: [number, number]
  dirty: [number, number]
}

/** How old the baby is today, in whole days (0 on the day of birth). Undefined if not born yet or unknown. */
export function ageDays(baby: Pick<Member, 'birthday'>, now = Date.now()): number | undefined {
  if (!baby.birthday) return undefined
  const d = daysBetween(baby.birthday, ymdOf(now))
  return d >= 0 ? d : undefined
}

/**
 * Rough daily targets by age, after the NHS "how many wet/dirty nappies" guide: nappy output climbs fast in the first
 * week as feeding establishes, then settles. Feed counts follow the usual newborn-to-weaning taper. General guidance,
 * not a diagnosis: a baby outside these ranges is not necessarily a problem, and this is what the gap check leans on.
 */
export function pulseTargets(days: number): PulseTarget {
  if (days <= 0) return { feeds: [8, 12], wet: [1, 2], dirty: [1, 3] }
  if (days === 1) return { feeds: [8, 12], wet: [2, 3], dirty: [1, 3] }
  if (days === 2) return { feeds: [8, 12], wet: [3, 4], dirty: [1, 3] }
  if (days <= 4) return { feeds: [8, 12], wet: [4, 6], dirty: [2, 4] }
  if (days <= 27) return { feeds: [8, 12], wet: [6, 8], dirty: [2, 5] }
  if (days <= 180) return { feeds: [6, 9], wet: [5, 8], dirty: [1, 4] }
  return { feeds: [4, 7], wet: [4, 7], dirty: [1, 3] }
}

export interface PulseCounts {
  feeds: number
  wet: number
  dirty: number
}

/** Counts in the rolling 24 hours up to `now` (not calendar days), from the baby's logged events. */
export function pulseCounts(f: FamilyState, babyId: MemberId, now = Date.now()): PulseCounts {
  const since = now - 24 * 3_600_000
  let feeds = 0
  let wet = 0
  let dirty = 0
  for (const e of f.babies) {
    if (e.babyId !== babyId || f.voided[e.id] || e.at < since || e.at > now) continue
    if (e.kind === 'feed') feeds++
    else if (e.kind === 'nappy') {
      if (e.nappy?.wet) wet++
      if (e.nappy?.dirty) dirty++
    }
  }
  return { feeds, wet, dirty }
}

/** 0..1 (capped) fill for a ring: how far into the target range the count is. Below the minimum reads as "not there yet",
 * not "wrong" — the ring is never red, per the non-alarmist palette rule (see plan.css / care.css tokens). */
export const pulseFill = (count: number, [min]: [number, number]): number => (min <= 0 ? 1 : Math.min(1, count / min))

// ------------------------------------------------------------------ nappy colour guidance

/** What colour is typical at this age, for the gentle "does that look right?" hint (never a diagnosis). */
export function expectedNappyColours(days: number): NappyColour[] {
  if (days <= 3) return ['black', 'green']
  if (days <= 5) return ['green', 'yellow', 'brown']
  return ['yellow', 'brown']
}

/** Colours worth a gentle nudge if logged after the age they're expected, or ever (red/white always). */
export function isAnomalousNappyColour(colour: NappyColour, days: number): boolean {
  if (colour === 'red' || colour === 'white') return true
  return !expectedNappyColours(days).includes(colour) && colour !== 'other'
}

// ------------------------------------------------------------------ shift handover gap check

export interface HandoverGaps {
  feed?: { lastAt?: number; overdueBy: number }
  nappy?: { behindBy: number }
}

/** Typical newborn feed gap (used to say a feed is "overdue", and to schedule the next-feed reminder push
 * notification); loosens as the baby gets older. */
export const feedGapMs = (days: number): number => (days <= 27 ? 3.5 * 3_600_000 : days <= 180 ? 4.5 * 3_600_000 : 6 * 3_600_000)

/** When the next feed reminder should fire, given one was (or will be) logged at `at`. Undefined if the baby's age
 * isn't known (no birthday set yet), same as the other age-based guidance above. */
export function nextFeedReminderAt(days: number | undefined, at: number): number | undefined {
  return days == null ? undefined : at + feedGapMs(days)
}

/**
 * What an incoming parent should know at a glance: is a feed overdue, and is today's nappy count significantly behind
 * where the 24h target says it should be by this time of day. One check per thing, so it reads as "here's what's due",
 * not a wall of warnings.
 */
export function handoverGaps(f: FamilyState, babyId: MemberId, now = Date.now()): HandoverGaps {
  const baby = f.members[babyId]
  const days = baby ? ageDays(baby, now) : undefined
  if (days == null) return {}
  const out: HandoverGaps = {}
  const feeds = f.babies.filter((e) => e.babyId === babyId && e.kind === 'feed' && !f.voided[e.id])
  const lastFeed = feeds.reduce<number | undefined>((m, e) => (m == null || e.at > m ? e.at : m), undefined)
  const gap = feedGapMs(days)
  if (lastFeed == null || now - lastFeed > gap) out.feed = { lastAt: lastFeed, overdueBy: lastFeed == null ? gap : now - lastFeed - gap }
  const counts = pulseCounts(f, babyId, now)
  const target = pulseTargets(days)
  // "By this time of day" is a straight-line pace check against the low end of the target.
  const expectedSoFar = target.wet[0] * (Math.min(now - startOfTodayMs(now), 24 * 3_600_000) / (24 * 3_600_000))
  if (counts.wet + 1 < expectedSoFar) out.nappy = { behindBy: Math.round(expectedSoFar - counts.wet) }
  return out
}

const startOfTodayMs = (now: number): number => {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

// ------------------------------------------------------------------ medicine dosing

export const DEFAULT_MED_RULES: Pick<MedRuleEvent, 'name' | 'maxPerDay' | 'minGapHours'>[] = [
  { name: 'Paracetamol (Calpol)', maxPerDay: 4, minGapHours: 4 },
  { name: 'Ibuprofen', maxPerDay: 3, minGapHours: 6 },
  { name: 'Vitamin D drops', maxPerDay: 1, minGapHours: 20 },
]

export const liveMedRules = (f: FamilyState): MedRuleEvent[] => Object.values(f.medRules).filter((r) => !r.deleted)

export interface DoseLock {
  locked: boolean
  reason?: string
  /** When dosing would next be allowed, if locked because of the minimum gap. */
  nextAt?: number
}

/** Doses of `name` for `babyId` today (local calendar day of `now`) and since, most recent first. */
/** Doses of `name` in the rolling 24h window ending `now` — not calendar-day, so a dose at 23:50 and a check at
 * 00:05 still see each other for both the gap and daily-max guardrails. */
function dosesOf(f: FamilyState, babyId: MemberId, name: string, now: number): BabyEvent[] {
  const since = now - 24 * 3_600_000
  return f.babies.filter((e) => e.babyId === babyId && e.kind === 'medicine' && !f.voided[e.id] && e.medicine?.name === name && e.at > since && e.at <= now).sort((a, b) => b.at - a.at)
}

/** Would logging another dose of `name` now break its rule? Never a hard stop the app enforces on its own — this only
 * drives a confirm-to-override lock in the UI, since a parent always knows more than the rule does. */
export function doseLock(f: FamilyState, babyId: MemberId, name: string, now = Date.now()): DoseLock {
  const rule = liveMedRules(f).find((r) => r.name === name)
  if (!rule) return { locked: false }
  const doses = dosesOf(f, babyId, name, now)
  if (rule.maxPerDay != null && doses.length >= rule.maxPerDay) return { locked: true, reason: `Already ${doses.length} doses in the last 24h (usual max ${rule.maxPerDay}).` }
  if (rule.minGapHours != null && doses[0]) {
    const nextAt = doses[0].at + rule.minGapHours * 3_600_000
    if (nextAt > now) return { locked: true, reason: `Last dose was less than ${rule.minGapHours}h ago.`, nextAt }
  }
  return { locked: false }
}

/** When the NEXT dose of `name` would become due, given one was (or will be) taken at `at` - the same
 * `minGapHours` rule `doseLock` guards against dosing too soon with. Undefined if there's no rule for it (nothing
 * to remind about). Used to schedule the Phase 1 "next safe dose" push notification alongside logging a dose. */
export function nextDoseAt(f: FamilyState, name: string, at: number): number | undefined {
  const rule = liveMedRules(f).find((r) => r.name === name)
  return rule?.minGapHours != null ? at + rule.minGapHours * 3_600_000 : undefined
}

// ------------------------------------------------------------------ expressed milk stock

export interface MilkLot {
  key: string
  ml: number
  location: 'fridge' | 'freezer'
  expressedDate?: string
}

/** What is left in stock, oldest expressed first (use-by order), after every add/deduct so far. */
export function milkStock(f: FamilyState, babyId: MemberId): MilkLot[] {
  const lots: MilkLot[] = []
  for (const e of f.milkStock) {
    if (e.babyId !== babyId || f.voided[e.id]) continue
    if (e.action === 'add') {
      lots.push({ key: e.id, ml: e.ml, location: e.location ?? 'fridge', expressedDate: e.expressedDate })
    } else {
      let left = e.ml
      lots.sort((a, b) => (a.expressedDate ?? '').localeCompare(b.expressedDate ?? ''))
      for (const lot of lots) {
        if (left <= 0) break
        const take = Math.min(lot.ml, left)
        lot.ml -= take
        left -= take
      }
    }
  }
  return lots.filter((l) => l.ml > 0).sort((a, b) => (a.expressedDate ?? '').localeCompare(b.expressedDate ?? ''))
}

export const totalMilkMl = (f: FamilyState, babyId: MemberId): number => milkStock(f, babyId).reduce((t, l) => t + l.ml, 0)

// ------------------------------------------------------------------ feed sessions (pause / switch / stop)

export type FeedSide = 'L' | 'R'
export interface FeedRunState {
  id: string
  babyId: MemberId
  method: 'breast' | 'bottle' | 'pump'
  milk?: 'formula' | 'expressed'
  ml?: number
  status: 'running' | 'paused' | 'done'
  side: FeedSide
  startedTs: number
  lastTs: number
  endedTs?: number
  /** Active ms per side (breast only), paused time excluded. */
  activeMsBySide: Record<FeedSide, number>
}

/** Same idea as `foldRun` in routines.ts: a run is only ever appended to, and everything shown is worked out from the
 * timestamps, so it survives the phone sleeping and two phones agree. */
export function foldFeedRun(events: readonly import('./types').FeedRunEvent[], voided: Record<string, true> = {}): FeedRunState | undefined {
  const live = events.filter((e) => !voided[e.id])
  const start = live.find((e) => e.action === 'start')
  if (!start) return undefined
  const state: FeedRunState = {
    id: start.feedRunId,
    babyId: start.babyId,
    method: start.method ?? 'breast',
    milk: start.milk,
    ml: start.ml,
    status: 'running',
    side: start.side ?? 'L',
    startedTs: start.ts,
    lastTs: start.ts,
    activeMsBySide: { L: 0, R: 0 },
  }
  let segFrom = start.ts
  const close = (ts: number) => {
    if (state.status === 'running') state.activeMsBySide[state.side] += Math.max(0, ts - segFrom)
  }
  for (const e of live) {
    if (e === start) continue
    if (state.status === 'done') break
    state.lastTs = Math.max(state.lastTs, e.ts)
    if (e.action === 'pause' && state.status === 'running') {
      close(e.ts)
      state.status = 'paused'
    } else if (e.action === 'resume' && state.status === 'paused') {
      state.status = 'running'
      segFrom = e.ts
    } else if (e.action === 'switch' && state.status === 'running') {
      close(e.ts)
      state.side = e.side === 'R' ? 'R' : 'L'
      segFrom = e.ts
    } else if (e.action === 'stop') {
      close(e.ts)
      state.status = 'done'
      state.endedTs = e.ts
    } else if (e.action === 'adjust') {
      // While running, the time since the last pause/switch/start hasn't been rolled into activeMsBySide yet
      // (that only happens on the next close) - closing it here first, then reopening from this moment, means
      // the correction adds to the true elapsed time instead of replacing it. Skipping this step was the bug:
      // the not-yet-closed segment would otherwise be silently dropped, making the live "so far" total jump
      // down to roughly the size of the adjustment itself right after it was applied (most visible as a
      // reduction appearing to reset the timer), even though it would eventually catch up at the next close.
      if (state.status === 'running') {
        close(e.ts)
        segFrom = e.ts
      }
      state.activeMsBySide[state.side] = Math.max(0, state.activeMsBySide[state.side] + (e.deltaSec ?? 0) * 1000)
    }
  }
  return state
}

export const feedRunOf = (f: FamilyState, feedRunId: string): FeedRunState | undefined => {
  const evs = f.feedRuns[feedRunId]
  return evs ? foldFeedRun(evs, f.voided) : undefined
}

export const isLiveFeedRun = (r: FeedRunState): boolean => r.status !== 'done'

/** A feed run with no activity for this long is treated as forgotten, not still feeding - used both to decide
 * whether to show the "pick back up mid-feed" banner (activeFeedRunFor below) and, for the same reason, whether
 * the live feed notification (src/app/feedRunNotify.ts) should still be showing it. */
export const ABANDONED_FEED_RUN_MS = 4 * 3_600_000

/** Live feed run for this baby, if any (so a phone reopened mid-feed picks straight back up). Ignored if abandoned for
 * more than 4 hours (almost certainly forgotten, not still feeding). */
export function activeFeedRunFor(f: FamilyState, babyId: MemberId, now = Date.now()): FeedRunState | undefined {
  const runs = Object.values(f.feedRuns)
    .map((evs) => foldFeedRun(evs, f.voided))
    .filter((r): r is FeedRunState => !!r && r.babyId === babyId && isLiveFeedRun(r))
  return runs.find((r) => now - r.lastTs < ABANDONED_FEED_RUN_MS)
}

/** Total active seconds so far (both sides), excluding paused time — what gets logged as the feed's minutes. */
export function feedActiveSec(r: FeedRunState, now = Date.now()): number {
  const extra = r.status === 'running' ? now - r.lastTs : 0
  return Math.round((r.activeMsBySide.L + r.activeMsBySide.R + Math.max(0, extra)) / 1000)
}

/** Which side to log the feed under: whichever had more time, or 'both' if they were close (within 20%). */
export function feedSideResult(r: FeedRunState): 'L' | 'R' | 'both' {
  const { L, R } = r.activeMsBySide
  const total = L + R
  if (total === 0) return 'L'
  const diff = Math.abs(L - R) / total
  return diff < 0.2 ? 'both' : L > R ? 'L' : 'R'
}

export const isBabyKind = (k: string): k is BabyKind => (['feed', 'nappy', 'sleep', 'growth', 'health', 'note', 'medicine'] as BabyKind[]).includes(k as BabyKind)

// ------------------------------------------------------------------ Tier 2: timer guardrails (advisory toasts only)

/** A feed under this many seconds gets a gentle "that was quick" toast; over this many minutes gets a gentle
 * check-in toast. Newborns feed more often and briefly than older babies, hence the age split. Never blocks anything. */
export function feedDurationHint(activeSec: number, ageInDays: number | null): 'short' | 'long' | undefined {
  const shortUnder = ageInDays != null && ageInDays <= 60 ? 90 : 180 // 1.5 min under ~2 months, 3 min after
  const longOver = 45 * 60
  if (activeSec > 0 && activeSec < shortUnder) return 'short'
  if (activeSec > longOver) return 'long'
  return undefined
}

/** A nap running this long is worth a "still asleep, worth checking in?" nudge - see the sleep reminder push
 * notification scheduled alongside `startTimer` for a sleep timer, cancelled if the timer stops before then. */
export const LONG_SLEEP_MIN = 4 * 60

/** Same idea for a sleep session: a nap logged under 10 minutes, or a sleep timer still running after 4 hours. */
export function sleepDurationHint(minutes: number): 'short' | 'long' | undefined {
  if (minutes > 0 && minutes < 10) return 'short'
  if (minutes > LONG_SLEEP_MIN) return 'long'
  return undefined
}

/** The longest sleep that can be logged after the fact (a day). */
export const MAX_SLEEP_MIN = 24 * 60

export type SleepSpan = { ok: true; at: number; endAt: number } | { ok: false; reason: 'empty' | 'toolong' | 'future' }

/**
 * A sleep logged after the fact: fell asleep at `at`, slept for `minutes`. Not allowed to be empty, longer than a day,
 * or to end later than now (that's still going on: use the sleep timer).
 */
export function sleepSpan(at: number, minutes: number, now = Date.now()): SleepSpan {
  const m = Math.round(minutes)
  if (!Number.isFinite(m) || m < 1) return { ok: false, reason: 'empty' }
  if (m > MAX_SLEEP_MIN) return { ok: false, reason: 'toolong' }
  const endAt = at + m * 60_000
  if (endAt > now + 60_000) return { ok: false, reason: 'future' }
  return { ok: true, at, endAt }
}

/** A finished sleep already logged for this baby that the given span overlaps (`ignoreId`: the entry being edited). */
export function overlappingSleep(f: FamilyState, babyId: MemberId, at: number, endAt: number, ignoreId?: string): BabyEvent | undefined {
  return babyLogs(f, babyId).find((l) => l.kind === 'sleep' && l.endAt != null && l.id !== ignoreId && l.at < endAt && (l.endAt as number) > at)
}

// ------------------------------------------------------------------ Tier 2: predictive sleep scheduling

export interface SleepPrediction {
  nextAt: number
  basis: 'recent naps' | 'age-typical wake window'
}

/** Typical awake time between sleeps, by age in days — the same NHS-style "general guidance" spirit as the pulse-ring
 * targets, never a schedule. */
export function typicalWakeWindowMin(days: number): number {
  if (days <= 14) return 45
  if (days <= 60) return 75
  if (days <= 120) return 105
  return 150
}

/** "Next sleep is likely around HH:MM", from the rolling average gap between the last few sleeps, or an age-typical
 * wake window if there isn't enough history yet. Always a rough guess, labelled as such wherever it's shown. */
export function predictNextSleep(f: FamilyState, babyId: MemberId, now = Date.now()): SleepPrediction | undefined {
  const baby = f.members[babyId]
  const days = baby ? ageDays(baby, now) : undefined
  if (days == null) return undefined
  const sleeps = f.babies
    .filter((e) => e.babyId === babyId && e.kind === 'sleep' && !f.voided[e.id] && e.endAt != null)
    .sort((a, b) => b.at - a.at)
    .slice(0, 5)
  const last = sleeps[0]
  if (!last?.endAt) return undefined
  if (sleeps.length >= 2) {
    const gaps: number[] = []
    for (let i = 0; i < sleeps.length - 1; i++) {
      const cur = sleeps[i]!
      const prev = sleeps[i + 1]!
      if (cur.endAt != null) gaps.push(cur.at - prev.endAt!)
    }
    if (gaps.length) {
      const avg = gaps.reduce((s, g) => s + g, 0) / gaps.length
      return { nextAt: last.endAt + avg, basis: 'recent naps' }
    }
  }
  return { nextAt: last.endAt + typicalWakeWindowMin(days) * 60_000, basis: 'age-typical wake window' }
}

// ------------------------------------------------------------------ Tier 2: "who's on" timetable (see family/shifts.ts)

/** Blend of the age-typical feed gap and this baby's own recent average, once there's enough history to trust it
 * (at least 3 feeds in the last 24h) — the same "lean on real data once there's enough of it" idea as
 * predictNextSleep, just for feeds. Falls back to the pure age-based gap otherwise. */
export function typicalFeedGapMs(f: FamilyState, babyId: MemberId, days: number, now = Date.now()): number {
  const ageGap = feedGapMs(days)
  const recent = f.babies.filter((e) => e.babyId === babyId && e.kind === 'feed' && !f.voided[e.id] && e.at <= now && e.at > now - 24 * HOUR).sort((a, b) => b.at - a.at)
  if (recent.length < 3) return ageGap
  const gaps: number[] = []
  for (let i = 0; i < recent.length - 1; i++) gaps.push(recent[i]!.at - recent[i + 1]!.at)
  const avg = gaps.reduce((s, g) => s + g, 0) / gaps.length
  return Math.round((avg + ageGap) / 2)
}

/** The same blend predictNextSleep uses for its one "next sleep" guess, exposed on its own so a forward-looking
 * timetable can repeat it for naps further ahead than just the next one. */
export function typicalWakeGapMs(f: FamilyState, babyId: MemberId, days: number, now = Date.now()): number {
  const sleeps = f.babies
    .filter((e) => e.babyId === babyId && e.kind === 'sleep' && !f.voided[e.id] && e.endAt != null && e.at <= now)
    .sort((a, b) => b.at - a.at)
    .slice(0, 5)
  if (sleeps.length >= 2) {
    const gaps: number[] = []
    for (let i = 0; i < sleeps.length - 1; i++) {
      const cur = sleeps[i]!
      const prev = sleeps[i + 1]!
      if (cur.endAt != null) gaps.push(cur.at - prev.endAt!)
    }
    if (gaps.length) return gaps.reduce((s, g) => s + g, 0) / gaps.length
  }
  return typicalWakeWindowMin(days) * 60_000
}

/** Future timestamps spaced `gap` apart starting from `anchor`, skipping anything already due so the list only
 * shows what's actually still ahead, capped at `max` items and `until`. Shared by the feed and sleep chains below. */
function sequence(anchor: number, gap: number, now: number, until: number, max: number): number[] {
  if (gap <= 0) return []
  let t = anchor + gap
  if (t < now) t += Math.ceil((now - t) / gap) * gap
  const out: number[] = []
  for (let i = 0; i < max && t <= until; i++, t += gap) out.push(t)
  return out
}

export interface TimetableItem {
  at: number
  kind: 'feed' | 'sleep'
  /** "Feed due", "Nap likely", "Bedtime likely" or (small hours) "Back to sleep likely" — the split is cosmetic only (by time of day), not a
   * separate prediction: the same repeating wake-window guess naturally thins out to one evening block as the
   * baby's typical wake window stretches with age, with no separate "bedtime age" to configure. */
  label: string
}

/** A simple forward-looking schedule of expected feeds and naps/bedtime, for the next `horizonMs` (default 16h) —
 * the "clear and simple timetable" a parent can glance at alongside who's on shift (see shifts.ts's onDutyAt) to
 * see who's responsible for what's coming up. Always a rough guide, same spirit as predictNextSleep, and capped
 * at a handful of items so it stays something you can actually glance at rather than a wall of guesses. */
export function todayTimetable(f: FamilyState, babyId: MemberId, now = Date.now(), horizonMs = 16 * HOUR): TimetableItem[] {
  const baby = f.members[babyId]
  const days = baby ? ageDays(baby, now) : undefined
  if (days == null) return []
  const until = now + horizonMs
  const out: TimetableItem[] = []

  const feedGap = typicalFeedGapMs(f, babyId, days, now)
  const feedAnchor = lastBaby(f, babyId, 'feed')?.at ?? now
  for (const at of sequence(feedAnchor, feedGap, now, until, 8)) out.push({ at, kind: 'feed', label: 'Feed due' })

  const sleepGap = typicalWakeGapMs(f, babyId, days, now)
  const sleepAnchor = lastBaby(f, babyId, 'sleep')?.endAt ?? now
  for (const at of sequence(sleepAnchor, sleepGap, now, until, 8)) {
    const hour = new Date(at).getHours()
    out.push({ at, kind: 'sleep', label: hour >= 19 ? 'Bedtime likely' : hour < 6 ? 'Back to sleep likely' : 'Nap likely' })
  }

  return out.sort((a, b) => a.at - b.at).slice(0, 10)
}

/** Which kinds of care a child helps with. Unset means the dog and the plants (what children could already log
 * before this setting existed); the baby is only ever on when a parent turns it on. Adults look after everything. */
export function looksAfterOf(m: Pick<Member, 'role' | 'looksAfter'>): ReadonlySet<CareDuty> {
  if (m.role !== 'child') return new Set<CareDuty>(['pets', 'plants', 'baby'])
  return new Set<CareDuty>(m.looksAfter ?? ['pets', 'plants'])
}
