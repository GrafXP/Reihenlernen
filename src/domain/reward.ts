import type { AppSettings, RewardDefinition, SchoolTopic } from './types'

type RewardDisplay =
  | Pick<AppSettings, 'rewardLabel' | 'rewardMinutes'>
  | Pick<RewardDefinition, 'label' | 'minutes'>

export function formatReward(reward: RewardDisplay): string {
  const label = 'label' in reward ? reward.label : reward.rewardLabel
  const minutes = 'minutes' in reward ? reward.minutes : reward.rewardMinutes
  return minutes > 0 ? `${minutes} Min. ${label}` : label
}

export const SCHOOL_TOPICS: Array<{ id: SchoolTopic; label: string }> = [
  { id: 'times-tables', label: 'Einmaleins · 2–9, 11 und 12' },
]
export function schoolTopicLabel(_topic: SchoolTopic): string { return SCHOOL_TOPICS[0].label }
export function schoolTopicEnabled(_settings: AppSettings, _topic: SchoolTopic): boolean { return true }
