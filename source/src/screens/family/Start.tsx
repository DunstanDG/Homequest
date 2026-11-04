import { useEffect, useMemo, useState } from 'react'
import * as A from '@/family/actions'
import { useApp, useFamily, useSyncStatus } from '@/app/context'
import { APP_NAME, ENV_SUPABASE_ANON_KEY, ENV_SUPABASE_URL } from '@/app/config'
import { joinFamily } from '@/app/pairing'
import { makeEvent } from '@/engine/make'
import type { MemberRole } from '@/family/types'
import { Avatar } from '@/ui/fam'
import { Icon } from '@/ui/icons'
import { MemberForm } from './People'

type Step = 'home' | 'new' | 'join' | 'who' | 'me'

/** Players from the original StudyQuest (or a family code from it) who are not yet family members. */
export function useLegacyPlayers() {
  const { repo } = useApp()
  const f = useFamily()
  return useMemo(() => {
    const seen = new Map<string, { id: string; name: string }>()
    for (const e of repo.allEvents()) if (e.type === 'profile' && !f.members[e.learnerId]) seen.set(e.learnerId, { id: e.learnerId, name: e.name })
    return [...seen.values()]
  }, [repo, f, repo.snapshot()])
}

/** First launch on a phone: start a family, join one with a code, or say who you are. */
export function Start() {
  const f = useFamily()
  const legacy = useLegacyPlayers()
  const hasPeople = Object.values(f.members).some((m) => m.role === 'parent' || m.role === 'child')
  const [step, setStep] = useState<Step>(hasPeople || legacy.length ? 'who' : 'home')
  useEffect(() => {
    if ((hasPeople || legacy.length) && step === 'home') setStep('who')
  }, [hasPeople, legacy.length, step])
  if (step === 'new') return <NewFamily onBack={() => setStep('home')} />
  if (step === 'join') return <Join onBack={() => setStep('home')} />
  if (step === 'me') return <NewMe onBack={() => setStep('who')} />
  if (step === 'who') return <WhoAreYou onNew={() => setStep('me')} />
  return (
    <div className="screen welcome">
      <div className="intro-icon">
        <Icon name="home" size={56} />
      </div>
      <h1>{APP_NAME}</h1>
      <p className="lead">One place for the family: who is where, what needs doing, what we are doing together, homework, the dog and the baby.</p>
      <button type="button" className="btn primary big block" onClick={() => setStep('new')}>
        Start our family
      </button>
      <button type="button" className="btn big block" onClick={() => setStep('join')}>
        Join my family with a code
      </button>
      <p className="note center">Your family's data stays on your phones and your own Supabase project. Nothing is shared with anyone else.</p>
    </div>
  )
}

function NewFamily({ onBack }: { onBack: () => void }) {
  const { repo, act, updateSettings } = useApp()
  const [family, setFamily] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<MemberRole>('parent')
  const [busy, setBusy] = useState(false)
  const create = async () => {
    setBusy(true)
    const id = A.newMemberId()
    const evs = [
      makeEvent(id, { type: 'family', name: family.trim() || `The ${name.trim()} family` }),
      ...A.saveMember(id, { id, name, role, colour: A.MEMBER_COLOURS[0]!, active: true }),
      ...(role === 'child' ? A.childProfile(id, name, 8) : []),
    ]
    act(evs)
    if (role === 'parent') updateSettings({ trustDevice: true })
    await repo.setMe(id)
  }
  return (
    <div className="screen welcome">
      <button type="button" className="icon-btn back" onClick={onBack} aria-label="Back">
        <Icon name="back" />
      </button>
      <h1>Set up your family</h1>
      <p className="muted">Start with you. You can add everyone else, the baby and the dog afterwards.</p>
      <label className="field">
        <span>Your first name</span>
        <input className="tbox" value={name} onChange={(e) => setName(e.target.value)} placeholder="First name" autoCapitalize="words" maxLength={24} />
      </label>
      <div className="field">
        <span>You are a</span>
        <div className="chips">
          {(['parent', 'child'] as const).map((r) => (
            <button key={r} type="button" className={`chip${role === r ? ' selected' : ''}`} onClick={() => setRole(r)}>
              {r === 'parent' ? 'Parent' : 'Child'}
            </button>
          ))}
        </div>
      </div>
      <label className="field">
        <span>Family name (optional)</span>
        <input className="tbox" value={family} onChange={(e) => setFamily(e.target.value)} placeholder="e.g. The Smiths" maxLength={30} />
      </label>
      <button type="button" className="btn primary big block" disabled={!name.trim() || busy} onClick={() => void create()}>
        Let's go
      </button>
    </div>
  )
}

