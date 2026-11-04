// Layout audit: opens every screen (and the add/edit sheets on it) in demo mode at iPhone 16 Pro, Pixel 8a and
// Pixel 9 sizes, and reports sideways scrolling, content past the screen edge, and overlapping controls.
// Run against a built app:  npm run build && npx vite preview --port 4173 &  then  npm run audit:layout
// Needs Playwright with Chromium (not a project dependency). Options: BASE, ROUTES, PERSONAS, SHEETS=0, SHOTS=1, OUT.
// Chromium only: it matches the phones' sizes, not Safari's own rendering, so still check a new screen on the iPhone.
const { chromium } = require('playwright')
const BASE = process.env.BASE || 'http://localhost:4173/'
const OUT = process.env.OUT || require('os').tmpdir()
const SHOTS = process.env.SHOTS === '1'
const DEVICES = [
  { name: 'iPhone 16 Pro', viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' },
  { name: 'Pixel 8a', viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 8a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' },
  { name: 'Pixel 9', viewport: { width: 412, height: 923 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' },
]
const ROUTES = (process.env.ROUTES || [
  '/', '/calendar', '/calendar?v=plans', '/plan', '/plan?t=dump', '/plan?t=meals', '/plan?t=projects', '/plan?t=sessions', '/plan?t=shop',
  '/house/rooms', '/care', '/care?s=plants', '/vault', '/summit', '/round-table', '/baby', '/school', '/travel', '/assistant', '/shop',
  '/learn', '/spelling', '/skills', '/rewards', '/news', '/more',
  '/parent?tab=approvals', '/parent?tab=progress', '/parent?tab=family', '/parent?tab=data',
].join(',')).split(',')
const PERSONAS = (process.env.PERSONAS || '1,maya').split(',')

async function unlock(page) {
  // Parent PIN gate: in demo there is no PIN yet, so set one (type it, confirm it).
  for (let round = 0; round < 3; round++) {
    const key = page.locator('.gate button').filter({ hasText: /^1$/ })
    if (!(await key.count())) return
    for (const d of ['1', '2', '3', '4']) await page.locator('.gate button').filter({ hasText: new RegExp(`^${d}$`) }).first().click()
    await page.waitForTimeout(250)
  }
}

async function measure(page) {
  return page.evaluate(() => {
    // Rows built to scroll sideways on purpose (chip pickers, tab strips).
    const SCROLL_ROWS = '.subject-chips, .scroll-chips, .tabs, .ptabs, .welcome-track'
    const vw = document.documentElement.clientWidth
    const out = { scrollW: document.documentElement.scrollWidth, bodyScrollW: document.body.scrollWidth, vw, past: [], overlaps: [], spill: [] }
    const visible = (el) => {
      const r = el.getBoundingClientRect()
      if (r.width < 1 || r.height < 1) return false
      const cs = getComputedStyle(el)
      return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05
    }
    const desc = (el) => {
      let s = el.tagName.toLowerCase()
      if (el.id) s += '#' + el.id
      if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
      const p = el.parentElement
      let ps = p ? p.tagName.toLowerCase() + (p.className && typeof p.className === 'string' ? '.' + p.className.trim().split(/\s+/).slice(0, 2).join('.') : '') : ''
      const t = (el.innerText || el.value || el.getAttribute('aria-label') || el.placeholder || '').trim().replace(/\s+/g, ' ').slice(0, 50)
      return `${ps} > ${s}${t ? ` "${t}"` : ''}`
    }
    // Is el inside an ancestor that scrolls/clips horizontally (a deliberate scroller like a chip row)?
    const clipped = (el) => {
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const cs = getComputedStyle(a), ox = cs.overflowX
        // A vertical scroller (.app-body, .sheet) also scrolls sideways when its content is too wide: that's the bug,
        // so it doesn't count as a deliberate horizontal scroller.
        if (a.matches(SCROLL_ROWS)) return true
        if (cs.overflowY === 'auto' || cs.overflowY === 'scroll') continue
        if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') {
          const r = a.getBoundingClientRect()
          if (r.right <= vw + 1 && r.left >= -1) return true
        }
      }
      return false
    }
    const all = [...document.querySelectorAll('body *')].filter((e) => !['SCRIPT', 'STYLE', 'svg', 'path', 'BR'].includes(e.tagName) && !(e instanceof SVGElement && e.tagName !== 'svg'))
    const seen = new Set()
    out.scrollers = []
    for (const el of all) {
      const cs = getComputedStyle(el)
      if (el.matches(SCROLL_ROWS)) continue
      if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollWidth > el.clientWidth + 1 && visible(el))
        out.scrollers.push(`${desc(el).slice(0, 80)} (${el.scrollWidth}>${el.clientWidth})`)
    }
    for (const el of all) {
      if (!visible(el)) continue
      const r = el.getBoundingClientRect()
      if ((r.right > vw + 1 || r.left < -1) && !clipped(el)) {
        // Report only the outermost offender.
        let a = el.parentElement, parentAlso = false
        while (a && a !== document.body) { const pr = a.getBoundingClientRect(); if ((pr.right > vw + 1 || pr.left < -1) && !clipped(a)) { parentAlso = true; break } a = a.parentElement }
        if (!parentAlso && !seen.has(el)) { seen.add(el); out.past.push(`${desc(el)} [${Math.round(r.left)}..${Math.round(r.right)}]`) }
      }
    }
    // Overlaps between interactive controls and text labels that aren't nested in each other.
    const items = [...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea, button, a.btn, label > span, label > strong, .sr-main > strong, .sr-main > small, input.switch, h1, h2, h3')]
      .filter((e) => visible(e) && !e.closest('[aria-hidden="true"]') && !e.classList.contains('sheet-backdrop'))
    const rects = items.map((e) => e.getBoundingClientRect())
    for (let i = 0; i < items.length; i++)
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i], b = items[j]
        if (a.contains(b) || b.contains(a)) continue
        const A = rects[i], B = rects[j]
        const w = Math.min(A.right, B.right) - Math.max(A.left, B.left), h = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top)
        if (w > 3 && h > 3) {
          // Ignore elements stacked in different fixed layers (e.g. bottom nav over content).
          const fixed = (e) => { for (let x = e; x; x = x.parentElement) { const p = getComputedStyle(x).position; if (p === 'fixed' || p === 'sticky') return x } return null }
          if (fixed(a) !== fixed(b)) continue
          out.overlaps.push(`${desc(a)}  ⟷  ${desc(b)} (${Math.round(w)}x${Math.round(h)})`)
        }
      }
    // Text spilling out of fixed-width boxes (e.g. button labels wider than the button).
    for (const el of document.querySelectorAll('button, .chip, .tbox, select, .seg-btn, .ptab, .tab')) {
      if (!visible(el)) continue
      if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflowX === 'visible' && el.tagName !== 'INPUT') out.spill.push(`${desc(el)} (${el.scrollWidth}>${el.clientWidth})`)
    }
    return out
  })
}

