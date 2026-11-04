import type { ItemGenerator } from '@/engine/registry'
import { choice, passage } from '../kit'
import { G, atLevel, bankGen, classifyGen, revealGen, sample, termMatchGen, type Example, type MC, type Task, type Term } from './helpers'
import { PASSAGES, type ReadSkill } from './passages'

/** Questions on the shared reading passages, filtered by the reading skill they practise. */
function passageGen(id: string, skill: string, sk: ReadSkill, levels: [number, number]): ItemGenerator {
  const rows = PASSAGES.flatMap((p) => p.qs.filter((x) => x.sk === sk).map((x) => ({ ...x, fig: p.fig })))
  return G(id, skill, levels, (rng, d) => {
    const r = rng.pick(atLevel(rows, d))
    return choice({ rng, prompt: r.q, correct: r.a, wrong: sample(rng, r.w, 3), hint: r.hint, explanation: r.ex, figure: r.fig })
  })
}

const fig = (id: string) => PASSAGES.find((p) => p.id === id)!.fig
const ORIGINAL_PAIR = 'Original texts written for HomeQuest'

// =====================================================================================================
// Fact and opinion
// =====================================================================================================

const FACT_OPINION: Example[] = [
  { text: 'Charles Dickens wrote A Christmas Carol.', a: 'fact', why: 'This can be checked and proved true.', lv: 1 },
  { text: 'A Christmas Carol is the best story ever written.', a: 'opinion', why: '"The best" is a judgement; people may disagree.', lv: 1 },
  { text: 'A sonnet has fourteen lines.', a: 'fact', why: 'This can be checked.', lv: 2 },
  { text: 'Homework is a complete waste of time.', a: 'opinion', why: 'This is a judgement that people disagree about.', lv: 1 },
  { text: 'London is the capital of the United Kingdom.', a: 'fact', why: 'This can be checked.', lv: 1 },
  { text: 'Summer is the most enjoyable season.', a: 'opinion', why: '"Most enjoyable" is a personal view.', lv: 1 },
  { text: 'Water freezes at 0 degrees Celsius.', a: 'fact', why: 'This can be tested and proved.', lv: 2 },
  { text: 'Everyone should learn to play a musical instrument.', a: 'opinion', why: '"Should" introduces a view about what is right, which can be argued with.', lv: 3 },
  { text: 'The Globe Theatre was built in 1599.', a: 'fact', why: 'This is a date that can be checked in historical records.', lv: 3 },
  { text: 'Shakespeare\'s comedies are funnier than his tragedies.', a: 'opinion', why: 'Whether something is funny is a judgement.', lv: 2 },
  { text: 'Dogs make better pets than cats.', a: 'opinion', why: '"Better" is a judgement.', lv: 2 },
  { text: 'There are seven days in a week.', a: 'fact', why: 'This can be checked.', lv: 1 },
  { text: 'The new library is a beautiful building.', a: 'opinion', why: '"Beautiful" is a matter of taste.', lv: 2 },
  { text: 'Most of the pupils surveyed said they preferred a later start time.', a: 'fact', why: 'It reports what a survey found, which can be checked. (What the pupils prefer is their opinion, but the statement that they said it is a fact.)', lv: 5 },
  { text: 'It is obvious that school uniform improves behaviour.', a: 'opinion', why: '"It is obvious that" makes it sound certain, but it is a claim people dispute.', lv: 4 },
  { text: 'Victoria became queen in 1837.', a: 'fact', why: 'This is a date that can be checked.', lv: 3 },
]

const OPINION_WORD: MC[] = [
  { q: 'Which word shows that this is an opinion?\nThe best way to travel is by train.', a: 'best', w: ['travel', 'train', 'way'], hint: 'Which word is a judgement?', ex: '"Best" is a judgement that others could disagree with.', lv: 1 },
  { q: 'Which word shows the writer\'s opinion?\nSadly, the old cinema is closing.', a: 'Sadly', w: ['old', 'cinema', 'closing'], hint: 'Which word shows how the writer feels?', ex: '"Sadly" shows the writer\'s feeling about the fact.', lv: 2 },
  { q: 'Which word shows the writer\'s opinion?\nThe ridiculous new rule starts on Monday.', a: 'ridiculous', w: ['new', 'rule', 'Monday'], hint: 'Which word is a judgement?', ex: '"Ridiculous" is the writer\'s judgement; "new" can be checked.', lv: 2 },
  { q: 'Which word shows the writer\'s opinion?\nThe park has a stunning lake and two tennis courts.', a: 'stunning', w: ['two', 'lake', 'tennis'], hint: 'Which can\'t be measured?', ex: '"Stunning" is a judgement.', lv: 2 },
  { q: 'This sentence mixes fact and opinion. Which part is the opinion?\nThe museum, which opened in 2010, is the most exciting place in town.', a: 'is the most exciting place in town', w: ['The museum', 'which opened in 2010', 'opened in 2010'], hint: 'Which part can\'t be checked?', ex: 'The opening date can be checked; "most exciting" is a judgement.', lv: 4 },
  { q: 'This sentence mixes fact and opinion. Which part is the opinion?\nThe match, watched by 40,000 fans, was a thrilling spectacle.', a: 'was a thrilling spectacle', w: ['watched by 40,000 fans', 'The match', '40,000 fans'], hint: 'Which part is a judgement?', ex: 'The crowd figure can be checked; "thrilling" is a judgement.', lv: 4 },
  { q: 'Why might a persuasive writer present an opinion as if it were a fact, e.g. "Everyone knows that..."?', a: 'To make the opinion seem certain and harder to argue with.', w: ['To make the writing more informal.', 'To show they are unsure.', 'Because facts are always shorter.'], hint: 'How does "Everyone knows" make you feel?', ex: 'Presenting opinions as certainties pressures the reader to agree.', lv: 5 },
]

