import type { ItemGenerator } from '@/engine/registry'
import { choice, orderItem, textItem } from '../kit'
import { G, atLevel, bankGen, classifyGen, q, sample, textGen, variants, type Example, type Lv, type MC, type TextQ } from './helpers'

// =====================================================================================================
// Word classes: tagged sentences. Only words whose class is clear-cut in that sentence are tagged.
// =====================================================================================================

type WC = 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun' | 'determiner' | 'preposition' | 'conjunction'

const WC_INFO: Record<WC, string> = {
  noun: 'A noun names a person, place, thing or idea (girl, London, table, courage).',
  verb: 'A verb shows an action, a state or something happening (run, is, seem, became).',
  adjective: 'An adjective describes a noun (a tiny kitten; the kitten was tiny).',
  adverb: 'An adverb adds to a verb, an adjective or another adverb: how, when, where, how often or how much (quietly, soon, here, very).',
  pronoun: 'A pronoun stands in for a noun (she, it, them, mine, who).',
  determiner: 'A determiner comes before a noun to pin it down (the, a, this, some, my).',
  preposition: 'A preposition links a noun or pronoun to the rest of the sentence, often showing place or time (under, after, with).',
  conjunction: 'A conjunction joins words or clauses (and, but, because, although).',
}

interface Tagged {
  s: string
  t: Partial<Record<string, WC>>
  /** Extra explanation for a tricky word. */
  n?: Record<string, string>
  lv?: Lv
}

/** KS2-level sentences: nouns, verbs, adjectives and adverbs only. */
const BASIC: Tagged[] = [
  { s: 'The tiny kitten slept peacefully.', t: { tiny: 'adjective', kitten: 'noun', slept: 'verb', peacefully: 'adverb' }, lv: 2 },
  { s: 'Jake quickly packed his heavy bag.', t: { quickly: 'adverb', packed: 'verb', heavy: 'adjective', bag: 'noun' }, lv: 2 },
  { s: 'A cold wind howled across the empty moor.', t: { cold: 'adjective', wind: 'noun', howled: 'verb', empty: 'adjective', moor: 'noun' }, lv: 2 },
  { s: 'The children laughed loudly at the clown.', t: { children: 'noun', laughed: 'verb', loudly: 'adverb', clown: 'noun' }, lv: 2 },
  { s: 'The old ship sailed slowly into the harbour.', t: { old: 'adjective', ship: 'noun', sailed: 'verb', slowly: 'adverb', harbour: 'noun' }, lv: 2 },
  { s: 'Priya sings beautifully in the choir.', t: { Priya: 'noun', sings: 'verb', beautifully: 'adverb', choir: 'noun' }, lv: 2 },
  { s: 'The hungry fox crept silently through the garden.', t: { hungry: 'adjective', fox: 'noun', crept: 'verb', silently: 'adverb', garden: 'noun' }, lv: 3 },
  { s: 'Our brave dog chased the noisy geese.', t: { brave: 'adjective', dog: 'noun', chased: 'verb', noisy: 'adjective', geese: 'noun' }, lv: 3 },
  { s: 'Yesterday the team trained hard.', t: { Yesterday: 'adverb', team: 'noun', trained: 'verb', hard: 'adverb' }, n: { hard: '"Hard" tells us how they trained, so it is an adverb here (in "a hard chair" it would be an adjective).', Yesterday: '"Yesterday" tells us when, so it is an adverb of time.' }, lv: 4 },
  { s: 'The match was exciting.', t: { match: 'noun', was: 'verb', exciting: 'adjective' }, n: { exciting: '"Exciting" describes the noun "match", even though it comes after the verb "was".' }, lv: 4 },
  { s: 'She seemed nervous before the exam.', t: { seemed: 'verb', nervous: 'adjective', exam: 'noun' }, n: { seemed: '"Seemed" is a verb that shows a state, not an action.' }, lv: 4 },
  { s: 'The fast train arrived early.', t: { fast: 'adjective', train: 'noun', arrived: 'verb', early: 'adverb' }, n: { fast: '"Fast" describes the train, so it is an adjective here. In "it ran fast" it would be an adverb.', early: '"Early" tells us when the train arrived, so it is an adverb here.' }, lv: 4 },
  { s: 'Grandad drives very carefully.', t: { Grandad: 'noun', drives: 'verb', very: 'adverb', carefully: 'adverb' }, n: { very: '"Very" adds to the adverb "carefully" (how carefully?), so it is an adverb of degree.' }, lv: 5 },
  { s: 'Their happiness filled the room.', t: { happiness: 'noun', filled: 'verb', room: 'noun' }, n: { happiness: '"Happiness" is an abstract noun: you cannot touch it, but it is still a thing named.' }, lv: 4 },
]

/** Year 7 sentences with all eight word classes. */
const FULL: Tagged[] = [
  { s: 'She quietly opened the door and stepped into the dark hallway.', t: { She: 'pronoun', quietly: 'adverb', opened: 'verb', door: 'noun', and: 'conjunction', stepped: 'verb', into: 'preposition', dark: 'adjective', hallway: 'noun' }, lv: 2 },
  { s: 'Although it was raining, we played outside.', t: { Although: 'conjunction', it: 'pronoun', we: 'pronoun', played: 'verb', outside: 'adverb' }, n: { outside: '"Outside" tells us where we played, so here it is an adverb.' }, lv: 3 },
  { s: 'My grandmother keeps old letters in a wooden box.', t: { My: 'determiner', grandmother: 'noun', keeps: 'verb', old: 'adjective', letters: 'noun', in: 'preposition', a: 'determiner', wooden: 'adjective', box: 'noun' }, n: { My: '"My" comes before the noun "grandmother" to say whose, so it is a (possessive) determiner.' }, lv: 3 },
  { s: 'The players celebrated wildly because they had won the cup.', t: { players: 'noun', celebrated: 'verb', wildly: 'adverb', because: 'conjunction', they: 'pronoun', cup: 'noun' }, lv: 2 },
  { s: 'Under the bridge, a troll waited patiently.', t: { Under: 'preposition', bridge: 'noun', troll: 'noun', waited: 'verb', patiently: 'adverb' }, lv: 2 },
  { s: 'We will visit our cousins in Scotland next summer.', t: { We: 'pronoun', visit: 'verb', our: 'determiner', cousins: 'noun', in: 'preposition', Scotland: 'noun' }, lv: 3 },
  { s: 'Tom was tired, but he finished his homework.', t: { Tom: 'noun', tired: 'adjective', but: 'conjunction', he: 'pronoun', finished: 'verb', homework: 'noun' }, lv: 2 },
  { s: 'This sandwich tastes delicious.', t: { This: 'determiner', sandwich: 'noun', tastes: 'verb', delicious: 'adjective' }, n: { This: '"This" comes before the noun "sandwich", so it is a determiner. In "This is delicious" it would be a pronoun.' }, lv: 4 },
  { s: 'Those are mine.', t: { Those: 'pronoun', are: 'verb', mine: 'pronoun' }, n: { Those: '"Those" stands on its own in place of a noun (no noun follows it), so it is a pronoun here.', mine: '"Mine" is a possessive pronoun: it replaces "my things".' }, lv: 5 },
  { s: 'Everyone cheered when the band appeared on stage.', t: { Everyone: 'pronoun', cheered: 'verb', when: 'conjunction', band: 'noun', appeared: 'verb', on: 'preposition', stage: 'noun' }, lv: 3 },
  { s: 'The exhausted climbers finally reached the summit.', t: { The: 'determiner', exhausted: 'adjective', climbers: 'noun', finally: 'adverb', reached: 'verb', summit: 'noun' }, lv: 2 },
  { s: 'You should always check your work carefully.', t: { You: 'pronoun', always: 'adverb', check: 'verb', your: 'determiner', work: 'noun', carefully: 'adverb' }, lv: 3 },
  { s: 'Several birds sang sweetly above the meadow.', t: { Several: 'determiner', birds: 'noun', sang: 'verb', sweetly: 'adverb', above: 'preposition', meadow: 'noun' }, lv: 3 },
  { s: 'If you hurry, you can catch the bus.', t: { If: 'conjunction', hurry: 'verb', catch: 'verb', the: 'determiner', bus: 'noun' }, lv: 3 },
  { s: 'Snow fell heavily during the night.', t: { Snow: 'noun', fell: 'verb', heavily: 'adverb', during: 'preposition', night: 'noun' }, lv: 2 },
  { s: 'The dog that bit me has gone.', t: { dog: 'noun', that: 'pronoun', bit: 'verb', me: 'pronoun' }, n: { that: '"That" here starts a relative clause and stands for "the dog", so it is a relative pronoun.' }, lv: 5 },
  { s: 'I lent her my pen.', t: { I: 'pronoun', lent: 'verb', her: 'pronoun', my: 'determiner', pen: 'noun' }, n: { her: '"Her" is not followed by a noun here; it stands for a person, so it is a pronoun.' }, lv: 4 },
  { s: 'We waited until the rain stopped.', t: { We: 'pronoun', waited: 'verb', until: 'conjunction', rain: 'noun', stopped: 'verb' }, n: { until: '"Until" is followed by a clause ("the rain stopped"), so it is a conjunction here.' }, lv: 4 },
  { s: 'We waited until lunchtime.', t: { We: 'pronoun', waited: 'verb', until: 'preposition', lunchtime: 'noun' }, n: { until: '"Until" is followed by a noun ("lunchtime"), not a clause, so it is a preposition here.' }, lv: 5 },
  { s: 'Since it was late, we left the party.', t: { Since: 'conjunction', it: 'pronoun', late: 'adjective', we: 'pronoun', left: 'verb', party: 'noun' }, n: { Since: '"Since" introduces a clause ("it was late"), so it is a conjunction here.' }, lv: 4 },
  { s: 'The shop has been closed since Monday.', t: { shop: 'noun', closed: 'verb', since: 'preposition', Monday: 'noun' }, n: { since: '"Since" is followed by a noun ("Monday"), not a clause, so it is a preposition here.' }, lv: 5 },
  { s: 'The lighthouse stood proudly on the rocks.', t: { lighthouse: 'noun', stood: 'verb', proudly: 'adverb', on: 'preposition', rocks: 'noun' }, lv: 2 },
  { s: 'Some pupils wanted pizza, yet others chose salad.', t: { Some: 'determiner', pupils: 'noun', wanted: 'verb', yet: 'conjunction', others: 'pronoun', chose: 'verb', salad: 'noun' }, lv: 4 },
]

/** At level 4+, prefer the words with a note: the ones that are genuinely tricky in that sentence. */
function tricky(r: Tagged, words: [string, WC][], d: number): [string, WC][] {
  if (d < 4) return words
  const hard = words.filter(([w]) => r.n?.[w])
  return hard.length ? hard : words
}

