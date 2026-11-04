import type { ItemGenerator } from '@/engine/registry'
import { choice, passage } from '../kit'
import { commas, err, factGenerators, G, num, pickN, text, type FactSet } from './helpers'

// =====================================================================================================================
// Online safety and digital footprint
// =====================================================================================================================

const safetyFacts: FactSet = {
  skill: 'cyber.online-safety',
  termNoun: 'term',
  terms: [
    { term: 'Digital footprint', def: 'The trail of information about you that builds up online from what you and others post, share and search', hint: 'Like footprints left behind you in the sand.', typed: ['footprint', 'digital footprints'] },
    { term: 'Privacy settings', def: 'Options on an app or website that control who can see your posts and personal information', hint: 'You can usually find them in an app\'s settings menu.', typed: ['privacy setting'] },
    { term: 'Cyberbullying', def: 'Using technology, such as messages or social media, to repeatedly upset, threaten or embarrass someone', hint: 'Bullying, but online.', typed: ['cyber bullying', 'cyber-bullying', 'online bullying'] },
    { term: 'Personal information', def: 'Details that could identify you or help someone find you, such as your full name, address, school or phone number', hint: 'Information about your person.', typed: ['personal data', 'personal details'] },
    { term: 'Location services', def: 'A setting that lets apps know where your device is, and can reveal where you are in posts and photos', hint: 'GPS on your phone.', typed: ['location sharing', 'location settings'] },
  ],
  facts: [
    {
      lv: [1, 3],
      q: 'Someone you only know online asks for your home address so they can send you a present. What should you do?',
      a: 'Not share it, and tell a trusted adult',
      wrong: [
        { label: 'Share it, because they seem friendly', feedback: 'People online may not be who they say they are. Never share your address with someone you only know online.' },
        { label: 'Share just your street name and school', feedback: 'That is still enough to find you.' },
        { label: 'Send it in a private message so no one else sees', feedback: 'A private message still gives the information to someone you do not really know.' },
      ],
      hint: 'You cannot be sure who someone really is online.',
      exp: 'Never give personal information such as your address to someone you only know online. Tell a trusted adult (a parent, carer or teacher) about requests like this.',
    },
    {
      lv: [2, 4],
      q: 'Maya receives nasty messages from someone in a group chat. Which is the best first response?',
      a: 'Do not reply, save the messages as evidence, block the person and tell a trusted adult',
      wrong: [
        { label: 'Reply with something nasty back', feedback: 'Replying can make things worse and get you into trouble too.' },
        { label: 'Delete everything and tell no one', feedback: 'Keeping evidence and telling someone helps stop it.' },
        { label: 'Leave the internet for good', feedback: 'You should not have to; there are better ways to deal with it.' },
      ],
      hint: 'Think: don\'t respond, keep a record, stop contact, get help.',
      exp: 'Don\'t reply, keep evidence (screenshots), block and report the person on the app, and talk to a trusted adult.',
    },
    {
      lv: [2, 4],
      q: 'Why should you think carefully before posting a photo online, even if you delete it later?',
      a: 'Others may already have copied or shared it, so it can stay online for good',
      wrong: [
        { label: 'Deleted photos are always kept on your phone', feedback: 'The problem is copies made by other people.' },
        { label: 'Photos make your device run slowly', feedback: 'Speed is not the issue.' },
        { label: 'Photos cannot be deleted from social media', feedback: 'You can delete your post, but not other people\'s copies.' },
      ],
      hint: 'Screenshots.',
      exp: 'Once something is posted, people can screenshot, save and share it. It becomes part of your digital footprint, which future schools or employers might see.',
    },
    {
      lv: [3, 5],
      q: 'Which username is the safest choice for an online game?',
      a: 'PurpleComet88',
      wrong: [
        { label: 'SamHillsideSchool', feedback: 'It contains a real first name and a school name: personal information.' },
        { label: 'Sam_Jones_Leeds', feedback: 'It gives a full name and a town.' },
        { label: 'SamAge13', feedback: 'It gives a real name and an age.' },
      ],
      hint: 'Which one gives away nothing about who or where you are?',
      exp: 'A good username gives no clues to your real name, age, school or location.',
    },
  ],
  written: [
    {
      q: 'Explain what a digital footprint is and give two ways to keep yours positive and safe.',
      model: 'A digital footprint is the trail of information about you that builds up online from everything you post, share, like and search, and from what others post about you. It can be very hard to remove. To keep it positive, think before you post anything, because it might be seen by future schools or employers. To keep it safe, use privacy settings so only friends can see your posts, and avoid sharing personal information such as your address or school.',
      checklist: ['Explains a digital footprint as the information about you left online', 'Says it can be permanent or hard to remove', 'Gives one sensible way to keep it positive or safe', 'Gives a second, different way'],
    },
  ],
}

