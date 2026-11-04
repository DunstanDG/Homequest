/** Ready-made sessions to start from, so an empty Sessions screen is not a blank page. Everything can be edited after. */
export interface SessionTemplate {
  id: string
  title: string
  emoji: string
  /** Suggested "must be done by". */
  finishBy?: string
  steps: { title: string; minutes: number; emoji?: string; /** Becomes the owner's due habits when the session starts. */ habitsSlot?: 'morning' | 'evening' }[]
}

export const SESSION_TEMPLATES: SessionTemplate[] = [
  {
    id: 'morning',
    title: 'Morning routine',
    emoji: '🌅',
    finishBy: '08:15',
    steps: [
      { title: 'Get up and dressed', minutes: 5, emoji: '👕' },
      { title: 'Breakfast', minutes: 15, emoji: '🥣' },
      { title: 'My morning habits', minutes: 6, emoji: '✨', habitsSlot: 'morning' },
    ],
  },
  {
    id: 'bedtime',
    title: 'Bedtime routine',
    emoji: '🌙',
    steps: [
      { title: 'Tidy up', minutes: 5, emoji: '🧸' },
      { title: 'Pyjamas', minutes: 3, emoji: '🩳' },
      { title: 'My evening habits', minutes: 6, emoji: '✨', habitsSlot: 'evening' },
      { title: 'Story or reading', minutes: 10, emoji: '📖' },
      { title: 'Lights out', minutes: 1, emoji: '😴' },
    ],
  },
  {
    id: 'leave',
    title: 'Before we leave',
    emoji: '🚪',
    steps: [
      { title: 'Shoes and coat on', minutes: 3, emoji: '👟' },
      { title: 'Bag packed', minutes: 2, emoji: '🎒' },
      { title: 'Water bottle and snack', minutes: 2, emoji: '💧' },
      { title: 'Keys, phone, lights off', minutes: 1, emoji: '🔑' },
    ],
  },
  {
    id: 'tidy',
    title: '20-minute tidy',
    emoji: '🧹',
    steps: [
      { title: 'Clear the surfaces', minutes: 5, emoji: '🧺' },
      { title: 'Dishwasher on', minutes: 5, emoji: '🍽️' },
      { title: 'Hoover the living room', minutes: 5, emoji: '🌀' },
      { title: 'Bins and recycling', minutes: 3, emoji: '♻️' },
      { title: 'Wipe the kitchen', minutes: 2, emoji: '🧽' },
    ],
  },
  {
    id: 'admin',
    title: 'Admin hour',
    emoji: '🗂️',
    steps: [
      { title: 'Open the post', minutes: 5, emoji: '✉️' },
      { title: 'Pay bills', minutes: 10, emoji: '💳' },
      { title: 'Reply to messages and emails', minutes: 15, emoji: '💬' },
      { title: 'Book the thing you keep putting off', minutes: 10, emoji: '📞' },
      { title: 'Plan tomorrow', minutes: 5, emoji: '📝' },
    ],
  },
  {
    id: 'evening',
    title: 'Evening reset',
    emoji: '🏡',
    steps: [
      { title: 'Kitchen reset', minutes: 10, emoji: '🍳' },
      { title: 'Laundry on', minutes: 5, emoji: '👚' },
      { title: 'Lay out clothes', minutes: 5, emoji: '👖' },
      { title: 'Make tomorrow\'s lunches', minutes: 10, emoji: '🥪' },
    ],
  },
]
