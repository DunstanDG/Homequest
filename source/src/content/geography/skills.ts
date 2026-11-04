import type { Skill } from '@/engine/types'

/**
 * GEOGRAPHY SKILL GRAPH - Key Stage 3 (Years 7-9), England national curriculum.
 *
 * Strands follow the usual KS3 scheme of work: locational knowledge, map and fieldwork skills, physical geography
 * (weather, biomes, rocks, rivers, coasts, glaciation, tectonics), human geography (population, settlement,
 * development, economic activity and resources), regional studies and environmental issues. Year 8 topics are the
 * densest because that is where she is now. Prerequisites answer "if she gets this wrong, what earlier idea is the
 * likely reason?"; they steer gap-finding and never gate access.
 */

const S = (
  id: string,
  year: number,
  strand: string,
  name: string,
  description: string,
  prereqs: string[],
  origin: Skill['origin'] = 'syllabus',
): Skill => ({ id: `geography.${id}`, subject: 'geography', year, strand, name, description, prereqs: prereqs.map((p) => `geography.${p}`), origin })

export const STRANDS = [
  'Locational knowledge',
  'Map and fieldwork skills',
  'Weather and climate',
  'Ecosystems and biomes',
  'Rocks and weathering',
  'Rivers',
  'Coasts',
  'Glaciation',
  'Tectonics',
  'Population',
  'Settlement and urbanisation',
  'Development',
  'Economic activity and resources',
  'Regional studies',
  'Environmental issues',
] as const

const LOC = 'Locational knowledge'
const MAP = 'Map and fieldwork skills'
const WX = 'Weather and climate'
const ECO = 'Ecosystems and biomes'
const ROCK = 'Rocks and weathering'
const RIV = 'Rivers'
const COAST = 'Coasts'
const ICE = 'Glaciation'
const TEC = 'Tectonics'
const POP = 'Population'
const URB = 'Settlement and urbanisation'
const DEV = 'Development'
const ECON = 'Economic activity and resources'
const REG = 'Regional studies'
const ENV = 'Environmental issues'

