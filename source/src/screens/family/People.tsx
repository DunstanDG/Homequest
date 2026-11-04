import { useState } from 'react'
import * as A from '@/family/actions'
import { useApp, useFamily, useMe } from '@/app/context'
import { dayOneOf, isExpecting } from '@/family/arrival/arrival'
import { addDays, ymdOf } from '@/family/dates'
import type { CareDuty, Member, MemberRole } from '@/family/types'
import { Avatar, Seg } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/primitives'

const ROLE_LABEL: Record<MemberRole, string> = { parent: 'Parent', child: 'Child', baby: 'Baby', pet: 'Pet' }
const EMOJI: Record<MemberRole, string[]> = {
  parent: ['🧑', '👩', '👨', '🧔', '👵', '👴'],
  child: ['🧒', '👧', '👦', '🦸', '🧙', '🦄'],
  baby: ['👶', '🍼', '🧸'],
  pet: ['🐕', '🐶', '🐩', '🐈', '🐰', '🐹', '🐢'],
}

/** Add or edit a person, the baby or a pet. Also used when the first person sets the family up. */
export function MemberSheet({ open, onClose, member, defaultRole, onSaved }: { open: boolean; onClose: () => void; member?: Member; defaultRole?: MemberRole; onSaved?: (id: string) => void }) {
  return (
    <Sheet open={open} onClose={onClose} title={member ? `Edit ${member.name}` : 'Add to the family'}>
      <MemberForm member={member} defaultRole={defaultRole} onDone={(id) => (onSaved?.(id), onClose())} />
    </Sheet>
  )
}

