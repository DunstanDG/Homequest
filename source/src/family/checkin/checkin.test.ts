import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import * as A from '../actions'
import { makeCalCtx } from '../calendar'
import { tsOf } from '../dates'
import { savePlant } from '../plantActions'
import { applyFamilyEvent, projectFamily } from '../project'
import type { FamilyState } from '../types'
import * as C from './actions'
import { canSeeMood, configOf, nextOpenAt, openPart, recentMoods } from './checkin'
import { habitStatus, habitsForPart, habitRepeatLabel, liveHabits, STARTER_HABITS } from './habits'
import { babyNight, eveningReview, morningReview } from './review'

const T = (date: string, time = '12:00') => tsOf(date, time)
const NOW = T('2026-10-12', '19:00')
const TODAY = '2026-10-12'
const apply = (f: FamilyState, evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, f)

function family(): FamilyState {
  return projectFamily([
    ...A.saveMember('mum', { id: 'mum', name: 'Mum', role: 'parent', colour: '#4cc9f0', active: true, birthday: '1985-03-02' }, NOW - 9000),
    ...A.saveMember('mum', { id: 'dad', name: 'Dad', role: 'parent', colour: '#f72585', active: true }, NOW - 8999),
    ...A.saveMember('mum', { id: 'kid', name: 'Kid', role: 'child', colour: '#ffd166', active: true, birthday: '2016-05-01' }, NOW - 8998),
    ...A.saveMember('mum', { id: 'bub', name: 'Bub', role: 'baby', colour: '#b388ff', active: true, birthday: '2026-09-01' }, NOW - 8997),
    ...A.saveMember('mum', { id: 'dog', name: 'Biscuit', role: 'pet', petKind: 'Dog', colour: '#999', active: true }, NOW - 8996),
  ])
}

describe('habits', () => {
  it('a daily habit is due every day and ticking it is remembered for that day only', () => {
    let f = family()
    f = apply(f, C.addStarterHabits('mum', f, 'mum', ['meditate']))
    const id = C.starterHabitId('mum', 'meditate')
    expect(habitStatus(f, f.habits[id]!, TODAY)).toMatchObject({ due: true, done: false })
    f = apply(f, C.tickHabit('mum', f, id, TODAY, NOW))
    expect(habitStatus(f, f.habits[id]!, TODAY)).toMatchObject({ due: true, done: true })
    expect(habitStatus(f, f.habits[id]!, '2026-10-13')).toMatchObject({ due: true, done: false })
    expect(C.tickHabit('mum', f, id, TODAY, NOW + 5)).toEqual([])
    f = apply(f, C.untickHabit('mum', f, id, TODAY, NOW + 10))
    expect(habitStatus(f, f.habits[id]!, TODAY).done).toBe(false)
  })

  it('a fortnightly habit is folded away until two weeks after it was last done', () => {
    let f = family()
    f = apply(f, C.addStarterHabits('mum', f, 'mum', ['nails']))
    const id = C.starterHabitId('mum', 'nails')
    expect(habitsForPart(f, 'mum', 'evening', TODAY).shown).toHaveLength(1)
    f = apply(f, C.tickHabit('mum', f, id, '2026-10-05', T('2026-10-05')))
    const on = (d: string) => habitsForPart(f, 'mum', 'evening', d)
    expect(on('2026-10-12').later[0]).toMatchObject({ due: false, dueIn: 7 })
    expect(on('2026-10-12').shown).toHaveLength(0)
    expect(on('2026-10-19').shown).toHaveLength(1)
    // It is the same habit in the morning check-in: "either".
    expect(habitsForPart(f, 'mum', 'morning', '2026-10-19').shown).toHaveLength(1)
  })

  it('a morning habit is not in the evening check-in, and a weekday habit is due on those days', () => {
    let f = family()
    f = apply(f, C.addStarterHabits('mum', f, 'mum', ['meditate']))
    expect(habitsForPart(f, 'mum', 'evening', TODAY).shown).toHaveLength(0)
    f = apply(f, C.saveHabit('mum', f, { memberId: 'mum', title: 'Swim', when: 'evening', everyDays: 1, weekdays: [0, 2] }, NOW))
    const swim = Object.values(f.habits).find((h) => h.title === 'Swim')!
    expect(habitStatus(f, swim, '2026-10-12').due).toBe(true) // a Monday
    expect(habitStatus(f, swim, '2026-10-13')).toMatchObject({ due: false, dueIn: 1 })
    expect(habitRepeatLabel(swim)).toBe('Mon, Wed')
  })

  it('each person has their own list, and starter habits added twice make one copy', () => {
    let f = family()
    f = apply(f, C.addStarterHabits('mum', f, 'kid', ['teeth-am', 'teeth-pm']))
    f = apply(f, C.addStarterHabits('mum', f, 'kid', ['teeth-am']))
    expect(Object.values(f.habits).filter((h) => h.memberId === 'kid')).toHaveLength(2)
    expect(Object.values(f.habits).filter((h) => h.memberId === 'mum')).toHaveLength(0)
    expect(STARTER_HABITS.filter((s) => s.preset).map((s) => s.key)).toEqual(['teeth-am', 'teeth-pm'])
  })

  it('a habit can be ticked for last night', () => {
    let f = family()
    f = apply(f, C.addStarterHabits('mum', f, 'mum', ['floss']))
    const id = C.starterHabitId('mum', 'floss')
    f = apply(f, C.tickHabit('mum', f, id, '2026-10-11', NOW))
    expect(habitStatus(f, f.habits[id]!, '2026-10-11').done).toBe(true)
    expect(habitStatus(f, f.habits[id]!, TODAY).done).toBe(false)
  })
})

