import type { ItemGenerator } from '@/engine/registry'
import { bankGen, classifyGen, termChoiceGen, termMatchGen, type Example, type MC, type Term } from './helpers'

/**
 * Language devices. Every "identify the device" example lists in `not` any other device that could also be
 * argued for, so it is never offered as a wrong option: each question has exactly one defensible answer.
 */

const DEVICE_INFO: Record<string, string> = {
  simile: 'A simile compares two things using "like" or "as".',
  metaphor: 'A metaphor says something IS something else, without "like" or "as".',
  personification: 'Personification gives human actions or feelings to something that is not human.',
  alliteration: 'Alliteration repeats the same sound at the start of nearby words.',
  sibilance: 'Sibilance repeats soft "s" or "sh" sounds.',
  onomatopoeia: 'Onomatopoeia is a word that sounds like the noise it describes (buzz, crash).',
  hyperbole: 'Hyperbole is deliberate exaggeration, not meant literally.',
  oxymoron: 'An oxymoron puts two opposite words side by side (deafening silence).',
  juxtaposition: 'Juxtaposition places two contrasting things close together to highlight the difference.',
  'pathetic fallacy': 'Pathetic fallacy is weather or surroundings that reflect a mood or feeling.',
  'rhetorical question': 'A rhetorical question is asked for effect, not to get an answer.',
  repetition: 'Repetition repeats a word or phrase for emphasis.',
  'rule of three': 'The rule of three groups ideas in threes for impact.',
  'direct address': 'Direct address speaks to the reader as "you".',
  'emotive language': 'Emotive language uses words chosen to stir strong feelings.',
}
const pick = (...keys: string[]) => Object.fromEntries(keys.map((k) => [k, DEVICE_INFO[k]!]))

// =====================================================================================================
// Figurative language
// =====================================================================================================

const FIGURATIVE: Example[] = [
  { text: 'Her eyes sparkled like diamonds.', a: 'simile', why: 'It compares her eyes to diamonds using "like".', lv: 1 },
  { text: 'He was as brave as a lion.', a: 'simile', why: 'It compares him to a lion using "as... as".', lv: 1 },
  { text: 'The classroom was as quiet as a library.', a: 'simile', why: 'A comparison using "as... as".', lv: 1 },
  { text: 'The snow was a white blanket over the town.', a: 'metaphor', why: 'It says the snow IS a blanket, with no "like" or "as".', lv: 2 },
  { text: 'My brother is a couch potato.', a: 'metaphor', not: ['hyperbole'], why: 'He is not literally a potato: the metaphor says he is lazy.', lv: 2 },
  { text: 'Her heart was a block of ice.', a: 'metaphor', why: 'It says her heart IS ice, suggesting she is cold and unfeeling.', lv: 2 },
  { text: 'The trees whispered to each other in the breeze.', a: 'personification', not: ['onomatopoeia'], why: 'Trees cannot whisper: a human action is given to them.', lv: 2 },
  { text: 'The old car groaned up the hill.', a: 'personification', not: ['onomatopoeia'], why: 'Groaning is a human sound given to a car.', lv: 3 },
  { text: 'The camera loves her.', a: 'personification', why: 'A camera cannot love: a human feeling is given to an object.', lv: 3 },
  { text: 'The wind howled like a wounded animal.', a: 'simile', not: ['personification'], why: 'It compares the wind to an animal using "like".', lv: 3 },
  { text: 'Life is a rollercoaster.', a: 'metaphor', not: ['hyperbole'], why: 'Life is said to BE a rollercoaster (full of ups and downs).', lv: 2 },
  { text: 'The moon smiled down on the sleeping village.', a: 'personification', not: ['metaphor'], why: 'Smiling is a human action given to the moon.', lv: 2 },
  { text: 'He ran like the wind.', a: 'simile', not: ['hyperbole'], why: 'It compares his speed to the wind using "like".', lv: 1 },
  { text: 'The exam was a mountain she had to climb.', a: 'metaphor', not: ['hyperbole'], why: 'The exam is said to BE a mountain: a huge challenge.', lv: 3 },
  { text: 'Opportunity knocked at his door.', a: 'personification', not: ['metaphor'], why: 'Opportunity is given the human action of knocking.', lv: 4 },
  { text: 'Juliet is the sun.', a: 'metaphor', not: ['hyperbole'], why: 'Romeo says Juliet IS the sun: bright, warm, the centre of his world.', lv: 4 },
]

