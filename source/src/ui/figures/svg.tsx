import type { ReactNode } from 'react'
import { tidy } from '../rich'

/** Small SVG helpers shared by all figure renderers. */

type Seg = { t: string; mode: 'n' | 'sup' | 'sub' }

function closeOf(s: string, open: number): number {
  let depth = 0
  for (let i = open; i < s.length; i++) {
    if (s[i] === '{') depth++
    else if (s[i] === '}' && --depth === 0) return i
  }
  return -1
}

/** Flatten the rich mini-markup into text runs (fractions become a/b, since SVG can't stack them easily). */
function segments(s: string): Seg[] {
  const out: Seg[] = []
  let buf = ''
  const flush = () => {
    if (buf) out.push({ t: tidy(buf), mode: 'n' })
    buf = ''
  }
  let i = 0
  while (i < s.length) {
    const c = s[i] as string
    const n = s[i + 1]
    if ((c === '^' || c === '_') && n === '{') {
      const close = closeOf(s, i + 1)
      if (close > 0) {
        flush()
        out.push({ t: tidy(s.slice(i + 2, close)), mode: c === '^' ? 'sup' : 'sub' })
        i = close + 1
        continue
      }
    }
    if (c === '^' && n !== undefined && /[0-9a-zA-Z]/.test(n)) {
      const m = /^-?\d+|^[a-zA-Z]/.exec(s.slice(i + 1))
      if (m) {
        flush()
        out.push({ t: m[0].replace('-', '−'), mode: 'sup' })
        i += 1 + m[0].length
        continue
      }
    }
    if (c === '{') {
      const close = closeOf(s, i)
      if (close > 0) {
        const inner = s.slice(i + 1, close)
        const bar = inner.indexOf('|')
        if (bar > 0) {
          buf += `${inner.slice(0, bar)}/${inner.slice(bar + 1)}`
          i = close + 1
          continue
        }
      }
    }
    buf += c
    i++
  }
  flush()
  return out
}

export function SvgText({
  x,
  y,
  text,
  anchor = 'middle',
  className = 'lbl',
  rotate,
}: {
  x: number
  y: number
  text: string
  anchor?: 'start' | 'middle' | 'end'
  className?: string
  rotate?: number
}) {
  const segs = segments(text)
  let shifted: 'sup' | 'sub' | undefined
  const kids: ReactNode[] = segs.map((s, k) => {
    let dy: string | undefined
    if (s.mode === 'sup') dy = '-0.45em'
    else if (s.mode === 'sub') dy = '0.3em'
    else if (shifted) dy = shifted === 'sup' ? '0.45em' : '-0.3em'
    shifted = s.mode === 'n' ? undefined : s.mode
    return (
      <tspan key={k} dy={dy} fontSize={s.mode === 'n' ? undefined : '0.72em'}>
        {s.t}
      </tspan>
    )
  })
  return (
    <text x={x} y={y} textAnchor={anchor} dominantBaseline="middle" className={className} transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}>
      {kids}
    </text>
  )
}

/** A label that is entirely numeric (optionally with a unit), e.g. '65°', '4.5 cm'. Undefined for 'x' or '(2x + 10)°'. */
export function numOf(label: string | undefined): number | undefined {
  if (label == null) return undefined
  const m = /^\s*(-?\d+(?:\.\d+)?)\s*(°|cm|mm|m|km|units?)?\s*$/.exec(label)
  return m ? Number(m[1]) : undefined
}

export const isUnknown = (label: string) => /[a-zA-Z]/.test(label.replace(/\b(cm|mm|km|m)\b/g, ''))

export const rad = (deg: number) => (deg * Math.PI) / 180
export const clampN = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

/** Point at math-angle `deg` (anticlockwise from the +x axis, y up) and radius r from (cx, cy), in screen coordinates. */
export function pol(cx: number, cy: number, r: number, deg: number): [number, number] {
  return [cx + r * Math.cos(rad(deg)), cy - r * Math.sin(rad(deg))]
}

const f = (n: number) => Math.round(n * 100) / 100

/** Filled sector from math-angle a0 anticlockwise to a1. */
export function wedgePath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const [sx, sy] = pol(cx, cy, r, a0)
  const [ex, ey] = pol(cx, cy, r, a1)
  const large = a1 - a0 > 180 ? 1 : 0
  return `M ${f(cx)} ${f(cy)} L ${f(sx)} ${f(sy)} A ${r} ${r} 0 ${large} 0 ${f(ex)} ${f(ey)} Z`
}

export function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const [sx, sy] = pol(cx, cy, r, a0)
  const [ex, ey] = pol(cx, cy, r, a1)
  const large = a1 - a0 > 180 ? 1 : 0
  return `M ${f(sx)} ${f(sy)} A ${r} ${r} 0 ${large} 0 ${f(ex)} ${f(ey)}`
}

/** Right-angle square marker at corner (x, y), with the two arms pointing along unit vectors u and v (screen coords). */
export function RightAngle({ x, y, u, v, s = 9 }: { x: number; y: number; u: [number, number]; v: [number, number]; s?: number }) {
  const p1: [number, number] = [x + u[0] * s, y + u[1] * s]
  const p2: [number, number] = [x + (u[0] + v[0]) * s, y + (u[1] + v[1]) * s]
  const p3: [number, number] = [x + v[0] * s, y + v[1] * s]
  return <path d={`M ${f(p1[0])} ${f(p1[1])} L ${f(p2[0])} ${f(p2[1])} L ${f(p3[0])} ${f(p3[1])}`} className="ln thin" fill="none" />
}

/** Distributes a total over labelled angles: numeric labels keep their size, others share what is left. */
export function angleSizes(total: number, labels: (string | undefined)[], min = 26): number[] {
  const nums = labels.map(numOf)
  const known = nums.reduce<number>((a, n) => a + (n ?? 0), 0)
  const unk = nums.filter((n) => n === undefined).length
  const jitter = [1.08, 0.92, 1, 1.05, 0.95]
  let out: number[]
  if (unk === 0) {
    out = known > 0 ? nums.map((n) => ((n as number) * total) / known) : nums.map(() => total / nums.length)
  } else {
    const rest = total - known
    const share = rest > unk * 10 ? rest / unk : total / labels.length
    out = nums.map((n, i) => n ?? share * (unk > 1 ? (jitter[i % jitter.length] as number) : 1))
  }
  out = out.map((v) => Math.max(v, min))
  const s = out.reduce((a, b) => a + b, 0)
  return out.map((v) => (v * total) / s)
}

export function niceStep(span: number, target = 6): number {
  const raw = span / target
  const pow = 10 ** Math.floor(Math.log10(raw))
  const m = raw / pow
  const nice = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10
  return nice * pow
}

export function fmtTick(n: number): string {
  const r = Math.round(n * 1000) / 1000
  return String(r).replace('-', '−')
}
