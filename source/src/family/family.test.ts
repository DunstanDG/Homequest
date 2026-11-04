import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import { mergeEvents } from '@/engine/events'
import { addDays, addMonths, daysBetween, hmOf, startOfWeek, tsOf, weekday, ymdOf } from './dates'
import { expandDates, occursOn } from './recur'
import { SAMPLE_PACK } from './school/sample'
import { makeSchool, validatePack } from './school/school'
import { emptyFamily, applyFamilyEvent, projectFamily } from './project'
import * as A from './actions'
import { balanceFor, canRedeem, ledgerFor, learningCoins, learningDays, suggestCoins } from './economy'
import { elapsedSec, remainingSec, activeTimers } from './timers'
import { freeSlots, gapsIn, itemsOn, makeCalCtx, tasksFor, helpWanted } from './calendar'
import { babyDay, babySummaryText, describeBaby, petDay, recentDuplicate, suggestMeal } from './care'
import { rankIdeas } from './ideas'
import type { FamilyState } from './types'
import { ARRIVAL_ACTIVITIES, ARRIVAL_DAYS, ARRIVAL_MEALS } from './arrival/pack'
import { activitiesOnDay, arrivalDayOn, arrivalItemsOn, bornBabies, dayOneOf, expectedBabies, focusOnDay, ideaDraftFor, isExpecting, kindFor, whoFor } from './arrival/arrival'

const T = (date: string, time = '12:00') => tsOf(date, time)

/** A small family: Dad and Mum (parents), Ellie (child, with the sample school pack), Baby Sam, Alfie the dog. */
function family(now = T('2026-09-21', '08:00')): { f: FamilyState; events: AppEvent[]; ids: Record<string, string> } {
  const ids = { dad: 'dad', mum: 'mum', ellie: 'ellie', sam: 'sam', alfie: 'alfie' }
  const events: AppEvent[] = [
    ...A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, now),
    ...A.saveMember('dad', { id: 'mum', name: 'Mum', role: 'parent', colour: '#f72585', active: true }, now + 1),
    ...A.saveMember('dad', { id: 'ellie', name: 'Ellie', role: 'child', colour: '#ffc857', active: true, birthday: '2013-03-14' }, now + 2),
    ...A.saveMember('dad', { id: 'sam', name: 'Sam', role: 'baby', colour: '#3ddc97', active: true }, now + 3),
    ...A.saveMember('dad', { id: 'alfie', name: 'Alfie', role: 'pet', colour: '#b388ff', active: true, petKind: 'dog' }, now + 4),
    ...A.importSchoolPack('dad', 'ellie', SAMPLE_PACK, now + 5),
    ...A.setEconomy('dad', { effectiveFrom: '2026-09-21' }, now + 6),
  ]
  return { f: projectFamily(events), events, ids }
}
const apply = (f: FamilyState, evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, f)

describe('dates', () => {
  it('does day arithmetic without daylight-saving surprises', () => {
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30') // UK clocks go forward on 29 Mar 2026
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26') // and back on 25 Oct
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })
  it('knows weekdays (Monday = 0)', () => {
    expect(weekday('2026-09-21')).toBe(0)
    expect(weekday('2026-09-27')).toBe(6)
    expect(startOfWeek('2026-09-25')).toBe('2026-09-21')
    expect(startOfWeek('2026-09-27')).toBe('2026-09-21')
  })
  it('clamps months', () => {
    expect(addMonths('2027-01-31', 1)).toBe('2027-02-28')
    expect(addMonths('2026-11-30', 3)).toBe('2027-02-28')
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15')
  })
  it('round-trips timestamps', () => {
    const ts = tsOf('2026-09-21', '15:05')
    expect(ymdOf(ts)).toBe('2026-09-21')
    expect(hmOf(ts)).toBe('15:05')
  })
})

describe('recurrence', () => {
  it('repeats on chosen weekdays', () => {
    const rule = { freq: 'weekly' as const, byWeekday: [0, 2] }
    const days = expandDates(rule, '2026-09-21', '2026-09-21', '2026-09-30')
    expect(days).toEqual(['2026-09-21', '2026-09-23', '2026-09-28', '2026-09-30'])
  })
  it('fortnightly counts weeks from the start date', () => {
    const rule = { freq: 'weekly' as const, interval: 2 }
    expect(occursOn(rule, '2026-09-24', '2026-09-24')).toBe(true)
    expect(occursOn(rule, '2026-09-24', '2026-10-01')).toBe(false)
    expect(occursOn(rule, '2026-09-24', '2026-10-08')).toBe(true)
  })
  it('monthly on the 31st falls back to the last day', () => {
    const rule = { freq: 'monthly' as const }
    expect(occursOn(rule, '2026-08-31', '2026-09-30')).toBe(true)
    expect(occursOn(rule, '2026-08-31', '2026-09-29')).toBe(false)
  })
  it('stops at until and skips exdates', () => {
    const rule = { freq: 'daily' as const, until: '2026-09-24' }
    expect(expandDates(rule, '2026-09-22', '2026-09-20', '2026-09-30', ['2026-09-23'])).toEqual(['2026-09-22', '2026-09-24'])
  })
  it('can be limited to school days and to one school week', () => {
    const sc = makeSchool(SAMPLE_PACK)
    const ctx = { isSchoolDay: (d: string) => sc.isSchoolDay(d), schoolWeek: (d: string) => sc.weekOf(d)?.week }
    const rule = { freq: 'daily' as const, schoolDaysOnly: true }
    expect(occursOn(rule, '2026-09-21', '2026-10-27', ctx)).toBe(false) // half-term
    expect(occursOn(rule, '2026-09-21', '2026-10-05', ctx)).toBe(true)
    const b = { freq: 'weekly' as const, schoolWeek: 'B' as const }
    expect(occursOn(b, '2026-09-21', '2026-09-21', ctx)).toBe(true)
    expect(occursOn(b, '2026-09-21', '2026-09-28', ctx)).toBe(false)
  })
})

