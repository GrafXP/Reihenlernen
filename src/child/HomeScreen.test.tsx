import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createDefaultData, currentLedger, selectRewardDefinition } from '../domain/data'
import { zurichDateKey } from '../domain/date'
import { HomeScreen } from './HomeScreen'

describe('child home', () => {
  it('shows the configured goal and reward and starts a mission', () => {
    let data = createDefaultData()
    const dateKey = zurichDateKey()
    data = selectRewardDefinition(data, dateKey, data.rewardDefinitions[0].id)
    const onStart = vi.fn()
    render(
      <HomeScreen
        data={data}
        ledger={currentLedger(data, dateKey)}
        online
        onStart={onStart}
        onRewards={vi.fn()}
        onParent={vi.fn()}
        onInstall={vi.fn()}
        onSelectTables={vi.fn()}
        onLearn={vi.fn()}
      />,
    )

    expect(screen.getByRole('progressbar', { name: '0 von 100 Punkten' })).toBeInTheDocument()
    expect(screen.getByText('30 Min. Gamen')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Mission starten/ }))
    expect(onStart).toHaveBeenCalledOnce()
  })
})
