import type { ItemGenerator } from '@/engine/registry'
import { choice } from '../../kit'
import { bankGenerators, err, fmt, G, num, round, table, type Bank } from './factory'

// =====================================================================================================================
// Forces and force diagrams
// =====================================================================================================================

const CONTACT_MEANS: Record<string, string> = {
  'Contact force': 'The two objects have to be touching for this force to act.',
  'Non-contact force': 'This force acts at a distance, without the objects touching.',
}

const typesBank: Bank = {
  skill: 'phys.forces.types',
  terms: [
    { term: 'Weight', def: 'The force of gravity pulling an object towards the Earth' },
    { term: 'Friction', def: 'A force that opposes motion when two surfaces slide or try to slide over each other' },
    { term: 'Air resistance', def: 'A force from the air that opposes motion of an object moving through it' },
    { term: 'Upthrust', def: 'The upward push of a liquid or gas on an object in it' },
    { term: 'Tension', def: 'The pulling force in a stretched rope, string or cable' },
    { term: 'Normal contact force', def: 'The push of a surface on an object resting on it, at right angles to the surface' },
    { term: 'Newton', def: 'The unit of force' },
  ],
  sorts: [
    {
      id: 'contact',
      categories: ['Contact force', 'Non-contact force'],
      items: [
        ['friction', 'Contact force'],
        ['air resistance', 'Contact force'],
        ['water resistance', 'Contact force'],
        ['upthrust', 'Contact force'],
        ['tension', 'Contact force'],
        ['the push of the floor on your feet', 'Contact force'],
        ['weight (gravity)', 'Non-contact force'],
        ['magnetic force', 'Non-contact force'],
        ['electrostatic force', 'Non-contact force'],
      ],
      ask: (x) => `Is ${x} a contact force or a non-contact force?`,
      hint: 'Do the objects have to touch? Gravity, magnetism and static electricity act at a distance.',
      means: CONTACT_MEANS,
      lv: [1, 4],
    },
  ],
  links: [
    {
      prompt: 'Match each situation to the force described.',
      pairs: [
        ['A rope towing a broken-down car', 'Tension'],
        ['A boat floating on a lake', 'Upthrust'],
        ['An apple falling from a tree', 'Weight'],
        ['A parachute slowing a skydiver', 'Air resistance'],
        ['Bicycle brakes slowing the wheel', 'Friction'],
        ['A magnet pulling a paperclip', 'Magnetic force'],
        ['A table holding up a book', 'Normal contact force'],
      ],
      hint: 'Is it a pull in a rope, a push from a fluid, gravity, rubbing surfaces, or a magnet?',
      ask: (l) => `Which force is described? "${l}"`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'What instrument is used to measure the size of a force?',
      a: 'A newtonmeter (force meter)',
      wrong: [{ label: 'A balance (scales)', misconception: 'balance-force', feedback: 'Kitchen scales usually show mass in grams. A newtonmeter measures force in newtons.' }, 'A thermometer', 'An ammeter'],
      hint: 'It is named after the unit of force.',
      why: 'A newtonmeter has a spring inside that stretches more for a bigger force. It reads in newtons.',
      lv: [1, 2],
    },
    {
      q: 'On a force diagram, what does the length of an arrow show?',
      a: 'The size of the force',
      wrong: [{ label: 'How far the object will move', misconception: 'arrow-distance', feedback: 'The arrow shows the force, not a distance moved.' }, 'How long the force lasts', 'The mass of the object'],
      hint: 'A bigger force gets a longer arrow.',
      why: 'Force arrows show size (by their length) and direction (by where they point).',
      lv: [1, 3],
    },
    {
      q: 'You push on a wall with a force of 50 N. What force does the wall exert on you?',
      a: '50 N, pushing back on you',
      wrong: [{ label: 'No force, walls cannot push', misconception: 'walls-no-force', feedback: 'Forces come in pairs. If you push the wall, the wall pushes back on you equally.' }, 'Less than 50 N', 'More than 50 N'],
      hint: 'Forces always come in pairs when two objects interact.',
      why: 'When two objects interact they push or pull on each other with equal forces in opposite directions. The wall pushes back on you with 50 N.',
      lv: [3, 5],
    },
    {
      q: 'A book rests on a table. The Earth pulls down on the book. Which force is the other half of this interaction pair?',
      a: 'The book pulling up on the Earth',
      wrong: [{ label: 'The table pushing up on the book', misconception: 'pair-vs-balance', feedback: 'That force balances the weight, but it is between the table and the book, so it is a different interaction.' }, 'The book pushing down on the table', 'Friction on the book'],
      hint: 'An interaction pair is between the SAME two objects: the Earth and the book.',
      why: 'The Earth pulls the book down, so the book pulls the Earth up with an equal force. The table\'s upward push balances the book\'s weight, but it is part of the book-table interaction instead.',
      lv: [4, 5],
    },
  ],
}

// =====================================================================================================================
// Balanced and unbalanced forces
// =====================================================================================================================

