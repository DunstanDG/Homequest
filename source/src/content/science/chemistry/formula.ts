/**
 * Element data, a formula parser and balanced equations for the Chemistry questions.
 *
 * Formulae are written in the app's text markup: H_{2}O, CO_{2}, Ca(OH)_{2}. `parseFormula` counts the atoms in one,
 * so atom counts, relative formula masses and equation balancing are all computed from the same strings that are
 * shown, never typed in twice (the test checks every equation balances).
 *
 * Relative atomic masses are the standard rounded values used in KS3/GCSE science in England (as on the AQA
 * periodic table): whole numbers except chlorine 35.5 and copper 63.5.
 */

export type ElementKind = 'metal' | 'non-metal' | 'metalloid'

export interface Element {
  name: string
  symbol: string
  /** Atomic number (number of protons). */
  z: number
  /** Relative atomic mass, standard rounded KS3/GCSE value. */
  ar: number
  /** Mass number of the most common isotope (whole number, for proton/neutron questions). */
  mass: number
  /** Group 1-7 or 0 for main-group elements; null for transition metals and hydrogen. */
  group: number | null
  period: number
  kind: ElementKind
  /** State at room temperature (about 20 °C). */
  state: 'solid' | 'liquid' | 'gas'
}

const E = (name: string, symbol: string, z: number, ar: number, mass: number, group: number | null, period: number, kind: ElementKind, state: Element['state'] = 'solid'): Element => ({
  name,
  symbol,
  z,
  ar,
  mass,
  group,
  period,
  kind,
  state,
})

export const ELEMENTS: Element[] = [
  E('hydrogen', 'H', 1, 1, 1, null, 1, 'non-metal', 'gas'),
  E('helium', 'He', 2, 4, 4, 0, 1, 'non-metal', 'gas'),
  E('lithium', 'Li', 3, 7, 7, 1, 2, 'metal'),
  E('beryllium', 'Be', 4, 9, 9, 2, 2, 'metal'),
  E('boron', 'B', 5, 11, 11, 3, 2, 'metalloid'),
  E('carbon', 'C', 6, 12, 12, 4, 2, 'non-metal'),
  E('nitrogen', 'N', 7, 14, 14, 5, 2, 'non-metal', 'gas'),
  E('oxygen', 'O', 8, 16, 16, 6, 2, 'non-metal', 'gas'),
  E('fluorine', 'F', 9, 19, 19, 7, 2, 'non-metal', 'gas'),
  E('neon', 'Ne', 10, 20, 20, 0, 2, 'non-metal', 'gas'),
  E('sodium', 'Na', 11, 23, 23, 1, 3, 'metal'),
  E('magnesium', 'Mg', 12, 24, 24, 2, 3, 'metal'),
  E('aluminium', 'Al', 13, 27, 27, 3, 3, 'metal'),
  E('silicon', 'Si', 14, 28, 28, 4, 3, 'metalloid'),
  E('phosphorus', 'P', 15, 31, 31, 5, 3, 'non-metal'),
  E('sulfur', 'S', 16, 32, 32, 6, 3, 'non-metal'),
  E('chlorine', 'Cl', 17, 35.5, 35, 7, 3, 'non-metal', 'gas'),
  E('argon', 'Ar', 18, 40, 40, 0, 3, 'non-metal', 'gas'),
  E('potassium', 'K', 19, 39, 39, 1, 4, 'metal'),
  E('calcium', 'Ca', 20, 40, 40, 2, 4, 'metal'),
  E('manganese', 'Mn', 25, 55, 55, null, 4, 'metal'),
  E('iron', 'Fe', 26, 56, 56, null, 4, 'metal'),
  E('cobalt', 'Co', 27, 59, 59, null, 4, 'metal'),
  E('nickel', 'Ni', 28, 59, 58, null, 4, 'metal'),
  E('copper', 'Cu', 29, 63.5, 63, null, 4, 'metal'),
  E('zinc', 'Zn', 30, 65, 64, null, 4, 'metal'),
  E('bromine', 'Br', 35, 80, 79, 7, 4, 'non-metal', 'liquid'),
  E('krypton', 'Kr', 36, 84, 84, 0, 4, 'non-metal', 'gas'),
  E('silver', 'Ag', 47, 108, 107, null, 5, 'metal'),
  E('tin', 'Sn', 50, 119, 120, 4, 5, 'metal'),
  E('iodine', 'I', 53, 127, 127, 7, 5, 'non-metal'),
  E('platinum', 'Pt', 78, 195, 195, null, 6, 'metal'),
  E('gold', 'Au', 79, 197, 197, null, 6, 'metal'),
  E('mercury', 'Hg', 80, 201, 202, null, 6, 'metal', 'liquid'),
  E('lead', 'Pb', 82, 207, 208, 4, 6, 'metal'),
]

