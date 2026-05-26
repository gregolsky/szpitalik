import { describe, it, expect } from 'vitest'
import {
  exclusionPenalty,
  eligibilityPenalty,
  doubleBookingPenalty,
  pinnedSlotPenalty,
  preferencesPenalty,
  dailyCountPenalty,
  nullSlotPenalty,
  PENALTY,
} from './fitness'
import type { Assignment, Unit, Plan } from '@/types'

const makeUnit = (): Unit => ({
  id: 'u1',
  name: 'Test',
  wards: [{ id: 'w1', name: 'Ward1', abbrev: 'WR1', emoji: null }],
  doctors: [
    { id: 'd1', firstName: 'Jan', lastName: 'Nowak', type: 'specialist' },
    { id: 'd2', firstName: 'Anna', lastName: 'Kowal', type: 'resident' },
  ],
  tags: [{ id: 't1', name: 'spec', allowedTypes: ['specialist'] }],
  rules: [{ kind: 'ward_eligibility', id: 'r1', wardId: 'w1', tagId: 't1' }],
})

const makePlan = (): Plan => ({
  id: 'p1', unitId: 'u1', year: 2024, month: 1, label: null,
  preferences: [], exclusions: [], assignments: [],
})

const makeAssignment = (doctorId: string, date: string, wardId = 'w1', pinned = false): Assignment => ({
  date, wardId, doctorId, pinned,
})

describe('exclusionPenalty', () => {
  it('returns 0 when no exclusions', () => {
    const plan = makePlan()
    const a = [makeAssignment('d1', '2024-01-01')]
    expect(exclusionPenalty(a, plan)).toBe(0)
  })

  it('penalises breach', () => {
    const plan = { ...makePlan(), exclusions: [{ doctorId: 'd1', date: '2024-01-01' }] }
    const a = [makeAssignment('d1', '2024-01-01')]
    expect(exclusionPenalty(a, plan)).toBe(PENALTY.HARD)
  })
})

describe('eligibilityPenalty', () => {
  it('penalises ineligible doctor', () => {
    const unit = makeUnit()
    const a = [makeAssignment('d2', '2024-01-01')]
    expect(eligibilityPenalty(a, unit)).toBe(PENALTY.HARD)
  })

  it('no penalty for eligible doctor', () => {
    const unit = makeUnit()
    const a = [makeAssignment('d1', '2024-01-01')]
    expect(eligibilityPenalty(a, unit)).toBe(0)
  })
})

describe('doubleBookingPenalty', () => {
  it('penalises double booking', () => {
    const a: Assignment[] = [
      { date: '2024-01-01', wardId: 'w1', doctorId: 'd1', pinned: false },
      { date: '2024-01-01', wardId: 'w2', doctorId: 'd1', pinned: false },
    ]
    expect(doubleBookingPenalty(a)).toBe(PENALTY.HARD)
  })

  it('no penalty for different dates', () => {
    const a: Assignment[] = [
      { date: '2024-01-01', wardId: 'w1', doctorId: 'd1', pinned: false },
      { date: '2024-01-02', wardId: 'w1', doctorId: 'd1', pinned: false },
    ]
    expect(doubleBookingPenalty(a)).toBe(0)
  })
})

describe('pinnedSlotPenalty', () => {
  it('penalises overridden pinned slot', () => {
    const pinned: Assignment[] = [{ date: '2024-01-01', wardId: 'w1', doctorId: 'd1', pinned: true }]
    const current: Assignment[] = [{ date: '2024-01-01', wardId: 'w1', doctorId: 'd2', pinned: false }]
    expect(pinnedSlotPenalty(current, pinned)).toBe(PENALTY.HARD)
  })

  it('no penalty when pinned slot preserved', () => {
    const pinned: Assignment[] = [{ date: '2024-01-01', wardId: 'w1', doctorId: 'd1', pinned: true }]
    const current: Assignment[] = [{ date: '2024-01-01', wardId: 'w1', doctorId: 'd1', pinned: true }]
    expect(pinnedSlotPenalty(current, pinned)).toBe(0)
  })
})

describe('preferencesPenalty', () => {
  it('penalises unmet preference', () => {
    const plan = { ...makePlan(), preferences: [{ doctorId: 'd1', date: '2024-01-01' }] }
    const a: Assignment[] = [{ date: '2024-01-01', wardId: 'w1', doctorId: 'd2', pinned: false }]
    expect(preferencesPenalty(a, plan)).toBe(PENALTY.SOFT)
  })

  it('no penalty when preference met', () => {
    const plan = { ...makePlan(), preferences: [{ doctorId: 'd1', date: '2024-01-01' }] }
    const a: Assignment[] = [{ date: '2024-01-01', wardId: 'w1', doctorId: 'd1', pinned: false }]
    expect(preferencesPenalty(a, plan)).toBe(0)
  })
})

describe('dailyCountPenalty', () => {
  it('penalises missing daily count', () => {
    const unit: Unit = {
      ...makeUnit(),
      rules: [{ kind: 'daily_count', id: 'r1', doctorType: 'specialist', minCount: 2 }],
    }
    const a: Assignment[] = [{ date: '2024-01-01', wardId: 'w1', doctorId: 'd1', pinned: false }]
    expect(dailyCountPenalty(a, unit)).toBe(PENALTY.SOFT * 1)
  })
})

describe('nullSlotPenalty', () => {
  it('penalises null slots', () => {
    const a: Assignment[] = [{ date: '2024-01-01', wardId: 'w1', doctorId: null, pinned: false }]
    expect(nullSlotPenalty(a)).toBe(PENALTY.NULL_SLOT)
  })

  it('no penalty when all filled', () => {
    const a: Assignment[] = [{ date: '2024-01-01', wardId: 'w1', doctorId: 'd1', pinned: false }]
    expect(nullSlotPenalty(a)).toBe(0)
  })
})
