import { describe, expect, it } from 'vitest'
import { Registry } from '@/engine/registry'
import { auditRegistry } from '../quality'
import { HISTORY_TOPICS, historyPack } from './pack'

const registry = new Registry([historyPack])

describe('history pack', () => {
  it('has a valid skill graph and content for every skill', () => {
    expect(historyPack.version).toBe('1.0.0')
    const skills = registry.graph.all()
    expect(skills.length).toBeGreaterThanOrEqual(45)
    expect(skills.length).toBeLessThanOrEqual(70)
    for (const s of skills) {
      expect(s.id.startsWith('history.'), s.id).toBe(true)
      for (const p of s.prereqs) expect(p.startsWith('history.'), `${s.id} -> ${p}`).toBe(true)
      expect(registry.hasContent(s.id), s.id).toBe(true)
    }
  })

  it('every topic table points at a real skill, and each skill has at most one table', () => {
    const ids = new Set(historyPack.skills.map((s) => s.id))
    const seen = new Set<string>()
    for (const t of HISTORY_TOPICS) {
      expect(ids.has(`history.${t.skill}`), t.skill).toBe(true)
      expect(seen.has(t.skill), `duplicate topic ${t.skill}`).toBe(false)
      seen.add(t.skill)
    }
  })

  it('every skill can serve levels 2-4 with auto-marked questions', () => {
    const gaps: string[] = []
    for (const s of historyPack.skills) {
      const gens = historyPack.generators.filter((g) => g.skillId === s.id && !registry.isSlow(g.id))
      for (const lv of [2, 3, 4]) if (!gens.some((g) => g.levels[0] <= lv && lv <= g.levels[1])) gaps.push(`${s.id} L${lv}`)
    }
    expect(gaps).toEqual([])
  })

  it('every skill yields plenty of different questions', () => {
    const thin: string[] = []
    for (const s of historyPack.skills) {
      const prompts = new Set<string>()
      for (let seed = 1; seed <= 300; seed++) {
        const item = registry.makeItem(s.id, 1 + (seed % 5), seed)
        prompts.add(JSON.stringify([item.prompt, item.kind === 'choice' ? item.options.map((o) => o.label).sort() : item.kind === 'order' ? item.items.map((i) => i.label).sort() : item.kind === 'match' ? item.pairs.map((p) => p.left).sort() : '']))
      }
      if (prompts.size < 8) thin.push(`${s.id}: ${prompts.size}`)
    }
    expect(thin).toEqual([])
  })

  it('timeline items have distinct years so the order is never ambiguous', () => {
    for (const t of HISTORY_TOPICS) {
      const labels = (t.events ?? []).map((e) => e.e)
      expect(new Set(labels).size, t.skill).toBe(labels.length)
    }
  })

  it('generators pass the quality audit', () => {
    const rows = auditRegistry(registry, 60)
    expect(rows.map((r) => `${r.generatorId} L${r.level}: ${r.problem} <- ${r.prompt}`).slice(0, 10)).toEqual([])
  })
})