const FIG_MEANING: MC[] = [
  { q: '"Her heart was a block of ice." What does this suggest about her?', a: 'She is cold and unfeeling.', w: ['She is ill.', 'She lives somewhere cold.', 'She is calm in a crisis.'], hint: 'What qualities does ice have?', ex: 'Ice is cold and hard: the metaphor suggests she shows no warmth or feeling.', lv: 2 },
  { q: '"He was as brave as a lion." What does the simile suggest?', a: 'He is extremely courageous.', w: ['He is hairy.', 'He is dangerous to others.', 'He is lazy.'], hint: 'What are lions famous for?', ex: 'Lions are symbols of courage.', lv: 1 },
  { q: '"The classroom was a zoo." What does this metaphor suggest?', a: 'The class was wild, noisy and out of control.', w: ['There were animals in the classroom.', 'The class was on a school trip.', 'The classroom was very clean.'], hint: 'What is a zoo full of?', ex: 'It suggests chaos and noise, like a crowd of animals.', lv: 2 },
  { q: '"The trees whispered secrets to each other." What mood does this create?', a: 'mysterious and quiet', w: ['loud and angry', 'joyful and celebratory', 'boring and dull'], hint: 'Think about whispering and secrets.', ex: 'Whispering secrets suggests something hushed and mysterious.', lv: 3 },
  { q: '"Time crawled during the maths test." What does this suggest?', a: 'The test felt as if it went on for ages.', w: ['The test finished very quickly.', 'There was an insect in the room.', 'The clock was broken.'], hint: 'How fast does something crawl?', ex: 'Crawling is slow: time seemed to pass very slowly.', lv: 3 },
  { q: 'Why might a writer use an extended metaphor (one that continues over several lines)?', a: 'To develop one comparison in depth and make it more powerful.', w: ['To avoid using any imagery.', 'Because similes are not allowed in poems.', 'To make the text shorter.'], hint: '"Hope is the thing with feathers" carries on with perching and singing...', ex: 'An extended metaphor develops a single comparison, building its meaning.', lv: 5 },
]

// =====================================================================================================
// Sound devices
// =====================================================================================================

const SOUND: Example[] = [
  { text: 'The bacon sizzled in the pan.', a: 'onomatopoeia', why: '"Sizzled" sounds like the noise of frying.', lv: 1 },
  { text: 'Big brown bears bounced on blue balloons.', a: 'alliteration', why: 'Repeated "b" sounds at the start of words.', lv: 1 },
  { text: 'The snake slithered silently through the soft sand.', a: 'sibilance', not: ['alliteration'], why: 'The repeated soft "s" sounds create sibilance, like a hiss.', lv: 3 },
  { text: 'Crash! The plates hit the floor.', a: 'onomatopoeia', why: '"Crash" imitates the sound.', lv: 1 },
  { text: 'Peter Piper picked a peck of pickled peppers.', a: 'alliteration', why: 'Repeated "p" sounds at the start of words.', lv: 1 },
  { text: 'The wind whistled while waves washed the wall.', a: 'alliteration', not: ['onomatopoeia', 'personification'], why: 'Repeated "w" sounds at the start of words.', lv: 2 },
  { text: 'The kettle hissed and the toast popped up.', a: 'onomatopoeia', why: '"Hissed" and "popped" imitate their sounds.', lv: 2 },
  { text: 'She sells sea shells on the sea shore.', a: 'sibilance', not: ['alliteration'], why: 'Repeated "s" and "sh" sounds: sibilance.', lv: 3 },
  { text: 'Dark, dismal days dragged on.', a: 'alliteration', why: 'Repeated hard "d" sounds at the start of words.', lv: 2 },
  { text: 'The bees buzzed around the hive.', a: 'onomatopoeia', not: ['alliteration'], why: '"Buzzed" imitates the bees\' sound.', lv: 2 },
  { text: 'The silken, sad, uncertain rustling of each purple curtain', a: 'sibilance', not: ['alliteration', 'onomatopoeia'], why: 'Soft "s" sounds run through the line (from Poe\'s "The Raven"), creating a whispering effect.', lv: 4 },
  { text: 'Twinkle, twinkle, little star', a: 'alliteration', why: 'Repeated "t" sounds at the start of words.', lv: 1 },
]

