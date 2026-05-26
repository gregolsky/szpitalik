import { describe, it, expect } from 'vitest'
import { daysInMonth, formatDate, generateSlots } from './date'

describe('daysInMonth', () => {
  it('returns 31 for January', () => expect(daysInMonth(2024, 1)).toBe(31))
  it('returns 28 for Feb non-leap', () => expect(daysInMonth(2023, 2)).toBe(28))
  it('returns 29 for Feb leap year', () => expect(daysInMonth(2024, 2)).toBe(29))
  it('returns 30 for April', () => expect(daysInMonth(2024, 4)).toBe(30))
  it('returns 31 for December', () => expect(daysInMonth(2024, 12)).toBe(31))
})

describe('formatDate', () => {
  it('pads month and day', () => expect(formatDate(2024, 3, 5)).toBe('2024-03-05'))
  it('handles two-digit values', () => expect(formatDate(2024, 12, 31)).toBe('2024-12-31'))
})

describe('generateSlots', () => {
  it('generates correct number of slots', () => {
    const slots = generateSlots(2024, 2, ['w1', 'w2'])
    expect(slots).toHaveLength(29 * 2)
  })
  it('first slot is correct date and wardId', () => {
    const slots = generateSlots(2024, 1, ['w1'])
    expect(slots[0]).toEqual({ date: '2024-01-01', wardId: 'w1' })
  })
})
