/**
 * Numbers to 100, days / months / dates, and telling the time. Mostly computed: numbers, ordinals and clock phrases
 * are built by rule, so every question is a fresh one.
 */
import type { ItemGenerator } from '@/engine/registry'
import type { Rng } from '@/engine/types'
import { choice, orderItem, textItem } from '../../kit'
import { G, accepts, cap, keyboardTip, pickN, q, vocabGens, type W, type Wrong } from './lib'

// ------------------------------------------------------------------ numbers

const ONES = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn']
const TENS = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig']

/** 0-100 in words: 47 -> siebenundvierzig. */
export function numDe(n: number): string {
  if (n === 100) return 'hundert'
  if (n < 20) return ONES[n] as string
  const t = Math.floor(n / 10)
  const u = n % 10
  if (u === 0) return TENS[t] as string
  return `${u === 1 ? 'ein' : ONES[u]}und${TENS[t]}`
}

/** The classic slips: siebenzig / sechszig, dreizig. Returns a misspelt version or null. */
function misspell(n: number): string | null {
  const w = numDe(n)
  if (w.includes('siebzig')) return w.replace('siebzig', 'siebenzig')
  if (w.includes('sechzig')) return w.replace('sechzig', 'sechszig')
  if (w.includes('siebzehn')) return w.replace('siebzehn', 'siebenzehn')
  if (w.includes('sechzehn')) return w.replace('sechzehn', 'sechszehn')
  if (w.includes('dreißig')) return w.replace('dreißig', 'dreizig')
  return null
}

const swapDigits = (n: number) => (n >= 21 && n <= 99 && n % 10 !== 0 && Math.floor(n / 10) !== n % 10 ? (n % 10) * 10 + Math.floor(n / 10) : null)
/** 17 <-> 70, 16 <-> 60: -zehn and -zig mixed up. */
const zehnZig = (n: number) => (n >= 13 && n <= 19 ? (n - 10) * 10 : n % 10 === 0 && n >= 30 && n <= 90 ? n / 10 + 10 : null)

function numberFor(rng: Rng, d: number): number {
  if (d <= 1) return rng.pick([13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 25, 30, 40, 50])
  if (d === 2) return rng.int(21, 99)
  // level 3+: favour the tricky ones
  if (rng.chance(0.4)) return rng.pick([16, 17, 30, 31, 60, 61, 66, 67, 70, 71, 76, 77, 36, 37, 96, 97, 100])
  return rng.int(21, 99)
}

function numberWrongs(n: number, rng: Rng): { n: number; why?: string }[] {
  const out: { n: number; why?: string }[] = []
  const s = swapDigits(n)
  if (s) out.push({ n: s, why: 'German says the units first: vierundzwanzig is "four-and-twenty" = 24, not 42.' })
  const z = zehnZig(n)
  if (z) out.push({ n: z, why: '-zehn means teen (siebzehn = 17); -zig means tens (siebzig = 70).' })
  for (const c of [n + 10, n - 10, n + 1, n - 1, n + 2, rng.int(13, 99)]) if (c >= 1 && c <= 100 && c !== n) out.push({ n: c })
  return out
}

