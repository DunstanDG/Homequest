/** Sounds and spelling: the alphabet, vowels and umlauts, consonants, and spelling rules (capitals, ß / ss, compounds). */
import type { ItemGenerator } from '@/engine/registry'
import type { Rng } from '@/engine/types'
import { choice, textItem } from '../../kit'
import { G, accepts, fixedChoice, keyboardTip, pickN, q, type Gender, type Wrong } from './lib'

// ------------------------------------------------------------------ alphabet

const LETTERS: Record<string, string> = {
  A: 'ah', B: 'beh', C: 'tseh', D: 'deh', E: 'eh', F: 'eff', G: 'geh', H: 'hah', I: 'ih', J: 'jott', K: 'kah', L: 'ell', M: 'emm',
  N: 'enn', O: 'oh', P: 'peh', Q: 'kuh', R: 'err', S: 'ess', T: 'teh', U: 'uh', V: 'fau', W: 'weh', X: 'iks', Y: 'üpsilon', Z: 'tsett',
  Ä: 'ä (a-Umlaut)', Ö: 'ö (o-Umlaut)', Ü: 'ü (u-Umlaut)', ß: 'eszett',
}

/** Letters that English speakers mix up, with the reason. */
const CONFUSE: Record<string, { with: string; why: string }[]> = {
  E: [{ with: 'I', why: '"ih" is the German I; "eh" is E.' }, { with: 'A', why: '"ah" is the German A; "eh" is E.' }],
  I: [{ with: 'E', why: '"eh" is the German E; "ih" is I.' }, { with: 'Y', why: 'Y is "üpsilon".' }],
  A: [{ with: 'E', why: '"eh" is E; "ah" is A.' }, { with: 'H', why: 'H is "hah".' }],
  G: [{ with: 'J', why: '"jott" is J; "geh" is G.' }, { with: 'K', why: 'K is "kah".' }],
  J: [{ with: 'G', why: '"geh" is G; "jott" is J.' }, { with: 'Y', why: 'Y is "üpsilon"; J is "jott".' }],
  V: [{ with: 'F', why: '"eff" is F; "fau" is V.' }, { with: 'W', why: '"weh" is W; "fau" is V.' }],
  W: [{ with: 'V', why: '"fau" is V; "weh" is W.' }, { with: 'U', why: 'U is "uh".' }],
  Z: [{ with: 'C', why: '"tseh" is C; "tsett" is Z.' }, { with: 'S', why: 'S is "ess".' }],
  C: [{ with: 'Z', why: '"tsett" is Z; "tseh" is C.' }, { with: 'K', why: 'K is "kah".' }],
  Y: [{ with: 'J', why: 'J is "jott"; Y is "üpsilon".' }, { with: 'Ü', why: 'Ü is "ü"; Y is "üpsilon".' }],
  H: [{ with: 'A', why: 'A is "ah"; H is "hah".' }, { with: 'K', why: 'K is "kah".' }],
  K: [{ with: 'Q', why: 'Q is "kuh"; K is "kah".' }, { with: 'C', why: 'C is "tseh".' }],
  Q: [{ with: 'K', why: 'K is "kah"; Q is "kuh".' }, { with: 'U', why: 'U is "uh".' }],
  U: [{ with: 'Q', why: 'Q is "kuh"; U is "uh".' }, { with: 'W', why: 'W is "weh".' }],
  ß: [{ with: 'B', why: 'ß looks a bit like B, but it is "eszett", a sharp s sound.' }, { with: 'S', why: 'S is "ess".' }],
}
const TRICKY = Object.keys(CONFUSE)

const SPELL_WORDS: { de: string; en: string }[] = [
  { de: 'Wien', en: 'Vienna' },
  { de: 'Vater', en: 'father' },
  { de: 'Wasser', en: 'water' },
  { de: 'Junge', en: 'boy' },
  { de: 'Zeit', en: 'time' },
  { de: 'Vogel', en: 'bird' },
  { de: 'Biene', en: 'bee' },
  { de: 'Spiel', en: 'game' },
  { de: 'Jacke', en: 'jacket' },
  { de: 'Geige', en: 'violin' },
  { de: 'Igel', en: 'hedgehog' },
  { de: 'Wolke', en: 'cloud' },
  { de: 'Juli', en: 'July' },
  { de: 'Zucker', en: 'sugar' },
  { de: 'Hexe', en: 'witch' },
  { de: 'Käse', en: 'cheese' },
  { de: 'Tür', en: 'door' },
  { de: 'Straße', en: 'street' },
  { de: 'Yoga', en: 'yoga' },
  { de: 'Quiz', en: 'quiz' },
]

const spellOut = (w: string) =>
  [...w].map((ch) => (LETTERS[ch.toUpperCase()] ?? LETTERS[ch] ?? ch).replace(/ \(.*\)$/, '')).join(' - ')

