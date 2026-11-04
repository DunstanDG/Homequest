import type { ItemGenerator } from '@/engine/registry'
import type { Rng } from '@/engine/types'
import { choice } from '../kit'
import { at, err, factGenerators, G, listAccept, num, text, type FactSet } from './helpers'

const show = (xs: number[]) => `[${xs.join(', ')}]`
const distinct = (rng: Rng, n: number, lo = 1, hi = 99): number[] => rng.shuffle(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)).slice(0, n)
const sorted = (xs: number[]) => [...xs].sort((a, b) => a - b)

// =====================================================================================================================
// Linear search
// =====================================================================================================================

const linearCount = G('alg.linear-search.count', 'alg.linear-search', [1, 5], (rng, d) => {
  const n = d <= 2 ? rng.int(5, 7) : rng.int(7, 10)
  const xs = distinct(rng, n)
  const absent = d >= 3 && rng.chance(0.35)
  const target = absent ? rng.pick(Array.from({ length: 99 }, (_, i) => i + 1).filter((v) => !xs.includes(v))) : rng.pick(xs)
  const pos = xs.indexOf(target)
  const answer = absent ? n : pos + 1
  return num({
    prompt: `A linear search looks for ${target} in the list ${show(xs)}, starting from the first item. How many items does it check (compare with ${target}) before it stops?`,
    answer,
    suffix: 'items',
    hint: 'Check items one at a time from the start. It stops when it finds the target, or when it runs out of items.',
    explanation: absent ? `${target} is not in the list, so every one of the ${n} items is checked before the search can say "not found".` : `${target} is item number ${pos + 1}, so ${pos + 1} items are checked.`,
    errors: absent ? [err(0, 'gave-up', 'The search has to check every item before it knows the target is not there.')] : [err(pos, 'index-from-zero', 'Count the items checked, including the one that matches.'), err(n, 'checked-all', 'The search stops as soon as it finds the target.')],
  })
})

const linearFacts: FactSet = {
  skill: 'alg.linear-search',
  facts: [
    {
      lv: [1, 3],
      q: 'How does a linear search work?',
      a: 'It checks each item in turn, from the start, until it finds the target or reaches the end',
      wrong: [
        { label: 'It checks the middle item, then throws away half of the list', misconception: 'linear-as-binary', feedback: 'That is binary search.' },
        { label: 'It sorts the list first, then picks the first item', feedback: 'A linear search does not sort anything.' },
        { label: 'It checks items in a random order', feedback: 'A linear search goes through in order.' },
      ],
      hint: '"Linear" means in a line.',
      exp: 'A linear search starts at the first item and checks each one in order until the target is found or there are no items left.',
    },
    {
      lv: [2, 4],
      q: 'Does a linear search need the list to be sorted?',
      a: 'No: it works on sorted and unsorted lists',
      wrong: [
        { label: 'Yes: it only works on sorted lists', misconception: 'linear-needs-sort', feedback: 'That is binary search. A linear search checks every item, so the order does not matter.' },
        { label: 'Yes, but only if the list has more than 10 items', feedback: 'List size makes no difference.' },
        { label: 'Only if the list contains numbers', feedback: 'Linear search works on any data.' },
      ],
      hint: 'If you check every item one by one, does the order matter?',
      exp: 'Because it checks each item in turn, a linear search works whatever order the list is in. This is its big advantage over binary search.',
    },
    {
      lv: [3, 5],
      q: 'A list has 500 items. In the worst case, how many items will a linear search check?',
      a: '500',
      wrong: [
        { label: '250', feedback: '250 is about the average when the item is present. The worst case is checking every item.' },
        { label: '9', misconception: 'linear-as-binary', feedback: 'That is closer to a binary search on a sorted list.' },
        { label: '1', feedback: 'That is the best case: the target is first.' },
      ],
      keepOrder: false,
      hint: 'The worst case is when the target is last, or not there at all.',
      exp: 'In the worst case (the item is last or missing), every one of the 500 items is checked.',
    },
  ],
  sequences: [
    {
      lv: [2, 4],
      q: 'Put the steps of a linear search in order.',
      steps: ['Start at the first item in the list', 'Compare the current item with the target', 'If they match, report that the item is found and stop', 'Otherwise move on to the next item', 'If there are no items left, report "not found"'],
      hint: 'You have to compare before you can decide to stop or move on.',
      exp: 'Start at the beginning; compare; stop if found; otherwise move to the next item; if the end is reached, the item is not in the list.',
    },
  ],
}

