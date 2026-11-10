/**
 * Quick capture: one line of text, split into fields with a backslash.
 *
 *   service car\time 1:15 thurs\@ Bill's Bangers
 *   ^ title     ^ field "time"   ^ field "@" (where)
 *
 * The first part is always the title. Every part after a `\` is one field: it can start with the field's name
 * ("time", "@", "with", "note"...) or just be a value whose kind is obvious ("thurs 6pm", "Maya", "dinner"). Anything
 * that can't be placed becomes a note, so nothing typed is ever lost.
 *
 * The same text drives the screen: the app shows what each part was read as, suggests the next field to fill in for
 * the kind of thing being added, and tapping a suggestion writes the field into the text (so the typed form is always
 * visible and can be learnt). Pure functions only, so it can be unit tested.
 */
import { DEFAULT_AREAS } from './dump'
import { addDays, dayName, dayOfMonth, fromMin, monthName, startOfWeek, toMin, weekday } from './dates'
import type { DumpPriority, Hm, MealSlot, MemberId, Ymd } from './types'

export type CaptureKind = 'event' | 'task' | 'meal' | 'dump'
export type FieldKey = 'kind' | 'when' | 'where' | 'who' | 'length' | 'notes' | 'list' | 'priority' | 'slot' | 'cook' | 'serves'

export interface CaptureCtx {
  today: Ymd
  meId: MemberId
  /** People who can be named (parents and children). */
  members: readonly { id: MemberId; name: string; role?: string }[]
  /** Saved place names, for "@" matching. */
  places: readonly string[]
  /** Brain-dump list names in use. */
  areas: readonly string[]
  recipes: readonly { id: string; title: string }[]
}

export const KIND_INFO: Record<CaptureKind, { label: string; emoji: string; example: string; save: string }> = {
  event: { label: 'Event', emoji: '📅', example: "service car\\time 1:15 thurs\\@ Bill's Bangers", save: 'Add to calendar' },
  task: { label: 'Task', emoji: '✅', example: 'bins out\\with Sam\\time tues 7pm', save: 'Add task' },
  meal: { label: 'Meal', emoji: '🍽️', example: 'spag bol\\thurs\\meal dinner\\cook Dad', save: 'Plan meal' },
  dump: { label: 'Brain dump', emoji: '🧠', example: 'renew passport\\# Admin\\! high', save: 'Add to brain dump' },
}

interface FieldDef {
  label: string
  /** What gets written when the field is added from the screen. */
  prefix: string
  /** Word names (matched at the start of a part, followed by a space, ':', '=', a digit or the end). */
  words: string[]
  /** One-character names (matched at the start of a part, with or without a space after). */
  symbols?: string[]
  example: string
  question: string
}

export const FIELDS: Record<FieldKey, FieldDef> = {
  kind: { label: 'Type', prefix: 'is ', words: ['is', 'type', 'kind'], example: 'is meal', question: 'What is it?' },
  when: { label: 'When', prefix: 'time ', words: ['time', 'when', 'date', 'day', 'on', 'at', 'due', 'starts'], example: 'time 1:15 thurs', question: 'When is it?' },
  where: { label: 'Where', prefix: '@ ', words: ['where', 'place', 'loc', 'location', 'in'], symbols: ['@'], example: "@ Bill's Bangers", question: 'Where is it?' },
  who: { label: 'Who', prefix: 'with ', words: ['with', 'who', 'for', 'by', 'owner', 'assign'], symbols: ['+'], example: 'with Maya', question: 'Who is it for?' },
  length: { label: 'How long', prefix: 'for ', words: ['long', 'length', 'dur', 'duration', 'mins', 'takes'], symbols: ['~'], example: 'for 1h', question: 'How long will it take?' },
  notes: { label: 'Notes', prefix: 'note ', words: ['note', 'notes', 'desc', 'details', 'detail', 'info'], example: 'note bring the logbook', question: 'Anything to remember?' },
  list: { label: 'List', prefix: '# ', words: ['list', 'area'], symbols: ['#'], example: '# Errands', question: 'Which list?' },
  priority: { label: 'Priority', prefix: '! ', words: ['priority', 'pri'], symbols: ['!'], example: '! high', question: 'How much does it matter?' },
  slot: { label: 'Meal', prefix: 'meal ', words: ['meal', 'slot'], example: 'meal dinner', question: 'Which meal?' },
  cook: { label: 'Cook', prefix: 'cook ', words: ['cook', 'chef', 'cooks'], example: 'cook Dad', question: 'Who is cooking?' },
  serves: { label: 'Serves', prefix: 'serves ', words: ['serves', 'servings', 'people'], example: 'serves 4', question: 'How many people?' },
}

