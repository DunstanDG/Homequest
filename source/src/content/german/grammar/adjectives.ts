import type { ItemGenerator } from '@/engine/registry'
import type { Rng } from '@/engine/types'
import { choice, generatorFor, orderItem, reveal, textItem } from '../../kit'
import { accept, cap, DEF, einForm, enPlural, GENDER_WORD, NOUNS, pickN, q, TYPE_HINT, type Case, type Gen, type Noun, type Num } from './data'

const G = generatorFor('german')

// =================================================================== gern, lieber, am liebsten

interface Hobby {
  ich: string
  er: string
  rest: string
  en: string
  /** Separable (fernsehen): the rest is a prefix and cannot move. */
  fixed?: boolean
}

const HOBBIES: Hobby[] = [
  { ich: 'spiele', er: 'spielt', rest: 'Tennis', en: 'playing tennis' },
  { ich: 'spiele', er: 'spielt', rest: 'Fußball', en: 'playing football' },
  { ich: 'spiele', er: 'spielt', rest: 'Gitarre', en: 'playing the guitar' },
  { ich: 'lese', er: 'liest', rest: 'Bücher', en: 'reading books' },
  { ich: 'schwimme', er: 'schwimmt', rest: '', en: 'swimming' },
  { ich: 'tanze', er: 'tanzt', rest: '', en: 'dancing' },
  { ich: 'koche', er: 'kocht', rest: '', en: 'cooking' },
  { ich: 'singe', er: 'singt', rest: '', en: 'singing' },
  { ich: 'fahre', er: 'fährt', rest: 'Rad', en: 'cycling', fixed: true },
  { ich: 'höre', er: 'hört', rest: 'Musik', en: 'listening to music' },
  { ich: 'gehe', er: 'geht', rest: 'ins Kino', en: 'going to the cinema' },
  { ich: 'sehe', er: 'sieht', rest: 'fern', en: 'watching TV', fixed: true },
  { ich: 'esse', er: 'isst', rest: 'Pizza', en: 'eating pizza' },
  { ich: 'reite', er: 'reitet', rest: '', en: 'horse riding' },
]

type Level = 'nicht gern' | 'gern' | 'lieber' | 'am liebsten'
const LEVELS: Level[] = ['nicht gern', 'gern', 'lieber', 'am liebsten']

function enLike(level: Level, who: 'I' | 'Lena', h: Hobby): string {
  const s = who === 'Lena'
  switch (level) {
    case 'nicht gern':
      return `${who} ${s ? 'doesn’t' : 'don’t'} like ${h.en}.`
    case 'gern':
      return `${who} ${s ? 'likes' : 'like'} ${h.en}.`
    case 'lieber':
      return `${who} ${s ? 'prefers' : 'prefer'} ${h.en}.`
    case 'am liebsten':
      return `${who} ${s ? 'likes' : 'like'} ${h.en} most of all.`
  }
}

/** Every correct word order: the adverb straight after the verb (usual), after the object, or at the front with
 * inversion (only natural for lieber / am liebsten). */
function gernSentences(level: Level, who: 'I' | 'Lena', h: Hobby): string[] {
  const subj = who === 'I' ? 'ich' : 'Lena'
  const v = who === 'I' ? h.ich : h.er
  const main = `${cap(subj)} ${v} ${level}${h.rest ? ` ${h.rest}` : ''}.`
  const out = [main]
  if (h.rest && !h.fixed) out.push(`${cap(subj)} ${v} ${h.rest} ${level}.`)
  if (level === 'lieber' || level === 'am liebsten') out.push(`${cap(level)} ${v} ${subj}${h.rest ? ` ${h.rest}` : ''}.`)
  // gerne is an equally correct form of gern.
  if (level === 'gern' || level === 'nicht gern') for (const x of [...out]) out.push(x.replace(/\bgern\b/, 'gerne'))
  return out
}

const GERN_RULE = 'gern (like doing), lieber (prefer doing), am liebsten (like doing most of all) and nicht gern (don’t like doing) go straight after the verb: Ich spiele gern Tennis.'

