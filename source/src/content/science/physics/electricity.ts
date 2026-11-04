import type { ItemGenerator } from '@/engine/registry'
import { choice } from '../../kit'
import { an, bankGenerators, err, fmt, G, num, round, table, type Bank } from './factory'

// =====================================================================================================================
// Simple circuits (Year 6 foundation)
// =====================================================================================================================

const COND_MEANS: Record<string, string> = {
  'Electrical conductor': 'Lets an electric current pass through it easily. Metals and graphite are conductors.',
  'Electrical insulator': 'Does not let an electric current pass through it. Most plastics, wood, rubber and glass are insulators.',
}

const LIGHT_MEANS: Record<string, string> = {
  'The lamp lights': 'There is a complete loop of conductors from one end of the cell, through the lamp and back to the other end.',
  'The lamp does not light': 'There is a gap or an insulator in the loop, or the loop does not go through the cell, so no current flows through the lamp.',
}

const basicBank: Bank = {
  skill: 'phys.elec.basic',
  sorts: [
    {
      id: 'conductor',
      categories: Object.keys(COND_MEANS),
      items: [
        ['a copper wire', 'Electrical conductor'],
        ['a steel paperclip', 'Electrical conductor'],
        ['aluminium foil', 'Electrical conductor'],
        ['pencil lead (graphite)', 'Electrical conductor'],
        ['an iron nail', 'Electrical conductor'],
        ['a plastic ruler', 'Electrical insulator'],
        ['a wooden lolly stick', 'Electrical insulator'],
        ['a rubber band', 'Electrical insulator'],
        ['a glass marble', 'Electrical insulator'],
        ['a woollen thread', 'Electrical insulator'],
      ],
      ask: (x) => `Is ${x} an electrical conductor or an insulator?`,
      hint: 'Metals (and graphite) conduct electricity. Plastics, wood, rubber, glass and wool do not.',
      means: COND_MEANS,
      lv: [1, 3],
    },
    {
      id: 'lights',
      categories: Object.keys(LIGHT_MEANS),
      items: [
        ['a cell, a lamp and a closed switch are joined in a complete loop', 'The lamp lights'],
        ['a cell and a lamp are joined in a loop, with a steel paperclip bridging a gap in one wire', 'The lamp lights'],
        ['a cell and a lamp are joined in a loop, with a strip of aluminium foil bridging a gap in one wire', 'The lamp lights'],
        ['a cell, a lamp and an open switch are joined in a loop', 'The lamp does not light'],
        ['a cell and a lamp are joined in a loop, with a plastic ruler bridging a gap in one wire', 'The lamp does not light'],
        ['both of the lamp\'s wires are joined to the same end of the cell', 'The lamp does not light'],
        ['a cell and a lamp are joined in a loop, but one wire has come loose from the cell', 'The lamp does not light'],
        ['a cell and a lamp are joined in a loop, with a wooden lolly stick bridging a gap in one wire', 'The lamp does not light'],
      ],
      ask: (x) => `In a circuit, ${x}. Does the lamp light?`,
      hint: 'A current only flows if there is a complete loop of conductors through the cell and the lamp.',
      means: LIGHT_MEANS,
      lv: [1, 3],
    },
  ],
  links: [
    {
      prompt: 'Match each circuit symbol (described in words) to the component.',
      pairs: [
        ['A circle with a cross (X) inside it', 'Lamp (bulb)'],
        ['One long line and one short line, side by side', 'Cell'],
        ['Two or more pairs of long and short lines joined in a row', 'Battery'],
        ['A gap in the wire with a short line hinged up from one side', 'Open switch'],
        ['A circle with the letter M inside it', 'Motor'],
        ['A small rectangle (box) in the wire', 'Resistor'],
      ],
      hint: 'A battery is several cells. A switch is drawn like a gate in the wire.',
      ask: (l) => `Which component is drawn as "${l.charAt(0).toLowerCase()}${l.slice(1)}"?`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'A lamp is lit by one cell. A second, identical cell is added in series. What happens to the lamp?',
      a: 'It gets brighter',
      wrong: [{ label: 'It gets dimmer', misconception: 'more-cells-dimmer', feedback: 'More cells give a bigger push to the current, so the lamp gets brighter.' }, 'It stays the same', 'It goes out'],
      hint: 'More cells means more "push".',
      why: 'Two cells in series give a bigger potential difference, so a bigger current flows and the lamp is brighter (too many could blow it).',
      lv: [1, 3],
    },
    {
      q: 'One lamp is connected to a cell. A second identical lamp is added in series in the same loop. What happens?',
      a: 'Both lamps are dimmer than the single lamp was',
      wrong: [{ label: 'Both lamps are as bright as the single lamp was', misconception: 'series-same-brightness', feedback: 'That happens if they are in parallel. In series they share the push from the cell.' }, 'Both are brighter', 'Only the first lamp lights'],
      hint: 'In series, the lamps share the cell\'s push.',
      why: 'Adding a lamp in series makes it harder for current to flow, so the current is smaller and both lamps are dimmer.',
      lv: [2, 4],
    },
    {
      q: 'What does a switch do in a circuit?',
      a: 'It opens or closes a gap, turning the current off or on',
      wrong: [{ label: 'It stores energy for later', misconception: 'switch-stores', feedback: 'That is a cell or battery.' }, 'It makes the current bigger', 'It changes the colour of the lamp'],
      hint: 'Think of what happens when you flick a light switch.',
      why: 'A closed switch completes the loop so current flows. An open switch makes a gap, so the current stops.',
      lv: [1, 2],
    },
  ],
}

// =====================================================================================================================
// Current and potential difference
// =====================================================================================================================

