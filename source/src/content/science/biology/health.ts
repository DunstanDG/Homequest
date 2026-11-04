import type { ItemGenerator } from '@/engine/registry'
import { bankGenerators, classifyGenerators, G, fmt, num, round, type Bank } from './factory'

// =====================================================================================================================
// Health: drugs and medicines, and the effects of smoking and alcohol. Kept to the factual health effects that a
// Year 8 textbook covers.
// =====================================================================================================================

const drugs: Bank = {
  skill: 'bio.health.drugs',
  terms: [
    { term: 'Drug', def: 'A chemical substance that affects the way the body works' },
    { term: 'Medicinal drug', def: 'A drug that is taken to improve health, for example to treat an illness or relieve pain' },
    { term: 'Recreational drug', def: 'A drug that is taken for enjoyment rather than for medical reasons' },
    { term: 'Addiction', def: 'A strong need to keep taking a drug, so that it is very hard to stop' },
    { term: 'Withdrawal symptoms', def: 'Unpleasant effects a person gets when they stop taking a drug they are addicted to' },
    { term: 'Stimulant', def: 'A drug that speeds up the nervous system, making a person feel more alert' },
    { term: 'Depressant', def: 'A drug that slows down the nervous system, making reactions slower' },
  ],
  mcqs: [
    {
      q: 'What is the difference between a stimulant and a depressant?',
      a: 'A stimulant speeds up the nervous system; a depressant slows it down',
      wrong: [
        { label: 'A stimulant slows down the nervous system; a depressant speeds it up', misconception: 'stimulant-depressant-swapped', feedback: 'It is the other way round. "Stimulate" means to excite or speed up.' },
        { label: 'Stimulants are always illegal; depressants are always legal', misconception: 'legal-type', feedback: 'Caffeine is a legal stimulant and alcohol is a legal depressant. The words describe the effect, not the law.' },
        { label: 'A stimulant makes you sad; a depressant makes you happy', misconception: 'depressant-mood', feedback: '"Depressant" means it slows down (depresses) the nervous system.' },
      ],
      hint: 'To "stimulate" something is to wake it up.',
      why: 'Stimulants, such as caffeine and nicotine, speed up the nervous system. Depressants, such as alcohol and solvents, slow it down, so reactions become slower.',
      lv: [2, 4],
    },
    {
      q: 'Why is it dangerous to drive after drinking alcohol?',
      a: 'Alcohol is a depressant: it slows down reactions and affects judgement and coordination',
      wrong: [
        { label: 'Alcohol is a stimulant, so drivers go too fast', misconception: 'alcohol-stimulant', feedback: 'Alcohol is a depressant: it slows down the nervous system.' },
        { label: 'Alcohol makes the eyes produce more tears', misconception: 'alcohol-tears', feedback: 'The danger comes from its effect on the nervous system.' },
        { label: 'It is only dangerous if the car is old', misconception: 'alcohol-car', feedback: 'The danger is the effect of alcohol on the driver\'s brain.' },
      ],
      hint: 'Is alcohol a stimulant or a depressant?',
      why: 'Alcohol slows down the nervous system. A driver who has drunk alcohol reacts more slowly, judges distances and speeds badly, and has poorer coordination, so accidents are more likely.',
      lv: [2, 4],
    },
    {
      q: 'Antibiotics are medicines that can treat infections caused by which of these?',
      a: 'Bacteria',
      wrong: [
        { label: 'Viruses, such as the ones that cause colds and flu', misconception: 'antibiotics-viruses', feedback: 'Antibiotics do not work against viruses. They kill bacteria.' },
        { label: 'Broken bones', misconception: 'antibiotics-bones', feedback: 'A broken bone is not an infection.' },
        { label: 'Vitamin deficiencies', misconception: 'antibiotics-deficiency', feedback: 'Deficiency diseases are treated by eating the missing nutrient.' },
      ],
      hint: 'They do not work on colds or flu.',
      why: 'Antibiotics kill bacteria (or stop them growing). They do not work against viruses, so they cannot cure a cold or flu.',
      lv: [3, 5],
    },
    {
      q: 'Why should you never take more of a medicine than the label or a doctor says?',
      a: 'Too much of a drug can harm the body, even if it is a medicine',
      wrong: [
        { label: 'Because the medicine would stop working completely', misconception: 'overdose-stops', feedback: 'The danger of too much is that it can damage the body.' },
        { label: 'There is no reason: more medicine always means getting better faster', misconception: 'more-is-better', feedback: 'Taking more than the safe dose can cause serious harm.' },
        { label: 'Because medicines are recreational drugs', misconception: 'medicine-recreational', feedback: 'Medicines are medicinal drugs, but they are still only safe at the right dose.' },
      ],
      hint: 'Medicines are drugs too.',
      why: 'All drugs, including medicines, can be harmful in the wrong amounts. Taking more than the stated dose (an overdose) can damage organs such as the liver.',
      lv: [1, 3],
    },
    {
      q: 'A person who is addicted to a drug stops taking it and feels shaky, anxious and unwell. What are these feelings called?',
      a: 'Withdrawal symptoms',
      wrong: [
        { label: 'Side effects of a stimulant', misconception: 'withdrawal-side-effect', feedback: 'These happen because the drug has been stopped, not because it was taken.' },
        { label: 'An allergy', misconception: 'withdrawal-allergy', feedback: 'An allergy is a reaction to a substance. These feelings come from stopping a drug the body depends on.' },
        { label: 'A deficiency disease', misconception: 'withdrawal-deficiency', feedback: 'Deficiency diseases are caused by a lack of a vitamin or mineral in the diet.' },
      ],
      hint: 'They happen when the drug is taken away (withdrawn).',
      why: 'When someone is addicted, their body has come to depend on the drug. Stopping it causes unpleasant withdrawal symptoms, which is one reason addiction is so hard to break.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Explain why a person who is addicted to a drug can find it very hard to stop taking it.',
      model: 'When a person is addicted, their body has come to depend on the drug and they feel a strong need to keep taking it. If they stop, they get withdrawal symptoms, such as feeling shaky, anxious, sick or unable to sleep. Taking the drug again stops these unpleasant feelings, so it is tempting to carry on. Getting support from a doctor or a support group can help someone to stop.',
      checklist: ['Explains addiction as needing or depending on the drug', 'Mentions withdrawal symptoms', 'Gives an example of a withdrawal symptom', 'Explains why this makes stopping hard', 'Mentions where help or support can come from'],
      hint: 'What happens to the body when the drug is taken away?',
      passMark: 3,
    },
  ],
}

