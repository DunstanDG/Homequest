import { describe, expect, it } from 'vitest'
import { makeRng } from './rng'
import { SkillGraph } from './skillGraph'
import { exprEquivalent, judge, parseNumber, solutionFor } from './judge'
import { applyAttempt, DAY_MS, dueAt, expectedCorrect, isDue, mastery, newSkillStats, retrievability, tier } from './mastery'
import { levelFromXp, nextStreak, xpToReach } from './points'
import { diagnoseGaps } from './planner'
import { Session, createMemoryStore } from './session'
import { applyEvent, emptyState, mergeEvents, project } from './events'
import { fixtureRegistry } from './testing/fixture'
import type { AppEvent, ExprItem, Item, NumericItem, Skill } from './types'

const base = { id: 'x', skillId: 's', subject: 'm', difficulty: 3, generatorId: 'g', seed: 1, prompt: 'p', explanation: 'e' } as const

describe('rng', () => {
  it('is deterministic per seed', () => {
    const a = makeRng(42)
    const b = makeRng(42)
    expect([a.next(), a.next(), a.int(1, 100)]).toEqual([b.next(), b.next(), b.int(1, 100)])
  })
  it('int is inclusive and shuffle is a permutation', () => {
    const r = makeRng(7)
    const seen = new Set<number>()
    for (let i = 0; i < 300; i++) seen.add(r.int(1, 4))
    expect([...seen].sort()).toEqual([1, 2, 3, 4])
    expect(r.shuffle([1, 2, 3, 4, 5]).sort()).toEqual([1, 2, 3, 4, 5])
  })
})

describe('skill graph', () => {
  const mk = (id: string, prereqs: string[] = []): Skill => ({ id, subject: 's', name: id, description: '', year: 8, strand: 'x', prereqs, origin: 'syllabus' })
  it('orders topologically and finds ancestors nearest-first', () => {
    const g = new SkillGraph([mk('c', ['b']), mk('a'), mk('b', ['a'])])
    expect(g.topological().map((s) => s.id)).toEqual(['a', 'b', 'c'])
    expect(g.ancestors('c').map((x) => [x.skill.id, x.depth])).toEqual([['b', 1], ['a', 2]])
    expect(g.descendants('a').map((s) => s.id).sort()).toEqual(['b', 'c'])
  })
  it('rejects cycles and unknown prerequisites', () => {
    expect(() => new SkillGraph([mk('a', ['b']), mk('b', ['a'])])).toThrow(/cycle/)
    expect(() => new SkillGraph([mk('a', ['zzz'])])).toThrow(/unknown prerequisite/)
  })
})

describe('judge: numeric', () => {
  const item = (over: Partial<NumericItem> = {}): NumericItem => ({ ...base, kind: 'numeric', fields: [{ answer: 0.75 }], ...over })
  it('parses numbers, fractions and mixed numbers', () => {
    expect(parseNumber('3/4')?.value).toBe(0.75)
    expect(parseNumber('1 1/2')?.value).toBe(1.5)
    expect(parseNumber('-1 1/2')?.value).toBe(-1.5)
    expect(parseNumber('−3.5')?.value).toBe(-3.5)
    expect(parseNumber('£1,200')?.value).toBe(1200)
    expect(parseNumber('abc')).toBeNull()
    expect(parseNumber('1/0')).toBeNull()
  })
  it('accepts equivalent forms', () => {
    for (const v of ['0.75', '3/4', '6/8', '.75']) expect(judge(item(), { kind: 'numeric', values: [v] }).correct).toBe(true)
  })
  it('enforces lowest terms when asked', () => {
    const it = item({ fields: [{ answer: 0.75, requireLowestTerms: true }] })
    expect(judge(it, { kind: 'numeric', values: ['3/4'] }).correct).toBe(true)
    const j = judge(it, { kind: 'numeric', values: ['6/8'] })
    expect(j.correct).toBe(false)
    expect(j.misconception).toBe('not-simplified')
  })
  it('flags blanks as unparseable rather than wrong', () => {
    expect(judge(item(), { kind: 'numeric', values: [''] }).unparseable).toBe(true)
  })
  it('recognises common errors', () => {
    const it = item({ commonErrors: [{ values: [0.5], tag: 'halved', message: 'msg' }] })
    const j = judge(it, { kind: 'numeric', values: ['0.5'] })
    expect(j).toMatchObject({ correct: false, misconception: 'halved', feedback: 'msg' })
  })
  it('handles multi-field templates with superscripts', () => {
    const it = item({ fields: [{ answer: 3.2 }, { answer: 5, superscript: true }], template: '{0} × 10{1}' })
    expect(judge(it, { kind: 'numeric', values: ['3.2', '5'] })).toMatchObject({ correct: true, expected: '3.2 × 10^5' })
    expect(judge(it, { kind: 'numeric', values: ['3.2', '4'] }).correct).toBe(false)
  })
})

