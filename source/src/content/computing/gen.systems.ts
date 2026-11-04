import type { ItemGenerator } from '@/engine/registry'
import { choice } from '../kit'
import { commas, err, factGenerators, G, num, pickN, type FactSet } from './helpers'

/** "Which category is X?" from a table of examples. */
function classify<C extends string>(id: string, skill: string, levels: [number, number], ask: string, items: [string, C][], cats: C[], why: Record<C, string>, hint: string) {
  return G(id, skill, levels, (rng) => {
    const [thing, c] = rng.pick(items)
    return choice({
      rng,
      prompt: ask.replace('#', thing),
      correct: c,
      wrong: cats.filter((x) => x !== c).map((x) => ({ label: x, misconception: `category-${x.toLowerCase().replace(/[^a-z]+/g, '-')}`, feedback: why[x] })),
      keepOrder: true,
      hint,
      explanation: `${thing.charAt(0).toUpperCase()}${thing.slice(1)}: ${c.toLowerCase()}. ${why[c]}`,
    })
  })
}

/** "Which of these is an X?" one example of the category against three examples of the others. */
function oddOne<C extends string>(id: string, skill: string, levels: [number, number], items: [string, C][], cats: C[], hint: string) {
  return G(id, skill, levels, (rng) => {
    const cat = rng.pick(cats)
    const yes = rng.pick(items.filter(([, c]) => c === cat))
    const no = pickN(rng, items.filter(([, c]) => c !== cat), 3)
    return choice({
      rng,
      prompt: `Which of these is ${/^[AEIOU]/.test(cat) ? 'an' : 'a'} ${cat.toLowerCase()}?`,
      correct: yes[0],
      wrong: no.map(([t, c]) => ({ label: t, feedback: `That is ${/^[AEIOU]/.test(c) ? 'an' : 'a'} ${c.toLowerCase()}.` })),
      hint,
      explanation: `${yes[0]} is ${/^[AEIOU]/.test(cat) ? 'an' : 'a'} ${cat.toLowerCase()}.`,
    })
  })
}

// =====================================================================================================================
// Input, output and storage devices
// =====================================================================================================================

type DevCat = 'Input device' | 'Output device' | 'Storage device'
const DEVICES: [string, DevCat][] = [
  ['a keyboard', 'Input device'],
  ['a mouse', 'Input device'],
  ['a microphone', 'Input device'],
  ['a webcam', 'Input device'],
  ['a scanner', 'Input device'],
  ['a barcode reader', 'Input device'],
  ['a temperature sensor', 'Input device'],
  ['a game controller', 'Input device'],
  ['a monitor', 'Output device'],
  ['a printer', 'Output device'],
  ['speakers', 'Output device'],
  ['headphones', 'Output device'],
  ['a projector', 'Output device'],
  ['a USB flash drive', 'Storage device'],
  ['a hard disk drive', 'Storage device'],
  ['a solid state drive (SSD)', 'Storage device'],
  ['an SD memory card', 'Storage device'],
]
const DEV_WHY: Record<DevCat, string> = {
  'Input device': 'An input device sends data INTO the computer.',
  'Output device': 'An output device presents information FROM the computer to the user.',
  'Storage device': 'A storage device keeps data and programs, even when the power is off.',
}

const devFacts: FactSet = {
  skill: 'hw.devices',
  facts: [
    {
      lv: [2, 4],
      q: 'Why is a touchscreen often described as both an input and an output device?',
      a: 'It displays images and also detects where you touch it',
      wrong: [
        { label: 'It stores files as well as showing them', feedback: 'A touchscreen does not store files.' },
        { label: 'It can be connected with a cable or wirelessly', feedback: 'How it connects is not the reason.' },
        { label: 'Because it contains a CPU', feedback: 'It is about what it does: shows and senses.' },
      ],
      hint: 'What does it do with your finger? What does it do with pictures?',
      exp: 'A touchscreen outputs a display and inputs the position of your touch, so it is both.',
    },
    {
      lv: [3, 5],
      q: 'Which device would best help a user who is blind to hear the text on a web page?',
      a: 'Speakers or headphones with screen-reader software',
      wrong: [
        { label: 'A larger monitor', feedback: 'A user who is blind cannot use a screen at any size.' },
        { label: 'A webcam', feedback: 'A webcam is an input device for video.' },
        { label: 'A scanner', feedback: 'A scanner inputs images of paper documents.' },
      ],
      hint: 'Which output does not rely on sight?',
      exp: 'Screen-reader software reads text aloud, which is output through speakers or headphones.',
    },
    {
      lv: [3, 5],
      q: 'A supermarket checkout needs to enter product details quickly and accurately. Which input device is best?',
      a: 'A barcode reader',
      wrong: [
        { label: 'A keyboard', feedback: 'Typing product codes is slow and causes mistakes.' },
        { label: 'A microphone', feedback: 'Speaking product names would be slow and unreliable.' },
        { label: 'A printer', feedback: 'A printer is an output device.' },
      ],
      hint: 'Every product has a pattern of lines printed on it.',
      exp: 'A barcode reader reads the product number in a fraction of a second with very few errors.',
    },
  ],
}

