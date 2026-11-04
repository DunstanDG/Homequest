import type { ItemGenerator } from '@/engine/registry'
import type { Figure, Rng } from '@/engine/types'
import { choice, orderItem } from '../kit'
import { binAccept, commas, err, factGenerators, G, nibbles, num, text, toBin, toHex, type FactSet } from './helpers'

const PLACES = [128, 64, 32, 16, 8, 4, 2, 1]
const placeTable = (bits: string): Figure => {
  const places = PLACES.slice(8 - bits.length)
  return { type: 'table', head: places.map(String), rows: [[...bits]] }
}
/** "64 + 8 + 1 = 73" */
const workings = (n: number, width = 8): string => {
  const parts = PLACES.slice(8 - width).filter((p) => n & p)
  return parts.length ? `${parts.join(' + ')} = ${n}` : '0'
}
const UNIT_RULE = 'Use 1 KB = 1000 bytes, 1 MB = 1000 KB, 1 GB = 1000 MB and 1 TB = 1000 GB.'

// =====================================================================================================================
// Powers of 2 (foundation)
// =====================================================================================================================

const powersValue = G('data.powers-of-two.value', 'data.powers-of-two', [1, 4], (rng, d) => {
  const n = d <= 1 ? rng.int(1, 4) : d === 2 ? rng.int(2, 6) : d === 3 ? rng.int(4, 8) : rng.int(7, 10)
  const v = 2 ** n
  if (d <= 2) {
    return num({
      prompt: `Start at 1 and double it ${n === 1 ? 'once' : `${n} times`}. What number do you get?`,
      answer: v,
      hint: '1, 2, 4, 8, ... keep doubling and count the doublings.',
      explanation: `1${Array.from({ length: n }, (_, i) => ` → ${2 ** (i + 1)}`).join('')}. That is 2^{${n}} = ${v}.`,
      errors: [err(2 * n, 'times-two', `That is ${n} × 2. Doubling ${n} times multiplies by 2 again and again.`), err(v / 2, 'one-short', 'Count the doublings again: one more is needed.')],
    })
  }
  return num({
    prompt: `What is 2^{${n}}?`,
    answer: v,
    hint: '2^{n} means n twos multiplied together. Start from a power you know and keep doubling.',
    explanation: `2^{${n}} = ${Array.from({ length: n }, () => '2').join(' × ')} = ${v}.`,
    errors: [err(2 * n, 'power-as-multiply', `2^{${n}} is not 2 × ${n}: it is ${n} twos multiplied together.`), err(n ** 2, 'power-swapped', `That is ${n}^{2}.`)],
  })
})

const powersNot = G('data.powers-of-two.not', 'data.powers-of-two', [2, 5], (rng, d) => {
  const powers = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024].filter((p) => (d <= 3 ? p <= 256 : true))
  const traps = d <= 3 ? [6, 10, 12, 24, 48, 100] : [96, 160, 200, 500, 1000, 384]
  const correct = rng.pick(traps)
  return choice({
    rng,
    prompt: 'Which of these is NOT a power of 2?',
    correct: String(correct),
    wrong: rng.shuffle(powers).slice(0, 3).map((p) => ({ label: String(p), feedback: `${p} = 2^{${Math.log2(p)}}, so it is a power of 2.` })),
    hint: 'Powers of 2 go 1, 2, 4, 8, 16, ... each one double the one before.',
    explanation: `${correct} is not in the doubling sequence 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024.`,
  })
})

const powersOrder = G('data.powers-of-two.order', 'data.powers-of-two', [1, 3], (rng) => {
  const ns = rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 4).sort((a, b) => a - b)
  return orderItem({
    rng,
    prompt: 'Put these in order, smallest first.',
    correct: ns.map((n) => `2^{${n}}`),
    direction: ['smallest', 'largest'],
    hint: 'A bigger power of 2 is always a bigger number.',
    explanation: ns.map((n) => `2^{${n}} = ${2 ** n}`).join(', ') + '.',
  })
})

// =====================================================================================================================
// Bits and bytes
// =====================================================================================================================

const bitsCalc = G('data.bits-bytes.calc', 'data.bits-bytes', [1, 5], (rng, d) => {
  const kind = rng.pick(d <= 2 ? ['bits-in-bytes', 'nibbles'] : d === 3 ? ['bits-in-bytes', 'patterns', 'bytes-in-bits'] : ['patterns', 'bits-needed', 'bytes-in-bits'])
  if (kind === 'bits-in-bytes') {
    const n = rng.int(2, d <= 2 ? 6 : 12)
    return num({ prompt: `How many bits are there in ${n} bytes?`, answer: n * 8, suffix: 'bits', hint: '1 byte = 8 bits.', explanation: `${n} × 8 = ${n * 8} bits.`, errors: [err(n * 4, 'nibble-as-byte', 'A byte is 8 bits; 4 bits is a nibble.')] })
  }
  if (kind === 'nibbles') {
    const n = rng.int(1, 6)
    return num({ prompt: `How many nibbles are there in ${n} byte${n === 1 ? '' : 's'}?`, answer: n * 2, suffix: 'nibbles', hint: 'A nibble is 4 bits and a byte is 8 bits.', explanation: `A byte is 2 nibbles, so ${n} byte${n === 1 ? ' is' : 's are'} ${n * 2} nibbles.` })
  }
  if (kind === 'bytes-in-bits') {
    const n = rng.int(2, 20)
    return num({ prompt: `How many bytes is ${n * 8} bits?`, answer: n, suffix: 'bytes', hint: 'Divide by the number of bits in a byte.', explanation: `${n * 8} ÷ 8 = ${n} bytes.`, errors: [err(n * 64, 'multiplied', 'Bytes are bigger than bits, so there are fewer of them: divide.')] })
  }
  if (kind === 'patterns') {
    const b = rng.int(2, 8)
    return num({ prompt: `How many different patterns (values) can be made with ${b} bits?`, answer: 2 ** b, hint: 'Each extra bit doubles the number of patterns.', explanation: `Each bit can be 0 or 1, so ${b} bits give 2^{${b}} = ${2 ** b} patterns.`, errors: [err(2 * b, 'times-two', `It is 2^{${b}}, not 2 × ${b}.`), err(2 ** b - 1, 'largest-value', `${2 ** b - 1} is the largest value; counting 0 too gives ${2 ** b} patterns.`)] })
  }
  const k = rng.int(5, 200)
  const bits = Math.ceil(Math.log2(k))
  return num({ prompt: `A game needs to give each of ${k} characters a different binary code. What is the smallest number of bits each code needs?`, answer: bits, suffix: 'bits', hint: 'Find the smallest power of 2 that is at least as big as the number of codes needed.', explanation: `2^{${bits - 1}} = ${2 ** (bits - 1)} is not enough, but 2^{${bits}} = ${2 ** bits} is, so ${bits} bits are needed.`, errors: [err(bits - 1, 'rounded-down', `${bits - 1} bits only give ${2 ** (bits - 1)} codes, which is not enough.`)] })
})