// =====================================================================================================================
// Passwords and two-factor authentication
// =====================================================================================================================

const WEAK: { pw: string; why: string }[] = [
  { pw: 'password123', why: 'It is one of the most common passwords, so it is guessed straight away.' },
  { pw: 'sam2012', why: 'A name and a year are easy to guess for anyone who knows you.' },
  { pw: 'qwerty', why: 'It is just a row of keys on the keyboard, and very common.' },
  { pw: 'Fluffy', why: 'A pet\'s name is easy to find out, and it is short.' },
  { pw: '12345678', why: 'It is a simple sequence, one of the first that attackers try.' },
  { pw: 'football', why: 'A single dictionary word is quickly found by a dictionary attack.' },
  { pw: 'Hillside1', why: 'A school or street name plus a digit is easy to guess.' },
  { pw: 'abc123', why: 'It is short and very common.' },
]
const WORDS3 = ['Purple', 'Tiger', 'Rocket', 'Cactus', 'Violin', 'Puddle', 'Lantern', 'Pebble', 'Walrus', 'Teapot', 'Glacier', 'Mango']
const SYMS = ['!', '?', '#', '%', '*']

const strongest = G('cyber.passwords.strongest', 'cyber.passwords', [1, 4], (rng) => {
  const [a, b, c] = pickN(rng, WORDS3, 3)
  const strong = `${a}-${b}-${c}${rng.int(10, 99)}${rng.pick(SYMS)}`
  const weak = pickN(rng, WEAK, 3)
  return choice({
    rng,
    prompt: 'Which is the strongest password?',
    correct: strong,
    wrong: weak.map((w) => ({ label: w.pw, misconception: 'weak-password', feedback: w.why })),
    hint: 'Longer is stronger, especially with a mix of character types and nothing personal or common.',
    explanation: `${strong} is long (${strong.length} characters), mixes capitals, lower case, numbers and symbols, and is made of three random words, so it is easy to remember but very hard to guess.`,
  })
})

const combos = G('cyber.passwords.combinations', 'cyber.passwords', [3, 5], (rng, d) => {
  if (d <= 3) {
    const n = rng.int(3, 6)
    return num({
      prompt: `A PIN is made of ${n} digits, each from 0 to 9. How many different PINs are possible?`,
      answer: 10 ** n,
      suffix: 'PINs',
      hint: 'Each digit has 10 choices, and the choices multiply.',
      explanation: `10 choices for each of ${n} digits: 10^{${n}} = ${commas(10 ** n)}. Each extra digit makes it 10 times harder to guess by trying every one.`,
      errors: [err(10 * n, 'added', `Multiply the choices together (10 × 10 × ...), do not do 10 × ${n}.`), err(9 ** n, 'nine-digits', 'There are 10 digits: 0 to 9.')],
    })
  }
  const n = rng.int(3, 5)
  const set = rng.pick([26, 52, 62])
  const desc = set === 26 ? 'lower-case letters only (26 choices each)' : set === 52 ? 'upper- and lower-case letters (52 choices each)' : 'upper- and lower-case letters and digits (62 choices each)'
  return num({
    prompt: `A password is exactly ${n} characters long, using ${desc}. How many different passwords are possible?`,
    answer: set ** n,
    hint: 'Multiply the number of choices for each character together.',
    explanation: `${set}^{${n}} = ${commas(set ** n)}. Using more types of character, and more characters, makes the number of possibilities grow very quickly, which makes a brute force attack slower.`,
    errors: [err(set * n, 'added', `Multiply ${set} by itself ${n} times, not ${set} × ${n}.`)],
  })
})

