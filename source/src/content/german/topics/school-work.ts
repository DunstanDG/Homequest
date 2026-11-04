/** School subjects and the school day; jobs and future plans. */
import type { ItemGenerator } from '@/engine/registry'
import { choice, textItem } from '../../kit'
import { G, accepts, gapGens, join, keyboardTip, meaningGen, pickN, q, revealGen, vocabGens, type Gap, type Sent, type Task, type W, type Wrong } from './lib'

// ------------------------------------------------------------------ school

const SUBJECTS: W[] = [
  { de: 'Mathe', en: 'maths', alt: ['Mathematik'] },
  { de: 'Deutsch', en: 'German' },
  { de: 'Englisch', en: 'English' },
  { de: 'Französisch', en: 'French' },
  { de: 'Spanisch', en: 'Spanish' },
  { de: 'Geschichte', en: 'history', tip: 'die Geschichte also means "story".' },
  { de: 'Erdkunde', en: 'geography', alt: ['Geografie', 'Geographie'], tip: 'Erde = earth, Kunde = knowledge.' },
  { de: 'Biologie', en: 'biology', alt: ['Bio'] },
  { de: 'Chemie', en: 'chemistry' },
  { de: 'Physik', en: 'physics' },
  { de: 'Kunst', en: 'art' },
  { de: 'Musik', en: 'music' },
  { de: 'Sport', en: 'PE', tip: 'Sport is both "sport" and the school subject PE.' },
  { de: 'Informatik', en: 'computing' },
  { de: 'Religion', en: 'RE (religious education)', alt: ['Reli'] },
  { de: 'Theater', en: 'drama', alt: ['Drama'] },
]

const SCHOOL_DAY: W[] = [
  { de: 'Fach', en: 'subject', g: 'das' },
  { de: 'Lieblingsfach', en: 'favourite subject', g: 'das' },
  { de: 'Stunde', en: 'lesson', g: 'die', tip: 'die Stunde means both "hour" and "lesson".' },
  { de: 'Stundenplan', en: 'timetable', g: 'der' },
  { de: 'Pause', en: 'break', g: 'die' },
  { de: 'Mittagspause', en: 'lunch break', g: 'die' },
  { de: 'Hausaufgaben', en: 'homework', g: 'pl', tip: 'German uses the plural: die Hausaufgaben.' },
  { de: 'Note', en: 'mark (grade)', g: 'die' },
  { de: 'Klassenarbeit', en: 'test (in class)', g: 'die' },
  { de: 'Kantine', en: 'canteen', g: 'die', alt: ['Mensa'] },
  { de: 'Bibliothek', en: 'library', g: 'die', tip: 'A false friend: a bookshop is die Buchhandlung.' },
  { de: 'interessant', en: 'interesting' },
  { de: 'langweilig', en: 'boring' },
  { de: 'einfach', en: 'easy', alt: ['leicht'] },
  { de: 'schwierig', en: 'difficult', alt: ['schwer'] },
  { de: 'nützlich', en: 'useful' },
  { de: 'nutzlos', en: 'useless' },
  { de: 'anstrengend', en: 'tiring' },
]

