import type { Figure } from '@/engine/types'

type PassageFig = Extract<Figure, { type: 'passage' }>

/** A text to read with the question: paragraphs split on blank lines, single line breaks kept (poetry, scripts). */
export function Passage({ f }: { f: PassageFig }) {
  return (
    <figure className="passage">
      {f.title && <figcaption className="passage-title">{f.title}</figcaption>}
      {f.text.split(/\n\s*\n/).map((para, i) => (
        <p key={i}>
          {para.split('\n').map((line, j, all) => (
            <span key={j}>
              {line}
              {j < all.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
      {f.source && <p className="passage-source">{f.source}</p>}
    </figure>
  )
}
