import type { ItemGenerator } from '@/engine/registry'
import { choice, codeFigure } from '../kit'
import { at, factGenerators, G, num, pickN, text, type FactSet } from './helpers'

// =====================================================================================================================
// LAN, WAN and network hardware
// =====================================================================================================================

const lanFacts: FactSet = {
  skill: 'net.lan-wan',
  termNoun: 'term',
  terms: [
    { term: 'LAN (local area network)', def: 'A network covering a small area, such as one school or home, where the hardware is usually owned by the organisation', hint: '"Local".', typed: ['lan', 'local area network'] },
    { term: 'WAN (wide area network)', def: 'A network covering a large geographical area, often connecting LANs, usually using cables and links owned by other companies', hint: '"Wide".', typed: ['wan', 'wide area network'] },
    { term: 'Router', def: 'Sends data between different networks, for example between a home network and the internet', hint: 'It finds a route.', typed: ['a router'] },
    { term: 'Switch', def: 'Connects devices within a LAN and sends data only to the device it is meant for', hint: 'Found in the middle of a star network.', typed: ['network switch', 'a switch'] },
    { term: 'NIC (network interface card)', def: 'The hardware inside a device that lets it connect to a network', hint: 'Every networked device has one, wired or wireless.', typed: ['nic', 'network interface card', 'network card'] },
    { term: 'Wireless access point', def: 'Lets devices join a wired network using Wi-Fi', hint: 'It is the "point" where wireless devices get access.', typed: ['wap', 'access point', 'wireless access point (wap)'] },
  ],
  facts: [
    {
      lv: [1, 3],
      q: 'What is the internet?',
      a: 'The world\'s largest WAN: a huge network of networks',
      wrong: [
        { label: 'A LAN inside a single building', misconception: 'internet-lan', feedback: 'The internet spans the whole world.' },
        { label: 'The same thing as the World Wide Web', misconception: 'internet-is-web', feedback: 'The web is a service that runs over the internet.' },
        { label: 'A program installed on your computer', feedback: 'The internet is a network of hardware and connections, not a program.' },
      ],
      hint: 'Inter-net: between networks.',
      exp: 'The internet connects millions of networks around the world, making it the biggest wide area network.',
    },
    {
      lv: [2, 4],
      q: 'A school connects all the computers in its buildings on one site. What kind of network is this?',
      a: 'A LAN',
      wrong: [
        { label: 'A WAN', misconception: 'lan-wan', feedback: 'One site is a small area, so it is local.' },
        { label: 'The World Wide Web', misconception: 'internet-is-web', feedback: 'The web is a collection of web pages.' },
        { label: 'A peer-to-peer search engine', feedback: 'That is not a type of network.' },
      ],
      hint: 'How big is the area covered?',
      exp: 'A network on a single site, with hardware owned by the school, is a local area network (LAN).',
    },
    {
      lv: [3, 5],
      q: 'A bank links its offices in London, Leeds and Glasgow. What kind of network is this, and why?',
      a: 'A WAN, because it covers a large geographical area',
      wrong: [
        { label: 'A LAN, because it belongs to one company', misconception: 'lan-wan', feedback: 'Ownership by one company does not make it a LAN; the area is what matters.' },
        { label: 'A LAN, because all the computers are in the UK', misconception: 'lan-wan', feedback: 'Across several cities is a wide area.' },
        { label: 'Neither: offices cannot be networked together', feedback: 'They can, using a WAN.' },
      ],
      hint: 'Think about the distances involved.',
      exp: 'Linking sites in different cities needs a wide area network, usually using connections rented from telecommunications companies.',
    },
  ],
}

// =====================================================================================================================
// Topologies
// =====================================================================================================================

