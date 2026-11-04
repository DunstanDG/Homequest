/**
 * The building blocks of the Today screen after the UX tidy-up:
 *   - NeedsYou: one compact list of everything waiting on this person (approvals, votes, help wanted, the dog's
 *     flea treatment, the weekly summit), instead of a stack of separate callout cards;
 *   - DayTimeline: "Now & next", one timeline of the day's calendar, sessions (with Start), dinner and timed tasks;
 *   - ExtraTiles: the nice-to-haves (shopping, dinner, trivia) as small tiles at the bottom.
 */
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as P from '@/family/planActions'
import { useApp, useCalCtx, useFamily, useMe } from '@/app/context'
import { helpWanted, type AgendaItem } from '@/family/calendar'
import { friendlyDay, hmOf, startOfWeek, toMin, weekday } from '@/family/dates'
import { needsReorder, treatmentDue } from '@/family/dog'
import { duePlants } from '@/family/plants'
import { rankIdeas } from '@/family/ideas'
import { mealAt } from '@/family/meals'
import { activeRunFor, routineDoneOn } from '@/family/routines'
import { activeHouseRun } from '@/family/house/run'
import { MAIN_LIST, itemsOf, liveLists } from '@/family/shopping'
import { untilText } from '@/family/today'
import type { Hm, Member, Ymd } from '@/family/types'
import { isThisWeeksReady, phaseOf, rtSettingsOf, whenText } from '@/family/travel/roundTable'
import { serverOn } from '@/family/travel/travel'
import { SectionHead } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'
import { AgendaRow } from './agenda'

// ------------------------------------------------------------------ needs you

interface Need {
  key: string
  emoji: string
  text: ReactNode
  sub?: string
  to?: string
  onClick?: () => void
  tone?: 'warn'
}

