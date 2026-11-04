import { useMemo } from 'react'
import { useApp, useCalCtx, useFamily } from '@/app/context'
import { itemsBetween } from '@/family/calendar'
import { addDays, dayName, dayOfMonth, monthName, startOfWeek, ymdOf } from '@/family/dates'
import { mealAt } from '@/family/meals'
import type { Ymd } from '@/family/types'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'

/**
 * The week for the whiteboard: dinners and what is on each day, as short lines to copy out. The family plans the week
 * together (the weekly summit), then updates the board in the house from this.
 */
export function boardLines(days: Ymd[], dinner: (d: Ymd) => string | undefined, things: (d: Ymd) => string[]): { date: Ymd; label: string; dinner?: string; things: string[] }[] {
  return days.map((d) => ({ date: d, label: `${dayName(d)} ${dayOfMonth(d)} ${monthName(d)}`, dinner: dinner(d), things: things(d) }))
}

export function boardText(lines: ReturnType<typeof boardLines>): string {
  return lines.map((l) => [l.label, l.dinner ? `  Dinner: ${l.dinner}` : '  Dinner: not planned', ...l.things.map((t) => `  ${t}`)].join('\n')).join('\n\n')
}

export function BoardSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useApp()
  const f = useFamily()
  const ctx = useCalCtx()
  const start = startOfWeek(ymdOf(Date.now()))
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(start, i)), [start])
  const lines = useMemo(() => {
    if (!open) return []
    const items = itemsBetween(ctx, days[0]!, days[6]!, { skipTasks: true })
    return boardLines(
      days,
      (d) => mealAt(f, d, 'dinner')?.title,
      (d) =>
        (items[d] ?? [])
          .filter((i) => i.source !== 'lesson' && i.source !== 'school' && i.source !== 'birthday' && i.source !== 'meal')
          .map((i) => `${i.start ? `${i.start} ` : ''}${i.title.replace(/^\p{Extended_Pictographic}\s*/u, '')}`),
    )
  }, [open, ctx, f, days])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(boardText(lines))
      toast('Copied.')
    } catch {
      toast("Couldn't copy. Select the text instead.")
    }
  }
  return (
    <Sheet open={open} onClose={onClose} title="The board this week">
      <p className="note">Dinners and what is on, ready to copy onto the whiteboard.</p>
      <ul className="board-list">
        {lines.map((l) => (
          <li key={l.date}>
            <strong>{l.label}</strong>
            <span>🍽️ {l.dinner ?? <em className="muted">not planned</em>}</span>
            {l.things.map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </li>
        ))}
      </ul>
      <button type="button" className="btn block" onClick={copy}>
        <Icon name="copy" size={16} /> Copy as text
      </button>
    </Sheet>
  )
}
