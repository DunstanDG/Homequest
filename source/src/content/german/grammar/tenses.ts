import type { ItemGenerator } from '@/engine/registry'
import type { Rng } from '@/engine/types'
import { choice, generatorFor, matchItem, orderItem, reveal, textItem } from '../../kit'
import {
  accept,
  ACTIVITIES,
  cap,
  einForm,
  fixAn,
  FUTURE_TIMES,
  HABEN,
  HATTE,
  IRREGULAR,
  NOUNS,
  PAST_TIMES,
  PERFECT,
  PERSONS,
  pickN,
  q,
  REGULAR,
  SEIN,
  SLOT_LABEL,
  TIME_EN,
  TYPE_HINT,
  WAR,
  WERDEN,
  type Forms,
  type PerfVerb,
  type Person,
  type Slot,
} from './data'

const G = generatorFor('german')

const auxForms = (v: PerfVerb): Forms => (v.aux === 'haben' ? HABEN : SEIN)
const aux = (v: PerfVerb, p: Person) => auxForms(v)[p.slot]
const perfSentence = (p: Person, v: PerfVerb) => `${cap(p.de)} ${aux(v, p)} ${v.mid} ${v.pp}.`
const perfInverted = (time: string, p: Person, v: PerfVerb) => `${cap(time)} ${aux(v, p)} ${p.de} ${v.mid} ${v.pp}.`
const enPerf = (p: Person, v: PerfVerb) => `${cap(p.en)} ${v.en}.`

const REG_HABEN = PERFECT.filter((v) => v.type === 'regular' && v.aux === 'haben')
const IRR_HABEN = PERFECT.filter((v) => (v.type === 'irregular' || v.type === 'mixed') && v.aux === 'haben')
const SIMPLE_SEIN = PERFECT.filter((v) => v.aux === 'sein' && v.type !== 'separable')
const NO_GE = PERFECT.filter((v) => v.type === 'separable' || v.type === 'inseparable' || v.type === 'ieren')

const PERF_RULE = 'Perfect tense = haben or sein (second idea) + past participle (at the end). Regular verbs: ge- + stem + -t (spielen → gespielt; stems ending in -t or -d add -et: gearbeitet).'
const IRR_RULE = 'Irregular (strong) participles end in -en and often change the vowel: essen → gegessen, trinken → getrunken, schreiben → geschrieben. They have to be learnt.'
const SEIN_RULE = 'Most verbs use haben. Verbs of movement from one place to another (gehen, fahren, fliegen, kommen, laufen, schwimmen, reisen) and of change of state (aufwachen, einschlafen) use sein, and so do sein and bleiben.'
const NOGE_RULE = 'Separable verbs put ge- between the prefix and the verb (aufgestanden, ferngesehen, eingekauft). Verbs with an inseparable prefix (be-, ver-, er-, ge-...) and verbs ending in -ieren have no ge- at all (besucht, vergessen, fotografiert).'

const stemOf = (inf: string) => inf.replace(/e?n$/, '')
/** The participle a pupil would build by treating the verb as regular. */
function regularPp(inf: string): string {
  const st = stemOf(inf)
  const end = /[dt]$/.test(st) ? 'et' : 't'
  return inf.startsWith('ge') ? `${st}${end}` : `ge${st}${end}`
}
const present3 = (inf: string) => IRREGULAR.find((v) => v.inf === inf)?.forms[2] ?? `${stemOf(inf)}t`

function seinWhy(v: PerfVerb): string {
  if (v.aux === 'haben') return `${v.inf} takes haben, like most verbs.`
  if (v.inf === 'sein' || v.inf === 'bleiben') return `${v.inf} always takes sein.`
  if (v.inf === 'aufwachen' || v.inf === 'aufstehen') return `${v.inf} describes a change of state, so it takes sein.`
  return `${v.inf} describes movement from one place to another, so it takes sein.`
}

const pickPerson = (rng: Rng) => rng.pick(PERSONS)

// =================================================================== perfect with haben