const bitsFacts: FactSet = {
  skill: 'data.bits-bytes',
  termNoun: 'term',
  terms: [
    { term: 'Bit', def: 'A single binary digit: 0 or 1', hint: 'Short for "binary digit".', typed: ['bits', 'binary digit'] },
    { term: 'Nibble', def: 'A group of 4 bits', hint: 'Half a byte (and a small bite).', typed: ['nybble'] },
    { term: 'Byte', def: 'A group of 8 bits', hint: 'Enough bits to store one character in ASCII.', typed: ['bytes'] },
    { term: 'Binary', def: 'A number system that uses only the digits 0 and 1 (base 2)', hint: '"Bi" means two.', typed: ['base 2'] },
    { term: 'Denary', def: 'The everyday number system with the digits 0 to 9 (base 10)', hint: 'Also called decimal.', typed: ['decimal', 'base 10'] },
  ],
  facts: [
    {
      lv: [1, 4],
      q: 'Why do computers use binary?',
      a: 'Their circuits are made of switches (transistors) that have two states: on and off',
      wrong: [
        { label: 'Because binary numbers are shorter than denary numbers', misconception: 'binary-shorter', feedback: 'Binary numbers are actually longer: 255 needs 8 binary digits.' },
        { label: 'Because programmers find binary easier to read', feedback: 'People find binary hard to read; that is one reason hexadecimal is used.' },
        { label: 'Because computers were invented before the digits 2 to 9', feedback: 'Denary is far older than computers.' },
      ],
      hint: 'Think about what is happening inside the electronics.',
      exp: 'A computer\'s processor contains billions of tiny switches called transistors. Each is either on (1) or off (0), so everything is stored and processed in binary.',
    },
  ],
  written: [
    {
      q: 'Explain why computers store all data, including text, images and sound, in binary.',
      model: 'Computers are built from electronic circuits containing billions of switches called transistors. Each switch can only be in one of two states, on or off, which can be written as 1 or 0. Because of this, all data must be turned into patterns of binary digits (bits) before a computer can store or process it. Text, images and sound are each given a binary code, for example each character has a number in a character set.',
      checklist: ['Mentions switches or transistors', 'Says they have two states (on/off)', 'Links the two states to 1 and 0', 'Explains that other data (text, images or sound) must be converted into binary'],
    },
  ],
}

// =====================================================================================================================
// Binary and denary
// =====================================================================================================================

const randByte = (rng: Rng, d: number): number => (d <= 1 ? rng.int(1, 15) : d === 2 ? rng.int(16, 63) : rng.int(64, 255))

const binToDen = G('data.binary-to-denary.convert', 'data.binary-to-denary', [1, 5], (rng, d) => {
  if (d >= 5 && rng.chance(0.5)) {
    const b = rng.int(3, 8)
    return num({
      prompt: `What is the largest denary number that can be stored using ${b} bits?`,
      answer: 2 ** b - 1,
      hint: `The largest value has every bit set to 1.`,
      explanation: `${'1'.repeat(b)} = ${workings(2 ** b - 1, b)}. That is 2^{${b}} - 1.`,
      errors: [err(2 ** b, 'counted-patterns', `${b} bits make ${2 ** b} patterns, but one of them is 0, so the largest is ${2 ** b - 1}.`)],
    })
  }
  const n = randByte(rng, d)
  const width = d <= 1 ? 4 : 8
  const bits = toBin(n, width)
  const reversed = parseInt([...bits].reverse().join(''), 2)
  return num({
    prompt: `Convert the binary number ${width === 8 ? nibbles(bits) : bits} to denary.`,
    figure: d <= 3 ? placeTable(bits) : undefined,
    answer: n,
    hint: `Write the place values ${PLACES.slice(8 - width).join(', ')} above the bits and add up the ones with a 1 under them.`,
    explanation: `${workings(n, width)}.`,
    errors: [err(reversed, 'read-backwards', 'The place values go up from right to left: the rightmost bit is worth 1.'), err([...bits].filter((c) => c === '1').length, 'counted-ones', 'Do not just count the 1s; add up their place values.')],
  })
})

const denToBin = G('data.denary-to-binary.convert', 'data.denary-to-binary', [1, 5], (rng, d) => {
  const n = d >= 5 ? rng.int(128, 255) : randByte(rng, d)
  const width = d <= 1 ? 4 : 8
  return text({
    prompt: `Convert ${n} to ${width}-bit binary.`,
    accept: binAccept(n, width),
    placeholder: `${width} bits, e.g. ${'0'.repeat(width - 1)}1`,
    hint: `Go through the place values ${PLACES.slice(8 - width).join(', ')}. If the place value fits into what is left, write 1 and subtract it; otherwise write 0.`,
    explanation: `${n} = ${workings(n, width)}, so it is ${width === 8 ? nibbles(toBin(n, width)) : toBin(n, width)}.`,
  })
})

const denToBinChoice = G('data.denary-to-binary.choice', 'data.denary-to-binary', [2, 4], (rng, d) => {
  const n = randByte(rng, d)
  const b = toBin(n)
  const rev = [...b].reverse().join('')
  const plus = toBin((n + 1) % 256)
  const flip = toBin(n ^ 16)
  return choice({
    rng,
    prompt: `Which 8-bit binary number is equal to ${n}?`,
    correct: nibbles(b),
    wrong: [
      { label: nibbles(rev), misconception: 'read-backwards', feedback: 'That has the bits in reverse order. 128 is on the left, 1 on the right.' },
      { label: nibbles(plus), feedback: `That is ${(n + 1) % 256}.` },
      { label: nibbles(flip), feedback: `That is ${parseInt(flip, 2)}.` },
    ],
    hint: 'Work out each option\'s value, or convert the number yourself using 128, 64, 32, 16, 8, 4, 2, 1.',
    explanation: `${n} = ${workings(n)}, which is ${nibbles(b)}.`,
  })
})

// =====================================================================================================================
// Binary addition and overflow
// =====================================================================================================================

const addColumns = (a: number, b: number) => `${nibbles(toBin(a))} + ${nibbles(toBin(b))}`

const binAdd = G('data.binary-addition.add', 'data.binary-addition', [1, 4], (rng, d) => {
  let a: number
  let b: number
  if (d <= 1) {
    a = rng.int(1, 14)
    b = rng.int(1, 15) & ~a & 15
    if (b === 0) b = 15 & ~a || 0
  } else if (d === 2) {
    a = rng.int(1, 200)
    b = rng.int(1, 255) & ~a & 255
    if (b === 0) b = ~a & 255 & -(~a & 255)
  } else {
    a = rng.int(20, 150)
    b = rng.int(20, 255 - a)
  }
  const s = a + b
  const width = d <= 1 ? 4 : 8
  return text({
    prompt: `Add these ${width}-bit binary numbers. Give the answer in ${width} bits: ${width === 4 ? `${toBin(a, 4)} + ${toBin(b, 4)}` : addColumns(a, b)}`,
    accept: binAccept(s, width),
    placeholder: `${width} bits`,
    hint: 'Work right to left. 0 + 0 = 0, 0 + 1 = 1, 1 + 1 = 0 carry 1, 1 + 1 + 1 = 1 carry 1.',
    explanation: `In denary that is ${a} + ${b} = ${s}, which is ${width === 8 ? nibbles(toBin(s, width)) : toBin(s, width)}. Checking in denary is a good way to catch mistakes with carries.`,
  })
})

