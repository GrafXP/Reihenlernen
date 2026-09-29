import { zurichDateKey } from './date'
import { emptyMasteryMap, SKILL_IDS, normaliseTables, TABLES } from '../curriculum/skills'
import { recordMasteryEvidence } from '../learning/mastery'
import { schoolTopicEnabled } from './reward'
import type {
  AppData,
  AppSettings,
  ChallengeRepresentation,
  CollectedReward,
  DailyLedger,
  MissionSkin,
  RewardDefinition,
  RewardRedemption,
  SchoolTopic,
  SkillId,
  TableNumber,
} from './types'

export const POINTS_PER_CHALLENGE = 10
const MAX_LEDGER_HISTORY = 40
const MAX_ATTEMPT_HISTORY = 500
const MAX_REDEMPTIONS_PER_DAY = 50
const MAX_COLLECTED_REWARDS = 500

export const DEFAULT_SETTINGS: AppSettings = {
  pointsGoal: 100,
  rewardLabel: 'Gamen',
  rewardMinutes: 30,
  schoolTopic: 'times-tables',
  speechEnabled: false,
  readAloud: false,
  soundEffects: false,
  reducedMotion: false,
  highContrast: false,
  leftHanded: false,
  selectedTables: [...TABLES],
}

export const DEFAULT_REWARD_DEFINITION: RewardDefinition = {
  id: 'reward-default',
  label: DEFAULT_SETTINGS.rewardLabel,
  minutes: DEFAULT_SETTINGS.rewardMinutes,
  pointsGoal: DEFAULT_SETTINGS.pointsGoal,
  schoolTopic: DEFAULT_SETTINGS.schoolTopic,
}

export function emptyLedger(dateKey: string): DailyLedger {
  return {
    dateKey,
    round: 0,
    points: 0,
    activeRewardId: null,
    missionSkin: null,
    practiceTables: null,
    awardedChallengeIds: [],
    redemptions: [],
  }
}

export function createDefaultData(now = new Date()): AppData {
  const dateKey = zurichDateKey(now)
  return {
    version: 7,
    settings: { ...DEFAULT_SETTINGS },
    security: {
      pinHash: null,
      pinSalt: null,
      failedAttempts: 0,
      lockedUntil: null,
    },
    rewardDefinitions: [{ ...DEFAULT_REWARD_DEFINITION }],
    collectedRewards: [],
    ledgers: { [dateKey]: emptyLedger(dateKey) },
    attempts: [],
    mastery: emptyMasteryMap(),
  }
}

export function currentLedger(data: AppData, dateKey: string): DailyLedger {
  return data.ledgers[dateKey] ?? emptyLedger(dateKey)
}

export function activeRewardDefinition(data: AppData, dateKey: string): RewardDefinition | null {
  const activeRewardId = currentLedger(data, dateKey).activeRewardId
  return data.rewardDefinitions.find((reward) => reward.id === activeRewardId) ?? null
}

export function activePointsGoal(data: AppData, dateKey: string): number {
  return activeRewardDefinition(data, dateKey)?.pointsGoal ?? data.settings.pointsGoal
}

export function activeSchoolTopic(data: AppData, dateKey: string): SchoolTopic {
  return activeRewardDefinition(data, dateKey)?.schoolTopic ?? data.settings.schoolTopic
}

export function hasReachedGoal(data: AppData, dateKey: string): boolean {
  const reward = activeRewardDefinition(data, dateKey)
  return reward !== null && currentLedger(data, dateKey).points >= reward.pointsGoal
}

export function selectRewardDefinition(
  data: AppData,
  dateKey: string,
  rewardId: string,
): AppData {
  const ledger = currentLedger(data, dateKey)
  if (ledger.points > 0 || ledger.awardedChallengeIds.length > 0) return data
  const reward = data.rewardDefinitions.find((entry) => entry.id === rewardId)
  if (!reward || !schoolTopicEnabled(data.settings, reward.schoolTopic)) return data
  if (ledger.activeRewardId === rewardId) return data

  return {
    ...data,
    ledgers: {
      ...data.ledgers,
      [dateKey]: { ...ledger, activeRewardId: rewardId, missionSkin: null },
    },
  }
}

