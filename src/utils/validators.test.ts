import { describe, it, expect } from 'vitest'
import { validateWardAbbrev, validateTagAllowedTypes, validateRuleRefs } from './validators'
import type { Tag, Unit } from '@/types'

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

describe('validateTagAllowedTypes', () => {
  const tag = (types: string[]): Tag => ({ id: '1', name: 'x', allowedTypes: types as Tag['allowedTypes'] })
  it('accepts non-empty', () => expect(validateTagAllowedTypes(tag(['resident']))).toBe(true))
  it('rejects empty', () => expect(validateTagAllowedTypes(tag([]))).toBe(false))
})

describe('validateRuleRefs', () => {
  const unit: Unit = {
    id: 'u1', name: 'U', wards: [{ id: 'w1', name: 'W', abbrev: 'WW', emoji: null }],
    doctors: [], tags: [{ id: 't1', name: 'T', allowedTypes: ['specialist'] }], rules: [],
  }

  it('passes when wardId and tagId exist', () => {
    expect(validateRuleRefs({ kind: 'ward_eligibility', id: 'r1', wardId: 'w1', tagId: 't1' }, unit)).toBe(true)
  })

  it('fails when wardId missing', () => {
    expect(validateRuleRefs({ kind: 'ward_eligibility', id: 'r1', wardId: 'bad', tagId: 't1' }, unit)).toBe(false)
  })

  it('fails when tagId missing', () => {
    expect(validateRuleRefs({ kind: 'ward_eligibility', id: 'r1', wardId: 'w1', tagId: 'bad' }, unit)).toBe(false)
  })

  it('daily_count rule always passes ref check', () => {
    expect(validateRuleRefs({ kind: 'daily_count', id: 'r1', doctorType: 'specialist', minCount: 1 }, unit)).toBe(true)
  })
})
