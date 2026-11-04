/** Meals, café and restaurant; shopping (quantities, prices in euros); clothes and school uniform. */
import type { ItemGenerator } from '@/engine/registry'
import type { Rng } from '@/engine/types'
import { choice, orderItem, textItem } from '../../kit'
import { G, accepts, gapGens, keyboardTip, meaningGen, revealGen, vocabGens, type Gap, type Sent, type Task, type W, type Wrong } from './lib'
import { numDe } from './numbers-time'

// ------------------------------------------------------------------ café and restaurant

const CAFE: W[] = [
  { de: 'Frühstück', en: 'breakfast', g: 'das' },
  { de: 'Mittagessen', en: 'lunch', g: 'das' },
  { de: 'Abendessen', en: 'evening meal', g: 'das' },
  { de: 'Speisekarte', en: 'menu', g: 'die', tip: 'A false friend: das Menü is a set meal.' },
  { de: 'Rechnung', en: 'bill', g: 'die' },
  { de: 'Kellner', en: 'waiter', g: 'der' },
  { de: 'Kellnerin', en: 'waitress', g: 'die' },
  { de: 'Vorspeise', en: 'starter', g: 'die' },
  { de: 'Hauptgericht', en: 'main course', g: 'das' },
  { de: 'Nachtisch', en: 'dessert', g: 'der' },
  { de: 'Suppe', en: 'soup', g: 'die' },
  { de: 'Hähnchen', en: 'chicken', g: 'das' },
  { de: 'Pommes', en: 'chips', g: 'pl' },
  { de: 'Salat', en: 'salad', g: 'der' },
  { de: 'Eis', en: 'ice cream', g: 'das' },
  { de: 'Tee', en: 'tea', g: 'der' },
  { de: 'Kaffee', en: 'coffee', g: 'der' },
  { de: 'Orangensaft', en: 'orange juice', g: 'der' },
  { de: 'Brötchen', en: 'bread roll', g: 'das' },
  { de: 'Nudeln', en: 'pasta', g: 'pl' },
  { de: 'Reis', en: 'rice', g: 'der' },
  { de: 'Kartoffel', en: 'potato', g: 'die' },
  { de: 'Fleisch', en: 'meat', g: 'das' },
  { de: 'vegetarisch', en: 'vegetarian' },
  { de: 'lecker', en: 'delicious' },
  { de: 'Ich hätte gern...', en: 'I would like...', alt: ['Ich hätte gern'] },
  { de: 'Die Rechnung, bitte.', en: 'The bill, please.', alt: ['Die Rechnung bitte'] },
  { de: 'Guten Appetit!', en: 'Enjoy your meal!', alt: ['Guten Appetit'] },
  { de: 'Was darf es sein?', en: 'What would you like? (said by the waiter)', alt: ['Was darf es sein'] },
  { de: 'zum Mitnehmen', en: 'to take away' },
  { de: 'Stimmt so.', en: 'Keep the change.', alt: ['Stimmt so'] },
]