;(async () => {
  const browser = await chromium.launch()
  const report = []
  for (const dev of DEVICES) {
    for (const who of PERSONAS) {
      const ctx = await browser.newContext({ viewport: dev.viewport, deviceScaleFactor: SHOTS ? dev.deviceScaleFactor : 1, isMobile: dev.isMobile, hasTouch: dev.hasTouch, userAgent: dev.userAgent })
      const page = await ctx.newPage()
      const errors = []
      page.on('pageerror', (e) => errors.push(String(e)))
      for (const route of ROUTES) {
        if (who !== '1' && route.startsWith('/parent')) continue
        await page.goto(`${BASE}?demo=${who}#${route}`, { waitUntil: 'networkidle' }).catch(() => {})
        await page.waitForTimeout(500)
        if (route.startsWith('/parent')) { await unlock(page); await page.waitForTimeout(300) }
        // Open every collapsible so its contents get checked too.
        await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)))
        await page.waitForTimeout(150)
        const m = await measure(page)
        if (process.env.SHEETS !== '0') {
          const opener = /^(\+ ?)?(add|new|edit|set up|change|plan|choose|manage|event|idea|item|place|trip|alarm|room|job|meal|task|reward|treat|goal)\b|^\+$/i
          const labels = await page.evaluate((src) => {
            const re = new RegExp(src, 'i')
            return [...document.querySelectorAll('.app-body button')].filter((b) => b.offsetParent && re.test((b.innerText || b.getAttribute('aria-label') || '').trim())).map((b) => (b.innerText || b.getAttribute('aria-label')).trim()).filter((v, i, a) => a.indexOf(v) === i).slice(0, 14)
          }, opener.source)
          for (const label of labels) {
            const btn = page.locator('.app-body button').filter({ hasText: label }).first()
            if (!(await btn.count())) continue
            await btn.click({ timeout: 1500 }).catch(() => {})
            await page.waitForTimeout(350)
            if (await page.locator('.sheet').count()) {
              await page.evaluate(() => document.querySelectorAll('.sheet details').forEach((d) => (d.open = true)))
              const sm = await measure(page)
              if (sm.scrollers.length || sm.past.length || sm.overlaps.length || sm.spill.length) {
                const tag = (x) => x.map((v) => `[sheet "${label}"] ${v}`)
                m.scrollers.push(...tag(sm.scrollers)); m.past.push(...tag(sm.past)); m.overlaps.push(...tag(sm.overlaps)); m.spill.push(...tag(sm.spill))
              }
            }
            await page.goto(`${BASE}?demo=${who}#${route}`, { waitUntil: 'networkidle' }).catch(() => {})
            await page.waitForTimeout(300)
            if (route.startsWith('/parent')) await unlock(page)
          }
        }
        const issues = m.scrollers.length + m.past.length + m.overlaps.length + m.spill.length + (m.scrollW > m.vw + 1 ? 1 : 0)
        report.push({ device: dev.name, who, route, ...m, errors: [...errors] })
        errors.length = 0
        if (SHOTS && issues) await page.screenshot({ path: `${OUT}/shot-${dev.name.replace(/\W/g, '')}-${who}-${route.replace(/\W/g, '_')}.png`, fullPage: true })
      }
      await ctx.close()
    }
  }
  await browser.close()
  require('fs').writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1))
  for (const r of report) {
    const n = r.past.length + r.overlaps.length + r.spill.length + r.scrollers.length
    if (!n && r.scrollW <= r.vw + 1 && !r.errors.length) continue
    console.log(`\n## ${r.device} · demo=${r.who} · ${r.route}${r.scrollW > r.vw + 1 ? `  SIDEWAYS SCROLL ${r.scrollW}>${r.vw}` : ''}`)
    for (const x of r.scrollers) console.log('  SIDEWAYS: ', x)
    for (const x of r.past.slice(0, 12)) console.log('  past edge:', x)
    for (const x of r.overlaps.slice(0, 12)) console.log('  overlap:  ', x)
    for (const x of r.spill.slice(0, 8)) console.log('  spill:    ', x)
    for (const x of r.errors.slice(0, 3)) console.log('  ERROR:    ', x)
  }
  const bad = report.filter((r) => r.scrollers.length || r.past.length || r.overlaps.length || r.spill.length || r.scrollW > r.vw + 1)
  console.log(`\n${bad.length} of ${report.length} screen checks have problems`)
  process.exitCode = bad.length ? 1 : 0
})()