const resultant = G('phys.forces.balanced.resultant', 'phys.forces.balanced', [1, 5], (rng, d) => {
  const vals = [10, 20, 30, 40, 50, 60, 80, 100, 150, 200, 250, 300, 400, 500]
  if (d <= 2) {
    const [a, b] = rng.shuffle(vals).slice(0, 2) as [number, number]
    const big = Math.max(a, b)
    const small = Math.min(a, b)
    return num({
      prompt: `A box is pushed to the right with a force of ${big} N. Friction acts to the left with a force of ${small} N. What is the size of the resultant force? Give your answer in newtons.`,
      answer: big - small,
      suffix: 'N',
      hint: 'Forces in opposite directions: subtract the smaller from the bigger.',
      explanation: `Resultant force = ${big} − ${small} = ${big - small} N, to the right.`,
      errors: [err(big + small, 'added-opposite', 'The forces act in opposite directions, so subtract them.')],
    })
  }
  if (d === 3) {
    const [a, b] = rng.shuffle([100, 120, 150, 200, 250, 300]).slice(0, 2) as [number, number]
    const right = a + b
    const c = rng.pick([50, 100, 150, 200, 250].filter((x) => x < right))
    const left = c
    const r = right - left
    const dir = 'to the right'
    return num({
      prompt: `Two people push a car to the right with forces of ${a} N and ${b} N. Friction acts to the left with a force of ${c} N. What is the size of the resultant force? Give your answer in newtons.`,
      answer: Math.abs(r),
      suffix: 'N',
      hint: 'Add the forces acting to the right. Then compare with the force to the left.',
      explanation: `To the right: ${a} + ${b} = ${right} N. To the left: ${c} N. Resultant = ${right} − ${left} = ${Math.abs(r)} N ${dir}, so the car speeds up.`,
      errors: [err(a + b + c, 'added-all', 'Friction acts the opposite way, so subtract it.')],
    })
  }
  if (d === 4) {
    const weight = rng.pick([200, 300, 400, 500, 600, 700, 800])
    const thing = rng.pick(['A skydiver falling at a steady speed', 'A hot air balloon hovering at a steady height', 'A lift moving up at a steady speed'])
    const up = thing.startsWith('A skydiver') ? 'air resistance' : thing.startsWith('A hot') ? 'upthrust' : 'tension in the cable'
    return num({
      prompt: `${thing} has a weight of ${weight} N. What is the size of the ${up} acting on it? Give your answer in newtons.`,
      answer: weight,
      suffix: 'N',
      hint: 'Steady speed (or staying still) means the forces are balanced.',
      explanation: `The motion is not changing, so the forces are balanced: the ${up} upwards equals the weight downwards, ${weight} N.`,
      errors: [err(0, 'steady-means-zero', 'The resultant force is zero, but each force is not. The upward force must equal the weight.')],
    })
  }
  // Level 5: a tug of war.
  const left = rng.shuffle([150, 200, 250, 300, 350]).slice(0, 3)
  const right = rng.shuffle([150, 200, 250, 300, 350, 400]).slice(0, 3)
  const L = left.reduce((x, y) => x + y, 0)
  const R = right.reduce((x, y) => x + y, 0)
  return num({
    prompt: `In a tug of war, the team on the left pull with forces of ${left.join(' N, ')} N. The team on the right pull with ${right.join(' N, ')} N. What is the size of the resultant force on the rope? Give your answer in newtons.`,
    answer: Math.abs(L - R),
    suffix: 'N',
    hint: 'Add up each team, then find the difference.',
    explanation: `Left team: ${left.join(' + ')} = ${L} N. Right team: ${right.join(' + ')} = ${R} N. Resultant = ${Math.abs(L - R)} N${L === R ? ': the forces are balanced and the rope does not move' : ` towards the ${L > R ? 'left' : 'right'}`}.`,
    errors: [err(L + R, 'added-teams', 'The teams pull in opposite directions, so find the difference.')],
  })
})

const motionEffect = G('phys.forces.balanced.effect', 'phys.forces.balanced', [2, 4], (rng) => {
  const s = rng.pick([
    { who: 'A car', fwd: 'driving force', back: 'total of air resistance and friction' },
    { who: 'A cyclist', fwd: 'force from pedalling', back: 'total of air resistance and friction' },
    { who: 'A boat', fwd: 'push from the engine', back: 'water resistance' },
    { who: 'A runner', fwd: 'push from her legs', back: 'air resistance' },
  ])
  const F = rng.pick([200, 300, 400, 500, 600, 800])
  const kind = rng.pick(['faster', 'slower', 'steady'] as const)
  const B = kind === 'steady' ? F : kind === 'faster' ? F - rng.pick([50, 100, 150]) : F + rng.pick([50, 100, 150])
  const correct = kind === 'faster' ? 'It speeds up' : kind === 'slower' ? 'It slows down' : 'It keeps moving at the same speed'
  return choice({
    rng,
    prompt: `${s.who} is moving forwards. The ${s.fwd} is ${F} N forwards, and the ${s.back} is ${B} N backwards. What happens to its motion?`,
    correct,
    wrong: [
      ...(kind === 'steady' ? [{ label: 'It stops', misconception: 'balanced-means-stopped', feedback: 'Balanced forces do not stop a moving object. It carries on at the same speed.' }] : []),
      ...['It speeds up', 'It slows down', 'It keeps moving at the same speed'].filter((x) => x !== correct).map((x) => ({ label: x, misconception: 'resultant-effect', feedback: `The resultant force is ${Math.abs(F - B)} N ${F > B ? 'forwards' : F < B ? 'backwards' : '(balanced)'}.` })),
    ],
    hint: 'Find the resultant force. Forwards: speeds up. Backwards: slows down. Zero: no change in speed.',
    explanation: F === B
      ? `The forces are balanced (resultant 0 N), so its speed does not change: it carries on at a steady speed.`
      : `The resultant force is ${Math.abs(F - B)} N ${F > B ? 'forwards, so it speeds up' : 'backwards, so it slows down'}.`,
  })
})

const balancedBank: Bank = {
  skill: 'phys.forces.balanced',
  mcqs: [
    {
      q: 'A car is travelling along a straight road at a steady speed. What can you say about the forces on it?',
      a: 'They are balanced',
      wrong: [{ label: 'The forward force is bigger than the backward force', misconception: 'motion-needs-force', feedback: 'An overall forward force would make it speed up. Steady speed means balanced forces.' }, 'There are no forces on it', 'The backward force is bigger'],
      hint: 'Is its speed changing?',
      why: 'If the speed and direction are not changing, the forces are balanced (the resultant force is zero). Moving objects do not need an overall force to keep moving.',
      lv: [2, 4],
    },
    {
      q: 'What do we call it when the forces on an object are balanced?',
      a: 'Equilibrium',
      wrong: ['Acceleration', { label: 'Friction', misconception: 'balanced-friction', feedback: 'Friction is one kind of force, not a description of balanced forces.' }, 'Momentum'],
      hint: 'It starts with "equi", meaning equal.',
      why: 'An object with balanced forces is in equilibrium: it stays still or keeps moving at a steady speed in a straight line.',
      lv: [3, 5],
    },
    {
      q: 'Which of these is NOT a possible effect of an unbalanced force?',
      a: 'Making the object\'s mass change',
      wrong: ['Making a still object start moving', 'Making a moving object slow down', 'Making a moving object change direction'],
      hint: 'Unbalanced forces change motion (and can change shape).',
      why: 'An unbalanced (resultant) force can start, stop, speed up, slow down or turn an object. It does not change the object\'s mass.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'A skydiver jumps from a plane. Explain why she speeds up at first but then falls at a steady speed.',
      model:
        'At first she is moving slowly, so the air resistance on her is small. Her weight is bigger than the air resistance, so there is a resultant force downwards and she speeds up. As she gets faster, the air resistance increases. Eventually the air resistance equals her weight, the forces are balanced and the resultant force is zero, so she falls at a steady speed (terminal velocity).',
      checklist: ['Weight is bigger than air resistance at the start', 'Resultant force downwards makes her speed up', 'Air resistance increases as she speeds up', 'Forces become balanced, giving a steady speed'],
      hint: 'Compare weight and air resistance at the start, and say how air resistance changes with speed.',
    },
  ],
}

