import type { ChallengeVisual as ChallengeVisualModel } from '../domain/types'

interface ChallengeVisualProps {
  visual: ChallengeVisualModel
  reveal?: boolean
}

function HundredField({ value, mode }: { value: number; mode: 'quantity' | 'complement' }) {
  return (
    <div className={`hundred-field hundred-field--${mode}`} role="img" aria-label={`${value} von 100 Punkten sind gefüllt`}>
      {Array.from({ length: 100 }, (_, index) => (
        <span
          key={index}
          className={index < value ? 'hundred-field__dot hundred-field__dot--filled' : 'hundred-field__dot'}
        />
      ))}
    </div>
  )
}

function PlaceValue({ value }: { value: number }) {
  const tens = Math.floor(value / 10)
  const ones = value % 10
  return (
    <div className="place-value" role="img" aria-label={`${tens} Zehner und ${ones} Einer`}>
      <div className="place-value__section">
        <div className="place-value__blocks">
          {Array.from({ length: tens }, (_, index) => (
            <span className="ten-rod" key={index}>
              {Array.from({ length: 10 }, (__, slot) => <i key={slot} />)}
            </span>
          ))}
        </div>
        <strong>{tens} Z</strong>
      </div>
      <div className="place-value__plus" aria-hidden="true">+</div>
      <div className="place-value__section">
        <div className="place-value__ones">
          {Array.from({ length: ones }, (_, index) => <span key={index} />)}
        </div>
        <strong>{ones} E</strong>
      </div>
    </div>
  )
}

function TenStrip({ filled, total }: { filled: number; total: 10 | 20 }) {
  return (
    <div className={`ten-strip ${total === 20 ? 'ten-strip--twenty' : ''}`} role="img" aria-label={`${filled} von ${total} Feldern sind gefüllt`}>
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={index < filled ? 'ten-strip__filled' : ''} />
      ))}
    </div>
  )
}

function NumberLine({
  minimum,
  maximum,
  start,
  end,
  jumps = [],
}: Extract<ChallengeVisualModel, { type: 'number-line' }>) {
  const left = 36
  const right = 564
  const width = right - left
  const position = (value: number) => left + ((value - minimum) / (maximum - minimum || 1)) * width
  const direction = end >= start ? 1 : -1
  let cursor = start
  const arcs = jumps.map((jump) => {
    const from = cursor
    cursor += jump * direction
    return { from, to: cursor, label: jump }
  })
  const ticks = Array.from({ length: 11 }, (_, index) => minimum + ((maximum - minimum) / 10) * index)

  return (
    <svg className="number-line" viewBox="0 0 600 138" role="img" aria-label={`Zahlenweg von ${minimum} bis ${maximum}, von ${start} zu ${end}`}>
      <line x1={left} y1="92" x2={right} y2="92" className="number-line__axis" />
      {ticks.map((tick, index) => (
        <g key={index}>
          <line x1={position(tick)} y1="84" x2={position(tick)} y2="101" className="number-line__tick" />
          {(index === 0 || index === 5 || index === 10) && (
            <text x={position(tick)} y="124" textAnchor="middle">{Math.round(tick)}</text>
          )}
        </g>
      ))}
      {arcs.map((arc, index) => {
        const x1 = position(arc.from)
        const x2 = position(arc.to)
        const middle = (x1 + x2) / 2
        const height = Math.max(24, Math.min(62, Math.abs(x2 - x1) * 0.35))
        return (
          <g key={`${arc.from}-${arc.to}-${index}`}>
            <path d={`M ${x1} 80 Q ${middle} ${80 - height} ${x2} 80`} className="number-line__jump" />
            <text x={middle} y={70 - height} textAnchor="middle" className="number-line__jump-label">{direction > 0 ? '+' : '−'}{arc.label}</text>
          </g>
        )
      })}
      <circle cx={position(start)} cy="92" r="8" className="number-line__start" />
      <text x={position(start)} y="76" textAnchor="middle" className="number-line__value">{start}</text>
      <circle cx={position(end)} cy="92" r="9" className="number-line__end" />
      <text x={position(end)} y="76" textAnchor="middle" className="number-line__value">{end}</text>
    </svg>
  )
}

function Sequence({ values }: { values: Array<number | null> }) {
  return (
    <div className="sequence-visual" aria-label={values.map((value) => value ?? 'fehlend').join(', ')}>
      {values.map((value, index) => (
        <span key={index} className={value === null ? 'sequence-visual__missing' : ''}>
          {value ?? '?'}
        </span>
      ))}
    </div>
  )
}

