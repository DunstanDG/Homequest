/** Weather and seasons; countries, nationalities and languages; holidays and transport. */
import type { ItemGenerator } from '@/engine/registry'
import { choice, textItem } from '../../kit'
import { G, accepts, gapGens, keyboardTip, meaningGen, pickN, revealGen, vocabGens, type Gap, type Sent, type Task, type W, type Wrong } from './lib'

// ------------------------------------------------------------------ weather

const WEATHER: W[] = [
  { de: 'Es ist sonnig.', en: 'It is sunny.', alt: ['Es ist sonnig'] },
  { de: 'Die Sonne scheint.', en: 'The sun is shining.', alt: ['Die Sonne scheint'] },
  { de: 'Es regnet.', en: 'It is raining.', alt: ['Es regnet'] },
  { de: 'Es schneit.', en: 'It is snowing.', alt: ['Es schneit'] },
  { de: 'Es ist windig.', en: 'It is windy.', alt: ['Es ist windig'] },
  { de: 'Es ist wolkig.', en: 'It is cloudy.', alt: ['Es ist wolkig', 'Es ist bewölkt'] },
  { de: 'Es ist neblig.', en: 'It is foggy.', alt: ['Es ist neblig'] },
  { de: 'Es ist heiß.', en: 'It is hot.', alt: ['Es ist heiß'] },
  { de: 'Es ist kalt.', en: 'It is cold.', alt: ['Es ist kalt'] },
  { de: 'Es gibt ein Gewitter.', en: 'There is a thunderstorm.', alt: ['Es gibt ein Gewitter'] },
  { de: 'Regen', en: 'rain', g: 'der' },
  { de: 'Schnee', en: 'snow', g: 'der' },
  { de: 'Sonne', en: 'sun', g: 'die' },
  { de: 'Wolke', en: 'cloud', g: 'die' },
  { de: 'Regenschirm', en: 'umbrella', g: 'der', tip: 'Regen = rain + Schirm = shade.' },
  { de: 'Wetterbericht', en: 'weather forecast', g: 'der' },
  { de: 'Grad', en: 'degrees', alt: ['Grad Celsius'] },
]

const WEATHER_GAPS: Gap[] = [
  { de: 'Nimm deinen Regenschirm mit, es ___!', answer: 'regnet', wrong: ['scheint', 'friert', 'ist heiß'], en: 'Take your umbrella, it is raining!', why: 'Es regnet = it is raining (der Regen = rain).' },
  { de: 'Im Winter ___ es oft in den Alpen.', answer: 'schneit', wrong: ['scheint', 'heiß', 'sonnig'], en: 'In winter it often snows in the Alps.', why: 'Es schneit = it is snowing (der Schnee = snow). After Im Winter the verb comes second.' },
  { de: 'Es ist dreißig ___. Es ist sehr heiß!', answer: 'Grad', wrong: ['Uhr', 'Euro', 'Kilo'], en: 'It is thirty degrees. It is very hot!', why: 'Grad = degrees.' },
  { de: 'Heute ist es ___. Man kann nicht weit sehen.', answer: 'neblig', wrong: ['sonnig', 'heiß', 'windig'], en: 'Today it is foggy. You cannot see far.', why: 'neblig = foggy (der Nebel = fog).' },
  { de: 'Es ist ___. Wir gehen an den Strand!', answer: 'sonnig', wrong: ['kalt', 'neblig', 'regnerisch'], en: 'It is sunny. We are going to the beach!', why: 'sonnig = sunny.' },
  { de: 'Mein Hut ist weggeflogen! Es ist so ___.', answer: 'windig', wrong: ['sonnig', 'neblig', 'heiß'], en: 'My hat has blown away! It is so windy.', why: 'windig = windy.' },
  { de: 'Im ___ ist es oft kalt und es schneit.', answer: 'Winter', wrong: ['Sommer', 'August', 'Juli'], en: 'In winter it is often cold and it snows.', why: 'der Winter = winter.' },
  { de: 'Im ___ fallen die Blätter von den Bäumen.', answer: 'Herbst', wrong: ['Frühling', 'Sommer', 'Mai'], en: 'In autumn the leaves fall from the trees.', why: 'der Herbst = autumn.' },
  { de: 'Es blitzt und donnert. Es gibt ein ___.', answer: 'Gewitter', wrong: ['Regenschirm', 'Grad', 'Wetter'], en: 'There is lightning and thunder. There is a thunderstorm.', why: 'das Gewitter = thunderstorm.' },
]

