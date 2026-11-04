/**
 * Culture: German-speaking countries and cities, festivals and traditions, everyday life. Facts are kept to what a
 * KS3 textbook states with confidence; anything that varies by region is phrased as "often", "many" or "traditionally".
 */
import type { ItemGenerator } from '@/engine/registry'
import { matchItem, orderItem, textItem } from '../../kit'
import { G, accepts, factGen, keyboardTip, pickN, revealGen, type Fact, type Task } from './lib'

// ------------------------------------------------------------------ countries and cities

const COUNTRY_FACTS: Fact[] = [
  { q: 'In which of these countries is German the main language?', a: 'Austria', wrong: ['Denmark', 'the Netherlands', 'Sweden'], hint: 'Its capital is Vienna (Wien).', why: 'German is the main language of Germany, Austria and most of Switzerland, and of Liechtenstein. It is also an official language in Luxembourg and Belgium.', lv: 1 },
  { q: 'What is the capital of Germany?', a: 'Berlin', wrong: [{ label: 'Bonn', misconception: 'bonn', feedback: 'Bonn was the capital of West Germany before reunification in 1990. Today the capital is Berlin.' }, 'Munich (München)', 'Hamburg'], hint: 'It is also the biggest city.', why: 'Berlin is the capital and the biggest city of Germany.', lv: 1 },
  { q: 'What is the capital of Austria?', a: 'Vienna (Wien)', wrong: ['Salzburg', 'Innsbruck', 'Munich (München)'], hint: 'In German it is Wien.', why: 'Vienna (Wien) is the capital of Austria, on the river Danube (Donau).', lv: 1 },
  { q: 'Switzerland has no official capital, but which city is the seat of its government (the "federal city")?', a: 'Bern', wrong: [{ label: 'Zurich (Zürich)', misconception: 'biggest-city', feedback: 'Zürich is the biggest Swiss city, but the government sits in Bern.' }, 'Geneva (Genf)', 'Basel'], hint: 'It is not the biggest Swiss city.', why: 'Bern is the "federal city" where the Swiss government and parliament sit. Zürich is the biggest city.', lv: 3 },
  { q: 'How many federal states (Bundesländer) does Germany have?', a: '16', wrong: ['12', '9', { label: '26', misconception: 'cantons', feedback: 'Switzerland has 26 cantons. Germany has 16 states.' }], hint: 'Bavaria (Bayern) is the biggest one.', why: 'Germany has 16 Bundesländer, such as Bayern, Hessen and Sachsen. Berlin, Hamburg and Bremen are city-states. Austria has 9 Bundesländer.', lv: 3 },
  { q: 'Which currency is used in Switzerland?', a: 'the Swiss franc', wrong: [{ label: 'the euro', misconception: 'euro', feedback: 'Switzerland is not in the EU and does not use the euro.' }, 'the pound', 'the mark'], hint: 'Switzerland is not in the European Union.', why: 'Switzerland uses the Swiss franc (der Franken). Germany and Austria use the euro.', lv: 3 },
  { q: 'Which currency do Germany and Austria use today?', a: 'the euro', wrong: [{ label: 'the Deutschmark', misconception: 'old-currency', feedback: 'Germany used the Deutschmark until the euro came in (as coins and notes in 2002).' }, 'the Swiss franc', 'the pound'], hint: 'Most EU countries use it.', why: 'Germany and Austria use the euro. Euro coins and notes arrived in 2002.', lv: 2 },
  { q: 'What are the colours of the German flag?', a: 'black, red and gold', wrong: [{ label: 'red, white and red', misconception: 'austria-flag', feedback: 'Red-white-red is the flag of Austria.' }, 'red with a white cross', 'black, white and red'], hint: 'In German: Schwarz-Rot-Gold.', why: 'The German flag has three stripes: black, red and gold (Schwarz-Rot-Gold).', lv: 1 },
  { q: 'Which country\'s flag is red with a white cross?', a: 'Switzerland', wrong: ['Austria', 'Germany', 'Belgium'], hint: 'Its flag is square.', why: 'The Swiss flag is a white cross on red. Austria\'s is red-white-red stripes.', lv: 2 },
  { q: 'Which river flows through Vienna?', a: 'the Danube (die Donau)', wrong: ['the Rhine (der Rhein)', 'the Elbe', 'the Thames'], hint: 'There is a famous waltz about it: The Blue ...', why: 'The Danube (die Donau) flows through Vienna. It is one of Europe\'s longest rivers.', lv: 3 },
  { q: 'Which river flows through Cologne (Köln)?', a: 'the Rhine (der Rhein)', wrong: ['the Danube (die Donau)', 'the Elbe', 'the Spree'], hint: 'It also flows through Bonn and Düsseldorf.', why: 'The Rhine (der Rhein) flows through Cologne, Bonn and Düsseldorf.', lv: 3 },
  { q: 'Which river flows through Hamburg?', a: 'the Elbe', wrong: ['the Rhine (der Rhein)', 'the Danube (die Donau)', 'the Main'], hint: 'It also flows through Dresden.', why: 'The Elbe flows through Dresden and Hamburg to the North Sea.', lv: 4 },
  { q: 'Which river flows through Berlin?', a: 'the Spree', wrong: ['the Rhine (der Rhein)', 'the Danube (die Donau)', 'the Main'], hint: 'It is a short name, starting with S.', why: 'The Spree flows through the centre of Berlin.', lv: 4 },
  { q: 'Which lake lies between Germany, Austria and Switzerland?', a: 'Lake Constance (der Bodensee)', wrong: ['Lake Geneva', 'Lake Garda', 'Loch Ness'], hint: 'In German its name ends in -see.', why: 'Lake Constance (der Bodensee) borders Germany, Austria and Switzerland.', lv: 4 },
  { q: 'What is the highest mountain in Germany?', a: 'the Zugspitze', wrong: [{ label: 'the Matterhorn', misconception: 'swiss-mountain', feedback: 'The Matterhorn is on the border of Switzerland and Italy.' }, 'Mont Blanc', 'Ben Nevis'], hint: 'It is in the Bavarian Alps.', why: 'The Zugspitze, in the Alps on the border with Austria, is Germany\'s highest mountain (almost 3,000 m).', lv: 3 },
  { q: 'In which German state (Bundesland) is the fairy-tale castle Neuschwanstein?', a: 'Bavaria (Bayern)', wrong: ['Saxony (Sachsen)', 'Hesse (Hessen)', 'Lower Saxony (Niedersachsen)'], hint: 'It is in the south, near the Alps.', why: 'Neuschwanstein is in Bavaria (Bayern), in the south of Germany.', lv: 4 },
  { q: 'Which composer was born in Salzburg, in Austria?', a: 'Mozart', wrong: [{ label: 'Beethoven', misconception: 'composers', feedback: 'Beethoven was born in Bonn, in Germany.' }, 'Bach', 'Handel'], hint: 'His first name was Wolfgang.', why: 'Wolfgang Amadeus Mozart was born in Salzburg in 1756.', lv: 4 },
  { q: 'Which composer was born in Bonn, in Germany?', a: 'Beethoven', wrong: [{ label: 'Mozart', misconception: 'composers', feedback: 'Mozart was born in Salzburg, in Austria.' }, 'Chopin', 'Vivaldi'], hint: 'He went deaf but kept composing.', why: 'Ludwig van Beethoven was born in Bonn in 1770 and later lived in Vienna.', lv: 4 },
  { q: 'In which year did the Berlin Wall fall?', a: '1989', wrong: [{ label: '1961', misconception: 'wall-built', feedback: '1961 is when the Wall was built.' }, { label: '1990', misconception: 'reunification', feedback: '1990 is when Germany was reunified, the year after the Wall fell.' }, '1945'], hint: 'Germany was reunified the following year.', why: 'The Berlin Wall fell on 9 November 1989. Germany was reunified on 3 October 1990.', lv: 4 },
  { q: 'What is the Brandenburger Tor?', a: 'a famous gate in Berlin', wrong: ['a castle in Bavaria', 'a cathedral in Cologne', 'a bridge in Hamburg'], hint: 'Tor means gate.', why: 'The Brandenburger Tor (Brandenburg Gate) in Berlin is one of Germany\'s best-known landmarks.', lv: 2 },
  { q: 'The Kölner Dom is a famous ... in Cologne.', a: 'cathedral', wrong: ['castle', 'bridge', 'stadium'], hint: 'der Dom is a big church.', why: 'der Kölner Dom is Cologne Cathedral, a huge Gothic cathedral next to the main station.', lv: 2 },
  { q: 'Which of these countries is NOT a neighbour of Germany?', a: 'Italy', wrong: ['France', 'Poland', 'Denmark'], hint: 'Germany has nine neighbours, from Denmark in the north to Switzerland and Austria in the south.', why: 'Germany borders Denmark, Poland, the Czech Republic, Austria, Switzerland, France, Luxembourg, Belgium and the Netherlands. Italy is further south, beyond Austria and Switzerland.', lv: 3 },
  { q: 'How many national languages does Switzerland have?', a: 'four', wrong: ['one', 'two', 'three'], hint: 'German is the biggest, but not the only one.', why: 'Switzerland has four national languages: German, French, Italian and Romansh. Most Swiss people speak German.', lv: 4 },
  { q: 'Which of these is NOT a national language of Switzerland?', a: 'Spanish', wrong: ['French', 'Italian', 'Romansh'], hint: 'Think about which countries Switzerland borders.', why: 'The four Swiss national languages are German, French, Italian and Romansh.', lv: 5 },
  { q: 'Roughly how many people live in Germany?', a: 'over 80 million', wrong: [{ label: 'about 9 million', misconception: 'population', feedback: 'About 9 million is the population of Austria or of Switzerland.' }, 'about 30 million', 'about 300 million'], hint: 'More people live in Germany than in any other EU country.', why: 'Germany has over 80 million people, the most of any EU country.', lv: 4 },
  { q: 'Which German city is famous for its big port?', a: 'Hamburg', wrong: ['Munich (München)', 'Stuttgart', 'Nuremberg (Nürnberg)'], hint: 'It is in the north, on the river Elbe.', why: 'Hamburg has one of Europe\'s biggest ports, on the river Elbe.', lv: 3 },
  { q: 'What is Liechtenstein?', a: 'a small German-speaking country between Switzerland and Austria', wrong: ['a region in the south of Germany', 'a city in Austria', 'a mountain in Switzerland'], hint: 'It has its own prince.', why: 'Liechtenstein is a small German-speaking country (a principality) between Switzerland and Austria.', lv: 5 },
  { q: 'Which is the biggest city in Germany?', a: 'Berlin', wrong: ['Hamburg', 'Munich (München)', 'Frankfurt'], hint: 'It is also the capital.', why: 'Berlin is the biggest city; Hamburg is second and Munich third.', lv: 2 },
]

