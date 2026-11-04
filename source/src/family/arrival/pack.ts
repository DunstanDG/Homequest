/**
 * The "new baby" pack: two weeks of suggested activities, the medical milestones that fall in the first week, and a
 * low-effort meal plan for the parent recovering at home. It is plain data, like the school pack: nothing here is
 * scheduled until the baby has a birth date, and then Day 1 onwards is worked out from that date.
 */

export type ArrivalEnv = 'Outdoor' | 'Indoor'

export interface ArrivalActivity {
  id: string
  /** 1-14: days since the first day at home (Day 1). */
  day: number
  env: ArrivalEnv
  title: string
  what: string
  props: string[]
  /** Who takes part, as written in the plan: "Parent, Baby, Dog", "Full Family"... */
  who: string
  tags: string[]
  /** The NHS / medical milestone that falls on this day (week 1 only). */
  focus?: string
}

export interface ArrivalMeal {
  id: string
  meal: 'Breakfast' | 'Lunch'
  name: string
  what: string
  hack: string
  prep: string
  style: string
  ingredients: string
  diet: string
}

const split = (s: string) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

/** [day, env, id, title, what, props, who, tags, focus?] */
type Row = [number, ArrivalEnv, string, string, string, string, string, string, string?]

const ROWS: Row[] = [
  [
    1,
    'Outdoor',
    'W1-D1-OUT',
    'Golden Hour Garden Sit & Scent Exchange',
    'Sit on patio/balcony; let dog sniff a muslin cloth used by the baby to begin scent introduction.',
    'Warm layers, hot drink, baby muslin',
    'Parent, Baby, Dog',
    'Nature, Bonding, Pet-Prep',
  ],
  [
    1,
    'Indoor',
    'W1-D1-IN',
    'Lo-Fi Lounge & First Prints',
    "Dim lights, play autumn visualizer/music. Use inkless pad for baby's hand/footprints in book.",
    'TV/Audio, inkless print kit, baby book',
    'Parent, Baby',
    'Craft, Milestone, Rest',
    'Midwife call/visit (within 36h of discharge).',
  ],
  [
    2,
    'Outdoor',
    'W1-D2-OUT',
    'Crunchy Leaf Fresh Air Reset',
    'Take a slow, 10-minute stroll down the immediate street with pram and dog for gentle joint movement.',
    'Boots, pram, dog lead',
    'Parent, Baby, Dog',
    'Active-Light, Nature',
  ],
  [
    2,
    'Indoor',
    'W1-D2-IN',
    'Spiced Simmer & Nursery Banner',
    'Simmer apple juice/spices. Assemble felt/wooden letters for a personalized nursery name sign.',
    'Apple juice, cinnamon, oranges, craft letters',
    'Parent, Baby',
    'Craft, Sensory',
    'Track wet/dirty nappies (monitor meconium shift).',
  ],
  [
    3,
    'Outdoor',
    'W1-D3-OUT',
    'Golden Hour Porch Greeting',
    'Wrap in a duvet, sit on doorstep/bench during late afternoon sunset with dog while baby sleeps.',
    'Giant duvet, baby carrier',
    'Parent, Baby, Dog',
    'Rest, Nature',
  ],
  [
    3,
    'Indoor',
    'W1-D3-IN',
    'Autumn Scent Pot & Knit Photo',
    'Simmer orange/rosemary. Lay baby on chunky knit blanket in a soft jumper for a smartphone photoshoot.',
    'Oranges, rosemary, pot, chunky blanket, knit hat',
    'Parent, Baby',
    'Craft, Sensory, Memory',
    'Milk transition/engorgement check; practice feeding.',
  ],
  [
    4,
    'Outdoor',
    'W1-D4-OUT',
    'Woodland Sound Bath & Forage',
    'Drive/walk to quiet wooded path. Sit for 15 mins listening to leaves while partner/dog collect pinecones.',
    'Basket, warm coats, dog lead',
    'Partner, Dog (Parent resting)',
    'Active-Light, Nature',
  ],
  [
    4,
    'Indoor',
    'W1-D4-IN',
    'Texture Play & Milestone Board',
    "Paint a wooden milestone chalkboard. Brush collected clean leaves/acorns against baby's hands/feet.",
    'Chalkboard paint, board, clean leaves',
    'Parent, Baby',
    'Craft, Sensory',
    'Cluster feeding peaks (prep sofa hydration/snack station).',
  ],
  [
    5,
    'Outdoor',
    'W1-D5-OUT',
    'Thermos & Coffee Bench Date',
    'Put baby in pram/wrap, walk dog to local café for a seasonal takeaway drink. Rest on bench.',
    'Pram, travel flask, wallet',
    'Parent, Baby, Dog',
    'Social, Active-Light',
  ],
  [
    5,
    'Indoor',
    'W1-D5-IN',
    'PJ Movie Marathon & Shadow Box',
    'Assemble shadow box with hospital ID bands and ultrasound. No-real-clothes movie day.',
    'PJs, shadow box, ID bands, ultrasound photo',
    'Parent, Baby, Partner',
    'Craft, Rest, Memory',
    'Day 5 heel prick test & baseline weight (midwife visit).',
  ],
  [
    6,
    'Outdoor',
    'W1-D6-OUT',
    'Local Park Picnic Bench',
    'Pack a flask of hot soup and crusty bread. Sit at a park bench for a 20-minute rustic lunch.',
    'Flask, soup, bread',
    'Parent, Baby, Partner, Dog',
    'Food, Nature',
  ],
  [
    6,
    'Indoor',
    'W1-D6-IN',
    'Pumpkin Bake & Leaf Mobile',
    'Bake pumpkin bread. Tie preserved leaves/felt to a wooden hoop to hang near changing table.',
    'Baking mix, wooden hoop, twine, leaves',
    'Parent, Baby',
    'Craft, Food',
    'First top-and-tail wash; umbilical cord stump check.',
  ],
  [
    7,
    'Outdoor',
    'W1-D7-OUT',
    'The Whole-Pack Stroll',
    'Take longest walk of the week (20-30 mins) around a local park/common, letting dog lead.',
    'Pram/Carrier, dog lead',
    'Full Family, Dog',
    'Active-Medium',
  ],
  [
    7,
    'Indoor',
    'W1-D7-IN',
    'Autumn Journaling & Flat-Lay',
    'Arrange flat-lay on bed with pumpkins/blankets for 1-week photo. Log milestones in journal.',
    'Journal, pen, small pumpkins, milestone board',
    'Parent, Baby',
    'Memory, Rest',
    'Register baby at local GP surgery.',
  ],
  [
    8,
    'Outdoor',
    'W2-D8-OUT',
    'The Great Autumn Scavenger Hunt',
    'Give stepdaughter a list (reddest leaf, acorn cap, glossy conker, unusual twig) to find in the park.',
    'Printed list, collection bag',
    'Stepdaughter, Dog, Partner',
    'Active, Game, Sibling',
  ],
  [
    8,
    'Indoor',
    'W2-D8-IN',
    'Pressed Leaf Art',
    'Press collected leaves into heavy books or layer between wax paper for bookmarks/wall art.',
    'Heavy books, wax paper, leaves',
    'Stepdaughter, Parent',
    'Craft, Indoor-Focus',
  ],
  [
    9,
    'Outdoor',
    'W2-D9-OUT',
    'Pumpkin Patch / Farm Shop Visit',
    'Visit local patch. Let stepdaughter choose unique pumpkins (white, bumpy, classic).',
    'Car/transport, reusable bags',
    'Full Family',
    'Active, Excursion',
  ],
  [
    9,
    'Indoor',
    'W2-D9-IN',
    'Pumpkin No-Carve Painting',
    'Stepdaughter uses paints/sharpies/glitter to decorate pumpkins at table while parent holds baby.',
    'Pumpkins, acrylic paint, sharpies, glitter',
    'Stepdaughter, Parent, Baby',
    'Craft, Mess-Free',
  ],
  [
    10,
    'Outdoor',
    'W2-D10-OUT',
    'The Sunset Dog Walk',
    'Bundle up full family for a walk right at sunset to observe autumn sky gradients.',
    'Warm coats, dog lead',
    'Full Family, Dog',
    'Nature, Routine',
  ],
  [
    10,
    'Indoor',
    'W2-D10-IN',
    'Hot Chocolate Charcuterie Board',
    'Stepdaughter constructs ultimate hot chocolates from a board of marshmallows, cream, and biscuits.',
    'Marshmallows, cream, cinnamon, chocolate, board',
    'Stepdaughter, Full Family',
    'Food, Treat, Sibling',
  ],
  [
    11,
    'Outdoor',
    'W2-D11-OUT',
    'Conker Tournament Collection',
    'Walk to a horse chestnut tree. Gather conkers. Stepdaughter teaches game rules or collects for decor.',
    'Collection bags',
    'Stepdaughter, Parent, Dog',
    'Active, Game, Nature',
  ],
  [
    11,
    'Indoor',
    'W2-D11-IN',
    'Autumn Leaf Fairy Lights',
    "Tape preserved leaves along a string of warm fairy lights in stepdaughter's room or living room.",
    'Preserved leaves, tape, LED fairy lights',
    'Stepdaughter, Parent',
    'Craft, Decor',
  ],
  [
    12,
    'Outdoor',
    'W2-D12-OUT',
    'Outdoor Photography Challenge',
    'Challenge stepdaughter to capture autumn textures (bark, frost, dog running) on a phone/camera.',
    'Smartphone or digital camera',
    'Stepdaughter, Dog',
    'Creative, Tech',
  ],
  [
    12,
    'Indoor',
    'W2-D12-IN',
    'Baking Autumn Cookies',
    'Bake cinnamon sugar cookies. Stepdaughter mixes/cuts; parent sits nearby as "head chef judge."',
    'Cookie ingredients, leaf cutters',
    'Stepdaughter, Parent, Baby',
    'Food, Baking, Sibling',
  ],
  [
    13,
    'Outdoor',
    'W2-D13-OUT',
    'Local Autumn Festival / Market',
    'Stroll through weekend market/street food event for crafts and roasted nut smells.',
    'Wallet, pram, comfortable shoes',
    'Full Family',
    'Excursion, Social',
  ],
  [
    13,
    'Indoor',
    'W2-D13-IN',
    'Cozy Living Room Camp-In',
    'Build a massive blanket fort using chairs/fairy lights. Eat dinner inside fort with full family.',
    'Blankets, chairs, fairy lights, easy dinner',
    'Full Family, Dog',
    'Play, Memory',
  ],
  [
    14,
    'Outdoor',
    'W2-D14-OUT',
    'The Whole-Pack Autumn Picnic',
    'Pack warm soup, crusty bread, blankets. Head to park spot for a quick, crisp autumn picnic.',
    'Thermos, picnic blanket, bread, soup',
    'Full Family, Dog',
    'Food, Nature',
  ],
  [
    14,
    'Indoor',
    'W2-D14-IN',
    'Family Handprint Tree',
    'Paint a tree trunk, use handprints (Partner, Parent, Stepdaughter) + baby foot + dog paw for leaves.',
    'Large paper, non-toxic autumn paints, wipes',
    'Full Family, Dog',
    'Craft, Keepsake',
  ],
]

