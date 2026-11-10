import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import * as A from './actions'
import { announceWhere, announcementText, claimAnnouncement, dueAnnouncements, saveAnnouncer, setTaskAnnounce, spokenTime, suggestAnnounceTime, upcomingAnnouncements } from './announce'
import { makeCalCtx } from './calendar'
import { pauseCalm } from './calmPause'
import { toMin, tsOf } from './dates'
import { applyFamilyEvent, projectFamily } from './project'
import type { FamilyState } from './types'

const DAY = '2026-11-04' // a Wednesday
const apply = (f: FamilyState, evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, f)
const due = (f: FamilyState, hm: string, day = DAY) => dueAnnouncements(makeCalCtx(f), day, toMin(hm as never), tsOf(day, hm as never))

function family(): FamilyState {
  const t0 = tsOf('2026-11-01', '08:00')
  return projectFamily([
    ...A.saveMember('sam', { id: 'sam', name: 'Sam', role: 'parent', colour: '#4cc9f0', active: true }, t0),
    ...A.saveMember('sam', { id: 'maya', name: 'Maya', role: 'child', colour: '#ffc857', active: true }, t0 + 1),
    ...A.saveMember('sam', { id: 'biscuit', name: 'Biscuit', role: 'pet', colour: '#b388ff', active: true }, t0 + 2),
    ...A.saveTask('sam', { taskId: 'dish', title: 'Empty the dishwasher', assignee: 'maya', kind: 'chore', part: 'afternoon', date: DAY, time: '16:30', announce: true }, t0 + 3),
    ...A.saveTask('sam', { taskId: 'bins', title: 'Bins out', assignee: 'sam', kind: 'chore', part: 'evening', date: '2026-11-02', time: '19:00', announce: true, recur: { freq: 'weekly', byWeekday: [2] } }, t0 + 4),
    ...A.saveTask('sam', { taskId: 'quiet', title: 'Water the plants', assignee: 'sam', kind: 'chore', part: 'afternoon', date: DAY, time: '16:30' }, t0 + 5),
    ...A.saveTask('sam', { taskId: 'hw', title: 'Maths sheet', assignee: 'maya', kind: 'homework', part: 'any', date: '2026-11-06', doOn: DAY, time: '17:00', subject: 'Maths', announce: true }, t0 + 6),
  ])
}

describe('how a read-out sounds', () => {
  it('says the time the way people do', () => {
    expect(spokenTime('16:30')).toBe('half past four')
    expect(spokenTime('07:45')).toBe('quarter to eight')
    expect(spokenTime('07:15')).toBe('quarter past seven')
    expect(spokenTime('19:00')).toBe('seven o’clock')
    expect(spokenTime('12:00')).toBe('midday')
    expect(spokenTime('00:00')).toBe('midnight')
    expect(spokenTime('08:25')).toBe('twenty-five past eight')
    expect(spokenTime('08:40')).toBe('twenty to nine')
    expect(spokenTime('11:50')).toBe('ten to twelve')
    expect(spokenTime('16:37')).toBe('four thirty-seven')
    expect(spokenTime('09:03')).toBe('nine oh three')
  })

  it('starts with the time, then who and what, in a natural sentence', () => {
    expect(announcementText({ title: 'Empty the dishwasher', kind: 'chore' }, 'Maya', '16:30')).toBe('It’s half past four. Maya, it’s time to empty the dishwasher.')
    expect(announcementText({ title: 'Bins out', kind: 'chore' }, 'Sam', '19:00')).toBe('It’s seven o’clock. Sam, it’s time for Bins out.')
    expect(announcementText({ title: 'Sheet 4', kind: 'homework', subject: 'Maths' }, 'Maya', '17:00')).toBe('It’s five o’clock. Maya, it’s time for Maths: Sheet 4.')
    expect(announcementText({ title: 'Maths sheet', kind: 'homework', subject: 'Maths' }, 'Maya', '17:00')).toBe('It’s five o’clock. Maya, it’s time for Maths sheet.')
  })
})