const pwFacts: FactSet = {
  skill: 'cyber.passwords',
  termNoun: 'term',
  terms: [
    { term: 'Two-factor authentication', def: 'Logging in needs two different kinds of proof, such as a password and a code sent to your phone', hint: 'Two "factors".', typed: ['2fa', 'two factor authentication', 'two-step verification', 'multi-factor authentication'] },
    { term: 'Brute force attack', def: 'Trying every possible password, one after another, until the right one is found', hint: 'Using force, not cleverness.', typed: ['brute force', 'brute-force attack'] },
    { term: 'Password manager', def: 'An app that securely stores a different strong password for each of your accounts', hint: 'It "manages" your passwords for you.', typed: ['password managers'] },
    { term: 'Biometrics', def: 'Using a part of your body, such as a fingerprint or face, to prove who you are', hint: '"Bio" means life.', typed: ['biometric', 'biometric authentication'] },
    { term: 'Authentication', def: 'Proving that you are who you say you are', hint: 'Showing you are "authentic".', typed: ['authenticate'] },
  ],
  facts: [
    {
      lv: [2, 4],
      q: 'Why should you use a different password for each account?',
      a: 'If one website is hacked, the same password cannot be used to get into your other accounts',
      wrong: [
        { label: 'Websites do not allow the same password twice', feedback: 'They usually cannot tell; the risk is to you.' },
        { label: 'It makes your internet connection faster', feedback: 'Passwords do not affect speed.' },
        { label: 'So you can forget the old ones', feedback: 'The reason is security.' },
      ],
      hint: 'Imagine one of your passwords is leaked.',
      exp: 'Attackers try leaked passwords on other sites. Different passwords (perhaps kept in a password manager) stop one leak unlocking everything.',
    },
    {
      lv: [3, 5],
      q: 'An attacker has stolen Maya\'s password, but her account uses two-factor authentication. Why can they still not log in?',
      a: 'They also need the second factor, such as the code sent to her phone',
      wrong: [
        { label: 'Two-factor authentication changes the password every day', feedback: 'It adds a second check; it does not change the password.' },
        { label: 'Two-factor authentication encrypts the password so it cannot be stolen', feedback: 'The password was stolen anyway; the second factor is what stops them.' },
        { label: 'They can log in: two-factor authentication only works on phones', feedback: 'It works on all sorts of accounts.' },
      ],
      hint: 'What is the second "factor"?',
      exp: 'Two-factor authentication needs something you know (password) and something you have (like your phone) or are. A stolen password alone is not enough.',
    },
  ],
  written: [
    {
      q: 'Explain how to make a strong password, and why two-factor authentication makes an account more secure.',
      model: 'A strong password is long, for example at least 12 characters, and mixes upper- and lower-case letters, numbers and symbols. It should not contain personal details like your name, birthday or pet\'s name, or common words, and a different one should be used for each account. Three random words joined together are long but easy to remember. Two-factor authentication means you also need a second proof, such as a code sent to your phone, so even if someone steals your password they still cannot log in.',
      checklist: ['Says a strong password is long', 'Mentions a mix of character types', 'Says to avoid personal details or common words', 'Explains two-factor authentication needs a second proof', 'Explains a stolen password is then not enough on its own'],
      passMark: 3,
    },
  ],
}

// =====================================================================================================================
// Phishing and social engineering
// =====================================================================================================================

const PHISH_SIGNS = [
  'It says your account will be closed within 24 hours unless you act now',
  'It asks you to reply with your password',
  'It starts "Dear Customer" instead of using your name',
  'The sender\'s address is a strange mix of letters and numbers',
  'The link\'s real address does not match the company\'s website',
  'It says you have won a prize for a competition you never entered',
  'It has several spelling and grammar mistakes',
]
const NOT_SIGNS = ['It was sent on a weekday', 'It is written in a blue font', 'It is fewer than 100 words long', 'It arrived in the morning', 'It has a short subject line']

const phishSign = G('cyber.phishing.sign', 'cyber.phishing', [1, 3], (rng) => {
  const sign = rng.pick(PHISH_SIGNS)
  return choice({
    rng,
    prompt: 'Maya receives an email that claims to be from her bank. Which of these is a warning sign that it could be phishing?',
    correct: sign,
    wrong: pickN(rng, NOT_SIGNS, 3).map((x) => ({ label: x, feedback: 'That tells you nothing about whether the email is genuine.' })),
    hint: 'Phishing emails try to rush you, scare you, or get your details.',
    explanation: `"${sign}" is a typical phishing trick. Real organisations will not pressure you like this or ask for your password by email.`,
  })
})

