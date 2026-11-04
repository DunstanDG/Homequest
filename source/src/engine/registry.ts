import type { Item, ItemBody, Rng, Skill, SkillId, SubjectId } from './types'
import { hashString, makeRng } from './rng'
import { SkillGraph } from './skillGraph'

/** A function that produces one question of a given difficulty from a seeded RNG. */
export interface ItemGenerator {
  /** Stable id, never reuse. e.g. 'maths.bidmas.brackets'. Appears in feedback reports. */
  id: string
  skillId: SkillId
  /** Inclusive difficulty range (1..5) this generator can produce. */
  levels: [number, number]
  generate(rng: Rng, difficulty: number): ItemBody
}

/** Everything a subject contributes: its skill graph + its content. */
export interface SubjectPack {
  id: SubjectId
  name: string
  tagline: string
  /** CSS colour used for the subject accent. */
  color: string
  skills: Skill[]
  generators: ItemGenerator[]
  /** Bump when content changes so feedback can be tied to a version. */
  version: string
}

export const itemId = (generatorId: string, difficulty: number, seed: number) => `${generatorId}@${difficulty}#${seed}`

export function parseItemId(id: string): { generatorId: string; difficulty: number; seed: number } | null {
  const m = /^(.+)@(\d)#(\d+)$/.exec(id)
  if (!m) return null
  return { generatorId: m[1] as string, difficulty: Number(m[2]), seed: Number(m[3]) }
}

/** All registered subject packs, merged into one graph. Cross-subject prerequisites are allowed. */
export class Registry {
  readonly packs: Map<SubjectId, SubjectPack>
  readonly graph: SkillGraph
  private readonly gensBySkill = new Map<SkillId, ItemGenerator[]>()
  private readonly gensById = new Map<string, ItemGenerator>()
  /** Generators that produce written, self-marked questions (kind 'reveal'): too slow for a timed game or a quick
   * check, so `makeItem(..., { quick: true })` leaves them out. Found by building one sample of each. */
  private readonly slow = new Set<string>()

  constructor(packs: SubjectPack[]) {
    this.packs = new Map(packs.map((p) => [p.id, p]))
    this.graph = new SkillGraph(packs.flatMap((p) => p.skills))
    for (const p of packs) {
      for (const g of p.generators) {
        if (!this.graph.has(g.skillId)) throw new Error(`Generator ${g.id} targets unknown skill ${g.skillId}`)
        if (this.gensById.has(g.id)) throw new Error(`Duplicate generator id ${g.id}`)
        this.gensById.set(g.id, g)
        this.gensBySkill.set(g.skillId, [...(this.gensBySkill.get(g.skillId) ?? []), g])
        if (g.generate(makeRng(1), g.levels[0]).kind === 'reveal') this.slow.add(g.id)
      }
    }
  }

  pack(subject: SubjectId): SubjectPack {
    const p = this.packs.get(subject)
    if (!p) throw new Error(`Unknown subject ${subject}`)
    return p
  }
  version(subject: SubjectId): string {
    return this.packs.get(subject)?.version ?? '0'
  }
  hasContent = (skillId: SkillId): boolean => (this.gensBySkill.get(skillId)?.length ?? 0) > 0
  generatorsFor(skillId: SkillId): ItemGenerator[] {
    return this.gensBySkill.get(skillId) ?? []
  }
  generator(id: string): ItemGenerator | undefined {
    return this.gensById.get(id)
  }

  /** Difficulty range that has content for this skill. */
  levelRange(skillId: SkillId): [number, number] | undefined {
    const gens = this.generatorsFor(skillId)
    if (!gens.length) return undefined
    return [Math.min(...gens.map((g) => g.levels[0])), Math.max(...gens.map((g) => g.levels[1]))]
  }

  isSlow = (generatorId: string): boolean => this.slow.has(generatorId)

  /** Build an item for a skill at (roughly) a difficulty. Deterministic in `seed`. `quick` leaves out written,
   * self-marked questions (timed games, the gap finder, falling-question games) unless they're all the skill has. */
  makeItem(skillId: SkillId, difficulty: number, seed: number, opts: { quick?: boolean } = {}): Item {
    const all = this.generatorsFor(skillId)
    const fast = opts.quick ? all.filter((g) => !this.slow.has(g.id)) : all
    const gens = fast.length ? fast : all
    if (!gens.length) throw new Error(`No content for skill ${skillId}`)
    const [lo, hi] = this.levelRange(skillId) as [number, number]
    const d = Math.min(hi, Math.max(lo, Math.round(difficulty)))
    let fit = gens.filter((g) => d >= g.levels[0] && d <= g.levels[1])
    if (!fit.length) fit = gens
    const g = fit[hashString(`${seed}:${skillId}`) % fit.length] as ItemGenerator
    return this.generateWith(g.id, d, seed)
  }

  /** Reproduce an exact item from its id parts (used by feedback triage). */
  generateWith(generatorId: string, difficulty: number, seed: number): Item {
    const g = this.gensById.get(generatorId)
    if (!g) throw new Error(`Unknown generator ${generatorId}`)
    const body = g.generate(makeRng(seed), difficulty)
    const skill = this.graph.get(g.skillId)
    return {
      ...body,
      id: itemId(g.id, difficulty, seed),
      skillId: g.skillId,
      subject: skill.subject,
      difficulty,
      generatorId: g.id,
      seed,
    } as Item
  }
}
