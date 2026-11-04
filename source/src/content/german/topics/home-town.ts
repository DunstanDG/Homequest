/** House and home; places in town; asking for and giving directions. */
import type { ItemGenerator } from '@/engine/registry'
import { choice } from '../../kit'
import { G, gapGens, meaningGen, revealGen, vocabGens, type Gap, type Sent, type Task, type W, type Wrong } from './lib'

// ------------------------------------------------------------------ home

const HOME: W[] = [
  { de: 'Haus', en: 'house', g: 'das' },
  { de: 'Wohnung', en: 'flat', g: 'die' },
  { de: 'Reihenhaus', en: 'terraced house', g: 'das' },
  { de: 'Zimmer', en: 'room', g: 'das' },
  { de: 'Schlafzimmer', en: 'bedroom', g: 'das', tip: 'Compound nouns take the gender of the last part: das Zimmer -> das Schlafzimmer.' },
  { de: 'Wohnzimmer', en: 'living room', g: 'das' },
  { de: 'Esszimmer', en: 'dining room', g: 'das' },
  { de: 'Badezimmer', en: 'bathroom', g: 'das', alt: ['Bad'] },
  { de: 'Küche', en: 'kitchen', g: 'die' },
  { de: 'Garten', en: 'garden', g: 'der' },
  { de: 'Keller', en: 'cellar', g: 'der' },
  { de: 'Garage', en: 'garage', g: 'die' },
  { de: 'Balkon', en: 'balcony', g: 'der' },
  { de: 'Bett', en: 'bed', g: 'das' },
  { de: 'Schrank', en: 'cupboard', g: 'der' },
  { de: 'Kleiderschrank', en: 'wardrobe', g: 'der' },
  { de: 'Stuhl', en: 'chair', g: 'der' },
  { de: 'Schreibtisch', en: 'desk', g: 'der' },
  { de: 'Sofa', en: 'sofa', g: 'das' },
  { de: 'Sessel', en: 'armchair', g: 'der' },
  { de: 'Teppich', en: 'carpet / rug', g: 'der' },
  { de: 'Lampe', en: 'lamp', g: 'die' },
  { de: 'Regal', en: 'shelf', g: 'das' },
  { de: 'Spiegel', en: 'mirror', g: 'der' },
  { de: 'Fenster', en: 'window', g: 'das' },
  { de: 'Tür', en: 'door', g: 'die' },
  { de: 'Kühlschrank', en: 'fridge', g: 'der', tip: 'kühl = cool + Schrank = cupboard.' },
  { de: 'Dusche', en: 'shower', g: 'die' },
  { de: 'Fernseher', en: 'television (set)', g: 'der' },
  { de: 'auf dem Land', en: 'in the countryside' },
  { de: 'am Stadtrand', en: 'on the outskirts of town' },
  { de: 'im Erdgeschoss', en: 'on the ground floor' },
]

