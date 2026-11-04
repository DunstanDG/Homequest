import type { ItemGenerator } from '@/engine/registry'
import type { Figure } from '@/engine/types'
import { choice } from '../kit'
import { factGenerators, G, num, text, type FactSet } from './helpers'

type Bit = 0 | 1
const b = (x: boolean): Bit => (x ? 1 : 0)

type Gate = 'AND' | 'OR' | 'NOT'
const GATE_RULE: Record<Gate, string> = {
  AND: 'AND outputs 1 only when both inputs are 1.',
  OR: 'OR outputs 1 when at least one input is 1.',
  NOT: 'NOT has one input and outputs the opposite: 0 becomes 1 and 1 becomes 0.',
}
const gate = (g: Gate, A: Bit, B: Bit): Bit => (g === 'AND' ? b(A === 1 && B === 1) : g === 'OR' ? b(A === 1 || B === 1) : b(A === 0))

// =====================================================================================================================
// Gates
// =====================================================================================================================

const gateOutput = G('logic.gates.output', 'logic.gates', [1, 4], (rng, d) => {
  const g = rng.pick<Gate>(d <= 1 ? ['AND', 'OR'] : ['AND', 'OR', 'NOT'])
  const A = rng.pick<Bit>([0, 1])
  const B = rng.pick<Bit>([0, 1])
  const out = gate(g, A, B)
  const words = d >= 3
  const inputs = g === 'NOT' ? (words ? `its input is ${A ? 'on (1)' : 'off (0)'}` : `A = ${A}`) : words ? `input A is ${A ? 'on (1)' : 'off (0)'} and input B is ${B ? 'on (1)' : 'off (0)'}` : `A = ${A} and B = ${B}`
  return num({
    prompt: `${g === 'NOT' ? 'A NOT gate' : `An ${g} gate`}: ${inputs}. What is the output? (Type 0 or 1.)`,
    answer: out,
    hint: 'Think of 1 as True and 0 as False.',
    explanation: `${GATE_RULE[g]} So the output is ${out}.`,
    errors: [{ values: [1 - out], tag: g === 'AND' ? 'and-as-or' : g === 'OR' ? 'or-as-and' : 'not-unchanged', message: GATE_RULE[g] }],
  })
})

const GATE_SCENARIOS: { s: string; g: Gate }[] = [
  { s: 'A machine only starts when the guard is closed and the start button is pressed.', g: 'AND' },
  { s: 'A doorbell rings if the front button or the back button is pressed.', g: 'OR' },
  { s: 'A room light comes on if either of two switches is on.', g: 'OR' },
  { s: 'A night light turns on when it is NOT light outside.', g: 'NOT' },
  { s: 'A burglar alarm sounds if the window sensor or the door sensor is triggered.', g: 'OR' },
  { s: 'A safe opens only when the right code has been entered and the right key is turned.', g: 'AND' },
  { s: 'A fan runs when the room is not cold. There is one input: "room is cold".', g: 'NOT' },
]

const gateScenario = G('logic.gates.scenario', 'logic.gates', [2, 4], (rng) => {
  const sc = rng.pick(GATE_SCENARIOS)
  return choice({
    rng,
    prompt: `Which single logic gate fits this? "${sc.s}"`,
    correct: sc.g,
    wrong: (['AND', 'OR', 'NOT'] as Gate[]).filter((x) => x !== sc.g).map((x) => ({ label: x, misconception: `gate-${x.toLowerCase()}`, feedback: GATE_RULE[x] })),
    keepOrder: true,
    hint: 'Do both things need to happen, is one enough, or is it the opposite of a single thing?',
    explanation: GATE_RULE[sc.g],
  })
})

