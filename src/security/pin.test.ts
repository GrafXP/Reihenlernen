import { describe, expect, it } from 'vitest'
import { createPin, validPin, verifyPin } from './pin'

describe('parent PIN', () => {
  it('accepts exactly four digits', () => {
    expect(validPin('2468')).toBe(true)
    expect(validPin('123')).toBe(false)
    expect(validPin('12a4')).toBe(false)
  })

  it('uses a salted derived hash and verifies it', async () => {
    const first = await createPin('2468')
    const second = await createPin('2468')

    expect(first.hash).not.toBe('2468')
    expect(first.hash).not.toBe(second.hash)
    await expect(verifyPin('2468', first.hash, first.salt)).resolves.toBe(true)
    await expect(verifyPin('1357', first.hash, first.salt)).resolves.toBe(false)
  })
})