const SCHOOL_GAPS: Gap[] = [
  { de: 'Ich finde Mathe ___, weil ich gut mit Zahlen bin.', answer: 'einfach', alt: ['leicht'], wrong: ['schwierig', 'langweilig', 'nutzlos'], en: 'I find maths easy because I am good with numbers.', why: 'einfach (or leicht) = easy.' },
  { de: 'Ich finde Physik sehr ___. Ich verstehe nichts!', answer: 'schwierig', alt: ['schwer'], wrong: ['einfach', 'nützlich', 'toll'], en: 'I find physics very difficult. I do not understand anything!', why: 'schwierig (or schwer) = difficult.' },
  { de: 'Mein ___ ist Kunst, weil ich gern zeichne.', answer: 'Lieblingsfach', wrong: ['Stundenplan', 'Pause', 'Note'], en: 'My favourite subject is art because I like drawing.', why: 'das Lieblingsfach = favourite subject (Lieblings- = favourite, das Fach = subject).' },
  { de: 'In ___ lernen wir über die Vergangenheit.', answer: 'Geschichte', wrong: ['Erdkunde', 'Chemie', 'Informatik'], en: 'In history we learn about the past.', why: 'Geschichte = history (and story).' },
  { de: 'In ___ lernen wir über Länder, Flüsse und Berge.', answer: 'Erdkunde', wrong: [{ label: 'Geschichte', misconception: 'subject-names', feedback: 'Geschichte is history. Countries, rivers and mountains are Erdkunde (geography).' }, 'Physik', 'Kunst'], en: 'In geography we learn about countries, rivers and mountains.', why: 'Erdkunde = geography (Erde = earth).' },
  { de: 'In ___ lernen wir programmieren.', answer: 'Informatik', wrong: ['Kunst', 'Erdkunde', 'Religion'], en: 'In computing we learn to program.', why: 'Informatik = computing.' },
  { de: 'In ___ spielen wir Basketball und Hockey.', answer: 'Sport', wrong: ['Musik', 'Theater', 'Mathe'], en: 'In PE we play basketball and hockey.', why: 'Sport = PE.' },
  { de: 'Die Schule beginnt um acht Uhr und die erste ___ ist Englisch.', answer: 'Stunde', wrong: ['Pause', 'Note', 'Kantine'], en: 'School starts at eight o\'clock and the first lesson is English.', why: 'die Stunde = lesson (or hour).' },
  { de: 'In der ___ essen wir in der Kantine.', answer: 'Mittagspause', wrong: ['Stunde', 'Klassenarbeit', 'Note'], en: 'In the lunch break we eat in the canteen.', why: 'die Mittagspause = lunch break.' },
  { de: 'Ich mache meine ___ nach der Schule.', answer: 'Hausaufgaben', wrong: ['Pause', 'Stundenplan', 'Kantine'], en: 'I do my homework after school.', why: 'die Hausaufgaben = homework (plural in German).' },
  { de: 'Spanisch ist sehr ___, weil man es in vielen Ländern spricht.', answer: 'nützlich', wrong: [{ label: 'nutzlos', misconception: 'los-suffix', feedback: '-los means "without": nutzlos = useless.' }, 'langweilig', 'anstrengend'], en: 'Spanish is very useful because it is spoken in lots of countries.', why: 'nützlich = useful.' },
  { de: 'Morgen schreiben wir eine ___ in Mathe. Ich muss lernen!', answer: 'Klassenarbeit', wrong: ['Pause', 'Bibliothek', 'Kantine'], en: 'Tomorrow we are doing a test in maths. I must revise!', why: 'die Klassenarbeit = a test in class.' },
]

const SCHOOL_MEANINGS: Sent[] = [
  { de: 'Ich habe am Montag zwei Stunden Mathe.', en: 'I have two maths lessons on Monday.', wrong: ['I have two maths lessons on Sunday.', 'I have twelve maths lessons on Monday.', 'I have maths for two days on Monday.'], why: 'am Montag = on Monday; die Stunde = lesson (or hour).', lv: 2 },
  { de: 'Mein Lieblingsfach ist Geschichte, weil die Lehrerin so lustig ist.', en: 'My favourite subject is history because the teacher is so funny.', wrong: ['History is my worst subject because the teacher is so funny.', 'My favourite subject is geography because the teacher is so funny.', 'My favourite subject is history because the teacher is so strict.'], why: 'Lieblingsfach = favourite subject; Geschichte = history; lustig = funny.', lv: 3 },
  { de: 'Ich mag Chemie nicht, weil wir zu viele Hausaufgaben bekommen.', en: 'I don\'t like chemistry because we get too much homework.', wrong: [{ label: 'I don\'t like chemistry because we become too much homework.', misconception: 'false-friend', feedback: 'bekommen is a false friend: it means "to get", not "to become".' }, 'I like chemistry because we get lots of homework.', 'I don\'t like physics because we get too much homework.'], why: 'bekommen = to get (a false friend); zu viele = too many / too much.', lv: 4 },
  { de: 'Die Pause dauert zwanzig Minuten.', en: 'Break lasts twenty minutes.', wrong: ['Break lasts twelve minutes.', 'The lesson lasts twenty minutes.', 'Break starts at twenty past.'], why: 'die Pause = break; dauern = to last.', lv: 2 },
  { de: 'In Deutschland tragen die meisten Schüler keine Uniform.', en: 'In Germany most pupils don\'t wear a uniform.', wrong: ['In Germany most pupils wear a uniform.', 'In Germany no pupils at all wear a uniform.', 'In Germany most teachers don\'t wear a uniform.'], why: 'die meisten = most; keine Uniform = no uniform; tragen = to wear.', lv: 3 },
  { de: 'Ich bekomme gute Noten in Englisch, aber Französisch fällt mir schwer.', en: 'I get good marks in English, but I find French hard.', wrong: ['I get good marks in French, but I find English hard.', 'I get bad marks in English, but I find French easy.', 'I get good marks in English and I find French easy.'], why: 'Noten = marks; fällt mir schwer = I find it hard.', lv: 5 },
  { de: 'Nach der Mittagspause haben wir noch zwei Stunden.', en: 'After the lunch break we have two more lessons.', wrong: ['Before the lunch break we have two more lessons.', 'After the lunch break we have two hours off.', 'After the lunch break we have twelve more lessons.'], why: 'nach = after; noch zwei Stunden = two more lessons.', lv: 3 },
]

