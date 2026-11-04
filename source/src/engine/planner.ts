import type { LearnerState, PlanCategory, Rng, SessionMode, Skill, SkillId, SkillStats, SubjectId } from './types'
import { clamp, difficultyForP, effectiveTheta, isDue, mastery, newSkillStats, recentAccuracy, retrievability, DAY_MS } from './mastery'
import type { Registry } from './registry'
import type { SkillGraph } from './skillGraph'

/**
 * THE PLANNER - decides what to ask next.
 *
 * Every question comes from one of these sources:
 *   frontier   - a topic from her current year, weakest / least-practised first
 *   review     - a topic whose memory has faded enough that it is worth revisiting
 *   gap-probe  - a *building block* (usually an earlier year) underneath a topic she is struggling with
 *   diagnostic - Gap Finder: a short staircase of questions per skill, stepping back through prerequisites on failure
 *   focus      - a specific skill she or a parent chose
 *   fluency    - Sprint: easier questions for speed
 *
 * Difficulty is chosen per skill so she is right ~70% of the time (hard enough to
 * learn from, not so hard she gives up). That is what "scales the challenge" means.
 */

export interface PlannerCtx {
  subject: SubjectId
  mode: SessionMode
  now: number
  rng: Rng
  registry: Registry
  /** Her school year - which skills count as the "frontier". */
  year: number
  focusSkills?: SkillId[]
  history: { skillId: SkillId; correct: boolean; category: PlanCategory }[]
  diag?: DiagState
}

export interface Planned {
  skillId: SkillId
  difficulty: number
  category: PlanCategory
  /** Short, kid-friendly explanation of why this question was chosen. */
  reason: string
  /** For gap probes: the topic she was struggling with. */
  forSkillId?: SkillId
}

// ----------------------------------------------------------------------- gaps

export interface GapFinding {
  /** The skill to check or strengthen. */
  skillId: SkillId
  /**
   * weak      - we have evidence she finds this hard
   * unchecked - we have no evidence yet (never practised, nothing inferred)
   * self      - the building blocks look fine, so the topic itself needs teaching/explaining
   */
  status: 'weak' | 'unchecked' | 'self'
  /** The struggling skills that depend on it. */
  forSkills: SkillId[]
  depth: number
}

type PrereqStatus = 'ok' | 'weak' | 'unchecked'

export function prereqStatus(st: SkillStats | undefined, now: number): PrereqStatus {
  const s = st ?? newSkillStats('')
  if (s.n >= 2) return mastery(s, now) >= 0.5 ? 'ok' : 'weak'
  if (s.inferredFloor >= 2.9) return 'ok'
  return 'unchecked'
}

export function isStruggling(st: SkillStats | undefined, now: number): boolean {
  if (!st || st.n < 3 || st.notTaught) return false
  const acc = recentAccuracy(st, 5)
  return (acc !== undefined && acc <= 0.5) || (st.n >= 5 && mastery(st, now) < 0.4)
}

