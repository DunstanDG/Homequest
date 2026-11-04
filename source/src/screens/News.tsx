import { useEffect } from 'react'
import type { LearnerState } from '@/engine/types'
import { Rich } from '@/ui/rich'
import { useApp, useLearner } from '@/app/context'
import { ReleaseHistory } from '@/screens/onboarding/Onboarding'
import { VersionLine } from '@/screens/onboarding/VersionCard'
import type { Settings } from '@/app/context'
import { Icon } from '@/ui/icons'
import { EmptyState } from '@/ui/primitives'

const resolved = (state: LearnerState) =>
  Object.values(state.feedback)
    .filter((f) => f.status !== 'open')
    .sort((a, b) => (b.resolvedTs ?? b.ts) - (a.resolvedTs ?? a.ts))

/** How many of her flagged questions have been looked at since she last opened this screen. (App updates are
 * announced on Today instead: see src/app/onboarding.) */
export function unseenNewsCount(state: LearnerState, settings: Settings): number {
  const since = settings.newsSeenTs ?? 0
  return resolved(state).filter((f) => (f.resolvedTs ?? 0) > since).length
}

const STATUS: Record<string, { title: string; tone: string }> = {
  fixed: { title: 'Fixed', tone: 'good' },
  'wont-fix': { title: 'Looked at', tone: 'neutral' },
  'not-a-bug': { title: 'Looked at', tone: 'neutral' },
}

export function News() {
  const { updateSettings } = useApp()
  const state = useLearner()
  const list = resolved(state)
  useEffect(() => {
    updateSettings({ newsSeenTs: Date.now() })
    // Mark as seen once on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="screen">
      <h1>What's new</h1>
      <h2 className="section">App updates</h2>
      <VersionLine />
      <ReleaseHistory />
      <h2 className="section">Because you told us</h2>
      {list.length === 0 ? (
        <EmptyState icon="flag" title="Nothing yet">
          When you flag a question and it gets fixed, you will see it here.
        </EmptyState>
      ) : (
        list.map((f) => (
          <article className="card news" key={f.id}>
            <div className="news-top">
              <span className={`pill tone-${STATUS[f.status]?.tone ?? 'neutral'}`}>{STATUS[f.status]?.title ?? f.status}</span>
              <small className="muted">{new Date(f.resolvedTs ?? f.ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</small>
            </div>
            <p className="news-q">
              <Icon name="flag" size={16} /> {f.snapshot.prompt.length > 110 ? `${f.snapshot.prompt.slice(0, 110)}...` : f.snapshot.prompt}
            </p>
            {f.note && <p className="muted">You said: "{f.note}"</p>}
            {f.resolutionNote ? (
              <p>
                <Rich text={f.resolutionNote} />
              </p>
            ) : (
              <p className="muted">{f.status === 'fixed' ? 'Thanks - this has been fixed.' : 'Thanks for flagging it.'}</p>
            )}
          </article>
        ))
      )}
    </div>
  )
}
