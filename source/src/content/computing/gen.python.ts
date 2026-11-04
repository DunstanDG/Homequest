import type { ItemGenerator } from '@/engine/registry'
import type { CommonError, ItemBody } from '@/engine/types'
import { choice, codeFigure, orderItem } from '../kit'
import { at, err, factGenerators, G, num, pickN, text, type FactSet, type Program, type Wrong } from './helpers'
import {
  arithCase,
  assignProgram,
  castProgram,
  compareProgram,
  elifProgram,
  forPrintProgram,
  forSumProgram,
  functionProgram,
  ifProgram,
  inputProgram,
  listProgram,
  logicProgram,
  printProgram,
  rangeText,
  rangeValues,
  sliceProgram,
  stringProgram,
  traceProgram,
  whileProgram,
  WORDS,
} from './programs'

const py = (code: string) => codeFigure(code, 'Python')
const ORD = ['first', 'second', 'third', 'fourth', 'fifth']

/** Accepted typings of one line of printed output. */
function outputAccept(out: string): string[] {
  const acc = [out]
  if (out.startsWith('[')) {
    acc.push(out.replace(/, /g, ','), out.replace(/'/g, '"'), out.replace(/'/g, '"').replace(/, /g, ','))
  }
  return acc
}

/** Ask for the single line a program prints: a number box for whole numbers, typed text otherwise. */
function askOutput(p: Program, a: { prompt?: string; hint: string; explanation: string; errors?: CommonError[]; typedNote?: string }): ItemBody {
  const out = at(p.output, p.output.length - 1)
  const prompt = a.prompt ?? 'What does this program print?'
  if (/^-?\d+$/.test(out)) return num({ prompt, figure: py(p.code), answer: Number(out), hint: a.hint, explanation: a.explanation, errors: a.errors })
  return text({
    prompt: `${prompt}${a.typedNote ? ` ${a.typedNote}` : ' Type it exactly as it would appear.'}`,
    figure: py(p.code),
    accept: outputAccept(out),
    placeholder: 'Type the output',
    hint: a.hint,
    explanation: a.explanation,
  })
}

// =====================================================================================================================
// Output and sequence
// =====================================================================================================================

const PRINT_RULES = 'Text in quotation marks is printed exactly as written. Without quotation marks, Python works the value out first. A comma between items prints a space; + joins two strings with no space; a string times a number repeats it.'

const printLine = G('prog.print.line', 'prog.print', [1, 4], (rng, d) => {
  const p = printProgram(rng, d)
  const k = rng.int(0, p.output.length - 1)
  const out = at(p.output, k)
  return text({
    prompt: `What is the ${ORD[k]} line of output when this program runs?`,
    figure: py(p.code),
    accept: [out],
    placeholder: 'Type the output',
    hint: 'Each print() makes one line of output, in order. Are there quotation marks around it?',
    explanation: `Line ${k + 1} is ${p.code.split('\n')[k]}, which prints ${out}. ${PRINT_RULES}`,
  })
})

const MESSAGES = ['Hello, world!', 'Game over', 'Welcome to Year 8', 'You win!', 'Press start']
const printSyntax = G('prog.print.syntax', 'prog.print', [1, 3], (rng) => {
  const m = rng.pick(MESSAGES)
  return choice({
    rng,
    prompt: `Which line of Python correctly prints: ${m}`,
    correct: `print("${m}")`,
    wrong: [
      { label: `print(${m})`, misconception: 'missing-quotes', feedback: 'Text must be inside quotation marks, or Python treats the words as variable names.' },
      { label: `Print("${m}")`, misconception: 'capital-print', feedback: 'Python is case sensitive: print must be all lower case.' },
      { label: `print "${m}"`, misconception: 'missing-brackets', feedback: 'In Python 3, print needs round brackets.' },
      { label: `print("${m})`, misconception: 'missing-quote', feedback: 'The closing quotation mark is missing.' },
    ],
    hint: 'Check the capital letters, the brackets and the quotation marks.',
    explanation: `print("${m}") is right: lower-case print, round brackets, and the text inside matching quotation marks.`,
  })
})

const printFacts: FactSet = {
  skill: 'prog.print',
  facts: [
    {
      lv: [2, 4],
      q: 'A program has three print statements, one under the other. In what order do their outputs appear?',
      a: 'In the same order as the lines of code, from top to bottom',
      wrong: [
        { label: 'In alphabetical order', feedback: 'Python does not sort output; it runs lines in sequence.' },
        { label: 'In a random order each time', feedback: 'The order is always the same: this is sequence.' },
        { label: 'From the bottom line to the top line', feedback: 'Programs run from the top down.' },
      ],
      hint: 'Think about sequence.',
      exp: 'Statements run in sequence, one after another from the top, so the output appears in the same order.',
    },
    {
      lv: [1, 3],
      q: 'What does print(5 + 3) output?',
      a: '8',
      wrong: [
        { label: '5 + 3', misconception: 'no-quotes-literal', feedback: 'Without quotation marks Python works out the sum. print("5 + 3") would show 5 + 3.' },
        { label: '53', misconception: 'concatenation', feedback: 'These are numbers, not strings, so + adds them.' },
        { label: 'Nothing: it is an error', feedback: 'It is valid Python.' },
      ],
      keepOrder: false,
      hint: 'There are no quotation marks.',
      exp: 'With no quotation marks, Python calculates 5 + 3 and prints 8.',
    },
  ],
}

// =====================================================================================================================
// Variables
// =====================================================================================================================

const varTrace = G('prog.variables.trace', 'prog.variables', [1, 5], (rng, d) => {
  const p = assignProgram(rng, d)
  return askOutput(p, {
    hint: 'Keep a list of each variable\'s value and update it line by line. The right-hand side is worked out first, using the current values.',
    explanation: `Work down the program one line at a time. ${d >= 5 ? 'Once a = b runs, the old value of a is lost unless it was saved first (that is why a temp variable is used to swap). ' : ''}It prints ${at(p.output, 0)}.`,
    typedNote: 'Print with a comma puts a space between the values, e.g. 3 7.',
  })
})

const NAME_CASES: { valid: string; invalid: { label: string; why: string }[] }[] = [
  { valid: 'high_score', invalid: [{ label: '2nd_score', why: 'A variable name cannot start with a digit.' }, { label: 'high score', why: 'A variable name cannot contain a space.' }, { label: 'high-score', why: 'A hyphen is read as a minus sign.' }] },
  { valid: 'player_name', invalid: [{ label: 'player name', why: 'A variable name cannot contain a space.' }, { label: '1player', why: 'A variable name cannot start with a digit.' }, { label: 'class', why: 'class is a Python keyword, so it cannot be a variable name.' }] },
  { valid: 'total2', invalid: [{ label: '2total', why: 'A variable name cannot start with a digit.' }, { label: 'total!', why: 'Names can only use letters, digits and underscores.' }, { label: 'for', why: 'for is a Python keyword.' }] },
  { valid: 'lives_left', invalid: [{ label: 'lives left', why: 'A variable name cannot contain a space.' }, { label: 'lives-left', why: 'A hyphen is read as a minus sign.' }, { label: 'if', why: 'if is a Python keyword.' }] },
]

const varNames = G('prog.variables.names', 'prog.variables', [1, 4], (rng) => {
  const c = rng.pick(NAME_CASES)
  return choice({
    rng,
    prompt: 'Which of these is a valid Python variable name?',
    correct: c.valid,
    wrong: c.invalid.map((x) => ({ label: x.label, misconception: 'invalid-name', feedback: x.why })),
    hint: 'Names can use letters, digits and underscores, cannot start with a digit, and cannot be a keyword like if or for.',
    explanation: `${c.valid} is valid. ${c.invalid.map((x) => `${x.label}: ${x.why}`).join(' ')}`,
  })
})

const CHAINS: string[][] = [
  ['width', 'area', 'total', 'cost'],
  ['score', 'bonus', 'final', 'result'],
  ['price', 'tax', 'bill', 'change'],
]
const varOrder = G('prog.variables.order', 'prog.variables', [2, 4], (rng) => {
  const [v1, v2, v3] = rng.pick(CHAINS)
  const a = rng.int(2, 9)
  const k = rng.int(2, 5)
  const c = rng.int(1, 9)
  const lines = [`${v1} = ${a}`, `${v2} = ${v1} * ${k}`, `${v3} = ${v2} + ${c}`, `print(${v3})`]
  return orderItem({
    rng,
    prompt: `Put these lines in order so the program runs without an error and prints ${(a * k) + c}.`,
    correct: lines,
    direction: ['first line', 'last line'],
    hint: 'A variable has to be given a value before another line can use it.',
    explanation: `${v1} must be set first, then ${v2} uses ${v1}, then ${v3} uses ${v2}, and only then can ${v3} be printed: ${a} × ${k} + ${c} = ${a * k + c}.`,
  })
})

const varFacts: FactSet = {
  skill: 'prog.variables',
  facts: [
    {
      lv: [1, 3],
      q: 'What is a variable?',
      a: 'A named location in memory that stores a value that can change',
      wrong: [
        { label: 'A value that can never change', misconception: 'variable-constant', feedback: 'That is a constant. A variable\'s value can change while the program runs.' },
        { label: 'A mistake in a program', feedback: 'That is a bug.' },
        { label: 'An instruction that repeats', feedback: 'That is a loop.' },
      ],
      hint: 'The word "vary" means change.',
      exp: 'A variable has a name and holds a value in memory. The value can be changed by assigning to it again.',
    },
    {
      lv: [2, 4],
      q: 'In Python, what does the line score = score + 1 do?',
      a: 'Works out score + 1, then stores the result back in score',
      wrong: [
        { label: 'Checks whether score is equal to score + 1', misconception: 'assign-as-equals', feedback: 'A single = is assignment, not a test. A test for equality uses ==.' },
        { label: 'Causes an error, because score cannot equal score + 1', misconception: 'assign-as-equals', feedback: 'It is not an equation: the right-hand side is worked out, then stored.' },
        { label: 'Makes a second variable called score + 1', feedback: 'Variable names cannot contain +.' },
      ],
      hint: 'In Python, = means "becomes", not "is equal to".',
      exp: '= is assignment: Python works out the right-hand side using the current value, then stores it in the variable on the left. So score goes up by 1.',
    },
  ],
}

// =====================================================================================================================
// Data types and casting
// =====================================================================================================================

type TypeName = 'Integer (int)' | 'Float (float)' | 'String (str)' | 'Boolean (bool)'
const TYPE_NAMES: TypeName[] = ['Integer (int)', 'Float (float)', 'String (str)', 'Boolean (bool)']
const TYPE_DEF: Record<TypeName, string> = {
  'Integer (int)': 'An integer is a whole number, like 42 or -7.',
  'Float (float)': 'A float is a number with a decimal point, like 3.14 or 7.0.',
  'String (str)': 'A string is text inside quotation marks, like "Hello" or "42".',
  'Boolean (bool)': 'A Boolean is either True or False.',
}
const LITERALS: [string, TypeName][] = [
  ['42', 'Integer (int)'],
  ['-7', 'Integer (int)'],
  ['1000', 'Integer (int)'],
  ['3.14', 'Float (float)'],
  ['7.0', 'Float (float)'],
  ['0.5', 'Float (float)'],
  ['"42"', 'String (str)'],
  ['"Hello"', 'String (str)'],
  ['"True"', 'String (str)'],
  ['"3.5"', 'String (str)'],
  ['True', 'Boolean (bool)'],
  ['False', 'Boolean (bool)'],
]
const typeLiteral = G('prog.data-types.literal', 'prog.data-types', [1, 4], (rng, d) => {
  const pool = d <= 2 ? LITERALS.filter(([v]) => !['7.0', '"42"', '"True"', '"3.5"'].includes(v)) : LITERALS
  const [v, t] = rng.pick(pool)
  return choice({
    rng,
    prompt: `In Python, what data type is the value ${v}?`,
    correct: t,
    wrong: TYPE_NAMES.filter((x) => x !== t).map((x) => ({ label: x, misconception: `type-${x.split(' ')[0]?.toLowerCase()}`, feedback: TYPE_DEF[x] })),
    keepOrder: true,
    hint: 'Look for quotation marks first, then a decimal point.',
    explanation: `${TYPE_DEF[t]} ${v.startsWith('"') ? 'Anything inside quotation marks is a string, even if it looks like a number or a Boolean.' : ''}`.trim(),
  })
})

const DATA_ITEMS: [string, TypeName, string][] = [
  ['the number of pupils in a class', 'Integer (int)', 'You cannot have half a pupil, so a whole number is right.'],
  ['the number of goals scored in a match', 'Integer (int)', 'Goals are counted in whole numbers.'],
  ['someone\'s age in whole years', 'Integer (int)', 'Whole years means a whole number.'],
  ['the price of a drink in pounds, such as 1.25', 'Float (float)', 'Prices have a decimal point.'],
  ['a person\'s height in metres, such as 1.62', 'Float (float)', 'A measurement with a decimal point is a float.'],
  ['a temperature such as 18.5 °C', 'Float (float)', 'It has a decimal point.'],
  ['a pupil\'s surname', 'String (str)', 'Text is stored as a string.'],
  ['a password', 'String (str)', 'A password can contain letters, digits and symbols, so it is a string.'],
  ['a mobile phone number such as 07700 900123', 'String (str)', 'A phone number is stored as a string: it starts with 0, may contain spaces, and you never do arithmetic with it.'],
  ['whether a pupil has paid for a school trip (yes or no)', 'Boolean (bool)', 'There are only two possible values, so a Boolean fits.'],
  ['whether a light is switched on', 'Boolean (bool)', 'On or off: two values, so a Boolean.'],
]
const typeBest = G('prog.data-types.best', 'prog.data-types', [2, 4], (rng) => {
  const [item, t, why] = rng.pick(DATA_ITEMS)
  return choice({
    rng,
    prompt: `Which data type is most suitable for storing ${item}?`,
    correct: t,
    wrong: TYPE_NAMES.filter((x) => x !== t).map((x) => ({ label: x, misconception: item.includes('phone') && x.startsWith('Integer') ? 'phone-number-as-int' : `type-${x.split(' ')[0]?.toLowerCase()}`, feedback: TYPE_DEF[x] })),
    keepOrder: true,
    hint: 'Is it text, a whole number, a decimal, or one of only two values?',
    explanation: `${t}. ${why}`,
  })
})

const typeCast = G('prog.data-types.cast', 'prog.data-types', [2, 5], (rng, d) => {
  const p = castProgram(rng, d)
  return askOutput(p, {
    hint: 'Work out the data type of each value. "+" adds numbers but joins strings. int() and float() turn strings into numbers; str() turns a number into a string.',
    explanation: `It prints ${at(p.output, 0)}. Strings joined with + are stuck together; numbers are added. int() of a decimal chops off the decimal part, and / always gives a float (so a whole answer shows .0).`,
  })
})

// =====================================================================================================================
// Arithmetic
// =====================================================================================================================

const arithEval = G('prog.arithmetic.eval', 'prog.arithmetic', [1, 5], (rng, d) => {
  const c = arithCase(rng, d)
  const hint = '// divides and rounds down to a whole number; % gives the remainder; ** is "to the power of". Brackets first, then **, then *, /, //, % (left to right), then + and -.'
  const explanation = `${c.expr} gives ${c.printed}.${c.traps.length ? ` ${at(c.traps, 0).msg}` : ''}${c.printed.includes('.') ? ' / always gives a float in Python, so a whole number answer is printed with .0.' : ''}`
  if (c.printed.includes('.')) {
    return text({ prompt: `What does print(${c.expr}) output? Type it exactly as Python would show it.`, accept: [c.printed], hint, explanation, placeholder: 'Type the output' })
  }
  return num({
    prompt: `What does print(${c.expr}) output?`,
    answer: c.value,
    hint,
    explanation,
    errors: c.traps.map((t) => err(t.v, t.tag, t.msg)),
  })
})

const SHARE: { setup: string; each: string; left: string; exact: string }[] = [
  { setup: 'total holds a number of sweets and groups holds the number of friends sharing them', each: 'how many whole sweets each friend gets', left: 'how many sweets are left over after sharing them out equally', exact: 'the exact number of sweets per friend, as a decimal' },
  { setup: 'total holds the number of pupils and groups holds the number of teams', each: 'how many pupils go in each team, as a whole number', left: 'how many pupils are left over when the teams are equal', exact: 'the exact number of pupils per team, as a decimal' },
  { setup: 'total holds a number of minutes and groups holds 60', each: 'how many whole hours that is', left: 'how many minutes are left over after the whole hours', exact: 'the number of hours as a decimal' },
  { setup: 'total holds a number of eggs and groups holds how many eggs fit in one box', each: 'how many boxes can be completely filled', left: 'how many eggs are left over', exact: 'the exact number of boxes needed, as a decimal' },
]
const arithContext = G('prog.arithmetic.context', 'prog.arithmetic', [2, 4], (rng, d) => {
  const s = rng.pick(SHARE)
  const ask = rng.pick(d <= 2 ? ['each', 'left'] : ['each', 'left', 'exact'])
  const label = ask === 'each' ? s.each : ask === 'left' ? s.left : s.exact
  const correct = ask === 'each' ? 'total // groups' : ask === 'left' ? 'total % groups' : 'total / groups'
  const all = ['total // groups', 'total % groups', 'total / groups', 'total * groups']
  const why: Record<string, string> = {
    'total // groups': '// is integer division: how many whole times it goes in.',
    'total % groups': '% (modulo) gives the remainder.',
    'total / groups': '/ gives the exact answer, as a float.',
    'total * groups': '* multiplies; this is a sharing problem.',
  }
  return choice({
    rng,
    prompt: `In a program, ${s.setup}. Which expression gives ${label}?`,
    correct,
    wrong: all.filter((x) => x !== correct).map((x) => ({ label: x, misconception: 'operator-choice', feedback: why[x] })),
    keepOrder: true,
    hint: 'Whole number of times it goes in, the remainder, or the exact decimal?',
    explanation: why[correct] ?? '',
  })
})

const arithFacts: FactSet = {
  skill: 'prog.arithmetic',
  termNoun: 'Python operator',
  terms: [
    { term: '//', def: 'Integer division: divides and rounds down to a whole number', hint: 'Two slashes.' },
    { term: '%', def: 'Modulo: the remainder after dividing', hint: 'It looks like the percentage sign.' },
    { term: '**', def: 'Raises a number to a power (exponent)', hint: 'Two stars.' },
    { term: '/', def: 'Division that gives the exact answer as a float', hint: 'One slash.' },
    { term: '*', def: 'Multiplication', hint: 'Python does not use × for this.' },
  ],
}

// =====================================================================================================================
// Input
// =====================================================================================================================

const inputTrace = G('prog.input.trace', 'prog.input', [1, 5], (rng, d) => {
  const p = inputProgram(rng, d)
  const typed = p.typed.length === 1 ? `The user types ${at(p.typed, 0)}` : `The user types ${p.typed.join(' and then ')}`
  return askOutput(p, {
    prompt: `${typed}. What does the print line output? (Ignore the input prompts.)`,
    hint: 'input() always gives back a string. Is it converted with int() or float() before it is used?',
    explanation: `${p.note} The output is ${at(p.output, 0)}.`,
    errors: p.code.includes('int(') ? undefined : [],
  })
})

const inputFacts: FactSet = {
  skill: 'prog.input',
  facts: [
    {
      lv: [1, 3],
      q: 'What data type does Python\'s input() function always give back?',
      a: 'String',
      wrong: [
        { label: 'Integer', misconception: 'input-is-int', feedback: 'Even if the user types a number, input() gives it back as text. Use int() to convert it.' },
        { label: 'Whatever type the user typed', misconception: 'input-guesses-type', feedback: 'Python does not guess: input() always returns a string.' },
        { label: 'Boolean', feedback: 'input() returns the typed text as a string.' },
      ],
      hint: 'Python cannot know what you meant by what you typed.',
      exp: 'input() always returns a string. To do arithmetic with it, convert it with int() or float().',
    },
    {
      lv: [2, 4],
      q: 'age = input("How old are you? ") followed by print(age + 1). The user types 13. What happens?',
      a: 'An error, because you cannot add a number to a string',
      wrong: [
        { label: 'It prints 14', misconception: 'input-is-int', feedback: 'It would only print 14 if age had been converted with int().' },
        { label: 'It prints 131', misconception: 'concatenation', feedback: 'Joining only works string + string. 1 is an integer, so Python stops with a TypeError.' },
        { label: 'It prints 13', feedback: 'The line does not run successfully.' },
      ],
      hint: 'What type is age? What type is 1?',
      exp: 'age is the string "13". "13" + 1 mixes a string and an integer, which Python does not allow, so the program stops with a runtime error (TypeError). The fix is age = int(input(...)).',
    },
    {
      lv: [3, 5],
      q: 'Which line correctly asks for a price in pounds, such as 2.49, and stores it as a number?',
      a: 'price = float(input("Price: "))',
      wrong: [
        { label: 'price = int(input("Price: "))', misconception: 'int-for-decimal', feedback: 'int() only works on whole-number text; "2.49" would cause an error.' },
        { label: 'price = input("Price: ")', misconception: 'input-is-int', feedback: 'This stores the price as a string, not a number.' },
        { label: 'price = input(float("Price: "))', feedback: 'The brackets are the wrong way round: convert the result of input().' },
      ],
      hint: 'A price has a decimal point.',
      exp: 'float() converts the typed text into a decimal number. It wraps around input(), so the conversion happens to what the user typed.',
    },
  ],
}

// =====================================================================================================================
// Comparison and logical operators
// =====================================================================================================================

const TF_NOTE = 'Type True or False.'
const compareTrace = G('prog.comparison.trace', 'prog.comparison', [1, 5], (rng, d) => {
  const p = compareProgram(rng, d)
  return askOutput(p, {
    hint: '== tests "is equal to", != means "not equal to", >= means "greater than or equal to". Strings must match exactly, including capital letters.',
    explanation: `The comparison is ${at(p.output, 0)}. A comparison always gives a Boolean: True or False. Remember >= and <= include the equal case, and "Cat" == "cat" is False because capitals matter.`,
    typedNote: TF_NOTE,
  })
})

const CONDITIONS: { desc: string; correct: string; wrong: Wrong[] }[] = [
  { desc: 'the score is at least 50', correct: 'score >= 50', wrong: [{ label: 'score > 50', misconception: 'off-by-one', feedback: '> 50 leaves out 50 itself, but "at least 50" includes it.' }, { label: 'score <= 50', feedback: 'That is "at most 50".' }, { label: 'score => 50', misconception: 'operator-order', feedback: 'Python writes >= with the > first; => is not valid.' }] },
  { desc: 'the temperature is below 0', correct: 'temp < 0', wrong: [{ label: 'temp <= 0', misconception: 'off-by-one', feedback: '<= 0 includes 0, which is not below 0.' }, { label: 'temp > 0', feedback: 'That is above 0.' }, { label: 'temp =< 0', misconception: 'operator-order', feedback: '=< is not valid Python; and it would include 0.' }] },
  { desc: 'the answer is exactly 42', correct: 'answer == 42', wrong: [{ label: 'answer = 42', misconception: 'assign-as-equals', feedback: 'A single = assigns a value. To compare, use ==.' }, { label: 'answer != 42', feedback: '!= means "not equal to".' }, { label: 'answer >= 42', feedback: 'That is also true for 43, 44...' }] },
  { desc: 'the password is not "letmein"', correct: 'password != "letmein"', wrong: [{ label: 'password == "letmein"', feedback: '== checks that it IS equal.' }, { label: 'password = "letmein"', misconception: 'assign-as-equals', feedback: 'That assigns a value, it does not compare.' }, { label: 'password =! "letmein"', misconception: 'operator-order', feedback: 'The "not equal" operator is written !=.' }] },
  { desc: 'there are more than 30 pupils', correct: 'pupils > 30', wrong: [{ label: 'pupils >= 30', misconception: 'off-by-one', feedback: '>= 30 includes exactly 30, which is not "more than 30".' }, { label: 'pupils < 30', feedback: 'That is fewer than 30.' }, { label: 'pupils => 30', misconception: 'operator-order', feedback: '=> is not valid Python.' }] },
  { desc: 'the speed is 70 or less', correct: 'speed <= 70', wrong: [{ label: 'speed < 70', misconception: 'off-by-one', feedback: '< 70 leaves out 70 itself.' }, { label: 'speed >= 70', feedback: 'That is 70 or more.' }, { label: 'speed =< 70', misconception: 'operator-order', feedback: '=< is not valid Python: write <=.' }] },
]
const compareCondition = G('prog.comparison.condition', 'prog.comparison', [2, 4], (rng) => {
  const c = rng.pick(CONDITIONS)
  return choice({
    rng,
    prompt: `Which Python condition is True only when ${c.desc}?`,
    correct: c.correct,
    wrong: c.wrong,
    hint: 'Does the description include the boundary value itself or not?',
    explanation: `${c.correct} is right. Watch for the difference between > and >=, and between = (assignment) and == (comparison).`,
  })
})

const compareFacts: FactSet = {
  skill: 'prog.comparison',
  termNoun: 'comparison operator',
  terms: [
    { term: '==', def: 'Is equal to', hint: 'Two equals signs, because one is used for assignment.' },
    { term: '!=', def: 'Is not equal to', hint: 'The exclamation mark means "not".' },
    { term: '>=', def: 'Is greater than or equal to', hint: 'The arrow part comes first.' },
    { term: '<=', def: 'Is less than or equal to', hint: 'The arrow part comes first.' },
    { term: '>', def: 'Is greater than (but not equal to)', hint: 'Just the arrow on its own.' },
    { term: '<', def: 'Is less than (but not equal to)', hint: 'Just the arrow on its own.' },
  ],
}

const logicTrace = G('prog.logical-ops.trace', 'prog.logical-ops', [1, 5], (rng, d) => {
  const p = logicProgram(rng, d)
  return askOutput(p, {
    hint: 'Work out each comparison first (True or False), then apply not, then and, then or.',
    explanation: `It prints ${at(p.output, 0)}. "and" is True only if both sides are True; "or" is True if at least one side is True; "not" flips True and False. Python does not before and, and and before or.`,
    typedNote: TF_NOTE,
  })
})

const LOGIC_CONDS: { desc: string; correct: string; wrong: Wrong[] }[] = [
  { desc: 'x is between 1 and 10, including 1 and 10', correct: 'x >= 1 and x <= 10', wrong: [{ label: 'x >= 1 or x <= 10', misconception: 'or-for-and', feedback: 'With or, every number passes: 50 is >= 1, so the whole thing is True.' }, { label: 'x > 1 and x < 10', misconception: 'off-by-one', feedback: 'That leaves out 1 and 10 themselves.' }, { label: 'x >= 10 and x <= 1', feedback: 'No number is both at least 10 and at most 1.' }] },
  { desc: 'it is the weekend, meaning day is "Sat" or "Sun"', correct: 'day == "Sat" or day == "Sun"', wrong: [{ label: 'day == "Sat" and day == "Sun"', misconception: 'and-for-or', feedback: 'day cannot be two things at once, so this is never True.' }, { label: 'day == "Sat" or "Sun"', misconception: 'or-shortcut', feedback: 'Each side of or must be a full comparison: day == "Sun".' }, { label: 'not day == "Sat"', feedback: 'That is True on every day except Saturday.' }] },
  { desc: 'a ticket is free: age is under 5 or age is 65 or over', correct: 'age < 5 or age >= 65', wrong: [{ label: 'age < 5 and age >= 65', misconception: 'and-for-or', feedback: 'No one is both under 5 and 65 or over.' }, { label: 'age <= 5 or age > 65', misconception: 'off-by-one', feedback: 'That wrongly includes 5 and wrongly leaves out 65.' }, { label: 'age > 5 and age < 65', feedback: 'That describes people who pay.' }] },
  { desc: 'the user is logged in and is NOT banned (logged_in and banned are Booleans)', correct: 'logged_in and not banned', wrong: [{ label: 'logged_in or not banned', misconception: 'or-for-and', feedback: 'With or, a banned user who is logged in would get through.' }, { label: 'not logged_in and banned', feedback: 'That is the opposite of what is wanted.' }, { label: 'logged_in and banned', feedback: 'That lets in only banned users.' }] },
]
const logicCondition = G('prog.logical-ops.condition', 'prog.logical-ops', [2, 4], (rng) => {
  const c = rng.pick(LOGIC_CONDS)
  return choice({
    rng,
    prompt: `Which condition is True exactly when ${c.desc}?`,
    correct: c.correct,
    wrong: c.wrong,
    hint: 'Do BOTH things need to be true (and), or is ONE enough (or)? Test it with an example value.',
    explanation: `${c.correct}. Try a value inside and a value outside the range to check each option.`,
  })
})

const logicFacts: FactSet = {
  skill: 'prog.logical-ops',
  facts: [
    {
      lv: [1, 3],
      q: 'When is the condition "A and B" True?',
      a: 'Only when A and B are both True',
      wrong: [
        { label: 'When at least one of them is True', misconception: 'and-as-or', feedback: 'That describes or.' },
        { label: 'When both are False', feedback: 'If both are False, "A and B" is False.' },
        { label: 'Always', feedback: '"and" needs both sides to be True.' },
      ],
      hint: '"I will go out if it is sunny and I have finished my homework."',
      exp: '"and" is True only when both sides are True.',
    },
    {
      lv: [1, 3],
      q: 'When is the condition "A or B" True?',
      a: 'When at least one of A and B is True',
      wrong: [
        { label: 'Only when both are True', misconception: 'or-as-and', feedback: 'That describes and.' },
        { label: 'Only when exactly one is True', misconception: 'or-as-xor', feedback: 'In Python, or is also True when both sides are True.' },
        { label: 'Never', feedback: '"or" is True if either side is True.' },
      ],
      hint: 'One side being True is enough.',
      exp: '"or" is True if A is True, or B is True, or both.',
    },
  ],
}

// =====================================================================================================================
// Selection
// =====================================================================================================================

const ifTrace = G('prog.if-else.trace', 'prog.if-else', [1, 5], (rng, d) => {
  const p = ifProgram(rng, d)
  const typed = d >= 3 ? `The user types ${p.value}. ` : ''
  const res = at(p.output, 0)
  return text({
    prompt: `${typed}What does this program print? (Type just the words, without quotation marks.)`,
    figure: py(p.code),
    accept: [res],
    placeholder: 'Type the output',
    hint: `Put ${p.value} into the condition. Is "${p.value} ${p.op} ${p.threshold}" True or False?`,
    explanation: `${p.value} ${p.op} ${p.threshold} is ${p.res ? 'True, so the indented line under if runs' : 'False, so the line under else runs'}: ${res}. ${p.op === '>=' || p.op === '<=' ? 'Remember >= and <= include the equal case.' : p.op === '>' || p.op === '<' ? 'Remember > and < do not include the equal case.' : ''}`.trim(),
  })
})

const ifBoundary = G('prog.if-else.boundary', 'prog.if-else', [3, 5], (rng) => {
  const t = rng.int(10, 90)
  const op = rng.pick(['>', '>=', '<', '<='] as const)
  const v = rng.pick(['score', 'points', 'marks'])
  const smallest = op === '>' || op === '>='
  const ans = op === '>' ? t + 1 : op === '>=' ? t : op === '<' ? t - 1 : t
  const code = `if ${v} ${op} ${t}:\n    print("Winner")\nelse:\n    print("Not this time")`
  return num({
    prompt: `${v} is always a whole number. What is the ${smallest ? 'smallest' : 'largest'} value of ${v} that makes this print Winner?`,
    figure: py(code),
    answer: ans,
    hint: 'Does the operator include the equal case or not?',
    explanation: `${op} ${op.length === 2 ? 'includes' : 'does not include'} ${t} itself, so the ${smallest ? 'smallest' : 'largest'} whole number that works is ${ans}.`,
    errors: [err(op.length === 2 ? (smallest ? t + 1 : t - 1) : t, 'off-by-one', op.length === 2 ? `${op} includes ${t} itself.` : `${op} does not include ${t} itself.`)],
  })
})

const ifSyntax = G('prog.if-else.syntax', 'prog.if-else', [1, 3], (rng) => {
  const v = rng.pick(['age', 'score', 'lives', 'speed'])
  const n = rng.int(3, 50)
  return choice({
    rng,
    prompt: `Which is a correctly written first line of an if statement in Python, checking whether ${v} is more than ${n}?`,
    correct: `if ${v} > ${n}:`,
    wrong: [
      { label: `if ${v} > ${n}`, misconception: 'missing-colon', feedback: 'The line must end with a colon.' },
      { label: `If ${v} > ${n}:`, misconception: 'capital-keyword', feedback: 'Python keywords are lower case: if, not If.' },
      { label: `if ${v} = ${n}:`, misconception: 'assign-as-equals', feedback: '= is assignment, and it does not mean "more than".' },
      { label: `if (${v} > ${n}) then`, misconception: 'pseudocode-then', feedback: 'Python does not use THEN; it uses a colon.' },
    ],
    hint: 'Python: lower-case keyword, a condition, then a colon.',
    explanation: `if ${v} > ${n}: is correct. The code to run if it is True goes on the next lines, indented.`,
  })
})

const ifFacts: FactSet = {
  skill: 'prog.if-else',
  facts: [
    {
      lv: [2, 4],
      q: 'In Python, how do you show which lines belong inside an if statement?',
      a: 'Indent them (usually by four spaces) under the if line',
      wrong: [
        { label: 'Put them inside curly brackets', misconception: 'braces', feedback: 'Some languages use brackets for this, but Python uses indentation.' },
        { label: 'Write ENDIF after them', misconception: 'pseudocode-endif', feedback: 'ENDIF is pseudocode. Python uses indentation.' },
        { label: 'Put them all on the same line as if', feedback: 'Python uses indentation to group lines.' },
      ],
      hint: 'Look at the spaces at the start of the lines.',
      exp: 'Python uses indentation to show which lines are inside the if (and which are inside else).',
    },
    {
      lv: [1, 3],
      q: 'In an if... else statement, how many of the two branches run?',
      a: 'Exactly one: the if branch when the condition is True, otherwise the else branch',
      wrong: [
        { label: 'Both, one after the other', misconception: 'both-branches', feedback: 'Only one branch runs each time.' },
        { label: 'Neither, unless there is a loop', feedback: 'One branch always runs.' },
        { label: 'It depends how many lines are in each', feedback: 'The number of lines does not matter.' },
      ],
      hint: 'It is a choice between two paths.',
      exp: 'Selection picks one path. If the condition is True the if branch runs; otherwise the else branch runs.',
    },
  ],
}

const elifTrace = G('prog.elif.trace', 'prog.elif', [1, 5], (rng, d) => {
  const p = elifProgram(rng, d)
  const labels = [...p.code.matchAll(/print\("([^"]+)"\)/g)].map((m) => m[1] ?? '')
  const out = at(p.output, 0)
  return choice({
    rng,
    prompt: 'What does this program print?',
    figure: py(p.code),
    correct: out,
    wrong: labels.filter((l) => l !== out).map((l) => ({ label: l, misconception: p.bug ? 'elif-order' : 'elif-boundary', feedback: 'Python checks the conditions from the top, and only the FIRST one that is True runs. The rest are skipped.' })),
    hint: `Start at the top. Check each condition with ${p.value} until one is True.`,
    explanation: `Going from the top, the first condition that is True for ${p.value} prints ${out}. ${p.bug ? 'Because the lowest boundary is checked first, high values are caught by the first condition: the order of elif conditions matters.' : '>= includes the boundary value itself.'}`,
  })
})

const elifFacts: FactSet = {
  skill: 'prog.elif',
  facts: [
    {
      lv: [1, 3],
      q: 'In an if... elif... else statement, what happens when the first True condition is found?',
      a: 'That branch runs and all the remaining branches are skipped',
      wrong: [
        { label: 'Every branch with a True condition runs', misconception: 'all-true-run', feedback: 'Only the first True branch runs.' },
        { label: 'The else branch also runs', misconception: 'else-always', feedback: 'else only runs if no condition was True.' },
        { label: 'Python checks the remaining conditions, then picks the last True one', feedback: 'Python stops checking as soon as one is True.' },
      ],
      hint: 'elif is short for "else if".',
      exp: 'Python checks the conditions in order. The first True one runs, and the rest are skipped. else only runs if none were True.',
    },
    {
      lv: [2, 4],
      q: 'Why is it often better to use elif instead of several separate if statements when choosing a grade?',
      a: 'Only one branch can run, so a mark cannot get two grades',
      wrong: [
        { label: 'elif runs faster because it is shorter to type', feedback: 'Typing length is not the reason.' },
        { label: 'Separate if statements are not allowed in Python', feedback: 'They are allowed; they just all get checked.' },
        { label: 'elif makes every condition get checked', misconception: 'all-true-run', feedback: 'It is the other way round: separate ifs are all checked.' },
      ],
      hint: 'With separate ifs, a mark of 90 could pass the test for A and the test for B.',
      exp: 'Separate if statements are each checked, so more than one could print. With elif, only the first True branch runs.',
    },
  ],
}

// =====================================================================================================================
// Loops
// =====================================================================================================================

const forList = G('prog.for-range.list', 'prog.for-range', [1, 5], (rng, d) => {
  const p = forPrintProgram(rng, d)
  const vals = p.output
  const inclusive = rangeValues(p.a, p.b + (p.s > 0 ? 1 : -1), p.s).map(String)
  const fromOne = p.a === 0 ? rangeValues(1, p.b + 1, p.s).map(String) : rangeValues(p.a + 1, p.b + 1, p.s).map(String)
  const stepOne = rangeValues(p.a, p.b, p.s > 0 ? 1 : -1).map(String)
  const join = (xs: string[]) => (xs.length ? xs.join(', ') : 'Nothing is printed')
  return choice({
    rng,
    prompt: 'This loop prints one number per line. Which numbers does it print, in order?',
    figure: py(p.code),
    correct: join(vals),
    wrong: [
      { label: join(inclusive), misconception: 'range-inclusive', feedback: 'range() stops BEFORE the end value: the end value is never included.' },
      { label: join(fromOne), misconception: 'range-off-by-one', feedback: 'range() starts at the start value (0 if only one number is given).' },
      ...(p.s !== 1 ? [{ label: join(stepOne), misconception: 'ignored-step', feedback: `The third number is the step: it goes up (or down) by ${Math.abs(p.s)} each time.` }] : []),
      { label: join([...vals].reverse()), feedback: 'The loop counts in the direction of the step.' },
    ],
    hint: `${rangeText(p.a, p.b, p.s)} starts at ${p.a}, moves by ${p.s} each time, and stops before reaching ${p.b}.`,
    explanation: `${rangeText(p.a, p.b, p.s)} gives ${join(vals)}. It starts at ${p.a} and stops before ${p.b}.`,
  })
})

const forCount = G('prog.for-range.count', 'prog.for-range', [1, 4], (rng, d) => {
  const a = d <= 1 ? 0 : rng.int(0, 6)
  const s = d >= 4 ? rng.pick([2, 3, 5]) : 1
  const b = a + rng.int(4, 15)
  const n = rangeValues(a, b, s).length
  const w = rng.pick(['Hip hip hooray!', 'Hello', 'Again!', 'Ping'])
  const code = `for i in ${rangeText(a, b, s)}:\n    print("${w}")`
  return num({
    prompt: `How many times does this program print "${w}"?`,
    figure: py(code),
    answer: n,
    suffix: 'times',
    hint: s === 1 ? `range(start, stop) runs stop - start times: it includes the start but not the stop.` : 'List the values of i, going up in steps, stopping before the end value.',
    explanation: `i takes the values ${rangeValues(a, b, s).join(', ')}: that is ${n} values, so it prints ${n} times.`,
    errors: [err(n + 1, 'range-inclusive', 'The stop value is not included, so there is one fewer than that.'), err(b, 'range-stop-as-count', `The loop does not start at 0${a === 0 ? '' : ` here: it starts at ${a}`}.`)],
  })
})

const forSum = G('prog.for-range.sum', 'prog.for-range', [2, 5], (rng, d) => {
  const p = forSumProgram(rng, d)
  if (p.output.length > 1) {
    return num({
      prompt: 'How many lines of output does this program print?',
      figure: py(p.code),
      answer: p.output.length,
      suffix: 'lines',
      hint: 'range(n) runs n times, starting at 0.',
      explanation: `range(${p.output.length}) gives 0 to ${p.output.length - 1}, which is ${p.output.length} values, so ${p.output.length} lines.`,
      errors: [err(p.output.length - 1, 'range-zero', 'range(n) starts at 0, so it runs n times, not n - 1.')],
    })
  }
  return askOutput(p, {
    hint: 'Make a trace table with a column for i and a column for each variable. Remember range() stops before its end value.',
    explanation: `Tracing the loop gives ${at(p.output, 0)}. ${p.code.includes('x = i') ? 'After the loop ends, x keeps the value from the last time round, when i was one less than the stop value.' : 'range() never includes the stop value.'}`,
  })
})

const forWhich = G('prog.for-range.which', 'prog.for-range', [2, 4], (rng) => {
  const n = rng.int(5, 20)
  return choice({
    rng,
    prompt: `Which loop prints the whole numbers from 1 to ${n}, including ${n}?`,
    correct: `for i in range(1, ${n + 1}):`,
    wrong: [
      { label: `for i in range(1, ${n}):`, misconception: 'range-inclusive', feedback: `This stops at ${n - 1}, because range() never includes the stop value.` },
      { label: `for i in range(${n}):`, misconception: 'range-zero', feedback: `This prints 0 to ${n - 1}.` },
      { label: `for i in range(0, ${n + 1}):`, misconception: 'range-zero', feedback: 'This starts at 0.' },
    ],
    hint: 'range(start, stop) includes start but stops just before stop.',
    explanation: `range(1, ${n + 1}) gives 1, 2, ..., ${n}. The stop value must be one more than the last number you want.`,
  })
})

const whileTrace = G('prog.while.trace', 'prog.while', [1, 5], (rng, d) => {
  const p = whileProgram(rng, d)
  if (p.output.length > 1) {
    const ask = rng.chance(0.5)
    if (ask) {
      return num({
        prompt: 'What is the last number this program prints?',
        figure: py(p.code),
        answer: Number(at(p.output, -1)),
        hint: 'The condition is checked at the start of each time round. Write down n each time.',
        explanation: `It prints ${p.output.join(', ')}. After ${at(p.output, -1)} is printed, n becomes 0 or less, so the condition n > 0 is False and the loop stops.`,
      })
    }
    return num({
      prompt: 'How many numbers does this program print?',
      figure: py(p.code),
      answer: p.output.length,
      hint: 'Write down n each time round, and stop when n > 0 is False.',
      explanation: `It prints ${p.output.join(', ')}: ${p.output.length} numbers.`,
      errors: [err(p.output.length + 1, 'off-by-one', 'The loop stops as soon as n is no longer greater than 0; that value is not printed.')],
    })
  }
  return askOutput(p, {
    hint: 'Check the condition before each time round. Keep a trace table of every variable.',
    explanation: `The loop body runs ${p.loops} times, then the condition becomes False. The program prints ${at(p.output, 0)}.`,
    typedNote: 'Print with a comma puts a space between the values.',
  })
})

const whileInfinite = G('prog.while.infinite', 'prog.while', [3, 5], (rng) => {
  const letters = ['A', 'B', 'C', 'D']
  const lim = rng.int(4, 9)
  const ok = [
    `count = 0\nwhile count < ${lim}:\n    count = count + 1`,
    `n = ${lim + 5}\nwhile n > 0:\n    n = n - 2`,
    `x = 1\nwhile x < ${lim * 10}:\n    x = x * 2`,
    `total = 0\nwhile total <= ${lim * 3}:\n    total = total + 3`,
  ]
  const bad = rng.pick([
    { code: `count = 0\nwhile count < ${lim}:\n    print(count)`, why: 'count is never changed inside the loop, so count < ' + lim + ' stays True forever.' },
    { code: `n = 1\nwhile n > 0:\n    n = n + 1`, why: 'n keeps getting bigger, so n > 0 is always True.' },
    { code: `x = 0\nwhile x != ${lim * 2 + 1}:\n    x = x + 2`, why: `x goes 0, 2, 4, ... and only ever holds even numbers, so it never equals ${lim * 2 + 1}.` },
  ])
  const goods = pickN(rng, ok, 3)
  const pos = rng.int(0, 3)
  const loops = [...goods]
  loops.splice(pos, 0, bad.code)
  const code = loops.map((c, i) => `# Loop ${letters[i]}\n${c}`).join('\n\n')
  const correct = `Loop ${letters[pos]}`
  return choice({
    rng,
    prompt: 'Which of these loops never stops (an infinite loop)?',
    figure: py(code),
    correct,
    wrong: letters.filter((_l, i) => i !== pos).map((l) => ({ label: `Loop ${l}`, misconception: 'infinite-loop', feedback: 'Trace it: the variable changes each time and the condition eventually becomes False.' })),
    keepOrder: true,
    hint: 'For each loop: does the variable in the condition change, and does it move towards making the condition False?',
    explanation: `${correct}: ${bad.why}`,
  })
})

const whileFacts: FactSet = {
  skill: 'prog.while',
  facts: [
    {
      lv: [1, 3],
      q: 'When does a while loop stop repeating?',
      a: 'When its condition is checked and is False',
      wrong: [
        { label: 'After it has run 10 times', feedback: 'There is no fixed number: it depends on the condition.' },
        { label: 'As soon as the condition becomes True', misconception: 'while-until', feedback: 'A while loop keeps going WHILE the condition is True.' },
        { label: 'Never: while loops always run forever', feedback: 'Only if the condition never becomes False.' },
      ],
      hint: 'Read it in English: "while this is true, keep going".',
      exp: 'The condition is checked before each time round. While it is True the loop repeats; once it is False the loop ends.',
    },
    {
      lv: [2, 4],
      q: 'A game keeps asking a question until the player gets it right. Why is a while loop better than a for loop here?',
      a: 'You do not know in advance how many attempts the player will need',
      wrong: [
        { label: 'for loops cannot contain input()', feedback: 'They can; the issue is the number of repeats.' },
        { label: 'while loops always run faster', feedback: 'Speed is not the reason.' },
        { label: 'for loops can only count up to 10', feedback: 'for loops can count to any number.' },
      ],
      hint: 'Could you write range(...) before the game starts?',
      exp: 'A for loop repeats a fixed number of times. When the number of repeats depends on what happens (a condition), use a while loop.',
    },
  ],
}

// =====================================================================================================================
// Strings and slicing
// =====================================================================================================================

const stringTrace = G('prog.strings.trace', 'prog.strings', [1, 5], (rng, d) => {
  const p = stringProgram(rng, d)
  const letters = [...p.word].map((c, i) => `${i}=${c}`).join(', ')
  return askOutput(p, {
    hint: 'Positions start at 0. word[-1] is the last character. len() counts every character.',
    explanation: `In "${p.word}" the positions are ${letters}. The program prints ${at(p.output, 0)}.`,
  })
})

const stringIndex = G('prog.strings.index', 'prog.strings', [1, 4], (rng, d) => {
  const w = rng.pick(WORDS.filter((x) => new Set(x).size === x.length || d >= 3))
  const i = rng.int(1, w.length - 2)
  const ch = w[i] ?? ''
  const wrong: Wrong[] = [
    { label: w[i - 1] ?? '', misconception: 'index-from-one', feedback: 'Python counts positions from 0, not 1.' },
    { label: w[i + 1] ?? '', feedback: 'Count again from position 0.' },
    { label: w.slice(0, i + 1), feedback: 'An index gives a single character, not the start of the word.' },
  ]
  return choice({
    rng,
    prompt: `word = "${w}". What is word[${i}]?`,
    correct: ch,
    wrong: wrong.filter((x) => typeof x !== 'string' && x.label !== ch && x.label !== ''),
    hint: 'The first character is word[0].',
    explanation: `Counting from 0: ${[...w].map((c, k) => `${k}=${c}`).join(', ')}. So word[${i}] is "${ch}".`,
  })
})

const stringFacts: FactSet = {
  skill: 'prog.strings',
  facts: [
    {
      lv: [2, 4],
      q: 'word = "cat". What happens with print(word[3])?',
      a: 'An error, because the positions are only 0, 1 and 2',
      wrong: [
        { label: 'It prints t', misconception: 'index-from-one', feedback: 't is at position 2. Position 3 does not exist.' },
        { label: 'It prints nothing', feedback: 'Python does not print nothing: it stops with an IndexError.' },
        { label: 'It prints c', feedback: 'Python does not wrap back to the start.' },
      ],
      hint: 'len("cat") is 3, but positions start at 0.',
      exp: 'A string of length 3 has positions 0, 1 and 2. word[3] is out of range, so Python stops with an IndexError (a runtime error).',
    },
    {
      lv: [1, 3],
      q: 'What does concatenation mean?',
      a: 'Joining strings together end to end',
      wrong: [
        { label: 'Splitting a string into single letters', feedback: 'Concatenation is joining, not splitting.' },
        { label: 'Counting the characters in a string', feedback: 'That is what len() does.' },
        { label: 'Turning a string into a number', feedback: 'That is casting, e.g. int("5").' },
      ],
      hint: 'In Python it is done with +.',
      exp: 'Concatenation joins strings: "foot" + "ball" gives "football". Note that no space is added.',
    },
  ],
}

const sliceTrace = G('prog.slicing.trace', 'prog.slicing', [2, 5], (rng, d) => {
  const p = sliceProgram(rng, d)
  return askOutput(p, {
    hint: 'word[a:b] starts at position a and stops BEFORE position b. A missing start means "from the beginning"; a missing end means "to the end".',
    explanation: `"${p.word}" has positions ${[...p.word].map((c, k) => `${k}=${c}`).join(', ')}. The slice gives ${at(p.output, 0)}.`,
  })
})

const sliceChoice = G('prog.slicing.choice', 'prog.slicing', [1, 4], (rng) => {
  const w = rng.pick(WORDS.filter((x) => x.length >= 6))
  const a = rng.int(1, 2)
  const b = a + rng.int(2, 3)
  const correct = w.slice(a, b)
  return choice({
    rng,
    prompt: `word = "${w}". What is word[${a}:${b}]?`,
    correct,
    wrong: [
      { label: w.slice(a, b + 1), misconception: 'slice-inclusive', feedback: 'The slice stops BEFORE the end position.' },
      { label: w.slice(a - 1, b - 1), misconception: 'index-from-one', feedback: 'Positions start at 0.' },
      { label: w.slice(a - 1, b), misconception: 'index-from-one', feedback: 'Count from 0: the first letter is position 0.' },
    ],
    hint: `It starts at position ${a} and stops before position ${b}, so it has ${b - a} characters.`,
    explanation: `Positions: ${[...w].map((c, k) => `${k}=${c}`).join(', ')}. word[${a}:${b}] takes positions ${a} to ${b - 1}: "${correct}".`,
  })
})

const sliceFacts: FactSet = {
  skill: 'prog.slicing',
  facts: [
    {
      lv: [2, 4],
      q: 'word = "keyboard". Which slice gives "key"?',
      a: 'word[0:3]',
      wrong: [
        { label: 'word[1:3]', misconception: 'index-from-one', feedback: 'That gives "ey": positions start at 0.' },
        { label: 'word[0:2]', misconception: 'slice-inclusive', feedback: 'That gives "ke": the end position is not included.' },
        { label: 'word[3]', feedback: 'That is a single character: "b".' },
      ],
      hint: 'You want positions 0, 1 and 2.',
      exp: 'word[0:3] takes positions 0, 1 and 2: "key". word[:3] does the same.',
    },
    {
      lv: [3, 5],
      q: 'word = "computer". Which gives the last three letters, "ter"?',
      a: 'word[-3:]',
      wrong: [
        { label: 'word[-3]', feedback: 'That is just one character: "t".' },
        { label: 'word[5:7]', misconception: 'slice-inclusive', feedback: 'That gives "te": the end position is not included.' },
        { label: 'word[3:]', feedback: 'That gives "puter".' },
      ],
      hint: 'Negative positions count from the end. Leaving out the end means "to the end".',
      exp: 'word[-3:] starts 3 from the end and goes to the end: "ter". word[5:] or word[5:8] would also work.',
    },
  ],
}

// =====================================================================================================================
// Random numbers
// =====================================================================================================================

const randomCount = G('prog.random.count', 'prog.random', [1, 4], (rng, d) => {
  const a = d <= 2 ? 1 : rng.int(0, 10)
  const b = a + rng.int(3, 20)
  return num({
    prompt: `How many different values can random.randint(${a}, ${b}) give?`,
    answer: b - a + 1,
    suffix: 'values',
    hint: 'randint includes BOTH end values.',
    explanation: `randint(${a}, ${b}) can give any whole number from ${a} to ${b}, including both: ${b} - ${a} + 1 = ${b - a + 1} values.`,
    errors: [err(b - a, 'randint-exclusive', 'Unlike range(), randint includes the end value too.')],
  })
})

const randomNot = G('prog.random.not', 'prog.random', [2, 5], (rng) => {
  const a = rng.int(0, 5)
  const b = a + rng.int(4, 10)
  const out = rng.pick([a - 1, b + 1])
  return choice({
    rng,
    prompt: `Which number could random.randint(${a}, ${b}) NOT produce?`,
    correct: String(out),
    wrong: [
      { label: String(b), misconception: 'randint-exclusive', feedback: `randint includes the end value, so ${b} is possible.` },
      { label: String(a), feedback: `${a} is the start value, which is included.` },
      { label: String(Math.floor((a + b) / 2)), feedback: 'Any whole number between the two ends is possible.' },
    ],
    hint: 'randint(a, b) gives whole numbers from a to b, both included.',
    explanation: `randint(${a}, ${b}) gives ${a} to ${b} inclusive, so ${out} is impossible.`,
  })
})

const randomFacts: FactSet = {
  skill: 'prog.random',
  facts: [
    {
      lv: [1, 4],
      q: 'Which line simulates rolling a normal six-sided dice?',
      a: 'roll = random.randint(1, 6)',
      wrong: [
        { label: 'roll = random.randint(1, 7)', misconception: 'randint-exclusive', feedback: 'randint includes the end value, so this could give 7.' },
        { label: 'roll = random.randint(0, 6)', feedback: 'This could give 0, and has 7 possible values.' },
        { label: 'roll = random.randint(0, 5)', feedback: 'This gives six values, but 0 to 5 rather than 1 to 6.' },
      ],
      hint: 'A dice shows 1 to 6.',
      exp: 'randint(1, 6) gives a whole number from 1 to 6, including both ends.',
    },
    {
      lv: [1, 3],
      q: 'What must a Python program do before it can use random.randint?',
      a: 'import random',
      wrong: [
        { label: 'Nothing: it is always available', feedback: 'randint is in the random module, which must be imported.' },
        { label: 'install random', feedback: 'The random module comes with Python; it just needs importing.' },
        { label: 'print(random)', feedback: 'That would not make randint available.' },
      ],
      hint: 'The random module has to be brought in.',
      exp: 'Put import random at the top of the program. Then random.randint(a, b) can be used.',
    },
    {
      lv: [2, 5],
      q: 'colours = ["red", "green", "blue"]. What does random.choice(colours) do?',
      a: 'Picks one item from the list at random',
      wrong: [
        { label: 'Shuffles the list into a random order', feedback: 'That is random.shuffle.' },
        { label: 'Returns a random number from 0 to 2', feedback: 'It returns an item, not a position.' },
        { label: 'Lets the user choose a colour', feedback: 'No input is involved; the computer picks.' },
      ],
      hint: 'Think "choose one".',
      exp: 'random.choice returns one item from the list, picked at random, such as "green".',
    },
  ],
}

// =====================================================================================================================
// Errors
// =====================================================================================================================

type ErrType = 'Syntax error' | 'Logic error' | 'Runtime error'
const ERR_DEF: Record<ErrType, string> = {
  'Syntax error': 'A syntax error breaks the rules of the language, so the program cannot run at all.',
  'Logic error': 'A logic error lets the program run, but it gives the wrong result.',
  'Runtime error': 'A runtime error happens while the program is running and makes it crash.',
}
const ERR_CASES: { t: ErrType; code: string; why: string }[] = [
  { t: 'Syntax error', code: 'print("Hello)', why: 'The closing quotation mark is missing.' },
  { t: 'Syntax error', code: 'if score > 10\n    print("Well done")', why: 'The colon at the end of the if line is missing.' },
  { t: 'Syntax error', code: 'print("Total:", total', why: 'The closing bracket is missing.' },
  { t: 'Syntax error', code: 'while x < 10\n    x = x + 1', why: 'The colon at the end of the while line is missing.' },
  { t: 'Syntax error', code: 'if age = 13:\n    print("Teenager")', why: 'A comparison needs ==; a single = here breaks the rules.' },
  { t: 'Logic error', code: '# Should print the numbers 1 to 10\nfor i in range(1, 10):\n    print(i)', why: 'It runs, but stops at 9, because range() does not include the stop value.' },
  { t: 'Logic error', code: '# Should work out the average of a and b\naverage = a + b / 2', why: 'It runs, but divides only b by 2. It should be (a + b) / 2.' },
  { t: 'Logic error', code: '# Should check for 18 or over\nif age > 18:\n    print("Adult")', why: 'It runs, but 18-year-olds are left out: it should be >= 18.' },
  { t: 'Logic error', code: '# Should work out the area of a rectangle\narea = width + height', why: 'It runs, but adds instead of multiplying.' },
  { t: 'Runtime error', code: 'print(10 / 0)', why: 'Dividing by zero crashes the program (ZeroDivisionError).' },
  { t: 'Runtime error', code: 'names = ["Ali", "Bea", "Cal"]\nprint(names[3])', why: 'There is no position 3 (only 0, 1 and 2), so it crashes (IndexError).' },
  { t: 'Runtime error', code: 'age = int("twelve")', why: 'int() cannot turn "twelve" into a number, so it crashes (ValueError).' },
  { t: 'Runtime error', code: 'print("Age: " + 13)', why: 'You cannot join a string and an integer with +, so it crashes (TypeError).' },
]
const ERR_TYPES: ErrType[] = ['Syntax error', 'Logic error', 'Runtime error']

const errorClassify = G('prog.errors.classify', 'prog.errors', [1, 5], (rng, d) => {
  const pool = d <= 2 ? ERR_CASES.filter((c) => !c.code.includes('= 13:') && !c.code.includes('+ 13')) : ERR_CASES
  const c = rng.pick(pool)
  return choice({
    rng,
    prompt: 'What type of error does this code contain?',
    figure: py(c.code),
    correct: c.t,
    wrong: ERR_TYPES.filter((x) => x !== c.t).map((x) => ({ label: x, misconception: `error-${x.split(' ')[0]?.toLowerCase()}`, feedback: ERR_DEF[x] })),
    keepOrder: true,
    hint: 'Would it run at all? If it runs, does it crash, or just give the wrong answer?',
    explanation: `${c.t}. ${c.why} ${ERR_DEF[c.t]}`,
  })
})

const SYNTAX_PROGS: string[][] = [
  ['name = input("Name: ")', 'score = 0', 'for i in range(3):', '    score = score + 1', 'if score == 3:', '    print("Well done", name)'],
  ['total = 0', 'count = 0', 'while count < 5:', '    total = total + count', '    count = count + 1', 'print("Total:", total)'],
  ['age = int(input("Age: "))', 'if age >= 13:', '    print("Welcome")', 'else:', '    print("Sorry")'],
  ['word = input("Word: ")', 'for letter in word:', '    print(letter)', 'print("Done")'],
]
const errorLine = G('prog.errors.line', 'prog.errors', [2, 5], (rng) => {
  const prog = [...rng.pick(SYNTAX_PROGS)]
  const candidates: { i: number; broken: string; what: string }[] = []
  prog.forEach((l, i) => {
    if (l.endsWith(':')) candidates.push({ i, broken: l.slice(0, -1), what: 'the colon at the end is missing' })
    if (l.endsWith(')')) candidates.push({ i, broken: l.slice(0, -1), what: 'the closing bracket is missing' })
    if (l.includes('==')) candidates.push({ i, broken: l.replace('==', '='), what: 'it uses = instead of == to compare' })
    if (/"\)$/.test(l)) candidates.push({ i, broken: l.replace(/"\)$/, ')'), what: 'the closing quotation mark is missing' })
  })
  const c = rng.pick(candidates)
  const original = prog[c.i] ?? ''
  prog[c.i] = c.broken
  const code = prog.map((l, i) => `${String(i + 1).padStart(2, ' ')}  ${l}`).join('\n')
  return num({
    prompt: 'This program has one syntax error. Which line number is it on?',
    figure: py(code),
    answer: c.i + 1,
    prefix: 'Line',
    hint: 'Check every line ending: if, for, while and else lines need a colon; every bracket and quotation mark needs a partner.',
    explanation: `Line ${c.i + 1}: ${c.what}. It should be: ${original.trim()}`,
  })
})