function wordClassGens(prefix: string, skill: string, rows: Tagged[], allowed: WC[], levels: [number, number]): ItemGenerator[] {
  const usable = rows.filter((r) => Object.values(r.t).some((c) => c && allowed.includes(c)))
  const why = (r: Tagged, w: string, c: WC) => `In this sentence "${w}" is a${/^[aeiou]/.test(c) ? 'n' : ''} ${c}. ${r.n?.[w] ?? WC_INFO[c]}`
  return [
    G(`${prefix}.what-class`, skill, levels, (rng, d) => {
      const r = rng.pick(atLevel(usable, d))
      const words = Object.entries(r.t).filter(([, c]) => c && allowed.includes(c)) as [string, WC][]
      const [w, c] = rng.pick(tricky(r, words, d))
      const pool = (allowed.length >= 4 ? allowed : (Object.keys(WC_INFO) as WC[])).filter((x) => x !== c)
      return choice({
        rng,
        prompt: `In the sentence ${q(r.s)}, what word class is ${q(w)}?`,
        correct: c,
        wrong: sample(rng, pool, 3).map((x) => ({ label: x, misconception: `wordclass-${x}`, feedback: WC_INFO[x] })),
        hint: 'Ask what job the word is doing in THIS sentence: naming, doing, describing a noun, or adding to a verb?',
        explanation: why(r, w, c),
      })
    }),
    G(`${prefix}.find-word`, skill, levels, (rng, d) => {
      const r = rng.pick(atLevel(usable, d))
      const words = Object.entries(r.t).filter(([, c]) => c && allowed.includes(c)) as [string, WC][]
      const [w, c] = rng.pick(tricky(r, words, d))
      const others = Object.entries(r.t).filter(([x, k]) => k !== c && x !== w) as [string, WC][]
      if (others.length < 2) {
        return choice({ rng, prompt: `In the sentence ${q(r.s)}, what word class is ${q(w)}?`, correct: c, wrong: (Object.keys(WC_INFO) as WC[]).filter((x) => x !== c).slice(0, 3), hint: 'What job is the word doing?', explanation: why(r, w, c) })
      }
      return choice({
        rng,
        prompt: `Which word in this sentence is a${/^[aeiou]/.test(c) ? 'n' : ''} ${c}?\n${r.s}`,
        correct: w,
        wrong: sample(rng, others, 3).map(([x, k]) => ({ label: x, misconception: `picked-${k}`, feedback: `"${x}" is a${/^[aeiou]/.test(k) ? 'n' : ''} ${k} here. ${WC_INFO[k]}` })),
        hint: WC_INFO[c],
        explanation: why(r, w, c),
      })
    }),
  ]
}

// =====================================================================================================
// Nouns
// =====================================================================================================

const ABSTRACT = ['happiness', 'courage', 'fear', 'friendship', 'childhood', 'freedom', 'anger', 'honesty', 'kindness', 'knowledge', 'jealousy', 'curiosity', 'patience', 'loyalty', 'beauty']
const CONCRETE = ['table', 'river', 'teacher', 'apple', 'pencil', 'bicycle', 'mountain', 'sandwich', 'window', 'kitten', 'trumpet', 'castle']
const COLLECTIVE = ['flock', 'herd', 'swarm', 'team', 'crew', 'choir', 'fleet', 'orchestra', 'audience', 'army', 'jury', 'committee']
const PROPER = ['London', 'Tuesday', 'Everest', 'Thames', 'Shakespeare', 'January', 'France', 'Mars', 'Wales', 'Christmas']
const ADJ_OF: Record<string, string> = { happiness: 'happy', courage: 'brave', anger: 'angry', honesty: 'honest', kindness: 'kind', curiosity: 'curious', patience: 'patient', loyalty: 'loyal', beauty: 'beautiful', freedom: 'free', jealousy: 'jealous' }

const NOUN_TYPE_INFO = {
  abstract: 'An abstract noun names an idea, feeling or quality you cannot see or touch (courage, fear).',
  concrete: 'A concrete noun names something you can see, touch, hear, smell or taste (table, river).',
  collective: 'A collective noun names a group as one unit (a flock of sheep, a team of players).',
  proper: 'A proper noun names one particular person, place, day or thing, and starts with a capital letter (London, Tuesday).',
}

const nounGenerators: ItemGenerator[] = [
  G('nouns.pick-type', 'grammar.nouns', [1, 4], (rng, d) => {
    const type = rng.pick(['abstract', 'concrete', 'collective', 'proper'] as const)
    const lists = { abstract: ABSTRACT, concrete: CONCRETE, collective: COLLECTIVE, proper: PROPER }
    const correct = rng.pick(lists[type])
    // Distractors never come from a type that could also be right (collective nouns are concrete).
    const pools: Record<typeof type, [string, string][]> = {
      abstract: [...CONCRETE.map((w) => [w, 'concrete'] as [string, string]), ...PROPER.map((w) => [w, 'proper'] as [string, string]), ...COLLECTIVE.map((w) => [w, 'collective'] as [string, string])],
      concrete: ABSTRACT.map((w) => [w, 'abstract'] as [string, string]),
      collective: [...CONCRETE.map((w) => [w, 'concrete (not a group)'] as [string, string]), ...ABSTRACT.map((w) => [w, 'abstract'] as [string, string]), ...PROPER.map((w) => [w, 'proper'] as [string, string])],
      proper: [...CONCRETE.map((w) => [w, 'common'] as [string, string]), ...ABSTRACT.map((w) => [w, 'common (abstract)'] as [string, string]), ...COLLECTIVE.map((w) => [w, 'common (collective)'] as [string, string])],
    }
    let wrong = sample(rng, pools[type], 3).map(([w, k]) => ({ label: w, misconception: `noun-${k.split(' ')[0]}`, feedback: `"${w}" is a ${k} noun.` }))
    // At harder levels, offer the adjective form of an abstract noun as a trap.
    if (type === 'abstract' && d >= 3) {
      const adj = ADJ_OF[correct]
      if (adj) wrong = [{ label: adj, misconception: 'adjective-not-noun', feedback: `"${adj}" is an adjective (a happy child). The abstract noun is "${correct}".` }, ...wrong.slice(0, 2)]
    }
    return choice({
      rng,
      prompt: `Which of these is ${type === 'abstract' ? 'an' : 'a'} ${type} noun?`,
      correct,
      wrong,
      hint: NOUN_TYPE_INFO[type],
      explanation: `"${correct}" is ${type === 'abstract' ? 'an' : 'a'} ${type} noun. ${NOUN_TYPE_INFO[type]}`,
    })
  }),
  G('nouns.collective-match', 'grammar.nouns', [2, 3], (rng) => {
    const pairs = sample(
      rng,
      [
        ['a flock of', 'sheep'],
        ['a swarm of', 'bees'],
        ['a pack of', 'wolves'],
        ['a shoal of', 'fish'],
        ['a pride of', 'lions'],
        ['a fleet of', 'ships'],
        ['a choir of', 'singers'],
        ['a gaggle of', 'geese'],
        ['a troop of', 'monkeys'],
        ['a bunch of', 'flowers'],
      ] as [string, string][],
      4,
    )
    return {
      kind: 'match',
      prompt: 'Match each collective noun to the group it names.',
      hint: 'Say each one aloud: "a pride of..." - which sounds familiar?',
      explanation: pairs.map(([a, b]) => `${a} ${b}`).join(', ') + '. A collective noun names a group as one unit.',
      pairs: pairs.map(([a, b], i) => ({ id: `p${i}`, left: a, right: b })),
    }
  }),
  textGen('nouns.abstract-form', 'grammar.nouns', [3, 5], [
    ...(
      [
        ['brave', 'bravery', 3],
        ['happy', 'happiness', 3],
        ['kind', 'kindness', 3],
        ['angry', 'anger', 4],
        ['free', 'freedom', 4],
        ['honest', 'honesty', 4],
        ['curious', 'curiosity', 5],
        ['loyal', 'loyalty', 4],
        ['patient', 'patience', 5],
        ['wise', 'wisdom', 5],
        ['strong', 'strength', 4],
        ['generous', 'generosity', 5],
        ['anxious', 'anxiety', 5],
        ['sad', 'sadness', 3],
        ['jealous', 'jealousy', 4],
      ] as [string, string, number][]
    ).map(
      ([adj, noun, lv]): TextQ => ({
        q: `Write the abstract noun made from the adjective ${q(adj)}.\n(For example: dark → darkness.)`,
        accept: [noun],
        hint: `It starts with "${noun.slice(0, 3)}". Some take -ness, some -ity, -dom, -th or -y.`,
        ex: `${adj} → ${noun}. An abstract noun names a quality or feeling you cannot touch.`,
        lv,
      }),
    ),
  ]),
]

// =====================================================================================================
// Verbs
// =====================================================================================================

const MODAL_ROWS: { s: string; m: string; others: string[] }[] = [
  { s: 'You must wear a helmet on your bike.', m: 'must', others: ['wear', 'helmet', 'bike'] },
  { s: 'We might go to the beach tomorrow.', m: 'might', others: ['go', 'beach', 'tomorrow'] },
  { s: 'She can play the violin.', m: 'can', others: ['play', 'violin', 'She'] },
  { s: 'They should apologise to the teacher.', m: 'should', others: ['apologise', 'teacher', 'They'] },
  { s: 'I would help if I had time.', m: 'would', others: ['help', 'had', 'time'] },
  { s: 'It may snow tonight.', m: 'may', others: ['snow', 'tonight', 'It'] },
  { s: 'Shall we dance in the hall?', m: 'Shall', others: ['dance', 'we', 'hall'] },
  { s: 'He could swim when he was four.', m: 'could', others: ['swim', 'was', 'four'] },
  { s: 'You will need a coat today.', m: 'will', others: ['need', 'coat', 'today'] },
]

const AUX_ROWS: { s: string; a: string; main: string; others: string[] }[] = [
  { s: 'She has finished her essay.', a: 'has', main: 'finished', others: ['essay', 'She'] },
  { s: 'They were laughing at the joke.', a: 'were', main: 'laughing', others: ['joke', 'They'] },
  { s: 'I have seen that film twice.', a: 'have', main: 'seen', others: ['film', 'twice'] },
  { s: 'The window was broken by the storm.', a: 'was', main: 'broken', others: ['storm', 'window'] },
  { s: 'Do you like olives?', a: 'Do', main: 'like', others: ['olives', 'you'] },
  { s: 'He is running for the bus.', a: 'is', main: 'running', others: ['bus', 'He'] },
  { s: 'We had already eaten our lunch.', a: 'had', main: 'eaten', others: ['already', 'lunch'] },
  { s: 'She does not eat meat.', a: 'does', main: 'eat', others: ['not', 'meat'] },
]

const MODAL_MEANING: MC[] = [
  { q: 'Which sentence expresses an obligation (something that has to happen)?', a: 'You must hand in your homework on Friday.', w: [{ label: 'You might hand in your homework on Friday.', feedback: '"Might" shows a possibility, not an obligation.' }, { label: 'You could hand in your homework on Friday.', feedback: '"Could" suggests an option or possibility.' }, { label: 'You can hand in your homework on Friday.', feedback: '"Can" here gives permission or ability, not an obligation.' }], hint: 'Which modal verb means "you have no choice"?', ex: '"Must" expresses obligation or necessity.', lv: 2 },
  { q: 'Which sentence shows the LEAST certainty?', a: 'It might rain later.', w: [{ label: 'It will rain later.', feedback: '"Will" sounds certain.' }, { label: 'It is going to rain later.', feedback: '"Is going to" sounds very sure.' }, { label: 'It must rain later.', feedback: '"Must" is strong: it sounds necessary or certain.' }], hint: 'Which modal verb is the weakest?', ex: '"Might" shows only a possibility, so it is the least certain.', lv: 3 },
  { q: 'Which sentence gives permission?', a: 'You may leave the room now.', w: [{ label: 'You must leave the room now.', feedback: '"Must" is an order (obligation), not permission.' }, { label: 'You should leave the room now.', feedback: '"Should" gives advice.' }, { label: 'You might leave the room now.', feedback: '"Might" suggests a possibility.' }], hint: 'Which modal verb is used when a teacher says it is allowed?', ex: '"May" is the formal way to give permission.', lv: 3 },
  { q: 'Which sentence gives advice?', a: 'You should drink more water.', w: [{ label: 'You must drink more water.', feedback: '"Must" is an order rather than advice.' }, { label: 'You might drink more water.', feedback: '"Might" just says it is possible.' }, { label: 'You will drink more water.', feedback: '"Will" predicts or commands.' }], hint: 'Which modal verb is a recommendation, not an order?', ex: '"Should" is used to give advice or say what is the right thing to do.', lv: 2 },
  { q: 'Which sentence is about ability?', a: 'She can speak three languages.', w: [{ label: 'She should speak three languages.', feedback: '"Should" suggests advice or expectation.' }, { label: 'She might speak three languages.', feedback: '"Might" suggests possibility.' }, { label: 'She must speak three languages.', feedback: '"Must" suggests obligation (or a confident guess).' }], hint: 'Which modal verb means "is able to"?', ex: '"Can" expresses ability.', lv: 2 },
  { q: 'Which word is NOT a modal verb?', a: 'want', w: ['might', 'should', 'could'], hint: 'Modal verbs never change form: no -s, -ed or -ing.', ex: 'The modal verbs are can, could, may, might, must, shall, should, will and would. "Want" is an ordinary verb (she wants, wanted).', lv: 3 },
  { q: 'Which of these is a state verb (describing a state, not an action)?', a: 'belong', w: ['jump', 'shout', 'throw'], hint: 'Can you picture someone doing it? If not, it may be a state.', ex: '"Belong" describes a state (this bag belongs to me), not something you actively do.', lv: 4 },
  { q: 'Which of these is a state verb (describing a state, not an action)?', a: 'know', w: ['write', 'climb', 'kick'], hint: 'State verbs describe thinking, feeling, owning or being.', ex: '"Know" describes a state of mind, not an action you can watch.', lv: 4 },
  { q: 'Which of these is a state verb (describing a state, not an action)?', a: 'seem', w: ['run', 'paint', 'catch'], hint: 'State verbs are about being, seeming, having or feeling.', ex: '"Seem" is a state (linking) verb: she seems tired.', lv: 4 },
]

