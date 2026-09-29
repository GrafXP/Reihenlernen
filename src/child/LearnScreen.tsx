import { useEffect, useState } from 'react'
import { FACTORS, TABLES } from '../curriculum/skills'
import { speak, stopSpeaking } from '../accessibility/speech'
import { tableStrategy } from '../exercises/generators'
import type { AppData, TableNumber } from '../domain/types'
import { ArrowLeftIcon, SpeakerIcon } from '../components/Icons'
import { ChallengeVisual } from './ChallengeVisual'

interface LearnScreenProps {
  table: TableNumber
  data: AppData
  practiceLocked: boolean
  onHome: () => void
  onTable: (table: TableNumber) => void
  onPractice: () => void
}
export function LearnScreen({ table, data, practiceLocked, onHome, onTable, onPractice }: LearnScreenProps) {
  const [factor, setFactor] = useState(1)
  const [hidden, setHidden] = useState(false)
  const [revealed, setRevealed] = useState<number[]>([])
  useEffect(() => { setFactor(1); setRevealed([]) }, [table])
  useEffect(() => stopSpeaking, [])
  const state = data.mastery[`table-${table}`]
  const resultVisible = !hidden || revealed.includes(factor)
  return (
    <main className="learn-shell">
      <header className="learn-header">
        <button className="icon-button" onClick={onHome} aria-label="Zurück zum Start"><ArrowLeftIcon /></button>
        <div><p className="eyebrow">Entdecken & verstehen</p><h1>Die {table}er-Reihe</h1></div>
        <label className="learn-switch"><span className="sr-only">Andere Reihe lernen</span><select aria-label="Andere Reihe lernen" value={table} onChange={(event) => onTable(Number(event.target.value) as TableNumber)}>
          {TABLES.map((value) => <option key={value} value={value}>{value}er-Reihe</option>)}
        </select></label>
      </header>
      <div className="learn-layout">
        <section className="learn-facts" aria-labelledby="learn-facts-title">
          <div className="learn-facts__heading"><h2 id="learn-facts-title">Schritt für Schritt</h2>
            <button className="text-button" aria-pressed={hidden} onClick={() => { setHidden(!hidden); setRevealed([]) }}>{hidden ? 'Ergebnisse zeigen' : 'Ergebnisse verdecken'}</button>
          </div>
          <p>Tippe auf eine Aufgabe und entdecke das Punktefeld.</p>
          <div className="learn-fact-list">
            {FACTORS.map((value) => <button key={value} className={value === factor ? 'learn-fact learn-fact--active' : 'learn-fact'} aria-pressed={value === factor}
              aria-label={`${value} mal ${table} anschauen`} onClick={() => setFactor(value)}>
              <span>{value} <b>×</b> {table}</span><span>=</span><strong>{!hidden || revealed.includes(value) ? value * table : '?'}</strong>
              <span className="learn-fact__check" aria-label={state.factSuccesses[value] ? 'Bereits selbstständig gelöst' : 'Noch üben'}>{state.factSuccesses[value] ? '✓' : '·'}</span>
            </button>)}
          </div>
        </section>
        <section className="learn-explorer" aria-labelledby="explorer-title">
          <p className="eyebrow">So kannst du es sehen</p><h2 id="explorer-title">{factor} × {table} = {resultVisible ? factor * table : '?'}</h2>
          <p>{factor} {factor === 1 ? 'Reihe' : 'Reihen'} mit je {table} Punkten.</p>
          <ChallengeVisual visual={{ type: 'array', rows: factor, columns: table, showTotal: false }} />
          <aside className="learn-strategy"><strong>Dein Rechentrick</strong><p>{tableStrategy(table, factor)}</p></aside>
          {!resultVisible && <button className="button button--ghost" onClick={() => setRevealed((current) => [...current, factor])}>Ergebnis aufdecken</button>}
          {data.settings.speechEnabled && <button className="text-button" onClick={() => speak(`${factor} mal ${table}. ${tableStrategy(table, factor)}`)}><SpeakerIcon /> Rechentrick vorlesen</button>}
          <div className="learn-practice"><button className="button button--primary" disabled={practiceLocked} onClick={onPractice}>Nur die {table}er-Reihe üben <span aria-hidden="true">→</span></button>
            <p>{practiceLocked ? 'Beende zuerst deine laufende Mission. Danach kannst du diese Reihe wählen.' : 'Bereit? Probiere diese Reihe in einer Mission aus.'}</p>
          </div>
        </section>
      </div>
    </main>
  )
}
