import { useEffect, useState } from 'react'
import { usePersistentData } from './app/usePersistentData'
import { useRoute } from './app/useRoute'
import { useInstallPrompt } from './app/useInstallPrompt'
import { activeRewardDefinition, currentLedger, hasReachedGoal, selectPracticeTables } from './domain/data'
import { zurichDateKey } from './domain/date'
import type { TableNumber } from './domain/types'
import { LearnScreen } from './child/LearnScreen'
import { HomeScreen } from './child/HomeScreen'
import { MissionPicker } from './child/MissionPicker'
import { MissionScreen } from './child/MissionScreen'
import { DoneScreen } from './child/DoneScreen'
import { RewardScreen } from './child/RewardScreen'
import { ParentScreen } from './parent/ParentScreen'
import { InstallHelp } from './components/InstallHelp'
import { ServiceWorkerStatus } from './components/ServiceWorkerStatus'
import './styles.css'

export default function App() {
  const { data, loading, error, commit } = usePersistentData()
  const [route, navigate] = useRoute()
  const installPrompt = useInstallPrompt()
  const [installOpen, setInstallOpen] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (loading) {
    return <main className="loading-screen"><div className="loading-mark">×</div><p>Reihen-Mission wird bereitgemacht …</p></main>
  }

  if (error || !data) {
    return (
      <main className="error-screen">
        <h1>Das hat nicht geklappt.</h1>
        <p>{error ?? 'Die App-Daten fehlen.'}</p>
        <button className="button button--primary" onClick={() => window.location.reload()}>Nochmals versuchen</button>
      </main>
    )
  }

  const dateKey = zurichDateKey()
  const ledger = currentLedger(data, dateKey)
  const activeReward = activeRewardDefinition(data, dateKey)
  const reachedGoal = hasReachedGoal(data, dateKey)
  const appClassName = [
    'app',
    `app--skin-${ledger.missionSkin ?? 'number-trail'}`,
    data.settings.highContrast ? 'app--high-contrast' : '',
    data.settings.reducedMotion ? 'app--reduced-motion' : '',
  ].filter(Boolean).join(' ')

  let screen: React.ReactNode
  if (route.startsWith('/learn/')) {
    const table = Number(route.split('/')[2]) as TableNumber
    screen = <LearnScreen table={table} data={data} practiceLocked={ledger.points > 0}
      onHome={() => navigate('/')} onTable={(next) => navigate(`/learn/${next}`)}
      onPractice={() => {
        commit((current) => selectPracticeTables(current, dateKey, [table]))
        navigate(!activeReward ? '/rewards' : ledger.missionSkin ? '/mission' : '/choose')
      }} />
  } else if (route === '/parent') {
    screen = <ParentScreen data={data} commit={commit} onHome={() => navigate('/')} />
  } else if (route === '/rewards') {
    screen = (
      <RewardScreen
        data={data}
        ledger={ledger}
        dateKey={dateKey}
        commit={commit}
        onHome={() => navigate('/')}
        onSelected={() => navigate('/choose')}
      />
    )
  } else if (route === '/choose' && activeReward && !reachedGoal && ledger.points === 0) {
    screen = (
      <MissionPicker
        dateKey={dateKey}
        commit={commit}
        onSelected={() => navigate('/mission')}
        onCancel={() => navigate('/')}
      />
    )
  } else if (route === '/mission') {
    screen = activeReward && ledger.missionSkin ? (
      <MissionScreen
        data={data}
        ledger={ledger}
        dateKey={dateKey}
        commit={commit}
        onExit={() => navigate('/')}
        onDone={() => navigate('/done')}
      />
    ) : activeReward ? (
      <MissionPicker
        dateKey={dateKey}
        commit={commit}
        onSelected={() => navigate('/mission')}
        onCancel={() => navigate('/')}
      />
    ) : <RewardScreen data={data} ledger={ledger} dateKey={dateKey} commit={commit} onHome={() => navigate('/')} onSelected={() => navigate('/choose')} />
  } else if (route === '/done' && reachedGoal) {
    screen = <DoneScreen data={data} ledger={ledger} dateKey={dateKey} commit={commit} onCollected={() => navigate('/rewards')} />
  } else {
    screen = (
      <HomeScreen
        data={data}
        ledger={ledger}
        online={online}
        onStart={() => navigate(!activeReward ? '/rewards' : reachedGoal ? '/done' : ledger.missionSkin ? '/mission' : '/choose')}
        onRewards={() => navigate('/rewards')}
        onParent={() => navigate('/parent')}
        onInstall={() => setInstallOpen(true)}
        onSelectTables={(tables) => commit((current) => selectPracticeTables(current, dateKey, tables))}
        onLearn={(table) => navigate(`/learn/${table}`)}
      />
    )
  }

  return (
    <div className={appClassName}>
      {screen}
      <ServiceWorkerStatus />
      {installOpen && (
        <InstallHelp
          {...installPrompt}
          onClose={() => setInstallOpen(false)}
        />
      )}
    </div>
  )
}
