import { describe, expect, it } from 'vitest'
import { awardResolvedChallenge, createDefaultData, currentLedger, selectRewardDefinition } from '../domain/data'
import type { ChallengeRepresentation, SkillId } from '../domain/types'
import { masteryBadges } from './badges'

const DATE_KEY = '2026-09-01'

function practise(
  data: ReturnType<typeof createDefaultData>,
  skillId: SkillId,
  index: number,
  representation: ChallengeRepresentation = 'symbolic',
) {
  return awardResolvedChallenge(data, {
    challengeId: `${DATE_KEY}:${skillId}:${index}`,
    dateKey: DATE_KEY,
    skillId,
    representation,
    wrongAnswers: 0,
    hintUsed: false,
    completedAt: `2026-09-01T10:0${index}:00.000Z`,
  })
}

describe('personal mastery badges', () => {
  it('derives cosmetics from mastery without changing reward points', () => {
    let data = createDefaultData(new Date('2026-09-01T10:00:00.000Z'))
    data = selectRewardDefinition(data, DATE_KEY, data.rewardDefinitions[0].id)
    for (let index = 0; index < 4; index += 1) data = practise(data, 'table-2', index)

    const earned = masteryBadges(data).filter((badge) => badge.earned).map((badge) => badge.id)
    expect(earned).toContain('first-step')
    expect(earned).not.toContain('steady-thinker')
    expect(currentLedger(data, DATE_KEY).points).toBe(40)
  })

  it('unlocks the explorer badge through varied learning evidence', () => {
    let data = createDefaultData(new Date('2026-09-01T10:00:00.000Z'))
    data = selectRewardDefinition(data, DATE_KEY, data.rewardDefinitions[0].id)
    const skills: SkillId[] = ['table-2', 'table-3', 'table-4', 'table-5', 'table-6', 'table-7']
    skills.forEach((skillId, index) => { data = practise(data, skillId, index) })
    expect(masteryBadges(data).find((badge) => badge.id === 'explorer')?.earned).toBe(true)
  })
})
