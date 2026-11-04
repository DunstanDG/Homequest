import type { ItemGenerator } from '@/engine/registry'
import type { Figure } from '@/engine/types'
import { matchItem } from '../kit'
import { bankGenerators, classifyGenerators, G, num, type Bank } from './factory'

// =====================================================================================================================
// Rocks
// =====================================================================================================================

const ROCK_TYPES = ['Igneous', 'Sedimentary', 'Metamorphic'] as const
const ROCK_MEANS: Record<string, string> = {
  Igneous: 'Formed when molten magma or lava cools and hardens into crystals.',
  Sedimentary: 'Formed from layers of sediment that are squashed and cemented together.',
  Metamorphic: 'Formed when existing rock is changed by great heat and/or pressure.',
}
const ROCKS: [string, (typeof ROCK_TYPES)[number]][] = [
  ['granite', 'Igneous'],
  ['basalt', 'Igneous'],
  ['limestone', 'Sedimentary'],
  ['sandstone', 'Sedimentary'],
  ['chalk', 'Sedimentary'],
  ['shale', 'Sedimentary'],
  ['marble', 'Metamorphic'],
  ['slate', 'Metamorphic'],
]

const rocks: Bank = {
  skill: 'rocks.types',
  mcqs: [
    {
      q: 'In which type of rock are you most likely to find fossils?',
      a: 'Sedimentary',
      wrong: [
        { label: 'Igneous', misconception: 'fossils-igneous', feedback: 'Igneous rock forms from molten rock, which would destroy any remains.' },
        { label: 'Metamorphic', misconception: 'fossils-metamorphic', feedback: 'Heat and pressure usually destroy fossils as the rock changes.' },
      ],
      keepOrder: true,
      hint: 'Fossils form when remains are buried gently in layers of sediment.',
      why: 'Sedimentary rocks build up in layers, often on the sea bed, so shells and bones can be buried and preserved as fossils.',
      lv: [1, 3],
    },
    {
      q: 'Granite has large crystals but basalt has tiny crystals, although both are igneous. Why?',
      a: 'Granite cooled slowly deep underground; basalt cooled quickly at the surface',
      wrong: [
        { label: 'Granite cooled quickly; basalt cooled slowly', misconception: 'cooling-reversed', feedback: 'It is the other way round: slow cooling gives crystals time to grow large.' },
        'Granite is older, so its crystals have had time to grow since',
        'Basalt has been squashed by pressure, breaking its crystals',
      ],
      hint: 'Crystals need time to grow.',
      why: 'Magma that cools slowly underground (intrusive) forms large crystals, like granite. Lava that cools quickly at the surface (extrusive) forms small crystals, like basalt.',
      lv: [4, 5],
    },
    {
      q: 'Marble is a metamorphic rock. Which rock was it before it was changed by heat and pressure?',
      a: 'Limestone',
      wrong: [{ label: 'Granite', misconception: 'marble-granite', feedback: 'Granite is igneous. Marble forms from limestone.' }, { label: 'Slate', misconception: 'marble-slate', feedback: 'Slate is itself metamorphic; it forms from shale or mudstone.' }, 'Basalt'],
      hint: 'Both are made of calcium carbonate.',
      why: 'Heat and pressure change limestone into marble. In the same way, shale or mudstone becomes slate.',
      lv: [3, 5],
    },
  ],
  orders: [
    {
      prompt: 'Put the stages in the formation of a sedimentary rock in order.',
      steps: ['Rocks are weathered and eroded', 'Sediment is transported by rivers', 'Sediment is deposited in layers, often on the sea bed', 'Layers are squashed by the weight above (compaction)', 'Minerals stick the grains together (cementation)'],
      direction: ['first', 'last'],
      hint: 'Rock has to be broken up before it can be carried anywhere.',
      why: 'Weathering and erosion break rock into sediment, which is transported and deposited in layers. Over millions of years the layers are compacted and cemented into rock.',
      lv: [3, 5],
    },
  ],
}

const rockGenerators: ItemGenerator[] = [
  ...classifyGenerators('rocks.types', {
    id: 'classify',
    categories: [...ROCK_TYPES],
    items: ROCKS,
    ask: (r) => `What type of rock is ${r}?`,
    hint: 'Igneous rocks have crystals from cooling; sedimentary rocks have layers or grains; metamorphic rocks were changed by heat and pressure.',
    means: ROCK_MEANS,
  }),
]

// =====================================================================================================================
// Weathering
// =====================================================================================================================

const weathering: Bank = {
  skill: 'rocks.weathering',
  terms: [
    { term: 'Weathering', def: 'The breakdown of rocks where they are, without them being moved' },
    { term: 'Erosion', def: 'The wearing away and removal of rock by a moving force such as water, ice or wind' },
    { term: 'Freeze-thaw', def: 'Water in a crack turns to ice, expands and widens the crack, again and again' },
    { term: 'Chemical weathering', def: 'Rock being dissolved or altered by reactions with rainwater, which is a weak acid' },
    { term: 'Biological weathering', def: 'Rock being broken up by plants and animals, such as roots growing into cracks' },
    { term: 'Onion-skin weathering', def: 'Outer layers of rock peeling off after repeated heating by day and cooling at night' },
    { term: 'Scree', def: 'A slope of broken, angular rock fragments at the foot of a cliff or steep hillside' },
  ],
  orders: [
    {
      prompt: 'Put the stages of freeze-thaw weathering in order.',
      steps: ['Rainwater collects in a crack in the rock', 'At night the water freezes and expands', 'The ice pushes against the sides and widens the crack', 'By day the ice melts and water seeps deeper', 'After many cycles, pieces of rock break off'],
      direction: ['first', 'last'],
      hint: 'Water gets bigger (by about 9%) when it freezes.',
      why: 'Water expands by about 9% when it freezes. Repeated freezing and thawing widens cracks until fragments break off, often forming scree.',
      lv: [2, 4],
    },
  ],
  mcqs: [
    {
      q: 'What is the difference between weathering and erosion?',
      a: 'Weathering breaks rock down where it is; erosion wears it away and carries it off',
      wrong: [
        { label: 'They mean exactly the same thing', misconception: 'weathering-erosion-same', feedback: 'They are different: weathering happens in place; erosion involves movement.' },
        { label: 'Erosion happens in place; weathering moves the rock', misconception: 'weathering-erosion-swapped', feedback: 'It is the other way round.' },
        'Weathering only happens at the coast',
      ],
      hint: 'Which word involves something moving the rock away?',
      why: 'Weathering is breakdown in situ (in place). Erosion is wearing away by a moving agent: rivers, waves, ice or wind.',
      lv: [1, 3],
    },
    {
      q: 'In which conditions is freeze-thaw weathering most common?',
      a: 'Where temperatures often go above and below 0°C, such as UK mountains',
      wrong: [{ label: 'In tropical rainforests', misconception: 'freeze-hot', feedback: 'It never freezes there, so freeze-thaw cannot happen.' }, { label: 'Where it is below freezing all year', misconception: 'always-frozen', feedback: 'If it never thaws, there is no repeated cycle.' }, 'Under the sea'],
      hint: 'It needs both freezing and thawing.',
      why: 'Freeze-thaw needs temperatures to swing above and below freezing many times, as on UK mountains in winter.',
      lv: [3, 5],
    },
    {
      q: 'Why is limestone especially affected by chemical weathering?',
      a: 'It is made of calcium carbonate, which slowly dissolves in rainwater (a weak acid)',
      wrong: [{ label: 'It is very soft and crumbles when touched', misconception: 'soft-limestone', feedback: 'Limestone is fairly hard. It is its chemistry that makes it dissolve.' }, 'It contains a lot of ice', 'It is always found at the coast'],
      hint: 'Rain absorbs carbon dioxide and becomes slightly acidic.',
      why: 'Rainwater absorbs carbon dioxide, forming a weak carbonic acid. This reacts with the calcium carbonate in limestone and dissolves it, widening joints and forming features such as caves.',
      lv: [4, 5],
    },
  ],
}