// =====================================================================================================================
// CPU
// =====================================================================================================================

const cpuFacts: FactSet = {
  skill: 'hw.cpu',
  termNoun: 'part of the CPU',
  terms: [
    { term: 'ALU (arithmetic logic unit)', def: 'Does calculations and logical comparisons', hint: 'The "maths" part.', typed: ['alu', 'arithmetic logic unit'] },
    { term: 'Control unit', def: 'Decodes instructions and sends signals to control the rest of the CPU', hint: 'Like a conductor of an orchestra.', typed: ['cu', 'the control unit'] },
    { term: 'Register', def: 'A tiny, very fast storage location inside the CPU for one value being worked on', hint: 'The smallest and fastest memory of all.', typed: ['registers'] },
    { term: 'Cache', def: 'A small amount of very fast memory in or near the CPU that holds frequently used data and instructions', hint: 'Pronounced "cash".', typed: ['cache memory'] },
    { term: 'Clock', def: 'Sends out regular pulses that keep the CPU\'s operations in time', hint: 'It "ticks" billions of times a second.', typed: ['system clock'] },
    { term: 'Core', def: 'A complete processing unit; a CPU with several of these can work on several instructions at once', hint: 'A "quad" one has four.', typed: ['cores', 'processor core'] },
  ],
  facts: [
    {
      lv: [1, 3],
      q: 'What is the main job of the CPU?',
      a: 'To process data by carrying out the instructions in programs',
      wrong: [
        { label: 'To store files when the computer is switched off', misconception: 'cpu-storage', feedback: 'That is secondary storage.' },
        { label: 'To display images on the screen', feedback: 'That is the monitor (with the graphics card).' },
        { label: 'To connect the computer to the internet', feedback: 'That is the network interface card.' },
      ],
      hint: 'CPU stands for central processing unit.',
      exp: 'The CPU (central processing unit) fetches, decodes and executes program instructions, processing data.',
    },
    {
      lv: [2, 4],
      q: 'A CPU has a clock speed of 3 GHz. What does this mean?',
      a: 'Its clock ticks about 3 billion times a second',
      wrong: [
        { label: 'It can store 3 GB of data', misconception: 'ghz-as-gb', feedback: 'GHz measures speed (cycles per second), not storage.' },
        { label: 'It has 3 cores', feedback: 'The number of cores is separate from clock speed.' },
        { label: 'It runs at 3 degrees above room temperature', feedback: 'GHz is not a temperature.' },
      ],
      hint: 'Giga means a billion; hertz means "per second".',
      exp: '1 GHz is 1 billion cycles per second, so 3 GHz is 3 billion. Roughly, more cycles per second means more instructions per second.',
    },
    {
      lv: [3, 5],
      q: 'Why does a larger cache usually make a computer faster?',
      a: 'More frequently used data can be kept close to the CPU, so it waits less for slower RAM',
      wrong: [
        { label: 'The cache is where files are saved permanently', misconception: 'cache-storage', feedback: 'Cache is temporary, like RAM.' },
        { label: 'A larger cache increases the clock speed', feedback: 'Clock speed is separate.' },
        { label: 'The cache adds extra cores', feedback: 'Cache is memory, not processing units.' },
      ],
      hint: 'Cache is faster than RAM.',
      exp: 'Fetching from cache is much quicker than from RAM. A bigger cache means more of what the CPU needs is close by.',
    },
    {
      lv: [3, 5],
      q: 'A computer\'s CPU is upgraded from 2 cores to 4 cores. Why might some programs NOT run twice as fast?',
      a: 'Some programs cannot be split up to run on several cores at once',
      wrong: [
        { label: 'Extra cores slow down the clock speed to zero', feedback: 'Cores do not stop the clock.' },
        { label: 'Cores only work when the internet is connected', feedback: 'Cores have nothing to do with the internet.' },
        { label: 'Four cores take up all the RAM', feedback: 'Cores are processing units, not memory users.' },
      ],
      hint: 'Can every job be shared between four people?',
      exp: 'Extra cores help when work can be split into parts that run at the same time. If a program has to do one step after another, the extra cores sit idle.',
    },
  ],
}