// =====================================================================================================================
// Binary search (positions 1 to n; the middle is (first + last) ÷ 2 rounded down)
// =====================================================================================================================

const MID_RULE = 'The middle position is (first + last) ÷ 2, rounded down, counting positions from 1.'

function binarySteps(xs: number[], target: number): number[] {
  const checked: number[] = []
  let lo = 1
  let hi = xs.length
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const v = at(xs, mid - 1)
    checked.push(v)
    if (v === target) break
    if (target < v) hi = mid - 1
    else lo = mid + 1
  }
  return checked
}

const binaryFirst = G('alg.binary-search.first', 'alg.binary-search', [1, 3], (rng, d) => {
  const n = rng.int(d <= 1 ? 5 : 6, d <= 2 ? 9 : 15)
  const xs = sorted(distinct(rng, n))
  const target = rng.pick(xs)
  const steps = binarySteps(xs, target)
  const mid = Math.floor((1 + n) / 2)
  if (d <= 2 || steps.length < 2) {
    return num({
      prompt: `A binary search looks for ${target} in the sorted list ${show(xs)}. ${MID_RULE} Which value is checked first?`,
      answer: at(steps, 0),
      hint: `There are ${n} items. Work out (1 + ${n}) ÷ 2 and round down.`,
      explanation: `(1 + ${n}) ÷ 2 = ${(1 + n) / 2}, rounded down to ${mid}. Item ${mid} is ${at(steps, 0)}.`,
      errors: [err(at(xs, 0), 'first-item', 'That is how a linear search starts. A binary search starts in the middle.'), err(at(xs, mid), 'round-up', 'Round down when finding the middle.')],
    })
  }
  return num({
    prompt: `A binary search looks for ${target} in the sorted list ${show(xs)}. ${MID_RULE} Which value is checked second?`,
    answer: at(steps, 1),
    hint: 'After the first check, throw away the half that cannot contain the target, then find the middle of what is left.',
    explanation: `First check: ${at(steps, 0)}. ${target} is ${target < at(steps, 0) ? 'smaller' : 'larger'}, so only the ${target < at(steps, 0) ? 'left' : 'right'} half is kept. Its middle item is ${at(steps, 1)}.`,
  })
})

const binaryCount = G('alg.binary-search.count', 'alg.binary-search', [2, 5], (rng, d) => {
  if (d >= 5 && rng.chance(0.5)) {
    const k = rng.int(4, 10)
    const n = 2 ** k - 1
    return num({
      prompt: `A sorted list has ${n.toLocaleString('en-GB')} items. What is the largest number of items a binary search could need to check to find a value (or show it is missing)?`,
      answer: k,
      suffix: 'items',
      hint: 'Each check halves what is left. How many halvings get you down to 1 item?',
      explanation: `Each check roughly halves the list: ${n} → ${Array.from({ length: k - 1 }, (_, i) => 2 ** (k - 1 - i) - 1).join(' → ')}. That is at most ${k} checks (2^{${k}} = ${2 ** k}). A linear search could need ${n}.`,
      errors: [err(n, 'linear', `That would be a linear search. Binary search halves the list each time.`)],
    })
  }
  const n = rng.int(7, 15)
  const xs = sorted(distinct(rng, n))
  const target = rng.pick(xs)
  const steps = binarySteps(xs, target)
  return num({
    prompt: `A binary search looks for ${target} in the sorted list ${show(xs)}. ${MID_RULE} How many items are checked, including the one that matches?`,
    answer: steps.length,
    suffix: 'items',
    hint: 'Check the middle; keep only the half that could contain the target; repeat. Write down each value you check.',
    explanation: `The values checked are ${steps.join(', ')}: ${steps.length} item${steps.length === 1 ? '' : 's'}.`,
    errors: [err(xs.indexOf(target) + 1, 'linear', 'That is how many a linear search would check.')],
  })
})

