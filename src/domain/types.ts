export type SchoolTopic = 'times-tables'
export type TableNumber = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 11 | 12

export type MissionSkin = 'number-trail' | 'shape-workshop' | 'market-day'

export interface AppSettings {
  pointsGoal: number
  rewardLabel: string
  rewardMinutes: number
  schoolTopic: SchoolTopic
  speechEnabled: boolean
  readAloud: boolean
  soundEffects: boolean
  reducedMotion: boolean
  highContrast: boolean
  leftHanded: boolean
  selectedTables: TableNumber[]
}

export interface ParentSecurity {
  pinHash: string | null
  pinSalt: string | null
  failedAttempts: number
  lockedUntil: string | null
}

export interface DailyLedger {
  dateKey: string
  round: number
  points: number
  activeRewardId: string | null
  missionSkin: MissionSkin | null
  practiceTables: TableNumber[] | null
  awardedChallengeIds: string[]
  redemptions: RewardRedemption[]
}

export interface RewardDefinition {
  id: string
  label: string
  minutes: number
  pointsGoal: number
  schoolTopic: SchoolTopic
}

export interface CollectedReward {
  id: string
  rewardId: string | null
  dateKey: string
  round: number
  collectedAt: string
  redeemedAt: string | null
  rewardLabel: string
  rewardMinutes: number
  points: number
  schoolTopic: SchoolTopic
}

export interface RewardRedemption {
  id: string
  round: number
  points: number
  redeemedAt: string
  rewardLabel: string
  rewardMinutes: number
}

export interface Attempt {
  challengeId: string
  dateKey: string
  round: number
  skillId: SkillId | null
  factor: number | null
  representation: ChallengeRepresentation | null
  wrongAnswers: number
  hintUsed: boolean
  completedAt: string
}

export interface AppData {
  version: 7
  settings: AppSettings
  security: ParentSecurity
  rewardDefinitions: RewardDefinition[]
  collectedRewards: CollectedReward[]
  ledgers: Record<string, DailyLedger>
  attempts: Attempt[]
  mastery: Record<SkillId, MasteryState>
}

export type SkillId = `table-${TableNumber}`

export type MasteryBand = 'new' | 'learning' | 'practising' | 'secure'

export interface MasteryState {
  skillId: SkillId
  band: MasteryBand
  score: number
  attempts: number
  independentSuccesses: number
  lastPractisedAt: string | null
  nextReviewDate: string | null
  factSuccesses: Partial<Record<number, number>>
  representationEvidence: Partial<Record<ChallengeRepresentation, number>>
}

export type ChallengeKind =
  | 'read-quantity'
  | 'build-number'
  | 'choose-order'
  | 'continue-sequence'
  | 'complete-ten'
  | 'complete-hundred'
  | 'addition'
  | 'subtraction'
  | 'double'
  | 'half'
  | 'decompose'
  | 'money'
  | 'time'
  | 'length'
  | 'shape-properties'
  | 'symmetry'
  | 'multiplication'
  | 'sharing'
  | 'word-problem'

export type ChallengeInteraction = 'number-input' | 'choice'

export type ChallengeRepresentation =
  | 'symbolic'
  | 'hundred-field'
  | 'ten-strip'
  | 'place-value'
  | 'number-line'
  | 'sequence'
  | 'groups'
  | 'part-whole'
  | 'money'
  | 'clock'
  | 'ruler'
  | 'shape'
  | 'symmetry-grid'
  | 'array'
  | 'sharing'

export type ChallengeVisual =
  | { type: 'none' }
  | { type: 'hundred-field'; value: number; mode: 'quantity' | 'complement' }
  | { type: 'ten-strip'; filled: number; total: 10 | 20 }
  | { type: 'place-value'; value: number }
  | { type: 'number-line'; minimum: number; maximum: number; start: number; end: number; jumps?: number[] }
  | { type: 'sequence'; values: Array<number | null> }
  | { type: 'groups'; groups: number[]; crossedGroup?: number }
  | { type: 'part-whole'; whole: number; known: number; missing: number }
  | { type: 'money'; coins: number[] }
  | { type: 'clock'; hour: number; minute: number; endHour?: number; endMinute?: number }
  | { type: 'ruler'; start: number; end: number; maximum: number }
  | { type: 'shape'; shape: 'circle' | 'triangle' | 'square' | 'rectangle' | 'pentagon' | 'hexagon' }
  | { type: 'symmetry-grid'; leftCells: Array<{ row: number; column: number }>; missingIndexes: number[]; showSolution: boolean }
  | { type: 'array'; rows: number; columns: number; showTotal: boolean }
  | { type: 'sharing'; total: number; groups: number; showGroups: boolean }

export interface Challenge {
  factor: number
  table: TableNumber
  id: string
  skillId: SkillId
  skillLabel: string
  kind: ChallengeKind
  interaction: ChallengeInteraction
  representation: ChallengeRepresentation
  difficulty: 1 | 2 | 3 | 4
  prompt: string
  spokenPrompt: string
  answer: number
  options?: number[]
  hint: string
  promptVisual: ChallengeVisual
  hintVisual: ChallengeVisual
}
