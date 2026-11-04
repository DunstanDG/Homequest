/**
 * Co-parenting settings: link a child to the other household's separate copy of this app, see whose week it is,
 * and configure the rotation. Sharing is per-child (see family/coparent.ts and docs/ARCHITECTURE.md) — linking
 * one child never exposes any other child's data, and only busy/free (plus school/club labels and anything the
 * owning household flagged) ever crosses to the other side.
 *
 * Pairing is one-directional: whichever household creates the link points it at a Supabase project it already
 * has (its own family-sync one) and hands the other parent a code carrying that project's url+anonKey, the
 * link's secret, and the slot the redeemer should use. The redeeming household needs no Supabase project of its
 * own for this to work — pasting the code alone fully configures its side of the link.
 */
import { useState } from 'react'
import * as A from '@/family/actions'
import { useApp, useCoparentSync, useFamily, useMe, useSyncStatus } from '@/app/context'
import { isHereWeek, linkCodeFor, nextHandoff, otherSlot, parseLinkCode } from '@/family/coparent'
import { useToday } from './shared'
import type { CoparentLinkEvent, MemberId } from '@/family/types'
import { friendlyDay, startOfWeek } from '@/family/dates'
import { Icon } from '@/ui/icons'
import { copyText } from '@/ui/util'