const perfectHabenGenerators: ItemGenerator[] = [
  G('gram.perf.aux', 'grammar.perfect-haben', [1, 2], (rng, d) => {
    const v = rng.pick(d === 1 ? REG_HABEN : [...REG_HABEN, ...IRR_HABEN])
    const p = pickPerson(rng)
    const correct = HABEN[p.slot]
    const s = `${cap(p.de)} ___ ${v.mid} ${v.pp}.`
    return choice({
      rng,
      prompt: `Choose the right form of haben:  ${s}  (${enPerf(p, v)})`,
      correct,
      wrong: ['habe', 'hast', 'hat', 'haben', 'habt'].filter((x) => x !== correct).slice(0, 4).map((x) => ({ label: x, misconception: 'haben-form', feedback: `${x} goes with ${SLOT_LABEL[HABEN.indexOf(x)]}.` })).slice(0, 3),
      hint: `Who is the subject? ${SLOT_LABEL[p.slot]}.`,
      explanation: `${s.replace('___', correct)} ${PERF_RULE}`,
    })
  }),

  G('gram.perf.regpick', 'grammar.perfect-haben', [2, 3], (rng) => {
    const v = rng.pick(REG_HABEN)
    const p = pickPerson(rng)
    const st = stemOf(v.inf)
    const s = `${cap(p.de)} ${aux(v, p)} ${v.mid} ___.`
    return choice({
      rng,
      prompt: `Choose the past participle of ${q(v.inf)}:  ${s}  (${enPerf(p, v)})`,
      correct: v.pp,
      wrong: [
        { label: `ge${st}en`, misconception: 'regular-as-strong', feedback: `${v.inf} is regular: ge- + stem + -t.` },
        { label: v.inf, misconception: 'infinitive-for-participle', feedback: 'The infinitive goes at the end with a modal or werden. The perfect needs the participle.' },
        { label: `${st}${/[dt]$/.test(st) ? 'et' : 't'}`, misconception: 'missing-ge', feedback: `Regular verbs add ge- at the front: ${v.pp}.` },
      ].filter((w) => w.label !== v.pp),
      hint: 'Regular participle: ge + stem + t.',
      explanation: `${s.replace('___', v.pp)} ${v.inf} → stem ${st}- → ${v.pp}. ${PERF_RULE}`,
    })
  }),

  G('gram.perf.regtype', 'grammar.perfect-haben', [3, 5], (rng, d) => {
    const pool = d === 5 ? REG_HABEN.filter((v) => /[dt]en$/.test(v.inf) || v.inf === 'chatten') : REG_HABEN
    const v = rng.pick(pool.length ? pool : REG_HABEN)
    const p = pickPerson(rng)
    const s = `${cap(p.de)} ${aux(v, p)} ${v.mid} ___.`
    return textItem({
      prompt: `Type the past participle of ${q(v.inf)} (${v.enInf}):  ${s}`,
      accept: accept(v.pp),
      placeholder: 'ge...t',
      hint: `ge + ${stemOf(v.inf)} + t${/[dt]$/.test(stemOf(v.inf)) ? ' (the stem ends in -t or -d...)' : ''}. ${TYPE_HINT}`,
      explanation: `${s.replace('___', v.pp)} ${PERF_RULE}`,
    })
  }),

  G('gram.perf.order', 'grammar.perfect-haben', [3, 4], (rng, d) => {
    const v = rng.pick([...REG_HABEN, ...IRR_HABEN])
    const p = pickPerson(rng)
    if (d === 4) {
      const t = rng.pick(PAST_TIMES)
      const correct = [cap(t), aux(v, p), p.de, v.mid, v.pp]
      return orderItem({
        rng,
        prompt: `Put the words in order. Start with ${q(cap(t))}.  (${cap(TIME_EN[t] ?? t)}, ${p.en} ${v.en}.)`,
        correct,
        direction: ['first', 'last'],
        hint: 'haben is the second idea, the participle goes last, and the subject comes straight after haben.',
        explanation: `${correct.join(' ')}. ${PERF_RULE}`,
      })
    }
    const correct = [cap(p.de), aux(v, p), v.mid, v.pp]
    return orderItem({
      rng,
      prompt: `Put the words in order. Start with the subject.  (${enPerf(p, v)})`,
      correct,
      direction: ['first', 'last'],
      hint: 'haben second, participle last.',
      explanation: `${perfSentence(p, v)} ${PERF_RULE}`,
    })
  }),

  G('gram.perf.translate', 'grammar.perfect-haben', [4, 5], (rng, d) => {
    const v = rng.pick(d === 4 ? REG_HABEN : [...REG_HABEN, ...IRR_HABEN])
    const p = pickPerson(rng)
    if (d === 5) {
      const t = rng.pick(PAST_TIMES)
      const variants = [perfInverted(t, p, v), `${cap(p.de)} ${aux(v, p)} ${t} ${v.mid} ${v.pp}.`]
      return textItem({
        prompt: `Translate into German:  ${cap(TIME_EN[t] ?? t)} ${p.en} ${v.en}.  (${t} = ${TIME_EN[t]}; ${v.inf} = ${v.enInf})`,
        accept: accept(...variants),
        placeholder: 'Type the sentence',
        hint: `haben second, participle last. If you start with "${cap(t)}", the subject comes after haben. ${TYPE_HINT}`,
        explanation: `${variants[0]} (or: ${variants[1]}) ${PERF_RULE}`,
      })
    }
    return textItem({
      prompt: `Translate into German:  ${enPerf(p, v)}  (${v.inf} = ${v.enInf})`,
      accept: accept(perfSentence(p, v)),
      placeholder: 'Type the sentence',
      hint: `Subject + haben + ... + participle. ${TYPE_HINT}`,
      explanation: `${perfSentence(p, v)} ${PERF_RULE}`,
    })
  }),
]

// =================================================================== irregular participles

function irrWrong(v: PerfVerb) {
  const out = [
    { label: regularPp(v.inf), misconception: 'strong-as-regular', feedback: `${v.inf} is irregular: its participle ends in -en.` },
    { label: v.inf, misconception: 'infinitive-for-participle', feedback: 'That is the infinitive.' },
    { label: present3(v.inf), misconception: 'present-for-participle', feedback: 'That is the present tense (er/sie/es form).' },
    { label: `ge${v.inf}`, misconception: 'ge-plus-infinitive', feedback: `Close, but the vowel changes: ${v.pp}.` },
  ]
  return out.filter((w, i) => w.label !== v.pp && out.findIndex((x) => x.label === w.label) === i)
}

const perfectIrregularGenerators: ItemGenerator[] = [
  G('gram.perfirr.match', 'grammar.perfect-irregular', [1, 3], (rng) => {
    const four = pickN(rng, IRR_HABEN, 4)
    return matchItem({
      prompt: 'Match each verb to its past participle.',
      pairs: four.map((v) => ({ left: v.inf, right: v.pp })),
      hint: 'Irregular participles end in -en, and the vowel often changes.',
      explanation: four.map((v) => `${v.inf} → ${v.pp}`).join('; ') + `. ${IRR_RULE}`,
    })
  }),

  G('gram.perfirr.pick', 'grammar.perfect-irregular', [2, 4], (rng) => {
    const v = rng.pick(IRR_HABEN)
    const p = pickPerson(rng)
    const s = `${cap(p.de)} ${aux(v, p)} ${v.mid} ___.`
    return choice({
      rng,
      prompt: `Choose the past participle of ${q(v.inf)}:  ${s}  (${enPerf(p, v)})`,
      correct: v.pp,
      wrong: pickN(rng, irrWrong(v), 3),
      hint: `${v.inf} is irregular. Say the whole sentence out loud.`,
      explanation: `${s.replace('___', v.pp)} ${v.type === 'mixed' ? `${v.inf} is a mixed verb: ge- ... -t with a vowel change.` : IRR_RULE}`,
    })
  }),

  G('gram.perfirr.type', 'grammar.perfect-irregular', [3, 5], (rng, d) => {
    const v = rng.pick(d === 5 ? [...IRR_HABEN, ...SIMPLE_SEIN.filter((x) => x.type === 'irregular')] : IRR_HABEN)
    const p = pickPerson(rng)
    const s = `${cap(p.de)} ${aux(v, p)} ${v.mid} ___.`
    return textItem({
      prompt: `Type the past participle of ${q(v.inf)} (${v.enInf}):  ${s}`,
      accept: accept(v.pp),
      placeholder: 'ge...en',
      hint: `It starts with ge- and ${v.type === 'mixed' ? 'ends in -t (it is a mixed verb)' : 'ends in -en'}. ${TYPE_HINT}`,
      explanation: `${s.replace('___', v.pp)} ${IRR_RULE}`,
    })
  }),
]

