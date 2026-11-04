import { useState } from 'react'
import { uid } from '@/engine/rng'
import { useApp, useLearner, useViewedId } from '@/app/context'
import { makeEvent } from '@/app/events'
import { Icon } from '@/ui/icons'
import { Bar, Pill } from '@/ui/primitives'

/** Family reward goals: "1,500 XP = pizza night". They are events too, so they sync to her device. */
export function Goals() {
  const { repo } = useApp()
  const viewedId = useViewedId()
  const state = useLearner()
  const [label, setLabel] = useState('')
  const [target, setTarget] = useState('1500')
  const goals = Object.values(state.goals).sort((a, b) => b.createdTs - a.createdTs)
  const t = Number(target)
  const valid = label.trim().length > 0 && Number.isFinite(t) && t >= 20 && t <= 100000

  return (
    <div className="parent-pane">
      <p className="muted">Set a treat she can earn with XP from any game. Progress counts from the moment you create the goal, so repeated attempts and improvement over time all count towards it.</p>
      <section className="card">
        <h3>New goal</h3>
        <label className="field">
          <span>Reward</span>
          <input className="tbox" value={label} placeholder="e.g. Pizza night" onChange={(e) => setLabel(e.target.value)} />
        </label>
        <label className="field">
          <span>XP needed</span>
          <input className="tbox" inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value.replace(/\D/g, ''))} />
        </label>
        <p className="note">A 10-question Skill Tower run earns roughly 150 to 230 XP, and Sprints add more. 1,500 XP is about a week of near-daily practice; use 500 for a quick win.</p>
        <button
          type="button"
          className="btn primary block"
          disabled={!valid}
          onClick={() => {
            repo.apply([makeEvent(viewedId, { type: 'goal', goalId: uid('g'), label: label.trim(), xpTarget: t, active: true })])
            setLabel('')
          }}
        >
          <Icon name="gift" size={18} /> Add goal
        </button>
      </section>
      {goals.map((g) => {
        const got = Math.max(0, state.xp - g.baseline)
        return (
          <section className="card goal" key={g.id}>
            <div className="quest-top">
              <h3>{g.label}</h3>
              <Pill tone={!g.active ? 'neutral' : got >= g.xpTarget ? 'good' : 'xp'}>{!g.active ? 'Closed' : got >= g.xpTarget ? 'Earned!' : `${got}/${g.xpTarget} XP`}</Pill>
            </div>
            <Bar value={got / g.xpTarget} tone={got >= g.xpTarget ? 'good' : 'xp'} label={g.label} />
            <button type="button" className="btn ghost small" onClick={() => repo.apply([makeEvent(viewedId, { type: 'goal', goalId: g.id, label: g.label, xpTarget: g.xpTarget, active: !g.active })])}>
              {g.active ? (got >= g.xpTarget ? 'Mark as given' : 'Close goal') : 'Reopen'}
            </button>
          </section>
        )
      })}
    </div>
  )
}