const medicinalClassify = classifyGenerators('bio.health.drugs', {
  id: 'medicinal-recreational',
  categories: ['Medicinal use', 'Recreational use'],
  items: [
    ['taking paracetamol to relieve a headache', 'Medicinal use'],
    ['taking antibiotics prescribed by a doctor for a bacterial infection', 'Medicinal use'],
    ['using an inhaler to treat an asthma attack', 'Medicinal use'],
    ['taking ibuprofen to reduce the pain of a sprained ankle', 'Medicinal use'],
    ['drinking alcohol at a party', 'Recreational use'],
    ['smoking a cigarette, which contains nicotine', 'Recreational use'],
    ['drinking strong coffee for the caffeine, to stay awake', 'Recreational use'],
  ],
  ask: (item) => `"${item.charAt(0).toUpperCase() + item.slice(1)}." Is this a medicinal or a recreational use of a drug?`,
  hint: 'Is the drug being taken to treat an illness or relieve pain, or for its effect on how the person feels?',
  means: {
    'Medicinal use': 'Medicinal drugs are taken to improve health: to treat an illness or relieve symptoms.',
    'Recreational use': 'Recreational drugs are taken for their effect on how a person feels, not for a medical reason. Some, like alcohol, caffeine and nicotine, are legal; many others are illegal.',
  },
})

const stimulantClassify = classifyGenerators('bio.health.drugs', {
  id: 'stimulant-depressant',
  categories: ['Stimulant', 'Depressant'],
  items: [
    ['caffeine (in coffee, tea and cola)', 'Stimulant'],
    ['nicotine (in tobacco)', 'Stimulant'],
    ['cocaine', 'Stimulant'],
    ['alcohol', 'Depressant'],
    ['solvents (such as some glues)', 'Depressant'],
    ['heroin', 'Depressant'],
  ],
  ask: (item) => `Is ${item} a stimulant or a depressant?`,
  hint: 'Does it make the nervous system (and reactions) faster or slower?',
  means: {
    Stimulant: 'Stimulants speed up the nervous system: caffeine, nicotine and cocaine are examples.',
    Depressant: 'Depressants slow down the nervous system and reactions: alcohol, solvents and heroin are examples.',
  },
})

// ----------------------------------------------------------------------------------------------- smoking and alcohol

