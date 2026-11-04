import { describe, expect, it } from 'vitest'
import { Registry } from '@/engine/registry'
import { auditRegistry } from '../../quality'
import { physicsGenerators, physicsSkills } from './index'

const registry = new Registry([{ id: 'science', name: 'Science', tagline: '', color: '#000', version: '0', skills: physicsSkills, generators: physicsGenerators }])

describe('physics part of the science pack', () => {
  it('has a valid, self-contained skill graph with content for every skill', () => {
    const skills = registry.graph.all()
    expect(skills.length).toBeGreaterThanOrEqual(30)
    expect(skills.length).toBeLessThanOrEqual(50)
    for (const s of skills) {
      expect(s.subject).toBe('science')
      expect(s.id).toMatch(/^science\.phys\.[a-z0-9-]+(\.[a-z0-9-]+)+$/)
      expect(s.strand.startsWith('Physics: '), s.id).toBe(true)
      for (const p of s.prereqs) {
        expect(p.startsWith('science.phys.'), `${s.id} -> ${p}`).toBe(true)
        expect(registry.graph.has(p), `${s.id} -> ${p}`).toBe(true)
      }
      expect(registry.hasContent(s.id), s.id).toBe(true)
    }
    for (const year of [7, 8, 9]) expect(skills.filter((s) => s.year === year).length, `year ${year}`).toBeGreaterThan(0)
  })

  it('has no cycles in the prerequisite graph', () => {
    const byId = new Map(physicsSkills.map((s) => [s.id, s]))
    const state = new Map<string, 'visiting' | 'done'>()
    const visit = (id: string, path: string[]) => {
      if (state.get(id) === 'done') return
      expect(state.get(id), `cycle: ${[...path, id].join(' -> ')}`).not.toBe('visiting')
      state.set(id, 'visiting')
      for (const p of byId.get(id)?.prereqs ?? []) visit(p, [...path, id])
      state.set(id, 'done')
    }
    for (const s of physicsSkills) visit(s.id, [])
  })

  it('generator ids all start with the physics prefix and are unique', () => {
    for (const g of physicsGenerators) expect(g.id.startsWith('science.phys.'), g.id).toBe(true)
    expect(new Set(physicsGenerators.map((g) => g.id)).size).toBe(physicsGenerators.length)
  })

  it('every skill can serve levels 2-4 with auto-marked (non-reveal) questions', () => {
    const gaps: string[] = []
    for (const s of physicsSkills) {
      const gens = physicsGenerators.filter((g) => g.skillId === s.id && !registry.isSlow(g.id))
      for (const lv of [2, 3, 4]) if (!gens.some((g) => g.levels[0] <= lv && lv <= g.levels[1])) gaps.push(`${s.id} L${lv}`)
    }
    expect(gaps).toEqual([])
  })

  it('every skill yields at least 8 distinct questions', () => {
    const thin: string[] = []
    for (const s of physicsSkills) {
      const prompts = new Set<string>()
      for (const g of physicsGenerators.filter((x) => x.skillId === s.id)) {
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
  }, 60_000) // CPU-heavy: 5 s is too tight when the whole suite runs in parallel

  it('calculation answers match the numbers in the prompt for key formulae', () => {
    // Speed: answer × time = distance for level 2 speed questions.
    for (let seed = 1; seed <= 60; seed++) {
      const it = registry.generateWith('science.phys.motion.speed.calc', 2, seed)
      if (it.kind !== 'numeric') throw new Error('expected numeric')
      const m = /(\S+) m in (\d+) s/.exec(it.prompt)
      expect(m, it.prompt).not.toBeNull()
      const d = Number((m?.[1] ?? '').replace(/,/g, ''))
      const t = Number(m?.[2])
      expect(Math.abs((it.fields[0]?.answer ?? NaN) * t - d)).toBeLessThan(1e-6)
    }
    // Weight: weight on Earth = mass × 10.
    for (let seed = 1; seed <= 40; seed++) {
      const it = registry.generateWith('science.phys.space.gravity.weight', 1, seed)
      if (it.kind !== 'numeric') throw new Error('expected numeric')
      const m = Number(/a (\d+) kg object/.exec(it.prompt)?.[1])
      expect(it.fields[0]?.answer).toBe(m * 10)
    }
    // Echo: distance to the cliff = 340 × time ÷ 2.
    for (let seed = 1; seed <= 40; seed++) {
      const it = registry.generateWith('science.phys.waves.echoes.calc', 3, seed)
      if (it.kind !== 'numeric') throw new Error('expected numeric')
      const t = Number(/echo from a cliff ([\d.]+) s later/.exec(it.prompt)?.[1])
      expect(Math.abs((it.fields[0]?.answer ?? NaN) - (340 * t) / 2)).toBeLessThan(1e-9)
    }
  })
})