const gernGenerators: ItemGenerator[] = [
  G('gram.gern.meaning', 'grammar.gern', [1, 3], (rng, d) => {
    const h = rng.pick(HOBBIES)
    const level = rng.pick(d === 1 ? (['gern', 'nicht gern'] as Level[]) : LEVELS)
    const who = d === 3 && rng.chance(0.5) ? 'Lena' : 'I'
    const de = gernSentences(level, who, h)[0] as string
    return choice({
      rng,
      prompt: `What does this mean?  ${de}`,
      correct: enLike(level, who, h),
      wrong: LEVELS.filter((l) => l !== level).map((l) => ({ label: enLike(l, who, h), misconception: `${l}-confusion`, feedback: `That would be: ${gernSentences(l, who, h)[0]}` })),
      hint: 'gern = like, lieber = prefer, am liebsten = like most of all.',
      explanation: `${de} = ${enLike(level, who, h)} ${GERN_RULE}`,
    })
  }),

  G('gram.gern.rank', 'grammar.gern', [2, 3], (rng) => {
    const four = pickN(rng, HOBBIES, 4)
    const correct = LEVELS.map((l, i) => gernSentences(l, 'I', four[i] as Hobby)[0] as string)
    return orderItem({
      rng,
      prompt: 'Put these in order, from what she likes least to what she likes most.',
      correct,
      direction: ['likes least', 'likes most'],
      hint: 'nicht gern < gern < lieber < am liebsten.',
      explanation: `${correct.join(' → ')}. ${GERN_RULE}`,
    })
  }),

  G('gram.gern.fill', 'grammar.gern', [3, 5], (rng, d) => {
    const h = rng.pick(HOBBIES)
    const level = rng.pick(LEVELS)
    const who = d >= 4 && rng.chance(0.5) ? 'Lena' : 'I'
    const variants = gernSentences(level, who, h)
    if (d === 5) {
      return textItem({
        prompt: `Translate into German:  ${enLike(level, who, h)}`,
        accept: accept(...variants),
        placeholder: 'Type the sentence',
        hint: `Verb: ${h.ich} (ich), ${h.er} (er/sie). Where does ${level === 'nicht gern' ? 'nicht gern' : level} go? ${TYPE_HINT}`,
        explanation: `${variants[0]} ${GERN_RULE}`,
      })
    }
    const subj = who === 'I' ? 'Ich' : 'Lena'
    const v = who === 'I' ? h.ich : h.er
    return textItem({
      prompt: `Fill the gap:  ${subj} ${v} ___${h.rest ? ` ${h.rest}` : ''}.  (${enLike(level, who, h)})`,
      accept: level === 'gern' || level === 'nicht gern' ? [level, `${level}e`] : [level],
      placeholder: 'gern, lieber...',
      hint: 'Like / prefer / like most / don’t like?',
      explanation: `${variants[0]} ${GERN_RULE}`,
    })
  }),
]

// =================================================================== comparatives and superlatives

interface Adj {
  pos: string
  comp: string
  sup: string
  en: string
  enComp: string
  enSup: string
  umlaut?: boolean
  irregular?: boolean
}

const A = (pos: string, comp: string, sup: string, en: string, enComp: string, enSup: string, flags: Partial<Pick<Adj, 'umlaut' | 'irregular'>> = {}): Adj => ({ pos, comp, sup, en, enComp, enSup, ...flags })

export const ADJS: Adj[] = [
  A('alt', 'älter', 'ältesten', 'old', 'older', 'oldest', { umlaut: true }),
  A('jung', 'jünger', 'jüngsten', 'young', 'younger', 'youngest', { umlaut: true }),
  A('groß', 'größer', 'größten', 'big / tall', 'bigger / taller', 'biggest / tallest', { umlaut: true }),
  A('klein', 'kleiner', 'kleinsten', 'small', 'smaller', 'smallest'),
  A('lang', 'länger', 'längsten', 'long', 'longer', 'longest', { umlaut: true }),
  A('kurz', 'kürzer', 'kürzesten', 'short', 'shorter', 'shortest', { umlaut: true }),
  A('warm', 'wärmer', 'wärmsten', 'warm', 'warmer', 'warmest', { umlaut: true }),
  A('kalt', 'kälter', 'kältesten', 'cold', 'colder', 'coldest', { umlaut: true }),
  A('stark', 'stärker', 'stärksten', 'strong', 'stronger', 'strongest', { umlaut: true }),
  A('schnell', 'schneller', 'schnellsten', 'fast', 'faster', 'fastest'),
  A('langsam', 'langsamer', 'langsamsten', 'slow', 'slower', 'slowest'),
  A('billig', 'billiger', 'billigsten', 'cheap', 'cheaper', 'cheapest'),
  A('teuer', 'teurer', 'teuersten', 'expensive', 'more expensive', 'most expensive'),
  A('schön', 'schöner', 'schönsten', 'beautiful', 'more beautiful', 'most beautiful'),
  A('interessant', 'interessanter', 'interessantesten', 'interesting', 'more interesting', 'most interesting'),
  A('langweilig', 'langweiliger', 'langweiligsten', 'boring', 'more boring', 'most boring'),
  A('lustig', 'lustiger', 'lustigsten', 'funny', 'funnier', 'funniest'),
  A('gut', 'besser', 'besten', 'good', 'better', 'best', { irregular: true }),
  A('viel', 'mehr', 'meisten', 'much / a lot', 'more', 'most', { irregular: true }),
  A('gern', 'lieber', 'liebsten', 'like (doing)', 'prefer (doing)', 'like (doing) most', { irregular: true }),
  A('hoch', 'höher', 'höchsten', 'high', 'higher', 'highest', { irregular: true }),
]
const adj = (pos: string) => ADJS.find((a) => a.pos === pos) as Adj