const WEATHER_MEANINGS: Sent[] = [
  { de: 'Morgen regnet es im Norden, aber im Süden ist es sonnig.', en: 'Tomorrow it will rain in the north, but in the south it will be sunny.', wrong: ['Tomorrow it will rain in the south, but in the north it will be sunny.', 'Yesterday it rained in the north, but in the south it was sunny.', 'Tomorrow it will snow in the north, but in the south it will be sunny.'], why: 'German often uses the present tense with morgen for the future. Norden = north, Süden = south.', lv: 3 },
  { de: 'Gestern war es sehr kalt und es hat geschneit.', en: 'Yesterday it was very cold and it snowed.', wrong: ['Tomorrow it will be very cold and it will snow.', 'Yesterday it was very cold and it rained.', 'Yesterday it was very hot and it snowed.'], why: 'gestern = yesterday; war = was; hat geschneit = snowed.', lv: 4 },
  { de: 'Die Temperaturen liegen zwischen zehn und fünfzehn Grad.', en: 'Temperatures are between ten and fifteen degrees.', wrong: ['Temperatures are between ten and fifty degrees.', 'Temperatures are between two and five degrees.', 'Temperatures are under ten degrees.'], why: 'zwischen = between; fünfzehn = 15 (fünfzig = 50).', lv: 3 },
  { de: 'Wenn es regnet, bleibe ich zu Hause.', en: 'When it rains, I stay at home.', wrong: ['When it rains, I go out.', 'When it snows, I stay at home.', 'When it rains, I stay at school.'], why: 'wenn = when / if; bleiben = to stay; zu Hause = at home.', lv: 4 },
  { de: 'Es ist heute bewölkt, aber es regnet nicht.', en: 'It is cloudy today, but it is not raining.', wrong: ['It is sunny today, but it is not raining.', 'It is cloudy today and it is raining.', 'It was cloudy yesterday, but it did not rain.'], why: 'bewölkt = cloudy; nicht = not.', lv: 2 },
  { de: 'Im Sommer ist es in Spanien sehr heiß.', en: 'In summer it is very hot in Spain.', wrong: ['In winter it is very hot in Spain.', 'In summer it is very cold in Spain.', 'In summer it is quite warm in Spain.'], why: 'im Sommer = in summer; heiß = hot.', lv: 2 },
]

// ------------------------------------------------------------------ countries and nationalities

interface Country {
  de: string
  en: string
  /** "in ..." (where) and "to ..." forms. */
  inn: string
  to: string
  m: string
  f: string
  lang?: string
  langEn?: string
}

