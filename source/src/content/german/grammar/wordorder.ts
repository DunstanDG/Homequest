import type { ItemGenerator } from '@/engine/registry'
import type { Rng } from '@/engine/types'
import { choice, generatorFor, orderItem, reveal, textItem } from '../../kit'
import { accept, cap, pickN, q, TYPE_HINT, words } from './data'

const G = generatorFor('german')

// =================================================================== clauses

/**
 * A clause as its parts. Main order: s fin mid tail. Inverted: fin s mid tail. Subordinate: s mid tail fin, where a
 * separable prefix joins its verb again (aufstehen) and a modal or auxiliary goes after the infinitive / participle.
 */
interface Clause {
  s: string
  fin: string
  mid?: string
  tail?: string
  /** tail is a separable prefix that joins back onto the verb in a subordinate clause. */
  sep?: boolean
}

const C = (s: string, fin: string, mid = '', tail = '', sep = false): Clause => ({ s, fin, mid, tail, sep })
const mainOrder = (c: Clause) => words(c.s, c.fin, c.mid, c.tail)
const invOrder = (c: Clause) => words(c.fin, c.s, c.mid, c.tail)
const subEnd = (c: Clause) => (c.sep ? `${c.tail}${c.fin}` : words(c.tail, c.fin))
const subOrder = (c: Clause) => words(c.s, c.mid, subEnd(c))
/** Wrong orders for a clause after a conjunction. */
const verbSecondWrong = (c: Clause) => words(c.fin, c.s, c.mid, c.tail)

// =================================================================== verb second and inversion

interface Statement {
  s: string
  fin: string
  rest: string
}

const STATEMENTS: Statement[] = [
  { s: 'ich', fin: 'spiele', rest: 'Fußball' },
  { s: 'ich', fin: 'lese', rest: 'ein Buch' },
  { s: 'wir', fin: 'fahren', rest: 'nach Berlin' },
  { s: 'mein Bruder', fin: 'sieht', rest: 'fern' },
  { s: 'Lena', fin: 'geht', rest: 'ins Kino' },
  { s: 'ich', fin: 'esse', rest: 'Pizza' },
  { s: 'meine Eltern', fin: 'arbeiten', rest: 'im Garten' },
  { s: 'ich', fin: 'räume', rest: 'mein Zimmer auf' },
  { s: 'wir', fin: 'essen', rest: 'im Restaurant' },
  { s: 'Jonas', fin: 'spielt', rest: 'Gitarre' },
  { s: 'ich', fin: 'besuche', rest: 'meine Oma' },
  { s: 'du', fin: 'hörst', rest: 'Musik' },
]
const TIMES = ['heute', 'morgen', 'am Samstag', 'am Wochenende', 'nach der Schule', 'manchmal', 'jeden Tag', 'am Abend']

const V2_RULE = 'The verb is always the second idea. If the sentence starts with something other than the subject (a time phrase like "Am Samstag"), the subject moves to just after the verb: Am Samstag spiele ich Fußball. This is called inversion.'

function v2Case(rng: Rng) {
  const st = rng.pick(STATEMENTS)
  const t = rng.pick(TIMES)
  const plain = `${cap(st.s)} ${st.fin} ${t} ${st.rest}.`
  const inverted = `${cap(t)} ${st.fin} ${st.s} ${st.rest}.`
  return { st, t, plain, inverted }
}

const verbSecondGenerators: ItemGenerator[] = [
  G('gram.v2.pick', 'grammar.verb-second', [1, 3], (rng, d) => {
    const { st, t, inverted } = v2Case(rng)
    if (d === 1) {
      const correct = `${cap(st.s)} ${st.fin} ${st.rest}.`
      return choice({
        rng,
        prompt: 'Which sentence has the words in the right order?',
        correct,
        wrong: [
          { label: `${cap(st.s)} ${st.rest} ${st.fin}.`, misconception: 'verb-not-second', feedback: 'The verb must be the second idea, straight after the subject.' },
          { label: `${cap(st.rest)} ${st.s} ${st.fin}.`, misconception: 'verb-last', feedback: 'The verb is never last in a simple sentence: it is second.' },
        ],
        hint: 'Find the verb. Where must it go?',
        explanation: `${correct} ${V2_RULE}`,
      })
    }
    return choice({
      rng,
      prompt: `Which sentence is correct?`,
      correct: inverted,
      wrong: [
        { label: `${cap(t)} ${st.s} ${st.fin} ${st.rest}.`, misconception: 'no-inversion', feedback: `"${cap(t)}" is the first idea, so the verb comes next and the subject goes after it.` },
        { label: `${cap(t)} ${st.s} ${st.rest} ${st.fin}.`, misconception: 'verb-last', feedback: 'The verb is never last in a main clause.' },
        { label: `${cap(st.fin)} ${t} ${st.s} ${st.rest}.`, misconception: 'verb-first', feedback: 'Verb first makes a question. In a statement the verb is second.' },
      ],
      hint: 'Count the ideas: the time phrase is idea 1. What must be idea 2?',
      explanation: `${inverted} ${V2_RULE}`,
    })
  }),

  G('gram.v2.order', 'grammar.verb-second', [2, 4], (rng) => {
    const { st, t, inverted } = v2Case(rng)
    const correct = [cap(t), st.fin, st.s, st.rest]
    return orderItem({
      rng,
      prompt: `Put the words in order. Start with ${q(cap(t))}.`,
      correct,
      direction: ['first', 'last'],
      hint: 'Time phrase, then the verb, then the subject.',
      explanation: `${inverted} ${V2_RULE}`,
    })
  }),

  G('gram.v2.type', 'grammar.verb-second', [3, 5], (rng) => {
    const { t, plain, inverted } = v2Case(rng)
    return textItem({
      prompt: `Rewrite the sentence so that it starts with ${q(cap(t))}:  ${plain}`,
      accept: accept(inverted),
      placeholder: `${cap(t)} ...`,
      hint: `Keep the verb second. ${TYPE_HINT}`,
      explanation: `${inverted} ${V2_RULE}`,
    })
  }),
]

