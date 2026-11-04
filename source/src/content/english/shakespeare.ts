import type { ItemGenerator } from '@/engine/registry'
import { choice } from '../kit'
import { G, atLevel, bankGen, classifyGen, pairMatchGen, q, revealGen, sample, sequenceGen, termChoiceGen, termMatchGen, type Example, type Lv, type MC, type Pair, type Term } from './helpers'

// =====================================================================================================
// Shared: "who says this?" generator
// =====================================================================================================

interface Quote {
  line: string
  who: string
  ctx: string
  lv: Lv
}

function whoSaidGen(id: string, skill: string, levels: [number, number], quotes: Quote[], cast: string[], play: string): ItemGenerator {
  return G(id, skill, levels, (rng, d) => {
    const r = rng.pick(atLevel(quotes, d))
    return choice({
      rng,
      prompt: `In ${play}, who says this?\n${q(r.line)}`,
      correct: r.who,
      wrong: sample(
        rng,
        cast.filter((c) => c !== r.who),
        3,
      ),
      hint: 'Think about which character would have this attitude at this point in the play.',
      explanation: `${r.who}: ${r.ctx}`,
    })
  })
}

// =====================================================================================================
// Drama conventions
// =====================================================================================================

const DRAMA_TERMS: Term[] = [
  { term: 'soliloquy', def: 'a speech in which a character alone on stage speaks their thoughts aloud', lv: 2 },
  { term: 'aside', def: 'a short remark to the audience (or one character) that the others on stage cannot hear', lv: 2 },
  { term: 'monologue', def: 'a long speech by one character to other characters', lv: 3 },
  { term: 'dialogue', def: 'conversation between characters', lv: 1 },
  { term: 'dramatic irony', def: 'when the audience knows something that a character does not', lv: 2 },
  { term: 'stage directions', def: 'instructions in a script about movement, entrances, exits and actions', lv: 1 },
  { term: 'exeunt', def: 'a stage direction meaning "they leave the stage"', lv: 3 },
  { term: 'prologue', def: 'an introduction spoken before the play begins', lv: 2 },
  { term: 'epilogue', def: 'a speech at the end of a play, often addressed to the audience', lv: 3 },
  { term: 'protagonist', def: 'the main character of a play or story', lv: 3 },
  { term: 'antagonist', def: 'the character who opposes the main character', lv: 3 },
  { term: 'foil', def: 'a character whose contrast with another highlights their qualities', lv: 4 },
  { term: 'comic relief', def: 'a funny scene or character that eases the tension', lv: 4 },
]

const CONVENTION_EX: Example[] = [
  { text: 'Hamlet is alone on stage and speaks his thoughts: "To be, or not to be..."', a: 'soliloquy', why: 'He is alone, speaking his thoughts aloud.', lv: 2 },
  { text: 'In the middle of a conversation, a character turns and whispers to the audience, "If only he knew the truth!" The others do not hear.', a: 'aside', why: 'A brief remark the other characters cannot hear.', lv: 2 },
  { text: 'In Much Ado About Nothing, the audience knows Hero is innocent, but Claudio believes she has been unfaithful.', a: 'dramatic irony', why: 'We know something Claudio does not.', lv: 2 },
  { text: 'In Romeo and Juliet, we know Juliet has only taken a sleeping potion, but Romeo believes she is dead.', a: 'dramatic irony', why: 'The audience knows the truth; Romeo does not.', lv: 3 },
  { text: 'A chorus speaks fourteen lines before Act 1 begins, telling us the lovers will die.', a: 'prologue', why: 'An introduction before the play starts.', lv: 3 },
  { text: 'At the end of A Midsummer Night\'s Dream, Puck asks the audience to forgive the actors if they were offended.', a: 'epilogue', why: 'A closing speech to the audience.', lv: 3 },
  { text: 'After being tricked, Benedick is left alone on stage and talks through his new feelings for Beatrice.', a: 'soliloquy', why: 'He is alone, revealing his thoughts.', lv: 3 },
  { text: 'In a comedy full of romantic drama, a bumbling constable keeps using the wrong words, making the audience laugh.', a: 'comic relief', why: 'A comic character lightens the mood (Dogberry in Much Ado).', lv: 4 },
  { text: 'In Macbeth, King Duncan arrives at Macbeth\'s castle and praises how pleasant it is, but the audience knows the Macbeths are planning to murder him there.', a: 'dramatic irony', why: 'Duncan feels safe in a place the audience knows is deadly.', lv: 4 },
]

// =====================================================================================================
// Shakespeare's life and theatre
// =====================================================================================================

const LIFE: MC[] = [
  { q: 'Where was William Shakespeare born?', a: 'Stratford-upon-Avon', w: ['London', 'Oxford', 'Windsor'], hint: 'A market town in Warwickshire.', ex: 'Shakespeare was born in Stratford-upon-Avon in 1564.', lv: 1 },
  { q: 'In which year was Shakespeare born?', a: '1564', w: ['1616', '1599', '1066'], hint: 'He died in 1616, aged 52.', ex: 'He was born in 1564 and died in 1616.', lv: 2 },
  { q: 'In which year did Shakespeare die?', a: '1616', w: ['1564', '1599', '1660'], hint: 'Early in the reign of James I.', ex: 'Shakespeare died in 1616.', lv: 2 },
  { q: 'Who was Shakespeare\'s wife?', a: 'Anne Hathaway', w: ['Elizabeth I', 'Mary Arden', 'Juliet Capulet'], hint: 'Her cottage near Stratford is now a museum.', ex: 'He married Anne Hathaway; they had three children: Susanna and the twins Hamnet and Judith.', lv: 2 },
  { q: 'Where was the Globe Theatre built in 1599?', a: 'on the south bank of the River Thames in London', w: ['in Stratford-upon-Avon', 'inside the Tower of London', 'in Edinburgh'], hint: 'Bankside, Southwark.', ex: 'The Globe stood on Bankside, on the south bank of the Thames.', lv: 2 },
  { q: 'What were the "groundlings"?', a: 'the poorer audience members who paid a penny to stand in the yard', w: ['the actors who played villains', 'the people who built the theatre', 'the musicians'], hint: 'They stood on the ground in front of the stage.', ex: 'Groundlings paid about a penny to stand in the open yard.', lv: 1 },
  { q: 'Who played the female roles in Shakespeare\'s plays when they were first performed?', a: 'boys and young men', w: ['women from the court', 'the playwright\'s wife', 'puppets'], hint: 'Women were not allowed to act on the public stage then.', ex: 'Female parts were played by boys and young men.', lv: 1 },
  { q: 'What happened to the first Globe Theatre in 1613?', a: 'It burned down when a cannon fired during a play set the thatched roof alight.', w: ['It was flooded by the Thames.', 'It was closed because nobody came.', 'It was moved to Stratford.'], hint: 'A special effect went wrong.', ex: 'During a performance of Henry VIII, a stage cannon set the thatch on fire.', lv: 3 },
  { q: 'When were plays usually performed at the Globe?', a: 'in the afternoon, using daylight', w: ['late at night by electric light', 'only on Sundays', 'at dawn'], hint: 'The theatre was open to the sky.', ex: 'With no electric lighting, plays took place in the afternoon.', lv: 2 },
  { q: 'Shakespeare\'s acting company was first called the Lord Chamberlain\'s Men. What were they renamed when James I became king in 1603?', a: 'the King\'s Men', w: ['the Queen\'s Players', 'the Globe Company', 'the Royal Shakespeare Company'], hint: 'The new king became their patron.', ex: 'James I became their patron, so they became the King\'s Men.', lv: 4 },
  { q: 'What was the First Folio (1623)?', a: 'the first collection of Shakespeare\'s plays, published after his death by fellow actors', w: ['Shakespeare\'s first play', 'a diary Shakespeare kept', 'the first theatre ticket'], hint: 'It was put together by his friends John Heminges and Henry Condell.', ex: 'Without the First Folio, many of his plays might have been lost.', lv: 4 },
  { q: 'How many sonnets did Shakespeare publish in his collection of 1609?', a: '154', w: ['14', '37', '1,000'], hint: 'Well over a hundred.', ex: 'The 1609 collection contains 154 sonnets.', lv: 5 },
  { q: 'Which two monarchs reigned during Shakespeare\'s working life?', a: 'Elizabeth I and James I', w: ['Henry VIII and Elizabeth I', 'Victoria and Edward VII', 'Charles I and Charles II'], hint: 'One Tudor, one Stuart.', ex: 'Elizabeth I (to 1603), then James I.', lv: 3 },
  { q: 'A reconstruction of the Globe, called Shakespeare\'s Globe, opened near the original site in which decade?', a: 'the 1990s', w: ['the 1890s', 'the 1960s', 'the 2010s'], hint: 'It opened at the end of the twentieth century.', ex: 'Shakespeare\'s Globe opened in 1997.', lv: 4 },
  { q: 'Why did the Globe need very little scenery?', a: 'The words of the play described the setting for the audience.', w: ['Scenery had not been invented.', 'The audience brought their own.', 'It was against the law.'], hint: 'How do characters tell us where they are?', ex: 'Characters\' speeches often set the scene, so the audience imagined it.', lv: 3 },
]