/** Misspellings made by swapping one confusable letter (keeps the case of the first letter). The most likely slips
 * (ei / ie, a missing umlaut, the first confusion listed for a letter) come first. */
function confusedSpellings(w: string): { likely: string[]; other: string[] } {
  const likely: string[] = []
  const other: string[] = []
  if (w.includes('ie')) likely.push(w.replace('ie', 'ei'))
  if (w.includes('ei')) likely.push(w.replace('ei', 'ie'))
  if (/[äöü]/.test(w)) likely.push(w.replace('ä', 'a').replace('ö', 'o').replace('ü', 'u'))
  ;[...w].forEach((ch, i) => {
    const up = ch.toUpperCase()
    ;(CONFUSE[up] ?? []).forEach((c, k) => {
      if (!/^[A-ZÄÖÜ]$/.test(c.with)) return
      const rep = i === 0 ? c.with : c.with.toLowerCase()
      ;(k === 0 ? likely : other).push(w.slice(0, i) + rep + w.slice(i + 1))
    })
  })
  const ok = (x: string) => x !== w && x.toLowerCase() !== w.toLowerCase()
  return { likely: [...new Set(likely)].filter(ok), other: [...new Set(other)].filter(ok) }
}

const alphabetGens: ItemGenerator[] = [
  G('top.abc.name', 'sounds.alphabet', [1, 3], (rng, d) => {
    const letter = d <= 1 ? rng.pick(['E', 'I', 'J', 'V', 'W', 'Z', 'A', 'G']) : rng.pick(TRICKY)
    const conf = CONFUSE[letter] ?? []
    const extra = pickN(rng, Object.keys(LETTERS).filter((l) => l !== letter && !conf.some((c) => c.with === l) && l.length === 1 && /[A-Z]/.test(l)), 3)
    const wrong: Wrong[] = [...conf.map((c) => ({ label: c.with, misconception: 'letter-name', feedback: c.why })), ...extra].slice(0, 3)
    return choice({
      rng,
      prompt: `Which letter is called ${q(LETTERS[letter] as string)} in German?`,
      correct: letter,
      wrong,
      hint: 'Say the name out loud. Watch out: some sound like a different English letter.',
      explanation: `${q(LETTERS[letter] as string)} is ${letter}. Easy ones to mix up: E = eh, I = ih, J = jott, G = geh, V = fau, W = weh, Z = tsett, Y = üpsilon.`,
    })
  }),

  G('top.abc.say', 'sounds.alphabet', [2, 3], (rng) => {
    const letter = rng.pick(TRICKY)
    const conf = CONFUSE[letter] ?? []
    const wrong: Wrong[] = conf.map((c) => ({ label: LETTERS[c.with] as string, misconception: 'letter-name', feedback: `That is ${c.with}. ${c.why}` }))
    wrong.push(LETTERS[rng.pick(['B', 'L', 'M', 'O', 'R', 'T'])] as string)
    return choice({
      rng,
      prompt: `How do you say the letter ${letter} in German?`,
      correct: LETTERS[letter] as string,
      wrong,
      hint: 'Some German letter names sound like a different English letter.',
      explanation: `${letter} is ${q(LETTERS[letter] as string)}. ${conf.map((c) => c.why).join(' ')}`,
    })
  }),

  G('top.abc.spell', 'sounds.alphabet', [2, 4], (rng) => {
    const w = rng.pick(SPELL_WORDS)
    const { likely, other } = confusedSpellings(w.de)
    const wrongs = [...pickN(rng, likely, 3), ...pickN(rng, other, 3)]
    const sameLength = SPELL_WORDS.filter((x) => x !== w && x.de.length === w.de.length)
    const rest = pickN(rng, sameLength.length ? sameLength : SPELL_WORDS.filter((x) => x !== w), 3).map((x) => x.de)
    return choice({
      rng,
      prompt: `Someone spells a word for you: ${q(spellOut(w.de))}. Which word is it?`,
      correct: w.de,
      wrong: [...wrongs, ...rest].slice(0, 3),
      hint: 'Write each letter down as you hear it: ih = I, eh = E, jott = J, fau = V, weh = W.',
      explanation: `${spellOut(w.de)} spells ${w.de} (${w.en}).`,
    })
  }),

  G('top.abc.type', 'sounds.alphabet', [3, 5], (rng) => {
    const w = rng.pick(SPELL_WORDS)
    return textItem({
      prompt: `Someone spells a word for you: ${q(spellOut(w.de))}. Type the word.`,
      accept: accepts(w.de),
      placeholder: 'Type the word',
      hint: 'Take each letter name in turn. ih = I, eh = E, jott = J, fau = V, weh = W, tsett = Z, eszett = ß.',
      explanation: `${spellOut(w.de)} spells ${w.de} (${w.en}).${keyboardTip(w.de)}`,
    })
  }),
]