// =================================================================== perfect with sein

const MIXED_AUX = PERFECT.filter((v) => v.type !== 'separable' && v.type !== 'ieren')

const perfectSeinGenerators: ItemGenerator[] = [
  G('gram.perfsein.choose', 'grammar.perfect-sein', [1, 3], (rng, d) => {
    // Half sein verbs, half haben verbs, so the answer isn't always "sein".
    const v = rng.pick(rng.chance(0.55) ? SIMPLE_SEIN : MIXED_AUX.filter((x) => x.aux === 'haben'))
    if (d === 1) {
      return choice({
        rng,
        prompt: `Does ${q(v.inf)} (${v.enInf}) form its perfect tense with haben or sein?`,
        correct: v.aux,
        wrong: [{ label: v.aux === 'haben' ? 'sein' : 'haben', misconception: v.aux === 'haben' ? 'haben-verb-with-sein' : 'sein-verb-with-haben', feedback: seinWhy(v) }],
        keepOrder: true,
        hint: 'Is it movement from A to B, or a change of state?',
        explanation: `${seinWhy(v)} ${SEIN_RULE}`,
      })
    }
    const p = pickPerson(rng)
    const correct = aux(v, p)
    const otherAux = (v.aux === 'haben' ? SEIN : HABEN)[p.slot]
    const s = `${cap(p.de)} ___ ${v.mid} ${v.pp}.`
    return choice({
      rng,
      prompt: `haben or sein? Choose the right word:  ${s}  (${enPerf(p, v)})`,
      correct,
      wrong: [
        { label: otherAux, misconception: v.aux === 'haben' ? 'haben-verb-with-sein' : 'sein-verb-with-haben', feedback: seinWhy(v) },
        ...auxForms(v).filter((x) => x !== correct).slice(0, 2).map((x) => ({ label: x, misconception: 'aux-person', feedback: `Right verb, wrong person: ${x} goes with ${SLOT_LABEL[auxForms(v).indexOf(x) as Slot]}.` })),
      ],
      hint: 'Movement from A to B or a change of state → sein. Otherwise haben.',
      explanation: `${s.replace('___', correct)} ${seinWhy(v)}`,
    })
  }),

  G('gram.perfsein.form', 'grammar.perfect-sein', [2, 4], (rng) => {
    const v = rng.pick(SIMPLE_SEIN)
    const p = pickPerson(rng)
    const correct = SEIN[p.slot]
    const s = `${cap(p.de)} ___ ${v.mid} ${v.pp}.`
    return choice({
      rng,
      prompt: `Choose the right form of sein:  ${s}  (${enPerf(p, v)})`,
      correct,
      wrong: [
        { label: HABEN[p.slot], misconception: 'sein-verb-with-haben', feedback: seinWhy(v) },
        ...['bin', 'bist', 'ist', 'sind', 'seid'].filter((x) => x !== correct).map((x) => ({ label: x, misconception: 'sein-form', feedback: `${x} goes with ${SLOT_LABEL[SEIN.indexOf(x) as Slot]}.` })),
      ].slice(0, 4),
      hint: `${v.inf} takes sein. Which form goes with ${SLOT_LABEL[p.slot]}?`,
      explanation: `${s.replace('___', correct)} ${seinWhy(v)} sein: bin, bist, ist, sind, seid, sind.`,
    })
  }),

  G('gram.perfsein.type', 'grammar.perfect-sein', [3, 5], (rng, d) => {
    const v = rng.pick(d >= 4 ? MIXED_AUX : SIMPLE_SEIN)
    const p = pickPerson(rng)
    if (d === 5) {
      const t = rng.pick(PAST_TIMES)
      const variants = [perfInverted(t, p, v), `${cap(p.de)} ${aux(v, p)} ${t} ${v.mid} ${v.pp}.`]
      return textItem({
        prompt: `Translate into German:  ${cap(TIME_EN[t] ?? t)} ${p.en} ${v.en}.  (${t} = ${TIME_EN[t]}; ${v.inf} → ${v.pp})`,
        accept: accept(...variants),
        placeholder: 'Type the sentence',
        hint: `haben or sein? ${TYPE_HINT}`,
        explanation: `${variants[0]} ${seinWhy(v)}`,
      })
    }
    const correct = aux(v, p)
    const s = `${cap(p.de)} ___ ${v.mid} ${v.pp}.`
    return textItem({
      prompt: `Type the right form of haben or sein:  ${s}  (${enPerf(p, v)})`,
      accept: [correct],
      placeholder: 'haben or sein form',
      hint: 'Movement or change of state → sein.',
      explanation: `${s.replace('___', correct)} ${seinWhy(v)}`,
    })
  }),

  G('gram.perfsein.write', 'grammar.perfect-sein', [3, 5], (rng) => {
    const task = rng.pick([
      {
        prompt: 'Write 3-4 sentences in German about what you did last weekend. Use the perfect tense with both haben and sein, and start at least one sentence with a time phrase.',
        model: 'Letztes Wochenende bin ich mit meiner Familie nach Brighton gefahren. Wir haben am Strand Eis gegessen und ich bin im Meer geschwommen. Am Sonntag bin ich zu Hause geblieben und habe einen Film gesehen.',
      },
      {
        prompt: 'Write 3-4 sentences in German about a day out in town. Use the perfect tense with both haben and sein.',
        model: 'Am Samstag bin ich mit Lena in die Stadt gegangen. Wir haben Kleidung gekauft und ich habe eine Jacke gefunden. Danach sind wir ins Café gegangen und haben Kuchen gegessen.',
      },
      {
        prompt: 'Write 3-4 sentences in German about your last holiday. Use the perfect tense with both haben and sein.',
        model: 'In den Sommerferien bin ich nach Österreich geflogen. Wir haben in einem Hotel gewohnt. Jeden Tag bin ich in den Bergen gewandert, und am Abend habe ich viele Fotos gemacht.',
      },
    ])
    return reveal({
      prompt: task.prompt,
      model: task.model,
      checklist: ['Uses haben + past participle at least once', 'Uses sein + past participle for a verb of movement', 'Puts the participle at the end of each sentence', 'Starts a sentence with a time phrase and puts the verb second (Letztes Wochenende bin ich...)', 'Uses at least one irregular participle correctly (gegessen, gefahren, gesehen...)'],
      passMark: 3,
      hint: 'gehen, fahren, fliegen, schwimmen, bleiben → sein. Most other verbs → haben.',
    })
  }),
]

