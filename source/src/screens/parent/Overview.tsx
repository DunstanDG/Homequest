import { useState } from 'react'
import { levelFromXp } from '@/engine/points'
import { TIER_LABEL, type Tier } from '@/engine/mastery'
import { gapsWithNames, lastDays, progressSummary, skillRows, strandProgress, topMisconceptions } from '@/engine/report'
import { useApp, useLearner, useNow } from '@/app/context'
import { Icon } from '@/ui/icons'
import { Pill } from '@/ui/primitives'
import { niceTag, shareText } from '@/ui/util'

const TIERS: Tier[] = ['mastered', 'secure', 'developing', 'learning', 'new']
const GAP_TEXT = {
  weak: 'Shaky - and it sits underneath topics she finds hard',
  unchecked: 'Not checked yet - worth a quick look',
  self: 'Building blocks look fine, so the topic itself likely needs explaining',
} as const

export function Overview({ subject }: { subject: string }) {
  const { registry } = useApp()
  const state = useLearner()
  const now = useNow()
  const [shareMsg, setShareMsg] = useState('')
  const week = lastDays(state, now, 7)
  const maxXp = Math.max(30, ...week.days.map((d) => d.xp))
  const lv = levelFromXp(state.xp)
  const rows = skillRows(state, registry, now, subject)
  const strands = strandProgress(rows, { years: [state.year] })
  const gaps = gapsWithNames(state, registry, now, subject).slice(0, 6)
  const slips = topMisconceptions(state, 5)
  const summaryText = progressSummary(state, registry, now, { subject })
  const secure = rows.filter((r) => r.hasContent && (r.tier === 'secure' || r.tier === 'mastered')).length
  const started = rows.filter((r) => r.hasContent && r.tier !== 'new').length
  const acc = state.totals.attempts ? Math.round((state.totals.correct / state.totals.attempts) * 100) : 0
  const minutes = Math.round(state.totals.timeMs / 60000)

  return (
    <div className="parent-pane">
      <section className="card">
        <div className="quest-top">
          <h3>This week</h3>
          <Pill tone="xp">
            {week.activeDays}/7 days
          </Pill>
        </div>
        <div className="wk-bars" role="img" aria-label="XP per day, last 7 days">
          {week.days.map((d) => (
            <div key={d.day} className="wk-col">
              <div className="wk-bar-wrap">
                <div className={`wk-bar${d.xp ? ' on' : ''}`} style={{ height: `${Math.max(3, (d.xp / maxXp) * 100)}%` }} />
              </div>
              <small>{new Date(`${d.day}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'narrow' })}</small>
              <small className="muted">{d.xp || ''}</small>
            </div>
          ))}
        </div>
        <ul className="facts">
          <li>
            <span>Questions this week</span>
            <strong>{week.attempts}</strong>
          </li>
          <li>
            <span>XP this week</span>
            <strong>{week.xp}</strong>
          </li>
          <li>
            <span>Level / total XP</span>
            <strong>
              {lv.level} / {state.xp}
            </strong>
          </li>
          <li>
            <span>Streak (best)</span>
            <strong>
              {state.streak.current} ({state.streak.best})
            </strong>
          </li>
          <li>
            <span>Overall accuracy</span>
            <strong>{acc}%</strong>
          </li>
          <li>
            <span>Time spent (all time)</span>
            <strong>{minutes} min</strong>
          </li>
        </ul>
      </section>

      <section className="card">
        <h3>Year {state.year} coverage</h3>
        <p className="muted">
          {secure} topics secure or mastered, {started} started so far.
        </p>
        {strands.map((s) => (
          <div key={s.strand} className="tier-row">
            <div className="tier-top">
              <span>{s.strand}</span>
              <small className="muted">{s.total} topics</small>
            </div>
            <div className="tier-bar" role="img" aria-label={TIERS.map((t) => `${s.tiers[t]} ${TIER_LABEL[t]}`).join(', ')}>
              {TIERS.map((t) => (s.tiers[t] ? <span key={t} className={`t-${t}`} style={{ flexGrow: s.tiers[t] }} /> : null))}
            </div>
          </div>
        ))}
        <div className="legend">
          {TIERS.map((t) => (
            <span key={t}>
              <i className={`t-${t}`} /> {TIER_LABEL[t]}
            </span>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Worth revisiting</h3>
        {gaps.length === 0 ? (
          <p className="muted">Nothing flagged yet. Gap Finder and regular practice will build this picture.</p>
        ) : (
          <ul className="list">
            {gaps.map((g) => (
              <li key={g.skillId} className="stack">
                <span className="li-main">
                  {g.skill.name} <small className="muted">{g.skill.year < 7 ? `Year ${g.skill.year} building block` : `Year ${g.skill.year}`}</small>
                </span>
                <small className="muted">{GAP_TEXT[g.status]}</small>
                {g.forNames.length > 0 && <small className="muted">Affects: {g.forNames.slice(0, 3).join(', ')}</small>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h3>Common slips</h3>
        {slips.length === 0 ? (
          <p className="muted">No repeated mistake patterns yet.</p>
        ) : (
          <ul className="list tight">
            {slips.map((m) => (
              <li key={m.tag}>
                <span className="li-main">{niceTag(m.tag)}</span>
                <strong>{m.count}x</strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h3>Share this update</h3>
        <pre className="summary-text">{summaryText}</pre>
        <button
          type="button"
          className="btn primary block"
          onClick={async () => {
            const r = await shareText(`${state.name}'s StudyQuest update`, summaryText)
            setShareMsg(r === 'copied' ? 'Copied to clipboard.' : r === 'shared' ? '' : 'Could not share - select the text and copy it.')
          }}
        >
          <Icon name="share" size={18} /> Share / copy
        </button>
        {shareMsg && <p className="note">{shareMsg}</p>}
      </section>
    </div>
  )
}