const binOverflow = G('data.binary-addition.overflow', 'data.binary-addition', [3, 5], (rng, d) => {
  const over = rng.chance(0.5)
  const a = rng.int(100, 230)
  const b = over ? rng.int(256 - a, 255) : rng.int(10, 255 - a)
  const s = a + b
  if (d >= 5 && over) {
    return text({
      prompt: `${addColumns(a, b)}. The answer must be stored in 8 bits, so the extra carry bit is lost. Which 8 bits are stored?`,
      accept: binAccept(s - 256),
      placeholder: '8 bits',
      hint: 'Do the addition fully (it will need 9 bits), then drop the leftmost bit.',
      explanation: `${a} + ${b} = ${s}, which is ${toBin(s, 9)} in 9 bits. Only the right-hand 8 bits fit: ${nibbles(toBin(s - 256))} (which is ${s - 256}). This is an overflow error.`,
    })
  }
  return choice({
    rng,
    prompt: `Two 8-bit numbers are added: ${addColumns(a, b)}. What happens?`,
    correct: over ? 'Overflow: the answer is too big to fit in 8 bits' : 'No overflow: the answer fits in 8 bits',
    wrong: [
      over ? { label: 'No overflow: the answer fits in 8 bits', misconception: 'missed-overflow', feedback: `${a} + ${b} = ${s}, which is more than 255.` } : { label: 'Overflow: the answer is too big to fit in 8 bits', misconception: 'false-overflow', feedback: `${a} + ${b} = ${s}, which is no more than 255, so it fits.` },
      { label: 'Overflow: because both numbers start with a 1', feedback: 'Overflow depends on whether the total is more than 255, not on the first bits alone.' },
      { label: 'The computer rounds the answer to the nearest 8 bits', feedback: 'Computers do not round like this: extra bits are simply lost.' },
    ],
    hint: 'The largest number 8 bits can hold is 255. Convert to denary to check.',
    explanation: `${a} + ${b} = ${s}. ${over ? 'That is more than 255, so a 9th bit is needed: overflow.' : 'That is 255 or less, so it fits in 8 bits.'}`,
  })
})

const addFacts: FactSet = {
  skill: 'data.binary-addition',
  facts: [
    {
      lv: [1, 3],
      q: 'In binary addition, what is 1 + 1?',
      a: '0, carry 1',
      wrong: [
        { label: '2', misconception: 'denary-digit', feedback: 'There is no digit 2 in binary.' },
        { label: '1, carry 0', feedback: '1 + 1 is two, which is 10 in binary.' },
        { label: '1, carry 1', feedback: 'That is 1 + 1 + 1 (three).' },
      ],
      hint: 'Two in binary is written 10.',
      exp: 'Two is 10 in binary, so write 0 and carry 1 into the next column.',
    },
    {
      lv: [2, 4],
      q: 'What is an overflow error?',
      a: 'When the result of a calculation is too big to fit in the number of bits available',
      wrong: [
        { label: 'When a program runs out of memory and slows down', feedback: 'That is not what overflow means here.' },
        { label: 'When two binary numbers are the same', feedback: 'That is not an error.' },
        { label: 'When a binary number contains a digit other than 0 or 1', feedback: 'That would just not be binary.' },
      ],
      hint: 'Think about adding 200 and 100 in 8 bits.',
      exp: 'With 8 bits the largest value is 255. If an addition gives more than that, the extra carry bit has nowhere to go: an overflow error.',
    },
    {
      lv: [3, 5],
      q: 'What is 1 + 1 + 1 in a binary addition column?',
      a: '1, carry 1',
      wrong: [
        { label: '0, carry 1', feedback: 'That is 1 + 1. Three is 11 in binary.' },
        { label: '3', misconception: 'denary-digit', feedback: 'Binary only has the digits 0 and 1.' },
        { label: '1, carry 0', feedback: 'Three is more than 1, so there must be a carry.' },
      ],
      hint: 'Three in binary is 11.',
      exp: 'Three is 11 in binary: write 1 and carry 1.',
    },
  ],
}

// =====================================================================================================================
// Hexadecimal
// =====================================================================================================================

const hexConvert = G('data.hex.convert', 'data.hex', [1, 5], (rng, d) => {
  const kind = rng.pick(d <= 1 ? ['digit'] : d === 2 ? ['digit', 'h2d'] : d === 3 ? ['h2d', 'd2h', 'b2h'] : ['h2d', 'd2h', 'b2h', 'h2b'])
  if (kind === 'digit') {
    const v = rng.int(10, 15)
    return num({ prompt: `What is the denary value of the hexadecimal digit ${toHex(v, 1)}?`, answer: v, hint: 'After 9, hex uses A = 10, B = 11, and so on up to F.', explanation: `A = 10, B = 11, C = 12, D = 13, E = 14, F = 15, so ${toHex(v, 1)} = ${v}.`, errors: [err(v - 9, 'letter-position', 'A is not 1: hex letters carry on after 9, so A = 10.')] })
  }
  const n = d <= 3 ? rng.int(17, 255) : rng.int(100, 255)
  const h = toHex(n)
  const hi = n >> 4
  const lo = n & 15
  if (kind === 'h2d') {
    return num({ prompt: `Convert the hexadecimal number ${h} to denary.`, answer: n, hint: 'The left digit is worth 16s and the right digit 1s.', explanation: `${h[0]} = ${hi} and ${h[1]} = ${lo}, so ${hi} × 16 + ${lo} = ${n}.`, errors: [err(hi * 10 + lo, 'place-ten', 'The left hex digit is worth 16s, not 10s.'), err(hi + lo, 'added-digits', 'Multiply the left digit by 16 first.')] })
  }
  if (kind === 'd2h') {
    return text({ prompt: `Convert ${n} to a two-digit hexadecimal number.`, accept: [h, `0x${h}`], placeholder: 'e.g. 3F', hint: 'How many 16s fit into the number? That is the left digit; the remainder is the right digit. Use A to F for 10 to 15.', explanation: `${n} ÷ 16 = ${hi} remainder ${lo}. ${hi} is ${toHex(hi, 1)} and ${lo} is ${toHex(lo, 1)}, so ${n} = ${h}.` })
  }
  if (kind === 'b2h') {
    const b = toBin(n)
    return text({ prompt: `Convert the binary number ${nibbles(b)} to hexadecimal.`, accept: [h, `0x${h}`], placeholder: 'e.g. 3F', hint: 'Split the 8 bits into two nibbles of 4. Convert each nibble into one hex digit (8, 4, 2, 1).', explanation: `${b.slice(0, 4)} = ${hi} = ${toHex(hi, 1)} and ${b.slice(4)} = ${lo} = ${toHex(lo, 1)}, so it is ${h}.` })
  }
  return text({ prompt: `Convert the hexadecimal number ${h} to 8-bit binary.`, accept: binAccept(n), placeholder: '8 bits', hint: 'Each hex digit becomes one 4-bit nibble.', explanation: `${h[0]} = ${hi} = ${toBin(hi, 4)} and ${h[1]} = ${lo} = ${toBin(lo, 4)}, so ${h} = ${nibbles(toBin(n))}.` })
})