// =====================================================================================================
// Shakespeare's language
// =====================================================================================================

const OLD_WORDS: Pair[] = [
  { left: 'thou', right: 'you (as the subject)', lv: 1 },
  { left: 'thee', right: 'you (as the object)', lv: 2 },
  { left: 'thy', right: 'your', lv: 1 },
  { left: 'art', right: 'are (thou art)', lv: 1 },
  { left: 'hath', right: 'has', lv: 1 },
  { left: 'doth', right: 'does', lv: 2 },
  { left: 'wherefore', right: 'why', lv: 2 },
  { left: 'ere', right: 'before', lv: 3 },
  { left: 'anon', right: 'soon / straight away', lv: 3 },
  { left: 'hence', right: 'away from here', lv: 4 },
  { left: 'hither', right: 'to here', lv: 4 },
  { left: 'prithee', right: 'please (I pray thee)', lv: 3 },
  { left: 'aye', right: 'yes', lv: 1 },
  { left: 'nay', right: 'no', lv: 1 },
  { left: 'methinks', right: 'I think', lv: 2 },
  { left: '\'tis', right: 'it is', lv: 1 },
  { left: 'morrow', right: 'morning (good morrow = good morning)', lv: 3 },
]

const LANG_QS: MC[] = [
  { q: 'Juliet asks, "O Romeo, Romeo, wherefore art thou Romeo?" What does she mean?', a: 'Why are you Romeo (a Montague, my family\'s enemy)?', w: [{ label: 'Where are you, Romeo?', feedback: '"Wherefore" means "why", not "where".' }, 'Who are you, Romeo?', 'When will you come, Romeo?'], hint: '"Wherefore" means...?', ex: '"Wherefore" means "why". She wishes he were not a Montague.', lv: 2 },
  { q: 'Why might a character switch from calling someone "you" to "thou"?', a: '"Thou" is more familiar or intimate (or can be insulting), so it shows a change in their relationship.', w: ['"Thou" is more formal and polite.', 'Because "thou" is plural.', 'Because the actor forgot the line.'], hint: 'Think of the difference between talking to a friend and to a head teacher.', ex: '"You" was more formal; "thou" was used with close friends, family, inferiors, or to insult.', lv: 4 },
  { q: 'What does "\'Tis" mean?', a: 'It is', w: ['This', 'Thus', 'Its'], hint: 'An apostrophe shows a missing letter.', ex: '\'Tis = it is.', lv: 1 },
  { q: 'In Shakespeare\'s plays, which characters usually speak in PROSE rather than verse?', a: 'servants and comic characters (and characters in light-hearted scenes)', w: ['kings and queens in serious scenes', 'only the narrator', 'only characters in love'], hint: 'Prose is ordinary speech without a regular rhythm.', ex: 'Prose tends to be used by lower-status or comic characters, and for jokes and banter (Much Ado About Nothing uses a lot of prose).', lv: 4 },
  { q: '"Good morrow, cousin." What does "Good morrow" mean?', a: 'Good morning', w: ['Goodbye forever', 'Good luck tomorrow', 'Good evening'], hint: 'Morrow is related to "morning".', ex: '"Good morrow" was a greeting meaning good morning.', lv: 2 },
  { q: '"Ere the sun sets, I shall return." What does "ere" mean?', a: 'before', w: ['after', 'when', 'unless'], hint: 'Try each option in the sentence.', ex: '"Ere" means before.', lv: 3 },
  { q: 'Shakespeare often wrote lines with ten syllables and a da-DUM rhythm. What is this called?', a: 'iambic pentameter', w: ['free verse', 'a sonnet', 'prose'], hint: 'Five iambs per line.', ex: 'Iambic pentameter: five iambs (da-DUM) per line.', lv: 3 },
  { q: 'What does "Hence!" mean when a character shouts it?', a: 'Go away!', w: ['Come here!', 'Thank you!', 'Hello!'], hint: '"Hence" means away from here.', ex: '"Hence!" orders someone to leave.', lv: 4 },
]

// =====================================================================================================
// Much Ado About Nothing
// =====================================================================================================

const MUCH_ADO_PLOT = [
  'Don Pedro and his soldiers arrive in Messina after the war.',
  'Claudio falls in love with Hero.',
  'At the masked ball, Don Pedro woos Hero on Claudio\'s behalf.',
  'Claudio and Hero are engaged.',
  'Benedick overhears the men saying that Beatrice loves him.',
  'Beatrice overhears Hero and Ursula saying that Benedick loves her.',
  'Don John tells Claudio and Don Pedro that Hero is unfaithful.',
  'The Watch arrest Borachio and Conrade.',
  'Claudio shames Hero at the wedding and she collapses.',
  'The Friar suggests pretending that Hero has died.',
  'Beatrice asks Benedick to kill Claudio.',
  'Borachio confesses and Hero\'s innocence is revealed.',
  'Claudio agrees to marry Leonato\'s "niece".',
  'At the second wedding the bride is revealed to be Hero.',
]

const MUCH_ADO_PLOT_MC: MC[] = [
  { q: 'Where is Much Ado About Nothing set?', a: 'Messina, in Sicily', w: ['Verona, in Italy', 'Athens, in Greece', 'Elsinore, in Denmark'], hint: 'An island off the south of Italy.', ex: 'The play is set in Messina, Sicily, at Leonato\'s house.', lv: 1 },
  { q: 'At the start of the play, where are Don Pedro and his men returning from?', a: 'a war', w: ['a wedding', 'a sea voyage to England', 'prison'], hint: 'They are soldiers.', ex: 'They return victorious from a war.', lv: 1 },
  { q: 'How does Don John trick Claudio into thinking Hero is unfaithful?', a: 'Borachio is seen at Hero\'s window at night with Margaret, who Claudio thinks is Hero.', w: ['He forges a love letter from Hero.', 'He pays Hero to lie.', 'He tells Claudio that Hero is already married.'], hint: 'Think about the window scene and who is really there.', ex: 'Claudio watches from a distance and mistakes Margaret for Hero.', lv: 3 },
  { q: 'Who first discovers Don John\'s plot?', a: 'the Watch, led by Dogberry', w: ['Beatrice', 'Leonato', 'Don Pedro'], hint: 'They overhear Borachio boasting.', ex: 'The bumbling Watch overhear Borachio bragging to Conrade and arrest them.', lv: 2 },
  { q: 'Why does Leonato fail to learn about the plot before the wedding?', a: 'He is too busy and impatient to listen to Dogberry\'s muddled report.', w: ['Dogberry decides to keep it secret.', 'Leonato is away in Aragon.', 'The Watch forget to tell anyone.'], hint: 'Dogberry tries to tell him...', ex: 'Dogberry\'s rambling and Leonato\'s hurry mean the truth comes too late to stop the wedding.', lv: 4 },
  { q: 'What does the Friar suggest after Hero is shamed at the wedding?', a: 'Pretend Hero has died, so that Claudio will regret what he did.', w: ['Send Hero away to a convent forever.', 'Challenge Claudio to a duel.', 'Hold the wedding again the next day.'], hint: 'His plan is itself a kind of deception.', ex: 'He hopes the "death" will make Claudio grieve and remember how he loved her.', lv: 3 },
  { q: 'How does Claudio make amends for wronging Hero?', a: 'He agrees to marry Leonato\'s "niece" without seeing her face.', w: ['He leaves Messina forever.', 'He fights Don John.', 'He gives Leonato all his money.'], hint: 'Leonato sets a condition.', ex: 'The veiled "niece" turns out to be Hero.', lv: 3 },
  { q: 'How does the play end?', a: 'with two weddings planned and a dance', w: ['with the deaths of the lovers', 'with Don John crowned prince', 'with Beatrice leaving Messina'], hint: 'It is a comedy.', ex: 'Hero and Claudio, and Beatrice and Benedick, are to marry; the play ends with dancing and news that Don John has been caught.', lv: 2 },
  { q: 'What happens to Don John at the end of the play?', a: 'News arrives that he has been captured; his punishment is put off until tomorrow.', w: ['He marries Margaret.', 'He is forgiven and joins the dance.', 'He kills Borachio.'], hint: 'Benedick says to think of his punishment tomorrow.', ex: 'A messenger reports his capture, but Benedick says to think of "brave punishments" tomorrow.', lv: 4 },
  { q: 'Where does Benedick hide to overhear the conversation that tricks him?', a: 'in the orchard (an arbour in the garden)', w: ['under Leonato\'s bed', 'in the church', 'on a ship'], hint: 'It is outdoors at Leonato\'s house.', ex: 'He hides in the orchard while Don Pedro, Claudio and Leonato talk loudly about Beatrice\'s "love".', lv: 4 },
]

