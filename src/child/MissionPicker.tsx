import type { DataCommit } from '../app/usePersistentData'
import { ArrowLeftIcon, CheckIcon } from '../components/Icons'
import { selectMissionSkin } from '../domain/data'
import type { MissionSkin } from '../domain/types'
import { MISSIONS } from '../game/missions'

interface MissionPickerProps {
  dateKey: string
  commit: DataCommit
  onSelected: () => void
  onCancel: () => void
}

export function MissionPicker({ dateKey, commit, onSelected, onCancel }: MissionPickerProps) {
  const choose = (missionSkin: MissionSkin) => {
    commit((current) => selectMissionSkin(current, dateKey, missionSkin))
    onSelected()
  }

  return (
    <main className="picker-shell">
      <header className="picker-header">
        <button className="icon-button" onClick={onCancel} aria-label="Zurück zum Start">
          <ArrowLeftIcon />
        </button>
        <div>
          <p className="eyebrow">Runde wählen</p>
          <h1>Welche Mission möchtest du?</h1>
          <p>Alle drei Wege üben genau die Lernschritte, die gerade passen.</p>
        </div>
      </header>

      <section className="mission-choice-grid" aria-label="Missionen">
        {MISSIONS.map((mission) => (
          <button
            className={`mission-choice mission-choice--${mission.id}`}
            key={mission.id}
            onClick={() => choose(mission.id)}
          >
            <span className="mission-choice__scene" aria-hidden="true">
              <span className="mission-choice__symbol">{mission.symbol}</span>
              <span className="mission-choice__path"><i /><i /><i /></span>
            </span>
            <span className="mission-choice__copy">
              <strong>{mission.name}</strong>
              <small>{mission.description}</small>
            </span>
            <span className="mission-choice__go" aria-hidden="true"><CheckIcon /></span>
          </button>
        ))}
      </section>

      <p className="picker-note">Deine Wahl verändert nur das Aussehen – Punkte und Aufgaben bleiben fair.</p>
    </main>
  )
}
