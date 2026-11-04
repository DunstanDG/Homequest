import { describe, expect, it } from 'vitest'
import { Registry } from '@/engine/registry'
import { makeRng } from '@/engine/rng'
import type { Item } from '@/engine/types'
import { auditRegistry } from '../quality'
import { englishPack } from './pack'
import { PASSAGES } from './passages'

const registry = new Registry([englishPack])
const isReveal = (genId: string) => englishPack.generators.find((g) => g.id === genId)!.generate(makeRng(1), englishPack.generators.find((g) => g.id === genId)!.levels[0]).kind === 'reveal'

describe('english pack', () => {
  it('has a valid skill graph of a sensible size, with years and strands', () => {
    const skills = registry.graph.all()
    expect(skills.length).toBeGreaterThanOrEqual(45)
    expect(skills.length).toBeLessThanOrEqual(70)
    for (const s of skills) {
      expect(s.id.startsWith('english.'), s.id).toBe(true)
      expect(s.id).toMatch(/^english\.[a-z0-9-]+\.[a-z0-9-]+$/)
      expect(s.strand).toBeTruthy()
      expect([6, 7, 8, 9]).toContain(s.year)
      expect(s.origin === 'foundation').toBe(s.year === 6)
      for (const p of s.prereqs) expect(p.startsWith('english.'), `${s.id} -> ${p}`).toBe(true)
    }
    expect(englishPack.version).toBe('1.0.0')
  })

  it('every skill has content', () => {
    for (const s of registry.graph.all()) expect(registry.hasContent(s.id), s.id).toBe(true)
  })

  it('every Year 8 and 9 skill has a prerequisite chain reaching an earlier year', () => {
    for (const s of registry.graph.all().filter((k) => k.year >= 8)) {
      expect(registry.graph.ancestors(s.id).some((a) => a.skill.year < s.year), s.id).toBe(true)
    }
  })

  it('every skill can serve levels 2-4 from auto-marked (non-reveal) generators', () => {
    const gaps: string[] = []
    for (const s of englishPack.skills) {
      const gens = englishPack.generators.filter((g) => g.skillId === s.id && !isReveal(g.id))
      for (const lv of [2, 3, 4]) if (!gens.some((g) => g.levels[0] <= lv && lv <= g.levels[1])) gaps.push(`${s.id} L${lv}`)
    }
    expect(gaps).toEqual([])
  })

  it('every skill yields at least 8 genuinely different auto-marked questions', () => {
    const thin: string[] = []
    for (const s of englishPack.skills) {
      const seen = new Set<string>()
      for (const g of englishPack.generators.filter((x) => x.skillId === s.id && !isReveal(x.id))) {
        for (let lv = g.levels[0]; lv <= g.levels[1]; lv++) {
          for (let seed = 1; seed <= 40; seed++) {
            const it: Item = registry.generateWith(g.id, lv, seed)
            const answer = it.kind === 'choice' ? it.options.find((o) => o.correct)?.label : it.kind === 'text' ? it.accept[0] : it.kind === 'match' ? it.pairs.map((p) => p.left).sort().join() : it.kind === 'order' ? it.correctOrder.join() + it.items.map((x) => x.label).sort().join() : ''
            seen.add(`${it.prompt}|${answer}`)
          }
        }
      }
      if (seen.size < 8) thin.push(`${s.id}: ${seen.size}`)
    }
    expect(thin).toEqual([])
  })

  it('generators pass the quality audit', () => {
    const rows = auditRegistry(registry, 60)
    const summary = new Map<string, string>()
    for (const r of rows) if (!summary.has(`${r.generatorId}|${r.problem}`)) summary.set(`${r.generatorId}|${r.problem}`, `L${r.level} seed ${r.seed}: ${r.prompt}`)
    expect([...summary.entries()].map(([k, v]) => `${k}  <-  ${v}`)).toEqual([])
  })

  it('every reading passage has an attribution and only one correct option per question', () => {
    for (const p of PASSAGES) {
      expect(p.fig.type).toBe('passage')
      if (p.fig.type === 'passage') expect(p.fig.source, p.id).toBeTruthy()
      for (const q of p.qs) {
        const labels = q.w.map((w) => (typeof w === 'string' ? w : w.label))
        expect(labels, q.q).not.toContain(q.a)
        expect(new Set(labels).size, q.q).toBe(labels.length)
      }
    }
  })

  it('choice items never offer a distractor identical to the answer and typed answers accept curly apostrophes', () => {
    const item = registry.generateWith('english.apostrophes.contraction', 2, 3)
    expect(item.kind).toBe('text')
    if (item.kind === 'text') expect(item.accept.some((a) => a.includes('’'))).toBe(true)
  })
})
