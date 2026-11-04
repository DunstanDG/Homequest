import type { ItemGenerator } from '@/engine/registry'
import type { CommonError, Figure, ItemBody, Rng } from '@/engine/types'
import { F, G, choice, composition, gcd, multi, num, reduce, round, sum } from './helpers'

const ex = (tag: string, message: string, ...values: number[]): CommonError => ({ tag, message, values })
const mean = (xs: number[]) => sum(xs) / xs.length
const sorted = (xs: number[]) => [...xs].sort((a, b) => a - b)
const median = (xs: number[]) => {
  const s = sorted(xs)
  const n = s.length
  return n % 2 === 1 ? (s[(n - 1) / 2] as number) : ((s[n / 2 - 1] as number) + (s[n / 2] as number)) / 2
}
const list = (xs: number[]) => xs.join(', ')
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const frac = (n: number, d: number) => {
  const r = reduce(n, d)
  return r.d === 1 ? String(r.n) : F(r.n, r.d)
}
function prob(a: { prompt: string; n: number; d: number; hint: string; explanation: string; figure?: Figure; errors?: CommonError[] }): ItemBody {
  const r = reduce(a.n, a.d)
  return num({ prompt: a.prompt, figure: a.figure, answer: r.answer, display: r.display, lowest: true, hint: a.hint, explanation: a.explanation, errors: a.errors })
}

/** n integers around `target` whose mean is exactly `target`. */
function withMean(rng: Rng, n: number, target: number, spread: number, lo = 1): number[] {
  for (let g = 0; g < 500; g++) {
    const devs: number[] = []
    for (let i = 0; i < n - 1; i++) devs.push(rng.int(-spread, spread))
    devs.push(-sum(devs))
    const xs = devs.map((d) => target + d)
    if (xs.every((x) => x >= lo && x <= target + spread * 2) && new Set(xs).size >= Math.min(n, 3)) return rng.shuffle(xs)
  }
  return Array.from({ length: n }, () => target)
}

/** Expand a frequency table into the full list of values. */
const expand = (xs: number[], fs: number[]) => xs.flatMap((x, i) => Array.from({ length: fs[i] as number }, () => x))

// -------------------------------------------------------------- scatter data
function pearson(pts: [number, number][]): number {
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const mx = mean(xs)
  const my = mean(ys)
  const sxy = sum(pts.map((p) => (p[0] - mx) * (p[1] - my)))
  const sxx = sum(xs.map((x) => (x - mx) ** 2))
  const syy = sum(ys.map((y) => (y - my) ** 2))
  return sxy / Math.sqrt(sxx * syy)
}
function makeScatter(rng: Rng, kind: 'positive' | 'negative' | 'none', n = 12): [number, number][] {
  for (let g = 0; g < 500; g++) {
    const xs = rng.shuffle(Array.from({ length: 14 }, (_v, i) => i + 1)).slice(0, n)
    const pts = xs.map((x): [number, number] => {
      const noise = rng.int(-15, 15) / 10
      let y: number
      if (kind === 'positive') y = 0.75 * x + 1 + noise
      else if (kind === 'negative') y = 11 - 0.75 * x + noise
      else y = rng.int(1, 10)
      return [x, Math.max(1, Math.round(y))]
    })
    const r = pearson(pts)
    if (kind === 'positive' && r > 0.85) return pts
    if (kind === 'negative' && r < -0.85) return pts
    if (kind === 'none' && Math.abs(r) < 0.2) return pts
  }
  return Array.from({ length: n }, (_v, i) => [i + 1, kind === 'negative' ? n - i : i + 1] as [number, number])
}

