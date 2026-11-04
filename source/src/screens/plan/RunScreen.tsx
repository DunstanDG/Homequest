import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as P from '@/family/planActions'
import { useApp, useFamily, useMe, useNow } from '@/app/context'
import { fmtDuration, hmOf, ymdOf } from '@/family/dates'
import { isLive, isStale, minLabel, runOf, runView, spareLabel, type RunState, type RunView } from '@/family/routines'
import { fmtClock } from '@/family/timers'
import { Icon } from '@/ui/icons'
import { Ring, Sheet, buzz } from '@/ui/primitives'
import { playChime, useWakeLock } from '@/ui/timers'

/** Steps whose time has run out and that have already chimed on this phone (survives the screen re-mounting). */
const CHIMED = new Set<string>()

/**
 * The live view of a session: one big step at a time, how long it has taken, what is next, and whether you are ahead of or
 * behind the time you have. Deliberately calm: one main button, and the numbers you need to decide whether to hurry.
 */
export function RunScreen() {
  const { id } = useParams()
  const nav = useNavigate()
  const { act, toast, settings } = useApp()
  const f = useFamily()
  const me = useMe()!
  const now = useNow(1000)
  const run = id ? runOf(f, id) : undefined
  const v = run ? runView(run, now) : undefined
  const [steps, setSteps] = useState(false)
  useWakeLock(run?.status === 'running')

  // One gentle chime when the current step's time is up.
  const stepKey = run && v?.current ? `${run.id}:${v.current.step.id}:${v.stepPlannedSec}` : undefined
  const timeUp = !!v?.current && v.stepLeftSec <= 0 && v.stepLeftSec > -30 && run?.status === 'running'
  useEffect(() => {
    if (!stepKey || !timeUp || CHIMED.has(stepKey)) return
    CHIMED.add(stepKey)
    if (!settings.quietTimers) {
      playChime()
      buzz([200, 100, 200])
    }
  }, [stepKey, timeUp, settings.quietTimers])

  if (!run || !v) {
    return (
      <div className="screen run-screen">
        <p>That session is not here any more.</p>
        <button type="button" className="btn primary" onClick={() => nav('/plan')}>
          Back to plan
        </button>
      </div>
    )
  }
  if (!isLive(run)) return <Summary run={run} v={v} onBack={() => nav('/plan')} />

  const cur = v.current
  const paused = run.status === 'paused'
  const over = v.stepLeftSec < 0
  const stale = isStale(run, now)
  const progress = v.stepPlannedSec ? Math.min(1, v.stepElapsedSec / v.stepPlannedSec) : 0

  const finish = (status: 'done' | 'skipped') => {
    if (!cur) return
    const evs = P.finishStep(me.id, f, run.id, cur.step.id, status, Date.now())
    if (!evs.length) return
    act(evs)
    buzz(status === 'done' ? 25 : 10)
    const took = fmtClock(v.stepElapsedSec)
    toast(status === 'done' ? `${cur.step.title} · ${took}` : `Skipped ${cur.step.title}`, { undo: () => act(P.undoEvents(me.id, evs)) })
  }

  return (
    <div className={`screen run-screen${over ? ' over' : ''}${paused ? ' paused' : ''}`}>
      <header className="screen-head">
        <button type="button" className="icon-btn" onClick={() => nav('/plan')} aria-label="Back to plan (the session keeps going)">
          <Icon name="back" />
        </button>
        <div className="sh-title">
          <p className="eyebrow">
            Session · step {Math.min(v.total, v.done + v.skipped + 1)} of {v.total}
          </p>
          <h1>
            {run.emoji ? `${run.emoji} ` : ''}
            {run.title}
          </h1>
        </div>
        <button type="button" className="icon-btn" onClick={() => setSteps(true)} aria-label="All steps">
          <Icon name="checklist" />
        </button>
      </header>

      <Timeline run={run} />

      <Overall v={v} />

      {stale && (
        <div className="card callout">
          <Icon name="info" size={22} />
          <div>
            <h3>Still going?</h3>
            <p className="muted">This has been open a long while. Carry on, or stop it so it does not sit here.</p>
            <button type="button" className="btn small" onClick={() => act(P.abandonRun(me.id, run.id))}>
              Stop this session
            </button>
          </div>
        </div>
      )}

      {cur && (
        <div className="run-current">
          <Ring value={progress} size={250} stroke={14} tone={over ? 'xp' : 'accent'}>
            <div className="run-face">
              <span className="run-emoji" aria-hidden="true">
                {cur.step.emoji ?? '▶️'}
              </span>
              <strong className="run-title">{cur.step.title}</strong>
              <span className="run-clock">
                {over ? '+' : ''}
                {fmtClock(Math.abs(v.stepLeftSec))}
              </span>
              <span className="run-sub">{paused ? 'Paused' : over ? 'over the planned time' : `of ${fmtClock(v.stepPlannedSec)} left`}</span>
            </div>
          </Ring>
          {cur.step.notes && <p className="muted run-notes pre">{cur.step.notes}</p>}
        </div>
      )}

      {v.next ? (
        <div className="run-next">
          <span className="eyebrow">Next</span>
          <strong>
            {v.next.step.emoji ? `${v.next.step.emoji} ` : ''}
            {v.next.step.title}
          </strong>
          <span className="muted">{minLabel(v.next.plannedSec / 60)}</span>
        </div>
      ) : (
        cur && (
          <div className="run-next last">
            <strong>Last step. Nearly there!</strong>
          </div>
        )
      )}

      <div className="run-actions">
        {paused ? (
          <>
            <button type="button" className="btn primary big" onClick={() => act(P.resumeRun(me.id, run.id))}>
              <Icon name="play" size={20} /> Resume
            </button>
            <button type="button" className="btn ghost" onClick={() => setSteps(true)}>
              Steps and options
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn primary big run-done" onClick={() => finish('done')}>
              <Icon name="check" size={22} /> Done
            </button>
            <div className="run-secondary">
              <button type="button" className="btn ghost" onClick={() => finish('skipped')}>
                Skip
              </button>
              <button type="button" className="btn ghost" onClick={() => act(P.extendRun(me.id, run.id, 60))}>
                <Icon name="plus" size={16} /> 1 min
              </button>
              <button type="button" className="btn ghost" onClick={() => act(P.pauseRun(me.id, run.id))}>
                <Icon name="pause" size={16} /> Pause
              </button>
            </div>
          </>
        )}
      </div>

      <StepsSheet open={steps} onClose={() => setSteps(false)} run={run} v={v} onDone={(stepId, status) => {
        const evs = P.finishStep(me.id, f, run.id, stepId, status, Date.now())
        if (evs.length) act(evs)
      }} onFinishNow={() => {
        act(P.finishEarly(me.id, f, run.id, Date.now()))
        setSteps(false)
      }} onStop={() => {
        act(P.abandonRun(me.id, run.id))
        setSteps(false)
      }} />
    </div>
  )
}