// ------------------------------------------------------------------ vowels and umlauts

interface VowelRule {
  key: string
  sound: string
  words: { de: string; en: string }[]
}
const VOWELS: VowelRule[] = [
  { key: 'ei', sound: 'like English "eye"', words: [{ de: 'drei', en: 'three' }, { de: 'mein', en: 'my' }, { de: 'Eis', en: 'ice cream' }, { de: 'Zeit', en: 'time' }, { de: 'klein', en: 'small' }, { de: 'weiß', en: 'white' }] },
  { key: 'ie', sound: 'like English "ee" (as in "see")', words: [{ de: 'sieben', en: 'seven' }, { de: 'vier', en: 'four' }, { de: 'Brief', en: 'letter' }, { de: 'spielen', en: 'to play' }, { de: 'Biene', en: 'bee' }, { de: 'Lied', en: 'song' }] },
  { key: 'au', sound: 'like "ow" (as in "cow")', words: [{ de: 'Haus', en: 'house' }, { de: 'blau', en: 'blue' }, { de: 'Maus', en: 'mouse' }, { de: 'Bauch', en: 'stomach' }, { de: 'kaufen', en: 'to buy' }, { de: 'Frau', en: 'woman' }] },
  { key: 'eu', sound: 'like "oy" (as in "boy")', words: [{ de: 'neun', en: 'nine' }, { de: 'Freund', en: 'friend' }, { de: 'heute', en: 'today' }, { de: 'teuer', en: 'expensive' }, { de: 'Leute', en: 'people' }] },
  { key: 'äu', sound: 'like "oy" (as in "boy")', words: [{ de: 'Häuser', en: 'houses' }, { de: 'Bäume', en: 'trees' }, { de: 'Mäuse', en: 'mice' }] },
]
const SOUND_OPTIONS = ['like English "eye"', 'like English "ee" (as in "see")', 'like "ow" (as in "cow")', 'like "oy" (as in "boy")']
const VOWEL_RULE = 'ei sounds like "eye" (drei), ie like "ee" (vier): say the SECOND letter. au = "ow" (Haus); eu and äu = "oy" (neun, Häuser).'

/** Word pairs where only the umlaut changes the meaning. */
const UMLAUT_PAIRS: { a: string; aEn: string; b: string; bEn: string }[] = [
  { a: 'schon', aEn: 'already', b: 'schön', bEn: 'beautiful' },
  { a: 'Mutter', aEn: 'mother', b: 'Mütter', bEn: 'mothers' },
  { a: 'Bruder', aEn: 'brother', b: 'Brüder', bEn: 'brothers' },
  { a: 'zahlen', aEn: 'to pay', b: 'zählen', bEn: 'to count' },
  { a: 'Apfel', aEn: 'apple', b: 'Äpfel', bEn: 'apples' },
  { a: 'Vogel', aEn: 'bird', b: 'Vögel', bEn: 'birds' },
  { a: 'Tochter', aEn: 'daughter', b: 'Töchter', bEn: 'daughters' },
  { a: 'warm', aEn: 'warm', b: 'wärmer', bEn: 'warmer' },
  { a: 'drucken', aEn: 'to print', b: 'drücken', bEn: 'to press' },
  { a: 'Bar', aEn: 'bar', b: 'Bär', bEn: 'bear' },
]
const UMLAUT_RULE = 'The two dots change the sound and can change the meaning. ü: say "ee" with rounded lips; ö: say "ay" with rounded lips; ä: like the "e" in "bed". If you cannot type them, write ue, oe, ae - never just leave the dots off.'