function Groups({ groups, crossedGroup }: { groups: number[]; crossedGroup?: number }) {
  return (
    <div className="groups-visual" role="img" aria-label={`${groups.length} Gruppen mit ${groups.join(' und ')} Punkten`}>
      {groups.map((count, groupIndex) => (
        <div className={`group-box ${crossedGroup === groupIndex ? 'group-box--crossed' : ''}`} key={groupIndex}>
          <div>
            {Array.from({ length: count }, (_, index) => <span key={index} />)}
          </div>
          <strong>{count}</strong>
        </div>
      ))}
    </div>
  )
}

function PartWhole({ whole, known, missing, reveal }: { whole: number; known: number; missing: number; reveal: boolean }) {
  return (
    <div className="part-whole" role="img" aria-label={`${whole} wird in ${known} und ${reveal ? missing : 'einen fehlenden Teil'} zerlegt`}>
      <div className="part-whole__whole"><small>Ganzes</small><strong>{whole}</strong></div>
      <span className="part-whole__branch part-whole__branch--left" />
      <span className="part-whole__branch part-whole__branch--right" />
      <div className="part-whole__part"><small>Teil</small><strong>{known}</strong></div>
      <div className="part-whole__part part-whole__part--missing"><small>Teil</small><strong>{reveal ? missing : '?'}</strong></div>
    </div>
  )
}

function Money({ coins }: { coins: number[] }) {
  return (
    <div className="money-visual" role="img" aria-label={`Münzen: ${coins.join(', ')} Rappen`} data-total={coins.reduce((sum, coin) => sum + coin, 0)}>
      {coins.map((coin, index) => (
        <span className={`money-coin money-coin--${coin}`} key={`${coin}-${index}`}>
          {coin >= 100 ? <><small>CHF</small>{coin / 100}</> : <>{coin}<small>Rp.</small></>}
        </span>
      ))}
    </div>
  )
}

function ClockFace({ hour, minute, label }: { hour: number; minute: number; label?: string }) {
  const hourAngle = ((hour % 12) + minute / 60) * 30
  const minuteAngle = minute * 6
  return (
    <div className="clock-face-wrap" data-hour={hour} data-minute={minute}>
      {label && <strong>{label}</strong>}
      <svg className="clock-face" viewBox="0 0 240 240" role="img" aria-label={`${hour} Uhr ${String(minute).padStart(2, '0')}`}>
        <circle cx="120" cy="120" r="106" className="clock-face__rim" />
        {Array.from({ length: 12 }, (_, index) => {
          const angle = (index + 1) * 30 * Math.PI / 180
          return <text key={index} x={120 + Math.sin(angle) * 83} y={125 - Math.cos(angle) * 83} textAnchor="middle">{index + 1}</text>
        })}
        <line x1="120" y1="120" x2="120" y2="63" className="clock-face__hour" transform={`rotate(${hourAngle} 120 120)`} />
        <line x1="120" y1="120" x2="120" y2="35" className="clock-face__minute" transform={`rotate(${minuteAngle} 120 120)`} />
        <circle cx="120" cy="120" r="7" className="clock-face__pin" />
      </svg>
    </div>
  )
}

function Clock({ hour, minute, endHour, endMinute }: Extract<ChallengeVisualModel, { type: 'clock' }>) {
  const hasEnd = endHour !== undefined && endMinute !== undefined
  return (
    <div className={`clock-visual ${hasEnd ? 'clock-visual--pair' : ''}`}>
      <ClockFace hour={hour} minute={minute} label={hasEnd ? 'Start' : undefined} />
      {hasEnd && <span className="clock-visual__arrow" aria-hidden="true">→</span>}
      {hasEnd && <ClockFace hour={endHour} minute={endMinute} label="Ende" />}
    </div>
  )
}

function Ruler({ start, end, maximum }: Extract<ChallengeVisualModel, { type: 'ruler' }>) {
  const x = (value: number) => 34 + (value / maximum) * 532
  return (
    <svg className="ruler-visual" viewBox="0 0 600 145" role="img" aria-label={`Strecke von ${start} bis ${end} Zentimeter`} data-start={start} data-end={end}>
      <rect x="18" y="58" width="564" height="68" rx="12" className="ruler-visual__body" />
      {Array.from({ length: maximum + 1 }, (_, value) => (
        <g key={value}>
          <line x1={x(value)} y1="60" x2={x(value)} y2={value % 5 === 0 ? 91 : 80} className="ruler-visual__tick" />
          {(maximum <= 12 || value % 2 === 0) && <text x={x(value)} y="113" textAnchor="middle">{value}</text>}
        </g>
      ))}
      <line x1={x(start)} y1="35" x2={x(end)} y2="35" className="ruler-visual__measure" />
      <circle cx={x(start)} cy="35" r="7" className="ruler-visual__point" />
      <circle cx={x(end)} cy="35" r="7" className="ruler-visual__point" />
    </svg>
  )
}

