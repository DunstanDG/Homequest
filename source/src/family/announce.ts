/**
 * Read a task out loud when it's due (0.19). A task with `announce: true` and a time is spoken at that time, by
 * whichever announcer gets there first: an announcer device (a phone or tablet left on HomeQuest, see
 * app/announcer.tsx) or, once it supports it, the home server on the home speakers. Whoever reads it out writes a
 * `task-announced` event, so nobody says it twice.
 *
 * Calm rules: nothing during quiet hours, nothing for someone who has paused with 🌿 Calm, nothing once it's done, and
 * only around its time (never "you missed this" later on).
 */
import type { CalCtx } from './calendar'
import { tasksFor } from './calendar'
import { calmPauseOf } from './calmPause'
import { toMin } from './dates'
import * as A from './actions'
import { makeEvent } from '@/engine/make'
import type { AppEvent } from '@/engine/types'
import { isQuiet, settingsOf } from './travel/travel'
import type { FamilyState, Hm, MemberId, TaskEvent, Ymd } from './types'

/** How long after its time a task can still be read out (a device that was asleep, or polls every few seconds). */
export const ANNOUNCE_WINDOW_MIN = 5

export interface Announcement {
  /** `${taskId}|${date}` */
  key: string
  taskId: string
  memberId: MemberId
  date: Ymd
  time: Hm
  text: string
}

