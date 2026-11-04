/**
 * Everyday words (colours, question words) and people: describing people, more family and pets, the body and
 * healthy living.
 */
import type { ItemGenerator } from '@/engine/registry'
import { matchItem } from '../../kit'
import { G, fill, gapGens, meaningGen, pickN, revealGen, uniqueBy, vocabGens, type Gap, type Sent, type Task, type W } from './lib'

// ------------------------------------------------------------------ colours

const COLOURS: W[] = [
  { de: 'rot', en: 'red' },
  { de: 'blau', en: 'blue' },
  { de: 'grün', en: 'green' },
  { de: 'gelb', en: 'yellow' },
  { de: 'schwarz', en: 'black' },
  { de: 'weiß', en: 'white' },
  { de: 'grau', en: 'grey' },
  { de: 'braun', en: 'brown' },
  { de: 'rosa', en: 'pink', alt: ['pink'], tip: 'You will also hear pink.' },
  { de: 'lila', en: 'purple', alt: ['violett'], tip: 'You will also see violett.' },
  { de: 'orange', en: 'orange' },
  { de: 'hellblau', en: 'light blue', tip: 'hell- = light, dunkel- = dark.' },
  { de: 'dunkelgrün', en: 'dark green', tip: 'hell- = light, dunkel- = dark.' },
  { de: 'bunt', en: 'colourful' },
]

const COLOUR_GAPS: Gap[] = [
  { de: 'Eine Banane ist ___.', answer: 'gelb', wrong: ['rot', 'blau', 'lila'], en: 'A banana is yellow.', why: 'gelb = yellow.' },
  { de: 'Das Gras ist ___.', answer: 'grün', wrong: ['gelb', 'rosa', 'grau'], en: 'The grass is green.', why: 'grün = green.' },
  { de: 'Schnee ist ___.', answer: 'weiß', wrong: ['schwarz', 'braun', 'grün'], en: 'Snow is white.', why: 'weiß = white (with ß).' },
  { de: 'Heute gibt es keine Wolken. Der Himmel ist ___.', answer: 'blau', wrong: ['grau', 'braun', 'grün'], en: 'There are no clouds today. The sky is blue.', why: 'blau = blue.' },
  { de: 'Kaffee ohne Milch ist ___.', answer: 'schwarz', wrong: ['weiß', 'gelb', 'rosa'], en: 'Coffee without milk is black.', why: 'schwarz = black.' },
  { de: 'Ein Elefant ist ___.', answer: 'grau', wrong: ['rosa', 'grün', 'gelb'], en: 'An elephant is grey.', why: 'grau = grey.' },
  { de: 'Schokolade ist meistens ___.', answer: 'braun', wrong: ['blau', 'grün', 'rot'], en: 'Chocolate is mostly brown.', why: 'braun = brown.' },
  { de: 'Ein Regenbogen ist ___.', answer: 'bunt', wrong: ['grau', 'schwarz', 'braun'], en: 'A rainbow is colourful.', why: 'bunt = colourful, many colours.' },
  { de: 'Rot und Weiß zusammen ergeben ___.', answer: 'rosa', alt: ['pink'], wrong: ['lila', 'braun', 'orange'], en: 'Red and white together make pink.', why: 'rosa = pink.' },
  { de: 'Blau und Gelb zusammen ergeben ___.', answer: 'grün', wrong: ['orange', 'lila', 'rosa'], en: 'Blue and yellow together make green.', why: 'grün = green.' },
  { de: 'Rot und Blau zusammen ergeben ___.', answer: 'lila', alt: ['violett'], wrong: ['grün', 'orange', 'braun'], en: 'Red and blue together make purple.', why: 'lila = purple.' },
  { de: 'Rot und Gelb zusammen ergeben ___.', answer: 'orange', wrong: ['grün', 'lila', 'grau'], en: 'Red and yellow together make orange.', why: 'orange = orange.' },
  { de: 'Eine Tomate ist ___.', answer: 'rot', wrong: ['blau', 'lila', 'schwarz'], en: 'A tomato is red.', why: 'rot = red.' },
]

// ------------------------------------------------------------------ question words

const QWORDS: W[] = [
  { de: 'wer', en: 'who?' },
  { de: 'was', en: 'what?', tip: 'was = what, not "was" (that is war).' },
  { de: 'wo', en: 'where? (which place)', tip: 'wo = where, not "who" (that is wer).' },
  { de: 'wohin', en: 'where to?' },
  { de: 'woher', en: 'where from?' },
  { de: 'wann', en: 'when?', tip: 'wann = when, not "want".' },
  { de: 'wie', en: 'how?' },
  { de: 'warum', en: 'why?' },
  { de: 'wie viel', en: 'how much?', alt: ['wieviel'] },
  { de: 'wie viele', en: 'how many?', alt: ['wieviele'] },
  { de: 'welche', en: 'which?', tip: 'The ending changes with the noun: welcher, welche, welches.' },
  { de: 'wie alt', en: 'how old?' },
  { de: 'um wie viel Uhr', en: 'at what time?', alt: ['um wieviel Uhr'] },
]

