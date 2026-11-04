import type { ItemGenerator } from '@/engine/registry'
import { choice } from '../../kit'
import { bankGenerators, err, fmt, G, num, round, table, type Bank } from './factory'

// =====================================================================================================================
// Energy stores
// =====================================================================================================================

const STORE_MEANS: Record<string, string> = {
  Kinetic: 'Anything moving has energy in its kinetic store.',
  'Gravitational potential': 'Anything raised up in a gravitational field has energy in its gravitational potential store.',
  'Elastic potential': 'Anything stretched or squashed has energy in its elastic potential store.',
  Thermal: 'Anything warm has energy in its thermal store; the hotter it is, the more energy.',
  Chemical: 'Fuels, food and batteries have energy in a chemical store, released by chemical reactions.',
  Magnetic: 'Magnets that attract or repel each other, held apart, have energy in a magnetic store.',
  Electrostatic: 'Charged objects that attract or repel each other have energy in an electrostatic store.',
  Nuclear: 'The nuclei of atoms store energy that is released in nuclear reactions.',
}

const storesBank: Bank = {
  skill: 'phys.energy.stores',
  sorts: [
    {
      id: 'which-store',
      categories: Object.keys(STORE_MEANS),
      items: [
        ['a football rolling along flat ground', 'Kinetic'],
        ['a cyclist freewheeling along a flat road', 'Kinetic'],
        ['a spinning top', 'Kinetic'],
        ['a rock resting at the top of a cliff', 'Gravitational potential'],
        ['a book on a high shelf', 'Gravitational potential'],
        ['water held high up behind a dam', 'Gravitational potential'],
        ['a stretched catapult just before it is let go', 'Elastic potential'],
        ['a squashed spring inside a toy', 'Elastic potential'],
        ['a bow pulled back by an archer', 'Elastic potential'],
        ['a cup of hot tea', 'Thermal'],
        ['a hot iron', 'Thermal'],
        ['a bath of warm water', 'Thermal'],
        ['a new battery', 'Chemical'],
        ['a slice of bread', 'Chemical'],
        ['petrol in a car fuel tank', 'Chemical'],
        ['two magnets held apart while they attract each other', 'Magnetic'],
        ['a fridge magnet pulled a little way off the door', 'Magnetic'],
        ['a balloon charged by rubbing it on hair', 'Electrostatic'],
        ['a charged thundercloud', 'Electrostatic'],
        ['uranium fuel in a nuclear power station', 'Nuclear'],
        ['the hydrogen in the core of the Sun', 'Nuclear'],
      ],
      ask: (x) => `Which energy store is the main one in ${x}?`,
      hint: 'Is it moving, raised up, stretched, hot, a fuel or food, a magnet, charged, or about the nuclei of atoms?',
      means: STORE_MEANS,
      sortPrompt: 'Match each example to its main energy store.',
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'Which of these is NOT an energy store?',
      a: 'Light',
      wrong: [
        { label: 'Thermal', misconception: 'thermal-not-store', feedback: 'Thermal is a store: anything warm has energy in its thermal store.' },
        'Kinetic',
        'Chemical',
      ],
      hint: 'Some things store energy; others carry it from place to place.',
      why: 'Light is not a store. It is a way energy is transferred (by radiation) from one store to another. Thermal, kinetic and chemical are stores.',
      lv: [2, 4],
    },
    {
      q: 'Which change would put MORE energy into a ball\'s gravitational potential store?',
      a: 'Lifting it higher',
      wrong: [{ label: 'Making it move faster along the ground', misconception: 'kinetic-vs-gpe', feedback: 'Moving faster fills the kinetic store, not the gravitational potential store.' }, 'Warming it up', 'Squashing it'],
      hint: 'Gravitational potential depends on how high something is.',
      why: 'The higher an object is lifted (and the heavier it is), the more energy is in its gravitational potential store.',
      lv: [1, 3],
    },
    {
      q: 'Two identical cars are driving along. Car A is going faster than car B. Which has more energy in its kinetic store?',
      a: 'Car A',
      wrong: [{ label: 'Car B', misconception: 'kinetic-speed', feedback: 'The faster something moves, the more energy is in its kinetic store.' }, 'They have the same', 'Neither, cars have chemical stores'],
      hint: 'Kinetic store depends on mass and speed.',
      why: 'For the same mass, a faster object has more energy in its kinetic store.',
      lv: [1, 3],
    },
    {
      q: 'A toy car is wound up and let go. Which energy store goes DOWN as the car starts to move?',
      a: 'The elastic potential store of the spring',
      wrong: [{ label: 'The kinetic store of the car', misconception: 'wrong-direction', feedback: 'The kinetic store goes UP as the car speeds up. Which store is it emptying?' }, 'The nuclear store of the car', 'The magnetic store of the spring'],
      hint: 'Winding it up stretched or squashed something.',
      why: 'Winding up stores energy in the spring\'s elastic potential store. As the toy moves, energy is transferred from that store to the kinetic store.',
      lv: [2, 4],
    },
    {
      q: 'What happens to the energy in a cup of hot tea\'s thermal store as it cools down?',
      a: 'It is transferred to the thermal store of the surroundings',
      wrong: [
        { label: 'It is destroyed', misconception: 'energy-destroyed', feedback: 'Energy is never destroyed. It is transferred somewhere else.' },
        { label: 'It turns into cold', misconception: 'cold-is-energy', feedback: 'Cold is not a thing that flows. Cooling means energy leaving.' },
        'It moves into the chemical store of the tea',
      ],
      hint: 'Energy cannot be destroyed. Where could it go?',
      why: 'Energy is transferred by heating from the hot tea to the cooler mug, air and table, so the thermal store of the surroundings goes up by the same amount.',
      lv: [2, 5],
    },
    {
      q: 'Energy is measured in which unit?',
      a: 'joules (J)',
      wrong: [{ label: 'watts (W)', misconception: 'watts-energy', feedback: 'Watts measure power: how quickly energy is transferred.' }, 'newtons (N)', 'degrees Celsius (°C)'],
      hint: 'Food labels give it in kJ.',
      why: 'Energy is measured in joules (J). 1 kilojoule (kJ) = 1000 J.',
      lv: [1, 2],
    },
  ],
}

// =====================================================================================================================
// Energy in food and fuels
// =====================================================================================================================

const FOODS: [string, number][] = [
  ['cornflakes', 1600],
  ['wholemeal bread', 1000],
  ['cheddar cheese', 1700],
  ['bananas', 400],
  ['apples', 220],
  ['milk chocolate', 2200],
  ['peanuts', 2500],
  ['baked beans', 350],
  ['plain crisps', 2200],
  ['cooked pasta', 650],
  ['porridge oats', 1550],
  ['yoghurt', 400],
]

const ACTIVITIES: [string, number[]][] = [
  ['walking', [10, 15, 20]],
  ['cycling', [20, 25, 30]],
  ['swimming', [25, 30, 40]],
  ['running', [40, 50, 60]],
]