describe('school pack (sample)', () => {
  const sc = makeSchool(SAMPLE_PACK)
  it('is a valid pack with unique club ids', () => {
    expect(validatePack(SAMPLE_PACK)).toBeNull()
    const ids = SAMPLE_PACK.clubs.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(SAMPLE_PACK.timetable.A.every((d) => d.length === 5)).toBe(true)
    expect(SAMPLE_PACK.timetable.B.every((d) => d.length === 5)).toBe(true)
  })
  it('reproduces the school\'s published A/B weeks for the autumn term', () => {
    const published: [string, 'A' | 'B'][] = [
      ['2026-09-21', 'B'], ['2026-09-28', 'A'], ['2026-10-05', 'B'], ['2026-10-12', 'A'], ['2026-10-19', 'B'],
      ['2026-11-02', 'A'], ['2026-11-09', 'B'], ['2026-11-16', 'A'], ['2026-11-23', 'B'], ['2026-11-30', 'A'], ['2026-12-07', 'B'], ['2026-12-14', 'A'],
    ]
    for (const [d, w] of published) expect(sc.weekOf(d)?.week, d).toBe(w)
    // any day in the week gives the same answer
    expect(sc.weekOf('2026-09-25')?.week).toBe('B')
  })
  it('skips half-term and Christmas when counting, and flags weeks the school has not confirmed', () => {
    expect(sc.weekOf('2026-10-26')).toBeUndefined() // half-term week has no school
    expect(sc.weekOf('2026-12-21')).toBeUndefined()
    expect(sc.weekOf('2027-01-04')?.week).toBe('B')
    expect(sc.weekOf('2027-01-04')?.assumed).toBe(true)
    expect(sc.weekOf('2026-10-05')?.assumed).toBe(false)
  })
  it('lets a parent correct a week, and later weeks follow the correction', () => {
    const fixed = makeSchool(SAMPLE_PACK, { '2027-01-04': 'A' })
    expect(fixed.weekOf('2027-01-04')).toEqual({ week: 'A', assumed: false })
    expect(fixed.weekOf('2027-01-11')?.week).toBe('B')
  })
  it('classifies days', () => {
    expect(sc.day('2026-09-26').kind).toBe('weekend')
    expect(sc.day('2026-10-28')).toMatchObject({ kind: 'holiday', label: 'Autumn half-term' })
    expect(sc.day('2026-11-27')).toMatchObject({ kind: 'inset' })
    expect(sc.day('2026-12-18')).toMatchObject({ kind: 'school', early: 'Last day of term (early closure)' })
    expect(sc.day('2027-01-04').kind).toBe('school')
    expect(sc.day('2026-08-20').kind).toBe('out-of-term')
    expect(sc.nextSchoolDay('2026-10-26')).toBe('2026-11-02')
  })
  it('gives the right lessons for Week B and Week A', () => {
    const mon = sc.lessons('2026-09-21')
    expect(mon.map((l) => l.subject)).toEqual(['Design Tech', 'German', 'PE', 'Maths', 'Drama'])
    expect(mon[0]).toMatchObject({ start: '09:00', end: '10:00', room: '8A/Dt2', teacher: 'Mrs K Lowe' })
    expect(mon[4]).toMatchObject({ start: '14:05', end: '15:05' })
    expect(sc.lessons('2026-09-28').map((l) => l.subject)).toEqual(['Geography', 'Drama', 'Science', 'Maths', 'Religion & Philosophy'])
    expect(sc.lessons('2026-09-26')).toEqual([])
    expect(sc.lessons('2026-10-27')).toEqual([])
  })
  it('matches the school\'s own note about PE days', () => {
    const peDays = (start: string) => Array.from({ length: 5 }, (_, i) => addDays(start, i)).filter((d) => sc.kit(d).includes('PE kit')).map((d) => weekday(d))
    expect(peDays('2026-09-21')).toEqual([0, 3]) // Week B: Monday and Thursday
    expect(peDays('2026-09-28')).toEqual([1, 3]) // Week A: Tuesday and Thursday
  })
  it('knows her booked clubs', () => {
    expect(sc.clubs('2026-09-21')).toMatchObject([{ name: 'Drama rehearsal', start: '15:05', end: '16:05' }])
    expect(sc.clubs('2026-09-23')).toMatchObject([{ name: 'Drama rehearsal', start: '15:10' }])
    expect(sc.clubs('2026-09-24')).toMatchObject([{ name: 'Chess Club', start: '15:05', room: 'E4' }])
    expect(sc.clubs('2026-09-22')).toEqual([])
  })
  it('rejects a badly formed pack with a readable message', () => {
    expect(validatePack(null)).toMatch(/not a school pack/)
    expect(validatePack({ id: 'x', name: 'y' })).toMatch(/timetable/)
    expect(validatePack({ ...SAMPLE_PACK, weekAnchor: { weekStart: 'monday', week: 'B' } })).toMatch(/weekAnchor/)
  })
})

describe('projection', () => {
  it('builds members and keeps the latest edit', () => {
    const { f } = family()
    expect(Object.keys(f.members)).toHaveLength(5)
    const f2 = apply(f, A.saveMember('mum', { ...f.members.ellie!, name: 'Ellie R' }, T('2026-09-22')))
    expect(f2.members.ellie?.name).toBe('Ellie R')
    expect(f2.members.ellie?.createdTs).toBe(f.members.ellie?.createdTs)
  })
  it('ignores learning events', () => {
    const f = apply(emptyFamily(), [{ type: 'profile', id: 'p', ts: 1, day: '2026-01-01', learnerId: 'x', v: 1, name: 'W', year: 8 }])
    expect(f.eventCount).toBe(0)
  })
  it('is the same whatever order events arrive in', () => {
    const { events } = family()
    const extra = [...A.saveCal('dad', { title: 'Dentist', date: '2026-09-30', allDay: false, start: '10:00', end: '10:30', members: ['ellie'], category: 'appointment', busy: true }, T('2026-09-22')), ...A.offerHelp('mum', 'x', '2026-09-30', true, T('2026-09-23'))]
    const a = projectFamily([...events, ...extra])
    const b = projectFamily([...extra].reverse().concat([...events].reverse()))
    expect(b).toEqual(a)
  })
  it('turns a delete into a tombstone, not a removal', () => {
    let f = emptyFamily()
    const [e] = A.saveCal('dad', { title: 'Pizza', date: '2026-09-25', allDay: true, members: [], everyone: true, category: 'meal', busy: false }, T('2026-09-20'))
    f = apply(f, [e!])
    const c = f.cal[(e as { calId: string }).calId]!
    f = apply(f, A.deleteCal('dad', c, T('2026-09-21')))
    expect(f.cal[c.calId]?.deleted).toBe(true)
  })
})

