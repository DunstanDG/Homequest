import { createRoot } from 'react-dom/client'
import { startUpdates } from './update'
import { registry } from '@/content'
import { App } from './App'
import { AppProvider } from './context'
import '../styles.css'
import '../family.css'
import '../plan.css'
import '../house.css'
import '../care.css'
import '../ux.css'
import '../ux-shop.css'
import '../ux-cal.css'
import '../ux-learn.css'
import '../travel.css'

startUpdates()
// "Update now" loads the app from a fresh address (see forceUpdate); tidy it away once loaded.
if (new URLSearchParams(location.search).has('fresh')) {
  const u = new URL(location.href)
  u.searchParams.delete('fresh')
  history.replaceState(null, '', u.pathname + u.search + u.hash)
}
// iOS home-screen apps report themselves here (older iOS doesn't match the display-mode media query): see #root in
// styles.css.
if ((navigator as Navigator & { standalone?: boolean }).standalone) document.documentElement.classList.add('standalone')

createRoot(document.getElementById('root') as HTMLElement).render(
  <AppProvider registry={registry} demo={new URLSearchParams(location.search).has('demo')}>
    <App />
  </AppProvider>,
)
