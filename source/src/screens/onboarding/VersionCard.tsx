import { useState } from 'react'
import { checkForUpdate, forceUpdate } from '@/app/update'
import { useUpdate } from '@/app/onboarding/store'
import { APP_VERSION, BUILD_TIME, formatBuild, type UpdateStatus } from '@/app/version'

/** The release this phone is running, with "Check for updates" and, when there is one, "Update now". */
export function VersionLine() {
  const built = formatBuild(BUILD_TIME)
  return (
    <p className="ver-line">
      <strong>HomeQuest {APP_VERSION}</strong>
      {built && <span className="muted"> · built {built}</span>}
    </p>
  )
}

export function VersionCard() {
  const { ready } = useUpdate()
  const [state, setState] = useState<'idle' | 'checking' | 'applying' | UpdateStatus>('idle')
  const status = ready && state !== 'applying' ? 'ready' : state
  const check = async () => {
    setState('checking')
    setState(await checkForUpdate())
  }
  const apply = () => {
    setState('applying')
    void forceUpdate()
  }
  return (
    <div className="ver-card">
      <VersionLine />
      {status === 'idle' && <p className="muted">Phones only look for a new version when the app opens. This looks right now.</p>}
      {status === 'checking' && <p className="muted" role="status">Checking…</p>}
      {status === 'current' && <p className="ver-ok" role="status">✓ You’re on the latest version.</p>}
      {status === 'ready' && <p className="ver-new" role="status">A new version is ready. The app restarts to switch to it.</p>}
      {status === 'newer' && <p className="ver-new" role="status">There’s a newer version, but this phone is still showing an older copy. Update now loads the new one.</p>}
      {status === 'unknown' && <p className="muted" role="status">Couldn’t reach the server to check. Try again with a connection.</p>}
      {status === 'applying' && <p className="muted" role="status">Updating…</p>}
      <div className="btn-row">
        {(status === 'ready' || status === 'newer') && (
          <button type="button" className="btn primary small" onClick={apply}>
            ⬇️ Update now
          </button>
        )}
        {status !== 'applying' && (
          <button type="button" className={`btn small${status === 'ready' || status === 'newer' ? ' ghost' : ''}`} disabled={status === 'checking'} onClick={check}>
            🔄 Check for updates
          </button>
        )}
      </div>
      <p className="muted ver-fine">Updating keeps everything: your family’s data is stored separately from the app.</p>
    </div>
  )
}
