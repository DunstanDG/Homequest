import type { ItemGenerator } from '@/engine/registry'
import { choice } from '../kit'
import { G, atLevel, bankGen, pairMatchGen, q, revealGen, sample, sequenceGen, type MC, type Pair } from './helpers'
import { PASSAGES } from './passages'

// =====================================================================================================
// Authors and texts
// =====================================================================================================

const BOOKS: { book: string; author: string; lv: number }[] = [
  { book: 'A Christmas Carol', author: 'Charles Dickens', lv: 1 },
  { book: 'Oliver Twist', author: 'Charles Dickens', lv: 1 },
  { book: 'Great Expectations', author: 'Charles Dickens', lv: 2 },
  { book: 'Jane Eyre', author: 'Charlotte Brontë', lv: 3 },
  { book: 'Wuthering Heights', author: 'Emily Brontë', lv: 3 },
  { book: 'Pride and Prejudice', author: 'Jane Austen', lv: 2 },
  { book: 'Emma', author: 'Jane Austen', lv: 3 },
  { book: 'Frankenstein', author: 'Mary Shelley', lv: 2 },
  { book: 'Treasure Island', author: 'Robert Louis Stevenson', lv: 2 },
  { book: 'Strange Case of Dr Jekyll and Mr Hyde', author: 'Robert Louis Stevenson', lv: 3 },
  { book: 'The War of the Worlds', author: 'H. G. Wells', lv: 3 },
  { book: 'The Time Machine', author: 'H. G. Wells', lv: 3 },
  { book: 'The Hound of the Baskervilles', author: 'Arthur Conan Doyle', lv: 2 },
  { book: 'The Jungle Book', author: 'Rudyard Kipling', lv: 2 },
  { book: 'Dracula', author: 'Bram Stoker', lv: 2 },
  { book: 'The Picture of Dorian Gray', author: 'Oscar Wilde', lv: 4 },
  { book: 'The Canterville Ghost', author: 'Oscar Wilde', lv: 4 },
  { book: 'Alice\'s Adventures in Wonderland', author: 'Lewis Carroll', lv: 1 },
  { book: 'Black Beauty', author: 'Anna Sewell', lv: 3 },
  { book: 'Little Women', author: 'Louisa May Alcott', lv: 4 },
]

const CHARACTERS: { chars: string; book: string; lv: number }[] = [
  { chars: 'Sherlock Holmes and Dr Watson', book: 'The Hound of the Baskervilles', lv: 1 },
  { chars: 'Mowgli and Baloo', book: 'The Jungle Book', lv: 1 },
  { chars: 'Jim Hawkins and Long John Silver', book: 'Treasure Island', lv: 2 },
  { chars: 'Pip and Miss Havisham', book: 'Great Expectations', lv: 3 },
  { chars: 'Elizabeth Bennet and Mr Darcy', book: 'Pride and Prejudice', lv: 3 },
  { chars: 'Heathcliff and Catherine Earnshaw', book: 'Wuthering Heights', lv: 4 },
  { chars: 'Fagin and the Artful Dodger', book: 'Oliver Twist', lv: 2 },
  { chars: 'Jonathan Harker and Van Helsing', book: 'Dracula', lv: 4 },
  { chars: 'Mr Rochester', book: 'Jane Eyre', lv: 4 },
  { chars: 'Victor Frankenstein and Robert Walton', book: 'Frankenstein', lv: 3 },
  { chars: 'Mr Utterson and Dr Lanyon', book: 'Strange Case of Dr Jekyll and Mr Hyde', lv: 4 },
  { chars: 'Ebenezer Scrooge and Bob Cratchit', book: 'A Christmas Carol', lv: 1 },
  { chars: 'Meg, Jo, Beth and Amy March', book: 'Little Women', lv: 4 },
  { chars: 'the White Rabbit and the Mad Hatter', book: 'Alice\'s Adventures in Wonderland', lv: 1 },
]

