/**
 * Translation in both directions. German -> English is multiple choice (with misconception distractors: false
 * friends, word order, tense) or written and self-marked. English -> German is multiple choice, tile ordering, or
 * typed for short controlled sentences with every correct word order listed.
 */
import type { ItemGenerator } from '@/engine/registry'
import { choice } from '../../kit'
import { G, buildGen, meaningGen, nearLevel, pickN, q, revealGen, typeTranslateGen, type Build, type Sent, type Task, type Tr, type Wrong } from './lib'

// ------------------------------------------------------------------ German -> English

const TO_EN: Sent[] = [
  { de: 'Ich habe einen Bruder und eine Schwester.', en: 'I have a brother and a sister.', wrong: ['I have two brothers and a sister.', 'I have a brother but no sister.', 'I have a sister and a cousin.'], why: 'einen Bruder = a brother; eine Schwester = a sister.', lv: 1 },
  { de: 'Mein Hund ist sehr groß.', en: 'My dog is very big.', wrong: ['My dog is very small.', 'My cat is very big.', 'My dog is quite big.'], why: 'der Hund = dog; sehr = very; groß = big.', lv: 1 },
  { de: 'Wir wohnen in einem kleinen Dorf.', en: 'We live in a small village.', wrong: ['We live in a small town.', 'We live in a big village.', 'I live in a small village.'], why: 'wir = we; das Dorf = village; klein = small.', lv: 1 },
  { de: 'Am Wochenende spiele ich oft Tennis.', en: 'At the weekend I often play tennis.', wrong: ['At the weekend I never play tennis.', 'At the weekend I often watch tennis.', 'During the week I often play tennis.'], why: 'am Wochenende = at the weekend; oft = often.', lv: 2 },
  { de: 'Meine Mutter arbeitet in einem Krankenhaus.', en: 'My mother works in a hospital.', wrong: [{ label: 'My mother is ill in hospital.', misconception: 'krank', feedback: 'arbeitet = works. das Krankenhaus is just the word for hospital.' }, 'My mother works in a town hall.', 'My mother worked in a hospital.'], why: 'arbeiten = to work; das Krankenhaus = hospital.', lv: 2 },
  { de: 'Ich esse kein Fleisch.', en: 'I don\'t eat meat.', wrong: ['I don\'t eat fish.', 'I eat a lot of meat.', 'I don\'t like meat.'], why: 'kein = no / not any; das Fleisch = meat.', lv: 2 },
  { de: 'Ich bekomme jeden Monat zwanzig Euro Taschengeld.', en: 'I get twenty euros pocket money every month.', wrong: [{ label: 'I become twenty euros pocket money every month.', misconception: 'false-friend', feedback: 'bekommen is a false friend: it means "to get", not "to become".' }, 'I get twelve euros pocket money every month.', 'I get twenty euros pocket money every week.'], why: 'bekommen = to get (a false friend); jeden Monat = every month.', lv: 3 },
  { de: 'Mein Bruder will Pilot werden.', en: 'My brother wants to become a pilot.', wrong: [{ label: 'My brother will become a pilot.', misconception: 'will-want', feedback: 'er will (from wollen) = he wants. It is not the English "will".' }, 'My brother is a pilot.', 'My brother wanted to become a pilot.'], why: 'er will = he wants (from wollen); werden = to become.', lv: 3 },
  { de: 'Den Film finde ich langweilig.', en: 'I find the film boring.', wrong: [{ label: 'The film finds me boring.', misconception: 'object-first', feedback: 'Den Film is the object (den shows it). ich is the subject: I find the film boring.' }, 'I find the film exciting.', 'I found the film boring.'], why: 'German can put the object first. den Film (accusative) is the thing being found boring; ich is the subject.', lv: 3 },
  { de: 'Ich habe mein Handy verloren.', en: 'I have lost my mobile phone.', wrong: ['I have found my mobile phone.', { label: 'I have lost my handbag.', misconception: 'handy', feedback: 'das Handy = mobile phone. A handbag is die Handtasche.' }, 'I am losing my mobile phone.'], why: 'das Handy = mobile phone; verloren = lost.', lv: 3 },
  { de: 'Es ist fast acht Uhr.', en: 'It is almost eight o\'clock.', wrong: [{ label: 'It is just after eight o\'clock.', misconception: 'false-friend', feedback: 'fast is a false friend: it means "almost".' }, 'It is exactly eight o\'clock.', 'It is almost half past eight.'], why: 'fast = almost (a false friend).', lv: 3 },
  { de: 'Ich spiele seit vier Jahren Klavier.', en: 'I have been playing the piano for four years.', wrong: [{ label: 'I played the piano four years ago.', misconception: 'seit', feedback: 'seit + present tense = have been doing something (and still are).' }, 'I have been playing the piano for fourteen years.', 'I will play the piano for four years.'], why: 'seit + present tense = have been ...ing for; vier = four (vierzehn = fourteen).', lv: 4 },
  { de: 'Wenn ich Zeit habe, gehe ich ins Kino.', en: 'When I have time, I go to the cinema.', wrong: ['When I had time, I went to the cinema.', 'I have time because I go to the cinema.', 'When I have time, I go to the theatre.'], why: 'wenn = when / if; the verb habe goes to the end of the wenn-clause.', lv: 4 },
  { de: 'Wir dürfen in der Schule kein Handy benutzen.', en: 'We are not allowed to use mobile phones at school.', wrong: [{ label: 'We don\'t have to use mobile phones at school.', misconception: 'duerfen-muessen', feedback: 'dürfen = to be allowed to. "Don\'t have to" would be nicht müssen.' }, 'We are allowed to use mobile phones at school.', 'We don\'t want to use mobile phones at school.'], why: 'dürfen = to be allowed to; kein Handy = no mobile phone.', lv: 4 },
  { de: 'Meine Schwester ist älter als ich, aber ich bin größer.', en: 'My sister is older than me, but I am taller.', wrong: ['My sister is younger than me, but I am taller.', 'My sister is older than me and taller.', 'My sister is taller than me, but I am older.'], why: 'älter als = older than; größer = taller.', lv: 4 },
  { de: 'Obwohl es geregnet hat, sind wir an den Strand gegangen.', en: 'Although it rained, we went to the beach.', wrong: ['Because it rained, we went to the beach.', 'Although it rained, we did not go to the beach.', 'When it rains, we go to the beach.'], why: 'obwohl = although; sind ... gegangen = went.', lv: 5 },
  { de: 'Ich hätte gern mehr Freizeit, aber ich muss viel lernen.', en: 'I would like more free time, but I have to study a lot.', wrong: ['I have more free time, but I have to study a lot.', 'I would like less free time, but I have to study a lot.', 'I had more free time, but I had to study a lot.'], why: 'ich hätte gern = I would like; ich muss = I have to.', lv: 5 },
  { de: 'Man sollte nicht zu viel Zeit vor dem Bildschirm verbringen.', en: 'You shouldn\'t spend too much time in front of a screen.', wrong: ['You must not spend any time in front of a screen.', 'You should spend more time in front of a screen.', 'People don\'t spend much time in front of a screen.'], why: 'man sollte nicht = you / one shouldn\'t; verbringen = to spend (time).', lv: 5 },
  { de: 'Sie hat mir gesagt, dass sie nicht kommen kann.', en: 'She told me that she can\'t come.', wrong: ['She told me that she can come.', 'I told her that I can\'t come.', 'She asked me whether she can come.'], why: 'hat mir gesagt = told me; dass = that; the verb kann goes to the end.', lv: 5 },
]

