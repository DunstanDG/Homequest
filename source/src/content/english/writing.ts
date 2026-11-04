import type { ItemGenerator } from '@/engine/registry'
import { bankGen, classifyGen, revealGen, sequenceGen, termMatchGen, type Example, type MC, type Sequence, type Task, type Term } from './helpers'
import { PASSAGES } from './passages'

const fig = (id: string) => PASSAGES.find((p) => p.id === id)!.fig

// =====================================================================================================
// Paragraphing
// =====================================================================================================

const NEW_PARA: Example[] = [
  { text: '...we ate our picnic by the river. // Three hours later, the sky had turned black.', a: 'time', why: '"Three hours later" moves the story on in time.', lv: 1 },
  { text: '...the classroom was silent. // Out in the playground, the wind was howling.', a: 'place', why: 'The scene moves from the classroom to the playground.', lv: 1 },
  { text: '...so uniform saves families money. // Another argument concerns behaviour in lessons.', a: 'topic', why: 'The article moves on to a new point.', lv: 2 },
  { text: '"Where have you been?" asked Mum. // "Nowhere," muttered Sam.', a: 'person', why: 'A new speaker needs a new paragraph (new line).', lv: 1 },
  { text: '...and finally we fell asleep. // The next morning, the tent was covered in frost.', a: 'time', why: '"The next morning" moves on in time.', lv: 1 },
  { text: '...the beach was packed with tourists. // Meanwhile, back at the hotel, Grandad was fast asleep.', a: 'place', why: 'The focus moves to a different place.', not: ['time', 'person'], lv: 3 },
  { text: '...that is why exercise matters. // Diet is just as important for staying healthy.', a: 'topic', why: 'The writer moves to a new topic: diet.', lv: 2 },
  { text: '...Mia waved goodbye at the gate. // Her brother, Leo, had never liked goodbyes.', a: 'person', why: 'The focus switches to a different character.', lv: 3 },
  { text: '...London is busy and exciting. // In contrast, the Scottish Highlands offer peace and space.', a: 'place', not: ['topic'], why: 'The text moves to describe a different place.', lv: 4 },
  { text: '...Victorian children often worked long hours. // Today, most children in Britain spend those hours in school.', a: 'time', not: ['topic'], why: '"Today" jumps forward in time.', lv: 4 },
]

const TOPIC_SENTENCE: MC[] = [
  { q: 'Which is the best topic sentence for this paragraph?\n"___ They can provide a lifelong friendship. Walking a dog keeps owners active. Studies suggest pets can even reduce stress."', a: 'Owning a pet has many benefits.', w: [{ label: 'My dog is called Biscuit.', feedback: 'Too personal and specific: it does not introduce the paragraph\'s point.' }, { label: 'Some people are allergic to cats.', feedback: 'That is about a drawback, not the benefits listed.' }, { label: 'Walking is good exercise.', feedback: 'That covers only one sentence\'s idea.' }], hint: 'A topic sentence sums up what the whole paragraph is about.', ex: 'Every sentence in the paragraph is a benefit of pets.', lv: 2 },
  { q: 'Which is the best topic sentence for this paragraph?\n"___ The Globe was open to the sky. Plays were performed in daylight. Poorer people stood in the yard to watch."', a: 'Going to the theatre in Shakespeare\'s time was very different from today.', w: [{ label: 'Shakespeare wrote Macbeth.', feedback: 'True, but not what the paragraph is about.' }, { label: 'The yard was muddy.', feedback: 'A detail, not an overview.' }, { label: 'I went to the theatre last week.', feedback: 'Off topic.' }], hint: 'What links all three details?', ex: 'All three details describe theatre-going in Shakespeare\'s time.', lv: 3 },
  { q: 'Which is the best topic sentence for this paragraph?\n"___ Plastic bottles take hundreds of years to break down. Sea creatures can mistake plastic for food. Microplastics have been found in the deepest oceans."', a: 'Plastic pollution is a serious threat to the oceans.', w: [{ label: 'Bottles can be made of glass.', feedback: 'Not the main idea.' }, { label: 'The ocean is very deep.', feedback: 'Only linked to one detail.' }, { label: 'I recycle at home.', feedback: 'Off topic and personal.' }], hint: 'Sum up all three details.', ex: 'The sentences all show how plastic harms the sea.', lv: 2 },
  { q: 'What is a topic sentence?', a: 'the opening sentence of a paragraph that tells the reader what it is about', w: ['the last sentence of a whole essay', 'a sentence that contains a quotation', 'a sentence written in brackets'], hint: 'It introduces the paragraph.', ex: 'A topic sentence signposts the main point of the paragraph.', lv: 1 },
  { q: 'Which is NOT a reason to start a new paragraph?', a: 'You have written three sentences.', w: [{ label: 'The story moves to a new place.', feedback: 'That IS a reason (place).' }, { label: 'A new person starts speaking.', feedback: 'That IS a reason (person).' }, { label: 'Time moves on.', feedback: 'That IS a reason (time).' }], hint: 'Remember TiPToP: time, place, topic, person.', ex: 'Paragraphs change with time, place, topic or person, not after a set number of sentences.', lv: 2 },
]

// =====================================================================================================
// Cohesion
// =====================================================================================================

const CONNECTIVES: Example[] = [
  { text: 'However', a: 'contrasting', why: '"However" introduces a contrasting point.', lv: 1 },
  { text: 'Furthermore', a: 'adding', why: '"Furthermore" adds another point.', lv: 2 },
  { text: 'Therefore', a: 'showing cause and effect', why: '"Therefore" introduces a result.', lv: 2 },
  { text: 'Firstly', a: 'sequencing', why: '"Firstly" puts ideas in order.', lv: 1 },
  { text: 'For example', a: 'giving an example', why: '"For example" introduces an illustration.', lv: 1 },
  { text: 'In conclusion', a: 'summing up', why: '"In conclusion" introduces a summary.', lv: 1 },
  { text: 'Similarly', a: 'comparing', why: '"Similarly" shows a likeness.', lv: 2 },
  { text: 'Moreover', a: 'adding', why: '"Moreover" adds a further point.', lv: 3 },
  { text: 'On the other hand', a: 'contrasting', why: 'It introduces the opposite view.', lv: 2 },
  { text: 'Consequently', a: 'showing cause and effect', why: '"Consequently" means "as a result".', lv: 3 },
  { text: 'Nevertheless', a: 'contrasting', why: '"Nevertheless" means "in spite of that".', lv: 4 },
  { text: 'Meanwhile', a: 'sequencing', why: '"Meanwhile" signals events happening at the same time: it organises time.', lv: 3 },
  { text: 'For instance', a: 'giving an example', why: '"For instance" introduces an example.', lv: 2 },
  { text: 'Likewise', a: 'comparing', why: '"Likewise" shows a similarity.', lv: 3 },
  { text: 'Overall', a: 'summing up', why: '"Overall" introduces a summary.', lv: 3 },
  { text: 'As a result', a: 'showing cause and effect', why: 'It introduces a consequence.', lv: 2 },
  { text: 'In addition', a: 'adding', why: 'It adds another point.', lv: 1 },
  { text: 'Subsequently', a: 'sequencing', why: '"Subsequently" means "afterwards".', lv: 5 },
  { text: 'Above all', a: 'emphasising', why: '"Above all" highlights the most important point.', lv: 4 },
  { text: 'In particular', a: 'emphasising', why: '"In particular" singles something out for emphasis.', not: ['giving an example'], lv: 5 },
]

