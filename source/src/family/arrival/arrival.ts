import { addDays, daysBetween } from '../dates'
import type { AgendaItem } from '../calendar'
import type { FamilyState, IdeaEvent, Member, MemberId, Ymd } from '../types'
import { ARRIVAL_ACTIVITIES, ARRIVAL_DAYS, type ArrivalActivity } from './pack'

/** A baby who has not been born yet: a due date and no birth date. */
export const isExpecting = (m: Pick<Member, 'role' | 'birthday' | 'dueDate'>): boolean => m.role === 'baby' && !m.birthday && !!m.dueDate

/** Babies who are here (a baby added without a due date is treated as born). */
export const bornBabies = (f: FamilyState): Member[] => Object.values(f.members).filter((m) => m.active && m.role === 'baby' && !isExpecting(m))
export const expectedBabies = (f: FamilyState): Member[] => Object.values(f.members).filter((m) => m.active && isExpecting(m))

/** Day 1 of the plan: the first day at home. Unless the family says otherwise, that is the day after the birth. */
export const dayOneOf = (m: Pick<Member, 'birthday' | 'dayOne'>): Ymd | undefined => m.dayOne ?? (m.birthday ? addDays(m.birthday, 1) : undefined)

/** Which day of the plan (1 to 14) a date is for this baby, or undefined if it is outside the plan. */
export function arrivalDayOn(m: Pick<Member, 'birthday' | 'dayOne'>, date: Ymd): number | undefined {
  const d1 = dayOneOf(m)
  if (!d1) return undefined
  const n = daysBetween(d1, date) + 1
  return n >= 1 && n <= ARRIVAL_DAYS ? n : undefined
}

export const activitiesOnDay = (day: number): ArrivalActivity[] => ARRIVAL_ACTIVITIES.filter((a) => a.day === day)
export const focusOnDay = (day: number): string | undefined => ARRIVAL_ACTIVITIES.find((a) => a.day === day && a.focus)?.focus

/** Calendar entries for the plan: the medical milestone for the day, shown to the parents. Activities are suggestions, not calendar entries. */
export function arrivalItemsOn(f: FamilyState, date: Ymd): AgendaItem[] {
  const out: AgendaItem[] = []
  const parents = Object.values(f.members)
    .filter((m) => m.active && m.role === 'parent')
    .map((m) => m.id)
  for (const b of bornBabies(f)) {
    const n = arrivalDayOn(b, date)
    const focus = n ? focusOnDay(n) : undefined
    if (!n || !focus) continue
    out.push({
      key: `arrival:${b.id}:${date}`,
      source: 'arrival',
      title: focus,
      sub: `${b.name} · day ${n}`,
      date,
      allDay: true,
      members: parents,
      everyone: false,
      category: 'appointment',
      busy: false,
    })
  }
  return out
}

export const arrivalIdeaId = (a: ArrivalActivity): string => `idea-arr-${a.id}`

const emojiFor = (a: ArrivalActivity): string => {
  if (/movie/i.test(a.title)) return '🍿'
  if (a.tags.includes('Baking') || /bake|baking|pumpkin bread/i.test(a.title)) return '🍪'
  if (a.tags.includes('Food') || a.tags.includes('Treat')) return a.env === 'Outdoor' ? '🧺' : '🍫'
  if (a.tags.includes('Craft')) return '🎨'
  if (a.tags.includes('Game')) return '🎯'
  if (a.env === 'Outdoor') return '🍂'
  return '🕯️'
}

export const kindFor = (a: ArrivalActivity): IdeaEvent['kind'] => {
  if (a.env === 'Outdoor') return 'outing'
  if (/movie/i.test(a.title)) return 'movie'
  if (a.tags.some((t) => t === 'Food' || t === 'Treat' || t === 'Baking')) return 'treat'
  return 'game'
}

/** Everything the family needs to know about an activity, as the notes on an idea or calendar entry. */
export const notesFor = (a: ArrivalActivity): string => `${a.what}\nYou'll need: ${a.props.join(', ')}.\nWho: ${a.who}.`

export const ideaDraftFor = (a: ArrivalActivity) => ({
  ideaId: arrivalIdeaId(a),
  title: a.title,
  kind: kindFor(a),
  emoji: emojiFor(a),
  notes: notesFor(a),
})

/** Who to put on the calendar for an activity: everyone for "Full Family", otherwise the parents (and the children if a stepdaughter is named). */
export function whoFor(f: FamilyState, a: ArrivalActivity): { everyone: boolean; members: MemberId[] } {
  if (/full family/i.test(a.who)) return { everyone: true, members: [] }
  const active = Object.values(f.members).filter((m) => m.active)
  const members = active.filter((m) => m.role === 'parent' || (/stepdaughter|sibling/i.test(a.who) && m.role === 'child')).map((m) => m.id)
  return { everyone: false, members }
}