const verbGenerators: ItemGenerator[] = [
  G('verbs.modal', 'grammar.verbs', [1, 3], (rng) => {
    const r = rng.pick(MODAL_ROWS)
    return choice({
      rng,
      prompt: `Which word in this sentence is a modal verb?\n${r.s}`,
      correct: r.m,
      wrong: r.others.map((o) => ({ label: o, feedback: `"${o}" is not a modal verb.` })),
      hint: 'Modal verbs (can, could, may, might, must, shall, should, will, would) go before another verb to show how likely or necessary it is.',
      explanation: `"${r.m}" is the modal verb: it comes before the main verb and shows possibility, ability, permission or obligation.`,
    })
  }),
  G('verbs.auxiliary', 'grammar.verbs', [2, 4], (rng) => {
    const r = rng.pick(AUX_ROWS)
    return choice({
      rng,
      prompt: `In ${q(r.s)}, which word is the auxiliary (helping) verb?`,
      correct: r.a,
      wrong: [{ label: r.main, misconception: 'main-verb', feedback: `"${r.main}" is the main verb; the auxiliary is the verb that helps it.` }, ...r.others],
      hint: 'Auxiliary verbs are forms of "be", "have" and "do" that help the main verb.',
      explanation: `"${r.a}" helps the main verb "${r.main}". Be, have and do work as auxiliary verbs.`,
    })
  }),
  bankGen('verbs.modal-meaning', 'grammar.verbs', [2, 5], MODAL_MEANING),
]

// =====================================================================================================
// Adjectives and adverbs
// =====================================================================================================

const COMPARE: [string, string[], string[], number][] = [
  ['big', ['bigger'], ['biggest'], 2],
  ['happy', ['happier'], ['happiest'], 2],
  ['good', ['better'], ['best'], 2],
  ['bad', ['worse'], ['worst'], 3],
  ['far', ['further', 'farther'], ['furthest', 'farthest'], 4],
  ['beautiful', ['more beautiful'], ['most beautiful'], 3],
  ['thin', ['thinner'], ['thinnest'], 3],
  ['busy', ['busier'], ['busiest'], 3],
  ['careful', ['more careful'], ['most careful'], 4],
  ['hot', ['hotter'], ['hottest'], 2],
  ['famous', ['more famous'], ['most famous'], 4],
  ['tall', ['taller'], ['tallest'], 1],
  ['many', ['more'], ['most'], 4],
  ['funny', ['funnier'], ['funniest'], 3],
]

const ADVERB_TYPE: Example[] = [
  { text: 'She spoke softly.|softly', a: 'how (manner)', why: '"Softly" tells us how she spoke.', lv: 2 },
  { text: 'We left yesterday.|yesterday', a: 'when (time)', why: '"Yesterday" tells us when we left.', lv: 2 },
  { text: 'Put the box here.|here', a: 'where (place)', why: '"Here" tells us where to put the box.', lv: 2 },
  { text: 'He often forgets his keys.|often', a: 'how often (frequency)', why: '"Often" tells us how often he forgets.', lv: 3 },
  { text: 'The soup was extremely hot.|extremely', a: 'how much (degree)', why: '"Extremely" tells us how hot: it shows degree.', lv: 3 },
  { text: 'He drove carefully.|carefully', a: 'how (manner)', why: '"Carefully" tells us how he drove.', lv: 2 },
  { text: 'Soon the storm passed.|Soon', a: 'when (time)', why: '"Soon" tells us when the storm passed.', lv: 3 },
  { text: 'The children played outside.|outside', a: 'where (place)', why: '"Outside" tells us where they played.', lv: 3 },
  { text: 'I rarely eat sweets.|rarely', a: 'how often (frequency)', why: '"Rarely" tells us how often.', lv: 3 },
  { text: 'The film was quite boring.|quite', a: 'how much (degree)', why: '"Quite" tells us how boring: it shows degree.', lv: 4 },
  { text: 'She ran incredibly fast.|incredibly', a: 'how much (degree)', why: '"Incredibly" adds to the adverb "fast" to show how fast: degree.', lv: 4 },
  { text: 'We sometimes walk to school.|sometimes', a: 'how often (frequency)', why: '"Sometimes" tells us how often.', lv: 3 },
  { text: 'The cat sleeps everywhere.|everywhere', a: 'where (place)', why: '"Everywhere" tells us where the cat sleeps.', lv: 4 },
  { text: 'The guests arrived late.|late', a: 'when (time)', why: '"Late" tells us when they arrived, compared with the expected time.', lv: 4 },
]

const ADVERB_FORM: TextQ[] = (
  [
    ['quick', 'quickly', 1],
    ['happy', 'happily', 2],
    ['gentle', 'gently', 3],
    ['careful', 'carefully', 2],
    ['easy', 'easily', 3],
    ['angry', 'angrily', 3],
    ['true', 'truly', 5],
    ['public', 'publicly', 5],
    ['terrible', 'terribly', 4],
    ['lucky', 'luckily', 3],
    ['simple', 'simply', 4],
    ['full', 'fully', 4],
    ['basic', 'basically', 5],
    ['whole', 'wholly', 5],
  ] as [string, string, number][]
).map(([a, b, lv]) => ({
  q: `Turn the adjective ${q(a)} into an adverb.`,
  accept: [b],
  hint: a.endsWith('y') ? 'When the adjective ends in -y, change the y to i first.' : a.endsWith('le') ? 'When the adjective ends in -le, swap the -le for -ly.' : a.endsWith('ic') ? 'Adjectives ending in -ic usually add -ally.' : 'Usually you just add -ly - but watch out for exceptions.',
  ex: `${a} → ${b}.` + (b === 'truly' || b === 'wholly' || b === 'publicly' ? ' This one is an exception to the usual pattern, so learn it.' : ''),
  lv,
}))

const adjAdvGenerators: ItemGenerator[] = [
  G('adj.comparative', 'grammar.adjectives-adverbs', [1, 4], (rng, d) => {
    const pool = COMPARE.filter(([, , , lv]) => Math.abs(lv - d) <= 1)
    const [base, comp, sup] = rng.pick(pool.length ? pool : COMPARE)
    const which = rng.chance(0.5) ? 'comparative' : 'superlative'
    const ans = which === 'comparative' ? comp : sup
    return textItem({
      prompt: `Write the ${which} form of ${q(base)}.\n(${which === 'comparative' ? 'For comparing two: tall → taller' : 'For the top of a group: tall → tallest'})`,
      accept: variants(ans),
      hint: ans[0]!.startsWith('more') || ans[0]!.startsWith('most') ? 'Long adjectives use a separate word rather than an ending.' : 'Think about the spelling rule: double the last letter? change y to i? or is it irregular?',
      explanation: `${base} → ${comp[0]} → ${sup[0]}.` + (ans.length > 1 ? ` (${ans.join(' and ')} are both accepted.)` : ''),
      placeholder: 'Type the word',
    })
  }),
  G('adj.superlative-trap', 'grammar.adjectives-adverbs', [2, 3], (rng) => {
    const [base, comp, sup] = rng.pick(COMPARE.filter(([b]) => ['good', 'bad', 'beautiful', 'famous', 'careful', 'many', 'funny', 'busy'].includes(b)))
    const reg = base.endsWith('y') ? base.slice(0, -1) + 'iest' : base + 'est'
    return choice({
      rng,
      prompt: `Which is the correct superlative of ${q(base)}?`,
      correct: sup[0]!,
      wrong: [
        { label: reg === sup[0] ? `most ${base}` : reg, misconception: 'regular-ending', feedback: reg === sup[0] ? `Short adjectives take -est, not "most".` : `"${reg}" is not Standard English.` },
        { label: comp[0]!, misconception: 'comparative-for-superlative', feedback: `"${comp[0]}" is the comparative (for comparing two).` },
        { label: `most ${sup[0]}`, misconception: 'double-superlative', feedback: 'That is a double superlative: use one or the other.' },
      ],
      hint: 'Some adjectives are irregular; longer ones use "most".',
      explanation: `The superlative of "${base}" is "${sup[0]}".`,
    })
  }),
  classifyGen('adv.type', 'grammar.adjectives-adverbs', [2, 4], {
    rows: ADVERB_TYPE,
    cats: {
      'how (manner)': 'Adverbs of manner tell you how something is done (softly, carefully).',
      'when (time)': 'Adverbs of time tell you when (yesterday, soon, late).',
      'where (place)': 'Adverbs of place tell you where (here, outside, everywhere).',
      'how often (frequency)': 'Adverbs of frequency tell you how often (often, rarely, sometimes).',
      'how much (degree)': 'Adverbs of degree tell you how much or to what extent (very, extremely, quite).',
    },
    prompt: (e) => {
      const [s, w] = e.text.split('|')
      return `In ${q(s!)}, what does the adverb ${q(w!)} tell us?`
    },
    hint: 'Ask the question: how? when? where? how often? or how much?',
  }),
  textGen('adv.form', 'grammar.adjectives-adverbs', [2, 5], ADVERB_FORM),
]

// =====================================================================================================
// Pronouns and determiners
// =====================================================================================================

const PRONOUN_TYPE: Example[] = [
  { text: 'The red coat is mine.|mine', a: 'possessive', why: '"Mine" shows ownership and stands on its own.', lv: 2 },
  { text: 'Is this pencil case yours?|yours', a: 'possessive', why: '"Yours" shows ownership and replaces "your pencil case".', lv: 2 },
  { text: 'The decision is theirs.|theirs', a: 'possessive', why: '"Theirs" shows ownership.', lv: 3 },
  { text: 'She waved at us.|us', a: 'personal', why: '"Us" refers to people (the speaker and others): a personal pronoun.', lv: 2 },
  { text: 'Give the ball to him.|him', a: 'personal', why: '"Him" refers to a person: a personal pronoun.', lv: 2 },
  { text: 'They built the den themselves.|themselves', a: 'reflexive', why: '"Themselves" refers back to "they": a reflexive pronoun ends in -self or -selves.', lv: 3 },
  { text: 'I hurt myself playing football.|myself', a: 'reflexive', why: '"Myself" refers back to "I".', lv: 2 },
  { text: 'The girl who won the race is my cousin.|who', a: 'relative', why: '"Who" starts a relative clause giving more information about "the girl".', lv: 3 },
  { text: 'The book which I borrowed is overdue.|which', a: 'relative', why: '"Which" starts a relative clause about "the book".', lv: 3 },
  { text: 'That is the boy whose dog ran away.|whose', a: 'relative', why: '"Whose" starts a relative clause about "the boy".', lv: 4 },
  { text: 'We cooked dinner by ourselves.|ourselves', a: 'reflexive', why: '"Ourselves" refers back to "we".', lv: 3 },
  { text: 'The house on the corner is ours.|ours', a: 'possessive', why: '"Ours" shows ownership.', lv: 3 },
  { text: 'Can you help me?|me', a: 'personal', why: '"Me" refers to the speaker: a personal pronoun.', lv: 2 },
  { text: 'The film that we watched was scary.|that', a: 'relative', why: '"That" starts a relative clause about "the film".', lv: 5 },
]