const CONNECTIVE_FIT: MC[] = [
  { q: 'Choose the best connective: "I wanted to go to the concert. ___, the tickets had sold out."', a: 'Unfortunately', w: ['Furthermore', 'Similarly', 'For example'], hint: 'The second sentence is a disappointment.', ex: '"Unfortunately" signals a setback; the others add, compare or illustrate.', lv: 1 },
  { q: 'Choose the best connective: "School uniform saves money. ___, it reduces pressure to wear expensive brands."', a: 'Furthermore', w: ['However', 'In contrast', 'Nevertheless'], hint: 'The second sentence adds another point in favour.', ex: '"Furthermore" adds a supporting point.', lv: 2 },
  { q: 'Choose the best connective: "The roads were icy. ___, many schools closed."', a: 'As a result', w: ['However', 'For example', 'Similarly'], hint: 'The closures happened because of the ice.', ex: '"As a result" links cause and effect.', lv: 2 },
  { q: 'Choose the best connective: "Many animals hibernate in winter. ___, hedgehogs sleep from about November to March."', a: 'For example', w: ['However', 'In conclusion', 'Therefore'], hint: 'Hedgehogs are an illustration.', ex: '"For example" introduces a specific case.', lv: 2 },
  { q: 'Choose the best connective: "Text A presents the city as exciting. ___, Text B presents it as exhausting."', a: 'In contrast', w: ['Similarly', 'Furthermore', 'For instance'], hint: 'The two views are opposite.', ex: '"In contrast" introduces a difference.', lv: 3 },
  { q: 'Choose the best connective: "Beatrice mocks love in Act 1. ___, Benedick swears he will never marry."', a: 'Similarly', w: ['However', 'Consequently', 'For example'], hint: 'Both characters share the same attitude.', ex: '"Similarly" shows a likeness between them.', lv: 3 },
  { q: 'Choose the best connective: "The film had some exciting moments. ___, it was far too long."', a: 'Nevertheless', w: ['Moreover', 'Therefore', 'Similarly'], hint: 'The second sentence goes against the first.', ex: '"Nevertheless" introduces a contrasting point.', lv: 4 },
  { q: 'What is cohesion in writing?', a: 'how well the ideas link together so the writing flows', w: ['how neat the handwriting is', 'how many long words are used', 'how many paragraphs there are'], hint: 'Think of the glue between sentences and paragraphs.', ex: 'Cohesive devices (connectives, pronouns, repeated key words) link ideas.', lv: 2 },
]

// =====================================================================================================
// Narrative
// =====================================================================================================

const STORY_STAGES: Sequence[] = [
  { name: 'a classic story structure', steps: ['Exposition: introduce the characters and setting', 'Rising action: a problem develops and tension builds', 'Climax: the most tense, dramatic moment', 'Falling action: the consequences unfold', 'Resolution: the problem is resolved'], lv: 2 },
  { name: 'a short story', steps: ['Ella moves to a quiet seaside town.', 'She finds an old key buried in the sand.', 'She discovers it opens the locked lighthouse.', 'Inside the lighthouse, a storm traps her as the tide rises.', 'A lifeboat crew rescues her at dawn.', 'Ella returns the key to the lighthouse keeper\'s family.'], lv: 3 },
  { name: 'a mystery story', steps: ['A valuable painting hangs in the village museum.', 'One morning, the painting is gone.', 'A detective interviews the suspects.', 'She notices muddy footprints leading to the caretaker\'s shed.', 'The caretaker confesses.', 'The painting returns to the museum.'], lv: 3 },
]

const OPENINGS: Example[] = [
  { text: '"Run!" screamed Jas. "It\'s right behind us!"', a: 'dialogue', not: ['action (in medias res)'], why: 'It begins with a character speaking.', lv: 1 },
  { text: 'The car skidded off the road and plunged into the river.', a: 'action (in medias res)', why: 'It starts in the middle of dramatic action.', lv: 1 },
  { text: 'The village of Little Hollow lay at the bottom of a misty valley, its crooked chimneys puffing smoke into the grey sky.', a: 'setting', why: 'It opens by describing a place.', lv: 1 },
  { text: 'Marcus was the tallest boy in Year 8, with hands too big for his body and a laugh you could hear three corridors away.', a: 'character', why: 'It opens by describing a person.', lv: 2 },
  { text: 'Have you ever wondered what it would be like to vanish?', a: 'a question to the reader', why: 'It opens by asking the reader directly.', lv: 2 },
  { text: '"I\'m not going," said Gran firmly, folding her arms.', a: 'dialogue', why: 'It opens with speech.', lv: 2 },
  { text: 'The ice cracked beneath my feet, and I was falling.', a: 'action (in medias res)', why: 'Straight into dramatic action.', lv: 2 },
  { text: 'Nobody knew where Miss Finch had come from, or why she wore one red glove.', a: 'character', why: 'It opens by introducing an intriguing character.', not: ['a question to the reader'], lv: 3 },
  { text: 'What would you do if you found a door that was not there yesterday?', a: 'a question to the reader', why: 'It asks the reader a question.', lv: 3 },
  { text: 'Snow had fallen all night, burying the farm in silence.', a: 'setting', why: 'It opens by describing the place and atmosphere.', lv: 3 },
]