const HOME_GAPS: Gap[] = [
  { de: 'Ich schlafe im ___.', answer: 'Schlafzimmer', wrong: ['Wohnzimmer', 'Badezimmer', 'Esszimmer'], en: 'I sleep in the bedroom.', why: 'schlafen = to sleep, so das Schlafzimmer = bedroom.' },
  { de: 'Wir kochen in der ___.', answer: 'Küche', wrong: ['Garage', 'Dusche', 'Lampe'], en: 'We cook in the kitchen.', why: 'die Küche = kitchen.' },
  { de: 'Meine Kleider sind im ___.', answer: 'Kleiderschrank', wrong: [{ label: 'Kühlschrank', misconception: 'schrank', feedback: 'der Kühlschrank is the fridge (kühl = cool). Clothes (Kleider) go in the Kleiderschrank.' }, 'Sessel', 'Spiegel'], en: 'My clothes are in the wardrobe.', why: 'Kleider = clothes + Schrank = cupboard: der Kleiderschrank = wardrobe.' },
  { de: 'Die Milch ist im ___.', answer: 'Kühlschrank', wrong: [{ label: 'Kleiderschrank', misconception: 'schrank', feedback: 'der Kleiderschrank is for clothes. Milk goes in the Kühlschrank (fridge).' }, 'Schreibtisch', 'Bett'], en: 'The milk is in the fridge.', why: 'der Kühlschrank = fridge.' },
  { de: 'Ich mache meine Hausaufgaben am ___.', answer: 'Schreibtisch', wrong: ['Kühlschrank', 'Spiegel', 'Teppich'], en: 'I do my homework at the desk.', why: 'schreiben = to write + Tisch = table: der Schreibtisch = desk.' },
  { de: 'Das Auto ist in der ___.', answer: 'Garage', wrong: ['Küche', 'Dusche', 'Lampe'], en: 'The car is in the garage.', why: 'die Garage = garage.' },
  { de: 'Ich dusche jeden Morgen im ___.', answer: 'Badezimmer', alt: ['Bad'], wrong: ['Esszimmer', 'Wohnzimmer', 'Garten'], en: 'I have a shower in the bathroom every morning.', why: 'das Badezimmer (das Bad) = bathroom.' },
  { de: 'Wir sehen abends im ___ fern.', answer: 'Wohnzimmer', wrong: ['Badezimmer', 'Keller', 'Garten'], en: 'In the evening we watch TV in the living room.', why: 'das Wohnzimmer = living room (wohnen = to live).' },
  { de: 'Ich wohne nicht in einem Haus, sondern in einer ___.', answer: 'Wohnung', wrong: ['Garage', 'Küche', 'Dusche'], en: 'I do not live in a house, but in a flat.', why: 'die Wohnung = flat (wohnen = to live).' },
  { de: 'Im ___ gibt es viele Blumen und einen Baum.', answer: 'Garten', wrong: ['Keller', 'Wohnzimmer', 'Kühlschrank'], en: 'In the garden there are lots of flowers and a tree.', why: 'der Garten = garden.' },
  { de: 'Ich sehe mich im ___ an.', answer: 'Spiegel', wrong: ['Schrank', 'Bett', 'Teppich'], en: 'I look at myself in the mirror.', why: 'der Spiegel = mirror.' },
]

const HOME_MEANINGS: Sent[] = [
  { de: 'Wir wohnen in einem Reihenhaus am Stadtrand.', en: 'We live in a terraced house on the outskirts of town.', wrong: ['We live in a terraced house in the town centre.', 'We live in a flat on the outskirts of town.', 'We live in a detached house in the countryside.'], why: 'das Reihenhaus = terraced house; am Stadtrand = on the outskirts of town.', lv: 3 },
  { de: 'Mein Schlafzimmer ist klein, aber ich muss es nicht teilen.', en: 'My bedroom is small, but I don\'t have to share it.', wrong: [{ label: 'My bedroom is small, but I must not share it.', misconception: 'muss-nicht', feedback: 'nicht müssen = not have to. "Must not" would be nicht dürfen.' }, 'My bedroom is big, but I have to share it.', 'My bedroom is small and I have to share it with my sister.'], why: 'ich muss nicht = I don\'t have to; teilen = to share.', lv: 5 },
  { de: 'In meinem Zimmer gibt es ein Bett, einen Schreibtisch und einen großen Kleiderschrank.', en: 'In my room there is a bed, a desk and a big wardrobe.', wrong: ['In my room there is a bed, a chair and a big wardrobe.', 'In my room there is a bed, a desk and a big fridge.', 'In my room there are two beds, a desk and a big wardrobe.'], why: 'es gibt = there is / are; der Schreibtisch = desk; der Kleiderschrank = wardrobe.', lv: 2 },
  { de: 'Die Küche ist im Erdgeschoss und die Schlafzimmer sind im ersten Stock.', en: 'The kitchen is on the ground floor and the bedrooms are on the first floor.', wrong: ['The kitchen is on the first floor and the bedrooms are on the ground floor.', 'The kitchen is in the cellar and the bedrooms are on the first floor.', 'The kitchen is on the ground floor and the bathroom is on the first floor.'], why: 'im Erdgeschoss = on the ground floor; im ersten Stock = on the first floor.', lv: 3 },
  { de: 'Ich hätte gern ein größeres Zimmer mit Balkon.', en: 'I would like a bigger room with a balcony.', wrong: ['I have a bigger room with a balcony.', 'I would like a smaller room with a balcony.', 'I would like a bigger room without a balcony.'], why: 'ich hätte gern = I would like; größer = bigger.', lv: 4 },
  { de: 'Es gibt keinen Garten, aber wir haben einen Balkon.', en: 'There is no garden, but we have a balcony.', wrong: ['There is a garden and we have a balcony.', 'There is no balcony, but we have a garden.', 'There is no garden and we have no balcony.'], why: 'es gibt keinen = there is no; aber = but.', lv: 2 },
  { de: 'Wir wohnen seit fünf Jahren auf dem Land.', en: 'We have been living in the countryside for five years.', wrong: [{ label: 'We lived in the countryside five years ago.', misconception: 'seit', feedback: 'seit + present tense = have been doing (and still are).' }, 'We have been living in the town for five years.', 'We will live in the countryside for five years.'], why: 'seit fünf Jahren = for five years (and still now); auf dem Land = in the countryside.', lv: 4 },
]

