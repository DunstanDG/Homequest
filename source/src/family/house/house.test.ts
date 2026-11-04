import { describe, expect, it } from 'vitest'
import type { AppEvent } from '@/engine/types'
import * as A from '../actions'
import { houseItemsOn } from './agenda'
import { tsOf } from '../dates'
import * as P from '../planActions'
import { savePlant } from '../plantActions'
import { runOf } from '../routines'
import { lastWatered } from '../plants'
import { applyFamilyEvent, projectFamily } from '../project'
import type { FamilyState } from '../types'
import { autoAssign, ageOf } from './assign'
import * as H from './actions'
import { hasNeed, houseCoins, inSeason, monthsLabel, orderJobs, planSetup, setupMinutes, type SetupRoom } from './house'
import { STARTER_ROOMS } from './starter'
import { activeHouseRun, foldHouseRun, houseDoneOn, houseJobLastDone, houseProgress, houseRunOf } from './run'

const T = (date: string, time = '12:00') => tsOf(date, time)
const DAY = 86_400_000
const NOW = T('2026-10-10', '10:00')
const TODAY = '2026-10-10'

const apply = (f: FamilyState, evs: AppEvent[]): FamilyState => evs.reduce(applyFamilyEvent, f)

function family(extra: AppEvent[] = []): FamilyState {
  return projectFamily([
    ...A.saveMember('mum', { id: 'mum', name: 'Mum', role: 'parent', colour: '#4cc9f0', active: true, birthday: '1985-03-02' }, NOW - 5000),
    ...A.saveMember('mum', { id: 'dad', name: 'Dad', role: 'parent', colour: '#f72585', active: true, birthday: '1984-06-01' }, NOW - 4999),
    ...A.saveMember('mum', { id: 'kid', name: 'Kid', role: 'child', colour: '#ffd166', active: true, birthday: '2016-05-01' }, NOW - 4998),
    ...A.saveMember('mum', { id: 'tot', name: 'Tot', role: 'child', colour: '#06d6a0', active: true, birthday: '2021-08-01' }, NOW - 4997),
    ...extra,
  ])
}

const seeded = (extra: AppEvent[] = []): FamilyState => {
  const f = family(extra)
  return apply(f, H.seedHouse('mum', f))
}

const roomByStarter = (f: FamilyState, key: string, child?: string) => f.houseRooms[H.starterRoomId(key, child)]!
const jobNamed = (f: FamilyState, roomId: string, title: string) => Object.values(f.houseJobs).find((j) => j.roomId === roomId && j.title === title)!

/** A run of the standard house clean for the whole family, started now. */
function startClean(f: FamilyState, now = NOW, spec: Partial<Parameters<typeof planSetup>[1]> = {}) {
  const rooms = planSetup(f, { depth: 'standard', rooms: 'indoor', ...spec }, TODAY)
  const picked = rooms.filter((r) => r.included).flatMap((r) => r.jobs.filter((j) => j.on).map((j) => ({ room: r.room, job: j.job, plantIds: j.plantIds })))
  const people = ['mum', 'dad', 'kid', 'tot']
  const who = autoAssign(
    f,
    people,
    rooms
      .filter((r) => r.included)
      .map((r) => ({ roomId: r.room.roomId, ownerId: r.room.ownerId, jobs: r.jobs.filter((j) => j.on).map((j) => ({ jobId: j.job.jobId, minutes: j.job.minutes, minAge: j.job.minAge })) })),
    TODAY,
  )
  const { runId, events } = H.startHouseRun('mum', f, { typeId: 'hs-type-clean', title: 'House clean', people, picked, assignments: who, date: TODAY }, now)
  return { runId, f: apply(f, events), picked, who }
}