const SHOW_TELL: MC[] = [
  { q: 'Which sentence SHOWS (rather than tells) that Sam is nervous?', a: 'Sam\'s hands trembled as he tugged at his collar.', w: [{ label: 'Sam was really nervous.', feedback: 'That TELLS us directly.' }, { label: 'Sam yawned and stretched lazily.', feedback: 'That shows he is tired or relaxed.' }, { label: 'Sam grinned and punched the air.', feedback: 'That shows he is delighted.' }], hint: 'Look for actions and body language.', ex: 'Trembling hands and fiddling with his collar let the reader work out that he is nervous.', lv: 1 },
  { q: 'Which sentence SHOWS (rather than tells) that Priya is angry?', a: 'Priya slammed the door so hard the windows rattled.', w: [{ label: 'Priya was furious.', feedback: 'That tells us.' }, { label: 'Priya hummed as she tidied her desk.', feedback: 'That shows contentment.' }, { label: 'Priya\'s eyes filled with tears as she hugged her friend.', feedback: 'That suggests sadness or affection.' }], hint: 'What would an angry person do?', ex: 'Slamming the door shows anger through action.', lv: 1 },
  { q: 'Which sentence SHOWS (rather than tells) that the house is old?', a: 'Paint peeled from the shutters and the porch steps sagged under every footstep.', w: [{ label: 'The house was very old.', feedback: 'That tells us.' }, { label: 'The house had a shiny new front door.', feedback: 'That suggests it is new.' }, { label: 'The house was big.', feedback: 'That is about size, and it tells.' }], hint: 'Which details let you work it out?', ex: 'Peeling paint and sagging steps show age.', lv: 2 },
  { q: 'Which sentence SHOWS (rather than tells) that Grandad is tired?', a: 'Grandad sank into his armchair, his eyelids drooping.', w: [{ label: 'Grandad was exhausted.', feedback: 'That tells us.' }, { label: 'Grandad leapt up and danced around the kitchen.', feedback: 'That shows energy.' }, { label: 'Grandad frowned and clenched his fists.', feedback: 'That suggests anger.' }], hint: 'Think of body language.', ex: 'Sinking into a chair with drooping eyelids shows tiredness.', lv: 2 },
  { q: 'Which sentence SHOWS (rather than tells) that it is cold?', a: 'Our breath hung in clouds and the puddles had turned to glass.', w: [{ label: 'It was freezing.', feedback: 'That tells us.' }, { label: 'The sun blazed down on the beach.', feedback: 'That suggests heat.' }, { label: 'It was a cold day in winter.', feedback: 'That tells us.' }], hint: 'What would you see on a freezing day?', ex: 'Visible breath and frozen puddles show the cold.', lv: 2 },
  { q: 'Why do writers try to "show, not tell"?', a: 'It lets readers work things out and makes the writing more vivid.', w: ['It makes stories shorter.', 'It avoids using any verbs.', 'It is the only way to write dialogue.'], hint: 'Which is more interesting: being told, or seeing it?', ex: 'Showing involves the reader and creates a clearer picture.', lv: 3 },
]

// =====================================================================================================
// Descriptive writing
// =====================================================================================================

const VERB_CHOICE: MC[] = [
  { q: 'Which verb best suggests the old man is weak and tired?\n"The old man ___ down the corridor."', a: 'shuffled', w: ['sprinted', 'strode', 'skipped'], hint: 'Picture slow, dragging feet.', ex: '"Shuffled" suggests slow, tired steps.', lv: 1 },
  { q: 'Which verb best suggests the girl is confident?\n"She ___ onto the stage."', a: 'strode', w: ['crept', 'stumbled', 'tiptoed'], hint: 'Long, purposeful steps.', ex: '"Strode" suggests confidence.', lv: 2 },
  { q: 'Which verb best suggests the fox is moving secretly?\n"The fox ___ along the hedge."', a: 'slunk', w: ['bounded', 'marched', 'stomped'], hint: 'Low and quiet.', ex: '"Slunk" suggests stealth.', lv: 3 },
  { q: 'Which word is the most precise replacement for "nice" in: "We had a nice meal"?', a: 'delicious', w: ['good', 'okay', 'fine'], hint: 'Which word actually tells us something about the food?', ex: '"Delicious" is precise; the others are as vague as "nice".', lv: 1 },
  { q: 'Which verb best suggests the rain is violent?\n"Rain ___ against the windows."', a: 'hammered', w: ['fell', 'dripped', 'drifted'], hint: 'Which sounds most forceful?', ex: '"Hammered" makes the rain sound forceful and aggressive.', lv: 2 },
  { q: 'Which phrase uses the most vivid adjectives?', a: 'a crooked, rusting gate', w: ['a nice old gate', 'a gate that was there', 'a very good gate'], hint: 'Which one lets you picture it?', ex: '"Crooked" and "rusting" create a clear picture.', lv: 1 },
  { q: 'Which sentence uses sensory description most effectively?', a: 'The sour tang of seaweed hung in the salty air as gulls shrieked overhead.', w: ['The beach was nice and we liked it.', 'We went to the beach on Tuesday.', 'There was a beach and some birds.'], hint: 'Which senses can you find?', ex: 'It appeals to smell/taste (sour tang, salty) and sound (shrieked).', lv: 2 },
  { q: 'A writer describes a forest as "whispering", "breathing" and "watching". What effect does this personification create?', a: 'The forest seems alive and watchful, which is unsettling.', w: ['The forest seems empty and dead.', 'It makes the forest sound like a city.', 'It shows the season is summer.'], hint: 'What if a forest could watch you?', ex: 'Giving the forest human actions makes it feel alive and threatening.', lv: 4 },
]

// =====================================================================================================
// Persuasive writing (AFOREST) and argument
// =====================================================================================================

