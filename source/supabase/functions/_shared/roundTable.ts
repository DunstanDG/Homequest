/**
 * The weekly round table written by Gemini instead of the family assistant on the home server (0.17).
 *
 * The home server still works out the facts (the coming week, clashes, last week's "on track?" answers) and writes the
 * `round-table` event as "waiting". When the family's round table setting says Gemini, the `round-table` Edge Function
 * sends those facts and the things people raised to Gemini, checks the answer with `cleanAgenda`, and writes the event
 * again as "ready" with `source: 'gemini'`.
 *
 * Shared, word for word, by the app (tests, and the screen's labels) and the Edge Function. Plain TypeScript with no
 * imports, so both Vite and Deno can load it.
 *
 * Privacy: names never go to Google. Every family member's name is swapped for "Person 1", "Person 2"... before the
 * prompt is built and swapped back in the answer (`pseudonymise`). Event titles, warnings and notes do go, with names
 * taken out of them too.
 */

export interface RtPerson {
  name: string
  fixed: string[]
  mustdo: number
  free: number
  school: boolean
}
export interface RtReview {
  name: string
  asked: number
  ok: number
  done: number
  later: number
  late: number
  skip: number
  swap: number
  none: number
  tasksDone: number
}
export interface RtFacts {
  weekOf: string
  days: { date: string; label: string; people: RtPerson[]; warnings: string[] }[]
  issues: string[]
  learned: string[]
  review: { from: string; to: string; people: RtReview[] }
}
export interface RtNote {
  who: string
  text: string
}
export interface RtAgenda {
  summary: string
  points: { text: string }[]
}

export const RT_SYSTEM_PROMPT = [
  'You run a short weekly planning meeting ("round table") for a busy UK family. You are given the facts about the coming week, worked out by their planner: for each day, each person\'s fixed commitments, minutes of must-dos and minutes free, plus warnings, clashes, time estimates that look wrong, and how last week went. You are also given the things family members asked to raise.',
  'Write the agenda for their meeting:',
  '- "summary": two or three sentences on how the week looks overall: busy or calm days, the main pinch points.',
  '- "points": 3 to 6 agenda items, most important first. Each is one or two plain sentences: a clash or overloaded day and a concrete way to fix it (swap who does what, move a must-do to a day with free time, leave earlier), a thing someone raised and a suggested answer, or something from last week worth changing. Name the day. Every thing someone raised must be covered by a point.',
  'Rules: only use what is in the facts; never invent events, people or times. People are called "Person 1", "Person 2" and so on: refer to them exactly like that. Be warm, practical and brief. UK English. Suitable for children to hear.',
  'Output ONLY valid JSON matching the requested schema.',
].join('\n')

export const RT_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    points: { type: 'array', items: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  },
  required: ['summary', 'points'],
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Swap names for "Person N" in everything that goes to Gemini, and get a function that swaps them back in the answer.
 * `names` are all the family's names (members and note authors); longer names are replaced first so "Ann" doesn't
 * eat into "Anna".
 */
export function pseudonymise(facts: RtFacts, notes: RtNote[], names: string[]): { facts: RtFacts; notes: RtNote[]; back: (s: string) => string } {
  const list = [...new Set([...names, ...facts.days.flatMap((d) => d.people.map((p) => p.name)), ...facts.review.people.map((p) => p.name), ...notes.map((n) => n.who)].map((n) => n.trim()).filter((n) => n.length >= 2))].sort(
    (a, b) => b.length - a.length,
  )
  const alias = new Map(list.map((n, i) => [n.toLowerCase(), `Person ${i + 1}`]))
  const re = list.length ? new RegExp(`(?<![\\p{L}\\p{N}])(${list.map(esc).join('|')})(?![\\p{L}\\p{N}])`, 'giu') : undefined
  const hide = (s: string) => (re ? s.replace(re, (m) => alias.get(m.toLowerCase()) ?? m) : s)
  const byAlias = new Map([...alias.entries()].map(([lower, a]) => [a, list.find((n) => n.toLowerCase() === lower)!]))
  const back = (s: string) => s.replace(/\bPerson (\d{1,2})\b/g, (m) => byAlias.get(m) ?? m)
  return {
    facts: {
      ...facts,
      days: facts.days.map((d) => ({ ...d, warnings: d.warnings.map(hide), people: d.people.map((p) => ({ ...p, name: hide(p.name), fixed: p.fixed.map(hide) })) })),
      issues: facts.issues.map(hide),
      learned: facts.learned.map(hide),
      review: { ...facts.review, people: facts.review.people.map((p) => ({ ...p, name: hide(p.name) })) },
    },
    notes: notes.map((n) => ({ who: hide(n.who), text: hide(n.text) })),
    back,
  }
}

