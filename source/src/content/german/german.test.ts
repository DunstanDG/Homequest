import { describe, expect, it } from 'vitest'
import { Registry } from '@/engine/registry'
import { auditRegistry } from '../quality'
import { germanPack } from './pack'

const registry = new Registry([germanPack])

describe('german starter pack', () => {
  it('has a valid skill graph and content for every skill', () => {
    expect(registry.graph.all().length).toBeGreaterThanOrEqual(8)
    for (const s of registry.graph.all()) expect(registry.hasContent(s.id), s.id).toBe(true)
  })

  it('every skill can serve levels 2-4', () => {
    const gaps: string[] = []
    for (const s of germanPack.skills) {
      const gens = germanPack.generators.filter((g) => g.skillId === s.id)
      for (const lv of [2, 3, 4]) if (!gens.some((g) => g.levels[0] <= lv && lv <= g.levels[1])) gaps.push(`${s.id} L${lv}`)
    }
    expect(gaps).toEqual([])
  })

  it('generators pass the quality audit', () => {
    const rows = auditRegistry(registry, 120)
    expect(rows.map((r) => `${r.generatorId} L${r.level}: ${r.problem} <- ${r.prompt}`).slice(0, 10)).toEqual([])
  })

  it('tricky verb forms are conjugated correctly', () => {
    const forms = new Set<string>()
    for (let seed = 1; seed < 400; seed++) {
      const item = registry.generateWith('german.verbs.write', 5, seed)
      if (item.kind === 'text') for (const a of item.accept) forms.add(a)
    }
    expect(forms.has('arbeitest') || forms.has('arbeitet')).toBe(true)
    expect(forms.has('tanzt')).toBe(true)
    expect(forms.has('tanzst')).toBe(false)
  })
})
