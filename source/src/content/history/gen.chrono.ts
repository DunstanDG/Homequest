import type { ItemGenerator } from '@/engine/registry'
import type { Rng } from '@/engine/types'
import { choice, orderItem } from '../kit'
import { G, centuryOf, fmtYear, ordinal, wrongs } from './gen.topic'
import type { Ev, Topic, W } from './types'

/**
 * Generators computed from numbers or drawn from every topic's events: BC/AD dates, centuries and decades, and
 * cross-period timelines. Everything here is either arithmetic or reuses the dated events in the topic tables.
 */

/** Distinct "round" dates for BC/AD work: multiples of 25 (or 50) between the limits, as signed years. */
function roundDates(rng: Rng, n: number, lo: number, hi: number, step: number): number[] {
  const set = new Set<number>()
  let guard = 0
  while (set.size < n && guard++ < 200) {
    const y = Math.round(rng.int(lo, hi) / step) * step
    if (y !== 0 && y >= lo && y <= hi) set.add(y)
  }
  return [...set]
}

const bcAd = (y: number) => (y < 0 ? `${-y} BC` : `AD ${y}`)

function periodOf(y: number): string | undefined {
  // Boundary years and the years around changes of label are left out so every answer is clear-cut.
  if (y > 1066 && y < 1485) return 'Medieval'
  if (y > 1485 && y < 1603) return 'Tudor'
  if (y > 1603 && y < 1714 && (y < 1649 || y > 1660)) return 'Stuart'
  if (y > 1714 && y < 1828) return 'Georgian'
  if (y > 1840 && y < 1901) return 'Victorian'
  if (y > 1901 && y <= 2000) return '20th century'
  return undefined
}
const PERIODS = ['Medieval', 'Tudor', 'Stuart', 'Georgian', 'Victorian', '20th century']
const PERIOD_DATES: Record<string, string> = {
  Medieval: '1066-1485',
  Tudor: '1485-1603',
  Stuart: '1603-1714',
  Georgian: '1714-1837',
  Victorian: '1837-1901',
  '20th century': '1901-2000',
}

