/** Free time: hobbies and sport, TV / film / music, technology and social media. */
import type { ItemGenerator } from '@/engine/registry'
import { gapGens, meaningGen, revealGen, vocabGens, type Gap, type Sent, type Task, type W } from './lib'

// ------------------------------------------------------------------ hobbies

const HOBBIES: W[] = [
  { de: 'Fußball spielen', en: 'to play football' },
  { de: 'Tennis spielen', en: 'to play tennis' },
  { de: 'Gitarre spielen', en: 'to play the guitar', tip: 'No word for "the" before an instrument: Ich spiele Gitarre.' },
  { de: 'Klavier spielen', en: 'to play the piano' },
  { de: 'Schach spielen', en: 'to play chess' },
  { de: 'Computerspiele spielen', en: 'to play computer games' },
  { de: 'schwimmen', en: 'to swim' },
  { de: 'reiten', en: 'to ride (a horse)', tip: 'reiten = to ride a horse; reisen = to travel.' },
  { de: 'tanzen', en: 'to dance' },
  { de: 'singen', en: 'to sing' },
  { de: 'lesen', en: 'to read' },
  { de: 'zeichnen', en: 'to draw' },
  { de: 'Rad fahren', en: 'to cycle', alt: ['Fahrrad fahren', 'radfahren'] },
  { de: 'Musik hören', en: 'to listen to music' },
  { de: 'fernsehen', en: 'to watch TV', tip: 'Literally "far-see".' },
  { de: 'ins Kino gehen', en: 'to go to the cinema' },
  { de: 'Freunde treffen', en: 'to meet friends' },
  { de: 'wandern', en: 'to go hiking', tip: 'wandern is walking in the countryside, not wandering about.' },
  { de: 'angeln', en: 'to go fishing' },
  { de: 'Ski fahren', en: 'to ski', alt: ['Skifahren'] },
  { de: 'kochen', en: 'to cook' },
]

const FREQUENCY: W[] = [
  { de: 'oft', en: 'often' },
  { de: 'manchmal', en: 'sometimes' },
  { de: 'nie', en: 'never' },
  { de: 'immer', en: 'always' },
  { de: 'selten', en: 'rarely' },
  { de: 'jeden Tag', en: 'every day' },
  { de: 'einmal pro Woche', en: 'once a week', alt: ['einmal in der Woche'] },
  { de: 'zweimal pro Woche', en: 'twice a week', alt: ['zweimal in der Woche'] },
  { de: 'am Wochenende', en: 'at the weekend' },
  { de: 'nach der Schule', en: 'after school' },
  { de: 'in meiner Freizeit', en: 'in my free time' },
]

const HOBBY_GAPS: Gap[] = [
  { de: 'Ich ___ gern Fußball.', answer: 'spiele', wrong: ['fahre', 'gehe', 'höre'], en: 'I like playing football.', why: 'Sports with a ball and instruments go with spielen.' },
  { de: 'Am Wochenende ___ ich Rad.', answer: 'fahre', wrong: [{ label: 'spiele', misconception: 'spielen-fahren', feedback: 'You do not "play" a bike: Rad fahren, Ski fahren.' }, 'gehe', 'mache'], en: 'At the weekend I go cycling.', why: 'Rad fahren and Ski fahren use fahren. After Am Wochenende the verb comes second, before ich.' },
  { de: 'Ich ___ jeden Abend Musik.', answer: 'höre', wrong: ['sehe', 'fahre', 'gehe'], en: 'I listen to music every evening.', why: 'Musik hören = to listen to music.' },
  { de: 'Ich ___ oft ins Kino.', answer: 'gehe', wrong: ['spiele', 'mache', 'höre'], en: 'I often go to the cinema.', why: 'ins Kino gehen = to go to the cinema.' },
  { de: 'Mein Bruder ___ gern Klavier.', answer: 'spielt', wrong: ['fährt', 'geht', 'macht'], en: 'My brother likes playing the piano.', why: 'Instruments go with spielen: er spielt Klavier.' },
  { de: 'Im Winter fahre ich ___ in den Alpen.', answer: 'Ski', wrong: ['Tennis', 'Schach', 'Gitarre'], en: 'In winter I go skiing in the Alps.', why: 'Ski fahren = to ski.' },
  { de: 'Am Samstag treffe ich meine ___ in der Stadt.', answer: 'Freunde', wrong: ['Musik', 'Kino', 'Fußball'], en: 'On Saturday I meet my friends in town.', why: 'Freunde treffen = to meet friends.' },
  { de: 'Ich gehe nie ___, weil ich kein Wasser mag.', answer: 'schwimmen', wrong: ['reiten', 'tanzen', 'wandern'], en: 'I never go swimming because I do not like water.', why: 'schwimmen gehen = to go swimming.' },
  { de: 'Ich habe ein Pferd, also ___ ich oft.', answer: 'reite', wrong: [{ label: 'reise', misconception: 'reiten-reisen', feedback: 'reisen = to travel; reiten = to ride a horse.' }, 'tanze', 'koche'], en: 'I have a horse, so I often go riding.', why: 'reiten = to ride (a horse): ich reite.' },
  { de: 'Ich spiele ___ Tennis.', cue: 'never', answer: 'nie', wrong: ['oft', 'immer', 'manchmal'], en: 'I never play tennis.', why: 'nie = never.' },
  { de: 'Ich lese ___ Comics.', cue: 'sometimes', answer: 'manchmal', wrong: ['nie', 'immer', 'oft'], en: 'I sometimes read comics.', why: 'manchmal = sometimes.' },
  { de: 'Wir gehen ___ wandern.', cue: 'rarely', answer: 'selten', wrong: ['oft', 'immer', 'nie'], en: 'We rarely go hiking.', why: 'selten = rarely, not often.' },
  { de: 'Mia tanzt ___ pro Woche.', cue: 'twice', answer: 'zweimal', wrong: ['zweite', 'zwei', 'einmal'], en: 'Mia dances twice a week.', why: 'zweimal = twice (-mal = times): einmal, zweimal, dreimal.' },
]

