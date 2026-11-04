import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCalCtx, useCoparentSync, useFamily } from '@/app/context'
import { itemsOn, type AgendaItem } from '@/family/calendar'
import { addDays, addMonths, dayName, dayRange, endOfMonth, friendlyDay, longDay, startOfMonth, startOfWeek, weekday } from '@/family/dates'
import { monthTitle } from '@/family/calendar'
import type { MemberId, Ymd } from '@/family/types'
import { Avatar, MemberChips, ScreenHead, Seg } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'
import { SyncDot } from '@/ui/ux'
import { AgendaRow, DayLanes, ItemSheet } from './agenda'
import { HelpHead } from './calParts'
import { weekTitle } from './calTitle'
import { EventSheet, usePeople, useToday } from './shared'
import { TogetherBody } from './Together'

/** Calendar views, plus "Plans & ideas" (what used to be the Together screen). Linkable as /calendar?v=plans. */
export type CalView = 'week' | 'month' | 'list' | 'plans'
const VIEWS: CalView[] = ['week', 'month', 'list', 'plans']
const VIEW_KEY = 'hq.calendar.view'

/** The last calendar view used on this phone. "Plans & ideas" is only ever opened on purpose (tab or link), not remembered. */
function rememberedView(): CalView {
  try {
    const v = localStorage.getItem(VIEW_KEY) as CalView | null
    return v && v !== 'plans' && VIEWS.includes(v) ? v : 'week'
  } catch {
    return 'week'
  }
}

/** The shared family calendar: everyone's events, school lessons and clubs, homework due dates and birthdays in one place.
 * The `v` search param picks the view: week | month | list | plans. */
