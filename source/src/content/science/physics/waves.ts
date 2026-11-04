import type { ItemGenerator } from '@/engine/registry'
import { choice } from '../../kit'
import { bankGenerators, err, fmt, G, num, round, type Bank } from './factory'

// =====================================================================================================================
// Waves
// =====================================================================================================================

const WAVE_MEANS: Record<string, string> = {
  Transverse: 'The vibrations are at right angles to the direction the wave travels.',
  Longitudinal: 'The vibrations are backwards and forwards along the direction the wave travels.',
}

const basicsBank: Bank = {
  skill: 'phys.waves.basics',
  terms: [
    { term: 'Amplitude', def: 'The maximum distance a point on a wave moves from its rest (middle) position' },
    { term: 'Wavelength', def: 'The distance from one point on a wave to the same point on the next wave, such as crest to crest' },
    { term: 'Frequency', def: 'The number of waves passing a point each second, measured in hertz (Hz)' },
    { term: 'Crest', def: 'The highest point of a transverse wave' },
    { term: 'Trough', def: 'The lowest point of a transverse wave' },
    { term: 'Transverse wave', def: 'A wave whose vibrations are at right angles to the direction it travels' },
    { term: 'Longitudinal wave', def: 'A wave whose vibrations are along the same direction that it travels' },
  ],
  sorts: [
    {
      id: 'kind',
      categories: ['Transverse', 'Longitudinal'],
      items: [
        ['light', 'Transverse'],
        ['ripples on a pond', 'Transverse'],
        ['a wave sent along a rope by flicking one end up and down', 'Transverse'],
        ['a wave made by shaking a slinky spring from side to side', 'Transverse'],
        ['sound', 'Longitudinal'],
        ['ultrasound', 'Longitudinal'],
        ['a wave made by pushing and pulling a slinky spring along its length', 'Longitudinal'],
      ],
      ask: (x) => `Is this a transverse or a longitudinal wave: ${x}?`,
      hint: 'Do the vibrations go across (at right angles to) the direction of travel, or along it?',
      means: WAVE_MEANS,
      lv: [2, 4],
    },
  ],
  mcqs: [
    {
      q: 'A rubber duck floats on a pond. Ripples pass it. What happens to the duck?',
      a: 'It bobs up and down but stays in roughly the same place',
      wrong: [{ label: 'It is carried along with the ripples to the edge', misconception: 'waves-carry-matter', feedback: 'Waves transfer energy, not the water (or the duck) itself.' }, 'It sinks', 'Nothing at all'],
      hint: 'Do waves carry the water along with them?',
      why: 'Waves transfer energy from place to place without transferring matter. The water (and the duck) moves up and down as the wave passes, but is not carried away.',
      lv: [1, 3],
    },
    {
      q: 'Two water waves meet so that a crest of one lines up with a crest of the other. What happens?',
      a: 'They add together to make a bigger crest',
      wrong: [{ label: 'They cancel each other out', misconception: 'superposition-backwards', feedback: 'Cancelling happens when a crest meets a trough.' }, 'They bounce off each other', 'Both waves stop'],
      hint: 'Think about adding the two heights together.',
      why: 'When waves overlap, their effects add (superposition). Crest + crest gives a bigger crest; crest + trough can cancel out.',
      lv: [3, 5],
    },
    {
      q: 'Two identical water waves meet so that the crest of one lines up with the trough of the other. What happens?',
      a: 'They cancel out, leaving flat water there',
      wrong: [{ label: 'They make a crest twice as high', misconception: 'superposition-backwards', feedback: 'Doubling happens when crest meets crest.' }, 'They make a wave with double the frequency', 'They turn into a sound wave'],
      hint: 'Add a height of +1 to a height of −1.',
      why: 'A crest (up) plus an equal trough (down) adds to zero, so the waves cancel at that point.',
      lv: [3, 5],
    },
    {
      q: 'What do waves transfer from one place to another?',
      a: 'Energy',
      wrong: [{ label: 'Matter (the material they travel through)', misconception: 'waves-carry-matter', feedback: 'The material vibrates but stays where it is. Waves carry energy.' }, 'Mass', 'Particles of the wave'],
      hint: 'Think of the duck on the pond.',
      why: 'Waves transfer energy (and information) without moving the material along with them.',
      lv: [1, 2],
    },
  ],
}