const smokingAlcohol: Bank = {
  skill: 'bio.health.smoking-alcohol',
  links: [
    {
      prompt: 'Match each substance in tobacco smoke to its effect.',
      pairs: [
        ['Nicotine', 'An addictive drug, which makes it hard to give up smoking'],
        ['Tar', 'A sticky substance that coats the lungs and contains chemicals that can cause cancer'],
        ['Carbon monoxide', 'A poisonous gas that reduces the amount of oxygen the blood can carry'],
      ],
      hint: 'One is a gas, one is sticky, and one is the drug that makes people want to keep smoking.',
      ask: (l) => `What does ${l === 'Tar' ? 'tar' : l.toLowerCase()} in tobacco smoke do?`,
      lv: [1, 4],
    },
    {
      prompt: 'Match each disease linked to smoking to what happens in it.',
      pairs: [
        ['Lung cancer', 'Cells in the lungs divide out of control and form a tumour'],
        ['Emphysema', 'The walls of the alveoli break down, so there is less surface area for gas exchange'],
        ['Bronchitis', 'The airways become inflamed and blocked with mucus, causing a lot of coughing'],
        ['Heart disease', 'The blood vessels that supply the heart muscle become narrower'],
      ],
      hint: 'Emphysema affects the air sacs; bronchitis affects the airways.',
      ask: (l) => `What happens in ${l.toLowerCase()}?`,
      lv: [2, 4],
    },
  ],
  mcqs: [
    {
      q: 'Which substance in tobacco smoke is addictive?',
      a: 'Nicotine',
      wrong: [
        { label: 'Tar', misconception: 'tar-addictive', feedback: 'Tar coats the lungs and can cause cancer, but it is nicotine that is addictive.' },
        { label: 'Carbon monoxide', misconception: 'co-addictive', feedback: 'Carbon monoxide reduces the oxygen carried by the blood. Nicotine is the addictive drug.' },
        { label: 'Oxygen', misconception: 'oxygen-smoke', feedback: 'Oxygen is not what makes smoking addictive.' },
      ],
      hint: 'It is the drug in tobacco.',
      why: 'Nicotine is the addictive drug in tobacco. It is a stimulant and also increases heart rate.',
      lv: [1, 3],
    },
    {
      q: 'Which substance in tobacco smoke reduces the amount of oxygen the blood can carry?',
      a: 'Carbon monoxide',
      wrong: [
        { label: 'Nicotine', misconception: 'nicotine-oxygen', feedback: 'Nicotine is the addictive drug. Carbon monoxide is the gas that reduces oxygen carried.' },
        { label: 'Tar', misconception: 'tar-oxygen', feedback: 'Tar coats the lungs. Carbon monoxide is the gas that takes the place of oxygen in red blood cells.' },
        { label: 'Carbon dioxide', misconception: 'co2-for-co', feedback: 'Watch the name: it is carbon monoxide, a poisonous gas.' },
      ],
      hint: 'It is a poisonous gas.',
      why: 'Carbon monoxide joins with the substance in red blood cells that normally carries oxygen, so the blood carries less oxygen. Smokers get out of breath more easily.',
      lv: [1, 3],
    },
    {
      q: 'Why do many smokers have a "smoker\'s cough"?',
      a: 'Chemicals in smoke damage the cilia, so mucus is not swept away and has to be coughed up',
      wrong: [
        { label: 'Smoke makes the lungs produce oxygen', misconception: 'smoke-oxygen', feedback: 'The lungs do not produce oxygen. The cough is caused by mucus building up.' },
        { label: 'Nicotine makes the diaphragm stop working', misconception: 'nicotine-diaphragm', feedback: 'The cough comes from damaged cilia and extra mucus.' },
        { label: 'Smoke cools the throat down', misconception: 'smoke-cools', feedback: 'Tobacco smoke is hot. The cough is caused by mucus building up.' },
      ],
      hint: 'Think about the tiny hairs lining the trachea and bronchi.',
      why: 'Cilia normally sweep mucus, with trapped dust and microbes, up out of the lungs. Smoke damages the cilia and makes more mucus, so it builds up and the smoker has to cough to clear it.',
      lv: [2, 4],
    },
    {
      q: 'Why do people with emphysema get out of breath easily?',
      a: 'The walls of the alveoli break down, so there is less surface area for oxygen to diffuse into the blood',
      wrong: [
        { label: 'Their lungs fill up with tar until no air can get in', misconception: 'lungs-full-tar', feedback: 'Tar coats the lungs, but the problem in emphysema is damaged alveoli.' },
        { label: 'Their heart stops pumping blood to the lungs', misconception: 'heart-stops', feedback: 'The heart still pumps; the alveoli are damaged.' },
        { label: 'They breathe in too much oxygen', misconception: 'too-much-oxygen', feedback: 'They get too little oxygen, not too much.' },
      ],
      hint: 'What does a large surface area in the lungs allow?',
      why: 'In emphysema, the thin walls between alveoli break down, making fewer, larger air spaces. The surface area for gas exchange falls, so less oxygen gets into the blood.',
      lv: [3, 5],
    },
    {
      q: 'What is passive smoking?',
      a: 'Breathing in other people\'s tobacco smoke',
      wrong: [
        { label: 'Smoking only a few cigarettes a week', misconception: 'passive-few', feedback: 'That is still active smoking. Passive smoking means breathing in someone else\'s smoke.' },
        { label: 'Smoking a cigarette without lighting it', misconception: 'passive-unlit', feedback: 'Passive smoking is breathing in smoke from someone else.' },
        { label: 'A safe kind of smoking with no health risks', misconception: 'passive-safe', feedback: 'Passive smoking can also harm health, especially for children.' },
      ],
      hint: '"Passive" means it happens to you without you doing it.',
      why: 'Passive smoking means breathing in smoke from other people\'s cigarettes. It can also cause health problems, which is one reason smoking is banned in enclosed public places in the UK.',
      lv: [2, 4],
    },
    {
      q: 'Which organ is most damaged by drinking large amounts of alcohol over many years?',
      a: 'The liver',
      wrong: [
        { label: 'The lungs', misconception: 'alcohol-lungs', feedback: 'Smoking damages the lungs. Alcohol is broken down in the liver, which it damages.' },
        { label: 'The bones of the legs', misconception: 'alcohol-bones', feedback: 'The liver is the main organ damaged by alcohol.' },
        { label: 'The oesophagus only', misconception: 'alcohol-oesophagus', feedback: 'Alcohol passes through the oesophagus, but the liver is where it is broken down and does most harm.' },
      ],
      hint: 'This organ breaks down alcohol and other poisons in the blood.',
      why: 'The liver breaks down alcohol. Drinking too much over many years can scar and destroy liver tissue (cirrhosis). Heavy drinking also damages the brain and increases the risk of some cancers.',
      lv: [1, 3],
    },
    {
      q: 'Why is a pregnant woman advised not to drink any alcohol?',
      a: 'Alcohol can cross the placenta and harm the developing baby',
      wrong: [
        { label: 'Alcohol is a stimulant that makes the baby too active', misconception: 'alcohol-stimulant-baby', feedback: 'Alcohol is a depressant. The danger is that it reaches the baby through the placenta.' },
        { label: 'The placenta blocks alcohol, so the advice is only for the mother\'s liver', misconception: 'placenta-blocks-alcohol', feedback: 'Alcohol does cross the placenta.' },
        { label: 'Alcohol makes the pregnancy last longer', misconception: 'alcohol-longer', feedback: 'The danger is harm to the baby\'s development.' },
      ],
      hint: 'How do substances in the mother\'s blood reach the fetus?',
      why: 'Alcohol passes from the mother\'s blood across the placenta into the fetus\'s blood, where it can harm the baby\'s development, especially the brain.',
      lv: [3, 5],
    },
    {
      q: 'Why does a smoker\'s heart have to work harder?',
      a: 'Carbon monoxide means the blood carries less oxygen, and nicotine raises the heart rate',
      wrong: [
        { label: 'Tar makes the blood thicker', misconception: 'tar-blood', feedback: 'Tar stays mainly in the lungs. Carbon monoxide and nicotine affect the heart.' },
        { label: 'Smoking makes the heart smaller', misconception: 'heart-smaller', feedback: 'The heart works harder because of less oxygen in the blood and the effect of nicotine.' },
        { label: 'The smoke goes straight into the heart', misconception: 'smoke-heart', feedback: 'Smoke goes into the lungs; chemicals from it enter the blood.' },
      ],
      hint: 'Think about which substance affects oxygen in the blood, and which one is a stimulant.',
      why: 'With less oxygen carried by the blood (because of carbon monoxide), the heart must pump faster to supply the body. Nicotine also increases heart rate, and smoking narrows blood vessels, raising the risk of heart disease.',
      lv: [4, 5],
    },
  ],
  written: [
    {
      prompt: 'Explain how smoking damages the gas exchange system.',
      model: 'Tar in tobacco smoke coats the lungs and contains chemicals that can cause lung cancer. Smoke damages the cilia in the airways, so mucus builds up and causes a smoker\'s cough and infections such as bronchitis. Smoking can also break down the walls of the alveoli (emphysema), which reduces the surface area for gas exchange. Carbon monoxide reduces the amount of oxygen the blood can carry, so smokers get out of breath more easily.',
      checklist: ['Mentions tar and cancer', 'Mentions damaged cilia and mucus building up', 'Mentions emphysema or damaged alveoli', 'Links damage to less surface area or less oxygen getting into the blood', 'Mentions carbon monoxide'],
      hint: 'Think about the airways, the alveoli and the blood.',
      passMark: 3,
    },
    {
      prompt: 'Describe the short-term and long-term effects of drinking alcohol on the body.',
      model: 'Alcohol is a depressant, so in the short term it slows down the nervous system. Reactions become slower, and judgement, balance and speech are affected, which makes accidents more likely. In the long term, drinking large amounts can damage the liver (cirrhosis), damage the brain, and increase the risk of some cancers. People can also become addicted to alcohol.',
      checklist: ['Says alcohol is a depressant', 'Gives a short-term effect (slower reactions, poor judgement or balance)', 'Gives a long-term effect on the liver', 'Gives another long-term effect (brain, cancer, addiction)'],
      hint: 'Split your answer into what happens soon after drinking, and what can happen after many years.',
    },
  ],
}

