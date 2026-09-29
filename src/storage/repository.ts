import { createDefaultData, normaliseData } from '../domain/data'
import type { AppData } from '../domain/types'

const DATABASE_NAME = 'reihen-mission'
const DATABASE_VERSION = 1
const STORE_NAME = 'app-state'
const STATE_KEY = 'current'

export interface StateRepository {
  load(): Promise<AppData>
  save(data: AppData): Promise<void>
  reset(): Promise<AppData>
}

export class IndexedDbStateRepository implements StateRepository {
  private databasePromise: Promise<IDBDatabase> | null = null

  private open(): Promise<IDBDatabase> {
    if (this.databasePromise) return this.databasePromise

    this.databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME)
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('Datenbank konnte nicht geöffnet werden.'))
    })

    return this.databasePromise
  }

  async load(): Promise<AppData> {
    const database = await this.open()
    const raw = await new Promise<unknown>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly')
      const request = transaction.objectStore(STORE_NAME).get(STATE_KEY)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('Daten konnten nicht geladen werden.'))
    })
    return normaliseData(raw)
  }

  async save(data: AppData): Promise<void> {
    const database = await this.open()
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).put(data, STATE_KEY)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error ?? new Error('Daten konnten nicht gespeichert werden.'))
      transaction.onabort = () => reject(transaction.error ?? new Error('Speichern wurde abgebrochen.'))
    })
  }

  async reset(): Promise<AppData> {
    const data = createDefaultData()
    await this.save(data)
    return data
  }
}

export const browserRepository = new IndexedDbStateRepository()