const PLACE_NAMES: { en: string; de: string }[] = [
  { en: 'Munich', de: 'München' },
  { en: 'Cologne', de: 'Köln' },
  { en: 'Vienna', de: 'Wien' },
  { en: 'Nuremberg', de: 'Nürnberg' },
  { en: 'Hanover', de: 'Hannover' },
  { en: 'Geneva', de: 'Genf' },
  { en: 'Lucerne', de: 'Luzern' },
  { en: 'Bavaria', de: 'Bayern' },
  { en: 'Austria', de: 'Österreich' },
  { en: 'Switzerland', de: 'die Schweiz' },
  { en: 'Lake Constance', de: 'der Bodensee' },
  { en: 'the Danube', de: 'die Donau' },
  { en: 'the Rhine', de: 'der Rhein' },
  { en: 'the Alps', de: 'die Alpen' },
  { en: 'the Black Forest', de: 'der Schwarzwald' },
  { en: 'the Baltic Sea', de: 'die Ostsee' },
  { en: 'the North Sea', de: 'die Nordsee' },
]

// ------------------------------------------------------------------ festivals

const FESTIVAL_FACTS: Fact[] = [
  { q: 'What is a Weihnachtsmarkt?', a: 'a Christmas market', wrong: ['a Christmas dinner', 'a nativity play', 'a Christmas tree'], hint: 'Weihnachten = Christmas, der Markt = market.', why: 'A Weihnachtsmarkt is a Christmas market, with wooden stalls selling gifts, decorations, gingerbread and hot drinks.', lv: 1 },
  { q: 'When is Nikolaustag (St Nicholas\' Day)?', a: '6 December', wrong: ['24 December', '25 December', '11 November'], hint: 'It is early in December.', why: 'Nikolaustag is on 6 December.', lv: 2 },
  { q: 'On the evening before Nikolaustag, what do children traditionally put outside the door?', a: 'their boots or shoes', wrong: [{ label: 'a stocking', misconception: 'uk-christmas', feedback: 'Hanging up a stocking is a British Christmas Eve tradition.' }, 'a carrot for the reindeer', 'a letter to the Easter Bunny'], hint: 'In the morning they are filled with sweets, nuts or small presents.', why: 'Children clean their boots or shoes and put them outside the door on 5 December; in the morning they find sweets, nuts or small presents in them.', lv: 2 },
  { q: 'In Germany, when are Christmas presents usually given?', a: 'on the evening of 24 December (Heiligabend)', wrong: [{ label: 'on the morning of 25 December', misconception: 'uk-christmas', feedback: 'That is the British tradition. In Germany presents are usually opened on Christmas Eve.' }, 'on 6 January', 'on 26 December'], hint: 'Heiligabend is Christmas Eve.', why: 'In Germany the presents are usually opened on the evening of 24 December, Heiligabend (Christmas Eve).', lv: 2 },
  { q: 'What is an Adventskranz?', a: 'a wreath with four candles: one more is lit each Sunday in Advent', wrong: [{ label: 'a calendar with 24 little doors', misconception: 'adventskalender', feedback: 'That is an Adventskalender.' }, 'a decoration for the top of the Christmas tree', 'a cake eaten on Christmas Day'], hint: 'der Kranz = wreath.', why: 'The Adventskranz is a wreath of fir branches with four candles. One more candle is lit on each of the four Sundays before Christmas.', lv: 3 },
  { q: 'Which city\'s Christmas market, the Christkindlesmarkt, is one of the most famous in Germany?', a: 'Nuremberg (Nürnberg)', wrong: ['Hamburg', 'Bonn', 'Kiel'], hint: 'It is in Bavaria and is also famous for Lebkuchen.', why: 'The Nuremberg Christkindlesmarkt is one of Germany\'s best-known Christmas markets. Nuremberg is also famous for Lebkuchen (gingerbread).', lv: 4 },
  { q: 'Which of these would you typically buy at a German Christmas market?', a: 'Lebkuchen (gingerbread)', wrong: [{ label: 'mince pies', misconception: 'uk-christmas', feedback: 'Mince pies are British.' }, 'Easter eggs', 'ice lollies'], hint: 'It is a spiced biscuit, often heart-shaped.', why: 'Lebkuchen are spiced gingerbread biscuits, sold everywhere at Christmas markets.', lv: 2 },
  { q: 'What is Kinderpunsch, sold at Christmas markets?', a: 'a warm fruit punch with no alcohol', wrong: ['a cold lemonade', 'a hot chocolate with cream', 'a type of biscuit'], hint: 'Kinder = children.', why: 'Kinderpunsch is a warm, spiced fruit punch without alcohol - the children\'s version of Glühwein.', lv: 3 },
  { q: 'What is Silvester?', a: 'New Year\'s Eve (31 December)', wrong: ['Christmas Eve (24 December)', 'Boxing Day (26 December)', 'Saint Martin\'s Day (11 November)'], hint: 'There are fireworks at midnight.', why: 'Silvester is New Year\'s Eve, 31 December, with parties and fireworks at midnight.', lv: 2 },
  { q: 'Before midnight on 31 December, what do Germans wish each other?', a: 'Guten Rutsch!', wrong: ['Frohe Ostern!', 'Alles Gute zum Geburtstag!', 'Guten Appetit!'], hint: 'It literally means "good slide" (into the new year).', why: 'Guten Rutsch (ins neue Jahr)! means "have a good slide into the new year". After midnight you say Frohes neues Jahr!', lv: 3 },
  { q: 'What happens in many towns on Sankt Martin (11 November)?', a: 'children walk in a procession with lanterns, singing songs', wrong: [{ label: 'people light bonfires and set off fireworks', misconception: 'bonfire-night', feedback: 'That sounds like Bonfire Night in the UK (5 November).' }, 'children hunt for eggs in the garden', 'families eat a big turkey dinner'], hint: 'Children often make the lanterns at school.', why: 'On Sankt Martin children walk through the streets with lanterns (der Laternenumzug), singing Martin songs.', lv: 3 },
  { q: 'Karneval (also called Fasching or Fastnacht) takes place just before which time of year?', a: 'Lent (the weeks before Easter)', wrong: ['Christmas', 'Halloween', 'the summer holidays'], hint: 'In the UK, Pancake Day is at the same time.', why: 'Karneval / Fasching ends just before Ash Wednesday, the start of Lent - the same time as Pancake Day in the UK.', lv: 3 },
  { q: 'Which cities are most famous for big Karneval parades on Rosenmontag?', a: 'Cologne, Düsseldorf and Mainz', wrong: ['Hamburg, Berlin and Kiel', 'Vienna, Salzburg and Graz', 'Zurich, Bern and Basel'], hint: 'They are all near the Rhine.', why: 'The biggest Rosenmontag parades are in the Rhineland: Cologne (Köln), Düsseldorf and Mainz.', lv: 4 },
  { q: 'When does the Karneval season officially begin in cities like Cologne?', a: 'on 11 November at 11:11', wrong: ['on 1 January at midnight', 'on 6 December', 'on 31 October'], hint: 'The number 11 is special in Karneval.', why: 'The Karneval season, "the fifth season", officially starts on 11.11. at 11:11, although the big parades are in February or March.', lv: 5 },
  { q: 'Where does the Oktoberfest take place?', a: 'Munich (München)', wrong: ['Berlin', 'Vienna (Wien)', 'Hamburg'], hint: 'It is the capital of Bavaria.', why: 'The Oktoberfest takes place every year in Munich, the capital of Bavaria.', lv: 1 },
  { q: 'In which month does the Oktoberfest begin?', a: 'September', wrong: [{ label: 'October', misconception: 'oktoberfest', feedback: 'Despite its name, it starts in September and ends in early October.' }, 'August', 'November'], hint: 'Despite the name...', why: 'The Oktoberfest starts in September and ends in the first days of October.', lv: 3 },
  { q: 'The first Oktoberfest, in 1810, celebrated...', a: 'a royal wedding', wrong: ['the end of a war', 'the founding of Munich', 'the first beer brewed in Bavaria'], hint: 'The field where it is held, the Theresienwiese, is named after the bride.', why: 'It began in 1810 with celebrations for the wedding of Crown Prince Ludwig of Bavaria and Princess Therese, which is why the field is called the Theresienwiese.', lv: 5 },
  { q: 'In German tradition, who brings the Easter eggs?', a: 'der Osterhase (the Easter hare)', wrong: ['der Weihnachtsmann', 'das Christkind', 'der Nikolaus'], hint: 'Ostern = Easter.', why: 'der Osterhase, the Easter hare (or bunny), hides the Easter eggs.', lv: 2 },
  { q: 'In many parts of southern Germany and Austria, who traditionally brings the presents on 24 December?', a: 'das Christkind', wrong: ['der Osterhase', 'Sankt Martin', { label: 'der Nikolaus', misconception: 'nikolaus', feedback: 'Nikolaus brings small presents on 6 December, not on Christmas Eve.' }], hint: 'Its name contains "Christ".', why: 'In many southern and Catholic areas the Christkind brings the presents; in the north it is more often the Weihnachtsmann.', lv: 3 },
  { q: 'What does Germany celebrate on 3 October, the Tag der Deutschen Einheit?', a: 'the reunification of Germany in 1990', wrong: [{ label: 'the fall of the Berlin Wall', misconception: 'wall-date', feedback: 'The Wall fell on 9 November 1989. Germany was reunified on 3 October 1990.' }, 'the start of the Oktoberfest', 'the end of the school year'], hint: 'Einheit = unity.', why: 'The Tag der Deutschen Einheit (Day of German Unity) marks the reunification of East and West Germany on 3 October 1990. It is a national holiday.', lv: 4 },
  { q: 'What is Erntedankfest?', a: 'a harvest festival', wrong: ['a winter festival', 'a carnival', 'a birthday party'], hint: 'die Ernte = harvest, danken = to thank.', why: 'Erntedankfest is the harvest festival, usually at the start of October, giving thanks for the harvest.', lv: 4 },
]

