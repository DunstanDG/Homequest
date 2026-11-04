/**
 * Brain dump, calmly: "Pick 3 for this week", a short list by default, and a quiet "Someday" for things nobody has
 * touched in a month. All of it is a view rule over the existing dump events: nothing is rewritten, nothing nags.
 */
import type { AppEvent } from '@/engine/types'
import { addDays, startOfWeek, weekday } from './dates'
import { dumpState } from './dump'
import { scheduleDump } from './planActions'
import type { DumpEvent, FamilyState, MemberId, Ymd } from './types'

export const SOMEDAY_AFTER_DAYS = 30
export const PICK_LIMIT = 3
/** How many items the list shows before "Show all". */
export const PEEK = 5
const DAY = 86_400_000
const endOfWeek0 = (s: Ymd): Ymd => addDays(startOfWeek(s), 6)

/** When somebody last touched an item (every edit, move or tick writes a new version, so this is its latest write). */
export const lastTouched = (d: DumpEvent): number => d.ts

/** Waiting for later: marked #someday, or open and untouched for 30+ days. A view rule: touching it brings it back. */
export function isSomeday(d: DumpEvent, now: number): boolean {
  return d.priority === 'someday' || now - lastTouched(d) >= SOMEDAY_AFTER_DAYS * DAY
}

/** Open items split into what is in play and what is resting. Items already on a day are never "someday". */
export function splitSomeday(f: FamilyState, items: readonly DumpEvent[], now: number): { active: DumpEvent[]; someday: DumpEvent[] } {
  const active: DumpEvent[] = []
  const someday: DumpEvent[] = []
  for (const d of items) (dumpState(f, d) === 'open' && isSomeday(d, now) ? someday : active).push(d)
  return { active, someday }
}

/** The days a pick can go on: today to the end of the week (from Saturday, to the end of next week). */
export function pickWindow(today: Ymd): Ymd[] {
  const end = weekday(today) >= 5 ? addDays(endOfWeek0(today), 7) : endOfWeek0(today)
  const out: Ymd[] = []
  for (let d = today; d <= end; d = addDays(d, 1)) out.push(d)
  return out
}

/** Items already put on a day inside the window (done or not): they are this week's picks. */
export function weekPicks(f: FamilyState, items: readonly DumpEvent[], today: Ymd): DumpEvent[] {
  const days = pickWindow(today)
  const first = days[0]!
  const last = days[days.length - 1]!
  return items.filter((d) => {
    const t = d.taskId ? f.tasks[d.taskId] : undefined
    return !!t && !t.deleted && !!t.date && t.date >= first && t.date <= last && d.status !== 'dropped'
  })
}

export interface PickView {
  /** Already on a day this week. */
  picked: DumpEvent[]
  slotsLeft: number
  /** What to choose from: the first few, then the rest behind "Show all". */
  choices: DumpEvent[]
  moreChoices: number
  /** Resting: someday items, and (once the week is full) everything not picked. */
  later: DumpEvent[]
}

export function pickView(f: FamilyState, items: readonly DumpEvent[], now: number, today: Ymd, showAll = false): PickView {
  const picked = weekPicks(f, items, today)
  const inPicked = new Set(picked.map((d) => d.itemId))
  const rest = items.filter((d) => !inPicked.has(d.itemId) && dumpState(f, d) === 'open')
  const { active, someday } = splitSomeday(f, rest, now)
  const slotsLeft = Math.max(0, PICK_LIMIT - picked.length)
  if (slotsLeft === 0) return { picked, slotsLeft, choices: [], moreChoices: 0, later: [...active, ...someday] }
  const choices = showAll ? active : active.slice(0, PEEK)
  return { picked, slotsLeft, choices, moreChoices: active.length - choices.length, later: someday }
}

/** Put up to the free slots' worth of items on days in the window. Anything beyond the limit, or off the window, is ignored. */
export function pickToWeek(actor: MemberId, f: FamilyState, picks: readonly { item: DumpEvent; date: Ymd }[], o: { today: Ymd; items: readonly DumpEvent[]; assignee: MemberId }, now = Date.now()): AppEvent[] {
  const days = new Set(pickWindow(o.today))
  const room = Math.max(0, PICK_LIMIT - weekPicks(f, o.items, o.today).length)
  const out: AppEvent[] = []
  picks
    .filter((p) => days.has(p.date))
    .slice(0, room)
    .forEach((p, n) => out.push(...scheduleDump(actor, f, p.item, { date: p.date, assignee: p.item.priv ? actor : (p.item.ownerId ?? o.assignee) }, now + n * 10)))
  return out
}