const topoFacts: FactSet = {
  skill: 'net.topologies',
  termNoun: 'topology',
  termLevels: [1, 3],
  terms: [
    { term: 'Star topology', def: 'Every device has its own cable to a central switch', hint: 'Draw it: one device in the middle with lines going out to all the others.', typed: ['star'] },
    { term: 'Bus topology', def: 'All devices are connected to one main cable (the backbone), with a terminator at each end', hint: 'Like passengers along one route.', typed: ['bus'] },
    { term: 'Mesh topology', def: 'Devices are connected to many other devices, so data has several possible routes', hint: 'Like a net or web of connections.', typed: ['mesh'] },
    { term: 'Ring topology', def: 'Each device is connected to exactly two others, forming a closed loop that data travels around', hint: 'A circle of devices.', typed: ['ring'] },
  ],
  facts: [
    {
      lv: [1, 3],
      q: 'In a star network, one computer\'s cable is cut. What happens?',
      a: 'Only that computer loses its connection; the rest of the network still works',
      wrong: [
        { label: 'The whole network stops working', misconception: 'star-cable-all', feedback: 'That happens in a bus network if the backbone breaks, or in a star if the central switch fails.' },
        { label: 'All the computers slow down but stay connected', feedback: 'The others are not affected.' },
        { label: 'The data reroutes through another computer', misconception: 'star-as-mesh', feedback: 'That describes a mesh network.' },
      ],
      hint: 'Each device has its own cable to the centre.',
      exp: 'In a star topology each device has its own cable to the switch, so one broken cable only affects that device.',
    },
    {
      lv: [2, 4],
      q: 'What is the main weakness of a star topology?',
      a: 'If the central switch fails, the whole network goes down',
      wrong: [
        { label: 'If one cable breaks, every device is cut off', misconception: 'star-cable-all', feedback: 'Only the device on that cable is affected.' },
        { label: 'Data collisions happen on the single shared cable', misconception: 'star-as-bus', feedback: 'That is a problem with a bus topology.' },
        { label: 'Every device must be connected to every other device', misconception: 'star-as-mesh', feedback: 'That describes a full mesh.' },
      ],
      hint: 'Everything depends on the centre.',
      exp: 'All traffic goes through the central switch, so it is a single point of failure.',
    },
    {
      lv: [2, 4],
      q: 'What happens in a bus network if the main backbone cable breaks?',
      a: 'The network fails, because all data travels along that one cable',
      wrong: [
        { label: 'Only one device is cut off', misconception: 'bus-as-star', feedback: 'That would be one device\'s own cable in a star network.' },
        { label: 'Data simply takes another route', misconception: 'bus-as-mesh', feedback: 'There is only one route in a bus network.' },
        { label: 'The network speeds up', feedback: 'A broken backbone stops the network.' },
      ],
      hint: 'How many routes does data have in a bus network?',
      exp: 'All devices share the single backbone cable. If it breaks, data can no longer get through.',
    },
    {
      lv: [3, 5],
      q: 'Why is a mesh topology very reliable, and what is its main drawback?',
      a: 'Data can take another route if one link fails, but it needs a lot of cabling, so it is expensive',
      wrong: [
        { label: 'It uses only one cable, but that cable is expensive', misconception: 'mesh-as-bus', feedback: 'One shared cable describes a bus.' },
        { label: 'Everything goes through one central switch, which is costly', misconception: 'mesh-as-star', feedback: 'That describes a star.' },
        { label: 'It is reliable because it has no cables, but it is slow', feedback: 'Mesh networks can be wired or wireless; the point is many connections.' },
      ],
      hint: 'More connections means more routes, but also more...',
      exp: 'With many links between devices, data can be rerouted around a fault. All those links make it expensive to set up.',
    },
  ],
}

// =====================================================================================================================
// Client-server and peer-to-peer
// =====================================================================================================================

const csFacts: FactSet = {
  skill: 'net.client-server',
  termNoun: 'term',
  terms: [
    { term: 'Server', def: 'A computer that provides a service or resources, such as files or web pages, to other computers', hint: 'It "serves" others.', typed: ['a server'] },
    { term: 'Client', def: 'A computer that requests a service or resources from a server', hint: 'Like a customer in a shop.', typed: ['a client'] },
    { term: 'Client-server network', def: 'A network where central servers manage resources, security and backups for the client computers', hint: 'There is a clear "boss" computer.', typed: ['client server', 'client server network'] },
    { term: 'Peer-to-peer network', def: 'A network where all computers are equal and share resources directly, with no central server', hint: 'Peers are equals.', typed: ['peer to peer', 'p2p', 'peer-to-peer'] },
  ],
  facts: [
    {
      lv: [2, 4],
      q: 'Why do most schools use a client-server network?',
      a: 'Files, security and backups can be managed centrally on the servers',
      wrong: [
        { label: 'It is the cheapest option because no server is needed', misconception: 'cs-as-p2p', feedback: 'Client-server needs servers, which cost money. Peer-to-peer is cheaper.' },
        { label: 'Every computer is equal, so no one needs to manage it', misconception: 'cs-as-p2p', feedback: 'That describes peer-to-peer.' },
        { label: 'It works without any cables or Wi-Fi', feedback: 'Every network needs some connection.' },
      ],
      hint: 'Think about logging in to any computer and seeing your own files.',
      exp: 'Servers hold everyone\'s files and accounts, so pupils can log in anywhere, and staff can back up and secure everything in one place.',
    },
    {
      lv: [3, 5],
      q: 'Which is a disadvantage of a client-server network compared with peer-to-peer?',
      a: 'If the server fails, the clients may not be able to access their files',
      wrong: [
        { label: 'Each user has to back up their own computer', misconception: 'cs-as-p2p', feedback: 'That is a problem with peer-to-peer.' },
        { label: 'There is no central security', misconception: 'cs-as-p2p', feedback: 'Client-server has central security.' },
        { label: 'Clients can never access the internet', feedback: 'Client-server networks can include internet access.' },
      ],
      hint: 'What does everything depend on?',
      exp: 'Client-server networks rely on the server. They also cost more and need specialist staff. Peer-to-peer avoids the single server but has no central control.',
    },
    {
      lv: [1, 3],
      q: 'When you visit a website, which is the client and which is the server?',
      a: 'Your device is the client; the computer that stores the website is the server',
      wrong: [
        { label: 'Your device is the server; the website\'s computer is the client', misconception: 'client-server-swapped', feedback: 'It is the other way round: you request, it serves.' },
        { label: 'Both are servers', feedback: 'One requests (client) and one provides (server).' },
        { label: 'Your router is the server', feedback: 'The router just passes the data on.' },
      ],
      hint: 'Who asks, and who provides?',
      exp: 'Your browser (the client) requests the page; the web server sends it back.',
    },
  ],
}

