import { describe, expect, it } from 'vitest'
import { Registry } from '@/engine/registry'
import { mathsPack } from './pack'
import { auditRegistry } from '../quality'
import { emptyState } from '@/engine/events'
import { planNext } from '@/engine/planner'
import { makeRng } from '@/engine/rng'

const registry = new Registry([mathsPack])

describe('maths pack', () => {
  it('skill graph is valid (no cycles/unknown prerequisites) and every skill has a year and strand', () => {
    expect(registry.graph.all().length).toBeGreaterThan(50)
    for (const s of registry.graph.all()) {
      expect(s.year).toBeGreaterThanOrEqual(4)
      expect(s.strand).toBeTruthy()
    }
  })
  it('every Year 8 syllabus skill has at least one prerequisite chain reaching Year 7 or below', () => {
    for (const s of registry.graph.all().filter((k) => k.year === 8)) {
      expect(registry.graph.ancestors(s.id).some((a) => a.skill.year < 8), s.id).toBe(true)
    }
  })
  it('every skill can serve questions at levels 2-4 (foundations: 2-3) (no holes in the difficulty ladder)', () => {
    const gaps: string[] = []
    for (const s of mathsPack.skills) {
      const gens = mathsPack.generators.filter((g) => g.skillId === s.id)
      const levels = s.origin === 'foundation' ? [2, 3] : [2, 3, 4]
      for (const lv of levels) if (!gens.some((g) => g.levels[0] <= lv && lv <= g.levels[1])) gaps.push(`${s.id} L${lv}`)
    }
    expect(gaps).toEqual([])
  })
  it('generators pass the quality audit across all levels and many seeds', () => {
    const rows = auditRegistry(registry, 120)
    const summary = new Map<string, string>()
    for (const r of rows) if (!summary.has(`${r.generatorId}|${r.problem}`)) summary.set(`${r.generatorId}|${r.problem}`, `L${r.level} seed ${r.seed}: ${r.prompt}`)
    expect([...summary.entries()].map(([k, v]) => `${k}  <-  ${v}`)).toEqual([])
  })

  it('sprint for a brand-new learner uses earlier-year building blocks at easy levels, not Year 8 content', () => {
    const rng = makeRng(7)
    const state = emptyState('l1')
    for (let i = 0; i < 60; i++) {
      const p = planNext(state, { subject: 'maths', mode: 'sprint', now: Date.now(), rng, registry, year: 8, history: [] })
      expect(p).not.toBeNull()
      const skill = registry.graph.get((p as NonNullable<typeof p>).skillId)
      expect(skill.year, skill.id).toBeLessThan(8)
      expect((p as NonNullable<typeof p>).difficulty).toBeLessThanOrEqual(3)
    }
  })
})