const foodEnergy = G('phys.energy.food.label', 'phys.energy.food', [1, 5], (rng, d) => {
  const [food, per100] = rng.pick(FOODS)
  if (d <= 3) {
    const mass = d <= 1 ? rng.pick([100, 200, 300]) : d === 2 ? rng.pick([50, 150, 200, 250]) : rng.pick([20, 25, 30, 40, 60, 80])
    const e = round((per100 * mass) / 100)
    return num({
      prompt: `A food label shows ${fmt(per100)} kJ per 100 g of ${food}. How much energy is in a ${mass} g portion? Give your answer in kJ.`,
      answer: e,
      suffix: 'kJ',
      hint: `How many lots of 100 g are in ${mass} g?`,
      explanation: `${mass} g is ${fmt(mass / 100)} × 100 g, so the energy is ${fmt(per100)} × ${fmt(mass / 100)} = ${fmt(e)} kJ.`,
      errors: [err(per100 * mass, 'forgot-per-100', 'The label gives the energy in 100 g, not in 1 g. Divide by 100.')],
    })
  }
  if (d === 4) {
    // Find a portion and an activity rate that divide exactly.
    for (let tries = 0; tries < 30; tries++) {
      const [f, p100] = tries === 0 ? [food, per100] : rng.pick(FOODS)
      const mass = rng.pick([50, 100, 150, 200])
      const e = round((p100 * mass) / 100)
      const options = ACTIVITIES.flatMap(([act, rates]) => rates.filter((r) => e % r === 0).map((r) => [act, r] as [string, number]))
      if (!options.length) continue
      const [act, rate] = rng.pick(options)
      const mins = e / rate
      return num({
        prompt: `A ${mass} g portion of ${f} gives ${fmt(e)} kJ of energy. In this question, ${act} uses ${rate} kJ every minute. For how many minutes could the portion supply the energy for ${act}?`,
        answer: mins,
        suffix: 'minutes',
        hint: `How many lots of ${rate} kJ are there in ${fmt(e)} kJ?`,
        explanation: `${fmt(e)} kJ ÷ ${rate} kJ per minute = ${fmt(mins)} minutes.`,
        errors: [err(e * rate, 'multiplied-rate', 'You multiplied. Divide the energy by the energy used each minute.')],
      })
    }
  }
  // Level 5 (and fallback): how much of one food matches the energy in a portion of another.
  const others = FOODS.filter(([f]) => f !== food)
  const [food2, p2] = rng.pick(others)
  const m2 = rng.pick([50, 100, 150, 200])
  const e = (p2 * m2) / 100
  const ans = round((e / per100) * 100, 0)
  return num({
    prompt: `Food labels show ${fmt(p2)} kJ per 100 g of ${food2} and ${fmt(per100)} kJ per 100 g of ${food}. What mass of ${food} gives the same energy as ${m2} g of ${food2}? Give your answer to the nearest gram.`,
    answer: ans,
    suffix: 'g',
    tolerance: 1,
    hint: `First find the energy in ${m2} g of ${food2}. Then work out how many grams of ${food} contain that much.`,
    explanation: `Energy in ${m2} g of ${food2} = ${fmt(p2)} × ${fmt(m2 / 100)} = ${fmt(e)} kJ. Each gram of ${food} gives ${fmt(per100 / 100)} kJ, so you need ${fmt(e)} ÷ ${fmt(per100 / 100)} ≈ ${fmt(ans)} g.`,
  })
})

const compareFoods = G('phys.energy.food.compare', 'phys.energy.food', [2, 4], (rng, d) => {
  const pick = rng.shuffle(FOODS).slice(0, 4)
  if (d <= 2) {
    const best = pick.reduce((a, b) => (b[1] > a[1] ? b : a))
    return choice({
      rng,
      prompt: 'These are the energy values from four food labels (per 100 g). Which food gives the most energy per 100 g?',
      figure: table(['Food', 'Energy per 100 g (kJ)'], pick.map(([f, e]) => [`${f[0]?.toUpperCase()}${f.slice(1)}`, e])),
      correct: best[0],
      wrong: pick.filter((x) => x !== best).map((x) => x[0]),
      hint: 'Compare the numbers in the energy column.',
      explanation: `${best[0][0]?.toUpperCase()}${best[0].slice(1)} has the biggest value, ${fmt(best[1])} kJ per 100 g.`,
    })
  }
  // Portions: compare the energy in different sized servings.
  const masses = [30, 50, 150, 200]
  const rows = pick.map(([f, e], i) => {
    const m = masses[i] as number
    return { f, per: e, m, total: (e * m) / 100 }
  })
  const totals = rows.map((r) => r.total)
  const max = Math.max(...totals)
  if (totals.filter((t) => t === max).length > 1) {
    const best = rows[0] as (typeof rows)[number]
    return num({
      prompt: `A ${best.m} g serving of ${best.f} is eaten. The label says ${fmt(best.per)} kJ per 100 g. How much energy is in the serving? Give your answer in kJ.`,
      answer: best.total,
      suffix: 'kJ',
      hint: 'Scale the "per 100 g" value to the size of the serving.',
      explanation: `${fmt(best.per)} × ${best.m} ÷ 100 = ${fmt(best.total)} kJ.`,
    })
  }
  const best = rows.find((r) => r.total === max) as (typeof rows)[number]
  return choice({
    rng,
    prompt: 'Which SERVING gives the most energy? Work out the energy in each serving first.',
    figure: table(['Food', 'Energy per 100 g (kJ)', 'Serving size (g)'], rows.map((r) => [`${r.f[0]?.toUpperCase()}${r.f.slice(1)}`, r.per, r.m])),
    correct: best.f,
    wrong: rows
      .filter((r) => r !== best)
      .map((r) => ({ label: r.f, misconception: r.per === Math.max(...rows.map((x) => x.per)) ? 'ignored-serving-size' : 'compare-serving', feedback: `A ${r.m} g serving of ${r.f} gives ${fmt(r.total)} kJ.` })),
    hint: 'Energy in a serving = energy per 100 g × serving size ÷ 100.',
    explanation: rows.map((r) => `${r.f}: ${fmt(r.per)} × ${r.m} ÷ 100 = ${fmt(r.total)} kJ`).join('\n') + `\nSo the ${best.f} serving gives the most.`,
  })
})

const foodBank: Bank = {
  skill: 'phys.energy.food',
  mcqs: [
    {
      q: 'Food labels give the energy in food in which unit?',
      a: 'kilojoules (kJ)',
      wrong: [{ label: 'kilowatts (kW)', misconception: 'kw-energy', feedback: 'Kilowatts measure power, not energy.' }, 'kilograms (kg)', 'newtons (N)'],
      hint: 'It is the unit of energy, with "kilo" in front.',
      why: 'Energy is measured in joules, and food labels use kilojoules (1 kJ = 1000 J). Many labels also give kilocalories, an older unit.',
      lv: [1, 2],
    },
    {
      q: 'Gram for gram, which type of food contains the most energy?',
      a: 'Fats and oils',
      wrong: [{ label: 'Carbohydrates', misconception: 'carbs-most-energy', feedback: 'Carbohydrates are a main source of energy, but fats contain roughly twice as much energy per gram.' }, 'Protein', 'Water'],
      hint: 'Think about which foods have the biggest numbers on their labels: butter, oil, nuts.',
      why: 'Fats contain roughly twice as much energy per gram as carbohydrates or protein. That is why butter, oils and nuts have high kJ values.',
      lv: [2, 4],
    },
    {
      q: 'Where is the energy in food stored?',
      a: 'In a chemical store',
      wrong: [{ label: 'In a thermal store', misconception: 'food-thermal', feedback: 'Cold food still has lots of energy. It is in a chemical store, released by respiration.' }, 'In a kinetic store', 'In a nuclear store'],
      hint: 'It is released by a chemical reaction in your cells.',
      why: 'Food has energy in a chemical store. Your body releases it by respiration, a chemical reaction.',
      lv: [1, 3],
    },
    {
      q: 'Which person is likely to need the most energy from food each day?',
      a: 'A cyclist training hard for a race',
      wrong: [{ label: 'An office worker who sits most of the day', misconception: 'activity-energy', feedback: 'The more active you are, the more energy you transfer each day.' }, 'A person asleep in bed all day', 'A small child playing quietly'],
      hint: 'More activity means more energy transferred.',
      why: 'Energy needs depend on how active you are (and on your size and age). Hard exercise transfers a lot of energy, so it needs more from food.',
      lv: [1, 3],
    },
    {
      q: 'If someone regularly takes in more energy from food than they use, what usually happens?',
      a: 'The extra is stored in the body, mainly as fat',
      wrong: [{ label: 'The extra energy is destroyed', misconception: 'energy-destroyed', feedback: 'Energy cannot be destroyed. The body stores it.' }, 'They get colder', 'They lose mass'],
      hint: 'Energy cannot just disappear.',
      why: 'The body stores spare energy, mainly as fat, so body mass goes up over time. Using more than you take in has the opposite effect.',
      lv: [3, 5],
    },
    {
      q: 'In a lesson, students compare fuels by burning 1 g of each under a boiling tube of water. Which result shows which fuel releases the most energy?',
      a: 'The biggest temperature rise of the water',
      wrong: [{ label: 'The biggest flame', misconception: 'flame-size', feedback: 'Flame size is hard to measure and does not tell you how much energy reached the water.' }, 'The shortest burning time', 'The highest starting temperature of the water'],
      hint: 'What is the measured (dependent) variable?',
      why: 'With the same mass of fuel and the same amount of water, the fuel that raises the water\'s temperature the most has released the most energy.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Two students burn different fuels to heat water and compare the temperature rise. Describe how they should make it a fair test.',
      model:
        'They should burn the same mass of each fuel and heat the same volume of water, in the same type of container, held at the same distance above the flame. They should start with water at the same temperature and stir it before reading the thermometer. They should repeat each test and take a mean so that one odd result does not mislead them.',
      checklist: ['Same mass of fuel', 'Same volume (or mass) of water', 'Same container or distance from the flame', 'Same starting temperature of the water', 'Repeats the test and finds a mean'],
      hint: 'List the things that should be kept the same, and how to make the results more reliable.',
      passMark: 3,
    },
  ],
}