const AFOREST: Example[] = [
  { text: 'Save our seas from shocking, senseless plastic!', a: 'alliteration', not: ['emotive language', 'opinion'], why: 'Repeated "s" sounds make the slogan memorable.', lv: 2 },
  { text: 'The school field covers about two hectares.', a: 'fact', not: ['statistic'], why: 'This can be checked and measured.', lv: 2 },
  { text: 'Homework clubs are the best idea the school has ever had.', a: 'opinion', why: 'A personal judgement presented to persuade.', lv: 1 },
  { text: 'Would you want to breathe this filthy air every day?', a: 'rhetorical question', not: ['emotive language', 'opinion'], why: 'A question asked for effect.', lv: 1 },
  { text: 'Helpless, starving animals are left to suffer alone.', a: 'emotive language', not: ['alliteration', 'opinion'], why: 'Words like "helpless", "starving" and "suffer" stir pity.', lv: 1 },
  { text: 'Nine out of ten pupils in our survey wanted longer lunch breaks.', a: 'statistic', not: ['fact'], why: 'A number used as evidence.', lv: 1 },
  { text: 'Our new park will be safer, greener and friendlier.', a: 'rule of three', not: ['opinion'], why: 'Three adjectives grouped for impact.', lv: 2 },
  { text: 'Over 70% of local residents have signed the petition.', a: 'statistic', not: ['fact'], why: 'A percentage used to persuade.', lv: 2 },
  { text: 'Isn\'t it time we listened to young people?', a: 'rhetorical question', not: ['opinion'], why: 'A question that expects agreement.', lv: 2 },
  { text: 'It is cruel, it is unfair and it must stop.', a: 'rule of three', not: ['emotive language', 'opinion'], why: 'Three linked clauses build to a forceful ending.', lv: 3 },
  { text: 'The new library opens on Saturday at 10am.', a: 'fact', not: ['statistic'], why: 'This can be checked.', lv: 3 },
  { text: 'Brilliant books, brighter futures.', a: 'alliteration', not: ['opinion', 'emotive language'], why: 'Repeated "b" sounds make it catchy.', lv: 3 },
]

const ARGUMENT: MC[] = [
  { q: 'In an article arguing FOR a four-day school week, which sentence is a counter-argument?', a: 'Some people worry that pupils would fall behind with less time in school.', w: [{ label: 'A four-day week would give pupils time to rest.', feedback: 'That supports the writer\'s argument.' }, { label: 'Teachers would be less tired.', feedback: 'That supports the argument.' }, { label: 'Surely we all want happier pupils?', feedback: 'A rhetorical question supporting the argument.' }], hint: 'A counter-argument is the OTHER side\'s view.', ex: 'A counter-argument acknowledges the opposing view.', lv: 2 },
  { q: 'What is a rebuttal?', a: 'a reply that shows why a counter-argument is wrong or weak', w: ['the opening sentence of a speech', 'a list of facts', 'a type of rhetorical question'], hint: 'You "rebut" the other side\'s point.', ex: 'Writers raise a counter-argument and then rebut it.', lv: 3 },
  { q: 'Which sentence best rebuts this counter-argument: "Some say phones distract pupils in lessons."?', a: 'However, with clear rules, phones can be locked away in lessons and used for learning when teachers choose.', w: [{ label: 'Phones are very popular.', feedback: 'That does not answer the worry.' }, { label: 'Yes, phones are very distracting.', feedback: 'That agrees with the counter-argument.' }, { label: 'I like my phone.', feedback: 'A personal preference, not a rebuttal.' }], hint: 'A rebuttal answers the concern.', ex: 'It accepts the concern exists, then shows how it can be overcome.', lv: 4 },
  { q: 'Why does including a counter-argument make persuasive writing stronger?', a: 'It shows the writer has considered other views, making their own argument more convincing.', w: ['It makes the writing longer.', 'It shows the writer is unsure.', 'It confuses the reader so they agree.'], hint: 'Think about how a fair-minded reader reacts.', ex: 'Dealing with the other side makes the writer seem reasonable and well informed.', lv: 4 },
  { q: 'What does AFOREST stand for?', a: 'Alliteration, Facts, Opinions, Rhetorical questions, Emotive language, Statistics, Triples (rule of three)', w: ['Adjectives, Full stops, Openings, Rhyme, Endings, Similes, Titles', 'Argument, Form, Order, Reason, Evidence, Speech, Text', 'Alliteration, Fiction, Onomatopoeia, Repetition, Exclamation, Simile, Tone'], hint: 'They are all persuasive techniques.', ex: 'AFOREST is a memory aid for persuasive techniques.', lv: 1 },
  { q: 'Which is the most effective way to end a persuasive speech?', a: 'A memorable call to action that tells the audience what to do', w: ['A new, unrelated topic', 'An apology for speaking', 'A list of every point again in full'], hint: 'What do you want the audience to do next?', ex: 'A clear call to action leaves the audience ready to act.', lv: 3 },
]

// =====================================================================================================
// Transactional forms
// =====================================================================================================

const FORM_FEATURES: Term[] = [
  { term: 'formal letter', def: 'addresses, date, "Dear...", and "Yours faithfully" or "Yours sincerely"', lv: 1 },
  { term: 'newspaper article', def: 'headline, strapline, byline and short paragraphs', lv: 2 },
  { term: 'speech', def: 'greets the audience directly and uses rhetorical devices to be heard', lv: 2 },
  { term: 'leaflet', def: 'title, subheadings, bullet points and images on a folded page', lv: 2 },
  { term: 'report', def: 'formal sections with headings and recommendations', lv: 3 },
  { term: 'review', def: 'gives an opinion of a book, film or event, often with a rating', lv: 2 },
  { term: 'blog', def: 'a personal, chatty online post that often invites comments', lv: 3 },
]