const authorGenerators: ItemGenerator[] = [
  G('authors.who-wrote', 'fiction.authors-texts', [1, 4], (rng, d) => {
    const r = rng.pick(atLevel(BOOKS, d))
    const authors = [...new Set(BOOKS.map((b) => b.author))].filter((a) => a !== r.author && !(r.author.includes('Brontë') && a.includes('Brontë')))
    return choice({
      rng,
      prompt: `Who wrote ${r.book}?`,
      correct: r.author,
      wrong: sample(rng, authors, 3).map((a) => ({ label: a, feedback: `${a} wrote ${BOOKS.filter((b) => b.author === a).map((b) => b.book).join(' and ')}.` })),
      hint: 'Think about the genre and the period of the book.',
      explanation: `${r.book} was written by ${r.author}.`,
    })
  }),
  pairMatchGen(
    'authors.match',
    'fiction.authors-texts',
    [2, 4],
    BOOKS.map((b): Pair => ({ left: b.book, right: b.author, lv: b.lv })),
    'Match each book to its author.',
    'Start with the authors you know best.',
  ),
  G('authors.characters', 'fiction.authors-texts', [1, 5], (rng, d) => {
    const r = rng.pick(atLevel(CHARACTERS, d))
    const books = CHARACTERS.map((c) => c.book).filter((b) => b !== r.book)
    return choice({
      rng,
      prompt: `In which book would you meet ${r.chars}?`,
      correct: r.book,
      wrong: sample(rng, books, 3),
      hint: 'Think of the setting these characters belong to.',
      explanation: `${r.chars}: ${r.book}, by ${BOOKS.find((b) => b.book === r.book)?.author ?? 'a classic author'}.`,
    })
  }),
]

// =====================================================================================================
// Victorian context
// =====================================================================================================

const VICTORIAN: MC[] = [
  { q: 'When did Queen Victoria reign?', a: '1837 to 1901', w: ['1558 to 1603', '1901 to 1952', '1700 to 1760'], hint: 'She came to the throne as a young woman and reigned for over sixty years.', ex: 'Victoria reigned from 1837 to 1901.', lv: 1 },
  { q: 'What was a workhouse?', a: 'a place where the very poor were given food and shelter in return for hard work, under harsh conditions', w: ['a factory owned by the queen', 'a type of school for rich children', 'a holiday camp'], hint: 'Scrooge asks, "And the Union workhouses?"', ex: 'Workhouses were deliberately harsh to discourage people from asking for help.', lv: 1 },
  { q: 'Which law of 1834 led to many more workhouses being built?', a: 'the Poor Law Amendment Act', w: ['the Education Act', 'the Factory Act', 'the Reform Act'], hint: 'It was about the poor.', ex: 'The 1834 Poor Law Amendment Act made workhouses the main help for the poor.', lv: 4 },
  { q: 'What happened to Charles Dickens when he was about twelve?', a: 'He was sent to work in a blacking (shoe-polish) factory while his father was in a debtors\' prison.', w: ['He became a famous actor.', 'He moved to America.', 'He went to university.'], hint: 'It gave him first-hand experience of poverty.', ex: 'This childhood experience shaped his sympathy for the poor and for working children.', lv: 3 },
  { q: 'How were many of Dickens\'s novels first published?', a: 'in instalments (serial parts), a chapter or so at a time', w: ['only as expensive leather books', 'as plays for the theatre', 'on the radio'], hint: 'Readers waited eagerly for the next part.', ex: 'Serial publication made novels cheaper and built suspense between parts.', lv: 3 },
  { q: 'What was the Industrial Revolution?', a: 'the growth of factories, machines and cities that changed how people lived and worked', w: ['a war between Britain and France', 'a change in who was king', 'a fashion for wearing machines'], hint: 'Think of mills, steam and smoke.', ex: 'Industrialisation brought wealth to some and crowded, dirty conditions to many.', lv: 2 },
  { q: 'Which statement about children in early Victorian Britain is true?', a: 'Many poor children worked long hours in factories, mines or as chimney sweeps.', w: ['All children went to school until sixteen.', 'Children were not allowed to work.', 'Only rich children worked.'], hint: 'Think of Oliver Twist.', ex: 'Child labour was common; laws slowly limited it during the century.', lv: 2 },
  { q: 'What did the Education Act of 1870 do?', a: 'It set up schools so that all children could receive an elementary education.', w: ['It closed all schools.', 'It made university free.', 'It banned reading novels.'], hint: 'It was about schooling for everyone.', ex: 'The 1870 Act created board schools to provide elementary education for all.', lv: 4 },
  { q: 'Why does Dickens have Scrooge talk about the "surplus population"?', a: 'To criticise people who saw the poor as a burden to be reduced rather than helped', w: ['To show Scrooge is a doctor', 'To give accurate population figures', 'To praise the government'], hint: 'Dickens puts these cruel words in the mouth of his villain.', ex: 'Dickens attacks the heartless view that the poor were "surplus".', lv: 4 },
  { q: 'A Christmas Carol and the first commercial Christmas card both appeared in which year?', a: '1843', w: ['1066', '1914', '1900'], hint: 'Early in Victoria\'s reign.', ex: 'Both date from 1843; the Victorians shaped many Christmas traditions we still know.', lv: 5 },
  { q: 'What was a debtors\' prison?', a: 'a prison for people who could not pay what they owed', w: ['a prison for thieves only', 'a school for bankers', 'a hospital'], hint: 'Dickens\'s father was sent to one.', ex: 'People could be locked up until their debts were paid.', lv: 3 },
  { q: 'Victorian society had a strict class system. Which best describes it?', a: 'People were divided into upper, middle and working classes, and it was hard to move between them.', w: ['Everyone was treated equally.', 'Only the queen had a class.', 'People chose their class each year.'], hint: 'Think of the Cratchits and Scrooge.', ex: 'Class shaped people\'s chances in life; many Victorian novels explore it.', lv: 2 },
]