const MUCH_ADO_CAST: Pair[] = [
  { left: 'Beatrice', right: 'Leonato\'s witty niece, who swears she will never marry', lv: 1 },
  { left: 'Benedick', right: 'a lord of Padua who mocks love and marriage', lv: 1 },
  { left: 'Hero', right: 'Leonato\'s gentle daughter, falsely accused', lv: 1 },
  { left: 'Claudio', right: 'a young lord of Florence who falls in love with Hero', lv: 2 },
  { left: 'Don Pedro', right: 'the Prince of Aragon, who arranges the tricks to make people fall in love', lv: 2 },
  { left: 'Don John', right: 'Don Pedro\'s resentful illegitimate brother, the villain', lv: 2 },
  { left: 'Leonato', right: 'the Governor of Messina, Hero\'s father', lv: 2 },
  { left: 'Dogberry', right: 'the bumbling constable who muddles his words', lv: 1 },
  { left: 'Borachio', right: 'Don John\'s follower, who carries out the trick at the window', lv: 3 },
  { left: 'Margaret', right: 'Hero\'s gentlewoman, mistaken for Hero at the window', lv: 4 },
  { left: 'Friar Francis', right: 'the priest who suggests pretending Hero has died', lv: 3 },
  { left: 'Ursula', right: 'a gentlewoman who helps Hero trick Beatrice', lv: 4 },
  { left: 'Antonio', right: 'Leonato\'s brother', lv: 4 },
]

const MUCH_ADO_CHAR_MC: MC[] = [
  { q: 'What is the relationship between Beatrice and Hero?', a: 'They are cousins.', w: ['They are sisters.', 'Beatrice is Hero\'s mother.', 'They are strangers.'], hint: 'Beatrice is Leonato\'s niece; Hero is his daughter.', ex: 'Beatrice is Leonato\'s niece, so she and Hero are cousins.', lv: 1 },
  { q: 'How is Don John related to Don Pedro?', a: 'He is Don Pedro\'s illegitimate half-brother.', w: ['He is his son.', 'He is his father.', 'He is no relation.'], hint: 'His position may explain his resentment.', ex: 'Don John is the "bastard" (illegitimate) brother of the Prince, which feeds his bitterness.', lv: 2 },
  { q: 'Leonato describes a "merry war" between which two characters?', a: 'Beatrice and Benedick', w: ['Claudio and Hero', 'Don Pedro and Don John', 'Dogberry and Verges'], hint: 'They fight with words whenever they meet.', ex: '"There is a kind of merry war betwixt Signior Benedick and her."', lv: 1 },
  { q: 'What is comic about Dogberry\'s speech?', a: 'He uses long words wrongly, often saying the opposite of what he means.', w: ['He only speaks in rhyme.', 'He speaks in Latin.', 'He never says anything at all.'], hint: '"Comparisons are odorous."', ex: 'Dogberry\'s malapropisms (e.g. "odorous" for "odious") make him ridiculous.', lv: 2 },
  { q: 'How does Claudio react when he believes Hero has been unfaithful?', a: 'He publicly shames her at their wedding.', w: ['He quietly calls off the wedding in private.', 'He forgives her immediately.', 'He challenges Don John to a duel.'], hint: 'He chooses the most public place possible.', ex: 'He humiliates her in front of everyone at the altar.', lv: 2 },
  { q: 'How does Benedick show he has changed by Act 4?', a: 'He sides with Beatrice and agrees to challenge his friend Claudio.', w: ['He leaves to go back to war.', 'He joins Don John.', 'He refuses to speak to Beatrice.'], hint: 'Who does he choose to trust?', ex: 'He believes Beatrice and challenges Claudio, putting love before his friendship and loyalty to the soldiers.', lv: 4 },
  { q: 'What does Beatrice\'s line "O that I were a man!" show about her?', a: 'She is furious at the wrong done to Hero and frustrated that, as a woman, she cannot fight for her.', w: ['She wants to join the army for fun.', 'She is jealous of Benedick\'s clothes.', 'She agrees with Claudio.'], hint: 'What has just happened to Hero?', ex: 'She is angry about Hero\'s treatment and frustrated by the limits placed on women.', lv: 4 },
  { q: 'How does Leonato first react when Hero is accused at the wedding?', a: 'He believes the accusation and wishes she were dead.', w: ['He defends her immediately.', 'He laughs it off as a joke.', 'He blames Beatrice.'], hint: '"Do not live, Hero..."', ex: 'Shockingly, he believes the princes over his daughter: "Do not live, Hero".', lv: 4 },
  { q: 'Which character could be described as a foil to Hero?', a: 'Beatrice: outspoken and witty, while Hero is quiet and obedient', w: ['Claudio: they are both men', 'Dogberry: they are both comic', 'Don John: they are both villains'], hint: 'A foil contrasts with another character.', ex: 'Beatrice\'s boldness highlights Hero\'s quietness, and vice versa.', lv: 5 },
]

const MUCH_ADO_QUOTES: Quote[] = [
  { line: 'I had rather hear my dog bark at a crow than a man swear he loves me.', who: 'Beatrice', ctx: 'Beatrice mocks the idea of love in Act 1.', lv: 2 },
  { line: 'What, my dear Lady Disdain! are you yet living?', who: 'Benedick', ctx: 'Benedick teases Beatrice in their first exchange.', lv: 2 },
  { line: 'There is a kind of merry war betwixt Signior Benedick and her.', who: 'Leonato', ctx: 'Leonato explains Beatrice and Benedick\'s battles of wit.', lv: 3 },
  { line: 'I am a plain-dealing villain.', who: 'Don John', ctx: 'Don John openly admits his villainy in Act 1.', lv: 2 },
  { line: 'Can the world buy such a jewel?', who: 'Claudio', ctx: 'Claudio describes Hero in Act 1 - as if she were a precious object.', lv: 3 },
  { line: 'Give not this rotten orange to your friend.', who: 'Claudio', ctx: 'Claudio rejects Hero at the wedding (Act 4).', lv: 3 },
  { line: 'Kill Claudio.', who: 'Beatrice', ctx: 'Beatrice asks Benedick to prove his love by killing Claudio (Act 4).', lv: 2 },
  { line: 'The world must be peopled.', who: 'Benedick', ctx: 'Benedick justifies changing his mind about marriage after being tricked (Act 2).', lv: 4 },
  { line: 'Comparisons are odorous.', who: 'Dogberry', ctx: 'Dogberry means "odious" (hateful), a typical muddle.', lv: 2 },
  { line: 'When I said I would die a bachelor, I did not think I should live till I were married.', who: 'Benedick', ctx: 'Benedick explains away his change of heart (Act 2).', lv: 4 },
  { line: 'O that I were a man!', who: 'Beatrice', ctx: 'Beatrice is furious about Hero\'s treatment (Act 4).', lv: 3 },
  { line: 'I do love nothing in the world so well as you: is not that strange?', who: 'Benedick', ctx: 'Benedick confesses his love to Beatrice after the wedding (Act 4).', lv: 4 },
  { line: 'One Hero died defiled, but I do live.', who: 'Hero', ctx: 'Hero unveils herself at the second wedding (Act 5).', lv: 5 },
  { line: 'O that he were here to write me down an ass!', who: 'Dogberry', ctx: 'Dogberry is insulted by Conrade and wants it written down (Act 4).', lv: 3 },
  { line: 'Speak low, if you speak love.', who: 'Don Pedro', ctx: 'Don Pedro, masked, speaks to Hero at the ball (Act 2).', lv: 5 },
  { line: 'Friendship is constant in all other things / Save in the office and affairs of love.', who: 'Claudio', ctx: 'Claudio wrongly believes Don Pedro has wooed Hero for himself (Act 2).', lv: 5 },
]
const MUCH_ADO_SPEAKERS = ['Beatrice', 'Benedick', 'Leonato', 'Don John', 'Claudio', 'Dogberry', 'Hero', 'Don Pedro']