const COUNTRIES: Country[] = [
  { de: 'Deutschland', en: 'Germany', inn: 'in Deutschland', to: 'nach Deutschland', m: 'Deutscher', f: 'Deutsche', lang: 'Deutsch', langEn: 'German' },
  { de: 'Österreich', en: 'Austria', inn: 'in Österreich', to: 'nach Österreich', m: 'Österreicher', f: 'Österreicherin', lang: 'Deutsch', langEn: 'German' },
  { de: 'die Schweiz', en: 'Switzerland', inn: 'in der Schweiz', to: 'in die Schweiz', m: 'Schweizer', f: 'Schweizerin' },
  { de: 'England', en: 'England', inn: 'in England', to: 'nach England', m: 'Engländer', f: 'Engländerin', lang: 'Englisch', langEn: 'English' },
  { de: 'Schottland', en: 'Scotland', inn: 'in Schottland', to: 'nach Schottland', m: 'Schotte', f: 'Schottin' },
  { de: 'Wales', en: 'Wales', inn: 'in Wales', to: 'nach Wales', m: 'Waliser', f: 'Waliserin' },
  { de: 'Irland', en: 'Ireland', inn: 'in Irland', to: 'nach Irland', m: 'Ire', f: 'Irin' },
  { de: 'Frankreich', en: 'France', inn: 'in Frankreich', to: 'nach Frankreich', m: 'Franzose', f: 'Französin', lang: 'Französisch', langEn: 'French' },
  { de: 'Spanien', en: 'Spain', inn: 'in Spanien', to: 'nach Spanien', m: 'Spanier', f: 'Spanierin', lang: 'Spanisch', langEn: 'Spanish' },
  { de: 'Italien', en: 'Italy', inn: 'in Italien', to: 'nach Italien', m: 'Italiener', f: 'Italienerin', lang: 'Italienisch', langEn: 'Italian' },
  { de: 'die Türkei', en: 'Turkey', inn: 'in der Türkei', to: 'in die Türkei', m: 'Türke', f: 'Türkin', lang: 'Türkisch', langEn: 'Turkish' },
  { de: 'Polen', en: 'Poland', inn: 'in Polen', to: 'nach Polen', m: 'Pole', f: 'Polin', lang: 'Polnisch', langEn: 'Polish' },
  { de: 'Griechenland', en: 'Greece', inn: 'in Griechenland', to: 'nach Griechenland', m: 'Grieche', f: 'Griechin', lang: 'Griechisch', langEn: 'Greek' },
  { de: 'Portugal', en: 'Portugal', inn: 'in Portugal', to: 'nach Portugal', m: 'Portugiese', f: 'Portugiesin', lang: 'Portugiesisch', langEn: 'Portuguese' },
  { de: 'die Niederlande', en: 'the Netherlands', inn: 'in den Niederlanden', to: 'in die Niederlande', m: 'Niederländer', f: 'Niederländerin', lang: 'Niederländisch', langEn: 'Dutch' },
  { de: 'die USA', en: 'the USA', inn: 'in den USA', to: 'in die USA', m: 'Amerikaner', f: 'Amerikanerin' },
  { de: 'Japan', en: 'Japan', inn: 'in Japan', to: 'nach Japan', m: 'Japaner', f: 'Japanerin', lang: 'Japanisch', langEn: 'Japanese' },
]

const COUNTRY_WORDS: W[] = COUNTRIES.map((c) => ({ de: c.de, en: c.en, alt: c.de.startsWith('die ') ? [c.de.slice(4)] : undefined, tip: c.de.startsWith('die ') ? `${c.de} always has its article: ${c.inn}, ${c.to}.` : undefined }))
const LANGUAGES: W[] = uniqueLangs().map((c) => ({ de: c.lang as string, en: `${c.langEn} (language)` }))
function uniqueLangs() {
  const seen = new Set<string>()
  return COUNTRIES.filter((c) => c.lang && !seen.has(c.lang) && seen.add(c.lang))
}

const MEN = ['Lukas', 'Jonas', 'Ben', 'Paul', 'Felix', 'Tom']
const WOMEN = ['Mia', 'Emma', 'Lena', 'Hannah', 'Sophie', 'Anna']
const NAT_RULE = 'Nationalities have a male and a female form (Engländer / Engländerin, Franzose / Französin, Deutscher / Deutsche), and there is no "a": Sie ist Engländerin.'

