import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ChallengeVisual as ChallengeVisualModel } from '../domain/types'
import { ChallengeVisual } from './ChallengeVisual'

describe('Phase 4 challenge visuals', () => {
  it.each<ChallengeVisualModel>([
    { type: 'money', coins: [20, 50, 100] },
    { type: 'clock', hour: 9, minute: 15, endHour: 10, endMinute: 0 },
    { type: 'ruler', start: 3, end: 11, maximum: 15 },
    { type: 'shape', shape: 'pentagon' },
    { type: 'symmetry-grid', leftCells: [{ row: 1, column: 2 }], missingIndexes: [0], showSolution: true },
    { type: 'array', rows: 3, columns: 4, showTotal: true },
    { type: 'sharing', total: 12, groups: 3, showGroups: true },
  ])('renders $type without external assets', (visual) => {
    const { container } = render(<ChallengeVisual visual={visual} reveal />)
    expect(container.firstElementChild).not.toBeNull()
    expect(container.querySelector('img')).toBeNull()
  })
})