// =====================================================================================================================
// Friction and drag
// =====================================================================================================================

const FRIC_MEANS: Record<string, string> = {
  Useful: 'Here friction helps us: without it this would not work.',
  Unhelpful: 'Here friction is a nuisance: it wastes energy or wears things out.',
}

const frictionBank: Bank = {
  skill: 'phys.forces.friction',
  sorts: [
    {
      id: 'useful',
      categories: ['Useful', 'Unhelpful'],
      items: [
        ['tyres gripping the road', 'Useful'],
        ['brake pads slowing a bicycle wheel', 'Useful'],
        ['shoes gripping the floor as you walk', 'Useful'],
        ['striking a match', 'Useful'],
        ['a climber\'s hands gripping a rope', 'Useful'],
        ['the moving parts of an engine wearing away', 'Unhelpful'],
        ['a rusty bicycle chain being hard to turn', 'Unhelpful'],
        ['a drawer sticking when you try to open it', 'Unhelpful'],
        ['the soles of shoes wearing out', 'Unhelpful'],
      ],
      ask: (x) => `Is friction useful or unhelpful here: ${x}?`,
      hint: 'Would things be better or worse with no friction at all?',
      means: FRIC_MEANS,
      lv: [1, 4],
    },
  ],
  orders: [
    {
      prompt: 'Put the stages of a skydive in order.',
      steps: [
        'She jumps: weight is much bigger than air resistance, so she speeds up',
        'As she gets faster, air resistance increases',
        'Air resistance equals weight: she falls at a steady speed',
        'Her parachute opens: air resistance is now bigger than weight, so she slows down',
        'Air resistance falls until it equals weight again: a new, slower steady speed',
      ],
      direction: ['first', 'last'],
      hint: 'Air resistance gets bigger as she goes faster. The parachute opens near the end.',
      why: 'Weight stays the same throughout. Air resistance grows with speed until it balances the weight (steady speed). The parachute suddenly increases air resistance, slowing her until the forces balance again at a much lower speed, safe for landing.',
      lv: [3, 5],
    },
  ],
  mcqs: [
    {
      q: 'In which direction does friction act on a box sliding to the right across the floor?',
      a: 'To the left, opposing the motion',
      wrong: [{ label: 'To the right, with the motion', misconception: 'friction-with-motion', feedback: 'Friction always opposes the sliding.' }, 'Straight up', 'Straight down'],
      hint: 'Friction always works against sliding.',
      why: 'Friction acts in the opposite direction to the motion (or attempted motion) between two surfaces.',
      lv: [1, 3],
    },
    {
      q: 'How does oil in a bike chain help?',
      a: 'It reduces the friction between the moving parts',
      wrong: [{ label: 'It increases friction so the chain grips', misconception: 'oil-grip', feedback: 'Oil is a lubricant: it makes surfaces slide over each other more easily.' }, 'It makes the bike lighter', 'It stops air resistance'],
      hint: 'Oil is a lubricant.',
      why: 'A lubricant keeps the surfaces slightly apart, so they slide more easily. Less energy is wasted by heating and the parts wear out more slowly.',
      lv: [1, 3],
    },
    {
      q: 'What happens to the air resistance on a cyclist as she goes faster?',
      a: 'It increases',
      wrong: [{ label: 'It decreases', misconception: 'drag-decreases', feedback: 'The faster you go, the more air you push out of the way each second, so air resistance increases.' }, 'It stays the same', 'It disappears'],
      hint: 'Think about putting your hand out of a car window at different speeds.',
      why: 'Drag forces (air and water resistance) get bigger as speed increases.',
      lv: [1, 3],
    },
    {
      q: 'Why do racing cyclists crouch low and wear smooth, tight clothing?',
      a: 'To be streamlined, reducing air resistance',
      wrong: [{ label: 'To increase friction with the road', misconception: 'streamline-friction', feedback: 'Their body shape affects air resistance, not the grip of the tyres.' }, 'To make themselves heavier', 'To keep warm'],
      hint: 'A smoother, narrower shape lets air flow past easily.',
      why: 'A streamlined shape lets air flow past more smoothly, so there is less air resistance and less energy is needed to go fast.',
      lv: [2, 4],
    },
    {
      q: 'Why does an icy road make it harder for a car to stop?',
      a: 'There is less friction between the tyres and the road',
      wrong: [{ label: 'There is more friction between the tyres and the road', misconception: 'ice-more-friction', feedback: 'Ice is slippery: less friction, so less force to slow the car.' }, 'The car becomes heavier in the cold', 'Air resistance is bigger in winter'],
      hint: 'What does it feel like to walk on ice?',
      why: 'Ice is smooth, so friction between the tyres and road is much smaller. The braking force is smaller, so the car takes longer to stop.',
      lv: [2, 4],
    },
    {
      q: 'What is "terminal velocity"?',
      a: 'The steady top speed reached when the drag force equals the forward (or downward) force',
      wrong: [{ label: 'The speed when an object hits the ground', misconception: 'terminal-landing', feedback: '"Terminal" here means final steady speed, reached when the forces balance.' }, 'The speed at which drag disappears', 'The slowest speed an object can fall at'],
      hint: 'It happens when the forces become balanced.',
      why: 'As speed increases, drag increases until it balances the driving force or weight. Then the resultant force is zero and the speed stays steady: terminal velocity.',
      lv: [4, 5],
    },
  ],
  written: [
    {
      prompt: 'Explain why a car needs a bigger driving force to keep moving at 30 m/s than at 10 m/s.',
      model:
        'To move at a steady speed the forces on the car must be balanced, so the driving force must equal the air resistance and friction. Air resistance gets bigger as the car goes faster, because it pushes more air out of the way each second. So at 30 m/s the backward forces are much bigger, and the driving force must be bigger to balance them.',
      checklist: ['Steady speed means balanced forces', 'Driving force equals the backward forces', 'Air resistance increases with speed', 'So more driving force is needed at higher speed'],
      hint: 'At a steady speed, what must be true about the forces? How does air resistance change with speed?',
    },
  ],
}