const COMP_RULE = 'Comparative: add -er (klein → kleiner); most one-syllable adjectives with a, o or u add an umlaut (alt → älter). Irregular: gut → besser, viel → mehr, gern → lieber, hoch → höher. "than" is als.'
const SUP_RULE = 'Superlative after a verb: am ...-sten (am kleinsten). Most adjectives ending in -t, -d, -s or -z add -esten (am ältesten, am kürzesten), but groß is just am größten. Irregular: am besten, am meisten, am liebsten, am höchsten. Umlauts from the comparative stay: älter → am ältesten.'

function compWrong(a: Adj) {
  const out: { label: string; misconception: string; feedback: string }[] = [
    { label: `mehr ${a.pos}`, misconception: 'mehr-plus-adjective', feedback: 'German never uses "mehr" like English "more interesting": just add -er (interessanter).' },
    { label: `am ${a.sup}`, misconception: 'superlative-for-comparative', feedback: `am ${a.sup} is the superlative (the most). The comparative is ${a.comp}.` },
  ]
  if (a.umlaut) out.push({ label: `${a.pos}er`, misconception: 'missing-umlaut', feedback: `${a.pos} adds an umlaut: ${a.comp}.` })
  if (a.irregular) out.push({ label: `${a.pos}er`, misconception: 'regular-for-irregular', feedback: `${a.pos} is irregular: ${a.comp}.` })
  if (!a.umlaut && !a.irregular && /[aou]/.test(a.pos) && a.pos !== 'teuer') out.push({ label: `${a.comp.replace(/[aou](?=[^aou]*er$)/, (m) => ({ a: 'ä', o: 'ö', u: 'ü' })[m] ?? m)}`, misconception: 'extra-umlaut', feedback: `${a.pos} does not take an umlaut: ${a.comp}.` })
  // No "teuerer" distractor: it is a rare but attested variant, so it would not be clearly wrong.
  return out.filter((w) => w.label !== a.comp)
}

/** Fictional comparison tables (people, prices, films, weather) so no "fact" can be wrong. */
interface Scene {
  head: [string, string]
  names: string[]
  /** German subject for a row name, e.g. "Lukas", "Die Jacke", "In Wien ist es". */
  subj: (name: string) => string
  /** Pieces after the comparative: "als Mia", "als das T-Shirt", "als in Graz". */
  than: (name: string) => string
  value: (rng: Rng, i: number) => number
  show: (v: number) => string
  up: Adj
  down: Adj
  /** English label for the measure, for hints. */
  measure: string
}

const NAMES = ['Lukas', 'Mia', 'Jonas', 'Emma', 'Ben', 'Lena', 'Paul', 'Hannah']
const PRICED: { de: string; g: Gen; en: string }[] = [
  { de: 'T-Shirt', g: 'n', en: 'T-shirt' },
  { de: 'Jacke', g: 'f', en: 'jacket' },
  { de: 'Rucksack', g: 'm', en: 'rucksack' },
  { de: 'Buch', g: 'n', en: 'book' },
  { de: 'Mütze', g: 'f', en: 'woolly hat' },
  { de: 'Pullover', g: 'm', en: 'jumper' },
]
const CITIES = ['Berlin', 'Wien', 'Zürich', 'Hamburg', 'München', 'Graz']