const h = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? `${min % 60}m` : ''}` : `${min}m`)

/** The facts as compact text (already pseudonymised). */
export function buildRtPrompt(facts: RtFacts, notes: RtNote[]): string {
  const lines: string[] = [`Week starting ${facts.weekOf}.`, '', 'DAYS']
  for (const d of facts.days) {
    lines.push(`${d.label} (${d.date}):`)
    for (const p of d.people) lines.push(`  ${p.name}${p.school ? ' [school]' : ''}: ${p.fixed.length ? p.fixed.join('; ') : 'nothing fixed'} | must-dos ${h(p.mustdo)} | free ${h(p.free)}`)
    for (const w of d.warnings) lines.push(`  WARNING: ${w}`)
  }
  if (facts.issues.length) lines.push('', 'CLASHES AND PROBLEMS', ...facts.issues.map((x) => `- ${x}`))
  if (facts.learned.length) lines.push('', 'TIME ESTIMATES THAT LOOK WRONG', ...facts.learned.map((x) => `- ${x}`))
  if (facts.review.people.length) {
    lines.push('', `LAST WEEK (${facts.review.from} to ${facts.review.to})`)
    for (const r of facts.review.people) lines.push(`- ${r.name}: asked "on track?" ${r.asked}x; on track ${r.ok + r.done}, later ${r.later}, running late ${r.late}, skipped ${r.skip}, handed over ${r.swap}, no answer ${r.none}; ${r.tasksDone} tasks done`)
  }
  lines.push('', 'RAISED BY THE FAMILY', ...(notes.length ? notes.map((n) => `- ${n.who}: ${n.text}`) : ['- (nothing raised)']))
  return lines.join('\n').slice(0, 24_000)
}

export function rtRequestBody(facts: RtFacts, notes: RtNote[], withSchema = true): unknown {
  return {
    systemInstruction: { parts: [{ text: RT_SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: buildRtPrompt(facts, notes) }] }],
    generationConfig: { temperature: 0.4, responseMimeType: 'application/json', ...(withSchema ? { responseSchema: RT_RESPONSE_SCHEMA } : {}) },
  }
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)

/** Check and tidy an answer (text or parsed). What comes out fits what the app shows: a summary and 1-8 points. */
export function cleanAgenda(raw: unknown): RtAgenda | undefined {
  let v = raw
  if (typeof v === 'string') {
    const t = v.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    try {
      v = JSON.parse(t)
    } catch {
      return undefined
    }
  }
  if (!v || typeof v !== 'object') return undefined
  const o = v as { summary?: unknown; points?: unknown }
  const summary = typeof o.summary === 'string' ? clip(o.summary.replace(/\s+/g, ' ').trim(), 500) : ''
  const points = (Array.isArray(o.points) ? o.points : [])
    .map((p) => (typeof p === 'string' ? p : typeof (p as { text?: unknown })?.text === 'string' ? (p as { text: string }).text : ''))
    .map((t) => clip(t.replace(/\s+/g, ' ').trim(), 200))
    .filter(Boolean)
    .slice(0, 8)
    .map((text) => ({ text }))
  if (!summary || !points.length) return undefined
  return { summary, points }
}

/** Put the real names back into a checked agenda. */
export const unmaskAgenda = (a: RtAgenda, back: (s: string) => string): RtAgenda => ({ summary: clip(back(a.summary), 500), points: a.points.map((p) => ({ text: clip(back(p.text), 200) })) })