const MUCH_ADO_THEMES: MC[] = [
  { q: 'Which of these is an example of deception used for a GOOD purpose?', a: 'Don Pedro\'s plan to trick Beatrice and Benedick into falling in love', w: [{ label: 'Don John\'s plot to make Hero seem unfaithful', feedback: 'That deception is meant to cause harm.' }, { label: 'Borachio meeting Margaret at Hero\'s window', feedback: 'That is part of Don John\'s cruel plot.' }, { label: 'Don John lying to Claudio at the masked ball', feedback: 'That was meant to cause trouble.' }], hint: 'Which trick brings people together?', ex: 'The play shows deception can be kind (the "gulling" of Beatrice and Benedick) or cruel (Don John\'s plots).', lv: 2 },
  { q: 'In Shakespeare\'s time, "nothing" was probably pronounced much like "noting". Why might that matter for the title?', a: '"Noting" means noticing or overhearing, and the plot is driven by people overhearing and misreading what they see.', w: ['It means the play is about a lazy character.', 'It shows that nothing happens in the play.', 'It is the name of a character.'], hint: 'Think of the orchard and window scenes.', ex: 'The title is often read as a pun: the plot turns on "noting" - eavesdropping and misinterpreting.', lv: 4 },
  { q: 'Why is Hero\'s public shaming so serious in the world of the play?', a: 'A woman\'s reputation for honour and chastity was seen as vital, and its loss could ruin her and her family.', w: ['Because Hero had broken the law of Messina.', 'Because Claudio was the prince.', 'Because the wedding cost so much.'], hint: 'Think about honour and reputation.', ex: 'Hero\'s honour depends on her reputation, which is why even her father turns on her.', lv: 3 },
  { q: 'At the wedding, the audience knows Hero is innocent but Claudio does not. What is this called?', a: 'dramatic irony', w: ['a soliloquy', 'an aside', 'a prologue'], hint: 'The audience knows more than a character.', ex: 'Dramatic irony makes the scene painful to watch.', lv: 2 },
  { q: 'Which theme is shown most clearly by Benedick saying "The world must be peopled"?', a: 'love and marriage: he finds an excuse to change his mind', w: ['war and violence', 'loyalty to the prince', 'jealousy'], hint: 'What has he just decided to do?', ex: 'Having been tricked into thinking Beatrice loves him, he jokingly justifies marrying after all.', lv: 3 },
  { q: 'How does the play present appearance versus reality?', a: 'Characters are repeatedly fooled by what they see and hear, like Claudio at the window.', w: ['Everyone always sees the truth clearly.', 'Only the servants are ever deceived.', 'The play has no disguises or tricks.'], hint: 'Masks, hiding, overhearing...', ex: 'Masks at the ball, the window trick and the veiled bride all show that appearances can mislead.', lv: 4 },
  { q: 'Claudio calls Hero a "jewel" and later a "rotten orange". What do both images suggest about how he sees her?', a: 'He sees her as an object to be valued or rejected, not as a person.', w: ['He sees her as his equal.', 'He thinks she is clever.', 'He is talking about food and money only.'], hint: 'Jewels and oranges are both things.', ex: 'Both metaphors turn Hero into a possession with a value.', lv: 5 },
  { q: 'Which genre is Much Ado About Nothing?', a: 'comedy', w: ['tragedy', 'history', 'Gothic novel'], hint: 'How does it end?', ex: 'It ends in marriages and a dance: a comedy, though it has dark moments.', lv: 1 },
]

// =====================================================================================================
// Romeo and Juliet
// =====================================================================================================

const RJ_PLOT = [
  'A street brawl breaks out between the Montagues and Capulets.',
  'Romeo meets Juliet at the Capulets\' feast.',
  'Romeo and Juliet declare their love in the balcony scene.',
  'Friar Laurence secretly marries Romeo and Juliet.',
  'Tybalt kills Mercutio.',
  'Romeo kills Tybalt and is banished to Mantua.',
  'Lord Capulet arranges for Juliet to marry Paris.',
  'Friar Laurence gives Juliet a potion to make her seem dead.',
  'Romeo hears that Juliet is dead and buys poison.',
  'Romeo kills Paris at the tomb and then poisons himself.',
  'Juliet wakes, finds Romeo dead and stabs herself.',
  'The Montagues and Capulets are reconciled.',
]

const RJ_CAST: Pair[] = [
  { left: 'Romeo', right: 'the son of Lord and Lady Montague', lv: 1 },
  { left: 'Juliet', right: 'the daughter of Lord and Lady Capulet', lv: 1 },
  { left: 'Tybalt', right: 'Juliet\'s hot-tempered cousin', lv: 1 },
  { left: 'Mercutio', right: 'Romeo\'s witty friend, a relative of the Prince', lv: 2 },
  { left: 'Benvolio', right: 'Romeo\'s cousin, who tries to keep the peace', lv: 2 },
  { left: 'Friar Laurence', right: 'the priest who marries the lovers in secret', lv: 1 },
  { left: 'the Nurse', right: 'Juliet\'s chatty servant and confidante', lv: 1 },
  { left: 'Paris', right: 'the nobleman Lord Capulet wants Juliet to marry', lv: 2 },
  { left: 'Prince Escalus', right: 'the ruler of Verona, who banishes Romeo', lv: 3 },
]

const RJ_QUOTES: Quote[] = [
  { line: 'But soft, what light through yonder window breaks? It is the east, and Juliet is the sun.', who: 'Romeo', ctx: 'Romeo in the balcony scene, using a metaphor for Juliet.', lv: 1 },
  { line: 'O Romeo, Romeo, wherefore art thou Romeo?', who: 'Juliet', ctx: 'Juliet on her balcony, wishing Romeo were not a Montague.', lv: 1 },
  { line: 'A plague o\' both your houses!', who: 'Mercutio', ctx: 'Mercutio, dying, curses both families.', lv: 2 },
  { line: 'Parting is such sweet sorrow.', who: 'Juliet', ctx: 'Juliet saying goodnight in the balcony scene (an oxymoron).', lv: 2 },
  { line: 'My only love sprung from my only hate!', who: 'Juliet', ctx: 'Juliet discovers Romeo is a Montague.', lv: 3 },
  { line: 'O, I am fortune\'s fool!', who: 'Romeo', ctx: 'Romeo after killing Tybalt, blaming fate.', lv: 3 },
  { line: 'Thus with a kiss I die.', who: 'Romeo', ctx: 'Romeo\'s last words in the tomb.', lv: 2 },
  { line: 'What, drawn, and talk of peace? I hate the word, / As I hate hell, all Montagues, and thee.', who: 'Tybalt', ctx: 'Tybalt to Benvolio in the opening brawl.', lv: 3 },
  { line: 'Ask for me tomorrow, and you shall find me a grave man.', who: 'Mercutio', ctx: 'Mercutio jokes (a pun on "grave") even as he dies.', lv: 4 },
  { line: 'These violent delights have violent ends.', who: 'Friar Laurence', ctx: 'The Friar warns Romeo before the wedding.', lv: 4 },
  { line: 'Wisely and slow; they stumble that run fast.', who: 'Friar Laurence', ctx: 'The Friar advises Romeo not to rush.', lv: 4 },
  { line: 'Did my heart love till now? Forswear it, sight! / For I ne\'er saw true beauty till this night.', who: 'Romeo', ctx: 'Romeo on first seeing Juliet at the feast.', lv: 3 },
]
const RJ_SPEAKERS = ['Romeo', 'Juliet', 'Mercutio', 'Tybalt', 'Friar Laurence', 'the Nurse', 'Benvolio']