const FALSE_FRIENDS: { de: string; en: string; trap: string }[] = [
  { de: 'bekommen', en: 'to get', trap: 'to become' },
  { de: 'also', en: 'so / therefore', trap: 'also (as well)' },
  { de: 'das Handy', en: 'mobile phone', trap: 'useful' },
  { de: 'das Gift', en: 'poison', trap: 'present (gift)' },
  { de: 'der Chef', en: 'boss', trap: 'cook (chef)' },
  { de: 'bald', en: 'soon', trap: 'having no hair' },
  { de: 'ich will', en: 'I want', trap: 'I will' },
  { de: 'das Kind', en: 'child', trap: 'kind (nice)' },
  { de: 'der Rock', en: 'skirt', trap: 'a stone (rock)' },
  { de: 'der Brief', en: 'letter', trap: 'short (brief)' },
  { de: 'fast', en: 'almost', trap: 'quick (fast)' },
  { de: 'eventuell', en: 'possibly', trap: 'in the end (eventually)' },
  { de: 'sensibel', en: 'sensitive', trap: 'sensible' },
  { de: 'sympathisch', en: 'likeable', trap: 'sympathetic' },
  { de: 'aktuell', en: 'up to date / current', trap: 'actually' },
  { de: 'die Fabrik', en: 'factory', trap: 'cloth (fabric)' },
  { de: 'das Gymnasium', en: 'academic secondary school', trap: 'sports hall (gym)' },
  { de: 'der Rat', en: 'advice', trap: 'a rat' },
  { de: 'die Chips', en: 'crisps', trap: 'chips (fries)' },
  { de: 'spenden', en: 'to donate', trap: 'to spend (money)' },
  { de: 'die Wand', en: 'wall', trap: 'magic wand' },
]

const TO_EN_TASKS: Task[] = [
  {
    prompt: 'Translate into English:  "Ich heiße Anna und ich wohne in Köln. Ich habe zwei Brüder, aber keine Schwester. In meiner Freizeit spiele ich gern Handball und ich lese viel. Am Wochenende gehe ich oft mit meinen Freunden ins Kino."',
    model: 'My name is Anna and I live in Cologne. I have two brothers, but no sister. In my free time I like playing handball and I read a lot. At the weekend I often go to the cinema with my friends.',
    checklist: ['"Ich heiße" as "My name is" (or "I am called")', 'keine Schwester as "no sister"', 'gern as "like doing"', 'Am Wochenende as "At the weekend" and oft as "often"', 'Natural English word order (I often go..., not "go I often")'],
    hint: 'Translate the meaning, not word for word: "gehe ich oft" becomes "I often go".',
    placeholder: 'Write your English translation...',
    explanation: 'Compare with the model. Did you translate every detail (numbers, negatives, time words) and write natural English?',
  },
  {
    prompt: 'Translate into English:  "Letzten Sommer bin ich mit meiner Familie nach Italien gefahren. Wir haben in einem Hotel am Meer gewohnt. Das Wetter war sehr heiß. Nächstes Jahr möchte ich nach Spanien fliegen."',
    model: 'Last summer I went to Italy with my family. We stayed in a hotel by the sea. The weather was very hot. Next year I would like to fly to Spain.',
    checklist: ['Past tense for "bin ... gefahren" and "haben ... gewohnt" (went / stayed)', 'am Meer as "by the sea"', 'war as "was"', 'möchte as "would like"', 'Natural English word order'],
    hint: 'Watch the tenses: the first three sentences are in the past, the last is about the future.',
    placeholder: 'Write your English translation...',
    explanation: 'Compare with the model. Did you keep the tenses right in every sentence?',
  },
]