describe('what is due to be read out', () => {
  it('only tasks switched on, with a time, around that time (never long after)', () => {
    const f = family()
    expect(due(f, '16:29')).toEqual([])
    expect(due(f, '16:30').map((a) => a.taskId)).toEqual(['dish'])
    expect(due(f, '16:34').map((a) => a.taskId)).toEqual(['dish'])
    expect(due(f, '16:35')).toEqual([])
    expect(due(f, '16:30')[0]).toMatchObject({ key: `dish|${DAY}`, memberId: 'maya', text: 'It’s half past four. Maya, it’s time to empty the dishwasher.' })
  })

  it('repeating tasks on their days, homework on its "do it on" day', () => {
    const f = family()
    expect(due(f, '19:01').map((a) => a.taskId)).toEqual(['bins'])
    expect(due(f, '19:01', '2026-11-05')).toEqual([])
    expect(due(f, '17:00').map((a) => a.taskId)).toEqual(['hw'])
    expect(due(f, '17:00', '2026-11-06')).toEqual([])
  })

  it('not once it is done, already read out, during quiet hours, or while that person has paused', () => {
    let f = family()
    const done = apply(f, A.completeTask('maya', f, f.tasks.dish!, DAY, {}, tsOf(DAY, '16:00')))
    expect(due(done, '16:30')).toEqual([])
    const claimed = apply(f, claimAnnouncement('sam', `dish|${DAY}`, 'kitchen', tsOf(DAY, '16:30')))
    expect(due(claimed, '16:31')).toEqual([])
    // The first claim wins: a second device's claim doesn't replace it.
    const twice = apply(claimed, [...claimAnnouncement('sam', `dish|${DAY}`, 'hall', tsOf(DAY, '16:30') + 500)].map((e) => ({ ...e, id: 'other' })))
    expect(twice.announced[`dish|${DAY}`]!.by).toBe('kitchen')
    f = apply(f, A.saveTask('sam', { taskId: 'late', title: 'Brush teeth', assignee: 'maya', kind: 'routine', part: 'evening', date: DAY, time: '22:00', announce: true }, tsOf(DAY, '09:00')))
    expect(due(f, '22:00')).toEqual([]) // quiet hours start at 21:30 by default
    const paused = apply(family(), pauseCalm('maya', family(), 'maya', tsOf(DAY, '23:59'), {}, tsOf(DAY, '15:00')))
    expect(due(paused, '16:30')).toEqual([])
  })

  it('lists what is coming up today, soonest first', () => {
    const f = family()
    expect(upcomingAnnouncements(makeCalCtx(f), DAY, toMin('16:00'), tsOf(DAY, '16:00')).map((a) => `${a.time} ${a.taskId}`)).toEqual(['16:30 dish', '17:00 hw', '19:00 bins'])
  })
})

describe('switching it on', () => {
  it('suggests a time from the part of the day', () => {
    expect(suggestAnnounceTime('morning', 0)).toBe('07:30')
    expect(suggestAnnounceTime('evening', 0)).toBe('18:30')
    expect(suggestAnnounceTime('any', toMin('16:05'))).toBe('16:30')
  })

  it('keeps everything else about the task', () => {
    let f = family()
    f = apply(f, setTaskAnnounce('sam', f.tasks.quiet!, true, undefined, tsOf(DAY, '10:00')))
    expect(f.tasks.quiet).toMatchObject({ title: 'Water the plants', assignee: 'sam', time: '16:30', announce: true })
    f = apply(f, setTaskAnnounce('sam', f.tasks.quiet!, false, undefined, tsOf(DAY, '10:01')))
    expect(f.tasks.quiet!.announce).toBeUndefined()
  })

  it('says where it will be heard', () => {
    let f = family()
    expect(announceWhere(f)).toEqual({ speakers: false, devices: [] })
    f = apply(f, saveAnnouncer('sam', 'dev1', 'Kitchen tablet', true, tsOf(DAY, '09:00')))
    f = apply(f, saveAnnouncer('sam', 'dev2', 'Old phone', false, tsOf(DAY, '09:01')))
    expect(announceWhere(f).devices).toEqual(['Kitchen tablet'])
  })
})