export function Calendar() {
  const f = useFamily()
  const ctx = useCalCtx()
  const today = useToday()
  const people = usePeople()
  const [params, setParams] = useSearchParams()
  const asked = params.get('v') as CalView | null
  const view: CalView = asked && VIEWS.includes(asked) ? asked : rememberedView()
  const setView = (v: CalView) => {
    if (v !== 'plans') {
      try {
        localStorage.setItem(VIEW_KEY, v)
      } catch {
        /* storage can be blocked */
      }
    }
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('v', v)
        return next
      },
      { replace: true },
    )
  }
  const [sel, setSel] = useState<Ymd>(today)
  const [filter, setFilter] = useState<MemberId[]>([])
  const [filtering, setFiltering] = useState(false)
  const [addingIdea, setAddingIdea] = useState(false)
  const [item, setItem] = useState<AgendaItem | undefined>()
  const [edit, setEdit] = useState<{ calId?: string; date?: Ymd } | undefined>()
  // Show each lesson on the day instead of one "School" block. Remembered on this phone.
  const [lessons, setLessonsState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hq.calendar.lessons') === '1'
    } catch {
      return false
    }
  })
  const setLessons = (v: boolean) => {
    setLessonsState(v)
    try {
      localStorage.setItem('hq.calendar.lessons', v ? '1' : '0')
    } catch {
      /* storage can be blocked */
    }
  }
  // Which planned meals to show: all of them, dinner only, or none. Remembered on this phone. The month grid only ever shows dinner.
  const [meals, setMealsState] = useState<'all' | 'dinner' | 'off'>(() => {
    try {
      const v = localStorage.getItem('hq.calendar.meals')
      return v === 'dinner' || v === 'off' ? v : 'all'
    } catch {
      return 'all'
    }
  })
  const setMeals = (v: 'all' | 'dinner' | 'off') => {
    setMealsState(v)
    try {
      localStorage.setItem('hq.calendar.meals', v)
    } catch {
      /* storage can be blocked */
    }
  }
  const showMeals = (items: AgendaItem[], monthGrid = false): AgendaItem[] => {
    const mode = monthGrid && meals === 'all' ? 'dinner' : meals
    return mode === 'all' ? items : items.filter((i) => i.source !== 'meal' || (mode === 'dinner' && i.sub?.startsWith('Dinner')))
  }
  const hasSchool = Object.keys(ctx.schools).length > 0
  const opts = useMemo(() => ({ members: filter.length ? filter : undefined, skipTasks: false }), [filter])

  const weekStart = startOfWeek(sel)
  const weekDays = dayRange(weekStart, addDays(weekStart, 6))
  const monthStart = startOfMonth(sel)
  const gridStart = startOfWeek(monthStart)
  const gridEnd = addDays(startOfWeek(endOfMonth(sel)), 6)
  const gridDays = dayRange(gridStart, gridEnd)

  const detail = lessons && hasSchool ? 'lessons' : 'block'
  const dayItems = (d: Ymd) => showMeals(itemsOn(ctx, d, { ...opts, schoolDetail: 'block' }), true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selItems = useMemo(() => showMeals(itemsOn(ctx, sel, { ...opts, schoolDetail: detail })), [ctx, sel, opts, detail, meals])
  const laneItems = useMemo(() => itemsOn(ctx, sel, { skipTasks: true, schoolDetail: 'block' }), [ctx, sel])
  const lanePeople = filter.length ? people.filter((p) => filter.includes(p.id)) : people

  const move = (dir: -1 | 1) => setSel(view === 'month' ? addMonths(startOfMonth(sel), dir) : addDays(sel, dir * 7))

  const dots = (d: Ymd) => {
    const its = dayItems(d)
    const ids = new Set<MemberId>()
    let closure = false
    for (const i of its) {
      if (i.source === 'closure') closure = true
      else if (i.source === 'meal') continue
      else if (i.category === 'lesson' || i.source === 'school') continue
      else for (const m of i.everyone ? people.map((p) => p.id) : i.members) ids.add(m)
    }
    return { ids: [...ids].slice(0, 4), closure, count: its.length }
  }

  const listDays = dayRange(today, addDays(today, 20))
  const wk = weekTitle(weekStart)
  const head =
    view === 'plans'
      ? { eyebrow: 'Plans & ideas', title: 'What shall we do?' }
      : view === 'month'
        ? { eyebrow: 'Family calendar', title: monthTitle(sel) }
        : view === 'list'
          ? { eyebrow: 'Family calendar', title: 'Coming up' }
          : { eyebrow: `Family calendar · ${wk.year}`, title: wk.title }

  const filterNames = filter.map((id) => f.members[id]?.name).filter(Boolean)
  const filterLabel = filterNames.length === 0 ? 'Everyone' : filterNames.length <= 2 ? filterNames.join(', ') : `${filterNames.length} people`
  const filterActive = filter.length > 0 || (hasSchool && lessons) || meals !== 'all'
  const filterChip = (
    <button type="button" className={`chip small cal-filter${filterActive ? ' selected' : ''}`} aria-haspopup="dialog" onClick={() => setFiltering(true)}>
      <Icon name="users" size={16} />
      <span className="cf-label">
        {filterLabel}
        {hasSchool && lessons ? ' · lessons' : ''}
      </span>
    </button>
  )

  return (
    <div className="screen calendar">
      <ScreenHead
        eyebrow={head.eyebrow}
        title={head.title}
        right={
          <>
            <SyncDot />
            {view === 'plans' ? (
              <button type="button" className="btn small" onClick={() => setAddingIdea(true)}>
                <Icon name="plus" size={16} /> Idea
              </button>
            ) : (
              <button type="button" className="btn small" onClick={() => setEdit({ date: sel })}>
                <Icon name="plus" size={16} /> Event
              </button>
            )}
          </>
        }
      />

      <div className="cal-views">
        <Seg<CalView>
          value={view}
          onChange={setView}
          label="Calendar view"
          options={[
            { id: 'week', label: 'Week' },
            { id: 'month', label: 'Month' },
            { id: 'list', label: 'List' },
            { id: 'plans', label: 'Plans & ideas' },
          ]}
        />
      </div>

      {view !== 'plans' && (
        <div className="cal-bar">
          {view !== 'list' ? (
            <div className="nav-arrows">
              <button type="button" className="icon-btn" onClick={() => move(-1)} aria-label={view === 'month' ? 'Previous month' : 'Previous week'}>
                <Icon name="back" />
              </button>
              <button type="button" className="btn small ghost" onClick={() => setSel(today)}>
                Today
              </button>
              <button type="button" className="icon-btn" onClick={() => move(1)} aria-label={view === 'month' ? 'Next month' : 'Next week'}>
                <Icon name="chevron" />
              </button>
            </div>
          ) : (
            <span />
          )}
          {filterChip}
        </div>
      )}

      {view === 'week' && (
        <div className="week-strip" role="tablist">
          {weekDays.map((d) => {
            const x = dots(d)
            return (
              <button key={d} type="button" role="tab" aria-selected={d === sel} className={`wk-day${d === sel ? ' sel' : ''}${d === today ? ' today' : ''}${x.closure ? ' closed' : ''}`} onClick={() => setSel(d)}>
                <small>{dayName(d)}</small>
                <strong>{Number(d.slice(8, 10))}</strong>
                <span className="dots">
                  {x.ids.map((id) => (
                    <i key={id} style={{ background: f.members[id]?.colour }} />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {view === 'month' && (
        <div className="month" role="grid" aria-label={monthTitle(sel)}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <span key={i} className="mo-head">
              {dayName(addDays(gridStart, i))}
            </span>
          ))}
          {gridDays.map((d) => {
            const x = dots(d)
            const out = d.slice(0, 7) !== sel.slice(0, 7)
            return (
              <button key={d} type="button" role="gridcell" aria-selected={d === sel} className={`mo-day${out ? ' out' : ''}${d === sel ? ' sel' : ''}${d === today ? ' today' : ''}${x.closure ? ' closed' : ''}${weekday(d) >= 5 ? ' weekend' : ''}`} onClick={() => setSel(d)}>
                <strong>{Number(d.slice(8, 10))}</strong>
                <span className="dots">
                  {x.ids.map((id) => (
                    <i key={id} style={{ background: f.members[id]?.colour }} />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {(view === 'week' || view === 'month') && (
        <>
          <HelpHead
            as="day"
            title={friendlyDay(sel, today)}
            helpId="cal.lanes"
            help={
              <p>
                Bars show when each person is busy (anyone with nothing on is left out). Gaps are free time: <strong>Plans & ideas</strong> finds the ones that suit everyone.
              </p>
            }
          />
          <p className="note day-sub">{longDay(sel)}</p>
          <OtherHomeBlocks date={sel} />
          <DayLanes items={laneItems} people={lanePeople} hideFree />
          {selItems.length === 0 ? (
            <div className="empty">
              <Icon name="calendar" size={30} />
              <h3>Nothing planned</h3>
              <p>A free day. Add something, or pick one of the family's ideas.</p>
              <button type="button" className="btn small ghost" onClick={() => setView('plans')}>
                <Icon name="heart" size={16} /> Plans & ideas
              </button>
            </div>
          ) : (
            <ul className="agenda">
              {selItems.map((i) => (
                <AgendaRow key={i.key} item={i} onClick={() => setItem(i)} />
              ))}
            </ul>
          )}
        </>
      )}

      {view === 'list' && (
        <div className="list-view">
          {listDays.map((d) => {
            const its = itemsOn(ctx, d, { ...opts, schoolDetail: detail })
            if (!its.length) return null
            return (
              <section key={d} className="week-day">
                <h3 className="group-title">
                  {['Today', 'Tomorrow', 'Yesterday'].includes(friendlyDay(d, today)) ? (
                    <>
                      {friendlyDay(d, today)} <span className="muted small">{longDay(d)}</span>
                    </>
                  ) : (
                    longDay(d)
                  )}
                </h3>
                <ul className="agenda">
                  {its.map((i) => (
                    <AgendaRow key={i.key} item={i} onClick={() => setItem(i)} />
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}

      {view === 'plans' && <TogetherBody adding={addingIdea} onAddingChange={setAddingIdea} />}

      {view !== 'plans' && (
        <div className="legend">
          {people.map((p) => (
            <span key={p.id} className="who">
              <Avatar m={p} size={16} /> {p.name}
            </span>
          ))}
        </div>
      )}

      <Sheet open={filtering} onClose={() => setFiltering(false)} title="Filter">
        <h3 className="group-title">Whose things</h3>
        <MemberChips members={people} value={filter} multi size="small" onChange={setFilter} everyone={{ label: 'Everyone', active: filter.length === 0, onToggle: () => setFilter([]) }} />
        {hasSchool && (
          <label className="switch-row compact">
            <span className="sr-main">
              <strong>Show each lesson</strong>
              <small className="muted">Timetable lessons with room and teacher. Tap "School" on a day to see them either way.</small>
            </span>
            <input type="checkbox" className="switch" checked={lessons} onChange={(e) => setLessons(e.target.checked)} />
          </label>
        )}
        <h3 className="group-title">Meals</h3>
        <Seg<'all' | 'dinner' | 'off'>
          label="Meals on the calendar"
          value={meals}
          onChange={setMeals}
          options={[
            { id: 'all', label: 'All meals' },
            { id: 'dinner', label: 'Dinner only' },
            { id: 'off', label: 'None' },
          ]}
        />
        <p className="note">The month grid shows dinner only.</p>
        <div className="cal-filter-foot">
          {filterActive && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setFilter([])
                setLessons(false)
                setMeals('all')
              }}
            >
              Reset
            </button>
          )}
          <button type="button" className="btn primary grow" onClick={() => setFiltering(false)}>
            Done
          </button>
        </div>
      </Sheet>

      <ItemSheet item={item} onClose={() => setItem(undefined)} onEdit={(calId, date) => (setItem(undefined), setEdit({ calId, date }))} />
      {edit && <EventSheet open onClose={() => setEdit(undefined)} event={edit.calId ? f.cal[edit.calId] : undefined} date={edit.date} occurrenceDate={edit.calId ? edit.date : undefined} />}
    </div>
  )
}

/** What the linked co-parent household has published for this day, for any child with an active, paired link.
 * Shows only what their BusyBlock snapshot carries — a plain busy bar, a school/club label, or (only when THEY
 * flagged it) full detail. Never invents anything beyond that. */
function OtherHomeBlocks({ date }: { date: Ymd }) {
  const f = useFamily()
  const coparentSync = useCoparentSync()
  const links = Object.values(f.coparentLinks).filter((l) => !l.deleted && l.sharedUrl && l.sharedAnonKey)
  if (!links.length) return null
  const rows = links.flatMap((l) => {
    const child = f.members[l.childId]
    const blocks = (coparentSync.remoteFor(l.linkId)?.blocks ?? []).filter((b) => b.date === date)
    return blocks.map((b) => ({ key: `${l.linkId}:${b.date}:${b.start}`, childName: child?.name ?? 'Child', label: l.label, block: b }))
  })
  if (!rows.length) return null
  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <p className="note" style={{ marginTop: 0 }}>
        At {rows[0]!.label || 'the other home'}
      </p>
      <ul className="agenda">
        {rows.map((r) => (
          <li key={r.key} className="agenda-row">
            <span className="ar-time">{r.block.start === '00:00' && r.block.end === '23:59' ? 'All day' : `${r.block.start}–${r.block.end}`}</span>
            <span className="ar-title">
              {r.childName}: {r.block.detail?.title ?? r.block.label ?? 'Busy'}
              {r.block.detail?.location ? ` · ${r.block.detail.location}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
