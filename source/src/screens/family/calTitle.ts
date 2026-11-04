import { addDays, dayOfMonth, monthName } from '@/family/dates'
import type { Ymd } from '@/family/types'

/** Heading for a week that starts on `start`: "5 – 11 Oct" inside one month, "28 Sep – 4 Oct" across two.
 * `year` is "2026", or "2025–26" when the week straddles New Year. */
export function weekTitle(start: Ymd): { title: string; year: string } {
  const end = addDays(start, 6)
  const sameMonth = start.slice(0, 7) === end.slice(0, 7)
  const title = sameMonth ? `${dayOfMonth(start)} – ${dayOfMonth(end)} ${monthName(end)}` : `${dayOfMonth(start)} ${monthName(start)} – ${dayOfMonth(end)} ${monthName(end)}`
  const y1 = start.slice(0, 4)
  const y2 = end.slice(0, 4)
  return { title, year: y1 === y2 ? y1 : `${y1}–${y2.slice(2)}` }
}
