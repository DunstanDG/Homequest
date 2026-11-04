import type { ItemGenerator } from '@/engine/registry'
import type { Figure } from '@/engine/types'
import { choice, passage, textItem } from '../kit'
import { G, atLevel, bankGen, revealGen, sample, termChoiceGen, termMatchGen, variants, type MC, type Task, type Term } from './helpers'

/** Public-domain poems, quoted from the originals. */
const P = {
  daffodils: passage(`I wandered lonely as a Cloud
That floats on high o'er vales and Hills,
When all at once I saw a crowd,
A host, of golden Daffodils;
Beside the Lake, beneath the trees,
Fluttering and dancing in the breeze.`, { title: 'I Wandered Lonely as a Cloud (first stanza)', source: 'William Wordsworth (1815 version)' }),
  london: passage(`I wander thro' each charter'd street,
Near where the charter'd Thames does flow.
And mark in every face I meet
Marks of weakness, marks of woe.

In every cry of every Man,
In every Infants cry of fear,
In every voice: in every ban,
The mind-forg'd manacles I hear`, { title: 'London (first two stanzas)', source: 'William Blake, Songs of Experience (1794)' }),
  remember: passage(`Remember me when I am gone away,
Gone far away into the silent land;
When you can no more hold me by the hand,
Nor I half turn to go yet turning stay.`, { title: 'Remember (opening lines)', source: 'Christina Rossetti (1862)' }),
  dulce: passage(`Bent double, like old beggars under sacks,
Knock-kneed, coughing like hags, we cursed through sludge,
Till on the haunting flares we turned our backs
And towards our distant rest began to trudge.
Men marched asleep. Many had lost their boots
But limped on, blood-shod. All went lame; all blind;
Drunk with fatigue; deaf even to the hoots
Of tired, outstripped Five-Nines that dropped behind.`, { title: 'Dulce et Decorum Est (first stanza)', source: 'Wilfred Owen (written 1917)' }),
  autumn: passage(`Season of mists and mellow fruitfulness,
Close bosom-friend of the maturing sun;
Conspiring with him how to load and bless
With fruit the vines that round the thatch-eves run;`, { title: 'To Autumn (opening lines)', source: 'John Keats (written 1819)' }),
  eagle: passage(`He clasps the crag with crooked hands;
Close to the sun in lonely lands,
Ring'd with the azure world, he stands.

The wrinkled sea beneath him crawls;
He watches from his mountain walls,
And like a thunderbolt he falls.`, { title: 'The Eagle', source: 'Alfred, Lord Tennyson (1851)' }),
  railway: passage(`Faster than fairies, faster than witches,
Bridges and houses, hedges and ditches;
And charging along like troops in a battle,
All through the meadows the horses and cattle:`, { title: 'From a Railway Carriage (opening lines)', source: 'Robert Louis Stevenson (1885)' }),
  sonnet18: passage(`Shall I compare thee to a summer's day?
Thou art more lovely and more temperate:
Rough winds do shake the darling buds of May,
And summer's lease hath all too short a date;`, { title: 'Sonnet 18 (opening lines)', source: 'William Shakespeare (1609)' }),
  midwinter: passage(`In the bleak midwinter, frosty wind made moan,
Earth stood hard as iron, water like a stone;
Snow had fallen, snow on snow, snow on snow,
In the bleak midwinter, long ago.`, { title: 'In the Bleak Midwinter (first stanza)', source: 'Christina Rossetti (1872)' }),
  anthem: passage(`What passing-bells for these who die as cattle?
Only the monstrous anger of the guns.
Only the stuttering rifles' rapid rattle
Can patter out their hasty orisons.`, { title: 'Anthem for Doomed Youth (opening lines)', source: 'Wilfred Owen (written 1917)' }),
  lear: passage(`There was an Old Man with a beard,
Who said, "It is just as I feared!
Two Owls and a Hen,
Four Larks and a Wren,
Have all built their nests in my beard!"`, { title: 'A limerick', source: 'Edward Lear, A Book of Nonsense (1846)' }),
  hope: passage(`"Hope" is the thing with feathers -
That perches in the soul -
And sings the tune without the words -
And never stops - at all -`, { title: '"Hope" is the thing with feathers (first stanza)', source: 'Emily Dickinson' }),
} satisfies Record<string, Figure>

// =====================================================================================================
// Terms
// =====================================================================================================