const numberGens: ItemGenerator[] = [
  G('top.num.read', 'vocab.numbers-100', [1, 3], (rng, d) => {
    const n = numberFor(rng, d)
    const wrongs: Wrong[] = []
    const seen = new Set([n])
    for (const w of numberWrongs(n, rng)) {
      if (seen.has(w.n) || wrongs.length >= 3) continue
      seen.add(w.n)
      wrongs.push(w.why ? { label: String(w.n), misconception: 'number-order', feedback: w.why } : String(w.n))
    }
    return choice({
      rng,
      prompt: `What number is ${q(numDe(n))}?`,
      correct: String(n),
      wrong: wrongs,
      hint: n > 20 ? 'Read the end of the word first: it gives the tens. The start gives the units.' : 'Is it -zehn (a teen) or -zig (a ten)?',
      explanation: `${numDe(n)} = ${n}. ${n > 20 && n % 10 !== 0 ? `In German the units come first: ${n % 10 === 1 ? 'ein' : numDe(n % 10)} + und + ${numDe(Math.floor(n / 10) * 10)}.` : ''}`.trim(),
    })
  }),

  G('top.num.pick', 'vocab.numbers-100', [1, 3], (rng, d) => {
    const n = numberFor(rng, d)
    const correct = numDe(n)
    const wrongs: Wrong[] = []
    const m = misspell(n)
    if (m) wrongs.push({ label: m, misconception: 'number-spelling', feedback: 'Watch the spelling: sechzig, sechzehn (no s) and siebzig, siebzehn (no en), dreißig (with ß).' })
    for (const w of numberWrongs(n, rng)) wrongs.push(w.why ? { label: numDe(w.n), misconception: 'number-order', feedback: w.why } : numDe(w.n))
    return choice({
      rng,
      prompt: `How do you write ${n} in German?`,
      correct,
      wrong: wrongs.slice(0, 3),
      hint: n > 20 && n % 10 ? 'Say the units first, then "und", then the tens.' : 'Think about the teens (-zehn) and the tens (-zig).',
      explanation: `${n} = ${correct}.${n > 20 && n % 10 ? ' Units first, then und, then the tens, all as one word.' : ''} Tricky spellings: sechzehn, sechzig, siebzehn, siebzig, dreißig.`,
    })
  }),

  G('top.num.write', 'vocab.numbers-100', [3, 5], (rng, d) => {
    const n = d >= 5 ? rng.pick([16, 17, 30, 31, 60, 61, 66, 67, 70, 71, 76, 77, 81, 96, 97, 100]) : numberFor(rng, d)
    const w = numDe(n)
    return textItem({
      prompt: `Write ${n} in German, as one word.`,
      accept: accepts(w, ...(n === 100 ? ['einhundert'] : [])),
      placeholder: 'Type the number in words',
      hint: n > 20 && n % 10 ? 'Units first, then und, then the tens, all joined together.' : 'Teens end in -zehn, tens end in -zig (except dreißig).',
      explanation: `${n} = ${w}. ${n % 10 === 1 && n > 20 ? 'Note "ein", not "eins", when it is joined to und.' : 'Watch out for sechzig, siebzig and dreißig.'}${keyboardTip(w)}`,
    })
  }),

  G('top.num.sum', 'vocab.numbers-100', [2, 4], (rng, d) => {
    const a = rng.int(d <= 2 ? 5 : 11, d <= 2 ? 40 : 60)
    const b = rng.int(3, Math.min(39, 99 - a))
    const minus = d >= 3 && rng.chance(0.5)
    const [x, y] = minus ? [a + b, b] : [a, b]
    const ans = minus ? a : a + b
    const op = minus ? 'minus' : 'plus'
    const asWords = d >= 4
    const wrongNums = numberWrongs(ans, rng).map((w) => w.n)
    return choice({
      rng,
      prompt: `Was ist ${numDe(x)} ${op} ${numDe(y)}?  (was ist = what is)`,
      correct: asWords ? numDe(ans) : String(ans),
      wrong: [...new Set(wrongNums)].filter((v) => v !== ans).slice(0, 3).map((v) => (asWords ? numDe(v) : String(v))),
      hint: 'Turn each German number into digits first: the units come before the tens.',
      explanation: `${numDe(x)} = ${x}, ${numDe(y)} = ${y}, so the answer is ${ans} (${numDe(ans)}).`,
    })
  }),
]

// ------------------------------------------------------------------ calendar

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const CALENDAR_WORDS: W[] = [
  ...DAYS.map((de, i) => ({ de, en: DAYS_EN[i] as string, g: 'der' as const, alt: de === 'Samstag' ? ['Sonnabend'] : undefined, tip: de === 'Samstag' ? 'In the north of Germany you also hear Sonnabend.' : de === 'Mittwoch' ? 'Mittwoch = "mid-week".' : undefined })),
  ...MONTHS.map((de, i) => ({ de, en: MONTHS_EN[i] as string, g: 'der' as const, alt: de === 'Januar' ? ['Jänner'] : undefined, tip: de === 'Januar' ? 'In Austria January is often Jänner.' : de === 'März' ? 'März has an umlaut.' : undefined })),
  { de: 'Frühling', en: 'spring', g: 'der' },
  { de: 'Sommer', en: 'summer', g: 'der' },
  { de: 'Herbst', en: 'autumn', g: 'der' },
  { de: 'Winter', en: 'winter', g: 'der' },
  { de: 'Wochenende', en: 'weekend', g: 'das' },
  { de: 'Geburtstag', en: 'birthday', g: 'der' },
  { de: 'heute', en: 'today' },
  { de: 'morgen', en: 'tomorrow', tip: 'With a small m, morgen = tomorrow; der Morgen = the morning.' },
  { de: 'gestern', en: 'yesterday' },
]