// =================================================================== questions

interface QA {
  q: string
  a: string
  word: string
  /** Question words that would also be correct here, never offered as wrong options. */
  alsoOk?: string[]
}

const QAS: QA[] = [
  { q: '___ wohnst du?', a: 'Ich wohne in Hamburg.', word: 'Wo' },
  { q: '___ heißt du?', a: 'Ich heiße Lena.', word: 'Wie' },
  { q: '___ alt bist du?', a: 'Ich bin dreizehn.', word: 'Wie' },
  { q: '___ kommst du?', a: 'Ich komme aus Wien.', word: 'Woher' },
  { q: '___ fährst du in den Ferien?', a: 'Nach Spanien.', word: 'Wohin' },
  { q: '___ beginnt der Film?', a: 'Um acht Uhr.', word: 'Wann' },
  { q: '___ lernst du Deutsch?', a: 'Weil es Spaß macht.', word: 'Warum' },
  { q: '___ Geschwister hast du?', a: 'Ich habe zwei Brüder.', word: 'Wie viele' },
  { q: '___ kostet das T-Shirt?', a: 'Zehn Euro.', word: 'Wie viel', alsoOk: ['Was'] },
  { q: '___ ist das?', a: 'Das ist meine Tante.', word: 'Wer', alsoOk: ['Was'] },
  { q: '___ machst du am Wochenende?', a: 'Ich spiele Tennis.', word: 'Was' },
  { q: '___ spielst du Fußball?', a: 'Im Park.', word: 'Wo' },
  { q: '___ ist dein Geburtstag?', a: 'Im Mai.', word: 'Wann' },
  { q: '___ wohnt in Berlin?', a: 'Meine Tante.', word: 'Wer' },
  { q: '___ isst du gern?', a: 'Pizza.', word: 'Was' },
  { q: '___ geht es dir?', a: 'Gut, danke.', word: 'Wie' },
]
const QWORDS: Record<string, string> = { Wer: 'who', Was: 'what', Wo: 'where (at)', Wohin: 'where to', Woher: 'where from', Wann: 'when', Wie: 'how', Warum: 'why', 'Wie viele': 'how many', 'Wie viel': 'how much' }
const NEAR: Record<string, string[]> = { Wo: ['Wohin', 'Woher'], Wohin: ['Wo', 'Woher'], Woher: ['Wo', 'Wohin'], 'Wie viel': ['Wie viele'], 'Wie viele': ['Wie viel'], Wer: ['Wie'], Wie: ['Wer', 'Was'], Was: ['Wer', 'Wie'], Wann: ['Wo', 'Wie'], Warum: ['Was', 'Wie'] }

const Q_RULE = 'Yes/no questions put the verb first: Spielst du Tennis? Question-word questions put the question word first and the verb second: Wo wohnst du?'

interface YesNo {
  s: string
  fin: string
  rest: string
  en: string
}
const YES_NO: YesNo[] = [
  { s: 'du', fin: 'spielst', rest: 'Tennis', en: 'Do you play tennis?' },
  { s: 'Lena', fin: 'wohnt', rest: 'in Wien', en: 'Does Lena live in Vienna?' },
  { s: 'ihr', fin: 'habt', rest: 'einen Hund', en: 'Have you (all) got a dog?' },
  { s: 'du', fin: 'sprichst', rest: 'Deutsch', en: 'Do you speak German?' },
  { s: 'Ben', fin: 'kommt', rest: 'heute', en: 'Is Ben coming today?' },
  { s: 'deine Schwester', fin: 'ist', rest: 'zwölf', en: 'Is your sister twelve?' },
  { s: 'der Film', fin: 'beginnt', rest: 'um acht Uhr', en: 'Does the film start at eight o’clock?' },
  { s: 'du', fin: 'hast', rest: 'Geschwister', en: 'Have you got any brothers or sisters?' },
  { s: 'wir', fin: 'fahren', rest: 'mit dem Bus', en: 'Are we going by bus?' },
  { s: 'Mia', fin: 'spielt', rest: 'Gitarre', en: 'Does Mia play the guitar?' },
]
const yn = (x: YesNo) => `${cap(x.fin)} ${x.s} ${x.rest}?`

interface WQ {
  en: string
  answers: string[]
}
const WQS: WQ[] = [
  { en: 'Ask a friend where they live.', answers: ['Wo wohnst du?'] },
  { en: 'Ask a friend what they are called.', answers: ['Wie heißt du?'] },
  { en: 'Ask a friend how old they are.', answers: ['Wie alt bist du?'] },
  { en: 'Ask a friend where they come from.', answers: ['Woher kommst du?'] },
  { en: 'Ask a friend when their birthday is.', answers: ['Wann hast du Geburtstag?', 'Wann ist dein Geburtstag?'] },
  { en: 'Ask a friend what they are doing at the weekend.', answers: ['Was machst du am Wochenende?'] },
  { en: 'Ask a friend why they are learning German.', answers: ['Warum lernst du Deutsch?', 'Wieso lernst du Deutsch?', 'Weshalb lernst du Deutsch?'] },
  { en: 'Ask a friend how many brothers and sisters they have.', answers: ['Wie viele Geschwister hast du?'] },
  { en: 'Ask your teacher, politely, where she lives.', answers: ['Wo wohnen Sie?'] },
  { en: 'Ask a friend what they like eating.', answers: ['Was isst du gern?', 'Was isst du gerne?'] },
]