const hexFacts: FactSet = {
  skill: 'data.hex',
  facts: [
    {
      lv: [1, 3],
      q: 'Why do programmers often use hexadecimal instead of binary?',
      a: 'It is shorter and easier for people to read, so mistakes are less likely',
      wrong: [
        { label: 'Computers store data in hexadecimal', misconception: 'hex-stored', feedback: 'Computers store everything in binary. Hex is just for people.' },
        { label: 'Hexadecimal uses less memory than binary', misconception: 'hex-stored', feedback: 'The data is stored in binary either way; hex only changes how it is written down.' },
        { label: 'Hexadecimal can show numbers that binary cannot', feedback: 'Any number can be written in binary or hex.' },
      ],
      hint: 'Compare 11111111 with FF.',
      exp: 'Each hex digit stands for 4 bits, so a byte is just 2 hex digits. That is easier to read, write and remember. The computer still stores binary.',
    },
    {
      lv: [2, 4],
      q: 'How many bits does one hexadecimal digit represent?',
      a: '4',
      wrong: [
        { label: '8', misconception: 'hex-digit-byte', feedback: 'Two hex digits make a byte (8 bits), so one digit is 4 bits.' },
        { label: '16', misconception: 'base-as-bits', feedback: 'Hex has 16 possible digits, which needs 4 bits (2^{4} = 16).' },
        { label: '2', feedback: '2 bits only give 4 values, not 16.' },
      ],
      hint: 'One hex digit has 16 possible values.',
      exp: 'A hex digit can be 0 to F, which is 16 values. 4 bits give 2^{4} = 16 values, so one hex digit = one nibble.',
    },
    {
      lv: [3, 5],
      q: 'In the web colour code #FF0000, the pairs of hex digits give the amounts of red, green and blue. What colour is it?',
      a: 'Red',
      wrong: [
        { label: 'Green', feedback: 'Green is the middle pair, which is 00 here.' },
        { label: 'Blue', feedback: 'Blue is the last pair, which is 00 here.' },
        { label: 'White', misconception: 'ff-white', feedback: 'White would be #FFFFFF: all three at full.' },
      ],
      hint: 'FF is the largest two-digit hex value (255).',
      exp: 'The pairs are red FF (255, full), green 00 and blue 00. So it is pure red.',
    },
  ],
}

// =====================================================================================================================
// Units of data
// =====================================================================================================================

const UNIT_NAMES = ['bytes', 'KB', 'MB', 'GB', 'TB']
const unitsConvert = G('data.units.convert', 'data.units', [1, 5], (rng, d) => {
  if (d >= 4 && rng.chance(0.5)) {
    const card = rng.pick([2, 4, 8, 16, 32, 64])
    const file = rng.pick([2, 4, 5, 8, 10, 20])
    const answer = Math.floor((card * 1000) / file)
    const thing = rng.pick(['photos', 'songs', 'video clips'])
    return num({ prompt: `A memory card holds ${card} GB. Each of Maya's ${thing} is ${file} MB. How many ${thing} can fit on the card? ${UNIT_RULE}`, answer, suffix: thing, hint: 'Change the GB into MB first, then divide.', explanation: `${card} GB = ${commas(card * 1000)} MB. ${commas(card * 1000)} ÷ ${file} = ${commas(answer)}${(card * 1000) % file ? ' (rounded down, as part of a file does not count)' : ''}.`, errors: [err(card / file, 'no-conversion', 'Convert GB to MB before dividing.')] })
  }
  const steps = d <= 2 ? 1 : d === 3 ? rng.int(1, 2) : rng.int(1, 3)
  const small = rng.int(0, 4 - steps)
  const big = small + steps
  const n = rng.int(2, 9)
  const answer = n * 1000 ** (big - small)
  const toBits = d >= 3 && small === 0 && rng.chance(0.4)
  return num({
    prompt: toBits ? `How many bits are in ${n} ${UNIT_NAMES[big]}? ${UNIT_RULE}` : `How many ${UNIT_NAMES[small]} are in ${n} ${UNIT_NAMES[big]}? ${UNIT_RULE}`,
    answer: toBits ? answer * 8 : answer,
    tolerance: 0.5,
    suffix: toBits ? 'bits' : UNIT_NAMES[small],
    hint: toBits ? 'Get to bytes first, then multiply by 8.' : 'Each step down the units (TB, GB, MB, KB, bytes) multiplies by 1000.',
    explanation: `${n} ${UNIT_NAMES[big]} = ${n} × 1000${big - small > 1 ? `^{${big - small}}` : ''} = ${commas(answer)} ${UNIT_NAMES[small]}${toBits ? `, and × 8 = ${commas(answer * 8)} bits` : ''}.`,
    errors: [err(n * 1024 ** (big - small) * (toBits ? 8 : 1), 'binary-prefix', 'The question uses 1000, not 1024.'), err(n * 1000 ** (big - small - 1) * (toBits ? 8 : 1), 'one-step', 'Count the steps between the units again: each one is × 1000.')],
  })
})

const unitsOrder = G('data.units.order', 'data.units', [1, 3], (rng) => {
  const all = ['Bit', 'Nibble', 'Byte', 'Kilobyte (KB)', 'Megabyte (MB)', 'Gigabyte (GB)', 'Terabyte (TB)']
  const start = rng.int(0, 2)
  const pick = all.slice(start, start + 5)
  return orderItem({
    rng,
    prompt: 'Put these units in order of size, smallest first.',
    correct: pick,
    direction: ['smallest', 'largest'],
    hint: 'Kilo, mega, giga, tera: each is a thousand times the one before.',
    explanation: 'Bit (1 binary digit) < nibble (4 bits) < byte (8 bits) < KB < MB < GB < TB.',
  })
})

const unitsFacts: FactSet = {
  skill: 'data.units',
  facts: [
    {
      lv: [2, 4],
      q: 'Which would be the most sensible unit for the size of a single short text message?',
      a: 'Bytes',
      wrong: [
        { label: 'Terabytes', feedback: 'A terabyte is a trillion bytes: far too big.' },
        { label: 'Gigabytes', feedback: 'A gigabyte could hold a whole film.' },
        { label: 'Megabytes', feedback: 'A megabyte is a million bytes; a short text uses one byte per character or so.' },
      ],
      hint: 'A short message is about 100 characters.',
      exp: 'Each character is about a byte, so a short message is around a hundred bytes.',
    },
    {
      lv: [3, 5],
      q: 'Some people say 1 KB = 1024 bytes and some say 1 KB = 1000 bytes. Why might 1024 be used?',
      a: '1024 is a power of 2 (2^{10}), which fits the way computers count in binary',
      wrong: [
        { label: '1024 is the number of bits in a byte', feedback: 'There are 8 bits in a byte.' },
        { label: '1024 is the largest number a byte can store', feedback: 'The largest 8-bit number is 255.' },
        { label: 'Because computers cannot count to 1000', feedback: 'Computers can store 1000 easily.' },
      ],
      hint: 'Think about powers of 2.',
      exp: '1024 = 2^{10}, close to 1000. Many textbooks and exam boards use 1000 to keep calculations simple; the important thing is to use one convention consistently.',
    },
  ],
}