const currentBank: Bank = {
  skill: 'phys.elec.current',
  terms: [
    { term: 'Current', def: 'The rate of flow of electric charge around a circuit, measured in amps (A)' },
    { term: 'Potential difference', def: 'The "push" that drives the current; the energy transferred per unit of charge, measured in volts (V)' },
    { term: 'Ammeter', def: 'A meter connected in series that measures current' },
    { term: 'Voltmeter', def: 'A meter connected in parallel across a component that measures potential difference' },
    { term: 'Electron', def: 'A tiny negatively charged particle; a flow of these in a metal wire is an electric current' },
  ],
  links: [
    {
      prompt: 'Match each meter to how it is connected and what it measures.',
      pairs: [
        ['Ammeter', 'In series, measuring current in amps'],
        ['Voltmeter', 'In parallel across a component, measuring potential difference in volts'],
      ],
      hint: 'A-for-amps goes in the loop; V-for-volts goes across.',
      lv: [2, 3],
    },
  ],
  mcqs: [
    {
      q: 'How should an ammeter be connected to measure the current through a lamp?',
      a: 'In series with the lamp, in the same loop',
      wrong: [{ label: 'In parallel, across the lamp', misconception: 'ammeter-parallel', feedback: 'That is how a voltmeter is connected. The current must flow THROUGH the ammeter.' }, 'Anywhere, it makes no difference', 'Not in the circuit at all, just held nearby'],
      hint: 'The current must flow through the meter.',
      why: 'An ammeter measures the current flowing through it, so it goes in series, in the same loop as the lamp.',
      lv: [1, 3],
    },
    {
      q: 'How should a voltmeter be connected to measure the potential difference across a lamp?',
      a: 'In parallel, with its leads on each side of the lamp',
      wrong: [{ label: 'In series, in the same loop as the lamp', misconception: 'voltmeter-series', feedback: 'That is how an ammeter goes. A voltmeter compares two points, so it goes across the component.' }, 'Only next to the cell', 'It does not matter'],
      hint: 'It compares the two sides of the component.',
      why: 'Potential difference is the difference between two points, so the voltmeter is connected across (in parallel with) the component.',
      lv: [1, 3],
    },
    {
      q: 'Ammeters are placed just before and just after a lamp in a series circuit. How do their readings compare?',
      a: 'They are the same',
      wrong: [{ label: 'The one after the lamp reads less, because the lamp uses up current', misconception: 'current-used-up', feedback: 'Current is not used up. The same charge flows all the way round; it is ENERGY that the lamp transfers.' }, 'The one after the lamp reads more', 'The one after the lamp reads zero'],
      hint: 'Is current used up by a lamp?',
      why: 'Current is the flow of charge, and charge is not used up. In a series loop the current is the same everywhere. The lamp transfers energy, not charge.',
      lv: [2, 4],
    },
    {
      q: 'In a metal wire, what actually moves to make an electric current?',
      a: 'Electrons',
      wrong: [{ label: 'Protons', misconception: 'protons-move', feedback: 'Protons stay in the nuclei of the metal atoms. Electrons are free to move.' }, 'Atoms of copper', 'Electricity particles made in the battery'],
      hint: 'These negatively charged particles are already in the wire.',
      why: 'Metals contain electrons that are free to move. The cell pushes them round the circuit; that flow of charge is the current.',
      lv: [2, 4],
    },
    {
      q: 'What does the potential difference of a cell tell you?',
      a: 'How big a "push" it gives the charge, and so how much energy each unit of charge carries',
      wrong: [{ label: 'How much current is stored inside it', misconception: 'cell-stores-current', feedback: 'A cell does not store current. It stores energy (chemical store) and provides a push.' }, 'How long it will last', 'How much charge it contains'],
      hint: 'Volts measure the push.',
      why: 'Potential difference (in volts) measures the push on the charge: the energy transferred per unit of charge. A bigger p.d. drives a bigger current through the same component.',
      lv: [3, 5],
    },
  ],
}

const cellsCalc = G('phys.elec.current.calc', 'phys.elec.current', [1, 5], (rng, d) => {
  if (d <= 2) {
    const v = rng.pick([1.5, 2])
    const n = rng.int(2, 4)
    return num({
      prompt: `${n} cells, each of ${fmt(v)} V, are joined in series the same way round to make a battery. What is the total potential difference? Give your answer in volts.`,
      answer: round(v * n),
      suffix: 'V',
      hint: 'Cells in series (the same way round) add up.',
      explanation: `${n} × ${fmt(v)} V = ${fmt(v * n)} V.`,
      errors: [err(v, 'one-cell', 'Each cell adds its own push. Add them together.')],
    })
  }
  if (d === 3) {
    const i = rng.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 1.2])
    return num({
      prompt: `In a series circuit with a cell, a lamp and a buzzer, an ammeter between the cell and the lamp reads ${fmt(i)} A. What will an ammeter between the lamp and the buzzer read? Give your answer in amps.`,
      answer: i,
      suffix: 'A',
      hint: 'In a series circuit there is only one path for the current.',
      explanation: `In series the current is the same everywhere, so it also reads ${fmt(i)} A. Current is not used up by the lamp.`,
      errors: [err(0, 'current-used-up', 'The current is not used up by the lamp.'), err(round(i / 2, 6), 'current-shared', 'In series the current is not shared out; it is the same everywhere in the loop.')],
    })
  }
  const ma = rng.pick([50, 120, 200, 250, 300, 450, 600, 750])
  if (d === 4) {
    return num({
      prompt: `An ammeter reads ${ma} mA. What is this current in amps?`,
      answer: ma / 1000,
      suffix: 'A',
      hint: '1 A = 1000 mA.',
      explanation: `${ma} mA ÷ 1000 = ${fmt(ma / 1000)} A.`,
      errors: [err(ma * 1000, 'multiplied', 'Amps are bigger units, so divide by 1000.'), err(ma / 100, 'divided-100', 'There are 1000 mA in an amp, not 100.')],
    })
  }
  const n = rng.int(2, 8)
  const v = 1.5 * n
  return num({
    prompt: `A device needs a potential difference of ${fmt(v)} V. How many 1.5 V cells must be joined in series (the same way round) to supply this?`,
    answer: n,
    suffix: 'cells',
    hint: 'Cells in series add their potential differences.',
    explanation: `${fmt(v)} V ÷ 1.5 V per cell = ${n} cells.`,
    errors: [err(round(v * 1.5, 6), 'multiplied', 'Divide the total p.d. by the p.d. of one cell.')],
  })
})