const vowelGens: ItemGenerator[] = [
  G('top.vowel.sound', 'sounds.vowels', [1, 3], (rng) => {
    const r = rng.pick(VOWELS)
    const w = rng.pick(r.words)
    const wrong: Wrong[] = SOUND_OPTIONS.filter((s) => s !== r.sound).map((s) =>
      (r.key === 'ei' && s.includes('"ee"')) || (r.key === 'ie' && s.includes('"eye"'))
        ? { label: s, misconception: 'ei-ie', feedback: 'Say the second letter: ei sounds like the English letter "i" (eye), ie sounds like the English letter "e" (ee).' }
        : s,
    )
    return choice({
      rng,
      prompt: `In ${q(w.de)} (${w.en}), how do you say the letters ${q(r.key)}?`,
      correct: r.sound,
      wrong,
      hint: 'For ei and ie, say the name of the second letter in English.',
      explanation: `${w.de}: ${r.key} sounds ${r.sound.replace(/^like /, 'like ')}. ${VOWEL_RULE}`,
    })
  }),

  G('top.vowel.which', 'sounds.vowels', [2, 4], (rng) => {
    const target = rng.pick(VOWELS.filter((v) => v.key !== 'äu'))
    const w = rng.pick(target.words)
    const sameSound = (v: VowelRule) => v.sound === target.sound
    const others = VOWELS.filter((v) => !sameSound(v))
    const wrong = pickN(rng, others, 3).map((v) => rng.pick(v.words).de)
    return choice({
      rng,
      prompt: `Which word has a sound ${target.sound.replace(/^like /, 'like ')}?`,
      correct: w.de,
      wrong,
      hint: 'Find the two vowels together in each word and say them the German way.',
      explanation: `${w.de} (${w.en}) has ${target.key}, which sounds ${target.sound}. ${VOWEL_RULE}`,
    })
  }),

  G('top.vowel.eiie', 'sounds.vowels', [2, 4], (rng, d) => {
    const r = rng.pick(VOWELS.filter((v) => v.key === 'ei' || v.key === 'ie'))
    const w = rng.pick(r.words)
    const gapped = w.de.replace(new RegExp(r.key, 'i'), '__')
    if (d >= 4) {
      return textItem({
        prompt: `Type the missing letters (ei or ie):  ${gapped}  (${w.en})`,
        accept: [r.key],
        placeholder: 'ei or ie',
        hint: w.de.includes('ie') ? 'Does it sound like "ee" or like "eye"?' : 'Does it sound like "eye" or like "ee"?',
        explanation: `${w.de}. ${VOWEL_RULE}`,
      })
    }
    return fixedChoice({
      prompt: `Fill the gap with ei or ie:  ${gapped}  (${w.en})`,
      order: ['ei', 'ie'],
      correct: r.key,
      feedback: { [r.key === 'ei' ? 'ie' : 'ei']: { misconception: 'ei-ie', feedback: 'ei sounds like "eye"; ie sounds like "ee". Say the second letter.' } },
      hint: 'Say the word aloud. Do you hear "eye" or "ee"?',
      explanation: `${w.de}. ${VOWEL_RULE}`,
    })
  }),

  G('top.vowel.umlaut', 'sounds.vowels', [2, 4], (rng, d) => {
    const p = rng.pick(UMLAUT_PAIRS)
    const askB = rng.chance(0.5)
    const [right, wrongW, en, wrongEn] = askB ? [p.b, p.a, p.bEn, p.aEn] : [p.a, p.b, p.aEn, p.bEn]
    if (d >= 4) {
      return textItem({
        prompt: `Type the German for ${q(en)}. (Careful: ${q(wrongW)} means ${q(wrongEn)}.)`,
        accept: accepts(right),
        placeholder: 'Type the word',
        hint: askB ? 'This one has an umlaut.' : 'This one has no umlaut.',
        explanation: `${right} = ${en}; ${wrongW} = ${wrongEn}. ${UMLAUT_RULE}${keyboardTip(right)}`,
      })
    }
    return choice({
      rng,
      prompt: `Which word means ${q(en)}?`,
      correct: right,
      wrong: [{ label: wrongW, misconception: 'umlaut', feedback: `${wrongW} means ${q(wrongEn)}. The umlaut changes the meaning.` }],
      hint: 'Look carefully at the dots.',
      explanation: `${right} = ${en}; ${wrongW} = ${wrongEn}. ${UMLAUT_RULE}`,
    })
  }),
]

// ------------------------------------------------------------------ consonants

interface ConsRule {
  letters: string
  sound: string
  wrong: Wrong[]
  words: { de: string; en: string; say?: string }[]
  /** Spellings an English speaker might write for the start of the word, used as wrong options. */
  misspell?: [string, string][]
}

