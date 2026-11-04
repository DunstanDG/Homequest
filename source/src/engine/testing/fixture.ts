import { Registry, type ItemGenerator, type SubjectPack } from '../registry'
import type { Skill } from '../types'

const sk = (id: string, year: number, prereqs: string[], origin: Skill['origin'] = 'syllabus'): Skill => ({
  id,
  subject: 'test',
  name: id.toUpperCase(),
  description: id,
  year,
  strand: id === 't.d' ? 'Other' : 'Main',
  prereqs,
  origin,
})

const add = (skillId: string): ItemGenerator => ({
  id: `${skillId}.add`,
  skillId,
  levels: [1, 5],
  generate(rng, d) {
    const a = rng.int(2, 5 + d * 10)
    const b = rng.int(2, 5 + d * 10)
    return {
      kind: 'numeric',
      prompt: `${a} + ${b} = ?`,
      hint: 'Add the numbers.',
      explanation: `${a} + ${b} = ${a + b}`,
      fields: [{ answer: a + b }],
      commonErrors: [{ values: [a + b + 1], tag: 'off-by-one', message: 'Check your addition.' }],
    }
  },
})

export const fixturePack: SubjectPack = {
  id: 'test',
  name: 'Test',
  tagline: 'fixture',
  color: '#fff',
  version: 'test-1',
  skills: [sk('t.a', 6, [], 'foundation'), sk('t.b', 7, ['t.a']), sk('t.c', 8, ['t.b']), sk('t.d', 8, ['t.b'])],
  generators: ['t.a', 't.b', 't.c', 't.d'].map(add),
}

export const fixtureRegistry = () => new Registry([fixturePack])
