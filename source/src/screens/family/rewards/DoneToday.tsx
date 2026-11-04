/** Today sections that feel like a reward: "Look what you did" and the shared family goal bar. */
import { Link } from 'react-router-dom'
import { useFamily, useIsParent, useMe } from '@/app/context'
import { ymdOf } from '@/family/dates'
import type { Member } from '@/family/types'
import { SectionHead } from '@/ui/fam'
import { Bar } from '@/ui/primitives'
import { doneOn, familyGoal, handledThisWeek, showDoneToday, weeklyLine } from './rewardsLogic'
import '@/ui/celebrate.css'

const SHOWN = 6

/** What this person finished today. Only ever what is done, never what is missed. Hidden until something is done. */
export function DoneTodayBlock({ view, now }: { view: Member; now: number }) {
  const f = useFamily()
  const me = useMe()
  const isParent = useIsParent()
  const today = ymdOf(now)
  const items = doneOn(f, view.id, today)
  if (!showDoneToday(items.length, new Date(now).getHours())) return null
  const line = isParent && me?.id === view.id ? weeklyLine(handledThisWeek(f, view.id, today)) : undefined
  const mine = me?.id === view.id
  return (
    <section className="done-today">
      <SectionHead title={mine ? 'Look what you did' : `Look what ${view.name} did`} />
      <div className="card">
        <ul>
          {items.slice(-SHOWN).reverse().map((i) => (
            <li key={i.key}>
              <span aria-hidden="true">{i.emoji}</span> <span>{i.title}</span>
            </li>
          ))}
        </ul>
        {items.length > SHOWN && <p className="muted small">and {items.length - SHOWN} more</p>}
        {line && <p className="thanks">{line}</p>}
      </div>
    </section>
  )
}

/** A small shared progress bar for the family goal, if there is one. */
export function FamilyGoalBlock() {
  const f = useFamily()
  const g = familyGoal(f)
  if (!g) return null
  return (
    <section>
      <SectionHead title="Family goal" action={<Link to="/shop" className="link-btn">Add coins</Link>} />
      <div className="card">
        <div className="goal-bar">
          <p>{g.label}</p>
          <Bar value={g.pct} tone={g.pct >= 1 ? 'good' : 'accent'} label={g.goal.title} />
        </div>
      </div>
    </section>
  )
}
