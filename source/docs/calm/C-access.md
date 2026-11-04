# C. Accessibility and "I'm overwhelmed" (0.18)

Workstream C of the calm release (see `CONTRACT.md`). Everything here is device-local except the `calm-pause` event.

## What changed

### Comfort and accessibility settings (`/settings/calm`)

`src/screens/settings/CalmSettings.tsx`. Every setting is stored through `useCalm().set()` (`settings.calm`), applies
app-wide straight away and has a live preview:

| Setting | Choices | Effect |
| --- | --- | --- |
| Text size | Normal / Large / Larger | The whole app is zoomed ×1.15 / ×1.3 |
| Font | Standard / Easy to read | Atkinson Hyperlegible, with a little more letter, word and line spacing |
| Contrast | Normal / High | Brighter text and borders, darker surfaces, a strong focus ring everywhere |
| Low stimulation | on / off | Softer, desaturated colours, no gradients, no animation or transitions, muted emoji |
| Hide ticking countdowns | on / off | Timers and sessions say "until 17:20" with a slowly draining bar |
| Celebrations | Full / Quiet / Off | Read by workstream B (`calm.celebrate`) |
| How much Today shows | One thing / Three / Everything | Read by workstream A (`calm.focus`) |

Workstream F links to it from More. `/settings/calm` is not in `FULLSCREEN` or `NO_ADD` (`nav.ts` is F's), so it
has the tab bar and the + button. F may want to add it to `NO_ADD`.

### Applied app-wide (`src/ui/calmShell.tsx`, end of `src/styles.css`)

The shell puts classes on `<html>`: `calm-zoom` + `calm-text-large|larger`, `calm-font-readable`, `calm-contrast-high`,
`calm-low-stim`, `calm-no-countdowns` (`calmClasses()` in `calm.ts`). The CSS is at the end of `styles.css` under
`C: calm and accessibility`, plus two `:root` variables (`--calm-zoom`, `--calm-focus`).

- **Text size uses CSS `zoom`**, on every child of `#root` and on sheets portalled to `<body>`. Nearly every size in
  the CSS (and the inline styles in TSX) is px, so converting to rem would have been a huge, risky diff. Zoom scales
  text, spacing and tap targets together, the way a phone's display zoom does, and the layout reflows to the narrower
  width. Chromium (and WebKit) also zoom `vh`/`vw`, so viewport-sized rules inside (sheets, `.qscreen`, the timer and
  session screens, toasts, a few lists) are divided back by `--calm-zoom`. At "Larger" a 402px phone lays out like a
  309px one: segmented controls, list rows, the Plan tab chips and the baby plan's day cards now wrap there.
- **Readable font**: `@fontsource/atkinson-hyperlegible` (the one added package). The two latin woff2 files are inlined
  into a small lazy chunk (`src/ui/calmFont.ts`, about 47 kB) and registered with `FontFace` only when someone picks it.
  It's a `.js` chunk, so the service worker precaches it and it works offline: the default precache globs don't
  include font files, and `vite.config.ts` isn't this workstream's.
- **Low stimulation** turns off every animation and transition (except the meteor game's timing, as with reduced
  motion), flattens the gradient cards, mutes elements whose class contains `emoji` (not the emoji pickers or member
  avatars) and softens the red dots.
- **Hide countdowns**: `src/ui/timers.tsx` (`MiniTimer` and `TimerScreen`) and `src/screens/plan/RunScreen.tsx` (the
  step ring) show "until 17:20" plus a `DrainBar` instead of mm:ss. Count-up timers say "since 16:40", paused ones say
  "12 min left", and an overrun step says "take your time".

### The 🌿 Calm button and sheet

The button is the first item of the tab bar (portalled into `nav.tabbar`, so it takes its own space and covers
nothing). On full-screen pages without tabs it's a small round button in the bottom-left corner, in a slim strip
kept free at the bottom so it never covers content. The timer and session screens fit above the strip. It's left off
games and the welcome tour. The sheet offers:

- **Take a breather**: one minute of paced breathing, in for 4 and out for 6, six times. It's a slowly growing and
  shrinking circle, or, when `motionOk()` says no, the steps written out with the current one highlighted.
- **Just show me one thing today**: `useCalm().pause()` (A's Today reads `paused`).
- **Pause questions and reminders for today**: writes `calm-pause` until the end of today.
- **Let a grown-up know** (children) / **Let the family know** (adults): the same event with `askHelp: true`.
- **Back to normal** (only while something is on): `resume()` and a `calm-pause` with `until: now`.
- A link to the settings.

### Synced `calm-pause` event

`{ type: 'calm-pause', memberId, until, askHelp?, helper? }` (`CalmPauseEvent` in `src/family/types.ts`), folded
latest-wins per member into `FamilyState.calmPauses` (`src/family/project.ts`). Helpers are in
`src/family/calmPause.ts`:

- `calmPauseOf(f, memberId, now)`: the pause if `until > now`, else `undefined`.
- `helpRequests(f, now, viewer)`: who is asking for help right now.
- Actions: `pauseCalm`, `helpOnIt` ("I'm on it": rewrites it with `askHelp: false, helper`), `endCalmPause`.

Workstream D's server function should treat `until > now` as "hold back pushes for this member". The family has no
TYPES set for family events (only travel has one), so nothing else needed registering.

### Banners (top of every page, `aria-live="polite"`)

- **On the parents' phones**: "Maya would like a calm moment and some help 💚", with "I'm on it" (writes the event,
  which clears it everywhere) and a dismiss (this phone only).
- **Back on the asker's phone**: "Sam is on it", for two hours, dismissible.
- **Transition warnings**: "10 minutes until we leave for School" with a slowly draining bar, at 10, 5 and 1 minutes,
  for the phone holder's next leave-by time (the home server's `travel-day` legs) or else their next timed calendar
  event, club or school event (not the everyday school block or lessons). Dismissing hides it until the next stage.
  With countdowns hidden it says "We leave for School in about 5 minutes". Pure logic and tests are in
  `src/family/transitions.ts`.

