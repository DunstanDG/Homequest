import { passage } from '../kit'
import { SRC } from './sources'
import { E, F, type Topic } from './types'

/** Two interpretations shown together. */
const pair = (a: { text: string; source?: string }, b: { text: string; source?: string }, title: string) =>
  passage(`Interpretation A: ${a.text}\n\nInterpretation B: ${b.text}`, { title, source: `A: ${a.source ?? ''} B: ${b.source ?? ''}` })

const asPassage = (f: (typeof SRC)[keyof typeof SRC]) => (f.type === 'passage' ? { text: f.text, source: f.source } : { text: '' })

export const CROMWELL_PAIR = pair(asPassage(SRC.cromwellA), asPassage(SRC.cromwellB), 'Two interpretations of Oliver Cromwell')
export const HAIG_PAIR = pair(asPassage(SRC.haigA), asPassage(SRC.haigB), 'Two interpretations of General Haig')
export const ABOLITION_PAIR = pair(asPassage(SRC.abolitionA), asPassage(SRC.abolitionB), 'Two interpretations of why the slave trade was abolished')

/** Primary-school building blocks underneath KS3. */
export const FOUNDATIONS: Topic[] = [
  {
    skill: 'foundation.bc-ad',
    title: 'BC and AD dates',
    facts: [
      F([1, 2], 'What does AD stand for?', "Anno Domini, Latin for 'in the year of our Lord'", [
        ['After Death', 'A very common mistake! AD is Latin: Anno Domini.'],
        'Ancient Date',
        'After Domesday',
      ], 'It is Latin, and it counts years from the traditional date of the birth of Jesus.', "AD stands for Anno Domini, 'in the year of our Lord'. AD years count forwards from the traditional date of Jesus' birth."),
      F([1, 2], 'What does BC stand for?', 'Before Christ', ['Before Calendar', 'British Calendar', 'Before Caesar'], 'It is the opposite direction from AD.', 'BC means Before Christ. BC years count backwards, so 500 BC is earlier than 200 BC.'),
      F([2, 3], 'Is there a year 0 in the BC and AD system?', 'No: 1 BC is followed directly by AD 1', [
        ['Yes, between 1 BC and AD 1', 'The calendar was worked out without a zero, so 1 BC is followed straight away by AD 1.'],
        'Yes, it is the year the Romans invaded Britain',
        'Yes, but only in leap years',
      ], 'Think about how the years count down in BC and up in AD.', 'There is no year 0. The years go ... 2 BC, 1 BC, AD 1, AD 2 ...'),
      F([2, 4], 'Some books use BCE and CE instead of BC and AD. What do they mean?', 'Before Common Era and Common Era: the year numbers are the same', [
        'They count from the Roman invasion of Britain instead',
        'BCE dates are always 100 years earlier than BC dates',
        'They are only used for dates in China',
      ], 'They are a different label, not a different calendar.', 'BCE (Before Common Era) and CE (Common Era) are used instead of BC and AD, without religious wording. 55 BC is the same year as 55 BCE.'),
      F([3, 5], 'By tradition, where do the letters go in a BC or AD date?', 'AD goes before the number (AD 43) and BC goes after it (55 BC)', [
        'Both go after the number',
        'Both go before the number',
        'AD goes after the number and BC goes before it',
      ], 'Think of how you would write the Roman invasion and Julius Caesar’s visit.', 'Traditionally we write AD 43 but 55 BC. For dates after about AD 1000, AD is usually left out (we just write 1066).'),
    ],
  },
  {
    skill: 'foundation.periods',
    title: 'Britain before 1066',
    events: [
      E(-55, "Julius Caesar's first expedition to Britain"),
      E(43, 'The Romans invade Britain under Emperor Claudius', { key: true }),
      E(122, "Work begins on Hadrian's Wall"),
      E(410, 'Roman rule in Britain comes to an end', { approx: true }),
      E(793, 'Vikings raid the monastery at Lindisfarne'),
      E(878, 'Alfred the Great defeats the Vikings at the Battle of Edington'),
      E(1066, 'The Norman Conquest of England'),
    ],
    seqs: [
      {
        prompt: 'Put these periods of British history in order, earliest first.',
        items: ['The Stone Age', 'The Bronze Age', 'The Iron Age', 'Roman Britain', 'Anglo-Saxon England', 'Norman England'],
        direction: ['Earliest', 'Latest'],
        hint: 'Stone tools came before metal ones, and the Romans came before the Anglo-Saxons.',
        ex: 'Stone, then bronze, then iron tools; the Romans invaded in AD 43; the Anglo-Saxons settled after the Romans left; the Normans conquered England in 1066.',
      },
    ],
    people: [
      { n: 'Claudius', did: 'was the Roman emperor whose army invaded Britain in AD 43' },
      { n: 'Boudica', did: 'was the queen of the Iceni who led a revolt against the Romans' },
      { n: 'Alfred the Great', did: 'was the king of Wessex who defeated the Vikings at Edington in 878' },
      { n: 'Julius Caesar', did: 'led two Roman expeditions to Britain in 55 and 54 BC but did not conquer it' },
      { n: 'Hadrian', did: 'was the Roman emperor who ordered a wall to be built across northern Britain' },
    ],
    facts: [
      F([1, 2], 'Which group raided the monastery at Lindisfarne in 793?', 'The Vikings', [
        ['The Romans', 'The Romans had left Britain almost 400 years earlier.'],
        'The Normans',
        'The Anglo-Saxons',
      ], 'They sailed from Scandinavia.', 'The Viking raid on Lindisfarne in 793 is often seen as the start of the Viking Age in Britain.'),
      F([2, 3], 'Alfred the Great was king of which Anglo-Saxon kingdom?', 'Wessex', ['Northumbria', 'Mercia', 'East Anglia'], 'Its name means "West Saxons".', 'Alfred was King of Wessex. He defeated the Vikings at Edington in 878 and is the only English king called "the Great".'),
      F([2, 3], 'What was the Danelaw?', 'The part of England under Viking control and law', [
        'A Roman wall in the north',
        'A law that ended slavery',
        ['The Norman tax survey', 'That was the Domesday Book, in 1086.'],
      ], '"Dane" was a name for the Vikings.', 'After Alfred’s wars, England was divided: the north and east was the Danelaw, ruled by Vikings.'),
      F([2, 4], 'Which language did the Anglo-Saxons speak?', 'Old English', [
        ['Latin', 'Latin was the language of the Romans and of the Church.'],
        ['Norman French', 'French came with the Normans after 1066.'],
        ['Old Norse', 'Old Norse was the language of the Vikings.'],
      ], 'Modern English grew out of it.', 'The Anglo-Saxons spoke Old English. Many everyday English words come from it.'),
      F([2, 3], 'Roughly when did Roman rule in Britain end?', 'Around AD 410', [
        ['AD 43', 'AD 43 was when the Romans invaded.'],
        '1066',
        'Around 500 BC',
      ], 'Roman rule lasted for over 350 years after the invasion.', 'Roman rule in Britain ended around AD 410, as the Roman Empire struggled to defend itself elsewhere.'),
      F([3, 5], 'Which came first: the Iron Age or the Bronze Age?', 'The Bronze Age', [['The Iron Age', 'Bronze, a mix of copper and tin, was used before people learned to work iron.'], 'They happened at exactly the same time'], 'Which metal is harder to make?', 'The Bronze Age came before the Iron Age, because iron is harder to smelt than bronze.'),
    ],
  },
]

