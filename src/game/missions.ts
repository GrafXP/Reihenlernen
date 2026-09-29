import type { MissionSkin } from '../domain/types'

export interface MissionDefinition {
  id: MissionSkin
  name: string
  shortName: string
  description: string
  destination: string
  symbol: string
}

export const MISSIONS: MissionDefinition[] = [
  {
    id: 'number-trail',
    name: 'Zahlenweg',
    shortName: 'Weg',
    description: 'Wandere von Stein zu Stein bis zum Gipfel.',
    destination: 'Gipfel',
    symbol: '↗',
  },
  {
    id: 'shape-workshop',
    name: 'Formenwerkstatt',
    shortName: 'Werkstatt',
    description: 'Baue Etappe für Etappe ein kunterbuntes Werkstück.',
    destination: 'Werkstück',
    symbol: '◇',
  },
  {
    id: 'market-day',
    name: 'Markttag',
    shortName: 'Markt',
    description: 'Fülle deinen Korb auf dem Weg zum Marktstand.',
    destination: 'Marktstand',
    symbol: '●',
  },
]

export function missionById(id: MissionSkin | null | undefined): MissionDefinition {
  return MISSIONS.find((mission) => mission.id === id) ?? MISSIONS[0]
}