const CONSONANTS: ConsRule[] = [
  {
    letters: 'w', sound: 'like English "v" (as in "van")',
    wrong: [{ label: 'like English "w" (as in "wet")', misconception: 'english-w', feedback: 'German w is said like English v: Wasser = "vasser".' }, 'like English "f" (as in "fan")'],
    words: [{ de: 'Wasser', en: 'water', say: 'VASS-er' }, { de: 'Winter', en: 'winter', say: 'VIN-ter' }, { de: 'Wurst', en: 'sausage', say: 'VOORST' }, { de: 'Wetter', en: 'weather', say: 'VET-ter' }, { de: 'Wolke', en: 'cloud', say: 'VOL-keh' }],
    misspell: [['W', 'V'], ['W', 'F']],
  },
  {
    letters: 'v', sound: 'like English "f" (as in "fan")',
    wrong: [{ label: 'like English "v" (as in "van")', misconception: 'english-v', feedback: 'In most German words v is said like f: Vater = "fahter".' }, 'like English "w" (as in "wet")'],
    words: [{ de: 'Vater', en: 'father', say: 'FAH-ter' }, { de: 'Vogel', en: 'bird', say: 'FOH-gel' }, { de: 'vier', en: 'four', say: 'FEER' }, { de: 'viel', en: 'a lot', say: 'FEEL' }],
    misspell: [['V', 'F'], ['V', 'W']],
  },
  {
    letters: 'z', sound: 'like "ts" (as in "cats")',
    wrong: [{ label: 'like English "z" (as in "zoo")', misconception: 'english-z', feedback: 'German z is always "ts": zehn = "tsayn".' }, 'like English "s" (as in "sun")'],
    words: [{ de: 'Zeit', en: 'time', say: 'TSITE' }, { de: 'zehn', en: 'ten', say: 'TSAYN' }, { de: 'Zug', en: 'train', say: 'TSOOK' }, { de: 'Zimmer', en: 'room', say: 'TSIM-mer' }, { de: 'Zucker', en: 'sugar', say: 'TSOOK-er' }],
    misspell: [['Z', 'Ts'], ['Z', 'C']],
  },
  {
    letters: 's (before a vowel)', sound: 'like English "z" (as in "zoo")',
    wrong: [{ label: 'like English "s" (as in "sun")', misconception: 'english-s', feedback: 'At the start of a word, before a vowel, German s sounds like English z.' }, 'like "sh" (as in "shop")'],
    words: [{ de: 'Sonne', en: 'sun', say: 'ZON-neh' }, { de: 'sieben', en: 'seven', say: 'ZEE-ben' }, { de: 'Suppe', en: 'soup', say: 'ZOOP-peh' }, { de: 'Saft', en: 'juice', say: 'ZAFT' }],
    misspell: [['S', 'Z'], ['S', 'Ss']],
  },
  {
    letters: 'sch', sound: 'like "sh" (as in "shop")',
    wrong: [{ label: 'like "sk" (as in "school")', misconception: 'english-sch', feedback: 'German sch is always "sh": Schule = "shooleh".' }, 'like "s" followed by "ch"'],
    words: [{ de: 'Schule', en: 'school', say: 'SHOO-leh' }, { de: 'Schuh', en: 'shoe', say: 'SHOO' }, { de: 'Schwester', en: 'sister', say: 'SHVES-ter' }, { de: 'Fisch', en: 'fish' }],
    misspell: [['Sch', 'Sh'], ['Sch', 'Sk']],
  },
  {
    letters: 'sp (at the start)', sound: 'like "shp"',
    wrong: [{ label: 'like "sp" (as in "spot")', misconception: 'english-sp', feedback: 'At the start of a word German sp sounds like "shp": Sport = "shport".' }, 'like "sk"'],
    words: [{ de: 'Sport', en: 'sport', say: 'SHPORT' }, { de: 'spielen', en: 'to play', say: 'SHPEE-len' }, { de: 'Spinne', en: 'spider', say: 'SHPIN-neh' }],
    misspell: [['Sp', 'Shp'], ['Sp', 'Schp']],
  },
  {
    letters: 'st (at the start)', sound: 'like "sht"',
    wrong: [{ label: 'like "st" (as in "stop")', misconception: 'english-st', feedback: 'At the start of a word German st sounds like "sht": Stadt = "shtatt".' }, 'like "ts"'],
    words: [{ de: 'Stadt', en: 'town', say: 'SHTATT' }, { de: 'Stuhl', en: 'chair', say: 'SHTOOL' }, { de: 'Stunde', en: 'hour / lesson', say: 'SHTOON-deh' }, { de: 'Straße', en: 'street', say: 'SHTRAH-seh' }],
    misspell: [['St', 'Sht'], ['St', 'Scht']],
  },
  {
    letters: 'j', sound: 'like English "y" (as in "yes")',
    wrong: [{ label: 'like English "j" (as in "jam")', misconception: 'english-j', feedback: 'German j sounds like English y: ja = "yah".' }, 'like "h" (as in "hat")'],
    words: [{ de: 'ja', en: 'yes', say: 'YAH' }, { de: 'Junge', en: 'boy', say: 'YOONG-eh' }, { de: 'Jacke', en: 'jacket', say: 'YAK-keh' }, { de: 'jung', en: 'young', say: 'YOONG' }],
    misspell: [['J', 'Y'], ['J', 'I']],
  },
  {
    letters: 'ch (after a, o, u or au)', sound: 'a throaty sound at the back, like the "ch" in Scottish "loch"',
    wrong: [{ label: 'like "ch" (as in "church")', misconception: 'english-ch', feedback: 'German ch is never "church". After a, o, u and au it is the throaty "loch" sound.' }, 'like "k" (as in "kick")'],
    words: [{ de: 'Buch', en: 'book' }, { de: 'acht', en: 'eight' }, { de: 'Bauch', en: 'stomach' }, { de: 'Kuchen', en: 'cake' }, { de: 'machen', en: 'to do / make' }],
  },
  {
    letters: 'ch (after e, i, ä, ö, ü, ei or eu)', sound: 'a soft hiss at the front, like a whispered "h" in "huge"',
    wrong: [{ label: 'like "ch" (as in "church")', misconception: 'english-ch', feedback: 'German ch is never "church". After e, i and umlauts it is a soft hiss, like the start of "huge".' }, 'like "k" (as in "kick")'],
    words: [{ de: 'ich', en: 'I' }, { de: 'Milch', en: 'milk' }, { de: 'Mädchen', en: 'girl' }, { de: 'Bücher', en: 'books' }, { de: 'leicht', en: 'easy' }],
  },
  {
    letters: '-ig (at the end)', sound: 'like the soft "ch" in "ich"',
    wrong: [{ label: 'like "ig" (as in "big")', misconception: 'english-ig', feedback: 'In standard German, -ig at the end of a word sounds like "ich".' }, 'like "ick" (as in "kick")'],
    words: [{ de: 'zwanzig', en: 'twenty' }, { de: 'lustig', en: 'funny' }, { de: 'windig', en: 'windy' }, { de: 'billig', en: 'cheap' }],
  },
  {
    letters: 'th', sound: 'like "t" (the h is silent)',
    wrong: [{ label: 'like "th" (as in "think")', misconception: 'english-th', feedback: 'German has no English th sound: Theater = "tay-ah-ter".' }, 'like "f"'],
    words: [{ de: 'Theater', en: 'theatre' }, { de: 'Thema', en: 'topic' }, { de: 'Mathe', en: 'maths' }],
  },
  {
    letters: 'd (at the end)', sound: 'like "t"',
    wrong: [{ label: 'like "d" (as in "dog")', misconception: 'final-d', feedback: 'At the end of a word, German d sounds like t: Hund = "hoont".' }, 'it is silent'],
    words: [{ de: 'Hund', en: 'dog' }, { de: 'Kind', en: 'child' }, { de: 'Geld', en: 'money' }, { de: 'Rad', en: 'bike' }],
  },
  {
    letters: 'ß', sound: 'like "ss" (as in "kiss")',
    wrong: [{ label: 'like "b"', misconception: 'eszett-b', feedback: 'ß looks a little like B, but it is a sharp "ss" sound.' }, 'like "z" (as in "zoo")'],
    words: [{ de: 'groß', en: 'big' }, { de: 'heißen', en: 'to be called' }, { de: 'Fuß', en: 'foot' }, { de: 'weiß', en: 'white' }],
  },
  {
    letters: 'pf', sound: 'both letters: "p" then "f"',
    wrong: [{ label: 'like "f" (the p is silent)', misconception: 'pf', feedback: 'Say both: p + f. Pferd = "p-fairt".' }, 'like "p" (the f is silent)'],
    words: [{ de: 'Pferd', en: 'horse', say: 'PFAIRT' }, { de: 'Apfel', en: 'apple' }, { de: 'Kopf', en: 'head' }],
    misspell: [['Pf', 'F'], ['Pf', 'Ph']],
  },
]
const CONS_RULE = 'w = v, v = f, z = ts, s + vowel = z, sch = sh, sp / st at the start = shp / sht, j = y, and ch is never "church".'