describe('tasks, checks and coins', () => {
  it('a child ticking a parent-checked task waits for approval; a parent ticking it approves at once', () => {
    let { f } = family()
    const [t] = A.saveTask('dad', { title: 'Tidy room', assignee: 'ellie', kind: 'chore', part: 'evening', date: '2026-09-21', minutes: 10 }, T('2026-09-20'))
    f = apply(f, [t!])
    const task = Object.values(f.tasks)[0]!
    expect(task.coins).toBe(5)
    expect(task.check).toBe('parent')
    let f1 = apply(f, A.completeTask('ellie', f, task, '2026-09-21', {}, T('2026-09-21', '18:00')))
    expect(f1.done[`${task.taskId}|2026-09-21`]?.status).toBe('pending')
    expect(balanceFor(f1, 'ellie')).toMatchObject({ tasks: 0, waiting: 5, available: 0 })
    f1 = apply(f1, A.checkTask('dad', task.taskId, '2026-09-21', 'approved', undefined, T('2026-09-21', '19:00')))
    expect(balanceFor(f1, 'ellie')).toMatchObject({ tasks: 5, waiting: 0, available: 5 })
    const f2 = apply(f, A.completeTask('dad', f, task, '2026-09-21', {}, T('2026-09-21', '18:00')))
    expect(balanceFor(f2, 'ellie').tasks).toBe(5)
  })
  it('a rejected task earns nothing and can be done again', () => {
    let { f } = family()
    f = apply(f, A.saveTask('dad', { title: 'Homework', assignee: 'ellie', kind: 'homework', part: 'any', date: '2026-09-28' }, T('2026-09-20')))
    const task = Object.values(f.tasks)[0]!
    f = apply(f, A.completeTask('ellie', f, task, '2026-09-28', {}, T('2026-09-27')))
    f = apply(f, A.checkTask('mum', task.taskId, '2026-09-28', 'rejected', 'Not finished', T('2026-09-27', '20:00')))
    expect(f.done[`${task.taskId}|2026-09-28`]).toMatchObject({ status: 'rejected', checkNote: 'Not finished' })
    expect(balanceFor(f, 'ellie').available).toBe(0)
    f = apply(f, A.completeTask('ellie', f, task, '2026-09-28', {}, T('2026-09-27', '21:00')))
    expect(f.done[`${task.taskId}|2026-09-28`]?.status).toBe('pending')
  })
  it('undo removes a completion', () => {
    let { f } = family()
    f = apply(f, A.saveTask('dad', { title: 'Feed fish', assignee: 'ellie', kind: 'chore', part: 'morning', date: '2026-09-21', check: 'self' }, T('2026-09-20')))
    const task = Object.values(f.tasks)[0]!
    const done = A.completeTask('ellie', f, task, '2026-09-21', {}, T('2026-09-21', '07:30'))
    f = apply(f, done)
    expect(balanceFor(f, 'ellie').tasks).toBe(5)
    f = apply(f, A.undo('ellie', done[0]!.id, T('2026-09-21', '07:31')))
    expect(balanceFor(f, 'ellie').tasks).toBe(0)
  })
  it('coins from learning use the XP rate, respect the daily cap and never re-price old days', () => {
    const eco = [{ effectiveFrom: '2026-09-21', xpPerCoin: 10, dailyCapXp: 400 }]
    expect(learningCoins({ '2026-09-21': 235 }, eco)).toBe(23)
    expect(learningCoins({ '2026-09-21': 1000 }, eco)).toBe(40) // capped at 400 XP
    expect(learningCoins({ '2026-09-20': 500 }, eco)).toBe(0) // before the economy started
    expect(learningCoins({ '2026-09-21': 5, '2026-09-22': 5 }, eco)).toBe(1) // remainders carry over
    const later = [...eco, { effectiveFrom: '2026-10-01', xpPerCoin: 20, dailyCapXp: 200 }]
    expect(learningCoins({ '2026-09-30': 100, '2026-10-01': 100 }, later)).toBe(15) // 10 + 5
    expect(learningDays({}, eco)).toEqual([])
    expect(learningCoins({ '2026-09-21': 100 }, [])).toBe(0)
  })
  it('a purchase reserves coins, declining refunds them, approving spends them', () => {
    let { f } = family()
    f = apply(f, A.adjustCoins('dad', 'ellie', 100, 'Starting bonus', T('2026-09-21')))
    f = apply(f, A.saveTreat('dad', { title: 'Ice cream', cost: 60, emoji: '🍦', active: true }, T('2026-09-21')))
    const treat = Object.values(f.treats)[0]!
    expect(canRedeem(f, 'ellie', treat, 100, '2026-09-21')).toEqual({ ok: true })
    const { redeemId, events } = A.redeemTreat('ellie', 'ellie', treat, T('2026-09-22'))
    f = apply(f, events)
    expect(balanceFor(f, 'ellie')).toMatchObject({ reserved: 60, available: 40 })
    expect(canRedeem(f, 'ellie', treat, 40, '2026-09-22')).toEqual({ ok: false, reason: '20 more coins to go' })
    const declined = apply(f, A.decideRedeem('dad', redeemId, 'declined', 'Not today', T('2026-09-22', '13:00')))
    expect(balanceFor(declined, 'ellie')).toMatchObject({ reserved: 0, spent: 0, available: 100 })
    const approved = apply(f, A.decideRedeem('dad', redeemId, 'approved', undefined, T('2026-09-22', '13:00')))
    expect(balanceFor(approved, 'ellie')).toMatchObject({ reserved: 0, spent: 60, available: 40 })
    const given = apply(approved, A.decideRedeem('dad', redeemId, 'given', undefined, T('2026-09-22', '15:00')))
    expect(balanceFor(given, 'ellie').spent).toBe(60)
    // once handed over it can't be reversed by a stale device
    const stale = apply(given, A.decideRedeem('mum', redeemId, 'declined', undefined, T('2026-09-22', '16:00')))
    expect(stale.redeems[redeemId]?.status).toBe('given')
  })
  it('enforces the weekly limit on a treat', () => {
    let { f } = family()
    f = apply(f, A.adjustCoins('dad', 'ellie', 500, 'Bonus', T('2026-09-21')))
    f = apply(f, A.saveTreat('dad', { title: 'Screen time', cost: 40, emoji: '📱', active: true, maxPerWeek: 1 }, T('2026-09-21')))
    const treat = Object.values(f.treats)[0]!
    f = apply(f, A.redeemTreat('ellie', 'ellie', treat, T('2026-09-22')).events)
    expect(canRedeem(f, 'ellie', treat, 460, '2026-09-23')).toEqual({ ok: false, reason: 'Limit reached this week (1)' })
    expect(canRedeem(f, 'ellie', treat, 460, '2026-09-29').ok).toBe(true) // next week
  })
  it('the ledger adds up to the balance', () => {
    let { f } = family()
    const xpByDay = { '2026-09-21': 235, '2026-09-22': 480, '2026-09-23': 47 }
    f = apply(f, A.saveTask('dad', { title: 'HW', assignee: 'ellie', kind: 'homework', part: 'any', date: '2026-09-25', coins: 20 }, T('2026-09-20')))
    const task = Object.values(f.tasks)[0]!
    f = apply(f, A.completeTask('mum', f, task, '2026-09-25', {}, T('2026-09-24')))
    f = apply(f, A.adjustCoins('dad', 'ellie', -3, 'Forgot lunchbox', T('2026-09-24', '09:00')))
    f = apply(f, A.saveTreat('dad', { title: 'Movie pick', cost: 30, emoji: '🎬', active: true }, T('2026-09-21')))
    f = apply(f, A.redeemTreat('ellie', 'ellie', Object.values(f.treats)[0]!, T('2026-09-24', '10:00')).events)
    const bal = balanceFor(f, 'ellie', xpByDay)
    const ledger = ledgerFor(f, 'ellie', xpByDay).filter((e) => e.state !== 'waiting')
    expect(ledger.reduce((s, e) => s + e.delta, 0)).toBe(bal.available)
    expect(bal.learning).toBe(68) // 235 + 400 (capped) + 47 XP = 682 XP counted; whole coins only
  })
  it('suggests sensible coin values', () => {
    expect(suggestCoins('homework', 30)).toBe(20)
    expect(suggestCoins('chore', 5)).toBe(5)
    expect(suggestCoins('routine')).toBe(2)
  })
})

