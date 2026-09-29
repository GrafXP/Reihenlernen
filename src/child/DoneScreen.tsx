import { useEffect } from 'react'
import type { DataCommit } from '../app/usePersistentData'
import { playFinishSound } from '../accessibility/sound'
import { activeRewardDefinition, collectActiveReward } from '../domain/data'
import { formatReward } from '../domain/reward'
import type { AppData, DailyLedger } from '../domain/types'
import { CheckIcon, GiftIcon } from '../components/Icons'
import { missionById } from '../game/missions'
import { MissionMap } from './MissionMap'

interface DoneScreenProps {
  data: AppData
  ledger: DailyLedger
  dateKey: string
  commit: DataCommit
  onCollected: () => void
}

export function DoneScreen({ data, ledger, dateKey, commit, onCollected }: DoneScreenProps) {
  const mission = missionById(ledger.missionSkin)
  const reward = activeRewardDefinition(data, dateKey)

  useEffect(() => {
    if (data.settings.soundEffects) playFinishSound()
  }, [data.settings.soundEffects])

  const collect = () => {
    commit((current) => collectActiveReward(current, dateKey))
    onCollected()
  }

  if (!reward) return null

  return (
    <main className={`done-shell done-shell--${mission.id}`}>
      <section className="done-card">
        <div className="finish-badge" aria-hidden="true"><CheckIcon /></div>
        <p className="eyebrow">Missionsziel erreicht</p>
        <h1>Stark gerechnet!</h1>
        <p>Du hast den {mission.destination} erreicht und {reward.pointsGoal} Punkte gesammelt. Lege die Belohnung in deine Sammlung – danach kannst du gleich eine neue Mission wählen.</p>

        <MissionMap missionSkin={mission.id} points={ledger.points} goal={reward.pointsGoal} compact />

        <div className="voucher">
          <div className="voucher__icon"><GiftIcon /></div>
          <span>Deine Belohnung</span>
          <strong>{formatReward(reward)}</strong>
          <small>Runde {ledger.round + 1}</small>
        </div>

        <button className="button button--primary button--large" onClick={collect}>
          <GiftIcon /> Belohnung sammeln
        </button>
        <p className="calm-finish"><span><CheckIcon /></span>Zum Sammeln brauchst du keinen Erwachsenen.</p>
      </section>
    </main>
  )
}
