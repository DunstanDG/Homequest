/**
 * The weekly round table (0.14): everyone raises things beforehand, the family assistant goes through the coming week
 * and posts a short agenda with suggested fixes, and the family talks it over. See src/family/travel/roundTable.ts and
 * the home server's weekly.py. Since 0.18 these pieces are steps of the weekly plan (/week, WeekPlan.tsx), and
 * /round-table goes there.
 */
import { useEffect, useRef, useState } from 'react'
import { useApp, useFamily, useMe, useNow, useSyncStatus } from '@/app/context'
import { askGeminiForRoundTable } from '@/app/roundTableGemini'
import { hmOf, ymdOf } from '@/family/dates'
import * as T from '@/family/travel/actions'
import { currentRoundTable, notesFor, phaseOf, reviewLine, rtSettingsOf, scheduleFor, whenText, WEEKDAYS } from '@/family/travel/roundTable'
import { serverOn } from '@/family/travel/travel'
import type { RoundTableEvent } from '@/family/travel/types'
import { SectionHead, Seg } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { ProposalCard } from './Assistant'

const hours = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}` : `${min} min`)

export function Agenda({ rt }: { rt: RoundTableEvent }) {
  const f = useFamily()
  const a = rt.agenda!
  const props = a.proposals.map((id) => f.travel.proposals[id]).filter((p): p is NonNullable<typeof p> => !!p)
  return (
    <>
      <div className="card rt-agenda">
        <p className="rt-summary">{a.summary}</p>
        {a.points.length > 0 && (
          <ol className="rt-points">
            {a.points.map((p, i) => (
              <li key={i}>{p.text}</li>
            ))}
          </ol>
        )}
        <small className="muted">
          {rt.source === 'server' ? 'Put together by the home server (the assistant wasn’t available).' : rt.source === 'gemini' ? 'Written by Gemini from the home server’s plan for the week.' : 'From the family assistant.'}
        </small>
      </div>
      {props.length > 0 && (
        <>
          <SectionHead title="Suggested changes" sub="Nothing changes until someone taps Add." />
          {props.map((p) => (
            <ProposalCard key={p.proposalId} p={p} />
          ))}
        </>
      )}
    </>
  )
}

/** Things to raise for the round table (anyone can add one). `bare` leaves out the heading, for a step that has its own. */
export function Raise({ weekOf, bare }: { weekOf: string; bare?: boolean }) {
  const f = useFamily()
  const me = useMe()!
  const { act, toast } = useApp()
  const [text, setText] = useState('')
  const notes = notesFor(f, weekOf)
  const add = () => {
    if (!text.trim()) return
    act(T.addRoundTableNote(me.id, weekOf, text))
    setText('')
    toast('Added. Thanks for raising it.')
  }
  return (
    <>
      {bare ? <p className="note">Anyone can add something: a trip, a worry, a job to share out.</p> : <SectionHead title="Things to raise" sub="Anyone can add something: a trip, a worry, a job to share out." />}
      {notes.length > 0 && (
        <ul className="rt-notes">
          {notes.map((n) => (
            <li key={n.noteId}>
              <span className="grow">
                <strong>{f.members[n.learnerId]?.name ?? 'Someone'}:</strong> {n.text}
              </span>
              {(n.learnerId === me.id || me.role === 'parent') && (
                <button type="button" className="icon-btn small" aria-label="Remove" onClick={() => act(T.deleteRoundTableNote(me.id, n))}>
                  <Icon name="x" size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="row rt-add">
        <input className="tbox grow" maxLength={200} placeholder="e.g. Can we go swimming on Saturday?" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button type="button" className="btn primary" disabled={!text.trim()} onClick={add}>
          Add
        </button>
      </div>
    </>
  )
}

export function Week({ rt }: { rt: RoundTableEvent }) {
  const [open, setOpen] = useState<string>()
  const fx = rt.facts
  return (
    <>
      <SectionHead title="The week" sub={fx.issues.length ? fx.issues.length === 1 ? '1 thing doesn’t fit or clashes' : `${fx.issues.length} things don’t fit or clash` : 'Nothing clashes or is overloaded'} />
      <div className="card rt-week">
        {fx.days.map((d) => (
          <div key={d.date} className="rt-day">
            <button type="button" className="row-between rt-day-head" onClick={() => setOpen(open === d.date ? undefined : d.date)} aria-expanded={open === d.date}>
              <strong>{d.label}</strong>
              <small className={d.warnings.length ? 'dp-warn' : 'muted'}>{d.warnings.length ? `⚠️ ${d.warnings.length}` : '✓'}</small>
            </button>
            {open === d.date && (
              <div className="rt-day-body">
                {d.people.map((p) => (
                  <p key={p.name} className="small">
                    <strong>{p.name}</strong>
                    {p.school ? ' · school' : ''}
                    {p.fixed.length ? ` · ${p.fixed.join(', ')}` : ''} · must-dos {hours(p.mustdo)} · free {hours(p.free)}
                  </p>
                ))}
                {d.warnings.map((w) => (
                  <p key={w} className="small dp-warn">
                    ⚠️ {w}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {fx.learned.length > 0 && (
        <div className="card">
          <strong>Time estimates to check</strong>
          {fx.learned.map((c) => (
            <p key={c} className="small muted">
              {c}
            </p>
          ))}
        </div>
      )}
      {fx.review.people.length > 0 && (
        <>
          <SectionHead title="Last week" />
          <div className="card">
            {fx.review.people.map((r) => (
              <p key={r.name} className="small">
                <strong>{r.name}</strong>: {reviewLine(r)}
              </p>
            ))}
          </div>
        </>
      )}
    </>
  )
}

/** When the round table happens, and who writes the agenda (parents). */
export function RoundTableSettings() {
  const f = useFamily()
  const me = useMe()!
  const { act, toast } = useApp()
  const s = rtSettingsOf(f)
  const [on, setOn] = useState(s.on)
  const [day, setDay] = useState(s.weekday)
  const [at, setAt] = useState(s.at)
  const [engine, setEngine] = useState(s.engine)
  return (
    <details className="card rt-settings">
      <summary>When it happens and who writes it</summary>
      <label className="switch-row">
        <span className="sr-main">
          <strong>Weekly round table</strong>
          <small className="muted">The day before, everyone is asked if there’s anything to raise.</small>
        </span>
        <input type="checkbox" className="switch" checked={on} onChange={(e) => setOn(e.target.checked)} />
      </label>
      <div className="field">
        <span>Who writes the agenda</span>
        <Seg<'local' | 'gemini'>
          label="Who writes the agenda"
          value={engine}
          onChange={setEngine}
          options={[
            { id: 'local', label: '🏠 Home assistant' },
            { id: 'gemini', label: '✨ Gemini' },
          ]}
        />
      </div>
      <small className="muted rt-engine-note">
        {engine === 'gemini'
          ? 'The home server still works out the week; Gemini (Google) writes the agenda in seconds. It is sent the week’s events, warnings and the things raised, with everyone’s names swapped for “Person 1”, “Person 2”. It needs the round-table function in the family’s Supabase project. Gemini doesn’t make suggested changes you can Add; its ideas are in the agenda.'
          : 'The family assistant on the home server writes the agenda and can suggest changes to Add. Nothing leaves home.'}
      </small>
      <div className="grid2">
        <label className="field">
          <span>Day</span>
          <select className="tbox" value={day} onChange={(e) => setDay(Number(e.target.value))}>
            {WEEKDAYS.map((w, i) => (
              <option key={w} value={i}>
                {w}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Time</span>
          <input type="time" className="tbox" value={at} onChange={(e) => setAt(e.target.value)} />
        </label>
      </div>
      <button type="button" className="btn primary small" onClick={() => (act(T.saveRoundTableSettings(me.id, { on, weekday: day, at: /^\d\d:\d\d$/.test(at) ? at : s.at, engine })), toast('Saved.'))}>
        Save
      </button>
    </details>
  )
}

/** Waiting with Gemini chosen: normally done within a minute by the database trigger; a parent can also ask now. */
export function GeminiWaiting({ rt }: { rt: RoundTableEvent }) {
  const me = useMe()!
  const { demo } = useApp()
  const sync = useSyncStatus()
  const now = useNow(15_000)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string>()
  const tried = useRef(false)
  const ask = async () => {
    setBusy(true)
    setMsg(undefined)
    const r = await askGeminiForRoundTable(sync, rt.weekOf)
    setBusy(false)
    setMsg(r.ok ? (r.already ? 'It’s already been written: it will appear in a moment.' : 'Done: the agenda will appear in a moment.') : r.error)
  }
  // If it's been waiting a couple of minutes (the trigger isn't set up, or failed), a parent's phone asks once by itself.
  const stale = now - rt.ts > 2 * 60_000
  useEffect(() => {
    if (stale && me.role === 'parent' && !demo && !tried.current) {
      tried.current = true
      void ask()
    }
  }, [stale])
  return (
    <div className="note">
      <p>⏳ Gemini is writing the agenda from the home server’s plan for the week. It usually takes under a minute.</p>
      {me.role === 'parent' && (
        <button type="button" className="btn small" disabled={busy || demo} onClick={() => void ask()}>
          <Icon name="sparkle" size={16} /> {busy ? 'Asking Gemini…' : 'Ask Gemini now'}
        </button>
      )}
      {msg && <p className="small">{msg}</p>}
    </div>
  )
}

/** Where this week's round table is up to (only with the home server): when it happens, the assistant or Gemini
 * working on it, or its agenda. Nothing at all when there's no home server. */
export function RoundTableStatus() {
  const f = useFamily()
  const me = useMe()!
  const now = useNow(30_000)
  const today = ymdOf(now)
  if (!serverOn(f)) return null
  const s = rtSettingsOf(f)
  const rt = currentRoundTable(f, today)
  const phase = phaseOf(f, today, hmOf(now))
  return (
    <>
      {phase === 'off' && !rt && <p className="note">The round table is turned off.{me.role === 'parent' ? ' It can be turned on in the last step.' : ''}</p>}
      {(phase === 'later' || phase === 'raise') && !rt && (
        <p className="note">
          Next round table: <strong>{whenText(s)}</strong>. The assistant goes through the week, suggests fixes and lets everyone know when it’s ready.
        </p>
      )}
      {rt?.status === 'waiting' && (s.engine === 'gemini' ? <GeminiWaiting rt={rt} /> : <p className="note">⏳ The assistant is going through the week now. It takes a few minutes; everyone gets a notification when it’s ready.</p>)}
      {rt?.status === 'ready' && rt.agenda && <Agenda rt={rt} />}
    </>
  )
}

/** The week the round table's notes are for (the one its agenda covers, or the next one it will run for). */
export function useRoundTableWeek(): string {
  const f = useFamily()
  const today = ymdOf(useNow(60_000))
  return currentRoundTable(f, today)?.weekOf ?? scheduleFor(today, rtSettingsOf(f)).weekOf
}
