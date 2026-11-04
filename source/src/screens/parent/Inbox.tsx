import { useState } from 'react'
import type { FeedbackRecord } from '@/engine/types'
import { categoryLabel, feedbackMarkdown } from '@/engine/report'
import { useApp, useLearner, useViewedId } from '@/app/context'
import { makeEvent } from '@/app/events'
import { Rich } from '@/ui/rich'
import { EmptyState, Pill } from '@/ui/primitives'
import { copyText } from '@/ui/util'

type Status = FeedbackRecord['status']

function Report({ f }: { f: FeedbackRecord }) {
  const { repo, registry } = useApp()
  const viewedId = useViewedId()
  const [note, setNote] = useState('')
  const [open, setOpen] = useState(false)
  const skill = registry.graph.has(f.skillId) ? registry.graph.get(f.skillId) : undefined
  const set = (status: Status, n?: string) => repo.apply([makeEvent(viewedId, { type: 'feedback-status', feedbackId: f.id, status, note: n?.trim() || undefined })])
  const taughtNow = () => {
    repo.apply([makeEvent(viewedId, { type: 'taught', skillId: f.skillId, taught: true })])
    set('fixed', 'Marked as taught in class - this topic is back in the games.')
  }
  return (
    <article className={`card report status-${f.status}`}>
      <div className="news-top">
        <Pill tone={f.category === 'bug' ? 'bad' : f.category === 'not-taught' ? 'warn' : 'accent'}>{categoryLabel(f.category)}</Pill>
        <small className="muted">{new Date(f.ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</small>
      </div>
      <p className="muted">{skill?.name ?? f.skillId}</p>
      <p className="report-q">{f.snapshot.prompt}</p>
      <p className="muted small">
        Expected: <Rich text={f.snapshot.expected} />
        {f.snapshot.given ? <> · She answered: {f.snapshot.given}</> : null}
      </p>
      {f.note && <p className="quote">"{f.note}"</p>}
      <p className="small muted">
        Item <code>{f.item.itemId}</code>
      </p>
      {f.status !== 'open' ? (
        <div>
          <p>
            <Pill tone={f.status === 'fixed' ? 'good' : 'neutral'}>{f.status === 'fixed' ? 'Fixed' : f.status === 'wont-fix' ? "Won't fix" : 'Not a bug'}</Pill>
            {f.resolutionNote && <span className="muted"> {f.resolutionNote}</span>}
          </p>
          <button type="button" className="btn ghost small" onClick={() => set('open')}>
            Reopen
          </button>
        </div>
      ) : open ? (
        <div>
          <textarea className="note-input" rows={2} placeholder="Note for her (shown in What's new)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="btn-row">
            <button type="button" className="btn primary small" onClick={() => set('fixed', note)}>
              Mark fixed
            </button>
            <button type="button" className="btn ghost small" onClick={() => set('wont-fix', note)}>
              Won't fix
            </button>
            <button type="button" className="btn ghost small" onClick={() => set('not-a-bug', note)}>
              Not a bug
            </button>
          </div>
        </div>
      ) : (
        <div className="btn-row">
          {f.category === 'not-taught' && (
            <button type="button" className="btn primary small" onClick={taughtNow}>
              It has been taught
            </button>
          )}
          <button type="button" className="btn ghost small" onClick={() => setOpen(true)}>
            Resolve...
          </button>
        </div>
      )}
    </article>
  )
}

export function Inbox() {
  const { registry } = useApp()
  const state = useLearner()
  const [showDone, setShowDone] = useState(false)
  const [copied, setCopied] = useState(false)
  const all = Object.values(state.feedback).sort((a, b) => b.ts - a.ts)
  const open = all.filter((f) => f.status === 'open')
  const done = all.filter((f) => f.status !== 'open')

  return (
    <div className="parent-pane">
      <p className="muted">
        Every flag she raises lands here, tied to the exact question. Copy the open reports to whoever is fixing the content (or paste them into a Claude chat), then mark them fixed with a note she will see.
      </p>
      <div className="btn-row">
        <button
          type="button"
          className="btn primary"
          disabled={open.length === 0}
          onClick={async () => {
            setCopied(await copyText(feedbackMarkdown(state, registry)))
            setTimeout(() => setCopied(false), 2500)
          }}
        >
          {copied ? 'Copied!' : `Copy ${open.length} open report${open.length === 1 ? '' : 's'}`}
        </button>
      </div>
      {open.length === 0 && (
        <EmptyState icon="check" title="Inbox clear">
          {all.length ? 'All reports are resolved.' : 'When she flags a question it will show up here.'}
        </EmptyState>
      )}
      {open.map((f) => (
        <Report key={f.id} f={f} />
      ))}
      {done.length > 0 && (
        <>
          <button type="button" className="btn ghost block" onClick={() => setShowDone((s) => !s)}>
            {showDone ? 'Hide' : 'Show'} resolved ({done.length})
          </button>
          {showDone && done.map((f) => <Report key={f.id} f={f} />)}
        </>
      )}
    </div>
  )
}