const DET_OR_PRO: Example[] = [
  { text: 'This is my favourite song.|This', a: 'pronoun', why: 'No noun follows "This"; it stands in for one, so it is a pronoun.', lv: 3 },
  { text: 'This song is my favourite.|This', a: 'determiner', why: '"This" comes before the noun "song", so it is a determiner.', lv: 3 },
  { text: 'Those shoes are muddy.|Those', a: 'determiner', why: '"Those" comes before the noun "shoes", so it is a determiner.', lv: 3 },
  { text: 'Those are muddy.|Those', a: 'pronoun', why: '"Those" stands on its own in place of a noun, so it is a pronoun.', lv: 4 },
  { text: 'Some people prefer tea.|Some', a: 'determiner', why: '"Some" comes before the noun "people".', lv: 4 },
  { text: 'Some prefer tea.|Some', a: 'pronoun', why: '"Some" stands on its own in place of a noun.', lv: 5 },
  { text: 'Each child gets a badge.|Each', a: 'determiner', why: '"Each" comes before the noun "child".', lv: 4 },
  { text: 'Each of them gets a badge.|Each', a: 'pronoun', why: '"Each" stands on its own here (followed by "of them", not a noun).', lv: 5 },
  { text: 'That idea is brilliant.|That', a: 'determiner', why: '"That" comes before the noun "idea".', lv: 3 },
  { text: 'That is brilliant.|That', a: 'pronoun', why: '"That" stands in for a noun.', lv: 4 },
  { text: 'Many fans waited outside.|Many', a: 'determiner', why: '"Many" comes before the noun "fans".', lv: 4 },
  { text: 'Many waited outside.|Many', a: 'pronoun', why: '"Many" stands in for "many people".', lv: 5 },
]

const A_AN: [string, 'a' | 'an', string][] = [
  ['hour', 'an', 'The h is silent, so "hour" starts with a vowel sound: an hour.'],
  ['unicorn', 'a', '"Unicorn" starts with a "you" sound (a consonant sound): a unicorn.'],
  ['honest mistake', 'an', 'The h in "honest" is silent: an honest mistake.'],
  ['European city', 'a', '"European" starts with a "you" sound: a European city.'],
  ['umbrella', 'an', '"Umbrella" starts with a vowel sound: an umbrella.'],
  ['one-way street', 'a', '"One" starts with a "w" sound: a one-way street.'],
  ['MP', 'an', 'We say "em-pee", which starts with a vowel sound: an MP.'],
  ['eagle', 'an', '"Eagle" starts with a vowel sound: an eagle.'],
  ['university', 'a', '"University" starts with a "you" sound: a university.'],
  ['X-ray', 'an', 'We say "ex-ray", which starts with a vowel sound: an X-ray.'],
  ['horse', 'a', 'The h in "horse" is pronounced: a horse.'],
  ['uniform', 'a', '"Uniform" starts with a "you" sound: a uniform.'],
  ['heir', 'an', 'The h in "heir" is silent: an heir.'],
  ['useful tip', 'a', '"Useful" starts with a "you" sound: a useful tip.'],
]

const pronounGenerators: ItemGenerator[] = [
  classifyGen('pronouns.type', 'grammar.pronouns-determiners', [2, 4], {
    rows: PRONOUN_TYPE,
    cats: {
      personal: 'Personal pronouns refer to people or things: I, you, he, she, it, we, they, me, him, her, us, them.',
      possessive: 'Possessive pronouns show ownership and stand alone: mine, yours, his, hers, ours, theirs.',
      reflexive: 'Reflexive pronouns end in -self or -selves and refer back to the subject: myself, themselves.',
      relative: 'Relative pronouns start a relative clause: who, which, that, whose.',
    },
    prompt: (e) => {
      const [s, w] = e.text.split('|')
      return `In ${q(s!)}, what type of pronoun is ${q(w!)}?`
    },
    hint: 'Does it show ownership, refer back to the subject, start a clause about a noun, or just stand for a person?',
    keepOrder: true,
  }),
  classifyGen('determiners.or-pronoun', 'grammar.pronouns-determiners', [3, 5], {
    rows: DET_OR_PRO,
    cats: {
      determiner: 'A determiner is followed by a noun (this song, some people).',
      pronoun: 'A pronoun stands on its own in place of a noun (This is great. Some agree.).',
    },
    prompt: (e) => {
      const [s, w] = e.text.split('|')
      return `In ${q(s!)}, is ${q(w!)} a determiner or a pronoun?`
    },
    hint: 'Look at the next word. Is it a noun that the word is pointing to?',
    keepOrder: true,
  }),
  G('determiners.a-an', 'grammar.pronouns-determiners', [1, 4], (rng, d) => {
    const pool = d <= 2 ? A_AN.filter(([w]) => ['umbrella', 'eagle', 'horse', 'hour', 'unicorn'].includes(w)) : A_AN
    const [w, art, why] = rng.pick(pool)
    return choice({
      rng,
      prompt: `Which determiner goes before ${q(w)}?`,
      correct: `${art} ${w}`,
      wrong: [{ label: `${art === 'a' ? 'an' : 'a'} ${w}`, misconception: 'a-an-by-letter', feedback: 'Choose "a" or "an" by the first SOUND, not the first letter.' }],
      keepOrder: false,
      hint: 'Say it aloud. "An" goes before a vowel SOUND; "a" before a consonant sound.',
      explanation: why,
    })
  }),
  ...wordClassGens('pronouns.words', 'grammar.pronouns-determiners', FULL, ['pronoun', 'determiner'], [2, 4]),
]

// =====================================================================================================
// Prepositions and conjunctions
// =====================================================================================================

const CONJ_TYPE: Example[] = [
  { text: 'I wanted to go, but it was too late.|but', a: 'coordinating', why: '"But" joins two main clauses of equal weight.', lv: 2 },
  { text: 'We stayed inside because it was raining.|because', a: 'subordinating', why: '"Because" starts a subordinate clause that cannot stand alone.', lv: 2 },
  { text: 'You can have pasta or you can have soup.|or', a: 'coordinating', why: '"Or" joins two main clauses.', lv: 2 },
  { text: 'Although she was tired, she kept running.|Although', a: 'subordinating', why: '"Although" starts a subordinate clause.', lv: 3 },
  { text: 'He was hungry, so he made a sandwich.|so', a: 'coordinating', why: '"So" joins two main clauses.', lv: 3 },
  { text: 'Call me when you get home.|when', a: 'subordinating', why: '"When" starts a subordinate clause ("when you get home").', lv: 3 },
  { text: 'I will help you if you ask nicely.|if', a: 'subordinating', why: '"If" starts a subordinate clause.', lv: 3 },
  { text: 'She likes swimming and he likes tennis.|and', a: 'coordinating', why: '"And" joins two main clauses.', lv: 2 },
  { text: 'The film was long, yet it was gripping.|yet', a: 'coordinating', why: '"Yet" is a coordinating conjunction (FANBOYS: for, and, nor, but, or, yet, so).', lv: 4 },
  { text: 'We played chess while it snowed.|while', a: 'subordinating', why: '"While" starts a subordinate clause.', lv: 3 },
  { text: 'Wait here until the bell rings.|until', a: 'subordinating', why: '"Until" starts a subordinate clause.', lv: 4 },
  { text: 'Unless you hurry, you will miss the train.|Unless', a: 'subordinating', why: '"Unless" starts a subordinate clause.', lv: 4 },
  { text: 'He did not phone, nor did he write.|nor', a: 'coordinating', why: '"Nor" is a coordinating conjunction (FANBOYS).', lv: 5 },
  { text: 'I left early since I had a headache.|since', a: 'subordinating', why: '"Since" starts a subordinate clause giving a reason.', lv: 4 },
]

const CONJ_FIT: MC[] = [
  { q: 'Choose the conjunction that fits: She practised every day, ___ she won the competition.', a: 'so', w: ['but', 'although', 'unless'], hint: 'The second part is a result of the first.', ex: '"So" introduces a result: she practised, so she won.', lv: 1 },
  { q: 'Choose the conjunction that fits: ___ it was freezing, Leo wore shorts.', a: 'Although', w: ['Because', 'So', 'If'], hint: 'Wearing shorts in freezing weather is surprising. Which word signals a contrast?', ex: '"Although" introduces a contrast: the freezing weather did not stop him.', lv: 2 },
  { q: 'Choose the conjunction that fits: You won\'t get better ___ you rest.', a: 'unless', w: ['because', 'so', 'and'], hint: 'Resting is the condition for getting better.', ex: '"Unless" means "if not": you won\'t get better if you don\'t rest.', lv: 3 },
  { q: 'Choose the conjunction that fits: I like apples, ___ I don\'t like pears.', a: 'but', w: ['because', 'so', 'if'], hint: 'The two halves contrast.', ex: '"But" joins two contrasting main clauses.', lv: 1 },
  { q: 'Choose the conjunction that fits: We\'ll go to the park ___ it stops raining.', a: 'when', w: ['but', 'so', 'although'], hint: 'Which word is about time?', ex: '"When" introduces a time clause.', lv: 2 },
  { q: 'Choose the conjunction that fits: He was late ___ he missed the bus.', a: 'because', w: ['although', 'but', 'unless'], hint: 'Missing the bus is the reason.', ex: '"Because" introduces a reason.', lv: 1 },
  { q: 'Choose the conjunction that fits: Keep stirring the sauce ___ it starts to bubble.', a: 'until', w: ['because', 'although', 'or'], hint: 'You stop at a certain point in time.', ex: '"Until" means "up to the time when".', lv: 3 },
  { q: 'Choose the conjunction that fits: ___ the sun had set, the bats came out.', a: 'Once', w: ['Unless', 'Although', 'But'], hint: 'Which word means "as soon as"?', ex: '"Once" introduces a time clause: as soon as the sun had set.', lv: 4 },
]

const conjGenerators: ItemGenerator[] = [
  classifyGen('conj.type', 'grammar.prepositions-conjunctions', [2, 5], {
    rows: CONJ_TYPE,
    cats: {
      coordinating: 'Coordinating conjunctions (for, and, nor, but, or, yet, so) join two parts of equal weight.',
      subordinating: 'Subordinating conjunctions (because, although, when, if, unless...) start a subordinate clause that cannot stand alone.',
    },
    prompt: (e) => {
      const [s, w] = e.text.split('|')
      return `In ${q(s!)}, is the conjunction ${q(w!)} coordinating or subordinating?`
    },
    hint: 'Remember FANBOYS: for, and, nor, but, or, yet, so are the coordinating ones.',
    keepOrder: true,
  }),
  bankGen('conj.fit', 'grammar.prepositions-conjunctions', [1, 4], CONJ_FIT),
  ...wordClassGens('prepconj.words', 'grammar.prepositions-conjunctions', FULL, ['preposition', 'conjunction'], [2, 5]),
]

// =====================================================================================================
// Tenses
// =====================================================================================================

const TENSES = {
  'simple present': 'The simple present is one word (walks, play) for habits and facts.',
  'simple past': 'The simple past is one word (walked, played) for finished actions.',
  'present progressive': 'The present progressive uses am/is/are + -ing (is walking): happening now.',
  'past progressive': 'The past progressive uses was/were + -ing (was walking): ongoing in the past.',
  'present perfect': 'The present perfect uses has/have + past participle (has walked).',
  'past perfect': 'The past perfect uses had + past participle (had walked): further back in the past.',
  'future (with will)': 'Will + verb (will walk) is used to talk about the future.',
}

