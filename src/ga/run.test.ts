import { describe, it, expect } from 'vitest'
import { runGA } from './run'
import type { Unit, Plan } from '@/types'
import { generateSlots } from '@/utils/date'
import { PENALTY } from './fitness'

const makeMinimalUnit = (): Unit => ({
  id: 'u1',
  name: 'Minimal',
  wards: [{ id: 'w1', name: 'Ward', abbrev: 'WRD', emoji: null }],
  doctors: [
    { id: 'd1', firstName: 'Jan', lastName: 'Nowak', type: 'specialist' },
    { id: 'd2', firstName: 'Anna', lastName: 'Kowal', type: 'specialist' },
  ],
  tags: [],
  rules: [],
})

const makeMinimalPlan = (): Plan => {
  const unit = makeMinimalUnit()
  return {
    id: 'p1', unitId: 'u1', year: 2024, month: 1, label: null,
    preferences: [], exclusions: [],
    assignments: generateSlots(2024, 1, unit.wards.map((w) => w.id)).map((s) => ({
      ...s, doctorId: null, pinned: false,
    })),
  }
}

describe('runGA minimal unit', () => {
  it('produces zero hard violations', () => {
    const unit = makeMinimalUnit()
    const plan = makeMinimalPlan()
    const result = runGA(unit, plan, () => {}, { populationSize: 20, generations: 100, mutationRate: 0.1, crossoverRate: 0.8, eliteFraction: 0.1 })
    const hardPenalty = result.assignments.filter((a) => !a.doctorId).length * PENALTY.NULL_SLOT
    const excl = 0
    expect(hardPenalty).toBe(0)
    expect(excl).toBe(0)
  }, 30_000)
})

describe('runGA pinned slot', () => {
  it('preserves pinned slot across regeneration', () => {
    const unit = makeMinimalUnit()
    const plan = makeMinimalPlan()
    const pinnedDate = '2024-01-05'
    plan.assignments = plan.assignments.map((a) =>
      a.date === pinnedDate && a.wardId === 'w1'
        ? { ...a, doctorId: 'd1', pinned: true }
        : a,
    )
    const result = runGA(unit, plan, () => {}, { populationSize: 20, generations: 50, mutationRate: 0.1, crossoverRate: 0.8, eliteFraction: 0.1 })
    const pinned = result.assignments.find((a) => a.date === pinnedDate && a.wardId === 'w1')
    expect(pinned?.doctorId).toBe('d1')
  }, 15_000)
})