const binaryFacts: FactSet = {
  skill: 'alg.binary-search',
  facts: [
    {
      lv: [1, 3],
      q: 'What must be true of a list before a binary search can be used?',
      a: 'It must be sorted',
      wrong: [
        { label: 'It must contain only numbers', feedback: 'Binary search also works on sorted words (alphabetical order).' },
        { label: 'It must have an even number of items', feedback: 'Any number of items works.' },
        { label: 'It must have fewer than 100 items', feedback: 'Binary search is best on large lists.' },
      ],
      hint: 'How does it know which half to throw away?',
      exp: 'Binary search compares with the middle item and throws away the half that cannot contain the target. That only works if the list is in order.',
    },
    {
      lv: [2, 4],
      q: 'Which statement about linear and binary search is correct?',
      a: 'Binary search is usually much faster on a large sorted list',
      wrong: [
        { label: 'Linear search is always faster', feedback: 'Linear search is only quicker if the item happens to be near the start.' },
        { label: 'Binary search works on unsorted lists', misconception: 'binary-unsorted', feedback: 'Binary search needs a sorted list.' },
        { label: 'They always check the same number of items', feedback: 'Binary search usually checks far fewer.' },
      ],
      hint: 'Binary search halves the list with every check.',
      exp: 'Each binary search check halves the remaining list, so even 1,000 sorted items need at most 10 checks. A linear search might need 1,000.',
    },
  ],
  written: [
    {
      q: 'Explain why a binary search is usually faster than a linear search on a large sorted list.',
      model: 'A linear search checks every item one by one, so on a list of 1,000 items it might need 1,000 checks. A binary search checks the middle item and then throws away the half of the list that cannot contain the target, so every check halves what is left. This means a list of 1,000 items needs at most about 10 checks. However, binary search only works if the list is sorted.',
      checklist: ['Explains linear search checks items one at a time', 'Explains binary search checks the middle item', 'Explains half the list is discarded each time', 'Gives a numerical comparison or says far fewer checks are needed', 'Mentions the list must be sorted'],
      passMark: 3,
    },
    {
      q: 'Describe how a binary search would find the name "Omar" in an alphabetical list of 15 names.',
      model: 'First the search looks at the middle name, the 8th one. If that is "Omar", it stops. If "Omar" comes before it in the alphabet, it throws away the middle name and everything after it; if it comes after, it throws away the first half. It then looks at the middle of the names that are left and repeats this until it finds "Omar" or there are no names left.',
      checklist: ['Starts by checking the middle name', 'Compares alphabetically to decide which half to keep', 'Discards the other half', 'Repeats on the remaining half', 'Stops when found or when nothing is left'],
      passMark: 3,
    },
  ],
}

// =====================================================================================================================
// Bubble sort (ascending)
// =====================================================================================================================

function bubblePass(xs: number[]): { out: number[]; swaps: number } {
  const out = [...xs]
  let swaps = 0
  for (let i = 0; i < out.length - 1; i++) {
    if (at(out, i) > at(out, i + 1)) {
      ;[out[i], out[i + 1]] = [at(out, i + 1), at(out, i)]
      swaps++
    }
  }
  return { out, swaps }
}

const bubbleAfter = G('alg.bubble-sort.pass', 'alg.bubble-sort', [1, 5], (rng, d) => {
  const n = d <= 2 ? 4 : d === 3 ? 5 : 6
  let xs = distinct(rng, n, 1, 30)
  while (bubblePass(xs).swaps === 0) xs = rng.shuffle(xs)
  const passes = d >= 5 ? 2 : 1
  let cur = xs
  for (let p = 0; p < passes; p++) cur = bubblePass(cur).out
  return text({
    prompt: `Bubble sort is used to put ${show(xs)} into ascending order. What is the list after ${passes === 1 ? 'the first pass' : 'two complete passes'}? (Type the numbers separated by commas.)`,
    accept: listAccept(cur),
    placeholder: 'e.g. 3, 5, 8, 12',
    hint: 'In one pass, compare items 1 and 2, swap them if they are in the wrong order, then compare items 2 and 3, and so on to the end.',
    explanation: `${passes === 1 ? 'After one pass' : 'After two passes'} the list is ${show(cur)}. Notice the largest value${passes === 2 ? 's have' : ' has'} "bubbled" to the end.`,
  })
})