const QGAPS: (Gap & { reply: string })[] = [
  { de: '___ heißt du? – Ich heiße Lena.', reply: 'Ich heiße Lena.', answer: 'Wie', wrong: [{ label: 'Was', misconception: 'was-heisst', feedback: 'German asks "how are you called?": Wie heißt du?' }, 'Wer', 'Wo'], en: 'What is your name? – My name is Lena.', why: 'German asks "how are you called?": Wie heißt du?' },
  { de: '___ wohnst du? – Ich wohne in Hamburg.', reply: 'Ich wohne in Hamburg.', answer: 'Wo', wrong: [{ label: 'Woher', misconception: 'wo-woher', feedback: 'woher = where from. The answer says where she lives, not where she comes from.' }, 'Wohin', 'Wer'], en: 'Where do you live? – I live in Hamburg.', why: 'wo = where (which place).' },
  { de: '___ kommst du? – Ich komme aus Schottland.', reply: 'Ich komme aus Schottland.', answer: 'Woher', wrong: [{ label: 'Wo', misconception: 'wo-woher', feedback: '"aus Schottland" answers "where from?": woher.' }, 'Wohin', 'Wann'], en: 'Where do you come from? – I come from Scotland.', why: 'woher = where from; the answer uses aus (from).' },
  { de: '___ fährst du im Sommer? – Ich fahre nach Italien.', reply: 'Ich fahre nach Italien.', answer: 'Wohin', wrong: [{ label: 'Wo', misconception: 'wo-wohin', feedback: 'For movement towards a place (nach Italien) German uses wohin.' }, 'Woher', 'Wie'], en: 'Where are you going in the summer? – I am going to Italy.', why: 'wohin = where to; the answer uses nach (to).' },
  { de: '___ ist das? – Das ist mein Bruder Ben.', reply: 'Das ist mein Bruder Ben.', answer: 'Wer', wrong: [{ label: 'Wo', misconception: 'wo-who', feedback: 'wo means where. "Who" is wer.' }, 'Wie', 'Wann'], en: 'Who is that? – That is my brother Ben.', why: 'wer = who.' },
  { de: '___ alt bist du? – Ich bin dreizehn Jahre alt.', reply: 'Ich bin dreizehn Jahre alt.', answer: 'Wie', wrong: ['Was', 'Wann', 'Wer'], en: 'How old are you? – I am thirteen years old.', why: 'wie alt = how old.' },
  { de: '___ hast du Geburtstag? – Im Mai.', reply: 'Im Mai.', answer: 'Wann', wrong: [{ label: 'Wo', misconception: 'wo-wann', feedback: '"Im Mai" is a time, so the question is wann (when).' }, 'Wie', 'Was'], en: 'When is your birthday? – In May.', why: 'wann = when.' },
  { de: '___ Geschwister hast du? – Ich habe zwei Brüder.', reply: 'Ich habe zwei Brüder.', answer: 'Wie viele', wrong: [{ label: 'Wie viel', misconception: 'viel-viele', feedback: 'Use wie viele for things you can count (brothers, sisters).' }, 'Wann', 'Wer'], en: 'How many brothers and sisters do you have? – I have two brothers.', why: 'wie viele = how many (things you can count).' },
  { de: '___ kostet das T-Shirt? – Fünfzehn Euro.', reply: 'Fünfzehn Euro.', answer: 'Wie viel', alt: ['Was', 'Wieviel'], wrong: [{ label: 'Wie viele', misconception: 'viel-viele', feedback: 'Prices use wie viel (or was): Wie viel kostet das?' }, 'Wann', 'Wo'], en: 'How much does the T-shirt cost? – Fifteen euros.', why: 'wie viel = how much. Was kostet...? is also right.' },
  { de: '___ lernst du Deutsch? – Weil ich gern Sprachen lerne.', reply: 'Weil ich gern Sprachen lerne.', answer: 'Warum', wrong: ['Wann', 'Wie', 'Wo'], en: 'Why are you learning German? – Because I like learning languages.', why: 'warum = why; the answer starts with weil (because).' },
  { de: '___ beginnt die Schule? – Um acht Uhr.', reply: 'Um acht Uhr.', answer: 'Wann', wrong: ['Wo', 'Wie', 'Wer'], en: 'When does school start? – At eight o\'clock.', why: 'wann = when. You could also ask: Um wie viel Uhr beginnt die Schule?' },
  { de: '___ Farbe hat dein Fahrrad? – Es ist rot.', reply: 'Es ist rot.', answer: 'Welche', wrong: [{ label: 'Was', misconception: 'was-welche', feedback: 'Before a noun, "what / which" is welche: Welche Farbe?' }, 'Wie', 'Wer'], en: 'What colour is your bike? – It is red.', why: 'welche = which; before a noun ("which colour?") German uses welche.' },
  { de: '___ machst du am Wochenende? – Ich spiele Tennis.', reply: 'Ich spiele Tennis.', answer: 'Was', wrong: ['Wie', 'Wo', 'Wer'], en: 'What are you doing at the weekend? – I am playing tennis.', why: 'was = what.' },
  { de: '___ geht\'s? – Gut, danke.', reply: 'Gut, danke.', answer: 'Wie', wrong: ['Was', 'Wo', 'Wer'], en: 'How are you? – Fine, thanks.', why: 'Wie geht\'s? = How are you? (literally: how goes it?)' },
  { de: '___ spielst du Fußball? – Im Park.', reply: 'Im Park.', answer: 'Wo', wrong: [{ label: 'Wohin', misconception: 'wo-wohin', feedback: 'She is playing in a place, not going towards it: wo.' }, 'Woher', 'Wann'], en: 'Where do you play football? – In the park.', why: 'wo = where (which place).' },
]

// ------------------------------------------------------------------ describing people

