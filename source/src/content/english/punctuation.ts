import type { ItemGenerator } from '@/engine/registry'
import { choice } from '../kit'
import { G, atLevel, bankGen, classifyGen, q, textGen, type Example, type MC } from './helpers'

// =====================================================================================================
// Sentence functions and end punctuation (KS2 foundation)
// =====================================================================================================

const FUNCTIONS: Example[] = [
  { text: 'Close the window.', a: 'command', why: 'It tells someone to do something, starting with the imperative verb "Close".', lv: 1 },
  { text: 'The train leaves at six.', a: 'statement', why: 'It gives information.', lv: 1 },
  { text: 'What a mess you have made!', a: 'exclamation', why: 'It starts with "What", has a verb, and ends with an exclamation mark: an exclamation.', lv: 2 },
  { text: 'Where did you leave your bag?', a: 'question', why: 'It asks something and needs an answer.', lv: 1 },
  { text: 'How brilliant that was!', a: 'exclamation', why: 'It starts with "How", has a verb, and ends with "!": an exclamation.', lv: 2 },
  { text: 'Please sit down.', a: 'command', why: '"Sit" is an imperative verb: it tells someone what to do (politely).', lv: 2 },
  { text: 'Stop shouting!', a: 'command', why: 'It tells someone what to do. The "!" adds force, but it is still a command.', lv: 3 },
  { text: 'Do you like spaghetti?', a: 'question', why: 'It asks something.', lv: 1 },
  { text: 'Owls hunt at night.', a: 'statement', why: 'It gives information.', lv: 1 },
  { text: 'What time does the film start?', a: 'question', why: 'It starts with "What", but it asks for information, so it is a question.', lv: 3 },
  { text: 'Turn left at the church.', a: 'command', why: '"Turn" is an imperative verb giving an instruction.', lv: 2 },
  { text: 'I wonder where he went.', a: 'statement', why: 'It tells us what the speaker is wondering; it does not ask anyone directly, so it is a statement.', lv: 4 },
  { text: 'How tall the tree has grown!', a: 'exclamation', why: 'It starts with "How", has a verb, and exclaims: an exclamation.', lv: 3 },
  { text: 'Never touch the cooker when it is hot.', a: 'command', why: 'It tells someone what (not) to do.', lv: 3 },
  { text: 'What a beautiful day it is!', a: 'exclamation', why: '"What" + noun phrase + verb + "!": an exclamation.', lv: 2 },
]

const END_MARK: { s: string; a: '.' | '?' | '!'; why: string; lv: number }[] = [
  { s: 'Where are my shoes', a: '?', why: 'It asks a question.', lv: 1 },
  { s: 'The bus was late again', a: '.', why: 'It is a statement.', lv: 1 },
  { s: 'What a surprise that was', a: '!', why: 'It is an exclamation starting with "What".', lv: 2 },
  { s: 'I wonder whether it will snow', a: '.', why: 'It reports a wondering but does not directly ask, so it ends with a full stop.', lv: 4 },
  { s: 'Can you help me with this', a: '?', why: 'It asks a question.', lv: 1 },
  { s: 'How quickly the summer has gone', a: '!', why: 'It is an exclamation starting with "How".', lv: 3 },
  { s: 'She asked me where the library was', a: '.', why: 'This is reported (indirect) speech: it tells us what she asked, so it is a statement.', lv: 4 },
  { s: 'Why is the sky blue', a: '?', why: 'It asks a question.', lv: 1 },
  { s: 'Penguins cannot fly', a: '.', why: 'It is a statement.', lv: 2 },
  { s: 'What an amazing goal that was', a: '!', why: 'It is an exclamation starting with "What".', lv: 2 },
]

const CAPITALS: { s: string; a: string; others: string[]; lv: number }[] = [
  { s: 'My cousin lives in manchester.', a: 'manchester', others: ['cousin', 'lives', 'in'], lv: 1 },
  { s: 'We go back to school on monday.', a: 'monday', others: ['school', 'back', 'go'], lv: 1 },
  { s: 'Our holiday is in august this year.', a: 'august', others: ['holiday', 'year', 'this'], lv: 2 },
  { s: 'She speaks french at home.', a: 'french', others: ['speaks', 'home', 'at'], lv: 3 },
  { s: 'The river thames flows through London.', a: 'thames', others: ['river', 'flows', 'through'], lv: 3 },
  { s: 'My friend and i went swimming.', a: 'i', others: ['friend', 'went', 'swimming'], lv: 2 },
  { s: 'Have you read anything by dickens?', a: 'dickens', others: ['read', 'anything', 'by'], lv: 3 },
  { s: 'We watched a play at the globe theatre.', a: 'globe', others: ['play', 'watched', 'at'], lv: 4 },
]