// =====================================================================================================================
// Series and parallel circuits
// =====================================================================================================================

const SP_MEANS: Record<string, string> = {
  Series: 'All the components are in one loop, so there is only one path for the current.',
  Parallel: 'The components are on separate branches, so the current splits between paths.',
}

const spBank: Bank = {
  skill: 'phys.elec.series-parallel',
  sorts: [
    {
      id: 'which',
      categories: ['Series', 'Parallel'],
      items: [
        ['the current is the same at every point', 'Series'],
        ['the potential difference of the supply is shared between the components', 'Series'],
        ['if one lamp breaks, all the others go out', 'Series'],
        ['there is only one path for the current', 'Series'],
        ['the current splits up between branches and joins again', 'Parallel'],
        ['each branch has the full potential difference of the supply', 'Parallel'],
        ['each lamp can be switched on and off on its own', 'Parallel'],
        ['if one lamp breaks, the others stay lit', 'Parallel'],
      ],
      ask: (x) => `Is this true of a series circuit or a parallel circuit: ${x}?`,
      hint: 'Series = one loop. Parallel = separate branches.',
      means: SP_MEANS,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'Why are the lights in a house wired in parallel rather than in series?',
      a: 'Each light gets the full mains voltage and can be switched on and off on its own',
      wrong: [{ label: 'Parallel circuits use less current in total', misconception: 'parallel-less-current', feedback: 'The total current is the sum of the branch currents, so it is not smaller.' }, 'So that if one bulb breaks, they all go off', 'Because parallel circuits need no wires'],
      hint: 'Think about switching off just the kitchen light.',
      why: 'In parallel, every branch has the full supply potential difference and its own switch. If one bulb fails, the rest stay on.',
      lv: [2, 4],
    },
    {
      q: 'Two identical lamps are connected in parallel to a cell. Compared with one lamp on its own, how bright is each lamp?',
      a: 'The same brightness',
      wrong: [{ label: 'Half as bright', misconception: 'parallel-dimmer', feedback: 'That is closer to what happens in series. In parallel each lamp gets the full potential difference.' }, 'Twice as bright', 'They do not light'],
      hint: 'Each branch is connected straight across the cell.',
      why: 'Each lamp has the full potential difference of the cell across it, so each is as bright as a single lamp. (The cell has to supply twice the current, so it runs down faster.)',
      lv: [3, 5],
    },
  ],
}

const spCalc = G('phys.elec.series-parallel.calc', 'phys.elec.series-parallel', [2, 5], (rng, d) => {
  if (d === 2) {
    const v = rng.pick([3, 4.5, 6, 9, 12])
    const v1 = rng.pick([1, 1.5, 2, 2.5, 3, 4].filter((x) => x < v))
    return num({
      prompt: `A lamp and a motor are connected in series to a ${fmt(v)} V battery. A voltmeter across the lamp reads ${fmt(v1)} V. What is the potential difference across the motor? Give your answer in volts.`,
      answer: round(v - v1),
      suffix: 'V',
      hint: 'In series, the supply potential difference is shared between the components.',
      explanation: `In series the p.d.s add up to the supply: ${fmt(v)} − ${fmt(v1)} = ${fmt(v - v1)} V.`,
      errors: [err(v, 'full-pd-series', 'In SERIES the p.d. is shared. Each component gets only part of it.'), err(round(v + v1, 6), 'added', 'The two p.d.s must add up to the supply, so subtract.')],
    })
  }
  if (d === 3) {
    const v = rng.pick([3, 6, 9, 12])
    const n = rng.pick([2, 3])
    return num({
      prompt: `${n} identical lamps are connected in series to a ${v} V battery. What is the potential difference across each lamp? Give your answer in volts.`,
      answer: round(v / n),
      suffix: 'V',
      hint: 'Identical components in series share the p.d. equally.',
      explanation: `${v} V ÷ ${n} = ${fmt(v / n)} V across each lamp.`,
      errors: [err(v, 'full-pd-series', 'In series the p.d. is shared between the lamps.')],
    })
  }
  if (d === 4) {
    const i1 = rng.pick([0.1, 0.2, 0.3, 0.4, 0.5])
    const i2 = rng.pick([0.2, 0.3, 0.5, 0.6, 0.8])
    const total = round(i1 + i2)
    return rng.chance(0.5)
      ? num({
          prompt: `Two lamps are connected in parallel. The current in one branch is ${fmt(i1)} A and in the other branch is ${fmt(i2)} A. What current flows from the cell (in the main part of the circuit)? Give your answer in amps.`,
          answer: total,
          suffix: 'A',
          hint: 'In parallel, the branch currents add up to the current in the main circuit.',
          explanation: `Total current = ${fmt(i1)} + ${fmt(i2)} = ${fmt(total)} A.`,
          errors: [err(i1, 'one-branch', 'Add BOTH branches together.')],
        })
      : num({
          prompt: `Two lamps are connected in parallel. The current from the cell is ${fmt(total)} A. The current through one lamp is ${fmt(i1)} A. What is the current through the other lamp? Give your answer in amps.`,
          answer: i2,
          suffix: 'A',
          hint: 'The current splits between the branches; the branch currents add up to the total.',
          explanation: `${fmt(total)} − ${fmt(i1)} = ${fmt(i2)} A.`,
          errors: [err(total, 'same-current', 'In PARALLEL the current splits between the branches.')],
        })
  }
  const v = rng.pick([1.5, 3, 4.5, 6, 9, 12])
  const n = rng.pick([2, 3])
  return num({
    prompt: `${n} lamps are connected in parallel, each on its own branch, to a ${fmt(v)} V battery. A voltmeter is connected across one of the lamps. What does it read? Give your answer in volts.`,
    answer: v,
    suffix: 'V',
    hint: 'Each parallel branch is connected straight across the battery.',
    explanation: `In parallel each branch has the full p.d. of the supply, so the voltmeter reads ${fmt(v)} V.`,
    errors: [err(round(v / n, 6), 'shared-in-parallel', 'The p.d. is shared in SERIES. In parallel every branch gets the full supply p.d.')],
  })
})

