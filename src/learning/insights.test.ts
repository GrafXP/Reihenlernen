import { describe, expect, it } from 'vitest'
import { awardResolvedChallenge, collectActiveReward, createDefaultData, selectRewardDefinition } from '../domain/data'
import { sevenDayInsights, skillsNeedingReview } from './insights'

describe('seven-day parent insights', () => {
  it('groups tasks, first tries, hints, and rewards across seven calendar days', () => {
    let data = createDefaultData(new Date('2026-09-01T10:00:00.000Z'))
    data = {
      ...data,
      rewardDefinitions: data.rewardDefinitions.map((reward) => ({ ...reward, pointsGoal: 50 })),
    }
    data = selectRewardDefinition(data, '2026-08-30', data.rewardDefinitions[0].id)
    for (let index = 0; index < 5; index += 1) {
      data = awardResolvedChallenge(data, {
        challengeId: `2026-08-30:addition:${index}`,
        dateKey: '2026-08-30',
        skillId: 'table-2',
        representation: 'symbolic',
        wrongAnswers: index === 0 ? 2 : 0,
        hintUsed: index === 0,
        completedAt: `2026-08-30T10:0${index}:00.000Z`,
      })
    }
    data = collectActiveReward(data, '2026-08-30', '2026-08-30T11:00:00.000Z')

    const week = sevenDayInsights(data, '2026-09-01')
    expect(week).toHaveLength(7)
    expect(week.map((day) => day.dateKey)).toEqual([
      '2026-08-26', '2026-08-27', '2026-08-28', '2026-08-29', '2026-08-30', '2026-08-31', '2026-09-01',
    ])
    expect(week[4]).toMatchObject({ tasks: 5, firstTry: 4, hints: 1, rewards: 1 })
  })

  it('uses supportive review candidates only after a skill has been practised', () => {
    let data = createDefaultData(new Date('2026-09-01T10:00:00.000Z'))
    data = selectRewardDefinition(data, '2026-09-01', data.rewardDefinitions[0].id)
    expect(skillsNeedingReview(data, '2026-09-01')).toEqual([])
    data = awardResolvedChallenge(data, {
      challengeId: '2026-09-01:addition:0',
      dateKey: '2026-09-01',
      skillId: 'table-2',
      representation: 'symbolic',
      wrongAnswers: 2,
      hintUsed: true,
      completedAt: '2026-09-01T10:00:00.000Z',
    })
    expect(skillsNeedingReview(data, '2026-09-01')).toContain('table-2')
  })
})