const sentenceBasicGenerators: ItemGenerator[] = [
  classifyGen('sentences.function', 'punctuation.sentence-basics', [1, 4], {
    rows: FUNCTIONS,
    cats: {
      statement: 'A statement gives information.',
      question: 'A question asks something.',
      command: 'A command tells someone to do something, usually starting with an imperative verb.',
      exclamation: 'In grammar, an exclamation starts with "What" or "How", contains a verb and ends with "!" (What a day it was!).',
    },
    prompt: (e) => `What type of sentence is this?\n${e.text}`,
    hint: 'Is it telling, asking, ordering or exclaiming? A "!" alone does not make something an exclamation.',
    keepOrder: true,
  }),
  G('sentences.end-mark', 'punctuation.sentence-basics', [1, 4], (rng, d) => {
    const r = rng.pick(atLevel(END_MARK, d))
    const names = { '.': 'full stop (.)', '?': 'question mark (?)', '!': 'exclamation mark (!)' }
    return choice({
      rng,
      prompt: `Which punctuation mark should end this sentence?\n${r.s}`,
      correct: names[r.a],
      wrong: (['.', '?', '!'] as const).filter((x) => x !== r.a).map((x) => ({ label: names[x], feedback: x === '?' ? 'Only a direct question takes a question mark.' : x === '!' ? 'An exclamation mark is for exclamations or strong commands.' : 'A full stop ends a statement or a mild command.' })),
      keepOrder: true,
      hint: 'Is it telling, asking directly, or exclaiming?',
      explanation: `${r.s}${r.a} ${r.why}`,
    })
  }),
  G('sentences.capital', 'punctuation.sentence-basics', [1, 4], (rng, d) => {
    const r = rng.pick(atLevel(CAPITALS, d))
    return choice({
      rng,
      prompt: `Which word in this sentence should have a capital letter?\n${r.s}`,
      correct: r.a,
      wrong: r.others.map((o) => ({ label: o, feedback: `"${o}" is a common word, so it does not need a capital.` })),
      hint: 'Proper nouns (names of particular people, places, days, months, languages) and the word "I" always take capitals.',
      explanation: `"${r.a}" should be "${r.a === 'i' ? 'I' : r.a.charAt(0).toUpperCase() + r.a.slice(1)}": ${r.a === 'i' ? 'the pronoun I is always a capital.' : 'it is a proper noun.'}`,
    })
  }),
]

// =====================================================================================================
// Commas
// =====================================================================================================

const COMMA_CORRECT: MC[] = [
  { q: 'Which sentence uses commas correctly?', a: 'I packed a torch, a map, some snacks and a jumper.', w: ['I packed a torch a map, some snacks and a jumper.', 'I packed, a torch, a map, some snacks and a jumper.', 'I packed a torch, a map some snacks and, a jumper.'], hint: 'Commas separate the items in a list.', ex: 'Each list item is separated by a comma; the last two are joined by "and".', lv: 1 },
  { q: 'Which sentence uses commas correctly?', a: 'Later that evening, the fox returned.', w: ['Later, that evening the fox returned.', 'Later that evening the fox, returned.', 'Later that, evening the fox returned.'], hint: 'Where does the fronted adverbial ("when?") end?', ex: 'The comma comes after the whole fronted adverbial "Later that evening".', lv: 2 },
  { q: 'Which sentence uses commas correctly?', a: 'When the bell rang, everyone rushed outside.', w: ['When the bell, rang everyone rushed outside.', 'When, the bell rang everyone rushed outside.', 'When the bell rang everyone, rushed outside.'], hint: 'Find where the subordinate clause ends.', ex: 'The comma marks the end of the opening subordinate clause "When the bell rang".', lv: 2 },
  { q: 'Which sentence uses commas correctly?', a: 'My sister, who is a vet, loves animals.', w: ['My sister who is a vet, loves animals.', 'My sister, who is a vet loves animals.', 'My, sister who is a vet loves animals.'], hint: 'Extra information in the middle of a sentence needs a comma on BOTH sides.', ex: 'The extra information "who is a vet" is marked off by a pair of commas.', lv: 3 },
  { q: 'Which sentence uses commas correctly?', a: "Let's eat, Grandma!", w: [{ label: "Let's eat Grandma!", feedback: 'Without the comma, this says you are going to eat Grandma!' }, "Let's, eat Grandma!", "Let's eat Grandma,!"], hint: 'Someone is being spoken to by name.', ex: 'When you address someone by name, a comma separates the name. Commas save lives!', lv: 2 },
  { q: 'Which sentence uses commas correctly?', a: 'Shivering and soaked, the hikers finally reached the hut.', w: ['Shivering and soaked the hikers, finally reached the hut.', 'Shivering, and soaked the hikers finally reached the hut.', 'Shivering and soaked the hikers finally, reached the hut.'], hint: 'The opening describes the hikers; where does that opening end?', ex: 'The comma comes after the opening phrase "Shivering and soaked", before the main clause.', lv: 4 },
  { q: 'Which sentence uses commas correctly?', a: 'Mr Patel, our new neighbour, grows enormous pumpkins.', w: ['Mr Patel our new neighbour, grows enormous pumpkins.', 'Mr Patel, our new neighbour grows enormous pumpkins.', 'Mr Patel our, new neighbour grows enormous pumpkins.'], hint: 'The extra information about Mr Patel needs a comma either side.', ex: '"Our new neighbour" is extra information, so it sits between a pair of commas.', lv: 3 },
  { q: 'Which sentence uses commas correctly?', a: 'The wind howled, the rain lashed down, and the lights went out.', w: ['The wind howled the rain lashed down, and the lights went out.', 'The wind, howled the rain lashed down and the lights went out.', 'The wind howled, the rain, lashed down and the lights went out.'], hint: 'This is a list of three clauses.', ex: 'Commas separate the items in a list, even when the items are clauses.', lv: 4 },
]