const CAFE_GAPS: Gap[] = [
  { de: 'Ich esse mein ___ um sieben Uhr morgens.', answer: 'Frühstück', wrong: ['Abendessen', 'Mittagessen', 'Hauptgericht'], en: 'I eat my breakfast at seven o\'clock in the morning.', why: 'das Frühstück = breakfast (früh = early).' },
  { de: 'Entschuldigung, die ___, bitte! Ich möchte zahlen.', answer: 'Rechnung', wrong: [{ label: 'Speisekarte', misconception: 'menu-bill', feedback: 'die Speisekarte is the menu. To pay you ask for die Rechnung.' }, 'Vorspeise', 'Suppe'], en: 'Excuse me, the bill, please! I would like to pay.', why: 'die Rechnung = bill (rechnen = to calculate).' },
  { de: 'Können wir bitte die ___ sehen? Wir wissen noch nicht, was wir essen wollen.', answer: 'Speisekarte', wrong: [{ label: 'Rechnung', misconception: 'menu-bill', feedback: 'die Rechnung is the bill, at the end. Before you order you need die Speisekarte.' }, 'Suppe', 'Vorspeise'], en: 'Can we see the menu, please? We do not know yet what we want to eat.', why: 'die Speisekarte = menu.' },
  { de: 'Als ___ nehme ich ein Eis mit Sahne.', answer: 'Nachtisch', wrong: ['Vorspeise', 'Hauptgericht', 'Getränk'], en: 'For dessert I will have an ice cream with cream.', why: 'der Nachtisch = dessert (nach = after).' },
  { de: 'Ich bin Vegetarierin, also esse ich kein ___.', answer: 'Fleisch', wrong: ['Gemüse', 'Obst', 'Brot'], en: 'I am a vegetarian, so I do not eat meat.', why: 'das Fleisch = meat.' },
  { de: 'Ich ___ eine Cola, bitte.', answer: 'möchte', alt: ['hätte gern'], wrong: [{ label: 'mag', misconception: 'mag-moechte', feedback: 'ich mag = I like (in general). To order, say ich möchte (I would like).' }, 'möchten', 'bin'], en: 'I would like a cola, please.', why: 'ich möchte = I would like: the polite way to order.' },
  { de: 'Das Hähnchen ___ sehr lecker!', answer: 'schmeckt', wrong: ['isst', 'trinkt', 'kostet'], en: 'The chicken tastes very good!', why: 'schmecken = to taste: Das schmeckt lecker!' },
  { de: 'Haben Sie einen ___ für vier Personen?', answer: 'Tisch', wrong: ['Stuhl', 'Teller', 'Kellner'], en: 'Do you have a table for four people?', why: 'der Tisch = table.' },
  { de: 'Ich esse zum Mittagessen Spaghetti und als ___ eine Tomatensuppe.', answer: 'Vorspeise', wrong: ['Nachtisch', 'Frühstück', 'Rechnung'], en: 'For lunch I eat spaghetti, and a tomato soup as a starter.', why: 'die Vorspeise = starter (vor = before).' },
]

const CAFE_MEANINGS: Sent[] = [
  { de: 'Ich hätte gern Hähnchen mit Pommes und einen Salat.', en: 'I would like chicken and chips and a salad.', wrong: ['I would like chicken and rice and a salad.', 'I had chicken and chips and a salad.', 'I would like fish and chips and a salad.'], why: 'ich hätte gern = I would like; die Pommes = chips.', lv: 2 },
  { de: 'Was empfehlen Sie?', en: 'What do you recommend?', wrong: ['What would you like?', 'What does it cost?', 'What are you eating?'], why: 'empfehlen = to recommend.', lv: 3 },
  { de: 'Die Suppe ist kalt und das Essen ist zu salzig.', en: 'The soup is cold and the food is too salty.', wrong: ['The soup is hot and the food is too salty.', 'The soup is cold and the food is too sweet.', 'The salad is cold and the food is too salty.'], why: 'kalt = cold; zu salzig = too salty.', lv: 3 },
  { de: 'Wir essen meistens um sechs Uhr zu Abend.', en: 'We usually have our evening meal at six o\'clock.', wrong: ['We usually have lunch at six o\'clock.', 'We never have our evening meal at six o\'clock.', 'We usually have our evening meal at half past six.'], why: 'zu Abend essen = to have the evening meal; meistens = usually.', lv: 3 },
  { de: 'Zum Frühstück esse ich Brötchen mit Honig.', en: 'For breakfast I eat bread rolls with honey.', wrong: ['For lunch I eat bread rolls with honey.', 'For breakfast I eat bread rolls with cheese.', 'For breakfast I drink tea with honey.'], why: 'zum Frühstück = for breakfast; das Brötchen = bread roll.', lv: 2 },
  { de: 'Kann ich bitte mit Karte zahlen?', en: 'Can I pay by card, please?', wrong: ['Can I see the menu, please?', 'Can I pay in cash, please?', 'Can I have the bill, please?'], why: 'mit Karte zahlen = to pay by card (bar zahlen = to pay in cash).', lv: 4 },
  { de: 'Ich esse kein Fleisch, weil ich Tiere liebe.', en: 'I don\'t eat meat because I love animals.', wrong: ['I don\'t eat fish because I love animals.', 'I eat meat because I love animals.', 'I don\'t eat meat because it is unhealthy.'], why: 'kein Fleisch = no meat; weil = because.', lv: 3 },
]

