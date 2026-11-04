import type { ItemGenerator } from '@/engine/registry'
import { choice, matchItem } from '../kit'
import { G, atLevel, bankGen, pairMatchGen, q, sample, textGen, type MC, type Pair, type TextQ } from './helpers'

// =====================================================================================================
// Homophones and confusables
// =====================================================================================================

const SETS: Record<string, { words: string[]; rule: string; lv: number }> = {
  there: { words: ['there', 'their', "they're"], rule: 'there = a place (over there); their = belonging to them; they\'re = they are.', lv: 1 },
  your: { words: ['your', "you're"], rule: 'your = belonging to you; you\'re = you are.', lv: 1 },
  to: { words: ['to', 'too', 'two'], rule: 'to = towards / part of a verb (to run); too = also or excessively; two = 2.', lv: 1 },
  its: { words: ['its', "it's"], rule: 'its = belonging to it; it\'s = it is / it has.', lv: 2 },
  whose: { words: ['whose', "who's"], rule: 'whose = belonging to whom; who\'s = who is / who has.', lv: 2 },
  where: { words: ['where', 'wear', 'were'], rule: 'where = place; wear = put on clothes; were = past of "are".', lv: 2 },
  then: { words: ['then', 'than'], rule: 'then = next / at that time; than = for comparing (taller than).', lv: 2 },
  affect: { words: ['affect', 'effect'], rule: 'affect is usually the verb (to affect something); effect is usually the noun (an effect).', lv: 4 },
  practice: { words: ['practice', 'practise'], rule: 'In British English, practice (with c) is the noun; practise (with s) is the verb.', lv: 4 },
  accept: { words: ['accept', 'except'], rule: 'accept = receive or agree to; except = apart from.', lv: 3 },
  aloud: { words: ['aloud', 'allowed'], rule: 'aloud = out loud; allowed = permitted.', lv: 3 },
  past: { words: ['passed', 'past'], rule: 'passed = the verb (we passed it); past = time gone by, or "beyond" (walked past, ten past three).', lv: 3 },
  weather: { words: ['weather', 'whether'], rule: 'weather = rain, sun, etc.; whether = if (whether or not).', lv: 3 },
  peace: { words: ['peace', 'piece'], rule: 'peace = calm, no war; piece = a part of something.', lv: 2 },
  brake: { words: ['brake', 'break'], rule: 'brake = to stop a vehicle (or the part that does it); break = to smash, or a rest.', lv: 3 },
  stationary: { words: ['stationary', 'stationery'], rule: 'stationary (a for "at rest") = not moving; stationery (e for "envelopes") = pens and paper.', lv: 5 },
  principal: { words: ['principal', 'principle'], rule: 'principal = main or most important; principle = a rule or belief.', lv: 5 },
  compliment: { words: ['compliment', 'complement'], rule: 'compliment = praise; complement = something that goes well with or completes something.', lv: 5 },
  lose: { words: ['lose', 'loose'], rule: 'lose = to misplace or not win; loose = not tight.', lv: 3 },
  advice: { words: ['advice', 'advise'], rule: 'In British English, advice (with c) is the noun; advise (with s) is the verb.', lv: 4 },
}

const HOMOPHONES: { s: string; a: string; set: string }[] = [
  { s: 'The children left ___ coats on the bus.', a: 'their', set: 'there' },
  { s: "___ going to be late if they don't hurry.", a: "they're", set: 'there' },
  { s: 'Put the box over ___ by the door.', a: 'there', set: 'there' },
  { s: 'Is this ___ bag?', a: 'your', set: 'your' },
  { s: '___ going to love this film.', a: "you're", set: 'your' },
  { s: 'Can I come ___?', a: 'too', set: 'to' },
  { s: 'We walked ___ the shops.', a: 'to', set: 'to' },
  { s: 'She has ___ older brothers.', a: 'two', set: 'to' },
  { s: 'The dog chased ___ own tail.', a: 'its', set: 'its' },
  { s: '___ been raining all day.', a: "it's", set: 'its' },
  { s: '___ coat is this?', a: 'whose', set: 'whose' },
  { s: '___ coming to the party?', a: "who's", set: 'whose' },
  { s: 'Cold weather can ___ your mood.', a: 'affect', set: 'affect' },
  { s: 'The new rule had a big ___ on the school.', a: 'effect', set: 'affect' },
  { s: 'I need to ___ the piano every day.', a: 'practise', set: 'practice' },
  { s: 'Football ___ is on Tuesday.', a: 'practice', set: 'practice' },
  { s: 'Everyone came ___ Jake.', a: 'except', set: 'accept' },
  { s: 'Please ___ this small gift.', a: 'accept', set: 'accept' },
  { s: 'Phones are not ___ in the exam hall.', a: 'allowed', set: 'aloud' },
  { s: 'She read the poem ___ to the class.', a: 'aloud', set: 'aloud' },
  { s: 'We ___ the old mill on our walk.', a: 'passed', set: 'past' },
  { s: 'It was ten ___ three.', a: 'past', set: 'past' },
  { s: "I don't know ___ to laugh or cry.", a: 'whether', set: 'weather' },
  { s: 'The ___ forecast says it will snow.', a: 'weather', set: 'weather' },
  { s: 'Would you like a ___ of cake?', a: 'piece', set: 'peace' },
  { s: 'After the war, there was ___ at last.', a: 'peace', set: 'peace' },
  { s: 'Be careful not to ___ the vase.', a: 'break', set: 'brake' },
  { s: 'The cyclist pulled hard on the ___.', a: 'brake', set: 'brake' },
  { s: 'The car was ___ at the traffic lights.', a: 'stationary', set: 'stationary' },
  { s: 'Pens and paper are kept in the ___ cupboard.', a: 'stationery', set: 'stationary' },
  { s: 'Honesty is an important ___.', a: 'principle', set: 'principal' },
  { s: 'The ___ reason for the delay was the snow.', a: 'principal', set: 'principal' },
  { s: 'She paid me a lovely ___ about my drawing.', a: 'compliment', set: 'compliment' },
  { s: 'The red scarf is the perfect ___ to her coat.', a: 'complement', set: 'compliment' },
  { s: '___ are my shoes?', a: 'where', set: 'where' },
  { s: 'What will you ___ to the party?', a: 'wear', set: 'where' },
  { s: 'They ___ late for the bus.', a: 'were', set: 'where' },
  { s: 'She is taller ___ her brother.', a: 'than', set: 'then' },
  { s: 'First we ate, and ___ we played games.', a: 'then', set: 'then' },
  { s: "Don't ___ your ticket!", a: 'lose', set: 'lose' },
  { s: 'This tooth is ___.', a: 'loose', set: 'lose' },
  { s: 'Can you give me some ___?', a: 'advice', set: 'advice' },
  { s: 'I would ___ you to leave early.', a: 'advise', set: 'advice' },
]

