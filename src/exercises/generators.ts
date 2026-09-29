import { skillById } from '../curriculum/skills'
import type { Challenge, SkillId } from '../domain/types'

export function hashString(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}
export function randomFromSeed(seed: number): () => number {
  let value = seed
  return () => {
    value += 0x6d2b79f5
    let result = value
    result = Math.imul(result ^ (result >>> 15), result | 1)
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}
function choices(answer: number, table: number, random: () => number): number[] {
  const values = new Set([answer])
  for (const offset of [-table, table, -1, 1, -2 * table, 2 * table]) {
    const value = answer + offset
    if (value > 0 && value <= 144) values.add(value)
    if (values.size === 4) break
  }
  const shuffled = [...values]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]]
  }
  return shuffled
}
export function tableStrategy(table: number, factor: number): string {
  if (factor === 1) return `Einmal ${table} ist ${table}.`
  if (factor === 2) return `Verdopple ${table}: ${table} + ${table}.`
  if (factor === 5) return `Zähle fünfmal in ${table}er-Schritten.`
  if (factor === 10) return `Zehnmal ${table}: Hänge an ${table} eine Null an.`
  const anchor = factor > 10 ? 10 : factor > 5 ? 5 : factor - 1
  const rest = factor - anchor
  return `Nutze ${anchor} × ${table} = ${anchor * table}. ${rest === 1 ? `Zähle noch ${table} dazu.` : `Zähle noch ${rest} × ${table} = ${rest * table} dazu.`}`
}
export function generateChallenge(
  skillId: SkillId, difficulty: 1 | 2 | 3 | 4,
  dateKey: string, index: number, round = 0, chosenFactor?: number,
): Challenge {
  const table = skillById(skillId).table
  const random = randomFromSeed(hashString(`${dateKey}:${round}:${index}:${skillId}`))
  const factor = chosenFactor ?? Math.floor(random() * 12) + 1
  const product = factor * table
  const style = (index + round + hashString(skillId)) % 4
  const missing = style === 2 && difficulty >= 3
  const sequence = style === 3 && factor >= 3
  const usesChoices = difficulty === 1 && !sequence
  const array = { type: 'array' as const, rows: factor, columns: table, showTotal: false }
  const prompt = missing ? `? × ${table} = ${product}`
    : sequence ? `Welche Zahl folgt in der ${table}er-Reihe?` : `${factor} × ${table} = ?`
  const answer = missing ? factor : product
  return {
    id: `${dateKey}:round-${round}:v4:${index}:${skillId}`, skillId,
    skillLabel: `${table}er-Reihe`, table, factor, difficulty, kind: 'multiplication',
    interaction: usesChoices ? 'choice' : 'number-input',
    representation: sequence ? 'sequence' : style === 0 ? 'array' : 'symbolic',
    prompt, spokenPrompt: missing ? `Welche Zahl mal ${table} ergibt ${product}?`
      : sequence ? `Zähle in ${table}er-Schritten weiter.` : `Wie viel ist ${factor} mal ${table}?`,
    answer, options: usesChoices ? choices(answer, table, random) : undefined,
    hint: missing ? `Zähle die Reihen im Punktefeld. Jede Reihe hat ${table} Punkte.` : tableStrategy(table, factor),
    promptVisual: sequence ? { type: 'sequence', values: [(factor - 2) * table, (factor - 1) * table, null] }
      : style === 0 ? array : { type: 'none' },
    hintVisual: array,
  }
}