const POETRY_TERMS: Term[] = [
  { term: 'stanza', def: 'a group of lines forming a section of a poem (like a paragraph)', lv: 1 },
  { term: 'couplet', def: 'a pair of lines, usually rhyming', lv: 1 },
  { term: 'tercet', def: 'a stanza of three lines', lv: 3 },
  { term: 'quatrain', def: 'a stanza of four lines', lv: 2 },
  { term: 'refrain', def: 'a line or phrase repeated throughout a poem, like a chorus', lv: 2 },
  { term: 'rhyme', def: 'words that end with the same sound', lv: 1 },
  { term: 'internal rhyme', def: 'rhyming words within the same line', lv: 4 },
  { term: 'half rhyme', def: 'words with similar but not identical end sounds (e.g. "soul" and "all")', lv: 4 },
  { term: 'free verse', def: 'poetry with no regular rhyme scheme or metre', lv: 3 },
  { term: 'rhythm', def: 'the beat or pattern of sounds in a line', lv: 2 },
  { term: 'speaker', def: 'the voice in a poem (not necessarily the poet)', lv: 3 },
  { term: 'tone', def: 'the mood or attitude of the voice in a poem', lv: 3 },
]

const TERM_QS: MC[] = [
  { q: 'What is a four-line stanza called?', a: 'quatrain', w: ['couplet', 'tercet', 'sestet'], hint: '"Quat-" is linked to four (think "quarter").', ex: 'A quatrain has four lines.', lv: 2 },
  { q: 'What is a pair of rhyming lines called?', a: 'a couplet', w: ['a quatrain', 'a refrain', 'a stanza break'], hint: 'Think of "a couple".', ex: 'A couplet is two lines, usually rhyming.', lv: 1 },
  { q: 'A poem repeats the line "And the sea went on and on" at the end of each stanza. What is this line called?', a: 'a refrain', w: ['a couplet', 'a caesura', 'a volta'], hint: 'It works like the chorus of a song.', ex: 'A repeated line is a refrain.', lv: 2 },
  { q: 'Who is the "speaker" of a poem?', a: 'the voice telling the poem, which may not be the poet', w: ['always the poet', 'the person the poem is about', 'the person reading it aloud'], hint: 'Poets often write in a character\'s voice.', ex: 'The speaker is the "I" of the poem; it may be a character, not the poet.', lv: 3 },
  { q: '"Hope" is the thing with feathers rhymes "soul" with "all". These sound alike but do not fully rhyme. What is this called?', a: 'half rhyme', w: ['internal rhyme', 'full rhyme', 'alliteration'], hint: 'They are close, but not exact.', ex: 'Near-rhymes like soul/all are half rhymes (or slant rhymes).', lv: 4, fig: P.hope },
  { q: 'Which line contains an internal rhyme?', a: 'Once upon a midnight dreary, while I pondered, weak and weary', w: ['The sun was setting in the west', 'I walked along the empty shore', 'The trees stood still against the sky'], hint: 'Look for two rhyming words inside one line.', ex: '"Dreary" and "weary" rhyme within the same line (Poe, "The Raven").', lv: 4 },
]

// =====================================================================================================
// Rhyme schemes
// =====================================================================================================

const SCHEMES: { fig: Figure; scheme: string; ends: string; lv: number }[] = [
  { fig: P.railway, scheme: 'AABB', ends: 'witches / ditches (A), battle / cattle (B)', lv: 1 },
  { fig: P.midwinter, scheme: 'AABB', ends: 'moan / stone (A), snow / ago (B)', lv: 2 },
  { fig: P.london, scheme: 'ABAB', ends: 'street / meet (A), flow / woe (B)', lv: 2 },
  { fig: P.autumn, scheme: 'ABAB', ends: 'fruitfulness / bless (A), sun / run (B)', lv: 2 },
  { fig: P.sonnet18, scheme: 'ABAB', ends: 'day / May (A), temperate / date (B)', lv: 3 },
  { fig: P.dulce, scheme: 'ABABCDCD', ends: 'sacks / backs (A), sludge / trudge (B), boots / hoots (C), blind / behind (D)', lv: 4 },
  { fig: P.remember, scheme: 'ABBA', ends: 'away / stay (A), land / hand (B)', lv: 4 },
  { fig: P.daffodils, scheme: 'ABABCC', ends: 'Cloud / crowd (A), Hills / Daffodils (B), trees / breeze (C)', lv: 3 },
  { fig: P.eagle, scheme: 'AAABBB', ends: 'hands / lands / stands (A), crawls / walls / falls (B)', lv: 3 },
  { fig: P.lear, scheme: 'AABBA', ends: 'beard / feared / beard (A), Hen / Wren (B)', lv: 3 },
]