const questionGenerators: ItemGenerator[] = [
  G('gram.q.word', 'grammar.questions', [1, 3], (rng) => {
    const x = rng.pick(QAS)
    const banned = new Set([x.word, ...(x.alsoOk ?? [])])
    const near = (NEAR[x.word] ?? []).filter((w) => !banned.has(w))
    const rest = rng.shuffle(Object.keys(QWORDS).filter((w) => !banned.has(w) && !near.includes(w)))
    const wrong = [...near, ...rest].slice(0, 3).map((w) => ({ label: w, misconception: `${x.word}-vs-${w}`, feedback: `${w} means "${QWORDS[w]}". Look at the answer: ${x.a}` }))
    return choice({
      rng,
      prompt: `Choose the question word:  ${x.q}  –  ${x.a}`,
      correct: x.word,
      wrong,
      hint: 'Read the answer first: what information does it give?',
      explanation: `${x.q.replace('___', x.word)} ${x.word} = ${QWORDS[x.word]}. ${Q_RULE}`,
    })
  }),

  G('gram.q.order', 'grammar.questions', [2, 4], (rng, d) => {
    if (d >= 3 && rng.chance(0.5)) {
      const x = rng.pick(QAS.filter((y) => y.q.split(' ').length >= 3))
      const parts = x.q.replace('___', x.word).replace(/\?$/, '').split(' ')
      // Keep two-word question words ("Wie viele") and phrases ("der Film", "am Wochenende") as single chunks.
      const head = x.word.includes(' ') ? [x.word, parts[2] as string] : [parts[0] as string, parts[1] as string]
      const rest = parts.slice(x.word.includes(' ') ? 3 : 2)
      const tail = ['der', 'die', 'das'].includes(rest[0] ?? '') ? [rest.join(' ')] : rest.length > 2 ? [rest[0] as string, rest.slice(1).join(' ')] : rest
      const chunks = [...head, ...tail]
      const last = chunks.length - 1
      const correct = chunks.map((c, i) => (i === last ? `${c}?` : c))
      return orderItem({
        rng,
        prompt: `Put the words in order to make a question.  (Answer: ${x.a})`,
        correct,
        direction: ['first', 'last'],
        hint: 'Question word first, then the verb.',
        explanation: `${correct.join(' ')} ${Q_RULE}`,
      })
    }
    const x = rng.pick(YES_NO)
    const correct = [cap(x.fin), x.s, `${x.rest}?`]
    return orderItem({
      rng,
      prompt: `Put the words in order to make a yes/no question.  (${x.en})`,
      correct,
      direction: ['first', 'last'],
      hint: 'In a yes/no question the verb comes first.',
      explanation: `${yn(x)} ${Q_RULE}`,
    })
  }),

  G('gram.q.type', 'grammar.questions', [3, 5], (rng, d) => {
    if (d >= 4 && rng.chance(0.6)) {
      const x = rng.pick(WQS)
      return textItem({
        prompt: `Write the question in German. ${x.en}`,
        accept: accept(...x.answers),
        placeholder: 'Type the question',
        hint: `Question word first, verb second. ${TYPE_HINT}`,
        explanation: `${x.answers[0]}${x.answers.length > 1 ? ` (also: ${x.answers.slice(1).join(' ')})` : ''} ${Q_RULE}`,
      })
    }
    const x = rng.pick(YES_NO)
    const statement = `${cap(x.s)} ${x.fin} ${x.rest}.`
    return textItem({
      prompt: `Turn this statement into a yes/no question:  ${statement}`,
      accept: accept(yn(x)),
      placeholder: 'Type the question',
      hint: 'Which word moves to the front?',
      explanation: `${yn(x)} ${Q_RULE}`,
    })
  }),
]

// =================================================================== coordinating conjunctions

interface Pair {
  a: Clause
  b: Clause
  en: string
}

const CONJ_EN: Record<string, string> = { und: 'and', aber: 'but', oder: 'or', denn: 'because (for)' }

const COORD: Record<'und' | 'aber' | 'oder', Pair[]> = {
  und: [
    { a: C('ich', 'spiele', 'Tennis'), b: C('mein Bruder', 'spielt', 'Fußball'), en: 'I play tennis and my brother plays football.' },
    { a: C('wir', 'fahren', 'nach Spanien'), b: C('wir', 'schwimmen', 'im Meer'), en: 'We go to Spain and we swim in the sea.' },
    { a: C('ich', 'stehe', 'um sieben Uhr', 'auf', true), b: C('ich', 'frühstücke', 'schnell'), en: 'I get up at seven and I have a quick breakfast.' },
  ],
  aber: [
    { a: C('ich', 'habe', 'einen Hund'), b: C('ich', 'habe', 'keine Katze'), en: 'I have got a dog but I have not got a cat.' },
    { a: C('das Hotel', 'war', 'alt'), b: C('das Essen', 'war', 'lecker'), en: 'The hotel was old but the food was delicious.' },
    { a: C('Mathe', 'ist', 'schwierig'), b: C('ich', 'mag', 'es'), en: 'Maths is difficult but I like it.' },
  ],
  oder: [
    { a: C('wir', 'gehen', 'ins Kino'), b: C('wir', 'bleiben', 'zu Hause'), en: 'We are going to the cinema or we are staying at home.' },
    { a: C('ich', 'spiele', 'Fußball'), b: C('ich', 'sehe', '', 'fern', true), en: 'I play football or I watch TV.' },
  ],
}