const SOUND_EFFECT: MC[] = [
  { q: '"The snake slithered silently through the soft sand." What effect does the sibilance have?', a: 'The repeated "s" sounds imitate the hiss of the snake, making it seem sinister.', w: ['It makes the snake sound loud and clumsy.', 'It makes the scene sound cheerful.', 'It shows the snake is asleep.'], hint: 'Read it aloud. What do you hear?', ex: 'The soft hissing sounds echo the snake.', lv: 3 },
  { q: '"Dark, dismal days dragged on." What effect do the repeated hard "d" sounds have?', a: 'They sound heavy and dull, slowing the line down to match the boring days.', w: ['They make the days sound exciting.', 'They make the line sound fast and light.', 'They imitate the sound of rain.'], hint: 'Say it slowly. How does it feel?', ex: 'The heavy "d" sounds create a dragging, gloomy rhythm.', lv: 4 },
  { q: 'Which word is onomatopoeic?', a: 'thud', w: ['quiet', 'heavy', 'fall'], hint: 'Which word sounds like its meaning?', ex: '"Thud" imitates the sound of something heavy landing.', lv: 1 },
  { q: 'Which word is onomatopoeic?', a: 'crackle', w: ['fire', 'warm', 'glow'], hint: 'Say each word aloud.', ex: '"Crackle" imitates the sound it describes.', lv: 1 },
  { q: 'Which word is onomatopoeic?', a: 'splash', w: ['water', 'swim', 'wet'], hint: 'Which word is a sound?', ex: '"Splash" imitates the sound of water.', lv: 1 },
  { q: 'Which line contains alliteration?', a: 'Wild winds wailed through the woods.', w: ['The wind was very loud.', 'Leaves fell from the trees.', 'It was a stormy night.'], hint: 'Look for the same first sound repeated.', ex: '"Wild winds wailed... woods" repeats "w".', lv: 2 },
  { q: 'Why might advertisers use alliteration, as in "Fresh, fruity and full of flavour"?', a: 'It is catchy and memorable.', w: ['It makes the advert longer.', 'It is required by law.', 'It makes the product sound cheaper.'], hint: 'Think about slogans you remember.', ex: 'Alliteration makes phrases stick in the mind.', lv: 3 },
]

// =====================================================================================================
// Hyperbole, oxymoron, juxtaposition
// =====================================================================================================

const EXAGG: Example[] = [
  { text: "I've told you a million times!", a: 'hyperbole', why: 'Nobody has said anything a million times: deliberate exaggeration.', lv: 1 },
  { text: 'My bag weighs a ton.', a: 'hyperbole', not: ['metaphor'], why: 'An exaggeration to show it is very heavy.', lv: 1 },
  { text: 'There was a deafening silence after the announcement.', a: 'oxymoron', not: ['juxtaposition', 'hyperbole'], why: '"Deafening" and "silence" are opposites placed together.', lv: 2 },
  { text: 'It was a bittersweet goodbye.', a: 'oxymoron', not: ['juxtaposition'], why: '"Bitter" and "sweet" are opposites combined.', lv: 2 },
  { text: 'The gleaming mansion stood beside a crumbling slum.', a: 'juxtaposition', why: 'Wealth and poverty are placed side by side to show the contrast.', lv: 3 },
  { text: 'I am so hungry I could eat a horse.', a: 'hyperbole', why: 'A deliberate exaggeration of hunger.', lv: 1 },
  { text: 'O brawling love! O loving hate!', a: 'oxymoron', not: ['juxtaposition'], why: 'Romeo pairs opposites: "brawling love", "loving hate".', lv: 4 },
  { text: 'Outside, children laughed in the sunshine; inside, the old man sat alone in the dark.', a: 'juxtaposition', why: 'Joy and loneliness, light and dark, are placed side by side.', lv: 3 },
  { text: 'The queue was so long it reached to the moon.', a: 'hyperbole', why: 'Impossible exaggeration.', lv: 1 },
  { text: 'Parting is such sweet sorrow.', a: 'oxymoron', not: ['juxtaposition'], why: 'Juliet\'s "sweet sorrow" combines opposites.', lv: 4 },
  { text: 'In the middle of the noisy party, she sat in silence.', a: 'juxtaposition', not: ['oxymoron'], why: 'The noisy party and her silence are set against each other.', lv: 4 },
  { text: 'The pupil was given a cruel kindness: the truth.', a: 'oxymoron', not: ['juxtaposition'], why: '"Cruel kindness" combines opposites.', lv: 3 },
]

