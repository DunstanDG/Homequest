import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as A from '@/family/actions'
import * as P from '@/family/planActions'
import { dumpList } from '@/family/dump'
import { useApp, useCalCtx, useFamily, useLearnerOf, useMe, useNow } from '@/app/context'
import { itemsOn, tasksFor, type TaskRow } from '@/family/calendar'
import { addDays, daysBetween, dayName, dayRange, friendlyDay, hmOf, longDay, shortDay, startOfWeek, toMin, ymdOf } from '@/family/dates'
import { activeTimers } from '@/family/timers'
import { greeting } from '@/family/today'
import { petDay, petPlan, lastBaby, lastPet } from '@/family/care'
import { babyLast24h } from '@/family/care'
import { onDutyAt } from '@/family/shifts'
import { HomeworkCheckinCard, HomeworkNudgeCard, HomeworkParentCard } from './homeworkCards'
import { activeRunFor } from '@/family/routines'
import { plantsByNeed } from '@/family/plants'
import { todayTrivia, TRIVIA_COINS } from '@/family/trivia'
import { DAILY_QUEST_XP } from '@/app/config'
import { ago } from '@/family/dates'
import type { DayPart, Member, MemberId, TaskEvent, Ymd } from '@/family/types'
import { Avatar, Coins, MemberChips, SectionHead, Seg } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Bar, Sheet } from '@/ui/primitives'
import { MiniTimer, StartTimerSheet } from '@/ui/timers'
import { ActiveBanner } from '@/screens/plan/Sessions'
import { CheckinCard } from '@/screens/checkin/CheckinCard'
import { HouseBanner } from '@/screens/house/HouseSessions'
import { activeHouseRun } from '@/family/house/run'
import { SyncDot } from '@/ui/ux'
import { NightToggle } from './careNow'
import { useNightMode } from '@/app/night'
import { DayTimeline, ExtraTiles, NeedsYou } from './todayParts'
import { DayPlanBlock } from './dayPlan'
import { TodayBanner } from '@/screens/onboarding/Onboarding'
import { defaultOrder, resolveLayout, useSavedLayout, type BlockId, type LayoutKind } from '@/app/todayLayout'
import { EditTodaySheet } from './EditToday'
import { KidCareCard } from './kidCare'
import { DoneTodayBlock, FamilyGoalBlock } from './rewards/DoneToday'
import { DropHomeworkSheet, UntickSheet } from './homeworkAdmin'
import { isHereWeek } from '@/family/coparent'
import { AgendaRow, ItemSheet } from './agenda'
import { activitiesOnDay, arrivalDayOn, bornBabies, expectedBabies, focusOnDay } from '@/family/arrival/arrival'
import { cancelTaskReminder, EventSheet, Group, KIND_EMOJI, PART_LABEL, TaskLine, TaskSheet, upcomingWeekAnchor, usePeople, useBalance } from './shared'
import { useCalm, type FocusMode } from '@/app/calm'
import { doneToastText } from '@/ui/celebrateLogic'
import { WeekFocusBlock } from './WeekFocusToday'
import { dumpForViewer, firstThen, nextUpOrder, pickNext, plannedAt, rowKey } from '@/family/calmToday'
import { dayPlanOf } from '@/family/travel/daily'
import { DoneToday, FirstThenStrip, FocusControl, FreshStartButton, NextUpCard } from './calmParts'

const PART_ORDER: DayPart[] = ['morning', 'day', 'afternoon', 'evening', 'any']

/** "Not now" in the one-thing view: skipped for the rest of this visit (per person and day), nothing is stored. */
const skippedByDay = new Map<string, Set<string>>()