const COMMA_WHY: Example[] = [
  { text: 'We need eggs, flour, sugar and butter.', a: 'to separate items in a list', why: 'The commas separate the items in a list.', lv: 1 },
  { text: 'After lunch, we went to the beach.', a: 'after a fronted adverbial', why: '"After lunch" is a fronted adverbial (it tells us when), so a comma follows it.', not: ['after a subordinate clause at the start'], lv: 2 },
  { text: 'Although it was raining, we went out.', a: 'after a subordinate clause at the start', why: 'The sentence opens with the subordinate clause "Although it was raining", so a comma marks where it ends.', not: ['after a fronted adverbial'], lv: 3 },
  { text: 'My dog, who is ten, still loves chasing balls.', a: 'to mark off extra information (parenthesis)', why: 'The pair of commas marks off the extra information "who is ten".', lv: 3 },
  { text: 'Sam, can you pass me that?', a: 'to separate the name of the person being spoken to', why: 'Sam is being addressed directly, so a comma separates the name.', lv: 2 },
  { text: 'Slowly, the door creaked open.', a: 'after a fronted adverbial', why: '"Slowly" is a fronted adverbial (how?), followed by a comma.', not: ['after a subordinate clause at the start'], lv: 2 },
  { text: 'If you see Ella, tell her to call me.', a: 'after a subordinate clause at the start', why: '"If you see Ella" is a subordinate clause at the start.', not: ['after a fronted adverbial'], lv: 3 },
  { text: 'The castle, built in 1350, is now a museum.', a: 'to mark off extra information (parenthesis)', why: '"Built in 1350" is extra information marked off by commas.', lv: 4 },
  { text: 'Thank you for your help, Mrs Jones.', a: 'to separate the name of the person being spoken to', why: 'Mrs Jones is being addressed directly.', lv: 3 },
  { text: 'The film was long, dull and confusing.', a: 'to separate items in a list', why: 'The comma separates a list of adjectives.', lv: 2 },
]

interface Splice {
  a: string
  b: string
  B: string
  conj: string
  lv: number
}
const SPLICES: Splice[] = [
  { a: 'The film was boring', b: 'we left early', B: 'We left early', conj: 'so', lv: 3 },
  { a: 'Lily loves drawing', b: 'her brother prefers music', B: 'Her brother prefers music', conj: 'but', lv: 3 },
  { a: 'The shop was closed', b: 'we went home', B: 'We went home', conj: 'so', lv: 3 },
  { a: 'I knocked on the door', b: 'nobody answered', B: 'Nobody answered', conj: 'but', lv: 4 },
  { a: 'The wind was howling', b: 'the rain lashed the windows', B: 'The rain lashed the windows', conj: 'and', lv: 4 },
  { a: 'Kai trained every day', b: 'he won the race', B: 'He won the race', conj: 'so', lv: 4 },
  { a: 'My phone was broken', b: 'I could not call anyone', B: 'I could not call anyone', conj: 'so', lv: 5 },
  { a: 'The lesson ended', b: 'everyone rushed out', B: 'Everyone rushed out', conj: 'and', lv: 5 },
]

const commaGenerators: ItemGenerator[] = [
  bankGen('commas.correct', 'punctuation.commas', [1, 4], COMMA_CORRECT),
  classifyGen('commas.why', 'punctuation.commas', [1, 4], {
    rows: COMMA_WHY,
    cats: {
      'to separate items in a list': 'List commas separate three or more items.',
      'after a fronted adverbial': 'A fronted adverbial is a word or phrase at the start that tells when, where or how; a comma follows it.',
      'after a subordinate clause at the start': 'When a sentence opens with a subordinate clause (because, when, if...), a comma marks where it ends.',
      'to mark off extra information (parenthesis)': 'A pair of commas can mark off extra information that the sentence would make sense without.',
      'to separate the name of the person being spoken to': 'When you address someone by name, a comma separates the name.',
    },
    prompt: (e) => `Why is there a comma (or commas) in this sentence?\n${e.text}`,
    hint: 'Look at what comes before and after each comma.',
  }),
  G('commas.splice', 'punctuation.commas', [3, 5], (rng, d) => {
    const s = rng.pick(atLevel(SPLICES, d))
    return choice({
      rng,
      prompt: 'Which of these is a comma splice (an error)?',
      correct: `${s.a}, ${s.b}.`,
      wrong: [
        { label: `${s.a}, ${s.conj} ${s.b}.`, feedback: `Correct: the conjunction "${s.conj}" joins the two main clauses.` },
        { label: `${s.a}. ${s.B}.`, feedback: 'Correct: two separate sentences.' },
        { label: `${s.a}; ${s.b}.`, feedback: 'Correct: a semicolon can join two closely related main clauses.' },
      ],
      hint: 'A comma on its own cannot join two main clauses.',
      explanation: `"${s.a}, ${s.b}." joins two main clauses with only a comma. Fix it with a full stop, a semicolon, or a conjunction such as "${s.conj}".`,
    })
  }),
]

// =====================================================================================================
// Apostrophes
// =====================================================================================================

const CONTRACTIONS: [string, string, number][] = [
  ['do not', "don't", 1],
  ['cannot', "can't", 1],
  ['will not', "won't", 2],
  ['I am', "I'm", 1],
  ['they are', "they're", 2],
  ['it is', "it's", 2],
  ['we have', "we've", 2],
  ['she would', "she'd", 3],
  ['should not', "shouldn't", 2],
  ['you are', "you're", 2],
  ['could have', "could've", 3],
  ['let us', "let's", 3],
  ['I will', "I'll", 1],
  ['does not', "doesn't", 2],
  ['who is', "who's", 3],
  ['have not', "haven't", 2],
  ['would not', "wouldn't", 2],
]

