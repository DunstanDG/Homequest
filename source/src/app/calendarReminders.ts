/**
 * Keeps a push reminder queued for every upcoming *timed* item the Calendar screen itself shows - not just
 * events made through the calendar's own "+" button, but the whole school-timetable layer (lessons, clubs,
 * school events, closures) and birthdays/arrival milestones too. Tasks keep their own separate reminder (see
 * `taskReminderAt`/`rescheduleTaskReminder`, shared.tsx) with its own wording and lead time, so they - and the
 * day-to-day routine/meal items, which aren't really "calendar" appointments - are left out here by reusing the
 * Calendar screen's own `skipTasks` option, the same split it already draws.
 *
 * This is what actually fixes a repeating item only ever getting ONE reminder, ever, for its very first
 * occurrence (which is all the old per-event single-tag scheduling could do - see notify.ts's history). Rather
 * than computing one fire time when an event is saved and never touching it again, `resyncCalendarReminders`
 * re-scans a rolling window every time it's called and queues one reminder per occurrence it finds (each tagged
 * with that occurrence's own AgendaItem.key, so different days of the same repeating item never collide). As
 * each occurrence's reminder gets used up, the next one is queued the next time this runs - on mount, on a
 * timer while the app stays open, and whenever the family's data changes (a new/edited event, right away).
 */
import { useEffect } from 'react'
import { itemsOn, type CalCtx } from '@/family/calendar'
import { addDays, dayRange, ymdOf } from '@/family/dates'
import { eventReminderAt, eventReminderTag } from '@/family/notify'
import { notifyTypeOn, useApp, useCalCtx, type Settings } from './context'
import { scheduleNotification } from './push'
import type { SyncManager } from './syncManager'

/** How far ahead to keep reminders topped up. Long enough that a family opening the app once a day or two never
 * hits a gap; short enough that each resync is a handful of fetches rather than scheduling weeks of rows that
 * would mostly need re-scheduling anyway if the item changes before then. */
const REMINDER_WINDOW_DAYS = 3

export async function resyncCalendarReminders(ctx: CalCtx, sync: SyncManager, settings: Settings, now = Date.now()): Promise<void> {
  if (!notifyTypeOn(settings, 'events')) return
  if (!sync.effectiveUrl() || !sync.effectiveAnonKey()) return // nothing to schedule against yet
  const from = ymdOf(now)
  const to = addDays(from, REMINDER_WINDOW_DAYS)
  for (const date of dayRange(from, to)) {
    for (const item of itemsOn(ctx, date, { skipTasks: true })) {
      // Travel blocks get their own leave-time and disruption alerts from the home server.
      if (item.source === 'travel') continue
      const fireAt = eventReminderAt(item.date, item.start, item.allDay, now)
      if (!fireAt) continue
      await scheduleNotification(sync, { fireAt, title: 'Coming up', body: item.title, tag: eventReminderTag(item.key) })
    }
  }
}

/** Mount once near the top of the app (see App.tsx's Shell) - keeps calendar reminders topped up for as long as
 * the app stays open, on top of the resync this triggers immediately on mount and whenever the family's data
 * changes. */
export function useCalendarReminders(): void {
  const { sync, settings } = useApp()
  const ctx = useCalCtx()
  useEffect(() => {
    let cancelled = false
    const run = () => {
      if (!cancelled) void resyncCalendarReminders(ctx, sync, settings)
    }
    run()
    const id = window.setInterval(run, 30 * 60_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [ctx, sync, settings])
}
