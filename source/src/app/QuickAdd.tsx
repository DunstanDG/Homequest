/**
 * One "+" for the whole app: add a task, an event, something to buy, a brain-dump thought or an idea from any
 * screen, without first finding the right tab. Feed/nappy jumps to Care, which has its own big buttons.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as A from '@/family/actions'
import * as P from '@/family/planActions'
import { bornBabies } from '@/family/arrival/arrival'
import { MAIN_LIST, liveLists, parseLine } from '@/family/shopping'
import { uid } from '@/engine/rng'
import { EventSheet, TaskSheet } from '@/screens/family/shared'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'
import { useApp, useFamily, useMe } from './context'

type Kind = 'task' | 'event' | 'shop' | 'dump' | 'idea'

const TEXT: Record<'shop' | 'dump' | 'idea', { title: string; placeholder: string; hint: string }> = {
  shop: { title: 'Add to the shopping list', placeholder: 'e.g. milk, 2 tins tomatoes', hint: 'Separate several things with commas.' },
  dump: { title: 'Brain dump', placeholder: 'Whatever is on your mind', hint: 'Sort it out later in Plan › Brain dump.' },
  idea: { title: 'Suggest something to do', placeholder: 'e.g. Pizza and a film on Friday', hint: 'Everyone gets to vote in Calendar › Plans & ideas.' },
}

export function QuickAdd() {
  const nav = useNavigate()
  const { act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<Kind>()
  const [text, setText] = useState('')
  const parent = me.role === 'parent'
  const babies = bornBabies(f)

  const close = () => {
    setOpen(false)
    setKind(undefined)
    setText('')
  }

  const save = () => {
    const t = text.trim()
    if (!t || !kind) return
    if (kind === 'shop') {
      const list = liveLists(f)[0]?.listId ?? MAIN_LIST
      const entries = t
        .split(/[,\n]/)
        .map((s) => parseLine(s))
        .filter((x): x is NonNullable<typeof x> => !!x)
        .map((p) => ({ name: p.name, qty: p.qty, unit: p.unit, note: p.note }))
      if (!entries.length) return
      act(P.addToList(me.id, f, list, entries))
      toast(entries.length === 1 ? `Added ${entries[0]!.name}.` : `Added ${entries.length} things.`)
    } else if (kind === 'dump') {
      act(P.addDump(me.id, [{ title: t }]))
      toast('In the brain dump.')
    } else if (kind === 'idea') {
      const ideaId = uid('i')
      const now = Date.now()
      act([...A.proposeIdea(me.id, { ideaId, title: t, kind: 'other' }, now), ...A.castVote(me.id, ideaId, 'yes', now + 1)])
      toast('Idea added. Everyone can vote on it.')
    }
    close()
  }

  const choices: { id: Kind | 'care'; emoji: string; label: string; show: boolean }[] = [
    { id: 'task', emoji: '✅', label: 'Task', show: true },
    { id: 'event', emoji: '📅', label: 'Event', show: true },
    { id: 'shop', emoji: '🛒', label: 'Shopping', show: true },
    { id: 'dump', emoji: '🧠', label: 'Brain dump', show: parent },
    { id: 'idea', emoji: '💡', label: 'Idea', show: true },
    { id: 'care', emoji: '🍼', label: 'Feed / nappy', show: babies.length > 0 },
  ]

  const textKind = kind === 'shop' || kind === 'dump' || kind === 'idea' ? kind : undefined

  return (
    <>
      <button type="button" className="fab" aria-label="Add something" onClick={() => setOpen(true)}>
        <Icon name="plus" size={28} />
      </button>
      <Sheet open={open && !kind} onClose={close} title="Add">
        <div className="qa-grid">
          {choices
            .filter((c) => c.show)
            .map((c) => (
              <button
                key={c.id}
                type="button"
                className="qa-tile"
                onClick={() => {
                  if (c.id === 'care') {
                    close()
                    nav('/care')
                  } else setKind(c.id)
                }}
              >
                <span aria-hidden="true">{c.emoji}</span>
                {c.label}
              </button>
            ))}
        </div>
      </Sheet>
      {textKind && (
        <Sheet open onClose={close} title={TEXT[textKind].title}>
          <form
            className="qa-form"
            onSubmit={(e) => {
              e.preventDefault()
              save()
            }}
          >
            <input className="tbox" autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={TEXT[textKind].placeholder} maxLength={200} aria-label={TEXT[textKind].title} />
            <p className="note">{TEXT[textKind].hint}</p>
            <button type="submit" className="btn primary block" disabled={!text.trim()}>
              Add
            </button>
          </form>
        </Sheet>
      )}
      <TaskSheet open={kind === 'task'} onClose={close} defaults={{ assignee: me.id }} />
      {kind === 'event' && <EventSheet open onClose={close} />}
    </>
  )
}