const HOME_TASKS: Task[] = [
  {
    prompt: 'Describe your bedroom in German in 3-4 sentences: what is in it, what colour things are, and what you think of it.',
    model: 'Mein Schlafzimmer ist ziemlich klein, aber ich finde es gemütlich. Es gibt ein Bett, einen Schreibtisch und einen Kleiderschrank. Die Wände sind hellblau und der Teppich ist grau. Ich muss mein Zimmer nicht teilen.',
    checklist: ['Uses es gibt + einen / eine / ein for furniture', 'Names at least three pieces of furniture correctly', 'Describes colours or size', 'Gives an opinion (Ich finde es...)'],
    hint: 'Mein Schlafzimmer ist ... Es gibt einen ..., eine ... und ein ... Ich finde es ...',
  },
  {
    prompt: 'Describe your home in German in 3-4 sentences: type of home, where it is, which rooms there are, and one thing you would like.',
    model: 'Ich wohne mit meiner Familie in einem Reihenhaus am Stadtrand. Im Erdgeschoss gibt es eine Küche, ein Wohnzimmer und ein Esszimmer. Im ersten Stock gibt es drei Schlafzimmer und ein Badezimmer. Ich hätte gern einen großen Garten.',
    checklist: ['Says the type of home (in einem Haus / in einer Wohnung)', 'Says where it is (in der Stadt, auf dem Land...)', 'Lists rooms with es gibt and the right article', 'Says what you would like (Ich hätte gern... / Ich möchte...)'],
    hint: 'Ich wohne in einem ... / einer ... Es gibt ... Ich hätte gern ...',
  },
]

// ------------------------------------------------------------------ town

const TOWN: W[] = [
  { de: 'Bahnhof', en: 'station', g: 'der' },
  { de: 'Bushaltestelle', en: 'bus stop', g: 'die' },
  { de: 'Bank', en: 'bank', g: 'die' },
  { de: 'Bäckerei', en: 'bakery', g: 'die' },
  { de: 'Metzgerei', en: 'butcher\'s', g: 'die' },
  { de: 'Apotheke', en: 'pharmacy (chemist\'s)', g: 'die' },
  { de: 'Buchhandlung', en: 'bookshop', g: 'die' },
  { de: 'Supermarkt', en: 'supermarket', g: 'der' },
  { de: 'Einkaufszentrum', en: 'shopping centre', g: 'das' },
  { de: 'Markt', en: 'market', g: 'der' },
  { de: 'Post', en: 'post office', g: 'die' },
  { de: 'Kirche', en: 'church', g: 'die' },
  { de: 'Dom', en: 'cathedral', g: 'der' },
  { de: 'Kino', en: 'cinema', g: 'das' },
  { de: 'Theater', en: 'theatre', g: 'das' },
  { de: 'Museum', en: 'museum', g: 'das' },
  { de: 'Schwimmbad', en: 'swimming pool', g: 'das' },
  { de: 'Sportzentrum', en: 'sports centre', g: 'das' },
  { de: 'Stadion', en: 'stadium', g: 'das' },
  { de: 'Park', en: 'park', g: 'der' },
  { de: 'Spielplatz', en: 'playground', g: 'der' },
  { de: 'Rathaus', en: 'town hall', g: 'das', tip: 'der Rat = the council (nothing to do with rats!).' },
  { de: 'Krankenhaus', en: 'hospital', g: 'das', tip: 'krank = ill + Haus = house.' },
  { de: 'Burg', en: 'castle', g: 'die' },
  { de: 'Fußgängerzone', en: 'pedestrian zone', g: 'die' },
  { de: 'Altstadt', en: 'old town', g: 'die' },
]