describe('habit order', () => {
  it('moves a habit up or down, and not past the ends', () => {
    let f = family()
    f = apply(f, C.addStarterHabits('mum', f, 'mum', ['teeth-am', 'meditate', 'floss']))
    const names = () => liveHabits(f, 'mum').map((h) => h.starterKey)
    expect(names()).toEqual(['teeth-am', 'meditate', 'floss'])
    f = apply(f, C.moveHabit('mum', f, C.starterHabitId('mum', 'floss'), -1, NOW))
    expect(names()).toEqual(['teeth-am', 'floss', 'meditate'])
    f = apply(f, C.moveHabit('mum', f, C.starterHabitId('mum', 'teeth-am'), 1, NOW + 5))
    expect(names()).toEqual(['floss', 'teeth-am', 'meditate'])
    expect(C.moveHabit('mum', f, C.starterHabitId('mum', 'floss'), -1)).toEqual([])
    expect(C.moveHabit('mum', f, C.starterHabitId('mum', 'meditate'), 1)).toEqual([])
  })

  it('a new habit goes last even after one was deleted, and equal numbers settle the same way everywhere', () => {
    let f = family()
    f = apply(f, C.addStarterHabits('mum', f, 'mum', ['teeth-am', 'meditate', 'floss']))
    f = apply(f, C.deleteHabit('mum', f.habits[C.starterHabitId('mum', 'meditate')]!, NOW))
    f = apply(f, C.saveHabit('mum', f, { memberId: 'mum', title: 'Walk', when: 'morning', everyDays: 1 }, NOW + 1))
    expect(liveHabits(f, 'mum').map((h) => h.title)).toEqual(['Brush teeth (morning)', 'Floss', 'Walk'])
    // two habits sharing a number: the same order whichever phone reads them
    const a = liveHabits(f, 'mum').map((h) => h.habitId)
    const g = apply(f, C.saveHabit('mum', f, { habitId: a[2]!, memberId: 'mum', title: 'Walk', when: 'morning', everyDays: 1 }, NOW + 2))
    expect(liveHabits(g, 'mum').map((h) => h.habitId)).toEqual(a)
  })
})