// =====================================================================================================
// A Christmas Carol
// =====================================================================================================

const CAROL_PLOT = [
  'Scrooge refuses his nephew Fred\'s invitation and turns away the charity collectors.',
  'Marley\'s ghost visits Scrooge, wrapped in chains.',
  'The Ghost of Christmas Past shows Scrooge Fezziwig\'s party.',
  'Scrooge sees Belle end their engagement.',
  'The Ghost of Christmas Present shows the Cratchits\' Christmas dinner.',
  'The Ghost of Christmas Present reveals the children Ignorance and Want.',
  'The Ghost of Christmas Yet to Come shows Scrooge his own grave.',
  'Scrooge wakes on Christmas morning and sends a prize turkey to the Cratchits.',
  'Scrooge raises Bob Cratchit\'s salary.',
]

const CAROL_CAST: Pair[] = [
  { left: 'Ebenezer Scrooge', right: 'a mean, rich old businessman who hates Christmas', lv: 1 },
  { left: 'Jacob Marley', right: 'Scrooge\'s dead business partner, who returns as a ghost', lv: 1 },
  { left: 'Bob Cratchit', right: 'Scrooge\'s poorly paid clerk', lv: 1 },
  { left: 'Tiny Tim', right: 'Bob\'s youngest son, who is ill and walks with a crutch', lv: 1 },
  { left: 'Fred', right: 'Scrooge\'s cheerful nephew, who invites him to Christmas dinner', lv: 2 },
  { left: 'Fezziwig', right: 'Scrooge\'s kind former employer, who threw a Christmas party', lv: 2 },
  { left: 'Belle', right: 'the young woman who ends her engagement to Scrooge', lv: 2 },
  { left: 'Fan', right: 'Scrooge\'s little sister, Fred\'s mother', lv: 4 },
  { left: 'Old Joe', right: 'the dealer who buys the dead man\'s stolen belongings', lv: 4 },
]