const BANKS = ['BrightBank', 'Northfield Savings', 'StarPay']
const phishEmail = G('cyber.phishing.email', 'cyber.phishing', [2, 5], (rng, d) => {
  const bank = rng.pick(BANKS)
  const hours = rng.pick([12, 24, 48])
  const email = [
    `From: ${bank} Securty Team <alerts${rng.int(100, 999)}@${bank.toLowerCase().replace(/ /g, '')}-account-check.biz>`,
    `Subject: URGENT: your account is locked`,
    '',
    'Dear Customer,',
    '',
    `We have detected unusual activity on you're account. To stop your account being closed, you must confirm your details within ${hours} hours.`,
    '',
    'Click here to verify your password and card number: www.secure-login-update.biz',
    '',
    `Thank you, the ${bank} Team`,
  ].join('\n')
  const fig = passage(email, { title: 'An email in Maya\'s inbox (made up for this question)' })
  if (d >= 4) {
    return choice({
      rng,
      prompt: 'What is the best thing for Maya to do with this email?',
      figure: fig,
      correct: `Not click the link, and check with ${bank} using its official website or phone number`,
      wrong: [
        { label: 'Click the link quickly before the account is closed', misconception: 'urgency', feedback: 'The time pressure is a trick to stop you thinking.' },
        { label: 'Reply asking whether the email is genuine', feedback: 'The reply would go to the scammers, who will say it is real.' },
        { label: 'Forward it to her friends to warn them', feedback: 'Forwarding spreads the dangerous link. Report it instead.' },
      ],
      hint: 'Contact the real organisation in a way you already trust.',
      explanation: 'Do not click links or reply. Contact the organisation through its official website or phone number, report the email as phishing, and delete it.',
    })
  }
  const clues = [
    'It creates urgency: the account will be closed unless she acts quickly',
    'It asks for her password and card number',
    'It says "Dear Customer" instead of her name',
    'The sender\'s email address and the link do not belong to the bank\'s real website',
    'It contains spelling and grammar mistakes',
  ]
  const clue = rng.pick(clues)
  return choice({
    rng,
    prompt: 'Which clue in this email suggests it is a phishing attempt?',
    figure: fig,
    correct: clue,
    wrong: [
      { label: 'It has a subject line', feedback: 'Every email has a subject line.' },
      { label: 'It mentions the name of a bank', feedback: 'Real bank emails mention the bank too, so this alone proves nothing.' },
      { label: 'It ends with "Thank you"', feedback: 'Politeness is not a warning sign.' },
    ],
    hint: 'Look for pressure, requests for secret details, a generic greeting, odd addresses and mistakes.',
    explanation: `${clue}. Other clues: ${clues.filter((c) => c !== clue).map((c) => c.charAt(0).toLowerCase() + c.slice(1)).join('; ')}.`,
  })
})

const phishFacts: FactSet = {
  skill: 'cyber.phishing',
  termNoun: 'term',
  terms: [
    { term: 'Phishing', def: 'Fake emails pretending to be from a trusted organisation, trying to trick you into giving away details or clicking a link', hint: 'It sounds like "fishing" for information.', typed: ['phishing attack', 'phishing email'] },
    { term: 'Social engineering', def: 'Tricking people, rather than attacking computers, to get information or access', hint: 'It targets humans.', typed: ['social-engineering'] },
    { term: 'Shoulder surfing', def: 'Watching someone type their password or PIN, for example over their shoulder', hint: 'Looking over a shoulder.', typed: ['shouldering', 'shoulder-surfing'] },
    { term: 'Blagging', def: 'Making up a story, such as pretending to be from IT support, to persuade someone to give information', hint: 'Also called pretexting.', typed: ['pretexting'] },
    { term: 'Smishing', def: 'Phishing using text (SMS) messages', hint: 'SMS + phishing.', typed: ['sms phishing'] },
  ],
  written: [
    {
      q: 'Describe two ways to spot a phishing email, and say what you should do if you receive one.',
      model: 'One sign is that the email puts you under pressure, for example saying your account will be closed unless you act within 24 hours. Another is that it asks for personal details such as your password, which real organisations never ask for by email; it may also use a general greeting like "Dear Customer" or have a sender address that does not match the company. If you get one, do not click any links or reply. Report it, delete it, and contact the real organisation using its official website or phone number if you are worried.',
      checklist: ['Gives a first clear warning sign', 'Gives a second, different warning sign', 'Says not to click links, open attachments or reply', 'Says to report it, delete it, or check with the real organisation another way'],
    },
  ],
}