// =====================================================================================================================
// Internet and the World Wide Web
// =====================================================================================================================

const wwwFacts: FactSet = {
  skill: 'net.internet-www',
  termNoun: 'term',
  terms: [
    { term: 'Internet', def: 'A worldwide network of interconnected computer networks', hint: 'The hardware and connections.', typed: ['the internet'] },
    { term: 'World Wide Web', def: 'A collection of linked web pages and websites that are accessed using the internet', hint: 'A service that runs over the internet.', typed: ['www', 'the web', 'web', 'the world wide web'] },
    { term: 'Web browser', def: 'An application used to request, display and move between web pages', hint: 'Chrome, Safari, Edge and Firefox are examples.', typed: ['browser', 'a web browser'] },
    { term: 'Web server', def: 'A computer that stores websites and sends pages to browsers when requested', hint: 'It serves web pages.', typed: ['a web server'] },
    { term: 'URL', def: 'The full address of a web page, such as https://www.example.com/news', hint: 'Uniform resource locator.', typed: ['web address', 'uniform resource locator'] },
    { term: 'Hyperlink', def: 'Text or an image on a web page that takes you to another page when clicked', hint: 'It "links" pages together.', typed: ['link', 'links', 'hyperlinks'] },
  ],
  facts: [
    {
      lv: [1, 4],
      q: 'What is the difference between the internet and the World Wide Web?',
      a: 'The internet is the network of connected computers; the web is a collection of web pages that uses it',
      wrong: [
        { label: 'There is no difference', misconception: 'internet-is-web', feedback: 'They are different: the web is one service that runs over the internet.' },
        { label: 'The web is the cables, and the internet is the web pages', misconception: 'internet-web-swapped', feedback: 'It is the other way round.' },
        { label: 'The internet is only for email, and the web is for everything else', feedback: 'The internet carries the web, email, video calls, games and more.' },
      ],
      hint: 'Which one is the hardware, and which one is the pages?',
      exp: 'The internet is the global network infrastructure. The World Wide Web is a service on top of it: websites and pages linked by hyperlinks.',
    },
    {
      lv: [2, 4],
      q: 'Which of these uses the internet but is NOT part of the World Wide Web?',
      a: 'Sending an email from an email app',
      wrong: [
        { label: 'Reading a news website in a browser', feedback: 'Websites are the web.' },
        { label: 'Clicking a hyperlink to another web page', feedback: 'Hyperlinks between pages are the heart of the web.' },
        { label: 'Searching for web pages with a search engine', feedback: 'That is finding web pages.' },
      ],
      hint: 'The web is about web pages.',
      exp: 'Email is a separate internet service with its own protocols. The web is web pages viewed in a browser.',
    },
  ],
}

