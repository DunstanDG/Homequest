import { execFileSync, spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { makeRng } from '@/engine/rng'
import { Registry } from '@/engine/registry'
import { auditRegistry } from '../quality'
import { PSEUDO } from './gen.ct'
import type { Program } from './helpers'
import { computingPack } from './pack'
import { PROGRAM_BUILDERS } from './programs'

const registry = new Registry([computingPack])

const hasPython = (() => {
  try {
    return spawnSync('python3', ['--version']).status === 0
  } catch {
    return false
  }
})()

/** Run many programs through one Python process; returns each program's printed lines (or an error marker). */
function runPython(programs: { code: string; stdin: string[] }[]): string[][] {
  const script = `
import sys, io, json, contextlib
progs = json.loads(sys.stdin.read())
out = []
for p in progs:
    feed = iter(p["stdin"])
    buf = io.StringIO()
    env = {"input": lambda prompt="": next(feed)}
    try:
        with contextlib.redirect_stdout(buf):
            exec(p["code"], env)
        out.append(buf.getvalue().split("\\n")[:-1])
    except Exception as e:
        out.append(["ERROR: " + type(e).__name__])
print(json.dumps(out))
`
  const res = execFileSync('python3', ['-c', script], { input: JSON.stringify(programs), maxBuffer: 64 * 1024 * 1024 })
  return JSON.parse(res.toString()) as string[][]
}

describe('computing pack', () => {
  it('has a valid skill graph, 45-70 skills, and content for every skill', () => {
    const skills = registry.graph.all()
    expect(skills.length).toBeGreaterThanOrEqual(45)
    expect(skills.length).toBeLessThanOrEqual(70)
    for (const s of skills) expect(registry.hasContent(s.id), s.id).toBe(true)
    for (const s of computingPack.skills) {
      expect(s.id.startsWith('computing.')).toBe(true)
      for (const p of s.prereqs) expect(p.startsWith('computing.'), `${s.id} -> ${p}`).toBe(true)
    }
  })

  it('every skill can serve levels 2-4 with auto-marked questions', () => {
    const gaps: string[] = []
    for (const s of computingPack.skills) {
      const gens = computingPack.generators.filter((g) => g.skillId === s.id && g.generate(makeRng(1), g.levels[0]).kind !== 'reveal')
      for (const lv of [2, 3, 4]) if (!gens.some((g) => g.levels[0] <= lv && lv <= g.levels[1])) gaps.push(`${s.id} L${lv}`)
    }
    expect(gaps).toEqual([])
  })

  it('every skill yields at least 8 different questions', () => {
    const thin: string[] = []
    for (const s of computingPack.skills) {
      const seen = new Set<string>()
      for (const g of computingPack.generators.filter((x) => x.skillId === s.id)) {
        for (let lv = g.levels[0]; lv <= g.levels[1]; lv++) for (let seed = 1; seed <= 40; seed++) {
          const it = registry.generateWith(g.id, lv, seed)
          seen.add(JSON.stringify([it.prompt, it.figure ?? null]))
        }
      }
      if (seen.size < 8) thin.push(`${s.id}: ${seen.size}`)
    }
    expect(thin).toEqual([])
  })

  it('generators pass the quality audit', () => {
    const rows = auditRegistry(registry, 60)
    expect(rows.map((r) => `${r.generatorId} L${r.level}: ${r.problem} <- ${r.prompt}`).slice(0, 10)).toEqual([])
  })

  it('Python semantics used by the generators are right (spot checks)', () => {
    // range() excludes its end; randint-style counting; // floors; / gives a float.
    const p = PROGRAM_BUILDERS.forPrint!(makeRng(3), 2)
    expect(p.output.length).toBeGreaterThan(0)
    const vals = p.output.map(Number)
    for (let i = 1; i < vals.length; i++) expect(vals[i]! - vals[i - 1]!).toBe(1)
  })

  it.skipIf(!hasPython)('generated Python programs print exactly what the questions expect', () => {
    const cases: { name: string; d: number; seed: number; p: Program }[] = []
    for (const [name, build] of Object.entries(PROGRAM_BUILDERS)) {
      for (let d = 1; d <= 5; d++) for (let seed = 1; seed <= 60; seed++) cases.push({ name, d, seed, p: build(makeRng(seed * 31 + d), d) })
    }
    const outputs = runPython(cases.map((c) => ({ code: c.p.code, stdin: c.p.stdin ?? [] })))
    const bad: string[] = []
    cases.forEach((c, i) => {
      const got = outputs[i] ?? []
      if (JSON.stringify(got) !== JSON.stringify(c.p.output)) bad.push(`${c.name} d${c.d} s${c.seed}: expected ${JSON.stringify(c.p.output)} got ${JSON.stringify(got)}\n${c.p.code}`)
    })
    expect(bad.slice(0, 5)).toEqual([])
  })

  it.skipIf(!hasPython)('pseudocode programs match their Python equivalents', () => {
    const cases: { name: string; p: (typeof PSEUDO)[string] extends (...a: never[]) => infer R ? R : never }[] = []
    for (const [name, build] of Object.entries(PSEUDO)) for (let d = 1; d <= 5; d++) for (let seed = 1; seed <= 40; seed++) cases.push({ name, p: build(makeRng(seed * 17 + d), d) })
    const outputs = runPython(cases.map((c) => ({ code: c.p.python, stdin: [] })))
    const bad = cases.filter((c, i) => JSON.stringify(outputs[i]) !== JSON.stringify(c.p.output)).map((c) => `${c.name}: ${c.p.output.join('|')} vs python\n${c.p.python}`)
    expect(bad.slice(0, 5)).toEqual([])
  })
})
