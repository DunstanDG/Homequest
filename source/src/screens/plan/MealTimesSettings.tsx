import * as P from '@/family/planActions'
import { SLOT_INFO, mealTimesOf } from '@/family/meals'
import { useApp, useFamily, useMe } from '@/app/context'

const SLOTS = ['breakfast', 'lunch', 'dinner'] as const

/** The family's usual meal times. They set where planned meals sit on the calendar; a single meal can still have its own time. */
export function MealTimesSettings() {
  const { act } = useApp()
  const f = useFamily()
  const me = useMe()!
  const t = mealTimesOf(f)
  const set = (slot: (typeof SLOTS)[number], key: 'start' | 'end', v: string) => {
    if (!v) return
    const cur = t[slot]
    const next = { ...cur, [key]: v }
    // Keep the end after the start: pushing the start past the end drags the end along by the same length.
    if (key === 'start' && v >= cur.end) {
      const [h, m] = v.split(':').map(Number)
      const mins = Math.min(1439, h! * 60 + m! + 30)
      next.end = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
    }
    if (key === 'end' && v <= cur.start) return
    act(P.saveMealTimes(me.id, { ...t, [slot]: next }))
  }
  return (
    <div className="card meal-times">
      <p className="note">Planned breakfasts, lunches and dinners show on the calendar at these times. Snacks have no time. Any one meal can be given its own time when you plan it.</p>
      {SLOTS.map((s) => (
        <div key={s} className="row-fields">
          <strong className="mt-label">
            {SLOT_INFO[s].emoji} {SLOT_INFO[s].label}
          </strong>
          <label className="field grow">
            <span>From</span>
            <input type="time" className="tbox" value={t[s].start} onChange={(e) => set(s, 'start', e.target.value)} aria-label={`${SLOT_INFO[s].label} starts`} />
          </label>
          <label className="field grow">
            <span>To</span>
            <input type="time" className="tbox" value={t[s].end} onChange={(e) => set(s, 'end', e.target.value)} aria-label={`${SLOT_INFO[s].label} ends`} />
          </label>
        </div>
      ))}
    </div>
  )
}
