import { useEffect, useMemo, useState } from 'react'
import type { DataCommit } from '../app/usePersistentData'
import { addRewardDefinition, createDefaultData, currentLedger, hasReachedGoal, removeRewardDefinition, updateSettings } from '../domain/data'
import { zurichDateKey } from '../domain/date'
import { formatReward, schoolTopicEnabled, schoolTopicLabel } from '../domain/reward'
import type { AppData, AppSettings, SchoolTopic } from '../domain/types'
import { createPin, validPin } from '../security/pin'
import { SKILLS } from '../curriculum/skills'
import { skillById } from '../curriculum/skills'
import { sevenDayInsights, skillsNeedingReview } from '../learning/insights'
import { masteryLabel } from '../learning/selector'
import { ArrowLeftIcon, CheckIcon, GiftIcon, SettingsIcon, TrashIcon } from '../components/Icons'
import { Toggle } from '../components/Toggle'
import { ParentGate } from './ParentGate'

interface ParentScreenProps {
  data: AppData
  commit: DataCommit
  onHome: () => void
}

export function ParentScreen({ data, commit, onHome }: ParentScreenProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(data.settings)
  const [saved, setSaved] = useState(false)
  const [changingPin, setChangingPin] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [newPinAgain, setNewPinAgain] = useState('')
  const [pinMessage, setPinMessage] = useState<string | null>(null)
  const [rewardMessage, setRewardMessage] = useState<string | null>(null)
  const [resetConfirmationOpen, setResetConfirmationOpen] = useState(false)
  const [newReward, setNewReward] = useState({
    label: '',
    minutes: 15,
    pointsGoal: 100,
    schoolTopic: 'times-tables' as SchoolTopic,
  })
  const dateKey = zurichDateKey()
  const ledger = currentLedger(data, dateKey)
  const roundAttempts = useMemo(
    () => data.attempts.filter(
      (attempt) => attempt.dateKey === dateKey && attempt.round === ledger.round,
    ),
    [data.attempts, dateKey, ledger.round],
  )
  const week = useMemo(() => sevenDayInsights(data, dateKey), [data, dateKey])
  const reviewSkillIds = useMemo(() => skillsNeedingReview(data, dateKey), [data, dateKey])
  const weekTotals = useMemo(() => week.reduce(
    (totals, day) => ({
      tasks: totals.tasks + day.tasks,
      firstTry: totals.firstTry + day.firstTry,
      hints: totals.hints + day.hints,
      rewards: totals.rewards + day.rewards,
    }),
    { tasks: 0, firstTry: 0, hints: 0, rewards: 0 },
  ), [week])
  const maxDayTasks = Math.max(1, ...week.map((day) => day.tasks))
  const collectedToday = data.collectedRewards.filter((reward) => reward.dateKey === dateKey)
  const pendingRewards = data.collectedRewards.filter((reward) => !reward.redeemedAt)

  useEffect(() => setSettings(data.settings), [data.settings])

  if (!unlocked) {
    return (
      <ParentGate
        data={data}
        commit={commit}
        onUnlocked={() => setUnlocked(true)}
        onCancel={onHome}
      />
    )
  }

  const save = (event: React.FormEvent) => {
    event.preventDefault()
    commit((current) => updateSettings(current, settings))
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  const savePin = async (event: React.FormEvent) => {
    event.preventDefault()
    setPinMessage(null)
    if (!validPin(newPin)) {
      setPinMessage('Die PIN muss aus vier Ziffern bestehen.')
      return
    }
    if (newPin !== newPinAgain) {
      setPinMessage('Die beiden PINs sind nicht gleich.')
      return
    }
    const created = await createPin(newPin)
    commit((current) => ({
      ...current,
      security: {
        pinHash: created.hash,
        pinSalt: created.salt,
        failedAttempts: 0,
        lockedUntil: null,
      },
    }))
    setNewPin('')
    setNewPinAgain('')
    setChangingPin(false)
    setPinMessage('PIN geändert.')
  }

  const firstTry = roundAttempts.filter((attempt) => attempt.wrongAnswers === 0).length
  const reachedGoal = hasReachedGoal(data, dateKey)
  const addReward = () => {
    if (!newReward.label.trim()) {
      setRewardMessage('Bitte gib der Belohnung einen Namen.')
      return
    }
    if (!schoolTopicEnabled(settings, newReward.schoolTopic)) {
      setRewardMessage('Bitte schalte diese Mathe-Kategorie zuerst frei.')
      return
    }
    commit((current) => addRewardDefinition(current, newReward))
    setNewReward((current) => ({ ...current, label: '' }))
    setRewardMessage('Belohnung hinzugefügt.')
  }

  const removeReward = (rewardId: string) => {
    commit((current) => removeRewardDefinition(current, rewardId))
  }

  const resetAllData = () => {
    commit(() => createDefaultData())
    setResetConfirmationOpen(false)
    onHome()
  }

  return (
    <main className="parent-shell">
      <header className="parent-header">
        <button className="icon-button icon-button--light" onClick={onHome} aria-label="Zurück zum Start"><ArrowLeftIcon /></button>
        <div><p className="eyebrow">Geschützter Bereich</p><h1>Elternübersicht</h1></div>
        <div className="parent-header__icon"><SettingsIcon /></div>
      </header>

      <div className="parent-content">
        <section className="parent-panel parent-panel--summary">
          <div className="section-heading">
            <div><p className="eyebrow">Heute</p><h2>Kurzer Überblick</h2></div>
            <span className={pendingRewards.length ? 'status-chip' : 'status-chip status-chip--done'}>
              {reachedGoal
                ? 'Belohnung bereit'
                : pendingRewards.length
                  ? `${pendingRewards.length} zum Einlösen`
                  : 'Alles eingelöst'}
            </span>
          </div>
          <div className="stat-grid">
            <div><strong>{ledger.points}</strong><span>Punkte dieser Runde</span></div>
            <div><strong>{roundAttempts.length}</strong><span>Aufgaben dieser Runde</span></div>
            <div><strong>{roundAttempts.length ? Math.round((firstTry / roundAttempts.length) * 100) : 0}%</strong><span>direkt gelöst</span></div>
            <div><strong>{collectedToday.length}</strong><span>heute gesammelt</span></div>
          </div>
        </section>

        <section className="parent-panel week-panel">
          <div className="section-heading">
            <div><p className="eyebrow">Letzte 7 Tage</p><h2>Lernen im Überblick</h2></div>
            <span className="status-chip">lokal gespeichert</span>
          </div>
          <div className="week-summary" aria-label="Summen der letzten sieben Tage">
            <div><strong>{weekTotals.tasks}</strong><span>Aufgaben</span></div>
            <div><strong>{weekTotals.tasks ? Math.round((weekTotals.firstTry / weekTotals.tasks) * 100) : 0}%</strong><span>direkt gelöst</span></div>
            <div><strong>{weekTotals.hints}</strong><span>mit Anschauung</span></div>
            <div><strong>{weekTotals.rewards}</strong><span>Belohnungen</span></div>
          </div>
          <div className="week-chart" aria-label="Aufgaben pro Tag in den letzten sieben Tagen">
            {week.map((day) => (
              <div className="week-day" key={day.dateKey}>
                <strong>{day.tasks}</strong>
                <span className="week-day__bar" aria-hidden="true"><i style={{ height: `${Math.max(day.tasks ? 16 : 3, (day.tasks / maxDayTasks) * 100)}%` }} /></span>
                <span>{day.weekday}</span>
                <small>{day.hints ? `${day.hints}× Hilfe` : 'ohne Hilfe'}</small>
              </div>
            ))}
          </div>
          <div className="review-callout">
            <strong>Als Nächstes wieder anschauen</strong>
            {reviewSkillIds.length ? (
              <ul>{reviewSkillIds.map((skillId) => <li key={skillId}>{skillById(skillId).label}</li>)}</ul>
            ) : (
              <p>Noch kein Lernweg ist zur Wiederholung fällig.</p>
            )}
          </div>
        </section>

        <section className="parent-panel mastery-panel">
          <div className="section-heading">
            <div><p className="eyebrow">Lernstand</p><h2>Alle zehn Reihen</h2></div>
            <span className="status-chip">nur auf diesem Gerät</span>
          </div>
          <p className="mastery-intro">Die Balken helfen bei der Auswahl der nächsten Aufgaben. Sie sind keine Schulnoten.</p>
          <div className="mastery-list">
            {SKILLS.map((skill) => {
              const state = data.mastery[skill.id]
              return (
                <div className="mastery-row" key={skill.id}>
                  <div className="mastery-row__labels">
                    <strong>{skill.label}</strong>
                    <span>{masteryLabel(state, dateKey)}</span>
                  </div>
                  <div className="mastery-track" role="progressbar" aria-label={skill.label} aria-valuemin={0} aria-valuemax={8} aria-valuenow={state.score}>
                    <span style={{ width: `${(state.score / 8) * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <form className="parent-panel settings-form" onSubmit={save}>
          <div className="section-heading">
            <div><p className="eyebrow">Belohnungsliste</p><h2>Belohnungen festlegen</h2></div>
            <GiftIcon />
          </div>

          <p className="settings-note">Jede Belohnung hat ihr eigenes Punkteziel. Geübt werden die ausgewählten Reihen. Das Kind wählt vor der Mission selbst aus der Liste.</p>

          <div className="parent-reward-list">
            {data.rewardDefinitions.map((reward) => {
              const inProgress = Object.values(data.ledgers).some(
                (entry) => entry.activeRewardId === reward.id && entry.points > 0,
              )
              return (
                <article className="parent-reward-item" key={reward.id}>
                  <div>
                    <strong>{formatReward(reward)}</strong>
                    <span>{reward.pointsGoal} Punkte · {schoolTopicLabel(reward.schoolTopic)}</span>
                  </div>
                  <button
                    type="button"
                    className="button button--ghost button--compact"
                    disabled={data.rewardDefinitions.length <= 1 || inProgress}
                    onClick={() => removeReward(reward.id)}
                    aria-label={`${formatReward(reward)} entfernen`}
                  >Entfernen</button>
                </article>
              )
            })}
          </div>

          <div className="settings-divider" />
          <h3>Neue Belohnung</h3>
          <div className="form-grid reward-definition-form">
            <label className="field field--wide">
              <span>Belohnung</span>
              <input
                maxLength={40}
                value={newReward.label}
                onChange={(event) => setNewReward({ ...newReward, label: event.target.value })}
                placeholder="z. B. Comic lesen"
              />
            </label>
            <label className="field">
              <span>Punkteziel</span>
              <select
                aria-label="Punkteziel"
                value={newReward.pointsGoal}
                onChange={(event) => setNewReward({ ...newReward, pointsGoal: Number(event.target.value) })}
              >
                {Array.from({ length: 16 }, (_, index) => 50 + index * 10).map((goal) => (
                  <option key={goal} value={goal}>{goal} Punkte ({goal / 10} Aufgaben)</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Dauer</span>
              <select
                aria-label="Dauer"
                value={newReward.minutes}
                onChange={(event) => setNewReward({ ...newReward, minutes: Number(event.target.value) })}
              >
                {[0, 10, 15, 20, 30, 45, 60].map((minutes) => (
                  <option key={minutes} value={minutes}>{minutes === 0 ? 'Keine Dauer' : `${minutes} Minuten`}</option>
                ))}
              </select>
            </label>
            <div className="reward-add-row field--wide">
              {rewardMessage && <span className={rewardMessage.includes('hinzugefügt') ? 'save-confirmation' : 'form-error'} role="status">{rewardMessage}</span>}
              <button className="button button--primary" type="button" onClick={addReward}>Belohnung hinzufügen</button>
            </div>
          </div>

          <div className="settings-divider" />
          <h3>Darstellung und Unterstützung</h3>
          <div className="toggle-list">
            <Toggle
              checked={settings.speechEnabled}
              label="Vorlesen erlauben"
              description="Aktiviert die Vorlesestimme und die Lautsprecher-Taste bei Aufgaben."
              onChange={(checked) => setSettings({
                ...settings,
                speechEnabled: checked,
                readAloud: checked ? settings.readAloud : false,
              })}
            />
            <Toggle
              checked={settings.speechEnabled && settings.readAloud}
              disabled={!settings.speechEnabled}
              label="Automatisch vorlesen"
              description="Liest jede neue Aufgabe automatisch langsam vor."
              onChange={(checked) => setSettings({ ...settings, readAloud: checked })}
            />
            <Toggle
              checked={settings.soundEffects}
              label="Ruhige Bestätigungstöne"
              description="Spielt nach einer gelösten Aufgabe einen kurzen, leisen Ton."
              onChange={(checked) => setSettings({ ...settings, soundEffects: checked })}
            />
            <Toggle
              checked={settings.reducedMotion}
              label="Weniger Bewegung"
              description="Animationen und Übergänge werden reduziert."
              onChange={(checked) => setSettings({ ...settings, reducedMotion: checked })}
            />
            <Toggle
              checked={settings.highContrast}
              label="Hoher Kontrast"
              description="Stärkere Konturen und dunklere Farben."
              onChange={(checked) => setSettings({ ...settings, highContrast: checked })}
            />
            <Toggle
              checked={settings.leftHanded}
              label="Linkshändige Anordnung"
              description="Die Eingabe liegt auf Tablets auf der linken Seite."
              onChange={(checked) => setSettings({ ...settings, leftHanded: checked })}
            />
          </div>

          <div className="save-row">
            {saved && <span className="save-confirmation" role="status"><CheckIcon /> Gespeichert</span>}
            <button className="button button--primary" type="submit">Einstellungen speichern</button>
          </div>
        </form>

        <section className="parent-panel security-panel">
          <div><p className="eyebrow">Sicherheit</p><h2>Eltern-PIN</h2></div>
          {!changingPin ? (
            <button className="button button--ghost" onClick={() => { setChangingPin(true); setPinMessage(null) }}>PIN ändern</button>
          ) : (
            <form onSubmit={savePin} className="pin-change-form">
              <label className="field"><span>Neue PIN</span><input type="password" inputMode="numeric" maxLength={4} value={newPin} onChange={(event) => setNewPin(event.target.value.replace(/\D/g, '').slice(0, 4))} /></label>
              <label className="field"><span>Wiederholen</span><input type="password" inputMode="numeric" maxLength={4} value={newPinAgain} onChange={(event) => setNewPinAgain(event.target.value.replace(/\D/g, '').slice(0, 4))} /></label>
              <div className="button-row"><button type="button" className="button button--ghost" onClick={() => setChangingPin(false)}>Abbrechen</button><button type="submit" className="button button--primary">PIN speichern</button></div>
            </form>
          )}
          {pinMessage && <p className={pinMessage.includes('geändert') ? 'save-confirmation' : 'form-error'} role="status">{pinMessage}</p>}
        </section>

        <section className="parent-panel data-reset-panel">
          <div>
            <p className="eyebrow">Datenverwaltung</p>
            <h2>Alle Daten zurücksetzen</h2>
            <p>Entfernt Lernfortschritt, Belohnungen, Einstellungen und Eltern-PIN dauerhaft von diesem Gerät.</p>
          </div>
          <button className="button button--danger" type="button" onClick={() => setResetConfirmationOpen(true)}>
            <TrashIcon /> Alle Daten zurücksetzen
          </button>
        </section>
      </div>

      {resetConfirmationOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="reset-title">
            <div className="modal-icon modal-icon--danger"><TrashIcon /></div>
            <p className="eyebrow">Letzte Bestätigung</p>
            <h2 id="reset-title">Wirklich alle Daten löschen?</h2>
            <p>Alle Missionen, Punkte, Lernstände, gesammelten Belohnungen, Einstellungen und die Eltern-PIN werden gelöscht. Das kann nicht rückgängig gemacht werden.</p>
            <div className="button-row">
              <button type="button" className="button button--ghost" onClick={() => setResetConfirmationOpen(false)}>Abbrechen</button>
              <button type="button" className="button button--danger" onClick={resetAllData}>Jetzt alles zurücksetzen</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
