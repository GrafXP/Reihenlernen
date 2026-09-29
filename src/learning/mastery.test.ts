import { describe, expect, it } from 'vitest'
import { emptyMastery } from '../curriculum/skills'
import { recordMasteryEvidence } from './mastery'
const evidence = { skillId: 'table-12' as const, representation: 'symbolic' as const,
  dateKey: '2026-09-29', completedAt: '2026-09-29T10:00:00Z', wrongAnswers: 0, hintUsed: false }
describe('mastery of every fact', () => {
  it('keeps a row practising until all twelve facts have independent evidence', () => {
    let state = emptyMastery('table-12')
    for (let factor = 1; factor <= 11; factor += 1) state = recordMasteryEvidence(state, { ...evidence, factor })
    expect(state.band).toBe('practising')
    state = recordMasteryEvidence(state, { ...evidence, factor: 12 })
    expect(state.band).toBe('secure')
    expect(Object.keys(state.factSuccesses)).toHaveLength(12)
    expect(state.nextReviewDate).toBe('2026-10-13')
  })
  it('does not treat assisted or corrected answers as independent fact evidence', () => {
    let state = emptyMastery('table-12')
    state = recordMasteryEvidence(state, { ...evidence, factor: 12, hintUsed: true })
    state = recordMasteryEvidence(state, { ...evidence, factor: 11, wrongAnswers: 1 })
    expect(state.factSuccesses).toEqual({})
    expect(state.band).not.toBe('secure')
  })
})
