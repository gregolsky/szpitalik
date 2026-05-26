import { describe, it, expect } from 'vitest'
import { sortDoctorsByLastName } from './sort'
import type { Doctor } from '@/types'

const makeDr = (lastName: string, firstName = 'A'): Doctor => ({
  id: lastName,
  firstName,
  lastName,
  type: 'resident',
})

describe('sortDoctorsByLastName', () => {
  it('sorts ascending by lastName', () => {
    const result = sortDoctorsByLastName([makeDr('Ząbek'), makeDr('Adamski'), makeDr('Nowak')])
    expect(result.map((d) => d.lastName)).toEqual(['Adamski', 'Nowak', 'Ząbek'])
  })

  it('does not mutate original array', () => {
    const orig = [makeDr('Żuk'), makeDr('Akon')]
    const sorted = sortDoctorsByLastName(orig)
    expect(orig[0]!.lastName).toBe('Żuk')
    expect(sorted[0]!.lastName).toBe('Akon')
  })
})
