import type { ItemGenerator } from '@/engine/registry'
import type { Rng } from '@/engine/types'
import { choice, generatorFor, matchItem, textItem } from '../../kit'
import { accept, cap, CASE_WORD, DEF, datPlural, einForm, fixAn, GENDER_WORD, NOUNS, pickN, type Case, type Gen, type Num } from './data'

const G = generatorFor('german')

interface Nn {
  de: string
  g: Gen
  en: string
  pl?: string
  enPl?: string
}
const byName = (...names: string[]): Nn[] => names.map((n) => NOUNS.find((x) => x.de === n) as Nn)
const nn = (de: string, g: Gen, en: string): Nn => ({ de, g, en })

/** A determiner: "the", "a", or a possessive. */
type Det = { kind: 'def' } | { kind: 'ein' } | { kind: 'poss'; stem: string; en: string }
const DEF_DET: Det = { kind: 'def' }
const EIN_DET: Det = { kind: 'ein' }
const MY: Det = { kind: 'poss', stem: 'mein', en: 'my' }
const POSS_DETS: Det[] = [MY, { kind: 'poss', stem: 'sein', en: 'his' }, { kind: 'poss', stem: 'ihr', en: 'her' }, { kind: 'poss', stem: 'unser', en: 'our' }]

function detForm(det: Det, c: Case, g: Num): string {
  if (det.kind === 'def') return DEF[c][g]
  return einForm(det.kind === 'ein' ? 'ein' : det.stem, c, g)
}
const detEn = (det: Det) => (det.kind === 'def' ? 'the' : det.kind === 'ein' ? 'a' : det.en)
const detAsk = (det: Det) => `"${detEn(det)}"`

/** Wrong options for a determiner gap: the other cases and genders, each with feedback. */
function detWrong(det: Det, c: Case, g: Num, noun: string, prep: string) {
  const correct = detForm(det, c, g)
  const out: { label: string; misconception: string; feedback: string }[] = []
  const add = (label: string, misconception: string, feedback: string) => {
    if (label !== correct && !out.some((o) => o.label === label)) out.push({ label, misconception, feedback })
  }
  const other: Case = c === 'dat' ? 'acc' : 'dat'
  add(detForm(det, other, g), `${other}-for-${c}`, `That is the ${CASE_WORD[other]}. ${prep} takes the ${CASE_WORD[c]}.`)
  add(detForm(det, 'nom', g), `nominative-after-preposition`, `That is the nominative (the subject form). After ${prep} the noun changes case.`)
  if (g !== 'pl') for (const g2 of ['m', 'f', 'n'] as Gen[]) if (g2 !== g) add(detForm(det, c, g2), 'wrong-gender', `${noun} is ${GENDER_WORD[g]}.`)
  return out
}

const CASE_RULE: Record<'dat' | 'acc', string> = {
  dat: 'Dative: der → dem, die → der, das → dem, plural die → den (+ -n on the noun); ein → einem, eine → einer; mein → meinem, meine → meiner.',
  acc: 'Accusative: only the masculine changes: der → den, ein → einen, mein → meinen.',
}

// =================================================================== dative prepositions

interface Frame {
  before: string
  after: string
  prep: string
  en: (det: string, noun: string) => string
  nouns: Nn[]
  dets: Det[]
  /** Allow plural nouns (dative plural adds -n). */
  plural?: boolean
}

