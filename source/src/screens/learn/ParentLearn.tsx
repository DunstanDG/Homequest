import { WeekDots } from '@/screens/family/rewards/WeekDots'
import { lastSevenDays } from '@/screens/family/rewards/rewardsLogic'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp, useFamily, useLearner, useLearnerOf, useNow } from '@/app/context'
import { unseenNewsCount } from '@/screens/News'
import { DAILY_QUEST_XP } from '@/app/config'
import { dayOf } from '@/engine/events'
import { levelFromXp } from '@/engine/points'
import type { Member } from '@/family/types'
import { Avatar } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Bar, Pill } from '@/ui/primitives'
import { recentSubjects, subjectEmoji, subjectProgress, weakestSkills } from './subjects'

/** What a parent sees first on the Learn tab: how each child is getting on today, with a way into their own games. */
export function ParentLearn({ onPlay }: { onPlay: () => void }) {
  const f = useFamily()
  const now = useNow()
  const kids = Object.values(f.members).filter((m) => m.active && m.role === 'child')
  const { settings } = useApp()
  const news = unseenNewsCount(useLearner(), settings)

  return (
    <div className="screen home lq-parent">
      <header className="home-head">
        <div>
          <p className="eyebrow">{new Date(now).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1>Learning</h1>
        </div>
        <div className="head-actions">
          {news > 0 && (
            <Link to="/news" className="icon-btn dotted" aria-label={`${news} new updates`}>
              <Icon name="bell" />
            </Link>
          )}
          <Link to="/parent?tab=progress" className="icon-btn" aria-label="Parent area: progress">
            <Icon name="lock" />
          </Link>
        </div>
      </header>

      <button type="button" className="card row lq-self" onClick={onPlay}>
        <Icon name="play" size={24} />
        <span className="grow">
          <strong>Play yourself</strong>
          <small className="muted">Your own games, subjects and daily quest</small>
        </span>
        <Icon name="chevron" size={20} />
      </button>

      {kids.length === 0 ? (
        <section className="card">
          <p className="muted">Add a child under Family to see their StudyQuest progress here.</p>
          <Link to="/parent?tab=family" className="btn small">
            <Icon name="users" size={16} /> Family
          </Link>
        </section>
      ) : (
        <>
          <h2 className="section">{kids.length === 1 ? 'Today' : 'The children today'}</h2>
          {kids.map((k) => (
            <KidCard key={k.id} m={k} now={now} />
          ))}
        </>
      )}
    </div>
  )
}

function KidCard({ m, now }: { m: Member; now: number }) {
  const { registry } = useApp()
  const st = useLearnerOf(m.id)
  const today = dayOf(now)
  const info = useMemo(() => {
    if (!st) return undefined
    const prog = subjectProgress(st, registry, now)
    let due = 0
    for (const p of prog.values()) due += p.due
    return { due, recent: recentSubjects(st, now).slice(0, 4), weak: weakestSkills(st, registry, now, 3) }
  }, [st, registry, now])

  if (!st || st.totals.attempts === 0) {
    return (
      <section className="card lq-kid">
        <div className="lq-kid-top">
          <Avatar m={m} size={36} />
          <strong className="grow">{m.name}</strong>
          <Pill>Not started</Pill>
        </div>
        <p className="muted small">No StudyQuest games played yet. Gap Finder is a good first go.</p>
      </section>
    )
  }

  const todayXp = st.xpByDay[today] ?? 0
  const done = todayXp >= DAILY_QUEST_XP
  const alive = st.streak.lastDay === today
  const playedOn = (d: string) => (st.xpByDay[d] ?? 0) > 0 || (st.attemptsByDay[d] ?? 0) > 0
  const weekN = lastSevenDays(playedOn, today).count
  const lv = levelFromXp(st.xp)
  const packName = (id: string) => registry.packs.get(id)?.name ?? id

  return (
    <section className="card lq-kid">
      <div className="lq-kid-top">
        <Avatar m={m} size={36} />
        <div className="grow">
          <strong>{m.name}</strong>
          <small className="muted">Level {lv.level}</small>
          <WeekDots played={playedOn} today={today} />
        </div>
        <span className={`lq-streak${alive ? ' alive' : ''}`} title={alive ? 'Played today' : 'Fancy a quick game?'}>
          {weekN} of the last 7 days ⭐
        </span>
      </div>

      <div className="quest-top">
        <span className="muted small">Daily quest</span>
        <Pill tone={done ? 'good' : 'xp'}>{done ? 'Complete' : `${todayXp}/${DAILY_QUEST_XP} XP`}</Pill>
      </div>
      <Bar value={todayXp / DAILY_QUEST_XP} tone={done ? 'good' : 'xp'} label={`${m.name}'s daily quest`} />

      {info && info.recent.length > 0 && (
        <div className="lq-kid-row">
          <span className="muted small">This week</span>
          <span className="lq-tags">
            {info.recent.map((r) => (
              <span key={r.subject} className="lq-tag" style={{ ['--accent' as string]: registry.packs.get(r.subject)?.color }}>
                {subjectEmoji(r.subject, packName(r.subject))} {packName(r.subject)} <b>{r.sessions}</b>
              </span>
            ))}
          </span>
        </div>
      )}
      {info && info.recent.length === 0 && <p className="muted small lq-kid-row">Nothing played in the last week.</p>}

      {info && info.weak.length > 0 && (
        <div className="lq-kid-row">
          <span className="muted small">Could use a hand</span>
          <ul className="lq-weak">
            {info.weak.map((r) => (
              <li key={r.skill.id}>
                <span aria-hidden="true">{subjectEmoji(r.skill.subject, packName(r.skill.subject))}</span> {r.skill.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="lq-kid-foot">
        {info && info.due > 0 ? <small className="muted">{info.due} topic{info.due === 1 ? '' : 's'} due for revision</small> : <span />}
        <Link to="/parent?tab=progress" className="btn ghost small">
          Full progress
        </Link>
      </div>
    </section>
  )
}
