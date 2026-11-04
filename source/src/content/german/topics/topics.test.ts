import { describe, expect, it } from 'vitest'
import { judge } from '@/engine/judge'
import { Registry, type SubjectPack } from '@/engine/registry'
import { auditRegistry } from '../../quality'
import { germanPack, germanSkills } from '../pack'
import { topicGenerators, topicSkills } from './index'
import { numDe, ordStem, timeDe } from './numbers-time'
import { priceDe } from './food-shopping'

// A throwaway pack holding the existing German skills plus the Topics part, so prerequisites resolve.
const pack: SubjectPack = {
  ...germanPack,
  skills: germanPack.skills,
  generators: germanPack.generators,
}
const registry = new Registry([pack])
const newIds = new Set(topicSkills.map((s) => s.id))
const STRANDS = /^(Vocabulary: .+|Reading|Translation|Sounds and spelling|Culture)$/

describe('german topics part', () => {
  it('has a valid skill graph with well-formed new skills', () => {
    expect(topicSkills.length).toBeGreaterThanOrEqual(28)
    expect(topicSkills.length).toBeLessThanOrEqual(36)
    const old = new Set(germanSkills.map((s) => s.id))
    for (const s of topicSkills) {
      expect(s.id, s.id).toMatch(/^german\.(vocab|reading|translate|sounds|culture)\.[a-z0-9-]+$/)
      expect(old.has(s.id), `${s.id} clashes with an existing skill`).toBe(false)
      expect(s.subject).toBe('german')
      expect(s.strand, s.id).toMatch(STRANDS)
      expect(s.origin).toBe('syllabus')
      expect([7, 8, 9]).toContain(s.year)
      for (const p of s.prereqs) {
        expect(registry.graph.has(p), `${s.id} -> ${p}`).toBe(true)
        expect(p.startsWith('german.grammar.') && !old.has(p), `${s.id} depends on a new grammar skill ${p}`).toBe(false)
      }
    }
    // Every Year 8/9 skill rests on something earlier.
    for (const s of topicSkills.filter((k) => k.year > 7)) {
      expect(registry.graph.ancestors(s.id).some((a) => a.skill.year < s.year), s.id).toBe(true)
    }
    // Year 8 is the strongest year.
    const byYear = (y: number) => topicSkills.filter((s) => s.year === y).length
    expect(byYear(8)).toBeGreaterThanOrEqual(byYear(7))
    expect(byYear(8)).toBeGreaterThanOrEqual(byYear(9))
  })

  it('every generator id uses the top. prefix and targets a new topics skill', () => {
    for (const g of topicGenerators) {
      expect(g.id, g.id).toMatch(/^german\.top\./)
      expect(newIds.has(g.skillId), g.id).toBe(true)
    }
  })

  it('every new skill has auto-marked (non-reveal) questions at levels 2, 3 and 4', () => {
    const gaps: string[] = []
    for (const s of topicSkills) {
      const gens = topicGenerators.filter((g) => g.skillId === s.id)
      for (const lv of [2, 3, 4]) {
        const ok = gens.some((g) => g.levels[0] <= lv && lv <= g.levels[1] && registry.generateWith(g.id, lv, 1).kind !== 'reveal')
        if (!ok) gaps.push(`${s.id} L${lv}`)
      }
    }
    expect(gaps).toEqual([])
  })

  it('every new skill yields at least 8 genuinely different questions', () => {
    const thin: string[] = []
    for (const s of topicSkills) {
      const seen = new Set<string>()
      for (const g of topicGenerators.filter((x) => x.skillId === s.id)) {
        for (let lv = g.levels[0]; lv <= g.levels[1]; lv++) {
          for (let seed = 1; seed <= 40; seed++) seen.add(registry.generateWith(g.id, lv, seed).prompt)
        }
      }
      if (seen.size < 8) thin.push(`${s.id}: ${seen.size}`)
    }
    expect(thin).toEqual([])
  })

  it('generators pass the quality audit', () => {
    const rows = auditRegistry(new Registry([{ ...pack, generators: topicGenerators }]), 60)
    expect(rows.map((r) => `${r.generatorId} L${r.level}: ${r.problem} <- ${r.prompt}`).slice(0, 15)).toEqual([])
  })

  it('builds numbers, dates, times and prices correctly', () => {
    expect(numDe(21)).toBe('einundzwanzig')
    expect(numDe(47)).toBe('siebenundvierzig')
    expect(numDe(16)).toBe('sechzehn')
    expect(numDe(17)).toBe('siebzehn')
    expect(numDe(30)).toBe('dreißig')
    expect(numDe(60)).toBe('sechzig')
    expect(numDe(70)).toBe('siebzig')
    expect(numDe(99)).toBe('neunundneunzig')
    expect(numDe(100)).toBe('hundert')
    expect([1, 3, 7, 8, 19, 20, 31].map((n) => `${ordStem(n)}en`)).toEqual(['ersten', 'dritten', 'siebten', 'achten', 'neunzehnten', 'zwanzigsten', 'einunddreißigsten'])
    expect(timeDe(2, 30)).toBe('halb drei')
    expect(timeDe(12, 30)).toBe('halb eins')
    expect(timeDe(1, 0)).toBe('ein Uhr')
    expect(timeDe(8, 45)).toBe('Viertel vor neun')
    expect(timeDe(3, 25)).toBe('fünf vor halb vier')
    expect(timeDe(3, 35)).toBe('fünf nach halb vier')
    expect(timeDe(11, 50)).toBe('zehn vor zwölf')
    expect(timeDe(12, 55)).toBe('fünf vor eins')
    expect(timeDe(1, 10)).toBe('zehn nach eins')
    expect(priceDe(4, 75)).toBe('vier Euro fünfundsiebzig')
    expect(priceDe(1, 50)).toBe('ein Euro fünfzig')
  })

  it('typed answers accept ae/oe/ue/ss spellings but not a missing umlaut', () => {
    let checked = 0
    for (const id of ['german.top.clothes.write', 'german.top.town.write', 'german.top.num.write', 'german.top.home.write']) {
      for (let seed = 1; seed <= 300; seed++) {
        const item = registry.generateWith(id, 3, seed)
        if (item.kind !== 'text') continue
        const canonical = item.accept[0] as string
        if (!/[äöü]/.test(canonical)) continue
        checked++
        const typed = canonical.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
        const bare = canonical.replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u')
        expect(judge(item, { kind: 'text', value: typed }).correct, canonical).toBe(true)
        expect(judge(item, { kind: 'text', value: bare }).correct, canonical).toBe(false)
      }
    }
    expect(checked).toBeGreaterThan(10)
  })

  it('translation choices never list a correct variant as a wrong answer', () => {
    const norm = (x: string) => x.toLowerCase().replace(/[.,!?]/g, '').replace(/\s+/g, ' ').trim()
    const accepted = new Map<string, Set<string>>()
    for (const id of ['german.top.tr.de.type', 'german.top.tr.past.type']) {
      for (let lv = 3; lv <= 5; lv++) {
        for (let seed = 1; seed <= 200; seed++) {
          const item = registry.generateWith(id, lv, seed)
          if (item.kind !== 'text') continue
          const en = item.prompt.match(/"(.*)"/)?.[1] as string
          const set = accepted.get(en) ?? new Set<string>()
          for (const a of item.accept) set.add(norm(a))
          accepted.set(en, set)
        }
      }
    }
    let compared = 0
    for (const id of ['german.top.tr.de.choose', 'german.top.tr.past.to-de']) {
      for (let lv = 1; lv <= 5; lv++) {
        for (let seed = 1; seed <= 200; seed++) {
          let item
          try {
            item = registry.generateWith(id, lv, seed)
          } catch {
            continue
          }
          if (item.kind !== 'choice') continue
          const en = item.prompt.match(/"(.*)"/)?.[1] as string
          const ok = accepted.get(en)
          if (!ok) continue
          compared++
          for (const o of item.options) if (!o.correct) expect(ok.has(norm(o.label)), `${en}: ${o.label}`).toBe(false)
          expect(ok.has(norm(item.options.find((o) => o.correct)?.label ?? '')), en).toBe(true)
        }
      }
    }
    expect(compared).toBeGreaterThan(0)
  })
})
