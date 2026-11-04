import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, useFamily, useLearner, useMe, useNow } from '@/app/context'
import { GROUPS, hubFor, searchFeatures, type Feature, type FeatureCtx, type GroupId } from '@/app/nav'
import { unseenNewsCount } from '@/screens/News'
import { Icon } from '@/ui/icons'
import { SyncDot } from '@/ui/ux'
import '../calm-nav.css'

/** One entry: emoji, label and what it's for, a count when something is waiting, and a chevron. */
export function HubRow({ it, where }: { it: Feature & { count: number }; where?: string }) {
  return (
    <li>
      <Link to={it.to}>
        <span className="hub-emoji" aria-hidden="true">
          {it.emoji}
        </span>
        <span className="grow">
          <strong>{it.label}</strong>
          <small>{it.desc}</small>
          {where && <span className="hub-where">{where}</span>}
        </span>
        {it.count > 0 && (
          <span className="hub-count">
            {it.count > 99 ? '99+' : it.count}
            <span className="lq-sr"> waiting</span>
          </span>
        )}
        <Icon name="chevron" size={16} />
      </Link>
    </li>
  )
}

/** Groups of entries with their headings, always in the order nav.ts gives. */
export function HubGroups({ groups }: { groups: { group: GroupId; items: (Feature & { count: number })[] }[] }) {
  return (
    <>
      {groups.map(({ group, items }) => (
        <section key={group} className="hub-group" aria-labelledby={`hub-${group}`}>
          <h2 className="section" id={`hub-${group}`}>
            {GROUPS[group].title}
          </h2>
          {GROUPS[group].sub && <p className="note sec-sub">{GROUPS[group].sub}</p>}
          <ul className="needs-list hub-list">
            {items.map((it) => (
              <HubRow key={it.id} it={it} />
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}

/** The search box: finds any destination (including the ones in Settings or on a tab) by label and description. */
export function HubSearch({ x, q, setQ }: { x: FeatureCtx; q: string; setQ: (q: string) => void }) {
  const hits = q.trim() ? searchFeatures(x, q) : []
  return (
    <>
      <div className="hub-search" role="search">
        <span className="hub-search-ic" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M15.5 15.5 21 21" />
          </svg>
        </span>
        <input type="search" className="tbox" placeholder="Find anything" aria-label="Find anything in HomeQuest" value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" autoComplete="off" />
        {q && (
          <button type="button" className="icon-btn small hub-search-clear" aria-label="Clear the search" onClick={() => setQ('')}>
            <Icon name="x" size={16} />
          </button>
        )}
      </div>
      {q.trim() &&
        (hits.length ? (
          <section className="hub-group" aria-label="Found">
            <ul className="needs-list hub-list">
              {hits.map((it) => (
                <HubRow key={it.id} it={it} where={it.where} />
              ))}
            </ul>
          </section>
        ) : (
          <p className="empty-note">Nothing called that. Want to try another word?</p>
        ))}
    </>
  )
}

/** More: a short list of the places that aren't on a tab, in fixed groups, with Settings at the end and a search box
 * that finds everything else. The contextual cards on Today are shortcuts; this is where everything can be found. */
export function More() {
  const f = useFamily()
  const me = useMe()!
  const now = useNow(60_000)
  const { settings } = useApp()
  const news = unseenNewsCount(useLearner(), settings)
  const x = { f, me, now, news }
  const [q, setQ] = useState('')
  return (
    <div className="screen more">
      <header className="screen-head">
        <div className="sh-title">
          <p className="eyebrow">{f.name || 'HomeQuest'}</p>
          <h1>More</h1>
        </div>
        <div className="head-actions">
          <SyncDot />
        </div>
      </header>
      <HubSearch x={x} q={q} setQ={setQ} />
      {!q.trim() && <HubGroups groups={hubFor(x)} />}
    </div>
  )
}