describe('judge: expressions', () => {
  const ex = (over: Partial<ExprItem>): ExprItem => ({ ...base, kind: 'expr', answer: '3x+12', variables: ['x'], ...over })
  it('checks algebraic equivalence with implicit multiplication', () => {
    expect(exprEquivalent('3(x+4)', '3x+12')).toBe(true)
    expect(exprEquivalent('12+x*3', '3x+12')).toBe(true)
    expect(exprEquivalent('(x+1)(x+2)', 'x^2+3x+2')).toBe(true)
    expect(exprEquivalent('x²', 'x^2')).toBe(true)
    expect(exprEquivalent('3x+4', '3x+12')).toBe(false)
    expect(exprEquivalent('2x', 'x^2')).toBe(false)
    expect(exprEquivalent('(y-2)/3', '(y - 2) ÷ 3')).toBe(true)
  })
  it('rejects syntax errors', () => {
    expect(judge(ex({}), { kind: 'expr', value: '3x+' }).unparseable).toBe(true)
    expect(judge(ex({}), { kind: 'expr', value: '(3x' }).unparseable).toBe(true)
  })
  it('expanded form must have no brackets and be simplified', () => {
    const it = ex({ form: 'expanded' })
    expect(judge(it, { kind: 'expr', value: '3x+12' }).correct).toBe(true)
    expect(judge(it, { kind: 'expr', value: '3(x+4)' })).toMatchObject({ correct: false, misconception: 'not-expanded' })
    expect(judge(it, { kind: 'expr', value: 'x+2x+12' })).toMatchObject({ correct: false, misconception: 'not-simplified' })
  })
  it('factorised form needs the highest common factor outside a bracket', () => {
    const it = ex({ answer: '6x+9', form: 'factorised', expectedFactor: '3' })
    expect(judge(it, { kind: 'expr', value: '3(2x+3)' }).correct).toBe(true)
    expect(judge(it, { kind: 'expr', value: '6x+9' })).toMatchObject({ correct: false, misconception: 'not-factorised' })
    expect(judge(it, { kind: 'expr', value: '1(6x+9)' }).correct).toBe(false)
    const it2 = ex({ answer: '4x+8', form: 'factorised', expectedFactor: '4' })
    expect(judge(it2, { kind: 'expr', value: '4(x+2)' }).correct).toBe(true)
    expect(judge(it2, { kind: 'expr', value: '2(2x+4)' })).toMatchObject({ correct: false, misconception: 'not-fully-factorised' })
  })
  it('matches misconceptions by equivalence', () => {
    const it = ex({ commonErrors: [{ expr: '3x+4', tag: 'forgot-to-multiply', message: 'm' }] })
    expect(judge(it, { kind: 'expr', value: '4+3x' }).misconception).toBe('forgot-to-multiply')
  })
})

