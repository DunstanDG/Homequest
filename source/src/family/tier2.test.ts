import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import * as A from './actions'
import { feedDurationHint, predictNextSleep, sleepDurationHint } from './care'
import { commentsFor } from './comments'
import { balanceFor, goalTotal } from './economy'
import { tsOf } from './dates'
import { applyFamilyEvent, projectFamily } from './project'
import { dietaryTagsOf } from './shopping'
import { todayTrivia } from './trivia'
import type { FamilyState } from './types'

const T = (date: string, time = '12:00') => tsOf(date, time)
const HOUR = 3_600_000

function family(): FamilyState {
  const now = T('2026-09-21', '06:00')
  const events: AppEvent[] = [
    ...A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, now),
    ...A.saveMember('dad', { id: 'mum', name: 'Mum', role: 'parent', colour: '#f72585', active: true }, now + 1),
    ...A.saveMember('dad', { id: 'kid', name: 'Kid', role: 'child', colour: '#f7b32b', active: true }, now + 2),
    ...A.saveMember('dad', { id: 'robin', name: 'Robin', role: 'baby', colour: '#b388ff', active: true, birthday: '2026-09-15' }, now + 3),
  ]
  return projectFamily(events)
}
const apply = (f: FamilyState, evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, f)

describe('care: timer guardrails', () => {
  it('flags a very short feed and a very long one, but not one in between', () => {
    expect(feedDurationHint(30, 20)).toBe('short')
    expect(feedDurationHint(600, 20)).toBeUndefined()
    expect(feedDurationHint(50 * 60, 20)).toBe('long')
  })

  it('flags a very short nap and a very long one', () => {
    expect(sleepDurationHint(5)).toBe('short')
    expect(sleepDurationHint(30)).toBeUndefined()
    expect(sleepDurationHint(300)).toBe('long')
  })
})

describe('care: predictive sleep', () => {
  it('has no prediction with no sleep history yet', () => {
    const f = family()
    const now = T('2026-09-21', '12:00')
    expect(predictNextSleep(f, 'robin', now)).toBeUndefined()
  })

  it('falls back to an age-typical wake window after just one sleep', () => {
    let f = family()
    const now = T('2026-09-21', '12:00')
    const start = now - 2 * HOUR
    f = apply(f, A.logBaby('dad', { babyId: 'robin', kind: 'sleep', at: start, endAt: start + 40 * 60_000 }, start))
    const p = predictNextSleep(f, 'robin', now)
    expect(p?.basis).toBe('age-typical wake window')
    expect(p?.nextAt).toBeGreaterThan(start)
  })

  it('uses recent naps once there is a pattern', () => {
    let f = family()
    const now = T('2026-09-21', '12:00')
    for (let i = 5; i >= 1; i--) {
      const start = now - i * 3 * HOUR
      f = apply(f, A.logBaby('dad', { babyId: 'robin', kind: 'sleep', at: start, endAt: start + 40 * 60_000 }, start))
    }
    const p = predictNextSleep(f, 'robin', now)
    expect(p?.basis).toBe('recent naps')
  })
})

describe('shopping: dietary tags', () => {
  it('keeps only known dietary tags out of a mixed tag list', () => {
    expect(dietaryTagsOf(['vegan', 'quick', 'nut-free'])).toEqual(['vegan', 'nut-free'])
    expect(dietaryTagsOf(undefined)).toEqual([])
  })
})

describe('school: subject colour', () => {
  it('is stable for the same subject and does not crash on empty input', async () => {
    const { colourForSubject } = await import('./school/school')
    expect(colourForSubject('Maths')).toBe(colourForSubject('Maths'))
    expect(typeof colourForSubject('')).toBe('string')
  })
})

describe('trivia: daily card', () => {
  it('is the same for everyone on the same date and can differ across dates', () => {
    expect(todayTrivia('2026-09-21')).toEqual(todayTrivia('2026-09-21'))
    const a = todayTrivia('2026-09-21')
    const b = todayTrivia('2027-01-01')
    expect(a.flag.emoji === b.flag.emoji && a.trivia.q === b.trivia.q).toBe(false)
  })
})

describe('comments', () => {
  it('threads comments to their target and hides deleted ones', () => {
    let f = family()
    const now = T('2026-09-21', '12:00')
    f = apply(f, A.addComment('dad', 'task-1', 'Can you take this one?', now))
    f = apply(f, A.addComment('mum', 'task-1', 'On it.', now + 1))
    f = apply(f, A.addComment('dad', 'task-2', 'Different thread', now + 2))
    expect(commentsFor(f, 'task-1').map((c) => c.text)).toEqual(['Can you take this one?', 'On it.'])
    const toDelete = commentsFor(f, 'task-1')[0]!
    f = apply(f, A.deleteComment('dad', toDelete.commentId, 'task-1', now + 3))
    expect(commentsFor(f, 'task-1').map((c) => c.text)).toEqual(['On it.'])
  })
})