const DAT_FRAMES: Frame[] = [
  { before: 'Ich fahre mit', after: 'zur Schule.', prep: 'mit', en: (_d, n) => `I go to school by ${n}.`, nouns: byName('Bus', 'Zug', 'Auto', 'Straßenbahn', 'U-Bahn', 'Fahrrad'), dets: [DEF_DET] },
  { before: 'Ich spiele mit', after: '.', prep: 'mit', en: (d, n) => `I am playing with ${d} ${n}.`, nouns: byName('Bruder', 'Schwester', 'Freund', 'Freundin', 'Cousin', 'Cousine', 'Hund', 'Katze'), dets: [MY, EIN_DET, DEF_DET], plural: true },
  { before: 'Am Wochenende bin ich bei', after: '.', prep: 'bei', en: (d, n) => `At the weekend I am at ${d} ${n}’s house.`, nouns: byName('Oma', 'Opa', 'Tante', 'Onkel'), dets: [MY] },
  { before: 'Ich bekomme ein Geschenk von', after: '.', prep: 'von', en: (d, n) => `I am getting a present from ${d} ${n}.`, nouns: byName('Oma', 'Opa', 'Tante', 'Onkel', 'Bruder', 'Schwester'), dets: POSS_DETS },
  { before: 'Er kommt aus', after: '.', prep: 'aus', en: (d, n) => `He is coming out of ${d} ${n}.`, nouns: byName('Kino', 'Schule', 'Supermarkt', 'Bäckerei', 'Haus', 'Bibliothek'), dets: [DEF_DET] },
  { before: 'Nach', after: 'spiele ich Tennis.', prep: 'nach', en: (d, n) => `After ${d} ${n} I play tennis.`, nouns: [nn('Frühstück', 'n', 'breakfast'), nn('Mittagessen', 'n', 'lunch'), nn('Film', 'm', 'film'), nn('Party', 'f', 'party'), nn('Schule', 'f', 'school')], dets: [DEF_DET] },
  { before: 'Ich lerne seit', after: 'Deutsch.', prep: 'seit', en: (_d, n) => `I have been learning German for a ${n}.`, nouns: [nn('Jahr', 'n', 'year'), nn('Monat', 'm', 'month'), nn('Woche', 'f', 'week')], dets: [EIN_DET] },
  { before: 'Ich gehe zu', after: '.', prep: 'zu', en: (d, n) => `I am going to ${d} ${n}’s.`, nouns: byName('Oma', 'Opa', 'Tante', 'Onkel'), dets: POSS_DETS },
]

/** "After the breakfast" reads oddly in English: meals and school have no article there. */
const EN_NO_ARTICLE = ['breakfast', 'lunch', 'school']

interface Built {
  sentence: string
  answer: string
  en: string
  noun: Nn
  g: Num
  nounShown: string
  det: Det
  c: Case
  wrong: { label: string; misconception: string; feedback: string }[]
}

function build(rng: Rng, f: Frame, c: Case, d: number): Built {
  const noun = rng.pick(f.nouns)
  const det = rng.pick(f.dets)
  const plural = !!f.plural && d >= 4 && !!noun.pl && det.kind !== 'ein' && rng.chance(0.35)
  const g: Num = plural ? 'pl' : noun.g
  const nounShown = plural ? (c === 'dat' ? datPlural(noun.pl as string) : (noun.pl as string)) : noun.de
  const answer = detForm(det, c, g)
  const sentence = `${f.before} ___ ${nounShown}${f.after === '.' ? '.' : ` ${f.after}`}`
  const enNoun = plural ? (noun.enPl ?? `${noun.en}s`) : noun.en
  const enDet = EN_NO_ARTICLE.includes(noun.en) && det.kind === 'def' ? '' : detEn(det)
  const en = fixAn(f.en(enDet, enNoun).replace(/\s+/g, ' '))
  return { sentence, answer, en, noun, g, nounShown, det, c, wrong: detWrong(det, c, g, noun.de, f.prep) }
}