const DESCRIBE: W[] = [
  { de: 'groß', en: 'tall' },
  { de: 'klein', en: 'small / short' },
  { de: 'schlank', en: 'slim' },
  { de: 'jung', en: 'young' },
  { de: 'lange Haare', en: 'long hair', tip: 'Haare is plural in German, so the adjective ends in -e.' },
  { de: 'kurze Haare', en: 'short hair', tip: 'Haare is plural in German, so the adjective ends in -e.' },
  { de: 'lockige Haare', en: 'curly hair' },
  { de: 'glatte Haare', en: 'straight hair' },
  { de: 'blaue Augen', en: 'blue eyes' },
  { de: 'Brille', en: 'glasses', g: 'die', tip: 'die Brille is singular in German: Ich trage eine Brille.' },
  { de: 'Bart', en: 'beard', g: 'der' },
  { de: 'Sommersprossen', en: 'freckles', g: 'pl' },
  { de: 'freundlich', en: 'friendly' },
  { de: 'lustig', en: 'funny' },
  { de: 'schüchtern', en: 'shy' },
  { de: 'faul', en: 'lazy' },
  { de: 'fleißig', en: 'hard-working' },
  { de: 'sportlich', en: 'sporty' },
  { de: 'frech', en: 'cheeky' },
  { de: 'ehrlich', en: 'honest' },
  { de: 'klug', en: 'clever' },
  { de: 'launisch', en: 'moody' },
  { de: 'hilfsbereit', en: 'helpful' },
  { de: 'geduldig', en: 'patient' },
  { de: 'streng', en: 'strict' },
  { de: 'sympathisch', en: 'likeable', tip: 'A false friend: sympathisch means likeable, not sympathetic.' },
  { de: 'selbstbewusst', en: 'self-confident' },
]

const DESCRIBE_GAPS: Gap[] = [
  { de: 'Mein Bruder spielt jeden Tag Fußball. Er ist sehr ___.', answer: 'sportlich', wrong: ['faul', 'schüchtern', 'launisch'], en: 'My brother plays football every day. He is very sporty.', why: 'sportlich = sporty.' },
  { de: 'Meine Schwester macht nie ihre Hausaufgaben. Sie ist ___.', answer: 'faul', wrong: ['fleißig', 'klug', 'ehrlich'], en: 'My sister never does her homework. She is lazy.', why: 'faul = lazy; fleißig is the opposite (hard-working).' },
  { de: 'Lena spricht nicht viel, wenn sie neue Leute trifft. Sie ist ___.', answer: 'schüchtern', wrong: ['frech', 'lustig', 'sportlich'], en: 'Lena does not say much when she meets new people. She is shy.', why: 'schüchtern = shy.' },
  { de: 'Jonas erzählt immer Witze. Er ist sehr ___.', answer: 'lustig', wrong: ['schüchtern', 'streng', 'faul'], en: 'Jonas is always telling jokes. He is very funny.', why: 'lustig = funny.' },
  { de: 'Mia hilft immer ihrer Mutter in der Küche. Sie ist ___.', answer: 'hilfsbereit', wrong: ['faul', 'frech', 'launisch'], en: 'Mia always helps her mother in the kitchen. She is helpful.', why: 'hilfsbereit = helpful (bereit = ready, Hilfe = help).' },
  { de: 'Unser Lehrer gibt viele Hausaufgaben und wir dürfen nie sprechen. Er ist sehr ___.', answer: 'streng', wrong: ['lustig', 'faul', 'schüchtern'], en: 'Our teacher gives lots of homework and we are never allowed to talk. He is very strict.', why: 'streng = strict.' },
  { de: 'Er hat ___ Haare.', cue: 'short', answer: 'kurze', wrong: [{ label: 'kurz', misconception: 'adjective-ending', feedback: 'Before a plural noun like Haare the adjective needs -e: kurze Haare.' }, 'lange', 'kurzen'], en: 'He has short hair.', why: 'Haare is plural, so the adjective before it ends in -e: kurze Haare.' },
  { de: 'Sie hat lange, ___ Haare.', cue: 'blond', answer: 'blonde', wrong: [{ label: 'blond', misconception: 'adjective-ending', feedback: 'Before a plural noun like Haare the adjective needs -e.' }, 'braune', 'blonden'], en: 'She has long, blond hair.', why: 'Haare is plural, so the adjective ends in -e: blonde Haare.' },
  { de: 'Ich habe ___ Augen.', cue: 'green', answer: 'grüne', wrong: [{ label: 'grün', misconception: 'adjective-ending', feedback: 'Before a plural noun like Augen the adjective needs -e.' }, 'blaue', 'grünen'], en: 'I have green eyes.', why: 'Augen is plural, so the adjective ends in -e: grüne Augen.' },
  { de: 'Mein Vater trägt eine ___.', cue: 'glasses', answer: 'Brille', wrong: [{ label: 'Brillen', misconception: 'glasses-plural', feedback: 'In German "glasses" is singular: eine Brille.' }, 'Bart', 'Augen'], en: 'My father wears glasses.', why: 'die Brille is singular in German: eine Brille.' },
  { de: 'Meine Mutter ist ziemlich ___.', cue: 'tall', answer: 'groß', wrong: [{ label: 'lang', misconception: 'lang-gross', feedback: 'lang is for things like hair or a film. For a tall person use groß.' }, 'klein', 'schlank'], en: 'My mother is quite tall.', why: 'groß = tall (for people) or big.' },
  { de: 'Mein Opa hat einen grauen ___.', cue: 'beard', answer: 'Bart', wrong: ['Brille', 'Haare', 'Augen'], en: 'My grandad has a grey beard.', why: 'der Bart = beard.' },
  { de: 'Unsere Lehrerin ist sehr ___. Wir mögen sie alle.', cue: 'likeable', answer: 'sympathisch', wrong: ['launisch', 'streng', 'faul'], en: 'Our teacher is very likeable. We all like her.', why: 'sympathisch = likeable (a false friend: it does not mean sympathetic).' },
  { de: 'Ben arbeitet immer sehr viel für die Schule. Er ist ___.', answer: 'fleißig', wrong: ['faul', 'frech', 'launisch'], en: 'Ben always works very hard for school. He is hard-working.', why: 'fleißig = hard-working.' },
]