const RJ_MC: MC[] = [
  { q: 'Where is Romeo and Juliet set?', a: 'Verona', w: ['Messina', 'Venice', 'Athens'], hint: 'A city in northern Italy.', ex: 'The play is set in Verona (with Romeo banished to Mantua).', lv: 1 },
  { q: 'The Prologue calls Romeo and Juliet "star-cross\'d lovers". What does this suggest?', a: 'Fate is against them, so their love is doomed.', w: ['They met while stargazing.', 'They will become famous.', 'They argue all the time.'], hint: 'Stars were linked with fate.', ex: '"Star-cross\'d" means fate (the stars) is against them.', lv: 2 },
  { q: 'What form is the Prologue of Romeo and Juliet written in?', a: 'a sonnet', w: ['a limerick', 'free verse', 'prose'], hint: 'Count the lines: 14.', ex: 'The Prologue is a fourteen-line sonnet, the traditional form for love poetry.', lv: 3 },
  { q: 'Why does the Prologue tell us at the start that the lovers will die?', a: 'So the audience watches with dramatic irony, knowing the tragic ending.', w: ['Because Shakespeare forgot to include it later.', 'To make the play a comedy.', 'So the audience can leave early.'], hint: 'How does knowing the ending change how we watch?', ex: 'We know what the characters do not, so every hopeful moment feels tragic.', lv: 4 },
  { q: 'Why does Romeo not receive Friar Laurence\'s letter explaining the plan?', a: 'Friar John, who was meant to deliver it, is held up by a plague quarantine.', w: ['The Nurse loses it.', 'Tybalt steals it.', 'Romeo refuses to read it.'], hint: 'Disease plays a part.', ex: 'Friar John is shut in a house suspected of plague, so the letter never arrives.', lv: 4 },
  { q: 'Which is a key theme of Romeo and Juliet?', a: 'love and hate', w: ['shipwreck and magic', 'ambition and witchcraft', 'mistaken identity and twins'], hint: '"My only love sprung from my only hate!"', ex: 'The play sets intense love against the families\' hatred; fate is another key theme.', lv: 1 },
  { q: 'Why does Romeo refuse to fight Tybalt at first?', a: 'He has just secretly married Juliet, so Tybalt is now his relative.', w: ['He is afraid of Tybalt.', 'He has no sword.', 'The Prince has ordered him not to.'], hint: 'What has just happened that Tybalt does not know about?', ex: 'Romeo is now related to Tybalt by marriage, which no one else knows - dramatic irony.', lv: 3 },
]

// =====================================================================================================
// A Midsummer Night's Dream
// =====================================================================================================

const MSND_PLOT = [
  'Egeus asks Theseus to force Hermia to marry Demetrius.',
  'Hermia and Lysander plan to run away through the wood.',
  'Oberon and Titania quarrel over a changeling boy.',
  'Puck puts the love potion on Lysander\'s eyes by mistake.',
  'Bottom is given an ass\'s head and Titania falls in love with him.',
  'Oberon releases Titania from the spell and the lovers are correctly paired.',
  'Theseus overrules Egeus and three couples marry.',
  'The mechanicals perform "Pyramus and Thisbe" at the wedding celebrations.',
]

const MSND_CAST: Pair[] = [
  { left: 'Oberon', right: 'King of the Fairies', lv: 1 },
  { left: 'Titania', right: 'Queen of the Fairies', lv: 1 },
  { left: 'Puck', right: 'Oberon\'s mischievous servant, also called Robin Goodfellow', lv: 1 },
  { left: 'Bottom', right: 'a weaver whose head is turned into an ass\'s head', lv: 1 },
  { left: 'Hermia', right: 'a young woman who loves Lysander against her father\'s wishes', lv: 2 },
  { left: 'Helena', right: 'a young woman who loves Demetrius', lv: 2 },
  { left: 'Theseus', right: 'the Duke of Athens', lv: 2 },
  { left: 'Egeus', right: 'Hermia\'s father, who wants her to marry Demetrius', lv: 3 },
  { left: 'Peter Quince', right: 'the carpenter who directs the mechanicals\' play', lv: 4 },
]

const MSND_QUOTES: Quote[] = [
  { line: 'The course of true love never did run smooth.', who: 'Lysander', ctx: 'Lysander to Hermia, about the obstacles facing lovers.', lv: 1 },
  { line: 'Lord, what fools these mortals be!', who: 'Puck', ctx: 'Puck laughing at the lovers\' confusion.', lv: 1 },
  { line: 'Though she be but little, she is fierce.', who: 'Helena', ctx: 'Helena describing Hermia during their quarrel.', lv: 2 },
  { line: 'I\'ll put a girdle round about the earth / In forty minutes.', who: 'Puck', ctx: 'Puck boasting how fast he can fetch the flower.', lv: 3 },
  { line: 'Ill met by moonlight, proud Titania.', who: 'Oberon', ctx: 'Oberon meeting Titania in the wood.', lv: 3 },
  { line: 'If we shadows have offended, / Think but this, and all is mended.', who: 'Puck', ctx: 'Puck\'s epilogue to the audience.', lv: 3 },
]
const MSND_SPEAKERS = ['Lysander', 'Puck', 'Helena', 'Oberon', 'Hermia', 'Bottom', 'Titania']

const MSND_MC: MC[] = [
  { q: 'Where is A Midsummer Night\'s Dream mainly set?', a: 'Athens and a wood nearby', w: ['Verona', 'a Scottish castle', 'a desert island'], hint: 'Theseus is Duke of this city.', ex: 'It moves between Athens (order) and the magical wood (chaos).', lv: 1 },
  { q: 'What does the juice of the flower "love-in-idleness" do?', a: 'It makes a sleeper fall in love with the first creature they see on waking.', w: ['It turns people into animals.', 'It makes people invisible.', 'It sends people to sleep forever.'], hint: 'Oberon uses it on Titania.', ex: 'The love potion causes the chaos in the wood.', lv: 1 },
  { q: 'Why does Puck put the love potion on the wrong Athenian?', a: 'Oberon told him to look for a man in Athenian clothes, and Lysander was also dressed that way.', w: ['He wanted Lysander to suffer.', 'Titania told him to.', 'He could not see in the dark at all.'], hint: 'Oberon\'s description was not precise.', ex: 'Oberon meant Demetrius, but the only clue was "Athenian garments".', lv: 3 },
  { q: 'What play do the mechanicals perform for the wedding?', a: '"Pyramus and Thisbe"', w: ['"Romeo and Juliet"', '"The Murder of Gonzago"', '"The Tempest"'], hint: 'A tragic love story they turn into comedy.', ex: 'Their clumsy "Pyramus and Thisbe" is comically bad.', lv: 2 },
  { q: 'Which character does Bottom play in the mechanicals\' play?', a: 'Pyramus', w: ['Thisbe', 'Wall', 'Lion'], hint: 'He wants the leading role (and every other role!).', ex: 'Bottom plays Pyramus, the hero; Flute plays Thisbe.', lv: 3 },
  { q: 'Which genre is A Midsummer Night\'s Dream?', a: 'comedy', w: ['tragedy', 'history', 'Gothic'], hint: 'How does it end?', ex: 'It ends in marriages and celebration: a comedy.', lv: 1 },
]

// =====================================================================================================
// The Tempest
// =====================================================================================================

