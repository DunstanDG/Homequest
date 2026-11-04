import type { Skill } from '@/engine/types'

/**
 * Skills for the German Topics part: vocabulary topics, reading, translation, sounds and spelling, and culture.
 * Ids are permanent (progress is stored against them). Prerequisites are written in full ('german.vocab.family') or
 * relative to 'german.' ('vocab.colours').
 */
const S = (id: string, year: number, strand: string, name: string, description: string, prereqs: string[]): Skill => ({
  id: `german.${id}`,
  subject: 'german',
  year,
  strand,
  name,
  description,
  prereqs: prereqs.map((p) => (p.startsWith('german.') ? p : `german.${p}`)),
  origin: 'syllabus',
})

const NUM = 'Vocabulary: Numbers and time'
const EVERY = 'Vocabulary: Everyday words'
const ME = 'Vocabulary: Me and others'
const FREE = 'Vocabulary: Free time'
const SCHOOL = 'Vocabulary: School and work'
const HOME = 'Vocabulary: Home and town'
const FOOD = 'Vocabulary: Food and shopping'
const TRAVEL = 'Vocabulary: Travel and holidays'
const READ = 'Reading'
const TRANS = 'Translation'
const SOUND = 'Sounds and spelling'
const CULT = 'Culture'

export const topicSkills: Skill[] = [
  // --------------------------------------------------------------- sounds and spelling
  S('sounds.alphabet', 7, SOUND, 'The German alphabet', 'Say and recognise the German letter names (ih, eh, jott, fau, weh...) and spell words aloud.', []),
  S('sounds.vowels', 7, SOUND, 'Vowel sounds and umlauts', 'Tell ei from ie, say au and eu/äu, and hear the difference an umlaut makes (schon / schön).', ['sounds.alphabet']),
  S('sounds.consonants', 7, SOUND, 'Consonant sounds', 'Say w, v, z, s, j, sch, sp, st and ch the German way, and spell words from how they sound.', ['sounds.alphabet']),
  S('sounds.spelling', 8, SOUND, 'Spelling rules', 'Capital letters for nouns, ß or ss, and the gender of compound nouns.', ['sounds.vowels', 'sounds.consonants', 'german.grammar.articles']),

  // --------------------------------------------------------------- numbers and time
  S('vocab.numbers-100', 7, NUM, 'Numbers to 100', 'Read and write numbers up to 100, remembering that the units come first (siebenundvierzig = 47).', ['german.vocab.numbers']),
  S('vocab.calendar', 7, NUM, 'Days, months and dates', 'Days of the week, months, seasons and dates (am dritten Mai), including birthdays.', ['vocab.numbers-100']),
  S('vocab.clock', 7, NUM, 'Telling the time', 'Tell the time with Uhr, nach, vor, Viertel and halb (halb drei = 2:30), and read the 24-hour clock.', ['vocab.numbers-100']),

  // --------------------------------------------------------------- everyday words
  S('vocab.colours', 7, EVERY, 'Colours', 'Name colours and use them to describe things.', ['german.vocab.greetings']),
  S('vocab.questions', 7, EVERY, 'Question words', 'Understand and use wer, was, wo, wohin, woher, wann, wie, wie viel, warum and welche in conversation.', ['german.vocab.greetings']),

  // --------------------------------------------------------------- me and others
  S('vocab.describing', 7, ME, 'Describing people', 'Describe hair, eyes, height and personality, for yourself and others.', ['vocab.colours', 'german.vocab.family']),
  S('vocab.family-pets', 7, ME, 'Family and pets: more words', 'Parents, siblings, step- and half-family, cousins, and more pets.', ['german.vocab.family', 'german.vocab.animals']),
  S('vocab.health', 9, ME, 'The body and healthy living', 'Name parts of the body, say what hurts, and talk about healthy and unhealthy habits.', ['vocab.describing', 'german.vocab.food']),

  // --------------------------------------------------------------- free time
  S('vocab.hobbies', 7, FREE, 'Hobbies and sport', 'Talk about sports, instruments and hobbies, and how often you do them.', ['german.vocab.greetings']),
  S('vocab.media', 8, FREE, 'TV, film and music', 'Types of film, TV programme and music, with opinions about them.', ['vocab.hobbies']),
  S('vocab.technology', 8, FREE, 'Technology and social media', 'Mobile phones, the internet, apps and social media, and staying safe online.', ['vocab.hobbies']),

  // --------------------------------------------------------------- school and work
  S('vocab.subjects', 7, SCHOOL, 'School subjects and the school day', 'Name school subjects, give opinions about them, and talk about the school day.', ['german.vocab.school']),
  S('vocab.jobs', 9, SCHOOL, 'Jobs and future plans', 'Name jobs (male and female forms), say where people work, and what you would like to be.', ['vocab.subjects']),

  // --------------------------------------------------------------- home and town
  S('vocab.home', 8, HOME, 'House and home', 'Types of home, rooms and furniture, and describing your bedroom.', ['vocab.describing']),
  S('vocab.town', 8, HOME, 'Places in town', 'Name places and shops in a town and say what you do there.', ['vocab.questions']),
  S('vocab.directions', 8, HOME, 'Asking for and giving directions', 'Ask the way and understand directions: geradeaus, links, rechts, die erste Straße...', ['vocab.town']),

  // --------------------------------------------------------------- food and shopping
  S('vocab.cafe', 8, FOOD, 'Meals, café and restaurant', 'Meals of the day, dishes and drinks, and the phrases for ordering and paying.', ['german.vocab.food', 'german.vocab.greetings']),
  S('vocab.shopping', 8, FOOD, 'Shopping: quantities and prices', 'Ask for amounts (ein Kilo, eine Flasche) and understand prices in euros and cents.', ['german.vocab.food', 'vocab.numbers-100']),
  S('vocab.clothes', 8, FOOD, 'Clothes and school uniform', 'Name clothes, describe what people wear and talk about school uniform.', ['vocab.colours']),

  // --------------------------------------------------------------- travel and holidays
  S('vocab.weather', 8, TRAVEL, 'Weather and seasons', 'Describe the weather and understand a simple forecast.', ['vocab.calendar']),
  S('vocab.countries', 8, TRAVEL, 'Countries, nationalities and languages', 'Name countries, nationalities (male and female) and languages, and say where you come from.', ['culture.countries']),
  S('vocab.holidays', 8, TRAVEL, 'Holidays and transport', 'Means of transport, places to stay and holiday activities.', ['vocab.weather', 'vocab.countries']),

  // --------------------------------------------------------------- reading
  S('reading.short', 7, READ, 'Reading short texts', 'Understand short texts about people, family, pets and hobbies, and answer questions in English.', ['vocab.family-pets', 'vocab.hobbies', 'vocab.describing']),
  S('reading.texts', 8, READ, 'Reading everyday texts', 'Understand blogs, emails, menus, timetables and weather forecasts, including details like times and prices.', ['reading.short', 'vocab.cafe', 'vocab.weather']),
  S('reading.longer', 9, READ, 'Reading longer texts', 'Follow longer texts that mix past, present and future, and work out opinions and reasons.', ['reading.texts', 'vocab.holidays']),

  // --------------------------------------------------------------- translation
  S('translate.to-english', 8, TRANS, 'Translating into English', 'Translate German sentences accurately into English, spotting false friends, negatives and time phrases.', ['reading.short']),
  S('translate.to-german', 8, TRANS, 'Translating into German', 'Translate short sentences into German with the verb in the right place and correct spelling.', ['translate.to-english', 'sounds.spelling']),
  S('translate.past', 9, TRANS, 'Translating past and future', 'Translate sentences about the past and the future in both directions.', ['translate.to-german', 'german.grammar.sein-haben']),

  // --------------------------------------------------------------- culture
  S('culture.countries', 7, CULT, 'German-speaking countries and cities', 'Where German is spoken, capital cities, famous cities and their German names, rivers and landmarks.', []),
  S('culture.festivals', 8, CULT, 'Festivals and traditions', 'Advent, Christmas markets, Nikolaustag, Sankt Martin, Silvester, Karneval/Fasching, Easter and Oktoberfest.', ['culture.countries', 'vocab.calendar']),
  S('culture.everyday', 8, CULT, 'Everyday life in German-speaking countries', 'School life, du and Sie, greetings, meals and customs.', ['culture.countries', 'vocab.subjects']),
]