const dativeGenerators: ItemGenerator[] = [
  G('gram.dat.which', 'grammar.dative', [1, 2], (rng) => {
    const dat = rng.pick(['mit', 'zu', 'von', 'bei', 'aus', 'nach', 'seit'])
    const acc = pickN(rng, ['für', 'ohne', 'durch', 'gegen', 'um'], 3)
    return choice({
      rng,
      prompt: 'Which preposition is always followed by the dative?',
      correct: dat,
      wrong: acc.map((a) => ({ label: a, misconception: 'acc-prep-as-dative', feedback: `${a} always takes the accusative.` })),
      hint: 'One way to remember the dative group: aus, bei, mit, nach, seit, von, zu.',
      explanation: `${dat} takes the dative. The dative prepositions: aus, bei, mit, nach, seit, von, zu (and gegenüber). The accusative ones: durch, für, gegen, ohne, um.`,
    })
  }),

  G('gram.dat.pick', 'grammar.dative', [2, 4], (rng, d) => {
    const f = rng.pick(d === 2 ? DAT_FRAMES.filter((x) => x.dets.includes(DEF_DET)) : DAT_FRAMES)
    const b = build(rng, f, 'dat', d)
    return choice({
      rng,
      prompt: `Choose the word for ${detAsk(b.det)}:  ${b.sentence}  (${b.en})`,
      correct: b.answer,
      wrong: pickN(rng, b.wrong, 3),
      hint: `${f.prep} always takes the dative. Is ${b.noun.de} der, die or das${b.g === 'pl' ? ' (here plural)' : ''}?`,
      explanation: `${b.sentence.replace('___', b.answer)} ${f.prep} + dative: ${b.g === 'pl' ? 'plural' : GENDER_WORD[b.noun.g]} → ${b.answer}. ${CASE_RULE.dat}`,
    })
  }),

  G('gram.dat.type', 'grammar.dative', [3, 5], (rng, d) => {
    const f = rng.pick(DAT_FRAMES)
    const b = build(rng, f, 'dat', d)
    return textItem({
      prompt: `Type the missing word for ${detAsk(b.det)}:  ${b.sentence}  (${b.en})`,
      accept: accept(b.answer),
      placeholder: 'dem, der, einem, meiner...',
      hint: `Which case does ${f.prep} take? ${b.noun.de} is ${GENDER_WORD[b.g === 'pl' ? 'pl' : b.noun.g]}.`,
      explanation: `${b.sentence.replace('___', b.answer)} ${CASE_RULE.dat}`,
    })
  }),
]

// =================================================================== contractions

const CONTRACTIONS: [string, string][] = [
  ['zu dem', 'zum'],
  ['zu der', 'zur'],
  ['in dem', 'im'],
  ['in das', 'ins'],
  ['an dem', 'am'],
  ['an das', 'ans'],
  ['von dem', 'vom'],
  ['bei dem', 'beim'],
]
const contract = (prep: string, art: string) => CONTRACTIONS.find(([long]) => long === `${prep} ${art}`)?.[1] ?? `${prep} ${art}`

interface ContrItem {
  frame: string
  prep: string
  c: Case
  noun: Nn
  en: string
}

const ZU_PLACES = byName('Bahnhof', 'Supermarkt', 'Strand', 'Spielplatz', 'Schule', 'Bäckerei', 'Kirche', 'Bibliothek', 'Kino', 'Schwimmbad', 'Rathaus', 'Museum')
const IN_PLACES = byName('Kino', 'Schwimmbad', 'Museum', 'Restaurant', 'Café', 'Hotel', 'Supermarkt', 'Garten', 'Stadt', 'Bibliothek', 'Bäckerei')
const VON_PLACES = byName('Bahnhof', 'Supermarkt', 'Strand', 'Spielplatz', 'Schwimmbad', 'Kino')
const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
const DAY_EN: Record<string, string> = { Montag: 'Monday', Dienstag: 'Tuesday', Mittwoch: 'Wednesday', Donnerstag: 'Thursday', Freitag: 'Friday', Samstag: 'Saturday', Sonntag: 'Sunday' }