const errorFacts: FactSet = {
  skill: 'prog.errors',
  termNoun: 'kind of error',
  terms: [
    { term: 'Syntax error', def: 'The code breaks the grammar rules of the language, so it cannot run', hint: 'Syntax means the rules of how the code must be written.', typed: ['syntax'] },
    { term: 'Logic error', def: 'The program runs without crashing but gives the wrong result', hint: 'There is no error message for this one.', typed: ['logic', 'logical error'] },
    { term: 'Runtime error', def: 'The program crashes part-way through running, for example when dividing by zero', hint: 'It happens while the program is running.', typed: ['runtime', 'run-time error', 'run time error'] },
    { term: 'Debugging', def: 'Finding and fixing the errors in a program', hint: 'Errors are often called bugs.', typed: ['debug'] },
  ],
  facts: [
    {
      lv: [2, 4],
      q: 'Which type of error is usually the hardest to find, because Python gives no error message?',
      a: 'Logic error',
      wrong: [
        { label: 'Syntax error', misconception: 'error-syntax', feedback: 'Python reports syntax errors before the program runs.' },
        { label: 'Runtime error', misconception: 'error-runtime', feedback: 'A runtime error crashes the program with an error message.' },
      ],
      keepOrder: true,
      hint: 'Which kind of program runs perfectly happily but does the wrong thing?',
      exp: 'With a logic error the program runs normally, so there is no error message. You only find it by testing and checking the results.',
    },
  ],
}