const SCENES: Scene[] = [
  { head: ['Name', 'Age'], names: NAMES, subj: (n) => n, than: (n) => `als ${n}`, value: (rng, i) => 11 + i * 2 + rng.int(0, 1), show: (v) => `${v}`, up: adj('alt'), down: adj('jung'), measure: 'age' },
  { head: ['Name', 'Height'], names: NAMES, subj: (n) => n, than: (n) => `als ${n}`, value: (rng, i) => 140 + i * 6 + rng.int(0, 4), show: (v) => `1,${String(v - 100).padStart(2, '0')} m`, up: adj('groß'), down: adj('klein'), measure: 'height' },
  {
    head: ['Item', 'Price'],
    names: PRICED.map((p) => p.de),
    subj: (n) => `${cap(DEF.nom[PRICED.find((p) => p.de === n)?.g ?? 'n'])} ${n}`,
    than: (n) => `als ${DEF.nom[PRICED.find((p) => p.de === n)?.g ?? 'n']} ${n}`,
    value: (rng, i) => 8 + i * 9 + rng.int(0, 5),
    show: (v) => `${v} €`,
    up: adj('teuer'),
    down: adj('billig'),
    measure: 'price',
  },
  { head: ['Film', 'Length'], names: ['Film A', 'Film B', 'Film C', 'Film D'], subj: (n) => n, than: (n) => `als ${n}`, value: (rng, i) => 85 + i * 12 + rng.int(0, 8), show: (v) => `${v} minutes`, up: adj('lang'), down: adj('kurz'), measure: 'length' },
  { head: ['City (today)', 'Temperature'], names: CITIES, subj: (n) => `In ${n} ist es`, than: (n) => `als in ${n}`, value: (rng, i) => 4 + i * 3 + rng.int(0, 2), show: (v) => `${v} °C`, up: adj('warm'), down: adj('kalt'), measure: 'temperature' },
]

function scene(rng: Rng, k: number) {
  const s = rng.pick(SCENES)
  const names = pickN(rng, s.names, k)
  // Strictly increasing values in a shuffled order: no ties, so there is always one right answer.
  const vals = names.map((_, i) => s.value(rng, i))
  const order = rng.shuffle(names.map((_, i) => i))
  const rows = order.map((i) => ({ name: names[i] as string, v: vals[i] as number }))
  return { s, rows, figure: { type: 'table' as const, head: s.head as string[], rows: rows.map((r) => [r.name, s.show(r.v)]) } }
}

/** "X ist ___ als Y" or "In X ist es ___ als in Y". */
const compSentence = (s: Scene, a: string, b: string, word: string) => `${s.subj(a)}${s.subj(a).endsWith(' es') ? '' : ' ist'} ${word} ${s.than(b)}.`