const clockCalc = G('hw.cpu.clock', 'hw.cpu', [2, 5], (rng, d) => {
  if (d >= 4) {
    const ghz = rng.pick([2, 3, 4])
    const cores = rng.pick([2, 4, 8])
    const total = ghz * cores
    return num({
      prompt: `A CPU has ${cores} cores, each running at ${ghz} GHz. If every core completes one instruction per clock cycle, how many billion instructions can the whole CPU complete per second?`,
      answer: total,
      suffix: 'billion',
      hint: 'Work out one core first, then all of them.',
      explanation: `One core: ${ghz} billion per second. ${cores} cores: ${ghz} × ${cores} = ${total} billion. (Real programs rarely reach this, as not all work can be shared.)`,
      errors: [err(ghz, 'one-core', 'That is for one core. All the cores can work at the same time.')],
    })
  }
  const ghz = rng.pick([1.5, 2, 2.5, 3, 3.2, 4])
  return num({
    prompt: `A CPU runs at ${ghz} GHz. How many clock cycles is that per second? (1 GHz = 1,000,000,000 cycles per second.)`,
    answer: ghz * 1e9,
    tolerance: 0.5,
    suffix: 'cycles',
    hint: 'Multiply by one billion.',
    explanation: `${ghz} × 1,000,000,000 = ${commas(ghz * 1e9)} cycles per second.`,
    errors: [err(ghz * 1e6, 'mega', 'Giga is a billion, not a million.')],
  })
})

// =====================================================================================================================
// Memory
// =====================================================================================================================

const memFacts: FactSet = {
  skill: 'hw.memory',
  termNoun: 'term',
  terms: [
    { term: 'RAM', def: 'Memory that holds the programs and data currently in use; its contents are lost when the power is off', hint: 'Random access memory.', typed: ['random access memory'] },
    { term: 'ROM', def: 'Memory that holds the start-up instructions; its contents cannot normally be changed and are kept when the power is off', hint: 'Read-only memory.', typed: ['read only memory', 'read-only memory'] },
    { term: 'Volatile', def: 'Describes memory that loses its contents when the power is switched off', hint: 'Something that does not last.' },
    { term: 'Non-volatile', def: 'Describes memory or storage that keeps its contents without power', hint: 'The opposite of volatile.', typed: ['nonvolatile', 'non volatile'] },
    { term: 'Virtual memory', def: 'Part of secondary storage used as if it were RAM when RAM is full', hint: 'Not real RAM, but acting like it.' },
  ],
  facts: [
    {
      lv: [1, 3],
      q: 'You are writing an essay and the power suddenly goes off before you have saved it. Why is the work lost?',
      a: 'It was only in RAM, which is volatile',
      wrong: [
        { label: 'It was stored in ROM, which cannot be changed', misconception: 'rom-user-data', feedback: 'Your work is never stored in ROM.' },
        { label: 'The hard drive wipes itself when the power goes off', misconception: 'storage-volatile', feedback: 'Secondary storage is non-volatile: saved files survive.' },
        { label: 'The CPU deleted it to save space', feedback: 'The CPU does not delete your work.' },
      ],
      hint: 'Where is a document kept while you are working on it?',
      exp: 'Open documents are held in RAM, which loses its contents without power. Saving copies them to secondary storage, which is non-volatile.',
    },
    {
      lv: [2, 4],
      q: 'Why does a computer need ROM?',
      a: 'To store the start-up (boot) instructions that run when the computer is switched on',
      wrong: [
        { label: 'To store the user\'s documents and photos', misconception: 'rom-user-data', feedback: 'Documents are saved on secondary storage.' },
        { label: 'To hold the programs that are currently running', misconception: 'rom-as-ram', feedback: 'That is RAM.' },
        { label: 'To speed up the internet connection', feedback: 'ROM has nothing to do with the internet.' },
      ],
      hint: 'When the power comes on, RAM is empty. Where do the first instructions come from?',
      exp: 'RAM is empty at switch-on. ROM keeps the boot instructions without power, so the computer can start up and load the operating system.',
    },
    {
      lv: [3, 5],
      q: 'A computer with too little RAM becomes slow when many programs are open. Why?',
      a: 'It has to use virtual memory on secondary storage, which is much slower than RAM',
      wrong: [
        { label: 'The ROM fills up with programs', misconception: 'rom-as-ram', feedback: 'Programs are not loaded into ROM.' },
        { label: 'The CPU clock speed is halved', feedback: 'RAM does not change the clock speed.' },
        { label: 'The programs are deleted from the hard drive', feedback: 'Nothing is deleted.' },
      ],
      hint: 'Where does the data go when RAM is full?',
      exp: 'When RAM is full, the operating system moves data to virtual memory on the hard drive or SSD. Moving data back and forth is slow.',
    },
  ],
  written: [
    {
      q: 'Explain the differences between RAM and ROM.',
      model: 'RAM holds the programs and data that are currently being used, such as an open document. It is volatile, so its contents are lost when the power is turned off, and its contents change all the time. ROM holds the start-up instructions the computer needs when it is switched on. It is non-volatile, so it keeps its contents without power, and it cannot normally be changed.',
      checklist: ['Says RAM holds programs and data in use', 'Says RAM is volatile (lost without power)', 'Says ROM holds start-up/boot instructions', 'Says ROM is non-volatile', 'Says RAM can be changed but ROM normally cannot'],
      passMark: 3,
    },
  ],
}