const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const fillGap = (s: string, w: string) => (s.startsWith('___') ? s.replace('___', capFirst(w)) : s.replace('___', w))
const hLevel = (h: (typeof HOMOPHONES)[number]) => SETS[h.set]!.lv

const homophoneGenerators: ItemGenerator[] = [
  G('homophones.choose', 'spelling.homophones', [1, 5], (rng, d) => {
    const pool = HOMOPHONES.filter((h) => Math.abs(hLevel(h) - d) <= 1)
    const h = rng.pick(pool.length ? pool : HOMOPHONES)
    const set = SETS[h.set]!
    return choice({
      rng,
      prompt: `Which word fills the gap?\n${h.s}`,
      correct: h.a,
      wrong: set.words.filter((w) => w !== h.a).map((w) => ({ label: w, misconception: `homophone-${h.set}`, feedback: set.rule })),
      keepOrder: true,
      hint: 'Try expanding any apostrophe (they\'re = they are). Does it still make sense?',
      explanation: `${fillGap(h.s, h.a)} Remember: ${set.rule}`,
    })
  }),
  G('homophones.spot', 'spelling.homophones', [2, 5], (rng, d) => {
    const pool = HOMOPHONES.filter((h) => Math.abs(hLevel(h) - d) <= 1)
    const h = rng.pick(pool.length ? pool : HOMOPHONES)
    const set = SETS[h.set]!
    const bad = rng.pick(set.words.filter((w) => w !== h.a))
    const sentence = fillGap(h.s, bad)
    const shown = h.s.startsWith('___') ? capFirst(bad) : bad
    const words = sentence.replace(/[.?!,]/g, '').split(' ').filter((w) => w.toLowerCase() !== bad.toLowerCase() && w.length > 2 && !/'/.test(w))
    const wrong = sample(rng, [...new Set(words)], 3)
    return choice({
      rng,
      prompt: `One word in this sentence is the wrong homophone. Which one?\n${sentence}`,
      correct: shown,
      wrong: wrong.map((w) => ({ label: w, feedback: `"${w}" is spelt correctly here.` })),
      hint: 'Look for a word that sounds right but is spelt for a different meaning.',
      explanation: `It should be "${h.a}": ${fillGap(h.s, h.a)} Remember: ${set.rule}`,
    })
  }),
]

// =====================================================================================================
// Plurals, prefixes and suffixes
// =====================================================================================================

const PLURALS: TextQ[] = (
  [
    ['baby', ['babies'], 'Consonant + y: change y to i and add -es.', 2],
    ['day', ['days'], 'Vowel + y: just add -s.', 2],
    ['knife', ['knives'], 'Many words ending in -fe change to -ves.', 3],
    ['roof', ['roofs'], '"Roof" just adds -s (it does not change to -ves).', 4],
    ['potato', ['potatoes'], 'Potato and tomato add -es.', 3],
    ['piano', ['pianos'], 'Many words from Italian ending in -o (piano, solo) just add -s.', 4],
    ['child', ['children'], 'Irregular plural.', 1],
    ['mouse', ['mice'], 'Irregular plural.', 2],
    ['sheep', ['sheep'], 'The plural is the same as the singular.', 3],
    ['box', ['boxes'], 'Words ending in -x add -es.', 1],
    ['church', ['churches'], 'Words ending in -ch add -es.', 2],
    ['tooth', ['teeth'], 'Irregular plural.', 2],
    ['woman', ['women'], 'Irregular plural.', 2],
    ['half', ['halves'], 'Words ending in -f often change to -ves.', 3],
    ['chief', ['chiefs'], '"Chief" just adds -s.', 4],
    ['hero', ['heroes'], '"Hero" adds -es.', 4],
    ['echo', ['echoes'], '"Echo" adds -es.', 4],
    ['photo', ['photos'], 'Shortened words like photo (photograph) just add -s.', 4],
    ['wolf', ['wolves'], '-f changes to -ves.', 3],
    ['crisis', ['crises'], 'Words from Greek ending in -is change to -es.', 5],
    ['cactus', ['cacti', 'cactuses'], 'Both "cacti" (the Latin plural) and "cactuses" are accepted.', 5],
    ['phenomenon', ['phenomena'], 'A Greek plural: -on becomes -a.', 5],
    ['loaf', ['loaves'], '-f changes to -ves.', 3],
    ['city', ['cities'], 'Consonant + y: change y to i and add -es.', 2],
  ] as [string, string[], string, number][]
).map(([w, a, ex, lv]) => ({ q: `Write the plural of ${q(w)}.`, accept: a, hint: 'Check the ending: -y, -f/-fe, -o, -s/-x/-ch/-sh, or is it irregular?', ex: `${w} → ${a[0]}. ${ex}`, lv, placeholder: 'Type the plural' }))

const SUFFIXES: TextQ[] = (
  [
    ['hop + ing', 'hopping', 'Short vowel + single consonant: double the consonant.', 2],
    ['hope + ing', 'hoping', 'Drop the final e before a vowel suffix.', 2],
    ['happy + ness', 'happiness', 'Consonant + y: change y to i.', 2],
    ['begin + ing', 'beginning', 'The stress is on the last syllable (be-GIN), so double the n.', 4],
    ['beauty + ful', 'beautiful', 'Change y to i before -ful.', 3],
    ['care + ful', 'careful', 'Keep the e before a consonant suffix like -ful.', 2],
    ['refer + ed', 'referred', 'Stress on the last syllable (re-FER): double the r.', 4],
    ['prefer + ence', 'preference', 'The stress moves to the first syllable (PREF-er-ence), so do NOT double the r.', 5],
    ['travel + ing', 'travelling', 'In British English, a final l is doubled: travelling.', 4],
    ['commit + ment', 'commitment', '-ment starts with a consonant, so no doubling.', 4],
    ['argue + ment', 'argument', 'An exception: the e is dropped even though -ment starts with a consonant.', 5],
    ['notice + able', 'noticeable', 'Keep the e after a soft c so it still sounds like "s".', 5],
    ['change + able', 'changeable', 'Keep the e after a soft g so it still sounds like "j".', 5],
    ['swim + er', 'swimmer', 'Short vowel + single consonant: double the m.', 2],
    ['make + ing', 'making', 'Drop the final e.', 1],
    ['carry + ed', 'carried', 'Consonant + y: change y to i before -ed.', 2],
    ['enjoy + ment', 'enjoyment', 'Vowel + y: keep the y.', 3],
    ['forget + ful', 'forgetful', '-ful starts with a consonant: no doubling.', 3],
    ['forget + ing', 'forgetting', 'Stress on the last syllable (for-GET) + vowel suffix: double the t.', 4],
  ] as [string, string, string, number][]
).map(([sum, a, ex, lv]) => ({ q: `Join the word and suffix, using the spelling rules:\n${sum}`, accept: [a], hint: 'Does the suffix start with a vowel? Does the word end in -e, -y, or a short vowel + consonant?', ex: `${sum} = ${a}. ${ex}`, lv, placeholder: 'Type the new word' }))

const PREFIX_OPP: [string, string, number][] = [
  ['legal', 'il', 2],
  ['possible', 'im', 1],
  ['regular', 'ir', 2],
  ['responsible', 'ir', 3],
  ['patient', 'im', 2],
  ['mature', 'im', 3],
  ['literate', 'il', 4],
  ['logical', 'il', 3],
  ['appear', 'dis', 1],
  ['agree', 'dis', 1],
  ['happy', 'un', 1],
  ['correct', 'in', 2],
  ['visible', 'in', 2],
  ['honest', 'dis', 2],
  ['polite', 'im', 3],
  ['relevant', 'ir', 4],
  ['legible', 'il', 4],
  ['accurate', 'in', 3],
  ['obey', 'dis', 2],
  ['necessary', 'un', 3],
  ['satisfied', 'dis', 4],
]

const wordBuildingGenerators: ItemGenerator[] = [
  textGen('spelling.plurals', 'spelling.word-building', [1, 5], PLURALS),
  textGen('spelling.suffixes', 'spelling.word-building', [1, 5], SUFFIXES),
  G('spelling.negative-prefix', 'spelling.word-building', [1, 4], (rng, d) => {
    const pool = PREFIX_OPP.filter(([, , lv]) => Math.abs(lv - d) <= 1)
    const [w, p] = rng.pick(pool.length ? pool : PREFIX_OPP)
    const all = ['un', 'dis', 'in', 'im', 'il', 'ir']
    const word = p + w
    return choice({
      rng,
      prompt: `Which prefix makes the opposite of ${q(w)}?`,
      correct: `${p}- (${word})`,
      wrong: sample(
        rng,
        all.filter((x) => x !== p),
        3,
      ).map((x) => ({ label: `${x}- (${x}${w})`, misconception: 'wrong-negative-prefix', feedback: `"${x}${w}" is not a word.` })),
      hint: 'Before l use il-; before r use ir-; before m or p use im-. Otherwise try un-, dis- or in-.',
      explanation: `${w} → ${word}.` + (word === 'dissatisfied' || word === 'unnecessary' ? ' Keep both letters where the prefix meets the word: that is why there is a double letter.' : ' A prefix never changes the spelling of the root word.'),
    })
  }),
]

// =====================================================================================================
// Synonyms and antonyms (KS2 foundation)
// =====================================================================================================

const SYN: { w: string; syn: string; ant: string; other: string[]; lv: number }[] = [
  { w: 'happy', syn: 'cheerful', ant: 'miserable', other: ['hungry', 'careful'], lv: 1 },
  { w: 'big', syn: 'enormous', ant: 'tiny', other: ['noisy', 'ancient'], lv: 1 },
  { w: 'brave', syn: 'courageous', ant: 'cowardly', other: ['clumsy', 'polite'], lv: 2 },
  { w: 'difficult', syn: 'challenging', ant: 'easy', other: ['colourful', 'sleepy'], lv: 2 },
  { w: 'ancient', syn: 'very old', ant: 'modern', other: ['expensive', 'dusty'], lv: 2 },
  { w: 'quiet', syn: 'silent', ant: 'noisy', other: ['hungry', 'friendly'], lv: 1 },
  { w: 'angry', syn: 'furious', ant: 'calm', other: ['sleepy', 'clever'], lv: 2 },
  { w: 'generous', syn: 'giving', ant: 'selfish', other: ['tall', 'busy'], lv: 3 },
  { w: 'begin', syn: 'start', ant: 'finish', other: ['carry', 'shout'], lv: 1 },
  { w: 'wealthy', syn: 'rich', ant: 'poor', other: ['bored', 'tidy'], lv: 2 },
  { w: 'frightened', syn: 'scared', ant: 'fearless', other: ['tired', 'grumpy'], lv: 2 },
  { w: 'rapid', syn: 'fast', ant: 'slow', other: ['loud', 'heavy'], lv: 3 },
  { w: 'shout', syn: 'yell', ant: 'whisper', other: ['jump', 'stare'], lv: 2 },
  { w: 'clever', syn: 'intelligent', ant: 'foolish', other: ['strong', 'lazy'], lv: 3 },
  { w: 'filthy', syn: 'dirty', ant: 'clean', other: ['empty', 'sharp'], lv: 2 },
  { w: 'reluctant', syn: 'unwilling', ant: 'eager', other: ['unwell', 'unkind'], lv: 4 },
  { w: 'scarce', syn: 'rare', ant: 'plentiful', other: ['frightening', 'expensive'], lv: 4 },
  { w: 'transparent', syn: 'see-through', ant: 'opaque', other: ['shiny', 'fragile'], lv: 5 },
  { w: 'hostile', syn: 'unfriendly', ant: 'welcoming', other: ['unhealthy', 'untidy'], lv: 4 },
  { w: 'vague', syn: 'unclear', ant: 'precise', other: ['empty', 'boring'], lv: 5 },
]

const synonymGenerators: ItemGenerator[] = [
  G('synonyms.choose', 'vocab.synonyms-antonyms', [1, 5], (rng, d) => {
    const r = rng.pick(atLevel(SYN, d))
    const askSyn = rng.chance(0.5)
    return choice({
      rng,
      prompt: askSyn ? `Which word is a SYNONYM (similar meaning) of ${q(r.w)}?` : `Which word is an ANTONYM (opposite meaning) of ${q(r.w)}?`,
      correct: askSyn ? r.syn : r.ant,
      wrong: [
        { label: askSyn ? r.ant : r.syn, misconception: askSyn ? 'gave-antonym' : 'gave-synonym', feedback: askSyn ? `"${r.ant}" is the opposite: an antonym.` : `"${r.syn}" means the same: a synonym.` },
        ...r.other.map((o) => ({ label: o, feedback: `"${o}" is not related in meaning to "${r.w}".` })),
      ],
      hint: askSyn ? 'Synonym = same. Find the word you could swap in without changing the meaning.' : 'Antonym = opposite.',
      explanation: `${r.w}: synonym "${r.syn}", antonym "${r.ant}".`,
    })
  }),
  G('synonyms.match', 'vocab.synonyms-antonyms', [2, 4], (rng, d) => {
    const four = sample(rng, atLevel(SYN, d).length >= 4 ? atLevel(SYN, d) : SYN, 4)
    const anton = rng.chance(0.5)
    return matchItem({
      prompt: anton ? 'Match each word to its antonym (opposite).' : 'Match each word to its synonym (similar meaning).',
      pairs: four.map((r) => ({ left: r.w, right: anton ? r.ant : r.syn })),
      hint: 'Start with the pair you are surest of.',
      explanation: four.map((r) => `${r.w} → ${anton ? r.ant : r.syn}`).join(', '),
    })
  }),
]

// =====================================================================================================
// Prefixes and suffixes (meaning)
// =====================================================================================================

const PREFIX_MEANING: { p: string; m: string; eg: string; lv: number }[] = [
  { p: 'anti-', m: 'against', eg: 'antiseptic, antisocial', lv: 2 },
  { p: 'auto-', m: 'self', eg: 'autobiography, autograph', lv: 3 },
  { p: 'bi-', m: 'two', eg: 'bicycle, bilingual', lv: 1 },
  { p: 'circum-', m: 'around', eg: 'circumference, circumnavigate', lv: 4 },
  { p: 'inter-', m: 'between', eg: 'international, interval', lv: 3 },
  { p: 'micro-', m: 'very small', eg: 'microscope, microchip', lv: 2 },
  { p: 'mis-', m: 'wrongly', eg: 'misbehave, misunderstand', lv: 2 },
  { p: 'multi-', m: 'many', eg: 'multicoloured, multiply', lv: 2 },
  { p: 'post-', m: 'after', eg: 'postpone, post-war', lv: 3 },
  { p: 'pre-', m: 'before', eg: 'preview, prehistoric', lv: 1 },
  { p: 're-', m: 'again or back', eg: 'rewrite, return', lv: 1 },
  { p: 'sub-', m: 'under', eg: 'submarine, subway', lv: 2 },
  { p: 'super-', m: 'above or beyond', eg: 'superhuman, supersonic', lv: 3 },
  { p: 'trans-', m: 'across', eg: 'transport, transatlantic', lv: 3 },
  { p: 'tri-', m: 'three', eg: 'triangle, tricycle', lv: 1 },
  { p: 'mono-', m: 'one', eg: 'monorail, monologue', lv: 3 },
  { p: 'semi-', m: 'half', eg: 'semicircle, semi-final', lv: 2 },
  { p: 'ex-', m: 'out of, or former', eg: 'exit, ex-champion', lv: 4 },
  { p: '-less', m: 'without', eg: 'hopeless, fearless', lv: 2 },
  { p: '-ful', m: 'full of', eg: 'joyful, hopeful', lv: 1 },
  { p: '-able', m: 'able to be', eg: 'washable, readable', lv: 3 },
  { p: '-ology', m: 'the study of', eg: 'biology, geology', lv: 4 },
  { p: '-phobia', m: 'fear of', eg: 'arachnophobia, claustrophobia', lv: 5 },
]

const SUFFIX_CLASS: { base: string; word: string; cls: string; lv: number }[] = [
  { base: 'kind', word: 'kindness', cls: 'noun', lv: 2 },
  { base: 'enjoy', word: 'enjoyment', cls: 'noun', lv: 2 },
  { base: 'educate', word: 'education', cls: 'noun', lv: 3 },
  { base: 'stupid', word: 'stupidity', cls: 'noun', lv: 3 },
  { base: 'friend', word: 'friendship', cls: 'noun', lv: 3 },
  { base: 'hope', word: 'hopeful', cls: 'adjective', lv: 2 },
  { base: 'fear', word: 'fearless', cls: 'adjective', lv: 2 },
  { base: 'danger', word: 'dangerous', cls: 'adjective', lv: 2 },
  { base: 'wash', word: 'washable', cls: 'adjective', lv: 3 },
  { base: 'act', word: 'active', cls: 'adjective', lv: 4 },
  { base: 'quick', word: 'quickly', cls: 'adverb', lv: 1 },
  { base: 'modern', word: 'modernise', cls: 'verb', lv: 3 },
  { base: 'pure', word: 'purify', cls: 'verb', lv: 4 },
  { base: 'dark', word: 'darken', cls: 'verb', lv: 4 },
  { base: 'critic', word: 'criticise', cls: 'verb', lv: 5 },
  { base: 'simple', word: 'simplify', cls: 'verb', lv: 5 },
]

const BUILD_PREFIX: MC[] = [
  { q: 'Which prefix would you add to "marine" to mean "under the sea"?', a: 'sub-', w: ['super-', 'trans-', 'pre-'], hint: 'Which prefix means "under"?', ex: 'sub- means under: submarine.', lv: 2 },
  { q: 'Which prefix would you add to "heat" to mean "heat again"?', a: 're-', w: ['pre-', 'mis-', 'anti-'], hint: 'Which prefix means "again"?', ex: 're- means again: reheat.', lv: 1 },
  { q: 'Which prefix would you add to "national" to mean "between nations"?', a: 'inter-', w: ['trans-', 'sub-', 'multi-'], hint: 'Which prefix means "between"?', ex: 'inter- means between: international.', lv: 3 },
  { q: 'Which prefix would you add to "historic" to mean "before written history"?', a: 'pre-', w: ['post-', 're-', 'anti-'], hint: 'Which prefix means "before"?', ex: 'pre- means before: prehistoric.', lv: 2 },
  { q: 'Which prefix would you add to "understand" to mean "understand wrongly"?', a: 'mis-', w: ['dis-', 're-', 'sub-'], hint: 'Which prefix means "wrongly"?', ex: 'mis- means wrongly: misunderstand.', lv: 2 },
  { q: 'Which prefix would you add to "atlantic" to mean "across the Atlantic"?', a: 'trans-', w: ['inter-', 'sub-', 'circum-'], hint: 'Which prefix means "across"?', ex: 'trans- means across: transatlantic.', lv: 3 },
  { q: 'Which prefix would you add to "biography" to mean "a life story written by the person themselves"?', a: 'auto-', w: ['bi-', 'mono-', 'micro-'], hint: 'Which prefix means "self"?', ex: 'auto- means self: autobiography.', lv: 4 },
  { q: 'Which prefix would you add to "navigate" to mean "sail all the way around"?', a: 'circum-', w: ['trans-', 'inter-', 'super-'], hint: 'Which prefix means "around"? Think of circumference.', ex: 'circum- means around: circumnavigate.', lv: 5 },
  { q: 'Which prefix would you add to "pone" to mean "put off until after"?', a: 'post-', w: ['pre-', 're-', 'ex-'], hint: 'Which prefix means "after"?', ex: 'post- means after: postpone.', lv: 4 },
]

const prefixGenerators: ItemGenerator[] = [
  G('prefixes.meaning', 'vocab.prefixes-suffixes', [1, 5], (rng, d) => {
    const r = rng.pick(atLevel(PREFIX_MEANING, d))
    const kind = r.p.startsWith('-') ? 'suffix' : 'prefix'
    return choice({
      rng,
      prompt: `What does the ${kind} ${q(r.p)} mean in words like ${r.eg}?`,
      correct: r.m,
      wrong: sample(
        rng,
        PREFIX_MEANING.filter((x) => x.m !== r.m),
        3,
      ).map((x) => ({ label: x.m, misconception: 'wrong-affix', feedback: `"${x.m}" is the meaning of ${x.p} (${x.eg}).` })),
      hint: `Think about what the example words ${r.eg} have in common.`,
      explanation: `${r.p} means "${r.m}": ${r.eg}.`,
    })
  }),
  pairMatchGen(
    'prefixes.match',
    'vocab.prefixes-suffixes',
    [2, 4],
    PREFIX_MEANING.map((r): Pair => ({ left: r.p, right: r.m, lv: r.lv })),
    'Match each prefix or suffix to its meaning.',
    'Think of a word you know that uses each one.',
  ),
  G('suffixes.class', 'vocab.prefixes-suffixes', [2, 5], (rng, d) => {
    const r = rng.pick(atLevel(SUFFIX_CLASS, d))
    const info: Record<string, string> = { noun: 'Suffixes like -ness, -ment, -tion, -ity and -ship make nouns.', adjective: 'Suffixes like -ful, -less, -ous, -able and -ive make adjectives.', adverb: '-ly often makes adverbs from adjectives.', verb: 'Suffixes like -ise, -ify and -en make verbs.' }
    return choice({
      rng,
      prompt: `Adding a suffix turns ${q(r.base)} into ${q(r.word)}. What word class is ${q(r.word)}?`,
      correct: r.cls,
      wrong: ['noun', 'adjective', 'adverb', 'verb'].filter((x) => x !== r.cls).map((x) => ({ label: x, feedback: info[x] })),
      keepOrder: true,
      hint: 'Try it in a sentence: "the ___" (noun), "a very ___ thing" (adjective), "to ___" (verb).',
      explanation: `"${r.word}" is a${r.cls === 'adjective' || r.cls === 'adverb' ? 'n' : ''} ${r.cls}. ${info[r.cls]}`,
    })
  }),
  bankGen('prefixes.build', 'vocab.prefixes-suffixes', [1, 5], BUILD_PREFIX),
]

// =====================================================================================================
// Roots
// =====================================================================================================

const ROOTS: { r: string; m: string; eg: string; lv: number }[] = [
  { r: 'bio', m: 'life', eg: 'biology, biography', lv: 2 },
  { r: 'graph', m: 'writing or drawing', eg: 'autograph, paragraph', lv: 2 },
  { r: 'geo', m: 'earth', eg: 'geography, geology', lv: 2 },
  { r: 'tele', m: 'far, at a distance', eg: 'telephone, telescope', lv: 2 },
  { r: 'phon', m: 'sound', eg: 'microphone, symphony', lv: 3 },
  { r: 'photo', m: 'light', eg: 'photograph, photosynthesis', lv: 3 },
  { r: 'port', m: 'carry', eg: 'transport, portable', lv: 3 },
  { r: 'dict', m: 'say or speak', eg: 'dictionary, predict', lv: 3 },
  { r: 'aud', m: 'hear', eg: 'audience, audible', lv: 3 },
  { r: 'vis', m: 'see', eg: 'visible, vision', lv: 2 },
  { r: 'chron', m: 'time', eg: 'chronological, chronicle', lv: 4 },
  { r: 'therm', m: 'heat', eg: 'thermometer, thermal', lv: 3 },
  { r: 'hydr', m: 'water', eg: 'hydrate, hydroelectric', lv: 4 },
  { r: 'manu', m: 'hand', eg: 'manual, manuscript', lv: 4 },
  { r: 'struct', m: 'build', eg: 'construct, structure', lv: 4 },
  { r: 'rupt', m: 'break', eg: 'erupt, interrupt', lv: 4 },
  { r: 'ject', m: 'throw', eg: 'eject, project', lv: 5 },
  { r: 'mort', m: 'death', eg: 'mortal, mortuary', lv: 5 },
  { r: 'cred', m: 'believe', eg: 'credible, incredible', lv: 5 },
  { r: 'bene', m: 'good or well', eg: 'benefit, benevolent', lv: 5 },
  { r: 'cent', m: 'hundred', eg: 'century, centimetre', lv: 2 },
]

const ROOT_WORDS: MC[] = [
  { q: 'Use the root "aud" (hear) and the prefix "in-" (not) to work out what "inaudible" means.', a: 'impossible to hear', w: ['impossible to see', 'very loud', 'not allowed to speak'], hint: 'aud = hear; in- = not; -ible = able to be.', ex: 'in (not) + aud (hear) + ible (able to be) = not able to be heard.', lv: 3 },
  { q: 'Use the root "chron" (time) to work out what a "chronometer" is.', a: 'an instrument for measuring time accurately', w: ['an instrument for measuring heat', 'a long story', 'a map of the stars'], hint: 'chron = time; meter = measure.', ex: 'chron (time) + meter (measure) = an accurate timekeeper.', lv: 4 },
  { q: 'Use the roots "geo" (earth) and "therm" (heat) to work out what "geothermal" energy is.', a: 'heat energy from inside the Earth', w: ['energy from the sun', 'energy from water', 'electricity from wind'], hint: 'Put the two roots together.', ex: 'geo (earth) + therm (heat): heat from inside the Earth.', lv: 4 },
  { q: 'Use the root "manu" (hand) and "script" (written) to work out what a "manuscript" is.', a: 'a document written by hand', w: ['a printed newspaper', 'a set of instructions for a machine', 'a play performed by puppets'], hint: 'manu = hand.', ex: 'manu (hand) + script (written): originally a document written by hand.', lv: 4 },
  { q: 'Use the root "mort" (death) to work out what "immortal" means.', a: 'living forever; unable to die', w: ['very old', 'dangerous', 'invisible'], hint: 'im- = not; mort = death.', ex: 'im (not) + mort (death) + al: not subject to death.', lv: 4 },
  { q: 'Use the root "port" (carry) to work out what "portable" means.', a: 'able to be carried', w: ['able to be opened', 'connected to a harbour', 'very heavy'], hint: '-able = able to be.', ex: 'port (carry) + able: able to be carried.', lv: 2 },
  { q: 'Use the root "cred" (believe) to work out what "incredulous" means.', a: 'unwilling or unable to believe something', w: ['very generous', 'easily fooled', 'full of energy'], hint: 'in- = not; cred = believe.', ex: 'in (not) + cred (believe): not believing.', lv: 5 },
  { q: 'Use the root "bene" (good) to work out what a "benefactor" is.', a: 'someone who helps others, often by giving money', w: ['someone who breaks the law', 'a type of factory', 'someone who builds bridges'], hint: 'bene = good; -factor = one who does.', ex: 'bene (good) + factor (doer): someone who does good for others.', lv: 5 },
  { q: 'Use the root "rupt" (break) to work out what "interrupt" means.', a: 'break in on someone who is speaking or doing something', w: ['repair something carefully', 'agree with someone', 'travel between countries'], hint: 'inter = between; rupt = break.', ex: 'inter (between) + rupt (break): to break in between.', lv: 3 },
  { q: 'Use the root "ject" (throw) to work out what "eject" means.', a: 'throw or force out', w: ['pull in', 'build up', 'look closely at'], hint: 'e- (ex) = out.', ex: 'e (out) + ject (throw): to throw out.', lv: 4 },
]

const rootGenerators: ItemGenerator[] = [
  G('roots.meaning', 'vocab.roots', [1, 5], (rng, d) => {
    const r = rng.pick(atLevel(ROOTS, d))
    return choice({
      rng,
      prompt: `The root ${q(r.r)} appears in ${r.eg}. What does it mean?`,
      correct: r.m,
      wrong: sample(
        rng,
        ROOTS.filter((x) => x.m !== r.m),
        3,
      ).map((x) => ({ label: x.m, misconception: 'wrong-root', feedback: `"${x.m}" is the meaning of the root ${x.r} (${x.eg}).` })),
      hint: `What do ${r.eg} have in common?`,
      explanation: `${r.r} = ${r.m}, as in ${r.eg}.`,
    })
  }),
  pairMatchGen(
    'roots.match',
    'vocab.roots',
    [2, 4],
    ROOTS.map((r): Pair => ({ left: r.r, right: r.m, lv: r.lv })),
    'Match each root to its meaning.',
    'Think of an everyday word built from each root.',
  ),
  bankGen('roots.work-out', 'vocab.roots', [2, 5], ROOT_WORDS),
]

// =====================================================================================================
// Connotations
// =====================================================================================================

const CONN: { pos: string; neg: string; meaning: string; person: boolean; lv: number }[] = [
  { pos: 'slim', neg: 'skinny', meaning: 'thin', person: true, lv: 1 },
  { pos: 'determined', neg: 'stubborn', meaning: 'unwilling to give up or change their mind', person: true, lv: 2 },
  { pos: 'confident', neg: 'arrogant', meaning: 'sure of themselves', person: true, lv: 2 },
  { pos: 'curious', neg: 'nosy', meaning: 'interested in finding things out', person: true, lv: 2 },
  { pos: 'thrifty', neg: 'stingy', meaning: 'careful about spending money', person: true, lv: 3 },
  { pos: 'relaxed', neg: 'lazy', meaning: 'never in a hurry to work', person: true, lv: 2 },
  { pos: 'youthful', neg: 'childish', meaning: 'young in the way they behave', person: true, lv: 3 },
  { pos: 'assertive', neg: 'bossy', meaning: 'quick to tell others what they want', person: true, lv: 4 },
  { pos: 'aroma', neg: 'stench', meaning: 'a strong smell', person: false, lv: 2 },
  { pos: 'famous', neg: 'notorious', meaning: 'well known', person: true, lv: 4 },
  { pos: 'cautious', neg: 'cowardly', meaning: 'unwilling to take risks', person: true, lv: 3 },
  { pos: 'chuckle', neg: 'snigger', meaning: 'a quiet laugh', person: false, lv: 3 },
  { pos: 'unique', neg: 'weird', meaning: 'unlike anyone else', person: true, lv: 3 },
  { pos: 'fragrance', neg: 'odour', meaning: 'a smell', person: false, lv: 4 },
  { pos: 'inquisitive', neg: 'prying', meaning: 'keen to know about other people\'s business', person: true, lv: 5 },
  { pos: 'frank', neg: 'blunt', meaning: 'honest about exactly what they think', person: true, lv: 5 },
]
const PEOPLE = CONN.filter((c) => c.person)

const connotationGenerators: ItemGenerator[] = [
  G('connotations.pair', 'vocab.connotations', [1, 3], (rng, d) => {
    const r = rng.pick(atLevel(CONN, d))
    const wantPos = rng.chance(0.5)
    const intro = r.person ? `Both words could describe someone who is ${r.meaning}.` : `Both words can mean ${r.meaning}.`
    return choice({
      rng,
      prompt: `${intro} Which one sounds ${wantPos ? 'APPROVING (positive)' : 'CRITICAL (negative)'}?`,
      correct: wantPos ? r.pos : r.neg,
      wrong: [{ label: wantPos ? r.neg : r.pos, misconception: 'connotation-flip', feedback: `"${wantPos ? r.neg : r.pos}" has ${wantPos ? 'negative' : 'positive'} connotations.` }],
      hint: 'Imagine someone saying it about you (or your cooking). Would you feel flattered or insulted?',
      explanation: `"${r.pos}" has positive connotations; "${r.neg}" has negative ones, even though their basic meaning is similar.`,
    })
  }),
  G('connotations.odd-one', 'vocab.connotations', [2, 5], (rng, d) => {
    const r = rng.pick(atLevel(CONN, d))
    const wantNeg = rng.chance(0.5)
    const others = sample(
      rng,
      CONN.filter((x) => x !== r),
      3,
    )
    return choice({
      rng,
      prompt: `Which of these words has ${wantNeg ? 'NEGATIVE' : 'POSITIVE'} connotations?`,
      correct: wantNeg ? r.neg : r.pos,
      wrong: others.map((x) => ({ label: wantNeg ? x.pos : x.neg, feedback: `"${wantNeg ? x.pos : x.neg}" has ${wantNeg ? 'positive' : 'negative'} connotations (compare "${wantNeg ? x.neg : x.pos}").` })),
      hint: 'Connotations are the feelings a word carries, beyond its dictionary meaning.',
      explanation: `"${wantNeg ? r.neg : r.pos}" carries ${wantNeg ? 'negative' : 'positive'} feelings. Compare "${wantNeg ? r.pos : r.neg}", which means something similar.`,
    })
  }),
  G('connotations.writer-choice', 'vocab.connotations', [3, 5], (rng, d) => {
    const r = rng.pick(atLevel(PEOPLE, d))
    const admire = rng.chance(0.5)
    const other = rng.pick(PEOPLE.filter((x) => x !== r))
    return choice({
      rng,
      prompt: `A writer wants readers to ${admire ? 'ADMIRE' : 'DISLIKE'} a character who is ${r.meaning}. Which word should they choose?`,
      correct: admire ? r.pos : r.neg,
      wrong: [
        { label: admire ? r.neg : r.pos, misconception: 'connotation-flip', feedback: `"${admire ? r.neg : r.pos}" would make readers ${admire ? 'dislike' : 'admire'} the character.` },
        { label: admire ? other.pos : other.neg, feedback: `"${admire ? other.pos : other.neg}" has a different meaning (${other.meaning}).` },
      ],
      hint: 'The meaning must fit AND the feeling must fit.',
      explanation: `"${admire ? r.pos : r.neg}" means ${r.meaning} and carries ${admire ? 'positive' : 'negative'} connotations.`,
    })
  }),
]

// =====================================================================================================
// Words in context
// =====================================================================================================

const CONTEXT: MC[] = [
  { q: 'After walking all day without food, the famished hikers devoured every crumb.\nWhat does "famished" mean?', a: 'extremely hungry', w: ['very tired', 'extremely angry', 'completely lost'], hint: 'Look at "without food" and "devoured every crumb".', ex: '"Without food" and "devoured" show that famished means extremely hungry.', lv: 2 },
  { q: 'The usually chatty boy was unusually taciturn at dinner, barely saying a word.\nWhat does "taciturn" mean?', a: 'quiet; saying very little', w: ['hungry', 'rude', 'excited'], hint: '"Barely saying a word" is the clue.', ex: 'Taciturn means saying very little, as the contrast with "chatty" shows.', lv: 4 },
  { q: 'The ancient manuscript was so fragile that it crumbled when touched.\nWhat does "fragile" mean?', a: 'easily broken or damaged', w: ['very valuable', 'very heavy', 'brightly coloured'], hint: 'What happened when it was touched?', ex: 'It "crumbled when touched", so fragile means easily damaged.', lv: 2 },
  { q: 'Despite the storm, the sailors were undeterred and set out to sea.\nWhat does "undeterred" mean?', a: 'not put off', w: ['frightened', 'unprepared', 'delayed'], hint: '"Despite the storm" they still set out.', ex: 'They set out anyway, so undeterred means not put off.', lv: 3 },
  { q: 'The kitchen was immaculate: every surface gleamed and not a crumb was in sight.\nWhat does "immaculate" mean?', a: 'perfectly clean', w: ['very messy', 'very small', 'very modern'], hint: 'What follows the colon explains the word.', ex: '"Every surface gleamed... not a crumb" shows immaculate means perfectly clean.', lv: 3 },
  { q: 'Her explanation was so lucid that even the youngest pupils understood it.\nWhat does "lucid" mean?', a: 'clear and easy to understand', w: ['very long', 'confusing', 'quiet'], hint: 'Even the youngest understood it.', ex: 'Lucid means clear and easy to understand.', lv: 4 },
  { q: "The candle's feeble flame flickered and almost went out.\nWhat does \"feeble\" mean?", a: 'weak', w: ['bright', 'hot', 'tall'], hint: 'It almost went out.', ex: 'A flame that almost goes out is weak: feeble.', lv: 2 },
  { q: 'The mountain path was treacherous, with loose rocks and sudden drops.\nWhat does "treacherous" mean here?', a: 'dangerous', w: ['crowded', 'well kept', 'flat'], hint: 'Loose rocks, sudden drops...', ex: 'Loose rocks and sudden drops make the path dangerous: treacherous.', lv: 3 },
  { q: 'The teacher was exasperated when the class ignored her for the third time.\nWhat does "exasperated" mean?', a: 'very annoyed and frustrated', w: ['delighted', 'confused', 'bored'], hint: 'How would you feel the third time?', ex: 'Being ignored three times would leave her exasperated: very annoyed.', lv: 3 },
  { q: 'The meagre portion of soup was barely enough to fill a teacup.\nWhat does "meagre" mean?', a: 'small and not enough', w: ['delicious', 'very hot', 'generous'], hint: '"Barely enough" is the clue.', ex: 'Meagre means small or inadequate.', lv: 3 },
  { q: 'The crowd was jubilant when the team scored the winning goal.\nWhat does "jubilant" mean?', a: 'joyful and celebrating', w: ['silent', 'angry', 'disappointed'], hint: 'How do fans feel at a winning goal?', ex: 'Jubilant means full of joy and triumph.', lv: 2 },
  { q: 'Scrooge was so parsimonious that he would not pay for more than a tiny fire.\nWhat does "parsimonious" mean?', a: 'extremely unwilling to spend money', w: ['lazy', 'forgetful', 'poor'], hint: 'He COULD pay, but would not.', ex: 'Parsimonious means extremely mean with money. Scrooge is rich, so "poor" does not fit.', lv: 5 },
  { q: 'The vast desert stretched in every direction as far as the eye could see.\nWhat does "vast" mean?', a: 'huge', w: ['dangerous', 'ancient', 'tiny'], hint: '"As far as the eye could see".', ex: 'Vast means extremely large.', lv: 1 },
  { q: 'Her reply was terse: just one word, "No."\nWhat does "terse" mean?', a: 'brief and abrupt', w: ['polite', 'loud', 'confusing'], hint: 'Just one word.', ex: 'Terse means using very few words, often abruptly.', lv: 4 },
  { q: 'Ominous clouds gathered over the hills, warning of a storm.\nWhat does "ominous" mean?', a: 'threatening; suggesting something bad will happen', w: ['fluffy and white', 'beautiful', 'far away'], hint: '"Warning of a storm".', ex: 'Ominous means suggesting that something bad is coming.', lv: 3 },
  { q: 'The village was desolate: every house was empty and the streets were silent.\nWhat does "desolate" mean?', a: 'empty and bleak', w: ['busy', 'cheerful', 'modern'], hint: 'Empty houses, silent streets.', ex: 'Desolate means deserted and bleak.', lv: 4 },
  { q: 'The detective scrutinised the letter, examining every mark with a magnifying glass.\nWhat does "scrutinised" mean?', a: 'examined very closely', w: ['threw away', 'wrote quickly', 'read aloud'], hint: 'Magnifying glass...', ex: 'To scrutinise is to examine very carefully.', lv: 4 },
  { q: 'Although the puppy looked docile, it suddenly leapt up and bit the postman.\nWhat does "docile" mean?', a: 'calm and gentle', w: ['fierce', 'hungry', 'dirty'], hint: '"Although" signals a contrast with what happened.', ex: '"Although" shows a contrast: it LOOKED gentle (docile) but then bit someone.', lv: 5 },
]

export const vocabularyGenerators: ItemGenerator[] = [
  ...homophoneGenerators,
  ...wordBuildingGenerators,
  ...synonymGenerators,
  ...prefixGenerators,
  ...rootGenerators,
  ...connotationGenerators,
  bankGen('context.meaning', 'vocab.context', [1, 5], CONTEXT),
]
