/**
 * Turning the release notes into what one person sees: filtered by who they are and what the family has, then
 * split into "the latest day" (in detail) and "earlier this week" (one line per area). Pure, so it's tested.
 */
import { AREA_LABEL, RELEASES, type Area, type Needs, type ReleaseNote } from './releases'

export interface Viewer {
  role: 'parent' | 'child' | string
  has: Partial<Record<Needs, boolean>>
}

/** Days a note counts as "new" for the Today banner. Older unseen notes are only in the history. */
export const NEW_FOR_DAYS = 7

const dayMs = 86_400_000
const ymdToMs = (d: string) => Date.parse(`${d}T12:00:00Z`)
export const daysAgo = (date: string, today: string) => Math.round((ymdToMs(today) - ymdToMs(date)) / dayMs)

/** The notes this person should ever see, newest first. Notes dated in the future (written ahead) are held back. */
export function notesFor(v: Viewer, today: string, notes: readonly ReleaseNote[] = RELEASES): ReleaseNote[] {
  const kid = v.role === 'child'
  return notes
    .filter((n) => n.date <= today)
    .filter((n) => n.audience === 'all' || (n.audience === 'child' ? kid : !kid))
    .filter((n) => !n.needs || !!v.has[n.needs])
    .sort((a, b) => b.date.localeCompare(a.date))
}

/** Unseen notes from the last week: what makes the Today banner appear. */
export function unseenRecent(v: Viewer, today: string, seen: ReadonlySet<string>, notes?: readonly ReleaseNote[]): ReleaseNote[] {
  return notesFor(v, today, notes).filter((n) => !seen.has(n.id) && daysAgo(n.date, today) < NEW_FOR_DAYS)
}

export interface AreaLine {
  area: Area
  label: string
  emoji: string
  items: string[]
}

export interface WhatsNew {
  /** The day shown in detail: the newest day with unseen notes (or simply the newest day). */
  day?: string
  features: ReleaseNote[]
  fixes: ReleaseNote[]
  /** The rest of the last 7 days, one line per area, high level. */
  week: AreaLine[]
  weekFixes: number
}

/**
 * What the sheet shows. The detail is one day's worth (deploying several times that day just adds to it); the rest
 * of the week is summarised by area so a person who was away for a few days gets the gist without a wall of text.
 */
export function whatsNew(v: Viewer, today: string, seen: ReadonlySet<string>, notes?: readonly ReleaseNote[]): WhatsNew {
  const mine = notesFor(v, today, notes)
  const recent = mine.filter((n) => daysAgo(n.date, today) < NEW_FOR_DAYS)
  const day = recent.find((n) => !seen.has(n.id))?.date ?? recent[0]?.date ?? mine[0]?.date
  const ofDay = mine.filter((n) => n.date === day)
  const rest = recent.filter((n) => n.date !== day)
  return { day, features: ofDay.filter((n) => !n.fix), fixes: ofDay.filter((n) => n.fix), week: byArea(rest.filter((n) => !n.fix)), weekFixes: rest.filter((n) => n.fix).length }
}

/** One line per area, areas in the order of their newest change, labels deduplicated. */
export function byArea(notes: readonly ReleaseNote[]): AreaLine[] {
  const out = new Map<Area, AreaLine>()
  for (const n of notes) {
    const a = out.get(n.area) ?? { area: n.area, label: AREA_LABEL[n.area].label, emoji: AREA_LABEL[n.area].emoji, items: [] }
    const label = n.short ?? n.title
    if (!a.items.includes(label)) a.items.push(label)
    out.set(n.area, a)
  }
  return [...out.values()]
}

/** Release history for the News screen: every note this person can see, grouped by week (Monday first). */
export function historyByWeek(v: Viewer, today: string, notes?: readonly ReleaseNote[]): { weekOf: string; lines: AreaLine[]; fixes: number }[] {
  const weeks = new Map<string, ReleaseNote[]>()
  for (const n of notesFor(v, today, notes)) {
    const d = new Date(ymdToMs(n.date))
    const monday = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * dayMs).toISOString().slice(0, 10)
    weeks.set(monday, [...(weeks.get(monday) ?? []), n])
  }
  return [...weeks.entries()].map(([weekOf, ns]) => ({ weekOf, lines: byArea(ns.filter((n) => !n.fix)), fixes: ns.filter((n) => n.fix).length }))
}

/** "today", "yesterday", "on Friday", "on 28 Sep". */
export function dayWord(date: string, today: string): string {
  const n = daysAgo(date, today)
  if (n <= 0) return 'today'
  if (n === 1) return 'yesterday'
  const d = new Date(ymdToMs(date))
  if (n < 7) return `on ${d.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' })}`
  return `on ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}`
}
