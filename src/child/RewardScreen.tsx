import { useMemo, useState } from 'react'
import type { DataCommit } from '../app/usePersistentData'
import { ArrowLeftIcon, CheckIcon, GiftIcon, ParentIcon, UndoIcon } from '../components/Icons'
import { redeemCollectedReward, selectRewardDefinition, undoCollectedRewardRedemption } from '../domain/data'
import { formatReward, schoolTopicEnabled, schoolTopicLabel } from '../domain/reward'
import type { AppData, DailyLedger } from '../domain/types'
import { ParentGate } from '../parent/ParentGate'

interface RewardScreenProps {
  data: AppData
  ledger: DailyLedger
  dateKey: string
  commit: DataCommit
  onHome: () => void
  onSelected: () => void
}

export function RewardScreen({
  data,
  ledger,
  dateKey,
  commit,
  onHome,
  onSelected,
}: RewardScreenProps) {
  const [rewardToRedeem, setRewardToRedeem] = useState<string | null>(null)
  const [rewardToUndo, setRewardToUndo] = useState<string | null>(null)
  const collectedRewards = useMemo(
    () => [...data.collectedRewards].sort((first, second) => second.collectedAt.localeCompare(first.collectedAt)),
    [data.collectedRewards],
  )
  const openRewards = collectedRewards.filter((reward) => !reward.redeemedAt)
  const redeemedRewards = collectedRewards.filter((reward) => reward.redeemedAt)
  const canChoose = ledger.points === 0

  const choose = (rewardId: string) => {
    if (!canChoose) return
    commit((current) => selectRewardDefinition(current, dateKey, rewardId))
    onSelected()
  }

  const redeem = () => {
    if (!rewardToRedeem) return
    commit((current) => redeemCollectedReward(current, rewardToRedeem))
    setRewardToRedeem(null)
  }

  const undoRedemption = () => {
    if (!rewardToUndo) return
    commit((current) => undoCollectedRewardRedemption(current, rewardToUndo))
    setRewardToUndo(null)
  }

  return (
    <main className="rewards-shell">
      <header className="rewards-header">
        <button className="icon-button" onClick={onHome} aria-label="Zurück zum Start"><ArrowLeftIcon /></button>
        <div>
          <p className="eyebrow">Deine Belohnungen</p>
          <h1>Sammeln, auswählen, einlösen</h1>
          <p>Du darfst so viele Missionen machen, wie du möchtest. Ein Erwachsener löst deine gesammelten Belohnungen später ein.</p>
        </div>
      </header>

      <section className="reward-catalogue" aria-labelledby="reward-choice-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Nächste Mission</p>
            <h2 id="reward-choice-title">Welche Belohnung möchtest du sammeln?</h2>
          </div>
          <GiftIcon />
        </div>
        {!canChoose && (
          <p className="reward-choice-note">Deine laufende Mission bleibt ausgewählt, bis du sie fertig gesammelt hast.</p>
        )}
        <div className="reward-option-grid">
          {data.rewardDefinitions.map((reward) => {
            const active = reward.id === ledger.activeRewardId
            const available = schoolTopicEnabled(data.settings, reward.schoolTopic)
            return (
              <button
                type="button"
                className={active ? 'reward-option reward-option--active' : 'reward-option'}
                key={reward.id}
                disabled={!canChoose || !available}
                onClick={() => choose(reward.id)}
              >
                <span className="reward-option__icon" aria-hidden="true"><GiftIcon /></span>
                <span className="reward-option__copy">
                  <strong>{formatReward(reward)}</strong>
                  <small>{reward.pointsGoal} Punkte · {schoolTopicLabel(reward.schoolTopic)}</small>
                </span>
                <span className="reward-option__action">{!available ? 'Noch gesperrt' : active ? 'Ausgewählt' : 'Auswählen'}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="reward-collection" aria-labelledby="collected-rewards-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Deine Sammlung</p>
            <h2 id="collected-rewards-title">Gesammelte Belohnungen</h2>
          </div>
          <span className="status-chip">{openRewards.length} offen</span>
        </div>

        {collectedRewards.length === 0 ? (
          <div className="empty-rewards">
            <GiftIcon />
            <strong>Noch keine Belohnung gesammelt</strong>
            <p>Wähle oben eine Belohnung und erreiche ihr Punkteziel.</p>
          </div>
        ) : (
          <div className="collected-reward-list">
            {openRewards.map((reward) => (
              <article className="collected-reward" key={reward.id}>
                <div className="collected-reward__icon"><GiftIcon /></div>
                <div className="collected-reward__copy">
                  <span className="reward-status reward-status--open">Bereit zum Einlösen</span>
                  <h3>{formatReward({ label: reward.rewardLabel, minutes: reward.rewardMinutes })}</h3>
                  <p>{reward.points} Punkte · {schoolTopicLabel(reward.schoolTopic)} · {formatCollectedAt(reward.collectedAt)}</p>
                </div>
                <button className="button button--primary" onClick={() => setRewardToRedeem(reward.id)}>
                  <ParentIcon /> Mit Elternteil einlösen
                </button>
              </article>
            ))}
            {redeemedRewards.map((reward) => (
              <article className="collected-reward collected-reward--redeemed" key={reward.id}>
                <div className="collected-reward__icon"><CheckIcon /></div>
                <div className="collected-reward__copy">
                  <span className="reward-status reward-status--redeemed">Eingelöst</span>
                  <h3>{formatReward({ label: reward.rewardLabel, minutes: reward.rewardMinutes })}</h3>
                  <p>{reward.points} Punkte · {schoolTopicLabel(reward.schoolTopic)} · {formatCollectedAt(reward.collectedAt)}</p>
                </div>
                <button className="button button--ghost button--compact" onClick={() => setRewardToUndo(reward.id)}>
                  <UndoIcon /> Einlösen rückgängig machen
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {rewardToRedeem && (
        <ParentGate
          data={data}
          commit={commit}
          title="Belohnung einlösen"
          actionLabel="Jetzt einlösen"
          onUnlocked={redeem}
          onCancel={() => setRewardToRedeem(null)}
        />
      )}
      {rewardToUndo && (
        <ParentGate
          data={data}
          commit={commit}
          title="Einlösung rückgängig machen"
          actionLabel="Rückgängig machen"
          onUnlocked={undoRedemption}
          onCancel={() => setRewardToUndo(null)}
        />
      )}
    </main>
  )
}

function formatCollectedAt(value: string): string {
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Zurich',
  }).format(new Date(value))
}