describe('timers', () => {
  it('measures time from timestamps, pauses excluded, and survives a long gap', () => {
    let { f } = family()
    const start = T('2026-09-21', '16:00')
    const { timerId, events } = A.startTimer('ellie', { memberId: 'ellie', label: 'Maths homework', plannedSec: 1800 }, start)
    f = apply(f, events)
    const t0 = () => f.timers[timerId]!
    expect(elapsedSec(t0(), start + 10 * 60_000)).toBe(600)
    expect(remainingSec(t0(), start + 10 * 60_000)).toBe(1200)
    f = apply(f, A.pauseTimer('ellie', timerId, start + 10 * 60_000))
    expect(t0().status).toBe('paused')
    expect(elapsedSec(t0(), start + 60 * 60_000)).toBe(600) // paused for 50 minutes
    f = apply(f, A.resumeTimer('ellie', timerId, start + 60 * 60_000))
    expect(elapsedSec(t0(), start + 65 * 60_000)).toBe(900)
    f = apply(f, A.extendTimer('ellie', timerId, 300, start + 66 * 60_000))
    expect(remainingSec(t0(), start + 65 * 60_000)).toBe(1800 + 300 - 900)
    expect(remainingSec(t0(), start + 120 * 60_000)!).toBeLessThan(0) // overtime is visible
    expect(activeTimers(f, { memberId: 'ellie' })).toHaveLength(1)
  })
  it('stopping a focus timer linked to a task ticks it off with the real minutes', () => {
    let { f } = family()
    f = apply(f, A.saveTask('dad', { title: 'Science booklet', assignee: 'ellie', kind: 'homework', part: 'any', date: '2026-09-28', minutes: 45 }, T('2026-09-20')))
    const task = Object.values(f.tasks)[0]!
    const s = T('2026-09-27', '17:00')
    const { timerId, events } = A.startTimer('ellie', { memberId: 'ellie', label: task.title, plannedSec: 2700, taskId: task.taskId, taskDate: '2026-09-28' }, s)
    f = apply(f, events)
    f = apply(f, A.finishTimer('ellie', f, timerId, 40 * 60_000, {}, s + 40 * 60_000))
    expect(f.timers[timerId]?.status).toBe('done')
    expect(f.done[`${task.taskId}|2026-09-28`]).toMatchObject({ minutes: 40, status: 'pending', coins: 20 })
    expect(activeTimers(f)).toHaveLength(0)
  })
  it('a second start with the same id is ignored (safe to sync twice)', () => {
    const { f } = family()
    const { events } = A.startTimer('ellie', { memberId: 'ellie', label: 'x' }, 1000)
    const once = apply(f, events)
    const twice = apply(once, events)
    expect(twice.timers).toEqual(once.timers)
  })
})

describe('calendar', () => {
  const now = T('2026-09-21', '08:00')
  it('merges family events, school, clubs, closures and birthdays for a day', () => {
    let { f } = family()
    f = apply(f, A.saveCal('mum', { title: 'Book club', date: '2026-09-21', allDay: false, start: '19:30', end: '21:30', members: ['mum'], category: 'social', busy: true }, now))
    const ctx = makeCalCtx(f)
    const items = itemsOn(ctx, '2026-09-21')
    expect(items.map((i) => i.title)).toEqual(['School', 'Drama rehearsal', 'Book club'])
    expect(items[0]).toMatchObject({ start: '08:30', end: '15:05', sub: '5 lessons · Week B' })
    expect(itemsOn(ctx, '2026-10-27').map((i) => i.title)).toEqual(['Autumn half-term'])
    expect(itemsOn(ctx, '2027-03-14').map((i) => i.title)).toContain("Ellie's birthday")
    expect(itemsOn(ctx, '2026-09-21', { members: ['dad'] }).map((i) => i.title)).toEqual([]) // nothing involves Dad
    expect(itemsOn(ctx, '2026-09-21', { schoolDetail: 'lessons' }).filter((i) => i.category === 'lesson')).toHaveLength(5)
  })
  it('repeating events follow their rule, including school weeks', () => {
    let { f } = family()
    f = apply(f, A.saveCal('dad', { title: 'Swimming', date: '2026-09-21', allDay: false, start: '17:00', end: '18:00', members: ['ellie'], category: 'activity', busy: true, recur: { freq: 'weekly', schoolWeek: 'B' } }, now))
    const ctx = makeCalCtx(f)
    const has = (d: string) => itemsOn(ctx, d).some((i) => i.title === 'Swimming')
    expect(has('2026-09-21')).toBe(true)
    expect(has('2026-09-28')).toBe(false)
    expect(has('2026-10-05')).toBe(true)
    const swim = Object.values(f.cal)[0]!
    f = apply(f, A.skipOccurrence('dad', swim, '2026-10-05', now))
    expect(itemsOn(makeCalCtx(f), '2026-10-05').some((i) => i.title === 'Swimming')).toBe(false)
  })
  it('shows homework due dates on the calendar and marks them done', () => {
    let { f } = family()
    f = apply(f, A.addPackHomework('dad', f, 'ellie', SAMPLE_PACK))
    const sci = Object.values(f.tasks).find((t) => t.subject === 'Science')!
    expect(itemsOn(makeCalCtx(f), '2026-09-28').find((i) => i.category === 'homework')).toMatchObject({ title: 'Science: Human Body booklet, Task 1 due', taskDone: false })
    f = apply(f, A.completeTask('dad', f, sci, sci.date!, {}, now))
    expect(itemsOn(makeCalCtx(f), '2026-09-28').find((i) => i.category === 'homework')?.taskDone).toBe(true)
  })
  it('adding the school homework twice never duplicates it', () => {
    const { f } = family()
    const first = A.addPackHomework('dad', f, 'ellie', SAMPLE_PACK, 1)
    const second = A.addPackHomework('mum', f, 'ellie', SAMPLE_PACK, 999) // another phone, before syncing
    expect(first).toHaveLength(4)
    expect(mergeEvents(first, second)).toHaveLength(4)
    expect(A.addPackHomework('dad', apply(f, first), 'ellie', SAMPLE_PACK)).toHaveLength(0)
  })
  it('finds gaps and free slots', () => {
    expect(gapsIn([{ start: 540, end: 600 }, { start: 660, end: 720 }], { start: 480, end: 780 }, 30)).toEqual([
      { start: 480, end: 540 },
      { start: 600, end: 660 },
      { start: 720, end: 780 },
    ])
    expect(gapsIn([{ start: 480, end: 500 }], { start: 480, end: 520 }, 30)).toEqual([])
    const { f } = family()
    const ctx = makeCalCtx(f)
    // Weekday slots for Ellie start after her club; the weekend is wide open.
    const slots = freeSlots(ctx, { members: ['ellie', 'dad'], from: '2026-09-21', days: 7, minMinutes: 90 })
    expect(slots.find((s) => s.date === '2026-09-21')).toMatchObject({ start: '16:05', end: '20:30' })
    expect(slots.find((s) => s.date === '2026-09-26')).toMatchObject({ start: '08:00', end: '20:30', minutes: 750 })
    expect(slots.find((s) => s.date === '2026-09-22')?.start).toBe('15:05') // no club on Tuesday
  })
  it('an event that blocks people takes them out of the free slots', () => {
    let { f } = family()
    f = apply(f, A.saveCal('dad', { title: 'Football', date: '2026-09-26', allDay: false, start: '10:00', end: '12:00', members: ['ellie'], category: 'activity', busy: true }, now))
    const slots = freeSlots(makeCalCtx(f), { members: ['ellie', 'mum'], from: '2026-09-26', days: 1, minMinutes: 60 })
    expect(slots.map((s) => [s.start, s.end])).toEqual([['08:00', '10:00'], ['12:00', '20:30']])
  })
  it('lists help wanted and who has offered', () => {
    let { f } = family()
    const [e] = A.saveCal('mum', { title: 'Lift to football', date: '2026-09-26', allDay: false, start: '09:00', end: '09:30', members: ['ellie'], category: 'activity', busy: true, help: { note: 'Can someone drive?' } }, now)
    f = apply(f, [e!])
    const calId = (e as { calId: string }).calId
    expect(helpWanted(makeCalCtx(f), '2026-09-21', 7, 'dad')).toHaveLength(1)
    f = apply(f, A.offerHelp('dad', calId, '2026-09-26', true, now + 5))
    expect(helpWanted(makeCalCtx(f), '2026-09-21', 7, 'dad')[0]?.offers).toEqual(['dad'])
    f = apply(f, A.offerHelp('dad', calId, '2026-09-26', false, now + 6))
    expect(helpWanted(makeCalCtx(f), '2026-09-21', 7, 'dad')[0]?.offers).toEqual([])
  })
})