const waveCalc = G('phys.waves.basics.calc', 'phys.waves.basics', [1, 5], (rng, d) => {
  if (d <= 2) {
    const f = rng.pick([1, 2, 3, 4, 5, 0.5])
    const t = rng.pick([2, 4, 10, 20, 60])
    const n = round(f * t)
    return num({
      prompt: `Waves on a pond are counted: ${fmt(n)} waves pass a post in ${t} seconds. What is the frequency of the waves? Give your answer in hertz (Hz).`,
      answer: f,
      suffix: 'Hz',
      hint: 'Frequency = number of waves passing each second.',
      explanation: `Frequency = ${fmt(n)} waves ÷ ${t} s = ${fmt(f)} Hz.`,
      errors: [err(n * t, 'multiplied', 'Frequency is waves PER second: divide by the time.')],
    })
  }
  if (d <= 4) {
    const lam = rng.pick([0.2, 0.5, 1.5, 2, 2.5, 4, 0.25])
    const n = rng.pick([2, 3, 4, 5, 8, 10])
    const len = round(lam * n)
    return num({
      prompt: `A rope is shaken to make waves. Exactly ${n} complete waves fit along ${fmt(len)} m of rope. What is the wavelength? Give your answer in metres.`,
      answer: lam,
      suffix: 'm',
      hint: 'Wavelength = length of one complete wave.',
      explanation: `${n} waves in ${fmt(len)} m, so one wave is ${fmt(len)} ÷ ${n} = ${fmt(lam)} m long.`,
      errors: [err(round(len * n, 6), 'multiplied', 'Divide the total length by the number of waves.')],
    })
  }
  const [what, f, lam] = rng.pick([
    ['A water wave on a pond', 0.5, 2],
    ['A water wave on a pond', 1, 1.5],
    ['A water wave in a ripple tank', 5, 0.02],
    ['A water wave in a ripple tank', 10, 0.015],
    ['A sound wave in air', 170, 2],
    ['A sound wave in air', 680, 0.5],
    ['A sound wave in air', 85, 4],
    ['A sound wave in water', 300, 5],
  ] as [string, number, number][])
  return num({
    prompt: `Use wave speed = frequency × wavelength. ${what} has a frequency of ${fmt(f)} Hz and a wavelength of ${fmt(lam)} m. What is its speed? Give your answer in m/s.`,
    answer: round(f * lam),
    suffix: 'm/s',
    hint: 'Multiply the frequency by the wavelength.',
    explanation: `Wave speed = ${f} Hz × ${fmt(lam)} m = ${fmt(f * lam)} m/s.`,
    errors: [err(round(f / lam, 6), 'divided', 'Multiply frequency by wavelength.')],
  })
})

// =====================================================================================================================
// How sound travels
// =====================================================================================================================

const MEDIUM_MEANS: Record<string, string> = {
  'Sound can travel through it': 'It is made of particles that can pass the vibrations on.',
  'Sound cannot travel through it': 'There are no particles to pass the vibrations on.',
}

