import { BADGES } from '@/engine/badges'
import { K, logistic } from '@/engine/mastery'
import { levelFromXp } from '@/engine/points'
import type { SessionSummary } from '@/engine/session'
import { useApp, useLearner } from '@/app/context'
import { Icon } from '@/ui/icons'
import { Bar, Ring } from '@/ui/primitives'
import type { GameDef, GameLaunch } from './types'

const pct = (theta: number) => Math.round(logistic(K * (theta - 3)) * 100)

function verdict(s: SessionSummary, game: GameDef): string {
  if (game.shell === 'scan') return s.weak.length ? 'Found some things worth another look' : 'Solid across the board'
  if (s.answered === 0) return 'Come back any time'
  const r = s.correct / s.answered
  if (r >= 0.9) return 'Brilliant round!'
  if (r >= 0.7) return 'Strong work!'
  if (r >= 0.5) return 'Good effort - it is getting there'
  return 'Tough one - that is how you improve'
}

export function Summary({
  summary,
  game,
  launch,
  onAgain,
  onHome,
  onPractise,
}: {
  summary: SessionSummary
  game: GameDef
  launch: GameLaunch
  onAgain: () => void
  onHome: () => void
  onPractise: (skills: string[]) => void
}) {
  const { registry } = useApp()
  const state = useLearner()
  const lv = levelFromXp(state.xp)
  const deltas = Object.entries(summary.skillDeltas)
    .map(([id, [a, b]]) => ({ id, name: registry.graph.get(id).name, before: pct(a), after: pct(b) }))
    .sort((x, y) => Math.abs(y.after - y.before) - Math.abs(x.after - x.before))
    .slice(0, 5)
  const weak = summary.weak.map((id) => registry.graph.get(id))
  const yearTag = (year: number) => (year < 7 ? `Year ${year} building block` : `Year ${year}`)

  return (
    <div className="screen summary" style={{ ['--accent' as string]: game.color }}>
      <div className="sum-hero">
        <Ring value={summary.answered ? summary.correct / summary.answered : 0} size={112} stroke={10} tone="good">
          <div className="ring-big">
            {summary.correct}
            <small>/{summary.answered}</small>
          </div>
        </Ring>
        <h1>{verdict(summary, game)}</h1>
        <div className="xp-total">+{summary.xp} XP</div>
        <div className="lvl-line">
          Level {lv.level} · {lv.into}/{lv.span} XP to level {lv.level + 1}
        </div>
        <Bar value={lv.progress} tone="xp" label="Progress to next level" />
      </div>

      {summary.bestCombo >= 3 && (
        <div className="card row">
          <Icon name="flame" />
          <span>Best combo: {summary.bestCombo} in a row</span>
        </div>
      )}

      {summary.newBadges.length > 0 && (
        <div className="card">
          <h3>New badges</h3>
          <div className="badge-row">
            {summary.newBadges.map((id) => {
              const b = BADGES.find((x) => x.id === id)
              return (
                <div key={id} className="badge earned">
                  <Icon name="star" size={26} />
                  <strong>{b?.name ?? id}</strong>
                  <small>{b?.description}</small>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {game.shell === 'scan' && (
        <div className="card">
          <h3>Worth another look</h3>
          {weak.length === 0 ? (
            <p className="muted">Nothing shaky turned up in this check. Nice.</p>
          ) : (
            <ul className="list">
              {weak.map((s) => (
                <li key={s.id}>
                  <span className="li-main">{s.name}</span>
                  <span className="muted">{yearTag(s.year)}</span>
                </li>
              ))}
            </ul>
          )}
          {summary.strong.length > 0 && <p className="muted">Looking good: {summary.strong.length} topic{summary.strong.length === 1 ? '' : 's'} checked out fine.</p>}
          {weak.length > 0 && (
            <button type="button" className="btn primary big block" onClick={() => onPractise(weak.slice(0, 6).map((s) => s.id))}>
              Practise these
            </button>
          )}
        </div>
      )}

      {deltas.length > 0 && game.shell !== 'scan' && (
        <div className="card">
          <h3>Topics you worked on</h3>
          {deltas.map((d) => (
            <div className="delta" key={d.id}>
              <div className="delta-top">
                <span>{d.name}</span>
                <span className={d.after > d.before ? 'up' : d.after < d.before ? 'down' : 'muted'}>
                  {d.after > d.before ? '▲' : d.after < d.before ? '▼' : '•'} {d.after}%
                </span>
              </div>
              <Bar value={d.after / 100} tone={d.after > d.before ? 'good' : 'accent'} />
            </div>
          ))}
        </div>
      )}

      {summary.parts.length > 0 && (
        <div className="card">
          <h3>Where your XP came from</h3>
          <ul className="list tight">
            {summary.parts.map((p) => (
              <li key={p.code}>
                <span className="li-main">{p.label}</span>
                <strong>{p.points > 0 ? `+${p.points}` : p.points}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="actions">
        <button type="button" className="btn primary big block" onClick={onAgain}>
          {launch.focus ? 'Keep practising' : 'Play again'}
        </button>
        <button type="button" className="btn ghost big block" onClick={onHome}>
          Home
        </button>
      </div>
    </div>
  )
}