const TENSE_ROWS: Example[] = [
  { text: 'She walks to school every day.|walks', a: 'simple present', why: '"Walks" is one word in the present: simple present (a habit).', lv: 2 },
  { text: 'She walked to school yesterday.|walked', a: 'simple past', why: '"Walked" is one word in the past: simple past.', lv: 1 },
  { text: 'She is walking to school now.|is walking', a: 'present progressive', why: '"Is" + "-ing": present progressive.', lv: 2 },
  { text: 'She was walking to school when it started to rain.|was walking', a: 'past progressive', why: '"Was" + "-ing": past progressive.', lv: 3 },
  { text: 'She has walked to school all week.|has walked', a: 'present perfect', why: '"Has" + past participle: present perfect.', lv: 3 },
  { text: 'She had walked to school before the bus arrived.|had walked', a: 'past perfect', why: '"Had" + past participle: past perfect.', lv: 4 },
  { text: 'She will walk to school tomorrow.|will walk', a: 'future (with will)', why: '"Will" + verb talks about the future.', lv: 2 },
  { text: 'They play chess on Fridays.|play', a: 'simple present', why: '"Play" is one present-tense word for a habit.', lv: 2 },
  { text: 'They are playing chess in the library.|are playing', a: 'present progressive', why: '"Are" + "-ing": present progressive.', lv: 2 },
  { text: 'They were playing chess when the lights went out.|were playing', a: 'past progressive', why: '"Were" + "-ing": past progressive.', lv: 3 },
  { text: 'They have played chess for years.|have played', a: 'present perfect', why: '"Have" + past participle: present perfect.', lv: 3 },
  { text: 'By the time we arrived, they had finished the game.|had finished', a: 'past perfect', why: '"Had" + past participle: past perfect - it happened before another past event.', lv: 4 },
  { text: 'The dog barked all night.|barked', a: 'simple past', why: 'One word, past tense: simple past.', lv: 1 },
  { text: 'I have lost my keys.|have lost', a: 'present perfect', why: '"Have" + past participle "lost": present perfect.', lv: 4 },
  { text: 'We were waiting for ages.|were waiting', a: 'past progressive', why: '"Were" + "-ing": past progressive.', lv: 3 },
  { text: 'He had never seen the sea before.|had seen', a: 'past perfect', why: '"Had" + "seen": past perfect ("never" is an adverb in between).', lv: 5 },
]

const IRREGULAR: TextQ[] = [
  ...(
    [
      ['go', 'went', 'I ___ to the shops yesterday.'],
      ['see', 'saw', 'We ___ a fox in the garden last night.'],
      ['write', 'wrote', 'Dickens ___ A Christmas Carol in 1843.'],
      ['bring', 'brought', 'She ___ cakes to the party.'],
      ['catch', 'caught', 'The goalkeeper ___ the ball.'],
      ['swim', 'swam', 'They ___ across the lake.'],
      ['teach', 'taught', 'My aunt ___ me to knit.'],
      ['think', 'thought', 'I ___ the film was brilliant.'],
      ['buy', 'bought', 'Dad ___ a new bike.'],
      ['begin', 'began', 'The concert ___ at seven.'],
      ['freeze', 'froze', 'The pond ___ overnight.'],
      ['steal', 'stole', 'Someone ___ my pen!'],
      ['throw', 'threw', 'He ___ the ball over the fence.'],
      ['fly', 'flew', 'The bird ___ away.'],
    ] as [string, string, string][]
  ).map(([v, p, s]): TextQ => ({ q: `Write the simple past of ${q(v)} to fill the gap:\n${s}`, accept: [p], hint: 'This is an irregular verb: it does not just add -ed.', ex: `${v} → ${p}. ${s.replace('___', p)}`, lv: 2 })),
  ...(
    [
      ['write', 'written', 'I have ___ three letters.'],
      ['go', 'gone', 'She has ___ home already.'],
      ['swim', 'swum', 'They have ___ two lengths.'],
      ['eat', 'eaten', 'We have ___ all the biscuits.'],
      ['break', 'broken', 'He has ___ his arm.'],
      ['see', 'seen', 'Have you ___ my phone?'],
      ['choose', 'chosen', 'I have ___ a book to read.'],
      ['ring', 'rung', 'The bell has ___.'],
      ['begin', 'begun', 'The match has ___.'],
      ['drink', 'drunk', 'The cat had ___ all the milk.'],
      ['freeze', 'frozen', 'The river has ___ solid.'],
      ['throw', 'thrown', 'She had ___ the letter away.'],
    ] as [string, string, string][]
  ).map(([v, p, s]): TextQ => ({ q: `Write the past participle of ${q(v)} to fill the gap:\n${s}`, accept: [p], hint: 'After has / have / had you need the past participle, which is not always the same as the simple past.', ex: `${v} → ${p}. ${s.replace('___', p)}`, lv: 4 })),
]

const TENSE_CONSISTENT: MC[] = [
  { q: 'Which sentence keeps the tense consistent?', a: 'She opened the door and walked in.', w: ['She opens the door and walked in.', 'She opened the door and walks in.', 'She is opening the door and walked in.'], hint: 'Both verbs should be in the same time frame.', ex: '"Opened" and "walked" are both simple past.', lv: 3 },
  { q: 'Which sentence keeps the tense consistent?', a: 'Every morning I wake up and brush my teeth.', w: ['Every morning I woke up and brush my teeth.', 'Every morning I wake up and brushed my teeth.', 'Every morning I waking up and brush my teeth.'], hint: '"Every morning" is a habit, so which tense?', ex: 'A habit uses the simple present for both verbs: wake, brush.', lv: 3 },
  { q: 'Which sentence keeps the tense consistent?', a: 'The wind howled and the rain lashed the windows.', w: ['The wind howls and the rain lashed the windows.', 'The wind howled and the rain lashes the windows.', 'The wind is howling and the rain lashed the windows.'], hint: 'Check both verbs.', ex: '"Howled" and "lashed" are both simple past.', lv: 4 },
  { q: 'Which sentence uses the past perfect correctly to show which event happened first?', a: 'When we arrived, the film had already started.', w: ['When we arrived, the film has already started.', 'When we had arrived, the film already starts.', 'When we arrive, the film had already started.'], hint: 'The film started first, before the arriving.', ex: 'The earlier event (the film starting) is in the past perfect: had started.', lv: 5 },
]

const tenseGenerators: ItemGenerator[] = [
  classifyGen('tenses.name', 'grammar.tenses', [1, 5], {
    rows: TENSE_ROWS,
    cats: TENSES,
    prompt: (e) => {
      const [s, w] = e.text.split('|')
      return `What tense is ${q(w!)} in this sentence?\n${s}`
    },
    hint: 'Count the words in the verb. Is there an -ing? A has/have/had? A will?',
  }),
  textGen('tenses.irregular', 'grammar.tenses', [2, 5], IRREGULAR),
  bankGen('tenses.consistent', 'grammar.tenses', [3, 5], TENSE_CONSISTENT),
]

// =====================================================================================================
// Phrases and clauses
// =====================================================================================================

const PHRASE_CLAUSE: Example[] = [
  { text: 'after the long journey', a: 'phrase', why: 'There is no verb, so it is a phrase.', lv: 2 },
  { text: 'when the bell rang', a: 'clause', why: 'It has a subject ("the bell") and a verb ("rang"), so it is a clause.', lv: 2 },
  { text: 'in the middle of the night', a: 'phrase', why: 'No verb: a phrase.', lv: 2 },
  { text: 'because she was tired', a: 'clause', why: 'Subject "she" + verb "was": a clause.', lv: 2 },
  { text: 'the old man with the stick', a: 'phrase', why: 'No verb: a noun phrase.', lv: 3 },
  { text: 'the dog barked', a: 'clause', why: 'Subject "the dog" + verb "barked": a clause.', lv: 2 },
  { text: 'under the old oak tree', a: 'phrase', why: 'No verb: a prepositional phrase.', lv: 2 },
  { text: 'although we tried hard', a: 'clause', why: 'Subject "we" + verb "tried": a clause.', lv: 3 },
  { text: 'if it snows', a: 'clause', why: 'Subject "it" + verb "snows": a clause, even though it is short.', lv: 4 },
  { text: 'a bright red balloon', a: 'phrase', why: 'No verb: a noun phrase.', lv: 3 },
  { text: 'she laughed', a: 'clause', why: 'Subject "she" + verb "laughed": a clause - just two words!', lv: 4 },
  { text: 'on Saturday morning', a: 'phrase', why: 'No verb: a phrase.', lv: 2 },
  { text: 'who lives next door', a: 'clause', why: '"Who" is the subject and "lives" the verb: a (relative) clause.', lv: 4 },
  { text: 'very quickly indeed', a: 'phrase', why: 'No verb: an adverb phrase.', lv: 3 },
  { text: 'a long, cold, miserable winter in the mountains', a: 'phrase', why: 'However long it is, there is no verb, so it is a phrase.', lv: 5 },
  { text: 'the sun set', a: 'clause', why: 'Subject "the sun" + verb "set": a clause.', lv: 4 },
]

const HEAD_NOUN: { p: string; h: string; w: string[]; lv: number }[] = [
  { p: 'the tall girl with red hair', h: 'girl', w: ['hair', 'tall', 'red'], lv: 2 },
  { p: 'a box of chocolates', h: 'box', w: ['chocolates', 'of', 'a'], lv: 3 },
  { p: 'the old wooden gate at the end of the garden', h: 'gate', w: ['garden', 'end', 'wooden'], lv: 4 },
  { p: 'three hungry wolves', h: 'wolves', w: ['hungry', 'three'], lv: 2 },
  { p: 'the cup of tea on the table', h: 'cup', w: ['tea', 'table'], lv: 4 },
  { p: "my best friend's new puppy", h: 'puppy', w: ["friend's", 'new', 'best'], lv: 5 },
  { p: 'the boy in the blue jumper', h: 'boy', w: ['jumper', 'blue'], lv: 3 },
  { p: 'a glass of cold milk', h: 'glass', w: ['milk', 'cold'], lv: 3 },
  { p: 'the key to the front door', h: 'key', w: ['door', 'front'], lv: 3 },
  { p: 'an enormous pile of dirty washing', h: 'pile', w: ['washing', 'enormous', 'dirty'], lv: 4 },
]

const CLAUSE_COUNT: TextQ[] = (
  [
    ['The dog barked and the cat ran away.', 2, 'Two clauses: "the dog barked" and "the cat ran away", joined by "and".', 2],
    ['When the bell rang, everyone rushed out.', 2, 'Two clauses: "when the bell rang" and "everyone rushed out".', 2],
    ['I like tea.', 1, 'One subject, one verb: one clause.', 2],
    ['She smiled because she had passed, but her friend looked worried.', 3, 'Three clauses: "she smiled", "because she had passed", "her friend looked worried".', 4],
    ['Although it was cold, we went swimming and we had fun.', 3, 'Three clauses, each with its own verb: "it was cold", "we went swimming", "we had fun".', 4],
    ['The tall man in the grey coat waited at the station.', 1, 'Only one verb ("waited"), so one clause; the rest are phrases.', 3],
    ['After lunch, we walked to the park.', 1, '"After lunch" has no verb (it is a phrase), so there is only one clause.', 3],
    ['After we had lunch, we walked to the park.', 2, 'Two clauses: "after we had lunch" and "we walked to the park".', 3],
    ['The girl who sat next to me won the prize.', 2, 'Two clauses: the main clause "the girl won the prize" and the relative clause "who sat next to me".', 5],
  ] as [string, number, string, number][]
).map(([s, n, ex, lv]) => ({ q: `How many clauses are in this sentence? Type a number.\n${s}`, accept: [String(n), ['zero', 'one', 'two', 'three'][n]!], hint: 'Count the verbs that have their own subject. Each one is a clause.', ex, lv, placeholder: 'Type a number' }))