const SCHOOL_TASKS: Task[] = [
  {
    prompt: 'Write 4 sentences in German about your school subjects: your favourite subject and why, a subject you do not like and why, and what time school starts.',
    model: 'Mein Lieblingsfach ist Kunst, weil ich gern zeichne. Ich finde Mathe nicht so gut, weil es schwierig ist. Ich habe am Montag zwei Stunden Deutsch. Die Schule beginnt um Viertel vor neun.',
    checklist: ['Names a favourite subject (Mein Lieblingsfach ist...)', 'Gives opinions with adjectives (interessant, schwierig...)', 'Uses weil with the verb at the end', 'Gives a time correctly (um ... Uhr / um halb...)'],
    hint: 'Mein Lieblingsfach ist ..., weil ... Ich finde ... , weil ... Die Schule beginnt um ...',
  },
  {
    prompt: 'Describe your school day in German in 3-4 sentences: when it starts, how many lessons you have, what you do at break and lunchtime, and when it ends.',
    model: 'Die Schule beginnt um halb neun. Wir haben jeden Tag fünf Stunden. In der Pause esse ich ein Brötchen und rede mit meinen Freunden. In der Mittagspause esse ich in der Kantine. Die Schule ist um Viertel nach drei aus.',
    checklist: ['Says when school starts and ends', 'Says how many lessons (Stunden) there are', 'Says what you do at break or lunchtime', 'Puts the verb second after a time phrase (In der Pause esse ich...)'],
    hint: 'Die Schule beginnt um ... Wir haben ... Stunden. In der Pause ... ich ...',
  },
]

// ------------------------------------------------------------------ jobs

interface Job {
  m: string
  f: string
  en: string
  /** A first-person description of the job. */
  desc: string
  /** Jobs in the same group are never used as distractors for each other (a nurse and a doctor both work in hospitals). */
  group: string
}

