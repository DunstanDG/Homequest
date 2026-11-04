import type { ReactNode, SVGProps } from 'react'

const paths: Record<string, ReactNode> = {
  home: <path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />,
  map: (
    <>
      <path d="M9 4L3 6.5v13L9 17l6 3 6-2.5v-13L15 7z" />
      <path d="M9 4v13M15 7v13" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
      <path d="M8 6H5a2 2 0 0 0 2 4M16 6h3a2 2 0 0 1-2 4M12 13v4M8 20h8M10 17h4" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  flame: <path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z" />,
  bolt: <path d="M13 3L5 13h6l-1 8 8-10h-6z" />,
  tower: (
    <>
      <path d="M7 21V9l-2-1V4h3v2h2V4h2v2h2V4h3v4l-2 1v12" />
      <path d="M10 21v-4a2 2 0 0 1 4 0v4M7 13h10" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5L13.5 13.5 8.5 15.5l2-5z" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  flag: <path d="M6 21V4M6 5h11l-2 4 2 4H6" />,
  bulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
    </>
  ),
  backspace: (
    <>
      <path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7z" />
      <path d="M12 9.5l5 5M17 9.5l-5 5" />
    </>
  ),
  chevron: <path d="M9 5l7 7-7 7" />,
  back: <path d="M15 5l-7 7 7 7" />,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" />
    </>
  ),
  share: (
    <>
      <path d="M12 15V4M8 8l4-4 4 4" />
      <path d="M5 12v7h14v-7" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
    </>
  ),
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
  book: (
    <>
      <path d="M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
      <path d="M17 7h2v13" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  cloud: <path d="M7 18a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 8.5 4.8 4.8 0 0 1 17 18z" />,
  gift: (
    <>
      <rect x="4" y="9" width="16" height="11" rx="1" />
      <path d="M12 9v11M4 13h16M12 9c-2-4-6-3-5 0M12 9c2-4 6-3 5 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.5M17.5 19a5.5 5.5 0 0 0-2-4.2" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14-4M4 5v3h3M4 13a8 8 0 0 0 14 4M20 19v-3h-3" />
    </>
  ),
  shield: <path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z" />,
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17.3 17.3 0 0 1-3.4 4.3M6.6 6.6C4 8.3 2 12 2 12s3.5 7 10 7a9.9 9.9 0 0 0 3.4-.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11M8 11l4 4 4-4" />
      <path d="M5 19h14" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V5M8 9l4-4 4 4" />
      <path d="M5 19h14" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  play: <path d="M8 5l11 7-11 7z" />,
  pause: <path d="M8 5v14M16 5v14" />,
  stop: <rect x="6" y="6" width="12" height="12" rx="1.5" />,
  volume: (
    <>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M17 9a5 5 0 0 1 0 6M19.5 6.5a9 9 0 0 1 0 11" />
    </>
  ),
  'volume-mute': (
    <>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M17 10l4 4M21 10l-4 4" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 9.5v4l2.5 1.5M9.5 3h5" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5.2" />
    </>
  ),
  school: (
    <>
      <path d="M2.5 9.5L12 5l9.5 4.5L12 14z" />
      <path d="M6.5 11.8V16c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-4.2M21.5 9.5V15" />
    </>
  ),
  pencil: <path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4" />,
  bag: (
    <>
      <path d="M6 8h12l-1 12H7z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </>
  ),
  undo: <path d="M9 8H5V4M5 8a8 8 0 1 1-1.2 6.5" />,
  checklist: <path d="M10 6h10M10 12h10M10 18h10M4 6l1.2 1.2L7.5 5M4 12l1.2 1.2L7.5 11M4 18l1.2 1.2L7.5 17" />,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8v.2" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </>
  ),
  more: <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth={3} />,
  hand: <path d="M8 12V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-.5A5.5 5.5 0 0 1 6 15v-3a1.5 1.5 0 0 1 3 0" />,
  chart: <path d="M5 20V10M12 20V4M19 20v-7" />,
  meteor: (
    <>
      <circle cx="13" cy="15" r="5" />
      <path d="M13 15l6-11M19 4l-2 5M19 4l-5 2" />
    </>
  ),
}

export type IconName = keyof typeof paths

export function Icon({ name, size = 22, ...rest }: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {paths[name]}
    </svg>
  )
}
