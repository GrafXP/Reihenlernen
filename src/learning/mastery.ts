import { emptyMastery } from '../curriculum/skills'
import { addCalendarDays } from '../domain/date'
import type {
  ChallengeRepresentation,
  MasteryBand,
  MasteryState,
  SkillId,
} from '../domain/types'

function bandForScore(score: number): MasteryBand {
  if (score <= 0) return 'new'
  if (score <= 2) return 'learning'
  if (score <= 5) return 'practising'
  return 'secure'
}

function reviewInterval(score: number): number {
  if (score <= 1) return 1
  if (score <= 3) return 3
  if (score <= 5) return 7
  return 14
}

export function recordMasteryEvidence(
  current: MasteryState | undefined,
  evidence: {
    factor?: number
    skillId: SkillId
    representation: ChallengeRepresentation
    dateKey: string
    completedAt: string
    wrongAnswers: number
    hintUsed: boolean
  },
): MasteryState {
  const state = current ?? emptyMastery(evidence.skillId)
  const independent = evidence.wrongAnswers === 0 && !evidence.hintUsed
  const scoreChange = independent
    ? 2
    : evidence.wrongAnswers <= 1 && !evidence.hintUsed
      ? 1
      : evidence.wrongAnswers >= 2
        ? -1
        : 0
  const score = Math.min(8, Math.max(0, state.score + scoreChange))

  const factSuccesses = { ...state.factSuccesses }
  if (independent && evidence.factor) {
    factSuccesses[evidence.factor] = (factSuccesses[evidence.factor] ?? 0) + 1
  }
  const covered = Object.values(factSuccesses).filter((count) => count && count > 0).length
  const band = bandForScore(score)
  return {
    ...state,
    factSuccesses,
    band: band === 'secure' && covered < 12 ? 'practising' : band,
    score,
    attempts: state.attempts + 1,
    independentSuccesses: state.independentSuccesses + (independent ? 1 : 0),
    lastPractisedAt: evidence.completedAt,
    nextReviewDate: addCalendarDays(evidence.dateKey, reviewInterval(score)),
    representationEvidence: {
      ...state.representationEvidence,
      [evidence.representation]:
        (state.representationEvidence[evidence.representation] ?? 0) + 1,
    },
  }
}
