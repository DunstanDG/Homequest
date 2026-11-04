import { useEffect, useState } from 'react'
import * as PA from '@/family/privacyActions'
import { useApp, useFamily, useMe } from '@/app/context'
import { usePrivacy } from '@/app/usePrivacy'
import { fingerprint, keyCode, parseKeyCode } from '@/storage/privateKeys'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'

/**
 * Your private key: make it, see it, put it on a second phone, give a parent a copy (children need this before using Private) and,
 * for a parent, hold and hand back copies. A key is a code you pass by hand: it is never sent to the server in the family log.
 */
export function PrivateKeys({ onClose }: { onClose: () => void }) {
  const { sync, act, toast } = useApp()
  const f = useFamily()
  const me = useMe()!
  const st = usePrivacy()
  const [show, setShow] = useState(false)
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [shown, setShown] = useState<string | undefined>()
  const [checking, setChecking] = useState(false)
  const own = sync.ownKey()
  const copies = PA.copiesOf(f, me.id)
  const held = Object.entries(sync.keys.copies)
  const parent = me.role === 'parent'

  useEffect(() => {
    void sync.checkPrivateReady()
  }, [sync])

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast('Copied.')
    } catch {
      toast('Could not copy: select the code and copy it by hand.')
    }
  }

  const add = async () => {
    setErr('')
    const p = parseKeyCode(code)
    if (!p) return setErr('That is not a key code. It starts with “hqk1.”')
    const person = f.members[p.memberId]
    if (!person) return setErr('That key belongs to someone this family does not have.')
    if (p.memberId === me.id) {
      if (own && own !== p.key) return setErr('This phone already has a different key for you.')
      await sync.setOwnKey(me.id, p.key)
      toast('Key added. Your private things will arrive in a moment.')
    } else if (parent) {
      const fp = await sync.addCopy(p.memberId, p.key)
      act(PA.saveKeyCopy(me.id, p.memberId, me.id, fp))
      toast(`You now hold a copy of ${person.name}'s key.`)
    } else {
      return setErr('That key is for someone else. Only a parent can hold a copy of another person’s key.')
    }
    setCode('')
  }

  return (
    <Sheet open onClose={onClose} title="Private key">
      <p className="note">
        Things you mark private (brain dump items, and for adults your check-in mood) are stored with your key. Nobody else’s phone receives them. The key lives on your phone, not in the family’s
        shared data.
      </p>
      {st.dbReady === false && (
        <div className="card callout">
          <Icon name="info" size={20} />
          <div>
            <p>
              The database needs a one-time update before private things can be stored: run <code>supabase/schema_v3.sql</code> in the Supabase SQL editor, then check again.
            </p>
            <button type="button" className="btn small" disabled={checking} onClick={async () => (setChecking(true), await sync.checkPrivateReady(), setChecking(false))}>
              Check again
            </button>
          </div>
        </div>
      )}
      {!own ? (
        <>
          <p className="note">
            If every phone you use is lost, your private things cannot be recovered
            {me.role === 'child' ? ', so a parent holds a copy of yours' : '. You can give a parent a copy (below) or keep your code written down'}.
          </p>
          <button
            type="button"
            className="btn primary block"
            disabled={st.dbReady !== true}
            onClick={async () => {
              await sync.createOwnKey()
              toast('Your key is made.')
            }}
          >
            Make my private key
          </button>
        </>
      ) : (
        <>
          <p className="note">
            <Icon name="check" size={16} /> This phone has your key.{' '}
            {me.role === 'child'
              ? st.needsCopy
                ? 'A parent needs a copy before you can use Private.'
                : 'A parent holds a copy.'
              : copies.length
                ? `${copies.map((c) => f.members[c.holder]?.name ?? 'Someone').join(', ')} hold${copies.length === 1 ? 's' : ''} a copy.`
                : 'Nobody holds a copy (optional).'}
          </p>
          {show ? (
            <div className="field">
              <span>Your code (keep it to yourself and the parent you give it to)</span>
              <input className="tbox" readOnly value={keyCode(me.id, own)} onFocus={(e) => e.currentTarget.select()} aria-label="Your key code" />
              <div className="btn-row">
                <button type="button" className="btn small" onClick={() => void copy(keyCode(me.id, own))}>
                  Copy
                </button>
                <button type="button" className="btn small ghost" onClick={() => setShow(false)}>
                  Hide
                </button>
              </div>
              <p className="note">To use it on another phone: open Private key there and add this code. To give a parent a copy: they add it the same way.</p>
            </div>
          ) : (
            <button type="button" className="btn block" onClick={() => setShow(true)}>
              Show my code
            </button>
          )}
        </>
      )}

      <h3 className="sheet-sub">Add a key from a code</h3>
      <div className="row-fields">
        <input className="tbox grow" value={code} onChange={(e) => setCode(e.target.value)} placeholder="hqk1.…" aria-label="Key code" />
        <button type="button" className="btn small" disabled={!code.trim()} onClick={() => void add()}>
          Add
        </button>
      </div>
      <p className="note">
        {parent ? 'Your own code goes on this phone; anyone else’s is held as a copy so you can restore it for them.' : 'Use this on a second phone, or to put your key back on a new phone.'}
      </p>
      {err && (
        <p className="note" role="alert">
          {err}
        </p>
      )}

      {parent && held.length > 0 && (
        <>
          <h3 className="sheet-sub">Copies you hold</h3>
          <ul className="list">
            {held.map(([mid, key]) => (
              <li key={mid} className="stack">
                <span className="li-main">{f.members[mid]?.name ?? mid}</span>
                {shown === mid ? (
                  <input className="tbox" readOnly value={keyCode(mid, key)} onFocus={(e) => e.currentTarget.select()} aria-label={`Code for ${f.members[mid]?.name ?? mid}`} />
                ) : (
                  <small className="muted">Held for restoring a lost phone. The app never shows their private things.</small>
                )}
                <div className="btn-row">
                  <button type="button" className="btn small ghost" onClick={() => setShown(shown === mid ? undefined : mid)}>
                    {shown === mid ? 'Hide code' : 'Show code to restore'}
                  </button>
                  <button
                    type="button"
                    className="btn small ghost"
                    onClick={async () => {
                      await sync.removeCopy(mid)
                      act(PA.saveKeyCopy(me.id, mid, me.id, await fingerprint(key), true))
                    }}
                  >
                    Remove my copy
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Sheet>
  )
}
