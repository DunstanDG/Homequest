/**
 * Feedback triage:  npm run triage -- path/to/backup.json [--all] [--out=triage.md]
 *
 * Turns her question reports into a work list for whoever maintains the content.
 * Input can be a backup file from Parent area > Sync & data > Export, or a plain JSON array of events.
 *
 * For every report it regenerates the EXACT question from its id (generator + difficulty + seed),
 * checks it against the current content, and groups the findings by generator so one fix clears many reports.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { registry } from '../src/content'
import { project } from '../src/engine/events'
import { judge, plainText, solutionFor } from '../src/engine/judge'
import { categoryLabel } from '../src/engine/report'
import type { AppEvent, FeedbackRecord, Item } from '../src/engine/types'
import { parseBackup } from '../src/storage/backup'

const args = process.argv.slice(2)
const file = args.find((a) => !a.startsWith('--'))
const includeAll = args.includes('--all')
const out = args.find((a) => a.startsWith('--out='))?.split('=')[1]

if (!file) {
  console.error('Usage: npm run triage -- <backup.json> [--all] [--out=triage.md]')
  process.exit(1)
}

function loadEvents(path: string): AppEvent[] {
  const text = readFileSync(path, 'utf8')
  const parsed = parseBackup(text)
  if (parsed.ok) return parsed.backup.events
  const raw = JSON.parse(text) as unknown
  if (Array.isArray(raw)) return raw.map((r) => ((r as { body?: AppEvent }).body ?? r) as AppEvent)
  throw new Error(parsed.error)
}

const events = loadEvents(file)
const learnerId = events[0]?.learnerId ?? 'unknown'
const state = project(learnerId, events, registry.graph)
const reports = Object.values(state.feedback)
  .filter((f) => includeAll || f.status === 'open')
  .sort((a, b) => a.item.generatorId.localeCompare(b.item.generatorId) || a.ts - b.ts)

interface Finding {
  report: FeedbackRecord
  item?: Item
  notes: string[]
}

function inspect(f: FeedbackRecord): Finding {
  const notes: string[] = []
  let item: Item | undefined
  try {
    item = registry.generateWith(f.item.generatorId, f.item.difficulty, f.item.seed)
  } catch (e) {
    notes.push(`Cannot regenerate: ${e instanceof Error ? e.message : String(e)} (generator removed or renamed?)`)
    return { report: f, notes }
  }

  const nowPrompt = plainText(item.prompt)
  if (nowPrompt !== f.snapshot.prompt) notes.push('Content has CHANGED since this report: the same seed now produces different wording. It may already be fixed.')
  const sol = judge(item, solutionFor(item))
  if (!sol.correct) notes.push('BUG: the stored solution is marked wrong by the judge.')
  if (sol.expected !== f.snapshot.expected) notes.push(`Expected answer differs now: "${f.snapshot.expected}" -> "${sol.expected}".`)

  // Would her answer be accepted today? (Only where the answer is a single simple value.)
  if (f.snapshot.given) {
    try {
      let now: ReturnType<typeof judge> | undefined
      if (item.kind === 'numeric' && item.fields.length === 1 && !item.template) now = judge(item, { kind: 'numeric', values: [f.snapshot.given] })
      else if (item.kind === 'expr') now = judge(item, { kind: 'expr', value: f.snapshot.given })
      else if (item.kind === 'text') now = judge(item, { kind: 'text', value: f.snapshot.given })
      if (now?.correct) notes.push(`Her answer "${f.snapshot.given}" IS accepted by the current judge - check whether a fix has already gone in.`)
      else if (now && !now.unparseable && f.category === 'bug') notes.push(`Her answer "${f.snapshot.given}" is still marked wrong. If it is actually right, widen the judge/tolerance for this generator.`)
    } catch {
      /* answer shape didn't fit; skip */
    }
  }

  if (f.category === 'too-hard' || f.category === 'too-easy') {
    const gens = registry.generatorsFor(f.skillId)
    const range = registry.levelRange(f.skillId)
    notes.push(`Difficulty check: she saw level ${f.item.difficulty}; this skill's levels span ${range ? `${range[0]}-${range[1]}` : 'n/a'} across ${gens.length} generator(s). Compare with her ability on this skill before changing anything.`)
  }
  if (f.category === 'not-taught') notes.push('Not a content bug. Confirm with the school what has been covered, then use Parent area > Topics.')
  const skillStats = state.skills[f.skillId]
  if (skillStats && skillStats.n > 0) notes.push(`Her level on this skill: ability ${skillStats.theta.toFixed(1)}/5 after ${skillStats.n} first-try answers.`)
  return { report: f, item, notes }
}

const findings = reports.map(inspect)
const byGen = new Map<string, Finding[]>()
for (const f of findings) byGen.set(f.report.item.generatorId, [...(byGen.get(f.report.item.generatorId) ?? []), f])

const lines: string[] = []
lines.push(`# Feedback triage`, '')
lines.push(`${reports.length} ${includeAll ? '' : 'open '}report${reports.length === 1 ? '' : 's'} for learner ${learnerId} (${state.name}).`, '')
const byCat = new Map<string, number>()
for (const f of reports) byCat.set(f.category, (byCat.get(f.category) ?? 0) + 1)
lines.push('| Category | Count |', '| --- | --- |')
for (const [c, n] of [...byCat.entries()].sort((a, b) => b[1] - a[1])) lines.push(`| ${categoryLabel(c)} | ${n} |`)
lines.push('')
lines.push('## Suggested order of work', '')
lines.push('1. **Bugs** first: a wrong answer marked right or wrong erodes trust fastest.')
lines.push('2. **Confusing** wording next: read the question aloud as a Year 8 pupil would.')
lines.push('3. **Difficulty** reports: only change calibration when several reports agree.')
lines.push('4. **Not covered in class**: a scheduling matter, not a content fix.', '')

const ranked = [...byGen.entries()].sort((a, b) => b[1].length - a[1].length)
for (const [gen, list] of ranked) {
  const skill = registry.graph.has(list[0]?.report.skillId ?? '') ? registry.graph.get(list[0]?.report.skillId as string).name : ''
  lines.push(`## ${gen}  (${list.length})`, '', skill ? `Skill: ${skill}` : '', '')
  for (const f of list) {
    const r = f.report
    lines.push(`### ${categoryLabel(r.category)} - \`${r.item.itemId}\``)
    lines.push(`- Question: ${r.snapshot.prompt}`)
    lines.push(`- Expected: ${r.snapshot.expected}${r.snapshot.given ? `  |  She answered: ${r.snapshot.given}` : ''}`)
    if (r.note) lines.push(`- Her note: "${r.note}"`)
    lines.push(`- Reproduce: \`registry.generateWith('${r.item.generatorId}', ${r.item.difficulty}, ${r.item.seed})\``)
    if (r.status !== 'open') lines.push(`- Status: ${r.status}${r.resolutionNote ? ` - ${r.resolutionNote}` : ''}`)
    for (const n of f.notes) lines.push(`- ${n}`)
    lines.push('')
  }
}
if (!reports.length) lines.push('Nothing to triage.')

const md = lines.join('\n')
if (out) {
  writeFileSync(out, md)
  console.log(`Wrote ${out}`)
} else console.log(md)