const FORMS_MC: MC[] = [
  { q: 'A letter begins "Dear Sir or Madam". How should it end?', a: 'Yours faithfully', w: [{ label: 'Yours sincerely', feedback: 'Use "Yours sincerely" when you know the person\'s name.' }, 'Love from', 'See you soon'], hint: 'You do not know their name.', ex: '"Dear Sir or Madam" pairs with "Yours faithfully".', lv: 2 },
  { q: 'A letter begins "Dear Mrs Patel". How should it end?', a: 'Yours sincerely', w: [{ label: 'Yours faithfully', feedback: 'Use "Yours faithfully" with "Dear Sir or Madam".' }, 'Cheers', 'Bye for now'], hint: 'You know her name.', ex: 'When you use the person\'s name, end with "Yours sincerely".', lv: 2 },
  { q: 'In a newspaper article, what is a "strapline"?', a: 'a short line under the headline that adds detail', w: ['the writer\'s name', 'the last paragraph', 'a photograph caption'], hint: 'It sits just below the headline.', ex: 'A strapline (or subheading) expands on the headline.', lv: 3 },
  { q: 'In a newspaper article, what is the "byline"?', a: 'the line giving the writer\'s name', w: ['the main headline', 'the date of the newspaper', 'the final sentence'], hint: '"By..."', ex: 'The byline says who wrote the article.', lv: 3 },
  { q: 'Where does your own address go in a formal letter?', a: 'at the top right', w: ['at the bottom left', 'in the middle of the first paragraph', 'after the signature'], hint: 'The recipient\'s address goes on the left, lower down.', ex: 'Traditionally, your address goes top right and the recipient\'s address on the left.', lv: 3 },
  { q: 'Which feature makes a leaflet easy to scan quickly?', a: 'subheadings and bullet points', w: ['very long paragraphs', 'no title', 'tiny print with no breaks'], hint: 'How do readers find information fast?', ex: 'Subheadings and bullet points break information into chunks.', lv: 1 },
  { q: 'Which opening suits a speech to your year group?', a: 'Good morning, everyone. Imagine a school where every voice is heard.', w: ['Dear Sir or Madam,', 'Once upon a time there was a school.', 'Chapter One'], hint: 'A speech speaks directly to its audience.', ex: 'Greeting the audience and hooking them with "Imagine..." suits a speech.', lv: 2 },
  { q: 'What should the first paragraph of a formal letter of complaint do?', a: 'State clearly why you are writing.', w: ['Tell a long joke.', 'List every possible solution.', 'Sign off.'], hint: 'The reader needs to know the purpose straight away.', ex: 'Open by stating the purpose: "I am writing to complain about...".', lv: 3 },
  { q: 'What does "PAF" stand for when planning non-fiction writing?', a: 'Purpose, Audience, Form', w: ['Paragraphs, Adjectives, Full stops', 'Point, Analyse, Finish', 'Persuade, Argue, Format'], hint: 'Why are you writing, for whom, and in what format?', ex: 'Purpose, audience and form shape every choice in non-fiction writing.', lv: 1 },
]

// =====================================================================================================
// Analytical paragraphs
// =====================================================================================================

const PEE: Sequence[] = [
  { name: 'a PEE paragraph about Scrooge', steps: ['Dickens presents Scrooge as cold and unfeeling.', 'He describes him as "Hard and sharp as flint".', 'The simile suggests Scrooge is tough and unyielding, and that he could hurt others.', 'This prepares the reader for the great change that comes later.'], lv: 2 },
  { name: 'a PEE paragraph about Beatrice', steps: ['Shakespeare presents Beatrice as witty and independent.', 'She declares that she would "rather hear my dog bark at a crow than a man swear he loves me".', 'This comic image shows she refuses to be an eager, romantic bride.', 'This makes her unusual for a woman of her time.'], lv: 3 },
  { name: 'a PEE paragraph about the storm', steps: ['The writer presents the storm as violent.', 'Rain "hammered the windows like fists".', 'The simile makes the storm seem to attack the lighthouse, building tension.', 'This makes the reader fear for Nell and her father.'], lv: 2 },
  { name: 'a PEE paragraph about Macbeth', steps: ['Macbeth is consumed by guilt after murdering Duncan.', 'He asks, "Will all great Neptune\'s ocean wash this blood / Clean from my hand?"', 'The hyperbole suggests that nothing could ever cleanse his guilt.', 'This marks the start of his mental torment.'], lv: 4 },
]

const PEE_PART: Example[] = [
  { text: 'Dickens presents Scrooge as a miser.', a: 'Point', why: 'It makes a clear claim that answers the question.', lv: 1 },
  { text: 'Dickens describes him as "a squeezing, wrenching, grasping, scraping, clutching, covetous, old sinner".', a: 'Evidence', why: 'It gives a quotation as proof.', lv: 1 },
  { text: 'The list of verbs suggests he is obsessed with grabbing and holding on to money.', a: 'Explain', why: 'It explains what the quotation suggests.', lv: 2 },
  { text: 'In the balcony scene, Romeo says that "Juliet is the sun".', a: 'Evidence', why: 'It provides a quotation.', lv: 2 },
  { text: 'This metaphor suggests that Juliet is the centre of Romeo\'s world, giving it light and warmth.', a: 'Explain', why: 'It analyses the effect of the quotation.', lv: 3 },
  { text: 'Owen presents war as exhausting and degrading.', a: 'Point', why: 'It states the main idea of the paragraph.', lv: 3 },
  { text: 'The word "trudge" implies the soldiers are too tired to lift their feet.', a: 'Explain', why: 'It zooms in on a word and explains its effect.', lv: 4 },
  { text: 'Claudio calls Hero a "rotten orange".', a: 'Evidence', why: 'It presents the quotation.', lv: 3 },
]

const EMBED: MC[] = [
  { q: 'Which sentence embeds the quotation most smoothly?', a: 'Scrooge is "solitary as an oyster", which suggests he shuts people out.', w: [{ label: 'Scrooge is lonely. "secret, and self-contained, and solitary as an oyster." This shows he is lonely.', feedback: 'The quotation is dropped in on its own, and the explanation just repeats the point.' }, { label: 'The quote that shows this is when it says solitary as an oyster.', feedback: 'There are no quotation marks and it is clumsy.' }, { label: 'Scrooge is like an oyster because Dickens said so.', feedback: 'No quotation and no analysis.' }], hint: 'An embedded quotation fits into your own sentence.', ex: 'The quotation flows as part of the sentence, followed by analysis.', lv: 2 },
  { q: 'Which is the best length of quotation to support the point "Pip is frightened"?', a: '"a fearful man"', w: [{ label: 'the whole first paragraph of the chapter', feedback: 'Too long: pick the key words.' }, { label: '"A"', feedback: 'Too short to prove anything.' }, { label: '"with no hat"', feedback: 'That does not show fear.' }], hint: 'Short, precise and relevant.', ex: 'Short, relevant quotations are easier to analyse.', lv: 2 },
  { q: 'Which sentence analyses a quotation rather than retelling the plot?', a: 'The verb "crept" makes the cloud seem like a predator stalking its prey.', w: [{ label: 'Then a cloud came over and it rained.', feedback: 'That just retells what happens.' }, { label: 'The cloud was there in paragraph 2.', feedback: 'That identifies but does not analyse.' }, { label: 'I liked the part about the cloud.', feedback: 'Personal response, not analysis.' }], hint: 'Analysis zooms in on a word and explains its effect.', ex: 'Good analysis explains what a specific word suggests.', lv: 3 },
  { q: 'Which phrase is most useful for starting the "explain" part of a paragraph?', a: 'This suggests that...', w: ['Once upon a time...', 'In the text it says...', 'The end.'], hint: 'You are explaining what the evidence shows.', ex: 'Phrases like "This suggests", "implies" or "conveys" introduce analysis.', lv: 1 },
  { q: 'Which verb is the most precise for analysis: "The word \'bruise-coloured\' ___ violence to come."?', a: 'foreshadows', w: ['says', 'is', 'goes'], hint: 'Which verb explains what the writer is doing?', ex: '"Foreshadows" names exactly what the word does.', lv: 4 },
]