const SCHEME_FIX = (s: string) => [s, s.split('').join(' '), s.toLowerCase()]

// =====================================================================================================
// Forms
// =====================================================================================================

const FORM_TERMS: Term[] = [
  { term: 'sonnet', def: 'a fourteen-line poem, traditionally about love', lv: 1 },
  { term: 'ballad', def: 'a poem that tells a story, often in quatrains, sometimes with a refrain', lv: 2 },
  { term: 'haiku', def: 'a three-line poem of 5, 7 and 5 syllables (in English versions)', lv: 1 },
  { term: 'limerick', def: 'a funny five-line poem rhyming AABBA', lv: 1 },
  { term: 'ode', def: 'a poem that addresses and praises a person, thing or idea', lv: 3 },
  { term: 'elegy', def: 'a poem of mourning for someone who has died', lv: 3 },
  { term: 'free verse', def: 'poetry with no regular rhyme or metre', lv: 2 },
  { term: 'dramatic monologue', def: 'a poem in the voice of a character speaking to a silent listener', lv: 4 },
  { term: 'epic', def: 'a very long narrative poem about heroic deeds', lv: 4 },
]

const FORM_QS: MC[] = [
  { q: 'How does a Shakespearean sonnet end?', a: 'with a rhyming couplet', w: ['with a refrain', 'with a single unrhymed line', 'with a haiku'], hint: 'Its rhyme scheme ends ...GG.', ex: 'A Shakespearean sonnet is three quatrains and a final rhyming couplet: ABAB CDCD EFEF GG.', lv: 2 },
  { q: 'What is the "volta" in a sonnet?', a: 'the turn, where the poem changes direction or argument', w: ['the title', 'the last word', 'the rhyme scheme'], hint: '"Volta" is Italian for "turn".', ex: 'The volta is the turning point in a sonnet.', lv: 4 },
  { q: 'A Petrarchan sonnet is divided into...', a: 'an octave (8 lines) and a sestet (6 lines)', w: ['three quatrains and a couplet', 'two stanzas of seven lines', 'fourteen couplets'], hint: '8 + 6 = 14.', ex: 'Petrarchan (Italian) sonnets have an octave and a sestet.', lv: 4 },
  { q: 'Keats\'s "To Autumn" speaks directly to the season and praises it. What form is it?', a: 'an ode', w: ['an elegy', 'a limerick', 'a ballad'], hint: 'A poem of praise addressed to its subject.', ex: 'An ode addresses and celebrates its subject.', lv: 3, fig: P.autumn },
  { q: 'Which form would a poet most likely choose to tell a long story in short, song-like stanzas?', a: 'a ballad', w: ['a haiku', 'a limerick', 'a sonnet'], hint: 'Think of folk songs that tell stories.', ex: 'Ballads tell stories, often in quatrains with a strong rhythm.', lv: 2 },
  { q: 'What is the rhyme scheme of a Shakespearean sonnet?', a: 'ABAB CDCD EFEF GG', w: ['AABB CCDD EEFF GG', 'ABBA ABBA CDE CDE', 'AABBA'], hint: 'Three alternating quatrains and a couplet.', ex: 'ABAB CDCD EFEF GG.', lv: 4 },
  { q: 'Which form is this poem?', a: 'limerick', w: ['sonnet', 'haiku', 'elegy'], hint: 'Count the lines and look at the rhyme scheme.', ex: 'Five lines, AABBA, and humorous: a limerick.', lv: 1, fig: P.lear },
  { q: 'A poem mourns the death of a friend. What form is it?', a: 'an elegy', w: ['an ode', 'a limerick', 'an epic'], hint: 'A poem of grief.', ex: 'An elegy is a poem of mourning.', lv: 3 },
]

const FORM_NUMS: { q: string; a: string; ex: string; lv: number }[] = [
  { q: 'How many lines does a sonnet have?', a: '14', ex: 'A sonnet has fourteen lines.', lv: 1 },
  { q: 'How many lines does a limerick have?', a: '5', ex: 'A limerick has five lines, rhyming AABBA.', lv: 1 },
  { q: 'How many lines does a haiku have?', a: '3', ex: 'A haiku has three lines (5, 7, 5 syllables in English versions).', lv: 1 },
  { q: 'How many syllables are in the middle line of a haiku (in English versions)?', a: '7', ex: 'The pattern is 5, 7, 5.', lv: 2 },
  { q: 'How many lines are in a quatrain?', a: '4', ex: 'A quatrain is four lines.', lv: 2 },
  { q: 'How many lines are in the octave of a Petrarchan sonnet?', a: '8', ex: 'An octave has eight lines, followed by a six-line sestet.', lv: 4 },
  { q: 'How many quatrains does a Shakespearean sonnet have before its final couplet?', a: '3', ex: 'Three quatrains (12 lines) + a couplet (2 lines) = 14.', lv: 3 },
]

