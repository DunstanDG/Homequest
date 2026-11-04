/**
 * What kind of day it is for a person, for the things that run to a weekday or a weekend timetable (check-in windows,
 * morning and evening routines). A child with a school set up has a "weekday" on school days and a "weekend" on every other
 * day, so a school holiday or INSET day gets the relaxed times. Everyone else follows Monday to Friday; the app holds no work
 * rota to look at, so an adult on shifts can set their own times for each routine instead.
 */
import { weekday } from '../dates'
import type { FamilyState, MemberId, Ymd } from '../types'

export type DayType = 'weekday' | 'weekend'

/** The part of a calendar context this needs (a `CalCtx` fits). */
export interface DayTypeCtx {
  family: FamilyState
  schools: Record<MemberId, { isSchoolDay(d: Ymd): boolean } | undefined>
}

/** Does this child have their own school set up (so their days follow its calendar)? */
export const hasOwnSchool = (ctx: DayTypeCtx, memberId: MemberId): boolean => ctx.family.members[memberId]?.role === 'child' && !!ctx.schools[memberId]

export function dayTypeOf(ctx: DayTypeCtx, memberId: MemberId, date: Ymd): DayType {
  if (hasOwnSchool(ctx, memberId)) return ctx.schools[memberId]!.isSchoolDay(date) ? 'weekday' : 'weekend'
  return weekday(date) > 4 ? 'weekend' : 'weekday'
}
