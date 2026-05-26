import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AspectB } from './AspectB'
import type { Plan, Unit } from '@/types'

const unit: Unit = {
  id: 'u1', name: 'Test',
  wards: [
    { id: 'w1', name: 'OIOM', abbrev: 'OIOM', emoji: '🫁', allowedDoctorTypes: [] },
  ],
  doctors: [
    { id: 'd1', firstName: 'Jan', lastName: 'Nowak', type: 'specialist' },
  ],
  rules: [],
  defaultMaxDuties: 6,
  allowConsecutiveDuties: false,
}

const plan: Plan = {
  id: 'p1', unitId: 'u1', year: 2024, month: 1, label: null,
  exclusions: [], doctorMaxDuties: {},
  assignments: [
    { date: '2024-01-01', wardId: 'w1', doctorId: 'd1', pinned: false },
  ],
}

describe('AspectB', () => {
  it('renders ward rows', () => {
    render(<AspectB plan={plan} unit={unit} />)
    expect(screen.getByText(/OIOM/)).toBeDefined()
  })

  it('shows doctor name in ward row for assigned day', () => {
    render(<AspectB plan={plan} unit={unit} />)
    expect(screen.getByText('Nowak J.')).toBeDefined()
  })
})