describe('when a check-in opens', () => {
  it('morning runs from its time to its end, evening from its time on, nothing in between', () => {
    const f = family()
    expect(openPart(f, 'mum', T(TODAY, '05:59'))).toBeUndefined()
    expect(openPart(f, 'mum', T(TODAY, '06:00'))).toBe('morning')
    expect(openPart(f, 'mum', T(TODAY, '11:59'))).toBe('morning')
    expect(openPart(f, 'mum', T(TODAY, '12:00'))).toBeUndefined()
    expect(openPart(f, 'mum', T(TODAY, '18:29'))).toBeUndefined()
    expect(openPart(f, 'mum', T(TODAY, '18:30'))).toBe('evening')
    expect(openPart(f, 'mum', T(TODAY, '23:59'))).toBe('evening')
  })

  it('a person can change their times or switch it off', () => {
    let f = family()
    f = apply(f, C.saveCheckinConfig('mum', 'kid', { enabled: true, morningFrom: '07:00', morningUntil: '10:00', eveningFrom: '19:30', remind: true }, NOW))
    expect(openPart(f, 'kid', T(TODAY, '06:30'))).toBeUndefined()
    expect(openPart(f, 'kid', T(TODAY, '07:00'))).toBe('morning')
    expect(openPart(f, 'kid', T(TODAY, '19:00'))).toBeUndefined()
    f = apply(f, C.saveCheckinConfig('mum', 'kid', { ...configOf(f, 'kid'), enabled: false }, NOW + 1))
    expect(openPart(f, 'kid', T(TODAY, '07:30'))).toBeUndefined()
  })

  it('the reminder goes at the next opening, tomorrow if it is done or has passed, and not at all when off', () => {
    let f = family()
    expect(nextOpenAt(f, 'mum', 'evening', T(TODAY, '10:00'))).toBeUndefined()
    f = apply(f, C.saveCheckinConfig('mum', 'mum', { ...configOf(f, 'mum'), remind: true }, NOW))
    expect(nextOpenAt(f, 'mum', 'evening', T(TODAY, '10:00'))).toBe(T(TODAY, '18:30'))
    expect(nextOpenAt(f, 'mum', 'evening', T(TODAY, '19:00'))).toBe(T('2026-10-13', '18:30'))
    f = apply(f, C.finishCheckin('mum', 'mum', TODAY, 'evening', {}, NOW))
    expect(nextOpenAt(f, 'mum', 'evening', T(TODAY, '10:00'))).toBe(T('2026-10-13', '18:30'))
    expect(nextOpenAt(f, 'mum', 'morning', T(TODAY, '10:00'))).toBe(T('2026-10-13', '06:00'))
  })

  it('finishing again updates the mood rather than adding a second check-in', () => {
    let f = family()
    f = apply(f, C.finishCheckin('mum', 'mum', TODAY, 'evening', { mood: 2 }, NOW))
    f = apply(f, C.finishCheckin('mum', 'mum', TODAY, 'evening', { mood: 4, note: ' better ' }, NOW + 5))
    expect(Object.keys(f.checkins)).toHaveLength(1)
    expect(f.checkins[`mum|${TODAY}|evening`]).toMatchObject({ mood: 4, note: 'better' })
    expect(C.finishCheckin('mum', 'mum', TODAY, 'evening', { mood: 9 }, NOW)[0]).toMatchObject({ mood: undefined })
  })
})

describe('moods are private', () => {
  it("your own, and a child's to parents; an adult's stays their own", () => {
    const f = family()
    expect(canSeeMood(f, 'kid', 'kid')).toBe(true)
    expect(canSeeMood(f, 'mum', 'kid')).toBe(true)
    expect(canSeeMood(f, 'kid', 'mum')).toBe(false)
    expect(canSeeMood(f, 'dad', 'mum')).toBe(false)
    expect(canSeeMood(f, 'mum', 'mum')).toBe(true)
  })

  it('the week shows evening over morning, and gaps as gaps', () => {
    let f = family()
    f = apply(f, C.finishCheckin('mum', 'kid', '2026-10-11', 'morning', { mood: 2 }, NOW))
    f = apply(f, C.finishCheckin('mum', 'kid', '2026-10-11', 'evening', { mood: 5 }, NOW))
    f = apply(f, C.finishCheckin('mum', 'kid', '2026-10-12', 'morning', { mood: 3 }, NOW))
    const week = recentMoods(f, 'kid', TODAY, 3)
    expect(week.map((d) => d.mood)).toEqual([undefined, 5, 3])
  })

  it("keeps the evening 'why' beside the mood, trimmed, and drops it when blank", () => {
    let f = family()
    f = apply(f, C.finishCheckin('mum', 'kid', '2026-10-11', 'evening', { mood: 2, why: '  Fell out with a friend ' }, NOW))
    f = apply(f, C.finishCheckin('mum', 'kid', '2026-10-12', 'evening', { mood: 4, why: '   ' }, NOW))
    const week = recentMoods(f, 'kid', TODAY, 2)
    expect(week.map((d) => d.why)).toEqual(['Fell out with a friend', undefined])
    expect(C.finishCheckin('mum', 'kid', TODAY, 'evening', { mood: 3, why: 'x' }, NOW)[0]).toMatchObject({ why: 'x' })
  })
})