export const BY_SYMBOL: Record<string, Element> = Object.fromEntries(ELEMENTS.map((e) => [e.symbol, e]))

/** Elements whose symbol does not come from the English name (Latin names). */
export const LATIN_SYMBOLS: Record<string, string> = {
  Na: 'natrium',
  K: 'kalium',
  Fe: 'ferrum',
  Cu: 'cuprum',
  Ag: 'argentum',
  Au: 'aurum',
  Sn: 'stannum',
  Hg: 'hydrargyrum',
  Pb: 'plumbum',
}

/** Count the atoms of each element in a formula written in markup, e.g. 'Ca(OH)_{2}' -> Ca 1, O 2, H 2. */
export function parseFormula(f: string): Record<string, number> {
  let i = 0
  const readNum = (): number => {
    if (f.startsWith('_{', i)) {
      const end = f.indexOf('}', i)
      const n = Number(f.slice(i + 2, end))
      i = end + 1
      return n
    }
    return 1
  }
  const add = (into: Record<string, number>, from: Record<string, number>, times: number) => {
    for (const [el, n] of Object.entries(from)) into[el] = (into[el] ?? 0) + n * times
  }
  const group = (): Record<string, number> => {
    const out: Record<string, number> = {}
    while (i < f.length && f[i] !== ')') {
      if (f[i] === '(') {
        i++
        const inner = group()
        i++ // skip ')'
        add(out, inner, readNum())
      } else {
        const m = /^[A-Z][a-z]?/.exec(f.slice(i))
        if (!m) throw new Error(`Bad formula ${f} at ${i}`)
        i += m[0].length
        out[m[0]] = (out[m[0]] ?? 0) + readNum()
      }
    }
    return out
  }
  return group()
}

export const totalAtoms = (f: string) => Object.values(parseFormula(f)).reduce((a, b) => a + b, 0)

/** Elements in the order they first appear in the formula. */
export const elementsIn = (f: string) => Object.keys(parseFormula(f))

/** Relative formula mass from the rounded Ar values. */
export function rfm(f: string): number {
  let m = 0
  for (const [el, n] of Object.entries(parseFormula(f))) {
    const e = BY_SYMBOL[el]
    if (!e) throw new Error(`No Ar for ${el}`)
    m += e.ar * n
  }
  return Math.round(m * 10) / 10
}

// --------------------------------------------------------------------- compounds

export interface Compound {
  formula: string
  name: string
  /** Shown in brackets after the name when helpful (e.g. "calcium carbonate (limestone)"). */
  note?: string
  /** True for molecules of an element (O_{2}), which are not compounds. */
  element?: boolean
}

