import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CellPicker } from './CellPicker'

const anchor = new DOMRect(100, 100, 80, 28)

const options = [
  { id: 'w1', label: 'OIOM' },
  { id: 'w2', label: 'Anes' },
]

describe('CellPicker', () => {
  it('renders Odepnij as first item', () => {
    render(<CellPicker options={options} anchorRect={anchor} onPick={vi.fn()} onUnpin={vi.fn()} onClose={vi.fn()} />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]?.textContent).toBe('Odepnij')
  })

  it('renders option labels in order', () => {
    render(<CellPicker options={options} anchorRect={anchor} onPick={vi.fn()} onUnpin={vi.fn()} onClose={vi.fn()} />)
    const items = screen.getAllByRole('listitem')
    expect(items[1]?.textContent).toBe('OIOM')
    expect(items[2]?.textContent).toBe('Anes')
  })

  it('clicking an option calls onPick with id', () => {
    const onPick = vi.fn()
    render(<CellPicker options={options} anchorRect={anchor} onPick={onPick} onUnpin={vi.fn()} onClose={vi.fn()} />)
    fireEvent.mouseDown(screen.getByText('OIOM'))
    expect(onPick).toHaveBeenCalledWith('w1')
  })

  it('clicking Odepnij calls onUnpin', () => {
    const onUnpin = vi.fn()
    render(<CellPicker options={options} anchorRect={anchor} onPick={vi.fn()} onUnpin={onUnpin} onClose={vi.fn()} />)
    fireEvent.mouseDown(screen.getByText('Odepnij'))
    expect(onUnpin).toHaveBeenCalledTimes(1)
  })

  it('pressing Escape calls onClose', () => {
    const onClose = vi.fn()
    render(<CellPicker options={options} anchorRect={anchor} onPick={vi.fn()} onUnpin={vi.fn()} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('mousedown outside the picker calls onClose', () => {
    const onClose = vi.fn()
    render(<CellPicker options={options} anchorRect={anchor} onPick={vi.fn()} onUnpin={vi.fn()} onClose={onClose} />)
    fireEvent.mouseDown(document.body)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
