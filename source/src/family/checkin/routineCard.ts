/** Which of a person's sessions the check-in shows as their routine, and where it stands today. */
import { recurCtxFor, type CalCtx } from '../calendar'
import { activeRunFor, routineDoneOn, routinesOn, sessionStepsOn, plannedMinutes } from '../routines'
import type { CheckinPart, MemberId, RoutineEvent, RoutineStep, Ymd } from '../types'
import { existingRoutine } from './routinePlan'

export interface RoutineToday {
  routine: RoutineEvent
  steps: RoutineStep[]
  minutes: number
  done: boolean
  /** A run of it is open right now. */
  runId?: string
}

/** The person's morning or evening session that applies on `date` (the weekday one or the weekend one), if they have one. */
export function routineForPart(ctx: CalCtx, memberId: MemberId, part: CheckinPart, date: Ymd, now: number): RoutineToday | undefined {
  const f = ctx.family
  const mine = routinesOn(f, date, { memberId, rc: (m) => recurCtxFor(ctx, m ? [m] : []) }).filter((r) => r.ownerId === memberId && !r.homework && !r.project && !r.plants)
  const routine = mine.find((r) => r.part === part) ?? mine.find((r) => !r.part && existingRoutine({ ...f, routines: { [r.routineId]: r } }, memberId, part)?.routineId === r.routineId)
  if (!routine) return undefined
  const steps = sessionStepsOn(f, routine, date)
  const active = activeRunFor(f, memberId, now)
  return { routine, steps, minutes: Math.ceil(plannedMinutes(steps)), done: routineDoneOn(f, routine.routineId, date), runId: active && active.routineId === routine.routineId ? active.id : undefined }
}