// =====================================================================================================
// Enjambment and caesura
// =====================================================================================================

const EC_TERMS: MC[] = [
  { q: 'What is enjambment?', a: 'when a sentence runs on from one line to the next without punctuation', w: [{ label: 'a pause in the middle of a line', feedback: 'That is a caesura.' }, { label: 'a line that ends with punctuation', feedback: 'That is an end-stopped line.' }, { label: 'two rhyming lines', feedback: 'That is a couplet.' }], hint: 'Think "run-on lines".', ex: 'Enjambment carries a sentence over the line break.', lv: 1 },
  { q: 'What is a caesura?', a: 'a pause in the middle of a line, often shown by punctuation', w: [{ label: 'a sentence running over a line break', feedback: 'That is enjambment.' }, { label: 'the last word of a poem', feedback: 'No: a caesura is a mid-line pause.' }, { label: 'a repeated line', feedback: 'That is a refrain.' }], hint: 'It "cuts" the line.', ex: 'A caesura is a break within a line.', lv: 1 },
  { q: 'What is an end-stopped line?', a: 'a line that ends with punctuation, creating a pause', w: ['a line that runs on into the next', 'the final line of a poem', 'a line with no verbs'], hint: 'The line stops at its end.', ex: 'An end-stopped line finishes with punctuation, so the reader pauses.', lv: 2 },
  { fig: P.daffodils, q: 'What happens between lines 1 and 2 ("I wandered lonely as a Cloud / That floats on high...")?', a: 'enjambment', w: [{ label: 'caesura', feedback: 'A caesura is a pause in the middle of a line.' }, { label: 'an end-stopped line', feedback: 'There is no punctuation at the end of line 1.' }, { label: 'a refrain', feedback: 'Nothing is repeated.' }], hint: 'Is there punctuation at the end of line 1?', ex: 'The sentence runs straight on, like the drifting cloud: enjambment.', lv: 2 },
  { fig: P.dulce, q: 'What does the full stop in "Men marched asleep. Many had lost their boots" (line 5) create?', a: 'a caesura', w: [{ label: 'enjambment', feedback: 'Enjambment happens across a line break, not in the middle.' }, { label: 'a rhyming couplet', feedback: 'That is two rhyming lines.' }, { label: 'a refrain', feedback: 'Nothing is repeated.' }], hint: 'Where is the full stop?', ex: 'The full stop mid-line creates a caesura, a heavy pause.', lv: 2 },
  { fig: P.dulce, q: 'What is the effect of the caesuras in "But limped on, blood-shod. All went lame; all blind;"?', a: 'The broken rhythm mimics the soldiers\' exhausted, stumbling movement.', w: ['They make the line flow smoothly and quickly.', 'They show the soldiers are cheerful.', 'They create a rhyme.'], hint: 'Read it aloud: how does it move?', ex: 'Repeated pauses make the line halting, like the limping men.', lv: 4 },
  { fig: P.daffodils, q: 'What is the effect of the enjambment between "I wandered lonely as a Cloud" and "That floats on high o\'er vales and Hills"?', a: 'The line flows on, like the cloud drifting freely.', w: ['It creates a sudden, shocking stop.', 'It makes the poem sound angry.', 'It shows the speaker is out of breath.'], hint: 'Match the movement of the line to what it describes.', ex: 'The run-on line drifts, mirroring the floating cloud.', lv: 3 },
  { fig: P.london, q: 'In "In every voice: in every ban,", what does the colon in the middle of the line create?', a: 'a caesura', w: ['enjambment', 'a couplet', 'a refrain'], hint: 'It is a pause within a line.', ex: 'The colon breaks the line in the middle: a caesura.', lv: 3 },
]

// =====================================================================================================
// Analysis
// =====================================================================================================