const TEMPEST_PLOT = [
  'Prospero raises a storm and the ship carrying his enemies is wrecked.',
  'Prospero tells Miranda how they came to the island.',
  'Ferdinand meets Miranda and they fall in love.',
  'Antonio and Sebastian plot to kill Alonso.',
  'Caliban, Stephano and Trinculo plot against Prospero.',
  'Ariel, disguised as a harpy, accuses Alonso, Antonio and Sebastian of their crimes.',
  'Prospero forgives his enemies and gives up his magic.',
  'Prospero sets Ariel free.',
]

const TEMPEST_CAST: Pair[] = [
  { left: 'Prospero', right: 'the rightful Duke of Milan, now a magician on the island', lv: 1 },
  { left: 'Miranda', right: 'Prospero\'s daughter, who has grown up on the island', lv: 1 },
  { left: 'Ariel', right: 'a spirit who serves Prospero in return for his freedom', lv: 1 },
  { left: 'Caliban', right: 'the son of the witch Sycorax, forced to serve Prospero', lv: 2 },
  { left: 'Ferdinand', right: 'the son of the King of Naples, who falls in love with Miranda', lv: 2 },
  { left: 'Antonio', right: 'Prospero\'s brother, who stole his dukedom', lv: 2 },
  { left: 'Alonso', right: 'the King of Naples', lv: 3 },
  { left: 'Gonzalo', right: 'the kind old counsellor who helped Prospero long ago', lv: 3 },
  { left: 'Stephano', right: 'a drunken butler', lv: 3 },
  { left: 'Trinculo', right: 'a jester', lv: 4 },
]

const TEMPEST_QUOTES: Quote[] = [
  { line: 'O brave new world / That has such people in\'t!', who: 'Miranda', ctx: 'Miranda, amazed at seeing so many people for the first time.', lv: 1 },
  { line: 'We are such stuff / As dreams are made on.', who: 'Prospero', ctx: 'Prospero reflecting that life is brief and dreamlike.', lv: 2 },
  { line: 'Full fathom five thy father lies.', who: 'Ariel', ctx: 'Ariel\'s song to Ferdinand about his "drowned" father.', lv: 3 },
  { line: 'This thing of darkness I / Acknowledge mine.', who: 'Prospero', ctx: 'Prospero accepting responsibility for Caliban at the end.', lv: 4 },
  { line: 'Be not afeard; the isle is full of noises.', who: 'Caliban', ctx: 'Caliban describing the island\'s music, beautifully.', lv: 3 },
  { line: 'You taught me language, and my profit on\'t / Is, I know how to curse.', who: 'Caliban', ctx: 'Caliban\'s bitter reply to Prospero and Miranda.', lv: 3 },
  { line: 'I\'ll drown my book.', who: 'Prospero', ctx: 'Prospero promising to give up his magic.', lv: 2 },
]
const TEMPEST_SPEAKERS = ['Prospero', 'Miranda', 'Ariel', 'Caliban', 'Ferdinand', 'Gonzalo']

const TEMPEST_MC: MC[] = [
  { q: 'How did Prospero and Miranda come to live on the island?', a: 'Prospero\'s brother Antonio stole his dukedom and they were set adrift at sea.', w: ['They were shipwrecked on holiday.', 'Prospero was banished for murder.', 'Miranda was born on the island to Sycorax.'], hint: 'Think about Antonio.', ex: 'Antonio, helped by Alonso, overthrew Prospero; they were cast adrift and reached the island.', lv: 2 },
  { q: 'Why does Prospero raise the tempest at the start of the play?', a: 'To bring his old enemies, who are sailing nearby, onto the island.', w: ['To punish Miranda.', 'To escape from the island.', 'To free Ariel.'], hint: 'Who is on the ship?', ex: 'The ship carries Alonso and Antonio; the storm brings them into his power.', lv: 2 },
  { q: 'What does Ariel want from Prospero?', a: 'freedom', w: ['money', 'to marry Miranda', 'to become Duke of Milan'], hint: 'Ariel is serving a term.', ex: 'Ariel serves Prospero in return for being freed, which happens at the end.', lv: 1 },
  { q: 'How does The Tempest end?', a: 'Prospero forgives his enemies, gives up his magic and frees Ariel.', w: ['Prospero takes revenge and kills Antonio.', 'Miranda stays on the island alone.', 'Caliban becomes Duke of Milan.'], hint: 'Mercy rather than revenge.', ex: 'The play ends with forgiveness, reconciliation and a planned return to Milan.', lv: 2 },
  { q: 'Which is a key theme of The Tempest?', a: 'power and forgiveness', w: ['ambition and witches', 'feuding families', 'mistaken twins'], hint: 'Prospero controls everyone, then chooses mercy.', ex: 'Power (over the island and others), freedom and forgiveness are central themes.', lv: 3 },
]

// =====================================================================================================
// Macbeth (Year 9)
// =====================================================================================================

const MACBETH_PLOT = [
  'Three witches greet Macbeth and predict he will be king.',
  'Macbeth is made Thane of Cawdor.',
  'Lady Macbeth persuades Macbeth to kill King Duncan.',
  'Macbeth murders Duncan, and Duncan\'s sons flee.',
  'Macbeth is crowned king.',
  'Macbeth has Banquo murdered, but Fleance escapes.',
  'Banquo\'s ghost appears at the banquet.',
  'The witches show Macbeth apparitions with new prophecies.',
  'Macduff\'s wife and children are murdered.',
  'Lady Macbeth sleepwalks, haunted by guilt.',
  'Malcolm\'s army advances carrying branches from Birnam Wood.',
  'Macduff kills Macbeth and Malcolm becomes king.',
]

const MACBETH_CAST: Pair[] = [
  { left: 'Macbeth', right: 'Thane of Glamis, later Thane of Cawdor and king', lv: 1 },
  { left: 'Lady Macbeth', right: 'Macbeth\'s wife, who urges him to murder', lv: 1 },
  { left: 'Duncan', right: 'the King of Scotland at the start of the play', lv: 1 },
  { left: 'Banquo', right: 'Macbeth\'s fellow general; the witches say his descendants will be kings', lv: 2 },
  { left: 'Macduff', right: 'the Thane of Fife, who kills Macbeth', lv: 2 },
  { left: 'Malcolm', right: 'Duncan\'s elder son, who becomes king at the end', lv: 2 },
  { left: 'Fleance', right: 'Banquo\'s son, who escapes the murderers', lv: 3 },
  { left: 'Donalbain', right: 'Duncan\'s younger son, who flees to Ireland', lv: 4 },
]

const MACBETH_QUOTES: Quote[] = [
  { line: 'Fair is foul, and foul is fair.', who: 'the witches', ctx: 'The witches\' chant in Act 1, Scene 1: nothing is what it seems.', lv: 1 },
  { line: 'Is this a dagger which I see before me?', who: 'Macbeth', ctx: 'Macbeth sees a vision of a dagger before killing Duncan.', lv: 1 },
  { line: 'Look like th\' innocent flower, / But be the serpent under\'t.', who: 'Lady Macbeth', ctx: 'Lady Macbeth tells Macbeth to hide his intentions.', lv: 2 },
  { line: 'Double, double toil and trouble.', who: 'the witches', ctx: 'The witches\' spell around their cauldron.', lv: 1 },
  { line: 'Will all great Neptune\'s ocean wash this blood / Clean from my hand?', who: 'Macbeth', ctx: 'Macbeth\'s guilt straight after the murder.', lv: 3 },
  { line: 'A little water clears us of this deed.', who: 'Lady Macbeth', ctx: 'Lady Macbeth dismisses guilt after the murder.', lv: 3 },
  { line: 'Stars, hide your fires; / Let not light see my black and deep desires.', who: 'Macbeth', ctx: 'Macbeth in an aside, hiding his ambition.', lv: 3 },
  { line: 'O, full of scorpions is my mind, dear wife!', who: 'Macbeth', ctx: 'Macbeth\'s torment as king.', lv: 4 },
  { line: 'What\'s done cannot be undone.', who: 'Lady Macbeth', ctx: 'Lady Macbeth sleepwalking, haunted by guilt.', lv: 4 },
  { line: 'Out, out, brief candle!', who: 'Macbeth', ctx: 'Macbeth after hearing of his wife\'s death: life is short and meaningless.', lv: 4 },
  { line: 'By the pricking of my thumbs, / Something wicked this way comes.', who: 'the witches', ctx: 'The Second Witch senses Macbeth approaching.', lv: 3 },
  { line: 'So foul and fair a day I have not seen.', who: 'Macbeth', ctx: 'Macbeth\'s first line, echoing the witches.', lv: 5 },
]
const MACBETH_SPEAKERS = ['Macbeth', 'Lady Macbeth', 'the witches', 'Banquo', 'Macduff', 'Duncan']

