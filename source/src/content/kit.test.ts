import { describe, expect, it } from 'vitest'
import { makeRng } from '@/engine/rng'
import { choice, naturalOrder } from './kit'

describe('choice with keepOrder', () => {
  it('shows options in their natural order, so the right answer is not always first', () => {
    const labels = (correct: string, wrong: string[]) => {
      const it = choice({ rng: makeRng(1), prompt: 'p', correct, wrong, explanation: 'e', keepOrder: true }) as { options: { label: string }[] }
      return it.options.map((o) => o.label)
    }
    expect(labels('Sample C', ['Sample A', 'Sample B'])).toEqual(['Sample A', 'Sample B', 'Sample C'])
    expect(labels('30 cm', ['5 cm', '120 cm', '12.5 cm'])).toEqual(['5 cm', '12.5 cm', '30 cm', '120 cm'])
    expect(labels('Gas', ['Solid', 'Liquid'])).toEqual(['Solid', 'Liquid', 'Gas'])
    expect(labels('Part 10', ['Part 2', 'Part 1'])).toEqual(['Part 1', 'Part 2', 'Part 10'])
    expect(labels('£1,200', ['£950', '£80'])).toEqual(['£80', '£950', '£1,200'])
  })

  it('shuffles when there is no natural order, rather than putting the answer first', () => {
    expect(naturalOrder(['Pie chart', 'Bar chart', 'Pictogram'])).toBeUndefined()
    let first = 0
    for (let seed = 1; seed <= 40; seed++) {
      const it = choice({ rng: makeRng(seed), prompt: 'p', correct: 'Pie chart', wrong: ['Bar chart', 'Pictogram'], explanation: 'e', keepOrder: true }) as { options: { label: string; correct?: boolean }[] }
      if (it.options[0]!.correct) first++
    }
    expect(first).toBeLessThan(30)
  })
})
