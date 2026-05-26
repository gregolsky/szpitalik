import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { AspectA } from './AspectA'
import type { Plan, Unit } from '@/types'

const unit: Unit = {
  id: 'u1', name: 'Test',
  wards: [
    { id: 'w1', name: 'OIOM', abbrev: 'OIOM', emoji: '🫁', allowedDoctorTypes: [] },
    { id: 'w2', name: 'Anes', abbrev: 'ANES', emoji: null, allowedDoctorTypes: [] },
  ],
  doctors: [
    { id: 'd1', firstName: 'Jan', lastName: 'Nowak', type: 'specialist' },
    { id: 'd2', firstName: 'Anna', lastName: 'Kowal', type: 'resident' },
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
    { date: '2024-01-01', wardId: 'w2', doctorId: 'd2', pinned: false },
  ],
}

describe('AspectA', () => {
  it('renders doctor rows sorted by type then lastName', () => {
    render(
      <AspectA plan={plan} unit={unit} prefsEditMode={false} cellDisplay="abbrev"
        onPrefsChange={vi.fn()} onCellPick={vi.fn()} />,
    )
    const rows = screen.getAllByRole('row')
    expect(rows[1]?.textContent).toContain('Nowak')
    expect(rows[2]?.textContent).toContain('Kowal')
  })

  it('renders abbrev in view mode', () => {
    render(
      <AspectA plan={plan} unit={unit} prefsEditMode={false} cellDisplay="abbrev"
        onPrefsChange={vi.fn()} onCellPick={vi.fn()} />,
    )
    expect(screen.getByText('OIOM')).toBeDefined()
    expect(screen.getByText('ANES')).toBeDefined()
  })

  it('renders emoji in emoji mode', () => {
    render(
      <AspectA plan={plan} unit={unit} prefsEditMode={false} cellDisplay="emoji"
        onPrefsChange={vi.fn()} onCellPick={vi.fn()} />,
    )
    expect(screen.getByText('🫁')).toBeDefined()
  })

  it('cell click toggles exclude: empty → exclude → empty', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <AspectA plan={plan} unit={unit} prefsEditMode={true} cellDisplay="abbrev"
        onPrefsChange={onChange} onCellPick={vi.fn()} />,
    )
    const cells = screen.getAllByRole('cell')
    const firstDataCell = cells.find((c) => c.className.includes('schedule-cell'))!

    fireEvent.click(firstDataCell)
    expect(onChange).toHaveBeenCalledTimes(1)
    const afterFirst = onChange.mock.calls[0]?.[0] as Plan
    expect(afterFirst.exclusions.length).toBe(1)

    rerender(
      <AspectA plan={afterFirst} unit={unit} prefsEditMode={true} cellDisplay="abbrev"
        onPrefsChange={onChange} onCellPick={vi.fn()} />,
    )

    fireEvent.click(firstDataCell)
    const afterSecond = onChange.mock.calls[1]?.[0] as Plan
    expect(afterSecond.exclusions.length).toBe(0)
  })

  it('row block button fills all 31 January days with exclusions, then clears them', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <AspectA plan={plan} unit={unit} prefsEditMode={true} cellDisplay="abbrev"
        onPrefsChange={onChange} onCellPick={vi.fn()} />,
    )
    const blockBtns = screen.getAllByRole('button', { name: /zablokuj cały rząd/i })
    const firstBtn = blockBtns[0]!

    fireEvent.click(firstBtn)
    const afterBlock = onChange.mock.calls[0]?.[0] as Plan
    const d1Excls = afterBlock.exclusions.filter((e) => e.doctorId === 'd1')
    expect(d1Excls.length).toBe(31)

    rerender(
      <AspectA plan={afterBlock} unit={unit} prefsEditMode={true} cellDisplay="abbrev"
        onPrefsChange={onChange} onCellPick={vi.fn()} />,
    )
    const unblockBtns = screen.getAllByRole('button', { name: /odblokuj cały rząd/i })
    fireEvent.click(unblockBtns[0]!)
    const afterUnblock = onChange.mock.calls[1]?.[0] as Plan
    expect(afterUnblock.exclusions.filter((e) => e.doctorId === 'd1').length).toBe(0)
  })

  it('single click in view mode opens ward picker after delay', () => {
    vi.useFakeTimers()
    render(
      <AspectA plan={plan} unit={unit} prefsEditMode={false} cellDisplay="abbrev"
        onPrefsChange={vi.fn()} onCellPick={vi.fn()} />,
    )
    const cells = screen.getAllByRole('cell')
    const firstDataCell = cells.find((c) => c.className.includes('schedule-cell'))!

    fireEvent.click(firstDataCell)
    act(() => { vi.advanceTimersByTime(250) })

    expect(screen.getByText('Odepnij')).toBeDefined()
    // ward names appear in the picker list
    expect(screen.getByText(/OIOM/, { selector: 'li' })).toBeDefined()
    vi.useRealTimers()
  })

  it('double click in view mode calls onCellPick with null wardId', () => {
    vi.useFakeTimers()
    const onCellPick = vi.fn()
    render(
      <AspectA plan={plan} unit={unit} prefsEditMode={false} cellDisplay="abbrev"
        onPrefsChange={vi.fn()} onCellPick={onCellPick} />,
    )
    const cells = screen.getAllByRole('cell')
    const firstDataCell = cells.find((c) => c.className.includes('schedule-cell'))!

    fireEvent.dblClick(firstDataCell)
    act(() => { vi.advanceTimersByTime(250) })

    expect(onCellPick).toHaveBeenCalledTimes(1)
    const [date, doctorId, wardId] = onCellPick.mock.calls[0]!
    expect(typeof date).toBe('string')
    expect(typeof doctorId).toBe('string')
    expect(wardId).toBeNull()
    expect(screen.queryByText('Odepnij')).toBeNull()
    vi.useRealTimers()
  })
})
