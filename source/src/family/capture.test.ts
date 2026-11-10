import { describe, expect, it } from 'vitest'
import { activePart, eventEnd, fieldOf, parseCapture, parseLength, parseWhen, setField, startField, suggestions, type CaptureCtx } from './capture'

// Tuesday 10 November 2026
const TODAY = '2026-11-10'
const ctx: CaptureCtx = {
  today: TODAY,
  meId: 'mum',
  members: [
    { id: 'mum', name: 'Mum', role: 'parent' },
    { id: 'dad', name: 'Dad', role: 'parent' },
    { id: 'maya', name: 'Maya', role: 'child' },
    { id: 'sam', name: 'Sam', role: 'child' },
  ],
  places: ["Bill's Bangers", 'School', 'Home'],
  areas: ['Admin', 'Garden'],
  recipes: [{ id: 'r1', title: 'Spag bol' }],
}

describe('parseWhen', () => {
  it('reads the example from the brief: 115 thurs', () => {
    expect(parseWhen('115 thurs', TODAY)).toMatchObject({ date: '2026-11-12', start: '13:15', rest: '' })
  })
  it('reads common shapes', () => {
    expect(parseWhen('1:15 thu', TODAY)).toMatchObject({ date: '2026-11-12', start: '13:15' })
    expect(parseWhen('tomorrow 6pm', TODAY)).toMatchObject({ date: '2026-11-11', start: '18:00' })
    expect(parseWhen('9am', TODAY)).toMatchObject({ date: undefined, start: '09:00' })
    expect(parseWhen('9', TODAY)).toMatchObject({ start: '09:00' })
    expect(parseWhen('19:30', TODAY)).toMatchObject({ start: '19:30' })
    expect(parseWhen('1930', TODAY)).toMatchObject({ start: '19:30' })
    expect(parseWhen('0930', TODAY)).toMatchObject({ start: '09:30' })
    expect(parseWhen('tues', TODAY)).toMatchObject({ date: TODAY })
    expect(parseWhen('next fri', TODAY)).toMatchObject({ date: '2026-11-20' })
    expect(parseWhen('fri', TODAY)).toMatchObject({ date: '2026-11-13' })
    expect(parseWhen('mon', TODAY)).toMatchObject({ date: '2026-11-16' })
    expect(parseWhen('12/11', TODAY)).toMatchObject({ date: '2026-11-12' })
    expect(parseWhen('1/2', TODAY)).toMatchObject({ date: '2027-02-01' })
    expect(parseWhen('14 nov 7pm', TODAY)).toMatchObject({ date: '2026-11-14', start: '19:00' })
    expect(parseWhen('3rd december', TODAY)).toMatchObject({ date: '2026-12-03' })
    expect(parseWhen('tonight', TODAY)).toMatchObject({ date: TODAY, start: '19:00' })
    expect(parseWhen('tonight 8pm', TODAY)).toMatchObject({ date: TODAY, start: '20:00' })
    expect(parseWhen('in 3 days', TODAY)).toMatchObject({ date: '2026-11-13' })
    expect(parseWhen('noon sat', TODAY)).toMatchObject({ date: '2026-11-14', start: '12:00' })
    expect(parseWhen('at 3 on wed', TODAY)).toMatchObject({ date: '2026-11-11', start: '15:00', rest: '' })
  })
  it('reads ranges', () => {
    expect(parseWhen('9-11am sat', TODAY)).toMatchObject({ date: '2026-11-14', start: '09:00', end: '11:00' })
    expect(parseWhen('6-8pm', TODAY)).toMatchObject({ start: '18:00', end: '20:00' })
    expect(parseWhen('11 to 1', TODAY)).toMatchObject({ start: '11:00', end: '13:00' })
  })
  it('leaves what it does not understand', () => {
    expect(parseWhen('whenever really', TODAY).rest).toBe('whenever really')
    expect(parseWhen('fri blah', TODAY)).toMatchObject({ date: '2026-11-13', rest: 'blah' })
  })
})

describe('fieldOf', () => {
  it('finds field names, with or without a space', () => {
    expect(fieldOf('time115 thurs')).toEqual({ key: 'when', value: '115 thurs' })
    expect(fieldOf('@ bills bangers')).toEqual({ key: 'where', value: 'bills bangers' })
    expect(fieldOf('@school')).toEqual({ key: 'where', value: 'school' })
    expect(fieldOf('note: bring logbook')).toEqual({ key: 'notes', value: 'bring logbook' })
    expect(fieldOf('#errands')).toEqual({ key: 'list', value: 'errands' })
    expect(fieldOf('thurs')).toEqual({ value: 'thurs' })
    expect(fieldOf('timeless')).toEqual({ value: 'timeless' })
  })
})

describe('parseLength', () => {
  it('reads durations', () => {
    expect(parseLength('1h')).toBe(60)
    expect(parseLength('1h30')).toBe(90)
    expect(parseLength('90m')).toBe(90)
    expect(parseLength('45 mins')).toBe(45)
    expect(parseLength('half an hour')).toBe(30)
    expect(parseLength('1.5 hours')).toBe(90)
    expect(parseLength('soon')).toBeUndefined()
  })
})

