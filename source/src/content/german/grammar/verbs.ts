import type { ItemGenerator } from '@/engine/registry'
import type { Rng } from '@/engine/types'
import { choice, generatorFor, matchItem, orderItem, reveal, textItem } from '../../kit'
import { accept, ACTIVITIES, cap, enModal, IRREGULAR, MODALS, PERSONS, pickN, q, SEPARABLE, SLOT_LABEL, TYPE_HINT, type Activity, type Person } from './data'

const G = generatorFor('german')

const subjCap = (p: Person) => cap(p.de)

// =================================================================== stem-changing verbs

/** The "regular" form a pupil might wrongly build without the vowel change. */
function regularised(inf: string, slot: number): string {
  const stem = inf.replace(/en$/, '')
  if (slot === 1) return /(s|ss|ß|z)$/.test(stem) ? `${stem}t` : `${stem}st`
  if (slot === 2) return `${stem}t`
  return stem
}

const IRREG_RULE = 'Stem-changing verbs change their vowel only with du and er / sie / es: a → ä (fahren → du fährst), au → äu (laufen → er läuft), e → i (essen → er isst), e → ie (lesen → du liest). ich, wir, ihr and sie / Sie keep the normal stem.'

function irregCase(rng: Rng, d: number) {
  const v = rng.pick(IRREGULAR)
  // Lower levels focus on du and er/sie/es, where the change happens.
  const pool = d <= 2 ? PERSONS.filter((p) => p.slot === 1 || p.slot === 2) : PERSONS
  const p = rng.pick(pool)
  const correct = v.forms[p.slot]
  return { v, p, correct, sentence: `${subjCap(p)} ___ ${v.rest}.` }
}

const irregularGenerators: ItemGenerator[] = [
  G('gram.irreg.pick', 'grammar.irregular-verbs', [1, 3], (rng, d) => {
    const { v, p, correct, sentence } = irregCase(rng, d)
    const changed = p.slot === 1 || p.slot === 2
    const wrong: { label: string; misconception: string; feedback: string }[] = []
    if (changed) wrong.push({ label: regularised(v.inf, p.slot), misconception: 'no-stem-change', feedback: `${v.inf} changes its vowel (${v.change}) with du and er/sie/es.` })
    else wrong.push({ label: v.forms[p.slot === 0 ? 2 : 1], misconception: 'stem-change-everywhere', feedback: `The vowel only changes with du and er/sie/es. With ${p.de} it stays: ${correct}.` })
    for (const s of [0, 1, 2, 3, 4] as const) {
      const f = v.forms[s]
      if (f !== correct && !wrong.some((w) => w.label === f)) wrong.push({ label: f, misconception: 'wrong-person', feedback: `${f} goes with ${SLOT_LABEL[s]}.` })
    }
    return choice({
      rng,
      prompt: `Choose the right form of ${q(v.inf)} (to ${v.en}):  ${sentence}`,
      correct,
      wrong: [wrong[0] as (typeof wrong)[number], ...pickN(rng, wrong.slice(1), 2)],
      hint: `Who is the subject? ${changed ? `Does ${v.inf} change its vowel?` : 'Does the vowel change for this person?'}`,
      explanation: `${sentence.replace('___', correct)} ${IRREG_RULE}`,
    })
  }),

  G('gram.irreg.match', 'grammar.irregular-verbs', [2, 3], (rng) => {
    const four = pickN(rng, IRREGULAR, 4)
    return matchItem({
      prompt: 'Match each verb to its er / sie / es form.',
      pairs: four.map((v) => ({ left: v.inf, right: v.forms[2] })),
      hint: 'Look for the vowel change: a → ä, e → i, e → ie.',
      explanation: four.map((v) => `${v.inf} → er ${v.forms[2]} (${v.change})`).join('; ') + '.',
    })
  }),

  G('gram.irreg.type', 'grammar.irregular-verbs', [3, 5], (rng, d) => {
    const { v, p, correct, sentence } = irregCase(rng, d >= 4 ? 3 : 2)
    return textItem({
      prompt: `Type the right form of ${q(v.inf)} (to ${v.en}):  ${sentence}`,
      accept: accept(correct),
      placeholder: 'Verb',
      hint: `${v.inf} is a stem-changing verb (${v.change}). ${TYPE_HINT}`,
      explanation: `${sentence.replace('___', correct)} ${p.slot === 1 || p.slot === 2 ? `With ${p.de === 'du' ? 'du' : 'er / sie / es'} the vowel changes: ${v.change}.` : `With ${p.de} there is no vowel change.`} ${IRREG_RULE}`,
    })
  }),
]