describe('the starter catalogue', () => {
  it('seeds every starter room, one per child for the child room, with the four saved sessions', () => {
    const f = seeded()
    const names = Object.values(f.houseRooms).map((r) => r.name)
    expect(names).toContain('Kitchen')
    expect(names).toContain("Kid's room")
    expect(names).toContain("Tot's room")
    expect(Object.keys(f.houseTypes)).toHaveLength(4)
    expect(Object.values(f.houseJobs).length).toBeGreaterThan(120)
  })

  it('seeding again, or from two phones, makes no copies and keeps edits', () => {
    const base = A.saveMember('mum', { id: 'mum', name: 'Mum', role: 'parent', colour: '#4cc9f0', active: true }, NOW - 5000)
    const f = projectFamily(base)
    const fromMum = H.seedHouse('mum', f)
    const fromDad = H.seedHouse('dad', f)
    // Same ids and times, so the log keeps one copy of each.
    expect(fromMum.map((e) => e.id)).toEqual(fromDad.map((e) => e.id))
    expect(new Set(fromMum.map((e) => e.ts))).toEqual(new Set([Date.UTC(2025, 0, 1)]))
    const seededF = projectFamily([...base, ...fromMum])
    expect(H.seedHouse('mum', seededF)).toHaveLength(0)
    const kitchen = seededF.houseRooms[H.starterRoomId('kitchen')]!
    const rename = H.saveRoom('mum', seededF, { ...kitchen, name: 'Big kitchen' }, NOW + 1000)
    const twice = projectFamily([...base, ...fromMum, ...rename, ...fromDad])
    expect(Object.keys(twice.houseRooms).length).toBe(Object.keys(seededF.houseRooms).length)
    expect(twice.houseRooms[kitchen.roomId]!.name).toBe('Big kitchen')
  })

  it('a child added later gets their room when seeding is run again', () => {
    const f = seeded()
    const more = apply(f, A.saveMember('mum', { id: 'new', name: 'New', role: 'child', colour: '#fff', active: true }, NOW + 5))
    const missing = H.missingStarterRooms(more)
    expect(missing).toEqual([{ key: 'child', name: "New's room", childId: 'new' }])
    expect(Object.keys(apply(more, H.seedHouse('mum', more)).houseRooms)).toContain(H.starterRoomId('child', 'new'))
  })

  it('the starter data holds no real names', () => {
    const text = JSON.stringify(STARTER_ROOMS)
    expect(text).not.toMatch(/willow|oathall/i)
  })
})

describe('needs, seasons and ordering', () => {
  it('jobs needing a dog, baby or plants appear only when the family has one', () => {
    const f = seeded()
    expect(hasNeed(f, 'dog')).toBe(false)
    expect(hasNeed(f, 'baby')).toBe(false)
    const all = planSetup(f, { depth: 'deep', rooms: 'indoor' }, TODAY)
    expect(all.some((r) => r.room.starterKey === 'nursery')).toBe(false)
    expect(all.flatMap((r) => r.jobs).some((j) => j.job.title === 'Change dog water')).toBe(false)
    const withDog = apply(f, A.saveMember('mum', { id: 'bis', name: 'Biscuit', role: 'pet', petKind: 'Dog', colour: '#999', active: true }, NOW + 1))
    expect(
      planSetup(withDog, { depth: 'deep', rooms: 'indoor' }, TODAY)
        .flatMap((r) => r.jobs)
        .some((j) => j.job.title === 'Change dog water'),
    ).toBe(true)
  })

  it('months work, including a season that runs over the new year', () => {
    expect(inSeason(undefined, TODAY)).toBe(true)
    expect(inSeason([10, 11], TODAY)).toBe(true)
    expect(inSeason([3, 4], TODAY)).toBe(false)
    expect(monthsLabel([3, 4, 5, 6, 7, 8, 9])).toBe('Mar to Sep')
    expect(monthsLabel([11, 12, 1])).toBe('Nov to Jan')
    expect(monthsLabel(undefined)).toBe('all year')
  })

  it('a job comes after the one it names', () => {
    const f = seeded()
    const r = roomByStarter(f, 'kitchen')
    const jobs = Object.values(f.houseJobs).filter((j) => j.roomId === r.roomId)
    const ordered = orderJobs(jobs).map((j) => j.title)
    expect(ordered.indexOf('Empty dishwasher')).toBeLessThan(ordered.indexOf('Fill dishwasher'))
    expect(ordered.indexOf('Clear draining board')).toBeLessThan(ordered.indexOf('Wipe sides'))
  })
})