function Join({ onBack }: { onBack: () => void }) {
  const { repo } = useApp()
  const [code, setCode] = useState('')
  const [url, setUrl] = useState(ENV_SUPABASE_URL ?? '')
  const [anon, setAnon] = useState(ENV_SUPABASE_ANON_KEY ?? '')
  const [err, setErr] = useState<string | null>(null)
  const envReady = !!(ENV_SUPABASE_URL && ENV_SUPABASE_ANON_KEY)
  const go = async () => {
    const res = await joinFamily(repo, code, { url, anonKey: anon })
    if (!res.ok) return setErr(res.error)
    location.reload()
  }
  return (
    <div className="screen welcome">
      <button type="button" className="icon-btn back" onClick={onBack} aria-label="Back">
        <Icon name="back" />
      </button>
      <div className="intro-icon">
        <Icon name="users" size={48} />
      </div>
      <h1>Join your family</h1>
      <p className="muted">On a phone that is already set up, open Parent area, then the Data tab, and show the family code. Enter it here. A StudyQuest code (sq1...) works too and brings the learning history with it.</p>
      <label className="field">
        <span>Family code</span>
        <input className="tbox" value={code} onChange={(e) => (setCode(e.target.value), setErr(null))} placeholder="hq1...." autoCapitalize="none" autoCorrect="off" spellCheck={false} />
      </label>
      {!envReady && (
        <>
          <label className="field">
            <span>Project URL</span>
            <input className="tbox" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://abcd.supabase.co" autoCapitalize="none" autoCorrect="off" />
          </label>
          <label className="field">
            <span>Public (anon) key</span>
            <input className="tbox" value={anon} onChange={(e) => setAnon(e.target.value)} autoCapitalize="none" autoCorrect="off" />
          </label>
        </>
      )}
      {err && <p className="note bad">{err}</p>}
      <button type="button" className="btn primary big block" disabled={!code.trim() || (!envReady && (!url || !anon))} onClick={() => void go()}>
        Connect
      </button>
    </div>
  )
}

/** Family found (or a StudyQuest history): pick who is holding this phone. */
function WhoAreYou({ onNew }: { onNew: () => void }) {
  const { repo, act } = useApp()
  const f = useFamily()
  const legacy = useLegacyPlayers()
  const people = Object.values(f.members).filter((m) => m.active && (m.role === 'parent' || m.role === 'child'))
  const pick = async (id: string) => {
    await repo.setMe(id)
  }
  const claim = async (l: { id: string; name: string }) => {
    act(A.saveMember(l.id, { id: l.id, name: l.name, role: 'child', colour: A.MEMBER_COLOURS[people.length % A.MEMBER_COLOURS.length]!, active: true }))
    await repo.setMe(l.id)
  }
  return (
    <div className="screen welcome">
      <h1>Who is this phone?</h1>
      <p className="muted">{f.name ? `${f.name}. ` : ''}Pick yourself. Your tasks, coins and StudyQuest progress follow you.</p>
      <ul className="who-list">
        {people.map((m) => (
          <li key={m.id}>
            <button type="button" className="who-btn" onClick={() => void pick(m.id)}>
              <Avatar m={m} size={44} />
              <span>
                <strong>{m.name}</strong>
                <small className="muted">{m.role === 'parent' ? 'Parent' : 'Child'}</small>
              </span>
              <Icon name="chevron" size={18} />
            </button>
          </li>
        ))}
        {legacy.map((l) => (
          <li key={l.id}>
            <button type="button" className="who-btn" onClick={() => void claim(l)}>
              <Avatar m={{ name: l.name, colour: 'var(--accent)' }} size={44} />
              <span>
                <strong>{l.name}</strong>
                <small className="muted">StudyQuest player. Keeps all their progress.</small>
              </span>
              <Icon name="chevron" size={18} />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn ghost block" onClick={onNew}>
        I'm not on the list
      </button>
    </div>
  )
}

function NewMe({ onBack }: { onBack: () => void }) {
  const { repo } = useApp()
  const [role, setRole] = useState<MemberRole>('child')
  return (
    <div className="screen welcome">
      <button type="button" className="icon-btn back" onClick={onBack} aria-label="Back">
        <Icon name="back" />
      </button>
      <h1>Add yourself</h1>
      <div className="field">
        <span>You are a</span>
        <div className="chips">
          {(['parent', 'child'] as const).map((r) => (
            <button key={r} type="button" className={`chip${role === r ? ' selected' : ''}`} onClick={() => setRole(r)}>
              {r === 'parent' ? 'Parent' : 'Child'}
            </button>
          ))}
        </div>
      </div>
      <MemberForm key={role} defaultRole={role} onDone={(id) => void repo.setMe(id)} />
    </div>
  )
}

/** Paired device with nothing on it yet: wait for the first sync to bring the family down. */
export function Fetching({ onSkip }: { onSkip: () => void }) {
  const sync = useSyncStatus()
  useEffect(() => {
    void sync.syncNow()
  }, [sync])
  return (
    <div className="screen welcome">
      <div className="spinner" aria-label="Loading" />
      <h1>Fetching your family...</h1>
      <p className="muted">{sync.status === 'error' ? `Could not reach the sync service: ${sync.last?.error ?? 'unknown error'}` : sync.last?.ok ? 'Connected, but nothing has been shared with this code yet.' : 'Connecting to your family space.'}</p>
      <button type="button" className="btn ghost block" onClick={() => void sync.syncNow()}>
        Try again
      </button>
      <button type="button" className="btn ghost block" onClick={onSkip}>
        Set up a new family instead
      </button>
    </div>
  )
}
