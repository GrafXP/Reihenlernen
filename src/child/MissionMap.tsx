import type { MissionSkin } from '../domain/types'
import { missionById } from '../game/missions'

interface MissionMapProps {
  missionSkin: MissionSkin
  points: number
  goal: number
  compact?: boolean
}

export function MissionMap({ missionSkin, points, goal, compact = false }: MissionMapProps) {
  const mission = missionById(missionSkin)
  const steps = Math.max(1, Math.ceil(goal / 10))
  const completed = Math.min(steps, Math.floor(points / 10))

  return (
    <section className={`mission-map mission-map--${missionSkin}${compact ? ' mission-map--compact' : ''}`}>
      <div className="mission-map__heading">
        <span>{mission.symbol}</span>
        <div><strong>{mission.name}</strong><small>{completed} von {steps} Etappen geschafft</small></div>
        <b>{mission.destination}</b>
      </div>
      <ol aria-label={`${mission.name}: ${completed} von ${steps} Etappen geschafft`}>
        {Array.from({ length: steps }, (_, index) => {
          const number = index + 1
          const status = number <= completed ? 'done' : number === completed + 1 ? 'next' : 'waiting'
          return (
            <li className={`mission-map__step mission-map__step--${status}`} key={number}>
              <span aria-hidden="true">{number <= completed ? '✓' : number}</span>
              <span className="sr-only">
                Etappe {number}: {status === 'done' ? 'geschafft' : status === 'next' ? 'als Nächstes' : 'wartet'}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