const bubbleCount = G('alg.bubble-sort.count', 'alg.bubble-sort', [2, 5], (rng, d) => {
  const n = rng.int(4, 7)
  let xs = distinct(rng, n, 1, 40)
  while (bubblePass(xs).swaps === 0) xs = rng.shuffle(xs)
  const kind = rng.pick(d <= 2 ? ['comparisons', 'swaps'] : d <= 4 ? ['swaps', 'comparisons', 'largest'] : ['passes', 'swaps'])
  if (kind === 'comparisons') {
    return num({ prompt: `How many comparisons does the first pass of a bubble sort make on a list of ${n} items?`, answer: n - 1, suffix: 'comparisons', hint: 'Each comparison looks at a pair of neighbours.', explanation: `${n} items have ${n - 1} neighbouring pairs, so ${n - 1} comparisons.`, errors: [err(n, 'off-by-one', 'Count the pairs, not the items.')] })
  }
  if (kind === 'largest') {
    return num({ prompt: `After the first pass of a bubble sort (ascending) on ${show(xs)}, which value is guaranteed to be in its final place at the end of the list?`, answer: Math.max(...xs), hint: 'Which value keeps getting swapped along until it reaches the end?', explanation: `The largest value, ${Math.max(...xs)}, wins every comparison it is in, so it is carried all the way to the end in the first pass.`, errors: [err(Math.min(...xs), 'smallest', 'The smallest value only moves one place left per pass.')] })
  }
  if (kind === 'passes') {
    let cur = xs
    let passes = 0
    for (;;) {
      const r = bubblePass(cur)
      passes++
      cur = r.out
      if (r.swaps === 0 || passes > 20) break
    }
    return num({ prompt: `Bubble sort keeps making passes over ${show(xs)} until it makes a pass with no swaps. How many passes is that in total, including the final pass with no swaps?`, answer: passes, suffix: 'passes', hint: 'Do one pass at a time and write down the list after each. Count the last pass too.', explanation: `It takes ${passes - 1} pass${passes - 1 === 1 ? '' : 'es'} to sort the list, then one more pass with no swaps to confirm it is sorted: ${passes} in total.`, errors: [err(passes - 1, 'no-check-pass', 'Bubble sort only knows the list is sorted after a pass with no swaps, so count that pass too.')] })
  }
  const { swaps, out } = bubblePass(xs)
  return num({ prompt: `How many swaps happen during the first pass of a bubble sort (ascending) on ${show(xs)}?`, answer: swaps, suffix: 'swaps', hint: 'Go through the pairs from the left. Keep track of the list as it changes after each swap.', explanation: `Going through the pairs and swapping when the left one is bigger gives ${show(out)}, using ${swaps} swap${swaps === 1 ? '' : 's'}.` })
})

const bubbleFacts: FactSet = {
  skill: 'alg.bubble-sort',
  facts: [
    {
      lv: [1, 3],
      q: 'In a bubble sort, what is compared each time?',
      a: 'Two neighbouring items, which are swapped if they are in the wrong order',
      wrong: [
        { label: 'The middle item and the target', misconception: 'sort-as-search', feedback: 'That is part of binary search, not sorting.' },
        { label: 'The first item and the last item', feedback: 'Bubble sort compares items that are next to each other.' },
        { label: 'Every item with the largest item', feedback: 'Only neighbouring pairs are compared.' },
      ],
      hint: 'The large values "bubble" along one step at a time.',
      exp: 'Bubble sort compares each pair of neighbours and swaps them if they are the wrong way round, working along the list.',
    },
    {
      lv: [3, 5],
      q: 'How does a bubble sort know that the list is sorted?',
      a: 'It makes a complete pass with no swaps',
      wrong: [
        { label: 'It has made exactly one pass', feedback: 'One pass is rarely enough: it only guarantees the largest item is at the end.' },
        { label: 'The first item is the smallest', feedback: 'The rest of the list could still be out of order.' },
        { label: 'It has compared every item with the target', misconception: 'sort-as-search', feedback: 'Sorting has no target.' },
      ],
      hint: 'If nothing needed swapping...',
      exp: 'If a full pass makes no swaps, every pair of neighbours is in order, so the whole list is sorted.',
    },
  ],
}

// =====================================================================================================================
// Insertion sort
// =====================================================================================================================

function insertionAfter(xs: number[], k: number): number[] {
  const out = [...xs]
  for (let i = 1; i <= k && i < out.length; i++) {
    const v = at(out, i)
    let j = i - 1
    while (j >= 0 && at(out, j) > v) {
      out[j + 1] = at(out, j)
      j--
    }
    out[j + 1] = v
  }
  return out
}

const insertionGen = G('alg.insertion-sort.after', 'alg.insertion-sort', [1, 5], (rng, d) => {
  const n = d <= 2 ? 5 : 6
  const xs = distinct(rng, n, 1, 40)
  const k = d <= 1 ? 1 : d <= 3 ? rng.int(1, 2) : rng.int(2, 4)
  const res = insertionAfter(xs, k)
  return text({
    prompt: `Insertion sort is putting ${show(xs)} into ascending order. The first item counts as sorted. What does the list look like after the next ${k === 1 ? 'item has' : `${k} items have`} been inserted into place? (Type the numbers separated by commas.)`,
    accept: listAccept(res),
    placeholder: 'e.g. 3, 5, 8, 12',
    hint: 'Take the next unsorted item and slide it left past any bigger items in the sorted part. The unsorted part does not change yet.',
    explanation: `After inserting ${xs.slice(1, k + 1).join(', then ')}, the first ${k + 1} items are in order: ${show(res)}. The rest of the list is untouched.`,
  })
})