// =====================================================================================================
// Summarising
// =====================================================================================================

const SUMMARY: MC[] = [
  {
    q: 'Which is the best summary of this paragraph?\nHedgehogs are in trouble in Britain. Their numbers have fallen sharply in recent decades. Busy roads, tidy gardens with no hiding places and fences they cannot get through all make life harder for them.',
    a: 'Hedgehogs are declining in Britain because modern roads, gardens and fences make life hard for them.',
    w: [{ label: 'Hedgehogs cannot get through fences.', feedback: 'That is one detail, not the main idea.' }, { label: 'Hedgehogs are becoming more common in tidy gardens.', feedback: 'The paragraph says the opposite.' }, { label: 'Roads in Britain are very busy.', feedback: 'That is a detail, and it is not what the paragraph is about.' }],
    hint: 'A summary gives the main point and the main reasons, briefly.',
    ex: 'The main idea is the decline; the reasons are roads, tidy gardens and fences.',
    lv: 2,
  },
  {
    q: 'Which is the best summary of this paragraph?\nBefore the exam, Leo made a timetable. He revised for half an hour each evening, tested himself with flashcards and went to bed early. On the day, he felt calm and ready.',
    a: 'Leo prepared carefully for the exam, so he felt ready.',
    w: [{ label: 'Leo used flashcards.', feedback: 'True, but only one detail.' }, { label: 'Leo was nervous and unprepared.', feedback: 'He felt "calm and ready".' }, { label: 'Leo went to bed early every night of his life.', feedback: 'That goes beyond the paragraph.' }],
    hint: 'What is the paragraph about overall?',
    ex: 'All the details add up to careful preparation, which made him feel ready.',
    lv: 1,
  },
  {
    q: 'Which is the best summary of this paragraph?\nThe Globe Theatre was open to the sky. Plays were performed in the afternoon, using daylight. Poorer audience members, called groundlings, stood in the yard, while richer people paid more to sit in the covered galleries.',
    a: 'The Globe was an open-air theatre where audiences were divided by how much they paid.',
    w: [{ label: 'Groundlings stood in the yard.', feedback: 'Only one detail.' }, { label: 'Plays at the Globe were performed at night by candlelight.', feedback: 'They used daylight in the afternoon.' }, { label: 'Rich people liked plays more than poor people.', feedback: 'The paragraph does not say this.' }],
    hint: 'Combine the two main ideas: the building, and the audience.',
    ex: 'It covers both main points without listing every detail.',
    lv: 3,
  },
  {
    q: 'Which is the best summary of this paragraph?\nSome people argue that screens harm children\'s sleep. Others point out that screens can help with learning and staying in touch with friends. The truth probably depends on how, and how much, they are used.',
    a: 'Screens have both drawbacks and benefits, and their effect depends on how they are used.',
    w: [{ label: 'Screens harm children\'s sleep.', feedback: 'That is only one side of the argument.' }, { label: 'Screens should be banned for children.', feedback: 'The paragraph does not argue this.' }, { label: 'Children use screens to talk to friends.', feedback: 'Only one detail.' }],
    hint: 'This paragraph is balanced. Your summary should be too.',
    ex: 'A good summary keeps the balance: both sides, and the conclusion.',
    lv: 4,
  },
  {
    q: 'Which is the best summary of this paragraph?\nAt first the village ignored the stranger. Then a child shared her lunch with him. Soon others brought blankets and soup, and by winter he had become part of the village.',
    a: 'A stranger was gradually welcomed into the village, starting with one child\'s kindness.',
    w: [{ label: 'A child shared her lunch.', feedback: 'That is one event, not the whole paragraph.' }, { label: 'The village never accepted the stranger.', feedback: 'By winter he had become part of the village.' }, { label: 'The villagers brought soup in winter.', feedback: 'A detail, not the main idea.' }],
    hint: 'How does the situation change from start to end?',
    ex: 'The summary captures the change and what started it.',
    lv: 3,
  },
  {
    q: 'Which is the best summary of this paragraph?\nBees do far more than make honey. As they move between flowers, they carry pollen, which many plants need in order to produce fruit and seeds. Without pollinators like bees, many of the crops we eat would be much harder to grow.',
    a: 'Bees matter because they pollinate plants, including many food crops.',
    w: [{ label: 'Bees make honey.', feedback: 'The paragraph says they do far MORE than this.' }, { label: 'Bees move between flowers.', feedback: 'A detail, not the main point.' }, { label: 'Many crops are hard to grow.', feedback: 'Only true without pollinators: the main idea is about bees.' }],
    hint: 'What is the paragraph\'s main message about bees?',
    ex: 'The key idea is pollination and why it matters for food.',
    lv: 4,
  },
  {
    q: 'Which would be the best headline for this article?\nVolunteers from Oakfield spent Saturday clearing litter from the river bank. In five hours they filled forty bags, and a family of ducks has already been seen returning to the cleaner water.',
    a: 'Volunteers clean up river - and the ducks come back',
    w: [{ label: 'Ducks seen on river', feedback: 'That misses the main story: the clean-up.' }, { label: 'Forty bags', feedback: 'Too vague: forty bags of what?' }, { label: 'Litter is a problem everywhere', feedback: 'Too general, and not what this article reports.' }],
    hint: 'A headline sums up the main story in a few words.',
    ex: 'It covers the main event and its result.',
    lv: 2,
  },
  {
    q: 'What is the main idea of this paragraph?\nIn Much Ado About Nothing, Beatrice and Benedick insult each other whenever they meet. Yet each is secretly interested in the other, and their friends only need to give them a small push for their feelings to come out.',
    a: 'Beatrice and Benedick argue on the surface but are drawn to each other underneath.',
    w: [{ label: 'Beatrice and Benedick hate each other.', feedback: 'That is only the surface; the paragraph says more.' }, { label: 'Their friends insult them.', feedback: 'Their friends push them together.' }, { label: 'Beatrice is the main character.', feedback: 'The paragraph is about both of them.' }],
    hint: 'Look at "Yet": what does it turn to?',
    ex: 'The "Yet" shows the main idea: arguments on the surface, attraction underneath.',
    lv: 5,
  },
]