export const statisticsGenerators: ItemGenerator[] = [
  // ============================================== DATA COLLECTION (Y7)
  G('dc.source', 'statistics.data-collection', [1, 2], (rng, d) => {
    const primary = [
      'A student asks 30 classmates which sport they prefer',
      'A shop owner tallies how many customers come in each hour',
      'You measure the heights of plants growing on your windowsill',
      'You time 20 friends running 100 m',
    ]
    const secondary = [
      'A student uses census figures from a government website',
      'A student copies last year’s temperatures from a weather website',
      'A student looks up football results in a magazine',
      'A student uses house price data from an estate agent’s website',
    ]
    if (d === 1) {
      const isPrimary = rng.chance(0.5)
      const s = rng.pick(isPrimary ? primary : secondary)
      return choice({
        rng,
        prompt: `${s}. Is this PRIMARY data or SECONDARY data?`,
        correct: isPrimary ? 'Primary data' : 'Secondary data',
        wrong: [isPrimary ? 'Secondary data' : 'Primary data'],
        keepOrder: true,
        hint: 'Primary = you collect it yourself. Secondary = someone else collected it already.',
        explanation: isPrimary ? 'The person collected this data themselves, so it is primary data.' : 'Someone else collected this data first, so it is secondary data.',
      })
    }
    const s = rng.pick(secondary)
    return choice({
      rng,
      prompt: 'Which of these is an example of SECONDARY data?',
      correct: s,
      wrong: rng.shuffle(primary).slice(0, 3),
      hint: 'Secondary data was collected by someone else.',
      explanation: 'Data that somebody else collected (and you look up) is secondary data.',
    })
  }),

  G('dc.question', 'statistics.data-collection', [2, 4], (rng) => {
    type Opt = { label: string; flaw?: string }
    const topics: { intro: string; good: Opt; bad: Opt[] }[] = [
      {
        intro: 'You want to find out how long students spend on homework.',
        good: { label: 'How many hours of homework do you do in a typical school week?  0–2 / 3–5 / 6–8 / more than 8' },
        bad: [
          { label: 'Do you agree that homework is far too long and should be banned?', flaw: 'This is a leading question: it pushes people towards one answer.' },
          { label: 'How long do you do homework?  0–2 hours / 2–4 hours / 4–6 hours', flaw: 'The groups overlap (2 and 4 appear twice) and there is no time period.' },
          { label: 'Do you do lots of homework?', flaw: 'This is vague: “lots” means different things to different people.' },
        ],
      },
      {
        intro: 'You want to know what students choose for lunch.',
        good: { label: 'What do you usually have for lunch?  School meal / Packed lunch / Go home / Other' },
        bad: [
          { label: 'Don’t you agree that school meals are disgusting?', flaw: 'This is a leading question.' },
          { label: 'What do you eat?', flaw: 'Too vague: it could be answered in thousands of ways.' },
          { label: 'How much do you like school lunch?  A lot / Quite a lot', flaw: 'The options are all positive. There is no way to say you do not like it.' },
        ],
      },
      {
        intro: 'You want to find out how much time students spend on screens.',
        good: { label: 'On a school day, how much time do you spend on screens outside lessons?  Under 1 hour / 1 to under 2 hours / 2 to under 3 hours / 3 hours or more' },
        bad: [
          { label: 'Do you think you spend too much time on your phone, like everyone else does?', flaw: 'This is a leading question.' },
          { label: 'How much time do you spend on screens?  0–1 hour / 1–2 hours / 2–3 hours', flaw: 'The groups overlap, there is no option above 3 hours, and no time period.' },
          { label: 'Screen time?', flaw: 'Too vague: it is not clear what is being asked.' },
        ],
      },
    ]
    const t = rng.pick(topics)
    return choice({
      rng,
      prompt: `${t.intro} Which is the BEST question to put in a questionnaire?`,
      correct: t.good.label,
      wrong: t.bad.map((b) => ({ label: b.label, misconception: 'bad-question', feedback: b.flaw })),
      hint: 'A good question is clear, not leading, and gives options that do not overlap and cover every answer.',
      explanation: 'The best question is clear and unbiased, and its response boxes do not overlap and cover every possible answer.',
    })
  }),

  G('dc.tally', 'statistics.data-collection', [1, 1], (rng) => {
    const g = rng.int(2, 6)
    const r = rng.int(1, 4)
    return num({
      prompt: `In a tally chart, a group of five is drawn as four strokes with a fifth stroke through them. One row shows ${g} full groups of five and ${r} extra ${r === 1 ? 'stroke' : 'strokes'}. What is the frequency?`,
      answer: 5 * g + r,
      hint: 'Each full group counts as 5.',
      explanation: `${g} × 5 = ${5 * g}. ${5 * g} + ${r} = ${5 * g + r}.`,
      errors: [ex('counted-groups-as-1', 'Each full group of five is worth 5, not 1.', g + r)],
    })
  }),

  G('dc.type', 'statistics.data-collection', [2, 3], (rng, d) => {
    const bank: [string, 'Categorical' | 'Discrete numerical' | 'Continuous numerical', string][] = [
      ['the colour of a person’s eyes', 'Categorical', 'It is a category (a word), not a number.'],
      ['the number of pets a student has', 'Discrete numerical', 'It is a number that can only take separate values (0, 1, 2...).'],
      ['the height of a student', 'Continuous numerical', 'Height can be any value in a range, e.g. 152.37 cm.'],
      ['the number of goals scored in a match', 'Discrete numerical', 'You cannot score half a goal: only whole-number values.'],
      ['a person’s favourite sport', 'Categorical', 'It is a category (a word).'],
      ['the time taken to run 100 m', 'Continuous numerical', 'Time can be any value in a range, e.g. 13.27 s.'],
      ['the mass of an apple', 'Continuous numerical', 'Mass can take any value in a range.'],
      ['the number of students in a class', 'Discrete numerical', 'You count whole students.'],
    ]
    const pool = d === 2 ? bank.filter((b) => b[1] !== 'Continuous numerical').concat(bank.filter((b) => b[1] === 'Continuous numerical').slice(0, 1)) : bank
    const [what, type, why] = rng.pick(pool)
    return choice({
      rng,
      prompt: `What type of data is ${what}?`,
      correct: type,
      wrong: ['Categorical', 'Discrete numerical', 'Continuous numerical'].filter((t) => t !== type),
      keepOrder: true,
      hint: 'Categories are words. Discrete data is counted in separate steps. Continuous data is measured.',
      explanation: `${why} So it is ${type.toLowerCase()} data.`,
    })
  }),

  G('dc.sample', 'statistics.data-collection', [4, 4], (rng) => {
    const bank: [string, string, string[]][] = [
      ['A school wants to know what pupils think about a new lunch menu. How should it choose a sample of 30 pupils?', 'Pick 30 names at random from the list of the whole school', ['Ask the first 30 pupils in the lunch queue', 'Ask 30 pupils from Year 7 only', 'Ask your 30 closest friends']],
      ['A council wants to know if residents support a new park. How should it choose a sample of 100 people?', 'Pick 100 addresses at random from the whole town', ['Ask 100 people already at the park', 'Ask 100 people from one street', 'Ask 100 council workers']],
    ]
    const [q, right, wrong] = rng.pick(bank)
    return choice({
      rng,
      prompt: q,
      correct: right,
      wrong: wrong.map((w) => ({ label: w, misconception: 'biased-sample', feedback: 'This sample would be biased: some groups are more likely to be picked than others.' })),
      hint: 'A fair sample gives everybody the same chance of being picked.',
      explanation: 'A random sample from the whole group is fair. The others leave out some people or favour one group, so they are biased.',
    })
  }),

  // ============================================== AVERAGES & RANGE (Y7)
  G('av.basic', 'statistics.averages-range', [1, 3], (rng, d) => {
    const kinds = d === 1 ? (['mode', 'range', 'mean'] as const) : d === 2 ? (['median', 'mean', 'mode', 'range'] as const) : (['median', 'mean'] as const)
    const kind = rng.pick(kinds)
    let xs: number[]
    if (kind === 'mode') {
      const modal = rng.int(2, 12)
      const others = rng.shuffle(Array.from({ length: 12 }, (_v, i) => i + 1).filter((v) => v !== modal)).slice(0, d === 1 ? 4 : 5)
      xs = rng.shuffle([modal, modal, modal, ...others])
    } else if (kind === 'mean') {
      const n = d === 3 ? rng.pick([4, 5, 8]) : rng.pick([3, 4, 5])
      xs = d === 3 ? Array.from({ length: n }, () => rng.int(2, 20)) : withMean(rng, n, rng.int(4, 12), 4)
    } else if (kind === 'median') {
      const n = d === 2 ? rng.pick([5, 7]) : rng.pick([4, 6, 8])
      xs = rng.shuffle(Array.from({ length: 20 }, (_v, i) => i + 1)).slice(0, n)
    } else {
      xs = Array.from({ length: d === 1 ? 5 : 6 }, () => rng.int(1, 30))
    }
    const label = { mode: 'mode', mean: 'mean', median: 'median', range: 'range' }[kind]
    const answer = kind === 'mode' ? modeOf(xs) : kind === 'mean' ? mean(xs) : kind === 'median' ? median(xs) : Math.max(...xs) - Math.min(...xs)
    const s = sorted(xs)
    const explanation =
      kind === 'mode'
        ? `${answer} appears most often (3 times).`
        : kind === 'mean'
          ? `Total = ${sum(xs)}. ${sum(xs)} ÷ ${xs.length} = ${round(answer, 3)}.`
          : kind === 'median'
            ? `In order: ${list(s)}. ${xs.length % 2 === 1 ? `The middle value is ${answer}.` : `The middle two are ${s[xs.length / 2 - 1]} and ${s[xs.length / 2]}, so the median is ${answer}.`}`
            : `Biggest ${Math.max(...xs)} − smallest ${Math.min(...xs)} = ${answer}.`
    const errors: CommonError[] = []
    if (kind === 'median') {
      const mid = xs.length % 2 === 1 ? (xs[(xs.length - 1) / 2] as number) : ((xs[xs.length / 2 - 1] as number) + (xs[xs.length / 2] as number)) / 2
      errors.push(ex('unsorted-median', 'The numbers must be put IN ORDER (smallest to largest) before you pick the middle.', mid))
      errors.push(ex('mean-for-median', 'That is the mean. The median is the middle value when the numbers are in order.', round(mean(xs), 3)))
    }
    if (kind === 'mean') errors.push(ex('forgot-divide', 'You added the numbers but did not divide by how many there are.', sum(xs)))
    if (kind === 'range') errors.push(ex('gave-biggest', 'The range is the biggest value MINUS the smallest.', Math.max(...xs)))
    return num({
      prompt: `Find the ${label} of  ${list(xs)}`,
      answer,
      hint: kind === 'median' ? 'Put the numbers in order first.' : kind === 'mean' ? 'Add them all up, then divide by how many numbers there are.' : kind === 'range' ? 'Range = biggest − smallest.' : 'The mode is the value that appears most often.',
      explanation,
      errors,
    })
  }),

  G('av.missing', 'statistics.averages-range', [4, 5], (rng, d) => {
    if (d === 4) {
      if (rng.chance(0.5)) {
        const n = rng.int(4, 6)
        for (let g = 0; g < 200; g++) {
          const m = rng.int(5, 15)
          const known = Array.from({ length: n - 1 }, () => rng.int(2, 20))
          const missing = m * n - sum(known)
          if (missing < 1 || missing > 25) continue
          return num({
            prompt: `The mean of ${n} numbers is ${m}. ${n - 1} of the numbers are ${list(known)}. What is the missing number?`,
            answer: missing,
            hint: 'Total = mean × how many numbers. Then take away the numbers you already know.',
            explanation: `Total = ${m} × ${n} = ${m * n}. Known numbers add to ${sum(known)}. Missing = ${m * n} − ${sum(known)} = ${missing}.`,
            errors: [ex('gave-total', 'That is the total of all the numbers. Take away the ones you know.', m * n), ex('gave-mean', 'The mean is not the missing number. Use total = mean × count.', m)],
          })
        }
      }
      for (let g = 0; g < 300; g++) {
        const n = rng.pick([4, 5, 9])
        const m = rng.int(10, 20)
        const x = rng.int(10, 40)
        if ((m * n + x) % (n + 1) !== 0) continue
        const nm = (m * n + x) / (n + 1)
        return num({
          prompt: `The mean age of ${n} friends is ${m}. Another friend, aged ${x}, joins the group. What is the new mean age?`,
          answer: nm,
          hint: 'Find the total age first (mean × number of friends), add the new age, then divide by the new number of friends.',
          explanation: `Total = ${m} × ${n} = ${m * n}. Add ${x}: ${m * n + x}. New mean = ${m * n + x} ÷ ${n + 1} = ${nm}.`,
          errors: [ex('averaged-averages', 'You cannot just average the old mean and the new age. Use the totals.', (m + x) / 2), ex('divided-by-old', `There are now ${n + 1} friends, not ${n}.`, round((m * n + x) / n, 3))],
        })
      }
    }
    for (let g = 0; g < 300; g++) {
      const n = rng.int(4, 7)
      const m = rng.int(50, 80)
      const nm = m + rng.int(1, 4)
      const added = nm * (n + 1) - m * n
      if (added > 100 || added < 0) continue
      return num({
        prompt: `A student’s mean score in ${n} tests is ${m}. After one more test, the mean rises to ${nm}. What was the score in the last test?`,
        answer: added,
        hint: `Find the total of the ${n + 1} tests (new mean × ${n + 1}) and of the first ${n} tests (old mean × ${n}). The difference is the last score.`,
        explanation: `New total = ${nm} × ${n + 1} = ${nm * (n + 1)}. Old total = ${m} × ${n} = ${m * n}. Last score = ${nm * (n + 1)} − ${m * n} = ${added}.`,
        errors: [ex('gave-new-mean', 'That is the new mean. Use totals to find the last score.', nm)],
      })
    }
    throw new Error('av.missing: no candidate')
  }),

  G('av.best', 'statistics.averages-range', [3, 4], (rng, d) => {
    const base = Array.from({ length: 5 }, () => rng.int(20, 30))
    const outlier = rng.int(80, 150)
    const out = rng.shuffle([...base, outlier])
    const options: [string, string, string][] = [
      [`The salaries (in £1000s) of 6 people at a firm are ${list(out)}. Which average best represents a typical salary?`, 'Median', `The ${outlier} is much bigger than the others and pulls the mean up. The median is not affected by extreme values.`],
      ['A shoe shop wants to know which size to order the most of. Which average should it use?', 'Mode', 'The mode is the most common value: the size sold most often.'],
      ['A teacher wants to share out 60 sweets so that every student gets the same number. Which average is she working out?', 'Mean', 'The mean is the “fair share” value: the total divided equally.'],
    ]
    const pool = d === 3 ? options.slice(1) : options
    const [q, right, why] = rng.pick(pool)
    return choice({ rng, prompt: q, correct: right, wrong: ['Mean', 'Median', 'Mode'].filter((x) => x !== right), keepOrder: true, hint: 'Mean = share equally. Median = middle value (ignores extremes). Mode = most common.', explanation: why })
  }),

  // =============================================== REPRESENTING DATA (Y7)
  G('rd.pie-angle', 'statistics.representing-data', [2, 4], (rng, d) => {
    const totals = [20, 24, 30, 36, 40, 45, 60, 72, 90, 120]
    const T = rng.pick(totals)
    const per = 360 / T
    if (d === 2) {
      const f = rng.int(2, Math.max(3, Math.floor(T / 3)))
      return num({
        prompt: `${T} students were asked to choose their favourite sport. ${f} chose football. What angle should be used for football on a pie chart?`,
        answer: f * per,
        suffix: '°',
        hint: `A full circle is 360°. Each of the ${T} students gets 360 ÷ ${T} degrees.`,
        explanation: `360 ÷ ${T} = ${per}° per student. ${f} × ${per} = ${f * per}°.`,
        errors: [ex('gave-percentage', 'You have found a percentage. The whole pie chart is 360°.', round((f / T) * 100, 2)), ex('gave-fraction-angle', 'Each student is worth 360 ÷ (total), then multiply by the number of students.', f)],
      })
    }
    if (d === 3) {
      if (rng.chance(0.5)) {
        const a = rng.pick([60, 80, 90, 100, 120])
        const b = rng.pick([50, 70, 90, 110])
        const c = rng.pick([40, 60, 80])
        const m = 360 - a - b - c
        if (m >= 20) {
          return num({
            prompt: `A pie chart has four sectors. Three of the angles are ${a}°, ${b}° and ${c}°. What is the angle of the fourth sector?`,
            answer: m,
            suffix: '°',
            hint: 'The angles in a pie chart add up to 360°.',
            explanation: `${a} + ${b} + ${c} = ${a + b + c}. 360 − ${a + b + c} = ${m}°.`,
            errors: [ex('used-180', 'A pie chart is a full circle: 360°.', 180 - a - b - c)],
          })
        }
      }
      const cats = ['Cats', 'Dogs', 'Fish', 'Rabbits']
      const k = 4
      const freqs = Array.from({ length: k }, () => rng.int(2, 5))
      const scale = T / sum(freqs)
      const values = Number.isInteger(scale) ? freqs.map((f) => f * scale) : freqs
      const total = sum(values)
      const idx = rng.int(0, k - 1)
      const angle = ((values[idx] as number) * 360) / total
      return num({
        prompt: `The table shows the pets owned by some students. What angle should be used for ${(cats[idx] as string).toLowerCase()} in a pie chart?`,
        figure: { type: 'table', head: ['Pet', 'Frequency'], rows: cats.map((c, i) => [c, String(values[i])]) },
        answer: round(angle, 3),
        tolerance: 0.5,
        suffix: '°',
        hint: 'Add up the frequencies first. Then angle = frequency ÷ total × 360.',
        explanation: `Total = ${total}. Angle = ${values[idx]} ÷ ${total} × 360 = ${round(angle, 2)}°.`,
        errors: [ex('gave-frequency', 'That is the frequency. Convert it to an angle: ÷ total × 360.', values[idx] as number)],
      })
    }
    const f = rng.int(2, Math.max(3, Math.floor(T / 3)))
    return num({
      prompt: `${T} people were asked their favourite colour. On a pie chart, the sector for blue has an angle of ${f * per}°. How many people chose blue?`,
      answer: f,
      hint: `Each person is worth 360 ÷ ${T} = ${per}°. How many lots of ${per}° are in ${f * per}°?`,
      explanation: `360 ÷ ${T} = ${per}° per person. ${f * per} ÷ ${per} = ${f} people.`,
      errors: [ex('gave-angle', 'That is the angle. Divide by the angle for one person.', f * per)],
    })
  }),

  G('rd.bar-read', 'statistics.representing-data', [1, 3], (rng, d) => {
    const sets: [string, string[], string][] = [
      ['pets', ['Dog', 'Cat', 'Fish', 'Rabbit', 'Bird'], 'Number of students'],
      ['favourite fruit', ['Apple', 'Banana', 'Orange', 'Grapes', 'Pear'], 'Number of students'],
      ['transport to school', ['Walk', 'Bus', 'Car', 'Bike', 'Train'], 'Number of students'],
    ]
    const [what, labels0, yLabel] = rng.pick(sets)
    const labels = labels0.slice(0, 4)
    const unit = rng.pick([1, 2, 5])
    const maxK = unit === 1 ? 10 : unit === 2 ? 8 : 6
    const values = labels.map(() => unit * rng.int(1, maxK))
    const fig: Figure = { type: 'bar-chart', bars: labels.map((label, i) => ({ label, value: values[i] as number })), yLabel, showValues: false }
    const idx = rng.int(0, labels.length - 1)
    const total = sum(values)
    if (d === 1) {
      return num({
        prompt: `The bar chart shows the ${what} of some students. How many students chose ${labels[idx]}?`,
        figure: fig,
        answer: values[idx] as number,
        hint: 'Read the height of the bar against the scale on the left.',
        explanation: `The ${labels[idx]} bar reaches ${values[idx]}.`,
      })
    }
    if (d === 2) {
      return num({
        prompt: `The bar chart shows the ${what} of some students. How many students were asked altogether?`,
        figure: fig,
        answer: total,
        hint: 'Read every bar and add them up.',
        explanation: `${values.join(' + ')} = ${total}.`,
        errors: [ex('gave-tallest', 'That is only one bar. Add up ALL the bars.', Math.max(...values))],
      })
    }
    const a = rng.int(0, labels.length - 1)
    return prob({
      prompt: `The bar chart shows the ${what} of some students. What fraction of the students chose ${labels[a]}? (Fraction in its simplest form.)`,
      figure: fig,
      n: values[a] as number,
      d: total,
      hint: 'Find the total number of students first. Then fraction = students who chose it ÷ total.',
      explanation: `Total = ${total}. ${labels[a]} = ${values[a]}. Fraction = ${F(values[a] as number, total)}${gcd(values[a] as number, total) > 1 ? ` = ${frac(values[a] as number, total)}` : ''}.`,
      errors: [ex('part-to-part', 'The bottom of the fraction is the TOTAL number of students.', (values[a] as number) / (total - (values[a] as number)))],
    })
  }),

  G('rd.pictogram', 'statistics.representing-data', [1, 2], (rng, d) => {
    const key = rng.pick([2, 4, 5, 6, 10])
    if (d === 1) {
      const n = rng.int(2, 6)
      return num({
        prompt: `In a pictogram, each symbol stands for ${key} books. Monday shows ${n} symbols. How many books were read on Monday?`,
        answer: key * n,
        hint: 'Multiply the number of symbols by the value of one symbol.',
        explanation: `${n} × ${key} = ${key * n} books.`,
        errors: [ex('gave-symbols', 'That is the number of symbols. Each symbol stands for more than one book.', n)],
      })
    }
    const whole = rng.int(1, 5)
    if (rng.chance(0.6)) {
      return num({
        prompt: `In a pictogram, each symbol stands for ${key * 2} books. Tuesday shows ${whole} whole symbols and half a symbol. How many books were read on Tuesday?`,
        answer: key * 2 * whole + key,
        hint: 'Half a symbol stands for half of the value of a whole symbol.',
        explanation: `${whole} × ${key * 2} = ${key * 2 * whole}. Half a symbol = ${key}. Total = ${key * 2 * whole + key}.`,
        errors: [ex('ignored-half', 'You missed the half symbol, which is worth half of one symbol.', key * 2 * whole)],
      })
    }
    const symbols = rng.int(2, 7) + 0.5
    return num({
      prompt: `In a pictogram, each symbol stands for ${key * 2} books. Wednesday's row must show ${key * 2 * symbols} books. How many symbols should be drawn? (Count half a symbol as 0.5.)`,
      answer: symbols,
      hint: `Divide the number of books by ${key * 2}.`,
      explanation: `${key * 2 * symbols} ÷ ${key * 2} = ${symbols} symbols.`,
      errors: [ex('gave-books', 'That is the number of books. Divide by what one symbol stands for.', key * 2 * symbols)],
    })
  }),

  G('rd.choose', 'statistics.representing-data', [2, 3], (rng) => {
    const bank: [string, string, string][] = [
      ['show how a whole is split into parts (for example, how a class travel to school)', 'Pie chart', 'A pie chart shows each part as a fraction of a whole circle.'],
      ['compare the number of people who chose each of several categories', 'Bar chart', 'A bar chart lets you compare the height of each category.'],
      ['show data using pictures, where each picture stands for a number of items', 'Pictogram', 'A pictogram uses symbols that each represent a number.'],
    ]
    const [use, right, why] = rng.pick(bank)
    return choice({ rng, prompt: `Which type of chart is best if you want to ${use}?`, correct: right, wrong: ['Pie chart', 'Bar chart', 'Pictogram'].filter((x) => x !== right), keepOrder: true, hint: 'Think about what each type of chart is designed to show.', explanation: why })
  }),

  // ============================================== FREQUENCY TABLES (Y8)
  G('ft.total', 'statistics.frequency-tables', [1, 3], (rng, d) => {
    const xs = [0, 1, 2, 3, 4]
    const fs = xs.map(() => rng.int(1, 9))
    const fig: Figure = { type: 'table', head: ['Number of pets', 'Frequency'], rows: xs.map((x, i) => [String(x), String(fs[i])]) }
    if (d === 1) {
      return num({
        prompt: 'The table shows the number of pets owned by each student in a class. How many students are in the class?',
        figure: fig,
        answer: sum(fs),
        hint: 'The frequencies tell you how many students are in each row. Add them.',
        explanation: `${fs.join(' + ')} = ${sum(fs)} students.`,
        errors: [ex('added-values', 'You added the numbers of pets (0, 1, 2...). Add the FREQUENCIES.', sum(xs))],
      })
    }
    if (d === 2) {
      return num({
        prompt: 'The table shows the number of pets owned by each student in a class. How many students have MORE than 2 pets?',
        figure: fig,
        answer: (fs[3] as number) + (fs[4] as number),
        hint: 'More than 2 means 3 pets or 4 pets.',
        explanation: `${fs[3]} + ${fs[4]} = ${(fs[3] as number) + (fs[4] as number)} students.`,
        errors: [ex('included-two', '“More than 2” does not include 2.', (fs[2] as number) + (fs[3] as number) + (fs[4] as number))],
      })
    }
    const pets = sum(xs.map((x, i) => x * (fs[i] as number)))
    return num({
      prompt: 'The table shows the number of pets owned by each student in a class. How many pets do the students have altogether?',
      figure: fig,
      answer: pets,
      hint: 'In each row, multiply the number of pets by the frequency. Then add these up.',
      explanation: xs.map((x, i) => `${x} × ${fs[i]} = ${x * (fs[i] as number)}`).join('; ') + `. Total = ${pets}.`,
      errors: [ex('added-frequencies', 'That is the number of students. Multiply each row first.', sum(fs))],
    })
  }),

  G('ft.mean', 'statistics.frequency-tables', [3, 4], (rng, d) => {
    const contexts: [string, string, number[]][] = [
      ['Goals scored', 'goals scored per match', [0, 1, 2, 3, 4]],
      ['Number of siblings', 'siblings per student', [0, 1, 2, 3, 4]],
      ['Score', 'score in a quiz', d === 3 ? [1, 2, 3, 4, 5] : [5, 6, 7, 8, 9, 10]],
    ]
    const [head, what, xs] = rng.pick(contexts)
    for (let g = 0; g < 500; g++) {
      const total = rng.pick([10, 20, 25, 50])
      const fs = composition(rng, total, xs.length)
      const totalX = sum(xs.map((x, i) => x * (fs[i] as number)))
      if ((totalX * 100) % total !== 0) continue
      const mean_ = totalX / total
      return num({
        prompt: `The table shows the ${what} for some students. Work out the mean.`,
        figure: { type: 'table', head: [head, 'Frequency'], rows: xs.map((x, i) => [String(x), String(fs[i])]) },
        answer: round(mean_, 4),
        hint: 'Add a third column: value × frequency. Then mean = total of that column ÷ total of the frequencies.',
        explanation: `Total of (value × frequency) = ${xs.map((x, i) => `${x}×${fs[i]}`).join(' + ')} = ${totalX}. Total frequency = ${total}. Mean = ${totalX} ÷ ${total} = ${round(mean_, 4)}.`,
        errors: [
          ex('ignored-frequency', 'You averaged the values in the first column and ignored how often each occurs. Multiply each value by its frequency.', round(mean(xs), 4)),
          ex('divided-by-rows', `You divided by the number of rows (${xs.length}). Divide by the total FREQUENCY (${total}).`, round(totalX / xs.length, 4)),
          ex('gave-total', 'That is the total of value × frequency. Now divide by the total frequency.', totalX),
        ],
      })
    }
    throw new Error('ft.mean: no candidate')
  }),

  G('ft.median-mode', 'statistics.frequency-tables', [2, 4], (rng, d) => {
    const xs = [0, 1, 2, 3, 4, 5].slice(0, rng.pick([5, 6]))
    for (let g = 0; g < 300; g++) {
      const total = d === 4 ? rng.pick([20, 24, 30, 40]) : rng.pick([9, 11, 15, 21, 25])
      const fs = composition(rng, total, xs.length)
      const top = Math.max(...fs)
      if (fs.filter((f) => f === top).length !== 1) continue
      const fig: Figure = { type: 'table', head: ['Score', 'Frequency'], rows: xs.map((x, i) => [String(x), String(fs[i])]) }
      const all = expand(xs, fs)
      if (d === 2) {
        const modeVal = xs[fs.indexOf(top)] as number
        return num({
          prompt: 'The table shows the scores of some students in a game. What is the mode?',
          figure: fig,
          answer: modeVal,
          hint: 'The mode is the score that occurs most often: it has the biggest frequency.',
          explanation: `The highest frequency is ${top}, which belongs to the score ${modeVal}. So the mode is ${modeVal}.`,
          errors: [ex('gave-frequency', 'That is the frequency. The mode is the SCORE with the highest frequency.', top)],
        })
      }
      const med = median(all)
      const errorsMed = [ex('median-of-values', 'You found the middle of the list of scores (first column) and ignored the frequencies.', median(xs)), ex('median-of-frequencies', 'The median is a score (first column), not a frequency.', median(fs))]
      return num({
        prompt: `The table shows the scores of ${total} students in a game. What is the median score?`,
        figure: fig,
        answer: med,
        hint: total % 2 === 1 ? `The median is the ${(total + 1) / 2}th value. Add up the frequencies as you go down until you reach it.` : `The median is halfway between the ${total / 2}th and ${total / 2 + 1}th values. Add up the frequencies as you go down.`,
        explanation: `${total} values, so the median is ${total % 2 === 1 ? `the ${(total + 1) / 2}th` : `halfway between the ${total / 2}th and ${total / 2 + 1}th`}. Running total: ${xs.map((x, i) => `${x}: ${sum(fs.slice(0, i + 1))}`).join(', ')}. Median = ${med}.`,
        errors: errorsMed,
      })
    }
    throw new Error('ft.median-mode: no candidate')
  }),

  G('ft.modal', 'statistics.frequency-tables', [3, 4], (rng) => {
    const width = rng.pick([10, 5])
    const start = rng.pick([0, 10, 20])
    const classes = Array.from({ length: 5 }, (_v, i) => `${start + i * width} < h ≤ ${start + (i + 1) * width}`)
    for (let g = 0; g < 300; g++) {
      const fs = composition(rng, rng.pick([20, 25, 30, 40]), 5)
      const top = Math.max(...fs)
      if (fs.filter((f) => f === top).length !== 1) continue
      const modal = classes[fs.indexOf(top)] as string
      return choice({
        rng,
        prompt: 'The table shows the heights, h cm, of some plants. Which is the modal class?',
        figure: { type: 'table', head: ['Height (cm)', 'Frequency'], rows: classes.map((c, i) => [c, String(fs[i])]) },
        correct: modal,
        wrong: classes.filter((c) => c !== modal).slice(0, 3),
        keepOrder: false,
        hint: 'The modal class is the class with the highest frequency.',
        explanation: `The highest frequency is ${top}, so the modal class is ${modal}.`,
      })
    }
    throw new Error('ft.modal: no candidate')
  }),

  G('ft.grouped-mean', 'statistics.frequency-tables', [4, 5], (rng) => {
    const width = 10
    const classes = Array.from({ length: 4 }, (_v, i) => ({ label: `${i * width} < x ≤ ${(i + 1) * width}`, mid: i * width + width / 2 }))
    for (let g = 0; g < 500; g++) {
      const total = rng.pick([20, 25, 50])
      const fs = composition(rng, total, 4)
      const tot = sum(classes.map((c, i) => c.mid * (fs[i] as number)))
      if ((tot * 100) % total !== 0) continue
      const est = tot / total
      return num({
        prompt: 'The table shows how many minutes some students spent on homework. Estimate the mean time.',
        figure: { type: 'table', head: ['Time (minutes)', 'Frequency'], rows: classes.map((c, i) => [c.label, String(fs[i])]) },
        answer: round(est, 4),
        tolerance: 0.01,
        hint: 'Use the MIDDLE of each class as its value. Multiply by the frequency, add up, and divide by the total frequency.',
        explanation: `Midpoints: ${classes.map((c) => c.mid).join(', ')}. ${classes.map((c, i) => `${c.mid}×${fs[i]}`).join(' + ')} = ${tot}. ${tot} ÷ ${total} = ${round(est, 4)}.`,
        errors: [ex('used-upper-bound', 'Use the MIDPOINT of each class, not the upper end.', round(sum(classes.map((c, i) => (c.mid + width / 2) * (fs[i] as number))) / total, 4)), ex('gave-total', 'That is the total of midpoint × frequency. Divide by the total frequency.', tot)],
      })
    }
    throw new Error('ft.grouped-mean: no candidate')
  }),

  // ================================================== SCATTER GRAPHS (Y8)
  G('sg.correlation', 'statistics.scatter-graphs', [1, 3], (rng, d) => {
    const kind = rng.pick(d === 1 ? (['positive', 'negative'] as const) : (['positive', 'negative', 'none'] as const))
    const pts = makeScatter(rng, kind)
    const fig: Figure = { type: 'scatter', points: pts, xLabel: 'x', yLabel: 'y' }
    if (d < 3) {
      return choice({
        rng,
        prompt: 'What type of correlation does this scatter graph show?',
        figure: fig,
        correct: `${cap(kind === 'none' ? 'no' : kind)} correlation`,
        wrong: ['Positive correlation', 'Negative correlation', 'No correlation'].filter((o) => o.toLowerCase() !== `${kind === 'none' ? 'no' : kind} correlation`),
        keepOrder: true,
        hint: 'As x increases, what happens to y in general?',
        explanation: kind === 'positive' ? 'As x increases, y tends to increase: positive correlation.' : kind === 'negative' ? 'As x increases, y tends to decrease: negative correlation.' : 'There is no pattern: no correlation.',
      })
    }
    const say: Record<string, string> = { positive: 'As x gets bigger, y tends to get bigger', negative: 'As x gets bigger, y tends to get smaller', none: 'There is no link between x and y' }
    return choice({
      rng,
      prompt: 'Which statement best describes this scatter graph?',
      figure: fig,
      correct: say[kind] as string,
      wrong: Object.entries(say).filter(([k]) => k !== kind).map(([, v]) => v),
      keepOrder: false,
      hint: 'Look at the overall direction of the points from left to right.',
      explanation: `${say[kind]}.`,
    })
  }),

  G('sg.context', 'statistics.scatter-graphs', [2, 3], (rng) => {
    const bank: [string, 'Positive correlation' | 'Negative correlation' | 'No correlation', string][] = [
      ['the height of a child and the length of their arm', 'Positive correlation', 'Taller children tend to have longer arms.'],
      ['the hours spent revising and the test score', 'Positive correlation', 'More revision tends to give higher scores.'],
      ['the temperature outside and the number of ice creams sold', 'Positive correlation', 'Warmer days tend to mean more ice creams.'],
      ['the age of a car and its value', 'Negative correlation', 'Older cars tend to be worth less.'],
      ['the outside temperature and the size of a heating bill', 'Negative correlation', 'Colder weather tends to mean higher bills.'],
      ['the speed of a car and the time taken to travel 100 km', 'Negative correlation', 'Faster speeds mean shorter times.'],
      ['a student’s shoe size and their maths test score', 'No correlation', 'There is no reason for these to be linked.'],
      ['the day of the month someone was born and their height', 'No correlation', 'There is no reason for these to be linked.'],
    ]
    const [what, type, why] = rng.pick(bank)
    return choice({
      rng,
      prompt: `What type of correlation would you expect between ${what}?`,
      correct: type,
      wrong: ['Positive correlation', 'Negative correlation', 'No correlation'].filter((o) => o !== type),
      keepOrder: true,
      hint: 'When one goes up, what does the other tend to do?',
      explanation: `${why} So you would expect ${type.toLowerCase()}.`,
    })
  }),

  G('sg.estimate', 'statistics.scatter-graphs', [3, 5], (rng, d) => {
    const m = rng.pick([0.5, 1, 1.5, 2])
    const c = rng.int(1, 4)
    const yAt = (x: number) => c + m * x
    const xs = rng.shuffle(Array.from({ length: 10 }, (_v, i) => i + 1)).slice(0, 9)
    const pts = xs.map((x): [number, number] => [x, Math.max(0, round((yAt(x) + rng.int(-4, 4) / 4) * 2, 0) / 2)])
    const fig: Figure = { type: 'scatter', points: pts, xLabel: 'x', yLabel: 'y', line: [[0, c], [10, yAt(10)]] }
    const step = m === 0.5 ? 2 : 1
    if (d === 3) {
      const x = step * rng.int(1, Math.floor(9 / step))
      return num({
        prompt: `A line of best fit has been drawn on this scatter graph. Use it to estimate the value of y when x = ${x}.`,
        figure: fig,
        answer: yAt(x),
        tolerance: 0.5,
        hint: `Find ${x} on the x-axis, go up to the line, then across to the y-axis.`,
        explanation: `At x = ${x} the line is at y = ${yAt(x)}.`,
      })
    }
    if (d === 4) {
      const x = step * rng.int(1, Math.floor(9 / step))
      const y = yAt(x)
      return num({
        prompt: `A line of best fit has been drawn on this scatter graph. Use it to estimate the value of x when y = ${y}.`,
        figure: fig,
        answer: x,
        tolerance: 0.5,
        hint: `Find ${y} on the y-axis, go across to the line, then down to the x-axis.`,
        explanation: `At y = ${y} the line is at x = ${x}.`,
      })
    }
    return num({
      prompt: 'The line of best fit on this scatter graph goes up steadily. Roughly how much does y increase for each 1 unit that x increases?',
      figure: fig,
      answer: m,
      tolerance: 0.1,
      hint: 'Pick two points on the line, find how far up it goes and divide by how far across it goes (the gradient).',
      explanation: `The line goes from (0, ${c}) to (10, ${yAt(10)}): up ${yAt(10) - c} over 10 across. ${yAt(10) - c} ÷ 10 = ${m}.`,
    })
  }),

  G('sg.outlier', 'statistics.scatter-graphs', [4, 4], (rng) => {
    for (let g = 0; g < 300; g++) {
      const xs = rng.shuffle(Array.from({ length: 10 }, (_v, i) => i + 1)).slice(0, 9)
      const pts = xs.map((x): [number, number] => [x, Math.max(1, x + rng.int(-1, 1))])
      const ox = rng.int(3, 8)
      const oy = rng.chance(0.5) ? Math.min(12, ox + 5) : Math.max(1, ox - 5)
      if (pts.some((p) => p[0] === ox) || Math.abs(oy - ox) < 4) continue
      return multi({
        prompt: 'One point on this scatter graph does not fit the pattern (an outlier). What are its coordinates?',
        figure: { type: 'scatter', points: [...pts, [ox, oy]], xLabel: 'x', yLabel: 'y' },
        fields: [{ answer: ox }, { answer: oy }],
        template: '({0}, {1})',
        hint: 'The outlier is the point that is far away from the general trend. Read its x-value first, then its y-value.',
        explanation: `The other points follow a positive trend, but the point at (${ox}, ${oy}) is far away from it.`,
        errors: [ex('swapped-xy', 'Give the x-coordinate (across) first, then the y-coordinate (up).', oy, ox)],
      })
    }
    throw new Error('sg.outlier: no candidate')
  }),

  G('sg.predict', 'statistics.scatter-graphs', [5, 5], (rng) => {
    const bank: [string, string][] = [
      ['A scatter graph shows the height of children aged 5 to 15, with a line of best fit. A student uses the line to predict the height of a person aged 40.', 'Not reliable: 40 is outside the range of the data, so the trend may not continue'],
      ['A scatter graph shows the number of ice creams sold at temperatures from 10°C to 30°C, with a line of best fit. A student uses the line to predict sales at 50°C.', 'Not reliable: 50°C is outside the range of the data'],
    ]
    const [q, right] = rng.pick(bank)
    return choice({
      rng,
      prompt: `${q} Which statement is correct?`,
      correct: right,
      wrong: ['Reliable: the line of best fit always gives an exact answer', 'Reliable: the graph shows positive correlation, so the prediction must be correct', 'Not reliable: you can never predict using a line of best fit'],
      hint: 'Is the value you are predicting inside the range of the data you have, or outside it?',
      explanation: 'Using the line inside the range of the data (interpolation) is usually reliable. Going outside the range (extrapolation) is not, because the pattern may change.',
    })
  }),

  // ============================================ COMPARING DATA SETS (Y8)
  G('cm.compare', 'statistics.comparing', [2, 4], (rng, d) => {
    const contexts: [string, string, (n: number) => string][] = [
      ['Class A', 'Class B', () => 'Test marks'],
      ['Team A', 'Team B', (n) => `Points scored in ${n} matches`],
      ['Shop A', 'Shop B', (n) => `Customers on ${n} days`],
    ]
    const [nameA, nameB, whatFor] = rng.pick(contexts)
    for (let g = 0; g < 500; g++) {
      const n = rng.pick([5, 4, 8])
      const mA = rng.int(10, 30)
      const mB = rng.int(10, 30)
      const a = withMean(rng, n, mA, rng.int(2, 8), 1)
      const b = withMean(rng, n, mB, rng.int(2, 8), 1)
      const rA = Math.max(...a) - Math.min(...a)
      const rB = Math.max(...b) - Math.min(...b)
      if (mA === mB || rA === rB) continue
      const intro = `${nameA}: ${list(a)}.  ${nameB}: ${list(b)}.  (${whatFor(n)})`
      if (d === 2) {
        return num({
          prompt: `${intro}  Work out the difference between the two means.`,
          answer: Math.abs(mA - mB),
          hint: 'Find each mean (total ÷ number of values), then subtract the smaller from the larger.',
          explanation: `${nameA} mean = ${sum(a)} ÷ ${n} = ${mA}. ${nameB} mean = ${sum(b)} ÷ ${n} = ${mB}. Difference = ${Math.abs(mA - mB)}.`,
          errors: [ex('gave-range-difference', 'That is the difference between the RANGES. The question asks for the means.', Math.abs(rA - rB))],
        })
      }
      const moreConsistent = rA < rB ? nameA : nameB
      if (d === 3) {
        return choice({
          rng,
          prompt: `${intro}  Which set is more consistent (less spread out)?`,
          correct: moreConsistent,
          wrong: [moreConsistent === nameA ? nameB : nameA],
          keepOrder: true,
          hint: 'The set with the smaller range is more consistent.',
          explanation: `${nameA} range = ${Math.max(...a)} − ${Math.min(...a)} = ${rA}. ${nameB} range = ${Math.max(...b)} − ${Math.min(...b)} = ${rB}. The smaller range is more consistent: ${moreConsistent}.`,
        })
      }
      const higher = mA > mB ? nameA : nameB
      const other = higher === nameA ? nameB : nameA
      const higherCons = (higher === nameA ? rA : rB) < (higher === nameA ? rB : rA)
      const opts = [
        `${higher} has the higher mean and is more consistent`,
        `${higher} has the higher mean but is less consistent`,
        `${other} has the higher mean and is more consistent`,
        `${other} has the higher mean but is less consistent`,
      ]
      return choice({
        rng,
        prompt: `${intro}  Which statement is correct?`,
        correct: higherCons ? opts[0] as string : opts[1] as string,
        wrong: [opts[2] as string, opts[3] as string, higherCons ? opts[1] as string : opts[0] as string],
        hint: 'Compare the means (which is bigger on average) and the ranges (which is more spread out).',
        explanation: `Means: ${nameA} ${mA}, ${nameB} ${mB}. Ranges: ${nameA} ${rA}, ${nameB} ${rB}. ${higher} has the higher mean; ${higherCons ? 'it also has' : 'it has'} the ${higherCons ? 'smaller' : 'larger'} range, so it is ${higherCons ? 'more' : 'less'} consistent.`,
      })
    }
    throw new Error('cm.compare: no candidate')
  }),

  G('cm.outlier', 'statistics.comparing', [4, 5], (rng) => {
    const base = sorted(Array.from({ length: 5 }, () => rng.int(10, 20)))
    const out = rng.int(60, 120)
    const withOut = [...base, out]
    const before = { mean: mean(base), median: median(base) }
    const after = { mean: mean(withOut), median: median(withOut) }
    return choice({
      rng,
      prompt: `The values ${list(base)} are joined by one extra value, ${out}. Which average is affected MOST by the extra value?`,
      correct: 'The mean',
      wrong: ['The median', 'They are affected equally', 'Neither is affected'],
      keepOrder: false,
      hint: 'Work out the mean and the median before and after adding the extra value.',
      explanation: `Mean: ${round(before.mean, 2)} → ${round(after.mean, 2)}. Median: ${round(before.median, 2)} → ${round(after.median, 2)}. The mean changes much more, because it uses every value including the extreme one.`,
    })
  }),
]

function modeOf(xs: number[]): number {
  const counts = new Map<number, number>()
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1)
  let best = xs[0] as number
  for (const [k, v] of counts) if (v > (counts.get(best) ?? 0)) best = k
  return best
}