const insertionFacts: FactSet = {
  skill: 'alg.insertion-sort',
  facts: [
    {
      lv: [1, 3],
      q: 'How does insertion sort work?',
      a: 'It takes each item in turn and inserts it into the correct place in the sorted part of the list',
      wrong: [
        { label: 'It swaps neighbouring items again and again until no swaps are needed', misconception: 'insertion-as-bubble', feedback: 'That is bubble sort.' },
        { label: 'It splits the list into single items and merges them back together', misconception: 'insertion-as-merge', feedback: 'That is merge sort.' },
        { label: 'It checks the middle item and discards half the list', feedback: 'That is binary search.' },
      ],
      hint: 'Like sorting a hand of playing cards one card at a time.',
      exp: 'Insertion sort builds a sorted part at the start of the list, inserting one new item into the right place each time.',
    },
    {
      lv: [2, 4],
      q: 'Insertion sort is used on a list that is already sorted. What happens?',
      a: 'Each item is compared once and none of them need to move, so it finishes quickly',
      wrong: [
        { label: 'It reverses the list', feedback: 'It only moves items that are out of order.' },
        { label: 'It never finishes', feedback: 'It goes through each item once and stops.' },
        { label: 'It moves every item to the start', feedback: 'Each item is already in place.' },
      ],
      hint: 'Is anything in the sorted part bigger than the next item?',
      exp: 'Each new item is already bigger than everything before it, so it stays put after one comparison. This makes insertion sort fast on lists that are already nearly sorted.',
    },
  ],
}

// =====================================================================================================================
// Merge sort
// =====================================================================================================================

const merge = (a: number[], b: number[]) => sorted([...a, ...b])

const mergeTwo = G('alg.merge-sort.merge', 'alg.merge-sort', [1, 4], (rng, d) => {
  const n = d <= 2 ? 3 : 4
  const all = distinct(rng, n * 2, 1, 50)
  const a = sorted(all.slice(0, n))
  const b = sorted(all.slice(n))
  const res = merge(a, b)
  return text({
    prompt: `Merge the sorted lists ${show(a)} and ${show(b)} into one sorted list, as merge sort does. (Type the numbers separated by commas.)`,
    accept: listAccept(res),
    placeholder: 'e.g. 2, 5, 9, 14',
    hint: 'Compare the first item of each list, take the smaller one, and repeat.',
    explanation: `Repeatedly take the smaller of the two front items: ${show(res)}.`,
  })
})

const mergeRound = G('alg.merge-sort.round', 'alg.merge-sort', [2, 5], (rng, d) => {
  const xs = distinct(rng, 8, 1, 50)
  const pairs = [0, 2, 4, 6].map((i) => sorted(xs.slice(i, i + 2)))
  if (d >= 4) {
    const fours = [merge(at(pairs, 0), at(pairs, 1)), merge(at(pairs, 2), at(pairs, 3))]
    const correct = fours.map(show).join(' ')
    return choice({
      rng,
      prompt: `Merge sort splits ${show(xs)} into single items, then merges them in pairs. What are the lists after the SECOND round of merging?`,
      correct,
      wrong: [
        { label: pairs.map(show).join(' '), misconception: 'one-round', feedback: 'That is after the first round only.' },
        { label: show(sorted(xs)), misconception: 'all-at-once', feedback: 'That is the end result, after the third round.' },
        { label: [xs.slice(0, 4), xs.slice(4)].map((x) => show(x)).join(' '), feedback: 'The lists of four must be in order after merging.' },
      ],
      hint: 'Round 1 makes four sorted pairs. Round 2 merges neighbouring pairs into sorted lists of four.',
      explanation: `Round 1: ${pairs.map(show).join(' ')}. Round 2: ${correct}. Round 3 would merge these into ${show(sorted(xs))}.`,
    })
  }
  const correct = pairs.map(show).join(' ')
  return choice({
    rng,
    prompt: `Merge sort splits ${show(xs)} into single items. What are the lists after the FIRST round of merging neighbouring items into pairs?`,
    correct,
    wrong: [
      { label: [0, 2, 4, 6].map((i) => show(xs.slice(i, i + 2))).join(' '), misconception: 'unsorted-pairs', feedback: 'When two items are merged, they are put in order.' },
      { label: show(sorted(xs)), misconception: 'all-at-once', feedback: 'That is the final result. The first round only makes pairs.' },
      { label: [0, 2, 4, 6].map((i) => show(sorted(sorted(xs).slice(i, i + 2)))).join(' '), feedback: 'Each pair is made from items that were next to each other in the original list.' },
    ],
    hint: 'Take the items two at a time, in their original order, and put each pair in order.',
    explanation: `Neighbouring items are merged into sorted pairs: ${correct}.`,
  })
})