export function diagnoseGaps(
  state: LearnerState,
  graph: SkillGraph,
  opts: { subject?: SubjectId; now: number; hasContent: (id: SkillId) => boolean },
): GapFinding[] {
  const { now } = opts
  const found = new Map<SkillId, GapFinding>()
  const put = (skillId: SkillId, status: GapFinding['status'], forSkill: SkillId, depth: number) => {
    const cur = found.get(skillId)
    if (cur) {
      if (!cur.forSkills.includes(forSkill)) cur.forSkills.push(forSkill)
      cur.depth = Math.min(cur.depth, depth)
    } else found.set(skillId, { skillId, status, forSkills: [forSkill], depth })
  }

  const walk = (id: SkillId, forSkill: SkillId, depth: number, seen: Set<SkillId>): void => {
    const prereqs = graph.get(id).prereqs.filter((p) => opts.hasContent(p) || graph.get(p).prereqs.length > 0)
    const bad = prereqs.filter((p) => prereqStatus(state.skills[p], now) !== 'ok' && !state.skills[p]?.notTaught)
    if (bad.length === 0) {
      put(id, 'self', forSkill, depth)
      return
    }
    for (const p of bad) {
      if (seen.has(p)) continue
      seen.add(p)
      const status = prereqStatus(state.skills[p], now)
      if (status === 'unchecked') {
        if (opts.hasContent(p)) put(p, 'unchecked', forSkill, depth + 1)
        else walk(p, forSkill, depth + 1, seen) // can't test it - look one level further down
      } else {
        // weak: is the reason further down?
        const deeper = graph
          .get(p)
          .prereqs.filter((q) => prereqStatus(state.skills[q], now) !== 'ok' && !state.skills[q]?.notTaught)
        if (deeper.length === 0) put(p, 'weak', forSkill, depth + 1)
        else walk(p, forSkill, depth + 1, seen)
      }
    }
  }

  for (const skill of graph.all()) {
    if (opts.subject && skill.subject !== opts.subject) continue
    if (!isStruggling(state.skills[skill.id], now)) continue
    walk(skill.id, skill.id, 0, new Set([skill.id]))
  }

  const rank = { weak: 0, unchecked: 1, self: 2 } as const
  return [...found.values()].sort(
    (a, b) => rank[a.status] - rank[b.status] || b.forSkills.length - a.forSkills.length || a.depth - b.depth,
  )
}

// ----------------------------------------------------------------- difficulty

export function chooseDifficulty(stats: SkillStats | undefined, category: PlanCategory, ctx: Pick<PlannerCtx, 'now' | 'rng'>): number {
  const st = stats ?? newSkillStats('')
  let d = difficultyForP(effectiveTheta(st, ctx.now)) + (ctx.rng.next() - 0.5)
  if (category === 'fluency') d -= 0.8
  return clamp(Math.round(d), 1, 5)
}

// ------------------------------------------------------------------ selection

function available(state: LearnerState, ctx: PlannerCtx): Skill[] {
  return ctx.registry.graph
    .bySubject(ctx.subject)
    .filter((s) => ctx.registry.hasContent(s.id) && !state.skills[s.id]?.notTaught)
}

function weightedPick<T>(rng: Rng, items: { item: T; w: number }[]): T {
  const total = items.reduce((s, i) => s + i.w, 0)
  let r = rng.next() * total
  for (const i of items) {
    r -= i.w
    if (r <= 0) return i.item
  }
  return (items[items.length - 1] as { item: T }).item
}

function recentSkills(ctx: PlannerCtx, n = 2): SkillId[] {
  return ctx.history.slice(-n).map((h) => h.skillId)
}

/**
 * Sprint is about speed on things she already knows, so it draws from topics she has shown some skill in.
 * A brand-new learner has none, so it falls back to the earlier-year building blocks instead of throwing
 * Year 8 algebra at her against a clock.
 */
function sprintPool(state: LearnerState, avail: Skill[], ctx: PlannerCtx): Skill[] {
  const known = avail.filter((s) => {
    const st = state.skills[s.id]
    return !!st && st.n >= 2 && mastery(st, ctx.now) >= 0.55
  })
  if (known.length >= 4) return known
  const earlier = avail.filter((s) => s.year < ctx.year)
  const merged = [...new Set([...known, ...earlier])]
  return merged.length >= 4 ? merged : avail
}

function pickFrontier(state: LearnerState, ctx: PlannerCtx, pool: Skill[]): Skill {
  const avoid = new Set(recentSkills(ctx))
  const candidates = pool.filter((s) => !avoid.has(s.id))
  const list = candidates.length ? candidates : pool
  const scored = list.map((s) => {
    const st = state.skills[s.id]
    const m = st ? mastery(st, ctx.now) : 0.32
    const stale = st?.lastTs ? Math.min(1, (ctx.now - st.lastTs) / (7 * DAY_MS)) : 0
    return { item: s, w: 0.05 + (1 - m) + (st && st.n > 0 ? 0 : 0.4) + stale * 0.3 }
  })
  // Square the weights so weak topics come up clearly more often, but everything still appears.
  return weightedPick(ctx.rng, scored.map((s) => ({ item: s.item, w: s.w * s.w })))
}

