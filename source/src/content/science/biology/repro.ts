import type { ItemGenerator } from '@/engine/registry'
import { choice } from '../../kit'
import { bankGenerators, classifyGenerators, G, num, orderedChoice, type Bank } from './factory'

// =====================================================================================================================
// Reproduction: human reproductive systems, puberty and the menstrual cycle, fertilisation, pregnancy and birth,
// flowers, pollination and fertilisation in plants, seed dispersal and germination. Kept at the factual level of a
// Year 7 textbook.
// =====================================================================================================================

const humanSystems: Bank = {
  skill: 'bio.repro.human-systems',
  noun: 'part of the reproductive system',
  meaningPrompt: (t) => `What is the job of the ${t.replace(/ \(.*\)$/, '').toLowerCase()}?`,
  matchPrompt: 'Match each part of the reproductive system to its job.',
  terms: [
    { term: 'Testes', def: 'Make sperm cells and the male sex hormone, testosterone' },
    { term: 'Scrotum', def: 'A bag of skin that holds the testes outside the body, where it is slightly cooler' },
    { term: 'Sperm duct', def: 'A tube that carries sperm cells from the testes towards the urethra' },
    { term: 'Glands (such as the prostate gland)', def: 'Add a fluid to the sperm cells that gives them nutrients; the mixture is called semen' },
    { term: 'Penis', def: 'Carries sperm out of the male body and places them in the vagina during sexual intercourse' },
    { term: 'Ovaries', def: 'Contain egg cells, release one each month, and make female sex hormones' },
    { term: 'Oviduct (fallopian tube)', def: 'Carries the egg from the ovary to the uterus; it is where fertilisation usually happens' },
    { term: 'Uterus (womb)', def: 'A muscular bag with a thick lining, where a baby develops during pregnancy' },
    { term: 'Cervix', def: 'A ring of muscle at the bottom of the uterus that keeps the baby in place until birth' },
    { term: 'Vagina', def: 'A muscular tube that leads from the cervix to the outside of the body' },
  ],
  orders: [
    {
      prompt: 'Put these in the order that sperm cells pass through them, from where they are made to where they usually meet an egg.',
      steps: ['Testes', 'Sperm duct', 'Urethra (inside the penis)', 'Vagina', 'Cervix', 'Uterus', 'Oviduct'],
      direction: ['first', 'last'],
      hint: 'Sperm are made in the testes. Fertilisation usually happens in the oviduct.',
      why: 'Sperm are made in the testes, travel along the sperm duct (where fluid from the glands is added) and leave through the urethra in the penis. In the female, they swim from the vagina through the cervix and uterus into an oviduct, where they may meet an egg.',
      lv: [3, 5],
    },
    {
      prompt: 'Put these parts of the female reproductive system in order, starting from where an egg is released.',
      steps: ['Ovary', 'Oviduct', 'Uterus', 'Cervix', 'Vagina'],
      direction: ['first', 'last'],
      hint: 'The egg is released from an ovary and is carried towards the uterus.',
      why: 'An egg is released from an ovary and moves along the oviduct to the uterus. Below the uterus is the cervix, which opens into the vagina.',
      lv: [2, 4],
    },
  ],
  mcqs: [
    {
      q: 'Where are sperm cells made?',
      a: 'In the testes',
      wrong: [
        { label: 'In the penis', misconception: 'sperm-penis', feedback: 'The penis carries sperm out of the body, but sperm are made in the testes.' },
        { label: 'In the sperm duct', misconception: 'sperm-duct-makes', feedback: 'The sperm duct is a tube that carries sperm; it does not make them.' },
        { label: 'In the prostate gland', misconception: 'gland-makes-sperm', feedback: 'The glands add fluid to sperm to make semen. Sperm are made in the testes.' },
      ],
      hint: 'They are held in the scrotum, outside the body.',
      why: 'Sperm cells are made in the testes. The testes also make the hormone testosterone.',
      lv: [1, 3],
    },
    {
      q: 'Which organ releases an egg cell about once a month?',
      a: 'An ovary',
      wrong: [
        { label: 'The uterus', misconception: 'uterus-releases-egg', feedback: 'The uterus is where a baby develops. Eggs are released from the ovaries.' },
        { label: 'The cervix', misconception: 'cervix-egg', feedback: 'The cervix is the ring of muscle at the bottom of the uterus.' },
        { label: 'The vagina', misconception: 'vagina-egg', feedback: 'The vagina leads from the cervix to the outside of the body.' },
      ],
      hint: 'There are two of these, one at the end of each oviduct.',
      why: 'The two ovaries contain egg cells. Usually one egg is released each month.',
      lv: [1, 3],
    },
    {
      q: 'Where does fertilisation usually take place in the female reproductive system?',
      a: 'In an oviduct (fallopian tube)',
      wrong: [
        { label: 'In the uterus', misconception: 'fertilised-in-uterus', feedback: 'The embryo settles into the uterus lining later. Fertilisation usually happens in the oviduct.' },
        { label: 'In the vagina', misconception: 'fertilised-in-vagina', feedback: 'Sperm are placed in the vagina, but they have to swim much further to reach the egg.' },
        { label: 'In the ovary', misconception: 'fertilised-in-ovary', feedback: 'The egg leaves the ovary first, then travels along the oviduct.' },
      ],
      hint: 'The egg is travelling from the ovary towards the uterus when it meets the sperm.',
      why: 'The egg moves along the oviduct after it is released. If sperm are present, fertilisation usually happens there. The embryo then moves to the uterus and implants in its lining.',
      lv: [2, 4],
    },
    {
      q: 'What are gametes?',
      a: 'Sex cells: sperm cells in males and egg cells in females',
      wrong: [
        { label: 'The hormones that cause puberty', misconception: 'gamete-hormone', feedback: 'Hormones are chemical messengers. Gametes are cells.' },
        { label: 'The tubes that carry eggs and sperm', misconception: 'gamete-tube', feedback: 'Those are the oviducts and sperm ducts. Gametes are the sex cells themselves.' },
        { label: 'Any cell in the body that has a nucleus', misconception: 'gamete-any-cell', feedback: 'Gametes are only the sex cells: sperm and eggs.' },
      ],
      hint: 'They are the two kinds of cell that join at fertilisation.',
      why: 'Gametes are sex cells. The male gamete is the sperm cell and the female gamete is the egg cell.',
      lv: [1, 3],
    },
    {
      q: 'What is semen?',
      a: 'Sperm cells mixed with a fluid from the glands',
      wrong: [
        { label: 'Another name for a single sperm cell', misconception: 'semen-is-sperm', feedback: 'Semen contains many sperm cells in a fluid.' },
        { label: 'A hormone made in the testes', misconception: 'semen-hormone', feedback: 'The hormone made in the testes is testosterone.' },
        { label: 'The fluid that surrounds a baby in the uterus', misconception: 'semen-amniotic', feedback: 'That is amniotic fluid.' },
      ],
      hint: 'Glands such as the prostate gland add something to the sperm.',
      why: 'Glands add a fluid to sperm cells as they pass along the sperm duct. The fluid gives the sperm nutrients to help them swim. Sperm plus this fluid is called semen.',
      lv: [2, 4],
    },
    {
      q: 'Why are the testes held outside the body, in the scrotum?',
      a: 'Sperm develop best at a temperature slightly lower than body temperature',
      wrong: [
        { label: 'So that there is more room for the bladder', misconception: 'testes-room', feedback: 'The reason is temperature, not space.' },
        { label: 'So that sperm can be made by photosynthesis', misconception: 'testes-light', feedback: 'Sperm are made by cell division, not photosynthesis.' },
        { label: 'Because the testes need to be close to the ovaries', misconception: 'testes-ovaries', feedback: 'The testes are in the male body; the ovaries are in the female body.' },
      ],
      hint: 'The scrotum is a little cooler than the inside of the body.',
      why: 'Sperm production works best at a temperature a little below normal body temperature, so the testes sit in the scrotum outside the body.',
      lv: [3, 5],
    },
    {
      q: 'Which statement compares egg cells and sperm cells correctly?',
      a: 'An egg cell is much larger than a sperm cell, and far fewer eggs are released',
      wrong: [
        { label: 'Sperm cells are larger than egg cells', misconception: 'sperm-larger', feedback: 'The egg is one of the largest cells in the body, with a food store in its cytoplasm.' },
        { label: 'Millions of eggs are released every day', misconception: 'many-eggs', feedback: 'Usually only one egg is released each month. Millions of sperm are made every day.' },
        { label: 'Egg cells have a tail so they can swim', misconception: 'egg-tail', feedback: 'Sperm cells have tails. The egg is moved along the oviduct.' },
      ],
      hint: 'Think about the food store in an egg cell, and how often an egg is released.',
      why: 'An egg cell is large because its cytoplasm contains a food store. Usually one egg is released a month, while millions of tiny sperm cells are made each day.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Describe the journey of a sperm cell from where it is made to where it may fertilise an egg.',
      model: 'Sperm cells are made in the testes. They travel along the sperm duct, where glands add a fluid that gives them nutrients, making semen. The semen leaves the male body through the urethra in the penis. In the female, the sperm swim from the vagina, through the cervix and the uterus, and into an oviduct. If an egg is there, one sperm may join with it: this is fertilisation.',
      checklist: ['Says sperm are made in the testes', 'Mentions the sperm duct and urethra (or penis)', 'Mentions glands adding fluid (semen)', 'Gives the route vagina, cervix, uterus, oviduct', 'Says fertilisation usually happens in the oviduct'],
      hint: 'Name each part in order, and say what happens there.',
      passMark: 3,
    },
  ],
}

