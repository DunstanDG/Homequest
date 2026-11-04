import { ABOLITION_PAIR } from './data.skills'
import { SRC } from './sources'
import { E, F, type Topic } from './types'

/** Industry, empire and reform, about 1700-1928 (Year 8). */
export const INDUSTRY: Topic[] = [
  // ------------------------------------------------------------------ causes of the Industrial Revolution
  {
    skill: 'industry.causes',
    title: 'the start of the Industrial Revolution',
    events: [
      E(1709, 'Abraham Darby uses coke to smelt iron'),
      E(1761, 'The Bridgewater Canal opens'),
      E(1801, 'The first national census counts the population'),
      E(1830, 'The Liverpool and Manchester Railway opens'),
    ],
    terms: [
      { t: 'Industrial Revolution', d: 'the change from making goods by hand at home to making them by machine in factories' },
      { t: 'domestic system', d: "making goods by hand in workers' own homes" },
      { t: 'Agricultural Revolution', d: 'changes in farming that produced more food with fewer workers' },
      { t: 'raw materials', d: 'natural materials, such as cotton or iron ore, used to make goods' },
      { t: 'capital', d: 'money available to invest in businesses' },
    ],
    links: [
      { c: 'Britain had plenty of coal and iron ore', e: 'It could fuel steam engines and make iron machines' },
      { c: 'Farming improvements produced more food', e: 'The population grew and more workers were available' },
      { c: 'Britain had a large empire and navy', e: 'It had raw materials and markets to sell goods to' },
      { c: 'Banks and merchants had money to invest', e: 'Inventors and factory owners could pay for new machines' },
      { c: 'Canals and later railways were built', e: 'Goods and raw materials could be moved cheaply' },
    ],
    facts: [
      F([1, 2], 'Roughly when did the Industrial Revolution begin in Britain?', 'Around the middle of the 1700s', ['Around 1066', 'Around 1500', 'Around 1950'], 'It was in the Georgian period.', 'Most historians date the start to around the middle of the 1700s, with rapid change from about 1760 onwards.'),
      F([2, 3], 'Why did the Industrial Revolution start in Britain?', 'It had coal and iron, a growing population, money to invest and trade through its empire', [
        'It was the only country with rivers',
        'The government owned all the factories',
        'Britain had banned farming',
      ], 'Think about resources, people, money and trade.', 'Britain had natural resources, workers, capital, transport, overseas markets and inventors, all at the same time.'),
      F([2, 3], 'How did the population of Britain change during the Industrial Revolution?', 'It grew very quickly', [
        'It fell sharply',
        'It stayed exactly the same',
        ['It grew only in the countryside', 'The biggest growth was in the new industrial towns.'],
      ], 'More food and more jobs meant...', 'Britain’s population rose rapidly from the late 1700s, and more and more people lived in towns.'),
      F([3, 4], 'Why was coal so important to the Industrial Revolution?', 'It fuelled steam engines and was used in making iron', [
        'It was used to make cotton cloth',
        'It was Britain’s main food export',
        'It was only used to heat houses',
      ], 'What did steam engines burn?', 'Coal powered steam engines in mines, mills and railways, and coke (made from coal) was used to smelt iron.'),
      F([3, 4], 'How did the Agricultural Revolution help industry?', 'Farms produced more food with fewer workers, feeding a growing population and freeing people to work in towns', [
        'Farmers built the first factories',
        'It stopped people moving to towns',
        'It made coal cheaper',
      ], 'Think about food and workers.', 'New methods and enclosure raised food production, so more people could be fed and fewer were needed on the land.'),
      F([4, 5], 'How did empire and the slave trade connect to the Industrial Revolution?', 'Some merchants invested profits in industry, and the colonies supplied raw materials like cotton and bought British goods', [
        'They had no connection at all',
        'Enslaved people worked in British cotton mills',
        'The empire banned British goods',
      ], 'Where did the cotton for Lancashire mills come from?', 'Cotton grown by enslaved people in the Americas fed British mills, and some profits from slavery and trade were invested in banks and industry. Historians debate how big this effect was.'),
    ],
    reveals: [
      {
        prompt: 'Explain why the Industrial Revolution began in Britain.',
        hint: 'Think about natural resources, people, money, transport and trade. Link them together.',
        model:
          'One reason was natural resources: Britain had lots of coal and iron ore, which fuelled steam engines and made iron for machines. Another reason was population: the Agricultural Revolution produced more food, so the population grew and there were more workers and customers. Britain also had money to invest from banks and trade, including profits linked to the empire and the slave trade, and its empire supplied raw materials like cotton and markets for goods. Finally, canals and later railways moved goods cheaply. These factors came together in Britain at the same time.',
        checklist: ['Gives at least two causes', 'Uses specific detail (coal, canals, cotton, population)', 'Explains how each cause helped industry grow', 'Links causes together'],
      },
    ],
  },

  // ------------------------------------------------------------------ inventions
  {
    skill: 'industry.inventions',
    title: 'inventions of the Industrial Revolution',
    events: [
      E(1733, 'John Kay invents the flying shuttle'),
      E(1764, 'James Hargreaves invents the spinning jenny', { approx: true }),
      E(1769, 'Richard Arkwright patents the water frame'),
      E(1771, 'Arkwright opens his mill at Cromford'),
      E(1779, 'Samuel Crompton invents the spinning mule'),
      E(1804, "Richard Trevithick's steam locomotive pulls the first train along rails"),
      E(1825, 'The Stockton and Darlington Railway opens'),
      E(1829, "Stephenson's Rocket wins the Rainhill Trials"),
    ],
    people: [
      { n: 'James Hargreaves', did: 'invented the spinning jenny, which spun several threads at once' },
      { n: 'Richard Arkwright', did: 'invented the water frame and built one of the first factories, at Cromford' },
      { n: 'James Watt', did: 'improved the steam engine so it used much less coal' },
      { n: 'George Stephenson', did: 'engineered early railways and, with his son Robert, built the Rocket' },
      { n: 'Abraham Darby', did: 'found a way to smelt iron using coke instead of charcoal' },
      { n: 'Isambard Kingdom Brunel', did: 'engineered the Great Western Railway and huge iron steamships' },
      { n: 'Samuel Crompton', did: 'invented the spinning mule' },
    ],
    terms: [
      { t: 'patent', d: 'a legal right to be the only one to make and sell an invention for a set time' },
      { t: 'coke', d: 'a fuel made by heating coal' },
      { t: 'locomotive', d: 'an engine that pulls a train' },
      { t: 'textiles', d: 'cloth and the making of cloth' },
    ],
    facts: [
      F([1, 2], 'What powered most new factories by the middle of the 1800s?', 'Steam engines burning coal', [
        ['Electricity', 'Electric power in factories came later, mostly after 1900.'],
        'Windmills',
        'Horses on treadmills',
      ], 'Coal was burned to boil water.', 'Early mills used water wheels, but by the mid-1800s most used steam engines burning coal.'),
      F([2, 3], "Why were early factories like Arkwright's at Cromford built next to rivers?", 'Their machines were driven by water wheels', [
        'So that workers could swim in their breaks',
        'Because the law said factories must be by rivers',
        'To use the river as a sewer',
      ], 'What drove the water frame? Look at its name.', 'Water frames were powered by water wheels, so the first big mills were built beside fast-flowing rivers.'),
      F([2, 3], "Why did James Watt's improvements to the steam engine matter so much?", 'His engines used less coal and could turn wheels, so factories could be built away from rivers', [
        'He invented the very first steam engine',
        'His engines ran on water instead of coal',
        'His engines were only used in ships',
      ], 'Earlier engines were mainly used to pump water from mines.', 'Earlier engines (like Newcomen’s) were wasteful pumps. Watt’s engines were more efficient and could drive machinery, freeing factories from rivers.'),
      F([3, 4], 'How did railways change Britain?', 'Goods and people could travel faster and more cheaply, and towns, trade and newspapers spread', [
        'They made canals more important than ever',
        'They only carried coal',
        'They stopped people moving to towns',
      ], 'Think about speed, cost and who could travel.', 'Railways cut journey times, carried food, goods and post quickly, created jobs and even led to standard "railway time" across Britain.'),
      F([3, 4], 'Why did new textile machines lead to factories?', 'The machines were too big and expensive for homes, so work moved into mills', [
        'Workers asked to leave their homes',
        'The government banned spinning at home',
        'The machines could only work in towns',
      ], 'Compare a spinning wheel with a water frame.', 'Large powered machines needed buildings, power sources and many workers in one place, which ended much of the domestic system.'),
      F([4, 5], 'Why were the Rainhill Trials of 1829 important?', "Stephenson's Rocket won, showing that steam locomotives could be fast and reliable", [
        'They were the first car races',
        'They proved horses were faster than trains',
        'They tested the first electric trains',
      ], 'The trials chose an engine for a new railway.', 'The Rocket won the trials and was used on the Liverpool and Manchester Railway, which opened in 1830.'),
    ],
    reveals: [
      {
        prompt: 'Explain how new inventions changed the textile industry.',
        hint: 'Think about what spinning and weaving were like before, which machines changed them, and the result.',
        model:
          'Before the Industrial Revolution, cloth was spun and woven by hand at home in the domestic system. New machines changed this. The spinning jenny let one worker spin several threads at once, and Arkwright’s water frame, powered by a water wheel, produced strong thread in large amounts. Because these machines were big and needed power, production moved into mills like Cromford, opened in 1771. Later, steam engines meant mills could be built in towns. The result was far more cloth made much more cheaply, and many workers moved from home work into factories.',
        checklist: ['Describes how cloth was made before', 'Names at least two inventions', 'Explains how they led to factories', 'Explains a result (cheaper cloth, more production, workers moving)'],
      },
    ],
  },

  // ------------------------------------------------------------------ factories and child labour
  {
    skill: 'industry.factories',
    title: 'factories and child labour',
    events: [
      E(1802, 'The first Factory Act limits the hours of pauper apprentices in mills'),
      E(1819, 'A Factory Act bans children under nine from cotton mills'),
      E(1833, 'A Factory Act bans children under nine from textile factories and appoints inspectors', { key: true }),
      E(1842, 'The Mines Act bans women, girls and boys under ten from working underground'),
      E(1847, 'The Ten Hours Act limits women and young people to ten hours a day in textile mills'),
      E(1880, 'School becomes compulsory for children aged five to ten'),
    ],
    people: [
      { n: 'Richard Oastler', did: 'campaigned against child labour, calling it "Yorkshire slavery"' },
      { n: 'Lord Shaftesbury', did: 'was an MP who led campaigns for factory and mine reform' },
      { n: 'Michael Sadler', did: 'led a parliamentary committee that heard evidence from factory children in 1832' },
      { n: 'Robert Owen', did: 'ran the New Lanark mills, where he provided schools and better conditions for workers' },
    ],
    terms: [
      { t: 'overlooker', d: 'a supervisor who kept workers at their machines in a mill' },
      { t: 'pauper apprentice', d: 'an orphan or poor child sent to work in a mill' },
      { t: 'Factory Act', d: 'a law setting rules about working hours and conditions in factories' },
      { t: 'scavenger', d: 'a child who crawled under moving machines to collect loose cotton' },
      { t: 'piecer', d: 'a child who tied together broken threads on spinning machines' },
    ],
    facts: [
      F([1, 2], 'Why did factory owners employ children?', 'They could be paid less, and their small size was useful for some jobs', [
        'Children were stronger than adults',
        'The law required every factory to employ children',
        'Children worked shorter hours than adults',
      ], 'Think about cost and size.', 'Children were cheap to employ and could crawl under machines or reach small spaces. Many poor families also needed their wages.'),
      F([2, 3], 'Which job involved crawling under moving machines to collect loose cotton?', 'Scavenger', [
        ['Piecer', 'Piecers tied broken threads together.'],
        'Overlooker',
        'Engineer',
      ], 'They "scavenged" for scraps.', 'Scavengers worked under machines that were still moving, which was very dangerous.'),
      F([2, 3], 'What was a typical working day like in a cotton mill in the early 1800s?', 'Twelve hours or more, six days a week', ['Six hours, five days a week', 'Eight hours, four days a week', 'Only during school holidays'], 'Look at Source A for a clue.', 'Working days of twelve or more hours, six days a week, were common before the Factory Acts.', SRC.millChild),
      F([3, 4], 'Why does the mill owner in Source L say the children’s wages matter?', 'To argue that banning child labour would make poor families poorer', [
        'To show that he paid children more than adults',
        'To ask Parliament to raise wages',
        'To prove the children were unhappy',
      ], 'What was he trying to stop Parliament doing?', 'Owners argued that families depended on children’s wages, so limiting child labour would hurt the poor. They also had their own profits to protect.', SRC.factoryOwner),
      F([3, 4], 'Why was the 1833 Factory Act important, even though only four inspectors were appointed at first?', 'For the first time, inspectors checked that the law was obeyed', [
        'It banned all child labour',
        'It gave workers the vote',
        'It closed all the textile mills',
      ], 'Earlier laws had no way of being enforced.', 'Earlier Factory Acts were often ignored. The 1833 Act appointed inspectors, which was the start of government enforcement, even though four could not visit every mill.'),
      F([4, 5], 'Why did some people oppose the Factory Acts?', 'Owners said shorter hours would cut profits, and some families needed children’s wages', [
        'Doctors said factory work was healthy for children',
        'The Church wanted children in factories',
        'Children voted against them',
      ], 'Think about money.', 'Owners feared losing profits and competitiveness, and many believed in laissez-faire: that the government should not interfere in business.'),
    ],
    reveals: [
      {
        prompt: 'Describe two features of working conditions for children in textile mills in the early 1800s.',
        hint: 'You could describe hours, dangers, punishments or the jobs children did.',
        model:
          'One feature was very long hours. Children often worked twelve hours or more a day, six days a week, starting early in the morning, with only short breaks. A second feature was danger. Children worked as scavengers, crawling under machines that were still moving to collect loose cotton, and accidents such as crushed fingers were common. They could also be fined or beaten by overlookers if they were late or slow.',
        checklist: ['Identifies one feature', 'Gives a supporting detail for it', 'Identifies a second feature', 'Gives a supporting detail for the second feature'],
      },
    ],
  },

  // ------------------------------------------------------------------ public health
  {
    skill: 'industry.public-health',
    title: 'public health in industrial towns',
    events: [
      E(1831, 'Cholera reaches Britain for the first time'),
      E(1842, "Edwin Chadwick's report on the living conditions of the poor"),
      E(1848, 'The first Public Health Act'),
      E(1854, 'John Snow links cholera to a water pump on Broad Street', { key: true }),
      E(1858, 'The Great Stink in London'),
      E(1861, "Louis Pasteur publishes his germ theory"),
      E(1875, 'A Public Health Act forces councils to provide clean water and sewers'),
    ],
    people: [
      { n: 'Edwin Chadwick', did: 'wrote an 1842 report linking dirty living conditions to disease and early death' },
      { n: 'John Snow', did: 'showed in 1854 that cholera spread through dirty water from a Broad Street pump' },
      { n: 'Joseph Bazalgette', did: "built London's new sewer system after the Great Stink" },
      { n: 'Louis Pasteur', did: 'was the French scientist whose germ theory showed that microbes cause disease' },
    ],
    terms: [
      { t: 'cholera', d: 'a deadly disease spread through water contaminated with sewage' },
      { t: 'back-to-back houses', d: 'rows of houses built sharing a back wall, with no yard and little fresh air' },
      { t: 'cess pit', d: 'a pit where human waste was collected' },
      { t: 'laissez-faire', d: 'the idea that the government should not interfere in people’s lives or in business' },
      { t: 'germ theory', d: 'the idea that microbes cause disease' },
    ],
    facts: [
      F([1, 2], 'Why did industrial towns grow so quickly?', 'People moved from the countryside to find work in the new factories', [
        'The government forced everyone to live in towns',
        'Towns were healthier than villages',
        'Farmers were paid to move',
      ], 'Where were the jobs?', 'Factories, mines and docks drew people from the countryside, and towns like Manchester grew very fast, with cheap, crowded housing.'),
      F([2, 3], 'How was cholera spread?', 'Through water contaminated with sewage', [
        ['Through bad air (miasma)', 'Many people believed this at the time, but John Snow showed it was spread by water.'],
        'Through flea bites',
        'Through eating too much fruit',
      ], 'Think about what John Snow investigated.', 'Cholera spreads when sewage gets into drinking water. In crowded towns, cess pits often leaked into wells and rivers.'),
      F([2, 3], 'What did John Snow do to help stop the 1854 cholera outbreak in Soho?', 'He had the handle removed from the Broad Street pump', [
        'He invented a cholera vaccine',
        'He burned down the houses of the sick',
        'He built London’s sewers',
      ], 'He mapped where the victims lived.', 'Snow mapped deaths and found they clustered around one water pump. He persuaded officials to remove its handle, and cases fell.'),
      F([3, 4], 'Why did governments at first do little to improve public health?', 'Many believed in laissez-faire, and ratepayers did not want to pay for sewers', [
        'Nobody was getting ill',
        'They already provided clean water everywhere',
        'The Church had banned sewers',
      ], 'Who would have to pay for improvements?', 'Many politicians thought it was not the government’s job, and wealthy ratepayers resisted the cost. Ideas about the cause of disease were also unclear.'),
      F([3, 4], 'Why did the Great Stink of 1858 lead to action in London?', 'The smell from the Thames reached Parliament, so MPs agreed to pay for new sewers', [
        'It killed every MP',
        'Queen Victoria ordered the Thames to be filled in',
        'It proved that germs caused disease',
      ], 'Where is Parliament?', 'In a hot summer, the sewage-filled Thames stank outside Parliament. MPs quickly approved Bazalgette’s huge sewer system.'),
      F([4, 5], 'Why was the 1875 Public Health Act more effective than the 1848 Act?', 'It forced councils to provide clean water and sewers, while the 1848 Act was mostly optional', [
        'It banned cholera',
        'It gave councils less power',
        'It was passed before germ theory was known',
      ], 'Look at the difference between "could" and "must".', 'The 1848 Act let towns set up boards of health but did not force them. The 1875 Act made improvements compulsory, helped by germ theory and by more working men having the vote.'),
    ],
    reveals: [
      {
        prompt: 'Explain why public health in British towns improved in the second half of the 1800s.',
        hint: 'Think about new knowledge, key individuals, events that shocked people and changes in government.',
        model:
          'Public health improved partly because of new knowledge. In 1854 John Snow showed that cholera spread through dirty water, and in 1861 Pasteur’s germ theory proved microbes caused disease, so people understood why clean water and sewers mattered. Events also forced action: the Great Stink of 1858 led Parliament to fund Bazalgette’s sewers in London. Government attitudes changed too: after 1867 more working men could vote, so politicians had to listen to them, and the 1875 Public Health Act forced councils to provide clean water and sewers.',
        checklist: ['Gives at least two reasons', 'Mentions science or new knowledge', 'Mentions government action or a law', 'Uses specific names or dates', 'Explains how each reason led to improvement'],
      },
    ],
  },

  // ------------------------------------------------------------------ slave trade
  {
    skill: 'slavery.trade',
    title: 'the transatlantic slave trade',
    events: [
      E(1562, 'John Hawkins begins English involvement in the slave trade'),
      E(1619, 'Enslaved Africans are brought to the English colony of Virginia'),
      E(1672, 'The Royal African Company is set up'),
      E(1807, 'Parliament abolishes the British slave trade', { key: true }),
    ],
    seqs: [
      {
        prompt: 'Put the stages of the triangular trade in order, starting from Britain.',
        items: [
          'Ships leave ports such as Liverpool, Bristol and London with goods such as guns, cloth and alcohol',
          'The goods are traded in West Africa for enslaved people',
          'Enslaved Africans are carried across the Atlantic on the Middle Passage',
          'Enslaved people are sold in the Caribbean and the Americas',
          'Ships return to Britain with sugar, tobacco, cotton and rum',
        ],
        direction: ['First leg', 'Last leg'],
        hint: 'Britain, then Africa, then the Americas, then back to Britain.',
        ex: 'The triangular trade: manufactured goods from Britain to West Africa; enslaved people across the Atlantic; plantation goods back to Britain.',
      },
    ],
    terms: [
      { t: 'triangular trade', d: 'the three-part trade route between Britain, West Africa and the Americas' },
      { t: 'plantation', d: 'a large farm growing a crop such as sugar or cotton, worked by enslaved people' },
      { t: 'enslaved person', d: 'a person owned by someone else and forced to work without pay or freedom' },
      { t: 'chattel slavery', d: 'a system where enslaved people were treated as property, and their children were enslaved too' },
    ],
    sorts: [
      {
        cats: ['Sent from Britain to West Africa', 'Brought back to Britain'],
        ask: ['a good sent from Britain to West Africa', 'a good brought back to Britain from the Americas'],
        q: 'In the triangular trade, which way did this good usually travel?',
        hint: 'Britain sent manufactured goods; the plantations produced crops.',
        ex: 'British manufactured goods went to Africa; plantation products such as sugar came back to Britain.',
        items: [
          ['Guns', 0],
          ['Cloth', 0],
          ['Alcohol such as brandy', 0],
          ['Metal pots and pans', 0],
          ['Sugar', 1],
          ['Tobacco', 1],
          ['Raw cotton', 1],
          ['Rum', 1],
        ],
      },
    ],
    facts: [
      F([1, 2], 'Which three areas made up the triangular trade?', 'Europe, Africa and the Americas', ['Europe, Asia and Australia', 'Africa, India and China', 'Britain, France and Spain'], 'Picture the Atlantic Ocean.', 'Ships sailed from Europe to West Africa, then across the Atlantic to the Americas, then back to Europe.'),
      F([2, 3], 'Which British ports grew especially rich from the slave trade?', 'Liverpool, Bristol and London', ['Dover, Hastings and Brighton', 'York, Leeds and Sheffield', 'Oxford, Cambridge and Bath'], 'They are ports facing the Atlantic, plus the capital.', 'Liverpool, Bristol and London were the main slave-trading ports. Many buildings and fortunes there were linked to the trade.'),
      F([2, 3], 'Why did plantation owners use enslaved workers?', 'Crops like sugar needed huge amounts of hard labour, and enslaved people were not paid', [
        'Enslaved people asked to work there',
        'The Pope ordered it',
        'There were no other people in the Americas',
      ], 'Think about the owners’ profits.', 'Sugar growing and processing was brutal, exhausting work. Owners used enslaved Africans to maximise profit.'),
      F([3, 4], 'Roughly how many Africans were forcibly transported across the Atlantic in the transatlantic slave trade?', 'About 12 million', ['About 12,000', 'About 1 million', 'About 120 million'], 'It went on for over 300 years.', 'Historians estimate that about 12 million Africans were forced onto ships between the 1500s and 1800s; many died on the voyage.'),
      F([3, 4], 'How did Britain benefit from the slave trade?', 'Merchants, ports, banks and plantation owners made huge profits', [
        'Every British family received a payment',
        'It gave Britain a larger population',
        'It did not benefit Britain at all',
      ], 'Who owned the ships and plantations?', 'Profits flowed to traders, plantation owners, insurers, banks and the ports, and helped fund businesses and grand buildings.'),
    ],
    reveals: [
      {
        prompt: 'Describe how the triangular trade worked.',
        hint: 'Go round the three legs of the triangle, saying what was carried on each.',
        model:
          'Ships left British ports such as Liverpool and Bristol carrying manufactured goods such as guns, cloth and alcohol. In West Africa these goods were traded for enslaved Africans, who had been captured and held in forts. The enslaved people were then forced onto ships and carried across the Atlantic on the Middle Passage. In the Caribbean and the Americas they were sold to plantation owners, and the ships returned to Britain loaded with sugar, tobacco, cotton and rum. Each leg of the journey made a profit for the traders.',
        checklist: ['Describes the leg from Britain to Africa', 'Describes the Middle Passage', 'Describes the return leg with plantation goods', 'Uses specific detail (ports, goods)'],
      },
    ],
  },

  // ------------------------------------------------------------------ Middle Passage and plantations
  {
    skill: 'slavery.middle-passage',
    title: 'the Middle Passage and plantation life',
    terms: [
      { t: 'Middle Passage', d: 'the voyage across the Atlantic carrying enslaved Africans to the Americas' },
      { t: 'scramble', d: 'a sale where buyers rushed onto a ship to grab the enslaved people they wanted' },
      { t: 'overseer', d: 'a person who supervised enslaved workers on a plantation, often using violence' },
      { t: 'shackles', d: 'metal rings and chains used to restrain people' },
    ],
    facts: [
      F([1, 2], 'What was the Middle Passage?', 'The voyage across the Atlantic carrying enslaved Africans to the Americas', [
        'A road through the middle of Africa',
        'The return voyage carrying sugar to Britain',
        'A canal in Liverpool',
      ], 'It was the middle leg of the triangular trade.', 'The Middle Passage was the second leg of the triangular trade, from West Africa to the Americas.'),
      F([2, 3], 'How long did the Middle Passage usually take?', 'About six to eight weeks, sometimes longer', ['About two days', 'About a year', 'About two hours'], 'Sailing ships crossed the Atlantic slowly.', 'The voyage usually took around six to eight weeks, depending on winds and the route.'),
      F([2, 3], 'Which best describes conditions below deck on slave ships?', 'People were chained in cramped, filthy spaces with little air or light', [
        'People had cabins with beds',
        'People were free to move around the ship',
        'Conditions were the same as for the crew',
      ], 'Look at Source H.', 'Captives were chained and packed tightly below deck. Disease spread quickly, and many died.', SRC.equiano),
      F([2, 4], 'On average, roughly how many enslaved Africans died during the Middle Passage?', 'More than one in ten', ['Hardly anyone', 'Almost all of them', 'Exactly half'], 'It varied from voyage to voyage.', 'Historians estimate that on average more than one in ten captives died on the voyage, from disease, violence or despair; on some ships far more died.'),
      F([3, 4], 'Why is Source H especially valuable to historians?', 'It is a first-hand account by someone who was enslaved, which is rare', [
        'It was written by a ship’s captain',
        'It was written by a government official',
        'It is a secondary source written recently',
      ], 'Who wrote it?', 'Most surviving records were written by traders and owners. Equiano’s account gives the view of an enslaved African.', SRC.equiano),
      F([3, 4], 'What was life like for most enslaved people on sugar plantations?', 'Very long hours of hard, dangerous work, with harsh punishments', [
        'Short working days with weekends off',
        'Paid work with the chance to leave',
        'Mostly indoor office work',
      ], 'Sugar was one of the hardest crops to grow and process.', 'Enslaved people cut cane and worked in boiling houses for very long hours. Overseers used whipping and other violent punishments.'),
      F([4, 5], 'Why did the children of enslaved people also become enslaved?', 'Under chattel slavery, slavery passed down by birth, so children were treated as the owner’s property', [
        'Children chose to work on plantations',
        'They were paid to stay',
        'It was a rule made by enslaved people',
      ], 'What does "chattel" mean?', 'Chattel means property. Enslaved people and their children were legally owned and could be sold, splitting families apart.'),
    ],
    reveals: [
      {
        prompt: 'Describe two features of the Middle Passage.',
        hint: 'You could describe conditions on board, the length of the voyage, death and disease, or resistance.',
        model:
          'One feature was the terrible conditions below deck. Enslaved Africans were chained together and packed into cramped spaces with little air, and Olaudah Equiano described the stench of the hold as so bad it was dangerous. A second feature was the high death rate. The voyage took around six to eight weeks, and disease spread quickly, so on average more than one in ten captives died, with far more on some ships.',
        checklist: ['Identifies one feature', 'Gives a supporting detail for it', 'Identifies a second feature', 'Gives a supporting detail for the second feature'],
      },
    ],
  },

  // ------------------------------------------------------------------ resistance
  {
    skill: 'slavery.resistance',
    title: 'resistance to slavery',
    events: [
      E(1739, 'The First Maroon War in Jamaica ends in a peace treaty'),
      E(1760, "Tacky's Revolt in Jamaica"),
      E(1791, 'The revolution in Saint-Domingue begins'),
      E(1804, 'Haiti becomes an independent country'),
      E(1831, 'Samuel Sharpe leads a huge rising of enslaved people in Jamaica'),
    ],
    people: [
      { n: 'Toussaint Louverture', did: 'was a leader of the revolution in Saint-Domingue that created Haiti' },
      { n: 'Nanny of the Maroons', did: 'was a leader of Maroon communities in Jamaica who fought the British' },
      { n: 'Samuel Sharpe', did: 'was a Baptist preacher who led a huge rising of enslaved people in Jamaica in 1831' },
      { n: 'Tacky', did: 'led a major rising of enslaved people in Jamaica in 1760' },
    ],
    terms: [
      { t: 'Maroons', d: 'communities of people who escaped slavery and lived free in remote areas' },
      { t: 'resistance', d: 'actions taken to oppose or fight back against something' },
      { t: 'revolt', d: 'a violent uprising against those in power' },
    ],
    sorts: [
      {
        cats: ['Everyday resistance', 'Open rebellion'],
        ask: ['an example of everyday resistance', 'an example of open rebellion'],
        q: 'Is this an example of everyday resistance or open rebellion?',
        hint: 'Everyday resistance was quiet and hidden; open rebellion was an armed rising.',
        ex: 'Enslaved people resisted in many ways, from quiet daily acts to large armed risings.',
        items: [
          ['Working slowly on purpose', 0],
          ['Breaking tools', 0],
          ['Keeping African songs, stories and beliefs alive', 0],
          ['Pretending to be ill to avoid work', 0],
          ["Tacky's Revolt in Jamaica in 1760", 1],
          ['The rising in Saint-Domingue in 1791', 1],
          ['The Jamaican rising led by Samuel Sharpe in 1831', 1],
          ['Captives seizing control of a slave ship', 1],
        ],
      },
    ],
    facts: [
      F([1, 2], 'Which country was created by a successful revolution of enslaved people?', 'Haiti', ['Jamaica', 'Barbados', 'Canada'], 'It was the French colony of Saint-Domingue.', 'The revolution that began in 1791 in Saint-Domingue led to the independent country of Haiti in 1804.'),
      F([2, 3], 'Why is the Haitian Revolution so significant?', 'Enslaved people defeated colonial armies and created the first free Black republic', [
        'It was the first war in the Caribbean',
        'It was led by British abolitionists',
        'It made slavery legal in France',
      ], 'What had never happened before?', 'Haiti was the first nation founded after a successful revolt of enslaved people. It terrified slave owners and inspired enslaved people elsewhere.'),
      F([3, 4], 'How did the 1831 rising in Jamaica help bring about abolition?', 'It showed slavery could only be kept going with huge violence, adding pressure on Parliament', [
        'It made Parliament give Jamaica to France',
        'It ended the slave trade in 1807',
        'It had no effect on Britain at all',
      ], 'The Slavery Abolition Act came two years later.', 'The rising and the brutal punishments that followed shocked many in Britain and helped persuade Parliament to pass the Slavery Abolition Act in 1833.'),
      F([3, 4], 'Why is everyday resistance harder for historians to study?', 'It was secret, and was rarely written down by enslaved people themselves', [
        'It never happened',
        'It was only done by plantation owners',
        'All records of it were written by enslaved people',
      ], 'Who wrote most of the records that survive?', 'Most records were written by owners and officials. Quiet resistance was meant to go unnoticed, so historians piece it together from indirect evidence.'),
    ],
    reveals: [
      {
        prompt: 'Explain why resistance by enslaved people was important in ending slavery.',
        hint: 'Think about Haiti, risings in British colonies and the effect on opinion in Britain.',
        model:
          'Resistance was important because it made slavery dangerous and expensive. The revolution in Saint-Domingue, which created Haiti in 1804, showed that enslaved people could overthrow their owners, and it frightened plantation owners across the Caribbean. In British colonies, risings like Samuel Sharpe’s in Jamaica in 1831 were put down with great brutality, which shocked people in Britain and showed slavery could only survive through violence. Resistance also proved that enslaved people never accepted slavery, which challenged the claims of pro-slavery campaigners.',
        checklist: ['Gives at least one example of resistance with detail', 'Explains the effect on slave owners or the cost of slavery', 'Explains the effect on opinion or Parliament in Britain', 'Links resistance to abolition, not just describes it'],
      },
    ],
  },

  // ------------------------------------------------------------------ abolition
  {
    skill: 'slavery.abolition',
    title: 'the abolition of slavery',
    events: [
      E(1772, 'The Somerset case: a judge rules an enslaved man cannot be forced to leave England'),
      E(1781, 'The Zong massacre'),
      E(1787, 'The Society for Effecting the Abolition of the Slave Trade is founded'),
      E(1789, 'Olaudah Equiano publishes his autobiography'),
      E(1807, 'Parliament abolishes the British slave trade', { key: true }),
      E(1833, 'The Slavery Abolition Act is passed', { key: true }),
      E(1838, 'Apprenticeship ends and formerly enslaved people in British colonies are fully freed'),
    ],
    people: [
      { n: 'Olaudah Equiano', did: 'was a formerly enslaved man whose 1789 autobiography helped the abolition campaign' },
      { n: 'William Wilberforce', did: 'was the MP who led the campaign against the slave trade in Parliament' },
      { n: 'Thomas Clarkson', did: 'collected evidence about the slave trade and travelled thousands of miles to campaign' },
      { n: 'Granville Sharp', did: 'took legal cases to court to help enslaved Black people in England' },
      { n: 'Josiah Wedgwood', did: 'made the famous "Am I not a man and a brother?" medallion' },
      { n: 'Mary Prince', did: 'was the first Black woman to publish her life story in Britain, describing her enslavement' },
    ],
    terms: [
      { t: 'abolition', d: 'ending something officially, by law' },
      { t: 'abolitionist', d: 'someone who campaigned to end slavery' },
      { t: 'petition', d: 'a written request signed by many people' },
      { t: 'boycott', d: 'refusing to buy something as a protest' },
      { t: 'apprenticeship', d: 'the system after 1834 that forced formerly enslaved people to keep working unpaid for years' },
    ],
    facts: [
      F([1, 2], 'What did the 1807 Act abolish?', 'The British slave trade', [
        ['Slavery itself in the British Empire', 'Slavery itself was not abolished until the 1833 Act.'],
        'The East India Company',
        'Child labour',
      ], 'There were two separate Acts: 1807 and 1833.', 'The 1807 Act made it illegal for British ships to carry enslaved people. People who were already enslaved stayed enslaved.'),
      F([2, 3], 'What did the 1833 Act do?', 'It abolished slavery in most of the British Empire', [
        ['It abolished the slave trade', 'The trade had already been abolished in 1807.'],
        'It gave the vote to formerly enslaved people',
        'It banned sugar from Britain',
      ], 'It came 26 years after the trade was abolished.', 'The Slavery Abolition Act ended slavery in most British colonies from 1834, though "apprenticeship" kept people working unpaid until 1838.'),
      F([2, 3], 'How did ordinary people in Britain campaign against slavery?', 'They signed petitions, boycotted sugar from plantations and went to meetings', [
        'They voted in a national referendum',
        'They joined the army to invade the Caribbean',
        'They wrote to the Pope',
      ], 'Most people could not vote, so how could they show their views?', 'Huge petitions were sent to Parliament, and hundreds of thousands of people boycotted slave-grown sugar.'),
      F([3, 4], 'Who received compensation when slavery was abolished in 1833?', 'The slave owners, who were paid 20 million pounds', [
        ['The formerly enslaved people', 'Enslaved people received no compensation.'],
        'The abolitionists',
        'Nobody received anything',
      ], 'The government paid one group for its "lost property".', 'Parliament paid 20 million pounds, a vast sum, to slave owners. The people who had been enslaved received nothing.'),
      F([3, 4], "Why was Equiano's autobiography so powerful for the campaign?", 'It gave a first-hand account of enslavement by an African writer', [
        'It was written by a plantation owner',
        'It was the first book ever printed in English',
        'It was a government report',
      ], 'Who wrote it?', 'Equiano’s book described his capture, the Middle Passage and enslavement. It became a bestseller, and he toured Britain speaking against the trade.'),
      F([4, 5], 'Why did the Zong massacre of 1781 shock people?', 'The ship’s owners tried to claim insurance for enslaved people thrown overboard, showing they were treated as property', [
        'It was the first slave ship ever built',
        'The crew were all arrested and hanged',
        'It sank in the River Thames',
      ], 'The case went to court as an insurance claim, not a murder trial.', 'Over 130 enslaved Africans were thrown overboard, and the owners claimed insurance as if for lost cargo. Abolitionists used the case to show the horror of the trade.'),
      F([4, 5], 'Why did some MPs oppose abolition?', 'Plantation owners and merchants feared losing their profits', [
        'They believed slavery was illegal already',
        'They wanted to free enslaved people faster',
        'The Pope told them to',
      ], 'Who made money from slavery?', 'The "West India interest" of planters and merchants was powerful in Parliament and argued that abolition would ruin trade.'),
    ],
    reveals: [
      {
        prompt: 'Explain why slavery was abolished in the British Empire.',
        hint: 'Consider campaigners in Britain, enslaved people’s resistance and economic changes.',
        model:
          'One reason was the campaign in Britain. Abolitionists like Thomas Clarkson collected evidence, William Wilberforce argued in Parliament, and Olaudah Equiano’s autobiography gave a first-hand account. Ordinary people signed petitions and boycotted sugar. A second reason was resistance by enslaved people: the Haitian Revolution and the Jamaican rising of 1831 showed slavery could only be kept going by violence. Some historians also argue that slavery was becoming less important to Britain’s economy. These reasons together led to the 1807 Act ending the trade and the 1833 Act abolishing slavery.',
        checklist: ['Explains the role of campaigners in Britain', 'Explains the role of resistance by enslaved people', 'Mentions the 1807 or 1833 Act', 'Uses specific names or events', 'Shows that more than one factor mattered'],
      },
      {
        prompt: 'Interpretation A says the slave trade was ended above all by campaigners in Britain. How far do you agree?',
        src: ABOLITION_PAIR,
        hint: 'Use evidence for A and for B, then make a judgement.',
        model:
          'There is evidence for Interpretation A. Clarkson gathered evidence, Wilberforce led the campaign in Parliament for twenty years, and huge petitions and the sugar boycott showed public support, leading to the 1807 Act. However, Interpretation B is also convincing. Enslaved people resisted constantly, and the revolution in Saint-Domingue showed slavery could be overthrown, while the 1831 Jamaican rising helped push Parliament to the 1833 Act. Equiano, a formerly enslaved man, was himself a leading campaigner. So I only partly agree: British campaigners were important, but enslaved people’s resistance was just as vital.',
        checklist: ['Uses evidence that supports A', 'Uses evidence that supports B or challenges A', 'Uses specific own knowledge', 'Reaches a clear judgement about "how far"'],
      },
    ],
  },

  // ------------------------------------------------------------------ British Empire
  {
    skill: 'empire.growth',
    title: 'the British Empire',
    events: [
      E(1600, 'The East India Company is founded'),
      E(1607, 'Jamestown, the first lasting English colony in North America, is founded'),
      E(1757, 'The East India Company wins the Battle of Plassey'),
      E(1776, 'The American colonies declare independence'),
      E(1788, 'The First Fleet of British ships arrives in Australia'),
      E(1884, 'European powers meet in Berlin to agree rules for dividing up Africa'),
      E(1897, "Queen Victoria's Diamond Jubilee celebrates the Empire"),
    ],
    people: [
      { n: 'Cecil Rhodes', did: 'was a businessman and politician who wanted British rule from Cape Town to Cairo' },
      { n: 'James Cook', did: 'mapped the east coast of Australia in 1770' },
      { n: 'Queen Victoria', did: 'ruled at the height of the Empire and took the title Empress of India' },
    ],
    terms: [
      { t: 'empire', d: 'a group of countries or territories ruled by one country' },
      { t: 'colony', d: 'a territory ruled by another country' },
      { t: 'Scramble for Africa', d: 'the rush by European powers to take control of African land in the late 1800s' },
      { t: 'imperialism', d: 'the policy of building and keeping an empire' },
    ],
    facts: [
      F([1, 2], 'At its largest, in the early 1900s, about how much of the world’s land did the British Empire cover?', 'About a quarter', ['About a hundredth', 'About half', 'Almost all of it'], 'It was the largest empire in history.', 'The British Empire covered around a quarter of the world’s land and ruled about a quarter of its people.'),
      F([2, 3], 'Why did Britain build an empire?', 'For trade and raw materials, for power, and because many Britons believed they should spread their way of life', [
        'Because other countries asked to be ruled',
        'To escape the Industrial Revolution',
        'Because the Pope ordered it',
      ], 'Think about money, power and beliefs.', 'Empire brought profits, raw materials, markets, military bases and prestige. Many Victorians also believed, wrongly and with racist ideas, that British rule was good for others.'),
      F([2, 3], 'What did "the empire on which the sun never sets" mean?', 'It had territory all around the world, so it was always daytime somewhere in it', [
        'It was mostly in very hot countries',
        'It never had night-time curfews',
        'Its ruler never slept',
      ], 'Think about time zones.', 'British territories stretched across every continent, so the sun was always shining on some part of the Empire.'),
      F([3, 4], 'Why do people today hold very different views of the British Empire?', 'It brought trade and some railways and laws, but also violence, exploitation and the loss of freedom for colonised peoples', [
        'Nobody knows anything about it',
        'It only existed for ten years',
        'Everyone agrees it was entirely good',
      ], 'Whose point of view are you looking from?', 'Experiences of empire varied hugely. Many colonised people suffered conquest, famine and racism, while Britain gained wealth. Historians weigh this evidence differently.'),
      F([4, 5], 'Why was losing the American colonies in 1783 important for the Empire?', 'Britain turned more towards Asia and Africa to expand its empire', [
        'Britain gave up having an empire',
        'Britain became part of the USA',
        'It ended the slave trade at once',
      ], 'Where did the Empire grow after this?', 'After American independence (recognised in 1783), British expansion focused more on India, Asia, Australia and later Africa.'),
    ],
    reveals: [
      {
        prompt: 'Explain why Britain was able to build such a large empire.',
        hint: 'Think about the navy, trade companies, industry and weapons, and divisions among the peoples Britain conquered.',
        model:
          'Britain built a large empire partly because of its powerful navy, which protected trade routes and moved soldiers around the world. Trading companies like the East India Company also expanded British control, for example after winning at Plassey in 1757. The Industrial Revolution gave Britain wealth, steamships and modern weapons, which helped it defeat much less well-armed opponents. Britain also took advantage of divisions between local rulers, making alliances with some against others. Finally, many Britons believed empire was their right, so there was support for expansion.',
        checklist: ['Gives at least two reasons', 'Uses specific detail (navy, East India Company, Plassey)', 'Explains how each reason helped Britain expand', 'Links reasons together'],
      },
    ],
  },

  // ------------------------------------------------------------------ India
  {
    skill: 'empire.india',
    title: 'Britain and India',
    events: [
      E(1600, 'The East India Company is founded'),
      E(1757, 'The East India Company wins the Battle of Plassey'),
      E(1857, 'The Indian Rebellion begins', { key: true }),
      E(1858, 'The British government takes over from the East India Company and the Raj begins'),
      E(1876, 'Queen Victoria takes the title Empress of India'),
      E(1919, 'British troops kill hundreds of unarmed people at Amritsar'),
      E(1930, "Gandhi's Salt March"),
    ],
    people: [
      { n: 'Robert Clive', did: 'led the East India Company to victory at Plassey in 1757' },
      { n: 'Rani of Jhansi', did: 'was an Indian queen who fought against the British in 1857' },
      { n: 'Mahatma Gandhi', did: 'led peaceful protests against British rule, such as the Salt March' },
    ],
    terms: [
      { t: 'Raj', d: 'British rule over India from 1858 to 1947' },
      { t: 'East India Company', d: 'a private British trading company that came to rule much of India' },
      { t: 'sepoy', d: 'an Indian soldier in the East India Company army' },
      { t: 'viceroy', d: "the British monarch's representative who governed India" },
    ],
    facts: [
      F([1, 2], 'Which organisation first took control of large parts of India for Britain?', 'The East India Company', ['The Royal Navy', 'The Church of England', 'The Royal African Company'], 'It began as a trading company in 1600.', 'The East India Company, a private trading company with its own army, came to rule much of India after the Battle of Plassey in 1757.'),
      F([2, 3], 'What sparked the rebellion of 1857?', 'Rumours that new rifle cartridges were greased with cow and pig fat, offending Hindu and Muslim soldiers', [
        'The British left India',
        'Gandhi’s Salt March',
        'The building of the first railway in India',
      ], 'Soldiers had to bite the cartridges open.', 'Sepoys believed the cartridges broke their religious rules. This added to deep anger about British land seizures and interference in Indian customs.'),
      F([3, 4], 'What changed in India after the 1857 rebellion?', 'The British government took direct control from the East India Company', [
        'India became independent',
        'The East India Company was given more power',
        'The British left India for good',
      ], 'This was the start of the Raj.', 'In 1858 the Company’s rule ended, and India was ruled directly by the British government through a viceroy.'),
      F([3, 4], 'Why was India called the "jewel in the crown" of the Empire?', 'It was the most valuable part of the Empire, providing wealth, goods, soldiers and markets', [
        'It sent a famous jewel to Queen Victoria every year',
        'It was the smallest colony',
        'It was the first British colony',
      ], 'Think about what Britain gained from India.', 'India supplied raw materials such as cotton and tea, bought British goods, paid taxes and provided a huge army.'),
      F([4, 5], 'Why is the 1857 rebellion described differently by different people?', 'British writers often called it the "Indian Mutiny", while many Indians see it as a first war of independence', [
        'Nobody wrote about it at the time',
        'It happened in two different countries',
        'Historians disagree about which year it was',
      ], 'A "mutiny" is a revolt by soldiers. Is that the whole story?', 'Calling it a mutiny suggests just a soldiers’ revolt. Calling it a war of independence stresses wider Indian resistance to British rule.'),
    ],
    reveals: [
      {
        prompt: 'Explain why the rebellion of 1857 broke out in India.',
        hint: 'Separate the trigger (the cartridges) from longer-term causes.',
        model:
          'The trigger was the new Enfield rifle cartridges, which sepoys believed were greased with cow and pig fat. Biting them would break the religious rules of both Hindu and Muslim soldiers. But there were longer-term causes. The East India Company had taken over Indian states, sometimes using a rule that let it seize a kingdom if a ruler had no natural heir, which angered rulers such as the Rani of Jhansi. Many Indians also resented British interference in religion and customs and high taxes on land. So the cartridges set off anger that had been building for years.',
        checklist: ['Explains the trigger (the cartridges)', 'Gives at least one longer-term cause', 'Uses specific detail', 'Links the trigger to the longer-term causes'],
      },
    ],
  },

  // ------------------------------------------------------------------ the vote
  {
    skill: 'reform.voting',
    title: 'the struggle for the vote',
    events: [
      E(1819, 'The Peterloo Massacre in Manchester', { key: true }),
      E(1832, 'The Great Reform Act', { key: true }),
      E(1838, "The People's Charter is published"),
      E(1848, 'The last great Chartist petition is presented to Parliament'),
      E(1867, 'The Second Reform Act gives the vote to many working men in towns'),
      E(1872, 'The Ballot Act introduces secret voting'),
      E(1884, 'The Third Reform Act gives the vote to many men in the countryside'),
    ],
    people: [
      { n: 'Henry Hunt', did: 'was the radical speaker the crowd came to hear at Peterloo' },
      { n: 'William Lovett', did: "helped write the People's Charter" },
      { n: "Feargus O'Connor", did: 'was a Chartist leader who organised huge petitions and meetings' },
      { n: 'Earl Grey', did: 'was the Prime Minister who passed the Great Reform Act' },
    ],
    terms: [
      { t: 'rotten borough', d: 'a place with very few voters that still elected MPs' },
      { t: 'Chartists', d: 'a working-class movement of the 1830s and 1840s demanding the vote for all men' },
      { t: 'secret ballot', d: 'voting in private, so nobody knows how you voted' },
      { t: 'radical', d: 'someone who wants big changes to society or politics' },
    ],
    facts: [
      F([1, 2], 'What happened at Peterloo in 1819?', 'Soldiers on horseback charged a peaceful crowd at a meeting for reform in Manchester', [
        'Parliament gave all men the vote',
        'The first railway opened',
        'Workers burned down a factory',
      ], 'The name was a bitter joke about the Battle of Waterloo.', 'At St Peter’s Field, cavalry charged a crowd of tens of thousands who had come to hear Henry Hunt. At least 15 people were killed and hundreds injured.'),
      F([2, 3], 'Why was the voting system seen as unfair before 1832?', 'Few men could vote, and new industrial towns like Manchester had no MPs while rotten boroughs did', [
        'Everyone could vote, but only on Sundays',
        'Only women could vote',
        'Elections were held every month',
      ], 'Think about who could vote and where MPs came from.', 'Only a small share of men could vote. Booming cities had no MPs while tiny rotten boroughs, such as Old Sarum, elected two.'),
      F([2, 3], 'Who still could not vote after the Great Reform Act of 1832?', 'Most working-class men, and all women', ['Only landowners', 'Only people in London', 'Nobody: everyone could vote'], 'The Act mostly helped middle-class men.', 'The 1832 Act gave the vote to more middle-class men and gave MPs to new towns, but most working men and all women still could not vote.'),
      F([3, 4], "Which of these was NOT one of the six points of the People's Charter?", 'Votes for women', [
        'A vote for every man over 21',
        'A secret ballot',
        'Payment for MPs',
      ], 'The Charter was radical, but in one way it was not.', 'The six points were: votes for all men over 21, a secret ballot, no property qualification for MPs, payment of MPs, equal constituencies and yearly elections.'),
      F([3, 4], 'Why did the Chartists fail in the short term?', 'Parliament rejected their petitions, and the movement was divided over whether to use force', [
        'They won every election',
        'They never presented a petition',
        'Queen Victoria banned them',
      ], 'What happened to the petitions of 1839, 1842 and 1848?', 'Parliament rejected all three great petitions. Chartists disagreed between "moral force" and "physical force", and the government acted firmly against them.'),
      F([3, 4], 'Why was the secret ballot (1872) important?', 'Voters could no longer easily be bribed or bullied by employers or landlords', [
        'It gave women the vote',
        'It meant elections were held in secret places',
        'It ended elections',
      ], 'Before 1872 people voted out loud in public.', 'Before 1872 votes were declared publicly, so landlords and employers could see and punish voters. The secret ballot made voting freer.'),
      F([4, 5], 'Why can Chartism be seen as a long-term success?', 'Five of their six points later became law', [
        'All six points became law in 1848',
        'Feargus O’Connor became Prime Minister',
        'It won the vote for women',
      ], 'Look at what happened after 1848.', 'Over the following decades, every point except yearly elections became law, though long after the Chartist movement had faded.'),
    ],
    reveals: [
      {
        prompt: 'Explain why the Chartists did not achieve their aims in the 1840s.',
        hint: 'Think about Parliament, divisions in the movement and the government’s response.',
        model:
          'The Chartists failed partly because Parliament refused to listen: their great petitions of 1839, 1842 and 1848 were all rejected, and MPs, elected by property owners, did not want to give power to working men. The movement was also divided between "moral force" Chartists like William Lovett, who wanted peaceful persuasion, and "physical force" supporters, which frightened the middle classes. The government acted firmly, arresting leaders and using troops. Finally, support rose and fell with the economy: when times improved, fewer people joined. So by 1848 the movement had faded.',
        checklist: ['Gives at least two reasons', 'Mentions Parliament rejecting the petitions', 'Mentions divisions or government action', 'Uses specific names or dates'],
      },
    ],
  },

  // ------------------------------------------------------------------ votes for women
  {
    skill: 'reform.suffrage',
    title: 'votes for women',
    events: [
      E(1897, 'The NUWSS (the suffragists) is formed'),
      E(1903, 'Emmeline Pankhurst founds the WSPU (the suffragettes)'),
      E(1913, 'Emily Wilding Davison is fatally injured at the Epsom Derby'),
      E(1914, 'The suffragettes suspend their campaign when war breaks out'),
      E(1918, 'Women over 30 who meet a property qualification win the vote', { key: true }),
      E(1919, 'Nancy Astor becomes the first woman to take her seat as an MP'),
      E(1928, 'Women win the vote on equal terms with men, at 21', { key: true }),
    ],
    people: [
      { n: 'Millicent Fawcett', did: 'led the NUWSS, the peaceful suffragists' },
      { n: 'Emmeline Pankhurst', did: 'founded the WSPU in 1903' },
      { n: 'Emily Wilding Davison', did: 'died after running onto the course at the 1913 Derby' },
      { n: 'Christabel Pankhurst', did: "was Emmeline's daughter and a leading organiser of the WSPU" },
      { n: 'Sophia Duleep Singh', did: 'was an Indian princess living in Britain who campaigned as a suffragette' },
      { n: 'Nancy Astor', did: 'was the first woman to take her seat as an MP, in 1919' },
    ],
    terms: [
      { t: 'suffrage', d: 'the right to vote in elections' },
      { t: 'suffragist', d: "a campaigner for women's votes who used peaceful, legal methods" },
      { t: 'suffragette', d: 'a member of the WSPU, prepared to use direct action and break the law' },
      { t: 'force-feeding', d: 'forcing food into hunger strikers through a tube' },
      { t: 'Cat and Mouse Act', d: 'the 1913 law that released hunger strikers until they recovered, then re-arrested them' },
    ],
    sorts: [
      {
        cats: ['Suffragists', 'Suffragettes'],
        ask: ['about the suffragists', 'about the suffragettes'],
        q: 'Is this about the suffragists (NUWSS) or the suffragettes (WSPU)?',
        hint: 'Suffragists were peaceful and older; suffragettes used direct action.',
        ex: 'Both groups wanted votes for women, but they used very different methods.',
        items: [
          ['Led by Millicent Fawcett', 0],
          ['Used peaceful, legal methods such as petitions and marches', 0],
          ['Formed in 1897', 0],
          ['Allowed men to be members', 0],
          ['Led by Emmeline Pankhurst', 1],
          ['Used the motto "Deeds, not words"', 1],
          ['Smashed windows and set fire to post boxes', 1],
          ['Went on hunger strike in prison', 1],
        ],
      },
    ],
    facts: [
      F([1, 2], 'Which women could vote after the Representation of the People Act of 1918?', 'Women over 30 who met a property qualification', [
        ['All women over 21', 'Equal voting at 21 came ten years later, in 1928.'],
        'All women over 18',
        'Only women who had worked in factories in the war',
      ], 'It was only some women at first.', 'The 1918 Act gave the vote to about 8 million women over 30 who met a property qualification, and to almost all men over 21.'),
      F([2, 3], 'What was the main difference between suffragists and suffragettes?', 'Suffragists used peaceful, legal methods; suffragettes were prepared to break the law', [
        'Suffragists wanted the vote; suffragettes did not',
        'Suffragettes were all men',
        'There was no difference',
      ], 'Think about their methods.', 'The NUWSS campaigned peacefully. The WSPU used direct action such as smashing windows and arson to force attention.'),
      F([3, 4], 'Why did some people argue that suffragette violence harmed the cause?', 'It gave opponents an excuse to say women were too emotional to be trusted with the vote', [
        'It made the suffragists stop campaigning',
        'It led to women winning the vote in 1903',
        'It made Parliament give men the vote instead',
      ], 'How did opponents use the attacks?', 'Opponents and some MPs said violent tactics proved women should not vote. Others argue the suffragettes kept the issue in the headlines.'),
      F([3, 4], "Why did women's war work help them win the vote in 1918?", 'It challenged ideas about what women could do, while the government was already changing the voting rules for soldiers', [
        'Women were paid more than men in the war',
        'The suffragettes won a battle in France',
        'Women were not allowed to work in the war',
      ], 'Many soldiers could not vote either, under the old rules.', 'Women worked in munitions factories, transport and nursing. As Parliament reformed the vote for returning soldiers, it was hard to leave women out.'),
      F([4, 5], 'Why did the 1918 Act give the vote to women over 30 rather than 21?', 'Politicians did not want women to be a majority of voters after so many men had died in the war', [
        'Women under 30 did not want to vote',
        'Nobody under 30 could vote at all',
        'The suffragettes asked for it to be 30',
      ], 'Think about the numbers of men and women after the war.', 'So many men had been killed that, at 21, women would have outnumbered men as voters. The age limit avoided this.'),
    ],
    reveals: [
      {
        prompt: 'Explain why some women won the right to vote in 1918.',
        hint: 'Think about the suffragists, the suffragettes, the First World War and the government’s need to change the rules.',
        model:
          'One reason was the long campaign. Since 1897 the suffragists had shown with petitions and marches that many women wanted the vote, and from 1903 the suffragettes kept the issue in the headlines with direct action, though some say their violence put people off. The most important reason was probably the First World War. Women did vital work in munitions factories and transport, which changed attitudes. Also, the government needed to change the law so returning soldiers could vote, and it was hard to leave women out. So the 1918 Act gave the vote to women over 30 who met a property qualification.',
        checklist: ['Mentions the suffragists or suffragettes', 'Explains the impact of the First World War', 'Mentions what the 1918 Act actually did', 'Says which reason mattered most, or links them'],
      },
      {
        prompt: '"The suffragettes did more harm than good to the campaign for votes for women." How far do you agree?',
        src: SRC.suffragetteLeaflet,
        hint: 'Give evidence on both sides and reach a judgement.',
        model:
          'There is some truth in this. Suffragette violence, such as smashing windows and setting fire to post boxes, let opponents argue that women were too emotional to vote, and some MPs who had supported reform turned against it. However, the suffragettes also did good. Their actions kept votes for women in the newspapers, and hunger strikes and force-feeding won them sympathy. Their motto "Deeds, not words" shows they felt fifty years of polite campaigning had failed. Overall I disagree: they made the campaign impossible to ignore, although the war and the suffragists’ work also mattered.',
        checklist: ['Gives evidence that they did harm', 'Gives evidence that they helped', 'Uses specific detail', 'Reaches a clear judgement about "how far"'],
      },
    ],
  },
]