// =================================================================== separable verbs

const SEP_RULE = 'Separable verbs split in the present tense: the verb goes second and the prefix goes to the very end (aufstehen → Ich stehe um sieben Uhr auf).'

function sepCase(rng: Rng) {
  const v = rng.pick(SEPARABLE)
  const p = rng.pick(PERSONS)
  const verb = v.forms[p.slot]
  const sentence = `${subjCap(p)} ${verb} ${v.mid} ${v.prefix}.`
  return { v, p, verb, sentence }
}

const separableGenerators: ItemGenerator[] = [
  G('gram.sep.match', 'grammar.separable-verbs', [1, 2], (rng) => {
    const four = pickN(rng, SEPARABLE, 4)
    return matchItem({
      prompt: 'Match each separable verb to its meaning.',
      pairs: four.map((v) => ({ left: v.inf, right: v.en })),
      hint: 'Split each verb into prefix + verb: auf + stehen, fern + sehen...',
      explanation: four.map((v) => `${v.inf} (${v.prefix} + ${v.inf.slice(v.prefix.length)}) = ${v.en}`).join('; ') + '.',
    })
  }),

  G('gram.sep.pick', 'grammar.separable-verbs', [1, 3], (rng) => {
    const { v, p, verb, sentence } = sepCase(rng)
    const joined = v.prefix + verb
    return choice({
      rng,
      prompt: `Which sentence correctly uses ${q(v.inf)} (to ${v.en})?`,
      correct: sentence,
      wrong: [
        { label: `${subjCap(p)} ${joined} ${v.mid}.`, misconception: 'separable-not-split', feedback: 'In a normal present-tense sentence the prefix splits off and goes to the end.' },
        { label: `${subjCap(p)} ${verb} ${v.mid}.`, misconception: 'prefix-dropped', feedback: `Without "${v.prefix}" it is a different verb. The prefix goes to the end.` },
        { label: `${subjCap(p)} ${v.prefix} ${verb} ${v.mid}.`, misconception: 'prefix-before-verb', feedback: 'The prefix does not stay in front of the verb: it goes to the very end.' },
      ],
      hint: 'Where does the little prefix go?',
      explanation: `${sentence} ${SEP_RULE}`,
    })
  }),

  G('gram.sep.order', 'grammar.separable-verbs', [2, 4], (rng, d) => {
    const { v, p, verb, sentence } = sepCase(rng)
    if (d === 4 && v.mid !== 'heute') {
      const time = rng.pick(['Heute', 'Morgen', 'Jeden Tag'])
      const correct = [time, verb, p.de, v.mid, v.prefix]
      return orderItem({
        rng,
        prompt: `Put the words in order. Start with ${q(time)}.  (${v.inf} = to ${v.en})`,
        correct,
        direction: ['first', 'last'],
        hint: 'Verb second, then the subject, and the prefix right at the end.',
        explanation: `${correct.join(' ')}. After a time phrase the verb stays second and the subject comes after it. ${SEP_RULE}`,
      })
    }
    const correct = [subjCap(p), verb, v.mid, v.prefix]
    return orderItem({
      rng,
      prompt: `Put the words in order. Start with the subject.  (${v.inf} = to ${v.en})`,
      correct,
      direction: ['first', 'last'],
      hint: 'Subject, verb, the rest, and the prefix at the end.',
      explanation: `${sentence} ${SEP_RULE}`,
    })
  }),

  G('gram.sep.type', 'grammar.separable-verbs', [3, 5], (rng) => {
    const { v, p, sentence } = sepCase(rng)
    return textItem({
      prompt: `Write the sentence in the present tense, starting with the subject:  ${p.de} / ${v.inf} / ${v.mid}`,
      accept: accept(sentence),
      placeholder: 'Type the whole sentence',
      hint: `${v.inf} = ${v.prefix} + ${v.inf.slice(v.prefix.length)}. Which part goes to the end? ${TYPE_HINT}`,
      explanation: `${sentence} ${SEP_RULE}`,
    })
  }),
]