const ANALYSIS: MC[] = [
  { fig: P.eagle, q: 'Which technique is used in "And like a thunderbolt he falls"?', a: 'simile', w: ['personification', 'oxymoron', 'rhetorical question'], hint: 'Look for "like".', ex: 'The eagle\'s dive is compared to a thunderbolt using "like": a simile suggesting speed and power.', lv: 1 },
  { fig: P.eagle, q: 'Which sound device is used in "He clasps the crag with crooked hands"?', a: 'alliteration', w: ['onomatopoeia', 'oxymoron', 'rhetorical question'], hint: 'Listen to the first sounds: clasps, crag, crooked.', ex: 'The repeated hard "c/k" sound is alliteration, making the eagle\'s grip sound harsh and strong.', lv: 2 },
  { fig: P.eagle, q: 'Which technique is used in "The wrinkled sea beneath him crawls"?', a: 'personification', w: ['simile', 'onomatopoeia', 'rhetorical question'], hint: 'Can the sea really crawl?', ex: 'The sea is given a living action: it seems small and slow from the eagle\'s height.', lv: 2 },
  { fig: P.eagle, q: 'What impression of the eagle does the poem create?', a: 'powerful and majestic, ruling over its surroundings', w: ['weak and frightened', 'playful and silly', 'lost and confused'], hint: 'Look at where he is and how he moves.', ex: 'He is "Close to the sun", "stands" above the world, and falls "like a thunderbolt".', lv: 3 },
  { fig: P.daffodils, q: 'What does "lonely as a Cloud" suggest about the speaker at the start?', a: 'He feels isolated and drifting', w: ['He is surrounded by friends', 'He is angry', 'He is about to fall asleep'], hint: 'What is a single cloud like?', ex: 'The simile suggests he is alone, drifting aimlessly, until he sees the daffodils.', lv: 2 },
  { fig: P.daffodils, q: 'Which technique is used in "Fluttering and dancing in the breeze"?', a: 'personification', w: ['oxymoron', 'onomatopoeia', 'rhetorical question'], hint: 'Who usually dances?', ex: 'The daffodils "dance" like people, which makes them seem joyful and alive.', lv: 2 },
  { fig: P.daffodils, q: 'Why might Wordsworth describe the daffodils as "a crowd" and "A host"?', a: 'To suggest there are huge numbers of them, almost like a gathering of people', w: ['To show they are dying', 'To suggest they are dangerous', 'To show there is only one flower'], hint: 'How many people make a crowd?', ex: 'Both words suggest a great number, and "host" can also suggest an army of angels.', lv: 3 },
  { fig: P.london, q: 'What is the effect of repeating "every" in the second stanza?', a: 'It suggests the misery is everywhere and affects everyone.', w: ['It suggests London is a happy place.', 'It shows the speaker is counting people.', 'It slows the poem to a stop.'], hint: 'Who is suffering?', ex: 'The repetition stresses that suffering is universal in the city.', lv: 3 },
  { fig: P.london, q: '"mind-forg\'d manacles" are handcuffs made by the mind. What does this metaphor suggest?', a: 'People are trapped by their own thoughts and by ideas imposed on them.', w: ['People are being arrested by the police.', 'People are working as blacksmiths.', 'People are free and happy.'], hint: 'Manacles are chains; "mind-forg\'d" means made in the mind.', ex: 'The metaphor suggests invisible, mental chains that trap people.', lv: 5 },
  { fig: P.london, q: 'What is the tone of these stanzas?', a: 'bleak and critical', w: ['joyful and celebratory', 'calm and peaceful', 'silly and comic'], hint: '"weakness", "woe", "cry of fear"...', ex: 'The vocabulary of suffering creates a bleak, critical tone.', lv: 2 },
  { fig: P.dulce, q: 'What do the similes "like old beggars" and "like hags" suggest about the soldiers?', a: 'They are worn out and aged by war, not heroic.', w: ['They are rich and comfortable.', 'They are young and energetic.', 'They are enjoying the march.'], hint: 'Soldiers are usually young men. What do these similes do to them?', ex: 'The young soldiers seem old and broken: a powerful anti-heroic image.', lv: 3 },
  { fig: P.dulce, q: 'What is the effect of "blood-shod"?', a: 'It shocks the reader: the men are so bootless that their feet are covered in blood.', w: ['It shows they have new red boots.', 'It describes a type of horse.', 'It means they are marching quickly.'], hint: '"Shod" means wearing shoes.', ex: 'Instead of boots, their feet are "shod" with blood: a shocking image of suffering.', lv: 4 },
  { fig: P.dulce, q: 'What is the speaker\'s attitude to war in this stanza?', a: 'He shows its exhausting, painful reality.', w: ['He presents it as glorious and exciting.', 'He thinks it is funny.', 'He is not interested in it.'], hint: 'Look at how the soldiers are described.', ex: 'Owen shows the reality of war: exhaustion, injury and misery.', lv: 2 },
  { fig: P.anthem, q: 'Which device is used in "the stuttering rifles\' rapid rattle"?', a: 'alliteration and onomatopoeia', w: ['simile', 'oxymoron', 'rhetorical question only'], hint: 'Listen to the repeated "r" and the sound words.', ex: 'The "r" sounds and "stuttering"/"rattle" imitate gunfire.', lv: 3 },
  { fig: P.anthem, q: 'The poem opens with a question: "What passing-bells for these who die as cattle?" What does "die as cattle" suggest?', a: 'The soldiers are slaughtered in huge numbers without dignity.', w: ['The soldiers are farmers.', 'The soldiers die peacefully.', 'The soldiers are cowards.'], hint: 'How are cattle killed?', ex: 'The simile compares the soldiers to animals in a slaughterhouse.', lv: 4 },
  { fig: P.hope, q: 'What is hope compared to in this stanza?', a: 'a bird', w: ['a cloud', 'a flower', 'a song with words'], hint: 'Feathers, perches, sings...', ex: 'Hope is a bird that "perches in the soul" and sings: an extended metaphor.', lv: 1 },
  { fig: P.hope, q: 'What does "never stops - at all -" suggest about hope?', a: 'It is always there, even in hard times.', w: ['It disappears quickly.', 'It is loud and annoying.', 'It only comes at night.'], hint: 'What never stops?', ex: 'Hope keeps singing constantly.', lv: 2 },
  { fig: P.midwinter, q: 'Which technique is used in "Earth stood hard as iron"?', a: 'simile', w: ['metaphor', 'onomatopoeia', 'rhetorical question'], hint: 'Look for "as".', ex: 'A comparison using "as": the frozen ground is as hard as iron.', lv: 1 },
  { fig: P.midwinter, q: 'What is the effect of the repetition in "snow on snow, snow on snow"?', a: 'It suggests deep, endless layers of snow.', w: ['It shows the snow is melting.', 'It makes the scene sound summery.', 'It shows the speaker has forgotten the word.'], hint: 'Picture snow on top of snow on top of snow.', ex: 'The repetition piles up, just like the snow.', lv: 2 },
  { fig: P.sonnet18, q: 'In "Shall I compare thee to a summer\'s day?", what does the speaker go on to say?', a: 'The loved one is even lovelier and more even-tempered than a summer\'s day.', w: ['The loved one is worse than a summer\'s day.', 'Summer is the speaker\'s favourite season.', 'The loved one is a farmer.'], hint: 'Read line 2.', ex: '"Thou art more lovely and more temperate".', lv: 3 },
]

