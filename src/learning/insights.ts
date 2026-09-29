import { skillById } from '../curriculum/skills'
import { addCalendarDays } from '../domain/date'
import type { AppData, SkillId } from '../domain/types'
import { availableSkills, isDue } from './selector'

export interface DailyLearningInsight {
  dateKey: string
  weekday: string
  tasks: number
  firstTry: number
  hints: number
  rewards: number
}

export function sevenDayInsights(data: AppData, endDateKey: string): DailyLearningInsight[] {
  return Array.from({ length: 7 }, (_, index) => addCalendarDays(endDateKey, index - 6))
    .map((dateKey) => {
      const attempts = data.attempts.filter((attempt) => attempt.dateKey === dateKey)
      const date = new Date(`${dateKey}T12:00:00.000Z`)
      return {
        dateKey,
        weekday: new Intl.DateTimeFormat('de-CH', { weekday: 'short', timeZone: 'UTC' })
          .format(date)
          .replace('.', ''),
        tasks: attempts.length,
        firstTry: attempts.filter((attempt) => attempt.wrongAnswers === 0).length,
        hints: attempts.filter((attempt) => attempt.hintUsed).length,
        rewards: data.collectedRewards.filter((reward) => reward.dateKey === dateKey).length,
      }
    })
}

export function skillsNeedingReview(data: AppData, dateKey: string, limit = 3): SkillId[] {
  return availableSkills(data)
    .filter((skill) => {
      const state = data.mastery[skill.id]
      return state.attempts > 0 && (state.score <= 2 || isDue(state, dateKey))
    })
    .sort((first, second) => {
      const firstState = data.mastery[first.id]
      const secondState = data.mastery[second.id]
      return firstState.score - secondState.score
        || (firstState.nextReviewDate ?? '').localeCompare(secondState.nextReviewDate ?? '')
        || skillById(first.id).label.localeCompare(skillById(second.id).label, 'de-CH')
    })
    .slice(0, limit)
    .map((skill) => skill.id)
}