const GREETINGS: { de: string; en: string }[] = [
  { de: 'Frohe Weihnachten!', en: 'Happy Christmas!' },
  { de: 'Frohe Ostern!', en: 'Happy Easter!' },
  { de: 'Frohes neues Jahr!', en: 'Happy New Year!' },
  { de: 'Guten Rutsch!', en: 'Have a good New Year! (said before it starts)' },
  { de: 'Alles Gute zum Geburtstag!', en: 'Happy birthday!' },
  { de: 'Schöne Ferien!', en: 'Have a nice holiday!' },
]

/** Fixed-date (or always-in-this-order) events in the calendar year. */
const YEAR: { de: string; en: string; when: string }[] = [
  { de: 'Rosenmontag', en: 'Rose Monday carnival parades', when: 'February or March' },
  { de: 'Ostern', en: 'Easter', when: 'March or April' },
  { de: 'Beginn des Oktoberfests', en: 'start of the Oktoberfest', when: 'September' },
  { de: 'Tag der Deutschen Einheit', en: 'Day of German Unity', when: '3 October' },
  { de: 'Sankt Martin', en: 'St Martin\'s Day', when: '11 November' },
  { de: 'Nikolaustag', en: 'St Nicholas\' Day', when: '6 December' },
  { de: 'Heiligabend', en: 'Christmas Eve', when: '24 December' },
  { de: 'Silvester', en: 'New Year\'s Eve', when: '31 December' },
]