const phraseClauseGenerators: ItemGenerator[] = [
  classifyGen('phrases.phrase-or-clause', 'grammar.phrases-clauses', [1, 5], {
    rows: PHRASE_CLAUSE,
    cats: { phrase: 'A phrase is a group of words without a verb-and-subject pair.', clause: 'A clause contains a subject and a verb.' },
    prompt: (e) => `Is ${q(e.text)} a phrase or a clause?`,
    hint: 'Look for a verb with someone or something doing it. Found one? It is a clause.',
    keepOrder: true,
  }),
  G('phrases.head-noun', 'grammar.phrases-clauses', [2, 5], (rng, d) => {
    const r = rng.pick(atLevel(HEAD_NOUN, d))
    return choice({
      rng,
      prompt: `What is the head noun (the main noun) of this noun phrase?\n${r.p}`,
      correct: r.h,
      wrong: r.w.map((x) => ({ label: x, misconception: 'not-head', feedback: `"${x}" only adds detail to the main noun.` })),
      hint: 'Which ONE word is the phrase really about? Everything else adds detail to it.',
      explanation: `The phrase is about a ${r.h}: "${r.h}" is the head noun and every other word adds detail to it.`,
    })
  }),
  textGen('phrases.count-clauses', 'grammar.phrases-clauses', [2, 5], CLAUSE_COUNT),
]

// =====================================================================================================
// Sentence types and sentence building
// =====================================================================================================

const SENT_TYPE: Example[] = [
  { text: 'The cat slept on the warm windowsill.', a: 'simple', why: 'One main clause: simple.', lv: 1 },
  { text: 'I love reading, but my brother prefers football.', a: 'compound', why: 'Two main clauses joined by "but": compound.', lv: 2 },
  { text: 'Because it was snowing, school closed early.', a: 'complex', why: 'A subordinate clause ("Because it was snowing") + a main clause: complex.', lv: 2 },
  { text: 'We went to the beach and we built a sandcastle.', a: 'compound', why: 'Two main clauses joined by "and": compound.', lv: 2 },
  { text: 'The children who were waiting got cold.', a: 'complex', why: 'It contains a relative (subordinate) clause, "who were waiting": complex.', lv: 4 },
  { text: 'After the match, the players shook hands.', a: 'simple', why: '"After the match" has no verb - it is a phrase - so there is only one clause: simple.', lv: 4 },
  { text: 'After the match ended, the players shook hands.', a: 'complex', why: '"After the match ended" is a subordinate clause: complex.', lv: 3 },
  { text: 'You can walk or you can catch the bus.', a: 'compound', why: 'Two main clauses joined by "or": compound.', lv: 2 },
  { text: 'She smiled when she saw the puppy.', a: 'complex', why: '"When she saw the puppy" is a subordinate clause: complex.', lv: 3 },
  { text: 'Jess and her brother ran to the shop.', a: 'simple', why: 'Two people, but only one verb ("ran"): one clause, so simple.', lv: 4 },
  { text: 'The rain stopped, so we went outside.', a: 'compound', why: 'Two main clauses joined by "so": compound.', lv: 3 },
  { text: 'If you finish early, read a book.', a: 'complex', why: '"If you finish early" is a subordinate clause; "read a book" is the main clause (a command).', lv: 4 },
  { text: 'My dog, which is very old, sleeps all day.', a: 'complex', why: '"Which is very old" is a relative (subordinate) clause: complex.', lv: 4 },
  { text: 'The old lighthouse stood alone on the rocky cliff.', a: 'simple', why: 'One verb ("stood"), one clause: simple.', lv: 1 },
  { text: 'He was tired, yet he kept walking.', a: 'compound', why: 'Two main clauses joined by "yet": compound.', lv: 3 },
  { text: 'Although the film was long, nobody left.', a: 'complex', why: '"Although the film was long" is a subordinate clause: complex.', lv: 2 },
  { text: 'Tom laughed and clapped.', a: 'simple', why: 'One subject (Tom) doing two things: still one clause, so simple.', lv: 5 },
  { text: 'Tom laughed and Sam clapped.', a: 'compound', why: 'Two subjects, two verbs, joined by "and": compound.', lv: 4 },
]

const BUILD: string[][] = [
  ['Although the path was steep,', 'the walkers', 'kept climbing', 'towards the summit.'],
  ['When the alarm rang,', 'everyone', 'left the building', 'quickly and calmly.'],
  ['The fox,', 'which had been watching us,', 'slipped away', 'into the trees.'],
  ['Because the river had flooded,', 'the road', 'was closed', 'for a week.'],
  ['The museum', 'was closed,', 'so we', 'visited the park instead.'],
  ['Before she went to bed,', 'Ellie', 'packed her bag', 'for the school trip.'],
  ['If you listen carefully,', 'you can hear', 'the waves', 'from the cottage.'],
  ['My uncle,', 'who lives in Wales,', 'keeps bees', 'in his garden.'],
  ['As the sun rose,', 'the birds', 'began to sing', 'in the hedges.'],
  ['Unless it rains,', 'the match', 'will go ahead', 'on Saturday.'],
]

const COMBINE: { a: string; b: string; sub: string; coord: string; lv: number }[] = [
  { a: 'It was late.', b: 'We kept playing.', sub: 'Although it was late, we kept playing.', coord: 'It was late, but we kept playing.', lv: 3 },
  { a: 'The bus was late.', b: 'I missed the start of school.', sub: 'Because the bus was late, I missed the start of school.', coord: 'The bus was late, so I missed the start of school.', lv: 3 },
  { a: 'The storm passed.', b: 'The sky cleared.', sub: 'When the storm passed, the sky cleared.', coord: 'The storm passed and the sky cleared.', lv: 3 },
  { a: 'Sam was nervous.', b: 'He gave a brilliant speech.', sub: 'Although Sam was nervous, he gave a brilliant speech.', coord: 'Sam was nervous, but he gave a brilliant speech.', lv: 4 },
  { a: 'You might get lost.', b: 'Take a map.', sub: 'In case you get lost, take a map.', coord: 'You might get lost, so take a map.', lv: 5 },
  { a: 'The film ended.', b: 'Everyone clapped.', sub: 'As soon as the film ended, everyone clapped.', coord: 'The film ended and everyone clapped.', lv: 4 },
]

const sentenceTypeGenerators: ItemGenerator[] = [
  classifyGen('sentences.type', 'grammar.sentence-types', [1, 5], {
    rows: SENT_TYPE,
    cats: {
      simple: 'A simple sentence has just one main clause.',
      compound: 'A compound sentence joins two main clauses with a coordinating conjunction (and, but, or, so, yet).',
      complex: 'A complex sentence has a main clause and at least one subordinate clause.',
    },
    prompt: (e) => `Is this sentence simple, compound or complex?\n${e.text}`,
    hint: 'Count the clauses first. Then: are they joined by and/but/or/so (compound) or does one depend on the other (complex)?',
    keepOrder: true,
  }),
  G('sentences.build', 'grammar.sentence-types', [2, 4], (rng) => {
    const parts = rng.pick(BUILD)
    return orderItem({
      rng,
      prompt: 'Put these chunks in order to build one correctly punctuated sentence.',
      correct: parts,
      direction: ['start', 'end'],
      hint: 'Use the punctuation: the chunk with the capital letter starts, the one with the full stop ends, and commas show where clauses meet.',
      explanation: parts.join(' '),
    })
  }),
  G('sentences.combine', 'grammar.sentence-types', [3, 5], (rng, d) => {
    const r = rng.pick(atLevel(COMBINE, d))
    const splice = `${r.a.slice(0, -1)}, ${r.b.charAt(0).toLowerCase()}${r.b.slice(1)}`
    return choice({
      rng,
      prompt: `Which of these joins the two sentences into a COMPLEX sentence?\n${r.a} ${r.b}`,
      correct: r.sub,
      wrong: [
        { label: r.coord, misconception: 'compound-not-complex', feedback: 'That joins them with a coordinating conjunction, which makes a compound sentence.' },
        { label: splice, misconception: 'comma-splice', feedback: 'That just joins two main clauses with a comma: a comma splice.' },
        { label: `${r.a} ${r.b}`.replace('. ', '; '), misconception: 'semicolon', feedback: 'A semicolon joins two main clauses, but neither becomes subordinate, so it is not complex.' },
      ],
      hint: 'A complex sentence needs a subordinating conjunction (although, because, when, if...) to make one clause depend on the other.',
      explanation: `"${r.sub}" uses a subordinate clause, so it is complex.`,
    })
  }),
]

// =====================================================================================================
// Subordinate and relative clauses
// =====================================================================================================

const SUB_ROWS: { s: string; sub: string; main: string; other: string; lv: number }[] = [
  { s: 'When the storm arrived, the boats returned to the harbour.', sub: 'When the storm arrived', main: 'the boats returned to the harbour', other: 'to the harbour', lv: 2 },
  { s: 'We stayed indoors because it was freezing.', sub: 'because it was freezing', main: 'We stayed indoors', other: 'it was freezing', lv: 2 },
  { s: 'The girl who found the wallet handed it in.', sub: 'who found the wallet', main: 'The girl handed it in', other: 'handed it in', lv: 4 },
  { s: 'If you need help, ask a teacher.', sub: 'If you need help', main: 'ask a teacher', other: 'you need help', lv: 3 },
  { s: 'Although he was nervous, Sam gave a brilliant speech.', sub: 'Although he was nervous', main: 'Sam gave a brilliant speech', other: 'a brilliant speech', lv: 2 },
  { s: 'The house, which was built in 1850, has a secret passage.', sub: 'which was built in 1850', main: 'The house has a secret passage', other: 'in 1850', lv: 4 },
  { s: 'Rosie smiled as she opened the letter.', sub: 'as she opened the letter', main: 'Rosie smiled', other: 'the letter', lv: 3 },
  { s: 'Unless we leave now, we will miss the film.', sub: 'Unless we leave now', main: 'we will miss the film', other: 'we leave now', lv: 3 },
  { s: 'My bike, which I got for my birthday, has a flat tyre.', sub: 'which I got for my birthday', main: 'My bike has a flat tyre', other: 'for my birthday', lv: 4 },
  { s: 'They cheered until their voices were hoarse.', sub: 'until their voices were hoarse', main: 'They cheered', other: 'their voices', lv: 3 },
  { s: 'While the others slept, Max crept downstairs.', sub: 'While the others slept', main: 'Max crept downstairs', other: 'the others slept', lv: 3 },
]

const RELATIVE: { s: string; r: string; w: string[]; lv: number }[] = [
  { s: "The book that I'm reading is scary.", r: 'that', w: ['book', 'reading', 'scary'], lv: 3 },
  { s: 'The man whose car was stolen called the police.', r: 'whose', w: ['man', 'stolen', 'called'], lv: 3 },
  { s: 'Paris, which is the capital of France, is beautiful.', r: 'which', w: ['Paris', 'capital', 'beautiful'], lv: 2 },
  { s: 'My aunt, who is a nurse, works nights.', r: 'who', w: ['aunt', 'nurse', 'works'], lv: 2 },
  { s: 'This is the café where we first met.', r: 'where', w: ['This', 'first', 'met'], lv: 4 },
  { s: 'The dog that chased our cat lives next door.', r: 'that', w: ['dog', 'chased', 'lives'], lv: 3 },
  { s: 'The pupils who finished early helped tidy up.', r: 'who', w: ['pupils', 'early', 'helped'], lv: 2 },
]

