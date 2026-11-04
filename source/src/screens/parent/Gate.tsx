import { useState } from 'react'
import { useApp } from '@/app/context'
import { Icon } from '@/ui/icons'
import { Keypad, type KeyDef } from '@/ui/keypad'

const KEYS: KeyDef[] = [
  { k: '1' }, { k: '2' }, { k: '3' },
  { k: '4' }, { k: '5' }, { k: '6' },
  { k: '7' }, { k: '8' }, { k: '9' },
  { k: '', tone: 'blank' }, { k: '0' }, { k: 'back', label: <Icon name="backspace" size={22} />, tone: 'action', aria: 'Delete' },
]

/** Soft PIN lock in front of the parent area. Keeps curious kids out; it is not real security. */
export function Gate({ onOpen }: { onOpen: () => void }) {
  const { settings, updateSettings, pinFor, unlockParent } = useApp()
  const setting = !settings.pinHash
  const [pin, setPin] = useState('')
  const [first, setFirst] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const press = (k: string) => {
    setMsg(null)
    if (k === 'back') return setPin((p) => p.slice(0, -1))
    if (pin.length >= 4) return
    const next = pin + k
    setPin(next)
    if (next.length < 4) return
    // Small delay so the fourth dot shows before we react.
    window.setTimeout(() => {
      if (setting) {
        if (first === null) {
          setFirst(next)
          setPin('')
          setMsg('Enter it once more to confirm.')
        } else if (first === next) {
          updateSettings({ pinHash: pinFor(next) })
          unlockParent()
          onOpen()
        } else {
          setFirst(null)
          setPin('')
          setMsg("Those didn't match. Start again.")
        }
      } else if (pinFor(next) === settings.pinHash) {
        unlockParent()
        onOpen()
      } else {
        setPin('')
        setMsg('Wrong PIN.')
      }
    }, 120)
  }

  return (
    <div className="gate">
      <Icon name="lock" size={40} />
      <h1>Parent area</h1>
      <p className="muted">{setting ? (first === null ? 'Choose a 4-digit PIN to keep this area grown-ups only.' : 'Confirm your PIN.') : 'Enter your PIN.'}</p>
      <div className="pin-dots" aria-label={`${pin.length} of 4 digits entered`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < pin.length ? 'on' : ''} />
        ))}
      </div>
      <p className="note" role="status">{msg ?? ' '}</p>
      <Keypad keys={KEYS} cols={3} onPress={press} />
    </div>
  )
}
