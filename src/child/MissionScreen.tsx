import { useEffect, useState } from 'react'
import type { DataCommit } from '../app/usePersistentData'
import { speak, stopSpeaking } from '../accessibility/speech'
import { playSuccessSound } from '../accessibility/sound'
import { activePointsGoal, awardResolvedChallenge } from '../domain/data'
import { challengeForSession } from '../domain/challenges'
import type { AppData, DailyLedger } from '../domain/types'
import { ArrowLeftIcon, BackspaceIcon, CheckIcon, SpeakerIcon } from '../components/Icons'
import { ChallengeVisual } from './ChallengeVisual'
import { MissionMap } from './MissionMap'
import { missionById } from '../game/missions'

interface MissionScreenProps {
  data: AppData
  ledger: DailyLedger
  dateKey: string
  commit: DataCommit
  onExit: () => void
  onDone: () => void
}

export function MissionScreen({ data, ledger, dateKey, commit, onExit, onDone }: MissionScreenProps) {
  const mission = missionById(ledger.missionSkin)
  const pointsGoal = activePointsGoal(data, dateKey)
  const initialIndex = ledger.awardedChallengeIds.length
  const [startedAtGoal] = useState(ledger.points >= pointsGoal)
  const [challengeIndex, setChallengeIndex] = useState(initialIndex)
  const [challenge, setChallenge] = useState(() => challengeForSession(data, dateKey, initialIndex))
  const [answer, setAnswer] = useState('')
  const [wrongAnswers, setWrongAnswers] = useState(0)
  const [resolved, setResolved] = useState(false)
  const [helpRequested, setHelpRequested] = useState(false)
  const showHint = helpRequested || wrongAnswers >= 2
  const displayedPoints = Math.min(pointsGoal, ledger.points)

  useEffect(() => {
    if (data.settings.speechEnabled && data.settings.readAloud) speak(challenge.spokenPrompt)
    return stopSpeaking
  }, [challenge.spokenPrompt, data.settings.speechEnabled, data.settings.readAloud])

  useEffect(() => {
    if (startedAtGoal) onDone()
  }, [onDone, startedAtGoal])

  if (startedAtGoal) {
    return <main className="loading-screen"><p>Deine Belohnung wird bereitgemacht …</p></main>
  }

  const enterDigit = (digit: number) => {
    if (resolved) return
    setAnswer((current) => `${current}${digit}`.slice(0, 3))
  }

  const checkAnswer = (event: React.FormEvent) => {
    event.preventDefault()
    if (resolved || answer === '') return
    if (Number(answer) !== challenge.answer) {
      setWrongAnswers((count) => count + 1)
      setAnswer('')
      return
    }

    commit((current) =>
      awardResolvedChallenge(current, {
        challengeId: challenge.id,
        dateKey,
        skillId: challenge.skillId,
        factor: challenge.factor,
        representation: challenge.representation,
        wrongAnswers,
        hintUsed: showHint,
      }),
    )
    if (data.settings.soundEffects) playSuccessSound()
    setResolved(true)
  }

  const next = () => {
    if (ledger.points >= pointsGoal) {
      onDone()
      return
    }
    const nextIndex = challengeIndex + 1
    setChallengeIndex(nextIndex)
    setChallenge(challengeForSession(data, dateKey, nextIndex))
    setAnswer('')
    setWrongAnswers(0)
    setHelpRequested(false)
    setResolved(false)
  }

  return (
    <main className={`mission-shell mission-shell--${mission.id}`}>
      <header className="mission-header">
        <button className="icon-button" onClick={onExit} aria-label="Mission verlassen"><ArrowLeftIcon /></button>
        <div className="mission-progress">
          <div className="mission-progress__labels">
            <span>{mission.name} · {challenge.skillLabel}</span><strong>{displayedPoints} / {pointsGoal}</strong>
          </div>
          <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={pointsGoal} aria-valuenow={displayedPoints}>
            <span style={{ width: `${(displayedPoints / pointsGoal) * 100}%` }} />
          </div>
        </div>
        {data.settings.speechEnabled && (
          <button
            className="icon-button"
            onClick={() => speak(challenge.spokenPrompt)}
            aria-label="Aufgabe vorlesen"
          ><SpeakerIcon /></button>
        )}
      </header>

      <MissionMap
        missionSkin={mission.id}
        points={ledger.points}
        goal={pointsGoal}
      />

      <section className="challenge-card">
        <div className="challenge-number">Aufgabe {challengeIndex + 1} · {challenge.skillLabel}</div>
        <p className="challenge-instruction">Rechne in Ruhe.</p>
        <h1 className={challenge.prompt.length > 24 ? 'challenge-prompt--question' : ''}>{challenge.prompt}</h1>

        {challenge.promptVisual.type !== 'none' && (
          <div className="prompt-visual">
            <ChallengeVisual visual={challenge.promptVisual} />
          </div>
        )}

        {!showHint && !resolved && <button className="hint-request text-button" onClick={() => setHelpRequested(true)}>Zeig mir einen Rechentrick</button>}

        {showHint && !resolved && (
          <aside className="hint-card" aria-live="polite">
            <strong>Schau mal:</strong>
            <p>{challenge.hint}</p>
            <ChallengeVisual visual={challenge.hintVisual} reveal />
          </aside>
        )}

        <form onSubmit={checkAnswer} className={data.settings.leftHanded ? 'answer-form answer-form--left' : 'answer-form'}>
          {challenge.interaction === 'number-input' && (
            <label className="answer-display">
              <span className="sr-only">Deine Antwort</span>
              <input
                aria-label="Deine Antwort"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                value={answer}
                disabled={resolved}
                placeholder="?"
                onChange={(event) => setAnswer(event.target.value.replace(/\D/g, '').slice(0, 3))}
              />
            </label>
          )}

          {!resolved && challenge.interaction === 'number-input' && (
            <div className="number-pad" aria-label="Zahlentastatur">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button type="button" key={digit} onClick={() => enterDigit(digit)}>{digit}</button>
              ))}
              <button type="button" className="number-pad__action" onClick={() => setAnswer((current) => current.slice(0, -1))} aria-label="Letzte Ziffer löschen"><BackspaceIcon /></button>
              <button type="button" onClick={() => enterDigit(0)}>0</button>
              <button type="submit" className="number-pad__check" disabled={!answer} aria-label="Antwort prüfen"><CheckIcon /></button>
            </div>
          )}
          {!resolved && challenge.interaction === 'choice' && (
            <div className="choice-grid" aria-label="Antwortmöglichkeiten">
              {challenge.options?.map((option) => (
                <button
                  type="button"
                  key={option}
                  className={answer === String(option) ? 'choice-card choice-card--selected' : 'choice-card'}
                  aria-pressed={answer === String(option)}
                  onClick={() => setAnswer(String(option))}
                >{option}</button>
              ))}
              <button type="submit" className="button button--primary choice-submit" disabled={!answer}>Antwort prüfen</button>
            </div>
          )}
        </form>

        <div className="feedback-area" aria-live="polite">
          {wrongAnswers > 0 && !resolved && (
            <p className="feedback feedback--try">{showHint ? 'Nutze die Punkte und versuche es nochmals.' : 'Fast – probier es noch einmal.'}</p>
          )}
          {resolved && (
            <div className="feedback feedback--success">
              <span className="feedback__check"><CheckIcon /></span>
              <span className="feedback__sparkles" aria-hidden="true"><i /><i /><i /></span>
              <div><strong>Genau!</strong><p>Du bekommst 10 Punkte.</p></div>
              <button className="button button--primary" type="button" onClick={next}>Weiter</button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