const DESCRIBE_MEANINGS: Sent[] = [
  { de: 'Mein bester Freund ist klein und hat kurze, schwarze Haare.', en: 'My best friend is short and has short, black hair.', wrong: ['My best friend is tall and has short, black hair.', 'My best friend is short and has long, black hair.', 'My best friend is short and has short, brown hair.'], why: 'klein = short / small, kurz = short, schwarz = black.', lv: 2 },
  { de: 'Meine Schwester ist nicht sehr geduldig.', en: 'My sister is not very patient.', wrong: [{ label: 'My sister is very patient.', misconception: 'missed-nicht', feedback: 'Look for nicht: it makes the sentence negative.' }, 'My sister is not very polite.', 'My sister is never patient.'], why: 'nicht sehr = not very; geduldig = patient.', lv: 3 },
  { de: 'Ich finde meinen Onkel sehr sympathisch.', en: 'I find my uncle very likeable.', wrong: [{ label: 'I find my uncle very sympathetic.', misconception: 'false-friend', feedback: 'sympathisch is a false friend: it means likeable.' }, 'I find my aunt very likeable.', 'My uncle finds me very likeable.'], why: 'sympathisch = likeable; meinen Onkel is the object (whom I find likeable).', lv: 4 },
  { de: 'Er trägt eine Brille und hat einen Bart.', en: 'He wears glasses and has a beard.', wrong: ['He wears a hat and has a beard.', 'He wears glasses and has freckles.', 'She wears glasses and has a beard.'], why: 'die Brille = glasses, der Bart = beard, er = he.', lv: 2 },
  { de: 'Sie ist manchmal ein bisschen launisch.', en: 'She is sometimes a bit moody.', wrong: ['She is always a bit moody.', 'She is sometimes a bit lazy.', 'She is never moody.'], why: 'manchmal = sometimes, ein bisschen = a bit, launisch = moody.', lv: 3 },
  { de: 'Mein Vater ist lustig, aber er ist auch streng.', en: 'My father is funny, but he is also strict.', wrong: ['My father is funny, but he is also lazy.', 'My father is boring, but he is also strict.', 'My mother is funny, but she is also strict.'], why: 'lustig = funny, streng = strict, auch = also.', lv: 3 },
  { de: 'Meine Freundin hat lockige, rote Haare und Sommersprossen.', en: 'My friend has curly red hair and freckles.', wrong: ['My friend has straight red hair and freckles.', 'My friend has curly red hair and glasses.', 'My friend has curly brown hair and freckles.'], why: 'lockig = curly, rot = red, Sommersprossen = freckles.', lv: 4 },
  { de: 'Ich bin ziemlich selbstbewusst, aber mein Bruder ist schüchtern.', en: 'I am quite self-confident, but my brother is shy.', wrong: ['I am quite shy, but my brother is self-confident.', 'I am very self-confident, and my brother is too.', 'I am quite self-confident, but my brother is cheeky.'], why: 'ziemlich = quite, selbstbewusst = self-confident, schüchtern = shy.', lv: 5 },
]

const DESCRIBE_TASKS: Task[] = [
  {
    prompt: 'Describe your best friend in German in 3-4 sentences: what they look like (hair, eyes, height) and what they are like (two personality adjectives). Add one opinion.',
    model: 'Meine beste Freundin heißt Emma. Sie ist ziemlich groß und hat lange, braune Haare und grüne Augen. Sie ist sehr lustig und immer hilfsbereit. Ich finde sie toll, weil sie nie launisch ist.',
    checklist: ['Gives the friend\'s name (heißt...)', 'Describes hair and eyes with -e on the adjective (braune Haare, blaue Augen)', 'Uses at least two personality adjectives', 'Uses a qualifier like sehr, ziemlich or ein bisschen', 'Gives an opinion (Ich finde ihn / sie...)'],
    hint: 'Er / sie hat ... Haare und ... Augen. Er / sie ist sehr ... und ziemlich ...',
  },
  {
    prompt: 'Describe yourself in German in 3-4 sentences: your appearance and your personality. Include one thing you are NOT (nicht).',
    model: 'Ich bin dreizehn Jahre alt und ziemlich klein. Ich habe kurze, lockige Haare und braune Augen. Ich bin freundlich und sportlich, aber manchmal ein bisschen frech. Ich bin nicht sehr geduldig!',
    checklist: ['Uses Ich bin... and Ich habe... correctly', 'Describes hair and eyes with -e on the adjective', 'Uses at least two personality adjectives', 'Includes a negative with nicht', 'Uses a qualifier (sehr, ziemlich, ein bisschen)'],
    hint: 'Ich bin ... Ich habe ... Haare und ... Augen. Ich bin nicht sehr ...',
  },
  {
    prompt: 'Describe a member of your family in German in 3-4 sentences: who they are, what they look like and what they are like. Join two ideas with aber.',
    model: 'Mein Opa ist siebzig Jahre alt. Er hat kurze, graue Haare und einen Bart, und er trägt eine Brille. Er ist sehr nett und geduldig, aber manchmal ein bisschen streng.',
    checklist: ['Says who the person is (Mein Opa / Meine Tante...)', 'Describes appearance (hair, eyes, glasses or beard)', 'Uses at least two personality adjectives', 'Joins two ideas with aber', 'Uses er or sie correctly for the person'],
    hint: 'Mein... / Meine... ist ... Jahre alt. Er / Sie hat ... Er / Sie ist ..., aber ...',
  },
]