// =====================================================================================================================
// Secondary storage
// =====================================================================================================================

type StoreCat = 'Magnetic' | 'Optical' | 'Solid state'
const STORES: [string, StoreCat][] = [
  ['a hard disk drive (HDD)', 'Magnetic'],
  ['a backup tape cartridge', 'Magnetic'],
  ['a DVD', 'Optical'],
  ['a CD', 'Optical'],
  ['a Blu-ray disc', 'Optical'],
  ['a solid state drive (SSD)', 'Solid state'],
  ['a USB memory stick', 'Solid state'],
  ['an SD card in a camera', 'Solid state'],
]
const STORE_WHY: Record<StoreCat, string> = {
  Magnetic: 'Magnetic storage records data as tiny magnetised areas on a surface (a disk or tape).',
  Optical: 'Optical storage uses a laser to read pits and flat areas on a disc.',
  'Solid state': 'Solid state storage uses electronic flash memory chips with no moving parts.',
}

const storeFacts: FactSet = {
  skill: 'hw.storage',
  facts: [
    {
      lv: [1, 3],
      q: 'Why does a computer need secondary storage as well as RAM?',
      a: 'Secondary storage keeps files and programs when the power is off',
      wrong: [
        { label: 'Secondary storage is faster than RAM', misconception: 'storage-faster', feedback: 'RAM is much faster. Secondary storage is used because it is non-volatile and cheaper per GB.' },
        { label: 'RAM can only hold numbers', feedback: 'RAM can hold any data.' },
        { label: 'The CPU cannot read from RAM', feedback: 'The CPU reads from RAM all the time.' },
      ],
      hint: 'What happens to RAM when the computer is switched off?',
      exp: 'RAM is volatile. Secondary storage (HDD, SSD and so on) is non-volatile, so files survive until next time.',
    },
    {
      lv: [2, 4],
      q: 'Why is solid-state (flash) storage used in most laptops and phones rather than hard disk drives?',
      a: 'It has no moving parts, so it is tougher, faster and uses less power',
      wrong: [
        { label: 'It holds far more data for the same price', misconception: 'ssd-cheaper', feedback: 'Hard disk drives are usually cheaper per GB.' },
        { label: 'It uses a laser, which is more accurate', feedback: 'That is optical storage.' },
        { label: 'It loses its data when switched off, which keeps data private', misconception: 'storage-volatile', feedback: 'Solid-state storage is non-volatile.' },
      ],
      hint: 'Laptops and phones get carried around and dropped.',
      exp: 'Solid state storage has no moving parts, so it survives knocks, reads data quickly and saves battery.',
    },
    {
      lv: [3, 5],
      q: 'A company needs to store a huge amount of video as cheaply as possible on a computer that never moves. Which is most suitable?',
      a: 'Hard disk drives',
      wrong: [
        { label: 'SD cards', feedback: 'SD cards are small and cost more per GB.' },
        { label: 'DVDs', feedback: 'Each DVD holds only a few GB; you would need thousands.' },
        { label: 'RAM', misconception: 'ram-storage', feedback: 'RAM is volatile and expensive per GB.' },
      ],
      hint: 'Large capacity and low cost per GB; durability matters less if it never moves.',
      exp: 'Hard disk drives give very large capacity at low cost per GB. Their moving parts are not a problem for a computer that stays in one place.',
    },
  ],
}