const FESTIVAL_TASKS: Task[] = [
  {
    prompt: 'In English, explain two differences between how Christmas is celebrated in Germany and in the UK.',
    model: 'In Germany the main presents are usually opened on the evening of 24 December, Heiligabend, while in the UK most people open them on the morning of the 25th. Germans also celebrate Nikolaustag on 6 December, when children put their boots outside the door and find sweets in them the next morning. Many German towns have a Christmas market where people buy Lebkuchen and drink Kinderpunsch or Glühwein.',
    checklist: ['Explains the different day for presents (24 December, Heiligabend)', 'Mentions another German tradition (Nikolaustag, Adventskranz, Christkind or Christmas markets)', 'Makes a clear comparison with the UK (while, but, whereas)', 'Uses at least one German word correctly'],
    hint: 'Think about when presents are opened, who brings them, and what happens in Advent.',
    placeholder: 'Write in English...',
    explanation: 'Compare your answer with the model. Did you make a clear comparison each time?',
  },
  {
    prompt: 'In English, describe what happens during Karneval (Fasching) in Germany, and when it takes place.',
    model: 'Karneval, also called Fasching or Fastnacht, takes place in February or March, just before Lent. People dress up in costumes and go to parties, and there are big parades on Rosenmontag in cities like Cologne, Düsseldorf and Mainz, where sweets are thrown into the crowds. The season officially begins on 11 November at 11:11.',
    checklist: ['Says when it takes place (February / March, before Lent)', 'Mentions costumes or parties', 'Mentions the Rosenmontag parades and at least one city', 'Uses at least one German word correctly (Fasching, Rosenmontag...)'],
    hint: 'When? Where? What do people do? What is Rosenmontag?',
    placeholder: 'Write in English...',
    explanation: 'Compare your answer with the model. Did you cover when, where and what happens?',
  },
]