// =====================================================================================================
// Imagery, pathetic fallacy, semantic fields
// =====================================================================================================

const SENSES: Example[] = [
  { text: 'The bitter, burnt taste of the coffee made her wince.', a: 'taste', why: '"Bitter, burnt taste" appeals to taste.', lv: 1 },
  { text: 'The sharp scent of pine needles filled the forest.', a: 'smell', why: '"Scent" appeals to smell.', lv: 1 },
  { text: 'The rough bark scraped against my palms.', a: 'touch', why: '"Rough" and "scraped" appeal to touch.', lv: 2 },
  { text: 'Bells clanged and dogs barked in the distance.', a: 'hearing', why: '"Clanged" and "barked" appeal to hearing.', lv: 1 },
  { text: 'Crimson and gold leaves spun through the air.', a: 'sight', why: 'Colours and movement appeal to sight.', lv: 1 },
  { text: 'The icy water stung my ankles.', a: 'touch', why: '"Icy" and "stung" describe a physical feeling.', lv: 2 },
  { text: 'The kitchen was thick with the warm, sweet smell of baking bread.', a: 'smell', why: 'The smell of baking bread.', lv: 2 },
  { text: 'A low hum came from the fridge.', a: 'hearing', why: '"Hum" is a sound.', lv: 2 },
]

const PATHETIC: MC[] = [
  { q: 'Which sentence is the clearest example of pathetic fallacy?', a: 'As she read the terrible news, heavy rain lashed against the window.', w: [{ label: 'It rained on Tuesday, so we took umbrellas.', feedback: 'The weather here does not reflect anyone\'s feelings.' }, { label: 'She was very sad when she read the news.', feedback: 'This tells us her feelings directly; there is no weather.' }, { label: 'The forecast said rain was likely.', feedback: 'Just information about weather.' }], hint: 'Look for weather that matches a feeling.', ex: 'The lashing rain mirrors her distress: pathetic fallacy.', lv: 2 },
  { q: 'Which sentence is the clearest example of pathetic fallacy?', a: 'On the morning of the wedding, the sun burst through the clouds and birds sang.', w: [{ label: 'The wedding was at noon.', feedback: 'No weather or mood here.' }, { label: 'Everyone was happy at the wedding.', feedback: 'This states the mood directly.' }, { label: 'The weather was mild for the time of year.', feedback: 'The weather does not reflect a feeling.' }], hint: 'Which weather mirrors a happy day?', ex: 'Bright sun and birdsong reflect the joy of the day.', lv: 2 },
  { q: 'A writer describes "an angry sky" just before two characters argue. What is the effect of this pathetic fallacy?', a: 'It foreshadows the conflict and builds tension.', w: ['It shows the weather forecast was wrong.', 'It makes the scene peaceful.', 'It tells us the season.'], hint: 'What is about to happen?', ex: 'The stormy weather hints at the conflict to come.', lv: 4 },
  { q: 'In Macbeth, on the night King Duncan is murdered, there are reports of a wild, unnatural storm. Why might Shakespeare include this?', a: 'The disturbed weather reflects the terrible, unnatural crime.', w: ['To explain why the guests stayed the night.', 'To show it was winter.', 'To provide comic relief.'], hint: 'How does nature react to the murder of a king?', ex: 'The chaos in nature mirrors the chaos of killing a king: pathetic fallacy.', lv: 5 },
]