interface Drink {
  name: string
  many: string
  ml: number
  abv: number
}
const DRINKS: Drink[] = [
  { name: 'a 500 ml bottle of beer', many: '500 ml bottles of beer', ml: 500, abv: 4 },
  { name: 'a 500 ml bottle of beer', many: '500 ml bottles of beer', ml: 500, abv: 5 },
  { name: 'a 250 ml glass of wine', many: '250 ml glasses of wine', ml: 250, abv: 12 },
  { name: 'a 250 ml glass of wine', many: '250 ml glasses of wine', ml: 250, abv: 14 },
  { name: 'a 125 ml glass of wine', many: '125 ml glasses of wine', ml: 125, abv: 12 },
  { name: 'a 25 ml measure of spirits', many: '25 ml measures of spirits', ml: 25, abv: 40 },
  { name: 'a 1000 ml bottle of cider', many: '1000 ml bottles of cider', ml: 1000, abv: 5 },
  { name: 'a 200 ml bottle of cider', many: '200 ml bottles of cider', ml: 200, abv: 5 },
]

function unitGenerators(): ItemGenerator[] {
  return [
    G('bio.health.smoking-alcohol.units', 'bio.health.smoking-alcohol', [3, 5], (rng, d) => {
      const dr = rng.pick(DRINKS)
      const units = round((dr.ml * dr.abv) / 1000, 2)
      if (d >= 5) {
        const n = rng.pick([2, 3, 4])
        const total = round(units * n, 2)
        return num({
          prompt: `In the UK, the number of units of alcohol in a drink = volume in ml × percentage of alcohol ÷ 1000.\nHow many units of alcohol are there altogether in ${n} ${dr.many} that are ${dr.abv}% alcohol?`,
          answer: total,
          suffix: 'units',
          tolerance: 0.01,
          hint: 'Work out the units in one drink first, then multiply by the number of drinks.',
          explanation: `One drink: ${dr.ml} × ${dr.abv} ÷ 1000 = ${fmt(units)} units. ${n} drinks: ${fmt(units)} × ${n} = ${fmt(total)} units.`,
          errors: [{ values: [units], tag: 'one-drink', message: 'That is the number of units in one drink. Multiply by the number of drinks.' }],
        })
      }
      return num({
        prompt: `In the UK, the number of units of alcohol in a drink = volume in ml × percentage of alcohol ÷ 1000.\nHow many units of alcohol are there in ${dr.name} that is ${dr.abv}% alcohol?`,
        answer: units,
        suffix: 'units',
        tolerance: 0.01,
        hint: 'Multiply the volume in ml by the percentage, then divide by 1000.',
        explanation: `${dr.ml} × ${dr.abv} = ${dr.ml * dr.abv}. ${dr.ml * dr.abv} ÷ 1000 = ${fmt(units)} units.`,
        errors: [{ values: [dr.ml * dr.abv], tag: 'forgot-1000', message: 'Remember to divide by 1000.' }],
      })
    }),
  ]
}

export const healthGenerators: ItemGenerator[] = [
  ...bankGenerators(drugs),
  ...medicinalClassify,
  ...stimulantClassify,
  ...bankGenerators(smokingAlcohol),
  ...unitGenerators(),
]
