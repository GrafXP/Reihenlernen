import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const common = {
  viewBox: '0 0 24 24',
  width: 24,
  height: 24,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function ArrowLeftIcon(props: IconProps) {
  return <svg {...common} {...props}><path d="m15 18-6-6 6-6" /></svg>
}

export function ParentIcon(props: IconProps) {
  return <svg {...common} {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
}

export function SpeakerIcon(props: IconProps) {
  return <svg {...common} {...props}><path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18 6a8.5 8.5 0 0 1 0 12" /></svg>
}

export function LockIcon(props: IconProps) {
  return <svg {...common} {...props}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
}

export function GiftIcon(props: IconProps) {
  return <svg {...common} {...props}><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M12 8v13M3 12h18" /><path d="M12 8H7.5A2.5 2.5 0 1 1 10 5.5L12 8Zm0 0h4.5A2.5 2.5 0 1 0 14 5.5L12 8Z" /></svg>
}

export function InstallIcon(props: IconProps) {
  return <svg {...common} {...props}><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M5 19h14" /></svg>
}

export function CheckIcon(props: IconProps) {
  return <svg {...common} {...props}><path d="m5 12 4 4L19 6" /></svg>
}

export function UndoIcon(props: IconProps) {
  return <svg {...common} {...props}><path d="M9 7 4 12l5 5" /><path d="M20 17a7 7 0 0 0-7-7H4" /></svg>
}

export function TrashIcon(props: IconProps) {
  return <svg {...common} {...props}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 15H6L5 6" /><path d="M10 11v5M14 11v5" /></svg>
}

export function BackspaceIcon(props: IconProps) {
  return <svg {...common} {...props}><path d="m20 5-9 0-7 7 7 7h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" /><path d="m14 9 5 6m0-6-5 6" /></svg>
}

export function SettingsIcon(props: IconProps) {
  return <svg {...common} {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1v.1h-4v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4h-.1v-4H3A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1v-.1h4V3A1.7 1.7 0 0 0 15.5 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.4.3.7.6.8 1 .1.3.2.7.2 1v.1h.1v4h-.1a1.7 1.7 0 0 0-1 .9Z" /></svg>
}
