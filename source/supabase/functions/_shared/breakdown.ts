/**
 * The "break a goal down into activities" prompt, its JSON schema, and the checks every answer goes through.
 *
 * Shared, word for word, by the app (src/app/breakdown.ts, which can call Gemini directly with a key kept on that
 * one phone, and runs the checks on whatever comes back) and the `breakdown` Edge Function (which holds the
 * family's key as a secret and is the normal way in). Plain TypeScript with no imports, so both Vite and Deno can
 * load it.
 *
 * Privacy: nothing here sends names. The person doing the work is described by role only ("a parent", "a child at
 * secondary school").
 */

/** What the app asks for. Everything is plain text the family typed; the function trims and caps it again. */
export interface BreakdownInput {
  /** The thing to break down: the project goal, or one activity's title (and description) when going a level deeper. */
  goal: string
  /** Constraints and notes the family added to the project. */
  context?: string
  /** When going deeper: the whole project's goal, and the path from it down to this activity. */
  projectGoal?: string
  path?: string[]
  /** When going deeper: the activities next to this one, so the answer doesn't repeat them. */
  siblings?: string[]
  /** About how long this part was expected to take, in minutes. */
  minutes?: number
  /** The size of step to aim for, in minutes (the "level of detail"). */
  grain?: number
  /** Time available, in minutes a day. */
  dailyMinutes?: number
  skill?: 'new' | 'some' | 'experienced'
  who?: 'parent' | 'child' | 'family'
}

export interface BreakdownTask {
  task_id: string
  title: string
  description: string
  estimated_minutes: number
  dependencies: string[]
}

export interface BreakdownResult {
  project_title: string
  total_estimated_minutes: number
  tasks: BreakdownTask[]
}

export const SYSTEM_PROMPT = [
  'You are an expert productivity assistant and project manager. Your goal is to break down a high-level user objective into granular, actionable tasks.',
  'Each task should be small enough to be completed in a single sitting. Ensure estimated times are realistic (in minutes).',
  'Rules:',
  '- Start every task title with a verb ("Measure the wall", not "Wall measurements"). Keep titles under 70 characters.',
  '- The description says concretely what to do and what "done" looks like, in one or two short sentences.',
  '- "dependencies" lists the task_ids (from this same answer) that must be finished before the task can start. Only add a dependency when the order really matters; tasks that can happen in any order have none. Never depend on a task that comes later in a way that makes a loop.',
  '- Do not repeat work that the context says is already covered elsewhere in the plan.',
  '- Use UK English. Keep everything safe and suitable for a family; if the person is a child, pitch it for their age and add an "ask a grown-up" step for anything involving tools, money, the internet or going out.',
  'Output ONLY valid JSON matching the requested schema.',
].join('\n')

const SKILL: Record<NonNullable<BreakdownInput['skill']>, string> = {
  new: 'New to this: include the learning and setting-up steps, and explain anything technical.',
  some: 'Has some experience: skip the basics.',
  experienced: 'Experienced: keep the steps brisk and skip anything obvious.',
}

const WHO: Record<NonNullable<BreakdownInput['who']>, string> = {
  parent: 'An adult (a parent) will do this.',
  child: 'A child at secondary school (about 12-14) will do this.',
  family: 'The family will do this together.',
}

const clip = (s: string | undefined, n: number): string => (s ?? '').replace(/\s+/g, ' ').trim().slice(0, n)

/** The user message, in the shape of the agreed template: the goal, then any additional context and constraints. */
export function buildUserPrompt(input: BreakdownInput): string {
  const grain = Math.max(5, Math.min(240, Math.round(input.grain ?? 20)))
  const ctx: string[] = []
  if (input.projectGoal && clip(input.projectGoal, 400) !== clip(input.goal, 400)) ctx.push(`This is one part of a bigger project: "${clip(input.projectGoal, 400)}".`)
  if (input.path?.length) ctx.push(`Where it sits in the plan: ${input.path.map((p) => clip(p, 80)).join(' > ')}.`)
  if (input.siblings?.length) ctx.push(`Already covered by other parts of the plan (do not repeat): ${input.siblings.slice(0, 30).map((s) => clip(s, 80)).join('; ')}.`)
  if (input.minutes) ctx.push(`This part was estimated at about ${Math.round(input.minutes)} minutes in total; break it into steps that add up to roughly that.`)
  if (input.dailyMinutes) ctx.push(`Time available: about ${Math.round(input.dailyMinutes)} minutes a day.`)
  if (input.skill) ctx.push(`Skill level: ${SKILL[input.skill]}`)
  if (input.who) ctx.push(WHO[input.who])
  ctx.push(`Level of detail: aim for steps of about ${grain} minutes each (no step over ${grain * 3} minutes), between 3 and 12 steps.`)
  const extra = clip(input.context, 1500)
  if (extra) ctx.push(`Notes from the family: ${extra}`)
  return [`Goal: ${clip(input.goal, 600)}`, '', `Additional Context/Constraints: ${ctx.join(' ')}`].join('\n')
}