describe('task hand-off', () => {
  it('offers help and lets another adult claim it', () => {
    let f = family()
    const now = T('2026-09-21', '12:00')
    f = apply(f, A.saveTask('dad', { taskId: 'chore-1', title: 'Bins', kind: 'chore', assignee: 'dad', coins: 5, part: 'any' }, now))
    const task = f.tasks['chore-1']!
    f = apply(f, A.offerTaskHelp('dad', task, true, now + 1))
    expect(f.tasks['chore-1']!.helpWanted).toBe(true)
    f = apply(f, A.claimTask('mum', f.tasks['chore-1']!, now + 2))
    expect(f.tasks['chore-1']!.assignee).toBe('mum')
    expect(f.tasks['chore-1']!.handoffFrom).toBe('dad')
  })
})

describe('weekly summit', () => {
  it('records one completion per week key, upserted', () => {
    let f = family()
    const now = T('2026-09-21', '12:00')
    f = apply(f, A.completeSummit('dad', '2026-09-21', now))
    expect(f.summits['2026-09-21']).toBeDefined()
  })
})

describe('end-of-day dump prompt setting', () => {
  it('preserves enabled/time when marking seen, and vice versa', () => {
    let f = family()
    const now = T('2026-09-21', '12:00')
    f = apply(f, A.saveDumpPromptSetting('dad', 'dad', true, '21:30', undefined, now))
    f = apply(f, A.markDumpPromptSeen('dad', f, 'dad', '2026-09-21', now + 1))
    const s = f.dumpPromptSettings['dad']!
    expect(s.time).toBe('21:30')
    expect(s.lastSeen).toBe('2026-09-21')
  })
})

describe('trivia completion', () => {
  it('is recorded per member per day and pays out as coins', () => {
    let f = family()
    const now = T('2026-09-21', '12:00')
    f = apply(f, A.completeTrivia('kid', 'kid', '2026-09-21', 2, now))
    expect(f.triviaDone['kid|2026-09-21']).toBeDefined()
    expect(f.triviaDone['kid|2026-09-21']!.coins).toBe(2)
    expect(balanceFor(f, 'kid').available).toBe(2)
  })
})

describe('task hand-off survives an unrelated edit', () => {
  it('keeps helpWanted and handoffFrom when the task is edited via the normal save path', () => {
    let f = family()
    const now = T('2026-09-21', '12:00')
    f = apply(f, A.saveTask('dad', { taskId: 'chore-2', title: 'Bins', kind: 'chore', assignee: 'dad', coins: 5, part: 'any' }, now))
    f = apply(f, A.offerTaskHelp('dad', f.tasks['chore-2']!, true, now + 1))
    f = apply(f, A.claimTask('mum', f.tasks['chore-2']!, now + 2))
    // Simulate an ordinary edit (e.g. changing the title) that must preserve hand-off state, as the edit form now does.
    const t = f.tasks['chore-2']!
    f = apply(f, A.saveTask('mum', { taskId: t.taskId, title: 'Bins (both)', kind: t.kind, assignee: t.assignee, part: t.part, coins: t.coins, helpWanted: t.helpWanted, handoffFrom: t.handoffFrom }, now + 3))
    expect(f.tasks['chore-2']!.handoffFrom).toBe('dad')
  })
})

describe('family crowdfunding goals', () => {
  it('creates a goal, accepts gifts, and reduces the giver balance', () => {
    let f = family()
    const now = T('2026-09-21', '12:00')
    f = apply(f, A.setEconomy('dad', { effectiveFrom: '2026-09-01' }, now))
    f = apply(f, A.adjustCoins('dad', 'kid', 100, 'starter bonus', now + 1))
    f = apply(f, A.saveCoinGoal('dad', { title: 'Zoo trip', targetCoins: 60 }, now + 2))
    const goal = Object.values(f.goals)[0]!
    f = apply(f, A.giftToCoinGoal('kid', goal.goalId, 20, now + 3))
    expect(goalTotal(f, goal.goalId)).toBe(20)
    const bal = balanceFor(f, 'kid')
    expect(bal.gifted).toBe(20)
    expect(bal.available).toBe(80)
  })

  it('soft-deletes a goal rather than removing history', () => {
    let f = family()
    const now = T('2026-09-21', '12:00')
    f = apply(f, A.saveCoinGoal('dad', { title: 'Bikes', targetCoins: 300 }, now))
    const goal = Object.values(f.goals)[0]!
    f = apply(f, A.deleteCoinGoal('dad', goal, now + 1))
    expect(f.goals[goal.goalId]!.deleted).toBe(true)
  })
})