// =====================================================================================================================
// Energy transfers, conservation and efficiency
// =====================================================================================================================

const PATH_MEANS: Record<string, string> = {
  Mechanically: 'A force moves something, transferring energy mechanically.',
  Electrically: 'An electric current transfers energy electrically.',
  'By heating': 'Energy moves from a hotter object to a cooler one by heating.',
  'By radiation': 'Light or infrared waves carry energy by radiation, even across empty space.',
}

const transfersBank: Bank = {
  skill: 'phys.energy.transfers',
  sorts: [
    {
      id: 'pathway',
      categories: Object.keys(PATH_MEANS),
      items: [
        ['a person pushing a shopping trolley', 'Mechanically'],
        ['a weightlifter lifting a barbell', 'Mechanically'],
        ['a stretched bow pushing an arrow forwards', 'Mechanically'],
        ['a battery making a current flow through a lamp', 'Electrically'],
        ['mains electricity running a fan', 'Electrically'],
        ['a charger charging a phone', 'Electrically'],
        ['a hot drink warming your hands through the mug', 'By heating'],
        ['a cold drink warming up on a table', 'By heating'],
        ['a hot hob warming the bottom of a pan', 'By heating'],
        ['sunlight reaching the Earth through space', 'By radiation'],
        ['a lamp lighting up a room', 'By radiation'],
        ['an electric grill toasting bread from above', 'By radiation'],
      ],
      ask: (x) => `How is energy being transferred in this example: ${x}?`,
      hint: 'Is it a force moving something, a current, something hot warming something cooler, or light and infrared?',
      means: PATH_MEANS,
      sortPrompt: 'Match each example to the way energy is being transferred.',
      lv: [1, 4],
    },
  ],
  orders: [
    {
      prompt: 'A ball is held up high, dropped, and lands with a thud. Put the energy stores in order.',
      steps: ['Gravitational potential store of the ball held up high', 'Kinetic store of the falling ball', 'Thermal store of the ball, floor and surroundings (after a thud)'],
      direction: ['first', 'last'],
      hint: 'Before it falls it is high up; while it falls it is moving; after it lands it is still.',
      why: 'The raised ball has a gravitational potential store. As it falls this empties into its kinetic store. When it lands, the energy is transferred by sound and heating, ending in the thermal store of the surroundings.',
      lv: [2, 3],
    },
    {
      prompt: 'An archer pulls back a bow and fires an arrow into a target. Put the energy stores in order.',
      steps: ['Chemical store of the archer\'s muscles', 'Elastic potential store of the bent bow', 'Kinetic store of the flying arrow', 'Thermal store of the target and surroundings'],
      direction: ['first', 'last'],
      hint: 'Start with where the archer got the energy to pull the bow.',
      why: 'The archer\'s muscles (chemical store) bend the bow (elastic potential store). Releasing it gives the arrow a kinetic store. When the arrow stops in the target, the energy ends up in the thermal store of the target and surroundings.',
      lv: [3, 5],
    },
    {
      prompt: 'A hydroelectric power station lets water fall from a high reservoir through turbines. Put the steps in order.',
      steps: ['Gravitational potential store of the water high in the reservoir', 'Kinetic store of the falling water', 'Kinetic store of the spinning turbine and generator', 'Energy transferred electrically to homes'],
      direction: ['first', 'last'],
      hint: 'Follow the water from the top of the dam down.',
      why: 'High water has a gravitational potential store. As it falls this becomes its kinetic store, which spins the turbines and generator. The generator transfers energy electrically through the grid.',
      lv: [3, 5],
    },
    {
      prompt: 'A torch is switched on. Put the steps of the energy transfer in order.',
      steps: ['Chemical store of the battery', 'Energy transferred electrically by the current', 'Energy carried away from the bulb by light', 'Thermal store of the surroundings (where the light is absorbed)'],
      direction: ['first', 'last'],
      hint: 'Start with the store inside the torch.',
      why: 'The battery\'s chemical store drives a current, which transfers energy electrically to the bulb. The bulb transfers it by light (and some by heating), and when the light is absorbed it warms the surroundings.',
      lv: [3, 5],
    },
    {
      prompt: 'A moving car brakes and stops. Put the energy stores in order.',
      steps: ['Kinetic store of the moving car', 'Thermal store of the hot brakes', 'Thermal store of the surroundings (as the brakes cool)'],
      direction: ['first', 'last'],
      hint: 'Brakes work by friction, which warms things up.',
      why: 'Friction in the brakes transfers energy from the car\'s kinetic store to the thermal store of the brakes, which then cool by heating the surroundings.',
      lv: [2, 4],
    },
  ],
  mcqs: [
    {
      q: 'What does the law of conservation of energy say?',
      a: 'Energy cannot be created or destroyed, only transferred from one store to another',
      wrong: [{ label: 'Energy gets used up when we do things', misconception: 'energy-used-up', feedback: 'Energy is never used up. It is transferred, often ending up spread out in the surroundings.' }, 'We should save energy by switching things off', 'Energy is created in power stations'],
      hint: 'The total amount of energy never changes.',
      why: 'Energy is conserved: it can be transferred and stored in different ways, but the total amount stays the same. "Saving energy" is good advice, but it is not the law of conservation of energy.',
      lv: [1, 3],
    },
    {
      q: 'A bouncing ball bounces a little lower each time. Why?',
      a: 'Some energy is transferred to the thermal store of the ball and surroundings, and by sound, at each bounce',
      wrong: [{ label: 'Energy is destroyed each time it hits the floor', misconception: 'energy-destroyed', feedback: 'Energy is never destroyed. It goes somewhere less useful.' }, 'Gravity gets stronger', 'The ball loses mass each bounce'],
      hint: 'Energy cannot disappear. Where could some of it go when the ball hits the floor?',
      why: 'At each bounce some energy is dissipated: it warms the ball and floor and makes a sound. Less is left in the kinetic store, so the ball cannot rise as high.',
      lv: [2, 4],
    },
    {
      q: 'What does "dissipated" mean when we talk about wasted energy?',
      a: 'Spread out into the surroundings, so it is less useful',
      wrong: [{ label: 'Destroyed', misconception: 'energy-destroyed', feedback: 'Dissipated energy still exists. It is just spread out and hard to use.' }, 'Stored for later use', 'Turned back into fuel'],
      hint: 'Think about where a warm room\'s energy goes.',
      why: 'Wasted energy is usually dissipated: spread thinly into the thermal store of the surroundings, where it is hard to use again.',
      lv: [2, 4],
    },
    {
      q: 'Lamp A has an efficiency of 10%. Lamp B has an efficiency of 40%. Both are supplied with the same energy. Which is true?',
      a: 'Lamp B transfers more of the energy usefully, as light',
      wrong: [{ label: 'Lamp A transfers more of the energy as light', misconception: 'efficiency-backwards', feedback: 'Higher efficiency means a bigger fraction of the energy is useful.' }, 'Lamp B is supplied with more energy', 'Both waste the same amount of energy'],
      hint: 'Efficiency is the fraction of the input energy that is useful.',
      why: 'Efficiency is useful energy out ÷ total energy in. 40% efficient means 40 J of every 100 J becomes light, compared with only 10 J for lamp A.',
      lv: [3, 5],
    },
    {
      q: 'Can any real machine be 100% efficient?',
      a: 'No, some energy is always dissipated, usually by heating the surroundings',
      wrong: [{ label: 'Yes, if it is new and well made', misconception: 'perfect-machine', feedback: 'Even the best machines dissipate some energy, for example through friction or electrical resistance.' }, 'Yes, if you switch it off when not in use', 'No, because energy is destroyed inside it'],
      hint: 'Think about friction and wires warming up.',
      why: 'Some energy is always transferred to less useful stores, such as the thermal store of the surroundings, by friction, resistance or sound. So real machines are always less than 100% efficient.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'A student says: "When a car brakes to a stop, its energy is used up." Explain what is wrong with this, and what really happens to the energy.',
      model:
        'Energy cannot be used up or destroyed; it can only be transferred. When the car brakes, friction between the brake pads and the discs transfers energy from the car\'s kinetic store to the thermal store of the brakes. The brakes then cool down, so the energy ends up spread out (dissipated) in the thermal store of the surroundings. The total amount of energy stays the same.',
      checklist: ['Says energy cannot be destroyed (it is conserved)', 'Starts from the car\'s kinetic store', 'Mentions friction in the brakes heating them', 'Says the energy ends up in the surroundings (dissipated)'],
      hint: 'Which store is the car\'s energy in while it is moving? Where does it go when friction acts?',
    },
    {
      prompt: 'Explain why an LED bulb is better than an old filament bulb for lighting a room, using the idea of efficiency.',
      model:
        'Both bulbs are supplied with energy electrically, but a filament bulb transfers most of it by heating the surroundings and only a small fraction as light. An LED bulb transfers a much bigger fraction of the energy as light, so it is more efficient. This means an LED needs less energy (a lower power) to give the same brightness, which saves money and means less fuel is burned in power stations.',
      checklist: ['Says a filament bulb wastes most energy by heating', 'Says an LED transfers a bigger fraction as light (more efficient)', 'Says the LED needs less energy (or power) for the same light', 'Gives a benefit (lower cost or less fuel burned)'],
      hint: 'Efficiency is how much of the energy supplied ends up useful.',
    },
  ],
}