/** The fields that matter for each kind, in the order they are suggested. */
export const KIND_FIELDS: Record<CaptureKind, FieldKey[]> = {
  event: ['when', 'where', 'who', 'length', 'notes'],
  task: ['who', 'when', 'length', 'notes'],
  meal: ['when', 'slot', 'cook', 'serves', 'notes'],
  dump: ['list', 'priority', 'who', 'length', 'notes'],
}

// ------------------------------------------------------------------ splitting

export interface Segment {
  /** The part as typed, without the backslash. */
  raw: string
  /** Where the part starts in the text (after its backslash). */
  start: number
}

export function segments(text: string): Segment[] {
  const out: Segment[] = []
  let start = 0
  for (let i = 0; i <= text.length; i++) {
    if (i === text.length || text[i] === '\\') {
      out.push({ raw: text.slice(start, i), start })
      start = i + 1
    }
  }
  return out
}

/** Which field a part names, and the value after the name. */
export function fieldOf(raw: string): { key?: FieldKey; value: string } {
  const s = raw.trimStart()
  for (const [key, def] of Object.entries(FIELDS) as [FieldKey, FieldDef][]) {
    for (const sym of def.symbols ?? []) if (s.startsWith(sym)) return { key, value: s.slice(sym.length).trim() }
  }
  const m = /^([a-z]+)(?=$|[\s:=\d])\s*[:=]?\s*/i.exec(s)
  if (m) {
    const word = m[1]!.toLowerCase()
    for (const [key, def] of Object.entries(FIELDS) as [FieldKey, FieldDef][]) if (def.words.includes(word)) return { key, value: s.slice(m[0].length).trim() }
  }
  return { value: s.trim() }
}

// ------------------------------------------------------------------ values

const WEEKDAYS: [RegExp, number][] = [
  [/^mon(day)?$/, 0],
  [/^tue(s|sday)?$/, 1],
  [/^wed(s|nesday)?$/, 2],
  [/^thu(r|rs|rsday)?$/, 3],
  [/^fri(day)?$/, 4],
  [/^sat(urday)?$/, 5],
  [/^sun(day)?$/, 6],
]
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const monthIndex = (w: string): number => (w.length >= 3 ? MONTHS.findIndex((m) => w.startsWith(m)) : -1)

const pad = (n: number) => String(n).padStart(2, '0')

export interface When {
  date?: Ymd
  start?: Hm
  end?: Hm
  /** Words that were not understood. */
  rest: string
}

/**
 * Read "1:15 thurs", "115 thu", "tomorrow 6pm", "next fri 9-11am", "12/11", "14 nov 19:30", "tonight", "in 3 days".
 * A time without am/pm is read the way people say it at home: 1 to 6 is the afternoon, 7 to 11 the morning.
 */
