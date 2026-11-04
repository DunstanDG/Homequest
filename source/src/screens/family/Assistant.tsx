/**
 * The family assistant: ask about the day or week, and accept or turn down its suggestions.
 *
 * Chatting goes straight to the family's assistant (Hermes on the home server) over Tailscale. Suggestions travel
 * through the event log, so the cards work on any phone, even when the assistant can't be reached. Accepting writes
 * a decision; the home server makes the change, written as the person who accepted it.
 */
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApp, useFamily, useMe, useNow } from '@/app/context'
import * as T from '@/family/travel/actions'
import { STATUS_LABEL, askBody, askError, assistantUrl, pendingProposals, proposalStatus, recentProposals, type ChatTurn } from '@/family/travel/assistant'
import { serverOn } from '@/family/travel/travel'
import type { ProposalEvent } from '@/family/travel/types'
import { SectionHead } from '@/ui/fam'
import { EmptyState } from '@/ui/primitives'

const PROMPTS = ['What’s on today?', 'Plan tomorrow for me', 'Any clashes this week?', 'When can I fit in homework?']
const LIMIT_MS = 330_000
const KEEP = 30

export function Assistant() {
  const f = useFamily()
  const me = useMe()!
  const now = useNow(15_000)
  const url = assistantUrl(f)
  const pending = pendingProposals(f, now)
  const recent = recentProposals(f, now)

  if (!serverOn(f)) {
    return (
      <div className="screen assistant">
        <header className="screen-head">
          <div className="sh-title">
            <p className="eyebrow">Family assistant</p>
            <h1>Not set up</h1>
          </div>
        </header>
        <EmptyState icon="clock" title="No home server connected">
          The assistant runs on the family’s home server. Once it is connected, this screen fills in by itself.
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="screen assistant">
      <header className="screen-head">
        <div className="sh-title">
          <p className="eyebrow">Family assistant</p>
          <h1>Ask, plan, decide</h1>
        </div>
      </header>

      {(pending.length > 0 || recent.length > 0) && <SectionHead title="Suggestions" sub="Nothing changes until someone taps Add." />}
      {pending.map((p) => (
        <ProposalCard key={p.proposalId} p={p} />
      ))}
      {recent.map((p) => (
        <ProposalCard key={p.proposalId} p={p} done />
      ))}

      {url ? (
        <Chat url={url} meId={me.id} name={me.name} />
      ) : (
        <div className="note">The home server is connected, but no assistant has been set up on it yet. Suggestions it makes will still appear here.</div>
      )}
    </div>
  )
}

export function ProposalCard({ p, done }: { p: ProposalEvent; done?: boolean }) {
  const f = useFamily()
  const me = useMe()!
  const { act, toast } = useApp()
  const now = useNow(10_000)
  const st = proposalStatus(f, p.proposalId, now)
  const who = (p.forMembers ?? []).map((m) => f.members[m]?.name).filter(Boolean)
  const outcome = f.travel.proposalsDone[p.proposalId]
  const decision = f.travel.decisions[p.proposalId]
  const decider = decision?.by
  const decide = (accept: boolean) => {
    act(T.decideProposal(me.id, p.proposalId, accept))
    toast(accept ? 'Adding it… the home server makes the change in a moment.' : 'Turned down.')
  }
  return (
    <div className={`card proposal-card${done ? ' done' : ''}`}>
      <p className="pc-summary">
        {p.kind === 'change' ? '✏️' : p.kind === 'task' ? '✅' : '📅'} {p.summary}
      </p>
      {p.reason && <p className="muted pc-reason">{p.reason}</p>}
      {who.length > 0 && <small className="muted">For {who.join(', ')}</small>}
      {st === 'pending' ? (
        <div className="row pc-actions">
          <button type="button" className="btn primary" onClick={() => decide(true)}>
            Add
          </button>
          <button type="button" className="btn ghost" onClick={() => decide(false)}>
            Not now
          </button>
        </div>
      ) : (
        <small className={`pc-status st-${st}`}>
          {st === 'deciding' ? (decision?.decision === 'reject' ? 'Turned down' : 'Adding… (the home server makes the change)') : STATUS_LABEL[st]}
          {decider && f.members[decider] ? ` · ${f.members[decider]!.name}` : ''}
          {st === 'failed' && outcome?.note ? ` (${outcome.note})` : ''}
        </small>
      )}
    </div>
  )
}

function Chat({ url, meId, name }: { url: string; meId: string; name: string }) {
  const { repo, sync } = useApp()
  const kvKey = `assistant.chat.${meId}`
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [params, setParams] = useSearchParams()
  const [text, setText] = useState(() => params.get('q')?.slice(0, 1500) ?? '')
  const [busySince, setBusySince] = useState<number>()
  const [, tick] = useState(0)
  const endRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (params.has('q')) {
      setParams({}, { replace: true })
      setTimeout(() => (boxRef.current?.scrollIntoView({ block: 'center' }), boxRef.current?.focus()), 300)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    let live = true
    repo.storage.kv
      .get<ChatTurn[]>(kvKey)
      .then((t) => live && Array.isArray(t) && setTurns(t))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [repo, kvKey])
  useEffect(() => {
    if (!busySince) return
    const t = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [busySince])
  useEffect(() => endRef.current?.scrollIntoView({ block: 'end' }), [turns.length, busySince])

  const save = (next: ChatTurn[]) => {
    const kept = next.slice(-KEEP)
    setTurns(kept)
    repo.storage.kv.set(kvKey, kept).catch(() => {})
  }

  const send = async (msg: string) => {
    const message = msg.trim()
    if (!message || busySince) return
    const history = turns
    const withQ = [...turns, { role: 'user' as const, text: message, at: Date.now() }]
    save(withQ)
    setText('')
    setBusySince(Date.now())
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), LIMIT_MS)
    let reply: ChatTurn
    try {
      const res = await fetch(`${url}/ask`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-family-key': sync.config()?.familyKey ?? '' },
        body: JSON.stringify(askBody(meId, name, message, history)),
        signal: ctrl.signal,
      })
      const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string }
      reply = res.ok && data.reply ? { role: 'assistant', text: data.reply, at: Date.now() } : { role: 'assistant', text: data.error || askError(res.status), at: Date.now(), error: true }
    } catch (e) {
      reply = { role: 'assistant', text: askError((e as Error)?.name === 'AbortError' ? 'timeout' : 'network'), at: Date.now(), error: true }
    } finally {
      clearTimeout(timer)
      setBusySince(undefined)
    }
    save([...withQ, reply])
    sync.syncSoon(800) // a suggestion it made shows up straight away
  }

  const waited = busySince ? Math.round((Date.now() - busySince) / 1000) : 0
  return (
    <>
      <SectionHead
        title="Chat"
        action={
          turns.length > 0 && !busySince ? (
            <button type="button" className="btn ghost small" onClick={() => save([])}>
              Clear
            </button>
          ) : undefined
        }
      />
      <div className="chat">
        {turns.length === 0 && <p className="muted">Ask about anyone’s day, journeys, homework or the week. It can suggest changes for someone to add.</p>}
        {turns.map((t, i) => (
          <div key={i} className={`bubble ${t.role}${t.error ? ' error' : ''}`}>
            {t.text}
          </div>
        ))}
        {busySince && (
          <div className="bubble assistant thinking" aria-live="polite">
            Thinking… {waited}s <small className="muted">(usually under a minute)</small>
          </div>
        )}
        <div ref={endRef} />
      </div>
      {turns.length === 0 && (
        <div className="chips prompt-chips">
          {PROMPTS.map((p) => (
            <button key={p} type="button" className="chip" onClick={() => send(p)} disabled={!!busySince}>
              {p}
            </button>
          ))}
        </div>
      )}
      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault()
          send(text)
        }}
      >
        <textarea ref={boxRef} className="tbox" rows={text.length > 80 ? 4 : 2} value={text} placeholder="Ask the assistant…" onChange={(e) => setText(e.target.value)} maxLength={1500} disabled={!!busySince} />
        <button type="submit" className="btn primary" disabled={!text.trim() || !!busySince}>
          Send
        </button>
      </form>
    </>
  )
}