// =================================================================== separable, inseparable and -ieren participles

const SEP_PREFIXES = ['fern', 'auf', 'aus', 'ein', 'mit', 'an', 'ab', 'zu']
function noGeWrong(v: PerfVerb) {
  const out: { label: string; misconception: string; feedback: string }[] = []
  if (v.type === 'separable') {
    const pre = SEP_PREFIXES.find((p) => v.inf.startsWith(p)) ?? ''
    const rest = v.pp.slice(pre.length).replace(/^ge/, '')
    out.push({ label: `ge${pre}${rest}`, misconception: 'ge-before-prefix', feedback: `With a separable verb, ge- goes between the prefix and the verb: ${v.pp}.` })
    out.push({ label: `${pre}${rest}`, misconception: 'separable-missing-ge', feedback: `Separable verbs keep ge-, between the prefix and the verb: ${v.pp}.` })
    out.push({ label: `ge${rest}${pre}`, misconception: 'prefix-at-end', feedback: `The prefix stays at the front of the participle: ${v.pp}.` })
  } else {
    out.push({ label: `ge${v.pp}`, misconception: v.type === 'ieren' ? 'ge-on-ieren' : 'ge-on-inseparable', feedback: v.type === 'ieren' ? 'Verbs ending in -ieren never take ge-.' : `${v.inf} has an inseparable prefix (${v.inf.slice(0, 2)}-), so there is no ge-.` })
    out.push({ label: v.inf, misconception: 'infinitive-for-participle', feedback: 'That is the infinitive.' })
    out.push({ label: present3(v.inf), misconception: 'present-for-participle', feedback: 'That is the present tense.' })
  }
  return out.filter((w, i) => w.label !== v.pp && out.findIndex((x) => x.label === w.label) === i)
}

const perfectSepGenerators: ItemGenerator[] = [
  G('gram.perfsep.pick', 'grammar.perfect-separable', [2, 4], (rng, d) => {
    const v = rng.pick(d === 2 ? NO_GE.filter((x) => x.type === 'separable') : NO_GE)
    const p = pickPerson(rng)
    const s = `${cap(p.de)} ${aux(v, p)} ${v.mid} ___.`
    return choice({
      rng,
      prompt: `Choose the past participle of ${q(v.inf)} (${v.enInf}):  ${s}`,
      correct: v.pp,
      wrong: noGeWrong(v),
      hint: v.type === 'separable' ? 'Where does ge- go in a separable verb?' : 'Does this verb take ge- at all?',
      explanation: `${s.replace('___', v.pp)} ${NOGE_RULE}`,
    })
  }),

  G('gram.perfsep.type', 'grammar.perfect-separable', [3, 5], (rng) => {
    const v = rng.pick(NO_GE)
    const p = pickPerson(rng)
    const s = `${cap(p.de)} ${aux(v, p)} ${v.mid} ___.`
    return textItem({
      prompt: `Type the past participle of ${q(v.inf)} (${v.enInf}):  ${s}`,
      accept: accept(v.pp),
      placeholder: 'Participle',
      hint: `${v.type === 'separable' ? 'Separable: prefix + ge + ...' : v.type === 'ieren' ? 'An -ieren verb.' : 'An inseparable prefix.'} ${TYPE_HINT}`,
      explanation: `${s.replace('___', v.pp)} ${NOGE_RULE}`,
    })
  }),

  G('gram.perfsep.order', 'grammar.perfect-separable', [3, 4], (rng, d) => {
    const v = rng.pick(NO_GE)
    const p = pickPerson(rng)
    const t = rng.pick(PAST_TIMES)
    const correct = d === 4 ? [cap(t), aux(v, p), p.de, v.mid, v.pp] : [cap(p.de), aux(v, p), v.mid, v.pp]
    return orderItem({
      rng,
      prompt: `Put the words in order. Start with ${d === 4 ? q(cap(t)) : 'the subject'}.  (${d === 4 ? `${cap(TIME_EN[t] ?? t)}, ${p.en} ${v.en}` : enPerf(p, v).replace(/\.$/, '')}.)`,
      correct,
      direction: ['first', 'last'],
      hint: 'The helping verb is second and the participle is last.',
      explanation: `${correct.join(' ')}. ${seinWhy(v)} ${NOGE_RULE}`,
    })
  }),
]