const DISHES = [
  { de: 'eine Tomatensuppe', en: 'a tomato soup' },
  { de: 'ein Käsebrot', en: 'a cheese sandwich' },
  { de: 'eine Pizza mit Pilzen', en: 'a pizza with mushrooms' },
  { de: 'Hähnchen mit Pommes', en: 'chicken and chips' },
  { de: 'eine Bratwurst mit Kartoffelsalat', en: 'a sausage with potato salad' },
  { de: 'Nudeln mit Tomatensoße', en: 'pasta with tomato sauce' },
]
const DRINKS = [
  { de: 'einen Apfelsaft', en: 'an apple juice' },
  { de: 'ein Mineralwasser', en: 'a mineral water' },
  { de: 'eine heiße Schokolade', en: 'a hot chocolate' },
  { de: 'einen Orangensaft', en: 'an orange juice' },
  { de: 'einen Tee mit Milch', en: 'a tea with milk' },
]

// ------------------------------------------------------------------ shopping

const SHOPPING: W[] = [
  { de: 'ein Kilo', en: 'a kilo' },
  { de: 'ein halbes Kilo', en: 'half a kilo' },
  { de: 'hundert Gramm', en: '100 grams', alt: ['einhundert Gramm'] },
  { de: 'ein Liter', en: 'a litre' },
  { de: 'eine Flasche', en: 'a bottle' },
  { de: 'eine Dose', en: 'a tin / can' },
  { de: 'eine Packung', en: 'a packet' },
  { de: 'eine Tüte', en: 'a (paper or plastic) bag' },
  { de: 'ein Stück', en: 'a piece' },
  { de: 'eine Scheibe', en: 'a slice' },
  { de: 'eine Tafel Schokolade', en: 'a bar of chocolate' },
  { de: 'Was kostet das?', en: 'How much does that cost?', alt: ['Was kostet das', 'Wie viel kostet das?', 'Wie viel kostet das'] },
  { de: 'Das macht...', en: 'That comes to...', alt: ['Das macht'] },
  { de: 'Sonst noch etwas?', en: 'Anything else?', alt: ['Sonst noch etwas', 'Sonst noch was?', 'Sonst noch was'] },
  { de: 'Das ist alles.', en: 'That is all.', alt: ['Das ist alles'] },
  { de: 'billig', en: 'cheap' },
  { de: 'teuer', en: 'expensive' },
  { de: 'die Kasse', en: 'the till (checkout)', alt: ['Kasse'] },
]

const SHOP_GAPS: Gap[] = [
  { de: 'Ich hätte gern eine ___ Mineralwasser.', answer: 'Flasche', wrong: ['Tafel', 'Tüte', 'Scheibe'], en: 'I would like a bottle of mineral water.', why: 'eine Flasche = a bottle. German just puts the food after the amount: eine Flasche Wasser (no word for "of").' },
  { de: 'Ich möchte eine ___ Schokolade.', answer: 'Tafel', wrong: ['Flasche', 'Dose', 'Scheibe'], en: 'I would like a bar of chocolate.', why: 'eine Tafel Schokolade = a bar of chocolate.' },
  { de: 'Ein ___ Kartoffeln, bitte.', answer: 'Kilo', wrong: ['Liter', 'Becher', 'Tropfen'], en: 'A kilo of potatoes, please.', why: 'ein Kilo = a kilo.' },
  { de: 'Ich kaufe einen ___ Milch.', answer: 'Liter', wrong: ['Kilo', 'Meter', 'Gramm'], en: 'I am buying a litre of milk.', why: 'der Liter = litre (for liquids); Kilo and Gramm are for weight.' },
  { de: 'Eine ___ Tomaten, bitte.', answer: 'Dose', wrong: ['Tafel', 'Scheibe', 'Kugel'], en: 'A tin of tomatoes, please.', why: 'eine Dose = a tin / can.' },
  { de: 'Das ist zu ___. Haben Sie etwas Billigeres?', answer: 'teuer', wrong: [{ label: 'billig', misconception: 'billig-teuer', feedback: 'billig = cheap. If you want something cheaper, the first one is teuer (expensive).' }, 'lecker', 'klein'], en: 'That is too expensive. Do you have anything cheaper?', why: 'teuer = expensive; billig = cheap.' },
  { de: 'Sonst noch ___? – Nein, danke. Das ist alles.', answer: 'etwas', alt: ['was'], wrong: ['nichts', 'alles', 'viel'], en: 'Anything else? – No, thanks. That is all.', why: 'Sonst noch etwas? = Anything else?' },
  { de: 'Ich hätte gern zweihundert ___ Käse.', answer: 'Gramm', wrong: ['Liter', 'Flaschen', 'Dosen'], en: 'I would like 200 grams of cheese.', why: 'das Gramm = gram; it stays the same in the plural: zweihundert Gramm.' },
  { de: 'Ich möchte vier ___ Schinken, bitte.', answer: 'Scheiben', wrong: ['Flaschen', 'Liter', 'Tafeln'], en: 'I would like four slices of ham, please.', why: 'die Scheibe = slice; plural die Scheiben.' },
]

