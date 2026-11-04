import { describe, expect, it } from 'vitest'
import { judge } from '@/engine/judge'
import { Registry, type SubjectPack } from '@/engine/registry'
import { auditRegistry } from '../../quality'
import { germanPack, germanSkills } from '../pack'
import { grammarGenerators, grammarSkills } from './index'

// A throwaway pack holding the existing German skills plus the grammar part, so prerequisites resolve.
const pack: SubjectPack = {
  ...germanPack,
  skills: germanPack.skills,
  generators: germanPack.generators,
}
const registry = new Registry([pack])
const newIds = new Set(grammarSkills.map((s) => s.id))

describe('german grammar part', () => {
  it('has a valid skill graph with well-formed new skills', () => {
    expect(grammarSkills.length).toBeGreaterThanOrEqual(28)
    expect(grammarSkills.length).toBeLessThanOrEqual(36)
    const old = new Set(germanSkills.map((s) => s.id))
    for (const s of grammarSkills) {
      expect(s.id, s.id).toMatch(/^german\.grammar\.[a-z0-9-]+$/)
      expect(old.has(s.id), `${s.id} clashes with an existing skill`).toBe(false)
      expect(s.subject).toBe('german')
      expect(s.strand).toMatch(/^Grammar: /)
      expect([7, 8, 9]).toContain(s.year)
      for (const p of s.prereqs) expect(registry.graph.has(p), `${s.id} -> ${p}`).toBe(true)
    }
    // Every Year 8/9 skill rests on something earlier.
    for (const s of grammarSkills.filter((k) => k.year > 7)) {
      expect(registry.graph.ancestors(s.id).some((a) => a.skill.year < s.year), s.id).toBe(true)
    }
  })

  it('every generator id uses the gram. prefix and targets a new grammar skill', () => {
    for (const g of grammarGenerators) {
      expect(g.id, g.id).toMatch(/^german\.gram\./)
      expect(newIds.has(g.skillId), g.id).toBe(true)
    }
  })

  it('every new skill has auto-marked (non-reveal) questions at levels 2, 3 and 4', () => {
    const gaps: string[] = []
    for (const s of grammarSkills) {
      const gens = grammarGenerators.filter((g) => g.skillId === s.id)
      for (const lv of [2, 3, 4]) {
        const ok = gens.some((g) => g.levels[0] <= lv && lv <= g.levels[1] && registry.generateWith(g.id, lv, 1).kind !== 'reveal')
        if (!ok) gaps.push(`${s.id} L${lv}`)
      }
    }
    expect(gaps).toEqual([])
  })

  it('every new skill yields at least 8 genuinely different questions', () => {
    const thin: string[] = []
    for (const s of grammarSkills) {
      const seen = new Set<string>()
      for (const g of grammarGenerators.filter((x) => x.skillId === s.id)) {
        for (let lv = g.levels[0]; lv <= g.levels[1]; lv++) {
          for (let seed = 1; seed <= 40; seed++) seen.add(registry.generateWith(g.id, lv, seed).prompt)
        }
      }
      if (seen.size < 8) thin.push(`${s.id}: ${seen.size}`)
    }
    expect(thin).toEqual([])
  })

  it('generators pass the quality audit', () => {
    const rows = auditRegistry(new Registry([{ ...pack, generators: grammarGenerators }]), 60)
    expect(rows.map((r) => `${r.generatorId} L${r.level}: ${r.problem} <- ${r.prompt}`).slice(0, 15)).toEqual([])
  })

  it('typed answers accept ae/oe/ue/ss spellings but not a missing umlaut', () => {
    let checked = 0
    for (let seed = 1; seed <= 300 && checked < 10; seed++) {
      const item = registry.generateWith('german.gram.irreg.type', 3, seed)
      if (item.kind !== 'text') continue
      const canonical = item.accept[0] as string
      if (!/ä/.test(canonical)) continue
      checked++
      expect(judge(item, { kind: 'text', value: canonical.replace(/ä/g, 'ae') }).correct, canonical).toBe(true)
      expect(judge(item, { kind: 'text', value: canonical.replace(/ä/g, 'a') }).correct, canonical).toBe(false)
    }
    expect(checked).toBeGreaterThan(0)
  })

  it('builds key forms correctly', () => {
    const answers = (id: string, level: number, n = 400) => {
      const out = new Set<string>()
      for (let seed = 1; seed <= n; seed++) {
        const it = registry.generateWith(id, level, seed)
        if (it.kind === 'text') out.add(it.accept[0] as string)
        if (it.kind === 'choice') out.add(it.options.find((o) => o.correct)?.label ?? '')
      }
      return out
    }
    const perf = answers('german.gram.perfsep.type', 4)
    expect(perf.has('aufgestanden') || perf.has('ferngesehen')).toBe(true)
    for (const a of perf) expect(a.startsWith('ge') && /^ge(auf|fern|ein|an|ab|zu|mit|aus)/.test(a)).toBe(false)
    const poss = answers('german.gram.possacc.type', 4)
    for (const a of poss) expect(a).not.toMatch(/^euer[ne]/)
    const imp = answers('german.gram.imp.type', 5)
    for (const a of imp) expect(a).not.toMatch(/^(Lese|Esse|Nehme|Fähr|Schläf)\b/)
  })
})