export function selectMissionSkin(
  data: AppData,
  dateKey: string,
  missionSkin: MissionSkin,
): AppData {
  const ledger = currentLedger(data, dateKey)
  if (!ledger.activeRewardId) return data
  if (ledger.points > 0 || ledger.awardedChallengeIds.length > 0 || ledger.missionSkin === missionSkin) {
    return data
  }

  return {
    ...data,
    ledgers: {
      ...data.ledgers,
      [dateKey]: { ...ledger, missionSkin, practiceTables: [...data.settings.selectedTables] },
    },
  }
}

export function awardResolvedChallenge(
  data: AppData,
  input: {
    challengeId: string
    dateKey: string
    wrongAnswers: number
    hintUsed: boolean
    factor?: number
    skillId?: SkillId
    representation?: ChallengeRepresentation
    completedAt?: string
  },
): AppData {
  const ledger = currentLedger(data, input.dateKey)
  const reward = activeRewardDefinition(data, input.dateKey)
  if (!reward || ledger.points >= reward.pointsGoal) return data
  if (ledger.awardedChallengeIds.includes(input.challengeId)) return data

  const updatedLedger: DailyLedger = {
    ...ledger,
    points: Math.min(reward.pointsGoal, ledger.points + POINTS_PER_CHALLENGE),
    awardedChallengeIds: [...ledger.awardedChallengeIds, input.challengeId],
  }

  const completedAt = input.completedAt ?? new Date().toISOString()
  const nextMastery = input.skillId && input.representation
    ? {
        ...data.mastery,
        [input.skillId]: recordMasteryEvidence(data.mastery[input.skillId], {
          factor: input.factor,
          skillId: input.skillId,
          representation: input.representation,
          dateKey: input.dateKey,
          completedAt,
          wrongAnswers: input.wrongAnswers,
          hintUsed: input.hintUsed,
        }),
      }
    : data.mastery

  return pruneHistory({
    ...data,
    ledgers: { ...data.ledgers, [input.dateKey]: updatedLedger },
    attempts: [
      ...data.attempts,
      {
        challengeId: input.challengeId,
        dateKey: input.dateKey,
        round: ledger.round,
        factor: input.factor ?? null,
        skillId: input.skillId ?? null,
        representation: input.representation ?? null,
        wrongAnswers: Math.max(0, Math.floor(input.wrongAnswers)),
        hintUsed: input.hintUsed,
        completedAt,
      },
    ],
    mastery: nextMastery,
  })
}

export function collectActiveReward(
  data: AppData,
  dateKey: string,
  collectedAt = new Date().toISOString(),
): AppData {
  const ledger = currentLedger(data, dateKey)
  const reward = activeRewardDefinition(data, dateKey)
  if (!reward || ledger.points < reward.pointsGoal) return data
  const id = `${dateKey}:round-${ledger.round}:collected`
  if (data.collectedRewards.some((collected) => collected.id === id)) return data

  const collectedReward: CollectedReward = {
    id,
    rewardId: reward.id,
    dateKey,
    round: ledger.round,
    points: ledger.points,
    collectedAt,
    redeemedAt: null,
    rewardLabel: reward.label,
    rewardMinutes: reward.minutes,
    schoolTopic: reward.schoolTopic,
  }

  return {
    ...data,
    collectedRewards: [...data.collectedRewards, collectedReward].slice(-MAX_COLLECTED_REWARDS),
    ledgers: {
      ...data.ledgers,
      [dateKey]: {
        dateKey,
        round: ledger.round + 1,
        points: 0,
        activeRewardId: null,
        missionSkin: null,
        practiceTables: null,
        awardedChallengeIds: [],
        redemptions: ledger.redemptions,
      },
    },
  }
}

export function redeemCollectedReward(
  data: AppData,
  collectedRewardId: string,
  redeemedAt = new Date().toISOString(),
): AppData {
  const reward = data.collectedRewards.find((entry) => entry.id === collectedRewardId)
  if (!reward || reward.redeemedAt) return data
  return {
    ...data,
    collectedRewards: data.collectedRewards.map((entry) => entry.id === collectedRewardId
      ? { ...entry, redeemedAt }
      : entry),
  }
}

export function undoCollectedRewardRedemption(
  data: AppData,
  collectedRewardId: string,
): AppData {
  const reward = data.collectedRewards.find((entry) => entry.id === collectedRewardId)
  if (!reward?.redeemedAt) return data
  return {
    ...data,
    collectedRewards: data.collectedRewards.map((entry) => entry.id === collectedRewardId
      ? { ...entry, redeemedAt: null }
      : entry),
  }
}