export function Today() {
  const nav = useNavigate()
  const { act, toast, sync } = useApp()
  const f = useFamily()
  const ctx = useCalCtx()
  const me = useMe()!
  const now = useNow(30_000)
  const today = ymdOf(now)
  const people = usePeople()
  const [viewId, setViewId] = useState<MemberId>(me.id)
  const view: Member = f.members[viewId] ?? me
  const mine = view.id === me.id
  const isParent = me.role === 'parent'
  const canTick = mine || isParent
  const [mode, setMode] = useState<'day' | 'week'>('day')
  const [weekAnchor, setWeekAnchor] = useState<Ymd>(upcomingWeekAnchor(today))
  const [openTask, setOpenTask] = useState<TaskRow | undefined>()
  const [untick, setUntick] = useState<TaskRow | undefined>()
  const [dropTask, setDropTask] = useState<TaskEvent | undefined>()
  const [editTask, setEditTask] = useState<{ task?: TaskEvent } | undefined>()
  const [timerFor, setTimerFor] = useState<TaskRow | undefined>()
  const [item, setItem] = useState<Parameters<typeof ItemSheet>[0]['item']>()
  const [editEvent, setEditEvent] = useState<{ calId?: string; date?: Ymd } | undefined>()
  const learner = useLearnerOf(view.id)
  const bal = useBalance(view.id)
  const isChild = view.role === 'child'
  const calm = useCalm()
  const paused = mine && calm.paused
  // Your own list follows your calm setting; someone else's day shows everything (a parent checking in).
  const focus: FocusMode = mine ? calm.focus : 'all'
  const [seeAll, setSeeAll] = useState(false)
  const [more, setMore] = useState(false)
  const [, setSkipTick] = useState(0)
  useEffect(() => (setSeeAll(false), setMore(false)), [viewId])
  const skipKey = `${view.id}|${today}`
  const skipped = skippedByDay.get(skipKey) ?? new Set<string>()

  const rows = useMemo(() => tasksFor(ctx, view.id, today, now), [ctx, view.id, today, now])
  const items = useMemo(() => itemsOn(ctx, today, { members: [view.id], skipTasks: false, schoolDetail: isChild ? 'lessons' : 'block' }).filter((i) => i.source !== 'task' || !!i.start), [ctx, view.id, today, isChild])
  const active = mine ? activeRunFor(f, me.id, now) : undefined
  const houseRun = activeHouseRun(f, now)
  const timers = activeTimers(f)
  const school = ctx.schools[view.id]
  const tomorrow = addDays(today, 1)
  const nextSchool = school?.nextSchoolDay(tomorrow)
  const kit = nextSchool === tomorrow && new Date(now).getHours() >= 15 ? school?.kit(tomorrow) ?? [] : []
  const planned = Object.values(f.ideas)
    .filter((i) => i.status === 'planned' && i.when && (i.when.date > today || (i.when.date === today && (!i.when.start || i.when.start >= hmOf(now)))))
    .sort((a, b) => (a.when!.date + (a.when!.start ?? '')).localeCompare(b.when!.date + (b.when!.start ?? '')))
  const babies = bornBabies(f)
  const pets = Object.values(f.members).filter((m) => m.active && m.role === 'pet')
  const xpToday = learner?.xpByDay[today] ?? 0
  const nm = useNightMode(now)

  const toggle = (row: TaskRow) => {
    const d = row.done
    if (d && d.status !== 'rejected') {
      if (d.status === 'pending') act(A.undo(me.id, d.eventId))
      else if (isParent) {
        if (d.status === 'approved' && d.coins > 0) setUntick(row)
        else act(A.undo(me.id, d.eventId))
      }
      return
    }
    const evs = A.completeTask(me.id, f, row.task, row.date, {}, Date.now())
    act(evs)
    const ev = evs[0]!
    const pending = ev.type === 'task-done' && ev.needsCheck
    toast(doneToastText(calm.celebrate, row.task.coins ?? 0, !!pending), { undo: () => act(A.undo(me.id, ev.id)) })
    void cancelTaskReminder(sync, row.task.taskId)
  }

  const grouped = useMemo(() => {
    const overdue = rows.filter((r) => r.overdue && !r.done)
    const rest = rows.filter((r) => !(r.overdue && !r.done))
    const todo = rest.filter((r) => !r.done || r.done.status === 'rejected')
    const done = rest.filter((r) => r.done && r.done.status !== 'rejected')
    const byPart = PART_ORDER.map((p) => ({ part: p, rows: todo.filter((r) => r.task.part === p) })).filter((g) => g.rows.length)
    return { overdue, byPart, done }
  }, [rows])
  const dayBlocks = dayPlanOf(f, view.id, today)?.blocks
  const ordered = useMemo(() => nextUpOrder(rows, now, plannedAt(dayBlocks)), [rows, now, dayBlocks])
  const next = pickNext(ordered, skipped)
  const notNow = (r: TaskRow) => {
    skippedByDay.set(skipKey, new Set([...skipped, rowKey(r)]))
    setSkipTick((n) => n + 1)
  }
  const startAgain = () => (skippedByDay.delete(skipKey), setSkipTick((n) => n + 1))
  const ft = isChild && next ? firstThen(next.task.title, dayBlocks, now) : undefined
  const nextCard = (r: TaskRow, o: { notNow?: boolean } = {}) => (
    <NextUpCard row={r} canTick={canTick} ft={ft} onOpen={() => setOpenTask(r)} onStart={() => setTimerFor(r)} onDone={() => toggle(r)} onNotNow={o.notNow ? () => notNow(r) : undefined} />
  )
  const fresh = grouped.overdue.length > 0 && canTick && <FreshStartButton memberIds={[view.id]} today={today} className="btn small ghost" />

  const line = (r: TaskRow, dateLabel?: string) => (
    <TaskLine key={`${r.task.taskId}|${r.date}`} row={r} canTick={canTick} dateLabel={dateLabel} onToggle={() => toggle(r)} onOpen={() => setOpenTask(r)} onTimer={r.task.kind === 'chore' || r.task.kind === 'homework' || r.task.kind === 'study' || r.task.minutes ? () => setTimerFor(r) : undefined} />
  )

  const timeline = <DayTimeline items={items} now={now} today={today} mine={mine} title={mine ? 'Now & next' : `${view.name}'s day`} onOpen={setItem} />

  const shownFocus: FocusMode = seeAll ? 'all' : focus
  const toDo = (
    <>
      <div className="sec-head">
        <div>
          <h2 className="section">{mine ? 'To do' : `${view.name}'s list`}</h2>
          {rows.length > 0 && (
            <p className="note sec-sub">
              <DoneToday n={grouped.done.length} />
            </p>
          )}
        </div>
        <button type="button" className="link-btn" onClick={() => setEditTask({})}>
          + Task
        </button>
      </div>
      {mine && rows.length > 0 && <FocusControl value={focus} onChange={(v) => (setSeeAll(false), setMore(false), calm.set({ focus: v }))} />}
      {rows.length === 0 && <p className="note">Nothing on the list. Enjoy the free time.</p>}
      {shownFocus === 'one' && rows.length > 0 && (
        <>
          {next ? (
            nextCard(next, { notNow: ordered.length > 1 })
          ) : ordered.length > 0 ? (
            <div className="card calm-note">
              <p>That's everything for now. Have a rest.</p>
              <button type="button" className="link-btn" onClick={startAgain}>
                Show me one again
              </button>
            </div>
          ) : (
            <div className="card calm-note">
              <p>All done for today. Lovely work.</p>
            </div>
          )}
          {grouped.overdue.length > 0 && canTick && (
            <p className="note calm-row">
              A few things are from before. Want a fresh start? {fresh}
            </p>
          )}
          {rows.length > 1 && (
            <button type="button" className="link-btn quiet" onClick={() => setSeeAll(true)}>
              See everything
            </button>
          )}
        </>
      )}
      {shownFocus === 'three' && rows.length > 0 && (
        <>
          {ft && <FirstThenStrip ft={ft} />}
          {ordered.length === 0 && <p className="note">All done for today. Lovely work.</p>}
          {ordered.length > 0 && <ul className="task-list">{ordered.slice(0, 3).map((r) => line(r))}</ul>}
          {ordered.length > 3 &&
            (more ? (
              <ul className="task-list">{ordered.slice(3).map((r) => line(r))}</ul>
            ) : (
              <button type="button" className="link-btn quiet" onClick={() => setMore(true)}>
                {ordered.length - 3} more when you're ready
              </button>
            ))}
          {grouped.overdue.length > 0 && canTick && <p className="note calm-row">A few things are from before. Want a fresh start? {fresh}</p>}
          {more && grouped.done.length > 0 && <Group title="Done" count={grouped.done.length}>{grouped.done.map((r) => line(r))}</Group>}
        </>
      )}
      {shownFocus === 'all' && (
        <>
          {ft && <FirstThenStrip ft={ft} />}
          {grouped.overdue.length > 0 && (
            <Group title={<>Still to do{fresh && <span className="group-action">{fresh}</span>}</>}>{grouped.overdue.map((r) => line(r))}</Group>
          )}
          {grouped.byPart.map((g) => (
            <Group key={g.part} title={PART_LABEL[g.part]} count={g.rows.length}>
              {g.rows.map((r) => line(r))}
            </Group>
          ))}
          {grouped.done.length > 0 && <Group title="Done" count={grouped.done.length}>{grouped.done.map((r) => line(r))}</Group>}
          {seeAll && (
            <button type="button" className="link-btn quiet" onClick={() => setSeeAll(false)}>
              Back to {focus === 'one' ? 'one thing' : 'three'}
            </button>
          )}
        </>
      )}
    </>
  )

  const plannedTogether = planned.length > 0 && (
    <>
      <SectionHead title="Coming up together" action={<Link to="/calendar?v=plans" className="link-btn">Plans</Link>} />
      {planned.slice(0, 2).map((i) => (
        <div className="card plan-card" key={i.id}>
          <span className="plan-emoji">{i.emoji ?? '🎉'}</span>
          <div>
            <strong>{i.title}</strong>
            <p className="muted">
              {friendlyDay(i.when!.date, today)}
              {i.when!.start ? ` · ${i.when!.start}` : ''}
            </p>
          </div>
        </div>
      ))}
    </>
  )

  const plants = plantsByNeed(f, now)
  const thirsty = plants.filter((s) => s.due).length
  const careGlance = (babies.length > 0 || pets.length > 0 || plants.length > 0) && (
    <>
      <SectionHead title="Care" action={<Link to="/care" className="link-btn">Open</Link>} />
      <div className="care-glance">
        {babies.map((b) => {
          // The last 24 hours, like Care's Now card, so the counts don't drop to zero at midnight mid-shift.
          const l24 = babyLast24h(f, b.id, now)
          const feeds = l24.filter((l) => l.kind === 'feed').length
          const wet = l24.filter((l) => l.kind === 'nappy' && l.nappy?.wet).length
          const dirty = l24.filter((l) => l.kind === 'nappy' && l.nappy?.dirty).length
          const lf = lastBaby(f, b.id, 'feed')
          const duty = onDutyAt(f, b.id, now)
          return (
            <Link to="/care" key={b.id} className="card glance">
              <Avatar m={b} size={36} />
              <div>
                <strong>{b.name}</strong>
                <small>
                  {lf ? `Fed ${ago(lf.at, now)}` : 'No feeds yet'} · last 24h: {feeds} feeds · {wet} wet · {dirty} dirty
                </small>
                {duty && (
                  <small>
                    {f.members[duty.parentId]?.name ?? 'Someone'} is on now, until {duty.end}
                  </small>
                )}
              </div>
            </Link>
          )
        })}
        {pets.map((p) => {
          const d = petDay(f, p.id, today)
          const plan = petPlan(f, p.id)
          const lw = lastPet(f, p.id, 'walk')
          return (
            <Link to="/care" key={p.id} className="card glance">
              <Avatar m={p} size={36} />
              <div>
                <strong>{p.name}</strong>
                <small>
                  Walks {d.walks.length}/{plan.walksPerDay} · Meals {d.meals.length}/{plan.mealsPerDay}
                  {lw ? ` · last walk ${ago(lw.at, now)}` : ''}
                </small>
              </div>
            </Link>
          )
        })}
        {plants.length > 0 && (
          <Link to="/care?s=plants" className="card glance">
            <span className="glance-emoji" aria-hidden="true">
              🪴
            </span>
            <div>
              <strong>Plants</strong>
              <small>{thirsty ? `${thirsty} of ${plants.length} due a water` : `All ${plants.length} watered`}</small>
            </div>
          </Link>
        )}
      </div>
    </>
  )

  // ---- the blocks, in the order this person chose (on this phone) or the default for whoever is shown
  const kind: LayoutKind = isChild ? 'child' : 'adult'
  const saved = useSavedLayout(me.id, kind)
  const layout = resolveLayout(defaultOrder(kind, isChild && isParent && !mine), mine ? saved : undefined)
  const [editing, setEditing] = useState(false)
  const blocks: Partial<Record<BlockId, ReactNode>> = {
    needs: (mine || isParent) && (
      <NeedsYou today={today} now={now} onOpenItem={setItem}>
        {isParent && mine && <HomeworkParentCard kids={people.filter((p) => p.role === 'child')} />}
      </NeedsYou>
    ),
    plan: <DayPlanBlock view={view} now={now} />,
    checkin: <CheckinCard view={view} now={now} />,
    school: isChild && (
      <>
        {kit.length > 0 && (
          <div className="card callout kit">
            <Icon name="bag" size={26} />
            <div>
              <h3>Pack for tomorrow</h3>
              <p className="muted">{kit.join(', ')}</p>
            </div>
          </div>
        )}
        {(mine || isParent) && <HomeworkCheckinCard child={view} />}
        {(mine || isParent) && <HomeworkNudgeCard child={view} />}
      </>
    ),
    baby: !isChild && <BabyPlanCard today={today} />,
    timeline,
    todo: toDo,
    braindump: <BrainDumpBlock child={me.role === 'child' ? me.id : isChild ? view.id : undefined} />,
    done: <DoneTodayBlock view={view} now={now} />,
    goal: <FamilyGoalBlock />,
    week: <WeekFocusBlock />,
    learning: isChild && (
      <>
        <SectionHead title="Learning" action={<Link to="/learn" className="link-btn">Play</Link>} />
        <div className="card learn-card">
          <div className="quest-top">
            <h3>StudyQuest today</h3>
            <Coins n={bal?.available ?? 0} />
          </div>
          <Bar value={xpToday / DAILY_QUEST_XP} tone={xpToday >= DAILY_QUEST_XP ? 'good' : 'xp'} label="Daily quest progress" />
          <p className="muted">
            {xpToday} XP so far today.{' '}
            {f.economy.length ? 'Every XP you earn playing turns into coins you can spend in the shop.' : 'Coins from learning will start once a parent switches them on.'}
          </p>
          <div className="btn-row">
            <button type="button" className="btn primary" onClick={() => nav('/learn')}>
              <Icon name="bolt" size={18} /> Play now
            </button>
            <button type="button" className="btn ghost" onClick={() => nav('/shop')}>
              <Icon name="bag" size={18} /> Shop
            </button>
          </div>
        </div>
      </>
    ),
    together: plannedTogether,
    care: isChild ? (mine || isParent) && <KidCareCard child={view} /> : careGlance,
    dump: !isChild && mine && <DumpPromptCard now={now} today={today} />,
    extras: <ExtraTiles today={today} view={view}>{mine && <TriviaCard today={today} />}</ExtraTiles>,
  }

  // ---- week view
  const weekStart = startOfWeek(weekAnchor)
  const days = dayRange(weekStart, addDays(weekStart, 6))

  return (
    <div className="screen today">
      <header className="screen-head">
        <div className="sh-title">
          <p className="eyebrow">{longDay(today)}</p>
          <h1>
            {greeting(now)}, {me.name}
          </h1>
        </div>
        <div className="head-actions">
          {me.role === 'child' && bal && (
            <Link to="/shop" className="coin-chip" aria-label={`${bal.available} coins`}>
              <Icon name="coin" size={16} /> {bal.available}
            </Link>
          )}
          {(nm.night || nm.setting !== 'auto' || new Date(now).getHours() >= 20) && <NightToggle night={nm.night} setting={nm.setting} onCycle={nm.cycle} />}
          <SyncDot />
        </div>
      </header>

      {paused && (
        <>
          {timers.length > 0 && (
            <div className="stack-gap">
              {timers.map((t) => (
                <MiniTimer key={t.id} timer={t} />
              ))}
            </div>
          )}
          {active && <ActiveBanner runId={active.id} />}
          <section className="card calm-pause" aria-label="Taking it easy">
            <p className="cp-line">{next ? "Taking it easy today. Here's just one thing, if you want it." : 'Taking it easy today.'}</p>
            {!next && <p className="muted">Nothing needs doing right now. Rest is good.</p>}
          </section>
          {next && nextCard(next, { notNow: ordered.length > 1 })}
          <button type="button" className="link-btn quiet" onClick={() => calm.resume()}>
            Back to normal
          </button>
        </>
      )}

      {!paused && people.length > 1 && (
        <MemberChips members={people} value={[view.id]} onChange={(v) => setViewId(v[0] ?? me.id)} size="small" />
      )}

      {!paused && Object.values(f.coparentLinks)
        .filter((l) => !l.deleted && l.childId === view.id)
        .map((l) => (
          <p key={l.linkId} className="note">
            {isHereWeek(l, today) ? `${view.name} is with you this week.` : `${view.name} is with ${l.label || 'the other home'} this week.`}
          </p>
        ))}

      {mine && !paused && <TodayBanner />}

      {!paused && <Seg
        value={mode}
        onChange={setMode}
        options={[
          { id: 'day', label: mine ? 'Today' : `${view.name}'s day` },
          { id: 'week', label: 'Week ahead' },
        ]}
      />}

      {!paused && mode === 'day' && (
        <>
          {timers.length > 0 && (
            <div className="stack-gap">
              {timers.map((t) => (
                <MiniTimer key={t.id} timer={t} />
              ))}
            </div>
          )}

          {active && <ActiveBanner runId={active.id} />}
          {houseRun && <HouseBanner runId={houseRun.id} />}

          {layout.order
            .filter((id) => !layout.hidden.has(id))
            .map((id) => (
              <Fragment key={id}>{blocks[id]}</Fragment>
            ))}

          {mine && (
            <button type="button" className="link-btn edit-today" onClick={() => setEditing(true)}>
              <Icon name="settings" size={14} /> Edit Today
            </button>
          )}
        </>
      )}

      {!paused && mode === 'week' && (
        <>
          <div className="row-between week-nav">
            <button type="button" className="icon-btn" onClick={() => setWeekAnchor(addDays(weekStart, -7))} aria-label="Previous week">
              <Icon name="back" />
            </button>
            <strong>
              {shortDay(days[0]!)} – {shortDay(days[6]!)}
            </strong>
            <button type="button" className="icon-btn" onClick={() => setWeekAnchor(addDays(weekStart, 7))} aria-label="Next week">
              <Icon name="chevron" />
            </button>
          </div>
          {days.map((d) => {
            const its = itemsOn(ctx, d, { members: [view.id], skipTasks: true })
            const trs = tasksFor(ctx, view.id, d, now).filter((r) => !r.overdue && (r.task.kind !== 'routine') && (r.date === d || (r.task.recur && r.task.date)))
            return (
              <section key={d} className={`week-day${d === today ? ' today' : ''}`}>
                <h3 className="group-title">
                  {dayName(d, true)} {Number(d.slice(8, 10))} {d === today && <span className="pill tone-accent">Today</span>}
                </h3>
                {its.length === 0 && trs.length === 0 && <p className="note">Free</p>}
                <ul className="agenda">
                  {its.map((i) => (
                    <AgendaRow key={i.key} item={i} onClick={() => setItem(i)} showWho={false} />
                  ))}
                </ul>
                {trs.length > 0 && <ul className="task-list">{trs.map((r) => line(r))}</ul>}
              </section>
            )
          })}
        </>
      )}

      {untick?.done && <UntickSheet task={untick.task} done={untick.done} onClose={() => setUntick(undefined)} />}
      {dropTask && <DropHomeworkSheet task={dropTask} onClose={() => setDropTask(undefined)} />}
      <TaskDetail row={openTask} onDrop={(t) => (setOpenTask(undefined), setDropTask(t))} onClose={() => setOpenTask(undefined)} onEdit={(t) => (setOpenTask(undefined), setEditTask({ task: t }))} onTimer={(r) => (setOpenTask(undefined), setTimerFor(r))} canEdit={isParent || openTask?.task.assignee === me.id} />
      {editing && <EditTodaySheet kind={kind} onClose={() => setEditing(false)} />}
      <TaskSheet open={!!editTask} onClose={() => setEditTask(undefined)} task={editTask?.task} defaults={{ assignee: view.id }} />
      {timerFor && (
        <StartTimerSheet open onClose={() => setTimerFor(undefined)} label={timerFor.task.title} memberId={timerFor.task.assignee} taskId={timerFor.task.taskId} taskDate={timerFor.date} defaultMinutes={timerFor.task.minutes ?? 20} />
      )}
      <ItemSheet item={item} onClose={() => setItem(undefined)} onEdit={(calId, date) => (setItem(undefined), setEditEvent({ calId, date }))} />
      {editEvent && <EventSheet open onClose={() => setEditEvent(undefined)} event={editEvent.calId ? f.cal[editEvent.calId] : undefined} occurrenceDate={editEvent.date} />}
    </div>
  )
}