const CAROL_MC: MC[] = [
  { q: 'How many staves (chapters) does A Christmas Carol have?', a: 'five', w: ['three', 'seven', 'twelve'], hint: 'One for Marley, one per spirit, and one more.', ex: 'Five staves: Marley, the three spirits, and the ending.', lv: 1 },
  { q: 'Why did Dickens call the chapters "staves"?', a: 'A stave is a verse of a song, fitting a book called a "carol".', w: ['A stave is a type of ghost.', 'Staves are wooden sticks for beating the poor.', 'It was the Victorian word for page.'], hint: 'What is a carol?', ex: 'The book is structured like a Christmas song.', lv: 3 },
  { q: 'How long has Jacob Marley been dead when the story begins?', a: 'seven years', w: ['one year', 'seventy years', 'a week'], hint: 'He died on Christmas Eve some years before.', ex: 'Marley has been dead seven years.', lv: 2 },
  { q: 'What is Marley\'s chain made of?', a: 'cash-boxes, keys, padlocks, ledgers and heavy purses', w: ['holly and ivy', 'gold coins only', 'bones'], hint: 'Things connected to his business.', ex: 'His chain is made of the money-related things he cared about in life: "I wear the chain I forged in life".', lv: 3 },
  { q: 'What does the Ghost of Christmas Yet to Come show Scrooge?', a: 'people glad about a dead man, Tiny Tim\'s death, and Scrooge\'s own grave', w: ['Scrooge\'s happy childhood', 'the Cratchits\' cheerful Christmas dinner', 'Fezziwig\'s party'], hint: 'This spirit shows the future.', ex: 'It shows a future in which Scrooge dies unloved and Tiny Tim dies.', lv: 2 },
  { q: 'Who are Ignorance and Want?', a: 'two wretched children hidden under the robe of the Ghost of Christmas Present', w: ['Bob Cratchit\'s eldest children', 'Scrooge\'s parents', 'two charity collectors'], hint: '"This boy is Ignorance. This girl is Want."', ex: 'They represent the poverty and lack of education Dickens wanted society to tackle.', lv: 3 },
  { q: 'Why does Belle end her engagement to the young Scrooge?', a: 'He has come to love money more than he loves her.', w: ['She falls in love with Fred.', 'Scrooge moves to America.', 'Her father forbids it.'], hint: '"Another idol has displaced me... a golden one."', ex: 'She says money ("a golden" idol) has replaced her in his heart.', lv: 3 },
  { q: 'What happens to Tiny Tim at the end of the book?', a: 'He does not die, and Scrooge becomes a second father to him.', w: ['He dies, as the spirit showed.', 'He is sent to a workhouse.', 'He becomes Scrooge\'s clerk.'], hint: 'The future shown by the spirit can be changed.', ex: '"Tiny Tim, who did NOT die" - Scrooge\'s change saves him.', lv: 2 },
  { q: 'What is Dickens\'s main message in A Christmas Carol?', a: 'People, especially the wealthy, have a responsibility to care for the poor.', w: ['Ghosts are real and dangerous.', 'Christmas should be cancelled.', 'Money is the most important thing in life.'], hint: 'What does Scrooge learn?', ex: 'Dickens urges generosity and social responsibility.', lv: 2 },
  { q: 'Which word best describes Scrooge\'s change across the novel?', a: 'redemption', w: ['revenge', 'decline', 'disguise'], hint: 'He is given a second chance and takes it.', ex: 'Scrooge is redeemed: he changes from miser to generous man.', lv: 4 },
  { q: 'In Stave One, Scrooge asks the charity collectors, "Are there no prisons?" What does this show?', a: 'He believes the poor should be dealt with by prisons and workhouses, not charity.', w: ['He is worried about crime.', 'He wants to visit a prison.', 'He works as a prison guard.'], hint: 'He is refusing to give money.', ex: 'He thinks institutions, not kindness, should deal with poverty.', lv: 3 },
]

