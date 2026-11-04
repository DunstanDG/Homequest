import { useEffect, useRef } from 'react'
import { useApp } from '@/app/context'

/** Currently selected subject (defaults to the first pack). The Learn tab may store 'all' (mixed quest) in
 * settings.subject; anything that isn't a pack id falls back to the first pack here. */
export function useSubject(): string {
  const { registry, settings } = useApp()
  const s = settings.subject
  return s && registry.packs.has(s) ? s : ([...registry.packs.keys()][0] as string)
}

/** Keeps the selected chip of a horizontally scrolling row in view (scrolls only the row, never the page). */
export function useKeepSelectedInView<T extends HTMLElement>(key: unknown) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const row = ref.current
    const sel = row?.querySelector<HTMLElement>('[aria-selected="true"], [aria-pressed="true"]')
    if (!row || !sel || row.scrollWidth <= row.clientWidth) return
    const r = row.getBoundingClientRect()
    const s = sel.getBoundingClientRect()
    const target = row.scrollLeft + (s.left - r.left) - (r.width - s.width) / 2
    row.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
  }, [key])
  return ref
}

/** Chip row for switching subject. Renders nothing while there is only one subject. */
export function SubjectPicker() {
  const { registry, updateSettings } = useApp()
  const subject = useSubject()
  const ref = useKeepSelectedInView<HTMLDivElement>(subject)
  if (registry.packs.size < 2) return null
  return (
    <div ref={ref} className="chips subject-chips" role="tablist" aria-label="Subject">
      {[...registry.packs.values()].map((p) => (
        <button key={p.id} type="button" role="tab" aria-selected={p.id === subject} className={`chip${p.id === subject ? ' selected' : ''}`} style={{ ['--accent' as string]: p.color }} onClick={() => updateSettings({ subject: p.id })}>
          {p.name}
        </button>
      ))}
    </div>
  )
}
