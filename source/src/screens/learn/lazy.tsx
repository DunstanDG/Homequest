import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'

/** Route elements for the StudyQuest (Learn) screens, loaded on first visit so their code (games, question UI,
 * spelling lists, figures) stays out of the app-shell chunk that Today/Calendar/Plan/Care need at startup.
 * Use these in App.tsx in place of the eager screen imports. */

const fallback = (
  <div className="boot lq-loading">
    <div className="spinner" aria-label="Loading" />
  </div>
)

function route(Comp: LazyExoticComponent<ComponentType>) {
  return function LazyRoute() {
    return (
      <Suspense fallback={fallback}>
        <Comp />
      </Suspense>
    )
  }
}

/** After a new version is deployed, a phone still running the old page asks for chunk files that no longer exist.
 * Reload once to pick up the new version instead of showing an error (the flag stops a reload loop). */
function load<T>(f: () => Promise<T>): () => Promise<T> {
  return () =>
    f().then(
      (m) => {
        try {
          sessionStorage.removeItem('hq.chunk-reload')
        } catch {
          /* fine */
        }
        return m
      },
      (e: unknown) => {
        let tried = true
        try {
          tried = sessionStorage.getItem('hq.chunk-reload') === '1'
          if (!tried) sessionStorage.setItem('hq.chunk-reload', '1')
        } catch {
          /* no storage: don't risk a loop */
        }
        if (!tried) {
          location.reload()
          return new Promise<T>(() => {})
        }
        throw e
      },
    )
}

export const LearnHome = route(lazy(load(() => import('@/screens/Home').then((m) => ({ default: m.Home })))))
export const LearnSkillMap = route(lazy(load(() => import('@/screens/SkillMap').then((m) => ({ default: m.SkillMap })))))
export const LearnPlay = route(lazy(load(() => import('@/screens/Play').then((m) => ({ default: m.Play })))))
export const LearnRewards = route(lazy(load(() => import('@/screens/Rewards').then((m) => ({ default: m.Rewards })))))
export const LearnSpelling = route(lazy(load(() => import('@/screens/spelling/Spelling').then((m) => ({ default: m.Spelling })))))
export const LearnSpellingPlay = route(lazy(load(() => import('@/screens/spelling/SpellingPlay').then((m) => ({ default: m.SpellingPlay })))))