const systemsClassify = classifyGenerators('bio.repro.human-systems', {
  id: 'male-female',
  categories: ['Male reproductive system', 'Female reproductive system'],
  items: [
    ['the testes', 'Male reproductive system'],
    ['the scrotum', 'Male reproductive system'],
    ['the sperm duct', 'Male reproductive system'],
    ['the prostate gland', 'Male reproductive system'],
    ['the penis', 'Male reproductive system'],
    ['the ovaries', 'Female reproductive system'],
    ['the oviducts', 'Female reproductive system'],
    ['the uterus', 'Female reproductive system'],
    ['the cervix', 'Female reproductive system'],
    ['the vagina', 'Female reproductive system'],
  ],
  ask: (item) => `Which system is ${item} part of?`,
  hint: 'Think about whether it makes or carries sperm, or eggs.',
  means: {
    'Male reproductive system': 'The male system includes the testes, scrotum, sperm ducts, glands, urethra and penis.',
    'Female reproductive system': 'The female system includes the ovaries, oviducts, uterus, cervix and vagina.',
  },
})

// ----------------------------------------------------------------------------------------------- puberty

const puberty: Bank = {
  skill: 'bio.repro.puberty',
  terms: [
    { term: 'Puberty', def: 'The time when the body changes physically, so that the reproductive organs start to work' },
    { term: 'Adolescence', def: 'The whole period of growing up from a child to an adult, including emotional as well as physical changes' },
    { term: 'Hormone', def: 'A chemical messenger, carried in the blood, that controls changes in the body' },
    { term: 'Menstrual cycle', def: 'A cycle of about 28 days in which an egg is released and the lining of the uterus builds up and then breaks down' },
    { term: 'Ovulation', def: 'The release of an egg from an ovary' },
    { term: 'Menstruation', def: 'The loss of the uterus lining, with a small amount of blood, through the vagina (a period)' },
  ],
  orders: [
    {
      prompt: 'Starting from day 1 (the first day of a period), put these stages of the menstrual cycle in order.',
      steps: [
        'The lining of the uterus breaks down and leaves the body through the vagina (a period)',
        'The lining of the uterus starts to build up again',
        'An egg is released from an ovary, at about day 14 (ovulation)',
        'The lining stays thick, ready in case a fertilised egg arrives',
      ],
      direction: ['first', 'last'],
      hint: 'Day 1 is the start of a period. Ovulation is about halfway through the cycle.',
      why: 'Days 1 to about 5: a period. Then the uterus lining thickens again. At about day 14 an egg is released. The lining stays thick in case the egg is fertilised; if it is not, the lining breaks down and the next cycle starts.',
      lv: [2, 5],
    },
  ],
  mcqs: [
    {
      q: 'About how long does a typical menstrual cycle last?',
      a: 'About 28 days',
      wrong: [
        { label: 'About 7 days', misconception: 'cycle-period-length', feedback: 'A period itself lasts a few days, but the whole cycle is about 28 days.' },
        { label: 'About 14 days', misconception: 'cycle-14', feedback: 'Ovulation happens at about day 14. The whole cycle is about 28 days.' },
        { label: 'About 1 year', misconception: 'cycle-year', feedback: 'The cycle repeats roughly every month.' },
      ],
      order: ['About 7 days', 'About 14 days', 'About 28 days', 'About 1 year'],
      hint: 'It repeats roughly once a month.',
      why: 'A typical menstrual cycle lasts about 28 days, although it varies from person to person and is often irregular at first.',
      lv: [1, 3],
    },
    {
      q: 'In a 28-day menstrual cycle, at about which day is an egg usually released?',
      a: 'About day 14',
      wrong: [
        { label: 'Day 1', misconception: 'ovulation-day-1', feedback: 'Day 1 is the first day of a period.' },
        { label: 'About day 5', misconception: 'ovulation-day-5', feedback: 'At about day 5 the period is usually ending.' },
        { label: 'Day 28', misconception: 'ovulation-day-28', feedback: 'Day 28 is the end of the cycle, just before the next period.' },
      ],
      order: ['Day 1', 'About day 5', 'About day 14', 'Day 28'],
      hint: 'It is about halfway through the cycle.',
      why: 'Ovulation (the release of an egg) usually happens about halfway through the cycle, around day 14.',
      lv: [2, 4],
    },
    {
      q: 'Why does the lining of the uterus become thick during the menstrual cycle?',
      a: 'So that a fertilised egg could settle into it and develop',
      wrong: [
        { label: 'To make egg cells', misconception: 'lining-makes-eggs', feedback: 'Eggs come from the ovaries. The lining is prepared for a fertilised egg.' },
        { label: 'To make sperm cells', misconception: 'lining-makes-sperm', feedback: 'Sperm are made in the testes, in males.' },
        { label: 'To stop the egg from leaving the ovary', misconception: 'lining-blocks-egg', feedback: 'The lining is in the uterus, not the ovary.' },
      ],
      hint: 'Where does a fertilised egg go to develop into a baby?',
      why: 'The thick lining, with a good blood supply, is ready for a fertilised egg (embryo) to implant. If no egg is fertilised, the lining breaks down and a period begins.',
      lv: [2, 4],
    },
    {
      q: 'What happens during a period (menstruation)?',
      a: 'The lining of the uterus breaks down and leaves the body through the vagina, with a small amount of blood',
      wrong: [
        { label: 'An egg is released from an ovary', misconception: 'period-is-ovulation', feedback: 'That is ovulation, which happens about halfway through the cycle.' },
        { label: 'The uterus lining becomes thicker', misconception: 'period-thickens', feedback: 'The lining builds up after the period, not during it.' },
        { label: 'An egg is fertilised by a sperm', misconception: 'period-fertilisation', feedback: 'A period happens when an egg has not been fertilised.' },
      ],
      hint: 'A period happens when no fertilised egg has implanted.',
      why: 'If the egg is not fertilised, the thick lining of the uterus is not needed. It breaks down and passes out through the vagina with a little blood. This usually lasts a few days.',
      lv: [1, 3],
    },
    {
      q: 'What starts the changes of puberty?',
      a: 'Hormones (chemical messengers) released into the blood',
      wrong: [
        { label: 'Eating more protein', misconception: 'puberty-diet', feedback: 'A good diet helps growth, but puberty is triggered by hormones.' },
        { label: 'Doing more exercise', misconception: 'puberty-exercise', feedback: 'Exercise does not start puberty; hormones do.' },
        { label: 'Reaching exactly the age of 13', misconception: 'puberty-fixed-age', feedback: 'Puberty starts at different ages for different people.' },
      ],
      hint: 'They are chemical messengers carried in the blood.',
      why: 'Puberty is started by hormones. In boys the main sex hormone is testosterone, made in the testes. In girls the main sex hormone is oestrogen, made in the ovaries. Puberty starts at different ages for different people.',
      lv: [2, 4],
    },
    {
      q: 'Which sex hormone, made in the testes, causes most of the changes in boys during puberty?',
      a: 'Testosterone',
      wrong: [
        { label: 'Oestrogen', misconception: 'oestrogen-boys', feedback: 'Oestrogen is the main female sex hormone, made in the ovaries.' },
        { label: 'Insulin', misconception: 'insulin-puberty', feedback: 'Insulin controls blood sugar; it is not a sex hormone.' },
        { label: 'Adrenaline', misconception: 'adrenaline-puberty', feedback: 'Adrenaline prepares the body for action; it is not a sex hormone.' },
      ],
      hint: 'Its name starts with the same letters as "testes".',
      why: 'Testosterone, made in the testes, causes changes such as the voice breaking, facial hair growing and the testes starting to make sperm.',
      lv: [3, 5],
    },
    {
      q: 'Which sex hormone, made in the ovaries, causes most of the changes in girls during puberty?',
      a: 'Oestrogen',
      wrong: [
        { label: 'Testosterone', misconception: 'testosterone-girls', feedback: 'Testosterone is the main male sex hormone, made in the testes.' },
        { label: 'Insulin', misconception: 'insulin-puberty', feedback: 'Insulin controls blood sugar; it is not a sex hormone.' },
        { label: 'Adrenaline', misconception: 'adrenaline-puberty', feedback: 'Adrenaline prepares the body for action; it is not a sex hormone.' },
      ],
      hint: 'It is made in the ovaries.',
      why: 'Oestrogen, made in the ovaries, causes changes such as breasts developing and the menstrual cycle starting.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Describe what happens to the uterus lining and the ovaries during one menstrual cycle.',
      model: 'The cycle lasts about 28 days. It starts with a period, when the lining of the uterus breaks down and leaves the body through the vagina for a few days. The lining then builds up again. At about day 14 an ovary releases an egg (ovulation). The lining stays thick in case the egg is fertilised. If it is not fertilised, the lining breaks down and the next period starts.',
      checklist: ['Says the cycle lasts about 28 days', 'Describes a period as the lining breaking down', 'Says the lining builds up again', 'Says an egg is released at about day 14 (ovulation)', 'Says what happens if the egg is not fertilised'],
      hint: 'Start at day 1, the first day of a period.',
      passMark: 3,
    },
  ],
}

