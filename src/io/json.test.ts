import { describe, it, expect } from 'vitest'
import { parseImportFile } from './importJson'
import type { Unit, Plan } from '@/types'
import { SCHEMA_VERSION } from '@/types'
import type { FullSnapshot, SinglePlanExport } from './exportJson'

const makeUnit = (): Unit => ({
  id: 'u1', name: 'Szpital', wards: [], doctors: [], tags: [], rules: [],
})

const makePlan = (): Plan => ({
  id: 'p1', unitId: 'u1', year: 2024, month: 3, label: 'Wersja 1',
  preferences: [], exclusions: [],
  assignments: [{ date: '2024-03-01', wardId: 'w1', doctorId: 'd1', pinned: true }],
})

describe('parseImportFile — full snapshot', () => {
  it('round-trips unit and plans', () => {
    const payload: FullSnapshot = {
      schemaVersion: SCHEMA_VERSION,
      type: 'full_snapshot',
      unit: makeUnit(),
      plans: [makePlan()],
    }
    const result = parseImportFile(JSON.stringify(payload))
    expect(result.type).toBe('full_snapshot')
    if (result.type === 'full_snapshot') {
      expect(result.unit.id).toBe('u1')
      expect(result.plans[0]?.label).toBe('Wersja 1')
      expect(result.plans[0]?.assignments[0]?.pinned).toBe(true)
    }
  })
})

describe('parseImportFile — single plan', () => {
  it('round-trips plan with label and pinned', () => {
    const payload: SinglePlanExport = {
      schemaVersion: SCHEMA_VERSION,
      type: 'single_plan',
      unitRef: { id: 'u1', name: 'Szpital' },
      plan: makePlan(),
    }
    const result = parseImportFile(JSON.stringify(payload))
    expect(result.type).toBe('single_plan')
    if (result.type === 'single_plan') {
      expect(result.plan.label).toBe('Wersja 1')
      expect(result.plan.assignments[0]?.pinned).toBe(true)
    }
  })

  it('throws on wrong schema version', () => {
    const bad = JSON.stringify({ schemaVersion: 99, type: 'single_plan', unitRef: {}, plan: {} })
    expect(() => parseImportFile(bad)).toThrow()
  })

  it('throws on invalid JSON', () => {
    expect(() => parseImportFile('not json')).toThrow()
  })
})