// =====================================================================================================================
// Stretching and Hooke's law
// =====================================================================================================================

const hookeCalc = G('phys.forces.hooke.calc', 'phys.forces.hooke', [1, 5], (rng, d) => {
  if (d === 1) {
    const l0 = rng.pick([5, 6, 8, 10, 12, 15])
    const e = rng.pick([1, 2, 3, 4, 5, 6, 1.5, 2.5])
    return num({
      prompt: `A spring is ${l0} cm long. When a load is hung on it, it is ${fmt(l0 + e)} cm long. What is its extension? Give your answer in cm.`,
      answer: e,
      suffix: 'cm',
      hint: 'Extension = stretched length − original length.',
      explanation: `Extension = ${fmt(l0 + e)} − ${l0} = ${fmt(e)} cm.`,
      errors: [err(l0 + e, 'used-length', 'That is the new length. The extension is how much LONGER it got.')],
    })
  }
  if (d === 2) {
    const per = rng.pick([1, 1.5, 2, 2.5, 3, 4])
    const f1 = rng.pick([1, 2])
    const f2 = rng.pick([3, 4, 5, 6].filter((x) => x !== f1))
    return num({
      prompt: `A spring obeys Hooke's law. A ${f1} N load stretches it by ${fmt(per * f1)} cm. How much will a ${f2} N load stretch it (staying within its elastic limit)? Give your answer in cm.`,
      answer: round(per * f2),
      suffix: 'cm',
      hint: 'Extension is directly proportional to force. Find the extension for 1 N first.',
      explanation: `${fmt(per * f1)} cm for ${f1} N means ${fmt(per)} cm per newton. For ${f2} N: ${fmt(per)} × ${f2} = ${fmt(per * f2)} cm.`,
      errors: [err(round(per * f1 + (f2 - f1), 6), 'added-difference', 'Extension is proportional to force: multiply, do not just add the difference.')],
    })
  }
  const k = rng.pick([10, 20, 25, 40, 50, 100, 200])
  const e = rng.pick(d >= 5 ? [0.02, 0.05, 0.1, 0.2] : [0.02, 0.05, 0.1, 0.2, 0.25, 0.4, 0.5])
  const f = round(k * e)
  if (d === 3) {
    return num({
      prompt: `A spring has a spring constant of ${k} N/m. It is stretched by ${fmt(e)} m. What force is stretching it? Use F = k × e. Give your answer in newtons.`,
      answer: f,
      suffix: 'N',
      hint: 'Force = spring constant × extension.',
      explanation: `F = k × e = ${k} × ${fmt(e)} = ${fmt(f)} N.`,
      errors: [err(round(k / e, 6), 'divided', 'Multiply the spring constant by the extension.')],
    })
  }
  if (d === 4) {
    const findK = rng.chance(0.5)
    return findK
      ? num({
          prompt: `A force of ${fmt(f)} N stretches a spring by ${fmt(e)} m. What is the spring constant? Use F = k × e. Give your answer in N/m.`,
          answer: k,
          suffix: 'N/m',
          hint: 'Rearrange: k = F ÷ e.',
          explanation: `k = F ÷ e = ${fmt(f)} ÷ ${fmt(e)} = ${k} N/m.`,
          errors: [err(round(f * e, 6), 'multiplied', 'Divide the force by the extension.')],
        })
      : num({
          prompt: `A spring has a spring constant of ${k} N/m. How far will a force of ${fmt(f)} N stretch it? Use F = k × e. Give your answer in metres.`,
          answer: e,
          suffix: 'm',
          hint: 'Rearrange: e = F ÷ k.',
          explanation: `e = F ÷ k = ${fmt(f)} ÷ ${k} = ${fmt(e)} m.`,
          errors: [err(round(f * k, 6), 'multiplied', 'Divide the force by the spring constant.'), err(round(k / f, 6), 'upside-down', 'Divide the force by the spring constant, not the other way round.')],
        })
  }
  const l0 = rng.pick([10, 12, 15, 20])
  return num({
    prompt: `A spring is ${l0} cm long and has a spring constant of ${k} N/m. A force of ${fmt(f)} N is hung on it. How long is the spring now? Give your answer in cm.`,
    answer: round(l0 + e * 100),
    suffix: 'cm',
    hint: 'Find the extension in metres with e = F ÷ k, change it to cm, then add it to the original length.',
    explanation: `e = ${fmt(f)} ÷ ${k} = ${fmt(e)} m = ${fmt(e * 100)} cm. New length = ${l0} + ${fmt(e * 100)} = ${fmt(l0 + e * 100)} cm.`,
    errors: [err(round(e * 100, 6), 'extension-only', 'That is the extension. Add it to the original length.'), err(round(l0 + e, 6), 'units-mixed', 'Change the extension from metres to centimetres before adding.')],
  })
})

const elasticLimit = G('phys.forces.hooke.limit', 'phys.forces.hooke', [3, 5], (rng, d) => {
  const per = rng.pick([1, 2, 3, 4])
  const limitAt = rng.int(3, 5)
  const loads = [0, 1, 2, 3, 4, 5, 6, 7]
  const ext: number[] = []
  for (const L of loads) {
    if (L <= limitAt) ext.push(per * L)
    else ext.push((ext[ext.length - 1] as number) + per * (L - limitAt + 1) * 1.5)
  }
  const fig = table(['Load (N)', 'Extension (cm)'], loads.map((L, i) => [L, round(ext[i] as number, 1)]))
  if (d >= 4) {
    return choice({
      rng,
      prompt: 'A student stretches a spring and records the results below. Up to which load does the spring obey Hooke\'s law (extension directly proportional to load)?',
      figure: fig,
      correct: `${limitAt} N`,
      wrong: [`${limitAt - 1} N`, `${limitAt + 1} N`, '7 N'].map((x) => ({ label: x, misconception: 'limit-misread', feedback: 'Check where the extension stops going up by the same amount for each extra newton.' })),
      keepOrder: false,
      hint: `Up to the limit, each extra newton adds ${per} cm. Find where that stops.`,
      explanation: `Up to ${limitAt} N the extension goes up by ${per} cm for each newton (directly proportional). After that it goes up by more each time, so the spring has passed its limit of proportionality and will not obey Hooke's law.`,
    })
  }
  return num({
    prompt: 'A student stretches a spring and records the results below. At the start, while the spring obeys Hooke\'s law, how much does the extension increase for each extra 1 N of load? Give your answer in cm.',
    figure: fig,
    answer: per,
    suffix: 'cm',
    hint: 'Look at the first few rows: how much does the extension go up each time the load goes up by 1 N?',
    explanation: `From 0 N to ${limitAt} N the extension goes up by ${per} cm for every newton. After ${limitAt} N it goes up by more each time, because the spring has gone past its limit of proportionality.`,
  })
})

