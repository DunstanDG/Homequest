import type { Skill } from '@/engine/types'

/**
 * PHYSICS SKILL GRAPH - the Physics part of KS3 Science (Years 7-9), England national curriculum.
 *
 * Strands follow the usual KS3 schemes of work (AQA KS3 / Activate / Exploring Science): energy; motion; forces
 * (including pressure and moments); sound and waves; light; electricity; magnetism; matter; space; plus a "working
 * scientifically" strand for the maths of physics (units, equations, tables and graphs). Schemes differ on which year
 * teaches which topic; Year 8 is kept the densest because that is where she is now. Two genuine primary-school
 * building blocks are added as Year 6 foundations. Prerequisites answer "if she gets this wrong, what earlier idea is
 * the likely reason?" and stay inside the Physics part.
 */

const S = (id: string, year: number, strand: string, name: string, description: string, prereqs: string[], origin: Skill['origin'] = 'syllabus'): Skill => ({
  id: `science.phys.${id}`,
  subject: 'science',
  year,
  strand,
  name,
  description,
  prereqs: prereqs.map((p) => `science.phys.${p}`),
  origin,
})

const WS = 'Physics: Working scientifically'
const EN = 'Physics: Energy'
const MO = 'Physics: Motion'
const FO = 'Physics: Forces'
const SO = 'Physics: Sound and waves'
const LI = 'Physics: Light'
const EL = 'Physics: Electricity'
const MG = 'Physics: Magnetism'
const MA = 'Physics: Matter'
const SP = 'Physics: Space'

