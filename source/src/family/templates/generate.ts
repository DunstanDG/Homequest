/**
 * Turn a template, a date and a choice of steps into dated steps. Pure: no state, no clock (today is passed in).
 *  - each step lands `offset` days before the date;
 *  - if that would put steps in the past, the whole plan is squeezed into the time left (order kept);
 *  - no day gets more than MAX_PER_DAY steps, so nobody opens Today to a wall of them.
 */
import { addDays, daysBetween } from '../dates'
import type { Member, MemberId, Ymd } from '../types'
import type { PlanTemplate, TemplateStep, Who } from './data'

export const MAX_PER_DAY = 2

export interface DatedStep {
  id: string
  title: string
  minutes: number
  who: Who
  due: Ymd
  /** The offset the template asked for, before any squeezing. */
  wanted: number
}

export interface GenInput {
  steps: readonly Pick<TemplateStep, 'id' | 'title' | 'offset' | 'minutes' | 'who'>[]
  /** The day of the thing. */
  date: Ymd
  today: Ymd
}

export function generateSteps({ steps, date, today }: GenInput): DatedStep[] {
  if (!steps.length) return []
  const target = date < today ? today : date
  const room = daysBetween(today, target)
  const latest = Math.max(...steps.map((s) => s.offset))
  // Squeeze only when something would land before today.
  const scale = latest > room && latest > 0 ? room / latest : 1
  const placed = steps
    .map((s, i) => {
      const off = s.offset > 0 ? Math.round(s.offset * scale) : s.offset
      return { s, i, day: addDays(target, -off) }
    })
    // Earliest first; equal days keep the template order.
    .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : a.i - b.i))

  const lo = today
  const hi = placed.reduce((m, p) => (p.day > m ? p.day : m), target)
  const load = new Map<Ymd, number>()
  const count = (d: Ymd) => load.get(d) ?? 0
  const out: DatedStep[] = placed.map(({ s, day }) => {
    let at: Ymd | undefined
    // Slide later first (towards the date), then earlier (but never before today).
    for (let d = day; d <= hi && !at; d = addDays(d, 1)) if (count(d) < MAX_PER_DAY) at = d
    for (let d = addDays(day, -1); d >= lo && !at; d = addDays(d, -1)) if (count(d) < MAX_PER_DAY) at = d
    if (!at) {
      // More steps than the days can hold: use the quietest day rather than lose one.
      at = day
      for (let d = lo; d <= hi; d = addDays(d, 1)) if (count(d) < count(at)) at = d
    }
    load.set(at, count(at) + 1)
    return { id: s.id, title: s.title, minutes: s.minutes, who: s.who ?? 'anyone', due: at, wanted: s.offset }
  })
  return out.sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0))
}

export const defaultSteps = (t: PlanTemplate): TemplateStep[] => t.steps.filter((s) => !s.optional)

/** "8 small steps, spread over the next 3 weeks. You'll only see the next one." */
export function previewLine(steps: readonly DatedStep[], today: Ymd): string {
  const n = steps.length
  if (!n) return 'Tick a step or two to begin, or add your own later.'
  const span = Math.max(0, daysBetween(today, steps[n - 1]!.due))
  const when =
    span <= 1 ? 'over today and tomorrow' : span < 14 ? `spread over the next ${span} days` : `spread over the next ${Math.round(span / 7)} weeks`
  return `${n} small step${n === 1 ? '' : 's'}, ${when}. You'll only see the next one.`
}

/** Who a step goes to: a parent step to the planner (or a parent), a child step to the chosen child, anyone to the planner. */
export function assigneeFor(who: Who, planner: MemberId, members: Record<string, Member>, child?: MemberId): MemberId {
  const live = Object.values(members).filter((m) => m.active !== false)
  if (who === 'child') {
    const c = child && members[child] ? child : live.find((m) => m.role === 'child')?.id
    return c ?? planner
  }
  if (who === 'parent') return members[planner]?.role === 'parent' ? planner : (live.find((m) => m.role === 'parent')?.id ?? planner)
  return planner
}