const countryGens: ItemGenerator[] = [
  ...vocabGens('country', 'vocab.countries', COUNTRY_WORDS, 'countries'),
  ...vocabGens('lang', 'vocab.countries', LANGUAGES, 'languages'),

  G('top.nat.pick', 'vocab.countries', [2, 4], (rng) => {
    const c = rng.pick(COUNTRIES)
    const woman = rng.chance(0.5)
    const name = rng.pick(woman ? WOMEN : MEN)
    const form = woman ? c.f : c.m
    const other = rng.pick(COUNTRIES.filter((x) => x !== c))
    const wrong: Wrong[] = [
      { label: woman ? c.m : c.f, misconception: 'nationality-gender', feedback: `${name} is a ${woman ? 'girl' : 'boy'}: use the ${woman ? 'female' : 'male'} form.` },
      ...(c.lang && c.lang !== form ? [{ label: c.lang, misconception: 'language-nationality', feedback: `${c.lang} is the language. The person is ${c.m} / ${c.f}.` }] : []),
      woman ? other.f : other.m,
    ]
    return choice({
      rng,
      prompt: `${name} kommt aus ${c.de.startsWith('die ') ? c.inn.replace(/^in /, '') : c.de}. ${woman ? 'Sie' : 'Er'} ist ___.`,
      correct: form,
      wrong,
      hint: `Is ${name} a boy or a girl? And is the word a person or a language?`,
      explanation: `${name} kommt aus ${c.de.startsWith('die ') ? c.inn.replace(/^in /, '') : c.de}, also ist ${woman ? 'sie' : 'er'} ${form}. ${NAT_RULE}`,
    })
  }),

  G('top.nat.type', 'vocab.countries', [4, 5], (rng) => {
    const c = rng.pick(COUNTRIES)
    const woman = rng.chance(0.5)
    const form = woman ? c.f : c.m
    return textItem({
      prompt: `Type the nationality: "I am ${woman ? 'a girl' : 'a boy'} from ${c.en}."  Ich bin ___.`,
      accept: accepts(form),
      placeholder: 'Type the nationality',
      hint: woman ? 'Most female forms end in -in (but a German girl is Deutsche).' : 'Use the male form, with no word for "a".',
      explanation: `${c.en}: ${c.m} (male), ${c.f} (female). ${NAT_RULE}${keyboardTip(form)}`,
    })
  }),

  G('top.lang.pick', 'vocab.countries', [2, 4], (rng) => {
    const c = rng.pick(COUNTRIES.filter((x) => x.lang && x.lang !== 'Deutsch'))
    const otherLang = pickN(rng, COUNTRIES.filter((x) => x.lang && x.lang !== c.lang), 1)[0]?.lang ?? 'Deutsch'
    return choice({
      rng,
      prompt: `In ${c.inn.replace(/^in /, '')} spricht man ___.  (In ${c.en} people speak ...)`,
      correct: c.lang as string,
      wrong: [
        { label: c.m, misconception: 'language-nationality', feedback: `${c.m} is a person from ${c.en}. The language ends in -isch: ${c.lang}.` },
        { label: c.f, misconception: 'language-nationality', feedback: `${c.f} is a woman from ${c.en}. The language is ${c.lang}.` },
        otherLang,
      ],
      hint: 'Most languages end in -isch.',
      explanation: `In ${c.inn.replace(/^in /, '')} spricht man ${c.lang} (${c.langEn}). Languages are written with a capital letter and most end in -isch.`,
    })
  }),

  G('top.country.prep', 'vocab.countries', [3, 5], (rng) => {
    const c = rng.pick(COUNTRIES)
    const going = rng.chance(0.5)
    const correct = going ? c.to : c.inn
    const bare = c.de.replace(/^die /, '')
    const art = c.de.startsWith('die ')
    const wrong: Wrong[] = going
      ? art
        ? [{ label: `nach ${bare}`, misconception: 'nach-article', feedback: `Countries with an article (${c.de}) use "in die" for going there.` }, c.inn, `zu ${c.de}`]
        : [{ label: `in ${bare}`, misconception: 'nach-in', feedback: 'For going to a country without an article, use nach.' }, `zu ${bare}`, `nach dem ${bare}`]
      : art
        ? [{ label: `in ${bare}`, misconception: 'in-article', feedback: `${c.de} keeps its article: ${c.inn}.` }, c.to, `nach ${bare}`]
        : [{ label: `nach ${bare}`, misconception: 'nach-in', feedback: 'nach is for going TO a place. For being IN it, use in.' }, `zu ${bare}`, `im ${bare}`]
    return choice({
      rng,
      prompt: going ? `Im Sommer fahre ich ___.  (In the summer I am going to ${c.en}.)` : `Meine Tante wohnt ___.  (My aunt lives in ${c.en}.)`,
      correct,
      wrong,
      hint: art ? `${c.de} has an article, so it is different from most countries.` : 'Most countries have no article: nach = to, in = in.',
      explanation: `${correct}. Most countries: nach (to) and in (in): nach Spanien, in Spanien. Countries with an article: in die / in der: in die Schweiz, in der Schweiz; die USA and die Niederlande are plural: in die USA, in den USA.`,
    })
  }),
]