const HOBBY_MEANINGS: Sent[] = [
  { de: 'Ich spiele seit drei Jahren Gitarre.', en: 'I have been playing the guitar for three years.', wrong: [{ label: 'I played the guitar three years ago.', misconception: 'seit', feedback: 'seit + present tense = have been doing something since / for.' }, 'I will play the guitar for three years.', 'I play the guitar every three years.'], why: 'seit drei Jahren = for three years (and still now), so English uses "have been playing".', lv: 4 },
  { de: 'Ich gehe lieber schwimmen als joggen.', en: 'I prefer swimming to jogging.', wrong: ['I prefer jogging to swimming.', 'I like swimming and jogging the same.', 'I never go swimming or jogging.'], why: 'lieber ... als = prefer ... to.', lv: 4 },
  { de: 'Am Wochenende treffe ich meine Freunde in der Stadt.', en: 'At the weekend I meet my friends in town.', wrong: ['During the week I meet my friends in town.', 'At the weekend I meet my friends at the station.', 'At the weekend I meet my family in town.'], why: 'am Wochenende = at the weekend; in der Stadt = in town.', lv: 2 },
  { de: 'Ich sehe selten fern, weil ich lieber lese.', en: 'I rarely watch TV because I prefer reading.', wrong: ['I often watch TV because I prefer reading.', 'I rarely watch TV because I do not like reading.', 'I never read because I prefer watching TV.'], why: 'selten = rarely; fernsehen = to watch TV; lieber = prefer.', lv: 3 },
  { de: 'Meine Schwester reitet zweimal pro Woche.', en: 'My sister goes riding twice a week.', wrong: [{ label: 'My sister travels twice a week.', misconception: 'reiten-reisen', feedback: 'reiten = to ride a horse; reisen = to travel.' }, 'My sister goes riding twice a month.', 'My sister goes riding every two weeks.'], why: 'reiten = to ride (a horse); zweimal pro Woche = twice a week.', lv: 2 },
  { de: 'In meiner Freizeit zeichne ich gern Comics.', en: 'In my free time I like drawing comics.', wrong: ['In my free time I like reading comics.', 'In my free time I do not like drawing comics.', 'In my free time I drew comics.'], why: 'zeichnen = to draw; gern = like doing.', lv: 3 },
  { de: 'Ich habe keine Zeit für Hobbys, weil ich so viele Hausaufgaben habe.', en: 'I have no time for hobbies because I have so much homework.', wrong: ['I have lots of time for hobbies because I have no homework.', 'I have no time for homework because I have so many hobbies.', 'I have no time for hobbies, but I have no homework.'], why: 'keine Zeit = no time; weil = because; Hausaufgaben = homework.', lv: 3 },
]

