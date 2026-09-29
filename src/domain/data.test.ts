import { describe, expect, it } from 'vitest'
import {
  awardResolvedChallenge,
  addRewardDefinition,
  collectActiveReward,
  createDefaultData,
  currentLedger,
  hasReachedGoal,
  redeemCollectedReward,
  undoCollectedRewardRedemption,
  selectRewardDefinition,
  selectMissionSkin,
  updateSettings,
  normaliseData,
  selectPracticeTables,
} from './data'

const NOW = new Date('2026-08-31T12:00:00.000Z')
const DATE_KEY = '2026-08-31'

function chooseDefaultReward(data: ReturnType<typeof createDefaultData>) {
  return selectRewardDefinition(data, DATE_KEY, data.rewardDefinitions[0].id)
}

describe('repeatable point and reward rounds', () => {
  it('awards ten points exactly once for a resolved challenge', () => {
    const initial = chooseDefaultReward(createDefaultData(NOW))
    const once = awardResolvedChallenge(initial, {
      challengeId: `${DATE_KEY}:foundation:0`,
      dateKey: DATE_KEY,
      wrongAnswers: 1,
      hintUsed: false,
    })
    const twice = awardResolvedChallenge(once, {
      challengeId: `${DATE_KEY}:foundation:0`,
      dateKey: DATE_KEY,
      wrongAnswers: 0,
      hintUsed: false,
    })

    expect(currentLedger(once, DATE_KEY).points).toBe(10)
    expect(currentLedger(twice, DATE_KEY).points).toBe(10)
    expect(twice.attempts).toHaveLength(1)
  })

  it('collects without a parent and can earn another reward on the same day', () => {
    let data = chooseDefaultReward(createDefaultData(NOW))
    for (let index = 0; index < 10; index += 1) {
      data = awardResolvedChallenge(data, {
        challengeId: `${DATE_KEY}:round-0:${index}`,
        dateKey: DATE_KEY,
        wrongAnswers: 0,
        hintUsed: false,
      })
    }

    expect(hasReachedGoal(data, DATE_KEY)).toBe(true)
    data = collectActiveReward(data, DATE_KEY, '2026-08-31T18:00:00.000Z')

    expect(currentLedger(data, DATE_KEY)).toMatchObject({
      round: 1,
      points: 0,
      activeRewardId: null,
      awardedChallengeIds: [],
    })
    expect(data.collectedRewards).toEqual([
      expect.objectContaining({
        round: 0,
        points: 100,
        collectedAt: '2026-08-31T18:00:00.000Z',
        redeemedAt: null,
        rewardLabel: 'Gamen',
        rewardMinutes: 30,
      }),
    ])

    const tooEarly = collectActiveReward(data, DATE_KEY, '2026-08-31T18:30:00.000Z')
    expect(tooEarly).toBe(data)

    data = selectRewardDefinition(data, DATE_KEY, data.rewardDefinitions[0].id)
    for (let index = 0; index < 10; index += 1) {
      data = awardResolvedChallenge(data, {
        challengeId: `${DATE_KEY}:round-1:${index}`,
        dateKey: DATE_KEY,
        wrongAnswers: 0,
        hintUsed: false,
      })
    }
    data = collectActiveReward(data, DATE_KEY, '2026-08-31T19:00:00.000Z')

    expect(currentLedger(data, DATE_KEY)).toMatchObject({ round: 2, points: 0 })
    expect(data.collectedRewards).toHaveLength(2)
  })

  it('does not collect before the goal and can redeem or undo a collected item idempotently', () => {
    let data = chooseDefaultReward(createDefaultData(NOW))
    expect(collectActiveReward(data, DATE_KEY)).toBe(data)
    for (let index = 0; index < 10; index += 1) {
      data = awardResolvedChallenge(data, {
        challengeId: `${DATE_KEY}:round-0:${index}`,
        dateKey: DATE_KEY,
        wrongAnswers: 0,
        hintUsed: false,
      })
    }
    data = collectActiveReward(data, DATE_KEY, '2026-08-31T18:00:00.000Z')
    const rewardId = data.collectedRewards[0].id
    data = redeemCollectedReward(data, rewardId, '2026-08-31T19:00:00.000Z')
    expect(data.collectedRewards[0].redeemedAt).toBe('2026-08-31T19:00:00.000Z')
    expect(redeemCollectedReward(data, rewardId)).toBe(data)

    data = undoCollectedRewardRedemption(data, rewardId)
    expect(data.collectedRewards[0].redeemedAt).toBeNull()
    expect(undoCollectedRewardRedemption(data, rewardId)).toBe(data)
    expect(undoCollectedRewardRedemption(data, 'missing-reward')).toBe(data)
  })

  it('keeps a new day independent from previous progress', () => {
    const initial = chooseDefaultReward(createDefaultData(NOW))
    const withPoints = awardResolvedChallenge(initial, {
      challengeId: `${DATE_KEY}:foundation:0`,
      dateKey: DATE_KEY,
      wrongAnswers: 0,
      hintUsed: false,
    })

    expect(currentLedger(withPoints, '2026-09-01').points).toBe(0)
    expect(currentLedger(withPoints, DATE_KEY).points).toBe(10)
  })

  it('normalises parent-configurable ranges and text', () => {
    const data = updateSettings(createDefaultData(NOW), {
      pointsGoal: 243,
      rewardMinutes: -5,
      rewardLabel: '   ',
    })
    expect(data.settings.pointsGoal).toBe(200)
    expect(data.settings.rewardMinutes).toBe(0)
    expect(data.settings.rewardLabel).toBe('Gamen')
  })

  it('requires the adult speech switch before automatic reading can be enabled', () => {
    const initial = createDefaultData(NOW)
    expect(initial.settings.speechEnabled).toBe(false)
    expect(initial.settings.readAloud).toBe(false)

    const blocked = updateSettings(initial, { readAloud: true })
    expect(blocked.settings.readAloud).toBe(false)

    const enabled = updateSettings(initial, { speechEnabled: true, readAloud: true })
    expect(enabled.settings.speechEnabled).toBe(true)
    expect(enabled.settings.readAloud).toBe(true)

    const disabled = updateSettings(enabled, { speechEnabled: false })
    expect(disabled.settings.speechEnabled).toBe(false)
    expect(disabled.settings.readAloud).toBe(false)
  })

  it('keeps mission cosmetics separate from points and resets the choice after collection', () => {
    let data = selectMissionSkin(chooseDefaultReward(createDefaultData(NOW)), DATE_KEY, 'market-day')
    expect(currentLedger(data, DATE_KEY)).toMatchObject({ points: 0, missionSkin: 'market-day' })

    data = awardResolvedChallenge(data, {
      challengeId: `${DATE_KEY}:round-0:0`,
      dateKey: DATE_KEY,
      wrongAnswers: 0,
      hintUsed: false,
    })
    const unchanged = selectMissionSkin(data, DATE_KEY, 'shape-workshop')
    expect(unchanged).toBe(data)
    expect(currentLedger(unchanged, DATE_KEY).points).toBe(10)

    for (let index = 1; index < 10; index += 1) {
      data = awardResolvedChallenge(data, {
        challengeId: `${DATE_KEY}:round-0:${index}`,
        dateKey: DATE_KEY,
        wrongAnswers: 0,
        hintUsed: false,
      })
    }
    data = collectActiveReward(data, DATE_KEY)
    expect(currentLedger(data, DATE_KEY)).toMatchObject({ points: 0, activeRewardId: null, missionSkin: null })
  })

  it('turns a redeemed Phase 2 day into a fresh round with redemption history', () => {
    const phaseTwo = createDefaultData(NOW) as unknown as Record<string, unknown>
    phaseTwo.version = 2
    const ledgers = phaseTwo.ledgers as Record<string, Record<string, unknown>>
    ledgers[DATE_KEY] = {
      dateKey: DATE_KEY,
      points: 100,
      awardedChallengeIds: Array.from({ length: 10 }, (_, index) => `${DATE_KEY}:v2:${index}`),
      redeemedAt: '2026-08-31T18:00:00.000Z',
      redeemedRewardLabel: 'Gamen',
      redeemedRewardMinutes: 30,
    }

    const migrated = normaliseData(phaseTwo, NOW)
    const ledger = currentLedger(migrated, DATE_KEY)
    expect(ledger).toMatchObject({ round: 1, points: 0, awardedChallengeIds: [] })
    expect(ledger.redemptions).toEqual([
      expect.objectContaining({
        round: 0,
        redeemedAt: '2026-08-31T18:00:00.000Z',
        rewardLabel: 'Gamen',
      }),
    ])
    expect(migrated.collectedRewards).toEqual([
      expect.objectContaining({
        rewardId: null,
        collectedAt: '2026-08-31T18:00:00.000Z',
        redeemedAt: '2026-08-31T18:00:00.000Z',
      }),
    ])
  })

  it('stores a parent-defined reward with its own points and category', () => {
    const initial = createDefaultData(NOW)
    const data = addRewardDefinition(initial, {
      id: 'comic',
      label: 'Comic lesen',
      minutes: 15,
      pointsGoal: 100,
      schoolTopic: 'times-tables',
    })

    expect(data.rewardDefinitions).toContainEqual({
      id: 'comic',
      label: 'Comic lesen',
      minutes: 15,
      pointsGoal: 100,
      schoolTopic: 'times-tables',
    })
  })
})

