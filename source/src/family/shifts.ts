/**
 * Night/day care shifts: who's responsible for a baby, day vs night, this week - the answer to "who's on right
 * now" that nothing else in the app tracks. Confirmed week by week at a weekly planning moment (rather than set
 * once and forgotten) so each parent gets a predictable, fair turn at the harder overnight shift and can actually
 * plan to sleep through their nights off - see types.ts's ShiftPlanEvent for the stored shape. Pure logic only,
 * same spirit as coparent.ts; the save action creator lives in actions.ts like everywhere else.
 */
import { hmOf, startOfWeek, ymdOf } from './dates'
import type { FamilyState, Hm, MemberId, ShiftBlock, ShiftPlanEvent, Ymd } from './types'

export const shiftPlanKey = (babyId: MemberId, weekOf: Ymd): string => `${babyId}|${weekOf}`

export const DEFAULT_DAY_START: Hm = '07:00'
export const DEFAULT_NIGHT_START: Hm = '19:00'

export function shiftPlanFor(f: FamilyState, babyId: MemberId, weekOf: Ymd): ShiftPlanEvent | undefined {
  return f.shiftPlans[shiftPlanKey(babyId, weekOf)]
}

/** The most recently confirmed plan for this baby, strictly before `beforeWeek` if given - looks across every
 * confirmed week, not just the one right before, so skipping a week's planning never loses track of whose turn
 * is next. This is the basis for what gets proposed for a new week. */
export function lastConfirmedShiftPlan(f: FamilyState, babyId: MemberId, beforeWeek?: Ymd): ShiftPlanEvent | undefined {
  return Object.values(f.shiftPlans)
    .filter((p) => p.babyId === babyId && p.confirmed && (!beforeWeek || p.weekOf < beforeWeek))
    .sort((a, b) => (a.weekOf < b.weekOf ? 1 : a.weekOf > b.weekOf ? -1 : 0))[0]
}

export interface ShiftProposal {
  dayParentId: MemberId
  nightParentId: MemberId
  dayStart: Hm
  nightStart: Hm
  /** Present when the plan is a rota of blocks rather than day/night. */
  blocks?: ShiftBlock[]
}

/** What to propose for `weekOf` if nobody has confirmed anything for it yet: swap last week's confirmed plan (the
 * parent who had nights gets days, and vice versa) so the hard shift rotates automatically, or - the very first
 * time, with nothing to swap from - the two given parents in order, days first. Undefined if there aren't two
 * parents to assign. A proposal is a suggestion only; nothing is stored until it's confirmed. */
export function proposeShiftPlan(f: FamilyState, babyId: MemberId, weekOf: Ymd, parents: MemberId[]): ShiftProposal | undefined {
  const last = lastConfirmedShiftPlan(f, babyId, weekOf)
  if (last?.blocks?.length) {
    const blocks = swapParents(last.blocks)
    return { ...legacyFieldsFor(blocks), blocks }
  }
  if (last) return { dayParentId: last.nightParentId, nightParentId: last.dayParentId, dayStart: last.dayStart, nightStart: last.nightStart }
  if (parents.length < 2) return undefined
  // The first time: 4-hour blocks from 22:00, taken in turns, so both parents get a predictable stretch of sleep.
  const blocks = makeRota(DEFAULT_BLOCK_START, DEFAULT_BLOCK_HOURS, parents.slice(0, 2))
  return { ...legacyFieldsFor(blocks), blocks }
}

