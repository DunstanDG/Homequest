/**
 * Reading: short original German texts with comprehension questions in English. Every text here is written for
 * this app. Year 7 texts are short and in the present tense; Year 8 texts are everyday documents (menus, forecasts,
 * timetables, blogs, emails); Year 9 texts are longer and mix past, present and future.
 */
import type { ItemGenerator } from '@/engine/registry'
import { readingGen, revealGen, type Reading, type Task } from './lib'

// ------------------------------------------------------------------ Year 7: short texts

const SHORT: Reading[] = [
  {
    title: 'Hallo, ich bin Lukas!',
    lv: 2,
    text: `Hallo! Ich heiße Lukas und ich bin zwölf Jahre alt. Ich wohne mit meiner Mutter, meinem Stiefvater und meiner kleinen Schwester in Leipzig. Meine Schwester heißt Mia. Sie ist sieben Jahre alt und sehr frech!

Wir haben einen Hund. Er heißt Bruno und er ist braun und weiß. Ich habe auch zwei Meerschweinchen.

In meiner Freizeit spiele ich gern Fußball und ich fahre oft Rad. Ich lese nicht gern, weil ich Bücher langweilig finde.`,
    qs: [
      { q: 'How old is Lukas?', a: '12', wrong: ['7', '20', '2'], why: '"Ich bin zwölf Jahre alt" - zwölf = 12. (Mia is the one who is sieben = 7.)', lv: 1 },
      { q: 'Where does Lukas live?', a: 'in Leipzig', wrong: ['in Berlin', 'in Vienna', 'in Hamburg'], why: '"... in Leipzig."', lv: 1 },
      { q: 'Who does Lukas live with?', a: 'his mother, his stepfather and his little sister', wrong: ['his father, his stepmother and his little sister', 'his mother and his grandparents', 'his mother, his stepfather and his little brother'], why: '"mit meiner Mutter, meinem Stiefvater und meiner kleinen Schwester" - Stiefvater = stepfather, Schwester = sister.', lv: 2 },
      { q: 'What is Mia like, according to Lukas?', a: 'very cheeky', wrong: ['very shy', 'very lazy', 'very sporty'], why: '"Sie ist ... sehr frech!" - frech = cheeky.', lv: 2 },
      { q: 'What colour is Bruno?', a: 'brown and white', wrong: ['black and white', 'brown and black', 'grey and white'], why: '"er ist braun und weiß" - braun = brown, weiß = white.', lv: 2 },
      { q: 'Which pets does Lukas\'s family have?', a: 'a dog and two guinea pigs', wrong: ['a dog and two rabbits', 'two dogs and a guinea pig', 'a cat and two guinea pigs'], why: '"Wir haben einen Hund ... zwei Meerschweinchen" - das Meerschweinchen = guinea pig.', lv: 3 },
      { q: 'Why does Lukas not like reading?', a: 'He finds books boring.', wrong: ['He finds reading difficult.', 'He has no time.', 'His sister is too loud.'], why: '"Ich lese nicht gern, weil ich Bücher langweilig finde." - weil = because, langweilig = boring.', lv: 4 },
    ],
  },
  {
    title: 'Eine E-Mail von Emma',
    lv: 3,
    text: `Liebe Sophie,

wie geht's? Ich bin jetzt in der achten Klasse. Meine Schule ist groß und modern, aber das Essen in der Kantine ist schrecklich!

Mein Lieblingsfach ist Biologie, weil ich Tiere liebe. Ich finde Mathe schwierig, aber unsere Mathelehrerin ist sehr nett. Die Schule beginnt um Viertel vor acht und endet um halb zwei. Nachmittags mache ich meine Hausaufgaben und dann gehe ich schwimmen.

Schreib bald!
Deine Emma`,
    qs: [
      { q: 'What is Emma\'s school like?', a: 'big and modern', wrong: ['small and modern', 'big and old', 'small and old'], why: '"Meine Schule ist groß und modern."', lv: 1 },
      { q: 'What does Emma think of the food in the canteen?', a: 'It is terrible.', wrong: ['It is delicious.', 'It is healthy.', 'It is expensive.'], why: '"das Essen in der Kantine ist schrecklich" - schrecklich = terrible.', lv: 2 },
      { q: 'Why is biology Emma\'s favourite subject?', a: 'She loves animals.', wrong: ['The teacher is nice.', 'She finds it easy.', 'She wants to be a doctor.'], why: '"Mein Lieblingsfach ist Biologie, weil ich Tiere liebe."', lv: 2 },
      { q: 'What does Emma say about maths?', a: 'She finds it difficult, but the teacher is very nice.', wrong: ['She finds it easy, but the teacher is strict.', 'She finds it difficult and the teacher is strict.', 'It is her favourite subject.'], why: '"Ich finde Mathe schwierig, aber unsere Mathelehrerin ist sehr nett."', lv: 3 },
      { q: 'What time does school start?', a: '7:45', wrong: [{ label: '8:15', misconception: 'viertel-vor', feedback: 'Viertel vor acht = quarter TO eight.' }, '7:15', '8:45'], why: '"um Viertel vor acht" = at quarter to eight = 7:45.', lv: 3 },
      { q: 'What time does school end?', a: '1:30', wrong: [{ label: '2:30', misconception: 'halb', feedback: 'halb zwei = half way to two = 1:30.' }, '12:30', '2:00'], why: '"endet um halb zwei" - halb zwei = half way to two = 1:30.', lv: 4 },
      { q: 'What does Emma do in the afternoon?', a: 'She does her homework and then goes swimming.', wrong: ['She goes swimming and then does her homework.', 'She does her homework and then plays football.', 'She goes swimming with Sophie.'], why: '"Nachmittags mache ich meine Hausaufgaben und dann gehe ich schwimmen." - dann = then.', lv: 3 },
    ],
  },
  {
    title: 'Mein bester Freund',
    lv: 3,
    text: `Mein bester Freund heißt Ben. Er ist dreizehn Jahre alt, ein Jahr älter als ich. Ben ist sehr groß und schlank und er hat kurze, schwarze Haare und braune Augen. Er trägt eine Brille.

Ben ist lustig und sportlich, aber manchmal ein bisschen faul. Er spielt Basketball und Gitarre. Am Wochenende gehen wir oft zusammen ins Kino oder wir spielen Computerspiele.

Ich finde Ben toll, weil er immer ehrlich ist.

Jonas`,
    qs: [
      { q: 'Which instrument does Ben play?', a: 'the guitar', wrong: ['the piano', 'the drums', 'the violin'], why: '"Er spielt Basketball und Gitarre."', lv: 1 },
      { q: 'What does Ben look like?', a: 'tall and slim, with short black hair and brown eyes', wrong: ['small and slim, with short black hair and brown eyes', 'tall and slim, with long black hair and blue eyes', 'tall and slim, with short brown hair and black eyes'], why: '"sehr groß und schlank ... kurze, schwarze Haare und braune Augen".', lv: 2 },
      { q: 'What do Ben and Jonas often do at the weekend?', a: 'go to the cinema or play computer games', wrong: ['play basketball or go swimming', 'go to the cinema or play football', 'play the guitar or read'], why: '"Am Wochenende gehen wir oft zusammen ins Kino oder wir spielen Computerspiele."', lv: 2 },
      { q: 'What does Jonas say is Ben\'s bad side?', a: 'He is sometimes a bit lazy.', wrong: ['He is sometimes a bit moody.', 'He is always lazy.', 'He is sometimes a bit cheeky.'], why: '"aber manchmal ein bisschen faul" - manchmal = sometimes, faul = lazy.', lv: 3 },
      { q: 'What reason does Jonas give for liking Ben?', a: 'He is always honest.', wrong: ['He is always helpful.', 'He is never lazy.', 'He has lots of computer games.'], why: '"Ich finde Ben toll, weil er immer ehrlich ist." - ehrlich = honest.', lv: 3 },
      { q: 'How old is Jonas?', a: '12', wrong: [{ label: '13', misconception: 'inference', feedback: 'Ben is 13, and he is one year older than Jonas.' }, '14', '3'], why: 'Ben is dreizehn (13) and "ein Jahr älter als ich" (a year older than me), so Jonas is 12.', lv: 4, hint: 'Read the second sentence carefully: älter als = older than.' },
    ],
  },
  {
    title: 'Hannah aus Graz',
    lv: 3,
    text: `Ich heiße Hannah und ich komme aus Österreich. Ich wohne in Graz. Meine Eltern sind geschieden. Unter der Woche wohne ich bei meiner Mutter und am Wochenende bei meinem Vater.

Ich habe einen Halbbruder. Er heißt Felix und er ist erst zwei Jahre alt. Er ist süß, aber sehr laut!

Meine Großeltern wohnen auf dem Land. Sie haben ein Pferd, drei Katzen und viele Hühner. In den Ferien helfe ich gern auf dem Bauernhof.`,
    qs: [
      { q: 'Which country does Hannah come from?', a: 'Austria', wrong: [{ label: 'Australia', misconception: 'oesterreich', feedback: 'Österreich = Austria. Australia is Australien.' }, 'Germany', 'Switzerland'], why: '"Ich komme aus Österreich." - Österreich = Austria. (Graz is a city in Austria.)', lv: 1 },
      { q: 'How old is Felix?', a: 'two', wrong: ['twelve', 'twenty', 'three'], why: '"er ist erst zwei Jahre alt" - erst = only, zwei = two.', lv: 2 },
      { q: 'What is Felix like?', a: 'sweet, but very loud', wrong: ['sweet and very quiet', 'cheeky and very loud', 'shy, but very sweet'], why: '"Er ist süß, aber sehr laut!" - süß = sweet, laut = loud.', lv: 3 },
      { q: 'Where does Hannah live at the weekend?', a: 'at her father\'s', wrong: ['at her mother\'s', 'at her grandparents\'', 'with her half-brother\'s family'], why: '"Unter der Woche wohne ich bei meiner Mutter und am Wochenende bei meinem Vater." - bei = at someone\'s home.', lv: 3 },
      { q: 'Which animals do Hannah\'s grandparents have?', a: 'a horse, three cats and lots of hens', wrong: ['a horse, three dogs and lots of hens', 'three horses, a cat and lots of hens', 'a horse, three cats and lots of rabbits'], why: '"ein Pferd, drei Katzen und viele Hühner" - das Huhn = hen.', lv: 3 },
      { q: 'What does Hannah like doing in the holidays?', a: 'helping on the farm', wrong: ['riding the horse', 'looking after her half-brother', 'visiting her father'], why: '"In den Ferien helfe ich gern auf dem Bauernhof." - helfen = to help, der Bauernhof = farm.', lv: 4 },
    ],
  },
]