const soundBank: Bank = {
  skill: 'phys.waves.sound',
  orders: [
    {
      prompt: 'Put these steps in order to describe how the sound of a drum reaches your ear.',
      steps: [
        'The drum skin is hit and vibrates',
        'The vibrating skin pushes and pulls on the air particles next to it',
        'Air particles pass the vibrations on to their neighbours',
        'The vibrations travel through the air as a longitudinal wave',
        'The vibrating air makes your eardrum vibrate',
      ],
      direction: ['first', 'last'],
      hint: 'Every sound starts with something vibrating.',
      why: 'Sound starts with a vibration. The vibrating object makes the particles next to it vibrate, and each passes the vibration to the next, carrying a longitudinal wave through the air to your eardrum.',
      lv: [2, 5],
    },
  ],
  sorts: [
    {
      id: 'medium',
      categories: Object.keys(MEDIUM_MEANS),
      items: [
        ['air', 'Sound can travel through it'],
        ['water', 'Sound can travel through it'],
        ['a steel railway line', 'Sound can travel through it'],
        ['a wooden table', 'Sound can travel through it'],
        ['the vacuum of space', 'Sound cannot travel through it'],
        ['a sealed jar with all the air pumped out', 'Sound cannot travel through it'],
      ],
      ask: (x) => `Can sound travel through ${x}?`,
      hint: 'Sound needs particles to pass on the vibrations.',
      means: MEDIUM_MEANS,
      lv: [1, 3],
    },
  ],
  mcqs: [
    {
      q: 'An electric bell rings inside a glass jar. As the air is pumped out of the jar, what happens?',
      a: 'The sound gets quieter, even though you can still see the bell vibrating',
      wrong: [{ label: 'The sound gets louder', misconception: 'vacuum-louder', feedback: 'Fewer particles means the vibrations cannot be passed on as well.' }, 'The bell stops vibrating', 'The sound stays the same'],
      hint: 'Sound needs a medium (particles) to travel through.',
      why: 'Sound needs particles to carry the vibrations. With less and less air, less sound reaches the glass and your ears. Light does not need particles, so you can still see the bell.',
      lv: [2, 4],
    },
    {
      q: 'In which of these does sound travel fastest?',
      a: 'Steel',
      wrong: [{ label: 'Air', misconception: 'sound-fastest-air', feedback: 'Sound is slowest in gases, where particles are far apart.' }, 'Water', { label: 'A vacuum', misconception: 'vacuum-sound', feedback: 'Sound cannot travel through a vacuum at all.' }],
      hint: 'Particles that are close together and strongly linked pass vibrations on quickly.',
      why: 'Sound travels fastest in solids, slower in liquids and slowest in gases: roughly 340 m/s in air, about 1500 m/s in water and around 5000 m/s or more in steel.',
      lv: [2, 4],
    },
    {
      q: 'In a thunderstorm, why do you see the lightning before you hear the thunder?',
      a: 'Light travels much faster than sound',
      wrong: [{ label: 'The lightning happens first and the thunder later', misconception: 'thunder-later', feedback: 'They happen at the same moment. The sound just takes longer to reach you.' }, 'Sound travels faster than light', 'Your eyes work faster than your ears'],
      hint: 'Compare 300,000 km/s with about 340 m/s.',
      why: 'Lightning and thunder happen together, but light (300,000 km/s) reaches you almost instantly, while sound in air (about 340 m/s) takes about 3 seconds per kilometre.',
      lv: [1, 3],
    },
    {
      q: 'What kind of wave is sound?',
      a: 'Longitudinal',
      wrong: [{ label: 'Transverse', misconception: 'sound-transverse', feedback: 'In sound the particles vibrate backwards and forwards along the direction the sound travels.' }, 'Electromagnetic', 'It is not a wave'],
      hint: 'Think of a slinky pushed and pulled along its length.',
      why: 'Sound is a longitudinal wave: particles vibrate along the direction the wave travels, making areas squashed together (compressions) and spread out (rarefactions).',
      lv: [2, 4],
    },
    {
      q: 'Why is space silent, even when stars explode?',
      a: 'Space is a vacuum, so there are no particles to carry sound',
      wrong: [{ label: 'It is too cold for sound', misconception: 'cold-no-sound', feedback: 'Temperature is not the reason: sound needs particles.' }, 'Sound is too slow to cross space', 'Stars do not make vibrations'],
      hint: 'What does sound need to travel?',
      why: 'Sound is passed on by vibrating particles. Space is (almost) a vacuum, so there is nothing to pass the vibrations on.',
      lv: [1, 3],
    },
  ],
}