describe('selected tables in saved rounds', () => {
  it('filters invalid rows and refuses to empty a selection', () => {
    const data = updateSettings(createDefaultData(NOW), { selectedTables: [2, 2, 10, 12] as never })
    expect(data.settings.selectedTables).toEqual([2, 12])
    expect(selectPracticeTables(data, DATE_KEY, [])).toBe(data)
  })
  it('locks a running round and preserves rows and fact evidence after reload', () => {
    let data = selectPracticeTables(createDefaultData(NOW), DATE_KEY, [11, 12])
    data = selectMissionSkin(chooseDefaultReward(data), DATE_KEY, 'number-trail')
    data = awardResolvedChallenge(data, { challengeId: 'task-1', dateKey: DATE_KEY, skillId: 'table-12',
      factor: 12, representation: 'symbolic', wrongAnswers: 0, hintUsed: false })
    expect(selectPracticeTables(data, DATE_KEY, [2])).toBe(data)
    const restored = normaliseData(JSON.parse(JSON.stringify(data)), NOW)
    expect(currentLedger(restored, DATE_KEY).practiceTables).toEqual([11, 12])
    expect(restored.mastery['table-12'].factSuccesses[12]).toBe(1)
    expect(restored.attempts[0].factor).toBe(12)
  })
})