/** Price in words: 3,50 -> drei Euro fünfzig. */
export function priceDe(euro: number, cent: number): string {
  const e = euro === 1 ? 'ein Euro' : `${numDe(euro)} Euro`
  return cent === 0 ? e : `${e} ${numDe(cent)}`
}
const priceFig = (euro: number, cent: number) => `${euro},${String(cent).padStart(2, '0')} €`
const swapCents = (c: number) => (c >= 21 && c % 10 !== 0 && Math.floor(c / 10) !== c % 10 ? (c % 10) * 10 + Math.floor(c / 10) : null)

function randomPrice(rng: Rng, d: number): [number, number] {
  const euro = rng.int(1, d >= 4 ? 19 : 6)
  const cent = d <= 2 ? rng.pick([0, 10, 20, 30, 50, 80, 90]) : rng.pick([15, 25, 35, 45, 55, 65, 75, 85, 95, 49, 99, 69, 79, 17, 16, 60, 70])
  return [euro, cent]
}

function priceWrongs(euro: number, cent: number): { p: [number, number]; why?: string }[] {
  const out: { p: [number, number]; why?: string }[] = []
  const s = swapCents(cent)
  if (s !== null) out.push({ p: [euro, s], why: 'Units first: fünfundsiebzig = 75, not 57.' })
  if (cent >= 13 && cent <= 19) out.push({ p: [euro, (cent - 10) * 10], why: '-zehn is a teen (siebzehn = 17); -zig is a ten (siebzig = 70).' })
  if (cent % 10 === 0 && cent >= 30) out.push({ p: [euro, cent / 10 + 10], why: '-zig is a ten (siebzig = 70); -zehn is a teen.' })
  if (euro >= 1 && euro <= 9 && cent >= 10 && cent <= 99) out.push({ p: [Math.floor(cent / 10) || euro + 1, euro * 10], why: 'The euros come first, then the cents.' })
  out.push({ p: [euro + 1, cent] }, { p: [euro, (cent + 5) % 100] }, { p: [Math.max(1, euro - 1), cent] })
  return out.filter((w) => !(w.p[0] === euro && w.p[1] === cent))
}

const PRICE_RULE = 'Say the euros, then "Euro", then the cents: 4,75 € = vier Euro fünfundsiebzig. In German-speaking countries the price is written with a comma: 4,75 €.'

const ITEMS = [
  { de: 'ein Kilo Äpfel', en: 'a kilo of apples', verb: 'kostet' },
  { de: 'eine Flasche Orangensaft', en: 'a bottle of orange juice', verb: 'kostet' },
  { de: 'eine Tafel Schokolade', en: 'a bar of chocolate', verb: 'kostet' },
  { de: 'eine Packung Kekse', en: 'a packet of biscuits', verb: 'kostet' },
  { de: 'zweihundert Gramm Käse', en: '200 grams of cheese', verb: 'kosten' },
  { de: 'eine Dose Tomaten', en: 'a tin of tomatoes', verb: 'kostet' },
  { de: 'sechs Brötchen', en: 'six bread rolls', verb: 'kosten' },
  { de: 'ein Liter Milch', en: 'a litre of milk', verb: 'kostet' },
]

