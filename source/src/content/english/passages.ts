import type { Figure } from '@/engine/types'
import { passage } from '../kit'
import type { Lv, Wrong } from './helpers'

/**
 * Reading passages. Public-domain extracts (authors who died long before 1955) are quoted from the original
 * texts; the others are original writing for HomeQuest. Each passage carries several questions, tagged with the
 * reading skill they practise, so one text serves retrieval, inference, language and structure questions.
 */

export type ReadSkill = 'retrieval' | 'inference' | 'quotations' | 'language' | 'structure' | 'voice'

export interface PQ {
  sk: ReadSkill
  lv: Lv
  q: string
  a: string
  w: Wrong[]
  hint: string
  ex: string
}

export interface Passage {
  id: string
  fig: Figure
  qs: PQ[]
}

const ORIGINAL = 'Original extract written for HomeQuest'

export const PASSAGES: Passage[] = [
  // ------------------------------------------------------------------------------------------------
  {
    id: 'scrooge',
    fig: passage(
      `Oh! But he was a tight-fisted hand at the grindstone, Scrooge! a squeezing, wrenching, grasping, scraping, clutching, covetous, old sinner! Hard and sharp as flint, from which no steel had ever struck out generous fire; secret, and self-contained, and solitary as an oyster. The cold within him froze his old features, nipped his pointed nose, shrivelled his cheek, stiffened his gait; made his eyes red, his thin lips blue; and spoke out shrewdly in his grating voice. A frosty rime was on his head, and on his eyebrows, and his wiry chin. He carried his own low temperature always about with him; he iced his office in the dog-days; and didn't thaw it one degree at Christmas.

External heat and cold had little influence on Scrooge. No warmth could warm, no wintry weather chill him. No wind that blew was bitterer than he, no falling snow was more intent upon its purpose, no pelting rain less open to entreaty.`,
      { title: 'A Christmas Carol: introducing Scrooge', source: 'Charles Dickens, A Christmas Carol (1843), Stave One' },
    ),
    qs: [
      { sk: 'retrieval', lv: 1, q: 'Which part of Scrooge is described as "pointed"?', a: 'his nose', w: ['his chin', 'his eyebrows', 'his lips'], hint: 'Find the word "pointed" in the text.', ex: '"nipped his pointed nose".' },
      { sk: 'retrieval', lv: 2, q: 'What colour are Scrooge\'s lips?', a: 'blue', w: [{ label: 'red', feedback: 'It is his EYES that are red.' }, 'white', 'grey'], hint: 'Look at the sentence beginning "The cold within him..."', ex: '"made his eyes red, his thin lips blue".' },
      { sk: 'retrieval', lv: 3, q: 'What does Scrooge do to his office at Christmas?', a: 'He does not warm it up at all.', w: ['He decorates it.', 'He closes it for the holiday.', 'He lights a big fire.'], hint: 'Look at the end of the first paragraph.', ex: '"didn\'t thaw it one degree at Christmas" - he keeps it cold even then.' },
      { sk: 'inference', lv: 3, q: 'What does "solitary as an oyster" suggest about Scrooge?', a: 'He keeps himself shut away from other people.', w: [{ label: 'He is precious, like a pearl.', feedback: 'The simile is about the oyster\'s closed shell, not a pearl.' }, 'He loves the seaside.', 'He is slippery and untrustworthy.'], hint: 'Think about what an oyster\'s shell does.', ex: 'An oyster is sealed in a hard shell: Scrooge closes himself off from others.' },
      { sk: 'inference', lv: 4, q: 'Dickens links Scrooge with cold all the way through. What does this suggest about him?', a: 'He is unfeeling and shows no warmth or kindness to others.', w: ['He lives in a very cold country.', 'He is often ill.', 'He simply dislikes winter.'], hint: 'Cold here is not just about temperature.', ex: 'The cold is a metaphor for his heart: he lacks human warmth.' },
      { sk: 'language', lv: 2, q: 'What technique is "Hard and sharp as flint"?', a: 'simile', w: [{ label: 'personification', feedback: 'Personification gives human qualities to something non-human.' }, { label: 'onomatopoeia', feedback: 'Onomatopoeia is a word that sounds like what it means.' }, { label: 'rhetorical question', feedback: 'A rhetorical question is asked for effect.' }], hint: 'Look for "as".', ex: 'It compares Scrooge to flint using "as": a simile.' },
      { sk: 'language', lv: 3, q: 'The list "squeezing, wrenching, grasping, scraping, clutching" is made of words about...', a: 'grabbing and holding tightly, showing his greed', w: ['moving quickly, showing his energy', 'making noise, showing his anger', 'giving things away, showing his generosity'], hint: 'Mime each word with your hands.', ex: 'Each word is about seizing and holding on; together they emphasise his greed for money.' },
      { sk: 'language', lv: 4, q: 'In the second paragraph, what is the effect of repeating "no" ("No warmth... no wintry weather... No wind...")?', a: 'It stresses that nothing at all can affect or soften Scrooge.', w: ['It shows that Scrooge says "no" to everyone.', 'It makes the weather sound pleasant.', 'It shows Scrooge is changing.'], hint: 'What can and cannot touch Scrooge?', ex: 'The repetition builds up a list of things that cannot affect him, stressing how hard he is.' },
      { sk: 'quotations', lv: 3, q: 'Which quotation best shows that Scrooge is not affected by the weather?', a: '"External heat and cold had little influence on Scrooge."', w: ['"A frosty rime was on his head"', '"made his eyes red"', '"solitary as an oyster"'], hint: 'Which one is directly about the weather having no effect?', ex: 'This sentence says directly that heat and cold barely affect him.' },
      { sk: 'quotations', lv: 4, q: 'Which quotation best shows that Scrooge\'s coldness affects the places around him?', a: '"he iced his office in the dog-days"', w: ['"nipped his pointed nose"', '"Hard and sharp as flint"', '"his grating voice"'], hint: 'Which one is about somewhere other than his body?', ex: 'He "iced his office" even in the hottest days of summer (the dog-days): his coldness spreads to his surroundings.' },
      { sk: 'voice', lv: 3, q: 'What kind of narrator does this extract have?', a: 'a third-person narrator describing Scrooge from outside', w: [{ label: 'a first-person narrator: Scrooge himself', feedback: 'Scrooge is "he", not "I".' }, 'a second-person narrator speaking to "you"', 'Scrooge\'s nephew, speaking as "I"'], hint: 'Is Scrooge "I" or "he"?', ex: 'Scrooge is "he": a third-person narrator describes him (and comments on him, with "Oh!").' },
    ],
  },
  // ------------------------------------------------------------------------------------------------
  {
    id: 'convict',
    fig: passage(
      `A fearful man, all in coarse grey, with a great iron on his leg. A man with no hat, and with broken shoes, and with an old rag tied round his head. A man who had been soaked in water, and smothered in mud, and lamed by stones, and cut by flints, and stung by nettles, and torn by briars; who limped, and shivered, and glared, and growled; and whose teeth chattered in his head as he seized me by the chin.`,
      { title: 'Great Expectations: young Pip is alone in a churchyard on the marshes when a man leaps out', source: 'Charles Dickens, Great Expectations (1861), Chapter 1' },
    ),
    qs: [
      { sk: 'retrieval', lv: 1, q: 'What is on the man\'s leg?', a: 'a great iron', w: [{ label: 'an old rag', feedback: 'The rag is tied round his HEAD.' }, 'a bandage', 'a broken shoe'], hint: 'Read the first sentence.', ex: '"with a great iron on his leg".' },
      { sk: 'retrieval', lv: 2, q: 'What is tied round the man\'s head?', a: 'an old rag', w: ['a hat', 'a chain', 'a scarf'], hint: 'He has "no hat"...', ex: '"with an old rag tied round his head".' },
      { sk: 'inference', lv: 3, q: 'The "great iron on his leg" suggests that the man is...', a: 'an escaped prisoner', w: ['a blacksmith', 'a soldier', 'a farmer'], hint: 'Who would wear an iron fastened to their leg?', ex: 'A leg iron was used to chain prisoners, so he is probably an escaped convict.' },
      { sk: 'inference', lv: 2, q: 'How is young Pip most likely to feel?', a: 'terrified', w: ['amused', 'bored', 'proud'], hint: 'A strange man has just grabbed him by the chin in a churchyard.', ex: 'A "fearful" man seizes him: he would be terrified.' },
      { sk: 'language', lv: 4, q: 'Dickens repeats "and" again and again: "soaked in water, and smothered in mud, and lamed by stones...". What is the effect?', a: 'It piles up his sufferings, making them seem endless.', w: ['It makes the man sound calm and relaxed.', 'It speeds the description up so it is over quickly.', 'It shows that Pip cannot count.'], hint: 'What does the list keep doing?', ex: 'The repeated "and" (polysyndeton) heaps up each injury, so his suffering seems overwhelming.' },
      { sk: 'language', lv: 3, q: 'The verbs "limped, and shivered, and glared, and growled" suggest the man is...', a: 'both suffering and threatening, almost like a wild animal', w: ['calm and in control', 'happy to see Pip', 'a gentleman who has lost his way'], hint: 'Two verbs show pain, two show menace.', ex: '"Limped" and "shivered" show suffering; "glared" and "growled" make him animal-like and dangerous.' },
      { sk: 'quotations', lv: 3, q: 'Which quotation best suggests the man has been travelling over rough ground?', a: '"cut by flints, and stung by nettles, and torn by briars"', w: ['"all in coarse grey"', '"with no hat"', '"seized me by the chin"'], hint: 'Which one is about the land he crossed?', ex: 'Flints, nettles and briars are found on rough countryside.' },
      { sk: 'structure', lv: 4, q: 'Each sentence begins "A man..." or "A fearful man...". What is the effect of this?', a: 'It keeps the focus on the man, building up his picture detail by detail.', w: ['It shows time passing.', 'It moves the focus to the setting.', 'It introduces several different men.'], hint: 'What stays in the spotlight?', ex: 'The repeated opening keeps the man centre stage while the details pile up.' },
      { sk: 'voice', lv: 2, q: 'Who is narrating this extract?', a: 'Pip, in the first person', w: [{ label: 'the convict, in the first person', feedback: 'The convict is described as "a man"; the narrator is "me".' }, 'a third-person narrator', 'Pip\'s sister'], hint: 'Look at "seized me by the chin".', ex: '"Me" shows the narrator is Pip, telling his own story in the first person.' },
    ],
  },
  // ------------------------------------------------------------------------------------------------
  {
    id: 'fog',
    fig: passage(
      `Fog everywhere. Fog up the river, where it flows among green aits and meadows; fog down the river, where it rolls defiled among the tiers of shipping and the waterside pollutions of a great (and dirty) city. Fog on the Essex marshes, fog on the Kentish heights. Fog creeping into the cabooses of collier-brigs; fog lying out on the yards and hovering in the rigging of great ships; fog drooping on the gunwales of barges and small boats.`,
      { title: 'Bleak House: London in November', source: 'Charles Dickens, Bleak House (1853), Chapter 1' },
    ),
    qs: [
      { sk: 'retrieval', lv: 3, q: 'Which two counties does Dickens name?', a: 'Essex and Kent', w: ['Essex and Sussex', 'Kent and Surrey', 'Middlesex and Essex'], hint: '"Kentish" is the adjective from Kent.', ex: '"Fog on the Essex marshes, fog on the Kentish heights."' },
      { sk: 'language', lv: 2, q: 'What is the main effect of repeating the word "fog"?', a: 'The fog seems to be everywhere, smothering everything.', w: ['It shows the fog is clearing.', 'It makes London seem cheerful.', 'It shows the narrator is confused.'], hint: 'Count how many times "fog" appears.', ex: 'The relentless repetition mirrors the fog itself, which covers everything.' },
      { sk: 'language', lv: 3, q: '"Fog creeping into the cabooses" - what technique makes the fog seem alive?', a: 'personification', w: [{ label: 'simile', feedback: 'There is no "like" or "as" comparison.' }, { label: 'onomatopoeia', feedback: '"Creeping" does not imitate a sound.' }, { label: 'rhetorical question', feedback: 'There is no question.' }], hint: 'Who usually creeps?', ex: 'Creeping is something a living creature does: the fog is personified.' },
      { sk: 'inference', lv: 4, q: 'What does the aside "(and dirty)" suggest about Dickens\'s view of London?', a: 'He is criticising how filthy the city is.', w: ['He thinks London is spotless.', 'He is describing the fog\'s colour.', 'He is unsure whether London is a city.'], hint: 'Why add it in brackets, almost like a whispered comment?', ex: 'The bracketed aside is a sharp, critical comment on the dirt of the "great" city.' },
      { sk: 'structure', lv: 3, q: 'How does Dickens move the reader\'s focus through this extract?', a: 'Around many different places, showing the fog spreading over a huge area', w: ['Following one character through London', 'Back in time to the narrator\'s childhood', 'From night-time to the next morning'], hint: 'List the places mentioned.', ex: 'The focus jumps from river to marshes to heights to ships: the fog is everywhere.' },
      { sk: 'structure', lv: 4, q: 'The extract opens with "Fog everywhere." - a sentence with no main verb. Why is this an effective opening?', a: 'It is short and blunt, instantly establishing the setting and atmosphere.', w: ['It introduces the main character.', 'It shows the story is a flashback.', 'It reveals the ending of the novel.'], hint: 'What do we learn in just two words?', ex: 'The minor sentence plunges us straight into the foggy setting.' },
      { sk: 'quotations', lv: 4, q: 'Which quotation best shows the fog settling heavily on things?', a: '"fog drooping on the gunwales of barges"', w: ['"Fog up the river"', '"where it flows among green aits and meadows"', '"Fog on the Essex marshes"'], hint: 'Which verb suggests heaviness?', ex: '"Drooping" suggests something heavy sagging down.' },
    ],
  },
  // ------------------------------------------------------------------------------------------------
  {
    id: 'jane',
    fig: passage(
      `There was no possibility of taking a walk that day. We had been wandering, indeed, in the leafless shrubbery an hour in the morning; but since dinner (Mrs. Reed, when there was no company, dined early) the cold winter wind had brought with it clouds so sombre, and a rain so penetrating, that further out-door exercise was now out of the question.

I was glad of it: I never liked long walks, especially on chilly afternoons: dreadful to me was the coming home in the raw twilight, with nipped fingers and toes, and a heart saddened by the chidings of Bessie, the nurse, and humbled by the consciousness of my physical inferiority to Eliza, John, and Georgiana Reed.`,
      { title: 'Jane Eyre: the opening', source: 'Charlotte Brontë, Jane Eyre (1847), Chapter 1' },
    ),
    qs: [
      { sk: 'retrieval', lv: 1, q: 'Why could nobody go for a walk?', a: 'Cold wind had brought gloomy clouds and heavy rain.', w: ['It was too hot.', 'Mrs Reed had visitors.', 'The shrubbery was locked.'], hint: 'Read the end of the first paragraph.', ex: '"the cold winter wind had brought with it clouds so sombre, and a rain so penetrating".' },
      { sk: 'retrieval', lv: 2, q: 'Who is Bessie?', a: 'the nurse', w: ['a Reed daughter', 'the narrator\'s sister', 'the cook'], hint: 'Look for her name.', ex: '"Bessie, the nurse".' },
      { sk: 'retrieval', lv: 3, q: 'When did Mrs Reed have dinner early?', a: 'when there was no company', w: ['on Sundays', 'in winter', 'when it rained'], hint: 'Look inside the brackets.', ex: '"(Mrs. Reed, when there was no company, dined early)".' },
      { sk: 'inference', lv: 3, q: 'Why is the narrator glad there will be no walk?', a: 'Walks end with her cold, scolded and feeling inferior to the Reed children.', w: ['She wants to finish a book.', 'She is ill.', 'She is going out with Bessie instead.'], hint: 'Read the second paragraph.', ex: 'She dreads coming home cold, being told off by Bessie, and feeling inferior to the Reeds.' },
      { sk: 'inference', lv: 4, q: 'What does "humbled by the consciousness of my physical inferiority" suggest about how the narrator is treated?', a: 'She is made to feel lesser than the Reed children.', w: ['She is the strongest of the children.', 'She is proud of her fitness.', 'She is the Reeds\' favourite.'], hint: '"Inferiority" means being lower or worse.', ex: 'She feels smaller and weaker than her cousins and is made to feel it.' },
      { sk: 'language', lv: 3, q: 'What mood do "leafless shrubbery", "sombre" clouds and "raw twilight" create?', a: 'bleak and gloomy', w: ['bright and hopeful', 'calm and peaceful', 'busy and exciting'], hint: 'What do these words have in common?', ex: 'The bare, dark, cold details create a bleak, gloomy mood that matches the narrator\'s unhappiness.' },
      { sk: 'language', lv: 4, q: 'In the opening, the cold, gloomy weather matches the narrator\'s unhappy feelings. What is this technique called?', a: 'pathetic fallacy', w: [{ label: 'onomatopoeia', feedback: 'Onomatopoeia is a word that imitates a sound.' }, { label: 'hyperbole', feedback: 'Hyperbole is deliberate exaggeration.' }, { label: 'oxymoron', feedback: 'An oxymoron puts two opposite words together.' }], hint: 'Weather + mood.', ex: 'Pathetic fallacy: weather that reflects a character\'s feelings.' },
      { sk: 'voice', lv: 2, q: 'What narrative voice does this extract use?', a: 'first person', w: ['second person', 'third person', 'a play script'], hint: 'Look for "I" and "me".', ex: '"I was glad of it": a first-person narrator.' },
    ],
  },
  // ------------------------------------------------------------------------------------------------
  {
    id: 'pride',
    fig: passage(
      `It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.

However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.`,
      { title: 'Pride and Prejudice: the opening', source: 'Jane Austen, Pride and Prejudice (1813), Chapter 1' },
    ),
    qs: [
      { sk: 'retrieval', lv: 2, q: 'According to the first sentence, what is the single man "in possession of"?', a: 'a good fortune', w: ['a large house', 'a wife', 'a neighbourhood'], hint: 'Read the first sentence closely.', ex: '"a single man in possession of a good fortune".' },
      { sk: 'inference', lv: 5, q: 'The opening sentence is ironic. What is Austen really suggesting?', a: 'Families with daughters want a rich single man to marry one of them.', w: [{ label: 'Rich single men always want to marry.', feedback: 'That is the literal meaning; the irony suggests something else.' }, 'Single women do not want to marry.', 'Money does not matter in marriage.'], hint: 'Who really "wants" here: the man, or the families?', ex: 'The second paragraph reveals it: local families see him as the "rightful property" of their daughters.' },
      { sk: 'inference', lv: 4, q: 'What does "the rightful property of some one or other of their daughters" suggest about the families?', a: 'They treat the rich man as a prize to be claimed.', w: ['They are worried he will steal their land.', 'They want him to buy their house.', 'They do not care about him at all.'], hint: '"Property" is something you own.', ex: 'They think of him as something their daughters are owed: a prize.' },
      { sk: 'language', lv: 4, q: 'Why might Austen begin with "It is a truth universally acknowledged"?', a: 'It sounds grand and certain, which makes the gossip that follows seem comic.', w: ['To state a scientific fact.', 'To show she agrees with every family.', 'To describe the setting.'], hint: 'Is it really a universal truth?', ex: 'The grand, serious phrasing is used for something trivial, which creates gentle humour (irony).' },
    ],
  },
  // ------------------------------------------------------------------------------------------------
  {
    id: 'frankenstein',
    fig: passage(
      `It was on a dreary night of November that I beheld the accomplishment of my toils. With an anxiety that almost amounted to agony, I collected the instruments of life around me, that I might infuse a spark of being into the lifeless thing that lay at my feet. It was already one in the morning; the rain pattered dismally against the panes, and my candle was nearly burnt out, when, by the glimmer of the half-extinguished light, I saw the dull yellow eye of the creature open; it breathed hard, and a convulsive motion agitated its limbs.`,
      { title: 'Frankenstein: Victor brings his creature to life', source: 'Mary Shelley, Frankenstein (1818), Chapter 5' },
    ),
    qs: [
      { sk: 'retrieval', lv: 1, q: 'In which month does this happen?', a: 'November', w: ['December', 'October', 'January'], hint: 'Look at the first sentence.', ex: '"a dreary night of November".' },
      { sk: 'retrieval', lv: 2, q: 'What time is it when the creature opens its eye?', a: 'one in the morning', w: ['midnight', 'dawn', 'nine in the evening'], hint: 'Look at the third sentence.', ex: '"It was already one in the morning".' },
      { sk: 'retrieval', lv: 2, q: 'What colour is the creature\'s eye?', a: 'dull yellow', w: ['bright red', 'pale blue', 'jet black'], hint: 'Find "eye".', ex: '"the dull yellow eye of the creature".' },
      { sk: 'inference', lv: 3, q: '"With an anxiety that almost amounted to agony" suggests Victor feels...', a: 'extremely tense and nervous', w: ['calm and confident', 'bored and tired', 'angry with the creature'], hint: 'Agony is extreme pain.', ex: 'His nerves are so strong they are almost painful.' },
      { sk: 'language', lv: 3, q: '"the rain pattered dismally against the panes" creates a gloomy mood that reflects the scene. What technique is this?', a: 'pathetic fallacy', w: [{ label: 'rhetorical question', feedback: 'There is no question here.' }, { label: 'simile', feedback: 'There is no "like" or "as".' }, { label: 'oxymoron', feedback: 'An oxymoron pairs opposite words.' }], hint: 'Weather that matches the mood.', ex: 'Dreary, dismal rain mirrors the dark, ominous moment: pathetic fallacy.' },
      { sk: 'structure', lv: 4, q: 'Why might Shelley mention that "my candle was nearly burnt out"?', a: 'The fading light adds tension and darkness just before the creature wakes.', w: ['To show Victor is short of money.', 'To explain why the room was warm.', 'To show it is nearly morning.'], hint: 'What is about to happen?', ex: 'The dying light builds suspense and a sense of darkness at the key moment.' },
      { sk: 'quotations', lv: 3, q: 'Which quotation best shows the creature coming to life?', a: '"it breathed hard, and a convulsive motion agitated its limbs"', w: ['"It was on a dreary night of November"', '"my candle was nearly burnt out"', '"I collected the instruments of life around me"'], hint: 'Which one describes the creature moving?', ex: 'Breathing and moving limbs show it is alive.' },
      { sk: 'voice', lv: 2, q: 'Who narrates this extract?', a: 'Victor Frankenstein, in the first person', w: [{ label: 'the creature, in the first person', feedback: 'The creature is "it"; the narrator is "I".' }, 'a third-person narrator', 'Mary Shelley, describing herself'], hint: 'Who is "I"?', ex: 'Victor, the scientist, tells this part of the story as "I".' },
    ],
  },
  // ------------------------------------------------------------------------------------------------
  {
    id: 'captain',
    fig: passage(
      `I remember him as if it were yesterday, as he came plodding to the inn door, his sea-chest following behind him in a hand-barrow—a tall, strong, heavy, nut-brown man, his tarry pigtail falling over the shoulder of his soiled blue coat, his hands ragged and scarred, with black, broken nails, and the sabre cut across one cheek, a dirty, livid white.`,
      { title: 'Treasure Island: the old sea captain arrives at the inn', source: 'Robert Louis Stevenson, Treasure Island (1883), Chapter 1' },
    ),
    qs: [
      { sk: 'retrieval', lv: 2, q: 'How is the man\'s sea-chest brought to the inn?', a: 'in a hand-barrow', w: ['on his back', 'by horse and cart', 'by boat'], hint: 'Find "sea-chest".', ex: '"his sea-chest following behind him in a hand-barrow".' },
      { sk: 'retrieval', lv: 1, q: 'What colour is the man\'s coat?', a: 'blue', w: ['brown', 'black', 'red'], hint: 'Find "coat".', ex: '"his soiled blue coat".' },
      { sk: 'retrieval', lv: 2, q: 'Where is the sabre cut?', a: 'across one cheek', w: ['on his hand', 'on his neck', 'above his eye'], hint: 'Read the end of the sentence.', ex: '"the sabre cut across one cheek".' },
      { sk: 'inference', lv: 3, q: 'What do the "sabre cut" and the "ragged and scarred" hands suggest?', a: 'He has lived a rough, violent life.', w: ['He is a wealthy gentleman.', 'He has never left the town.', 'He works in an office.'], hint: 'A sabre is a sword.', ex: 'Sword scars and rough hands suggest fighting and hard labour at sea.' },
      { sk: 'language', lv: 3, q: 'What does the verb "plodding" suggest about how he walks?', a: 'slowly and heavily', w: ['quickly and lightly', 'nervously, on tiptoe', 'cheerfully, skipping'], hint: 'Say the word slowly.', ex: '"Plodding" means walking with slow, heavy steps.' },
      { sk: 'voice', lv: 3, q: 'The narrator says "I remember him as if it were yesterday". What does this tell us about the narration?', a: 'It is first person, looking back on events from later in life.', w: ['It is third person, happening now.', 'It is second person, speaking to "you".', 'It is told by the captain.'], hint: '"I remember..."', ex: 'A first-person narrator is recalling the past.' },
      { sk: 'quotations', lv: 4, q: 'Which quotation best suggests the man is a sailor?', a: '"his tarry pigtail"', w: ['"a tall, strong, heavy, nut-brown man"', '"came plodding to the inn door"', '"I remember him as if it were yesterday"'], hint: 'Tar was used on ships.', ex: 'Sailors used tar on ships and ropes, and often on their pigtails.' },
    ],
  },
  // ------------------------------------------------------------------------------------------------
  {
    id: 'martians',
    fig: passage(
      `No one would have believed in the last years of the nineteenth century that this world was being watched keenly and closely by intelligences greater than man's and yet as mortal as his own; that as men busied themselves about their various concerns they were scrutinised and studied, perhaps almost as narrowly as a man with a microscope might scrutinise the transient creatures that swarm and multiply in a drop of water.`,
      { title: 'The War of the Worlds: the opening', source: 'H. G. Wells, The War of the Worlds (1898), Chapter 1' },
    ),
    qs: [
      { sk: 'retrieval', lv: 2, q: 'When is this story set?', a: 'the last years of the nineteenth century', w: ['the far future', 'the Middle Ages', 'the twentieth century'], hint: 'Read the first line.', ex: '"in the last years of the nineteenth century".' },
      { sk: 'language', lv: 4, q: 'Humans are compared to tiny creatures in a drop of water under a microscope. What does this suggest?', a: 'Humans are small and unimportant to the beings watching them.', w: ['Humans are powerful and in control.', 'The watchers are friendly scientists.', 'Water is dangerous.'], hint: 'How do we usually think about creatures in a drop of water?', ex: 'The simile shrinks humanity: we are as insignificant to them as microbes are to us.' },
      { sk: 'structure', lv: 3, q: 'How does the opening "No one would have believed..." hook the reader?', a: 'It hints that something unbelievable and threatening is about to be revealed.', w: ['It tells us the ending straight away.', 'It introduces a funny character.', 'It describes the weather.'], hint: 'What does it make you want to know?', ex: 'It creates mystery and foreshadows a threat.' },
      { sk: 'inference', lv: 3, q: 'Who is watching the world?', a: 'beings more intelligent than humans', w: ['scientists with microscopes', 'the government', 'other people in the town'], hint: '"intelligences greater than man\'s".', ex: 'Mysterious beings smarter than humans are watching (the title hints at Martians).' },
    ],
  },
  // ------------------------------------------------------------------------------------------------
  {
    id: 'hound',
    fig: passage(
      `A hound it was, an enormous coal-black hound, but not such a hound as mortal eyes have ever seen. Fire burst from its open mouth, its eyes glowed with a smouldering glare, its muzzle and hackles and dewlap were outlined in flickering flame.`,
      { title: 'The Hound of the Baskervilles: the hound appears', source: 'Arthur Conan Doyle, The Hound of the Baskervilles (1902), Chapter 14' },
    ),
    qs: [
      { sk: 'language', lv: 2, q: 'The words "fire", "smouldering" and "flickering flame" create a semantic field of...', a: 'fire', w: ['water', 'night', 'hunting'], hint: 'What do the three words have in common?', ex: 'They are all linked to fire, making the hound seem hellish and supernatural.' },
      { sk: 'inference', lv: 3, q: '"not such a hound as mortal eyes have ever seen" suggests the hound is...', a: 'unnatural or supernatural', w: ['small and friendly', 'a normal farm dog', 'very old and slow'], hint: 'Mortal = human.', ex: 'No human has seen such a creature: it seems unnatural.' },
      { sk: 'retrieval', lv: 1, q: 'What colour is the hound?', a: 'coal-black', w: ['grey', 'white', 'brown'], hint: 'Read the first sentence.', ex: '"an enormous coal-black hound".' },
    ],
  },
  // ------------------------------------------------------------------------------------------------
  {
    id: 'storm',
    fig: passage(
      `The morning had been so still that Nell could hear the bees in the heather. The sea lay flat and silver beneath the lighthouse, and her father whistled as he polished the great lamp.

By noon, the sky had changed. A bruise-coloured cloud crept over the horizon, swallowing the sun. The gulls fell silent. Nell watched the first white crests appear on the waves, then more, then hundreds, until the whole bay seemed to boil.

At six o'clock the storm struck. Rain hammered the windows like fists. Somewhere below, the old door groaned on its hinges. Her father pulled on his oilskin coat and climbed the spiral stairs without a word, and Nell, her heart thudding, followed the swaying circle of his torch.

Then she saw it: far out in the darkness, a tiny light was blinking. A boat.`,
      { title: 'The Lighthouse', source: ORIGINAL },
    ),
    qs: [
      { sk: 'retrieval', lv: 1, q: 'What was Nell\'s father doing in the morning?', a: 'polishing the great lamp', w: ['climbing the spiral stairs', 'mending the door', 'watching the gulls'], hint: 'Read the first paragraph.', ex: '"her father whistled as he polished the great lamp".' },
      { sk: 'retrieval', lv: 2, q: 'At what time did the storm strike?', a: 'six o\'clock', w: ['noon', 'midnight', 'early morning'], hint: 'Look at the start of paragraph 3.', ex: '"At six o\'clock the storm struck."' },
      { sk: 'inference', lv: 2, q: 'How does Nell feel during the storm?', a: 'frightened', w: ['bored', 'angry', 'sleepy'], hint: 'Look at what her heart is doing.', ex: '"her heart thudding" shows fear.' },
      { sk: 'inference', lv: 3, q: 'Her father "climbed the spiral stairs without a word". What does this suggest?', a: 'He is serious and focused on what he must do.', w: ['He is angry with Nell.', 'He is going to bed.', 'He is not worried at all.'], hint: 'Compare this with how he behaved in the morning.', ex: 'He whistled in the morning; now he is silent and purposeful, which shows how serious things are.' },
      { sk: 'language', lv: 2, q: 'What does the simile "Rain hammered the windows like fists" suggest about the storm?', a: 'It is violent, as if it is attacking the lighthouse.', w: ['It is gentle and soothing.', 'It will soon be over.', 'It sounds like music.'], hint: 'Picture fists hammering on a window.', ex: 'Fists hammering suggest violence and aggression.' },
      { sk: 'language', lv: 3, q: 'The cloud "crept" over the horizon, "swallowing the sun". What do these verbs suggest?', a: 'The storm is like a sly, hungry creature that is threatening.', w: ['The storm is weak and harmless.', 'The cloud is moving very fast.', 'The sun is setting normally.'], hint: 'Who creeps and swallows?', ex: 'The verbs personify the cloud as a predator, creating a sense of threat.' },
      { sk: 'language', lv: 4, q: 'What does "bruise-coloured" suggest about the cloud?', a: 'It is dark purple, and hints at harm and violence to come.', w: ['It is pale and fluffy.', 'It is bright and cheerful.', 'It is green like grass.'], hint: 'When do we get bruises?', ex: 'Bruises are dark purple and come from injury: the colour hints that harm is coming.' },
      { sk: 'structure', lv: 3, q: 'How is the extract structured?', a: 'It moves from calm, to a gathering storm, to the storm\'s height, and ends with a new danger.', w: ['It starts with the storm and then flashes back to the calm.', 'It describes the same moment from two points of view.', 'It begins and ends with the same image.'], hint: 'Follow the times of day.', ex: 'Morning (calm) → noon (change) → six o\'clock (storm) → the boat (new danger).' },
      { sk: 'structure', lv: 4, q: 'Why does the extract end with the very short sentence "A boat."?', a: 'It creates a cliffhanger: someone may be in danger out at sea.', w: ['It tells us the storm is over.', 'It describes the lighthouse.', 'It shows Nell is going sailing.'], hint: 'What do you want to know next?', ex: 'The short sentence lands like a shock and leaves us asking who is on the boat.' },
      { sk: 'structure', lv: 3, q: 'In the last paragraph, where does the focus shift to?', a: 'from inside the lighthouse to something far out at sea', w: ['from the sea back to the morning', 'from Nell to her mother', 'from the lighthouse to the town'], hint: 'Where is the blinking light?', ex: 'The focus moves outward, "far out in the darkness", to the boat.' },
      { sk: 'quotations', lv: 3, q: 'Which quotation best shows that the weather changed?', a: '"By noon, the sky had changed."', w: ['"her father whistled"', '"Nell could hear the bees in the heather"', '"followed the swaying circle of his torch"'], hint: 'Which one is about change?', ex: 'It marks the turning point from calm to storm.' },
      { sk: 'quotations', lv: 4, q: 'Which quotation best shows that Nell is frightened?', a: '"her heart thudding"', w: ['"Nell watched the first white crests"', '"her father whistled"', '"The gulls fell silent"'], hint: 'Which is about Nell\'s own body?', ex: 'A thudding heart is a physical sign of fear.' },
      { sk: 'voice', lv: 2, q: 'What narrative voice does this extract use?', a: 'third person', w: ['first person', 'second person', 'a diary'], hint: 'Is Nell "I" or "she"?', ex: 'Nell is "she": third-person narration.' },
    ],
  },
  // ------------------------------------------------------------------------------------------------
  {
    id: 'market',
    fig: passage(
      `Saturday morning, and Market Street is waking up. Shutters rattle upwards. A man in a striped apron stacks oranges into a bright pyramid, while the woman at the next stall shakes out a sheet of rainbow-coloured fabric that ripples like water.

By nine o'clock the street is a river of people. The air is thick with the smell of frying onions and warm bread. Somewhere a radio is playing, and a toddler on her father's shoulders sings along, badly and happily.

At the far end, away from the noise, old Mr Ellis sits beside his book stall as he has done every Saturday for forty years. He sells almost nothing. He does not seem to mind.`,
      { title: 'Market Day', source: ORIGINAL },
    ),
    qs: [
      { sk: 'retrieval', lv: 1, q: 'What does the man in the striped apron stack?', a: 'oranges', w: ['books', 'fabric', 'bread'], hint: 'Read the first paragraph.', ex: '"stacks oranges into a bright pyramid".' },
      { sk: 'retrieval', lv: 2, q: 'For how long has Mr Ellis run his book stall?', a: 'forty years', w: ['four years', 'since nine o\'clock', 'a few months'], hint: 'Read the last paragraph.', ex: '"every Saturday for forty years".' },
      { sk: 'language', lv: 2, q: 'What does the metaphor "the street is a river of people" suggest?', a: 'Huge crowds are flowing along the street.', w: ['The street has flooded.', 'The street is empty.', 'People are swimming.'], hint: 'How does a river move?', ex: 'The crowd moves like a river: large, constant, flowing.' },
      { sk: 'language', lv: 2, q: '"The air is thick with the smell of frying onions and warm bread" appeals mainly to which sense?', a: 'smell', w: ['sight', 'touch', 'hearing'], hint: 'What is in the air?', ex: 'It is sensory imagery of smell.' },
      { sk: 'language', lv: 4, q: 'The extract is written in the present tense ("is waking up", "sits"). What is the effect?', a: 'It makes the scene feel as if it is happening right now around the reader.', w: ['It shows the events happened long ago.', 'It shows the narrator is confused.', 'It makes the writing more formal.'], hint: 'When does it feel like this is happening?', ex: 'The present tense creates immediacy: we feel we are there.' },
      { sk: 'inference', lv: 3, q: '"He sells almost nothing. He does not seem to mind." What can we infer about Mr Ellis?', a: 'He comes for the routine and the place, not the money.', w: ['He is desperate for customers.', 'He is new to the market.', 'He is angry about the noise.'], hint: 'Why come every week for forty years if you sell nothing?', ex: 'His contentment suggests the market matters to him for reasons other than money.' },
      { sk: 'structure', lv: 3, q: 'How does the focus change in the final paragraph?', a: 'From the busy crowd to one quiet, still individual', w: ['From the market to the writer\'s home', 'From the present back to the past', 'From one stall to the weather'], hint: 'Compare paragraph 2 and paragraph 3.', ex: 'The writer zooms in from the noisy crowd to a single, calm figure, creating contrast.' },
      { sk: 'structure', lv: 2, q: 'Which phrase shows time moving on in the extract?', a: '"By nine o\'clock"', w: ['"At the far end"', '"Somewhere a radio is playing"', '"rainbow-coloured fabric"'], hint: 'Look for a time.', ex: '"By nine o\'clock" moves us on from early morning.' },
      { sk: 'quotations', lv: 2, q: 'Which quotation best shows that the market is busy?', a: '"the street is a river of people"', w: ['"away from the noise"', '"He sells almost nothing"', '"Shutters rattle upwards"'], hint: 'Which is about crowds?', ex: 'A "river of people" suggests huge crowds.' },
    ],
  },
  // ------------------------------------------------------------------------------------------------
  {
    id: 'swim',
    fig: passage(
      `Every summer, newspapers carry the same sad stories. Yet swimming is one of the few skills that can genuinely save a life. So why are so many children leaving primary school unable to swim a single length?

The answer, in part, is cost. Pool sessions are expensive, and travelling to the nearest pool can take a big bite out of the school day. Some schools have quietly cut lessons altogether.

This is a mistake. Swimming is not a luxury like a trip to a theme park; it is as essential as learning to cross the road. Every child deserves the chance to feel safe and confident in water. Surely that is worth paying for?`,
      { title: 'Every child should learn to swim', source: ORIGINAL },
    ),
    qs: [
      { sk: 'retrieval', lv: 2, q: 'What reason does the writer give for children not learning to swim?', a: 'cost', w: ['fear of water', 'bad weather', 'lack of interest'], hint: 'Read the start of paragraph 2.', ex: '"The answer, in part, is cost."' },
      { sk: 'inference', lv: 3, q: 'What is the writer\'s attitude to schools that have cut swimming lessons?', a: 'disapproving: they think it is a mistake', w: ['approving: they think it saves money sensibly', 'neutral: they have no opinion', 'amused'], hint: 'Read the first sentence of paragraph 3.', ex: '"This is a mistake." The writer clearly disapproves.' },
      { sk: 'language', lv: 3, q: 'Why does the writer compare swimming to "learning to cross the road"?', a: 'To suggest swimming is a basic safety skill every child needs.', w: ['To suggest swimming is dangerous.', 'To suggest roads are near pools.', 'To make swimming sound like a luxury.'], hint: 'What kind of skill is crossing the road?', ex: 'Crossing the road is an everyday life-saving skill, so swimming is presented as just as essential.' },
      { sk: 'language', lv: 2, q: '"Surely that is worth paying for?" is an example of...', a: 'a rhetorical question', w: [{ label: 'a statistic', feedback: 'A statistic is a number or figure.' }, { label: 'a simile', feedback: 'A simile compares with "like" or "as".' }, { label: 'alliteration', feedback: 'Alliteration repeats a starting sound.' }], hint: 'Does the writer expect an answer?', ex: 'It is a question asked for effect, pushing the reader to agree.' },
      { sk: 'structure', lv: 4, q: 'Why does the third paragraph begin with the short sentence "This is a mistake."?', a: 'It states the writer\'s view forcefully, turning from explaining the problem to arguing.', w: ['It introduces a new topic about theme parks.', 'It summarises the whole article as neutral.', 'It shows the writer has changed their mind.'], hint: 'What do paragraphs 1-2 do, and what does paragraph 3 do?', ex: 'The blunt sentence is a turning point: the writer moves from explaining to judging.' },
      { sk: 'quotations', lv: 3, q: 'Which quotation best shows that the writer thinks swimming is essential?', a: '"it is as essential as learning to cross the road"', w: ['"Pool sessions are expensive"', '"Every summer, newspapers carry the same sad stories"', '"Some schools have quietly cut lessons"'], hint: 'Which one contains the word "essential"?', ex: 'It directly calls swimming essential.' },
    ],
  },
  // ------------------------------------------------------------------------------------------------
  {
    id: 'gate',
    fig: passage(
      `Grandma's garden gate still squeaked. Amira pushed it open, just as she had every Sunday since she was small, and stepped onto the mossy path.

Inside, the house smelled of lavender and dust. Boxes stood everywhere. In one, beneath a folded tablecloth, Amira found a photograph: a little girl in wellies, laughing, holding a watering can almost as big as herself. On the back, in Grandma's looping writing, were the words: "Amira, aged four. My best helper."

She sat for a long time with the photograph in her lap.

When she finally left, the sun was low. She closed the garden gate gently behind her. It still squeaked.`,
      { title: 'The Gate', source: ORIGINAL },
    ),
    qs: [
      { sk: 'retrieval', lv: 1, q: 'What did the house smell of?', a: 'lavender and dust', w: ['bread and onions', 'roses and polish', 'smoke and rain'], hint: 'Read the start of paragraph 2.', ex: '"the house smelled of lavender and dust".' },
      { sk: 'retrieval', lv: 2, q: 'What was written on the back of the photograph?', a: '"Amira, aged four. My best helper."', w: ['"Grandma\'s garden"', '"Happy birthday, Amira"', '"Sunday afternoon"'], hint: 'Look for the words in quotation marks.', ex: 'Grandma wrote "Amira, aged four. My best helper."' },
      { sk: 'inference', lv: 3, q: 'What do the "boxes everywhere" most likely suggest?', a: 'The house is being cleared or packed up.', w: ['Grandma is having a party.', 'Grandma has just bought lots of new things.', 'A delivery has arrived for Amira.'], hint: 'Think about why a house would be full of boxes, and the mood of the extract.', ex: 'Boxes everywhere suggest the house is being emptied, perhaps because Grandma is no longer there.' },
      { sk: 'inference', lv: 4, q: 'Why does Amira sit "for a long time with the photograph in her lap"?', a: 'She is lost in memories and emotion.', w: ['She is waiting for a lift.', 'She is bored.', 'She cannot read the writing.'], hint: 'What has the photograph reminded her of?', ex: 'The photograph brings back her memories of Grandma, and she is overwhelmed.' },
      { sk: 'structure', lv: 3, q: 'The extract begins and ends with the squeaking gate. What is this structure called?', a: 'cyclical structure', w: [{ label: 'flashback', feedback: 'A flashback jumps back to an earlier time.' }, { label: 'in medias res', feedback: 'In medias res means starting in the middle of the action.' }, { label: 'cliffhanger', feedback: 'A cliffhanger ends on an unresolved moment of suspense.' }], hint: 'It comes full circle.', ex: 'Ending where it began is a cyclical structure.' },
      { sk: 'structure', lv: 4, q: 'Paragraph 3 is a single sentence on its own. What is the effect?', a: 'It slows the pace and creates a quiet, emotional pause.', w: ['It speeds up the action.', 'It introduces a new character.', 'It changes the setting.'], hint: 'What is Amira doing in it?', ex: 'Isolating the sentence makes the reader pause with Amira.' },
      { sk: 'structure', lv: 5, q: 'What is the effect of ending with "It still squeaked."?', a: 'It echoes the opening, suggesting memories of Grandma remain even as things change.', w: ['It shows the gate has been fixed.', 'It creates a cliffhanger about a burglar.', 'It reveals that Amira is angry.'], hint: 'Where have we seen this before?', ex: 'The echo of the first line brings the story full circle: something familiar survives.' },
      { sk: 'language', lv: 3, q: 'What does "Grandma\'s looping writing" add to the description?', a: 'A personal, affectionate detail that makes Grandma feel present.', w: ['It shows Grandma could not write.', 'It shows the photograph is fake.', 'It describes the weather.'], hint: 'Why mention handwriting at all?', ex: 'Handwriting is personal: it brings Grandma close in a moment when she is absent.' },
      { sk: 'voice', lv: 2, q: 'What narrative voice does this extract use?', a: 'third person', w: ['first person', 'second person', 'a letter'], hint: 'Is Amira "I" or "she"?', ex: 'Amira is "she": third person.' },
    ],
  },
]
