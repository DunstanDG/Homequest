/**
 * "Due tomorrow and not done" push alerts for homework, to the child and to each parent, at AT_RISK_ALERT_AT the
 * evening before (see family/homework.ts). Same rolling-resync approach as calendarReminders.ts: every pass looks
 * at the next few days, queues an alert for each open piece (one tag per piece per person, so a later pass just
 * replaces it) and cancels the alert for anything that has been handed in since.
 */
import { useEffect, useMemo, useRef } from 'react'
import { addDays, ymdOf } from '@/family/dates'
import { homeworkAlertAt, homeworkAlertTag, homeworkDone } from '@/family/homework'
import type { FamilyState } from '@/family/types'
import { notifyTypeOn, useApp, useFamily, type Settings } from './context'
import { cancelNotification, scheduleNotification } from './push'
import type { SyncManager } from './syncManager'

const WINDOW_DAYS = 3

export async function resyncHomeworkAlerts(f: FamilyState, sync: SyncManager, settings: Settings, now = Date.now()): Promise<void> {
  if (!sync.effectiveUrl() || !sync.effectiveAnonKey()) return
  const on = notifyTypeOn(settings, 'homework')
  const today = ymdOf(now)
  const last = addDays(today, WINDOW_DAYS)
  const parents = Object.values(f.members).filter((m) => m.active && m.role === 'parent')
  for (const t of Object.values(f.tasks)) {
    if (t.deleted || t.dropped || t.kind !== 'homework' || t.recur || !t.date || t.date < today || t.date > last) continue
    const child = f.members[t.assignee]
    if (!child) continue
    const who = [child, ...parents.filter((p) => p.id !== child.id)]
    const fireAt = on && !homeworkDone(f, t) ? homeworkAlertAt(f, t, now) : undefined
    for (const m of who) {
      const tag = homeworkAlertTag(t.taskId, m.id)
      if (!fireAt) {
        await cancelNotification(sync, tag)
        continue
      }
      const what = `${t.subject ? `${t.subject}: ` : ''}${t.title}`
      await scheduleNotification(sync, {
        memberId: m.id,
        fireAt,
        title: m.id === child.id ? 'Homework due tomorrow' : `${child.name}: homework due tomorrow`,
        body: `${what} isn't marked done yet.`,
        tag,
      })
    }
  }
}

/** What the alerts depend on, as one string - so the resync (a couple of requests per piece per person) runs when a
 * relevant piece of homework or the set of parents changes, not on every unrelated change to the family's data. */
function alertSignature(f: FamilyState, today: string): string {
  const last = addDays(today, WINDOW_DAYS)
  const pieces = Object.values(f.tasks)
    .filter((t) => !t.deleted && !t.dropped && t.kind === 'homework' && !t.recur && !!t.date && t.date >= today && t.date <= last)
    .map((t) => `${t.taskId}:${t.date}:${t.assignee}:${t.subject ?? ''}:${t.title}:${homeworkDone(f, t) ? 1 : 0}`)
    .sort()
  const parents = Object.values(f.members)
    .filter((m) => m.active && m.role === 'parent')
    .map((m) => `${m.id}:${m.name}`)
    .sort()
  return `${today}|${pieces.join(',')}|${parents.join(',')}`
}

/** Mounted once in App.tsx's Shell, next to the calendar reminders. */
export function useHomeworkAlerts(): void {
  const { sync, settings, demo } = useApp()
  const f = useFamily()
  const sig = useMemo(() => alertSignature(f, ymdOf(Date.now())), [f])
  const latest = useRef(f)
  latest.current = f
  useEffect(() => {
    if (demo) return
    let cancelled = false
    const run = () => {
      if (!cancelled) void resyncHomeworkAlerts(latest.current, sync, settings)
    }
    run()
    const id = window.setInterval(run, 30 * 60_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [sig, sync, settings, demo])
}