// ------------------------------------------------------------------ English -> German

interface ChooseDe {
  en: string
  de: string
  wrong: Wrong[]
  why: string
  lv: number
}

const TO_DE: ChooseDe[] = [
  { en: 'I have a dog.', de: 'Ich habe einen Hund.', wrong: [{ label: 'Ich habe ein Hund.', misconception: 'accusative', feedback: 'Hund is masculine, so after habe it needs einen.' }, 'Ich bin einen Hund.', 'Ich habe eine Hund.'], why: 'der Hund is masculine: ich habe einen Hund (accusative).', lv: 1 },
  { en: 'My sister is twelve.', de: 'Meine Schwester ist zwölf.', wrong: [{ label: 'Mein Schwester ist zwölf.', misconception: 'possessive', feedback: 'Schwester is feminine: meine Schwester.' }, 'Meine Schwester hat zwölf.', 'Meine Schwester ist zwanzig.'], why: 'die Schwester is feminine: meine; zwölf = 12.', lv: 1 },
  { en: 'We live in Berlin.', de: 'Wir wohnen in Berlin.', wrong: [{ label: 'Wir wohnt in Berlin.', misconception: 'verb-ending', feedback: 'wir takes the -en ending: wir wohnen.' }, 'Wir wohnen nach Berlin.', 'Ihr wohnt in Berlin.'], why: 'wir wohnen = we live.', lv: 1 },
  { en: 'On Saturday I play football.', de: 'Am Samstag spiele ich Fußball.', wrong: [{ label: 'Am Samstag ich spiele Fußball.', misconception: 'verb-second', feedback: 'The verb must be the second idea: Am Samstag (1) spiele (2) ich.' }, 'Am Samstag spielen ich Fußball.', 'In Samstag spiele ich Fußball.'], why: 'After a time phrase the verb comes second and the subject follows it. (Ich spiele am Samstag Fußball is also right.)', lv: 2 },
  { en: 'I like swimming.', de: 'Ich schwimme gern.', wrong: [{ label: 'Ich gern schwimme.', misconception: 'gern-position', feedback: 'gern goes after the verb: Ich schwimme gern.' }, 'Ich schwimmen gern.', 'Ich schwimme nicht gern.'], why: 'verb + gern = like doing: Ich schwimme gern.', lv: 2 },
  { en: 'He is called Ben and he is funny.', de: 'Er heißt Ben und er ist lustig.', wrong: [{ label: 'Er heißt Ben und ist er lustig.', misconception: 'und-word-order', feedback: 'und does not change the word order: und er ist...' }, 'Er heißt Ben und er hat lustig.', 'Sie heißt Ben und sie ist lustig.'], why: 'und joins two sentences without changing the word order.', lv: 2 },
  { en: 'I don\'t have a brother.', de: 'Ich habe keinen Bruder.', wrong: [{ label: 'Ich habe nicht Bruder.', misconception: 'nicht-kein', feedback: 'To say "not a" / "no" with a noun, use kein.' }, 'Ich habe kein Bruder.', 'Ich habe keine Bruder.'], why: 'Use kein with a noun; der Bruder is masculine, so keinen after habe.', lv: 3 },
  { en: 'I go to school by bus.', de: 'Ich fahre mit dem Bus zur Schule.', wrong: [{ label: 'Ich gehe mit dem Bus zur Schule.', misconception: 'gehen-fahren', feedback: 'gehen is on foot. For transport use fahren.' }, 'Ich fahre mit der Bus zur Schule.', 'Ich fahre mit dem Bus nach Schule.'], why: 'fahren for transport; mit dem Bus = by bus; zur Schule = to school.', lv: 3 },
  { en: 'I find maths interesting because the teacher is funny.', de: 'Ich finde Mathe interessant, weil der Lehrer lustig ist.', wrong: [{ label: 'Ich finde Mathe interessant, weil der Lehrer ist lustig.', misconception: 'weil-verb-end', feedback: 'weil sends the verb to the end: weil der Lehrer lustig ist.' }, 'Ich finde Mathe interessant, weil ist der Lehrer lustig.', 'Ich finde Mathe interessant, denn der Lehrer lustig ist.'], why: 'weil sends the verb to the end of its clause.', lv: 3 },
  { en: 'Tomorrow we are going to the cinema.', de: 'Morgen gehen wir ins Kino.', wrong: [{ label: 'Morgen wir gehen ins Kino.', misconception: 'verb-second', feedback: 'After Morgen the verb comes next: Morgen gehen wir.' }, 'Morgen gehen wir im Kino.', 'Morgen geht wir ins Kino.'], why: 'German uses the present tense with a future time word. After Morgen the verb comes second. (Wir gehen morgen ins Kino is also right.)', lv: 3 },
  { en: 'I would like to visit Austria.', de: 'Ich möchte Österreich besuchen.', wrong: [{ label: 'Ich möchte besuchen Österreich.', misconception: 'infinitive-end', feedback: 'After möchte, the infinitive goes to the end.' }, 'Ich möchte Österreich besucht.', 'Ich möchten Österreich besuchen.'], why: 'möchte + infinitive at the end: Ich möchte Österreich besuchen.', lv: 4 },
  { en: 'We have to wear a uniform.', de: 'Wir müssen eine Uniform tragen.', wrong: [{ label: 'Wir müssen tragen eine Uniform.', misconception: 'infinitive-end', feedback: 'After müssen, the infinitive goes to the end.' }, { label: 'Wir dürfen eine Uniform tragen.', misconception: 'duerfen-muessen', feedback: 'dürfen = to be allowed to. "Have to" is müssen.' }, 'Wir muss eine Uniform tragen.'], why: 'müssen = to have to, with the infinitive tragen at the end.', lv: 4 },
  { en: 'She is a teacher.', de: 'Sie ist Lehrerin.', wrong: [{ label: 'Sie ist eine Lehrerin.', misconception: 'job-article', feedback: 'German leaves out "a" before a job.' }, 'Sie ist Lehrer.', 'Sie hat Lehrerin.'], why: 'No "a" before a job, and the female form ends in -in: Sie ist Lehrerin.', lv: 4 },
  { en: 'When it is sunny, I go to the park.', de: 'Wenn es sonnig ist, gehe ich in den Park.', wrong: [{ label: 'Wenn es sonnig ist, ich gehe in den Park.', misconception: 'verb-comma-verb', feedback: 'After a wenn-clause, the main verb comes straight after the comma: ..., gehe ich.' }, 'Wenn es ist sonnig, gehe ich in den Park.', { label: 'Wann es sonnig ist, gehe ich in den Park.', misconception: 'wann-wenn', feedback: 'wann is a question word. "When / whenever" joining two ideas is wenn.' }], why: 'wenn sends its verb to the end (ist), then the main verb comes first after the comma (gehe ich): verb, comma, verb.', lv: 5 },
  { en: 'I have been learning German for two years.', de: 'Ich lerne seit zwei Jahren Deutsch.', wrong: [{ label: 'Ich habe seit zwei Jahren Deutsch gelernt.', misconception: 'seit-tense', feedback: 'For something still going on, German uses seit + the PRESENT tense.' }, 'Ich lerne für zwei Jahren Deutsch.', 'Ich lerne seit zwei Jahre Deutsch.'], why: 'seit + present tense for something still happening: Ich lerne seit zwei Jahren Deutsch.', lv: 5 },
]