const thunder = G('phys.waves.sound.thunder', 'phys.waves.sound', [2, 5], (rng, d) => {
  if (d <= 3) {
    const t = rng.pick([2, 3, 4, 5, 6, 1.5, 2.5])
    const dist = round(340 * t)
    return num({
      prompt: `You see a flash of lightning and hear the thunder ${fmt(t)} s later. Sound travels at 340 m/s in air. How far away was the lightning? Give your answer in metres. (Light arrives almost instantly.)`,
      answer: dist,
      suffix: 'm',
      hint: 'Distance = speed × time.',
      explanation: `Distance = 340 m/s × ${fmt(t)} s = ${fmt(dist)} m.`,
      errors: [err(round(340 / t, 6), 'divided', 'Distance = speed × time.')],
    })
  }
  if (d === 4) {
    const t = rng.pick([2, 3, 4, 5, 6, 0.5, 1.5])
    const dist = round(340 * t)
    return num({
      prompt: `A starting pistol is fired ${fmt(dist)} m away from a timekeeper. Sound travels at 340 m/s in air. How long does the sound take to reach the timekeeper? Give your answer in seconds.`,
      answer: t,
      suffix: 's',
      hint: 'Time = distance ÷ speed.',
      explanation: `Time = ${fmt(dist)} m ÷ 340 m/s = ${fmt(t)} s. (This is why timekeepers start their watches on the flash, not the bang.)`,
      errors: [err(dist * 340, 'multiplied', 'Time = distance ÷ speed.')],
    })
  }
  const med = rng.pick([
    ['water', 1500],
    ['steel', 5000],
  ] as [string, number][])
  const t = rng.pick([0.2, 0.4, 0.5, 1, 2])
  const dist = round(med[1] * t)
  return num({
    prompt: `Sound takes ${fmt(t)} s to travel ${fmt(dist)} m through ${med[0]}. What is the speed of sound in ${med[0]}? Give your answer in m/s.`,
    answer: med[1],
    suffix: 'm/s',
    hint: 'Speed = distance ÷ time.',
    explanation: `Speed = ${fmt(dist)} m ÷ ${fmt(t)} s = ${fmt(med[1])} m/s. That is much faster than the roughly 340 m/s in air, because the particles are much closer together.`,
    errors: [err(round(dist * t, 6), 'multiplied', 'Speed = distance ÷ time.')],
  })
})

// =====================================================================================================================
// Hearing, pitch and loudness
// =====================================================================================================================

const hearingBank: Bank = {
  skill: 'phys.waves.hearing',
  orders: [
    {
      prompt: 'Put the parts of the ear in the order that sound passes through them.',
      steps: ['Outer ear (pinna)', 'Ear canal', 'Eardrum', 'Small bones (ossicles)', 'Cochlea', 'Auditory nerve', 'Brain'],
      direction: ['first', 'last'],
      hint: 'Outside to inside, then off to the brain.',
      why: 'The outer ear funnels sound down the ear canal to the eardrum, which vibrates. The tiny bones pass the vibrations to the cochlea, where hair cells turn them into electrical signals sent along the auditory nerve to the brain.',
      lv: [2, 4],
    },
  ],
  links: [
    {
      prompt: 'Match each part of the ear to its job.',
      pairs: [
        ['Outer ear (pinna)', 'Collects sound and funnels it into the ear canal'],
        ['Eardrum', 'A thin membrane that vibrates when sound hits it'],
        ['Small bones (ossicles)', 'Pass the vibrations on and make them bigger'],
        ['Cochlea', 'Contains tiny hairs that turn vibrations into electrical signals'],
        ['Auditory nerve', 'Carries electrical signals to the brain'],
      ],
      hint: 'Follow the sound from outside to the brain.',
      ask: (p) => `What is the job of the ${p.replace(/ \(.*\)/, '').toLowerCase()}?`,
      lv: [1, 4],
    },
  ],
  mcqs: [
    {
      q: 'What property of a sound wave decides its pitch?',
      a: 'Its frequency',
      wrong: [{ label: 'Its amplitude', misconception: 'pitch-amplitude', feedback: 'Amplitude decides loudness. Pitch depends on frequency.' }, 'Its speed', 'The material it travels through'],
      hint: 'A high note vibrates many times each second.',
      why: 'Pitch depends on frequency: a higher frequency (more vibrations per second) gives a higher-pitched sound.',
      lv: [1, 3],
    },
    {
      q: 'What property of a sound wave decides how loud it is?',
      a: 'Its amplitude',
      wrong: [{ label: 'Its frequency', misconception: 'loudness-frequency', feedback: 'Frequency decides pitch. Loudness depends on amplitude.' }, 'Its wavelength', 'Its speed'],
      hint: 'Hitting a drum harder makes it vibrate further.',
      why: 'A bigger amplitude (bigger vibrations) carries more energy and sounds louder.',
      lv: [1, 3],
    },
    {
      q: 'What is the approximate range of frequencies a healthy young person can hear?',
      a: '20 Hz to 20,000 Hz',
      wrong: [{ label: '2 Hz to 200 Hz', misconception: 'range-too-low', feedback: 'That is far too narrow: most music goes well above 200 Hz.' }, '200 Hz to 2,000,000 Hz', '0 Hz to 100 Hz'],
      hint: 'The top end is in the tens of thousands of hertz.',
      why: 'Young people can typically hear about 20 Hz to 20,000 Hz. The upper limit usually falls with age.',
      lv: [2, 4],
    },
    {
      q: 'What is ultrasound?',
      a: 'Sound with a frequency too high for humans to hear (above about 20,000 Hz)',
      wrong: [{ label: 'Sound that is too loud for humans to hear', misconception: 'ultra-loud', feedback: '"Ultra" here means beyond our pitch range, not loudness.' }, 'Sound that travels faster than light', 'Sound too low for humans to hear'],
      hint: '"Ultra" means beyond.',
      why: 'Ultrasound is sound above the human hearing range (above about 20,000 Hz). Bats and dolphins use it, and hospitals use it for scans.',
      lv: [2, 4],
    },
    {
      q: 'Which unit is used to measure how loud a sound is?',
      a: 'decibel (dB)',
      wrong: [{ label: 'hertz (Hz)', misconception: 'loudness-hertz', feedback: 'Hertz measure frequency (pitch).' }, 'newton (N)', 'metre (m)'],
      hint: 'It is used on noise meters.',
      why: 'Sound level is measured in decibels. Long exposure to loud sounds (roughly 85 dB and above) can damage hearing.',
      lv: [1, 3],
    },
    {
      q: 'Why can listening to very loud music for long periods damage your hearing?',
      a: 'Large vibrations can damage the eardrum or the tiny hair cells in the cochlea',
      wrong: [{ label: 'The sound waves wear away the ear canal', misconception: 'sound-wears-canal', feedback: 'The damage is deeper inside, to the delicate parts that detect vibrations.' }, 'Loud sounds make the ear bones grow', 'High pitch blocks the auditory nerve'],
      hint: 'Which parts of the ear are most delicate?',
      why: 'Very loud sounds carry a lot of energy. They can damage the hair cells in the cochlea (which do not grow back) or even burst the eardrum.',
      lv: [3, 5],
    },
    {
      q: 'Which of these animals can hear higher-pitched sounds than humans?',
      a: 'Dogs',
      wrong: ['Goldfish', 'Elephants', 'Snakes'],
      hint: 'Some whistles can be heard by this animal but not by people.',
      why: 'Dogs can hear frequencies well above 20,000 Hz, which is why "silent" dog whistles work. Elephants are known for using very low (infrasound) frequencies.',
      lv: [2, 4],
    },
  ],
}

