import type { Skill } from '@/engine/types'

const S = (id: string, year: number, strand: string, name: string, description: string, prereqs: string[], origin: Skill['origin'] = 'syllabus'): Skill => ({
  id: `history.${id}`,
  subject: 'history',
  year,
  strand,
  name,
  description,
  prereqs: prereqs.map((p) => `history.${p}`),
  origin,
})

const FOUND = 'Foundations'
const SKL = 'Historical skills'
const MED = 'Medieval Britain 1066-1485'
const TS = 'Tudors and Stuarts'
const IER = 'Industry, empire and reform'
const C20 = 'The 20th century'

export const historySkills: Skill[] = [
  // ------------------------------------------------------------ foundations (primary school)
  S('foundation.bc-ad', 6, FOUND, 'BC and AD dates', 'Read BC and AD dates and put them in order, knowing there is no year 0.', [], 'foundation'),
  S('foundation.periods', 6, FOUND, 'Britain before 1066', 'The order of the big periods before 1066: Stone, Bronze and Iron Ages, Romans, Anglo-Saxons and Vikings.', [], 'foundation'),

  // ------------------------------------------------------------ historical skills
  S('skills.centuries', 7, SKL, 'Centuries and decades', 'Work out which century or decade a date is in, and count years between dates.', ['foundation.bc-ad']),
  S('skills.timelines', 7, SKL, 'Chronology and periods', 'Put events from different periods in order and place them in the right period (medieval, Tudor, Stuart, Georgian, Victorian, 20th century).', ['skills.centuries', 'foundation.periods']),
  S('skills.sources', 7, SKL, 'Primary and secondary sources', 'Tell primary sources from secondary ones and know the kinds of evidence historians use.', []),
  S('skills.inference', 7, SKL, 'Inference from sources', 'Work out what a source suggests, beyond what it says directly, and back it up.', ['skills.sources']),
  S('skills.provenance', 7, SKL, 'Provenance: nature, origin, purpose', 'Ask who made a source, when, what kind it is and why it was made.', ['skills.sources']),
  S('skills.usefulness', 8, SKL, 'Usefulness and reliability', 'Judge how useful and reliable a source is for an enquiry, using its content and provenance, and spot bias.', ['skills.provenance', 'skills.inference']),
  S('skills.interpretations', 8, SKL, 'Interpretations', 'Explain how and why historians’ interpretations of the past differ, and judge how far you agree.', ['skills.usefulness']),
  S('skills.causation', 7, SKL, 'Causation', 'Long-term and short-term causes, triggers, and types of cause (political, economic, religious).', ['skills.timelines']),
  S('skills.consequence', 7, SKL, 'Consequence', 'Short-term and long-term, intended and unintended consequences.', ['skills.causation']),
  S('skills.change-continuity', 8, SKL, 'Change and continuity', 'Tell change from continuity, and use ideas like turning point, progress and trend.', ['skills.timelines']),
  S('skills.significance', 8, SKL, 'Significance', 'Judge how significant an event or person was, using clear criteria.', ['skills.consequence']),

  // ------------------------------------------------------------ medieval
  S('medieval.claimants', 7, MED, 'The 1066 succession crisis', 'Why Edward the Confessor’s death caused a crisis, and the claims of Harold, Hardrada, William and Edgar.', ['foundation.periods']),
  S('medieval.battles-1066', 7, MED, 'Stamford Bridge and Hastings', 'The events of 1066 and why William won the Battle of Hastings.', ['medieval.claimants']),
  S('medieval.norman-control', 7, MED, 'Norman control and Domesday', 'How William controlled England: rebellions, the Harrying of the North and the Domesday Book.', ['medieval.battles-1066']),
  S('medieval.castles', 7, MED, 'Norman castles', 'Motte and bailey, stone keeps and concentric castles, and why they were built.', ['medieval.battles-1066']),
  S('medieval.feudal', 7, MED, 'The feudal system', 'Land in return for loyalty and service: king, barons, knights and peasants.', ['medieval.norman-control']),
  S('medieval.church', 7, MED, 'The medieval Church', 'Beliefs, tithes, pilgrimage, monasteries and the power of the Church.', ['medieval.feudal']),
  S('medieval.becket', 7, MED, 'Henry II and Becket', 'The quarrel between Henry II and Thomas Becket and the murder of 1170.', ['medieval.church']),
  S('medieval.magna-carta', 7, MED, 'King John and Magna Carta', 'Why the barons rebelled and what Magna Carta (1215) did.', ['medieval.feudal', 'medieval.becket']),
  S('medieval.crusades', 7, MED, 'The Crusades', 'Why people went on crusade, key events and consequences.', ['medieval.church']),
  S('medieval.life', 7, MED, 'Medieval life', 'Villages, farming, homes, food and towns.', ['medieval.feudal']),
  S('medieval.medicine', 7, MED, 'Medieval medicine', 'The four humours, Galen, the Church and treatments.', ['medieval.church']),
  S('medieval.black-death', 7, MED, 'The Black Death', 'The Black Death of 1348: causes, beliefs, treatments and effects.', ['medieval.life', 'medieval.medicine']),
  S('medieval.peasants-revolt', 7, MED, "The Peasants' Revolt", "Causes, events and results of the Peasants' Revolt of 1381.", ['medieval.black-death', 'medieval.feudal']),

  // ------------------------------------------------------------ Tudors and Stuarts
  S('tudors.henry-vii', 8, TS, 'Henry VII and the Wars of the Roses', 'How Henry Tudor won the crown in 1485 and made it secure.', ['skills.timelines']),
  S('tudors.henry-viii', 8, TS, "Henry VIII and his wives", 'Henry VIII’s six wives and his search for a male heir.', ['tudors.henry-vii']),
  S('tudors.reformation', 8, TS, 'The Reformation', 'Martin Luther, Protestant and Catholic beliefs.', ['medieval.church']),
  S('tudors.break-with-rome', 8, TS, 'The break with Rome', 'Why Henry VIII broke with Rome, the Act of Supremacy and the dissolution of the monasteries.', ['tudors.henry-viii', 'tudors.reformation']),
  S('tudors.edward-mary', 8, TS, 'Edward VI and Mary I', 'The religious see-saw under Edward VI and Mary I.', ['tudors.break-with-rome']),
  S('tudors.elizabeth', 8, TS, 'Elizabeth I', 'Elizabeth’s religious settlement, Mary Queen of Scots, and the Elizabethan age.', ['tudors.edward-mary']),
  S('tudors.armada', 8, TS, 'The Spanish Armada', 'Why Spain sent the Armada in 1588 and why it failed.', ['tudors.elizabeth']),
  S('stuarts.gunpowder', 8, TS, 'James I and the Gunpowder Plot', 'The plot of 1605: who, why, how it was discovered, and what happened next.', ['tudors.elizabeth']),
  S('stuarts.civil-war-causes', 8, TS, 'Causes of the English Civil War', 'Money, religion and power: why king and Parliament went to war in 1642.', ['stuarts.gunpowder', 'medieval.magna-carta', 'skills.causation']),
  S('stuarts.civil-war', 8, TS, 'The English Civil War', 'Roundheads and Cavaliers, key battles and the New Model Army.', ['stuarts.civil-war-causes']),
  S('stuarts.regicide', 8, TS, 'The execution of Charles I', 'The trial and execution of Charles I in 1649.', ['stuarts.civil-war']),
  S('stuarts.commonwealth', 8, TS, 'Cromwell and the Commonwealth', 'England without a king: the Commonwealth, the Protectorate and Cromwell.', ['stuarts.regicide']),
  S('stuarts.restoration', 8, TS, 'The Restoration', 'Charles II, the Great Plague and the Great Fire of London.', ['stuarts.commonwealth']),
  S('stuarts.glorious-revolution', 8, TS, 'The Glorious Revolution', 'James II, William and Mary, and the Bill of Rights of 1689.', ['stuarts.restoration']),

  // ------------------------------------------------------------ industry, empire and reform
  S('industry.causes', 8, IER, 'Why Britain industrialised', 'The causes of the Industrial Revolution: coal, iron, population, trade and ideas.', ['skills.causation']),
  S('industry.inventions', 8, IER, 'Inventions and inventors', 'Key inventions in textiles, steam power, iron and railways.', ['industry.causes']),
  S('industry.factories', 8, IER, 'Factories and child labour', 'Working conditions, child labour and the Factory Acts.', ['industry.inventions']),
  S('industry.public-health', 8, IER, 'Industrial towns and public health', 'Crowded towns, cholera, John Snow and public health reform.', ['industry.factories', 'medieval.medicine']),
  S('slavery.trade', 8, IER, 'The transatlantic slave trade', 'The triangular trade: routes, goods and who profited.', ['skills.timelines']),
  S('slavery.middle-passage', 8, IER, 'The Middle Passage and plantations', 'Conditions on slave ships and life on plantations.', ['slavery.trade']),
  S('slavery.resistance', 8, IER, 'Resistance to slavery', 'How enslaved people resisted, from everyday resistance to revolts such as Haiti.', ['slavery.middle-passage']),
  S('slavery.abolition', 8, IER, 'Abolition', 'Campaigners, the 1807 and 1833 Acts, and why slavery was abolished.', ['slavery.resistance']),
  S('empire.growth', 8, IER, 'The British Empire', 'How and why the British Empire grew, and different views of it.', ['slavery.trade']),
  S('empire.india', 8, IER, 'Britain and India', 'The East India Company, the 1857 rebellion and the Raj.', ['empire.growth']),
  S('reform.voting', 8, IER, 'The struggle for the vote', 'Peterloo, the Great Reform Act and the Chartists.', ['stuarts.glorious-revolution', 'industry.factories']),
  S('reform.suffrage', 8, IER, 'Votes for women', 'Suffragists and suffragettes, and the 1918 and 1928 Acts.', ['reform.voting']),

  // ------------------------------------------------------------ 20th century
  S('ww1.causes', 9, C20, 'Causes of the First World War', 'Militarism, alliances, imperialism, nationalism and the assassination of Franz Ferdinand.', ['empire.growth', 'skills.causation']),
  S('ww1.western-front', 9, C20, 'The Western Front', 'Trench warfare, weapons and conditions.', ['ww1.causes']),
  S('ww1.somme', 9, C20, 'The Battle of the Somme', 'Why the Somme was fought, the first day, and views of General Haig.', ['ww1.western-front']),
  S('interwar.versailles', 9, C20, 'The end of the war and Versailles', 'The armistice and the Treaty of Versailles.', ['ww1.somme']),
  S('interwar.nazis', 9, C20, 'The rise of the Nazis', 'How Hitler and the Nazis came to power in Germany.', ['interwar.versailles']),
  S('ww2.causes', 9, C20, 'Causes of the Second World War', 'Hitler’s aims, appeasement and the invasion of Poland.', ['interwar.nazis']),
  S('ww2.britain-1940', 9, C20, 'Dunkirk and the Battle of Britain', 'Britain in 1940: Churchill, Dunkirk and the Battle of Britain.', ['ww2.causes']),
  S('ww2.home-front', 9, C20, 'The Blitz and the Home Front', 'Evacuation, rationing, the Blitz and women’s war work.', ['ww2.britain-1940']),
  S('ww2.d-day', 9, C20, 'D-Day and the end of the war', 'D-Day in 1944 and the end of the war in Europe and Asia.', ['ww2.britain-1940']),
  S('ww2.holocaust', 9, C20, 'The Holocaust', 'Nazi persecution of Jewish people and others, and the Holocaust.', ['interwar.nazis']),
  S('postwar.nhs', 9, C20, 'The welfare state and the NHS', 'The Beveridge Report and the creation of the NHS in 1948.', ['ww2.home-front']),
  S('postwar.decolonisation', 9, C20, 'The end of empire', 'Indian independence and partition in 1947, and the end of the British Empire.', ['empire.india', 'ww2.d-day']),
  S('coldwar.basics', 9, C20, 'The Cold War', 'The USA and the USSR, the Iron Curtain, Berlin and the Cuban Missile Crisis.', ['ww2.d-day']),
  S('postwar.civil-rights', 9, C20, 'Civil rights', 'The civil rights movement in the USA, and Windrush and civil rights in Britain.', ['slavery.abolition', 'postwar.decolonisation']),
]