const shoppingGens: ItemGenerator[] = [
  ...vocabGens('shop', 'vocab.shopping', SHOPPING, 'shopping'),
  ...gapGens('shop.gap', 'vocab.shopping', SHOP_GAPS, [2, 4], [3, 5]),

  G('top.shop.price-read', 'vocab.shopping', [1, 3], (rng, d) => {
    const [e, c] = randomPrice(rng, d)
    const item = rng.pick(ITEMS)
    const seen = new Set([priceFig(e, c)])
    const wrong: Wrong[] = []
    for (const w of priceWrongs(e, c)) {
      const label = priceFig(w.p[0], w.p[1])
      if (seen.has(label) || wrong.length >= 3) continue
      seen.add(label)
      wrong.push(w.why ? { label, misconception: 'price', feedback: w.why } : label)
    }
    return choice({
      rng,
      prompt: `"${item.de.charAt(0).toUpperCase() + item.de.slice(1)} ${item.verb} ${priceDe(e, c)}." How much ${item.verb === 'kosten' ? 'are' : 'is'} ${item.en}?`,
      correct: priceFig(e, c),
      wrong,
      hint: 'The euros come first. In the cents, the units come before the tens.',
      explanation: `${priceDe(e, c)} = ${priceFig(e, c)}. ${PRICE_RULE}`,
    })
  }),

  G('top.shop.price-say', 'vocab.shopping', [2, 4], (rng, d) => {
    const [e, c] = randomPrice(rng, d + 1)
    const seen = new Set([priceDe(e, c)])
    const wrong: Wrong[] = []
    for (const w of priceWrongs(e, c)) {
      const label = priceDe(w.p[0], w.p[1])
      if (seen.has(label) || wrong.length >= 3) continue
      seen.add(label)
      wrong.push(w.why ? { label, misconception: 'price', feedback: w.why } : label)
    }
    return choice({
      rng,
      prompt: `The shop assistant says the price: ${priceFig(e, c)}. What does she say?  "Das macht ..."`,
      correct: priceDe(e, c),
      wrong,
      hint: 'Euros, then the word Euro, then the cents (units first).',
      explanation: `${priceFig(e, c)} = ${priceDe(e, c)}. ${PRICE_RULE}`,
    })
  }),

  G('top.shop.price-type', 'vocab.shopping', [4, 5], (rng, d) => {
    const [e, c0] = randomPrice(rng, d)
    const c = c0 === 0 ? 50 : c0
    const words = priceDe(e, c)
    return textItem({
      prompt: `Write this price in words, the way you would say it in a German shop:  ${priceFig(e, c)}`,
      accept: accepts(words, `${words} Cent`, `${e === 1 ? 'ein' : numDe(e)} Euro und ${numDe(c)} Cent`, ...(e === 1 ? [`einen Euro ${numDe(c)}`] : [])),
      placeholder: 'e.g. zwei Euro zwanzig',
      hint: 'Euros + Euro + the cents in words.',
      explanation: `${priceFig(e, c)} = ${words}. ${PRICE_RULE}${keyboardTip(words)}`,
    })
  }),

  G('top.shop.total', 'vocab.shopping', [3, 5], (rng, d) => {
    const items = rng.shuffle(ITEMS).slice(0, d >= 5 ? 3 : 2)
    const prices: [number, number][] = items.map(() => [rng.int(1, 4), rng.pick([10, 20, 30, 40, 50, 60, 70, 80, 90, 25, 75])])
    const total = prices.reduce((t, p) => t + p[0] * 100 + p[1], 0)
    const say = (cents: number) => priceDe(Math.floor(cents / 100), cents % 100)
    const wrongCents = [total + 100, total - 100, total + 10, total - 10, total + 50].filter((x) => x !== total && x > 0)
    const list = items.map((it, i) => `${it.de} (${priceDe(...(prices[i] as [number, number]))})`)
    return choice({
      rng,
      prompt: `Ich kaufe ${list.slice(0, -1).join(', ')} und ${list[list.length - 1]}. Was macht das zusammen?  (What does it come to altogether?)`,
      correct: say(total),
      wrong: [...new Set(wrongCents)].slice(0, 3).map(say),
      hint: 'Turn each price into numbers first, add them up, then find the German words.',
      explanation: `${prices.map((p) => priceFig(p[0], p[1])).join(' + ')} = ${priceFig(Math.floor(total / 100), total % 100)} = ${say(total)}.`,
    })
  }),
]