interface Device {
  name: string
  input: string
  useful: string
  wasted: string
  totals: number[]
  effs: number[]
  unit: 'J' | 'kJ'
}

const DEVICES: Device[] = [
  { name: 'a filament lamp', input: 'electrically', useful: 'light', wasted: 'heating the surroundings', totals: [100, 200, 500, 1000], effs: [5, 10], unit: 'J' },
  { name: 'an LED lamp', input: 'electrically', useful: 'light', wasted: 'heating the surroundings', totals: [100, 200, 400, 500], effs: [25, 40, 50], unit: 'J' },
  { name: 'an electric motor', input: 'electrically', useful: 'the kinetic store of the motor', wasted: 'heating and sound', totals: [200, 400, 500, 1000], effs: [60, 70, 75, 80], unit: 'J' },
  { name: 'an electric kettle', input: 'electrically', useful: 'the thermal store of the water', wasted: 'heating the kettle and the air', totals: [1000, 2000, 5000], effs: [80, 85, 90], unit: 'J' },
  { name: 'a car engine', input: 'from the chemical store of the fuel', useful: 'the kinetic store of the car', wasted: 'heating the engine and surroundings, and sound', totals: [100, 200, 500, 1000], effs: [20, 25, 30], unit: 'kJ' },
  { name: 'a loudspeaker', input: 'electrically', useful: 'sound', wasted: 'heating the speaker', totals: [100, 200, 500], effs: [10, 20, 25], unit: 'J' },
]

const efficiency = G('phys.energy.transfers.efficiency', 'phys.energy.transfers', [2, 5], (rng, d) => {
  const dv = rng.pick(DEVICES)
  const total = rng.pick(dv.totals)
  const eff = rng.pick(dv.effs)
  const useful = round((total * eff) / 100)
  const wasted = round(total - useful)
  const u = dv.unit
  const intro = `${dv.name[0]?.toUpperCase()}${dv.name.slice(1)} is supplied with ${fmt(total)} ${u} of energy ${dv.input}.`
  if (d === 2) {
    return num({
      prompt: `${intro} ${fmt(useful)} ${u} is transferred usefully to ${dv.useful}. The rest is wasted by ${dv.wasted}. How much energy is wasted? Give your answer in ${u}.`,
      answer: wasted,
      suffix: u,
      hint: 'Energy is conserved: useful + wasted = total supplied.',
      explanation: `Wasted = total − useful = ${fmt(total)} − ${fmt(useful)} = ${fmt(wasted)} ${u}. No energy is destroyed; it is all accounted for.`,
      errors: [err(total + useful, 'added', 'The wasted energy must be less than the total supplied. Subtract.')],
    })
  }
  if (d === 3) {
    return num({
      prompt: `${intro} ${fmt(useful)} ${u} is transferred usefully to ${dv.useful}. Calculate its efficiency as a percentage.`,
      answer: eff,
      suffix: '%',
      hint: 'Efficiency = useful energy out ÷ total energy in, × 100.',
      explanation: `Efficiency = ${fmt(useful)} ÷ ${fmt(total)} × 100 = ${eff}%.`,
      errors: [err(round(useful / total, 6), 'forgot-100', 'That is the efficiency as a decimal. Multiply by 100 for a percentage.'), err(round((total / useful) * 100, 6), 'upside-down', 'Divide the useful energy by the total, not the other way round.')],
    })
  }
  if (d === 4) {
    return num({
      prompt: `${intro} ${fmt(wasted)} ${u} is wasted by ${dv.wasted}. Calculate its efficiency as a percentage.`,
      answer: eff,
      suffix: '%',
      hint: 'First work out the useful energy (total − wasted).',
      explanation: `Useful energy = ${fmt(total)} − ${fmt(wasted)} = ${fmt(useful)} ${u}. Efficiency = ${fmt(useful)} ÷ ${fmt(total)} × 100 = ${eff}%.`,
      errors: [err(round((wasted / total) * 100, 6), 'used-wasted', 'That is the percentage WASTED. Efficiency uses the useful energy.')],
    })
  }
  return num({
    prompt: `${dv.name[0]?.toUpperCase()}${dv.name.slice(1)} is ${eff}% efficient. It transfers ${fmt(useful)} ${u} usefully to ${dv.useful}. How much energy was supplied to it? Give your answer in ${u}.`,
    answer: total,
    suffix: u,
    hint: `${eff}% of the energy supplied is useful. If ${eff}% is ${fmt(useful)} ${u}, what is 100%?`,
    explanation: `${eff}% of the input = ${fmt(useful)} ${u}, so 1% = ${fmt(useful / eff)} ${u} and 100% = ${fmt(total)} ${u}.`,
    errors: [err(round((useful * eff) / 100, 6), 'multiplied-percent', 'The input must be bigger than the useful output. Divide by the efficiency instead.')],
  })
})

// =====================================================================================================================
// Energy resources
// =====================================================================================================================

const RES_MEANS: Record<string, string> = {
  Renewable: 'It will not run out (it is replaced naturally as fast as we use it).',
  'Non-renewable': 'It will run out, because it took millions of years to form or there is a limited amount.',
}