// =====================================================================================================================
// Lists, functions, tracing
// =====================================================================================================================

const listTrace = G('prog.lists.trace', 'prog.lists', [1, 5], (rng, d) => {
  const p = listProgram(rng, d)
  return askOutput(p, {
    hint: 'List positions start at 0, and [-1] is the last item. append adds an item to the end. Printing a whole list shows it in square brackets.',
    explanation: `It prints ${at(p.output, 0)}. Trace it line by line: list positions start at 0, [-1] is the last item, and a for loop visits every item in order.`,
  })
})

const listFacts: FactSet = {
  skill: 'prog.lists',
  facts: [
    {
      lv: [1, 3],
      q: 'pets = ["cat", "dog", "fish"]. What is pets[1]?',
      a: '"dog"',
      wrong: [
        { label: '"cat"', misconception: 'index-from-one', feedback: '"cat" is pets[0]: positions start at 0.' },
        { label: '"fish"', feedback: '"fish" is pets[2].' },
        { label: 'An error', feedback: 'Position 1 exists: it is the second item.' },
      ],
      hint: 'The first item is at position 0.',
      exp: 'Positions start at 0: pets[0] is "cat", pets[1] is "dog", pets[2] is "fish".',
    },
    {
      lv: [2, 4],
      q: 'Why use a list instead of lots of separate variables such as score1, score2, score3...?',
      a: 'One name holds all the values, and a loop can process every item',
      wrong: [
        { label: 'Lists can only hold numbers, which is simpler', feedback: 'Lists can hold strings and other values too.' },
        { label: 'Separate variables are not allowed in Python', feedback: 'They are allowed; they are just harder to work with.' },
        { label: 'A list can never change, so it is safer', feedback: 'Python lists can be changed (for example with append).' },
      ],
      hint: 'Imagine 30 pupils\' scores.',
      exp: 'A list keeps related values together under one name, and a for loop can go through every item, however many there are.',
    },
    {
      lv: [2, 4],
      q: 'scores = [4, 8, 6]. Which line adds 9 to the end of the list?',
      a: 'scores.append(9)',
      wrong: [
        { label: 'scores[3] = 9', misconception: 'assign-past-end', feedback: 'Position 3 does not exist yet, so this causes an IndexError.' },
        { label: 'scores = 9', feedback: 'This replaces the whole list with the number 9.' },
        { label: 'scores + 9', feedback: 'You cannot add a number to a list like this, and it would not change scores.' },
      ],
      hint: 'There is a list method for adding to the end.',
      exp: 'append adds an item to the end of a list: scores becomes [4, 8, 6, 9].',
    },
  ],
}

