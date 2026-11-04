import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import { makeEvent } from '@/engine/make'
import * as A from '../actions'
import { tsOf } from '../dates'
import { applyFamilyEvent, projectFamily } from '../project'
import type { FamilyState } from '../types'
import * as T from './actions'
import { askAboutDraft, askBody, askError, assistantUrl, helpBody, isEventHelp, pendingProposals, proposalStatus, recentProposals } from './assistant'

const at = (d: string, t = '12:00') => tsOf(d, t)
const family = (): FamilyState =>
  projectFamily([
    ...A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, at('2026-10-26', '06:00')),
    ...A.saveMember('dad', { id: 'kid', name: 'Kid', role: 'child', colour: '#ffc857', active: true }, at('2026-10-26', '06:01')),
  ])
const apply = (f: FamilyState, evs: AppEvent[]) => evs.reduce(applyFamilyEvent, f)
const server = (body: Record<string, unknown>, ts: number): AppEvent => makeEvent('dad', body as never, ts)
const proposal = (id: string, ts: number, extra: Record<string, unknown> = {}) =>
  server({ type: 'proposal', proposalId: id, kind: 'event', summary: `Add 'Swim' for Kid (${id})`, forMembers: ['kid'], reason: 'free slot', ...extra }, ts)

describe('assistant suggestions', () => {
  it('lists pending ones newest first and ignores junk', () => {
    let f = family()
    f = apply(f, [proposal('p1', at('2026-10-26', '10:00')), proposal('p2', at('2026-10-26', '11:00')), server({ type: 'proposal', proposalId: 'bad' }, at('2026-10-26'))])
    expect(pendingProposals(f, at('2026-10-26', '12:00')).map((p) => p.proposalId)).toEqual(['p2', 'p1'])
  })

  it('records the first decision, then the server outcome', () => {
    let f = apply(family(), [proposal('p1', at('2026-10-26', '10:00'))])
    f = apply(f, T.decideProposal('kid', 'p1', true, at('2026-10-26', '10:05')))
    f = apply(f, T.decideProposal('dad', 'p1', false, at('2026-10-26', '10:06')))
    expect(f.travel.decisions.p1).toMatchObject({ decision: 'accept', by: 'kid' })
    expect(proposalStatus(f, 'p1', at('2026-10-26', '10:07'))).toBe('deciding')
    f = apply(f, [server({ type: 'proposal-done', proposalId: 'p1', outcome: 'accepted', by: 'kid', refs: ['c1'] }, at('2026-10-26', '10:08'))])
    expect(proposalStatus(f, 'p1', at('2026-10-26', '10:09'))).toBe('accepted')
    expect(pendingProposals(f, at('2026-10-26', '10:09'))).toHaveLength(0)
    expect(recentProposals(f, at('2026-10-26', '10:09')).map((p) => p.proposalId)).toEqual(['p1'])
  })

  it('expires untouched suggestions after a week', () => {
    const f = apply(family(), [proposal('p1', at('2026-10-20', '10:00'))])
    expect(proposalStatus(f, 'p1', at('2026-10-28'))).toBe('expired')
    expect(pendingProposals(f, at('2026-10-28'))).toHaveLength(0)
  })

  it('takes the assistant address from the server features, https only', () => {
    let f = apply(family(), [server({ type: 'server-features', alarms: true, trains: true, car: true, speakers: [], linked: [], version: '0.12.0', assistantUrl: 'https://hermes.example.ts.net:8443/' }, at('2026-10-26'))])
    expect(assistantUrl(f)).toBe('https://hermes.example.ts.net:8443')
    f = apply(f, [server({ type: 'server-features', alarms: true, trains: true, car: true, speakers: [], linked: [], version: '0.12.1', assistantUrl: 'http://evil.example' }, at('2026-10-26', '13:00'))])
    expect(assistantUrl(f)).toBeUndefined()
  })

  it('sends a short history and explains failures', () => {
    const turns = Array.from({ length: 10 }, (_, i) => ({ role: (i % 2 ? 'assistant' : 'user') as 'user' | 'assistant', text: `t${i}`, at: i }))
    const body = askBody('kid', 'Kid', '  yes please  ', [...turns, { role: 'assistant', text: 'oops', at: 99, error: true }])
    expect(body.message).toBe('yes please')
    expect(body.history).toHaveLength(6)
    expect(body.history.at(-1)?.text).toBe('t9')
    expect(askError('network')).toMatch(/Tailscale/)
    expect(askError(503)).toMatch(/busy/)
  })

  it('builds the event form request and checks the reply', () => {
    const d = { date: '2026-11-07', start: '12:30', end: '15:00', members: ['kid'], everyone: false, trip: { placeId: 'gran', mode: 'train' as const, via: [{ station: 'HHE', stationName: 'Haywards Heath', changeMin: 5 }] }, calId: 'c1' }
    expect(helpBody(d)).toMatchObject({ date: '2026-11-07', start: '12:30', end: '15:00', people: ['kid'], placeId: 'gran', mode: 'train', via: [{ station: 'HHE', changeMin: 5 }], calId: 'c1' })
    expect(helpBody({ ...d, end: '12:00', everyone: true }).end).toBeUndefined()
    expect(helpBody({ ...d, everyone: true }).people).toEqual([])
    expect(isEventHelp({ slots: [], clashes: [], travel: [], warnings: [] })).toBe(true)
    expect(isEventHelp({ error: 'x' })).toBe(false)
    expect(askAboutDraft('Lunch', d, ['Kid'], 'Gran')).toBe('I\'m adding "Lunch" for Kid on 2026-11-07 12:30-15:00 at Gran (going by train). Does that time work, and is there anything I should plan around?')
  })
})