const hookeBank: Bank = {
  skill: 'phys.forces.hooke',
  terms: [
    { term: 'Extension', def: 'How much longer an object gets when it is stretched' },
    { term: 'Compression', def: 'How much shorter an object gets when it is squashed' },
    { term: 'Elastic', def: 'Goes back to its original shape and size when the force is removed' },
    { term: 'Plastic deformation', def: 'A change of shape that stays after the force is removed' },
    { term: 'Elastic limit', def: 'The point beyond which a stretched object will not go back to its original length' },
    { term: 'Spring constant', def: 'The force needed per unit of extension: a measure of how stiff a spring is' },
  ],
  mcqs: [
    {
      q: 'A spring obeys Hooke\'s law. What happens to its extension if you double the force on it?',
      a: 'The extension doubles',
      wrong: [{ label: 'The extension stays the same', misconception: 'extension-fixed', feedback: 'More force stretches it more.' }, 'The length doubles', 'The extension halves'],
      hint: 'Hooke\'s law: extension is directly proportional to force.',
      why: 'Below the limit of proportionality, extension ∝ force: double the force, double the extension. (The total LENGTH does not double, because it includes the original length.)',
      lv: [2, 4],
    },
    {
      q: 'Spring X has a spring constant of 20 N/m and spring Y has 50 N/m. Which is true?',
      a: 'Spring Y is stiffer: it needs more force to stretch it the same amount',
      wrong: [{ label: 'Spring X is stiffer', misconception: 'k-backwards', feedback: 'A bigger spring constant means more newtons per metre of stretch: a stiffer spring.' }, 'They stretch the same amount for the same force', 'Spring Y stretches more for the same force'],
      hint: 'The spring constant is newtons per metre of stretch.',
      why: 'The spring constant is the force needed per metre of extension. 50 N/m needs more force than 20 N/m for the same stretch, so Y is stiffer.',
      lv: [3, 5],
    },
    {
      q: 'A spring is stretched beyond its elastic limit. What happens when the load is removed?',
      a: 'It does not go back to its original length',
      wrong: [{ label: 'It goes back to its original length', misconception: 'always-elastic', feedback: 'Below the elastic limit it would. Beyond it, the change is permanent.' }, 'It gets shorter than it was at the start', 'It becomes stiffer and springier'],
      hint: 'What does "limit" suggest?',
      why: 'Beyond the elastic limit the spring is permanently stretched (plastic deformation), so it stays longer than its original length.',
      lv: [2, 4],
    },
  ],
}

// =====================================================================================================================
// Moments
// =====================================================================================================================

const moments = G('phys.forces.moments.calc', 'phys.forces.moments', [1, 5], (rng, d) => {
  if (d <= 3) {
    const kind = d === 3 ? 0 : rng.int(0, 2)
    const f = rng.pick([[20, 40, 50, 60, 80, 100], [5, 10, 20, 25, 40], [50, 100, 200, 250, 400]][kind] as number[])
    const dist = rng.pick([[0.1, 0.2, 0.25, 0.3], [0.5, 0.8, 1], [0.5, 1, 1.5, 2]][kind] as number[])
    const m = round(f * dist)
    const ctx = [`a spanner, ${fmt(dist)} m from the nut`, `a door, ${fmt(dist)} m from the hinge`, `a crowbar, ${fmt(dist)} m from the pivot`][kind] as string
    if (d <= 2) {
      return num({
        prompt: `A force of ${f} N is applied at right angles to ${ctx}. What is the moment of the force? Give your answer in N m.`,
        answer: m,
        suffix: 'N m',
        hint: 'Moment = force × perpendicular distance from the pivot.',
        explanation: `Moment = ${f} N × ${fmt(dist)} m = ${fmt(m)} N m.`,
        errors: [err(round(f / dist, 6), 'divided', 'Multiply the force by the distance.')],
      })
    }
    return num({
      prompt: `A moment of ${fmt(m)} N m is needed to turn a nut. The spanner is held ${fmt(dist)} m from the nut. What force is needed (at right angles to the spanner)? Give your answer in N.`,
      answer: f,
      suffix: 'N',
      hint: 'Force = moment ÷ distance.',
      explanation: `Force = ${fmt(m)} N m ÷ ${fmt(dist)} m = ${f} N.`,
      errors: [err(round(m * dist, 6), 'multiplied', 'Divide the moment by the distance.')],
    })
  }
  if (d === 4) {
    for (let i = 0; i < 50; i++) {
      const w1 = rng.pick([200, 250, 300, 400, 500, 600])
      const d1 = rng.pick([0.5, 1, 1.5, 2, 2.5])
      const w2 = rng.pick([200, 250, 300, 400, 500, 600].filter((x) => x !== w1))
      const d2 = (w1 * d1) / w2
      if (Math.abs(d2 * 100 - Math.round(d2 * 100)) > 1e-9 || d2 > 3) continue
      return num({
        prompt: `On a seesaw, Amy (weight ${w1} N) sits ${fmt(d1)} m from the pivot. Where must Ben (weight ${w2} N) sit on the other side to balance it? Give his distance from the pivot in metres.`,
        answer: round(d2),
        suffix: 'm',
        hint: 'Balanced: clockwise moment = anticlockwise moment, so W1 × d1 = W2 × d2.',
        explanation: `Amy's moment = ${w1} × ${fmt(d1)} = ${fmt(w1 * d1)} N m. Ben needs the same: d = ${fmt(w1 * d1)} ÷ ${w2} = ${fmt(d2)} m.`,
        errors: [err(d1, 'same-distance', 'Different weights need different distances. The heavier person sits closer to the pivot.'), err(round((w2 * d1) / w1, 6), 'ratio-upside-down', 'The heavier person must be nearer the pivot. Check your division.')],
      })
    }
  }
  // Level 5: two children on one side.
  for (let i = 0; i < 80; i++) {
    const a = rng.pick([200, 300, 400])
    const da = rng.pick([1, 1.5, 2])
    const b = rng.pick([150, 200, 250])
    const db = rng.pick([0.5, 1])
    const c = rng.pick([300, 400, 500, 600])
    const dc = (a * da + b * db) / c
    if (Math.abs(dc * 100 - Math.round(dc * 100)) > 1e-9 || dc > 3) continue
    return num({
      prompt: `On one side of a seesaw, a ${a} N child sits ${fmt(da)} m from the pivot and a ${b} N child sits ${fmt(db)} m from the pivot. How far from the pivot on the other side must a ${c} N adult sit to balance it? Give your answer in metres.`,
      answer: round(dc),
      suffix: 'm',
      hint: 'Add the moments of the two children. The adult\'s moment must equal that total.',
      explanation: `Total moment of the children = ${a} × ${fmt(da)} + ${b} × ${fmt(db)} = ${fmt(a * da)} + ${fmt(b * db)} = ${fmt(a * da + b * db)} N m. Distance = ${fmt(a * da + b * db)} ÷ ${c} = ${fmt(dc)} m.`,
      errors: [err(round((a * da) / c, 6), 'one-child', 'Include both children\'s moments.')],
    })
  }
  return num({ prompt: 'A 400 N child sits 1.5 m from the pivot of a seesaw. How far from the pivot must a 600 N adult sit on the other side to balance it? Give your answer in metres.', answer: 1, suffix: 'm', hint: 'W1 × d1 = W2 × d2.', explanation: '400 × 1.5 = 600 N m, and 600 ÷ 600 = 1 m.' })
})