// =====================================================================================================================
// Characters
// =====================================================================================================================

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const charCodes = G('data.characters.codes', 'data.characters', [1, 5], (rng, d) => {
  const kind = rng.pick(d <= 2 ? ['upper'] : d === 3 ? ['upper', 'lower', 'word-bits'] : ['lower', 'case-gap', 'binary', 'word-bits'])
  const i = rng.int(1, 25)
  const L = LETTERS[i] ?? 'B'
  if (kind === 'upper') {
    const known = rng.int(0, i - 1)
    return num({ prompt: `In ASCII, the code for "${LETTERS[known]}" is ${65 + known}. Capital letters have codes in alphabetical order. What is the code for "${L}"?`, answer: 65 + i, hint: 'Count how many letters further on in the alphabet it is.', explanation: `"${L}" is ${i - known} letters after "${LETTERS[known]}", so its code is ${65 + known} + ${i - known} = ${65 + i}.`, errors: [err(64 + i, 'off-by-one', 'Count the steps between the letters again.')] })
  }
  if (kind === 'lower') {
    return num({ prompt: `In ASCII, "a" is 97 and lower-case letters are in alphabetical order. What is the code for "${L.toLowerCase()}"?`, answer: 97 + i, hint: '"b" is 98, "c" is 99, ...', explanation: `"${L.toLowerCase()}" is letter number ${i + 1} of the alphabet, so its code is 97 + ${i} = ${97 + i}.`, errors: [err(98 + i, 'off-by-one', '"a" itself is 97, so add one less than the letter\'s position.')] })
  }
  if (kind === 'case-gap') {
    return num({ prompt: `In ASCII, "${L}" is ${65 + i}. Every lower-case letter's code is 32 more than its capital. What is the code for "${L.toLowerCase()}"?`, answer: 97 + i, hint: 'Add the gap between capital and lower-case codes.', explanation: `${65 + i} + 32 = ${97 + i}.` })
  }
  if (kind === 'binary') {
    return text({ prompt: `In ASCII, "${L}" has the code ${65 + i}. Write this code as 8-bit binary.`, accept: binAccept(65 + i), placeholder: '8 bits', hint: 'Convert the denary code into binary using 128, 64, 32, 16, 8, 4, 2, 1.', explanation: `${65 + i} = ${workings(65 + i)}, so "${L}" is stored as ${nibbles(toBin(65 + i))}.` })
  }
  const word = rngWord(rng)
  return num({ prompt: `Each character is stored in 8 bits. How many bits are needed to store the word "${word}"?`, answer: word.length * 8, suffix: 'bits', hint: 'Count the characters, then multiply.', explanation: `"${word}" has ${word.length} characters, and ${word.length} × 8 = ${word.length * 8} bits.`, errors: [err(word.length, 'bytes-not-bits', `That is the number of bytes. Multiply by 8 for bits.`)] })
})
const rngWord = (rng: Rng) => rng.pick(['CAT', 'HELLO', 'Python', 'binary', 'Year 8', 'CODE', 'pixel', 'robot'])

const charFacts: FactSet = {
  skill: 'data.characters',
  termNoun: 'term',
  terms: [
    { term: 'Character set', def: 'A list of characters a computer can use, each with its own unique binary code', hint: 'A "set" of all the characters.', typed: ['character sets'] },
    { term: 'ASCII', def: 'A character set that uses 7 bits to give 128 codes, covering English letters, digits and punctuation', hint: 'One of the earliest character sets, made in the USA.' , typed: ['ascii code'] },
    { term: 'Unicode', def: 'A character set with codes for over 100,000 characters, including many alphabets and emoji', hint: 'It aims to cover every writing system in the world.' },
    { term: 'Extended ASCII', def: 'A character set that uses 8 bits to give 256 codes', hint: 'One more bit than the original.' },
  ],
  facts: [
    {
      lv: [2, 4],
      q: 'Why was Unicode introduced when ASCII already existed?',
      a: 'ASCII has too few codes for other alphabets, symbols and emoji',
      wrong: [
        { label: 'ASCII could not store capital letters', feedback: 'ASCII includes capital letters (A is 65).' },
        { label: 'Unicode uses fewer bits for every character', feedback: 'Unicode characters often need more bits, not fewer.' },
        { label: 'ASCII only worked on old printers', feedback: 'The problem was the number of characters, not the device.' },
      ],
      hint: 'How many different characters can 7 or 8 bits represent?',
      exp: 'ASCII has 128 codes (256 in extended ASCII): not enough for Chinese, Arabic, Hindi and many other scripts. Unicode has codes for far more characters, including emoji.',
    },
    {
      lv: [3, 5],
      q: 'In ASCII, the character "7" has the code 55. What does this show?',
      a: 'A digit typed as text is stored as a character code, not as the number itself',
      wrong: [
        { label: 'ASCII stores numbers incorrectly', feedback: 'It is correct: "7" as a character simply has its own code.' },
        { label: 'The number 7 is always stored as 55 in a computer', misconception: 'char-is-number', feedback: 'The number 7 is stored as 00000111. Only the character "7" uses code 55.' },
        { label: 'All codes in ASCII are the same as the character', feedback: 'Codes are numbers given to characters; "A" is 65.' },
      ],
      hint: 'Think about the difference between the string "7" and the integer 7.',
      exp: 'Characters (including digit characters) are stored as codes from the character set. The character "7" has code 55, while the number 7 would be stored as binary 111.',
    },
  ],
}

// =====================================================================================================================
// Images
// =====================================================================================================================

