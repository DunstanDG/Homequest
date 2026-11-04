import { RATINGS, mealsToRate, ratingOf, rateMeal } from '@/family/mealRatings'
import { SLOT_INFO } from '@/family/meals'
import { useApp, useFamily, useMe } from '@/app/context'
import { addDays, ymdOf } from '@/family/dates'
import type { Member, Ymd } from '@/family/types'
import { Avatar } from '@/ui/fam'

/**
 * "How was dinner?": a thumbs row per person for the meals that have been had, for one day. Everyone rates for themselves, and only
 * if they like; a parent can rate for a child. Nobody who does not vote counts for or against a meal.
 */
export function MealRatingCard({ date, people, now, title, hideDone }: { date: Ymd; people: Member[]; now: number; title?: string; hideDone?: boolean }) {
  const { act } = useApp()
  const f = useFamily()
  const me = useMe()!
  const today = ymdOf(now)
  const meals = mealsToRate(f, date, now, today).filter((m) => !hideDone || people.some((p) => !ratingOf(f, p.id, m.planId)))
  if (!meals.length || !people.length) return null
  const may = (p: Member) => me.role === 'parent' || p.id === me.id
  return (
    <section className="card meal-rating" aria-label={title ?? 'Rate the meals'}>
      <h3>{title ?? (date === today ? 'How were the meals?' : 'How were yesterday’s meals?')}</h3>
      {meals.map((m) => (
        <div key={m.planId} className="mr-meal">
          <strong>
            {SLOT_INFO[m.slot].emoji} {m.title}
          </strong>
          <small className="muted"> {SLOT_INFO[m.slot].label}</small>
          <ul className="mr-people">
            {people.map((p) => {
              const r = ratingOf(f, p.id, m.planId)
              return (
                <li key={p.id}>
                  {people.length > 1 && (
                    <span className="mr-who">
                      <Avatar m={p} size={22} /> {p.name}
                    </span>
                  )}
                  <span className="mr-btns" role="group" aria-label={`${p.name}: ${m.title}`}>
                    {RATINGS.map((x) => (
                      <button
                        key={x.value}
                        type="button"
                        className={`mr-btn${r === x.value ? ' on' : ''}`}
                        aria-pressed={r === x.value}
                        aria-label={`${p.name}: ${x.label}`}
                        disabled={!may(p)}
                        onClick={() => act(rateMeal(me.id, f, { planId: m.planId, memberId: p.id, rating: x.value }))}
                      >
                        <span aria-hidden>{x.emoji}</span>
                      </button>
                    ))}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
      <p className="note">Only if you want to. Meals people like come up more in suggestions.</p>
    </section>
  )
}

export const yesterdayOf = (now: number): Ymd => addDays(ymdOf(now), -1)