// =====================================================================================================================
// Fetch-decode-execute
// =====================================================================================================================

const fdeFacts: FactSet = {
  skill: 'hw.fde',
  termNoun: 'register',
  terms: [
    { term: 'Program counter (PC)', def: 'Holds the memory address of the next instruction to be fetched', hint: 'It "counts" through the program.', typed: ['program counter', 'pc'] },
    { term: 'Memory address register (MAR)', def: 'Holds the address in memory that is about to be read from or written to', hint: 'Its name contains "address".', typed: ['mar', 'memory address register'] },
    { term: 'Memory data register (MDR)', def: 'Holds the data or instruction that has just been fetched from memory, or is about to be written', hint: 'Its name contains "data".', typed: ['mdr', 'memory data register', 'memory buffer register'] },
    { term: 'Accumulator', def: 'Holds the result of calculations done by the ALU', hint: 'It "accumulates" results.', typed: ['acc'] },
  ],
  facts: [
    {
      lv: [1, 3],
      q: 'What happens in the "decode" stage of the cycle?',
      a: 'The control unit works out what the instruction means',
      wrong: [
        { label: 'The instruction is copied from memory into the CPU', misconception: 'fde-fetch', feedback: 'That is fetch.' },
        { label: 'The instruction is carried out', misconception: 'fde-execute', feedback: 'That is execute.' },
        { label: 'The program is saved to the hard drive', feedback: 'Saving is not part of the cycle.' },
      ],
      hint: 'To decode a message is to work out what it means.',
      exp: 'Fetch: get the instruction from memory. Decode: the control unit works out what it means. Execute: carry it out.',
    },
    {
      lv: [2, 4],
      q: 'Where does the CPU fetch instructions from?',
      a: 'Main memory (RAM)',
      wrong: [
        { label: 'Directly from the keyboard', feedback: 'The keyboard provides input data, not program instructions.' },
        { label: 'From the monitor', feedback: 'The monitor is an output device.' },
        { label: 'Straight from the hard drive every time', misconception: 'fetch-from-storage', feedback: 'Programs are loaded from storage into RAM first, then fetched from there.' },
      ],
      hint: 'Programs are loaded here before they run.',
      exp: 'Programs are copied from secondary storage into RAM. The CPU then fetches each instruction from RAM (often via cache).',
    },
    {
      lv: [3, 5],
      q: 'Why is the program counter increased (incremented) during the fetch stage?',
      a: 'So it holds the address of the next instruction, ready for the next cycle',
      wrong: [
        { label: 'To count how many programs are open', feedback: 'It holds an address, not a count of programs.' },
        { label: 'To make the clock speed faster', feedback: 'The clock speed is fixed by the clock.' },
        { label: 'To store the result of a calculation', misconception: 'pc-as-acc', feedback: 'That is the accumulator.' },
      ],
      hint: 'Instructions are usually stored one after another in memory.',
      exp: 'After the current instruction\'s address has been used, the PC is incremented so it points to the next instruction.',
    },
  ],
  sequences: [
    {
      lv: [1, 3],
      q: 'Put the stages of the CPU\'s cycle in order.',
      steps: ['Fetch the next instruction from memory', 'Decode the instruction in the control unit', 'Execute the instruction', 'Repeat with the next instruction'],
      hint: 'The cycle is named after its stages.',
      exp: 'Fetch, decode, execute, and repeat, billions of times a second.',
    },
    {
      lv: [4, 5],
      q: 'Put these steps of the fetch-decode-execute cycle in order.',
      steps: ['The address in the program counter is copied to the MAR', 'The instruction at that address is copied from memory into the MDR', 'The control unit decodes the instruction', 'The instruction is executed, for example by the ALU'],
      hint: 'The CPU needs the address before it can fetch what is stored there.',
      exp: 'PC → MAR; the instruction is fetched into the MDR (and the PC is incremented to point at the next instruction); the CU decodes it; then it is executed.',
    },
  ],
  written: [
    {
      q: 'Describe what happens during the fetch-decode-execute cycle.',
      model: 'In the fetch stage, the CPU copies the next instruction from main memory (RAM). The program counter holds the address of this instruction and is then increased so it points to the next one. In the decode stage, the control unit works out what the instruction means. In the execute stage, the instruction is carried out, for example the ALU might do a calculation. The cycle then repeats billions of times a second.',
      checklist: ['Fetch: gets the next instruction from memory', 'Decode: the control unit works out what it means', 'Execute: the instruction is carried out', 'Mentions the program counter or that the cycle repeats'],
    },
  ],
}

