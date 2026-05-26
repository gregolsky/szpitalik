import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AspectA } from './AspectA'
import type { Plan, Unit } from '@/types'

const unit: Unit = {
  id: 'u1', name: 'Test',
  wards: [
    { id: 'w1', name: 'OIOM', abbrev: 'OIOM', emoji: '🫁' },
    { id: 'w2', name: 'Anes', abbrev: 'ANES', emoji: null },
  ],
  doctors: [
    { id: 'd1', firstName: 'Jan', lastName: 'Nowak', type: 'specialist' },
    { id: 'd2', firstName: 'Anna', lastName: 'Kowal', type: 'resident' },
  ],
  tags: [], rules: [],
}

const plan: Plan = {
  id: 'p1', unitId: 'u1', year: 2024, month: 1, label: null,
  preferences: [], exclusions: [],
  assignments: [
    { date: '2024-01-01', wardId: 'w1', doctorId: 'd1', pinned: false },
    { date: '2024-01-01', wardId: 'w2', doctorId: 'd2', pinned: false },
  ],
}

describe('AspectA', () => {
  it('renders doctor rows sorted by lastName', () => {
    render(
      <AspectA plan={plan} unit={unit} prefsEditMode={false} cellDisplay="abbrev"
        onPrefsChange={vi.fn()} onTogglePin={vi.fn()} />,
    )
    const rows = screen.getAllByRole('row')
    expect(rows[1]?.textContent).toContain('Kowal')
    expect(rows[2]?.textContent).toContain('Nowak')
  })

  it('renders abbrev in view mode', () => {
    render(
      <AspectA plan={plan} unit={unit} prefsEditMode={false} cellDisplay="abbrev"
        onPrefsChange={vi.fn()} onTogglePin={vi.fn()} />,
    )
    expect(screen.getByText('OIOM')).toBeDefined()
    expect(screen.getByText('ANES')).toBeDefined()
  })

  it('renders emoji in emoji mode', () => {
    render(
      <AspectA plan={plan} unit={unit} prefsEditMode={false} cellDisplay="emoji"
        onPrefsChange={vi.fn()} onTogglePin={vi.fn()} />,
    )
    expect(screen.getByText('🫁')).toBeDefined()
  })

  it('cell click cycles prefs in edit mode: empty → prefer → exclude → empty', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <AspectA plan={plan} unit={unit} prefsEditMode={true} cellDisplay="abbrev"
        onPrefsChange={onChange} onTogglePin={vi.fn()} />,
    )
    const cells = screen.getAllByRole('cell')
    const firstDataCell = cells.find((c) => c.className.includes('schedule-cell'))!

    fireEvent.click(firstDataCell)
    expect(onChange).toHaveBeenCalledTimes(1)
    const afterFirst = onChange.mock.calls[0]?.[0] as Plan
    expect(afterFirst.preferences.length).toBe(1)

    rerender(
      <AspectA plan={afterFirst} unit={unit} prefsEditMode={true} cellDisplay="abbrev"
        onPrefsChange={onChange} onTogglePin={vi.fn()} />,
    )

    fireEvent.click(firstDataCell)
    const afterSecond = onChange.mock.calls[1]?.[0] as Plan
    expect(afterSecond.exclusions.length).toBe(1)
    expect(afterSecond.preferences.length).toBe(0)

    rerender(
      <AspectA plan={afterSecond} unit={unit} prefsEditMode={true} cellDisplay="abbrev"
        onPrefsChange={onChange} onTogglePin={vi.fn()} />,
    )

    fireEvent.click(firstDataCell)
    const afterThird = onChange.mock.calls[2]?.[0] as Plan
    expect(afterThird.preferences.length).toBe(0)
    expect(afterThird.exclusions.length).toBe(0)
  })
})