export function addRewardDefinition(
  data: AppData,
  input: Omit<RewardDefinition, 'id'> & { id?: string },
): AppData {
  const reward = normaliseRewardDefinition(input, input.id ?? `reward-${Date.now()}-${data.rewardDefinitions.length}`)
  if (!reward || data.rewardDefinitions.some((entry) => entry.id === reward.id)) return data
  return { ...data, rewardDefinitions: [...data.rewardDefinitions, reward] }
}

export function removeRewardDefinition(data: AppData, rewardId: string): AppData {
  if (data.rewardDefinitions.length <= 1) return data
  if (Object.values(data.ledgers).some((ledger) => ledger.activeRewardId === rewardId && ledger.points > 0)) return data
  const rewardDefinitions = data.rewardDefinitions.filter((reward) => reward.id !== rewardId)
  return rewardDefinitions.length === data.rewardDefinitions.length
    ? data
    : {
        ...data,
        rewardDefinitions,
        ledgers: Object.fromEntries(Object.entries(data.ledgers).map(([dateKey, ledger]) => [
          dateKey,
          ledger.activeRewardId === rewardId
            ? { ...ledger, activeRewardId: null, missionSkin: null }
            : ledger,
        ])),
      }
}

export function updateSettings(
  data: AppData,
  changes: Partial<AppSettings>,
): AppData {
  const next = { ...data.settings, ...changes }
  const safeGoal = Math.min(200, Math.max(50, Math.round(next.pointsGoal / 10) * 10))
  const safeMinutes = Math.min(180, Math.max(0, Math.round(next.rewardMinutes)))
  const safeLabel = next.rewardLabel.trim().slice(0, 40) || DEFAULT_SETTINGS.rewardLabel
  const speechEnabled = next.speechEnabled === true
  const schoolTopic = DEFAULT_SETTINGS.schoolTopic

  return {
    ...data,
    settings: {
      ...next,
      pointsGoal: safeGoal,
      rewardMinutes: safeMinutes,
      rewardLabel: safeLabel,
      schoolTopic,
      selectedTables: normaliseTables(next.selectedTables),
      speechEnabled,
      readAloud: speechEnabled && next.readAloud === true,
    },
  }
}

export function normaliseData(value: unknown, now = new Date()): AppData {
  if (!value || typeof value !== 'object') return createDefaultData(now)
  const dataVersion = (value as { version?: number }).version
  if (![1, 2, 3, 4, 5, 6, 7].includes(dataVersion ?? 0)) return createDefaultData(now)
  const candidate = value as Partial<Omit<AppData, 'version'>> & { version?: number }

  const base = createDefaultData(now)
  const settings = candidate.settings ?? base.settings
  const schoolTopic = DEFAULT_SETTINGS.schoolTopic
  const normalisedSettings = updateSettings(base, settings).settings
  const rewardDefinitions = normaliseRewardDefinitions(candidate.rewardDefinitions, normalisedSettings)
  const rewardIds = new Set(rewardDefinitions.map((reward) => reward.id))
  const ledgers = Object.fromEntries(
    Object.entries(normaliseLedgers(candidate.ledgers, base, rewardDefinitions[0].id))
      .map(([dateKey, ledger]) => [
        dateKey,
        ledger.activeRewardId && !rewardIds.has(ledger.activeRewardId)
          ? {
              ...ledger,
              activeRewardId: ledger.points > 0 || ledger.missionSkin
                ? rewardDefinitions[0].id
                : null,
            }
          : ledger,
      ]),
  )
  const collectedRewards = (dataVersion ?? 0) >= 6
    ? normaliseCollectedRewards(candidate.collectedRewards)
    : legacyCollectedRewards(ledgers, schoolTopic)

  const merged: AppData = {
    version: 7,
    settings: normalisedSettings,
    security: { ...base.security, ...(candidate.security ?? {}) },
    rewardDefinitions,
    collectedRewards,
    ledgers,
    attempts: Array.isArray(candidate.attempts)
      ? candidate.attempts.map((attempt) => ({
          ...attempt,
          round: Number.isInteger(attempt.round) && Number(attempt.round) >= 0
            ? Number(attempt.round)
            : 0,
          factor: attempt.factor ?? null,
          skillId: attempt.skillId && SKILL_IDS.includes(attempt.skillId) ? attempt.skillId : null,
          representation: attempt.representation ?? null,
        }))
      : [],
    mastery: Object.fromEntries(
      SKILL_IDS.map((skillId) => [
        skillId,
        {
          ...base.mastery[skillId],
          ...(candidate.mastery?.[skillId] ?? {}),
          skillId,
          representationEvidence: {
            ...base.mastery[skillId].representationEvidence,
            ...(candidate.mastery?.[skillId]?.representationEvidence ?? {}),
          },
        },
      ]),
    ) as AppData['mastery'],
  }

  return updateSettings(merged, {})
}