const gateFacts: FactSet = {
  skill: 'logic.gates',
  facts: [
    {
      lv: [1, 3],
      q: 'How many inputs does a NOT gate have?',
      a: '1',
      wrong: [
        { label: '2', misconception: 'not-two-inputs', feedback: 'AND and OR gates have two inputs here; NOT has only one.' },
        { label: '0', feedback: 'It needs an input to flip.' },
        { label: '3', feedback: 'NOT just flips a single input.' },
      ],
      hint: 'It just flips one value.',
      exp: 'A NOT gate has one input and gives the opposite as its output.',
    },
    {
      lv: [2, 4],
      q: 'In logic, what do 1 and 0 usually stand for?',
      a: '1 means True (on); 0 means False (off)',
      wrong: [
        { label: '1 means False; 0 means True', feedback: 'It is the other way round.' },
        { label: '1 and 0 are just numbers to add up', feedback: 'In logic they stand for True and False.' },
        { label: '1 means a gate and 0 means a wire', feedback: 'They are the values that travel along the wires.' },
      ],
      hint: 'Think of a switch being on.',
      exp: 'In Boolean logic 1 = True (on, high voltage) and 0 = False (off).',
    },
    {
      lv: [3, 5],
      q: 'An OR gate has both inputs set to 1. What is its output?',
      a: '1',
      wrong: [
        { label: '0', misconception: 'or-as-xor', feedback: 'OR outputs 1 when at least one input is 1, and that includes both.' },
        { label: '2', feedback: 'Logic gates only output 0 or 1.' },
      ],
      hint: '"At least one" includes "both".',
      exp: 'OR gives 1 if A is 1, or B is 1, or both. So 1 OR 1 = 1.',
    },
  ],
}

// =====================================================================================================================
// Truth tables
// =====================================================================================================================

const ROWS2: [Bit, Bit][] = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
]

const truthMissing = G('logic.truth-tables.missing', 'logic.truth-tables', [1, 4], (rng, d) => {
  const g = rng.pick<Gate>(['AND', 'OR', 'NOT'])
  if (g === 'NOT') {
    const ask = rng.pick<Bit>([0, 1])
    const fig: Figure = { type: 'table', head: ['A', 'Q = NOT A'], rows: [['0', ask === 0 ? '?' : '1'], ['1', ask === 1 ? '?' : '0']] }
    return num({ prompt: 'Complete the truth table. What goes in place of the "?"', figure: fig, answer: 1 - ask, hint: 'NOT flips the input.', explanation: `NOT ${ask} = ${1 - ask}. ${GATE_RULE.NOT}`, errors: [{ values: [ask], tag: 'not-unchanged', message: GATE_RULE.NOT }] })
  }
  const k = rng.int(0, 3)
  const hideMore = d >= 3
  const rows = ROWS2.map(([A, B], i) => [String(A), String(B), i === k ? '?' : hideMore && i !== k && rng.chance(0.3) ? '' : String(gate(g, A, B))])
  const [A, B] = ROWS2[k] ?? [0, 0]
  const out = gate(g, A, B)
  return num({
    prompt: 'Complete the truth table. What goes in place of the "?"',
    figure: { type: 'table', head: ['A', 'B', `Q = A ${g} B`], rows },
    answer: out,
    hint: 'Look at the A and B values in that row.',
    explanation: `${A} ${g} ${B} = ${out}. ${GATE_RULE[g]}`,
    errors: [{ values: [1 - out], tag: g === 'AND' ? 'and-as-or' : 'or-as-and', message: GATE_RULE[g] }],
  })
})

const truthWhich = G('logic.truth-tables.which', 'logic.truth-tables', [2, 4], (rng) => {
  const g = rng.pick<Gate>(['AND', 'OR'])
  const rows = rng.shuffle(ROWS2).map(([A, B]) => [String(A), String(B), String(gate(g, A, B))])
  return choice({
    rng,
    prompt: 'Which gate does this truth table describe? (The rows are in a mixed-up order.)',
    figure: { type: 'table', head: ['A', 'B', 'Q'], rows },
    correct: g,
    wrong: [
      { label: g === 'AND' ? 'OR' : 'AND', misconception: g === 'AND' ? 'and-as-or' : 'or-as-and', feedback: g === 'AND' ? GATE_RULE.OR : GATE_RULE.AND },
      { label: 'NOT', feedback: 'NOT has only one input.' },
    ],
    keepOrder: true,
    hint: 'How many rows give an output of 1?',
    explanation: `${g === 'AND' ? 'Only the row with A = 1 and B = 1 gives 1' : 'Every row with at least one 1 gives 1'}, so it is ${g}. ${GATE_RULE[g]}`,
  })
})

const truthRows = G('logic.truth-tables.rows', 'logic.truth-tables', [2, 5], (rng, d) => {
  const n = rng.int(1, d >= 4 ? 5 : 3)
  return num({
    prompt: `A logic circuit has ${n} input${n > 1 ? 's' : ''}. How many rows (not counting the heading) does its full truth table need?`,
    answer: 2 ** n,
    suffix: 'rows',
    hint: 'Each extra input doubles the number of combinations.',
    explanation: `Each input can be 0 or 1, so there are 2^{${n}} = ${2 ** n} combinations.`,
    errors: [{ values: [2 * n], tag: 'times-two', message: `It is 2^{${n}}, not 2 × ${n}.` }],
  })
})

