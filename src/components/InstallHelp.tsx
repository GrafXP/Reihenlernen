import { InstallIcon } from './Icons'

interface InstallHelpProps {
  canPrompt: boolean
  installed: boolean
  isIos: boolean
  install: () => Promise<boolean>
  onClose: () => void
}

export function InstallHelp({ canPrompt, installed, isIos, install, onClose }: InstallHelpProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="install-title">
        <div className="modal-icon"><InstallIcon /></div>
        <p className="eyebrow">Auf diesem Gerät</p>
        <h2 id="install-title">App installieren</h2>
        {installed ? (
          <p>Reihen-Mission ist bereits wie eine App installiert.</p>
        ) : canPrompt ? (
          <p>Installiere Reihen-Mission auf dem Startbildschirm. Danach startet sie schnell und funktioniert auch offline.</p>
        ) : isIos ? (
          <ol className="install-steps">
            <li>Tippe im Browser auf <strong>Teilen</strong>.</li>
            <li>Wähle <strong>Zum Home-Bildschirm</strong>.</li>
            <li>Tippe auf <strong>Hinzufügen</strong>.</li>
          </ol>
        ) : (
          <p>Öffne das Browsermenü und wähle <strong>App installieren</strong> oder <strong>Zum Startbildschirm hinzufügen</strong>.</p>
        )}
        <div className="button-row">
          <button className="button button--ghost" onClick={onClose}>Schliessen</button>
          {canPrompt && !installed && <button className="button button--primary" onClick={() => void install().then(onClose)}>Jetzt installieren</button>}
        </div>
      </section>
    </div>
  )
}