const mergeSplits = G('alg.merge-sort.splits', 'alg.merge-sort', [3, 5], (rng) => {
  const k = rng.int(2, 5)
  const n = 2 ** k
  return num({
    prompt: `A list of ${n} items is split in half, then each half is split in half, and so on, until every list has 1 item. How many rounds of splitting are needed?`,
    answer: k,
    suffix: 'rounds',
    hint: 'How many times can you halve the number of items before you reach 1?',
    explanation: `${n} → ${Array.from({ length: k }, (_, i) => n / 2 ** (i + 1)).join(' → ')} items per list: ${k} rounds (2^{${k}} = ${n}). It then takes ${k} rounds of merging to put it back together.`,
    errors: [err(n - 1, 'counted-cuts', 'Count rounds of halving, not the number of cuts.'), err(n / 2, 'halved', 'Count how many times you halve, not half the number of items.')],
  })
})

const mergeFacts: FactSet = {
  skill: 'alg.merge-sort',
  facts: [
    {
      lv: [1, 3],
      q: 'What are the two main stages of merge sort?',
      a: 'Split the list until every list has one item, then merge the lists back together in order',
      wrong: [
        { label: 'Swap neighbouring items, then check for swaps', misconception: 'merge-as-bubble', feedback: 'That is bubble sort.' },
        { label: 'Check the middle item, then discard half', feedback: 'That is binary search.' },
        { label: 'Insert each item into a sorted part', misconception: 'merge-as-insertion', feedback: 'That is insertion sort.' },
      ],
      hint: 'Divide, then combine.',
      exp: 'Merge sort divides the list into single items (each one is trivially sorted), then repeatedly merges pairs of sorted lists until one sorted list is left.',
    },
    {
      lv: [3, 5],
      q: 'Why is merge sort usually chosen over bubble sort for very large lists?',
      a: 'It needs far fewer comparisons on large lists, so it is much faster',
      wrong: [
        { label: 'It uses less memory than bubble sort', misconception: 'merge-memory', feedback: 'Merge sort usually needs extra memory for the lists it builds. Its advantage is speed.' },
        { label: 'It is easier to program than bubble sort', feedback: 'Bubble sort is simpler to write.' },
        { label: 'It works on unsorted lists, and bubble sort does not', feedback: 'Both are for sorting unsorted lists.' },
      ],
      hint: 'Think about how the number of comparisons grows as the list gets bigger.',
      exp: 'On a large list, bubble sort may need a huge number of passes and comparisons. Merge sort\'s split-and-merge approach needs far fewer, though it uses more memory.',
    },
  ],
  written: [
    {
      q: 'Compare bubble sort and merge sort. Give one advantage of each.',
      model: 'Bubble sort repeatedly compares neighbouring items and swaps them, making passes until no swaps are needed. It is simple to understand and program, and it sorts the list in place without needing extra memory. Merge sort splits the list into single items and merges them back together in order. It is much faster than bubble sort on large lists, but it needs more memory to hold the lists while merging.',
      checklist: ['Describes how bubble sort works', 'Describes how merge sort works', 'Gives an advantage of bubble sort (simple, or little extra memory)', 'Gives an advantage of merge sort (faster on large lists)'],
    },
  ],
}

// =====================================================================================================================

export const algGenerators: ItemGenerator[] = [
  linearCount,
  ...factGenerators(linearFacts),
  binaryFirst,
  binaryCount,
  ...factGenerators(binaryFacts),
  bubbleAfter,
  bubbleCount,
  ...factGenerators(bubbleFacts),
  insertionGen,
  ...factGenerators(insertionFacts),
  mergeTwo,
  mergeRound,
  mergeSplits,
  ...factGenerators(mergeFacts),
]
