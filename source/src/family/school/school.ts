import { addDays, cmp, dayRange, fromMin, startOfWeek, toMin, weekday } from '../dates'
import type { Hm, Ymd } from '../types'
import type { PackEvent, SchoolPack, SchoolWeek } from './types'

export type SchoolDayKind = 'school' | 'weekend' | 'holiday' | 'inset' | 'out-of-term'

export interface SchoolDayInfo {
  date: Ymd
  kind: SchoolDayKind
  /** 'Autumn half-term', 'INSET day', ... */
  label?: string
  /** Early closure name, if any. */
  early?: string
}

/** A small fixed palette, assigned to a subject by a stable hash of its name, so "Maths" is always the same colour
 * everywhere it appears on the calendar without needing per-family configuration. */
const SUBJECT_PALETTE = ['#5b8def', '#e0895b', '#4a9d6f', '#c463b0', '#d9b23c', '#5bb8c4', '#a4674f', '#7d7ce0']

export function colourForSubject(subject: string): string {
  let h = 0
  for (let i = 0; i < subject.length; i++) h = (h * 31 + subject.charCodeAt(i)) >>> 0
  return SUBJECT_PALETTE[h % SUBJECT_PALETTE.length]!
}

export interface Lesson {
  period: number
  subject: string
  room: string
  teacher: string
  start: Hm
  end: Hm
}

export interface ClubSlot {
  id: string
  name: string
  teacher: string
  start: Hm
  end: Hm
  room?: string
  note?: string
}

export interface WeekInfo {
  week: SchoolWeek
  /** True when this is beyond the range the school has confirmed (or is a guess after a gap). */
  assumed: boolean
}

export interface SchoolCalc {
  pack: SchoolPack
  day(date: Ymd): SchoolDayInfo
  isSchoolDay(date: Ymd): boolean
  weekOf(date: Ymd): WeekInfo | undefined
  lessons(date: Ymd): Lesson[]
  clubs(date: Ymd): ClubSlot[]
  events(date: Ymd): PackEvent[]
  /** e.g. ['PE kit'] for a day with PE. */
  kit(date: Ymd): string[]
  /** Next date on or after `from` when school is open. */
  nextSchoolDay(from: Ymd): Ymd | undefined
}

const flip = (w: SchoolWeek): SchoolWeek => (w === 'A' ? 'B' : 'A')
const DEFAULT_CLUB_MINUTES = 60

/**
 * Turns a school pack (plus any week corrections made in the app) into answers about a given date.
 * Week A/B follows the school's rule: weeks alternate, and a week with no school days (half-term, Christmas) is skipped.
 */
export function makeSchool(pack: SchoolPack, weekFix: Record<Ymd, SchoolWeek> = {}): SchoolCalc {
  const dayCache = new Map<Ymd, SchoolDayInfo>()

  const day = (date: Ymd): SchoolDayInfo => {
    const hit = dayCache.get(date)
    if (hit) return hit
    const early = pack.earlyClosures.find((e) => e.date === date)?.name
    let info: SchoolDayInfo
    const closure = pack.closures.find((c) => date >= c.start && date <= c.end)
    if (weekday(date) > 4) info = { date, kind: 'weekend' }
    else if (closure) info = { date, kind: closure.kind === 'inset' ? 'inset' : 'holiday', label: closure.name }
    else if (!pack.terms.some((t) => date >= t.start && date <= t.end)) info = { date, kind: 'out-of-term', label: 'School holiday' }
    else info = { date, kind: 'school', early }
    if (early && info.kind === 'school') info = { ...info, early }
    dayCache.set(date, info)
    return info
  }
  const isSchoolDay = (date: Ymd) => day(date).kind === 'school'

  const hasSchool = (monday: Ymd) => dayRange(monday, addDays(monday, 4)).some(isSchoolDay)

  // Known points: the pack's anchor plus any corrections. weekFix keys are Mondays.
  const anchors = [{ at: pack.weekAnchor.weekStart, week: pack.weekAnchor.week }, ...Object.entries(weekFix).map(([at, week]) => ({ at, week }))].sort((a, b) => cmp(a.at, b.at))
  const weekCache = new Map<Ymd, SchoolWeek | undefined>()

  const weekLabel = (monday: Ymd): SchoolWeek | undefined => {
    if (weekCache.has(monday)) return weekCache.get(monday)
    let out: SchoolWeek | undefined
    if (hasSchool(monday)) {
      const fixed = weekFix[monday]
      if (fixed) out = fixed
      else {
        // Nearest known point at or before this week; if there is none, the earliest one and count backwards.
        let base = anchors[0]!
        for (const a of anchors) if (a.at <= monday) base = a
        let w = base.week
        if (base.at <= monday) {
          for (let m = addDays(base.at, 7); m <= monday; m = addDays(m, 7)) if (hasSchool(m)) w = flip(w)
        } else {
          for (let m = addDays(base.at, -7); m >= monday; m = addDays(m, -7)) if (hasSchool(m)) w = flip(w)
        }
        out = w
      }
    }
    weekCache.set(monday, out)
    return out
  }

  const weekOf = (date: Ymd): WeekInfo | undefined => {
    const monday = startOfWeek(date)
    const week = weekLabel(monday)
    if (!week) return undefined
    const confirmed = weekFix[monday] != null || pack.weekConfirmedThrough == null || monday <= pack.weekConfirmedThrough
    return { week, assumed: !confirmed }
  }

  const lessons = (date: Ymd): Lesson[] => {
    if (!isSchoolDay(date)) return []
    const w = weekOf(date)
    if (!w) return []
    const cells = pack.timetable[w.week][weekday(date)]
    if (!cells) return []
    const out: Lesson[] = []
    for (const p of pack.day) {
      if (p.kind !== 'lesson' || !p.period) continue
      const c = cells[p.period - 1]
      if (!c) continue
      out.push({ period: p.period, subject: c[0], room: c[1], teacher: c[2], start: p.start, end: p.end })
    }
    return out
  }

  const clubs = (date: Ymd): ClubSlot[] => {
    if (!isSchoolDay(date)) return []
    const w = weekOf(date)?.week
    return pack.clubs
      .filter((c) => c.booked && c.day === weekday(date) && (!c.weekPattern || c.weekPattern === 'every' || c.weekPattern === w))
      .map((c) => ({ id: c.id, name: c.name, teacher: c.teacher, start: c.start, end: fromMin(toMin(c.start) + (c.minutes ?? DEFAULT_CLUB_MINUTES)), room: c.room, note: c.note }))
  }

  const events = (date: Ymd) => pack.events.filter((e) => e.date === date)

  const kit = (date: Ymd): string[] => {
    const need = new Set<string>()
    for (const l of lessons(date)) {
      const k = pack.kit?.[l.subject]
      if (k) need.add(k)
    }
    return [...need]
  }

  const nextSchoolDay = (from: Ymd): Ymd | undefined => {
    for (let i = 0; i < 120; i++) {
      const d = addDays(from, i)
      if (isSchoolDay(d)) return d
    }
    return undefined
  }

  return { pack, day, isSchoolDay, weekOf, lessons, clubs, events, kit, nextSchoolDay }
}