// =====================================================================================================================
// Embedded systems
// =====================================================================================================================

type EmbCat = 'Embedded system' | 'General-purpose computer'
const EMBEDDED: [string, EmbCat][] = [
  ['A washing machine', 'Embedded system'],
  ['A microwave oven', 'Embedded system'],
  ['A digital central heating thermostat', 'Embedded system'],
  ['A car\'s anti-lock braking system', 'Embedded system'],
  ['A set of traffic lights', 'Embedded system'],
  ['A digital camera', 'Embedded system'],
  ['A fitness tracker', 'Embedded system'],
  ['A laptop', 'General-purpose computer'],
  ['A desktop PC', 'General-purpose computer'],
  ['A school library computer used for many different tasks', 'General-purpose computer'],
]

const embFacts: FactSet = {
  skill: 'hw.embedded',
  facts: [
    {
      lv: [1, 3],
      q: 'What is an embedded system?',
      a: 'A computer built into a larger device to do one dedicated job',
      wrong: [
        { label: 'A computer that can run any program the user installs', misconception: 'embedded-general', feedback: 'That is a general-purpose computer.' },
        { label: 'A program that is stored in the cloud', feedback: 'Embedded systems are physical hardware inside devices.' },
        { label: 'A network of computers in one building', feedback: 'That is a LAN.' },
      ],
      hint: '"Embedded" means built into something.',
      exp: 'An embedded system is a computer system inside another device, such as a washing machine, with one specific job to do.',
    },
    {
      lv: [2, 4],
      q: 'Which is a typical feature of an embedded system?',
      a: 'It is small, uses little power and runs one fixed program',
      wrong: [
        { label: 'It has a large screen and a full keyboard', feedback: 'Most embedded systems have only simple controls, if any.' },
        { label: 'The user can install any apps they like', misconception: 'embedded-general', feedback: 'Embedded systems usually run one fixed program.' },
        { label: 'It needs a very fast multi-core CPU', feedback: 'Most need only a simple, cheap processor.' },
      ],
      hint: 'Think of the computer inside a microwave.',
      exp: 'Embedded systems are designed for one job, so they can be small, cheap and low-power, with their program often stored in ROM or flash memory.',
    },
  ],
  written: [
    {
      q: 'Explain what an embedded system is, using a washing machine as an example.',
      model: 'An embedded system is a computer built inside a larger device to carry out one dedicated task. In a washing machine, it takes inputs from the buttons and from sensors such as the water level and temperature sensors, then controls outputs like the motor, the heater and the water valves to run the chosen wash programme. Unlike a laptop, you cannot install other programs on it.',
      checklist: ['Says it is a computer built into a larger device', 'Says it has one dedicated job', 'Gives inputs or sensors in the washing machine', 'Gives outputs it controls', 'Contrasts it with a general-purpose computer'],
      passMark: 3,
    },
  ],
}

// =====================================================================================================================
// Software
// =====================================================================================================================

type SwCat = 'System software' | 'Application software'
const SOFTWARE: [string, SwCat][] = [
  ['an operating system such as Windows', 'System software'],
  ['anti-malware software', 'System software'],
  ['a device driver for a printer', 'System software'],
  ['backup software', 'System software'],
  ['file compression software', 'System software'],
  ['a word processor', 'Application software'],
  ['a web browser', 'Application software'],
  ['a spreadsheet program', 'Application software'],
  ['a photo-editing app', 'Application software'],
  ['a computer game', 'Application software'],
  ['presentation software', 'Application software'],
]
const SW_WHY: Record<SwCat, string> = {
  'System software': 'System software runs and looks after the computer itself (the operating system and utilities).',
  'Application software': 'Application software lets the user do a task, such as writing, browsing or playing.',
}

const swFacts: FactSet = {
  skill: 'sw.software',
  termNoun: 'type of software',
  terms: [
    { term: 'Operating system', def: 'System software that manages the hardware and lets the user and other programs use the computer', hint: 'Windows, macOS and Android are examples.', typed: ['os'] },
    { term: 'Utility software', def: 'System software that helps maintain or protect the computer, such as backup or anti-malware tools', hint: 'Useful housekeeping tools.', typed: ['utility', 'utilities', 'utility program'] },
    { term: 'Application software', def: 'Software that lets the user carry out a task, such as writing a letter or editing a photo', hint: 'Often called an "app".', typed: ['application', 'applications', 'app', 'apps'] },
    { term: 'Device driver', def: 'Software that lets the operating system communicate with a particular piece of hardware', hint: 'A new printer often needs one installed.', typed: ['driver', 'drivers'] },
    { term: 'Hardware', def: 'The physical parts of a computer system that you can touch', hint: 'The opposite of software.' },
  ],
}