/** Reason pairs: main clause + reason. Used for denn (word order unchanged) and weil (verb to the end). */
const REASONS: Pair[] = [
  { a: C('ich', 'bleibe', 'zu Hause'), b: C('es', 'regnet'), en: 'I am staying at home because it is raining.' },
  { a: C('ich', 'mag', 'Mathe'), b: C('es', 'ist', 'interessant'), en: 'I like maths because it is interesting.' },
  { a: C('ich', 'gehe', 'früh ins Bett'), b: C('ich', 'bin', 'müde'), en: 'I am going to bed early because I am tired.' },
  { a: C('ich', 'kann', 'heute nicht', 'kommen'), b: C('ich', 'habe', 'viele Hausaufgaben'), en: 'I cannot come today because I have got a lot of homework.' },
  { a: C('Lena', 'ist', 'traurig'), b: C('sie', 'hat', 'ihr Handy', 'verloren'), en: 'Lena is sad because she has lost her phone.' },
  { a: C('wir', 'fahren', 'nach Österreich'), b: C('wir', 'wollen', '', 'Ski fahren'), en: 'We are going to Austria because we want to go skiing.' },
  { a: C('ich', 'trinke', 'Wasser'), b: C('ich', 'habe', 'Durst'), en: 'I am drinking water because I am thirsty.' },
  { a: C('Ben', 'ist', 'müde'), b: C('er', 'ist', 'um fünf Uhr', 'aufgestanden'), en: 'Ben is tired because he got up at five o’clock.' },
  { a: C('ich', 'spiele', 'gern Tennis'), b: C('es', 'macht', 'Spaß'), en: 'I like playing tennis because it is fun.' },
  { a: C('ich', 'esse', 'keinen Fisch'), b: C('ich', 'bin', 'Vegetarierin'), en: 'I do not eat fish because I am a vegetarian.' },
  { a: C('Mia', 'ist', 'glücklich'), b: C('sie', 'hat', 'heute Geburtstag'), en: 'Mia is happy because it is her birthday today.' },
  { a: C('ich', 'lerne', 'Deutsch'), b: C('ich', 'möchte', 'in Berlin', 'wohnen'), en: 'I am learning German because I would like to live in Berlin.' },
  { a: C('ich', 'stehe', 'um sechs Uhr', 'auf', true), b: C('der Bus', 'fährt', 'um sieben Uhr', 'ab', true), en: 'I get up at six because the bus leaves at seven.' },
  { a: C('ich', 'finde', 'Kunst toll'), b: C('die Lehrerin', 'ist', 'sehr nett'), en: 'I think art is great because the teacher is very nice.' },
]

const COMMA = (conj: string) => (conj === 'und' || conj === 'oder' ? '' : ',')
const coordSentence = (p: Pair, conj: string) => `${cap(mainOrder(p.a))}${COMMA(conj)} ${conj} ${mainOrder(p.b)}.`
const CONJ_RULE = 'und, aber, oder and denn join two main clauses without changing the word order: the verb in the second clause is still second (…, denn es regnet). Put a comma before aber and denn.'

function coordCase(rng: Rng, d: number) {
  const conj = rng.pick(d <= 2 ? ['und', 'aber', 'oder', 'denn'] : ['denn', 'denn', 'aber', 'und', 'oder'])
  const p = conj === 'denn' ? rng.pick(REASONS.filter((x) => !!x.b.mid || !!x.b.tail)) : rng.pick(COORD[conj as 'und' | 'aber' | 'oder'])
  return { conj, p }
}

const conjunctionGenerators: ItemGenerator[] = [
  G('gram.conj.meaning', 'grammar.conjunctions', [1, 2], (rng) => {
    const conj = rng.pick(Object.keys(CONJ_EN))
    return choice({
      rng,
      prompt: `What does ${q(conj)} mean?`,
      correct: CONJ_EN[conj] as string,
      wrong: Object.keys(CONJ_EN)
        .filter((c) => c !== conj)
        .map((c) => ({ label: CONJ_EN[c] as string, misconception: `${conj}-vs-${c}`, feedback: `"${CONJ_EN[c]}" is ${c}.` })),
      hint: 'Think of a sentence: Ich spiele Tennis ___ Fußball.',
      explanation: 'und = and, aber = but, oder = or, denn = because. None of them changes the word order.',
    })
  }),

  G('gram.conj.pick', 'grammar.conjunctions', [2, 4], (rng, d) => {
    const { conj, p } = coordCase(rng, d)
    const start = `${cap(mainOrder(p.a))}${COMMA(conj)} ${conj}`
    return choice({
      rng,
      prompt: `Complete the sentence:  ${start} ___  (${p.en})`,
      correct: `${mainOrder(p.b)}.`,
      wrong: [
        { label: `${verbSecondWrong(p.b)}.`, misconception: 'inversion-after-conjunction', feedback: `${conj} does not count as an idea: the subject still comes first, then the verb.` },
        { label: `${subOrder(p.b)}.`, misconception: conj === 'denn' ? 'denn-like-weil' : 'verb-final-after-coord', feedback: `${conj} does not send the verb to the end (that is what weil does).` },
      ].filter((w) => w.label !== `${mainOrder(p.b)}.`),
      hint: `Does ${conj} change the word order?`,
      explanation: `${coordSentence(p, conj)} ${CONJ_RULE}`,
    })
  }),

  G('gram.conj.type', 'grammar.conjunctions', [3, 5], (rng, d) => {
    const { conj, p } = coordCase(rng, d)
    return textItem({
      prompt: `Join the two sentences with ${q(conj)}:  ${cap(mainOrder(p.a))}.  ${cap(mainOrder(p.b))}.`,
      // A comma before und / oder between two main clauses is optional, so accept it too.
      accept: accept(coordSentence(p, conj), ...(COMMA(conj) ? [] : [coordSentence(p, conj).replace(` ${conj} `, `, ${conj} `)])),
      placeholder: 'Type the joined sentence',
      hint: `${conj} = ${CONJ_EN[conj]}. Does the word order change? ${TYPE_HINT}`,
      explanation: `${coordSentence(p, conj)} ${CONJ_RULE}`,
    })
  }),
]

// =================================================================== weil

const weilSentence = (p: Pair) => `${cap(mainOrder(p.a))}, weil ${subOrder(p.b)}.`
const WEIL_RULE = 'weil (because) sends the verb to the end of its clause: …, weil es regnet. With two verbs, the one that changes (ist, habe, muss) goes last: weil er aufgestanden ist, weil ich kommen muss. Always put a comma before weil.'

function weilWrongs(p: Pair) {
  const right = subOrder(p.b)
  const out = [
    { label: mainOrder(p.b), misconception: 'weil-verb-second', feedback: 'After weil the verb goes to the end, not second.' },
    { label: verbSecondWrong(p.b), misconception: 'weil-inversion', feedback: 'weil does not invert: subject first, then the rest, and the verb last.' },
  ]
  if (p.b.tail && !p.b.sep) out.push({ label: words(p.b.s, p.b.mid, p.b.fin, p.b.tail), misconception: 'verb-cluster-order', feedback: `The verb that changes (${p.b.fin}) goes right at the end, after ${p.b.tail}.` })
  if (p.b.sep) out.push({ label: words(p.b.s, p.b.mid, p.b.fin, p.b.tail), misconception: 'separable-not-joined', feedback: `At the end of a weil clause the separable verb joins up again: ${p.b.tail}${p.b.fin}.` })
  return out.filter((w) => w.label !== right)
}

