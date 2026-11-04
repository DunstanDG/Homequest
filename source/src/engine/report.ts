import type { LearnerState, Skill, SkillId, SkillStats, SubjectId } from './types'
import type { Registry } from './registry'
import { DAY_MS, TIER_LABEL, isDue, mastery, tier, type Tier } from './mastery'
import { dayOf } from './events'
import { diagnoseGaps, type GapFinding } from './planner'
import { levelFromXp } from './points'

/** Read-only derived views used by the parent dashboard and the shareable summary. Pure functions. */

export interface SkillRow {
  skill: Skill
  stats?: SkillStats
  tier: Tier
  /** 0..1 chance of a standard question right today (0 when never seen). */
  mastery: number
  due: boolean
  notTaught: boolean
  hasContent: boolean
}

export function skillRows(state: LearnerState, registry: Registry, now: number, subject?: SubjectId): SkillRow[] {
  return registry.graph
    .all()
    .filter((s) => !subject || s.subject === subject)
    .map((skill) => {
      const stats = state.skills[skill.id]
      return {
        skill,
        stats,
        tier: tier(stats, now),
        mastery: stats && (stats.n > 0 || stats.inferredFloor > 0) ? mastery(stats, now) : 0,
        due: isDue(stats, now),
        notTaught: !!stats?.notTaught,
        hasContent: registry.hasContent(skill.id),
      }
    })
}

export interface StrandProgress {
  strand: string
  total: number
  tiers: Record<Tier, number>
  /** Average mastery over skills that have been started (0 if none). */
  avgMastery: number
}

/** Progress per strand for one school year (syllabus skills only by default; foundations via includeFoundations). */
export function strandProgress(rows: SkillRow[], opts: { years?: number[]; includeFoundations?: boolean } = {}): StrandProgress[] {
  const by = new Map<string, SkillRow[]>()
  for (const r of rows) {
    if (!r.hasContent) continue
    if (!opts.includeFoundations && r.skill.origin === 'foundation') continue
    if (opts.years && !opts.years.includes(r.skill.year)) continue
    by.set(r.skill.strand, [...(by.get(r.skill.strand) ?? []), r])
  }
  return [...by.entries()].map(([strand, rs]) => {
    const tiers: Record<Tier, number> = { new: 0, learning: 0, developing: 0, secure: 0, mastered: 0 }
    for (const r of rs) tiers[r.tier]++
    const started = rs.filter((r) => r.tier !== 'new')
    return { strand, total: rs.length, tiers, avgMastery: started.length ? started.reduce((a, r) => a + r.mastery, 0) / started.length : 0 }
  })
}

export interface DayStat {
  day: string
  xp: number
  attempts: number
}
export interface WeekStats {
  days: DayStat[]
  xp: number
  attempts: number
  activeDays: number
}

/** Last `n` calendar days ending on `now` (oldest first). */
export function lastDays(state: LearnerState, now: number, n = 7): WeekStats {
  const days: DayStat[] = []
  for (let i = n - 1; i >= 0; i--) {
    const day = dayOf(now - i * DAY_MS)
    days.push({ day, xp: state.xpByDay[day] ?? 0, attempts: state.attemptsByDay[day] ?? 0 })
  }
  return { days, xp: days.reduce((a, d) => a + d.xp, 0), attempts: days.reduce((a, d) => a + d.attempts, 0), activeDays: days.filter((d) => d.attempts > 0).length }
}

export interface Gap extends GapFinding {
  skill: Skill
  forNames: string[]
}
export function gapsWithNames(state: LearnerState, registry: Registry, now: number, subject?: SubjectId): Gap[] {
  return diagnoseGaps(state, registry.graph, { subject, now, hasContent: registry.hasContent }).map((g) => ({
    ...g,
    skill: registry.graph.get(g.skillId),
    forNames: g.forSkills.map((id) => registry.graph.get(id).name),
  }))
}