export const ARRIVAL_ACTIVITIES: ArrivalActivity[] = ROWS.map(([day, env, id, title, what, props, who, tags, focus]) => ({
  id,
  day,
  env,
  title,
  what,
  props: split(props),
  who,
  tags: split(tags),
  focus,
}))

export const ARRIVAL_MEALS: ArrivalMeal[] = [
  {
    id: 'M-B1',
    meal: 'Breakfast',
    name: 'Prep-Ahead Autumn Baked Oatmeal',
    what: 'Oats baked with diced apples, cinnamon, maple syrup, and walnuts.',
    hack: 'Bake tray night before (or buy pre-made). Scoop, splash milk, microwave 60s.',
    prep: '1 min (morning) / 30 min (night before)',
    style: 'Bowl & spoon',
    ingredients: 'Oats, apples, cinnamon, walnuts, maple syrup',
    diet: 'Slow-release energy, fibre',
  },
  {
    id: 'M-B2',
    meal: 'Breakfast',
    name: 'Spiced Apple & Cinnamon Overnight Oats',
    what: 'Oats soaked overnight with grated apple, chia seeds, and mixed spice.',
    hack: 'Assemble 3-4 jars at once in fridge. Eat cold straight from jar or warm up.',
    prep: '0 min (morning) / 10 min (batch)',
    style: 'One-handed (jar)',
    ingredients: 'Oats, milk/yoghurt, grated apple, chia',
    diet: 'High-fibre, hydrating',
  },
  {
    id: 'M-B3',
    meal: 'Breakfast',
    name: 'Loaded Autumn Toast',
    what: 'Thick granary/sourdough toast with mashed avocado/chilli or almond butter/banana.',
    hack: 'Toaster does the work. 3 minutes to assemble.',
    prep: '3 min',
    style: 'One-handed',
    ingredients: 'Sourdough, avocado/almond butter, banana',
    diet: 'Healthy fats, quick energy',
  },
  {
    id: 'M-B4',
    meal: 'Breakfast',
    name: 'Greek Yoghurt & Fig Bowls',
    what: 'Thick Greek yoghurt, honey, granola, and chopped fresh figs or berries.',
    hack: 'Zero cooking. Keep ingredients grouped on one fridge shelf for 60-second assembly.',
    prep: '1 min',
    style: 'Bowl & spoon',
    ingredients: 'Greek yoghurt, figs/berries, honey, granola',
    diet: 'High-protein, probiotic',
  },
  {
    id: 'M-L1',
    meal: 'Lunch',
    name: 'Thermos Soup & Crusty Bread',
    what: 'Butternut squash or creamy tomato soup with pre-sliced sourdough baguette.',
    hack: 'Heat morning-of, pour into a Thermos to stay hot all day. Sip when free.',
    prep: '3 min (morning)',
    style: 'One-handed (drinkable)',
    ingredients: 'Fresh soup tub, sourdough, salted butter',
    diet: 'Comfort, hydrating',
  },
  {
    id: 'M-L2',
    meal: 'Lunch',
    name: "High-Protein Autumn Ploughman's",
    what: 'Grazing plate of cheddar, ham/turkey, apple, grapes, walnuts, crackers.',
    hack: 'Pull items from fridge, arrange on board. Graze over hours if needed.',
    prep: '2 min',
    style: 'Graze / one-handed',
    ingredients: 'Cheddar, ham/turkey, apple, grapes, crackers',
    diet: 'High-protein, keto-adaptable',
  },
  {
    id: 'M-L3',
    meal: 'Lunch',
    name: 'The Festive Autumn Toastie',
    what: 'Cheddar, sliced turkey, and cranberry sauce toasted between buttered bread.',
    hack: 'Use toastie maker or panini press for 4 minutes of entirely passive cooking.',
    prep: '4 min',
    style: 'One-handed',
    ingredients: 'Bread, cheddar, turkey, cranberry sauce',
    diet: 'Comfort, calorie-dense',
  },
  {
    id: 'M-L4',
    meal: 'Lunch',
    name: 'Warm Spiced Chickpea & Feta Wrap',
    what: 'Tortilla filled with warmed canned chickpeas (paprika), feta, spinach, tzatziki.',
    hack: 'Canned chickpeas need zero prep. Warm quickly in pan, wrap tightly in foil to stop drips.',
    prep: '5 min',
    style: 'One-handed',
    ingredients: 'Wraps, canned chickpeas, feta, spinach, tzatziki',
    diet: 'Vegetarian, iron/protein',
  },
]

/** Days covered by the pack. */
export const ARRIVAL_DAYS = 14