// =====================================================================================================
// Sentence craft (Year 9)
// =====================================================================================================

const CRAFT: MC[] = [
  { q: 'After a long, flowing description, a writer adds: "Then silence." What is the main effect of this short sentence?', a: 'It creates a sudden, dramatic pause that builds tension.', w: ['It speeds up the action.', 'It adds lots of detail.', 'It introduces a new character.'], hint: 'Contrast with the long sentence before.', ex: 'A short sentence after long ones jolts the reader and builds tension.', lv: 2 },
  { q: '"Fog everywhere." has no main verb. What type of sentence is it?', a: 'a minor sentence', w: ['a compound sentence', 'a complex sentence', 'a question'], hint: 'It is not a full grammatical sentence.', ex: 'Minor sentences lack a main verb but are used for effect.', lv: 3 },
  { q: 'Why might a writer begin a sentence with a subordinate clause, e.g. "As the door creaked open, I held my breath."?', a: 'To delay the main action and build anticipation', w: ['To make the sentence simple', 'Because main clauses cannot come first', 'To avoid using a verb'], hint: 'What do we wait for?', ex: 'Putting the subordinate clause first delays the main event and builds suspense.', lv: 3 },
  { q: 'Which rewrite moves the subordinate clause to the front?\n"We kept walking although our feet were aching."', a: 'Although our feet were aching, we kept walking.', w: [{ label: 'We kept, although our feet were aching, walking.', feedback: 'That splits the verb awkwardly.' }, { label: 'Our feet were aching, we kept walking.', feedback: 'That drops the conjunction and creates a comma splice.' }, { label: 'Although we kept walking, our feet were aching.', feedback: 'That changes the meaning.' }], hint: 'Move the "although" clause and add a comma.', ex: 'Fronted subordinate clause + comma + main clause.', lv: 3 },
  { q: 'What is the effect of a long list sentence, e.g. "The table was piled with pies, puddings, roast potatoes, glazed hams, steaming bowls of soup and towering cakes."?', a: 'It creates a sense of abundance and plenty.', w: ['It creates tension and fear.', 'It shows the table is empty.', 'It slows the story to a stop for no reason.'], hint: 'How much food is there?', ex: 'Piling up items in a list suggests abundance.', lv: 2 },
  { q: 'Which sentence uses a colon for dramatic effect?', a: 'There was only one way out: the window.', w: ['There was only one way out the window.', 'There was: only one way out the window.', 'There was only one way: out, the window.'], hint: 'The colon should come after a complete clause and before the reveal.', ex: 'The colon creates a pause before revealing the answer.', lv: 4 },
  { q: 'A writer uses a one-sentence paragraph: "And then the phone rang." Why?', a: 'To isolate a key moment and make it stand out', w: ['Because they ran out of ideas', 'To summarise the whole story', 'To introduce a list'], hint: 'What happens when something stands on its own?', ex: 'A one-line paragraph gives a moment extra weight.', lv: 3 },
  { q: 'Which sentence starts with a fronted adverbial to set the scene?', a: 'Deep beneath the city, the old tunnels lay forgotten.', w: ['The old tunnels lay forgotten deep beneath the city.', 'Forgotten were the tunnels.', 'The tunnels were old.'], hint: 'Which one starts by saying where?', ex: '"Deep beneath the city," at the start sets the scene before the main clause.', lv: 2 },
  { q: 'Why might a writer use a series of short sentences in an action scene, e.g. "He ran. The door slammed. Footsteps. Closer."?', a: 'To create a fast, breathless pace', w: ['To slow the scene down', 'To describe the setting in detail', 'To show nothing is happening'], hint: 'How do short sentences feel to read?', ex: 'Short sentences speed up the pace and build tension.', lv: 3 },
  { q: 'What effect does the semicolon create in: "Outside, the storm raged; inside, the children slept soundly."?', a: 'It balances the two contrasting halves against each other.', w: ['It introduces a list.', 'It shows speech.', 'It makes the sentence a question.'], hint: 'Two main clauses, outside vs inside.', ex: 'The semicolon holds two contrasting clauses in balance.', lv: 5 },
]

// =====================================================================================================
// Written tasks
// =====================================================================================================

const DESCRIPTIVE_TASKS: Task[] = [
  {
    prompt: 'Describe a busy railway station at rush hour. Write one paragraph (5-7 sentences) using at least three senses.',
    model: 'The station heaved with bodies. Commuters surged towards the barriers like a tide, briefcases swinging, phones glowing in their hands. Above them, the departure board flickered and a tired voice crackled through the speakers: "The 8.15 to Brighton is delayed." The air tasted of burnt coffee and diesel. A pigeon pecked at a dropped croissant, unbothered by the stampede of polished shoes. Then the doors of a train hissed open, and the crowd poured in.',
    checklist: ['Uses at least three senses', 'Includes a simile or metaphor', 'Uses precise, powerful verbs', 'Varies sentence length (including a short sentence)', 'Creates a clear atmosphere'],
  },
  {
    prompt: 'Describe an abandoned fairground at night. Write one paragraph (5-7 sentences).',
    model: 'The fairground had been silent for years. Rust crept along the rails of the rollercoaster like a slow red disease. The carousel horses stood frozen mid-gallop, their painted smiles cracked and peeling. Wind moaned through the empty ticket booth, and somewhere a loose sign tapped against a pole: tap, tap, tap. Moonlight silvered the puddles. For a moment, I was sure I heard music.',
    checklist: ['Creates a clear mood (e.g. eerie)', 'Uses personification or pathetic fallacy', 'Uses a simile or metaphor', 'Includes sound or touch, not just sight', 'Ends with an intriguing or striking sentence'],
  },
  {
    prompt: 'Describe a market on a hot summer day. Write one paragraph (5-7 sentences).',
    model: 'The heat pressed down on the market like a heavy hand. Stallholders fanned themselves with cardboard, calling out prices in voices gone hoarse. Strawberries glowed like jewels in their punnets, and the sweet, sticky scent of fudge drifted from a van. Wasps hovered greedily. Beneath a striped awning, an old dog lay flat on the cool stones, too hot even to wag its tail.',
    checklist: ['Uses at least three senses', 'Includes a simile or metaphor', 'Uses precise nouns and verbs', 'Varies sentence openings', 'Includes a small, memorable detail'],
  },
]

