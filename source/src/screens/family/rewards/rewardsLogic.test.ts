import { describe, expect, it } from 'vitest'
import { makeEvent } from '@/engine/make'
import { emptyFamily, applyFamilyEvent } from '@/family/project'
import type { AppEvent } from '@/engine/types'
import type { FamilyState } from '@/family/types'
import { familyGoal, handledThisWeek, lastSevenDays, doneOn, startBonusEvents, startBonusId, weekCopy, weeklyLine } from './rewardsLogic'

const T = Date.parse('2026-11-04T10:00:00')
const fold = (evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, emptyFamily())
const ev = (actor: string, body: Parameters<typeof makeEvent>[1], ts = T, id?: string) => makeEvent(actor, body, ts, id)

const task = (over = {}) =>
  ev('mum', { type: 'task', taskId: 'big', title: 'Tidy room', assignee: 'kid', kind: 'chore', part: 'any', coins: 10, check: 'self', minutes: 45, date: '2026-11-04', ...over } as never)

describe('startBonusEvents', () => {
  it('pays once per person per day, with a stable id', () => {
    const f = fold([task()])
    const first = startBonusEvents(f, 'kid', 'kid', { taskId: 'big', plannedSec: 600 }, T)
    expect(first).toHaveLength(1)
    expect(first[0]!.id).toBe(startBonusId('kid', '2026-11-04'))
    // Two phones: same id, so apply() drops the second; and once folded, it is not offered again.
    const g = fold([task(), ...first])
    expect(startBonusEvents(g, 'kid', 'kid', { taskId: 'big', plannedSec: 600 }, T + 5000)).toHaveLength(0)
    const other = startBonusEvents(f, 'mum', 'kid', { taskId: 'big', plannedSec: 600 }, T + 1)
    expect(other[0]!.id).toBe(first[0]!.id)
  })
  it('needs a long or overdue task', () => {
    const short = fold([task({ minutes: 10 })])
    expect(startBonusEvents(short, 'kid', 'kid', { taskId: 'big', plannedSec: 600 }, T)).toHaveLength(0)
    expect(startBonusEvents(short, 'kid', 'kid', { taskId: 'big', plannedSec: 1800 }, T)).toHaveLength(1)
    const late = fold([task({ minutes: 5, date: '2026-11-01' })])
    expect(startBonusEvents(late, 'kid', 'kid', { taskId: 'big', plannedSec: 600 }, T)).toHaveLength(1)
    expect(startBonusEvents(late, 'kid', 'kid', { plannedSec: 3600 }, T)).toHaveLength(0)
  })
})

describe('done today', () => {
  it('lists ticked tasks and counts the week, never missed things', () => {
    const f = fold([
      task(),
      ev('mum', { type: 'task', taskId: 'other', title: 'Not done', assignee: 'kid', kind: 'chore', part: 'any', coins: 5, check: 'self' } as never),
      ev('kid', { type: 'task-done', taskId: 'big', date: '2026-11-04', coins: 10, needsCheck: false, payee: 'kid' }),
    ])
    const items = doneOn(f, 'kid', '2026-11-04')
    expect(items.map((i) => i.title)).toEqual(['Tidy room'])
    expect(handledThisWeek(f, 'kid', '2026-11-04')).toBe(1)
    expect(doneOn(f, 'kid', '2026-11-03')).toHaveLength(0)
  })
  it('weekly line only once there is something to thank', () => {
    expect(weeklyLine(2)).toBeUndefined()
    expect(weeklyLine(14)).toBe("You've handled 14 things this week. Thank you.")
  })
})

describe('family goal', () => {
  it('shows progress', () => {
    const f = fold([
      ev('mum', { type: 'coin-goal', goalId: 'g', title: 'Cinema trip', emoji: '🎬', targetCoins: 500 }),
      ev('kid', { type: 'coin-goal-gift', giftId: 'a', goalId: 'g', coins: 340 }),
    ])
    expect(familyGoal(f)).toMatchObject({ total: 340, target: 500, label: '🎬 Cinema trip · 340 / 500 🪙' })
    expect(familyGoal(fold([]))).toBeUndefined()
  })
})

describe('forgiving week', () => {
  it('counts days played out of seven and never says broken', () => {
    const played = new Set(['2026-11-04', '2026-11-02', '2026-10-30', '2026-10-29'])
    const { days, count } = lastSevenDays((d) => played.has(d), '2026-11-04')
    expect(days).toHaveLength(7)
    expect(days[6]).toMatchObject({ day: '2026-11-04', today: true })
    expect(count).toBe(4)
    expect(weekCopy(4, true).head).toBe('4 of the last 7 days ⭐')
    expect(weekCopy(0, false).sub).toBe('Fancy a quick game?')
    expect(JSON.stringify(weekCopy(0, false))).not.toMatch(/keep|broken|lost/i)
  })
})