// ------------------------------------------------------------------ family and pets

const FAMILY_PETS: W[] = [
  { de: 'Eltern', en: 'parents', g: 'pl' },
  { de: 'Geschwister', en: 'brothers and sisters', g: 'pl' },
  { de: 'Großeltern', en: 'grandparents', g: 'pl' },
  { de: 'Opa', en: 'grandad', g: 'der' },
  { de: 'Oma', en: 'grandma', g: 'die' },
  { de: 'Cousin', en: 'cousin (male)', g: 'der', tip: 'Cousin is said the French way.' },
  { de: 'Cousine', en: 'cousin (female)', g: 'die', alt: ['Kusine'] },
  { de: 'Stiefvater', en: 'stepfather', g: 'der' },
  { de: 'Stiefmutter', en: 'stepmother', g: 'die' },
  { de: 'Halbbruder', en: 'half-brother', g: 'der' },
  { de: 'Halbschwester', en: 'half-sister', g: 'die' },
  { de: 'Einzelkind', en: 'only child', g: 'das', tip: 'Ich bin Einzelkind = I am an only child (no "ein").' },
  { de: 'Zwilling', en: 'twin', g: 'der' },
  { de: 'Haustier', en: 'pet', g: 'das' },
  { de: 'Hamster', en: 'hamster', g: 'der' },
  { de: 'Schildkröte', en: 'tortoise', g: 'die' },
  { de: 'Schlange', en: 'snake', g: 'die' },
  { de: 'Wellensittich', en: 'budgie', g: 'der' },
  { de: 'Spinne', en: 'spider', g: 'die' },
  { de: 'Goldfisch', en: 'goldfish', g: 'der' },
  { de: 'Pony', en: 'pony', g: 'das' },
  { de: 'Ratte', en: 'rat', g: 'die' },
  { de: 'Eidechse', en: 'lizard', g: 'die' },
]

const FAMILY_GAPS: Gap[] = [
  { de: 'Die Mutter von meinem Vater ist meine ___.', answer: 'Oma', alt: ['Großmutter'], wrong: ['Tante', 'Schwester', 'Cousine'], en: 'My father\'s mother is my grandma.', why: 'die Oma (or die Großmutter) = grandma.' },
  { de: 'Der Sohn von meiner Tante ist mein ___.', answer: 'Cousin', wrong: ['Onkel', 'Bruder', 'Opa'], en: 'My aunt\'s son is my cousin.', why: 'der Cousin = male cousin; die Cousine = female cousin.' },
  { de: 'Ich habe keine Geschwister. Ich bin ___.', answer: 'Einzelkind', wrong: ['Zwilling', 'Baby', 'Halbbruder'], en: 'I have no brothers or sisters. I am an only child.', why: 'das Einzelkind = only child. German leaves out "a": Ich bin Einzelkind.' },
  { de: 'Meine Mutter und mein Vater sind meine ___.', answer: 'Eltern', wrong: [{ label: 'Großeltern', misconception: 'gross-prefix', feedback: 'Groß- means grand-: die Großeltern are your grandparents.' }, 'Geschwister', 'Cousins'], en: 'My mother and my father are my parents.', why: 'die Eltern = parents (always plural).' },
  { de: 'Mein Bruder und ich haben am selben Tag Geburtstag. Wir sind ___.', answer: 'Zwillinge', wrong: ['Eltern', 'Einzelkinder', 'Cousins'], en: 'My brother and I have our birthday on the same day. We are twins.', why: 'der Zwilling = twin; plural die Zwillinge.' },
  { de: 'Der neue Mann von meiner Mutter ist mein ___.', answer: 'Stiefvater', wrong: ['Halbbruder', 'Onkel', 'Opa'], en: 'My mother\'s new husband is my stepfather.', why: 'Stief- = step-: der Stiefvater.' },
  { de: 'Meine Schwester hat einen anderen Vater. Sie ist meine ___.', answer: 'Halbschwester', wrong: [{ label: 'Stiefmutter', misconception: 'step-half', feedback: 'She is your sister with one parent in common: halb- (half-).' }, 'Cousine', 'Tante'], en: 'My sister has a different father. She is my half-sister.', why: 'Halb- = half-: die Halbschwester.' },
  { de: 'Ein ___ ist ein kleiner Vogel.', answer: 'Wellensittich', wrong: ['Hamster', 'Goldfisch', 'Pony'], en: 'A budgie is a small bird.', why: 'der Wellensittich = budgie.' },
  { de: 'Eine ___ hat acht Beine.', answer: 'Spinne', wrong: ['Schlange', 'Ratte', 'Schildkröte'], en: 'A spider has eight legs.', why: 'die Spinne = spider.' },
  { de: 'Eine ___ hat keine Beine.', answer: 'Schlange', wrong: ['Spinne', 'Eidechse', 'Ratte'], en: 'A snake has no legs.', why: 'die Schlange = snake.' },
  { de: 'Eine ___ trägt ihr Haus auf dem Rücken und ist sehr langsam.', answer: 'Schildkröte', wrong: ['Schlange', 'Spinne', 'Eidechse'], en: 'A tortoise carries its house on its back and is very slow.', why: 'die Schildkröte = tortoise (Schild = shield, Kröte = toad).' },
  { de: 'Ein ___ wohnt in einem Aquarium.', answer: 'Goldfisch', wrong: ['Hamster', 'Pony', 'Wellensittich'], en: 'A goldfish lives in an aquarium.', why: 'der Goldfisch = goldfish.' },
  { de: 'Ein ___ ist ein kleines Pferd.', answer: 'Pony', wrong: ['Hamster', 'Wellensittich', 'Goldfisch'], en: 'A pony is a small horse.', why: 'das Pony = pony.' },
]