const POSSESSIVES: { owner: string; thing: string; ans: string[]; ex: string; lv: number }[] = [
  { owner: 'the dog', thing: 'tail', ans: ["the dog's tail"], ex: 'One dog: add apostrophe + s.', lv: 2 },
  { owner: 'the teacher', thing: 'desk', ans: ["the teacher's desk"], ex: 'One teacher: add apostrophe + s.', lv: 2 },
  { owner: 'Sam', thing: 'bike', ans: ["Sam's bike"], ex: 'One owner: add apostrophe + s.', lv: 1 },
  { owner: 'my sister', thing: 'room', ans: ["my sister's room"], ex: 'One sister: add apostrophe + s.', lv: 2 },
  { owner: 'the girls', thing: 'changing room', ans: ["the girls' changing room"], ex: 'Plural ending in s (girls): just add an apostrophe after the s.', lv: 3 },
  { owner: 'the players', thing: 'boots', ans: ["the players' boots"], ex: 'Plural ending in s: apostrophe after the s.', lv: 3 },
  { owner: 'my parents', thing: 'car', ans: ["my parents' car"], ex: 'Two parents (plural ending in s): apostrophe after the s.', lv: 3 },
  { owner: 'the horses', thing: 'stable', ans: ["the horses' stable"], ex: 'Plural ending in s: apostrophe after the s.', lv: 3 },
  { owner: 'the children', thing: 'toys', ans: ["the children's toys"], ex: '"Children" is a plural that does not end in s, so add apostrophe + s.', lv: 4 },
  { owner: 'the women', thing: 'team', ans: ["the women's team"], ex: '"Women" is a plural not ending in s: add apostrophe + s.', lv: 4 },
  { owner: 'the men', thing: 'race', ans: ["the men's race"], ex: '"Men" does not end in s: add apostrophe + s.', lv: 4 },
  { owner: 'the people', thing: 'choice', ans: ["the people's choice"], ex: '"People" does not end in s: add apostrophe + s.', lv: 4 },
  { owner: 'James', thing: 'coat', ans: ["James's coat", "James' coat"], ex: 'For a name ending in s, both "James\'s" and "James\'" are accepted; "James\'s" is the more common choice in schools.', lv: 5 },
  { owner: 'the mice', thing: 'nest', ans: ["the mice's nest"], ex: '"Mice" is a plural not ending in s: add apostrophe + s.', lv: 5 },
]

const ITS: { s: string; a: 'its' | "it's"; why: string }[] = [
  { s: 'The dog wagged ___ tail.', a: 'its', why: 'Belonging to the dog: "its" (no apostrophe).' },
  { s: '___ raining again.', a: "it's", why: '"It is raining": "it\'s".' },
  { s: 'The school changed ___ uniform.', a: 'its', why: 'Belonging to the school: "its".' },
  { s: '___ been a long day.', a: "it's", why: '"It has been": "it\'s".' },
  { s: 'The bird built ___ nest in the hedge.', a: 'its', why: 'Belonging to the bird: "its".' },
  { s: 'I think ___ going to snow.', a: "it's", why: '"It is going to snow": "it\'s".' },
  { s: 'Every country has ___ own flag.', a: 'its', why: 'Belonging to the country: "its".' },
  { s: '___ my turn next.', a: "it's", why: '"It is my turn": "it\'s".' },
]

const APOS_CORRECT: MC[] = [
  { q: 'Which sentence uses an apostrophe correctly?', a: "The cat's bowl is empty.", w: [{ label: "Fresh apple's for sale.", feedback: 'Plain plurals never take an apostrophe: apples.' }, { label: "The cat's are asleep.", feedback: '"Cats" here is just a plural: no apostrophe.' }, { label: "Its' my turn.", feedback: '"It\'s" (it is) has the apostrophe before the s.' }], hint: 'An apostrophe shows possession or missing letters - never just a plural.', ex: 'The bowl belongs to the cat: "the cat\'s bowl".', lv: 2 },
  { q: 'Which sentence uses an apostrophe correctly?', a: "We couldn't find the boys' football.", w: [{ label: "We could'nt find the boys football.", feedback: 'The apostrophe goes where the letter is missing: couldn\'t (could not).' }, { label: "We couldnt find the boy's' football.", feedback: 'Only one apostrophe is needed for possession.' }, { label: "We couldn't find the boys football's.", feedback: 'The football is not plural or owning anything.' }], hint: 'Check both the contraction and the possession.', ex: '"Couldn\'t" replaces the o in "not"; the football belongs to the boys, so "boys\'".', lv: 4 },
  { q: 'Which sentence uses an apostrophe correctly?', a: 'The 1990s were before I was born.', w: [{ label: "The 1990's were before I was born.", feedback: 'Decades are plurals, so no apostrophe: 1990s.' }, { label: "The 1990s' were before I was born.", feedback: 'Nothing belongs to the 1990s here.' }, { label: "The 19'90s were before I was born.", feedback: 'There is no missing letter there.' }], hint: 'Is anything owned, or any letter missing?', ex: 'Decades are plurals, so they take no apostrophe: the 1990s.', lv: 5 },
  { q: 'Which sentence uses an apostrophe correctly?', a: "The children's coats were soaked.", w: [{ label: "The childrens' coats were soaked.", feedback: '"Children" is already plural, so add \'s: children\'s.' }, { label: "The childrens coat's were soaked.", feedback: 'The coats do not own anything.' }, { label: "The children's' coats were soaked.", feedback: 'Only one apostrophe is needed.' }], hint: 'Write the owner first (children), then add the apostrophe.', ex: 'Owner = children (a plural without s), so add \'s: children\'s.', lv: 4 },
]

const apostropheGenerators: ItemGenerator[] = [
  textGen(
    'apostrophes.contraction',
    'punctuation.apostrophes',
    [1, 3],
    CONTRACTIONS.map(([full, short, lv]) => ({ q: `Write the contraction (shortened form) of ${q(full)}.`, accept: [short], hint: 'The apostrophe goes exactly where letters have been missed out.', ex: `${full} → ${short}. The apostrophe shows where letters are missing.` + (short === "won't" ? ' "Won\'t" is irregular: it does not follow the pattern.' : ''), lv })),
  ),
  textGen(
    'apostrophes.possession',
    'punctuation.apostrophes',
    [2, 5],
    POSSESSIVES.map((p) => ({ q: `Rewrite this using an apostrophe:\nthe ${p.thing} belonging to ${p.owner}`, accept: [...p.ans, ...p.ans.map((a) => a.replace(/^(the|my) /, ''))], hint: 'Write the owner exactly as it is, then add the apostrophe (and an s if needed), then the thing owned.', ex: `${p.ans[0]}. ${p.ex}`, lv: p.lv })),
  ),
  G('apostrophes.its', 'punctuation.apostrophes', [2, 4], (rng) => {
    const r = rng.pick(ITS)
    const fill = r.s.startsWith('___') ? (r.a === 'its' ? 'Its' : "It's") : r.a
    return choice({
      rng,
      prompt: `Which word fills the gap?\n${r.s}`,
      correct: r.a,
      wrong: [{ label: r.a === 'its' ? "it's" : 'its', misconception: 'its-its', feedback: r.a === 'its' ? '"It\'s" always means "it is" or "it has".' : '"Its" (no apostrophe) means "belonging to it".' }],
      keepOrder: false,
      hint: 'Try saying "it is" in the gap. Does it make sense?',
      explanation: `${r.s.replace('___', fill)} ${r.why}`,
    })
  }),
  bankGen('apostrophes.correct', 'punctuation.apostrophes', [2, 5], APOS_CORRECT),
]

