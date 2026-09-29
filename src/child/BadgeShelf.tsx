import type { AppData } from '../domain/types'
import { masteryBadges } from '../game/badges'

interface BadgeShelfProps {
  data: AppData
}

export function BadgeShelf({ data }: BadgeShelfProps) {
  const badges = masteryBadges(data)
  const earned = badges.filter((badge) => badge.earned).length

  return (
    <section className="badge-shelf" aria-labelledby="badge-shelf-title">
      <div className="badge-shelf__heading">
        <div><p className="eyebrow">Deine Sammlung</p><h2 id="badge-shelf-title">Lernabzeichen</h2></div>
        <span>{earned} / {badges.length}</span>
      </div>
      <div className="badge-grid">
        {badges.map((badge) => (
          <div className={badge.earned ? 'mastery-badge mastery-badge--earned' : 'mastery-badge'} key={badge.id}>
            <span aria-hidden="true">{badge.earned ? badge.symbol : '○'}</span>
            <strong>{badge.name}</strong>
            <small>{badge.earned ? badge.description : 'Noch unterwegs'}</small>
          </div>
        ))}
      </div>
      <p>Abzeichen zeigen nur deine eigenen Lernwege. Sie geben keine zusätzlichen Punkte.</p>
    </section>
  )
}