// ------------------------------------------------------------------ holidays and transport

const HOLIDAYS: W[] = [
  { de: 'mit dem Auto', en: 'by car' },
  { de: 'mit dem Zug', en: 'by train' },
  { de: 'mit dem Bus', en: 'by bus' },
  { de: 'mit dem Rad', en: 'by bike', alt: ['mit dem Fahrrad'] },
  { de: 'mit dem Flugzeug', en: 'by plane' },
  { de: 'mit der Straßenbahn', en: 'by tram' },
  { de: 'mit der U-Bahn', en: 'by underground' },
  { de: 'mit dem Schiff', en: 'by ship' },
  { de: 'zu Fuß', en: 'on foot' },
  { de: 'Jugendherberge', en: 'youth hostel', g: 'die' },
  { de: 'Campingplatz', en: 'campsite', g: 'der' },
  { de: 'Ferienwohnung', en: 'holiday flat', g: 'die' },
  { de: 'Hotel', en: 'hotel', g: 'das' },
  { de: 'Strand', en: 'beach', g: 'der' },
  { de: 'Meer', en: 'sea', g: 'das' },
  { de: 'See', en: 'lake', g: 'der', tip: 'der See = lake, but die See = the sea. das Meer = sea.' },
  { de: 'Berge', en: 'mountains', g: 'pl' },
  { de: 'Koffer', en: 'suitcase', g: 'der' },
  { de: 'Flughafen', en: 'airport', g: 'der' },
  { de: 'Ferien', en: 'holidays (from school)', g: 'pl' },
  { de: 'Ausland', en: 'abroad (foreign countries)', g: 'das', tip: 'ins Ausland fahren = to go abroad.' },
  { de: 'Sehenswürdigkeiten', en: 'sights', g: 'pl' },
]