// =================================================================== modal verbs

const MODAL_RULE = 'Modals are irregular in the singular: ich and er/sie/es have the same form with no ending (ich kann, er kann), and most change their vowel (können → kann, müssen → muss, dürfen → darf, wollen → will). Plural forms are regular (wir können).'
const INF_MODALS = MODALS.filter((m) => m.withInfinitive)
const MOEGEN_OBJ = ['Pizza', 'Hunde', 'Mathe', 'Musik', 'Schokolade', 'Fußball']

function modalCase(rng: Rng, d: number) {
  const m = rng.pick(d >= 3 ? MODALS : INF_MODALS)
  const p = rng.pick(PERSONS)
  const act = rng.pick(ACTIVITIES)
  const correct = m.forms[p.slot]
  const sentence = m.withInfinitive ? `${subjCap(p)} ___ ${act.mid} ${act.inf}.` : `${subjCap(p)} ___ ${rng.pick(MOEGEN_OBJ)}.`
  return { m, p, act, correct, sentence }
}

const modalGenerators: ItemGenerator[] = [
  G('gram.modal.form', 'grammar.modal-verbs', [1, 3], (rng, d) => {
    const { m, p, correct, sentence } = modalCase(rng, d)
    const wrong: { label: string; misconception: string; feedback: string }[] = []
    const ending = p.slot === 0 ? 'e' : 't'
    if ((p.slot === 0 || p.slot === 2) && !correct.endsWith(ending)) wrong.push({ label: `${correct}${ending}`, misconception: 'regular-ending-on-modal', feedback: `Modals have no ending with ${p.slot === 0 ? 'ich' : 'er/sie/es'}: ${correct}.` })
    if (p.slot === 0 && ['können', 'müssen', 'dürfen', 'wollen'].includes(m.inf)) wrong.push({ label: m.inf.replace(/n$/, ''), misconception: 'no-vowel-change', feedback: `${m.inf} changes in the singular: ich ${correct}.` })
    for (const s of [0, 1, 2, 3, 4, 5] as const) {
      const f = m.forms[s]
      if (f !== correct && !wrong.some((w) => w.label === f)) wrong.push({ label: f, misconception: 'wrong-person', feedback: `${f} goes with ${SLOT_LABEL[s]}.` })
    }
    return choice({
      rng,
      prompt: `Choose the right form of ${q(m.inf)} (${m.en}):  ${sentence}`,
      correct,
      wrong: pickN(rng, wrong.filter((w) => w.label !== correct), 3),
      hint: `Who is the subject? ${SLOT_LABEL[p.slot]}.`,
      explanation: `${sentence.replace('___', correct)} ${m.inf}: ${m.forms.join(', ')}. ${MODAL_RULE}`,
    })
  }),

  G('gram.modal.meaning', 'grammar.modal-verbs', [2, 4], (rng, d) => {
    if (d === 4 && rng.chance(0.5)) {
      // Only phrases where "nicht" sits naturally before them (not "nicht Tennis", which would be "kein Tennis").
      const act = rng.pick(ACTIVITIES.filter((a) => ['früh', 'ins Kino', 'nach Hause', 'mit dem Bus'].includes(a.mid)))
      const must = rng.chance(0.5)
      const de = must ? `Du musst nicht ${act.mid} ${act.inf}.` : `Du darfst nicht ${act.mid} ${act.inf}.`
      const notHave = `You don’t have to ${act.en}.`
      const mustnt = `You mustn’t ${act.en}.`
      return choice({
        rng,
        prompt: `Careful! What does this mean?  ${de}`,
        correct: must ? notHave : mustnt,
        wrong: [
          must
            ? { label: mustnt, misconception: 'muessen-nicht-as-mustnt', feedback: '"müssen nicht" means "don’t have to". "Mustn’t" is "darf nicht".' }
            : { label: notHave, misconception: 'duerfen-nicht-as-dont-have-to', feedback: '"darf nicht" means "mustn’t / not allowed to". "Don’t have to" is "muss nicht".' },
          `You can’t ${act.en}.`,
          `You don’t want to ${act.en}.`,
        ],
        hint: 'müssen nicht and dürfen nicht are NOT the same.',
        explanation: `${de} = ${must ? notHave : mustnt} Remember: nicht müssen = not have to; nicht dürfen = must not.`,
      })
    }
    const m = rng.pick(INF_MODALS)
    const act = rng.pick(ACTIVITIES)
    const de = `Ich ${m.forms[0]} ${act.mid} ${act.inf}.`
    const enFor = (x: (typeof MODALS)[number]) => `I ${enModal(x, 0)} ${act.en}.`
    return choice({
      rng,
      prompt: `What does this mean?  ${de}`,
      correct: enFor(m),
      wrong: pickN(rng, INF_MODALS.filter((x) => x !== m), 3).map((x) => ({ label: enFor(x), misconception: `${m.inf}-meaning`, feedback: `That would be: Ich ${x.forms[0]} ${act.mid} ${act.inf}.` })),
      hint: 'können = can, müssen = have to, wollen = want to, dürfen = be allowed to, sollen = should, möchten = would like to.',
      explanation: `${m.inf} = ${m.en}. ${de} = ${enFor(m)} Watch out: ich will means "I want", not "I will".`,
    })
  }),

  G('gram.modal.type', 'grammar.modal-verbs', [3, 5], (rng, d) => {
    const { m, p, correct, sentence } = modalCase(rng, d)
    return textItem({
      prompt: `Type the right form of ${q(m.inf)} (${m.en}):  ${sentence}`,
      accept: accept(correct),
      placeholder: 'Modal verb',
      hint: `${SLOT_LABEL[p.slot]} form.${p.slot === 0 || p.slot === 2 ? ' ich and er/sie/es have no ending.' : ''} ${TYPE_HINT}`,
      explanation: `${sentence.replace('___', correct)} ${m.inf}: ${m.forms.join(', ')}.`,
    })
  }),
]