const momentsBank: Bank = {
  skill: 'phys.forces.moments',
  mcqs: [
    {
      q: 'Why is a door handle put on the side furthest from the hinges?',
      a: 'A bigger distance from the pivot gives a bigger moment for the same force',
      wrong: [{ label: 'It makes the door lighter', misconception: 'moment-weight', feedback: 'The door\'s weight does not change. The turning effect depends on force × distance.' }, 'It reduces friction in the hinges', 'It looks better'],
      hint: 'Moment = force × distance from the pivot.',
      why: 'The turning effect (moment) is force × distance from the pivot. Pushing far from the hinge gives a big moment with a small force.',
      lv: [1, 3],
    },
    {
      q: 'Why is it easier to undo a tight nut with a longer spanner?',
      a: 'The longer handle gives a bigger moment for the same force',
      wrong: [{ label: 'A longer spanner is heavier, which does the work', misconception: 'heavy-spanner', feedback: 'It is the distance from the nut that matters.' }, 'A longer spanner grips the nut harder', 'It reduces the moment needed'],
      hint: 'Where is the pivot? How far away is your hand?',
      why: 'The nut is the pivot. Holding further away increases the distance, so the same force gives a bigger moment.',
      lv: [2, 4],
    },
    {
      q: 'What is the principle of moments?',
      a: 'For a balanced object, the total clockwise moment equals the total anticlockwise moment',
      wrong: [{ label: 'The forces on each side of the pivot must be equal', misconception: 'equal-forces', feedback: 'The forces can be different if the distances are different. It is the moments that must be equal.' }, 'The heavier side always goes down', 'Moments are always zero'],
      hint: 'Think about a heavy person balancing a light person on a seesaw.',
      why: 'An object balances when clockwise and anticlockwise moments are equal. A heavy person close to the pivot can balance a light person far from it.',
      lv: [2, 4],
    },
    {
      q: 'What is the unit of moment?',
      a: 'newton metre (N m)',
      wrong: [{ label: 'newton (N)', misconception: 'moment-newton', feedback: 'A moment is force × distance, so its unit is N × m.' }, 'joule per second', 'metre (m)'],
      hint: 'Moment = force × distance.',
      why: 'Force (N) × distance (m) gives newton metres, N m.',
      lv: [1, 2],
    },
  ],
}

// =====================================================================================================================
// Pressure on surfaces
// =====================================================================================================================

const pressureCalc = G('phys.forces.pressure-solids.calc', 'phys.forces.pressure-solids', [1, 5], (rng, d) => {
  const P = rng.pick([50, 100, 200, 250, 400, 500, 1000, 2000, 2500])
  const A = rng.pick([0.5, 2, 4, 5, 8, 10])
  const F = round(P * A)
  if (d <= 2) {
    return num({
      prompt: `A force of ${fmt(F)} N acts on an area of ${fmt(A)} m^{2}. What is the pressure? Give your answer in N/m^{2}.`,
      answer: P,
      suffix: 'N/m^{2}',
      hint: 'Pressure = force ÷ area.',
      explanation: `Pressure = ${fmt(F)} N ÷ ${fmt(A)} m^{2} = ${fmt(P)} N/m^{2}.`,
      errors: [err(round(F * A, 6), 'multiplied', 'Pressure = force DIVIDED by area.'), err(round(A / F, 9), 'upside-down', 'Divide the force by the area.')],
    })
  }
  if (d === 3) {
    return num({
      prompt: `A pressure of ${fmt(P)} N/m^{2} acts on an area of ${fmt(A)} m^{2}. What is the force? Give your answer in N.`,
      answer: F,
      suffix: 'N',
      hint: 'Force = pressure × area.',
      explanation: `Force = ${fmt(P)} × ${fmt(A)} = ${fmt(F)} N.`,
      errors: [err(round(P / A, 6), 'divided', 'Force = pressure × area.')],
    })
  }
  if (d === 4) {
    return num({
      prompt: `A force of ${fmt(F)} N produces a pressure of ${fmt(P)} N/m^{2}. Over what area is the force spread? Give your answer in m^{2}.`,
      answer: A,
      suffix: 'm^{2}',
      hint: 'Area = force ÷ pressure.',
      explanation: `Area = ${fmt(F)} ÷ ${fmt(P)} = ${fmt(A)} m^{2}.`,
      errors: [err(round(F * P, 6), 'multiplied', 'Area = force ÷ pressure.')],
    })
  }
  // Level 5: a box resting on one face (dimensions in cm), answer in N/cm^2.
  for (let i = 0; i < 50; i++) {
    const m = rng.pick([2, 4, 5, 6, 8, 10, 12, 20])
    const l = rng.pick([5, 10, 20, 25])
    const w = rng.pick([2, 4, 5, 10])
    const pr = (m * 10) / (l * w)
    if (Math.abs(pr * 100 - Math.round(pr * 100)) > 1e-9) continue
    return num({
      prompt: `A ${m} kg box rests on a face that measures ${l} cm by ${w} cm. What pressure does it put on the floor? Use g = 10 N/kg. Give your answer in N/cm^{2}.`,
      answer: round(pr),
      suffix: 'N/cm^{2}',
      hint: 'Find the weight (mass × 10) and the area (length × width), then pressure = force ÷ area.',
      explanation: `Weight = ${m} × 10 = ${m * 10} N. Area = ${l} × ${w} = ${l * w} cm^{2}. Pressure = ${m * 10} ÷ ${l * w} = ${fmt(pr)} N/cm^{2}.`,
      errors: [err(round(m / (l * w), 6), 'used-mass', 'Use the weight in newtons (mass × 10), not the mass.'), err(round((m * 10) / (l + w), 6), 'added-sides', 'Area is length × width, not length + width.')],
    })
  }
  return num({ prompt: 'A 10 kg box rests on a face 10 cm by 10 cm. Using g = 10 N/kg, what pressure does it put on the floor in N/cm^{2}?', answer: 1, suffix: 'N/cm^{2}', hint: 'Pressure = weight ÷ area.', explanation: 'Weight = 100 N, area = 100 cm^{2}, so pressure = 1 N/cm^{2}.' })
})