const MACBETH_MC: MC[] = [
  { q: 'Where is Macbeth set?', a: 'Scotland', w: ['Denmark', 'Italy', 'Wales'], hint: 'Duncan is its king.', ex: 'Macbeth is set in Scotland (with some scenes in England).', lv: 1 },
  { q: 'What do the witches predict for Banquo?', a: 'His descendants will be kings, though he will not be.', w: ['He will be king himself.', 'He will kill Macbeth.', 'He will become Thane of Cawdor.'], hint: '"Thou shalt get kings, though thou be none."', ex: 'They say his children will be kings, which makes Macbeth see him as a threat.', lv: 2 },
  { q: 'Which flaw (hamartia) leads to Macbeth\'s downfall?', a: 'ambition', w: ['jealousy', 'laziness', 'cowardice'], hint: '"Vaulting ambition..."', ex: 'His ambition drives him to murder and tyranny.', lv: 2 },
  { q: 'An apparition tells Macbeth that "none of woman born" shall harm him. Why does this prophecy not protect him?', a: 'Macduff was "from his mother\'s womb untimely ripp\'d" - born by an early, surgical delivery.', w: ['Macduff is a ghost.', 'The witches take it back.', 'Lady Macbeth kills him.'], hint: 'Think about how Macduff was born.', ex: 'Macduff was not "born" in the usual way, so the prophecy has a trick in it.', lv: 4 },
  { q: 'How is the prophecy about Birnam Wood fulfilled?', a: 'Malcolm\'s soldiers cut branches from the wood to hide their numbers as they march.', w: ['A storm blows the trees over.', 'The witches move the forest by magic.', 'Macbeth burns the wood.'], hint: 'It "comes" to Dunsinane.', ex: 'The soldiers carry branches as camouflage, so the wood seems to move.', lv: 3 },
  { q: 'How does Lady Macbeth change during the play?', a: 'She starts out fearless and ruthless but ends up tormented by guilt.', w: ['She starts out guilty and becomes ruthless.', 'She never changes.', 'She becomes queen of England.'], hint: 'Compare "A little water clears us of this deed" with her sleepwalking.', ex: 'Her early confidence collapses into guilt and madness.', lv: 3 },
  { q: 'Which genre is Macbeth?', a: 'tragedy', w: ['comedy', 'history', 'romance'], hint: 'How does it end for the title character?', ex: 'A tragic hero falls because of his flaw and dies.', lv: 1 },
]

// =====================================================================================================
// Comedy and tragedy (Year 9)
// =====================================================================================================

const GENRE_TERMS: Term[] = [
  { term: 'tragic hero', def: 'a high-status main character whose flaw leads to their downfall', lv: 2 },
  { term: 'hamartia', def: 'the fatal flaw or error that causes a tragic hero\'s downfall', lv: 3 },
  { term: 'catharsis', def: 'the release of emotion (such as pity and fear) the audience feels at the end of a tragedy', lv: 4 },
  { term: 'mistaken identity', def: 'when one character is taken for another, a common comic device', lv: 2 },
  { term: 'hubris', def: 'excessive pride that offends the gods or the natural order', lv: 4 },
  { term: 'malapropism', def: 'using a similar-sounding but wrong word, often comically', lv: 4 },
]

const PLAY_GENRE: Example[] = [
  { text: 'Much Ado About Nothing', a: 'comedy', why: 'It ends in marriages and a dance.', lv: 1 },
  { text: 'A Midsummer Night\'s Dream', a: 'comedy', why: 'Confusion in love ends in three weddings.', lv: 1 },
  { text: 'Romeo and Juliet', a: 'tragedy', why: 'It ends with the deaths of the lovers.', lv: 1 },
  { text: 'Macbeth', a: 'tragedy', why: 'The hero\'s ambition leads to his downfall and death.', lv: 1 },
  { text: 'Hamlet', a: 'tragedy', why: 'It ends with the deaths of Hamlet and most of the royal family.', lv: 2 },
  { text: 'Twelfth Night', a: 'comedy', why: 'Disguise and mistaken identity end in marriages.', lv: 3 },
  { text: 'Henry V', a: 'history', why: 'It dramatises the reign of a real English king.', lv: 3 },
  { text: 'King Lear', a: 'tragedy', why: 'A king\'s misjudgement leads to suffering and death.', lv: 3 },
  { text: 'Richard III', a: 'history', why: 'It dramatises the reign of a real English king.', lv: 4 },
  { text: 'The Merchant of Venice', a: 'comedy', why: 'It is classed as a comedy (it ends with marriages), though it has dark elements.', lv: 4 },
  { text: 'Othello', a: 'tragedy', why: 'Jealousy leads the hero to destroy the person he loves.', lv: 3 },
]

const GENRE_MC: MC[] = [
  { q: 'Which is a typical feature of a Shakespearean comedy?', a: 'It ends with one or more marriages.', w: [{ label: 'It ends with the death of the main character.', feedback: 'That is a tragedy.' }, { label: 'It tells the story of an English king\'s reign.', feedback: 'That is a history play.' }, { label: 'It has no jokes at all.', feedback: 'Comedies are full of wit and wordplay.' }], hint: 'Think of how Much Ado ends.', ex: 'Comedies end happily, usually with marriages.', lv: 1 },
  { q: 'Which is a typical feature of a Shakespearean tragedy?', a: 'A high-status hero with a fatal flaw falls and dies.', w: [{ label: 'Lovers are united in marriage at the end.', feedback: 'That is a comedy.' }, { label: 'Characters are disguised as twins and all ends well.', feedback: 'That is comedy.' }, { label: 'It is always set in a magical wood.', feedback: 'Not a convention of tragedy.' }], hint: 'Think of Macbeth.', ex: 'Tragedy shows the downfall of a great figure through a flaw.', lv: 1 },
  { q: 'Which of these is a comic device used in both Much Ado About Nothing and A Midsummer Night\'s Dream?', a: 'Characters are tricked or confused about who loves whom.', w: ['A king is murdered.', 'Ghosts appear at a banquet.', 'The lovers die at the end.'], hint: 'Think of the orchard scene and the love potion.', ex: 'Misunderstanding and trickery in love drive both comedies.', lv: 3 },
  { q: 'Much Ado About Nothing includes a false accusation, a public shaming and a pretended death. Why is it still a comedy?', a: 'The truth comes out, the lovers are reunited and it ends in marriages.', w: ['Because nobody is upset at any point.', 'Because it is set in Italy.', 'Because there are no villains.'], hint: 'What matters is how it ends.', ex: 'Comedies can have dark moments; what defines them is the happy resolution.', lv: 4 },
  { q: 'Dogberry says "Comparisons are odorous" when he means "odious". What is this comic device?', a: 'malapropism', w: ['dramatic irony', 'soliloquy', 'hamartia'], hint: 'A wrong word that sounds like the right one.', ex: 'A malapropism is a comic misuse of a similar-sounding word.', lv: 3 },
  { q: 'Why might Romeo and Juliet start like a comedy and end as a tragedy?', a: 'It has jokes, young love and a secret wedding, but fate and the feud bring it to a deadly end.', w: ['Shakespeare changed his mind halfway through writing it.', 'Because it has no comic characters.', 'Because it ends in marriages.'], hint: 'Mercutio\'s death is a turning point.', ex: 'The first half has comic elements; after Mercutio dies, tragedy takes over.', lv: 5 },
]

// =====================================================================================================
// Written answers
// =====================================================================================================

