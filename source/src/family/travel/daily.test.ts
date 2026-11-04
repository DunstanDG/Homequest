import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import { makeEvent } from '@/engine/make'
import * as A from '../actions'
import { tsOf } from '../dates'
import { applyFamilyEvent, projectFamily } from '../project'
import type { FamilyState } from '../types'
import * as T from './actions'
import { buttonsFor, dailyPrefsOf, dayPlanOf, nowAndNext, openNudges, planRows, question, spareText } from './daily'
import type { NudgeEvent } from './types'

const D = '2026-11-03'
const at = (t = '12:00', d = D) => tsOf(d, t)
const family = (): FamilyState =>
  projectFamily([
    ...A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, at('06:00', '2026-10-26')),
    ...A.saveMember('dad', { id: 'kid', name: 'Kid', role: 'child', colour: '#ffc857', active: true }, at('06:01', '2026-10-26')),
  ])
const apply = (f: FamilyState, evs: AppEvent[]) => evs.reduce(applyFamilyEvent, f)
const server = (body: Record<string, unknown>, ts: number): AppEvent => makeEvent('dad', body as never, ts)
const nudge = (id: string, ts: number, extra: Record<string, unknown> = {}) =>
  server({ type: 'nudge', nudgeId: id, memberId: 'kid', date: D, kind: 'homework', title: 'Maths sheet', start: '16:15', end: '16:55', minutes: 40, ref: 't1', n: 1, ...extra }, ts)

const plan = server(
  {
    type: 'day-plan',
    memberId: 'kid',
    date: D,
    spareMin: 205,
    warnings: ['only 5 min between Chess and Swim', 42],
    blocks: [
      { start: '07:30', end: '08:00', kind: 'meal', title: 'Breakfast' },
      { start: '08:40', end: '15:05', kind: 'school', title: 'School' },
      { start: '15:10', end: '16:00', kind: 'club', title: 'Chess' },
      { start: '16:15', end: '16:55', kind: 'homework', title: 'Maths sheet', ref: 't1' },
      { start: '17:00', end: '17:40', kind: 'free', title: 'Free time' },
      { start: '17:45', end: '19:30', kind: 'free', title: 'Free time' },
      { start: '25:00', end: '26:00', kind: 'event', title: 'bad time' },
      { start: '18:00', end: '19:00', kind: 'party', title: 'bad kind' },
    ],
  },
  at('07:00'),
)

describe('the plan for today', () => {
  it('keeps the good blocks and drops junk', () => {
    const f = apply(family(), [plan])
    const p = dayPlanOf(f, 'kid', D)!
    expect(p.blocks.map((b) => b.title)).toEqual(['Breakfast', 'School', 'Chess', 'Maths sheet', 'Free time', 'Free time'])
    expect(p.warnings).toEqual(['only 5 min between Chess and Swim'])
    expect(planRows(p).map((b) => `${b.kind} ${b.start}`)).toEqual(['school 08:40', 'club 15:10', 'homework 16:15', 'free 17:45'])
  })

  it('says what is on now and what comes next', () => {
    const p = dayPlanOf(apply(family(), [plan]), 'kid', D)!
    const r = nowAndNext(planRows(p), at('15:30'))
    expect(r.now?.title).toBe('Chess')
    expect(r.next.map((b) => b.start)).toEqual(['16:15', '17:45'])
    expect(r.past).toBe(1)
    expect(spareText(205)).toBe('3h 25m spare')
    expect(spareText(40)).toBe('40 min spare')
    expect(spareText(-5)).toBe('No spare time today')
  })

  it('an older plan never replaces a newer one', () => {
    const older = server({ ...(plan as unknown as Record<string, unknown>), blocks: [] }, at('06:00'))
    const f = apply(family(), [plan, older])
    expect(dayPlanOf(f, 'kid', D)!.blocks.length).toBe(6)
  })
})

describe('"on track?" questions', () => {
  it('shows unanswered ones, the newest re-ask only, and not stale ones', () => {
    let f = apply(family(), [nudge('ng1', at('16:15'))])
    expect(openNudges(f, 'kid', D, at('16:20')).map((n) => n.nudgeId)).toEqual(['ng1'])
    expect(openNudges(f, 'kid', D, at('18:00'))).toHaveLength(0)
    f = apply(f, T.replyNudge('kid', 'ng1', 'later', 15, at('16:21')))
    expect(openNudges(f, 'kid', D, at('16:22'))).toHaveLength(0)
    f = apply(f, [nudge('ng1-2', at('16:36'), { n: 2 })])
    expect(openNudges(f, 'kid', D, at('16:37')).map((n) => n.nudgeId)).toEqual(['ng1-2'])
    f = apply(f, T.replyNudge('kid', 'ng1-2', 'ok', undefined, at('16:38')))
    expect(openNudges(f, 'kid', D, at('16:39'))).toHaveLength(0)
    expect(f.travel.nudgeReplies['ng1']).toMatchObject({ answer: 'later', minutes: 15 })
  })

  it('ignores malformed questions and answers', () => {
    const f = apply(family(), [
      server({ type: 'nudge', nudgeId: 'x', memberId: 'kid', date: D, kind: 'hack', title: 'a', start: '10:00' }, at()),
      server({ type: 'nudge', nudgeId: 'y', memberId: 'kid', date: D, kind: 'task', title: '', start: '10:00' }, at()),
      server({ type: 'nudge-reply', nudgeId: 'z', answer: 'rm -rf' }, at()),
    ])
    expect(Object.keys(f.travel.nudges)).toEqual([])
    expect(Object.keys(f.travel.nudgeReplies)).toEqual([])
  })

  it('offers the right answers for each kind', () => {
    const f = apply(family(), [nudge('ng1', at('16:15')), nudge('ng2', at('16:15'), { kind: 'travel', title: 'Train to Lewes', start: '16:35' }), nudge('ng3', at('16:15'), { kind: 'cook', title: 'Cook dinner', memberId: 'dad' })])
    const n = (id: string) => f.travel.nudges[id] as NudgeEvent
    expect(buttonsFor(n('ng1'), false, true).map((b) => b.label)).toEqual(['Start now', 'Already done', 'In 15 min', 'Not today'])
    expect(buttonsFor(n('ng1'), false, false).map((b) => b.label)).toEqual(['On it', 'In 15 min', 'Not today'])
    expect(buttonsFor(n('ng2'), false, false).map((b) => b.answer)).toEqual(['ok', 'late', 'skip'])
    expect(buttonsFor(n('ng3'), true, false).map((b) => b.answer)).toContain('swap')
    expect(buttonsFor(n('ng3'), false, false).map((b) => b.answer)).not.toContain('swap')
    expect(question(n('ng2'))).toBe('Train to Lewes: leave at 16:35. On track?')
    expect(question(n('ng1'))).toContain('about 40 min')
  })
})

describe('morning and question settings', () => {
  it('defaults to on at 07:00, and each person can change their own', () => {
    let f = family()
    expect(dailyPrefsOf(f, 'kid')).toEqual({ morning: true, morningAt: '07:00', nudges: true })
    f = apply(f, T.saveDailyPrefs('kid', { memberId: 'kid', morning: true, morningAt: '07:45', nudges: false }, at('08:00')))
    f = apply(f, T.saveDailyPrefs('kid', { memberId: 'kid', morning: false, morningAt: '99:99' }, at('07:00')))
    expect(dailyPrefsOf(f, 'kid')).toEqual({ morning: true, morningAt: '07:45', nudges: false })
  })
})