describe('judge: other kinds', () => {
  it('choice uses per-option misconception', () => {
    const it = { ...base, kind: 'choice', options: [{ id: 'a', label: '1', correct: true }, { id: 'b', label: '2', misconception: 'm', feedback: 'f' }] } as unknown as Item
    expect(judge(it, { kind: 'choice', optionId: 'a' }).correct).toBe(true)
    expect(judge(it, { kind: 'choice', optionId: 'b' })).toMatchObject({ correct: false, misconception: 'm', feedback: 'f' })
  })
  it('order compares full sequence', () => {
    const it = { ...base, kind: 'order', items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], correctOrder: ['b', 'a'], directionLabel: ['s', 'l'] } as unknown as Item
    expect(judge(it, { kind: 'order', order: ['b', 'a'] }).correct).toBe(true)
    expect(judge(it, { kind: 'order', order: ['a', 'b'] }).correct).toBe(false)
  })
  it('match needs every pair right', () => {
    const it = { ...base, kind: 'match', pairs: [{ id: 'a', left: 'L1', right: 'R1' }, { id: 'b', left: 'L2', right: 'R2' }] } as unknown as Item
    expect(judge(it, { kind: 'match', pairs: { a: 'a', b: 'b' } }).correct).toBe(true)
    expect(judge(it, { kind: 'match', pairs: { a: 'b', b: 'a' } }).correct).toBe(false)
    expect(judge(it, { kind: 'match', pairs: { a: 'a' } }).unparseable).toBe(true)
  })
  it('text ignores case/accents when asked and spots near-misses', () => {
    const it = { ...base, kind: 'text', accept: ['der Straße', 'die Strasse'], ignoreAccents: true } as unknown as Item
    expect(judge(it, { kind: 'text', value: '  DIE strasse. ' }).correct).toBe(true)
    expect(judge(it, { kind: 'text', value: 'die strase' })).toMatchObject({ correct: false, misconception: 'spelling' })
  })
  it('solutionFor always judges correct', () => {
    const items = [
      { ...base, kind: 'numeric', fields: [{ answer: 2.5 }] },
      { ...base, kind: 'expr', answer: '2x', variables: ['x'] },
      { ...base, kind: 'choice', options: [{ id: 'a', label: '1', correct: true }] },
      { ...base, kind: 'order', items: [{ id: 'a', label: 'A' }], correctOrder: ['a'], directionLabel: ['a', 'b'] },
      { ...base, kind: 'match', pairs: [{ id: 'a', left: 'l', right: 'r' }] },
      { ...base, kind: 'text', accept: ['hallo'] },
    ] as unknown as Item[]
    for (const it of items) expect(judge(it, solutionFor(it)).correct).toBe(true)
  })
})

describe('mastery', () => {
  const T0 = 1_700_000_000_000
  const attempt = (s: ReturnType<typeof newSkillStats>, correct: boolean, difficulty: number, t: number) =>
    applyAttempt(s, { correct, difficulty, ts: t, day: new Date(t).toISOString().slice(0, 10), hintUsed: false, attemptNo: 1 })

  it('converges to a learner\'s true ability (theta 3.5) within +-0.6 after 40 questions', () => {
    const rng = makeRng(99)
    let s = newSkillStats('x')
    for (let i = 0; i < 40; i++) {
      const d = Math.min(5, Math.max(1, Math.round(s.theta - 0.5 + (rng.next() - 0.5))))
      s = attempt(s, rng.next() < expectedCorrect(3.5, d), d, T0 + i * 60_000)
    }
    expect(Math.abs(s.theta - 3.5)).toBeLessThan(0.6)
  })
  it('moves up on success and down on failure, but not on retries', () => {
    const s0 = newSkillStats('x')
    expect(attempt(s0, true, 3, T0).theta).toBeGreaterThan(s0.theta)
    expect(attempt(s0, false, 2, T0).theta).toBeLessThan(s0.theta)
    const retry = applyAttempt(s0, { correct: true, difficulty: 3, ts: T0, day: 'd', hintUsed: false, attemptNo: 2 })
    expect(retry.theta).toBe(s0.theta)
    expect(retry.n).toBe(0)
  })
  it('forgets over time, and spaced success grows stability more than massed practice', () => {
    let spaced = newSkillStats('x')
    let massed = newSkillStats('x')
    for (let i = 0; i < 5; i++) {
      spaced = attempt(spaced, true, 3, T0 + i * 3 * DAY_MS)
      massed = attempt(massed, true, 3, T0 + i * 60_000)
    }
    expect(spaced.stability).toBeGreaterThan(massed.stability * 2)
    const later = T0 + 40 * DAY_MS
    expect(retrievability(spaced, later)).toBeLessThan(retrievability(spaced, spaced.lastTs as number))
    expect(mastery(spaced, later)).toBeLessThan(mastery(spaced, spaced.lastTs as number))
    expect(isDue(massed, T0 + 2 * DAY_MS)).toBe(true)
    expect(dueAt(massed) as number).toBeGreaterThan(massed.lastTs as number)
  })
  it('needs evidence over several days for "mastered"', () => {
    let s = newSkillStats('x')
    for (let i = 0; i < 12; i++) s = attempt(s, true, 5, T0 + i * 1000)
    expect(tier(s, T0 + 20_000)).not.toBe('mastered') // one day only
    for (let i = 0; i < 3; i++) s = attempt(s, true, 5, T0 + (i + 1) * DAY_MS)
    expect(tier(s, T0 + 3 * DAY_MS + 1000)).toBe('mastered')
    expect(tier(undefined, T0)).toBe('new')
  })
})