export function Coparenting() {
  const { act, toast } = useApp()
  const me = useMe()
  const f = useFamily()
  const coparentSync = useCoparentSync()
  const sync = useSyncStatus()
  const ownUrl = sync.effectiveUrl()
  const ownAnonKey = sync.effectiveAnonKey()
  const today = useToday()
  const children = Object.values(f.members).filter((m) => m.active && m.role === 'child')
  const links = Object.values(f.coparentLinks).filter((l) => !l.deleted)
  const [mode, setMode] = useState<'create' | 'redeem' | undefined>()
  const [showCode, setShowCode] = useState<string | undefined>()
  const [msg, setMsg] = useState<string | undefined>()

  if (!children.length) {
    return (
      <section className="card">
        <h3 id="sec-coparent">Co-parenting</h3>
        <p className="muted">Add a child first, then you can link them to the other household's HomeQuest so both sides can see when the child is with each parent.</p>
      </section>
    )
  }

  const createLink = (childId: MemberId, label: string) => {
    if (!ownUrl || !ownAnonKey) {
      setMsg('Set up sharing (a Supabase project) for this family first, in the Sharing section above — creating a new co-parent link reuses it.')
      return
    }
    const draft = A.saveCoparentLink(me!.id, {
      childId,
      label,
      rotationAnchorMonday: startOfWeek(today),
      anchorHere: true,
      householdSlot: 'a',
      sharedUrl: ownUrl,
      sharedAnonKey: ownAnonKey,
    })
    act(draft)
    // The event we just created carries the linkId we need for the code; find it back from the events we made.
    const created = draft[0] as CoparentLinkEvent
    setShowCode(linkCodeFor({ url: ownUrl, anonKey: ownAnonKey, linkKey: created.linkKey, householdSlot: otherSlot(created.householdSlot) }))
    setMode(undefined)
    setMsg(undefined)
    toast('Link created. Send the code below to the other parent.')
  }

  const redeemLink = (childId: MemberId, label: string, pasted: string) => {
    const code = parseLinkCode(pasted)
    if (!code) return setMsg('That does not look like a HomeQuest co-parent code. It starts with "hqc2.".')
    act(
      A.saveCoparentLink(me!.id, {
        childId,
        label,
        rotationAnchorMonday: startOfWeek(today),
        anchorHere: true,
        householdSlot: code.householdSlot,
        sharedUrl: code.url,
        sharedAnonKey: code.anonKey,
      }),
    )
    setMode(undefined)
    setMsg(undefined)
    toast('Paired. The other home\'s schedule will appear once they publish it.')
    void coparentSync.syncNow()
  }

  return (
    <section className="card">
      <div className="quest-top">
        <h3 id="sec-coparent">Co-parenting</h3>
      </div>
      <p className="muted">
        Share a child's schedule with their other home, which runs its own separate copy of HomeQuest. By default the other home only sees busy/free time (school and clubs are shown by name); you choose which
        individual events to share in full when you add them. Nothing else — no other child, no rewards or coins — is ever shared.
      </p>

      {!mode && (
        <div className="btn-row">
          <button type="button" className="btn primary" onClick={() => setMode('create')}>
            <Icon name="share" size={18} /> Create a new link
          </button>
          <button type="button" className="btn ghost" onClick={() => setMode('redeem')}>
            I have a code from the other parent
          </button>
        </div>
      )}

      {mode === 'create' && <LinkForm children={children} submitLabel="Create link" onSubmit={(childId, label) => createLink(childId, label)} onCancel={() => setMode(undefined)} />}

      {mode === 'redeem' && (
        <LinkForm
          children={children}
          submitLabel="Pair"
          needsCode
          onSubmit={(childId, label, pasted) => redeemLink(childId, label, pasted ?? '')}
          onCancel={() => setMode(undefined)}
        />
      )}

      {showCode && (
        <div className="codebox">
          <code style={{ wordBreak: 'break-all' }}>{showCode}</code>
          <button type="button" className="btn ghost small" onClick={async () => setMsg((await copyText(showCode)) ? 'Code copied.' : 'Could not copy — select it manually.')}>
            <Icon name="copy" size={16} /> Copy
          </button>
          <p className="note">Send this code (by text, email — anything) to the other parent. In their HomeQuest, they choose "I have a code from the other parent" and paste it in.</p>
          <button type="button" className="btn ghost small" onClick={() => setShowCode(undefined)}>
            Done
          </button>
        </div>
      )}

      {links.map((link) => {
        const child = f.members[link.childId]
        const here = isHereWeek(link, today)
        const remote = coparentSync.remoteFor(link.linkId)
        const canShowCode = link.householdSlot === 'a' // only the side that created the link has a stable code to re-show
        return (
          <div key={link.linkId} className="facts" style={{ marginTop: 12 }}>
            <div className="quest-top">
              <strong>
                {child?.name ?? 'A child'} — {link.label || 'other home'}
              </strong>
            </div>
            <p className="muted">
              {here ? `With you this week.` : `With ${link.label || 'the other home'} this week.`} Next handoff {friendlyDay(nextHandoff(link, today), today)}.
              {remote ? ` Last heard from ${link.label || 'them'} ${new Date(remote.fetchedAt).toLocaleString()}.` : ' Waiting for their first update.'}
            </p>
            <div className="btn-row">
              <button
                type="button"
                className="btn ghost small"
                onClick={() => {
                  act(
                    A.saveCoparentLink(me!.id, {
                      linkId: link.linkId,
                      childId: link.childId,
                      label: link.label,
                      rotationAnchorMonday: nextHandoff(link, today),
                      anchorHere: !here,
                      linkKey: link.linkKey,
                      householdSlot: link.householdSlot,
                      sharedUrl: link.sharedUrl,
                      sharedAnonKey: link.sharedAnonKey,
                    }),
                  )
                  toast('Rotation flipped from next Monday.')
                }}
              >
                Flip rotation
              </button>
              {canShowCode && link.sharedUrl && link.sharedAnonKey && (
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => setShowCode(linkCodeFor({ url: link.sharedUrl!, anonKey: link.sharedAnonKey!, linkKey: link.linkKey, householdSlot: otherSlot(link.householdSlot) }))}
                >
                  Show code again
                </button>
              )}
              <button
                type="button"
                className="btn danger small"
                onClick={() => {
                  act(A.deleteCoparentLink(me!.id, link))
                  toast('Link removed.')
                }}
              >
                Remove link
              </button>
            </div>
          </div>
        )
      })}

      {msg && (
        <div className="toast" role="status">
          {msg}
        </div>
      )}
    </section>
  )
}

function LinkForm({
  children,
  submitLabel,
  needsCode,
  onSubmit,
  onCancel,
}: {
  children: { id: MemberId; name: string }[]
  submitLabel: string
  needsCode?: boolean
  onSubmit: (childId: MemberId, label: string, pasted?: string) => void
  onCancel: () => void
}) {
  const [childId, setChildId] = useState<MemberId>(children[0]!.id)
  const [label, setLabel] = useState('')
  const [pasted, setPasted] = useState('')
  return (
    <div className="field">
      <label className="field">
        <span>Which child?</span>
        <select className="tbox" value={childId} onChange={(e) => setChildId(e.target.value)}>
          {children.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Label for the other home</span>
        <input className="tbox" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Dad's, Mum's" maxLength={30} />
      </label>
      {needsCode && (
        <label className="field">
          <span>Their code</span>
          <input className="tbox" value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder="hqc2...." autoCapitalize="none" autoCorrect="off" />
        </label>
      )}
      <div className="btn-row">
        <button type="button" className="btn primary" onClick={() => onSubmit(childId, label.trim() || 'Other home', pasted)}>
          {submitLabel}
        </button>
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