interface CarolQuote {
  line: string
  who: string
  ctx: string
  lv: number
}
const CAROL_QUOTES: CarolQuote[] = [
  { line: 'Bah! Humbug!', who: 'Scrooge', ctx: 'Scrooge dismissing Christmas in Stave One.', lv: 1 },
  { line: 'Are there no prisons?', who: 'Scrooge', ctx: 'Scrooge refusing to help the poor.', lv: 2 },
  { line: 'If they would rather die, they had better do it, and decrease the surplus population.', who: 'Scrooge', ctx: 'Scrooge\'s cruel words, which the Ghost of Christmas Present later throws back at him.', lv: 3 },
  { line: 'God bless Us, Every One!', who: 'Tiny Tim', ctx: 'Tiny Tim\'s blessing at Christmas dinner.', lv: 1 },
  { line: 'I wear the chain I forged in life.', who: 'Marley\'s ghost', ctx: 'Marley explaining his chain.', lv: 2 },
  { line: 'Mankind was my business.', who: 'Marley\'s ghost', ctx: 'Marley regretting that he cared only for money, not people.', lv: 4 },
  { line: 'I will honour Christmas in my heart, and try to keep it all the year.', who: 'Scrooge', ctx: 'Scrooge\'s promise to change.', lv: 3 },
  { line: 'A merry Christmas, uncle! God save you!', who: 'Fred', ctx: 'Fred greeting Scrooge cheerfully in Stave One.', lv: 2 },
  { line: 'This boy is Ignorance. This girl is Want.', who: 'the Ghost of Christmas Present', ctx: 'The spirit reveals the two children.', lv: 3 },
  { line: 'Another idol has displaced me... a golden one.', who: 'Belle', ctx: 'Belle ending her engagement to Scrooge.', lv: 4 },
  { line: 'I am as light as a feather, I am as happy as an angel, I am as merry as a schoolboy.', who: 'Scrooge', ctx: 'The transformed Scrooge on Christmas morning.', lv: 3 },
]
const CAROL_SPEAKERS = ['Scrooge', 'Tiny Tim', 'Marley\'s ghost', 'Fred', 'the Ghost of Christmas Present', 'Belle', 'Bob Cratchit']

const carolGenerators: ItemGenerator[] = [
  sequenceGen('carol.plot-order', 'fiction.christmas-carol', [2, 5], [{ name: 'A Christmas Carol', steps: CAROL_PLOT }]),
  pairMatchGen('carol.cast', 'fiction.christmas-carol', [1, 4], CAROL_CAST, 'Match each character in A Christmas Carol to their description.', 'Start with Scrooge, Marley and the Cratchits.'),
  bankGen('carol.facts', 'fiction.christmas-carol', [1, 5], CAROL_MC),
  G('carol.who-said', 'fiction.christmas-carol', [1, 5], (rng, d) => {
    const r = rng.pick(atLevel(CAROL_QUOTES, d))
    return choice({
      rng,
      prompt: `In A Christmas Carol, who says this?\n${q(r.line)}`,
      correct: r.who,
      wrong: sample(
        rng,
        CAROL_SPEAKERS.filter((s) => s !== r.who),
        3,
      ),
      hint: 'Is this the old Scrooge, the new Scrooge, or someone trying to change him?',
      explanation: `${r.who}: ${r.ctx}`,
    })
  }),
  revealGen('carol.written', 'fiction.christmas-carol', [3, 5], [
    {
      prompt: 'How does Dickens show that Scrooge changes in A Christmas Carol? Refer to the beginning and the end.',
      model: 'At the start, Scrooge is cold and selfish: he dismisses Christmas as "Humbug!" and refuses to help the poor, asking "Are there no prisons?" By the end he is transformed. He sends a prize turkey to the Cratchits, raises Bob\'s salary and becomes "a second father" to Tiny Tim. Even his language changes: he is "as light as a feather" and "as merry as a schoolboy", showing that generosity has made him happy. Dickens uses this change to show readers that anyone can choose to care for others.',
      checklist: ['Describes Scrooge at the start with a quotation', 'Describes Scrooge at the end with evidence', 'Explains what causes the change (the spirits)', 'Links to Dickens\'s message'],
    },
    {
      prompt: 'Why does Dickens include the Cratchit family in A Christmas Carol?',
      model: 'Dickens uses the Cratchits to show that the poor are loving, hard-working people who deserve help. Although they have little money, their Christmas dinner is full of joy, and Tiny Tim says "God bless Us, Every One!" Tiny Tim\'s illness makes readers, and Scrooge, feel pity, especially when the spirit suggests he will die. This helps Dickens challenge the idea that the poor are a "surplus population" and encourages wealthy readers to be generous.',
      checklist: ['Makes a clear point about the Cratchits\' purpose', 'Uses a quotation or close reference', 'Mentions Tiny Tim\'s role', 'Links to Victorian context or Dickens\'s message'],
    },
  ]),
]