const DRAMA_TASKS = {
  muchAdo: [
    {
      prompt: 'How does Shakespeare present Beatrice as different from other women in Much Ado About Nothing?',
      model: 'Shakespeare presents Beatrice as witty, outspoken and independent, unlike the quiet Hero. She mocks love, saying "I had rather hear my dog bark at a crow than a man swear he loves me", which shows she refuses to play the role of an eager bride. She wins battles of words with the men in a "merry war". When Hero is shamed, she cries "O that I were a man!", showing her anger and her frustration that women could not act for themselves.',
      checklist: ['Makes a clear point about Beatrice', 'Uses a quotation', 'Compares her with Hero or other women', 'Explains what the quotation shows', 'Refers to the context (expectations of women)'],
    },
    {
      prompt: 'How is deception used in Much Ado About Nothing, both for good and for harm?',
      model: 'Deception drives the whole plot. Some tricks are kind: Don Pedro, Claudio and Leonato let Benedick overhear that Beatrice loves him, and Hero and Ursula do the same to Beatrice, which brings the two together. Other deception is cruel: Don John, a "plain-dealing villain", arranges for Claudio to see Margaret at Hero\'s window, leading to Hero being shamed. Even the Friar uses deception, pretending Hero is dead, to put things right.',
      checklist: ['Gives an example of good deception', 'Gives an example of harmful deception', 'Names the characters involved', 'Uses a quotation or close reference', 'Makes a point about what the play suggests'],
    },
    {
      prompt: 'How does Claudio\'s treatment of Hero show the importance of honour and reputation in the play?',
      model: 'Claudio\'s treatment of Hero shows that a woman\'s reputation was everything. When he believes she is unfaithful, he does not speak to her privately but shames her publicly at the altar, calling her a "rotten orange". This suggests he cares more about his own honour than about her. Even her father, Leonato, believes the accusation, which shows how quickly a woman\'s good name could be destroyed.',
      checklist: ['Makes a clear point about honour or reputation', 'Uses a quotation', 'Explains Claudio\'s actions', 'Mentions another character\'s reaction (e.g. Leonato)'],
    },
  ],
  macbeth: [
    {
      prompt: 'How does Shakespeare present Lady Macbeth as powerful in Act 1, and how does she change by Act 5?',
      model: 'In Act 1 Lady Macbeth is powerful and ruthless. She tells Macbeth to "Look like th\' innocent flower, / But be the serpent under\'t", showing she controls him and is willing to deceive. After the murder she claims "A little water clears us of this deed", dismissing guilt. However, by Act 5 she is sleepwalking and saying "What\'s done cannot be undone", which shows guilt has destroyed her.',
      checklist: ['Describes her in Act 1 with a quotation', 'Describes her later in the play with a quotation', 'Explains how and why she changes', 'Uses an analytical word such as "suggests" or "shows"'],
    },
  ],
}

export const dramaGenerators: ItemGenerator[] = [
  termMatchGen('drama.terms-match', 'drama.conventions', [1, 4], DRAMA_TERMS, 'Match each drama term to its meaning.'),
  termChoiceGen('drama.terms-define', 'drama.conventions', [1, 4], DRAMA_TERMS, 'drama term'),
  classifyGen('drama.conventions-spot', 'drama.conventions', [2, 5], {
    rows: CONVENTION_EX,
    cats: Object.fromEntries(DRAMA_TERMS.map((t) => [t.term, `${t.term.charAt(0).toUpperCase()}${t.term.slice(1)}: ${t.def}.`])),
    prompt: (e) => `Which dramatic technique is this?\n${e.text}`,
    hint: 'Who can hear it? Who knows what? Is anyone else on stage?',
  }),
  bankGen('shakespeare.life', 'drama.shakespeare-life', [1, 5], LIFE),
  pairMatchGen('shakespeare.old-words', 'drama.shakespeare-language', [1, 4], OLD_WORDS, 'Match each word from Shakespeare\'s time to its modern meaning.', 'Try each one in a sentence: "Thou art my friend."'),
  bankGen('shakespeare.language', 'drama.shakespeare-language', [1, 5], LANG_QS),
  sequenceGen('muchado.plot-order', 'drama.much-ado-plot', [2, 5], [{ name: 'Much Ado About Nothing', steps: MUCH_ADO_PLOT }]),
  bankGen('muchado.plot', 'drama.much-ado-plot', [1, 5], MUCH_ADO_PLOT_MC),
  pairMatchGen('muchado.cast', 'drama.much-ado-characters', [1, 4], MUCH_ADO_CAST, 'Match each character in Much Ado About Nothing to their description.', 'Start with the characters you know best: Beatrice, Benedick, Dogberry.'),
  bankGen('muchado.characters', 'drama.much-ado-characters', [1, 5], MUCH_ADO_CHAR_MC),
  whoSaidGen('muchado.who-said', 'drama.much-ado-themes', [2, 5], MUCH_ADO_QUOTES, MUCH_ADO_SPEAKERS, 'Much Ado About Nothing'),
  bankGen('muchado.themes', 'drama.much-ado-themes', [1, 5], MUCH_ADO_THEMES),
  revealGen('muchado.written', 'drama.much-ado-themes', [3, 5], DRAMA_TASKS.muchAdo),
  sequenceGen('romeo.plot-order', 'drama.romeo-juliet', [2, 5], [{ name: 'Romeo and Juliet', steps: RJ_PLOT }]),
  pairMatchGen('romeo.cast', 'drama.romeo-juliet', [1, 4], RJ_CAST, 'Match each character in Romeo and Juliet to their description.', 'Montague or Capulet? Friend or family?'),
  whoSaidGen('romeo.who-said', 'drama.romeo-juliet', [1, 5], RJ_QUOTES, RJ_SPEAKERS, 'Romeo and Juliet'),
  bankGen('romeo.facts', 'drama.romeo-juliet', [1, 5], RJ_MC),
  sequenceGen('midsummer.plot-order', 'drama.midsummer', [2, 5], [{ name: 'A Midsummer Night\'s Dream', steps: MSND_PLOT }]),
  pairMatchGen('midsummer.cast', 'drama.midsummer', [1, 4], MSND_CAST, 'Match each character in A Midsummer Night\'s Dream to their description.', 'Fairies, lovers, or mechanicals?'),
  whoSaidGen('midsummer.who-said', 'drama.midsummer', [1, 4], MSND_QUOTES, MSND_SPEAKERS, 'A Midsummer Night\'s Dream'),
  bankGen('midsummer.facts', 'drama.midsummer', [1, 4], MSND_MC),
  sequenceGen('tempest.plot-order', 'drama.tempest', [2, 5], [{ name: 'The Tempest', steps: TEMPEST_PLOT }]),
  pairMatchGen('tempest.cast', 'drama.tempest', [1, 4], TEMPEST_CAST, 'Match each character in The Tempest to their description.', 'Who lives on the island, and who arrives on the ship?'),
  whoSaidGen('tempest.who-said', 'drama.tempest', [1, 4], TEMPEST_QUOTES, TEMPEST_SPEAKERS, 'The Tempest'),
  bankGen('tempest.facts', 'drama.tempest', [1, 4], TEMPEST_MC),
  sequenceGen('macbeth.plot-order', 'drama.macbeth', [2, 5], [{ name: 'Macbeth', steps: MACBETH_PLOT }]),
  pairMatchGen('macbeth.cast', 'drama.macbeth', [1, 4], MACBETH_CAST, 'Match each character in Macbeth to their description.', 'Who rules, who plots, who takes revenge?'),
  whoSaidGen('macbeth.who-said', 'drama.macbeth', [1, 5], MACBETH_QUOTES, MACBETH_SPEAKERS, 'Macbeth'),
  bankGen('macbeth.facts', 'drama.macbeth', [1, 5], MACBETH_MC),
  revealGen('macbeth.written', 'drama.macbeth', [4, 5], DRAMA_TASKS.macbeth),
  classifyGen('genres.which', 'drama.genres', [1, 4], {
    rows: PLAY_GENRE,
    cats: { comedy: 'Comedies end happily, usually in marriage.', tragedy: 'Tragedies end in the downfall and death of the hero.', history: 'History plays dramatise the reigns of English kings.' },
    prompt: (e) => `Which genre is Shakespeare's ${e.text}?`,
    hint: 'How does it end?',
    keepOrder: true,
  }),
  bankGen('genres.conventions', 'drama.genres', [1, 5], GENRE_MC),
  termMatchGen('genres.terms', 'drama.genres', [2, 5], GENRE_TERMS, 'Match each term to its meaning.'),
]