describe('what a session includes', () => {
  it('a house clean takes the indoor rooms and leaves the garden folded away; the garden day takes the garden', () => {
    const f = seeded()
    const clean = planSetup(f, { depth: 'standard', rooms: 'indoor' }, TODAY)
    expect(clean.find((r) => r.room.starterKey === 'garden')!.included).toBe(false)
    expect(clean.find((r) => r.room.starterKey === 'kitchen')!.included).toBe(true)
    const garden = planSetup(f, { depth: 'standard', rooms: 'outdoor' }, TODAY)
    expect(garden.filter((r) => r.included).map((r) => r.room.starterKey)).toEqual(['garden'])
  })

  it('a quick tidy takes only quick jobs in the quick-tidy rooms', () => {
    const f = seeded()
    const quick = planSetup(f, { depth: 'quick', rooms: 'quick' }, TODAY)
    const inc = quick.filter((r) => r.included)
    expect(inc.length).toBeGreaterThan(2)
    for (const r of inc) for (const j of r.jobs.filter((x) => x.on)) expect(j.job.depth).toBe('quick')
    expect(quick.flatMap((r) => r.jobs).some((j) => j.standing === 'deeper')).toBe(true)
  })

  it('rooms and jobs can be left out and the choice is saved for next time', () => {
    const f = seeded()
    const office = roomByStarter(f, 'office')
    const sides = jobNamed(f, roomByStarter(f, 'kitchen').roomId, 'Wipe sides')
    const rooms = planSetup(f, { depth: 'standard', rooms: 'indoor', skipRoomIds: [office.roomId], skipJobIds: [sides.jobId] }, TODAY)
    expect(rooms.find((r) => r.room.roomId === office.roomId)!.included).toBe(false)
    expect(rooms.flatMap((r) => r.jobs).find((j) => j.job.jobId === sides.jobId)!.on).toBe(false)
  })

  it('a room added later joins an "all indoor rooms" session', () => {
    const f = seeded()
    const more = apply(f, H.saveRoom('mum', f, { name: 'Utility', emoji: '🧺' }, NOW + 10))
    expect(planSetup(more, { depth: 'standard', rooms: 'indoor' }, TODAY).find((r) => r.room.name === 'Utility')!.included).toBe(true)
  })

  it('a job done recently stays folded away until its reset time passes, and an every-session job never does', () => {
    const f = seeded()
    const kitchen = roomByStarter(f, 'kitchen')
    const fridge = jobNamed(f, kitchen.roomId, 'Discard old food in fridge')
    const floor = jobNamed(f, kitchen.roomId, 'Pick up anything on floor')
    expect(fridge.resetDays).toBe(7)
    expect(floor.resetDays).toBe(0)
    const { runId, f: g } = startClean(f)
    let h = apply(g, H.tickHouseJob('mum', g, runId, fridge.jobId, 'done', undefined, NOW + 1000))
    h = apply(h, H.tickHouseJob('mum', h, runId, floor.jobId, 'done', undefined, NOW + 2000))
    const later = (days: number) =>
      planSetup(h, { depth: 'standard', rooms: 'indoor' }, new Date(Date.parse(`${TODAY}T12:00:00Z`) + days * DAY).toISOString().slice(0, 10)).find((r) => r.room.roomId === kitchen.roomId)!.jobs
    const in3 = later(3)
    expect(in3.find((j) => j.job.jobId === fridge.jobId)).toMatchObject({ standing: 'recent', on: false, dueInDays: 4 })
    expect(in3.find((j) => j.job.jobId === floor.jobId)).toMatchObject({ standing: 'due', on: true })
    expect(later(7).find((j) => j.job.jobId === fridge.jobId)).toMatchObject({ standing: 'due', on: true })
    expect(houseJobLastDone(h, fridge.jobId)).toBe(NOW + 1000)
  })

  it('a job out of season is folded away, and a deep job is not in a standard session', () => {
    const f = seeded()
    const garden = planSetup(f, { depth: 'deep', rooms: 'outdoor' }, TODAY).find((r) => r.room.starterKey === 'garden')!
    const bbq = garden.jobs.find((j) => /bbq/i.test(j.job.title))
    expect(bbq).toBeTruthy()
    const winter = planSetup(f, { depth: 'deep', rooms: 'outdoor' }, '2027-01-15').find((r) => r.room.starterKey === 'garden')!
    expect(winter.jobs.some((j) => j.standing === 'offSeason')).toBe(true)
    const fridge = planSetup(f, { depth: 'standard', rooms: 'indoor' }, TODAY)
      .flatMap((r) => r.jobs)
      .find((j) => j.job.title === 'Clean fridge')!
    expect(fridge).toMatchObject({ standing: 'deeper', on: false })
  })

  it('with a cleaner, the jobs a cleaner does are folded away; turning it off brings them back', () => {
    const f = seeded()
    const base = planSetup(f, { depth: 'standard', rooms: 'indoor' }, TODAY)
    const cleanerJobs = base.flatMap((r) => r.jobs).filter((j) => j.job.cleaner && j.standing === 'due')
    expect(cleanerJobs.length).toBeGreaterThan(3)
    const g = apply(f, H.setHouseCleaner('mum', true, NOW + 1))
    const withCleaner = planSetup(g, { depth: 'standard', rooms: 'indoor' }, TODAY).flatMap((r) => r.jobs)
    for (const j of withCleaner.filter((x) => x.job.cleaner && x.standing !== 'deeper' && x.standing !== 'offSeason')) expect(j).toMatchObject({ standing: 'cleaner', on: false })
    expect(setupMinutes(planSetup(g, { depth: 'standard', rooms: 'indoor' }, TODAY))).toBeLessThan(setupMinutes(base))
    const off = apply(g, H.setHouseCleaner('mum', false, NOW + 2))
    expect(setupMinutes(planSetup(off, { depth: 'standard', rooms: 'indoor' }, TODAY))).toBe(setupMinutes(base))
  })

  it('"Water plants" only comes in a room that has plants due, and lists them', () => {
    const f0 = seeded()
    const none = planSetup(f0, { depth: 'standard', rooms: 'indoor' }, TODAY)
      .flatMap((r) => r.jobs)
      .filter((j) => j.job.link === 'plants')
    // No plants in the house: the watering jobs are not offered at all.
    expect(none).toHaveLength(0)
    const p = savePlant('mum', { name: 'Fern', room: 'Bathroom window' }, NOW - 20 * DAY, NOW - 20 * DAY)
    const f = apply(f0, p.events)
    const rooms = planSetup(f, { depth: 'standard', rooms: 'indoor' }, TODAY)
    const bath = rooms.find((r) => r.room.starterKey === 'bathroom')!.jobs.find((j) => j.job.link === 'plants')!
    expect(bath).toMatchObject({ standing: 'due', on: true, plantIds: [p.plantId] })
    const kitchenPlants = rooms.find((r) => r.room.starterKey === 'dining')!.jobs.find((j) => j.job.link === 'plants')!
    expect(kitchenPlants.standing).toBe('noPlants')
  })
})