const CONTR_ITEMS: ContrItem[] = [
  ...ZU_PLACES.map((n) => ({ frame: 'Ich gehe ___ X.', prep: 'zu', c: 'dat' as Case, noun: n, en: `I am going to the ${n.en}.` })),
  ...IN_PLACES.map((n) => ({ frame: 'Ich bin ___ X.', prep: 'in', c: 'dat' as Case, noun: n, en: `I am in the ${n.en}.` })),
  ...IN_PLACES.filter((n) => n.de !== 'Hotel').map((n) => ({ frame: 'Ich gehe ___ X.', prep: 'in', c: 'acc' as Case, noun: n, en: `I am going into the ${n.en}.` })),
  ...VON_PLACES.map((n) => ({ frame: 'Ich komme gerade ___ X.', prep: 'von', c: 'dat' as Case, noun: n, en: `I am just coming from the ${n.en}.` })),
  ...DAYS.map((day) => ({ frame: 'Ich spiele ___ X Tennis.', prep: 'an', c: 'dat' as Case, noun: nn(day, 'm', DAY_EN[day] as string), en: `I play tennis on ${DAY_EN[day]}.` })),
  { frame: 'Wir sind ___ X.', prep: 'an', c: 'dat', noun: nn('Strand', 'm', 'beach'), en: 'We are at the beach.' },
  { frame: 'Wir wohnen ___ X.', prep: 'an', c: 'dat', noun: nn('Meer', 'n', 'seaside'), en: 'We live at the seaside.' },
  { frame: 'Wir fahren ___ X.', prep: 'an', c: 'acc', noun: nn('Meer', 'n', 'seaside'), en: 'We are going to the seaside.' },
  { frame: 'Ich bin ___ X.', prep: 'bei', c: 'dat', noun: nn('Arzt', 'm', 'doctor'), en: 'I am at the doctor’s.' },
  { frame: 'Ich bin ___ X.', prep: 'bei', c: 'dat', noun: nn('Bäcker', 'm', 'baker'), en: 'I am at the baker’s.' },
  { frame: 'Ich lese die Zeitung ___ X.', prep: 'bei', c: 'dat', noun: nn('Frühstück', 'n', 'breakfast'), en: 'I read the paper at breakfast.' },
  { frame: 'Ich gehe ___ X.', prep: 'zu', c: 'dat', noun: nn('Arzt', 'm', 'doctor'), en: 'I am going to the doctor’s.' },
]

function contrAnswer(it: ContrItem): string {
  return contract(it.prep, DEF[it.c][it.noun.g])
}
const contrSentence = (it: ContrItem, fill: string) => it.frame.replace('___', fill).replace('X', it.noun.de)

const CONTR_RULE = 'zu dem → zum, zu der → zur, in dem → im, in das → ins, an dem → am, an das → ans, von dem → vom, bei dem → beim. There is no short form for in die, in der, zu den...'

const contractionGenerators: ItemGenerator[] = [
  G('gram.contr.match', 'grammar.contractions', [1, 2], (rng) => {
    const four = pickN(rng, CONTRACTIONS, 4)
    return matchItem({
      prompt: 'Match each preposition + article to its short form.',
      pairs: four.map(([long, short]) => ({ left: long, right: short })),
      hint: 'The short form keeps the preposition and the last letter of the article.',
      explanation: CONTR_RULE,
    })
  }),

  G('gram.contr.pick', 'grammar.contractions', [2, 4], (rng, d) => {
    const pool = d === 2 ? CONTR_ITEMS.filter((it) => contrAnswer(it).length <= 4) : CONTR_ITEMS
    const it = rng.pick(pool)
    const art = DEF[it.c][it.noun.g]
    const correct = contrAnswer(it)
    const hintShown = d === 2 ? `${it.prep} + ${art}` : `${it.prep} + ${DEF.nom[it.noun.g]} ${it.noun.de}`
    const otherCase = contract(it.prep, DEF[it.c === 'dat' ? 'acc' : 'dat'][it.noun.g])
    const shorts = CONTRACTIONS.map(([, x]) => x)
    // Same preposition first (the real decision), then other short forms.
    const candidates = [...new Set([otherCase, ...shorts.filter((x) => x.startsWith(it.prep.slice(0, 2))), ...rng.shuffle(shorts)])]
    const wrong = candidates
      .filter((x) => x !== correct)
      .map((x) =>
        x === otherCase && it.c === 'dat' ? { label: x, misconception: 'wrong-case', feedback: it.prep === 'in' || it.prep === 'an' ? 'That is the accusative, for movement to a place. Here it is a position, so dative.' : `${it.prep} always takes the dative.` } : x.includes(' ')
          ? { label: x, misconception: 'wrong-case', feedback: `That is the ${it.c === 'dat' ? 'accusative' : 'dative'}. ${it.prep === 'in' || it.prep === 'an' ? `Here ${it.c === 'dat' ? 'nothing is moving: position takes the dative' : 'there is movement to a place: that takes the accusative'}.` : `${it.prep} always takes the dative.`}` }
          : { label: x, misconception: 'wrong-contraction', feedback: `${x} is short for ${CONTRACTIONS.find(([, s]) => s === x)?.[0] ?? x}.` },
      )
    return choice({
      rng,
      prompt: `Fill the gap:  ${contrSentence(it, '___')}  (${hintShown})  (${it.en})`,
      correct,
      wrong: wrong.slice(0, 3),
      hint: d === 2 ? 'Join the two words into one.' : `Which case does ${it.prep} need here? Then is there a short form?`,
      explanation: `${contrSentence(it, correct)} ${it.prep} + ${CASE_WORD[it.c]} ${art}${correct.includes(' ') ? ' has no short form.' : ` → ${correct}.`} ${CONTR_RULE}`,
    })
  }),

  G('gram.contr.type', 'grammar.contractions', [3, 5], (rng) => {
    const it = rng.pick(CONTR_ITEMS)
    const correct = contrAnswer(it)
    return textItem({
      prompt: `Type the preposition and article, using the short form if there is one:  ${contrSentence(it, '___')}  (${it.prep} + ${DEF.nom[it.noun.g]} ${it.noun.de})  (${it.en})`,
      accept: accept(correct),
      placeholder: 'zum, zur, im, ins, in die...',
      hint: it.prep === 'in' || it.prep === 'an' ? 'Is there movement towards a place (accusative) or just a position (dative)?' : `${it.prep} takes the dative.`,
      explanation: `${contrSentence(it, correct)} ${CONTR_RULE}`,
    })
  }),
]

