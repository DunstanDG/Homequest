/**
 * Morning and evening check-ins: when each opens for a person, whether it has been done, and how people have been feeling.
 * A check-in is "done" when it is finished (the `checkin` event); ticking habits or adding things on the way does not count
 * on its own, so a person can leave halfway and come back.
 */
import { addDays, hmOf, toMin, tsOf, ymdOf } from '../dates'
import type { DayType } from './dayType'
import type { CheckinConfigEvent, CheckinEvent, CheckinPart, FamilyState, Hm, Member, MemberId, Ymd } from '../types'

export type CheckinConfig = Pick<CheckinConfigEvent, 'enabled' | 'morningFrom' | 'morningUntil' | 'eveningFrom' | 'remind'>

export const DEFAULT_CHECKIN: CheckinConfig = { enabled: true, morningFrom: '06:00', morningUntil: '12:00', eveningFrom: '18:30', remind: false }

/** A person's check-in settings. On a weekend (or a day off school) the weekend times apply if they have any. */
export const configOf = (f: FamilyState, memberId: MemberId, type: DayType = 'weekday'): CheckinConfig => {
  const c = f.checkinConfig[memberId]
  if (!c) return DEFAULT_CHECKIN
  const w = type === 'weekend' ? c.weekend : undefined
  return { enabled: c.enabled, morningFrom: w?.morningFrom ?? c.morningFrom, morningUntil: w?.morningUntil ?? c.morningUntil, eveningFrom: w?.eveningFrom ?? c.eveningFrom, remind: c.remind }
}

/** Parents and children have check-ins; babies and pets do not. */
export const hasCheckin = (m: Pick<Member, 'role' | 'active'> | undefined): boolean => !!m && m.active && (m.role === 'parent' || m.role === 'child')

export const checkinOf = (f: FamilyState, memberId: MemberId, date: Ymd, part: CheckinPart): CheckinEvent | undefined => f.checkins[`${memberId}|${date}|${part}`]

/** Which check-in is open for this person right now (if either). The morning one runs until `morningUntil`, the evening one from `eveningFrom` to the end of the day. */
export function openPart(f: FamilyState, memberId: MemberId, now: number, type: DayType = 'weekday'): CheckinPart | undefined {
  const c = configOf(f, memberId, type)
  if (!c.enabled) return undefined
  const m = toMin(hmOf(now))
  if (m >= toMin(c.morningFrom) && m < toMin(c.morningUntil)) return 'morning'
  if (m >= toMin(c.eveningFrom)) return 'evening'
  return undefined
}

/** When the next reminder should go: the next time this check-in opens, unless it has already been done for that day. */
export function nextOpenAt(f: FamilyState, memberId: MemberId, part: CheckinPart, now: number, typeOf: (date: Ymd) => DayType = () => 'weekday'): number | undefined {
  if (!configOf(f, memberId).enabled || !configOf(f, memberId).remind) return undefined
  const fromOn = (date: Ymd): Hm => {
    const c = configOf(f, memberId, typeOf(date))
    return part === 'morning' ? c.morningFrom : c.eveningFrom
  }
  const today = ymdOf(now)
  const todayAt = tsOf(today, fromOn(today))
  const day = todayAt > now && !checkinOf(f, memberId, today, part) ? today : addDays(today, 1)
  return tsOf(day, fromOn(day))
}

/** Whether `viewer` may see how `memberId` has been feeling: a person's own, and a child's to the parents. An adult's stays their own. */
export function canSeeMood(f: FamilyState, viewer: MemberId, memberId: MemberId): boolean {
  if (viewer === memberId) return true
  return f.members[viewer]?.role === 'parent' && f.members[memberId]?.role === 'child'
}

export const MOODS: { value: number; emoji: string; label: string }[] = [
  { value: 1, emoji: '😞', label: 'Rough' },
  { value: 2, emoji: '🙁', label: 'Not great' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
]

export interface MoodDay {
  date: Ymd
  /** The evening reading if there is one, otherwise the morning's. */
  mood?: number
  note?: string
  /** What was behind the mood (from the evening check-in). */
  why?: string
}

/** The last `days` days (oldest first) of how this person said they felt. */
export function recentMoods(f: FamilyState, memberId: MemberId, today: Ymd, days = 7): MoodDay[] {
  const out: MoodDay[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i)
    const e = [checkinOf(f, memberId, date, 'evening'), checkinOf(f, memberId, date, 'morning')].find((x) => x?.mood != null)
    out.push({ date, mood: e?.mood, note: e?.note, why: checkinOf(f, memberId, date, 'evening')?.why })
  }
  return out
}