describe("today's list", () => {
  const now = T('2026-09-25', '16:00')
  it('shows homework a week ahead, overdue first, and keeps things ticked today', () => {
    let { f } = family(now)
    f = apply(f, A.addPackHomework('dad', f, 'ellie', SAMPLE_PACK))
    f = apply(f, A.saveTask('dad', { title: 'Brush teeth', assignee: 'ellie', kind: 'routine', part: 'evening', date: '2026-09-21', recur: { freq: 'daily' } }, now))
    f = apply(f, A.saveTask('dad', { title: 'Empty dishwasher', assignee: 'ellie', kind: 'chore', part: 'day', date: '2026-09-24' }, now)) // overdue
    const ctx = makeCalCtx(f)
    let rows = tasksFor(ctx, 'ellie', '2026-09-25', now)
    // Globe homework (due 12 Oct) is beyond a week; the three due 28-30 Sep are inside it.
    expect(rows.map((r) => r.task.title)).toEqual(['Empty dishwasher', 'Brush teeth', 'Human Body booklet, Task 1', 'Homework One', 'KS3 Maths Homework'])
    expect(rows[0]).toMatchObject({ overdue: true, dueIn: -1 })
    const sci = rows.find((r) => r.task.title.startsWith('Human'))!
    f = apply(f, A.completeTask('ellie', f, sci.task, sci.date, {}, now))
    rows = tasksFor(makeCalCtx(f), 'ellie', '2026-09-25', now)
    expect(rows.find((r) => r.task.title.startsWith('Human'))?.done?.status).toBe('pending')
    expect(rows[rows.length - 1]!.task.title).toBe('Human Body booklet, Task 1') // ticked items sink to the bottom
    // tomorrow it disappears
    expect(tasksFor(makeCalCtx(f), 'ellie', '2026-09-26', now).some((r) => r.task.title.startsWith('Human'))).toBe(false)
    // repeating tasks are per day
    expect(tasksFor(makeCalCtx(f), 'ellie', '2026-09-26', now).some((r) => r.task.title === 'Brush teeth' && !r.done)).toBe(true)
  })
})

describe('trackers', () => {
  const now = T('2026-09-25', '10:00')
  it('logs dog walks and meals, warns about doubles, and ticks a linked task', () => {
    let { f } = family(now)
    f = apply(f, A.saveTask('dad', { title: 'Walk Alfie', assignee: 'ellie', kind: 'chore', part: 'afternoon', date: '2026-09-21', recur: { freq: 'daily' }, petLink: { petId: 'alfie', kind: 'walk' } }, now))
    const evs = A.logPet('ellie', f, { petId: 'alfie', kind: 'walk', at: now, minutes: 30 }, now)
    expect(evs.map((e) => e.type)).toEqual(['pet', 'task-done'])
    f = apply(f, evs)
    expect(f.done[`${Object.values(f.tasks)[0]!.taskId}|2026-09-25`]?.status).toBe('pending')
    // logging another walk the same day doesn't tick it twice
    expect(A.logPet('ellie', f, { petId: 'alfie', kind: 'walk', at: now + 4 * 3_600_000, minutes: 20 }, now + 4 * 3_600_000).map((e) => e.type)).toEqual(['pet'])
    f = apply(f, A.logPet('dad', f, { petId: 'alfie', kind: 'feed', at: now, meal: suggestMeal(now) }, now))
    const day = petDay(f, 'alfie', '2026-09-25')
    expect(day.walks).toHaveLength(1)
    expect(day.walkMinutes).toBe(30)
    expect(day.meals[0]?.meal).toBe('breakfast')
    expect(recentDuplicate(f, 'alfie', 'feed', now + 20 * 60_000)?.learnerId).toBe('dad')
    expect(recentDuplicate(f, 'alfie', 'feed', now + 5 * 3_600_000)).toBeUndefined()
    expect(suggestMeal(T('2026-09-25', '18:00'))).toBe('dinner')
  })
  it('one-tap baby logs add up into a day summary and can be undone', () => {
    let { f } = family(now)
    const log = (evs: AppEvent[]) => (f = apply(f, evs))
    log(A.logBaby('mum', { babyId: 'sam', kind: 'nappy', at: T('2026-09-25', '06:10'), nappy: { wet: true, dirty: false } }, T('2026-09-25', '06:10')))
    const both = A.logBaby('dad', { babyId: 'sam', kind: 'nappy', at: T('2026-09-25', '07:00'), nappy: { wet: true, dirty: true } }, T('2026-09-25', '07:00'))
    log(both)
    log(A.logBaby('mum', { babyId: 'sam', kind: 'feed', at: T('2026-09-25', '06:30'), feed: { method: 'breast', side: 'L', minutes: 12 } }, T('2026-09-25', '06:30')))
    log(A.logBaby('dad', { babyId: 'sam', kind: 'feed', at: T('2026-09-25', '09:15'), feed: { method: 'bottle', ml: 90, milk: 'formula' } }, T('2026-09-25', '09:15')))
    log(A.logBaby('mum', { babyId: 'sam', kind: 'sleep', at: T('2026-09-25', '07:30'), endAt: T('2026-09-25', '09:00') }, T('2026-09-25', '09:00')))
    let d = babyDay(f, 'sam', '2026-09-25')
    expect(d).toMatchObject({ wet: 2, dirty: 1, ml: 90, breastMinutes: 12, sleepMinutes: 90 })
    expect(d.feeds).toHaveLength(2)
    log(A.undo('dad', both[0]!.id, T('2026-09-25', '07:01')))
    d = babyDay(f, 'sam', '2026-09-25')
    expect(d).toMatchObject({ wet: 1, dirty: 0 })
    expect(describeBaby(f.babies.find((b) => b.feed?.method === 'bottle')!)).toBe('Bottle 90 ml (formula)')
    expect(describeBaby(f.babies.find((b) => b.feed?.side === 'L')!)).toBe('Breast, left, 12 min')
    const text = babySummaryText(f, 'sam', '2026-09-25', 2)
    expect(text).toContain('Sam: last 2 days')
    expect(text).toContain('Fri 25 Sep: 2 feeds (90 ml bottle), 1 wet, 0 dirty, sleep 1h 30m')
  })
  it('finishing a feed timer logs the feed with side and minutes', () => {
    let { f } = family(now)
    const s = T('2026-09-25', '14:00')
    const { timerId, events } = A.startTimer('mum', { memberId: 'mum', label: 'Feed (left)', purpose: 'feed', subjectId: 'sam', side: 'L' }, s)
    f = apply(f, events)
    f = apply(f, A.finishTimer('mum', f, timerId, 14 * 60_000, {}, s + 14 * 60_000))
    const feed = f.babies.find((b) => b.kind === 'feed')!
    expect(feed).toMatchObject({ babyId: 'sam', feed: { method: 'breast', side: 'L', minutes: 14 }, at: s })
  })
})