const pubertyClassify = classifyGenerators('bio.repro.puberty', {
  id: 'who',
  categories: ['Boys', 'Girls', 'Both boys and girls'],
  items: [
    ['the voice breaks and becomes deeper', 'Boys'],
    ['the testes start to make sperm', 'Boys'],
    ['the shoulders get wider', 'Boys'],
    ['facial hair starts to grow', 'Boys'],
    ['breasts develop', 'Girls'],
    ['the hips get wider', 'Girls'],
    ['the ovaries start to release eggs', 'Girls'],
    ['periods start', 'Girls'],
    ['hair grows under the arms and around the genitals', 'Both boys and girls'],
    ['a growth spurt', 'Both boys and girls'],
    ['the skin becomes oilier and body odour increases', 'Both boys and girls'],
    ['emotional changes, such as mood swings', 'Both boys and girls'],
  ],
  ask: (item) => `"${item.charAt(0).toUpperCase() + item.slice(1)}." Who does this change at puberty mainly happen to?`,
  hint: 'Some changes are linked to the testes or the ovaries; others happen to everyone.',
  sortPrompt: 'Match each puberty change to who it happens to.',
  means: {
    Boys: 'In boys, testosterone causes the voice to break, facial hair to grow, the shoulders to widen and the testes to make sperm.',
    Girls: 'In girls, oestrogen causes breasts to develop, the hips to widen, the ovaries to release eggs and periods to start.',
    'Both boys and girls': 'Both boys and girls have a growth spurt, grow body hair, get oilier skin and stronger body odour, and go through emotional changes.',
  },
})

// ----------------------------------------------------------------------------------------------- pregnancy

