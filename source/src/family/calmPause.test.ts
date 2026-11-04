import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import { makeEvent } from '@/engine/make'
import * as A from './actions'
import { calmPauseOf, endCalmPause, helpOnIt, helpRequests, pauseCalm } from './calmPause'
import { tsOf } from './dates'
import { applyFamilyEvent, projectFamily } from './project'
import type { FamilyState } from './types'

const T = (time: string) => tsOf('2026-11-04', time)
const apply = (f: FamilyState, evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, f)
const base = () =>
  projectFamily([
    ...A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, T('08:00')),
    ...A.saveMember('kid', { id: 'kid', name: 'Kid', role: 'child', colour: '#ffc857', active: true }, T('08:00')),
  ])

describe('calm-pause fold and calmPauseOf', () => {
  it('is not paused until someone pauses, and the pause ends at `until`', () => {
    let f = base()
    expect(calmPauseOf(f, 'kid', T('16:00'))).toBeUndefined()
    f = apply(f, pauseCalm('kid', f, 'kid', T('23:59'), {}, T('16:00')))
    expect(calmPauseOf(f, 'kid', T('16:01'))).toMatchObject({ until: T('23:59'), askHelp: false })
    expect(calmPauseOf(f, 'kid', T('23:59'))).toBeUndefined()
    expect(calmPauseOf(f, 'dad', T('16:01'))).toBeUndefined()
  })

  it('latest per member wins, whatever order the events arrive in', () => {
    const first = makeEvent('kid', { type: 'calm-pause', memberId: 'kid', until: T('23:59'), askHelp: true }, T('16:00'))
    const second = makeEvent('kid', { type: 'calm-pause', memberId: 'kid', until: T('16:30') }, T('16:30'))
    const forward = projectFamily([first, second])
    const backward = projectFamily([second, first])
    expect(forward.calmPauses.kid?.id).toBe(second.id)
    expect(backward.calmPauses.kid?.id).toBe(second.id)
    expect(calmPauseOf(backward, 'kid', T('16:31'))).toBeUndefined()
  })

  it('asking for help shows to everyone else until a grown-up says "I\'m on it"', () => {
    let f = base()
    f = apply(f, pauseCalm('kid', f, 'kid', T('23:59'), {}, T('16:00')))
    expect(helpRequests(f, T('16:01'), 'dad')).toEqual([])
    f = apply(f, pauseCalm('kid', f, 'kid', T('17:00'), { askHelp: true }, T('16:02')))
    // Asking again never shortens the pause already on.
    expect(calmPauseOf(f, 'kid', T('16:03'))).toMatchObject({ until: T('23:59'), askHelp: true })
    expect(helpRequests(f, T('16:03'), 'dad').map((r) => r.memberId)).toEqual(['kid'])
    expect(helpRequests(f, T('16:03'), 'kid')).toEqual([])
    f = apply(f, helpOnIt('dad', f, 'kid', T('16:05')))
    expect(helpRequests(f, T('16:06'), 'dad')).toEqual([])
    expect(calmPauseOf(f, 'kid', T('16:06'))).toMatchObject({ askHelp: false, helper: 'dad', until: T('23:59') })
    // Nothing to say "on it" to any more.
    expect(helpOnIt('dad', f, 'kid', T('16:07'))).toEqual([])
  })

  it('a later pause keeps an open help request', () => {
    let f = base()
    f = apply(f, pauseCalm('kid', f, 'kid', T('23:59'), { askHelp: true }, T('16:00')))
    f = apply(f, pauseCalm('kid', f, 'kid', T('23:59'), {}, T('16:01')))
    expect(calmPauseOf(f, 'kid', T('16:02'))?.askHelp).toBe(true)
  })

  it('"Back to normal" ends the pause and the request, and writes nothing when there is no pause', () => {
    let f = base()
    expect(endCalmPause('kid', f, 'kid', T('16:00'))).toEqual([])
    f = apply(f, pauseCalm('kid', f, 'kid', T('23:59'), { askHelp: true }, T('16:00')))
    const evs = endCalmPause('kid', f, 'kid', T('16:10'))
    expect(evs).toHaveLength(1)
    f = apply(f, evs)
    expect(calmPauseOf(f, 'kid', T('16:10'))).toBeUndefined()
    expect(helpRequests(f, T('16:11'))).toEqual([])
    expect(f.calmPauses.kid).toMatchObject({ type: 'calm-pause', memberId: 'kid', until: T('16:10') })
  })
})