describe('parseCapture', () => {
  it('reads the brief example as an event', () => {
    const c = parseCapture("service car\\time115 thurs\\@ bills bangers", ctx)
    expect(c.title).toBe('service car')
    expect(c.kind).toBe('event')
    expect(c.kindFrom).toBe('guessed')
    expect(c.values).toMatchObject({ date: '2026-11-12', start: '13:15', where: "Bill's Bangers" })
    expect(c.fields.map((f) => [f.key, f.ok])).toEqual([
      ['when', true],
      ['where', true],
    ])
    expect(eventEnd(c.values)).toBe('14:15')
  })
  it('works out un-named parts from their value', () => {
    const c = parseCapture('swimming\\sat 9-10am\\Maya and Sam\\School\\bring goggles', ctx)
    expect(c.kind).toBe('event')
    expect(c.values).toMatchObject({ date: '2026-11-14', start: '09:00', end: '10:00', who: ['maya', 'sam'], where: 'School', notes: 'bring goggles' })
  })
  it('guesses meals, tasks and brain dump', () => {
    const meal = parseCapture('spag bol\\thurs\\dinner\\cook dad', ctx)
    expect(meal.kind).toBe('meal')
    expect(meal.values).toMatchObject({ date: '2026-11-12', slot: 'dinner', cookId: 'dad', recipeId: 'r1' })
    expect(parseCapture('bins out\\with Sam\\tues', ctx).kind).toBe('task')
    const dump = parseCapture('renew passport\\# admin\\! high', ctx)
    expect(dump.kind).toBe('dump')
    expect(dump.values).toMatchObject({ list: 'Admin', priority: 'high' })
    expect(parseCapture('just a thought', ctx).kind).toBe('dump')
  })
  it('"for" is a length or a person', () => {
    expect(parseCapture('x\\for 2h', ctx).values.minutes).toBe(120)
    expect(parseCapture('x\\for maya', ctx).values.who).toEqual(['maya'])
  })
  it('a typed kind wins over a picked one, a picked one over a guess', () => {
    expect(parseCapture('x\\tomorrow 6pm', ctx, 'task').kind).toBe('task')
    expect(parseCapture('x\\tomorrow 6pm\\is meal', ctx, 'task')).toMatchObject({ kind: 'meal', kindFrom: 'typed' })
  })
  it('respects the kinds allowed', () => {
    expect(parseCapture('just a thought', ctx, undefined, ['event', 'task']).kind).toBe('task')
  })
  it('keeps what it cannot read as a note or marks it', () => {
    const c = parseCapture('x\\with Zed', ctx)
    expect(c.fields[0]).toMatchObject({ key: 'who', ok: false })
    expect(parseCapture('x\\random words', ctx).values.notes).toBe('random words')
  })
  it('guesses a meal slot from its time', () => {
    expect(parseCapture('porridge\\is meal\\tomorrow 8am', ctx).values.slot).toBe('breakfast')
  })
})

describe('suggestions and editing', () => {
  it('suggests the next missing field for the kind', () => {
    const c = parseCapture("service car\\time115 thurs\\@ bills bangers", ctx)
    expect(suggestions(c, ctx).map((s) => s.key)).toEqual(['who', 'length', 'notes'])
    expect(suggestions(parseCapture('service car', ctx, 'event'), ctx)[0]!.key).toBe('when')
  })
  it('setField adds, replaces and completes parts', () => {
    expect(setField('service car', 'when', 'thu 1:15pm', ctx, 'event')).toBe('service car\\time thu 1:15pm')
    expect(setField('service car\\time fri', 'when', 'thu', ctx, 'event')).toBe('service car\\time thu')
    expect(setField('service car\\', 'where', "Bill's Bangers", ctx, 'event')).toBe("service car\\@ Bill's Bangers")
    expect(setField('service car\\wh', 'where', 'School', ctx, 'event')).toBe('service car\\@ School')
    expect(setField('swim\\with Maya', 'who', 'Sam', ctx, 'event')).toBe('swim\\with Maya and Sam')
    expect(setField('swim\\with Maya\\sat', 'who', 'Maya', ctx, 'event')).toBe('swim\\with Maya\\sat')
    expect(setField('swim\\thu', 'when', 'Thu', ctx, 'event')).toBe('swim\\time Thu')
  })
  it('startField opens a part ready to type', () => {
    expect(startField('service car', 'where')).toBe('service car\\@ ')
    expect(startField('service car\\', 'notes')).toBe('service car\\note ')
  })
  it('activePart tells which field is being typed', () => {
    expect(activePart('service car', ctx)).toBeUndefined()
    expect(activePart('service car\\@ bi', ctx)).toMatchObject({ key: 'where', value: 'bi' })
    expect(activePart('service car\\thurs', ctx)).toMatchObject({ key: 'when' })
  })
})

describe('event time follow-up', () => {
  it('asks for a time after a day, keeping the day', () => {
    const c = parseCapture('service car\\time tomorrow\\', ctx, 'event')
    const s = suggestions(c, ctx)[0]!
    expect(s.question).toMatch(/time/i)
    const next = setField('service car\\time tomorrow\\', 'when', s.options.find((o) => o.label === '6pm')!.value, ctx, 'event')
    expect(next).toBe('service car\\time tomorrow 6pm')
    expect(parseCapture(next, ctx).values).toMatchObject({ date: '2026-11-11', start: '18:00' })
  })
})