function normaliseLedgers(
  value: unknown,
  base: AppData,
  fallbackRewardId: string,
): Record<string, DailyLedger> {
  if (!value || typeof value !== 'object') return base.ledgers

  return Object.fromEntries(
    Object.entries(value).map(([dateKey, rawLedger]) => [
      dateKey,
      normaliseLedger(dateKey, rawLedger, fallbackRewardId),
    ]),
  )
}

function normaliseLedger(dateKey: string, value: unknown, fallbackRewardId: string): DailyLedger {
  if (!value || typeof value !== 'object') return emptyLedger(dateKey)
  const ledger = value as Record<string, unknown>
  const legacyRedeemedAt = typeof ledger.redeemedAt === 'string' ? ledger.redeemedAt : null
  const legacyRedemption: RewardRedemption[] = legacyRedeemedAt
    ? [{
        id: `${dateKey}:0:${legacyRedeemedAt}`,
        round: 0,
        points: safeNonNegativeInteger(ledger.points),
        redeemedAt: legacyRedeemedAt,
        rewardLabel: typeof ledger.redeemedRewardLabel === 'string'
          ? ledger.redeemedRewardLabel
          : DEFAULT_SETTINGS.rewardLabel,
        rewardMinutes: safeNonNegativeInteger(ledger.redeemedRewardMinutes),
      }]
    : []
  const redemptions = Array.isArray(ledger.redemptions)
    ? ledger.redemptions.flatMap((redemption, index) => normaliseRedemption(redemption, dateKey, index))
    : legacyRedemption
  const completedLegacyRound = legacyRedemption.length > 0 && !Array.isArray(ledger.redemptions)
  const awardedChallengeIds = Array.isArray(ledger.awardedChallengeIds)
    ? ledger.awardedChallengeIds.filter((id): id is string => typeof id === 'string')
    : []
  const missionSkin: MissionSkin | null = ledger.missionSkin === 'number-trail'
    || ledger.missionSkin === 'shape-workshop'
    || ledger.missionSkin === 'market-day'
    ? ledger.missionSkin
    : safeNonNegativeInteger(ledger.points) > 0 || awardedChallengeIds.length > 0
      ? 'number-trail'
      : null

  return {
    dateKey,
    round: completedLegacyRound
      ? 1
      : safeNonNegativeInteger(ledger.round),
    points: completedLegacyRound ? 0 : safeNonNegativeInteger(ledger.points),
    activeRewardId: completedLegacyRound
      ? null
      : typeof ledger.activeRewardId === 'string'
        ? ledger.activeRewardId
        : missionSkin || safeNonNegativeInteger(ledger.points) > 0
          ? fallbackRewardId
          : null,
    missionSkin: completedLegacyRound ? null : missionSkin,
    practiceTables: Array.isArray(ledger.practiceTables) ? normaliseTables(ledger.practiceTables) : null,
    awardedChallengeIds: completedLegacyRound
      ? []
      : awardedChallengeIds,
    redemptions: redemptions.slice(-MAX_REDEMPTIONS_PER_DAY),
  }
}

function normaliseRewardDefinitions(value: unknown, settings: AppSettings): RewardDefinition[] {
  const definitions = Array.isArray(value)
    ? value.flatMap((reward, index) => {
        const normalised = normaliseRewardDefinition(reward, `reward-${index}`)
        return normalised ? [normalised] : []
      })
    : []

  return definitions.length > 0
    ? definitions
    : [{
        id: DEFAULT_REWARD_DEFINITION.id,
        label: settings.rewardLabel,
        minutes: settings.rewardMinutes,
        pointsGoal: settings.pointsGoal,
        schoolTopic: settings.schoolTopic,
      }]
}

function normaliseRewardDefinition(value: unknown, fallbackId: string): RewardDefinition | null {
  if (!value || typeof value !== 'object') return null
  const reward = value as Record<string, unknown>
  const label = typeof reward.label === 'string' ? reward.label.trim().slice(0, 40) : ''
  if (!label) return null
  return {
    id: typeof reward.id === 'string' && reward.id ? reward.id : fallbackId,
    label,
    minutes: Math.min(180, safeNonNegativeInteger(reward.minutes)),
    pointsGoal: safePointsGoal(reward.pointsGoal),
    schoolTopic: safeSchoolTopic(reward.schoolTopic),
  }
}

