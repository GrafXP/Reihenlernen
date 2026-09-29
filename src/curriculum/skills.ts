import type { MasteryState, SchoolTopic, SkillId, TableNumber } from '../domain/types'

export const TABLES: readonly TableNumber[] = [2, 3, 4, 5, 6, 7, 8, 9, 11, 12]
export const FACTORS = Array.from({ length: 12 }, (_, index) => index + 1)

export interface SkillDefinition {
  id: SkillId
  table: TableNumber
  label: string
  shortLabel: string
  description: string
  topics: SchoolTopic[]
}

export const SKILLS: SkillDefinition[] = TABLES.map((table) => ({
  id: `table-${table}`,
  table,
  label: `${table}er-Reihe`,
  shortLabel: `${table}er-Reihe`,
  description: `Die ${table}er-Reihe von 1 × ${table} bis 12 × ${table} lernen.`,
  topics: ['times-tables'],
}))
export const SKILL_IDS = SKILLS.map((skill) => skill.id)
export function skillById(skillId: SkillId): SkillDefinition {
  return SKILLS.find((skill) => skill.id === skillId) ?? SKILLS[0]
}
export function normaliseTables(value: unknown): TableNumber[] {
  const tables = Array.isArray(value) ? TABLES.filter((table) => value.includes(table)) : []
  return tables.length ? [...tables] : [...TABLES]
}
export function emptyMastery(skillId: SkillId): MasteryState {
  return { skillId, band: 'new', score: 0, attempts: 0, independentSuccesses: 0,
    lastPractisedAt: null, nextReviewDate: null, factSuccesses: {}, representationEvidence: {} }
}
export function emptyMasteryMap(): Record<SkillId, MasteryState> {
  return Object.fromEntries(SKILL_IDS.map((id) => [id, emptyMastery(id)])) as Record<SkillId, MasteryState>
}