const consonantGens: ItemGenerator[] = [
  G('top.cons.sound', 'sounds.consonants', [1, 3], (rng) => {
    const r = rng.pick(CONSONANTS)
    const w = rng.pick(r.words)
    const otherSound = rng.pick(CONSONANTS.filter((x) => x.sound !== r.sound && !r.wrong.some((y) => (typeof y === 'string' ? y : y.label) === x.sound))).sound
    return choice({
      rng,
      prompt: `How do you say ${q(r.letters.replace(/ \(.*\)$/, ''))} in ${q(w.de)} (${w.en})?`,
      correct: r.sound,
      wrong: [...r.wrong, otherSound],
      hint: 'German letters do not always sound like the English ones.',
      explanation: `In ${w.de}, ${r.letters}: ${r.sound}. ${CONS_RULE}`,
    })
  }),

  G('top.cons.spell', 'sounds.consonants', [2, 5], (rng, d) => {
    const rules = CONSONANTS.filter((r) => r.misspell && r.words.some((w) => w.say))
    const r = rng.pick(rules)
    const w = rng.pick(r.words.filter((x) => x.say))
    const fix = (s: string) => (w.de[0] === w.de[0]?.toLowerCase() ? s.toLowerCase() : s)
    const swaps = (r.misspell ?? []).map(([from, to]) => (w.de.startsWith(fix(from)) ? fix(to) + w.de.slice(from.length) : null)).filter((x): x is string => !!x && x !== w.de)
    if (d >= 4) {
      return textItem({
        prompt: `The German word for ${q(w.en)} sounds like ${q(w.say as string)}. Type it.`,
        accept: accepts(w.de),
        placeholder: 'Type the German word',
        hint: `Think about how German spells the sound at the start. ${CONS_RULE}`,
        explanation: `${w.de}. ${r.letters}: ${r.sound}.${keyboardTip(w.de)}`,
      })
    }
    return choice({
      rng,
      prompt: `The German word for ${q(w.en)} sounds like ${q(w.say as string)}. How is it spelled?`,
      correct: w.de,
      wrong: swaps.map((s, i) => (i === 0 ? { label: s, misconception: 'spell-by-english-sound', feedback: `German writes this sound with ${r.letters}.` } : s)),
      hint: 'German spells some sounds differently from English.',
      explanation: `${w.de}. ${r.letters}: ${r.sound}. ${CONS_RULE}`,
    })
  }),
]

