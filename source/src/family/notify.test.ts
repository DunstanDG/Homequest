import { describe, expect, it } from 'vitest'
import { tsOf } from './dates'
import { feedGapMs, LONG_SLEEP_MIN, nextFeedReminderAt } from './care'
import { feedReminderTag, sleepReminderTag, taskReminderAt, taskReminderTag, TASK_REMINDER_LEAD_MIN } from './notify'

const T = (date: string, time = '12:00') => tsOf(date, time)

describe('notify: task due reminders', () => {
  it('fires the lead time before a task with a date and a time', () => {
    const now = T('2026-09-21', '09:00')
    const fireAt = taskReminderAt('2026-09-21', '10:00', now)
    expect(fireAt).toBe(T('2026-09-21', '10:00') - TASK_REMINDER_LEAD_MIN * 60_000)
  })

  it('falls back to the due time itself if the lead would already be in the past', () => {
    const now = T('2026-09-21', '09:55')
    const fireAt = taskReminderAt('2026-09-21', '10:00', now)
    expect(fireAt).toBe(T('2026-09-21', '10:00'))
  })

  it('is undefined once the due time itself has passed', () => {
    const now = T('2026-09-21', '10:01')
    expect(taskReminderAt('2026-09-21', '10:00', now)).toBeUndefined()
  })

  it('is undefined for a task missing a date or a time', () => {
    const now = T('2026-09-21', '09:00')
    expect(taskReminderAt(undefined, '10:00', now)).toBeUndefined()
    expect(taskReminderAt('2026-09-21', undefined, now)).toBeUndefined()
  })

  it('tags are stable per id, so a later call for the same task/timer/baby supersedes', () => {
    expect(taskReminderTag('t1')).toBe(taskReminderTag('t1'))
    expect(taskReminderTag('t1')).not.toBe(taskReminderTag('t2'))
    expect(sleepReminderTag('tm1')).toBe('sleep:tm1')
    expect(feedReminderTag('baby1')).toBe('feed:baby1')
  })
})

describe('notify: sleep and feed reminder thresholds', () => {
  it('reuses the same "long nap" threshold as the sleepDurationHint toast', () => {
    expect(LONG_SLEEP_MIN).toBe(4 * 60)
  })

  it('schedules the next feed reminder using the existing age-based expected gap', () => {
    const at = T('2026-09-21', '12:00')
    expect(nextFeedReminderAt(10, at)).toBe(at + feedGapMs(10))
    expect(nextFeedReminderAt(undefined, at)).toBeUndefined()
  })
})