describe('points', () => {
  it('level thresholds', () => {
    expect(xpToReach(2)).toBe(100)
    expect(levelFromXp(0).level).toBe(1)
    expect(levelFromXp(99).level).toBe(1)
    expect(levelFromXp(100).level).toBe(2)
    expect(levelFromXp(4500).level).toBe(10)
    expect(levelFromXp(150).progress).toBeCloseTo(0.25)
  })
  it('streak survives one missed day but not two', () => {
    let s = nextStreak({ current: 0, best: 0 }, '2026-03-01')
    s = nextStreak(s, '2026-03-02')
    s = nextStreak(s, '2026-03-04') // missed the 3rd - still alive
    expect(s.current).toBe(3)
    s = nextStreak(s, '2026-03-07') // missed 5th and 6th - reset
    expect(s.current).toBe(1)
    expect(s.best).toBe(3)
    expect(nextStreak(s, '2026-03-07')).toBe(s)
  })
})

describe('planner: gap finding', () => {
  const reg = fixtureRegistry()
  const now = 1_700_000_000_000
  const stats = (id: string, n: number, theta: number, recent: boolean[] = []) => ({ ...newSkillStats(id), n, theta, recent, lastTs: now })
  const opts = { subject: 'test', now, hasContent: reg.hasContent }

  it('flags an unchecked prerequisite when a topic is failing', () => {
    const st = { ...emptyState('l'), skills: { 't.c': stats('t.c', 5, 1.6, [false, false, true, false, false]) } }
    const g = diagnoseGaps(st, reg.graph, opts)
    expect(g[0]).toMatchObject({ skillId: 't.b', status: 'unchecked', forSkills: ['t.c'] })
  })
  it('walks further down when the prerequisite is itself weak', () => {
    const st = {
      ...emptyState('l'),
      skills: { 't.c': stats('t.c', 5, 1.6, [false, false, false]), 't.b': stats('t.b', 4, 1.5) },
    }
    const g = diagnoseGaps(st, reg.graph, opts)
    expect(g[0]).toMatchObject({ skillId: 't.a', status: 'unchecked' })
  })
  it('names the weak prerequisite as the root cause when its own building blocks are fine', () => {
    const st = {
      ...emptyState('l'),
      skills: { 't.c': stats('t.c', 5, 1.6, [false, false, false]), 't.b': stats('t.b', 4, 1.5), 't.a': stats('t.a', 4, 4.5) },
    }
    expect(diagnoseGaps(st, reg.graph, opts)[0]).toMatchObject({ skillId: 't.b', status: 'weak' })
  })
  it('says "self" when the building blocks are secure (the topic itself needs teaching)', () => {
    const st = {
      ...emptyState('l'),
      skills: { 't.c': stats('t.c', 5, 1.6, [false, false, false]), 't.b': stats('t.b', 6, 4.5), 't.a': stats('t.a', 6, 4.5) },
    }
    expect(diagnoseGaps(st, reg.graph, opts)[0]).toMatchObject({ skillId: 't.c', status: 'self' })
  })
  it('ignores topics flagged as not taught yet', () => {
    const st = { ...emptyState('l'), skills: { 't.c': { ...stats('t.c', 5, 1.6, [false, false, false]), notTaught: true } } }
    expect(diagnoseGaps(st, reg.graph, opts)).toEqual([])
  })
})