const weilGenerators: ItemGenerator[] = [
  G('gram.weil.pick', 'grammar.weil', [1, 4], (rng, d) => {
    // Clauses like "es regnet" look the same in every order, so they are only used in typed and ordering questions.
    const pool = (d <= 2 ? REASONS.filter((p) => !p.b.tail) : REASONS).filter((p) => !!p.b.mid || !!p.b.tail)
    const p = rng.pick(pool)
    return choice({
      rng,
      prompt: `Complete the sentence:  ${cap(mainOrder(p.a))}, weil ___  (${p.en})`,
      correct: `${subOrder(p.b)}.`,
      wrong: weilWrongs(p).map((w) => ({ ...w, label: `${w.label}.` })),
      hint: 'Where does the verb go after weil?',
      explanation: `${weilSentence(p)} ${WEIL_RULE}`,
    })
  }),

  G('gram.weil.order', 'grammar.weil', [2, 4], (rng, d) => {
    const pool = d === 2 ? REASONS.filter((p) => !p.b.tail && p.b.mid) : d === 3 ? REASONS.filter((p) => p.b.mid) : REASONS.filter((p) => p.b.tail)
    const p = rng.pick(pool)
    const end = p.b.sep ? [subEnd(p.b)] : [p.b.tail, p.b.fin].filter((x): x is string => !!x)
    const correct = ['weil', p.b.s, ...(p.b.mid ? [p.b.mid] : []), ...end]
    return orderItem({
      rng,
      prompt: `Complete the sentence by putting the words in order:  ${cap(mainOrder(p.a))}, ...  (${p.en})`,
      correct,
      direction: ['first', 'last'],
      hint: 'weil first, then the subject. Which word goes last?',
      explanation: `${weilSentence(p)} ${WEIL_RULE}`,
    })
  }),

  G('gram.weil.type', 'grammar.weil', [3, 5], (rng, d) => {
    const p = rng.pick(d === 3 ? REASONS.filter((x) => !x.b.tail) : REASONS)
    return textItem({
      prompt: `Join the two sentences with weil:  ${cap(mainOrder(p.a))}.  ${cap(mainOrder(p.b))}.`,
      accept: accept(weilSentence(p)),
      placeholder: 'Type the joined sentence',
      hint: `Comma, weil, then send the verb (${p.b.fin}) to the end. ${TYPE_HINT}`,
      explanation: `${weilSentence(p)} ${WEIL_RULE}`,
    })
  }),

  G('gram.weil.write', 'grammar.weil', [3, 5], (rng) => {
    const task = rng.pick([
      {
        prompt: 'Write 3-4 sentences in German giving your opinion of three school subjects, each with a reason using weil.',
        model: 'Ich mag Deutsch, weil die Lehrerin sehr nett ist. Ich finde Mathe schwierig, weil wir viele Hausaufgaben haben. Ich liebe Sport, weil ich gern Hockey spiele.',
      },
      {
        prompt: 'Write 3-4 sentences in German about your hobbies, giving a reason with weil for each one.',
        model: 'Ich spiele gern Gitarre, weil Musik mir Spaß macht. Ich lese oft, weil Bücher interessant sind. Ich sehe nicht gern fern, weil es langweilig ist.',
      },
      {
        prompt: 'Write 3-4 sentences in German about food you like and don’t like, giving a reason with weil each time.',
        model: 'Ich esse gern Pizza, weil sie lecker ist. Ich esse keinen Fisch, weil ich Vegetarierin bin. Ich trinke viel Wasser, weil es gesund ist.',
      },
    ])
    return reveal({
      prompt: task.prompt,
      model: task.model,
      checklist: ['Gives at least three opinions', 'Uses weil in each sentence, with a comma before it', 'Sends the verb to the end after weil', 'Uses at least two different opinion phrases (ich mag, ich finde..., gern / nicht gern)'],
      passMark: 3,
      hint: '…, weil + subject + … + verb.',
    })
  }),
]

// =================================================================== time - manner - place

interface TMP {
  s: string
  fin: string
  t: string
  m: string
  p: string
  en: string
}

const TMPS: TMP[] = [
  { s: 'ich', fin: 'fahre', t: 'am Montag', m: 'mit dem Bus', p: 'zur Schule', en: 'I go to school by bus on Monday.' },
  { s: 'wir', fin: 'fahren', t: 'im Sommer', m: 'mit dem Zug', p: 'nach Italien', en: 'We go to Italy by train in the summer.' },
  { s: 'Lena', fin: 'geht', t: 'heute', m: 'mit ihrer Freundin', p: 'ins Kino', en: 'Lena is going to the cinema with her friend today.' },
  { s: 'ich', fin: 'fahre', t: 'jeden Tag', m: 'mit dem Rad', p: 'zur Schule', en: 'I cycle to school every day.' },
  { s: 'mein Vater', fin: 'fährt', t: 'morgen', m: 'mit dem Auto', p: 'nach München', en: 'My father is driving to Munich tomorrow.' },
  { s: 'wir', fin: 'gehen', t: 'am Samstag', m: 'zu Fuß', p: 'in die Stadt', en: 'We are walking into town on Saturday.' },
  { s: 'ich', fin: 'fliege', t: 'in den Ferien', m: 'mit meiner Familie', p: 'nach Spanien', en: 'I am flying to Spain with my family in the holidays.' },
  { s: 'Jonas', fin: 'fährt', t: 'am Wochenende', m: 'mit dem Zug', p: 'nach Hamburg', en: 'Jonas is going to Hamburg by train at the weekend.' },
  { s: 'meine Eltern', fin: 'fahren', t: 'nächste Woche', m: 'mit dem Bus', p: 'nach Wien', en: 'My parents are going to Vienna by bus next week.' },
  { s: 'ich', fin: 'gehe', t: 'nach der Schule', m: 'schnell', p: 'nach Hause', en: 'I go home quickly after school.' },
]
const tmpSentence = (x: TMP) => `${cap(x.s)} ${x.fin} ${x.t} ${x.m} ${x.p}.`
const tmpInverted = (x: TMP) => `${cap(x.t)} ${x.fin} ${x.s} ${x.m} ${x.p}.`
const TMP_RULE = 'After the verb, put time (wann?) before manner (wie? mit wem?) before place (wohin? wo?): Ich fahre am Montag mit dem Bus zur Schule. You can also start with the time phrase: Am Montag fahre ich mit dem Bus zur Schule.'