// ------------------------------------------------------------------ spelling rules

/** Sentences with nouns marked by *. */
const CAPS: string[] = [
  'Am *Montag spiele ich *Fußball mit meinem *Bruder.',
  'Meine *Schwester hat lange, blonde *Haare.',
  'Ich lerne seit zwei *Jahren *Deutsch.',
  'Im *Sommer fahren wir mit dem *Zug nach *Italien.',
  'Nach der *Schule mache ich meine *Hausaufgaben.',
  'Heute ist das *Wetter schön, aber morgen regnet es.',
  'Ich finde *Mathe schwierig, aber *Kunst macht *Spaß.',
  'Wir wohnen in einem kleinen *Haus auf dem *Land.',
  'Am *Wochenende gehe ich mit meinen *Freunden ins *Kino.',
  'Zum *Frühstück esse ich ein *Brötchen mit *Käse.',
]

const clean = (s: string) => s.replace(/\*/g, '')
function capsVariants(s: string, rng: Rng): { correct: string; wrong: Wrong[] } {
  const words = s.split(' ')
  const correct = clean(s)
  const lowerNouns = words.map((w) => (w.startsWith('*') ? w.slice(1).toLowerCase() : w)).join(' ')
  const title = words.map((w) => clean(w).charAt(0).toUpperCase() + clean(w).slice(1)).join(' ')
  const wrong: Wrong[] = [
    { label: lowerNouns, misconception: 'noun-capitals', feedback: 'Every German noun starts with a capital letter, wherever it is in the sentence.' },
  ]
  const midIch = words.findIndex((w, i) => i > 0 && w === 'ich')
  if (midIch > 0) {
    wrong.push({ label: words.map((w, i) => (i === midIch ? 'Ich' : clean(w))).join(' '), misconception: 'capital-ich', feedback: 'ich ("I") only has a capital letter at the start of a sentence.' })
  }
  const nonNoun = words.map((w, i) => ({ w, i })).filter(({ w, i }) => i > 0 && !w.startsWith('*') && w !== 'ich' && /^[a-zäöü]/.test(w))
  if (nonNoun.length) {
    const pick = rng.pick(nonNoun)
    wrong.push({ label: words.map((w, i) => (i === pick.i ? clean(w).charAt(0).toUpperCase() + clean(w).slice(1) : clean(w))).join(' '), misconception: 'extra-capital', feedback: `${clean(pick.w).replace(/[.,]$/, '')} is not a noun, so it has a small letter.` })
  }
  wrong.push({ label: title, misconception: 'title-case', feedback: 'Only nouns (and the first word) get capitals.' })
  return { correct, wrong: wrong.slice(0, 3) }
}

const SHARP: { de: string; en: string; ss: boolean }[] = [
  { de: 'Straße', en: 'street', ss: false },
  { de: 'groß', en: 'big', ss: false },
  { de: 'heißen', en: 'to be called', ss: false },
  { de: 'Fuß', en: 'foot', ss: false },
  { de: 'weiß', en: 'white', ss: false },
  { de: 'süß', en: 'sweet', ss: false },
  { de: 'draußen', en: 'outside', ss: false },
  { de: 'Grüße', en: 'greetings', ss: false },
  { de: 'Wasser', en: 'water', ss: true },
  { de: 'essen', en: 'to eat', ss: true },
  { de: 'Klasse', en: 'class', ss: true },
  { de: 'Tasse', en: 'cup', ss: true },
  { de: 'besser', en: 'better', ss: true },
  { de: 'dass', en: 'that (joining word)', ss: true },
  { de: 'Fluss', en: 'river', ss: true },
  { de: 'Schlüssel', en: 'key', ss: true },
]
const SHARP_RULE = 'After a long vowel or ei / au / eu, write ß (Straße, groß, heißen). After a short vowel, write ss (Wasser, Klasse, dass). In Switzerland ß is not used at all: they always write ss.'