const fnTrace = G('prog.functions.trace', 'prog.functions', [1, 5], (rng, d) => {
  const p = functionProgram(rng, d)
  if (p.output.length > 1) {
    return text({
      prompt: 'What is the last line this program prints? Type it exactly.',
      figure: py(p.code),
      accept: [at(p.output, -1)],
      placeholder: 'Type the output',
      hint: 'A function only runs when it is called. Follow each call in order.',
      explanation: `greet is called twice, so it prints ${p.output.join(' then ')}. The last line is ${at(p.output, -1)}.`,
    })
  }
  return askOutput(p, {
    hint: 'Match each argument in the call to the parameter in the same position, then work out what is returned.',
    explanation: `The arguments are copied into the parameters in order; the function works out its return value, and print shows it: ${at(p.output, 0)}.`,
  })
})

const fnFacts: FactSet = {
  skill: 'prog.functions',
  termNoun: 'term',
  terms: [
    { term: 'Function', def: 'A named block of code that does one job and can be called whenever it is needed', hint: 'It starts with def.', typed: ['subroutine', 'procedure', 'a function'] },
    { term: 'Parameter', def: 'A variable named in the def line that receives a value when the function is called', hint: 'In def area(width, height), width is one of these.', typed: ['parameters'] },
    { term: 'Argument', def: 'The actual value passed in when the function is called', hint: 'In area(3, 4), the 3 is one of these.', typed: ['arguments'] },
    { term: 'Return value', def: 'The value a function sends back to the line that called it', hint: 'The keyword that sends it back.', typed: ['return'] },
    { term: 'Calling a function', def: 'Running a function by writing its name followed by brackets', hint: 'Like phoning it up to do its job.', typed: ['call', 'function call'] },
  ],
  facts: [
    {
      lv: [2, 4],
      q: 'What is the difference between return and print inside a function?',
      a: 'return sends a value back to the code that called the function; print only shows it on screen',
      wrong: [
        { label: 'They do exactly the same thing', misconception: 'return-is-print', feedback: 'A printed value cannot be stored or used in a calculation; a returned value can.' },
        { label: 'print sends the value back; return shows it on screen', feedback: 'It is the other way round.' },
        { label: 'return ends the whole program', feedback: 'return only ends the function.' },
      ],
      hint: 'Can you write x = double(5) and then use x if the function only prints?',
      exp: 'return passes a value back so it can be stored or used, e.g. total = area(3, 4) + 1. print just displays it.',
    },
    {
      lv: [3, 5],
      q: 'Which is a good reason to put code into a function?',
      a: 'The code can be reused by calling it, instead of being copied out again',
      wrong: [
        { label: 'Functions make programs run without any errors', feedback: 'Functions can still contain bugs.' },
        { label: 'Code inside a function runs automatically when the program starts', misconception: 'def-runs', feedback: 'A function only runs when it is called.' },
        { label: 'Variables inside functions can be used anywhere in the program', feedback: 'Variables made inside a function are local to it.' },
      ],
      hint: 'Think about writing the same 10 lines three times.',
      exp: 'Functions avoid repetition: write the code once and call it whenever needed. They also make programs easier to read, test and change.',
    },
  ],
  written: [
    {
      q: 'Explain two reasons why programmers split their code into functions.',
      model: 'Functions let you write a block of code once and then reuse it by calling it, so you do not have to copy the same code out again. They also make a program easier to read and test, because each function does one job and can be checked on its own. If the code needs changing, you only change it in one place.',
      checklist: ['Mentions reusing code by calling the function', 'Mentions avoiding repeated or copied code', 'Mentions easier to read or understand', 'Mentions testing or fixing one part at a time, or changing it in one place'],
    },
  ],
}

