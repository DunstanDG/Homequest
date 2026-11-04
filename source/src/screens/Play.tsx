import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Session, type SessionSummary } from '@/engine/session'
import { useApp } from '@/app/context'
import { getGame, type GameDef, type GameLaunch } from '@/games'
import { QuestionGame } from '@/games/QuestionGame'
import { Summary } from '@/games/Summary'
import { Icon } from '@/ui/icons'

function launchFrom(sp: URLSearchParams, game: GameDef | undefined): GameLaunch {
  const focus = sp.get('focus')?.split(',').filter(Boolean)
  const mode = sp.get('mode') as GameLaunch['mode'] | null
  return {
    subject: sp.get('subject') ?? 'maths',
    focus: focus?.length ? focus : game?.defaultFocus,
    mode: mode ?? undefined,
    relaxed: sp.get('relaxed') === '1' ? true : undefined,
    examMode: sp.get('exam') === '1' ? true : undefined,
  }
}

/** Hosts one game session: intro card -> game -> summary. */
export function Play() {
  const { gameId } = useParams()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const { repo, registry, settings, updateSettings } = useApp()
  const game = getGame(gameId)
  const base = useMemo(() => launchFrom(sp, game), [sp, game])
  const [relaxed, setRelaxed] = useState(base.relaxed ?? settings.relaxedSprint ?? false)
  const [examMode, setExamMode] = useState(base.examMode ?? false)
  const [stage, setStage] = useState<'intro' | 'play' | 'done'>(sp.get('go') === '1' ? 'play' : 'intro')
  const [round, setRound] = useState(0)
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const sessionRef = useRef<{ round: number; session: Session } | null>(null)

  if (!game) return <div className="screen"><p>That game does not exist.</p></div>
  const launch: GameLaunch = { ...base, relaxed: game.shell === 'sprint' ? relaxed : undefined, examMode: examMode || undefined }

  const session = (() => {
    if (stage !== 'play') return null
    if (sessionRef.current?.round !== round) {
      const mode = launch.mode ?? (launch.focus?.length ? 'focus' : game.mode)
      sessionRef.current = {
        round,
        session: new Session({
          registry,
          store: repo,
          learnerId: repo.learnerId,
          subject: launch.subject,
          gameId: game.id,
          mode,
          length: game.length,
          allowRetry: game.allowRetry && mode !== 'diagnostic' && !launch.examMode,
          quickOnly: !!launch.examMode,
          focusSkills: launch.focus,
        }),
      }
    }
    return sessionRef.current.session
  })()

  const start = () => {
    if (game.shell === 'sprint') updateSettings({ relaxedSprint: relaxed })
    setSummary(null)
    setRound((r) => r + 1)
    setStage('play')
  }

  if (stage === 'play' && session) {
    const Game = game.Component ?? QuestionGame
    return (
      <Game
        key={round}
        session={session}
        game={game}
        launch={launch}
        onDone={(s) => {
          setSummary(s)
          setStage('done')
        }}
        onExit={() => nav('/learn', { replace: true })}
      />
    )
  }

  if (stage === 'done' && summary) {
    return (
      <Summary
        summary={summary}
        game={game}
        launch={launch}
        onAgain={start}
        onHome={() => nav('/learn', { replace: true })}
        onPractise={(skills) => nav(`/play/tower?subject=${launch.subject}&focus=${skills.join(',')}&go=1`, { replace: true })}
      />
    )
  }

  return <Intro game={game} launch={launch} relaxed={relaxed} setRelaxed={setRelaxed} examMode={examMode} setExamMode={setExamMode} onStart={start} onBack={() => nav(-1)} />
}

function Intro({
  game,
  launch,
  relaxed,
  setRelaxed,
  examMode,
  setExamMode,
  onStart,
  onBack,
}: {
  game: GameDef
  launch: GameLaunch
  relaxed: boolean
  setRelaxed: (v: boolean) => void
  examMode: boolean
  setExamMode: (v: boolean) => void
  onStart: () => void
  onBack: () => void
}) {
  const { registry } = useApp()
  const focusNames = launch.focus?.map((id) => registry.graph.get(id).name)
  return (
    <div className="screen intro" style={{ ['--accent' as string]: game.color }}>
      <button type="button" className="icon-btn back" onClick={onBack} aria-label="Back">
        <Icon name="back" />
      </button>
      <div className="intro-icon">
        <Icon name={game.icon} size={56} />
      </div>
      <h1>{game.name}</h1>
      <p className="lead">{game.tagline}</p>
      {focusNames && (
        <div className="card">
          <h3>Focus</h3>
          <p>{focusNames.join(', ')}</p>
        </div>
      )}
      <ul className="blurb">
        {game.blurb.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
      {game.shell === 'sprint' && !examMode && (
        <label className="toggle">
          <input type="checkbox" checked={relaxed} onChange={(e) => setRelaxed(e.target.checked)} />
          <span>Relaxed mode (no clock)</span>
        </label>
      )}
      {(game.shell === 'sprint' || game.shell === 'tower') && (
        <label className="toggle">
          <input type="checkbox" checked={examMode} onChange={(e) => setExamMode(e.target.checked)} />
          <span>Exam conditions (timed, no hints, no going back)</span>
        </label>
      )}
      {examMode && <p className="note">Real exam practice — questions lock once answered, no hints, and results show only at the end.</p>}
      <button type="button" className="btn primary big block" onClick={onStart}>
        Start
      </button>
    </div>
  )
}