describe('suggesting who does what', () => {
  it('works out age from the birthday, with sensible guesses without one', () => {
    expect(ageOf({ role: 'child', birthday: '2016-05-01' }, TODAY)).toBe(10)
    expect(ageOf({ role: 'child', birthday: '2016-12-01' }, TODAY)).toBe(9)
    expect(ageOf({ role: 'parent' }, TODAY)).toBe(40)
  })

  it('gives each room to one person, a child their own room, and no job to someone too young for it', () => {
    const f = seeded()
    const { who, picked } = startClean(f)
    const byRoom = new Map<string, Set<string>>()
    for (const p of picked) {
      const set = byRoom.get(p.room.roomId) ?? new Set()
      if (p.job.minAge <= 5) set.add(who[p.job.jobId]!)
      byRoom.set(p.room.roomId, set)
    }
    for (const p of picked) expect(who[p.job.jobId]).toBeTruthy()
    // The older child has their own room.
    const kidRoom = roomByStarter(f, 'child', 'kid')
    const mine = picked.filter((p) => p.room.roomId === kidRoom.roomId && p.job.minAge <= 10)
    expect(mine.every((p) => who[p.job.jobId] === 'kid')).toBe(true)
    // Nobody is handed a job under their age.
    const ageOfId = (id: string) => ageOf(f.members[id]!, TODAY)
    for (const p of picked) expect(ageOfId(who[p.job.jobId]!)).toBeGreaterThanOrEqual(Math.min(p.job.minAge, 40))
  })

  it('spreads the minutes so nobody is left with everything', () => {
    const f = seeded()
    const { who, picked } = startClean(f)
    const load: Record<string, number> = {}
    for (const p of picked) load[who[p.job.jobId]!] = (load[who[p.job.jobId]!] ?? 0) + p.job.minutes
    expect(Object.keys(load).length).toBe(4)
    const total = Object.values(load).reduce((a, b) => a + b, 0)
    expect(Math.max(...Object.values(load))).toBeLessThan(total * 0.6)
  })

  it('keeps jobs already handed out by hand', () => {
    const f = seeded()
    const rooms = planSetup(f, { depth: 'standard', rooms: 'indoor' }, TODAY).filter((r) => r.included)
    const input = rooms.map((r) => ({
      roomId: r.room.roomId,
      ownerId: r.room.ownerId,
      jobs: r.jobs.filter((j) => j.on).map((j) => ({ jobId: j.job.jobId, minutes: j.job.minutes, minAge: j.job.minAge })),
    }))
    const one = input[0]!.jobs[0]!.jobId
    expect(autoAssign(f, ['mum', 'dad', 'kid'], input, TODAY, { [one]: 'dad' })[one]).toBe('dad')
  })
})

