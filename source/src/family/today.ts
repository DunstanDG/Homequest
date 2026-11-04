import { toMin, hmOf } from './dates'
import type { AgendaItem } from './calendar'
import type { Hm } from './types'

export interface NowNext {
  current?: AgendaItem
  next?: AgendaItem
}

/** From a day's agenda, what is happening now and what is next (timed items only). */
export function nowNext(items: AgendaItem[], now: number): NowNext {
  const m = toMin(hmOf(now) as Hm)
  const timed = items.filter((i) => !i.allDay && i.start)
  const current = timed.find((i) => toMin(i.start!) <= m && m < (i.end ? toMin(i.end) : toMin(i.start!) + 60))
  const next = timed.find((i) => toMin(i.start!) > m)
  return { current, next }
}

/** 'in 25 min', 'in 1h 10m', 'now' for a start time later today. */
export function untilText(start: Hm, now: number): string {
  const d = toMin(start) - toMin(hmOf(now) as Hm)
  if (d <= 0) return 'now'
  if (d < 60) return `in ${d} min`
  const h = Math.floor(d / 60)
  return `in ${h}h${d % 60 ? ` ${d % 60}m` : ''}`
}

/** 'Good morning' etc. */
export function greeting(now: number): string {
  const h = new Date(now).getHours()
  return h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}
