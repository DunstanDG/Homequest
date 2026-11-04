import { describe, expect, it } from 'vitest'
import { Session } from '@/engine/session'
import { solutionFor } from '@/engine/judge'
import { fixtureRegistry } from '@/engine/testing/fixture'
import * as A from '@/family/actions'
import { balanceFor } from '@/family/economy'
import { tsOf } from '@/family/dates'
import { Repo } from './repo'
import { createMemoryStorage } from './local'
import { createFakeRemote } from './sync'
import { makeEvent } from '@/engine/make'

const reg = fixtureRegistry()
const day = '2026-09-21'
let clock = tsOf(day, '08:00')

function play(repo: Repo, questions = 6) {
  const s = new Session({ registry: reg, store: repo, learnerId: repo.learnerId, subject: 'test', gameId: 'g', mode: 'practice', length: questions, seed: 5, now: () => (clock += 4000) })
  let q
  while ((q = s.next())) s.submit(solutionFor(q.item))
  return s.finish()
}

async function twoPhones() {
  const remote = createFakeRemote()
  const dad = await Repo.open(reg, createMemoryStorage())
  const ellie = await Repo.open(reg, createMemoryStorage())
  dad.apply([
    ...A.saveMember('dad', { id: 'dad', name: 'Dad', role: 'parent', colour: '#4cc9f0', active: true }, clock++),
    ...A.saveMember('dad', { id: 'ellie', name: 'Ellie', role: 'child', colour: '#ffc857', active: true }, clock++),
    ...A.setEconomy('dad', { effectiveFrom: day }, clock++),
  ])
  await dad.setMe('dad')
  await dad.sync(remote)
  await ellie.sync(remote)
  await ellie.setMe('ellie')
  return { remote, dad, ellie }
}

describe('family sync', () => {
  it('a new phone pulls the whole family and then acts as the person who holds it', async () => {
    const { ellie } = await twoPhones()
    expect(Object.keys(ellie.family().members).sort()).toEqual(['dad', 'ellie'])
    expect(ellie.me()).toBe('ellie')
    expect(ellie.learnerId).toBe('ellie')
  })

  it("the task -> check -> coins loop works across two phones, and learning XP feeds the same balance", async () => {
    const { remote, dad, ellie } = await twoPhones()
    // Dad sets homework on his phone.
    dad.apply(A.saveTask('dad', { title: 'Maths homework', assignee: 'ellie', kind: 'homework', part: 'any', date: '2026-09-30', coins: 20 }, clock++))
    await dad.sync(remote)
    await ellie.sync(remote)
    const task = Object.values(ellie.family().tasks)[0]!
    expect(task.title).toBe('Maths homework')

    // Ellie does it and plays a game.
    ellie.apply(A.completeTask('ellie', ellie.family(), task, '2026-09-30', {}, clock++))
    const sum = play(ellie)
    await ellie.sync(remote)
    await dad.sync(remote)
    // Dad sees it waiting, and can see her StudyQuest progress without it touching his own.
    expect(balanceFor(dad.family(), 'ellie').waiting).toBe(20)
    expect(dad.learnerState('ellie').xp).toBe(sum.xp)
    expect(dad.get().xp).toBe(0)

    dad.apply(A.checkTask('dad', task.taskId, '2026-09-30', 'approved', undefined, clock++))
    await dad.sync(remote)
    await ellie.sync(remote)
    const bal = balanceFor(ellie.family(), 'ellie', ellie.get().xpByDay)
    expect(bal).toMatchObject({ tasks: 20, waiting: 0 })
    expect(bal.learning).toBe(Math.floor(Math.min(sum.xp, 400) / 10))
    expect(bal.available).toBe(20 + bal.learning)
  })

  it('two phones logging at once converge without losing anything', async () => {
    const { remote, dad, ellie } = await twoPhones()
    dad.apply(A.saveMember('dad', { id: 'sam', name: 'Sam', role: 'baby', colour: '#3ddc97', active: true }, clock++))
    await dad.sync(remote)
    await ellie.sync(remote)
    dad.apply(A.logBaby('dad', { babyId: 'sam', kind: 'nappy', at: clock, nappy: { wet: true, dirty: false } }, clock++))
    ellie.apply(A.logBaby('ellie', { babyId: 'sam', kind: 'feed', at: clock, feed: { method: 'bottle', ml: 60 } }, clock++))
    await Promise.all([dad.sync(remote), ellie.sync(remote)])
    await Promise.all([dad.sync(remote), ellie.sync(remote)])
    expect(dad.family().babies).toHaveLength(2)
    expect(ellie.family().babies).toHaveLength(2)
    expect(dad.family()).toEqual(ellie.family())
  })

  it('remembers who holds the phone across a restart', async () => {
    const storage = createMemoryStorage()
    const a = await Repo.open(reg, storage)
    await a.setMe('mum')
    const b = await Repo.open(reg, storage)
    expect(b.me()).toBe('mum')
    expect(b.learnerId).toBe('mum')
  })

  it("a legacy StudyQuest learner's history keeps working: their events project into the family's learner list", async () => {
    // A phone from before the family app: a profile and a few plays under its own learner id.
    const old = await Repo.open(reg, createMemoryStorage())
    old.apply([makeEvent(old.learnerId, { type: 'profile', name: 'Ellie', year: 8 }, clock++)])
    const sum = play(old, 4)
    const remote = createFakeRemote()
    await old.sync(remote)
    // The family phone joins the same space, links her as a member, and reads her progress.
    const dad = await Repo.open(reg, createMemoryStorage())
    await dad.sync(remote)
    expect(dad.learnerState(old.learnerId).xp).toBe(sum.xp)
    dad.apply(A.saveMember('dad', { id: old.learnerId, name: 'Ellie', role: 'child', colour: '#ffc857', active: true }, clock++))
    dad.apply(A.setEconomy('dad', { effectiveFrom: day }, clock++))
    expect(balanceFor(dad.family(), old.learnerId, dad.learnerState(old.learnerId).xpByDay).learning).toBe(Math.floor(Math.min(sum.xp, 400) / 10))
  })
})
