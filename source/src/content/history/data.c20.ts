import { HAIG_PAIR } from './data.skills'
import { SRC } from './sources'
import { E, F, type Topic } from './types'

/** The 20th century (Year 9). */
export const C20: Topic[] = [
  // ------------------------------------------------------------------ causes of WW1
  {
    skill: 'ww1.causes',
    title: 'the causes of the First World War',
    events: [
      E(1871, 'Germany is unified as one country'),
      E(1882, 'The Triple Alliance of Germany, Austria-Hungary and Italy is formed'),
      E(1906, 'Britain launches the battleship HMS Dreadnought'),
      E(1907, 'The Triple Entente of Britain, France and Russia is completed'),
      E(1914, 'Archduke Franz Ferdinand is assassinated in Sarajevo', { key: true, note: 'on 28 June' }),
    ],
    seqs: [
      {
        prompt: 'Put the events of summer 1914 in order.',
        items: [
          'Archduke Franz Ferdinand is assassinated in Sarajevo',
          'Austria-Hungary declares war on Serbia',
          'Russia mobilises its army to support Serbia',
          'Germany declares war on Russia',
          'Germany invades Belgium on its way to France',
          'Britain declares war on Germany',
        ],
        direction: ['28 June 1914', '4 August 1914'],
        hint: 'Follow the chain of alliances from Serbia outwards.',
        ex: 'The assassination (28 June) led Austria-Hungary to declare war on Serbia (28 July). Russia mobilised, Germany declared war on Russia (1 August) and invaded Belgium, and Britain declared war on 4 August.',
      },
    ],
    people: [
      { n: 'Franz Ferdinand', did: 'was the heir to the throne of Austria-Hungary, assassinated in 1914' },
      { n: 'Gavrilo Princip', did: 'was the Bosnian Serb who shot Franz Ferdinand' },
      { n: 'Kaiser Wilhelm II', did: 'was the German emperor who wanted Germany to have a large navy and empire' },
    ],
    terms: [
      { t: 'militarism', d: 'the belief that a country should build up strong armed forces' },
      { t: 'alliance', d: 'an agreement between countries to support each other' },
      { t: 'imperialism', d: 'building and competing for empires' },
      { t: 'nationalism', d: 'strong pride in your nation, sometimes the wish for your people to have their own country' },
      { t: 'arms race', d: 'competition between countries to build up the most weapons' },
    ],
    facts: [
      F([1, 2], 'In which city was Archduke Franz Ferdinand assassinated in June 1914?', 'Sarajevo', ['Berlin', 'Paris', 'London'], 'It was in Bosnia, part of Austria-Hungary.', 'Franz Ferdinand and his wife Sophie were shot in Sarajevo on 28 June 1914 by Gavrilo Princip.'),
      F([2, 3], 'Which countries made up the Triple Entente?', 'Britain, France and Russia', [
        ['Germany, Austria-Hungary and Italy', 'That was the Triple Alliance.'],
        'Britain, Germany and the USA',
        'France, Italy and Serbia',
      ], 'Entente is French for understanding.', 'The Triple Entente linked Britain, France and Russia. Facing them was the Triple Alliance of Germany, Austria-Hungary and Italy.'),
      F([2, 3], 'The long-term causes of the First World War are often remembered as MAIN. What does the M stand for?', 'Militarism', ['Monarchy', 'Money', 'Migration'], 'MAIN = M, Alliances, Imperialism, Nationalism.', 'MAIN stands for Militarism, Alliances, Imperialism and Nationalism.'),
      F([3, 4], 'Why did Britain declare war on Germany in August 1914?', "Germany invaded Belgium, whose neutrality Britain had promised to protect", [
        'Germany attacked London',
        ['Franz Ferdinand was British', 'He was the heir to the throne of Austria-Hungary.'],
        'Britain wanted to take over Serbia',
      ], 'A treaty of 1839 is the key.', 'Britain had promised in 1839 to protect Belgian neutrality. When Germany invaded Belgium to attack France, Britain declared war.'),
      F([3, 4], 'How did the alliance system turn a local crisis into a world war?', 'Each country was pulled in to support its allies, one after another', [
        'Alliances stopped any country from fighting',
        'Every country was in the same alliance',
        'Alliances only covered trade, not war',
      ], 'Look at the chain from Serbia to Britain.', 'Russia backed Serbia, Germany backed Austria-Hungary, France was allied to Russia, and Britain was linked to France and Belgium. A Balkan quarrel became a European war.'),
      F([4, 5], 'Why did the naval race worry Britain so much?', 'Britain relied on its navy to protect its empire and trade, and Germany was building a rival fleet', [
        'Germany had promised to give its ships to Britain',
        'Britain had no navy at all',
        'The naval race was between France and Russia',
      ], 'Britain is an island with a worldwide empire.', 'Britain’s security and trade depended on naval supremacy. Germany’s new fleet looked like a direct threat, so both raced to build dreadnoughts.'),
      F([4, 5], 'Why was Austria-Hungary worried about Serbia before 1914?', 'Serbian nationalism encouraged Slav people inside Austria-Hungary to want to break away', [
        'Serbia had a bigger navy than Austria-Hungary',
        'Serbia was part of the Triple Alliance',
        'Serbia was trying to join the British Empire',
      ], 'Austria-Hungary ruled many different peoples.', 'Austria-Hungary feared that Serbian nationalism would break up its multi-national empire. The assassination gave it a reason to act against Serbia.'),
    ],
    reveals: [
      {
        prompt: 'Explain why the First World War broke out in 1914.',
        hint: 'Use the long-term causes (MAIN) and the trigger. Show how they link.',
        model:
          'There were several long-term causes. Europe was divided into two armed alliances, the Triple Entente and the Triple Alliance, so a quarrel between two countries could drag in others. Militarism and the naval arms race between Britain and Germany created fear and suspicion, and imperial rivalry made relations worse. Nationalism in the Balkans threatened Austria-Hungary. The trigger was the assassination of Archduke Franz Ferdinand in Sarajevo in June 1914. Austria-Hungary declared war on Serbia, Russia supported Serbia, Germany declared war on Russia and France, and when Germany invaded Belgium, Britain declared war.',
        checklist: ['Explains at least two long-term causes', 'Identifies the trigger', 'Explains how the alliances spread the war', 'Uses specific dates or events'],
      },
    ],
  },

  // ------------------------------------------------------------------ Western Front
  {
    skill: 'ww1.western-front',
    title: 'the Western Front',
    events: [
      E(1914, 'The Western Front settles into lines of trenches'),
      E(1915, 'Poison gas is first used on the Western Front at Ypres'),
      E(1916, 'Britain introduces conscription'),
      E(1917, 'The USA joins the war'),
      E(1918, 'The Armistice ends the fighting', { key: true, note: 'at 11 o’clock on 11 November' }),
    ],
    seqs: [
      {
        prompt: 'Put these parts of a trench system in order, starting nearest the enemy.',
        items: ["No man's land", 'Front-line trench', 'Support trench', 'Reserve trench'],
        direction: ['Nearest the enemy', 'Furthest from the enemy'],
        hint: 'The ground between the two armies came first.',
        ex: 'Behind no man’s land was the front line, then the support trench, then the reserve trench, all linked by communication trenches.',
      },
    ],
    terms: [
      { t: "no man's land", d: 'the ground between the two sides’ front-line trenches' },
      { t: 'trench foot', d: 'a painful condition caused by standing for long periods in cold water and mud' },
      { t: 'going over the top', d: 'climbing out of the trench to attack across no man’s land' },
      { t: 'conscription', d: 'making people join the armed forces by law' },
      { t: 'shell shock', d: 'the name used at the time for the breakdown that many soldiers suffered from the stress of battle' },
      { t: 'duckboards', d: 'wooden boards laid on the bottom of trenches to keep feet out of mud and water' },
    ],
    facts: [
      F([1, 2], 'Where was the Western Front?', 'A line of trenches across Belgium and France', ['A line of forts along the River Thames', 'The border between Russia and Germany', 'The coast of Turkey'], 'It was west of Germany.', 'The Western Front stretched from the Belgian coast to the Swiss border, through Belgium and France.'),
      F([2, 3], 'What caused trench foot?', 'Standing for long periods in cold, wet, muddy trenches', ['Marching too fast', 'Poison gas', 'Eating tinned food'], 'Look at the name.', 'Wet, cold feet for days on end could swell and rot. Soldiers were ordered to change socks and rub whale oil on their feet.'),
      F([2, 3], 'Which weapon caused the most casualties on the Western Front?', 'Artillery (big guns firing shells)', [
        ['Machine guns', 'Machine guns were deadly, but artillery shells caused more casualties overall.'],
        ['Poison gas', 'Gas caused great fear, but fewer deaths than shells.'],
        'Tanks',
      ], 'Think of the huge bombardments.', 'Most casualties on the Western Front were caused by artillery shells.'),
      F([2, 3], 'Roughly how many British and Empire soldiers died in the First World War?', 'Around a million', ['Around 10,000', 'Around 100,000', 'Around 50 million'], 'Almost every town and village has a war memorial.', 'Around a million soldiers from Britain and its Empire were killed, and many more were wounded.'),
      F([3, 4], 'Why did the war on the Western Front become a stalemate?', "Machine guns, barbed wire and artillery made attacks across no man's land very costly", [
        'Both sides ran out of soldiers in 1914',
        'The generals agreed not to attack',
        'It rained every day of the war',
      ], 'Defending was easier than attacking.', 'Defenders in trenches with machine guns and wire could usually stop attacks, so neither side could break through until 1918.'),
      F([3, 4], 'Why might Source I give a different picture from a government recruitment poster of the same time?', 'Owen wanted to show the suffering of war, while posters aimed to persuade men to join up', [
        'Owen had never been to the front',
        'Posters were always more accurate than poems',
        'Owen was writing about the Second World War',
      ], 'Think about each source’s purpose.', 'Owen was an officer who saw the reality and wanted people to know it. Recruitment posters were designed to encourage men to volunteer.', SRC.owen),
      F([4, 5], 'Why did Britain introduce conscription in 1916?', 'Not enough men were volunteering to replace the huge losses', [
        'The USA demanded it',
        'The war had ended',
        'Women had refused to work',
      ], 'Before 1916 the British army relied on volunteers.', 'After huge losses, volunteering could not supply enough soldiers, so in 1916 single men aged 18 to 41 were conscripted, later extended to married men.'),
    ],
    reveals: [
      {
        prompt: 'Describe two features of life in the trenches on the Western Front.',
        hint: 'You could describe conditions, dangers, daily routine or disease.',
        model:
          'One feature was the terrible conditions. Trenches were often flooded with cold water and mud, and soldiers who stood in water for days could get trench foot. Rats and lice were everywhere. A second feature was constant danger. Soldiers could be killed by snipers if they looked over the top, and artillery shells, which caused most casualties, could land at any time, even when no attack was happening.',
        checklist: ['Identifies one feature', 'Gives a supporting detail for it', 'Identifies a second feature', 'Gives a supporting detail for the second feature'],
      },
      {
        prompt: 'How useful is Source I for an enquiry into conditions on the Western Front?',
        src: SRC.owen,
        hint: 'Comment on what it shows, who wrote it and why, and what a poem can and cannot tell us.',
        model:
          'Source I is useful because it shows how exhausted soldiers were: Owen compares them to "old beggars" and "hags", bent double and coughing, cursing "through sludge", which suggests mud and illness. Owen was an officer who fought on the Western Front, so he saw these conditions himself. However, it is a poem, written to make readers feel the horror of war, so he may choose the most shocking images. It also only shows one moment and does not tell us about routines or how other soldiers felt. Overall it is useful for soldiers’ experience, alongside letters and official records.',
        checklist: ['Uses detail from the source', 'Comments on Owen as an eyewitness', 'Explains how the poem’s purpose affects it', 'Gives a limitation', 'Gives an overall judgement'],
      },
    ],
  },

  // ------------------------------------------------------------------ Somme
  {
    skill: 'ww1.somme',
    title: 'the Battle of the Somme',
    events: [
      E(1915, 'Douglas Haig becomes commander of the British army in France'),
      E(1916, 'The Battle of the Somme begins', { key: true, note: 'on 1 July' }),
      E(1917, 'The Battle of Passchendaele'),
      E(1918, 'The Hundred Days Offensive pushes the German army back'),
    ],
    seqs: [
      {
        prompt: 'Put these events of the Battle of the Somme in order.',
        items: [
          'A week-long artillery bombardment of German lines',
          'Mines are exploded under German positions',
          'British soldiers go over the top on 1 July',
          "Machine guns cut down many attackers in no man's land",
          'Tanks are used in battle for the first time',
          'The battle ends in November in mud and snow',
        ],
        direction: ['June 1916', 'November 1916'],
        hint: 'The guns came first, then the infantry.',
        ex: 'The bombardment began in late June; mines were blown just before the attack on 1 July; tanks first appeared in September; the battle ended in November.',
      },
    ],
    people: [
      { n: 'Douglas Haig', did: 'was the British commander-in-chief at the Somme' },
      { n: 'Walter Tull', did: 'was one of the first Black officers in the British Army, killed in action in 1918' },
      { n: 'Wilfred Owen', did: 'was a soldier-poet who wrote about the horror of the trenches, killed a week before the Armistice' },
    ],
    terms: [
      { t: 'offensive', d: 'a large planned attack' },
      { t: 'bombardment', d: 'a long attack with heavy guns' },
      { t: 'casualties', d: 'soldiers killed, wounded, captured or missing' },
      { t: 'war of attrition', d: 'a war in which each side tries to wear the other down' },
    ],
    facts: [
      F([1, 2], 'Why is the first day of the Somme so infamous?', 'The British army suffered about 57,000 casualties, the worst day in its history', [
        'The British captured Berlin',
        'It was the first day of the war',
        'No one was hurt',
      ], 'Think about the numbers.', 'On 1 July 1916 the British army had about 57,000 casualties, nearly 20,000 of them killed.'),
      F([2, 3], 'Why did the British attack at the Somme in 1916?', 'To take pressure off the French at Verdun and try to break through German lines', [
        'To capture Paris from the Germans',
        'To defend London from invasion',
        'Because Germany had surrendered',
      ], 'The French were under huge pressure elsewhere.', 'The French were fighting a desperate battle at Verdun. A British-led attack on the Somme aimed to draw German troops away and break through.'),
      F([2, 3], 'Why did the week-long bombardment before the Somme fail?', 'Many shells did not explode or cut the barbed wire, and German soldiers sheltered in deep dugouts', [
        'The guns were pointing the wrong way',
        'There was no bombardment',
        'It destroyed every German trench',
      ], 'Where were the German soldiers during the shelling?', 'Many shells were duds or the wrong type to cut wire, and the Germans waited in deep concrete dugouts, then manned their machine guns.'),
      F([3, 4], 'Which new weapon was first used at the Somme in September 1916?', 'The tank', [
        ['Poison gas', 'Gas had first been used on the Western Front in 1915.'],
        'The machine gun',
        'The rifle',
      ], 'It was given a secret code name to hide what it was.', 'Tanks were first used at Flers-Courcelette in September 1916. Early tanks often broke down but showed what was possible.'),
      F([3, 4], 'Roughly how many casualties were there on all sides at the Somme by November 1916?', 'Over a million', [
        'About 1,000',
        ['About 57,000', 'That was roughly the British figure for the first day alone.'],
        'About 10 million',
      ], 'The battle lasted over four months.', 'By the time it ended in November 1916, the Somme had cost over a million casualties on all sides, for a few miles of ground.'),
      F([4, 5], 'Some historians argue the Somme achieved something. What is their main argument?', 'It relieved the French at Verdun and wore down the German army, which lost many experienced soldiers', [
        'It ended the war in 1916',
        'It captured Berlin',
        'It had very few casualties',
      ], 'Think about attrition.', 'These historians argue the Somme helped save Verdun, taught the British army lessons and weakened Germany, though at a terrible cost.'),
    ],
    reveals: [
      {
        prompt: 'Was the Battle of the Somme a failure? Explain your view.',
        src: HAIG_PAIR,
        hint: 'Consider its aims, the losses and what (if anything) it achieved. Then decide.',
        model:
          'In many ways the Somme was a failure. Haig aimed to break through the German lines, but the bombardment did not cut the barbed wire, and on the first day the British suffered about 57,000 casualties. After over four months, the Allies had advanced only a few miles, and there were over a million casualties on all sides. However, it did achieve some aims: it relieved pressure on the French at Verdun, and it wore down the German army. The British also learned lessons, such as using tanks and better artillery tactics, which helped in 1918. Overall I think it was a failure in its main aim of a breakthrough, but not a complete failure.',
        checklist: ['Gives evidence that it failed', 'Gives evidence that it achieved something', 'Uses specific detail (dates, numbers, places)', 'Reaches a clear judgement'],
      },
    ],
  },

  // ------------------------------------------------------------------ end of WW1 and Versailles
  {
    skill: 'interwar.versailles',
    title: 'the end of the war and the Treaty of Versailles',
    events: [
      E(1918, 'The Armistice ends the fighting', { key: true }),
      E(1919, 'The Treaty of Versailles is signed', { key: true }),
      E(1920, 'The League of Nations meets for the first time'),
      E(1923, 'French troops occupy the Ruhr and hyperinflation hits Germany'),
    ],
    people: [
      { n: 'Woodrow Wilson', did: 'was the US President who wanted a fair peace and a League of Nations' },
      { n: 'Georges Clemenceau', did: 'was the French Prime Minister who wanted Germany punished harshly' },
      { n: 'David Lloyd George', did: 'was the British Prime Minister at the peace conference in Paris' },
    ],
    terms: [
      { t: 'armistice', d: 'an agreement to stop fighting' },
      { t: 'reparations', d: 'payments for war damage' },
      { t: 'War Guilt Clause', d: 'the part of the treaty making Germany accept blame for the war' },
      { t: 'demilitarised', d: 'with no armed forces allowed' },
      { t: 'League of Nations', d: 'an international organisation set up after the war to keep the peace' },
      { t: 'diktat', d: 'a dictated peace: what Germans called the treaty, as they had no say in it' },
    ],
    sorts: [
      {
        cats: ['Land', 'Army', 'Money', 'Blame'],
        ask: ['a term about land', 'a term about the army', 'a term about money', 'a term about blame'],
        q: 'Which kind of term in the Treaty of Versailles is this?',
        hint: 'Remember LAMB: Land, Army, Money, Blame.',
        ex: 'The terms of the Treaty of Versailles can be remembered as LAMB: Land, Army, Money and Blame.',
        items: [
          ['Germany lost all its overseas colonies', 0],
          ['Alsace-Lorraine was given back to France', 0],
          ['Land was given to the new country of Poland', 0],
          ['The German army was limited to 100,000 men', 1],
          ['Germany was not allowed tanks, submarines or an air force', 1],
          ['The Rhineland was demilitarised', 1],
          ['Germany had to pay reparations', 2],
          ['Germany had to accept responsibility for causing the war', 3],
        ],
      },
    ],
    facts: [
      F([1, 2], 'On what date did the fighting in the First World War stop?', '11 November 1918', ['28 June 1914', '1 July 1916', '8 May 1945'], 'It is remembered every year with a two-minute silence.', 'The Armistice took effect at 11 o’clock on 11 November 1918.'),
      F([2, 3], 'Why did many Germans hate the Treaty of Versailles?', 'They had no say in it, and they felt the terms and the blame were unfair', [
        'It gave Germany too much land',
        'It made Germany’s army bigger',
        'It was written in German',
      ], 'Germans called it a "diktat".', 'Germany was not allowed to negotiate. Germans resented losing land, the army limits, reparations and having to accept the blame.'),
      F([2, 3], 'How big was the German army allowed to be under the Treaty of Versailles?', '100,000 men', ['1,000 men', '1 million men', 'There was no limit'], 'It was a small fraction of its wartime size.', 'The treaty limited the German army to 100,000 men, with no tanks, air force or submarines.'),
      F([3, 4], "Why did the 'Big Three' disagree at the peace conference?", 'France wanted Germany crushed, the USA wanted a fairer peace, and Britain wanted something in between', [
        'They all wanted exactly the same thing',
        'They all wanted Germany to be stronger',
        'They disagreed about where to hold the meeting',
      ], 'Think about how much each country had suffered.', 'France had suffered most and wanted security; Wilson wanted a fair peace and a League of Nations; Lloyd George wanted Germany punished but able to trade.'),
      F([4, 5], 'How did the Treaty of Versailles later help Hitler?', 'He used German anger at the treaty to win support, promising to overturn it', [
        'It gave Hitler a job in the government',
        'It made Germany the strongest country in Europe',
        'It was written by Hitler',
      ], 'What did Hitler promise Germans?', 'Hitler promised to tear up the "shameful" treaty, which attracted many Germans in the 1920s and 1930s.'),
    ],
    reveals: [
      {
        prompt: 'Explain why many Germans were angry about the Treaty of Versailles.',
        hint: 'Think about how the treaty was made and its terms (land, army, money, blame).',
        model:
          'Many Germans were angry because the treaty was a "diktat": Germany was not allowed to take part in the talks and had to sign. They also thought the terms were too harsh. Germany lost land, including Alsace-Lorraine and all its colonies, and its army was cut to 100,000 men, which made Germans feel defenceless. Germany had to pay huge reparations. Most humiliating was the War Guilt Clause, which forced Germany to accept blame for the war, which many Germans did not believe.',
        checklist: ['Explains that Germany had no say', 'Explains at least two terms of the treaty', 'Explains why the terms caused anger, not just what they were', 'Uses specific detail'],
      },
    ],
  },

  // ------------------------------------------------------------------ Nazis
  {
    skill: 'interwar.nazis',
    title: 'the rise of the Nazis',
    events: [
      E(1919, 'The Weimar Republic is set up in Germany'),
      E(1923, "Hitler's Munich Putsch fails"),
      E(1925, 'Hitler publishes Mein Kampf'),
      E(1929, 'The Wall Street Crash starts a worldwide depression'),
      E(1933, 'Hitler becomes Chancellor of Germany', { key: true, note: 'on 30 January' }),
      E(1934, 'Hitler becomes Führer after the death of President Hindenburg'),
    ],
    seqs: [
      {
        prompt: 'Put these steps in Hitler’s takeover of power in 1933-1934 in order.',
        items: [
          'Hitler becomes Chancellor',
          'The Reichstag building is set on fire',
          'The Enabling Act lets Hitler make laws without the Reichstag',
          'Trade unions are banned',
          'All other political parties are banned',
          'The Night of the Long Knives',
          'Hitler becomes Führer',
        ],
        direction: ['January 1933', 'August 1934'],
        hint: 'Hitler needed the Enabling Act before he could ban his opponents.',
        ex: 'Chancellor in January 1933; the Reichstag fire in February; the Enabling Act in March; trade unions banned in May and other parties in July; the Night of the Long Knives in June 1934; Führer in August 1934.',
      },
    ],
    people: [
      { n: 'Adolf Hitler', did: 'led the Nazi Party and became dictator of Germany' },
      { n: 'Joseph Goebbels', did: 'was in charge of Nazi propaganda' },
      { n: 'Paul von Hindenburg', did: 'was the German President who appointed Hitler Chancellor' },
      { n: 'Ernst Röhm', did: 'was the leader of the SA, killed in the Night of the Long Knives' },
    ],
    terms: [
      { t: 'Chancellor', d: 'the head of the German government' },
      { t: 'dictator', d: 'a ruler with total power' },
      { t: 'hyperinflation', d: 'when prices rise extremely fast and money becomes almost worthless' },
      { t: 'Reichstag', d: 'the German parliament' },
      { t: 'SA', d: 'the Nazi stormtroopers, known as the Brownshirts' },
      { t: 'Gestapo', d: 'the Nazi secret police' },
    ],
    facts: [
      F([1, 2], "What was the full name of Hitler's party?", "The National Socialist German Workers' Party", ['The Communist Party of Germany', 'The German Labour Party', 'The Weimar Party'], '"Nazi" is short for one of its words.', '"Nazi" comes from the German for National Socialist.'),
      F([2, 3], 'Why did support for the Nazis grow after 1929?', 'The Depression caused mass unemployment, and Hitler promised jobs and a strong Germany', [
        'Germany had just won a war',
        'The Nazis promised to keep the Treaty of Versailles',
        'Everyone in Germany was rich',
      ], 'What happened to the world economy in 1929?', 'After the Wall Street Crash, unemployment in Germany soared. Desperate voters turned to parties promising strong action, and Nazi support grew.'),
      F([2, 3], 'How did Hitler become Chancellor in January 1933?', 'He was appointed by President Hindenburg after the Nazis became the largest party in the Reichstag', [
        ['He won more than half of all votes in an election', 'The Nazis never won a majority of votes in a free election.'],
        ['He seized power in the Munich Putsch', 'The Putsch of 1923 failed, and Hitler went to prison.'],
        'He was chosen by the League of Nations',
      ], 'He came to power legally, through a deal.', 'The Nazis were the largest party but had no majority. Conservative politicians persuaded Hindenburg to appoint Hitler, thinking they could control him.'),
      F([3, 4], 'Why was the Enabling Act of 1933 so important?', 'It let Hitler make laws without the Reichstag, so he could rule as a dictator', [
        'It gave all Germans the vote',
        'It ended the Nazi Party',
        'It made Hindenburg the dictator',
      ], 'Who would make laws after it was passed?', 'The Enabling Act gave Hitler power to pass laws without parliament. He used it to ban other parties and trade unions.'),
      F([3, 4], 'What happened in the Night of the Long Knives in 1934?', 'Hitler had SA leaders, including Ernst Röhm, and other opponents killed', [
        'The Reichstag building burned down',
        'Jewish shops were attacked across Germany',
        'Hitler was arrested',
      ], 'Hitler removed rivals inside his own movement.', 'Hitler feared the SA’s power and wanted the army’s support, so the SS murdered Röhm and others.'),
      F([4, 5], 'How did the Nazis use propaganda?', 'They controlled newspapers, radio and films to spread Nazi ideas and glorify Hitler', [
        'They allowed all newspapers to criticise Hitler',
        'They banned radios completely',
        'They only used propaganda outside Germany',
      ], 'Think about Goebbels’ job.', 'Goebbels controlled the media, organised huge rallies and made cheap radios so Nazi messages reached every home.'),
    ],
    reveals: [
      {
        prompt: 'Explain why Hitler was able to come to power in 1933.',
        hint: 'Think about the Depression, German anger over Versailles, Nazi methods and the deal that made him Chancellor.',
        model:
          'One reason was the Depression after 1929. Millions of Germans lost their jobs, and they lost faith in the Weimar government, so they turned to extreme parties. Hitler promised jobs and a strong Germany, and he blamed the Treaty of Versailles, which many Germans hated. The Nazis also used propaganda, rallies and the violence of the SA to win attention and frighten opponents. Finally, Hitler came to power through a deal: the Nazis were the largest party, and conservative politicians persuaded President Hindenburg to appoint him Chancellor in January 1933, thinking they could control him.',
        checklist: ['Explains the effect of the Depression', 'Mentions Versailles or weaknesses of Weimar', 'Mentions Nazi methods (propaganda, SA)', 'Explains how he was appointed Chancellor', 'Links the reasons together'],
      },
    ],
  },

  // ------------------------------------------------------------------ causes of WW2
  {
    skill: 'ww2.causes',
    title: 'the road to the Second World War',
    events: [
      E(1933, 'Hitler becomes Chancellor of Germany'),
      E(1935, 'Hitler announces conscription, breaking the Treaty of Versailles'),
      E(1936, 'German troops march into the Rhineland'),
      E(1938, 'Germany takes over Austria (the Anschluss)'),
      E(1939, 'Germany invades Poland', { key: true, note: 'on 1 September' }),
    ],
    seqs: [
      {
        prompt: 'Put these steps on the road to war in order.',
        items: [
          'Germany starts openly rebuilding its army',
          'German troops march into the Rhineland',
          'Germany takes over Austria',
          'The Munich Agreement gives the Sudetenland to Germany',
          'Germany takes over the rest of Czechoslovakia',
          'Germany and the USSR sign the Nazi-Soviet Pact',
          'Germany invades Poland',
          'Britain and France declare war on Germany',
        ],
        direction: ['1935', 'September 1939'],
        hint: 'Hitler moved west into the Rhineland first, then south and east.',
        ex: 'Rearmament (1935), the Rhineland (1936), Austria (March 1938), Munich (September 1938), the rest of Czechoslovakia (March 1939), the Nazi-Soviet Pact (August 1939), Poland (1 September) and war (3 September 1939).',
      },
    ],
    people: [
      { n: 'Neville Chamberlain', did: 'was the British Prime Minister who followed a policy of appeasement' },
      { n: 'Joseph Stalin', did: 'was the Soviet leader who signed the Nazi-Soviet Pact with Hitler in 1939' },
      { n: 'Winston Churchill', did: 'warned against appeasement in the 1930s and became Prime Minister in 1940' },
    ],
    terms: [
      { t: 'appeasement', d: 'giving in to some demands to avoid war' },
      { t: 'Anschluss', d: 'the union of Germany and Austria in 1938' },
      { t: 'Sudetenland', d: 'the German-speaking border area of Czechoslovakia' },
      { t: 'Lebensraum', d: "'living space': Hitler's aim to take land in eastern Europe for Germans" },
      { t: 'rearmament', d: 'building up armed forces again' },
    ],
    facts: [
      F([1, 2], 'What made Britain and France declare war on Germany in September 1939?', 'Germany invaded Poland', [
        ['Germany invaded Britain', 'Germany never successfully invaded Britain.'],
        ['Germany bombed Pearl Harbor', 'Pearl Harbor was attacked by Japan, in 1941.'],
        'Germany took over Austria',
      ], 'Britain and France had promised to protect this country.', 'Britain and France had guaranteed Poland’s independence. Germany invaded on 1 September; they declared war on 3 September 1939.'),
      F([2, 3], 'Why did Chamberlain follow a policy of appeasement?', 'Britain was not ready for war, and many people feared another war like 1914-1918', [
        'He wanted Germany to win a war',
        'Hitler had promised to give Britain Poland',
        'Britain had already defeated Germany in 1936',
      ], 'Remember the First World War’s losses.', 'Memories of the First World War, fear of bombing, the cost of rearming and a feeling that Versailles had been harsh all made appeasement popular at first.'),
      F([2, 3], 'What did the Munich Agreement of 1938 do?', 'It allowed Germany to take the Sudetenland from Czechoslovakia', [
        'It started the Second World War',
        'It gave Poland to the USSR',
        'It returned Germany’s colonies',
      ], 'Chamberlain came home claiming "peace for our time".', 'Britain, France and Italy agreed that Germany could take the Sudetenland. Czechoslovakia was not consulted. Six months later Hitler took the rest of the country.'),
      F([3, 4], 'Why was the Nazi-Soviet Pact of August 1939 so important?', 'It meant Hitler could invade Poland without having to fight the USSR', [
        'It made the USSR join Britain and France',
        'It ended the Second World War',
        'It gave Germany the Sudetenland',
      ], 'Think about who was on Poland’s eastern border.', 'In the pact, Hitler and Stalin agreed not to fight each other and secretly planned to divide Poland. Days later, Germany invaded.'),
      F([4, 5], 'Why do some historians defend appeasement?', 'It gave Britain time to rearm, for example to build fighter planes and radar', [
        'It stopped the war from ever happening',
        'It made Hitler give back the Rhineland',
        'It was supported by the USSR',
      ], 'What was Britain doing between 1938 and 1939?', 'Supporters argue Britain was not ready in 1938. The extra year let it build more Spitfires and Hurricanes and radar stations, which mattered in 1940.'),
    ],
    reveals: [
      {
        prompt: 'Explain why war broke out in Europe in 1939.',
        hint: 'Think about Hitler’s aims, the weakness of Versailles and the League, appeasement and the Nazi-Soviet Pact.',
        model:
          'One reason was Hitler’s aims: he wanted to overturn the Treaty of Versailles, unite German speakers and win Lebensraum in the east. He rearmed, moved into the Rhineland in 1936 and took Austria in 1938. Appeasement also played a part: Britain and France let him take the Sudetenland at Munich, which encouraged him to think they would never fight. When he took the rest of Czechoslovakia in 1939, Britain promised to defend Poland. The Nazi-Soviet Pact meant Hitler could invade Poland without fighting the USSR, so on 1 September he invaded, and Britain and France declared war.',
        checklist: ['Explains Hitler’s aims', 'Explains the role of appeasement', 'Mentions the Nazi-Soviet Pact or the invasion of Poland', 'Uses specific dates and events', 'Links the causes together'],
      },
    ],
  },

  // ------------------------------------------------------------------ Britain in 1940
  {
    skill: 'ww2.britain-1940',
    title: 'Britain at war, 1939-1941',
    events: [
      E(1939, 'Britain declares war on Germany', { key: true }),
      E(1940, 'Winston Churchill becomes Prime Minister'),
      E(1941, 'Japan attacks Pearl Harbor and the USA enters the war'),
    ],
    seqs: [
      {
        prompt: 'Put these events of 1940 in order.',
        items: [
          'Germany invades Denmark and Norway',
          'Germany invades France, Belgium and the Netherlands',
          'Over 300,000 soldiers are evacuated from Dunkirk',
          'France surrenders to Germany',
          'The Battle of Britain is fought in the skies',
        ],
        direction: ['April 1940', 'Autumn 1940'],
        hint: 'Dunkirk happened because of the invasion of France.',
        ex: 'Norway and Denmark (April), France and the Low Countries (May), Dunkirk (late May to early June), the fall of France (June), the Battle of Britain (July to October).',
      },
    ],
    people: [
      { n: 'Hugh Dowding', did: 'led RAF Fighter Command in the Battle of Britain' },
      { n: 'Hermann Göring', did: 'led the German air force, the Luftwaffe' },
      { n: 'Winston Churchill', did: 'became Prime Minister in May 1940 and led Britain through the war' },
    ],
    terms: [
      { t: 'Luftwaffe', d: 'the German air force' },
      { t: 'RAF', d: "the Royal Air Force, Britain's air force" },
      { t: 'radar', d: 'a system using radio waves to detect aircraft before they arrive' },
      { t: 'Operation Dynamo', d: 'the code name for the evacuation from Dunkirk' },
      { t: 'Operation Sea Lion', d: "Hitler's planned invasion of Britain" },
    ],
    facts: [
      F([1, 2], 'What happened at Dunkirk in 1940?', 'Over 300,000 Allied soldiers were rescued from the beaches by ships and small boats', [
        'The Allies landed to invade France',
        'The RAF bombed Berlin',
        'Hitler signed a peace treaty',
      ], 'It was an escape, not an invasion.', 'Between late May and early June 1940, about 338,000 British and French soldiers were rescued from Dunkirk by the navy and hundreds of "little ships".'),
      F([2, 3], 'Why was the Battle of Britain fought?', 'Germany needed control of the skies before it could invade Britain', [
        'To capture Paris',
        'Britain was trying to invade Germany',
        'To stop the evacuation of children',
      ], 'An invasion fleet would be helpless against air attack.', 'Hitler’s invasion plan needed the RAF destroyed first, so the Luftwaffe attacked RAF airfields and aircraft in summer 1940.'),
      F([2, 3], 'Which fighter aircraft did the RAF mainly use in the Battle of Britain?', 'Spitfires and Hurricanes', [
        ['Messerschmitts', 'Messerschmitts were German aircraft.'],
        'Lancasters',
        'Concordes',
      ], 'One of them is famous for its curved wings.', 'Hurricanes and Spitfires were the RAF’s main fighters. Hurricanes actually shot down more enemy aircraft.'),
      F([3, 4], 'Why did Britain win the Battle of Britain?', 'Radar gave early warning, and RAF pilots fought over home ground, where they could refuel and be rescued', [
        'Germany had no aircraft',
        'The USA sent its whole air force',
        'Bad weather stopped the Germans flying',
      ], 'Think about technology and position.', 'Radar and the observer network meant fighters went up in the right place at the right time. Shot-down RAF pilots could fly again; German crews were captured.'),
      F([3, 4], 'Why is Dunkirk seen as both a disaster and a success?', 'The army lost most of its equipment and was driven out of France, but most soldiers were saved to fight again', [
        'Britain captured Dunkirk but then lost it',
        'It was a victory, but it was soon forgotten',
        'It ended the war, but too late',
      ], 'What was lost and what was saved?', 'Britain left behind its tanks and guns, and France soon fell. But the rescue of the army meant Britain could keep fighting, and it boosted morale.'),
      F([4, 5], 'What was the effect of the Battle of Britain on Hitler’s plans?', 'He postponed his invasion of Britain, Operation Sea Lion', [
        'He invaded Britain successfully',
        'He surrendered to Britain',
        'He signed a peace treaty with Churchill',
      ], 'Without control of the air...', 'Unable to defeat the RAF, Hitler put off the invasion and switched to bombing cities in the Blitz.'),
    ],
    reveals: [
      {
        prompt: 'Explain why Britain won the Battle of Britain.',
        hint: 'Think about technology, aircraft and pilots, and German mistakes.',
        model:
          'One reason was radar. A chain of radar stations along the coast gave early warning of German raids, so RAF fighters could be sent to the right place without wasting fuel. Another reason was that the RAF was fighting over Britain: pilots who were shot down could be rescued and fly again, and aircraft could land to refuel quickly. Britain’s factories also produced many Spitfires and Hurricanes. Finally, the Germans made a mistake: in September 1940 they switched from attacking airfields to bombing London, which gave the RAF time to recover.',
        checklist: ['Gives at least two reasons', 'Mentions radar or aircraft', 'Mentions a German mistake or weakness', 'Uses specific detail', 'Explains how each reason helped Britain win'],
      },
    ],
  },

  // ------------------------------------------------------------------ Home Front
  {
    skill: 'ww2.home-front',
    title: 'the Home Front',
    events: [
      E(1939, 'The first big evacuation of children from British cities'),
      E(1940, 'Food rationing begins in Britain'),
      E(1941, 'The main Blitz ends after eight months of bombing'),
      E(1944, 'V-1 flying bombs begin to hit London'),
      E(1954, 'Food rationing finally ends in Britain'),
    ],
    people: [
      { n: 'Lord Woolton', did: 'was the Minister of Food who promoted wartime recipes and rationing' },
      { n: 'King George VI', did: 'was the king whose home, Buckingham Palace, was bombed during the Blitz' },
      { n: 'Noor Inayat Khan', did: 'was a British secret agent sent into occupied France as a radio operator' },
    ],
    terms: [
      { t: 'Blitz', d: 'the German bombing of British cities in 1940 and 1941' },
      { t: 'evacuation', d: 'moving people, especially children, away from danger' },
      { t: 'rationing', d: 'limiting how much of certain goods each person can buy' },
      { t: 'blackout', d: 'covering windows and switching off lights so bombers could not see targets' },
      { t: 'Anderson shelter', d: 'a small corrugated-iron air-raid shelter dug into a garden' },
      { t: 'Land Girls', d: "women who worked on farms in the Women's Land Army" },
      { t: 'ARP warden', d: 'a volunteer who enforced the blackout and helped people during air raids' },
    ],
    facts: [
      F([1, 2], 'Why were children evacuated from British cities in 1939?', 'To protect them from expected German bombing', [
        'To send them to school in France',
        'Because the cities had run out of food',
        'So that they could join the army',
      ], 'What did the government expect to happen to cities?', 'The government expected heavy bombing of cities, so about 1.5 million people, mostly children, were moved to the countryside in September 1939.'),
      F([2, 3], 'Why was food rationed in Britain during the Second World War?', 'German submarines sank ships bringing food, so supplies had to be shared fairly', [
        'Farmers refused to grow food',
        'The King asked people to diet',
        'Food was being sent to Germany',
      ], 'Britain imported much of its food by sea.', 'U-boats attacked supply ships. Rationing (from January 1940) made sure everyone got a fair share of scarce food.', SRC.digForVictory),
      F([2, 3], 'Which city was badly bombed in November 1940, when its medieval cathedral was destroyed?', 'Coventry', ['Edinburgh', 'Cardiff', 'Cambridge'], 'It was a Midlands city with many factories.', 'The raid on Coventry on 14 November 1940 destroyed much of the city centre and its cathedral.'),
      F([3, 4], "How did women's work change during the Second World War?", 'Many worked in factories, on farms and in the armed services, doing jobs often done by men before', [
        'Women were banned from working',
        'Women only worked as nurses',
        'Nothing changed at all',
      ], 'Millions of men were away fighting.', 'Women built aircraft and munitions, joined the Land Army and served in the women’s branches of the forces. From 1941, many were conscripted for war work.'),
      F([3, 4], 'What can you infer about rationing from Source N?', 'Some foods were scarce, so people queued for treats and used substitutes like dried egg', [
        'Oranges were banned by law',
        'Rationing made food tastier',
        'There were no queues during the war',
      ], 'Look at the queue and the dried egg.', 'Queuing an hour for two oranges and baking with dried egg show scarcity and making do.', SRC.rationDiary),
      F([4, 5], 'Why did many Londoners shelter in Underground stations during the Blitz?', 'They were deep underground and safer from bombs, though not completely safe', [
        'The trains took them to the countryside every night',
        'The government ordered everyone to live there',
        'Bombs could never reach them',
      ], 'Think about what was above them.', 'Tube stations were deep and felt safe, but some suffered direct hits, such as Balham in 1940.'),
      F([3, 5], 'Why did the government control what newspapers reported about the Blitz?', 'To keep up morale and avoid giving useful information to the enemy', [
        'Because newspapers had stopped printing',
        'To make the bombing seem worse than it was',
        'Because the King owned all the newspapers',
      ], 'Who else might read British newspapers?', 'Censorship stopped details of damage reaching the Germans and kept the focus on courage and "Blitz spirit".'),
    ],
    reveals: [
      {
        prompt: 'Describe two ways the Second World War affected ordinary people in Britain.',
        hint: 'You could choose evacuation, rationing, the Blitz or women’s work.',
        model:
          'One way was rationing. From January 1940 foods such as bacon, butter and sugar were rationed because German submarines were sinking supply ships, so families had ration books and people grew vegetables to "Dig for Victory". A second way was the Blitz. From September 1940 German bombers attacked British cities at night; people slept in Anderson shelters or Underground stations, and tens of thousands of civilians were killed.',
        checklist: ['Identifies one effect', 'Gives a supporting detail for it', 'Identifies a second effect', 'Gives a supporting detail for the second effect'],
      },
      {
        prompt: 'How useful is Source N for an enquiry into how rationing affected teenagers?',
        src: SRC.rationDiary,
        hint: 'What does it show? What kind of source is it based on, and what are the limits of one diary?',
        model:
          'Source N is useful because it shows rationing from a teenager’s point of view: queuing an hour for two oranges and eating a cake made with dried egg. It is based on diaries, which were usually private and written at the time, so they can be quite honest. The tone, "we ate every crumb", suggests people made the best of shortages. However, it is one person’s experience on one day and does not tell us how rationing worked overall or how it differed between rich and poor families. It is useful for feelings, but I would also need ration records.',
        checklist: ['Uses detail from the source', 'Comments on the nature of a diary', 'Gives a limitation', 'Gives an overall judgement'],
      },
    ],
  },

  // ------------------------------------------------------------------ D-Day and the end of the war
  {
    skill: 'ww2.d-day',
    title: 'D-Day and the end of the war',
    events: [
      E(1941, 'Japan attacks Pearl Harbor and the USA enters the war'),
      E(1942, 'The Allies win the Battle of El Alamein in North Africa'),
      E(1943, 'German forces surrender at Stalingrad'),
      E(1944, 'D-Day: Allied troops land in Normandy', { key: true, note: 'on 6 June' }),
      E(1945, 'Germany surrenders and VE Day is celebrated', { key: true, note: 'on 8 May' }),
    ],
    seqs: [
      {
        prompt: 'Put these events at the end of the Second World War in order.',
        items: [
          'D-Day landings in Normandy',
          'Paris is liberated',
          'The Battle of the Bulge',
          'Hitler dies in Berlin',
          'VE Day: victory in Europe',
          'Atomic bombs are dropped on Hiroshima and Nagasaki',
          'Japan surrenders',
        ],
        direction: ['June 1944', 'August 1945'],
        hint: 'The war in Europe ended before the war against Japan.',
        ex: 'D-Day (June 1944), Paris (August 1944), the Bulge (December 1944), Hitler’s death (30 April 1945), VE Day (8 May 1945), the atomic bombs (6 and 9 August) and Japan’s surrender (August 1945).',
      },
    ],
    people: [
      { n: 'Dwight D. Eisenhower', did: 'was the American general in overall command of the D-Day landings' },
      { n: 'Bernard Montgomery', did: 'commanded the Allied land forces on D-Day' },
      { n: 'Franklin D. Roosevelt', did: 'was the US President who led America into the war after Pearl Harbor' },
    ],
    terms: [
      { t: 'Operation Overlord', d: 'the code name for the Allied invasion of Normandy' },
      { t: 'Allies', d: 'the countries fighting together against Germany, including Britain, the USA and the USSR' },
      { t: 'Mulberry harbours', d: 'floating harbours towed across the Channel to land supplies' },
      { t: 'VE Day', d: 'Victory in Europe Day, 8 May 1945' },
    ],
    facts: [
      F([1, 2], 'Where did the D-Day landings take place?', 'Normandy, in northern France', [
        ['Dunkirk', 'Dunkirk was where the army was evacuated in 1940.'],
        ['Calais', 'The Germans expected an attack at Calais; the Allies tricked them.'],
        'Italy',
      ], 'It is a region of northern France with long beaches.', 'On 6 June 1944 Allied troops landed on five beaches in Normandy.'),
      F([2, 3], 'Which were the five D-Day beaches?', 'Utah, Omaha, Gold, Juno and Sword', [
        'Dover, Calais, Dunkirk, Brighton and Bognor',
        'Alpha, Bravo, Charlie, Delta and Echo',
        'Paris, Berlin, Rome, London and Madrid',
      ], 'Two were American, two British and one Canadian.', 'Americans landed on Utah and Omaha, the British on Gold and Sword, and the Canadians on Juno.'),
      F([2, 3], 'Why did the Allies try to trick the Germans before D-Day?', 'To make them think the main invasion would land at Calais, so fewer troops defended Normandy', [
        'To make Hitler surrender before the landings',
        'To make the Germans attack Britain',
        'So that the Allies could invade Norway instead',
      ], 'They even used fake tanks and radio messages.', 'Fake armies, dummy equipment and false radio traffic made the Germans expect an attack near Calais and keep forces there.'),
      F([3, 4], 'Why was D-Day a turning point in the war?', 'It opened a second front in western Europe, and the Allies began pushing towards Germany', [
        'It ended the war the same day',
        'It was the first battle of the war',
        'It brought the USA into the war',
      ], 'Germany now had to fight on two sides.', 'With the Soviets advancing from the east and the Allies from the west, Germany was squeezed. Paris was freed in August 1944, and Germany surrendered in May 1945.'),
      F([4, 5], 'Why did the USA drop atomic bombs on Japan in August 1945?', 'The US government said it would end the war quickly without an invasion; historians still debate whether it was necessary', [
        'Japan had already surrendered',
        'Britain ordered it',
        'To end the war in Europe',
      ], 'Think about what an invasion of Japan would have cost, and why people still argue.', 'President Truman said the bombs would save lives by avoiding an invasion. Japan surrendered days later. Historians debate whether Japan was already close to surrender and what other motives there were.'),
    ],
    reveals: [
      {
        prompt: 'Explain why the D-Day landings succeeded.',
        hint: 'Think about planning and deception, Allied strength in the air and at sea, and German problems.',
        model:
          'D-Day succeeded partly because of careful planning and deception. The Allies made the Germans believe the main attack would come at Calais, using fake armies and radio messages, so Normandy had fewer defenders. The Allies also had huge resources: thousands of ships and aircraft controlled the sea and sky, and Mulberry harbours let them land supplies. German forces were stretched, as much of their army was fighting the USSR in the east. Although there were heavy losses, especially on Omaha beach, the Allies got a firm foothold in France.',
        checklist: ['Gives at least two reasons', 'Mentions deception or planning', 'Mentions Allied resources or German weaknesses', 'Uses specific detail (Calais, Mulberry harbours, beaches)'],
      },
    ],
  },

  // ------------------------------------------------------------------ Holocaust
  {
    skill: 'ww2.holocaust',
    title: 'the Holocaust',
    events: [
      E(1933, 'The Nazis organise a boycott of Jewish shops and businesses'),
      E(1935, "The Nuremberg Laws take away Jewish people's German citizenship"),
      E(1938, 'Kristallnacht: synagogues, homes and shops are attacked across Germany'),
      E(1941, 'Mass shootings of Jewish people begin in the occupied Soviet Union'),
      E(1942, 'The Wannsee Conference plans the murder of Europe’s Jews'),
      E(1945, 'Soviet troops liberate Auschwitz-Birkenau', { note: 'on 27 January, now Holocaust Memorial Day' }),
    ],
    people: [
      { n: 'Anne Frank', did: 'was a Jewish girl who hid with her family in Amsterdam and kept a diary' },
      { n: 'Nicholas Winton', did: 'organised the rescue of hundreds of children from Czechoslovakia to Britain' },
      { n: 'Primo Levi', did: 'was an Italian Jewish chemist who survived Auschwitz and wrote about it' },
    ],
    terms: [
      { t: 'Holocaust', d: 'the murder of around six million Jewish people by the Nazis and their collaborators' },
      { t: 'antisemitism', d: 'hostility to or prejudice against Jewish people' },
      { t: 'ghetto', d: 'a closed-off area of a city where Jewish people were forced to live' },
      { t: 'Kindertransport', d: 'the rescue of about 10,000 mainly Jewish children who were brought to Britain before the war' },
      { t: 'persecution', d: 'cruel and unfair treatment because of who someone is or what they believe' },
    ],
    facts: [
      F([1, 2], 'Around how many Jewish people were murdered in the Holocaust?', 'Around six million', ['Around 6,000', 'Around 60,000', 'Around 600,000'], 'It was about two out of every three Jewish people in Europe.', 'Around six million Jewish men, women and children were murdered by the Nazis and their collaborators.'),
      F([2, 3], 'What did the Nuremberg Laws of 1935 do?', "They took away Jewish people's German citizenship and banned marriages between Jews and non-Jews", [
        'They gave Jewish people extra rights',
        'They made Hitler Chancellor',
        'They ended the First World War',
      ], 'They were laws that discriminated by race.', 'The Nuremberg Laws made Jewish people second-class subjects in their own country, a major step in persecution.'),
      F([2, 3], 'As well as Jewish people, which groups did the Nazis persecute and murder?', 'Roma and Sinti people, disabled people, and others they saw as enemies', [
        'Only British soldiers',
        'Nobody else',
        'Only people living in America',
      ], 'Nazi ideas about race and "fitness" targeted many groups.', 'The Nazis also persecuted and murdered Roma and Sinti people and disabled people, and persecuted political opponents, gay men and others.'),
      F([3, 4], 'How did Nazi persecution of Jewish people change between 1933 and 1942?', 'It grew from boycotts and unfair laws to violence, ghettos and finally mass murder', [
        'It got gentler over time',
        'It stayed exactly the same',
        'It stopped when the war began',
      ], 'Think about 1933, 1935, 1938 and 1942.', 'Persecution escalated: boycotts (1933), the Nuremberg Laws (1935), Kristallnacht (1938), ghettos and mass shootings, and from 1942 death camps.'),
      F([3, 4], 'Why is 27 January marked as Holocaust Memorial Day?', 'It is the date Auschwitz-Birkenau was liberated in 1945', [
        'It is the date the war began',
        'It is Hitler’s birthday',
        'It is the date of Kristallnacht',
      ], 'Auschwitz was the largest Nazi death camp.', 'Soviet troops reached Auschwitz-Birkenau on 27 January 1945. The date is used to remember all victims of the Holocaust and later genocides.'),
      F([4, 5], 'Why do historians say the Holocaust needed many people to take part, not just a few leaders?', 'Officials, police, soldiers, railway workers and others helped carry it out, while many bystanders did nothing', [
        'Hitler did everything himself',
        'It happened in secret with no one involved',
        'Only one camp guard was responsible',
      ], 'Think of everything needed to run trains and camps.', 'Huge numbers of people helped through their jobs, and many others looked away. Historians study why ordinary people took part, and also remember those who risked their lives to help.'),
    ],
    reveals: [
      {
        prompt: 'Describe two ways the Nazis persecuted Jewish people in Germany between 1933 and 1939.',
        hint: 'Choose two different examples, such as laws, boycotts or violence, and give a detail for each.',
        model:
          'One way was through laws. The Nuremberg Laws of 1935 took away Jewish people’s German citizenship and banned marriages between Jews and non-Jews, and other laws forced Jewish people out of jobs such as teaching and the civil service. A second way was violence. On Kristallnacht in November 1938, Nazis attacked synagogues, Jewish homes and shops across Germany; around 30,000 Jewish men were sent to concentration camps.',
        checklist: ['Identifies one form of persecution', 'Gives a supporting detail for it', 'Identifies a second form of persecution', 'Gives a supporting detail for the second'],
      },
    ],
  },

  // ------------------------------------------------------------------ NHS
  {
    skill: 'postwar.nhs',
    title: 'the welfare state and the NHS',
    events: [
      E(1909, 'The first old age pensions are paid'),
      E(1911, 'The National Insurance Act gives some workers sick pay'),
      E(1942, 'The Beveridge Report is published'),
      E(1945, 'Labour wins the general election and Clement Attlee becomes Prime Minister'),
      E(1948, 'The National Health Service is created', { key: true, note: 'on 5 July' }),
    ],
    people: [
      { n: 'William Beveridge', did: 'wrote the 1942 report that planned the welfare state' },
      { n: 'Aneurin Bevan', did: 'was the Minister of Health who set up the NHS' },
      { n: 'Clement Attlee', did: 'was the Labour Prime Minister whose government created the welfare state after 1945' },
    ],
    terms: [
      { t: 'welfare state', d: "a system where the government looks after people's basic needs from birth to death" },
      { t: 'free at the point of use', d: 'no charge when you are treated, because it is paid for through taxes' },
      { t: 'National Insurance', d: 'payments taken from wages that fund benefits' },
    ],
    linkPrompt: "Match each of Beveridge's five giants to the reform that tackled it.",
    links: [
      { c: 'Want (poverty)', e: 'National Insurance benefits for the sick, unemployed and elderly' },
      { c: 'Disease', e: 'The National Health Service' },
      { c: 'Ignorance', e: 'Free secondary education for all' },
      { c: 'Squalor', e: 'Building new council houses' },
      { c: 'Idleness (unemployment)', e: 'Government efforts to keep jobs plentiful' },
    ],
    facts: [
      F([1, 2], 'What did the NHS offer when it began in 1948?', 'Healthcare free at the point of use for everyone', [
        'Free healthcare only for soldiers',
        'Cheaper medicine for the rich',
        'Healthcare only in London',
      ], 'Before 1948 many people had to pay to see a doctor.', 'The NHS gave everyone free access to doctors, hospitals, dentists and opticians, paid for through taxes.'),
      F([2, 3], "What were the 'five giants' named in the Beveridge Report?", 'Want, Disease, Ignorance, Squalor and Idleness', [
        'Militarism, Alliances, Imperialism, Nationalism and War',
        'Land, Army, Money, Blame and Peace',
        'Hunger, Cold, Fear, War and Plague',
      ], 'They were problems Beveridge said held Britain back.', 'Beveridge said poverty (Want), illness (Disease), lack of education (Ignorance), bad housing (Squalor) and unemployment (Idleness) must be defeated.'),
      F([3, 4], 'Why did many doctors oppose the NHS at first?', 'They feared losing their independence and income by working for the government', [
        'They wanted to stop treating patients',
        'They thought healthcare should cost more',
        'They had never heard of it',
      ], 'Many doctors ran their own practices.', 'The British Medical Association warned doctors would become state employees. Bevan won most of them round.'),
      F([3, 4], 'How did the Second World War help lead to the welfare state?', 'The war made people expect a fairer society, and the government had already taken charge of many areas of life', [
        'Germany demanded it in a peace treaty',
        'The war made Britain much richer',
        'Soldiers voted against it',
      ], 'Think about rationing, evacuation and the Beveridge Report.', 'Evacuation revealed poverty, rationing showed fair shares could work, and people wanted a better Britain after their sacrifices. Labour won in 1945 promising this.'),
      F([4, 5], 'How did Aneurin Bevan persuade hospital consultants to join the NHS?', 'He let them keep treating private patients as well', [
        'He paid them nothing',
        'He passed a law forcing them all to resign',
        'He promised the NHS would only last a year',
      ], 'He made the deal more attractive for them.', 'Bevan allowed consultants to keep private patients alongside NHS work. He later said he had "stuffed their mouths with gold".'),
    ],
    reveals: [
      {
        prompt: 'Explain why the NHS was created in 1948.',
        hint: 'Think about problems before 1948, the effects of the war, the Beveridge Report and the 1945 election.',
        model:
          'Before 1948 many people could not afford to see a doctor, so illness often went untreated. The Second World War changed attitudes: evacuation showed how poor and unhealthy many families were, and people felt that after their sacrifices they deserved a fairer society. The Beveridge Report of 1942 named Disease as one of the "five giants" and called for a health service. In 1945 Labour won a landslide promising to build the welfare state, and Aneurin Bevan, the Minister of Health, set up the NHS on 5 July 1948, free at the point of use.',
        checklist: ['Explains a problem before 1948', 'Explains the effect of the war', 'Mentions the Beveridge Report', 'Mentions the 1945 Labour government or Bevan'],
      },
    ],
  },

  // ------------------------------------------------------------------ end of empire
  {
    skill: 'postwar.decolonisation',
    title: 'the end of empire',
    events: [
      E(1930, "Gandhi's Salt March"),
      E(1942, 'The Quit India campaign begins'),
      E(1947, 'India and Pakistan become independent', { key: true, note: 'on 15 August, at midnight' }),
      E(1957, 'Ghana becomes independent'),
      E(1960, "Harold Macmillan's 'Wind of Change' speech"),
      E(1962, 'Jamaica becomes independent'),
      E(1997, 'Britain hands Hong Kong back to China'),
    ],
    people: [
      { n: 'Jawaharlal Nehru', did: 'became the first Prime Minister of independent India' },
      { n: 'Muhammad Ali Jinnah', did: 'led the Muslim League and became the first leader of Pakistan' },
      { n: 'Kwame Nkrumah', did: 'led Ghana to independence in 1957' },
      { n: 'Jomo Kenyatta', did: 'became the first leader of independent Kenya' },
      { n: 'Lord Mountbatten', did: 'was the last Viceroy of India, who oversaw independence and partition' },
      { n: 'Mahatma Gandhi', did: 'led non-violent campaigns for Indian independence, such as the Salt March' },
    ],
    terms: [
      { t: 'decolonisation', d: 'the process of colonies becoming independent' },
      { t: 'partition', d: 'dividing a country into separate parts' },
      { t: 'Commonwealth of Nations', d: 'an association of countries, most of them former British colonies' },
      { t: 'civil disobedience', d: 'peacefully refusing to obey laws seen as unjust' },
    ],
    facts: [
      F([1, 2], 'Which two countries became independent from Britain in August 1947?', 'India and Pakistan', ['Ghana and Kenya', 'Jamaica and Barbados', 'Australia and New Zealand'], 'They were formed from British India.', 'British India was divided into two independent countries: India and Pakistan (which then included what is now Bangladesh).'),
      F([2, 3], 'What happened during the partition of India in 1947?', 'Millions of people were forced to move, and huge numbers were killed in violence between religious communities', [
        'Everyone stayed where they were peacefully',
        'Britain took back control of India',
        'India and Pakistan joined together as one country',
      ], 'New borders divided Hindu, Muslim and Sikh communities.', 'Around 10 to 15 million people crossed the new borders, and violence killed hundreds of thousands, perhaps more. Historians still debate the exact numbers.'),
      F([2, 3], 'How did Gandhi campaign for Indian independence?', 'With non-violent protest, such as the Salt March and boycotts of British goods', [
        'By leading an army against the British',
        'By joining the British government',
        'By moving to Britain',
      ], 'He believed in peaceful resistance.', 'Gandhi led mass non-violent civil disobedience. On the Salt March in 1930 he walked to the sea to make salt, breaking a British law that taxed it.'),
      F([3, 4], 'Why did Britain give up most of its empire after 1945?', 'Independence movements were strong, Britain was weakened and in debt after the war, and the USA opposed empires', [
        'Britain won the war and no longer needed colonies',
        'The colonies asked Britain to stay forever',
        'The League of Nations ordered it',
      ], 'Think about money, pressure from the colonies and world opinion.', 'The war left Britain nearly bankrupt, nationalist movements were strong, and both the USA and USSR opposed old empires.'),
      F([4, 5], 'Why was the partition of India so rushed?', 'Britain set an early date to leave, and the new border was drawn in just a few weeks', [
        'India asked Britain to stay longer',
        'The border had been agreed in 1857',
        'Partition took fifty years',
      ], 'The border was announced only after independence day.', 'Mountbatten brought independence forward to August 1947. Cyril Radcliffe drew the border in about five weeks, and it was published two days after independence.'),
    ],
    reveals: [
      {
        prompt: 'Explain why India gained independence in 1947.',
        hint: 'Think about the independence movement, the effects of the Second World War and Britain’s position.',
        model:
          'One reason was the Indian independence movement. Leaders such as Gandhi and Nehru led mass campaigns like the Salt March in 1930 and Quit India in 1942, which showed that millions of Indians wanted the British to leave. A second reason was the Second World War. Britain was left in huge debt and could not afford to hold India by force, and India had contributed over two million soldiers, so Indians expected freedom. Finally, the Labour government elected in 1945 supported independence. In 1947 Britain left, but India was partitioned into India and Pakistan.',
        checklist: ['Explains the role of the independence movement', 'Explains the effect of the Second World War', 'Mentions Britain’s weakness or the Labour government', 'Uses specific detail (names, dates, campaigns)'],
      },
    ],
  },

  // ------------------------------------------------------------------ Cold War
  {
    skill: 'coldwar.basics',
    title: 'the Cold War',
    events: [
      E(1946, "Churchill's 'Iron Curtain' speech"),
      E(1948, 'The Berlin Blockade begins'),
      E(1949, 'NATO is set up'),
      E(1955, 'The Warsaw Pact is formed'),
      E(1961, 'The Berlin Wall is built', { key: true }),
      E(1962, 'The Cuban Missile Crisis', { key: true }),
      E(1989, 'The Berlin Wall falls', { key: true }),
      E(1991, 'The Soviet Union collapses'),
    ],
    people: [
      { n: 'John F. Kennedy', did: 'was the US President during the Cuban Missile Crisis' },
      { n: 'Nikita Khrushchev', did: 'was the Soviet leader who placed nuclear missiles on Cuba' },
      { n: 'Mikhail Gorbachev', did: 'was the last leader of the Soviet Union, whose reforms helped end the Cold War' },
      { n: 'Fidel Castro', did: 'led the communist revolution in Cuba' },
    ],
    terms: [
      { t: 'Cold War', d: 'the long period of tension between the USA and the USSR, without direct fighting between them' },
      { t: 'communism', d: 'a system where the state owns land and industry, with one party in control' },
      { t: 'capitalism', d: 'a system where people and companies own businesses and make profits' },
      { t: 'Iron Curtain', d: 'the dividing line between communist eastern Europe and the democratic west' },
      { t: 'NATO', d: 'a military alliance of the USA, Canada and western European countries, set up in 1949' },
      { t: 'superpower', d: 'a country with enormous military and economic power' },
    ],
    sorts: [
      {
        cats: ['USA (capitalist)', 'USSR (communist)'],
        ask: ['a feature of the capitalist USA', 'a feature of the communist USSR'],
        q: 'Is this a feature of the capitalist USA or the communist USSR during the Cold War?',
        hint: 'Communism: one party and state ownership. Capitalism: private businesses and competing parties.',
        ex: 'The Cold War was a clash between two different systems and ideas.',
        items: [
          ['Several political parties compete in free elections', 0],
          ['Businesses are owned by individuals and companies', 0],
          ['People can openly criticise the government', 0],
          ['Only one political party is allowed', 1],
          ['The state owns factories and farms', 1],
          ['The government controls newspapers and broadcasting', 1],
        ],
      },
    ],
    facts: [
      F([1, 2], 'Which two superpowers were rivals in the Cold War?', 'The USA and the USSR', ['Britain and France', 'Germany and Japan', 'China and India'], 'One was capitalist, one communist.', 'The USA and the Soviet Union (USSR) were allies in the Second World War but rivals for over forty years afterwards.'),
      F([2, 3], "Why was it called a 'cold' war?", 'The USA and the USSR never fought each other directly', [
        'It was mostly fought in winter',
        'It was fought in the Arctic',
        'No one in the world was killed',
      ], 'Compare it with a "hot" war.', 'The superpowers never went to war with each other directly, partly because nuclear weapons made that too dangerous, though they backed opposite sides in other wars.'),
      F([2, 3], 'How did the West respond to the Soviet blockade of West Berlin in 1948?', 'With the Berlin Airlift, flying in food and fuel', [
        'By invading East Germany',
        'By giving West Berlin to the USSR',
        'By building the Berlin Wall',
      ], 'Roads and railways were blocked, but the air was open.', 'For almost a year, American and British planes flew supplies into West Berlin until Stalin lifted the blockade in 1949.'),
      F([3, 4], 'Why was the Berlin Wall built in 1961?', 'To stop East Germans escaping to the West through Berlin', [
        ['To stop West Germans invading East Germany', 'The East German government said this, but the real aim was to stop its own people leaving.'],
        'To protect Berlin from floods',
        'To mark the end of the Second World War',
      ], 'Millions had already left East Germany.', 'Around three million people had fled East Germany, many through Berlin. The wall stopped this, dividing families until 1989.'),
      F([3, 4], 'Why was the Cuban Missile Crisis of 1962 so dangerous?', 'Soviet nuclear missiles on Cuba could hit the USA, and the world came close to nuclear war', [
        'Cuba invaded the USA',
        'The USA dropped atomic bombs on Cuba',
        'Britain declared war on the USSR',
      ], 'Cuba is about 90 miles from Florida.', 'For thirteen days in October 1962, the US blockaded Cuba and both sides prepared for war, until a deal was reached.'),
      F([4, 5], 'How did the Cuban Missile Crisis end?', 'The USSR removed its missiles; the USA promised not to invade Cuba and secretly agreed to remove its missiles from Turkey', [
        'The USA invaded Cuba',
        'The USSR kept its missiles on Cuba',
        'Britain bought the missiles',
      ], 'Both sides gave something up.', 'Khrushchev withdrew the missiles in return for Kennedy’s public promise not to invade Cuba and a secret promise to remove US missiles from Turkey.'),
    ],
    reveals: [
      {
        prompt: 'Explain why tension grew between the USA and the USSR after 1945.',
        hint: 'Think about different ideas (ideology), Soviet control of eastern Europe, Berlin and nuclear weapons.',
        model:
          'Tension grew first because of ideology: the USA was capitalist and democratic, while the USSR was a communist one-party state, and each feared the other wanted to spread its system. After 1945 the USSR set up communist governments across eastern Europe, which Churchill described as an "Iron Curtain" in 1946. Berlin became a flashpoint: in 1948 Stalin blockaded West Berlin and the West responded with the airlift, and NATO was formed in 1949. The nuclear arms race added fear on both sides.',
        checklist: ['Explains differences in ideology', 'Mentions Soviet control of eastern Europe or the Iron Curtain', 'Uses a specific event (Berlin Blockade, NATO, arms race)', 'Explains how each made tension worse'],
      },
    ],
  },

  // ------------------------------------------------------------------ civil rights
  {
    skill: 'postwar.civil-rights',
    title: 'civil rights in the USA and Britain',
    events: [
      E(1948, 'The Empire Windrush brings Caribbean migrants to Britain'),
      E(1954, 'The US Supreme Court rules that segregated schools are illegal'),
      E(1955, 'Rosa Parks is arrested, starting the Montgomery Bus Boycott'),
      E(1963, 'The Bristol Bus Boycott'),
      E(1964, 'The US Civil Rights Act bans segregation in public places'),
      E(1965, 'The first Race Relations Act is passed in Britain'),
      E(1968, 'Martin Luther King is assassinated'),
    ],
    people: [
      { n: 'Rosa Parks', did: 'refused to give up her bus seat in Montgomery, Alabama in 1955' },
      { n: 'Martin Luther King', did: 'was a Baptist minister who led non-violent campaigns for civil rights in the USA' },
      { n: 'Paul Stephenson', did: 'helped lead the Bristol Bus Boycott against a colour bar in 1963' },
      { n: 'Malcolm X', did: 'was a civil rights leader who argued that Black Americans had the right to defend themselves' },
      { n: 'Claudia Jones', did: 'founded the West Indian Gazette and helped start what became the Notting Hill Carnival' },
    ],
    terms: [
      { t: 'segregation', d: 'keeping people of different races apart by law or custom' },
      { t: 'civil rights', d: 'the rights of every citizen to equal treatment under the law' },
      { t: 'colour bar', d: 'a rule or practice refusing jobs or services to people because of their skin colour' },
      { t: 'Jim Crow laws', d: 'laws in the southern USA that enforced segregation' },
      { t: 'Windrush generation', d: 'people who came to Britain from the Caribbean between 1948 and the early 1970s' },
    ],
    facts: [
      F([1, 2], 'What did Rosa Parks refuse to do in 1955?', 'Give up her seat on a bus to a white passenger', ['Pay her bus fare', 'Go to school', 'Join the army'], 'It happened in Montgomery, Alabama.', 'Rosa Parks’ arrest led to the Montgomery Bus Boycott, which lasted over a year until bus segregation there was ruled illegal.'),
      F([2, 3], 'Why was the Montgomery Bus Boycott effective?', "Black passengers were most of the bus company's customers, so the boycott cost it a lot of money", [
        'The buses stopped running for good',
        'The President ordered every bus to be free',
        'White passengers joined the boycott in huge numbers',
      ], 'Who used the buses most?', 'Black passengers walked or shared cars for 381 days. The company lost most of its income, and the Supreme Court ruled bus segregation unconstitutional.'),
      F([2, 3], 'What was the Bristol Bus Boycott of 1963 protesting against?', "The bus company's refusal to employ Black and Asian drivers and conductors", [
        'High bus fares for students',
        'Buses not running on Sundays',
        'Segregated seats on buses',
      ], 'It was about jobs, not seats.', 'Inspired by Montgomery, campaigners in Bristol boycotted the buses. In August 1963 the company ended its colour bar.'),
      F([3, 4], 'Why did many people come to Britain from the Caribbean after 1948?', 'They were invited to help fill labour shortages, for example in transport and the NHS, and they were British citizens', [
        'They were forced to by the government',
        'Britain had more jobs in farming than ever',
        'They were escaping the Second World War',
      ], 'Britain needed workers to rebuild after the war.', 'After the war Britain was short of workers. People from the Caribbean, as citizens of the Empire and Commonwealth, came to work, though many faced racism and discrimination.'),
      F([3, 4], 'What did the 1965 Race Relations Act do?', 'It made racial discrimination in public places illegal', [
        'It banned immigration completely',
        'It gave everyone the vote',
        'It created the NHS',
      ], 'It was Britain’s first law against racial discrimination.', 'The 1965 Act banned discrimination in public places such as hotels and pubs. The 1968 Act extended this to housing and employment.'),
      F([4, 5], 'Why did Martin Luther King use non-violent protest?', 'He believed it was morally right, and it won public sympathy when peaceful protesters were attacked on television', [
        'He had no supporters',
        'Violence was the only legal method',
        'The government paid him to',
      ], 'Think about his faith and about television.', 'King, influenced by his Christian faith and by Gandhi, believed in non-violence. TV pictures of police attacking peaceful marchers shocked many Americans and helped win new laws.'),
    ],
    reveals: [
      {
        prompt: 'Explain why the civil rights movement in the USA won important changes in the 1960s.',
        hint: 'Think about leadership, methods, media and the federal government.',
        model:
          'One reason was strong leadership and organisation. Martin Luther King and others organised boycotts, sit-ins and marches, such as the March on Washington in 1963. Their non-violent methods won sympathy, especially when television showed police attacking peaceful protesters. Another reason was pressure on the federal government: the Supreme Court had already ruled school segregation illegal in 1954, and the protests pushed Congress to pass the Civil Rights Act of 1964 and the Voting Rights Act of 1965. The courage of ordinary people, like Rosa Parks and the Montgomery boycotters, was also vital.',
        checklist: ['Gives at least two reasons', 'Mentions non-violent methods or the media', 'Mentions a law or court ruling', 'Uses specific names or dates'],
      },
      {
        prompt: 'Describe two features of the experience of the Windrush generation in Britain.',
        hint: 'Think about why they came, the work they did and what they faced.',
        model:
          'One feature was that many came to fill vital jobs. After the Empire Windrush arrived in 1948, people from the Caribbean worked in the NHS, on buses and the railways and in factories, helping to rebuild Britain after the war. A second feature was facing racism. Many found signs saying "no Black people" when looking for housing, and some were refused jobs, such as on Bristol’s buses, which led to protests like the Bristol Bus Boycott in 1963.',
        checklist: ['Identifies one feature', 'Gives a supporting detail for it', 'Identifies a second feature', 'Gives a supporting detail for the second feature'],
      },
    ],
  },
]
