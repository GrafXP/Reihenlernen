import { FACTORS, TABLES } from '../curriculum/skills'
import type { AppData, TableNumber } from '../domain/types'

interface TablePickerProps {
  data: AppData
  selected: TableNumber[]
  locked: boolean
  onSelect: (tables: TableNumber[]) => void
  onLearn: (table: TableNumber) => void
}
export function TablePicker({ data, selected, locked, onSelect, onLearn }: TablePickerProps) {
  return (
    <section className="table-picker" aria-labelledby="table-picker-title">
      <div className="table-picker__heading">
        <div><p className="eyebrow">Dein Einmaleins</p><h2 id="table-picker-title">Welche Reihen üben wir?</h2></div>
        <span className="selection-count">{selected.length} {selected.length === 1 ? 'Reihe' : 'Reihen'} gewählt</span>
      </div>
      <p className="table-picker__intro">Wähle deine Reihen zum Üben. Mit «Lernen» kannst du jede Reihe zuerst entdecken.</p>
      <div className="table-picker__actions">
        <button className="button button--ghost button--compact" disabled={locked} onClick={() => onSelect([...TABLES])}>Alle Reihen</button>
        <button className="button button--ghost button--compact" disabled={locked} onClick={() => onSelect([2, 5])}>Mit 2 und 5 starten</button>
      </div>
      {locked && <p className="table-picker__note">Diese Runde läuft bereits. Nach deiner Belohnung kannst du neue Reihen wählen.</p>}
      <div className="table-grid">
        {TABLES.map((table) => {
          const active = selected.includes(table)
          const state = data.mastery[`table-${table}`]
          const learned = FACTORS.filter((factor) => (state.factSuccesses[factor] ?? 0) > 0).length
          return (
            <article className={`table-tile ${active ? 'table-tile--selected' : ''}`} key={table}>
              <button className="table-tile__select" aria-label={`${table}er-Reihe auswählen`} aria-pressed={active}
                disabled={locked || (active && selected.length === 1)}
                onClick={() => onSelect(active ? selected.filter((value) => value !== table) : [...selected, table])}>
                <span className="table-tile__number">{table}<small>er</small></span>
                <span className="table-tile__check" aria-hidden="true">{active ? '✓' : '+'}</span>
              </button>
              <p>{learned === 12 ? 'Alle 12 entdeckt!' : learned > 0 ? `${learned} von 12 geschafft` : 'Dein nächster Lernweg'}</p>
              <div className="fact-track" role="img" aria-label={`${learned} von 12 Aufgaben selbstständig gelöst`}>
                {FACTORS.map((factor) => <i className={state.factSuccesses[factor] ? 'fact-track__done' : ''} key={factor} />)}
              </div>
              <button className="table-tile__learn" aria-label={`${table}er-Reihe lernen`} onClick={() => onLearn(table)}>Lernen <span aria-hidden="true">↗</span></button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