const traces = G('phys.waves.hearing.trace', 'phys.waves.hearing', [2, 5], (rng) => {
  const amp = rng.pick(['taller', 'shorter', 'the same height'] as const)
  const cnt = rng.pick(amp === 'the same height' ? (['more', 'fewer'] as const) : (['more', 'fewer', 'the same number of'] as const))
  const loud = amp === 'taller' ? 'louder' : amp === 'shorter' ? 'quieter' : 'the same loudness'
  const pitch = cnt === 'more' ? 'higher pitched' : cnt === 'fewer' ? 'lower pitched' : 'the same pitch'
  const describe = (l: string, p: string) => `Sound B is ${l} and ${p}`
  const correct = describe(loud, pitch)
  const louds = ['louder', 'quieter', 'the same loudness']
  const pitches = ['higher pitched', 'lower pitched', 'the same pitch']
  const swapped = describe(cnt === 'more' ? 'louder' : cnt === 'fewer' ? 'quieter' : 'the same loudness', amp === 'taller' ? 'higher pitched' : amp === 'shorter' ? 'lower pitched' : 'the same pitch')
  const pool = louds.flatMap((l) => pitches.map((p) => describe(l, p))).filter((x) => x !== correct && x !== swapped && x !== describe('the same loudness', 'the same pitch'))
  const wrong = [
    ...(swapped !== correct ? [{ label: swapped, misconception: 'swapped-pitch-loudness', feedback: 'Height (amplitude) shows loudness; how many waves fit on the screen (frequency) shows pitch.' }] : []),
    ...rng.shuffle(pool).slice(0, swapped !== correct ? 2 : 3),
  ]
  return choice({
    rng,
    prompt: `Two sounds are shown on an oscilloscope screen with the same settings. Compared with sound A, the waves of sound B are ${amp} and there are ${cnt} waves across the screen. Which describes sound B?`,
    correct,
    wrong,
    hint: 'The height of the wave shows the amplitude. The number of waves across the screen shows the frequency.',
    explanation: `Taller waves mean a bigger amplitude, so a louder sound; more waves on the screen mean a higher frequency, so a higher pitch. Sound B: ${amp} waves, so ${loud}; ${cnt} waves, so ${pitch}.`,
  })
})

