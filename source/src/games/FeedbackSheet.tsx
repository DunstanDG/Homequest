import { useState } from 'react'
import type { FeedbackCategory } from '@/engine/types'
import { Sheet } from '@/ui/primitives'
import { Icon, type IconName } from '@/ui/icons'

const OPTIONS: { cat: FeedbackCategory; label: string; hint: string; icon: IconName }[] = [
  { cat: 'bug', label: "Doesn't work", hint: 'Wrong answer marked right, something broken, cannot type my answer', icon: 'flag' },
  { cat: 'confusing', label: "Doesn't make sense", hint: 'I do not understand what it is asking', icon: 'bulb' },
  { cat: 'not-taught', label: 'Not covered in class', hint: "We haven't done this yet", icon: 'book' },
  { cat: 'too-hard', label: 'Too hard', hint: 'Way above what I can do right now', icon: 'bolt' },
  { cat: 'too-easy', label: 'Too easy', hint: 'I would like something harder', icon: 'star' },
  { cat: 'other', label: 'Something else', hint: '', icon: 'sparkle' },
]

/** "Something wrong with this question?" - sends a feedback event tied to the exact question. */
export function FeedbackSheet({ open, onClose, onSend }: { open: boolean; onClose: () => void; onSend: (cat: FeedbackCategory, note: string) => void }) {
  const [cat, setCat] = useState<FeedbackCategory | null>(null)
  const [note, setNote] = useState('')
  const close = () => {
    setCat(null)
    setNote('')
    onClose()
  }
  const chosen = OPTIONS.find((o) => o.cat === cat)
  return (
    <Sheet open={open} onClose={close} title="What's up with this question?">
      <p className="muted">This goes straight to the person who fixes things, and you earn a few XP for helping.</p>
      <div className="fb-grid">
        {OPTIONS.map((o) => (
          <button key={o.cat} type="button" className={`fb-opt${cat === o.cat ? ' selected' : ''}`} onClick={() => setCat(o.cat)}>
            <Icon name={o.icon} size={22} />
            <span className="fb-label">{o.label}</span>
          </button>
        ))}
      </div>
      {chosen?.hint && <p className="note">{chosen.hint}</p>}
      {cat === 'not-taught' && <p className="note">We will skip this topic until your parent says it has been taught.</p>}
      <textarea className="note-input" rows={3} placeholder="Anything to add? (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <button
        type="button"
        className="btn primary big block"
        disabled={!cat}
        onClick={() => {
          if (!cat) return
          onSend(cat, note)
          setCat(null)
          setNote('')
        }}
      >
        Send
      </button>
    </Sheet>
  )
}
