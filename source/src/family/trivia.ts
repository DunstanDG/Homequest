/** A small bundled dataset for the daily trivia card: a flag to guess, a trivia question, and a quote of the day.
 * Deterministic by calendar date (same card for everyone on the same day, no server needed), like the spelling
 * word list. Pure selection logic only; the completion event lives in actions.ts. */
import type { Ymd } from './types'

export interface TriviaCard {
  flag: { emoji: string; answer: string; choices: string[] }
  trivia: { q: string; choices: string[]; answer: string }
  quote: { text: string; author: string }
}

const CARDS: TriviaCard[] = [
  { flag: { emoji: '🇯🇵', answer: 'Japan', choices: ['Japan', 'South Korea', 'China'] }, trivia: { q: 'What is the largest planet in our solar system?', choices: ['Jupiter', 'Saturn', 'Neptune'], answer: 'Jupiter' }, quote: { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' } },
  { flag: { emoji: '🇧🇷', answer: 'Brazil', choices: ['Brazil', 'Portugal', 'Argentina'] }, trivia: { q: 'How many legs does a spider have?', choices: ['6', '8', '10'], answer: '8' }, quote: { text: 'Do one thing every day that scares you.', author: 'Eleanor Roosevelt' } },
  { flag: { emoji: '🇪🇬', answer: 'Egypt', choices: ['Egypt', 'Sudan', 'Libya'] }, trivia: { q: 'What is the tallest mountain in the world?', choices: ['K2', 'Mount Everest', 'Kilimanjaro'], answer: 'Mount Everest' }, quote: { text: 'It always seems impossible until it is done.', author: 'Nelson Mandela' } },
  { flag: { emoji: '🇨🇦', answer: 'Canada', choices: ['Canada', 'USA', 'Australia'] }, trivia: { q: 'What gas do plants absorb from the air?', choices: ['Oxygen', 'Carbon dioxide', 'Nitrogen'], answer: 'Carbon dioxide' }, quote: { text: 'Believe you can and you are halfway there.', author: 'Theodore Roosevelt' } },
  { flag: { emoji: '🇮🇳', answer: 'India', choices: ['India', 'Pakistan', 'Bangladesh'] }, trivia: { q: 'How many bones are in the human body?', choices: ['186', '206', '226'], answer: '206' }, quote: { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' } },
  { flag: { emoji: '🇲🇽', answer: 'Mexico', choices: ['Mexico', 'Spain', 'Colombia'] }, trivia: { q: 'What is the smallest country in the world?', choices: ['Monaco', 'Vatican City', 'Malta'], answer: 'Vatican City' }, quote: { text: 'You miss 100% of the shots you do not take.', author: 'Wayne Gretzky' } },
  { flag: { emoji: '🇰🇪', answer: 'Kenya', choices: ['Kenya', 'Nigeria', 'Ghana'] }, trivia: { q: 'What is the fastest land animal?', choices: ['Lion', 'Cheetah', 'Gazelle'], answer: 'Cheetah' }, quote: { text: 'A journey of a thousand miles begins with a single step.', author: 'Lao Tzu' } },
  { flag: { emoji: '🇳🇴', answer: 'Norway', choices: ['Norway', 'Sweden', 'Denmark'] }, trivia: { q: 'How many colours are in a rainbow?', choices: ['5', '7', '9'], answer: '7' }, quote: { text: 'Whether you think you can or think you cannot, you are right.', author: 'Henry Ford' } },
  { flag: { emoji: '🇹🇭', answer: 'Thailand', choices: ['Thailand', 'Vietnam', 'Cambodia'] }, trivia: { q: 'What is the largest ocean on Earth?', choices: ['Atlantic', 'Indian', 'Pacific'], answer: 'Pacific' }, quote: { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' } },
  { flag: { emoji: '🇳🇿', answer: 'New Zealand', choices: ['New Zealand', 'Australia', 'Fiji'] }, trivia: { q: 'What do you call a baby kangaroo?', choices: ['Cub', 'Joey', 'Kit'], answer: 'Joey' }, quote: { text: 'Start where you are. Use what you have. Do what you can.', author: 'Arthur Ashe' } },
  { flag: { emoji: '🇬🇷', answer: 'Greece', choices: ['Greece', 'Italy', 'Turkey'] }, trivia: { q: 'How many sides does a hexagon have?', choices: ['5', '6', '7'], answer: '6' }, quote: { text: 'Little by little, one travels far.', author: 'J.R.R. Tolkien' } },
  { flag: { emoji: '🇿🇦', answer: 'South Africa', choices: ['South Africa', 'Zimbabwe', 'Namibia'] }, trivia: { q: 'What is the hardest natural substance on Earth?', choices: ['Gold', 'Diamond', 'Iron'], answer: 'Diamond' }, quote: { text: 'Well done is better than well said.', author: 'Benjamin Franklin' } },
  { flag: { emoji: '🇮🇸', answer: 'Iceland', choices: ['Iceland', 'Greenland', 'Finland'] }, trivia: { q: 'How many hearts does an octopus have?', choices: ['1', '3', '5'], answer: '3' }, quote: { text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' } },
  { flag: { emoji: '🇵🇪', answer: 'Peru', choices: ['Peru', 'Chile', 'Bolivia'] }, trivia: { q: 'What is the longest river in the world?', choices: ['Amazon', 'Nile', 'Yangtze'], answer: 'Nile' }, quote: { text: 'Not all those who wander are lost.', author: 'J.R.R. Tolkien' } },
]

/** Same card for everyone on the same calendar day — a simple hash of the date string picks the index. */
export function todayTrivia(date: Ymd): TriviaCard {
  let h = 0
  for (let i = 0; i < date.length; i++) h = (h * 31 + date.charCodeAt(i)) >>> 0
  return CARDS[h % CARDS.length]!
}

export const TRIVIA_COINS = 2