// ------------------------------------------------------------------ Year 8: everyday texts

const EVERYDAY: Reading[] = [
  {
    title: 'Café Sonnenschein - Speisekarte',
    lv: 2,
    text: `Getränke
Kaffee - 2,80 €
Tee - 2,20 €
Heiße Schokolade - 3,10 €
Apfelsaft - 2,50 €

Speisen
Tomatensuppe mit Brot - 4,90 €
Käsebrot - 3,60 €
Bratwurst mit Pommes - 7,50 €
Gemüselasagne (vegetarisch) - 8,90 €
Apfelstrudel mit Sahne - 4,20 €

Öffnungszeiten: Montag bis Samstag 8 bis 18 Uhr. Sonntag Ruhetag.`,
    qs: [
      { q: 'How much is a hot chocolate?', a: '3,10 €', wrong: ['2,80 €', '3,60 €', '2,50 €'], why: '"Heiße Schokolade - 3,10 €" (drei Euro zehn).', lv: 1 },
      { q: 'What is the apple strudel served with?', a: 'cream', wrong: ['ice cream', 'custard', 'chips'], why: '"Apfelstrudel mit Sahne" - die Sahne = cream.', lv: 2 },
      { q: 'Which dish is marked as vegetarian?', a: 'the vegetable lasagne', wrong: ['the sausage with chips', 'the apple strudel', 'the coffee'], why: '"Gemüselasagne (vegetarisch)" - das Gemüse = vegetables.', lv: 2 },
      { q: 'When is the café closed?', a: 'on Sundays', wrong: ['on Mondays', 'on Saturdays', 'every day after 8 p.m. only'], why: '"Sonntag Ruhetag" - der Ruhetag = closing day ("rest day").', lv: 3 },
      { q: 'What time does the café open on a Saturday?', a: '8 a.m.', wrong: ['6 p.m.', '8 p.m.', '10 a.m.'], why: '"Montag bis Samstag 8 bis 18 Uhr" - from 8 a.m. to 6 p.m.', lv: 3 },
      { q: 'You order a tomato soup and an apple juice. How much do you pay?', a: '7,40 €', wrong: ['7,30 €', '6,90 €', '8,40 €'], why: '4,90 € (Tomatensuppe) + 2,50 € (Apfelsaft) = 7,40 €.', lv: 4 },
    ],
  },
  {
    title: 'Das Wetter für morgen, Samstag',
    lv: 3,
    text: `Im Norden ist es morgens neblig, aber ab Mittag scheint die Sonne. Die Temperaturen liegen bei 18 Grad.

Im Westen regnet es den ganzen Tag und es ist windig. Höchstens 14 Grad.

Im Süden ist es sonnig und heiß, bis zu 27 Grad. Am Abend gibt es in den Bergen Gewitter.

Im Osten ist es wolkig, aber trocken. Die Temperaturen liegen bei 20 Grad.`,
    qs: [
      { q: 'What will the weather be like in the north in the morning?', a: 'foggy', wrong: ['sunny', 'windy', 'rainy'], why: '"Im Norden ist es morgens neblig" - neblig = foggy.', lv: 1 },
      { q: 'Where will it rain all day?', a: 'in the west', wrong: ['in the north', 'in the south', 'in the east'], why: '"Im Westen regnet es den ganzen Tag" - den ganzen Tag = all day.', lv: 2 },
      { q: 'What is the highest temperature in the south?', a: '27 degrees', wrong: [{ label: '72 degrees', misconception: 'number-order', feedback: 'siebenundzwanzig = 27: units first.' }, '17 degrees', '20 degrees'], why: '"bis zu 27 Grad" - up to 27 degrees.', lv: 2 },
      { q: 'Where will it be cloudy but dry?', a: 'in the east', wrong: ['in the west', 'in the north', 'in the south'], why: '"Im Osten ist es wolkig, aber trocken." - trocken = dry.', lv: 3 },
      { q: 'What will happen in the mountains in the evening?', a: 'There will be thunderstorms.', wrong: ['It will snow.', 'It will be foggy.', 'The sun will shine.'], why: '"Am Abend gibt es in den Bergen Gewitter." - das Gewitter = thunderstorm.', lv: 3 },
      { q: 'In the north, when will the sun come out?', a: 'from midday', wrong: ['in the early morning', 'in the evening', 'not at all'], why: '"ab Mittag scheint die Sonne" - ab Mittag = from midday.', lv: 4 },
    ],
  },
  {
    title: 'Mein Montag - Paul, Klasse 8b',
    lv: 3,
    text: `7.55 - 8.40 Mathe
8.45 - 9.30 Deutsch
Große Pause (20 Minuten)
9.50 - 10.35 Englisch
10.40 - 11.25 Biologie
Pause
11.40 - 12.25 Sport
12.30 - 13.15 Sport

Am Montag habe ich nur sechs Stunden. Nach der Schule esse ich zu Hause zu Mittag. Am Dienstag habe ich Nachmittagsunterricht bis 15.30 Uhr. Das finde ich anstrengend!`,
    qs: [
      { q: 'What is Paul\'s first lesson on Monday?', a: 'maths', wrong: ['German', 'English', 'PE'], why: '"7.55 - 8.40 Mathe".', lv: 1 },
      { q: 'How long is the big break?', a: '20 minutes', wrong: ['12 minutes', '25 minutes', '45 minutes'], why: '"Große Pause (20 Minuten)" - zwanzig Minuten.', lv: 2 },
      { q: 'How many PE lessons does Paul have on Monday?', a: 'two', wrong: ['one', 'three', 'six'], why: 'Sport is at 11.40 and again at 12.30: two lessons.', lv: 3 },
      { q: 'What time does Paul\'s school day end on Monday?', a: '13:15', wrong: ['12:25', { label: '15:30', misconception: 'wrong-day', feedback: 'He finishes at 15.30 on Tuesday, not Monday.' }, '11:25'], why: 'The last lesson on Monday ends at 13.15.', lv: 3 },
      { q: 'Where does Paul eat lunch on Monday?', a: 'at home', wrong: ['in the school canteen', 'at a café', 'at his friend\'s house'], why: '"Nach der Schule esse ich zu Hause zu Mittag." - zu Hause = at home.', lv: 3 },
      { q: 'What does Paul think about Tuesdays?', a: 'They are tiring because he has lessons until 15:30.', wrong: ['They are fun because he has PE.', 'They are easy because he only has six lessons.', 'They are boring because he has maths.'], why: '"Am Dienstag habe ich Nachmittagsunterricht bis 15.30 Uhr. Das finde ich anstrengend!" - anstrengend = tiring.', lv: 4 },
    ],
  },
  {
    title: 'Mein Wochenende - ein Blog von Lena',
    lv: 4,
    text: `Am Samstag bin ich um neun Uhr aufgestanden. Zum Frühstück habe ich Brötchen mit Honig gegessen. Dann bin ich mit meiner Freundin Anna in die Stadt gefahren. Wir haben Kleidung gekauft: Ich habe eine blaue Jacke gekauft, aber sie war ziemlich teuer. Am Abend haben wir im Kino einen Actionfilm gesehen. Der Film war spannend, aber zu lang!

Am Sonntag hat es geregnet, also bin ich zu Hause geblieben. Ich habe gelesen und meine Hausaufgaben gemacht.

Nächstes Wochenende fahre ich mit meiner Familie an die Ostsee. Ich freue mich schon!`,
    qs: [
      { q: 'What time did Lena get up on Saturday?', a: '9 o\'clock', wrong: ['10 o\'clock', 'half past nine', 'half past eight'], why: '"Am Samstag bin ich um neun Uhr aufgestanden." - neun Uhr = 9 o\'clock.', lv: 1 },
      { q: 'Who did Lena go into town with?', a: 'her friend Anna', wrong: ['her mother', 'her sister Anna', 'her family'], why: '"mit meiner Freundin Anna" - die Freundin = (girl)friend.', lv: 2 },
      { q: 'What did Lena buy?', a: 'a blue jacket', wrong: ['a blue dress', 'a black jacket', 'a blue jumper'], why: '"Ich habe eine blaue Jacke gekauft" - die Jacke = jacket, blau = blue.', lv: 2 },
      { q: 'What did Lena think of the film?', a: 'exciting, but too long', wrong: ['boring and too long', 'exciting and quite short', 'funny, but too long'], why: '"Der Film war spannend, aber zu lang!" - spannend = exciting.', lv: 3 },
      { q: 'Why did Lena stay at home on Sunday?', a: 'because it rained', wrong: ['because she was ill', 'because she had too much homework', 'because she was tired'], why: '"Am Sonntag hat es geregnet, also bin ich zu Hause geblieben." - also = so.', lv: 3 },
      { q: 'What is Lena doing next weekend?', a: 'going to the Baltic coast with her family', wrong: [{ label: 'going to the North Sea coast with her family', misconception: 'ostsee', feedback: 'die Ostsee is the Baltic Sea; the North Sea is die Nordsee.' }, 'going to the cinema with Anna', 'staying at home to do homework'], why: '"Nächstes Wochenende fahre ich mit meiner Familie an die Ostsee." - die Ostsee = the Baltic Sea.', lv: 4 },
      { q: 'What did Lena think about the price of the jacket?', a: 'It was quite expensive.', wrong: ['It was very cheap.', 'It was a good price.', 'She did not say.'], why: '"aber sie war ziemlich teuer" - ziemlich = quite, teuer = expensive.', lv: 4 },
    ],
  },
  {
    title: 'Eine E-Mail aus Freiburg',
    lv: 3,
    text: `Hallo Tom,

danke für deine E-Mail! Du fragst, wie meine Stadt ist. Ich wohne in Freiburg, im Südwesten von Deutschland. Freiburg ist nicht sehr groß, aber es gibt viel zu tun. Die Altstadt ist sehr schön und samstags gibt es einen Markt.

Für junge Leute gibt es ein Kino, ein Schwimmbad und viele Cafés. Die Stadt ist sehr grün und viele Leute fahren Rad. Ich fahre jeden Tag mit dem Rad zur Schule. Das dauert nur zehn Minuten.

Was gibt es in deiner Stadt? Schreib bald!

Viele Grüße
Felix`,
    qs: [
      { q: 'Where is Freiburg?', a: 'in the south-west of Germany', wrong: ['in the north-east of Germany', 'in the south of Austria', 'in the west of Switzerland'], why: '"im Südwesten von Deutschland" - Süd = south, West = west.', lv: 1 },
      { q: 'What does Felix say about the size of Freiburg?', a: 'It is not very big, but there is a lot to do.', wrong: ['It is very big and there is a lot to do.', 'It is not very big and there is nothing to do.', 'It is the biggest city in the area.'], why: '"Freiburg ist nicht sehr groß, aber es gibt viel zu tun."', lv: 2 },
      { q: 'When is there a market?', a: 'on Saturdays', wrong: ['on Sundays', 'every day', 'on Mondays'], why: '"samstags gibt es einen Markt" - samstags = on Saturdays.', lv: 3 },
      { q: 'How does Felix get to school?', a: 'by bike, in ten minutes', wrong: ['by bus, in ten minutes', 'on foot, in ten minutes', 'by bike, in twenty minutes'], why: '"Ich fahre jeden Tag mit dem Rad zur Schule. Das dauert nur zehn Minuten."', lv: 2 },
      { q: 'What does Felix want Tom to do?', a: 'write back and say what there is in his town', wrong: ['come and visit Freiburg', 'send him a photo of his school', 'ride his bike to school'], why: '"Was gibt es in deiner Stadt? Schreib bald!" - schreib bald = write soon.', lv: 3 },
      { q: 'Which of these does Felix NOT mention in his town?', a: 'a football stadium', wrong: ['a cinema', 'a swimming pool', 'cafés'], why: 'He lists "ein Kino, ein Schwimmbad und viele Cafés". There is no stadium in his list.', lv: 4 },
    ],
  },
]