// =====================================================================================================================
// Malware
// =====================================================================================================================

type Mal = 'Virus' | 'Worm' | 'Trojan' | 'Ransomware' | 'Spyware' | 'Adware'
const MAL_SCENARIOS: [string, Mal][] = [
  ['A free game Maya downloaded looks fine, but secretly lets an attacker control her computer.', 'Trojan'],
  ['All of a company\'s files are suddenly scrambled, and a message demands payment to unlock them.', 'Ransomware'],
  ['A program secretly records every key pressed and sends it to a criminal.', 'Spyware'],
  ['A program copies itself across a school network from computer to computer, with nobody opening anything.', 'Worm'],
  ['A program attaches itself to a document and spreads when the document is shared and opened.', 'Virus'],
  ['Pop-up adverts keep appearing on a laptop after some free software was installed.', 'Adware'],
]
const MAL_DEF: Record<Mal, string> = {
  Virus: 'A virus attaches itself to a file or program and spreads when that file is run or shared.',
  Worm: 'A worm copies itself and spreads across networks on its own, without a user opening a file.',
  Trojan: 'A trojan pretends to be useful software to trick you into installing it.',
  Ransomware: 'Ransomware encrypts your files and demands payment to unlock them.',
  Spyware: 'Spyware secretly collects information, such as what you type, and sends it to someone else.',
  Adware: 'Adware shows unwanted adverts.',
}
const malScenario = G('cyber.malware.scenario', 'cyber.malware', [2, 5], (rng) => {
  const [s, m] = rng.pick(MAL_SCENARIOS)
  const others = pickN(rng, (Object.keys(MAL_DEF) as Mal[]).filter((x) => x !== m), 3)
  return choice({
    rng,
    prompt: `Which type of malware is this most likely to be? ${s}`,
    correct: m,
    wrong: others.map((x) => ({ label: x, misconception: `malware-${x.toLowerCase()}`, feedback: MAL_DEF[x] })),
    hint: 'How did it get there, and what is it doing?',
    explanation: MAL_DEF[m],
  })
})

const malFacts: FactSet = {
  skill: 'cyber.malware',
  termNoun: 'type of malware',
  terms: [
    { term: 'Virus', def: 'Malware that attaches itself to a file or program and spreads when that file is run or shared', hint: 'Like a cold, it needs something to "infect".', typed: ['viruses', 'computer virus'] },
    { term: 'Worm', def: 'Malware that copies itself and spreads across networks on its own, without anyone opening a file', hint: 'It wriggles through networks by itself.', typed: ['worms'] },
    { term: 'Trojan', def: 'Malware disguised as useful software to trick you into installing it', hint: 'Named after a wooden horse in a Greek story.', typed: ['trojan horse', 'trojans'] },
    { term: 'Ransomware', def: 'Malware that encrypts your files and demands payment to unlock them', hint: 'A ransom is money demanded to give something back.' },
    { term: 'Spyware', def: 'Malware that secretly collects information, such as what you type, and sends it to someone else', hint: 'It spies on you.' },
    { term: 'Adware', def: 'Software that shows you unwanted adverts', hint: 'Ads.' },
  ],
  facts: [
    {
      lv: [1, 3],
      q: 'What does the word "malware" mean?',
      a: 'Malicious software: any software designed to cause harm',
      wrong: [
        { label: 'Software that has been badly written by mistake', feedback: 'Malware is harmful on purpose.' },
        { label: 'Software that checks your computer for problems', feedback: 'That is anti-malware or utility software.' },
        { label: 'Hardware that has broken', feedback: 'Malware is software.' },
      ],
      hint: '"Mal" means bad.',
      exp: 'Malware is short for malicious software, which includes viruses, worms, trojans, ransomware, spyware and adware.',
    },
  ],
}

// =====================================================================================================================
// Protecting systems
// =====================================================================================================================