// =====================================================================================================================
// Resistance
// =====================================================================================================================

const resistanceCalc = G('phys.elec.resistance.calc', 'phys.elec.resistance', [1, 5], (rng, d) => {
  const r = rng.pick([2, 3, 4, 5, 6, 10, 12, 15, 20, 24, 30])
  const i = rng.pick([0.2, 0.25, 0.5, 1, 1.5, 2, 3])
  const v = round(r * i)
  if (d <= 2) {
    return num({
      prompt: `The potential difference across a resistor is ${fmt(v)} V and the current through it is ${fmt(i)} A. What is its resistance? Give your answer in ohms (Ω).`,
      answer: r,
      suffix: 'Ω',
      hint: 'Resistance = potential difference ÷ current.',
      explanation: `R = V ÷ I = ${fmt(v)} ÷ ${fmt(i)} = ${r} Ω.`,
      errors: [err(round(v * i, 6), 'multiplied', 'Resistance = p.d. DIVIDED by current.'), err(round(i / v, 6), 'upside-down', 'Divide the p.d. by the current.')],
    })
  }
  if (d === 3) {
    return num({
      prompt: `A current of ${fmt(i)} A flows through a ${r} Ω resistor. What is the potential difference across it? Give your answer in volts.`,
      answer: v,
      suffix: 'V',
      hint: 'Rearrange: potential difference = current × resistance.',
      explanation: `V = I × R = ${fmt(i)} × ${r} = ${fmt(v)} V.`,
      errors: [err(round(r / i, 6), 'divided', 'V = I × R. Multiply.')],
    })
  }
  if (d === 4) {
    return num({
      prompt: `A potential difference of ${fmt(v)} V is applied across a ${r} Ω resistor. What current flows? Give your answer in amps.`,
      answer: i,
      suffix: 'A',
      hint: 'Rearrange: current = potential difference ÷ resistance.',
      explanation: `I = V ÷ R = ${fmt(v)} ÷ ${r} = ${fmt(i)} A.`,
      errors: [err(round(v * r, 6), 'multiplied', 'I = V ÷ R.'), err(round(r / v, 6), 'upside-down', 'Divide the p.d. by the resistance.')],
    })
  }
  const ma = rng.pick([100, 200, 250, 400, 500])
  const r5 = rng.pick([10, 12, 20, 24, 30, 40, 60])
  const v5 = round((ma / 1000) * r5)
  return num({
    prompt: `A lamp has a potential difference of ${fmt(v5)} V across it and a current of ${ma} mA through it. What is its resistance? Give your answer in ohms (Ω).`,
    answer: r5,
    suffix: 'Ω',
    hint: 'Change mA to A first (÷ 1000), then R = V ÷ I.',
    explanation: `${ma} mA = ${fmt(ma / 1000)} A. R = ${fmt(v5)} ÷ ${fmt(ma / 1000)} = ${r5} Ω.`,
    errors: [err(round(v5 / ma, 9), 'no-conversion', 'Change the current from mA to A first.')],
  })
})

const wires = G('phys.elec.resistance.wires', 'phys.elec.resistance', [2, 4], (rng) => {
  const byLength = rng.chance(0.5)
  const vals = byLength ? rng.shuffle([20, 40, 60, 80, 100]).slice(0, 4) : rng.shuffle([0.2, 0.3, 0.5, 0.8, 1.0]).slice(0, 4)
  const names = ['Wire A', 'Wire B', 'Wire C', 'Wire D']
  const rows = names.map((n, k) => (byLength ? [n, vals[k] as number, 0.5] : [n, 50, vals[k] as number]))
  const best = byLength ? names[vals.indexOf(Math.max(...vals))] : names[vals.indexOf(Math.min(...vals))]
  return choice({
    rng,
    prompt: `These wires are all made of the same metal. Which has the highest resistance?`,
    figure: table(['Wire', 'Length (cm)', 'Thickness (mm)'], rows),
    correct: best as string,
    wrong: names.filter((n) => n !== best).map((n) => ({ label: n, misconception: byLength ? 'resistance-length' : 'resistance-thickness', feedback: byLength ? 'All have the same thickness. A longer wire has more resistance.' : 'All have the same length. A THINNER wire has more resistance.' })),
    keepOrder: true,
    hint: 'Longer wires and thinner wires make it harder for the current to flow.',
    explanation: byLength
      ? `They are the same thickness, so the longest wire (${best}, ${fmt(Math.max(...vals))} cm) has the most resistance: the electrons have further to travel through the metal.`
      : `They are the same length, so the thinnest wire (${best}, ${fmt(Math.min(...vals))} mm) has the most resistance: there is less room for the current to flow.`,
  })
})

