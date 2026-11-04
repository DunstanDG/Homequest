import type { Skill } from '@/engine/types'

/**
 * KS3 English (England national curriculum, Years 7-9) as a prerequisite graph. Year 6 'foundation' skills are the
 * KS2 grammar and vocabulary building blocks that later skills rest on. Prerequisites answer "if she gets this
 * wrong, what earlier idea is the likely reason?".
 */
const S = (id: string, year: number, strand: string, name: string, description: string, prereqs: string[], origin: Skill['origin'] = 'syllabus'): Skill => ({
  id: `english.${id}`,
  subject: 'english',
  year,
  strand,
  name,
  description,
  prereqs: prereqs.map((p) => `english.${p}`),
  origin,
})
const F = (id: string, strand: string, name: string, description: string, prereqs: string[]) => S(id, 6, strand, name, description, prereqs, 'foundation')

const GR = 'Grammar'
const PU = 'Punctuation'
const SP = 'Spelling rules'
const VO = 'Vocabulary'
const RE = 'Reading'
const DE = 'Language devices'
const PO = 'Poetry'
const DR = 'Drama and Shakespeare'
const FI = '19th-century fiction'
const WR = 'Writing'

export const englishSkills: Skill[] = [
  // ---------------------------------------------------------------- grammar
  F('grammar.word-classes', GR, 'Word classes: the basics', 'Recognise nouns, verbs, adjectives and adverbs in a sentence.', []),
  S('grammar.nouns', 7, GR, 'Types of noun', 'Common, proper, abstract and collective nouns, and noun phrases.', ['grammar.word-classes']),
  S('grammar.verbs', 7, GR, 'Verbs, auxiliaries and modals', 'Action and state verbs, auxiliary verbs and modal verbs.', ['grammar.word-classes']),
  S('grammar.adjectives-adverbs', 7, GR, 'Adjectives and adverbs', 'Adjectives, comparatives and superlatives; adverbs of manner, time, place and degree.', ['grammar.word-classes']),
  S('grammar.pronouns-determiners', 7, GR, 'Pronouns and determiners', 'Personal, possessive and relative pronouns; articles and other determiners.', ['grammar.nouns']),
  S('grammar.prepositions-conjunctions', 7, GR, 'Prepositions and conjunctions', 'Prepositions; coordinating and subordinating conjunctions.', ['grammar.word-classes']),
  S('grammar.tenses', 7, GR, 'Verb tenses', 'Past and present, simple, progressive and perfect forms, and talking about the future.', ['grammar.verbs']),
  S('grammar.phrases-clauses', 7, GR, 'Phrases and clauses', 'Tell a phrase from a clause; find the head of a noun phrase.', ['grammar.verbs', 'grammar.nouns']),
  S('grammar.sentence-types', 7, GR, 'Simple, compound and complex sentences', 'Build and recognise simple, compound and complex sentences.', ['grammar.phrases-clauses', 'grammar.prepositions-conjunctions']),
  S('grammar.subordinate-clauses', 8, GR, 'Main, subordinate and relative clauses', 'Identify main, subordinate and relative clauses and move them for effect.', ['grammar.sentence-types', 'grammar.pronouns-determiners']),
  S('grammar.active-passive', 8, GR, 'Active and passive voice', 'Recognise the passive, change active to passive, and know why writers choose it.', ['grammar.tenses', 'grammar.phrases-clauses']),
  S('grammar.standard-english', 8, GR, 'Standard English', 'Spot and correct non-standard verb forms, double negatives and other non-standard grammar.', ['grammar.tenses']),
  S('grammar.register', 8, GR, 'Formal and informal register', 'Choose vocabulary and grammar to suit a formal or informal situation.', ['grammar.standard-english', 'vocab.synonyms-antonyms']),

  // ------------------------------------------------------------- punctuation
  F('punctuation.sentence-basics', PU, 'Sentence functions and end punctuation', 'Statements, questions, commands and exclamations, and how to end them.', []),
  S('punctuation.commas', 7, PU, 'Commas', 'Commas in lists, after fronted adverbials and clauses, around extra information; avoiding comma splices.', ['punctuation.sentence-basics', 'grammar.phrases-clauses']),
  S('punctuation.apostrophes', 7, PU, 'Apostrophes', 'Apostrophes for omission and for singular and plural possession; its and it’s.', ['grammar.nouns']),
  S('punctuation.speech', 7, PU, 'Punctuating speech', 'Speech marks, the punctuation inside them, and a new line for a new speaker.', ['punctuation.sentence-basics', 'punctuation.commas']),
  S('punctuation.colons-semicolons', 8, PU, 'Colons and semicolons', 'Colons before lists and explanations; semicolons between related clauses and in complex lists.', ['grammar.sentence-types', 'punctuation.commas']),
  S('punctuation.parenthesis', 8, PU, 'Brackets, dashes and ellipsis', 'Parenthesis with brackets, dashes or commas; single dashes and ellipsis for effect.', ['punctuation.commas']),

  // ---------------------------------------------------------------- spelling
  S('spelling.homophones', 7, SP, 'Homophones and confusable words', 'Choose between words that sound alike: there/their/they’re, affect/effect, practice/practise...', ['grammar.word-classes']),
  S('spelling.word-building', 7, SP, 'Plurals, prefixes and suffixes', 'Spelling rules for plurals and for adding prefixes and suffixes.', ['grammar.nouns']),

  // -------------------------------------------------------------- vocabulary
  F('vocab.synonyms-antonyms', VO, 'Synonyms and antonyms', 'Words with similar and opposite meanings.', []),
  S('vocab.prefixes-suffixes', 7, VO, 'Prefixes and suffixes', 'What common prefixes and suffixes mean and how they change a word.', ['vocab.synonyms-antonyms']),
  S('vocab.roots', 8, VO, 'Word roots', 'Use Latin and Greek roots to work out the meaning of unfamiliar words.', ['vocab.prefixes-suffixes']),
  S('vocab.connotations', 8, VO, 'Connotations', 'The associations and feelings words carry beyond their dictionary meaning.', ['vocab.synonyms-antonyms']),
  S('vocab.context', 8, VO, 'Words in context', 'Work out what an unfamiliar word means from the sentence around it.', ['vocab.roots', 'vocab.synonyms-antonyms']),

  // ----------------------------------------------------------------- reading
  S('reading.retrieval', 7, RE, 'Finding information', 'Find and retrieve explicit information from a text.', []),
  S('reading.inference', 7, RE, 'Inference', 'Read between the lines: work out what a text suggests from clues.', ['reading.retrieval']),
  S('reading.fact-opinion', 7, RE, 'Fact and opinion', 'Tell facts that can be checked from opinions, and spot opinion words.', ['reading.retrieval']),
  S('reading.summarising', 7, RE, 'Summarising', 'Pick out the main idea of a paragraph or text and sum it up briefly.', ['reading.retrieval']),
  S('reading.quotations', 8, RE, 'Choosing evidence', 'Pick the quotation that best supports a point.', ['reading.inference']),
  S('reading.language-analysis', 8, RE, 'Analysing language', 'Explain how a writer’s word choices and devices create effects.', ['reading.inference', 'vocab.connotations', 'devices.figurative']),
  S('reading.structure', 8, RE, 'Analysing structure', 'Openings, shifts in focus, flashback, foreshadowing and cyclical structure.', ['reading.inference', 'reading.summarising']),
  S('reading.purpose-viewpoint', 8, RE, 'Purpose, audience and viewpoint', 'Identify why a text was written, who for, and the writer’s attitude.', ['reading.inference', 'reading.fact-opinion']),
  S('reading.narrative-voice', 8, RE, 'Narrative voice', 'First, second and third person narrators; omniscient, limited and unreliable narrators.', ['grammar.pronouns-determiners', 'reading.inference']),
  S('reading.comparing', 9, RE, 'Comparing texts', 'Compare two texts’ viewpoints and methods, using comparative connectives.', ['reading.purpose-viewpoint', 'reading.language-analysis']),

  // ------------------------------------------------------- language devices
  S('devices.figurative', 7, DE, 'Simile, metaphor and personification', 'Recognise comparisons and personification and say what they suggest.', []),
  S('devices.sound', 7, DE, 'Sound devices', 'Alliteration, sibilance and onomatopoeia.', []),
  S('devices.exaggeration-contrast', 8, DE, 'Hyperbole, oxymoron and juxtaposition', 'Exaggeration and contrast as devices.', ['devices.figurative']),
  S('devices.imagery', 8, DE, 'Imagery, pathetic fallacy and semantic fields', 'Sensory imagery, weather that mirrors mood, and groups of linked words.', ['devices.figurative', 'vocab.connotations']),
  S('devices.rhetoric', 8, DE, 'Rhetorical devices', 'Rhetorical questions, repetition, the rule of three, direct address and emotive language.', ['punctuation.sentence-basics']),

  // ------------------------------------------------------------------ poetry
  S('poetry.terms', 7, PO, 'Poetry terms', 'Line, stanza, couplet, quatrain, refrain, rhyme and free verse.', ['devices.sound']),
  S('poetry.rhyme-scheme', 7, PO, 'Rhyme schemes', 'Work out a rhyme scheme using letters (AABB, ABAB...).', ['poetry.terms']),
  S('poetry.enjambment-caesura', 8, PO, 'Enjambment and caesura', 'How line endings and mid-line pauses shape a poem.', ['poetry.terms']),
  S('poetry.forms', 8, PO, 'Poetic forms', 'Sonnet, ballad, haiku, limerick, ode, elegy, free verse and dramatic monologue.', ['poetry.rhyme-scheme']),
  S('poetry.analysis', 8, PO, 'Analysing poems', 'Read classic poems closely: meaning, devices, tone and form.', ['devices.figurative', 'devices.sound', 'poetry.enjambment-caesura']),
  S('poetry.metre', 9, PO, 'Rhythm and metre', 'Syllables and stress, iambs and trochees, iambic pentameter and blank verse.', ['poetry.forms']),

  // ------------------------------------------------------------------- drama
  S('drama.conventions', 7, DR, 'Drama conventions', 'Acts, scenes, stage directions, soliloquy, aside, monologue and dramatic irony.', []),
  S('drama.shakespeare-life', 7, DR, 'Shakespeare’s life and theatre', 'Shakespeare’s life, the Globe and what going to the theatre was like.', []),
  S('drama.midsummer', 7, DR, 'A Midsummer Night’s Dream', 'Plot, characters and famous lines.', ['drama.conventions']),
  S('drama.tempest', 7, DR, 'The Tempest', 'Plot, characters and famous lines.', ['drama.conventions']),
  S('drama.shakespeare-language', 8, DR, 'Shakespeare’s language', 'Old words and pronouns (thou, thee, wherefore), verse and prose.', ['drama.shakespeare-life', 'drama.conventions']),
  S('drama.much-ado-plot', 8, DR, 'Much Ado About Nothing: plot', 'What happens, in what order, and why.', ['drama.conventions', 'drama.shakespeare-life']),
  S('drama.much-ado-characters', 8, DR, 'Much Ado About Nothing: characters', 'Who is who, how they relate and how they change.', ['drama.much-ado-plot']),
  S('drama.much-ado-themes', 8, DR, 'Much Ado About Nothing: themes and quotations', 'Deception, love, honour and reputation, and who said what.', ['drama.much-ado-characters', 'drama.shakespeare-language']),
  S('drama.romeo-juliet', 8, DR, 'Romeo and Juliet', 'Plot, characters, themes and famous lines.', ['drama.conventions', 'drama.shakespeare-language']),
  S('drama.genres', 9, DR, 'Comedy and tragedy', 'The conventions of Shakespearean comedy and tragedy.', ['drama.much-ado-plot', 'drama.romeo-juliet']),
  S('drama.macbeth', 9, DR, 'Macbeth', 'Plot, characters, themes and famous lines.', ['drama.genres', 'drama.shakespeare-language']),

  // ----------------------------------------------------------------- fiction
  S('fiction.authors-texts', 7, FI, 'Classic authors and their books', 'Match well-known 19th-century and early 20th-century authors to their books and characters.', []),
  S('fiction.victorian-context', 8, FI, 'Victorian context', 'Life in Victorian Britain and how it shaped the fiction of the time.', ['fiction.authors-texts']),
  S('fiction.christmas-carol', 8, FI, 'A Christmas Carol', 'Characters, plot, staves, themes and Dickens’s message.', ['fiction.victorian-context']),
  S('fiction.gothic', 9, FI, 'Gothic fiction', 'The conventions of the Gothic, and Frankenstein, Jekyll and Hyde and Dracula.', ['fiction.authors-texts', 'devices.imagery']),

  // ----------------------------------------------------------------- writing
  S('writing.paragraphing', 7, WR, 'Paragraphs and topic sentences', 'When to start a new paragraph, and how to open one with a clear topic sentence.', ['punctuation.sentence-basics']),
  S('writing.narrative', 7, WR, 'Narrative writing', 'Story structure, openings and showing rather than telling.', ['writing.paragraphing', 'devices.figurative']),
  S('writing.cohesion', 8, WR, 'Cohesion and discourse markers', 'Link ideas with the right connective for adding, contrasting, sequencing and explaining.', ['writing.paragraphing', 'grammar.prepositions-conjunctions']),
  S('writing.descriptive', 8, WR, 'Descriptive writing', 'Use the senses, precise vocabulary and imagery to describe a scene.', ['devices.imagery', 'writing.narrative']),
  S('writing.persuasive', 8, WR, 'Persuasive writing and argument', 'Persuasive techniques, counter-arguments and rebuttals.', ['devices.rhetoric', 'reading.fact-opinion']),
  S('writing.transactional', 8, WR, 'Letters, articles, speeches and leaflets', 'The conventions of common non-fiction forms.', ['grammar.register', 'writing.paragraphing']),
  S('writing.analytical', 8, WR, 'Analytical paragraphs', 'Point, evidence, explain: embed quotations and analyse their effect.', ['reading.quotations', 'writing.cohesion']),
  S('writing.sentence-craft', 9, WR, 'Crafting sentences for effect', 'Vary sentence length, structure and openings to control pace and emphasis.', ['grammar.subordinate-clauses', 'punctuation.colons-semicolons']),
]