// =================================================================== imperfect: war, hatte, es gab

interface Past {
  s: string
  slot: Slot
  rest: string
  en: string
  verb: 'war' | 'hatte'
  note?: string
}

const PAST: Past[] = [
  { s: 'Das Wetter', slot: 2, rest: 'schön', en: 'The weather was nice.', verb: 'war' },
  { s: 'Ich', slot: 0, rest: 'in Wien', en: 'I was in Vienna.', verb: 'war' },
  { s: 'Wir', slot: 3, rest: 'im Urlaub', en: 'We were on holiday.', verb: 'war' },
  { s: 'Das Hotel', slot: 2, rest: 'sehr modern', en: 'The hotel was very modern.', verb: 'war' },
  { s: 'Die Ferien', slot: 5, rest: 'super', en: 'The holidays were great.', verb: 'war' },
  { s: 'Du', slot: 1, rest: 'sehr müde', en: 'You were very tired.', verb: 'war' },
  { s: 'Ihr', slot: 4, rest: 'nicht zu Hause', en: 'You (all) were not at home.', verb: 'war' },
  { s: 'Das Essen', slot: 2, rest: 'lecker', en: 'The food was delicious.', verb: 'war' },
  { s: 'Meine Eltern', slot: 5, rest: 'in Italien', en: 'My parents were in Italy.', verb: 'war' },
  { s: 'Der Film', slot: 2, rest: 'langweilig', en: 'The film was boring.', verb: 'war' },
  { s: 'Ich', slot: 0, rest: 'keine Zeit', en: 'I had no time.', verb: 'hatte' },
  { s: 'Wir', slot: 3, rest: 'viel Spaß', en: 'We had a lot of fun.', verb: 'hatte' },
  { s: 'Lena', slot: 2, rest: 'einen Hund', en: 'Lena had a dog.', verb: 'hatte' },
  { s: 'Ihr', slot: 4, rest: 'ein großes Zimmer', en: 'You (all) had a big room.', verb: 'hatte' },
  { s: 'Das Hotel', slot: 2, rest: 'ein Schwimmbad', en: 'The hotel had a swimming pool.', verb: 'hatte' },
  { s: 'Mein Opa', slot: 2, rest: 'ein altes Auto', en: 'My grandad had an old car.', verb: 'hatte' },
  { s: 'Du', slot: 1, rest: 'Glück', en: 'You were lucky.', verb: 'hatte', note: 'German says "Glück haben" (to have luck), so it is hatte, not war.' },
  { s: 'Die Kinder', slot: 5, rest: 'Hunger', en: 'The children were hungry.', verb: 'hatte', note: 'German says "Hunger haben" (to have hunger), so it is hatte, not war.' },
]

const IMPF_RULE = 'sein → war (ich war, du warst, er war, wir waren, ihr wart, sie waren). haben → hatte (ich hatte, du hattest, er hatte, wir hatten, ihr hattet, sie hatten). es gab + accusative = there was / there were.'
const pastForm = (x: Past) => (x.verb === 'war' ? WAR : HATTE)[x.slot]

const ES_GAB_NOUNS = NOUNS.filter((n) => n.cat === 'place' && !['Stadt', 'Schule', 'Rathaus'].includes(n.de))

const imperfectGenerators: ItemGenerator[] = [
  G('gram.impf.pick', 'grammar.imperfect', [1, 3], (rng, d) => {
    const x = rng.pick(d === 1 ? PAST.filter((y) => !y.note && (y.slot === 0 || y.slot === 2)) : PAST)
    const correct = pastForm(x)
    const otherVerb = (x.verb === 'war' ? HATTE : WAR)[x.slot]
    const s = `${x.s} ___ ${x.rest}.`
    return choice({
      rng,
      prompt: `Choose the past tense verb:  ${s}  (${x.en})`,
      correct,
      wrong: [
        { label: otherVerb, misconception: x.verb === 'war' ? 'hatte-for-war' : 'war-for-hatte', feedback: x.note ?? (x.verb === 'war' ? 'hatte means "had". Here you need "was / were".' : 'war means "was". Here you need "had".') },
        { label: (x.verb === 'war' ? SEIN : HABEN)[x.slot], misconception: 'present-for-past', feedback: 'That is the present tense.' },
        ...(x.verb === 'war' ? WAR : HATTE).filter((f) => f !== correct).slice(0, 2).map((f) => ({ label: f, misconception: 'past-person', feedback: `Right verb, wrong person.` })),
      ].slice(0, 4),
      hint: `"was / were" → war; "had" → hatte. Then match the subject.`,
      explanation: `${s.replace('___', correct)} ${x.note ?? ''} ${IMPF_RULE}`.replace(/\s+/g, ' '),
    })
  }),

  G('gram.impf.esgab', 'grammar.imperfect', [2, 4], (rng, d) => {
    const n = rng.pick(ES_GAB_NOUNS)
    if (d === 2) {
      const art = einForm('ein', 'acc', n.g)
      return choice({
        rng,
        prompt: `What does this mean?  Es gab ${art} ${n.de}.`,
        correct: fixAn(`There was a ${n.en}.`),
        wrong: [
          { label: fixAn(`There is a ${n.en}.`), misconception: 'es-gab-as-present', feedback: 'es gibt = there is; es gab = there was.' },
          { label: fixAn(`It gave a ${n.en}.`), misconception: 'es-gab-literal', feedback: 'es gab is a fixed phrase meaning "there was / there were".' },
          { label: fixAn(`There will be a ${n.en}.`), misconception: 'es-gab-as-future', feedback: 'es gab is the past: there was.' },
        ],
        hint: 'es gibt = there is. es gab is its past.',
        explanation: `Es gab ${art} ${n.de} = ${fixAn(`There was a ${n.en}.`)} ${IMPF_RULE}`,
      })
    }
    const neg = d === 4 && rng.chance(0.4)
    const correct = einForm(neg ? 'kein' : 'ein', 'acc', n.g)
    return choice({
      rng,
      prompt: `Choose the right word:  Es gab ___ ${n.de}.  (${fixAn(`There was ${neg ? 'no' : 'a'} ${n.en}.`)})`,
      correct,
      wrong: [neg ? 'kein' : 'ein', neg ? 'keine' : 'eine', neg ? 'keinen' : 'einen']
        .filter((x) => x !== correct)
        .map((x) => (n.g === 'm' && !x.endsWith('en') ? { label: x, misconception: 'nominative-after-es-gab', feedback: 'es gab is followed by the accusative: einen / keinen for masculine nouns.' } : { label: x, misconception: 'wrong-gender', feedback: `${n.de} is ${n.g === 'm' ? 'masculine' : n.g === 'f' ? 'feminine' : 'neuter'}.` })),
      keepOrder: true,
      hint: 'es gab (like es gibt) takes the accusative.',
      explanation: `Es gab ${correct} ${n.de}. es gab is followed by the accusative, so masculine nouns take einen / keinen.`,
    })
  }),

  G('gram.impf.type', 'grammar.imperfect', [3, 5], (rng, d) => {
    const x = rng.pick(d === 3 ? PAST.filter((y) => !y.note) : PAST)
    const correct = pastForm(x)
    const s = `${x.s} ___ ${x.rest}.`
    return textItem({
      prompt: `Type war or hatte in the right form:  ${s}  (${x.en})`,
      accept: [correct],
      placeholder: 'war / hatte...',
      hint: `${SLOT_LABEL[x.slot]} form. ${d === 5 ? 'Careful: some English "was / were" phrases use haben in German.' : ''}`.trim(),
      explanation: `${s.replace('___', correct)} ${x.note ?? ''} ${IMPF_RULE}`.replace(/\s+/g, ' '),
    })
  }),
]

