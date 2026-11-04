import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, useCalCtx, useFamily, useMe } from '@/app/context'
import { cancelNotification } from '@/app/push'
import * as A from '@/family/actions'
import * as P from '@/family/planActions'
import { busySpans, type AgendaItem } from '@/family/calendar'
import { fromMin, toMin, ymdOf } from '@/family/dates'
import { eventReminderTag } from '@/family/notify'
import { colourForSubject } from '@/family/school/school'
import type { Member, Ymd } from '@/family/types'
import { Avatar, AvatarStack } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'
import { CAT_EMOJI, CAT_LABEL, cancelTaskReminder, timeRange } from './shared'
import { DropHomeworkSheet } from './homeworkAdmin'

/** One line of an agenda: time, title, who, and a hand icon if someone needs help. */
export function AgendaRow({ item, onClick, showWho = true, dayLabel, badge, action, done, className }: { item: AgendaItem; onClick?: () => void; showWho?: boolean; dayLabel?: string; badge?: ReactNode; action?: ReactNode; done?: boolean; className?: string }) {
  const f = useFamily()
  const helpNeeded = item.help && item.help.offers.length === 0
  return (
    <li className={`agenda-row cat-${item.category}${item.taskDone || done ? ' done' : ''}${action ? ' has-action' : ''}${className ? ` ${className}` : ''}`}>
      <button type="button" className="ag-btn" onClick={onClick} disabled={!onClick} style={item.category === 'lesson' ? { borderLeft: `4px solid ${colourForSubject(item.title)}` } : undefined}>
        <span className="ag-time">{item.allDay || !item.start ? <span className="ag-allday">{CAT_EMOJI[item.category] ?? '📌'}</span> : <>{item.start}{item.end && <small>{item.end}</small>}</>}</span>
        <span className="ag-main">
          {badge}
          <strong>{item.title}</strong>
          {(dayLabel || item.sub || item.location) && <small>{[dayLabel, item.sub, item.location && item.location !== item.sub ? item.location : ''].filter(Boolean).join(' · ')}</small>}
        </span>
        {item.help && (
          <span className={`pill ${helpNeeded ? 'tone-warn' : 'tone-good'}`}>
            <Icon name="hand" size={12} /> {helpNeeded ? 'Help wanted' : `${item.help.offers.length} helping`}
          </span>
        )}
        {showWho && !item.everyone && item.members.length > 0 && <AvatarStack ids={item.members} members={f.members} />}
        {showWho && item.everyone && <span className="pill tone-accent">Everyone</span>}
      </button>
      {action}
    </li>
  )
}

/** "Who is busy when" for one day: a lane per person with their busy blocks. Free space is where the family can do something together.
 * With `hideFree`, people with nothing on between `from` and `to` get no lane, just a one-line "Everyone else is free". */
export function DayLanes({ items, people, from = '07:00', to = '21:00', hideFree = false }: { items: AgendaItem[]; people: Member[]; from?: string; to?: string; hideFree?: boolean }) {
  const a = toMin(from)
  const b = toMin(to)
  const hours: number[] = []
  for (let m = Math.ceil(a / 120) * 120; m <= b; m += 120) hours.push(m)
  const rows = people.map((p) => ({ p, spans: busySpans(items, p.id) }))
  const busyInView = (r: (typeof rows)[number]) => r.spans.some((s) => s.end > a && s.start < b)
  const shown = hideFree ? rows.filter(busyInView) : rows
  const free = hideFree ? rows.filter((r) => !busyInView(r)).map((r) => r.p) : []
  const freeAvatars = (
    <span className="avatar-stack">
      {free.slice(0, 5).map((p) => (
        <Avatar key={p.id} m={p} size={18} />
      ))}
    </span>
  )
  if (hideFree && shown.length === 0)
    return free.length ? (
      <p className="lanes-free solo">
        {freeAvatars} Nobody has anything on between {from} and {to}.
      </p>
    ) : null
  const freeNames = free.map((p) => p.name).join(', ')
  return (
    <div className="lanes" role="img" aria-label={`Who is busy during the day${free.length ? `. Free: ${freeNames}` : ''}`}>
      <div className="lane-scale">
        {hours.map((m) => (
          <span key={m} style={{ left: `${((m - a) / (b - a)) * 100}%` }}>
            {fromMin(m).slice(0, 2)}
          </span>
        ))}
      </div>
      {shown.map(({ p, spans }) => {
        const all = spans.some((s) => s.start <= 0 && s.end >= 1440)
        return (
          <div className="lane" key={p.id}>
            <Avatar m={p} size={22} />
            <div className="lane-track">
              {hours.map((m) => (
                <i key={m} className="lane-tick" style={{ left: `${((m - a) / (b - a)) * 100}%` }} />
              ))}
              {all ? (
                <span className="lane-bar all" style={{ left: 0, width: '100%', background: p.colour }}>
                  busy all day
                </span>
              ) : (
                spans.map((s, i) => {
                  const l = Math.max(0, ((s.start - a) / (b - a)) * 100)
                  const r = Math.min(100, ((s.end - a) / (b - a)) * 100)
                  if (r <= 0 || l >= 100) return null
                  return <span key={i} className="lane-bar" style={{ left: `${l}%`, width: `${Math.max(1.5, r - l)}%`, background: p.colour }} />
                })
              )}
            </div>
          </div>
        )
      })}
      {free.length > 0 && (
        <p className="lanes-free" title={freeNames}>
          {freeAvatars} Everyone else is free
        </p>
      )}
    </div>
  )
}