const resourcesBank: Bank = {
  skill: 'phys.energy.resources',
  sorts: [
    {
      id: 'renewable',
      categories: ['Renewable', 'Non-renewable'],
      items: [
        ['wind', 'Renewable'],
        ['solar', 'Renewable'],
        ['hydroelectric', 'Renewable'],
        ['tidal', 'Renewable'],
        ['wave power', 'Renewable'],
        ['geothermal', 'Renewable'],
        ['coal', 'Non-renewable'],
        ['oil', 'Non-renewable'],
        ['natural gas', 'Non-renewable'],
        ['nuclear fuel (uranium)', 'Non-renewable'],
      ],
      ask: (x) => `Is ${x} a renewable or a non-renewable energy resource?`,
      hint: 'Will it run out?',
      means: RES_MEANS,
      lv: [1, 4],
    },
  ],
  links: [
    {
      prompt: 'Match each energy resource to how it is used to generate electricity.',
      pairs: [
        ['Wind', 'Moving air turns the blades of a turbine'],
        ['Solar cells', 'Light falling on the cells produces a current directly'],
        ['Hydroelectric', 'Water falling from a high reservoir turns turbines'],
        ['Tidal', 'Water flowing in and out with the tides turns turbines'],
        ['Geothermal', 'Hot rocks deep underground heat water to make steam'],
        ['Fossil fuels', 'Coal, oil or gas is burned to boil water into steam'],
        ['Nuclear', 'Splitting uranium nuclei heats water to make steam'],
      ],
      hint: 'Most power stations spin a turbine. What makes it spin in each case?',
      ask: (r) => (r === 'Solar cells' || r === 'Fossil fuels' ? `How are ${r.toLowerCase()} used to generate electricity?` : `How is ${r.toLowerCase()} power used to generate electricity?`),
      lv: [2, 4],
    },
  ],
  orders: [
    {
      prompt: 'Put the steps of a gas-fired power station in order.',
      steps: ['The fuel is burned', 'The water boils into steam', 'The steam turns a turbine', 'The turbine turns a generator', 'Electricity goes out along the National Grid'],
      direction: ['first', 'last'],
      hint: 'Burning heats water. What does the steam do?',
      why: 'Burning fuel heats water into high-pressure steam. The steam spins a turbine, which turns a generator, and the electricity is sent along the National Grid.',
      lv: [2, 5],
    },
  ],
  mcqs: [
    {
      q: 'How were fossil fuels formed?',
      a: 'From the remains of plants and animals buried and squashed over millions of years',
      wrong: [{ label: 'From volcanic rock cooling down', misconception: 'fossil-volcanic', feedback: 'Fossil fuels come from living things, which is why they are called "fossil" fuels.' }, 'From rainwater soaking into the ground', 'In factories from plastic'],
      hint: 'The name gives a clue.',
      why: 'Coal, oil and natural gas formed from the remains of ancient plants and sea creatures, buried and changed by heat and pressure over millions of years. That is why they will run out.',
      lv: [1, 3],
    },
    {
      q: 'What is the main problem with burning fossil fuels?',
      a: 'They release carbon dioxide, which adds to climate change',
      wrong: [{ label: 'They produce radioactive waste', misconception: 'fossil-radioactive', feedback: 'That is a problem with nuclear power, not fossil fuels.' }, 'They only work when the wind blows', 'They can only be used at night'],
      hint: 'What gas is made when carbon-based fuels burn?',
      why: 'Burning coal, oil and gas releases carbon dioxide, a greenhouse gas that adds to global warming. They will also run out.',
      lv: [1, 3],
    },
    {
      q: 'What is a disadvantage of wind turbines?',
      a: 'They do not generate electricity when the wind is not blowing',
      wrong: [{ label: 'They release lots of carbon dioxide while working', misconception: 'wind-co2', feedback: 'Wind turbines do not burn anything, so they release no carbon dioxide while working.' }, 'The wind will run out one day', 'They produce radioactive waste'],
      hint: 'Can you control the weather?',
      why: 'Wind is renewable and releases no carbon dioxide while working, but it is unreliable: no wind, no electricity. Some people also object to how turbines look.',
      lv: [2, 4],
    },
    {
      q: 'What is a disadvantage of nuclear power?',
      a: 'It produces radioactive waste that must be stored safely for a very long time',
      wrong: [{ label: 'It releases lots of carbon dioxide while generating', misconception: 'nuclear-co2', feedback: 'Nuclear power stations do not burn fuel, so they release very little carbon dioxide while generating.' }, 'It only works when the Sun is shining', 'It is renewable'],
      hint: 'Think about what is left over after the uranium is used.',
      why: 'Nuclear power is reliable and releases very little carbon dioxide while generating, but its waste stays radioactive for a very long time and uranium will eventually run out.',
      lv: [2, 4],
    },
    {
      q: 'The energy in most of our energy resources (fossil fuels, wind, solar, biomass) came originally from where?',
      a: 'The Sun',
      wrong: [{ label: 'The Earth\'s core', misconception: 'core-source', feedback: 'That is the source of geothermal energy only.' }, 'The Moon', 'Power stations'],
      hint: 'Plants grow using light, and winds are driven by uneven heating.',
      why: 'Plants (and so fossil fuels and biomass) store energy from sunlight, and winds and waves are driven by the Sun warming the Earth unevenly. Nuclear, geothermal and tidal are the main exceptions.',
      lv: [3, 5],
    },
    {
      q: 'Why is biomass (for example wood from managed forests) counted as renewable?',
      a: 'New plants can be grown to replace what is burned',
      wrong: [{ label: 'Burning it releases no carbon dioxide', misconception: 'biomass-no-co2', feedback: 'Burning wood does release carbon dioxide. New trees take it back in as they grow.' }, 'It never runs out even if trees are not replanted', 'It is not burned'],
      hint: 'Can you make more of it?',
      why: 'Biomass is renewable because new crops or trees can be grown to replace it. Burning it releases carbon dioxide, but growing plants take carbon dioxide in.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'A town is deciding between a gas-fired power station and a wind farm. Give one advantage and one disadvantage of each.',
      model:
        'A gas-fired power station is reliable: it can generate electricity whenever it is needed, and can be turned up quickly at busy times. However, it burns a fossil fuel that releases carbon dioxide, adding to climate change, and gas will run out. A wind farm uses a renewable resource and releases no carbon dioxide while working. However, it only generates when the wind blows, so it is less reliable, and some people think turbines spoil the view.',
      checklist: ['An advantage of gas (e.g. reliable, can meet demand quickly)', 'A disadvantage of gas (e.g. carbon dioxide, non-renewable)', 'An advantage of wind (e.g. renewable, no carbon dioxide while working)', 'A disadvantage of wind (e.g. unreliable, appearance)'],
      hint: 'Think about reliability, pollution and whether it will run out.',
      passMark: 3,
    },
  ],
}

// =====================================================================================================================
// Power
// =====================================================================================================================

const APPLIANCES: [string, number[]][] = [
  ['an LED bulb', [5, 8, 10]],
  ['a phone charger', [5, 10, 20]],
  ['a laptop', [40, 50, 60]],
  ['a television', [80, 100, 120]],
  ['a microwave oven', [800, 900, 1000]],
  ['a toaster', [800, 1000, 1200]],
  ['a hairdryer', [1000, 1500, 2000]],
  ['a kettle', [2000, 2500, 3000]],
]

const power = G('phys.energy.power.calc', 'phys.energy.power', [1, 5], (rng, d) => {
  const [app, ps] = rng.pick(APPLIANCES)
  const p = rng.pick(ps)
  const t = rng.pick(d <= 2 ? [2, 5, 10, 20] : [5, 10, 20, 30, 60, 120])
  const e = p * t
  const App = `${app[0]?.toUpperCase()}${app.slice(1)}`
  if (d <= 2) {
    return num({
      prompt: `${App} transfers ${fmt(e)} J of energy in ${t} s. What is its power? Give your answer in watts (W).`,
      answer: p,
      suffix: 'W',
      hint: 'Power = energy transferred ÷ time.',
      explanation: `Power = ${fmt(e)} J ÷ ${t} s = ${fmt(p)} W (joules per second).`,
      errors: [err(e * t, 'multiplied', 'Power is energy DIVIDED by time.')],
    })
  }
  if (d === 3) {
    return num({
      prompt: `${App} has a power of ${fmt(p)} W. How much energy does it transfer in ${t} s? Give your answer in joules (J).`,
      answer: e,
      suffix: 'J',
      hint: 'Rearrange power = energy ÷ time to energy = power × time.',
      explanation: `Energy = power × time = ${fmt(p)} × ${t} = ${fmt(e)} J.`,
      errors: [err(round(p / t, 6), 'divided', 'Energy = power × time. You divided.')],
    })
  }
  if (d === 4) {
    return num({
      prompt: `${App} has a power of ${fmt(p)} W. How long does it take to transfer ${fmt(e)} J of energy? Give your answer in seconds.`,
      answer: t,
      suffix: 's',
      hint: 'Time = energy ÷ power.',
      explanation: `Time = energy ÷ power = ${fmt(e)} ÷ ${fmt(p)} = ${t} s.`,
      errors: [err(e * p, 'multiplied', 'Time = energy ÷ power. You multiplied.'), err(round(p / e, 6), 'upside-down', 'Divide the energy by the power, not the other way round.')],
    })
  }
  // Level 5: kW and minutes, answer in kJ.
  const pk = rng.pick([0.5, 1, 1.5, 2, 2.5, 3])
  const mins = rng.pick([2, 3, 4, 5, 10])
  const kj = round(pk * 1000 * mins * 60 / 1000)
  return num({
    prompt: `An electric heater has a power of ${fmt(pk)} kW. How much energy does it transfer in ${mins} minutes? Give your answer in kilojoules (kJ).`,
    answer: kj,
    suffix: 'kJ',
    hint: 'Convert to W and seconds first: energy (J) = power (W) × time (s). Then change J to kJ.',
    explanation: `${fmt(pk)} kW = ${fmt(pk * 1000)} W and ${mins} minutes = ${mins * 60} s. Energy = ${fmt(pk * 1000)} × ${mins * 60} = ${fmt(kj * 1000)} J = ${fmt(kj)} kJ.`,
    errors: [err(pk * mins, 'no-conversion', 'Convert minutes to seconds (and kW to W) before multiplying.'), err(kj * 1000, 'left-in-joules', 'That is in joules. Divide by 1000 for kJ.')],
  })
})