// =================================================================== accusative prepositions

const ACC_FRAMES: Frame[] = [
  { before: 'Das Geschenk ist für', after: '.', prep: 'für', en: (d, n) => `The present is for ${d} ${n}.`, nouns: byName('Bruder', 'Schwester', 'Vater', 'Mutter', 'Opa', 'Oma', 'Onkel', 'Tante'), dets: POSS_DETS },
  { before: 'Ich gehe ohne', after: 'ins Kino.', prep: 'ohne', en: (d, n) => `I am going to the cinema without ${d} ${n}.`, nouns: byName('Bruder', 'Schwester', 'Freund', 'Freundin', 'Cousin', 'Cousine'), dets: [MY] },
  { before: 'Wir laufen durch', after: '.', prep: 'durch', en: (d, n) => `We are walking through ${d} ${n}.`, nouns: [nn('Park', 'm', 'park'), nn('Wald', 'm', 'forest'), nn('Stadt', 'f', 'town'), nn('Garten', 'm', 'garden')], dets: [DEF_DET] },
  { before: 'Wir laufen um', after: '.', prep: 'um', en: (d, n) => `We are walking round ${d} ${n}.`, nouns: [nn('See', 'm', 'lake'), nn('Haus', 'n', 'house'), nn('Kirche', 'f', 'church'), nn('Park', 'm', 'park')], dets: [DEF_DET] },
  { before: 'Der Ball fliegt gegen', after: '.', prep: 'gegen', en: (d, n) => `The ball hits ${d} ${n}.`, nouns: [nn('Fenster', 'n', 'window'), nn('Tür', 'f', 'door'), nn('Baum', 'm', 'tree'), nn('Wand', 'f', 'wall')], dets: [DEF_DET] },
  { before: 'Ich kaufe Blumen für', after: '.', prep: 'für', en: (d, n) => `I am buying flowers for ${d} ${n}.`, nouns: byName('Oma', 'Mutter', 'Tante', 'Schwester'), dets: [MY] },
]

const ACC_PREPS = ['durch', 'für', 'gegen', 'ohne', 'um']
const DAT_PREPS = ['aus', 'bei', 'mit', 'nach', 'seit', 'von', 'zu']