const TOWN_GAPS: Gap[] = [
  { de: 'Ich kaufe Brot in der ___.', answer: 'Bäckerei', wrong: [{ label: 'Metzgerei', misconception: 'shop-names', feedback: 'die Metzgerei sells meat and sausages. Bread comes from the Bäckerei.' }, 'Apotheke', 'Bank'], en: 'I buy bread at the bakery.', why: 'die Bäckerei = bakery (backen = to bake).' },
  { de: 'Ich sehe einen Film im ___.', answer: 'Kino', wrong: ['Schwimmbad', 'Rathaus', 'Krankenhaus'], en: 'I watch a film at the cinema.', why: 'das Kino = cinema.' },
  { de: 'Ich kaufe Medikamente in der ___.', answer: 'Apotheke', wrong: ['Bäckerei', 'Metzgerei', 'Kirche'], en: 'I buy medicine at the pharmacy.', why: 'die Apotheke = pharmacy (chemist\'s).' },
  { de: 'Der Zug fährt um zehn Uhr vom ___ ab.', answer: 'Bahnhof', wrong: ['Spielplatz', 'Supermarkt', 'Dom'], en: 'The train leaves the station at ten o\'clock.', why: 'der Bahnhof = station (die Bahn = railway).' },
  { de: 'Ich hole Geld von der ___.', answer: 'Bank', wrong: ['Kirche', 'Bäckerei', 'Metzgerei'], en: 'I get money from the bank.', why: 'die Bank = bank (also bench!).' },
  { de: 'Ich schicke ein Paket von der ___.', answer: 'Post', wrong: ['Bank', 'Kirche', 'Apotheke'], en: 'I send a parcel from the post office.', why: 'die Post = post office.' },
  { de: 'Ich schwimme gern im ___.', answer: 'Schwimmbad', wrong: ['Kino', 'Rathaus', 'Museum'], en: 'I like swimming at the swimming pool.', why: 'das Schwimmbad = swimming pool.' },
  { de: 'Wurst und Fleisch kauft man in der ___.', answer: 'Metzgerei', wrong: [{ label: 'Bäckerei', misconception: 'shop-names', feedback: 'die Bäckerei sells bread and cakes. Meat comes from the Metzgerei.' }, 'Apotheke', 'Buchhandlung'], en: 'You buy sausage and meat at the butcher\'s.', why: 'die Metzgerei = butcher\'s.' },
  { de: 'Kleine Kinder spielen auf dem ___.', answer: 'Spielplatz', wrong: ['Bahnhof', 'Supermarkt', 'Dom'], en: 'Small children play in the playground.', why: 'spielen = to play + Platz = place: der Spielplatz = playground.' },
  { de: 'Mein Opa ist krank. Er ist im ___.', answer: 'Krankenhaus', wrong: [{ label: 'Rathaus', misconception: 'rathaus', feedback: 'das Rathaus is the town hall. A hospital is das Krankenhaus (krank = ill).' }, 'Kino', 'Schwimmbad'], en: 'My grandad is ill. He is in hospital.', why: 'das Krankenhaus = hospital.' },
  { de: 'Ich warte an der ___ auf den Bus.', answer: 'Bushaltestelle', wrong: ['Bäckerei', 'Apotheke', 'Kirche'], en: 'I wait at the bus stop for the bus.', why: 'die Bushaltestelle = bus stop (halten = to stop).' },
  { de: 'Am Samstag sehen wir ein Fußballspiel im ___.', answer: 'Stadion', wrong: ['Museum', 'Krankenhaus', 'Rathaus'], en: 'On Saturday we are watching a football match at the stadium.', why: 'das Stadion = stadium.' },
  { de: 'Ich kaufe ein neues Buch in der ___.', answer: 'Buchhandlung', wrong: ['Metzgerei', 'Apotheke', 'Bäckerei'], en: 'I buy a new book at the bookshop.', why: 'die Buchhandlung = bookshop.' },
]