// ------------------------------------------------------------------ everyday life

const EVERYDAY_FACTS: Fact[] = [
  { q: 'What is a Schultüte?', a: 'a big cone of sweets and school things children get on their first day at school', wrong: ['a school bag with wheels', 'a school report', 'a packed lunch box'], hint: 'die Tüte = bag or cone; it is a present.', why: 'On their first day at primary school, German children get a Schultüte: a large decorated cardboard cone filled with sweets, toys and school things.', lv: 1 },
  { q: 'In German schools, which is the best mark?', a: '1 (sehr gut)', wrong: [{ label: '6 (ungenügend)', misconception: 'grades', feedback: '6 is the worst mark. 1 is the best.' }, 'A*', '10'], hint: 'It is the opposite of what you might expect.', why: 'German school marks go from 1 (sehr gut, very good) to 6 (ungenügend, very poor).', lv: 2 },
  { q: 'What is the Abitur?', a: 'the exams at the end of secondary school that you need for university', wrong: ['a school uniform', 'a present on the first day of school', 'a school trip'], hint: 'It is like A levels in England.', why: 'The Abitur is the final exam at a Gymnasium (and some other schools), usually taken at 18 or 19. You need it to go to university.', lv: 3 },
  { q: 'What do most pupils in Germany wear to school?', a: 'their own clothes', wrong: [{ label: 'a blazer and tie', misconception: 'uniform', feedback: 'Most German schools have no uniform.' }, 'a tracksuit', 'a white shirt and a school jumper'], hint: 'Most German schools do not have a uniform.', why: 'Most German schools do not have a uniform, so pupils wear their own clothes.', lv: 1 },
  { q: 'Who should you call "Sie" rather than "du"?', a: 'an adult you do not know well, such as a shop assistant', wrong: ['your best friend', 'your little brother', 'your cat'], hint: 'Sie is the polite form.', why: 'Use Sie for adults you do not know well (and teachers). Use du for friends, family, children and pets.', lv: 2 },
  { q: 'You meet your German friend\'s mother, Frau Schmidt, for the first time. What do you say?', a: 'Guten Tag, Frau Schmidt. Wie geht es Ihnen?', wrong: [{ label: 'Hallo! Wie geht\'s dir?', misconception: 'du-sie', feedback: 'dir is the du form. With an adult you do not know, use Sie: Wie geht es Ihnen?' }, 'Tschüss, Frau Schmidt!', 'Gute Nacht! Wie heißt du?'], hint: 'Use the polite Sie form.', why: 'With an adult you do not know, use Sie: Wie geht es Ihnen? (Ihnen is the polite "you".)', lv: 3 },
  { q: 'Where would you hear the greeting "Grüß Gott"?', a: 'in southern Germany and Austria', wrong: ['in northern Germany', 'only in Berlin', 'in the Netherlands'], hint: 'Think of Bavaria and the Alps.', why: '"Grüß Gott" is a common greeting in Bavaria and Austria. In the north you are more likely to hear "Moin".', lv: 3 },
  { q: 'Where would you be most likely to hear people say "Moin!" to say hello?', a: 'in northern Germany', wrong: ['in Bavaria', 'in Austria', 'in Switzerland'], hint: 'Think of Hamburg and the coast.', why: '"Moin" (or "Moin moin") is the typical greeting in northern Germany, at any time of day.', lv: 4 },
  { q: 'In Switzerland, which greeting means "hello"?', a: 'Grüezi', wrong: ['Tschüss', 'Prost', 'Gesundheit'], hint: 'It is related to "Grüß Gott".', why: '"Grüezi" is the polite Swiss German greeting.', lv: 4 },
  { q: 'What is "Kaffee und Kuchen"?', a: 'coffee and cake in the afternoon, often at the weekend', wrong: ['a breakfast of coffee and bread', 'a type of German café chain', 'a dessert eaten after the evening meal'], hint: 'It happens at about 3 or 4 o\'clock.', why: 'Kaffee und Kuchen is a tradition of coffee (or tea, or hot chocolate) and cake in the afternoon, especially on Sundays.', lv: 2 },
  { q: 'What is "Abendbrot"?', a: 'a light evening meal, often bread with cheese and cold meats', wrong: ['a big hot lunch', 'a type of cake', 'a midnight snack'], hint: 'der Abend = evening, das Brot = bread.', why: 'Abendbrot ("evening bread") is a traditional cold evening meal of bread with cheese, cold meats and salad. Many families have their hot meal at lunchtime.', lv: 3 },
  { q: 'On which day are most shops in Germany closed?', a: 'Sunday', wrong: ['Saturday', 'Monday', 'Wednesday'], hint: 'It is a rest day.', why: 'In Germany most shops are closed on Sundays (some bakeries and shops at stations are open).', lv: 2 },
  { q: 'What is "Pfand"?', a: 'money you pay on a bottle or can, and get back when you return it', wrong: ['a tax on sweets', 'a type of German bread', 'a fine for being late'], hint: 'It is a way to encourage recycling.', why: 'Pfand is a deposit on bottles and cans; you get it back when you take them back to the shop.', lv: 4 },
  { q: 'A German letter is dated 03.10.2025. What is the date?', a: '3 October 2025', wrong: [{ label: '10 March 2025', misconception: 'us-date', feedback: 'That is the American order. In German the day comes first, then the month.' }, '3 November 2025', '10 February 2025'], hint: 'Day first, then month.', why: 'German dates are written day.month.year, with full stops: 03.10.2025 = 3 October 2025.', lv: 3 },
  { q: 'How would a German shop write the price "two euros fifty"?', a: '2,50 €', wrong: ['2.50 €', '€2-50', '250 €'], hint: 'German uses a comma where English uses a decimal point.', why: 'In German-speaking countries prices use a decimal comma: 2,50 € (zwei Euro fünfzig).', lv: 3 },
  { q: 'What do Germans say when someone sneezes?', a: 'Gesundheit!', wrong: ['Prost!', 'Guten Appetit!', 'Tschüss!'], hint: 'It means "health".', why: 'Gesundheit! (health!) is what you say when someone sneezes.', lv: 2 },
  { q: 'At what age do most children in Germany start school?', a: 'about six', wrong: [{ label: 'about four', misconception: 'school-age', feedback: 'In England many children start at four, but in Germany most start at about six.' }, 'about eight', 'about two'], hint: 'Later than in England.', why: 'Most German children start primary school (die Grundschule) at about six, after Kindergarten.', lv: 4 },
  { q: 'What is "Hitzefrei"?', a: 'going home early from school because it is too hot', wrong: ['a day off school when it snows', 'free ice cream in summer', 'a summer sports day'], hint: 'die Hitze = heat, frei = free.', why: 'Hitzefrei means pupils can be sent home early on very hot days.', lv: 4 },
  { q: 'What is a Brezel?', a: 'a pretzel: a knot-shaped bread, popular especially in southern Germany', wrong: ['a type of sausage', 'a cream cake', 'a hot drink'], hint: 'It is baked and often salted.', why: 'A Brezel is a pretzel, a knot-shaped bread with coarse salt, popular especially in Bavaria and Baden-Württemberg.', lv: 2 },
]