/** Detail sheet for one agenda item. Family events can be edited; school items are read-only. */
export function ItemSheet({ item, onClose, onEdit }: { item: AgendaItem | undefined; onClose: () => void; onEdit?: (calId: string, date: Ymd) => void }) {
  const nav = useNavigate()
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()
  const [editing, setEditing] = useState(false)
  useEffect(() => setEditing(false), [item?.key])
  return (
    <Sheet open={!!item} onClose={onClose} title={item?.title}>
      {item && (
        <div className="item-detail">
          <p className="muted">
            {CAT_EMOJI[item.category]} {CAT_LABEL[item.category as keyof typeof CAT_LABEL] ?? (item.category === 'lesson' ? 'Lesson' : item.category === 'club' ? 'Club' : item.category === 'homework' ? 'Homework due' : item.category === 'closure' ? 'School closed' : item.category === 'birthday' ? 'Birthday' : item.category === 'session' ? 'Session' : item.category === 'travel' ? 'Travel' : 'Item')} · {timeRange(item)}
          </p>
          {item.sub && <p>{item.sub}</p>}
          {item.location && <p>📍 {item.location}</p>}
          {item.notes && <p className="pre">{item.notes}</p>}
          <div className="who-row">
            {item.everyone ? <span className="pill tone-accent">Everyone</span> : item.members.map((m) => (
              <span key={m} className="who">
                <Avatar m={f.members[m]} size={24} /> {f.members[m]?.name}
              </span>
            ))}
          </div>
          {item.help && me && (
            <div className="help-box">
              <p>
                <Icon name="hand" size={16} /> <strong>Needs a hand:</strong> {item.help.note}
              </p>
              <p className="note">{item.help.offers.length ? `${item.help.offers.map((m) => f.members[m]?.name).join(', ')} ${item.help.offers.length === 1 ? 'is' : 'are'} helping.` : 'Nobody has offered yet.'}</p>
              {item.calId && (
                <button
                  type="button"
                  className={`btn ${item.help.offers.includes(me.id) ? 'ghost' : 'primary'} block`}
                  onClick={() => {
                    const on = !item.help!.offers.includes(me.id)
                    act(A.offerHelp(me.id, item.calId!, item.date, on))
                    toast(on ? "Thanks - you're helping." : 'Okay, you are not helping.')
                    onClose()
                  }}
                >
                  {item.help.offers.includes(me.id) ? "I can't after all" : 'I can help'}
                </button>
              )}
            </div>
          )}
          {item.source === 'cal' && item.calId && onEdit && (
            <button type="button" className="btn ghost block" onClick={() => onEdit(item.calId!, item.date)}>
              <Icon name="pencil" size={18} /> Edit
            </button>
          )}
          {item.source === 'routine' && me && (
            <button
              type="button"
              className="btn primary block"
              onClick={() => {
                const r = f.routines[item.key.split(':')[1] ?? '']
                if (!r) return
                const { runId, events } = P.startRun(me.id, me.id, P.runSourceFor(f, r, ymdOf(Date.now())), Date.now())
                if (!events.length) return toast(r.plants ? 'No plants are due a water right now.' : 'That session has no steps yet.')
                act(events)
                onClose()
                nav(`/run/${runId}`)
              }}
            >
              <Icon name="play" size={18} /> Start this session
            </button>
          )}
          {item.source === 'house' && me && (
            item.date === ymdOf(Date.now()) ? (
              <button type="button" className="btn primary block" onClick={() => (onClose(), nav(`/house/start/${item.key.split(':')[1]}`))}>
                <Icon name="play" size={18} /> Set up & start
              </button>
            ) : (
              <p className="note">A family session. It can be started on the day.</p>
            )
          )}
          {item.source === 'meal' && (
            <button type="button" className="btn ghost block" onClick={() => (onClose(), nav('/plan?t=meals'))}>
              Open the meal plan
            </button>
          )}
          {item.source === 'school' && !editing && <SchoolDay item={item} />}
          {item.source === 'task' && item.taskId && <TaskInfo item={item} onClose={onClose} />}
          {item.source === 'travel' && (
            <>
              {item.travelStatus === 'disrupted' && <p className="note warn">The trains are disrupted. This plan has been changed to the next workable train.</p>}
              {item.travelStatus === 'unknown' && <p className="note">These times could not be confirmed with live train data. Check before you go.</p>}
              <p className="muted small">Planned by the home server and updated automatically if trains change.</p>
              <button type="button" className="btn ghost block" onClick={() => (onClose(), nav('/travel'))}>
                Open Travel and alarms
              </button>
            </>
          )}
          {item.source === 'arrival' && <p className="note">From the new-baby plan. Open it from Care or the Today card to see the day's ideas.</p>}
          {['lesson', 'school', 'club', 'school-event', 'closure'].includes(item.source) &&
            (editing ? (
              <OverrideEditor item={item} onDone={onClose} onCancelEdit={() => setEditing(false)} />
            ) : (
              <>
                <p className="note">
                  {item.overridden ? 'Edited for this day only - the school timetable itself is unchanged.' : 'From the school timetable - this day only can be moved, changed or cancelled without touching the timetable.'}
                </p>
                <button type="button" className="btn ghost block" onClick={() => setEditing(true)}>
                  <Icon name="pencil" size={18} /> {item.overridden ? 'Change this again' : 'Edit this day'}
                </button>
              </>
            ))}
        </div>
      )}
    </Sheet>
  )
}

/** Edits (or cancels) one day's occurrence of a school-timetable-derived item, without touching the timetable
 * itself. Backed by a CalOverrideEvent keyed to this item's own key, so it only ever affects this one day. */
function OverrideEditor({ item, onDone, onCancelEdit }: { item: AgendaItem; onDone: () => void; onCancelEdit: () => void }) {
  const { act, toast, sync } = useApp()
  const me = useMe()
  const [title, setTitle] = useState(item.title)
  const [start, setStart] = useState(item.start ?? '')
  const [end, setEnd] = useState(item.end ?? '')
  const [location, setLocation] = useState(item.location ?? '')
  const [notes, setNotes] = useState(item.notes ?? '')
  if (!me) return null
  const save = () => {
    act(A.setCalOverride(me.id, item.key, { title: title.trim() || item.title, start: start || undefined, end: end || undefined, location: location.trim() || undefined, notes: notes.trim() || undefined }))
    toast('Saved for this day.')
    onDone()
  }
  return (
    <div className="override-editor">
      <label className="field">
        <span>Title</span>
        <input className="tbox" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} />
      </label>
      <div className="two-col">
        <label className="field">
          <span>Start</span>
          <input className="tbox" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label className="field">
          <span>End</span>
          <input className="tbox" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </div>
      <label className="field">
        <span>Location</span>
        <input className="tbox" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={80} />
      </label>
      <label className="field">
        <span>Note</span>
        <input className="tbox" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={120} />
      </label>
      <button type="button" className="btn primary block" onClick={save}>
        Save for this day
      </button>
      <button
        type="button"
        className="btn ghost block"
        onClick={() => {
          act(A.setCalOverride(me.id, item.key, { cancelled: true }))
          // The background resync (app/calendarReminders.ts) only ever adds reminders for occurrences that
          // still exist - a cancelled one just stops showing up in its scan, which would leave any reminder
          // already queued for it stranded (and wrong) rather than cleared.
          void cancelNotification(sync, eventReminderTag(item.key))
          toast('Cancelled for this day.')
          onDone()
        }}
      >
        <Icon name="trash" size={18} /> Cancel this occurrence
      </button>
      {item.overridden && (
        <button
          type="button"
          className="btn ghost small"
          onClick={() => {
            act(A.clearCalOverride(me.id, item.key))
            toast('Back to the timetable default.')
            onDone()
          }}
        >
          Reset to timetable default
        </button>
      )}
      <button type="button" className="btn ghost small" onClick={onCancelEdit}>
        Never mind
      </button>
    </div>
  )
}

