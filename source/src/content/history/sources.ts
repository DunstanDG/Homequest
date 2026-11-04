import { passage } from '../kit'

/**
 * Sources shown alongside questions. Three kinds, always labelled honestly in the attribution line:
 *  - short real quotations from public-domain texts (kept to a sentence or two);
 *  - paraphrases of real sources, labelled "paraphrased";
 *  - imagined sources written for HomeQuest, labelled as imagined and saying what real evidence they are based on.
 */

const IMAGINED = 'Imagined source, written for HomeQuest'

export const SRC = {
  millChild: passage(
    'I start at the mill at six in the morning and we stop at seven at night, with a short break for dinner. If we are late, the overlooker fines us. Last winter my fingers were caught in the machine. I am nine years old.',
    { title: 'Source A', source: `${IMAGINED}. It is based on the kind of evidence factory children gave to Parliament in the 1830s.` },
  ),
  soldierLetter: passage(
    'Dear Mum, it has rained for three days and the water in the trench is over my boots. We take turns to sleep in a hole dug into the side. Please don’t worry about me. The parcel you sent was a real treat and we shared the cake.',
    { title: 'Source B', source: `${IMAGINED}. It is based on letters British soldiers wrote home from the Western Front in 1916.` },
  ),
  orderic: passage(
    'The king ordered that crops, animals and tools should be burned, so that the whole land north of the Humber was stripped of food. Terrible famine followed and a great many people died. I cannot praise him for this.',
    { title: 'Source C', source: 'Paraphrased (not his exact words) from Orderic Vitalis, a monk writing in the 1120s-1130s about the Harrying of the North.' },
  ),
  plagueMonk: passage(
    'This year a great death came upon the people. So many died that there were hardly enough living to bury the dead. Some say it is God’s punishment for our sins; others blame the foul air.',
    { title: 'Source D', source: `${IMAGINED}. It is based on what English chroniclers wrote about the Black Death in 1348-1349.` },
  ),
  suffragetteLeaflet: passage(
    'Women pay taxes and obey the laws. Why should they have no say in making them? We have asked politely for fifty years and been ignored. Now we act. Deeds, not words!',
    { title: 'Source E', source: `${IMAGINED}. It is based on suffragette leaflets from about 1912; "Deeds, not words" was the real motto of the WSPU.` },
  ),
  evacuee: passage(
    'I was seven when they put a label on my coat and sent me to Wales on a train. The family I stayed with were kind, but I missed my mum terribly. I had never seen a cow before!',
    { title: 'Source F', source: `${IMAGINED}. It is based on memories of evacuees recorded in interviews in the 1990s, about 50 years after the war.` },
  ),
  tilbury: passage('I know I have the body of a weak and feeble woman; but I have the heart and stomach of a king, and of a king of England too.', {
    title: 'Source G',
    source: 'Elizabeth I, speaking to her troops at Tilbury in 1588, as recorded in a later account.',
  }),
  equiano: passage('The stench of the hold while we were on the coast was so intolerably loathsome, that it was dangerous to remain there for any time.', {
    title: 'Source H',
    source: 'Olaudah Equiano, describing the slave ship that carried him across the Atlantic, in his autobiography published in 1789.',
  }),
  owen: passage('Bent double, like old beggars under sacks,\nKnock-kneed, coughing like hags, we cursed through sludge', {
    title: 'Source I',
    source: 'Wilfred Owen, a British officer and poet, from his poem "Dulce et Decorum Est", written in 1917-1918.',
  }),
  johnBall: passage('When Adam delved and Eve span, who was then the gentleman?', {
    title: 'Source J',
    source: 'A rhyme used by John Ball, a priest who supported the Peasants’ Revolt of 1381. ("Delved" means dug; "span" means spun thread.)',
  }),
  digForVictory: passage('Dig for Victory! Turn your lawn into a vegetable plot. Every potato you grow saves space on a ship for the things we cannot grow ourselves.', {
    title: 'Source K',
    source: `${IMAGINED}. It is based on the real British government "Dig for Victory" campaign of the Second World War.`,
  }),
  cromwellA: passage(
    'Cromwell was a military dictator. When Parliament disagreed with him he closed it down, and his army treated the Irish with terrible cruelty.',
    { title: 'Interpretation A', source: `${IMAGINED}: the view of an imagined historian critical of Cromwell.` },
  ),
  cromwellB: passage(
    'Cromwell was a man of deep faith who allowed more religious freedom to Protestants than any ruler before him. He believed he was protecting the nation, and he refused the crown when it was offered.',
    { title: 'Interpretation B', source: `${IMAGINED}: the view of an imagined historian more sympathetic to Cromwell.` },
  ),
  haigA: passage('Haig sent hundreds of thousands of men to their deaths at the Somme, attacking again and again even when it was clear the plan had failed.', {
    title: 'Interpretation A',
    source: `${IMAGINED}: a view of General Haig often found in books written in the 1960s.`,
  }),
  haigB: passage('Haig faced a new kind of war that no general understood. His army learned from the Somme, and by 1918 it was winning the battles that ended the war.', {
    title: 'Interpretation B',
    source: `${IMAGINED}: a view of General Haig found in some books written by historians more recently.`,
  }),
  abolitionA: passage('The slave trade was ended above all by the long campaign of people in Britain such as Thomas Clarkson and William Wilberforce.', {
    title: 'Interpretation A',
    source: `${IMAGINED}: a view common in British history books of the 1800s.`,
  }),
  abolitionB: passage('Enslaved people resisted at every stage, from revolts on ships to the great rising in Saint-Domingue. Their resistance made slavery dangerous and costly, and pushed abolition forward.', {
    title: 'Interpretation B',
    source: `${IMAGINED}: a view found in many books written by historians since the 1960s.`,
  }),
  peterlooA: passage('The crowd at St Peter’s Field was a dangerous mob, and the magistrates had to act to keep order.', {
    title: 'Interpretation A',
    source: `${IMAGINED}: the kind of view put forward by the government and magistrates in 1819.`,
  }),
  factoryOwner: passage(
    'The children in my mill are well fed and cheerful. The work is light and keeps them out of mischief. Without their wages, their families would be poorer still.',
    { title: 'Source L', source: `${IMAGINED}. It is based on what some mill owners told Parliament in the 1830s.` },
  ),
  chronicleHastings: passage('Duke William came with a great fleet to Pevensey. King Harold gathered a great army and came against him, and there was a hard fight, and Harold was killed.', {
    title: 'Source M',
    source: 'Paraphrased (not the exact words) from the Anglo-Saxon Chronicle, written by English monks.',
  }),
  rationDiary: passage('Queued for an hour for two oranges today. Mum made a cake with dried egg and it tasted of cardboard, but we ate every crumb.', {
    title: 'Source N',
    source: `${IMAGINED}. It is based on diaries kept by British teenagers during the Second World War.`,
  }),
}
