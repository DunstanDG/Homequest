import type { Skill, SkillId } from './types'

/** Immutable prerequisite graph over a set of skills, with the queries the planner needs. */
export class SkillGraph {
  readonly skills: Map<SkillId, Skill>
  private readonly dependents = new Map<SkillId, SkillId[]>()

  constructor(skills: Skill[]) {
    this.skills = new Map(skills.map((s) => [s.id, s]))
    for (const s of skills) {
      for (const p of s.prereqs) {
        if (!this.skills.has(p)) throw new Error(`Skill ${s.id} has unknown prerequisite ${p}`)
        const list = this.dependents.get(p) ?? []
        list.push(s.id)
        this.dependents.set(p, list)
      }
    }
    this.assertAcyclic()
  }

  get(id: SkillId): Skill {
    const s = this.skills.get(id)
    if (!s) throw new Error(`Unknown skill ${id}`)
    return s
  }
  has(id: SkillId) {
    return this.skills.has(id)
  }
  all(): Skill[] {
    return [...this.skills.values()]
  }
  bySubject(subject: string): Skill[] {
    return this.all().filter((s) => s.subject === subject)
  }
  prereqsOf(id: SkillId): Skill[] {
    return this.get(id).prereqs.map((p) => this.get(p))
  }
  dependentsOf(id: SkillId): Skill[] {
    return (this.dependents.get(id) ?? []).map((d) => this.get(d))
  }

  /** All transitive prerequisites, nearest first (breadth-first), with their depth. */
  ancestors(id: SkillId): { skill: Skill; depth: number }[] {
    const seen = new Set<SkillId>([id])
    const out: { skill: Skill; depth: number }[] = []
    let frontier = [id]
    let depth = 0
    while (frontier.length) {
      depth++
      const next: SkillId[] = []
      for (const f of frontier) {
        for (const p of this.get(f).prereqs) {
          if (seen.has(p)) continue
          seen.add(p)
          out.push({ skill: this.get(p), depth })
          next.push(p)
        }
      }
      frontier = next
    }
    return out
  }

  /** Every skill that (transitively) builds on this one. */
  descendants(id: SkillId): Skill[] {
    const seen = new Set<SkillId>([id])
    const out: Skill[] = []
    const stack = [id]
    while (stack.length) {
      const cur = stack.pop() as SkillId
      for (const d of this.dependents.get(cur) ?? []) {
        if (seen.has(d)) continue
        seen.add(d)
        out.push(this.get(d))
        stack.push(d)
      }
    }
    return out
  }

  /** Topological order: prerequisites always come before dependants. */
  topological(): Skill[] {
    const indeg = new Map<SkillId, number>()
    for (const s of this.skills.values()) indeg.set(s.id, s.prereqs.length)
    const queue = [...this.skills.values()].filter((s) => s.prereqs.length === 0).map((s) => s.id)
    const out: Skill[] = []
    while (queue.length) {
      const id = queue.shift() as SkillId
      out.push(this.get(id))
      for (const d of this.dependents.get(id) ?? []) {
        const n = (indeg.get(d) ?? 0) - 1
        indeg.set(d, n)
        if (n === 0) queue.push(d)
      }
    }
    return out
  }

  private assertAcyclic() {
    if (this.topological().length !== this.skills.size) throw new Error('Skill graph contains a cycle')
  }
}