// =====================================================================================================
// Gothic
// =====================================================================================================

const GOTHIC: MC[] = [
  { q: 'Which setting is most typical of Gothic fiction?', a: 'a crumbling castle on a stormy night', w: ['a sunny beach on holiday', 'a modern office', 'a busy shopping centre'], hint: 'Think dark, remote and decaying.', ex: 'Gothic settings are isolated, dark and decaying.', lv: 1 },
  { q: 'Which of these is a common feature of Gothic fiction?', a: 'the supernatural or the unexplained', w: ['a happy ending with a wedding', 'detailed instructions', 'jokes in every chapter'], hint: 'Ghosts, monsters, mysteries...', ex: 'Gothic fiction often includes the supernatural and the mysterious.', lv: 1 },
  { q: 'Which novel is often called the first Gothic novel?', a: 'The Castle of Otranto by Horace Walpole (1764)', w: ['Dracula by Bram Stoker', 'Oliver Twist by Charles Dickens', 'Emma by Jane Austen'], hint: 'It is from the eighteenth century.', ex: 'Walpole\'s The Castle of Otranto (1764) is usually seen as the first Gothic novel.', lv: 4 },
  { q: 'In Frankenstein, who is Frankenstein?', a: 'the scientist, Victor Frankenstein, who creates the creature', w: [{ label: 'the creature', feedback: 'A common mix-up: the creature is never given a name.' }, 'a village in Germany', 'the narrator\'s ship'], hint: 'Who builds whom?', ex: 'Victor Frankenstein is the scientist; his creation has no name.', lv: 1 },
  { q: 'When was Frankenstein first published?', a: '1818', w: ['1918', '1718', '1868'], hint: 'Mary Shelley was still a young woman.', ex: 'Frankenstein was published in 1818.', lv: 3 },
  { q: 'Frankenstein grew out of a challenge to write a ghost story. Where did this happen?', a: 'at a villa by Lake Geneva in 1816, with Lord Byron and Percy Shelley', w: ['in a London coffee house in 1900', 'on a ship to America', 'at Whitby Abbey'], hint: 'A wet summer in Switzerland.', ex: 'During a stormy summer at the Villa Diodati, Byron suggested they each write a ghost story.', lv: 5 },
  { q: 'In Strange Case of Dr Jekyll and Mr Hyde, what does Jekyll\'s potion do?', a: 'It transforms him into Hyde, releasing the evil side of his nature.', w: ['It makes him invisible.', 'It brings the dead back to life.', 'It lets him travel in time.'], hint: 'Two sides of one man.', ex: 'The potion separates out his darker self as Edward Hyde.', lv: 2 },
  { q: 'Which theme is central to Jekyll and Hyde?', a: 'duality: the good and evil sides within one person', w: ['young love', 'shipwreck and survival', 'school life'], hint: 'One man, two identities.', ex: 'The novella explores the double nature of humanity.', lv: 2 },
  { q: 'In Dracula, how is the story told?', a: 'through letters, diary entries and newspaper cuttings', w: ['by Dracula himself in the first person', 'as a play script', 'in rhyming verse'], hint: 'It is pieced together from documents.', ex: 'Dracula is an epistolary novel, built from documents.', lv: 4 },
  { q: 'Why do Gothic writers often use pathetic fallacy (storms, darkness, fog)?', a: 'To create a threatening, eerie atmosphere that matches the horror', w: ['To give accurate weather reports', 'To make the setting cheerful', 'To fill space'], hint: 'Weather and mood.', ex: 'Stormy, dark weather builds fear and suspense.', lv: 2 },
  { q: 'What is a "doppelgänger" (or "the double") in Gothic fiction?', a: 'a character who mirrors or is a dark version of another', w: ['a type of castle', 'a vampire\'s coffin', 'the hero\'s horse'], hint: 'Think of Jekyll and Hyde.', ex: 'The double shows a hidden side of a character.', lv: 4 },
  { q: 'What is Frankenstein\'s subtitle?', a: 'The Modern Prometheus', w: ['The Last Vampire', 'A Ghost Story of Christmas', 'The Strange Case'], hint: 'Prometheus stole fire from the gods in Greek myth.', ex: 'Like Prometheus, Victor oversteps human limits and is punished.', lv: 5 },
  { q: 'In Jekyll and Hyde, who is Mr Utterson?', a: 'a lawyer and Jekyll\'s friend, who investigates the mystery', w: ['Jekyll\'s butler', 'the murdered politician', 'a police detective from Scotland Yard'], hint: 'Much of the story follows him.', ex: 'Utterson the lawyer pieces the mystery together.', lv: 3 },
  { q: 'Which writer is famous for Gothic short stories such as "The Tell-Tale Heart"?', a: 'Edgar Allan Poe', w: ['Jane Austen', 'Lewis Carroll', 'Anna Sewell'], hint: 'An American writer of the 1840s.', ex: 'Poe wrote dark, Gothic tales and poems such as "The Raven".', lv: 3 },
]

