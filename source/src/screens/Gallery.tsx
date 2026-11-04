import { useSearchParams } from 'react-router-dom'
import { useApp } from '@/app/context'
import { solutionFor, judge } from '@/engine/judge'
import { Figure } from '@/ui/figures/Figure'
import { Rich } from '@/ui/rich'
import { AnswerView } from '@/ui/answers/AnswerView'

/**
 * Developer-only: renders sample questions from every generator so figures and wording can be eyeballed.
 * Open  /#/dev?figures=1  (only figure questions), ?q=ap. (generator id contains), ?n=3 (samples each), ?level=4,
 * ?answers=1 (show each question's real answer widget, to try it)
 */
export function Gallery() {
  const { registry } = useApp()
  const [sp] = useSearchParams()
  const q = sp.get('q') ?? ''
  const figuresOnly = sp.get('figures') === '1'
  const n = Number(sp.get('n') ?? 1)
  const forcedLevel = sp.get('level') ? Number(sp.get('level')) : undefined
  const answers = sp.get('answers') === '1'

  const rows = [...registry.packs.values()].flatMap((p) => p.generators).filter((g) => g.id.includes(q))
  return (
    <div className="screen" style={{ maxWidth: 520, margin: '0 auto' }}>
      <h1>Gallery</h1>
      {rows.flatMap((g) =>
        Array.from({ length: n }, (_, i) => {
          const level = forcedLevel ?? Math.round((g.levels[0] + g.levels[1]) / 2)
          const lv = Math.min(g.levels[1], Math.max(g.levels[0], level))
          const item = registry.generateWith(g.id, lv, 1000 + i * 37 + lv)
          if (figuresOnly && !item.figure) return null
          const expected = judge(item, solutionFor(item)).expected
          return (
            <div className="card" key={`${g.id}-${i}`}>
              <div className="muted small">
                {item.id}
              </div>
              <div className="prompt">
                <Rich text={item.prompt} />
              </div>
              {item.figure && <Figure figure={item.figure} />}
              {item.kind === 'choice' && (
                <ul className="list tight">
                  {item.options.map((o) => (
                    <li key={o.id}>
                      <Rich text={o.label} /> {o.correct ? '✓' : ''}
                    </li>
                  ))}
                </ul>
              )}
              <div className="muted small">
                Answer: <Rich text={expected} />
              </div>
              {answers && <AnswerView key={item.id} item={item} locked={false} judgement={null} onSubmit={() => {}} nudge={0} />}
            </div>
          )
        }),
      )}
    </div>
  )
}