// =====================================================================================================================
// Water cycle
// =====================================================================================================================

const waterCycle: Bank = {
  skill: 'rivers.water-cycle',
  noun: 'process',
  terms: [
    { term: 'Evaporation', def: 'Liquid water is heated by the Sun and turns into water vapour' },
    { term: 'Condensation', def: 'Water vapour cools and turns back into liquid droplets, forming clouds' },
    { term: 'Precipitation', def: 'Water falling from clouds as rain, sleet, snow or hail' },
    { term: 'Transpiration', def: 'Water vapour is given off by plants through their leaves' },
    { term: 'Interception', def: 'Rain is caught by leaves and branches before it reaches the ground' },
    { term: 'Infiltration', def: 'Water soaks down into the soil' },
    { term: 'Surface run-off', def: 'Water flows over the surface of the ground' },
  ],
  orders: [
    {
      prompt: 'Put this journey of water through the water cycle in order.',
      steps: ['Water evaporates from the sea', 'Water vapour rises and cools', 'It condenses to form clouds', 'Precipitation falls on the land', 'Water flows into rivers', 'Rivers carry it back to the sea'],
      direction: ['first', 'last'],
      hint: 'Start with the Sun heating the sea.',
      why: 'Evaporation, then cooling and condensation into clouds, then precipitation, then the water returns to the sea through rivers and groundwater.',
      lv: [1, 3],
    },
  ],
  mcqs: [
    {
      q: 'Why is the global water cycle called a "closed system"?',
      a: 'The total amount of water on Earth stays the same; it just moves between stores',
      wrong: [{ label: 'Water cannot leave the oceans', misconception: 'oceans-closed', feedback: 'Water leaves the oceans all the time by evaporation. The point is that no water enters or leaves the Earth as a whole.' }, 'Rivers are blocked by dams', 'It only works at night'],
      hint: 'Is any water added from space, or lost to space?',
      why: 'Water is not gained or lost from the Earth; it moves between stores (oceans, ice, air, ground, rivers) by flows such as evaporation and precipitation.',
      lv: [3, 5],
    },
    {
      q: 'Where is most of the Earth\'s water stored?',
      a: 'In the oceans',
      wrong: [{ label: 'In ice sheets and glaciers', misconception: 'ice-store', feedback: 'Ice holds most of the FRESH water, but the oceans hold far more water in total (about 97%).' }, 'In rivers and lakes', 'In the atmosphere'],
      hint: 'They cover about 70% of the planet.',
      why: 'About 97% of all water is salty ocean water. Most fresh water is locked up in ice.',
      lv: [2, 4],
    },
  ],
}

// =====================================================================================================================
// Drainage basins
// =====================================================================================================================

const drainage: Bank = {
  skill: 'rivers.drainage-basin',
  noun: 'feature',
  terms: [
    { term: 'Drainage basin', def: 'The area of land drained by a river and its tributaries' },
    { term: 'Source', def: 'The place where a river begins' },
    { term: 'Mouth', def: 'Where a river ends, flowing into the sea or a lake' },
    { term: 'Tributary', def: 'A smaller stream or river that flows into a larger one' },
    { term: 'Confluence', def: 'The point where two rivers join' },
    { term: 'Watershed', def: 'The boundary of high ground separating one river basin from the next' },
    { term: 'Estuary', def: 'The wide, tidal part of a river near the sea, where fresh and salt water mix' },
    { term: 'Throughflow', def: 'Water moving sideways through the soil towards the river' },
    { term: 'Percolation', def: 'Water moving down from the soil into the rock below' },
  ],
  mcqs: [
    {
      q: 'After weeks of rain, the ground is saturated. What happens to further rainfall?',
      a: 'More of it becomes surface run-off, reaching the river quickly',
      wrong: [{ label: 'It all infiltrates into the soil', misconception: 'saturated-infiltration', feedback: 'Saturated soil is full of water, so it cannot take in any more.' }, 'It all evaporates straight away', 'It is all intercepted by trees'],
      hint: 'Saturated means "full up".',
      why: 'When the soil cannot hold any more water, rain runs over the surface instead, reaching the river quickly and raising the risk of flooding.',
      lv: [2, 4],
    },
    {
      q: 'How does building a town with tarmac and concrete affect a drainage basin?',
      a: 'Less water infiltrates, so more surface run-off reaches the river faster',
      wrong: [{ label: 'More water infiltrates into the ground', misconception: 'impermeable', feedback: 'Tarmac and concrete are impermeable: water cannot soak through them.' }, 'It has no effect on rivers', 'It increases interception by trees'],
      hint: 'Can water soak through a car park?',
      why: 'Impermeable surfaces stop infiltration, and drains carry water quickly to rivers, so river levels rise faster and higher.',
      lv: [3, 5],
    },
  ],
}

// =====================================================================================================================
// River processes
// =====================================================================================================================