/** Basic sanity checks for a pack pasted in by hand. Returns a readable problem or null. */
export function validatePack(x: unknown): string | null {
  const p = x as Partial<SchoolPack> | null
  if (!p || typeof p !== 'object') return 'That is not a school pack (expected a JSON object).'
  if (typeof p.id !== 'string' || typeof p.name !== 'string') return 'Missing "id" or "name".'
  if (!p.timetable || !p.timetable.A || !p.timetable.B) return 'Missing the Week A / Week B timetable.'
  for (const w of ['A', 'B'] as const) {
    const t = p.timetable[w]
    if (!Array.isArray(t) || t.length !== 5 || t.some((d) => !Array.isArray(d))) return `Timetable ${w} needs five days (Mon to Fri).`
  }
  if (!p.weekAnchor || !/^\d{4}-\d{2}-\d{2}$/.test(p.weekAnchor.weekStart) || !['A', 'B'].includes(p.weekAnchor.week)) return 'Missing or invalid "weekAnchor" (a Monday and its week letter).'
  if (!Array.isArray(p.terms) || !p.terms.length) return 'Missing "terms".'
  if (!Array.isArray(p.day)) return 'Missing "day" (the period times).'
  for (const k of ['closures', 'earlyClosures', 'clubs', 'events', 'homework', 'info'] as const) if (!Array.isArray(p[k])) return `Missing "${k}" (use an empty list if there is none).`

  // Look inside the lists too. A pack is synced to every phone, so a malformed row here would crash the calendar everywhere.
  const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
  const hm = (v: unknown) => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v)
  const ymd = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
  const str = (v: unknown) => typeof v === 'string'
  for (const w of ['A', 'B'] as const)
    for (const [i, d] of p.timetable[w].entries())
      for (const c of d) if (!Array.isArray(c) || c.length < 3 || !c.slice(0, 3).every(str)) return `Timetable ${w}, day ${i + 1}: every lesson needs [subject, room, teacher] as text.`
  for (const [i, d] of (p.day as unknown[]).entries()) if (!isObj(d) || !str(d.label) || !hm(d.start) || !hm(d.end) || !['reg', 'lesson', 'break', 'reading', 'lunch'].includes(d.kind as string)) return `"day" item ${i + 1} needs label, start (HH:mm), end (HH:mm) and a kind.`
  for (const [i, t] of (p.terms as unknown[]).entries()) if (!isObj(t) || !ymd(t.start) || !ymd(t.end)) return `"terms" item ${i + 1} needs start and end dates (YYYY-MM-DD).`
  for (const [i, c] of (p.closures as unknown[]).entries()) if (!isObj(c) || !ymd(c.start) || !ymd(c.end) || !str(c.name)) return `"closures" item ${i + 1} needs start, end and name.`
  for (const [i, c] of (p.earlyClosures as unknown[]).entries()) if (!isObj(c) || !ymd(c.date) || !str(c.name)) return `"earlyClosures" item ${i + 1} needs date and name.`
  for (const [i, c] of (p.clubs as unknown[]).entries()) if (!isObj(c) || !str(c.id) || !str(c.name) || !Number.isInteger(c.day) || (c.day as number) < 0 || (c.day as number) > 4 || !hm(c.start) || typeof c.booked !== 'boolean') return `"clubs" item ${i + 1} needs id, name, day (0-4), start (HH:mm) and booked (true or false).`
  for (const [i, c] of (p.events as unknown[]).entries()) if (!isObj(c) || !ymd(c.date) || !str(c.title) || !['child', 'parents', 'school'].includes(c.audience as string) || (c.time != null && !hm(c.time)) || (c.endTime != null && !hm(c.endTime))) return `"events" item ${i + 1} needs date, title and audience.`
  for (const [i, c] of (p.homework as unknown[]).entries()) if (!isObj(c) || !str(c.key) || !str(c.subject) || !str(c.title) || !ymd(c.due)) return `"homework" item ${i + 1} needs key, subject, title and due (YYYY-MM-DD).`
  for (const [i, c] of (p.info as unknown[]).entries()) if (!isObj(c) || !str(c.label) || !str(c.value)) return `"info" item ${i + 1} needs label and value.`
  return null
}