describe('family plans', () => {
  const now = T('2026-09-22', '18:00')
  it('ranks ideas by votes and shows who is still to vote', () => {
    let { f } = family(now)
    f = apply(f, A.proposeIdea('ellie', { title: 'Movie night', kind: 'movie', emoji: '🍿' }, now))
    f = apply(f, A.proposeIdea('dad', { title: 'Bowling', kind: 'outing', emoji: '🎳' }, now + 1))
    const [movie, bowling] = [Object.values(f.ideas).find((i) => i.title === 'Movie night')!, Object.values(f.ideas).find((i) => i.title === 'Bowling')!]
    f = apply(f, A.castVote('ellie', movie.id, 'yes', now + 2))
    f = apply(f, A.castVote('mum', movie.id, 'maybe', now + 3))
    f = apply(f, A.castVote('ellie', bowling.id, 'no', now + 4))
    f = apply(f, A.castVote('dad', bowling.id, 'yes', now + 5))
    const ranked = rankIdeas(f)
    expect(ranked.map((r) => r.idea.title)).toEqual(['Movie night', 'Bowling'])
    expect(ranked[0]).toMatchObject({ score: 3, waiting: ['dad'] })
    expect(ranked[1]).toMatchObject({ score: 0, waiting: ['mum'] })
    f = apply(f, A.castVote('ellie', movie.id, 'clear', now + 6))
    expect(rankIdeas(f)[0]?.yes).toEqual([])
    expect(f.votes[`${movie.id}|ellie`]).toBeUndefined()
  })
  it('planning an idea puts it on everyone\'s calendar', () => {
    let { f } = family(now)
    f = apply(f, A.proposeIdea('ellie', { title: 'Pizza night', kind: 'dinner', emoji: '🍕' }, now))
    const idea = Object.values(f.ideas)[0]!
    f = apply(f, A.planIdea('dad', idea, { date: '2026-09-25', start: '18:30', end: '20:00' }, now + 10))
    expect(f.ideas[idea.id]).toMatchObject({ status: 'planned', when: { date: '2026-09-25' } })
    const items = itemsOn(makeCalCtx(f), '2026-09-25')
    expect(items.find((i) => i.title === '🍕 Pizza night')).toMatchObject({ everyone: true, start: '18:30', category: 'meal', busy: true })
    expect(rankIdeas(f)).toHaveLength(0) // no longer "open"
    expect(rankIdeas(f, ['planned'])).toHaveLength(1)
  })
})

describe('multi-device convergence', () => {
  it('two phones that log at the same time end up with the same family', () => {
    const { events } = family()
    const phoneA = [...events, ...A.logBaby('mum', { babyId: 'sam', kind: 'nappy', at: 5000, nappy: { wet: true, dirty: false } }, 5000)]
    const phoneB = [...events, ...A.logPet('dad', projectFamily(events), { petId: 'alfie', kind: 'feed', at: 5100, meal: 'dinner' }, 5100)]
    const merged1 = mergeEvents(phoneA, phoneB)
    const merged2 = mergeEvents(phoneB, phoneA)
    expect(projectFamily(merged1)).toEqual(projectFamily(merged2))
    expect(projectFamily(merged1).babies).toHaveLength(1)
    expect(projectFamily(merged1).pets).toHaveLength(1)
  })
})