// =====================================================================================================
// Structure
// =====================================================================================================

const STRUCTURE_TERMS: Term[] = [
  { term: 'foreshadowing', def: 'hints early in a text about what will happen later', lv: 2 },
  { term: 'flashback', def: 'a jump back in time to earlier events', lv: 2 },
  { term: 'cyclical structure', def: 'the ending returns to the opening (comes full circle)', lv: 3 },
  { term: 'in medias res', def: 'starting in the middle of the action', lv: 4 },
  { term: 'cliffhanger', def: 'ending a section on an unresolved, suspenseful moment', lv: 2 },
  { term: 'shift in focus', def: 'a move to a different character, place, time or idea', lv: 3 },
  { term: 'exposition', def: 'the opening part that introduces the setting and characters', lv: 4 },
  { term: 'climax', def: 'the most dramatic or tense point of the story', lv: 2 },
  { term: 'resolution', def: 'the end, where the main problem is sorted out', lv: 3 },
  { term: 'zooming in', def: 'moving from a wide view of a scene to a close-up detail', lv: 4 },
]

const STRUCTURE_EXAMPLES: Example[] = [
  { text: 'A story begins and ends with a girl standing on the same beach at sunset.', a: 'cyclical structure', why: 'Returning to the same image at the end is a cyclical structure.', lv: 2 },
  { text: 'In chapter one, a character notices a crack in the dam. In chapter ten, the dam bursts.', a: 'foreshadowing', why: 'The crack hints at the disaster to come.', lv: 2 },
  { text: 'The story suddenly jumps back forty years to when the old man was a boy.', a: 'flashback', why: 'Going back in time to earlier events is a flashback.', lv: 2 },
  { text: 'The novel opens in the middle of a car chase, before we know who anyone is.', a: 'in medias res', why: 'Starting mid-action is in medias res ("into the middle of things").', lv: 3 },
  { text: 'The chapter ends with a knock at the door, and we do not find out who it is.', a: 'cliffhanger', why: 'Ending on an unanswered, tense moment is a cliffhanger.', lv: 2 },
  { text: 'The writer describes the whole valley, then the village, then a single lit window.', a: 'zooming in', why: 'Moving from wide to narrow is zooming in.', not: ['shift in focus'], lv: 4 },
  { text: 'Halfway through, the narrative leaves the hero and follows the villain instead.', a: 'shift in focus', why: 'Moving to a different character is a shift in focus.', lv: 3 },
  { text: 'Early on, a fortune-teller warns the hero to "beware the water".', a: 'foreshadowing', why: 'The warning hints at something later.', lv: 3 },
]