const HOBBY_TASKS: Task[] = [
  {
    prompt: 'Write 3-4 sentences in German about your free time: two hobbies, how often you do them, and an opinion with weil.',
    model: 'In meiner Freizeit spiele ich gern Hockey. Ich spiele zweimal pro Woche nach der Schule. Am Wochenende lese ich oft, weil ich Bücher spannend finde. Ich sehe nie fern, weil ich das langweilig finde.',
    checklist: ['Names two hobbies with the right verb (spielen, fahren, gehen...)', 'Says how often (oft, nie, zweimal pro Woche...)', 'Gives a reason with weil and the verb at the end', 'Starts a sentence with a time phrase and puts the verb second (Am Wochenende lese ich...)'],
    hint: 'In meiner Freizeit ... Ich ... oft / nie ... Am Wochenende ... ich ... , weil ich ... finde.',
  },
  {
    prompt: 'A German penfriend asks: "Was machst du gern in deiner Freizeit?" Reply in 3-4 sentences: what you like doing, what you do not like doing, and what you prefer (lieber).',
    model: 'Ich tanze sehr gern und ich höre jeden Tag Musik. Ich spiele nicht gern Fußball, weil ich nicht sehr sportlich bin. Ich gehe lieber ins Kino. Und du? Was machst du gern?',
    checklist: ['Says what you like doing with gern', 'Says what you do not like with nicht gern', 'Uses lieber for a preference', 'Gives a reason (weil...)', 'Asks a question back (Und du?)'],
    hint: 'Ich ... gern ... Ich ... nicht gern ... Ich ... lieber ...',
  },
]

// ------------------------------------------------------------------ TV, film and music

const MEDIA: W[] = [
  { de: 'Film', en: 'film', g: 'der' },
  { de: 'Komödie', en: 'comedy', g: 'die' },
  { de: 'Actionfilm', en: 'action film', g: 'der' },
  { de: 'Horrorfilm', en: 'horror film', g: 'der' },
  { de: 'Zeichentrickfilm', en: 'cartoon (animated film)', g: 'der' },
  { de: 'Liebesfilm', en: 'romantic film', g: 'der' },
  { de: 'Dokumentarfilm', en: 'documentary', g: 'der' },
  { de: 'Krimi', en: 'crime drama / detective story', g: 'der' },
  { de: 'Serie', en: 'series', g: 'die' },
  { de: 'Sendung', en: 'programme (on TV)', g: 'die' },
  { de: 'Seifenoper', en: 'soap opera', g: 'die' },
  { de: 'Quizsendung', en: 'quiz show', g: 'die' },
  { de: 'Nachrichten', en: 'the news', g: 'pl', tip: 'die Nachrichten (plural) = the news; die Nachricht = a message.' },
  { de: 'Werbung', en: 'adverts', g: 'die' },
  { de: 'Lied', en: 'song', g: 'das' },
  { de: 'Sänger', en: 'singer (male)', g: 'der' },
  { de: 'Sängerin', en: 'singer (female)', g: 'die' },
  { de: 'Band', en: 'band', g: 'die' },
  { de: 'Konzert', en: 'concert', g: 'das' },
  { de: 'spannend', en: 'exciting' },
  { de: 'gruselig', en: 'scary' },
  { de: 'kindisch', en: 'childish' },
  { de: 'informativ', en: 'informative' },
]

const MEDIA_GAPS: Gap[] = [
  { de: 'Ich lache gern, deshalb sehe ich gern ___.', answer: 'Komödien', wrong: ['Horrorfilme', 'Nachrichten', 'Krimis'], en: 'I like laughing, so I like watching comedies.', why: 'die Komödie = comedy; plural die Komödien.' },
  { de: '___ sind mir zu gruselig. Ich habe Angst!', answer: 'Horrorfilme', wrong: ['Komödien', 'Liebesfilme', 'Zeichentrickfilme'], en: 'Horror films are too scary for me. I am frightened!', why: 'der Horrorfilm, plural die Horrorfilme; gruselig = scary.' },
  { de: 'Ich will wissen, was in der Welt passiert. Deshalb sehe ich jeden Abend die ___.', answer: 'Nachrichten', wrong: ['Werbung', 'Seifenoper', 'Komödie'], en: 'I want to know what is happening in the world. So I watch the news every evening.', why: 'die Nachrichten = the news.' },
  { de: 'In einem ___ gibt es oft einen Detektiv und ein Verbrechen.', answer: 'Krimi', wrong: ['Liebesfilm', 'Zeichentrickfilm', 'Dokumentarfilm'], en: 'In a crime drama there is often a detective and a crime.', why: 'der Krimi = crime drama or detective story.' },
  { de: 'Ich finde Zeichentrickfilme ___, weil sie für kleine Kinder sind.', answer: 'kindisch', wrong: ['spannend', 'gruselig', 'informativ'], en: 'I find cartoons childish because they are for small children.', why: 'kindisch = childish.' },
  { de: 'Gestern Abend waren wir auf einem ___ und die Band war super.', answer: 'Konzert', wrong: ['Lied', 'Film', 'Krimi'], en: 'Yesterday evening we were at a concert and the band was great.', why: 'das Konzert = concert.' },
  { de: 'Dokumentarfilme finde ich ___, weil ich viel lerne.', answer: 'informativ', wrong: ['kindisch', 'gruselig', 'lustig'], en: 'I find documentaries informative because I learn a lot.', why: 'informativ = informative.' },
]

