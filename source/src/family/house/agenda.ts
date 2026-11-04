/**
 * Planned family sessions on the calendar and on Today. A saved session type with a date (and optionally a repeat) shows as a
 * soft item for the people who usually take part; on that day, and only that day, Today offers Start.
 */
import type { AgendaItem } from '../calendar'
import { fmtDuration, fromMin, toMin } from '../dates'
import { occursOn, type RecurCtx } from '../recur'
import type { FamilyState, HouseTypeEvent, Ymd } from '../types'
import { liveHouseTypes, planSetup, setupMinutes } from './house'
import { houseDoneOn } from './run'

export function houseTypeOccursOn(t: HouseTypeEvent, date: Ymd, rc: RecurCtx = {}): boolean {
  if (t.deleted || !t.date) return false
  if (t.recur) return occursOn(t.recur, t.date, date, rc) && !(t.exdates ?? []).includes(date)
  return t.date === date && !(t.exdates ?? []).includes(date)
}

/** Saved sessions planned for `date`. */
export const housePlannedOn = (f: FamilyState, date: Ymd, rc: RecurCtx = {}): HouseTypeEvent[] =>
  liveHouseTypes(f)
    .filter((t) => houseTypeOccursOn(t, date, rc))
    .sort((a, b) => (a.startAt ?? '99').localeCompare(b.startAt ?? '99') || a.name.localeCompare(b.name))

export function houseItemsOn(f: FamilyState, date: Ymd, rc: (m: string | undefined) => RecurCtx = () => ({})): AgendaItem[] {
  return housePlannedOn(f, date, rc(undefined)).map((t) => {
    const rooms = planSetup(f, { depth: t.depth, rooms: t.rooms, skipRoomIds: t.skipRoomIds, skipJobIds: t.skipJobIds }, date)
    const mins = setupMinutes(rooms)
    const together = t.memberIds?.length || Object.values(f.members).filter((m) => m.active && (m.role === 'parent' || m.role === 'child')).length || 1
    const each = Math.max(1, Math.ceil(mins / together))
    return {
      key: `house:${t.typeId}:${date}`,
      source: 'house',
      title: `${t.emoji ? `${t.emoji} ` : ''}${t.name}`,
      sub: `Family session · about ${fmtDuration(each)} each`,
      date,
      start: t.startAt,
      end: t.startAt ? fromMin(toMin(t.startAt) + each) : undefined,
      allDay: !t.startAt,
      members: t.memberIds ?? [],
      everyone: !t.memberIds?.length,
      category: 'session',
      busy: false,
      taskDone: houseDoneOn(f, t.typeId, date),
    } satisfies AgendaItem
  })
}