const traceGen = G('prog.trace.output', 'prog.trace', [2, 5], (rng, d) => {
  const p = traceProgram(rng, d)
  return askOutput(p, {
    hint: 'Draw a trace table: one column per variable (and for the loop counter). Fill in a new row each time a value changes.',
    explanation: `Working through the trace table gives ${at(p.output, 0)}. Check each condition carefully, and remember range() stops before its end value.`,
    typedNote: 'Print with a comma puts a space between the values.',
  })
})

const traceTable = G('prog.trace.table', 'prog.trace', [2, 4], (rng, d) => {
  const start = rng.int(1, 5)
  const step = rng.int(2, 4)
  const n = d <= 2 ? 3 : 4
  const rows: string[][] = []
  let total = start
  rows.push(['0', String(total)])
  for (let i = 1; i <= n; i++) {
    total += i * step
    rows.push([String(i), String(total)])
  }
  const ask = rng.int(2, n)
  const shown = rows.map((r, i) => (i >= ask ? [r[0] ?? '', i === ask ? '?' : ''] : r))
  const answer = Number(at(rows, ask)[1])
  return num({
    prompt: `A program sets total = ${start}, then runs: for i in range(1, ${n + 1}): total = total + i * ${step}. Here is a partly filled trace table (the i = 0 row shows total before the loop starts). What value of total goes in place of the "?"`,
    figure: { type: 'table', head: ['i', 'total'], rows: shown },
    answer,
    hint: `Each time round, total goes up by i × ${step}. Use the row above.`,
    explanation: `When i = ${ask}, total = ${at(rows, ask - 1)[1]} + ${ask} × ${step} = ${answer}.`,
    errors: [err(Number(at(rows, ask - 1)[1]) + step, 'added-step', `Add i × ${step}, not just ${step}.`)],
  })
})

