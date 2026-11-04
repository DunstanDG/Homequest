import { useState } from 'react'
import * as A from '@/family/actions'
import { useApp, useCalCtx, useFamily, useMe, useNow } from '@/app/context'
import { type TaskRow } from '@/family/calendar'
import { openHomework } from '@/family/homework'
import { addDays, dayName, daysBetween, friendlyDay, hmOf, longDay, startOfWeek, toMin, ymdOf } from '@/family/dates'
import { validatePack } from '@/family/school/school'
import { SAMPLE_PACK } from '@/family/school/sample'
import type { SchoolPack } from '@/family/school/types'
import type { MemberId, TaskEvent, Ymd } from '@/family/types'
import { MemberChips, SectionHead, Seg } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { cancelTaskReminder, Group, TaskLine, TaskSheet, upcomingWeekAnchor, usePeople } from './shared'
import { DroppedList, UntickSheet } from './homeworkAdmin'
import { HomeworkTimeCard, PlanAllButton } from './homeworkCards'
import { FreshStartButton } from './calmParts'

type Tab = 'now' | 'homework' | 'week' | 'clubs' | 'info'

/** A pasted pack, checked; or what's wrong with it. */
function readPack(text: string): SchoolPack | string {
  try {
    const parsed = JSON.parse(text) as unknown
    return validatePack(parsed) ?? (parsed as SchoolPack)
  } catch {
    return 'That is not valid JSON.'
  }
}

