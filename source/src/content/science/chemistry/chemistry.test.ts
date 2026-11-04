import { describe, expect, it } from 'vitest'
import { Registry } from '@/engine/registry'
import { auditRegistry } from '../../quality'
import { EQUATIONS, isBalanced, parseFormula, rfm, showEq, totalAtoms } from './formula'
import { chemistryGenerators, chemistrySkills } from './index'

const registry = new Registry([{ id: 'science', name: 'Science', tagline: '', color: '#000', version: '0', skills: chemistrySkills, generators: chemistryGenerators }])

describe('chemistry part of the science pack', () => {
  it('has a valid, self-contained skill graph with content for every skill', () => {
    const skills = registry.graph.all()
    expect(skills.length).toBeGreaterThanOrEqual(30)
    expect(skills.length).toBeLessThanOrEqual(50)
    for (const s of skills) {
      expect(s.subject).toBe('science')
      expect(s.id).toMatch(/^science\.chem\.[a-z0-9-]+(\.[a-z0-9-]+)+$/)
      expect(s.strand.startsWith('Chemistry: '), s.id).toBe(true)
      for (const p of s.prereqs) expect(p.startsWith('science.chem.'), `${s.id} -> ${p}`).toBe(true)
      expect(registry.hasContent(s.id), s.id).toBe(true)
    }
    for (const year of [7, 8, 9]) expect(skills.filter((s) => s.year === year).length, `year ${year}`).toBeGreaterThan(0)
  })

  it('generator ids all start with the chemistry prefix', () => {
    for (const g of chemistryGenerators) expect(g.id.startsWith('science.chem.'), g.id).toBe(true)
  })

  it('every skill can serve levels 2-4 with auto-marked (non-reveal) questions', () => {
    const gaps: string[] = []
    for (const s of chemistrySkills) {
      const gens = chemistryGenerators.filter((g) => g.skillId === s.id && !registry.isSlow(g.id))
      for (const lv of [2, 3, 4]) if (!gens.some((g) => g.levels[0] <= lv && lv <= g.levels[1])) gaps.push(`${s.id} L${lv}`)
    }
    expect(gaps).toEqual([])
  })

  it('every skill yields at least 8 distinct questions', () => {
    const thin: string[] = []
    for (const s of chemistrySkills) {
      const prompts = new Set<string>()
      for (const g of chemistryGenerators.filter((x) => x.skillId === s.id)) {
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

  it('every symbol equation is balanced', () => {
    for (const e of EQUATIONS) expect(isBalanced(e), showEq(e)).toBe(true)
  })

  it('parses formulae and computes relative formula masses correctly', () => {
    expect(parseFormula('Ca(OH)_{2}')).toEqual({ Ca: 1, O: 2, H: 2 })
    expect(totalAtoms('H_{2}SO_{4}')).toBe(7)
    expect(totalAtoms('C_{6}H_{12}O_{6}')).toBe(24)
    expect(rfm('H_{2}O')).toBe(18)
    expect(rfm('CO_{2}')).toBe(44)
    expect(rfm('CaCO_{3}')).toBe(100)
    expect(rfm('H_{2}SO_{4}')).toBe(98)
    expect(rfm('NaCl')).toBe(58.5)
    expect(rfm('Fe_{2}O_{3}')).toBe(160)
    expect(rfm('Ca(OH)_{2}')).toBe(74)
    expect(rfm('C_{6}H_{12}O_{6}')).toBe(180)
    expect(rfm('CuSO_{4}')).toBe(159.5)
  })
})
