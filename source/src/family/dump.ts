/**
 * The brain dump (backlog): things that need doing, written down without deciding when.
 *
 * Nothing here is scheduled until somebody chooses: an item can be dropped on a day (it becomes a task), added as a step to a
 * session, or turned into a session with others. Whether an item is done is worked out, not stored twice: it is done if it was
 * ticked in the list, if a session step made from it was finished, or if the task it was scheduled as was done.
 */
import type { DumpEvent, DumpPriority, FamilyState, MemberId, Member } from './types'

export interface DumpDraft {
  title: string
  area?: string
  ownerId?: MemberId
  minutes?: number
  priority?: DumpPriority
  notes?: string
  /** Private to whoever writes it (see family/privacy.ts). */
  private?: boolean
}

/** Suggested list names shown as chips when there are none yet. */
export const DEFAULT_AREAS = ['Home', 'Admin', 'Errands', 'Baby', 'Garden', 'Money']

const BULLET = /^\s*(?:(?:[-*•▪◦]|\d+[.)])\s+)?(?:\[[ xX]?\]\s+)?/

/** '~15', '~15m', '~1h', '~1h30', '~90min' or '(20m)' -> minutes, and the text with it taken out. */
function minutesFrom(text: string): { minutes: number; rest: string } | undefined {
  const pats: [RegExp, (m: RegExpExecArray) => number][] = [
    [/(?:^|\s)~\s*(\d+)\s*h(?:ours?|rs?)?\s*(\d+)?\s*(?:m|min|mins)?(?=\s|$)/i, (m) => Number(m[1]) * 60 + Number(m[2] ?? 0)],
    [/(?:^|\s)~\s*(\d+)\s*(?:m|min|mins|minutes)?(?=\s|$)/i, (m) => Number(m[1])],
    [/(?:^|\s)\(\s*(\d+)\s*(?:m|min|mins|minutes)\s*\)(?=\s|$)/i, (m) => Number(m[1])],
  ]
  for (const [re, get] of pats) {
    const m = re.exec(text)
    if (!m) continue
    const minutes = get(m)
    if (!minutes || minutes > 600) return undefined
    return { minutes, rest: `${text.slice(0, m.index)} ${text.slice(m.index + m[0].length)}`.replace(/\s+/g, ' ').trim() }
  }
  return undefined
}

const titleCase = (s: string): string => s.trim().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').replace(/^./, (c) => c.toUpperCase())

/**
 * Turn pasted or typed text into items, one per line. Everything is optional and forgiving:
 *   Book dentist #admin ~10 @Sam !       -> area Admin, 10 minutes, Sam's, high priority
 *   Home:  (a line ending in a colon)     -> the lines after it go under "Home" unless they say #other
 *   - [ ] Paint the gate #someday         -> bullets and tick boxes are ignored; #someday = not now
 * `members` lets @names be matched (first name, case-insensitive); an @name nobody matches is left in the title.
 */
export function parseDump(text: string, members: readonly Pick<Member, 'id' | 'name'>[] = []): DumpDraft[] {
  const out: DumpDraft[] = []
  let area: string | undefined
  for (const raw of text.split(/\r?\n/)) {
    let line = raw.replace(BULLET, '').trim()
    if (!line) continue
    const heading = /^#{1,3}\s+(.{1,30})$/.exec(line) ?? /^([A-Za-z][\w &/'-]{0,29}):$/.exec(line)
    if (heading) {
      area = titleCase(heading[1]!.replace(/:$/, ''))
      continue
    }
    let priority: DumpPriority | undefined
    let ownerId: MemberId | undefined
    let a = area

    line = line.replace(/(^|\s)#([A-Za-z][\w-]*)/g, (_m, sp: string, tag: string) => {
      if (tag.toLowerCase() === 'someday' || tag.toLowerCase() === 'later') priority = 'someday'
      else a = titleCase(tag)
      return sp
    })
    line = line.replace(/(^|\s)@([A-Za-z][\w'-]*)/g, (m, sp: string, name: string) => {
      const hit = members.find((x) => x.name.toLowerCase() === name.toLowerCase()) ?? members.find((x) => x.name.toLowerCase().startsWith(name.toLowerCase()) && name.length >= 3)
      if (!hit) return m
      ownerId = hit.id
      return sp
    })
    const mins = minutesFrom(line)
    if (mins) line = mins.rest
    // a "!" on its own or on the end of the line means it matters; "!!" too
    if (/(^|\s)!{1,3}(\s|$)/.test(line) || /\S!{2,}$/.test(line)) {
      priority = priority ?? 'high'
      line = line.replace(/(^|\s)!{1,3}(?=\s|$)/g, ' ').replace(/(\S)!{2,}$/, '$1')
    }
    const title = line.replace(/\s+/g, ' ').trim().replace(/^[-–—:,;]+\s*/, '')
    if (!title) continue
    out.push({ title: title.replace(/^./, (c) => c.toUpperCase()), area: a, ownerId, minutes: mins?.minutes, priority })
  }
  return out
}

