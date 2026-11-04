import type { Figure } from '@/engine/types'
import { SvgText, angleSizes, arcPath, clampN, isUnknown, numOf, pol, wedgePath } from './svg'

type Ang = Extract<Figure, { type: 'angles' }>

const cls = (label: string, i: number) => `wedge w${i % 5}${isUnknown(label) ? ' unk' : ''}`

/** A filled sector plus its label. Small angles push the label further out so it stays legible. */
function Sector({ cx, cy, a0, a1, label, i, r = 34, lr }: { cx: number; cy: number; a0: number; a1: number; label: string; i: number; r?: number; lr?: number }) {
  const mid = (a0 + a1) / 2
  const size = a1 - a0
  const radius = lr ?? (size < 40 ? r + 40 : size < 60 ? r + 28 : r + 20)
  const [lx, ly] = pol(cx, cy, radius, mid)
  return (
    <g>
      <path d={wedgePath(cx, cy, r, a0, a1)} className={cls(label, i)} />
      <path d={arcPath(cx, cy, r, a0, a1)} className="ln thin" fill="none" />
      <SvgText x={lx} y={ly} text={label} className={isUnknown(label) ? 'lbl unk' : 'lbl'} />
    </g>
  )
}

function Ray({ cx, cy, len, deg }: { cx: number; cy: number; len: number; deg: number }) {
  const [x, y] = pol(cx, cy, len, deg)
  return <line x1={cx} y1={cy} x2={x} y2={y} className="ln" />
}

function Straight({ labels }: { labels: Record<string, string> }) {
  const keys = ['a', 'b', 'c'].filter((k) => labels[k] !== undefined)
  const sizes = angleSizes(180, keys.map((k) => labels[k]))
  const cx = 160
  const cy = 128
  let a = 180
  const secs = keys.map((k, i) => {
    const size = sizes[i] as number
    const a1 = a
    const a0 = a - size
    a = a0
    return { k, a0, a1, label: labels[k] as string }
  })
  return (
    <svg viewBox="0 0 320 150" className="fig-svg" role="img" aria-label="Angles on a straight line">
      <line x1={14} y1={cy} x2={306} y2={cy} className="ln" />
      {secs.slice(0, -1).map((s) => (
        <Ray key={s.k} cx={cx} cy={cy} len={112} deg={s.a0} />
      ))}
      {secs.map((s, i) => (
        <Sector key={s.k} cx={cx} cy={cy} a0={s.a0} a1={s.a1} label={s.label} i={i} r={38} lr={78} />
      ))}
      <circle cx={cx} cy={cy} r={3} className="pt" />
    </svg>
  )
}

function Point({ labels }: { labels: Record<string, string> }) {
  const keys = ['a', 'b', 'c', 'd', 'e'].filter((k) => labels[k] !== undefined)
  const sizes = angleSizes(360, keys.map((k) => labels[k]), 34)
  const cx = 150
  const cy = 122
  let a = 90 + 20
  const secs = keys.map((k, i) => {
    const a0 = a
    const a1 = a + (sizes[i] as number)
    a = a1
    return { k, a0, a1, label: labels[k] as string }
  })
  return (
    <svg viewBox="0 0 300 244" className="fig-svg" role="img" aria-label="Angles around a point">
      {secs.map((s) => (
        <Ray key={s.k} cx={cx} cy={cy} len={108} deg={s.a0} />
      ))}
      {secs.map((s, i) => (
        <Sector key={s.k} cx={cx} cy={cy} a0={s.a0} a1={s.a1} label={s.label} i={i} r={40} lr={s.a1 - s.a0 < 60 ? 80 : 66} />
      ))}
      <circle cx={cx} cy={cy} r={3} className="pt" />
    </svg>
  )
}

function Vertical({ labels }: { labels: Record<string, string> }) {
  const known = (k: string) => numOf(labels[k])
  let a = known('a') ?? known('c')
  if (a === undefined) {
    const b = known('b') ?? known('d')
    if (b !== undefined) a = 180 - b
    else {
      // Nothing numeric to go on: make the labelled angles the wide ones so their text has room.
      const has = (ks: string[]) => ks.some((k) => labels[k] !== undefined)
      a = has(['a', 'c']) && !has(['b', 'd']) ? 110 : has(['b', 'd']) && !has(['a', 'c']) ? 70 : 90
    }
  }
  a = clampN(a, 34, 146)
  const cx = 150
  const cy = 100
  const t = 90 - a / 2 // upper-right ray
  const rays = [t, 90 + a / 2, 270 - a / 2, 270 + a / 2]
  // top wedge, right wedge (t .. -t), bottom wedge, left wedge
  const secs = [
    { k: 'a', a0: t, a1: 90 + a / 2 },
    { k: 'd', a0: 90 + a / 2, a1: 270 - a / 2 },
    { k: 'c', a0: 270 - a / 2, a1: 270 + a / 2 },
    { k: 'b', a0: 270 + a / 2, a1: 360 + t },
  ].filter((s) => labels[s.k] !== undefined)
  return (
    <svg viewBox="0 0 300 200" className="fig-svg" role="img" aria-label="Two crossing lines">
      {rays.map((d, i) => (
        <Ray key={i} cx={cx} cy={cy} len={92} deg={d} />
      ))}
      {secs.map((s, i) => (
        <Sector key={s.k} cx={cx} cy={cy} a0={s.a0} a1={s.a1} label={labels[s.k] as string} i={i} r={30} lr={(s.a1 - s.a0) < 60 ? 68 : 60} />
      ))}
      <circle cx={cx} cy={cy} r={3} className="pt" />
    </svg>
  )
}