const tmpGenerators: ItemGenerator[] = [
  G('gram.tmp.pick', 'grammar.time-manner-place', [2, 3], (rng) => {
    const x = rng.pick(TMPS)
    return choice({
      rng,
      prompt: `Which sentence follows the time - manner - place rule?  (${x.en})`,
      correct: tmpSentence(x),
      wrong: [
        { label: `${cap(x.s)} ${x.fin} ${x.p} ${x.m} ${x.t}.`, misconception: 'english-place-manner-time', feedback: 'That is the English order (place, manner, time). German puts time first.' },
        { label: `${cap(x.s)} ${x.fin} ${x.m} ${x.p} ${x.t}.`, misconception: 'time-last', feedback: 'In German the time phrase comes before manner and place.' },
        { label: `${cap(x.s)} ${x.fin} ${x.t} ${x.p} ${x.m}.`, misconception: 'place-before-manner', feedback: 'Manner (how) comes before place (where).' },
      ],
      hint: 'Wann? Wie? Wo(hin)? - in that order.',
      explanation: `${tmpSentence(x)} ${TMP_RULE}`,
    })
  }),

  G('gram.tmp.order', 'grammar.time-manner-place', [2, 4], (rng, d) => {
    const x = rng.pick(TMPS)
    const inv = d === 4
    const correct = inv ? [cap(x.t), x.fin, x.s, x.m, x.p] : [cap(x.s), x.fin, x.t, x.m, x.p]
    return orderItem({
      rng,
      prompt: `Put the words in order. Start with ${inv ? q(cap(x.t)) : 'the subject'}.  (${x.en})`,
      correct,
      direction: ['first', 'last'],
      hint: inv ? 'Time first, then the verb, then the subject, then manner, then place.' : 'Subject, verb, then time - manner - place.',
      explanation: `${correct.join(' ')}. ${TMP_RULE}`,
    })
  }),

  G('gram.tmp.type', 'grammar.time-manner-place', [3, 5], (rng) => {
    const x = rng.pick(TMPS)
    return textItem({
      prompt: `Translate into German:  ${x.en}  (use: ${x.fin}, ${x.t}, ${x.m}, ${x.p})`,
      accept: accept(tmpSentence(x), tmpInverted(x)),
      placeholder: 'Type the sentence',
      hint: `Verb second; then time - manner - place. ${TYPE_HINT}`,
      explanation: `${tmpSentence(x)} (or: ${tmpInverted(x)}) ${TMP_RULE}`,
    })
  }),
]

// =================================================================== dass, wenn, obwohl

interface Sub {
  conj: 'dass' | 'wenn' | 'obwohl'
  /** The main clause (for dass: the lead-in like "Ich glaube"). */
  main: Clause
  sub: Clause
  en: string
}

const SUBS: Sub[] = [
  { conj: 'wenn', main: C('ich', 'bleibe', 'zu Hause'), sub: C('es', 'regnet'), en: 'If it rains, I stay at home.' },
  { conj: 'wenn', main: C('ich', 'spiele', 'Tennis'), sub: C('ich', 'habe', 'Zeit'), en: 'When I have time, I play tennis.' },
  { conj: 'wenn', main: C('ich', 'gehe', 'früh ins Bett'), sub: C('ich', 'bin', 'müde'), en: 'When I am tired, I go to bed early.' },
  { conj: 'wenn', main: C('wir', 'gehen', '', 'schwimmen'), sub: C('das Wetter', 'ist', 'schön'), en: 'If the weather is nice, we go swimming.' },
  { conj: 'wenn', main: C('ich', 'esse', 'einen Apfel'), sub: C('ich', 'habe', 'Hunger'), en: 'When I am hungry, I eat an apple.' },
  { conj: 'wenn', main: C('wir', 'bauen', 'einen Schneemann'), sub: C('es', 'schneit'), en: 'When it snows, we build a snowman.' },
  { conj: 'wenn', main: C('wir', 'sehen', 'einen Film'), sub: C('meine Freunde', 'kommen'), en: 'When my friends come, we watch a film.' },
  { conj: 'wenn', main: C('ich', 'kann', 'nicht', 'ausgehen'), sub: C('ich', 'habe', 'Hausaufgaben'), en: 'If I have homework, I cannot go out.' },
  { conj: 'dass', main: C('ich', 'glaube'), sub: C('Mathe', 'ist', 'schwierig'), en: 'I think that maths is difficult.' },
  { conj: 'dass', main: C('ich', 'hoffe'), sub: C('das Wetter', 'ist', 'morgen schön'), en: 'I hope that the weather will be nice tomorrow.' },
  { conj: 'dass', main: C('ich', 'weiß'), sub: C('Lena', 'wohnt', 'in Wien'), en: 'I know that Lena lives in Vienna.' },
  { conj: 'dass', main: C('ich', 'finde'), sub: C('Sport', 'macht', 'Spaß'), en: 'I think that sport is fun.' },
  { conj: 'dass', main: C('ich', 'hoffe'), sub: C('ich', 'bekomme', 'eine gute Note'), en: 'I hope that I get a good mark.' },
  { conj: 'dass', main: C('ich', 'glaube'), sub: C('der Film', 'fängt', 'um acht Uhr', 'an', true), en: 'I think that the film starts at eight o’clock.' },
  { conj: 'dass', main: C('mein Vater', 'sagt'), sub: C('ich', 'muss', 'mein Zimmer', 'aufräumen'), en: 'My father says that I have to tidy my room.' },
  { conj: 'obwohl', main: C('ich', 'gehe', '', 'joggen'), sub: C('es', 'regnet'), en: 'I go jogging although it is raining.' },
  { conj: 'obwohl', main: C('ich', 'esse', 'Pizza'), sub: C('ich', 'habe', 'keinen Hunger'), en: 'I am eating pizza although I am not hungry.' },
  { conj: 'obwohl', main: C('ich', 'mag', 'Mathe'), sub: C('es', 'ist', 'schwierig'), en: 'I like maths although it is difficult.' },
  { conj: 'obwohl', main: C('Lena', 'geht', 'zur Schule'), sub: C('sie', 'ist', 'müde'), en: 'Lena goes to school although she is tired.' },
  { conj: 'obwohl', main: C('ich', 'bin', 'glücklich'), sub: C('ich', 'habe', 'den Bus', 'verpasst'), en: 'I am happy although I missed the bus.' },
]

