import { BADGES } from '@/engine/badges'
import { levelFromXp, xpToReach } from '@/engine/points'
import { useLearner } from '@/app/context'
import { Icon } from '@/ui/icons'
import { Bar, Pill, Ring } from '@/ui/primitives'

export function Rewards() {
  const state = useLearner()
  const lv = levelFromXp(state.xp)
  const earned = BADGES.filter((b) => state.badges[b.id])
  const goals = Object.values(state.goals).filter((g) => g.active)
  const acc = state.totals.attempts ? Math.round((state.totals.correct / state.totals.attempts) * 100) : 0

  return (
    <div className="screen">
      <h1>Rewards</h1>
      <section className="card level-card">
        <Ring value={lv.progress} size={120} stroke={11} tone="xp">
          <div className="ring-big">{lv.level}</div>
        </Ring>
        <div>
          <h3>Level {lv.level}</h3>
          <p className="muted">
            {state.xp} XP total. {xpToReach(lv.level + 1) - state.xp} XP to level {lv.level + 1}.
          </p>
        </div>
      </section>

      <section className="tiles">
        <div className="tile">
          <strong>{state.totals.correct}</strong>
          <small>right answers</small>
        </div>
        <div className="tile">
          <strong>{acc}%</strong>
          <small>accuracy</small>
        </div>
        <div className="tile">
          <strong>{state.streak.best}</strong>
          <small>best streak (days)</small>
        </div>
        <div className="tile">
          <strong>{state.totals.bestCombo}</strong>
          <small>best combo</small>
        </div>
      </section>

      {goals.length > 0 && (
        <>
          <h2 className="section">Family rewards</h2>
          {goals.map((g) => {
            const got = Math.max(0, state.xp - g.baseline)
            return (
              <div className="card goal" key={g.id}>
                <div className="quest-top">
                  <h3>
                    <Icon name="gift" size={20} /> {g.label}
                  </h3>
                  <Pill tone={got >= g.xpTarget ? 'good' : 'xp'}>{got >= g.xpTarget ? 'Earned!' : `${got}/${g.xpTarget} XP`}</Pill>
                </div>
                <Bar value={got / g.xpTarget} tone={got >= g.xpTarget ? 'good' : 'xp'} label={g.label} />
              </div>
            )
          })}
        </>
      )}

      <h2 className="section">
        Badges <small className="muted">{earned.length}/{BADGES.length}</small>
      </h2>
      <div className="badge-grid">
        {BADGES.map((b) => {
          const got = state.badges[b.id]
          return (
            <div key={b.id} className={`badge${got ? ' earned' : ''}`}>
              <Icon name={got ? 'star' : 'lock'} size={26} />
              <strong>{b.name}</strong>
              <small>{b.description}</small>
            </div>
          )
        })}
      </div>
    </div>
  )
}