const PURPOSE: Example[] = [
  { text: 'Preheat the oven to 180°C. Beat the eggs and sugar together until pale.', a: 'to instruct', why: 'Step-by-step imperatives tell the reader how to do something.', not: ['to advise', 'to inform'], lv: 1 },
  { text: "Don't miss out! Join the Eco Club today and help save our planet!", a: 'to persuade', why: 'It urges the reader to act, using exclamations and emotive language.', not: ['to argue', 'to advise'], lv: 1 },
  { text: 'The River Thames flows through London and out into the North Sea.', a: 'to inform', why: 'It gives factual information.', not: ['to explain', 'to describe'], lv: 1 },
  { text: 'If you feel nervous before an exam, try taking slow, deep breaths and getting a good night\'s sleep.', a: 'to advise', why: 'It offers helpful suggestions ("try...").', not: ['to instruct', 'to persuade'], lv: 2 },
  { text: 'Rain forms when water vapour in clouds cools and condenses into droplets that become too heavy to stay in the air.', a: 'to explain', why: 'It explains how something happens.', not: ['to inform'], lv: 3 },
  { text: 'Once upon a time, in a kingdom by the sea, there lived a dragon who was afraid of the dark.', a: 'to entertain', why: 'It begins a story to entertain the reader.', not: ['to describe'], lv: 1 },
  { text: 'Some say homework helps pupils learn; others say it causes stress. On balance, I believe a small amount is useful.', a: 'to argue', why: 'It weighs up both sides and reaches a reasoned view.', not: ['to persuade'], lv: 4 },
  { text: 'The ancient oak stood alone on the hill, its gnarled branches twisted against the grey sky.', a: 'to describe', why: 'It creates a picture of a place.', not: ['to entertain'], lv: 3 },
  { text: 'Visit Sunnyvale Zoo: the most amazing day out in the county!', a: 'to persuade', why: 'It tries to make the reader visit, using superlatives.', not: ['to argue', 'to advise'], lv: 2 },
  { text: 'The library is open from 9am to 5pm, Monday to Saturday.', a: 'to inform', why: 'It gives factual information.', not: ['to explain', 'to describe'], lv: 1 },
  { text: 'Volcanoes erupt because pressure builds up as molten rock rises from deep underground.', a: 'to explain', why: 'It explains why something happens ("because...").', not: ['to inform'], lv: 3 },
]

const AUDIENCE_VIEW: MC[] = [
  { q: 'Who is the most likely audience for this?\n"Hey guys! Check out the coolest new trainers - your mates will be SO jealous!"', a: 'teenagers', w: ['business owners', 'young children who cannot read yet', 'retired head teachers'], hint: 'Who talks like this?', ex: 'Slang ("guys", "mates") and the subject (trainers) target teenagers.', lv: 1 },
  { q: 'Who is the most likely audience for this?\n"Dear parents and carers, please ensure your child brings a packed lunch on Friday."', a: 'parents of pupils at a school', w: ['the pupils\' teachers', 'a football team', 'tourists'], hint: 'Look at the greeting.', ex: 'It is addressed to parents and carers.', lv: 1 },
  { q: 'What is the writer\'s attitude to the new car park?\n"The council has bulldozed our only green space to build yet another grey, soulless car park."', a: 'angry and disapproving', w: ['pleased and excited', 'neutral and factual', 'confused'], hint: 'Look at "bulldozed", "soulless", "yet another".', ex: 'Negative words like "bulldozed" and "soulless" show strong disapproval.', lv: 2 },
  { q: 'What is the writer\'s attitude to the school trip?\n"The trip to the castle was, quite simply, the highlight of my year: I still smile when I think about it."', a: 'enthusiastic and fond', w: ['bored', 'critical', 'worried'], hint: '"highlight", "smile"...', ex: 'Positive language shows enthusiasm.', lv: 1 },
  { q: 'What is the writer\'s attitude to mobile phones?\n"Phones are useful, of course, but I worry we spend more time looking at screens than at each other."', a: 'mixed: sees benefits but is concerned', w: ['completely in favour', 'completely against', 'not interested'], hint: 'Notice "of course, but...".', ex: 'The writer admits they are useful but expresses worry: a balanced, mixed view.', lv: 3 },
  { q: 'What is the writer\'s attitude to the restaurant?\n"Oh yes, a delightful evening: cold soup, a forty-minute wait and a waiter who seemed to have forgotten we existed."', a: 'sarcastic and critical', w: ['genuinely delighted', 'neutral', 'grateful'], hint: 'Does "delightful" really mean delightful here?', ex: 'The praise is sarcastic: the details are all complaints.', lv: 4 },
  { q: 'A leaflet uses bright pictures, very short sentences and words like "fun" and "awesome". Who is it most likely for?', a: 'children', w: ['lawyers', 'scientists', 'pensioners'], hint: 'Who would these features appeal to?', ex: 'Bright pictures, short sentences and simple, lively words suit children.', lv: 2 },
  { q: 'What is the writer\'s attitude to the old pier?\n"Rust bleeds down its legs and gulls nest in its broken roof, yet I cannot walk past without remembering the summers it once gave us."', a: 'nostalgic: sad at its decay but fond of the memories', w: ['delighted it is falling apart', 'angry that it was ever built', 'completely uninterested'], hint: 'Notice the turn at "yet".', ex: 'The writer notes its decay but remembers it fondly: nostalgia.', lv: 5 },
]

// =====================================================================================================
// Narrative voice
// =====================================================================================================

