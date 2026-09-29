interface ToggleProps {
  checked: boolean
  label: string
  description: string
  disabled?: boolean
  onChange: (checked: boolean) => void
}

export function Toggle({ checked, label, description, disabled = false, onChange }: ToggleProps) {
  return (
    <label className={disabled ? 'toggle-row toggle-row--disabled' : 'toggle-row'}>
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="toggle" aria-hidden="true"><span /></span>
    </label>
  )
}
