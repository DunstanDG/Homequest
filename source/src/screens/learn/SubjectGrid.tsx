import type { Registry } from '@/engine/registry'
import type { SubjectId } from '@/engine/types'
import { Ring } from '@/ui/primitives'
import { ALL, subjectEmoji, subjectShort, type Focus, type SubjectProgress } from './subjects'

/** Learn home subject picker: an "All subjects" (mixed quest) tile plus one tile per pack, each with a progress
 * ring (half credit for a started skill, full for a secure one). Tapping focuses that subject (the games below filter to it). */
export function SubjectGrid({
  registry,
  progress,
  focus,
  questValue,
  onFocus,
}: {
  registry: Registry
  progress: Map<SubjectId, SubjectProgress>
  focus: Focus
  /** 0..1 of today's daily quest, shown on the All tile. */
  questValue: number
  onFocus: (f: Focus) => void
}) {
  return (
    <div className="lq-grid" role="group" aria-label="Subjects">
      <button type="button" className={`lq-tile${focus === ALL ? ' on' : ''}`} aria-pressed={focus === ALL} onClick={() => onFocus(ALL)}>
        <Ring value={questValue} size={42} stroke={4} tone="xp">
          <span className="lq-emoji" aria-hidden="true">
            ✨
          </span>
        </Ring>
        <strong>All subjects</strong>
        <small>Mixed quest</small>
      </button>
      {[...registry.packs.values()].map((p) => {
        const pr = progress.get(p.id)
        const total = pr?.total ?? 0
        const secure = pr?.secure ?? 0
        const started = pr?.started ?? 0
        const on = focus === p.id
        return (
          <button
            key={p.id}
            type="button"
            className={`lq-tile${on ? ' on' : ''}`}
            aria-pressed={on}
            aria-label={`${p.name}: ${secure} of ${total} skills secure, ${started} started${pr?.due ? `, ${pr.due} to revise` : ''}`}
            style={{ ['--accent' as string]: p.color }}
            onClick={() => onFocus(p.id)}
          >
            <Ring value={total ? (started + secure) / (2 * total) : 0} size={42} stroke={4}>
              <span className="lq-emoji" aria-hidden="true">
                {subjectEmoji(p.id, p.name)}
              </span>
            </Ring>
            <strong title={p.name}>{subjectShort(p.id, p.name)}</strong>
            <small>{secure ? `${secure}/${total}` : started ? `${started} started` : `${total} skills`}</small>
            {!!pr?.due && <span className="lq-due" aria-hidden="true" title="Revision due" />}
          </button>
        )
      })}
    </div>
  )
}
