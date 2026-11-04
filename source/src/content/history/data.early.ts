import { SRC } from './sources'
import { E, F, type Topic } from './types'

/** Tudors and Stuarts, 1485-1714 (Year 8). */
export const EARLY_MODERN: Topic[] = [
  // ------------------------------------------------------------------ Henry VII
  {
    skill: 'tudors.henry-vii',
    title: 'Henry VII and the Wars of the Roses',
    events: [
      E(1455, 'The Wars of the Roses begin with the First Battle of St Albans'),
      E(1483, 'Richard III becomes king'),
      E(1485, 'Henry Tudor defeats Richard III at the Battle of Bosworth', { key: true }),
      E(1486, 'Henry VII marries Elizabeth of York'),
      E(1487, "Henry VII defeats Lambert Simnel's supporters at the Battle of Stoke"),
      E(1509, 'Henry VII dies and his son becomes Henry VIII'),
    ],
    people: [
      { n: 'Richard III', did: 'was the last Yorkist king, killed at the Battle of Bosworth' },
      { n: 'Elizabeth of York', did: 'was the Yorkist princess whose marriage to Henry VII united the two rival families' },
      { n: 'Lambert Simnel', did: 'was a boy pretender who was pardoned and put to work in the royal kitchens' },
      { n: 'Perkin Warbeck', did: 'was a pretender who claimed to be one of the Princes in the Tower, executed in 1499' },
      { n: 'Henry VII', did: 'was the first Tudor king, who won the crown in battle in 1485' },
    ],
    terms: [
      { t: 'Wars of the Roses', d: 'a series of civil wars between the houses of Lancaster and York' },
      { t: 'pretender', d: 'someone who falsely claims a right to the throne' },
      { t: 'Tudor rose', d: 'a badge combining the red rose of Lancaster and the white rose of York' },
      { t: 'usurper', d: 'someone who takes the throne without a proper right to it' },
    ],
    facts: [
      F([1, 2], 'Which two royal families fought the Wars of the Roses?', 'Lancaster and York', [
        ['Tudor and Stuart', 'The Tudors ended the wars; the Stuarts came after 1603.'],
        'Norman and Saxon',
        'Plantagenet and Windsor',
      ], 'They are also the names of two English cities and counties.', 'The houses of Lancaster and York, two branches of the royal family, fought for the crown from 1455.'),
      F([2, 3], 'Why did Henry VII marry Elizabeth of York in 1486?', 'To unite the houses of Lancaster and York and end the fighting', [
        'To gain land in France',
        'To make an alliance with Spain',
        ['Because the Pope ordered it', 'It was Henry’s political choice, to strengthen his claim.'],
      ], 'Henry was a Lancastrian. Elizabeth was the daughter of a Yorkist king.', 'Marrying Elizabeth joined the two rival families. Their children had both Lancastrian and Yorkist blood.'),
      F([2, 3], 'In the Tudor rose badge, which family did the red rose stand for?', 'Lancaster', [['York', 'York was the white rose.'], 'Tudor', 'Stuart'], 'Henry VII came from the Lancastrian side.', 'The Tudor rose put the red rose of Lancaster and the white rose of York together, as a symbol of unity.'),
      F([2, 3], 'How did Richard III die?', 'He was killed fighting at the Battle of Bosworth', [
        'He was executed after a trial',
        'He died of the plague',
        'He escaped to France and died there',
      ], 'He was the last English king to die in battle.', 'Richard III was killed at Bosworth in 1485, and Henry Tudor was crowned.'),
      F([3, 5], "Richard III's skeleton was rediscovered in 2012. Where was it found?", 'Under a car park in Leicester', ['In York Minster', 'In the Tower of London', 'In Westminster Abbey'], 'He was buried near where he died, in the Midlands.', 'Richard was buried in a friary in Leicester. In 2012 archaeologists found his skeleton under a car park on the site, and he was reburied in Leicester Cathedral.'),
      F([3, 4], 'How did Henry VII deal with powerful nobles who might threaten him?', 'He made them pay large sums as guarantees of good behaviour and limited their private armies', [
        'He gave them more land and soldiers',
        'He executed every noble in England',
        'He let them choose the next king',
      ], 'Henry used money as a weapon.', 'Henry made nobles promise large sums of money that they would lose if they were disloyal, and he limited private armies.'),
      F([4, 5], 'Why did Henry VII leave a full treasury when he died?', 'He avoided expensive wars and collected money carefully', [
        'He won a huge war against France',
        'He sold the monasteries',
        ['He closed Parliament for good', 'Henry still called Parliament, though not often.'],
      ], 'Wars were the biggest cost for any king.', 'Henry kept out of costly wars, checked accounts himself and collected every payment owed to the crown.'),
    ],
    reveals: [
      {
        prompt: 'Explain how Henry VII made his hold on the throne secure.',
        hint: 'Think about marriage, dealing with pretenders and nobles, and money.',
        model:
          'Henry VII made his position secure in several ways. First, he married Elizabeth of York in 1486, uniting Lancaster and York so fewer people had a reason to rebel. Second, he dealt firmly with pretenders: he defeated Lambert Simnel’s supporters at Stoke in 1487 and later executed Perkin Warbeck. Third, he controlled the nobles by making them promise large sums of money for good behaviour. Finally, he was careful with money and avoided wars, so he left a full treasury and did not depend on anyone.',
        checklist: ['Gives at least two methods', 'Uses specific detail (names, dates, battles)', 'Explains how each method made him more secure', 'Covers more than one type of threat (rivals, nobles, money)'],
      },
    ],
  },

  // ------------------------------------------------------------------ Henry VIII and his wives
  {
    skill: 'tudors.henry-viii',
    title: "Henry VIII's reign",
    events: [
      E(1509, 'Henry VIII becomes king and marries Catherine of Aragon'),
      E(1533, 'Henry VIII marries Anne Boleyn'),
      E(1536, 'Anne Boleyn is executed'),
      E(1537, 'Jane Seymour gives birth to Edward and dies soon after'),
      E(1540, 'Henry marries Anne of Cleves, but the marriage is annulled within months'),
      E(1542, 'Catherine Howard is executed'),
      E(1547, 'Henry VIII dies'),
    ],
    seqs: [
      {
        prompt: "Put Henry VIII's wives in the order he married them.",
        items: ['Catherine of Aragon', 'Anne Boleyn', 'Jane Seymour', 'Anne of Cleves', 'Catherine Howard', 'Catherine Parr'],
        direction: ['First wife', 'Last wife'],
        hint: 'Divorced, beheaded, died, divorced, beheaded, survived.',
        ex: 'The rhyme "divorced, beheaded, died, divorced, beheaded, survived" follows the order of the wives.',
      },
    ],
    people: [
      { n: 'Catherine of Aragon', did: "was Henry's first wife, a Spanish princess and the mother of Mary I" },
      { n: 'Anne Boleyn', did: 'was the mother of Elizabeth I, executed in 1536' },
      { n: 'Jane Seymour', did: 'gave birth to the future Edward VI and died soon afterwards' },
      { n: 'Anne of Cleves', did: 'was a German princess whose marriage to Henry was annulled after about six months' },
      { n: 'Catherine Howard', did: "was Anne Boleyn's cousin, executed in 1542" },
      { n: 'Catherine Parr', did: "was Henry's sixth wife, who outlived him" },
    ],
    facts: [
      F([1, 2], 'How many times did Henry VIII marry?', '6', ['4', '8', '2'], 'Think of the rhyme: divorced, beheaded, died...', 'Henry married six times, partly in his search for a male heir.'),
      F([2, 3], "Strictly speaking, how did Henry's marriage to Catherine of Aragon end?", 'It was annulled: declared never to have been valid', [
        ['She was beheaded', 'Two of his wives were executed, but not Catherine of Aragon.'],
        'She died before Henry remarried',
        'The Pope granted a divorce',
      ], 'The rhyme says "divorced", but that is not quite the right word.', 'Archbishop Cranmer declared the marriage invalid in 1533. The Pope never agreed.'),
      F([2, 3], 'Why did Henry VIII want a son so badly?', 'He feared another civil war like the Wars of the Roses if he had no male heir', [
        'The law said a woman could never rule England',
        'His father had made him promise to have twelve sons',
        'He wanted a son to become Pope',
      ], 'Think about what had happened before the Tudors took the throne.', 'Henry remembered the Wars of the Roses. Many people doubted a woman could hold the throne securely, so he wanted a son.'),
      F([3, 4], "Why did Henry's marriage to Anne of Cleves end so quickly?", 'Henry did not like her when they met, and the alliance it was meant to bring no longer seemed needed', [
        'She was executed for treason',
        'She died in childbirth',
        'She ran away to France',
      ], 'It was a political marriage arranged from a portrait.', 'The marriage was arranged for a Protestant alliance. Henry was disappointed when they met, and the marriage was annulled. Anne lived comfortably in England afterwards.'),
      F([3, 4], 'Which chief minister arranged the marriage to Anne of Cleves and was executed in 1540?', 'Thomas Cromwell', [
        ['Oliver Cromwell', 'Oliver Cromwell lived about a century later and led Parliament’s side in the Civil War.'],
        'Thomas Wolsey',
        'Thomas More',
      ], 'He shared a surname with a later, more famous Cromwell.', 'Thomas Cromwell ran the government in the 1530s. After the Cleves marriage failed, he lost Henry’s trust and was executed.'),
      F([4, 5], "Why did Henry need the Pope's permission to end his first marriage?", 'England was a Catholic country, and only the Pope could annul a marriage', [
        'The Pope was Catherine of Aragon’s father',
        'Parliament had banned divorce',
        'The Pope was the King of Spain',
      ], 'Who was head of the Church before 1534?', 'Before the break with Rome, the Pope was head of the Church in England, and only he could annul a marriage.'),
    ],
    reveals: [
      {
        prompt: 'Explain why Henry VIII married six times.',
        hint: 'Think about the need for a son, politics and alliances, and Henry’s own feelings.',
        model:
          'The main reason Henry married six times was his search for a male heir. Catherine of Aragon gave him a daughter, Mary, but no surviving son, so he wanted the marriage ended so he could marry Anne Boleyn. When Anne also had a daughter, Elizabeth, he turned against her and she was executed in 1536. Jane Seymour gave him Edward but died soon after. Politics also mattered: the marriage to Anne of Cleves was arranged for a Protestant alliance. Henry’s own feelings played a part too, for example his anger at Catherine Howard, who was executed.',
        checklist: ['Explains the need for a male heir', 'Uses detail about at least two wives', 'Gives a second type of reason (politics, alliances or feelings)', 'Links reasons to what happened to the marriages'],
      },
    ],
  },

  // ------------------------------------------------------------------ Reformation
  {
    skill: 'tudors.reformation',
    title: 'the Reformation',
    events: [
      E(1517, 'Martin Luther publishes his 95 Theses'),
      E(1521, 'The Pope gives Henry VIII the title "Defender of the Faith"'),
      E(1526, "William Tyndale's English New Testament is printed"),
      E(1534, 'The Act of Supremacy makes Henry VIII head of the Church of England'),
      E(1539, 'The Great Bible in English is placed in churches'),
      E(1549, 'The first English Book of Common Prayer is introduced'),
    ],
    people: [
      { n: 'Martin Luther', did: 'was a German monk whose criticism of the Catholic Church began the Reformation' },
      { n: 'William Tyndale', did: 'translated the New Testament into English and was executed for heresy in 1536' },
      { n: 'John Calvin', did: 'was a French Protestant reformer based in Geneva' },
      { n: 'Pope Leo X', did: 'was the Pope who excommunicated Martin Luther' },
    ],
    terms: [
      { t: 'Reformation', d: 'the split in the Western Church in the 1500s that created Protestant churches' },
      { t: 'Protestant', d: 'a Christian who broke away from the Catholic Church, following reformers like Luther' },
      { t: 'indulgence', d: 'a pardon sold by the Church that was said to reduce time in purgatory' },
      { t: 'heresy', d: 'beliefs that go against the official teaching of the Church' },
      { t: '95 Theses', d: "Luther's list of arguments against the sale of indulgences" },
    ],
    sorts: [
      {
        cats: ['Catholic', 'Protestant'],
        ask: ['a Catholic belief', 'a Protestant belief'],
        q: 'Is this a Catholic or a Protestant belief?',
        hint: 'Protestants wanted a simpler Church based on the Bible, in people’s own language.',
        ex: 'Protestants rejected the Pope’s authority and wanted plainer churches and the Bible in their own language.',
        items: [
          ['Services and the Bible should be in Latin', 0],
          ['The Pope is the head of the Church', 0],
          ['Priests should not marry', 0],
          ['Churches should be richly decorated with statues and paintings', 0],
          ['During Mass the bread and wine become the body and blood of Christ', 0],
          ['There are seven sacraments', 0],
          ["The Bible and services should be in people's own language", 1],
          ['Faith alone, not good deeds or payments to the Church, brings salvation', 1],
          ['Priests should be allowed to marry', 1],
          ['Churches should be plain and simple', 1],
          ['There are only two sacraments: baptism and communion', 1],
          ['There is no such place as purgatory', 1],
        ],
      },
    ],
    facts: [
      F([1, 2], 'What was the main thing Luther objected to in 1517?', 'The sale of indulgences', [
        'The building of castles',
        'Magna Carta',
        ['Church services in German', 'The Catholic Church used Latin; Luther wanted services in German.'],
      ], 'People paid money hoping to spend less time in purgatory.', 'Luther’s 95 Theses attacked the sale of indulgences, which he said could not buy forgiveness.'),
      F([2, 3], 'How did the printing press help the Reformation spread?', "Luther's ideas and Bibles in local languages could be copied quickly and cheaply", [
        'It let the Pope ban books more easily',
        'It was invented by Martin Luther',
        'It meant nobody needed to read any more',
      ], 'Before printing, books were copied by hand.', 'Printing meant pamphlets and Bibles could be produced in thousands, so new ideas spread fast across Europe.'),
      F([3, 4], 'Why did Henry VIII receive the title "Defender of the Faith" in 1521?', 'He wrote a book attacking Luther and defending the Pope', [
        'He broke with Rome',
        ['He made himself head of the Church', 'That came later, in 1534.'],
        'He closed the monasteries',
      ], 'At first Henry was a strong supporter of the Catholic Church.', 'The Pope rewarded Henry for a book defending Catholic teaching against Luther. British monarchs still use the title.'),
      F([3, 4], 'Why did many Protestants want the Bible in English?', "So ordinary people could read God's word for themselves, without relying on priests", [
        'Because Latin had been banned by Parliament',
        'So that it could be sold to the Pope',
        'Because English was the language of the Church in Rome',
      ], 'Protestants believed the Bible was the key to faith.', 'Protestants believed everyone should be able to read the Bible. Most people could not understand Latin.'),
      F([4, 5], 'Why did some rulers in Europe support the Reformation?', 'Breaking from Rome gave them control of the Church and its wealth in their lands', [
        'The Pope paid them to become Protestant',
        'Protestant churches paid no attention to rulers',
        'It made them the new Pope',
      ], 'Think about power and money as well as belief.', 'As well as religious belief, rulers gained power over the Church and its land and money by breaking with Rome.'),
    ],
    reveals: [
      {
        prompt: 'Describe two differences between Catholic and Protestant beliefs in the 1500s.',
        hint: 'You could compare leadership of the Church, language, churches, priests or how people reach heaven.',
        model:
          'One difference was about authority. Catholics believed the Pope was head of the Church, but Protestants rejected the Pope and believed the Bible was the most important authority. A second difference was about language and worship. Catholic services and the Bible were in Latin, and churches were richly decorated, while Protestants wanted the Bible and services in people’s own language and plainer churches.',
        checklist: ['Identifies one difference', 'Explains both the Catholic and the Protestant side of it', 'Identifies a second difference', 'Explains both sides of the second difference'],
      },
    ],
  },

  // ------------------------------------------------------------------ Break with Rome
  {
    skill: 'tudors.break-with-rome',
    title: 'the break with Rome',
    events: [
      E(1529, 'Cardinal Wolsey falls from power'),
      E(1533, "Archbishop Cranmer declares Henry's first marriage invalid"),
      E(1534, 'The Act of Supremacy makes Henry VIII head of the Church of England', { key: true }),
      E(1535, 'Thomas More is executed for refusing to accept Henry as head of the Church'),
      E(1536, 'The dissolution of the smaller monasteries begins'),
      E(1540, 'The last monasteries are closed'),
    ],
    people: [
      { n: 'Thomas Wolsey', did: "was the cardinal who failed to get the Pope to annul Henry's first marriage" },
      { n: 'Thomas Cromwell', did: 'was the chief minister who organised the dissolution of the monasteries' },
      { n: 'Thomas Cranmer', did: "was the Archbishop of Canterbury who declared Henry's first marriage invalid" },
      { n: 'Thomas More', did: 'was a former Lord Chancellor executed for refusing to accept Henry as head of the Church' },
      { n: 'Robert Aske', did: 'led the Pilgrimage of Grace, a northern rising against the religious changes' },
    ],
    terms: [
      { t: 'annulment', d: 'a declaration that a marriage was never valid' },
      { t: 'Act of Supremacy', d: 'the 1534 law making the monarch Supreme Head of the Church of England' },
      { t: 'dissolution', d: 'closing down; used for Henry VIII closing the monasteries' },
      { t: 'Pilgrimage of Grace', d: "a large rising in the north in 1536 against Henry's religious changes" },
    ],
    links: [
      { c: 'Catherine of Aragon had no surviving son', e: 'Henry wanted his marriage annulled' },
      { c: 'The Pope refused to annul the marriage', e: 'Henry broke with Rome' },
      { c: 'Henry needed money and wanted to weaken support for the Pope', e: 'The monasteries were closed and their land sold' },
      { c: 'The monasteries in the north were closed', e: 'The Pilgrimage of Grace broke out' },
    ],
    facts: [
      F([1, 2], 'Who became head of the Church in England after the break with Rome?', 'The king, Henry VIII', [
        ['The Pope', 'The Pope had been head of the Church; the break with Rome ended that.'],
        'The Archbishop of York',
        'Parliament',
      ], 'The Act of Supremacy, 1534.', 'The Act of Supremacy made Henry Supreme Head of the Church of England.'),
      F([2, 3], "Why did the Pope refuse to annul Henry's marriage to Catherine of Aragon?", "He was under the control of Catherine's nephew, the Emperor Charles V", [
        'He had never heard of Henry VIII',
        'He wanted to marry Catherine himself',
        'He thought Henry already had a son',
      ], 'Catherine had very powerful relatives.', 'In 1527 the armies of Charles V, Catherine’s nephew, had sacked Rome. The Pope could not risk angering him.'),
      F([2, 3], 'Why did Henry close the monasteries?', 'To take their wealth and land, and to remove support for the Pope', [
        'Because the monks had all died of plague',
        'To build factories on the land',
        'Because the Pope asked him to',
      ], 'Monasteries were rich and loyal to Rome.', 'Thomas Cromwell’s inspectors reported on monasteries, and between 1536 and 1540 all were closed. Their land and treasures went to the crown.'),
      F([3, 4], 'Was Henry VIII a Protestant?', 'Not really: he broke with the Pope but kept many Catholic beliefs and services', [
        ['Yes, he followed all of Luther’s ideas', 'Henry kept the Latin Mass and many Catholic beliefs.'],
        'Yes, he was the first Protestant in the world',
        'No, he stayed loyal to the Pope all his life',
      ], 'Breaking with the Pope is not the same as changing beliefs.', 'Henry made himself head of the Church but kept most Catholic teaching. England became properly Protestant under his son Edward VI.'),
      F([3, 4], 'What happened to the land of the monasteries?', 'Most was sold or given to nobles and gentry, who then had a reason to support the break with Rome', [
        'It was given back to the Pope',
        'It was shared among the monks',
        'It was left empty for ever',
      ], 'Think about who could afford to buy land.', 'Landowners who bought monastery land had a stake in the new Church and would not want the Pope back.'),
      F([4, 5], 'How did Henry deal with the Pilgrimage of Grace in 1536?', 'He promised to listen to the rebels, then had the leaders, including Robert Aske, executed', [
        'He agreed to reopen all the monasteries',
        'He gave Robert Aske a top job in government',
        'He ignored it and it ended by itself',
      ], 'Henry made promises he did not keep.', 'Henry promised a pardon and a hearing. After further unrest in 1537 he broke his promises and about 200 rebels, including Aske, were executed.'),
      F([4, 5], 'Why might the dissolution of the monasteries have hurt poor people in some areas?', 'Monasteries had given food, care and shelter to the poor and sick', [
        'Monasteries had paid all the peasants’ taxes',
        'Monks had been the only farmers',
        'Poor people had lived in the monasteries for free',
      ], 'What did monasteries do besides prayer?', 'Monasteries gave alms and ran hospitals. When they closed, some places lost an important source of help.'),
    ],
    reveals: [
      {
        prompt: 'Explain why Henry VIII broke with Rome.',
        hint: 'Think about the marriage and the need for a son, the Pope’s position, money, and power.',
        model:
          'The main reason was that Henry wanted his marriage to Catherine of Aragon annulled. She had not given him a surviving son and he wanted to marry Anne Boleyn. The Pope refused, partly because he was under the control of Catherine’s nephew Charles V. So Henry made himself head of the Church with the Act of Supremacy in 1534, and Archbishop Cranmer ended the marriage. There were other reasons too: breaking with Rome gave Henry more power and let him take the wealth of the monasteries, and some advisers, such as Cranmer, were sympathetic to Protestant ideas.',
        checklist: ['Explains the marriage and the need for a son', 'Explains why the Pope refused', 'Gives at least one other reason (money, power, religion)', 'Uses specific detail such as the Act of Supremacy, 1534'],
      },
    ],
  },

  // ------------------------------------------------------------------ Edward VI and Mary I
  {
    skill: 'tudors.edward-mary',
    title: 'the reigns of Edward VI and Mary I',
    events: [
      E(1547, 'Edward VI becomes king at the age of nine'),
      E(1549, 'The first English Book of Common Prayer is introduced'),
      E(1553, 'Edward VI dies and Lady Jane Grey is proclaimed queen'),
      E(1554, 'Mary I marries Philip of Spain'),
      E(1555, 'Mary I begins burning Protestants as heretics'),
      E(1556, 'Archbishop Cranmer is burned at the stake'),
      E(1558, 'Mary I dies and Elizabeth becomes queen'),
    ],
    people: [
      { n: 'Edward VI', did: 'was the boy king whose government made England more Protestant' },
      { n: 'Lady Jane Grey', did: 'was proclaimed queen in 1553 and overthrown after about nine days' },
      { n: 'Mary I', did: 'was the Catholic queen who married Philip of Spain' },
      { n: 'Duke of Northumberland', did: "ran Edward VI's government and tried to make Lady Jane Grey queen" },
      { n: 'John Foxe', did: 'wrote a famous book about the Protestants burned under Mary I' },
    ],
    terms: [
      { t: 'heretic', d: 'someone who holds beliefs the official Church condemns' },
      { t: 'Book of Common Prayer', d: 'the English service book first introduced in 1549' },
      { t: 'Bloody Mary', d: 'a nickname for Mary I given by later Protestant writers' },
    ],
    sorts: [
      {
        cats: ['Edward VI', 'Mary I'],
        ask: ['a change made under Edward VI', 'a change made under Mary I'],
        q: 'Did this happen under Edward VI or under Mary I?',
        hint: 'Edward was Protestant; Mary was Catholic.',
        ex: 'Edward VI’s government made England Protestant; Mary I brought back Catholicism. This is called the religious see-saw.',
        items: [
          ['Services were held in English using the Book of Common Prayer', 0],
          ['Priests were allowed to marry', 0],
          ['Statues and wall paintings were removed from churches', 0],
          ['The Pope became head of the Church in England again', 1],
          ['The Latin Mass was brought back', 1],
          ['Nearly 300 Protestants were burned as heretics', 1],
          ['Married priests had to give up their wives or lose their jobs', 1],
        ],
      },
    ],
    facts: [
      F([1, 2], 'Which Tudor monarch was given the nickname "Bloody Mary"?', 'Mary I', [
        ['Mary, Queen of Scots', 'Mary, Queen of Scots was Elizabeth I’s Scottish cousin, a different person.'],
        'Elizabeth I',
        'Catherine of Aragon',
      ], 'She burned Protestants as heretics.', 'Mary I, daughter of Henry VIII and Catherine of Aragon, had nearly 300 Protestants burned.'),
      F([2, 3], 'Why is the period of Edward VI and Mary I called a religious see-saw?', 'England switched from Protestant under Edward to Catholic under Mary, then back under Elizabeth', [
        'Both rulers were Protestant',
        'Both rulers were Catholic',
        'They took turns to rule each year',
      ], 'Think about which way each ruler pushed religion.', 'Each new ruler reversed the last one’s religion, so ordinary people had to change how they worshipped several times.'),
      F([3, 4], "Why was Mary I's marriage to Philip of Spain unpopular?", 'People feared England would be ruled by Spain and dragged into Spanish wars', [
        'Philip was a Protestant',
        'Philip was too young to marry',
        'Philip wanted to close the monasteries again',
      ], 'Spain was the most powerful country in Europe.', 'Many feared a foreign king. In 1554 Thomas Wyatt led a rebellion against the marriage.'),
      F([3, 4], 'Why do some historians say Mary I’s reputation is unfair?', "Protestant writers, such as John Foxe, shaped the 'Bloody Mary' image after she died", [
        'Mary never burned anyone',
        'Mary was actually a Protestant',
        'Mary ruled for over forty years',
      ], 'Who wrote the history of her reign?', 'Foxe’s Book of Martyrs, published under Elizabeth, made Mary a villain. Some historians point out that she also tried to reform the Church and that other rulers punished religious opponents too.'),
      F([4, 5], "Why did Mary's burning of Protestants backfire?", 'The victims were seen as martyrs, which made Protestantism more popular in some areas', [
        'It made everyone in England Catholic',
        'It made Philip of Spain become Protestant',
        'It caused the Pope to resign',
      ], 'How did crowds see people who died bravely for their faith?', 'Public burnings made some victims, such as Cranmer, into martyrs and turned people against Mary’s Catholic Church.'),
    ],
    reveals: [
      {
        prompt: 'Describe two changes to religion in England under Edward VI and Mary I.',
        hint: 'Pick one change from each reign, with a detail for each.',
        model:
          'Under Edward VI, England became more Protestant. In 1549 the Book of Common Prayer brought in services in English, priests were allowed to marry and statues were removed from churches. Under Mary I, England became Catholic again. The Pope was restored as head of the Church, the Latin Mass returned, and nearly 300 Protestants, including Archbishop Cranmer, were burned as heretics.',
        checklist: ['Describes a change under Edward VI', 'Gives a supporting detail for the Edward VI change', 'Describes a change under Mary I', 'Gives a supporting detail for the Mary I change'],
      },
    ],
  },

  // ------------------------------------------------------------------ Elizabeth I
  {
    skill: 'tudors.elizabeth',
    title: 'the reign of Elizabeth I',
    events: [
      E(1558, 'Elizabeth I becomes queen', { key: true }),
      E(1559, 'The Elizabethan religious settlement'),
      E(1568, 'Mary, Queen of Scots flees to England'),
      E(1570, 'The Pope excommunicates Elizabeth I'),
      E(1577, 'Francis Drake sets off on his voyage around the world'),
      E(1587, 'Mary, Queen of Scots is executed'),
      E(1599, 'The Globe Theatre opens in London'),
      E(1603, 'Elizabeth I dies and James VI of Scotland becomes James I of England', { key: true }),
    ],
    people: [
      { n: 'Mary, Queen of Scots', did: "was Elizabeth's Catholic cousin, executed in 1587 for plotting" },
      { n: 'Francis Walsingham', did: "was Elizabeth's spymaster, who uncovered plots against her" },
      { n: 'William Cecil', did: "was Elizabeth's chief adviser for most of her reign" },
      { n: 'William Shakespeare', did: 'was a playwright whose plays were performed at the Globe Theatre' },
      { n: 'Walter Raleigh', did: 'organised early attempts to set up an English colony in North America' },
      { n: 'Francis Drake', did: 'was the first Englishman to sail around the world' },
    ],
    terms: [
      { t: 'religious settlement', d: "Elizabeth's 1559 laws creating a Protestant Church of England with some Catholic features" },
      { t: 'recusant', d: 'a Catholic who refused to attend Church of England services' },
      { t: 'Golden Age', d: "a time seen as especially successful, often used for Elizabeth's reign" },
    ],
    facts: [
      F([1, 2], "Who was Elizabeth I's mother?", 'Anne Boleyn', [
        ['Catherine of Aragon', 'Catherine of Aragon was the mother of Mary I.'],
        ['Jane Seymour', 'Jane Seymour was the mother of Edward VI.'],
        'Catherine Parr',
      ], 'She was Henry VIII’s second wife.', 'Elizabeth was the daughter of Henry VIII and Anne Boleyn, who was executed when Elizabeth was two.'),
      F([2, 3], "Why was the question of Elizabeth's marriage so important to her advisers?", 'They wanted her to have an heir so there would be no succession crisis', [
        'The law said a queen had to marry within a year',
        'They wanted her to marry the Pope',
        'They hoped she would move abroad',
      ], 'What happens when a ruler dies with no children?', 'Without an heir, there could be a dispute over the throne, perhaps even civil war. Elizabeth never married, and James VI of Scotland succeeded her.'),
      F([2, 3], "What was the 'middle way' in Elizabeth's religious settlement?", 'A Protestant Church with some Catholic features, such as bishops and some ceremonies', [
        'A Catholic Church with the Pope as head',
        'Allowing people to have no religion',
        'Two separate Churches with equal power',
      ], 'Elizabeth wanted to keep as many people as possible on side.', 'The 1559 settlement made Elizabeth Supreme Governor of a Protestant Church but kept bishops, vestments and some ceremonies, to avoid upsetting Catholics too much.'),
      F([3, 4], 'Why was Mary, Queen of Scots a threat to Elizabeth?', 'She was a Catholic with a strong claim to the English throne, so plotters wanted to make her queen', [
        'She had a larger army than Elizabeth',
        'She was Elizabeth’s older sister',
        'She was married to the Pope',
      ], 'Who would become queen if Elizabeth were killed?', 'Mary was Elizabeth’s cousin and next in line. Catholic plots, such as the Babington Plot, aimed to put her on the throne.'),
      F([3, 4], 'Why was Mary, Queen of Scots executed in 1587?', 'Letters showed she had approved a plot to kill Elizabeth', [
        'She tried to lead an army into London',
        'She refused to become a Protestant',
        'She was blamed for the Armada',
      ], 'Walsingham’s spies read her secret letters.', 'Walsingham intercepted coded letters in which Mary approved the Babington Plot. After a long delay, Elizabeth signed her death warrant.'),
      F([4, 5], "Why is Elizabeth's reign called a 'Golden Age', and why do some historians question this?", 'Culture and exploration flourished, but many people were poor and Catholics were persecuted', [
        'Gold was discovered in England, but it ran out',
        'England conquered France, but lost it again',
        'Everyone became rich, but only in London',
      ], 'Think of Shakespeare and Drake, but also of ordinary people.', 'The age of Shakespeare and Drake was later celebrated, but there were bad harvests, poverty and harsh laws against Catholics.'),
    ],
    reveals: [
      {
        prompt: 'Explain why Mary, Queen of Scots was a threat to Elizabeth I.',
        hint: 'Think about her claim to the throne, her religion and the plots linked to her.',
        model:
          'Mary was a threat because she had a strong claim to the English throne: she was Elizabeth’s cousin and next in line. She was also Catholic, so English Catholics and foreign Catholic powers such as Spain could see her as a better queen than the Protestant Elizabeth. After she fled to England in 1568, she became the focus of plots, such as the Babington Plot of 1586, which planned to kill Elizabeth and make Mary queen. This is why she was executed in 1587.',
        checklist: ['Explains her claim to the throne', 'Explains the importance of her religion', 'Mentions a plot or foreign support', 'Uses specific dates or names'],
      },
    ],
  },

  // ------------------------------------------------------------------ Armada
  {
    skill: 'tudors.armada',
    title: 'the Spanish Armada',
    events: [
      E(1585, 'England sends soldiers to help Dutch Protestants fight Spain'),
      E(1587, 'Drake attacks Spanish ships in Cadiz harbour'),
      E(1588, 'The Spanish Armada sails against England', { key: true }),
      E(1558, 'Elizabeth I becomes queen'),
    ],
    seqs: [
      {
        prompt: 'Put these events of the Armada campaign of 1588 in order.',
        items: [
          'The Armada sails from Spain',
          'The English and Spanish fleets fight running battles in the Channel',
          'The Armada anchors off Calais',
          'English fireships scatter the Spanish fleet at night',
          'The Battle of Gravelines',
          'Storms wreck many Spanish ships as they sail home around Scotland and Ireland',
        ],
        direction: ['Start', 'End'],
        hint: 'The Armada had to anchor before the fireships could be sent in.',
        ex: 'The Armada sailed up the Channel, anchored off Calais, was scattered by fireships, fought at Gravelines and was then wrecked by storms on the long voyage home.',
      },
    ],
    people: [
      { n: 'Duke of Medina Sidonia', did: 'commanded the Spanish Armada' },
      { n: 'Lord Howard of Effingham', did: 'commanded the English fleet against the Armada' },
      { n: 'Duke of Parma', did: 'commanded the Spanish army in the Netherlands that the Armada was meant to collect' },
    ],
    terms: [
      { t: 'armada', d: 'a fleet of warships' },
      { t: 'fireship', d: 'a ship set on fire and sent towards enemy ships' },
      { t: 'galleon', d: 'a large sailing warship' },
    ],
    facts: [
      F([1, 2], 'Which country sent the Armada against England in 1588?', 'Spain', [
        'France',
        ['The Netherlands', 'England was helping Dutch Protestants fight against Spain.'],
        'Scotland',
      ], 'Its king had once been married to Mary I.', 'Philip II of Spain sent the Armada to invade England.'),
      F([2, 3], 'Why did Philip II of Spain send the Armada?', 'To overthrow Protestant Elizabeth and stop English help to the Dutch and attacks on Spanish ships', [
        'To rescue Mary, Queen of Scots from the Tower',
        'To make Elizabeth his ally against France',
        'To bring back the Spanish ambassador',
      ], 'Think about religion, the Netherlands and English sailors like Drake.', 'Philip, a Catholic, wanted to end Elizabeth’s Protestant rule. England was helping the Dutch rebels, and English sailors raided Spanish treasure ships.'),
      F([2, 3], 'What did the English send into the Spanish fleet at Calais at night?', 'Fireships', ['Submarines', 'Rowing boats full of soldiers', 'Barrels of gunpowder on rafts'], 'Wooden ships were terrified of one thing.', 'Eight fireships were sent in. The Spanish cut their anchors to escape, breaking their tight formation.'),
      F([3, 4], 'Why did the Spanish Armada fail?', "English fireships broke its formation, it could not join the Duke of Parma's army, and storms wrecked many ships", [
        'Elizabeth I led the English fleet into battle herself',
        'The Spanish ships had no guns',
        'Spain changed its mind and called it back before it set sail',
      ], 'There were several reasons, not just one.', 'The Armada could not link up with Parma’s army, was broken up by fireships, beaten at Gravelines and then wrecked by storms on the way home.'),
      F([3, 4], "In Source G, why does Elizabeth say she has 'the heart and stomach of a king'?", 'To show her troops she was brave enough to lead them, even as a woman', [
        'Because she wanted to become a man',
        'To show that she was ill',
        'To announce she was getting married',
      ], 'She was speaking to soldiers waiting for a Spanish invasion.', 'Elizabeth admits she has the "body of a weak and feeble woman" but claims a king’s courage, to inspire her soldiers at Tilbury.', SRC.tilbury),
      F([4, 5], 'Why did the defeat of the Armada matter to England?', "It kept England Protestant and independent, and boosted Elizabeth's reputation", [
        'It made England the ruler of Spain',
        'It ended all war with Spain at once',
        'It made England Catholic again',
      ], 'What would a Spanish victory have meant?', 'A Spanish victory could have put a Catholic ruler on the throne. The defeat became a source of national pride, though the war with Spain went on until 1604.'),
      F([3, 5], 'Which reason for the Armada’s defeat was outside anyone’s control?', 'The storms on the voyage home', [
        'The use of fireships at Calais',
        'English ships having longer-range guns',
        'The Spanish failing to meet up with Parma’s army',
      ], 'Which reason was not a human decision?', 'Storms off Scotland and Ireland wrecked many ships. Elizabeth’s government used this in propaganda, saying God had sent the wind.'),
    ],
    reveals: [
      {
        prompt: 'Explain why the Spanish Armada failed.',
        hint: 'Think about Spanish plans and problems, English tactics, and the weather. Which mattered most?',
        model:
          'The Armada failed partly because of its plan: it had to meet the Duke of Parma’s army in the Netherlands, but there was no deep-water port where they could join up, so it waited off Calais. The English then used fireships at night, which made the Spanish cut their anchors and broke their crescent formation. At the Battle of Gravelines English ships attacked the scattered fleet. Finally, storms wrecked many ships as they sailed home around Scotland and Ireland. I think the failure to link up with Parma mattered most, because it left the Armada exposed at Calais.',
        checklist: ['Gives at least two reasons', 'Includes English tactics (fireships, Gravelines)', 'Includes Spanish problems or the weather', 'Uses specific detail', 'Says which reason mattered most'],
      },
      {
        prompt: 'What can you learn from Source G about Elizabeth I?',
        src: SRC.tilbury,
        hint: 'Make an inference about how she presented herself, and back it up with her words.',
        model:
          'Source G suggests that Elizabeth was a skilled speaker who knew how to inspire her soldiers. She admits she has "the body of a weak and feeble woman", which shows she knew some people doubted a woman could lead in war, but then claims "the heart and stomach of a king". This suggests she wanted to appear brave and determined. Saying "a king of England too" also shows she presented herself as standing for the whole country.',
        checklist: ['Makes an inference about Elizabeth', 'Supports it with a short quotation', 'Uses the context (1588, the Armada, Tilbury)', 'Explains what the words suggest, not just what they say'],
      },
    ],
  },

  // ------------------------------------------------------------------ Gunpowder Plot
  {
    skill: 'stuarts.gunpowder',
    title: 'James I and the Gunpowder Plot',
    events: [
      E(1603, 'James VI of Scotland becomes James I of England', { key: true }),
      E(1604, 'The Hampton Court Conference on religion'),
      E(1605, 'The Gunpowder Plot is discovered', { key: true, note: 'on the night of 4 to 5 November' }),
      E(1606, 'Guy Fawkes and other plotters are executed'),
      E(1611, 'The King James Bible is published'),
    ],
    seqs: [
      {
        prompt: 'Put the stages of the Gunpowder Plot in order.',
        items: [
          'Robert Catesby gathers a group of Catholic plotters',
          'The plotters rent a cellar under the House of Lords',
          'Barrels of gunpowder are moved into the cellar',
          'Lord Monteagle receives an anonymous letter warning him to stay away',
          'Guy Fawkes is arrested in the cellar',
          'The other plotters are caught or killed at Holbeche House',
        ],
        direction: ['First', 'Last'],
        hint: 'The plot was discovered only days before Parliament was due to open.',
        ex: 'Catesby planned the plot in 1604; the cellar was rented and filled in 1605; Monteagle’s letter came in late October; Fawkes was arrested on the night of 4-5 November; the rest were cornered at Holbeche House days later.',
      },
    ],
    people: [
      { n: 'Robert Catesby', did: 'was the leader of the Gunpowder Plot' },
      { n: 'Guy Fawkes', did: 'was caught guarding the gunpowder under the House of Lords' },
      { n: 'Lord Monteagle', did: 'was the Catholic lord who received a letter warning him to stay away from Parliament' },
      { n: 'Robert Cecil', did: "was James I's chief minister, who some historians suspect knew about the plot early" },
      { n: 'James I', did: 'was the king the plotters planned to kill' },
    ],
    terms: [
      { t: 'treason', d: 'the crime of betraying your country or ruler' },
      { t: 'conspiracy', d: 'a secret plan by a group to do something unlawful' },
    ],
    facts: [
      F([1, 2], 'What did the Gunpowder plotters plan to blow up?', 'The House of Lords during the opening of Parliament, with the king inside', [
        'The Tower of London',
        'St Paul’s Cathedral',
        'The Spanish Armada',
      ], 'The king would be there to open Parliament.', 'They planned to blow up the House of Lords at the State Opening of Parliament on 5 November 1605, killing James I.'),
      F([2, 3], 'Why did the plotters want to kill James I?', 'They were Catholics angry that James had not given Catholics more freedom', [
        'They wanted Parliament to be abolished',
        'They were Puritans who thought James was too Catholic',
        'They wanted Guy Fawkes to be king',
      ], 'Catholics had hoped for better treatment under James.', 'Catholics had hoped James would ease the laws against them. When he did not, a group led by Robert Catesby planned to kill him and put a Catholic on the throne.'),
      F([1, 3], 'Was Guy Fawkes the leader of the Gunpowder Plot?', 'No: the leader was Robert Catesby; Fawkes was the explosives expert caught in the cellar', [
        ['Yes, he planned the whole thing', 'Fawkes is the most famous plotter because he was caught with the gunpowder.'],
        'No: the leader was King James',
        'No: there was no leader',
      ], 'Fawkes is famous because he was caught red-handed.', 'Robert Catesby led the plot. Fawkes had military experience with explosives and guarded the gunpowder.'),
      F([2, 3], 'Why is 5 November still marked with bonfires?', "In 1606 Parliament ordered a yearly celebration of the king's escape", [
        'It marks the end of the Civil War',
        'It celebrates Guy Fawkes becoming king',
        'It marks the day the Armada was defeated',
      ], 'People were told to give thanks every year.', 'A law of 1606 ordered annual thanksgiving for the failure of the plot. Bonfires became part of the tradition.'),
      F([3, 4], 'How was the Gunpowder Plot discovered?', 'An anonymous letter warned Lord Monteagle to stay away, and he showed it to the government', [
        'Guy Fawkes confessed before it happened',
        'A spy from Spain told the king',
        'The gunpowder exploded early',
      ], 'One plotter may have wanted to protect a friend.', 'Monteagle passed the warning letter to Robert Cecil. The cellars were searched and Fawkes was arrested.'),
      F([3, 4], 'What happened to Catholics in England after the plot?', 'Harsher laws were passed against them, and suspicion of Catholics grew', [
        'They were given full freedom of worship',
        'They took over the government',
        'Nothing changed for them',
      ], 'How would most people react to a Catholic plot to kill the king?', 'New laws in 1606 restricted Catholics further, and anti-Catholic feeling lasted for generations.'),
      F([4, 5], 'Why do some historians suggest the government may have known about the plot earlier than it said?', 'Exposing a Catholic plot was very useful to Robert Cecil, and some details are suspicious', [
        'The government built the cellar',
        'Guy Fawkes worked for the government',
        'There was never any gunpowder',
      ], 'Who benefited from the plot being discovered dramatically?', 'Some historians think Cecil may have let the plot develop to discredit Catholics. There is no proof; most historians accept the plot was real.'),
    ],
    reveals: [
      {
        prompt: 'Explain why the Gunpowder Plot failed.',
        hint: 'Think about the warning letter, the government’s spies and what happened on the night.',
        model:
          'The plot failed mainly because of the anonymous letter to Lord Monteagle, warning him not to attend Parliament. Monteagle showed it to Robert Cecil, the king’s chief minister, so the government knew something was planned. The cellars under the House of Lords were searched on the night of 4 November, and Guy Fawkes was found with the gunpowder. The more people who knew about the plot, the harder it was to keep secret. Under questioning, Fawkes eventually named others, and the remaining plotters were caught or killed at Holbeche House.',
        checklist: ['Mentions the Monteagle letter', 'Explains how the government acted on it', 'Uses specific detail (names, dates, places)', 'Explains why secrecy was hard or links the reasons'],
      },
    ],
  },

  // ------------------------------------------------------------------ Civil War causes
  {
    skill: 'stuarts.civil-war-causes',
    title: 'the causes of the English Civil War',
    events: [
      E(1625, 'Charles I becomes king'),
      E(1629, 'Charles I begins ruling without Parliament'),
      E(1634, 'Charles starts collecting ship money'),
      E(1637, 'Charles tries to force a new prayer book on Scotland'),
      E(1640, 'Charles recalls Parliament to pay for war with Scotland'),
      E(1642, 'Charles tries to arrest five MPs in the House of Commons'),
    ],
    people: [
      { n: 'Charles I', did: 'was the Stuart king who believed in the Divine Right of Kings and fought against Parliament' },
      { n: 'William Laud', did: 'was the Archbishop of Canterbury whose changes made churches look more Catholic to Puritans' },
      { n: 'John Hampden', did: 'was an MP who refused to pay ship money' },
      { n: 'John Pym', did: 'was a leading MP and one of the five MPs Charles tried to arrest' },
      { n: 'Henrietta Maria', did: "was Charles I's French Catholic queen" },
    ],
    terms: [
      { t: 'Divine Right of Kings', d: 'the belief that kings are chosen by God and answer only to God' },
      { t: 'ship money', d: "a tax for the navy that Charles collected without Parliament's agreement" },
      { t: 'Personal Rule', d: 'the years 1629 to 1640, when Charles ruled without Parliament' },
      { t: 'MP', d: 'a Member of Parliament, sitting in the House of Commons' },
    ],
    sorts: [
      {
        cats: ['Money', 'Religion', 'Power'],
        ask: ['mainly about money', 'mainly about religion', 'mainly about power'],
        q: 'Was this cause of the Civil War mainly about money, religion or power?',
        hint: 'Money = taxes and fines. Religion = worship and the Church. Power = who should rule and how.',
        ex: 'Historians often group the causes of the Civil War into money, religion and power, and show how they linked.',
        items: [
          ['Charles was short of money and fined landowners who had not become knights', 0],
          ['Charles needed money to pay for a war against Scotland', 0],
          ['Archbishop Laud made churches more decorated, which Puritans saw as Catholic', 1],
          ['Charles married a French Catholic princess', 1],
          ['Charles tried to force a new prayer book on Scotland', 1],
          ['Charles believed in the Divine Right of Kings', 2],
          ['Charles ruled without Parliament for eleven years', 2],
          ['Charles tried to arrest five MPs in the House of Commons', 2],
        ],
      },
    ],
    facts: [
      F([2, 3], 'Why did ship money make people so angry?', "Charles collected it every year, even from inland counties, without Parliament's agreement", [
        'It was spent on building ships for Spain',
        'Only the poor had to pay it',
        'It was collected by the Pope',
      ], 'Ship money was an old tax, but Charles used it in a new way.', 'Ship money was traditionally raised from coastal areas in emergencies. Charles collected it everywhere, every year, during his Personal Rule.'),
      F([2, 3], "Why did Archbishop Laud's changes worry Puritans?", 'They made churches more decorated, which Puritans feared was a step back towards Catholicism', [
        'He closed all the churches',
        'He made services shorter',
        'He banned the Bible',
      ], 'Puritans wanted plain churches.', 'Laud moved altars, added rails and decoration and stressed ceremony. Puritans saw this as Catholic, especially with a Catholic queen at court.'),
      F([3, 4], 'Why did Charles have to recall Parliament in 1640?', 'He needed money to fight the Scots, who had rebelled against his prayer book', [
        'The Pope ordered him to',
        'He wanted Parliament to choose his successor',
        'He had won a war and wanted to celebrate',
      ], 'Wars are expensive. Who could grant taxes?', 'The Scottish rebellion forced Charles to call Parliament for money after eleven years. MPs used the chance to attack his ministers and policies.'),
      F([3, 4], 'What was the trigger for the Civil War in 1642?', 'Charles marched into the House of Commons to arrest five MPs', [
        ['Charles I was executed', 'That was in 1649, at the end of the wars.'],
        'Parliament made Cromwell king',
        'The Gunpowder Plot',
      ], 'It happened in January 1642.', 'The MPs had been warned and escaped. Charles had shown he would use force against Parliament; soon he left London, and war began that summer.'),
      F([4, 5], 'Why did the Irish rebellion of 1641 increase tension between king and Parliament?', 'An army was needed, but Parliament did not trust Charles to control it', [
        'Parliament wanted to give Ireland to Spain',
        'Charles refused to send any soldiers',
        'The rebellion was led by Parliament',
      ], 'Who should command the army: king or Parliament?', 'Parliament feared Charles might turn an army against them. The argument over control of the army pushed both sides towards war.'),
    ],
    reveals: [
      {
        prompt: 'Explain why civil war broke out in England in 1642.',
        hint: 'Use money, religion and power, and the trigger. Show how they connect.',
        model:
          'One cause was money. Charles ruled without Parliament from 1629 and raised money in unpopular ways, such as ship money, which many saw as illegal. Another was religion: Archbishop Laud’s changes and Charles’s Catholic wife made Puritans fear a return to Catholicism. When Charles forced a new prayer book on Scotland, the Scots rebelled, and he had to recall Parliament in 1640 to pay for the war. This led to the deepest cause, power: Charles believed in the Divine Right of Kings, but Parliament wanted limits on him. The trigger came in January 1642, when he tried to arrest five MPs.',
        checklist: ['Explains a cause about money', 'Explains a cause about religion', 'Explains a cause about power', 'Identifies the trigger', 'Links the causes together'],
      },
    ],
  },

  // ------------------------------------------------------------------ Civil War
  {
    skill: 'stuarts.civil-war',
    title: 'the English Civil War',
    events: [
      E(1642, 'Charles I raises his standard at Nottingham, starting the Civil War', { key: true }),
      E(1644, 'Parliament wins the Battle of Marston Moor'),
      E(1645, 'The New Model Army wins the Battle of Naseby'),
      E(1646, 'Charles I surrenders to the Scots'),
      E(1648, "The Second Civil War ends in defeat for the king's supporters"),
    ],
    people: [
      { n: 'Thomas Fairfax', did: 'was the commander-in-chief of the New Model Army' },
      { n: 'Prince Rupert', did: "was the king's nephew and a famous Royalist cavalry commander" },
      { n: 'Oliver Cromwell', did: 'was a Parliamentarian cavalry commander who helped build the New Model Army' },
    ],
    terms: [
      { t: 'Roundheads', d: "a nickname for Parliament's supporters" },
      { t: 'Cavaliers', d: "a nickname for the king's supporters" },
      { t: 'New Model Army', d: "Parliament's professional, well-trained army formed in 1645" },
    ],
    facts: [
      F([1, 2], "What were the king's supporters nicknamed?", 'Cavaliers', [
        ['Roundheads', 'Roundheads was the nickname for Parliament’s supporters.'],
        'Puritans',
        'Levellers',
      ], 'The name came from a word for a horseman.', 'Royalists were called Cavaliers; Parliament’s supporters were called Roundheads, after the short hair of some London apprentices.'),
      F([2, 3], 'Which areas mostly supported Parliament?', 'London, the south-east and many ports and trading towns', [
        ['Wales and the north-west', 'These areas mostly supported the king.'],
        'Only Scotland',
        'Only Cornwall',
      ], 'Parliament held the capital.', 'Parliament controlled London and the richer south-east, while the king was strongest in the north, west and Wales.'),
      F([2, 3], 'Why did Parliament have an advantage in a long war?', 'It controlled London, the navy and richer areas, so it could raise more money', [
        'It had more cavalry than the king at the start',
        'It was supported by the Pope',
        'The king had no supporters at all',
      ], 'Wars are won by whoever can keep paying for them.', 'London’s wealth, the navy and taxes from the south-east let Parliament keep paying its armies.'),
      F([3, 4], 'What was special about the New Model Army?', 'Soldiers were full-time, well trained and paid regularly, and officers were promoted for ability', [
        'It was made up only of nobles',
        'It fought only at sea',
        'It was led by Prince Rupert',
      ], 'Before 1645 armies were often local and part-time.', 'The New Model Army was a professional army. Officers were promoted on ability rather than birth, and it had strong discipline and, often, strong Puritan faith.'),
      F([3, 4], 'Which battle in 1645 was the decisive defeat for Charles I?', 'Naseby', [
        ['Edgehill', 'Edgehill, in 1642, was the first big battle and nobody clearly won.'],
        ['Marston Moor', 'Marston Moor (1644) lost the king the north, but Naseby was decisive.'],
        'Bosworth',
      ], 'It was won by the New Model Army in its first big battle.', 'At Naseby in 1645 the New Model Army destroyed the king’s main army. Charles surrendered the next year.'),
      F([4, 5], 'Why did the Civil War sometimes divide families?', 'People chose sides for different religious, political and local reasons', [
        'The law said brothers must fight on different sides',
        'Families were paid to split up',
        'Only one person in each family was allowed to fight',
      ], 'Think about how personal the choices were.', 'Choosing a side depended on beliefs, loyalties and local pressures, so relatives, neighbours and friends sometimes ended up on opposite sides.'),
    ],
    reveals: [
      {
        prompt: 'Explain why Parliament won the English Civil War.',
        hint: 'Think about money and resources, the New Model Army, allies and leadership.',
        model:
          'Parliament won partly because it had more resources. It controlled London, the navy and the wealthy south-east, so it could raise more money and supplies than the king in a long war. Another reason was the New Model Army, formed in 1645. Its soldiers were well trained, regularly paid and led by officers like Fairfax and Cromwell who were promoted for their ability, and it won the decisive Battle of Naseby. Parliament also had the support of the Scots in 1644. Overall, money was most important, because it paid for the New Model Army.',
        checklist: ['Gives at least two reasons', 'Mentions money, London or resources', 'Mentions the New Model Army', 'Uses specific detail (battles, names, dates)', 'Explains which reason mattered most or links them'],
      },
    ],
  },

  // ------------------------------------------------------------------ Execution of Charles I
  {
    skill: 'stuarts.regicide',
    title: 'the trial and execution of Charles I',
    events: [
      E(1647, 'The army takes Charles I into its custody'),
      E(1648, "Pride's Purge removes MPs who still wanted a deal with the king"),
      E(1649, 'Charles I is executed in Whitehall', { key: true, note: 'on 30 January' }),
      E(1660, 'The monarchy is restored and surviving regicides are punished'),
    ],
    seqs: [
      {
        prompt: 'Put these events leading to the execution of Charles I in order.',
        items: [
          'Charles makes a secret deal with the Scots',
          'The Second Civil War is fought, and the Royalists lose',
          "Pride's Purge removes MPs who still wanted a deal with Charles",
          'A special High Court of Justice puts Charles on trial',
          'Charles refuses to accept that the court has the right to try him',
          'Charles is executed in Whitehall',
        ],
        direction: ['First', 'Last'],
        hint: 'The trial could only happen after the MPs who opposed it were removed.',
        ex: 'Charles’s deal with the Scots led to the Second Civil War (1648). After Pride’s Purge in December 1648, the remaining MPs set up a court; Charles refused to plead and was executed on 30 January 1649.',
      },
    ],
    people: [
      { n: 'John Bradshaw', did: 'was the judge who presided over the trial of Charles I' },
      { n: 'Thomas Pride', did: 'was the colonel who blocked MPs from entering Parliament in 1648' },
      { n: 'Oliver Cromwell', did: "signed Charles I's death warrant and was a leading figure behind the trial" },
    ],
    terms: [
      { t: 'regicide', d: 'the killing of a king, or a person who takes part in it' },
      { t: 'death warrant', d: 'the document ordering an execution' },
      { t: 'Rump Parliament', d: "the MPs left in Parliament after Pride's Purge" },
    ],
    facts: [
      F([1, 2], 'Where was Charles I executed?', 'Outside the Banqueting House in Whitehall, London', ['The Tower of London', 'Edinburgh Castle', 'Hampton Court'], 'It was a royal building in the centre of government.', 'Charles was beheaded on a scaffold outside the Banqueting House in Whitehall on 30 January 1649.'),
      F([2, 3], 'What was Charles I accused of at his trial?', 'Treason: waging war against his own people and Parliament', [
        'Stealing money from the navy',
        'Murdering Thomas Becket',
        'Plotting the Gunpowder Plot',
      ], 'He was accused of being a tyrant and traitor.', 'Charles was charged with treason as a "tyrant, traitor and murderer" for making war on his people.'),
      F([2, 3], 'How did Charles respond at his trial?', 'He refused to plead, saying the court had no right to try a king', [
        'He admitted everything and asked for mercy',
        'He did not attend',
        'He asked to be tried by the Pope',
      ], 'Remember the Divine Right of Kings.', 'Charles believed a king answered only to God, so he refused to recognise the court.'),
      F([3, 4], 'Charles I is said to have worn two shirts on the day of his execution. Why?', 'So he would not shiver in the cold and look afraid', [
        'Because it was the fashion',
        'To hide armour underneath',
        'Because he planned to escape',
      ], 'It was January.', 'It was a cold January day. Charles reportedly did not want the crowd to think he was trembling with fear.'),
      F([3, 4], 'Why did army leaders decide Charles must be put on trial?', 'He kept plotting and started a second war, so they felt they could never trust him', [
        'He had already agreed to stop being king',
        'Parliament voted unanimously for it',
        'The Scots demanded it',
      ], 'What did Charles do after losing the first war?', 'After his secret deal with the Scots caused the Second Civil War, army leaders saw Charles as "that man of blood" who could never be trusted.'),
      F([4, 5], 'Why was the execution of Charles I so shocking at the time?', 'Most people believed kings were chosen by God, and no English king had been tried and executed by his own people before', [
        'Executions were illegal in England',
        'He was the first king to die',
        'Nobody knew it was happening',
      ], 'Think about beliefs about kingship.', 'Kings had been killed before, but never put on public trial and executed in the name of the people. Many were horrified.'),
    ],
    reveals: [
      {
        prompt: 'Explain why Charles I was executed in 1649.',
        hint: 'Think about the wars, Charles’s actions after his defeat, the army and Pride’s Purge.',
        model:
          'Charles was executed because the army leaders decided he could never be trusted. After losing the first Civil War he would not make a lasting deal, and instead made a secret agreement with the Scots, which caused the Second Civil War in 1648. The army blamed him for the bloodshed. Many MPs still wanted to negotiate, but in Pride’s Purge the army removed them, leaving a Rump Parliament willing to put him on trial. At the trial Charles refused to plead, so he was found guilty of treason and beheaded on 30 January 1649.',
        checklist: ['Explains Charles’s actions after defeat (deal with the Scots, second war)', 'Explains the role of the army', 'Mentions Pride’s Purge or the trial', 'Uses specific dates or details'],
      },
    ],
  },

  // ------------------------------------------------------------------ Commonwealth
  {
    skill: 'stuarts.commonwealth',
    title: 'Cromwell and the Commonwealth',
    events: [
      E(1649, 'England becomes a republic called the Commonwealth'),
      E(1653, 'Oliver Cromwell becomes Lord Protector', { key: true }),
      E(1655, 'England is divided into regions run by army major-generals'),
      E(1657, 'Cromwell refuses the offer of the crown'),
      E(1658, 'Oliver Cromwell dies'),
      E(1660, 'Charles II returns and the monarchy is restored'),
    ],
    people: [
      { n: 'Oliver Cromwell', did: 'ruled as Lord Protector from 1653 until his death in 1658' },
      { n: 'Richard Cromwell', did: "was Oliver Cromwell's son, who briefly became Lord Protector after him" },
      { n: 'John Lilburne', did: 'was a leader of the Levellers, who wanted more men to have the vote' },
      { n: 'Gerrard Winstanley', did: 'led the Diggers, who farmed common land and wanted land shared out' },
    ],
    terms: [
      { t: 'republic', d: 'a country without a king or queen' },
      { t: 'Commonwealth', d: 'the name for England as a republic from 1649' },
      { t: 'Lord Protector', d: "Cromwell's title as head of state from 1653" },
      { t: 'Puritan', d: 'a strict Protestant who wanted to remove Catholic features and live a godly life' },
      { t: 'Levellers', d: 'a group who wanted more men to have the vote and equality before the law' },
    ],
    facts: [
      F([1, 2], 'What title did Oliver Cromwell take in 1653?', 'Lord Protector', [
        ['King', 'Cromwell refused the crown when it was offered in 1657.'],
        'Prime Minister',
        'Emperor',
      ], 'It was not a royal title.', 'Cromwell became Lord Protector in 1653 and ruled until his death in 1658.'),
      F([2, 3], 'Under Puritan rule in the 1640s and 1650s, which of these happened?', 'Theatres stayed closed and Christmas celebrations were banned', [
        'Everyone had to become Catholic',
        'All churches were knocked down',
        'Women were given the vote',
      ], 'Puritans disapproved of things they saw as ungodly.', 'Puritans closed theatres, banned Christmas celebrations and tried to stop activities they saw as sinful, though the rules were often ignored.'),
      F([3, 4], 'Why is Cromwell remembered with anger in Ireland?', 'His army killed many people, including civilians, at Drogheda and Wexford in 1649', [
        'He made Ireland a separate kingdom',
        'He moved Parliament to Dublin',
        'He refused to visit Ireland',
      ], 'He led an army into Ireland after the king’s execution.', 'Cromwell’s campaign in Ireland included massacres at Drogheda and Wexford, and much Catholic-owned land was taken.'),
      F([3, 4], "Why did the Commonwealth not last after Cromwell's death?", 'His son Richard had little support from the army, and many people wanted stability and a king again', [
        'Spain conquered England',
        'Cromwell had already named Charles II as his heir',
        'The plague killed all of Parliament',
      ], 'Who held real power in the 1650s?', 'Richard Cromwell lacked his father’s authority with the army. After a period of confusion, General Monck helped arrange the return of Charles II in 1660.'),
      F([4, 5], 'Which piece of evidence suggests Cromwell did not want to be king?', 'He refused the crown when Parliament offered it in 1657', [
        'He became Lord Protector',
        'He closed Parliament by force in 1653',
        'He was buried in Westminster Abbey',
      ], 'Look for something he turned down.', 'In 1657 Parliament offered Cromwell the crown, and he refused it, though he kept the powers of Lord Protector.'),
    ],
    reveals: [
      {
        prompt: 'Describe two features of life in England under Cromwell and the Puritans.',
        hint: 'You could describe how the country was governed, or Puritan rules about daily life.',
        model:
          'One feature was strict Puritan rules. Theatres stayed closed, Christmas celebrations were banned and swearing and working on Sundays could be punished, as Puritans wanted people to live godly lives. A second feature was the power of the army. From 1655 the country was divided into regions run by major-generals, army officers who enforced the rules and kept order, which many people resented.',
        checklist: ['Identifies one feature', 'Gives a supporting detail for it', 'Identifies a second feature', 'Gives a supporting detail for the second feature'],
      },
      {
        prompt: 'Was Oliver Cromwell a hero or a villain? Explain your view.',
        hint: 'Give evidence for both sides, then decide. Avoid one-word answers: explain.',
        model:
          'Cromwell can be seen as a hero because he was a brilliant commander who helped Parliament win the Civil War, allowed more religious freedom for Protestants and refused to make himself king in 1657. However, he can also be seen as a villain. He signed Charles I’s death warrant, closed Parliament by force in 1653 and ruled with the army’s support, and his army massacred people at Drogheda and Wexford in Ireland. Overall I think he was neither simply a hero nor a villain: he believed he was doing God’s work, but he used force against people who disagreed.',
        checklist: ['Gives evidence that he was a hero', 'Gives evidence that he was a villain', 'Uses specific detail (dates, events)', 'Reaches a supported judgement'],
      },
    ],
  },

  // ------------------------------------------------------------------ Restoration
  {
    skill: 'stuarts.restoration',
    title: 'the Restoration',
    events: [
      E(1660, 'Charles II returns and the monarchy is restored', { key: true }),
      E(1665, 'The Great Plague strikes London', { key: true }),
      E(1666, 'The Great Fire of London', { key: true, note: 'in September' }),
      E(1675, "Work starts on the new St Paul's Cathedral"),
      E(1685, 'Charles II dies and his Catholic brother becomes James II'),
    ],
    people: [
      { n: 'Charles II', did: 'was the "Merry Monarch" restored to the throne in 1660' },
      { n: 'Samuel Pepys', did: 'kept a famous diary describing the Great Plague and the Great Fire' },
      { n: 'Christopher Wren', did: "designed the new St Paul's Cathedral after the Great Fire" },
      { n: 'Thomas Farriner', did: 'was the baker in Pudding Lane where the Great Fire began' },
    ],
    terms: [
      { t: 'Restoration', d: 'the return of the monarchy in 1660' },
      { t: 'quarantine', d: 'keeping sick people apart so a disease does not spread' },
      { t: 'firebreak', d: 'a gap made by pulling down buildings to stop a fire spreading' },
    ],
    facts: [
      F([1, 2], 'Where did the Great Fire of London start in 1666?', 'In a bakery in Pudding Lane', ['In the Tower of London', "In St Paul's Cathedral", 'In Westminster Abbey'], 'It started in the early hours in a baker’s shop.', 'The fire began in Thomas Farriner’s bakery in Pudding Lane on 2 September 1666.'),
      F([2, 3], 'Why did the Great Fire spread so quickly?', 'Houses were wooden and close together, the summer had been dry and a strong wind was blowing', [
        'Someone poured oil on the streets',
        'London had too many stone buildings',
        'The fire brigade went on strike',
      ], 'Think about the buildings, the weather and the wind.', 'Timber houses with overhanging upper floors, a long dry summer and a strong east wind let the fire spread for four days.'),
      F([2, 3], 'How did people try to stop the Great Fire spreading?', 'By pulling down or blowing up houses to make firebreaks', [
        'By spraying water from fire engines with hoses',
        'By calling the army to put it out with sand',
        'By flooding the city with the Thames',
      ], 'They needed to remove the fuel.', 'With little equipment, people used hooks and later gunpowder to pull down houses and create gaps the fire could not cross.'),
      F([3, 4], 'In the Great Plague of 1665, what was done to houses where someone had the plague?', 'The family was shut inside for weeks and a red cross was painted on the door', [
        'The house was burned down immediately',
        'The family was sent to live in the Tower of London',
        'Nothing at all was done',
      ], 'This was an early form of quarantine.', 'Infected houses were locked up for 40 days with a red cross and the words "Lord have mercy upon us" on the door.'),
      F([3, 4], 'Why did Parliament agree to bring back the monarchy in 1660?', 'After Cromwell died there was confusion and fear of disorder, and many wanted stability', [
        'Spain forced England to have a king',
        'Charles II had won a great battle',
        'Cromwell asked for it in his will',
      ], 'What happened after Cromwell’s death?', 'After Richard Cromwell’s failure there was political chaos. General Monck and Parliament invited Charles II back, promising a general pardon.'),
      F([4, 5], 'How was London rebuilt after the Great Fire?', "New buildings had to be made of brick or stone, and Wren rebuilt St Paul's and many churches", [
        'It was rebuilt exactly as before, in wood',
        'It was abandoned and the capital moved to York',
        'It was left in ruins for a hundred years',
      ], 'People wanted to stop it happening again.', 'Rebuilding rules required brick or stone and wider streets. Christopher Wren designed St Paul’s Cathedral and over 50 churches.'),
      F([3, 5], 'How many deaths from the Great Fire were officially recorded?', 'Only a handful, though historians think the real number may have been higher', [
        'About 100,000',
        'Exactly 1,666',
        'Nobody was affected',
      ], 'Records at the time mostly counted named people.', 'Very few deaths were recorded, but poorer people’s deaths may not have been counted. About 13,000 houses were destroyed.'),
    ],
    reveals: [
      {
        prompt: 'Explain why the Great Fire of London caused so much damage.',
        hint: 'Think about the buildings, the weather and how people fought the fire.',
        model:
          'The fire caused so much damage because London’s houses were mostly made of wood and packed closely together, with upper floors overhanging the narrow streets, so flames jumped easily from house to house. The summer of 1666 had been dry, and a strong east wind blew the fire across the city. Firefighting was very basic: people used buckets and hooks, and the Lord Mayor was slow to order houses to be pulled down for firebreaks. As a result the fire burned for four days and destroyed about 13,000 houses and St Paul’s Cathedral.',
        checklist: ['Explains the buildings as a reason', 'Explains the weather as a reason', 'Explains the problem of firefighting', 'Uses specific detail (dates, numbers, places)'],
      },
    ],
  },

  // ------------------------------------------------------------------ Glorious Revolution
  {
    skill: 'stuarts.glorious-revolution',
    title: 'the Glorious Revolution',
    events: [
      E(1685, 'James II becomes king'),
      E(1688, "James II's son is born, giving him a Catholic heir"),
      E(1689, 'Parliament passes the Bill of Rights', { key: true }),
      E(1690, 'William III defeats James II at the Battle of the Boyne'),
      E(1707, 'The Act of Union joins England and Scotland as Great Britain', { key: true }),
      E(1714, 'Queen Anne dies and George I becomes king'),
    ],
    seqs: [
      {
        prompt: 'Put these events of the Glorious Revolution in order.',
        items: [
          'Charles II dies and James II becomes king',
          'James II gives Catholics important jobs',
          "James II's son is born",
          'Leading nobles invite William of Orange to England',
          'William lands with an army at Torbay',
          'James II flees to France',
          'William and Mary are offered the crown',
        ],
        direction: ['First', 'Last'],
        hint: 'The birth of a son was the final straw for James’s opponents.',
        ex: 'James II (from 1685) promoted Catholics; his son’s birth in June 1688 led nobles to invite William; William landed in November, James fled in December, and William and Mary accepted the crown in February 1689.',
      },
    ],
    people: [
      { n: 'James II', did: 'was the Catholic king who fled to France in 1688' },
      { n: 'William of Orange', did: 'was the Dutch prince invited to take the English throne in 1688' },
      { n: 'Mary II', did: "was James II's Protestant daughter, who ruled jointly with her husband" },
      { n: 'Queen Anne', did: 'was the last Stuart monarch, in whose reign England and Scotland were united' },
    ],
    terms: [
      { t: 'Glorious Revolution', d: 'the replacement of James II by William and Mary in 1688-1689' },
      { t: 'Bill of Rights', d: "the 1689 law limiting the monarch's power and protecting Parliament" },
      { t: 'constitutional monarchy', d: 'a system where the monarch rules within limits set by law and Parliament' },
      { t: 'Act of Union', d: 'the 1707 law that joined England and Scotland' },
    ],
    facts: [
      F([1, 2], 'Who was invited to take the English throne in 1688?', 'William of Orange, with his wife Mary', [
        ['Oliver Cromwell', 'Cromwell had died in 1658.'],
        'Charles II',
        'George I',
      ], 'He was a Dutch Protestant prince.', 'Leading nobles invited William of Orange, the husband of James II’s Protestant daughter Mary.'),
      F([2, 3], 'Why was it called the "Glorious" or "Bloodless" Revolution in England?', 'James fled abroad and there was little fighting in England', [
        'Nobody anywhere was killed',
        'It took place on a sunny day',
        'It was led by the army of the Pope',
      ], 'What did James do when William arrived?', 'James’s support collapsed and he fled to France, so there was little bloodshed in England. There was fighting in Ireland and Scotland, though.'),
      F([2, 3], 'Why did leading nobles turn against James II?', 'He was Catholic, gave Catholics top jobs, and the birth of his son meant a line of Catholic kings', [
        'He refused to have any children',
        'He wanted to make England a republic',
        'He was a Puritan',
      ], 'What changed in June 1688?', 'People had put up with James because his heirs were Protestant daughters. The birth of a son in 1688 meant a Catholic dynasty.'),
      F([3, 4], 'Which of these did the Bill of Rights (1689) say?', "The monarch could not raise taxes or keep an army in peacetime without Parliament's agreement", [
        'All men over 21 could vote',
        'The monarch could suspend any law',
        'Parliament would be abolished',
      ], 'It limited the monarch’s power.', 'The Bill of Rights said the monarch needed Parliament’s consent for taxes and a peacetime army, and that elections and debates in Parliament should be free.'),
      F([3, 4], 'Why was the Glorious Revolution not "bloodless" everywhere?', 'There was fighting in Ireland and Scotland, including the Battle of the Boyne in 1690', [
        'There was a great battle in London',
        'James II won a battle at Torbay',
        'The Spanish invaded Cornwall',
      ], 'James did not give up after fleeing.', 'James tried to win back his throne from Ireland. William defeated him at the Boyne in 1690. There were also Jacobite risings in Scotland.'),
      F([4, 5], 'Why is 1689 seen as a turning point for Parliament?', 'From then on monarchs had to rule with Parliament, which met regularly and controlled taxes', [
        'Parliament was closed down for good',
        'The monarch became an elected president',
        'Parliament became Catholic',
      ], 'Think about who held power over money.', 'After 1689 no monarch could rule without Parliament. This was a big step towards a constitutional monarchy.'),
      F([4, 5], 'Under the Bill of Rights, who could NOT inherit the throne?', 'A Catholic', ['A woman', 'Anyone born outside London', 'Anyone under 21'], 'The Revolution was about religion as well as power.', 'The Bill of Rights barred Catholics, and anyone married to a Catholic, from the throne.'),
    ],
    reveals: [
      {
        prompt: 'Explain why the Glorious Revolution happened in 1688.',
        hint: 'Think about James II’s religion and actions, the birth of his son, and the invitation to William.',
        model:
          'The Glorious Revolution happened mainly because of fears about James II’s Catholicism. He gave Catholics important jobs in the army and government and ignored laws against them, which made Protestants afraid. At first many accepted him because his heirs were his Protestant daughters, but in June 1688 his son was born, meaning a line of Catholic kings. So seven leading nobles invited William of Orange, husband of James’s daughter Mary, to come to England. When William landed with an army, James’s support collapsed and he fled to France.',
        checklist: ['Explains fears about James II’s religion or actions', 'Explains the importance of the birth of his son', 'Mentions the invitation to William', 'Uses specific dates or details'],
      },
    ],
  },
]