const solidsBank: Bank = {
  skill: 'phys.forces.pressure-solids',
  mcqs: [
    ...(
      [
        ['Why do snowshoes stop you sinking into deep snow?', 'They spread your weight over a bigger area, so the pressure is lower', 'They make you weigh less', 'They make the area smaller, so the pressure is lower'],
        ['Why does a sharp knife cut better than a blunt one?', 'The edge has a tiny area, so the same force gives a much bigger pressure', 'A sharp knife weighs more', 'The edge has a bigger area, so the pressure is bigger'],
        ['Why does a drawing pin have a sharp point and a wide, flat head?', 'The point puts the force on a tiny area (high pressure); the head spreads it over your thumb (low pressure)', 'The head makes the pin heavier so it pushes in', 'The point has a large area, so it gives a low pressure on the board'],
        ['Why do tractors working on soft fields have very wide tyres?', 'Wide tyres spread the weight over a bigger area, so the pressure is lower and they sink less', 'Wide tyres make the tractor weigh less', 'Wide tyres increase the pressure so the tractor grips better'],
        ['Why does a camel have large, flat feet?', 'They spread its weight over a large area, lowering the pressure on soft sand', 'They make the camel weigh less', 'They increase the pressure on the sand'],
      ] as [string, string, string, string][]
    ).map(([q, a, w1, w2]) => ({
      q,
      a,
      wrong: [
        { label: w1, misconception: 'pressure-weight', feedback: 'The weight (force) is the same. What changes is the area it acts on.' },
        { label: w2, misconception: 'area-pressure-backwards', feedback: 'For the same force, a bigger area gives a SMALLER pressure and a smaller area gives a BIGGER pressure.' },
        'It reduces friction',
      ],
      hint: 'Pressure = force ÷ area. What is being changed here?',
      why: `${a}. For the same force, pressure goes down as area goes up, and goes up as area goes down.`,
      lv: [1, 4] as [number, number],
    })),
    {
      q: 'The same brick is placed on sand on its large face and then on its small end. Which way does it sink further?',
      a: 'On its small end, because the pressure is bigger',
      wrong: [{ label: 'On its large face, because more of it touches the sand', misconception: 'more-contact-more-sinking', feedback: 'More contact area spreads the weight, so the pressure is lower.' }, 'The same both ways, because the weight is the same', 'Neither, bricks never sink'],
      hint: 'Same weight, different area.',
      why: 'The weight is the same both ways, but on its end the area is smaller, so the pressure is bigger and it sinks further.',
      lv: [2, 4],
    },
    {
      q: 'What is another name for the unit N/m^{2}?',
      a: 'pascal (Pa)',
      wrong: [{ label: 'newton (N)', misconception: 'pressure-force', feedback: 'The newton is the unit of force. Force per area is pressure, measured in pascals.' }, 'joule (J)', 'watt (W)'],
      hint: 'It is named after the French scientist Blaise Pascal.',
      why: '1 pascal = 1 N/m^{2}.',
      lv: [3, 5],
    },
  ],
}

// =====================================================================================================================
// Pressure in liquids and gases
// =====================================================================================================================

const upthrust = G('phys.forces.pressure-fluids.upthrust', 'phys.forces.pressure-fluids', [2, 5], (rng, d) => {
  const air = rng.pick([5, 6, 8, 10, 12, 15, 20])
  const up = rng.pick([1, 2, 3, 4, 5, 6].filter((x) => x <= air * 0.4))
  const water = air - up
  const thing = rng.pick(['stone', 'block of aluminium', 'lump of rock', 'pebble'])
  if (d <= 3) {
    return num({
      prompt: `A ${thing} hangs from a newtonmeter. In air the reading is ${air} N. When the ${thing} is lowered completely into water, the reading falls to ${water} N. What is the upthrust from the water? Give your answer in newtons.`,
      answer: up,
      suffix: 'N',
      hint: 'The water pushes up, so the newtonmeter has less to hold. Upthrust = reading in air − reading in water.',
      explanation: `Upthrust = ${air} − ${water} = ${up} N. The water pushes up with ${up} N, so the newtonmeter only has to supply ${water} N.`,
      errors: [err(air + water, 'added', 'The water helps hold the object up: subtract the readings.')],
    })
  }
  if (d === 4) {
    return num({
      prompt: `A ${thing} weighs ${air} N in air. In water, the upthrust on it is ${up} N. What will a newtonmeter read when the ${thing} hangs fully under water? Give your answer in newtons.`,
      answer: water,
      suffix: 'N',
      hint: 'The upthrust takes some of the weight off the newtonmeter.',
      explanation: `Reading = weight − upthrust = ${air} − ${up} = ${water} N.`,
      errors: [err(air + up, 'added', 'Upthrust acts upwards, helping to hold the object, so the reading goes down.')],
    })
  }
  const [boat, masses] = rng.pick([
    ['toy boat', [0.5, 1, 2]],
    ['beach ball', [0.2, 0.5]],
    ['floating log', [20, 30, 50]],
    ['small rowing boat', [80, 100, 150]],
  ] as [string, number[]][])
  const m = rng.pick(masses)
  return num({
    prompt: `A ${boat} with a mass of ${fmt(m)} kg is floating still on water. What is the upthrust on it? Use g = 10 N/kg. Give your answer in newtons.`,
    answer: round(m * 10),
    suffix: 'N',
    hint: 'A floating object is not moving up or down, so the forces on it are balanced.',
    explanation: `Weight = ${fmt(m)} × 10 = ${fmt(m * 10)} N. Floating still, so upthrust = weight = ${fmt(m * 10)} N.`,
    errors: [err(m, 'used-mass', 'Upthrust is a force in newtons: work out the weight first (mass × 10).')],
  })
})