const MEDIA_MEANINGS: Sent[] = [
  { de: 'Ich sehe jeden Abend meine Lieblingsserie.', en: 'I watch my favourite series every evening.', wrong: ['I watched my favourite series yesterday evening.', 'I watch my favourite film every evening.', 'I never watch my favourite series in the evening.'], why: 'Lieblings- = favourite; die Serie = series; jeden Abend = every evening.', lv: 2 },
  { de: 'Horrorfilme finde ich spannend, aber meine Schwester findet sie zu gruselig.', en: 'I find horror films exciting, but my sister finds them too scary.', wrong: [{ label: 'I find horror films too scary, but my sister finds them exciting.', misconception: 'object-first', feedback: 'The sentence starts with the object (Horrorfilme); ich is still the one who finds them exciting.' }, 'I find horror films boring, but my sister finds them too scary.', 'Horror films are exciting, and my sister likes them too.'], why: 'German can start with the object: Horrorfilme finde ich spannend = I find horror films exciting.', lv: 4 },
  { de: 'Ich höre lieber Rapmusik als Popmusik.', en: 'I prefer rap music to pop music.', wrong: ['I prefer pop music to rap music.', 'I like rap music and pop music the same.', 'I never listen to rap music or pop music.'], why: 'lieber ... als = prefer ... to.', lv: 3 },
  { de: 'Wir haben gestern einen Liebesfilm im Kino gesehen.', en: 'We saw a romantic film at the cinema yesterday.', wrong: [{ label: 'We are going to see a romantic film at the cinema tomorrow.', misconception: 'tense', feedback: 'haben ... gesehen is the past (perfect tense), and gestern = yesterday.' }, 'We saw a horror film at the cinema yesterday.', 'We watched a romantic film at home yesterday.'], why: 'haben ... gesehen = saw; gestern = yesterday; der Liebesfilm = romantic film.', lv: 4 },
  { de: 'Die Nachrichten sind informativ, aber manchmal ein bisschen langweilig.', en: 'The news is informative, but sometimes a bit boring.', wrong: ['The news is boring, but sometimes a bit informative.', 'The messages are informative, but sometimes a bit boring.', 'The news is informative and never boring.'], why: 'die Nachrichten = the news; manchmal = sometimes; langweilig = boring.', lv: 3 },
  { de: 'Die Werbung im Fernsehen nervt mich.', en: 'The adverts on TV annoy me.', wrong: ['The adverts on TV make me laugh.', 'The news on TV annoys me.', 'I like the adverts on TV.'], why: 'die Werbung = adverts; nerven = to annoy.', lv: 3 },
]

// ------------------------------------------------------------------ technology