const BUILD_DE: Build[] = [
  { tiles: ['Ich', 'habe', 'einen', 'Hund'], en: 'I have a dog', why: 'Subject, verb, then the object.', lv: 1 },
  { tiles: ['Meine Schwester', 'ist', 'sehr', 'lustig'], en: 'My sister is very funny', why: 'sehr goes just before the adjective.', lv: 2 },
  { tiles: ['Am Samstag', 'spiele', 'ich', 'Fußball'], en: 'On Saturday I play football', why: 'The verb is the second idea, so after Am Samstag comes spiele, then ich.', lv: 2 },
  { tiles: ['Morgen', 'gehen', 'wir', 'ins Kino'], en: 'Tomorrow we are going to the cinema', why: 'Time phrase first, then the verb, then the subject.', lv: 3 },
  { tiles: ['Mein Bruder', 'schwimmt', 'nicht', 'gern'], en: 'My brother doesn\'t like swimming', why: 'nicht gern goes after the verb.', lv: 3 },
  { tiles: ['Ich', 'möchte', 'Österreich', 'besuchen'], en: 'I would like to visit Austria', why: 'möchte is second; the infinitive besuchen goes to the end.', lv: 3 },
  { tiles: ['Wir', 'müssen', 'eine Uniform', 'tragen'], en: 'We have to wear a uniform', why: 'müssen is second; the infinitive tragen goes to the end.', lv: 4 },
  { tiles: ['Ich', 'finde', 'Mathe', 'interessant,', 'weil', 'der Lehrer', 'lustig', 'ist'], en: 'I find maths interesting because the teacher is funny', why: 'weil sends the verb (ist) to the end.', lv: 4 },
  { tiles: ['Wenn', 'es', 'regnet,', 'bleibe', 'ich', 'zu Hause'], en: 'When it rains, I stay at home', why: 'regnet goes to the end of the wenn-clause; then verb, comma, verb: regnet, bleibe.', lv: 5 },
  { tiles: ['Ich', 'lerne', 'Deutsch,', 'weil', 'ich', 'nach Berlin', 'fahren', 'möchte'], en: 'I am learning German because I would like to go to Berlin', why: 'After weil the verb möchte goes to the very end, after the infinitive fahren.', lv: 5 },
]

