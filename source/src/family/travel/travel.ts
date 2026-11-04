/**
 * Read-side helpers for travel and alarms: settings with defaults, what is planned on a day, calendar travel
 * blocks, clashes and what is ringing. Pure functions over FamilyState so they can be unit tested.
 */
import { fromMin, toMin } from '../dates'
import { expandDates, type RecurCtx } from '../recur'
import type { CalEvent, FamilyState, Hm, MemberId, Ymd } from '../types'
import { DEFAULT_SETTINGS, type AlarmEvent, type PlaceEvent, type TravelLeg, type TravelMode, type TripEvent, type TripSpec } from './types'

export type Settings = { quietFrom: Hm; quietTo: Hm; leadMin: number; changeMin: number; walkMin: number; alertMin: number; watchHours: number; speakers: Record<MemberId, string[]> }

export function settingsOf(f: FamilyState): Settings {
  const s = f.travel.settings
  return {
    quietFrom: s?.quietFrom ?? DEFAULT_SETTINGS.quietFrom,
    quietTo: s?.quietTo ?? DEFAULT_SETTINGS.quietTo,
    leadMin: s?.leadMin ?? DEFAULT_SETTINGS.leadMin,
    changeMin: s?.changeMin ?? DEFAULT_SETTINGS.changeMin,
    walkMin: s?.walkMin ?? DEFAULT_SETTINGS.walkMin,
    alertMin: s?.alertMin ?? DEFAULT_SETTINGS.alertMin,
    watchHours: s?.watchHours ?? DEFAULT_SETTINGS.watchHours,
    speakers: s?.speakers ?? {},
  }
}

/** True once a home server has introduced itself; the travel and alarm controls stay hidden until then. */
export const serverOn = (f: FamilyState): boolean => !!f.travel.features

export const livePlaces = (f: FamilyState): PlaceEvent[] =>
  Object.values(f.travel.places)
    .filter((p) => !p.deleted)
    .sort((a, b) => (a.kind === 'home' ? -1 : b.kind === 'home' ? 1 : a.name.localeCompare(b.name)))

export function homePlaceOf(f: FamilyState, m: MemberId): PlaceEvent | undefined {
  const id = f.travel.prefs[m]?.homePlaceId
  const p = id ? f.travel.places[id] : undefined
  if (p && !p.deleted) return p
  return livePlaces(f).find((x) => x.kind === 'home')
}

export const leadMinOf = (f: FamilyState, m: MemberId): number => f.travel.prefs[m]?.leadMin ?? settingsOf(f).leadMin
export const modeOf = (f: FamilyState, m: MemberId): TravelMode => f.travel.prefs[m]?.mode ?? 'train'

export const ringIdFor = (refId: string, date: Ymd): string => `${refId}:${date}`

export const MODE_LABEL: Record<TravelMode, string> = { train: 'Train', bus: 'Bus', car: 'Car', walk: 'Walk', none: 'No travel' }
export const MODE_EMOJI: Record<TravelMode, string> = { train: '🚆', bus: '🚌', car: '🚗', walk: '🚶', none: '·' }

/** The ways of travelling this family's home server can plan: buses only once it has a journey planner for them. */
export const modesFor = (f: FamilyState): TravelMode[] => (f.travel.features?.bus ? ['train', 'bus', 'walk', 'car'] : ['train', 'walk', 'car'])

/** One planned journey on a day: from a calendar event with a trip, or a regular trip. */
export interface TripOccurrence {
  refId: string
  kind: 'cal' | 'trip'
  title: string
  date: Ymd
  members: MemberId[]
  spec: TripSpec
  /** When they need to be there. */
  arriveBy?: Hm
  /** When they leave the place again (event end, or the trip's leaveAt). */
  leaveAt?: Hm
}

const calTripOn = (c: CalEvent, date: Ymd, ctx: RecurCtx, people: MemberId[]): TripOccurrence | undefined => {
  if (c.deleted || !c.trip || c.trip.mode === 'none' || c.allDay || c.priv) return undefined
  const hit = c.recur ? expandDates(c.recur, c.date, date, date, c.exdates, ctx).length > 0 : c.date === date && !(c.exdates ?? []).includes(date)
  if (!hit) return undefined
  return { refId: c.calId, kind: 'cal', title: c.title, date, members: c.everyone ? people : c.members, spec: c.trip, arriveBy: c.trip.arriveBy ?? c.start, leaveAt: c.end }
}

const tripOn = (t: TripEvent, date: Ymd, ctx: RecurCtx): TripOccurrence | undefined => {
  if (t.deleted || t.spec.mode === 'none') return undefined
  if (!expandDates(t.recur, t.date, date, date, t.exdates, ctx).length) return undefined
  return { refId: t.tripId, kind: 'trip', title: t.title, date, members: t.members, spec: t.spec, arriveBy: t.spec.arriveBy, leaveAt: t.leaveAt }
}