function TaskDetail({ row, onClose, onEdit, onTimer, onDrop, canEdit }: { row: TaskRow | undefined; onClose: () => void; onDrop: (t: TaskEvent) => void; onEdit: (t: TaskEvent) => void; onTimer: (r: TaskRow) => void; canEdit: boolean }) {
  const f = useFamily()
  const { act, sync } = useApp()
  const me = useMe()!
  const [note, setNote] = useState('')
  const rowKey = row ? `${row.task.taskId}|${row.date}` : ''
  useEffect(() => setNote(''), [rowKey])
  const t = row?.task
  const d = row?.done
  return (
    <Sheet open={!!row} onClose={onClose} title={t ? `${KIND_EMOJI[t.kind]} ${t.title}` : ''}>
      {t && row && (
        <div className="item-detail">
          <p className="muted">
            {[t.subject, t.teacher, t.minutes ? `${t.minutes} min` : '', t.date && !t.recur ? `due ${friendlyDay(t.date, ymdOf(Date.now()))}` : '', `${t.coins} coins`].filter(Boolean).join(' · ')}
          </p>
          {t.notes && <p>{t.notes}</p>}
          {t.source?.startsWith('school:') && <p className="note">Set by school.</p>}
          {d?.status === 'pending' && <p className="pill tone-warn">Waiting for a parent to check</p>}
          {d?.status === 'approved' && <p className="pill tone-good">Checked. Coins paid{d.checkedBy ? ` by ${f.members[d.checkedBy]?.name}` : ''}.</p>}
          {d?.status === 'rejected' && <p className="pill tone-warn">Have another go{d.checkNote ? `: ${d.checkNote}` : ''}</p>}
          {!d || d.status === 'rejected' ? (
            <>
              {(t.kind === 'homework' || t.kind === 'chore' || t.kind === 'study') && (
                <button type="button" className="btn primary big block" onClick={() => onTimer(row)}>
                  <Icon name="timer" size={20} /> Ready to start? Start a timer
                </button>
              )}
              <label className="field">
                <span>Add a note when you finish (optional)</span>
                <input className="tbox" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Did questions 1-12" maxLength={120} />
              </label>
              <button
                type="button"
                className="btn block"
                onClick={() => {
                  act(A.completeTask(me.id, f, t, row.date, { note: note.trim() || undefined }, Date.now()))
                  void cancelTaskReminder(sync, t.taskId)
                  setNote('')
                  onClose()
                }}
              >
                <Icon name="check" size={18} /> Mark as done
              </button>
            </>
          ) : null}
          {canEdit && (
            <button type="button" className="btn ghost block" onClick={() => onEdit(t)}>
              <Icon name="pencil" size={18} /> Edit task
            </button>
          )}
          {me.role === 'parent' && t.kind === 'homework' && !t.recur && (
            <button type="button" className="btn ghost block" onClick={() => onDrop(t)}>
              <Icon name="undo" size={18} /> Not needed (no coins)
            </button>
          )}
        </div>
      )}
    </Sheet>
  )
}