const HOLIDAY_GAPS: Gap[] = [
  { de: 'Wir fliegen mit dem ___ nach Spanien. Der Flug dauert zwei Stunden.', answer: 'Flugzeug', wrong: ['Zug', 'Rad', 'Bus'], en: 'We are flying to Spain by plane. The flight takes two hours.', why: 'das Flugzeug = plane (fliegen = to fly).' },
  { de: 'Ich fahre jeden Tag mit dem ___ zur Schule. Das ist gut für die Umwelt und ich bin fit.', answer: 'Rad', alt: ['Fahrrad'], wrong: ['Auto', 'Flugzeug', 'Schiff'], en: 'I go to school by bike every day. It is good for the environment and I am fit.', why: 'das Rad / das Fahrrad = bike.' },
  { de: 'Ich gehe zu ___ zur Schule, weil ich nur fünf Minuten entfernt wohne.', answer: 'Fuß', wrong: ['Bus', 'Auto', 'Zug'], en: 'I walk to school because I only live five minutes away.', why: 'zu Fuß = on foot (der Fuß = foot).' },
  { de: 'Wir haben in einer ___ übernachtet. Es war billig und es gab viele junge Leute.', answer: 'Jugendherberge', wrong: ['Ferienwohnung', 'Wohnung', 'Garage'], en: 'We stayed in a youth hostel. It was cheap and there were lots of young people.', why: 'die Jugendherberge = youth hostel (Jugend = youth).' },
  { de: 'Wir haben gezeltet. Wir waren auf einem ___.', answer: 'Campingplatz', wrong: ['Flughafen', 'Bahnhof', 'Spielplatz'], en: 'We camped. We were on a campsite.', why: 'der Campingplatz = campsite.' },
  { de: 'Am ___ habe ich mich gesonnt und dann bin ich im Meer geschwommen.', answer: 'Strand', wrong: ['Flughafen', 'Bahnhof', 'Campingplatz'], en: 'I sunbathed on the beach and then I swam in the sea.', why: 'der Strand = beach.' },
  { de: 'Ich packe meine Kleider in den ___.', answer: 'Koffer', wrong: ['Flughafen', 'Strand', 'Campingplatz'], en: 'I pack my clothes into the suitcase.', why: 'der Koffer = suitcase.' },
  { de: 'In den ___ kann man wandern und Ski fahren.', answer: 'Bergen', wrong: ['Stränden', 'Seen', 'Flughäfen'], en: 'In the mountains you can go hiking and skiing.', why: 'der Berg = mountain; in den Bergen = in the mountains.' },
  { de: 'Der ___ in Frankfurt ist sehr groß. Jeden Tag landen dort viele Flugzeuge.', answer: 'Flughafen', wrong: ['Bahnhof', 'Campingplatz', 'Strand'], en: 'The airport in Frankfurt is very big. Lots of planes land there every day.', why: 'der Flughafen = airport (Hafen = port).' },
  { de: 'Wir sind mit der ___ durch Berlin gefahren.', cue: 'underground', answer: 'U-Bahn', alt: ['UBahn'], wrong: ['Straßenbahn', 'Zug', 'Schiff'], en: 'We travelled through Berlin by underground.', why: 'die U-Bahn = underground (U = Untergrund).' },
]

const HOLIDAY_MEANINGS: Sent[] = [
  { de: 'Letzten Sommer bin ich mit meiner Familie nach Österreich gefahren.', en: 'Last summer I went to Austria with my family.', wrong: [{ label: 'Last summer I went to Australia with my family.', misconception: 'oesterreich', feedback: 'Österreich = Austria. Australia is Australien.' }, 'Next summer I am going to Austria with my family.', 'Last winter I went to Austria with my family.'], why: 'letzten Sommer = last summer; bin ... gefahren = went; Österreich = Austria.', lv: 3 },
  { de: 'Wir haben zwei Wochen in einem Hotel am Meer verbracht.', en: 'We spent two weeks in a hotel by the sea.', wrong: [{ label: 'We spent two weeks in a hotel by a lake.', misconception: 'see-meer', feedback: 'das Meer = sea; der See = lake.' }, 'We spent two days in a hotel by the sea.', 'We spent two weeks in a youth hostel by the sea.'], why: 'zwei Wochen = two weeks; am Meer = by the sea; verbringen = to spend (time).', lv: 3 },
  { de: 'Nächstes Jahr möchte ich nach Amerika fliegen.', en: 'Next year I would like to fly to America.', wrong: ['Last year I flew to America.', 'Next year I would like to drive to America.', 'Next year I would like to fly to Africa.'], why: 'nächstes Jahr = next year; ich möchte = I would like; fliegen = to fly.', lv: 2 },
  { de: 'Der Zug hatte Verspätung, aber die Reise war trotzdem toll.', en: 'The train was late, but the journey was still great.', wrong: ['The train was on time and the journey was great.', 'The train was late, so the journey was terrible.', 'The bus was late, but the journey was still great.'], why: 'Verspätung haben = to be late (delayed); trotzdem = still / nevertheless.', lv: 5 },
  { de: 'Ich fahre lieber mit dem Zug, weil es umweltfreundlicher ist.', en: 'I prefer going by train because it is more environmentally friendly.', wrong: ['I prefer going by car because it is more environmentally friendly.', 'I prefer going by train because it is quicker.', 'I never go by train because it is more expensive.'], why: 'lieber = prefer; umweltfreundlicher = more environmentally friendly.', lv: 4 },
  { de: 'Am ersten Tag haben wir die Sehenswürdigkeiten besichtigt.', en: 'On the first day we visited the sights.', wrong: ['On the last day we visited the sights.', 'On the first day we visited our grandparents.', 'On the first day we will visit the sights.'], why: 'am ersten Tag = on the first day; besichtigen = to visit (a place); die Sehenswürdigkeiten = the sights.', lv: 4 },
]

