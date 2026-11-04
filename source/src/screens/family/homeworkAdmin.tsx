import { useState } from 'react'
import * as A from '@/family/actions'
import { useApp, useFamily, useMe } from '@/app/context'
import type { TaskDone, TaskEvent } from '@/family/types'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'
import { cancelTaskReminder, useBalance } from './shared'

const coinsWord = (n: number) => `${n} coin${n === 1 ? '' : 's'}`

/** Has this task been done and paid (or waiting to be)? */
export const doneOf = (f: ReturnType<typeof useFamily>, t: TaskEvent): TaskDone | undefined => {
  const d = f.done[`${t.taskId}|${t.date ?? 'any'}`]
  return d && d.status !== 'rejected' ? d : undefined
}

/**
 * "Not needed": for homework that was missed, set in error or is no longer wanted. It pays nothing and leaves every list. If it
 * had been ticked, waiting coins are cancelled and paid coins are taken back as far as the balance allows (never below zero).
 */
export function DropHomeworkSheet({ task, onClose }: { task: TaskEvent; onClose: () => void }) {
  const { act, toast, sync } = useApp()
  const f = useFamily()
  const me = useMe()!
  const bal = useBalance(task.assignee)
  const [why, setWhy] = useState('')
  const d = doneOf(f, task)
  const available = bal?.available ?? 0
  const paid = d?.status === 'approved' ? d.coins : 0
  const back = A.takeBackAmount({ coins: paid, status: d?.status ?? '' }, available)
  const go = () => {
    const r = A.dropHomework(me.id, task, d, available, why)
    act(r.events)
    void cancelTaskReminder(sync, task.taskId)
    toast(r.takenBack ? `Dropped. ${coinsWord(r.takenBack)} taken back${r.shortBy ? `, ${r.shortBy} had already been spent` : ''}.` : 'Dropped. It is in "Not needed" if you want it back.')
    onClose()
  }
  return (
    <Sheet open onClose={onClose} title="Not needed?">
      <p>
        <strong>
          {task.subject ? `${task.subject}: ` : ''}
          {task.title}
        </strong>{' '}
        will come off the list, the alerts and the counts, and pays no coins.
      </p>
      {d?.status === 'pending' && <p className="note">It was ticked and is waiting to be checked. That is cancelled, so no coins arrive.</p>}
      {paid > 0 && (
        <p className="note">
          {coinsWord(paid)} had been paid.{' '}
          {back >= paid
            ? `All ${paid} are taken back.`
            : back > 0
              ? `${back} of the ${paid} are taken back; the rest were already spent, and the balance stops at zero.`
              : 'They were already spent, so nothing can be taken back and the balance stays as it is.'}
        </p>
      )}
      <label className="field">
        <span>Why? (optional)</span>
        <input className="tbox" value={why} onChange={(e) => setWhy(e.target.value)} placeholder="e.g. teacher said to skip it" maxLength={120} />
      </label>
      <div className="btn-row">
        <button type="button" className="btn primary" onClick={go}>
          <Icon name="check" size={18} /> Not needed
        </button>
        <button type="button" className="btn ghost" onClick={onClose}>
          Keep it
        </button>
      </div>
    </Sheet>
  )
}

/** Un-ticking something that has been approved: say what happens to the coins first. */
export function UntickSheet({ task, done, onClose }: { task: TaskEvent; done: TaskDone; onClose: () => void }) {
  const { act, toast } = useApp()
  const me = useMe()!
  const bal = useBalance(done.payee ?? task.assignee)
  const available = bal?.available ?? 0
  const back = A.takeBackAmount(done, available)
  const go = () => {
    const r = A.untickTask(me.id, done, done.payee ?? task.assignee, available)
    act(r.events)
    toast(r.shortBy ? `Un-ticked. ${coinsWord(back)} taken back, the rest had been spent.` : 'Un-ticked.')
    onClose()
  }
  return (
    <Sheet open onClose={onClose} title="Un-tick this?">
      <p>
        <strong>{task.title}</strong> goes back on the list.{' '}
        {done.coins > 0
          ? back >= done.coins
            ? `The ${coinsWord(done.coins)} it paid are taken back.`
            : back > 0
              ? `${back} of its ${done.coins} coins are taken back; the rest were already spent, and the balance stops at zero.`
              : 'Its coins were already spent, so the balance stays as it is.'
          : ''}
      </p>
      <div className="btn-row">
        <button type="button" className="btn primary" onClick={go}>
          Un-tick
        </button>
        <button type="button" className="btn ghost" onClick={onClose}>
          Leave it ticked
        </button>
      </div>
    </Sheet>
  )
}

/** Dropped pieces for a child, with a way back. */
export function DroppedList({ childId }: { childId: string }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const dropped = Object.values(f.tasks)
    .filter((t) => !t.deleted && t.dropped && t.kind === 'homework' && t.assignee === childId)
    .sort((a, b) => (b.dropped!.at ?? 0) - (a.dropped!.at ?? 0))
  if (!dropped.length) return null
  return (
    <details className="card dropped-list">
      <summary>Not needed ({dropped.length})</summary>
      <ul className="list">
        {dropped.map((t) => (
          <li key={t.taskId} className="stack">
            <span className="li-main">
              {t.subject ? `${t.subject}: ` : ''}
              {t.title}
            </span>
            <small className="muted">{[t.date ? `was due ${t.date}` : '', t.dropped!.why ?? ''].filter(Boolean).join(' · ')}</small>
            {me.role === 'parent' && (
              <button type="button" className="btn small ghost" onClick={() => (act(A.restoreHomework(me.id, t)), toast('Back on the list.'))}>
                Restore
              </button>
            )}
          </li>
        ))}
      </ul>
    </details>
  )
}
