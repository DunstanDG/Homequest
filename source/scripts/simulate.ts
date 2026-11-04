/**
 * Simulated learner: run the real maths pack through the real planner/session with a made-up child whose
 * hidden ability we know, then check the app behaves sensibly (finds her gaps, XP pace, levelling).
 *
 *   npm run simulate [-- --days=14 --seed=3]
 */
import { registry } from '../src/content'
import { Session, createMemoryStore } from '../src/engine/session'
import { solutionFor } from '../src/engine/judge'
import { makeRng } from '../src/engine/rng'
import { levelFromXp } from '../src/engine/points'
import { DAY_MS, mastery } from '../src/engine/mastery'
import type { Answer, Item } from '../src/engine/types'

const arg = (n: string, d: number) => Number(process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1] ?? d)
const DAYS = arg('days', 14)
const rng = makeRng(arg('seed', 3))

/** Hidden truth: comfortable with Y4-6, mostly fine in Y7, shaky in Y8, plus a few real holes underneath. */
const HOLES = new Set(['maths.number.properties', 'maths.algebra.notation', 'maths.f.ratio'])
const known = registry.graph.all().filter((s) => s.subject === 'maths')
/** Causal: a skill is capped by its weakest prerequisite (you cannot do fraction arithmetic without factors). */
const memo = new Map<string, number>()
const trueTheta = (id: string): number => {
  const hit = memo.get(id)
  if (hit !== undefined) return hit
  const s = registry.graph.get(id)
  const base = s.year <= 6 ? 4.6 : s.year === 7 ? 4.1 : 3.7
  let t = HOLES.has(id) ? 1.2 : base
  for (const p of s.prereqs) t = Math.min(t, trueTheta(p) + 0.8)
  memo.set(id, t)
  return t
}
const pCorrect = (id: string, diff: number) => 1 / (1 + Math.exp(-(trueTheta(id) - diff) * 1.1))

const wrongFor = (item: Item): Answer => {
  switch (item.kind) {
    case 'numeric': return { kind: 'numeric', values: item.fields.map(() => '-9999') }
    case 'expr': return { kind: 'expr', value: '999z' }
    case 'choice': return { kind: 'choice', optionId: (item.options.find((o) => !o.correct) ?? item.options[0])!.id }
    case 'text': return { kind: 'text', value: 'zzzz' }
    case 'order': return { kind: 'order', order: [...(solutionFor(item) as { order: string[] }).order].reverse() }
    default: return solutionFor(item)
  }
}

let clock = Date.UTC(2026, 8, 21, 16, 0, 0)
const store = createMemoryStore('sim', registry, [
  { id: 'p0', type: 'profile', ts: clock, learnerId: 'sim', name: 'Sim', year: 8 } as never,
])

function run(game: string, mode: 'practice' | 'sprint' | 'diagnostic', length: number, allowRetry: boolean) {
  const s = new Session({ registry, store, learnerId: 'sim', subject: 'maths', gameId: game, mode, length, seed: rng.int(1, 1e9), allowRetry, now: () => (clock += 9000) })
  let asked = 0
  const maxAsk = mode === 'sprint' ? 14 : length
  let q
  while ((q = s.next()) && asked < maxAsk * 2) {
    const ok = rng.next() < pCorrect(q.item.skillId, q.planned.difficulty)
    const r = s.submit(ok ? solutionFor(q.item) : wrongFor(q.item), 9000)
    if (r.canRetry) {
      s.useHint()
      s.submit(rng.next() < 0.6 ? solutionFor(q.item) : wrongFor(q.item), 9000)
    }
    asked++
  }
  return s.finish(true)
}

const log: string[] = []
const before = store.get().xp
const gap = run('gaps', 'diagnostic', 16, false)
log.push(`Gap Finder: ${gap.correct}/${gap.answered} right, +${gap.xp} XP`)
const st0 = store.get()
const flagged = Object.values(st0.skills).filter((k) => k.n > 0 && mastery(k, clock) < 0.5).map((k) => k.skillId)
const wantedHoles = [...HOLES]
const hit = wantedHoles.filter((h) => flagged.includes(h))
const reported = new Set(gap.weak)
const affected = known.filter((k) => k.year === 8 && trueTheta(k.id) < 3.0).map((k) => k.id)
const roots = new Set(gap.weak)
const diag = wantedHoles.filter((h) => reported.has(h as never))
log.push(`Weak after Gap Finder (${flagged.length}): ${flagged.slice(0, 8).join(', ')}`)
log.push(`Y8 skills truly affected by holes: ${affected.length}; reported weak that are truly affected or holes: ${[...roots].filter((r) => trueTheta(r) < 3.0).length}/${roots.size}`)
log.push(`Planted holes: ${hit.length}/${wantedHoles.length} flagged weak in state; ${diag.length}/${wantedHoles.length} in the Gap Finder report (${[...reported].map((r) => r.replace('maths.', '')).join(', ')})`)

const perSession: number[] = []
for (let d = 0; d < DAYS; d++) {
  clock += DAY_MS
  const x0 = store.get().xp
  const t = run('tower', 'practice', 10, true)
  perSession.push(t.xp)
  if (d % 2 === 0) run('sprint', 'sprint', 40, false)
  const dayXp = store.get().xp - x0
  if (d < 3 || d === DAYS - 1) log.push(`Day ${d + 1}: tower ${t.correct}/${t.answered} +${t.xp} XP; day total +${dayXp} XP; level ${levelFromXp(store.get().xp).level}`)
}
const avg = perSession.reduce((a, b) => a + b, 0) / perSession.length
const st = store.get()
log.push(`Tower XP per 10-question session: min ${Math.min(...perSession)}, avg ${avg.toFixed(0)}, max ${Math.max(...perSession)}`)
log.push(`After ${DAYS} days: ${st.xp - before} XP, level ${levelFromXp(st.xp).level}, ${st.totals.attempts} attempts, ${Object.keys(st.badges).length} badges`)
const y8 = known.filter((s) => s.year === 8)
log.push(`Year 8 mastery (avg): ${(y8.reduce((a, s) => a + (st.skills[s.id] ? mastery(st.skills[s.id]!, clock) : 0), 0) / y8.length).toFixed(2)}`)
const holesNow = [...HOLES].map((h) => `${h.split('.').pop()}=${st.skills[h] ? mastery(st.skills[h]!, clock).toFixed(2) : 'n/a'}`)
log.push(`Planted holes now: ${holesNow.join(', ')}`)
console.log(log.join('\n'))