const powerBank: Bank = {
  skill: 'phys.energy.power',
  orders: [
    {
      prompt: 'Put these appliances in order of their typical power, lowest first.',
      steps: ['LED bulb', 'Television', 'Microwave oven', 'Kettle', 'Electric shower'],
      direction: ['lowest power', 'highest power'],
      hint: 'Appliances that heat things quickly have the highest power.',
      why: 'Typical powers: an LED bulb about 5-10 W, a television about 100 W, a microwave about 1000 W, a kettle about 2000-3000 W and an electric shower several thousand watts (often 8000 W or more).',
      lv: [2, 4],
    },
  ],
  mcqs: [
    {
      q: 'What does a power of 1 watt mean?',
      a: '1 joule of energy is transferred every second',
      wrong: [{ label: '1 joule of energy is transferred every hour', misconception: 'watt-hour', feedback: 'A watt is joules per SECOND.' }, '1 newton of force every second', '1 amp of current'],
      hint: 'Power is a rate: how fast energy is transferred.',
      why: 'Power = energy ÷ time, so 1 W = 1 J/s.',
      lv: [1, 3],
    },
    {
      q: 'A 2000 W kettle and a 1000 W kettle each heat the same amount of water from cold to boiling. Which is true?',
      a: 'The 2000 W kettle boils the water faster',
      wrong: [{ label: 'The 2000 W kettle needs more energy to boil the same water', misconception: 'power-is-energy', feedback: 'Both need about the same energy. Higher power means transferring it faster.' }, 'They take the same time', 'The 1000 W kettle boils it faster'],
      hint: 'Power tells you how fast energy is transferred.',
      why: 'The same water needs about the same energy to boil. The 2000 W kettle transfers energy twice as fast, so it boils the water in about half the time.',
      lv: [2, 4],
    },
    {
      q: 'How many watts are in 3 kilowatts?',
      a: '3000 W',
      wrong: [{ label: '300 W', misconception: 'kilo-100', feedback: 'Kilo means 1000, so 1 kW = 1000 W.' }, '30 W', '0.003 W'],
      hint: 'Kilo means 1000.',
      why: '1 kW = 1000 W, so 3 kW = 3000 W.',
      lv: [1, 3],
    },
  ],
}

// =====================================================================================================================
// Paying for electricity
// =====================================================================================================================

const cost = G('phys.energy.cost.calc', 'phys.energy.cost', [1, 5], (rng, d) => {
  if (d <= 2) {
    const kw = rng.pick([0.5, 1, 1.5, 2, 2.5, 3])
    const h = rng.pick(d === 1 ? [1, 2, 3, 4] : [0.5, 1.5, 2, 3, 4, 5])
    const kwh = round(kw * h)
    return num({
      prompt: `A heater with a power of ${fmt(kw)} kW is switched on for ${fmt(h)} hour${h === 1 ? '' : 's'}. How much energy does it transfer, in kilowatt-hours (kWh)?`,
      answer: kwh,
      suffix: 'kWh',
      hint: 'Energy (kWh) = power (kW) × time (hours).',
      explanation: `Energy = ${fmt(kw)} kW × ${fmt(h)} h = ${fmt(kwh)} kWh.`,
      errors: [err(round(kw / h, 6), 'divided', 'Multiply the power by the time.')],
    })
  }
  if (d === 3) {
    const kwh = rng.pick([2, 3, 4, 5, 6, 8, 10, 12])
    const price = rng.pick([20, 24, 25, 28, 30])
    const c = kwh * price
    return num({
      prompt: `Electricity costs ${price}p per kWh. A washing machine uses ${kwh} kWh in a week. How much does that cost, in pence?`,
      answer: c,
      suffix: 'p',
      hint: 'Cost = energy in kWh × price per kWh.',
      explanation: `Cost = ${kwh} kWh × ${price}p = ${c}p${c >= 100 ? ` (£${(c / 100).toFixed(2)})` : ''}.`,
      errors: [err(round(price / kwh, 6), 'divided', 'Multiply the number of kWh by the price of one kWh.')],
    })
  }
  if (d === 4) {
    const USES: [string, number[], number[]][] = [
      ['A laptop', [40, 50, 60], [60, 120, 180, 240, 300]],
      ['A television', [80, 100, 120], [60, 90, 120, 180, 240, 300]],
      ['A microwave oven', [800, 900, 1000], [15, 30, 45, 60]],
      ['A hairdryer', [1000, 1500, 2000], [15, 30, 45, 60]],
      ['A kettle', [2000, 2500, 3000], [15, 30, 45, 60]],
    ]
    for (let i = 0; i < 40; i++) {
      const [app, ps, times] = rng.pick(USES)
      const w = rng.pick(ps)
      const mins = rng.pick(times)
      const kwh = round((w / 1000) * (mins / 60), 6)
      const price = rng.pick([20, 24, 25, 28, 30])
      const c = round(kwh * price, 6)
      if (!Number.isInteger(c) || c < 1) continue
      const time = mins < 60 ? `${mins} minutes` : mins % 60 === 0 ? `${mins / 60} hour${mins === 60 ? '' : 's'}` : `${fmt(mins / 60)} hours`
      return num({
        prompt: `${app} has a power of ${fmt(w)} W and is used for a total of ${time} in a week. Electricity costs ${price}p per kWh. How much does this cost, in pence?`,
        answer: c,
        suffix: 'p',
        hint: 'Change the power to kW and the time to hours first. Then kWh = kW × hours, and cost = kWh × price.',
        explanation: `${fmt(w)} W = ${fmt(w / 1000)} kW and ${time} = ${fmt(mins / 60)} h. Energy = ${fmt(w / 1000)} × ${fmt(mins / 60)} = ${fmt(kwh)} kWh. Cost = ${fmt(kwh)} × ${price}p = ${fmt(c)}p.`,
        errors: [err(round(w * (mins / 60) * price, 6), 'watts-not-kw', 'Change watts to kilowatts (÷ 1000) first.'), err(round((w / 1000) * mins * price, 6), 'minutes-not-hours', 'Change the time into hours first.')],
      })
    }
  }
  // Level 5 (and fallback): meter readings.
  const before = rng.int(10000, 40000)
  const used = rng.pick([120, 150, 180, 200, 240, 250, 300, 320])
  const price = rng.pick([20, 25, 30])
  const pounds = round((used * price) / 100, 2)
  return num({
    prompt: `An electricity meter read ${fmt(before)} kWh at the start of the month and ${fmt(before + used)} kWh at the end. Electricity costs ${price}p per kWh. What is the cost for the month, in pounds (£)?`,
    answer: pounds,
    prefix: '£',
    tolerance: 0.001,
    hint: 'Subtract the readings to find the kWh used, multiply by the price, then change pence to pounds.',
    explanation: `Energy used = ${fmt(before + used)} − ${fmt(before)} = ${used} kWh. Cost = ${used} × ${price}p = ${used * price}p = £${pounds.toFixed(2)}.`,
    errors: [err(used * price, 'left-in-pence', 'That is in pence. Divide by 100 for pounds.'), err(round(((before + used) * price) / 100, 2), 'used-reading', 'Use the DIFFERENCE between the two readings, not the final reading.')],
  })
})

const costBank: Bank = {
  skill: 'phys.energy.cost',
  mcqs: [
    {
      q: 'What is a kilowatt-hour (kWh)?',
      a: 'A unit of energy: the energy a 1 kW appliance transfers in 1 hour',
      wrong: [{ label: 'A unit of power', misconception: 'kwh-power', feedback: 'The kilowatt is the unit of power. A kilowatt-hour is power × time, which is energy.' }, 'The time an appliance is switched on for', 'The cost of electricity per hour'],
      hint: 'Power × time gives what?',
      why: 'Energy = power × time, so kW × hours gives energy in kWh. Electricity companies charge by the kWh.',
      lv: [1, 3],
    },
    {
      q: 'Why do electricity bills use kilowatt-hours rather than joules?',
      a: 'A joule is a tiny amount, so household energy would be huge numbers of joules',
      wrong: [{ label: 'Joules can only be used for food', misconception: 'joules-food', feedback: 'Joules measure any kind of energy.' }, 'Kilowatt-hours measure power, which is what we pay for', 'Joules are not a unit of energy'],
      hint: 'How many joules does a 1 kW kettle transfer in an hour?',
      why: '1 kWh = 1000 W × 3600 s = 3,600,000 J. Using kWh keeps the numbers on a bill manageable.',
      lv: [3, 5],
    },
    {
      q: 'Which of these would use the MOST energy?',
      a: 'A 2 kW heater on for 3 hours',
      wrong: [{ label: 'A 3 kW kettle on for 10 minutes', misconception: 'power-not-time', feedback: 'A high power for a short time: 3 × 1/6 = 0.5 kWh.' }, 'A 100 W TV on for 5 hours', 'A 10 W bulb on for 10 hours'],
      hint: 'Work out kW × hours for each.',
      why: 'Heater: 2 × 3 = 6 kWh. Kettle: 3 × 1/6 = 0.5 kWh. TV: 0.1 × 5 = 0.5 kWh. Bulb: 0.01 × 10 = 0.1 kWh.',
      lv: [3, 5],
    },
  ],
}

