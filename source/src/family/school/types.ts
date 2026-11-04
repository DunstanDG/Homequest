/**
 * A "school pack" is everything we know about one child's school, as plain data:
 * timetable, term dates, clubs, dated events and set homework. It is the school-side twin of a StudyQuest subject pack.
 *
 * No real school is built into the app (it is public): a family pastes its own pack on the School screen and it is kept
 * in the family's synced data. A new or corrected pack can be pasted in the same way, so termly updates need no code
 * change and no redeploy. sample.ts is a made-up school for the demo and tests.
 */
import type { Hm, Ymd } from '../types'

export type SchoolWeek = 'A' | 'B'

export interface DayPeriod {
  label: string
  start: Hm
  end: Hm
  kind: 'reg' | 'lesson' | 'break' | 'reading' | 'lunch'
  /** 1-5 for lessons: index into the timetable columns. */
  period?: number
}

/** [subject, room, teacher] */
export type PackTimetableCell = readonly [subject: string, room: string, teacher: string]

export interface PackClub {
  id: string
  name: string
  teacher: string
  /** 0 = Monday ... 4 = Friday */
  day: number
  start: Hm
  minutes?: number
  room?: string
  weekPattern?: SchoolWeek | 'every'
  /** Booked for this child. Others are just "open for sign-up". */
  booked: boolean
  note?: string
  spaces?: number | 'Full'
}

export interface PackClosure {
  start: Ymd
  end: Ymd
  name: string
  kind: 'holiday' | 'inset' | 'closed'
}

export interface PackEvent {
  date: Ymd
  time?: Hm
  endTime?: Hm
  title: string
  notes?: string
  /** Who needs to know: the child, the parents, or just a school-wide thing. */
  audience: 'child' | 'parents' | 'school'
}

export interface PackHomework {
  key: string
  subject: string
  title: string
  teacher?: string
  setOn?: Ymd
  due: Ymd
  minutes?: number
  notes?: string
}

export interface SchoolPack {
  id: string
  name: string
  version: string
  /** When the extract was made. */
  generatedOn: Ymd
  /** Label/value rows for the "School info" card (phone, absence line, payments...). */
  info: { label: string; value: string }[]
  tutorGroup?: string
  tutor?: string
  day: DayPeriod[]
  timetable: Record<SchoolWeek, PackTimetableCell[][]>
  /** A known Monday and which week it is. Other weeks are counted from here, skipping weeks with no school. */
  weekAnchor: { weekStart: Ymd; week: SchoolWeek }
  /** The pattern is only confirmed by the school up to here; later weeks follow the "consecutive, skip holidays" rule. */
  weekConfirmedThrough?: Ymd
  /** First and last day of each term for this year group (inclusive). */
  terms: { name: string; start: Ymd; end: Ymd }[]
  closures: PackClosure[]
  earlyClosures: { date: Ymd; name: string }[]
  clubs: PackClub[]
  events: PackEvent[]
  homework: PackHomework[]
  /** Which subjects set homework in which week, and the time budget. `subjectsA`/`subjectsB` are the same rule as
   * timetable subject names, for the "nothing logged for X this week" nudge; without them the subjects are read
   * out of the A/B text where they match the timetable. */
  homeworkRules?: { A: string; B: string; other?: string; subjectsA?: string[]; subjectsB?: string[] }
  /** Subjects that need kit (shown as "pack your PE kit" the evening before). */
  kit?: Record<string, string>
  /** Things the extract could not confirm. */
  openQuestions?: string[]
}