const TOWN_MEANINGS: Sent[] = [
  { de: 'In meiner Stadt gibt es viel für junge Leute.', en: 'In my town there is a lot for young people.', wrong: ['In my town there is nothing for young people.', 'In my town there are a lot of young people.', 'In my town there is a lot for old people.'], why: 'es gibt viel = there is a lot; junge Leute = young people.', lv: 2 },
  { de: 'Es gibt kein Kino, aber es gibt ein Schwimmbad.', en: 'There is no cinema, but there is a swimming pool.', wrong: ['There is a cinema, but there is no swimming pool.', 'There is a cinema and a swimming pool.', 'There is no cinema and no swimming pool.'], why: 'kein = no / not a; es gibt = there is.', lv: 2 },
  { de: 'Das Rathaus ist neben der Kirche.', en: 'The town hall is next to the church.', wrong: ['The town hall is opposite the church.', 'The town hall is behind the church.', 'The church is next to the station.'], why: 'neben = next to; gegenüber = opposite; hinter = behind.', lv: 3 },
  { de: 'Ich wohne gern hier, weil es so ruhig ist.', en: 'I like living here because it is so quiet.', wrong: ['I don\'t like living here because it is so quiet.', 'I like living here because it is so lively.', 'I like living here because it is so near the sea.'], why: 'gern = like doing; ruhig = quiet.', lv: 3 },
  { de: 'Früher gab es hier einen Markt, aber jetzt gibt es ein Einkaufszentrum.', en: 'There used to be a market here, but now there is a shopping centre.', wrong: ['There is a market here now, but there used to be a shopping centre.', 'There used to be a market here, and now there is a new market.', 'There will be a market here, but now there is a shopping centre.'], why: 'früher gab es = there used to be; jetzt gibt es = now there is.', lv: 5 },
  { de: 'Die Altstadt ist sehr schön, aber es gibt zu viel Verkehr.', en: 'The old town is very beautiful, but there is too much traffic.', wrong: ['The old town is very beautiful and there is no traffic.', 'The new town is very beautiful, but there is too much traffic.', 'The old town is very ugly because there is too much traffic.'], why: 'die Altstadt = old town; zu viel Verkehr = too much traffic.', lv: 4 },
]

// ------------------------------------------------------------------ directions

const DIRECTIONS: W[] = [
  { de: 'geradeaus', en: 'straight on' },
  { de: 'links', en: 'left' },
  { de: 'rechts', en: 'right' },
  { de: 'die erste Straße links', en: 'the first road on the left' },
  { de: 'die zweite Straße rechts', en: 'the second road on the right' },
  { de: 'an der Ampel', en: 'at the traffic lights' },
  { de: 'an der Kreuzung', en: 'at the crossroads' },
  { de: 'über die Brücke', en: 'over the bridge' },
  { de: 'um die Ecke', en: 'round the corner' },
  { de: 'gegenüber', en: 'opposite' },
  { de: 'neben', en: 'next to' },
  { de: 'in der Nähe', en: 'nearby' },
  { de: 'weit', en: 'far' },
  { de: 'Wie komme ich zum Bahnhof?', en: 'How do I get to the station?' },
  { de: 'Ist es weit?', en: 'Is it far?' },
  { de: 'Entschuldigung!', en: 'Excuse me!' },
]

interface Step {
  de: string
  en: string
}
const STEPS: Step[] = [
  { de: 'Gehen Sie geradeaus.', en: 'Go straight on.' },
  { de: 'Nehmen Sie die erste Straße links.', en: 'Take the first road on the left.' },
  { de: 'Nehmen Sie die erste Straße rechts.', en: 'Take the first road on the right.' },
  { de: 'Nehmen Sie die zweite Straße links.', en: 'Take the second road on the left.' },
  { de: 'Nehmen Sie die zweite Straße rechts.', en: 'Take the second road on the right.' },
  { de: 'Nehmen Sie die dritte Straße links.', en: 'Take the third road on the left.' },
  { de: 'Gehen Sie an der Ampel links.', en: 'Turn left at the traffic lights.' },
  { de: 'Gehen Sie an der Ampel rechts.', en: 'Turn right at the traffic lights.' },
  { de: 'Gehen Sie an der Kreuzung links.', en: 'Turn left at the crossroads.' },
  { de: 'Gehen Sie an der Kreuzung rechts.', en: 'Turn right at the crossroads.' },
  { de: 'Gehen Sie über die Brücke.', en: 'Go over the bridge.' },
]