const TYPE_DE: Tr[] = [
  { en: 'I have a sister.', de: ['Ich habe eine Schwester'], hint: 'die Schwester is feminine.', why: 'eine Schwester: feminine, so eine.', lv: 3 },
  { en: 'My name is Lena.', de: ['Ich heiße Lena', 'Mein Name ist Lena'], hint: 'German says "I am called...".', why: 'Ich heiße Lena is the usual way.', lv: 3 },
  { en: 'I am thirteen years old.', de: ['Ich bin dreizehn Jahre alt', 'Ich bin dreizehn', 'Ich bin 13 Jahre alt'], hint: 'Ich bin ... Jahre alt.', why: 'German uses sein (to be) for age: Ich bin dreizehn Jahre alt.', lv: 3 },
  { en: 'I play tennis.', de: ['Ich spiele Tennis'], hint: 'spielen: ich spiele.', why: 'ich + -e: ich spiele.', lv: 3 },
  { en: 'My brother is tall.', de: ['Mein Bruder ist groß'], hint: 'groß = tall (for people).', why: 'der Bruder: mein Bruder; groß = tall.', lv: 3 },
  { en: 'I like reading.', de: ['Ich lese gern'], hint: 'verb + gern.', why: 'lesen: ich lese; gern after the verb = like doing.', lv: 3 },
  { en: 'On Monday I play football.', de: ['Am Montag spiele ich Fußball', 'Ich spiele am Montag Fußball'], hint: 'Am Montag ... and keep the verb second.', why: 'After Am Montag, the verb comes second: spiele ich.', lv: 4 },
  { en: 'I don\'t have a dog.', de: ['Ich habe keinen Hund'], hint: 'Use kein, with the masculine ending.', why: 'der Hund is masculine: keinen Hund.', lv: 4 },
  { en: 'I find history boring.', de: ['Ich finde Geschichte langweilig', 'Geschichte finde ich langweilig'], hint: 'Ich finde ... + adjective.', why: 'Geschichte = history; langweilig = boring.', lv: 4 },
  { en: 'I go to school by bike.', de: ['Ich fahre mit dem Rad zur Schule', 'Ich fahre mit dem Fahrrad zur Schule'], hint: 'fahren + mit dem ... + zur Schule.', why: 'Manner (mit dem Rad) before place (zur Schule).', lv: 4 },
  { en: 'She has long hair.', de: ['Sie hat lange Haare'], hint: 'Haare is plural.', why: 'die Haare (plural): lange Haare.', lv: 4 },
  { en: 'My mother is a doctor.', de: ['Meine Mutter ist Ärztin'], hint: 'No "a", and use the female form.', why: 'No "a" before a job; der Arzt -> die Ärztin.', lv: 4 },
  { en: 'In the evening I watch TV.', de: ['Am Abend sehe ich fern', 'Abends sehe ich fern', 'Ich sehe am Abend fern', 'Ich sehe abends fern'], hint: 'fernsehen splits: sehe ... fern.', why: 'fernsehen is separable: sehe ... fern, with fern at the end.', lv: 5 },
  { en: 'I like maths because it is easy.', de: ['Ich mag Mathe, weil es einfach ist', 'Ich mag Mathe, weil es leicht ist', 'Ich mag Mathe, weil das einfach ist', 'Ich mag Mathe, weil das leicht ist'], hint: 'Ich mag ..., weil ... (verb to the end).', why: 'weil sends ist to the end.', lv: 5 },
  { en: 'We have to wear a uniform.', de: ['Wir müssen eine Uniform tragen', 'Wir müssen eine Schuluniform tragen'], hint: 'müssen + infinitive at the end.', why: 'müssen is second; tragen goes to the end.', lv: 5 },
  { en: 'Tomorrow I am going to the cinema.', de: ['Morgen gehe ich ins Kino', 'Ich gehe morgen ins Kino'], hint: 'German uses the present tense with morgen.', why: 'Present tense + morgen for the future; verb second.', lv: 5 },
  { en: 'I would like a coffee, please.', de: ['Ich möchte einen Kaffee, bitte', 'Ich möchte bitte einen Kaffee', 'Ich hätte gern einen Kaffee, bitte', 'Ich hätte gern einen Kaffee', 'Ich möchte einen Kaffee', 'Einen Kaffee, bitte'], hint: 'der Kaffee is masculine.', why: 'der Kaffee: einen Kaffee after möchte.', lv: 5 },
]

const TO_DE_TASKS: Task[] = [
  {
    prompt: 'Translate into German:  "My name is Tom. I am thirteen years old and I live in Manchester. I have a sister, but I don\'t have a brother. I like playing football and I often go to the cinema."',
    model: 'Ich heiße Tom. Ich bin dreizehn Jahre alt und ich wohne in Manchester. Ich habe eine Schwester, aber ich habe keinen Bruder. Ich spiele gern Fußball und ich gehe oft ins Kino.',
    checklist: ['Uses Ich heiße... and Ich bin ... Jahre alt', 'eine Schwester and keinen Bruder with the right endings', 'gern after the verb (Ich spiele gern Fußball)', 'oft after the verb (Ich gehe oft ins Kino)', 'Verb endings correct for ich (-e)'],
    hint: 'Keep it simple: one idea per sentence, verb second.',
  },
  {
    prompt: 'Translate into German:  "At the weekend I play tennis with my friend. On Sunday we go to the swimming pool. I like swimming because it is healthy."',
    model: 'Am Wochenende spiele ich mit meiner Freundin Tennis. Am Sonntag gehen wir ins Schwimmbad. Ich schwimme gern, weil es gesund ist.',
    checklist: ['Verb second after Am Wochenende / Am Sonntag (spiele ich, gehen wir)', 'mit meiner Freundin / mit meinem Freund', 'ins Schwimmbad', 'weil with the verb at the end (weil es gesund ist)'],
    hint: 'Time phrase first? Then the verb, then the subject.',
  },
]

// ------------------------------------------------------------------ past and future

