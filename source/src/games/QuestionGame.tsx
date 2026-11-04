import { useCallback, useEffect, useRef, useState } from 'react'
import type { Answer, FeedbackCategory } from '@/engine/types'
import type { PlannedQuestion, SubmitResult } from '@/engine/session'
import { levelFromXp } from '@/engine/points'
import { BADGES } from '@/engine/badges'
import { useApp } from '@/app/context'
import { Rich } from '@/ui/rich'
import { Figure } from '@/ui/figures/Figure'
import { AnswerView } from '@/ui/answers/AnswerView'
import { FootContext } from '@/ui/foot'
import { Icon } from '@/ui/icons'
import { buzz } from '@/ui/primitives'
import { FeedbackSheet } from './FeedbackSheet'
import type { GameProps } from './types'

const PRAISE = ['Correct!', 'Nice one!', 'Spot on!', 'Yes!', 'Well done!', 'Got it!']

/**
 * The default question screen. It only knows how to show one question at a time and pass answers to
 * the Session; everything about WHAT to ask and how to score lives in the engine.
 */
export function QuestionGame({ session, game, launch, onDone, onExit }: GameProps) {
  const { repo } = useApp()
  const [q, setQ] = useState<PlannedQuestion | null>(null)
  const [phase, setPhase] = useState<'answer' | 'feedback' | 'timeup'>('answer')
  const [res, setRes] = useState<SubmitResult | null>(null)
  const [nudge, setNudge] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [hint, setHint] = useState<string | null>(null)
  const [flagOpen, setFlagOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [footEl, setFootEl] = useState<HTMLElement | null>(null)
  const [levelUp, setLevelUp] = useState<number | null>(null)
  const [, force] = useState(0)
  const startLevel = useRef(levelFromXp(repo.get().xp).level)
  const finished = useRef(false)
  const started = useRef(false)

  const timed = !!game.timeLimitSec && (launch.examMode || !launch.relaxed)
  const [remaining, setRemaining] = useState((game.timeLimitSec ?? 0) * 1000)

  const flash = useCallback((msg: string, ms = 2200) => {
    setToast(msg)
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), ms)
  }, [])

  const finish = useCallback(
    (completed?: boolean) => {
      if (finished.current) return
      finished.current = true
      onDone(session.finish(completed))
    },
    [session, onDone],
  )

  const resetQuestion = () => {
    setRes(null)
    setHint(null)
    setNudge(0)
    setAttempt(0)
    setPhase('answer')
  }

  const advance = useCallback(() => {
    if (finished.current) return
    const nq = session.next()
    if (!nq) return finish()
    setQ(nq)
    resetQuestion()
  }, [session, finish])

  // First question. (Not in StrictMode, so this runs once.)
  useEffect(() => {
    if (started.current) return
    started.current = true
    advance()
  }, [advance])

  // Sprint countdown: only runs while she is answering.
  useEffect(() => {
    if (!timed || phase !== 'answer' || flagOpen || !q) return
    const id = window.setInterval(() => setRemaining((r) => Math.max(0, r - 250)), 250)
    return () => window.clearInterval(id)
  }, [timed, phase, flagOpen, q])
  useEffect(() => {
    if (timed && remaining <= 0 && phase === 'answer' && !finished.current) {
      setPhase('timeup')
      const t = window.setTimeout(() => finish(false), 1100)
      return () => window.clearTimeout(t)
    }
  }, [timed, remaining, phase, finish])

  // Sprint: right answers roll straight on.
  useEffect(() => {
    if (game.shell === 'sprint' && phase === 'feedback' && res?.judgement.correct) {
      const t = window.setTimeout(advance, 650)
      return () => window.clearTimeout(t)
    }
  }, [game.shell, phase, res, advance])

  if (!q) return <div className="boot"><div className="spinner" /></div>
  const item = q.item
  const locked = phase !== 'answer'
  const good = !!res?.judgement.correct
  const retry = !!res?.canRetry
  const showHintBtn = !!item.hint && !hint && phase === 'answer' && game.shell === 'tower' && !launch.examMode

  const onSubmit = (answer: Answer) => {
    if (phase !== 'answer') return
    const r = session.submit(answer)
    if (r.unparseable) {
      setNudge((n) => n + 1)
      flash("Hmm, I couldn't read that. Check your answer and try again.")
      return
    }
    setRes(r)
    setPhase('feedback')
    if (r.canRetry) setHint(session.useHint() ?? null)
    buzz(r.judgement.correct ? 18 : [30, 40, 30])
    const lv = levelFromXp(repo.get().xp).level
    if (lv > startLevel.current) {
      startLevel.current = lv
      setLevelUp(lv)
    }
    if (r.newBadges.length) {
      const names = r.newBadges.map((id) => BADGES.find((b) => b.id === id)?.name ?? id)
      flash(`New badge: ${names.join(', ')}`, 3200)
    }
  }

  const onHint = () => {
    setHint(session.useHint() ?? null)
  }

  const onFlag = (cat: FeedbackCategory, note: string) => {
    const ev = session.flag(cat, note, res?.judgement.given)
    setFlagOpen(false)
    flash(ev.award.total > 0 ? `Thanks! +${ev.award.total} XP for helping` : 'Thanks, that helps!')
    if (!session.current) advance() // reported before answering: that question is dropped
    else force((n) => n + 1)
  }

  const onContinue = () => {
    if (levelUp) setLevelUp(null)
    if (retry) {
      setPhase('answer')
      setRes(null)
      setNudge(0)
      setAttempt((a) => a + 1)
      return
    }
    if (timed && remaining <= 0) return finish(false)
    advance()
  }

  const isLast = session.done
  const answered = session.answered
  const secs = Math.ceil(remaining / 1000)

  return (
    <div className={`qscreen shell-${game.shell}`} style={{ ['--accent' as string]: game.color }}>
      <header className="qhead">
        <button type="button" className="icon-btn" onClick={() => (finished.current ? onExit() : (finish(false), onExit()))} aria-label="Leave game">
          <Icon name="x" />
        </button>
        <div className="qprog">
          {game.shell === 'tower' && (
            <>
              <div className="pips" aria-label={`Floor ${Math.min(answered + 1, session.length)} of ${session.length}`}>
                {Array.from({ length: session.length }, (_, i) => (
                  <span key={i} className={`pip${i < answered ? ' done' : i === answered ? ' now' : ''}`} />
                ))}
              </div>
              <span className="qlabel">Floor {Math.min(answered + 1, session.length)}</span>
            </>
          )}
          {game.shell === 'sprint' && (
            <>
              <div className="timerbar">
                <div className="timerfill" style={{ width: timed ? `${(remaining / ((game.timeLimitSec ?? 1) * 1000)) * 100}%` : '100%' }} />
              </div>
              <span className="qlabel">{timed ? `${secs}s` : 'Relaxed'} · {session.correct} right</span>
            </>
          )}
          {game.shell === 'scan' && (
            <>
              <div className="pips slim">
                {Array.from({ length: session.length }, (_, i) => (
                  <span key={i} className={`pip${i < answered ? ' done' : i === answered ? ' now' : ''}`} />
                ))}
              </div>
              <span className="qlabel">{Math.min(answered + 1, session.length)} / {session.length}</span>
            </>
          )}
        </div>
        {session.combo >= 2 && (
          <span className="combo-chip" aria-label={`${session.combo} in a row`}>
            <Icon name="flame" size={16} /> {session.combo}
          </span>
        )}
        <button type="button" className="icon-btn" onClick={() => setFlagOpen(true)} aria-label="Report a problem with this question">
          <Icon name="flag" />
        </button>
      </header>

      <main className="qscroll">
        <div className="reason">{q.planned.reason}</div>
        <div className="prompt">
          <Rich text={item.prompt} />
        </div>
        {item.figure && <Figure figure={item.figure} />}
        {hint && (
          <div className="hintbox">
            <Icon name="bulb" size={20} />
            <Rich text={hint} />
          </div>
        )}
        {showHintBtn && (
          <button type="button" className="btn ghost small" onClick={onHint}>
            <Icon name="bulb" size={16} /> Hint <span className="muted">(worth less XP)</span>
          </button>
        )}
        <FootContext.Provider value={footEl}>
          <AnswerView key={`${item.id}:${attempt}`} item={item} locked={locked} judgement={res?.judgement} onSubmit={onSubmit} nudge={nudge} />
        </FootContext.Provider>
        <div className="qpad" />
      </main>

      <footer className="qfoot">
        <div ref={setFootEl} className="qfoot-slot" />
        {phase === 'feedback' && res && (
          <div className={`fpanel ${good ? 'good' : 'bad'}`} role="status">
            <div className="fhead">
              <Icon name={good ? 'check' : 'x'} size={22} />
              <strong>{good ? (res.attemptNo === 2 ? 'Got it this time!' : PRAISE[(answered + item.seed) % PRAISE.length]) : retry ? 'Not quite' : game.shell === 'scan' ? 'Good to know' : 'Not this time'}</strong>
              {res.award.total > 0 && <span className="xp-chip">+{res.award.total} XP</span>}
            </div>
            {!good && !retry && (
              <div className="fans">
                Answer: <Rich text={res.judgement.expected} />
              </div>
            )}
            {res.judgement.feedback && (
              <div className="fmsg">
                <Rich text={res.judgement.feedback} />
              </div>
            )}
            {retry && <div className="fmsg">Have another go - the hint is showing above.</div>}
            {!good && !retry && game.shell !== 'sprint' && (
              <div className="fexp">
                <Rich text={item.explanation} />
              </div>
            )}
            {good && game.shell !== 'sprint' && (
              <details className="fworking">
                <summary>See the working</summary>
                <Rich text={item.explanation} />
              </details>
            )}
            {game.shell !== 'sprint' && res.award.parts.length > 1 && (
              <div className="parts">
                {res.award.parts.map((p, i) => (
                  <span key={i} className="chip small xp">
                    {p.label} +{p.points}
                  </span>
                ))}
              </div>
            )}
            {levelUp && (
              <div className="levelup">
                <Icon name="sparkle" size={20} /> Level up! You are now level {levelUp}
              </div>
            )}
            {!(game.shell === 'sprint' && good) && (
              <button type="button" className="btn primary big block" onClick={onContinue}>
                {retry ? 'Try again' : isLast ? 'Finish' : 'Continue'}
              </button>
            )}
          </div>
        )}
      </footer>

      {phase === 'timeup' && (
        <div className="overlay">
          <div className="timeup">Time!</div>
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
      <FeedbackSheet open={flagOpen} onClose={() => setFlagOpen(false)} onSend={onFlag} />
    </div>
  )
}