const subordinateGenerators: ItemGenerator[] = [
  G('subclause.find-sub', 'grammar.subordinate-clauses', [2, 4], (rng, d) => {
    const r = rng.pick(atLevel(SUB_ROWS, d))
    return choice({
      rng,
      prompt: `Which part of this sentence is the subordinate clause?\n${r.s}`,
      correct: r.sub,
      wrong: [
        { label: r.main, misconception: 'main-clause', feedback: 'That is the main clause: it makes sense on its own.' },
        { label: r.other, misconception: r.sub.includes(r.other) ? 'missing-conjunction' : 'phrase', feedback: r.sub.includes(r.other) ? 'Close, but the subordinate clause includes the word that introduces it.' : 'That is only part of a clause (a phrase).' },
      ],
      hint: 'The subordinate clause does not make sense on its own and usually starts with a word like when, because, although, if, who or which.',
      explanation: `"${r.sub}" is the subordinate clause: it adds information but cannot stand alone. The main clause is "${r.main}".`,
    })
  }),
  G('subclause.find-main', 'grammar.subordinate-clauses', [3, 5], (rng, d) => {
    const r = rng.pick(atLevel(SUB_ROWS, d))
    return choice({
      rng,
      prompt: `Which part of this sentence is the main clause (it would make sense on its own)?\n${r.s}`,
      correct: r.main,
      wrong: [
        { label: r.sub, misconception: 'sub-for-main', feedback: 'That is the subordinate clause: it depends on the rest of the sentence.' },
        { label: r.other, misconception: 'fragment', feedback: 'That is only part of the sentence and is not the main clause.' },
      ],
      hint: 'Cover each part up. Which part could be a full sentence by itself?',
      explanation: `"${r.main}" makes sense on its own, so it is the main clause.`,
    })
  }),
  G('subclause.relative', 'grammar.subordinate-clauses', [2, 4], (rng, d) => {
    const r = rng.pick(atLevel(RELATIVE, d))
    return choice({
      rng,
      prompt: `Which word introduces the relative clause in this sentence?\n${r.s}`,
      correct: r.r,
      wrong: r.w,
      hint: 'Relative clauses start with words like who, which, that, whose or where, and give more information about a noun.',
      explanation: `"${r.r}" introduces the relative clause, which tells us more about the noun just before it.`,
    })
  }),
  G('subclause.build', 'grammar.subordinate-clauses', [2, 5], (rng) => {
    const parts = rng.pick(BUILD.filter((b) => /^(Although|When|Because|Before|If|As|Unless)/.test(b[0]!) || b[1]!.startsWith('who') || b[1]!.startsWith('which')))
    return orderItem({
      rng,
      prompt: 'Build the complex sentence: put the chunks in order.',
      correct: parts,
      direction: ['start', 'end'],
      hint: 'A subordinate clause at the start is followed by a comma; an embedded clause sits between two commas.',
      explanation: parts.join(' '),
    })
  }),
]

// =====================================================================================================
// Active and passive
// =====================================================================================================

const VOICE: Example[] = [
  { text: 'The dog chased the cat.', a: 'active', why: 'The subject (the dog) does the action: active.', lv: 1 },
  { text: 'The cat was chased by the dog.', a: 'passive', why: 'The subject (the cat) has the action done to it: passive (was + chased).', lv: 1 },
  { text: 'The window was smashed.', a: 'passive', why: 'The window had something done to it; we are not told who did it. That is passive.', lv: 3 },
  { text: 'Shakespeare wrote Romeo and Juliet.', a: 'active', why: 'The subject (Shakespeare) does the writing: active.', lv: 2 },
  { text: 'Romeo and Juliet was written by Shakespeare.', a: 'passive', why: 'was + written (past participle) + by...: passive.', lv: 2 },
  { text: 'The cake has been eaten.', a: 'passive', why: 'has been + eaten: passive, with no mention of who ate it.', lv: 4 },
  { text: 'Our team won the match.', a: 'active', why: 'The team does the winning: active.', lv: 2 },
  { text: 'The road is being repaired.', a: 'passive', why: 'is being + repaired: the road has the action done to it.', lv: 5 },
  { text: 'The children were laughing loudly.', a: 'active', why: 'Were + -ing is the past progressive, not the passive. The children are doing the laughing.', lv: 4 },
  { text: 'Mistakes were made.', a: 'passive', why: 'were + made, and the person who made them is hidden: passive.', lv: 3 },
  { text: 'The letter will be delivered tomorrow.', a: 'passive', why: 'will be + delivered: passive.', lv: 4 },
  { text: 'The storm damaged several houses.', a: 'active', why: 'The storm does the damaging: active.', lv: 2 },
  { text: 'She was given a prize.', a: 'passive', why: 'was + given: she receives the action, so it is passive.', lv: 4 },
  { text: 'The bridge was built in 1890.', a: 'passive', why: 'was + built: passive.', lv: 3 },
]

interface Voice {
  A: string
  a: string
  O: string
  o: string
  past: string
  pp: string
  ing: string
  plA?: boolean
  plO?: boolean
}
const VOICE_ROWS: Voice[] = [
  { A: 'The chef', a: 'the chef', O: 'The meal', o: 'the meal', past: 'cooked', pp: 'cooked', ing: 'cooking' },
  { A: 'A fox', a: 'a fox', O: 'The chickens', o: 'the chickens', past: 'frightened', pp: 'frightened', ing: 'frightening', plO: true },
  { A: 'Our neighbours', a: 'our neighbours', O: 'The fence', o: 'the fence', past: 'painted', pp: 'painted', ing: 'painting', plA: true },
  { A: 'The storm', a: 'the storm', O: 'The old barn', o: 'the old barn', past: 'destroyed', pp: 'destroyed', ing: 'destroying' },
  { A: 'The goalkeeper', a: 'the goalkeeper', O: 'The penalty', o: 'the penalty', past: 'saved', pp: 'saved', ing: 'saving' },
  { A: 'A famous architect', a: 'a famous architect', O: 'The bridge', o: 'the bridge', past: 'designed', pp: 'designed', ing: 'designing' },
  { A: 'The children', a: 'the children', O: 'The posters', o: 'the posters', past: 'made', pp: 'made', ing: 'making', plA: true, plO: true },
  { A: 'Dickens', a: 'Dickens', O: 'A Christmas Carol', o: 'A Christmas Carol', past: 'wrote', pp: 'written', ing: 'writing' },
  { A: 'The teacher', a: 'the teacher', O: 'The tests', o: 'the tests', past: 'marked', pp: 'marked', ing: 'marking', plO: true },
  { A: 'A huge wave', a: 'a huge wave', O: 'The sandcastle', o: 'the sandcastle', past: 'flattened', pp: 'flattened', ing: 'flattening' },
  { A: 'The police', a: 'the police', O: 'The thief', o: 'the thief', past: 'caught', pp: 'caught', ing: 'catching', plA: true },
]

const WHY_PASSIVE: MC[] = [
  { q: 'Why might a writer choose the passive in "The window was broken."?', a: 'Who broke it is unknown, or the writer does not want to say.', w: ['To make the sentence funnier.', 'Because the window broke itself.', 'To show the action is happening now.'], hint: 'What is missing from the sentence?', ex: 'The passive lets a writer leave out who did the action, because it is unknown, unimportant or being hidden.', lv: 3 },
  { q: 'A science write-up says: "The water was heated for five minutes." Why is the passive used?', a: 'To keep the focus on the process rather than the person, which sounds formal and objective.', w: ['To show the experiment went wrong.', 'Because nobody did the heating.', 'To make the writing more personal.'], hint: 'In a science report, does it matter who held the beaker?', ex: 'Scientific writing often uses the passive to focus on what was done, not who did it, giving an impersonal, formal tone.', lv: 4 },
  { q: 'A politician says: "Mistakes were made." What effect does the passive have?', a: 'It avoids saying who made the mistakes, so nobody takes the blame.', w: ['It shows the politician made the mistakes.', 'It makes the mistakes sound bigger.', 'It is more informal and friendly.'], hint: 'Who is missing from the sentence?', ex: 'The passive can hide who is responsible: here it dodges blame.', lv: 5 },
  { q: 'A news headline reads: "Rare painting stolen from museum". Why is the passive (with "was" left out) used?', a: 'The painting is the focus of the story, and the thief is unknown.', w: ['To show the painting stole something.', 'Because headlines must always be passive.', 'To make it clear who the thief is.'], hint: 'What does the reader care about first?', ex: 'The passive puts the painting (the important thing) first and works even when the thief is unknown.', lv: 4 },
]

function passiveOf(v: Voice): string {
  return `${v.O} ${v.plO ? 'were' : 'was'} ${v.pp} by ${v.a}.`
}

const passiveGenerators: ItemGenerator[] = [
  classifyGen('voice.identify', 'grammar.active-passive', [1, 5], {
    rows: VOICE,
    cats: { active: 'In an active sentence the subject does the action (The dog chased the cat).', passive: 'In a passive sentence the subject has the action done to it, using be + past participle (The cat was chased).' },
    prompt: (e) => `Is this sentence active or passive?\n${e.text}`,
    hint: 'Is the subject doing the action, or having it done to them? Look for a form of "be" + a past participle (was chased, has been eaten).',
    keepOrder: true,
  }),
  G('voice.to-passive', 'grammar.active-passive', [2, 4], (rng) => {
    const v = rng.pick(VOICE_ROWS)
    return choice({
      rng,
      prompt: `Which is the passive version of this sentence?\n${v.A} ${v.past} ${v.o}.`,
      correct: passiveOf(v),
      wrong: [
        { label: `${v.O} ${v.plO ? 'are' : 'is'} ${v.pp} by ${v.a}.`, misconception: 'changed-tense', feedback: 'That is passive, but the tense has changed from past to present.' },
        { label: `${v.A} ${v.plA ? 'were' : 'was'} ${v.pp} by ${v.o}.`, misconception: 'swapped-roles', feedback: 'That swaps who did what! The doer should come after "by".' },
        { label: `${v.A} ${v.plA ? 'were' : 'was'} ${v.ing} ${v.o}.`, misconception: 'progressive-is-passive', feedback: 'Was/were + -ing is the past progressive, which is still active.' },
      ],
      hint: 'Move the object to the front, use was/were + past participle, and put the doer after "by".',
      explanation: `${passiveOf(v)} The thing that had the action done to it (${v.o}) becomes the subject.`,
    })
  }),
  G('voice.to-active', 'grammar.active-passive', [3, 5], (rng) => {
    const v = rng.pick(VOICE_ROWS)
    return choice({
      rng,
      prompt: `Which is the active version of this sentence?\n${passiveOf(v)}`,
      correct: `${v.A} ${v.past} ${v.o}.`,
      wrong: [
        { label: `${v.O} ${v.past} ${v.a}.`, misconception: 'swapped-roles', feedback: 'That swaps who did what.' },
        { label: `${v.A} ${v.plA ? 'were' : 'was'} ${v.ing} ${v.o}.`, misconception: 'changed-tense', feedback: 'That is active, but it changes the simple past into the past progressive.' },
        { label: `${v.O} ${v.plO ? 'had been' : 'had been'} ${v.pp} by ${v.a}.`, misconception: 'still-passive', feedback: 'That is still passive.' },
      ],
      hint: 'Who did the action? Put them first as the subject.',
      explanation: `${v.A} ${v.past} ${v.o}. The doer (after "by") becomes the subject.`,
    })
  }),
  G('voice.who-did-it', 'grammar.active-passive', [2, 3], (rng) => {
    const v = rng.pick(VOICE_ROWS)
    return choice({
      rng,
      prompt: `In this passive sentence, who or what actually did the action?\n${passiveOf(v)}`,
      correct: v.a,
      wrong: [{ label: v.o, misconception: 'subject-is-doer', feedback: `In a passive sentence the subject (${v.o}) has the action done TO it.` }],
      hint: 'In a passive sentence, the doer usually comes after the word "by".',
      explanation: `${v.A} did the action; in the passive the doer comes after "by".`,
    })
  }),
  bankGen('voice.why', 'grammar.active-passive', [3, 5], WHY_PASSIVE),
]

// =====================================================================================================
// Standard English
// =====================================================================================================