const mainFirst = (x: Sub) => `${cap(mainOrder(x.main))}, ${x.conj} ${subOrder(x.sub)}.`
const subFirst = (x: Sub) => `${cap(x.conj)} ${subOrder(x.sub)}, ${invOrder(x.main)}.`
const SUB_RULE = 'dass (that), wenn (if / when) and obwohl (although) send the verb to the end, like weil. If the sentence STARTS with the subordinate clause, that whole clause is the first idea, so the main clause begins with its verb: Wenn es regnet, bleibe ich zu Hause ("verb, comma, verb").'

const subordinateGenerators: ItemGenerator[] = [
  G('gram.sub.pick', 'grammar.subordinate-clauses', [2, 4], (rng, d) => {
    const x = rng.pick((d === 2 ? SUBS.filter((y) => !y.sub.tail) : SUBS).filter((y) => !!y.sub.mid || !!y.sub.tail))
    const lead = `${cap(mainOrder(x.main))}, ${x.conj} ___`
    return choice({
      rng,
      prompt: `Complete the sentence:  ${lead}  (${x.en})`,
      correct: `${subOrder(x.sub)}.`,
      wrong: weilWrongs({ a: x.main, b: x.sub, en: x.en }).map((w) => ({ ...w, label: `${w.label}.`, feedback: w.feedback.replace(/weil/g, x.conj) })),
      hint: `${x.conj} works like weil. Where does the verb go?`,
      explanation: `${mainFirst(x)} ${SUB_RULE}`,
    })
  }),

  G('gram.sub.inversion', 'grammar.subordinate-clauses', [3, 5], (rng) => {
    const x = rng.pick(SUBS.filter((y) => y.conj !== 'dass'))
    const start = `${cap(x.conj)} ${subOrder(x.sub)},`
    return choice({
      rng,
      prompt: `Complete the sentence:  ${start} ___  (${x.en})`,
      correct: `${invOrder(x.main)}.`,
      wrong: [
        { label: `${mainOrder(x.main)}.`, misconception: 'no-inversion-after-clause', feedback: 'The whole wenn / obwohl clause is the first idea, so the verb must come next: verb, comma, verb.' },
        { label: `${subOrder(x.main)}.`, misconception: 'main-clause-verb-final', feedback: 'Only the subordinate clause has its verb at the end. The main clause starts with its verb.' },
      ].filter((w) => w.label !== `${invOrder(x.main)}.`),
      hint: 'The first idea is the whole subordinate clause. What must come second?',
      explanation: `${subFirst(x)} ${SUB_RULE}`,
    })
  }),

  G('gram.sub.type', 'grammar.subordinate-clauses', [4, 5], (rng, d) => {
    const x = rng.pick(SUBS)
    const startWithSub = x.conj !== 'dass' && (d === 5 || rng.chance(0.4))
    const answer = startWithSub ? subFirst(x) : mainFirst(x)
    const one = x.conj === 'dass' ? `${cap(mainOrder(x.main))}:` : `${cap(mainOrder(x.main))}.`
    return textItem({
      prompt: `Join with ${q(x.conj)}${startWithSub ? `, starting with ${q(cap(x.conj))}` : ''}:  ${one}  ${cap(mainOrder(x.sub))}.  (${x.en})`,
      accept: accept(answer),
      placeholder: 'Type the joined sentence',
      hint: `${x.conj} sends the verb to the end.${startWithSub ? ' Then: verb, comma, verb.' : ''} ${TYPE_HINT}`,
      explanation: `${answer} ${SUB_RULE}`,
    })
  }),

  G('gram.sub.write', 'grammar.subordinate-clauses', [4, 5], (rng) => {
    const task = rng.pick([
      {
        prompt: 'Write 3-4 sentences in German about what you do in different weather. Start at least two sentences with Wenn, and use obwohl once.',
        model: 'Wenn es regnet, lese ich ein Buch. Wenn das Wetter schön ist, fahre ich mit dem Rad in den Park. Ich spiele oft Fußball, obwohl es kalt ist.',
      },
      {
        prompt: 'Write 3-4 sentences in German giving opinions about your town or school, using dass (Ich finde, dass... / Ich glaube, dass...) and wenn.',
        model: 'Ich finde, dass meine Schule sehr modern ist. Ich glaube, dass die Lehrer nett sind. Wenn wir Sport haben, spielen wir Hockey oder Netball.',
      },
      {
        prompt: 'Write 3-4 sentences in German about healthy living, using wenn, dass and obwohl.',
        model: 'Ich weiß, dass Obst gesund ist. Wenn ich Hunger habe, esse ich einen Apfel. Ich esse manchmal Schokolade, obwohl sie ungesund ist.',
      },
    ])
    return reveal({
      prompt: task.prompt,
      model: task.model,
      checklist: ['Uses at least two different subordinating conjunctions (wenn, dass, obwohl, weil)', 'Sends the verb to the end of each subordinate clause', 'Starts a sentence with Wenn and puts the main verb straight after the comma (verb, comma, verb)', 'Puts a comma between the two clauses'],
      passMark: 3,
      hint: 'Wenn es regnet, bleibe ich... - verb, comma, verb.',
    })
  }),
]

