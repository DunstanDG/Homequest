import type { Figure } from '@/engine/types'
import { RightAngle, SvgText, clampN, numOf } from './svg'

type Shape = Extract<Figure, { type: 'shape' }>
type L = Record<string, string>

const W = 320
const H = 210

/** Number for proportions: uses the labelled value when it is a plain number, otherwise a default. */
const dim = (label: string | undefined, fallback: number) => numOf(label) ?? fallback

function Frame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fig-svg" role="img" aria-label={label}>
      {children}
    </svg>
  )
}

/** Scale (w, h) to fit inside maxW x maxH while keeping the ratio within sensible limits. */
function fit(w: number, h: number, maxW: number, maxH: number, minRatio = 0.4, maxRatio = 2.6): [number, number] {
  const ratio = clampN(w / h, minRatio, maxRatio)
  let pw = maxW
  let ph = pw / ratio
  if (ph > maxH) {
    ph = maxH
    pw = ph * ratio
  }
  return [pw, ph]
}

function Rectangle({ l }: { l: L }) {
  const [pw, ph] = fit(dim(l.w, 3), dim(l.h, 2), 210, 120)
  const x = (W - pw) / 2
  const y = 34
  return (
    <Frame label="Rectangle">
      <rect x={x} y={y} width={pw} height={ph} className="poly" />
      <RightAngle x={x} y={y + ph} u={[1, 0]} v={[0, -1]} />
      <RightAngle x={x + pw} y={y + ph} u={[-1, 0]} v={[0, -1]} />
      {l.w && <SvgText x={x + pw / 2} y={y + ph + 18} text={l.w} className="lbl dim" />}
      {l.h && <SvgText x={x - 8} y={y + ph / 2} text={l.h} anchor="end" className="lbl dim" />}
    </Frame>
  )
}

function Triangle({ l }: { l: L }) {
  const b = dim(l.b, 6)
  const h = dim(l.h, 4)
  const a = numOf(l.a)
  const [pw, ph] = fit(b, h, 210, 120, 0.6, 3)
  const unit = pw / b
  let dx = 0.32 * pw
  if (a !== undefined && a >= h) dx = Math.sqrt(a * a - h * h) * unit
  dx = clampN(dx, -70, pw + 70)
  // Centre the whole outline (an obtuse apex can sit beyond the base) and leave room for the height label.
  const left = Math.min(0, dx)
  const right = Math.max(pw, dx) + 34
  const x = (W - (right - left)) / 2 - left
  const y = 30
  const base = y + ph
  const apex: [number, number] = [x + dx, y]
  const outsideRight = dx > pw
  return (
    <Frame label="Triangle">
      <polygon points={`${x},${base} ${x + pw},${base} ${apex[0]},${apex[1]}`} className="poly" />
      <line x1={apex[0]} y1={apex[1]} x2={apex[0]} y2={base} className="dash" />
      <RightAngle x={apex[0]} y={base} u={[dx >= 0 ? 1 : -1, 0]} v={[0, -1]} s={8} />
      {l.b && <SvgText x={x + pw / 2} y={base + 18} text={l.b} className="lbl dim" />}
      {l.h && <SvgText x={apex[0] + 6} y={y + ph * 0.5} text={l.h} anchor="start" className="lbl dim" />}
      {l.a && <SvgText x={(x + apex[0]) / 2 - 8} y={(base + y) / 2 - 8} text={l.a} anchor="end" className="lbl dim" />}
      {l.c &&
        (outsideRight ? (
          <SvgText x={(x + pw + apex[0]) / 2 + 8} y={(base + y) / 2 + 16} text={l.c} anchor="start" className="lbl dim" />
        ) : (
          <SvgText x={(x + pw + apex[0]) / 2 + 8} y={(base + y) / 2 - 6} text={l.c} anchor="start" className="lbl dim" />
        ))}
    </Frame>
  )
}