function Shape({ shape }: { shape: Extract<ChallengeVisualModel, { type: 'shape' }>['shape'] }) {
  const shapes = {
    circle: <circle cx="120" cy="120" r="82" />,
    triangle: <polygon points="120,28 214,202 26,202" />,
    square: <rect x="42" y="42" width="156" height="156" rx="3" />,
    rectangle: <rect x="25" y="65" width="190" height="110" rx="3" />,
    pentagon: <polygon points="120,24 218,96 180,210 60,210 22,96" />,
    hexagon: <polygon points="70,28 170,28 222,120 170,212 70,212 18,120" />,
  }
  const names = { circle: 'Kreis', triangle: 'Dreieck', square: 'Quadrat', rectangle: 'Rechteck', pentagon: 'Fünfeck', hexagon: 'Sechseck' }
  return (
    <svg className="shape-visual" viewBox="0 0 240 240" role="img" aria-label={names[shape]} data-shape={shape}>
      {shapes[shape]}
    </svg>
  )
}

function SymmetryGrid({ leftCells, missingIndexes, showSolution }: Extract<ChallengeVisualModel, { type: 'symmetry-grid' }>) {
  const leftKeys = new Set(leftCells.map((cell) => `${cell.row}:${cell.column}`))
  const rightClasses = new Map(leftCells.map((cell, index) => [
    `${cell.row}:${6 - cell.column}`,
    missingIndexes.includes(index) ? 'symmetry-grid__solution' : 'symmetry-grid__filled',
  ]))
  return (
    <div className="symmetry-grid" role="img" aria-label="Muster mit senkrechter Spiegelachse" data-missing={missingIndexes.length}>
      {Array.from({ length: 35 }, (_, index) => {
        const row = Math.floor(index / 7)
        const column = index % 7
        const key = `${row}:${column}`
        const rightClass = rightClasses.get(key)
        const className = column === 3
          ? 'symmetry-grid__axis'
          : leftKeys.has(key)
            ? 'symmetry-grid__filled'
            : rightClass && (rightClass !== 'symmetry-grid__solution' || showSolution)
              ? rightClass
              : ''
        return <span key={key} className={className} />
      })}
    </div>
  )
}

function ArrayVisual({ rows, columns, showTotal }: Extract<ChallengeVisualModel, { type: 'array' }>) {
  return (
    <div className="array-visual-wrap" role="img" aria-label={`${rows} Reihen mit je ${columns} Punkten`} data-answer={rows * columns}>
      <div className="array-visual" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: rows * columns }, (_, index) => <span key={index} />)}
      </div>
      {showTotal && <strong>{rows} × {columns} = {rows * columns}</strong>}
    </div>
  )
}

function Sharing({ total, groups, showGroups }: Extract<ChallengeVisualModel, { type: 'sharing' }>) {
  const each = total / groups
  return (
    <div className="sharing-visual" role="img" aria-label={`${total} Plättchen auf ${groups} Gruppen verteilen`} data-answer={each}>
      {(showGroups ? Array.from({ length: groups }, () => each) : [total]).map((count, groupIndex) => (
        <div className={showGroups ? 'sharing-group' : 'sharing-group sharing-group--pool'} key={groupIndex}>
          {Array.from({ length: count }, (_, index) => <span key={index} />)}
        </div>
      ))}
    </div>
  )
}

export function ChallengeVisual({ visual, reveal = false }: ChallengeVisualProps) {
  switch (visual.type) {
    case 'none': return null
    case 'hundred-field': return <HundredField value={visual.value} mode={visual.mode} />
    case 'ten-strip': return <TenStrip filled={visual.filled} total={visual.total} />
    case 'place-value': return <PlaceValue value={visual.value} />
    case 'number-line': return <NumberLine {...visual} />
    case 'sequence': return <Sequence values={visual.values} />
    case 'groups': return <Groups groups={visual.groups} crossedGroup={visual.crossedGroup} />
    case 'part-whole': return <PartWhole {...visual} reveal={reveal} />
    case 'money': return <Money coins={visual.coins} />
    case 'clock': return <Clock {...visual} />
    case 'ruler': return <Ruler {...visual} />
    case 'shape': return <Shape shape={visual.shape} />
    case 'symmetry-grid': return <SymmetryGrid {...visual} />
    case 'array': return <ArrayVisual {...visual} />
    case 'sharing': return <Sharing {...visual} />
  }
}