export const geographySkills: Skill[] = [
  // ------------------------------------------------------------ foundation (primary building block)
  S('maps.compass', 6, MAP, 'Compass directions', 'Use the eight points of a compass to describe direction on a map.', [], 'foundation'),

  // ------------------------------------------------------------ locational knowledge
  S('place.continents-oceans', 7, LOC, 'Continents and oceans', 'Name and locate the seven continents and five oceans, and which countries are in which continent.', []),
  S('place.uk', 7, LOC, 'The United Kingdom', 'The countries of the UK and their capitals, major cities, rivers, mountains and surrounding seas.', ['place.continents-oceans']),
  S('place.countries-capitals', 7, LOC, 'Countries and capitals', 'Match countries around the world to their capital cities.', ['place.continents-oceans']),
  S('place.lat-long', 7, LOC, 'Latitude and longitude', 'The Equator, tropics, Prime Meridian and hemispheres; giving a location as latitude and longitude.', ['place.continents-oceans', 'maps.compass']),
  S('place.time-zones', 8, LOC, 'Time zones', 'How longitude and the rotation of the Earth give different times around the world (15 degrees per hour).', ['place.lat-long']),

  // ------------------------------------------------------------ map and fieldwork skills
  S('maps.grid-4', 7, MAP, 'Four-figure grid references', 'Give and use four-figure grid references, eastings before northings.', ['maps.compass']),
  S('maps.grid-6', 7, MAP, 'Six-figure grid references', 'Give and use six-figure grid references by estimating tenths of a grid square.', ['maps.grid-4']),
  S('maps.scale', 7, MAP, 'Scale and distance', 'Use a map scale (1:25 000, 1:50 000) to work out real distances.', []),
  S('maps.symbols', 7, MAP, 'Ordnance Survey map symbols', 'Recognise common OS map symbols and what they show.', []),
  S('maps.relief', 8, MAP, 'Contours and relief', 'Read height from contour lines and spot heights, and describe steep and gentle slopes.', ['maps.symbols', 'maps.scale']),
  S('maps.graphs', 7, MAP, 'Graphs and data presentation', 'Choose and read the right graph or map for a set of geographical data.', []),
  S('maps.climate-graphs', 8, MAP, 'Climate graphs', 'Read and interpret climate graphs: temperature range, rainfall totals and what they show about a place.', ['maps.graphs', 'weather.weather-climate']),
  S('maps.fieldwork', 8, MAP, 'Fieldwork methods', 'Plan a fieldwork enquiry: questions, sampling, primary and secondary data, and risks.', ['maps.graphs']),
  S('maps.data-analysis', 9, MAP, 'Analysing fieldwork data', 'Use mean, median, mode and range to summarise fieldwork data and draw conclusions.', ['maps.fieldwork']),

  // ------------------------------------------------------------ weather and climate
  S('weather.weather-climate', 7, WX, 'Weather and climate', 'The difference between weather and climate, the elements of weather and how they are measured.', []),
  S('weather.rainfall', 8, WX, 'Types of rainfall', 'How relief, convectional and frontal rainfall form.', ['weather.weather-climate', 'rivers.water-cycle']),
  S('weather.pressure', 8, WX, 'Air pressure and weather systems', 'High and low pressure, anticyclones and depressions, and the weather they bring.', ['weather.weather-climate']),
  S('weather.uk-climate', 8, WX, 'The climate of the UK', 'Why the UK has a mild, wet climate: latitude, the sea, the North Atlantic Drift, prevailing winds and altitude.', ['weather.pressure', 'place.uk', 'place.lat-long']),
  S('weather.tropical-storms', 9, WX, 'Tropical storms', 'Where and how tropical storms (hurricanes, typhoons, cyclones) form, their effects and responses.', ['weather.pressure', 'place.lat-long']),

  // ------------------------------------------------------------ ecosystems and biomes
  S('biomes.ecosystems', 8, ECO, 'Ecosystems', 'Producers, consumers and decomposers; food chains, food webs and nutrient cycling.', []),
  S('biomes.world', 8, ECO, 'Global biomes', 'Where the major biomes are found and how climate controls them.', ['biomes.ecosystems', 'place.lat-long', 'weather.weather-climate']),
  S('biomes.rainforest', 8, ECO, 'Tropical rainforests', 'Climate, layers, nutrient cycle and plant and animal adaptations of the tropical rainforest.', ['biomes.world']),
  S('biomes.desert', 8, ECO, 'Hot deserts', 'Climate, characteristics and plant and animal adaptations of hot deserts.', ['biomes.world']),
  S('biomes.savanna', 8, ECO, 'Savanna grasslands', 'Wet and dry seasons, characteristics and adaptations of the savanna.', ['biomes.world']),
  S('biomes.deciduous', 8, ECO, 'Temperate deciduous forests', 'Seasons, layers and adaptations of temperate deciduous woodland, like much of the UK.', ['biomes.world']),
  S('biomes.tundra', 9, ECO, 'Tundra and polar environments', 'Climate, permafrost and adaptations in cold environments.', ['biomes.world']),

  // ------------------------------------------------------------ rocks and weathering
  S('rocks.types', 7, ROCK, 'Rock types', 'Igneous, sedimentary and metamorphic rocks: how they form and examples.', []),
  S('rocks.weathering', 7, ROCK, 'Weathering', 'Mechanical (physical), chemical and biological weathering, and how it differs from erosion.', ['rocks.types']),

  // ------------------------------------------------------------ rivers
  S('rivers.water-cycle', 7, RIV, 'The water cycle', 'Stores and flows of the water cycle: evaporation, condensation, precipitation and more.', []),
  S('rivers.drainage-basin', 7, RIV, 'Drainage basins', 'Drainage basin features: source, mouth, tributary, confluence, watershed; infiltration and run-off.', ['rivers.water-cycle']),
  S('rivers.processes', 8, RIV, 'River processes', 'Erosion (hydraulic action, abrasion, attrition, solution), transportation and deposition.', ['rivers.drainage-basin', 'rocks.types']),
  S('rivers.long-profile', 8, RIV, 'The course of a river', 'How a river and its valley change from the upper to the lower course.', ['rivers.processes', 'maps.relief']),
  S('rivers.landforms', 8, RIV, 'River landforms', 'How waterfalls, gorges, meanders, ox-bow lakes, floodplains and levees form.', ['rivers.processes', 'rivers.long-profile']),
  S('rivers.flooding', 8, RIV, 'Flooding and its management', 'Physical and human causes of flooding, flood hydrographs, and hard and soft engineering.', ['rivers.drainage-basin', 'maps.graphs']),

  // ------------------------------------------------------------ coasts
  S('coasts.waves', 8, COAST, 'Waves', 'How waves form, fetch, and constructive and destructive waves.', ['weather.weather-climate']),
  S('coasts.processes', 8, COAST, 'Coastal processes', 'Coastal erosion, longshore drift, deposition, weathering and mass movement.', ['coasts.waves', 'rocks.weathering']),
  S('coasts.landforms', 8, COAST, 'Coastal landforms', 'Headlands and bays, caves, arches, stacks and stumps, wave-cut platforms, beaches and spits.', ['coasts.processes', 'rocks.types']),
  S('coasts.management', 9, COAST, 'Coastal management', 'Hard and soft engineering at the coast, and evaluating their costs and benefits.', ['coasts.landforms']),

  // ------------------------------------------------------------ glaciation
  S('glaciation.processes', 9, ICE, 'Glaciers and glacial processes', 'Ice ages, how glaciers move, and plucking, abrasion, freeze-thaw and deposition.', ['rocks.weathering']),
  S('glaciation.landforms', 9, ICE, 'Glacial landforms', 'Corries, aretes, pyramidal peaks, U-shaped valleys, hanging valleys, ribbon lakes, moraine and drumlins.', ['glaciation.processes', 'maps.relief']),

  // ------------------------------------------------------------ tectonics
  S('tectonics.structure', 8, TEC, 'Structure of the Earth', 'Crust, mantle, outer and inner core; tectonic plates and convection currents.', ['rocks.types']),
  S('tectonics.boundaries', 8, TEC, 'Plate boundaries', 'Constructive, destructive, collision and conservative plate boundaries and what happens at each.', ['tectonics.structure']),
  S('tectonics.volcanoes', 8, TEC, 'Volcanoes', 'Parts of a volcano, shield and composite volcanoes, and where volcanoes are found.', ['tectonics.boundaries']),
  S('tectonics.earthquakes', 8, TEC, 'Earthquakes', 'Focus, epicentre, seismic waves, measuring earthquakes and where they happen.', ['tectonics.boundaries']),
  S('tectonics.responses', 9, TEC, 'Living with tectonic hazards', 'Why people live near hazards; prediction, protection and planning; immediate and long-term responses.', ['tectonics.volcanoes', 'tectonics.earthquakes', 'development.measures']),

  // ------------------------------------------------------------ population
  S('population.distribution', 8, POP, 'Population distribution and density', 'Where people live and why; calculating population density.', ['place.continents-oceans']),
  S('population.growth', 8, POP, 'Population growth', 'Birth rate, death rate, natural increase and world population growth.', ['population.distribution']),
  S('population.dtm', 9, POP, 'The demographic transition model', 'The stages of the demographic transition model and what happens to birth and death rates in each.', ['population.growth']),
  S('population.structure', 9, POP, 'Population structure', 'Reading population pyramids and what they show about a country.', ['population.dtm', 'maps.graphs']),
  S('population.migration', 8, POP, 'Migration', 'Types of migration, push and pull factors, and the effects of migration.', ['population.distribution']),

  // ------------------------------------------------------------ settlement and urbanisation
  S('urban.settlement', 7, URB, 'Settlement', 'Site, situation and function of settlements; the settlement hierarchy.', ['maps.symbols']),
  S('urban.urbanisation', 8, URB, 'Urbanisation', 'Why cities grow, megacities, rural-urban migration and the zones of a city.', ['urban.settlement', 'population.migration']),
  S('urban.sustainable-cities', 9, URB, 'Urban challenges and sustainable cities', 'Challenges in growing cities, informal settlements, and features of a sustainable city.', ['urban.urbanisation']),

  // ------------------------------------------------------------ development
  S('development.measures', 8, DEV, 'Measuring development', 'Development indicators such as GDP per capita, HDI, life expectancy, literacy and infant mortality.', ['population.growth']),
  S('development.gap', 9, DEV, 'The development gap', 'Classifying countries (HICs, NEEs, LICs), and the physical, economic and historical causes of uneven development.', ['development.measures']),
  S('development.aid-trade', 9, DEV, 'Aid and trade', 'Types of aid, fair trade, and how trade and debt affect development.', ['development.gap']),

  // ------------------------------------------------------------ economic activity and resources
  S('economy.sectors', 7, ECON, 'Economic sectors', 'Primary, secondary, tertiary and quaternary jobs, and how employment changes as countries develop.', []),
  S('economy.tourism', 8, ECON, 'Tourism', 'Why tourism has grown, its positive and negative impacts, and ecotourism.', ['economy.sectors']),
  S('economy.globalisation', 9, ECON, 'Globalisation', 'How the world has become more connected: TNCs, trade, transport and communications.', ['economy.sectors', 'development.measures']),
  S('resources.energy', 8, ECON, 'Energy resources', 'Renewable and non-renewable energy sources, their advantages and disadvantages.', ['economy.sectors']),
  S('resources.food-water', 9, ECON, 'Food and water security', 'Food and water security, water stress and ways of increasing supply sustainably.', ['resources.energy', 'population.growth']),

  // ------------------------------------------------------------ regional studies
  S('regions.africa', 8, REG, 'Africa', 'The physical and human geography of Africa: biomes, rivers, mountains and diversity.', ['place.countries-capitals', 'biomes.world']),
  S('regions.asia', 8, REG, 'Asia: China and India', 'Physical features of Asia, the monsoon, and the geography of China and India.', ['place.countries-capitals', 'tectonics.boundaries']),
  S('regions.russia', 8, REG, 'Russia', 'The size, physical regions, climate and resources of Russia.', ['place.countries-capitals', 'place.time-zones']),
  S('regions.middle-east', 9, REG, 'The Middle East', 'Location, physical features, water and oil in the Middle East.', ['place.countries-capitals', 'biomes.desert', 'resources.energy']),

  // ------------------------------------------------------------ environmental issues
  S('environment.deforestation', 8, ENV, 'Deforestation', 'Causes and effects of tropical deforestation and ways to manage rainforests sustainably.', ['biomes.rainforest']),
  S('environment.climate-change', 9, ENV, 'Climate change: causes and evidence', 'The greenhouse effect, natural and human causes of climate change, and the evidence for it.', ['weather.weather-climate', 'resources.energy']),
  S('environment.climate-responses', 9, ENV, 'Climate change: effects and responses', 'Effects of climate change on people and the environment; mitigation and adaptation.', ['environment.climate-change']),
  S('environment.sustainability', 9, ENV, 'Plastic pollution and sustainability', 'Plastic pollution in the oceans and what sustainable living means.', ['resources.energy']),
]