export function parseWhen(input: string, today: Ymd): When {
  let s = ` ${input.toLowerCase().replace(/,/g, ' ').replace(/\s+/g, ' ')} `
  let date: Ymd | undefined
  let start: Hm | undefined
  let end: Hm | undefined
  /** Try each match of `re` in turn; the first one `fn` accepts is taken out of the text. */
  const take = (re: RegExp, fn: (m: RegExpExecArray) => boolean | void) => {
    const g = new RegExp(re.source, 'g')
    for (let m = g.exec(s); m; m = g.exec(s)) {
      if (fn(m) !== false) {
        s = `${s.slice(0, m.index)} ${s.slice(m.index + m[0].length)}`
        return
      }
      g.lastIndex = m.index + 1
    }
  }

  // dates: 12/11, 12/11/26, 12-11-2026
  take(/\s(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?(?=\s)/, (m) => {
    const d = Number(m[1])
    const mo = Number(m[2])
    if (d < 1 || d > 31 || mo < 1 || mo > 12) return false
    const y = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : Number(today.slice(0, 4))
    let ymd = `${y}-${pad(mo)}-${pad(d)}`
    if (!m[3] && ymd < today) ymd = `${y + 1}-${pad(mo)}-${pad(d)}`
    date = ymd
  })
  // 14 nov, 14th november, nov 14
  if (!date)
    take(/\s(?:(\d{1,2})(?:st|nd|rd|th)?\s([a-z]{3,9})|([a-z]{3,9})\s(\d{1,2})(?:st|nd|rd|th)?)(?=\s)/, (m) => {
      const d = Number(m[1] ?? m[4])
      const mo = monthIndex(m[2] ?? m[3] ?? '')
      if (mo < 0 || d < 1 || d > 31) return false
      const y = Number(today.slice(0, 4))
      let ymd = `${y}-${pad(mo + 1)}-${pad(d)}`
      if (ymd < today) ymd = `${y + 1}-${pad(mo + 1)}-${pad(d)}`
      date = ymd
    })
  if (!date) take(/\s(today|tod|tonight|tonite)(?=\s)/, (m) => {
    date = today
    if (m[1]!.startsWith('toni')) start = '19:00'
  })
  if (!date) take(/\s(tomorrow|tomoz|tmrw|tmr|tom)(?=\s)/, () => void (date = addDays(today, 1)))
  if (!date) take(/\sin\s(\d+|a|an|one|two)\s(day|days|week|weeks)(?=\s)/, (m) => {
    const n = /^\d+$/.test(m[1]!) ? Number(m[1]) : m[1] === 'two' ? 2 : 1
    date = addDays(today, m[2]!.startsWith('week') ? n * 7 : n)
  })
  if (!date) take(/\s(?:(next|this)\s)?(weekend|[a-z]{3,9})(?=\s)/, (m) => {
    const w = m[2] === 'weekend' ? 5 : (WEEKDAYS.find(([re]) => re.test(m[2]!))?.[1] ?? -1)
    if (w < 0) return false
    if (m[1] === 'next') date = addDays(startOfWeek(today), 7 + w)
    else {
      const diff = (w - weekday(today) + 7) % 7
      date = addDays(today, diff)
    }
  })
  if (!date) take(/\snext\sweek(?=\s)/, () => void (date = addDays(startOfWeek(today), 7)))

  // times
  const hm = (h: number, min: number, ap?: string, guess = true): Hm | undefined => {
    if (min > 59) return undefined
    if (ap) {
      if (h < 1 || h > 12) return undefined
      if (ap.startsWith('p') && h < 12) h += 12
      if (ap.startsWith('a') && h === 12) h = 0
    } else if (guess && h >= 1 && h <= 6) h += 12
    if (h > 23) return undefined
    return `${pad(h)}:${pad(min)}`
  }
  const T = '(\\d{1,2})(?:[:.](\\d{2}))?\\s?(am|pm|a\\.m\\.|p\\.m\\.)?'
  take(new RegExp(`\\s(?:from\\s)?${T}\\s?(?:-|–|to|till|until)\\s?${T}(?=\\s)`), (m) => {
    const ap2 = m[6]
    const ap1 = m[3] ?? (ap2 && Number(m[1]) <= Number(m[4]) ? ap2 : undefined)
    const a = hm(Number(m[1]), Number(m[2] ?? 0), ap1)
    let b = hm(Number(m[4]), Number(m[5] ?? 0), ap2)
    if (!a || !b) return false
    if (b <= a && !ap2 && Number(m[4]) < 12) b = hm(Number(m[4]) + 12, Number(m[5] ?? 0), undefined, false)
    if (!b || b <= a) return false
    start = a
    end = b
  })
  if (!start || (start === '19:00' && !end)) {
    const before = start
    take(/\s(noon|midday|midnight)(?=\s)/, (m) => void (start = m[1] === 'midnight' ? '00:00' : '12:00'))
    if (start === before) take(new RegExp(`\\s(?:at\\s)?${T}(?=\\s)`), (m) => {
      const raw = m[1]!
      if (!m[2] && !m[3] && raw.length > 2) return false
      const leading0 = raw.length === 2 && raw.startsWith('0')
      const t = hm(Number(raw), Number(m[2] ?? 0), m[3], !leading0)
      if (!t) return false
      start = t
    })
    // 115, 0930, 1930: three or four digits as a clock time
    if (start === before) take(/\s(?:at\s)?(\d{3,4})(?=\s)/, (m) => {
      const n = m[1]!
      const h = Number(n.slice(0, n.length - 2))
      const min = Number(n.slice(-2))
      const t = hm(h, min, undefined, !(n.length === 4 && (n.startsWith('0') || h >= 13)))
      if (!t) return false
      start = t
    })
    if (start === before && !start) take(/\s(morning|afternoon|evening|lunchtime|teatime)(?=\s)/, (m) => {
      start = { morning: '09:00', afternoon: '14:00', evening: '18:00', lunchtime: '12:30', teatime: '17:30' }[m[1]!] as Hm
    })
  }
  const rest = s.replace(/\b(at|on|from|the|of|this)\b/g, ' ').replace(/\s+/g, ' ').trim()
  return { date, start, end, rest }
}

/** "1h", "90m", "1h30", "45 mins", "half an hour", "an hour", "2 hours" -> minutes. */
export function parseLength(input: string): number | undefined {
  const s = input.toLowerCase().trim()
  if (/^half an? hour$/.test(s)) return 30
  if (/^an? hour$/.test(s)) return 60
  let m = /^(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\s*(?:(\d+)\s*(?:m|min|mins|minutes)?)?$/.exec(s)
  if (m) return Math.round(Number(m[1]) * 60 + Number(m[2] ?? 0)) || undefined
  m = /^(\d+)\s*(?:m|min|mins|minute|minutes)?$/.exec(s)
  if (m) return Number(m[1]) || undefined
  return undefined
}

const norm = (s: string) => s.toLowerCase().replace(/[’']/g, '').replace(/\s+/g, ' ').trim()

/** Members named in "Maya", "Maya and Sam", "me", "everyone". */
export function parseWho(input: string, ctx: CaptureCtx): { ids: MemberId[]; everyone: boolean; unknown: string[] } {
  const ids: MemberId[] = []
  const unknown: string[] = []
  let everyone = false
  for (const part of input.split(/,|&|\+|\band\b/i)) {
    const p = norm(part)
    if (!p) continue
    if (/^(everyone|everybody|all|family|the family|us|all of us)$/.test(p)) {
      everyone = true
      continue
    }
    const hit =
      p === 'me' || p === 'myself' || p === 'i'
        ? ctx.members.find((m) => m.id === ctx.meId)
        : (ctx.members.find((m) => norm(m.name) === p) ?? ctx.members.find((m) => norm(m.name).split(' ')[0] === p) ?? (p.length >= 2 ? ctx.members.find((m) => norm(m.name).startsWith(p)) : undefined))
    if (hit) {
      if (!ids.includes(hit.id)) ids.push(hit.id)
    } else unknown.push(part.trim())
  }
  return { ids, everyone, unknown }
}

export const matchPlace = (input: string, places: readonly string[]): string | undefined => {
  const p = norm(input)
  if (!p) return undefined
  return places.find((x) => norm(x) === p) ?? (p.length >= 3 ? places.find((x) => norm(x).startsWith(p)) : undefined)
}

const SLOT_WORDS: [RegExp, MealSlot][] = [
  [/^(breakfast|brekkie|brekky)$/, 'breakfast'],
  [/^(lunch|luncheon)$/, 'lunch'],
  [/^(dinner|tea|supper)$/, 'dinner'],
  [/^(snack|snacks)$/, 'snack'],
]
export const parseSlot = (input: string): MealSlot | undefined => SLOT_WORDS.find(([re]) => re.test(norm(input)))?.[1]

const PRIORITY_WORDS: [RegExp, DumpPriority][] = [
  [/^(high|urgent|important|asap|!+|top)$/, 'high'],
  [/^(normal|medium|mid|soon)$/, 'normal'],
  [/^(someday|later|low|whenever|one day)$/, 'someday'],
]
export const parsePriority = (input: string): DumpPriority | undefined => PRIORITY_WORDS.find(([re]) => re.test(norm(input)))?.[1]

const KIND_WORDS: [RegExp, CaptureKind][] = [
  [/^(event|appointment|appt|calendar|cal)$/, 'event'],
  [/^(task|todo|to do|chore|job)$/, 'task'],
  [/^(meal|food|recipe)$/, 'meal'],
  [/^(dump|brain dump|braindump|thought|note to self|idea|backlog)$/, 'dump'],
]
export const parseKind = (input: string): CaptureKind | undefined => KIND_WORDS.find(([re]) => re.test(norm(input)))?.[1]

// ------------------------------------------------------------------ reading a line

export interface ParsedField {
  key: FieldKey
  /** Index of the part in `segments(text)`. */
  seg: number
  raw: string
  value: string
  /** How it was read, for the screen. */
  shown: string
  /** False when the value was not understood (it is still kept). */
  ok: boolean
  /** The field was named in the text (rather than worked out from its value). */
  named: boolean
}

export interface CaptureValues {
  date?: Ymd
  start?: Hm
  end?: Hm
  who: MemberId[]
  everyone: boolean
  where?: string
  minutes?: number
  notes?: string
  list?: string
  priority?: DumpPriority
  slot?: MealSlot
  cookId?: MemberId
  servings?: number
  recipeId?: string
}

export interface Capture {
  title: string
  kind: CaptureKind
  /** How the kind was chosen. */
  kindFrom: 'typed' | 'picked' | 'guessed'
  fields: ParsedField[]
  values: CaptureValues
}

export function whenText(w: Pick<When, 'date' | 'start' | 'end'>, today: Ymd): string {
  const day = w.date ? (w.date === today ? 'Today' : w.date === addDays(today, 1) ? 'Tomorrow' : `${dayName(w.date)} ${dayOfMonth(w.date)} ${monthName(w.date)}`) : ''
  const time = w.start ? `${w.start}${w.end ? `–${w.end}` : ''}` : ''
  return [day, time].filter(Boolean).join(' · ')
}

export const lengthText = (min: number): string => (min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}`)

/** Read one value as `key`. */
function readField(key: FieldKey, value: string, ctx: CaptureCtx): { shown: string; ok: boolean } & Partial<CaptureValues> & { kind?: CaptureKind; who?: MemberId[] } {
  const name = (id: MemberId) => ctx.members.find((m) => m.id === id)?.name ?? '?'
  switch (key) {
    case 'kind': {
      const kind = parseKind(value)
      return kind ? { kind, shown: KIND_INFO[kind].label, ok: true } : { shown: value || '…', ok: false }
    }
    case 'when': {
      const w = parseWhen(value, ctx.today)
      const ok = !!(w.date || w.start) && !w.rest
      const shown = whenText(w, ctx.today) || value || '…'
      return { date: w.date, start: w.start, end: w.end, shown: w.rest && (w.date || w.start) ? `${shown} (not sure about "${w.rest}")` : shown, ok }
    }
    case 'where': {
      const place = matchPlace(value, ctx.places)
      return { where: place ?? value, shown: place ? `${place} (saved place)` : value || '…', ok: !!value }
    }
    case 'who': {
      const w = parseWho(value, ctx)
      const names = [...(w.everyone ? ['Everyone'] : []), ...w.ids.map(name)]
      const shown = [...names, ...w.unknown.map((u) => `"${u}"?`)].join(', ') || value || '…'
      return { who: w.ids, everyone: w.everyone, shown, ok: !w.unknown.length && (w.everyone || w.ids.length > 0) }
    }
    case 'length': {
      const minutes = parseLength(value)
      return minutes && minutes <= 24 * 60 ? { minutes, shown: lengthText(minutes), ok: true } : { shown: value || '…', ok: false }
    }
    case 'notes':
      return { notes: value, shown: value || '…', ok: !!value }
    case 'list': {
      const v = value.replace(/^#/, '').trim()
      const hit = ctx.areas.find((a) => norm(a) === norm(v)) ?? DEFAULT_AREAS.find((a) => norm(a) === norm(v))
      const list = hit ?? v.replace(/^./, (c) => c.toUpperCase())
      return { list: list || undefined, shown: list || '…', ok: !!list }
    }
    case 'priority': {
      const p = value === '' ? 'high' : parsePriority(value)
      return p ? { priority: p, shown: { high: 'High', normal: 'Normal', someday: 'Someday' }[p], ok: true } : { shown: value, ok: false }
    }
    case 'slot': {
      const slot = parseSlot(value)
      return slot ? { slot, shown: slot[0]!.toUpperCase() + slot.slice(1), ok: true } : { shown: value || '…', ok: false }
    }
    case 'cook': {
      const w = parseWho(value, ctx)
      const id = w.ids[0]
      return id ? { cookId: id, shown: name(id), ok: w.unknown.length === 0 } : { shown: value || '…', ok: false }
    }
    case 'serves': {
      const n = Number(/\d+/.exec(value)?.[0])
      return n > 0 && n < 100 ? { servings: n, shown: `${n} ${n === 1 ? 'person' : 'people'}`, ok: true } : { shown: value || '…', ok: false }
    }
  }
}

/** Work out what an un-named part is from its value. */
function guessKey(value: string, ctx: CaptureCtx): FieldKey {
  if (parseKind(value)) return 'kind'
  if (parseSlot(value)) return 'slot'
  if (parseLength(value) && !/^\d+$/.test(value.trim())) return 'length'
  const w = parseWhen(value, ctx.today)
  if ((w.date || w.start) && !w.rest) return 'when'
  if (parsePriority(value) && value.trim().length > 1) return 'priority'
  const who = parseWho(value, ctx)
  if (!who.unknown.length && (who.everyone || who.ids.length)) return 'who'
  if (matchPlace(value, ctx.places)) return 'where'
  return 'notes'
}

/**
 * Read a capture line. `picked` is the kind chosen on screen (a typed "\is meal" wins over it); without either, the kind
 * is guessed from the fields: a meal slot, cook or servings makes a meal; a time or a place an event; a day or a
 * person a task; anything else goes in the brain dump. `allowed` limits the kinds (children have no brain dump).
 */
export function parseCapture(text: string, ctx: CaptureCtx, picked?: CaptureKind, allowed: readonly CaptureKind[] = ['event', 'task', 'meal', 'dump']): Capture {
  const segs = segments(text)
  const title = (segs[0]?.raw ?? '').trim()
  const fields: ParsedField[] = []
  const v: CaptureValues = { who: [], everyone: false }
  let typedKind: CaptureKind | undefined
  const notes: string[] = []

  segs.slice(1).forEach((sg, i) => {
    if (!sg.raw.trim()) return
    const named = fieldOf(sg.raw)
    let key = named.key ?? guessKey(named.value, ctx)
    // "for 2h" is a length, "for Maya" a person
    if (named.key === 'who' && parseLength(named.value)) key = 'length'
    const r = readField(key, named.value, ctx)
    fields.push({ key, seg: i + 1, raw: sg.raw, value: named.value, shown: r.shown, ok: r.ok, named: !!named.key })
    if (key === 'kind' && r.kind) typedKind = r.kind
    if (key === 'when') {
      if (r.date) v.date = r.date
      if (r.start) {
        v.start = r.start
        v.end = r.end
      }
    }
    if (key === 'who') {
      for (const id of r.who ?? []) if (!v.who.includes(id)) v.who.push(id)
      v.everyone ||= !!r.everyone
    }
    if (key === 'where' && r.where) v.where = r.where
    if (key === 'length' && r.minutes) v.minutes = r.minutes
    if (key === 'notes' && r.notes) notes.push(r.notes)
    if (key === 'list' && r.list) v.list = r.list
    if (key === 'priority' && r.priority) v.priority = r.priority
    if (key === 'slot' && r.slot) v.slot = r.slot
    if (key === 'cook' && r.cookId) v.cookId = r.cookId
    if (key === 'serves' && r.servings) v.servings = r.servings
  })
  if (notes.length) v.notes = notes.join('\n')

  const ok = (k: CaptureKind | undefined): k is CaptureKind => !!k && allowed.includes(k)
  let kind: CaptureKind
  let kindFrom: Capture['kindFrom']
  if (ok(typedKind)) [kind, kindFrom] = [typedKind, 'typed']
  else if (ok(picked)) [kind, kindFrom] = [picked, 'picked']
  else {
    const has = (k: FieldKey) => fields.some((f) => f.key === k && f.ok)
    const isRecipe = ctx.recipes.some((r) => norm(r.title) === norm(title))
    const order: CaptureKind[] = [
      ...(has('slot') || has('cook') || has('serves') || isRecipe ? (['meal'] as const) : []),
      ...(v.start || has('where') ? (['event'] as const) : []),
      ...(v.date || (has('who') && !has('list')) ? (['task'] as const) : []),
      'dump',
      'task',
      'event',
    ]
    kind = order.find(ok) ?? allowed[0] ?? 'task'
    kindFrom = 'guessed'
  }

  if (kind === 'meal') {
    const r = ctx.recipes.find((x) => norm(x.title) === norm(title))
    if (r) v.recipeId = r.id
    if (!v.slot && v.start) v.slot = toMin(v.start) < 11 * 60 ? 'breakfast' : toMin(v.start) < 15 * 60 ? 'lunch' : 'dinner'
  }
  return { title, kind, kindFrom, fields, values: v }
}

// ------------------------------------------------------------------ suggesting

export interface FieldOption {
  label: string
  /** The value written after the field's name. */
  value: string
}

export interface Suggestion {
  key: FieldKey
  label: string
  question: string
  example: string
  options: FieldOption[]
}

/** Ready-made values to tap for a field. */
export function optionsFor(key: FieldKey, ctx: CaptureCtx, kind: CaptureKind): FieldOption[] {
  const people = ctx.members.map((m) => ({ label: m.id === ctx.meId ? `${m.name} (me)` : m.name, value: m.name }))
  switch (key) {
    case 'when': {
      const days = [1, 2, 3, 4, 5].map((n) => addDays(ctx.today, n)).slice(1, 5)
      const times = kind === 'meal' ? [] : [{ label: '9am', value: '9am' }, { label: '1:15pm', value: '1:15pm' }, { label: '6pm', value: '6pm' }]
      return [{ label: 'Today', value: 'today' }, { label: 'Tomorrow', value: 'tomorrow' }, ...days.map((d) => ({ label: dayName(d), value: dayName(d).toLowerCase() })), ...(kind === 'event' ? [{ label: 'Tonight 7pm', value: 'tonight 7pm' }] : []), ...times]
    }
    case 'where':
      return ctx.places.slice(0, 8).map((p) => ({ label: p, value: p }))
    case 'who':
      return [...people, ...(kind === 'event' ? [{ label: 'Everyone', value: 'everyone' }] : [])]
    case 'cook':
      return ctx.members.filter((m) => m.role !== 'child').map((m) => ({ label: m.name, value: m.name }))
    case 'length':
      return ['15m', '30m', '1h', '2h'].map((x) => ({ label: x, value: x }))
    case 'list': {
      const names = [...ctx.areas, ...DEFAULT_AREAS.filter((a) => !ctx.areas.some((x) => norm(x) === norm(a)))]
      return names.slice(0, 8).map((a) => ({ label: a, value: a }))
    }
    case 'priority':
      return [{ label: 'High', value: 'high' }, { label: 'Normal', value: 'normal' }, { label: 'Someday', value: 'someday' }]
    case 'slot':
      return [{ label: 'Breakfast', value: 'breakfast' }, { label: 'Lunch', value: 'lunch' }, { label: 'Dinner', value: 'dinner' }, { label: 'Snack', value: 'snack' }]
    case 'serves':
      return ['2', '3', '4', '6'].map((n) => ({ label: n, value: n }))
    case 'kind':
      return (Object.keys(KIND_INFO) as CaptureKind[]).map((k) => ({ label: KIND_INFO[k].label, value: k }))
    case 'notes':
      return []
  }
}

/** The fields still worth asking about for this kind, the most useful first. */
export function suggestions(c: Capture, ctx: CaptureCtx): Suggestion[] {
  const have = new Set(c.fields.filter((f) => f.ok).map((f) => f.key))
  if (c.kind === 'event' && (c.values.everyone || c.values.who.length)) have.add('who')
  if (c.kind === 'meal' && c.values.slot) have.add('slot')
  const out = KIND_FIELDS[c.kind]
    .filter((k) => !have.has(k))
    .map((k) => ({ key: k, label: FIELDS[k].label, question: FIELDS[k].question, example: FIELDS[k].example, options: optionsFor(k, ctx, c.kind) }))
  // An event with a day but no time: ask for the time first, keeping the day that was given.
  const when = c.fields.find((f) => f.key === 'when' && f.ok)
  if (c.kind === 'event' && when && c.values.date && !c.values.start) {
    const times = ['9am', '10:30am', '12pm', '1:15pm', '3:30pm', '6pm', '7:30pm']
    out.unshift({ key: 'when', label: 'Time', question: 'What time? (or leave it all day)', example: `time ${when.value} 1:15pm`, options: times.map((t) => ({ label: t, value: `${when.value} ${t}` })) })
  }
  return out
}

/** The part being typed right now (the last one, after a backslash), and the field it names or is likely to be. */
export function activePart(text: string, ctx: CaptureCtx): { seg: number; key?: FieldKey; value: string; partial: string } | undefined {
  const segs = segments(text)
  if (segs.length < 2) return undefined
  const last = segs[segs.length - 1]!
  const f = fieldOf(last.raw)
  const guess = f.value ? guessKey(f.value, ctx) : undefined
  return { seg: segs.length - 1, key: f.key ?? (guess === 'notes' ? undefined : guess), value: f.value, partial: last.raw.trimStart() }
}

/** Field names that start with what has been typed so far in the last part, for the "which field?" chips. */
export function fieldsMatching(partial: string, kind: CaptureKind): FieldKey[] {
  const p = partial.toLowerCase()
  const keys = [...KIND_FIELDS[kind], 'kind' as const]
  if (!p) return keys
  return keys.filter((k) => FIELDS[k].words.some((w) => w.startsWith(p)) || (FIELDS[k].symbols ?? []).some((s) => p.startsWith(s)))
}

/**
 * Write `key value` into the text: replaces the part already holding that field (or the part being typed, if it is
 * that field or not yet a field), otherwise adds a new part on the end. Returns the new text.
 */
export function setField(text: string, key: FieldKey, value: string, ctx: CaptureCtx, kind?: CaptureKind): string {
  const segs = segments(text)
  const part = `${FIELDS[key].prefix}${value}`
  const c = parseCapture(text, ctx, kind)
  // a part that already holds this field (multi-valued "who" adds to it)
  const existing = c.fields.find((f) => f.key === key)
  const last = segs.length > 1 ? segs[segs.length - 1]! : undefined
  const lastField = last ? fieldOf(last.raw) : undefined
  const partialName = (p: string) => p.length <= 8 && /^[a-z]+$/i.test(p) && guessKey(p, ctx) === 'notes' && Object.values(FIELDS).some((d) => d.words.some((w) => w.startsWith(p.toLowerCase())))
  const lastIsDraft =
    !!last &&
    !!lastField &&
    (!last.raw.trim() || lastField.key === key || (!!lastField.key && !lastField.value) || (!lastField.key && (guessKey(lastField.value, ctx) === key || partialName(lastField.value))))
  const replaceAt = (i: number, with_: string) => {
    const s = segs[i]!
    return `${text.slice(0, s.start)}${with_}${text.slice(s.start + s.raw.length)}`
  }
  // an empty part on the end and the field already written: change the one already there
  if (last && !last.raw.trim() && existing && key !== 'who' && key !== 'notes') {
    const s = segs[existing.seg]!
    return `${text.slice(0, s.start)}${part}${text.slice(s.start + s.raw.length)}`.replace(/\\\s*$/, '')
  }
  if (lastIsDraft && last) {
    if (key === 'who' && lastField?.key === 'who' && lastField.value && !lastField.value.toLowerCase().includes(value.toLowerCase())) return replaceAt(segs.length - 1, `${FIELDS.who.prefix}${lastField.value} and ${value}`)
    return replaceAt(segs.length - 1, part)
  }
  if (existing) {
    if (key === 'who') {
      if (existing.value.toLowerCase().split(/,|&|\band\b/).some((x) => x.trim() === value.toLowerCase())) return text
      return replaceAt(existing.seg, `${FIELDS.who.prefix}${existing.value} and ${value}`)
    }
    if (key !== 'notes') return replaceAt(existing.seg, part)
  }
  return `${text.replace(/\\\s*$/, '')}\\${part}`
}

/** Start a new field on the end, ready for its value to be typed. */
export function startField(text: string, key: FieldKey): string {
  const segs = segments(text)
  const last = segs[segs.length - 1]!
  if (segs.length > 1 && !fieldOf(last.raw).value && !fieldOf(last.raw).key) return `${text.slice(0, last.start)}${FIELDS[key].prefix}`
  return `${text}\\${FIELDS[key].prefix}`
}

// ------------------------------------------------------------------ helpers for saving

/** An event's end: its own end, or start + length, or an hour after the start. */
export function eventEnd(v: CaptureValues): Hm | undefined {
  if (!v.start) return undefined
  if (v.end) return v.end
  return fromMin(Math.min(23 * 60 + 59, toMin(v.start) + (v.minutes ?? 60)))
}