/** Ordinal stem for dates: 3 -> dritt, 20 -> zwanzigst. */
export function ordStem(n: number): string {
  if (n === 1) return 'erst'
  if (n === 3) return 'dritt'
  if (n === 7) return 'siebt'
  if (n === 8) return 'acht'
  return n < 20 ? `${numDe(n)}t` : `${numDe(n)}st`
}
const amDate = (day: number, month: number) => `am ${ordStem(day)}en ${MONTHS[month]}`

const ORD_RULE = 'For dates, add -ten to numbers up to 19 and -sten from 20 (am zweiten, am zwanzigsten). Irregular: am ersten, am dritten, am siebten, am achten.'

function wrongOrdinal(day: number): Wrong[] {
  const regular = day === 1 ? 'einsten' : day === 3 ? 'dreiten' : day === 7 ? 'siebenten' : day === 8 ? 'achtten' : null
  const out: Wrong[] = []
  if (regular && day !== 7) out.push({ label: regular, misconception: 'irregular-ordinal', feedback: 'This one is irregular: erst-, dritt-, siebt-, acht-.' })
  out.push({ label: `${numDe(day)}`, misconception: 'cardinal-for-date', feedback: 'Dates use the ordinal ("third", not "three"), with -en after am.' })
  out.push({ label: `${ordStem(day)}e`, misconception: 'ordinal-case-ending', feedback: 'After am the ordinal ends in -en: am dritten, am zwanzigsten.' })
  if (day !== 1) out.push({ label: day < 20 ? `${numDe(day)}sten` : `${numDe(day)}ten`, misconception: 'ordinal-ending', feedback: 'Up to 19 add -ten; from 20 add -sten.' })
  return out
}