/** The new-baby plan on the Today screen: a countdown while waiting, and today's check and ideas once the baby is here. */
function BabyPlanCard({ today }: { today: string }) {
  const f = useFamily()
  const waiting = expectedBabies(f)[0]
  const born = bornBabies(f)
    .map((b) => ({ b, n: arrivalDayOn(b, today) }))
    .find((x) => x.n !== undefined)
  if (born && born.n) {
    const acts = activitiesOnDay(born.n)
    const focus = focusOnDay(born.n)
    return (
      <Link to="/baby" className="card callout">
        <Icon name="heart" size={26} />
        <div>
          <h3>
            {born.b.name} · day {born.n} at home
          </h3>
          {focus && <p className="muted">🩺 {focus}</p>}
          {acts.length > 0 && <p className="muted small">Ideas: {acts.map((a) => a.title).join(' · ')}</p>}
        </div>
      </Link>
    )
  }
  if (waiting) {
    const n = waiting.dueDate ? daysBetween(today, waiting.dueDate) : undefined
    return (
      <Link to="/baby" className="card callout">
        <Icon name="heart" size={26} />
        <div>
          <h3>{waiting.name === 'Baby' ? 'The baby' : waiting.name} is due {n === undefined ? 'soon' : n > 0 ? `in ${n} day${n === 1 ? '' : 's'}` : n === 0 ? 'today' : 'any day now'}</h3>
          <p className="muted">See the first two weeks: ideas, checks and easy meals.</p>
        </div>
      </Link>
    )
  }
  return null
}