const imageCalc = G('data.images.calc', 'data.images', [1, 5], (rng, d) => {
  const kind = rng.pick(d <= 1 ? ['pixels', 'colours'] : d === 2 ? ['pixels', 'colours', 'bits-needed'] : d === 3 ? ['colours', 'bits-needed', 'size-bits'] : d === 4 ? ['size-bits', 'size-bytes'] : ['size-bytes', 'size-kb'])
  if (kind === 'pixels') {
    const w = rng.int(4, 20)
    const h = rng.int(4, 20)
    return num({ prompt: `An image is ${w} pixels wide and ${h} pixels high. How many pixels does it have?`, answer: w * h, suffix: 'pixels', hint: 'It is a grid: width times height.', explanation: `${w} × ${h} = ${w * h} pixels.`, errors: [err(w + h, 'added', 'The pixels form a grid, so multiply.')] })
  }
  if (kind === 'colours') {
    const b = rng.int(1, 8)
    return num({ prompt: `An image has a colour depth of ${b} bit${b === 1 ? '' : 's'}. How many different colours can it use?`, answer: 2 ** b, suffix: 'colours', hint: 'Each extra bit doubles the number of colours.', explanation: `${b} bit${b === 1 ? '' : 's'} give 2^{${b}} = ${2 ** b} colours.`, errors: [err(2 * b, 'times-two', `It is 2^{${b}}, not 2 × ${b}.`)] })
  }
  if (kind === 'bits-needed') {
    const c = rng.pick([3, 4, 5, 7, 8, 12, 16, 20, 30, 60, 100, 200])
    const bits = Math.ceil(Math.log2(c))
    return num({ prompt: `An image uses ${c} different colours. What is the smallest colour depth (bits per pixel) that can store it?`, answer: bits, suffix: 'bits', hint: 'Find the smallest power of 2 that is at least the number of colours.', explanation: `${bits} bits give 2^{${bits}} = ${2 ** bits} colours, which is enough; ${bits - 1} bits would only give ${2 ** (bits - 1)}.`, errors: [err(bits - 1, 'rounded-down', `${bits - 1} bits only give ${2 ** (bits - 1)} colours.`)] })
  }
  const w = rng.pick([8, 10, 16, 20, 32, 40, 50, 64, 100])
  const h = rng.pick([8, 10, 16, 20, 25, 30, 40, 50])
  const b0 = rng.pick([1, 2, 4, 8, 16, 24])
  const b = (w * h * b0) % 8 === 0 ? b0 : 8
  const bits = w * h * b
  if (kind === 'size-bits') {
    return num({ prompt: `An image is ${w} × ${h} pixels with a colour depth of ${b} bit${b === 1 ? '' : 's'}. What is its file size in bits? (Ignore metadata.)`, answer: bits, suffix: 'bits', hint: 'File size = width × height × colour depth.', explanation: `${w} × ${h} × ${b} = ${commas(bits)} bits.`, errors: [err(w * h, 'no-depth', 'Each pixel needs several bits: multiply by the colour depth too.'), err(bits / 8, 'converted', 'That is in bytes; the question asks for bits.')] })
  }
  if (kind === 'size-bytes' || bits % 8000 !== 0) {
    return num({ prompt: `An image is ${w} × ${h} pixels with a colour depth of ${b} bit${b === 1 ? '' : 's'}. What is its file size in bytes? (Ignore metadata.)`, answer: bits / 8, suffix: 'bytes', hint: 'Work out the size in bits (width × height × colour depth), then divide by 8.', explanation: `${w} × ${h} × ${b} = ${commas(bits)} bits. ÷ 8 = ${commas(bits / 8)} bytes.`, errors: [err(bits, 'bits-not-bytes', 'That is in bits. Divide by 8 for bytes.')] })
  }
  return num({ prompt: `An image is ${w} × ${h} pixels with a colour depth of ${b} bits. What is its file size in KB? (Ignore metadata. Use 1 KB = 1000 bytes.)`, answer: bits / 8000, suffix: 'KB', hint: 'Bits = width × height × colour depth. Then ÷ 8 for bytes and ÷ 1000 for KB.', explanation: `${w} × ${h} × ${b} = ${commas(bits)} bits = ${commas(bits / 8)} bytes = ${bits / 8000} KB.`, errors: [err(bits / 8, 'stopped-at-bytes', 'That is bytes: divide by 1000 for KB.')] })
})

const imageFacts: FactSet = {
  skill: 'data.images',
  termNoun: 'term',
  terms: [
    { term: 'Pixel', def: 'A single dot of colour: the smallest part of a bitmap image', hint: 'Short for "picture element".', typed: ['pixels', 'picture element'] },
    { term: 'Resolution', def: 'The number of pixels in an image, given as width × height', hint: 'A "high" one gives a sharper picture.', typed: ['image resolution'] },
    { term: 'Colour depth', def: 'The number of bits used to store the colour of each pixel', hint: 'More of these bits means more possible colours.', typed: ['bit depth', 'colour-depth', 'color depth'] },
    { term: 'Metadata', def: 'Extra data stored with an image, such as its width, height and colour depth', hint: '"Data about data".', typed: ['meta data'] },
  ],
  facts: [
    {
      lv: [2, 4],
      q: 'What happens when the colour depth of an image is increased?',
      a: 'More colours can be shown, but the file size gets bigger',
      wrong: [
        { label: 'More colours can be shown, and the file gets smaller', misconception: 'depth-smaller', feedback: 'Each pixel needs more bits, so the file gets bigger.' },
        { label: 'The image gets more pixels', misconception: 'depth-is-resolution', feedback: 'That is resolution. Colour depth is about bits per pixel.' },
        { label: 'Nothing changes', feedback: 'Colour depth changes how many colours each pixel can be.' },
      ],
      hint: 'Colour depth is bits per pixel.',
      exp: 'More bits per pixel gives more possible colours (2^{bits}), so the image looks more realistic, but every pixel takes more space, so the file is bigger.',
    },
    {
      lv: [3, 5],
      q: 'A photo is enlarged a lot and looks blocky. Why?',
      a: 'It has a low resolution, so each pixel is stretched and becomes visible',
      wrong: [
        { label: 'Its colour depth is too high', misconception: 'depth-is-resolution', feedback: 'A high colour depth gives more colours; it does not make an image blocky.' },
        { label: 'The file has been encrypted', feedback: 'Encryption does not change how an image looks once opened.' },
        { label: 'The screen has run out of colours', feedback: 'The issue is the number of pixels, not colours.' },
      ],
      hint: 'Think about what happens to each dot when the picture is stretched.',
      exp: 'A low-resolution image has few pixels. Enlarging it makes each pixel bigger, so you can see the squares (pixelation).',
    },
    {
      lv: [1, 3],
      q: 'A black-and-white image uses 1 bit per pixel. What could 0 and 1 stand for?',
      a: '0 for white and 1 for black (or the other way round)',
      wrong: [
        { label: '0 for small pixels and 1 for big pixels', feedback: 'All pixels in an image are the same size.' },
        { label: '0 for the first row and 1 for the second row', feedback: 'The bits store colour, not position.' },
        { label: 'Nothing: 1 bit cannot store a colour', feedback: '1 bit can store 2 colours.' },
      ],
      hint: '1 bit has two possible values.',
      exp: '1 bit gives 2 values, enough for 2 colours. A rule such as 1 = black and 0 = white is used.',
    },
  ],
  written: [
    {
      q: 'Explain how a bitmap image is stored as binary, and how resolution and colour depth affect its file size.',
      model: 'A bitmap image is made of a grid of pixels. Each pixel\'s colour is stored as a binary code; the number of bits per pixel is the colour depth. The resolution is the number of pixels (width × height). The file size is roughly width × height × colour depth, so increasing either the resolution or the colour depth makes the file bigger, although the image looks better.',
      checklist: ['Says the image is a grid of pixels', 'Says each pixel\'s colour is a binary code', 'Explains colour depth as bits per pixel', 'Explains resolution as the number of pixels', 'Says that increasing either makes the file bigger'],
      passMark: 3,
    },
  ],
}

// =====================================================================================================================
// Sound
// =====================================================================================================================