function Trapezium({ l }: { l: L }) {
  const top = dim(l.a, 4)
  const bot = dim(l.b, 8)
  const h = dim(l.h, 4)
  const c = numOf(l.c)
  const [pw, ph] = fit(Math.max(top, bot), h, 230, 115, 0.8, 4)
  const unit = pw / Math.max(top, bot)
  let dxR = (bot - top) / 2
  if (c !== undefined && c >= h) dxR = Math.sqrt(c * c - h * h)
  let dxL = bot - top - dxR
  if (dxL < -0.001) {
    dxL = (bot - top) / 2
    dxR = dxL
  }
  const wb = bot * unit
  const wt = top * unit
  const x = (W - wb) / 2 - Math.min(0, dxL * unit)
  const y = 32
  const base = y + ph
  const tl = x + dxL * unit
  const tr = tl + wt
  return (
    <Frame label="Trapezium">
      <polygon points={`${x},${base} ${x + wb},${base} ${tr},${y} ${tl},${y}`} className="poly" />
      <line x1={tl} y1={y} x2={tl} y2={base} className="dash" />
      <RightAngle x={tl} y={base} u={[1, 0]} v={[0, -1]} s={8} />
      {l.a && <SvgText x={(tl + tr) / 2} y={y - 12} text={l.a} className="lbl dim" />}
      {l.b && <SvgText x={x + wb / 2} y={base + 18} text={l.b} className="lbl dim" />}
      {l.h && <SvgText x={tl + 6} y={y + ph / 2} text={l.h} anchor="start" className="lbl dim" />}
      {l.c && <SvgText x={(tr + x + wb) / 2 + 8} y={y + ph / 2} text={l.c} anchor="start" className="lbl dim" />}
    </Frame>
  )
}

function Parallelogram({ l }: { l: L }) {
  const b = dim(l.b, 6)
  const h = dim(l.h, 3.5)
  const [pw, ph] = fit(b, h, 190, 115, 0.8, 3.5)
  const slant = Math.min(50, pw * 0.28)
  const x = (W - pw - slant) / 2
  const y = 34
  const base = y + ph
  return (
    <Frame label="Parallelogram">
      <polygon points={`${x},${base} ${x + pw},${base} ${x + pw + slant},${y} ${x + slant},${y}`} className="poly" />
      <line x1={x + slant} y1={y} x2={x + slant} y2={base} className="dash" />
      <RightAngle x={x + slant} y={base} u={[1, 0]} v={[0, -1]} s={8} />
      {l.b && <SvgText x={x + pw / 2} y={base + 18} text={l.b} className="lbl dim" />}
      {l.h && <SvgText x={x + slant + 6} y={y + ph / 2} text={l.h} anchor="start" className="lbl dim" />}
    </Frame>
  )
}

function Circle({ l }: { l: L }) {
  const cx = W / 2
  const cy = H / 2
  const r = 74
  return (
    <Frame label="Circle">
      <circle cx={cx} cy={cy} r={r} className="poly" />
      {l.d ? (
        <>
          <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} className="ln" />
          <SvgText x={cx} y={cy - 14} text={l.d} className="lbl dim" />
        </>
      ) : (
        <>
          <line x1={cx} y1={cy} x2={cx + r} y2={cy} className="ln" />
          <SvgText x={cx + r / 2} y={cy - 14} text={l.r ?? ''} className="lbl dim" />
        </>
      )}
      <circle cx={cx} cy={cy} r={3} className="pt" />
    </Frame>
  )
}

/** Oblique projection vector for depth. */
const DEPTH: [number, number] = [0.6, -0.5]