// =====================================================================================================
// Metre
// =====================================================================================================

const SYLLABLES: { line: string; n: number; note: string; lv: number }[] = [
  { line: "Shall I compare thee to a summer's day?", n: 10, note: 'Ten syllables: iambic pentameter (Shakespeare, Sonnet 18).', lv: 2 },
  { line: 'Two households, both alike in dignity', n: 10, note: 'Two / house / holds / both / a / like / in / dig / ni / ty = 10 (Romeo and Juliet, Prologue).', lv: 3 },
  { line: 'But soft, what light through yonder window breaks?', n: 10, note: 'Ten syllables: Romeo\'s iambic pentameter.', lv: 3 },
  { line: 'If music be the food of love, play on', n: 10, note: 'Ten syllables (Twelfth Night).', lv: 3 },
  { line: 'Rough winds do shake the darling buds of May', n: 10, note: 'Ten syllables, mostly one-syllable words.', lv: 2 },
  { line: 'I wandered lonely as a Cloud', n: 8, note: 'I / wan / dered / lone / ly / as / a / cloud = 8: iambic tetrameter.', lv: 3 },
  { line: 'Tyger Tyger, burning bright', n: 7, note: 'Ty / ger / Ty / ger / burn / ing / bright = 7 (Blake).', lv: 2 },
  { line: 'Season of mists and mellow fruitfulness', n: 10, note: 'Sea / son / of / mists / and / mel / low / fruit / ful / ness = 10 (Keats).', lv: 4 },
  { line: 'Remember me when I am gone away', n: 10, note: 'Re / mem / ber / me / when / I / am / gone / a / way = 10 (Rossetti).', lv: 3 },
  { line: 'He clasps the crag with crooked hands', n: 8, note: 'He / clasps / the / crag / with / crook / ed / hands = 8 (Tennyson).', lv: 4 },
  { line: 'Half a league, half a league', n: 6, note: 'Half / a / league / half / a / league = 6 (Tennyson).', lv: 2 },
]