const pregnancy: Bank = {
  skill: 'bio.repro.pregnancy',
  terms: [
    { term: 'Fertilisation', def: 'When the nucleus of a sperm cell joins with the nucleus of an egg cell' },
    { term: 'Embryo', def: 'The ball of cells that forms when a fertilised egg divides again and again' },
    { term: 'Implantation', def: 'When the embryo attaches itself to the thick lining of the uterus' },
    { term: 'Fetus', def: 'The name for the developing baby once its main organs have formed, from about 8 weeks' },
    { term: 'Placenta', def: 'The organ where substances pass between the mother\'s blood and the fetus\'s blood' },
    { term: 'Umbilical cord', def: 'Joins the fetus to the placenta and carries its blood to and from the placenta' },
    { term: 'Amniotic fluid', def: 'A liquid around the fetus that cushions it and protects it from bumps' },
    { term: 'Gestation', def: 'The time from fertilisation to birth, when the baby develops in the uterus' },
  ],
  orders: [
    {
      prompt: 'Put these stages, from fertilisation to birth, in order.',
      steps: [
        'The nucleus of a sperm cell joins with the nucleus of the egg in the oviduct',
        'The fertilised egg divides again and again to form a ball of cells (an embryo)',
        'The embryo implants in the thick lining of the uterus',
        'A placenta forms and the embryo develops into a fetus',
        'After about 9 months, muscles in the wall of the uterus contract and the baby is pushed out through the vagina',
      ],
      direction: ['first', 'last'],
      hint: 'Fertilisation comes first, then the cells divide before they settle in the uterus.',
      why: 'Fertilisation happens in the oviduct. The fertilised egg divides to form an embryo, which implants in the uterus lining. A placenta forms and the embryo becomes a fetus. At birth, the cervix widens and the muscles of the uterus contract to push the baby out.',
      lv: [2, 5],
    },
  ],
  mcqs: [
    {
      q: 'How long is the gestation period (pregnancy) in humans?',
      a: 'About 9 months',
      wrong: [
        { label: 'About 9 weeks', misconception: 'gestation-weeks', feedback: 'At about 8 or 9 weeks the embryo is only just becoming a fetus. Pregnancy lasts about 9 months.' },
        { label: 'About 4 months', misconception: 'gestation-short', feedback: 'Human pregnancy lasts about 9 months (about 40 weeks).' },
        { label: 'About 2 years', misconception: 'gestation-long', feedback: 'That is closer to an elephant\'s pregnancy. Humans: about 9 months.' },
      ],
      order: ['About 9 weeks', 'About 4 months', 'About 9 months', 'About 2 years'],
      hint: 'It is a little under a year.',
      why: 'Human gestation lasts about 9 months. Doctors usually count it as about 40 weeks.',
      lv: [1, 3],
    },
    {
      q: 'What is the job of the amniotic fluid?',
      a: 'To cushion the fetus and protect it from bumps',
      wrong: [
        { label: 'To carry oxygen to the fetus', misconception: 'amniotic-oxygen', feedback: 'Oxygen reaches the fetus from the placenta, through the umbilical cord.' },
        { label: 'To digest food for the fetus', misconception: 'amniotic-digest', feedback: 'The fetus gets food already digested, from the mother\'s blood via the placenta.' },
        { label: 'To make the hormones that start birth', misconception: 'amniotic-hormones', feedback: 'The fluid is mainly there for protection.' },
      ],
      hint: 'Think about the fetus floating in a liquid.',
      why: 'The fetus is surrounded by amniotic fluid inside a bag (the amniotic sac). The fluid acts as a shock absorber, protecting the fetus from bumps.',
      lv: [2, 4],
    },
    {
      q: 'Why should a pregnant woman not smoke or drink alcohol?',
      a: 'Harmful substances can pass across the placenta into the fetus\'s blood',
      wrong: [
        { label: 'The placenta blocks all harmful substances, so it does not matter', misconception: 'placenta-barrier', feedback: 'Some harmful substances, such as alcohol, nicotine and carbon monoxide, can cross the placenta.' },
        { label: 'Because the fetus breathes the smoke in through its mouth', misconception: 'fetus-breathes', feedback: 'The fetus does not breathe air. Substances reach it through the placenta.' },
        { label: 'It only matters during the last week of pregnancy', misconception: 'last-week-only', feedback: 'Harmful substances can affect the fetus at any stage, especially early on when organs are forming.' },
      ],
      hint: 'How does the fetus get substances from the mother?',
      why: 'Substances in the mother\'s blood, including alcohol and chemicals from cigarette smoke, can cross the placenta. Smoking reduces the oxygen reaching the fetus and can lead to a low birth weight; alcohol can harm the developing baby.',
      lv: [2, 4],
    },
    {
      q: 'In the placenta, does the mother\'s blood mix with the fetus\'s blood?',
      a: 'No: the two blood supplies are very close, so substances diffuse between them, but the blood does not mix',
      wrong: [
        { label: 'Yes: the mother pumps her blood straight into the fetus', misconception: 'blood-mixes', feedback: 'The two blood supplies are kept separate. Substances diffuse across a thin barrier.' },
        { label: 'Yes, but only at birth', misconception: 'blood-mixes-birth', feedback: 'The placenta keeps the blood separate. Substances pass by diffusion.' },
        { label: 'No: nothing at all passes between them', misconception: 'nothing-crosses', feedback: 'Oxygen and food pass to the fetus, and wastes pass back. Only the blood itself does not mix.' },
      ],
      hint: 'Think about how oxygen gets from the alveoli into your blood: across a thin wall.',
      why: 'In the placenta, the fetus\'s blood vessels are very close to the mother\'s blood. Oxygen and nutrients diffuse into the fetus\'s blood, and carbon dioxide and other wastes diffuse back, but the two blood supplies do not mix.',
      lv: [4, 5],
    },
    {
      q: 'What happens during birth?',
      a: 'The cervix widens and the muscles in the wall of the uterus contract to push the baby out through the vagina',
      wrong: [
        { label: 'The placenta pulls the baby out', misconception: 'placenta-pulls', feedback: 'The placenta comes out after the baby. The uterus muscles do the pushing.' },
        { label: 'The baby swims out using the amniotic fluid', misconception: 'baby-swims', feedback: 'Strong muscle contractions of the uterus push the baby out.' },
        { label: 'The baby leaves through an oviduct', misconception: 'birth-oviduct', feedback: 'The oviducts are far too narrow. The baby passes through the cervix and the vagina.' },
      ],
      hint: 'The uterus is a muscular bag.',
      why: 'When the baby is ready to be born, the cervix relaxes and widens, and the strong muscles of the uterus wall contract to push the baby out through the vagina. The placenta follows shortly afterwards.',
      lv: [2, 4],
    },
    {
      q: 'Which of these animals has the longest gestation period?',
      a: 'An elephant (about 22 months)',
      wrong: [
        { label: 'A human (about 9 months)', misconception: 'human-longest', feedback: 'Humans have a long gestation, but an elephant\'s is more than twice as long.' },
        { label: 'A dog (about 9 weeks)', misconception: 'dog-longest', feedback: 'A dog\'s pregnancy lasts only about 9 weeks.' },
        { label: 'A mouse (about 3 weeks)', misconception: 'mouse-longest', feedback: 'A mouse\'s pregnancy lasts only about 3 weeks.' },
      ],
      hint: 'Larger mammals usually have longer gestation periods.',
      why: 'In general, larger mammals have longer gestation periods. An elephant\'s pregnancy lasts about 22 months, a human\'s about 9 months, a dog\'s about 9 weeks and a mouse\'s about 3 weeks.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Explain how a fetus gets the oxygen and food it needs, and how it gets rid of its waste.',
      model: 'The fetus is joined to the placenta by the umbilical cord. In the placenta, the fetus\'s blood comes very close to the mother\'s blood, but the two do not mix. Oxygen and nutrients such as glucose diffuse from the mother\'s blood into the fetus\'s blood and are carried along the umbilical cord. Carbon dioxide and other wastes diffuse the other way, into the mother\'s blood, and she gets rid of them.',
      checklist: ['Mentions the placenta', 'Mentions the umbilical cord', 'Says oxygen and nutrients pass from mother to fetus', 'Says carbon dioxide or waste passes from fetus to mother', 'Uses the idea of diffusion, or says the blood does not mix'],
      hint: 'Name the two structures that link the fetus to its mother, and say which way each substance goes.',
      passMark: 3,
    },
  ],
}