function normaliseCollectedRewards(value: unknown): CollectedReward[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry, index) => normaliseCollectedReward(entry, index))
    .slice(-MAX_COLLECTED_REWARDS)
}

function normaliseCollectedReward(value: unknown, index: number): CollectedReward[] {
  if (!value || typeof value !== 'object') return []
  const reward = value as Record<string, unknown>
  if (typeof reward.dateKey !== 'string'
    || typeof reward.collectedAt !== 'string'
    || typeof reward.rewardLabel !== 'string') return []
  const round = safeNonNegativeInteger(reward.round)
  return [{
    id: typeof reward.id === 'string' ? reward.id : `${reward.dateKey}:round-${round}:collected-${index}`,
    rewardId: typeof reward.rewardId === 'string' ? reward.rewardId : null,
    dateKey: reward.dateKey,
    round,
    collectedAt: reward.collectedAt,
    redeemedAt: typeof reward.redeemedAt === 'string' ? reward.redeemedAt : null,
    rewardLabel: reward.rewardLabel.trim().slice(0, 40) || DEFAULT_SETTINGS.rewardLabel,
    rewardMinutes: Math.min(180, safeNonNegativeInteger(reward.rewardMinutes)),
    points: safeNonNegativeInteger(reward.points),
    schoolTopic: safeSchoolTopic(reward.schoolTopic),
  }]
}

function legacyCollectedRewards(
  ledgers: Record<string, DailyLedger>,
  schoolTopic: SchoolTopic,
): CollectedReward[] {
  return Object.values(ledgers).flatMap((ledger) => ledger.redemptions.map((redemption) => ({
    id: `legacy:${redemption.id}`,
    rewardId: null,
    dateKey: ledger.dateKey,
    round: redemption.round,
    collectedAt: redemption.redeemedAt,
    redeemedAt: redemption.redeemedAt,
    rewardLabel: redemption.rewardLabel,
    rewardMinutes: redemption.rewardMinutes,
    points: redemption.points,
    schoolTopic,
  }))).slice(-MAX_COLLECTED_REWARDS)
}

function normaliseRedemption(
  value: unknown,
  dateKey: string,
  index: number,
): RewardRedemption[] {
  if (!value || typeof value !== 'object') return []
  const redemption = value as Record<string, unknown>
  if (typeof redemption.redeemedAt !== 'string' || typeof redemption.rewardLabel !== 'string') return []
  const round = safeNonNegativeInteger(redemption.round)
  return [{
    id: typeof redemption.id === 'string'
      ? redemption.id
      : `${dateKey}:${round}:${redemption.redeemedAt}:${index}`,
    round,
    points: safeNonNegativeInteger(redemption.points),
    redeemedAt: redemption.redeemedAt,
    rewardLabel: redemption.rewardLabel,
    rewardMinutes: safeNonNegativeInteger(redemption.rewardMinutes),
  }]
}

function safeNonNegativeInteger(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0
}

function safePointsGoal(value: unknown): number {
  const numeric = typeof value === 'number' && Number.isFinite(value)
    ? value
    : DEFAULT_SETTINGS.pointsGoal
  return Math.min(200, Math.max(50, Math.round(numeric / 10) * 10))
}

function safeSchoolTopic(_value: unknown): SchoolTopic {
  return DEFAULT_SETTINGS.schoolTopic
}

function pruneHistory(data: AppData): AppData {
  const ledgerEntries = Object.entries(data.ledgers)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, MAX_LEDGER_HISTORY)

  return {
    ...data,
    ledgers: Object.fromEntries(ledgerEntries),
    attempts: data.attempts.slice(-MAX_ATTEMPT_HISTORY),
  }
}

export function selectPracticeTables(data: AppData, dateKey: string, tables: TableNumber[]): AppData {
  const ledger = currentLedger(data, dateKey)
  if (ledger.points > 0 || ledger.awardedChallengeIds.length > 0 || tables.length === 0) return data
  const selectedTables = normaliseTables(tables)
  return {
    ...data, settings: { ...data.settings, selectedTables },
    ledgers: { ...data.ledgers, [dateKey]: { ...ledger, practiceTables: selectedTables } },
  }
}