describe('the evening review', () => {
  it('lists what was done today, the coins, and what is still open', () => {
    let f = family()
    f = apply(f, A.saveTask('mum', { taskId: 't1', title: 'Tidy room', assignee: 'kid', kind: 'chore', part: 'any', date: TODAY, coins: 5 }, NOW - 4000))
    f = apply(f, A.saveTask('mum', { taskId: 't2', title: 'Feed the fish', assignee: 'kid', kind: 'chore', part: 'any', date: TODAY, coins: 5 }, NOW - 3999))
    f = apply(f, A.saveTask('mum', { taskId: 't3', title: 'Fractions', assignee: 'kid', kind: 'homework', subject: 'Maths', part: 'any', date: TODAY, coins: 10 }, NOW - 3998))
    f = apply(f, A.completeTask('kid', f, f.tasks['t1']!, TODAY, {}, NOW - 100))
    f = apply(f, A.completeTask('kid', f, f.tasks['t3']!, TODAY, {}, NOW - 99))
    const r = eveningReview(makeCalCtx(f), 'kid', TODAY, NOW)
    expect(r.lines.map((l) => l.key)).toEqual(['tasks', 'homework', 'coins'])
    expect(r.lines.find((l) => l.key === 'tasks')!.sub).toBe('Tidy room')
    expect(r.lines.find((l) => l.key === 'coins')).toMatchObject({ text: '15 coins earned', sub: '15 waiting for a parent to check' })
    expect(r.open.map((x) => x.task.taskId)).toEqual(['t2'])
  })

  it("counts what this person looked after: the dog, the plants, and for a parent the baby's day", () => {
    let f = family()
    f = apply(f, A.logPet('mum', f, { petId: 'dog', kind: 'walk', at: NOW - 3_600_000 }, NOW - 3_600_000))
    f = apply(f, A.logPet('dad', f, { petId: 'dog', kind: 'feed', at: NOW - 3_000_000 }, NOW - 3_000_000))
    const p = savePlant('mum', { name: 'Fern' }, NOW - 9_000_000, NOW - 8_000_000)
    f = apply(f, p.events)
    f = apply(f, A.logBaby('mum', { babyId: 'bub', kind: 'feed', at: T(TODAY, '08:00'), feed: { method: 'bottle', ml: 120 } }, NOW))
    f = apply(f, A.logBaby('dad', { babyId: 'bub', kind: 'nappy', at: T(TODAY, '09:00'), nappy: { wet: true, dirty: false } }, NOW))
    const mum = eveningReview(makeCalCtx(f), 'mum', TODAY, NOW).lines
    expect(mum.find((l) => l.key === 'pet:dog')).toMatchObject({ text: 'Looked after Biscuit', sub: 'walk' })
    expect(mum.find((l) => l.key === 'baby:bub')!.sub).toContain('1 feed · 1 nappy')
    const dad = eveningReview(makeCalCtx(f), 'dad', TODAY, NOW).lines
    expect(dad.find((l) => l.key === 'pet:dog')!.sub).toBe('feed')
    // A child does not see the baby's day.
    expect(eveningReview(makeCalCtx(f), 'kid', TODAY, NOW).lines.some((l) => l.key.startsWith('baby'))).toBe(false)
  })

  it('a day with nothing logged has nothing to list', () => {
    expect(eveningReview(makeCalCtx(family()), 'kid', TODAY, NOW).lines).toEqual([])
  })
})