const placentaClassify = classifyGenerators('bio.repro.pregnancy', {
  id: 'placenta-direction',
  categories: ['From the mother to the fetus', 'From the fetus to the mother'],
  items: [
    ['oxygen', 'From the mother to the fetus'],
    ['glucose', 'From the mother to the fetus'],
    ['alcohol, if the mother drinks', 'From the mother to the fetus'],
    ['nicotine, if the mother smokes', 'From the mother to the fetus'],
    ['carbon dioxide', 'From the fetus to the mother'],
    ['urea (a waste substance)', 'From the fetus to the mother'],
  ],
  ask: (item) => `Which way does ${item.replace(/,.*$/, '')} pass across the placenta${item.includes(',') ? ` (${item.replace(/^[^,]*, /, '')})` : ''}?`,
  hint: 'The fetus needs supplies from its mother and has to get rid of its wastes.',
  means: {
    'From the mother to the fetus': 'Useful substances (oxygen, nutrients) and some harmful ones (alcohol, nicotine) pass from the mother\'s blood to the fetus.',
    'From the fetus to the mother': 'Waste substances made by the fetus, such as carbon dioxide and urea, pass back into the mother\'s blood.',
  },
})

// ----------------------------------------------------------------------------------------------- flowers

const flowers: Bank = {
  skill: 'bio.repro.flowers',
  noun: 'part of the flower',
  meaningPrompt: (t) => `What is the job of the ${t.toLowerCase()} in a flower?`,
  matchPrompt: 'Match each part of the flower to its job.',
  terms: [
    { term: 'Petals', def: 'Often brightly coloured and scented, to attract insects' },
    { term: 'Sepals', def: 'Small leaf-like parts that protect the flower while it is a bud' },
    { term: 'Anther', def: 'Makes pollen grains, which contain the male gametes' },
    { term: 'Filament', def: 'The stalk that holds up the anther' },
    { term: 'Stigma', def: 'The top of the carpel, where pollen grains land' },
    { term: 'Style', def: 'The stalk that joins the stigma to the ovary' },
    { term: 'Ovary', def: 'Contains the ovules, and becomes the fruit after fertilisation' },
    { term: 'Ovule', def: 'Contains the female gamete (egg cell), and becomes a seed after fertilisation' },
    { term: 'Nectary', def: 'Makes a sugary liquid that insects feed on' },
  ],
  mcqs: [
    {
      q: 'Which part of a flower makes pollen?',
      a: 'The anther',
      wrong: [
        { label: 'The stigma', misconception: 'stigma-makes-pollen', feedback: 'The stigma is where pollen lands. Pollen is made in the anthers.' },
        { label: 'The ovary', misconception: 'ovary-pollen', feedback: 'The ovary contains ovules (the female part).' },
        { label: 'The petals', misconception: 'petal-pollen', feedback: 'Petals attract insects; they do not make pollen.' },
      ],
      hint: 'It sits on top of a filament.',
      why: 'Pollen grains are made in the anthers, at the tops of the filaments. Together the anther and filament make up the stamen, the male part of the flower.',
      lv: [1, 3],
    },
    {
      q: 'Which two parts make up the stamen (the male part of a flower)?',
      a: 'The anther and the filament',
      wrong: [
        { label: 'The stigma and the style', misconception: 'stamen-carpel', feedback: 'The stigma and style are parts of the carpel, the female part.' },
        { label: 'The petals and the sepals', misconception: 'stamen-petals', feedback: 'Petals and sepals are not male or female parts.' },
        { label: 'The ovary and the ovule', misconception: 'stamen-ovary', feedback: 'The ovary and ovules are female parts.' },
      ],
      hint: 'One part makes pollen and the other holds it up.',
      why: 'The stamen is the male part. It is made of the anther (which makes pollen) and the filament (which holds the anther up).',
      lv: [2, 4],
    },
    {
      q: 'Which three parts make up the carpel (the female part of a flower)?',
      a: 'The stigma, the style and the ovary',
      wrong: [
        { label: 'The anther, the filament and the stigma', misconception: 'carpel-mixed', feedback: 'The anther and filament are male parts (the stamen).' },
        { label: 'The petals, the sepals and the nectary', misconception: 'carpel-petals', feedback: 'These are not the reproductive parts.' },
        { label: 'The anther, the style and the petals', misconception: 'carpel-random', feedback: 'The carpel is the stigma, style and ovary.' },
      ],
      hint: 'Start at the top, where pollen lands, and go down to where the ovules are.',
      why: 'The carpel is the female part. Pollen lands on the stigma, the style holds the stigma up and joins it to the ovary, and the ovary contains the ovules.',
      lv: [2, 4],
    },
    {
      q: 'Many flowers have large, brightly coloured, scented petals. Why?',
      a: 'To attract insects, which carry pollen from flower to flower',
      wrong: [
        { label: 'To absorb more light for photosynthesis', misconception: 'petals-photosynthesis', feedback: 'Photosynthesis mainly happens in green leaves. Bright petals are signals to insects.' },
        { label: 'To scare away insects', misconception: 'petals-scare', feedback: 'It is the opposite: insect-pollinated flowers need insects to visit.' },
        { label: 'To make pollen', misconception: 'petals-pollen', feedback: 'Pollen is made in the anthers.' },
      ],
      hint: 'Which animals visit flowers?',
      why: 'Bright colours and scent attract insects such as bees. As they feed on nectar, pollen sticks to them and is carried to other flowers.',
      lv: [1, 3],
    },
    {
      q: 'After fertilisation, which part of a flower develops into a seed?',
      a: 'An ovule',
      wrong: [
        { label: 'The ovary', misconception: 'ovary-becomes-seed', feedback: 'The ovary develops into the fruit, which contains the seeds.' },
        { label: 'The anther', misconception: 'anther-seed', feedback: 'The anther makes pollen; it does not become a seed.' },
        { label: 'A petal', misconception: 'petal-seed', feedback: 'Petals usually wither and fall off after fertilisation.' },
      ],
      hint: 'It is the part that contains the female gamete.',
      why: 'Each fertilised ovule develops into a seed. The ovary around the ovules develops into the fruit.',
      lv: [3, 5],
    },
    {
      q: 'After fertilisation, which part of a flower develops into the fruit?',
      a: 'The ovary',
      wrong: [
        { label: 'The ovule', misconception: 'ovule-becomes-fruit', feedback: 'Each ovule becomes a seed. The ovary around them becomes the fruit.' },
        { label: 'The stigma', misconception: 'stigma-fruit', feedback: 'The stigma usually withers after pollination.' },
        { label: 'The sepals', misconception: 'sepals-fruit', feedback: 'Sepals protect the bud; they do not form the fruit.' },
      ],
      hint: 'A fruit contains seeds. Which part contains the ovules?',
      why: 'The ovary, which contains the ovules, develops into the fruit. The fertilised ovules inside become the seeds.',
      lv: [3, 5],
    },
  ],
}

const flowerClassify = classifyGenerators('bio.repro.flowers', {
  id: 'male-female',
  categories: ['Male part (stamen)', 'Female part (carpel)', 'Neither male nor female'],
  items: [
    ['the anther', 'Male part (stamen)'],
    ['the filament', 'Male part (stamen)'],
    ['the stigma', 'Female part (carpel)'],
    ['the style', 'Female part (carpel)'],
    ['the ovary', 'Female part (carpel)'],
    ['an ovule', 'Female part (carpel)'],
    ['the petals', 'Neither male nor female'],
    ['the sepals', 'Neither male nor female'],
    ['the nectary', 'Neither male nor female'],
  ],
  ask: (item) => `Is ${item} part of the male part of a flower, the female part, or neither?`,
  hint: 'The male part makes pollen; the female part receives it and contains the ovules.',
  sortPrompt: 'Match each part of a flower to the right group.',
  means: {
    'Male part (stamen)': 'The stamen is the anther and the filament.',
    'Female part (carpel)': 'The carpel is the stigma, the style and the ovary, which contains the ovules.',
    'Neither male nor female': 'Petals, sepals and nectaries help the flower but are not male or female parts.',
  },
})