const processes: Bank = {
  skill: 'rivers.processes',
  noun: 'process',
  terms: [
    { term: 'Hydraulic action', def: 'The force of the water hitting the bed and banks, forcing air into cracks and breaking rock apart' },
    { term: 'Abrasion', def: 'Rocks carried by the river scrape and wear away the bed and banks, like sandpaper' },
    { term: 'Attrition', def: 'Rocks carried by the river knock into each other, becoming smaller and rounder' },
    { term: 'Solution', def: 'Some rocks, such as limestone, are dissolved by the slightly acidic river water' },
    { term: 'Traction', def: 'Large boulders are rolled along the river bed' },
    { term: 'Saltation', def: 'Small pebbles and stones are bounced along the river bed' },
    { term: 'Suspension', def: 'Fine particles such as silt and clay are carried along within the water' },
    { term: 'Deposition', def: 'The river drops the material it is carrying because it has lost energy' },
  ],
  orders: [
    {
      prompt: 'Put the ways a river transports material in order, from the largest particles to the smallest.',
      steps: ['Traction (rolled)', 'Saltation (bounced)', 'Suspension (carried in the water)', 'Solution (dissolved)'],
      direction: ['largest', 'smallest'],
      hint: 'The heaviest material is only moved along the bed.',
      why: 'Boulders are rolled (traction), pebbles bounce (saltation), silt and clay float (suspension), and dissolved minerals are carried in solution.',
      lv: [3, 5],
    },
  ],
  mcqs: [
    {
      q: 'Where in a river is deposition most likely to happen?',
      a: 'On the inside of a meander bend, where the water is slow and shallow',
      wrong: [
        { label: 'On the outside of a meander bend', misconception: 'outside-bend', feedback: 'The outside of the bend has the fastest, deepest water, so erosion happens there.' },
        'At the top of a waterfall',
        'Where the river is flowing fastest',
      ],
      hint: 'Deposition happens when the river loses energy.',
      why: 'Water flows slowest on the inside of a bend, so it loses energy and drops sediment, forming a slip-off slope.',
      lv: [2, 4],
    },
    {
      q: 'Why are pebbles near a river\'s mouth usually smaller and rounder than near its source?',
      a: 'Attrition has knocked them together over a long journey, breaking off corners',
      wrong: [{ label: 'Hydraulic action has polished them', misconception: 'hydraulic-rounds', feedback: 'Hydraulic action breaks rock from the banks and bed. It is attrition that rounds the stones.' }, 'Larger pebbles are carried out to sea first', 'Rivers deposit only small pebbles at their source'],
      hint: 'Which process involves rocks hitting each other?',
      why: 'As stones travel downstream they knock into each other (attrition), so they become smaller and rounder.',
      lv: [3, 5],
    },
  ],
}

const processGenerators: ItemGenerator[] = classifyGenerators('rivers.processes', {
  id: 'kind',
  categories: ['Erosion', 'Transportation', 'Deposition'],
  items: [
    ['hydraulic action', 'Erosion'],
    ['abrasion', 'Erosion'],
    ['attrition', 'Erosion'],
    ['traction', 'Transportation'],
    ['saltation', 'Transportation'],
    ['suspension', 'Transportation'],
    ['a river dropping sand as it slows down at its mouth', 'Deposition'],
    ['silt being left on the floodplain after a flood', 'Deposition'],
  ],
  ask: (x) => `Is this a type of erosion, transportation or deposition: ${x}?`,
  hint: 'Erosion wears away; transportation carries; deposition drops.',
  means: {
    Erosion: 'Wearing away the bed, banks or the load itself.',
    Transportation: 'Carrying material along with the flow.',
    Deposition: 'Dropping material when the river loses energy.',
  },
  lv: [1, 4],
})

// =====================================================================================================================
// Course of a river
// =====================================================================================================================

const longProfile: Bank = {
  skill: 'rivers.long-profile',
  mcqs: [
    {
      q: 'Which type of erosion is dominant in the upper course of a river?',
      a: 'Vertical erosion, which deepens the channel',
      wrong: [{ label: 'Lateral erosion, which widens the channel', misconception: 'lateral-upper', feedback: 'Lateral (sideways) erosion is more important in the middle and lower course.' }, 'There is no erosion in the upper course', 'Coastal erosion'],
      hint: 'The river is high above sea level here and cuts downwards.',
      why: 'In the upper course the river is far above sea level, so it uses its energy to cut down, forming steep V-shaped valleys.',
      lv: [2, 4],
    },
    {
      q: 'A river\'s gradient gets gentler downstream, yet its velocity usually increases. Why?',
      a: 'The channel is deeper and smoother, so there is less friction, and tributaries add more water',
      wrong: [
        { label: 'Rivers always speed up as they get flatter', misconception: 'flatter-faster', feedback: 'A gentler slope on its own would slow the water. It is the reduced friction and greater volume that matter.' },
        'The tide pulls the water towards the sea',
        'There are more waterfalls in the lower course',
      ],
      hint: 'Think about how much of the water touches the bed and banks.',
      why: 'In the upper course a lot of water is slowed by friction with boulders. Downstream the channel is wider, deeper and smoother, so less water is in contact with the bed and banks, and tributaries add volume.',
      lv: [4, 5],
    },
    {
      q: 'What shape is a river valley in its upper course?',
      a: 'A steep-sided V-shape',
      wrong: [{ label: 'A wide, flat U-shape', misconception: 'u-river', feedback: 'U-shaped valleys are carved by glaciers. Rivers in the upper course make V-shaped valleys.' }, 'A wide, flat floodplain', 'A circular basin'],
      hint: 'The river cuts down while weathering wears back the sides.',
      why: 'The river erodes vertically while weathering and mass movement wear back the valley sides, giving a V-shape.',
      lv: [1, 3],
    },
  ],
}

const COURSE_FEATURES: [string, 'Upper course' | 'Lower course'][] = [
  ['a steep-sided V-shaped valley', 'Upper course'],
  ['interlocking spurs', 'Upper course'],
  ['a waterfall and gorge', 'Upper course'],
  ['large, angular boulders in the channel', 'Upper course'],
  ['a steep gradient', 'Upper course'],
  ['a wide, flat floodplain', 'Lower course'],
  ['levees along the banks', 'Lower course'],
  ['an estuary', 'Lower course'],
  ['small, rounded sediment and silt', 'Lower course'],
  ['the greatest discharge', 'Lower course'],
]

const DOWNSTREAM: [string, 'Increases' | 'Decreases'][] = [
  ['Discharge (volume of water)', 'Increases'],
  ['Channel width', 'Increases'],
  ['Channel depth', 'Increases'],
  ['Average velocity', 'Increases'],
  ['Gradient (steepness)', 'Decreases'],
  ['Size of the sediment', 'Decreases'],
]

const courseGenerators: ItemGenerator[] = [
  ...classifyGenerators('rivers.long-profile', {
    id: 'course',
    categories: ['Upper course', 'Lower course'],
    items: COURSE_FEATURES,
    ask: (f) => `Would you expect to find ${f} in the upper course or the lower course of a river?`,
    hint: 'The upper course is steep, high and rocky; the lower course is flat, wide and near the sea.',
    means: {
      'Upper course': 'Steep, narrow and high up, with vertical erosion.',
      'Lower course': 'Wide, deep and flat, near the mouth, with lots of deposition.',
    },
    lv: [1, 3],
  }),
  ...classifyGenerators('rivers.long-profile', {
    id: 'downstream',
    categories: ['Increases', 'Decreases'],
    items: DOWNSTREAM,
    ask: (f) => `As you go downstream from source to mouth, what usually happens to: ${f.toLowerCase()}?`,
    hint: 'More tributaries join as you go downstream, and the river wears its load down.',
    means: {
      Increases: 'It gets bigger downstream (the Bradshaw model).',
      Decreases: 'It gets smaller downstream (the Bradshaw model).',
    },
    lv: [2, 4],
  }),
]

