import type { CSSProperties, ReactNode } from 'react'
import type { Member, MemberId } from '@/family/types'
import { Icon } from './icons'

/** A person (or pet) as a coloured circle with their emoji or initial. */
export function Avatar({ m, size = 32, ring }: { m: Pick<Member, 'name' | 'colour' | 'emoji'> | undefined; size?: number; ring?: boolean }) {
  const style: CSSProperties = { width: size, height: size, fontSize: Math.round(size * (m?.emoji ? 0.55 : 0.46)), background: m?.colour ?? 'var(--surface3)' }
  return (
    <span className={`avatar${ring ? ' ring' : ''}`} style={style} aria-hidden="true" title={m?.name}>
      {m?.emoji ?? m?.name?.charAt(0).toUpperCase() ?? '?'}
    </span>
  )
}

/** Overlapping avatars for "who's involved". */
export function AvatarStack({ ids, members, max = 4, size = 22 }: { ids: MemberId[]; members: Record<MemberId, Member>; max?: number; size?: number }) {
  const shown = ids.slice(0, max)
  const extra = ids.length - shown.length
  return (
    <span className="avatar-stack" aria-label={ids.map((i) => members[i]?.name).filter(Boolean).join(', ')}>
      {shown.map((id) => (
        <Avatar key={id} m={members[id]} size={size} />
      ))}
      {extra > 0 && <span className="avatar more" style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}>+{extra}</span>}
    </span>
  )
}

/** Pick one or several people. `everyone` adds an "Everyone" chip that selects the whole list. */
export function MemberChips({
  members,
  value,
  onChange,
  multi = false,
  everyone,
  size = 'normal',
}: {
  members: Member[]
  value: MemberId[]
  onChange: (next: MemberId[]) => void
  multi?: boolean
  everyone?: { label?: string; active: boolean; onToggle: () => void }
  size?: 'normal' | 'small'
}) {
  return (
    <div className="chips member-chips" role="group">
      {everyone && (
        <button type="button" className={`chip${size === 'small' ? ' small' : ''}${everyone.active ? ' selected' : ''}`} aria-pressed={everyone.active} onClick={everyone.onToggle}>
          {everyone.label ?? 'Everyone'}
        </button>
      )}
      {members.map((m) => {
        const on = !everyone?.active && value.includes(m.id)
        return (
          <button
            key={m.id}
            type="button"
            className={`chip with-avatar${size === 'small' ? ' small' : ''}${on ? ' selected' : ''}`}
            aria-pressed={on}
            onClick={() => {
              if (!multi) return onChange([m.id])
              const base = everyone?.active ? [] : value
              onChange(base.includes(m.id) ? base.filter((x) => x !== m.id) : [...base, m.id])
            }}
          >
            <Avatar m={m} size={size === 'small' ? 18 : 24} />
            {m.name}
          </button>
        )
      })}
    </div>
  )
}

/** Segmented control (like a tab strip but for choices inside a form). */
export function Seg<T extends string>({ options, value, onChange, label }: { options: { id: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; label?: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={value === o.id} className={`seg-btn${value === o.id ? ' on' : ''}`} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** "🪙 20" style chip. */
export function Coins({ n, tone = 'xp', plus }: { n: number; tone?: 'xp' | 'good' | 'neutral'; plus?: boolean }) {
  return (
    <span className={`coins tone-${tone}`}>
      <Icon name="coin" size={14} />
      {plus && n > 0 ? '+' : ''}
      {n}
    </span>
  )
}

export function SectionHead({ title, action, sub, id }: { title: ReactNode; action?: ReactNode; sub?: ReactNode; id?: string }) {
  return (
    <div className="sec-head">
      <div>
        <h2 className="section" id={id}>
          {title}
        </h2>
        {sub && <p className="note sec-sub">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

/** Big friendly button tile used by the baby and dog trackers. */
export function Tile({ emoji, label, sub, onClick, tone, disabled }: { emoji: string; label: string; sub?: string; onClick: () => void; tone?: 'a' | 'b' | 'c' | 'd' | 'e'; disabled?: boolean }) {
  return (
    <button type="button" className={`tile-btn${tone ? ` t-${tone}` : ''}`} onClick={onClick} disabled={disabled}>
      <span className="tile-emoji" aria-hidden="true">
        {emoji}
      </span>
      <strong>{label}</strong>
      {sub && <small>{sub}</small>}
    </button>
  )
}

/** Circle checkbox used for tasks. */
export function CheckCircle({ done, pending, onClick, label, disabled }: { done: boolean; pending?: boolean; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" className={`check-circle${done ? ' done' : ''}${pending ? ' pending' : ''}`} onClick={onClick} aria-label={label} aria-pressed={done} disabled={disabled}>
      {done && <Icon name="check" size={18} />}
    </button>
  )
}

/** Small screen header with an optional back button. */
export function ScreenHead({ title, eyebrow, onBack, right }: { title: ReactNode; eyebrow?: ReactNode; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="screen-head">
      {onBack && (
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Back">
          <Icon name="back" />
        </button>
      )}
      <div className="sh-title">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
      </div>
      {right && <div className="head-actions">{right}</div>}
    </header>
  )
}