// ------------------------------------------------------------------ Year 9: longer texts

const LONGER: Reading[] = [
  {
    title: 'Sommerferien in den Bergen - Jonas, 14',
    lv: 4,
    text: `Letzten Sommer bin ich mit meinen Eltern und meinem Bruder nach Österreich gefahren. Wir sind mit dem Zug gefahren, weil mein Vater nicht gern Auto fährt. Die Reise hat neun Stunden gedauert - furchtbar langweilig!

Wir haben eine Woche in einer Ferienwohnung in Tirol gewohnt. Jeden Tag sind wir in den Bergen gewandert. Am Anfang fand ich das anstrengend, aber am Ende hat es mir richtig Spaß gemacht. Das Beste war ein Tag am See: Das Wasser war eiskalt, aber mein Bruder und ich sind trotzdem geschwommen.

Nächstes Jahr möchte ich lieber ans Meer fahren, weil ich gern in der Sonne liege. Mein Bruder will aber wieder in die Berge. Mal sehen!`,
    qs: [
      { q: 'Why did the family travel by train?', a: 'because his father does not like driving', wrong: ['because it was cheaper', 'because it was quicker', 'because it is better for the environment'], why: '"weil mein Vater nicht gern Auto fährt" - nicht gern = does not like.', lv: 3 },
      { q: 'What did Jonas think of the journey?', a: 'It was terribly boring.', wrong: ['It was really fun.', 'It was quite short.', 'It was tiring but interesting.'], why: '"Die Reise hat neun Stunden gedauert - furchtbar langweilig!"', lv: 2 },
      { q: 'Where did they stay?', a: 'in a holiday flat', wrong: ['in a hotel', 'on a campsite', 'in a youth hostel'], why: '"in einer Ferienwohnung" - die Ferienwohnung = holiday flat.', lv: 2 },
      { q: 'How did Jonas feel about the hiking?', a: 'He found it tiring at first, but really enjoyed it by the end.', wrong: ['He enjoyed it at first, but was bored by the end.', 'He found it tiring all week.', 'He refused to go hiking.'], why: '"Am Anfang fand ich das anstrengend, aber am Ende hat es mir richtig Spaß gemacht." - am Anfang = at the beginning, am Ende = at the end.', lv: 4 },
      { q: 'What was the best part of the holiday?', a: 'a day at a lake', wrong: [{ label: 'a day at the seaside', misconception: 'see-meer', feedback: 'der See = lake; das Meer = sea.' }, 'the train journey', 'a day in a city'], why: '"Das Beste war ein Tag am See" - der See = lake.', lv: 3 },
      { q: 'What happened at the lake?', a: 'Jonas and his brother swam, even though the water was ice-cold.', wrong: ['They did not swim because the water was ice-cold.', 'Only his brother swam, because the water was ice-cold.', 'They swam because the water was warm.'], why: '"Das Wasser war eiskalt, aber mein Bruder und ich sind trotzdem geschwommen." - trotzdem = even so.', lv: 4 },
      { q: 'Where would Jonas like to go next year, and why?', a: 'to the seaside, because he likes lying in the sun', wrong: ['to the mountains, because he likes hiking', 'to the seaside, because his brother wants to go', 'to a lake, because he likes swimming'], why: '"Nächstes Jahr möchte ich lieber ans Meer fahren, weil ich gern in der Sonne liege."', lv: 5 },
      { q: 'Do Jonas and his brother agree about next year\'s holiday?', a: 'No - his brother wants to go to the mountains again.', wrong: ['Yes - they both want to go to the seaside.', 'Yes - they both want to go to the mountains.', 'No - his brother wants to stay at home.'], why: '"Mein Bruder will aber wieder in die Berge." - aber = but, wieder = again.', lv: 5 },
    ],
  },
  {
    title: 'Gesund leben - Mia erzählt',
    lv: 4,
    text: `Früher habe ich sehr ungesund gegessen. Ich habe jeden Tag Chips und Süßigkeiten gegessen und ich habe fast nie Sport gemacht. Ich war oft müde und hatte keine Energie.

Jetzt ist alles anders. Ich esse viel Obst und Gemüse und ich trinke jeden Tag zwei Liter Wasser. Dreimal pro Woche gehe ich joggen und am Wochenende spiele ich Volleyball in einem Verein. Ich schlafe auch mehr: Ich gehe um zehn Uhr ins Bett, nicht um Mitternacht.

Aber ich bin nicht perfekt! Ich esse immer noch gern Schokolade. In Zukunft werde ich versuchen, weniger Zeit am Handy zu verbringen, weil das auch nicht gesund ist.`,
    qs: [
      { q: 'What did Mia use to eat every day?', a: 'crisps and sweets', wrong: [{ label: 'chips and sweets', misconception: 'false-friend', feedback: 'Chips in German are crisps. Chips (fries) are Pommes.' }, 'fruit and vegetables', 'chocolate and cake'], why: '"Ich habe jeden Tag Chips und Süßigkeiten gegessen." - die Chips = crisps (a false friend).', lv: 3 },
      { q: 'How did Mia feel in the past?', a: 'often tired, with no energy', wrong: ['always happy and full of energy', 'often ill', 'often bored'], why: '"Ich war oft müde und hatte keine Energie."', lv: 2 },
      { q: 'How often does Mia go jogging now?', a: 'three times a week', wrong: ['every day', 'twice a week', 'only at weekends'], why: '"Dreimal pro Woche gehe ich joggen." - dreimal = three times.', lv: 2 },
      { q: 'What does Mia do at the weekend?', a: 'plays volleyball in a club', wrong: ['goes jogging with friends', 'plays volleyball at school', 'goes swimming in a club'], why: '"am Wochenende spiele ich Volleyball in einem Verein" - der Verein = club.', lv: 3 },
      { q: 'What has changed about Mia\'s sleep?', a: 'She goes to bed at ten instead of midnight.', wrong: ['She goes to bed at midnight instead of ten.', 'She sleeps for ten hours every night.', 'She has stopped sleeping in the afternoon.'], why: '"Ich gehe um zehn Uhr ins Bett, nicht um Mitternacht."', lv: 3 },
      { q: 'What is Mia\'s plan for the future?', a: 'to spend less time on her phone', wrong: ['to stop eating chocolate', 'to drink more water', 'to go jogging every day'], why: '"In Zukunft werde ich versuchen, weniger Zeit am Handy zu verbringen" - werde = will, weniger = less.', lv: 4 },
      { q: 'Which of these statements about Mia is true?', a: 'She still likes eating chocolate.', wrong: ['She has stopped eating chocolate.', 'She plays volleyball three times a week.', 'She drinks one litre of water a day.'], why: '"Ich esse immer noch gern Schokolade." - immer noch = still. (She jogs three times a week and drinks two litres of water.)', lv: 5 },
    ],
  },
  {
    title: 'Was willst du später werden?',
    lv: 4,
    text: `Ben (15): Ich interessiere mich sehr für Computer. Nach der Schule möchte ich Informatik studieren und Programmierer werden. Ich will nicht in einem Büro arbeiten - vielleicht kann ich von zu Hause arbeiten.

Sophie (14): Ich liebe Tiere, deshalb möchte ich Tierärztin werden. Letzten Sommer habe ich ein Praktikum in einer Tierklinik gemacht. Das war toll, aber auch ein bisschen traurig, weil manche Tiere sehr krank waren.

Paul (15): Ich weiß noch nicht, was ich werden will. Meine Eltern sagen, ich soll Arzt werden, aber ich finde Biologie langweilig. Ich mache gern Musik und spiele Schlagzeug in einer Band. Vielleicht werde ich Musiker!`,
    qs: [
      { q: 'What does Ben want to study?', a: 'computing', wrong: ['music', 'medicine', 'biology'], why: '"möchte ich Informatik studieren" - Informatik = computing.', lv: 2 },
      { q: 'Where does Ben NOT want to work?', a: 'in an office', wrong: ['at home', 'in a school', 'in a hospital'], why: '"Ich will nicht in einem Büro arbeiten" - ich will nicht = I don\'t want; das Büro = office.', lv: 3 },
      { q: 'Why does Sophie want to be a vet?', a: 'She loves animals.', wrong: ['Her parents are vets.', 'She wants to earn a lot of money.', 'She finds biology easy.'], why: '"Ich liebe Tiere, deshalb möchte ich Tierärztin werden." - deshalb = that is why.', lv: 2 },
      { q: 'What did Sophie do last summer?', a: 'work experience at an animal clinic', wrong: ['a holiday job in a shop', 'a course in biology', 'work experience at a hospital'], why: '"Letzten Sommer habe ich ein Praktikum in einer Tierklinik gemacht." - das Praktikum = work experience.', lv: 3 },
      { q: 'Why was Sophie\'s work experience also a bit sad?', a: 'Some of the animals were very ill.', wrong: ['She did not like the other workers.', 'It was too short.', 'She had to work every evening.'], why: '"weil manche Tiere sehr krank waren" - manche = some, krank = ill.', lv: 4 },
      { q: 'Why does Paul not want to be a doctor?', a: 'He finds biology boring.', wrong: [{ label: 'His parents do not want him to.', misconception: 'misread', feedback: 'It is the other way round: his parents say he should become a doctor.' }, 'He wants to be a vet.', 'He is not good at maths.'], why: '"Meine Eltern sagen, ich soll Arzt werden, aber ich finde Biologie langweilig."', lv: 4 },
      { q: 'Who does not know yet what job they want?', a: 'Paul', wrong: ['Ben', 'Sophie', 'nobody: they all know'], why: 'Paul: "Ich weiß noch nicht, was ich werden will." - noch nicht = not yet.', lv: 3 },
      { q: 'Which instrument does Paul play?', a: 'the drums', wrong: ['the guitar', 'the piano', 'the trumpet'], why: '"spiele Schlagzeug in einer Band" - das Schlagzeug = drums.', lv: 5 },
    ],
  },
  {
    title: 'Liebe Grüße aus Nürnberg!',
    lv: 4,
    text: `Hallo Emily,

bei uns ist Weihnachten ein bisschen anders als bei dir in England. Am 6. Dezember stellen wir unsere Stiefel vor die Tür, und am nächsten Morgen sind Süßigkeiten drin. Am Heiligabend gehen wir nachmittags in die Kirche und danach essen wir Kartoffelsalat mit Würstchen - das ist bei uns Tradition! Dann kommt das Christkind und bringt die Geschenke.

Letztes Jahr bin ich jeden Samstag im Dezember mit meiner Freundin auf den Christkindlesmarkt gegangen. Wir haben Lebkuchen gegessen und Kinderpunsch getrunken. Dieses Jahr werde ich dort mit meiner Klasse Weihnachtslieder singen. Ich bin schon nervös!

Wie feiert ihr Weihnachten? Esst ihr wirklich Truthahn?

Deine Lena`,
    qs: [
      { q: 'What happens on 6 December in Lena\'s family?', a: 'They put their boots outside the door and find sweets in them the next morning.', wrong: ['They open all their Christmas presents.', 'They go to the Christmas market.', 'They decorate the Christmas tree.'], why: '"Am 6. Dezember stellen wir unsere Stiefel vor die Tür, und am nächsten Morgen sind Süßigkeiten drin."', lv: 2 },
      { q: 'What does Lena\'s family eat on Christmas Eve?', a: 'potato salad with sausages', wrong: [{ label: 'turkey', misconception: 'uk-christmas', feedback: 'Lena asks Emily if the English really eat turkey. Her family eats Kartoffelsalat mit Würstchen.' }, 'fish and chips', 'gingerbread'], why: '"danach essen wir Kartoffelsalat mit Würstchen".', lv: 3 },
      { q: 'Who brings the presents in Lena\'s family?', a: 'das Christkind', wrong: ['der Weihnachtsmann', 'der Nikolaus', 'her grandparents'], why: '"Dann kommt das Christkind und bringt die Geschenke."', lv: 3 },
      { q: 'What did Lena do every Saturday last December?', a: 'She went to the Christmas market with her friend.', wrong: ['She sang Christmas songs with her class.', 'She went to church with her family.', 'She baked gingerbread at home.'], why: '"Letztes Jahr bin ich jeden Samstag im Dezember mit meiner Freundin auf den Christkindlesmarkt gegangen."', lv: 4 },
      { q: 'What will Lena do this year?', a: 'sing Christmas songs at the market with her class', wrong: ['visit Emily in England', 'work at a stall at the market', 'go to the market every Saturday with her friend'], why: '"Dieses Jahr werde ich dort mit meiner Klasse Weihnachtslieder singen." - werde ... singen = will sing.', lv: 4 },
      { q: 'How does Lena feel about it?', a: 'nervous', wrong: ['bored', 'angry', 'tired'], why: '"Ich bin schon nervös!"', lv: 3 },
      { q: 'What does Lena want to know about Christmas in England?', a: 'whether people really eat turkey', wrong: ['whether people go to Christmas markets', 'when the presents are opened', 'whether it snows'], why: '"Esst ihr wirklich Truthahn?" - wirklich = really, der Truthahn = turkey.', lv: 4 },
    ],
  },
]