const compGenerators: ItemGenerator[] = [
  G('gram.comp.form', 'grammar.comparatives', [1, 3], (rng, d) => {
    const pool = d === 1 ? ADJS.filter((a) => !a.umlaut && !a.irregular) : d === 2 ? ADJS.filter((a) => !a.irregular) : ADJS
    const a = rng.pick(pool)
    if (d === 1) {
      const others = pickN(rng, ADJS.filter((x) => x !== a), 2)
      return choice({
        rng,
        prompt: `What does ${q(a.comp)} mean?`,
        correct: a.enComp,
        wrong: [{ label: a.en, misconception: 'comparative-as-positive', feedback: `${a.pos} = ${a.en}. The -er ending makes it "${a.enComp}".` }, { label: a.enSup, misconception: 'comparative-as-superlative', feedback: `"${a.enSup}" would be am ${a.sup}.` }, ...others.map((o) => o.enComp)],
        hint: 'The -er ending works like English -er.',
        explanation: `${a.pos} (${a.en}) → ${a.comp} (${a.enComp}). ${COMP_RULE}`,
      })
    }
    return choice({
      rng,
      prompt: `What is the comparative of ${q(a.pos)} (${a.en})?`,
      correct: a.comp,
      wrong: pickN(rng, compWrong(a), 3),
      hint: a.irregular ? 'This one is irregular, like English good → better.' : 'Add -er. Short words with a, o or u often add an umlaut too.',
      explanation: `${a.pos} → ${a.comp}. ${COMP_RULE}`,
    })
  }),

  G('gram.comp.compare', 'grammar.comparatives', [2, 4], (rng, d) => {
    const { s, rows, figure } = scene(rng, 2)
    const [x, y] = rng.chance(0.5) ? [rows[0], rows[1]] : [rows[1], rows[0]]
    if (!x || !y) throw new Error('scene')
    const useUp = d === 2 ? true : rng.chance(0.5)
    const a = useUp ? s.up : s.down
    const xBigger = x.v > y.v
    // Make the sentence true: pick the subject so that the chosen adjective fits.
    const [first, second] = (useUp ? xBigger : !xBigger) ? [x, y] : [y, x]
    const other = useUp ? s.down : s.up
    const sentence = compSentence(s, first.name, second.name, '___')
    return choice({
      rng,
      prompt: `Look at the table. Complete the sentence so it is true:  ${sentence}`,
      figure,
      correct: a.comp,
      wrong: [
        { label: other.comp, misconception: 'reversed-comparison', feedback: `Check the table: ${first.name} ${s.show(first.v)}, ${second.name} ${s.show(second.v)}.` },
        ...pickN(rng, compWrong(a), 2),
      ],
      hint: `Compare the ${s.measure}s. Which one has more?`,
      explanation: `${compSentence(s, first.name, second.name, a.comp)} (${s.show(first.v)} vs ${s.show(second.v)}). ${COMP_RULE}`,
    })
  }),

  G('gram.comp.type', 'grammar.comparatives', [3, 5], (rng, d) => {
    if (d === 3) {
      const a = rng.pick(ADJS.filter((x) => !x.irregular))
      return textItem({
        prompt: `Type the comparative of ${q(a.pos)} (${a.en}).`,
        accept: accept(a.comp),
        placeholder: '...er',
        hint: `Add -er. Does it need an umlaut? ${TYPE_HINT}`,
        explanation: `${a.pos} → ${a.comp}. ${COMP_RULE}`,
      })
    }
    const { s, rows, figure } = scene(rng, 2)
    const [x, y] = [rows[0], rows[1]]
    if (!x || !y) throw new Error('scene')
    const a = rng.chance(0.5) ? s.up : s.down
    const [first, second] = (a === s.up) === x.v > y.v ? [x, y] : [y, x]
    return { ...textItem({
      prompt: `Look at the table. Type the missing comparative of ${q(a.pos)}:  ${compSentence(s, first.name, second.name, '___')}`,
      accept: accept(a.comp),
      placeholder: 'Comparative',
      hint: `${a.pos} + -er${a.umlaut ? ', with an umlaut' : ''}. ${TYPE_HINT}`,
      explanation: `${compSentence(s, first.name, second.name, a.comp)} ${COMP_RULE}`,
    }), figure }
  }),

  G('gram.comp.write', 'grammar.comparatives', [3, 5], (rng) => {
    const task = rng.pick([
      {
        prompt: 'Write 3-4 sentences in German comparing two people in your family or two friends (age, height, personality). Use comparatives with als, and at least one irregular form (besser, mehr, lieber).',
        model: 'Mein Bruder ist älter als ich, aber ich bin größer als er. Er ist lustiger als meine Schwester. Ich spiele besser Tennis als mein Bruder, aber er spielt lieber Fußball.',
      },
      {
        prompt: 'Write 3-4 sentences in German comparing two school subjects. Use comparatives with als, and give your opinion.',
        model: 'Ich finde Deutsch interessanter als Mathe. Mathe ist schwieriger als Kunst, aber Kunst ist langweiliger als Musik. Ich lerne lieber Deutsch als Erdkunde, und am liebsten habe ich Sport.',
      },
      {
        prompt: 'Write 3-4 sentences in German comparing your town with a big city (size, how interesting it is, what there is to do). Use comparatives with als.',
        model: 'Berlin ist größer als meine Stadt. Meine Stadt ist kleiner und ruhiger, aber Berlin ist interessanter. In Berlin gibt es mehr Museen als bei uns. Ich wohne aber lieber in meiner Stadt.',
      },
    ])
    return reveal({
      prompt: task.prompt,
      model: task.model,
      checklist: ['Uses at least two comparatives ending in -er', 'Uses als for "than"', 'Adds an umlaut where needed (älter, größer, wärmer)', 'Uses an irregular form (besser, mehr or lieber)', 'Keeps the verb in second place in every sentence'],
      passMark: 3,
      hint: 'Pattern: X ist + comparative + als + Y. Never "mehr" + adjective.',
    })
  }),
]

