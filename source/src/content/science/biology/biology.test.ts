import { describe, expect, it } from 'vitest'
import { Registry } from '@/engine/registry'
import { auditRegistry } from '../../quality'
import { biologyGenerators, biologySkills } from './index'

const registry = new Registry([{ id: 'science', name: 'Science', tagline: '', color: '#000', version: '0', skills: biologySkills, generators: biologyGenerators }])

describe('biology part of the science pack', () => {
  it('has a valid, self-contained skill graph with content for every skill', () => {
    const skills = registry.graph.all()
    expect(skills.length).toBeGreaterThanOrEqual(30)
    expect(skills.length).toBeLessThanOrEqual(50)
    for (const s of skills) {
      expect(s.subject).toBe('science')
      expect(s.origin).toBe('syllabus')
      expect(s.id).toMatch(/^science\.bio\.[a-z0-9-]+(\.[a-z0-9-]+)+$/)
      expect(s.strand.startsWith('Biology: '), s.id).toBe(true)
      for (const p of s.prereqs) {
        expect(p.startsWith('science.bio.'), `${s.id} -> ${p}`).toBe(true)
        expect(registry.graph.has(p), `${s.id} -> ${p}`).toBe(true)
      }
      expect(registry.hasContent(s.id), s.id).toBe(true)
    }
    for (const year of [7, 8, 9]) expect(skills.filter((s) => s.year === year).length, `year ${year}`).toBeGreaterThan(0)
  })

  it('has no prerequisite cycles', () => {
    const byId = new Map(biologySkills.map((s) => [s.id, s]))
    const state = new Map<string, 'visiting' | 'done'>()
    const cycles: string[] = []
    const visit = (id: string, path: string[]) => {
      if (state.get(id) === 'done') return
      if (state.get(id) === 'visiting') {
        cycles.push([...path, id].join(' -> '))
        return
      }
      state.set(id, 'visiting')
      for (const p of byId.get(id)?.prereqs ?? []) visit(p, [...path, id])
      state.set(id, 'done')
    }
    for (const s of biologySkills) visit(s.id, [])
    expect(cycles).toEqual([])
  })

  it('generator ids are unique and all start with the biology prefix', () => {
    const ids = biologyGenerators.map((g) => g.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const g of biologyGenerators) expect(g.id.startsWith('science.bio.'), g.id).toBe(true)
  })

  it('every skill can serve levels 2-4 with auto-marked (non-reveal) questions', () => {
    const gaps: string[] = []
    for (const s of biologySkills) {
      const gens = biologyGenerators.filter((g) => g.skillId === s.id && !registry.isSlow(g.id))
      for (const lv of [2, 3, 4]) if (!gens.some((g) => g.levels[0] <= lv && lv <= g.levels[1])) gaps.push(`${s.id} L${lv}`)
    }
    expect(gaps).toEqual([])
  })

  it('every skill yields at least 8 distinct questions', () => {
    const thin: string[] = []
    for (const s of biologySkills) {
      const prompts = new Set<string>()
      for (const g of biologyGenerators.filter((x) => x.skillId === s.id)) {
        for (let lv = g.levels[0]; lv <= g.levels[1]; lv++) {
          for (let seed = 1; seed <= 40; seed++) {
            const it = registry.generateWith(g.id, lv, seed)
            prompts.add(JSON.stringify([it.prompt, it.figure ?? null, it.kind === 'match' ? it.pairs.map((p) => p.left).sort() : null]))
          }
        }
      }
      if (prompts.size < 8) thin.push(`${s.id}: ${prompts.size}`)
    }
    expect(thin).toEqual([])
  })

  it('generators pass the quality audit', () => {
    const rows = auditRegistry(registry, 60)
    expect(rows.map((r) => `${r.generatorId} L${r.level}: ${r.problem} <- ${r.prompt}`).slice(0, 10)).toEqual([])
  })
})