/** Everything waiting on this person, as short tappable rows. Renders nothing when there's nothing to do. */
export function NeedsYou({ today, now, onOpenItem, children }: { today: Ymd; now: number; onOpenItem: (i: AgendaItem) => void; children?: ReactNode }) {
  const f = useFamily()
  const ctx = useCalCtx()
  const me = useMe()!
  const [helpOpen, setHelpOpen] = useState(false)
  const parent = me.role === 'parent'
  const help = useMemo(() => helpWanted(ctx, today, 7, me.id).filter((h) => !h.offers.includes(me.id)), [ctx, today, me.id])
  const needVotes = rankIdeas(f).filter((t) => t.waiting.includes(me.id)).length
  const pendingChecks = Object.values(f.done).filter((d) => d.status === 'pending').length
  const pendingBuys = Object.values(f.redeems).filter((r) => r.status === 'pending').length
  const pets = Object.values(f.members).filter((m) => m.active && m.role === 'pet')

  const rows: Need[] = []
  if (parent && pendingChecks + pendingBuys > 0)
    rows.push({
      key: 'approvals',
      emoji: '✅',
      text: <strong>{pendingChecks + pendingBuys} waiting for you to check</strong>,
      sub: [pendingChecks ? `${pendingChecks} task${pendingChecks === 1 ? '' : 's'}` : '', pendingBuys ? `${pendingBuys} treat request${pendingBuys === 1 ? '' : 's'}` : ''].filter(Boolean).join(' · '),
      to: '/parent?tab=approvals',
      tone: 'warn',
    })
  if (parent && weekday(today) >= 4 && !f.summits[startOfWeek(today)])
    rows.push({ key: 'summit', emoji: '🗓️', text: <strong>Weekly plan</strong>, sub: 'Five short steps to plan the week ahead', to: '/week' })
  if (serverOn(f)) {
    const ready = isThisWeeksReady(f, today, now)
    if (ready)
      rows.push({ key: 'roundtable', emoji: '🪑', text: <strong>The round table is ready</strong>, sub: `${ready.agenda?.points.length ?? 0} things to talk about`, to: '/week' })
    else if (phaseOf(f, today, hmOf(now)) === 'raise')
      rows.push({ key: 'roundtable', emoji: '🪑', text: <strong>Round table {whenText(rtSettingsOf(f))}</strong>, sub: 'Anything you want to raise?', to: '/week' })
  }
  if (help.length)
    rows.push({
      key: 'help',
      emoji: '🙋',
      text: (
        <strong>
          {help.length === 1 ? `${help[0]!.item.title} needs a hand` : `${help.length} things need a hand`}
        </strong>
      ),
      sub: help.length === 1 ? friendlyDay(help[0]!.item.date, today) : 'This week',
      onClick: () => (help.length === 1 ? onOpenItem(help[0]!.item) : setHelpOpen(true)),
    })
  if (needVotes)
    rows.push({ key: 'votes', emoji: '💡', text: <strong>{needVotes} idea{needVotes === 1 ? '' : 's'} to vote on</strong>, sub: 'Plans & ideas', to: '/calendar?v=plans' })
  if (parent)
    for (const p of pets) {
      const products = [...new Set(f.pets.filter((e) => e.petId === p.id && e.kind === 'treatment' && !f.voided[e.id]).map((e) => e.treatment!.product))]
      for (const product of products) {
        const last = f.pets.filter((e) => e.petId === p.id && e.kind === 'treatment' && e.treatment?.product === product && !f.voided[e.id]).sort((a, b) => b.at - a.at)[0]
        if (last && treatmentDue(f, p.id, product, last.treatment!.cycleDays, now).due) rows.push({ key: `treat:${p.id}:${product}`, emoji: '💊', text: <strong>{product} is due for {p.name}</strong>, to: '/care' })
      }
      if (needsReorder(f, p.id, now)) rows.push({ key: `stock:${p.id}`, emoji: '🛍️', text: <strong>{p.name}'s food is running low</strong>, sub: 'Add it to the shopping list from Care', to: '/care' })
    }
  const thirsty = duePlants(f, now)
  if (parent && thirsty.length)
    rows.push({
      key: 'plants',
      emoji: '🪴',
      text: <strong>{thirsty.length === 1 ? `${thirsty[0]!.plant.name} needs a water` : `${thirsty.length} plants need a water`}</strong>,
      sub: thirsty.length === 1 ? undefined : thirsty.slice(0, 3).map((s) => s.plant.name).join(', ') + (thirsty.length > 3 ? '…' : ''),
      to: '/care?s=plants',
    })

  if (!rows.length && !children) return null
  return (
    <section className="needs-you" aria-label="Needs you">
      {rows.length > 0 && (
        <>
          <SectionHead title="Needs you" />
          <ul className="needs-list">
            {rows.map((r) => {
              const body = (
                <>
                  <span className="needs-emoji" aria-hidden="true">
                    {r.emoji}
                  </span>
                  <span className="grow">
                    {r.text}
                    {r.sub && <small>{r.sub}</small>}
                  </span>
                  <Icon name="chevron" size={16} />
                </>
              )
              return (
                <li key={r.key} className={r.tone === 'warn' ? 'warn' : undefined}>
                  {r.to ? (
                    <Link to={r.to}>{body}</Link>
                  ) : (
                    <button type="button" onClick={r.onClick}>
                      {body}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
      {children}
      <Sheet open={helpOpen} onClose={() => setHelpOpen(false)} title="Someone needs a hand">
        <ul className="agenda">
          {help.map((h) => (
            <AgendaRow key={h.item.key} item={h.item} onClick={() => (setHelpOpen(false), onOpenItem(h.item))} dayLabel={friendlyDay(h.item.date, today)} />
          ))}
        </ul>
      </Sheet>
    </section>
  )
}

// ------------------------------------------------------------------ now & next

const endMin = (i: AgendaItem) => (i.end ? toMin(i.end) : toMin(i.start!) + 60)

/** The day as one timeline: all-day things first (dinner, birthdays, sessions with no set time), then timed items.
 * Finished items fold away behind "N earlier"; what's on now and what's next are labelled. Sessions get a Start
 * button right on the row. */
export function DayTimeline({ items, now, today, mine, title, onOpen }: { items: AgendaItem[]; now: number; today: Ymd; mine: boolean; title: string; onOpen: (i: AgendaItem) => void }) {
  const nav = useNavigate()
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const [showPast, setShowPast] = useState(false)
  const m = toMin(hmOf(now) as Hm)
  const active = activeRunFor(f, me.id, now)
  const houseLive = activeHouseRun(f, now)
  const allDay = items.filter((i) => i.allDay || !i.start)
  const timed = items.filter((i) => !i.allDay && i.start)
  const past = timed.filter((i) => endMin(i) <= m)
  const rest = timed.filter((i) => endMin(i) > m)
  const nextIdx = rest.findIndex((i) => toMin(i.start!) > m)

  const start = (routineId: string) => {
    const r = f.routines[routineId]
    if (!r) return
    const { runId, events } = P.startRun(me.id, me.id, P.runSourceFor(f, r, today), Date.now())
    if (!events.length) return toast(r.plants ? 'No plants are due a water right now.' : 'That session has no steps yet.')
    act(events)
    nav(`/run/${runId}`)
  }

  const row = (i: AgendaItem, badge?: ReactNode, extraClass?: string) => {
    const routineId = i.source === 'routine' ? i.key.split(':')[1] : undefined
    const done = routineId ? routineDoneOn(f, routineId, today) : false
    const canStart = !!routineId && mine && !done && !active
    // A planned family session offers Start on its own day only (and only when none is already running).
    const houseTypeId = i.source === 'house' ? i.key.split(':')[1] : undefined
    const houseDone = !!houseTypeId && !!i.taskDone
    const canStartHouse = !!houseTypeId && mine && !houseDone && !houseLive && i.date === today
    return (
      <AgendaRow
        key={i.key}
        item={i}
        onClick={() => onOpen(i)}
        showWho={i.source === 'cal' || i.source === 'school-event'}
        badge={done || houseDone ? <span className="tl-badge done">Done</span> : badge}
        done={done || houseDone}
        className={extraClass}
        action={
          canStartHouse ? (
            <button type="button" className="btn primary small tl-start" onClick={() => nav(`/house/start/${houseTypeId}`)} aria-label={`Set up ${i.title}`}>
              <Icon name="play" size={14} /> Start
            </button>
          ) : canStart ? (
            <button type="button" className="btn primary small tl-start" onClick={() => start(routineId!)} aria-label={`Start ${i.title}`}>
              <Icon name="play" size={14} /> Start
            </button>
          ) : undefined
        }
      />
    )
  }

  return (
    <section className="day-timeline">
      <SectionHead
        title={title}
        action={
          <Link to="/calendar" className="link-btn">
            Calendar
          </Link>
        }
      />
      {items.length === 0 ? (
        <p className="note">Nothing on the calendar today.</p>
      ) : (
        <ul className="agenda">
          {allDay.map((i) => row(i))}
          {past.length > 0 && (
            <li className="tl-earlier">
              <button type="button" className="link-btn" onClick={() => setShowPast((v) => !v)} aria-expanded={showPast}>
                {showPast ? 'Hide' : 'Show'} {past.length} earlier
              </button>
            </li>
          )}
          {showPast && past.map((i) => row(i, undefined, 'past'))}
          {rest.map((i, n) => {
            const isNow = toMin(i.start!) <= m
            const badge = isNow ? <span className="tl-badge now">Now · until {i.end ?? '…'}</span> : n === nextIdx ? <span className="tl-badge next">Next · {untilText(i.start!, now)}</span> : undefined
            return row(i, badge, isNow ? 'is-now' : undefined)
          })}
          {rest.length === 0 && allDay.length === 0 && <li className="note">That's everything for today.</li>}
        </ul>
      )}
    </section>
  )
}

// ------------------------------------------------------------------ extras

/** Small tiles at the bottom of Today: the shopping list (opens in shop mode), dinner if nothing is planned yet, and
 * whatever else is passed in (the daily trivia). */
export function ExtraTiles({ today, view, children }: { today: Ymd; view: Member; children?: ReactNode }) {
  const f = useFamily()
  const me = useMe()!
  const shopCount = itemsOf(f, liveLists(f)[0]?.listId ?? MAIN_LIST).filter((i) => !i.done).length
  const dinner = mealAt(f, today, 'dinner')
  const parent = me.role === 'parent' && view.id === me.id
  const tiles: ReactNode[] = []
  if (shopCount > 0)
    tiles.push(
      <Link key="shop" to="/plan?t=shop&shop=1" className="extra-tile">
        <span aria-hidden="true">🛒</span>
        <strong>
          {shopCount} to buy
        </strong>
        <small>Open in shop mode</small>
      </Link>,
    )
  if (!dinner && parent)
    tiles.push(
      <Link key="dinner" to="/plan?t=meals" className="extra-tile">
        <span aria-hidden="true">🍽️</span>
        <strong>What's for dinner?</strong>
        <small>Nothing planned yet</small>
      </Link>,
    )
  if (!tiles.length && !children) return null
  return (
    <section className="extras">
      {tiles.length > 0 && <div className="extra-tiles">{tiles}</div>}
      {children}
    </section>
  )
}