// ----------------------------------------------------------------------------------------------- pollination

const pollination: Bank = {
  skill: 'bio.repro.pollination',
  terms: [
    { term: 'Pollination', def: 'The transfer of pollen from an anther to a stigma' },
    { term: 'Self-pollination', def: 'When pollen lands on a stigma of the same plant' },
    { term: 'Cross-pollination', def: 'When pollen is carried to a flower on a different plant of the same species' },
    { term: 'Fertilisation (in plants)', def: 'When the nucleus of a male gamete from a pollen grain joins with the nucleus of the female gamete in an ovule' },
    { term: 'Pollen tube', def: 'A tube that grows from a pollen grain down through the style to an ovule' },
  ],
  orders: [
    {
      prompt: 'Put these stages, from pollination to the making of a seed, in order.',
      steps: [
        'A pollen grain lands on the stigma',
        'A pollen tube grows down through the style',
        'The pollen tube reaches an ovule inside the ovary',
        'The male gamete nucleus joins with the female gamete nucleus (fertilisation)',
        'The ovule develops into a seed and the ovary into a fruit',
      ],
      direction: ['first', 'last'],
      hint: 'Pollen lands at the top of the carpel. The ovules are at the bottom.',
      why: 'After pollination, a pollen tube grows from the pollen grain down the style into the ovary. The male gamete nucleus travels down it and joins with the nucleus of the female gamete in an ovule. The ovule then becomes a seed and the ovary becomes a fruit.',
      lv: [2, 5],
    },
  ],
  mcqs: [
    {
      q: 'What is the difference between pollination and fertilisation in a plant?',
      a: 'Pollination is pollen landing on a stigma; fertilisation is when the male and female gamete nuclei join inside an ovule',
      wrong: [
        { label: 'There is no difference: they are two names for the same thing', misconception: 'pollination-is-fertilisation', feedback: 'They are different steps. Pollination comes first; fertilisation happens later, inside the ovule.' },
        { label: 'Pollination happens inside the ovule; fertilisation happens on the stigma', misconception: 'pollination-fertilisation-swapped', feedback: 'It is the other way round.' },
        { label: 'Fertilisation is when seeds are carried away from the plant', misconception: 'fertilisation-dispersal', feedback: 'That is seed dispersal.' },
      ],
      hint: 'One is about pollen moving; the other is about two nuclei joining.',
      why: 'Pollination is the transfer of pollen to a stigma. Fertilisation happens afterwards, when a pollen tube has grown to an ovule and the male gamete nucleus joins with the female gamete nucleus.',
      lv: [3, 5],
    },
    {
      q: 'Why do wind-pollinated plants make huge amounts of pollen?',
      a: 'Most of it is blown away and lost, so a lot is needed for some to land on the right stigma',
      wrong: [
        { label: 'So that insects have plenty to eat', misconception: 'wind-pollen-insects', feedback: 'Wind-pollinated plants do not rely on insects.' },
        { label: 'Because their pollen grains are very heavy', misconception: 'wind-pollen-heavy', feedback: 'Wind-carried pollen is small and light, so it can be blown a long way.' },
        { label: 'To make the flower look brighter', misconception: 'wind-pollen-bright', feedback: 'Wind-pollinated flowers are usually small and dull.' },
      ],
      hint: 'Think about how likely it is that one grain blown by the wind lands on the stigma of the same kind of plant.',
      why: 'The wind carries pollen in all directions, so most of it never reaches a flower of the same species. Making huge amounts makes it more likely that some will.',
      lv: [2, 4],
    },
    {
      q: 'Grasses are pollinated by the wind. Which feature would you expect their flowers to have?',
      a: 'Feathery stigmas that hang outside the flower',
      wrong: [
        { label: 'Large, brightly coloured petals', misconception: 'wind-bright-petals', feedback: 'Bright petals attract insects. Wind-pollinated flowers do not need them.' },
        { label: 'A strong, sweet scent', misconception: 'wind-scent', feedback: 'Scent attracts insects, which wind-pollinated flowers do not need.' },
        { label: 'Lots of sugary nectar', misconception: 'wind-nectar', feedback: 'Nectar is a reward for insects.' },
      ],
      hint: 'The flower needs to catch pollen that is floating in the air.',
      why: 'Wind-pollinated flowers have feathery stigmas hanging outside the flower to catch pollen from the air, and anthers hanging outside to release pollen into the wind. They do not need bright petals, scent or nectar.',
      lv: [2, 4],
    },
    {
      q: 'Many farmers who grow apples and strawberries are worried about falling numbers of bees. Why?',
      a: 'Bees pollinate the flowers, and without pollination fewer fruits are made',
      wrong: [
        { label: 'Bees eat the pests that damage the crops', misconception: 'bees-eat-pests', feedback: 'Bees feed on nectar and pollen. Their importance to farmers is pollination.' },
        { label: 'Bees add minerals to the soil', misconception: 'bees-minerals', feedback: 'Minerals come from fertilisers and decomposing material, not from bees.' },
        { label: 'Bees make the fruit sweeter by putting honey in it', misconception: 'bees-honey-fruit', feedback: 'Bees do not put honey into fruit.' },
      ],
      hint: 'What has to happen to a flower before it can make a fruit?',
      why: 'Many crops are insect-pollinated. When bees visit the flowers, they carry pollen between them. If there are fewer bees, fewer flowers are pollinated, so fewer fruits and seeds form. This is an example of interdependence.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Compare the flowers of insect-pollinated and wind-pollinated plants. Explain how each type is adapted.',
      model: 'Insect-pollinated flowers have large, brightly coloured, scented petals and nectar to attract insects. Their anthers and stigma are inside the flower, so insects brush against them, and the pollen is sticky or spiky so it sticks to insects. Wind-pollinated flowers have small, dull petals or none, because they do not need to attract insects. Their anthers hang outside to release pollen into the wind, their feathery stigmas hang outside to catch it, and they make lots of small, light pollen.',
      checklist: ['Insect: bright petals, scent or nectar to attract insects', 'Insect: sticky or spiky pollen, or anthers and stigma inside', 'Wind: small, dull petals (or none)', 'Wind: anthers and feathery stigmas hang outside', 'Wind: lots of small, light pollen'],
      hint: 'For each type, describe the petals, the anthers and stigma, and the pollen.',
      passMark: 3,
    },
  ],
}