const FAMILY_MEANINGS: Sent[] = [
  { de: 'Ich habe zwei Halbbrüder, aber keine Schwestern.', en: 'I have two half-brothers but no sisters.', wrong: ['I have two half-sisters but no brothers.', 'I have two stepbrothers but no sisters.', 'I have no half-brothers, but two sisters.'], why: 'Halbbrüder = half-brothers; keine Schwestern = no sisters.', lv: 3 },
  { de: 'Meine Eltern sind geschieden.', en: 'My parents are divorced.', wrong: ['My parents are married.', 'My grandparents are divorced.', 'My parents are strict.'], why: 'Eltern = parents; geschieden = divorced.', lv: 2 },
  { de: 'Wir haben drei Haustiere: einen Hund und zwei Katzen.', en: 'We have three pets: a dog and two cats.', wrong: ['We have three pets: two dogs and a cat.', 'We have two pets: a dog and three cats.', 'We have no pets, but we want a dog and two cats.'], why: 'Haustiere = pets; einen Hund = a dog; zwei Katzen = two cats.', lv: 2 },
  { de: 'Mein Cousin wohnt bei seinen Großeltern.', en: 'My cousin lives with his grandparents.', wrong: [{ label: 'My cousin lives near his grandparents.', misconception: 'bei-near', feedback: 'With people, bei means "at the home of": bei seinen Großeltern = with his grandparents.' }, 'My cousin lives with his parents.', 'My uncle lives with his grandparents.'], why: 'bei + a person = at their home; Großeltern = grandparents.', lv: 4 },
  { de: 'Ich bin Einzelkind, aber ich habe viele Cousinen.', en: 'I am an only child, but I have lots of cousins.', wrong: ['I am a twin, but I have lots of cousins.', 'I am an only child and I have no cousins.', 'I am the youngest child, but I have lots of cousins.'], why: 'Einzelkind = only child; viele Cousinen = lots of (female) cousins.', lv: 3 },
  { de: 'Meine Schildkröte ist schon vierzig Jahre alt.', en: 'My tortoise is already forty years old.', wrong: [{ label: 'My tortoise is already fourteen years old.', misconception: 'zehn-zig', feedback: 'vierzig = 40; vierzehn = 14.' }, 'My snake is already forty years old.', 'My tortoise is only four years old.'], why: 'die Schildkröte = tortoise; vierzig = forty; schon = already.', lv: 3 },
  { de: 'Meine Stiefmutter hat eine Schlange, aber ich habe Angst vor Schlangen.', en: 'My stepmother has a snake, but I am scared of snakes.', wrong: ['My stepmother has a snake, and I love snakes.', 'My stepsister has a snake, but I am scared of snakes.', 'My stepmother is scared of snakes, but I have one.'], why: 'Stiefmutter = stepmother; Angst haben vor = to be scared of.', lv: 5 },
]

// ------------------------------------------------------------------ health

const BODY: W[] = [
  { de: 'Kopf', en: 'head', g: 'der' },
  { de: 'Hals', en: 'neck / throat', g: 'der' },
  { de: 'Arm', en: 'arm', g: 'der' },
  { de: 'Hand', en: 'hand', g: 'die' },
  { de: 'Finger', en: 'finger', g: 'der' },
  { de: 'Bauch', en: 'stomach', g: 'der' },
  { de: 'Rücken', en: 'back', g: 'der' },
  { de: 'Bein', en: 'leg', g: 'das' },
  { de: 'Knie', en: 'knee', g: 'das' },
  { de: 'Fuß', en: 'foot', g: 'der' },
  { de: 'Auge', en: 'eye', g: 'das' },
  { de: 'Ohr', en: 'ear', g: 'das' },
  { de: 'Nase', en: 'nose', g: 'die' },
  { de: 'Mund', en: 'mouth', g: 'der' },
  { de: 'Zahn', en: 'tooth', g: 'der' },
  { de: 'Schulter', en: 'shoulder', g: 'die' },
]

const HEALTHY: W[] = [
  { de: 'gesund', en: 'healthy' },
  { de: 'ungesund', en: 'unhealthy', tip: 'un- makes the opposite, just like in English.' },
  { de: 'Obst', en: 'fruit', g: 'das' },
  { de: 'Gemüse', en: 'vegetables', g: 'das', tip: 'das Gemüse is singular in German, but means vegetables.' },
  { de: 'Süßigkeiten', en: 'sweets', g: 'pl' },
  { de: 'Zucker', en: 'sugar', g: 'der' },
  { de: 'Schlaf', en: 'sleep', g: 'der' },
  { de: 'Sport treiben', en: 'to do sport' },
  { de: 'rauchen', en: 'to smoke' },
  { de: 'fit bleiben', en: 'to stay fit' },
  { de: 'müde', en: 'tired' },
  { de: 'Kopfschmerzen', en: 'a headache', g: 'pl', tip: 'German uses the plural: Ich habe Kopfschmerzen.' },
  { de: 'Ernährung', en: 'diet (the food you eat)', g: 'die' },
]

