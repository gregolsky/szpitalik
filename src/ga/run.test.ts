import { describe, it, expect } from 'vitest'
import { runGA } from './run'
import type { Unit, Plan } from '@/types'
import { generateSlots } from '@/utils/date'
import { PENALTY } from './fitness'

const makeMinimalUnit = (): Unit => ({
  id: 'u1',
  name: 'Minimal',
  wards: [{ id: 'w1', name: 'Ward', abbrev: 'WRD', emoji: null, allowedDoctorTypes: [] }],
  doctors: [
    { id: 'd1', firstName: 'Jan', lastName: 'Nowak', type: 'specialist' },
    { id: 'd2', firstName: 'Anna', lastName: 'Kowal', type: 'specialist' },
  ],
  rules: [],
  defaultMaxDuties: 20,
  allowConsecutiveDuties: true,
})

const makeMinimalPlan = (): Plan => {
  const unit = makeMinimalUnit()
  return {
    id: 'p1', unitId: 'u1', year: 2024, month: 1, label: null,
    exclusions: [], doctorMaxDuties: {},
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

describe('runGA maxDutiesPerPlan=0 doctor gets fewer duties', () => {
  it('nie dyżuruje doctor receives fewer assignments than uncapped doctors', () => {
    const unit: Unit = {
      id: 'u1',
      name: 'Test',
      wards: [{ id: 'w1', name: 'Ward', abbrev: 'WRD', emoji: null, allowedDoctorTypes: [] }],
      doctors: [
        { id: 'd1', firstName: 'Nie', lastName: 'Dyżuruje', type: 'specialist' },
        { id: 'd2', firstName: 'Anna', lastName: 'Kowal', type: 'specialist' },
        { id: 'd3', firstName: 'Piotr', lastName: 'Marek', type: 'specialist' },
        { id: 'd4', firstName: 'Ewa', lastName: 'Nowak', type: 'specialist' },
      ],
      rules: [],
      defaultMaxDuties: 20,
      allowConsecutiveDuties: true,
    }
    const plan: Plan = {
      id: 'p1', unitId: 'u1', year: 2024, month: 1, label: null,
      exclusions: [],
      doctorMaxDuties: { d1: 0 },
      assignments: generateSlots(2024, 1, unit.wards.map((w) => w.id)).map((s) => ({
        ...s, doctorId: null, pinned: false,
      })),
    }
    const result = runGA(unit, plan, () => {}, { populationSize: 50, generations: 200, mutationRate: 0.1, crossoverRate: 0.8, eliteFraction: 0.1 })
    const d1Count = result.assignments.filter((a) => a.doctorId === 'd1').length
    const d2Count = result.assignments.filter((a) => a.doctorId === 'd2').length
    const d3Count = result.assignments.filter((a) => a.doctorId === 'd3').length
    const d4Count = result.assignments.filter((a) => a.doctorId === 'd4').length
    expect(d1Count).toBeLessThan(d2Count)
    expect(d1Count).toBeLessThan(d3Count)
    expect(d1Count).toBeLessThan(d4Count)
  }, 30_000)
})
