import { describe, expect, it } from 'vitest'
import { zurichDateKey } from './date'

describe('Zurich calendar day', () => {
  it('uses Europe/Zurich rather than the runtime time zone', () => {
    expect(zurichDateKey(new Date('2026-08-31T21:59:59.000Z'))).toBe('2026-08-31')
    expect(zurichDateKey(new Date('2026-08-31T22:00:00.000Z'))).toBe('2026-09-01')
  })

  it('handles winter offset', () => {
    expect(zurichDateKey(new Date('2026-12-31T23:30:00.000Z'))).toBe('2027-01-01')
  })
})