// ------------------------------------------------------------------ clothes

const CLOTHES: W[] = [
  { de: 'T-Shirt', en: 'T-shirt', g: 'das', alt: ['Tshirt'] },
  { de: 'Hemd', en: 'shirt', g: 'das' },
  { de: 'Bluse', en: 'blouse', g: 'die' },
  { de: 'Hose', en: 'trousers', g: 'die', tip: 'die Hose is singular in German: Meine Hose ist neu.' },
  { de: 'Jeans', en: 'jeans', g: 'die' },
  { de: 'Rock', en: 'skirt', g: 'der', tip: 'A false friend: der Rock is a skirt (and Rock music).' },
  { de: 'Kleid', en: 'dress', g: 'das' },
  { de: 'Jacke', en: 'jacket', g: 'die' },
  { de: 'Mantel', en: 'coat', g: 'der' },
  { de: 'Pullover', en: 'jumper', g: 'der', alt: ['Pulli'] },
  { de: 'Krawatte', en: 'tie', g: 'die' },
  { de: 'Blazer', en: 'blazer', g: 'der' },
  { de: 'Schuhe', en: 'shoes', g: 'pl' },
  { de: 'Turnschuhe', en: 'trainers', g: 'pl' },
  { de: 'Stiefel', en: 'boots', g: 'pl' },
  { de: 'Socken', en: 'socks', g: 'pl' },
  { de: 'Handschuhe', en: 'gloves', g: 'pl', tip: 'Literally "hand shoes".' },
  { de: 'Strumpfhose', en: 'tights', g: 'die' },
  { de: 'Mütze', en: 'woolly hat', g: 'die' },
  { de: 'Hut', en: 'hat', g: 'der' },
  { de: 'Schal', en: 'scarf', g: 'der' },
  { de: 'Uniform', en: 'uniform', g: 'die' },
  { de: 'tragen', en: 'to wear' },
  { de: 'bequem', en: 'comfortable' },
  { de: 'altmodisch', en: 'old-fashioned' },
  { de: 'modisch', en: 'fashionable' },
  { de: 'hässlich', en: 'ugly' },
  { de: 'gestreift', en: 'striped' },
  { de: 'kariert', en: 'checked' },
]