// =================================================================== um ... zu

interface Purpose {
  main: string
  mid: string
  zu: string
  /** The verb as a pupil might wrongly write it after zu. */
  inf: string
  en: string
  sep?: boolean
}

const PURPOSES: Purpose[] = [
  { main: 'Ich spare Geld', mid: 'ein Fahrrad', zu: 'zu kaufen', inf: 'kaufen', en: 'I am saving money to buy a bike.' },
  { main: 'Ich gehe in die Stadt', mid: 'Kleidung', zu: 'zu kaufen', inf: 'kaufen', en: 'I am going into town to buy clothes.' },
  { main: 'Ich lerne Deutsch', mid: 'in Österreich', zu: 'zu arbeiten', inf: 'arbeiten', en: 'I am learning German in order to work in Austria.' },
  { main: 'Ich stehe früh auf', mid: 'den Bus', zu: 'zu nehmen', inf: 'nehmen', en: 'I get up early to catch the bus.' },
  { main: 'Ich gehe ins Fitnessstudio', mid: 'fit', zu: 'zu bleiben', inf: 'bleiben', en: 'I go to the gym to stay fit.' },
  { main: 'Ich fahre nach Berlin', mid: 'meine Tante', zu: 'zu besuchen', inf: 'besuchen', en: 'I am going to Berlin to visit my aunt.' },
  { main: 'Ich trinke viel Wasser', mid: 'gesund', zu: 'zu bleiben', inf: 'bleiben', en: 'I drink a lot of water to stay healthy.' },
  { main: 'Ich gehe zum Bahnhof', mid: 'meinen Opa', zu: 'abzuholen', inf: 'abholen', en: 'I am going to the station to pick up my grandad.', sep: true },
  { main: 'Ich gehe früh ins Bett', mid: 'nicht müde', zu: 'zu sein', inf: 'sein', en: 'I go to bed early so as not to be tired.' },
  { main: 'Ich gehe in die Bibliothek', mid: 'für den Test', zu: 'zu lernen', inf: 'lernen', en: 'I am going to the library to revise for the test.' },
  { main: 'Ich rufe Lena an', mid: 'sie', zu: 'einzuladen', inf: 'einladen', en: 'I am phoning Lena to invite her.', sep: true },
  { main: 'Ich gehe in den Park', mid: 'Fußball', zu: 'zu spielen', inf: 'spielen', en: 'I am going to the park to play football.' },
]
const umzu = (x: Purpose) => `${x.main}, um ${x.mid} ${x.zu}.`
const UMZU_RULE = 'um ... zu means "in order to". Put um after a comma, then the rest, and zu + infinitive at the very end: …, um ein Fahrrad zu kaufen. With a separable verb, zu goes inside it: abzuholen, aufzustehen.'

const umZuGenerators: ItemGenerator[] = [
  G('gram.umzu.pick', 'grammar.um-zu', [2, 4], (rng, d) => {
    const x = rng.pick(d === 2 ? PURPOSES.filter((y) => !y.sep) : PURPOSES)
    const prefix = x.sep ? x.zu.slice(0, x.zu.indexOf('zu')) : ''
    const wrong = [
      { label: `um zu ${x.inf} ${x.mid}`, misconception: 'zu-infinitive-not-last', feedback: 'zu + infinitive goes to the very end.' },
      { label: `um ${x.mid} ${x.inf} zu`, misconception: 'zu-after-infinitive', feedback: 'zu comes just before the infinitive: zu kaufen.' },
      { label: `für ${x.mid} ${x.zu}`, misconception: 'fuer-for-um', feedback: '"in order to" is um ... zu, not für.' },
      ...(x.sep ? [{ label: `um ${x.mid} zu ${x.inf}`, misconception: 'separable-zu-outside', feedback: `With a separable verb, zu goes between the prefix and the verb: ${prefix}zu${x.inf.slice(prefix.length)}.` }] : []),
    ]
    return choice({
      rng,
      prompt: `Complete the sentence:  ${x.main}, ___.  (${x.en})`,
      correct: `um ${x.mid} ${x.zu}`,
      wrong: x.sep ? [wrong[3] as (typeof wrong)[number], ...pickN(rng, wrong.slice(0, 3), 2)] : wrong,
      hint: 'um ... zu + infinitive at the end.',
      explanation: `${umzu(x)} ${UMZU_RULE}`,
    })
  }),

  G('gram.umzu.order', 'grammar.um-zu', [2, 3], (rng) => {
    const x = rng.pick(PURPOSES)
    const correct = x.sep ? ['um', x.mid, x.zu] : ['um', x.mid, 'zu', x.inf]
    return orderItem({
      rng,
      prompt: `Complete the sentence by putting the words in order:  ${x.main}, ...  (${x.en})`,
      correct,
      direction: ['first', 'last'],
      hint: 'um first, infinitive last.',
      explanation: `${umzu(x)} ${UMZU_RULE}`,
    })
  }),

  G('gram.umzu.type', 'grammar.um-zu', [3, 5], (rng, d) => {
    const x = rng.pick(d === 3 ? PURPOSES.filter((y) => !y.sep) : PURPOSES)
    return textItem({
      prompt: `Join the sentences with um ... zu:  ${x.main}.  Ich will ${x.mid} ${x.inf}.  (${x.en})`,
      accept: accept(umzu(x)),
      placeholder: 'Type the joined sentence',
      hint: `…, um ... zu + infinitive. ${x.sep ? 'Separable verb: zu goes inside it.' : ''} ${TYPE_HINT}`.replace(/\s+/g, ' '),
      explanation: `${umzu(x)} ${UMZU_RULE}`,
    })
  }),
]

export const wordOrderGenerators: ItemGenerator[] = [
  ...verbSecondGenerators,
  ...questionGenerators,
  ...conjunctionGenerators,
  ...weilGenerators,
  ...tmpGenerators,
  ...subordinateGenerators,
  ...umZuGenerators,
]