const SE_FIX: TextQ[] = (
  [
    ['We was late for school.', 'was', ['were'], 'With "we", Standard English uses "were".', 2],
    ['I done my homework last night.', 'done', ['did'], '"Done" needs a helper (I have done). On its own, use "did".', 2],
    ['She should of told me.', 'of', ['have'], '"Should of" comes from mishearing "should\'ve". It is "should have".', 2],
    ['They was playing football.', 'was', ['were'], 'With "they", use "were".', 2],
    ['He seen the film yesterday.', 'seen', ['saw'], '"Seen" needs a helper (he has seen). On its own, use "saw".', 3],
    ['Give me them books.', 'them', ['those'], '"Them" is a pronoun; before a noun, use the determiner "those".', 3],
    ['I could of won.', 'of', ['have'], '"Could of" should be "could have".', 2],
    ['You was right.', 'was', ['were'], 'With "you", use "were".', 2],
    ["She ain't coming.", "ain't", ["isn't", 'is not'], '"Ain\'t" is non-standard; use "isn\'t".', 3],
    ['He come round yesterday.', 'come', ['came'], 'The simple past of "come" is "came".', 3],
    ['I were going to call you.', 'were', ['was'], 'With "I", use "was".', 3],
    ['Them apples are rotten.', 'Them', ['Those'], 'Before a noun, use "those", not "them".', 3],
    ["I didn't do nothing.", 'nothing', ['anything'], 'A double negative ("didn\'t ... nothing") is non-standard. Use "anything".', 4],
    ["She can't find her keys nowhere.", 'nowhere', ['anywhere'], 'Double negative: use "anywhere" after "can\'t".', 4],
    ['They should have went home.', 'went', ['gone'], 'After "have", use the past participle "gone".', 4],
    ['She has took my pen.', 'took', ['taken'], 'After "has", use the past participle "taken".', 4],
    ['He drawed a picture.', 'drawed', ['drew'], '"Draw" is irregular: drew.', 3],
    ["That's the man what helped me.", 'what', ['who', 'that'], 'For a person, the relative pronoun is "who" (or "that"), not "what".', 4],
    ['I was sat on the sofa when you rang.', 'sat', ['sitting'], 'In Standard English, "I was sitting", not "I was sat".', 5],
    ['We was stood outside for ages.', 'was', ['were'], 'With "we", use "were" (and Standard English would also say "standing").', 5],
  ] as [string, string, string[], string, number][]
).map(([s, wrong, right, ex, lv]) => ({
  q: `This sentence uses non-standard English:\n${s}\nType the Standard English word that should replace ${q(wrong)}.`,
  accept: right,
  hint: 'Think about how the sentence would be written in a formal letter or an exam.',
  ex: `${s.replace(new RegExp(`\\b${wrong.replace(/'/g, "'")}(?![\\w'])`), right[0]!)} ${ex}`,
  lv,
}))

const SE_CHOICE: MC[] = [
  { q: 'Which sentence is written in Standard English?', a: 'We were really tired after the trip.', w: ['We was really tired after the trip.', 'We was dead tired after the trip.', 'Us was really tired after the trip.'], hint: 'Check the verb that goes with "we".', ex: '"We were" is the Standard English form.', lv: 2 },
  { q: 'Which sentence is written in Standard English?', a: "I haven't got any money.", w: ["I haven't got no money.", "I ain't got any money.", "I ain't got no money."], hint: 'Look out for double negatives and "ain\'t".', ex: '"Haven\'t got any" avoids a double negative and uses a standard verb form.', lv: 2 },
  { q: 'Which sentence is written in Standard English?', a: 'She did her homework before tea.', w: ['She done her homework before tea.', 'She has did her homework before tea.', 'She do her homework before tea yesterday.'], hint: 'Which form of "do" fits a finished action with no helper?', ex: '"Did" is the simple past of "do".', lv: 3 },
  { q: 'Which sentence is written in Standard English?', a: 'You should have seen it!', w: ['You should of seen it!', 'You should have saw it!', 'You should of saw it!'], hint: 'Two things to check: "of"/"have", and saw/seen.', ex: '"Should have" + past participle "seen".', lv: 3 },
  { q: 'Which sentence is written in Standard English?', a: 'Those trainers are mine.', w: ['Them trainers are mine.', 'Them trainers is mine.', 'Those trainers is mine.'], hint: 'Check the word before "trainers" and the verb.', ex: '"Those" (not "them") goes before a noun, and plural "trainers" takes "are".', lv: 3 },
  { q: 'Which sentence is written in Standard English?', a: 'My friend and I went to the cinema.', w: ['Me and my friend went to the cinema.', 'Me and my friend goes to the cinema yesterday.', 'My friend and me went to the cinema.'], hint: 'Take "my friend" away: would you say "me went" or "I went"?', ex: 'As the subject, use "I": "My friend and I went".', lv: 4 },
]

const standardEnglishGenerators: ItemGenerator[] = [textGen('standard.fix-word', 'grammar.standard-english', [2, 5], SE_FIX), bankGen('standard.choose', 'grammar.standard-english', [2, 4], SE_CHOICE)]

// =====================================================================================================
// Register
// =====================================================================================================

const FORMAL_SWAP: [string, string, string[], number][] = [
  ['kids', 'children', ['youngsters', 'little ones'], 2],
  ['find out', 'discover', ['suss out', 'figure out'], 3],
  ['buy', 'purchase', ['get hold of', 'grab'], 2],
  ['help', 'assist', ['give a hand', 'help out'], 3],
  ['need', 'require', ['have got to have', 'gotta have'], 3],
  ['ask for', 'request', ['ask around for', 'beg for'], 3],
  ['start', 'commence', ['kick off', 'get going'], 4],
  ['a bit', 'slightly', ['kind of', 'sort of'], 3],
  ['put up with', 'tolerate', ['stick', 'deal with it'], 4],
  ['go up', 'increase', ['shoot up', 'go through the roof'], 4],
  ['loads of', 'a great deal of', ['tons of', 'heaps of'], 2],
  ['get in touch', 'contact', ['give a shout', 'drop a line'], 4],
  ['awesome', 'excellent', ['amazing', 'brilliant'], 3],
]

const REGISTER_CLASS: Example[] = [
  { text: "Hiya! Can't wait to see ya on Saturday!", a: 'informal', why: 'Slang ("Hiya", "ya"), contractions and exclamation marks make it informal.', lv: 1 },
  { text: 'I am writing to complain about the condition of the park.', a: 'formal', why: 'Full forms ("I am"), polite and precise wording: formal.', lv: 1 },
  { text: 'We regret to inform you that the event has been cancelled.', a: 'formal', why: '"We regret to inform you" is a formal set phrase, and it uses the passive.', lv: 2 },
  { text: "That film was well good, you've gotta see it.", a: 'informal', why: '"Well good" and "gotta" are slang: informal.', lv: 1 },
  { text: "Guess what? I'm finally off on holiday!", a: 'informal', why: 'Chatty question, contraction and exclamation: informal.', lv: 2 },
  { text: 'Pupils are reminded that mobile phones must be switched off.', a: 'formal', why: 'Impersonal, passive ("are reminded") and no contractions: formal.', lv: 3 },
  { text: 'Please find enclosed my application form.', a: 'formal', why: '"Please find enclosed" is formal letter language.', lv: 3 },
  { text: "No worries, I'll sort it.", a: 'informal', why: '"No worries" and "sort it" are casual phrases: informal.', lv: 2 },
  { text: 'Further information is available on request.', a: 'formal', why: 'Impersonal and precise: formal.', lv: 4 },
  { text: "Honestly, the new canteen is a total game-changer, trust me.", a: 'informal', why: '"Total game-changer" and "trust me" are chatty and conversational: informal.', lv: 4 },
]

const REGISTER_FEATURES: MC[] = [
  { q: 'Which feature is typical of FORMAL writing?', a: 'Full forms instead of contractions (do not, rather than don\'t)', w: ['Slang words', 'Text-speak abbreviations', 'Lots of exclamation marks'], hint: 'Think of a letter to a head teacher.', ex: 'Formal writing avoids contractions, slang and text-speak.', lv: 2 },
  { q: 'Which word in "We\'re gonna be late!" makes it informal slang?', a: 'gonna', w: ['late', 'be', 'We'], hint: 'Which word would not appear in a formal letter?', ex: '"Gonna" is slang for "going to".', lv: 1 },
  { q: 'Which is the most appropriate sign-off for a formal letter that began "Dear Sir or Madam"?', a: 'Yours faithfully', w: ['Love from', 'See ya', 'Cheers'], hint: 'You do not know the person\'s name.', ex: 'When you start "Dear Sir or Madam", end with "Yours faithfully".', lv: 3 },
  { q: 'Which sentence would suit a formal report?', a: 'The majority of pupils preferred the later start time.', w: ['Loads of kids liked starting later.', 'Basically everyone was like, yes please, later!', 'Most of us reckon later is way better.'], hint: 'No slang, no chat, precise words.', ex: '"The majority of pupils preferred..." is precise and impersonal.', lv: 3 },
  { q: 'Why is the passive often used in formal writing?', a: 'It sounds impersonal and objective.', w: ['It makes writing more chatty.', 'It is shorter than the active.', 'It always shows who did the action.'], hint: 'Think about "It has been decided that..."', ex: 'The passive keeps the focus off people, which sounds impersonal and objective.', lv: 5 },
  { q: 'Which opening suits an informal email to a friend?', a: 'Hi Jess, how are things?', w: ['Dear Sir or Madam,', 'To whom it may concern,', 'I am writing to inform you that'], hint: 'Who is the audience?', ex: 'A friendly greeting suits an informal email to a friend.', lv: 1 },
]

const registerGenerators: ItemGenerator[] = [
  G('register.formal-word', 'grammar.register', [1, 4], (rng, d) => {
    const pool = FORMAL_SWAP.filter(([, , , lv]) => Math.abs(lv - d) <= 1)
    const [inf, formal, others] = rng.pick(pool.length ? pool : FORMAL_SWAP)
    return choice({
      rng,
      prompt: `Which is the most formal way to say ${q(inf)}?`,
      correct: formal,
      wrong: [inf, ...others].map((w) => ({ label: w, misconception: 'informal-choice', feedback: `"${w}" is too casual for formal writing.` })).slice(0, 3),
      hint: 'Which would you write in a letter to a head teacher?',
      explanation: `"${formal}" is the formal choice; "${inf}" is fine in conversation.`,
    })
  }),
  classifyGen('register.classify', 'grammar.register', [1, 4], {
    rows: REGISTER_CLASS,
    cats: { formal: 'Formal writing is impersonal and polite, with no slang or contractions.', informal: 'Informal writing is chatty, with slang, contractions and exclamations.' },
    prompt: (e) => `Is this formal or informal?\n${e.text}`,
    hint: 'Look for slang, contractions and chatty phrases.',
    keepOrder: true,
  }),
  bankGen('register.features', 'grammar.register', [1, 5], REGISTER_FEATURES),
]

// =====================================================================================================

export const grammarGenerators: ItemGenerator[] = [
  ...wordClassGens('wordclass.basic', 'grammar.word-classes', BASIC, ['noun', 'verb', 'adjective', 'adverb'], [1, 5]),
  ...nounGenerators,
  ...verbGenerators,
  ...wordClassGens('verbs.words', 'grammar.verbs', FULL, ['verb'], [1, 3]),
  ...adjAdvGenerators,
  ...wordClassGens('adjadv.words', 'grammar.adjectives-adverbs', FULL, ['adjective', 'adverb'], [2, 4]),
  ...pronounGenerators,
  ...conjGenerators,
  ...tenseGenerators,
  ...phraseClauseGenerators,
  ...sentenceTypeGenerators,
  ...subordinateGenerators,
  ...passiveGenerators,
  ...standardEnglishGenerators,
  ...registerGenerators,
]
