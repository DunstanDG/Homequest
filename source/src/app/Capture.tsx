/**
 * Quick capture: one box for events, tasks, meals and brain-dump items. Type a title, then `\` and the next field
 * ("service car\time 1:15 thurs\@ Bill's Bangers"), or tap the suggested field and a value and watch the same text
 * being written. The rules for reading the line live in family/capture.ts.
 */
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as A from '@/family/actions'
import * as P from '@/family/planActions'
import { peopleOf } from '@/family/calendar'
import { areasOf } from '@/family/dump'
import { liveRecipes, mealAt } from '@/family/meals'
import { livePlaces } from '@/family/travel/travel'
import { uid } from '@/engine/rng'
import {
  activePart,
  eventEnd,
  fieldsMatching,
  FIELDS,
  KIND_FIELDS,
  KIND_INFO,
  lengthText,
  optionsFor,
  parseCapture,
  segments,
  setField,
  startField,
  suggestions,
  whenText,
  type CaptureCtx,
  type CaptureKind,
  type FieldKey,
} from '@/family/capture'
import { rescheduleTaskReminder, useToday } from '@/screens/family/shared'
import { useApp, useFamily, useMe } from './context'

export function Capture({ kinds, onDone, autoFocus = true }: { kinds: readonly CaptureKind[]; onDone: () => void; autoFocus?: boolean }) {
  const { act, toast, sync, settings } = useApp()
  const f = useFamily()
  const me = useMe()!
  const today = useToday()
  const [text, setText] = useState('')
  const [picked, setPicked] = useState<CaptureKind>()
  const input = useRef<HTMLTextAreaElement>(null)

  const ctx: CaptureCtx = useMemo(
    () => ({
      today,
      meId: me.id,
      members: peopleOf(f).map((id) => ({ id, name: f.members[id]!.name, role: f.members[id]!.role })),
      places: livePlaces(f).map((p) => p.name),
      areas: areasOf(f).filter((a) => a.count > 0).map((a) => a.name),
      recipes: liveRecipes(f).map((r) => ({ id: r.recipeId, title: r.title })),
    }),
    [f, today, me.id],
  )
  // grow the box with the line, so the whole thing stays readable
  useLayoutEffect(() => {
    const el = input.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(140, el.scrollHeight + 2)}px`
  }, [text])
  const c = useMemo(() => parseCapture(text, ctx, picked, kinds), [text, ctx, picked, kinds])
  const v = c.values
  const active = activePart(text, ctx)
  const next = suggestions(c, ctx)
  const info = KIND_INFO[c.kind]

  const write = (t: string) => {
    setText(t)
    requestAnimationFrame(() => {
      const el = input.current
      if (!el) return
      el.focus()
      el.setSelectionRange(t.length, t.length)
    })
  }
  const pick = (key: FieldKey, value: string) => write(setField(text, key, value, ctx, c.kind) + '\\')
  const open = (key: FieldKey) => write(startField(text, key))
  const removePart = (seg: number) => {
    const s = segments(text)[seg]
    if (!s) return
    write(`${text.slice(0, s.start - 1)}${text.slice(s.start + s.raw.length)}`)
  }

  const mealDate = v.date ?? today
  const mealSlot = v.slot ?? 'dinner'
  const replacing = c.kind === 'meal' ? mealAt(f, mealDate, mealSlot) : undefined

  const save = () => {
    const title = c.title
    if (!title) return
    const name = (id: string) => f.members[id]?.name ?? ''
    if (c.kind === 'event') {
      const date = v.date ?? today
      act(
        A.saveCal(me.id, {
          title,
          date,
          allDay: !v.start,
          start: v.start,
          end: eventEnd(v),
          members: v.everyone ? [] : v.who.length ? v.who : [me.id],
          everyone: v.everyone || undefined,
          category: 'family',
          location: v.where,
          notes: v.notes,
          busy: !!v.start,
        }),
      )
      toast(`Added to the calendar: ${whenText({ date, start: v.start, end: eventEnd(v) }, today)}.`)
    } else if (c.kind === 'task') {
      const taskId = uid('t')
      const assignee = v.who[0] ?? me.id
      act(A.saveTask(me.id, { taskId, title, assignee, kind: 'chore', part: 'any', date: v.date, time: v.start, minutes: v.minutes, notes: v.notes }))
      void rescheduleTaskReminder(sync, settings, taskId, title, v.date, v.start)
      toast(assignee === me.id ? 'Task added.' : `Task added for ${name(assignee)}.`)
    } else if (c.kind === 'meal') {
      const recipe = v.recipeId ? f.recipes[v.recipeId] : undefined
      act(P.planMeal(me.id, { date: mealDate, slot: mealSlot, recipe, title, servings: v.servings, cookId: v.cookId, notes: v.notes, start: v.start, end: v.start ? v.end : undefined, existing: replacing }))
      toast(`${recipe?.title ?? title}: ${mealSlot} on ${whenText({ date: mealDate }, today)}.`)
    } else {
      act(P.addDump(me.id, [{ title, area: v.list, ownerId: v.who[0], minutes: v.minutes, priority: v.priority, notes: v.notes }]))
      toast(v.list ? `In the brain dump, on ${v.list}.` : 'In the brain dump.')
    }
    setText('')
    setPicked(undefined)
    onDone()
  }

  // What to show under the box: options for the part being typed, or "which field?" for a part with no name yet,
  // or the next field worth filling in.
  const activeKey = active?.key && active.key !== 'notes' ? active.key : undefined
  const typed = active?.value.toLowerCase() ?? ''
  const typingOptions = activeKey ? optionsFor(activeKey, ctx, c.kind).filter((o) => !typed || o.label.toLowerCase().includes(typed) || o.value.toLowerCase().startsWith(typed)) : []
  // Keep asking about the part being typed until it reads well and there is nothing left to pick for it.
  const activeOk = !!active && c.fields.some((fd) => fd.seg === active.seg && fd.ok)
  const typingKey = activeKey && (!activeOk || typingOptions.some((o) => o.value.toLowerCase() !== typed)) ? activeKey : undefined
  const naming = active && !active.key && active.partial.length < 8 ? fieldsMatching(active.partial, c.kind) : []
  const first = next[0]
  const relevant = new Set<FieldKey>([...KIND_FIELDS[c.kind], 'kind'])

  return (
    <form
      className="cap"
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <div className="chips cap-kinds" role="radiogroup" aria-label="What are you adding?">
        {kinds.map((k) => (
          <button key={k} type="button" role="radio" aria-checked={c.kind === k} className={`chip small${c.kind === k ? ' selected' : ''}`} onClick={() => setPicked(picked === k ? undefined : k)}>
            {KIND_INFO[k].emoji} {KIND_INFO[k].label}
          </button>
        ))}
      </div>

      <div className="cap-row">
        <textarea
          ref={input}
          className="tbox cap-input"
          rows={1}
          autoFocus={autoFocus}
          value={text}
          onChange={(e) => setText(e.target.value.replace(/\r?\n/g, ' '))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              save()
            }
          }}
          placeholder={info.example.split('\\')[0]}
          maxLength={300}
          enterKeyHint="done"
          autoCapitalize="sentences"
          aria-label="Quick capture"
          aria-describedby="cap-example"
        />
        <button type="button" className="btn cap-slash" aria-label="Next field (types a backslash)" disabled={!text.trim()} onClick={() => write(text.replace(/\s+$/, '') + '\\')}>
          \ next
        </button>
      </div>
      <p className="note cap-example" id="cap-example">
        {text ? 'Add more with \\ then a field, e.g. ' : 'Type a title, then \\ and more, e.g. '}
        {text ? (
          <code>\{first?.example ?? FIELDS.notes.example}</code>
        ) : (
          <button type="button" className="cap-try" onClick={() => write(info.example)}>
            <code>{info.example}</code>
          </button>
        )}
      </p>

      {c.title && (
        <div className="cap-card" aria-live="polite">
          <div className="cap-head">
            <span className="cap-kind">
              {info.emoji} {info.label}
              {c.kindFrom === 'guessed' && <small> (guessed — tap above to change)</small>}
            </span>
            <strong className="cap-title">{c.title}</strong>
          </div>
          <dl className="cap-fields">
            {c.fields.map((fd) => (
              <div key={fd.seg} className={`cap-field${fd.ok ? '' : ' unsure'}${relevant.has(fd.key) ? '' : ' unused'}`}>
                <dt>{FIELDS[fd.key].label}</dt>
                <dd>
                  {fd.shown}
                  {!relevant.has(fd.key) && <small> (not used for {info.label.toLowerCase()})</small>}
                </dd>
                <button type="button" className="cap-x" aria-label={`Remove ${FIELDS[fd.key].label}`} onClick={() => removePart(fd.seg)}>
                  ×
                </button>
              </div>
            ))}
            {c.kind === 'event' && !v.date && (
              <div className="cap-field implied">
                <dt>When</dt>
                <dd>{v.start ? `Today · ${v.start}` : 'Today, all day'}</dd>
              </div>
            )}
            {c.kind === 'event' && v.start && !v.end && (
              <div className="cap-field implied">
                <dt>Until</dt>
                <dd>
                  {eventEnd(v)} ({v.minutes ? lengthText(v.minutes) : 'an hour'})
                </dd>
              </div>
            )}
            {c.kind === 'meal' && (
              <div className="cap-field implied">
                <dt>Planned for</dt>
                <dd>
                  {whenText({ date: mealDate }, today)} · {mealSlot}
                  {replacing && <small> (replaces {replacing.title})</small>}
                  {v.recipeId && <small> · recipe found</small>}
                </dd>
              </div>
            )}
            {c.kind === 'task' && !v.who.length && (
              <div className="cap-field implied">
                <dt>Who</dt>
                <dd>{me.name} (me)</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {c.title && (
        <div className="cap-next">
          {typingKey ? (
            <>
              <p className="cap-q">{FIELDS[typingKey].question}</p>
              {typingOptions.length > 0 && (
                <div className="chips">
                  {typingOptions.slice(0, 10).map((o) => (
                    <button key={o.value} type="button" className="chip small" onClick={() => pick(typingKey, o.value)}>
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
              <p className="note">
                Or type it: <code>\{FIELDS[typingKey].example}</code>
              </p>
            </>
          ) : naming.length > 0 && active?.partial ? (
            <>
              <p className="cap-q">Which field?</p>
              <div className="chips">
                {naming.map((k) => (
                  <button key={k} type="button" className="chip small" onClick={() => write(setField(text, k, '', ctx, c.kind))}>
                    {FIELDS[k].label} <code>{FIELDS[k].prefix.trim()}</code>
                  </button>
                ))}
              </div>
            </>
          ) : first ? (
            <>
              <p className="cap-q">
                Next: {first.question} <span className="note">(optional)</span>
              </p>
              {first.options.length > 0 && (
                <div className="chips">
                  {first.options.slice(0, 10).map((o) => (
                    <button key={o.value} type="button" className="chip small" onClick={() => pick(first.key, o.value)}>
                      {o.label}
                    </button>
                  ))}
                  <button type="button" className="chip small cap-type" onClick={() => open(first.key)}>
                    Type…
                  </button>
                </div>
              )}
              {!first.options.length && (
                <div className="chips">
                  <button type="button" className="chip small cap-type" onClick={() => open(first.key)}>
                    Add {first.label.toLowerCase()}
                  </button>
                </div>
              )}
              <p className="note">
                Typed, that is <code>\{first.example}</code>
              </p>
              {next.length > 1 && (
                <div className="chips cap-more">
                  <span className="note">Also:</span>
                  {next.slice(1).map((s) => (
                    <button key={s.key} type="button" className="chip small" onClick={() => open(s.key)}>
                      + {s.label} <code>{FIELDS[s.key].prefix.trim()}</code>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      <button type="submit" className="btn primary block" disabled={!c.title}>
        {info.save}
      </button>
    </form>
  )
}
