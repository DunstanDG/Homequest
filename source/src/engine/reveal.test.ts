import { describe, expect, it } from 'vitest'
import { generatorFor, reveal, choice } from '@/content/kit'
import { auditItem } from '@/content/quality'
import { judge, solutionFor } from './judge'
import { Registry, type SubjectPack } from './registry'
import type { RevealItem } from './types'

const G = generatorFor('demo')
const pack: SubjectPack = {
  id: 'demo',
  name: 'Demo',
  tagline: '',
  color: '#000',
  version: '0',
  skills: [{ id: 'demo.why', subject: 'demo', year: 8, strand: 'S', name: 'Why', description: 'd', prereqs: [], origin: 'syllabus' }],
  generators: [
    G('why.write', 'why', [2, 4], () =>
      reveal({
        prompt: 'Explain why the Romans built roads.',
        model: 'To move soldiers quickly, and to help trade.',
        checklist: ['Gives a military reason', 'Gives an economic reason', 'Explains how roads helped'],
      }),
    ),
    G('why.pick', 'why', [1, 4], (rng) => choice({ rng, prompt: 'Roads helped...', correct: 'move soldiers', wrong: ['grow crops', 'catch fish'], explanation: 'e' })),
  ],
}

describe('self-marked written answers', () => {
  const registry = new Registry([pack])
  const item = registry.generateWith('demo.why.write', 3, 1) as RevealItem

  it('passes when enough checklist points are ticked, and keeps her writing as the given answer', () => {
    expect(item.passMark).toBe(2)
    const j = judge(item, { kind: 'reveal', text: 'They built roads so the army could march fast.', ticked: [0, 2] })
    expect(j.correct).toBe(true)
    expect(j.given).toBe('They built roads so the army could march fast.')
    expect(judge(item, { kind: 'reveal', text: 'They built roads so the army could march fast.', ticked: [0] }).correct).toBe(false)
  })

  it('treats a blank or one-word answer as not yet answered, and ignores bogus ticks', () => {
    expect(judge(item, { kind: 'reveal', text: 'roads', ticked: [0, 1, 2] }).unparseable).toBe(true)
    expect(judge(item, { kind: 'reveal', text: 'A proper sentence about roads.', ticked: [7, 9, 0] }).correct).toBe(false)
  })

  it('passes the content audit, and its own solution is correct', () => {
    expect(auditItem(item)).toEqual([])
    expect(judge(item, solutionFor(item)).correct).toBe(true)
  })

  it('is left out of quick sessions when the skill has auto-marked questions too', () => {
    expect(registry.isSlow('demo.why.write')).toBe(true)
    expect(registry.isSlow('demo.why.pick')).toBe(false)
    for (let seed = 1; seed < 60; seed++) expect(registry.makeItem('demo.why', 3, seed, { quick: true }).kind).toBe('choice')
    const kinds = new Set(Array.from({ length: 60 }, (_, s) => registry.makeItem('demo.why', 3, s + 1).kind))
    expect(kinds.has('reveal')).toBe(true)
  })
})