const PAINS: { part: string; en: string; word: string }[] = [
  { part: 'Kopf', en: 'a headache', word: 'Kopfschmerzen' },
  { part: 'Bauch', en: 'stomach ache', word: 'Bauchschmerzen' },
  { part: 'Hals', en: 'a sore throat', word: 'Halsschmerzen' },
  { part: 'Zahn', en: 'toothache', word: 'Zahnschmerzen' },
  { part: 'Ohr', en: 'earache', word: 'Ohrenschmerzen' },
  { part: 'Rücken', en: 'backache', word: 'Rückenschmerzen' },
]

const HEALTH_GAPS: Gap[] = [
  ...PAINS.map(
    (p, i): Gap => ({
      de: 'Ich habe ___.',
      cue: `I have ${p.en}`,
      answer: p.word,
      wrong: [PAINS[(i + 1) % PAINS.length]!.word, PAINS[(i + 2) % PAINS.length]!.word, PAINS[(i + 4) % PAINS.length]!.word],
      en: `I have ${p.en}.`,
      why: `body part + Schmerzen (pains): ${p.part} -> ${p.word}. German uses the plural Schmerzen.`,
    }),
  ),
  { de: 'Mir tut der ___ weh.', cue: 'My foot hurts', answer: 'Fuß', wrong: ['Arm', 'Kopf', 'Rücken'], en: 'My foot hurts.', why: 'Mir tut der / die / das ... weh = my ... hurts. der Fuß = foot.' },
  { de: 'Mir tut das ___ weh.', cue: 'My knee hurts', answer: 'Knie', wrong: ['Bein', 'Auge', 'Ohr'], en: 'My knee hurts.', why: 'das Knie = knee (the k is pronounced).' },
  { de: 'Mir tut die ___ weh.', cue: 'My hand hurts', answer: 'Hand', wrong: ['Nase', 'Schulter', 'Hals'], en: 'My hand hurts.', why: 'die Hand = hand.' },
  { de: 'Man sollte jeden Tag viel ___ trinken.', answer: 'Wasser', wrong: ['Cola', 'Limonade', 'Zucker'], en: 'You should drink lots of water every day.', why: 'Wasser = water; man sollte = you / one should.' },
  { de: 'Obst und Gemüse sind sehr ___.', answer: 'gesund', wrong: [{ label: 'ungesund', misconception: 'un-prefix', feedback: 'un- makes the opposite: ungesund = unhealthy.' }, 'müde', 'langweilig'], en: 'Fruit and vegetables are very healthy.', why: 'gesund = healthy.' },
  { de: 'Rauchen ist sehr ___.', answer: 'ungesund', wrong: ['gesund', 'lecker', 'fit'], en: 'Smoking is very unhealthy.', why: 'ungesund = unhealthy.' },
  { de: 'Um fit zu bleiben, treibe ich dreimal pro Woche ___.', answer: 'Sport', wrong: ['Schlaf', 'Wasser', 'Obst'], en: 'To stay fit, I do sport three times a week.', why: 'Sport treiben = to do sport.' },
  { de: 'Ich gehe früh ins Bett, weil ich genug ___ brauche.', answer: 'Schlaf', wrong: ['Sport', 'Zucker', 'Gemüse'], en: 'I go to bed early because I need enough sleep.', why: 'der Schlaf = sleep.' },
]

const HEALTH_MEANINGS: Sent[] = [
  { de: 'Ich esse jeden Tag fünf Portionen Obst und Gemüse.', en: 'I eat five portions of fruit and vegetables every day.', wrong: ['I eat five portions of fruit and vegetables every week.', 'I eat four portions of fruit and vegetables every day.', 'I should eat five portions of fruit and vegetables every day.'], why: 'jeden Tag = every day; Obst = fruit; Gemüse = vegetables.', lv: 2 },
  { de: 'Früher habe ich viel Fastfood gegessen, aber jetzt esse ich gesünder.', en: 'I used to eat a lot of fast food, but now I eat more healthily.', wrong: ['I will eat a lot of fast food, but now I eat more healthily.', 'I used to eat a lot of fast food, and now I eat even more.', 'I never ate fast food, but now I eat more healthily.'], why: 'früher = in the past; habe ... gegessen = ate; gesünder = more healthily.', lv: 5 },
  { de: 'Ich werde mehr Wasser trinken und weniger Zucker essen.', en: 'I will drink more water and eat less sugar.', wrong: [{ label: 'I want to drink more water and eat less sugar.', misconception: 'werden-wollen', feedback: 'werde + infinitive = will. "Ich will" would mean "I want".' }, 'I drink more water and eat less sugar.', 'I will drink less water and eat more sugar.'], why: 'ich werde ... trinken = I will drink; mehr = more; weniger = less.', lv: 4 },
  { de: 'Mir tut der Rücken weh, deshalb kann ich heute nicht Tennis spielen.', en: 'My back hurts, so I can\'t play tennis today.', wrong: ['My back hurts, so I must play tennis today.', 'My knee hurts, so I can\'t play tennis today.', 'My back hurts, but I can play tennis today.'], why: 'der Rücken = back; deshalb = so / therefore; kann ... nicht = can\'t.', lv: 4 },
  { de: 'Man sollte nicht rauchen, weil es ungesund ist.', en: 'You shouldn\'t smoke because it is unhealthy.', wrong: ['You should smoke because it is healthy.', 'You shouldn\'t smoke because it is expensive.', 'Nobody smokes because it is unhealthy.'], why: 'man sollte nicht = you / one shouldn\'t; weil = because.', lv: 3 },
  { de: 'Ich schlafe nur sechs Stunden pro Nacht und bin oft müde.', en: 'I only sleep six hours a night and am often tired.', wrong: [{ label: 'I only sleep sixteen hours a night and am often tired.', misconception: 'zehn', feedback: 'sechs = 6; sechzehn = 16.' }, 'I only sleep six hours a week and am often tired.', 'I only sleep six hours a night and am never tired.'], why: 'nur = only; Stunden = hours; oft = often; müde = tired.', lv: 3 },
  { de: 'Ich habe Halsschmerzen und gehe heute nicht in die Schule.', en: 'I have a sore throat and I am not going to school today.', wrong: ['I have a headache and I am not going to school today.', 'I have a sore throat but I am going to school today.', 'I have a sore throat and I am going to the doctor today.'], why: 'Halsschmerzen = sore throat; nicht in die Schule = not to school.', lv: 3 },
]