// =====================================================================================================
// Speech
// =====================================================================================================

const SPEECH: MC[] = [
  { q: 'Which line of speech is punctuated correctly?', a: '"Are you coming to the party?" asked Mia.', w: [{ label: '"Are you coming to the party"? asked Mia.', feedback: 'The question mark belongs inside the speech marks.' }, { label: '"Are you coming to the party?" Asked Mia.', feedback: 'The sentence continues after the speech, so "asked" stays lower case.' }, { label: 'Are you coming to the party? "asked Mia."', feedback: 'Speech marks go around the words actually spoken.' }], hint: 'Punctuation that belongs to the speech goes inside the speech marks.', ex: 'The question mark is inside the speech marks, and "asked" is lower case because the sentence carries on.', lv: 1 },
  { q: 'Which line of speech is punctuated correctly?', a: '"I can\'t find my keys," said Dad.', w: [{ label: '"I can\'t find my keys." said Dad.', feedback: 'Use a comma, not a full stop, when the sentence continues with "said Dad".' }, { label: '"I can\'t find my keys", said Dad.', feedback: 'The comma goes inside the closing speech marks.' }, { label: '"I can\'t find my keys," Said Dad.', feedback: '"Said" continues the sentence, so it is lower case.' }], hint: 'The speech ends with a comma inside the speech marks when "said..." follows.', ex: 'A comma inside the closing speech marks, then lower-case "said".', lv: 2 },
  { q: 'Which line of speech is punctuated correctly?', a: 'Mum shouted, "Dinner is ready!"', w: [{ label: 'Mum shouted "dinner is ready!"', feedback: 'You need a comma before the speech, and the speech starts with a capital.' }, { label: 'Mum shouted, "Dinner is ready"!', feedback: 'The exclamation mark belongs inside the speech marks.' }, { label: 'Mum shouted, Dinner is ready!"', feedback: 'You need opening speech marks too.' }], hint: 'When the speaker comes first, put a comma before the opening speech marks.', ex: 'Comma after "shouted", capital D to start the speech, and the "!" inside the speech marks.', lv: 2 },
  { q: 'Which line of speech is punctuated correctly?', a: '"Wait for me!" cried Tom.', w: [{ label: '"Wait for me"! cried Tom.', feedback: 'The "!" goes inside the speech marks.' }, { label: '"Wait for me!" Cried Tom.', feedback: '"Cried" continues the sentence: lower case.' }, { label: '"Wait for me! cried Tom."', feedback: 'Only the spoken words go inside the speech marks.' }], hint: 'Where does the exclamation mark go?', ex: 'The "!" belongs to the speech, so it goes inside; "cried" stays lower case.', lv: 2 },
  { q: 'Which line of speech is punctuated correctly?', a: '"If you hurry," said Mrs Shah, "you might catch the bus."', w: [{ label: '"If you hurry," said Mrs Shah, "You might catch the bus."', feedback: 'The second part continues the same sentence, so it starts with a lower-case letter.' }, { label: '"If you hurry" said Mrs Shah "you might catch the bus."', feedback: 'Commas are needed around "said Mrs Shah".' }, { label: '"If you hurry," said Mrs Shah. "you might catch the bus."', feedback: 'This is one sentence split in two, so use a comma after "Mrs Shah", not a full stop.' }], hint: 'This is ONE spoken sentence, interrupted by "said Mrs Shah".', ex: 'When one sentence of speech is split, use commas around "said Mrs Shah" and carry on in lower case.', lv: 4 },
  { q: 'Which line of speech is punctuated correctly?', a: '"I love this song," said Priya. "It always makes me smile."', w: [{ label: '"I love this song," said Priya, "it always makes me smile."', feedback: 'These are two separate sentences of speech, so you need a full stop after "Priya".' }, { label: '"I love this song," said Priya. "it always makes me smile."', feedback: 'A new sentence of speech starts with a capital letter.' }, { label: '"I love this song." said Priya. "It always makes me smile."', feedback: 'Use a comma, not a full stop, before "said Priya".' }], hint: 'Is the speech one sentence or two?', ex: 'The speech is two sentences, so a full stop follows "Priya" and "It" starts with a capital.', lv: 5 },
  { q: 'Which line of speech is punctuated correctly?', a: 'The guide whispered, "Stay very still."', w: [{ label: 'The guide whispered "Stay very still".', feedback: 'You need a comma before the speech, and the full stop goes inside the speech marks.' }, { label: 'The guide whispered, "stay very still."', feedback: 'Speech starts with a capital letter.' }, { label: 'The guide whispered, Stay very still."', feedback: 'Opening speech marks are missing.' }], hint: 'Comma, speech marks, capital, punctuation inside.', ex: 'Comma before the speech, capital S, full stop inside the closing speech marks.', lv: 3 },
  { q: 'Which line of speech is punctuated correctly?', a: '"Where is the library?" the new girl asked.', w: [{ label: '"Where is the library," the new girl asked?', feedback: 'The question mark belongs to the spoken question, inside the speech marks.' }, { label: '"Where is the library?" The new girl asked.', feedback: 'The sentence continues, so "the" is lower case.' }, { label: '"Where is the library"? the new girl asked.', feedback: 'The question mark goes inside the speech marks.' }], hint: 'Which words are the question?', ex: 'The question mark ends the spoken words inside the speech marks; the sentence carries on in lower case.', lv: 3 },
]