const VOICE_EX: Example[] = [
  { text: 'I pulled my hood up and ran for the bus.', a: 'first person', why: '"I" and "my": first person.', lv: 1 },
  { text: 'You open the door. The room is dark, and you hear breathing.', a: 'second person', why: '"You" puts the reader in the story: second person.', lv: 2 },
  { text: 'She pulled her hood up and ran for the bus.', a: 'third person', why: '"She" and "her": third person.', lv: 1 },
  { text: 'We had never seen snow like it.', a: 'first person', why: '"We" is first person (plural).', lv: 2 },
  { text: 'The twins crept downstairs. They were sure they had heard something.', a: 'third person', why: '"They": third person.', lv: 1 },
  { text: 'You will need to be brave, because what you are about to see will change everything.', a: 'second person', why: 'Addressed to "you" as the main character: second person.', lv: 3 },
  { text: 'My grandfather told me the story every winter, and I never tired of it.', a: 'first person', why: '"My", "me", "I": first person.', lv: 2 },
]

const VOICE_TYPES: MC[] = [
  { q: 'Which description fits an OMNISCIENT narrator?', a: 'A narrator who knows the thoughts and feelings of every character', w: [{ label: 'A narrator who only knows what one character knows', feedback: 'That is a limited narrator.' }, { label: 'A character telling their own story as "I"', feedback: 'That is a first-person narrator.' }, { label: 'A narrator who lies to the reader', feedback: 'That is an unreliable narrator.' }], hint: '"Omni" means all.', ex: 'Omniscient means all-knowing.', lv: 2 },
  { q: 'What is an unreliable narrator?', a: 'A narrator whose account we cannot fully trust', w: ['A narrator who is never named', 'A narrator who speaks in the second person', 'A narrator who knows everything'], hint: 'Reliable = trustworthy.', ex: 'An unreliable narrator might be lying, confused or biased.', lv: 3 },
  { q: '"Marcus wondered whether his sister would forgive him. Across town, his sister was already planning her revenge." What kind of narrator is this?', a: 'third-person omniscient', w: [{ label: 'third-person limited', feedback: 'A limited narrator would only know Marcus\'s side.' }, { label: 'first person', feedback: 'There is no "I".' }, { label: 'second person', feedback: 'There is no "you".' }], hint: 'Does the narrator know what is happening in two places and two heads?', ex: 'The narrator knows both Marcus\'s thoughts and his sister\'s plans: omniscient.', lv: 4 },
  { q: 'What is one advantage of a first-person narrator?', a: 'The reader gets close to the narrator\'s own thoughts and feelings.', w: ['The reader learns every character\'s secret thoughts.', 'The narrator is always completely reliable.', 'It is the only way to write dialogue.'], hint: 'Whose head are we in?', ex: 'First person brings us close to one character\'s inner life, though we only see their view.', lv: 3 },
  { q: '"I\'m not a thief. I just borrowed the bike - I was going to put it back, honestly. Probably." What does the last word suggest about the narrator?', a: 'The narrator may be unreliable.', w: ['The narrator is omniscient.', 'The narrator is very honest.', 'The narrator is in the second person.'], hint: 'Can we trust them?', ex: '"Probably" undermines the narrator\'s claim: we start to doubt them.', lv: 5 },
  { q: 'A story follows only Leah\'s thoughts, using "she": we never learn what others are thinking. What kind of narrator is this?', a: 'third-person limited', w: ['third-person omniscient', 'first person', 'second person'], hint: 'Whose thoughts do we get?', ex: 'Third person ("she"), limited to one character\'s thoughts.', lv: 4 },
]

// =====================================================================================================
// Comparing texts (Year 9)
// =====================================================================================================

const PAIR_ZOO = passage(
  `TEXT A
What a day! The red pandas tumbled over each other like clumsy toddlers, the keeper's talk taught me things I never knew, and the money from our tickets helps protect animals in the wild. I left the zoo feeling hopeful.

TEXT B
I used to love zoos. Now, watching a tiger pace the same few metres of concrete, over and over, I feel only sadness. Some zoos do vital conservation work, but no enclosure can replace the wild.`,
  { title: 'Two views of zoos', source: ORIGINAL_PAIR },
)
const PAIR_SNOW = passage(
  `TEXT A
Snow! I pressed my nose to the glass. The whole street had vanished under a thick white blanket, and the radio said the magic words: school closed. By nine o'clock we had built a snowman taller than Dad.

TEXT B
The 7.42 was cancelled, then the 8.15. I stood on the platform for an hour, my feet slowly turning to ice, while the announcer apologised again and again. By the time I reached the office, I had missed the meeting entirely.`,
  { title: 'Two snow days', source: ORIGINAL_PAIR },
)
const PAIR_CITY = passage(
  `TEXT A
The city never sleeps, and neither do I. I love the hum of traffic, the glow of late-night cafés and the thrill of a thousand strangers' stories passing me on the pavement.

TEXT B
After a week in the city, I longed for silence. The noise never stopped; even at midnight, sirens wailed. I missed the hills, where the loudest sound is the wind in the grass.`,
  { title: 'Two views of the city', source: ORIGINAL_PAIR },
)