/** The output schema, in the OpenAPI-style subset Gemini's `responseSchema` takes. */
export const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    project_title: { type: 'STRING', description: 'A short name for this piece of work (under 50 characters).' },
    total_estimated_minutes: { type: 'INTEGER' },
    tasks: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          task_id: { type: 'STRING', description: 'A short unique id such as "t1".' },
          title: { type: 'STRING' },
          description: { type: 'STRING' },
          estimated_minutes: { type: 'INTEGER' },
          dependencies: { type: 'ARRAY', items: { type: 'STRING' }, description: 'task_ids that must be finished first.' },
        },
        required: ['task_id', 'title', 'description', 'estimated_minutes', 'dependencies'],
        propertyOrdering: ['task_id', 'title', 'description', 'estimated_minutes', 'dependencies'],
      },
    },
  },
  required: ['project_title', 'total_estimated_minutes', 'tasks'],
  propertyOrdering: ['project_title', 'total_estimated_minutes', 'tasks'],
} as const

/** The generateContent request body (structured output: JSON only, shaped by the schema). */
export function geminiRequestBody(input: BreakdownInput, withSchema = true): unknown {
  return {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: buildUserPrompt(input) }] }],
    generationConfig: { responseMimeType: 'application/json', ...(withSchema ? { responseSchema: RESPONSE_SCHEMA } : {}), temperature: 0.4 },
  }
}

export const DEFAULT_MODEL = 'gemini-3.8-flash'
/** Tried when the main model is busy or out of quota: a smaller, stable model with its own capacity and limits. */
export const FALLBACK_MODEL = 'gemini-3.1-flash-lite'
export const geminiUrl = (model: string): string => `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`

/** Gemini answers 503 ("The model is overloaded") and sometimes 500/504 when it is busy. These clear on their own,
 * usually within seconds, so they are worth another go. */
export const isBusy = (status: number): boolean => status === 500 || status === 502 || status === 503 || status === 504
/** Waits before the 2nd and 3rd go at the same model (with a little jitter so two phones don't retry in step). */
export const RETRY_DELAYS_MS = [1200, 3500]

export interface GeminiAttempt {
  res: Response
  model: string
  /** How many requests were made in all. */
  tries: number
}

/**
 * Ask Gemini, riding out the "busy" errors: each model gets up to three goes (the delays above) when it answers
 * 5xx, a 400 is asked again without the response schema, and a model that stays busy or is out of quota (429)
 * hands over to the next one in `models`. Returns the last response, which is ok if any attempt worked. A model
 * that doesn't exist (404) as a fallback is skipped, and the earlier, more useful error is returned instead.
 */
export async function askGemini(
  call: (model: string, withSchema: boolean) => Promise<Response>,
  models: readonly string[],
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<GeminiAttempt> {
  let last: GeminiAttempt | undefined
  let tries = 0
  for (const [i, model] of models.entries()) {
    let withSchema = true
    for (let attempt = 0; ; attempt++) {
      const res = await call(model, withSchema)
      tries++
      if (res.ok) return { res, model, tries }
      if (res.status === 400 && withSchema) {
        withSchema = false // this model may not take the schema form: ask for plain JSON, the answer is checked anyway
        continue
      }
      if (res.status === 404 && i > 0 && last) break // the fallback isn't available on this key: keep the first error
      last = { res, model, tries }
      if (isBusy(res.status) && attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt]! + Math.round(Math.random() * 400))
        continue
      }
      break
    }
    // Move on to the next model only for "busy" or "quota"; a bad key (401/403) or a bad request won't fix itself.
    if (!last || !(isBusy(last.res.status) || last.res.status === 429)) break
  }
  return { ...last!, tries }
}

/** A sentence for the person tapping the button, from a failed Gemini status. */
export function geminiErrorText(status: number): string {
  if (isBusy(status)) return `Gemini is busy right now (${status}). It usually clears in a minute or two, so try again shortly.`
  if (status === 429) return 'Gemini says that’s too many requests for now (429). Try again in a minute.'
  if (status === 401 || status === 403) return `Gemini didn’t accept the API key (${status}).`
  if (status === 404) return 'Gemini doesn’t know that model (404). Check the GEMINI_MODEL setting.'
  return `Gemini said no (${status}).`
}