const PAST_EN: Sent[] = [
  { de: 'Ich habe einen Kuchen gebacken.', en: 'I baked a cake.', wrong: ['I am baking a cake.', 'I will bake a cake.', 'I have to bake a cake.'], why: 'habe ... gebacken = baked (perfect tense: haben + past participle at the end).', lv: 2 },
  { de: 'Wir sind mit dem Zug nach Wien gefahren.', en: 'We went to Vienna by train.', wrong: ['We are going to Vienna by train.', 'We went to Vienna by car.', 'We are from Vienna and came by train.'], why: 'sind ... gefahren = went (sein for movement); mit dem Zug = by train.', lv: 2 },
  { de: 'Es hat den ganzen Tag geregnet.', en: 'It rained all day.', wrong: ['It will rain all day.', 'It rained for a whole week.', 'It is raining all day.'], why: 'hat ... geregnet = rained; den ganzen Tag = all day.', lv: 3 },
  { de: 'Ich werde im Sommer einen Job suchen.', en: 'I will look for a job in the summer.', wrong: [{ label: 'I want to look for a job in the summer.', misconception: 'werden-wollen', feedback: 'werde + infinitive = will. "I want" would be ich will.' }, 'I looked for a job in the summer.', 'I will look for a job in the autumn.'], why: 'ich werde + infinitive at the end = I will.', lv: 3 },
  { de: 'Als Kind hatte ich Angst vor Hunden.', en: 'As a child I was afraid of dogs.', wrong: ['As a child I had a dog.', 'As a child I liked dogs.', 'I am afraid of dogs.'], why: 'als Kind = as a child; hatte Angst vor = was afraid of.', lv: 4 },
  { de: 'Früher gab es hier kein Kino.', en: 'There used to be no cinema here.', wrong: ['There is no cinema here.', 'There used to be a cinema here.', 'There will be no cinema here.'], why: 'früher = in the past; es gab = there was; kein = no.', lv: 4 },
  { de: 'Nach dem Essen sind wir spazieren gegangen.', en: 'After the meal we went for a walk.', wrong: ['Before the meal we went for a walk.', 'After the meal we go for a walk.', 'After the meal we went shopping.'], why: 'nach dem Essen = after the meal; spazieren gehen = to go for a walk.', lv: 4 },
  { de: 'Mein Opa ist in Hamburg geboren.', en: 'My grandad was born in Hamburg.', wrong: ['My grandad lives in Hamburg.', 'My grandad has moved to Hamburg.', 'My grandma was born in Hamburg.'], why: 'ist ... geboren = was born.', lv: 3 },
  { de: 'Morgen werden wir unsere Großeltern besuchen.', en: 'Tomorrow we will visit our grandparents.', wrong: ['Yesterday we visited our grandparents.', 'Tomorrow our grandparents will visit us.', 'Tomorrow we will visit our parents.'], why: 'werden ... besuchen = will visit; wir is the subject.', lv: 3 },
  { de: 'Ich habe meine Hausaufgaben vergessen.', en: 'I forgot my homework.', wrong: ['I have done my homework.', 'I will forget my homework.', 'I lost my homework.'], why: 'vergessen = to forget; habe ... vergessen = forgot / have forgotten.', lv: 2 },
  { de: 'Als ich jünger war, habe ich in Schottland gewohnt.', en: 'When I was younger, I lived in Scotland.', wrong: ['When I am older, I will live in Scotland.', 'When I was younger, I visited Scotland.', 'When I was younger, I lived in Ireland.'], why: 'als ich jünger war = when I was younger; habe ... gewohnt = lived.', lv: 5 },
]

interface ChoosePast {
  en: string
  de: string
  wrong: Wrong[]
  why: string
  lv: number
}
const PAST_DE: ChoosePast[] = [
  { en: 'I played tennis.', de: 'Ich habe Tennis gespielt.', wrong: [{ label: 'Ich bin Tennis gespielt.', misconception: 'haben-sein', feedback: 'spielen is not a movement verb, so it uses haben.' }, { label: 'Ich habe gespielt Tennis.', misconception: 'participle-end', feedback: 'The past participle goes to the end.' }, 'Ich habe Tennis spielen.'], why: 'haben + past participle (gespielt) at the end.', lv: 2 },
  { en: 'We went to the beach.', de: 'Wir sind an den Strand gegangen.', wrong: [{ label: 'Wir haben an den Strand gegangen.', misconception: 'haben-sein', feedback: 'Verbs of movement (gehen, fahren) use sein.' }, 'Wir sind an den Strand gegeht.', 'Wir sind gegangen an den Strand.'], why: 'gehen is a movement verb, so sein: wir sind ... gegangen.', lv: 2 },
  { en: 'Yesterday I watched a film.', de: 'Gestern habe ich einen Film gesehen.', wrong: [{ label: 'Gestern ich habe einen Film gesehen.', misconception: 'verb-second', feedback: 'After Gestern the verb (habe) comes second.' }, 'Gestern habe ich einen Film gesieht.', 'Gestern habe ich einen Film sehen.'], why: 'Verb second after Gestern; sehen -> gesehen (irregular).', lv: 3 },
  { en: 'It was very hot.', de: 'Es war sehr heiß.', wrong: ['Es hatte sehr heiß.', 'Es wird sehr heiß.', 'Es war sehr heiße.'], why: 'war = was (imperfect of sein).', lv: 2 },
  { en: 'I will go to France.', de: 'Ich werde nach Frankreich fahren.', wrong: [{ label: 'Ich will nach Frankreich fahren.', misconception: 'will-want', feedback: 'ich will = I want. "I will" is ich werde.' }, { label: 'Ich werde fahren nach Frankreich.', misconception: 'infinitive-end', feedback: 'The infinitive goes to the end.' }, 'Ich werde nach Frankreich gefahren.'], why: 'werden + infinitive at the end = will.', lv: 3 },
  { en: 'We had a lot of fun.', de: 'Wir hatten viel Spaß.', wrong: ['Wir waren viel Spaß.', 'Wir haben viel Spaß.', 'Wir hatten viele Spaß.'], why: 'hatten = had (imperfect of haben).', lv: 3 },
  { en: 'There were lots of tourists.', de: 'Es gab viele Touristen.', wrong: [{ label: 'Es gaben viele Touristen.', misconception: 'es-gab', feedback: 'es gab never changes: es gab = there was / there were.' }, 'Es gibt viele Touristen.', 'Da gab viele Touristen.'], why: 'es gab = there was / there were (it never changes).', lv: 4 },
  { en: 'I got up at seven o\'clock.', de: 'Ich bin um sieben Uhr aufgestanden.', wrong: [{ label: 'Ich habe um sieben Uhr aufgestanden.', misconception: 'haben-sein', feedback: 'aufstehen is a change of position, so it uses sein.' }, { label: 'Ich bin um sieben Uhr geaufstanden.', misconception: 'separable-participle', feedback: 'For separable verbs, ge- goes in the middle: auf-ge-standen.' }, 'Ich stehe um sieben Uhr auf.'], why: 'aufstehen uses sein, and ge- goes after the prefix: aufgestanden.', lv: 4 },
  { en: 'Next year I will visit Berlin.', de: 'Nächstes Jahr werde ich Berlin besuchen.', wrong: [{ label: 'Nächstes Jahr ich werde Berlin besuchen.', misconception: 'verb-second', feedback: 'After Nächstes Jahr the verb (werde) comes second.' }, 'Nächstes Jahr werde ich Berlin besucht.', 'Nächstes Jahr habe ich Berlin besucht.'], why: 'Verb second (werde), infinitive at the end (besuchen).', lv: 5 },
]