const SPEECH_RULES: MC[] = [
  { q: 'When writing dialogue, when should you start a new line?', a: 'Each time a different person starts speaking', w: ['After every sentence', 'Only at the end of a conversation', 'Whenever someone asks a question'], hint: 'Think about how a reader keeps track of who is talking.', ex: 'New speaker, new line: it shows the reader who is talking.', lv: 1 },
  { q: 'What goes inside speech marks?', a: 'Only the words that are actually spoken', w: ['The whole sentence, including "she said"', 'Only the first word spoken', 'The name of the speaker'], hint: 'Speech marks are like a speech bubble.', ex: 'Speech marks surround only the spoken words, plus the punctuation that belongs to them.', lv: 1 },
  { q: 'Which of these is reported (indirect) speech?', a: 'She said that she was tired.', w: [{ label: '"I am tired," she said.', feedback: 'That is direct speech: the actual words in speech marks.' }, { label: 'She said, "I am tired."', feedback: 'That is direct speech.' }, { label: '"Tired," she said, "is what I am."', feedback: 'That is direct speech, split in two.' }], hint: 'Reported speech tells us what was said without quoting the exact words.', ex: 'Reported speech uses no speech marks and usually changes the pronoun and tense: "she was tired".', lv: 2 },
  { q: 'Which is the reported speech version of: "I am hungry," said Ben.', a: 'Ben said that he was hungry.', w: [{ label: 'Ben said that "I am hungry."', feedback: 'Reported speech does not use speech marks.' }, { label: 'Ben said that I am hungry.', feedback: 'The pronoun must change: Ben is talking about himself, so "he".' }, { label: 'Ben said, "he was hungry."', feedback: 'That mixes direct and reported speech.' }], hint: 'Change the pronoun and move the tense back.', ex: '"I am" becomes "he was" in reported speech.', lv: 4 },
  { q: 'Which is the reported speech version of: "We will win," said the captain.', a: 'The captain said that they would win.', w: [{ label: 'The captain said that we will win.', feedback: 'The pronoun and tense need to shift: "they would win".' }, { label: 'The captain said, "they would win."', feedback: 'Reported speech does not use speech marks.' }, { label: 'The captain said that "we will win".', feedback: 'No speech marks in reported speech.' }], hint: '"Will" usually becomes "would" in reported speech.', ex: '"We will" becomes "they would".', lv: 5 },
  { q: 'Which word could replace "said" to show the speaker is frightened?', a: 'whimpered', w: ['announced', 'boasted', 'joked'], hint: 'Picture the voice of someone scared.', ex: '"Whimpered" suggests fear; the others suggest confidence or humour.', lv: 2 },
]

const speechGenerators: ItemGenerator[] = [bankGen('speech.correct', 'punctuation.speech', [1, 5], SPEECH), bankGen('speech.rules', 'punctuation.speech', [1, 5], SPEECH_RULES)]

// =====================================================================================================
// Colons and semicolons
// =====================================================================================================

const GAP: { s: string; a: 'colon' | 'semicolon' | 'comma'; why: string; lv: number }[] = [
  { s: 'You will need three things___ a torch, a map and a compass.', a: 'colon', why: 'A colon introduces a list after a complete clause.', lv: 2 },
  { s: 'The recipe needs only four ingredients___ flour, eggs, milk and butter.', a: 'colon', why: 'A colon introduces the list.', lv: 2 },
  { s: 'I have three favourite authors___ Dickens, Austen and Conan Doyle.', a: 'colon', why: 'A colon introduces the list.', lv: 3 },
  { s: 'Pack the following___ sun cream, a hat and plenty of water.', a: 'colon', why: 'A colon introduces the list.', lv: 3 },
  { s: 'Some people love the city___ others prefer the countryside.', a: 'semicolon', why: 'A semicolon joins two closely related main clauses (here, a contrast).', lv: 3 },
  { s: 'My brother is a night owl___ my sister is up at dawn.', a: 'semicolon', why: 'A semicolon joins two related main clauses.', lv: 3 },
  { s: 'The first half was dull___ the second half was thrilling.', a: 'semicolon', why: 'A semicolon joins two balanced main clauses.', lv: 4 },
  { s: 'I play the piano___ my best friend plays the drums.', a: 'semicolon', why: 'Two related main clauses: a semicolon (a comma would make a comma splice).', lv: 4 },
  { s: 'On our tour we visited York, in the north___ Bath, in the west; and Brighton, on the south coast.', a: 'semicolon', why: 'The list items already contain commas, so semicolons separate them.', lv: 5 },
  { s: 'The prizes went to Ella, who scored highest___ Jo, who improved most; and Max, who helped everyone.', a: 'semicolon', why: 'Semicolons separate items in a list that already contain commas.', lv: 5 },
  { s: 'After the match___ we went for pizza.', a: 'comma', why: 'A comma follows a fronted adverbial.', lv: 2 },
  { s: 'I bought apples___ pears and plums.', a: 'comma', why: 'A comma separates items in a simple list.', lv: 2 },
  { s: 'My cousin___ who lives in Leeds, is coming to stay.', a: 'comma', why: 'This comma starts a pair around the extra information.', lv: 3 },
]