const swapLR = (s: string) => s.replace(/links|rechts/, (m) => (m === 'links' ? 'rechts' : 'links'))
const swapNum = (s: string) => s.replace(/erste|zweite|dritte/, (m) => (m === 'erste' ? 'zweite' : 'erste'))
const swapPlace = (s: string) => s.replace(/Ampel|Kreuzung/, (m) => (m === 'Ampel' ? 'Kreuzung' : 'Ampel'))

const PLACES_TO = [
  { de: 'zum Bahnhof', en: 'the station' },
  { de: 'zum Kino', en: 'the cinema' },
  { de: 'zur Post', en: 'the post office' },
  { de: 'zum Rathaus', en: 'the town hall' },
  { de: 'zur Bank', en: 'the bank' },
  { de: 'zum Schwimmbad', en: 'the swimming pool' },
]

function stepWrongs(s: Step): Wrong[] {
  const out: Wrong[] = []
  if (/links|rechts/.test(s.de)) out.push({ label: swapLR(s.de), misconception: 'links-rechts', feedback: 'links = left, rechts = right.' })
  if (/erste|zweite|dritte/.test(s.de)) out.push({ label: swapNum(s.de), misconception: 'ordinal', feedback: 'erste = first, zweite = second, dritte = third.' })
  if (/Ampel|Kreuzung/.test(s.de)) out.push({ label: swapPlace(s.de), misconception: 'ampel-kreuzung', feedback: 'die Ampel = traffic lights; die Kreuzung = crossroads.' })
  if (/links|rechts/.test(s.de) && /erste|zweite|dritte|Ampel|Kreuzung/.test(s.de)) out.push(swapLR(/erste|zweite|dritte/.test(s.de) ? swapNum(s.de) : swapPlace(s.de)))
  out.push('Gehen Sie geradeaus.', 'Gehen Sie über die Brücke.', 'Nehmen Sie die dritte Straße links.')
  return out
}

const DIR_GAPS: Gap[] = [
  { de: 'Entschuldigung, wie ___ ich zum Bahnhof?', answer: 'komme', wrong: ['bin', 'habe', 'mache'], en: 'Excuse me, how do I get to the station?', why: 'Wie komme ich zum / zur ...? = How do I get to ...?' },
  { de: 'Gehen Sie ___ und dann links.', cue: 'straight on', answer: 'geradeaus', wrong: ['gegenüber', 'neben', 'weit'], en: 'Go straight on and then left.', why: 'geradeaus = straight on.' },
  { de: 'Nehmen Sie die ___ Straße rechts.', cue: 'second', answer: 'zweite', wrong: [{ label: 'zwei', misconception: 'ordinal', feedback: '"Second" is an ordinal: zweite.' }, 'zweiten', 'dritte'], en: 'Take the second road on the right.', why: 'die zweite Straße = the second road.' },
  { de: 'Die Bank ist ___ der Post.', cue: 'opposite', answer: 'gegenüber', wrong: ['neben', 'hinter', 'links'], en: 'The bank is opposite the post office.', why: 'gegenüber = opposite.' },
  { de: 'Das Kino ist ___ dem Supermarkt.', cue: 'next to', answer: 'neben', wrong: ['gegenüber', 'hinter', 'über'], en: 'The cinema is next to the supermarket.', why: 'neben = next to.' },
  { de: 'Ist es ___? – Nein, nur fünf Minuten zu Fuß.', answer: 'weit', wrong: ['nah', 'links', 'geradeaus'], en: 'Is it far? – No, only five minutes on foot.', why: 'weit = far.' },
  { de: 'Der Bahnhof ist gleich um die ___.', answer: 'Ecke', wrong: ['Ampel', 'Brücke', 'Kreuzung'], en: 'The station is just round the corner.', why: 'um die Ecke = round the corner.' },
  { de: 'Biegen Sie an der ___ links ab.', cue: 'traffic lights', answer: 'Ampel', wrong: [{ label: 'Kreuzung', misconception: 'ampel-kreuzung', feedback: 'die Kreuzung = crossroads; traffic lights = die Ampel.' }, 'Ecke', 'Brücke'], en: 'Turn left at the traffic lights.', why: 'die Ampel = traffic lights.' },
  { de: 'Gibt es hier in der ___ eine Apotheke?', answer: 'Nähe', wrong: ['Ampel', 'Brücke', 'Straße'], en: 'Is there a pharmacy near here?', why: 'in der Nähe = nearby (nah = near).' },
]

