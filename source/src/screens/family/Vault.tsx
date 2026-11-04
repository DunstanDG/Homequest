/** A static reference vault: NHS numbers, microchip details, passport expiries. Same "soft trust" security as the rest of
 * the app — anyone with the family code can see this, so the screen says so plainly rather than pretending it's locked. */
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import * as CA from '@/family/careActions'
import { useApp, useFamily, useMe } from '@/app/context'
import type { VaultEvent } from '@/family/types'
import { Avatar, SectionHead } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'

const CATEGORIES = ['Health', 'Pets', 'Travel', 'Home', 'Other']

export function Vault() {
  const f = useFamily()
  const { act, toast } = useApp()
  const me = useMe()!
  const nav = useNavigate()
  const [editing, setEditing] = useState<VaultEvent | 'new' | undefined>()
  const [reveal, setReveal] = useState<Set<string>>(new Set())
  const items = Object.values(f.vault).filter((v) => !v.deleted)
  const groups = CATEGORIES.map((c) => ({ category: c, items: items.filter((i) => (i.category ?? 'Other') === c) })).filter((g) => g.items.length)
  // Health numbers and passport details are for the adults.
  if (me.role !== 'parent') return <Navigate to="/care" replace />

  const toggle = (id: string) =>
    setReveal((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  return (
    <div className="screen vault">
      <header className="screen-head">
        <button type="button" className="icon-btn" aria-label="Back" onClick={() => nav(-1)}>
          <Icon name="back" />
        </button>
        <div className="sh-title">
          <p className="eyebrow">Care</p>
          <h1>Reference vault</h1>
        </div>
        <button type="button" className="btn small" onClick={() => setEditing('new')}>
          <Icon name="plus" size={16} /> Add
        </button>
      </header>
      <p className="note">
        NHS numbers, microchip details, passport expiries — things you'd otherwise dig for. Anyone with the family code can see this, same as everything else in the app.
      </p>
      {items.length === 0 && <p className="empty-note">Nothing saved yet. Add the first thing worth having on hand.</p>}
      {groups.map((g) => (
        <div key={g.category} className="vault-group">
          <SectionHead title={g.category} />
          {g.items.map((v) => (
            <div key={v.itemId} className="vault-row">
              <div>
                {v.memberId && f.members[v.memberId] && (
                  <span className="vr-who">
                    <Avatar m={f.members[v.memberId]!} size={16} /> {f.members[v.memberId]!.name} ·{' '}
                  </span>
                )}
                <span className="vr-label">{v.label}</span>
                <div className={`vr-value${reveal.has(v.itemId) ? '' : ' hidden'}`}>{reveal.has(v.itemId) ? v.value : '•'.repeat(Math.min(12, v.value.length || 6))}</div>
              </div>
              <div className="row-fields" style={{ margin: 0 }}>
                <button type="button" className="icon-btn small" aria-label={reveal.has(v.itemId) ? 'Hide' : 'Reveal'} onClick={() => toggle(v.itemId)}>
                  <Icon name={reveal.has(v.itemId) ? 'eyeOff' : 'eye'} size={16} />
                </button>
                <button type="button" className="icon-btn small" aria-label="Edit" onClick={() => setEditing(v)}>
                  <Icon name="pencil" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
      {editing && (
        <VaultSheet
          existing={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(undefined)}
          onSave={(d) => {
            act(CA.saveVaultItem(me.id, editing === 'new' ? d : { ...d, itemId: editing.itemId }))
            toast('Saved.')
            setEditing(undefined)
          }}
          onDelete={
            editing !== 'new'
              ? () => {
                  act(CA.deleteVaultItem(me.id, editing))
                  toast('Removed.')
                  setEditing(undefined)
                }
              : undefined
          }
        />
      )}
    </div>
  )
}

function VaultSheet({ existing, onClose, onSave, onDelete }: { existing?: VaultEvent; onClose: () => void; onSave: (d: { label: string; value: string; category?: string; memberId?: string }) => void; onDelete?: () => void }) {
  const f = useFamily()
  const [label, setLabel] = useState(existing?.label ?? '')
  const [value, setValue] = useState(existing?.value ?? '')
  const [category, setCategory] = useState(existing?.category ?? 'Health')
  const [memberId, setMemberId] = useState(existing?.memberId ?? '')
  return (
    <Sheet open onClose={onClose} title={existing ? 'Edit item' : 'Add to the vault'}>
      <label className="field">
        <span>What is it</span>
        <input className="tbox" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. NHS number" maxLength={60} autoFocus />
      </label>
      <label className="field">
        <span>Value</span>
        <input className="tbox" value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 123 456 7890" maxLength={120} />
      </label>
      <div className="chips">
        {CATEGORIES.map((c) => (
          <button key={c} type="button" className={`chip small${category === c ? ' selected' : ''}`} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>
      <label className="field">
        <span>Whose (optional)</span>
        <select className="tbox" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
          <option value="">Family / household</option>
          {Object.values(f.members)
            .filter((m) => m.active)
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
        </select>
      </label>
      <button type="button" className="btn primary big block" disabled={!label.trim() || !value.trim()} onClick={() => onSave({ label, value, category, memberId: memberId || undefined })}>
        Save
      </button>
      {onDelete && (
        <button type="button" className="btn danger block" onClick={onDelete}>
          <Icon name="trash" size={16} /> Delete
        </button>
      )}
    </Sheet>
  )
}