const NARRATIVE_TASKS: Task[] = [
  {
    prompt: 'Write the opening of a story called "The Door". Start in the middle of the action. (5-8 sentences)',
    model: 'The handle turned on its own. Kit froze, one hand still on the banister, as the door that had been locked for eleven years began to open. A breath of cold air slid out into the hallway, smelling of damp earth and something sweeter, like old roses. "Mum?" she whispered, though she knew Mum was at work. No answer. Only, from somewhere deep inside, the slow tick of a clock that should have stopped long ago.',
    checklist: ['Starts in the middle of the action', 'Hooks the reader with a mystery or question', 'Shows feelings through actions, not just telling', 'Includes a sensory detail', 'Uses a short sentence for effect'],
  },
  {
    prompt: 'Write the opening of a story that begins with dialogue. (5-8 sentences)',
    model: '"You can\'t be serious," said Aunt Rosa, staring at the enormous crate in the middle of the kitchen. "It\'s only for a week," Leo said, though the crate had just started to rock from side to side. Something inside it gave a long, low grunt. Aunt Rosa put down her tea very slowly. "Leo," she said, "what exactly did you agree to look after?"',
    checklist: ['Begins with speech that hooks the reader', 'Punctuates speech correctly, with a new line for each speaker', 'Reveals character through what people say and do', 'Creates humour, mystery or tension', 'Ends on a question or cliffhanger'],
  },
]

const PERSUASIVE_TASKS: Task[] = [
  {
    prompt: 'Write a paragraph for a speech persuading your school to ban single-use plastic. Use at least three persuasive techniques.',
    model: 'Every single day, our school throws away hundreds of plastic bottles, wrappers and cups. Where do they go? Some will still be lying in landfill when our great-grandchildren are born; others will drift into rivers and seas, where innocent sea creatures mistake them for food. We are a school that prides itself on being kind, creative and responsible, so surely we can find a better way. Refillable bottles cost little and last for years. Let\'s be the generation that says: enough.',
    checklist: ['Uses a rhetorical question', 'Uses emotive language', 'Uses the rule of three', 'Addresses the audience directly (we / you / let\'s)', 'Ends with a clear call to action'],
  },
  {
    prompt: 'Write a paragraph arguing that teenagers should have a say in how their school is run. Include a counter-argument and rebut it.',
    model: 'Pupils spend over a thousand hours a year at school, so it is only fair that we have a voice in how it is run. Some people argue that teenagers lack the experience to make sensible decisions. However, nobody knows better than pupils what helps them learn, which lunch queues are too long or which rules seem pointless. A school council that is genuinely listened to would make us more responsible, not less. Surely a school that trusts its pupils will be a happier one?',
    checklist: ['States a clear viewpoint', 'Includes a counter-argument', 'Rebuts the counter-argument', 'Uses at least one persuasive technique', 'Uses a connective such as "however"'],
  },
]

const TRANSACTIONAL_TASKS: Task[] = [
  {
    prompt: 'Write the opening of a formal letter to your local council asking them to improve a park. Include the greeting and first paragraph.',
    model: 'Dear Sir or Madam,\n\nI am writing to ask the council to improve the play area in Victoria Park. At present, two of the swings are broken, the fence beside the road has a large gap and the benches are covered in graffiti. As a pupil at a nearby school, I visit the park regularly and I am concerned that it is no longer safe for younger children. I would be grateful if you could consider the following suggestions.',
    checklist: ['Uses a correct formal greeting', 'States the purpose in the first sentence', 'Uses formal language (no slang or contractions)', 'Gives specific details or reasons', 'Uses polite, persuasive phrasing'],
  },
  {
    prompt: 'Write a headline, strapline and opening paragraph for a school newspaper article about a charity event.',
    model: 'HEADLINE: Year 8 Bake Sale Raises Record Sum\nSTRAPLINE: Cakes, cookies and a giant chocolate tower help local food bank\n\nYear 8 pupils raised more money than ever before at last Friday\'s charity bake sale. Over two hundred visitors crowded into the school hall to buy home-made treats, with every penny going to the town\'s food bank. "We didn\'t expect such a queue," said organiser Ellie Brown. "It was amazing to see everyone get behind it."',
    checklist: ['Includes a headline', 'Includes a strapline', 'Opening paragraph answers who, what, when and where', 'Includes a quotation from someone involved', 'Uses a suitable tone for the audience'],
  },
]

const ANALYTICAL_TASKS: Task[] = [
  {
    fig: fig('storm'),
    prompt: 'Write a PEE paragraph: how does the writer make the storm seem dangerous?',
    model: 'The writer presents the storm as violent and threatening. The rain "hammered the windows like fists". This simile suggests the storm is attacking the lighthouse, as though it wants to break in. The verb "hammered" is forceful and repetitive, which helps the reader hear the noise and feel Nell\'s fear.',
    checklist: ['Opens with a clear point', 'Embeds a short quotation', 'Names a technique', 'Explains the effect of a specific word', 'Links back to the question'],
  },
  {
    fig: fig('scrooge'),
    prompt: 'Write a PEE paragraph: how does Dickens present Scrooge as greedy?',
    model: 'Dickens presents Scrooge as extremely greedy. He calls him "a squeezing, wrenching, grasping, scraping, clutching, covetous, old sinner!" The long list of verbs suggests he is constantly grabbing and holding on to money, and its length makes his greed seem never-ending. The word "sinner" shows that Dickens sees his greed as morally wrong.',
    checklist: ['Opens with a clear point', 'Uses a quotation as evidence', 'Names a technique (list, verbs)', 'Explains the effect of a specific word', 'Develops the analysis with a second word or idea'],
  },
]