describe('running a session', () => {
  it("starts with every job copied in, and shows as the family's active session", () => {
    const f = seeded()
    const { runId, f: g, picked } = startClean(f)
    const run = houseRunOf(g, runId)!
    expect(run.jobs).toHaveLength(picked.length)
    expect(run.people).toEqual(['mum', 'dad', 'kid', 'tot'])
    expect(activeHouseRun(g, NOW + 1000)?.id).toBe(runId)
    expect(activeHouseRun(g, NOW + 13 * 3_600_000)).toBeUndefined()
  })

  it('editing the catalogue afterwards does not rewrite a session already started', () => {
    const f = seeded()
    const { runId, f: g } = startClean(f)
    const sides = jobNamed(g, roomByStarter(g, 'kitchen').roomId, 'Wipe sides')
    const h = apply(g, H.saveJob('mum', g, { ...sides, title: 'Wipe everything' }, NOW + 5000))
    expect(houseRunOf(h, runId)!.jobs.some((j) => j.job.title === 'Wipe sides')).toBe(true)
  })

  it('ticking a job, a second phone ticking it too, and undoing it', () => {
    const f = seeded()
    const { runId, f: g } = startClean(f)
    const sides = jobNamed(g, roomByStarter(g, 'kitchen').roomId, 'Wipe sides').jobId
    const first = H.tickHouseJob('mum', g, runId, sides, 'done', undefined, NOW + 1000)
    const second = H.tickHouseJob('dad', g, runId, sides, 'done', undefined, NOW + 1001)
    const h = apply(apply(g, first), second)
    expect(houseRunOf(h, runId)!.jobs.find((j) => j.job.jobId === sides)).toMatchObject({ status: 'done', doneBy: 'mum' })
    expect(H.tickHouseJob('dad', h, runId, sides, 'done', undefined, NOW + 2000)).toEqual([])
    const back = apply(h, H.untickHouseJob('mum', h, runId, sides, NOW + 3000))
    expect(houseRunOf(back, runId)!.jobs.find((j) => j.job.jobId === sides)!.status).toBe('todo')
  })

  it('the session finishes when the last job is done, and picks up again if that tick is undone', () => {
    const f = seeded()
    const rooms = planSetup(f, { depth: 'quick', rooms: 'quick' }, TODAY)
    const picked = rooms
      .filter((r) => r.included)
      .flatMap((r) =>
        r.jobs
          .filter((j) => j.on)
          .slice(0, 2)
          .map((j) => ({ room: r.room, job: j.job })),
      )
    const { runId, events } = H.startHouseRun('mum', f, { typeId: 'hs-type-quick', title: 'Quick tidy', people: ['mum'], picked, date: TODAY }, NOW)
    let g = apply(f, events)
    picked.forEach((p, i) => (g = apply(g, H.tickHouseJob('mum', g, runId, p.job.jobId, i % 2 ? 'skipped' : 'done', undefined, NOW + 1000 * (i + 1)))))
    const run = houseRunOf(g, runId)!
    expect(run.status).toBe('done')
    expect(houseDoneOn(g, 'hs-type-quick', TODAY)).toBe(true)
    expect(activeHouseRun(g, NOW + 999_999)).toBeUndefined()
    const lastTick = run.jobs[run.jobs.length - 1]!
    const undone = apply(g, H.untickHouseJob('mum', g, runId, lastTick.job.jobId, NOW + 99_000))
    expect(houseRunOf(undone, runId)!.status).toBe('running')
  })

  it('skipped jobs do not count as done for "last done"', () => {
    const f = seeded()
    const { runId, f: g } = startClean(f)
    const sides = jobNamed(g, roomByStarter(g, 'kitchen').roomId, 'Wipe sides').jobId
    const h = apply(g, H.tickHouseJob('mum', g, runId, sides, 'skipped', undefined, NOW + 1000))
    expect(houseJobLastDone(h, sides)).toBeUndefined()
  })

  it('pausing stops the clock; someone leaving frees their jobs; joining and sharing out hands them on', () => {
    const f = seeded()
    const { runId, f: g } = startClean(f)
    let h = apply(g, H.pauseHouseRun('mum', runId, NOW + 10 * 60_000))
    h = apply(h, H.resumeHouseRun('mum', runId, NOW + 30 * 60_000))
    expect(houseProgress(houseRunOf(h, runId)!, NOW + 40 * 60_000).elapsedSec).toBe(20 * 60)
    const kidsJobs = houseRunOf(h, runId)!.jobs.filter((j) => j.assignee === 'kid').length
    expect(kidsJobs).toBeGreaterThan(0)
    h = apply(h, H.leaveHouseRun('kid', h, runId, 'kid', NOW + 41 * 60_000))
    const run = houseRunOf(h, runId)!
    expect(run.people).not.toContain('kid')
    expect(houseProgress(run, NOW + 42 * 60_000).unassigned).toBe(kidsJobs)
    h = apply(h, H.shareOutRest('mum', h, runId, NOW + 43 * 60_000))
    const after = houseRunOf(h, runId)!
    expect(houseProgress(after, NOW + 44 * 60_000).unassigned).toBe(0)
    expect(after.jobs.some((j) => j.assignee === 'kid')).toBe(false)
  })

  it('a personal session is paused when a family session starts and resumed when it ends', () => {
    const f = seeded()
    const mine = P.startRun('kid', 'kid', { title: 'Homework', steps: [{ id: 's1', title: 'Read', minutes: 10 }] }, NOW - 5 * 60_000)
    const g0 = apply(f, mine.events)
    const rooms = planSetup(g0, { depth: 'quick', rooms: 'quick' }, TODAY)
    const picked = rooms
      .filter((r) => r.included)
      .flatMap((r) =>
        r.jobs
          .filter((j) => j.on)
          .slice(0, 1)
          .map((j) => ({ room: r.room, job: j.job })),
      )
    const { runId, events } = H.startHouseRun('mum', g0, { title: 'Quick tidy', people: ['mum', 'kid'], picked, date: TODAY }, NOW)
    const g = apply(g0, events)
    expect(runOf(g, mine.runId)!.status).toBe('paused')
    const h = apply(g, H.endHouseRun('mum', g, runId, undefined, NOW + 60_000))
    expect(houseRunOf(h, runId)!.status).toBe('done')
    expect(runOf(h, mine.runId)!.status).toBe('running')
  })

  it("a dog water job logs the dog's water and undoing the tick takes it back", () => {
    const f = seeded(A.saveMember('mum', { id: 'bis', name: 'Biscuit', role: 'pet', petKind: 'Dog', colour: '#999', active: true }, NOW - 100))
    const { runId, f: g } = startClean(f)
    const water = jobNamed(g, roomByStarter(g, 'kitchen').roomId, 'Change dog water').jobId
    const ticked = H.tickHouseJob('mum', g, runId, water, 'done', undefined, NOW + 1000)
    expect(ticked.some((e) => e.type === 'pet' && e.petId === 'bis' && e.kind === 'water')).toBe(true)
    const h = apply(g, ticked)
    expect(h.pets.some((e) => e.kind === 'water' && !h.voided[e.id])).toBe(true)
    const back = apply(h, H.untickHouseJob('mum', h, runId, water, NOW + 2000))
    expect(back.pets.filter((e) => e.kind === 'water' && !back.voided[e.id])).toHaveLength(0)
  })

  it('a water-plants job waters the plants that were due, and undoing it puts them back', () => {
    const f0 = seeded()
    const p = savePlant('mum', { name: 'Fern', room: 'Bathroom' }, NOW - 20 * DAY, NOW - 20 * DAY)
    const f = apply(f0, p.events)
    const { runId, f: g } = startClean(f)
    const job = Object.values(g.houseJobs).find((j) => j.roomId === roomByStarter(g, 'bathroom').roomId && j.link === 'plants')!
    const h = apply(g, H.tickHouseJob('mum', g, runId, job.jobId, 'done', undefined, NOW + 1000))
    expect(lastWatered(h, p.plantId)?.at).toBe(NOW + 1000)
    const back = apply(h, H.untickHouseJob('mum', h, runId, job.jobId, NOW + 2000))
    expect(lastWatered(back, p.plantId)?.at).toBe(NOW - 20 * DAY)
  })
})