const accPrepGenerators: ItemGenerator[] = [
  G('gram.accprep.case', 'grammar.accusative-prepositions', [1, 3], (rng, d) => {
    if (d === 3) {
      const a = rng.pick(ACC_PREPS)
      return choice({
        rng,
        prompt: 'Which preposition is always followed by the accusative?',
        correct: a,
        wrong: pickN(rng, DAT_PREPS, 3).map((x) => ({ label: x, misconception: 'dat-prep-as-acc', feedback: `${x} always takes the dative.` })),
        hint: 'Remember the accusative group: durch, für, gegen, ohne, um.',
        explanation: `${a} takes the accusative. Accusative: durch, für, gegen, ohne, um. Dative: aus, bei, mit, nach, seit, von, zu.`,
      })
    }
    const isAcc = rng.chance(0.6)
    const p = rng.pick(isAcc ? ACC_PREPS : DAT_PREPS)
    return choice({
      rng,
      prompt: `Which case always follows ${q2(p)}?`,
      correct: isAcc ? 'accusative' : 'dative',
      wrong: [
        isAcc ? { label: 'dative', misconception: 'acc-prep-as-dative', feedback: `${p} is in the accusative group: durch, für, gegen, ohne, um.` } : { label: 'accusative', misconception: 'dat-prep-as-acc', feedback: `${p} is in the dative group: aus, bei, mit, nach, seit, von, zu.` },
        { label: 'nominative', misconception: 'nominative-after-preposition', feedback: 'The nominative is for the subject; prepositions never take it.' },
      ],
      keepOrder: false,
      hint: 'Two groups to learn: durch, für, gegen, ohne, um (accusative) and aus, bei, mit, nach, seit, von, zu (dative).',
      explanation: `${p} + ${isAcc ? 'accusative' : 'dative'}. Accusative: durch, für, gegen, ohne, um. Dative: aus, bei, mit, nach, seit, von, zu.`,
    })
  }),

  G('gram.accprep.pick', 'grammar.accusative-prepositions', [2, 4], (rng, d) => {
    // Level 4 mixes in dative frames, so she has to decide which case the preposition needs.
    const useDat = d === 4 && rng.chance(0.4)
    const f = rng.pick(useDat ? DAT_FRAMES.filter((x) => x.prep !== 'seit') : ACC_FRAMES)
    const c: Case = useDat ? 'dat' : 'acc'
    const b = build(rng, f, c, 3)
    return choice({
      rng,
      prompt: `Choose the word for ${detAsk(b.det)}:  ${b.sentence}  (${b.en})`,
      correct: b.answer,
      wrong: pickN(rng, b.wrong, 3),
      hint: `Which case does ${f.prep} take? Is ${b.noun.de} der, die or das?`,
      explanation: `${b.sentence.replace('___', b.answer)} ${f.prep} takes the ${CASE_WORD[c]}. ${CASE_RULE[c]}`,
    })
  }),

  G('gram.accprep.type', 'grammar.accusative-prepositions', [3, 5], (rng, d) => {
    const useDat = d === 5 && rng.chance(0.4)
    const f = rng.pick(useDat ? DAT_FRAMES : ACC_FRAMES)
    const c: Case = useDat ? 'dat' : 'acc'
    const b = build(rng, f, c, d)
    return textItem({
      prompt: `Type the missing word for ${detAsk(b.det)}:  ${b.sentence}  (${b.en})`,
      accept: accept(b.answer),
      placeholder: 'den, die, das, meinen...',
      hint: `Which case does ${f.prep} take? ${b.noun.de} is ${GENDER_WORD[b.g === 'pl' ? 'pl' : b.noun.g]}.`,
      explanation: `${b.sentence.replace('___', b.answer)} ${f.prep} + ${CASE_WORD[c]}. ${CASE_RULE[c as 'dat' | 'acc']}`,
    })
  }),
]

function q2(s: string) {
  return `"${s}"`
}

// =================================================================== two-way prepositions

