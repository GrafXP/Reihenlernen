function audioContext(): AudioContext | null {
  const AudioContextClass = window.AudioContext
    ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  return AudioContextClass ? new AudioContextClass() : null
}

function playNotes(notes: Array<{ frequency: number; start: number; duration: number }>): void {
  const context = audioContext()
  if (!context) return
  const startAt = context.currentTime + 0.01

  notes.forEach((note) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = note.frequency
    gain.gain.setValueAtTime(0.0001, startAt + note.start)
    gain.gain.exponentialRampToValueAtTime(0.045, startAt + note.start + 0.025)
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + note.start + note.duration)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(startAt + note.start)
    oscillator.stop(startAt + note.start + note.duration)
  })

  window.setTimeout(() => void context.close(), 900)
}

export function playSuccessSound(): void {
  playNotes([
    { frequency: 523.25, start: 0, duration: 0.22 },
    { frequency: 659.25, start: 0.15, duration: 0.3 },
  ])
}

export function playFinishSound(): void {
  playNotes([
    { frequency: 523.25, start: 0, duration: 0.25 },
    { frequency: 659.25, start: 0.17, duration: 0.25 },
    { frequency: 783.99, start: 0.34, duration: 0.4 },
  ])
}
