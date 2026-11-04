import type { Figure } from '@/engine/types'
import { SvgText, fmtTick } from './svg'

type Grid = Extract<Figure, { type: 'coord-grid' }>

function autoStep(span: number): number {
  if (span <= 12) return 1
  if (span <= 24) return 2
  if (span <= 60) return 5
  return 10
}

export function CoordGrid({ f }: { f: Grid }) {
  const [x0, x1] = f.xRange
  const [y0, y1] = f.yRange
  const xSpan = x1 - x0
  const ySpan = y1 - y0
  const ml = 30
  const mb = 24
  const mt = 16
  const mr = 16
  const cellX = Math.min(300 / xSpan, 36)
  const cellY = Math.min(300 / ySpan, 36)
  const W = ml + xSpan * cellX + mr
  const H = mt + ySpan * cellY + mb
  const px = (x: number) => ml + (x - x0) * cellX
  const py = (y: number) => mt + (y1 - y) * cellY
  const xs = f.xStep ?? autoStep(xSpan)
  const ys = f.yStep ?? autoStep(ySpan)
  const xTicks: number[] = []
  for (let v = Math.ceil(x0 / xs) * xs; v <= x1 + 1e-9; v += xs) xTicks.push(Math.round(v * 1e6) / 1e6)
  const yTicks: number[] = []
  for (let v = Math.ceil(y0 / ys) * ys; v <= y1 + 1e-9; v += ys) yTicks.push(Math.round(v * 1e6) / 1e6)

  const axisY = y0 <= 0 && y1 >= 0 ? py(0) : py(y0)
  const axisX = x0 <= 0 && x1 >= 0 ? px(0) : px(x0)
  const labelsBelow = axisY + 12 > H - 4 ? axisY - 12 : axisY + 12

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fig-svg" role="img" aria-label="Coordinate grid">
      <rect x={ml} y={mt} width={xSpan * cellX} height={ySpan * cellY} className="grid-bg" />
      {xTicks.map((v) => (
        <line key={`gx${v}`} x1={px(v)} x2={px(v)} y1={mt} y2={mt + ySpan * cellY} className="grid" />
      ))}
      {yTicks.map((v) => (
        <line key={`gy${v}`} x1={ml} x2={ml + xSpan * cellX} y1={py(v)} y2={py(v)} className="grid" />
      ))}
      <line x1={ml} x2={ml + xSpan * cellX} y1={axisY} y2={axisY} className="axis" />
      <line x1={axisX} x2={axisX} y1={mt} y2={mt + ySpan * cellY} className="axis" />
      {xTicks
        .filter((v) => v !== 0 || axisX !== px(0))
        .map((v) => (
          <SvgText key={`tx${v}`} x={px(v)} y={labelsBelow} text={fmtTick(v)} className="tick" />
        ))}
      {yTicks
        .filter((v) => v !== 0 || axisY !== py(0))
        .map((v) => (
          <SvgText key={`ty${v}`} x={axisX - 6} y={py(v)} text={fmtTick(v)} anchor="end" className="tick" />
        ))}
      {y0 <= 0 && y1 >= 0 && x0 <= 0 && x1 >= 0 && <SvgText x={axisX - 6} y={axisY + 12} text="0" anchor="end" className="tick" />}
      {f.xLabel && <SvgText x={ml + xSpan * cellX + 2} y={axisY - 9} text={f.xLabel} anchor="end" className="axis-name" />}
      {f.yLabel && <SvgText x={axisX + 8} y={mt - 5} text={f.yLabel} anchor="start" className="axis-name" />}

      {f.mirror &&
        (f.mirror.axis === 'x' ? (
          <line x1={px(f.mirror.at)} x2={px(f.mirror.at)} y1={mt} y2={mt + ySpan * cellY} className="mirror" />
        ) : (
          <line x1={ml} x2={ml + xSpan * cellX} y1={py(f.mirror.at)} y2={py(f.mirror.at)} className="mirror" />
        ))}

      {f.polygons?.map((p, i) => {
        const pts = p.points.map(([x, y]) => `${px(x)},${py(y)}`).join(' ')
        const cx = p.points.reduce((a, q) => a + q[0], 0) / p.points.length
        const cy = p.points.reduce((a, q) => a + q[1], 0) / p.points.length
        return (
          <g key={`p${i}`}>
            <polygon points={pts} className={p.ghost ? 'poly ghost' : 'poly'} />
            {p.points.map(([x, y], k) => (
              <circle key={k} cx={px(x)} cy={py(y)} r={3} className={p.ghost ? 'pt ghost' : 'pt'} />
            ))}
            {p.label && <SvgText x={px(cx)} y={py(cy)} text={p.label} className="lbl" />}
          </g>
        )
      })}

      {f.lines?.map((l, i) => (
        <g key={`l${i}`}>
          <line x1={px(l.from[0])} y1={py(l.from[1])} x2={px(l.to[0])} y2={py(l.to[1])} className="ln" />
          {f.dots && (
            <>
              <circle cx={px(l.from[0])} cy={py(l.from[1])} r={3.5} className="pt" />
              <circle cx={px(l.to[0])} cy={py(l.to[1])} r={3.5} className="pt" />
            </>
          )}
          {l.label && <SvgText x={(px(l.from[0]) + px(l.to[0])) / 2 + 10} y={(py(l.from[1]) + py(l.to[1])) / 2 - 10} text={l.label} className="lbl" />}
        </g>
      ))}

      {f.points?.map((p, i) => (
        <g key={`pt${i}`}>
          <circle cx={px(p.x)} cy={py(p.y)} r={5} className="pt" />
          {p.label && <SvgText x={px(p.x) + 9} y={py(p.y) - 9} text={p.label} anchor="start" className="lbl" />}
        </g>
      ))}
    </svg>
  )
}