const CLOTHES_GAPS: Gap[] = [
  { de: 'Im Winter trage ich einen warmen ___.', cue: 'coat', answer: 'Mantel', wrong: ['Rock', 'Hut', 'Blazer'], en: 'In winter I wear a warm coat.', why: 'der Mantel = coat.' },
  { de: 'An den Füßen trage ich ___ und Schuhe.', answer: 'Socken', wrong: [{ label: 'Handschuhe', misconception: 'handschuhe', feedback: 'Handschuhe ("hand shoes") are gloves, for your hands!' }, 'Hosen', 'Mützen'], en: 'On my feet I wear socks and shoes.', why: 'die Socken = socks.' },
  { de: 'An den Händen trage ich im Winter ___.', answer: 'Handschuhe', wrong: ['Socken', 'Turnschuhe', 'Stiefel'], en: 'On my hands in winter I wear gloves.', why: 'die Handschuhe = gloves ("hand shoes").' },
  { de: 'Zum Sport trage ich ___.', cue: 'trainers', answer: 'Turnschuhe', wrong: ['Handschuhe', 'Stiefel', 'Socken'], en: 'For PE I wear trainers.', why: 'die Turnschuhe = trainers (turnen = to do gymnastics).' },
  { de: 'Mein Vater trägt zur Arbeit ein Hemd und eine ___.', cue: 'tie', answer: 'Krawatte', wrong: ['Bluse', 'Strumpfhose', 'Jeans'], en: 'My father wears a shirt and a tie to work.', why: 'die Krawatte = tie.' },
  { de: 'Ich finde unsere Uniform ___. Sie ist so altmodisch!', answer: 'hässlich', wrong: ['schön', 'bequem', 'modisch'], en: 'I think our uniform is ugly. It is so old-fashioned!', why: 'hässlich = ugly.' },
  { de: 'Ich trage gern Jeans, weil sie so ___ sind.', answer: 'bequem', wrong: [{ label: 'unbequem', misconception: 'un-prefix', feedback: 'un- makes the opposite: unbequem = uncomfortable.' }, 'hässlich', 'altmodisch'], en: 'I like wearing jeans because they are so comfortable.', why: 'bequem = comfortable.' },
  { de: 'Zur Party trägt meine Schwester ein rotes ___.', cue: 'dress', answer: 'Kleid', wrong: ['Hemd', 'T-Shirt', 'Rock'], en: 'My sister is wearing a red dress to the party.', why: 'das Kleid = dress.' },
  { de: 'Meine ___ ist zu lang.', cue: 'trousers', answer: 'Hose', wrong: [{ label: 'Hosen', misconception: 'trousers-plural', feedback: 'One pair of trousers is singular in German: meine Hose ist...' }, 'Jacke', 'Bluse'], en: 'My trousers are too long.', why: 'die Hose = trousers; it is singular in German.' },
  { de: 'Es ist kalt. Vergiss deine ___ nicht!', cue: 'woolly hat', answer: 'Mütze', wrong: ['Krawatte', 'Bluse', 'Hose'], en: 'It is cold. Don\'t forget your woolly hat!', why: 'die Mütze = woolly hat (der Hut = hat).' },
]

const CLOTHES_MEANINGS: Sent[] = [
  { de: 'Wir müssen eine Uniform tragen: einen blauen Blazer, ein weißes Hemd und eine gestreifte Krawatte.', en: 'We have to wear a uniform: a blue blazer, a white shirt and a striped tie.', wrong: ['We have to wear a uniform: a black blazer, a white shirt and a striped tie.', 'We have to wear a uniform: a blue blazer, a white blouse and a checked tie.', 'We don\'t have to wear a uniform: a blue blazer, a white shirt and a striped tie.'], why: 'müssen = to have to; blau = blue; weiß = white; gestreift = striped.', lv: 3 },
  { de: 'Meine Hose ist zu kurz.', en: 'My trousers are too short.', wrong: ['My trousers are too long.', 'My jacket is too short.', 'My trousers are too tight.'], why: 'die Hose = trousers (singular in German); kurz = short.', lv: 2 },
  { de: 'Am Wochenende trage ich lieber Jeans und einen Kapuzenpulli.', en: 'At the weekend I prefer to wear jeans and a hoodie.', wrong: ['At the weekend I have to wear jeans and a hoodie.', 'During the week I prefer to wear jeans and a hoodie.', 'At the weekend I prefer to wear a skirt and a hoodie.'], why: 'lieber = prefer; der Kapuzenpulli = hoodie (die Kapuze = hood).', lv: 3 },
  { de: 'Ich finde Schuluniformen gut, weil alle gleich aussehen.', en: 'I think school uniforms are good because everyone looks the same.', wrong: ['I think school uniforms are bad because everyone looks the same.', 'I think school uniforms are good because everyone looks different.', 'I think school uniforms are good because they are cheap.'], why: 'gleich = the same; aussehen = to look (appearance).', lv: 4 },
  { de: 'Kann ich das Kleid anprobieren?', en: 'Can I try on the dress?', wrong: ['Can I buy the dress?', 'Can I try on the skirt?', 'Can I take the dress back?'], why: 'anprobieren = to try on; das Kleid = dress.', lv: 3 },
  { de: 'Haben Sie diese Jacke eine Nummer größer?', en: 'Do you have this jacket one size bigger?', wrong: ['Do you have this jacket one size smaller?', 'Do you have this jacket in another colour?', 'Do you have this jumper one size bigger?'], why: 'eine Nummer größer = one size bigger; die Jacke = jacket.', lv: 4 },
  { de: 'Früher mussten wir einen Rock tragen, aber jetzt dürfen wir auch eine Hose tragen.', en: 'We used to have to wear a skirt, but now we are allowed to wear trousers too.', wrong: ['We used to be allowed to wear a skirt, but now we have to wear trousers.', 'We have to wear a skirt now, but we used to be allowed to wear trousers.', 'We used to have to wear trousers, but now we are allowed to wear a skirt too.'], why: 'mussten = had to; dürfen = to be allowed to; der Rock = skirt.', lv: 5 },
]