const soundCalc = G('data.sound.calc', 'data.sound', [1, 5], (rng, d) => {
  const rate = d <= 2 ? rng.pick([100, 200, 500, 1000]) : rng.pick([1000, 8000, 11025, 22050, 44100])
  const secs = rng.int(2, d <= 3 ? 10 : 60)
  const depth = rng.pick([8, 16])
  if (d <= 2) {
    return num({ prompt: `A sound is sampled ${commas(rate)} times per second (a sample rate of ${commas(rate)} Hz) for ${secs} seconds. How many samples are taken?`, answer: rate * secs, suffix: 'samples', hint: 'Samples per second × seconds.', explanation: `${commas(rate)} × ${secs} = ${commas(rate * secs)} samples.` })
  }
  const bits = rate * secs * depth
  if (d === 3 || (d === 4 && rng.chance(0.5))) {
    return num({ prompt: `A mono sound is recorded for ${secs} seconds with a sample rate of ${commas(rate)} Hz and a bit depth of ${depth} bits. What is its file size in bits?`, answer: bits, suffix: 'bits', hint: 'File size = sample rate × bit depth × seconds.', explanation: `${commas(rate)} × ${depth} × ${secs} = ${commas(bits)} bits.`, errors: [err(rate * secs, 'no-depth', 'Each sample needs several bits: multiply by the bit depth.')] })
  }
  return num({ prompt: `A mono sound is recorded for ${secs} seconds with a sample rate of ${commas(rate)} Hz and a bit depth of ${depth} bits. What is its file size in bytes?`, answer: bits / 8, suffix: 'bytes', hint: 'Work out the bits (sample rate × bit depth × seconds), then divide by 8.', explanation: `${commas(rate)} × ${depth} × ${secs} = ${commas(bits)} bits. ÷ 8 = ${commas(bits / 8)} bytes.`, errors: [err(bits, 'bits-not-bytes', 'That is in bits. Divide by 8.')] })
})

const soundFacts: FactSet = {
  skill: 'data.sound',
  termNoun: 'term',
  terms: [
    { term: 'Sample', def: 'A measurement of the sound wave\'s amplitude (height) at one moment in time', hint: 'Many of these are taken every second.', typed: ['samples'] },
    { term: 'Sample rate', def: 'How many samples are taken every second, measured in hertz (Hz)', hint: 'CD-quality audio uses 44,100 per second.', typed: ['sampling rate', 'sampling frequency', 'sample frequency'] },
    { term: 'Bit depth', def: 'The number of bits used to store each sample', hint: 'More of these bits means each measurement is more precise.', typed: ['sample resolution', 'sample size'] },
    { term: 'Analogue', def: 'A continuously changing signal, like a real sound wave', hint: 'The opposite of digital.', typed: ['analog'] },
  ],
  facts: [
    {
      lv: [2, 4],
      q: 'What is the effect of increasing the sample rate of a recording?',
      a: 'The recording is closer to the original sound, but the file is bigger',
      wrong: [
        { label: 'The recording is quieter', feedback: 'Sample rate is about how often the sound is measured, not volume.' },
        { label: 'The file gets smaller and the quality gets better', misconception: 'rate-smaller', feedback: 'More samples per second means more data, so the file gets bigger.' },
        { label: 'The recording plays faster', feedback: 'It plays at the same speed; there are just more samples per second.' },
      ],
      hint: 'More samples per second means more measurements.',
      exp: 'Taking more samples each second captures the sound wave more accurately, but there is more data to store, so the file is bigger.',
    },
    {
      lv: [1, 3],
      q: 'Why must sound be sampled before a computer can store it?',
      a: 'Sound is analogue, and computers can only store digital (binary) data',
      wrong: [
        { label: 'To make the sound louder', feedback: 'Sampling turns the sound into numbers; it does not change volume.' },
        { label: 'Because microphones only work with computers', feedback: 'Microphones produce an analogue signal.' },
        { label: 'To remove the background noise', feedback: 'Sampling does not remove noise.' },
      ],
      hint: 'Analogue vs digital.',
      exp: 'A sound wave is a continuous analogue signal. Sampling measures it many times a second and stores each measurement as a binary number.',
    },
  ],
}

// =====================================================================================================================
// Binary shifts
// =====================================================================================================================

const shiftGen = G('data.binary-shifts.shift', 'data.binary-shifts', [1, 5], (rng, d) => {
  const left = rng.chance(0.5)
  const places = d <= 2 ? 1 : rng.int(1, 3)
  let n: number
  if (left) n = rng.int(1, Math.floor(255 / 2 ** places))
  else n = rng.int(1, 63) * (d <= 3 ? 2 ** places : 1)
  const res = left ? n << places : n >> places
  const factor = 2 ** places
  const dir = left ? 'left' : 'right'
  if (d <= 3 || rng.chance(0.5)) {
    return text({
      prompt: `Do a ${dir} shift of ${places} place${places > 1 ? 's' : ''} on the 8-bit binary number ${nibbles(toBin(n))}. Give the 8-bit result.`,
      accept: binAccept(res),
      placeholder: '8 bits',
      hint: `Move every bit ${places} place${places > 1 ? 's' : ''} to the ${dir}. Fill the gaps with 0s; bits that fall off the end are lost.`,
      explanation: `${nibbles(toBin(n))} shifted ${dir} ${places} gives ${nibbles(toBin(res))}. In denary ${n} became ${res}: ${left ? `× ${factor}` : `÷ ${factor}${n % factor ? ' (rounded down, as bits fell off the end)' : ''}`}.`,
    })
  }
  return num({
    prompt: `The binary number ${nibbles(toBin(n))} is ${n} in denary. It is shifted ${places} place${places > 1 ? 's' : ''} to the ${dir}. What is the new value in denary?`,
    answer: res,
    hint: `Each place shifted ${left ? 'left multiplies' : 'right divides'} by 2.`,
    explanation: `A ${dir} shift of ${places} ${left ? 'multiplies' : 'divides'} by 2^{${places}} = ${factor}: ${n} ${left ? '×' : '÷'} ${factor} = ${res}${!left && n % factor ? ' (rounded down)' : ''}.`,
    errors: [err(left ? n * 2 * places : n / (2 * places), 'times-places', `Each place is another × 2 (or ÷ 2), so ${places} places is 2^{${places}} = ${factor}.`), err(left ? n >> places : n << places, 'wrong-direction', 'Left shifts multiply; right shifts divide.')],
  })
})

const shiftFacts: FactSet = {
  skill: 'data.binary-shifts',
  facts: [
    {
      lv: [1, 3],
      q: 'What does a binary shift of 1 place to the left do to a number (if no bits are lost)?',
      a: 'Multiplies it by 2',
      wrong: [
        { label: 'Divides it by 2', misconception: 'shift-direction', feedback: 'That is a right shift.' },
        { label: 'Adds 1 to it', feedback: 'Shifting moves every bit to a place worth double.' },
        { label: 'Multiplies it by 10', misconception: 'denary-shift', feedback: 'That is what shifting does in denary. Binary is base 2.' },
      ],
      hint: 'Every bit moves to a column worth twice as much.',
      exp: 'Each bit moves into the next column on the left, which is worth double, so the number doubles.',
    },
    {
      lv: [3, 5],
      q: 'The 8-bit number 1100 0000 is shifted 1 place to the left. Why is the answer wrong?',
      a: 'The leftmost 1 falls off the end, so the result is too big to fit: overflow',
      wrong: [
        { label: 'Left shifts always give wrong answers', feedback: 'They give the right answer as long as no 1s are lost.' },
        { label: 'Because the number is even', feedback: 'Even numbers can be shifted safely if they fit.' },
        { label: 'Because 0s are added on the right', feedback: 'Adding 0s on the right is normal for a left shift.' },
      ],
      hint: '1100 0000 is 192. What is 192 × 2?',
      exp: '192 × 2 = 384, which needs 9 bits. The leftmost 1 is lost, leaving 1000 0000 (128), which is wrong.',
    },
  ],
}