type OsJob = 'Memory management' | 'Process management' | 'File management' | 'User management' | 'Peripheral management' | 'User interface'
const OS_JOBS: [string, OsJob][] = [
  ['It decides which parts of RAM each open program can use', 'Memory management'],
  ['It moves data to virtual memory when RAM is full', 'Memory management'],
  ['It shares the CPU\'s time between several programs so they seem to run at once', 'Process management'],
  ['It lets you create folders, and move, rename and delete files', 'File management'],
  ['It checks your username and password when you log in', 'User management'],
  ['It gives different users different access rights', 'User management'],
  ['It uses drivers to send data to the printer', 'Peripheral management'],
  ['It recognises a USB keyboard when it is plugged in', 'Peripheral management'],
  ['It provides windows, icons and menus so you can control the computer', 'User interface'],
]
const OS_LIST: OsJob[] = ['Memory management', 'Process management', 'File management', 'User management', 'Peripheral management', 'User interface']

const osJob = G('sw.os.job', 'sw.os', [2, 5], (rng) => {
  const [what, job] = rng.pick(OS_JOBS)
  const others = pickN(rng, OS_LIST.filter((x) => x !== job), 3)
  return choice({
    rng,
    prompt: `Which job of the operating system is this? "${what}."`,
    correct: job,
    wrong: others.map((x) => ({ label: x, misconception: 'os-function' })),
    hint: 'Is it about memory, sharing the CPU, files, users, connected devices, or how you control the computer?',
    explanation: `${job}. The operating system manages memory, processes, files, users and peripherals, and provides the user interface.`,
  })
})

const osFacts: FactSet = {
  skill: 'sw.os',
  facts: [
    {
      lv: [1, 3],
      q: 'Which of these is an operating system?',
      a: 'Android',
      wrong: [
        { label: 'Microsoft Word', misconception: 'app-as-os', feedback: 'Word is a word processor: application software.' },
        { label: 'Minecraft', misconception: 'app-as-os', feedback: 'Minecraft is a game: application software.' },
        { label: 'Spotify', misconception: 'app-as-os', feedback: 'Spotify is a music app: application software.' },
      ],
      hint: 'It runs a phone or tablet.',
      exp: 'Android is an operating system. Others include Windows, macOS, Linux and iOS.',
    },
    {
      lv: [2, 4],
      q: 'What is the difference between a graphical user interface (GUI) and a command-line interface?',
      a: 'A GUI uses windows, icons and menus; a command-line interface uses typed commands',
      wrong: [
        { label: 'A GUI is only used on phones; a command line only on laptops', feedback: 'Both kinds are found on many devices.' },
        { label: 'A command-line interface uses pictures; a GUI uses text', feedback: 'It is the other way round.' },
        { label: 'They are two names for the same thing', feedback: 'They are very different ways of controlling a computer.' },
      ],
      hint: '"Graphical" means pictures.',
      exp: 'A GUI lets you point and click on windows, icons and menus. A command-line interface needs you to type exact commands; it is harder to learn but powerful.',
    },
    {
      lv: [3, 5],
      q: 'Why does a computer need an operating system?',
      a: 'To manage the hardware and provide a platform so that applications can run',
      wrong: [
        { label: 'To make documents look nicer', feedback: 'That is what a word processor does.' },
        { label: 'To connect the computer to electricity', feedback: 'That is the power supply.' },
        { label: 'To write programs in Python', feedback: 'That needs a code editor and interpreter, which run on top of the OS.' },
      ],
      hint: 'Without it, every app would have to control the hardware itself.',
      exp: 'The OS manages memory, processes, files, users and devices, and gives applications a common way to use the hardware.',
    },
  ],
}

// =====================================================================================================================
// Languages and translators
// =====================================================================================================================