const MARK_JOB: Example[] = [
  { text: 'She speaks three languages: English, Spanish and Urdu.|colon', a: 'introducing a list', why: 'The colon introduces the list of languages.', lv: 2 },
  { text: 'The match was cancelled: the pitch was flooded.|colon', a: 'introducing an explanation', not: ['joining two closely related main clauses'], why: 'What follows the colon explains why the match was cancelled.', lv: 3 },
  { text: 'I knew she was lying: her face had turned bright red.|colon', a: 'introducing an explanation', not: ['joining two closely related main clauses'], why: 'The second part explains how the speaker knew.', lv: 3 },
  { text: 'The witches chant a famous line: "Fair is foul, and foul is fair."|colon', a: 'introducing a quotation', why: 'The colon introduces the quotation.', lv: 3 },
  { text: 'The sun was shining; the birds were singing.|semicolon', a: 'joining two closely related main clauses', why: 'Each side is a main clause, and they are closely related.', lv: 2 },
  { text: 'We invited Sam, our neighbour; Priya, my best friend; and Leo, my cousin.|semicolon', a: 'separating items in a list that already contains commas', why: 'The items contain commas, so semicolons keep them apart clearly.', lv: 4 },
  { text: 'Some pupils walked to school; others came by bus.|semicolon', a: 'joining two closely related main clauses', why: 'Two related main clauses.', lv: 3 },
  { text: 'Juliet\'s question is famous: "Wherefore art thou Romeo?"|colon', a: 'introducing a quotation', why: 'The colon introduces the quotation.', lv: 4 },
]

const SEMI_CORRECT: MC[] = [
  { q: 'Which sentence uses a semicolon correctly?', a: 'I love swimming; it keeps me fit.', w: [{ label: 'I love swimming; and running.', feedback: '"And running" is not a main clause.' }, { label: 'Because I love swimming; I go every week.', feedback: '"Because I love swimming" is a subordinate clause; use a comma.' }, { label: 'I love; swimming every day.', feedback: 'The semicolon splits the clause in the middle.' }], hint: 'Both sides of a semicolon should be able to stand as sentences (in a simple use).', ex: '"I love swimming" and "it keeps me fit" are both main clauses.', lv: 3 },
  { q: 'Which sentence uses a colon correctly?', a: 'There was only one thing left to do: run.', w: [{ label: 'There was: only one thing left to do, run.', feedback: 'A colon should come after a complete clause.' }, { label: 'There was only one thing; left to do run.', feedback: 'That semicolon splits a clause.' }, { label: 'There: was only one thing left to do run.', feedback: 'The colon is in the wrong place.' }], hint: 'The colon comes after a complete clause and introduces what follows.', ex: 'The complete clause "There was only one thing left to do" is followed by a colon and the reveal.', lv: 4 },
  { q: 'Which sentence uses a semicolon correctly?', a: 'The museum was closed; we visited the park instead.', w: [{ label: 'The museum was closed, we visited the park instead.', feedback: 'That is a comma splice.' }, { label: 'The museum; was closed so we visited the park instead.', feedback: 'The semicolon splits a clause.' }, { label: 'The museum was closed; and so.', feedback: '"And so" is not a main clause.' }], hint: 'Check each side could stand alone.', ex: 'Both sides are main clauses.', lv: 4 },
]

const colonGenerators: ItemGenerator[] = [
  G('colons.gap', 'punctuation.colons-semicolons', [2, 5], (rng, d) => {
    const r = rng.pick(atLevel(GAP, d))
    const names = { colon: 'colon ( : )', semicolon: 'semicolon ( ; )', comma: 'comma ( , )' }
    const fb = {
      colon: 'A colon comes after a complete clause, to introduce a list, an explanation or a quotation.',
      semicolon: 'A semicolon joins two main clauses, or separates list items that already contain commas.',
      comma: 'A comma cannot join two main clauses on its own; it separates list items or marks off phrases.',
    }
    return choice({
      rng,
      prompt: `Which punctuation mark belongs in the gap?\n${r.s}`,
      correct: names[r.a],
      wrong: (['colon', 'semicolon', 'comma'] as const).filter((x) => x !== r.a).map((x) => ({ label: names[x], feedback: fb[x] })),
      keepOrder: true,
      hint: 'Is the next part a list, a second main clause, or just a phrase?',
      explanation: `${r.s.replace('___', r.a === 'colon' ? ':' : r.a === 'semicolon' ? ';' : ',')} ${r.why}`,
    })
  }),
  classifyGen('colons.job', 'punctuation.colons-semicolons', [2, 5], {
    rows: MARK_JOB,
    cats: {
      'introducing a list': 'A colon can introduce a list.',
      'introducing an explanation': 'A colon can introduce an explanation of what came before.',
      'introducing a quotation': 'A colon can introduce a quotation.',
      'joining two closely related main clauses': 'A semicolon can join two closely related main clauses.',
      'separating items in a list that already contains commas': 'Semicolons separate list items that already contain commas.',
    },
    prompt: (e) => {
      const [s, m] = e.text.split('|')
      return `What job is the ${m} doing in this sentence?\n${s}`
    },
    hint: 'Look at what comes after the mark: a list? an explanation? a quotation? another main clause?',
  }),
  bankGen('colons.correct', 'punctuation.colons-semicolons', [3, 5], SEMI_CORRECT),
]

// =====================================================================================================
// Parenthesis, dashes and ellipsis
// =====================================================================================================