const supGenerators: ItemGenerator[] = [
  G('gram.sup.form', 'grammar.superlatives', [2, 3], (rng, d) => {
    const a = rng.pick(d === 2 ? ADJS.filter((x) => !x.irregular) : ADJS)
    const wrong = [
      { label: a.comp, misconception: 'comparative-for-superlative', feedback: `${a.comp} is the comparative (more). The superlative is am ${a.sup}.` },
      { label: `am meisten ${a.pos}`, misconception: 'meisten-plus-adjective', feedback: 'Do not copy English "most beautiful": just use am ...-sten.' },
      { label: `am ${a.pos}sten`, misconception: a.irregular ? 'regular-for-irregular' : 'missing-umlaut-or-e', feedback: a.irregular ? `${a.pos} is irregular.` : `Careful: am ${a.sup}.` },
      { label: `am ${a.pos}esten`, misconception: 'wrong-superlative-ending', feedback: `Not quite: the form is am ${a.sup}.` },
    ].filter((w) => w.label !== `am ${a.sup}`)
    return choice({
      rng,
      prompt: `What is the superlative of ${q(a.pos)} (${a.en}), as in "Lena ist am ___"?`,
      correct: `am ${a.sup}`,
      wrong: pickN(rng, wrong, 3),
      hint: 'am + adjective + -sten (or -esten).',
      explanation: `${a.pos} → ${a.comp} → am ${a.sup}. ${SUP_RULE}`,
    })
  }),

  G('gram.sup.table', 'grammar.superlatives', [3, 4], (rng, d) => {
    const { s, rows, figure } = scene(rng, 3)
    const a = rng.chance(0.5) ? s.up : s.down
    const best = [...rows].sort((p, r) => (a === s.up ? r.v - p.v : p.v - r.v))[0]
    if (!best) throw new Error('scene')
    const subjOf = (n: string) => (s.subj(n).endsWith(' es') ? s.subj(n) : `${s.subj(n)} ist`)
    if (d === 3) {
      return choice({
        rng,
        prompt: `Look at the table. Which sentence is true?`,
        figure,
        correct: `${subjOf(best.name)} am ${a.sup}.`,
        wrong: rows.filter((r) => r !== best).map((r) => ({ label: `${subjOf(r.name)} am ${a.sup}.`, misconception: 'misread-superlative', feedback: `am ${a.sup} means "the ${a.enSup}". Check the table.` })),
        hint: `am ${a.sup} = the ${a.enSup}.`,
        explanation: `${subjOf(best.name)} am ${a.sup} (${s.show(best.v)}). ${SUP_RULE}`,
      })
    }
    const other = a === s.up ? s.down : s.up
    return choice({
      rng,
      prompt: `Look at the table. Complete:  ${subjOf(best.name)} am ___.`,
      figure,
      correct: a.sup,
      wrong: [
        { label: other.sup, misconception: 'reversed-superlative', feedback: 'Check the table again: that is the opposite.' },
        { label: a.comp, misconception: 'comparative-for-superlative', feedback: `After am you need the superlative: am ${a.sup}.` },
        { label: `${a.pos}sten`, misconception: 'superlative-form', feedback: `The form is am ${a.sup}.` },
      ].filter((w) => w.label !== a.sup),
      hint: `Is ${best.name} the highest or the lowest in the table?`,
      explanation: `${subjOf(best.name)} am ${a.sup} (${s.show(best.v)}). ${SUP_RULE}`,
    })
  }),

  G('gram.sup.type', 'grammar.superlatives', [4, 5], (rng, d) => {
    if (d === 5 && rng.chance(0.5)) {
      const a = rng.pick(ADJS.filter((x) => x.irregular || x.umlaut))
      return textItem({
        prompt: `Type the superlative of ${q(a.pos)} (${a.en}):  am ___`,
        accept: accept(a.sup, `am ${a.sup}`),
        placeholder: '...sten',
        hint: `${a.irregular ? 'It is irregular.' : 'Keep the umlaut from the comparative.'} ${TYPE_HINT}`,
        explanation: `${a.pos} → ${a.comp} → am ${a.sup}. ${SUP_RULE}`,
      })
    }
    const { s, rows, figure } = scene(rng, 3)
    const a = rng.chance(0.5) ? s.up : s.down
    const best = [...rows].sort((p, r) => (a === s.up ? r.v - p.v : p.v - r.v))[0]
    if (!best) throw new Error('scene')
    const subj = s.subj(best.name).endsWith(' es') ? s.subj(best.name) : `${s.subj(best.name)} ist`
    return { ...textItem({
      prompt: `Look at the table. Type the superlative of ${q(a.pos)}:  ${subj} am ___.`,
      accept: accept(a.sup, `am ${a.sup}`),
      placeholder: '...sten',
      hint: `am + ${a.pos} + -sten / -esten. ${TYPE_HINT}`,
      explanation: `${subj} am ${a.sup}. ${SUP_RULE}`,
    }), figure }
  }),
]