const JOBS: Job[] = [
  { m: 'Arzt', f: 'Ärztin', en: 'doctor', desc: 'Wenn Menschen krank sind, kommen sie zu mir in die Praxis.', group: 'health' },
  { m: 'Krankenpfleger', f: 'Krankenpflegerin', en: 'nurse', desc: 'Ich arbeite im Krankenhaus und kümmere mich um die Patienten.', group: 'health' },
  { m: 'Tierarzt', f: 'Tierärztin', en: 'vet', desc: 'Ich helfe kranken Tieren.', group: 'health' },
  { m: 'Zahnarzt', f: 'Zahnärztin', en: 'dentist', desc: 'Ich kümmere mich um die Zähne meiner Patienten.', group: 'health' },
  { m: 'Polizist', f: 'Polizistin', en: 'police officer', desc: 'Ich trage eine Uniform und komme, wenn es ein Verbrechen gibt.', group: 'safety' },
  { m: 'Feuerwehrmann', f: 'Feuerwehrfrau', en: 'firefighter', desc: 'Ich lösche Brände und rette Menschen.', group: 'safety' },
  { m: 'Koch', f: 'Köchin', en: 'cook', desc: 'Ich koche jeden Tag in einem Restaurant.', group: 'food' },
  { m: 'Bäcker', f: 'Bäckerin', en: 'baker', desc: 'Ich stehe sehr früh auf und backe Brot und Brötchen.', group: 'food' },
  { m: 'Kellner', f: 'Kellnerin', en: 'waiter', desc: 'Ich bringe den Gästen im Restaurant das Essen.', group: 'food' },
  { m: 'Friseur', f: 'Friseurin', en: 'hairdresser', desc: 'Ich schneide und wasche Haare.', group: 'hair' },
  { m: 'Verkäufer', f: 'Verkäuferin', en: 'shop assistant', desc: 'Ich arbeite in einem Kleidergeschäft und helfe den Kunden.', group: 'shop' },
  { m: 'Mechaniker', f: 'Mechanikerin', en: 'mechanic', desc: 'Ich repariere Autos in einer Werkstatt.', group: 'tech' },
  { m: 'Ingenieur', f: 'Ingenieurin', en: 'engineer', desc: 'Ich plane Brücken und Maschinen.', group: 'tech' },
  { m: 'Programmierer', f: 'Programmiererin', en: 'programmer', desc: 'Ich schreibe Software und Apps.', group: 'tech' },
  { m: 'Journalist', f: 'Journalistin', en: 'journalist', desc: 'Ich schreibe Artikel für eine Zeitung.', group: 'media' },
  { m: 'Schauspieler', f: 'Schauspielerin', en: 'actor', desc: 'Ich spiele in Filmen und im Theater.', group: 'media' },
  { m: 'Pilot', f: 'Pilotin', en: 'pilot', desc: 'Ich fliege Flugzeuge.', group: 'pilot' },
  { m: 'Bauer', f: 'Bäuerin', en: 'farmer', desc: 'Ich arbeite auf einem Bauernhof mit Kühen und Schweinen.', group: 'farm' },
  { m: 'Lehrer', f: 'Lehrerin', en: 'teacher', desc: 'Ich arbeite in einer Schule und unterrichte Mathe.', group: 'school' },
]

const JOB_WORDS: W[] = JOBS.flatMap((j) => [
  { de: j.m, en: `${j.en} (man)`, g: 'der' as const },
  { de: j.f, en: `${j.en} (woman)`, g: 'die' as const },
])

const stripUmlaut = (s: string) => s.replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u')
const FEMALE_RULE = 'Most female job names add -in to the male form (Lehrer -> Lehrerin), and some also add an umlaut (Arzt -> Ärztin, Koch -> Köchin). -mann becomes -frau (Feuerwehrmann -> Feuerwehrfrau).'
const NO_ARTICLE = 'In German you leave out "a" before a job: Sie ist Ärztin = She is a doctor.'

const MEN = ['Lukas', 'Jonas', 'Ben', 'Paul', 'Felix', 'Leon']
const WOMEN = ['Mia', 'Emma', 'Lena', 'Hannah', 'Sophie', 'Lea']

const RELATIVES_F = [
  { de: 'Meine Mutter', en: 'My mother' },
  { de: 'Meine Tante', en: 'My aunt' },
  { de: 'Meine Schwester', en: 'My sister' },
  { de: 'Meine Oma', en: 'My grandma' },
]
const RELATIVES_M = [
  { de: 'Mein Vater', en: 'My father' },
  { de: 'Mein Onkel', en: 'My uncle' },
  { de: 'Mein Bruder', en: 'My brother' },
  { de: 'Mein Opa', en: 'My grandad' },
]