const audible = G('phys.waves.hearing.range', 'phys.waves.hearing', [2, 4], (rng, d) => {
  const ok = rng.pick([100, 250, 440, 1000, 2000, 5000, 8000, 12000])
  const tooLow = rng.pick([2, 5, 8])
  const tooHigh = rng.pick([30000, 40000, 50000, 100000])
  const askUltra = d >= 3 && rng.chance(0.5)
  if (askUltra) {
    return choice({
      rng,
      prompt: 'Which of these frequencies is ultrasound?',
      correct: `${fmt(tooHigh)} Hz`,
      wrong: [`${fmt(ok)} Hz`, { label: `${tooLow} Hz`, misconception: 'infra-ultra', feedback: 'That is below our hearing range: infrasound, not ultrasound.' }, '15,000 Hz'],
      hint: 'Ultrasound is above the top of the human hearing range, about 20,000 Hz.',
      explanation: `Humans hear roughly 20 Hz to 20,000 Hz. ${fmt(tooHigh)} Hz is above that, so it is ultrasound. ${tooLow} Hz is below the range (infrasound).`,
    })
  }
  return choice({
    rng,
    prompt: 'Which of these sounds could a healthy young person hear?',
    correct: `${fmt(ok)} Hz`,
    wrong: [
      { label: `${tooLow} Hz`, misconception: 'below-range', feedback: 'That is below about 20 Hz, too low for humans to hear.' },
      { label: `${fmt(tooHigh)} Hz`, misconception: 'above-range', feedback: 'That is above about 20,000 Hz: ultrasound.' },
      `${fmt(tooHigh * 2)} Hz`,
    ],
    hint: 'The human hearing range is roughly 20 Hz to 20,000 Hz.',
    explanation: `${fmt(ok)} Hz is inside the human range of about 20 Hz to 20,000 Hz. The others are too low (infrasound) or too high (ultrasound).`,
  })
})

// =====================================================================================================================
// Echoes
// =====================================================================================================================

const echo = G('phys.waves.echoes.calc', 'phys.waves.echoes', [1, 5], (rng, d) => {
  const t = rng.pick([0.5, 1, 1.5, 2, 3, 4])
  if (d <= 2) {
    return num({
      prompt: `A girl shouts and hears an echo from a cliff ${fmt(t)} s later. Sound travels at 340 m/s. How far does the sound travel altogether (there and back)? Give your answer in metres.`,
      answer: round(340 * t),
      suffix: 'm',
      hint: 'Distance = speed × time.',
      explanation: `Total distance = 340 × ${fmt(t)} = ${fmt(340 * t)} m (to the cliff and back).`,
      errors: [err(round(170 * t, 6), 'halved-too-soon', 'The question asks for the TOTAL distance there and back, so do not halve it.')],
    })
  }
  if (d === 3) {
    return num({
      prompt: `A girl shouts and hears an echo from a cliff ${fmt(t)} s later. Sound travels at 340 m/s. How far away is the cliff? Give your answer in metres.`,
      answer: round(170 * t),
      suffix: 'm',
      hint: 'The sound goes to the cliff AND back. Find the total distance, then halve it.',
      explanation: `Total distance = 340 × ${fmt(t)} = ${fmt(340 * t)} m. The cliff is half of that away: ${fmt(170 * t)} m.`,
      errors: [err(round(340 * t, 6), 'forgot-halve', 'That is the distance there AND back. Halve it to get the distance to the cliff.')],
    })
  }
  if (d === 4) {
    const dist = rng.pick([85, 170, 255, 340, 510, 680])
    const time = round((2 * dist) / 340)
    return num({
      prompt: `A boy stands ${dist} m from a large wall and claps. Sound travels at 340 m/s. How long after the clap does he hear the echo? Give your answer in seconds.`,
      answer: time,
      suffix: 's',
      hint: 'The sound has to go to the wall and back: twice the distance.',
      explanation: `Total distance = 2 × ${dist} = ${2 * dist} m. Time = ${2 * dist} ÷ 340 = ${fmt(time)} s.`,
      errors: [err(round(dist / 340, 6), 'one-way', 'The echo has to travel there AND back.')],
    })
  }
  const depthT = rng.pick([0.2, 0.4, 0.6, 1, 2, 4])
  return num({
    prompt: `A ship sends an ultrasound pulse straight down. The echo from the sea bed returns ${fmt(depthT)} s later. Sound travels at 1500 m/s in sea water. How deep is the sea there? Give your answer in metres.`,
    answer: round((1500 * depthT) / 2),
    suffix: 'm',
    hint: 'Distance = speed × time, then halve it because the pulse goes down and back up.',
    explanation: `Total distance = 1500 × ${fmt(depthT)} = ${fmt(1500 * depthT)} m. Depth = half of that = ${fmt((1500 * depthT) / 2)} m.`,
    errors: [err(round(1500 * depthT, 6), 'forgot-halve', 'The pulse travels down AND back up. Halve the total.'), err(round(340 * depthT * 0.5, 6), 'air-speed', 'Use the speed of sound in water (1500 m/s), not in air.')],
  })
})

