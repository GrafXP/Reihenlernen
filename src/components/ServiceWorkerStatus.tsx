import { useRegisterSW } from 'virtual:pwa-register/react'

export function ServiceWorkerStatus() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!offlineReady && !needRefresh) return null

  return (
    <aside className="update-toast" role="status">
      <p>{offlineReady ? 'Die App ist jetzt offline bereit.' : 'Eine neue Version ist verfügbar.'}</p>
      {needRefresh && <button onClick={() => void updateServiceWorker(true)}>Aktualisieren</button>}
      <button aria-label="Hinweis schliessen" onClick={() => { setOfflineReady(false); setNeedRefresh(false) }}>×</button>
    </aside>
  )
}