const pollinationClassify = classifyGenerators('bio.repro.pollination', {
  id: 'insect-wind',
  categories: ['Insect-pollinated', 'Wind-pollinated'],
  items: [
    ['large, brightly coloured petals', 'Insect-pollinated'],
    ['a sweet scent', 'Insect-pollinated'],
    ['nectaries that make nectar', 'Insect-pollinated'],
    ['sticky or spiky pollen grains', 'Insect-pollinated'],
    ['anthers and stigma kept inside the flower', 'Insect-pollinated'],
    ['small, dull green or brown petals, or none at all', 'Wind-pollinated'],
    ['feathery stigmas hanging outside the flower', 'Wind-pollinated'],
    ['anthers hanging outside the flower on long filaments', 'Wind-pollinated'],
    ['huge numbers of small, light, smooth pollen grains', 'Wind-pollinated'],
    ['no scent and no nectar', 'Wind-pollinated'],
  ],
  ask: (item) => `A flower has ${item}. Is it more likely to be insect-pollinated or wind-pollinated?`,
  hint: 'Does the feature help to attract an insect, or to use the wind?',
  means: {
    'Insect-pollinated': 'Insect-pollinated flowers attract insects with colour, scent and nectar, and have sticky pollen that clings to them.',
    'Wind-pollinated': 'Wind-pollinated flowers release lots of light pollen from dangling anthers and catch it with feathery stigmas.',
  },
})

// ----------------------------------------------------------------------------------------------- seeds

const seeds: Bank = {
  skill: 'bio.repro.seeds',
  terms: [
    { term: 'Seed dispersal', def: 'The spreading of seeds away from the parent plant' },
    { term: 'Germination', def: 'When a seed starts to grow into a new plant' },
    { term: 'Seed coat', def: 'A tough outer layer that protects the seed' },
    { term: 'Food store', def: 'Part of a seed containing food, often starch, for the young plant until it can photosynthesise' },
    { term: 'Fruit', def: 'The part that forms from the ovary after fertilisation and contains the seeds' },
  ],
  mcqs: [
    {
      q: 'What do most seeds need in order to germinate?',
      a: 'Water, oxygen and warmth',
      wrong: [
        { label: 'Light, carbon dioxide and water', misconception: 'germination-photosynthesis', feedback: 'Those are needed for photosynthesis. A seed uses its food store until its leaves grow.' },
        { label: 'Soil and fertiliser only', misconception: 'germination-soil', feedback: 'Seeds can germinate on damp cotton wool with no soil at all.' },
        { label: 'Light only', misconception: 'germination-light', feedback: 'Most seeds germinate in the dark under the soil.' },
      ],
      hint: 'Seeds can germinate on damp cotton wool in a warm, dark cupboard.',
      why: 'Most seeds need water, oxygen (for respiration) and a suitable warm temperature to germinate. They do not need light or soil at first, because they use the food stored in the seed.',
      lv: [1, 3],
    },
    {
      q: 'Why do seeds need oxygen to germinate?',
      a: 'For respiration, to release energy from the food store for growth',
      wrong: [
        { label: 'For photosynthesis', misconception: 'seed-photosynthesis', feedback: 'Photosynthesis uses carbon dioxide, not oxygen, and a seed has no green leaves yet.' },
        { label: 'To soften the seed coat', misconception: 'oxygen-softens', feedback: 'Water softens the seed coat. Oxygen is used in respiration.' },
        { label: 'To make starch', misconception: 'oxygen-starch', feedback: 'The seed already has a food store. Oxygen is needed to release energy from it.' },
      ],
      hint: 'Which process uses oxygen to release energy?',
      why: 'A germinating seed is growing fast and needs energy. It gets this by aerobic respiration of its food store, which uses oxygen.',
      lv: [3, 5],
    },
    {
      q: 'A germinating seed under the soil has no green leaves. Where does it get the energy to grow?',
      a: 'From the food store inside the seed',
      wrong: [
        { label: 'From photosynthesis in the seed coat', misconception: 'seedcoat-photosynthesis', feedback: 'There is no light under the soil, and the seed coat has no chlorophyll.' },
        { label: 'From food taken in from the soil', misconception: 'food-from-soil', feedback: 'Plants do not take food from the soil; they take water and minerals.' },
        { label: 'From the parent plant, through its roots', misconception: 'parent-feeds-seed', feedback: 'Once dispersed, the seed is no longer connected to the parent plant.' },
      ],
      hint: 'A bean or pea seed is mostly made of this.',
      why: 'Seeds contain a food store, often starch. The young plant respires this food until its first leaves are above the ground and can photosynthesise.',
      lv: [2, 4],
    },
    {
      q: 'Why is it important for seeds to be dispersed away from the parent plant?',
      a: 'So the new plants do not compete with the parent for light, water, minerals and space',
      wrong: [
        { label: 'So the seeds can get more pollen', misconception: 'seed-pollen', feedback: 'Pollination happens before seeds form.' },
        { label: 'Because the parent plant would eat the seeds', misconception: 'parent-eats', feedback: 'Plants do not eat seeds. The problem is competition.' },
        { label: 'So that the seeds are kept in the shade', misconception: 'seed-shade', feedback: 'Under the parent the seedlings would be shaded. Moving away gives them more light.' },
      ],
      hint: 'What would happen if all the seeds grew right underneath the parent plant?',
      why: 'If seeds fell straight below the parent, the seedlings would have to compete with it (and each other) for light, water, minerals and space. Dispersal also lets the plant spread to new places.',
      lv: [2, 4],
    },
  ],
}

const dispersalSpecies = classifyGenerators('bio.repro.seeds', {
  id: 'dispersal-plant',
  categories: ['Wind', 'Animals eating the fruit', 'Animals carrying it on their fur', 'Explosion (the pod bursts open)', 'Water'],
  items: [
    ['a dandelion', 'Wind'],
    ['a sycamore tree', 'Wind'],
    ['a blackberry (bramble)', 'Animals eating the fruit'],
    ['a cherry tree', 'Animals eating the fruit'],
    ['a strawberry plant', 'Animals eating the fruit'],
    ['burdock', 'Animals carrying it on their fur'],
    ['goosegrass (cleavers)', 'Animals carrying it on their fur'],
    ['a lupin', 'Explosion (the pod bursts open)'],
    ['gorse', 'Explosion (the pod bursts open)'],
    ['Himalayan balsam', 'Explosion (the pod bursts open)'],
    ['a coconut palm', 'Water'],
  ],
  ask: (item) => `How are the seeds of ${item} usually dispersed?`,
  hint: 'Think about what the fruit is like: light and fluffy or winged, juicy, hooked, a pod, or able to float.',
  sortPrompt: 'Match each plant to the way its seeds are dispersed.',
  means: {
    Wind: 'Wind-dispersed fruits are light, with "parachutes" (dandelion) or "wings" (sycamore).',
    'Animals eating the fruit': 'Juicy fruits are eaten by animals; the seeds pass through the gut and come out in the droppings, often far away.',
    'Animals carrying it on their fur': 'Fruits with hooks catch on animals\' fur and drop off later.',
    'Explosion (the pod bursts open)': 'Pods dry out and split open suddenly, flinging the seeds away.',
    Water: 'Some fruits, such as coconuts, float and are carried by water.',
  },
  lv: [2, 4],
})

const dispersalFeature = classifyGenerators('bio.repro.seeds', {
  id: 'dispersal-feature',
  categories: ['Wind', 'Animals', 'Explosion', 'Water'],
  items: [
    ['seeds with a "parachute" of fine hairs', 'Wind'],
    ['seeds with a flat "wing" that makes them spin as they fall', 'Wind'],
    ['seeds inside a juicy, brightly coloured fruit', 'Animals'],
    ['seeds inside a fruit covered in tiny hooks', 'Animals'],
    ['seeds in a pod that dries out and splits open suddenly', 'Explosion'],
    ['seeds inside a large, light fruit with a waterproof husk that floats', 'Water'],
  ],
  ask: (item) => `How are ${item} most likely to be dispersed?`,
  hint: 'Match the feature to what moves the seed: air, an animal, the plant itself, or water.',
  sortPrompt: 'Match each seed feature to the way it is dispersed.',
  means: {
    Wind: 'Light seeds with parachutes or wings are carried by the wind.',
    Animals: 'Juicy fruits are eaten by animals, and hooked fruits catch on fur.',
    Explosion: 'Some pods burst open and fling their seeds out.',
    Water: 'Fruits that float can be carried by rivers or the sea.',
  },
  lv: [1, 4],
})