// =====================================================================================================================
// Heating and cooling
// =====================================================================================================================

const HEAT_MEANS: Record<string, string> = {
  Conduction: 'Vibrating particles pass energy on to their neighbours, mainly through solids.',
  Convection: 'Warmer liquid or gas rises and cooler fluid sinks, carrying energy round in a current.',
  Radiation: 'Infrared waves carry energy, even through empty space.',
}

const heatingBank: Bank = {
  skill: 'phys.energy.heating',
  terms: [
    { term: 'Temperature', def: 'How hot or cold something is, measured in °C' },
    { term: 'Conduction', def: 'Energy passed from particle to particle as they vibrate and bump into each other' },
    { term: 'Convection', def: 'Energy carried by a warm liquid or gas rising and cooler fluid sinking' },
    { term: 'Radiation', def: 'Energy carried by infrared waves, which can travel through a vacuum' },
    { term: 'Thermal insulator', def: 'A material that slows down energy transfer by heating, such as wool or trapped air' },
    { term: 'Thermal conductor', def: 'A material that lets energy pass through it quickly by heating, such as copper' },
    { term: 'Thermal equilibrium', def: 'When two objects are at the same temperature, so there is no overall energy transfer between them' },
  ],
  sorts: [
    {
      id: 'method',
      categories: Object.keys(HEAT_MEANS),
      items: [
        ['the handle of a metal spoon getting hot in a pan of soup', 'Conduction'],
        ['your hand warming up while you hold a hot mug', 'Conduction'],
        ['energy passing through the metal base of a saucepan', 'Conduction'],
        ['warm air rising from a radiator and moving around a room', 'Convection'],
        ['hot water rising from the bottom of a pan as it is heated', 'Convection'],
        ['warm air rising above a candle flame', 'Convection'],
        ['feeling the warmth of the Sun on your face', 'Radiation'],
        ['feeling the warmth of a bonfire from a few metres away', 'Radiation'],
        ['bread toasting under a grill', 'Radiation'],
      ],
      ask: (x) => `Which way of transferring energy is the main one here: ${x}?`,
      hint: 'Through a solid? Carried by a moving fluid? Or across a gap with no contact?',
      means: HEAT_MEANS,
      sortPrompt: 'Match each example to the main way energy is transferred.',
      lv: [2, 4],
    },
  ],
  mcqs: [
    {
      q: 'A bath of warm water at 40 °C and a cup of tea at 80 °C. Which has more energy in its thermal store?',
      a: 'The bath, because it has a much bigger mass of water',
      wrong: [{ label: 'The tea, because it is hotter', misconception: 'temperature-is-energy', feedback: 'Temperature is not the same as thermal energy. The amount of energy also depends on how much stuff there is.' }, 'They have the same', 'Neither, cold things have no energy'],
      hint: 'Thermal energy depends on the temperature AND on how much material there is.',
      why: 'The tea is hotter, but the bath has so much more water that its thermal store holds far more energy. Temperature and thermal energy are not the same thing.',
      lv: [3, 5],
    },
    {
      q: 'A hot drink is left in a room. When does it stop cooling down?',
      a: 'When it reaches the same temperature as the room',
      wrong: [{ label: 'When it reaches 0 °C', misconception: 'cools-to-zero', feedback: 'It only cools until there is no temperature difference left.' }, 'It keeps cooling forever', 'When it has no energy left'],
      hint: 'Energy flows from hot to cold until...?',
      why: 'Energy moves from hotter to cooler objects until they are at the same temperature (thermal equilibrium). Then there is no overall transfer.',
      lv: [1, 3],
    },
    {
      q: 'Why does a metal bench feel colder than a wooden bench on the same cold morning?',
      a: 'Metal is a better thermal conductor, so it transfers energy away from your hand faster',
      wrong: [{ label: 'The metal bench is at a lower temperature', misconception: 'metal-colder', feedback: 'Both benches have been outside all night, so they are at the same temperature.' }, 'Metal gives out cold', 'Wood is warmer because it was once alive'],
      hint: 'Both have been outside all night at the same temperature.',
      why: 'Both benches are at the same temperature, but metal conducts energy away from your warm hand much faster than wood does, so it feels colder.',
      lv: [3, 5],
    },
    {
      q: 'Which way of transferring energy can work through a vacuum (empty space)?',
      a: 'Radiation',
      wrong: [{ label: 'Conduction', misconception: 'conduction-vacuum', feedback: 'Conduction needs particles to pass energy along.' }, { label: 'Convection', misconception: 'convection-vacuum', feedback: 'Convection needs a liquid or gas that can flow.' }, 'None of them'],
      hint: 'How does energy reach us from the Sun?',
      why: 'Conduction and convection need particles. Infrared radiation is a wave and can travel through empty space, which is how the Sun warms the Earth.',
      lv: [1, 3],
    },
    {
      q: 'Why does warm air rise?',
      a: 'Its particles move faster and spread out, so it is less dense than the cooler air around it',
      wrong: [{ label: 'Its particles get bigger', misconception: 'particles-expand', feedback: 'The particles stay the same size; the spaces between them get bigger.' }, 'Heat always rises', 'Warm air has no mass'],
      hint: 'Think about density.',
      why: 'When air is warmed its particles move faster and spread out. The same mass takes up more space, so it is less dense and floats up through cooler, denser air.',
      lv: [2, 4],
    },
    {
      q: 'Why are woolly jumpers and duvets good at keeping you warm?',
      a: 'They trap air, which is a poor conductor',
      wrong: [{ label: 'They produce heat', misconception: 'clothes-make-heat', feedback: 'They do not make energy; they slow down energy leaving your body.' }, 'They keep the cold out', 'Wool is a good conductor'],
      hint: 'What fills the gaps between the fibres?',
      why: 'The fibres trap lots of air, a very poor conductor, and stop it moving around (so no convection). This slows down the energy transfer from your warm body.',
      lv: [1, 3],
    },
    {
      q: 'Which kind of surface is best at absorbing and giving out infrared radiation?',
      a: 'Dark and matt (dull)',
      wrong: [{ label: 'Light and shiny', misconception: 'shiny-absorbs', feedback: 'Light, shiny surfaces reflect infrared, so they are the worst absorbers and emitters.' }, 'Light and matt', 'Dark and shiny'],
      hint: 'Why do people wear light colours in hot countries?',
      why: 'Dark, matt surfaces are the best absorbers and emitters of infrared. Light, shiny surfaces are the worst, because they reflect it.',
      lv: [2, 4],
    },
  ],
  written: [
    {
      prompt: 'Explain how double glazing (two panes of glass with a gap of air or gas between them) reduces energy transfer out of a house.',
      model:
        'Energy passes through a single pane of glass quickly by conduction. With double glazing, the energy has to cross the gap between the panes. Air (or another gas) is a very poor conductor because its particles are far apart, and the gap is narrow so convection currents cannot easily form. So less energy is transferred from the warm inside to the cold outside, keeping the house warmer and saving money.',
      checklist: ['Says gases/air are poor conductors (particles far apart)', 'Mentions the gap reducing conduction through the window', 'Mentions convection is limited in the narrow gap', 'Says less energy is transferred from inside to outside'],
      hint: 'Think about conduction through the glass and what the air gap does.',
    },
    {
      prompt: 'Explain why a radiator is usually fixed near the floor, and how it warms the whole room.',
      model:
        'The radiator warms the air next to it by conduction. The warm air expands and becomes less dense, so it rises. Cooler, denser air from elsewhere in the room sinks and moves towards the radiator to take its place, where it is warmed in turn. This sets up a convection current that carries energy around the whole room. Putting the radiator low down means the warm air rises through the room rather than collecting at the ceiling.',
      checklist: ['Air next to the radiator is warmed', 'Warm air is less dense and rises', 'Cooler air sinks and moves to replace it', 'Names this a convection current that spreads energy round the room'],
      hint: 'Use the idea of density and convection currents.',
    },
  ],
}

