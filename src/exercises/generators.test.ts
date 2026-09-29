import { describe, expect, it } from 'vitest'
import { FACTORS, SKILLS, TABLES } from '../curriculum/skills'
import { generateChallenge } from './generators'

describe('times-table exercises', () => {
  it('covers exactly the requested tables and every factor through twelve', () => {
    expect(TABLES).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 11, 12])
    for (const skill of SKILLS) for (const factor of FACTORS) {
      for (let difficulty = 1; difficulty <= 4; difficulty += 1) {
        for (let index = 0; index < 4; index += 1) {
          const challenge = generateChallenge(skill.id, difficulty as 1 | 2 | 3 | 4, '2026-09-29', index, 0, factor)
          expect(challenge.table).toBe(skill.table)
          expect(challenge.answer).toBe(challenge.prompt.startsWith('?') ? factor : skill.table * factor)
          expect(challenge.answer).toBeLessThanOrEqual(144)
          if (challenge.interaction === 'choice') {
            expect(challenge.options).toHaveLength(4)
            expect(new Set(challenge.options).size).toBe(4)
            expect(challenge.options).toContain(challenge.answer)
          }
          if (challenge.promptVisual.type === 'array') {
            expect(challenge.promptVisual.rows * challenge.promptVisual.columns).toBe(factor * skill.table)
          }
          if (challenge.promptVisual.type === 'sequence') {
            const values = challenge.promptVisual.values
            expect(values).toEqual([(factor - 2) * skill.table, (factor - 1) * skill.table, null])
          }
        }
      }
    }
  })
  it('recreates a task after reload and separates repeat reward rounds', () => {
    const task = generateChallenge('table-12', 3, '2026-09-29', 7)
    expect(task).toEqual(generateChallenge('table-12', 3, '2026-09-29', 7))
    expect(task.id).not.toBe(generateChallenge('table-12', 3, '2026-09-29', 7, 1).id)
  })
})
