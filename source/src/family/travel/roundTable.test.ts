import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import { makeEvent } from '@/engine/make'
import * as A from '../actions'
import { tsOf } from '../dates'
import { applyFamilyEvent, projectFamily } from '../project'
import type { FamilyState } from '../types'
import * as T from './actions'
import { currentRoundTable, isThisWeeksReady, notesFor, phaseOf, reviewLine, rtSettingsOf, scheduleFor } from './roundTable'

const at = (d: string, t = '12:00') => tsOf(d, t)
const family = (): FamilyState =>
  projectFamily([
    ...A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, at('2026-10-20', '06:00')),
    ...A.saveMember('dad', { id: 'kid', name: 'Kid', role: 'child', colour: '#ffc857', active: true }, at('2026-10-20', '06:01')),
  ])
const apply = (f: FamilyState, evs: AppEvent[]) => evs.reduce(applyFamilyEvent, f)
const server = (body: Record<string, unknown>, ts: number): AppEvent => makeEvent('dad', body as never, ts)
const facts = {
  weekOf: '2026-11-02',
  days: [
    { date: '2026-11-02', label: 'Mon 2 Nov', people: [{ name: 'Kid', fixed: ['Chess 15:10'], mustdo: 40, free: 120, school: true }], warnings: ['Kid: homework at risk'] },
    { date: 'nope', label: 'x', people: [], warnings: [] },
  ],
  issues: ['Mon 2 Nov: Kid: homework at risk', 7],
  learned: [],
  review: { from: '2026-10-26', to: '2026-11-01', people: [{ name: 'Kid', asked: 5, ok: 3, done: 0, later: 1, late: 0, skip: 1, swap: 0, none: 0, tasksDone: 4 }] },
}
const rt = (status: string, ts: number, extra: Record<string, unknown> = {}) => server({ type: 'round-table', weekOf: '2026-11-02', status, facts, ...extra }, ts)

describe('round table', () => {
  it('runs on Sunday at 17:00 for the next week by default, notes asked the day before', () => {
    const s = rtSettingsOf(family())
    expect(s).toEqual({ on: true, weekday: 6, at: '17:00', engine: 'local' })
    expect(scheduleFor('2026-10-29', s)).toEqual({ run: '2026-11-01', notesFrom: '2026-10-31', weekOf: '2026-11-02' })
    expect(scheduleFor('2026-11-01', s).weekOf).toBe('2026-11-02')
    expect(scheduleFor('2026-11-01', { ...s, weekday: 4 })).toEqual({ run: '2026-10-30', notesFrom: '2026-10-29', weekOf: '2026-11-02' })
  })

  it('goes from later to raise to waiting to ready', () => {
    let f = family()
    expect(phaseOf(f, '2026-10-30', '12:00')).toBe('later')
    expect(phaseOf(f, '2026-10-31', '17:59')).toBe('later')
    expect(phaseOf(f, '2026-10-31', '18:00')).toBe('raise')
    expect(phaseOf(f, '2026-11-01', '16:59')).toBe('raise')
    f = apply(f, [rt('waiting', at('2026-11-01', '17:00'))])
    expect(phaseOf(f, '2026-11-01', '17:01')).toBe('waiting')
    f = apply(f, [rt('ready', at('2026-11-01', '17:10'), { source: 'assistant', agenda: { summary: 'Calm week.', points: [{ text: 'Swim Sat' }, { nope: 1 }], proposals: ['p1'] } })])
    expect(phaseOf(f, '2026-11-01', '17:11')).toBe('ready')
    const cur = currentRoundTable(f, '2026-11-01')!
    expect(cur.agenda).toEqual({ summary: 'Calm week.', points: [{ text: 'Swim Sat' }], proposals: ['p1'] })
    expect(cur.facts.days.map((d) => d.date)).toEqual(['2026-11-02'])
    expect(cur.facts.issues).toEqual(['Mon 2 Nov: Kid: homework at risk'])
    expect(currentRoundTable(f, '2026-11-04')?.weekOf).toBe('2026-11-02')
    expect(currentRoundTable(f, '2026-11-09')).toBeUndefined()
    // an older "waiting" never replaces "ready"
    f = apply(f, [rt('waiting', at('2026-11-01', '17:00'))])
    expect(currentRoundTable(f, '2026-11-01')!.status).toBe('ready')
  })

  it('shows "ready" for a day and a half, or until the summit is done', () => {
    let f = apply(family(), [rt('ready', at('2026-11-01', '17:10'), { agenda: { summary: 'x', points: [], proposals: [] } })])
    expect(isThisWeeksReady(f, '2026-11-01', at('2026-11-01', '18:00'))).toBeDefined()
    expect(isThisWeeksReady(f, '2026-11-03', at('2026-11-03', '06:00'))).toBeUndefined()
    f = apply(f, A.completeSummit('dad', '2026-10-26', at('2026-11-01', '18:30')))
    expect(isThisWeeksReady(f, '2026-11-01', at('2026-11-01', '19:00'))).toBeUndefined()
  })

  it('keeps notes per week and lets them be removed', () => {
    let f = family()
    f = apply(f, T.addRoundTableNote('kid', '2026-11-02', '  Swimming on Saturday?  ', at('2026-10-31', '18:10')))
    f = apply(f, T.addRoundTableNote('dad', '2026-11-09', 'Next week thing', at('2026-10-31', '18:11')))
    const notes = notesFor(f, '2026-11-02')
    expect(notes.map((n) => [n.learnerId, n.text])).toEqual([['kid', 'Swimming on Saturday?']])
    f = apply(f, T.deleteRoundTableNote('kid', notes[0]!, at('2026-10-31', '18:12')))
    expect(notesFor(f, '2026-11-02')).toEqual([])
  })

  it('can be turned off or moved', () => {
    let f = apply(family(), T.saveRoundTableSettings('dad', { on: false, weekday: 4, at: '19:30' }, at('2026-10-28')))
    expect(phaseOf(f, '2026-10-29', '19:00')).toBe('off')
    f = apply(f, T.saveRoundTableSettings('dad', { on: true, weekday: 4, at: '19:30' }, at('2026-10-28', '13:00')))
    expect(phaseOf(f, '2026-10-29', '18:30')).toBe('raise')
    expect(phaseOf(f, '2026-10-30', '19:00')).toBe('raise')
    expect(phaseOf(f, '2026-10-30', '19:30')).toBe('later')
  })

  it('sums up last week in a line', () => {
    expect(reviewLine(facts.review.people[0]!)).toBe('Asked 5 times: 3 on track, 1 later, 1 skipped. 4 tasks ticked off.')
  })
})