describe('coins', () => {
  it("a child earns the job's coins once, waiting for a parent to check; a parent ticking for them approves it", () => {
    const f = seeded()
    const { runId, f: g } = startClean(f)
    const sides = jobNamed(g, roomByStarter(g, 'kitchen').roomId, 'Wipe sides')
    expect(houseCoins(sides)).toBeGreaterThan(0)
    const byKid = apply(g, H.tickHouseJob('kid', g, runId, sides.jobId, 'done', undefined, NOW + 1000))
    const done = Object.values(byKid.done).filter((d) => d.taskId.startsWith('house-'))
    expect(done).toHaveLength(1)
    expect(done[0]).toMatchObject({ by: 'kid', status: 'pending', coins: houseCoins(sides) })
    // A tap on a job already done adds nothing.
    expect(H.tickHouseJob('kid', byKid, runId, sides.jobId, 'done', undefined, NOW + 1500)).toEqual([])
    // Undo takes the coins back.
    const back = apply(byKid, H.untickHouseJob('kid', byKid, runId, sides.jobId, NOW + 2000))
    expect(Object.values(back.done).filter((d) => d.taskId.startsWith('house-'))).toHaveLength(0)

    const floor = jobNamed(g, roomByStarter(g, 'kitchen').roomId, 'Clear draining board')
    const forKid = apply(g, H.tickHouseJob('mum', g, runId, floor.jobId, 'done', 'kid', NOW + 3000))
    const d = Object.values(forKid.done).find((x) => x.taskId.includes(floor.jobId))!
    expect(d).toMatchObject({ by: 'mum', status: 'approved' })
    expect(forKid.tasks[d.taskId]).toMatchObject({ assignee: 'kid' })
  })

  it('a parent earns nothing, and a skipped job earns nothing', () => {
    const f = seeded()
    const { runId, f: g } = startClean(f)
    const sides = jobNamed(g, roomByStarter(g, 'kitchen').roomId, 'Wipe sides').jobId
    const floor = jobNamed(g, roomByStarter(g, 'kitchen').roomId, 'Clear draining board').jobId
    let h = apply(g, H.tickHouseJob('dad', g, runId, sides, 'done', undefined, NOW + 1000))
    h = apply(h, H.tickHouseJob('kid', h, runId, floor, 'skipped', undefined, NOW + 2000))
    expect(Object.values(h.done).filter((d) => d.taskId.startsWith('house-'))).toHaveLength(0)
  })

  it('coins by length are small and the job can set its own', () => {
    expect(houseCoins({ minutes: 2 })).toBe(1)
    expect(houseCoins({ minutes: 8 })).toBe(2)
    expect(houseCoins({ minutes: 15 })).toBe(3)
    expect(houseCoins({ minutes: 30 })).toBe(5)
    expect(houseCoins({ minutes: 30, coins: 0 })).toBe(0)
  })
})

