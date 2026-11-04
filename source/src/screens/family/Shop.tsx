import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as A from '@/family/actions'
import { useApp, useFamily, useLearnerOf, useMe } from '@/app/context'
import { canRedeem, goalTotal, ledgerFor } from '@/family/economy'
import { ago, ymdOf } from '@/family/dates'
import type { CoinGoalEvent, MemberId, Treat } from '@/family/types'
import { Coins, MemberChips, SectionHead } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Bar, Sheet } from '@/ui/primitives'
import { useBalance, usePeople } from './shared'

const STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: 'Waiting for a parent', tone: 'tone-warn' },
  approved: { label: 'Approved', tone: 'tone-good' },
  given: { label: 'Enjoyed', tone: 'tone-good' },
  declined: { label: 'Not this time', tone: 'tone-bad' },
  cancelled: { label: 'Cancelled', tone: '' },
}

/** Where coins from StudyQuest, homework and jobs are spent. */
export function Shop() {
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const nav = useNavigate()
  const people = usePeople().filter((p) => p.role === 'child' || p.id === me.id)
  const isParent = me.role === 'parent'
  const [viewId, setViewId] = useState<MemberId>(me.role === 'child' ? me.id : people.find((p) => p.role === 'child')?.id ?? me.id)
  const view = f.members[viewId] ?? me
  const mine = view.id === me.id
  const bal = useBalance(view.id)
  const learner = useLearnerOf(view.id)
  const [confirm, setConfirm] = useState<Treat | undefined>()
  const [showLedger, setShowLedger] = useState(false)
  const [giftGoal, setGiftGoal] = useState<CoinGoalEvent | undefined>()
  const [editGoal, setEditGoal] = useState<CoinGoalEvent | 'new' | undefined>()
  const goals = Object.values(f.goals).filter((g) => !g.deleted)
  const today = ymdOf(Date.now())
  const treats = Object.values(f.treats).filter((t) => !t.deleted && t.active).sort((a, b) => a.cost - b.cost)
  const ledger = useMemo(() => ledgerFor(f, view.id, learner?.xpByDay ?? {}), [f, view.id, learner])
  const requests = Object.values(f.redeems)
    .filter((r) => r.memberId === view.id)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 8)
  const econ = f.economy[f.economy.length - 1]
  const xpToday = learner?.xpByDay[today] ?? 0
  const capToday = econ ? Math.min(xpToday, econ.dailyCapXp) : 0
  const best = treats.find((t) => (bal?.available ?? 0) < t.cost && canRedeem(f, view.id, t, t.cost, today).ok)

  return (
    <div className="screen shop">
      <header className="screen-head">
        <button type="button" className="icon-btn" onClick={() => nav(-1)} aria-label="Back">
          <Icon name="back" />
        </button>
        <div className="sh-title">
          <p className="eyebrow">Rewards</p>
          <h1>Coin shop</h1>
        </div>
      </header>

      {people.length > 1 && <MemberChips members={people} value={[view.id]} onChange={(v) => setViewId(v[0] ?? me.id)} size="small" />}

      {!econ && (
        <div className="card callout">
          <Icon name="coin" size={26} />
          <div>
            <h3>Coins are not switched on yet</h3>
            <p className="muted">Once a parent starts them, StudyQuest points, homework and jobs all turn into coins for treats.</p>
            {isParent && (
              <button type="button" className="btn primary small" onClick={() => (act(A.setEconomy(me.id, { effectiveFrom: today })), toast('Coins start from today.'))}>
                Start coins today
              </button>
            )}
          </div>
        </div>
      )}

      <section className="card balance">
        <div className="bal-main">
          <span className="bal-num">
            <Icon name="coin" size={30} /> {bal?.available ?? 0}
          </span>
          <p className="muted">{mine ? 'coins to spend' : `${view.name}'s coins`}</p>
        </div>
        <ul className="bal-parts">
          <li>
            <strong>{bal?.learning ?? 0}</strong>
            <small>StudyQuest</small>
          </li>
          <li>
            <strong>{bal?.tasks ?? 0}</strong>
            <small>homework & jobs</small>
          </li>
          <li>
            <strong>{bal?.bonus ?? 0}</strong>
            <small>bonus</small>
          </li>
          <li>
            <strong>{(bal?.spent ?? 0) + (bal?.reserved ?? 0)}</strong>
            <small>spent</small>
          </li>
        </ul>
        {!!bal?.waiting && (
          <p className="note">
            <Icon name="clock" size={14} /> {bal.waiting} coins waiting for a parent to check homework or jobs.
          </p>
        )}
        {!!bal?.reserved && (
          <p className="note">
            <Icon name="clock" size={14} /> {bal.reserved} coins held for treat requests.
          </p>
        )}
      </section>

      {econ && view.role === 'child' && (
        <section className="card earn">
          <h3>How coins are earned</h3>
          <ul className="facts">
            <li>
              <span>Playing StudyQuest</span>
              <strong>
                {econ.xpPerCoin} XP = 1 coin
              </strong>
            </li>
            <li>
              <span>Daily limit from games</span>
              <strong>{Math.floor(econ.dailyCapXp / econ.xpPerCoin)} coins</strong>
            </li>
            <li>
              <span>Homework and jobs</span>
              <strong>set on each task</strong>
            </li>
          </ul>
          <p className="note">
            Today: {xpToday} XP played{capToday < xpToday ? ` (${capToday} count today)` : ''} = {Math.floor(capToday / econ.xpPerCoin)} coins.
          </p>
          <Bar value={capToday / econ.dailyCapXp} tone={capToday >= econ.dailyCapXp ? 'good' : 'xp'} label="Today's game coins" />
          {mine && (
            <Link to="/learn" className="btn primary block">
              <Icon name="bolt" size={18} /> Earn more in StudyQuest
            </Link>
          )}
        </section>
      )}

      <SectionHead title="Treats" sub={best && mine ? `${best.cost - (bal?.available ?? 0)} more coins for ${best.emoji} ${best.title}` : undefined} />
      {treats.length === 0 && <p className="note">No treats yet. A parent can add them in Parent area, Family.</p>}
      <div className="treats">
        {treats.map((t) => {
          const can = canRedeem(f, view.id, t, bal?.available ?? 0, today)
          return (
            <article key={t.id} className={`treat${can.ok ? '' : ' locked'}`}>
              <span className="treat-emoji">{t.emoji}</span>
              <div className="grow">
                <strong>{t.title}</strong>
                {t.blurb && <p className="muted small">{t.blurb}</p>}
                {!can.ok && <p className="muted small">{can.reason}</p>}
              </div>
              <div className="treat-buy">
                <Coins n={t.cost} />
                {mine && (
                  <button type="button" className="btn small primary" disabled={!can.ok} onClick={() => setConfirm(t)}>
                    Get
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>

      <SectionHead title="Family goals" sub="Everyone can chip in coins toward something shared." action={isParent ? <button type="button" className="btn small ghost" onClick={() => setEditGoal('new')}>Add</button> : undefined} />
      {goals.length === 0 && <p className="note">No shared goals yet.{isParent ? ' Add one for the family to save toward together.' : ''}</p>}
      <div className="goals">
        {goals.map((g) => {
          const total = goalTotal(f, g.goalId)
          const pct = g.targetCoins > 0 ? Math.min(1, total / g.targetCoins) : 0
          return (
            <article key={g.goalId} className="goal-card">
              <div className="gc-top">
                <span className="gc-emoji">{g.emoji ?? '🎯'}</span>
                <div className="grow">
                  <strong>{g.title}</strong>
                  <p className="muted small">
                    {total} of {g.targetCoins} coins
                  </p>
                </div>
                {isParent && (
                  <button type="button" className="icon-btn small" aria-label="Edit goal" onClick={() => setEditGoal(g)}>
                    <Icon name="pencil" size={16} />
                  </button>
                )}
              </div>
              <div className="gc-bar">
                <Bar value={pct} tone={pct >= 1 ? 'good' : 'accent'} label={`${g.title} progress`} />
              </div>
              {mine && pct < 1 && (
                <button type="button" className="btn small" disabled={(bal?.available ?? 0) <= 0} onClick={() => setGiftGoal(g)}>
                  <Icon name="coin" size={14} /> Chip in
                </button>
              )}
              {pct >= 1 && <p className="pill tone-good">Reached!</p>}
            </article>
          )
        })}
      </div>

      {requests.length > 0 && (
        <>
          <SectionHead title="Your requests" />
          <ul className="card list">
            {requests.map((r) => (
              <li key={r.id}>
                <span>
                  {r.emoji} {r.title} <small className="muted">· {ago(r.ts, Date.now())}</small>
                </span>
                <span className={`pill ${STATUS[r.status]?.tone ?? ''}`}>{STATUS[r.status]?.label ?? r.status}</span>
                {r.status === 'pending' && mine && (
                  <button type="button" className="btn small ghost" onClick={() => act(A.decideRedeem(me.id, r.id, 'cancelled'))}>
                    Cancel
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      <SectionHead
        title="History"
        action={
          <button type="button" className="btn small ghost" onClick={() => setShowLedger((s) => !s)}>
            {showLedger ? 'Hide' : 'Show'}
          </button>
        }
      />
      {showLedger && (
        <ul className="card list ledger">
          {ledger.length === 0 && <li className="muted">Nothing yet.</li>}
          {ledger.slice(0, 40).map((e, i) => (
            <li key={i}>
              <span>
                {e.label} <small className="muted">· {ago(e.ts, Date.now())}{e.state === 'waiting' ? ' · waiting for check' : e.state === 'reserved' ? ' · held' : ''}</small>
              </span>
              <strong className={e.delta >= 0 ? 'up' : 'down'}>
                {e.delta > 0 ? '+' : ''}
                {e.delta}
              </strong>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={!!confirm} onClose={() => setConfirm(undefined)} title="Get this treat?">
        {confirm && (
          <>
            <p className="lead">
              {confirm.emoji} {confirm.title}
            </p>
            <p>
              That is <strong>{confirm.cost} coins</strong>. You will have {(bal?.available ?? 0) - confirm.cost} left. A parent needs to say yes; the coins come back if it is a no.
            </p>
            <button
              type="button"
              className="btn primary big block"
              onClick={() => {
                act(A.redeemTreat(me.id, me.id, confirm).events)
                setConfirm(undefined)
                toast('Asked! A parent will see it.')
              }}
            >
              Yes, ask for it
            </button>
            <button type="button" className="btn ghost block" onClick={() => setConfirm(undefined)}>
              Not now
            </button>
          </>
        )}
      </Sheet>

      <GiftSheet goal={giftGoal} available={bal?.available ?? 0} onClose={() => setGiftGoal(undefined)} />
      <GoalEditSheet goal={editGoal} onClose={() => setEditGoal(undefined)} />
    </div>
  )
}

/** A member gives some of their own coins to a shared goal. Immediate and voluntary - no parent approval, same as
 * spending on yourself, just shared. */
function GiftSheet({ goal, available, onClose }: { goal: CoinGoalEvent | undefined; available: number; onClose: () => void }) {
  const { act, toast } = useApp()
  const me = useMe()!
  const [n, setN] = useState(10)
  if (!goal) return null
  const amount = Math.max(1, Math.min(available, n))
  return (
    <Sheet open={!!goal} onClose={onClose} title={`Chip in to ${goal.title}`}>
      <p>You have {available} coins to give.</p>
      <div className="row-fields">
        <input className="tbox" type="number" min={1} max={Math.max(1, available)} value={n} onChange={(e) => setN(Number(e.target.value) || 0)} />
      </div>
      <button
        type="button"
        className="btn primary big block"
        disabled={available <= 0}
        onClick={() => {
          act(A.giftToCoinGoal(me.id, goal.goalId, amount))
          toast(`Gave ${amount} coins to ${goal.title}.`)
          onClose()
        }}
      >
        Give {amount} coins
      </button>
    </Sheet>
  )
}

/** Parent-only: create, edit or remove a shared crowdfunding goal. */
function GoalEditSheet({ goal, onClose }: { goal: CoinGoalEvent | 'new' | undefined; onClose: () => void }) {
  const { act, toast } = useApp()
  const me = useMe()!
  const editing = goal && goal !== 'new' ? goal : undefined
  const [title, setTitle] = useState(editing?.title ?? '')
  const [emoji, setEmoji] = useState(editing?.emoji ?? '🎯')
  const [target, setTarget] = useState(editing?.targetCoins ?? 200)
  if (!goal) return null
  const save = () => {
    const t = title.trim()
    if (!t) return
    act(A.saveCoinGoal(me.id, { goalId: editing?.goalId, title: t, emoji: emoji.trim() || undefined, targetCoins: Math.max(1, target) }))
    toast(editing ? 'Goal updated.' : 'Goal added.')
    onClose()
  }
  return (
    <Sheet open={!!goal} onClose={onClose} title={editing ? 'Edit goal' : 'New family goal'}>
      <label className="field">
        <span>What are you saving for?</span>
        <input className="tbox" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Trip to the zoo" maxLength={60} autoFocus />
      </label>
      <label className="field">
        <span>Emoji (optional)</span>
        <input className="tbox" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} />
      </label>
      <label className="field">
        <span>Target coins</span>
        <input className="tbox" type="number" min={1} value={target} onChange={(e) => setTarget(Number(e.target.value) || 0)} />
      </label>
      <button type="button" className="btn primary big block" onClick={save}>
        Save
      </button>
      {editing && (
        <button
          type="button"
          className="btn ghost block"
          onClick={() => {
            act(A.deleteCoinGoal(me.id, editing))
            toast('Goal removed.')
            onClose()
          }}
        >
          <Icon name="trash" size={16} /> Remove goal
        </button>
      )}
    </Sheet>
  )
}