// =================================================================== future with werden

const EN_PAST: Record<string, string> = { go: 'went', get: 'got', eat: 'ate', speak: 'spoke', read: 'read', swim: 'swam', do: 'did', tidy: 'tidied', play: 'played' }
const FUT_RULE = 'Future: werden (second idea) + infinitive at the end. werden: ich werde, du wirst, er wird, wir werden, ihr werdet, sie werden. Careful: "ich will" means "I want", not "I will".'
const FUT_ACTS = ACTIVITIES.filter((a) => !/heute|am /.test(a.mid))
const futSentence = (p: Person, a: (typeof ACTIVITIES)[number]) => `${cap(p.de)} ${WERDEN[p.slot]} ${a.mid} ${a.inf}.`
const enFut = (p: Person, a: (typeof ACTIVITIES)[number]) => `${cap(p.en)} will ${a.en}.`

const futureGenerators: ItemGenerator[] = [
  G('gram.fut.form', 'grammar.future', [1, 3], (rng, d) => {
    const a = rng.pick(FUT_ACTS)
    if (d === 1) {
      return choice({
        rng,
        prompt: `What does this mean?  Ich werde ${a.mid} ${a.inf}.`,
        correct: `I will ${a.en}.`,
        wrong: [
          { label: `I want to ${a.en}.`, misconception: 'werden-as-wollen', feedback: '"I want to" is "ich will". werden makes the future.' },
          { label: `I ${a.en.replace(/^(\w+)/, (m) => EN_PAST[m] ?? `${m}ed`)}.`, misconception: 'future-as-past', feedback: 'werden + infinitive is the future.' },
          { label: `I can ${a.en}.`, misconception: 'werden-as-koennen', feedback: '"I can" is "ich kann".' },
        ],
        hint: 'werden + infinitive.',
        explanation: `Ich werde ${a.mid} ${a.inf} = I will ${a.en}. ${FUT_RULE}`,
      })
    }
    const p = rng.pick(PERSONS)
    const correct = WERDEN[p.slot]
    const t = rng.pick(FUTURE_TIMES)
    const s = `${cap(t)} ___ ${p.de} ${a.mid} ${a.inf}.`
    return choice({
      rng,
      prompt: `Choose the right form of werden:  ${s}  (${cap(TIME_EN[t] ?? t)} ${p.en} will ${a.en}.)`,
      correct,
      wrong: [
        ...['werde', 'wirst', 'wird', 'werden', 'werdet'].filter((x) => x !== correct).map((x) => ({ label: x, misconception: 'werden-form', feedback: `${x} goes with ${SLOT_LABEL[WERDEN.indexOf(x) as Slot]}.` })),
      ].slice(0, 3),
      hint: `Subject: ${p.de}. werden is irregular with du (wirst) and er/sie/es (wird).`,
      explanation: `${s.replace('___', correct)} ${FUT_RULE}`,
    })
  }),

  G('gram.fut.order', 'grammar.future', [2, 4], (rng, d) => {
    const a = rng.pick(FUT_ACTS)
    const p = rng.pick(PERSONS)
    const t = rng.pick(FUTURE_TIMES)
    const correct = d === 4 ? [cap(t), WERDEN[p.slot], p.de, a.mid, a.inf] : [cap(p.de), WERDEN[p.slot], a.mid, a.inf]
    return orderItem({
      rng,
      prompt: `Put the words in order. Start with ${d === 4 ? q(cap(t)) : 'the subject'}.  (${d === 4 ? `${cap(TIME_EN[t] ?? t)} ${p.en} will ${a.en}.` : enFut(p, a)})`,
      correct,
      direction: ['first', 'last'],
      hint: 'werden second, infinitive last.',
      explanation: `${correct.join(' ')}. ${FUT_RULE}`,
    })
  }),

  G('gram.fut.translate', 'grammar.future', [3, 5], (rng, d) => {
    const a = rng.pick(FUT_ACTS)
    const p = d === 3 ? (PERSONS[0] as Person) : rng.pick(PERSONS)
    if (d >= 4) {
      const t = rng.pick(FUTURE_TIMES)
      const variants = [`${cap(t)} ${WERDEN[p.slot]} ${p.de} ${a.mid} ${a.inf}.`, `${cap(p.de)} ${WERDEN[p.slot]} ${t} ${a.mid} ${a.inf}.`]
      return textItem({
        prompt: `Translate into German, using werden:  ${cap(TIME_EN[t] ?? t)} ${p.en} will ${a.en}.  (${t} = ${TIME_EN[t]})`,
        accept: accept(...variants),
        placeholder: 'Type the sentence',
        hint: `werden second, ${a.inf} last. ${TYPE_HINT}`,
        explanation: `${variants[0]} (or: ${variants[1]}) ${FUT_RULE}`,
      })
    }
    return textItem({
      prompt: `Translate into German, using werden:  ${enFut(p, a)}`,
      accept: accept(futSentence(p, a)),
      placeholder: 'Type the sentence',
      hint: `ich werde ... ${a.inf}. ${TYPE_HINT}`,
      explanation: `${futSentence(p, a)} ${FUT_RULE}`,
    })
  }),

  G('gram.fut.write', 'grammar.future', [3, 5], (rng) => {
    const task = rng.pick([
      {
        prompt: 'Write 3-4 sentences in German about your plans for next weekend, using werden + infinitive and at least one time phrase at the start of a sentence.',
        model: 'Nächstes Wochenende werde ich meine Oma besuchen. Am Samstag werden wir zusammen kochen. Am Sonntag werde ich mit meinen Freunden ins Kino gehen, und danach werden wir Pizza essen.',
      },
      {
        prompt: 'Write 3-4 sentences in German about your future: where you will live, what job you will do, and what you will do in your free time.',
        model: 'In der Zukunft werde ich in einer großen Stadt wohnen. Ich werde Ärztin sein, weil ich Menschen helfen möchte. In meiner Freizeit werde ich viel reisen und Tennis spielen.',
      },
      {
        prompt: 'Write 3-4 sentences in German about your next holiday, using werden + infinitive.',
        model: 'Im Sommer werde ich mit meiner Familie nach Deutschland fahren. Wir werden in einem Hotel in München wohnen. Ich werde viele Fotos machen und jeden Tag Eis essen.',
      },
    ])
    return reveal({
      prompt: task.prompt,
      model: task.model,
      checklist: ['Uses werden in the right form for the subject (ich werde, wir werden)', 'Puts the infinitive at the very end', 'Starts a sentence with a time phrase and keeps werden second', 'Uses at least three different verbs in the infinitive'],
      passMark: 3,
      hint: 'werden second, infinitive last. After a time phrase: Nächstes Jahr werde ich...',
    })
  }),
]