const METRE_QS: MC[] = [
  { q: 'What is an iamb?', a: 'an unstressed syllable followed by a stressed one (da-DUM)', w: [{ label: 'a stressed syllable followed by an unstressed one (DUM-da)', feedback: 'That is a trochee.' }, { label: 'a line of ten syllables', feedback: 'That is (roughly) a line of pentameter.' }, { label: 'a pair of rhyming lines', feedback: 'That is a couplet.' }], hint: 'Say "a-BOUT": that is one iamb.', ex: 'An iamb is da-DUM, as in "be-LOW" or "a-WAY".', lv: 2 },
  { q: 'What is iambic pentameter?', a: 'a line of five iambs: ten syllables going da-DUM five times', w: ['a line of five syllables', 'a poem with five stanzas', 'a line of four trochees'], hint: '"Penta" means five.', ex: 'Five iambs per line, as in "Shall I compare thee to a summer\'s day?"', lv: 2 },
  { q: 'What is blank verse?', a: 'unrhymed iambic pentameter', w: ['poetry with no rhythm at all', 'rhyming couplets', 'a poem with blank lines between stanzas'], hint: 'Much of the dialogue in Shakespeare\'s plays is written in it.', ex: 'Blank verse has the iambic pentameter rhythm but no rhyme.', lv: 4 },
  { q: 'What is a trochee?', a: 'a stressed syllable followed by an unstressed one (DUM-da)', w: ['an unstressed syllable followed by a stressed one (da-DUM)', 'three stressed syllables', 'a rhyming word'], hint: '"TY-ger" is one.', ex: 'A trochee is DUM-da: "TY-ger, TY-ger".', lv: 3 },
  { q: 'In Shakespeare\'s plays, which characters usually speak in verse?', a: 'noble and high-status characters', w: ['servants and comic characters', 'only the villains', 'only women'], hint: 'Who speaks in prose, the plainer style?', ex: 'Nobles usually speak in verse; servants and comic characters often speak in prose (though there are exceptions).', lv: 4 },
  { q: 'How many feet are in a line of tetrameter?', a: 'four', w: ['five', 'three', 'six'], hint: '"Tetra" means four.', ex: 'Tetrameter has four feet; pentameter has five.', lv: 4 },
  { q: 'Which word is an iamb (da-DUM)?', a: 'away', w: ['garden', 'happy', 'window'], hint: 'Say each word aloud and listen for the stress.', ex: '"a-WAY" is unstressed then stressed. The others are DUM-da (trochees).', lv: 3 },
  { q: 'Which word is a trochee (DUM-da)?', a: 'tiger', w: ['begin', 'below', 'today'], hint: 'Say each word aloud.', ex: '"TI-ger" is stressed then unstressed.', lv: 3 },
  { q: 'Why might a poet suddenly break a regular rhythm?', a: 'To draw attention to a moment, such as a shock or change of feeling', w: ['Because they made a mistake', 'To make the poem rhyme', 'To make it shorter'], hint: 'What happens when a steady beat suddenly stops?', ex: 'A broken rhythm jolts the reader and highlights that moment.', lv: 5 },
]

const POEM_TASKS: Task[] = [
  {
    fig: P.eagle,
    prompt: 'How does Tennyson present the eagle as powerful? Write a short paragraph.',
    model: 'Tennyson presents the eagle as powerful and majestic. The harsh alliteration in "clasps the crag with crooked hands" makes its grip sound strong and fierce. It is "Close to the sun", which places it high above everything, and the sea below seems small as it "crawls". Finally, the simile "like a thunderbolt he falls" makes its dive sound sudden, fast and deadly.',
    checklist: ['Makes a clear point about the eagle', 'Uses at least two short quotations', 'Names a technique (alliteration, simile, personification)', 'Explains the effect on the reader'],
  },
  {
    fig: P.dulce,
    prompt: 'How does Owen show the suffering of the soldiers in this stanza?',
    model: 'Owen shows that the soldiers are physically destroyed by war. The simile "like old beggars under sacks" makes young men seem old and broken. The caesuras in "Men marched asleep. Many had lost their boots" break up the rhythm, like their stumbling steps. The shocking image "blood-shod" shows their feet are bleeding because they have no boots, and "All went lame; all blind" suggests everyone is suffering.',
    checklist: ['Makes a clear point about the soldiers\' suffering', 'Uses at least two quotations', 'Comments on a language choice (simile, image, verb)', 'Comments on form or structure (caesura, rhythm)'],
  },
  {
    fig: P.daffodils,
    prompt: 'How does Wordsworth make the daffodils seem joyful?',
    model: 'Wordsworth makes the daffodils seem joyful by personifying them. They are "Fluttering and dancing in the breeze", as if they are celebrating. Calling them "a crowd" and "A host" suggests there are so many that they are like a lively gathering of people. This contrasts with the speaker, who was "lonely as a Cloud", so the flowers seem to lift his mood.',
    checklist: ['Makes a clear point', 'Uses a quotation', 'Identifies a technique such as personification', 'Explains the effect, e.g. the contrast with the lonely speaker'],
  },
]

