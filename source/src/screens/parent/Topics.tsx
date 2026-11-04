import { useState } from 'react'
import { skillRows } from '@/engine/report'
import { TIER_LABEL } from '@/engine/mastery'
import { useApp, useLearner, useNow, useViewedId } from '@/app/context'
import { makeEvent } from '@/app/events'
import { Pill } from '@/ui/primitives'

/** Parent marks what has (not) been covered in class. Not-covered topics are skipped by the planner. */
export function Topics({ subject }: { subject: string }) {
  const { repo, registry } = useApp()
  const viewedId = useViewedId()
  const state = useLearner()
  const now = useNow()
  const [year, setYear] = useState<number>(state.year)
  const rows = skillRows(state, registry, now, subject).filter((r) => r.hasContent && r.skill.origin === 'syllabus' && r.skill.year === year)
  const set = (skillId: string, taught: boolean) => repo.apply([makeEvent(viewedId, { type: 'taught', skillId, taught })])
  const years = [...new Set(skillRows(state, registry, now, subject).filter((r) => r.hasContent && r.skill.origin === 'syllabus').map((r) => r.skill.year))].sort()
  const strands = [...new Set(rows.map((r) => r.skill.strand))]

  return (
    <div className="parent-pane">
      <p className="muted">
        Switch a topic off if it has not been taught at school yet. It is skipped in every game until you switch it back on, and results from before then will not count against her.
      </p>
      <div className="chips">
        {years.map((y) => (
          <button key={y} type="button" className={`chip${y === year ? ' selected' : ''}`} onClick={() => setYear(y)}>
            Year {y}
          </button>
        ))}
      </div>
      {strands.map((strand) => (
        <section className="card" key={strand}>
          <h3>{strand}</h3>
          {rows
            .filter((r) => r.skill.strand === strand)
            .map((r) => (
              <label className="switch-row" key={r.skill.id}>
                <span className="sr-main">
                  <strong>{r.skill.name}</strong>
                  <small className="muted">
                    {TIER_LABEL[r.tier]}
                    {r.notTaught ? (r.stats?.notTaughtSource === 'learner' ? ' · she flagged it as not covered' : ' · switched off by you') : ''}
                  </small>
                </span>
                {r.notTaught && <Pill tone="warn">Off</Pill>}
                <input type="checkbox" className="switch" checked={!r.notTaught} onChange={(e) => set(r.skill.id, e.target.checked)} aria-label={`${r.skill.name} covered in class`} />
              </label>
            ))}
        </section>
      ))}
    </div>
  )
}
