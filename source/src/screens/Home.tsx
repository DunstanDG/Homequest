import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { levelFromXp } from '@/engine/points'
import { skillRows } from '@/engine/report'
import { dayOf } from '@/engine/events'
import { useApp, useFamily, useLearner, useMe, useNow } from '@/app/context'
import { useBalance } from '@/screens/family/shared'
import { DAILY_QUEST_XP } from '@/app/config'
import { GAMES } from '@/games'
import { Icon } from '@/ui/icons'
import { SectionHead } from '@/ui/fam'
import { Bar, Pill, Ring } from '@/ui/primitives'
import { WeekDots } from './family/rewards/WeekDots'
import { lastSevenDays, weekCopy } from './family/rewards/rewardsLogic'
import { unseenNewsCount } from './News'
import { ParentLearn } from './learn/ParentLearn'
import { SubjectGrid } from './learn/SubjectGrid'
import { ALL, gameFits, gameSubject, mixedPick, spellingFits, subjectProgress, type Focus } from './learn/subjects'

/** A parent who tapped "Play yourself" stays in their own view while they hop into a game and back (until reload). */
let parentPlaying = false

/** The Learn tab: parents land on the children's progress; children (and parents playing) get their own StudyQuest. */
export function Home() {
  const me = useMe()
  const [self, setSelf] = useState(parentPlaying)
  const isParent = me?.role === 'parent'
  if (isParent && !self) {
    return (
      <ParentLearn
        onPlay={() => {
          parentPlaying = true
          setSelf(true)
        }}
      />
    )
  }
  return (
    <LearnerHome
      onKids={
        isParent
          ? () => {
              parentPlaying = false
              setSelf(false)
            }
          : undefined
      }
    />
  )
}

/** The selected subject, or 'all' for the mixed quest (remembered in settings.subject, which Skills shares). */
function useFocus(): [Focus, (f: Focus) => void] {
  const { registry, settings, updateSettings } = useApp()
  const s = settings.subject
  const focus: Focus = s && registry.packs.has(s) ? s : ALL
  return [focus, (f) => updateSettings({ subject: f })]
}