const traceFacts: FactSet = {
  skill: 'prog.trace',
  facts: [
    {
      lv: [2, 4],
      q: 'What is a trace table used for?',
      a: 'Recording how the values of variables change as each line of a program runs',
      wrong: [
        { label: 'Drawing the layout of a program\'s screens', feedback: 'That is a design sketch, not a trace table.' },
        { label: 'Listing every possible input to a program', feedback: 'That is closer to a test plan.' },
        { label: 'Making a program run faster', feedback: 'A trace table is for checking, by hand.' },
      ],
      hint: 'To "trace" is to follow something step by step.',
      exp: 'A trace table has a column for each variable. You work through the code by hand, writing each new value, which helps find logic errors.',
    },
  ],
  written: [
    {
      q: 'A program should add up the numbers 1 to 5 but prints 10 instead of 15. Explain how a trace table could help find the problem.',
      model: 'I would make a trace table with a column for the loop variable and a column for the total. Then I would go through the program line by line, writing the new value each time a variable changes. This would show that the loop stops at 4 instead of 5 (for example, range(1, 5) instead of range(1, 6)), so 5 is never added. Then I can fix the logic error.',
      checklist: ['Describes columns for the variables', 'Describes working through the code one line or one loop at a time', 'Explains it shows where the values go wrong (e.g. the loop stops one early)', 'Links this to finding and fixing a logic error'],
    },
  ],
}