const COMPARE: MC[] = [
  { fig: PAIR_ZOO, q: 'What do BOTH writers agree about?', a: 'Zoos can help protect animals.', w: [{ label: 'Zoos are cruel.', feedback: 'Only Text B leans this way.' }, { label: 'Red pandas are clumsy.', feedback: 'Only Text A mentions red pandas.' }, { label: 'Zoos should be closed.', feedback: 'Neither writer says this.' }], hint: 'Find a point mentioned in both texts.', ex: 'Text A: tickets "help protect animals in the wild"; Text B: "Some zoos do vital conservation work".', lv: 3 },
  { fig: PAIR_ZOO, q: 'How do the writers\' attitudes to zoos differ?', a: 'Text A is enthusiastic; Text B is saddened and doubtful.', w: ['Text A is angry; Text B is excited.', 'Both are equally enthusiastic.', 'Text A is doubtful; Text B is hopeful.'], hint: 'Look at the last sentence of each.', ex: 'A leaves "feeling hopeful"; B feels "only sadness".', lv: 2 },
  { fig: PAIR_ZOO, q: 'Which quotation from Text B best contrasts with Text A\'s joyful red pandas?', a: '"watching a tiger pace the same few metres of concrete, over and over"', w: ['"I used to love zoos."', '"Some zoos do vital conservation work"', '"no enclosure can replace the wild"'], hint: 'Find an image of an animal in Text B.', ex: 'The pacing tiger is a sad image of an animal, contrasting with the playful pandas.', lv: 4 },
  { fig: PAIR_SNOW, q: 'How do the two writers feel about the snow?', a: 'Text A is delighted; Text B is frustrated.', w: ['Both are delighted.', 'Both are frustrated.', 'Text A is frustrated; Text B is delighted.'], hint: 'What does the snow lead to in each text?', ex: 'A gets a day off and builds a snowman; B is stuck on a platform and misses a meeting.', lv: 2 },
  { fig: PAIR_SNOW, q: 'Which is the main reason their views differ?', a: 'The snow brings one writer freedom and the other disruption.', w: ['One writer lives somewhere warmer.', 'One writer has never seen snow.', 'Text B is written in the future.'], hint: 'What does the snow mean for each person\'s day?', ex: 'For a child it means "school closed"; for a commuter it means cancelled trains.', lv: 3 },
  { fig: PAIR_SNOW, q: 'Which quotation from Text A contrasts most with "my feet slowly turning to ice" in Text B?', a: '"a thick white blanket"', w: ['"The 7.42 was cancelled"', '"I pressed my nose to the glass"', '"the radio said"'], hint: 'Look for an image of the snow that sounds comforting.', ex: 'A "blanket" makes the snow sound soft and cosy; B\'s image makes it painful.', lv: 4 },
  { fig: PAIR_CITY, q: 'How do both writers present the noise of the city?', a: 'A finds it exciting; B finds it exhausting.', w: ['Both find it relaxing.', 'Neither mentions noise.', 'A finds it exhausting; B finds it exciting.'], hint: 'Compare "hum of traffic" with "sirens wailed".', ex: '"The hum" and "the thrill" are positive; "sirens wailed" and "longed for silence" are negative.', lv: 3 },
  { fig: PAIR_CITY, q: 'Which comparative connective best introduces a DIFFERENCE between the texts?', a: 'whereas', w: [{ label: 'similarly', feedback: '"Similarly" introduces a similarity.' }, { label: 'likewise', feedback: '"Likewise" introduces a similarity.' }, { label: 'in the same way', feedback: 'That introduces a similarity.' }], hint: 'Which word signals contrast?', ex: '"Whereas" contrasts: "Text A loves the noise, whereas Text B longs for silence."', lv: 2 },
  { q: 'Which connective introduces a SIMILARITY between two texts?', a: 'similarly', w: [{ label: 'however', feedback: '"However" signals a contrast.' }, { label: 'on the other hand', feedback: 'That signals a contrast.' }, { label: 'in contrast', feedback: 'That signals a contrast.' }], hint: 'Which one means "in the same way"?', ex: '"Similarly" shows a similarity.', lv: 1 },
  { q: 'Which sentence is the best COMPARISON of two texts?', a: 'Text A presents the city as exciting, whereas Text B presents it as draining.', w: [{ label: 'Text A is about the city. Text B is also about the city.', feedback: 'This identifies the topic but does not compare viewpoints or methods.' }, { label: 'I prefer Text A.', feedback: 'That is a personal preference, not a comparison.' }, { label: 'Text B mentions sirens.', feedback: 'That only describes one text.' }], hint: 'A good comparison links both texts in one sentence with a connective.', ex: 'It compares viewpoints in both texts, linked by "whereas".', lv: 3 },
]

// =====================================================================================================
// Written answers
// =====================================================================================================