/** Every journey planned for `date`, soonest first. `ctxFor` gives the school-day rules for a set of people. */
export function tripsOn(f: FamilyState, date: Ymd, ctxFor: (members: MemberId[]) => RecurCtx, people: MemberId[]): TripOccurrence[] {
  const out: TripOccurrence[] = []
  for (const c of Object.values(f.cal)) {
    const o = calTripOn(c, date, ctxFor(c.everyone ? people : c.members), people)
    if (o) out.push(o)
  }
  for (const t of Object.values(f.travel.trips)) {
    const o = tripOn(t, date, ctxFor(t.members))
    if (o) out.push(o)
  }
  return out.sort((a, b) => (a.arriveBy ?? '99').localeCompare(b.arriveBy ?? '99'))
}

/** The home server's plan for one person on one day (empty if it hasn't planned yet). */
export const legsFor = (f: FamilyState, m: MemberId, date: Ymd): TravelLeg[] => f.travel.days[`${m}|${date}`]?.legs ?? []

export const statusOf = (f: FamilyState, refId: string, date: Ymd) => f.travel.status[`${refId}|${date}`]

/** "7:42 to Haywards Heath, change for the 8:05" - the trains on a leg in a few words. */
export function hopSummary(leg: TravelLeg): string {
  if (!leg.hops?.length) return leg.mode === 'train' ? '' : leg.mode === 'walk' ? 'on foot' : leg.mode === 'car' ? 'by car' : ''
  const [first, ...rest] = leg.hops
  const fmt = (h: NonNullable<TravelLeg['hops']>[number]) => `${h.line ? `${h.line} at ` : ''}${h.dep}${h.cancelled ? ' (cancelled)' : h.late ? ` (+${h.late})` : ''}`
  let s = `${leg.mode === 'bus' ? 'Bus ' : ''}${fmt(first!)} to ${first!.to}`
  for (const h of rest) s += `, change for the ${fmt(h)}`
  if (first!.platform) s += ` · platform ${first!.platform}`
  return s
}

export const legTitle = (leg: TravelLeg): string => (leg.direction === 'back' ? `Travel home` : `Travel to ${leg.toName}`)

/** Spans in minutes for a member's travel legs on a day (for calendar blocks and clash checks). */
export function legSpan(leg: TravelLeg): { start: Hm; end: Hm } | undefined {
  if (!leg.leaveBy) return undefined
  const end = leg.arrive && toMin(leg.arrive) > toMin(leg.leaveBy) ? leg.arrive : fromMin(toMin(leg.leaveBy) + 15)
  return { start: leg.leaveBy, end }
}

export interface Clash {
  memberId: MemberId
  leg: TravelLeg
  withTitle: string
}

/**
 * Travel that runs into something else the same person is busy with. `busy` is that person's other timed, busy
 * items for the day (calendar events, school, clubs), excluding the event the leg itself serves.
 */
export function clashesFor(memberId: MemberId, legs: TravelLeg[], busy: { title: string; start: Hm; end: Hm; refId?: string }[]): Clash[] {
  const out: Clash[] = []
  for (const leg of legs) {
    const span = legSpan(leg)
    if (!span) continue
    const a = toMin(span.start)
    const b = toMin(span.end)
    const hit = busy.find((x) => x.refId !== leg.refId && toMin(x.start) < b && toMin(x.end) > a)
    if (hit) out.push({ memberId, leg, withTitle: hit.title })
  }
  return out
}

/** Alarms for one person due on a date. */
export function alarmsOn(f: FamilyState, date: Ymd, ctxFor: (members: MemberId[]) => RecurCtx): AlarmEvent[] {
  return Object.values(f.travel.alarms)
    .filter((a) => !a.deleted && expandDates(a.recur, a.date, date, date, a.exdates, ctxFor([a.memberId])).length > 0)
    .sort((a, b) => a.time.localeCompare(b.time))
}

/** What the server says is ringing right now that nobody has stopped since it started. */
export function ringingNow(f: FamilyState, date: Ymd): { refId: string; memberId?: string; note?: string; since: number }[] {
  const out: { refId: string; memberId?: string; note?: string; since: number }[] = []
  for (const s of Object.values(f.travel.status)) {
    if (s.date !== date || s.state !== 'ringing') continue
    const stopped = f.travel.stops[ringIdFor(s.refId, s.date)] ?? 0
    if (stopped >= s.ts) continue
    out.push({ refId: s.refId, memberId: s.memberId, note: s.note, since: s.ts })
  }
  return out
}

/** The latest Check connection result. */
export function lastPing(f: FamilyState): { sentTs: number; pongTs?: number; version?: string } | undefined {
  let best: { sentTs: number; pongTs?: number; version?: string } | undefined
  for (const p of Object.values(f.travel.pings)) if (!best || p.sentTs > best.sentTs) best = p
  return best
}

export const isQuiet = (time: Hm, s: Pick<Settings, 'quietFrom' | 'quietTo'>): boolean => (s.quietFrom <= s.quietTo ? time >= s.quietFrom && time < s.quietTo : time >= s.quietFrom || time < s.quietTo)