const NUM = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty']
const words = (n: number): string => (n < 20 ? NUM[n]! : `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${NUM[n % 10]}` : ''}`)
const hour12 = (h: number): number => (h % 12 === 0 ? 12 : h % 12)

/** The time as people say it: "half past four", "quarter to five", "twenty-five past seven", "four thirty-seven", "midday". */
export function spokenTime(hm: Hm): string {
  const [h, m] = hm.split(':').map(Number) as [number, number]
  if (m === 0) return h === 0 ? 'midnight' : h === 12 ? 'midday' : `${words(hour12(h))} o’clock`
  if (m % 5 !== 0) return `${words(hour12(h))} ${m < 10 ? `oh ${words(m)}` : words(m)}`
  const next = words(hour12(h + 1))
  if (m === 15) return `quarter past ${words(hour12(h))}`
  if (m === 30) return `half past ${words(hour12(h))}`
  if (m === 45) return `quarter to ${next}`
  return m < 30 ? `${words(m)} past ${words(hour12(h))}` : `${words(60 - m)} to ${next}`
}

/** Words a task title can start with that make "time to …" read naturally ("time to empty the dishwasher"). */
const VERBS = new Set(
  'bake bath bring brush call change check clean clear collect cook do dry dust eat empty feed fetch fill find finish fold get give go hang help hoover learn load lay make mop mow pack pay pick play practise practice prepare put read remember revise ring send set shower sort start strip take tidy turn unload vacuum walk wash water wipe write'.split(' '),
)

/** The sentence that is read out: "It's half past four. Maya, it's time to empty the dishwasher." */
export function announcementText(task: Pick<TaskEvent, 'title' | 'kind' | 'subject'>, name: string | undefined, time: Hm): string {
  const title = task.title.trim().replace(/[.!]+$/, '')
  const first = title.split(/\s+/)[0]?.toLowerCase() ?? ''
  const what = VERBS.has(first) ? `time to ${title.charAt(0).toLowerCase()}${title.slice(1)}` : `time for ${task.kind === 'homework' && task.subject && !title.toLowerCase().includes(task.subject.toLowerCase()) ? `${task.subject}: ` : ''}${title}`
  return `It’s ${spokenTime(time)}. ${name ? `${name}, it’s ` : 'It’s '}${what}.`
}

/** The day a task's time applies to: homework with a "do it on" day is read out then, not on the day it's handed in. */
const dayOf = (t: TaskEvent): Ymd | undefined => (t.kind === 'homework' && t.doOn ? t.doOn : t.date)

/**
 * Everything due to be read out now, oldest first. `nowMin` is minutes since midnight (local). Uses each person's
 * list for today, so repeats, exdates and school-day rules are the same as everywhere else.
 */
export function dueAnnouncements(ctx: CalCtx, today: Ymd, nowMin: number, now = Date.now(), windowMin = ANNOUNCE_WINDOW_MIN): Announcement[] {
  const f = ctx.family
  const settings = settingsOf(f)
  const nowHm = `${String(Math.floor(nowMin / 60)).padStart(2, '0')}:${String(nowMin % 60).padStart(2, '0')}` as Hm
  if (isQuiet(nowHm, settings)) return []
  const out: Announcement[] = []
  for (const m of Object.values(f.members)) {
    if (!m.active || (m.role !== 'parent' && m.role !== 'child')) continue
    if (calmPauseOf(f, m.id, now)) continue
    for (const row of tasksFor(ctx, m.id, today, now)) {
      const t = row.task
      if (!t.announce || !t.time) continue
      if (row.done && row.done.status !== 'rejected') continue
      if (!t.recur && dayOf(t) !== today) continue
      const at = toMin(t.time)
      if (!(at <= nowMin && nowMin - at < windowMin)) continue
      const key = `${t.taskId}|${today}`
      if (f.announced[key]) continue
      out.push({ key, taskId: t.taskId, memberId: m.id, date: today, time: t.time, text: announcementText(t, m.name, t.time) })
    }
  }
  return out.sort((a, b) => a.time.localeCompare(b.time) || a.memberId.localeCompare(b.memberId))
}

/** The next few read-outs coming up today (for the settings screen and the task form), soonest first. */
export function upcomingAnnouncements(ctx: CalCtx, today: Ymd, nowMin: number, now = Date.now(), limit = 5): Announcement[] {
  const f = ctx.family
  const out: Announcement[] = []
  for (const m of Object.values(f.members)) {
    if (!m.active || (m.role !== 'parent' && m.role !== 'child')) continue
    for (const row of tasksFor(ctx, m.id, today, now)) {
      const t = row.task
      if (!t.announce || !t.time || (row.done && row.done.status !== 'rejected')) continue
      if (!t.recur && dayOf(t) !== today) continue
      if (toMin(t.time) < nowMin) continue
      out.push({ key: `${t.taskId}|${today}`, taskId: t.taskId, memberId: m.id, date: today, time: t.time, text: announcementText(t, m.name, t.time) })
    }
  }
  return out.sort((a, b) => a.time.localeCompare(b.time)).slice(0, limit)
}

/** A sensible time to suggest when someone switches "read it out" on for a task that has no time yet. */
export function suggestAnnounceTime(part: TaskEvent['part'], nowMin: number): Hm {
  const fixed: Partial<Record<TaskEvent['part'], Hm>> = { morning: '07:30', day: '12:00', afternoon: '16:30', evening: '18:30' }
  if (fixed[part]) return fixed[part]!
  const next = Math.min(23 * 60 + 30, Math.ceil((nowMin + 15) / 30) * 30)
  return `${String(Math.floor(next / 60)).padStart(2, '0')}:${String(next % 60).padStart(2, '0')}` as Hm
}

/** Where a read-out will be heard, for the task form: the home speakers (if the server does it) and/or announcer devices. */
export function announceWhere(f: FamilyState): { speakers: boolean; devices: string[] } {
  return { speakers: !!f.travel.features?.taskAnnouncements, devices: Object.values(f.announcers).filter((d) => d.on).map((d) => d.name) }
}

/** Claim a read-out (written just before speaking, so a second device skips it). */
export const claimAnnouncement = (actor: MemberId, key: string, by: string, now = Date.now()): AppEvent[] => [makeEvent(actor, { type: 'task-announced', key, by }, now, `ann-${key}`)]

/** Register (or update) this device as an announcer. */
export const saveAnnouncer = (actor: MemberId, deviceId: string, name: string, on: boolean, now = Date.now()): AppEvent[] => [makeEvent(actor, { type: 'announcer', deviceId, name: name.trim().slice(0, 40) || 'A device', on }, now)]

/** Turn "read it out" on or off for a task, keeping everything else as it is. */
export function setTaskAnnounce(actor: MemberId, t: TaskEvent, announce: boolean, time?: Hm, now = Date.now()): AppEvent[] {
  const { id: _id, ts: _ts, day: _day, learnerId: _l, v: _v, type: _t, taskId, coins, check, ...rest } = t
  return A.saveTask(actor, { ...rest, taskId, coins, check, announce: announce || undefined, time: time ?? t.time }, now)
}

