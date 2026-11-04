/** "This week's 5" on Today: what the family picked in the weekly plan, with everything else allowed to wait. */
import { Link } from 'react-router-dom'
import { useFamily, useNow } from '@/app/context'
import { ymdOf } from '@/family/dates'
import { weekFocusFor } from '@/family/weekPlan'
import { WeekFocusCard } from './WeekPlan'

export function WeekFocusBlock() {
  const f = useFamily()
  const now = useNow(60_000)
  const items = weekFocusFor(f, ymdOf(now))
  if (!items.length) return null
  return (
    <Link to="/week" className="plain-link" aria-label="This week’s 5, from the weekly plan">
      <WeekFocusCard items={items} which="this" />
    </Link>
  )
}
