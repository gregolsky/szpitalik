import { describe, it, expect } from 'vitest'
import { validateWardAbbrev, validateRuleRefs, validateMaxDutiesValue } from './validators'
import type { Unit } from '@/types'

describe('validateWardAbbrev', () => {
  it('accepts 2-4 uppercase letters', () => {
    expect(validateWardAbbrev('AB')).toBe(true)
    expect(validateWardAbbrev('OIOM')).toBe(true)
    expect(validateWardAbbrev('ANE')).toBe(true)
  })

  it('rejects lowercase', () => expect(validateWardAbbrev('oiom')).toBe(false))
  it('rejects too short', () => expect(validateWardAbbrev('A')).toBe(false))
  it('rejects too long', () => expect(validateWardAbbrev('OIOMS')).toBe(false))
  it('rejects digits', () => expect(validateWardAbbrev('OI1M')).toBe(false))
  it('rejects empty', () => expect(validateWardAbbrev('')).toBe(false))
})

describe('validateRuleRefs', () => {
  const unit: Unit = {
    id: 'u1', name: 'U', wards: [{ id: 'w1', name: 'W', abbrev: 'WW', emoji: null, allowedDoctorTypes: [] }],
    doctors: [], rules: [], defaultMaxDuties: 6, allowConsecutiveDuties: false,
  }

  it('daily_count rule always passes ref check', () => {
    expect(validateRuleRefs({ kind: 'daily_count', id: 'r1', doctorType: 'specialist', minCount: 1 }, unit)).toBe(true)
  })
})

describe('validateMaxDutiesValue', () => {
  it('accepts 0', () => expect(validateMaxDutiesValue(0)).toBe(true))
  it('accepts positive integer', () => expect(validateMaxDutiesValue(5)).toBe(true))
  it('accepts 31', () => expect(validateMaxDutiesValue(31)).toBe(true))
  it('rejects negative', () => expect(validateMaxDutiesValue(-1)).toBe(false))
  it('rejects non-integer', () => expect(validateMaxDutiesValue(2.5)).toBe(false))
  it('rejects above 31', () => expect(validateMaxDutiesValue(32)).toBe(false))
})