const READING_TASKS: Task[] = [
  {
    prompt: 'Lena from Nürnberg asks how you celebrate a festival you enjoy. Write her a reply in German of 4-5 sentences: what you usually do, what you eat, what you did last year, and what you will do this year.',
    model: 'Hallo Lena, bei uns ist Weihnachten sehr schön. Wir öffnen die Geschenke am Morgen des 25. Dezember. Wir essen Truthahn mit Kartoffeln und Gemüse. Letztes Jahr habe ich ein neues Fahrrad bekommen. Dieses Jahr werde ich mit meiner Familie zu meiner Oma fahren.',
    checklist: ['Uses the present tense to say what you usually do', 'Uses the perfect tense for last year (habe ... bekommen / bin ... gefahren)', 'Uses the future (werde + infinitive) for this year', 'Gives at least one food item correctly', 'Starts or ends like a letter (Hallo..., Deine / Dein...)'],
    hint: 'Present: Wir essen ... Past: Letztes Jahr habe ich ... Future: Dieses Jahr werde ich ...',
  },
  {
    prompt: 'Felix from Freiburg asks: "Was gibt es in deiner Stadt?" Write him a reply in German of 4-5 sentences: where you live, what there is in your town, what there is not, and what you think of it.',
    model: 'Hallo Felix, danke für deine E-Mail! Ich wohne in einer kleinen Stadt in England. Es gibt ein Schwimmbad, einen Park und viele Geschäfte, aber es gibt leider kein Kino. Ich finde meine Stadt ziemlich langweilig, weil es nicht viel für junge Leute gibt. Am Wochenende fahre ich oft mit dem Bus in die nächste Stadt. Viele Grüße!',
    checklist: ['Says where you live (Ich wohne in...)', 'Uses es gibt + einen / eine / ein for places', 'Uses kein for something your town does not have', 'Gives an opinion with weil, verb at the end', 'Starts and ends like an email (Hallo..., Viele Grüße)'],
    hint: 'Ich wohne in ... Es gibt einen ..., eine ... und ein ... Es gibt kein ... Ich finde meine Stadt ..., weil ...',
  },
]

export const readingGenerators: ItemGenerator[] = [
  readingGen('read.short', 'reading.short', [1, 4], SHORT),
  readingGen('read.everyday', 'reading.texts', [1, 4], EVERYDAY),
  readingGen('read.longer', 'reading.longer', [2, 5], LONGER),
  revealGen('read.reply', 'reading.longer', [4, 5], READING_TASKS),
]