### Accessibility basics

New controls have a 3px focus ring (`--calm-focus`) and are at least 44px. The settings use real radio buttons and
switches. Banners are a polite live region, and the breathing words are announced politely.

### Testing hooks (demo only)

`?demo=1&calm=larger+readable+high+lowstim+nocount+quiet+one` sets those calm settings when the demo opens. `askhelp`
has the demo child ask for help, to preview the parents' banner. The layout audit takes this through `PERSONAS`:
`PERSONAS='1&calm=larger,maya&calm=larger'`.

## Checks run

- `npx tsc --noEmit`, `npm test` (new: `src/family/calmPause.test.ts`, `src/family/transitions.test.ts`,
  `src/app/calm.test.ts`).
- Layout audit at 402/412px for `/`, `/calendar`, `/parent?tab=family`, `/settings/calm` and `/plan`, as parent and
  child, at normal, larger, larger + readable and large + readable + high + low stimulation + no countdowns: no
  problems. The full route list at larger text was also checked and fixed.
- **Audit note for the merge:** the shared `scripts/layout-audit.cjs` treats only `fixed`/`sticky` elements as their
  own layer. The tab bar is a normal flex item, and until now it held no `<button>`. The Calm button is one, so the
  original audit reports false "overlaps" between it and page content that is scrolled out of view under the tab
  bar. With the brief's exact command, 22 of 27 checks are flagged, all of them against the Calm button. The checks above used a copy with `|| x.matches('nav.tabbar')` added to its `fixed()` helper. That one-line
  change is worth making to the shared script at merge time.

## Release notes (for `releases.ts`)

```ts
{
  id: '2026-11-04-calm-button',
  date: '2026-11-04',
  audience: 'all',
  area: 'app',
  emoji: '🌿',
  title: 'Feeling overwhelmed? Tap 🌿 Calm',
  short: 'The Calm button',
  body: 'It’s at the bottom of every screen: take a one-minute breather, have Today show just one thing, pause questions and reminders for the day, or gently let a grown-up know.',
},
{
  id: '2026-11-04-comfort-settings',
  date: '2026-11-04',
  audience: 'all',
  area: 'app',
  emoji: '🔤',
  title: 'Bigger text, an easy-to-read font and calmer colours',
  short: 'Comfort settings',
  body: 'Comfort and accessibility settings let you make everything bigger, switch to a font made for dyslexia, turn up the contrast, calm the colours and movement, and swap ticking countdowns for “until 17:20”.',
  to: '/settings/calm',
},
{
  id: '2026-11-04-transition-warnings',
  date: '2026-11-04',
  audience: 'all',
  area: 'today',
  emoji: '🎒',
  title: 'A gentle heads-up before it’s time to go',
  short: 'Heads-up before leaving',
  body: 'Ten, five and one minute before you need to leave, or before your next thing starts, a calm banner with a slowly emptying bar lets you know.',
},
```
