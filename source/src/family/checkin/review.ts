/**
 * What a check-in looks back over. Evening: what this person did today (tasks, homework, sessions, family sessions, the pets and
 * plants they looked after, the baby's day for a parent) and what is still open. Morning: what is carried over, what is on today,
 * and, for a parent, how the baby's night went. Everything is read from what the app already holds; nothing is stored for it.
 */
import { itemsOn, tasksFor, type AgendaItem, type CalCtx, type TaskRow } from '../calendar'
import { babyLogs } from '../care'
import { addDays, fmtDuration, tsOf, ymdOf } from '../dates'
import { bornBabies } from '../arrival/arrival'
import { allHouseRuns } from '../house/run'
import { mealAt } from '../meals'
import { duePlants, livePlants, wateringsOf } from '../plants'
import { allRuns, runView } from '../routines'
import type { MemberId, Ymd } from '../types'

export interface ReviewLine {
  key: string
  emoji: string
  text: string
  sub?: string
}

export interface Review {
  lines: ReviewLine[]
  /** Tasks still to tick (evening: today's and anything overdue; morning: what carried over). */
  open: TaskRow[]
  /** Morning only: what is on today. */
  ahead: AgendaItem[]
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** "A, B and 2 more". */
export function shortList(items: readonly string[], max = 3): string {
  if (items.length <= max) return items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : (items[0] ?? '')
  return `${items.slice(0, max).join(', ')} and ${items.length - max} more`
}

const isDone = (r: TaskRow) => !!r.done && r.done.status !== 'rejected'

/** The baby's night: 7pm to 7am around `date`. */
export function babyNight(ctx: CalCtx, babyId: MemberId, date: Ymd): { feeds: number; nappies: number; sleepMin: number } {
  const from = tsOf(addDays(date, -1), '19:00')
  const to = tsOf(date, '07:00')
  const logs = babyLogs(ctx.family, babyId).filter((l) => l.at < to && (l.kind === 'sleep' ? (l.endAt ?? l.at) > from : l.at >= from))
  const sleepMin = Math.round(logs.filter((l) => l.kind === 'sleep' && l.endAt != null).reduce((s, l) => s + Math.max(0, Math.min(l.endAt!, to) - Math.max(l.at, from)), 0) / 60_000)
  return { feeds: logs.filter((l) => l.kind === 'feed').length, nappies: logs.filter((l) => l.kind === 'nappy').length, sleepMin }
}

export function eveningReview(ctx: CalCtx, memberId: MemberId, date: Ymd, now: number): Review {
  const f = ctx.family
  const me = f.members[memberId]
  const rows = tasksFor(ctx, memberId, date, now)
  const done = rows.filter(isDone)
  const lines: ReviewLine[] = []
  const homework = done.filter((r) => r.task.kind === 'homework')
  const rest = done.filter((r) => r.task.kind !== 'homework')
  if (rest.length) lines.push({ key: 'tasks', emoji: '✅', text: `${plural(rest.length, 'thing')} done`, sub: shortList(rest.map((r) => r.task.title)) })
  if (homework.length)
    lines.push({
      key: 'homework',
      emoji: '📚',
      text: `${plural(homework.length, 'piece')} of homework done`,
      sub: shortList(homework.map((r) => `${r.task.subject ? `${r.task.subject}: ` : ''}${r.task.title}`)),
    })
  if (me?.role === 'child') {
    const coins = done.reduce((t, r) => t + (r.done!.coins || 0), 0)
    const waiting = done.filter((r) => r.done!.status === 'pending').reduce((t, r) => t + (r.done!.coins || 0), 0)
    if (coins > 0) lines.push({ key: 'coins', emoji: '🪙', text: `${coins} coins earned`, sub: waiting ? `${waiting} waiting for a parent to check` : undefined })
  }
  for (const r of allRuns(f).filter((x) => x.memberId === memberId && x.date === date && x.status === 'done' && x.steps.some((s) => s.status === 'done'))) {
    lines.push({ key: `run:${r.id}`, emoji: r.emoji ?? '⏱️', text: `Finished ${r.title}`, sub: fmtDuration(Math.max(1, Math.round(runView(r, now).elapsedSec / 60))) })
  }
  for (const h of allHouseRuns(f).filter((x) => x.date === date && x.people.concat(x.jobs.map((j) => j.doneBy ?? '')).includes(memberId))) {
    const n = h.jobs.filter((j) => j.status === 'done' && j.doneBy === memberId).length
    if (n > 0) lines.push({ key: `house:${h.id}`, emoji: h.emoji ?? '🏠', text: `${h.title}: ${plural(n, 'job')} done` })
  }
  const petKinds = new Map<MemberId, Map<string, number>>()
  for (const l of f.pets)
    if (l.learnerId === memberId && !f.voided[l.id] && ymdOf(l.at) === date)
      petKinds.set(l.petId, new Map([...(petKinds.get(l.petId) ?? new Map<string, number>()), [l.kind, (petKinds.get(l.petId)?.get(l.kind) ?? 0) + 1]]))
  for (const [petId, kinds] of petKinds)
    lines.push({ key: `pet:${petId}`, emoji: '🐕', text: `Looked after ${f.members[petId]?.name ?? 'the pet'}`, sub: [...kinds].map(([k, n]) => (n > 1 ? `${k} ×${n}` : k)).join(', ') })
  const watered = livePlants(f).filter((p) => wateringsOf(f, p.plantId).some((w) => w.by === memberId && ymdOf(w.at) === date))
  if (watered.length) lines.push({ key: 'plants', emoji: '🪴', text: `Watered ${shortList(watered.map((p) => p.name))}` })
  if (me?.role === 'parent') {
    for (const b of bornBabies(f)) {
      const logs = babyLogs(f, b.id).filter((l) => ymdOf(l.at) === date)
      const feeds = logs.filter((l) => l.kind === 'feed').length
      const nappies = logs.filter((l) => l.kind === 'nappy').length
      const sleep = Math.round(logs.filter((l) => l.kind === 'sleep' && l.endAt != null).reduce((s, l) => s + Math.max(0, l.endAt! - l.at), 0) / 60_000)
      if (feeds + nappies + sleep > 0)
        lines.push({
          key: `baby:${b.id}`,
          emoji: '👶',
          text: `${b.name}'s day`,
          sub: [plural(feeds, 'feed'), plural(nappies, 'nappy', 'nappies'), sleep ? `${fmtDuration(sleep)} sleep` : ''].filter(Boolean).join(' · ') + ' (logged by anyone)',
        })
    }
  }
  return { lines, open: rows.filter((r) => !isDone(r)), ahead: [] }
}

export function morningReview(ctx: CalCtx, memberId: MemberId, date: Ymd, now: number): Review {
  const f = ctx.family
  const me = f.members[memberId]
  const lines: ReviewLine[] = []
  const rows = tasksFor(ctx, memberId, date, now)
  const yesterday = tasksFor(ctx, memberId, addDays(date, -1), now).filter(isDone).length
  if (yesterday > 0) lines.push({ key: 'yesterday', emoji: '✅', text: `Yesterday: ${plural(yesterday, 'thing')} done` })
  if (me?.role === 'parent') {
    for (const b of bornBabies(f)) {
      const n = babyNight(ctx, b.id, date)
      if (n.feeds + n.nappies + n.sleepMin > 0)
        lines.push({
          key: `night:${b.id}`,
          emoji: '🌙',
          text: `${b.name}'s night (7pm to 7am)`,
          sub: [plural(n.feeds, 'feed'), plural(n.nappies, 'nappy', 'nappies'), n.sleepMin ? `${fmtDuration(n.sleepMin)} sleep` : ''].filter(Boolean).join(' · '),
        })
    }
  }
  const ahead = itemsOn(ctx, date, { members: [memberId], skipTasks: false, schoolDetail: me?.role === 'child' ? 'lessons' : 'block' }).filter((i) => i.source !== 'task' || !!i.start)
  const today = rows.filter((r) => !isDone(r) && !r.overdue)
  if (today.length) lines.push({ key: 'today', emoji: '☑️', text: `${plural(today.length, 'task')} today`, sub: shortList(today.map((r) => r.task.title)) })
  const dinner = mealAt(f, date, 'dinner')
  if (dinner) lines.push({ key: 'dinner', emoji: '🍽️', text: `Dinner: ${dinner.title}` })
  const thirsty = duePlants(f, now).length
  if (thirsty && me?.role === 'parent') lines.push({ key: 'plants', emoji: '🪴', text: `${plural(thirsty, 'plant')} to water` })
  return { lines, open: rows.filter((r) => r.overdue && !isDone(r)), ahead }
}
