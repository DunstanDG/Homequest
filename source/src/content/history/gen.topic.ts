import type { ItemGenerator } from '@/engine/registry'
import type { CommonError, ItemBody, Rng } from '@/engine/types'
import { choice, generatorFor, matchItem, orderItem, reveal } from '../kit'
import type { Ev, Fact, Person, Term, Topic, W } from './types'

export const G = generatorFor('history')

// ------------------------------------------------------------------ helpers

/** 1066 -> '1066', 43 -> 'AD 43', -55 -> '55 BC'. */
export const fmtYear = (y: number): string => (y < 0 ? `${-y} BC` : y < 1000 ? `AD ${y}` : String(y))
export const fmtEvYear = (ev: Ev): string => (ev.approx ? `around ${fmtYear(ev.y)}` : fmtYear(ev.y))

export const slug = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)

export const ordinal = (n: number): string => {
  const t = n % 100
  if (t >= 11 && t <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}

/** Century number of a year (AD positive, BC negative years give the BC century as a positive number). */
export const centuryOf = (y: number): number => Math.floor((Math.abs(y) - 1) / 100) + 1

export const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

/** 'was the Duke of Normandy who...' -> 'The Duke of Normandy who...'; 'led the rebels' -> 'Led the rebels'. */
export const didLabel = (did: string): string => cap(did.replace(/^(was|were) /, ''))

/** Turn compact wrong options into kit options with a misconception tag. */
export const wrongs = (skill: string, w: W[]) =>
  w.map((x) => (typeof x === 'string' ? x : { label: x[0], feedback: x[1], misconception: `${skill}:${slug(x[0])}` }))

/** Pick items whose level range contains d; if none, the nearest ones. Never empty if `list` is non-empty. */
export function byLevel<T extends { lv?: [number, number] }>(list: T[], d: number, dflt: [number, number] = [1, 5]): T[] {
  const dist = (x: T) => {
    const [lo, hi] = x.lv ?? dflt
    return d < lo ? lo - d : d > hi ? d - hi : 0
  }
  const best = Math.min(...list.map(dist))
  return list.filter((x) => dist(x) === best)
}

/** k events with different years, returned in chronological order. */
export function distinctYears(rng: Rng, evs: Ev[], k: number): Ev[] {
  const seen = new Set<number>()
  const out: Ev[] = []
  for (const e of rng.shuffle(evs)) {
    if (seen.has(e.y)) continue
    seen.add(e.y)
    out.push(e)
    if (out.length >= k) break
  }
  return out.sort((a, b) => a.y - b.y)
}

export const yearCount = (evs: Ev[]) => new Set(evs.map((e) => e.y)).size

export const timelineText = (evs: Ev[]) => evs.map((e) => `${fmtEvYear(e)}: ${e.e}${e.note ? ` (${e.note})` : ''}`).join('; ')

export function factItem(rng: Rng, skill: string, f: Fact): ItemBody {
  return choice({ rng, prompt: f.q, correct: f.a, wrong: wrongs(skill, f.w), hint: f.hint, explanation: f.ex, figure: f.src })
}

export function numericYear(prompt: string, answer: number, hint: string, explanation: string, errors: CommonError[] = []): ItemBody {
  const commonErrors = errors.filter((e) => e.values?.[0] !== answer)
  return {
    kind: 'numeric',
    prompt,
    hint,
    explanation,
    keypad: 'number',
    fields: [{ answer, label: 'Year' }],
    commonErrors: commonErrors.length ? commonErrors : undefined,
  }
}

// --------------------------------------------------------- generator factory

/** Size of an ordering/matching task for a difficulty. */
const sizeFor = (d: number, n: number, base = 3) => Math.max(2, Math.min(n, base + Math.max(0, d - 2)))

/**
 * Build every generator a topic's data supports. `peers` are the other topics in the same strand, used only to
 * borrow distractors (definitions, people) when a topic has too few of its own.
 */
export function topicGenerators(t: Topic, peers: Topic[]): ItemGenerator[] {
  const gens: ItemGenerator[] = []
  const sk = t.skill
  const events = t.events ?? []
  const dated = events.filter((e) => !e.approx)

  // ---------------------------------------------------------------- facts
  const facts = t.facts ?? []
  if (facts.length) {
    const lo = Math.min(...facts.map((f) => f.lv[0]))
    const hi = Math.max(...facts.map((f) => f.lv[1]))
    gens.push(G(`${sk}.facts`, sk, [lo, hi], (rng, d) => factItem(rng, sk, rng.pick(byLevel(facts, d)))))
  }

  // ---------------------------------------------------------------- dates
  if (dated.length >= 2 && yearCount(dated) >= 2) {
    gens.push(
      G(`${sk}.when`, sk, [1, 3], (rng, d) => {
        const ev = rng.pick(dated)
        const others = dated.filter((x) => x.y !== ev.y)
        const sorted = [...rng.shuffle(others)].sort((a, b) => (d <= 1 ? Math.abs(b.y - ev.y) - Math.abs(a.y - ev.y) : Math.abs(a.y - ev.y) - Math.abs(b.y - ev.y)))
        const wrong: W[] = sorted.slice(0, 3).map((x) => [fmtYear(x.y), `${fmtYear(x.y)} is the date of a different event: ${x.e}.`])
        const nudges = d <= 1 ? [100, -100, 50, -50, 200] : d === 2 ? [10, -10, 20, -20, 50] : [1, -1, 2, -2, 10]
        for (const n of nudges) {
          const y = ev.y + n
          if (ev.y > 0 && y <= 0) continue
          if (!wrong.some((x) => (typeof x === 'string' ? x : x[0]) === fmtYear(y))) wrong.push(fmtYear(y))
        }
        const near = [...others].sort((a, b) => Math.abs(a.y - ev.y) - Math.abs(b.y - ev.y))[0]
        return choice({
          rng,
          prompt: `${ev.e}. In which year did this happen?`,
          correct: fmtYear(ev.y),
          wrong: wrongs(sk, wrong.slice(0, 3)),
          keepOrder: false,
          hint: near ? `Clue: ${near.e} in ${fmtYear(near.y)}. Did this happen before or after that?` : `It happened in the ${ordinal(centuryOf(ev.y))} century.`,
          explanation: `${ev.e}: ${fmtYear(ev.y)}.${ev.note ? ` ${cap(ev.note)}.` : ''}`,
        })
      }),
    )
  }
  if (yearCount(events) >= 3) {
    gens.push(
      G(`${sk}.timeline`, sk, [2, 5], (rng, d) => {
        const evs = distinctYears(rng, events, sizeFor(d, yearCount(events)))
        const clue = rng.pick(evs.filter((e) => !e.approx).length ? evs.filter((e) => !e.approx) : evs)
        return orderItem({
          rng,
          prompt: `Put these events from ${t.title} in chronological order, earliest first.`,
          correct: evs.map((e) => e.e),
          direction: ['Earliest', 'Latest'],
          hint: `Think about what had to happen first. Clue: ${clue.e} happened ${clue.approx ? 'around' : 'in'} ${fmtYear(clue.y)}.`,
          explanation: `In order: ${timelineText(evs)}.`,
        })
      }),
    )
  }
  if (yearCount(dated) >= 3) {
    gens.push(
      G(`${sk}.date-match`, sk, [2, 4], (rng, d) => {
        const evs = distinctYears(rng, dated, Math.min(5, sizeFor(d, yearCount(dated))))
        return matchItem({
          prompt: `Match each event from ${t.title} to its date.`,
          pairs: rng.shuffle(evs).map((e) => ({ left: e.e, right: fmtYear(e.y) })),
          hint: 'Start with the date you are surest of, then use cause and effect: what must have come first?',
          explanation: `${timelineText(evs)}.`,
        })
      }),
    )
  }
  const keyEvs = dated.filter((e) => e.key && e.y > 0)
  if (keyEvs.length) {
    gens.push(
      G(`${sk}.year`, sk, [4, 5], (rng) => {
        const ev = rng.pick(keyEvs)
        const errs: CommonError[] = dated
          .filter((x) => x.y !== ev.y)
          .slice(0, 6)
          .map((x) => ({ tag: 'date-mixup', values: [x.y], message: `${x.y} is the date of a different event: ${x.e}.` }))
        return numericYear(
          `${ev.e}. Type the year this happened.`,
          ev.y,
          ev.y >= 1000 ? `It was in the ${ordinal(centuryOf(ev.y))} century, so the year begins ${String(ev.y).slice(0, 2)}.` : `It was in the ${ordinal(centuryOf(ev.y))} century AD.`,
          `${ev.e}: ${ev.y}.${ev.note ? ` ${cap(ev.note)}.` : ''}`,
          errs,
        )
      }),
    )
  }

  // ---------------------------------------------------------------- terms
  const ownTerms = t.terms ?? []
  const termPool = dedupeTerms([...ownTerms, ...peers.flatMap((p) => p.terms ?? [])])
  if (ownTerms.length >= 3) {
    gens.push(
      G(`${sk}.terms-match`, sk, [2, 4], (rng, d) => {
        const pick = rng.shuffle(ownTerms).slice(0, sizeFor(d, ownTerms.length))
        return matchItem({
          prompt: `Match each key word to its meaning. Topic: ${t.title}.`,
          pairs: pick.map((x) => ({ left: x.t, right: x.d })),
          hint: 'Match the words you are sure of first; the last one will be whatever is left.',
          explanation: pick.map((x) => `${x.t}: ${x.d}`).join('. ') + '.',
        })
      }),
    )
  }
  if (ownTerms.length >= 1 && termPool.length >= 4) {
    gens.push(
      G(`${sk}.term`, sk, [1, 3], (rng, d) => {
        const x = rng.pick(ownTerms)
        const rest = rng.shuffle(termPool.filter((o) => o.t !== x.t && o.d !== x.d))
        const sameTopic = rest.filter((o) => ownTerms.includes(o))
        const others = [...sameTopic, ...rest.filter((o) => !ownTerms.includes(o))].slice(0, 3)
        if (d <= 2) {
          return choice({
            rng,
            prompt: `What does "${x.t}" mean?`,
            correct: x.d,
            wrong: others.map((o) => ({ label: o.d, misconception: `${sk}:term-mixup`, feedback: `That is the meaning of "${o.t}".` })),
            hint: 'Think about where you met this word in the topic, and what was happening then.',
            explanation: `${x.t}: ${x.d}.`,
          })
        }
        return choice({
          rng,
          prompt: `Which word or phrase means: ${x.d}?`,
          correct: x.t,
          wrong: others.map((o) => ({ label: o.t, misconception: `${sk}:term-mixup`, feedback: `"${o.t}" means: ${o.d}.` })),
          hint: 'Rule out the words you can define confidently.',
          explanation: `${x.t}: ${x.d}.`,
        })
      }),
    )
  }

  // --------------------------------------------------------------- people
  const ownPeople = t.people ?? []
  const peoplePool = dedupePeople([...ownPeople, ...peers.flatMap((p) => p.people ?? [])])
  if (ownPeople.length >= 3) {
    gens.push(
      G(`${sk}.people-match`, sk, [2, 4], (rng, d) => {
        const pick = rng.shuffle(ownPeople).slice(0, sizeFor(d, ownPeople.length))
        return matchItem({
          prompt: `Match each person from ${t.title} to what they did.`,
          pairs: pick.map((p) => ({ left: p.n, right: didLabel(p.did) })),
          hint: 'Start with the person you know best.',
          explanation: pick.map((p) => `${p.n} ${p.did}`).join('. ') + '.',
        })
      }),
    )
  }
  if (ownPeople.length >= 1 && peoplePool.length >= 4) {
    gens.push(
      G(`${sk}.who`, sk, [1, 3], (rng, d) => {
        const p = rng.pick(ownPeople)
        const rest = rng.shuffle(peoplePool.filter((o) => o.n !== p.n))
        const others = [...rest.filter((o) => ownPeople.includes(o)), ...rest.filter((o) => !ownPeople.includes(o))].slice(0, 3)
        if (d <= 2) {
          return choice({
            rng,
            prompt: `Who ${p.did}?`,
            correct: p.n,
            wrong: others.map((o) => ({ label: o.n, misconception: `${sk}:person-mixup`, feedback: `${o.n} ${o.did}.` })),
            hint: 'Think about which period this happened in, then who was important then.',
            explanation: `${p.n} ${p.did}.`,
          })
        }
        return choice({
          rng,
          prompt: `What is ${p.n} remembered for?`,
          correct: didLabel(p.did),
          wrong: others.map((o) => ({ label: didLabel(o.did), misconception: `${sk}:person-mixup`, feedback: `That was ${o.n}.` })),
          hint: `Think about when ${p.n} lived and what was happening then.`,
          explanation: `${p.n} ${p.did}.`,
        })
      }),
    )
  }

  // ---------------------------------------------------------------- links
  const links = t.links ?? []
  if (links.length >= 3) {
    gens.push(
      G(`${sk}.cause-effect`, sk, [3, 5], (rng, d) => {
        const pick = rng.shuffle(links).slice(0, Math.min(links.length, d))
        return matchItem({
          prompt: t.linkPrompt ?? `Match each cause to its consequence. Topic: ${t.title}.`,
          pairs: pick.map((l) => ({ left: l.c, right: l.e })),
          hint: 'Ask of each cause: "What did this lead to?"',
          explanation: pick.map((l) => `${l.c} led to: ${l.e.charAt(0).toLowerCase()}${l.e.slice(1)}`).join('. ') + '.',
        })
      }),
    )
  }

  // ---------------------------------------------------------------- sorts
  const sorts = t.sorts ?? []
  if (sorts.length) {
    gens.push(
      G(`${sk}.sort`, sk, [1, 4], (rng, d) => {
        const s = rng.pick(sorts)
        if (d >= 3) {
          const c = rng.int(0, s.cats.length - 1)
          const yes = s.items.filter((i) => i[1] === c)
          const no = rng.shuffle(s.items.filter((i) => i[1] !== c)).slice(0, 3)
          if (yes.length && no.length >= 2) {
            const right = rng.pick(yes)
            return choice({
              rng,
              prompt: `Which of these is ${s.ask[c]}?`,
              correct: right[0],
              wrong: no.map((i) => ({ label: i[0], misconception: `${sk}:sort`, feedback: `That is ${s.ask[i[1]]}.${i[2] ? ` ${i[2]}` : ''}` })),
              hint: s.hint,
              explanation: `${right[0]}: ${s.ask[c]}.${right[2] ? ` ${right[2]}` : ''} ${s.ex}`,
            })
          }
        }
        const it = rng.pick(s.items)
        return choice({
          rng,
          prompt: `"${it[0]}" ${s.q}`,
          correct: s.cats[it[1]] ?? '',
          wrong: s.cats.filter((_c, i) => i !== it[1]).map((c) => ({ label: c, misconception: `${sk}:sort`, feedback: it[2] ?? s.ex })),
          keepOrder: true,
          hint: s.hint,
          explanation: `${cap(s.ask[it[1]] ?? '')}.${it[2] ? ` ${it[2]}` : ''} ${s.ex}`,
        })
      }),
    )
  }

  // ------------------------------------------------------------ sequences
  const seqs = t.seqs ?? []
  if (seqs.length) {
    gens.push(
      G(`${sk}.sequence`, sk, [2, 5], (rng, d) => {
        const s = rng.pick(seqs)
        const k = Math.min(s.items.length, d + 1)
        const idx = rng
          .shuffle(s.items.map((_x, i) => i))
          .slice(0, k)
          .sort((a, b) => a - b)
        const items = idx.map((i) => s.items[i] as string)
        return orderItem({ rng, prompt: s.prompt, correct: items, direction: s.direction, hint: s.hint, explanation: `${s.ex} The order: ${items.join(', then ')}.` })
      }),
    )
  }

  // -------------------------------------------------------------- written
  const revs = t.reveals ?? []
  if (revs.length) {
    const lo = Math.min(...revs.map((r) => (r.lv ?? [3, 5])[0]))
    const hi = Math.max(...revs.map((r) => (r.lv ?? [3, 5])[1]))
    gens.push(
      G(`${sk}.written`, sk, [lo, hi], (rng, d) => {
        const r = rng.pick(byLevel(revs, d, [3, 5]))
        return reveal({ prompt: r.prompt, model: r.model, checklist: r.checklist, hint: r.hint, figure: r.src, placeholder: 'Write your answer here' })
      }),
    )
  }
  return gens
}

function dedupeTerms(list: Term[]): Term[] {
  const t = new Set<string>()
  const d = new Set<string>()
  return list.filter((x) => (t.has(x.t) || d.has(x.d) ? false : (t.add(x.t), d.add(x.d), true)))
}
function dedupePeople(list: Person[]): Person[] {
  const n = new Set<string>()
  const d = new Set<string>()
  return list.filter((x) => (n.has(x.n) || d.has(x.did) ? false : (n.add(x.n), d.add(x.did), true)))
}