const SEMANTIC: MC[] = [
  { q: '"The match was a battle: the defenders fought hard, the striker fired a shot and the keeper was under siege." These words create a semantic field of...', a: 'war', w: ['weather', 'cooking', 'music'], hint: 'What links battle, fought, fired and siege?', ex: 'Battle, fought, fired and siege are all linked to war.', lv: 2 },
  { q: '"The kitchen was a storm: pans thundered, steam swirled like fog and the chef\'s temper flashed like lightning." These words create a semantic field of...', a: 'weather', w: ['war', 'animals', 'school'], hint: 'Storm, thundered, fog, lightning...', ex: 'They all belong to the topic of weather.', lv: 3 },
  { q: 'Which group of words forms a semantic field of the sea?', a: 'waves, tide, anchor, harbour', w: ['waves, hello, wave goodbye, wave a flag', 'tree, leaf, branch, root', 'sun, sand, desert, camel'], hint: 'Which four words all belong to the same topic?', ex: 'Waves, tide, anchor and harbour all belong to the sea.', lv: 2 },
  { q: 'A writer describes a classroom with "inmates", "guards", "bars on the windows" and a "sentence" of detention. What does this semantic field suggest?', a: 'The school feels like a prison.', w: ['The school is a hospital.', 'The pupils are happy.', 'The school is by the sea.'], hint: 'Where do you find inmates and guards?', ex: 'A semantic field of prison suggests the pupils feel trapped.', lv: 4 },
  { q: 'In "The Hound of the Baskervilles", the hound has "fire", a "smouldering glare" and "flickering flame". What is the effect of this semantic field?', a: 'It makes the hound seem hellish and supernatural.', w: ['It shows the hound is cold.', 'It makes the hound seem friendly and warm.', 'It describes a fireplace.'], hint: 'Where might a creature made of fire come from?', ex: 'Fire imagery makes the hound seem demonic.', lv: 4 },
]

// =====================================================================================================
// Rhetorical devices
// =====================================================================================================

const RHETORIC: Example[] = [
  { text: 'Do we really want our parks covered in litter?', a: 'rhetorical question', not: ['direct address', 'emotive language'], why: 'The writer does not expect an answer: it is asked to make you agree.', lv: 1 },
  { text: 'Never give up. Never give in. Never stop believing.', a: 'repetition', not: ['rule of three'], why: '"Never" is repeated at the start of each sentence for emphasis.', lv: 2 },
  { text: 'Our town is clean, green and friendly.', a: 'rule of three', why: 'Three adjectives grouped together for impact.', lv: 2 },
  { text: 'You can make a difference today.', a: 'direct address', not: ['emotive language'], why: '"You" speaks directly to the reader.', lv: 2 },
  { text: 'Innocent, defenceless puppies are being abandoned in the freezing cold.', a: 'emotive language', not: ['rule of three'], why: '"Innocent", "defenceless", "abandoned" and "freezing" are chosen to stir pity.', lv: 2 },
  { text: 'Isn\'t it time we stopped wasting food?', a: 'rhetorical question', not: ['direct address', 'emotive language'], why: 'A question asked for effect.', lv: 2 },
  { text: 'Education, education, education.', a: 'repetition', not: ['rule of three'], why: 'The same word repeated for emphasis.', lv: 3 },
  { text: 'It is cheap, it is quick and it is good for the planet.', a: 'rule of three', not: ['repetition'], why: 'Three reasons grouped together.', lv: 3 },
  { text: 'Heartless thieves stole the charity box from a children\'s hospice.', a: 'emotive language', why: '"Heartless" and the detail of a children\'s hospice provoke outrage.', lv: 3 },
  { text: 'You deserve better, and so do your children.', a: 'direct address', not: ['emotive language'], why: '"You" and "your" address the reader directly.', lv: 3 },
  { text: 'How would you feel if it were your pet?', a: 'rhetorical question', not: ['direct address'], why: 'A question asked to make the reader imagine and agree, not to get an answer.', lv: 4 },
]

