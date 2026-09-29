import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createDefaultData } from '../domain/data'
import { TablePicker } from './TablePicker'
describe('row selection', () => {
  it('shows all ten rows and preserves at least one selected row', () => {
    const onSelect = vi.fn()
    const onLearn = vi.fn()
    render(<TablePicker data={createDefaultData()} selected={[12]} locked={false} onSelect={onSelect} onLearn={onLearn} />)
    expect(screen.getAllByRole('button', { name: /er-Reihe auswählen/ })).toHaveLength(10)
    expect(screen.getByRole('button', { name: '12er-Reihe auswählen' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '11er-Reihe auswählen' }))
    expect(onSelect).toHaveBeenCalledWith([12, 11])
    fireEvent.click(screen.getByRole('button', { name: '12er-Reihe lernen' }))
    expect(onLearn).toHaveBeenCalledWith(12)
  })
})