const EVERYDAY_TASKS: Task[] = [
  {
    prompt: 'In English, explain when you would use "du" and when you would use "Sie" in German, with two examples of each.',
    model: 'You use "du" with people you know well and with people your own age, for example your best friend or your brother. You use "Sie" to be polite with adults you do not know well, for example a shop assistant or your friend\'s parents. Teachers are also usually called "Sie". If you are not sure, it is safer to use "Sie".',
    checklist: ['Says du is informal (friends, family, young people)', 'Says Sie is polite (adults you do not know well)', 'Gives two examples of each', 'Mentions teachers or what to do when unsure'],
    hint: 'Think: friends and family versus adults and strangers.',
    placeholder: 'Write in English...',
    explanation: 'Compare your answer with the model. Did you give two examples for each?',
  },
  {
    prompt: 'In English, describe three ways a school day in Germany can be different from a school day in England.',
    model: 'In Germany most pupils do not wear a school uniform. Marks go from 1, the best, to 6, the worst. Children start school at about six, and on their first day they get a Schultüte full of sweets. School often starts early, at about eight o\'clock.',
    checklist: ['Mentions uniform', 'Mentions the marks 1 to 6', 'Mentions another difference (starting age, Schultüte, start time)', 'Compares clearly with England'],
    hint: 'Think about uniform, marks, the first day at school and times.',
    placeholder: 'Write in English...',
    explanation: 'Compare your answer with the model. Did you make three different points?',
  },
]