/** One segment per step: done, skipped, current, still to come. */
function Timeline({ run }: { run: RunState }) {
  const firstTodo = run.steps.findIndex((s) => s.status === 'todo')
  return (
    <div className="run-timeline" role="img" aria-label={`${run.steps.filter((s) => s.status !== 'todo').length} of ${run.steps.length} steps finished`}>
      {run.steps.map((s, i) => (
        <i key={s.step.id} className={`seg-${s.status}${i === firstTodo ? ' now' : ''}`} style={{ flexGrow: Math.max(1, s.plannedSec + s.extraSec) }} />
      ))}
    </div>
  )
}

/** The time picture: how long is left, when it will be done, and whether that is before the deadline. */
function Overall({ v }: { v: RunView }) {
  const done = hmOf(v.projectedEnd)
  const left = Math.max(0, Math.round(v.plannedLeftSec / 60))
  const spare = v.spareSec
  return (
    <div className="run-overall">
      <div>
        <small>Time left</small>
        <strong>{left < 1 ? '< 1 min' : fmtDuration(left)}</strong>
      </div>
      <div>
        <small>Done around</small>
        <strong>{done}</strong>
      </div>
      {v.run.finishBy && spare !== undefined ? (
        <div className={spare < 0 ? 'bad' : 'good'}>
          <small>By {v.run.finishBy}</small>
          <strong>{spareLabel(spare)}</strong>
        </div>
      ) : (
        <div className={v.driftSec > 60 ? 'bad' : v.driftSec < -60 ? 'good' : ''}>
          <small>Against plan</small>
          <strong>{v.done === 0 ? 'just started' : Math.abs(v.driftSec) < 60 ? 'on plan' : `${fmtDuration(Math.round(Math.abs(v.driftSec) / 60))} ${v.driftSec > 0 ? 'behind' : 'ahead'}`}</strong>
        </div>
      )}
    </div>
  )
}