/** Everything the school has on for one child on one day: each lesson with room and teacher, clubs, and homework that is due. */
function SchoolDay({ item }: { item: AgendaItem }) {
  const ctx = useCalCtx()
  const f = useFamily()
  const childId = item.members[0]
  const sc = childId ? ctx.schools[childId] : undefined
  if (!sc || !childId) return null
  const lessons = sc.lessons(item.date)
  const clubs = sc.clubs(item.date)
  const week = sc.weekOf(item.date)
  const due = Object.values(f.tasks).filter((t) => !t.deleted && !t.dropped && t.assignee === childId && t.kind === 'homework' && t.date === item.date)
  return (
    <div className="school-day">
      {week && <p className="muted small">Week {week.week}{week.assumed ? ' (assumed)' : ''}</p>}
      <h4>Lessons</h4>
      <ul className="lesson-list">
        {lessons.map((l) => (
          <li key={l.period}>
            <span className="ll-time">
              {l.start}
              <small>{l.end}</small>
            </span>
            <span className="ll-main">
              <strong>{l.subject}</strong>
              <small className="muted">
                {l.room} · {l.teacher}
              </small>
            </span>
          </li>
        ))}
      </ul>
      {clubs.length > 0 && (
        <>
          <h4>Clubs</h4>
          <ul className="lesson-list">
            {clubs.map((c) => (
              <li key={c.id}>
                <span className="ll-time">
                  {c.start}
                  <small>{c.end}</small>
                </span>
                <span className="ll-main">
                  <strong>{c.name}</strong>
                  <small className="muted">{[c.room, c.note].filter(Boolean).join(' · ')}</small>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      {due.length > 0 && (
        <>
          <h4>Homework due</h4>
          <ul className="lesson-list">
            {due.map((t) => {
              const d = f.done[`${t.taskId}|${t.date ?? 'any'}`]
              return (
                <li key={t.taskId}>
                  <span className="ll-time">{d && d.status !== 'rejected' ? '✅' : '📚'}</span>
                  <span className="ll-main">
                    <strong>{t.title}</strong>
                    <small className="muted">{[t.subject, t.teacher, t.minutes ? `${t.minutes} min` : ''].filter(Boolean).join(' · ')}</small>
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}

/** A task or homework that is on the calendar: what it is, who set it, and a way to tick it off. */
function TaskInfo({ item, onClose }: { item: AgendaItem; onClose: () => void }) {
  const { act, toast, sync } = useApp()
  const f = useFamily()
  const me = useMe()
  const [dropping, setDropping] = useState(false)
  const t = item.taskId ? f.tasks[item.taskId] : undefined
  if (!t || !me) return null
  const key = `${t.taskId}|${t.recur ? item.date : (t.date ?? 'any')}`
  const d = f.done[key]
  const finished = !!d && d.status !== 'rejected'
  const canTick = me.role === 'parent' || t.assignee === me.id
  return (
    <div className="task-info">
      <p className="muted">{[t.subject, t.teacher, t.minutes ? `${t.minutes} min` : '', t.coins ? `${t.coins} coins` : '', t.source?.startsWith('school:') ? 'set by school' : ''].filter(Boolean).join(' · ')}</p>
      {d?.status === 'pending' && <p className="pill tone-warn">Done, waiting for a parent to check</p>}
      {d?.status === 'approved' && <p className="pill tone-good">Done and checked</p>}
      {d?.status === 'rejected' && <p className="pill tone-bad">Try again{d.checkNote ? `: ${d.checkNote}` : ''}</p>}
      {canTick && !finished && (
        <button
          type="button"
          className="btn primary block"
          onClick={() => {
            act(A.completeTask(me.id, f, t, t.recur ? item.date : (t.date ?? 'any'), {}, Date.now()))
            toast(t.check === 'parent' && me.role !== 'parent' ? 'Done. Waiting for a parent to check.' : 'Done!')
            void cancelTaskReminder(sync, t.taskId)
            onClose()
          }}
        >
          <Icon name="check" size={18} /> Mark as done
        </button>
      )}
      {me.role === 'parent' && t.kind === 'homework' && !t.recur && (
        <button type="button" className="btn ghost block" onClick={() => setDropping(true)}>
          Not needed (no coins)
        </button>
      )}
      {dropping && <DropHomeworkSheet task={t} onClose={() => (setDropping(false), onClose())} />}
    </div>
  )
}