const PAREN: { s: string; p: string; w: string[]; lv: number }[] = [
  { s: 'My grandad (who is eighty-two) still goes running.', p: 'who is eighty-two', w: ['My grandad', 'still goes running', 'running'], lv: 2 },
  { s: 'The castle - built over 600 years ago - is open to visitors.', p: 'built over 600 years ago', w: ['The castle', 'is open to visitors', 'visitors'], lv: 2 },
  { s: 'Our teacher, Mr Okafor, has a pet tortoise.', p: 'Mr Okafor', w: ['Our teacher', 'has a pet tortoise', 'a pet tortoise'], lv: 3 },
  { s: 'The last bus (the number 47) leaves at midnight.', p: 'the number 47', w: ['The last bus', 'leaves at midnight', 'midnight'], lv: 2 },
  { s: 'Beatrice - quick-witted as ever - mocks Benedick again.', p: 'quick-witted as ever', w: ['Beatrice', 'mocks Benedick again', 'Benedick'], lv: 3 },
  { s: 'The film, which lasted three hours, was worth every minute.', p: 'which lasted three hours', w: ['The film', 'was worth every minute', 'every minute'], lv: 3 },
  { s: 'Scrooge (a miserly old businessman) hates Christmas.', p: 'a miserly old businessman', w: ['Scrooge', 'hates Christmas', 'Christmas'], lv: 2 },
]

const BRACKETS: MC[] = [
  { q: 'Which sentence uses brackets correctly?', a: 'The castle (built in 1350) is open to visitors.', w: ['The castle built (in 1350 is open) to visitors.', 'The (castle built in 1350) is open to visitors.', 'The castle (built in 1350 is open to visitors).'], hint: 'Take out the words in brackets. Does the sentence still make sense?', ex: 'Remove "(built in 1350)" and "The castle is open to visitors" still makes sense.', lv: 2 },
  { q: 'Which sentence uses brackets correctly?', a: 'My best friend (who hates spiders) screamed.', w: ['My best (friend who hates spiders) screamed.', 'My best friend who (hates spiders screamed).', '(My best friend who hates) spiders screamed.'], hint: 'The bracketed words must be removable.', ex: 'Without the brackets: "My best friend screamed." - still a complete sentence.', lv: 2 },
  { q: 'Which sentence uses dashes correctly for parenthesis?', a: 'The old house - empty for years - was finally sold.', w: ['The old - house empty for years - was finally sold.', 'The old house - empty for years was - finally sold.', 'The - old house empty - for years was finally sold.'], hint: 'Which words could be lifted out?', ex: 'Remove "- empty for years -" and the sentence still works.', lv: 3 },
  { q: 'Which pair of punctuation marks could replace the brackets in: "The match (our last of the season) ended in a draw."?', a: 'a pair of dashes', w: [{ label: 'a pair of semicolons', feedback: 'Semicolons join main clauses; they do not mark parenthesis.' }, { label: 'a pair of colons', feedback: 'Colons introduce lists or explanations.' }, { label: 'a pair of apostrophes', feedback: 'Apostrophes show possession or missing letters.' }], hint: 'Parenthesis can be shown three ways.', ex: 'Parenthesis can be marked with brackets, dashes or commas.', lv: 3 },
  { q: 'Which sentence uses a single dash for effect correctly?', a: 'I opened the box - it was empty.', w: ['I opened - the box it was empty.', 'I - opened the box it was empty.', 'I opened the box it - was empty.'], hint: 'A single dash adds a pause before a twist or a final thought.', ex: 'The dash creates a pause before the surprising reveal.', lv: 4 },
]

const ELLIPSIS: Example[] = [
  { text: 'I opened the door and there, in the darkness, was...', a: 'to build suspense', why: 'The sentence stops before the reveal, leaving the reader in suspense.', lv: 2 },
  { text: '"I was going to tell you, but... never mind."', a: 'to show hesitation or trailing off', why: 'The speaker hesitates and changes their mind.', lv: 2 },
  { text: 'Scrooge is "a squeezing, wrenching ... covetous, old sinner".', a: 'to show words have been left out of a quotation', why: 'Some words of the original quotation ("grasping, scraping, clutching") have been missed out.', lv: 4 },
  { text: '"Well... I suppose I could help," Josh mumbled.', a: 'to show hesitation or trailing off', why: 'Josh pauses, unsure.', lv: 3 },
  { text: 'The footsteps came closer... and closer... and closer...', a: 'to build suspense', why: 'The pauses slow the reader down and build tension.', lv: 3 },
]

const parenthesisGenerators: ItemGenerator[] = [
  G('paren.find', 'punctuation.parenthesis', [1, 4], (rng, d) => {
    const r = rng.pick(atLevel(PAREN, d))
    return choice({
      rng,
      prompt: `Which words are the parenthesis (extra information) in this sentence?\n${r.s}`,
      correct: r.p,
      wrong: r.w.map((w) => ({ label: w, feedback: 'Take those words out and the sentence no longer works, so they are not the parenthesis.' })),
      hint: 'Parenthesis is the part you could lift out and still have a complete sentence.',
      explanation: `"${r.p}" is extra information; the sentence makes sense without it.`,
    })
  }),
  bankGen('paren.brackets', 'punctuation.parenthesis', [2, 5], BRACKETS),
  classifyGen('paren.ellipsis', 'punctuation.parenthesis', [2, 5], {
    rows: ELLIPSIS,
    cats: {
      'to build suspense': 'An ellipsis can stop a sentence before a reveal to create suspense.',
      'to show hesitation or trailing off': 'In speech, an ellipsis can show someone hesitating or trailing off.',
      'to show words have been left out of a quotation': 'In a quotation, an ellipsis shows words have been missed out.',
    },
    prompt: (e) => `What is the ellipsis (...) doing here?\n${e.text}`,
    hint: 'Is it in someone\'s speech, in a quotation, or at a tense moment in a story?',
    keepOrder: true,
  }),
]

export const punctuationGenerators: ItemGenerator[] = [...sentenceBasicGenerators, ...commaGenerators, ...apostropheGenerators, ...speechGenerators, ...colonGenerators, ...parenthesisGenerators]