function StepsSheet({ open, onClose, run, v, onDone, onFinishNow, onStop }: { open: boolean; onClose: () => void; run: RunState; v: RunView; onDone: (stepId: string, status: 'done' | 'skipped') => void; onFinishNow: () => void; onStop: () => void }) {
  const [confirm, setConfirm] = useState(false)
  useEffect(() => {
    if (!open) setConfirm(false)
  }, [open])
  return (
    <Sheet open={open} onClose={onClose} title="Steps">
      <ol className="run-steps">
        {run.steps.map((s, i) => {
          const isCur = v.current?.step.id === s.step.id
          return (
            <li key={s.step.id} className={`run-step ${s.status}${isCur ? ' cur' : ''}`}>
              <span className="rs-mark" aria-hidden="true">
                {s.status === 'done' ? '✓' : s.status === 'skipped' ? '–' : i + 1}
              </span>
              <span className="grow">
                <strong>
                  {s.step.emoji ? `${s.step.emoji} ` : ''}
                  {s.step.title}
                </strong>
                <small className="muted">
                  {s.status === 'todo' ? `${minLabel((s.plannedSec + s.extraSec) / 60)}${isCur ? ' · now' : ''}` : s.status === 'skipped' ? 'skipped' : `${fmtClock(s.activeSec ?? 0)} of ${fmtClock(s.plannedSec)}`}
                </small>
              </span>
              {s.status === 'todo' && (
                <span className="rs-actions">
                  <button type="button" className="btn small ghost" onClick={() => onDone(s.step.id, 'skipped')}>
                    Skip
                  </button>
                  <button type="button" className="btn small" onClick={() => onDone(s.step.id, 'done')}>
                    Done
                  </button>
                </span>
              )}
            </li>
          )
        })}
      </ol>
      <button type="button" className="btn block" onClick={onFinishNow}>
        Finish now (skip the rest)
      </button>
      <button type="button" className="btn danger block" onClick={() => (confirm ? onStop() : setConfirm(true))}>
        {confirm ? 'Tap again to stop' : 'Stop this session'}
      </button>
    </Sheet>
  )
}

/** After the last step: how long it really took against the plan, step by step. */
function Summary({ run, v, onBack }: { run: RunState; v: RunView; onBack: () => void }) {
  const nav = useNavigate()
  const { act } = useApp()
  const f = useFamily()
  const me = useMe()!
  const routine = run.routineId ? f.routines[run.routineId] : undefined
  const ended = run.status === 'abandoned'
  const took = Math.round(v.elapsedSec / 60)
  const planned = Math.round(v.plannedSec / 60)
  const diff = took - planned
  const task = routine?.taskId ? f.tasks[routine.taskId] : undefined
  const paid = task ? f.done[`${task.taskId}|${task.recur ? run.date : task.date ?? 'any'}`] : undefined
  const max = Math.max(1, ...run.steps.map((s) => Math.max(s.plannedSec, s.activeSec ?? 0)))
  return (
    <div className="screen run-screen summary">
      <header className="screen-head">
        <div className="sh-title">
          <p className="eyebrow">{ended ? 'Stopped' : 'Session complete'}</p>
          <h1>
            {run.emoji ? `${run.emoji} ` : ''}
            {run.title}
          </h1>
        </div>
      </header>
      <div className="run-trophy" aria-hidden="true">
        {ended ? '⏹️' : '🎉'}
      </div>
      <p className="run-big">{took < 1 ? 'Under a minute' : fmtDuration(took)}</p>
      <p className="lead run-verdict">
        {ended
          ? `${v.done} of ${v.total} steps done.`
          : diff <= -1
            ? `${fmtDuration(-diff)} quicker than the ${fmtDuration(planned)} planned. Nice.`
            : diff >= 1
              ? `${fmtDuration(diff)} over the ${fmtDuration(planned)} planned.`
              : `Right on the ${fmtDuration(planned)} planned.`}
        {!ended && v.skipped > 0 ? ` ${v.skipped} skipped.` : ''}
      </p>
      {paid && (
        <p className="pill tone-xp big-pill">
          {paid.status === 'pending' ? `${paid.coins} coins once a parent has checked` : `+${paid.coins} coins`}
        </p>
      )}
      <ul className="run-bars">
        {run.steps.map((s) => (
          <li key={s.step.id} className={s.status}>
            <span className="rb-name">
              {s.step.emoji ? `${s.step.emoji} ` : ''}
              {s.step.title}
            </span>
            <span className="rb-track" aria-hidden="true">
              <i className="plan" style={{ width: `${(s.plannedSec / max) * 100}%` }} />
              {s.status === 'done' && <i className={`real${(s.activeSec ?? 0) > s.plannedSec * 1.1 + 15 ? ' over' : ''}`} style={{ width: `${((s.activeSec ?? 0) / max) * 100}%` }} />}
            </span>
            <span className="rb-time">{s.status === 'skipped' ? 'skipped' : s.status === 'todo' ? '' : fmtClock(s.activeSec ?? 0)}</span>
          </li>
        ))}
      </ul>
      <div className="run-actions">
        <button type="button" className="btn primary big" onClick={onBack}>
          Done
        </button>
        {routine && (
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              const { runId, events } = P.startRun(me.id, me.id, P.runSourceFor(f, routine, ymdOf(Date.now())), Date.now())
              if (events.length) {
                act(events)
                nav(`/run/${runId}`, { replace: true })
              }
            }}
          >
            <Icon name="refresh" size={16} /> Go again
          </button>
        )}
      </div>
    </div>
  )
}