// =====================================================================================================================
// River landforms
// =====================================================================================================================

const landforms: Bank = {
  skill: 'rivers.landforms',
  noun: 'landform',
  terms: [
    { term: 'Waterfall', def: 'A sudden drop in a river where it flows over a band of hard rock on top of softer rock' },
    { term: 'Plunge pool', def: 'A deep pool eroded at the foot of a waterfall' },
    { term: 'Gorge', def: 'A narrow, steep-sided valley left as a waterfall retreats upstream' },
    { term: 'Meander', def: 'A large bend in a river' },
    { term: 'Ox-bow lake', def: 'A horseshoe-shaped lake left when a meander is cut off from the river' },
    { term: 'Floodplain', def: 'The wide, flat area of land beside a river that floods when it overflows' },
    { term: 'Levee', def: 'A raised bank along a river, built up by deposition during floods' },
    { term: 'Interlocking spurs', def: 'Ridges of high land that the river winds around in its upper course, like the teeth of a zip' },
    { term: 'River cliff', def: 'A steep bank on the outside of a bend, where erosion is greatest' },
    { term: 'Slip-off slope', def: 'A gentle slope of deposited sand and gravel on the inside of a bend' },
  ],
  orders: [
    {
      prompt: 'Put the stages in the formation of a waterfall in order.',
      steps: [
        'A river flows over a band of hard rock lying on top of softer rock',
        'The soft rock is eroded more quickly by hydraulic action and abrasion',
        'The hard rock is undercut, leaving an overhang',
        'A plunge pool is eroded at the foot of the falls',
        'The overhang becomes unsupported and collapses',
        'The waterfall retreats upstream, leaving a gorge',
      ],
      direction: ['first', 'last'],
      hint: 'It all starts with two rocks that erode at different speeds.',
      why: 'Soft rock beneath hard rock is eroded faster, undercutting the hard rock. The overhang collapses, the falls move back upstream, and a gorge is left behind. (Example: High Force on the River Tees.)',
      lv: [3, 5],
    },
    {
      prompt: 'Put the stages in the formation of an ox-bow lake in order.',
      steps: [
        'Erosion on the outside of two bends narrows the neck of a meander',
        'The neck becomes very narrow',
        'During a flood the river cuts through the neck',
        'The river now flows along the new, straighter channel',
        'Deposition seals off the old meander',
        'The cut-off meander becomes an ox-bow lake',
      ],
      direction: ['first', 'last'],
      hint: 'Erosion is on the outside of each bend, so the two bends get closer together.',
      why: 'Lateral erosion on the outside of bends narrows the meander neck until a flood breaks through it. Deposition then seals off the old loop, leaving an ox-bow lake.',
      lv: [3, 5],
    },
    {
      prompt: 'Put the stages in the formation of levees in order.',
      steps: [
        'The river floods and spreads over the floodplain',
        'The water slows down and loses energy as it leaves the channel',
        'The heaviest material is dropped first, next to the river',
        'Finer silt is carried further and spread over the floodplain',
        'Repeated floods build up raised banks beside the river',
      ],
      direction: ['first', 'last'],
      hint: 'Which material would the water drop first as it slows down?',
      why: 'When the river floods, it loses energy as soon as it leaves the channel, so the coarsest material is dropped on the banks. Over many floods this builds levees.',
      lv: [4, 5],
    },
  ],
  links: [
    {
      prompt: 'Match each river landform to the main process that forms it.',
      pairs: [
        ['River cliff', 'Erosion on the outside of a bend, where water is fastest'],
        ['Slip-off slope', 'Deposition on the inside of a bend, where water is slowest'],
        ['Plunge pool', 'Hydraulic action and abrasion at the foot of a waterfall'],
        ['Levee', 'Deposition of the heaviest material on the banks during floods'],
        ['Gorge', 'A waterfall retreating upstream over time'],
      ],
      hint: 'Outside of a bend = fast = erosion. Inside = slow = deposition.',
      ask: (l) => `What forms this landform: ${l.toLowerCase()}?`,
      lv: [2, 4],
    },
  ],
  written: [
    {
      prompt: 'Explain how a waterfall forms. Use the correct geographical terms.',
      model: 'Waterfalls form where a river flows over a band of hard (resistant) rock lying on top of softer rock. The soft rock is eroded more quickly by hydraulic action and abrasion, which undercuts the hard rock and leaves an overhang. The falling water and rocks erode a deep plunge pool at the base. Eventually the overhang is unsupported and collapses into the plunge pool, so the waterfall retreats upstream, leaving a steep-sided gorge.',
      checklist: ['Mentions hard rock on top of soft rock', 'Names an erosion process (hydraulic action or abrasion)', 'Describes undercutting and an overhang that collapses', 'Mentions the plunge pool', 'Explains the waterfall retreating and forming a gorge'],
      hint: 'Hard rock, soft rock, undercut, overhang, collapse, retreat.',
      passMark: 3,
    },
    {
      prompt: 'Explain how an ox-bow lake forms.',
      model: 'An ox-bow lake forms from a meander. The fastest water flows on the outside of the bends, so lateral erosion (hydraulic action and abrasion) wears away the outer banks, while deposition happens on the inside. Over time the neck of land between two bends becomes narrower. During a flood the river cuts through the neck and takes the shorter, straighter route. Deposition seals off the old bend, leaving a horseshoe-shaped ox-bow lake.',
      checklist: ['Says erosion is on the outside of the bend', 'Says deposition is on the inside of the bend', 'Describes the neck narrowing', 'Mentions a flood cutting through the neck', 'Explains deposition sealing off the old meander'],
      hint: 'Start with where the water is fastest in a meander.',
      passMark: 3,
    },
  ],
}

// =====================================================================================================================
// Flooding
// =====================================================================================================================