// =====================================================================================================================
// Expressions with three inputs
// =====================================================================================================================

interface Expr {
  s: string
  f: (A: Bit, B: Bit, C: Bit) => Bit
  lv: number
}
const EXPRS: Expr[] = [
  { s: 'A AND B', f: (A, B) => b(!!A && !!B), lv: 1 },
  { s: 'A OR NOT B', f: (A, B) => b(!!A || !B), lv: 2 },
  { s: 'A AND NOT B', f: (A, B) => b(!!A && !B), lv: 2 },
  { s: 'NOT (A AND B)', f: (A, B) => b(!(A && B)), lv: 2 },
  { s: 'NOT (A OR B)', f: (A, B) => b(!(A || B)), lv: 3 },
  { s: '(A AND B) OR C', f: (A, B, C) => b((!!A && !!B) || !!C), lv: 3 },
  { s: '(A OR B) AND C', f: (A, B, C) => b((!!A || !!B) && !!C), lv: 3 },
  { s: '(A AND B) OR NOT C', f: (A, B, C) => b((!!A && !!B) || !C), lv: 4 },
  { s: 'NOT A AND (B OR C)', f: (A, B, C) => b(!A && (!!B || !!C)), lv: 4 },
  { s: 'NOT (A OR B) AND C', f: (A, B, C) => b(!(A || B) && !!C), lv: 4 },
  { s: '(A OR NOT B) AND (B OR C)', f: (A, B, C) => b((!!A || !B) && (!!B || !!C)), lv: 5 },
]
const uses = (e: Expr, v: 'A' | 'B' | 'C') => e.s.includes(v)

const exprEval = G('logic.expressions.eval', 'logic.expressions', [1, 5], (rng, d) => {
  const e = rng.pick(EXPRS.filter((x) => x.lv <= d && x.lv >= d - 2))
  const A = rng.pick<Bit>([0, 1])
  const B = rng.pick<Bit>([0, 1])
  const C = rng.pick<Bit>([0, 1])
  const out = e.f(A, B, C)
  const given = [`A = ${A}`, `B = ${B}`, ...(uses(e, 'C') ? [`C = ${C}`] : [])].join(', ')
  return num({
    prompt: `Q = ${e.s}. If ${given}, what is Q? (Type 0 or 1.)`,
    answer: out,
    hint: 'Work out the brackets first, then NOT, then AND, then OR. Write down each part as you go.',
    explanation: `Put in the values: Q = ${e.s.replace(/A/g, String(A)).replace(/B/g, String(B)).replace(/C/g, String(C))} = ${out}.`,
    errors: [{ values: [1 - out], tag: 'logic-eval', message: 'Work out the brackets first and take care with NOT.' }],
  })
})

const exprColumn = G('logic.expressions.column', 'logic.expressions', [3, 5], (rng, d) => {
  const e = rng.pick(EXPRS.filter((x) => x.lv >= 2 && x.lv <= d && !uses(x, 'C')))
  const col = ROWS2.map(([A, B]) => String(e.f(A, B, 0)))
  return text({
    prompt: `Complete the Q column of the truth table for Q = ${e.s}. Type the four outputs from top to bottom, e.g. 0110.`,
    figure: { type: 'table', head: ['A', 'B', 'Q'], rows: ROWS2.map(([A, B]) => [String(A), String(B), '?']) },
    accept: [col.join(''), col.join(' '), col.join(', '), col.join(',')],
    placeholder: 'e.g. 0110',
    hint: 'Do one row at a time. Work out any NOT first.',
    explanation: ROWS2.map(([A, B], i) => `A=${A}, B=${B}: ${col[i]}`).join('; ') + `. So the column is ${col.join('')}.`,
  })
})

const exprCount = G('logic.expressions.count', 'logic.expressions', [4, 5], (rng) => {
  const e = rng.pick(EXPRS.filter((x) => uses(x, 'C')))
  let count = 0
  for (const A of [0, 1] as Bit[]) for (const B of [0, 1] as Bit[]) for (const C of [0, 1] as Bit[]) count += e.f(A, B, C)
  return num({
    prompt: `Q = ${e.s}. In the full truth table (8 rows for A, B and C), in how many rows is Q = 1?`,
    answer: count,
    suffix: 'rows',
    hint: 'List all 8 combinations of A, B and C (000 to 111) and work out Q for each.',
    explanation: `Working through all 8 rows, Q = 1 in ${count} of them.`,
  })
})

