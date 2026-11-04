import type { Skill } from '@/engine/types'

/**
 * Computer Studies (KS3 Computing, England national curriculum, Years 7-9). Ids are permanent: progress is stored
 * against them. Prerequisites answer "if she gets this wrong, which earlier idea is the likely reason?".
 */

const S = (id: string, year: number, strand: string, name: string, description: string, prereqs: string[], origin: Skill['origin'] = 'syllabus'): Skill => ({
  id: `computing.${id}`,
  subject: 'computing',
  year,
  strand,
  name,
  description,
  prereqs: prereqs.map((p) => `computing.${p}`),
  origin,
})

const CT = 'Computational thinking'
const ALG = 'Algorithms'
const PROG = 'Programming'
const DATA = 'Data representation'
const LOGIC = 'Boolean logic'
const HW = 'Hardware'
const SW = 'Software'
const NET = 'Networks'
const CYBER = 'Cyber security'
const WEB = 'Web'

export const computingSkills: Skill[] = [
  // ------------------------------------------------------------- foundations (primary school building blocks)
  S('ct.instructions', 6, CT, 'Algorithms as precise instructions', 'An algorithm is a precise, ordered set of steps; the order matters and computers follow instructions exactly.', [], 'foundation'),
  S('data.powers-of-two', 6, DATA, 'Doubling and powers of 2', 'Doubling from 1 to 256, and using powers of 2.', [], 'foundation'),

  // ------------------------------------------------------------- computational thinking
  S('ct.decomposition', 7, CT, 'Decomposition', 'Break a problem down into smaller, more manageable parts.', ['ct.instructions']),
  S('ct.abstraction', 7, CT, 'Abstraction', 'Remove unnecessary detail and focus on what matters for solving the problem.', ['ct.decomposition']),
  S('ct.patterns', 7, CT, 'Pattern recognition', 'Spot similarities and repeated steps, and reuse solutions.', ['ct.decomposition']),
  S('ct.constructs', 7, CT, 'Sequence, selection and iteration', 'Recognise the three basic building blocks of algorithms and programs.', ['ct.instructions']),
  S('ct.flowchart-symbols', 7, CT, 'Flowchart symbols', 'Know the standard flowchart symbols: terminator, process, input/output, decision, flow line.', ['ct.constructs']),
  S('ct.flowchart-trace', 7, CT, 'Following flowcharts', 'Follow a flowchart with given inputs to find its output, including decisions and loops.', ['ct.flowchart-symbols']),
  S('ct.pseudocode', 8, CT, 'Pseudocode', 'Read and trace algorithms written in pseudocode.', ['ct.flowchart-trace', 'prog.variables']),

  // ------------------------------------------------------------- algorithms
  S('alg.linear-search', 8, ALG, 'Linear search', 'Search a list by checking each item in turn; count the comparisons.', ['ct.constructs']),
  S('alg.binary-search', 8, ALG, 'Binary search', 'Search a sorted list by repeatedly checking the middle item and discarding half.', ['alg.linear-search', 'data.powers-of-two']),
  S('alg.bubble-sort', 8, ALG, 'Bubble sort', 'Sort by comparing neighbouring items and swapping them; passes, comparisons and swaps.', ['ct.constructs']),
  S('alg.insertion-sort', 8, ALG, 'Insertion sort', 'Sort by taking each item in turn and inserting it into the right place in the sorted part.', ['alg.bubble-sort']),
  S('alg.merge-sort', 9, ALG, 'Merge sort', 'Split a list into single items, then merge sorted lists back together.', ['alg.insertion-sort']),

  // ------------------------------------------------------------- programming (Python)
  S('prog.print', 7, PROG, 'Output and sequence', 'Use print to output text and numbers; statements run in order.', ['ct.constructs']),
  S('prog.variables', 7, PROG, 'Variables and assignment', 'Store, update and swap values in variables; valid variable names.', ['prog.print']),
  S('prog.data-types', 7, PROG, 'Data types and casting', 'Integer, float, string and Boolean; converting with int(), float() and str().', ['prog.variables']),
  S('prog.arithmetic', 7, PROG, 'Arithmetic operators', 'Use +, -, *, /, //, % and ** in Python, with the order of operations.', ['prog.variables']),
  S('prog.input', 8, PROG, 'Input', 'Get data from the user with input(), and convert it to a number when needed.', ['prog.data-types']),
  S('prog.comparison', 8, PROG, 'Comparison operators', 'Use ==, !=, <, >, <= and >= to make conditions that are True or False.', ['prog.data-types']),
  S('prog.logical-ops', 8, PROG, 'and, or, not', 'Combine conditions with and, or and not.', ['prog.comparison', 'logic.gates']),
  S('prog.if-else', 8, PROG, 'Selection: if and else', 'Use if and else to choose which code runs.', ['prog.comparison']),
  S('prog.elif', 8, PROG, 'Selection: elif', 'Use if, elif and else to choose between several options.', ['prog.if-else']),
  S('prog.for-range', 8, PROG, 'For loops and range()', 'Count-controlled iteration with for and range(), including start, stop and step.', ['prog.arithmetic', 'ct.constructs']),
  S('prog.while', 8, PROG, 'While loops', 'Condition-controlled iteration with while; spotting infinite loops.', ['prog.comparison', 'ct.constructs']),
  S('prog.strings', 8, PROG, 'Strings', 'len(), indexing from 0, concatenation, repetition, upper() and lower().', ['prog.data-types']),
  S('prog.random', 8, PROG, 'Random numbers', 'Use the random module: randint() includes both end values.', ['prog.variables']),
  S('prog.errors', 8, PROG, 'Errors and debugging', 'Tell syntax, logic and runtime errors apart, and find them in code.', ['prog.if-else']),
  S('prog.slicing', 9, PROG, 'String slicing', 'Take part of a string with slices like word[1:4].', ['prog.strings']),
  S('prog.lists', 9, PROG, 'Lists', 'Store several values in a list; index, change, append and loop through it.', ['prog.for-range', 'prog.strings']),
  S('prog.functions', 9, PROG, 'Functions', 'Define functions with parameters and return values, and call them.', ['prog.if-else', 'prog.for-range']),
  S('prog.trace', 9, PROG, 'Tracing programs', 'Trace programs that combine loops, selection and variables, as in a trace table.', ['prog.while', 'prog.elif', 'prog.for-range']),

  // ------------------------------------------------------------- data representation
  S('data.bits-bytes', 7, DATA, 'Bits, nibbles and bytes', 'Why computers use binary; bit, nibble and byte.', ['data.powers-of-two']),
  S('data.binary-to-denary', 7, DATA, 'Binary to denary', 'Convert 8-bit binary numbers to denary using place values.', ['data.bits-bytes']),
  S('data.denary-to-binary', 7, DATA, 'Denary to binary', 'Convert denary numbers from 0 to 255 to 8-bit binary.', ['data.binary-to-denary']),
  S('data.binary-addition', 8, DATA, 'Binary addition and overflow', 'Add two 8-bit binary numbers and recognise overflow.', ['data.denary-to-binary']),
  S('data.hex', 8, DATA, 'Hexadecimal', 'Convert between hexadecimal, denary and binary; why hex is used.', ['data.binary-to-denary']),
  S('data.units', 8, DATA, 'Units of data', 'Bit, nibble, byte, kilobyte, megabyte, gigabyte and terabyte, and converting between them.', ['data.bits-bytes']),
  S('data.characters', 8, DATA, 'Characters: ASCII and Unicode', 'How text is stored as character codes; ASCII and Unicode.', ['data.binary-to-denary']),
  S('data.images', 8, DATA, 'Images: pixels and colour depth', 'Pixels, resolution, colour depth and image file size.', ['data.units', 'data.powers-of-two']),
  S('data.sound', 9, DATA, 'Sound: sampling', 'Sample rate, bit depth and sound file size.', ['data.images']),
  S('data.binary-shifts', 9, DATA, 'Binary shifts', 'Left and right shifts multiply and divide by powers of 2.', ['data.binary-addition']),
  S('data.compression', 9, DATA, 'Compression', 'Lossy and lossless compression, and run-length encoding.', ['data.images']),

  // ------------------------------------------------------------- Boolean logic
  S('logic.gates', 8, LOGIC, 'AND, OR and NOT', 'What the AND, OR and NOT gates output for each input.', ['data.bits-bytes']),
  S('logic.truth-tables', 8, LOGIC, 'Truth tables', 'Complete and read truth tables for AND, OR and NOT.', ['logic.gates']),
  S('logic.expressions', 9, LOGIC, 'Logic expressions and circuits', 'Evaluate expressions such as (A AND B) OR NOT C, and turn a described circuit into an expression.', ['logic.truth-tables']),

  // ------------------------------------------------------------- hardware
  S('hw.devices', 7, HW, 'Input, output and storage devices', 'Classify devices as input, output or storage, and choose suitable ones.', []),
  S('hw.cpu', 8, HW, 'The CPU', 'ALU, control unit, registers and cache; clock speed and cores.', ['hw.devices']),
  S('hw.memory', 8, HW, 'RAM and ROM', 'Primary memory: RAM and ROM, volatile and non-volatile.', ['hw.devices']),
  S('hw.storage', 8, HW, 'Secondary storage', 'Magnetic, optical and solid state storage, and choosing between them.', ['hw.memory']),
  S('hw.fde', 9, HW, 'The fetch-decode-execute cycle', 'How the CPU fetches, decodes and executes instructions stored in memory.', ['hw.cpu', 'hw.memory']),
  S('hw.embedded', 9, HW, 'Embedded systems', 'Computers built into other devices to do one dedicated job.', ['hw.cpu']),

  // ------------------------------------------------------------- software
  S('sw.software', 7, SW, 'System and application software', 'Tell system software and application software apart.', []),
  S('sw.os', 8, SW, 'Operating systems', 'What an operating system does: memory, processes, files, users, devices and the interface.', ['sw.software', 'hw.devices']),
  S('sw.translators', 9, SW, 'Languages and translators', 'High-level and low-level languages; compilers, interpreters and assemblers.', ['sw.os', 'prog.errors']),

  // ------------------------------------------------------------- networks
  S('net.lan-wan', 8, NET, 'LANs, WANs and network hardware', 'LAN and WAN, and what routers, switches and network cards do.', ['hw.devices']),
  S('net.topologies', 8, NET, 'Network topologies', 'Star, bus and mesh topologies, with advantages and disadvantages.', ['net.lan-wan']),
  S('net.client-server', 8, NET, 'Client-server and peer-to-peer', 'How client-server and peer-to-peer networks differ.', ['net.lan-wan']),
  S('net.internet-www', 8, NET, 'The internet and the World Wide Web', 'The internet is the network; the web is a service that runs on it. Browsers, URLs and web servers.', ['net.lan-wan']),
  S('net.search-engines', 8, NET, 'Search engines', 'How search engines crawl, index and rank pages; searching well.', ['net.internet-www']),
  S('net.ip-packets', 9, NET, 'IP addresses and packets', 'IP addresses, and how data is split into packets and sent across the internet.', ['net.internet-www']),
  S('net.protocols', 9, NET, 'Protocols and DNS', 'HTTP, HTTPS and other protocols; how DNS turns a domain name into an IP address.', ['net.ip-packets']),

  // ------------------------------------------------------------- cyber security and e-safety
  S('cyber.online-safety', 7, CYBER, 'Online safety and digital footprint', 'Protect personal information, use privacy settings, understand your digital footprint and know how to report concerns.', []),
  S('cyber.passwords', 7, CYBER, 'Passwords and two-factor authentication', 'Make strong passwords and understand two-factor authentication.', ['cyber.online-safety']),
  S('cyber.phishing', 7, CYBER, 'Phishing and social engineering', 'Spot phishing messages and other tricks that target people rather than computers.', ['cyber.online-safety']),
  S('cyber.malware', 8, CYBER, 'Malware', 'Viruses, worms, trojans, ransomware, spyware and adware.', ['cyber.phishing']),
  S('cyber.protection', 9, CYBER, 'Protecting systems', 'Firewalls, anti-malware software, updates, encryption and backups.', ['cyber.malware', 'cyber.passwords']),
  S('cyber.law', 9, CYBER, 'Computing and the law', 'The Computer Misuse Act, the Data Protection Act and copyright, in outline.', ['cyber.malware']),

  // ------------------------------------------------------------- web
  S('web.html-structure', 8, WEB, 'HTML page structure', 'Tags, opening and closing tags, and the html, head, title and body sections.', ['net.internet-www']),
  S('web.html-elements', 8, WEB, 'HTML elements', 'Headings, paragraphs, links, images and lists, and their attributes.', ['web.html-structure']),
]