// =====================================================================================================================
// Work done and simple machines
// =====================================================================================================================

const workCalc = G('phys.energy.work.calc', 'phys.energy.work', [1, 5], (rng, d) => {
  const f = rng.pick([10, 20, 25, 40, 50, 60, 80, 100, 150, 200, 250, 500])
  const s = rng.pick([2, 3, 4, 5, 6, 8, 10, 0.5, 1.5])
  const w = round(f * s)
  const ctx = rng.pick(['pushes a box across the floor', 'pulls a sledge across the snow', 'drags a heavy bag along the ground', 'pushes a broken-down car along the road'])
  if (d <= 2) {
    return num({
      prompt: `Sam ${ctx} with a force of ${fmt(f)} N for a distance of ${fmt(s)} m. How much work does Sam do? Give your answer in joules (J).`,
      answer: w,
      suffix: 'J',
      hint: 'Work done = force × distance moved in the direction of the force.',
      explanation: `Work done = ${fmt(f)} N × ${fmt(s)} m = ${fmt(w)} J. That is the energy transferred.`,
      errors: [err(round(f / s, 6), 'divided', 'Work done = force × distance. You divided.')],
    })
  }
  if (d === 3) {
    return num({
      prompt: `Sam ${ctx} for ${fmt(s)} m and does ${fmt(w)} J of work. What force did Sam use? Give your answer in newtons (N).`,
      answer: f,
      suffix: 'N',
      hint: 'Force = work done ÷ distance.',
      explanation: `Force = ${fmt(w)} J ÷ ${fmt(s)} m = ${fmt(f)} N.`,
      errors: [err(round(w * s, 6), 'multiplied', 'Divide the work done by the distance.')],
    })
  }
  if (d === 4) {
    return num({
      prompt: `Sam ${ctx} with a force of ${fmt(f)} N and does ${fmt(w)} J of work. How far did it move? Give your answer in metres (m).`,
      answer: s,
      suffix: 'm',
      hint: 'Distance = work done ÷ force.',
      explanation: `Distance = ${fmt(w)} J ÷ ${fmt(f)} N = ${fmt(s)} m.`,
      errors: [err(round(w * f, 6), 'multiplied', 'Divide the work done by the force.')],
    })
  }
  // Level 5: lifting a mass (weight from g = 10 N/kg).
  const m = rng.pick([2, 5, 8, 10, 12, 15, 20, 25])
  const h = rng.pick([0.5, 1.5, 2, 3, 4])
  const wt = m * 10
  const work = round(wt * h)
  return num({
    prompt: `A ${m} kg box is lifted steadily onto a shelf ${fmt(h)} m high. How much work is done against gravity? Use g = 10 N/kg. Give your answer in joules (J).`,
    answer: work,
    suffix: 'J',
    hint: 'First find the weight of the box (the force needed): weight = mass × g.',
    explanation: `Weight = ${m} kg × 10 N/kg = ${wt} N. Work done = ${wt} N × ${fmt(h)} m = ${fmt(work)} J.`,
    errors: [err(round(m * h, 6), 'used-mass', 'Use the weight in newtons (mass × 10), not the mass in kg.')],
  })
})

const lever = G('phys.energy.work.lever', 'phys.energy.work', [4, 5], (rng, d) => {
  const load = rng.pick([200, 300, 400, 500, 600, 800, 1000])
  const ratio = rng.pick([2, 4, 5, 10])
  const effort = load / ratio
  const up = rng.pick([0.05, 0.1, 0.2])
  const down = round(up * ratio)
  if (d === 4) {
    return num({
      prompt: `A crowbar is used as a lever to lift a ${load} N rock by ${fmt(up * 100)} cm. The person pushes down ${fmt(down * 100)} cm on the other end. If no energy is wasted, what force must the person use? Give your answer in newtons (N).`,
      answer: effort,
      suffix: 'N',
      hint: 'Work done by the person = work done on the rock. Force × distance is the same on both sides.',
      explanation: `Work on the rock = ${load} N × ${fmt(up)} m = ${fmt(load * up)} J. The person does the same work over ${fmt(down)} m, so force = ${fmt(load * up)} ÷ ${fmt(down)} = ${fmt(effort)} N. The lever gives a bigger force over a smaller distance.`,
      errors: [err(load * ratio, 'force-multiplied', 'A lever lets a SMALLER force move a bigger load, by moving further.')],
    })
  }
  return num({
    prompt: `A lever lifts a ${load} N load. The person pushes with a force of ${fmt(effort)} N. If no energy is wasted and the load rises ${fmt(up * 100)} cm, how far must the person push their end down? Give your answer in centimetres (cm).`,
    answer: down * 100,
    suffix: 'cm',
    hint: 'Force × distance is the same for the person and the load.',
    explanation: `Work on the load = ${load} N × ${fmt(up)} m = ${fmt(load * up)} J. The person does the same work: distance = ${fmt(load * up)} J ÷ ${fmt(effort)} N = ${fmt(down)} m = ${fmt(down * 100)} cm.`,
    errors: [err(round((up * 100) / ratio, 6), 'distance-divided', 'The smaller force has to move FURTHER, not less far.')],
  })
})

const workBank: Bank = {
  skill: 'phys.energy.work',
  mcqs: [
    {
      q: 'What is "work done" in physics?',
      a: 'The energy transferred when a force moves an object',
      wrong: [{ label: 'How tired you feel after a job', misconception: 'everyday-work', feedback: 'In physics, work has an exact meaning: force × distance moved.' }, 'The force needed to hold something still', 'The power of a machine'],
      hint: 'It is measured in joules.',
      why: 'Work done = force × distance moved in the direction of the force. It is the energy transferred, measured in joules.',
      lv: [1, 3],
    },
    {
      q: 'Mo pushes hard against a brick wall for a minute, but the wall does not move. How much work does Mo do on the wall?',
      a: 'None, because the wall does not move',
      wrong: [{ label: 'A lot, because Mo is pushing hard', misconception: 'effort-is-work', feedback: 'Work needs movement: force × distance. With no distance, no work is done on the wall.' }, 'It depends how long Mo pushes', 'It equals Mo\'s weight'],
      hint: 'Work done = force × distance moved.',
      why: 'The distance moved is zero, so the work done on the wall is zero. (Mo\'s muscles still get warm, but no energy is transferred to the wall.)',
      lv: [3, 5],
    },
    {
      q: 'How does a ramp make it easier to get a heavy box onto a lorry?',
      a: 'It needs a smaller force, but the box moves a longer distance',
      wrong: [{ label: 'It reduces the work needed to lift the box', misconception: 'machines-reduce-work', feedback: 'Simple machines do not reduce the work (energy) needed. They trade a smaller force for a bigger distance.' }, 'It makes the box lighter', 'It needs a bigger force over a shorter distance'],
      hint: 'Work = force × distance stays (at least) the same.',
      why: 'A ramp is a simple machine. The same energy is needed to raise the box, but by moving it further along the slope, a smaller force is enough.',
      lv: [3, 5],
    },
    {
      q: 'Which of these is a simple machine that lets a small force lift a big load?',
      a: 'A lever',
      wrong: ['A battery', 'A thermometer', 'A magnet'],
      hint: 'Think of a crowbar or a seesaw.',
      why: 'Levers, ramps, pulleys and gears are simple machines: a small force moving a long way can move a large load a short way.',
      lv: [1, 2],
    },
  ],
}

export const energyGenerators: ItemGenerator[] = [
  ...bankGenerators(storesBank),
  foodEnergy,
  compareFoods,
  ...bankGenerators(foodBank),
  efficiency,
  ...bankGenerators(transfersBank),
  ...bankGenerators(resourcesBank),
  power,
  ...bankGenerators(powerBank),
  cost,
  ...bankGenerators(costBank),
  ...bankGenerators(heatingBank),
  workCalc,
  lever,
  ...bankGenerators(workBank),
]
