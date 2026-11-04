/**
 * Create a "Plan a thing" plan out of ordinary pieces: a project (so the whole plan can be seen), one activity per step,
 * one task per step on the right person's day (so each shows on Today when it is due), and the event on the calendar.
 * A step's task has the id `plan-<activityId>` and the source `plan:<projectId>`, which is how ticking one ticks the other
 * (see activityTicked in projects.ts).
 */
import type { AppEvent } from '@/engine/types'
import * as A from './actions'
import * as PA from './projectActions'
import { addDays } from './dates'
import type { FamilyState, MemberId, Ymd } from './types'
import { assigneeFor, type DatedStep } from './templates/generate'
import type { PlanTemplate } from './templates/data'

export const planTaskId = (activityId: string): string => `plan-${activityId}`

export interface PlanThingInput {
  template: PlanTemplate
  name: string
  date: Ymd
  steps: readonly DatedStep[]
  /** Who is planning (steps for "anyone" and "a parent" land with them). */
  planner: MemberId
  /** Whose steps the "a child" ones are. */
  child?: MemberId
}

export function createPlan(f: FamilyState, i: PlanThingInput, now = Date.now()): { projectId: string; events: AppEvent[] } {
  const title = i.name.trim() || i.template.defaultName
  const { projectId, events: pe } = PA.saveProject(i.planner, { title, goal: `${title}, one small step at a time.`, emoji: i.template.emoji, ownerId: i.planner, status: 'active' }, now)
  const events: AppEvent[] = [...pe]
  const draft = f
  // Activities in due order, so the project reads the way the plan unfolds.
  const acts = PA.addActivities(i.planner, draft, projectId, undefined, i.steps.map((s) => ({ title: s.title, minutes: s.minutes })), now + 1)
  events.push(...acts)
  acts.forEach((a, n) => {
    const s = i.steps[n]!
    const activityId = (a as unknown as { activityId: string }).activityId
    const assignee = assigneeFor(s.who, i.planner, f.members, i.child)
    events.push(
      ...A.saveTask(
        i.planner,
        { taskId: planTaskId(activityId), title: s.title, assignee, kind: 'chore', part: 'any', date: s.due, minutes: s.minutes, coins: 0, check: 'self', notes: `Part of “${title}”`, source: `plan:${projectId}` },
        now + 100 + n,
      ),
    )
  })
  events.push(
    ...A.saveCal(
      i.planner,
      {
        title,
        date: i.date,
        endDate: i.template.days > 1 ? addDays(i.date, i.template.days - 1) : undefined,
        allDay: true,
        members: [],
        everyone: true,
        category: i.template.category,
        busy: false,
        notes: 'Planned in small steps. Find the plan under Plan > Projects.',
      },
      now + 500,
    ),
  )
  return { projectId, events }
}
