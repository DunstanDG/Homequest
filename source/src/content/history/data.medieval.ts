import { passage } from '../kit'
import { SRC } from './sources'
import { E, F, type Topic } from './types'

/** Medieval Britain, 1066-1485 (Year 7). */
export const MEDIEVAL: Topic[] = [
  // ------------------------------------------------------------------ 1066 claimants
  {
    skill: 'medieval.claimants',
    title: 'the succession crisis of 1066',
    people: [
      { n: 'Harold Godwinson', did: 'was the Earl of Wessex, crowned king the day after Edward the Confessor died' },
      { n: 'Harald Hardrada', did: 'was the Viking King of Norway who invaded the north of England in September 1066' },
      { n: 'William of Normandy', did: 'was the Duke of Normandy who said Edward the Confessor had promised him the throne' },
      { n: 'Edgar Atheling', did: 'was the young great-nephew of Edward the Confessor, with the closest claim by blood' },
      { n: 'Edward the Confessor', did: 'was the king whose death without children in January 1066 caused the succession crisis' },
      { n: 'Tostig Godwinson', did: "was Harold's exiled brother, who joined the Norwegian invasion" },
    ],
    terms: [
      { t: 'succession crisis', d: 'a dispute over who should be the next ruler' },
      { t: 'Witan', d: 'the council of powerful Anglo-Saxon nobles and churchmen who advised the king and helped choose a new one' },
      { t: 'earl', d: 'a powerful Anglo-Saxon noble who ran a large region for the king' },
      { t: 'claimant', d: 'someone who says they have a right to something, such as the throne' },
      { t: 'heir', d: 'the person who is due to inherit a title or the throne' },
    ],
    facts: [
      F([1, 2], 'Why was there a succession crisis in England in 1066?', 'Edward the Confessor died without any children', [
        ['William had already conquered England', 'The conquest came later in 1066, as a result of the crisis.'],
        ['Harold Godwinson had been killed in battle', 'Harold was killed at Hastings in October 1066, after the crisis began.'],
        'The Pope had removed Edward from the throne',
      ], 'Think about what a king normally needs so that it is clear who rules next.', 'Edward the Confessor died in January 1066 with no children, so there was no obvious heir and several men claimed the throne.'),
      F([2, 3], 'Which claimant was chosen by the Witan and crowned king in January 1066?', 'Harold Godwinson', [
        ['William of Normandy', 'William was not crowned until Christmas Day 1066, after winning at Hastings.'],
        ['Harald Hardrada', 'Hardrada was King of Norway. He invaded in September 1066 but never ruled England.'],
        ['Edgar Atheling', 'Edgar had a strong blood claim but was young, and the Witan passed him over.'],
      ], 'The Witan were English nobles. Which claimant was the most powerful Englishman?', 'The Witan chose Harold Godwinson, Earl of Wessex, and he was crowned the day after Edward died.'),
      F([2, 4], 'William of Normandy said Harold Godwinson had sworn an oath to him. What did William say Harold had promised?', "To support William's claim to the English throne", [
        'To give William half of England',
        'To pay William a yearly tax',
        ['To help William invade Norway', 'Norway was Harald Hardrada’s kingdom; this has nothing to do with the oath.'],
      ], 'The Bayeux Tapestry shows Harold swearing an oath on holy relics while in Normandy.', "Norman sources say Harold swore on holy relics to support William's claim. English sources say little about it, and Harold may have had no real choice."),
      F([3, 4], "Harold's supporters said Edward the Confessor named Harold as his successor on his deathbed. Why was this a strong argument?", "A dying king's wish carried great weight, and the Witan backed Harold", [
        ['Edward was Harold’s father', 'Edward was Harold’s brother-in-law: he had married Harold’s sister Edith.'],
        'The Pope had already crowned Harold',
        'Harold was the only claimant who spoke English',
      ], 'Think about who chose the king in Anglo-Saxon England and what they listened to.', "In Anglo-Saxon England a dying king's wishes mattered, and the Witan had the right to choose. Both supported Harold."),
      F([3, 5], 'Which claimant was most closely related by blood to Edward the Confessor?', 'Edgar Atheling', [
        ['Harold Godwinson', 'Harold was related only by marriage: he was Edward’s brother-in-law.'],
        ['William of Normandy', 'William was a more distant relative: Edward’s mother was William’s great-aunt.'],
        ['Harald Hardrada', 'Hardrada had no blood link; his claim came from a deal made by earlier kings.'],
      ], 'Look for the claimant from the old English royal family.', "Edgar Atheling was Edward's great-nephew, the last male of the old English royal family. Blood mattered, but so did power and support."),
      F([4, 5], 'Why was Edgar Atheling passed over for the throne in January 1066?', 'He was young and had little power or military experience at a dangerous time', [
        ['He was not related to Edward', 'He was Edward’s great-nephew, the closest blood relative.'],
        'He was Norwegian',
        'He had already been crowned in Normandy',
      ], 'England was expecting invasions. What would the Witan want in a king?', 'With invasions likely, the Witan wanted an experienced, powerful leader. Edgar was a teenager with no army of his own, so they chose Harold.'),
      F([3, 4], "Why did Harold Godwinson's position as Earl of Wessex make his claim strong?", 'He was the richest and most powerful noble in England, with land and soldiers', [
        "It made him the Pope's representative in England",
        ['It made him Edward’s son', 'Harold was Edward’s brother-in-law, not his son.'],
        'It gave him a claim to Normandy as well',
      ], 'Think about what an earl controlled.', 'As Earl of Wessex, Harold controlled huge lands and could raise an army. He had also been the leading noble at court.'),
      F([2, 3], "Which claimant had the Pope's support for his invasion?", 'William of Normandy', [
        ['Harold Godwinson', 'Harold was crowned in England without the Pope’s backing.'],
        ['Harald Hardrada', 'Hardrada did not have the Pope’s support.'],
        'Edgar Atheling',
      ], 'This claimant said Harold had broken a holy oath.', "William won the Pope's support, which let him present his invasion as a just cause. He is said to have carried a banner sent by the Pope."),
    ],
    reveals: [
      {
        prompt: 'Explain why there was a crisis over who should rule England in 1066.',
        hint: 'Start with what happened in January 1066, then explain why more than one man thought he should be king.',
        model:
          "There was a crisis because Edward the Confessor died in January 1066 without any children, so there was no obvious heir. Several powerful men claimed the throne for different reasons. Harold Godwinson was the most powerful earl and said Edward named him as he died, so the Witan crowned him. But William of Normandy said Edward had promised him the throne and that Harold had sworn an oath to support him, and Harald Hardrada of Norway claimed it through a deal made by earlier kings. Because each claimant had an army and a reason, the crisis could only be settled by fighting.",
        checklist: ['Says Edward died without an heir', 'Names at least two claimants', 'Explains the reason behind at least one claim', 'Explains why this led to conflict, not just a list of names'],
      },
      {
        prompt: 'Who had the best claim to the English throne in 1066? Give reasons for your answer.',
        hint: 'Pick one claimant, then compare him with at least one other. Think about blood, promises, the Witan and power.',
        model:
          "I think Harold Godwinson had the best claim. He was chosen by the Witan, which was the English way of choosing a king, and he said Edward named him on his deathbed. He was also the most powerful earl, so he could defend England. William said Edward had promised him the throne and that Harold swore an oath, but this promise was made years earlier and Harold may have been forced to swear. Edgar had the closest blood claim, but he was young and had no army at a dangerous time.",
        checklist: ['Makes a clear judgement', 'Supports it with at least two reasons', 'Compares with at least one other claimant', 'Uses specific detail, such as the Witan, the oath or blood relationship'],
      },
    ],
  },

  // ------------------------------------------------------------------ battles of 1066
  {
    skill: 'medieval.battles-1066',
    title: 'the battles of 1066',
    events: [E(1066, 'William of Normandy defeats Harold Godwinson at the Battle of Hastings', { key: true, note: 'on 14 October' })],
    seqs: [
      {
        prompt: 'Put these events of 1066 in the order they happened.',
        items: [
          'Edward the Confessor dies',
          'Harold Godwinson is crowned king',
          'Harald Hardrada and Tostig land in the north of England',
          'Northern English earls are defeated at the Battle of Fulford',
          'Harold defeats Hardrada at the Battle of Stamford Bridge',
          'William lands at Pevensey on the south coast',
          'The Battle of Hastings',
          'William is crowned king in Westminster Abbey',
        ],
        direction: ['January', 'December'],
        hint: 'Harold had to fight in the north before he could march south to face William.',
        ex: 'Edward died in January; Harold was crowned the next day. Hardrada landed in September, won at Fulford (20 September) and lost at Stamford Bridge (25 September). William landed on 28 September, won at Hastings on 14 October and was crowned on Christmas Day.',
      },
      {
        prompt: 'Put these stages of the Battle of Hastings in order.',
        items: [
          'The English form a shield wall along the top of a ridge',
          'Norman archers and foot soldiers attack but cannot break the shield wall',
          'Some Normans retreat and English soldiers chase them down the hill',
          'The Normans use pretend retreats to draw more English off the ridge',
          'Harold is killed',
          'The remaining English flee',
        ],
        direction: ['Start of the day', 'End of the day'],
        hint: 'The English held a strong position at first. What had to happen before it could be broken?',
        ex: 'The shield wall held at first. When some English chased retreating Normans, the line weakened; the Normans then used pretend retreats. Late in the day Harold was killed and the English fled.',
      },
    ],
    terms: [
      { t: 'shield wall', d: 'a tight line of soldiers holding overlapping shields' },
      { t: 'fyrd', d: 'the part-time Anglo-Saxon army of ordinary men called up to fight' },
      { t: 'housecarls', d: 'the full-time, professional soldiers who guarded an Anglo-Saxon king or earl' },
      { t: 'cavalry', d: 'soldiers who fight on horseback' },
      { t: 'feigned retreat', d: 'pretending to run away to trick the enemy into chasing you' },
    ],
    facts: [
      F([1, 2], 'Where did Harold Godwinson defeat Harald Hardrada in September 1066?', 'Stamford Bridge', [
        ['Hastings', 'Hastings was where Harold was defeated by William, about three weeks later.'],
        ['Fulford', 'At Fulford the northern earls were beaten by Hardrada. Harold was not there.'],
        ['Pevensey', 'Pevensey is where William landed; there was no battle there.'],
      ], 'It was near York, in the north.', 'Harold marched north very fast and surprised the Norwegians at Stamford Bridge, near York, on 25 September 1066. Hardrada and Tostig were killed.'),
      F([1, 2], 'Who won the Battle of Hastings in 1066?', 'William of Normandy', [
        ['Harold Godwinson', 'Harold was killed at Hastings.'],
        ['Harald Hardrada', 'Hardrada was not at Hastings: he had already been killed at Stamford Bridge.'],
        'Edgar Atheling',
      ], 'The winner became known as "the Conqueror".', 'William of Normandy won at Hastings on 14 October 1066 and was crowned king on Christmas Day.'),
      F([1, 3], 'Which claimant was killed at the Battle of Stamford Bridge?', 'Harald Hardrada', [
        ['William of Normandy', 'William was not at Stamford Bridge; he landed in the south three days later.'],
        ['Harold Godwinson', 'Harold won at Stamford Bridge. He was killed later, at Hastings.'],
        'Edgar Atheling',
      ], 'Stamford Bridge was a battle against the Norwegian invasion.', 'Harald Hardrada, King of Norway, was killed at Stamford Bridge with Tostig. Students sometimes mix him up with William, who won at Hastings.'),
      F([2, 3], 'Why was William able to land on the south coast without being attacked?', "Harold and his army were in the north, dealing with Hardrada's invasion", [
        'The English had no army at all',
        'Harold had invited William to land',
        ['The English navy had joined William', 'There was no English navy on William’s side.'],
      ], 'Think about where Harold was in late September 1066.', "William landed at Pevensey on 28 September, three days after Stamford Bridge. Harold was far away in the north, so nobody stopped the landing."),
      F([3, 4], 'Why did the Normans pretending to retreat help them win at Hastings?', 'English soldiers broke ranks to chase them, weakening the shield wall', [
        'It made the Norman archers run out of arrows',
        'It tricked Harold into going back to London',
        'It let the Normans capture the English ships',
      ], 'What made the English position so strong at first?', 'The shield wall was very hard to break while it held together. When English soldiers ran downhill after "retreating" Normans, they could be surrounded, and the wall grew weaker.'),
      F([3, 5], 'Which is the best reason the English army was at a disadvantage at Hastings?', 'Many had fought at Stamford Bridge and then marched hundreds of miles south', [
        ['They were fighting on low, marshy ground below the Normans', 'No: the English held the higher ground on a ridge, which was an advantage for them.'],
        'They had no weapons or armour',
        'They were led by Harald Hardrada',
      ], 'Think about what Harold had been doing in the three weeks before the battle.', 'Harold had fought one big battle and then marched south very quickly. Some of his soldiers were tired, and he did not wait to gather all the troops he could.'),
      F([3, 5], 'How did Harold Godwinson die at the Battle of Hastings?', 'We are not certain: he may have been hit by an arrow, or cut down by knights', [
        ['He was definitely shot through the eye by an arrow', 'This is the famous story, but the Bayeux Tapestry is hard to interpret and other sources describe him being killed by knights.'],
        'He escaped and lived in Normandy',
        'He drowned in a river after the battle',
      ], 'Historians disagree because the sources disagree.', 'The Bayeux Tapestry may show Harold with an arrow near his eye, but it is unclear, and another early account says knights cut him down. Historians are not certain.'),
      F([2, 3], 'Which type of soldier did William have that Harold’s army mostly lacked?', 'Mounted knights (cavalry)', [
        'Foot soldiers with axes',
        'Soldiers with shields',
        'Soldiers with spears',
      ], 'Harold’s men fought on foot. What did the Normans ride?', 'The Normans had knights on horseback as well as archers and foot soldiers. The English fought on foot behind their shield wall.'),
      F([4, 5], "Historians often say Harold hurried to fight William partly because the Normans were raiding the land around Hastings. Why would this push Harold to act quickly?", 'As king he was expected to protect his people, and the raids were on land he knew well', [
        'He wanted to reach Normandy before William returned',
        'The raids meant William was running away',
        'He had promised the Pope he would fight on that day',
      ], 'What does a new king need to show his people?', 'Harold had only been king for a few months. Letting the Normans burn villages in Sussex would make him look weak, so he marched quickly rather than waiting for more soldiers.'),
    ],
    reveals: [
      {
        prompt: 'Explain why William won the Battle of Hastings.',
        hint: 'Think about Harold’s problems, William’s army and tactics, and luck. Then say which mattered most.',
        model:
          "One reason William won is that Harold's army was tired: they had fought at Stamford Bridge and then marched hundreds of miles south, and Harold did not wait to gather more men. Another reason is William's army and tactics. He had knights on horseback and archers, and the feigned retreats tricked English soldiers into leaving the shield wall, which weakened it. Luck also helped, because the wind delayed William's crossing until Harold was in the north. The most important reason was probably Harold's death late in the day, because the English lost their leader and fled.",
        checklist: ['Gives at least two reasons', 'Includes a reason linked to Harold’s problems', 'Includes a reason linked to William’s army or tactics', 'Uses specific detail (places, tactics, events)', 'Says which reason mattered most, or links reasons together'],
      },
      {
        prompt: 'Describe two features of the Battle of Stamford Bridge (September 1066).',
        hint: 'A feature is something that happened or was true about the battle. Give two, each with a supporting detail.',
        model:
          'One feature was surprise. Harold marched north from London very quickly and caught the Norwegian army by surprise near York; some of them had left their armour behind. A second feature was that it was a decisive English victory. Harald Hardrada and Harold’s brother Tostig were both killed, and so many Norwegians died that only a small part of their fleet was needed to take the survivors home.',
        checklist: ['Identifies one feature', 'Gives a supporting detail for the first feature', 'Identifies a second, different feature', 'Gives a supporting detail for the second feature'],
      },
    ],
  },

  // ------------------------------------------------------------------ Norman control
  {
    skill: 'medieval.norman-control',
    title: 'Norman England',
    events: [
      E(1066, 'William of Normandy is crowned king on Christmas Day', { key: true }),
      E(1069, 'William begins the Harrying of the North', { note: 'over the winter of 1069 to 1070' }),
      E(1070, "Hereward the Wake's rebellion in the Fens begins"),
      E(1085, 'William orders the Domesday survey', { note: 'at Christmas, in Gloucester' }),
      E(1086, 'The Domesday survey is carried out', { key: true }),
      E(1087, 'William the Conqueror dies', { note: 'his son William II, known as Rufus, became king' }),
    ],
    people: [
      { n: 'Hereward the Wake', did: 'led a rebellion against the Normans from the Isle of Ely in the Fens' },
      { n: 'Odo of Bayeux', did: "was William's half-brother, a bishop who helped govern England" },
      { n: 'Orderic Vitalis', did: 'was a monk who later wrote a critical account of the Harrying of the North' },
    ],
    terms: [
      { t: 'harrying', d: 'laying waste to land by burning and destroying' },
      { t: 'rebellion', d: 'an armed rising against a ruler' },
      { t: 'survey', d: 'a careful inspection and record of land and property' },
      { t: 'thegn', d: 'a lower-ranking Anglo-Saxon lord, below an earl, who held land in return for military service' },
    ],
    facts: [
      F([1, 2], 'What was the Domesday Book?', 'A record of who owned land and property across most of England', [
        'A list of everyone who died in the Black Death',
        ['A book of Norman laws', 'Domesday recorded land and resources, not laws.'],
        'A diary written by William the Conqueror',
      ], 'It was made in 1086, twenty years after the Conquest.', 'The Domesday Book recorded land, people, animals and resources in most of England in 1086, and who held them.'),
      F([2, 3], 'Why did William order the Domesday survey?', 'To find out what people owned, so he knew how much tax he could collect', [
        'To count how many soldiers had died at Hastings',
        'To decide which castles to knock down',
        ['To record the name of every person in England', 'Most ordinary people were counted, not named.'],
      ], 'Think about what a king needs to pay for an army.', 'William wanted to know the value of the land so he could tax it and know what each lord held. A Danish invasion threat in 1085 made this urgent.'),
      F([2, 3], 'What was the Harrying of the North?', "William's destruction of villages, crops and animals in the north after rebellions", [
        ['A Viking invasion of Yorkshire', 'There was Danish help for the rebels, but the harrying was done by William’s own army.'],
        ["Hereward the Wake's rebellion", 'Hereward rebelled in the Fens, in the east of England.'],
        'The building of castles along the Scottish border',
      ], 'To "harry" means to lay waste.', 'In the winter of 1069-1070 William’s soldiers burned villages, crops and animals across the north. Many people starved.'),
      F([3, 4], "Source C describes the Harrying of the North. What does it suggest about the writer's view of William's actions?", 'He disapproved of them, even though he wrote under Norman rule', [
        ['He thought William was right to do it', 'Look at the last sentence: "I cannot praise him for this."'],
        'He thought the famine was caused by bad weather',
        ['He was writing as an eyewitness in 1069', 'Orderic was born in 1075 and wrote decades later.'],
      ], 'Read the final sentence of the source carefully.', 'Orderic says he "cannot praise" William for this. He was a monk with a Norman father and an English mother, writing about 50 years later, and he condemned the cruelty.', SRC.orderic),
      F([3, 4], 'Why did William use such brutal methods in the north of England?', 'To crush repeated rebellions and frighten others into obedience', [
        ['To punish the north for supporting Harald Hardrada', 'The north had fought against Hardrada at Fulford in 1066.'],
        'Because the Pope ordered him to',
        'To clear the land for building the Domesday Book',
      ], 'The north had rebelled more than once, with help from Denmark.', 'After repeated northern rebellions, some with Danish help, William decided to make sure the north could never support a rebellion again.'),
      F([2, 4], 'What happened to most land held by Anglo-Saxon nobles after the Conquest?', "It was taken and given to William's Norman followers", [
        'It was given to the Church',
        'It was shared out among the peasants',
        ['They were allowed to keep it all', 'By 1086, only a tiny share of land was still held by English lords.'],
      ], 'William needed to reward the men who fought for him.', 'William rewarded his followers with English land. By 1086 the Domesday Book shows almost all the great landowners were Normans.'),
      F([4, 5], 'Why is the Domesday Book so useful to historians today?', "It gives a detailed snapshot of England's villages, land and people in 1086", [
        'It records what ordinary people thought about William',
        ['It covers the whole of Britain', 'It did not cover Scotland or Wales, and some places, including London, were left out.'],
        'It describes exactly how the Battle of Hastings was fought',
      ], 'Think about what kind of information a survey collects.', 'Domesday lists thousands of places with their land, mills, animals and people. It shows how England was owned and farmed, but not people’s opinions.'),
      F([3, 5], 'Why did the English call it the "Domesday" Book?', "Its decisions could not be argued with, like God's judgement on Doomsday", [
        'It was finished on the last day of the year',
        'It listed the dates people would die',
        'It was written by a monk called Domes',
      ], 'Doomsday is the Day of Judgement in Christian belief.', 'A writer about a century later explained that, like the Last Judgement, there was no appeal against what the survey recorded.'),
    ],
    reveals: [
      {
        prompt: 'Describe two ways William the Conqueror kept control of England after 1066.',
        hint: 'Choose two different methods. For each, say what he did and add a detail.',
        model:
          'One way was building castles. The Normans built hundreds of motte and bailey castles in towns and at river crossings, which were bases for soldiers to control the area around them. A second way was using force against rebels. When the north rebelled, William carried out the Harrying of the North in 1069-1070, burning villages and crops so that many people starved and the north could not rebel again.',
        checklist: ['Identifies one method of control', 'Gives a supporting detail for it', 'Identifies a second, different method', 'Gives a supporting detail for the second method'],
      },
      {
        prompt: 'How useful is Source C for finding out about the Harrying of the North?',
        src: SRC.orderic,
        hint: 'Think about what the source tells you (content) and who wrote it, when and why (provenance). Then give an overall judgement.',
        model:
          "Source C is useful because it describes how crops, animals and tools were burned and how terrible famine followed, which shows how destructive the Harrying was. Orderic was an educated monk who could use other records, and his English mother may explain why he criticises William. However, he was writing around 50 years later, so he was not an eyewitness and may rely on stories. He also wants to make a moral point, so he may exaggerate. Overall it is useful for the scale of the damage and how it was remembered, and it fits other evidence such as Domesday, which lists many northern villages as 'waste'.",
        checklist: ['Uses detail from the source to show what it tells us', 'Comments on who wrote it, or when', 'Gives a limitation linked to the provenance', 'Mentions other evidence or knowledge to check it', 'Gives an overall judgement on how useful it is'],
      },
    ],
  },

  // ------------------------------------------------------------------ castles
  {
    skill: 'medieval.castles',
    title: 'Norman castles',
    seqs: [
      {
        prompt: 'Put these types of castle in the order they were mostly built in England and Wales.',
        items: ['Wooden motte and bailey castles', 'Stone keep castles', 'Concentric castles with rings of walls'],
        direction: ['Earliest', 'Latest'],
        hint: 'The first castles had to be put up fast after 1066.',
        ex: 'Quick wooden motte and baileys came first; many were rebuilt in stone, and later concentric castles (like Edward I’s Welsh castles around 1300) added rings of walls.',
      },
    ],
    terms: [
      { t: 'motte', d: 'a large mound of earth with a tower on top' },
      { t: 'bailey', d: 'the enclosed yard below the mound, where soldiers, horses and stores were kept' },
      { t: 'palisade', d: 'a strong fence of sharpened wooden stakes' },
      { t: 'keep', d: 'the main tower of a castle and its strongest part' },
      { t: 'moat', d: 'a deep ditch around a castle, sometimes filled with water' },
      { t: 'concentric castle', d: 'a castle with two or more rings of walls, one inside the other' },
      { t: 'portcullis', d: 'a heavy grille that could be dropped to block a castle gateway' },
    ],
    facts: [
      F([1, 2], 'What were the first Norman castles in England usually made of?', 'Earth and timber', [
        ['Stone', 'Stone castles came later, because they took years to build.'],
        'Brick',
        'Iron',
      ], 'They had to be built in days or weeks.', 'The first castles were motte and baileys made of earth and wood, which could be put up very quickly.'),
      F([2, 3], 'Why did the Normans first build motte and bailey castles rather than stone ones?', 'They could be built quickly, using local labour and materials', [
        ['They were stronger than stone castles', 'Wooden castles could rot or be burned; stone was stronger.'],
        'Stone castles were banned by the Pope',
        'The English asked them to',
      ], 'After 1066 the Normans needed control straight away.', 'A motte and bailey could be built in weeks, so the Normans could quickly put soldiers in every important area.'),
      F([2, 3], 'Why did the Normans later rebuild many castles in stone?', 'Wood could rot or be set on fire, but stone was stronger and lasted', [
        'Stone was cheaper and quicker to build with',
        'The king had run out of wood',
        'Stone castles did not need soldiers inside',
      ], 'Think about how an enemy might attack a wooden tower.', 'Once the Normans were secure, they replaced timber with stone, which could not easily be burned and lasted for centuries.'),
      F([2, 4], 'Why were castles important for controlling England after 1066?', 'They were bases for soldiers to control the area around them, and they showed Norman power', [
        'They were homes for the English earls',
        'They were mainly used to store the Domesday Book',
        ['They were built only to keep out the Vikings', 'Castles were mainly for controlling the English population.'],
      ], 'Who were the Normans worried about inside England?', 'Castles let a small number of Normans dominate a large English population: soldiers rode out to stop trouble, and the castle was a reminder of who was in charge.'),
      F([3, 4], 'Where did the Normans often choose to build castles?', 'In towns and at important places such as river crossings and roads', [
        'In remote forests far from people',
        'Only along the south coast',
        'Only next to monasteries',
      ], 'Where would soldiers need to be to control movement and people?', 'Castles were placed where they could control people and movement, such as towns, river crossings and roads. Houses were sometimes knocked down to make room.'),
      F([4, 5], 'What was the main advantage of a concentric castle?', 'Attackers who broke through the outer wall were trapped and could be shot at from the higher inner wall', [
        'It was cheaper and quicker to build than a motte and bailey',
        'It did not need a gate',
        'It could be moved to a new place',
      ], 'Picture two rings of walls, the inner one taller.', 'Concentric castles had rings of walls. Even if attackers got through the outer wall, defenders on the taller inner wall could still shoot down at them.'),
      F([3, 4], 'William the Conqueror built the White Tower in London. What message was it meant to send to Londoners?', 'That the Normans were powerful and here to stay', [
        'That London was now a holy city',
        'That the English could share power',
        'That William planned to move to London from Normandy forever',
      ], 'It was the tallest, strongest building most Londoners had ever seen.', 'A huge stone tower in the capital showed the power and permanence of Norman rule.'),
    ],
    reveals: [
      {
        prompt: 'Explain why the Normans built so many castles in England after 1066.',
        hint: 'Think about the size of the Norman army compared with the English population, and what castles let them do.',
        model:
          'The Normans built castles because they were a small group ruling a large and sometimes rebellious English population. Castles were bases where soldiers could live safely and ride out to stop rebellions, so they were built in towns and at river crossings. Motte and bailey castles could be built very quickly using English labour, so the Normans could control new areas fast. Castles also sent a message: a huge building like the White Tower showed that the Normans were powerful and here to stay.',
        checklist: ['Gives at least two reasons', 'Links castles to controlling the English population or rebellions', 'Uses specific detail (motte and bailey, White Tower, locations)', 'Explains how each reason helped the Normans, not just what castles were'],
      },
    ],
  },

  // ------------------------------------------------------------------ feudal system
  {
    skill: 'medieval.feudal',
    title: 'the feudal system',
    seqs: [
      {
        prompt: 'Put the groups in the feudal system in order, from most to least powerful.',
        items: ['The king', 'Barons and bishops', 'Knights', 'Peasants'],
        direction: ['Most powerful', 'Least powerful'],
        hint: 'Who gave land to whom?',
        ex: 'The king granted land to barons and bishops, who granted some to knights, who let peasants farm strips in return for work.',
      },
    ],
    terms: [
      { t: 'feudal system', d: 'a system where land was given in return for loyalty and service' },
      { t: 'baron', d: 'a powerful noble who held land directly from the king' },
      { t: 'knight', d: 'a trained soldier on horseback who held land from a lord in return for military service' },
      { t: 'villein', d: 'a peasant who was not free and could not leave the lord’s land without permission' },
      { t: 'oath of fealty', d: 'a promise of loyalty made to a lord or king' },
      { t: 'homage', d: 'a ceremony where a man knelt and promised to be his lord’s man' },
    ],
    facts: [
      F([1, 2], 'Who was at the top of the feudal system?', 'The king', [
        ['The barons', 'Barons were near the top, but they held their land from the king.'],
        'The knights',
        'The peasants',
      ], 'Who owned all the land in theory?', 'The king owned all the land in theory and granted it out in return for loyalty and service.'),
      F([2, 3], 'In the feudal system, what did a baron give the king in return for land?', 'Loyalty, money and knights to fight for him', [
        "Food grown on the king's fields",
        ['Nothing, because the land was a gift', 'Land always came with duties attached.'],
        'A tenth of everything to the Church',
      ], 'What would a king need most to stay in power?', 'Barons swore loyalty, paid money and provided knights for the king’s army.'),
      F([2, 3], 'What did peasants (villeins) give their lord in return for land to farm?', "Work on the lord's land, and a share of their produce", [
        'Military service as a knight',
        'Taxes paid directly to the Pope',
        'Nothing at all',
      ], 'Peasants did not have money or weapons. What did they have?', 'Villeins worked for several days a week on the lord’s land and gave him part of their crops and animals.'),
      F([3, 4], 'Why did the feudal system help William keep control of England?', 'Everyone held land in return for loyalty and service, so each person owed obedience to someone above them', [
        'It gave the English earls more power than the king',
        'It meant the king did not need an army',
        'It let peasants choose their own lords',
      ], 'Think about the chain of promises from the king down to the peasants.', 'The feudal system tied everyone to the king through a chain of land and loyalty. Anyone who broke their oath could lose their land.'),
      F([3, 4], 'What did a knight mainly owe his lord in return for land?', 'Military service: fighting for him for a set number of days each year', [
        'A share of the crops he grew himself',
        'Prayers for the lord’s soul',
        'Work on the lord’s fields',
      ], 'What were knights trained to do?', 'Knights were trained soldiers. They held land in return for serving in their lord’s army.'),
      F([4, 5], 'Why did the feudal system make it hard for peasants to improve their lives?', "Villeins were not free to leave the manor or work for someone else without the lord's permission", [
        'Peasants were not allowed to marry',
        'Peasants had to fight in every war',
        'Peasants were paid too much to want to change',
      ], 'Think about what "unfree" meant for a villein.', 'Villeins were tied to the manor. They could not move to find better land or wages, and they owed the lord work and payments.'),
      F([2, 3], 'Which group made up most of the population of medieval England?', 'Peasants', ['Knights', 'Barons', ['Monks and priests', 'The clergy were important, but only a small share of the population.']], 'Think about who grew the food.', 'The great majority of people were peasants who farmed the land.'),
    ],
    reveals: [
      {
        prompt: 'Describe two features of the feudal system.',
        hint: 'You could describe how land was shared out, what each group owed, or the oaths people swore.',
        model:
          'One feature was that land was given in return for service. The king gave land to barons, and in return they gave him loyalty, money and knights to fight. A second feature was that most peasants were villeins, who were not free. They farmed strips of land for themselves, but in return they had to work on their lord’s land and could not leave the manor without permission.',
        checklist: ['Identifies one feature', 'Gives a supporting detail for it', 'Identifies a second feature', 'Gives a supporting detail for the second feature'],
      },
    ],
  },

  // ------------------------------------------------------------------ medieval Church
  {
    skill: 'medieval.church',
    title: 'the medieval Church',
    terms: [
      { t: 'tithe', d: 'a tenth of what people produced, given to the Church' },
      { t: 'purgatory', d: 'in Catholic belief, a place where souls were cleansed of sin before going to heaven' },
      { t: 'pilgrimage', d: 'a journey to a holy place' },
      { t: 'relic', d: 'an object linked to a saint, such as a bone, believed to have holy power' },
      { t: 'monastery', d: 'a community where monks lived, worked and prayed' },
      { t: 'excommunication', d: 'being cut off from the Church and its services' },
      { t: 'Doom painting', d: 'a church wall painting showing the Last Judgement, heaven and hell' },
      { t: 'clergy', d: 'people who served the Church, such as priests, monks and bishops' },
    ],
    facts: [
      F([1, 2], 'Who was the head of the Catholic Church in medieval Europe?', 'The Pope', [
        'The King of England',
        ['The Archbishop of Canterbury', 'He was the most senior churchman in England, but the Pope was above him.'],
        'The local priest',
      ], 'He lived in Rome.', 'The Pope, based in Rome, led the Catholic Church across western Europe.'),
      F([1, 2], 'In which language were church services held in medieval England?', 'Latin', [
        ['English', 'Church services in English came in with the Reformation in the 1500s.'],
        'French',
        'Greek',
      ], 'It was the language of the Roman Empire and the Church.', 'Services and the Bible were in Latin, which most ordinary people did not understand.'),
      F([2, 3], 'Why did medieval people go on pilgrimages?', 'To pray at a holy place, to seek forgiveness or to ask for a cure', [
        'To find new land to farm',
        'To escape paying taxes',
        'To fight in a war against the king',
      ], 'Pilgrims often visited a saint’s shrine.', 'Pilgrims travelled to shrines such as Canterbury, believing that praying near a saint’s relics could bring forgiveness or healing.'),
      F([2, 3], 'Why did Doom paintings matter in an age when most people could not read?', 'They showed heaven and hell in pictures, teaching people to fear sin', [
        'They told people the news from London',
        'They were maps showing the way to Jerusalem',
        'They were only there as decoration',
      ], 'What did a Doom painting show?', 'Doom paintings showed the Last Judgement: the saved going to heaven and sinners dragged to hell. The message was clear without words.'),
      F([3, 4], 'Why was the Church so powerful in medieval England?', "People believed it controlled their hopes of heaven, and it owned land and collected tithes", [
        'It had the largest army in England',
        'It chose who would be king',
        'It ran all the towns and markets',
      ], 'Think about belief, land and money.', 'People believed the Church could help their souls reach heaven. It also owned a huge amount of land and received tithes, which made it very rich.'),
      F([3, 4], 'Apart from prayer, what did monasteries do?', 'Cared for the sick and poor, sheltered travellers and copied books by hand', [
        'Trained knights for the king’s army',
        'Collected the poll tax',
        'Printed newspapers',
      ], 'Monks and nuns lived by rules that included helping others.', 'Monasteries were centres of care and learning: they ran early hospitals, gave alms to the poor and copied manuscripts.'),
      F([4, 5], "Why could the Church be a rival to the king's power?", 'Churchmen owed loyalty to the Pope and could be tried in their own Church courts', [
        'The Church controlled the army',
        'Bishops were elected by the people',
        'The Church collected all the king’s taxes',
      ], 'This was at the heart of the quarrel between Henry II and Thomas Becket.', 'Churchmen answered to the Pope as well as the king, and Church courts tried clergy. Kings often clashed with the Church over this.'),
      F([3, 5], 'Why might a wealthy medieval person leave money to pay for prayers after their death?', "They believed prayers would shorten their soul's time in purgatory", [
        'It was the law that everyone must do this',
        'To avoid paying the poll tax',
        'To pay for their own statue in Rome',
      ], 'Purgatory was believed to come between death and heaven.', 'Catholics believed prayers for the dead helped souls through purgatory, so people paid priests to pray for them.'),
    ],
    reveals: [
      {
        prompt: 'Explain why the Church was so important in the lives of medieval people.',
        hint: 'Think about belief in heaven and hell, everyday life (birth, marriage, death), and the Church’s wealth and services.',
        model:
          'The Church was important because people believed it held the key to heaven. Doom paintings reminded them that sinners would go to hell, so they went to Mass, confessed and paid for prayers to shorten time in purgatory. The Church was also part of everyday life: babies were baptised, couples married and the dead buried by the priest, and holy days were the only holidays. Finally, it was rich and powerful, collecting tithes and owning land, and monasteries cared for the sick and poor.',
        checklist: ['Gives at least two reasons', 'Mentions belief in heaven, hell or purgatory', 'Uses a specific detail (tithes, Doom paintings, pilgrimage, monasteries)', 'Explains why each point made the Church important, not just describes it'],
      },
    ],
  },

  // ------------------------------------------------------------------ Henry II and Becket
  {
    skill: 'medieval.becket',
    title: 'Henry II and Thomas Becket',
    events: [
      E(1154, 'Henry II becomes king of England'),
      E(1162, 'Thomas Becket becomes Archbishop of Canterbury'),
      E(1164, 'Becket flees to France after quarrelling with Henry'),
      E(1170, 'Thomas Becket is murdered in Canterbury Cathedral', { key: true, note: 'on 29 December' }),
      E(1173, 'The Pope declares Becket a saint'),
      E(1174, "Henry II does penance at Becket's tomb in Canterbury"),
    ],
    people: [
      { n: 'Henry II', did: 'was the king who quarrelled with his friend Becket over Church courts' },
      { n: 'Thomas Becket', did: 'was the Archbishop of Canterbury murdered in his own cathedral' },
      { n: 'Edward Grim', did: 'was a monk who was wounded trying to protect Becket and wrote an eyewitness account' },
      { n: 'Eleanor of Aquitaine', did: "was Henry II's queen, who brought him huge lands in France" },
    ],
    terms: [
      { t: 'Church courts', d: 'courts run by the Church to try clergy, which gave lighter punishments than the king’s courts' },
      { t: 'penance', d: 'an act to show you are sorry for a sin' },
      { t: 'martyr', d: 'someone who is killed for their beliefs' },
      { t: 'canonise', d: 'to declare officially that someone is a saint' },
    ],
    facts: [
      F([1, 2], 'Where was Thomas Becket murdered in 1170?', 'Canterbury Cathedral', [
        'Westminster Abbey',
        'York Minster',
        ['The Tower of London', 'Becket was killed in his own cathedral, at Canterbury.'],
      ], 'Becket was Archbishop of this cathedral.', 'Four knights killed Becket inside Canterbury Cathedral on 29 December 1170.'),
      F([2, 3], 'What was the main argument between Henry II and Becket about?', "Whether churchmen accused of crimes should be tried in the king's courts or Church courts", [
        'Who should be the next king',
        'Whether England should go on crusade',
        'How much tax peasants should pay',
      ], 'Church courts gave lighter punishments than royal courts.', 'Henry wanted clergy accused of serious crimes to be punished in royal courts. Becket defended the right of the Church to try its own people.'),
      F([2, 3], 'Why did Henry II make Becket Archbishop of Canterbury in 1162?', 'Becket was his friend and chancellor, and Henry expected his support', [
        ['Becket was the Pope’s nephew', 'Becket was the son of a London merchant.'],
        'Becket had won a battle for him in France',
        'The barons demanded it',
      ], 'Becket had already worked closely with the king.', 'Becket had been Henry’s chancellor and close friend. Henry expected him to help bring the Church under royal control, but Becket changed sides.'),
      F([3, 4], 'Four knights killed Becket after hearing Henry angrily complain about him. Why is it hard to know exactly what Henry said?', "The accounts were written afterwards, and the famous 'turbulent priest' line was probably not his exact words", [
        'Henry wrote his words down, but the paper was burned',
        'Henry spoke in a language nobody understood',
        'Nobody was with Henry when he spoke',
      ], 'How do we know what anyone said in 1170?', 'Writers reported Henry’s outburst in different words. The famous version, "Will no one rid me of this turbulent priest?", comes from later retellings.'),
      F([3, 4], "What happened after Becket's death that Henry did not want?", 'Becket was made a saint, and Canterbury became a great place of pilgrimage', [
        'The barons made Becket king',
        'The Church accepted all of Henry’s demands',
        'Henry was killed in revenge',
      ], 'Think about how people saw a churchman killed in his own cathedral.', 'Becket was seen as a martyr and made a saint in 1173. Pilgrims flocked to Canterbury, and Henry was blamed.'),
      F([4, 5], 'Why did Henry II walk barefoot into Canterbury and let monks whip him in 1174?', 'To show penance and repair his relationship with the Church and his people', [
        'Because he had been found guilty in a Church court',
        'To prepare for a crusade',
        'Because he wanted to become a monk',
      ], 'Penance is an act showing you are sorry.', 'Henry did public penance at Becket’s tomb to show he was sorry and to regain the support of the Church and his people.'),
      F([4, 5], "What effect did Becket's murder have on Henry's plans for the Church courts?", 'Henry had to accept that churchmen could still be tried in Church courts', [
        'All Church courts were closed for good',
        'Church courts were given power over the king',
        'It had no effect at all',
      ], 'After the murder, who had the stronger position?', 'The murder shocked Europe, and Henry had to make peace with the Pope. He gave way on most of the Church courts issue.'),
    ],
    reveals: [
      {
        prompt: 'Explain why Henry II and Thomas Becket quarrelled.',
        hint: 'Think about what Henry expected, how Becket changed, and the question of Church courts.',
        model:
          'Henry made his friend Becket Archbishop of Canterbury in 1162 because he expected him to support royal control of the Church. But Becket took his new job seriously and defended the Church’s rights. The biggest quarrel was about churchmen who committed crimes: Henry wanted them punished in royal courts, but Becket insisted they be tried in Church courts, which gave lighter punishments. This was really a question of who had more power in England, the king or the Church, which is why the quarrel became so bitter.',
        checklist: ['Explains what Henry expected from Becket', 'Mentions the Church courts issue', 'Explains the bigger question of power between king and Church', 'Uses at least one specific date or detail'],
      },
    ],
  },

  // ------------------------------------------------------------------ Magna Carta
  {
    skill: 'medieval.magna-carta',
    title: 'King John and Magna Carta',
    events: [
      E(1199, 'John becomes king of England'),
      E(1204, 'King John loses Normandy to the King of France'),
      E(1209, 'The Pope excommunicates King John'),
      E(1215, 'King John agrees to Magna Carta at Runnymede', { key: true }),
      E(1216, 'King John dies'),
      E(1265, "Simon de Montfort's Parliament includes representatives from the towns"),
    ],
    people: [
      { n: 'King John', did: 'was the king forced by his barons to agree to Magna Carta' },
      { n: 'Stephen Langton', did: 'was the Archbishop of Canterbury whom John refused to accept, causing a quarrel with the Pope' },
      { n: 'Simon de Montfort', did: 'was a baron who called a parliament in 1265 that included men from the towns' },
      { n: 'Pope Innocent III', did: 'was the Pope who excommunicated King John' },
    ],
    terms: [
      { t: 'Magna Carta', d: 'the "Great Charter" of rights that the barons forced King John to agree to' },
      { t: 'charter', d: 'a written document granting rights' },
      { t: 'scutage', d: 'a payment made instead of military service, which John demanded often' },
      { t: 'interdict', d: 'a ban by the Pope on church services in a country' },
      { t: 'Parliament', d: 'a meeting where the king consulted nobles, churchmen and later elected representatives about laws and taxes' },
    ],
    facts: [
      F([1, 2], 'Where did King John agree to Magna Carta in 1215?', 'Runnymede', ['Westminster Abbey', 'Hastings', 'Canterbury'], 'It is a meadow beside the River Thames.', 'John met the rebel barons at Runnymede, beside the Thames, in June 1215.'),
      F([2, 3], 'Why were the barons angry with King John?', 'He demanded heavy taxes, lost lands in France and treated barons unfairly', [
        'He refused to go to war with France',
        'He gave all his land to the Church',
        ['He had murdered Thomas Becket', 'Becket was killed in 1170, in the reign of Henry II, John’s father.'],
      ], 'Think about money, military failure and fairness.', 'John raised taxes such as scutage to pay for wars, lost Normandy in 1204 and punished barons harshly without fair trials.'),
      F([2, 3], 'Which idea in Magna Carta is still seen as important today?', 'That the ruler must obey the law too', [
        ['That everyone has the right to vote', 'Magna Carta did not give anyone a vote.'],
        'That slavery is illegal',
        'That England should have no king',
      ], 'Magna Carta set limits on what the king could do.', 'Magna Carta established that the king was not above the law, and it promised free men lawful judgement. These ideas influenced later laws in Britain and elsewhere.'),
      F([3, 4], 'Who did Magna Carta mainly protect in 1215?', 'The barons, the Church and free men, not most peasants', [
        ['Everyone in England equally', 'Most peasants were villeins, who were not free and gained very little.'],
        'Only the king',
        'Only the peasants',
      ], 'Who wrote the demands?', 'Magna Carta was written for the barons and the Church. Villeins, the majority of people, were not "free men" and gained little.'),
      F([3, 4], 'What happened soon after John agreed to Magna Carta?', 'John asked the Pope to cancel it, and war broke out with the barons', [
        'John obeyed every clause for the rest of his reign',
        'The barons made John Pope',
        'Magna Carta was immediately accepted by the King of France',
      ], 'John had only agreed because he was forced to.', 'Within months the Pope declared Magna Carta invalid at John’s request, and civil war broke out. John died in 1216.'),
      F([4, 5], 'Why is Magna Carta seen as significant even though it failed at first?', 'It was reissued by later kings, and its ideas about limiting royal power and fair trials lasted', [
        'It gave all men the vote in 1215',
        'It ended the feudal system immediately',
        'It made England a republic',
      ], 'Think about what happened to it after John died.', 'Magna Carta was reissued in 1216, 1217 and 1225. Its ideas, such as the king being under the law, were used in later struggles over power.'),
      F([2, 4], 'What right does this clause of Magna Carta give?', 'A free man cannot be punished except by a lawful trial or the law of the land', [
        'Every man must serve in the army',
        'Free men do not have to pay tax',
        'The king can imprison anyone he chooses',
      ], 'Look at the words "except by the lawful judgement".', 'Clause 39 says free men cannot be imprisoned or have property taken without a lawful judgement. This is the root of the idea of a fair trial.', passage('No free man shall be seized or imprisoned, or have his property taken, or be outlawed or exiled, except by the lawful judgement of his equals or by the law of the land.', { title: 'Clause 39', source: 'Paraphrased in modern English from clause 39 of Magna Carta (1215), which was written in Latin.' })),
      F([3, 5], 'Why did King John fall out with the Pope?', 'He refused to accept Stephen Langton as Archbishop of Canterbury', [
        'He refused to go on crusade',
        ['He signed Magna Carta', 'The quarrel with the Pope began years before 1215.'],
        'He became a Protestant',
      ], 'It was about who should lead the Church in England.', 'John refused to accept the Pope’s choice of Archbishop, Stephen Langton. The Pope placed England under an interdict and excommunicated John in 1209.'),
    ],
    reveals: [
      {
        prompt: 'Explain why the barons forced King John to agree to Magna Carta in 1215.',
        hint: 'Think about money, war, the Church and how John treated the barons.',
        model:
          'One reason was money. John demanded heavy taxes, such as scutage, again and again to pay for his wars. Another reason was military failure: he lost Normandy in 1204, and many barons lost lands there, and his attempt to win it back failed. His quarrel with the Pope also weakened him, because England was under an interdict and John was excommunicated. Finally, John treated barons harshly and unfairly, so they rebelled and forced him to agree to limits on his power.',
        checklist: ['Gives at least two reasons', 'Mentions taxes or money', 'Mentions a specific event (loss of Normandy, quarrel with the Pope)', 'Explains how the reasons made the barons rebel'],
      },
      {
        prompt: '"Magna Carta was a failure." How far do you agree?',
        hint: 'Give evidence on both sides, then make a judgement. Think about 1215 and the longer term.',
        model:
          'In the short term Magna Carta was a failure. John asked the Pope to cancel it within months and civil war broke out, and it did little for villeins, who were most of the population. However, in the long term it was a success. It was reissued by later kings in 1216, 1217 and 1225, and its idea that even the king must obey the law, and that free men deserve a lawful trial, has influenced laws ever since. So I mostly disagree: it failed in 1215, but its ideas lasted for centuries.',
        checklist: ['Gives evidence that it failed', 'Gives evidence that it succeeded or mattered', 'Considers short-term and long-term', 'Reaches a clear judgement'],
      },
    ],
  },

  // ------------------------------------------------------------------ Crusades
  {
    skill: 'medieval.crusades',
    title: 'the Crusades',
    events: [
      E(1095, 'Pope Urban II calls for a crusade to capture Jerusalem'),
      E(1099, 'Crusaders capture Jerusalem'),
      E(1187, 'Saladin captures Jerusalem'),
      E(1189, 'Richard I becomes king of England'),
      E(1192, 'Richard I and Saladin agree a truce'),
      E(1291, 'Acre, the last major crusader city, falls'),
    ],
    people: [
      { n: 'Pope Urban II', did: 'called for the First Crusade in 1095' },
      { n: 'Saladin', did: 'was the Muslim sultan who recaptured Jerusalem in 1187' },
      { n: 'Richard I', did: 'was the English king known as the Lionheart who fought in the Third Crusade' },
    ],
    terms: [
      { t: 'crusade', d: 'a war declared by the Pope as a holy war, especially to capture Jerusalem' },
      { t: 'Holy Land', d: 'the area around Jerusalem, holy to Christians, Muslims and Jews' },
      { t: 'Knights Templar', d: 'an order of warrior monks who protected pilgrims and fought in the crusades' },
    ],
    facts: [
      F([1, 2], 'Which city did the crusaders most want to capture?', 'Jerusalem', [
        ['Rome', 'Rome was where the Pope lived; it was already Christian.'],
        ['Constantinople', 'Constantinople was a Christian city whose emperor asked the Pope for help.'],
        'Paris',
      ], 'It was the city where Jesus was crucified.', 'Jerusalem was holy to Christians, Muslims and Jews. Crusaders wanted to bring it under Christian control.'),
      F([2, 3], 'Why did many knights join the crusades?', 'The Pope promised forgiveness of sins, and some hoped for land and riches', [
        'They were paid huge wages by the King of England',
        'They were forced to by Magna Carta',
        'They wanted to escape the Black Death',
      ], 'Think about religious reasons and personal ones.', 'Crusaders were promised that their sins would be forgiven. Some also hoped for adventure, land or wealth.'),
      F([2, 3], 'Who asked the Pope for help, leading to the First Crusade?', 'The Byzantine Emperor in Constantinople', [
        'The King of England',
        ['Saladin', 'Saladin lived about a hundred years later.'],
        'The Holy Roman Emperor in Germany',
      ], 'This Christian empire was under pressure from the Seljuk Turks.', 'The Byzantine Emperor asked for help against the Seljuk Turks. In 1095 Pope Urban II called on Christians to fight and to take Jerusalem.'),
      F([3, 4], 'How did the Third Crusade end?', 'With a truce: Jerusalem stayed under Muslim rule, but Christian pilgrims could visit', [
        ['Richard I captured Jerusalem', 'Richard came close but never took Jerusalem.'],
        'Saladin became a Christian',
        'The crusaders captured Baghdad',
      ], 'Neither side won completely.', 'In 1192 Richard I and Saladin agreed a truce. Jerusalem stayed under Saladin’s control, but unarmed Christian pilgrims were allowed to visit.'),
      F([3, 4], 'Which is a long-term consequence of the crusades for Europe?', 'More trade and contact with the Middle East, bringing new goods and knowledge', [
        'The end of the Catholic Church',
        'The permanent Christian control of Jerusalem',
        ['The start of the Black Death', 'The Black Death arrived in 1347, decades after the crusades ended, and was not caused by them.'],
      ], 'Think about what people brought back.', 'Contact with the Middle East increased trade in goods such as spices and silk, and some Arabic learning reached Europe.'),
      F([4, 5], 'Why do Christian and Muslim writers of the time describe the capture of Jerusalem in 1099 so differently?', 'Christian writers celebrated a holy victory, while Muslim writers remembered a massacre of the city’s people', [
        'Only Muslim writers knew it had happened',
        'Christian writers were all eyewitnesses and Muslim writers were not',
        'They used different calendars, so they described different events',
      ], 'Think about each writer’s side in the conflict.', 'Many inhabitants of Jerusalem were killed in 1099. Each side’s writers saw the event through their own beliefs, which is why interpretations differ.'),
    ],
    reveals: [
      {
        prompt: 'Explain why so many people went on crusade.',
        hint: 'Think about religious reasons, what the Pope promised, and personal reasons such as land or adventure.',
        model:
          'The main reason was religion. Jerusalem was the holiest city for Christians, and in 1095 Pope Urban II said that fighting to capture it was God’s will. He promised that crusaders’ sins would be forgiven, which mattered greatly to people afraid of hell. There were also other reasons: younger sons of knights who would not inherit land hoped to win land and wealth in the East, and some wanted adventure. Many went for a mixture of faith and hope of reward.',
        checklist: ['Gives a religious reason', 'Mentions the Pope or forgiveness of sins', 'Gives a non-religious reason', 'Explains why each reason made people go'],
      },
    ],
  },

  // ------------------------------------------------------------------ Black Death
  {
    skill: 'medieval.black-death',
    title: 'the Black Death',
    events: [
      E(1347, 'The Black Death reaches Europe by ship'),
      E(1348, 'The Black Death arrives in England', { key: true, note: 'probably at a port in Dorset, in the summer' }),
      E(1349, 'The Ordinance of Labourers tries to stop wages rising'),
      E(1351, 'Parliament passes the Statute of Labourers'),
      E(1361, 'The plague returns to England'),
    ],
    terms: [
      { t: 'bubonic plague', d: 'plague spread by bites from infected fleas, causing swellings called buboes' },
      { t: 'pneumonic plague', d: 'a form of plague that infects the lungs and spreads through coughs and sneezes' },
      { t: 'flagellants', d: 'people who whipped themselves in public, hoping God would forgive sins and end the plague' },
      { t: 'miasma', d: 'bad air, which people believed caused disease' },
      { t: 'Statute of Labourers', d: 'a law of 1351 that tried to keep wages at the level they were before the Black Death' },
    ],
    links: [
      { c: 'So many people died that there were fewer workers', e: 'Surviving peasants demanded higher wages' },
      { c: 'Lords wanted to keep wages low', e: 'Parliament passed the Statute of Labourers in 1351' },
      { c: "People believed the plague was God's punishment", e: 'Some joined flagellant processions to show they were sorry' },
      { c: 'People believed bad air carried the disease', e: 'Some carried sweet-smelling herbs and flowers' },
      { c: 'Many priests caught the plague while caring for the dying', e: 'Some parishes were left without a priest' },
    ],
    facts: [
      F([1, 2], 'What do historians and scientists think caused the Black Death?', 'A germ spread by fleas from rats, and by coughs and sneezes', [
        ['Bad air (miasma)', 'People at the time blamed bad air. We now know it was caused by a germ.'],
        ['God’s punishment for sin', 'That was a belief at the time, not the scientific cause.'],
        'The position of the planets',
      ], 'Think about what we know today, not what people thought then.', 'The Black Death was caused by a bacterium. It was spread by fleas living on rats, and in its pneumonic form by coughs and sneezes.'),
      F([2, 3], 'Roughly what share of England’s population died in the Black Death of 1348-1350?', 'Between a third and a half', ['About one person in a hundred', 'About a tenth', 'Almost everyone'], 'It was the worst disaster in English history.', 'Historians estimate that between a third and a half of the population died, though exact numbers are uncertain.'),
      F([2, 3], 'Which of these did people in 1348 believe caused the plague?', "God's punishment for people's sins", [
        ['Germs spread by fleas', 'Germ theory was not developed until the 1860s, so people in 1348 did not know about germs.'],
        'Pollution from factories',
        'Viruses in the water supply',
      ], 'People in the Middle Ages explained disasters through religion.', 'Many people believed the plague was a punishment from God. Others blamed bad air or the planets.'),
      F([3, 4], 'Why did many surviving peasants’ lives improve after the Black Death?', 'So many workers had died that survivors could demand higher wages and better terms', [
        'The king gave every peasant free land',
        'The plague only killed lords',
        'Peasants were all made into knights',
      ], 'Think about supply and demand: who was in short supply?', 'With far fewer workers, lords competed for labour. Peasants could ask for higher wages or move to better land.'),
      F([3, 4], 'How did the government react to peasants asking for higher wages after the Black Death?', 'It passed laws to keep wages at the old levels', [
        'It doubled all wages',
        'It abolished the feudal system',
        'It gave every peasant the vote',
      ], 'Parliament was made up of landowners.', 'The Ordinance of Labourers (1349) and Statute of Labourers (1351) tried to hold wages down, which made peasants angry.'),
      F([2, 3], 'Which treatment for the plague might a medieval doctor have tried?', 'Bleeding the patient to balance the humours', [
        ['Antibiotics', 'Antibiotics were not used until the 1900s.'],
        'Vaccination',
        'Keyhole surgery',
      ], 'Doctors followed the theory of the four humours.', 'Medieval doctors tried bleeding, herbal remedies, prayers and lancing the buboes. None of these could cure the plague.'),
      F([4, 5], 'Why do some historians call the Black Death a turning point for the feudal system?', 'Labour shortages gave peasants more bargaining power, weakening lords’ control over villeins', [
        'It killed all the barons, so feudalism ended at once',
        'The king banned the feudal system in 1348',
        'It made peasants poorer and more dependent on lords',
      ], 'Think about what happened to the value of a worker’s labour.', 'With so many dead, workers were valuable. Over the next decades many villeins gained freedom and higher wages, and serfdom slowly faded.'),
      F([1, 2], "Which animals' fleas are most often blamed for spreading the Black Death?", 'Black rats', ['Cats', 'Cows', 'Horses'], 'They lived on ships and in houses.', 'Black rats carried fleas infected with the plague germ. Ships helped spread rats and fleas from port to port.'),
    ],
    reveals: [
      {
        prompt: 'How useful is Source D for finding out how people reacted to the Black Death?',
        src: SRC.plagueMonk,
        hint: 'What does it show about reactions? What can’t it tell you? Remember it is an imagined source based on real chronicles.',
        model:
          'Source D is useful because it shows how terrifying the Black Death was: so many died that there were hardly enough people to bury them. It also shows what people believed caused it, God’s punishment or foul air, which helps explain reactions like praying, flagellants or carrying herbs. As it is based on monks’ chronicles, it reflects the view of educated churchmen, who would focus on sin. However, it does not tell us what peasants thought or how lords and workers reacted afterwards, so I would also need other evidence such as the Statute of Labourers.',
        checklist: ['Uses detail from the source', 'Explains what it shows about reactions or beliefs', 'Comments on who wrote it (a monk) and how that affects it', 'Gives a limitation (what it does not tell us)', 'Gives an overall judgement'],
      },
      {
        prompt: 'Explain why the Black Death spread so quickly and killed so many people.',
        hint: 'Think about how it spread, where people lived and what medicine could do.',
        model:
          'The Black Death spread quickly because it was carried by fleas living on rats, which travelled on ships and in carts along trade routes. Once it reached England in 1348 it moved from town to town. Towns were crowded and dirty, with rubbish in the streets, which suited rats. In its pneumonic form it also spread through coughs and sneezes. It killed so many because nobody understood the cause: doctors believed in bad air and the humours, so treatments like bleeding did not work.',
        checklist: ['Explains how the disease spread (fleas, rats, coughs)', 'Mentions living conditions or trade', 'Explains why medicine could not stop it', 'Links each reason to speed or deaths'],
      },
    ],
  },

  // ------------------------------------------------------------------ Peasants' Revolt
  {
    skill: 'medieval.peasants-revolt',
    title: "the Peasants' Revolt",
    events: [
      E(1348, 'The Black Death arrives in England'),
      E(1351, 'Parliament passes the Statute of Labourers'),
      E(1377, 'Richard II becomes king, aged ten'),
      E(1380, 'Parliament agrees a third poll tax, at a higher rate'),
      E(1381, "The Peasants' Revolt", { key: true }),
    ],
    seqs: [
      {
        prompt: "Put these events of the Peasants' Revolt of 1381 in order.",
        items: [
          'Villagers in Essex attack tax collectors',
          'Rebels from Kent and Essex march on London',
          "Rebels burn John of Gaunt's Savoy Palace in London",
          'Richard II meets the rebels at Mile End',
          'Wat Tyler is killed at Smithfield',
          "The king takes back his promises and rebel leaders are executed",
        ],
        direction: ['May 1381', 'Later in 1381'],
        hint: 'The trouble started in the countryside, and the king met the rebels twice.',
        ex: 'Trouble began in Essex in May. In June the rebels reached London, burned the Savoy, met the king at Mile End, then met him again at Smithfield, where Wat Tyler was killed. Afterwards the promises were broken.',
      },
    ],
    people: [
      { n: 'Wat Tyler', did: 'led the rebels and was killed at Smithfield' },
      { n: 'John Ball', did: 'was a priest who preached that all people were created equal' },
      { n: 'Richard II', did: 'was the teenage king who met the rebels in 1381' },
      { n: 'William Walworth', did: 'was the Mayor of London who struck Wat Tyler at Smithfield' },
      { n: 'John of Gaunt', did: "was the king's powerful uncle, whose Savoy Palace was burned by rebels" },
    ],
    terms: [
      { t: 'poll tax', d: 'a tax on every person, at the same rate for rich and poor' },
      { t: 'serfdom', d: 'being unfree and tied to a lord’s land' },
    ],
    links: [
      { c: 'The Black Death killed many workers', e: 'Peasants expected higher wages and more freedom' },
      { c: 'The Statute of Labourers kept wages down', e: 'Peasants grew angry with lords and the government' },
      { c: 'The poll tax of 1380', e: 'Villagers in Essex attacked tax collectors' },
      { c: 'Wat Tyler was killed at Smithfield', e: 'The rebels, without their leader, were sent home' },
    ],
    facts: [
      F([1, 2], "What was the trigger of the Peasants' Revolt in 1381?", 'A new poll tax', [
        'The murder of Thomas Becket',
        ['The arrival of the Black Death', 'The Black Death arrived in 1348, over 30 years earlier. It was a long-term cause.'],
        'King John agreeing to Magna Carta',
      ], 'A trigger is the event that sets things off.', 'The third poll tax (1380) sparked the revolt when collectors tried to collect it in Essex in 1381.'),
      F([2, 3], 'How old was Richard II when he faced the rebels in 1381?', '14', [['10', 'He was 10 when he became king in 1377.'], '21', '40'], 'He became king in 1377 at the age of ten.', 'Richard II was born in 1367, so he was 14 when he met the rebels.'),
      F([2, 3], 'What did the rebels want?', 'An end to serfdom and the poll tax, and fairer treatment', [
        ['To make Wat Tyler king', 'The rebels said they were loyal to the king; they blamed his advisers.'],
        'To bring back the Pope’s power',
        'To start a crusade',
      ], 'Think about what made peasants’ lives unfair.', 'The rebels wanted serfdom ended, the poll tax scrapped and the king’s "evil advisers" punished. They said they were loyal to the king.'),
      F([3, 4], "How did the Peasants' Revolt end?", "Wat Tyler was killed, the rebels went home, and the king's promises were broken", [
        'The rebels took over the government',
        'Richard II was overthrown',
        'Serfdom was ended immediately by law',
      ], 'What happened at Smithfield, and afterwards?', 'At Smithfield, Wat Tyler was killed. Richard persuaded the rebels to go home, then cancelled his promises; leaders such as John Ball were executed.'),
      F([3, 4], "What was John Ball's rhyme in Source J arguing?", 'God created all people equal, so lords and serfs were not part of the original plan', [
        'That peasants should work harder for their lords',
        'That Adam and Eve were nobles',
        'That only gentlemen should go to heaven',
      ], 'In the Bible, Adam and Eve were the first people. Were there lords then?', 'Ball asked who was the "gentleman" when Adam dug and Eve spun. When the first people worked for themselves, nobody was a lord, so inequality was man-made.', SRC.johnBall),
      F([4, 5], "Some historians argue the Peasants' Revolt had results in the long run. Which is the best evidence for this?", 'Governments avoided poll taxes for a very long time, and serfdom slowly died out', [
        'The rebels won the vote for all men',
        'Richard II kept all of his promises',
        'Wat Tyler became Mayor of London',
      ], 'The revolt failed in 1381. Look for changes over the following decades.', 'The revolt was crushed, but rulers were wary of another poll tax, and over the following century serfdom faded away.'),
      F([2, 4], 'Why was the poll tax seen as so unfair?', 'Everyone paid the same amount, so it hit the poor hardest', [
        'Only peasants had to pay it',
        'It was paid to the King of France',
        'It was charged on windows',
      ], '"Poll" means head: a tax per person.', 'A flat tax per person took a much bigger share of a poor peasant’s income than a rich lord’s.'),
    ],
    reveals: [
      {
        prompt: "Explain why the Peasants' Revolt broke out in 1381.",
        hint: 'Use long-term causes (the Black Death, wages, serfdom) and the trigger (the poll tax).',
        model:
          'A long-term cause was the Black Death. So many workers died that surviving peasants expected higher wages and more freedom, but the Statute of Labourers of 1351 tried to keep wages down, which made them angry. Many were also unhappy about serfdom, and preachers like John Ball said all people were created equal. The trigger was the poll tax of 1380, which charged everyone the same and hit the poor hardest. When collectors came to Essex in 1381, villagers attacked them and the revolt spread.',
        checklist: ['Gives a long-term cause', 'Gives the trigger (the poll tax)', 'Explains how the causes are linked', 'Uses specific detail (dates, people, laws)'],
      },
      {
        prompt: "What can you learn from Source J about the ideas behind the Peasants' Revolt?",
        src: SRC.johnBall,
        hint: 'Make an inference: what does the rhyme suggest the rebels believed? Back it up with words from the source.',
        model:
          'Source J suggests that some rebels believed all people were equal in God’s eyes. The rhyme asks who was "the gentleman" when Adam dug and Eve spun, meaning that at the creation there were no lords. This suggests the rebels thought serfdom and the power of lords were man-made and unfair, not part of God’s plan. Because John Ball was a priest, it also shows religion could be used to challenge the feudal system.',
        checklist: ['Makes an inference, not just a description', 'Supports it with words from the source', 'Links it to serfdom or inequality', 'Uses knowledge of who John Ball was'],
      },
    ],
  },

  // ------------------------------------------------------------------ medieval life
  {
    skill: 'medieval.life',
    title: 'medieval life',
    terms: [
      { t: 'manor', d: "a lord's estate, including his house, land and village" },
      { t: 'strip farming', d: 'farming narrow strips of land spread across large open fields' },
      { t: 'common land', d: 'land all villagers could use, for example to graze animals' },
      { t: 'guild', d: 'an organisation of craftsmen or merchants in a town that controlled their trade' },
      { t: 'apprentice', d: 'a young person learning a trade from a master craftsman' },
      { t: 'reeve', d: 'a villager chosen to organise work on the lord’s land' },
      { t: 'wattle and daub', d: 'woven sticks covered in a mix of mud, straw and dung, used for walls' },
      { t: 'fallow', d: 'left unplanted for a year so the soil can recover' },
    ],
    facts: [
      F([1, 2], 'Where did most people in medieval England live?', 'In villages in the countryside', ['In large towns', 'In castles', 'In monasteries'], 'Most people were farmers.', 'Around nine in ten people lived in the countryside, farming the land.'),
      F([2, 3], 'What were most peasant houses made of?', 'Wattle and daub, with a thatched roof', [
        'Stone, with glass windows',
        'Brick, with slate roofs',
        'Concrete',
      ], 'Peasants used whatever local materials were cheap.', 'Peasant houses were usually wooden frames filled with wattle and daub, with thatched roofs. Glass was too expensive for ordinary homes.'),
      F([2, 3], 'Why was one field left fallow each year in the three-field system?', 'To let the soil recover, so crops would grow better', [
        'Because the lord wanted it for hunting',
        'Because the Church owned it',
        'To keep the peasants busy',
      ], 'Growing crops in the same soil every year wears it out.', 'Fields took turns to rest. Animals grazed on the fallow field, and their dung helped the soil recover.'),
      F([3, 4], 'Why did towns grow in the later Middle Ages?', 'Trade increased, and towns held markets and fairs', [
        'Peasants were banned from living in villages',
        'Factories needed workers',
        'The Black Death made towns safer',
      ], 'What did people go to towns to do?', 'Towns grew as places of trade, with markets, fairs and craftsmen organised in guilds.'),
      F([3, 4], 'Why were medieval towns often unhealthy places to live?', 'Waste was thrown into streets and rivers, and people lived crowded together', [
        'Towns had too many hospitals',
        'Town houses were too big',
        'Factories polluted the air',
      ], 'Think about rubbish and water.', 'There were no proper sewers. Rubbish, animal dung and human waste ended up in streets and rivers that people also used for water.'),
      F([2, 4], 'What did most medieval peasants eat every day?', 'Bread, and pottage (a thick vegetable stew)', [
        'Roast meat',
        ['Potatoes', 'Potatoes came from the Americas and did not reach England until the late 1500s.'],
        'Rice',
      ], 'Peasants grew grain and vegetables.', 'Peasants mainly ate bread and pottage, with ale to drink. Meat was a treat for most.'),
      F([4, 5], 'Which best describes the work of women in a medieval village?', 'They worked in the fields as well as running the home, brewing ale and spinning', [
        'They were not allowed to do any work outside the house',
        'They worked only as nuns',
        'They mainly worked as knights',
      ], 'Peasant families needed everyone to work.', 'Peasant women worked in the fields, especially at harvest, as well as cooking, brewing, spinning and caring for animals and children.'),
    ],
    reveals: [
      {
        prompt: 'Describe two features of life in a medieval village.',
        hint: 'Choose from farming, homes, food, work for the lord, or the Church.',
        model:
          'One feature was strip farming. Villagers farmed narrow strips in large open fields, and one field was left fallow each year so the soil could recover. A second feature was the power of the lord of the manor. Most peasants were villeins, who had to work on the lord’s land for several days a week and could not leave the village without his permission.',
        checklist: ['Identifies one feature', 'Gives a supporting detail for it', 'Identifies a second feature', 'Gives a supporting detail for the second feature'],
      },
    ],
  },

  // ------------------------------------------------------------------ medieval medicine
  {
    skill: 'medieval.medicine',
    title: 'medieval medicine',
    people: [
      { n: 'Hippocrates', did: 'was the Ancient Greek doctor linked to the theory of the four humours' },
      { n: 'Galen', did: 'was a doctor in the Roman Empire whose ideas about the body were followed for over a thousand years' },
      { n: 'Ibn Sina', did: "was a Persian doctor whose Canon of Medicine was used in Europe's universities" },
    ],
    terms: [
      { t: 'four humours', d: 'the idea that the body has four liquids (blood, phlegm, yellow bile and black bile) that must stay balanced' },
      { t: 'bloodletting', d: 'cutting a vein or using leeches to remove blood' },
      { t: 'physician', d: 'a university-trained doctor' },
      { t: 'barber-surgeon', d: 'a barber who also pulled teeth and did simple operations' },
      { t: 'apothecary', d: 'someone who mixed and sold herbal medicines' },
      { t: 'urine chart', d: 'a chart doctors used to diagnose illness from the colour of urine' },
    ],
    facts: [
      F([1, 2], 'According to the theory of the four humours, what made a person ill?', 'The four humours being out of balance', [
        ['Germs', 'Germ theory was not developed until the 1860s.'],
        'Eating vegetables',
        'Washing too often',
      ], 'Blood, phlegm, yellow bile and black bile.', 'Doctors believed health depended on balancing four humours. Too much or too little of one caused illness.'),
      F([2, 3], 'Why was the Church important to medieval medicine?', 'It ran hospitals and taught that illness could be a punishment from God, cured by prayer', [
        'It trained all doctors to use antibiotics',
        'It banned all hospitals',
        'It discovered germs',
      ], 'Monks and nuns cared for the sick.', 'Monasteries ran hospitals that cared for the sick. The Church taught that illness could come from sin and that prayer and pilgrimage could heal.'),
      F([2, 3], 'Why did medical ideas change very little during the Middle Ages?', "The Church supported Galen's ideas, and challenging them was discouraged", [
        'Nobody was ill in the Middle Ages',
        'Doctors already knew everything about the body',
        'Books about medicine were illegal',
      ], 'Whose ideas did universities teach?', 'Galen’s ideas fitted Church teaching, and doctors learned from old books rather than experiments, so few people questioned them.'),
      F([3, 4], 'Which treatment fits the theory of the four humours?', 'Bloodletting to remove excess blood', [
        ['Washing hands to remove germs', 'This is based on germ theory, which came much later.'],
        'Taking antibiotics',
        'Having a vaccination',
      ], 'If you had too much of a humour, what would a doctor try to do?', 'Bleeding and purging were meant to remove excess humours and restore balance.'),
      F([3, 4], 'Who usually treated ordinary villagers when they fell ill?', 'A local wise woman, the lady of the manor or an apothecary, using herbal remedies', [
        ['A university-trained physician', 'Physicians were expensive, so they mostly treated the rich.'],
        'A hospital surgeon using anaesthetic',
        'The king’s own doctor',
      ], 'Physicians cost a lot.', 'Most people were treated at home with herbal remedies by women in the family or village, or bought medicines from an apothecary.'),
      F([4, 5], "Why might a medieval doctor check a patient's horoscope?", 'They believed the stars and planets affected the body and the best time for treatment', [
        'To find out the patient’s birthday for the bill',
        'To decide which church the patient should attend',
        'Because the Pope required it for every patient',
      ], 'Astrology was part of medical training.', 'Many physicians used astrology, believing the planets influenced the humours and when treatment would work best.'),
    ],
    reveals: [
      {
        prompt: 'Explain why medieval people had such different ideas from us about the causes of disease.',
        hint: 'Think about the four humours, religion and what they could (and could not) observe.',
        model:
          'Medieval doctors followed the ideas of Hippocrates and Galen, who said illness came from the four humours being out of balance. These books were treated as authorities, and the Church supported them, so few people questioned them. Religion was also important: many believed illness was a punishment from God, so prayer and pilgrimage were treatments. They had no microscopes, so nobody could see germs, which meant ideas such as bad air (miasma) seemed to make sense.',
        checklist: ['Mentions the four humours or Galen', 'Mentions religious explanations', 'Explains why ideas did not change (Church, authority, no microscopes)', 'Links reasons together rather than just listing them'],
      },
    ],
  },
]
