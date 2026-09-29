import { describe, expect, it } from 'vitest'
import { FACTORS, TABLES } from '../curriculum/skills'
import { awardResolvedChallenge, collectActiveReward, createDefaultData, selectMissionSkin, selectPracticeTables, selectRewardDefinition, updateSettings } from '../domain/data'
import { challengeForSession } from './selector'
const DATE = '2026-09-29'
function start(tables = [...TABLES]) {
  let data = createDefaultData(new Date(`${DATE}T10:00:00Z`))
  data = selectPracticeTables(data, DATE, tables)
  data = selectRewardDefinition(data, DATE, data.rewardDefinitions[0].id)
  return selectMissionSkin(data, DATE, 'number-trail')
}
describe('row and fact scheduling', () => {
  it('only uses selected rows, including eleven and twelve', () => {
    const data = start([11, 12])
    for (let index = 0; index < 50; index += 1) {
      const challenge = challengeForSession(data, DATE, index)
      expect([11, 12]).toContain(challenge.table)
    }
  })
  it('retains the round selection when settings change', () => {
    const data = updateSettings(start([12]), { selectedTables: [2] })
    expect(challengeForSession(data, DATE, 0).table).toBe(12)
  })
  it('gives all twelve facts of a single row before repeating learned facts', () => {
    let data = start([12])
    const factors: number[] = []
    for (let index = 0; index < 12; index += 1) {
      if (index === 10) {
        data = collectActiveReward(data, DATE)
        data = selectRewardDefinition(data, DATE, data.rewardDefinitions[0].id)
        data = selectMissionSkin(data, DATE, 'number-trail')
      }
      const task = challengeForSession(data, DATE, index < 10 ? index : index - 10)
      factors.push(task.factor)
      data = awardResolvedChallenge(data, { challengeId: task.id, dateKey: DATE, skillId: task.skillId,
        factor: task.factor, representation: task.representation, wrongAnswers: 0, hintUsed: false })
    }
    expect([...factors].sort((a, b) => a - b)).toEqual(FACTORS)
    expect(data.mastery['table-12'].band).toBe('secure')
  })
  it('is deterministic for the same saved state', () => {
    const data = start()
    expect(challengeForSession(data, DATE, 0)).toEqual(challengeForSession(data, DATE, 0))
  })
  it('uses every requested row in a mixed round', () => {
    let data = start()
    const rows: number[] = []
    for (let index = 0; index < 10; index += 1) {
      const task = challengeForSession(data, DATE, index)
      rows.push(task.table)
      data = awardResolvedChallenge(data, { challengeId: task.id, dateKey: DATE, skillId: task.skillId,
        factor: task.factor, representation: task.representation, wrongAnswers: 0, hintUsed: false })
    }
    expect(rows.sort((a, b) => a - b)).toEqual(TABLES)
  })
})