describe('session end-to-end', () => {
  const reg = fixtureRegistry()
  let clock = 1_700_000_000_000
  const mk = (over = {}, initial: AppEvent[] = []) => {
    const store = createMemoryStore('kid', reg, initial)
    const s = new Session({
      registry: reg,
      store,
      learnerId: 'kid',
      subject: 'test',
      gameId: 'g',
      mode: 'practice',
      length: 6,
      seed: 5,
      now: () => (clock += 4000),
      ...over,
    })
    return { store, s }
  }
  const correctAnswer = (q: { item: Parameters<typeof solutionFor>[0] }) => solutionFor(q.item)

  it('records events, awards XP, and projection == replay', () => {
    const { store, s } = mk()
    let q
    while ((q = s.next())) s.submit(correctAnswer(q))
    const sum = s.finish()
    expect(sum.answered).toBe(6)
    expect(sum.correct).toBe(6)
    expect(sum.xp).toBeGreaterThan(60)
    const st = store.get()
    expect(st.xp).toBe(sum.xp)
    expect(st.totals.attempts).toBe(6)
    expect(st.badges['first-steps']).toBeTruthy()
    // Determinism: replaying the event log reproduces the exact live state.
    const replay = project('kid', store.events, reg.graph)
    expect(replay.xp).toBe(st.xp)
    expect(replay.skills).toEqual(st.skills)
    expect(replay.streak).toEqual(st.streak)
  })

  it('wrong answer: no hint-free retry unless allowed; retry pays reduced XP and never moves ability', () => {
    const { s, store } = mk({ allowRetry: true })
    const q = s.next()!
    const wrong = s.submit({ kind: 'numeric', values: ['-1'] })
    expect(wrong.judgement.correct).toBe(false)
    expect(wrong.canRetry).toBe(true)
    const thetaAfterWrong = store.get().skills[q.item.skillId]!.theta
    s.useHint()
    const retry = s.submit(correctAnswer(q))
    expect(retry.judgement.correct).toBe(true)
    expect(retry.canRetry).toBe(false)
    expect(retry.award.parts.map((p) => p.code)).toContain('fixed')
    expect(store.get().skills[q.item.skillId]!.theta).toBe(thetaAfterWrong)
    expect(s.answered).toBe(1)
  })

  it('unparseable answers record nothing', () => {
    const { s, store } = mk()
    s.next()
    const r = s.submit({ kind: 'numeric', values: [''] })
    expect(r.unparseable).toBe(true)
    expect(store.events.length).toBe(0)
  })

  it('"not covered in class" feedback flags the skill and removes it from planning', () => {
    const { s, store } = mk()
    const q = s.next()!
    const ev = s.flag('not-taught', 'we have not done this')
    expect(ev.snapshot.expected).toBeTruthy()
    const st = store.get()
    expect(st.skills[q.item.skillId]!.notTaught).toBe(true)
    expect(st.flaggedItems[q.item.id]).toBe(true)
    expect(s.answered).toBe(0) // flagged before answering: doesn't count as answered
    const next = s.next()
    expect(next?.item.skillId).not.toBe(q.item.skillId)
  })

  it('feedback XP is capped per day', () => {
    const { s, store } = mk()
    let total = 0
    for (let i = 0; i < 5; i++) {
      s.next()
      total += s.flag('bug').award.total
    }
    expect(total).toBe(9) // 3 x 3 XP, then nothing
    expect(store.get().totals.feedback).toBe(5)
  })

  it('parent marking a skill as taught clears the not-taught flag and forgives earlier misses', () => {
    let st = emptyState('kid')
    const ev = (e: Partial<AppEvent> & { type: string }) => ({ id: Math.random().toString(), ts: clock++, day: '2026-03-01', learnerId: 'kid', v: 1, ...e }) as AppEvent
    st = applyEvent(st, ev({ type: 'taught', skillId: 't.c', taught: false }), reg.graph)
    expect(st.skills['t.c']!.notTaught).toBe(true)
    st = applyEvent(st, ev({ type: 'taught', skillId: 't.c', taught: true }), reg.graph)
    expect(st.skills['t.c']!.notTaught).toBe(false)
  })

  it('diagnostic mode steps back to prerequisites when a skill is failed', () => {
    const { s } = mk({ mode: 'diagnostic', length: 40 })
    const asked: string[] = []
    let q
    let guard = 0
    while ((q = s.next()) && guard++ < 40) {
      asked.push(q.item.skillId)
      // She is fine at everything except t.c
      s.submit(q.item.skillId === 't.c' ? { kind: 'numeric', values: ['-5'] } : correctAnswer(q))
    }
    const sum = s.finish(true)
    expect(sum.weak).toContain('t.c')
    expect(sum.strong).toEqual(expect.arrayContaining(['t.d']))
    // After failing t.c the diagnostic probed its prerequisite t.b
    expect(asked).toContain('t.b')
  })

  it('a strong learner is served harder questions than a struggling one', () => {
    const diffs = (correct: boolean) => {
      const { s } = mk({ length: 30, seed: 11 })
      const out: number[] = []
      let q
      while ((q = s.next())) {
        out.push(q.item.difficulty)
        s.submit(correct ? correctAnswer(q) : { kind: 'numeric', values: ['-999'] })
      }
      return out.slice(-10).reduce((a, b) => a + b, 0) / 10
    }
    expect(diffs(true)).toBeGreaterThan(diffs(false) + 1.2)
  })
})

