import type { Rng } from './types'

/** Small, fast, seedable PRNG (mulberry32). Same seed -> same sequence, everywhere. */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const rng: Rng = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (arr) => {
      if (arr.length === 0) throw new Error('pick() from empty array')
      return arr[Math.floor(next() * arr.length)] as never
    },
    shuffle: (arr) => {
      const out = [...arr]
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[out[i], out[j]] = [out[j] as never, out[i] as never]
      }
      return out
    },
    chance: (p) => next() < p,
  }
  return rng
}

/** Stable string hash -> 32-bit int (FNV-1a). */
export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Random 32-bit seed for a new item. */
export function freshSeed(rng: Rng): number {
  return Math.floor(rng.next() * 4294967295)
}

let idCounter = 0
/** Reasonably unique id (event ids). Time + counter + random. */
export function uid(prefix = ''): string {
  idCounter = (idCounter + 1) % 1_000_000
  const r = Math.floor(Math.random() * 36 ** 4).toString(36).padStart(4, '0')
  return `${prefix}${Date.now().toString(36)}${idCounter.toString(36)}${r}`
}