const CLOTHES_TASKS: Task[] = [
  {
    prompt: 'Describe your school uniform in German in 3-4 sentences, with colours, and give your opinion with a reason.',
    model: 'In meiner Schule müssen wir eine Uniform tragen. Wir tragen einen schwarzen Blazer, ein weißes Hemd und eine grüne Krawatte. Ich finde die Uniform praktisch, aber ein bisschen altmodisch. Am Wochenende trage ich lieber Jeans, weil sie bequem sind.',
    checklist: ['Says what you have to wear (Wir müssen ... tragen)', 'Names at least three items of clothing with colours', 'Gives an opinion with an adjective (praktisch, hässlich...)', 'Gives a reason with weil, verb at the end'],
    hint: 'Wir müssen ... tragen. Wir tragen einen / eine / ein ... Ich finde die Uniform ..., weil ...',
  },
  {
    prompt: 'You are going to a party. Write 3 sentences in German about what you will wear and why.',
    model: 'Zur Party trage ich ein blaues Kleid und schwarze Schuhe. Ich trage auch eine Jacke, weil es abends kalt ist. Ich finde das Kleid sehr schön und modisch.',
    checklist: ['Names at least two items of clothing', 'Uses colours', 'Gives a reason with weil', 'Gives an opinion (Ich finde...)'],
    hint: 'Zur Party trage ich ... Ich trage auch ..., weil ...',
  },
]

// ------------------------------------------------------------------ generators

export const foodShoppingGenerators: ItemGenerator[] = [
  ...vocabGens('cafe', 'vocab.cafe', CAFE, 'meals, café and restaurant'),
  ...gapGens('cafe.gap', 'vocab.cafe', CAFE_GAPS, [2, 4], [3, 5]),
  meaningGen('cafe.meaning', 'vocab.cafe', [2, 5], CAFE_MEANINGS, 'Find the food and drink words, then check the verb: is she ordering, eating or paying?'),

  G('top.cafe.dialogue', 'vocab.cafe', [2, 4], (rng, d) => {
    const dish = rng.pick(DISHES)
    const drink = rng.pick(DRINKS)
    const euro = rng.int(8, 19)
    const cent = rng.pick([20, 40, 50, 60, 80, 90])
    const lines = [
      'Kellnerin: Guten Tag! Was darf es sein?',
      `Gast: Ich hätte gern ${dish.de}, bitte.`,
      'Kellnerin: Und zu trinken?',
      `Gast: ${drink.de.charAt(0).toUpperCase() + drink.de.slice(1)}, bitte.`,
      ...(d >= 3 ? ['Gast: Die Rechnung, bitte.', `Kellnerin: Das macht ${priceDe(euro, cent)}.`] : []),
    ]
    return orderItem({
      rng,
      prompt: 'Put the conversation in the café in order.',
      correct: lines,
      direction: ['first', 'last'],
      hint: 'The waitress speaks first. What do you order first: food or drink? When do you pay?',
      explanation: `${lines.join(' / ')} (The guest orders ${dish.en} and ${drink.en}${d >= 3 ? `, then pays ${priceFig(euro, cent)}` : ''}.)`,
    })
  }),

  ...shoppingGens,

  ...vocabGens('clothes', 'vocab.clothes', CLOTHES, 'clothes'),
  ...gapGens('clothes.gap', 'vocab.clothes', CLOTHES_GAPS, [2, 4], [3, 5]),
  meaningGen('clothes.meaning', 'vocab.clothes', [2, 5], CLOTHES_MEANINGS, 'Check the colours, the clothes and the verb (tragen, müssen, dürfen).'),
  revealGen('clothes.writing', 'vocab.clothes', [4, 5], CLOTHES_TASKS),
]