// =================================================================== modal word order

const MODAL_WO_RULE = 'With a modal verb, the modal is the second idea and the infinitive goes to the very end: Ich muss heute Hausaufgaben machen. A separable verb stays in one piece at the end (aufstehen).'

function modalSentence(m: (typeof MODALS)[number], p: Person, a: Activity): string[] {
  const main = `${subjCap(p)} ${m.forms[p.slot]} ${a.mid} ${a.inf}.`
  const out = [main]
  // A time phrase can also start the sentence, with the subject after the modal.
  if (/^(heute Abend|am Samstag)$/.test(a.mid)) out.push(`${cap(a.mid)} ${m.forms[p.slot]} ${p.de} ${a.inf}.`)
  return out
}
const enModalSentence = (m: (typeof MODALS)[number], p: Person, a: Activity) => `${cap(p.en)} ${enModal(m, p.slot)} ${a.en}.`

const modalOrderGenerators: ItemGenerator[] = [
  G('gram.modalwo.pick', 'grammar.modal-word-order', [2, 3], (rng) => {
    const m = rng.pick(INF_MODALS)
    const p = rng.pick(PERSONS)
    const a = rng.pick(ACTIVITIES)
    const f = m.forms[p.slot]
    const s = subjCap(p)
    return choice({
      rng,
      prompt: `Which sentence means ${q(enModalSentence(m, p, a))}?`,
      correct: modalSentence(m, p, a)[0] as string,
      wrong: [
        { label: `${s} ${f} ${a.inf} ${a.mid}.`, misconception: 'infinitive-not-last', feedback: 'The infinitive goes to the very end.' },
        { label: `${s} ${a.mid} ${a.inf} ${f}.`, misconception: 'modal-not-second', feedback: 'In a main clause the modal must be the second idea.' },
        { label: `${s} ${f} ${a.mid} ${a.inf.replace(/en$/, a.inf.endsWith('ern') ? 'ert' : 't')}.`, misconception: 'conjugated-infinitive', feedback: 'Only the modal is conjugated. The other verb stays as an infinitive.' },
      ],
      hint: 'Two verbs: one is second, one is at the end.',
      explanation: `${modalSentence(m, p, a)[0]} ${MODAL_WO_RULE}`,
    })
  }),

  G('gram.modalwo.order', 'grammar.modal-word-order', [2, 4], (rng, d) => {
    const m = rng.pick(INF_MODALS)
    const p = rng.pick(PERSONS)
    const a = rng.pick(d >= 4 ? ACTIVITIES.filter((x) => !/heute|am /.test(x.mid)) : ACTIVITIES)
    if (d === 4) {
      const [time, enTime] = rng.pick([['Heute', 'Today'], ['Morgen', 'Tomorrow'], ['Am Wochenende', 'At the weekend']] as const)
      const correct = [time, m.forms[p.slot], p.de, a.mid, a.inf]
      return orderItem({
        rng,
        prompt: `Put the words in order. Start with ${q(time)}.  (${enTime} ${p.en} ${enModal(m, p.slot)} ${a.en}.)`,
        correct,
        direction: ['first', 'last'],
        hint: 'The modal is still second; the subject comes after it; the infinitive is last.',
        explanation: `${correct.join(' ')}. ${MODAL_WO_RULE}`,
      })
    }
    const correct = [subjCap(p), m.forms[p.slot], a.mid, a.inf]
    return orderItem({
      rng,
      prompt: `Put the words in order. Start with the subject.  (${enModalSentence(m, p, a)})`,
      correct,
      direction: ['first', 'last'],
      hint: 'Modal second, infinitive last.',
      explanation: `${modalSentence(m, p, a)[0]} ${MODAL_WO_RULE}`,
    })
  }),

  G('gram.modalwo.type', 'grammar.modal-word-order', [3, 5], (rng, d) => {
    const m = rng.pick(INF_MODALS)
    const p = d === 3 ? (PERSONS[0] as Person) : rng.pick(PERSONS)
    const a = rng.pick(ACTIVITIES)
    const variants = modalSentence(m, p, a)
    return textItem({
      prompt: `Translate into German:  ${enModalSentence(m, p, a)}  (use ${m.inf} and ${a.inf})`,
      accept: accept(...variants),
      placeholder: 'Type the sentence',
      hint: `Use ${m.inf}: ${m.forms[p.slot]} goes second, ${a.inf} goes last. ${TYPE_HINT}`,
      explanation: `${variants[0]} ${MODAL_WO_RULE}`,
    })
  }),

  G('gram.modalwo.write', 'grammar.modal-word-order', [3, 5], (rng) => {
    const task = rng.pick([
      {
        prompt: 'Write 3-4 sentences in German about the rules at home: what you must do (müssen), what you are allowed to do (dürfen) and what you are not allowed to do.',
        model: 'Ich muss jeden Tag mein Zimmer aufräumen. Am Wochenende darf ich lange schlafen. Ich darf nicht nach zehn Uhr fernsehen, und ich muss um neun Uhr ins Bett gehen.',
      },
      {
        prompt: 'Write 3-4 sentences in German about your plans and wishes for the summer holidays, using wollen, möchten and können.',
        model: 'In den Sommerferien möchte ich nach Österreich fahren. Dort will ich jeden Tag schwimmen. Meine Freundin kann leider nicht mitkommen, aber wir können jeden Abend chatten.',
      },
      {
        prompt: 'Write 3-4 sentences in German about the rules at school, using müssen, dürfen and sollen.',
        model: 'In meiner Schule müssen wir eine Uniform tragen. Wir dürfen im Unterricht kein Handy benutzen. Man soll pünktlich sein, und wir dürfen in der Pause nicht im Klassenzimmer essen.',
      },
    ])
    return reveal({
      prompt: task.prompt,
      model: task.model,
      checklist: ['Uses at least three modal verbs', 'Puts the modal verb second in each main clause', 'Puts the infinitive at the very end', 'Uses the right modal form for the subject (ich muss, wir müssen)', 'Uses nicht or kein correctly in at least one sentence'],
      passMark: 3,
      hint: 'Modal second, infinitive last. Separable verbs stay joined at the end: aufräumen, fernsehen.',
    })
  }),
]

