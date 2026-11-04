import { useSearchParams } from 'react-router-dom'
import { useFamily, useMe, useNow } from '@/app/context'
import { activeHouseRun } from '@/family/house/run'
import { activeRunFor } from '@/family/routines'
import { ROUTINES_TABS, routinesTabOf, type RoutinesTab } from '@/family/routineKind'
import { HouseBanner, HouseSessions } from '@/screens/house/HouseSessions'
import { Seg } from '@/ui/fam'
import { ActiveBanner, Sessions } from './Sessions'
import '../../calm-nav.css'

const KEY = 'hq.plan.routines'

const remembered = (): string | null => {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

/** Plan › Routines: the one place for steps worked through against the clock, in three kinds that are always in the
 * same order. Routines (morning, bedtime, before you leave), Clean-ups (the whole family at once, with the rooms and
 * jobs inside) and Focus sessions (an admin hour, a tidy). `?k=` picks one (old `?t=sessions` links land on
 * Routines); otherwise the last one used on this phone. */
export function Routines() {
  const f = useFamily()
  const me = useMe()!
  const now = useNow(30_000)
  const [params, setParams] = useSearchParams()
  const legacy = params.get('t') === 'sessions' && !params.get('k')
  const tab = routinesTabOf(params.get('k'), legacy ? 'routines' : remembered())
  const active = activeRunFor(f, me.id, now)
  const house = activeHouseRun(f, now)
  const go = (k: RoutinesTab) => {
    try {
      localStorage.setItem(KEY, k)
    } catch {
      /* fine */
    }
    setParams({ t: 'routines', k }, { replace: true })
  }
  return (
    <>
      <div className="routines-tabs">
        <Seg<RoutinesTab> label="Kinds of routine" value={tab} onChange={go} options={ROUTINES_TABS} />
      </div>
      {active && <ActiveBanner runId={active.id} />}
      {house && tab !== 'cleanups' && <HouseBanner runId={house.id} />}
      {tab === 'routines' && <Sessions kind="routine" />}
      {tab === 'cleanups' && <HouseSessions />}
      {tab === 'focus' && <Sessions kind="focus" />}
    </>
  )
}