const PREP_EN: Record<string, [string, string]> = { auf: ['on', 'onto'], unter: ['under', 'under'], hinter: ['behind', 'behind'], neben: ['next to', 'next to'] }
const FURN: Record<string, Nn[]> = {
  auf: [nn('Tisch', 'm', 'table'), nn('Bett', 'n', 'bed'), nn('Sofa', 'n', 'sofa'), nn('Stuhl', 'm', 'chair'), nn('Schrank', 'm', 'cupboard')],
  unter: [nn('Tisch', 'm', 'table'), nn('Bett', 'n', 'bed'), nn('Sofa', 'n', 'sofa'), nn('Stuhl', 'm', 'chair')],
  hinter: [nn('Sofa', 'n', 'sofa'), nn('Schrank', 'm', 'cupboard'), nn('Tür', 'f', 'door')],
  neben: [nn('Sofa', 'n', 'sofa'), nn('Bett', 'n', 'bed'), nn('Tür', 'f', 'door'), nn('Fenster', 'n', 'window')],
}
const POS_VERB: Record<string, [string, string][]> = {
  auf: [['sitzt', 'is sitting'], ['schläft', 'is sleeping']],
  unter: [['schläft', 'is sleeping'], ['liegt', 'is lying']],
  hinter: [['sitzt', 'is sitting'], ['schläft', 'is sleeping']],
  neben: [['liegt', 'is lying'], ['schläft', 'is sleeping']],
}
const MOVE_VERB: Record<string, [string, string]> = { auf: ['springt', 'jumps'], unter: ['läuft', 'runs'], hinter: ['läuft', 'runs'], neben: ['legt sich', 'lies down'] }
const ANIMALS: [string, string][] = [
  ['Der Hund', 'The dog'],
  ['Die Katze', 'The cat'],
]

interface TwoWayCase {
  sentence: string
  en: string
  c: Case
  g: Gen
  noun: string
  answer: string
  prep: string
}

/** Fixed pairs with in, an, auf: Bild/Wand, Buch/Bett, Küche... (feminine or masculine-accusative only, so no
 * contraction can sneak in). */
const FIXED: TwoWayCase[] = [
  { sentence: 'Das Bild hängt an ___ Wand.', en: 'The picture is hanging on the wall.', c: 'dat', g: 'f', noun: 'Wand', answer: 'der', prep: 'an' },
  { sentence: 'Ich hänge das Bild an ___ Wand.', en: 'I am hanging the picture on the wall.', c: 'acc', g: 'f', noun: 'Wand', answer: 'die', prep: 'an' },
  { sentence: 'Das Buch liegt auf ___ Bett.', en: 'The book is lying on the bed.', c: 'dat', g: 'n', noun: 'Bett', answer: 'dem', prep: 'auf' },
  { sentence: 'Ich lege das Buch auf ___ Bett.', en: 'I am putting the book on the bed.', c: 'acc', g: 'n', noun: 'Bett', answer: 'das', prep: 'auf' },
  { sentence: 'Die Lampe steht auf ___ Tisch.', en: 'The lamp is on the table.', c: 'dat', g: 'm', noun: 'Tisch', answer: 'dem', prep: 'auf' },
  { sentence: 'Ich stelle die Lampe auf ___ Tisch.', en: 'I am putting the lamp on the table.', c: 'acc', g: 'm', noun: 'Tisch', answer: 'den', prep: 'auf' },
  { sentence: 'Ich bin in ___ Küche.', en: 'I am in the kitchen.', c: 'dat', g: 'f', noun: 'Küche', answer: 'der', prep: 'in' },
  { sentence: 'Ich gehe in ___ Küche.', en: 'I am going into the kitchen.', c: 'acc', g: 'f', noun: 'Küche', answer: 'die', prep: 'in' },
  { sentence: 'Wir wohnen in ___ Stadt.', en: 'We live in the town.', c: 'dat', g: 'f', noun: 'Stadt', answer: 'der', prep: 'in' },
  { sentence: 'Wir fahren in ___ Stadt.', en: 'We are going into town.', c: 'acc', g: 'f', noun: 'Stadt', answer: 'die', prep: 'in' },
  { sentence: 'Lena geht in ___ Garten.', en: 'Lena is going into the garden.', c: 'acc', g: 'm', noun: 'Garten', answer: 'den', prep: 'in' },
  { sentence: 'Ich lerne in ___ Bibliothek.', en: 'I study in the library.', c: 'dat', g: 'f', noun: 'Bibliothek', answer: 'der', prep: 'in' },
]