const transFacts: FactSet = {
  skill: 'sw.translators',
  termNoun: 'term',
  terms: [
    { term: 'High-level language', def: 'A programming language that uses English-like words and is easy for people to read, such as Python', hint: 'Far away ("high above") the hardware.', typed: ['high level language', 'high level'] },
    { term: 'Low-level language', def: 'A language close to the hardware, such as machine code or assembly language', hint: 'Close to the CPU.', typed: ['low level language', 'low level'] },
    { term: 'Machine code', def: 'Binary instructions that the CPU can carry out directly', hint: 'The only thing the CPU actually understands.', typed: ['machine language'] },
    { term: 'Compiler', def: 'Translates a whole high-level program into machine code in one go, making a file that can be run later', hint: 'Translates everything before anything runs.', typed: ['a compiler'] },
    { term: 'Interpreter', def: 'Translates and runs a high-level program one line at a time, stopping at the first error', hint: 'Like a person translating a speech as it happens.', typed: ['an interpreter'] },
    { term: 'Assembler', def: 'Translates assembly language into machine code', hint: 'Its name matches the language it translates.', typed: ['an assembler'] },
  ],
  facts: [
    {
      lv: [2, 4],
      q: 'Why does a program written in a high-level language need to be translated?',
      a: 'The CPU can only carry out machine code (binary instructions)',
      wrong: [
        { label: 'To make it shorter so it fits in RAM', feedback: 'Translation is about the CPU understanding it, not size.' },
        { label: 'To turn it into English', feedback: 'It is already English-like; it needs turning into machine code.' },
        { label: 'To check it has no logic errors', misconception: 'translator-finds-logic', feedback: 'Translators find syntax errors, not logic errors.' },
      ],
      hint: 'What language does the processor actually understand?',
      exp: 'CPUs only execute machine code. A compiler or interpreter translates the high-level code into machine code.',
    },
    {
      lv: [3, 5],
      q: 'A programmer wants to find errors quickly while writing code, running it line by line. Which translator is most helpful?',
      a: 'An interpreter',
      wrong: [
        { label: 'A compiler', misconception: 'compiler-interpreter', feedback: 'A compiler translates the whole program first and reports errors at the end.' },
        { label: 'An assembler', feedback: 'An assembler translates assembly language, not high-level code.' },
        { label: 'A device driver', feedback: 'A driver controls hardware; it is not a translator.' },
      ],
      hint: 'Which one stops at the line where the error is?',
      exp: 'An interpreter runs each line as it translates it and stops at the first error, so problems show up straight away.',
    },
    {
      lv: [3, 5],
      q: 'Why might a company give customers a compiled program rather than the original high-level code?',
      a: 'Customers can run it without a translator, and cannot easily read or copy the code',
      wrong: [
        { label: 'Compiled programs can be edited more easily', feedback: 'Machine code is very hard to edit.' },
        { label: 'Compiled programs never have bugs', feedback: 'Compiling does not remove logic errors.' },
        { label: 'Compiled programs run on every type of CPU', feedback: 'Machine code is made for a particular type of processor.' },
      ],
      hint: 'What does the customer receive: readable code or an executable file?',
      exp: 'A compiler makes an executable file. It runs without the compiler, and the original code stays private.',
    },
  ],
}

// =====================================================================================================================

export const systemsGenerators: ItemGenerator[] = [
  classify('hw.devices.classify', 'hw.devices', [1, 4], 'Is # an input device, an output device or a storage device?', DEVICES, ['Input device', 'Output device', 'Storage device'], DEV_WHY, 'Does data go into the computer, come out of it, or get kept?'),
  oddOne('hw.devices.which', 'hw.devices', [1, 3], DEVICES, ['Input device', 'Output device', 'Storage device'], 'Think about the direction the data travels.'),
  ...factGenerators(devFacts),
  ...factGenerators(cpuFacts),
  clockCalc,
  ...factGenerators(memFacts),
  classify('hw.storage.classify', 'hw.storage', [1, 4], 'What type of storage is #?', STORES, ['Magnetic', 'Optical', 'Solid state'], STORE_WHY, 'Does it use magnets, a laser, or flash memory chips?'),
  ...factGenerators(storeFacts),
  ...factGenerators(fdeFacts),
  classify('hw.embedded.classify', 'hw.embedded', [1, 4], '# - is this an embedded system or a general-purpose computer?', EMBEDDED, ['Embedded system', 'General-purpose computer'], { 'Embedded system': 'It is built into a device to do one dedicated job.', 'General-purpose computer': 'It can run many different programs for many different tasks.' }, 'Does it do one dedicated job, or can it run any program?'),
  ...factGenerators(embFacts),
  classify('sw.software.classify', 'sw.software', [1, 4], 'Is # system software or application software?', SOFTWARE, ['System software', 'Application software'], SW_WHY, 'Does it look after the computer, or help the user do a task?'),
  ...factGenerators(swFacts),
  osJob,
  ...factGenerators(osFacts),
  ...factGenerators(transFacts),
]
