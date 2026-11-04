import type { Figure } from '@/engine/types'
import { Rich } from '../rich'
import { SvgText, fmtTick, niceStep } from './svg'

type Bar = Extract<Figure, { type: 'bar-chart' }>
type NL = Extract<Figure, { type: 'number-line' }>
type Sc = Extract<Figure, { type: 'scatter' }>
type Venn = Extract<Figure, { type: 'venn' }>
type Tab = Extract<Figure, { type: 'table' }>

export function BarChart({ f }: { f: Bar }) {
  const W = 320
  const H = 220
  const ml = 38
  const mr = 10
  const mt = 26
  const mb = 34
  const max = Math.max(...f.bars.map((b) => b.value), 1)
  const step = niceStep(max, 5)
  const top = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v)
  const pw = W - ml - mr
  const ph = H - mt - mb
  const y = (v: number) => mt + ph - (v / top) * ph
  const slot = pw / f.bars.length
  const bw = Math.min(slot * 0.62, 44)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fig-svg" role="img" aria-label="Bar chart">
      {ticks.map((v) => (
        <g key={v}>
          <line x1={ml} x2={W - mr} y1={y(v)} y2={y(v)} className="grid" />
          <SvgText x={ml - 6} y={y(v)} text={fmtTick(v)} anchor="end" className="tick" />
        </g>
      ))}
      <line x1={ml} x2={ml} y1={mt} y2={mt + ph} className="axis" />
      <line x1={ml} x2={W - mr} y1={mt + ph} y2={mt + ph} className="axis" />
      {f.yLabel && <SvgText x={ml} y={10} text={f.yLabel} anchor="start" className="axis-name" />}
      {f.bars.map((b, i) => {
        const cx = ml + slot * (i + 0.5)
        return (
          <g key={i}>
            <rect x={cx - bw / 2} y={y(b.value)} width={bw} height={mt + ph - y(b.value)} className="chart-bar" rx={3} />
            {f.showValues && <SvgText x={cx} y={y(b.value) - 8} text={String(b.value)} className="tick" />}
            <SvgText x={cx} y={mt + ph + 15} text={b.label} className="tick" />
          </g>
        )
      })}
    </svg>
  )
}

export function NumberLine({ f }: { f: NL }) {
  const W = 320
  const H = 92
  const ml = 24
  const mr = 24
  const span = f.max - f.min
  const x = (v: number) => ml + ((v - f.min) / span) * (W - ml - mr)
  const step = span <= 1 ? 0.1 : niceStep(span, 10)
  const ticks: number[] = []
  for (let v = f.min; v <= f.max + 1e-9; v += step) ticks.push(Math.round(v * 1e6) / 1e6)
  const yLine = 58
  const labelled = new Set(f.marks.map((m) => m.at))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fig-svg" role="img" aria-label="Number line">
      <line x1={ml - 8} x2={W - mr + 8} y1={yLine} y2={yLine} className="axis" />
      {ticks.map((v) => (
        <g key={v}>
          <line x1={x(v)} x2={x(v)} y1={yLine - 6} y2={yLine + 6} className="axis" />
          {!labelled.has(v) && span > 1 && <SvgText x={x(v)} y={yLine + 20} text={fmtTick(v)} className="tick" />}
        </g>
      ))}
      {f.marks.map((m, i) => {
        const isPoint = /^[A-Za-z]$/.test(m.label)
        return (
          <g key={i}>
            {isPoint ? (
              <>
                <circle cx={x(m.at)} cy={yLine} r={6} className="pt" />
                <SvgText x={x(m.at)} y={yLine - 20} text={m.label} className="lbl" />
              </>
            ) : (
              <SvgText x={x(m.at)} y={yLine + 22} text={m.label} className="tick strong" />
            )}
          </g>
        )
      })}
    </svg>
  )
}

export function Scatter({ f }: { f: Sc }) {
  const W = 320
  const H = 240
  const ml = 38
  const mr = 14
  const mt = 16
  const mb = 34
  const maxX = Math.max(...f.points.map((p) => p[0]), ...(f.line ? [f.line[1][0]] : []), 1)
  const maxY = Math.max(...f.points.map((p) => p[1]), ...(f.line ? [f.line[0][1], f.line[1][1]] : []), 1)
  const sx = niceStep(maxX, 5)
  const sy = niceStep(maxY, 5)
  const topX = Math.ceil(maxX / sx) * sx
  const topY = Math.ceil(maxY / sy) * sy
  const px = (v: number) => ml + (v / topX) * (W - ml - mr)
  const py = (v: number) => H - mb - (v / topY) * (H - mt - mb)
  const xt: number[] = []
  for (let v = 0; v <= topX + 1e-9; v += sx) xt.push(v)
  const yt: number[] = []
  for (let v = 0; v <= topY + 1e-9; v += sy) yt.push(v)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fig-svg" role="img" aria-label="Scatter graph">
      {xt.map((v) => (
        <g key={`x${v}`}>
          <line x1={px(v)} x2={px(v)} y1={mt} y2={H - mb} className="grid" />
          <SvgText x={px(v)} y={H - mb + 13} text={fmtTick(v)} className="tick" />
        </g>
      ))}
      {yt.map((v) => (
        <g key={`y${v}`}>
          <line x1={ml} x2={W - mr} y1={py(v)} y2={py(v)} className="grid" />
          <SvgText x={ml - 6} y={py(v)} text={fmtTick(v)} anchor="end" className="tick" />
        </g>
      ))}
      <line x1={ml} x2={ml} y1={mt} y2={H - mb} className="axis" />
      <line x1={ml} x2={W - mr} y1={H - mb} y2={H - mb} className="axis" />
      <SvgText x={W - mr} y={H - 8} text={f.xLabel} anchor="end" className="axis-name" />
      <SvgText x={ml + 6} y={mt - 4} text={f.yLabel} anchor="start" className="axis-name" />
      {f.line && <line x1={px(f.line[0][0])} y1={py(f.line[0][1])} x2={px(f.line[1][0])} y2={py(f.line[1][1])} className="ln accent" />}
      {f.points.map((p, i) => (
        <circle key={i} cx={px(p[0])} cy={py(p[1])} r={4.5} className="pt" />
      ))}
    </svg>
  )
}

export function VennFig({ f }: { f: Venn }) {
  const W = 320
  const H = 200
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fig-svg" role="img" aria-label="Venn diagram">
      <rect x={6} y={6} width={W - 12} height={H - 12} rx={10} className="poly" fill="none" />
      <circle cx={122} cy={104} r={64} className="wedge w0" />
      <circle cx={198} cy={104} r={64} className="wedge w2" />
      <SvgText x={96} y={34} text={f.leftLabel} className="lbl small" />
      <SvgText x={224} y={34} text={f.rightLabel} className="lbl small" />
      <SvgText x={92} y={104} text={f.left} className="lbl big" />
      <SvgText x={160} y={104} text={f.both} className="lbl big" />
      <SvgText x={228} y={104} text={f.right} className="lbl big" />
      <SvgText x={W - 24} y={H - 22} text={f.outside} className="lbl big" />
    </svg>
  )
}

export function TableFig({ f }: { f: Tab }) {
  return (
    <div className="fig-table-wrap">
      <table className="fig-table">
        <thead>
          <tr>
            {f.head.map((h, i) => (
              <th key={i}>
                <Rich text={h} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {f.rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, k) => (
                <td key={k}>
                  <Rich text={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