const resistanceBank: Bank = {
  skill: 'phys.elec.resistance',
  mcqs: [
    {
      q: 'What is the unit of resistance?',
      a: 'ohm (Ω)',
      wrong: [{ label: 'volt (V)', misconception: 'resistance-volt', feedback: 'Volts measure potential difference.' }, 'amp (A)', 'watt (W)'],
      hint: 'Named after Georg Ohm.',
      why: 'Resistance is measured in ohms (Ω). R = V ÷ I, so 1 Ω = 1 V per amp.',
      lv: [1, 2],
    },
    {
      q: 'The resistance in a circuit is increased but the potential difference stays the same. What happens to the current?',
      a: 'It decreases',
      wrong: [{ label: 'It increases', misconception: 'resistance-increases-current', feedback: 'Resistance opposes the current: more resistance, less current.' }, 'It stays the same', 'It reverses direction'],
      hint: 'I = V ÷ R.',
      why: 'Resistance opposes the flow of charge. With the same push (p.d.), a bigger resistance means a smaller current.',
      lv: [2, 4],
    },
    {
      q: 'Why are the connecting wires in circuits usually made of copper?',
      a: 'Copper has a very low resistance',
      wrong: [{ label: 'Copper has a very high resistance', misconception: 'copper-high-r', feedback: 'Connecting wires should let current flow easily, so they need LOW resistance.' }, 'Copper is magnetic', 'Copper is an insulator'],
      hint: 'You want the wires to waste as little energy as possible.',
      why: 'Copper is an excellent conductor with a very low resistance, so very little energy is wasted heating the wires.',
      lv: [1, 3],
    },
    {
      q: 'What happens to a component when current flows through its resistance?',
      a: 'It warms up, because energy is transferred by heating',
      wrong: [{ label: 'It cools down', misconception: 'resistance-cools', feedback: 'Resistance makes components warm up.' }, 'It becomes magnetic', 'Nothing happens'],
      hint: 'Think of a toaster or a filament lamp.',
      why: 'As charge is pushed through a resistance, energy is transferred to the component\'s thermal store, so it heats up. Heaters and toasters use this on purpose.',
      lv: [2, 4],
    },
  ],
}

// =====================================================================================================================
// Static electricity
// =====================================================================================================================

interface Rub {
  thing: string
  cloth: string
  thingGains: boolean
}

const RUBS: Rub[] = [
  { thing: 'polythene rod', cloth: 'woollen cloth', thingGains: true },
  { thing: 'acetate rod', cloth: 'cloth', thingGains: false },
  { thing: 'balloon', cloth: 'woollen jumper', thingGains: true },
  { thing: 'balloon', cloth: 'your hair', thingGains: true },
]

const charging = G('phys.elec.static.rub', 'phys.elec.static', [1, 5], (rng, d) => {
  const r = rng.pick(RUBS)
  const thingCharge = r.thingGains ? 'negative' : 'positive'
  const clothCharge = r.thingGains ? 'positive' : 'negative'
  const mode = d <= 2 ? 'thing' : d === 3 ? 'cloth' : 'move'
  if (mode === 'move') {
    const correct = r.thingGains ? `Electrons move from the ${r.cloth.replace('your ', '')} to the ${r.thing}` : `Electrons move from the ${r.thing} to the ${r.cloth}`
    const reverse = r.thingGains ? `Electrons move from the ${r.thing} to the ${r.cloth.replace('your ', '')}` : `Electrons move from the ${r.cloth} to the ${r.thing}`
    return choice({
      rng,
      prompt: `${cap1(an(r.thing))} ${r.thing} is rubbed with ${r.cloth.startsWith('your') ? r.cloth : `a ${r.cloth}`} and becomes ${thingCharge}ly charged. What has happened?`,
      correct,
      wrong: [
        { label: reverse, misconception: 'electron-direction', feedback: `Gaining electrons makes something negative. The ${r.thing} is ${thingCharge}.` },
        { label: r.thingGains ? `Protons move from the ${r.thing} to the ${r.cloth.replace('your ', '')}` : `Protons move from the ${r.cloth} to the ${r.thing}`, misconception: 'protons-move', feedback: 'Protons are locked in the nuclei of atoms. Only electrons move when things are rubbed.' },
        'Charge is created by the rubbing',
      ],
      hint: 'Only electrons (negative) move. Gaining them makes an object negative; losing them makes it positive.',
      explanation: `The ${r.thing} became ${thingCharge}, so it ${r.thingGains ? 'gained' : 'lost'} electrons. ${r.thingGains ? `They came from the ${r.cloth.replace('your ', '')}` : `They went to the ${r.cloth}`}, which is left ${clothCharge}. No charge is created; it is moved.`,
    })
  }
  const askThing = mode === 'thing'
  return choice({
    rng,
    prompt: `${cap1(an(r.thing))} ${r.thing} is rubbed with ${r.cloth.startsWith('your') ? r.cloth : `a ${r.cloth}`}. Electrons move ${r.thingGains ? `onto the ${r.thing}` : `off the ${r.thing}`}. What charge does the ${askThing ? r.thing : r.cloth.replace('your ', '')} end up with?`,
    correct: askThing ? cap1(thingCharge) : cap1(clothCharge),
    wrong: [
      { label: askThing ? cap1(clothCharge) : cap1(thingCharge), misconception: 'charge-sign', feedback: 'Electrons are negative: gaining them makes an object negative, losing them leaves it positive.' },
      { label: 'No charge', misconception: 'no-charge', feedback: 'Rubbing has moved electrons, so both objects are now charged.' },
    ],
    keepOrder: true,
    hint: 'Electrons are negatively charged.',
    explanation: `Electrons are negative. The ${r.thing} ${r.thingGains ? 'gains' : 'loses'} electrons, so it becomes ${thingCharge}; the ${r.cloth.replace('your ', '')} ${r.thingGains ? 'loses' : 'gains'} them and becomes ${clothCharge}.`,
  })
})

