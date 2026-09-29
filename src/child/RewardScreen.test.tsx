import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createDefaultData, currentLedger } from '../domain/data'
import { RewardScreen } from './RewardScreen'

describe('child reward screen', () => {
  it('lets the child choose a configured reward and keeps redeemed rewards visible', () => {
    const dateKey = '2026-09-01'
    const data = createDefaultData(new Date('2026-09-01T10:00:00.000Z'))
    data.rewardDefinitions = [
      ...data.rewardDefinitions,
      {
        id: 'comic',
        label: 'Comic lesen',
        minutes: 15,
        pointsGoal: 100,
        schoolTopic: 'times-tables',
      },
    ]
    data.collectedRewards = [{
      id: 'old-comic',
      rewardId: 'comic',
      dateKey,
      round: 0,
      collectedAt: '2026-09-01T08:00:00.000Z',
      redeemedAt: '2026-09-01T09:00:00.000Z',
      rewardLabel: 'Comic lesen',
      rewardMinutes: 15,
      points: 100,
      schoolTopic: 'times-tables',
    }]
    const commit = vi.fn()
    const onSelected = vi.fn()

    render(
      <RewardScreen
        data={data}
        ledger={currentLedger(data, dateKey)}
        dateKey={dateKey}
        commit={commit}
        onHome={vi.fn()}
        onSelected={onSelected}
      />,
    )

    expect(screen.getByText('Eingelöst')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Einlösen rückgängig machen/ })).toBeInTheDocument()
    expect(screen.getAllByText('15 Min. Comic lesen')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: /15 Min\. Comic lesen/ }))

    const updater = commit.mock.calls[0][0]
    expect(currentLedger(updater(data), dateKey).activeRewardId).toBe('comic')
    expect(onSelected).toHaveBeenCalledOnce()
  })
})