export function School() {
  const { act, toast, sync } = useApp()
  const f = useFamily()
  const ctx = useCalCtx()
  const me = useMe()!
  const now = useNow(60_000)
  const today = ymdOf(now)
  const people = usePeople()
  const isParent = me.role === 'parent'
  const children = people.filter((p) => p.role === 'child')
  const withSchool = people.filter((p) => ctx.schools[p.id])
  const [sel, setSel] = useState<MemberId | undefined>(ctx.schools[me.id] ? me.id : (withSchool[0]?.id ?? children[0]?.id))
  const [tab, setTab] = useState<Tab>('now')
  const [anchor, setAnchor] = useState<Ymd>(upcomingWeekAnchor(today))
  const [editTask, setEditTask] = useState<{ task?: TaskEvent } | undefined>()
  const [untick, setUntick] = useState<{ task: TaskEvent; done: NonNullable<TaskRow['done']> } | undefined>()
  const [paste, setPaste] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const school = sel ? ctx.schools[sel] : undefined
  const member = sel ? f.members[sel] : undefined

  const chooser = (children.length > 1 || withSchool.length > 1) && (
    <MemberChips members={people.filter((p) => p.role === 'child' || ctx.schools[p.id])} value={sel ? [sel] : []} onChange={(v) => setSel(v[0])} size="small" />
  )

  if (!sel || !school || !member) {
    return (
      <div className="screen school">
        <header className="screen-head">
          <div className="sh-title">
            <p className="eyebrow">School</p>
            <h1>School tracker</h1>
          </div>
        </header>
        {chooser}
        <div className="empty">
          <Icon name="school" size={34} />
          <h3>No school set up{member ? ` for ${member.name}` : ''}</h3>
          <p>The school pack holds the timetable, term dates, clubs and set homework so they show up in the calendar and on the daily list.</p>
        </div>
        {isParent && sel && (
          <div className="card">
            <h3>Set up {member?.name ?? 'this child'}'s school</h3>
            <p className="muted small">
              Paste the school pack (JSON) for {member?.name ?? 'this child'}'s school. It's saved in your family's own synced data, so it reaches every phone with the family code, and it's never part
              of the app itself.
            </p>
            <textarea className="note-input" rows={4} value={paste} onChange={(e) => (setPaste(e.target.value), setErr(null))} placeholder='{"id": "...", "name": "...", ...}' />
            {err && <p className="note bad">{err}</p>}
            <div className="btn-row">
              <button
                type="button"
                className="btn primary small"
                disabled={!paste.trim()}
                onClick={() => {
                  const parsed = readPack(paste)
                  if (typeof parsed === 'string') return setErr(parsed)
                  act([...A.importSchoolPack(me.id, sel, parsed), ...A.addPackHomework(me.id, f, sel, parsed)])
                  setPaste('')
                  toast(`${parsed.name} added.`)
                }}
              >
                Add this school
              </button>
              <button type="button" className="btn small ghost" onClick={() => setPaste(JSON.stringify(SAMPLE_PACK, null, 2))}>
                Try the sample school
              </button>
            </div>
          </div>
        )}
        {!isParent && <p className="note">Ask a parent to set this up in the Parent area.</p>}
      </div>
    )
  }

  const pack = school.pack
  const weekStart = startOfWeek(anchor)
  const weekInfo = school.weekOf(weekStart)
  const days = [0, 1, 2, 3, 4].map((i) => addDays(weekStart, i))
  const lessonsByDay = days.map((d) => school.lessons(d))

  // Homework
  // Every open piece, soonest due first - not just what's on today's list, since planned pieces only appear on the
  // daily list from their planned day.
  const hw: TaskRow[] = openHomework(f, sel).map((t) => {
    const dueIn = t.date ? daysBetween(today, t.date) : undefined
    return { task: t, date: t.date ?? 'any', overdue: dueIn !== undefined && dueIn < 0, dueIn, slipped: !!t.doOn && t.doOn < today && (dueIn ?? 0) >= 0 }
  })
  // Left over from before first, as "Still to do" (never "late"); then everything ahead.
  const hwBefore = hw.filter((r) => r.overdue)
  const hwAhead = hw.filter((r) => !r.overdue)
  const allHw = Object.values(f.tasks).filter((t) => !t.deleted && !t.dropped && t.assignee === sel && t.kind === 'homework')
  const notAdded = pack.homework.filter((h) => !f.tasks[`hw-${pack.id}-${h.key}-${sel}`])
  const doneHw = allHw
    .map((t) => ({ t, d: f.done[`${t.taskId}|${t.date ?? 'any'}`] }))
    .filter((x) => x.d && x.d.status !== 'rejected')
    .sort((a, b) => (b.d!.ts ?? 0) - (a.d!.ts ?? 0))
    .slice(0, 8)
  const canTick = isParent || sel === me.id
  const toggle = (r: (typeof hw)[number]) => {
    if (r.done && r.done.status !== 'rejected') {
      if (r.done.status === 'pending') act(A.undo(me.id, r.done.eventId))
      else if (isParent) {
        if (r.done.status === 'approved' && r.done.coins > 0) setUntick({ task: r.task, done: r.done })
        else act(A.undo(me.id, r.done.eventId))
      }
      return
    }
    const evs = A.completeTask(me.id, f, r.task, r.date, {}, Date.now())
    act(evs)
    toast(evs[0]!.type === 'task-done' && evs[0]!.needsCheck ? 'Nice one! Coins arrive once a parent checks.' : `Done! +${r.task.coins} coins.`, { undo: () => act(A.undo(me.id, evs[0]!.id)) })
    void cancelTaskReminder(sync, r.task.taskId)
  }

  const booked = pack.clubs.filter((c) => c.booked)
  const open = pack.clubs.filter((c) => !c.booked)
  const events = pack.events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const closures = pack.closures.filter((c) => c.end >= today)
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

  // The "Now" tab: what matters today (or the next school day), the homework due soonest, and what is coming up.
  const nowHm = toMin(hmOf(now))
  const lastEnd = school.lessons(today).reduce((m, l) => Math.max(m, toMin(l.end)), 0)
  const focusIsToday = school.isSchoolDay(today) && nowHm < lastEnd
  const focusDay = focusIsToday ? today : school.nextSchoolDay(addDays(today, 1))
  const focusLessons = focusDay ? school.lessons(focusDay) : []
  const focusKit = focusDay ? school.kit(focusDay) : []
  const focusClubs = focusDay ? school.clubs(focusDay) : []
  const focusEvents = focusDay ? school.events(focusDay) : []
  const focusWeek = focusDay ? school.weekOf(focusDay) : undefined
  const laterDay = focusIsToday ? school.nextSchoolDay(addDays(today, 1)) : undefined
  const laterKit = laterDay ? school.kit(laterDay) : []
  const nowHw = hw.slice(0, 4)
  const coming = [
    ...events.filter((e) => e.date !== focusDay).map((e) => ({ date: e.date, title: e.title, sub: [e.time, e.notes].filter(Boolean).join(' · ') })),
    ...closures.map((c) => ({ date: c.start > today ? c.start : today, title: c.name, sub: c.end !== c.start ? `until ${longDay(c.end)}` : 'school closed' })),
  ]
    .filter((e) => daysBetween(today, e.date) <= 21)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4)

  return (
    <div className="screen school">
      <header className="screen-head">
        <div className="sh-title">
          <p className="eyebrow">{pack.name}</p>
          <h1>{member.name}'s school</h1>
          <p className="muted small">{[pack.tutorGroup && `Tutor group ${pack.tutorGroup}`, pack.tutor].filter(Boolean).join(' · ')}</p>
        </div>
      </header>
      {chooser}
      <Seg<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { id: 'now', label: 'Now' },
          { id: 'homework', label: 'Homework' },
          { id: 'week', label: 'Week' },
          { id: 'clubs', label: 'Clubs' },
          { id: 'info', label: 'Info' },
        ]}
      />

      {tab === 'now' && (
        <>
          {focusDay ? (
            <div className="card school-focus">
              <div className="row-between">
                <h3>{focusIsToday ? 'Today' : friendlyDay(focusDay, today)}</h3>
                <small className="muted">
                  {longDay(focusDay)}
                  {focusWeek ? ` · Week ${focusWeek.week}` : ''}
                </small>
              </div>
              {school.day(focusDay).early && <p className="note warn">{school.day(focusDay).early}</p>}
              {focusKit.length > 0 && (
                <p className="school-kit">
                  <strong>Bring:</strong> {focusKit.join(', ')}
                </p>
              )}
              {focusEvents.map((e) => (
                <p key={e.title} className="note">
                  {e.title}
                  {e.time ? ` · ${e.time}` : ''}
                </p>
              ))}
              <ul className="school-lessons">
                {focusLessons.map((l) => (
                  <li key={l.period}>
                    <small className="muted">{l.start}</small>
                    <strong>{l.subject}</strong>
                    <small className="muted">{l.room}</small>
                  </li>
                ))}
                {focusLessons.length === 0 && <li className="muted">No timetable for this day.</li>}
              </ul>
              {focusClubs.map((c) => (
                <p key={c.id} className="note">
                  {c.name} · {c.start}
                  {c.room ? ` · ${c.room}` : ''}
                </p>
              ))}
              {focusIsToday && (laterKit.length > 0 || laterDay) && (
                <p className="note">
                  {laterDay ? `${friendlyDay(laterDay, today)}: ` : ''}
                  {laterKit.length > 0 ? `bring ${laterKit.join(', ')}` : 'no extra kit'}
                </p>
              )}
            </div>
          ) : (
            <div className="empty">
              <Icon name="calendar" size={30} />
              <h3>No school coming up</h3>
              <p>The next school day will show here.</p>
            </div>
          )}
          <SectionHead
            title="Homework"
            action={
              <button type="button" className="btn small ghost" onClick={() => setTab('homework')}>
                {hw.length > nowHw.length ? `All ${hw.length}` : 'Open'}
              </button>
            }
          />
          {nowHw.length === 0 ? (
            <p className="note">No homework right now. Enjoy the break.</p>
          ) : (
            <ul className="task-list">
              {nowHw.map((r) => (
                <TaskLine
                  key={`${r.task.taskId}|${r.date}`}
                  row={r}
                  canTick={canTick}
                  onToggle={() => toggle(r)}
                  onOpen={() => setEditTask({ task: r.task })}
                  dateLabel={r.overdue || r.slipped ? undefined : r.task.doOn ? `doing it ${friendlyDay(r.task.doOn, today).toLowerCase()}` : 'pick a day?'}
                />
              ))}
            </ul>
          )}
          {coming.length > 0 && (
            <>
              <SectionHead title="Coming up" />
              <ul className="card list">
                {coming.map((e, i) => (
                  <li key={i} className="stack">
                    <span className="li-main">{e.title}</span>
                    <small className="muted">
                      {friendlyDay(e.date, today)}
                      {e.sub ? ` · ${e.sub}` : ''}
                    </small>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {tab === 'week' && (
        <>
          <div className="row-between week-nav">
            <button type="button" className="icon-btn" onClick={() => setAnchor(addDays(weekStart, -7))} aria-label="Previous week">
              <Icon name="back" />
            </button>
            <div className="center">
              <strong>
                {weekInfo ? `Week ${weekInfo.week}` : 'No school'}
                {weekInfo?.assumed ? ' (assumed)' : ''}
              </strong>
              <p className="note">Week of {friendlyDay(weekStart, today)}</p>
            </div>
            <button type="button" className="icon-btn" onClick={() => setAnchor(addDays(weekStart, 7))} aria-label="Next week">
              <Icon name="chevron" />
            </button>
          </div>
          {weekInfo?.assumed && (
            <p className="note warn">
              The school has only confirmed the A/B pattern up to {pack.weekConfirmedThrough}. After that it follows the rule "weeks alternate, holidays skipped". Correct it below if MCAS shows
              otherwise.
            </p>
          )}
          {pack.homeworkRules && weekInfo && (
            <div className="card">
              <h3>Homework this week</h3>
              <p className="muted">{weekInfo.week === 'A' ? pack.homeworkRules.A : pack.homeworkRules.B}</p>
              {pack.homeworkRules.other && <p className="note">{pack.homeworkRules.other}</p>}
            </div>
          )}
          {weekInfo ? (
            <div className="tt-wrap">
              <table className="timetable">
                <thead>
                  <tr>
                    <th />
                    {days.map((d, i) => (
                      <th key={d} className={d === today ? 'today' : school.isSchoolDay(d) ? '' : 'off'}>
                        {DAYS[i]}
                        <small>{Number(d.slice(8, 10))}</small>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pack.day.map((p) => (
                    <tr key={p.label} className={`p-${p.kind}`}>
                      <th scope="row">
                        {p.kind === 'lesson' ? `P${p.period}` : p.label.split(' ')[0]}
                        <small>{p.start}</small>
                      </th>
                      {p.kind === 'lesson' ? (
                        days.map((d, i) => {
                          const l = lessonsByDay[i]?.find((x) => x.period === p.period)
                          return (
                            <td key={d} className={d === today ? 'today' : ''}>
                              {l ? (
                                <>
                                  <strong>{l.subject}</strong>
                                  <small>{l.room}</small>
                                </>
                              ) : (
                                <span className="muted">–</span>
                              )}
                            </td>
                          )
                        })
                      ) : (
                        <td colSpan={5} className="tt-gap">
                          {p.label}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">
              <Icon name="calendar" size={30} />
              <h3>No school this week</h3>
              <p>{days.map((d) => school.day(d).label).find(Boolean) ?? 'Holiday'}</p>
            </div>
          )}
          {isParent && weekInfo && (
            <details className="card week-fix">
              <summary>Wrong week letter?</summary>
              <p className="muted small">The week follows the school's pattern automatically. Only correct it if the school shows a different letter for this week. Later weeks re-count from here.</p>
              <div className="chips">
                {(['A', 'B'] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    className={`chip${weekInfo.week === w && !weekInfo.assumed ? ' selected' : ''}`}
                    onClick={() => (act(A.fixSchoolWeek(me.id, sel, weekStart, w)), toast(`This week is now Week ${w}.`))}
                  >
                    Week {w}
                  </button>
                ))}
              </div>
            </details>
          )}
        </>
      )}

      {tab === 'homework' && (
        <>
          <SectionHead
            title="Homework"
            action={
              <button type="button" className="btn small" onClick={() => setEditTask({})}>
                <Icon name="plus" size={16} /> Add
              </button>
            }
          />
          {notAdded.length > 0 && isParent && (
            <div className="card callout">
              <Icon name="download" size={24} />
              <div>
                <h3>{notAdded.length} from the school list</h3>
                <p className="muted">{notAdded.map((h) => h.title).join(' · ')}</p>
                <button type="button" className="btn primary small" onClick={() => (act(A.addPackHomework(me.id, f, sel, pack)), toast('Added to their list.'))}>
                  Add to {member.name}'s list
                </button>
              </div>
            </div>
          )}
          {hw.length === 0 && (
            <div className="empty">
              <Icon name="book" size={30} />
              <h3>Nothing to do right now</h3>
              <p>Planned homework shows on the daily list on its day. Anything without a day shows a week before it's due.</p>
            </div>
          )}
          {canTick && (
            <div className="btn-row">
              <PlanAllButton child={member} />
              <FreshStartButton memberIds={[member.id]} today={today} only={(t) => t.kind === 'homework'} className="btn small ghost" />
            </div>
          )}
          {hwBefore.length > 0 && (
            <Group title="Still to do">
              {hwBefore.map((r) => (
                <TaskLine key={`${r.task.taskId}|${r.date}`} row={r} canTick={canTick} onToggle={() => toggle(r)} onOpen={() => setEditTask({ task: r.task })} />
              ))}
            </Group>
          )}
          <ul className="task-list">
            {hwAhead.map((r) => (
              <TaskLine
                key={`${r.task.taskId}|${r.date}`}
                row={r}
                canTick={canTick}
                onToggle={() => toggle(r)}
                onOpen={() => setEditTask({ task: r.task })}
                dateLabel={r.overdue || r.slipped ? undefined : r.task.doOn ? `doing it ${friendlyDay(r.task.doOn, today).toLowerCase()}` : 'pick a day?'}
              />
            ))}
          </ul>
          {canTick && <HomeworkTimeCard child={member} />}
          {doneHw.length > 0 && (
            <Group title="Handed in" count={doneHw.length}>
              {doneHw.map(({ t, d }) => (
                <li key={t.taskId} className="task-line done">
                  <span className="check-circle done">
                    <Icon name="check" size={16} />
                  </span>
                  <span className="tl-main">
                    <strong>{t.title}</strong>
                    <small>{[t.subject, d!.minutes ? `${d!.minutes} min` : '', d!.status === 'pending' ? 'waiting to be checked' : ''].filter(Boolean).join(' · ')}</small>
                  </span>
                  {isParent && (
                    <button type="button" className="btn small ghost" onClick={() => (d!.status === 'approved' && d!.coins > 0 ? setUntick({ task: t, done: d! }) : act(A.undo(me.id, d!.eventId)))}>
                      Un-tick
                    </button>
                  )}
                </li>
              ))}
            </Group>
          )}
          <DroppedList childId={sel} />
          {untick && <UntickSheet task={untick.task} done={untick.done} onClose={() => setUntick(undefined)} />}
        </>
      )}

      {tab === 'clubs' && (
        <>
          <SectionHead title="Booked clubs" />
          <ul className="card list">
            {booked.map((c) => (
              <li key={c.id} className="stack">
                <span className="li-main">{c.name}</span>
                <small className="muted">
                  {DAYS[c.day]} {c.start}
                  {c.room ? ` · ${c.room}` : ''} · {c.teacher}
                  {c.note ? ` · ${c.note}` : ''}
                </small>
              </li>
            ))}
            {booked.length === 0 && <li className="muted">None booked.</li>}
          </ul>
          <SectionHead title="Upcoming dates" />
          <ul className="card list">
            {[
              ...events.map((e) => ({ date: e.date, title: e.title, sub: [e.time, e.notes].filter(Boolean).join(' · ') })),
              ...closures.map((c) => ({ date: c.start, title: c.name, sub: c.end !== c.start ? `until ${longDay(c.end)}` : 'school closed' })),
            ]
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(0, 12)
              .map((e, i) => (
                <li key={i} className="stack">
                  <span className="li-main">{e.title}</span>
                  <small className="muted">
                    {longDay(e.date)}
                    {e.sub ? ` · ${e.sub}` : ''}
                  </small>
                </li>
              ))}
          </ul>
          <SectionHead title="Terms" />
          <ul className="card facts">
            {pack.terms.map((t) => (
              <li key={t.name}>
                <span>{t.name}</span>
                <strong>
                  {longDay(t.start)} – {longDay(t.end)}
                </strong>
              </li>
            ))}
          </ul>
          <SectionHead title="Other clubs open for sign-up" sub="Places shown were correct on the day the pack was made." />
          <div className="card">
            {[0, 1, 2, 3, 4].map((d) => {
              const rows = open.filter((c) => c.day === d)
              if (!rows.length) return null
              return (
                <div key={d} className="club-day">
                  <h4>{dayName(addDays('2026-09-21', d), true)}</h4>
                  {rows.map((c) => (
                    <p key={c.id} className="club-row">
                      <strong>{c.name}</strong>{' '}
                      <small className="muted">
                        {c.start} · {c.teacher}
                        {c.weekPattern && c.weekPattern !== 'every' ? ` · Week ${c.weekPattern}` : ''}
                        {c.spaces === 'Full' ? ' · full' : c.spaces != null ? ` · ${c.spaces} places` : ''}
                      </small>
                    </p>
                  ))}
                </div>
              )
            })}
          </div>
        </>
      )}

      {tab === 'info' && (
        <>
          <ul className="card facts info-list">
            {pack.info.map((r) => (
              <li key={r.label}>
                <span>{r.label}</span>
                <strong>{r.value}</strong>
              </li>
            ))}
          </ul>
          {pack.openQuestions && pack.openQuestions.length > 0 && (
            <div className="card">
              <h3>Not confirmed yet</h3>
              <ul className="bullets">
                {pack.openQuestions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          )}
          {isParent && (
            <div className="card">
              <h3>Update the school pack</h3>
              <p className="muted small">
                Paste a new pack (JSON) to replace the timetable, clubs, dates and homework list, for example after the school changes something. Nothing is lost: the calendar just recalculates.
              </p>
              <textarea className="note-input" rows={4} value={paste} onChange={(e) => (setPaste(e.target.value), setErr(null))} placeholder='{"id": "...", "name": "...", ...}' />
              {err && <p className="note bad">{err}</p>}
              <div className="btn-row">
                <button
                  type="button"
                  className="btn small"
                  disabled={!paste.trim()}
                  onClick={() => {
                    const parsed = readPack(paste)
                    if (typeof parsed === 'string') return setErr(parsed)
                    act(A.importSchoolPack(me.id, sel, parsed))
                    setPaste('')
                    toast('School pack updated.')
                  }}
                >
                  Use this pack
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <TaskSheet open={!!editTask} onClose={() => setEditTask(undefined)} task={editTask?.task} defaults={{ assignee: sel, kind: 'homework' }} />
    </div>
  )
}
