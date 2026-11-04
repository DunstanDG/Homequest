/**
 * Today → "Plan for today": the home server's suggested plan for this person's day, any "on track?" questions it has
 * asked them, and their own settings for the morning overview and the questions. Hidden until a home server is set up.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, useFamily, useMe } from '@/app/context'
import * as A from '@/family/actions'
import { ymdOf } from '@/family/dates'
import * as T from '@/family/travel/actions'
import { ANSWER_TOAST, buttonsFor, dailyPrefsOf, dayPlanOf, nowAndNext, openNudges, PLAN_EMOJI, planRows, question, spareText, type NudgeButton } from '@/family/travel/daily'
import { serverOn } from '@/family/travel/travel'
import type { NudgeEvent, PlanBlock } from '@/family/travel/types'
import type { Member } from '@/family/types'
import { SectionHead } from '@/ui/fam'
import { childWarning } from '@/family/calmToday'

const SHOW = 5

function Row({ b, on }: { b: PlanBlock; on?: boolean }) {
  return (
    <li className={`dp-row${on ? ' on' : ''}`}>
      <span className="dp-time">{b.kind === 'travel' ? `leave ${b.start}` : b.start}</span>
      <span aria-hidden="true">{PLAN_EMOJI[b.kind]}</span>
      <span className="dp-title">
        {b.title}
        {b.guess && <small className="muted"> · time is a guess</small>}
        {b.disrupted && <small className="dp-warn"> · disrupted</small>}
      </span>
      <small className="muted">{b.kind === 'travel' ? `arrive ${b.end}` : `to ${b.end}`}</small>
    </li>
  )
}

function NudgeCard({ n, view }: { n: NudgeEvent; view: Member }) {
  const f = useFamily()
  const me = useMe()!
  const { act, toast } = useApp()
  const nav = useNavigate()
  const task = n.ref ? f.tasks[n.ref] : undefined
  const answer = (b: NudgeButton) => {
    const evs = T.replyNudge(me.id, n.nudgeId, b.answer, b.minutes)
    if (b.timer && task) {
      const { timerId, events } = A.startTimer(me.id, { memberId: view.id, label: task.title, plannedSec: (n.minutes || task.minutes || 20) * 60, taskId: task.taskId, taskDate: task.recur ? n.date : (task.date ?? 'any'), purpose: 'focus' })
      act([...evs, ...events])
      nav(`/timer/${timerId}`)
      return
    }
    if (b.tick && task) evs.push(...A.completeTask(me.id, f, task, task.recur ? n.date : (task.date ?? 'any')))
    act(evs)
    toast(ANSWER_TOAST[b.answer])
  }
  return (
    <div className="card nudge-card">
      <p>
        <strong>{n.kind === 'travel' ? 'Time to get ready' : 'On track?'}</strong>
        {view.id !== me.id && <small className="muted"> · for {view.name}</small>}
      </p>
      <p>{question(n)}</p>
      <div className="btn-row wrap">
        {buttonsFor(n, me.role === 'parent', !!task).map((b) => (
          <button key={b.label} type="button" className={`btn small ${b.primary ? 'primary' : 'ghost'}`} onClick={() => answer(b)}>
            {b.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Settings({ view, onClose }: { view: Member; onClose: () => void }) {
  const f = useFamily()
  const me = useMe()!
  const { act, toast } = useApp()
  const p = dailyPrefsOf(f, view.id)
  const [morning, setMorning] = useState(p.morning)
  const [at, setAt] = useState(p.morningAt)
  const [nudges, setNudges] = useState(p.nudges)
  const save = () => {
    act(T.saveDailyPrefs(me.id, { memberId: view.id, morning, morningAt: /^\d\d:\d\d$/.test(at) ? at : p.morningAt, nudges }))
    toast('Saved.')
    onClose()
  }
  return (
    <div className="dp-settings">
      <label className="switch-row">
        <span className="sr-main">
          <strong>Morning overview</strong>
          <small className="muted">A notification on {view.id === me.id ? 'your' : `${view.name}’s`} phone with the day ahead. Never on the speakers.</small>
        </span>
        <input type="checkbox" className="switch" checked={morning} onChange={(e) => setMorning(e.target.checked)} />
      </label>
      {morning && (
        <label className="field">
          <span>Send it at</span>
          <input type="time" className="tbox" value={at} onChange={(e) => setAt(e.target.value)} />
        </label>
      )}
      <label className="switch-row">
        <span className="sr-main">
          <strong>“On track?” questions</strong>
          <small className="muted">When homework, a job or leaving time comes up. At most 6 a day, none in quiet hours.</small>
        </span>
        <input type="checkbox" className="switch" checked={nudges} onChange={(e) => setNudges(e.target.checked)} />
      </label>
      <div className="btn-row">
        <button type="button" className="btn primary small" onClick={save}>
          Save
        </button>
        <button type="button" className="btn ghost small" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export function DayPlanBlock({ view, now }: { view: Member; now: number }) {
  const f = useFamily()
  const me = useMe()!
  const [all, setAll] = useState(false)
  const [settings, setSettings] = useState(false)
  if (!serverOn(f) || (view.role !== 'parent' && view.role !== 'child')) return null
  const today = ymdOf(now)
  const plan = dayPlanOf(f, view.id, today)
  const canAnswer = view.id === me.id || me.role === 'parent'
  const nudges = canAnswer ? openNudges(f, view.id, today, now) : []
  const rows = plan ? planRows(plan) : []
  const { now: cur, next, past } = nowAndNext(rows, now)
  const shown = all ? rows : next.slice(0, SHOW)
  const mine = view.id === me.id
  const grownUps = Object.values(f.members).filter((m) => m.active && m.role === 'parent').map((m) => m.name)
  return (
    <>
      <SectionHead
        title={mine ? 'Plan for today' : `${view.name}’s plan`}
        sub={plan ? `${spareText(plan.spareMin)} · suggested by the home server` : undefined}
        action={
          canAnswer && (
            <button type="button" className="link-btn" onClick={() => setSettings((s) => !s)} aria-expanded={settings}>
              {settings ? 'Close' : 'Settings'}
            </button>
          )
        }
      />
      {settings && <Settings view={view} onClose={() => setSettings(false)} />}
      {nudges.map((n) => (
        <NudgeCard key={n.nudgeId} n={n} view={view} />
      ))}
      {!plan ? (
        <p className="note">The home server writes {mine ? 'your' : 'the'} plan for today here each morning.</p>
      ) : (
        <div className="card day-plan">
          {cur && !all && (
            <ul className="dp-list">
              <Row b={cur} on />
            </ul>
          )}
          {shown.length > 0 ? (
            <ul className="dp-list">
              {shown.map((b, i) => (
                <Row key={`${b.start}${b.kind}${i}`} b={b} on={all && b === cur} />
              ))}
            </ul>
          ) : (
            !cur && <p className="muted">Nothing else planned today.</p>
          )}
          {me.role === 'parent'
            ? plan.warnings.slice(0, 2).map((w) => (
                <p key={w} className="dp-warn small">
                  ⚠️ {w}
                </p>
              ))
            : // Children never see clash or overload warnings; a tight gap is put calmly, and the grown-ups know.
              plan.warnings
                .map((w) => childWarning(w, grownUps))
                .filter((w): w is string => !!w)
                .slice(0, 1)
                .map((w) => (
                  <p key={w} className="muted small">
                    {w}
                  </p>
                ))}
          {(rows.length > shown.length + (cur && !all ? 1 : 0) || all) && (
            <button type="button" className="link-btn" onClick={() => setAll((a) => !a)}>
              {all ? 'Show what’s next' : `Show the whole day${past ? ` (${past} done)` : ''}`}
            </button>
          )}
        </div>
      )}
    </>
  )
}