const yearLabel = (s: Skill) => (s.year < 7 ? `Year ${s.year} building block` : `Year ${s.year}`)

export function planNext(state: LearnerState, ctx: PlannerCtx): Planned | null {
  if (ctx.mode === 'diagnostic') return planDiagnostic(state, ctx)
  const avail = available(state, ctx)
  if (avail.length === 0) return null

  if (ctx.mode === 'focus' && ctx.focusSkills?.length) {
    const pool = avail.filter((s) => ctx.focusSkills?.includes(s.id))
    if (pool.length) {
      const s = pickFrontier(state, ctx, pool)
      return {
        skillId: s.id,
        category: 'focus',
        difficulty: chooseDifficulty(state.skills[s.id], 'focus', ctx),
        reason: `Focus: ${s.name}`,
      }
    }
  }

  const now = ctx.now
  const due = avail
    .filter((s) => isDue(state.skills[s.id], now))
    .sort((a, b) => retrievability(state.skills[a.id] as SkillStats, now) - retrievability(state.skills[b.id] as SkillStats, now))
  const gaps =
    ctx.mode === 'sprint'
      ? []
      : diagnoseGaps(state, ctx.registry.graph, { subject: ctx.subject, now, hasContent: ctx.registry.hasContent }).filter((g) => g.status !== 'self')
  const yearPool = avail.filter((s) => s.year === ctx.year)
  const frontierPool = ctx.mode === 'sprint' ? sprintPool(state, avail, ctx) : yearPool.length ? yearPool : avail

  const options: { item: PlanCategory; w: number }[] = []
  if (ctx.mode === 'review') {
    if (due.length) options.push({ item: 'review', w: 1 })
    else options.push({ item: 'frontier', w: 1 })
  } else {
    if (due.length) options.push({ item: 'review', w: 0.3 })
    if (gaps.length) options.push({ item: 'gap-probe', w: 0.25 })
    options.push({ item: 'frontier', w: 0.45 })
  }
  const category = weightedPick(ctx.rng, options)

  if (category === 'review') {
    const avoid = new Set(recentSkills(ctx))
    const list = due.filter((s) => !avoid.has(s.id))
    const s = (list.length ? list : due)[Math.min(ctx.rng.int(0, 2), (list.length ? list : due).length - 1)] as Skill
    const days = Math.max(1, Math.round((now - (state.skills[s.id]?.lastTs ?? now)) / DAY_MS))
    return {
      skillId: s.id,
      category: 'review',
      difficulty: chooseDifficulty(state.skills[s.id], 'review', ctx),
      reason: `Revision: ${s.name} (last practised ${days} day${days === 1 ? '' : 's'} ago)`,
    }
  }

  if (category === 'gap-probe') {
    const top = gaps.slice(0, 3)
    const avoid = new Set(recentSkills(ctx))
    const list = top.filter((g) => !avoid.has(g.skillId))
    const g = ctx.rng.pick(list.length ? list : top)
    const s = ctx.registry.graph.get(g.skillId)
    const forName = ctx.registry.graph.get(g.forSkills[0] as SkillId).name
    return {
      skillId: g.skillId,
      category: 'gap-probe',
      difficulty: chooseDifficulty(state.skills[g.skillId], 'gap-probe', ctx),
      forSkillId: g.forSkills[0],
      reason:
        g.status === 'unchecked'
          ? `Building-block check: ${s.name} sits under ${forName}`
          : `Strengthening: ${s.name} will help with ${forName}`,
    }
  }

  const cat: PlanCategory = ctx.mode === 'sprint' ? 'fluency' : 'frontier'
  const s = pickFrontier(state, ctx, frontierPool)
  return {
    skillId: s.id,
    category: cat,
    difficulty: chooseDifficulty(state.skills[s.id], cat, ctx),
    reason: `${yearLabel(s)}: ${s.name}`,
  }
}

// ------------------------------------------------------------------ diagnostic