// =================================================================== imperative

interface Imp {
  inf: string
  en: string
  du: string[]
  ihr: string
  sie: string
  mid: string
  prefix?: string
  presentDu: string
  /** A tempting wrong du-imperative (no vowel change, or a wrong umlaut). */
  bad?: string
}

const IMPS: Imp[] = [
  { inf: 'kommen', en: 'Come quickly!', du: ['Komm', 'Komme'], ihr: 'Kommt', sie: 'Kommen', mid: 'schnell', presentDu: 'Kommst' },
  { inf: 'gehen', en: 'Go home!', du: ['Geh', 'Gehe'], ihr: 'Geht', sie: 'Gehen', mid: 'nach Hause', presentDu: 'Gehst' },
  { inf: 'machen', en: 'Do the homework!', du: ['Mach', 'Mache'], ihr: 'Macht', sie: 'Machen', mid: 'die Hausaufgaben', presentDu: 'Machst' },
  { inf: 'trinken', en: 'Drink lots of water!', du: ['Trink', 'Trinke'], ihr: 'Trinkt', sie: 'Trinken', mid: 'viel Wasser', presentDu: 'Trinkst' },
  { inf: 'schreiben', en: 'Write an email!', du: ['Schreib', 'Schreibe'], ihr: 'Schreibt', sie: 'Schreiben', mid: 'eine E-Mail', presentDu: 'Schreibst' },
  { inf: 'warten', en: 'Wait here!', du: ['Warte'], ihr: 'Wartet', sie: 'Warten', mid: 'hier', presentDu: 'Wartest' },
  { inf: 'öffnen', en: 'Open the window!', du: ['Öffne'], ihr: 'Öffnet', sie: 'Öffnen', mid: 'das Fenster', presentDu: 'Öffnest', bad: 'Öffn' },
  { inf: 'lesen', en: 'Read the text!', du: ['Lies'], ihr: 'Lest', sie: 'Lesen', mid: 'den Text', presentDu: 'Liest', bad: 'Lese' },
  { inf: 'essen', en: 'Eat the vegetables!', du: ['Iss'], ihr: 'Esst', sie: 'Essen', mid: 'das Gemüse', presentDu: 'Isst', bad: 'Esse' },
  { inf: 'nehmen', en: 'Take the bus!', du: ['Nimm'], ihr: 'Nehmt', sie: 'Nehmen', mid: 'den Bus', presentDu: 'Nimmst', bad: 'Nehme' },
  { inf: 'sprechen', en: 'Speak louder!', du: ['Sprich'], ihr: 'Sprecht', sie: 'Sprechen', mid: 'lauter', presentDu: 'Sprichst', bad: 'Spreche' },
  { inf: 'helfen', en: 'Help me!', du: ['Hilf'], ihr: 'Helft', sie: 'Helfen', mid: 'mir', presentDu: 'Hilfst', bad: 'Helfe' },
  { inf: 'geben', en: 'Give me the book!', du: ['Gib'], ihr: 'Gebt', sie: 'Geben', mid: 'mir das Buch', presentDu: 'Gibst', bad: 'Gebe' },
  { inf: 'fahren', en: 'Ride carefully!', du: ['Fahr', 'Fahre'], ihr: 'Fahrt', sie: 'Fahren', mid: 'vorsichtig', presentDu: 'Fährst', bad: 'Fähr' },
  { inf: 'schlafen', en: 'Sleep well!', du: ['Schlaf', 'Schlafe'], ihr: 'Schlaft', sie: 'Schlafen', mid: 'gut', presentDu: 'Schläfst', bad: 'Schläf' },
  { inf: 'sein', en: 'Be quiet!', du: ['Sei'], ihr: 'Seid', sie: 'Seien', mid: 'ruhig', presentDu: 'Bist', bad: 'Bist' },
  { inf: 'aufstehen', en: 'Get up now!', du: ['Steh', 'Stehe'], ihr: 'Steht', sie: 'Stehen', mid: 'jetzt', prefix: 'auf', presentDu: 'Stehst' },
  { inf: 'zuhören', en: 'Listen carefully!', du: ['Hör', 'Höre'], ihr: 'Hört', sie: 'Hören', mid: 'gut', prefix: 'zu', presentDu: 'Hörst' },
  { inf: 'mitkommen', en: 'Come along today!', du: ['Komm', 'Komme'], ihr: 'Kommt', sie: 'Kommen', mid: 'heute', prefix: 'mit', presentDu: 'Kommst' },
  { inf: 'aufräumen', en: 'Tidy the room!', du: ['Räum', 'Räume'], ihr: 'Räumt', sie: 'Räumen', mid: 'das Zimmer', prefix: 'auf', presentDu: 'Räumst' },
  { inf: 'zumachen', en: 'Close the door!', du: ['Mach', 'Mache'], ihr: 'Macht', sie: 'Machen', mid: 'die Tür', prefix: 'zu', presentDu: 'Machst' },
]

