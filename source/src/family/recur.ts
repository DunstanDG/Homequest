import { dayRange, daysBetween, monthsBetween, startOfWeek, weekday } from './dates'
import type { Recurrence, Ymd } from './types'

/** What repeating things may need to know about the school year. Both are optional. */
export interface RecurCtx {
  isSchoolDay?: (d: Ymd) => boolean
  schoolWeek?: (d: Ymd) => 'A' | 'B' | undefined
}

/** Does a repeating item that starts on `start` happen on `date`? */
export function occursOn(rule: Recurrence, start: Ymd, date: Ymd, ctx: RecurCtx = {}): boolean {
  if (date < start) return false
  if (rule.until && date > rule.until) return false
  const n = Math.max(1, Math.round(rule.interval ?? 1))
  let ok: boolean
  switch (rule.freq) {
    case 'daily':
      ok = daysBetween(start, date) % n === 0
      break
    case 'weekly': {
      const days = rule.byWeekday?.length ? rule.byWeekday : [weekday(start)]
      const weeks = Math.round(daysBetween(startOfWeek(start), startOfWeek(date)) / 7)
      ok = days.includes(weekday(date)) && weeks % n === 0
      break
    }
    case 'monthly': {
      if (monthsBetween(start, date) % n !== 0) return false
      const want = Number(start.slice(8, 10))
      const dom = Number(date.slice(8, 10))
      const last = monthLength(date)
      ok = dom === Math.min(want, last)
      break
    }
    case 'yearly': {
      if ((Number(date.slice(0, 4)) - Number(start.slice(0, 4))) % n !== 0) return false
      const sm = Number(start.slice(5, 7))
      const sd = Number(start.slice(8, 10))
      const dm = Number(date.slice(5, 7))
      const dd = Number(date.slice(8, 10))
      ok = dm === sm && dd === (sm === 2 && sd === 29 ? Math.min(sd, monthLength(date)) : sd)
      break
    }
  }
  if (!ok) return false
  if (rule.schoolDaysOnly && ctx.isSchoolDay && !ctx.isSchoolDay(date)) return false
  if (rule.schoolDaysOnly && !ctx.isSchoolDay && weekday(date) > 4) return false
  if (rule.offDaysOnly && (ctx.isSchoolDay ? ctx.isSchoolDay(date) : weekday(date) < 5)) return false
  if (rule.schoolWeek) {
    const w = ctx.schoolWeek?.(date)
    if (w !== rule.schoolWeek) return false
  }
  return true
}

function monthLength(d: Ymd): number {
  const y = Number(d.slice(0, 4))
  const m = Number(d.slice(5, 7))
  return new Date(Date.UTC(y, m, 0, 12)).getUTCDate()
}

/** All dates in [from, to] on which the item happens (skipping `exdates`). */
export function expandDates(rule: Recurrence | undefined, start: Ymd | undefined, from: Ymd, to: Ymd, exdates: Ymd[] = [], ctx: RecurCtx = {}): Ymd[] {
  if (!start) return []
  if (!rule) return start >= from && start <= to && !exdates.includes(start) ? [start] : []
  const a = from > start ? from : start
  const b = rule.until && rule.until < to ? rule.until : to
  if (b < a) return []
  return dayRange(a, b).filter((d) => !exdates.includes(d) && occursOn(rule, start, d, ctx))
}

/** Plain-English summary for list rows: "Every Monday and Wednesday", "Every 2 weeks", "School days". */
export function describeRecurrence(rule: Recurrence | undefined): string {
  if (!rule) return ''
  const n = rule.interval ?? 1
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  let s: string
  if (rule.schoolDaysOnly) s = 'School days'
  else if (rule.offDaysOnly) s = 'Weekends and holidays'
  else if (rule.freq === 'daily') s = n === 1 ? 'Every day' : `Every ${n} days`
  else if (rule.freq === 'weekly') {
    const days = rule.byWeekday?.length ? [...rule.byWeekday].sort().map((d) => names[d]).join(', ') : ''
    s = n === 1 ? (days ? `Every ${days}` : 'Every week') : n === 2 && !days ? 'Every 2 weeks' : `Every ${n} weeks${days ? ` (${days})` : ''}`
  } else if (rule.freq === 'monthly') s = n === 1 ? 'Every month' : `Every ${n} months`
  else s = n === 1 ? 'Every year' : `Every ${n} years`
  if (rule.schoolWeek) s += `, Week ${rule.schoolWeek} only`
  return s
}
