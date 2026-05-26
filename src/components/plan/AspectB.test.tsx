import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
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
    render(<AspectB plan={plan} unit={unit} onCellPick={vi.fn()} />)
    expect(screen.getByText(/OIOM/)).toBeDefined()
  })

  it('shows doctor name in ward row for assigned day', () => {
    render(<AspectB plan={plan} unit={unit} onCellPick={vi.fn()} />)
    expect(screen.getByText(/Nowak J\./)).toBeDefined()
  })

  it('single click opens doctor picker after delay', () => {
    vi.useFakeTimers()
    render(<AspectB plan={plan} unit={unit} onCellPick={vi.fn()} />)
    const cells = screen.getAllByRole('cell')
    const firstDataCell = cells.find((c) => c.className.includes('schedule-cell'))!

    fireEvent.click(firstDataCell)
    act(() => { vi.advanceTimersByTime(250) })

    expect(screen.getByText(/Nowak J\./, { selector: 'li' })).toBeDefined()
    expect(screen.getByText('Odepnij')).toBeDefined()
    vi.useRealTimers()
  })

  it('picking a doctor calls onCellPick with doctorId', () => {
    vi.useFakeTimers()
    const onCellPick = vi.fn()
    render(<AspectB plan={plan} unit={unit} onCellPick={onCellPick} />)
    const cells = screen.getAllByRole('cell')
    const firstDataCell = cells.find((c) => c.className.includes('schedule-cell'))!

    fireEvent.click(firstDataCell)
    act(() => { vi.advanceTimersByTime(250) })

    const doctorItem = screen.getByText(/Nowak J\./, { selector: 'li' })
    fireEvent.mouseDown(doctorItem)

    expect(onCellPick).toHaveBeenCalledTimes(1)
    const [date, wardId, doctorId] = onCellPick.mock.calls[0]!
    expect(date).toBe('2024-01-01')
    expect(wardId).toBe('w1')
    expect(doctorId).toBe('d1')
    vi.useRealTimers()
  })

  it('double click calls onCellPick with null doctorId', () => {
    vi.useFakeTimers()
    const onCellPick = vi.fn()
    render(<AspectB plan={plan} unit={unit} onCellPick={onCellPick} />)
    const cells = screen.getAllByRole('cell')
    const firstDataCell = cells.find((c) => c.className.includes('schedule-cell'))!

    fireEvent.dblClick(firstDataCell)
    act(() => { vi.advanceTimersByTime(250) })

    expect(onCellPick).toHaveBeenCalledTimes(1)
    const [, , doctorId] = onCellPick.mock.calls[0]!
    expect(doctorId).toBeNull()
    expect(screen.queryByText('Odepnij')).toBeNull()
    vi.useRealTimers()
  })
})