type Addressee = 'du' | 'ihr' | 'Sie'
const WHO: Record<Addressee, string> = { du: 'one friend (du)', ihr: 'two or more friends (ihr)', Sie: 'an adult you don’t know well (Sie)' }
const WHO_SHORT: Record<Addressee, string> = { du: 'one friend', ihr: 'two or more friends', Sie: 'an adult, politely (Sie)' }

function impSentence(i: Imp, a: Addressee, duForm?: string): string {
  const verb = a === 'du' ? (duForm ?? (i.du[0] as string)) : a === 'ihr' ? i.ihr : `${i.sie} Sie`
  return `${verb} ${i.mid}${i.prefix ? ` ${i.prefix}` : ''}!`
}

function badFeedback(i: Imp): string {
  if (i.inf === 'sein') return 'sein is irregular: Sei!'
  if (i.bad?.includes('ä')) return 'a → ä verbs lose the umlaut in the du-imperative: Fahr! Schlaf!'
  if (/i/.test(i.du[0] as string)) return 'e → i / ie verbs keep the change in the du-imperative: Lies! Nimm! Iss!'
  return 'Stems ending in -t, or -n after another consonant, keep an -e: Warte! Öffne!'
}

const IMP_RULE = 'du: the du-form without -st and without du (komm!, lies!, but a → ä verbs lose the umlaut: fahr!). ihr: the ihr-form without ihr (kommt!). Sie: the infinitive + Sie (kommen Sie!). A separable prefix goes to the end (Steh auf!). sein is irregular: sei, seid, seien Sie.'

