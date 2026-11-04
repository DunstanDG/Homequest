/** "Edit Today": put the blocks on Today in your own order and switch off the ones you don't want. Kept on this
 * phone, for whoever is using it (see app/todayLayout.ts). */
import { useMe } from '@/app/context'
import { BLOCKS, defaultOrder, moveBlock, resolveLayout, saveLayout, useSavedLayout, type BlockId, type LayoutKind } from '@/app/todayLayout'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'

export function EditTodaySheet({ kind, onClose }: { kind: LayoutKind; onClose: () => void }) {
  const me = useMe()!
  const saved = useSavedLayout(me.id, kind)
  const layout = resolveLayout(defaultOrder(kind), saved)
  const write = (order: BlockId[], hidden: Set<BlockId>) => saveLayout(me.id, kind, { order, hidden: [...hidden] })
  const toggle = (id: BlockId) => {
    const h = new Set(layout.hidden)
    if (h.has(id)) h.delete(id)
    else h.add(id)
    write(layout.order, h)
  }
  return (
    <Sheet open onClose={onClose} title="Edit Today">
      <p className="note">Move things up or down and switch off what you don’t need. This is just for you, on this phone.</p>
      <ol className="edit-today-list">
        {layout.order.map((id, i) => {
          const b = BLOCKS[id]
          const off = layout.hidden.has(id)
          return (
            <li key={id} className={off ? 'off' : ''}>
              <span className="et-emoji" aria-hidden="true">
                {b.emoji}
              </span>
              <span className="grow">
                <strong>{b.label}</strong>
                <small>{b.pinned ? 'Always shown' : b.hint}</small>
              </span>
              <span className="et-move">
                <button type="button" className="icon-btn small" aria-label={`Move ${b.label} up`} disabled={i === 0} onClick={() => write(moveBlock(layout.order, id, -1), layout.hidden)}>
                  <span aria-hidden="true">▲</span>
                </button>
                <button type="button" className="icon-btn small" aria-label={`Move ${b.label} down`} disabled={i === layout.order.length - 1} onClick={() => write(moveBlock(layout.order, id, 1), layout.hidden)}>
                  <span aria-hidden="true">▼</span>
                </button>
              </span>
              <input type="checkbox" className="switch" checked={!off} disabled={b.pinned} onChange={() => toggle(id)} aria-label={`Show ${b.label}`} />
            </li>
          )
        })}
      </ol>
      <div className="btn-row">
        <button type="button" className="btn primary" onClick={onClose}>
          <Icon name="check" size={16} /> Done
        </button>
        <button type="button" className="btn ghost" disabled={!saved} onClick={() => saveLayout(me.id, kind, undefined)}>
          Reset to default
        </button>
      </div>
      <p className="note">Some things only appear when there’s something to show (the new-baby plan, the evening brain dump, school kit).</p>
    </Sheet>
  )
}