const fluidsBank: Bank = {
  skill: 'phys.forces.pressure-fluids',
  mcqs: [
    {
      q: 'What causes the pressure of a gas on the walls of its container?',
      a: 'Gas particles colliding with the walls',
      wrong: [{ label: 'Gas particles expanding against the walls', misconception: 'particles-expand', feedback: 'The particles do not get bigger. Pressure comes from their collisions with the walls.' }, 'The weight of the container', 'The walls pulling on the gas'],
      hint: 'Gas particles move quickly in all directions.',
      why: 'Fast-moving gas particles keep hitting the walls. Each collision pushes on the wall, and together they make the gas pressure.',
      lv: [1, 3],
    },
    {
      q: 'A sealed container of gas is heated. Why does the pressure inside increase?',
      a: 'The particles move faster, so they hit the walls harder and more often',
      wrong: [{ label: 'The particles get bigger', misconception: 'particles-expand', feedback: 'Particles do not grow when heated; they speed up.' }, 'More particles are made', 'The particles stop moving'],
      hint: 'What does heating do to the speed of particles?',
      why: 'Heating gives the particles more energy, so they move faster and collide with the walls more often and with more force: higher pressure.',
      lv: [2, 4],
    },
    {
      q: 'Why is the air pressure lower at the top of a mountain than at sea level?',
      a: 'There is less air above pushing down, and the air is less dense',
      wrong: [{ label: 'It is colder up there', misconception: 'pressure-temperature', feedback: 'The main reason is the amount of air above you, not the temperature.' }, 'Gravity is much stronger on mountains', 'The Sun is closer'],
      hint: 'Atmospheric pressure is caused by the weight of the air above you.',
      why: 'The higher you go, the less air there is above you, and the fewer particles there are per cubic metre, so the pressure falls.',
      lv: [2, 4],
    },
    {
      q: 'Why is a dam built much thicker at the bottom than at the top?',
      a: 'Water pressure increases with depth',
      wrong: [{ label: 'To make it look stronger', misconception: 'dam-looks', feedback: 'The shape is for a physical reason: the pressure is greatest at the bottom.' }, 'Water pressure is greatest at the surface', 'To stop fish swimming under it'],
      hint: 'How does pressure change as you go deeper?',
      why: 'The deeper the water, the more water is above pushing down, so pressure increases with depth. The bottom of the dam has to withstand the biggest pressure.',
      lv: [1, 3],
    },
    {
      q: 'A tall bottle of water has three holes at different heights. Water squirts out of all three. Which hole squirts water furthest?',
      a: 'The lowest hole',
      wrong: [{ label: 'The highest hole', misconception: 'pressure-top', feedback: 'Pressure is greatest at the bottom, where there is most water above.' }, 'The middle hole', 'They all squirt the same distance'],
      hint: 'Where is the water pressure greatest?',
      why: 'The pressure is greatest at the bottom because there is the most water above it, so water is pushed out hardest from the lowest hole.',
      lv: [2, 4],
    },
    {
      q: 'Why is there an upthrust on an object under water?',
      a: 'The water pressure on its bottom is bigger than on its top, because the bottom is deeper',
      wrong: [{ label: 'Water is lighter than air', misconception: 'water-lighter', feedback: 'Water is much denser than air.' }, 'The object pushes itself up', 'Gravity is weaker under water'],
      hint: 'Pressure increases with depth.',
      why: 'The bottom of the object is deeper than its top, so the water pushes up on the bottom harder than it pushes down on the top. The difference is the upthrust.',
      lv: [3, 5],
    },
    {
      q: 'An object is placed in water. When will it float?',
      a: 'When the upthrust can become equal to its weight',
      wrong: [{ label: 'When it is light, whatever its size', misconception: 'light-floats', feedback: 'A huge steel ship floats. What matters is whether the upthrust can balance the weight.' }, 'When the upthrust is smaller than its weight', 'Only if it is made of wood'],
      hint: 'A floating object is not moving up or down.',
      why: 'An object floats when it settles with the upthrust balancing its weight. If its weight is bigger than the biggest upthrust the water can give, it sinks.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'A diver goes from 2 m deep to 10 m deep in the sea. Explain what happens to the water pressure on her and why.',
      model:
        'The water pressure on her increases as she goes deeper. Pressure in a liquid is caused by the weight of the liquid above pushing down. At 10 m there is a much taller column of water above her than at 2 m, so there is more weight pushing down and the pressure is greater. The pressure acts in all directions, so she feels it on her ears from every side.',
      checklist: ['Says pressure increases with depth', 'Explains it is due to the weight of water above', 'Says there is more water above at 10 m', 'Mentions pressure acts in all directions'],
      hint: 'What is above her at each depth?',
    },
  ],
}

export const forcesGenerators: ItemGenerator[] = [
  ...bankGenerators(typesBank),
  resultant,
  motionEffect,
  ...bankGenerators(balancedBank),
  ...bankGenerators(frictionBank),
  hookeCalc,
  elasticLimit,
  ...bankGenerators(hookeBank),
  moments,
  ...bankGenerators(momentsBank),
  pressureCalc,
  ...bankGenerators(solidsBank),
  upthrust,
  ...bankGenerators(fluidsBank),
]
