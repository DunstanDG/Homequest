import { useMemo } from 'react'
import { useApp, useLearnerOf } from '@/app/context'
import { friendlyDay } from '@/family/dates'
import { plainText } from '@/engine/judge'
import type { AppEvent } from '@/engine/types'
import type { RevealItem } from '@/engine/types'
import { Rich } from '@/ui/rich'

type Attempt = Extract<AppEvent, { type: 'attempt' }>

/**
 * A child's written, self-marked answers (the "explain why" / source / paragraph questions), newest first: the
 * question, what she wrote, whether she marked it as a pass, and the model answer she compared it with. Self-marking
 * is only as good as her honesty and judgement, so this is where a parent can read the real thing.
 */
export function Writing({ learnerId }: { learnerId: string }) {
  const { repo, registry } = useApp()
  const learner = useLearnerOf(learnerId) // re-renders when new answers sync in
  const today = new Date().toISOString().slice(0, 10)
  const rows = useMemo(() => {
    void learner
    return repo
      .allEvents()
      .filter((e): e is Attempt => e.type === 'attempt' && e.learnerId === learnerId && registry.isSlow(e.item.generatorId))
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 40)
      .map((a) => {
        let item: RevealItem | undefined
        try {
          const it = registry.generateWith(a.item.generatorId, a.item.difficulty, a.item.seed)
          if (it.kind === 'reveal') item = it
        } catch {
          // the question has since been removed from the app; still show what she wrote
        }
        return { a, item, subject: registry.packs.get(a.subject)?.name ?? a.subject }
      })
  }, [repo, registry, learnerId, learner])

  if (!rows.length) return <p className="note">No written answers yet. They come up in practice for English, Science, History, Geography, Computer Studies and German (not in timed games or the gap finder).</p>
  return (
    <div className="stack-gap">
      <p className="note">She writes first, then marks herself against a model answer and checklist. Here's what she wrote.</p>
      {rows.map(({ a, item, subject }) => (
        <article key={a.id} className="card">
          <p className="muted small">
            {subject} · {friendlyDay(a.day, today)} · <span className={`pill ${a.correct ? 'tone-good' : 'tone-warn'}`}>{a.correct ? 'Marked as a pass' : 'Marked as needs work'}</span>
          </p>
          <p>
            <strong>{item ? plainText(item.prompt) : 'Question no longer available'}</strong>
          </p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{a.given}</p>
          {item && (
            <details>
              <summary className="muted small">Model answer and checklist</summary>
              <Rich text={item.model} />
              <ul>
                {item.checklist.map((c) => (
                  <li key={c} className="muted small">
                    {c}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </article>
      ))}
    </div>
  )
}