const flooding: Bank = {
  skill: 'rivers.flooding',
  terms: [
    { term: 'Discharge', def: 'The volume of water flowing past a point in a river each second, measured in cumecs' },
    { term: 'Lag time', def: 'The time between peak rainfall and peak discharge' },
    { term: 'Flood hydrograph', def: 'A graph showing how a river\'s discharge changes after a rainstorm' },
    { term: 'Rising limb', def: 'The part of a hydrograph where discharge is increasing' },
    { term: 'Hard engineering', def: 'Building artificial structures, such as dams or flood walls, to control a river' },
    { term: 'Soft engineering', def: 'Working with natural processes to reduce flood risk, such as planting trees or letting land flood' },
  ],
  mcqs: [
    {
      q: 'Compared with a rural river, what does the hydrograph of a river flowing through a city usually show after a storm?',
      a: 'A shorter lag time and a higher peak discharge',
      wrong: [
        { label: 'A longer lag time and a lower peak', misconception: 'urban-hydrograph-reversed', feedback: 'That fits a forested rural basin. In cities, water reaches the river quickly over concrete and through drains.' },
        'Exactly the same shape',
        'No peak at all',
      ],
      hint: 'Think about concrete, tarmac and drains.',
      why: 'Impermeable surfaces and drains send water to the river quickly, so it rises sooner (shorter lag time) and higher (higher peak), increasing flood risk.',
      lv: [3, 5],
    },
    {
      q: 'Which of these is a HUMAN cause of flooding?',
      a: 'Cutting down trees in the drainage basin',
      wrong: [{ label: 'A long period of heavy rain', misconception: 'physical-human', feedback: 'Rainfall is a physical (natural) cause.' }, { label: 'Snow melting quickly in spring', misconception: 'physical-human', feedback: 'Snowmelt is a physical cause.' }, { label: 'Steep slopes in the drainage basin', misconception: 'physical-human', feedback: 'Relief is a physical cause.' }],
      hint: 'Which one is something people do?',
      why: 'Deforestation reduces interception and infiltration, so more water runs off quickly into the river. Urbanisation is another human cause.',
      lv: [1, 3],
    },
  ],
  written: [
    {
      prompt: 'A town keeps flooding. Evaluate whether hard engineering (such as flood walls) or soft engineering (such as planting trees upstream) would be the better solution.',
      model: 'Flood walls give immediate, reliable protection to the town centre and can be designed for a particular flood height, but they are expensive, can look ugly and may push the flood problem downstream. Planting trees upstream is cheaper, looks natural and increases interception and infiltration, slowing water down and also helping wildlife. However, trees take years to grow and may not stop a very large flood. The best solution may be a combination: walls to protect the most valuable buildings now, and trees for long-term, sustainable protection.',
      checklist: ['Gives an advantage of hard engineering', 'Gives a disadvantage of hard engineering', 'Gives an advantage and a disadvantage of soft engineering', 'Reaches a clear judgement with a reason'],
      hint: 'Think about cost, how quickly it works, how long it lasts, and the effect on the environment.',
    },
  ],
}

const floodGenerators: ItemGenerator[] = [
  G('rivers.flooding.lag-time', 'rivers.flooding', [2, 5], (rng, d) => {
    const rainPeak = d >= 5 ? rng.int(16, 23) : rng.int(6, 14)
    const lag = rng.int(d <= 2 ? 3 : 4, d >= 4 ? 14 : 9)
    const flowPeak = rainPeak + lag
    const fmtH = (h: number) => `${String(h % 24).padStart(2, '0')}:00${h >= 24 ? ' (next day)' : ''}`
    const figure: Figure = {
      type: 'table',
      head: ['', 'Time'],
      rows: [
        ['Rain starts', fmtH(rainPeak - rng.int(1, 3))],
        ['Peak rainfall', fmtH(rainPeak)],
        ['Peak discharge', fmtH(flowPeak)],
      ],
    }
    return num({
      prompt: 'The table shows information from a flood hydrograph. What was the lag time?',
      figure,
      answer: lag,
      suffix: 'hours',
      hint: 'Lag time is measured from PEAK rainfall to PEAK discharge.',
      explanation: `Peak rainfall was at ${fmtH(rainPeak)} and peak discharge at ${fmtH(flowPeak)}: a lag time of ${lag} hours.`,
      errors: [],
    })
  }),
  ...classifyGenerators('rivers.flooding', {
    id: 'hard-soft',
    categories: ['Hard engineering', 'Soft engineering'],
    items: [
      ['a dam and reservoir', 'Hard engineering'],
      ['concrete flood walls', 'Hard engineering'],
      ['straightening the river channel', 'Hard engineering'],
      ['a flood relief channel', 'Hard engineering'],
      ['planting trees in the drainage basin (afforestation)', 'Soft engineering'],
      ['not allowing building on the floodplain (zoning)', 'Soft engineering'],
      ['flood warnings', 'Soft engineering'],
      ['restoring wetlands so land can flood naturally', 'Soft engineering'],
    ],
    ask: (x) => `Is this hard or soft engineering: ${x}?`,
    hint: 'Hard engineering builds structures; soft engineering works with nature or changes how people use the land.',
    means: {
      'Hard engineering': 'Artificial structures that control the river; usually expensive but immediate.',
      'Soft engineering': 'Works with natural processes or plans land use; usually cheaper and more sustainable.',
    },
    lv: [1, 4],
  }),
]

// =====================================================================================================================
// Waves
// =====================================================================================================================

const waves: Bank = {
  skill: 'coasts.waves',
  terms: [
    { term: 'Fetch', def: 'The distance of open water over which the wind blows to create a wave' },
    { term: 'Constructive wave', def: 'A low, gentle wave with a strong swash and weak backwash that builds up beaches' },
    { term: 'Destructive wave', def: 'A tall, steep wave with a weak swash and strong backwash that erodes the coast' },
    { term: 'Swash', def: 'Water rushing up the beach after a wave breaks' },
    { term: 'Backwash', def: 'Water flowing back down the beach towards the sea' },
  ],
  mcqs: [
    {
      q: 'How are most sea waves formed?',
      a: 'By wind blowing over the surface of the sea',
      wrong: [{ label: 'By the Moon pulling the water', misconception: 'tides-waves', feedback: 'The Moon causes tides, the rise and fall of sea level. Everyday waves are made by wind.' }, 'By ships moving through the water', 'By rivers flowing into the sea'],
      hint: 'Blow across a cup of tea.',
      why: 'Friction between the wind and the sea surface transfers energy to the water, creating waves. Tides are a separate effect caused by the Moon.',
      lv: [1, 2],
    },
    {
      q: 'Which of these would create the biggest, most powerful waves?',
      a: 'A strong wind blowing for a long time over a long fetch',
      wrong: [{ label: 'A light breeze over a short fetch', misconception: 'fetch', feedback: 'Little wind and a short distance give small waves.' }, 'A strong wind blowing for a few minutes over a small lake', 'No wind but a very long fetch'],
      hint: 'Three things matter: wind strength, how long it blows, and the fetch.',
      why: 'Wave energy depends on wind speed, how long it blows and the fetch. South-west England gets big waves because winds blow over thousands of kilometres of Atlantic.',
      lv: [2, 4],
    },
    {
      q: 'Why do waves break as they approach the shore?',
      a: 'Friction with the sea bed slows the bottom of the wave, so the top topples over',
      wrong: [{ label: 'The wind suddenly stops at the coast', misconception: 'wind-stops', feedback: 'The wind does not stop. The shallow sea bed is the cause.' }, 'They hit the cliffs and bounce back', 'The water becomes saltier near the shore'],
      hint: 'What changes about the water depth near the shore?',
      why: 'In shallow water the base of the wave drags on the sea bed and slows down while the top keeps going, so the wave becomes steeper and breaks.',
      lv: [3, 5],
    },
    {
      q: 'Destructive waves usually happen more often per minute than constructive waves. What do they do to a beach?',
      a: 'Their strong backwash drags material away, making the beach narrower and steeper',
      wrong: [{ label: 'Their strong swash pushes material up, building the beach', misconception: 'destructive-build', feedback: 'That describes constructive waves.' }, 'They have no effect on beaches', 'They turn the sand into rock'],
      hint: 'Destructive = taking away.',
      why: 'Destructive waves are tall and frequent, with a backwash stronger than their swash, so they remove sediment and erode the coast.',
      lv: [3, 5],
    },
  ],
}

