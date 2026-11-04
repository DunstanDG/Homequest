import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, useFamily, useLearner, useMe, useNow } from '@/app/context'
import { settingsFor } from '@/app/nav'
import { HubGroups, HubSearch } from '@/screens/More'
import { unseenNewsCount } from '@/screens/News'
import { Icon } from '@/ui/icons'
import '../../calm-nav.css'

/** Settings (/settings): setting up and looking after HomeQuest, out of the way of the everyday screens. Comfort
 * first, then the family, phones and data, and help. The entries come from nav.ts like the More hub's; most open the
 * right card in the Parent area. The same search box finds anything. */
export function SettingsHub() {
  const f = useFamily()
  const me = useMe()!
  const now = useNow(60_000)
  const { settings } = useApp()
  const news = unseenNewsCount(useLearner(), settings)
  const x = { f, me, now, news }
  const [q, setQ] = useState('')
  return (
    <div className="screen more settings-hub">
      <header className="screen-head">
        <Link to="/more" className="icon-btn" aria-label="Back to More">
          <Icon name="back" />
        </Link>
        <div className="sh-title">
          <p className="eyebrow">More</p>
          <h1>Settings</h1>
        </div>
      </header>
      <HubSearch x={x} q={q} setQ={setQ} />
      {!q.trim() && <HubGroups groups={settingsFor(x)} />}
    </div>
  )
}