type Defence = 'Firewall' | 'Anti-malware software' | 'Encryption' | 'Backup' | 'Software updates' | 'User access levels'
const DEF_SCEN: [string, Defence][] = [
  ['A company wants to block unauthorised data coming in from the internet.', 'Firewall'],
  ['A school wants to detect and remove viruses already on its computers.', 'Anti-malware software'],
  ['A laptop holding patient records might be stolen, and the data must be unreadable to a thief.', 'Encryption'],
  ['A family wants to be able to get their photos back if ransomware scrambles them.', 'Backup'],
  ['A security hole has been found in a phone\'s operating system.', 'Software updates'],
  ['Pupils should be able to read files on the school network, but only teachers should be able to change them.', 'User access levels'],
]
const DEF_WHY: Record<Defence, string> = {
  Firewall: 'A firewall checks data coming into and going out of a network and blocks anything not allowed.',
  'Anti-malware software': 'Anti-malware software scans for known malware and removes or quarantines it.',
  Encryption: 'Encryption scrambles data so it cannot be understood without the key.',
  Backup: 'A backup is a separate copy of data that can be restored if the original is lost or damaged.',
  'Software updates': 'Updates (patches) fix security holes that attackers could use.',
  'User access levels': 'Access levels control what each user is allowed to see and change.',
}
const defScenario = G('cyber.protection.scenario', 'cyber.protection', [1, 4], (rng) => {
  const [s, dfn] = rng.pick(DEF_SCEN)
  const others = pickN(rng, (Object.keys(DEF_WHY) as Defence[]).filter((x) => x !== dfn), 3)
  return choice({
    rng,
    prompt: `Which protection is the best fit? ${s}`,
    correct: dfn,
    wrong: others.map((x) => ({ label: x, misconception: 'protection-choice', feedback: DEF_WHY[x] })),
    hint: 'What exactly is the threat, and which measure deals with that?',
    explanation: DEF_WHY[dfn],
  })
})

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const caesar = (s: string, k: number) => [...s].map((c) => { const i = ALPHA.indexOf(c); return i < 0 ? c : ALPHA[(i + k + 26) % 26] }).join('')
const CAESAR_WORDS = ['CODE', 'SECRET', 'BINARY', 'PIXEL', 'ROBOT', 'MOUSE', 'CABLE', 'LOGIC', 'PACKET', 'ZEBRA']
const caesarGen = G('cyber.protection.caesar', 'cyber.protection', [2, 5], (rng, d) => {
  const w = rng.pick(d <= 2 ? CAESAR_WORDS.filter((x) => !/[XYZ]/.test(x)) : CAESAR_WORDS)
  const k = rng.int(1, d <= 3 ? 3 : 5)
  const decrypt = d >= 4 && rng.chance(0.5)
  const enc = caesar(w, k)
  return text({
    prompt: decrypt ? `A Caesar cipher shifted each letter ${k} place${k > 1 ? 's' : ''} forward in the alphabet to make ${enc}. What was the original word?` : `Encrypt ${w} with a Caesar cipher that shifts each letter ${k} place${k > 1 ? 's' : ''} forward in the alphabet (Z wraps round to A).`,
    accept: [decrypt ? w : enc],
    placeholder: 'Type the word',
    hint: decrypt ? `Shift each letter ${k} place${k > 1 ? 's' : ''} BACK.` : `A becomes ${ALPHA[k]}, B becomes ${ALPHA[k + 1]}, and so on.`,
    explanation: `${w} shifted forward by ${k} is ${enc}. A Caesar cipher is a very simple kind of encryption; modern encryption uses far stronger mathematical methods.`,
  })
})

const protFacts: FactSet = {
  skill: 'cyber.protection',
  termNoun: 'protection',
  terms: [
    { term: 'Firewall', def: 'Checks data coming into and going out of a network, and blocks anything that is not allowed', hint: 'A barrier between a network and the outside world.', typed: ['a firewall'] },
    { term: 'Anti-malware software', def: 'Scans files for known malware and removes or quarantines it', hint: 'Antivirus is one kind.', typed: ['anti-malware', 'antivirus', 'anti-virus', 'antivirus software', 'anti-virus software'] },
    { term: 'Encryption', def: 'Scrambles data so that it cannot be understood without the key', hint: 'Secret codes.', typed: ['encrypting', 'encrypt'] },
    { term: 'Backup', def: 'A separate copy of data that can be restored if the original is lost or damaged', hint: 'A spare copy.', typed: ['backups', 'back up', 'back-up'] },
    { term: 'Software updates', def: 'Fixes (patches) for security holes that attackers could use', hint: 'Your phone asks you to install these.', typed: ['updates', 'patches', 'patch', 'software update'] },
    { term: 'User access levels', def: 'Settings that control what each user is allowed to see and change', hint: 'Who can do what.', typed: ['access levels', 'access rights', 'user access rights'] },
  ],
}

// =====================================================================================================================
// The law
// =====================================================================================================================