interface Dish {
  name: string
  water: boolean
  warm: boolean
  oxygen: boolean
  light: boolean
  setup: string
}
const DISHES: Dish[] = [
  { name: 'A', water: true, warm: true, oxygen: true, light: true, setup: 'damp cotton wool, on a warm windowsill' },
  { name: 'B', water: false, warm: true, oxygen: true, light: true, setup: 'dry cotton wool, on a warm windowsill' },
  { name: 'C', water: true, warm: false, oxygen: true, light: false, setup: 'damp cotton wool, in a fridge' },
  { name: 'D', water: true, warm: true, oxygen: false, light: true, setup: 'boiled, cooled water with a layer of oil on top, on a warm windowsill' },
  { name: 'E', water: true, warm: true, oxygen: true, light: false, setup: 'damp cotton wool, in a warm, dark cupboard' },
]
const grows = (d: Dish) => d.water && d.warm && d.oxygen

type Factor = 'water' | 'warmth' | 'oxygen' | 'light'
const PAIRS: Record<Factor, [string, string]> = { water: ['A', 'B'], warmth: ['E', 'C'], oxygen: ['A', 'D'], light: ['A', 'E'] }
const WHY_PAIR: Record<Factor, string> = {
  water: 'Dishes A and B differ only in water (both warm, with air and light).',
  warmth: 'Dishes E and C are both damp, dark and have air; they differ only in temperature.',
  oxygen: 'Dishes A and D are both damp, warm and in the light, but the oil stops oxygen reaching the seeds in D.',
  light: 'Dishes A and E are both damp, warm and have air; they differ only in light.',
}

function seedGenerators(): ItemGenerator[] {
  return [
    G('bio.repro.seeds.germination-pair', 'bio.repro.seeds', [3, 5], (rng, d) => {
      const counts = DISHES.map((x) => (grows(x) ? rng.int(16, 20) : 0))
      const figure = {
        type: 'table' as const,
        head: ['Dish', 'Conditions', 'Seeds germinated (out of 20)'],
        rows: DISHES.map((x, i) => [x.name, x.setup, String(counts[i])]),
      }
      const factor = rng.pick<Factor>(['water', 'warmth', 'oxygen', 'light'])
      const pair = PAIRS[factor]
      if (d >= 5) {
        return orderedChoice({
          prompt: `Maya set up five dishes of 20 cress seeds each and left them for five days. Use the table to decide: do the seeds need ${factor === 'warmth' ? 'warmth' : factor} to germinate?`,
          figure,
          correct: factor === 'light' ? 'No: seeds germinated in both the light and the dark' : `Yes: seeds only germinated when they had ${factor === 'warmth' ? 'warmth' : factor}`,
          wrong:
            factor === 'light'
              ? [{ label: 'Yes: seeds only germinated when they had light', misconception: 'germination-needs-light', feedback: 'Dish E was in a dark cupboard, yet its seeds germinated.' }]
              : [{ label: `No: seeds germinated with or without ${factor === 'warmth' ? 'warmth' : factor}`, misconception: `germination-no-${factor}`, feedback: `Compare dishes ${pair[0]} and ${pair[1]}: only one of them germinated.` }],
          order: [factor === 'light' ? 'Yes: seeds only germinated when they had light' : `Yes: seeds only germinated when they had ${factor === 'warmth' ? 'warmth' : factor}`, factor === 'light' ? 'No: seeds germinated in both the light and the dark' : `No: seeds germinated with or without ${factor === 'warmth' ? 'warmth' : factor}`],
          hint: 'Find two dishes that differ in only this one condition, and compare their results.',
          explanation: `${WHY_PAIR[factor]} ${factor === 'light' ? 'Seeds germinated in both, so light is not needed for germination.' : `Seeds germinated in ${pair[0]} but not in ${pair[1]}, so they need ${factor === 'warmth' ? 'warmth' : factor}.`} Seeds need water, oxygen and warmth to germinate.`,
        })
      }
      const correct = `Dishes ${pair[0]} and ${pair[1]}`
      const all: [string, string][] = [
        ['A', 'B'],
        ['A', 'C'],
        ['A', 'D'],
        ['A', 'E'],
        ['B', 'C'],
        ['C', 'D'],
        ['E', 'C'],
        ['B', 'E'],
      ]
      const wrong = rng
        .shuffle(all.filter(([x, y]) => `${x}${y}` !== pair.join('') && `${y}${x}` !== pair.join('')))
        .slice(0, 3)
        .map(([x, y]) => ({ label: `Dishes ${x} and ${y}`, misconception: 'not-fair-comparison', feedback: `These dishes differ in more than one condition, or not in ${factor} at all, so they cannot show the effect of ${factor} on its own.` }))
      return choice({
        rng,
        prompt: `Maya set up five dishes of 20 cress seeds each and left them for five days. Which two dishes should she compare to find out whether seeds need ${factor} to germinate?`,
        figure,
        correct,
        wrong,
        hint: `For a fair comparison, the two dishes must differ in ${factor} and in nothing else.`,
        explanation: `${WHY_PAIR[factor]} That makes it a fair comparison. ${factor === 'light' ? 'Both germinated, so light is not needed.' : `Only ${pair[0]} germinated, so seeds need ${factor}.`}`,
      })
    }),
    G('bio.repro.seeds.germination-percent', 'bio.repro.seeds', [2, 4], (rng, d) => {
      const total = rng.pick(d <= 2 ? [10, 20, 50] : [20, 25, 40, 50])
      const step = 100 / total
      let pct = 50
      for (let k = 0; k < 30; k++) {
        pct = rng.int(12, 19) * 5
        if (Number.isInteger(pct / step)) break
      }
      const n = Math.round((pct * total) / 100)
      const realPct = (n * 100) / total
      return num({
        prompt: `Maya planted ${total} bean seeds. After a week, ${n} of them had germinated. What percentage of the seeds germinated?`,
        answer: realPct,
        suffix: '%',
        hint: 'Percentage = (number that germinated ÷ total number) × 100.',
        explanation: `${n} ÷ ${total} = ${n / total}. × 100 = ${realPct}%.`,
        errors: [{ values: [total - n], tag: 'not-germinated', message: 'That is the number that did not germinate. Divide the number that did by the total, then multiply by 100.' }],
      })
    }),
  ]
}

export const reproGenerators: ItemGenerator[] = [
  ...bankGenerators(humanSystems),
  ...systemsClassify,
  ...bankGenerators(puberty),
  ...pubertyClassify,
  ...bankGenerators(pregnancy),
  ...placentaClassify,
  ...bankGenerators(flowers),
  ...flowerClassify,
  ...bankGenerators(pollination),
  ...pollinationClassify,
  ...bankGenerators(seeds),
  ...dispersalSpecies,
  ...dispersalFeature,
  ...seedGenerators(),
]