const toMin = (hm: Hm): number => {
  const [h, m] = hm.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/** Is this time of day inside the day shift's window? Handles the normal case (the day window sits inside one
 * calendar day, e.g. 07:00-19:00, and night is everything else, wrapping past midnight); if someone ever sets an
 * inverted pair, falls back to the sensible complement rather than misbehaving. */
export function isDayShift(hmNow: Hm, dayStart: Hm, nightStart: Hm): boolean {
  const now = toMin(hmNow)
  const ds = toMin(dayStart)
  const ns = toMin(nightStart)
  return ds <= ns ? now >= ds && now < ns : !(now >= ns && now < ds)
}

export interface OnDuty {
  parentId: MemberId
  shift: 'day' | 'night'
  plan: ShiftPlanEvent
  /** The block they're in: when it started and when it hands over. */
  start: Hm
  end: Hm
}

/** Who's actually responsible at a given moment - only once that week's plan has been confirmed; an unconfirmed
 * proposal doesn't count here (see proposeShiftPlan for what WOULD be proposed). Defaults to right now. Works for a
 * day/night plan and a rota of blocks alike. */
export function onDutyAt(f: FamilyState, babyId: MemberId, at = Date.now()): OnDuty | undefined {
  const plan = shiftPlanFor(f, babyId, startOfWeek(ymdOf(at)))
  if (!plan?.confirmed) return undefined
  const hm = hmOf(at)
  const span = spanAt(blocksOf(plan), hm)
  if (!span) return undefined
  return { parentId: span.parentId, shift: (plan.blocks?.length ? isDayShift(hm, DEFAULT_DAY_START, DEFAULT_NIGHT_START) : isDayShift(hm, plan.dayStart, plan.nightStart)) ? 'day' : 'night', plan, start: span.start, end: span.end }
}

// ------------------------------------------------------------------ rotas of blocks
//
// Some families split the 24 hours into shorter blocks rather than one day and one night shift, so each parent gets a
// predictable stretch of sleep: e.g. 4-hour blocks from 22:00 (22-02, 02-06, 06-10, 10-14, 14-18, 18-22), taken in
// turns. A plan with `blocks` uses them; an older day/night plan reads as two blocks, so everything below works on both.

/** Block lengths offered in the editor (each divides the day evenly). */
export const BLOCK_HOURS = [2, 3, 4, 6, 8, 12] as const
export const DEFAULT_BLOCK_START: Hm = '22:00'
export const DEFAULT_BLOCK_HOURS = 4

const fromMin = (m: number): Hm => {
  const x = ((m % 1440) + 1440) % 1440
  return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`
}

/** The plan as blocks in time-of-day order (starting from the earliest after midnight). */
export function blocksOf(plan: Pick<ShiftPlanEvent, 'blocks' | 'dayStart' | 'nightStart' | 'dayParentId' | 'nightParentId'>): ShiftBlock[] {
  const raw = plan.blocks?.length ? plan.blocks : [{ start: plan.dayStart, parentId: plan.dayParentId }, { start: plan.nightStart, parentId: plan.nightParentId }]
  const seen = new Set<Hm>()
  return [...raw].filter((b) => !seen.has(b.start) && seen.add(b.start)).sort((a, b) => toMin(a.start) - toMin(b.start))
}

/** Blocks every `hours` from `first`, taking turns between the parents (first parent first). */
export function makeRota(first: Hm, hours: number, parents: readonly MemberId[]): ShiftBlock[] {
  const n = Math.max(1, Math.round(24 / hours))
  const step = Math.round((24 * 60) / n)
  return Array.from({ length: n }, (_, i) => ({ start: fromMin(toMin(first) + i * step), parentId: parents[i % Math.max(1, parents.length)] ?? '' }))
}

export interface BlockSpan {
  start: Hm
  end: Hm
  parentId: MemberId
  /** Length in minutes. */
  minutes: number
}

/** Each block with its end time (the next block's start), in the plan's own order starting from `from` if given. */
export function spansOf(blocks: readonly ShiftBlock[], from?: Hm): BlockSpan[] {
  const sorted = [...blocks].sort((a, b) => toMin(a.start) - toMin(b.start))
  const spans = sorted.map((b, i) => {
    const next = sorted[(i + 1) % sorted.length]!
    const minutes = sorted.length === 1 ? 1440 : (toMin(next.start) - toMin(b.start) + 1440) % 1440 || 1440
    return { start: b.start, end: next.start, parentId: b.parentId, minutes }
  })
  const at = from ? spans.findIndex((s) => s.start === from) : -1
  return at > 0 ? [...spans.slice(at), ...spans.slice(0, at)] : spans
}

/** The block covering a time of day. */
export function spanAt(blocks: readonly ShiftBlock[], hm: Hm): BlockSpan | undefined {
  const now = toMin(hm)
  return spansOf(blocks).find((s) => {
    const a = toMin(s.start)
    return (now - a + 1440) % 1440 < s.minutes
  })
}

/** Swap the two parents throughout (the weekly rotation: whoever had the 22:00 block gets the 02:00 one, and so on). */
export function swapParents(blocks: readonly ShiftBlock[]): ShiftBlock[] {
  const ids = [...new Set(blocks.map((b) => b.parentId))]
  if (ids.length !== 2) return blocks.map((b) => ({ ...b }))
  return blocks.map((b) => ({ ...b, parentId: b.parentId === ids[0] ? ids[1]! : ids[0]! }))
}

/** Each parent's hours on duty and their longest stretch off (the most sleep the rota allows them in one go). */
export function rotaSummary(blocks: readonly ShiftBlock[]): { parentId: MemberId; onMinutes: number; longestOffMinutes: number; spans: BlockSpan[] }[] {
  const spans = spansOf(blocks)
  const ids = [...new Set(spans.map((s) => s.parentId))]
  return ids.map((id) => {
    const mine = spans.filter((s) => s.parentId === id)
    // Walk the day twice so a break that wraps past midnight is measured whole.
    let best = 0
    let run = 0
    for (const s of [...spans, ...spans]) {
      if (s.parentId === id) run = 0
      else best = Math.max(best, (run += s.minutes))
    }
    return { parentId: id, onMinutes: mine.reduce((t, s) => t + s.minutes, 0), longestOffMinutes: Math.min(best, 1440), spans: mine }
  })
}

/** Day/night fields to store alongside a block rota, so an older app reading the plan still shows something sensible. */
export function legacyFieldsFor(blocks: readonly ShiftBlock[]): Pick<ShiftPlanEvent, 'dayParentId' | 'nightParentId' | 'dayStart' | 'nightStart'> {
  const day = spanAt(blocks, '12:00')
  const night = spanAt(blocks, '00:00')
  return { dayParentId: day?.parentId ?? '', nightParentId: night?.parentId ?? day?.parentId ?? '', dayStart: DEFAULT_DAY_START, nightStart: DEFAULT_NIGHT_START }
}

/** Where to start reading a rota out, the way people say it ("10pm to 2am, 2am to 6am..."): the first shift that starts
 * from 20:00, else from 18:00, else the earliest. */
export function rotaReadingStart(blocks: readonly ShiftBlock[]): Hm | undefined {
  const spans = spansOf(blocks)
  return (spans.find((x) => x.start >= '20:00') ?? spans.find((x) => x.start >= '18:00') ?? spans[0])?.start
}