function LearnerHome({ onKids }: { onKids?: () => void }) {
  const nav = useNavigate()
  const { registry, settings } = useApp()
  const state = useLearner()
  const now = useNow()
  const [focus, setFocus] = useFocus()
  const lv = levelFromXp(state.xp)
  const today = dayOf(now)
  const todayXp = state.xpByDay[today] ?? 0
  const questDone = todayXp >= DAILY_QUEST_XP
  const progress = useMemo(() => subjectProgress(state, registry, now), [state, registry, now])
  const order = useMemo(() => [...registry.packs.keys()], [registry])
  const pick = mixedPick(progress, order)
  const focused = focus === ALL ? undefined : registry.pack(focus)
  /** The subject a launch from here uses: the focused one, or today's mixed pick. */
  const playSubject = focused?.id ?? pick
  const pickName = registry.pack(pick).name

  // Revision: in the focused subject, or (mixed) the subject with the most due.
  const reviseSubject = focused?.id ?? [...progress.values()].sort((a, b) => b.due - a.due)[0]?.id ?? pick
  const dueTotal = focused ? (progress.get(focused.id)?.due ?? 0) : [...progress.values()].reduce((s, p) => s + p.due, 0)
  const due = useMemo(() => (dueTotal ? skillRows(state, registry, now, reviseSubject).filter((r) => r.due && r.hasContent && !r.notTaught) : []), [dueTotal, state, registry, now, reviseSubject])

  const played = (id: string) => state.sessions.some((s) => s.gameId === id)
  const newHere = state.totals.attempts === 0
  const streakAlive = state.streak.lastDay === today
  const playedOn = (d: string) => (state.xpByDay[d] ?? 0) > 0 || (state.attemptsByDay[d] ?? 0) > 0
  const week = weekCopy(lastSevenDays(playedOn, today).count, playedOn(today))
  const goals = Object.values(state.goals).filter((g) => g.active)
  const news = unseenNewsCount(state, settings)
  const f = useFamily()
  const me = useMe()
  const bal = useBalance(state.learnerId)
  const games = GAMES.filter((g) => gameFits(g, focus))
  const fp = focused ? progress.get(focused.id) : undefined

  return (
    <div className="screen home" style={focused ? { ['--accent' as string]: focused.color } : undefined}>
      <header className="home-head">
        <div>
          <p className="eyebrow">{new Date(now).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1>Hi {me?.name ?? state.name}</h1>
        </div>
        <div className="head-actions">
          {onKids && (
            <button type="button" className="icon-btn" aria-label="Children's progress" onClick={onKids}>
              <Icon name="users" />
            </button>
          )}
          {news > 0 && (
            <Link to="/news" className="icon-btn dotted" aria-label={`${news} new updates`}>
              <Icon name="bell" />
            </Link>
          )}
          <Link to="/parent" className="icon-btn" aria-label="Parent area">
            <Icon name="lock" />
          </Link>
        </div>
      </header>

      <section className="stat-row">
        <Link to="/rewards" className="stat">
          <Ring value={lv.progress} size={58} stroke={6} tone="xp">
            <span className="lvl">{lv.level}</span>
          </Ring>
          <div>
            <strong>Level {lv.level}</strong>
            <small>{lv.span - lv.into} XP to go</small>
          </div>
        </Link>
        <div className="stat">
          <div className={`streak-ic${streakAlive ? ' alive' : ''}`}>
            <Icon name="flame" size={30} />
          </div>
          <div>
            <strong>{week.head}</strong>
            <small>{week.sub}</small>
            <WeekDots played={playedOn} today={today} />
          </div>
        </div>
      </section>

      <section className={`card quest${questDone ? ' done' : ''}`}>
        <div className="quest-top">
          <h3>Daily quest</h3>
          <Pill tone={questDone ? 'good' : 'xp'}>{questDone ? 'Complete' : `${todayXp}/${DAILY_QUEST_XP} XP`}</Pill>
        </div>
        <Bar value={todayXp / DAILY_QUEST_XP} tone={questDone ? 'good' : 'xp'} label="Daily quest progress" />
        <p className="muted">{questDone ? 'Nice work today. Anything extra is a bonus.' : `Earn ${DAILY_QUEST_XP - todayXp} more XP today.`}</p>
        <button type="button" className="btn primary block lq-quest-go" onClick={() => nav(`/play/tower?subject=${playSubject}&go=1`)}>
          <Icon name="play" size={18} />
          {focused ? `Play ${focused.name}` : `Mixed quest: ${pickName}`}
        </button>
      </section>

      <SectionHead
        title="Subjects"
        action={
          <Link to="/skills" className="btn ghost small">
            <Icon name="map" size={16} /> Skills
          </Link>
        }
      />
      <SubjectGrid registry={registry} progress={progress} focus={focus} questValue={todayXp / DAILY_QUEST_XP} onFocus={setFocus} />
      {focused && fp && (
        <p className="note lq-focus-note">
          {focused.tagline} · {fp.secure} of {fp.total} skills secure{fp.started ? `, ${fp.started} started` : ''}.
        </p>
      )}

      {newHere && (
        <section className="card callout">
          <Icon name="compass" size={28} />
          <div>
            <h3>New here? Start with Gap Finder</h3>
            <p className="muted">A short check so the games know where you are - and which older topics to revisit.</p>
            <button type="button" className="btn primary" onClick={() => nav(`/play/gaps?subject=${playSubject}`)}>
              Find my level{focused ? '' : ` in ${pickName}`}
            </button>
          </div>
        </section>
      )}

      {due.length > 0 && (
        <section className="card callout revise">
          <Icon name="refresh" size={28} />
          <div>
            <h3>
              {dueTotal} topic{dueTotal === 1 ? '' : 's'} ready for revision
            </h3>
            <p className="muted">
              {!focused && `${registry.pack(reviseSubject).name}: `}
              {due.slice(0, 3).map((r) => r.skill.name).join(', ')}
              {due.length > 3 ? '...' : ''}
            </p>
            <button type="button" className="btn primary" onClick={() => nav(`/play/tower?subject=${reviseSubject}&mode=review&go=1`)}>
              Revise now
            </button>
          </div>
        </section>
      )}

      <h2 className="section">{focused ? `${focused.name} games` : 'Games'}</h2>
      {!focused && <p className="note lq-games-note">Mixed: each round goes to the subject that needs it most ({pickName} next). Tap a subject above to choose.</p>}
      <section className="games">
        {spellingFits(focus) && (
          <button type="button" className="gamecard" style={{ ['--accent' as string]: '#3ddc97' }} onClick={() => nav('/spelling')}>
            <span className="game-ic">
              <Icon name="pencil" size={30} />
            </span>
            <span className="game-txt">
              <strong>Spelling</strong>
              <small>Definition, hints, and words that come back until they stick</small>
            </span>
            {!Object.keys(state.spelling).length && <Pill tone="accent">New</Pill>}
            <Icon name="chevron" size={20} />
          </button>
        )}
        {games.map((g) => (
          <button key={g.id} type="button" className="gamecard" style={{ ['--accent' as string]: g.color }} onClick={() => nav(`/play/${g.id}?subject=${gameSubject(g, focus, pick)}`)}>
            <span className="game-ic">
              <Icon name={g.icon} size={30} />
            </span>
            <span className="game-txt">
              <strong>{g.name}</strong>
              <small>{g.tagline}</small>
            </span>
            {!played(g.id) && <Pill tone="accent">New</Pill>}
            <Icon name="chevron" size={20} />
          </button>
        ))}
      </section>

      <Link to="/shop" className="card row coin-link lq-coins">
        <Icon name="coin" size={28} />
        <div className="grow">
          <strong>{bal?.available ?? 0} coins</strong>
          <small className="muted">{f.economy.length ? 'Every XP you earn turns into coins you can spend on treats.' : 'Coins from playing start once a parent switches them on.'}</small>
        </div>
        <Icon name="chevron" size={20} />
      </Link>

      {goals.length > 0 && (
        <>
          <h2 className="section">Family rewards</h2>
          {goals.map((g) => {
            const got = Math.max(0, state.xp - g.baseline)
            return (
              <section className="card goal" key={g.id}>
                <div className="quest-top">
                  <h3>
                    <Icon name="gift" size={20} /> {g.label}
                  </h3>
                  <Pill tone={got >= g.xpTarget ? 'good' : 'xp'}>{got >= g.xpTarget ? 'Earned!' : `${got}/${g.xpTarget} XP`}</Pill>
                </div>
                <Bar value={got / g.xpTarget} tone={got >= g.xpTarget ? 'good' : 'xp'} label={g.label} />
              </section>
            )
          })}
        </>
      )}
    </div>
  )
}