const calendarGens: ItemGenerator[] = [
  ...vocabGens('cal', 'vocab.calendar', CALENDAR_WORDS, 'days, months and seasons'),

  G('top.cal.next', 'vocab.calendar', [1, 3], (rng, d) => {
    const months = d >= 2 && rng.chance(0.5)
    const list = months ? MONTHS : DAYS
    const i = rng.int(0, list.length - 1)
    const before = d >= 3 && rng.chance(0.5)
    const j = (i + (before ? -1 : 1) + list.length) % list.length
    const opp = (i + (before ? 1 : -1) + list.length) % list.length
    const kind = months ? 'Monat' : 'Tag'
    const wrong: Wrong[] = [
      { label: list[opp] as string, misconception: 'nach-vor', feedback: `nach = after, vor = before.` },
      list[(j + (before ? -1 : 1) + list.length) % list.length] as string,
      list[(i + 3) % list.length] as string,
    ]
    return choice({
      rng,
      prompt: `Welcher ${kind} kommt ${before ? 'vor' : 'nach'} ${list[i]}?  (Which ${months ? 'month' : 'day'} comes ${before ? 'before' : 'after'} ${list[i]}?)`,
      correct: list[j] as string,
      wrong,
      hint: `${before ? 'vor = before' : 'nach = after'}. Say the ${months ? 'months' : 'days'} in order in your head.`,
      explanation: `${list[j]} kommt ${before ? 'vor' : 'nach'} ${list[i]}. ${months ? MONTHS_EN[j] : DAYS_EN[j]} comes ${before ? 'before' : 'after'} ${months ? MONTHS_EN[i] : DAYS_EN[i]}.`,
    })
  }),

  G('top.cal.order', 'vocab.calendar', [2, 3], (rng, d) => {
    const months = d >= 3 || rng.chance(0.4)
    const list = months ? MONTHS : DAYS
    const idx = pickN(rng, list.map((_, i) => i), months ? 5 : 4).sort((a, b) => a - b)
    return orderItem({
      rng,
      prompt: `Put these ${months ? 'months' : 'days'} in order, starting with the earliest${months ? ' in the year' : ' in the week (Monday first)'}.`,
      correct: idx.map((i) => list[i] as string),
      direction: ['earliest', 'latest'],
      hint: months ? 'Januar, Februar, März... Many look like the English months.' : 'German weeks start on Montag. Mittwoch is the middle of the week.',
      explanation: idx.map((i) => `${list[i]} (${months ? MONTHS_EN[i] : DAYS_EN[i]})`).join(', '),
    })
  }),

  G('top.cal.read-date', 'vocab.calendar', [2, 3], (rng) => {
    const day = rng.int(1, 28)
    const m = rng.int(0, 11)
    const wrong: Wrong[] = []
    const sw = swapDigits(day)
    if (sw && sw <= 28) wrong.push({ label: `${sw} ${MONTHS_EN[m]}`, misconception: 'number-order', feedback: 'Units first: einundzwanzig = 21.' })
    const zz = zehnZig(day)
    if (zz && zz <= 28) wrong.push(`${zz} ${MONTHS_EN[m]}`)
    wrong.push(`${day} ${MONTHS_EN[(m + 1) % 12]}`, `${day === 28 ? 27 : day + 1} ${MONTHS_EN[m]}`, `${day} ${MONTHS_EN[(m + 11) % 12]}`)
    return choice({
      rng,
      prompt: `Mein Geburtstag ist ${amDate(day, m)}. When is the birthday?`,
      correct: `${day} ${MONTHS_EN[m]}`,
      wrong: wrong.slice(0, 3),
      hint: 'Take off the ending (-ten or -sten) to find the number.',
      explanation: `${amDate(day, m)} = on the ${day}${day === 1 || day === 21 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th'} of ${MONTHS_EN[m]}. ${ORD_RULE}`,
    })
  }),

  G('top.cal.say-date', 'vocab.calendar', [3, 4], (rng) => {
    const day = rng.pick([1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 16, 17, 19, 20, 21, 23, 25, 27, 30])
    const m = day > 28 ? rng.pick([0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) : rng.int(0, 11)
    const month = MONTHS[m] as string
    return choice({
      rng,
      prompt: `How do you say "on the ${day}${day === 1 || day === 21 ? 'st' : day === 2 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th'} of ${MONTHS_EN[m]}" in German?`,
      correct: amDate(day, m),
      wrong: wrongOrdinal(day).slice(0, 3).map((w) => (typeof w === 'string' ? `am ${w} ${month}` : { ...w, label: `am ${w.label} ${month}` })),
      hint: 'Dates use "am" + an ordinal number ending in -en.',
      explanation: `${amDate(day, m)}. ${ORD_RULE}`,
    })
  }),

  G('top.cal.type-date', 'vocab.calendar', [4, 5], (rng) => {
    const day = rng.int(1, 28)
    const m = rng.int(0, 11)
    const word = `${ordStem(day)}en`
    return textItem({
      prompt: `Type the missing word:  Mein Geburtstag ist am ___ ${MONTHS[m]}.  (My birthday is on ${day} ${MONTHS_EN[m]}.)`,
      accept: accepts(word, ...(day === 7 ? ['siebenten'] : [])),
      placeholder: 'Type the number word',
      hint: day < 20 ? 'Number + -ten (watch out for the irregular ones).' : 'Number + -sten.',
      explanation: `am ${word} ${MONTHS[m]}. ${ORD_RULE}${keyboardTip(word)}`,
    })
  }),
]

// ------------------------------------------------------------------ clock

const hourWord = (h: number) => (h === 1 ? 'eins' : (ONES[h] as string))
const nextH = (h: number) => (h % 12) + 1
const prevH = (h: number) => ((h + 10) % 12) + 1

/** Spoken time, 12-hour: 2:30 -> halb drei. */
export function timeDe(h: number, m: number): string {
  switch (m) {
    case 0:
      return `${h === 1 ? 'ein' : hourWord(h)} Uhr`
    case 15:
      return `Viertel nach ${hourWord(h)}`
    case 25:
      return `fünf vor halb ${hourWord(nextH(h))}`
    case 30:
      return `halb ${hourWord(nextH(h))}`
    case 35:
      return `fünf nach halb ${hourWord(nextH(h))}`
    case 45:
      return `Viertel vor ${hourWord(nextH(h))}`
    default:
      return m < 30 ? `${numDe(m)} nach ${hourWord(h)}` : `${numDe(60 - m)} vor ${hourWord(nextH(h))}`
  }
}
/** Other correct ways of saying the same time. */
function timeAlts(h: number, m: number): string[] {
  if (m === 0 && h === 1) return ['eins']
  if (m === 20) return [`zehn vor halb ${hourWord(nextH(h))}`]
  if (m === 40) return [`zehn nach halb ${hourWord(nextH(h))}`]
  return []
}
const digital = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`
const ALL_MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

function minutesFor(rng: Rng, d: number): number {
  if (d <= 1) return rng.pick([0, 30])
  if (d === 2) return rng.pick([0, 15, 30, 45])
  if (d === 3) return rng.pick([0, 5, 10, 15, 30, 45, 50, 55, 30])
  return rng.pick(ALL_MINUTES)
}

const CLOCK_RULE = 'nach = past, vor = to, Viertel = quarter, and halb looks forward to the next hour: halb drei = half way to three = 2:30.'

/** Wrong times that come from real slips. */
function clockWrongs(h: number, m: number): { t: [number, number]; why?: string }[] {
  const out: { t: [number, number]; why?: string }[] = []
  if (m >= 25 && m <= 35) out.push({ t: [nextH(h), m], why: 'halb means half way TO the next hour: halb drei = 2:30, not 3:30.' })
  if (m > 0 && m < 30 && m !== 25) out.push({ t: [prevH(h), 60 - m], why: 'nach means past (after the hour); vor means to (before the hour).' })
  if (m > 30 && m !== 35) out.push({ t: [nextH(h), 60 - m], why: 'vor means to (before the hour); nach means past.' })
  out.push({ t: [nextH(h), m] }, { t: [prevH(h), m] }, { t: [h, (m + 15) % 60] }, { t: [h, m === 0 ? 30 : 0] })
  return out.filter((w) => !(w.t[0] === h && w.t[1] === m))
}

const clockGens: ItemGenerator[] = [
  G('top.clock.read', 'vocab.clock', [1, 3], (rng, d) => {
    const h = rng.int(1, 12)
    const m = minutesFor(rng, d)
    const wrong: Wrong[] = []
    const seen = new Set([digital(h, m)])
    for (const w of clockWrongs(h, m)) {
      const label = digital(w.t[0], w.t[1])
      if (seen.has(label) || wrong.length >= 3) continue
      seen.add(label)
      wrong.push(w.why ? { label, misconception: 'time-phrase', feedback: w.why } : label)
    }
    return choice({
      rng,
      prompt: `Es ist ${timeDe(h, m)}. What time is it?`,
      correct: digital(h, m),
      wrong,
      hint: m === 30 || m === 25 || m === 35 ? 'halb looks forward to the NEXT hour.' : 'nach = past, vor = to.',
      explanation: `${cap(timeDe(h, m))} = ${digital(h, m)}. ${CLOCK_RULE}`,
    })
  }),

  G('top.clock.say', 'vocab.clock', [2, 4], (rng, d) => {
    const h = rng.int(1, 12)
    const m = minutesFor(rng, d + 1)
    const wrong: Wrong[] = []
    const seen = new Set([timeDe(h, m)])
    for (const w of clockWrongs(h, m)) {
      const label = timeDe(w.t[0], w.t[1])
      if (seen.has(label) || wrong.length >= 3) continue
      seen.add(label)
      wrong.push(w.why ? { label, misconception: 'time-phrase', feedback: w.why } : label)
    }
    return choice({
      rng,
      prompt: `How do you say ${digital(h, m)} in German?  Es ist ...`,
      correct: timeDe(h, m),
      wrong,
      hint: m >= 25 && m <= 35 ? 'Around half past, Germans count from halb + the next hour.' : m > 30 ? 'After half past, count back from the next hour with vor.' : 'Up to quarter past, use nach + this hour.',
      explanation: `${digital(h, m)} = ${timeDe(h, m)}. ${CLOCK_RULE}`,
    })
  }),

  G('top.clock.write', 'vocab.clock', [3, 5], (rng, d) => {
    if (d >= 5 && rng.chance(0.5)) {
      const h = rng.int(13, 22)
      const m = rng.pick([5, 10, 15, 20, 25, 30, 35, 40, 45, 50])
      const ans = `${numDe(h)} Uhr ${numDe(m)}`
      return textItem({
        prompt: `The train leaves at ${h}:${String(m).padStart(2, '0')}. Write the time in words, the way a station announcement says it (24-hour clock).`,
        accept: accepts(ans, `um ${ans}`),
        placeholder: 'e.g. neunzehn Uhr zehn',
        hint: 'Announcements say the hour, then Uhr, then the minutes.',
        explanation: `${h}:${String(m).padStart(2, '0')} = ${ans}. With the 24-hour clock you say the hour, "Uhr", then the minutes.${keyboardTip(ans)}`,
      })
    }
    const h = rng.int(1, 12)
    const m = d <= 3 ? rng.pick([0, 15, 30, 45]) : rng.pick(ALL_MINUTES)
    const ans = timeDe(h, m)
    const forms = [ans, ...timeAlts(h, m)]
    return textItem({
      prompt: `Write ${digital(h, m)} in German, the everyday way.  Es ist ...`,
      accept: accepts(...forms, ...forms.map((f) => `Es ist ${f}`)),
      placeholder: 'Type the time in words',
      hint: m === 30 ? 'halb + the NEXT hour.' : m === 0 ? 'The hour + Uhr.' : m < 30 ? 'Minutes + nach + this hour.' : 'Minutes + vor + the next hour.',
      explanation: `${digital(h, m)} = ${ans}.${forms.length > 1 ? ` (You can also say ${forms.slice(1).join(' / ')}.)` : ''} ${CLOCK_RULE}${keyboardTip(ans)}`,
    })
  }),

  G('top.clock.24h', 'vocab.clock', [3, 5], (rng, d) => {
    const h = rng.int(13, 22)
    const m = rng.pick([0, 10, 15, 20, 30, 40, 45, 50])
    const what = rng.pick([
      { de: 'Der Film beginnt', en: 'the film start' },
      { de: 'Der Zug fährt', en: 'the train leave' },
      { de: 'Das Konzert beginnt', en: 'the concert start' },
      { de: 'Das Spiel beginnt', en: 'the match start' },
      { de: 'Der Bus kommt', en: 'the bus come' },
    ])
    const spoken = m === 0 ? `${numDe(h)} Uhr` : `${numDe(h)} Uhr ${numDe(m)}`
    const pm = (x: number, mm: number) => `${x - 12}:${String(mm).padStart(2, '0')} pm`
    const wrong: Wrong[] = [
      { label: `${h - 12}:${String(m).padStart(2, '0')} am`, misconception: '24-hour', feedback: 'Hours after 12 are in the afternoon or evening.' },
    ]
    if (d >= 4) {
      const sw = swapDigits(h)
      if (sw && sw > 12 && sw < 24) wrong.push({ label: pm(sw, m), misconception: 'number-order', feedback: 'Units first: einundzwanzig = 21.' })
      if (m >= 21 && m % 10) wrong.push(pm(h, (m % 10) * 10 + Math.floor(m / 10)))
    }
    wrong.push(pm(h - 2, m), pm(h, (m + 30) % 60), pm(h + 1, m))
    return choice({
      rng,
      prompt: `${what.de} um ${spoken}. When does ${what.en}?`,
      correct: pm(h, m),
      wrong: wrong.slice(0, 3),
      hint: 'Take 12 from the hour to get the afternoon or evening time.',
      explanation: `${spoken} = ${h}:${String(m).padStart(2, '0')} = ${pm(h, m)}. Timetables, TV guides and cinemas in German-speaking countries use the 24-hour clock.`,
    })
  }),
]

export const numbersTimeGenerators: ItemGenerator[] = [...numberGens, ...calendarGens, ...clockGens]