// ------------------------------------------------------------------ generators

export const cultureGenerators: ItemGenerator[] = [
  factGen('cult.countries', 'culture.countries', [1, 5], COUNTRY_FACTS),
  G('top.cult.names', 'culture.countries', [2, 4], (rng, d) => {
    const set = pickN(rng, PLACE_NAMES, d >= 4 ? 5 : 4)
    return matchItem({
      prompt: 'Match each place to its German name.',
      pairs: set.map((p) => ({ left: p.en, right: p.de })),
      hint: 'Some look very similar in both languages; start with those.',
      explanation: set.map((p) => `${p.en} = ${p.de}`).join('; '),
    })
  }),
  G('top.cult.names-type', 'culture.countries', [4, 5], (rng) => {
    const p = rng.pick(PLACE_NAMES.filter((x) => !x.de.includes(' ')))
    return textItem({
      prompt: `What is the German name for ${p.en}?`,
      accept: accepts(p.de),
      placeholder: 'Type the German name',
      hint: `It starts with "${p.de.charAt(0)}".`,
      explanation: `${p.en} = ${p.de}.${keyboardTip(p.de)}`,
    })
  }),

  factGen('cult.festivals', 'culture.festivals', [1, 5], FESTIVAL_FACTS),
  G('top.cult.greetings', 'culture.festivals', [1, 3], (rng) => {
    const set = pickN(rng, GREETINGS, 4)
    return matchItem({
      prompt: 'Match each German greeting to its meaning.',
      pairs: set.map((g) => ({ left: g.de, right: g.en })),
      hint: 'Weihnachten = Christmas, Ostern = Easter, Jahr = year.',
      explanation: set.map((g) => `${g.de} = ${g.en}`).join('; '),
    })
  }),
  G('top.cult.year', 'culture.festivals', [2, 4], (rng, d) => {
    const idx = pickN(rng, YEAR.map((_, i) => i), d >= 4 ? 5 : 4).sort((a, b) => a - b)
    return orderItem({
      rng,
      prompt: 'Put these in the order they happen in the year, from January to December.',
      correct: idx.map((i) => (YEAR[i] as (typeof YEAR)[number]).de),
      direction: ['January', 'December'],
      hint: 'Easter is in spring; Oktoberfest starts in September; Nikolaustag is before Christmas.',
      explanation: idx.map((i) => `${YEAR[i]?.de} (${YEAR[i]?.en}, ${YEAR[i]?.when})`).join(', '),
    })
  }),
  revealGen('cult.festivals-writing', 'culture.festivals', [4, 5], FESTIVAL_TASKS),

  factGen('cult.everyday', 'culture.everyday', [1, 5], EVERYDAY_FACTS),
  revealGen('cult.everyday-writing', 'culture.everyday', [4, 5], EVERYDAY_TASKS),
]