function cap1(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const forcesOfCharges = G('phys.elec.static.forces', 'phys.elec.static', [1, 3], (rng) => {
  const a = rng.pick(['positive', 'negative'])
  const b = rng.pick(['positive', 'negative'])
  const correct = a === b ? 'They repel (push apart)' : 'They attract (pull together)'
  return choice({
    rng,
    prompt: `A ${a}ly charged balloon is hung near a ${b}ly charged rod. What happens?`,
    correct,
    wrong: [a === b ? { label: 'They attract (pull together)', misconception: 'like-attract', feedback: 'Like charges repel.' } : { label: 'They repel (push apart)', misconception: 'unlike-repel', feedback: 'Opposite charges attract.' }, 'Nothing, because they are not touching'],
    hint: 'Like charges repel; unlike (opposite) charges attract.',
    explanation: `${cap1(a)} and ${b}: ${a === b ? 'like charges repel' : 'opposite charges attract'}. Electrostatic forces are non-contact forces, so they act across the gap.`,
  })
})

const staticBank: Bank = {
  skill: 'phys.elec.static',
  mcqs: [
    {
      q: 'A charged balloon sticks to an uncharged wall. Why?',
      a: 'The balloon\'s charge pulls opposite charges in the wall slightly towards it, so they attract',
      wrong: [{ label: 'The wall has the same charge as the balloon', misconception: 'like-attract', feedback: 'Like charges would repel. The wall is neutral overall.' }, 'Glue is made by the rubbing', 'Gravity is stronger near walls'],
      hint: 'Charged objects can attract neutral ones.',
      why: 'The charged balloon pushes like charges in the wall\'s surface slightly away and pulls opposite charges closer. The nearby opposite charge attracts the balloon more strongly than the further like charge repels it.',
      lv: [4, 5],
    },
    {
      q: 'What is the region around a charged object, where other charges feel a force, called?',
      a: 'An electric field',
      wrong: [{ label: 'A magnetic field', misconception: 'electric-magnetic', feedback: 'Magnetic fields are around magnets and currents. Charges have electric fields.' }, 'A gravitational field', 'A force field of air'],
      hint: 'Magnets have magnetic fields; charges have...',
      why: 'A charged object has an electric field around it. Another charge in that field feels a force, which is stronger closer to the object.',
      lv: [2, 4],
    },
    {
      q: 'Why can you sometimes get a small shock from a car door after sliding across the seat?',
      a: 'You become charged by friction, and the charge jumps to the metal as a spark',
      wrong: [{ label: 'The car battery leaks current into the door', misconception: 'battery-shock', feedback: 'It is static charge built up by rubbing on the seat.' }, 'The door is magnetic', 'Air resistance builds up on the door'],
      hint: 'What happens when two materials rub together?',
      why: 'Sliding across the seat transfers electrons, so you become charged. When you touch the metal door, the charge flows suddenly, making a small spark.',
      lv: [3, 5],
    },
    {
      q: 'When an object is charged by rubbing, which particles move?',
      a: 'Only electrons',
      wrong: [{ label: 'Only protons', misconception: 'protons-move', feedback: 'Protons are held in the nucleus. Electrons are on the outside of atoms and can be rubbed off.' }, 'Both protons and electrons', 'Whole atoms'],
      hint: 'They are on the outside of atoms.',
      why: 'Electrons are on the outside of atoms and can be moved by rubbing. An object that gains electrons becomes negative; one that loses them becomes positive.',
      lv: [1, 3],
    },
  ],
}

// =====================================================================================================================
// Magnets
// =====================================================================================================================

const MAG_MEANS: Record<string, string> = {
  Magnetic: 'It is (or contains) iron, nickel or cobalt, so a magnet attracts it.',
  'Not magnetic': 'It is not made of iron, nickel or cobalt, so a magnet does not attract it.',
}

const magnetsBank: Bank = {
  skill: 'phys.mag.magnets',
  sorts: [
    {
      id: 'magnetic',
      categories: ['Magnetic', 'Not magnetic'],
      items: [
        ['an iron nail', 'Magnetic'],
        ['a steel paperclip', 'Magnetic'],
        ['a piece of nickel', 'Magnetic'],
        ['a piece of cobalt', 'Magnetic'],
        ['iron filings', 'Magnetic'],
        ['an aluminium drinks can', 'Not magnetic'],
        ['a copper wire', 'Not magnetic'],
        ['a brass key', 'Not magnetic'],
        ['a gold ring', 'Not magnetic'],
        ['a plastic ruler', 'Not magnetic'],
        ['a wooden pencil', 'Not magnetic'],
      ],
      ask: (x) => `Is ${x} magnetic or not magnetic?`,
      hint: 'Only iron, nickel and cobalt (and alloys containing them, like steel) are magnetic. Most metals are not.',
      means: MAG_MEANS,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'Which of these metals is magnetic?',
      a: 'Iron',
      wrong: [{ label: 'Aluminium', misconception: 'all-metals-magnetic', feedback: 'Most metals are NOT magnetic. Only iron, nickel and cobalt (and steel) are.' }, 'Copper', 'Gold'],
      hint: 'Only three elements are magnetic at room temperature.',
      why: 'Iron, nickel and cobalt are the magnetic elements. Steel is magnetic because it is mostly iron.',
      lv: [1, 3],
    },
    {
      q: 'On a diagram of a bar magnet\'s field, which way do the field lines point?',
      a: 'From the north pole to the south pole',
      wrong: [{ label: 'From the south pole to the north pole', misconception: 'field-direction', feedback: 'By convention, field lines go out of the north pole and into the south pole.' }, 'Round in circles around the middle', 'Straight out from the middle of the magnet'],
      hint: 'They show the way a compass needle\'s north end would point.',
      why: 'Magnetic field lines go from north to south outside the magnet. They are closest together (strongest field) at the poles.',
      lv: [2, 4],
    },
    {
      q: 'Where is the magnetic field of a bar magnet strongest?',
      a: 'At the poles',
      wrong: [{ label: 'In the middle', misconception: 'strongest-middle', feedback: 'The middle of a bar magnet attracts very few iron filings. The field lines crowd together at the poles.' }, 'It is the same everywhere', 'Far away from the magnet'],
      hint: 'Where do most iron filings collect?',
      why: 'The field lines are closest together at the poles, which is where the field is strongest and where iron filings cluster.',
      lv: [1, 3],
    },
    {
      q: 'A bar magnet is snapped in half. What do you get?',
      a: 'Two smaller magnets, each with a north and a south pole',
      wrong: [{ label: 'One north pole and one separate south pole', misconception: 'monopole', feedback: 'You can never get a north pole on its own. Each piece becomes a complete magnet.' }, 'Two pieces of unmagnetised metal', 'Two north poles'],
      hint: 'Can a magnet have only one pole?',
      why: 'Every magnet has both a north and a south pole. Each half becomes a new, complete magnet.',
      lv: [3, 5],
    },
    {
      q: 'You have a bar of metal that might be a magnet. Which test PROVES it is a magnet?',
      a: 'One end of it repels a pole of a known magnet',
      wrong: [{ label: 'It is attracted to a known magnet', misconception: 'attraction-proves', feedback: 'An unmagnetised iron bar is attracted too. Only a magnet can repel a magnet.' }, 'It is made of metal', 'It feels heavy'],
      hint: 'Iron is attracted by a magnet even if it is not a magnet itself.',
      why: 'A magnet attracts any magnetic material, so attraction proves nothing. Repulsion only happens between two magnets, so repulsion is the test.',
      lv: [4, 5],
    },
    {
      q: 'The north-seeking end of a compass needle points towards the Earth\'s geographic North Pole. What kind of magnetic pole must be near there?',
      a: 'A magnetic south pole',
      wrong: [{ label: 'A magnetic north pole', misconception: 'north-attracts-north', feedback: 'Like poles repel. For the north end of the needle to be pulled that way, the pole there must be magnetic south.' }, 'There is no magnetic pole there', 'It depends on the weather'],
      hint: 'Opposite poles attract.',
      why: 'The north end of the compass is attracted towards the Arctic, and opposite poles attract, so the Earth\'s magnetic pole near the geographic North Pole is a magnetic south pole.',
      lv: [5, 5],
    },
    {
      q: 'Why does a compass needle point roughly north?',
      a: 'It lines up with the Earth\'s magnetic field',
      wrong: [{ label: 'It is attracted to the North Star', misconception: 'compass-star', feedback: 'Stars have nothing to do with it: it is the Earth\'s magnetism.' }, 'North is downhill', 'The Sun\'s gravity pulls it'],
      hint: 'The Earth behaves as if it has a giant bar magnet inside it.',
      why: 'A compass needle is a small magnet. It lines up with the Earth\'s magnetic field, which acts as if there were a huge bar magnet inside the Earth.',
      lv: [1, 3],
    },
  ],
}

const poles = G('phys.mag.magnets.poles', 'phys.mag.magnets', [1, 3], (rng) => {
  const a = rng.pick(['north', 'south'])
  const b = rng.pick(['north', 'south'])
  const correct = a === b ? 'They repel' : 'They attract'
  return choice({
    rng,
    prompt: `The ${a} pole of one magnet is brought near the ${b} pole of another. What happens?`,
    correct,
    wrong: [a === b ? { label: 'They attract', misconception: 'like-poles-attract', feedback: 'Like poles repel.' } : { label: 'They repel', misconception: 'unlike-poles-repel', feedback: 'Opposite poles attract.' }, 'Nothing happens unless they touch'],
    hint: 'Like poles repel; unlike poles attract.',
    explanation: `${cap1(a)} and ${b}: ${a === b ? 'like poles repel' : 'unlike poles attract'}. Magnetism is a non-contact force, so it acts across the gap.`,
  })
})

// =====================================================================================================================
// Electromagnets
// =====================================================================================================================

const electroCompare = G('phys.mag.electromagnets.compare', 'phys.mag.electromagnets', [2, 5], (rng, d) => {
  const turnsA = rng.pick([10, 20, 30])
  const currentA = rng.pick([0.5, 1, 1.5])
  const coreA = rng.chance(0.7)
  const change = rng.pick(d <= 3 ? ['turns', 'current', 'core'] : ['turns', 'current', 'core', 'two'])
  let turnsB = turnsA
  let currentB = currentA
  let coreB = coreA
  const up = rng.chance(0.5)
  if (change === 'turns' || change === 'two') turnsB = up ? turnsA * 2 : turnsA / 2
  if (change === 'current' || change === 'two') currentB = up ? currentA * 2 : currentA / 2
  if (change === 'core') coreB = !coreA
  const strength = (t: number, c: number, core: boolean) => t * c * (core ? 10 : 1)
  const sA = strength(turnsA, currentA, coreA)
  const sB = strength(turnsB, currentB, coreB)
  const desc = (t: number, c: number, core: boolean) => `${t} turns of wire, ${fmt(c)} A, ${core ? 'iron core' : 'no core'}`
  const correct = sB > sA ? 'Electromagnet B' : 'Electromagnet A'
  return choice({
    rng,
    prompt: `Two electromagnets are made from the same kind of wire.\nA: ${desc(turnsA, currentA, coreA)}\nB: ${desc(turnsB, currentB, coreB)}\nWhich one is stronger?`,
    correct,
    wrong: [sB > sA ? 'Electromagnet A' : 'Electromagnet B', { label: 'They are equally strong', misconception: 'factor-no-effect', feedback: 'More turns, more current and an iron core all make an electromagnet stronger.' }],
    keepOrder: true,
    hint: 'More turns, a bigger current and an iron core all make an electromagnet stronger.',
    explanation: `${change === 'core' ? `B ${coreB ? 'has' : 'does not have'} an iron core` : change === 'turns' ? `B has ${up ? 'more' : 'fewer'} turns` : change === 'current' ? `B has ${up ? 'a bigger' : 'a smaller'} current` : `B has ${up ? 'more turns AND a bigger current' : 'fewer turns AND a smaller current'}`}, so ${correct.replace('Electromagnet ', '')} is stronger.`,
  })
})

const clipsChart = G('phys.mag.electromagnets.chart', 'phys.mag.electromagnets', [2, 4], (rng, d) => {
  const per10 = rng.pick([2, 3, 4, 5])
  const turns = [10, 20, 30, 40]
  const clips = turns.map((t) => (t / 10) * per10)
  const fig = { type: 'bar-chart' as const, bars: turns.map((t, k) => ({ label: `${t} turns`, value: clips[k] as number })), yLabel: 'Paperclips picked up', showValues: true }
  if (d <= 3) {
    const [x, y] = rng.shuffle([0, 1, 2, 3]).slice(0, 2).sort() as [number, number]
    return num({
      prompt: `A class tests how the number of turns on an electromagnet affects how many paperclips it can pick up (same current, same iron core). How many more paperclips did the ${turns[y]}-turn electromagnet pick up than the ${turns[x]}-turn one?`,
      figure: fig,
      answer: (clips[y] as number) - (clips[x] as number),
      suffix: 'paperclips',
      hint: 'Read both bars, then subtract.',
      explanation: `${clips[y]} − ${clips[x]} = ${(clips[y] as number) - (clips[x] as number)} paperclips. More turns made a stronger electromagnet.`,
    })
  }
  return num({
    prompt: 'A class tests how the number of turns on an electromagnet affects how many paperclips it can pick up (same current, same iron core). If the pattern continues, how many paperclips would a 60-turn electromagnet pick up?',
    figure: fig,
    answer: 6 * per10,
    suffix: 'paperclips',
    hint: 'How many extra paperclips does each extra 10 turns add?',
    explanation: `Each extra 10 turns picks up ${per10} more paperclips (the number is proportional to the turns). 60 turns: 6 × ${per10} = ${6 * per10} paperclips.`,
  })
})

const electroBank: Bank = {
  skill: 'phys.mag.electromagnets',
  terms: [
    { term: 'Electromagnet', def: 'A magnet made by passing a current through a coil of wire, which can be switched on and off' },
    { term: 'Solenoid', def: 'A long coil of wire; with a current in it, its field is like a bar magnet\'s' },
    { term: 'Iron core', def: 'A piece of iron inside a coil that makes the electromagnet much stronger' },
    { term: 'Motor effect', def: 'The force on a current-carrying wire placed in a magnetic field' },
  ],
  mcqs: [
    {
      q: 'What is the shape of the magnetic field around a single straight wire carrying a current?',
      a: 'Circles around the wire',
      wrong: [{ label: 'Straight lines along the wire', misconception: 'field-along-wire', feedback: 'Plotting compasses placed around the wire point in a circle.' }, 'There is no magnetic field', 'Like a bar magnet with poles at each end of the wire'],
      hint: 'Imagine plotting compasses placed all around the wire.',
      why: 'A current in a wire makes a magnetic field of circles around it. Coiling the wire concentrates the field.',
      lv: [3, 5],
    },
    {
      q: 'Why is an electromagnet, rather than a permanent magnet, used to lift cars in a scrapyard?',
      a: 'It can be switched off to drop the car',
      wrong: [{ label: 'It is not affected by iron', misconception: 'electromagnet-iron', feedback: 'It attracts iron and steel strongly. The key is that it can be turned off.' }, 'It never needs electricity', 'Permanent magnets cannot attract steel'],
      hint: 'How would you get the car OFF a permanent magnet?',
      why: 'Switching off the current turns the electromagnet off, so the crane can drop the load exactly where it is wanted.',
      lv: [1, 3],
    },
    {
      q: 'What happens to an electromagnet\'s poles if the current is reversed?',
      a: 'The north and south poles swap over',
      wrong: [{ label: 'It stops being a magnet', misconception: 'reverse-off', feedback: 'It is still a magnet; the field just points the other way.' }, 'It gets twice as strong', 'Nothing changes'],
      hint: 'The direction of the field depends on the direction of the current.',
      why: 'Reversing the current reverses the direction of the magnetic field, so the poles swap.',
      lv: [2, 4],
    },
    {
      q: 'Which of these uses an electromagnet?',
      a: 'An electric bell',
      wrong: ['A compass', { label: 'A fridge magnet', misconception: 'permanent-vs-electro', feedback: 'A fridge magnet is a permanent magnet: it needs no current.' }, 'A solar cell'],
      hint: 'Which one needs a current to make it magnetic?',
      why: 'An electric bell uses an electromagnet that switches on and off rapidly to pull the hammer onto the gong. Relays, loudspeakers and MRI scanners also use electromagnets.',
      lv: [1, 3],
    },
    {
      q: 'A wire carrying a current is placed between the poles of a magnet. What happens?',
      a: 'A force acts on the wire, which can make it move',
      wrong: [{ label: 'Nothing, because copper is not magnetic', misconception: 'copper-no-force', feedback: 'The current makes its own magnetic field, which interacts with the magnet\'s field.' }, 'The magnet loses its magnetism', 'The current stops'],
      hint: 'This is how electric motors work.',
      why: 'The magnetic field of the current interacts with the field of the magnet, producing a force on the wire: the motor effect. Electric motors use it to make a coil spin.',
      lv: [4, 5],
    },
  ],
  written: [
    {
      prompt: 'Plan an investigation into how the current affects the strength of an electromagnet. Say what you would change, measure and keep the same.',
      model:
        'I would wrap 20 turns of insulated wire around an iron nail and connect it to a variable power supply with an ammeter in series. I would change the current (for example 0.5 A, 1.0 A, 1.5 A, 2.0 A) and count how many paperclips the nail can pick up each time. I would keep the number of turns, the nail and the type of paperclip the same, and switch off between readings so the wire does not get hot. I would repeat each reading three times and work out a mean.',
      checklist: ['Changes the current (independent variable)', 'Measures strength, e.g. number of paperclips picked up', 'Keeps the turns and core the same (control variables)', 'Repeats readings and finds a mean', 'Mentions a safety point, such as switching off so the wire does not overheat'],
      hint: 'Independent, dependent and control variables; how to measure strength; repeats.',
      passMark: 3,
    },
  ],
}

export const electricityGenerators: ItemGenerator[] = [
  ...bankGenerators(basicBank),
  ...bankGenerators(currentBank),
  cellsCalc,
  ...bankGenerators(spBank),
  spCalc,
  resistanceCalc,
  wires,
  ...bankGenerators(resistanceBank),
  charging,
  forcesOfCharges,
  ...bankGenerators(staticBank),
  ...bankGenerators(magnetsBank),
  poles,
  electroCompare,
  clipsChart,
  ...bankGenerators(electroBank),
]