export function MemberForm({ member, defaultRole, onDone }: { member?: Member; defaultRole?: MemberRole; onDone: (id: string) => void }) {
  const { act, toast, repo } = useApp()
  const f = useFamily()
  const me = useMe()
  const actor = me?.id ?? member?.id ?? 'setup'
  const used = new Set(Object.values(f.members).filter((m) => m.id !== member?.id).map((m) => m.colour))
  const firstFree = A.MEMBER_COLOURS.find((c) => !used.has(c)) ?? A.MEMBER_COLOURS[0]!
  const [role, setRole] = useState<MemberRole>(member?.role ?? defaultRole ?? 'child')
  const [name, setName] = useState(member?.name ?? '')
  const [emoji, setEmoji] = useState<string>(member?.emoji ?? '')
  const [colour, setColour] = useState(member?.colour ?? firstFree)
  const [birthday, setBirthday] = useState(member?.birthday ?? '')
  // A baby who has not arrived yet: only a due date, so nothing is scheduled until the birth date is entered.
  const [expecting, setExpecting] = useState(member ? isExpecting(member) : true)
  const [dueDate, setDueDate] = useState(member?.dueDate ?? '')
  const [dayOne, setDayOne] = useState(member?.dayOne ?? '')
  const [petKind, setPetKind] = useState(member?.petKind ?? 'Dog')
  const [walks, setWalks] = useState(String(member?.petPlan?.walksPerDay ?? 2))
  const [meals, setMeals] = useState(String(member?.petPlan?.mealsPerDay ?? 2))
  const [year, setYear] = useState<number>(repo.learnerState(member?.id ?? '').year || 8)
  const [active, setActive] = useState(member?.active ?? true)
  const [looks, setLooks] = useState<Set<CareDuty>>(new Set(member?.looksAfter ?? ['pets', 'plants']))
  const hasPets = Object.values(f.members).some((m) => m.active && m.role === 'pet')
  const hasBaby = Object.values(f.members).some((m) => m.active && m.role === 'baby')
  const dutyChoices: { id: CareDuty; label: string; show: boolean }[] = [
    { id: 'pets', label: '🐕 The pets', show: hasPets },
    { id: 'plants', label: '🪴 The plants', show: true },
    { id: 'baby', label: '👶 The baby', show: hasBaby },
  ]

  const save = () => {
    const id = member?.id ?? A.newMemberId()
    const evs = A.saveMember(actor, {
      id,
      name: name.trim() || (role === 'baby' ? 'Baby' : name),
      role,
      colour,
      emoji: emoji || undefined,
      active,
      birthday: role === 'baby' && expecting ? undefined : birthday || undefined,
      dueDate: role === 'baby' && expecting ? dueDate || undefined : undefined,
      dayOne: role === 'baby' && !expecting && dayOne && birthday && dayOne !== addDays(birthday, 1) ? dayOne : undefined,
      petKind: role === 'pet' ? petKind : undefined,
      petPlan: role === 'pet' ? { walksPerDay: Math.max(0, Number(walks) || 0), mealsPerDay: Math.max(0, Number(meals) || 0) } : undefined,
      looksAfter: role === 'child' ? (['pets', 'plants', 'baby'] as const).filter((d) => looks.has(d)) : undefined,
    })
    if (role === 'child') {
      const cur = repo.learnerState(id)
      if (cur.year !== year || cur.name !== (name.trim() || 'Explorer')) evs.push(...A.childProfile(id, name, year))
    }
    act(evs)
    toast(member ? 'Saved.' : `${name.trim() || 'Someone'} added.`)
    onDone(id)
  }

  return (
    <>
      {!member && (
        <Seg<MemberRole>
          value={role}
          onChange={(r) => (setRole(r), setEmoji(''))}
          options={(['parent', 'child', 'baby', 'pet'] as const).map((r) => ({ id: r, label: ROLE_LABEL[r] }))}
        />
      )}
      <label className="field">
        <span>Name</span>
        <input className="tbox" value={name} onChange={(e) => setName(e.target.value)} placeholder={role === 'pet' ? 'e.g. Biscuit' : role === 'baby' ? 'Leave blank until you know' : 'First name'} maxLength={24} autoCapitalize="words" />
      </label>
      <div className="field">
        <span>Picture</span>
        <div className="chips">
          <button type="button" className={`chip small${!emoji ? ' selected' : ''}`} onClick={() => setEmoji('')}>
            Initial
          </button>
          {EMOJI[role].map((e) => (
            <button key={e} type="button" className={`chip small${emoji === e ? ' selected' : ''}`} onClick={() => setEmoji(e)}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span>Colour</span>
        <div className="swatches">
          {A.MEMBER_COLOURS.map((c) => (
            <button key={c} type="button" className={`swatch${colour === c ? ' on' : ''}`} style={{ background: c }} aria-label={`Colour ${c}`} aria-pressed={colour === c} onClick={() => setColour(c)} />
          ))}
        </div>
      </div>
      {role === 'child' && (
        <div className="field">
          <span>School year</span>
          <div className="chips">
            {[7, 8].map((y) => (
              <button key={y} type="button" className={`chip${year === y ? ' selected' : ''}`} onClick={() => setYear(y)}>
                Year {y}
              </button>
            ))}
          </div>
          <p className="note">Sets which StudyQuest maths topics they start with.</p>
        </div>
      )}
      {role === 'child' && (
        <div className="field">
          <span>Helps look after</span>
          <div className="chips">
            {dutyChoices
              .filter((d) => d.show)
              .map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`chip${looks.has(d.id) ? ' selected' : ''}`}
                  aria-pressed={looks.has(d.id)}
                  onClick={() =>
                    setLooks((cur) => {
                      const next = new Set(cur)
                      if (next.has(d.id)) next.delete(d.id)
                      else next.add(d.id)
                      return next
                    })
                  }
                >
                  {d.label}
                </button>
              ))}
          </div>
          <p className="note">Their jobs show on their Today with one-tap buttons, and Care shows only these. The baby is off unless you turn it on.</p>
        </div>
      )}
      {role === 'baby' && (
        <>
          <Seg<'expecting' | 'born'> value={expecting ? 'expecting' : 'born'} onChange={(v) => setExpecting(v === 'expecting')} options={[{ id: 'expecting', label: 'Not born yet' }, { id: 'born', label: 'Born' }]} />
          {expecting ? (
            <label className="field">
              <span>Due date</span>
              <input type="date" className="tbox" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              <p className="note">Nothing is put on the calendar until the baby is born. Then the new-baby plan (activities, checks and easy meals) starts from the birth date.</p>
            </label>
          ) : (
            <>
              <label className="field">
                <span>Born</span>
                <input type="date" className="tbox" value={birthday} onChange={(e) => setBirthday(e.target.value)} max={ymdOf(Date.now())} />
              </label>
              <label className="field">
                <span>Day 1 of the plan (first day at home)</span>
                <input type="date" className="tbox" value={dayOne || (birthday ? dayOneOf({ birthday }) ?? '' : '')} onChange={(e) => setDayOne(e.target.value)} min={birthday || undefined} />
                <p className="note">Normally the day after the birth. Change it if you came home on a different day.</p>
              </label>
            </>
          )}
        </>
      )}
      {(role === 'child' || role === 'pet') && (
        <label className="field">
          <span>Birthday (optional)</span>
          <input type="date" className="tbox" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
        </label>
      )}
      {role === 'pet' && (
        <>
          <div className="chips">
            {['Dog', 'Cat', 'Rabbit', 'Other'].map((k) => (
              <button key={k} type="button" className={`chip small${petKind === k ? ' selected' : ''}`} onClick={() => setPetKind(k)}>
                {k}
              </button>
            ))}
          </div>
          <div className="grid2">
            <label className="field">
              <span>Walks a day</span>
              <input className="tbox" inputMode="numeric" value={walks} onChange={(e) => setWalks(e.target.value.replace(/\D/g, '').slice(0, 1))} />
            </label>
            <label className="field">
              <span>Meals a day</span>
              <input className="tbox" inputMode="numeric" value={meals} onChange={(e) => setMeals(e.target.value.replace(/\D/g, '').slice(0, 1))} />
            </label>
          </div>
        </>
      )}
      {member && (
        <label className="switch-row">
          <span className="sr-main">
            <strong>Shown in the app</strong>
            <small className="muted">Switch off instead of deleting. History is kept.</small>
          </span>
          <input type="checkbox" className="switch" checked={active} onChange={(e) => setActive(e.target.checked)} />
        </label>
      )}
      <button type="button" className="btn primary big block" disabled={!(name.trim() || role === 'baby') || (role === 'baby' && expecting && !dueDate)} onClick={save}>
        <Icon name="check" size={20} /> {member ? 'Save' : 'Add'}
      </button>
    </>
  )
}

export function MemberRow({ m, onClick, sub }: { m: Member; onClick?: () => void; sub?: string }) {
  return (
    <li className="member-row">
      <button type="button" className="mr-btn" onClick={onClick}>
        <Avatar m={m} size={38} />
        <span className="grow">
          <strong>{m.name}</strong>
          <small className="muted">
            {ROLE_LABEL[m.role]}
            {sub ? ` · ${sub}` : ''}
            {m.active ? '' : ' · hidden'}
          </small>
        </span>
        <Icon name="chevron" size={18} />
      </button>
    </li>
  )
}