// =================================================================== three time frames

const PRESENT_FORMS: Record<string, Forms> = Object.fromEntries([...REGULAR.map((v) => [v.inf, v.forms] as const), ...IRREGULAR.map((v) => [v.inf, v.forms] as const)])
const TF_VERBS = PERFECT.filter((v) => PRESENT_FORMS[v.inf] && !v.type.startsWith('insep'))

type Frame = 'past' | 'present' | 'future'

function tfSentence(frame: Frame, p: Person, v: PerfVerb, time?: string): string {
  const pres = PRESENT_FORMS[v.inf] as Forms
  const subjFirst = !time
  const t = time ? cap(time) : ''
  if (frame === 'past') return subjFirst ? perfSentence(p, v) : `${t} ${aux(v, p)} ${p.de} ${v.mid} ${v.pp}.`
  if (frame === 'future') return subjFirst ? `${cap(p.de)} ${WERDEN[p.slot]} ${v.mid} ${v.inf}.` : `${t} ${WERDEN[p.slot]} ${p.de} ${v.mid} ${v.inf}.`
  return subjFirst ? `${cap(p.de)} ${pres[p.slot]} ${v.mid}.` : `${t} ${pres[p.slot]} ${p.de} ${v.mid}.`
}

const TF_RULE = 'Past (perfect): haben/sein + participle at the end (Ich habe ... gespielt). Present: one verb, second (Ich spiele ...). Future: werden + infinitive at the end (Ich werde ... spielen). Time phrases help: gestern, letztes Wochenende (past); jeden Tag, normalerweise (present); morgen, nächstes Jahr (future).'

