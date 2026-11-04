import type { Skill } from '@/engine/types'

/**
 * MATHS SKILL GRAPH
 *
 * Every Year 7 and Year 8 topic comes straight from the school's KS3 syllabus
 * document (name + description). Year 4-6 "building blocks" are ADDED by us
 * (origin: 'foundation') so the planner has somewhere to step back to when a
 * Year 8 topic goes wrong. Edit prerequisites freely - they only steer
 * gap-finding, never gate access to a topic.
 */

const S = (
  id: string,
  year: number,
  strand: string,
  name: string,
  description: string,
  prereqs: string[],
  origin: Skill['origin'] = 'syllabus',
): Skill => ({ id: `maths.${id}`, subject: 'maths', year, strand, name, description, prereqs: prereqs.map((p) => `maths.${p}`), origin })

export const STRANDS = ['Number', 'Algebra', 'Ratio & proportion', 'Geometry & measures', 'Probability', 'Statistics'] as const

export const mathsSkills: Skill[] = [
  // ------------------------------------------------------------ foundations (added)
  S('f.times-tables', 4, 'Number', 'Times tables', 'Recall multiplication and division facts up to 12 x 12.', [], 'foundation'),
  S('f.written-methods', 5, 'Number', 'Column methods', 'Add, subtract, multiply and divide whole numbers using written methods.', ['f.times-tables'], 'foundation'),
  S('f.decimals', 5, 'Number', 'Decimals and rounding', 'Read, compare, add and round decimals to 3 decimal places.', [], 'foundation'),
  S('f.squares-cubes', 6, 'Number', 'Square and cube numbers', 'Know squares up to 15 x 15 and small cubes.', ['f.times-tables'], 'foundation'),
  S('f.factors-multiples', 5, 'Number', 'Factors, multiples and primes', 'Find factors and multiples; spot prime numbers to 100.', ['f.times-tables'], 'foundation'),
  S('f.fractions', 6, 'Number', 'Fraction basics', 'Equivalent fractions, simplifying, and finding a fraction of an amount.', ['f.times-tables', 'f.factors-multiples'], 'foundation'),
  S('f.negatives', 6, 'Number', 'Negative numbers', 'Order negative numbers and count across zero (e.g. temperatures).', [], 'foundation'),
  S('f.missing-numbers', 6, 'Algebra', 'Missing numbers and formulae', 'Solve missing-number problems and use simple word formulae.', ['f.written-methods'], 'foundation'),
  S('f.ratio', 6, 'Ratio & proportion', 'Scaling and simple ratio', 'Scale recipes up and down; "for every 1... there are 3...".', ['f.times-tables'], 'foundation'),
  S('f.angles', 5, 'Geometry & measures', 'Angle types', 'Name acute, right, obtuse and reflex angles; angles in a triangle.', [], 'foundation'),
  S('f.area', 5, 'Geometry & measures', 'Perimeter and area of rectangles', 'Perimeter and area of rectangles and squares.', ['f.times-tables'], 'foundation'),
  S('f.coordinates', 6, 'Geometry & measures', 'Coordinates', 'Read and plot coordinates in the first quadrant.', [], 'foundation'),
  S('f.chance', 5, 'Probability', 'Language of chance', 'Use words like impossible, unlikely, even chance, likely, certain.', [], 'foundation'),
  S('f.charts-mean', 6, 'Statistics', 'Reading charts and the mean', 'Read bar charts and tables; find a simple mean.', ['f.written-methods'], 'foundation'),

  // -------------------------------------------------------------------- Year 7
  S('number.place-value', 7, 'Number', 'Place value and ordering', 'Mastery of very large integers and decimals to multiple decimal places, including ordering and using inequality symbols.', ['f.decimals', 'f.written-methods']),
  S('number.four-operations', 7, 'Number', 'The four operations', 'Deepening understanding of formal written methods for addition, subtraction, multiplication, and division, including applications to decimals.', ['f.written-methods', 'f.times-tables', 'f.decimals']),
  S('number.bidmas', 7, 'Number', 'Order of operations (BIDMAS)', 'Correct application of priority rules in multi-step calculations involving brackets and indices.', ['number.four-operations']),
  S('number.properties', 7, 'Number', 'Properties of number', 'Identifying prime numbers, finding Highest Common Factors (HCF) and Lowest Common Multiples (LCM) using listing methods.', ['f.factors-multiples']),
  S('number.fdp', 7, 'Number', 'Fractions, decimals and percentages', 'Understanding the equivalence between forms and calculating simple percentages of amounts (e.g., 10%, 5%, 25%).', ['f.fractions', 'f.decimals']),

  S('algebra.notation', 7, 'Algebra', 'Algebraic notation', 'Introduction to variables and expressing missing value problems algebraically (e.g., using 3n for "3 times n").', ['f.missing-numbers']),
  S('algebra.simplifying', 7, 'Algebra', 'Simplifying expressions', 'Collecting like terms and understanding the difference between 2n and n squared.', ['algebra.notation']),
  S('algebra.single-brackets', 7, 'Algebra', 'Single brackets', 'Expanding simple expressions like 3(x + 4).', ['algebra.simplifying', 'number.bidmas']),
  S('algebra.solving-equations', 7, 'Algebra', 'Solving equations', 'Solving one-step and two-step linear equations using inverse operations.', ['algebra.notation', 'number.four-operations']),
  S('algebra.sequences', 7, 'Algebra', 'Sequences', 'Recognizing and describing linear number sequences and finding the next term.', ['algebra.notation', 'number.four-operations']),

  S('ratio.intro', 7, 'Ratio & proportion', 'Introduction to ratio', 'Using ratio notation and simplifying ratios to their simplest form.', ['f.ratio', 'number.properties']),
  S('ratio.sharing', 7, 'Ratio & proportion', 'Sharing in a ratio', 'Dividing quantities into two or more parts given a specific ratio.', ['ratio.intro', 'number.four-operations']),
  S('ratio.unitary', 7, 'Ratio & proportion', 'Unitary method', 'Solving simple scaling problems by finding the value of a single "unit."', ['ratio.intro', 'number.four-operations']),

  S('geometry.angle-properties', 7, 'Geometry & measures', 'Angle properties', 'Calculating angles on a straight line, around a point, and vertically opposite angles.', ['f.angles']),
  S('geometry.2d-shapes', 7, 'Geometry & measures', '2D shapes', 'Classification of triangles and quadrilaterals based on their side and angle properties.', ['f.angles', 'geometry.angle-properties']),
  S('geometry.area-perimeter', 7, 'Geometry & measures', 'Area and perimeter', 'Calculating the perimeter and area of rectangles, triangles, and composite shapes made of these.', ['f.area', 'geometry.2d-shapes']),
  S('geometry.notation', 7, 'Geometry & measures', 'Geometric notation', 'Using standard conventions for labeling lines, angles, and vertices.', ['f.angles']),

  S('probability.scale', 7, 'Probability', 'The probability scale', 'Placing events on a scale from 0 (impossible) to 1 (certain).', ['f.chance', 'number.fdp']),
  S('probability.calculating', 7, 'Probability', 'Calculating probability', 'Finding the theoretical probability of a single event occurring.', ['probability.scale', 'f.fractions']),
  S('probability.relative-frequency', 7, 'Probability', 'Relative frequency', 'Understanding that experimental probability may differ from theoretical expectations.', ['probability.calculating', 'number.fdp']),

  S('statistics.data-collection', 7, 'Statistics', 'Data collection', 'Introduction to primary and secondary data sources and designing simple tally charts.', ['f.charts-mean']),
  S('statistics.averages-range', 7, 'Statistics', 'Averages and range', 'Calculating the mean, median, mode, and range from discrete lists of data.', ['number.four-operations', 'statistics.data-collection']),
  S('statistics.representing-data', 7, 'Statistics', 'Representing data', 'Constructing and interpreting bar charts, pictograms, and simple pie charts.', ['statistics.data-collection', 'f.angles']),

  // -------------------------------------------------------------------- Year 8
  S('number.indices-roots', 8, 'Number', 'Indices, roots and powers', 'Calculating square and cube roots, and understanding the laws of indices for multiplication and division.', ['f.squares-cubes', 'number.bidmas']),
  S('number.standard-form', 8, 'Number', 'Standard form', 'Introduction to representing very large and very small numbers using powers of 10.', ['number.indices-roots', 'number.place-value']),
  S('number.directed-numbers', 8, 'Number', 'Directed numbers', 'Mastering calculations involving negative numbers across all four operations.', ['f.negatives', 'number.four-operations']),
  S('number.fraction-arithmetic', 8, 'Number', 'Fraction arithmetic', 'Adding, subtracting, multiplying, and dividing proper and mixed-number fractions.', ['number.fdp', 'number.properties']),
  S('number.percentage-change', 8, 'Number', 'Percentage change', 'Calculating percentage increase, decrease, and simple interest in real-world contexts.', ['number.fdp', 'number.four-operations']),

  S('algebra.factorising', 8, 'Algebra', 'Factorising', 'Factorising expressions by taking out common factors.', ['algebra.single-brackets', 'number.properties']),
  S('algebra.complex-equations', 8, 'Algebra', 'Solving complex equations', 'Solving linear equations where the unknown appears on both sides, such as 5x + 2 = 3x + 10.', ['algebra.solving-equations', 'number.directed-numbers']),
  S('algebra.linear-graphs', 8, 'Algebra', 'Linear graphs', 'Plotting coordinates in all four quadrants and recognizing the equation y = mx + c for straight lines.', ['f.coordinates', 'number.directed-numbers', 'algebra.sequences']),
  S('algebra.rearranging', 8, 'Algebra', 'Rearranging formulae', 'Subjecting a different variable in simple linear formulas.', ['algebra.solving-equations']),
  S('algebra.real-life-graphs', 8, 'Algebra', 'Real-life graphs', 'Interpreting distance-time graphs and conversion graphs.', ['algebra.linear-graphs', 'ratio.unitary']),

  S('ratio.proportion', 8, 'Ratio & proportion', 'Direct and inverse proportion', 'Recognizing relationships where variables increase together or one decreases as the other increases.', ['ratio.unitary', 'ratio.sharing']),
  S('ratio.compound-units', 8, 'Ratio & proportion', 'Compound units', 'Solving problems involving speed, distance, and time, as well as density and pressure.', ['ratio.unitary', 'number.four-operations']),
  S('ratio.scale-factors', 8, 'Ratio & proportion', 'Scale factors', 'Applying scale factors to 2D shapes and using map scales.', ['ratio.intro', 'geometry.area-perimeter']),

  S('geometry.parallel-lines', 8, 'Geometry & measures', 'Parallel line angles', 'Understanding and identifying alternate and corresponding angles.', ['geometry.angle-properties']),
  S('geometry.circles-trapeziums', 8, 'Geometry & measures', 'Circles and trapeziums', 'Calculating the circumference and area of circles, and the area of a trapezium.', ['geometry.area-perimeter', 'f.squares-cubes']),
  S('geometry.volume', 8, 'Geometry & measures', '3D shapes and volume', 'Calculating the volume and surface area of right prisms and cylinders.', ['geometry.area-perimeter', 'geometry.circles-trapeziums']),
  S('geometry.transformations', 8, 'Geometry & measures', 'Transformations', 'Performing and describing reflections, rotations, and translations on a coordinate grid.', ['f.coordinates', 'number.directed-numbers', 'geometry.2d-shapes']),

  S('probability.sample-space', 8, 'Probability', 'Sample space diagrams', 'Systematically listing all possible outcomes for two combined events.', ['probability.calculating']),
  S('probability.venn', 8, 'Probability', 'Venn diagrams and sets', 'Using Venn diagrams to sort data and calculate probabilities.', ['probability.calculating', 'number.fdp']),
  S('probability.independent', 8, 'Probability', 'Independent events', 'Calculating the probability of two independent events occurring (multiplication rule).', ['probability.sample-space', 'number.fraction-arithmetic']),

  S('statistics.frequency-tables', 8, 'Statistics', 'Frequency tables', 'Calculating the mean, median, and mode from grouped and ungrouped frequency tables.', ['statistics.averages-range']),
  S('statistics.scatter-graphs', 8, 'Statistics', 'Scatter graphs', 'Plotting bivariate data to identify correlation (positive, negative, or none) and drawing lines of best fit.', ['statistics.representing-data', 'f.coordinates']),
  S('statistics.comparing', 8, 'Statistics', 'Comparing data sets', 'Using the mean and range to compare two different distributions of data.', ['statistics.averages-range']),
]