function twoWayCase(rng: Rng): TwoWayCase {
  if (rng.chance(0.3)) return rng.pick(FIXED)
  const prep = rng.pick(Object.keys(FURN))
  const noun = rng.pick(FURN[prep] as Nn[])
  const [subj, enSubj] = rng.pick(ANIMALS)
  const move = rng.chance(0.5)
  const c: Case = move ? 'acc' : 'dat'
  const [vDe, vEn] = move ? (MOVE_VERB[prep] as [string, string]) : rng.pick(POS_VERB[prep] as [string, string][])
  const enPrep = (PREP_EN[prep] as [string, string])[move ? 1 : 0]
  return {
    sentence: `${subj} ${vDe} ${prep} ___ ${noun.de}.`,
    en: `${enSubj} ${vEn} ${enPrep} the ${noun.en}.`,
    c,
    g: noun.g,
    noun: noun.de,
    answer: DEF[c][noun.g],
    prep,
  }
}

const TWO_WAY_RULE = 'in, an, auf, hinter, neben, über, unter, vor and zwischen take the dative for a position (wo? where is it?) and the accusative for movement to a place (wohin? where to?).'

const twoWayGenerators: ItemGenerator[] = [
  G('gram.twoway.case', 'grammar.two-way-prepositions', [2, 3], (rng) => {
    const t = twoWayCase(rng)
    const dat = 'dative: a position (wo?)'
    const acc = 'accusative: movement to a place (wohin?)'
    return choice({
      rng,
      prompt: `Which case is needed after ${q2(t.prep)} here?  ${t.sentence}  (${t.en})`,
      correct: t.c === 'dat' ? dat : acc,
      wrong: [
        t.c === 'dat'
          ? { label: acc, misconception: 'position-as-movement', feedback: 'Nothing is moving to a new place: ask "wo?" (where?). That is the dative.' }
          : { label: dat, misconception: 'movement-as-position', feedback: 'Something is moving to a new place: ask "wohin?" (where to?). That is the accusative.' },
      ],
      keepOrder: true,
      hint: 'Ask: wo? (where is it?) or wohin? (where is it going?)',
      explanation: `${t.sentence.replace('___', t.answer)} ${TWO_WAY_RULE}`,
    })
  }),

  G('gram.twoway.pick', 'grammar.two-way-prepositions', [3, 5], (rng) => {
    const t = twoWayCase(rng)
    const other: Case = t.c === 'dat' ? 'acc' : 'dat'
    const wrong = [
      { label: DEF[other][t.g], misconception: t.c === 'dat' ? 'position-as-movement' : 'movement-as-position', feedback: t.c === 'dat' ? 'That is the accusative, for movement. Here it is a position (wo?), so dative.' : 'That is the dative, for a position. Here there is movement (wohin?), so accusative.' },
      { label: DEF.nom[t.g], misconception: 'nominative-after-preposition', feedback: `That is the nominative. After ${t.prep} you need the dative or the accusative.` },
      ...(['m', 'f', 'n'] as Gen[]).filter((g) => g !== t.g).map((g) => ({ label: DEF[t.c][g], misconception: 'wrong-gender', feedback: `${t.noun} is ${GENDER_WORD[t.g]}.` })),
    ]
    return choice({
      rng,
      prompt: `Choose the article:  ${t.sentence}  (${t.en})`,
      correct: t.answer,
      wrong: pickN(rng, wrong.filter((w) => w.label !== t.answer), 3),
      hint: `wo? or wohin? And is ${t.noun} der, die or das?`,
      explanation: `${t.sentence.replace('___', t.answer)} ${t.c === 'dat' ? 'Position (wo?) → dative' : 'Movement (wohin?) → accusative'}: ${DEF.nom[t.g]} → ${t.answer}. ${TWO_WAY_RULE}`,
    })
  }),

  G('gram.twoway.type', 'grammar.two-way-prepositions', [4, 5], (rng) => {
    const t = twoWayCase(rng)
    return textItem({
      prompt: `Type the article:  ${t.sentence}  (${t.en})`,
      accept: [t.answer],
      placeholder: 'der, die, das, den, dem',
      hint: `Is it a position or a movement? ${cap(t.noun)} is ${GENDER_WORD[t.g]}.`,
      explanation: `${t.sentence.replace('___', t.answer)} ${t.c === 'dat' ? 'Position (wo?) → dative.' : 'Movement (wohin?) → accusative.'} ${TWO_WAY_RULE}`,
    })
  }),
]

export const prepositionGenerators: ItemGenerator[] = [...dativeGenerators, ...contractionGenerators, ...accPrepGenerators, ...twoWayGenerators]