function Parallel({ kind, labels }: { kind: 'parallel-alternate' | 'parallel-corresponding'; labels: Record<string, string> }) {
  let phi = numOf(labels.p) ?? numOf(labels.q)
  if (phi === undefined) {
    const r = numOf(labels.r)
    phi = r === undefined ? 62 : 180 - r
  }
  phi = clampN(phi, 36, 144)
  const yU = 50
  const yL = 154
  const dx = (yL - yU) / 2 / Math.tan((phi * Math.PI) / 180)
  const uX = 160 + dx
  const lX = 160 - dx
  const dir: [number, number] = [Math.cos((phi * Math.PI) / 180), -Math.sin((phi * Math.PI) / 180)]
  const start: [number, number] = [lX - dir[0] * 48, yL - dir[1] * 48]
  const end: [number, number] = [uX + dir[0] * 48, yU + dir[1] * 48]
  const arrow = (y: number) => (
    <g className="ln thin" fill="none">
      <path d={`M 252 ${y - 6} L 260 ${y} L 252 ${y + 6}`} />
      <path d={`M 262 ${y - 6} L 270 ${y} L 262 ${y + 6}`} />
    </g>
  )
  const alt = kind === 'parallel-alternate'
  return (
    <svg viewBox="0 0 320 204" className="fig-svg" role="img" aria-label="Parallel lines cut by a transversal">
      <line x1={14} y1={yU} x2={306} y2={yU} className="ln" />
      <line x1={14} y1={yL} x2={306} y2={yL} className="ln" />
      {arrow(yU)}
      {arrow(yL)}
      <line x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]} className="ln" />
      {labels.p !== undefined &&
        (alt ? <Sector cx={uX} cy={yU} a0={180} a1={180 + phi} label={labels.p} i={0} r={28} lr={50} /> : <Sector cx={uX} cy={yU} a0={0} a1={phi} label={labels.p} i={0} r={28} lr={50} />)}
      {labels.q !== undefined && <Sector cx={lX} cy={yL} a0={0} a1={phi} label={labels.q} i={0} r={28} lr={50} />}
      {labels.r !== undefined && <Sector cx={lX} cy={yL} a0={phi} a1={180} label={labels.r} i={2} r={28} lr={54} />}
    </svg>
  )
}

function Triangle({ labels }: { labels: Record<string, string> }) {
  const sizes = angleSizes(180, [labels.a, labels.b, labels.c], 30)
  const [A, B, C] = sizes as [number, number, number]
  const sin = (d: number) => Math.sin((d * Math.PI) / 180)
  // Sine rule: side opposite each angle is proportional to its sine.
  const cLen = sin(C)
  const bLen = sin(B)
  const pa: [number, number] = [0, 0]
  const pb: [number, number] = [cLen, 0]
  const pc: [number, number] = [bLen * Math.cos((A * Math.PI) / 180), bLen * sin(A)]
  const minX = Math.min(pa[0], pb[0], pc[0])
  const maxX = Math.max(pa[0], pb[0], pc[0])
  const maxY = pc[1]
  const scale = Math.min(230 / (maxX - minX), 130 / maxY)
  const ox = 150 - ((minX + maxX) / 2) * scale
  const oy = 172
  const P = (p: [number, number]): [number, number] => [ox + p[0] * scale, oy - p[1] * scale]
  const [ax, ay] = P(pa)
  const [bx, by] = P(pb)
  const [cx, cy] = P(pc)
  const centroid: [number, number] = [(ax + bx + cx) / 3, (ay + by + cy) / 3]
  const verts = [
    { k: 'a', p: [ax, ay] as [number, number], n1: [bx, by] as [number, number], n2: [cx, cy] as [number, number] },
    { k: 'b', p: [bx, by] as [number, number], n1: [ax, ay] as [number, number], n2: [cx, cy] as [number, number] },
    { k: 'c', p: [cx, cy] as [number, number], n1: [ax, ay] as [number, number], n2: [bx, by] as [number, number] },
  ]
  const deg = (from: [number, number], to: [number, number]) => (Math.atan2(from[1] - to[1], to[0] - from[0]) * 180) / Math.PI
  return (
    <svg viewBox="0 0 300 190" className="fig-svg" role="img" aria-label="Triangle with angles">
      <polygon points={`${ax},${ay} ${bx},${by} ${cx},${cy}`} className="poly" />
      {verts.map((v, i) => {
        const label = labels[v.k]
        if (label === undefined) return null
        const t1 = deg(v.p, v.n1)
        const t2 = deg(v.p, v.n2)
        const diff = ((t2 - t1 + 540) % 360) - 180
        const [a0, a1] = diff > 0 ? [t1, t1 + diff] : [t2, t2 - diff]
        const lx = v.p[0] + (centroid[0] - v.p[0]) * 0.42
        const ly = v.p[1] + (centroid[1] - v.p[1]) * 0.42
        return (
          <g key={v.k}>
            <path d={wedgePath(v.p[0], v.p[1], 20, a0, a1)} className={cls(label, i)} />
            <SvgText x={lx} y={ly} text={label} className={isUnknown(label) ? 'lbl unk' : 'lbl'} />
          </g>
        )
      })}
    </svg>
  )
}

export function Angles({ f }: { f: Ang }) {
  let body
  switch (f.kind) {
    case 'straight':
      body = <Straight labels={f.labels} />
      break
    case 'point':
      body = <Point labels={f.labels} />
      break
    case 'vertical':
      body = <Vertical labels={f.labels} />
      break
    case 'triangle':
      body = <Triangle labels={f.labels} />
      break
    default:
      body = <Parallel kind={f.kind} labels={f.labels} />
  }
  return (
    <>
      {body}
      <div className="fig-note">Not drawn accurately</div>
    </>
  )
}