const TECH: W[] = [
  { de: 'Handy', en: 'mobile phone', g: 'das', tip: 'Germans call a mobile phone das Handy.' },
  { de: 'Computer', en: 'computer', g: 'der' },
  { de: 'Tablet', en: 'tablet', g: 'das' },
  { de: 'Internet', en: 'internet', g: 'das' },
  { de: 'App', en: 'app', g: 'die' },
  { de: 'Webseite', en: 'website', g: 'die', alt: ['Website'] },
  { de: 'Passwort', en: 'password', g: 'das' },
  { de: 'E-Mail', en: 'email', g: 'die', alt: ['Email', 'Mail'] },
  { de: 'Nachricht', en: 'message', g: 'die' },
  { de: 'Bildschirm', en: 'screen', g: 'der' },
  { de: 'Tastatur', en: 'keyboard', g: 'die' },
  { de: 'Foto', en: 'photo', g: 'das' },
  { de: 'Spielkonsole', en: 'games console', g: 'die' },
  { de: 'Ladegerät', en: 'charger', g: 'das' },
  { de: 'soziale Netzwerke', en: 'social networks' },
  { de: 'herunterladen', en: 'to download', tip: 'herunter = down, hoch = up: herunterladen / hochladen.' },
  { de: 'hochladen', en: 'to upload' },
  { de: 'chatten', en: 'to chat (online)' },
  { de: 'teilen', en: 'to share' },
  { de: 'im Internet surfen', en: 'to surf the internet' },
]

const TECH_GAPS: Gap[] = [
  { de: 'Ich schicke meiner Freundin eine ___.', answer: 'Nachricht', wrong: ['Tastatur', 'Bildschirm', 'Passwort'], en: 'I send my friend a message.', why: 'die Nachricht = message.' },
  { de: 'Mein ___ ist immer in meiner Tasche.', answer: 'Handy', wrong: ['Computer', 'Bildschirm', 'Internet'], en: 'My mobile phone is always in my pocket.', why: 'das Handy = mobile phone.' },
  { de: 'Man sollte sein ___ nie mit anderen teilen.', answer: 'Passwort', wrong: ['Ladegerät', 'Tablet', 'Internet'], en: 'You should never share your password with other people.', why: 'das Passwort = password.' },
  { de: 'Ich will die neue App ___.', answer: 'herunterladen', wrong: [{ label: 'hochladen', misconception: 'hoch-herunter', feedback: 'hoch = up (you upload your own photos); herunter = down (you download an app).' }, 'chatten', 'surfen'], en: 'I want to download the new app.', why: 'herunterladen = to download (herunter = down).' },
  { de: 'Mein Akku ist leer. Wo ist mein ___?', answer: 'Ladegerät', wrong: ['Passwort', 'Bildschirm', 'Foto'], en: 'My battery is flat. Where is my charger?', why: 'das Ladegerät = charger (laden = to load or charge).' },
  { de: 'Ich tippe meine Hausaufgaben auf der ___.', answer: 'Tastatur', wrong: ['Webseite', 'Nachricht', 'App'], en: 'I type my homework on the keyboard.', why: 'die Tastatur = keyboard.' },
  { de: 'Am Abend spielen mein Bruder und ich an der ___.', answer: 'Spielkonsole', wrong: ['Webseite', 'Nachricht', 'E-Mail'], en: 'In the evening my brother and I play on the games console.', why: 'die Spielkonsole = games console.' },
  { de: 'Ich habe ein Video von meinem Hund ___.', answer: 'hochgeladen', wrong: [{ label: 'heruntergeladen', misconception: 'hoch-herunter', feedback: 'You put your own video online: hochladen (up).' }, 'gechattet', 'gesurft'], en: 'I have uploaded a video of my dog.', why: 'hochladen = to upload; past participle hochgeladen.', typed: false },
]

const TECH_MEANINGS: Sent[] = [
  { de: 'Ich verbringe zu viel Zeit am Handy.', en: 'I spend too much time on my phone.', wrong: ['I spend too little time on my phone.', 'I spend too much money on my phone.', 'I spend too much time on the computer.'], why: 'verbringen = to spend (time); zu viel = too much; das Handy = mobile phone.', lv: 2 },
  { de: 'Soziale Netzwerke sind praktisch, aber man muss vorsichtig sein.', en: 'Social networks are useful, but you have to be careful.', wrong: ['Social networks are dangerous, so you must not use them.', 'Social networks are useful and you do not have to be careful.', 'Social networks are useful, but you have to be quick.'], why: 'praktisch = practical / useful; man muss = you have to; vorsichtig = careful.', lv: 4 },
  { de: 'Man sollte keine persönlichen Informationen online posten.', en: 'You should not post personal information online.', wrong: ['You should post personal information online.', 'You should not post photos online.', 'Nobody posts personal information online.'], why: 'man sollte keine ... = you should not ... any; posten = to post.', lv: 4 },
  { de: 'Ich chatte jeden Abend mit meinen Freunden.', en: 'I chat with my friends every evening.', wrong: ['I chat with my friends every morning.', 'I chatted with my friends last night.', 'I chat with my brothers every evening.'], why: 'chatten = to chat; jeden Abend = every evening.', lv: 2 },
  { de: 'Ohne mein Handy kann ich nicht leben!', en: 'I can\'t live without my phone!', wrong: ['I can live without my phone!', 'I can\'t live with my phone!', 'I don\'t want to live without my phone!'], why: 'ohne = without; kann ... nicht = can\'t.', lv: 3 },
  { de: 'Cybermobbing ist ein großes Problem an vielen Schulen.', en: 'Cyberbullying is a big problem at many schools.', wrong: ['Cyberbullying is a small problem at many schools.', 'Cyberbullying is a big problem at our school.', 'Cyberbullying is not a problem at many schools.'], why: 'Cybermobbing = cyberbullying; groß = big; vielen Schulen = many schools.', lv: 3 },
  { de: 'Mit meinem Handy kann ich Musik hören, Fotos machen und Videos sehen.', en: 'With my phone I can listen to music, take photos and watch videos.', wrong: ['With my phone I can listen to music, take photos and make videos.', 'With my tablet I can listen to music, take photos and watch videos.', 'With my phone I must listen to music, take photos and watch videos.'], why: 'Fotos machen = to take photos; Videos sehen = to watch videos; kann = can.', lv: 3 },
]