function Cuboid({ l }: { l: L }) {
  const lv = dim(l.l, 5)
  const hv = dim(l.h, 3)
  const wv = dim(l.w, 3)
  const mx = Math.max(lv, hv, wv)
  const rel = (v: number) => clampN(v / mx, 0.35, 1)
  const fw0 = rel(lv)
  const fh0 = rel(hv)
  const d0 = rel(wv)
  const s = Math.min(215 / (fw0 + DEPTH[0] * d0), 140 / (fh0 - DEPTH[1] * d0))
  const fw = fw0 * s
  const fh = fh0 * s
  const dx = DEPTH[0] * d0 * s
  const dy = -DEPTH[1] * d0 * s
  const x = (W - fw - dx) / 2
  const y = 30 + dy
  const yb = y + fh
  return (
    <Frame label="Cuboid">
      <polygon points={`${x},${y} ${x + fw},${y} ${x + fw + dx},${y - dy} ${x + dx},${y - dy}`} className="poly light" />
      <polygon points={`${x + fw},${y} ${x + fw + dx},${y - dy} ${x + fw + dx},${yb - dy} ${x + fw},${yb}`} className="poly mid" />
      <rect x={x} y={y} width={fw} height={fh} className="poly" />
      {l.l && <SvgText x={x + fw / 2} y={yb + 16} text={l.l} className="lbl dim" />}
      {l.h && <SvgText x={x - 8} y={y + fh / 2} text={l.h} anchor="end" className="lbl dim" />}
      {l.w && <SvgText x={x + fw + dx / 2 + 12} y={yb - dy / 2 + 10} text={l.w} anchor="start" className="lbl dim" />}
    </Frame>
  )
}

function Cylinder({ l }: { l: L }) {
  const cx = 138
  const rx = 56
  const ry = 17
  const rNum = numOf(l.r)
  const dNum = numOf(l.d)
  const dia = dNum ?? (rNum !== undefined ? rNum * 2 : 6)
  const hv = dim(l.h, 8)
  const fh = clampN((2 * rx * hv) / dia, 46, 118)
  const top = 44
  const bot = top + fh
  return (
    <Frame label="Cylinder">
      <path d={`M ${cx - rx} ${top} L ${cx - rx} ${bot} A ${rx} ${ry} 0 0 0 ${cx + rx} ${bot} L ${cx + rx} ${top}`} className="poly" />
      <ellipse cx={cx} cy={top} rx={rx} ry={ry} className="poly light" />
      {l.d ? (
        <>
          <line x1={cx - rx} y1={top} x2={cx + rx} y2={top} className="ln" />
          <SvgText x={cx} y={top - ry - 12} text={l.d} className="lbl dim" />
        </>
      ) : (
        <>
          <line x1={cx} y1={top} x2={cx + rx} y2={top} className="ln" />
          <SvgText x={cx + rx / 2} y={top - ry - 12} text={l.r ?? ''} className="lbl dim" />
        </>
      )}
      <circle cx={cx} cy={top} r={2.5} className="pt" />
      {l.h && (
        <>
          <line x1={cx + rx + 14} y1={top} x2={cx + rx + 14} y2={bot} className="dash" />
          <SvgText x={cx + rx + 22} y={(top + bot) / 2} text={l.h} anchor="start" className="lbl dim" />
        </>
      )}
    </Frame>
  )
}