const READING_TASKS: Task[] = [
  {
    fig: fig('scrooge'),
    prompt: 'How does Dickens use language to present Scrooge as cold and unkind? Write a short paragraph.',
    model: 'Dickens presents Scrooge as cold-hearted by linking him to cold again and again. The simile "Hard and sharp as flint" suggests he is unyielding and could hurt people. The list of verbs "squeezing, wrenching, grasping, scraping, clutching" shows his greed, as if he is always grabbing money. Dickens even says that "The cold within him froze his old features", which suggests his coldness comes from inside: he has no warmth or kindness for anyone.',
    checklist: ['Makes a clear point about Scrooge', 'Uses at least one short quotation', 'Names a technique (e.g. simile, list, metaphor)', 'Explains what a word or phrase suggests', 'Makes a second point with evidence'],
  },
  {
    fig: fig('storm'),
    prompt: 'How does the writer build tension in "The Lighthouse"? Write a short paragraph.',
    model: 'The writer builds tension by moving from calm to danger. At first "The sea lay flat and silver", but by noon a "bruise-coloured cloud crept over the horizon", and the verb "crept" makes the storm seem like a predator. The short sentence "The gulls fell silent" creates an eerie pause. Finally, the extract ends with the minor sentence "A boat.", a cliffhanger that leaves the reader worried that someone is in danger.',
    checklist: ['Comments on how the extract changes from calm to storm', 'Uses at least one quotation', 'Explains the effect of a word or image', 'Comments on a sentence or structural choice (e.g. the short final sentence)'],
  },
  {
    fig: fig('market'),
    prompt: 'What impression do you get of Mr Ellis? Use evidence from the text.',
    model: 'Mr Ellis seems calm, loyal and content. He sits "away from the noise", which suggests he prefers peace to the busy crowd. He has been there "every Saturday for forty years", showing great loyalty to the market. Although "He sells almost nothing", "He does not seem to mind", so I think he comes for the routine and the place rather than for money.',
    checklist: ['Gives a clear impression (an adjective about him)', 'Supports it with a quotation', 'Explains what the quotation suggests', 'Gives a second impression or develops the first'],
  },
  {
    fig: fig('convict'),
    prompt: 'How does Dickens make the man seem frightening but also pitiful? Write a short paragraph.',
    model: 'The man is frightening because he "glared, and growled", verbs that make him sound like a wild animal, and because he "seized me by the chin". However, Dickens also makes us pity him. He has been "soaked in water, and smothered in mud, and lamed by stones", and the repeated "and" piles up his suffering. He "shivered" and his "teeth chattered", which shows he is cold and desperate as well as dangerous.',
    checklist: ['Explains why he seems frightening, with evidence', 'Explains why he seems pitiful, with evidence', 'Comments on a language choice (verbs, repetition, list)', 'Uses a connective to show the contrast (however, but)'],
  },
  {
    fig: PAIR_ZOO,
    prompt: 'Compare how the two writers present zoos. Write a short comparative paragraph.',
    model: 'Both writers accept that zoos can help animals, but their overall views are very different. Text A presents the zoo as joyful, describing red pandas tumbling "like clumsy toddlers", a playful simile. In contrast, Text B focuses on a tiger pacing "the same few metres of concrete, over and over", which makes the animal seem trapped and miserable. Whereas Writer A leaves "feeling hopeful", Writer B feels "only sadness".',
    checklist: ['Identifies a similarity between the texts', 'Identifies a difference in viewpoint', 'Uses a quotation from each text', 'Uses comparative connectives (whereas, in contrast, both, similarly)'],
  },
]

