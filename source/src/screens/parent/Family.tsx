import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as A from '@/family/actions'
import { useApp, useCalCtx, useFamily, useMe } from '@/app/context'
import { makeEvent } from '@/engine/make'
import { DEFAULT_DAILY_CAP_XP, DEFAULT_XP_PER_COIN, TREAT_SEEDS } from '@/family/economy'
import { ymdOf } from '@/family/dates'
import { hasCheckin } from '@/family/checkin/checkin'
import type { MemberId, MemberRole, Treat } from '@/family/types'
import { Avatar, Coins, SectionHead } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'
import { MealTimesSettings } from '@/screens/plan/MealTimesSettings'
import { CheckinSettings } from '@/screens/checkin/Settings'
import { HabitsSheet } from '@/screens/checkin/Habits'
import { MemberRow, MemberSheet } from '@/screens/family/People'
import { useLegacyPlayers } from '@/screens/family/Start'

const ROLES: MemberRole[] = ['parent', 'child', 'baby', 'pet']
const ROLE_TITLE: Record<MemberRole, string> = { parent: 'Parents', child: 'Children', baby: 'Baby', pet: 'Pets' }

export function Family() {
  const { act, toast, repo, settings, updateSettings, pinFor } = useApp()
  const f = useFamily()
  const ctx = useCalCtx()
  const me = useMe()!
  const nav = useNavigate()
  const today = ymdOf(Date.now())
  const [editing, setEditing] = useState<{ id?: string; role?: MemberRole } | undefined>()
  const [treat, setTreat] = useState<{ treat?: Treat } | undefined>()
  const [habitsFor, setHabitsFor] = useState<MemberId | undefined>()
  const [famName, setFamName] = useState(f.name)
  const [pinNew, setPinNew] = useState('')
  const econ = f.economy[f.economy.length - 1]
  const [xpPer, setXpPer] = useState(String(econ?.xpPerCoin ?? DEFAULT_XP_PER_COIN))
  const [cap, setCap] = useState(String(econ?.dailyCapXp ?? DEFAULT_DAILY_CAP_XP))
  const treats = Object.values(f.treats).filter((t) => !t.deleted).sort((a, b) => a.cost - b.cost)
  const kids = Object.values(f.members).filter((m) => m.role === 'child')
  const legacy = useLegacyPlayers()

  return (
    <div className="parent-pane">
      <SectionHead title="People" id="sec-people" />
      {legacy.length > 0 && (
        <div className="card callout">
          <Icon name="users" size={26} />
          <div>
            <h3>StudyQuest players to add</h3>
            <p className="muted">These have progress from StudyQuest but are not in the family yet. Adding them keeps all their progress and points.</p>
            <div className="btn-row">
              {legacy.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className="btn primary small"
                  onClick={() => {
                    act(A.saveMember(me.id, { id: l.id, name: l.name, role: 'child', colour: A.MEMBER_COLOURS[Object.keys(f.members).length % A.MEMBER_COLOURS.length]!, active: true }))
                    toast(`${l.name} added.`)
                  }}
                >
                  Add {l.name} as a child
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {ROLES.map((r) => {
        const list = Object.values(f.members).filter((m) => m.role === r)
        return (
          <div key={r} className="card">
            <div className="quest-top">
              <h3>{ROLE_TITLE[r]}</h3>
              <button type="button" className="btn small ghost" onClick={() => setEditing({ role: r })}>
                <Icon name="plus" size={14} /> Add
              </button>
            </div>
            {list.length === 0 ? (
              <p className="note">{r === 'baby' ? 'Add the baby (even before the birth) to get the new-baby plan and the feeds and nappies tracker.' : r === 'pet' ? 'Add the dog to track walks and meals.' : 'Nobody yet.'}</p>
            ) : (
              <ul className="member-list">
                {list.map((m) => (
                  <MemberRow key={m.id} m={m} onClick={() => setEditing({ id: m.id })} sub={m.id === me.id ? 'this phone' : undefined} />
                ))}
              </ul>
            )}
            {r === 'baby' && (
              <Link to="/baby" className="btn ghost small">
                <Icon name="heart" size={16} /> New-baby plan
              </Link>
            )}
          </div>
        )
      })}
      <div className="card">
        <label className="field">
          <span>Family name</span>
          <input className="tbox" value={famName} onChange={(e) => setFamName(e.target.value)} placeholder="e.g. The Smiths" maxLength={30} />
        </label>
        <button type="button" className="btn small" disabled={famName.trim() === f.name || !famName.trim()} onClick={() => (act([makeEvent(me.id, { type: 'family', name: famName.trim() })]), toast('Saved.'))}>
          Save name
        </button>
      </div>

      <SectionHead title="School" />
      <div className="card">
        {kids.length === 0 && <p className="note">Add a child first.</p>}
        <ul className="facts">
          {kids.map((k) => (
            <li key={k.id}>
              <span>{k.name}</span>
              <strong>{ctx.schools[k.id]?.pack.name ?? 'not set up'}</strong>
            </li>
          ))}
        </ul>
        <button type="button" className="btn small" onClick={() => nav('/school')}>
          <Icon name="school" size={16} /> Open school tracker
        </button>
      </div>

      <SectionHead title="Coins and the shop" id="sec-coins" />
      <div className="card">
        {!econ ? (
          <>
            <p className="muted">Coins are off. When you start them, StudyQuest XP earned from the start of today turns into coins, and homework and jobs pay the coins on each task. XP from before today is never converted, so nobody wakes up to a windfall.</p>
            <button type="button" className="btn primary" onClick={() => (act(A.setEconomy(me.id, { effectiveFrom: today })), toast('Coins start from today.'))}>
              <Icon name="coin" size={18} /> Start coins today
            </button>
          </>
        ) : (
          <>
            <p className="muted">
              Since {econ.effectiveFrom}: {econ.xpPerCoin} XP = 1 coin, up to {econ.dailyCapXp} XP counted per day ({Math.floor(econ.dailyCapXp / econ.xpPerCoin)} coins). Changes apply from today and never re-price earlier days.
            </p>
            <div className="grid2">
              <label className="field">
                <span>XP per coin</span>
                <input className="tbox" inputMode="numeric" value={xpPer} onChange={(e) => setXpPer(e.target.value.replace(/\D/g, '').slice(0, 3))} />
              </label>
              <label className="field">
                <span>Daily XP limit</span>
                <input className="tbox" inputMode="numeric" value={cap} onChange={(e) => setCap(e.target.value.replace(/\D/g, '').slice(0, 4))} />
              </label>
            </div>
            <button
              type="button"
              className="btn small"
              disabled={!Number(xpPer) || !Number(cap) || (Number(xpPer) === econ.xpPerCoin && Number(cap) === econ.dailyCapXp)}
              onClick={() => (act(A.setEconomy(me.id, { effectiveFrom: today, xpPerCoin: Number(xpPer), dailyCapXp: Number(cap) })), toast('Updated from today.'))}
            >
              Save rates
            </button>
          </>
        )}
      </div>
      <div className="card">
        <div className="quest-top">
          <h3>Treats</h3>
          <div className="btn-row tight">
            {treats.length === 0 && (
              <button
                type="button"
                className="btn small"
                onClick={() => {
                  act(TREAT_SEEDS.flatMap((s) => A.saveTreat(me.id, { title: s.title, cost: s.cost, emoji: s.emoji, blurb: s.blurb, maxPerWeek: s.maxPerWeek, forMembers: [], active: true })))
                  toast('Starter treats added. Change the prices to suit.')
                }}
              >
                Add starter set
              </button>
            )}
            <button type="button" className="btn small ghost" onClick={() => setTreat({})}>
              <Icon name="plus" size={14} /> Add
            </button>
          </div>
        </div>
        <ul className="list">
          {treats.map((t) => (
            <li key={t.id}>
              <button type="button" className="linkish" onClick={() => setTreat({ treat: t })}>
                {t.emoji} {t.title}
                {!t.active ? ' (hidden)' : ''}
              </button>
              <Coins n={t.cost} />
            </li>
          ))}
        </ul>
      </div>

      <SectionHead title="This phone" />
      <div className="card">
        <p className="muted">This phone is {me.name}'s.</p>
        <label className="switch-row">
          <span className="sr-main">
            <strong>Skip the PIN on this phone</strong>
            <small className="muted">Only for your own phone. Anyone holding it can open the parent area.</small>
          </span>
          <input type="checkbox" className="switch" checked={!!settings.trustDevice} onChange={(e) => updateSettings({ trustDevice: e.target.checked })} />
        </label>
        <label className="switch-row">
          <span className="sr-main">
            <strong>Quiet timers</strong>
            <small className="muted">No beep or buzz when a timer ends</small>
          </span>
          <input type="checkbox" className="switch" checked={!!settings.quietTimers} onChange={(e) => updateSettings({ quietTimers: e.target.checked })} />
        </label>
        <label className="field">
          <span>{settings.pinHash ? 'Change PIN' : 'Set a PIN'} (this phone)</span>
          <input className="tbox" inputMode="numeric" maxLength={4} value={pinNew} onChange={(e) => setPinNew(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="4 digits" />
        </label>
        <button
          type="button"
          className="btn small"
          disabled={pinNew.length !== 4}
          onClick={() => {
            updateSettings({ pinHash: pinFor(pinNew) })
            setPinNew('')
            toast('PIN saved on this phone.')
          }}
        >
          Save PIN
        </button>
        <p className="note">Each phone has its own PIN. Set one on the children's phones first. It keeps curious fingers out; it is not real security.</p>
        <button type="button" className="btn ghost block" onClick={() => void repo.setMe(undefined)}>
          <Icon name="users" size={18} /> Switch person on this phone
        </button>
      </div>

      <SectionHead title="Reminders" />
      <div className="card">
        <label className="switch-row">
          <span className="sr-main">
            <strong>End-of-day brain dump nudge</strong>
            <small className="muted">A gentle "anything on your mind?" prompt on Today, once a day, just for you ({me.name}).</small>
          </span>
          <input
            type="checkbox"
            className="switch"
            checked={f.dumpPromptSettings[me.id]?.enabled ?? true}
            onChange={(e) => act(A.saveDumpPromptSetting(me.id, me.id, e.target.checked, f.dumpPromptSettings[me.id]?.time ?? '20:00', f.dumpPromptSettings[me.id]?.lastSeen))}
          />
        </label>
        <label className="field">
          <span>At</span>
          <input
            type="time"
            className="tbox"
            value={f.dumpPromptSettings[me.id]?.time ?? '20:00'}
            onChange={(e) => act(A.saveDumpPromptSetting(me.id, me.id, f.dumpPromptSettings[me.id]?.enabled ?? true, e.target.value, f.dumpPromptSettings[me.id]?.lastSeen))}
          />
        </label>
      </div>

      <SectionHead title="Meal times" />
      <MealTimesSettings />

      <SectionHead title="Check-ins" id="sec-checkins" />
      <div className="card">
        <p className="note">Each person has a morning and evening check-in on their own Today. Set when they open and whether to send a reminder, and keep their personal care habits.</p>
        {Object.values(f.members)
          .filter((m) => hasCheckin(m))
          .map((m) => (
            <details key={m.id} className="checkin-member">
              <summary>
                <Avatar m={m} size={24} /> <strong>{m.name}</strong>
              </summary>
              <CheckinSettings memberId={m.id} />
              <button type="button" className="btn small" onClick={() => setHabitsFor(m.id)}>
                Edit {m.name}'s habits
              </button>
            </details>
          ))}
      </div>
      {habitsFor && <HabitsSheet memberId={habitsFor} onClose={() => setHabitsFor(undefined)} />}

      {editing && <MemberSheet open onClose={() => setEditing(undefined)} member={editing.id ? f.members[editing.id] : undefined} defaultRole={editing.role} />}
      {treat && <TreatSheet treat={treat.treat} onClose={() => setTreat(undefined)} />}
    </div>
  )
}

function TreatSheet({ treat, onClose }: { treat?: Treat; onClose: () => void }) {
  const { act, toast } = useApp()
  const me = useMe()!
  const [title, setTitle] = useState(treat?.title ?? '')
  const [emoji, setEmoji] = useState(treat?.emoji ?? '🎁')
  const [cost, setCost] = useState(String(treat?.cost ?? 50))
  const [max, setMax] = useState(treat?.maxPerWeek ? String(treat.maxPerWeek) : '')
  const [blurb, setBlurb] = useState(treat?.blurb ?? '')
  const [active, setActive] = useState(treat?.active ?? true)
  const save = (deleted = false) => {
    act(
      A.saveTreat(me.id, {
        treatId: treat?.id,
        title: title.trim(),
        emoji: emoji || '🎁',
        cost: Math.max(1, Number(cost) || 1),
        blurb: blurb.trim() || undefined,
        maxPerWeek: Number(max) || undefined,
        forMembers: treat?.forMembers ?? [],
        active,
        deleted: deleted || undefined,
      }),
    )
    toast(deleted ? 'Treat removed.' : 'Saved.')
    onClose()
  }
  return (
    <Sheet open onClose={onClose} title={treat ? 'Edit treat' : 'New treat'}>
      <label className="field">
        <span>Treat</span>
        <input className="tbox" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Choose the film" maxLength={60} autoFocus />
      </label>
      <div className="grid2">
        <label className="field">
          <span>Emoji</span>
          <input className="tbox" value={emoji} onChange={(e) => setEmoji(e.target.value.slice(0, 2))} />
        </label>
        <label className="field">
          <span>Cost (coins)</span>
          <input className="tbox" inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value.replace(/\D/g, '').slice(0, 4))} />
        </label>
      </div>
      <label className="field">
        <span>At most this many a week (optional)</span>
        <input className="tbox" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, '').slice(0, 2))} />
      </label>
      <label className="field">
        <span>Note (optional)</span>
        <input className="tbox" value={blurb} onChange={(e) => setBlurb(e.target.value)} maxLength={80} />
      </label>
      <label className="switch-row">
        <span className="sr-main">
          <strong>Available in the shop</strong>
        </span>
        <input type="checkbox" className="switch" checked={active} onChange={(e) => setActive(e.target.checked)} />
      </label>
      <button type="button" className="btn primary big block" disabled={!title.trim()} onClick={() => save()}>
        Save
      </button>
      {treat && (
        <button type="button" className="btn ghost block" onClick={() => save(true)}>
          <Icon name="trash" size={18} /> Remove
        </button>
      )}
    </Sheet>
  )
}
