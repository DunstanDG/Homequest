import { useState } from 'react'
import * as A from '@/family/actions'
import { useApp, useFamily, useMe } from '@/app/context'
import { ago } from '@/family/dates'
import type { MemberId } from '@/family/types'
import { Avatar, Coins, MemberChips, SectionHead } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'
import { useBalance } from '@/screens/family/shared'

/** Everything waiting for a parent: homework and jobs to check, treat requests, and a way to add bonus coins. */
export function Approvals() {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const [bonus, setBonus] = useState(false)
  const [sendBack, setSendBack] = useState<{ taskId: string; date: string } | undefined>()
  const [note, setNote] = useState('')
  const pending = Object.values(f.done)
    .filter((d) => d.status === 'pending' && !f.tasks[d.taskId]?.dropped)
    .sort((a, b) => a.ts - b.ts)
  const buys = Object.values(f.redeems)
    .filter((r) => r.status === 'pending' || r.status === 'approved')
    .sort((a, b) => a.ts - b.ts)
  const now = Date.now()

  return (
    <div className="parent-pane">
      <SectionHead
        title="Homework and jobs to check"
        action={
          pending.length > 1 ? (
            <button
              type="button"
              className="btn small"
              onClick={() => (act(pending.flatMap((d) => A.checkTask(me.id, d.taskId, d.date, 'approved'))), toast(`${pending.length} approved.`))}
            >
              Approve all
            </button>
          ) : undefined
        }
      />
      {pending.length === 0 && <p className="note">Nothing to check.</p>}
      {pending.map((d) => {
        const t = f.tasks[d.taskId]
        const who = f.members[t?.assignee ?? d.by]
        return (
          <article key={d.eventId} className="card approval">
            <div className="ap-top">
              <Avatar m={who} size={34} />
              <div className="grow">
                <strong>{t?.title ?? 'Task'}</strong>
                <p className="muted small">
                  {who?.name} · {ago(d.ts, now)}
                  {d.minutes ? ` · took ${d.minutes} min` : ''}
                  {t?.subject ? ` · ${t.subject}` : ''}
                </p>
                {f.tasks[d.taskId]?.notes && <p className="note">{f.tasks[d.taskId]!.notes}</p>}
              </div>
              <Coins n={d.coins} />
            </div>
            <div className="btn-row">
              <button type="button" className="btn primary" onClick={() => act(A.checkTask(me.id, d.taskId, d.date, 'approved'))}>
                <Icon name="check" size={18} /> Approve
              </button>
              <button type="button" className="btn ghost" onClick={() => (setSendBack({ taskId: d.taskId, date: d.date }), setNote(''))}>
                <Icon name="undo" size={18} /> Send back
              </button>
            </div>
          </article>
        )
      })}

      <SectionHead title="Treat requests" />
      {buys.length === 0 && <p className="note">No requests.</p>}
      {buys.map((r) => {
        const who = f.members[r.memberId]
        return (
          <article key={r.id} className="card approval">
            <div className="ap-top">
              <Avatar m={who} size={34} />
              <div className="grow">
                <strong>
                  {r.emoji} {r.title}
                </strong>
                <p className="muted small">
                  {who?.name} · {ago(r.ts, now)}
                </p>
                {r.status === 'pending' && <OverdrawnNote memberId={r.memberId} />}
              </div>
              <Coins n={r.cost} />
            </div>
            <div className="btn-row">
              {r.status === 'pending' ? (
                <>
                  <button type="button" className="btn primary" onClick={() => (act(A.decideRedeem(me.id, r.id, 'approved')), toast('Approved. Coins spent.'))}>
                    <Icon name="check" size={18} /> Yes
                  </button>
                  <button type="button" className="btn ghost" onClick={() => (act(A.decideRedeem(me.id, r.id, 'declined')), toast('Declined. Coins returned.'))}>
                    Not this time
                  </button>
                </>
              ) : (
                <button type="button" className="btn" onClick={() => act(A.decideRedeem(me.id, r.id, 'given'))}>
                  <Icon name="gift" size={18} /> Mark as given
                </button>
              )}
            </div>
          </article>
        )
      })}

      <SectionHead title="Coins" />
      <div className="card">
        <p className="muted">Give a bonus for going above and beyond, or take coins off to correct a mistake.</p>
        <button type="button" className="btn primary" onClick={() => setBonus(true)}>
          <Icon name="coin" size={18} /> Bonus or adjustment
        </button>
      </div>
      <BonusSheet open={bonus} onClose={() => setBonus(false)} />

      <Sheet open={!!sendBack} onClose={() => setSendBack(undefined)} title="Send it back">
        <label className="field">
          <span>What needs another go? (optional)</span>
          <input className="tbox" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Questions 5-8 are missing" maxLength={120} autoFocus />
        </label>
        <button
          type="button"
          className="btn primary big block"
          onClick={() => {
            if (sendBack) act(A.checkTask(me.id, sendBack.taskId, sendBack.date, 'rejected', note))
            setSendBack(undefined)
          }}
        >
          Send back
        </button>
      </Sheet>
    </div>
  )
}

function BonusSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Bonus or adjustment">
      <BonusForm onDone={onClose} />
    </Sheet>
  )
}

function BonusForm({ onDone }: { onDone: () => void }) {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const kids = Object.values(f.members).filter((m) => m.active && m.role === 'child')
  const [who, setWho] = useState<MemberId | undefined>(kids[0]?.id)
  const [amount, setAmount] = useState('10')
  const [minus, setMinus] = useState(false)
  const [reason, setReason] = useState('')
  const bal = useBalance(who)
  const n = Math.max(0, Math.round(Number(amount) || 0))
  return (
    <>
      <MemberChips members={kids} value={who ? [who] : []} onChange={(v) => setWho(v[0])} />
      <div className="chips">
        <button type="button" className={`chip${!minus ? ' selected' : ''}`} onClick={() => setMinus(false)}>
          Add
        </button>
        <button type="button" className={`chip${minus ? ' selected' : ''}`} onClick={() => setMinus(true)}>
          Take off
        </button>
      </div>
      <div className="chips">
        {[5, 10, 20, 50].map((v) => (
          <button key={v} type="button" className={`chip small${Number(amount) === v ? ' selected' : ''}`} onClick={() => setAmount(String(v))}>
            {v}
          </button>
        ))}
      </div>
      <label className="field">
        <span>Coins</span>
        <input className="tbox" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, '').slice(0, 4))} />
      </label>
      <label className="field">
        <span>Reason</span>
        <input className="tbox" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Helped with the shopping" maxLength={80} />
      </label>
      {who && bal && <p className="note">Balance now {bal.available}. After: {bal.available + (minus ? -n : n)}.</p>}
      <button
        type="button"
        className="btn primary big block"
        disabled={!who || !n}
        onClick={() => {
          if (!who) return
          act(A.adjustCoins(me.id, who, minus ? -n : n, reason || (minus ? 'Adjustment' : 'Bonus')))
          toast(minus ? `${n} coins taken off.` : `${n} coins added.`)
          onDone()
        }}
      >
        Save
      </button>
    </>
  )
}

/** Two phones can both spend the same coins before they sync; warn the parent when the balance has gone below zero. */
function OverdrawnNote({ memberId }: { memberId: MemberId }) {
  const bal = useBalance(memberId)
  if (!bal || bal.available >= 0) return null
  return <p className="note warn">Not enough coins: {Math.abs(bal.available)} short after all requests. Decline one, or add a bonus first.</p>
}
