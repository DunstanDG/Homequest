/**
 * The calm Today pieces (0.18): the one "Next up" card, the count-up progress ring, the "First, then" strip, the
 * focus control and the Fresh start button and sheet. The decisions behind them are in family/calmToday.ts and
 * family/freshStart.ts.
 */
import { useState } from 'react'
import { useApp, useFamily, useMe } from '@/app/context'
import type { FocusMode } from '@/app/calm'
import type { TaskRow } from '@/family/calendar'
import type { FirstThen } from '@/family/calmToday'
import { dayName } from '@/family/dates'
import { freshStartEvents, freshStartPlan, freshStartSummary } from '@/family/freshStart'
import type { MemberId, TaskEvent, Ymd } from '@/family/types'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'
import { KIND_EMOJI } from './shared'

/** "3 done today" with a ring that fills a little with each one (full at three) and never goes back. */
export function DoneToday({ n }: { n: number }) {
  const v = Math.min(1, n / 3)
  const r = 9
  const c = 2 * Math.PI * r
  return (
    <span className="done-today" aria-label={n ? `${n} done today` : 'Nothing ticked off yet'}>
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        <circle cx="11" cy="11" r={r} className="dt-track" />
        <circle cx="11" cy="11" r={r} className="dt-fill" strokeDasharray={`${c * v} ${c}`} transform="rotate(-90 11 11)" />
      </svg>
      <span>{n ? `${n} done today` : 'Ready when you are'}</span>
    </span>
  )
}

const FOCUS_OPTS: { id: FocusMode; label: string }[] = [
  { id: 'one', label: 'One thing' },
  { id: 'three', label: 'Three' },
  { id: 'all', label: 'Everything' },
]

/** How much of the list to show. Saved on this phone (calm settings). */
export function FocusControl({ value, onChange }: { value: FocusMode; onChange: (v: FocusMode) => void }) {
  return (
    <div className="focus-seg" role="group" aria-label="How much to show">
      {FOCUS_OPTS.map((o) => (
        <button key={o.id} type="button" aria-pressed={value === o.id} className={value === o.id ? 'on' : undefined} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** "First: Maths sheet → Then: free time 🎮" */
export function FirstThenStrip({ ft }: { ft: FirstThen }) {
  return (
    <p className="first-then">
      <span>
        <small>First</small> <strong>{ft.first}</strong>
      </span>
      <span aria-hidden="true" className="ft-arrow">
        →
      </span>
      <span>
        <small>Then</small> <strong>{ft.then}</strong> <span aria-hidden="true">{ft.emoji}</span>
      </span>
    </p>
  )
}

const detailOf = (r: TaskRow): string => {
  const t = r.task
  const bits: string[] = []
  if (t.subject && t.kind === 'homework') bits.push(t.subject)
  if (t.time) bits.push(t.time)
  if (t.minutes) bits.push(`about ${t.minutes} min`)
  if (r.overdue) bits.push('from before')
  else if (r.dueIn === 1) bits.push('for tomorrow')
  else if (r.dueIn !== undefined && r.dueIn > 1) bits.push(`for ${dayName(t.date!)}`)
  if (t.coins > 0) bits.push(`${t.coins} coins`)
  return bits.join(' · ')
}

/** The one thing to do now, with Start (the focus timer), Done and Not now. */
export function NextUpCard({ row, canTick, ft, onStart, onDone, onNotNow, onOpen }: { row: TaskRow; canTick: boolean; ft?: FirstThen; onStart: () => void; onDone: () => void; onNotNow?: () => void; onOpen: () => void }) {
  const t = row.task
  const redo = row.done?.status === 'rejected'
  return (
    <section className="card next-up" aria-label="Next up">
      <p className="eyebrow">{ft ? 'First' : 'Next up'}</p>
      <button type="button" className="nu-main" onClick={onOpen}>
        <span className="nu-emoji" aria-hidden="true">
          {KIND_EMOJI[t.kind]}
        </span>
        <span>
          <strong>{t.title}</strong>
          <small>{[detailOf(row), redo ? (row.done?.checkNote ? `have another go: ${row.done.checkNote}` : 'have another go') : ''].filter(Boolean).join(' · ')}</small>
        </span>
      </button>
      {ft && (
        <p className="nu-then">
          <small>Then</small> <strong>{ft.then}</strong> <span aria-hidden="true">{ft.emoji}</span>
        </p>
      )}
      {canTick && (
        <div className="btn-row nu-actions">
          <button type="button" className="btn primary" onClick={onStart}>
            <Icon name="timer" size={18} /> Start
          </button>
          <button type="button" className="btn" onClick={onDone}>
            <Icon name="check" size={18} /> Done
          </button>
          {onNotNow && (
            <button type="button" className="btn ghost" onClick={onNotNow}>
              Not now
            </button>
          )}
        </div>
      )}
    </section>
  )
}

/** "Fresh start": spread everything left over from before across the days from today, shown as a summary first. */
export function FreshStartButton({ memberIds, today, label = 'Fresh start', only, className = 'btn small' }: { memberIds: MemberId[]; today: Ymd; label?: string; only?: (t: TaskEvent) => boolean; className?: string }) {
  const f = useFamily()
  const me = useMe()!
  const { act, toast } = useApp()
  const [open, setOpen] = useState(false)
  const parent = me.role === 'parent'
  const plan = freshStartPlan(f, memberIds, today, { allowSomeday: parent, only })
  if (!plan.moves.length) return null
  const sum = freshStartSummary(plan, today)
  const go = () => {
    act(freshStartEvents(me.id, f, plan, Date.now()))
    setOpen(false)
    toast('A fresh start. Everything has a day now.')
  }
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        <Icon name="sparkle" size={16} /> {label}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Fresh start">
        <div className="item-detail fresh-start">
          <h3>{sum.title}</h3>
          <p className="muted">Things from before, spread out gently: no more than two a day, homework first and the quickest first.</p>
          {sum.lines.length > 0 && (
            <ul className="list tight">
              {sum.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          )}
          {sum.someday && <p className="note">{sum.someday}.</p>}
          <button type="button" className="btn primary big block" onClick={go}>
            <Icon name="check" size={20} /> Yes, do that
          </button>
          <button type="button" className="btn ghost block" onClick={() => setOpen(false)}>
            Not now
          </button>
        </div>
      </Sheet>
    </>
  )
}