export const COMPOUNDS: Compound[] = [
  { formula: 'H_{2}O', name: 'water' },
  { formula: 'CO_{2}', name: 'carbon dioxide' },
  { formula: 'CO', name: 'carbon monoxide' },
  { formula: 'NaCl', name: 'sodium chloride' },
  { formula: 'MgO', name: 'magnesium oxide' },
  { formula: 'CaO', name: 'calcium oxide' },
  { formula: 'CuO', name: 'copper oxide' },
  { formula: 'ZnO', name: 'zinc oxide' },
  { formula: 'KCl', name: 'potassium chloride' },
  { formula: 'HCl', name: 'hydrogen chloride' },
  { formula: 'SO_{2}', name: 'sulfur dioxide' },
  { formula: 'NH_{3}', name: 'ammonia' },
  { formula: 'CH_{4}', name: 'methane' },
  { formula: 'NaOH', name: 'sodium hydroxide' },
  { formula: 'MgCl_{2}', name: 'magnesium chloride' },
  { formula: 'CaCl_{2}', name: 'calcium chloride' },
  { formula: 'FeS', name: 'iron sulfide' },
  { formula: 'CaCO_{3}', name: 'calcium carbonate' },
  { formula: 'CuCO_{3}', name: 'copper carbonate' },
  { formula: 'MgCO_{3}', name: 'magnesium carbonate' },
  { formula: 'Na_{2}CO_{3}', name: 'sodium carbonate' },
  { formula: 'CuSO_{4}', name: 'copper sulfate' },
  { formula: 'ZnSO_{4}', name: 'zinc sulfate' },
  { formula: 'H_{2}SO_{4}', name: 'sulfuric acid' },
  { formula: 'HNO_{3}', name: 'nitric acid' },
  { formula: 'KNO_{3}', name: 'potassium nitrate' },
  { formula: 'Al_{2}O_{3}', name: 'aluminium oxide' },
  { formula: 'Fe_{2}O_{3}', name: 'iron oxide' },
  { formula: 'C_{6}H_{12}O_{6}', name: 'glucose' },
  { formula: 'H_{2}O_{2}', name: 'hydrogen peroxide' },
  { formula: 'Ca(OH)_{2}', name: 'calcium hydroxide' },
  { formula: 'Mg(OH)_{2}', name: 'magnesium hydroxide' },
  { formula: 'O_{2}', name: 'oxygen', element: true },
  { formula: 'H_{2}', name: 'hydrogen', element: true },
  { formula: 'N_{2}', name: 'nitrogen', element: true },
  { formula: 'Cl_{2}', name: 'chlorine', element: true },
]

// --------------------------------------------------------------------- equations

export type Side = [number, string][]

export interface Equation {
  lhs: Side
  rhs: Side
  /** The word equation, using the same names as the symbol equation. */
  word: string
}

const side = (s: string): Side =>
  s.split(' + ').map((t) => {
    const m = /^(\d*)(.+)$/.exec(t.trim())
    return [m && m[1] ? Number(m[1]) : 1, (m?.[2] ?? t).trim()]
  })
const eq = (sym: string, word: string): Equation => {
  const [l, r] = sym.split(' -> ')
  return { lhs: side(l ?? ''), rhs: side(r ?? ''), word }
}