const BUILD_PAST: Build[] = [
  { tiles: ['Ich', 'habe', 'Tennis', 'gespielt'], en: 'I played tennis', why: 'haben second, past participle at the end.', lv: 2 },
  { tiles: ['Gestern', 'habe', 'ich', 'Pizza', 'gegessen'], en: 'Yesterday I ate pizza', why: 'Time first, then habe, then ich; gegessen at the end.', lv: 3 },
  { tiles: ['Letztes Jahr', 'bin', 'ich', 'nach Spanien', 'gefahren'], en: 'Last year I went to Spain', why: 'Time first, then bin, then ich; gefahren at the end.', lv: 3 },
  { tiles: ['Am Wochenende', 'haben', 'wir', 'einen Film', 'gesehen'], en: 'At the weekend we watched a film', why: 'Time first, then haben, then wir; gesehen at the end.', lv: 4 },
  { tiles: ['Nächstes Jahr', 'werde', 'ich', 'Berlin', 'besuchen'], en: 'Next year I will visit Berlin', why: 'werde second, the infinitive besuchen at the end.', lv: 4 },
  { tiles: ['Ich', 'bin', 'um sieben Uhr', 'aufgestanden'], en: 'I got up at seven o\'clock', why: 'sein (bin) for aufstehen; the participle aufgestanden at the end.', lv: 5 },
]

const TYPE_PAST: Tr[] = [
  { en: 'I played football.', de: ['Ich habe Fußball gespielt', 'Ich spielte Fußball'], hint: 'habe + ... + participle at the end.', why: 'spielen -> gespielt, with haben.', lv: 3 },
  { en: 'We went to the cinema.', de: ['Wir sind ins Kino gegangen', 'Wir sind ins Kino gefahren', 'Wir gingen ins Kino'], hint: 'Movement: use sein.', why: 'gehen uses sein: wir sind ... gegangen.', lv: 3 },
  { en: 'It was boring.', de: ['Es war langweilig', 'Das war langweilig'], hint: 'was = war.', why: 'war = was.', lv: 3 },
  { en: 'I had a dog.', de: ['Ich hatte einen Hund'], hint: 'had = hatte; der Hund is masculine.', why: 'hatte = had; einen Hund (accusative).', lv: 3 },
  { en: 'Yesterday I ate pizza.', de: ['Gestern habe ich Pizza gegessen', 'Ich habe gestern Pizza gegessen', 'Gestern habe ich eine Pizza gegessen', 'Ich habe gestern eine Pizza gegessen', 'Gestern aß ich Pizza', 'Gestern aß ich eine Pizza', 'Ich aß gestern Pizza', 'Ich aß gestern eine Pizza'], hint: 'essen -> gegessen.', why: 'Verb second after Gestern; gegessen at the end.', lv: 4 },
  { en: 'Last year I went to Spain.', de: ['Letztes Jahr bin ich nach Spanien gefahren', 'Ich bin letztes Jahr nach Spanien gefahren', 'Letztes Jahr bin ich nach Spanien geflogen', 'Ich bin letztes Jahr nach Spanien geflogen', 'Letztes Jahr fuhr ich nach Spanien', 'Letztes Jahr flog ich nach Spanien', 'Ich fuhr letztes Jahr nach Spanien', 'Ich flog letztes Jahr nach Spanien'], hint: 'Travel verbs use sein.', why: 'fahren / fliegen use sein; nach Spanien = to Spain.', lv: 4 },
  { en: 'We stayed at home.', de: ['Wir sind zu Hause geblieben', 'Wir blieben zu Hause'], hint: 'bleiben uses sein.', why: 'bleiben -> geblieben, with sein.', lv: 4 },
  { en: 'I will play tennis.', de: ['Ich werde Tennis spielen'], hint: 'werde + infinitive at the end.', why: 'werden + infinitive = will.', lv: 4 },
  { en: 'On Saturday I bought a T-shirt.', de: ['Am Samstag habe ich ein T-Shirt gekauft', 'Ich habe am Samstag ein T-Shirt gekauft', 'Am Samstag kaufte ich ein T-Shirt', 'Ich kaufte am Samstag ein T-Shirt'], hint: 'das T-Shirt; kaufen -> gekauft.', why: 'Verb second after Am Samstag; gekauft at the end.', lv: 5 },
  { en: 'Next year I will visit Berlin.', de: ['Nächstes Jahr werde ich Berlin besuchen', 'Ich werde nächstes Jahr Berlin besuchen', 'Nächstes Jahr besuche ich Berlin', 'Ich besuche nächstes Jahr Berlin'], hint: 'werde second, infinitive at the end.', why: 'werden + infinitive; German can also use the present with a future time phrase.', lv: 5 },
  { en: 'There was a big swimming pool.', de: ['Es gab ein großes Schwimmbad', 'Da war ein großes Schwimmbad'], hint: 'there was = es gab; das Schwimmbad.', why: 'es gab = there was; das Schwimmbad is neuter: ein großes Schwimmbad.', lv: 5 },
  { en: 'After school I watched TV.', de: ['Nach der Schule habe ich ferngesehen', 'Ich habe nach der Schule ferngesehen', 'Nach der Schule sah ich fern', 'Ich sah nach der Schule fern'], hint: 'fernsehen -> ferngesehen.', why: 'Separable verbs put ge- after the prefix: ferngesehen.', lv: 5 },
]