describe('review fixes (regressions)', () => {
  const oneOff = (_f: FamilyState, over: Partial<Parameters<typeof A.saveTask>[1]> = {}) => {
    const ev = A.saveTask('dad', { title: 'Book report', assignee: 'ellie', kind: 'homework', part: 'any', date: '2026-09-25', check: 'self', coins: 20, ...over }, T('2026-09-20'))
    return { ev, taskId: (ev[0] as unknown as { taskId: string }).taskId }
  }

  it('moving the due date of a task that is already done does not let it be paid twice', () => {
    let { f } = family()
    const { ev, taskId } = oneOff(f)
    f = apply(f, ev)
    f = apply(f, A.completeTask('ellie', f, f.tasks[taskId]!, '2026-09-25', {}, T('2026-09-24')))
    expect(balanceFor(f, 'ellie').tasks).toBe(20)
    // a parent edits the due date afterwards
    f = apply(f, A.saveTask('dad', { ...f.tasks[taskId]!, date: '2026-09-27' }, T('2026-09-24', '13:00')))
    expect(f.done[`${taskId}|2026-09-25`]).toBeUndefined()
    expect(f.done[`${taskId}|2026-09-27`]?.status).toBe('approved')
    expect(balanceFor(f, 'ellie').tasks).toBe(20)
    expect(tasksFor(makeCalCtx(f), 'ellie', '2026-09-24', T('2026-09-24', '15:00')).find((r) => r.task.taskId === taskId)?.done).toBeTruthy()
  })

  it('coins stay with the child the task was assigned to when it was done, even if it is reassigned later', () => {
    let { f } = family()
    const { ev, taskId } = oneOff(f)
    f = apply(f, ev)
    f = apply(f, A.completeTask('ellie', f, f.tasks[taskId]!, '2026-09-25', {}, T('2026-09-24')))
    f = apply(f, A.saveTask('dad', { ...f.tasks[taskId]!, assignee: 'mum' }, T('2026-09-24', '14:00')))
    expect(balanceFor(f, 'ellie').tasks).toBe(20)
    expect(balanceFor(f, 'mum').tasks).toBe(0)
  })

  it("undoing one phone's tick clears the completion even when two phones ticked it", () => {
    let { f } = family()
    const { ev, taskId } = oneOff(f)
    f = apply(f, ev)
    const a = A.completeTask('ellie', f, f.tasks[taskId]!, '2026-09-25', {}, T('2026-09-24', '10:00'))
    const b = A.completeTask('ellie', f, f.tasks[taskId]!, '2026-09-25', {}, T('2026-09-24', '10:00:01'.slice(0, 5)) + 1000)
    f = apply(f, [...a, ...b])
    f = apply(f, A.undo('ellie', a[0]!.id, T('2026-09-24', '10:05')))
    expect(balanceFor(f, 'ellie').tasks).toBe(0)
  })

  it("a parent's decision made on a phone whose clock is behind still lands", () => {
    let { f: base } = family()
    const { ev, taskId } = oneOff(base, { check: 'parent' })
    base = apply(base, ev)
    const done = A.completeTask('ellie', base, base.tasks[taskId]!, '2026-09-25', {}, T('2026-09-24', '12:00'))
    const check = A.checkTask('dad', taskId, '2026-09-25', 'approved', undefined, T('2026-09-24', '11:58')) // dad's clock is 2 minutes+ behind
    const { events } = family()
    const all = [...events, ...ev, ...done, ...check]
    const f = projectFamily(all)
    expect(f.done[`${taskId}|2026-09-25`]?.status).toBe('approved')
    expect(balanceFor(f, 'ellie').tasks).toBe(20)
    // same thing for a treat decision
    let g = projectFamily(events)
    g = apply(g, A.adjustCoins('dad', 'ellie', 100, 'Bonus', T('2026-09-21')))
    g = apply(g, A.saveTreat('dad', { title: 'Ice cream', cost: 60, emoji: '🍦', active: true }, T('2026-09-21')))
    const { redeemId, events: rq } = A.redeemTreat('ellie', 'ellie', Object.values(g.treats)[0]!, T('2026-09-22', '12:00'))
    const dec = A.decideRedeem('dad', redeemId, 'declined', undefined, T('2026-09-22', '11:58'))
    const h = projectFamily([...events, ...A.adjustCoins('dad', 'ellie', 100, 'Bonus', T('2026-09-21')), ...rq, ...dec])
    expect(h.redeems[redeemId]?.status).toBe('declined')
    expect(balanceFor(h, 'ellie').reserved).toBe(0)
  })

  it("a child's late cancel cannot refund coins a parent has already approved", () => {
    let { f } = family()
    f = apply(f, A.adjustCoins('dad', 'ellie', 100, 'Bonus', T('2026-09-21')))
    f = apply(f, A.saveTreat('dad', { title: 'Ice cream', cost: 60, emoji: '🍦', active: true }, T('2026-09-21')))
    const { redeemId, events } = A.redeemTreat('ellie', 'ellie', Object.values(f.treats)[0]!, T('2026-09-22'))
    f = apply(f, events)
    f = apply(f, A.decideRedeem('dad', redeemId, 'approved', undefined, T('2026-09-22', '13:00')))
    f = apply(f, A.decideRedeem('ellie', redeemId, 'cancelled', undefined, T('2026-09-22', '13:01')))
    expect(f.redeems[redeemId]?.status).toBe('approved')
    expect(balanceFor(f, 'ellie').spent).toBe(60)
  })

  it('logging a walk does not tick a repeating walk task on a day it does not repeat', () => {
    let { f } = family()
    f = apply(f, A.saveTask('ellie', { title: 'Walk Alfie', assignee: 'ellie', kind: 'chore', part: 'afternoon', date: '2026-09-21', recur: { freq: 'weekly', byWeekday: [0] }, petLink: { petId: 'alfie', kind: 'walk' } }, T('2026-09-20')))
    const wed = A.logPet('ellie', f, { petId: 'alfie', kind: 'walk', at: T('2026-09-23', '17:00'), minutes: 30 }, T('2026-09-23', '17:00'))
    expect(wed.filter((e) => e.type === 'task-done')).toHaveLength(0)
    const mon = A.logPet('ellie', f, { petId: 'alfie', kind: 'walk', at: T('2026-09-28', '17:00'), minutes: 30 }, T('2026-09-28', '17:00'))
    expect(mon.filter((e) => e.type === 'task-done')).toHaveLength(1)
  })

  it('finishing a timer that another phone already finished does nothing', () => {
    let { f } = family()
    const { timerId, events } = A.startTimer('mum', { memberId: 'mum', label: 'Sleep', purpose: 'sleep', subjectId: 'sam' }, T('2026-09-21', '10:00'))
    f = apply(f, events)
    const first = A.finishTimer('mum', f, timerId, 3600_000, {}, T('2026-09-21', '11:00'))
    expect(first.some((e) => e.type === 'baby')).toBe(true)
    f = apply(f, first)
    expect(A.finishTimer('dad', f, timerId, 3600_000, {}, T('2026-09-21', '11:00'))).toEqual([])
  })

  it('a hand-pasted pack with a broken row is rejected, and one that slips through is ignored by every phone', () => {
    const bad = { ...SAMPLE_PACK, clubs: [{ id: 'x', name: 'Chess', teacher: 'T', day: 1, booked: true }] } as unknown
    expect(validatePack(bad)).toMatch(/clubs/)
    expect(validatePack({ ...SAMPLE_PACK, day: [null] })).toMatch(/day/)
    let { f } = family()
    const before = f.schools['ellie']
    f = apply(f, A.importSchoolPack('dad', 'ellie', bad as typeof SAMPLE_PACK, T('2026-09-22')))
    expect(f.schools['ellie']).toBe(before)
  })

  it('changing a child year and back again is not lost', () => {
    const up = A.childProfile('ellie', 'Ellie', 8, 1000)
    const down = A.childProfile('ellie', 'Ellie', 7, 2000)
    const up2 = A.childProfile('ellie', 'Ellie', 8, 3000)
    expect(new Set([up[0]!.id, down[0]!.id, up2[0]!.id]).size).toBe(3)
  })
})

