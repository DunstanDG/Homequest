import { createContext, useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** The question screen has a fixed footer; answer components render their keypad/check button into it via this portal. */
/** `undefined` = no question screen at all (render in place); `null` = a question screen whose footer isn't mounted yet. */
export const FootContext = createContext<HTMLElement | null | undefined>(undefined)

export function Foot({ children }: { children: ReactNode }) {
  const el = useContext(FootContext)
  // Outside a question screen (e.g. the developer gallery) there's no fixed footer: render in place instead.
  if (el === undefined) return <>{children}</>
  return el ? createPortal(children, el) : null
}