// =================================================================== adjective endings

const ADJ_FOR: Partial<Record<Noun['cat'], [string, string][]>> = {
  clothes: [['rot', 'red'], ['blau', 'blue'], ['grün', 'green'], ['schwarz', 'black'], ['weiß', 'white'], ['gelb', 'yellow'], ['neu', 'new'], ['billig', 'cheap']],
  pet: [['groß', 'big'], ['klein', 'small'], ['alt', 'old'], ['schwarz', 'black'], ['weiß', 'white'], ['braun', 'brown'], ['süß', 'cute'], ['lustig', 'funny']],
  media: [['neu', 'new'], ['alt', 'old'], ['lustig', 'funny'], ['interessant', 'interesting'], ['langweilig', 'boring'], ['toll', 'great']],
  thing: [['neu', 'new'], ['alt', 'old'], ['rot', 'red'], ['schwarz', 'black'], ['klein', 'small'], ['groß', 'big'], ['billig', 'cheap']],
}
const ADJ_NOUNS = NOUNS.filter((n) => ADJ_FOR[n.cat] && n.pl && !['Zeitung', 'Foto', 'Lied', 'Schlüssel', 'Geschenk'].includes(n.de))

const VERB_FOR: Partial<Record<Noun['cat'], [string, string]>> = {
  clothes: ['Ich kaufe', 'I am buying'],
  pet: ['Ich mag', 'I like'],
  media: ['Ich mag', 'I like'],
  thing: ['Ich suche', 'I am looking for'],
}

const VERB_FOR_EIN: Partial<Record<Noun['cat'], [string, string]>> = {
  clothes: ['Ich kaufe', 'I am buying'],
  pet: ['Ich habe', 'I have got'],
  media: ['Ich suche', 'I am looking for'],
  thing: ['Ich suche', 'I am looking for'],
}

const DEF_END: Record<Exclude<Case, 'dat'>, Record<Num, string>> = { nom: { m: 'e', f: 'e', n: 'e', pl: 'en' }, acc: { m: 'en', f: 'e', n: 'e', pl: 'en' } }
const EIN_ADJ_END: Record<Exclude<Case, 'dat'>, Record<Num, string>> = { nom: { m: 'er', f: 'e', n: 'es', pl: 'en' }, acc: { m: 'en', f: 'e', n: 'es', pl: 'en' } }

const DEF_ADJ_RULE = 'After der, die, das: the adjective ends in -e (der rote Rock, die rote Jacke, das rote Kleid), except masculine accusative and all plurals, which end in -en (den roten Rock, die roten Schuhe).'
const EIN_ADJ_RULE = 'After ein, kein, mein...: the adjective shows the gender because the article cannot: ein roter Rock (m), eine rote Jacke (f), ein rotes Kleid (n). Masculine accusative: einen roten Rock. Plural after keine/meine: -en.'

interface AdjCase {
  sentence: string
  en: string
  word: string
  stem: string
  noun: Noun
  g: Num
  c: Exclude<Case, 'dat'>
}