export interface MisconceptionCount {
  tag: string
  count: number
  skills: SkillId[]
}
export function topMisconceptions(state: LearnerState, limit = 5): MisconceptionCount[] {
  const map = new Map<string, MisconceptionCount>()
  for (const s of Object.values(state.skills)) {
    for (const [tag, count] of Object.entries(s.misconceptions)) {
      const cur = map.get(tag) ?? { tag, count: 0, skills: [] }
      cur.count += count
      cur.skills.push(s.skillId)
      map.set(tag, cur)
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, limit)
}

const nice = (tag: string) => tag.replace(/-/g, ' ')
const list = (xs: string[]) => (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)

/** Plain-text summary a parent can paste into a message. */
export function progressSummary(state: LearnerState, registry: Registry, now: number, opts: { subject?: SubjectId } = {}): string {
  const week = lastDays(state, now, 7)
  const lv = levelFromXp(state.xp)
  const rows = skillRows(state, registry, now, opts.subject)
  const started = rows.filter((r) => r.tier !== 'new' && r.hasContent)
  const secure = started.filter((r) => r.tier === 'secure' || r.tier === 'mastered')
  const gaps = gapsWithNames(state, registry, now, opts.subject).filter((g) => g.status !== 'unchecked' || g.forSkills.length > 1).slice(0, 4)
  const notTaught = rows.filter((r) => r.notTaught).map((r) => r.skill.name)
  const open = Object.values(state.feedback).filter((f) => f.status === 'open').length
  const lines: string[] = []
  lines.push(`${state.name}'s StudyQuest week (to ${dayOf(now)})`)
  lines.push(`• ${week.activeDays} of 7 days practised, ${week.attempts} questions, ${week.xp} XP (level ${lv.level}, ${state.xp} XP total)`)
  lines.push(`• Streak: ${state.streak.current} day${state.streak.current === 1 ? '' : 's'} (best ${state.streak.best})`)
  lines.push(`• ${secure.length} topic${secure.length === 1 ? '' : 's'} secure or mastered, ${started.length} started`)
  if (gaps.length) lines.push(`• Worth revisiting: ${list(gaps.map((g) => g.skill.name))}`)
  const mis = topMisconceptions(state, 2)
  if (mis.length) lines.push(`• Common slips: ${list(mis.map((m) => `${nice(m.tag)} (${m.count})`))}`)
  if (notTaught.length) lines.push(`• Flagged "not covered in class yet": ${list(notTaught)}`)
  if (open) lines.push(`• ${open} question report${open === 1 ? '' : 's'} waiting for you`)
  return lines.join('\n')
}

const CATEGORY_LABEL: Record<string, string> = {
  bug: "Doesn't work",
  confusing: "Doesn't make sense",
  'not-taught': 'Not covered in class',
  'too-hard': 'Too hard',
  'too-easy': 'Too easy',
  other: 'Something else',
}
export const categoryLabel = (c: string) => CATEGORY_LABEL[c] ?? c

/**
 * Open question reports as Markdown, each with its reproducible item id
 * (generatorId@difficulty#seed). Paste into a chat or a ticket: whoever fixes the content can
 * regenerate the exact question with `registry.generateWith(...)` or `npm run triage`.
 */
export function feedbackMarkdown(state: LearnerState, registry: Registry, opts: { includeResolved?: boolean } = {}): string {
  const list = Object.values(state.feedback)
    .filter((f) => opts.includeResolved || f.status === 'open')
    .sort((a, b) => a.item.generatorId.localeCompare(b.item.generatorId) || a.ts - b.ts)
  if (!list.length) return 'No open question reports.'
  const lines = [`# Question reports (${list.length})`, '']
  for (const f of list) {
    const skill = registry.graph.has(f.skillId) ? registry.graph.get(f.skillId).name : f.skillId
    lines.push(`## ${categoryLabel(f.category)} - ${skill}`)
    lines.push(`- Item: \`${f.item.itemId}\` (generator ${f.item.generatorId}, difficulty ${f.item.difficulty}, seed ${f.item.seed})`)
    lines.push(`- Question: ${f.snapshot.prompt}`)
    lines.push(`- Expected: ${f.snapshot.expected}${f.snapshot.given ? ` | She answered: ${f.snapshot.given}` : ''}`)
    if (f.note) lines.push(`- Her note: ${f.note}`)
    if (f.status !== 'open') lines.push(`- Status: ${f.status}${f.resolutionNote ? ` - ${f.resolutionNote}` : ''}`)
    lines.push('')
  }
  return lines.join('\n')
}

export { TIER_LABEL }