describe('new-baby plan (arrival pack)', () => {
  const expecting = (now = T('2026-09-21', '08:00')) => {
    const { events } = family(now)
    const evs = [...events, ...A.saveMember('dad', { id: 'bump', name: 'Robin', role: 'baby', colour: '#3ddc97', active: true, dueDate: '2026-10-10' }, now + 10)]
    return projectFamily(evs)
  }

  it('the bundled plan is complete: 14 days, one outdoor and one indoor activity each, medical focus on days 1 to 7', () => {
    expect(ARRIVAL_DAYS).toBe(14)
    expect(ARRIVAL_ACTIVITIES).toHaveLength(28)
    expect(new Set(ARRIVAL_ACTIVITIES.map((a) => a.id)).size).toBe(28)
    for (let d = 1; d <= 14; d++) {
      const day = activitiesOnDay(d)
      expect(day.map((a) => a.env).sort()).toEqual(['Indoor', 'Outdoor'])
      expect(!!focusOnDay(d)).toBe(d <= 7)
    }
    expect(focusOnDay(5)).toMatch(/heel prick/i)
    expect(focusOnDay(7)).toMatch(/GP/)
    for (const a of ARRIVAL_ACTIVITIES) {
      expect(a.title.trim()).not.toBe('')
      expect(a.what.trim()).not.toBe('')
      expect(a.props.length).toBeGreaterThan(0)
    }
  })

  it('has eight easy meals with unique ids, four breakfasts and four lunches', () => {
    expect(ARRIVAL_MEALS).toHaveLength(8)
    expect(new Set(ARRIVAL_MEALS.map((m) => m.id)).size).toBe(8)
    expect(ARRIVAL_MEALS.filter((m) => m.meal === 'Breakfast')).toHaveLength(4)
    expect(ARRIVAL_MEALS.filter((m) => m.meal === 'Lunch')).toHaveLength(4)
  })

  it('a baby with a due date and no birthday is expecting; a baby without either counts as born', () => {
    const f = expecting()
    expect(isExpecting(f.members['bump']!)).toBe(true)
    expect(expectedBabies(f).map((m) => m.id)).toEqual(['bump'])
    expect(bornBabies(f).map((m) => m.id)).toEqual(['sam'])
  })

  it('day 1 is the day after the birth unless the family says otherwise, and the plan covers 14 days', () => {
    const born = { birthday: '2026-10-10' }
    expect(dayOneOf(born)).toBe('2026-10-11')
    expect(dayOneOf({ ...born, dayOne: '2026-10-12' })).toBe('2026-10-12')
    expect(arrivalDayOn(born, '2026-10-10')).toBeUndefined() // birth day itself
    expect(arrivalDayOn(born, '2026-10-11')).toBe(1)
    expect(arrivalDayOn(born, '2026-10-24')).toBe(14)
    expect(arrivalDayOn(born, '2026-10-25')).toBeUndefined()
    expect(arrivalDayOn({ birthday: '2026-10-10', dayOne: '2026-10-12' }, '2026-10-11')).toBeUndefined()
    expect(arrivalDayOn({}, '2026-10-11')).toBeUndefined()
  })

  it('nothing reaches the calendar while the baby is expected', () => {
    const f = expecting()
    for (const d of ['2026-10-09', '2026-10-10', '2026-10-11', '2026-10-17']) expect(arrivalItemsOn(f, d)).toEqual([])
    expect(itemsOn(makeCalCtx(f), '2026-10-11').filter((i) => i.source === 'arrival')).toEqual([])
  })

  it('once the baby is born the medical checks appear for the parents on the right days, and only days 1 to 7', () => {
    let f = expecting()
    f = apply(f, A.saveMember('dad', { ...f.members['bump']!, birthday: '2026-10-12', dueDate: undefined }, T('2026-10-12', '09:00')))
    expect(bornBabies(f).map((m) => m.id).sort()).toEqual(['bump', 'sam'])
    const d5 = arrivalItemsOn(f, '2026-10-17') // day 5
    expect(d5).toHaveLength(1)
    expect(d5[0]).toMatchObject({ source: 'arrival', allDay: true, everyone: false })
    expect(d5[0]!.title).toMatch(/heel prick/i)
    expect(d5[0]!.members.sort()).toEqual(['dad', 'mum'])
    expect(d5[0]!.sub).toMatch(/Robin/)
    expect(arrivalItemsOn(f, '2026-10-12')).toEqual([]) // birth day
    expect(arrivalItemsOn(f, '2026-10-20')).toEqual([]) // day 8: activities only, no medical focus
    expect(itemsOn(makeCalCtx(f), '2026-10-17').some((i) => i.source === 'arrival')).toBe(true)
  })

  it('changing the first-day-at-home date moves the plan', () => {
    let f = expecting()
    f = apply(f, A.saveMember('dad', { ...f.members['bump']!, birthday: '2026-10-12', dueDate: undefined, dayOne: '2026-10-15' }, T('2026-10-12', '09:00')))
    expect(arrivalItemsOn(f, '2026-10-13')).toEqual([])
    expect(arrivalItemsOn(f, '2026-10-15')[0]!.title).toBe(focusOnDay(1))
  })

  it('a birthday is not shown on the day the baby was born', () => {
    let f = expecting()
    f = apply(f, A.saveMember('dad', { ...f.members['bump']!, birthday: '2026-10-12', dueDate: undefined }, T('2026-10-12', '09:00')))
    expect(itemsOn(makeCalCtx(f), '2026-10-12').filter((i) => i.source === 'birthday' && /Robin/.test(i.title))).toEqual([])
  })

  it('activities turn into stable, well-formed family ideas', () => {
    for (const a of ARRIVAL_ACTIVITIES) {
      const d = ideaDraftFor(a)
      expect(d.ideaId).toBe(`idea-arr-${a.id}`)
      expect(d.notes).toContain(a.what)
      expect(['outing', 'movie', 'treat', 'game']).toContain(d.kind)
      expect(kindFor(a) === 'outing').toBe(a.env === 'Outdoor')
    }
    let { f } = family()
    const a = ARRIVAL_ACTIVITIES[0]!
    f = apply(f, A.proposeIdea('dad', ideaDraftFor(a), T('2026-09-22')))
    f = apply(f, A.proposeIdea('mum', ideaDraftFor(a), T('2026-09-23'))) // suggesting twice does not duplicate it
    expect(Object.values(f.ideas).filter((i) => i.id === ideaDraftFor(a).ideaId)).toHaveLength(1)
  })

  it('"Full Family" activities go on everyone\'s calendar, others on the parents\' (plus the children if named)', () => {
    const { f } = family()
    const full = ARRIVAL_ACTIVITIES.find((a) => /full family/i.test(a.who))
    if (full) expect(whoFor(f, full)).toEqual({ everyone: true, members: [] })
    const step = ARRIVAL_ACTIVITIES.find((a) => /stepdaughter/i.test(a.who) && !/full family/i.test(a.who))
    if (step) expect(whoFor(f, step).members).toContain('ellie')
    const parentsOnly = ARRIVAL_ACTIVITIES.find((a) => !/full family|stepdaughter|sibling/i.test(a.who))
    if (parentsOnly) expect(whoFor(f, parentsOnly).members.sort()).toEqual(['dad', 'mum'])
  })
})