describe('the morning review', () => {
  it("carries over what is overdue and counts today's list", () => {
    let f = family()
    f = apply(f, A.saveTask('mum', { taskId: 'old', title: 'Return book', assignee: 'kid', kind: 'chore', part: 'any', date: '2026-10-10', coins: 5 }, NOW - 4000))
    f = apply(f, A.saveTask('mum', { taskId: 'new', title: 'Read', assignee: 'kid', kind: 'chore', part: 'any', date: TODAY, coins: 5 }, NOW - 3999))
    const r = morningReview(makeCalCtx(f), 'kid', TODAY, T(TODAY, '07:00'))
    expect(r.open.map((x) => x.task.taskId)).toEqual(['old'])
    expect(r.lines.find((l) => l.key === 'today')).toMatchObject({ text: '1 task today', sub: 'Read' })
  })

  it("a parent sees the baby's night, clipped to 7pm to 7am", () => {
    let f = family()
    f = apply(f, A.logBaby('mum', { babyId: 'bub', kind: 'sleep', at: T('2026-10-11', '18:00'), endAt: T('2026-10-11', '20:00') }, NOW))
    f = apply(f, A.logBaby('mum', { babyId: 'bub', kind: 'sleep', at: T('2026-10-12', '05:00'), endAt: T('2026-10-12', '08:00') }, NOW))
    f = apply(f, A.logBaby('mum', { babyId: 'bub', kind: 'feed', at: T('2026-10-12', '02:00'), feed: { method: 'bottle', ml: 100 } }, NOW))
    f = apply(f, A.logBaby('mum', { babyId: 'bub', kind: 'feed', at: T('2026-10-12', '08:30'), feed: { method: 'bottle', ml: 100 } }, NOW))
    expect(babyNight(makeCalCtx(f), 'bub', TODAY)).toEqual({ feeds: 1, nappies: 0, sleepMin: 180 })
    const r = morningReview(makeCalCtx(f), 'mum', TODAY, T(TODAY, '07:30'))
    expect(r.lines.find((l) => l.key === 'night:bub')!.sub).toContain('1 feed')
    expect(morningReview(makeCalCtx(f), 'kid', TODAY, T(TODAY, '07:30')).lines.some((l) => l.key.startsWith('night'))).toBe(false)
  })
})

describe('adding something that was not tracked', () => {
  it("becomes a ticked-off task for that day, with coins for a child waiting for a parent's check", () => {
    let f = family()
    const evs = C.addActivity('kid', f, { memberId: 'kid', title: ' Helped with the shopping ', minutes: 20, date: TODAY, coins: 5 }, NOW)
    f = apply(f, evs)
    const task = Object.values(f.tasks).find((t) => t.title === 'Helped with the shopping')!
    expect(task).toMatchObject({ assignee: 'kid', date: TODAY, coins: 5, source: 'checkin:activity' })
    expect(f.done[`${task.taskId}|${TODAY}`]).toMatchObject({ status: 'pending', coins: 5, minutes: 20 })
    expect(eveningReview(makeCalCtx(f), 'kid', TODAY, NOW).open).toEqual([])
    expect(eveningReview(makeCalCtx(f), 'kid', TODAY, NOW).lines[0]!.sub).toBe('Helped with the shopping')
  })

  it('a parent adding it for a child approves it straight away; for last night it counts on that day', () => {
    let f = family()
    f = apply(f, C.addActivity('mum', f, { memberId: 'kid', title: 'Walked the dog', date: '2026-10-11', coins: 10 }, NOW))
    const task = Object.values(f.tasks).find((t) => t.title === 'Walked the dog')!
    expect(f.done[`${task.taskId}|2026-10-11`]).toMatchObject({ status: 'approved', by: 'mum' })
    expect(eveningReview(makeCalCtx(f), 'kid', '2026-10-11', NOW).lines[0]).toMatchObject({ key: 'tasks' })
  })

  it('earns no coins unless asked, none for an adult, and needs a name', () => {
    let f = family()
    f = apply(f, C.addActivity('kid', f, { memberId: 'kid', title: 'Drew a picture', date: TODAY }, NOW))
    f = apply(f, C.addActivity('dad', f, { memberId: 'dad', title: 'Fixed the shelf', date: TODAY, coins: 10 }, NOW + 5))
    expect(Object.values(f.tasks).map((t) => t.coins)).toEqual([0, 0])
    expect(C.addActivity('kid', f, { memberId: 'kid', title: '   ', date: TODAY }, NOW)).toEqual([])
    expect(C.activityCoins(20)).toBe(10)
  })
})
