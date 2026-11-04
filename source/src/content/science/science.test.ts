import { describe, expect, it } from 'vitest'
import { Registry } from '@/engine/registry'
import { auditRegistry } from '../quality'
import { sciencePack } from './pack'

const registry = new Registry([sciencePack])

describe('science pack (all three parts together)', () => {
  it('has unique skill and generator ids across the three parts', () => {
    const skills = sciencePack.skills.map((s) => s.id)
    const gens = sciencePack.generators.map((g) => g.id)
    expect(new Set(skills).size).toBe(skills.length)
    expect(new Set(gens).size).toBe(gens.length)
  })

  it('has a valid graph and content for every skill', () => {
    expect(registry.graph.all().length).toBeGreaterThanOrEqual(120)
    for (const s of registry.graph.all()) expect(registry.hasContent(s.id), s.id).toBe(true)
  })

  it('passes the quality audit when combined', () => {
    const rows = auditRegistry(registry, 20)
    expect(rows.map((r) => `${r.generatorId} L${r.level}: ${r.problem}`).slice(0, 10)).toEqual([])
  })
})