const COMPOUNDS: { de: string; en: string; first: string; last: string }[] = [
  { de: 'Schlafzimmer', en: 'bedroom', first: 'schlafen (to sleep)', last: 'das Zimmer' },
  { de: 'Kühlschrank', en: 'fridge', first: 'kühl (cool)', last: 'der Schrank' },
  { de: 'Haustür', en: 'front door', first: 'das Haus', last: 'die Tür' },
  { de: 'Apfelsaft', en: 'apple juice', first: 'der Apfel', last: 'der Saft' },
  { de: 'Bushaltestelle', en: 'bus stop', first: 'der Bus', last: 'die Haltestelle' },
  { de: 'Fußballspiel', en: 'football match', first: 'der Fußball', last: 'das Spiel' },
  { de: 'Handtasche', en: 'handbag', first: 'die Hand', last: 'die Tasche' },
  { de: 'Hausaufgabe', en: 'piece of homework', first: 'das Haus', last: 'die Aufgabe' },
  { de: 'Krankenhaus', en: 'hospital', first: 'krank (ill)', last: 'das Haus' },
  { de: 'Regenschirm', en: 'umbrella', first: 'der Regen', last: 'der Schirm' },
  { de: 'Tomatensuppe', en: 'tomato soup', first: 'die Tomate', last: 'die Suppe' },
  { de: 'Lieblingsfach', en: 'favourite subject', first: 'Lieblings- (favourite)', last: 'das Fach' },
  { de: 'Schultasche', en: 'school bag', first: 'die Schule', last: 'die Tasche' },
  { de: 'Hausschuh', en: 'slipper', first: 'das Haus', last: 'der Schuh' },
  { de: 'Wochenende', en: 'weekend', first: 'die Woche', last: 'das Ende' },
  { de: 'Sportschuh', en: 'trainer', first: 'der Sport', last: 'der Schuh' },
]
const ARTS: Gender[] = ['der', 'die', 'das']

const spellingGens: ItemGenerator[] = [
  G('top.spell.caps', 'sounds.spelling', [2, 4], (rng) => {
    const s = rng.pick(CAPS)
    const v = capsVariants(s, rng)
    return choice({
      rng,
      prompt: 'Which sentence has the capital letters right?',
      correct: v.correct,
      wrong: v.wrong,
      hint: 'In German every noun has a capital letter - not just names.',
      explanation: `${v.correct} Nouns here: ${s.split(' ').filter((w) => w.startsWith('*')).map((w) => clean(w).replace(/[.,]$/, '')).join(', ')}. Every German noun has a capital letter; ich does not (except at the start).`,
    })
  }),

  G('top.spell.sharp', 'sounds.spelling', [1, 4], (rng) => {
    const w = rng.pick(SHARP)
    const gap = w.ss ? w.de.replace('ss', '__') : w.de.replace('ß', '__')
    return fixedChoice({
      prompt: `ß or ss?  ${gap}  (${w.en})`,
      order: ['ß', 'ss'],
      correct: w.ss ? 'ss' : 'ß',
      feedback: { [w.ss ? 'ß' : 'ss']: { misconception: 'eszett', feedback: w.ss ? 'The vowel before it is short, so write ss.' : 'The vowel before it is long (or ei / au / eu), so write ß.' } },
      hint: 'Is the vowel before the gap long or short?',
      explanation: `${w.de}. ${SHARP_RULE}`,
    })
  }),

  G('top.spell.compound', 'sounds.spelling', [3, 5], (rng, d) => {
    const c = rng.pick(COMPOUNDS)
    const g = c.last.split(' ')[0] as Gender
    const firstG = c.first.split(' ')[0] as string
    return fixedChoice({
      prompt: d >= 5 ? `der, die or das?  ___ ${c.de} (${c.en})` : `der, die or das?  ___ ${c.de} (${c.en} = ${c.first} + ${c.last})`,
      order: ARTS,
      correct: g,
      feedback: ARTS.includes(firstG as Gender) && firstG !== g ? { [firstG]: { misconception: 'compound-first-part', feedback: `The FIRST part (${c.first}) does not decide. The last part does: ${c.last}.` } } : {},
      hint: 'A compound noun takes the gender of its LAST part.',
      explanation: `${g} ${c.de}, because the last part is ${c.last}. A compound noun always takes the gender of its last part.`,
    })
  }),

  G('top.spell.compound-type', 'sounds.spelling', [4, 5], (rng) => {
    const c = rng.pick(COMPOUNDS)
    const g = c.last.split(' ')[0] as Gender
    return textItem({
      prompt: `Type der, die or das:  ___ ${c.de}  (${c.en})`,
      accept: [g],
      placeholder: 'der / die / das',
      hint: 'Split the word into its parts. Which part decides the gender?',
      explanation: `${g} ${c.de}: the last part is ${c.last}. A compound noun always takes the gender of its last part.`,
    })
  }),
]

export const soundsGenerators: ItemGenerator[] = [...alphabetGens, ...vowelGens, ...consonantGens, ...spellingGens]