/** Balanced symbol equations, each checked by the test (atoms of every element equal on both sides). */
export const EQUATIONS: Equation[] = [
  eq('2H_{2} + O_{2} -> 2H_{2}O', 'hydrogen + oxygen → water'),
  eq('C + O_{2} -> CO_{2}', 'carbon + oxygen → carbon dioxide'),
  eq('S + O_{2} -> SO_{2}', 'sulfur + oxygen → sulfur dioxide'),
  eq('2Mg + O_{2} -> 2MgO', 'magnesium + oxygen → magnesium oxide'),
  eq('2Ca + O_{2} -> 2CaO', 'calcium + oxygen → calcium oxide'),
  eq('2Cu + O_{2} -> 2CuO', 'copper + oxygen → copper oxide'),
  eq('4Fe + 3O_{2} -> 2Fe_{2}O_{3}', 'iron + oxygen → iron oxide'),
  eq('4Al + 3O_{2} -> 2Al_{2}O_{3}', 'aluminium + oxygen → aluminium oxide'),
  eq('CH_{4} + 2O_{2} -> CO_{2} + 2H_{2}O', 'methane + oxygen → carbon dioxide + water'),
  eq('C_{6}H_{12}O_{6} + 6O_{2} -> 6CO_{2} + 6H_{2}O', 'glucose + oxygen → carbon dioxide + water'),
  eq('CaCO_{3} -> CaO + CO_{2}', 'calcium carbonate → calcium oxide + carbon dioxide'),
  eq('CuCO_{3} -> CuO + CO_{2}', 'copper carbonate → copper oxide + carbon dioxide'),
  eq('MgCO_{3} -> MgO + CO_{2}', 'magnesium carbonate → magnesium oxide + carbon dioxide'),
  eq('2H_{2}O_{2} -> 2H_{2}O + O_{2}', 'hydrogen peroxide → water + oxygen'),
  eq('Fe + S -> FeS', 'iron + sulfur → iron sulfide'),
  eq('2Na + Cl_{2} -> 2NaCl', 'sodium + chlorine → sodium chloride'),
  eq('N_{2} + 3H_{2} -> 2NH_{3}', 'nitrogen + hydrogen → ammonia'),
  eq('Mg + 2HCl -> MgCl_{2} + H_{2}', 'magnesium + hydrochloric acid → magnesium chloride + hydrogen'),
  eq('Zn + H_{2}SO_{4} -> ZnSO_{4} + H_{2}', 'zinc + sulfuric acid → zinc sulfate + hydrogen'),
  eq('NaOH + HCl -> NaCl + H_{2}O', 'sodium hydroxide + hydrochloric acid → sodium chloride + water'),
  eq('CuO + H_{2}SO_{4} -> CuSO_{4} + H_{2}O', 'copper oxide + sulfuric acid → copper sulfate + water'),
  eq('CaCO_{3} + 2HCl -> CaCl_{2} + H_{2}O + CO_{2}', 'calcium carbonate + hydrochloric acid → calcium chloride + water + carbon dioxide'),
  eq('2Na + 2H_{2}O -> 2NaOH + H_{2}', 'sodium + water → sodium hydroxide + hydrogen'),
  eq('2K + 2H_{2}O -> 2KOH + H_{2}', 'potassium + water → potassium hydroxide + hydrogen'),
  eq('Ca + 2H_{2}O -> Ca(OH)_{2} + H_{2}', 'calcium + water → calcium hydroxide + hydrogen'),
  eq('Zn + CuSO_{4} -> ZnSO_{4} + Cu', 'zinc + copper sulfate → zinc sulfate + copper'),
  eq('Cl_{2} + 2KBr -> 2KCl + Br_{2}', 'chlorine + potassium bromide → potassium chloride + bromine'),
  eq('2CuO + C -> 2Cu + CO_{2}', 'copper oxide + carbon → copper + carbon dioxide'),
  eq('2Fe_{2}O_{3} + 3C -> 4Fe + 3CO_{2}', 'iron oxide + carbon → iron + carbon dioxide'),
]

export const sideAtoms = (s: Side): Record<string, number> => {
  const out: Record<string, number> = {}
  for (const [k, f] of s) for (const [el, n] of Object.entries(parseFormula(f))) out[el] = (out[el] ?? 0) + n * k
  return out
}

export const isBalanced = (e: Equation) => {
  const l = sideAtoms(e.lhs)
  const r = sideAtoms(e.rhs)
  const keys = new Set([...Object.keys(l), ...Object.keys(r)])
  return [...keys].every((k) => (l[k] ?? 0) === (r[k] ?? 0))
}

export const showSide = (s: Side, blank?: number) => s.map(([k, f], i) => `${i === blank ? '__ ' : k > 1 ? k : ''}${f}`).join(' + ')
export const showEq = (e: Equation) => `${showSide(e.lhs)} → ${showSide(e.rhs)}`