const DEVICE_TERMS: Term[] = [
  { term: 'simile', def: 'compares two things using "like" or "as"', lv: 1 },
  { term: 'metaphor', def: 'says one thing IS another, without "like" or "as"', lv: 1 },
  { term: 'personification', def: 'gives human actions or feelings to something non-human', lv: 2 },
  { term: 'alliteration', def: 'repeats the same sound at the start of nearby words', lv: 1 },
  { term: 'sibilance', def: 'repeats soft "s" and "sh" sounds', lv: 3 },
  { term: 'onomatopoeia', def: 'a word that sounds like the noise it describes', lv: 1 },
  { term: 'hyperbole', def: 'deliberate exaggeration, not meant literally', lv: 2 },
  { term: 'oxymoron', def: 'two opposite words placed side by side', lv: 3 },
  { term: 'juxtaposition', def: 'two contrasting things placed close together', lv: 4 },
  { term: 'pathetic fallacy', def: 'weather or surroundings that reflect a mood', lv: 3 },
  { term: 'rhetorical question', def: 'a question asked for effect, not for an answer', lv: 2 },
  { term: 'rule of three', def: 'ideas grouped in threes for impact', lv: 3 },
  { term: 'direct address', def: 'speaking to the reader as "you"', lv: 3 },
  { term: 'emotive language', def: 'words chosen to stir strong feelings', lv: 3 },
  { term: 'semantic field', def: 'a group of words linked to the same topic', lv: 4 },
]

export const deviceGenerators: ItemGenerator[] = [
  classifyGen('devices.figurative-identify', 'devices.figurative', [1, 4], {
    rows: FIGURATIVE,
    cats: pick('simile', 'metaphor', 'personification', 'hyperbole', 'onomatopoeia'),
    prompt: (e) => `Which technique is used here?\n${e.text}`,
    hint: 'Look for "like" or "as" (simile), "is/was" comparisons (metaphor), or human actions given to things (personification).',
  }),
  bankGen('devices.figurative-meaning', 'devices.figurative', [1, 5], FIG_MEANING),
  classifyGen('devices.sound-identify', 'devices.sound', [1, 4], {
    rows: SOUND,
    cats: pick('alliteration', 'sibilance', 'onomatopoeia', 'simile', 'metaphor'),
    prompt: (e) => `Which sound device is used here?\n${e.text}`,
    hint: 'Same first sound (alliteration)? Soft s sounds (sibilance)? A word that IS a sound (onomatopoeia)?',
  }),
  bankGen('devices.sound-effect', 'devices.sound', [1, 4], SOUND_EFFECT),
  classifyGen('devices.contrast-identify', 'devices.exaggeration-contrast', [1, 5], {
    rows: EXAGG,
    cats: pick('hyperbole', 'oxymoron', 'juxtaposition', 'simile', 'onomatopoeia', 'metaphor'),
    prompt: (e) => `Which technique is used here?\n${e.text}`,
    hint: 'Exaggeration (hyperbole)? Two opposite words together (oxymoron)? Two contrasting things placed side by side (juxtaposition)?',
  }),
  classifyGen('devices.senses', 'devices.imagery', [1, 3], {
    rows: SENSES,
    cats: { sight: 'Sight: colours, shapes, light, movement.', hearing: 'Hearing: sounds and noises.', touch: 'Touch: texture, temperature, pain.', smell: 'Smell: scents and odours.', taste: 'Taste: flavours.' },
    prompt: (e) => `Which sense does this sentence mainly appeal to?\n${e.text}`,
    hint: 'Which body part would you use to experience it?',
    keepOrder: true,
  }),
  bankGen('devices.pathetic-fallacy', 'devices.imagery', [2, 5], PATHETIC),
  bankGen('devices.semantic-field', 'devices.imagery', [2, 5], SEMANTIC),
  classifyGen('devices.rhetoric-identify', 'devices.rhetoric', [1, 4], {
    rows: RHETORIC,
    cats: pick('rhetorical question', 'repetition', 'rule of three', 'direct address', 'emotive language'),
    prompt: (e) => `Which persuasive technique is used here?\n${e.text}`,
    hint: 'Question for effect? Repeated word? Three things? "You"? Words to make you feel?',
  }),
  termMatchGen('devices.match', 'devices.rhetoric', [2, 5], DEVICE_TERMS, 'Match each device to what it does.'),
  termChoiceGen('devices.define', 'devices.exaggeration-contrast', [2, 4], DEVICE_TERMS, 'device'),
]