const HEALTH_TASKS: Task[] = [
  {
    prompt: 'Write 4-5 sentences in German about how healthy you are: what you eat and drink, what sport you do, and one thing you will change in the future (ich werde...).',
    model: 'Ich esse ziemlich gesund. Jeden Tag esse ich Obst und Gemüse, aber ich esse leider auch zu viele Süßigkeiten. Ich trinke viel Wasser, weil es gesund ist. Ich spiele zweimal pro Woche Hockey. In Zukunft werde ich mehr schlafen, weil ich oft müde bin.',
    checklist: ['Says what you eat and drink', 'Mentions sport and how often (zweimal pro Woche...)', 'Gives a reason with weil, verb at the end', 'Uses the future: ich werde + infinitive at the end', 'Gives an opinion or uses leider / zu viel'],
    hint: 'Ich esse ... Ich trinke ... Ich spiele ... pro Woche. In Zukunft werde ich ... (infinitive at the end).',
  },
  {
    prompt: 'You are ill and cannot go to a German friend\'s party. Write 3-4 sentences in German: say what hurts, what you have, and that you cannot come.',
    model: 'Hallo Jonas, es tut mir leid, aber ich kann nicht zu deiner Party kommen. Ich bin krank. Ich habe Kopfschmerzen und Halsschmerzen, und mir tut der Bauch weh. Ich bleibe heute im Bett. Viel Spaß!',
    checklist: ['Says you cannot come (ich kann nicht ... kommen)', 'Uses a -schmerzen word correctly', 'Uses Mir tut ... weh', 'Includes a greeting or a polite phrase (es tut mir leid)'],
    hint: 'Ich kann nicht kommen. Ich habe ...schmerzen. Mir tut der / die / das ... weh.',
  },
]

// ------------------------------------------------------------------ generators

export const peopleGenerators: ItemGenerator[] = [
  // colours
  ...vocabGens('col', 'vocab.colours', COLOURS, 'colours'),
  ...gapGens('col.gap', 'vocab.colours', COLOUR_GAPS, [1, 3], [3, 5]),

  // question words
  ...vocabGens('qw', 'vocab.questions', QWORDS, 'question words'),
  ...gapGens('qw.gap', 'vocab.questions', QGAPS, [2, 4], [3, 5]),
  G('top.qw.pairs', 'vocab.questions', [2, 4], (rng, d) => {
    const set = pickN(rng, uniqueBy(rng.shuffle(QGAPS), (g) => g.answer.toLowerCase()), d >= 4 ? 5 : 4)
    return matchItem({
      prompt: 'Match each question to its answer.',
      pairs: set.map((g) => ({ left: fill(g.de.split(' – ')[0] as string, g.answer), right: g.reply })),
      hint: 'Look at the question word first: wo = where, woher = where from, wann = when, wer = who...',
      explanation: set.map((g) => `${fill(g.de, g.answer)} (${g.en})`).join(' '),
    })
  }),

  // describing people
  ...vocabGens('desc', 'vocab.describing', DESCRIBE, 'describing people'),
  ...gapGens('desc.gap', 'vocab.describing', DESCRIBE_GAPS, [2, 4], [3, 5]),
  meaningGen('desc.meaning', 'vocab.describing', [2, 5], DESCRIBE_MEANINGS, 'Translate each word in turn, and look out for nicht, sehr and ziemlich.'),
  revealGen('desc.writing', 'vocab.describing', [4, 5], DESCRIBE_TASKS),

  // family and pets
  ...vocabGens('fam', 'vocab.family-pets', FAMILY_PETS, 'family and pets'),
  ...gapGens('fam.gap', 'vocab.family-pets', FAMILY_GAPS, [2, 4], [3, 5]),
  meaningGen('fam.meaning', 'vocab.family-pets', [2, 5], FAMILY_MEANINGS, 'Halb- = half-, Stief- = step-, Groß- = grand-.'),

  // health
  ...vocabGens('body', 'vocab.health', BODY, 'parts of the body'),
  ...vocabGens('healthy', 'vocab.health', HEALTHY, 'healthy living'),
  ...gapGens('health.gap', 'vocab.health', HEALTH_GAPS, [2, 4], [3, 5]),
  meaningGen('health.meaning', 'vocab.health', [2, 5], HEALTH_MEANINGS, 'Find the verb first: is it now, the past (habe ... gegessen) or the future (werde ...)?'),
  revealGen('health.writing', 'vocab.health', [4, 5], HEALTH_TASKS),
]