// =====================================================================================================================
// Coastal processes
// =====================================================================================================================

const coastProcesses: Bank = {
  skill: 'coasts.processes',
  noun: 'process',
  terms: [
    { term: 'Hydraulic action', def: 'Waves crash against the cliff, forcing air into cracks under pressure and breaking the rock' },
    { term: 'Abrasion', def: 'Waves throw sand and pebbles at the cliff, wearing it away like sandpaper' },
    { term: 'Attrition', def: 'Rocks carried by the waves knock into each other, becoming smaller and rounder' },
    { term: 'Solution', def: 'Sea water dissolves some rocks, such as chalk and limestone' },
    { term: 'Longshore drift', def: 'The movement of sediment along a coast in a zig-zag pattern by the swash and backwash' },
    { term: 'Mass movement', def: 'The downhill movement of rock and soil under gravity, such as slumping or rockfall' },
    { term: 'Slumping', def: 'Saturated soft rock, such as clay, slides down a cliff along a curved surface' },
  ],
  orders: [
    {
      prompt: 'Put the stages of longshore drift in order.',
      steps: [
        'The prevailing wind blows waves onto the beach at an angle',
        'The swash carries sediment up the beach at the same angle',
        'The backwash carries it straight back down the beach under gravity',
        'This repeats, moving sediment along the coast in a zig-zag',
        'Sediment is deposited where the coast changes direction or the water is sheltered',
      ],
      direction: ['first', 'last'],
      hint: 'The swash follows the wind; the backwash follows gravity.',
      why: 'Swash moves sediment up the beach at the angle of the wind; backwash brings it straight down. The repeated zig-zag moves it along the coast until it is deposited, for example forming a spit.',
      lv: [3, 5],
    },
  ],
  mcqs: [
    {
      q: 'In longshore drift, why does the backwash flow straight down the beach rather than at an angle?',
      a: 'It is pulled by gravity, which acts straight down the slope',
      wrong: [{ label: 'The wind blows it back out to sea', misconception: 'wind-backwash', feedback: 'The wind drives the swash. Backwash is controlled by gravity.' }, 'The tide turns it round', 'Groynes direct it'],
      hint: 'What force makes water run downhill?',
      why: 'Swash is driven by the wave at an angle, but backwash simply runs downhill under gravity, at right angles to the coastline.',
      lv: [3, 5],
    },
    {
      q: 'Why do clay cliffs often slump after heavy rain?',
      a: 'The clay becomes saturated, heavy and slippery, so it slides down a curved surface',
      wrong: [{ label: 'Rain freezes in the clay and splits it', misconception: 'freeze-thaw-clay', feedback: 'Freeze-thaw happens in hard rock with cracks. Clay slumps because it gets saturated.' }, 'Rain makes clay harder', 'Rain washes all the clay into the sea at once'],
      hint: 'What does wet clay feel like?',
      why: 'Rain soaks into the clay, adding weight and making it slippery. Waves undercut the base, and the cliff slumps down. (Example: the Holderness coast.)',
      lv: [3, 5],
    },
  ],
}

// =====================================================================================================================
// Coastal landforms
// =====================================================================================================================

const coastLandforms: Bank = {
  skill: 'coasts.landforms',
  noun: 'landform',
  terms: [
    { term: 'Headland', def: 'An area of hard rock sticking out into the sea' },
    { term: 'Bay', def: 'A curved inlet of the sea between two headlands, where softer rock has been eroded' },
    { term: 'Cave', def: 'A hollow eroded into a headland where a crack has been widened' },
    { term: 'Arch', def: 'A gap right through a headland, formed when a cave breaks through' },
    { term: 'Stack', def: 'A pillar of rock left standing in the sea when the roof of an arch collapses' },
    { term: 'Stump', def: 'A short piece of rock, often covered at high tide, left when a stack collapses' },
    { term: 'Wave-cut platform', def: 'A flat, rocky area at the foot of a cliff, exposed at low tide' },
    { term: 'Spit', def: 'A long, narrow ridge of sand or shingle stretching out from the coast into the sea' },
  ],
  orders: [
    {
      prompt: 'Put the stages in the erosion of a headland in order.',
      steps: ['A crack in the headland', 'Cave', 'Arch', 'Stack', 'Stump'],
      direction: ['first', 'last'],
      hint: 'Erosion makes the crack bigger and bigger until it goes right through.',
      why: 'Hydraulic action and abrasion widen a crack into a cave. The cave erodes through the headland to form an arch. The arch roof collapses, leaving a stack, which is eroded at its base until it falls, leaving a stump.',
      lv: [2, 4],
    },
    {
      prompt: 'Put the stages in the formation of a wave-cut platform in order.',
      steps: [
        'Waves erode the base of a cliff between high and low tide',
        'A wave-cut notch forms',
        'The cliff above is undercut and collapses',
        'The cliff retreats inland',
        'A flat wave-cut platform is left at the foot of the cliff',
      ],
      direction: ['first', 'last'],
      hint: 'Erosion is concentrated at the bottom of the cliff.',
      why: 'Erosion at the base forms a notch, the overhanging cliff collapses, and the process repeats so the cliff retreats, leaving a flat platform behind.',
      lv: [3, 5],
    },
    {
      prompt: 'Put the stages in the formation of a spit in order.',
      steps: [
        'Longshore drift carries sediment along the coast',
        'The coastline changes direction',
        'Sediment is deposited in the sheltered, calmer water',
        'The ridge of sediment grows out into the sea',
        'Changes in wind direction curve the end of the spit',
        'A salt marsh forms in the sheltered area behind',
      ],
      direction: ['first', 'last'],
      hint: 'Longshore drift keeps going when the coast turns a corner.',
      why: 'Longshore drift carries on depositing sediment where the coast bends, building a spit. Changing winds curve its end (a recurved tip), and the sheltered water behind becomes a salt marsh. (Example: Spurn Head.)',
      lv: [4, 5],
    },
  ],
  links: [
    {
      prompt: 'Match each UK place to the coastal landform it is famous for.',
      pairs: [
        ['Durdle Door, Dorset', 'Arch'],
        ['Old Harry Rocks, Dorset', 'Stack'],
        ['Spurn Head, Yorkshire', 'Spit'],
        ['Lulworth Cove, Dorset', 'Cove'],
      ],
      hint: 'Durdle "Door" has a hole right through it.',
      ask: (l) => `What landform is ${l} famous for?`,
      lv: [3, 4],
    },
  ],
  written: [
    {
      prompt: 'Explain how a stack forms from a headland.',
      model: 'Headlands are made of hard rock, but they have weaknesses such as cracks. Waves erode the crack by hydraulic action, forcing air into it, and by abrasion, throwing rocks at it. The crack widens into a cave. Erosion continues until the cave breaks through the headland, forming an arch. The roof of the arch is weathered and eroded from above and below until it collapses, leaving a stack standing on its own.',
      checklist: ['Starts with a crack or weakness in the headland', 'Names an erosion process', 'Describes the sequence cave, then arch', 'Explains the arch collapsing to leave a stack'],
      hint: 'Crack, cave, arch, stack: explain each change.',
    },
  ],
}