// =====================================================================================================================

export const pythonGenerators: ItemGenerator[] = [
  printLine,
  printSyntax,
  ...factGenerators(printFacts),
  varTrace,
  varNames,
  varOrder,
  ...factGenerators(varFacts),
  typeLiteral,
  typeBest,
  typeCast,
  arithEval,
  arithContext,
  ...factGenerators(arithFacts),
  inputTrace,
  ...factGenerators(inputFacts),
  compareTrace,
  compareCondition,
  ...factGenerators(compareFacts),
  logicTrace,
  logicCondition,
  ...factGenerators(logicFacts),
  ifTrace,
  ifBoundary,
  ifSyntax,
  ...factGenerators(ifFacts),
  elifTrace,
  ...factGenerators(elifFacts),
  forList,
  forCount,
  forSum,
  forWhich,
  whileTrace,
  whileInfinite,
  ...factGenerators(whileFacts),
  stringTrace,
  stringIndex,
  ...factGenerators(stringFacts),
  sliceTrace,
  sliceChoice,
  ...factGenerators(sliceFacts),
  randomCount,
  randomNot,
  ...factGenerators(randomFacts),
  errorClassify,
  errorLine,
  ...factGenerators(errorFacts),
  listTrace,
  ...factGenerators(listFacts),
  fnTrace,
  ...factGenerators(fnFacts),
  traceGen,
  traceTable,
  ...factGenerators(traceFacts),
]
