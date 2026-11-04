import { describe, expect, it } from 'vitest'
import { Registry } from '@/engine/registry'
import { auditRegistry } from '../quality'
import { geographyPack } from './pack'

const registry = new Registry([geographyPack])

describe('geography pack', () => {
  it('has a valid, self-contained skill graph with content for every skill', () => {
    const skills = registry.graph.all()
    expect(skills.length).toBeGreaterThanOrEqual(45)
    expect(skills.length).toBeLessThanOrEqual(70)
    for (const s of skills) {
      expect(s.id.startsWith('geography.'), s.id).toBe(true)
      expect(s.id).toMatch(/^geography\.[a-z0-9-]+(\.[a-z0-9-]+)+$/)
      for (const p of s.prereqs) expect(p.startsWith('geography.'), `${s.id} -> ${p}`).toBe(true)
      expect(registry.hasContent(s.id), s.id).toBe(true)
    }
    for (const year of [7, 8, 9]) expect(skills.filter((s) => s.year === year).length, `year ${year}`).toBeGreaterThan(0)
  })

  it('every skill can serve levels 2-4 with auto-marked (non-reveal) questions', () => {
    const gaps: string[] = []
    for (const s of geographyPack.skills) {
      const gens = geographyPack.generators.filter((g) => g.skillId === s.id && !registry.isSlow(g.id))
      for (const lv of [2, 3, 4]) if (!gens.some((g) => g.levels[0] <= lv && lv <= g.levels[1])) gaps.push(`${s.id} L${lv}`)
    }
    expect(gaps).toEqual([])
  })

  it('every skill yields at least 8 distinct questions', () => {
    const thin: string[] = []
    for (const s of geographyPack.skills) {
      const prompts = new Set<string>()
      for (const g of geographyPack.generators.filter((x) => x.skillId === s.id)) {
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

  it('term definitions never contain the term they define', () => {
    const leaks: string[] = []
    for (const g of geographyPack.generators.filter((x) => x.id.endsWith('.term-name'))) {
      for (let seed = 1; seed <= 80; seed++) {
        const it = registry.generateWith(g.id, 2, seed)
        if (it.kind !== 'choice') continue
        const correct = it.options.find((o) => o.correct)?.label ?? ''
        const def = it.prompt.split('\n')[1] ?? ''
        if (correct && def.toLowerCase().includes(correct.toLowerCase())) leaks.push(`${g.id}: ${correct}`)
      }
    }
    expect([...new Set(leaks)]).toEqual([])
  })

  it('grid references give eastings before northings', () => {
    for (let seed = 1; seed < 200; seed++) {
      const it = registry.generateWith('geography.maps.grid4.give', 3, seed)
      if (it.kind !== 'numeric' || it.figure?.type !== 'coord-grid') throw new Error('expected numeric grid item')
      const p = it.figure.points?.find((q) => it.prompt.includes(` at ${q.label}.`))
      expect(p).toBeDefined()
      const want = `${Math.floor(p!.x)}${Math.floor(p!.y)}`
      expect(it.fields[0]?.display).toBe(want)
    }
    for (let seed = 1; seed < 200; seed++) {
      const it = registry.generateWith('geography.maps.grid6.zoom', 3, seed)
      if (it.kind !== 'numeric' || it.figure?.type !== 'coord-grid') throw new Error('expected numeric grid item')
      const p = it.figure.points?.[0]
      const m = /square (\d\d)(\d\d) enlarged/.exec(it.prompt)
      expect(m).not.toBeNull()
      expect(it.fields[0]?.display).toBe(`${m![1]}${p!.x}${m![2]}${p!.y}`)
    }
  })

  it('generators pass the quality audit', () => {
    const rows = auditRegistry(registry, 60)
    expect(rows.map((r) => `${r.generatorId} L${r.level}: ${r.problem} <- ${r.prompt}`).slice(0, 15)).toEqual([])
  })
})