// =====================================================================================================================
// Coastal management
// =====================================================================================================================

const coastManagement: Bank = {
  skill: 'coasts.management',
  terms: [
    { term: 'Sea wall', def: 'A concrete wall, often curved, that reflects waves back out to sea' },
    { term: 'Groynes', def: 'Wooden or rock barriers built out into the sea to trap sediment moved by longshore drift' },
    { term: 'Rock armour', def: 'Large boulders piled at the foot of a cliff to absorb wave energy' },
    { term: 'Gabions', def: 'Wire cages filled with rocks that absorb wave energy' },
    { term: 'Beach nourishment', def: 'Adding sand or shingle to a beach to make it wider and higher' },
    { term: 'Managed retreat', def: 'Letting the sea flood low-value land in a controlled way to create a natural barrier such as a salt marsh' },
  ],
  mcqs: [
    {
      q: 'Groynes protect one beach well. What problem can they cause further along the coast (down-drift)?',
      a: 'Beaches there are starved of sand, so erosion increases',
      wrong: [{ label: 'Beaches there become much wider', misconception: 'groyne-downdrift', feedback: 'Groynes trap sediment, so less reaches beaches further along the coast.' }, 'The sea level rises there', 'Waves there get smaller'],
      hint: 'Groynes trap the sediment that longshore drift was carrying.',
      why: 'By trapping sediment, groynes stop it reaching beaches further along. Those beaches become narrower, so the cliffs behind them erode faster.',
      lv: [3, 5],
    },
    {
      q: 'Why is a sea wall usually only built to protect towns, not farmland?',
      a: 'It is very expensive, so it is only worth it where property is valuable',
      wrong: [{ label: 'Sea walls do not work on farmland', misconception: 'wall-farmland', feedback: 'They would work, but the cost would be more than the value of the land saved.' }, 'Farmers are not allowed near the sea', 'Farmland never erodes'],
      hint: 'Compare the cost of the wall with the value of what it protects.',
      why: 'Sea walls can cost thousands of pounds per metre. Decisions use cost-benefit analysis: valuable towns justify the cost; farmland often does not.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Evaluate the use of hard engineering compared with soft engineering to protect a stretch of coastline.',
      model: 'Hard engineering, such as sea walls and rock armour, gives strong, immediate protection to towns and can last for decades. However, it is very expensive, can look unnatural and may increase erosion further along the coast. Soft engineering, such as beach nourishment, works with natural processes, is cheaper and keeps the beach attractive for tourists, but it needs repeating every few years as sand is washed away. Overall, hard engineering is best for protecting valuable towns, while soft engineering is more sustainable for less built-up stretches of coast.',
      checklist: ['Gives a named example of hard engineering with an advantage', 'Gives a disadvantage of hard engineering', 'Gives a named example of soft engineering with an advantage and a disadvantage', 'Reaches a judgement that depends on the place or what is being protected'],
      hint: 'Consider cost, effectiveness, how long it lasts, appearance and effects further along the coast.',
    },
  ],
}

const coastManageGenerators: ItemGenerator[] = classifyGenerators('coasts.management', {
  id: 'hard-soft',
  categories: ['Hard engineering', 'Soft engineering'],
  items: [
    ['a sea wall', 'Hard engineering'],
    ['groynes', 'Hard engineering'],
    ['rock armour', 'Hard engineering'],
    ['gabions', 'Hard engineering'],
    ['beach nourishment', 'Soft engineering'],
    ['managed retreat', 'Soft engineering'],
    ['sand dune regeneration (planting marram grass)', 'Soft engineering'],
  ],
  ask: (x) => `Is this hard or soft coastal engineering: ${x}?`,
  hint: 'Hard engineering builds artificial structures; soft engineering works with natural processes.',
  means: {
    'Hard engineering': 'Artificial structures that resist the sea; effective but expensive.',
    'Soft engineering': 'Works with natural processes; cheaper and more sustainable but needs maintaining.',
  },
  lv: [1, 4],
})

// =====================================================================================================================
// Glaciation
// =====================================================================================================================

const glacialProcesses: Bank = {
  skill: 'glaciation.processes',
  noun: 'term',
  terms: [
    { term: 'Glacier', def: 'A large, slow-moving mass of ice that flows downhill' },
    { term: 'Plucking', def: 'Ice freezes onto rock and pulls pieces away as it moves' },
    { term: 'Abrasion', def: 'Rocks frozen into the base of the ice scrape the rock below, like sandpaper' },
    { term: 'Basal slip', def: 'The ice slides over the rock on a thin layer of meltwater' },
    { term: 'Accumulation', def: 'The build-up of snow and ice, mainly in winter' },
    { term: 'Ablation', def: 'The loss of ice by melting, mainly in summer' },
    { term: 'Erratic', def: 'A boulder carried by ice and dropped in an area of different rock' },
    { term: 'Striations', def: 'Long scratches on rock, showing the direction the ice moved' },
  ],
  mcqs: [
    {
      q: 'When did the last glacial period (ice age) end in Britain?',
      a: 'About 10,000 years ago',
      wrong: ['About 100 years ago', 'About 1,000 years ago', { label: 'About 65 million years ago', misconception: 'dinosaur-time', feedback: 'That is when the dinosaurs died out. The last ice age ended much more recently.' }],
      hint: 'It is recent in geological terms, but long before the Romans.',
      why: 'The last glacial period ended roughly 10,000 years ago. Glaciers then covered much of Scotland, Wales and northern England, and shaped places like the Lake District and Snowdonia.',
      lv: [2, 4],
    },
    {
      q: 'A glacier is advancing (getting longer). What does this tell you about its budget?',
      a: 'More snow and ice is being added (accumulation) than is melting (ablation)',
      wrong: [{ label: 'More ice is melting than is being added', misconception: 'budget-reversed', feedback: 'Then the glacier would retreat.' }, 'Accumulation and ablation are exactly equal', 'The glacier has stopped moving'],
      hint: 'Think of it like money in and money out.',
      why: 'If accumulation is greater than ablation, the glacier gains ice and advances. If ablation is greater, it retreats, as most glaciers are doing today.',
      lv: [3, 5],
    },
  ],
}

