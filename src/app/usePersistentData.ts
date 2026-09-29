import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppData } from '../domain/types'
import { browserRepository, type StateRepository } from '../storage/repository'

export type DataUpdater = (current: AppData) => AppData
export type DataCommit = (updater: DataUpdater) => void

export interface PersistentDataState {
  data: AppData | null
  loading: boolean
  error: string | null
  commit: DataCommit
}

export function usePersistentData(
  repository: StateRepository = browserRepository,
): PersistentDataState {
  const [data, setData] = useState<AppData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const dataRef = useRef<AppData | null>(null)
  const saveQueue = useRef(Promise.resolve())

  useEffect(() => {
    let active = true
    repository
      .load()
      .then((loaded) => {
        if (!active) return
        dataRef.current = loaded
        setData(loaded)
      })
      .catch((reason: unknown) => {
        if (!active) return
        setError(reason instanceof Error ? reason.message : 'Die App-Daten konnten nicht geladen werden.')
      })

    return () => {
      active = false
    }
  }, [repository])

  const commit = useCallback(
    (updater: DataUpdater) => {
      if (!dataRef.current) return
      const next = updater(dataRef.current)
      if (next === dataRef.current) return
      dataRef.current = next
      setData(next)
      saveQueue.current = saveQueue.current
        .then(() => repository.save(next))
        .catch((reason: unknown) => {
          setError(reason instanceof Error ? reason.message : 'Änderungen konnten nicht gespeichert werden.')
        })
    },
    [repository],
  )

  return { data, loading: data === null && error === null, error, commit }
}