/** The open brain-dump items on Today, with a box to add one (same list and privacy rules as Plan > Brain dump; a
 * child's Today shows only their own items). */
function BrainDumpBlock({ child }: { child?: MemberId }) {
  const f = useFamily()
  const me = useMe()!
  const { act } = useApp()
  const [text, setText] = useState('')
  // On a child's Today, only what's for them or what they wrote: the grown-ups' admin is not theirs to carry.
  const all = dumpForViewer(f, dumpList(f), child)
  const shown = all.slice(0, 5)
  const send = () => {
    const t = text.trim()
    if (!t) return
    act(P.addDump(me.id, [{ title: t }]))
    setText('')
  }
  return (
    <>
      <div className="sec-head">
        <div>
          <h2 className="section">Brain dump</h2>
          <p className="note sec-sub">{all.length ? `${all.length} written down` : child ? 'Anything on your mind?' : 'Nothing waiting'}</p>
        </div>
        {me.role !== 'child' && (
          <Link to="/plan?t=dump" className="link-btn">
            {all.length > shown.length ? `See all ${all.length}` : 'Open'}
          </Link>
        )}
      </div>
      <div className="card">
        {shown.length > 0 && (
          <ul className="list tight">
            {shown.map((d) => (
              <li key={d.itemId}>
                {me.role === 'child' ? (
                  <span className="li-main">{d.title}</span>
                ) : (
                  <Link to="/plan?t=dump" className="li-main" style={{ color: 'inherit', textDecoration: 'none' }}>
                    {d.title}
                  </Link>
                )}
                {d.area && <small className="muted">{d.area}</small>}
              </li>
            ))}
          </ul>
        )}
        <div className="row-fields" style={{ marginTop: shown.length ? 8 : 0 }}>
          <input className="tbox grow" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add to the brain dump" aria-label="Add to the brain dump" onKeyDown={(e) => e.key === 'Enter' && send()} />
          <button type="button" className="btn small" onClick={send}>
            Add
          </button>
        </div>
      </div>
    </>
  )
}