const glacialLandforms: Bank = {
  skill: 'glaciation.landforms',
  noun: 'landform',
  terms: [
    { term: 'Corrie', def: 'An armchair-shaped hollow high on a mountain, where a glacier began' },
    { term: 'Arête', def: 'A sharp, knife-edged ridge between two corries' },
    { term: 'Pyramidal peak', def: 'A pointed mountain top where three or more corries have formed back to back' },
    { term: 'U-shaped valley', def: 'A wide valley with steep sides and a flat floor, carved by a glacier' },
    { term: 'Hanging valley', def: 'A small side valley left high above the main valley floor, often with a waterfall' },
    { term: 'Ribbon lake', def: 'A long, narrow lake in a glacial valley where the ice eroded a deeper section' },
    { term: 'Truncated spur', def: 'A steep cliff on the side of a glacial valley where the ice cut off a ridge' },
    { term: 'Drumlin', def: 'An egg-shaped hill of material deposited by a glacier' },
    { term: 'Moraine', def: 'Rock and debris carried and then deposited by a glacier' },
  ],
  links: [
    {
      prompt: 'Match each place to the glacial landform it is a well-known example of.',
      pairs: [
        ['Striding Edge, Lake District', 'Arête'],
        ['Windermere, Lake District', 'Ribbon lake'],
        ['The Matterhorn, Alps', 'Pyramidal peak'],
        ['Red Tarn, Lake District', 'Corrie lake (tarn)'],
      ],
      hint: 'An "edge" is a sharp ridge; a "tarn" is a small mountain lake.',
      ask: (l) => `What glacial landform is ${l} an example of?`,
      lv: [3, 5],
    },
  ],
  orders: [
    {
      prompt: 'Put the stages in the formation of a corrie in order.',
      steps: [
        'Snow collects in a sheltered hollow on a mountainside',
        'The snow is compressed into ice',
        'Plucking and abrasion deepen the hollow as the ice moves with a rotational slide',
        'Freeze-thaw weathering steepens the back wall',
        'The ice melts, leaving an armchair-shaped hollow, often holding a lake (tarn)',
      ],
      direction: ['first', 'last'],
      hint: 'Every glacier starts as snow.',
      why: 'Snow builds up and turns to ice in a hollow. The ice erodes the hollow deeper by plucking and abrasion, while freeze-thaw steepens the back wall. When the ice melts, a corrie is left, often with a tarn.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Explain how a glacier changes a V-shaped river valley into a U-shaped valley.',
      model: 'During an ice age a glacier moves down the old river valley. Because the ice fills the whole valley, it erodes the sides and floor, not just a narrow channel. Plucking pulls away blocks of rock and abrasion scrapes the floor and sides, making the valley wider and deeper. The glacier is too powerful to bend around the interlocking spurs, so it cuts them off, leaving truncated spurs. When the ice melts, a wide, steep-sided, flat-floored U-shaped valley is left.',
      checklist: ['Says the glacier fills the whole valley', 'Names plucking or abrasion', 'Explains that the valley is widened and deepened', 'Mentions truncated spurs'],
      hint: 'How is a glacier different from a river flowing down the same valley?',
    },
  ],
}

const glacialGenerators: ItemGenerator[] = classifyGenerators('glaciation.landforms', {
  id: 'erosion-deposition',
  categories: ['Erosion', 'Deposition'],
  items: [
    ['a corrie', 'Erosion'],
    ['an arête', 'Erosion'],
    ['a pyramidal peak', 'Erosion'],
    ['a U-shaped valley', 'Erosion'],
    ['a truncated spur', 'Erosion'],
    ['a drumlin', 'Deposition'],
    ['terminal moraine', 'Deposition'],
    ['an erratic', 'Deposition'],
  ],
  ask: (x) => `Is ${x} formed mainly by glacial erosion or glacial deposition?`,
  hint: 'Erosional landforms are carved out of rock, high up; depositional ones are made of material the ice dropped.',
  means: {
    Erosion: 'Carved by plucking and abrasion, mostly in upland areas.',
    Deposition: 'Made of material dropped by the ice, often in lowland areas as it melted.',
  },
  lv: [1, 4],
})

// Constructive versus destructive waves, matched feature by feature.
const waveGenerators: ItemGenerator[] = [
  G('coasts.waves.sort', 'coasts.waves', [2, 4], (rng) => {
    const rows: [string, string, string][] = [
      ['Height', 'Low', 'High'],
      ['Shape', 'Long and flat', 'Tall and steep'],
      ['Stronger part of the wave', 'Swash', 'Backwash'],
      ['Effect on the beach', 'Builds it up', 'Erodes it'],
      ['Frequency', 'Fewer waves per minute', 'More waves per minute'],
    ]
    const pick = rng.shuffle(rows).slice(0, 2)
    const pairs = pick.flatMap(([what, con, des]) => [
      { left: `Constructive wave: ${what.toLowerCase()}`, right: con },
      { left: `Destructive wave: ${what.toLowerCase()}`, right: des },
    ])
    return matchItem({
      prompt: 'Match each feature to the right description.',
      pairs,
      hint: 'Constructive waves build beaches; destructive waves destroy them.',
      explanation: pick.map(([what, con, des]) => `${what}: constructive = ${con.toLowerCase()}; destructive = ${des.toLowerCase()}.`).join('\n'),
    })
  }),
]

const glacialNumeric: ItemGenerator[] = [
  G('glaciation.processes.budget', 'glaciation.processes', [3, 5], (rng) => {
    const acc = rng.int(20, 90) * 10
    let abl = rng.int(20, 90) * 10
    if (abl === acc) abl += 30
    const net = acc - abl
    return num({
      prompt: `In one year a glacier gains ${acc} units of ice by accumulation and loses ${abl} units by ablation. What is its net balance? (Use a minus sign for a loss.)`,
      answer: net,
      hint: 'Net balance = accumulation − ablation.',
      explanation: `${acc} − ${abl} = ${net}. ${net > 0 ? 'A positive balance means the glacier grows and advances.' : 'A negative balance means it shrinks and retreats.'}`,
      errors: [{ values: [-net], tag: 'budget-reversed', message: 'Subtract ablation (loss) from accumulation (gain), not the other way round.' }],
    })
  }),
]

// =====================================================================================================================


export const landscapesGenerators: ItemGenerator[] = [
  ...bankGenerators(rocks),
  ...rockGenerators,
  ...bankGenerators(weathering),
  ...bankGenerators(waterCycle),
  ...bankGenerators(drainage),
  ...bankGenerators(processes),
  ...processGenerators,
  ...bankGenerators(longProfile),
  ...courseGenerators,
  ...bankGenerators(landforms),
  ...bankGenerators(flooding),
  ...floodGenerators,
  ...bankGenerators(waves),
  ...waveGenerators,
  ...bankGenerators(coastProcesses),
  ...bankGenerators(coastLandforms),
  ...bankGenerators(coastManagement),
  ...coastManageGenerators,
  ...bankGenerators(glacialProcesses),
  ...glacialNumeric,
  ...bankGenerators(glacialLandforms),
  ...glacialGenerators,
]