const directionGens: ItemGenerator[] = [
  ...vocabGens('dir', 'vocab.directions', DIRECTIONS, 'directions'),
  ...gapGens('dir.gap', 'vocab.directions', DIR_GAPS, [2, 4], [3, 5]),

  G('top.dir.step', 'vocab.directions', [2, 3], (rng) => {
    const s = rng.pick(STEPS)
    return choice({
      rng,
      prompt: `Which instruction means: ${q2(s.en)}`,
      correct: s.de,
      wrong: stepWrongs(s).slice(0, 3),
      hint: 'Check three things: links or rechts, which road (erste, zweite...), and where (Ampel, Kreuzung).',
      explanation: `${s.de} = ${s.en} links = left, rechts = right, die Ampel = traffic lights, die Kreuzung = crossroads.`,
    })
  }),

  G('top.dir.route', 'vocab.directions', [3, 5], (rng, d) => {
    const place = rng.pick(PLACES_TO)
    const a = rng.pick(STEPS.slice(0, 1).concat(STEPS.slice(10)))
    const b = rng.pick(STEPS.slice(1, 10))
    const c = d >= 5 ? rng.pick(STEPS.filter((x) => x !== a && x !== b && x.de.includes('Ampel') !== b.de.includes('Ampel'))) : null
    const steps = c ? [a, b, c] : [a, b]
    const text = steps.map((s, i) => (i === 0 ? s.de : `Dann ${s.de.charAt(0).toLowerCase()}${s.de.slice(1)}`)).join(' ')
    const route = steps.map((s) => s.en.replace(/\.$/, '').toLowerCase()).join(', then ')
    const wrongB = stepWrongs(b).filter((w): w is { label: string; misconception?: string; feedback?: string } => typeof w !== 'string').slice(0, 2)
    return choice({
      rng,
      prompt: `You ask: "Wie komme ich ${place.de}?" The answer is: "${text}" Which route is right?`,
      correct: route.charAt(0).toUpperCase() + route.slice(1) + '.',
      wrong: [
        ...wrongB.map((w) => {
          const alt = STEPS.find((x) => x.de === w.label)
          const r = steps.map((s) => (s === b && alt ? alt.en : s.en).replace(/\.$/, '').toLowerCase()).join(', then ')
          return { label: r.charAt(0).toUpperCase() + r.slice(1) + '.', misconception: w.misconception, feedback: w.feedback }
        }),
        (() => {
          const r = [...steps].reverse().map((s) => s.en.replace(/\.$/, '').toLowerCase()).join(', then ')
          return { label: r.charAt(0).toUpperCase() + r.slice(1) + '.', misconception: 'order', feedback: 'Follow the steps in the order they are given: dann = then.' }
        })(),
      ],
      hint: 'Go through it one step at a time. Dann = then.',
      explanation: `${text} = ${route}. links = left, rechts = right, erste / zweite / dritte = first / second / third.`,
    })
  }),
]

/** English quoted, without the final full stop. */
const q2 = (s: string) => `"${s.replace(/\.$/, '')}"`

// ------------------------------------------------------------------ generators

export const homeTownGenerators: ItemGenerator[] = [
  ...vocabGens('home', 'vocab.home', HOME, 'house and home'),
  ...gapGens('home.gap', 'vocab.home', HOME_GAPS, [2, 4], [3, 5]),
  meaningGen('home.meaning', 'vocab.home', [2, 5], HOME_MEANINGS, 'Look for es gibt (there is), kein (no) and the floor words (Erdgeschoss, erster Stock).'),
  revealGen('home.writing', 'vocab.home', [4, 5], HOME_TASKS),

  ...vocabGens('town', 'vocab.town', TOWN, 'places in town'),
  ...gapGens('town.gap', 'vocab.town', TOWN_GAPS, [2, 4], [3, 5]),
  meaningGen('town.meaning', 'vocab.town', [2, 5], TOWN_MEANINGS, 'Watch for kein (no), neben (next to), gegenüber (opposite) and time words like früher (in the past).'),

  ...directionGens,
]
