import { describe, it, expect } from 'vitest'
import {
  exclusionPenalty,
  eligibilityPenalty,
  doubleBookingPenalty,
  pinnedSlotPenalty,
  dailyCountPenalty,
  nullSlotPenalty,
  maxDutiesPenalty,
  consecutivePenalty,
  PENALTY,
} from './fitness'
import type { Assignment, Unit, Plan } from '@/types'

const makeUnit = (): Unit => ({
  id: 'u1',
  name: 'Test',
  wards: [{ id: 'w1', name: 'Ward1', abbrev: 'WR1', emoji: null, allowedDoctorTypes: ['specialist'] }],
  doctors: [
    { id: 'd1', firstName: 'Jan', lastName: 'Nowak', type: 'specialist' },
    { id: 'd2', firstName: 'Anna', lastName: 'Kowal', type: 'resident' },
  ],
  rules: [],
  defaultMaxDuties: 6,
  allowConsecutiveDuties: false,
})

const makePlan = (): Plan => ({
  id: 'p1', unitId: 'u1', year: 2024, month: 1, label: null,
  exclusions: [], assignments: [], doctorMaxDuties: {},
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

describe('maxDutiesPenalty', () => {
  const makeUnitAndPlan = (cap: number, doctorId = 'd1'): { unit: Unit; plan: Plan } => {
    const unit: Unit = {
      ...makeUnit(),
      wards: [{ id: 'w1', name: 'Ward1', abbrev: 'WR1', emoji: null, allowedDoctorTypes: [] }],
    }
    const plan: Plan = { ...makePlan(), doctorMaxDuties: { [doctorId]: cap } }
    return { unit, plan }
  }

  it('penalises each assignment over cap=0', () => {
    const { unit, plan } = makeUnitAndPlan(0)
    const a: Assignment[] = [
      makeAssignment('d1', '2024-01-01'),
      makeAssignment('d1', '2024-01-02'),
      makeAssignment('d1', '2024-01-03'),
    ]
    expect(maxDutiesPenalty(a, unit, plan)).toBe(PENALTY.MAX_DUTIES * 3)
  })

  it('penalises only excess over positive cap', () => {
    const { unit, plan } = makeUnitAndPlan(3)
    const a: Assignment[] = [
      makeAssignment('d1', '2024-01-01'),
      makeAssignment('d1', '2024-01-02'),
      makeAssignment('d1', '2024-01-03'),
      makeAssignment('d1', '2024-01-04'),
      makeAssignment('d1', '2024-01-05'),
    ]
    expect(maxDutiesPenalty(a, unit, plan)).toBe(PENALTY.MAX_DUTIES * 2)
  })

  it('no penalty when within cap', () => {
    const { unit, plan } = makeUnitAndPlan(3)
    const a: Assignment[] = [
      makeAssignment('d1', '2024-01-01'),
      makeAssignment('d1', '2024-01-02'),
      makeAssignment('d1', '2024-01-03'),
    ]
    expect(maxDutiesPenalty(a, unit, plan)).toBe(0)
  })

  it('uses unit default when no override', () => {
    const unit: Unit = { ...makeUnit(), defaultMaxDuties: 2 }
    const plan: Plan = { ...makePlan(), doctorMaxDuties: {} }
    const a: Assignment[] = [
      makeAssignment('d1', '2024-01-01'),
      makeAssignment('d1', '2024-01-02'),
      makeAssignment('d1', '2024-01-03'),
    ]
    expect(maxDutiesPenalty(a, unit, plan)).toBe(PENALTY.MAX_DUTIES * 1)
  })
})

describe('consecutivePenalty', () => {
  it('penalises same doctor on consecutive days', () => {
    const unit = makeUnit()
    const a: Assignment[] = [
      makeAssignment('d1', '2024-01-05'),
      makeAssignment('d1', '2024-01-06'),
    ]
    expect(consecutivePenalty(a, unit)).toBe(PENALTY.HARD)
  })

  it('no penalty when allowConsecutiveDuties is true', () => {
    const unit: Unit = { ...makeUnit(), allowConsecutiveDuties: true }
    const a: Assignment[] = [
      makeAssignment('d1', '2024-01-05'),
      makeAssignment('d1', '2024-01-06'),
    ]
    expect(consecutivePenalty(a, unit)).toBe(0)
  })

  it('no penalty for non-consecutive days', () => {
    const unit = makeUnit()
    const a: Assignment[] = [
      makeAssignment('d1', '2024-01-05'),
      makeAssignment('d1', '2024-01-07'),
    ]
    expect(consecutivePenalty(a, unit)).toBe(0)
  })

  it('counts multiple pairs independently', () => {
    const unit = makeUnit()
    const a: Assignment[] = [
      makeAssignment('d1', '2024-01-05'),
      makeAssignment('d1', '2024-01-06'),
      makeAssignment('d1', '2024-01-07'),
    ]
    expect(consecutivePenalty(a, unit)).toBe(PENALTY.HARD * 2)
  })
})