describe('on the calendar and Today', () => {
  it('a planned session shows on its day only, with the list of who usually takes part', () => {
    const f = seeded()
    const type = f.houseTypes['hs-type-clean']!
    const planned = apply(f, H.saveType('mum', { ...type, date: '2026-10-10', startAt: '10:00', memberIds: ['mum', 'dad'] }, NOW + 5))
    const items = houseItemsOn(planned, '2026-10-10')
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ source: 'house', start: '10:00', everyone: false, members: ['mum', 'dad'], taskDone: false })
    expect(houseItemsOn(planned, '2026-10-11')).toHaveLength(0)
  })

  it("a repeating session shows each time, and shows as done once that day's session is finished", () => {
    const f = seeded()
    const type = f.houseTypes['hs-type-quick']!
    const planned = apply(f, H.saveType('mum', { ...type, date: '2026-10-03', recur: { freq: 'weekly', interval: 1 } as never }, NOW + 5))
    expect(houseItemsOn(planned, '2026-10-10')).toHaveLength(1)
    expect(houseItemsOn(planned, '2026-10-17')).toHaveLength(1)
    expect(houseItemsOn(planned, '2026-10-11')).toHaveLength(0)
  })
})

describe('the fold', () => {
  it('is empty without a start, and ignores voided events', () => {
    expect(foldHouseRun([])).toBeUndefined()
  })
})

describe('no setup', () => {
  it('an empty family has no rooms to plan', () => {
    const f = family()
    const rooms: SetupRoom[] = planSetup(f, { depth: 'standard', rooms: 'indoor' }, TODAY)
    expect(rooms).toEqual([])
  })
})