const echoBank: Bank = {
  skill: 'phys.waves.echoes',
  mcqs: [
    {
      q: 'What is an echo?',
      a: 'A sound reflected off a surface back to the listener',
      wrong: [{ label: 'A sound absorbed by a surface', misconception: 'echo-absorbed', feedback: 'Absorbed sound does not come back. Echoes are reflections.' }, 'A sound that gets louder as it travels', 'A sound that travels through a vacuum'],
      hint: 'Think of shouting at a cliff.',
      why: 'An echo is a reflected sound. You hear it a short time after the original because the sound has to travel to the surface and back.',
      lv: [1, 3],
    },
    {
      q: 'Which surface gives the strongest echo?',
      a: 'A hard, smooth wall',
      wrong: [{ label: 'A thick curtain', misconception: 'soft-reflects', feedback: 'Soft materials absorb sound rather than reflecting it.' }, 'A carpet', 'A foam pad'],
      hint: 'Soft materials soak up sound.',
      why: 'Hard, smooth surfaces reflect sound well. Soft, uneven materials like curtains, carpets and foam absorb sound, which is why they are used to make rooms quieter.',
      lv: [1, 3],
    },
    {
      q: 'Why do recording studios and cinemas have soft panels on their walls?',
      a: 'To absorb sound and reduce echoes',
      wrong: [{ label: 'To reflect sound and make it louder', misconception: 'soft-reflects', feedback: 'Soft panels absorb sound; they cut down echoes.' }, 'To keep the room warm', 'To make sound travel faster'],
      hint: 'What do soft materials do to sound?',
      why: 'Soft materials absorb sound, so fewer reflections (echoes) bounce around the room and the sound is clearer.',
      lv: [2, 4],
    },
    {
      q: 'Which of these does NOT use echoes of ultrasound?',
      a: 'A microphone recording a song',
      wrong: ['A bat finding insects in the dark', 'A ship measuring the depth of the sea (sonar)', 'A hospital scan of a baby in the womb'],
      hint: 'Which one just listens, rather than sending out a pulse and timing its return?',
      why: 'Bats, sonar and medical scans all send out ultrasound and detect the reflections. A microphone simply records sound that reaches it.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Describe how you could measure the speed of sound in air using an echo from a large wall. Say what you would measure and how you would calculate the speed.',
      model:
        'Stand a measured distance from a large wall, for example 50 m, measured with a trundle wheel or long tape. Clap and listen for the echo, then clap in time with the echoes and time 20 claps with a stopwatch. Divide by 20 to find the time for one echo. The sound travels to the wall and back, so the distance is 2 × 50 = 100 m. Speed = distance ÷ time.',
      checklist: ['Measures the distance to the wall', 'Times the echo (ideally many claps, then divides)', 'Doubles the distance because the sound goes there and back', 'Uses speed = distance ÷ time'],
      hint: 'You need a distance and a time. Remember the sound goes there and back.',
    },
  ],
}

export const wavesGenerators: ItemGenerator[] = [
  ...bankGenerators(basicsBank),
  waveCalc,
  ...bankGenerators(soundBank),
  thunder,
  ...bankGenerators(hearingBank),
  traces,
  audible,
  echo,
  ...bankGenerators(echoBank),
]