export const physicsSkills: Skill[] = [
  // ------------------------------------------------------------- working scientifically
  S('ws.units', 7, WS, 'Quantities and units', 'Match physical quantities to their SI units and convert between units (km and m, g and kg, kJ and J, minutes and seconds).', []),
  S('ws.equations', 7, WS, 'Using and rearranging equations', 'Substitute values into physics equations and rearrange them to find any of the quantities.', ['ws.units']),
  S('ws.graphs', 8, WS, 'Tables, graphs and patterns', 'Identify the independent variable, calculate means, spot anomalous results, read patterns from tables and graphs and describe proportional relationships.', ['ws.units']),

  // ------------------------------------------------------------- energy
  S('energy.stores', 7, EN, 'Energy stores', 'Name the energy stores (kinetic, gravitational potential, elastic, thermal, chemical, magnetic, electrostatic, nuclear) and recognise them in everyday situations.', []),
  S('energy.food', 7, EN, 'Energy in food and fuels', 'Compare the energy in foods from labels (kJ), and work out the energy in a portion and how long it lasts during an activity.', ['energy.stores', 'ws.units']),
  S('energy.transfers', 8, EN, 'Energy transfers, conservation and efficiency', 'Describe transfers between stores (mechanically, electrically, by heating, by radiation), use conservation of energy, explain dissipation and calculate efficiency.', ['energy.stores']),
  S('energy.resources', 8, EN, 'Energy resources', 'Renewable and non-renewable energy resources, how a power station generates electricity, and the advantages and disadvantages of each resource.', ['energy.transfers']),
  S('energy.power', 8, EN, 'Power', 'Power as the rate of energy transfer: power = energy ÷ time, in watts and kilowatts; comparing appliances.', ['energy.transfers', 'ws.equations']),
  S('energy.cost', 8, EN, 'Paying for electricity', 'Calculate energy in kilowatt-hours and the cost of using domestic appliances, including from meter readings.', ['energy.power']),
  S('energy.heating', 8, EN, 'Heating and cooling', 'Temperature and thermal energy, thermal equilibrium, conduction, convection and radiation, conductors and insulators.', ['energy.transfers', 'matter.particles']),
  S('energy.work', 9, EN, 'Work done and simple machines', 'Work done = force × distance as energy transferred; levers and other simple machines give a bigger force over a smaller distance.', ['energy.transfers', 'forces.types', 'ws.equations']),

  // ------------------------------------------------------------- motion
  S('motion.speed', 7, MO, 'Speed', 'Calculate speed = distance ÷ time and rearrange it to find distance or time, with the right units.', ['ws.equations']),
  S('motion.dt-graphs', 8, MO, 'Distance-time graphs', 'Describe a journey from a distance-time graph and calculate speed from it.', ['motion.speed', 'ws.graphs']),
  S('motion.relative', 8, MO, 'Relative motion', 'Work out the speed of one object relative to another moving in the same or opposite direction.', ['motion.speed']),

  // ------------------------------------------------------------- forces
  S('forces.types', 7, FO, 'Forces and force diagrams', 'Forces as pushes or pulls measured in newtons; contact and non-contact forces; forces as interaction pairs; drawing and reading force arrows.', []),
  S('forces.balanced', 7, FO, 'Balanced and unbalanced forces', 'Find the resultant force along a line and predict whether an object speeds up, slows down or keeps moving steadily.', ['forces.types']),
  S('forces.friction', 7, FO, 'Friction and drag', 'Friction, air resistance and water resistance; when friction is useful or unhelpful; streamlining; the forces on a falling skydiver.', ['forces.types']),
  S('forces.hooke', 8, FO, "Stretching and Hooke's law", "Extension, elastic and plastic deformation, the elastic limit, and Hooke's law: force = spring constant × extension.", ['forces.types', 'ws.graphs']),
  S('forces.moments', 8, FO, 'Moments and levers', 'Moment = force × distance from the pivot, and balancing using the principle of moments.', ['forces.balanced', 'ws.equations']),
  S('forces.pressure-solids', 8, FO, 'Pressure on surfaces', 'Pressure = force ÷ area in N/m² and N/cm², and why area matters (snowshoes, knives, drawing pins).', ['forces.types', 'ws.equations']),
  S('forces.pressure-fluids', 9, FO, 'Pressure in liquids and gases', 'Gas pressure from particle collisions, atmospheric pressure with height, liquid pressure with depth, upthrust, floating and sinking.', ['forces.pressure-solids', 'matter.density']),

  // ------------------------------------------------------------- sound and waves
  S('waves.basics', 7, SO, 'Waves', 'Amplitude, wavelength and frequency; transverse and longitudinal waves; water waves; waves adding and cancelling.', []),
  S('waves.sound', 7, SO, 'How sound travels', 'Sound as vibrations passed through a medium; why sound cannot travel through a vacuum; the speed of sound in solids, liquids and gases compared with light.', ['waves.basics', 'matter.particles']),
  S('waves.hearing', 7, SO, 'Hearing, pitch and loudness', 'How the ear works, pitch and frequency, loudness and amplitude, the human hearing range, ultrasound and protecting hearing.', ['waves.sound']),
  S('waves.echoes', 8, SO, 'Echoes', 'Echoes as reflected sound; calculating distances with echoes and the speed of sound; uses of ultrasound echoes.', ['waves.sound', 'motion.speed']),

  // ------------------------------------------------------------- light
  S('light.travel', 7, LI, 'How light travels', 'Light travels in straight lines at 300,000 km/s and can cross a vacuum; luminous objects; transmission, absorption and reflection; shadows.', ['waves.basics']),
  S('light.reflection', 7, LI, 'Reflection', 'The law of reflection, the normal, specular and diffuse reflection, and images in a plane mirror.', ['light.travel']),
  S('light.refraction', 8, LI, 'Refraction and lenses', 'Light changing direction as it changes speed between materials, bending towards or away from the normal, and convex and concave lenses.', ['light.travel']),
  S('light.colour', 8, LI, 'Colour', 'Dispersion of white light by a prism, the spectrum, primary and secondary colours of light, coloured filters and coloured objects.', ['light.reflection', 'light.refraction']),
  S('light.eye', 8, LI, 'The eye and the camera', 'The parts of the eye and their jobs, how an image forms on the retina, and the pinhole camera.', ['light.refraction']),

  // ------------------------------------------------------------- electricity
  S('elec.basic', 6, EL, 'Simple circuits', 'Complete circuits, conductors and insulators, and what happens with more cells or more bulbs (Year 6).', [], 'foundation'),
  S('elec.current', 8, EL, 'Current and potential difference', 'Current as a flow of charge measured in amps with an ammeter in series; potential difference in volts measured with a voltmeter in parallel.', ['elec.basic']),
  S('elec.series-parallel', 8, EL, 'Series and parallel circuits', 'How current and potential difference behave in series and parallel circuits, and why homes use parallel circuits.', ['elec.current']),
  S('elec.resistance', 8, EL, 'Resistance', 'Resistance = potential difference ÷ current, in ohms; what affects the resistance of a wire.', ['elec.current', 'ws.equations']),
  S('elec.static', 8, EL, 'Static electricity', 'Charging by rubbing (electron transfer), like charges repel and unlike attract, electric fields and sparks.', ['forces.types']),

  // ------------------------------------------------------------- magnetism
  S('mag.magnets', 8, MG, 'Magnets and magnetic fields', 'Magnetic poles, attraction and repulsion, magnetic materials, field lines, compasses and the Earth\'s magnetic field.', ['forces.types']),
  S('mag.electromagnets', 9, MG, 'Electromagnets', 'The magnetic field around a current, making an electromagnet stronger, uses of electromagnets and the idea of the motor effect.', ['mag.magnets', 'elec.current']),

  // ------------------------------------------------------------- matter
  S('matter.particles', 7, MA, 'The particle model and changes of state', 'Particles in solids, liquids and gases; changes of state as physical, reversible changes that conserve mass; heating curves and expansion.', []),
  S('matter.density', 8, MA, 'Density', 'Density = mass ÷ volume in g/cm³ and kg/m³, measuring volume by displacement, and predicting floating and sinking in water.', ['matter.particles', 'ws.equations']),

  // ------------------------------------------------------------- space
  S('space.basics', 6, SP, 'Sun, Earth and Moon', 'The Sun is a star, the Earth orbits the Sun and spins, the Moon orbits the Earth (Year 5).', [], 'foundation'),
  S('space.solar-system', 7, SP, 'The solar system', 'The order of the planets, rocky and giant planets, the asteroid belt and dwarf planets.', ['space.basics']),
  S('space.day-seasons', 7, SP, 'Days, years and seasons', 'Day and night from the Earth\'s spin, the year from its orbit, and the seasons and day length from the tilt of its axis.', ['space.basics']),
  S('space.moon', 7, SP, 'Phases of the Moon and eclipses', 'Why the Moon shows phases, the order of the phases, and solar and lunar eclipses.', ['space.basics', 'light.travel']),
  S('space.gravity', 8, SP, 'Gravity, mass and weight', 'Weight = mass × gravitational field strength (g = 10 N/kg on Earth); weight on other worlds; gravity holding moons and planets in orbit.', ['forces.types', 'space.solar-system']),
  S('space.stars', 9, SP, 'Stars, galaxies and light years', 'The Sun as a star, galaxies and the universe, and the light year as a unit of astronomical distance.', ['space.solar-system', 'light.travel']),
]