const HOLIDAY_TASKS: Task[] = [
  {
    prompt: 'Write 4-5 sentences in German about your last holiday: where you went, how you travelled, where you stayed, what you did, and your opinion. Use the past tense.',
    model: 'Letzten Sommer bin ich mit meiner Familie nach Spanien geflogen. Wir haben zwei Wochen in einem Hotel am Meer gewohnt. Jeden Tag bin ich im Meer geschwommen und wir haben Paella gegessen. Das Wetter war heiß und sonnig. Es hat viel Spaß gemacht!',
    checklist: ['Uses the perfect tense with sein for travel (bin ... gefahren / geflogen)', 'Uses the perfect tense with haben for other activities (haben ... gegessen)', 'Says how you travelled and where you stayed', 'Uses war for a description (Das Wetter war...)', 'Gives an opinion (Es hat Spaß gemacht / Es war toll)'],
    hint: 'Letzten Sommer bin ich ... gefahren. Wir haben ... gewohnt. Das Wetter war ... Es war ...',
  },
  {
    prompt: 'Describe your dream holiday in German in 3-4 sentences: where you would like to go, with whom, how you would travel and what you would do.',
    model: 'Ich möchte mit meiner besten Freundin nach Japan fliegen. Wir möchten in Tokio in einem Hotel wohnen. Wir möchten die Sehenswürdigkeiten besichtigen und viel Sushi essen. Das wäre toll!',
    checklist: ['Uses ich möchte with an infinitive at the end', 'Says where and with whom', 'Says how you would travel or where you would stay', 'Gives at least two activities'],
    hint: 'Ich möchte nach ... fliegen / fahren. Wir möchten ... (infinitive at the end).',
  },
]

// ------------------------------------------------------------------ generators

export const travelGenerators: ItemGenerator[] = [
  ...vocabGens('weather', 'vocab.weather', WEATHER, 'the weather'),
  ...gapGens('weather.gap', 'vocab.weather', WEATHER_GAPS, [2, 4], [3, 5]),
  meaningGen('weather.meaning', 'vocab.weather', [2, 5], WEATHER_MEANINGS, 'Find the time word first (gestern, heute, morgen), then the weather words.'),

  ...countryGens,

  ...vocabGens('hol', 'vocab.holidays', HOLIDAYS, 'holidays and transport'),
  ...gapGens('hol.gap', 'vocab.holidays', HOLIDAY_GAPS, [2, 4], [3, 5]),
  meaningGen('hol.meaning', 'vocab.holidays', [2, 5], HOLIDAY_MEANINGS, 'Is it the past (bin ... gefahren, haben ... verbracht), the present or the future (möchte, nächstes Jahr)?'),
  revealGen('hol.writing', 'vocab.holidays', [4, 5], HOLIDAY_TASKS),
]