const jobGens: ItemGenerator[] = [
  ...vocabGens('jobs', 'vocab.jobs', JOB_WORDS, 'jobs'),

  G('top.jobs.female', 'vocab.jobs', [2, 4], (rng) => {
    const j = rng.pick(JOBS)
    const wrong: Wrong[] = []
    if (stripUmlaut(j.f) !== j.f) wrong.push({ label: `die ${stripUmlaut(j.f)}`, misconception: 'missing-umlaut', feedback: 'This one also gets an umlaut in the female form.' })
    if (j.m.endsWith('mann')) wrong.push({ label: `die ${j.m}in`, misconception: 'mann-frau', feedback: '-mann becomes -frau for a woman.' })
    wrong.push({ label: `die ${j.m}`, misconception: 'article-only', feedback: 'Changing der to die is not enough: the noun itself changes too.' })
    wrong.push(`die ${j.m}e`, `die ${j.m}erin`)
    return choice({
      rng,
      prompt: `${q(`der ${j.m}`)} is a male ${j.en}. What is the word for a female ${j.en}?`,
      correct: `die ${j.f}`,
      wrong: wrong.slice(0, 3),
      hint: 'Most jobs add a short ending for a woman. Check whether the vowel changes too.',
      explanation: `der ${j.m} -> die ${j.f}. ${FEMALE_RULE}`,
    })
  }),

  G('top.jobs.who', 'vocab.jobs', [2, 5], (rng, d) => {
    const j = rng.pick(JOBS)
    const woman = rng.chance(0.5)
    const name = rng.pick(woman ? WOMEN : MEN)
    const form = woman ? j.f : j.m
    const pool = JOBS.filter((x) => x.group !== j.group)
    if (d >= 4) {
      return textItem({
        prompt: `${name}: "${j.desc} Ich bin ___."  Type ${name}'s job in German.`,
        accept: accepts(form),
        placeholder: 'Type the job',
        hint: `${name} is a ${woman ? 'woman' : 'man'}, so use the ${woman ? 'female' : 'male'} form. No word for "a".`,
        explanation: join(`${name} ist ${form} (${j.en}).`, woman ? FEMALE_RULE : '', NO_ARTICLE, keyboardTip(form)),
      })
    }
    const others = pickN(rng, pool, 3).map((x) => (woman ? x.f : x.m))
    const wrong: Wrong[] =
      d >= 3
        ? [{ label: woman ? j.m : j.f, misconception: 'job-gender', feedback: `${name} is a ${woman ? 'woman' : 'man'}: use the ${woman ? 'female (-in)' : 'male'} form.` }, ...others.slice(0, 2)]
        : others
    return choice({
      rng,
      prompt: `${name}: "${j.desc} Ich bin ___."  What is ${name}'s job?`,
      correct: form,
      wrong,
      hint: 'Pick out the key words in the description first.',
      explanation: `${name} ist ${form} = ${name} is a${/^[aeiou]/.test(j.en) ? 'n' : ''} ${j.en}. ${NO_ARTICLE}`,
    })
  }),

  G('top.jobs.article', 'vocab.jobs', [3, 4], (rng) => {
    const j = rng.pick(JOBS)
    const woman = rng.chance(0.5)
    const p = rng.pick(woman ? RELATIVES_F : RELATIVES_M)
    const who = p.de
    const form = woman ? j.f : j.m
    const other = woman ? j.m : j.f
    return choice({
      rng,
      prompt: `How do you say: "${p.en} is a${/^[aeiou]/.test(j.en) ? 'n' : ''} ${j.en}"?`,
      correct: `${who} ist ${form}.`,
      wrong: [
        { label: `${who} ist ${woman ? 'eine' : 'ein'} ${form}.`, misconception: 'job-article', feedback: NO_ARTICLE },
        { label: `${who} ist ${other}.`, misconception: 'job-gender', feedback: woman ? 'For a woman use the female form (usually -in).' : 'For a man use the male form, without -in.' },
        `${who} ist ${woman ? 'ein' : 'eine'} ${other}.`,
      ],
      hint: 'Two things to check: the male or female form, and whether German needs "a".',
      explanation: `${who} ist ${form}. ${NO_ARTICLE}`,
    })
  }),
]