function adjCase(rng: Rng, kind: 'def' | 'ein', d: number): AdjCase {
  const n = rng.pick(ADJ_NOUNS)
  const [stem, enAdj] = rng.pick(ADJ_FOR[n.cat] as [string, string][])
  const c: Exclude<Case, 'dat'> = rng.chance(d <= 2 ? 0.3 : 0.6) ? 'acc' : 'nom'
  const plural = d >= 4 && rng.chance(0.3)
  const g: Num = plural ? 'pl' : n.g
  // kein only in "Das ist kein..." sentences, where the English ("That is not a...") stays natural.
  const einWords = c === 'nom' ? (plural ? ['kein', 'mein'] : ['ein', 'ein', 'kein', 'mein']) : plural ? ['mein'] : ['ein', 'ein', 'mein']
  const art = kind === 'def' ? DEF[c][g] : einForm(rng.pick(einWords), c, g)
  const word = stem + (kind === 'def' ? DEF_END[c][g] : EIN_ADJ_END[c][g])
  const noun = plural ? (n.pl as string) : n.de
  const enNoun = plural ? enPlural(n) : n.en
  const neg = art.startsWith('k')
  const enArt = art.startsWith('d') ? 'the' : art.startsWith('m') ? 'my' : plural ? '' : /^[aeiou]/.test(enAdj) ? 'an' : 'a'
  // With ein-words, "Ich mag einen alten Vogel" sounds odd, so pets are "had" and media "looked for" instead.
  const [verb, enVerb] = (kind === 'ein' ? VERB_FOR_EIN[n.cat] : VERB_FOR[n.cat]) as [string, string]
  const sentence = c === 'nom' ? `${plural ? 'Das sind' : 'Das ist'} ${art} ___ ${noun}.` : `${verb} ${art} ___ ${noun}.`
  const en = (c === 'nom' ? `${plural ? 'These are' : 'That is'}${neg ? ' not' : ''} ${enArt} ${enAdj} ${enNoun}.` : `${enVerb} ${enArt} ${enAdj} ${enNoun}.`).replace(/\s+/g, ' ')
  return { sentence, en, word, stem, noun: n, g, c }
}

function adjWrong(ac: AdjCase) {
  return ['e', 'en', 'er', 'es']
    .map((e) => ac.stem + e)
    .filter((w) => w !== ac.word)
    .map((w) => ({ label: w, misconception: 'adjective-ending', feedback: `${ac.noun.de} is ${GENDER_WORD[ac.g]} and ${ac.c === 'nom' ? 'the subject / after "das ist" (nominative)' : 'the object (accusative)'}.` }))
}

const adjEndingGenerators: ItemGenerator[] = [
  G('gram.adjdef.pick', 'grammar.adjective-endings-definite', [2, 4], (rng, d) => {
    const ac = adjCase(rng, 'def', d)
    return choice({
      rng,
      prompt: `Choose the adjective with the right ending:  ${ac.sentence}  (${ac.en})`,
      correct: ac.word,
      wrong: adjWrong(ac).filter((w) => !w.label.endsWith('es') || d >= 3),
      keepOrder: false,
      hint: 'After der/die/das the ending is mostly -e. Which forms take -en?',
      explanation: `${ac.sentence.replace('___', ac.word)} ${DEF_ADJ_RULE}`,
    })
  }),

  G('gram.adjdef.type', 'grammar.adjective-endings-definite', [3, 5], (rng, d) => {
    const ac = adjCase(rng, 'def', d)
    return textItem({
      prompt: `Type ${q(ac.stem)} with the right ending:  ${ac.sentence}  (${ac.en})`,
      accept: accept(ac.word),
      placeholder: `${ac.stem}...`,
      hint: `Nominative or accusative? ${ac.g === 'pl' ? 'Plural.' : `${cap(GENDER_WORD[ac.g])}.`} ${TYPE_HINT}`,
      explanation: `${ac.sentence.replace('___', ac.word)} ${DEF_ADJ_RULE}`,
    })
  }),

  G('gram.adjindef.pick', 'grammar.adjective-endings-indefinite', [2, 4], (rng, d) => {
    const ac = adjCase(rng, 'ein', d)
    return choice({
      rng,
      prompt: `Choose the adjective with the right ending:  ${ac.sentence}  (${ac.en})`,
      correct: ac.word,
      wrong: adjWrong(ac),
      hint: 'ein can’t show the gender of a masculine or neuter noun, so the adjective does: -er (der), -e (die), -es (das).',
      explanation: `${ac.sentence.replace('___', ac.word)} ${EIN_ADJ_RULE}`,
    })
  }),

  G('gram.adjindef.type', 'grammar.adjective-endings-indefinite', [4, 5], (rng, d) => {
    const ac = adjCase(rng, rng.chance(d === 5 ? 0.3 : 0) ? 'def' : 'ein', d)
    return textItem({
      prompt: `Type ${q(ac.stem)} with the right ending:  ${ac.sentence}  (${ac.en})`,
      accept: accept(ac.word),
      placeholder: `${ac.stem}...`,
      hint: `Look at the article first: does it already show the gender? ${TYPE_HINT}`,
      explanation: `${ac.sentence.replace('___', ac.word)} ${EIN_ADJ_RULE}`,
    })
  }),
]

export const adjectiveGenerators: ItemGenerator[] = [...gernGenerators, ...compGenerators, ...supGenerators, ...adjEndingGenerators]