const URLS: { url: string; domain: string; path: string; protocol: string }[] = [
  { url: 'https://www.example.com/sport/football', domain: 'www.example.com', path: '/sport/football', protocol: 'https' },
  { url: 'https://www.example.org/news/science.html', domain: 'www.example.org', path: '/news/science.html', protocol: 'https' },
  { url: 'http://www.example.net/games/index.html', domain: 'www.example.net', path: '/games/index.html', protocol: 'http' },
  { url: 'https://library.example.ac.uk/books/search', domain: 'library.example.ac.uk', path: '/books/search', protocol: 'https' },
]
const urlParts = G('net.internet-www.url', 'net.internet-www', [2, 5], (rng, d) => {
  const u = rng.pick(URLS)
  const ask = rng.pick(d <= 3 ? ['domain', 'protocol'] : ['domain', 'path'])
  const answer = ask === 'domain' ? u.domain : ask === 'protocol' ? u.protocol : u.path
  return text({
    prompt: `In the URL ${u.url}, what is the ${ask === 'domain' ? 'domain name' : ask === 'protocol' ? 'protocol' : 'path to the page on the server'}?`,
    accept: ask === 'protocol' ? [answer, `${answer}://`, answer.toUpperCase()] : ask === 'path' ? [answer, answer.replace(/^\//, '')] : [answer, answer.replace(/^www\./, '')],
    placeholder: 'Type it exactly',
    hint: 'A URL is protocol :// domain name / path.',
    explanation: `${u.url}: the protocol is ${u.protocol}, the domain name is ${u.domain}, and the path is ${u.path}.`,
  })
})

// =====================================================================================================================
// Search engines
// =====================================================================================================================

const searchFacts: FactSet = {
  skill: 'net.search-engines',
  termNoun: 'term',
  terms: [
    { term: 'Web crawler', def: 'A program that automatically visits web pages and follows their links to discover more pages', hint: 'Also called a spider.', typed: ['crawler', 'spider', 'web spider', 'bot'] },
    { term: 'Index', def: 'A huge database built by a search engine, recording which words appear on which pages', hint: 'Like the one at the back of a book.', typed: ['search index'] },
    { term: 'Ranking', def: 'Putting the matching pages in order of how useful and relevant they are likely to be', hint: 'Deciding who comes first.', typed: ['page ranking', 'ranking algorithm'] },
    { term: 'Keyword', def: 'A word typed into a search engine to describe what you are looking for', hint: 'The key words of your question.', typed: ['keywords', 'search term'] },
  ],
  facts: [
    {
      lv: [2, 4],
      q: 'When you search, why do results appear in less than a second?',
      a: 'The search engine looks up its index, which it built in advance, instead of searching every page live',
      wrong: [
        { label: 'It visits every website on the web at that moment', misconception: 'live-search', feedback: 'That would take far too long; crawling happens beforehand.' },
        { label: 'It only searches websites in your country', feedback: 'It searches its whole index.' },
        { label: 'It shows random pages', feedback: 'Results are ranked by relevance.' },
      ],
      hint: 'The hard work is done before you search.',
      exp: 'Crawlers have already visited pages and built an index. Searching the index is very fast.',
    },
    {
      lv: [2, 5],
      q: 'Maya wants pages containing the exact phrase "fetch decode execute". What should she type?',
      a: 'The phrase inside quotation marks',
      wrong: [
        { label: 'The phrase in capital letters', feedback: 'Most search engines ignore capital letters.' },
        { label: 'The phrase followed by an exclamation mark', feedback: 'Punctuation like ! does not force an exact match.' },
        { label: 'Each word on a separate search', feedback: 'That would not find the words together.' },
      ],
      hint: 'Speech marks keep words together.',
      exp: 'Putting a phrase in quotation marks tells most search engines to find those words together in that order.',
    },
    {
      lv: [3, 5],
      q: 'Which is the best way to check whether information found online is reliable?',
      a: 'Check who wrote it and compare it with other trustworthy sources',
      wrong: [
        { label: 'Trust it if it is the first search result', misconception: 'top-result-true', feedback: 'Ranking is not the same as accuracy, and some top results are adverts.' },
        { label: 'Trust it if the website looks professional', feedback: 'Anyone can make a smart-looking website.' },
        { label: 'Trust it if lots of people have shared it', feedback: 'False information is often shared widely.' },
      ],
      hint: 'Who says so, and does anyone else agree?',
      exp: 'Check the author or organisation, how recent it is, and whether other reliable sources say the same thing.',
    },
  ],
  sequences: [
    {
      lv: [2, 5],
      q: 'Put these steps in order, from how a search engine prepares to how it answers your search.',
      steps: ['Crawlers visit web pages and follow their links', 'The words on each page are recorded in the index', 'A user types keywords into the search box', 'Matching pages are found in the index', 'The matching pages are ranked and shown as results'],
      hint: 'The index has to exist before anyone can search it.',
      exp: 'Crawl, index, then (when someone searches) look up the keywords in the index, rank the matches and display them.',
    },
  ],
}

// =====================================================================================================================
// IP addresses and packets
// =====================================================================================================================

const ipValid = G('net.ip-packets.ip', 'net.ip-packets', [2, 5], (rng) => {
  const part = () => rng.int(0, 255)
  const good = `${rng.int(1, 223)}.${part()}.${part()}.${rng.int(1, 254)}`
  const bad = [
    { label: `${rng.int(1, 200)}.${rng.int(256, 300)}.${part()}.${part()}`, feedback: 'Each number in an IPv4 address must be from 0 to 255.' },
    { label: `${rng.int(1, 200)}.${part()}.${part()}`, feedback: 'An IPv4 address has four numbers, not three.' },
    { label: `${rng.int(1, 200)}.${part()}.${part()}.${part()}.${part()}`, feedback: 'An IPv4 address has exactly four numbers.' },
    { label: `${rng.int(1, 200)}-${part()}-${part()}-${part()}`, feedback: 'The numbers are separated by dots, not dashes.' },
  ]
  return choice({
    rng,
    prompt: 'Which of these is a valid IPv4 address?',
    correct: good,
    wrong: pickN(rng, bad, 3).map((b) => ({ ...b, misconception: 'ipv4-format' })),
    hint: 'IPv4: four numbers from 0 to 255, separated by dots.',
    explanation: `${good} is valid: four numbers, each from 0 to 255, separated by dots. Each number fits in 8 bits, so an IPv4 address is 32 bits.`,
  })
})

const ipBits = G('net.ip-packets.bits', 'net.ip-packets', [3, 5], (rng) => {
  const v6 = rng.chance(0.4)
  return num({
    prompt: v6 ? 'How many bits long is an IPv6 address?' : 'An IPv4 address is made of four numbers, each from 0 to 255. How many bits long is it?',
    answer: v6 ? 128 : 32,
    suffix: 'bits',
    hint: v6 ? 'It is four times the length of an IPv4 address (32 bits).' : 'How many bits are needed for 0 to 255? Then there are four of them.',
    explanation: v6 ? 'IPv6 addresses are 128 bits, giving vastly more addresses than IPv4\'s 32 bits.' : 'Each number from 0 to 255 needs 8 bits, and 4 × 8 = 32 bits.',
    errors: [{ values: [4], tag: 'parts-not-bits', message: 'That is the number of parts. Each part is 8 bits.' }],
  })
})

const ipFacts: FactSet = {
  skill: 'net.ip-packets',
  termNoun: 'term',
  terms: [
    { term: 'IP address', def: 'A number that identifies a device on a network, so data can be sent to it', hint: 'Like a postal address for a computer.', typed: ['ip', 'internet protocol address'] },
    { term: 'Packet', def: 'A small chunk of data sent across a network, with a header giving information such as where it is going', hint: 'Files are split up into these.', typed: ['packets', 'data packet'] },
    { term: 'Header', def: 'The part of a packet holding the sender\'s and receiver\'s IP addresses and the packet number', hint: 'It comes at the "head" of the packet.', typed: ['packet header'] },
    { term: 'Packet switching', def: 'Sending packets separately, possibly along different routes, and reassembling them at the destination', hint: 'Packets can "switch" routes.', typed: ['packet-switching'] },
    { term: 'MAC address', def: 'A unique address built into a device\'s network interface card when it is made', hint: 'It is fixed in the hardware.', typed: ['mac', 'media access control address'] },
  ],
  facts: [
    {
      lv: [2, 4],
      q: 'Why does each packet have a packet number in its header?',
      a: 'So the packets can be put back in the right order when they arrive',
      wrong: [
        { label: 'To show how many times the packet has been sent before', feedback: 'It shows its place in the message.' },
        { label: 'To tell the router how fast to send it', feedback: 'Routers decide routes from the destination address.' },
        { label: 'Because packets must all take the same route', misconception: 'same-route', feedback: 'Packets can take different routes; that is why they need numbers.' },
      ],
      hint: 'Packets may take different routes and arrive in a different order.',
      exp: 'Packets can arrive out of order. The receiving computer uses the packet numbers to reassemble the data, and can ask again for any that are missing.',
    },
    {
      lv: [3, 5],
      q: 'Why is data split into packets rather than sent as one big block?',
      a: 'Packets can take different routes to avoid busy or broken links, and only lost packets need resending',
      wrong: [
        { label: 'Packets make the data impossible to read, so it is secure', misconception: 'packets-encrypt', feedback: 'Splitting into packets does not encrypt data.' },
        { label: 'Large blocks of data cannot be stored on a computer', feedback: 'Computers store large files easily.' },
        { label: 'So that every packet goes through the same router', misconception: 'same-route', feedback: 'Packets can go different ways.' },
      ],
      hint: 'What if one link in the network is very busy?',
      exp: 'Small packets share the network fairly, can be routed around problems, and if one is lost only that packet is sent again.',
    },
  ],
  sequences: [
    {
      lv: [2, 5],
      q: 'Put the steps of sending a file across the internet in order.',
      steps: ['The file is split into packets', 'Each packet is given a header with addresses and a packet number', 'Routers send each packet on towards its destination', 'The packets arrive, possibly out of order', 'The packets are put back together in order using their numbers'],
      hint: 'The headers are added before the packets set off.',
      exp: 'Split, add headers, route each packet (perhaps by different paths), arrive, reassemble using the packet numbers.',
    },
  ],
  written: [
    {
      q: 'Describe how a photo is sent across the internet using packets.',
      model: 'The photo is broken up into small packets. Each packet has a header containing the sender\'s and receiver\'s IP addresses and a packet number. Routers send each packet towards its destination, and different packets may take different routes depending on how busy the network is. When they arrive, the packets are put back in the right order using their numbers, and any missing packets are requested again.',
      checklist: ['Says the photo is split into packets', 'Mentions a header with addresses', 'Mentions packet numbers', 'Says packets may take different routes', 'Says they are reassembled in order at the destination'],
      passMark: 3,
    },
  ],
}

// =====================================================================================================================
// Protocols and DNS
// =====================================================================================================================

const protoFacts: FactSet = {
  skill: 'net.protocols',
  termNoun: 'protocol',
  terms: [
    { term: 'HTTP', def: 'The protocol used to request and send web pages', hint: 'HyperText Transfer Protocol.', typed: ['hypertext transfer protocol'] },
    { term: 'HTTPS', def: 'The secure version of the web protocol, which encrypts data sent between the browser and the website', hint: 'The S stands for Secure.', typed: ['hypertext transfer protocol secure'] },
    { term: 'DNS', def: 'The system that looks up a domain name and finds the matching IP address', hint: 'Like a phone book for the internet.', typed: ['domain name system', 'domain name server'] },
    { term: 'SMTP', def: 'The protocol used to send emails', hint: 'Simple Mail Transfer Protocol.', typed: ['simple mail transfer protocol'] },
    { term: 'FTP', def: 'The protocol used to transfer files between computers', hint: 'File Transfer Protocol.', typed: ['file transfer protocol'] },
    { term: 'IMAP', def: 'A protocol for reading emails that are kept on the mail server', hint: 'Used to fetch mail, not to send it.', typed: ['internet message access protocol'] },
  ],
  facts: [
    {
      lv: [1, 3],
      q: 'What is a protocol?',
      a: 'A set of rules for how devices communicate',
      wrong: [
        { label: 'A type of network cable', feedback: 'A protocol is a set of rules, not hardware.' },
        { label: 'A program that removes viruses', feedback: 'That is anti-malware software.' },
        { label: 'The address of a website', feedback: 'That is a URL.' },
      ],
      hint: 'Both devices must follow the same ones to understand each other.',
      exp: 'A protocol is an agreed set of rules for communication, such as how data is formatted and sent.',
    },
    {
      lv: [2, 4],
      q: 'Why should you check for HTTPS (often shown with a padlock) before typing a password into a website?',
      a: 'HTTPS encrypts the data, so anyone intercepting it cannot read your password',
      wrong: [
        { label: 'HTTPS makes the page load faster', feedback: 'Speed is not the point; security is.' },
        { label: 'HTTPS guarantees the website is honest and not a scam', misconception: 'https-means-safe', feedback: 'Scam sites can use HTTPS too. It protects the data in transit, not the honesty of the site.' },
        { label: 'HTTPS stops the website from using cookies', feedback: 'HTTPS is about encryption, not cookies.' },
      ],
      hint: 'What does the S stand for, and what does it do?',
      exp: 'HTTPS encrypts the connection, so intercepted data is unreadable. It does not prove the site itself is trustworthy, so you still need to check the address.',
    },
  ],
  sequences: [
    {
      lv: [2, 5],
      q: 'You type a web address into your browser. Put these steps in order.',
      steps: ['The browser sends the domain name to a DNS server', 'The DNS server looks up the matching IP address', 'The IP address is sent back to the browser', 'The browser requests the page from the web server at that IP address', 'The web server sends the page and the browser displays it'],
      hint: 'The browser needs the IP address before it can contact the web server.',
      exp: 'DNS turns the domain name into an IP address first; then the browser can request the page using HTTP or HTTPS.',
    },
  ],
  written: [
    {
      q: 'Explain why the Domain Name System (DNS) is needed when you visit a website.',
      model: 'Computers on the internet find each other using IP addresses, which are long numbers that people find hard to remember. People prefer to use domain names, such as www.example.com. When you type a domain name, your computer asks a DNS server, which looks up the matching IP address and sends it back. Your browser can then contact the web server at that address.',
      checklist: ['Says computers use IP addresses to find each other', 'Says domain names are easier for people to remember', 'Says a DNS server looks up the IP address for the domain name', 'Says the browser then uses the IP address to contact the web server'],
    },
  ],
}

// =====================================================================================================================
// HTML
// =====================================================================================================================

const TITLES = ['My Hobbies', 'Year 8 Science Club', 'Cake Recipes', 'Space Facts', 'Football Results', 'Our School Trip']
const ITEMS = ['Swimming', 'Chess', 'Drawing', 'Coding', 'Netball', 'Guitar', 'Baking', 'Reading']

const htmlTitle = G('web.html-structure.title', 'web.html-structure', [1, 5], (rng, d) => {
  const t = rng.pick(TITLES)
  const h = rng.pick(TITLES.filter((x) => x !== t))
  const p = rng.pick(['Welcome to my page.', 'Here is what we did.', 'Read on to find out more.'])
  const code = ['<!DOCTYPE html>', '<html>', '<head>', `  <title>${t}</title>`, '</head>', '<body>', `  <h1>${h}</h1>`, `  <p>${p}</p>`, '</body>', '</html>'].join('\n')
  if (d >= 3 && rng.chance(0.5)) {
    return choice({
      rng,
      prompt: 'Look at this HTML. Where will the words in the <h1> tags appear?',
      figure: codeFigure(code, 'HTML'),
      correct: 'As a large heading at the top of the page',
      wrong: [
        { label: 'In the browser tab', misconception: 'title-vs-h1', feedback: 'The browser tab shows the <title>, which is in the <head>.' },
        { label: 'Nowhere: the <h1> is hidden', feedback: 'Content in the <body> is shown on the page.' },
        { label: 'As small print at the bottom', feedback: '<h1> is the biggest heading.' },
      ],
      hint: 'Is the <h1> in the <head> or the <body>?',
      explanation: `Everything in the <body> is shown on the page. <h1> is the top-level (largest) heading, so "${h}" appears as a big heading. The <title>, "${t}", appears in the browser tab.`,
    })
  }
  return text({
    prompt: 'Look at this HTML. What text appears in the browser tab?',
    figure: codeFigure(code, 'HTML'),
    accept: [t],
    placeholder: 'Type the text',
    hint: 'The text in the tab is not shown on the page itself. Look inside the <head>.',
    explanation: `The <title> element, inside the <head>, sets the text in the browser tab: "${t}". The <h1> ("${h}") is the heading shown on the page.`,
  })
})

const htmlClosing = G('web.html-structure.closing', 'web.html-structure', [2, 5], (rng) => {
  const lines = ['<html>', '<head>', `  <title>${rng.pick(TITLES)}</title>`, '</head>', '<body>', `  <h1>${rng.pick(TITLES)}</h1>`, `  <p>${rng.pick(['I like coding.', 'This is my page.', 'Hello!'])}</p>`, '</body>', '</html>']
  const breakable = [2, 5, 6]
  const i = rng.pick(breakable)
  const broken = at(lines, i).replace(/<\/(\w+)>$/, '')
  const out = [...lines]
  out[i] = broken
  const tag = /<\/(\w+)>$/.exec(at(lines, i))?.[1] ?? ''
  return num({
    prompt: 'One line of this HTML is missing its closing tag. Which line number is it?',
    figure: codeFigure(out.map((l, k) => `${String(k + 1).padStart(2, ' ')}  ${l}`).join('\n'), 'HTML'),
    answer: i + 1,
    prefix: 'Line',
    hint: 'Most tags come in pairs: <p> ... </p>. The closing tag has a forward slash.',
    explanation: `Line ${i + 1} opens <${tag}> but never closes it. It should end with </${tag}>.`,
  })
})

const structFacts: FactSet = {
  skill: 'web.html-structure',
  termNoun: 'HTML tag',
  terms: [
    { term: '<html>', def: 'Wraps the whole web page', hint: 'The outermost tag of all.' },
    { term: '<head>', def: 'Holds information about the page, such as its title, which is not shown in the main page area', hint: 'It comes before the body.' },
    { term: '<title>', def: 'Sets the text shown in the browser tab', hint: 'Look at the top of your browser window.' },
    { term: '<body>', def: 'Holds all the content shown on the page itself', hint: 'The main part of the page.' },
    { term: '<!DOCTYPE html>', def: 'The first line, which tells the browser the page is written in HTML5', hint: 'It is not really a tag, and has no closing partner.' },
  ],
  facts: [
    {
      lv: [1, 3],
      q: 'What does HTML stand for?',
      a: 'HyperText Markup Language',
      wrong: [
        { label: 'High Tech Modern Language', feedback: 'HTML is a "markup" language.' },
        { label: 'HyperText Machine Learning', feedback: 'Close, but ML is "Markup Language".' },
        { label: 'Home Tool Markup Language', feedback: 'The H stands for HyperText.' },
      ],
      hint: 'Hypertext is text with links in it.',
      exp: 'HTML is HyperText Markup Language: it marks up text with tags to describe the structure of a web page.',
    },
    {
      lv: [2, 4],
      q: 'Which is the correct closing tag for a paragraph?',
      a: '</p>',
      wrong: [
        { label: '<p/>', feedback: 'The slash comes straight after the <.' },
        { label: '<\\p>', misconception: 'backslash', feedback: 'HTML uses a forward slash /, not a backslash.' },
        { label: '<end p>', feedback: 'Closing tags are written with a slash: </p>.' },
      ],
      hint: 'A closing tag has a forward slash before the tag name.',
      exp: 'Closing tags repeat the tag name after a forward slash: <p> ... </p>.',
    },
  ],
  sequences: [
    {
      lv: [2, 5],
      q: 'Put these lines in order to make a correctly structured web page.',
      steps: ['<!DOCTYPE html>', '<html>', '<head>', '<title>My page</title>', '</head>', '<body>', '<p>Hello!</p>', '</body>', '</html>'],
      hint: 'The head comes before the body, and every tag closes inside the one that contains it.',
      exp: 'DOCTYPE first, then <html>, the <head> (with the title), then the <body> (with the content), then close </html> last.',
    },
  ],
}

const htmlList = G('web.html-elements.list', 'web.html-elements', [1, 5], (rng, d) => {
  const n = rng.int(3, 5)
  const items = pickN(rng, ITEMS, n)
  const ordered = rng.chance(0.5)
  const tag = ordered ? 'ol' : 'ul'
  const code = [`<p>My favourite things:</p>`, `<${tag}>`, ...items.map((x) => `  <li>${x}</li>`), `</${tag}>`].join('\n')
  if (d >= 3) {
    return choice({
      rng,
      prompt: 'How will this list appear on the web page?',
      figure: codeFigure(code, 'HTML'),
      correct: ordered ? `As a numbered list: 1. ${items[0]}, 2. ${items[1]}, ...` : `As a bulleted list: • ${items[0]}, • ${items[1]}, ...`,
      wrong: [
        ordered ? { label: `As a bulleted list: • ${items[0]}, • ${items[1]}, ...`, misconception: 'ol-ul', feedback: '<ol> is an ordered (numbered) list. <ul> gives bullets.' } : { label: `As a numbered list: 1. ${items[0]}, 2. ${items[1]}, ...`, misconception: 'ol-ul', feedback: '<ul> is an unordered (bulleted) list. <ol> gives numbers.' },
        { label: `All on one line: ${items.join(' ')}`, feedback: 'Each <li> is shown as its own list item.' },
        { label: 'The tags will be shown as text', feedback: 'The browser uses the tags to format the page; it does not show them.' },
      ],
      hint: 'ol = ordered list; ul = unordered list.',
      explanation: `<${tag}> makes ${ordered ? 'an ordered (numbered)' : 'an unordered (bulleted)'} list, and each <li> is one item.`,
    })
  }
  return num({
    prompt: 'How many items will this list show on the web page?',
    figure: codeFigure(code, 'HTML'),
    answer: n,
    suffix: 'items',
    hint: 'Each list item has its own <li> tag.',
    explanation: `There are ${n} <li> elements, so ${n} items: ${items.join(', ')}.`,
  })
})

const LINKS: { text: string; url: string }[] = [
  { text: 'School website', url: 'https://www.example.sch.uk' },
  { text: 'Science homework', url: 'https://www.example.com/homework' },
  { text: 'Click here for the menu', url: 'https://www.example.org/menu' },
  { text: 'Read more', url: 'https://www.example.net/news' },
]
const htmlLink = G('web.html-elements.link', 'web.html-elements', [2, 5], (rng, d) => {
  const l = rng.pick(LINKS)
  const code = `<a href="${l.url}">${l.text}</a>`
  if (d <= 3) {
    return text({
      prompt: 'This HTML makes a link. What text will the user see and click on?',
      figure: codeFigure(code, 'HTML'),
      accept: [l.text],
      placeholder: 'Type the text',
      hint: 'The address goes inside the opening tag; the clickable text goes between the tags.',
      explanation: `The text between <a> and </a> is what is shown: "${l.text}". The href attribute holds the address it goes to.`,
    })
  }
  return choice({
    rng,
    prompt: 'In this HTML, what is the job of href?',
    figure: codeFigure(code, 'HTML'),
    correct: 'It gives the address the link goes to',
    wrong: [
      { label: 'It sets the text that is clicked on', misconception: 'href-text', feedback: 'The clickable text goes between <a> and </a>.' },
      { label: 'It makes the text bold', feedback: 'Bold uses <b> or <strong>.' },
      { label: 'It gives a description of an image', misconception: 'href-alt', feedback: 'That is the alt attribute of <img>.' },
    ],
    hint: 'href is an attribute of the <a> tag.',
    explanation: `href holds the destination: ${l.url}. The clickable text is "${l.text}".`,
  })
})

const elemFacts: FactSet = {
  skill: 'web.html-elements',
  termNoun: 'HTML tag',
  terms: [
    { term: '<h1>', def: 'The largest, most important heading', hint: 'h for heading; 1 for top level.' },
    { term: '<p>', def: 'A paragraph of text', hint: 'p for paragraph.' },
    { term: '<a>', def: 'A hyperlink to another page', hint: 'Short for "anchor".' },
    { term: '<img>', def: 'Shows a picture on the page', hint: 'Short for image; it has src and alt attributes.' },
    { term: '<ul>', def: 'An unordered (bulleted) list', hint: 'u for unordered.' },
    { term: '<li>', def: 'One item in a list', hint: 'l, i for list item.' },
  ],
  facts: [
    {
      lv: [2, 4],
      q: 'In <img src="cat.jpg" alt="A ginger cat asleep">, what is the alt text for?',
      a: 'It describes the image for screen readers, or if the image cannot load',
      wrong: [
        { label: 'It is the file name of the picture', misconception: 'alt-src', feedback: 'The file name is in src.' },
        { label: 'It is a caption printed under the picture', feedback: 'alt text is not normally shown as a caption.' },
        { label: 'It sets the picture\'s size', feedback: 'Size is set with width and height.' },
      ],
      hint: 'Think about a user who cannot see the image.',
      exp: 'alt text is read aloud by screen readers for people who are blind or partially sighted, and shown if the image fails to load.',
    },
    {
      lv: [3, 5],
      q: 'Which line correctly shows an image called logo.png?',
      a: '<img src="logo.png" alt="School logo">',
      wrong: [
        { label: '<img href="logo.png" alt="School logo">', misconception: 'href-for-img', feedback: 'Images use src. href is for links.' },
        { label: '<image src="logo.png">', feedback: 'The tag is <img>, not <image>.' },
        { label: '<a src="logo.png">School logo</a>', feedback: '<a> makes a link, not an image.' },
      ],
      hint: 'The image tag, and the attribute that gives the source file.',
      exp: '<img> uses src for the file and alt for a description. It has no closing tag.',
    },
  ],
}

// =====================================================================================================================

export const netGenerators: ItemGenerator[] = [
  ...factGenerators(lanFacts),
  ...factGenerators(topoFacts),
  ...factGenerators(csFacts),
  ...factGenerators(wwwFacts),
  urlParts,
  ...factGenerators(searchFacts),
  ipValid,
  ipBits,
  ...factGenerators(ipFacts),
  ...factGenerators(protoFacts),
  htmlTitle,
  htmlClosing,
  ...factGenerators(structFacts),
  htmlList,
  htmlLink,
  ...factGenerators(elemFacts),
]