function Prism({ l }: { l: L }) {
  const bv = dim(l.b, 5)
  const hv = dim(l.h, 4)
  const lv = dim(l.l, 8)
  const mx = Math.max(bv, hv, lv)
  const rel = (v: number) => clampN(v / mx, 0.35, 1)
  const b0 = rel(bv)
  const h0 = rel(hv)
  const d0 = rel(lv)
  const s = Math.min(190 / (b0 + DEPTH[0] * d0), 125 / (h0 - DEPTH[1] * d0))
  const bw = b0 * s
  const th = h0 * s
  const dx = DEPTH[0] * d0 * s
  const dy = -DEPTH[1] * d0 * s
  const x = (W - bw - dx) / 2
  const yTop = 28 + dy
  const yb = yTop + th
  const A: [number, number] = [x, yb]
  const B: [number, number] = [x + bw, yb]
  const C: [number, number] = [x + bw / 2, yTop]
  const sh = (p: [number, number]): [number, number] => [p[0] + dx, p[1] - dy]
  const A2 = sh(A)
  const B2 = sh(B)
  const C2 = sh(C)
  const pts = (...ps: [number, number][]) => ps.map((p) => `${p[0]},${p[1]}`).join(' ')
  return (
    <Frame label="Triangular prism">
      <polygon points={pts(A, C, C2, A2)} className="poly light" />
      <polygon points={pts(B, C, C2, B2)} className="poly mid" />
      <polygon points={pts(A, B, C)} className="poly" />
      <line x1={A[0]} y1={A[1]} x2={A2[0]} y2={A2[1]} className="dash" />
      <line x1={A2[0]} y1={A2[1]} x2={B2[0]} y2={B2[1]} className="dash" />
      <line x1={C[0]} y1={C[1]} x2={C[0]} y2={yb} className="dash" />
      {l.b && <SvgText x={(A[0] + B[0]) / 2} y={yb + 16} text={l.b} className="lbl dim" />}
      {l.h && <SvgText x={C[0] + 6} y={(C[1] + yb) / 2 + 6} text={l.h} anchor="start" className="lbl dim" />}
      {l.l && <SvgText x={(B[0] + B2[0]) / 2 + 12} y={(B[1] + B2[1]) / 2 + 12} text={l.l} anchor="start" className="lbl dim" />}
    </Frame>
  )
}

function LShape({ l }: { l: L }) {
  const w = dim(l.w, 8)
  const h = dim(l.h, 6)
  const cwV = numOf(l.cw) ?? (numOf(l.top) !== undefined ? w - (numOf(l.top) as number) : w * 0.4)
  const chV = numOf(l.ch) ?? (numOf(l.right) !== undefined ? h - (numOf(l.right) as number) : h * 0.4)
  const [pw, ph] = fit(w, h, 210, 130, 0.6, 2)
  const kx = pw / w
  const ky = ph / h
  const cw = clampN(cwV * kx, 18, pw - 24)
  const ch = clampN(chV * ky, 18, ph - 24)
  const x = (W - pw) / 2
  const y = 30
  const yb = y + ph
  const pts: [number, number][] = [
    [x, yb],
    [x + pw, yb],
    [x + pw, y + ch],
    [x + pw - cw, y + ch],
    [x + pw - cw, y],
    [x, y],
  ]
  return (
    <Frame label="L-shaped compound shape">
      <polygon points={pts.map((p) => p.join(',')).join(' ')} className="poly" />
      {l.w && <SvgText x={x + pw / 2} y={yb + 16} text={l.w} className="lbl dim" />}
      {l.h && <SvgText x={x - 8} y={y + ph / 2} text={l.h} anchor="end" className="lbl dim" />}
      {l.top && <SvgText x={x + (pw - cw) / 2} y={y - 12} text={l.top} className="lbl dim" />}
      {l.right && <SvgText x={x + pw + 8} y={y + ch + (ph - ch) / 2} text={l.right} anchor="start" className="lbl dim" />}
      {l.cw && <SvgText x={x + pw - cw / 2} y={y + ch - 12} text={l.cw} className="lbl dim" />}
      {l.ch && <SvgText x={x + pw - cw + 8} y={y + ch / 2} text={l.ch} anchor="start" className="lbl dim" />}
    </Frame>
  )
}

export function Shapes({ f }: { f: Shape }) {
  const l = f.labels
  switch (f.shape) {
    case 'rectangle':
      return <Rectangle l={l} />
    case 'triangle':
      return <Triangle l={l} />
    case 'trapezium':
      return <Trapezium l={l} />
    case 'parallelogram':
      return <Parallelogram l={l} />
    case 'circle':
      return <Circle l={l} />
    case 'cuboid':
      return <Cuboid l={l} />
    case 'cylinder':
      return <Cylinder l={l} />
    case 'prism':
      return <Prism l={l} />
    case 'l-shape':
      return <LShape l={l} />
  }
}
