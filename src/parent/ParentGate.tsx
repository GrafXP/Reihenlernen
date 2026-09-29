import { useState } from 'react'
import type { DataCommit } from '../app/usePersistentData'
import type { AppData } from '../domain/types'
import { createPin, validPin, verifyPin } from '../security/pin'
import { LockIcon } from '../components/Icons'

interface ParentGateProps {
  data: AppData
  commit: DataCommit
  title?: string
  actionLabel?: string
  onUnlocked: () => void
  onCancel: () => void
}

export function ParentGate({
  data,
  commit,
  title = 'Bereich für Erwachsene',
  actionLabel = 'Öffnen',
  onUnlocked,
  onCancel,
}: ParentGateProps) {
  const needsSetup = !data.security.pinHash || !data.security.pinSalt
  const [pin, setPin] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const lockedUntil = data.security.lockedUntil
    ? new Date(data.security.lockedUntil).getTime()
    : 0
  const isLocked = lockedUntil > Date.now()

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (isLocked) {
      setError('Zu viele Versuche. Bitte warte eine Minute.')
      return
    }

    if (!validPin(pin)) {
      setError('Bitte gib vier Ziffern ein.')
      return
    }

    setBusy(true)
    try {
      if (needsSetup) {
        if (pin !== confirmation) {
          setError('Die beiden PINs sind nicht gleich.')
          return
        }
        const created = await createPin(pin)
        commit((current) => ({
          ...current,
          security: {
            pinHash: created.hash,
            pinSalt: created.salt,
            failedAttempts: 0,
            lockedUntil: null,
          },
        }))
        onUnlocked()
        return
      }

      const accepted = await verifyPin(
        pin,
        data.security.pinHash!,
        data.security.pinSalt!,
      )
      if (accepted) {
        commit((current) => ({
          ...current,
          security: { ...current.security, failedAttempts: 0, lockedUntil: null },
        }))
        onUnlocked()
        return
      }

      const failedAttempts = data.security.failedAttempts + 1
      const shouldLock = failedAttempts >= 5
      commit((current) => ({
        ...current,
        security: {
          ...current.security,
          failedAttempts: shouldLock ? 0 : failedAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + 60_000).toISOString() : null,
        },
      }))
      setPin('')
      setError(shouldLock ? 'Zu viele Versuche. Bitte warte eine Minute.' : 'Diese PIN stimmt nicht.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card parent-gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
        <div className="modal-icon"><LockIcon /></div>
        <p className="eyebrow">Elternbereich</p>
        <h2 id="gate-title">{needsSetup ? 'Eltern-PIN einrichten' : title}</h2>
        <p>
          {needsSetup
            ? 'Lege einmalig eine vierstellige PIN fest. Das Kind sollte sie nicht kennen.'
            : 'Gib deine vierstellige Eltern-PIN ein.'}
        </p>
        <form onSubmit={submit}>
          <label className="field">
            <span>{needsSetup ? 'Neue PIN' : 'PIN'}</span>
            <input
              autoFocus
              type="password"
              inputMode="numeric"
              autoComplete={needsSetup ? 'new-password' : 'current-password'}
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
            />
          </label>
          {needsSetup && (
            <label className="field">
              <span>PIN wiederholen</span>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                pattern="[0-9]*"
                maxLength={4}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            </label>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="button-row">
            <button type="button" className="button button--ghost" onClick={onCancel}>Abbrechen</button>
            <button type="submit" className="button button--primary" disabled={busy || isLocked}>
              {busy ? 'Prüfen …' : needsSetup ? 'PIN speichern' : actionLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