/** The text of the first candidate of a generateContent response (undefined if it was blocked or empty). */
export function geminiText(resp: unknown): string | undefined {
  const parts = (resp as { candidates?: { content?: { parts?: { text?: unknown }[] } }[] })?.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) return undefined
  const text = parts.map((p) => (typeof p?.text === 'string' ? p.text : '')).join('')
  return text.trim() || undefined
}

/**
 * Check and tidy an answer. Whatever the model sends, what comes out is safe to save: 1-20 tasks with unique ids,
 * a title, whole minutes between 1 and 600, and dependencies that only point at earlier-listed tasks in this same
 * answer (an edge that would make a loop is dropped). Returns undefined if nothing usable is left.
 */
export function cleanBreakdown(raw: unknown): BreakdownResult | undefined {
  let data = raw
  if (typeof data === 'string') {
    const s = data.replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '')
    try {
      data = JSON.parse(s)
    } catch {
      return undefined
    }
  }
  if (!data || typeof data !== 'object') return undefined
  const d = data as Record<string, unknown>
  const list = Array.isArray(d.tasks) ? d.tasks : Array.isArray(data) ? (data as unknown[]) : []
  const tasks: BreakdownTask[] = []
  const seen = new Set<string>()
  for (const t of list.slice(0, 20)) {
    if (!t || typeof t !== 'object') continue
    const r = t as Record<string, unknown>
    const title = clip(typeof r.title === 'string' ? r.title : '', 120)
    if (!title) continue
    let id = clip(typeof r.task_id === 'string' || typeof r.task_id === 'number' ? String(r.task_id) : '', 40) || `t${tasks.length + 1}`
    while (seen.has(id)) id = `${id}_`
    seen.add(id)
    const m = Number(r.estimated_minutes)
    tasks.push({
      task_id: id,
      title,
      description: clip(typeof r.description === 'string' ? r.description : '', 600),
      estimated_minutes: Number.isFinite(m) ? Math.max(1, Math.min(600, Math.round(m))) : 15,
      dependencies: Array.isArray(r.dependencies) ? r.dependencies.filter((x): x is string | number => typeof x === 'string' || typeof x === 'number').map(String) : [],
    })
  }
  if (!tasks.length) return undefined
  // Dependencies: known ids only, no self, and no loops (an edge is kept only if its target can't already reach back).
  const ids = new Set(tasks.map((t) => t.task_id))
  const kept = new Map<string, string[]>()
  const reaches = (from: string, to: string): boolean => {
    const stack = [from]
    const visited = new Set<string>()
    while (stack.length) {
      const x = stack.pop()!
      if (x === to) return true
      if (visited.has(x)) continue
      visited.add(x)
      stack.push(...(kept.get(x) ?? []))
    }
    return false
  }
  for (const t of tasks) kept.set(t.task_id, [])
  for (const t of tasks) {
    const deps: string[] = []
    for (const dep of t.dependencies) {
      if (!ids.has(dep) || dep === t.task_id || deps.includes(dep)) continue
      if (reaches(dep, t.task_id)) continue // dep already (indirectly) waits for t: adding it would make a loop
      deps.push(dep)
      kept.get(t.task_id)!.push(dep)
    }
    t.dependencies = deps
  }
  const total = tasks.reduce((s, t) => s + t.estimated_minutes, 0)
  return { project_title: clip(typeof d.project_title === 'string' ? d.project_title : '', 80), total_estimated_minutes: total, tasks }
}

/** Trim and cap an input that arrived over the wire, so the function never forwards something huge or odd. */
export function cleanInput(raw: unknown): BreakdownInput | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Record<string, unknown>
  const goal = clip(typeof r.goal === 'string' ? r.goal : '', 600)
  if (!goal) return undefined
  const num = (x: unknown, lo: number, hi: number): number | undefined => (typeof x === 'number' && Number.isFinite(x) ? Math.max(lo, Math.min(hi, x)) : undefined)
  const strs = (x: unknown, n: number): string[] | undefined => (Array.isArray(x) ? x.filter((s): s is string => typeof s === 'string').slice(0, n).map((s) => clip(s, 120)) : undefined)
  return {
    goal,
    context: clip(typeof r.context === 'string' ? r.context : '', 1500) || undefined,
    projectGoal: clip(typeof r.projectGoal === 'string' ? r.projectGoal : '', 600) || undefined,
    path: strs(r.path, 8),
    siblings: strs(r.siblings, 30),
    minutes: num(r.minutes, 1, 100_000),
    grain: num(r.grain, 5, 240),
    dailyMinutes: num(r.dailyMinutes, 5, 1440),
    skill: r.skill === 'new' || r.skill === 'some' || r.skill === 'experienced' ? r.skill : undefined,
    who: r.who === 'parent' || r.who === 'child' || r.who === 'family' ? r.who : undefined,
  }
}