/** Historical skills strand: chronology, sources, interpretations and second-order concepts. */
export const SKILL_TOPICS: Topic[] = [
  {
    skill: 'skills.centuries',
    title: 'centuries and decades',
    terms: [
      { t: 'decade', d: 'a period of ten years' },
      { t: 'century', d: 'a period of one hundred years' },
      { t: 'millennium', d: 'a period of one thousand years' },
      { t: 'circa', d: 'about: used before a date that is not exact, often written c.' },
    ],
    facts: [
      F([1, 2], 'How many years are in a century?', '100', ['10', '1,000', '50'], 'Think of a cent: there are 100 in a dollar.', 'A century is 100 years, a decade is 10 and a millennium is 1,000.'),
      F([2, 3], 'Which years make up the 20th century, strictly speaking?', '1901 to 2000', [
        ['2001 to 2100', 'That is the 21st century.'],
        '1801 to 1900',
        '1200 to 1299',
      ], 'The 1st century AD was AD 1 to AD 100.', 'Because the 1st century was AD 1 to 100, the 20th century is 1901 to 2000. In everyday speech people often treat it as the 1900s.'),
      F([3, 4], 'A history book says a castle was built "c. 1100". What does this mean?', 'It was built around 1100, but the exact date is not known', [
        'It was built in exactly 1100',
        'It was built in the century before 1100',
        'It was built after 1100 by a person called C',
      ], '"c." is short for a Latin word.', '"c." stands for circa, meaning "about". Historians use it when a date is uncertain.'),
    ],
  },
  {
    skill: 'skills.timelines',
    title: 'chronology',
    terms: [
      { t: 'chronology', d: 'putting events in the order they happened' },
      { t: 'anachronism', d: 'something placed in the wrong time period' },
      { t: 'contemporary', d: 'living or happening at the same time' },
      { t: 'period', d: 'a span of time with shared features, such as the Tudor period' },
    ],
    seqs: [
      {
        prompt: 'Put these monarchs in the order they reigned.',
        items: ['William I', 'Henry II', 'John', 'Richard II', 'Henry VII', 'Henry VIII', 'Elizabeth I', 'James I', 'Charles I', 'Charles II', 'Victoria'],
        direction: ['Earliest', 'Latest'],
        hint: 'Medieval kings came before the Tudors, then the Stuarts, then (much later) Victoria.',
        ex: 'William I (from 1066), Henry II (1154), John (1199), Richard II (1377), Henry VII (1485), Henry VIII (1509), Elizabeth I (1558), James I (1603), Charles I (1625), Charles II (1660), Victoria (1837).',
      },
      {
        prompt: 'Put these periods of British history in order, earliest first.',
        items: ['Medieval', 'Tudor', 'Stuart', 'Georgian', 'Victorian', 'The 20th century'],
        direction: ['Earliest', 'Latest'],
        hint: 'The Tudors began in 1485 and Victoria became queen in 1837.',
        ex: 'Medieval (to 1485), Tudor (1485-1603), Stuart (1603-1714), Georgian (1714-1837), Victorian (1837-1901), then the 20th century.',
      },
    ],
    facts: [
      F([1, 2], 'Which of these would be an anachronism in a picture of the Battle of Hastings?', 'A soldier with a rifle', ['A knight on horseback', 'A soldier with a round shield', 'An archer with a bow'], 'Which item had not been invented in 1066?', 'Guns did not exist in 1066. Putting a rifle at Hastings is an anachronism: something from the wrong time.'),
      F([2, 3], 'Which of these would be an anachronism in a story set in Tudor England?', 'A steam train', [
        ['A printed book', 'Printing reached England in the 1470s, before the Tudors.'],
        'A wooden sailing ship',
        'A candle',
      ], 'Which of these needs the Industrial Revolution?', 'Steam trains came in the 1800s, over 200 years after the Tudors.'),
      F([2, 4], 'Which of these would be an anachronism in a scene of the Black Death in 1348?', 'A doctor giving antibiotics', [
        'A priest praying for the sick',
        'A doctor studying a urine chart',
        'People carrying sweet-smelling herbs',
      ], 'Which treatment depends on knowing about germs?', 'Antibiotics were first used in the 1900s. The other three fit 1348.'),
      F([3, 4], 'Which of these would be an anachronism in a scene of a Victorian factory?', 'A worker checking a computer screen', [
        'A steam engine driving machines',
        'Children working at the machines',
        'A factory clock and a bell',
      ], 'Which item belongs to the late 20th century?', 'Computers did not exist in the Victorian age (1837-1901).'),
      F([3, 5], 'Henry VIII and Martin Luther were contemporaries. What does this mean?', 'They were alive at the same time', ['They had the same job', 'They agreed about religion', 'They were related'], '"Con" means with, "tempor" means time.', 'Contemporaries live at the same time. Henry VIII (1491-1547) and Luther (1483-1546) did, though they disagreed about religion.'),
    ],
  },
  {
    skill: 'skills.sources',
    title: 'sources',
    terms: [
      { t: 'primary source', d: 'evidence from the time being studied' },
      { t: 'secondary source', d: 'an account made later, looking back at the past' },
      { t: 'artefact', d: 'an object made by people in the past' },
      { t: 'archive', d: 'a collection of historical documents and records' },
      { t: 'oral history', d: 'history collected by recording people’s spoken memories' },
    ],
    sorts: [
      {
        cats: ['Primary source', 'Secondary source'],
        ask: ['a primary source', 'a secondary source'],
        q: 'Is this a primary or a secondary source?',
        hint: 'Was it made at the time being studied, or later by someone looking back?',
        ex: 'Primary sources come from the time being studied; secondary sources are made later by people looking back.',
        items: [
          ['For the Battle of Hastings: the Bayeux Tapestry, made in the years after the battle', 0, 'It was made within living memory of 1066.'],
          ['For the Domesday survey: a page of the Domesday Book itself', 0],
          ['For the Blitz: a diary kept by a London teenager in 1940', 0],
          ['For the Western Front: a letter home written by a soldier in 1916', 0],
          ['For the Great Fire of London: Samuel Pepys’s diary entry from September 1666', 0],
          ['For the Black Death: a skeleton from a plague burial ground of 1348', 0, 'Archaeological remains from the time are primary evidence.'],
          ['For the suffragettes: a WSPU poster from 1910', 0],
          ['For the Tudors: a portrait of Elizabeth I painted during her reign', 0],
          ['For D-Day: a photograph taken on a Normandy beach in June 1944', 0],
          ['For the Battle of Hastings: a history textbook written in 2015', 1],
          ['For the Tudors: a TV documentary made in 2010', 1],
          ['For the Black Death: a website written by a historian today', 1],
          ['For the Industrial Revolution: a modern historian’s book about child labour', 1],
          ['For the Western Front: a film about trench warfare made in 2019', 1],
          ['For the Norman Conquest: a painting of the Battle of Hastings made in the 1800s', 1, 'It was made about 800 years after the battle.'],
          ['For medieval castles: a modern drawing of what a motte and bailey castle might have looked like', 1],
        ],
      },
    ],
    facts: [
      F([1, 2], 'What is a primary source?', 'Evidence that comes from the time being studied', [
        ['A source that is very reliable', 'Primary means "from the time", not "reliable".'],
        'The first book you read about a topic',
        'A source written by a historian today',
      ], 'Primary means first-hand, from the time.', 'Primary sources were made during the period being studied: letters, diaries, objects, photographs, official records.'),
      F([3, 5], 'A Victorian book about the Normans is a secondary source about the Normans. What could it be a primary source for?', 'What Victorians thought about the Normans', [
        'What the Normans thought about themselves',
        'Exactly what happened at Hastings',
        ['Nothing, because secondary sources can never be primary', 'Whether a source is primary depends on the question you are asking.'],
      ], 'It was made in Victorian times. Whose ideas does it show first-hand?', 'A source can be primary for one enquiry and secondary for another. The book is first-hand evidence of Victorian attitudes.'),
      F([2, 4], 'Are primary sources always more reliable than secondary sources?', 'No: a primary source can be biased, mistaken or one-sided', [
        ['Yes, because people at the time always told the truth', 'People at the time could be biased, mistaken or trying to persuade.'],
        'Yes, because they are older',
        'No, primary sources are never reliable',
      ], 'Think of a wartime poster: it is primary, but is it neutral?', 'Primary sources are valuable, but they can be biased or limited. Secondary sources can be well researched. Each must be judged on its own.'),
      F([2, 3], 'Which of these is an archaeological source?', 'Coins dug up at a Roman villa', ['A letter written by a Roman soldier', 'A history textbook about the Romans', 'A film about Roman Britain'], 'Archaeologists dig things up.', 'Archaeology studies physical remains: objects, buildings and bones found in the ground.'),
    ],
  },
  {
    skill: 'skills.inference',
    title: 'inference',
    terms: [
      { t: 'inference', d: 'something you work out from a source that it does not say directly' },
      { t: 'evidence', d: 'information from a source that supports a point' },
      { t: 'generalisation', d: 'a claim about a whole group based on only a few examples' },
    ],
    facts: [
      F([1, 2], 'What is an inference?', 'Working out something the source suggests but does not say directly', [
        ['Copying out what the source says', 'That is describing or paraphrasing, not inferring.'],
        'Guessing without any evidence',
        ['Saying who wrote the source', 'That is about provenance.'],
      ], 'Think "reading between the lines".', 'An inference goes beyond the words of the source, but it must be backed up by evidence from it.'),
      F([1, 2], 'According to Source M, what happened to Harold?', 'He was killed', ['He escaped to Norway', 'He was crowned king of Normandy', 'He made peace with William'], 'Read the last few words of the source.', 'The source ends: "and Harold was killed." This is information taken directly from the source.', SRC.chronicleHastings),
      F([2, 3], 'Which is the best inference from Source A?', 'Children in mills worked long hours and could be hurt by machines', [
        ['All factory owners were cruel to children', 'The source is about one mill. That is a generalisation it cannot support.'],
        ['The child enjoyed working at the mill', 'Nothing in the source suggests this.'],
        'Children were paid good wages in mills',
      ], 'Look at the times and what happened to the child’s fingers.', 'Six in the morning to seven at night, fines for lateness and an injury suggest long, dangerous work. You cannot infer anything about every mill from one source.', SRC.millChild),
      F([2, 4], "What can you infer from Source B about the soldier's attitude to his family?", 'He wanted to reassure his mother and stop her worrying', [
        'He was angry with his mother',
        'He wanted his mother to come to France',
        ['He thought the trenches were comfortable', 'He mentions flooding and sleeping in a hole; he is putting on a brave face.'],
      ], 'Look at what he asks her not to do.', '"Please don’t worry about me" and mentioning the cake suggest he is trying to keep his mother calm.', SRC.soldierLetter),
      F([3, 4], 'Which is a reasonable inference from Source B about the trenches?', 'Trenches could be wet, cold and uncomfortable', [
        ['Every trench was flooded all the time', 'One letter cannot tell you about every trench at every time.'],
        'Soldiers never received post from home',
        'Soldiers slept in proper beds',
      ], 'An inference must be supported, and should not claim more than the source shows.', 'Water over his boots and sleeping in a hole in the trench wall suggest wet, uncomfortable conditions. It is one letter, so we should not generalise.', SRC.soldierLetter),
      F([2, 3], 'What can you infer from Source E about why suffragettes used direct action?', 'They felt that polite campaigning had failed', [
        'They had never tried peaceful methods',
        'They did not care about the vote',
        'They wanted to stop paying taxes',
      ], 'Look at "We have asked politely for fifty years".', 'The leaflet says they asked politely for fifty years and were ignored, so they now believed action ("deeds") was needed.', SRC.suffragetteLeaflet),
      F([1, 3], 'What does Source F suggest about evacuation?', 'Children were sent away from home, sometimes far away, to live with strangers', [
        'Whole families moved together to Wales',
        'Evacuees were always unhappy and badly treated',
        'Evacuation only happened in Wales',
      ], 'Who went, and who did she live with?', 'A seven-year-old was labelled, sent by train to Wales and stayed with another family, while missing her mum.', SRC.evacuee),
      F([2, 3], 'What does Source K suggest about Britain during the Second World War?', 'Food was in short supply, and space on ships was precious', [
        'Britain grew all its own food before the war',
        'People were banned from growing vegetables',
        'Ships were no longer needed',
      ], 'Why would the government want people to grow potatoes?', 'The poster links growing food at home with saving space on ships, suggesting imports were difficult and food was scarce.', SRC.digForVictory),
      F([3, 4], 'What can you infer from Source N?', 'Rationing made some foods scarce, so people made do with substitutes', [
        'Oranges were banned by law',
        'Everyone enjoyed rationed food',
        'Shops had plenty of everything',
      ], 'Why queue for an hour? Why use dried egg?', 'Queuing for oranges and baking with dried egg suggest shortages and substitutes. "We ate every crumb" hints at how precious treats were.', SRC.rationDiary),
      F([3, 4], 'What does Source D suggest about how people explained the Black Death?', 'They did not know the real cause, so they gave different explanations', [
        'Everyone agreed that the plague was caused by fleas',
        'Nobody thought religion had anything to do with it',
        'The plague only killed a few people',
      ], 'How many explanations does the source give?', 'The writer gives two different explanations (God’s punishment and foul air), suggesting people were unsure and searching for causes.', SRC.plagueMonk),
      F([3, 5], 'What impression of soldiers does Source I give?', 'Exhausted and worn out, like old or sick people', [
        'Proud and excited to march to war',
        'Well rested and comfortable',
        'Angry with their own officers',
      ], 'Look at what Owen compares the soldiers to.', 'Owen compares young soldiers to "old beggars" and "hags", bent double and coughing, which suggests exhaustion and suffering.', SRC.owen),
      F([3, 5], 'What can you infer from Source H about conditions on slave ships?', 'They were so filthy and crowded that they were dangerous to health', [
        'The ships were clean but cramped',
        'Enslaved people were allowed to stay on deck all the time',
        'The smell only affected the crew',
      ], 'Equiano says it was "dangerous to remain there".', 'Equiano’s description of an "intolerably loathsome" stench that made the hold dangerous suggests filthy, unhealthy, overcrowded conditions.', SRC.equiano),
    ],
    reveals: [
      {
        prompt: 'What can you learn from Source A about working conditions in factories in the 1830s?',
        src: SRC.millChild,
        hint: 'Make two inferences and support each with a detail from the source.',
        model:
          'Source A suggests that children worked very long hours, because the child works from six in the morning to seven at night with only a short break. It also suggests that factory work was dangerous, because the child’s fingers were caught in a machine. Finally, the fines for being late suggest that discipline was strict. However, this is one child’s experience, so it does not prove every factory was like this.',
        checklist: ['Makes at least one inference', 'Supports each inference with a detail from the source', 'Makes a second, different inference', 'Avoids over-generalising from one source'],
      },
      {
        prompt: 'What can you learn from Source E about the suffragettes?',
        src: SRC.suffragetteLeaflet,
        hint: 'Think about their arguments and their methods. Quote briefly to support each point.',
        model:
          'Source E suggests that suffragettes thought it was unfair that women had to pay taxes and obey laws but had no vote: "Why should they have no say in making them?" It also suggests they had become frustrated with peaceful campaigning, because they had "asked politely for fifty years". The motto "Deeds, not words!" suggests they were prepared to use direct action to get attention.',
        checklist: ['Makes an inference about their arguments', 'Makes an inference about their methods', 'Uses a short quotation or detail as evidence', 'Goes beyond copying what the source says'],
      },
    ],
  },
  {
    skill: 'skills.provenance',
    title: 'provenance',
    terms: [
      { t: 'nature', d: 'what kind of source something is, such as a diary, poster or photograph' },
      { t: 'origin', d: 'who made a source, and when and where' },
      { t: 'purpose', d: 'why a source was made' },
      { t: 'audience', d: 'the people a source was made for' },
      { t: 'propaganda', d: 'information designed to persuade people, often one-sided or misleading' },
    ],
    sorts: [
      {
        cats: ['Nature', 'Origin', 'Purpose'],
        ask: ['about its nature (what kind of source it is)', 'about its origin (who made it and when)', 'about its purpose (why it was made)'],
        q: 'Is this detail about the nature, origin or purpose of the source?',
        hint: 'Nature = what kind of thing. Origin = who and when. Purpose = why.',
        ex: 'Provenance means where a source comes from: its nature, origin and purpose.',
        items: [
          ['It is a private diary', 0],
          ['It is a photograph', 0],
          ['It is a recruitment poster', 0],
          ['It is a letter', 0],
          ['It is a painted portrait', 0],
          ['It was written by a factory inspector in 1840', 1],
          ['It was written by a monk in the 1120s', 1],
          ['It was taken by a soldier on the Western Front in 1916', 1],
          ['It was written by a nurse in 1917', 1],
          ['It was made to persuade men to join the army', 2],
          ['It was written to entertain readers', 2],
          ['It was made to record what land each person held', 2],
          ['It was written to persuade Parliament to change the law', 2],
        ],
      },
    ],
    facts: [
      F([1, 2], 'What does the "origin" of a source mean?', 'Who made it, and when and where', [
        ['Why it was made', 'That is its purpose.'],
        ['What type of source it is', 'That is its nature.'],
        'How long it is',
      ], 'Origin is about where something came from.', 'Origin: who, when and where. Together with nature and purpose it makes up the provenance.'),
      F([2, 3], 'A poster made by the British government in 1915 shows a soldier pointing at the viewer. What was its most likely purpose?', 'To persuade men to join the army', [
        'To record how many soldiers had died',
        'To entertain children',
        'To criticise the war',
      ], 'Governments needed soldiers in 1915; conscription had not started.', 'Recruitment posters were designed to persuade men to volunteer. Britain did not introduce conscription until 1916.'),
      F([2, 4], 'A 1913 newspaper that opposed votes for women printed a cartoon showing a suffragette as a screaming hooligan. What was its likely purpose?', 'To mock the suffragettes and turn readers against them', [
        'To give a balanced view of the campaign',
        'To encourage women to join the suffragettes',
        'To record what suffragettes really looked like',
      ], 'Think about the newspaper’s own opinion.', 'A newspaper against votes for women would want to make suffragettes look unreasonable. Cartoons often exaggerate to persuade.'),
      F([3, 4], 'In 1832 a factory owner told Parliament that children in his mill were happy. Why should a historian be careful with this source?', 'He had a reason to make conditions sound good, to avoid new laws', [
        'Factory owners never visited their factories',
        'It was written too long after the event',
        'Parliament did not keep records',
      ], 'What did he have to lose if Parliament passed new laws?', 'Owners who testified had an interest in avoiding laws that limited child labour, so they may have painted a rosy picture.'),
      F([2, 3], 'A diary written by a London teenager during the Blitz was never meant to be read by others. Why does this matter?', 'As it was private, the writer had less reason to put on a show for readers', [
        'It means the diary must be completely accurate',
        'It means the diary is a secondary source',
        'It means the diary is useless',
      ], 'Who was the intended audience?', 'Private writing can be more honest than something written for the public, though the writer could still be mistaken or only see part of events.'),
      F([4, 5], "A soldier's letter in 1916 could be read by army officers before it was posted. How does this affect it as a source?", 'He may have left out bad news, because of censorship and to avoid worrying his family', [
        'It means everything in it must be untrue',
        'It makes it a secondary source',
        'It has no effect on the source',
      ], 'Censors could cut information. What might he avoid writing?', 'Letters were censored, and soldiers often played down dangers to protect families. Letters are useful but may not show the full picture.'),
      F([3, 5], "William of Poitiers wrote about the Norman Conquest. He was William the Conqueror's chaplain. What should a historian bear in mind?", 'He worked for William, so he was likely to show him in a good light', [
        'He must be completely reliable because he was a priest',
        'He was English, so he would criticise William',
        'He wrote 500 years later',
      ], 'Who was his employer?', 'A writer who worked for William had reasons to praise him and justify the conquest. His account needs checking against others, such as the Anglo-Saxon Chronicle.'),
    ],
  },
  {
    skill: 'skills.usefulness',
    title: 'usefulness and reliability',
    terms: [
      { t: 'bias', d: 'a one-sided view that favours one side' },
      { t: 'reliable', d: 'able to be trusted to give an accurate picture' },
      { t: 'enquiry', d: 'the question a historian is investigating' },
      { t: 'corroborate', d: 'to check a source by comparing it with other evidence that agrees' },
    ],
    facts: [
      F([2, 3], 'Why can a biased source still be useful to a historian?', 'It shows what that person or group thought, and why', [
        ['It can’t: biased sources are useless', 'Even a one-sided source is evidence of the views and aims of the people who made it.'],
        'Because bias always means the facts are right',
        'Because biased sources are always primary',
      ], 'What does propaganda tell you about the people who made it?', 'Bias limits what a source tells us about events, but it is good evidence of attitudes and aims.'),
      F([2, 4], 'Which question best helps you judge how reliable a source is?', 'Who made it, and did they have a reason to exaggerate or leave things out?', [
        'How long is it?',
        'Is it in colour?',
        ['How old is it?', 'Age alone does not make a source reliable or unreliable.'],
      ], 'Think about provenance.', 'Asking who made a source and why reveals possible bias. Reliability depends on the author, their knowledge and their purpose.'),
      F([3, 4], 'How might a historian use Source L, even though it is one-sided?', 'As evidence of how some mill owners defended child labour', [
        ['As proof that all mill children were happy', 'The owner had reasons to describe his mill favourably.'],
        'As evidence that children never worked in mills',
        'It cannot be used at all',
      ], 'What does it show about the owner’s views?', 'Source L shows the arguments owners used: that work was "light" and families needed the wages. It is useful for attitudes, less so for actual conditions.', SRC.factoryOwner),
      F([3, 4], 'Why might Source B not show the full horror of the trenches?', 'The soldier was trying not to worry his mother, and letters were censored', [
        'Soldiers were not allowed to write letters',
        'The trenches were not really unpleasant',
        'It was written many years after the war',
      ], 'Who was the letter written for?', 'He tells his mother not to worry, and letters were checked by officers, so he may have played down the danger.', SRC.soldierLetter),
      F([3, 4], 'What is one limitation of Source F as evidence about evacuation?', 'It is one person’s memory, recorded about 50 years later, so details may have faded or changed', [
        'It was written by the government as propaganda',
        'It is a secondary source written by a historian',
        'It describes evacuation in the First World War',
      ], 'When was the memory recorded?', 'Oral history gives a personal view, but memories recorded decades later can be shaped by later events, and one person’s experience may not be typical.', SRC.evacuee),
      F([4, 5], "A historian is investigating what happened when Richard II met the rebels at Smithfield in 1381. Which source would be MOST useful?", 'A chronicle written in the 1380s describing the meeting', [
        ['A Victorian painting of Wat Tyler’s death', 'It was made about 500 years later and may be dramatised.'],
        'A modern novel set in 1381',
        'A map of London drawn in 1600',
      ], 'Which source is closest in time and actually describes the event?', 'A chronicle written soon after describes the event and was produced by someone with access to accounts from the time, though it still needs checking for bias.'),
      F([4, 5], 'For an enquiry into how ordinary people felt about rationing, which source is most useful?', 'Diaries kept by people during the war', [
        ['A government poster encouraging people to accept rationing', 'A poster shows what the government wanted people to feel, not what they actually felt.'],
        'A list of weekly ration allowances',
        'A film made in 2020',
      ], 'Which source records people’s own feelings at the time?', 'Diaries record personal feelings at the time. A ration list shows what people got, not how they felt.'),
      F([3, 5], 'How reliable is the Bayeux Tapestry as an account of 1066?', 'Partly: it was made soon after, but for the Normans, so it tells the story from their side', [
        'Completely reliable, because it is a primary source',
        'Completely unreliable, because it is embroidered',
        'It is reliable because it was made by the English for Harold',
      ], 'Who was it made for?', 'The Tapestry was made within a few years of 1066, probably for William’s half-brother Bishop Odo. It is detailed but presents the Norman view, such as Harold breaking his oath.'),
    ],
    reveals: [
      {
        prompt: 'How useful is Source A for an enquiry into working conditions in factories in the 1830s?',
        src: SRC.millChild,
        hint: 'Comment on the content (what it tells you), the provenance (what it is based on), and what it leaves out. End with a judgement.',
        model:
          'Source A is useful because it gives detail about the hours (six until seven), punishments (fines) and dangers (fingers caught in a machine) that a child faced. It is based on evidence given by children to Parliament in the 1830s, so it comes from people who actually did the work. However, it is one child’s experience, and children giving evidence may have been encouraged to describe the worst conditions. It does not tell us about wages or whether all mills were like this. So it is useful for showing what conditions could be like, but should be compared with other evidence such as factory inspectors’ reports.',
        checklist: ['Uses content from the source', 'Comments on the provenance (who/when/why)', 'Explains a limitation', 'Uses own knowledge or suggests other evidence', 'Gives an overall judgement'],
      },
      {
        prompt: 'How useful is Source B for an enquiry into conditions in the trenches?',
        src: SRC.soldierLetter,
        hint: 'What does it tell you? Who wrote it, for whom, and how might that affect what he said?',
        model:
          'Source B is useful because it gives first-hand details of trench life, such as water over the soldier’s boots and sleeping in a hole dug into the side of the trench. As a letter written at the time by a soldier, it shows real experience. However, it was written to his mother and he says "please don’t worry", so he may have played down the dangers, and letters were censored. It does not mention shelling, disease or deaths. So it is useful for everyday discomfort, but probably underplays how bad conditions were.',
        checklist: ['Uses content from the source', 'Comments on the purpose or audience of the letter', 'Mentions censorship or what is left out', 'Gives an overall judgement'],
      },
      {
        prompt: 'How useful is Source F for an enquiry into the experiences of evacuees?',
        src: SRC.evacuee,
        hint: 'Think about the strengths and weaknesses of memories recorded many years later.',
        model:
          'Source F is useful because it shows one evacuee’s feelings: she was labelled and sent by train to Wales, found her hosts kind but missed her mum, and was amazed by the countryside. This shows that evacuation could be both upsetting and eye-opening. As an oral history it gives a personal view that official records do not. However, it was recorded about 50 years later, so some details may have been forgotten or changed, and her experience was positive; other evacuees were treated badly. It is useful but needs to be compared with other evacuees’ accounts.',
        checklist: ['Uses detail from the source', 'Identifies a strength of oral history', 'Identifies a weakness (memory, one person)', 'Gives an overall judgement'],
      },
    ],
  },
  {
    skill: 'skills.interpretations',
    title: 'interpretations',
    terms: [
      { t: 'interpretation', d: 'a historian’s view or explanation of the past' },
      { t: 'historiography', d: 'the study of how historians’ views of the past have changed' },
      { t: 'revisionist', d: 'a historian who challenges the accepted view of an event' },
    ],
    facts: [
      F([1, 2], 'What is a historical interpretation?', "A historian's view or explanation of the past, made later", [
        ['A primary source from the time', 'An interpretation is made later, looking back.'],
        'A translation of a source into English',
        'A list of dates',
      ], 'Interpretations are opinions backed by evidence.', 'An interpretation is a view of the past put forward by a historian, writer or film-maker, based on evidence.'),
      F([2, 3], "Why do historians' interpretations of the same event often differ?", 'They use different sources, ask different questions and are influenced by their own time', [
        'One of them is always lying',
        'The past keeps changing',
        'Historians do not use sources',
      ], 'Think about evidence, questions and the time a historian lives in.', 'Interpretations differ because of the evidence used, the questions asked and the values of the time when they were written.'),
      F([2, 4], 'How do Interpretations A and B differ about Oliver Cromwell?', 'A sees him as a cruel dictator; B sees him as a man of faith protecting the nation', [
        'A praises him and B criticises him',
        'They both say he was a dictator',
        'They disagree about when he was born',
      ], 'Look for the key judgement words in each.', 'A focuses on closing Parliament and cruelty in Ireland. B focuses on religious freedom for Protestants and his refusal of the crown.', CROMWELL_PAIR),
      F([3, 4], 'Which piece of evidence would SUPPORT Interpretation A about Cromwell?', 'Cromwell used soldiers to close the Rump Parliament in 1653', [
        ['Cromwell refused the crown in 1657', 'This would support Interpretation B, not A.'],
        ['Cromwell allowed more freedom of worship to Protestants', 'This supports Interpretation B.'],
        'Cromwell was a Member of Parliament before the war',
      ], 'Interpretation A says he was a military dictator.', 'Closing Parliament by force fits A’s view of a dictator. Refusing the crown and religious toleration fit B.', CROMWELL_PAIR),
      F([3, 4], 'Why might books written in the 1960s be especially critical of General Haig?', 'By then many people saw the war as a tragic waste of life, shaped by war poetry and memoirs', [
        'Haig was still alive and could not be criticised before then',
        'No sources about the Somme existed before the 1960s',
        'The 1960s historians had fought at the Somme as generals',
      ], 'Interpretations are shaped by the time they are written in.', 'In the 1960s, war poets like Wilfred Owen were widely read, and many saw the generals as uncaring. Later historians used new research to argue the army learned and improved.', HAIG_PAIR),
      F([4, 5], 'Which evidence would best support Interpretation B about Haig?', 'By 1918 the British army was combining tanks, aircraft, artillery and infantry far more effectively', [
        ['About 57,000 British casualties on the first day of the Somme', 'This supports Interpretation A.'],
        'The Somme went on for over four months',
        'Haig was a cavalry officer',
      ], 'Interpretation B says the army learned and was winning by 1918.', 'Improved tactics in 1918, during the battles that ended the war, support the idea that the army learned. Huge losses at the Somme support A.', HAIG_PAIR),
      F([3, 5], 'Interpretation A focuses on British campaigners. What does Interpretation B add?', "The importance of enslaved people's own resistance", [
        'The role of the Royal Navy in protecting slave ships',
        'That the slave trade never ended',
        'That abolition happened in 1700',
      ], 'Whose actions does B focus on?', 'B argues that resistance by enslaved people, such as the revolution in Saint-Domingue (Haiti), made slavery dangerous and costly. Many historians today combine both views.', ABOLITION_PAIR),
    ],
    reveals: [
      {
        prompt: 'Interpretation A says Cromwell was a military dictator. How far do you agree?',
        src: CROMWELL_PAIR,
        hint: 'Use evidence for and against A (you can use B). End with a clear judgement.',
        model:
          'There is evidence to support Interpretation A. Cromwell used soldiers to close the Rump Parliament in 1653 and ruled as Lord Protector, with the country divided into regions run by army major-generals. His army also killed many people at Drogheda in Ireland in 1649. However, Interpretation B shows another side. Cromwell refused the crown when Parliament offered it, and he allowed more religious freedom to Protestants than earlier rulers. Overall I partly agree: he relied on the army and acted like a dictator at times, but he did not try to make himself king.',
        checklist: ['Uses evidence that supports A', 'Uses evidence that challenges A', 'Uses specific own knowledge (dates, events)', 'Reaches a clear judgement about "how far"'],
      },
      {
        prompt: 'Why might historians have different interpretations of General Haig?',
        src: HAIG_PAIR,
        hint: 'Think about evidence, the time each view was written, and what each historian focuses on.',
        model:
          'Historians disagree about Haig because they focus on different evidence. Those who call him a "butcher" focus on the Somme, where the British suffered about 57,000 casualties on the first day and Haig kept attacking for months. Others focus on 1918, when the British army used tanks, aircraft and artillery together and helped win the war. Interpretations are also shaped by when they were written: in the 1960s many people saw the war as a pointless waste, while later historians studied army records and argued that Haig faced an impossible new kind of war.',
        checklist: ['Explains that historians use or focus on different evidence', 'Gives specific evidence for one view', 'Gives specific evidence for the other view', 'Explains how the time of writing shapes an interpretation'],
      },
    ],
  },
  {
    skill: 'skills.causation',
    title: 'causation',
    terms: [
      { t: 'long-term cause', d: 'a reason that built up over many years before an event' },
      { t: 'short-term cause', d: 'a reason that arose shortly before an event' },
      { t: 'trigger', d: 'the event that finally sets something off' },
      { t: 'motive', d: 'the reason a person chooses to act' },
      { t: 'economic cause', d: 'a cause to do with money, trade or jobs' },
      { t: 'political cause', d: 'a cause to do with power and government' },
      { t: 'religious cause', d: 'a cause to do with beliefs and the Church' },
    ],
    sorts: [
      {
        cats: ['Long-term cause', 'Short-term cause or trigger'],
        ask: ['a long-term cause', 'a short-term cause or trigger'],
        q: 'Is this a long-term cause, or a short-term cause or trigger?',
        hint: 'Did it build up over years, or happen just before the event?',
        ex: 'Long-term causes build up over years; short-term causes and triggers come just before and set the event off.',
        items: [
          ['First World War: rivalry between the great powers over empires', 0],
          ['First World War: two armed alliance systems built up over decades', 0],
          ['First World War: the assassination of Archduke Franz Ferdinand in June 1914', 1],
          ["Peasants' Revolt: anger at serfdom and low wages since the Black Death", 0],
          ["Peasants' Revolt: the new poll tax of 1380", 1],
          ['English Civil War: arguments between kings and Parliament over money and power going back decades', 0],
          ['English Civil War: Charles I trying to arrest five MPs in January 1642', 1],
          ['Second World War: German anger at the Treaty of Versailles', 0],
          ['Second World War: Germany invading Poland in September 1939', 1],
          ['Break with Rome: Henry VIII wanting his marriage to Catherine of Aragon ended', 1],
          ['Break with Rome: growing criticism of the wealth of the Church across Europe', 0],
        ],
      },
      {
        cats: ['Economic', 'Political', 'Religious'],
        ask: ['an economic cause', 'a political cause', 'a religious cause'],
        q: 'What type of cause is this?',
        hint: 'Economic = money and trade. Political = power and government. Religious = beliefs and the Church.',
        ex: 'Sorting causes by type helps you see patterns and explain how causes link together.',
        items: [
          ['Food prices rose while wages stayed low', 0],
          ['Merchants were making huge profits from sugar', 0],
          ['A new factory needed thousands of workers', 0],
          ['The king refused to let Parliament meet', 1],
          ['Two powerful families fought over who should be king', 1],
          ['A treaty took away the country’s land and limited its army', 1],
          ['Catholics and Protestants disagreed about how to worship', 2],
          ['The Pope excommunicated the queen', 2],
          ['The king tried to force a new prayer book on Scotland', 2],
        ],
      },
    ],
    facts: [
      F([3, 4], "When explaining which cause was most important, what's the best approach?", 'Explain how it led to the event and how the other causes depended on it', [
        'Write about it first and say nothing else',
        'Choose the cause with the most dates',
        ['Always choose the cause that happened last', 'The trigger is not always the most important cause.'],
      ], 'A strong answer links causes together.', 'Show how your main cause made the event likely, and how other causes connected to it. Without the long-term causes, a trigger might not have mattered.'),
      F([3, 5], 'Why do historians say the assassination of Franz Ferdinand was a trigger rather than the only cause of the First World War?', 'Without the alliances and rivalries already in place, one killing would not have led to a world war', [
        'Because Franz Ferdinand was not really killed',
        'Because it happened after the war had started',
        'Because the killer was British',
      ], 'Why did a murder in the Balkans drag in Britain, France and Russia?', 'The assassination set things off, but the alliances, the arms race and imperial rivalry turned a local crisis into a world war.'),
    ],
  },
  {
    skill: 'skills.consequence',
    title: 'cause and consequence',
    terms: [
      { t: 'consequence', d: 'a result of an event or action' },
      { t: 'intended consequence', d: 'a result that people planned or wanted' },
      { t: 'unintended consequence', d: 'a result that people did not plan or expect' },
    ],
    links: [
      { c: 'William won the Battle of Hastings', e: 'Norman lords replaced the Anglo-Saxon nobles' },
      { c: 'Henry VIII wanted to end his marriage to Catherine of Aragon', e: 'England broke away from the Roman Catholic Church' },
      { c: 'The Great Fire of London destroyed much of the city in 1666', e: 'London was rebuilt with more brick and stone' },
      { c: 'Cholera outbreaks killed thousands in crowded towns', e: 'Governments began to pass public health laws' },
      { c: 'Germany invaded Belgium in 1914', e: 'Britain declared war on Germany' },
    ],
    sorts: [
      {
        cats: ['Short-term consequence', 'Long-term consequence'],
        ask: ['a short-term consequence', 'a long-term consequence'],
        q: 'Is this a short-term or a long-term consequence?',
        hint: 'Did it happen straight away, or over many years or generations?',
        ex: 'Short-term consequences happen soon after an event; long-term ones unfold over years or generations.',
        items: [
          ['Black Death: in 1349 many villages had too few people to bring in the harvest', 0],
          ['Black Death: over the next century, serfdom slowly died out', 1],
          ['Hastings: William was crowned king on Christmas Day 1066', 0],
          ['Hastings: the English language took in thousands of French words over the following centuries', 1],
          ['Gunpowder Plot: the plotters were arrested and executed', 0],
          ['Gunpowder Plot: Bonfire Night is still celebrated every 5 November', 1],
          ['Great Fire of London: thousands of people were left homeless in 1666', 0],
          ['Magna Carta: its ideas about the law limiting rulers were used in later centuries', 1],
        ],
      },
    ],
    facts: [
      F([3, 4], 'The Treaty of Versailles was meant to keep Germany weak. Which was an UNINTENDED consequence?', 'Anger in Germany that Hitler later used to win support', [
        ["Germany's army was limited to 100,000 men", 'That was intended: it was a term of the treaty.'],
        ['Germany had to pay reparations', 'That was intended: it was a term of the treaty.'],
        'Germany lost its colonies',
      ], 'Which result did the peacemakers not want?', 'The treaty’s terms were intended. The bitterness it caused in Germany, which helped Hitler, was not.'),
      F([2, 4], 'The poll tax of 1380 was meant to raise money for war. What was its unintended consequence?', "It sparked the Peasants' Revolt", [
        'It ended the war with France at once',
        'It paid for the Domesday survey',
        'It made the king more popular',
      ], 'What happened when tax collectors arrived in Essex in 1381?', 'The government wanted money; instead the tax helped trigger the biggest rising of the Middle Ages.'),
      F([4, 5], "Charles I tried to force a new prayer book on Scotland in 1637. What was the unintended consequence?", 'The Scots rebelled, and Charles had to recall Parliament to raise money for war', [
        'Scotland became Catholic',
        'Charles was crowned King of France',
        'Parliament was abolished',
      ], 'Wars cost money. Who did Charles need to ask for it?', 'The Scots rebelled. To pay for the war Charles had to recall Parliament in 1640, which used the chance to attack his rule, leading towards civil war.'),
    ],
  },
  {
    skill: 'skills.change-continuity',
    title: 'change and continuity',
    terms: [
      { t: 'change', d: 'when things become different from before' },
      { t: 'continuity', d: 'when things stay the same over time' },
      { t: 'turning point', d: 'a moment that causes a big change in direction' },
      { t: 'progress', d: 'change that makes things better' },
      { t: 'regression', d: 'change that makes things worse' },
      { t: 'trend', d: 'a general direction of change over time' },
    ],
    sorts: [
      {
        cats: ['Change', 'Continuity'],
        ask: ['an example of change', 'an example of continuity'],
        q: 'Is this an example of change or of continuity?',
        hint: 'Did things become different, or stay the same?',
        ex: 'Historians look for both: what changed, and what stayed the same.',
        items: [
          ['After 1066, the kings of England were Norman, not Anglo-Saxon', 0],
          ['After 1066, most English people were still farmers living in villages', 1],
          ['After the break with Rome, the monarch, not the Pope, was head of the Church in England', 0],
          ['After 1348, doctors still believed in the four humours', 1],
          ['In the 1800s, millions of people moved from the countryside into towns', 0],
          ['Between 1918 and 1928, the voting age for women fell from 30 to 21', 0],
          ['Throughout the Middle Ages, the Church was at the centre of village life', 1],
          ['During the Tudor period, most people still lived in the countryside', 1],
          ['In 1948, the NHS made healthcare free at the point of use', 0],
        ],
      },
    ],
    facts: [
      F([3, 4], 'What makes an event a turning point?', 'It causes a big, lasting change in direction', [
        'It happens in the middle of a century',
        'It is very famous',
        'It is the last event in a period',
      ], 'Think of a road that suddenly heads a new way.', 'A turning point changes the direction of history in a significant and lasting way, such as the break with Rome.'),
      F([3, 5], 'Does change always mean progress?', 'No: some changes made life worse for some people', [
        'Yes: every change is an improvement',
        'Yes: but only after 1900',
        'No: nothing ever changes',
      ], 'Think of the Industrial Revolution: better for whom?', 'Change can be progress or regression. The Industrial Revolution brought new wealth, but also dangerous factories and crowded, unhealthy towns.'),
      F([2, 3], 'Which of these is an example of continuity?', 'Between 1066 and 1500, farming was the main job of most people', [
        'In 1066 a Norman king replaced an Anglo-Saxon king',
        'In 1534 the monarch became head of the Church in England',
        'In 1928 all women over 21 gained the vote',
      ], 'Continuity means staying the same.', 'Through the Middle Ages most people kept farming the land, even while rulers changed.'),
    ],
  },
  {
    skill: 'skills.significance',
    title: 'significance',
    terms: [
      { t: 'significance', d: 'how important something was, judged by its effects or what it reveals' },
      { t: 'commemorate', d: 'to remember an event or person officially, for example with a memorial or a ceremony' },
      { t: 'legacy', d: 'something that remains from the past and still affects people later' },
    ],
    facts: [
      F([1, 2], "When historians call an event 'significant', what do they mean?", 'It had important effects or tells us something important, so it matters', [
        'It happened a very long time ago',
        'It involved a king or queen',
        'It was in the newspapers',
      ], 'Significance is about importance, not age or fame.', 'An event is significant if it changed things, affected many people deeply or for a long time, or reveals something important.'),
      F([2, 3], 'Which question best helps you judge the significance of an event?', 'How many people did it affect, and how deeply?', ['What colour was the flag?', 'What day of the week was it?', 'How long is its name?'], 'Significance criteria are about effects.', 'Useful criteria include scale (how many), depth (how deeply), duration (how long) and relevance today.'),
      F([3, 4], 'Which piece of evidence best shows the SCALE of the Black Death?', 'Between a third and a half of England’s population died', [
        ['Doctors still believed in the four humours afterwards', 'This is about continuity, not scale.'],
        'People carried herbs to ward off bad air',
        'Some villages were later deserted',
      ], 'Scale means how many people were affected.', 'Scale is about numbers: the death of a third to a half of the population shows the enormous scale.'),
      F([3, 4], 'Which piece of evidence best shows that the First World War is still REMEMBERED today?', 'Every November people wear poppies and hold a two-minute silence', [
        ['Around 57,000 British casualties on the first day of the Somme', 'This shows scale, not remembrance.'],
        'Tanks were first used in 1916',
        'The war ended with an armistice in 1918',
      ], 'Think about commemoration.', 'Remembrance Sunday, poppies and war memorials show the war is still commemorated, one sign of significance.'),
      F([3, 5], 'Which piece of evidence best shows that Magna Carta’s effects LASTED a long time?', 'Its ideas about rulers obeying the law were used in arguments centuries later', [
        'John agreed to it at Runnymede in 1215',
        'The Pope cancelled it within months',
        'It was written in Latin',
      ], 'Duration means how long its effects continued.', 'Magna Carta was cancelled at first, but its ideas were reissued and quoted for centuries, which shows lasting significance.'),
      F([4, 5], 'Why might a historian argue the creation of the NHS in 1948 was highly significant?', 'It affected almost everyone, changed lives deeply and still exists today', [
        'It was the first time doctors existed in Britain',
        'It only affected a few rich people',
        'It ended the Second World War',
      ], 'Think about scale, depth and duration together.', 'The NHS gave everyone healthcare free at the point of use. It affected the whole population, changed lives deeply and is still part of life today.'),
    ],
    reveals: [
      {
        prompt: 'How significant was the Black Death? Use at least two criteria in your answer.',
        hint: 'Criteria could be scale (how many), depth (how deeply), duration (how long the effects lasted) or what it reveals.',
        model:
          'The Black Death was highly significant. In terms of scale, it killed between a third and a half of England’s population in 1348-1350, so almost every family was affected. It was also significant in the long term: with fewer workers, survivors could demand higher wages, and when the government tried to stop this with the Statute of Labourers, anger grew that helped cause the Peasants’ Revolt in 1381. Over the next century serfdom slowly died out. It also reveals how little people understood about disease, as they blamed God or bad air.',
        checklist: ['Names at least two criteria', 'Uses evidence for each criterion', 'Explains a long-term effect', 'Reaches a judgement about how significant it was'],
      },
    ],
  },
]