const CIRCUITS: { s: string; correct: string; wrong: { label: string; feedback: string }[] }[] = [
  { s: 'An alarm (Q) sounds if the system is armed (A) AND either the door (B) OR the window (C) is opened.', correct: 'A AND (B OR C)', wrong: [{ label: '(A AND B) OR C', feedback: 'With this, opening the window sets off the alarm even when it is not armed.' }, { label: 'A OR B OR C', feedback: 'This sounds the alarm whenever the system is armed, even if nothing is opened.' }, { label: 'A AND B AND C', feedback: 'This needs both the door and the window opened.' }] },
  { s: 'A greenhouse fan (Q) comes on when it is hot (A) AND the window is NOT open (B).', correct: 'A AND NOT B', wrong: [{ label: 'A AND B', feedback: 'The fan should run when the window is NOT open.' }, { label: 'NOT A AND B', feedback: 'The fan should run when it IS hot.' }, { label: 'A OR NOT B', feedback: 'With OR, the fan would run on a cold day whenever the window is shut.' }] },
  { s: 'A lift (Q) moves only when the door is closed (A) and, as well as that, either a floor button (B) or the call button (C) has been pressed.', correct: 'A AND (B OR C)', wrong: [{ label: '(A AND B) OR C', feedback: 'This would let the lift move with the door open if the call button is pressed.' }, { label: 'A AND B AND C', feedback: 'This needs both buttons pressed.' }, { label: 'NOT A AND (B OR C)', feedback: 'The lift must only move when the door IS closed.' }] },
  { s: 'A phone screen (Q) turns on when the power button is pressed (A) OR a message arrives (B), as long as the phone is NOT in sleep mode (C).', correct: '(A OR B) AND NOT C', wrong: [{ label: 'A OR B AND NOT C', feedback: 'Without brackets, AND is done first, so pressing the button would work even in sleep mode.' }, { label: '(A OR B) AND C', feedback: 'It should only turn on when it is NOT in sleep mode.' }, { label: '(A AND B) AND NOT C', feedback: 'Either event is enough, so A and B should be joined with OR.' }] },
  { s: 'A sprinkler (Q) turns on when the soil is dry (A) AND it is NOT raining (B).', correct: 'A AND NOT B', wrong: [{ label: 'A OR NOT B', feedback: 'With OR it would water wet soil on every dry day.' }, { label: 'NOT A AND B', feedback: 'That turns it on when the soil is wet and it is raining.' }, { label: 'A AND B', feedback: 'It should run when it is NOT raining.' }] },
]
const exprCircuit = G('logic.expressions.circuit', 'logic.expressions', [2, 5], (rng) => {
  const c = rng.pick(CIRCUITS)
  return choice({
    rng,
    prompt: `Which logic expression matches this? ${c.s}`,
    correct: c.correct,
    wrong: c.wrong.map((w) => ({ ...w, misconception: 'circuit-expression' })),
    hint: 'Find which inputs must ALL be true (AND), where one is enough (OR), and any "not". Use brackets to group the OR.',
    explanation: `${c.correct}. Test it: pick values for the inputs and check the output makes sense for the situation.`,
  })
})

const exprFacts: FactSet = {
  skill: 'logic.expressions',
  written: [
    {
      q: 'A car\'s interior light (Q) comes on when the driver\'s door (A) OR the passenger\'s door (B) is open, but only if the headlights switch (C) is NOT on. Write a logic expression for this and explain how you chose each part.',
      model: 'Q = (A OR B) AND NOT C. Either door being open is enough, so A and B are joined with OR, in brackets so that part is worked out first. The light must only come on if the headlights switch is not on, so NOT C is joined to the rest with AND, because both parts must be true.',
      checklist: ['Writes (A OR B) AND NOT C, or something equivalent', 'Explains OR is used because either door is enough', 'Explains NOT C', 'Explains AND joins the two conditions that must both be true', 'Uses brackets correctly'],
      passMark: 3,
    },
  ],
}

// =====================================================================================================================

export const logicGenerators: ItemGenerator[] = [
  gateOutput,
  gateScenario,
  ...factGenerators(gateFacts),
  truthMissing,
  truthWhich,
  truthRows,
  exprEval,
  exprColumn,
  exprCount,
  exprCircuit,
  ...factGenerators(exprFacts),
]