describe('session: spawn/resolve for concurrent-question games (Equation Defence)', () => {
  const reg = fixtureRegistry()
  let clock = 1_700_000_000_000
  const mk = (over = {}) => {
    const store = createMemoryStore('kid', reg, [])
    const s = new Session({ registry: reg, store, learnerId: 'kid', subject: 'test', gameId: 'g', mode: 'sprint', length: 6, seed: 5, now: () => (clock += 4000), ...over })
    return { store, s }
  }
  const correctAnswer = (q: { item: Parameters<typeof solutionFor>[0] }) => solutionFor(q.item)

  it('spawns several open questions at once, independent of each other and of next()/cur', () => {
    const { s } = mk()
    const a = s.spawn()!
    const b = s.spawn()!
    const c = s.spawn()!
    expect(a.slotId).not.toBe(b.slotId)
    expect(s.openCount).toBe(3)
    expect(a.item.id).not.toBe(b.item.id)
    expect(c).toBeTruthy()
  })

  it('resolving one open slot does not affect the others, and records a real attempt', () => {
    const { s, store } = mk()
    const a = s.spawn()!
    const b = s.spawn()!
    const r = s.resolve(a.slotId, correctAnswer(a))
    expect(r?.judgement.correct).toBe(true)
    expect(s.answered).toBe(1)
    expect(s.openCount).toBe(1) // b is still open
    expect(store.events.some((e) => e.type === 'attempt')).toBe(true)
    // b resolves independently and correctly still finds its own answer
    const rb = s.resolve(b.slotId, correctAnswer(b))
    expect(rb?.judgement.correct).toBe(true)
    expect(s.answered).toBe(2)
    expect(s.openCount).toBe(0)
  })

  it('an unanswered (missed) slot is scored as a real wrong attempt, not silently dropped', () => {
    const { s, store } = mk()
    const a = s.spawn()!
    const before = store.events.length
    const r = s.resolve(a.slotId, undefined)
    expect(r?.judgement.correct).toBe(false)
    expect(s.answered).toBe(1)
    expect(s.correct).toBe(0)
    expect(store.events.length).toBe(before + 1)
  })

  it('resolving an unknown or already-resolved slot is a safe no-op', () => {
    const { s } = mk()
    const a = s.spawn()!
    s.resolve(a.slotId, correctAnswer(a))
    expect(s.resolve(a.slotId, correctAnswer(a))).toBeUndefined()
    expect(s.resolve('nope', undefined)).toBeUndefined()
    expect(s.answered).toBe(1) // the double-resolve did not double-count
  })

  it('length is a total budget across spawns (like next()), not a concurrency limit', () => {
    const { s } = mk({ length: 3 })
    const a = s.spawn()!
    const b = s.spawn()!
    const c = s.spawn()!
    expect(s.spawn()).toBeNull() // 3 spawned already == length, whether or not any have resolved
    s.resolve(a.slotId, correctAnswer(a))
    expect(s.spawn()).toBeNull() // resolving frees no new budget - length caps total questions asked
    s.resolve(b.slotId, correctAnswer(b))
    s.resolve(c.slotId, correctAnswer(c))
    expect(s.spawn()).toBeNull()
    expect(s.answered).toBe(3)
  })

  it('a wrong resolution resets combo the same way a wrong submit() does', () => {
    const { s } = mk({ length: 4 })
    const a = s.spawn()!
    s.resolve(a.slotId, correctAnswer(a))
    expect(s.combo).toBe(1)
    const b = s.spawn()!
    s.resolve(b.slotId, undefined)
    expect(s.combo).toBe(0)
  })
})

describe('sync merge', () => {
  it('is idempotent, order-independent, and never loses events', () => {
    const e = (id: string, ts: number) => ({ id, ts, day: 'd', learnerId: 'k', v: 1, type: 'badge', badgeId: id }) as AppEvent
    const a = [e('1', 1), e('3', 3)]
    const b = [e('2', 2), e('3', 3)]
    const m1 = mergeEvents(a, b)
    const m2 = mergeEvents(b, a)
    expect(m1.map((x) => x.id)).toEqual(['1', '2', '3'])
    expect(m2).toEqual(m1)
    expect(mergeEvents(m1, m1)).toEqual(m1)
  })
})