const PAST_TASKS: Task[] = [
  {
    prompt: 'Translate into German:  "Last weekend I went to Hamburg with my family. We visited the harbour and ate fish. It was great! Next year I will go to Berlin."',
    model: 'Letztes Wochenende bin ich mit meiner Familie nach Hamburg gefahren. Wir haben den Hafen besucht und Fisch gegessen. Es war toll! Nächstes Jahr werde ich nach Berlin fahren.',
    checklist: ['bin ... gefahren (sein for travel)', 'haben ... besucht / gegessen (haben, participles at the end)', 'Es war ... for "It was"', 'werde ... fahren for the future', 'Verb second after the time phrases'],
    hint: 'Past: bin / haben + participle at the end. Future: werde + infinitive at the end.',
  },
  {
    prompt: 'Translate into German:  "Yesterday I got up at seven o\'clock. I had breakfast and then I went to school by bus. After school I played football."',
    model: 'Gestern bin ich um sieben Uhr aufgestanden. Ich habe gefrühstückt und dann bin ich mit dem Bus zur Schule gefahren. Nach der Schule habe ich Fußball gespielt.',
    checklist: ['bin ... aufgestanden (separable, with sein)', 'habe ... gefrühstückt / gegessen for breakfast', 'bin ... mit dem Bus ... gefahren', 'Verb second after Gestern, dann and Nach der Schule'],
    hint: 'After dann (then) the verb still comes second: dann bin ich...',
  },
]

// ------------------------------------------------------------------ generators

export const translationGenerators: ItemGenerator[] = [
  meaningGen('tr.en.choose', 'translate.to-english', [1, 5], TO_EN, 'Translate each part, then check the small words: nicht, kein, seit, and the verb\'s tense.'),
  G('top.tr.en.false-friends', 'translate.to-english', [2, 4], (rng) => {
    const f = rng.pick(FALSE_FRIENDS)
    const others = pickN(rng, FALSE_FRIENDS.filter((x) => x !== f), 2).map((x) => x.en)
    return choice({
      rng,
      prompt: `${q(f.de)} looks like an English word. What does it really mean?`,
      correct: f.en,
      wrong: [{ label: f.trap, misconception: 'false-friend', feedback: `${f.de} is a false friend: it means "${f.en}".` }, ...others],
      hint: 'False friends look like English words but mean something else.',
      explanation: `${f.de} = ${f.en} (not "${f.trap}"). Watch out for false friends when you translate.`,
    })
  }),
  revealGen('tr.en.writing', 'translate.to-english', [4, 5], TO_EN_TASKS),

  G('top.tr.de.choose', 'translate.to-german', [1, 5], (rng, d) => {
    const t = nearLevel(rng, TO_DE, d)
    return choice({
      rng,
      prompt: `Which is the correct German for ${q(t.en)}?`,
      correct: t.de,
      wrong: t.wrong,
      hint: 'Check the verb ending, where the verb goes, and the word for "a" / "the".',
      explanation: `${t.de} ${t.why}`,
    })
  }),
  buildGen('tr.de.build', 'translate.to-german', [1, 5], BUILD_DE, 'Find the verb first: it is the second idea. Infinitives, past participles and verbs after weil go to the end.'),
  typeTranslateGen('tr.de.type', 'translate.to-german', [3, 5], TYPE_DE),
  revealGen('tr.de.writing', 'translate.to-german', [4, 5], TO_DE_TASKS),

  meaningGen('tr.past.to-en', 'translate.past', [2, 5], PAST_EN, 'Find the verbs: haben / sein + participle = past; werden + infinitive = future.'),
  G('top.tr.past.to-de', 'translate.past', [2, 5], (rng, d) => {
    const t = nearLevel(rng, PAST_DE, d)
    return choice({
      rng,
      prompt: `Which is the correct German for ${q(t.en)}?`,
      correct: t.de,
      wrong: t.wrong,
      hint: 'Check haben or sein, and that the participle or infinitive is at the end.',
      explanation: `${t.de} ${t.why}`,
    })
  }),
  buildGen('tr.past.build', 'translate.past', [2, 5], BUILD_PAST, 'The helping verb (haben, sein, werden) is second; the participle or infinitive goes to the end.'),
  typeTranslateGen('tr.past.type', 'translate.past', [3, 5], TYPE_PAST),
  revealGen('tr.past.writing', 'translate.past', [4, 5], PAST_TASKS),
]