export const writingGenerators: ItemGenerator[] = [
  classifyGen('paragraphs.why', 'writing.paragraphing', [1, 4], {
    rows: NEW_PARA,
    cats: { time: 'Time: a new paragraph when time moves on.', place: 'Place: a new paragraph when the setting changes.', topic: 'Topic: a new paragraph for a new idea or point.', person: 'Person: a new paragraph for a new speaker or a new character in focus.' },
    prompt: (e) => `A new paragraph starts at //. Why? (Remember TiPToP.)\n${e.text}`,
    hint: 'TiPToP: has the Time, Place, Topic or Person changed?',
    keepOrder: true,
  }),
  bankGen('paragraphs.topic-sentence', 'writing.paragraphing', [1, 4], TOPIC_SENTENCE),
  classifyGen('cohesion.function', 'writing.cohesion', [1, 5], {
    rows: CONNECTIVES,
    cats: {
      adding: 'Adding connectives add another point (furthermore, moreover, in addition).',
      contrasting: 'Contrasting connectives introduce a different view (however, on the other hand).',
      'showing cause and effect': 'Cause-and-effect connectives show a result (therefore, consequently, as a result).',
      sequencing: 'Sequencing connectives order events or ideas (firstly, next, meanwhile).',
      'giving an example': 'Example connectives introduce an illustration (for example, for instance).',
      'summing up': 'Summing-up connectives introduce a conclusion (in conclusion, overall).',
      comparing: 'Comparing connectives show a similarity (similarly, likewise).',
      emphasising: 'Emphasising connectives highlight a key point (above all, in particular).',
    },
    prompt: (e) => `What job does the connective ${JSON.stringify(e.text)} do?`,
    hint: 'Try it at the start of a sentence: does it add, contrast, give a result, order, illustrate, compare, emphasise or sum up?',
  }),
  bankGen('cohesion.fit', 'writing.cohesion', [1, 5], CONNECTIVE_FIT),
  sequenceGen('narrative.structure', 'writing.narrative', [1, 4], STORY_STAGES, { prompt: (s) => `Put the stages of ${s.name} in order.`, direction: ['beginning', 'end'], hint: 'Opening → problem → most exciting moment → consequences → ending.' }),
  classifyGen('narrative.openings', 'writing.narrative', [1, 4], {
    rows: OPENINGS,
    cats: {
      dialogue: 'A dialogue opening begins with a character speaking.',
      'action (in medias res)': 'An action opening throws the reader into the middle of events.',
      setting: 'A setting opening begins by describing a place.',
      character: 'A character opening begins by describing a person.',
      'a question to the reader': 'A question opening asks the reader something directly.',
    },
    prompt: (e) => `What type of story opening is this?\n${e.text}`,
    hint: 'Speech? Action? Place? Person? A question?',
  }),
  bankGen('narrative.show-tell', 'writing.narrative', [1, 4], SHOW_TELL),
  revealGen('narrative.written', 'writing.narrative', [3, 5], NARRATIVE_TASKS),
  bankGen('descriptive.craft', 'writing.descriptive', [1, 5], VERB_CHOICE),
  bankGen('descriptive.show-tell', 'writing.descriptive', [2, 4], SHOW_TELL),
  revealGen('descriptive.written', 'writing.descriptive', [3, 5], DESCRIPTIVE_TASKS),
  classifyGen('persuasive.aforest', 'writing.persuasive', [1, 4], {
    rows: AFOREST,
    cats: {
      alliteration: 'Alliteration repeats a starting sound to make phrases catchy.',
      fact: 'A fact can be checked and proved.',
      opinion: 'An opinion is a judgement presented to persuade.',
      'rhetorical question': 'A rhetorical question is asked for effect.',
      'emotive language': 'Emotive language stirs strong feelings.',
      statistic: 'A statistic is a number or percentage used as evidence.',
      'rule of three': 'The rule of three groups ideas in threes.',
    },
    prompt: (e) => `Which persuasive technique (AFOREST) is used here?\n${e.text}`,
    hint: 'A F O R E S T: Alliteration, Facts, Opinions, Rhetorical questions, Emotive language, Statistics, Three.',
  }),
  bankGen('persuasive.argument', 'writing.persuasive', [1, 5], ARGUMENT),
  revealGen('persuasive.written', 'writing.persuasive', [3, 5], PERSUASIVE_TASKS),
  termMatchGen('forms.match', 'writing.transactional', [1, 4], FORM_FEATURES, 'Match each form of writing to its typical features.'),
  bankGen('forms.conventions', 'writing.transactional', [1, 5], FORMS_MC),
  revealGen('forms.written', 'writing.transactional', [3, 5], TRANSACTIONAL_TASKS),
  sequenceGen('analytical.pee-order', 'writing.analytical', [2, 4], PEE, { prompt: (s) => `Put the sentences of ${s.name} in order (Point, Evidence, Explain, Link).`, direction: ['first', 'last'], hint: 'Point → Evidence (the quotation) → Explain (what it suggests) → Link back.', all: true }),
  classifyGen('analytical.pee-part', 'writing.analytical', [1, 4], {
    rows: PEE_PART,
    cats: { Point: 'The Point makes a claim that answers the question.', Evidence: 'The Evidence is the quotation or reference that supports the point.', Explain: 'The Explanation analyses what the evidence suggests and how.' },
    prompt: (e) => `Which part of a PEE paragraph is this sentence?\n${e.text}`,
    hint: 'Claim? Quotation? Or explaining what the quotation suggests?',
    keepOrder: true,
  }),
  bankGen('analytical.embed', 'writing.analytical', [1, 5], EMBED),
  revealGen('analytical.written', 'writing.analytical', [3, 5], ANALYTICAL_TASKS),
  bankGen('craft.effects', 'writing.sentence-craft', [2, 5], CRAFT),
  revealGen('craft.written', 'writing.sentence-craft', [4, 5], [
    {
      prompt: 'Write a tense paragraph (5-7 sentences) about someone hiding. Use a variety of sentence lengths and types, including a minor sentence and a sentence starting with a subordinate clause.',
      model: 'As the footsteps grew louder, Ana pressed herself against the back of the wardrobe. Coats brushed her face. She held her breath until her chest burned, listening to the floorboards creak one by one across the landing, each step slower and heavier than the last. Silence. Then the wardrobe handle began, very slowly, to turn.',
      checklist: ['Includes a sentence starting with a subordinate clause', 'Includes a minor sentence', 'Includes a short simple sentence for impact', 'Includes a longer sentence that builds tension', 'Ends on a moment of suspense'],
    },
  ]),
]
