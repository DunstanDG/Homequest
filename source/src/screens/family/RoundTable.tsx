/**
 * The weekly round table (0.14): everyone raises things beforehand, the family assistant goes through the coming week
 * and posts a short agenda with suggested fixes, and the family talks it over (parents can then go through the
 * weekly summit). See src/family/travel/roundTable.ts and the home server's weekly.py.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, useFamily, useMe, useNow } from '@/app/context'
import { hmOf, ymdOf } from '@/family/dates'
import * as T from '@/family/travel/actions'
import { currentRoundTable, notesFor, phaseOf, reviewLine, rtSettingsOf, scheduleFor, whenText, WEEKDAYS } from '@/family/travel/roundTable'
import { serverOn } from '@/family/travel/travel'
import type { RoundTableEvent } from '@/family/travel/types'
import { SectionHead } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { ProposalCard } from './Assistant'

const hours = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}` : `${min} min`)

function Agenda({ rt }: { rt: RoundTableEvent }) {
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
        <small className="muted">{rt.source === 'server' ? 'Put together by the home server (the assistant wasn’t available).' : 'From the family assistant.'}</small>
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

function Raise({ weekOf }: { weekOf: string }) {
  const f = useFamily()
  const me = useMe()!
  const { act, toast } = useApp()
  const [text, setText] = useState('')
  const notes = notesFor(f, weekOf)
  const add = () => {
    if (!text.trim()) return
    act(T.addRoundTableNote(me.id, weekOf, text))
    setText('')
    toast('Added for the round table.')
  }
  return (
    <>
      <SectionHead title="Things to raise" sub="Anyone can add something: a trip, a worry, a job to share out." />
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

function Week({ rt }: { rt: RoundTableEvent }) {
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

function Settings() {
  const f = useFamily()
  const me = useMe()!
  const { act, toast } = useApp()
  const s = rtSettingsOf(f)
  const [on, setOn] = useState(s.on)
  const [day, setDay] = useState(s.weekday)
  const [at, setAt] = useState(s.at)
  return (
    <details className="card rt-settings">
      <summary>When the round table happens</summary>
      <label className="switch-row">
        <span className="sr-main">
          <strong>Weekly round table</strong>
          <small className="muted">The day before, everyone is asked if there’s anything to raise.</small>
        </span>
        <input type="checkbox" className="switch" checked={on} onChange={(e) => setOn(e.target.checked)} />
      </label>
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
      <button type="button" className="btn primary small" onClick={() => (act(T.saveRoundTableSettings(me.id, { on, weekday: day, at: /^\d\d:\d\d$/.test(at) ? at : s.at })), toast('Saved.'))}>
        Save
      </button>
    </details>
  )
}

export function RoundTable() {
  const f = useFamily()
  const me = useMe()!
  const nav = useNavigate()
  const now = useNow(30_000)
  const today = ymdOf(now)
  const s = rtSettingsOf(f)
  const { weekOf } = scheduleFor(today, s)
  const rt = currentRoundTable(f, today)
  const phase = phaseOf(f, today, hmOf(now))
  const notesWeek = rt?.weekOf ?? weekOf
  return (
    <div className="screen round-table">
      <header className="screen-head">
        <button type="button" className="icon-btn" aria-label="Back" onClick={() => nav(-1)}>
          <Icon name="back" />
        </button>
        <div className="sh-title">
          <p className="eyebrow">Week ahead</p>
          <h1>Round table</h1>
        </div>
      </header>
      {!serverOn(f) ? (
        <p className="note">The round table is run by the family assistant on the home server, which isn’t set up yet.</p>
      ) : (
        <>
          {phase === 'off' && !rt && <p className="note">The round table is turned off.{me.role === 'parent' ? ' Turn it on below.' : ''}</p>}
          {(phase === 'later' || phase === 'raise') && !rt && (
            <p className="note">
              Next round table: <strong>{whenText(s)}</strong>. The assistant goes through the week, suggests fixes and lets everyone know when it’s ready.
            </p>
          )}
          {rt?.status === 'waiting' && <p className="note">⏳ The assistant is going through the week now. It takes a few minutes; everyone gets a notification when it’s ready.</p>}
          {rt?.status === 'ready' && rt.agenda && <Agenda rt={rt} />}
          <Raise weekOf={notesWeek} />
          {rt && <Week rt={rt} />}
          {me.role === 'parent' && (
            <>
              <button type="button" className="btn block" onClick={() => nav('/summit')}>
                Then go through the weekly summit
              </button>
              <Settings />
            </>
          )}
        </>
      )}
    </div>
  )
}