const imperativeGenerators: ItemGenerator[] = [
  G('gram.imp.who', 'grammar.imperative', [1, 2], (rng) => {
    const i = rng.pick(IMPS)
    const a = rng.pick(['du', 'ihr', 'Sie'] as Addressee[])
    return choice({
      rng,
      prompt: `${q(impSentence(i, a))} (${i.en}) - who is this said to?`,
      correct: WHO_SHORT[a],
      wrong: (['du', 'ihr', 'Sie'] as Addressee[]).filter((x) => x !== a).map((x) => ({ label: WHO_SHORT[x], misconception: 'imperative-addressee', feedback: `To ${WHO_SHORT[x]} you would say: ${impSentence(i, x)}` })),
      keepOrder: true,
      hint: 'Look at the verb ending, and whether "Sie" is there.',
      explanation: `${impSentence(i, 'du')} (one friend) / ${impSentence(i, 'ihr')} (several friends) / ${impSentence(i, 'Sie')} (polite). ${IMP_RULE}`,
    })
  }),

  G('gram.imp.pick', 'grammar.imperative', [2, 4], (rng, d) => {
    const i = rng.pick(d === 2 ? IMPS.filter((x) => !x.bad || x.inf === 'warten') : IMPS)
    const a: Addressee = d <= 3 ? 'du' : rng.pick(['du', 'ihr', 'Sie'] as Addressee[])
    const correct = impSentence(i, a)
    const wrong = [
      { label: `${i.presentDu} ${i.mid}${i.prefix ? ` ${i.prefix}` : ''}!`, misconception: 'present-for-imperative', feedback: 'That is the du present tense. The imperative drops the -st.' },
      ...(i.bad ? [{ label: impSentence(i, 'du', i.bad), misconception: 'imperative-stem', feedback: badFeedback(i) }] : []),
      ...(['du', 'ihr', 'Sie'] as Addressee[]).filter((x) => x !== a).map((x) => ({ label: impSentence(i, x), misconception: 'wrong-addressee', feedback: `That is the form for ${WHO_SHORT[x]}.` })),
      ...(i.prefix ? [{ label: `${a === 'Sie' ? `${cap(i.prefix)}${i.sie.toLowerCase()} Sie` : `${cap(i.prefix)}${(a === 'du' ? (i.du[0] as string) : i.ihr).toLowerCase()}`} ${i.mid}!`, misconception: 'separable-imperative', feedback: 'The prefix goes to the end of the command.' }] : []),
    ].filter((w) => w.label !== correct && !(a === 'du' && i.du.some((f) => w.label === impSentence(i, 'du', f))))
    return choice({
      rng,
      prompt: `Tell ${WHO[a]}: ${q(i.en)}`,
      correct,
      wrong: pickN(rng, wrong, 3),
      hint: a === 'du' ? `Start from "du ${i.presentDu.toLowerCase()}" and drop du and the -st.` : a === 'ihr' ? 'Use the ihr-form without ihr.' : 'Infinitive + Sie.',
      explanation: `${correct} ${IMP_RULE}`,
    })
  }),

  G('gram.imp.type', 'grammar.imperative', [3, 5], (rng, d) => {
    const i = rng.pick(IMPS)
    const a: Addressee = d === 3 ? rng.pick(['du', 'ihr'] as Addressee[]) : rng.pick(['du', 'ihr', 'Sie'] as Addressee[])
    const answers = a === 'du' ? i.du.map((f) => impSentence(i, 'du', f)) : [impSentence(i, a)]
    return textItem({
      prompt: `Tell ${WHO[a]} in German: ${q(i.en)}  (${i.inf}${i.mid ? ` + ${i.mid}` : ''})`,
      accept: accept(...answers),
      placeholder: 'Type the command',
      hint: `${a === 'du' ? `du ${i.presentDu.toLowerCase()} → drop du and -st.` : a === 'ihr' ? 'ihr-form, no pronoun.' : 'Infinitive, then Sie.'} ${TYPE_HINT}`,
      explanation: `${answers[0]}${answers.length > 1 ? ` (also: ${answers.slice(1).join(' ')})` : ''} ${IMP_RULE}`,
    })
  }),
]

export const verbGenerators: ItemGenerator[] = [...irregularGenerators, ...separableGenerators, ...modalGenerators, ...modalOrderGenerators, ...imperativeGenerators]