// =====================================================================================================================
// Compression
// =====================================================================================================================

const rle = (s: string): string => {
  let out = ''
  let i = 0
  while (i < s.length) {
    let j = i
    while (s[j] === s[i]) j++
    out += `${j - i}${s[i]}`
    i = j
  }
  return out
}

const rleGen = G('data.compression.rle', 'data.compression', [2, 5], (rng, d) => {
  const chars = rng.shuffle(['W', 'B', 'R', 'G', 'Y'])
  const runs = d <= 2 ? 3 : d === 3 ? 4 : 5
  let s = ''
  let prev = ''
  for (let r = 0; r < runs; r++) {
    const c = (chars.find((x) => x !== prev) ?? 'W') as string
    chars.push(chars.shift() as string)
    s += c.repeat(rng.int(1, d <= 3 ? 6 : 9))
    prev = c
  }
  const enc = rle(s)
  if (d >= 4 && rng.chance(0.5)) {
    return num({
      prompt: `A row of pixels is ${s} (W = white, B = black, R = red, G = green, Y = yellow). Run-length encoding stores each run as a count then a colour, like 4W. How many characters long is the encoded version, compared with ${s.length} characters originally?`,
      answer: enc.length,
      suffix: 'characters',
      hint: 'Encode it first, then count every digit and letter.',
      explanation: `It encodes as ${enc}, which is ${enc.length} characters instead of ${s.length}.`,
    })
  }
  return text({
    prompt: `A row of pixels is ${s}. Use run-length encoding, writing each run as a count followed by the colour letter (for example WWWB becomes 3W1B). What is the encoded row?`,
    accept: [enc, enc.replace(/(\d+)([A-Z])/g, '$1$2 ').trim(), enc.replace(/(\d+)([A-Z])/g, '$1$2, ').replace(/, $/, '')],
    placeholder: 'e.g. 3W1B',
    hint: 'Count how many times each letter repeats in a row before it changes.',
    explanation: `The runs are ${enc.replace(/(\d+)([A-Z])/g, '$1 × $2, ').replace(/, $/, '')}, so the encoding is ${enc}.`,
  })
})

const compressFacts: FactSet = {
  skill: 'data.compression',
  termNoun: 'term',
  terms: [
    { term: 'Compression', def: 'Making a file smaller so it takes up less storage space and is quicker to send', hint: 'Squashing.', typed: ['file compression'] },
    { term: 'Lossy compression', def: 'Makes a file smaller by permanently removing some data, which cannot be got back', hint: 'Something is "lost".', typed: ['lossy'] },
    { term: 'Lossless compression', def: 'Makes a file smaller without losing any data, so the original can be rebuilt exactly', hint: 'Nothing is lost.', typed: ['lossless'] },
    { term: 'Run-length encoding', def: 'A lossless method that stores repeated data as a count and a value, e.g. 5W', hint: 'It counts runs of the same thing.', typed: ['rle', 'run length encoding'] },
  ],
  facts: [
    {
      lv: [2, 4],
      q: 'Which type of file should NOT be compressed with lossy compression?',
      a: 'A computer program or a text document',
      wrong: [
        { label: 'A holiday photo for a website', feedback: 'Photos are often compressed with lossy methods (such as JPEG); a little lost detail is hard to notice.' },
        { label: 'A song for streaming', feedback: 'Music is often compressed with lossy methods (such as MP3).' },
        { label: 'A video clip for social media', feedback: 'Video is usually lossy-compressed to keep it small.' },
      ],
      hint: 'In which file would losing even one character matter?',
      exp: 'If any data is lost from a program or text file, it may not work or will say something different. Those need lossless compression.',
    },
    {
      lv: [3, 5],
      q: 'Which of these file formats uses lossy compression?',
      a: 'JPEG',
      wrong: [
        { label: 'PNG', misconception: 'png-lossy', feedback: 'PNG uses lossless compression.' },
        { label: 'ZIP', feedback: 'ZIP is lossless: the files come back exactly as they were.' },
        { label: 'TXT', feedback: 'A plain text file is not compressed at all.' },
      ],
      hint: 'It is the usual format for photos from a phone camera.',
      exp: 'JPEG (photos) and MP3 (music) are lossy. PNG and ZIP are lossless.',
    },
    {
      lv: [2, 4],
      q: 'Why does run-length encoding work well on simple images such as icons, but badly on photographs?',
      a: 'Icons have long runs of the same colour; photos have few repeated pixels next to each other',
      wrong: [
        { label: 'Photographs are always black and white', feedback: 'Most photos are full colour.' },
        { label: 'Run-length encoding is lossy, and photos cannot lose data', feedback: 'Run-length encoding is lossless.' },
        { label: 'Icons are bigger files than photos', feedback: 'Icons are usually much smaller.' },
      ],
      hint: 'RLE saves space by counting repeats.',
      exp: 'RLE stores "5 white" instead of five separate whites. Photos rarely have long runs of exactly the same colour, so it saves little and can even make the file bigger.',
    },
  ],
  written: [
    {
      q: 'Maya wants to email a long essay and a large holiday photo. Explain which type of compression she should use for each, and why.',
      model: 'For the essay she should use lossless compression, because every word and character must be kept exactly, and lossless compression lets the original be rebuilt perfectly. For the photo she could use lossy compression (such as JPEG), because it makes the file much smaller and the small amount of detail removed is hard for people to notice. A smaller file is quicker to send.',
      checklist: ['Chooses lossless for the essay', 'Explains no data can be lost from text', 'Chooses lossy for the photo', 'Explains lossy gives a smaller file with little visible difference', 'Mentions smaller files are quicker to send or take less space'],
      passMark: 3,
    },
  ],
}

// =====================================================================================================================

export const dataGenerators: ItemGenerator[] = [
  powersValue,
  powersNot,
  powersOrder,
  bitsCalc,
  ...factGenerators(bitsFacts),
  binToDen,
  denToBin,
  denToBinChoice,
  binAdd,
  binOverflow,
  ...factGenerators(addFacts),
  hexConvert,
  ...factGenerators(hexFacts),
  unitsConvert,
  unitsOrder,
  ...factGenerators(unitsFacts),
  charCodes,
  ...factGenerators(charFacts),
  imageCalc,
  ...factGenerators(imageFacts),
  soundCalc,
  ...factGenerators(soundFacts),
  shiftGen,
  ...factGenerators(shiftFacts),
  rleGen,
  ...factGenerators(compressFacts),
]
