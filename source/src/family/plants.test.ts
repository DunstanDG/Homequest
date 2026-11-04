import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import * as A from './actions'
import * as P from './planActions'
import * as PL from './plantActions'
import { tsOf } from './dates'
import { duePlants, lastWatered, plantStatus, plantsByNeed, wateredText } from './plants'
import { applyFamilyEvent, projectFamily } from './project'
import type { FamilyState } from './types'

const T = (date: string, time = '12:00') => tsOf(date, time)
const apply = (f: FamilyState, evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, f)
const base = () => projectFamily([...A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, T('2026-10-01'))])

function garden() {
  let f = base()
  const fern = PL.savePlant('dad', { name: 'Fern', emoji: '🌿', room: 'Bathroom' }, T('2026-10-01'), T('2026-10-04'))
  const cactus = PL.savePlant('dad', { name: 'Cactus' }, T('2026-10-01'), T('2026-09-20'))
  const basil = PL.savePlant('dad', { name: 'Basil' }, T('2026-10-01'))
  f = apply(f, [...fern.events, ...cactus.events, ...basil.events])
  return { f, fern: fern.plantId, cactus: cactus.plantId, basil: basil.plantId }
}

describe('plants', () => {
  it('knows when each was last watered and which are due (7 days, or never watered)', () => {
    const { f, fern, cactus, basil } = garden()
    const now = T('2026-10-05')
    expect(plantStatus(f, f.plants[fern]!, now)).toMatchObject({ due: false, daysSince: 1, dueOn: '2026-10-11' })
    expect(plantStatus(f, f.plants[cactus]!, now)).toMatchObject({ due: true, daysSince: 15 })
    expect(plantStatus(f, f.plants[basil]!, now).due).toBe(true)
    // Due first (most overdue first, never-watered counts as due today), then the rest.
    expect(plantsByNeed(f, now).map((s) => s.plant.name)).toEqual(['Cactus', 'Basil', 'Fern'])
    expect(wateredText(plantStatus(f, f.plants[fern]!, now))).toBe('Watered yesterday')
    expect(wateredText(plantStatus(f, f.plants[basil]!, now))).toBe('Not watered yet')
  })

  it('exactly a week since the last water is due', () => {
    const { f, fern } = garden()
    expect(plantStatus(f, f.plants[fern]!, T('2026-10-10')).due).toBe(false)
    expect(plantStatus(f, f.plants[fern]!, T('2026-10-11', '08:00')).due).toBe(true)
  })

  it('the water button records who and when, and undo takes it back', () => {
    let { f, cactus } = garden()
    const w = PL.waterPlants('dad', [cactus], T('2026-10-05', '09:00'))
    f = apply(f, w)
    expect(lastWatered(f, cactus)).toMatchObject({ by: 'dad', via: 'button', at: T('2026-10-05', '09:00') })
    expect(duePlants(f, T('2026-10-05', '10:00')).map((s) => s.plant.name)).toEqual(['Basil'])
    f = apply(f, A.undo('dad', w[0]!.id))
    expect(lastWatered(f, cactus)?.at).toBe(T('2026-09-20'))
  })

  it('a watering session takes the due plants when it starts, and finishing a step waters that plant', () => {
    let { f, cactus, basil, fern } = garden()
    const s = PL.newWateringSession('dad', {}, T('2026-10-05', '08:00'))
    f = apply(f, s.events)
    const r = f.routines[s.routineId]!
    const src = P.runSourceFor(f, r, '2026-10-05')
    expect(src.steps!.map((x) => x.plantId)).toEqual([cactus, basil])
    const run = P.startRun('dad', 'dad', src, T('2026-10-05', '09:00'))
    f = apply(f, run.events)
    const step = P.finishStep('dad', f, run.runId, `water-${cactus}`, 'done', T('2026-10-05', '09:01'))
    f = apply(f, step)
    expect(lastWatered(f, cactus)).toMatchObject({ via: 'session', at: T('2026-10-05', '09:01') })
    expect(duePlants(f, T('2026-10-05', '10:00')).map((x) => x.plant.plantId)).toEqual([basil])
    // Undoing the step undoes the watering.
    f = apply(f, P.undoEvents('dad', step))
    expect(lastWatered(f, cactus)?.via).toBe('button')
    expect(fern).toBeTruthy()
  })

  it('adds due plants to an existing session once, and a removed plant drops off the list', () => {
    let { f, cactus } = garden()
    const r0 = P.saveRoutine('dad', { routineId: 'rt1', title: 'Sunday jobs', steps: [{ id: 's1', title: 'Hoover', minutes: 10 }] }, T('2026-10-05'))
    f = apply(f, r0)
    const due = duePlants(f, T('2026-10-05')).map((s) => s.plant)
    f = apply(f, PL.addPlantsToRoutine('dad', f.routines.rt1!, due, T('2026-10-05', '12:01')))
    expect(f.routines.rt1!.steps.map((s) => s.title)).toEqual(['Hoover', 'Water Cactus', 'Water Basil'])
    expect(PL.addPlantsToRoutine('dad', f.routines.rt1!, due, T('2026-10-05', '12:02'))).toEqual([])
    f = apply(f, PL.deletePlant('dad', f.plants[cactus]!, T('2026-10-05', '12:03')))
    expect(plantsByNeed(f, T('2026-10-05')).map((s) => s.plant.name)).toEqual(['Basil', 'Fern'])
  })
})