/** A gentle end-of-day nudge to empty your head before tomorrow, once per day, at a time each adult sets themselves
 * (Parent area > Family). Off by default is not the default — it's on with a sensible time until someone turns it off. */
function DumpPromptCard({ now, today }: { now: number; today: Ymd }) {
  const f = useFamily()
  const me = useMe()!
  const { act } = useApp()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const setting = f.dumpPromptSettings[me.id]
  const enabled = setting?.enabled ?? true
  const time = setting?.time ?? '20:00'
  const dueNow = toMin(hmOf(now)) >= toMin(time)
  const seenToday = setting?.lastSeen === today
  if (!enabled || !dueNow || seenToday) return null

  const dismiss = () => act(A.markDumpPromptSeen(me.id, f, me.id, today))
  const send = () => {
    const t = text.trim()
    if (t) act([...P.addDump(me.id, [{ title: t }]), ...A.markDumpPromptSeen(me.id, f, me.id, today)])
    else dismiss()
  }

  return (
    <div className="card callout">
      <Icon name="bulb" size={26} />
      <div className="grow">
        <h3>Anything on your mind for tomorrow?</h3>
        {open ? (
          <div className="row-fields" style={{ marginTop: 6 }}>
            <input className="tbox grow" autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Type it and it goes in the brain dump" onKeyDown={(e) => e.key === 'Enter' && send()} />
            <button type="button" className="btn small" onClick={send}>
              Add
            </button>
          </div>
        ) : (
          <div className="row-fields" style={{ marginTop: 6 }}>
            <button type="button" className="btn small" onClick={() => setOpen(true)}>
              Jot something down
            </button>
            <button type="button" className="btn ghost small" onClick={dismiss}>
              Not tonight
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/** A small daily card: guess the flag, answer a trivia question, and a quote — same for everyone on the same day.
 * One go per person per day; a little coin reward for finishing it. */
function TriviaCard({ today }: { today: Ymd }) {
  const f = useFamily()
  const me = useMe()!
  const { act, toast } = useApp()
  const card = useMemo(() => todayTrivia(today), [today])
  const done = !!f.triviaDone[`${me.id}|${today}`]
  const [step, setStep] = useState<'closed' | 'flag' | 'trivia' | 'quote'>('closed')
  const [flagPick, setFlagPick] = useState<string>()
  const [triviaPick, setTriviaPick] = useState<string>()

  if (done) return null

  const finish = () => {
    act(A.completeTrivia(me.id, me.id, today, TRIVIA_COINS))
    toast(`Nice! +${TRIVIA_COINS} coins.`)
  }

  if (step === 'closed')
    return (
      <button type="button" className="extra-tile trivia-tile" onClick={() => setStep('flag')}>
        <span aria-hidden="true">{card.flag.emoji}</span>
        <strong>Daily trivia</strong>
        <small>Three quick ones · +{TRIVIA_COINS} coins</small>
      </button>
    )

  return (
    <div className="card trivia-card">
      <Icon name="flag" size={26} />
      <div className="grow">
        <h3>Daily trivia</h3>
        {step === 'flag' && (
          <>
            <p className="muted">Which country is this flag from? {card.flag.emoji}</p>
            <div className="chips">
              {card.flag.choices.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`chip small${flagPick === c ? ' selected' : ''}`}
                  onClick={() => {
                    setFlagPick(c)
                    setStep('trivia')
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </>
        )}
        {step === 'trivia' && (
          <>
            <p className="muted">{card.trivia.q}</p>
            <div className="chips">
              {card.trivia.choices.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`chip small${triviaPick === c ? ' selected' : ''}`}
                  onClick={() => {
                    setTriviaPick(c)
                    setStep('quote')
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </>
        )}
        {step === 'quote' && (
          <>
            <p className="muted">
              {card.flag.emoji} {flagPick === card.flag.answer ? `Yes, ${card.flag.answer}!` : `That flag is ${card.flag.answer}.`} {card.trivia.answer === triviaPick ? 'And the trivia: correct!' : `Trivia answer: ${card.trivia.answer}.`}
            </p>
            <p className="pre">"{card.quote.text}" — {card.quote.author}</p>
            <button type="button" className="btn small" onClick={finish}>
              Done for today (+{TRIVIA_COINS})
            </button>
          </>
        )}
      </div>
    </div>
  )
}