// ------------------------------------------------------------------- reading

const doneCache = new WeakMap<object, { voided: object; ids: Map<string, number> }>()

/** Brain-dump items finished by ticking off a session step made from them (undone steps do not count), with when. */
export function itemsDoneBySessions(f: FamilyState): Map<string, number> {
  const hit = doneCache.get(f.runs)
  if (hit && hit.voided === f.voided) return hit.ids
  const ids = new Map<string, number>()
  for (const evs of Object.values(f.runs)) {
    const start = evs.find((e) => e.action === 'start' && !f.voided[e.id])
    if (!start?.steps) continue
    const byStep = new Map(start.steps.filter((s) => s.dumpId).map((s) => [s.id, s.dumpId!]))
    if (!byStep.size) continue
    for (const e of evs) if (e.action === 'step' && e.status === 'done' && e.stepId && !f.voided[e.id] && byStep.has(e.stepId)) ids.set(byStep.get(e.stepId)!, Math.max(e.ts, ids.get(byStep.get(e.stepId)!) ?? 0))
  }
  doneCache.set(f.runs, { voided: f.voided, ids })
  return ids
}

export type DumpState = 'open' | 'scheduled' | 'done' | 'dropped'

/** Where an item stands. `taskDone` covers the task it was scheduled as being ticked off (not rejected by a parent). */
export function dumpState(f: FamilyState, d: DumpEvent): DumpState {
  if (d.status === 'dropped') return 'dropped'
  // A step ticked off after the item was last written finishes it; putting it back (a newer write) reopens it.
  if (d.status === 'done' || (itemsDoneBySessions(f).get(d.itemId) ?? 0) > d.ts) return 'done'
  const t = d.taskId ? f.tasks[d.taskId] : undefined
  if (t && !t.deleted) {
    const done = f.done[`${t.taskId}|${t.date ?? 'any'}`]
    if (done && done.status !== 'rejected') return 'done'
    return 'scheduled'
  }
  return 'open'
}

export const liveDump = (f: FamilyState): DumpEvent[] => Object.values(f.dump).filter((d) => !d.deleted)

const PRIORITY_RANK: Record<DumpPriority, number> = { high: 0, normal: 1, someday: 2 }

export interface DumpFilter {
  area?: string
  ownerId?: MemberId
  q?: string
  /** 'open' (default) = still to do, including scheduled ones; 'done' = finished or dropped. */
  show?: 'open' | 'done'
}

/** The list to show: important first, then oldest first (so nothing sinks for ever). */
export function dumpList(f: FamilyState, o: DumpFilter = {}): DumpEvent[] {
  const q = o.q?.trim().toLowerCase()
  const show = o.show ?? 'open'
  return liveDump(f)
    .filter((d) => {
      const st = dumpState(f, d)
      if (show === 'open' ? st === 'done' || st === 'dropped' : st === 'open' || st === 'scheduled') return false
      if (o.area && (d.area ?? '') !== o.area) return false
      if (o.ownerId && d.ownerId !== o.ownerId) return false
      if (q && !`${d.title} ${d.notes ?? ''} ${d.area ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
    .sort((a, b) => PRIORITY_RANK[a.priority ?? 'normal'] - PRIORITY_RANK[b.priority ?? 'normal'] || (a.created ?? a.ts) - (b.created ?? b.ts) || (a.itemId < b.itemId ? -1 : 1))
}

/** List names in use (open items only), most used first, then the suggestions that are not used yet. */
export function areasOf(f: FamilyState): { name: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const d of liveDump(f)) {
    const st = dumpState(f, d)
    if (st === 'done' || st === 'dropped') continue
    const k = d.area ?? ''
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  const used = [...counts.entries()].filter(([k]) => k).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count }))
  const have = new Set(used.map((u) => u.name.toLowerCase()))
  return [...used, ...DEFAULT_AREAS.filter((a) => !have.has(a.toLowerCase())).map((name) => ({ name, count: 0 }))]
}

/** Count of open items, and the total minutes of the ones with an estimate. */
export function dumpTotals(f: FamilyState, items: readonly DumpEvent[]): { count: number; minutes: number; unestimated: number } {
  let minutes = 0
  let unestimated = 0
  let count = 0
  for (const d of items) {
    const st = dumpState(f, d)
    if (st === 'done' || st === 'dropped') continue
    count++
    if (d.minutes) minutes += d.minutes
    else unestimated++
  }
  return { count, minutes, unestimated }
}

/** A short line for the list row: "Admin · ~10 min · Sam". */
export function dumpMeta(d: DumpEvent, members: Record<string, Member>): string {
  return [d.area, d.minutes ? `~${d.minutes} min` : '', d.ownerId ? members[d.ownerId]?.name : ''].filter(Boolean).join(' · ')
}