export interface DiagState {
  queue: SkillId[]
  probes: SkillId[]
  results: Record<SkillId, boolean[]>
  current?: SkillId
  finished: SkillId[]
  origin: Record<SkillId, SkillId>
  /** Skills found to be weak in this run, in the order found. */
  weak: SkillId[]
  strong: SkillId[]
}

export function initDiagnostic(state: LearnerState, ctx: Omit<PlannerCtx, 'diag'>): DiagState {
  const pool = available(state, { ...ctx, diag: undefined } as PlannerCtx).filter((s) =>
    ctx.focusSkills?.length ? ctx.focusSkills.includes(s.id) : s.year === ctx.year,
  )
  // Interleave strands so a short run still covers a spread of topics.
  const byStrand = new Map<string, SkillId[]>()
  for (const s of ctx.rng.shuffle(pool)) byStrand.set(s.strand, [...(byStrand.get(s.strand) ?? []), s.id])
  const queue: SkillId[] = []
  for (let i = 0; queue.length < pool.length; i++) {
    for (const ids of byStrand.values()) if (ids[i]) queue.push(ids[i] as SkillId)
  }
  return { queue, probes: [], results: {}, finished: [], origin: {}, weak: [], strong: [] }
}

function diagPass(r: boolean[]): boolean {
  return r.filter(Boolean).length >= 2 || (r.length === 1 && r[0] === true)
}

function completeDiag(state: LearnerState, ctx: PlannerCtx, d: DiagState, id: SkillId) {
  d.finished.push(id)
  const r = d.results[id] ?? []
  d.current = undefined
  if (diagPass(r)) {
    d.strong.push(id)
    return
  }
  d.weak.push(id)
  // Step back: queue the building blocks we have not already verified.
  const add = ctx.registry.graph
    .get(id)
    .prereqs.filter(
      (p) =>
        ctx.registry.hasContent(p) &&
        !state.skills[p]?.notTaught &&
        !d.finished.includes(p) &&
        !d.probes.includes(p) &&
        !d.queue.includes(p) &&
        prereqStatus(state.skills[p], ctx.now) !== 'ok',
    )
    .slice(0, 3)
  for (const p of add) d.origin[p] = id
  d.probes.unshift(...add)
}

export function planDiagnostic(state: LearnerState, ctx: PlannerCtx): Planned | null {
  const d = ctx.diag
  if (!d) return null
  if (d.current) {
    const r = d.results[d.current] ?? []
    if (r.length >= 3 || (r.length === 2 && r[0] === r[1])) completeDiag(state, ctx, d, d.current)
  }
  if (!d.current) {
    const next = d.probes.shift() ?? d.queue.shift()
    if (!next) return null
    d.current = next
    d.results[next] = []
  }
  const id = d.current as SkillId
  const r = d.results[id] as boolean[]
  const difficulty = r.length === 0 ? 3 : r.length === 1 ? (r[0] ? 4 : 2) : 3
  const skill = ctx.registry.graph.get(id)
  const origin = d.origin[id]
  return {
    skillId: id,
    difficulty,
    category: 'diagnostic',
    forSkillId: origin,
    reason: origin
      ? `Stepping back: checking ${skill.name}, a building block for ${ctx.registry.graph.get(origin).name}`
      : `Gap Finder: ${skill.name}`,
  }
}

/** Call after each answer so the planner can adapt (only matters for diagnostic mode). */
export function observe(ctx: PlannerCtx, planned: Planned, correct: boolean, attemptNo: 1 | 2 = 1) {
  ctx.history.push({ skillId: planned.skillId, correct, category: planned.category })
  if (ctx.diag && attemptNo === 1) {
    const arr = (ctx.diag.results[planned.skillId] ??= [])
    arr.push(correct)
  }
}

/** Finish any half-done diagnostic skill so summaries include it. */
export function finaliseDiagnostic(state: LearnerState, ctx: PlannerCtx) {
  const d = ctx.diag
  if (!d?.current) return
  const r = d.results[d.current] ?? []
  if (r.length >= 1) completeDiag(state, ctx, d, d.current)
}
