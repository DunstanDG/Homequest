/**
 * Pure logic for the push-notification triggers beyond medicine dosing (see care.ts `nextDoseAt` for that one).
 * Kept here, not in the screens, for the same reason as everything else under family/: testable without a
 * browser, and the screens just call `scheduleNotification`/`cancelNotification` (app/push.ts) with what this
 * works out. Every trigger uses a stable tag so a later call for the same thing (task edited, sleep timer
 * stopped, another feed logged) supersedes rather than piles up - see app/push.ts for the delete-then-insert.
 */
import { tsOf } from './dates'
import type { FamilyState, Hm, MemberId, Ymd } from './types'

/** How long before a task's due date+time to remind, when it has both set. */
export const TASK_REMINDER_LEAD_MIN = 15

/** How long before a calendar event's start time to remind, when it has one. */
export const EVENT_REMINDER_LEAD_MIN = 30

/** Who baby-care reminders (feed due, still asleep, next dose) go to: the active parents only, never a child's
 * phone. Each reminder is queued once per parent with that parent's member id, and the send function only delivers
 * a targeted reminder to that member's own devices. */
export const careRecipients = (f: FamilyState): MemberId[] =>
  Object.values(f.members)
    .filter((m) => m.active && m.role === 'parent')
    .map((m) => m.id)

/** The per-person tag for a reminder queued for several people: `<tag>:<memberId>`, so cancelling `<tag>:*` clears
 * everyone's copy at once. */
export const recipientTag = (tag: string, memberId: MemberId): string => `${tag}:${memberId}`

export const taskReminderTag = (taskId: string): string => `task:${taskId}`
export const sleepReminderTag = (timerId: string): string => `sleep:${timerId}`
export const feedReminderTag = (babyId: string): string => `feed:${babyId}`
/** `id` is either a calId (legacy single-reminder-per-event use, kept for anything that still calls it that way)
 * or, since calendar reminders moved to per-occurrence scheduling, an AgendaItem's own `key` - already unique per
 * source and date (`cal:<calId>:<date>`, `lesson:<memberId>:<date>:<period>`, etc. - see calendar.ts's itemsOn). */
export const eventReminderTag = (id: string): string => `event:${id}`

/** Prefix shared by every occurrence's reminder tag for one calendar event/series, so cancelling the whole thing
 * (deleted outright, not just one day skipped) can clear every future occurrence in one call without knowing
 * each of their dates. Must stay in sync with the `cal:<calId>:<date>` key format itemsOn gives calendar events. */
export const eventReminderPrefix = (calId: string): string => `event:cal:${calId}:`

/**
 * When to fire a "task due soon" reminder: `leadMin` minutes before the task's date+time. Falls back to the due
 * time itself if the lead would already be in the past (e.g. the task was set with only a few minutes to go), and
 * to undefined if even that has passed, or the task has no date or no time (nothing to remind about - "part of the
 * day" tasks have no natural fire moment).
 */
export function taskReminderAt(date: Ymd | undefined, time: Hm | undefined, now = Date.now(), leadMin = TASK_REMINDER_LEAD_MIN): number | undefined {
  if (!date || !time) return undefined
  const due = tsOf(date, time)
  const lead = due - leadMin * 60_000
  if (lead > now) return lead
  return due > now ? due : undefined
}

/**
 * When to fire a "coming up" reminder for one occurrence of a calendar item: `leadMin` minutes before its start
 * time. Same falls-back-to-the-time-itself, then undefined, behaviour as `taskReminderAt`, for the same reasons.
 * An all-day item has no start time to count down to, so it never gets a reminder (same as a homework item with
 * a date but no time). Takes one occurrence's own date/start, not the item's definition, so it works the same
 * whether or not the item repeats - see `resyncCalendarReminders` in app/calendarReminders.ts, which is what
 * actually walks every upcoming occurrence of every repeating item and calls this once per one.
 */
export function eventReminderAt(date: Ymd | undefined, start: Hm | undefined, allDay: boolean, now = Date.now(), leadMin = EVENT_REMINDER_LEAD_MIN): number | undefined {
  if (!date || !start || allDay) return undefined
  const startsAt = tsOf(date, start)
  const lead = startsAt - leadMin * 60_000
  if (lead > now) return lead
  return startsAt > now ? startsAt : undefined
}