export const readingGenerators: ItemGenerator[] = [
  passageGen('reading.retrieve', 'reading.retrieval', 'retrieval', [1, 4]),
  passageGen('reading.infer', 'reading.inference', 'inference', [2, 5]),
  passageGen('reading.evidence', 'reading.quotations', 'quotations', [2, 4]),
  passageGen('reading.language', 'reading.language-analysis', 'language', [2, 5]),
  passageGen('reading.structure-passage', 'reading.structure', 'structure', [2, 5]),
  passageGen('reading.voice-passage', 'reading.narrative-voice', 'voice', [1, 4]),
  classifyGen('reading.fact-or-opinion', 'reading.fact-opinion', [1, 5], {
    rows: FACT_OPINION,
    cats: { fact: 'A fact can be checked and proved true or false.', opinion: 'An opinion is a belief or judgement that people could disagree with.' },
    prompt: (e) => `Is this a fact or an opinion?\n${e.text}`,
    hint: 'Could you check it in a reference book, or might someone reasonably disagree?',
    keepOrder: true,
  }),
  bankGen('reading.opinion-words', 'reading.fact-opinion', [1, 5], OPINION_WORD),
  bankGen('reading.summary', 'reading.summarising', [1, 5], SUMMARY),
  termMatchGen('reading.structure-terms', 'reading.structure', [1, 4], STRUCTURE_TERMS, 'Match each structural feature to its meaning.'),
  classifyGen('reading.structure-spot', 'reading.structure', [2, 4], {
    rows: STRUCTURE_EXAMPLES,
    cats: Object.fromEntries(STRUCTURE_TERMS.map((t) => [t.term, `${t.term.charAt(0).toUpperCase()}${t.term.slice(1)} means ${t.def}.`])),
    prompt: (e) => `Which structural technique is described here?\n${e.text}`,
    hint: 'Think about time (forward or back), where the story starts and ends, and what we are left wondering.',
  }),
  classifyGen('reading.purpose', 'reading.purpose-viewpoint', [1, 4], {
    rows: PURPOSE,
    cats: {
      'to inform': 'Informing gives facts.',
      'to explain': 'Explaining tells you how or why something happens.',
      'to persuade': 'Persuading tries to make you do or believe something, often emotionally.',
      'to argue': 'Arguing presents a reasoned case, often weighing up both sides.',
      'to advise': 'Advising offers helpful suggestions.',
      'to instruct': 'Instructing tells you exactly how to do something, step by step.',
      'to entertain': 'Entertaining aims to amuse or absorb the reader, e.g. with a story.',
      'to describe': 'Describing paints a picture of a person, place or thing.',
    },
    prompt: (e) => `What is the main purpose of this text?\n${e.text}`,
    hint: 'Ask: what does the writer want the reader to do, know or feel?',
  }),
  bankGen('reading.audience-viewpoint', 'reading.purpose-viewpoint', [1, 5], AUDIENCE_VIEW),
  classifyGen('reading.person', 'reading.narrative-voice', [1, 3], {
    rows: VOICE_EX,
    cats: { 'first person': 'First person uses I / we.', 'second person': 'Second person addresses the reader as "you".', 'third person': 'Third person uses he / she / they.' },
    prompt: (e) => `Which narrative voice is used here?\n${e.text}`,
    hint: 'Look at the pronouns.',
    keepOrder: true,
  }),
  bankGen('reading.narrator-types', 'reading.narrative-voice', [2, 5], VOICE_TYPES),
  bankGen('reading.compare', 'reading.comparing', [1, 5], COMPARE),
  revealGen('reading.analyse-written', 'reading.language-analysis', [3, 5], READING_TASKS.filter((t) => t.fig !== PAIR_ZOO && !t.prompt.startsWith('What impression'))),
  revealGen('reading.infer-written', 'reading.inference', [3, 5], READING_TASKS.filter((t) => t.prompt.startsWith('What impression'))),
  revealGen('reading.compare-written', 'reading.comparing', [3, 5], [
    ...READING_TASKS.filter((t) => t.fig === PAIR_ZOO),
    {
      fig: PAIR_SNOW,
      prompt: 'Compare how the two writers present their experience of snow.',
      model: 'The two writers have opposite experiences of the same weather. For Writer A the snow is magical: it is "a thick white blanket", a comforting image, and the news "school closed" is called "the magic words". In contrast, Writer B is stuck on a platform with "my feet slowly turning to ice", which makes the snow sound painful. Whereas A\'s day is full of play, B\'s is full of delay, as trains are "cancelled" and the announcer "apologised again and again".',
      checklist: ['Clearly states how the viewpoints differ', 'Uses a quotation from each text', 'Explains the effect of an image or word in each', 'Uses comparative connectives (whereas, in contrast, similarly)'],
    },
    {
      fig: PAIR_CITY,
      prompt: 'Compare how the two writers present the city.',
      model: 'Writer A loves the city\'s energy, whereas Writer B is worn out by it. A describes "the hum of traffic", a gentle, almost musical image, and "the thrill" of passing strangers. In contrast, B hears sirens that "wailed", a verb that sounds like crying, and "longed for silence". B even compares the city with the hills, where "the loudest sound is the wind in the grass", to show what is missing.',
      checklist: ['States the difference in viewpoint', 'Uses a quotation from each text', 'Analyses a word or image', 'Uses comparative connectives'],
    },
  ]),
  revealGen('reading.structure-written', 'reading.structure', [4, 5], [
    {
      fig: fig('gate'),
      prompt: 'How has the writer structured "The Gate" to interest the reader?',
      model: 'The writer uses a cyclical structure: the story begins and ends with the squeaking gate. In between, the focus narrows from the garden, to the house full of boxes, to a single photograph, so we zoom in on Amira\'s memory. Paragraph 3 is one sentence on its own, which slows the pace for an emotional pause. Ending with "It still squeaked" echoes the opening and suggests that something of Grandma remains.',
      checklist: ['Identifies the cyclical structure', 'Comments on a shift or narrowing of focus', 'Comments on paragraph or sentence length', 'Explains the effect of the ending'],
    },
    {
      fig: fig('storm'),
      prompt: 'How has the writer structured "The Lighthouse" to build tension?',
      model: 'The extract is structured chronologically, moving from morning to noon to six o\'clock, and each step brings more danger: from a still sea, to a "bruise-coloured cloud", to the storm striking. Each paragraph opens with a time marker, which makes the storm feel like it is counting down. The final paragraph shifts the focus outward to "a tiny light", and the minor sentence "A boat." ends on a cliffhanger.',
      checklist: ['Comments on the time order (chronological structure)', 'Explains how tension increases through the extract', 'Comments on a shift in focus', 'Explains the effect of the ending'],
    },
  ]),
]