const JOB_MEANINGS: Sent[] = [
  { de: 'Ich möchte später Tierärztin werden, weil ich Tiere liebe.', en: 'Later I would like to become a vet because I love animals.', wrong: ['Later I would like to become a doctor because I love animals.', 'My mother is a vet because she loves animals.', 'I would never like to be a vet, although I love animals.'], why: 'ich möchte ... werden = I would like to become; Tierärztin = vet (woman).', lv: 3 },
  { de: 'Mein Vater ist Koch und arbeitet in einem Hotel.', en: 'My father is a cook and works in a hotel.', wrong: ['My father is a cook and works in a hospital.', 'My father cooks at home and works in a hotel.', 'My father is a waiter and works in a hotel.'], why: 'der Koch = cook; no "ein" before a job in German.', lv: 2 },
  { de: 'Ich will nicht in einem Büro arbeiten.', en: 'I don\'t want to work in an office.', wrong: [{ label: 'I will not work in an office.', misconception: 'will-want', feedback: 'ich will = I want (from wollen), not "I will".' }, 'I want to work in an office.', 'I don\'t want to work in a shop.'], why: 'ich will = I want (a false friend); das Büro = office.', lv: 4 },
  { de: 'Meine Schwester studiert Medizin an der Universität.', en: 'My sister is studying medicine at university.', wrong: ['My sister is studying music at university.', 'My sister works in a chemist\'s.', 'My sister wants to study medicine at university.'], why: 'studieren = to study (at university); Medizin = medicine.', lv: 3 },
  { de: 'In Zukunft werde ich viel Geld verdienen.', en: 'In the future I will earn a lot of money.', wrong: [{ label: 'In the future I want to earn a lot of money.', misconception: 'werden-wollen', feedback: 'werde + infinitive = will.' }, 'In the past I earned a lot of money.', 'In the future I will spend a lot of money.'], why: 'ich werde ... verdienen = I will earn; in Zukunft = in the future.', lv: 4 },
  { de: 'Ich interessiere mich für Technik, also möchte ich Ingenieurin werden.', en: 'I am interested in technology, so I would like to become an engineer.', wrong: ['I am interested in technology, but I would like to become a teacher.', 'I am not interested in technology, so I would like to become an engineer.', 'I am interested in technology, so I am an engineer.'], why: 'sich interessieren für = to be interested in; also = so (a false friend).', lv: 5 },
]

const JOB_TASKS: Task[] = [
  {
    prompt: 'Write 3-4 sentences in German about your future plans: what job you would like to do, why, and where you would like to work. Add one thing you do NOT want to do.',
    model: 'Später möchte ich Tierärztin werden, weil ich Tiere liebe. Ich möchte in einer Tierklinik auf dem Land arbeiten. Ich will nicht in einem Büro arbeiten, weil das langweilig ist. Ich werde Biologie an der Universität studieren.',
    checklist: ['Uses ich möchte ... werden with the job at the end', 'Uses the right form of the job with no "ein" (Ich möchte Tierärztin werden)', 'Gives a reason with weil, verb at the end', 'Says one thing you do not want to do (nicht / kein)', 'Uses a future time phrase (später, in Zukunft)'],
    hint: 'Später möchte ich ... werden, weil ... Ich möchte in ... arbeiten. Ich will nicht ...',
  },
]

// ------------------------------------------------------------------ generators

export const schoolWorkGenerators: ItemGenerator[] = [
  ...vocabGens('subj', 'vocab.subjects', SUBJECTS, 'school subjects'),
  ...vocabGens('schoolday', 'vocab.subjects', SCHOOL_DAY, 'the school day and opinions'),
  ...gapGens('subj.gap', 'vocab.subjects', SCHOOL_GAPS, [2, 4], [3, 5]),
  meaningGen('subj.meaning', 'vocab.subjects', [2, 5], SCHOOL_MEANINGS, 'Find the subject and the opinion word, and watch out for false friends like bekommen.'),
  revealGen('subj.writing', 'vocab.subjects', [4, 5], SCHOOL_TASKS),

  ...jobGens,
  meaningGen('jobs.meaning', 'vocab.jobs', [2, 5], JOB_MEANINGS, 'ich will = I want; ich werde = I will; ich möchte = I would like.'),
  revealGen('jobs.writing', 'vocab.jobs', [4, 5], JOB_TASKS),
]
