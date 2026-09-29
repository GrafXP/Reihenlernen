import { friendlyZurichDate } from '../domain/date'
import { formatReward } from '../domain/reward'
import { activeRewardDefinition } from '../domain/data'
import type { AppData, DailyLedger, TableNumber } from '../domain/types'
import { GiftIcon, InstallIcon, ParentIcon } from '../components/Icons'
import { ProgressRing } from '../components/ProgressRing'
import { BadgeShelf } from './BadgeShelf'
import { MissionMap } from './MissionMap'
import { TablePicker } from './TablePicker'

interface HomeScreenProps {
  data: AppData
  ledger: DailyLedger
  online: boolean
  onStart: () => void
  onRewards: () => void
  onParent: () => void
  onInstall: () => void
  onSelectTables: (tables: TableNumber[]) => void
  onLearn: (table: TableNumber) => void
}
export function HomeScreen({ data, ledger, online, onStart, onRewards, onParent, onInstall, onSelectTables, onLearn }: HomeScreenProps) {
  const reward = activeRewardDefinition(data, ledger.dateKey)
  const goal = reward?.pointsGoal ?? data.settings.pointsGoal
  const reachedGoal = reward !== null && ledger.points >= goal
  const pending = data.collectedRewards.filter((entry) => !entry.redeemedAt).length
  const redeemed = data.collectedRewards.length - pending
  const selected = ledger.practiceTables ?? data.settings.selectedTables
  return (
    <main className="home-shell">
      <header className="home-header">
        <div className="brand-mark brand-mark--tables" aria-hidden="true"><span>×</span><span>12</span></div>
        <div><p className="eyebrow">{friendlyZurichDate()}</p><h1>Reihen-Mission</h1></div>
        <span className={`connection-pill ${online ? '' : 'connection-pill--offline'}`}><span aria-hidden="true" />{online ? 'bereit' : 'offline'}</span>
      </header>
      <section className="hero-card hero-card--tables">
        <div className="hero-copy">
          <p className="eyebrow">2 bis 9 · 11 & 12</p>
          <h2>{reachedGoal ? 'Geschafft! Deine Belohnung wartet.' : ledger.points > 0 ? 'Dein nächster Schritt wartet.' : <>Deine Reihen.<br />Dein Tempo.</>}</h2>
          <p>{reachedGoal ? 'Du hast dein Ziel erreicht. Sammle deine Belohnung und freue dich über deinen Fortschritt.'
            : 'Entdecke das Einmaleins, übe deine Reihen und sammle Punkte. Schritt für Schritt, ohne Zeitdruck.'}</p>
          <button className="button button--primary button--large" onClick={onStart}>
            {reachedGoal ? 'Belohnung sammeln' : ledger.points > 0 ? 'Weiterrechnen' : reward ? 'Mission starten' : 'Üben starten'}<span aria-hidden="true">→</span>
          </button>
          <span className="hero-practice-note">{selected.length === 1 ? `${selected[0]}er-Reihe` : `${selected.length} Reihen gemischt`} · 10 Punkte pro Aufgabe</span>
        </div>
        {reward ? <ProgressRing points={ledger.points} goal={goal} /> : (
          <div className="times-scene" aria-hidden="true">
            <span className="times-scene__star">✦</span><div className="times-scene__equation"><span>7</span><b>×</b><span>8</span></div>
            <span className="times-scene__result">= 56</span>
            <span className="times-scene__caption">Aus kleinen Schritten<br />wird grosses Können.</span>
          </div>
        )}
        <div className="mountain-scene" aria-hidden="true"><span className="sun" /><span className="mountain mountain--back" /><span className="mountain mountain--front" /></div>
      </section>
      <TablePicker data={data} selected={selected} locked={ledger.points > 0} onSelect={onSelectTables} onLearn={onLearn} />
      <button className="reward-card reward-card--button" aria-label="Meine Belohnungen öffnen" onClick={onRewards}>
        <div className="reward-card__icon"><GiftIcon /></div>
        <div><span>{reward ? 'Dein nächstes Ziel' : 'Deine Belohnungen'}</span><strong>{reward ? formatReward(reward) : `${pending} gesammelt · ${redeemed} eingelöst`}</strong></div>
        <span className="reward-card__status">{reachedGoal ? 'bereit' : reward ? `${goal} Punkte` : 'ansehen'}</span>
      </button>
      {ledger.missionSkin && <MissionMap missionSkin={ledger.missionSkin} points={ledger.points} goal={goal} compact />}
      <BadgeShelf data={data} />
      <footer className="home-footer">
        <button className="text-button" onClick={onInstall}><InstallIcon /> App installieren</button>
        <button className="text-button" onClick={onRewards}><GiftIcon /> Meine Belohnungen</button>
        <button className="text-button" onClick={onParent}><ParentIcon /> Elternbereich</button>
      </footer>
    </main>
  )
}