export const poetryGenerators: ItemGenerator[] = [
  termMatchGen('poetry.terms-match', 'poetry.terms', [1, 4], POETRY_TERMS, 'Match each poetry term to its meaning.'),
  termChoiceGen('poetry.terms-define', 'poetry.terms', [1, 4], POETRY_TERMS, 'poetry term'),
  bankGen('poetry.terms-bank', 'poetry.terms', [1, 5], TERM_QS),
  G('poetry.rhyme-scheme', 'poetry.rhyme-scheme', [1, 5], (rng, d) => {
    const r = rng.pick(atLevel(SCHEMES, d))
    const item = textItem({
      prompt: 'Work out the rhyme scheme of these lines. Use a letter for each line (e.g. AABB).',
      accept: variants(SCHEME_FIX(r.scheme)),
      hint: 'Give the first line\'s end sound "A". Each new end sound gets the next letter; a line that rhymes with an earlier one reuses its letter.',
      explanation: `${r.scheme}: ${r.ends}.`,
      placeholder: 'e.g. ABAB',
    })
    return { ...item, figure: r.fig }
  }),
  G('poetry.rhyme-scheme-choice', 'poetry.rhyme-scheme', [1, 4], (rng, d) => {
    const r = rng.pick(atLevel(SCHEMES, d))
    const others = ['AABB', 'ABAB', 'ABBA', 'ABCB', 'AAAA', 'ABABCC', 'AAABBB', 'AABBA', 'ABABCDCD'].filter((s) => s !== r.scheme && s.length === r.scheme.length)
    const fill = ['ABCD', 'ABAC', 'AABC', 'ABCA', 'AABCC', 'ABCABC', 'ABCCBA', 'AABBCC', 'ABCDABCD', 'AABBCCDD', 'ABBACDDC', 'ABCBA', 'AAAAA'].filter((s) => s !== r.scheme && s.length === r.scheme.length)
    return choice({
      rng,
      prompt: 'What is the rhyme scheme of these lines?',
      correct: r.scheme,
      wrong: sample(rng, [...others, ...fill], 3),
      hint: 'Label each line ending. Same sound, same letter.',
      explanation: `${r.scheme}: ${r.ends}.`,
      figure: r.fig,
    })
  }),
  termMatchGen('poetry.forms-match', 'poetry.forms', [1, 4], FORM_TERMS, 'Match each poetic form to its description.'),
  bankGen('poetry.forms-bank', 'poetry.forms', [1, 5], FORM_QS),
  G('poetry.forms-numbers', 'poetry.forms', [1, 4], (rng, d) => {
    const r = rng.pick(atLevel(FORM_NUMS, d))
    const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen']
    return textItem({ prompt: `${r.q} Type a number.`, accept: [r.a, words[Number(r.a)]!], hint: 'Picture an example of the form and count.', explanation: r.ex, placeholder: 'Type a number' })
  }),
  bankGen('poetry.enjambment-caesura', 'poetry.enjambment-caesura', [1, 5], EC_TERMS),
  bankGen('poetry.analysis', 'poetry.analysis', [1, 5], ANALYSIS),
  revealGen('poetry.analysis-written', 'poetry.analysis', [3, 5], POEM_TASKS),
  G('poetry.syllables', 'poetry.metre', [2, 4], (rng, d) => {
    const r = rng.pick(atLevel(SYLLABLES, d))
    return textItem({
      prompt: `How many syllables are in this line? Type a number.\n${r.line}`,
      accept: [String(r.n)],
      hint: 'Clap each beat as you say it slowly. Watch out for words like "wandered" (2) and "dignity" (3).',
      explanation: r.note,
      placeholder: 'Type a number',
    })
  }),
  bankGen('poetry.metre-bank', 'poetry.metre', [2, 5], METRE_QS),
]