export const fictionGenerators: ItemGenerator[] = [
  ...authorGenerators,
  bankGen('victorian.context', 'fiction.victorian-context', [1, 5], VICTORIAN),
  ...carolGenerators,
  bankGen('gothic.facts', 'fiction.gothic', [1, 5], GOTHIC),
  revealGen('gothic.written', 'fiction.gothic', [3, 5], [
    {
      prompt: 'Write the opening paragraph of a Gothic story set in an abandoned house. Use at least three Gothic conventions.',
      model: 'The house had waited at the end of the lane for a hundred years, and tonight it seemed to be waiting for me. Rain lashed the broken windows; somewhere inside, a door creaked open on its own. As lightning split the sky, I saw a face at the highest window - pale, still, watching. Then the darkness swallowed it, and I heard my own name whispered from inside.',
      checklist: ['Uses an isolated or decaying setting', 'Uses pathetic fallacy (stormy or dark weather)', 'Hints at the supernatural or unexplained', 'Builds suspense (e.g. a short sentence, a cliffhanger)', 'Uses precise, atmospheric vocabulary'],
    },
    {
      fig: PASSAGES.find((p) => p.id === 'frankenstein')?.fig,
      prompt: 'Explain how Mary Shelley creates a Gothic atmosphere in the moment the creature comes to life.',
      model: 'Shelley creates a Gothic atmosphere through setting, weather and light. It is "a dreary night of November" and "one in the morning", so the scene happens in darkness. The pathetic fallacy of rain that "pattered dismally" creates a gloomy mood. The candle is "nearly burnt out", and in its fading light Victor sees "the dull yellow eye" of the creature open, a horrifying, unnatural detail.',
      checklist: ['Comments on the time or setting', 'Identifies pathetic fallacy', 'Uses at least two quotations', 'Explains how a detail creates horror or suspense'],
    },
  ]),
]
