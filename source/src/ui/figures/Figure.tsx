import type { Figure as FigureData } from '@/engine/types'
import { Angles } from './Angles'
import { BarChart, NumberLine, Scatter, TableFig, VennFig } from './Charts'
import { CoordGrid } from './CoordGrid'
import { Passage } from './Passage'
import { Shapes } from './Shapes'

/** Renders whichever figure an item carries. Every figure is inline SVG (or a table) so it scales to any phone. */
export function Figure({ figure }: { figure: FigureData }) {
  let body
  switch (figure.type) {
    case 'coord-grid':
      body = <CoordGrid f={figure} />
      break
    case 'bar-chart':
      body = <BarChart f={figure} />
      break
    case 'shape':
      body = <Shapes f={figure} />
      break
    case 'angles':
      body = <Angles f={figure} />
      break
    case 'number-line':
      body = <NumberLine f={figure} />
      break
    case 'scatter':
      body = <Scatter f={figure} />
      break
    case 'venn':
      body = <VennFig f={figure} />
      break
    case 'table':
      body = <TableFig f={figure} />
      break
    case 'passage':
      body = <Passage f={figure} />
      break
    case 'code':
      body = (
        <pre className="code-listing" aria-label={figure.language ? `${figure.language} code` : 'Code'}>
          <code>{figure.code}</code>
        </pre>
      )
      break
  }
  return <div className={`figure fig-${figure.type}`}>{body}</div>
}
