import { Fragment, type ReactNode } from 'react'

/**
 * Renders the engine's mini-markup:  {a|b} fraction, ^{x} superscript, _{x} subscript,
 * and tidies minus signs (a hyphen before a digit becomes a proper "−").
 */

function findClose(s: string, open: number): number {
  let depth = 0
  for (let i = open; i < s.length; i++) {
    if (s[i] === '{') depth++
    else if (s[i] === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

function splitTop(s: string): [string, string] | null {
  let depth = 0
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '{') depth++
    else if (s[i] === '}') depth--
    else if (s[i] === '|' && depth === 0) return [s.slice(0, i), s.slice(i + 1)]
  }
  return null
}

/** Typographic clean-up for plain text runs. */
export function tidy(t: string): string {
  return t
    .replace(/(^|[\s(=,×÷+^[])-(?=[\d.a-zA-Z(])/g, '$1−')
    .replace(/(\s)-(\s)/g, '$1−$2')
    .replace(/(\d)\s*\*\s*(\d)/g, '$1 × $2')
}

function parse(s: string, keyBase = 'r'): ReactNode[] {
  const out: ReactNode[] = []
  let buf = ''
  let k = 0
  const flush = () => {
    if (buf) {
      out.push(<Fragment key={`${keyBase}t${k++}`}>{tidy(buf)}</Fragment>)
      buf = ''
    }
  }
  let i = 0
  while (i < s.length) {
    const c = s[i] as string
    const next = s[i + 1]
    if ((c === '^' || c === '_') && next === '{') {
      const close = findClose(s, i + 1)
      if (close > 0) {
        flush()
        const inner = parse(s.slice(i + 2, close), `${keyBase}${k}`)
        out.push(c === '^' ? <sup key={`${keyBase}s${k++}`}>{inner}</sup> : <sub key={`${keyBase}s${k++}`}>{inner}</sub>)
        i = close + 1
        continue
      }
    }
    if (c === '^' && next !== undefined && /[0-9a-zA-Z]/.test(next)) {
      // bare exponent like x^2 or 10^5
      const m = /^-?\d+|^[a-zA-Z]/.exec(s.slice(i + 1))
      if (m) {
        flush()
        out.push(<sup key={`${keyBase}b${k++}`}>{tidy(m[0].replace('-', '−'))}</sup>)
        i += 1 + m[0].length
        continue
      }
    }
    if (c === '{') {
      const close = findClose(s, i)
      if (close > 0) {
        const inner = s.slice(i + 1, close)
        const parts = splitTop(inner)
        if (parts) {
          flush()
          out.push(
            <span className="frac" key={`${keyBase}f${k++}`}>
              <span className="num">{parse(parts[0], `${keyBase}n${k}`)}</span>
              <span className="den">{parse(parts[1], `${keyBase}d${k}`)}</span>
            </span>,
          )
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

export function Rich({ text, className }: { text: string; className?: string }) {
  return <span className={className ? `rich ${className}` : 'rich'}>{parse(text)}</span>
}
