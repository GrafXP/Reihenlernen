import { describe, expect, it } from 'vitest'
import { addRewardDefinition, updateSettings } from '../domain/data'
import { IndexedDbStateRepository } from './repository'

describe('IndexedDB repository', () => {
  it('creates defaults and persists settings', async () => {
    const repository = new IndexedDbStateRepository()
    const initial = await repository.load()
    const changed = addRewardDefinition(
      updateSettings(initial, { pointsGoal: 70, rewardLabel: 'Velofahren' }),
      {
        id: 'comic',
        label: 'Comic lesen',
        minutes: 15,
        pointsGoal: 100,
        schoolTopic: 'times-tables',
      },
    )
    await repository.save(changed)

    const secondRepository = new IndexedDbStateRepository()
    const reloaded = await secondRepository.load()
    expect(reloaded.settings.pointsGoal).toBe(70)
    expect(reloaded.settings.rewardLabel).toBe('Velofahren')
    expect(reloaded.rewardDefinitions).toContainEqual(expect.objectContaining({ id: 'comic', label: 'Comic lesen' }))
  })
})
