import { Link } from 'react-router-dom'
import { useApp, useFamily, useLearner, useMe, useNow } from '@/app/context'
import { GROUPS, hubFor } from '@/app/nav'
import { unseenNewsCount } from '@/screens/News'
import { Icon } from '@/ui/icons'
import { SyncDot } from '@/ui/ux'

/** More: every feature in HomeQuest, grouped by what it's for, with a count where something is waiting. The
 * contextual cards on Today are shortcuts; this is the place everything can always be found. */
export function More() {
  const f = useFamily()
  const me = useMe()!
  const now = useNow(60_000)
  const { settings } = useApp()
  const news = unseenNewsCount(useLearner(), settings)
  const groups = hubFor({ f, me, now, news })
  return (
    <div className="screen more">
      <header className="screen-head">
        <div className="sh-title">
          <p className="eyebrow">{f.name || 'HomeQuest'}</p>
          <h1>Everything</h1>
        </div>
        <div className="head-actions">
          <SyncDot />
        </div>
      </header>
      {groups.map(({ group, items }) => (
        <section key={group} className="hub-group" aria-labelledby={`hub-${group}`}>
          <h2 className="section" id={`hub-${group}`}>
            {GROUPS[group].title}
          </h2>
          {GROUPS[group].sub && <p className="note sec-sub">{GROUPS[group].sub}</p>}
          <ul className="needs-list hub-list">
            {items.map((it) => (
              <li key={it.id}>
                <Link to={it.to}>
                  <span className="hub-emoji" aria-hidden="true">
                    {it.emoji}
                  </span>
                  <span className="grow">
                    <strong>{it.label}</strong>
                    <small>{it.desc}</small>
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
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