type Law = 'Computer Misuse Act' | 'Data Protection Act' | 'Copyright, Designs and Patents Act'
const LAW_SCEN: [string, Law][] = [
  ['Guessing a friend\'s password and logging into their account without permission.', 'Computer Misuse Act'],
  ['Writing and spreading a virus that damages other people\'s computers.', 'Computer Misuse Act'],
  ['Getting into the school network to change test results.', 'Computer Misuse Act'],
  ['A shop keeps customers\' personal details far longer than it needs to, and does not keep them secure.', 'Data Protection Act'],
  ['A company passes customers\' personal details to others without permission or a lawful reason.', 'Data Protection Act'],
  ['Maya asks a company to show her the personal data it holds about her.', 'Data Protection Act'],
  ['Sharing a copy of a new film online without the film company\'s permission.', 'Copyright, Designs and Patents Act'],
  ['Copying someone else\'s photograph onto a website and pretending it is your own.', 'Copyright, Designs and Patents Act'],
  ['Installing paid-for software on many computers when the licence only covers one.', 'Copyright, Designs and Patents Act'],
]
const LAW_WHY: Record<Law, string> = {
  'Computer Misuse Act': 'The Computer Misuse Act (1990) makes it illegal to access computer material without permission, or to do so in order to commit further crimes or to damage systems.',
  'Data Protection Act': 'The Data Protection Act (2018) controls how organisations collect, store and use personal data, and gives people rights over their data.',
  'Copyright, Designs and Patents Act': 'The Copyright, Designs and Patents Act (1988) protects creative work, such as music, films, software and images, from being copied without permission.',
}
const lawScenario = G('cyber.law.scenario', 'cyber.law', [1, 5], (rng) => {
  const [s, law] = rng.pick(LAW_SCEN)
  return choice({
    rng,
    prompt: `Which law is most relevant here? ${s}`,
    correct: law,
    wrong: (Object.keys(LAW_WHY) as Law[]).filter((x) => x !== law).map((x) => ({ label: x, misconception: 'law-choice', feedback: LAW_WHY[x] })),
    keepOrder: true,
    hint: 'Is it about getting into computers, about personal data, or about copying someone\'s work?',
    explanation: LAW_WHY[law],
  })
})

const lawFacts: FactSet = {
  skill: 'cyber.law',
  facts: [
    {
      lv: [2, 4],
      q: 'Under data protection law, which of these is a rule organisations must follow with personal data?',
      a: 'Keep it secure, and no longer than necessary',
      wrong: [
        { label: 'Keep it forever in case it is needed one day', feedback: 'Data should be kept no longer than necessary.' },
        { label: 'Share it with anyone who asks', feedback: 'Personal data must be kept secure and only used for its stated purpose.' },
        { label: 'Collect as much as possible about everyone', feedback: 'Organisations should only collect what they need.' },
      ],
      hint: 'Think about what you would want a company to do with your details.',
      exp: 'Data must be used fairly and lawfully, for a stated purpose, kept accurate, kept no longer than needed, and kept secure. People have the right to see the data held about them.',
    },
    {
      lv: [3, 5],
      q: 'Under the Computer Misuse Act, is it an offence to log into someone else\'s account without permission, even if you do not change anything?',
      a: 'Yes: accessing a computer system without permission is itself an offence',
      wrong: [
        { label: 'No: it is only illegal if you delete or change something', misconception: 'cma-only-damage', feedback: 'Unauthorised access on its own is an offence.' },
        { label: 'No: it is only illegal if you are an adult', feedback: 'The law applies whatever your age (though how it is dealt with may differ).' },
        { label: 'Only if the account belongs to a company', feedback: 'It applies to anyone\'s account.' },
      ],
      hint: 'The first offence in the act is about access, not damage.',
      exp: 'The Computer Misuse Act makes unauthorised access an offence. Doing it to commit further crimes, or to damage systems, are more serious offences.',
    },
  ],
}

// =====================================================================================================================

export const cyberGenerators: ItemGenerator[] = [
  ...factGenerators(safetyFacts),
  strongest,
  combos,
  ...factGenerators(pwFacts),
  phishSign,
  phishEmail,
  ...factGenerators(phishFacts),
  malScenario,
  ...factGenerators(malFacts),
  defScenario,
  caesarGen,
  ...factGenerators(protFacts),
  lawScenario,
  ...factGenerators(lawFacts),
]
