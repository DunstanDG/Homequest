/**
 * Small helpers that need the calendar (so they cannot live in meals.ts, which the calendar itself uses).
 */
import { busySpans, itemsOn, type CalCtx } from './calendar'
import { toMin } from './dates'
import type { MemberId, Ymd } from './types'

/**
 * Evenings when the person cooking is out or busy at tea time (a club, a late meeting, an appointment): nights that should get
 * a quick meal. `members` are the cooks; the night counts if any of them is busy any time between 16:30 and 19:30.
 */
export function busyEvenings(ctx: CalCtx, dates: readonly Ymd[], members: readonly MemberId[]): Set<Ymd> {
  const out = new Set<Ymd>()
  const a = toMin('16:30')
  const b = toMin('19:30')
  for (const d of dates) {
    const items = itemsOn(ctx, d, { schoolDetail: 'block', skipTasks: true })
    for (const m of members) {
      if (busySpans(items, m).some((s) => s.start < b && s.end > a)) {
        out.add(d)
        break
      }
    }
  }
  return out
}