export function chronoGenerators(topics: Topic[]): ItemGenerator[] {
  // Every exact, dated event across the pack, de-duplicated by wording.
  const seen = new Set<string>()
  const all: Ev[] = []
  for (const t of topics)
    for (const e of t.events ?? [])
      if (!e.approx && !seen.has(e.e)) {
        seen.add(e.e)
        all.push(e)
      }
  const ad = all.filter((e) => e.y >= 1000)

  return [
    // =========================================================== BC and AD
    G('bcad.earliest', 'foundation.bc-ad', [1, 4], (rng, d) => {
      const ys = d <= 1 ? roundDates(rng, 3, 100, 1900, 100) : d === 2 ? roundDates(rng, 4, -800, 1500, 50) : roundDates(rng, 4, -900, 300, 50).map((y) => (d >= 4 ? -Math.abs(y) : y))
      const uniq = [...new Set(ys)]
      if (uniq.length < 3) uniq.push(uniq.includes(-750) ? -650 : -750, uniq.includes(1250) ? 1350 : 1250)
      const sorted = [...uniq].sort((a, b) => a - b)
      const earliest = sorted[0] as number
      const wrong: W[] = sorted.slice(1).map((y) =>
        y < 0 && -y < -earliest ? [bcAd(y), `With BC dates, bigger numbers are further back in time, so ${bcAd(earliest)} is earlier than ${bcAd(y)}.`] : y > 0 && earliest < 0 ? [bcAd(y), 'Every BC date is earlier than every AD date.'] : bcAd(y),
      )
      return choice({
        rng,
        prompt: 'Which of these dates is the earliest?',
        correct: bcAd(earliest),
        wrong: wrongs('foundation.bc-ad', wrong),
        hint: 'BC dates count backwards: the bigger the BC number, the longer ago it was.',
        explanation: `In order: ${sorted.map(bcAd).join(', ')}. BC dates come before AD dates, and among BC dates the biggest number is the earliest.`,
      })
    }),
    G('bcad.order', 'foundation.bc-ad', [2, 5], (rng, d) => {
      const n = Math.min(6, d + 2)
      let ys = roundDates(rng, n, d >= 4 ? -1000 : -600, d >= 4 ? 600 : 1500, d >= 5 ? 25 : 50)
      if (ys.length < 3) ys = [-500, -100, 200]
      if (!ys.some((y) => y < 0)) ys[0] = -Math.abs(ys[0] as number)
      const sorted = [...new Set(ys)].sort((a, b) => a - b)
      return orderItem({
        rng,
        prompt: 'Put these dates in order, earliest first.',
        correct: sorted.map(bcAd),
        direction: ['Earliest', 'Latest'],
        hint: 'Put the BC dates first, with the biggest BC number first. Then the AD dates, smallest first.',
        explanation: `${sorted.map(bcAd).join(', then ')}. BC years count down towards AD 1; AD years count up.`,
      })
    }),
    G('bcad.gap', 'foundation.bc-ad', [3, 5], (rng, d) => {
      const bc = d === 3 ? rng.chance(0.5) : true
      let a = rng.int(2, 9) * 100
      let b = rng.int(1, 8) * 100 + (d >= 5 ? rng.pick([0, 50, 25]) : 0)
      if (a === b) a += 100
      if (a < b) [a, b] = [b, a]
      const first = bc ? -a : b
      const second = bc ? -b : a
      const ans = a - b
      return {
        kind: 'numeric',
        prompt: `How many years passed between ${bcAd(first)} and ${bcAd(second)}?`,
        hint: bc ? 'Both dates are BC, so the years count down: subtract the smaller number from the bigger one.' : 'Subtract the earlier year from the later one.',
        explanation: `${bcAd(first)} to ${bcAd(second)}: ${a} - ${b} = ${ans} years.${bc ? ' With two BC dates, you subtract; the bigger BC number is the earlier date.' : ''}`,
        keypad: 'number',
        fields: [{ answer: ans, suffix: 'years' }],
        commonErrors: bc ? [{ tag: 'added-bc', values: [a + b], message: 'Both dates are BC, so subtract rather than add.' }] : undefined,
      }
    }),

    // =========================================================== centuries and decades
    G('centuries.which', 'skills.centuries', [1, 5], (rng, d) => {
      let y: number
      let context = ''
      if (d <= 1) y = rng.int(11, 19) * 100 + rng.int(1, 99)
      else if (d <= 3) {
        const ev = rng.pick(ad.filter((e) => e.y % 100 !== 0))
        y = ev.y
        context = `${ev.e} (${ev.y}). `
      } else if (d === 4) y = rng.pick([1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 1000]) + rng.pick([0, 0, 1])
      else y = -(rng.int(1, 9) * 100 - rng.pick([0, 50, 1]))
      const c = centuryOf(y)
      const firstTwo = Math.floor(Math.abs(y) / 100)
      const errs = firstTwo !== c ? [{ tag: 'first-two-digits', values: [firstTwo], message: `Careful: the ${firstTwo}00s are the ${ordinal(firstTwo + 1)} century. Add one to the hundreds, unless the year ends in 00.` }] : []
      const isEv = context !== ''
      return {
        kind: 'numeric',
        prompt: `${isEv ? context : ''}Which century is the year ${y < 0 ? `${-y} BC` : y} in? Type the number (for example 14 for the 14th century).`,
        hint: y < 0 ? 'BC centuries work the same way: 1 to 100 BC is the 1st century BC.' : 'The 1st century was AD 1 to 100. So the 1300s (1301 to 1400) are the 14th century.',
        explanation:
          y < 0
            ? `${-y} BC is in the ${ordinal(c)} century BC (${(c - 1) * 100 + 1} to ${c * 100} BC).`
            : `${y} is in the ${ordinal(c)} century, which runs from ${(c - 1) * 100 + 1} to ${c * 100}.${y % 100 === 0 ? ' A year ending in 00 is the last year of its century.' : ''}`,
        keypad: 'number',
        fields: [{ answer: c, suffix: y < 0 ? 'century BC' : 'century' }],
        commonErrors: errs.length ? errs : undefined,
      }
    }),
    G('centuries.hundreds', 'skills.centuries', [1, 3], (rng, d) => {
      const h = rng.int(d <= 1 ? 13 : 10, 19)
      const c = h + 1
      return choice({
        rng,
        prompt: `Historians often call the ${h}00s the ... century. Which century?`,
        correct: `${ordinal(c)} century`,
        wrong: wrongs('skills.centuries', [
          [`${ordinal(h)} century`, `It is one more than the hundreds: the ${h}00s are the ${ordinal(c)} century.`],
          `${ordinal(c + 1)} century`,
          `${ordinal(h - 10 > 0 ? h - 10 : h + 2)} century`,
        ]),
        hint: 'We are in the 2000s, which is the 21st century. Use the same pattern.',
        explanation: `The ${h}00s are the ${ordinal(c)} century. Add one to the hundreds.`,
      })
    }),
    G('centuries.decade', 'skills.centuries', [2, 4], (rng, d) => {
      const ev = d >= 3 ? rng.pick(ad.filter((e) => e.y % 10 !== 0)) : undefined
      const y = ev ? ev.y : rng.int(1500, 1990)
      const dec = Math.floor(y / 10) * 10
      return choice({
        rng,
        prompt: `${ev ? `${ev.e} (${ev.y}). ` : ''}Which decade is ${y} in?`,
        correct: `the ${dec}s`,
        wrong: wrongs('skills.centuries', [
          [`the ${dec + 10}s`, `${y} is still in the ${dec}s: the ${dec + 10}s start in ${dec + 10}.`],
          [`the ${Math.floor(y / 100) * 100}s`, 'That is the whole century, not the decade.'],
          `the ${dec - 100}s`,
        ]),
        hint: 'A decade is ten years. Look at the first three digits.',
        explanation: `${y} is in the ${dec}s (${dec} to ${dec + 9}).`,
      })
    }),
    G('centuries.gap', 'skills.centuries', [2, 5], (rng, d) => {
      const pool = d <= 2 ? ad.filter((e) => e.y % 10 === 0 || e.y % 5 === 0) : ad
      const use = pool.length >= 2 ? pool : ad
      const a = rng.pick(use)
      let b = rng.pick(use)
      for (let i = 0; i < 20 && b.y === a.y; i++) b = rng.pick(use)
      if (b.y === a.y) b = use.find((x) => x.y !== a.y) ?? a
      const [early, late] = a.y < b.y ? [a, b] : [b, a]
      const ans = late.y - early.y
      return {
        kind: 'numeric',
        prompt: `First: ${early.e} (${early.y}). Later: ${late.e} (${late.y}). How many years apart were these two events?`,
        hint: 'Subtract the earlier year from the later year.',
        explanation: `${late.y} - ${early.y} = ${ans} years.`,
        keypad: 'number',
        fields: [{ answer: ans, suffix: 'years' }],
      }
    }),

    // =========================================================== timelines across periods
    G('timelines.across', 'skills.timelines', [2, 5], (rng, d) => {
      const n = Math.min(6, d + 1)
      const gap = d <= 2 ? 150 : d === 3 ? 60 : d === 4 ? 25 : 8
      const picked: Ev[] = []
      for (const e of rng.shuffle(all)) {
        if (picked.every((p) => Math.abs(p.y - e.y) >= gap)) picked.push(e)
        if (picked.length >= n) break
      }
      picked.sort((a, b) => a.y - b.y)
      const clue = rng.pick(picked)
      return orderItem({
        rng,
        prompt: 'Put these events from across British and world history in chronological order, earliest first.',
        correct: picked.map((e) => e.e),
        direction: ['Earliest', 'Latest'],
        hint: `First decide which period each belongs to. Clue: ${clue.e} in ${fmtYear(clue.y)}.`,
        explanation: `In order: ${picked.map((e) => `${fmtYear(e.y)}: ${e.e}`).join('; ')}.`,
      })
    }),
    G('timelines.period', 'skills.timelines', [1, 4], (rng, d) => {
      const pool = all.filter((e) => periodOf(e.y))
      const ev = rng.pick(pool)
      const p = periodOf(ev.y) as string
      const idx = PERIODS.indexOf(p)
      const near = PERIODS.filter((_x, i) => i !== idx).sort((a, b) => Math.abs(PERIODS.indexOf(a) - idx) - Math.abs(PERIODS.indexOf(b) - idx))
      const showYear = d <= 2
      return choice({
        rng,
        prompt: `${ev.e}${showYear ? ` (${ev.y})` : ''}. In which period of British history did this happen?`,
        correct: p,
        wrong: near.slice(0, 3).map((x) => ({ label: x, misconception: 'skills.timelines:period-mixup', feedback: `The ${x} period covers ${PERIOD_DATES[x]}.` })),
        keepOrder: false,
        hint: showYear ? 'Medieval to 1485, Tudor to 1603, Stuart to 1714, Georgian to 1837, Victorian to 1901.' : 'First work out roughly which century it happened in.',
        explanation: `${ev.e}: ${ev.y}, in the ${p} period (${PERIOD_DATES[p]}).`,
      })
    }),
  ]
}