const TECH_TASKS: Task[] = [
  {
    prompt: 'Write 3-4 sentences in German about how you use technology: what you use, what for, how often, and one advantage or disadvantage.',
    model: 'Ich habe ein Handy und ein Tablet. Ich chatte jeden Tag auf meinem Handy mit meinen Freunden. Am Wochenende sehe ich Videos auf meinem Tablet. Soziale Netzwerke sind praktisch, aber man muss vorsichtig sein.',
    checklist: ['Names at least two devices or apps with the right gender (ein Handy, ein Tablet)', 'Says how often (jeden Tag, am Wochenende)', 'Says what you use it for (chatten, Videos sehen...)', 'Gives an advantage or disadvantage (praktisch, gefährlich, aber...)'],
    hint: 'Ich habe ... Ich benutze ... jeden Tag ... Soziale Netzwerke sind ..., aber ...',
  },
  {
    prompt: 'Write 3 tips in German for staying safe online. Use "Man sollte..." or "Man sollte nicht / kein..." with the infinitive at the end.',
    model: 'Man sollte sein Passwort nie teilen. Man sollte keine persönlichen Informationen posten. Man sollte nicht zu viel Zeit am Handy verbringen.',
    checklist: ['Writes three tips', 'Uses Man sollte with an infinitive at the end', 'Uses nicht, nie or kein at least once', 'Uses technology words correctly (Passwort, Handy, posten...)'],
    hint: 'Man sollte ... (infinitive at the end). Man sollte nie ... / keine ...',
  },
]

// ------------------------------------------------------------------ generators

export const freeTimeGenerators: ItemGenerator[] = [
  ...vocabGens('hobby', 'vocab.hobbies', HOBBIES, 'hobbies and sport'),
  ...vocabGens('freq', 'vocab.hobbies', FREQUENCY, 'how often'),
  ...gapGens('hobby.gap', 'vocab.hobbies', HOBBY_GAPS, [2, 4], [3, 5]),
  meaningGen('hobby.meaning', 'vocab.hobbies', [2, 5], HOBBY_MEANINGS, 'Find the verb and the time words (seit, oft, nie, am Wochenende) first.'),
  revealGen('hobby.writing', 'vocab.hobbies', [4, 5], HOBBY_TASKS),

  ...vocabGens('media', 'vocab.media', MEDIA, 'TV, film and music'),
  ...gapGens('media.gap', 'vocab.media', MEDIA_GAPS, [2, 4], [3, 5]),
  meaningGen('media.meaning', 'vocab.media', [2, 5], MEDIA_MEANINGS, 'Who finds what? Find the verb, then the person who goes with it.'),

  ...vocabGens('tech', 'vocab.technology', TECH, 'technology and social media'),
  ...gapGens('tech.gap', 'vocab.technology', TECH_GAPS, [2, 4], [3, 5]),
  meaningGen('tech.meaning', 'vocab.technology', [2, 5], TECH_MEANINGS, 'Look for small words that change the meaning: nicht, kein, ohne, zu viel.'),
  revealGen('tech.writing', 'vocab.technology', [4, 5], TECH_TASKS),
]