const timeFrameGenerators: ItemGenerator[] = [
  G('gram.tf.identify', 'grammar.time-frames', [2, 3], (rng, d) => {
    const v = rng.pick(TF_VERBS)
    const p = rng.pick(PERSONS)
    const useImpf = d === 3 && rng.chance(0.25)
    const frame: Frame = useImpf ? 'past' : rng.pick(['past', 'present', 'future'] as Frame[])
    const s = useImpf ? (() => { const x = rng.pick(PAST); return `${x.s} ${pastForm(x)} ${x.rest}.` })() : tfSentence(frame, p, v)
    const label: Record<Frame, string> = { past: 'past', present: 'present', future: 'future' }
    return choice({
      rng,
      prompt: `Is this sentence about the past, the present or the future?  ${s}`,
      correct: label[frame],
      wrong: (['past', 'present', 'future'] as Frame[]).filter((f) => f !== frame).map((f) => ({ label: label[f], misconception: `${frame}-as-${f}`, feedback: `Look at the verbs: ${frame === 'past' ? (useImpf ? 'war / hatte are past forms.' : 'haben/sein + a participle at the end is the perfect (past).') : frame === 'future' ? 'werden + an infinitive at the end is the future.' : 'one verb in the present, no participle or werden.'}` })),
      keepOrder: true,
      hint: 'Look for haben/sein + ge-...-t/-en, werden + infinitive, or war/hatte.',
      explanation: `${s} → ${label[frame]}. ${TF_RULE}`,
    })
  }),

  G('gram.tf.timeword', 'grammar.time-frames', [2, 4], (rng) => {
    const v = rng.pick(TF_VERBS)
    const p = rng.pick(PERSONS)
    // Only clear-cut past and future phrases. Wrong options are always ungrammatical or clash with the time
    // phrase: we never offer a present tense (German can use it for the future, and for vivid past narration),
    // nor a perfect with a future phrase (colloquial German allows "Morgen habe ich das gemacht").
    const frame = rng.pick(['past', 'future'] as Frame[])
    const t = rng.pick(frame === 'past' ? PAST_TIMES : FUTURE_TIMES)
    const correct = tfSentence(frame, p, v, t)
    const otherSlot = ((p.slot + 2) % 6) as Slot
    const wrong =
      frame === 'past'
        ? [
            { label: tfSentence('future', p, v, t), misconception: 'future-with-past-time', feedback: `"${t}" (${TIME_EN[t]}) is in the past, so you need the perfect tense.` },
            { label: `${cap(t)} ${aux(v, p)} ${p.de} ${v.mid} ${v.inf}.`, misconception: 'perfect-with-infinitive', feedback: 'The perfect needs the participle at the end, not the infinitive.' },
            { label: `${cap(t)} ${(v.aux === 'haben' ? SEIN : HABEN)[p.slot]} ${p.de} ${v.mid} ${v.pp}.`, misconception: 'wrong-auxiliary', feedback: seinWhy(v) },
          ]
        : [
            { label: `${cap(t)} ${WERDEN[p.slot]} ${p.de} ${v.mid} ${v.pp}.`, misconception: 'werden-with-participle', feedback: 'werden needs the infinitive at the end, not the participle.' },
            { label: `${cap(t)} ${WERDEN[p.slot]} ${p.de} ${v.inf} ${v.mid}.`, misconception: 'infinitive-not-last', feedback: 'The infinitive goes to the very end.' },
            ...(WERDEN[otherSlot] !== WERDEN[p.slot] ? [{ label: `${cap(t)} ${WERDEN[otherSlot]} ${p.de} ${v.mid} ${v.inf}.`, misconception: 'werden-form', feedback: `With ${p.de} the form of werden is ${WERDEN[p.slot]}.` }] : []),
          ]
    return choice({
      rng,
      prompt: `Which sentence fits the time phrase ${q(cap(t))} (${TIME_EN[t]})?`,
      correct,
      wrong,
      hint: `Is "${t}" in the past, the present or the future?`,
      explanation: `${correct} ${TF_RULE}`,
    })
  }),

  G('gram.tf.convert', 'grammar.time-frames', [4, 5], (rng, d) => {
    const v = rng.pick(TF_VERBS)
    const p = d === 4 ? (PERSONS[0] as Person) : rng.pick(PERSONS)
    const target: Frame = rng.pick(['past', 'future'] as Frame[])
    const from = tfSentence('present', p, v)
    const to = tfSentence(target, p, v)
    return textItem({
      prompt: `Rewrite in the ${target === 'past' ? 'perfect tense (past)' : 'future tense with werden'}:  ${from}`,
      accept: accept(to),
      placeholder: 'Type the whole sentence',
      hint: `${target === 'past' ? `haben or sein? Participle of ${v.inf}?` : 'werden form + infinitive at the end.'} ${TYPE_HINT}`,
      explanation: `${to} ${target === 'past' ? seinWhy(v) : ''} ${TF_RULE}`.replace(/\s+/g, ' '),
    })
  }),

  G('gram.tf.write', 'grammar.time-frames', [4, 5], (rng) => {
    const task = rng.pick([
      {
        prompt: 'Write 4-5 sentences in German about your free time: what you normally do at the weekend, what you did last weekend, and what you will do next weekend.',
        model: 'Normalerweise spiele ich am Samstag Tennis. Letztes Wochenende bin ich aber ins Kino gegangen, und der Film war super. Nächstes Wochenende werde ich meine Oma besuchen, weil sie Geburtstag hat.',
      },
      {
        prompt: 'Write 4-5 sentences in German about holidays: where you usually go, where you went last year, and where you will go next year.',
        model: 'Normalerweise fahren wir im Sommer an die Küste. Letztes Jahr sind wir nach Spanien geflogen, und es war sehr heiß. Nächstes Jahr werden wir nach Österreich fahren, um in den Bergen zu wandern.',
      },
      {
        prompt: 'Write 4-5 sentences in German about school: what you do every day, what you did yesterday, and what you will do tomorrow.',
        model: 'Jeden Tag fahre ich mit dem Bus zur Schule. Gestern hatte ich Mathe und Deutsch, und ich habe einen Test geschrieben. Morgen werde ich Sport haben, und ich werde Hockey spielen.',
      },
    ])
    return reveal({
      prompt: task.prompt,
      model: task.model,
      checklist: ['Uses the present tense correctly', 'Uses the perfect tense (haben/sein + participle at the end)', 'Uses the future with werden + infinitive at the end', 'Uses a time phrase for each time frame (normalerweise, letztes..., nächstes...)', 'Puts the verb second after each time phrase'],
      passMark: 3,
      hint: 'Present: one verb. Past: haben/sein + participle. Future: werden + infinitive.',
    })
  }),
]

export const tenseGenerators: ItemGenerator[] = [
  ...perfectHabenGenerators,
  ...perfectIrregularGenerators,
  ...perfectSeinGenerators,
  ...perfectSepGenerators,
  ...imperfectGenerators,
  ...futureGenerators,
  ...timeFrameGenerators,
]
