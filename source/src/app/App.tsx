import { useEffect, useRef, useState } from 'react'
import { HashRouter, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useCalendarReminders } from './calendarReminders'
import { useAutoCloseAbandonedFeeds } from './feedRunAutoClose'
import { useFeedRunPushNotifications } from './feedRunNotify'
import { useCheckinReminders } from './checkinReminders'
import { useHomeworkAlerts } from './homeworkAlerts'
import { useApp, useFamily, useLearner, useMe, useNow } from './context'
import { Icon } from '@/ui/icons'
import { More } from '@/screens/More'
import { activeTab, FULLSCREEN, hubHasNews, isUnder, NO_ADD, roleOf, tabsFor } from './nav'
import { ErrorBoundary } from './ErrorBoundary'
import { TimerScreen } from '@/ui/timers'
import { Gallery } from '@/screens/Gallery'
import { News, unseenNewsCount } from '@/screens/News'
import { Parent } from '@/screens/parent'
import { Calendar } from '@/screens/family/Calendar'
import { Baby } from '@/screens/family/Baby'
import { Care } from '@/screens/family/Care'
import { Summit } from '@/screens/family/Summit'
import { RoundTable } from '@/screens/family/RoundTable'
import { Vault } from '@/screens/family/Vault'
import { School } from '@/screens/family/School'
import { Travel } from '@/screens/family/Travel'
import { Assistant } from '@/screens/family/Assistant'
import { RingingBanner, useServiceWorkerNavigate } from '@/screens/family/travelParts'
import { Shop } from '@/screens/family/Shop'
import { Fetching, Start } from '@/screens/family/Start'
import { Today } from '@/screens/family/Today'
import { Plan } from '@/screens/plan/Plan'
import { RunScreen } from '@/screens/plan/RunScreen'
import { HouseCatalog } from '@/screens/house/HouseCatalog'
import { CheckIn } from '@/screens/checkin/CheckIn'
import { HouseRun } from '@/screens/house/HouseRun'
import { HouseStart } from '@/screens/house/HouseStart'
import { ProjectScreen } from '@/screens/plan/ProjectScreen'
import { PlanAThing } from '@/screens/plan/PlanAThing'
import { LearnHome, LearnPlay, LearnRewards, LearnSkillMap, LearnSpelling, LearnSpellingPlay } from '@/screens/learn/lazy'
import { QuickAdd } from './QuickAdd'
import { useAppNightMode } from './night'
import { ensureOnboard, useOnboard } from './onboarding/store'
import { useQuietUpdate } from './update'
import { ALL_NOTE_IDS, Welcome } from '@/screens/onboarding/Onboarding'

function Shell({ newPerson }: { newPerson: boolean }) {
  const { pathname } = useLocation()
  const nav = useNavigate()
  const me = useMe()!
  const { demo } = useApp()
  const { settings } = useApp()
  const f = useFamily()
  const state = useLearner()
  useCalendarReminders()
  useFeedRunPushNotifications()
  useAutoCloseAbandonedFeeds()
  useHomeworkAlerts()
  useCheckinReminders()
  useAppNightMode()
  useServiceWorkerNavigate()
  useQuietUpdate(f, me.id)
  // First time this person opens the app on this phone: someone just set up or joined gets the welcome tour.
  useEffect(() => ensureOnboard(me.id, newPerson && !demo, ALL_NOTE_IDS), [me.id, newPerson, demo])
  const ob = useOnboard(me.id)
  useEffect(() => {
    if (ob.tourPending && pathname !== '/welcome') nav('/welcome', { replace: true })
  }, [ob.tourPending, pathname, nav])
  const now = useNow(60_000)
  const hideTabs = FULLSCREEN.some((p) => isUnder(pathname, p))
  const news = unseenNewsCount(state, settings)
  const tabs = tabsFor(roleOf(me))
  const current = activeTab(tabs, pathname)
  const moreDot = hubHasNews({ f, me, now, news })
  const showAdd = !hideTabs && !NO_ADD.some((p) => isUnder(pathname, p))
  return (
    <>
      <RingingBanner />
      <div className={`app-body${hideTabs ? ' no-tabs' : ''}${showAdd ? ' has-fab' : ''}`}>
        <ErrorBoundary resetKey={pathname}>
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/run/:id" element={<RunScreen />} />
            <Route path="/house/start/:typeId" element={<HouseStart />} />
            <Route path="/house/run/:id" element={<HouseRun />} />
            <Route path="/checkin/:part" element={<CheckIn />} />
            <Route path="/house/rooms" element={<HouseCatalog />} />
            <Route path="/project/:id" element={<ProjectScreen />} />
            <Route path="/plan/new-thing" element={<PlanAThing />} />
            <Route path="/together" element={<Navigate to="/calendar?v=plans" replace />} />
            <Route path="/care" element={<Care />} />
            <Route path="/vault" element={<Vault />} />
            <Route path="/summit" element={<Summit />} />
            <Route path="/round-table" element={<RoundTable />} />
            <Route path="/baby" element={<Baby />} />
            <Route path="/school" element={<School />} />
            <Route path="/travel" element={<Travel />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/timer/:id" element={<TimerScreen />} />
            <Route path="/learn" element={<LearnHome />} />
            <Route path="/spelling" element={<LearnSpelling />} />
            <Route path="/spelling/play" element={<LearnSpellingPlay />} />
            <Route path="/skills" element={<LearnSkillMap />} />
            <Route path="/rewards" element={<LearnRewards />} />
            <Route path="/news" element={<News />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/play/:gameId" element={<LearnPlay />} />
            <Route path="/parent" element={<Parent />} />
            <Route path="/more" element={<More />} />
            {import.meta.env.DEV && <Route path="/dev" element={<Gallery />} />}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </div>
      {showAdd && <QuickAdd />}
      {!hideTabs && (
        <nav className="tabbar" aria-label="Main">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.to === '/'} className={() => `tabbar-item${current === t.to ? ' active' : ''}`} aria-current={current === t.to ? 'page' : undefined}>
              <span className="tab-ic">
                <Icon name={t.icon} size={24} />
                {t.to === '/more' && moreDot && <i className="dot" />}
                {t.to === '/learn' && news > 0 && <i className="dot" />}
              </span>
              <span>{t.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </>
  )
}

export function App() {
  const { repo, sync } = useApp()
  const f = useFamily()
  const me = useMe()
  const [skipFetch, setSkipFetch] = useState(false)
  // Did this session start on the set-up screens? Then whoever comes out of them is new on this phone.
  const sawStart = useRef(false)
  if (!me) {
    sawStart.current = true
    const seenAnyone = Object.keys(f.members).length > 0 || repo.allEvents().some((e) => e.type === 'profile')
    if (!seenAnyone && sync.config() && !skipFetch) return <Fetching onSkip={() => setSkipFetch(true)} />
    return <Start />
  }
  return (
    <HashRouter>
      <Shell newPerson={sawStart.current} />
    </HashRouter>
  )
}
