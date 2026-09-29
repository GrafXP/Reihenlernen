import type { AppData } from '../domain/types'

export interface MasteryBadge {
  id: 'first-step' | 'explorer' | 'steady-thinker' | 'pathfinder'
  name: string
  description: string
  symbol: string
  earned: boolean
}

export function masteryBadges(data: AppData): MasteryBadge[] {
  const states = Object.values(data.mastery)
  const practised = states.filter((state) => state.attempts > 0).length
  const secure = states.filter((state) => state.band === 'secure').length

  return [
    {
      id: 'first-step',
      name: 'Erste Spur',
      description: 'Eine Reihe begonnen',
      symbol: '1',
      earned: practised >= 1,
    },
    {
      id: 'explorer',
      name: 'Entdecker:in',
      description: 'Sechs Reihen ausprobiert',
      symbol: '✦',
      earned: practised >= 6,
    },
    {
      id: 'steady-thinker',
      name: 'Sicheres Köpfchen',
      description: 'Alle zwölf Aufgaben einer Reihe selbstständig gelöst',
      symbol: '✓',
      earned: secure >= 1,
    },
    {
      id: 'pathfinder',
      name: 'Wegweiser:in',
      description: 'Fünf Reihen sicher gemeistert',
      symbol: '★',
      earned: secure >= 5,
    },
  ]
}
